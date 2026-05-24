import { describe, it, expect } from 'vitest';
import { ShoppingListDB, ListsDB, ItemsDB, SharesDB } from '@db';
import { EventBus } from '@utils/events';
import { createSyncLogger } from './sync-logger';
import { ListService } from './ListService';
import { ValidationError, ForbiddenError, NotFoundError } from './errors';

async function setup() {
  const db = new ShoppingListDB();
  await db.delete();
  await db.open();
  const lists = new ListsDB(db.lists);
  const items = new ItemsDB(db.items);
  const shares = new SharesDB(db.shares);
  const events = new EventBus();
  const logSync = createSyncLogger(db);
  const svc = new ListService({ db, lists, items, shares, events, logSync });
  return { db, svc, events, lists, items, shares };
}

describe('ListService.getAllLists', () => {
  it('returns owned and accepted-shared lists, excluding soft-deleted, with stats', async () => {
    const { svc, lists, items, db } = await setup();
    const owned = await lists.create({ name: 'Owned', ownerId: 'user-1' });
    const foreign = await lists.create({ name: 'Foreign', ownerId: 'other' });
    await lists.create({ name: 'Deleted', ownerId: 'user-1' });
    // soft-delete one
    await db.lists
      .where('name')
      .equals('Deleted')
      .modify({ deletedAt: Date.now() });

    // Make 'foreign' shared with user-1, accepted
    await db.shares.add({
      id: 'sh1',
      listId: foreign.id,
      userId: 'user-1',
      permission: 'write',
      createdAt: Date.now(),
      createdBy: 'other',
      acceptedAt: Date.now(),
      version: 1,
    });

    // Add items to owned list to test stats
    await items.create({ listId: owned.id, quantity: 1, createdBy: 'user-1' });
    await items.create({ listId: owned.id, quantity: 1, createdBy: 'user-1' });

    const result = await svc.getAllLists('user-1');
    const names = result.map((l) => l.name).sort();
    expect(names).toEqual(['Foreign', 'Owned']);

    const ownedResult = result.find((l) => l.id === owned.id);
    expect(ownedResult?.totalItems).toBe(2);
    expect(ownedResult?.checkedItems).toBe(0);
  });
});

describe('ListService.searchLists', () => {
  it('filters by case-insensitive name', async () => {
    const { svc, lists } = await setup();
    await lists.create({ name: 'Spesa', ownerId: 'u' });
    await lists.create({ name: 'Ufficio', ownerId: 'u' });
    const result = await svc.searchLists('spe', 'u');
    expect(result.map((l) => l.name)).toEqual(['Spesa']);
  });
});

describe('ListService.getListById', () => {
  it('returns the list without checking permissions', async () => {
    const { svc, lists } = await setup();
    const l = await lists.create({ name: 'L', ownerId: 'u' });
    const found = await svc.getListById(l.id);
    expect(found?.id).toBe(l.id);
  });
});

describe('ListService.createList', () => {
  it('creates list, writes syncLog entry, emits list:created (commit-before-emit)', async () => {
    const { svc, db, events } = await setup();
    const recorded: unknown[] = [];
    // Capture DB state at the moment the post-commit event fires to assert
    // commit-before-emit ordering: counts must already reflect the write.
    const snapshotAtEmit = new Promise<{ lists: number; syncLog: number }>(
      (resolve) => {
        events.on('list:created', (d) => {
          recorded.push(d);
          void Promise.all([db.lists.count(), db.syncLog.count()]).then(
            ([listsCount, syncCount]) =>
              resolve({ lists: listsCount, syncLog: syncCount }),
          );
        });
      },
    );

    const list = await svc.createList('Spesa di oggi', 'user-1', '#4F46E5');

    expect(list.version).toBe(1);
    expect(list.ownerId).toBe('user-1');
    const stored = await db.lists.get(list.id);
    expect(stored?.name).toBe('Spesa di oggi');

    const logs = await db.syncLog.where({ entityId: list.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      entityType: 'list',
      action: 'create',
      synced: false,
      retryCount: 0,
      userId: 'user-1',
    });
    expect(recorded).toEqual([{ list }]);

    // Commit-before-emit: the listener observed the durable state.
    const snap = await snapshotAtEmit;
    expect(snap.lists).toBe(1);
    expect(snap.syncLog).toBe(1);
  });

  it('throws ValidationError on empty name', async () => {
    const { svc, db } = await setup();
    await expect(svc.createList('', 'user-1')).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(await db.lists.count()).toBe(0);
    expect(await db.syncLog.count()).toBe(0);
  });

  it('throws ValidationError on name > 100 chars', async () => {
    const { svc } = await setup();
    const longName = 'x'.repeat(101);
    await expect(svc.createList(longName, 'user-1')).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe('ListService.updateList', () => {
  it('owner updates name and color; writes logSync and emits', async () => {
    const { svc, lists, db, events } = await setup();
    const list = await lists.create({ name: 'Old', ownerId: 'owner' });
    const recorded: unknown[] = [];
    events.on('list:updated', (d) => recorded.push(d));

    await svc.updateList(list.id, { name: 'New', color: '#F00' }, 'owner');

    const stored = await db.lists.get(list.id);
    expect(stored?.name).toBe('New');
    expect(stored?.color).toBe('#F00');

    const logs = await db.syncLog.where({ entityId: list.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('update');
    expect(recorded).toHaveLength(1);
  });

  it('silently strips fields outside {name, color} from changes', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'Old', ownerId: 'owner' });
    await svc.updateList(
      list.id,
      // ownerId/version are not allowed; service must drop them.
      { name: 'New', ownerId: 'hacker', version: 999 } as Partial<
        Parameters<typeof svc.updateList>[1]
      >,
      'owner',
    );
    const stored = await db.lists.get(list.id);
    expect(stored?.name).toBe('New');
    expect(stored?.ownerId).toBe('owner');

    const logs = await db.syncLog.where({ entityId: list.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.payload).toEqual({ name: 'New' });
  });

  it('reader cannot update', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'owner' });
    await db.shares.add({
      id: 's1',
      listId: list.id,
      userId: 'alice',
      permission: 'read',
      createdAt: Date.now(),
      createdBy: 'owner',
      acceptedAt: Date.now(),
      version: 1,
    });
    await expect(
      svc.updateList(list.id, { name: 'Hacked' }, 'alice'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws NotFoundError on missing list', async () => {
    const { svc } = await setup();
    await expect(
      svc.updateList('missing', { name: 'X' }, 'owner'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('ListService.deleteList', () => {
  it('owner soft-deletes, writes logSync, emits', async () => {
    const { svc, lists, db, events } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'owner' });
    const recorded: unknown[] = [];
    events.on('list:deleted', (d) => recorded.push(d));

    await svc.deleteList(list.id, 'owner');

    const stored = await db.lists.get(list.id);
    expect(stored?.deletedAt).toBeDefined();

    const logs = await db.syncLog.where({ entityId: list.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('delete');
    expect(recorded).toEqual([{ listId: list.id }]);
  });

  it('writer cannot delete', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'owner' });
    await db.shares.add({
      id: 's1',
      listId: list.id,
      userId: 'alice',
      permission: 'write',
      createdAt: Date.now(),
      createdBy: 'owner',
      acceptedAt: Date.now(),
      version: 1,
    });
    await expect(svc.deleteList(list.id, 'alice')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe('ListService.duplicateList', () => {
  it('clones list and non-checked items, skips checked, skips shares; emits ONE list:created with N+1 syncLogs', async () => {
    const { svc, lists, items, db, events } = await setup();
    const src = await lists.create({
      name: 'Src',
      ownerId: 'owner',
      color: '#AAA',
    });
    const i1 = await items.create({
      listId: src.id,
      quantity: 1,
      createdBy: 'owner',
    });
    await items.create({
      listId: src.id,
      quantity: 2,
      createdBy: 'owner',
    });
    await items.toggleChecked(i1.id, 'owner'); // i1 is now checked

    // Share the source list
    await db.shares.add({
      id: 'sh',
      listId: src.id,
      userId: 'bob',
      permission: 'read',
      createdAt: Date.now(),
      createdBy: 'owner',
      acceptedAt: Date.now(),
      version: 1,
    });

    const createdEvents: unknown[] = [];
    events.on('list:created', (d) => createdEvents.push(d));

    const copy = await svc.duplicateList(src.id, 'owner');
    expect(copy.name).toBe('Copia di Src');
    expect(copy.id).not.toBe(src.id);
    expect(copy.color).toBe('#AAA');

    const copyItems = await db.items.where('listId').equals(copy.id).toArray();
    expect(copyItems).toHaveLength(1);
    expect(copyItems[0]?.checked).toBe(false);

    const copyShares = await db.shares
      .where('listId')
      .equals(copy.id)
      .toArray();
    expect(copyShares).toHaveLength(0);

    // Exactly ONE event for the duplicate, even though N+1 records were written.
    expect(createdEvents).toHaveLength(1);

    // logSync: one for newList + one for each copied item (= 2 total = N+1)
    const logs = await db.syncLog
      .where('entityType')
      .anyOf(['list', 'item'])
      .toArray();
    const forDuplicate = logs.filter(
      (l) =>
        l.entityId === copy.id ||
        copyItems.some((it) => it.id === l.entityId),
    );
    expect(forDuplicate).toHaveLength(2);
  });

  it('reader can duplicate (canRead is enough)', async () => {
    const { svc, lists, db } = await setup();
    const src = await lists.create({ name: 'Src', ownerId: 'owner' });
    await db.shares.add({
      id: 'sh',
      listId: src.id,
      userId: 'bob',
      permission: 'read',
      createdAt: Date.now(),
      createdBy: 'owner',
      acceptedAt: Date.now(),
      version: 1,
    });
    const copy = await svc.duplicateList(src.id, 'bob');
    expect(copy.ownerId).toBe('bob');
  });
});
