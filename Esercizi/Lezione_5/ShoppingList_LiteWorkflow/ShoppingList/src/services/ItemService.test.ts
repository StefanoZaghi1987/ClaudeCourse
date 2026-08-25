import { describe, it, expect } from 'vitest';
import {
  ShoppingListDB,
  ListsDB,
  ItemsDB,
  ArticlesDB,
  SharesDB,
} from '@db';
import { EventBus } from '@utils/events';
import { createSyncLogger } from './sync-logger';
import { ItemService } from './ItemService';
import { ForbiddenError, NotFoundError } from './errors';

async function setup() {
  const db = new ShoppingListDB();
  await db.delete();
  await db.open();
  const lists = new ListsDB(db.lists);
  const items = new ItemsDB(db.items);
  const articles = new ArticlesDB(db.articles);
  const shares = new SharesDB(db.shares);
  const events = new EventBus();
  const logSync = createSyncLogger(db);
  const svc = new ItemService({
    db,
    items,
    lists,
    articles,
    shares,
    events,
    logSync,
  });
  return { db, svc, events, lists, items, articles, shares };
}

describe('ItemService.getItemsByListId', () => {
  it('returns non-deleted items ordered checked ASC then order ASC, joined with articles', async () => {
    const { svc, lists, items, articles } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const art = await articles.create({ name: 'Pane', createdBy: 'u' });

    const i1 = await items.create({
      listId: list.id,
      articleId: art.id,
      quantity: 1,
      createdBy: 'u',
    });
    const i2 = await items.create({
      listId: list.id,
      quantity: 2,
      customName: 'Custom',
      createdBy: 'u',
    });
    await items.toggleChecked(i1.id, 'u');

    const result = await svc.getItemsByListId(list.id);
    // non-checked comes first
    expect(result.map((x) => x.id)).toEqual([i2.id, i1.id]);
    const panino = result.find((x) => x.id === i1.id);
    expect(panino?.article?.name).toBe('Pane');
  });
});

describe('ItemService.addItem (ramo A — articleId)', () => {
  it('uses existing article, increments usageCount, no article:created event', async () => {
    const { svc, lists, articles, db, events } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const art = await articles.create({ name: 'Pane', createdBy: 'u' });

    const recorded: Array<{ type: string; data: unknown }> = [];
    events.on('item:added', (d) =>
      recorded.push({ type: 'item:added', data: d }),
    );
    events.on('article:created', (d) =>
      recorded.push({ type: 'article:created', data: d }),
    );

    // commit-before-emit ordering assertion: when the event fires, the
    // item row and its syncLog entry must already be durably committed.
    // Mirrors the closure-capture pattern used in ShareService/ArticleService
    // tests — the listener itself reads real Dexie counts and resolves a
    // snapshot promise, so we prove the ordering (not just that the listener
    // fired).
    const snapshotAtEmit = new Promise<{ items: number; logs: number }>(
      (resolve) => {
        events.on('item:added', () => {
          void (async () => {
            const itemsCount = await db.items.count();
            const logsCount = await db.syncLog.count();
            resolve({ items: itemsCount, logs: logsCount });
          })();
        });
      },
    );

    const item = await svc.addItem(
      { listId: list.id, articleId: art.id, quantity: 2, createdBy: 'u' },
      'u',
    );

    // Commit-before-emit: by the time the listener ran, both the item and
    // its syncLog entry were already visible in IndexedDB.
    const snapshot = await snapshotAtEmit;
    expect(snapshot.items).toBe(1);
    expect(snapshot.logs).toBe(1);
    expect(await db.items.count()).toBe(1);
    expect(await db.syncLog.count()).toBe(1);

    expect(item.articleId).toBe(art.id);
    const updatedArt = await db.articles.get(art.id);
    expect(updatedArt?.usageCount).toBe(1);

    const logs = await db.syncLog.where({ entityId: item.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('create');
    expect(logs[0]?.entityType).toBe('item');
    // no article log (incrementUsage doesn't log)
    const artLogs = await db.syncLog.where({ entityId: art.id }).toArray();
    expect(artLogs).toHaveLength(0);

    expect(recorded).toEqual([{ type: 'item:added', data: { item } }]);
  });

  it('reader cannot add', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'owner' });
    await db.shares.add({
      id: 'sh',
      listId: list.id,
      userId: 'alice',
      permission: 'read',
      createdAt: Date.now(),
      createdBy: 'owner',
      acceptedAt: Date.now(),
      version: 1,
    });
    await expect(
      svc.addItem(
        { listId: list.id, quantity: 1, customName: 'x', createdBy: 'alice' },
        'alice',
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('writer-accepted can add', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'owner' });
    await db.shares.add({
      id: 'sh',
      listId: list.id,
      userId: 'bob',
      permission: 'write',
      createdAt: Date.now(),
      createdBy: 'owner',
      acceptedAt: Date.now(),
      version: 1,
    });
    const item = await svc.addItem(
      { listId: list.id, quantity: 1, customName: 'x', createdBy: 'bob' },
      'bob',
    );
    expect(item.id).toBeDefined();
  });
});

describe('ItemService.addItem (ramo B — save custom to catalog)', () => {
  it('creates Article, logs article + item, emits article:created then item:added', async () => {
    const { svc, lists, db, events } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });

    const recorded: Array<{ type: string }> = [];
    events.on('article:created', () =>
      recorded.push({ type: 'article:created' }),
    );
    events.on('item:added', () => recorded.push({ type: 'item:added' }));

    const item = await svc.addItem(
      {
        listId: list.id,
        customName: 'Pane Custom',
        quantity: 1,
        createdBy: 'u',
        saveToDatabase: true,
      },
      'u',
    );

    expect(item.articleId).toBeDefined();
    const art = await db.articles.get(item.articleId!);
    expect(art?.name).toBe('Pane Custom');

    const artLogs = await db.syncLog.where({ entityId: item.articleId! }).toArray();
    expect(artLogs).toHaveLength(1);
    expect(artLogs[0]?.action).toBe('create');
    expect(artLogs[0]?.entityType).toBe('article');

    const itemLogs = await db.syncLog.where({ entityId: item.id }).toArray();
    expect(itemLogs).toHaveLength(1);
    expect(itemLogs[0]?.entityType).toBe('item');

    expect(recorded.map((r) => r.type)).toEqual(['article:created', 'item:added']);
  });
});

describe('ItemService.addItem (ramo C — customName only, no catalog)', () => {
  it('stores customName on item, leaves articleId undefined, no article created', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const item = await svc.addItem(
      { listId: list.id, customName: 'One Off', quantity: 1, createdBy: 'u' },
      'u',
    );
    expect(item.articleId).toBeUndefined();
    expect(item.customName).toBe('One Off');
    expect(await db.articles.count()).toBe(0);
  });
});

describe('ItemService.updateItem', () => {
  it('owner updates quantity, writes logSync, emits item:updated', async () => {
    const { svc, lists, items, db, events } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'owner' });
    const item = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'Pane',
      createdBy: 'owner',
    });

    const recorded: unknown[] = [];
    events.on('item:updated', (d) => recorded.push(d));

    await svc.updateItem(item.id, { quantity: 5 }, 'owner');

    const stored = await db.items.get(item.id);
    expect(stored?.quantity).toBe(5);

    const logs = await db.syncLog.where({ entityId: item.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('update');
    expect(logs[0]?.payload).toMatchObject({ quantity: 5 });
    expect(recorded).toHaveLength(1);
  });

  it('throws NotFoundError if item missing', async () => {
    const { svc } = await setup();
    await expect(
      svc.updateItem('missing', { quantity: 1 }, 'u'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('reader cannot update', async () => {
    const { svc, lists, items, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'owner' });
    const item = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'Pane',
      createdBy: 'owner',
    });
    await db.shares.add({
      id: 'sh',
      listId: list.id,
      userId: 'alice',
      permission: 'read',
      createdAt: Date.now(),
      createdBy: 'owner',
      acceptedAt: Date.now(),
      version: 1,
    });
    await expect(
      svc.updateItem(item.id, { quantity: 5 }, 'alice'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('ItemService.toggleChecked', () => {
  it('toggles item from unchecked to checked, emits item:checked', async () => {
    const { svc, lists, items, db, events } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const item = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'Pane',
      createdBy: 'u',
    });
    const recorded: unknown[] = [];
    events.on('item:checked', (d) => recorded.push(d));

    await svc.toggleChecked(item.id, 'u');

    const stored = await db.items.get(item.id);
    expect(stored?.checked).toBe(true);
    expect(stored?.checkedAt).toBeDefined();
    expect(stored?.checkedBy).toBe('u');
    expect(recorded).toEqual([{ itemId: item.id, checked: true, userId: 'u' }]);

    const logs = await db.syncLog.where({ entityId: item.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('update');
    expect(logs[0]?.payload).toMatchObject({ checked: true });
  });

  it('toggles back from checked to unchecked, clearing checkedAt/By', async () => {
    const { svc, lists, items, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const item = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'Pane',
      createdBy: 'u',
    });
    await svc.toggleChecked(item.id, 'u');
    await svc.toggleChecked(item.id, 'u');
    const stored = await db.items.get(item.id);
    expect(stored?.checked).toBe(false);
    expect(stored?.checkedAt).toBeUndefined();
    expect(stored?.checkedBy).toBeUndefined();
  });
});

describe('ItemService.deleteItem', () => {
  it('soft-deletes and emits', async () => {
    const { svc, lists, items, db, events } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const item = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'X',
      createdBy: 'u',
    });
    const recorded: unknown[] = [];
    events.on('item:deleted', (d) => recorded.push(d));

    await svc.deleteItem(item.id, 'u');

    const stored = await db.items.get(item.id);
    expect(stored?.deletedAt).toBeDefined();

    const logs = await db.syncLog.where({ entityId: item.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('delete');
    expect(recorded).toEqual([{ itemId: item.id }]);
  });

  it('reader cannot delete', async () => {
    const { svc, lists, items, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'owner' });
    const item = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'X',
      createdBy: 'owner',
    });
    await db.shares.add({
      id: 'sh',
      listId: list.id,
      userId: 'alice',
      permission: 'read',
      createdAt: Date.now(),
      createdBy: 'owner',
      acceptedAt: Date.now(),
      version: 1,
    });
    await expect(svc.deleteItem(item.id, 'alice')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe('ItemService.reorderItems', () => {
  it('rewrites order field by array position; single aggregate logSync on list', async () => {
    const { svc, lists, items, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const a = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'A',
      createdBy: 'u',
    });
    const b = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'B',
      createdBy: 'u',
    });
    const c = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'C',
      createdBy: 'u',
    });

    await svc.reorderItems(list.id, [c.id, a.id, b.id], 'u');

    const after = await db.items.where('listId').equals(list.id).toArray();
    const orderById = Object.fromEntries(after.map((i) => [i.id, i.order]));
    expect(orderById[c.id]).toBeLessThan(orderById[a.id]!);
    expect(orderById[a.id]).toBeLessThan(orderById[b.id]!);

    const logs = await db.syncLog.where({ entityId: list.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('update');
    expect(logs[0]?.entityType).toBe('list');
    expect(logs[0]?.payload).toMatchObject({ itemOrder: [c.id, a.id, b.id] });
    // no per-item logs
    const itemLogs = await db.syncLog.where({ entityId: a.id }).toArray();
    expect(itemLogs).toHaveLength(0);
  });

  it('emits a single list:updated event with itemOrder payload', async () => {
    const { svc, lists, items, events } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const a = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'A',
      createdBy: 'u',
    });
    const b = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'B',
      createdBy: 'u',
    });

    const recorded: unknown[] = [];
    events.on('list:updated', (d) => recorded.push(d));

    await svc.reorderItems(list.id, [b.id, a.id], 'u');

    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({
      listId: list.id,
      changes: { itemOrder: [b.id, a.id] },
    });
  });

  it('reader cannot reorder', async () => {
    const { svc, lists, items, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'owner' });
    const a = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'A',
      createdBy: 'owner',
    });
    await db.shares.add({
      id: 'sh',
      listId: list.id,
      userId: 'alice',
      permission: 'read',
      createdAt: Date.now(),
      createdBy: 'owner',
      acceptedAt: Date.now(),
      version: 1,
    });
    await expect(
      svc.reorderItems(list.id, [a.id], 'alice'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
