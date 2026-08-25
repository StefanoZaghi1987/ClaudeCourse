import { describe, it, expect, beforeEach } from 'vitest';
import type { Article } from '@models';
import { ShoppingListDB } from './schema';
import { ItemsDB } from './ItemsDB';

let db: ShoppingListDB;
let repo: ItemsDB;

beforeEach(async () => {
  db = new ShoppingListDB();
  await db.delete();
  await db.open();
  repo = new ItemsDB(db.items);
});

describe('ItemsDB', () => {
  it('creates an item with auto order and checked=false', async () => {
    const item = await repo.create({
      listId: 'list-1',
      customName: 'Latte',
      quantity: 1,
      createdBy: 'user-1',
    });
    expect(item.order).toBe(1);
    expect(item.checked).toBe(false);
    expect(item.updatedBy).toBe('user-1');
  });

  it('getNextOrder returns 1 for an empty list', async () => {
    expect(await repo.getNextOrder('empty')).toBe(1);
  });

  it('getNextOrder increments based on existing items', async () => {
    await repo.create({ listId: 'list-1', customName: 'A', quantity: 1, createdBy: 'u' });
    await repo.create({ listId: 'list-1', customName: 'B', quantity: 1, createdBy: 'u' });
    await repo.create({ listId: 'list-1', customName: 'C', quantity: 1, createdBy: 'u' });
    expect(await repo.getNextOrder('list-1')).toBe(4);
  });

  it('getByListId returns items sorted by order excluding soft-deleted', async () => {
    const a = await repo.create({ listId: 'l', customName: 'A', quantity: 1, createdBy: 'u' });
    const b = await repo.create({ listId: 'l', customName: 'B', quantity: 1, createdBy: 'u' });
    const c = await repo.create({ listId: 'l', customName: 'C', quantity: 1, createdBy: 'u' });
    await repo.softDelete(a.id);

    const items = await repo.getByListId('l');
    expect(items.map((i) => i.id)).toEqual([b.id, c.id]);
    expect(items[0]?.order).toBeLessThan(items[1]?.order ?? 0);
  });

  it('toggleChecked sets checkedAt/checkedBy on check', async () => {
    const item = await repo.create({
      listId: 'l',
      customName: 'X',
      quantity: 1,
      createdBy: 'u',
    });

    await repo.toggleChecked(item.id, 'user-9');
    const checked = await db.items.get(item.id);
    expect(checked?.checked).toBe(true);
    expect(checked?.checkedBy).toBe('user-9');
    expect(checked?.checkedAt).toBeGreaterThan(0);
    expect(checked?.updatedBy).toBe('user-9');
  });

  it('toggleChecked clears checkedAt/checkedBy on uncheck', async () => {
    const item = await repo.create({
      listId: 'l',
      customName: 'X',
      quantity: 1,
      createdBy: 'u',
    });

    await repo.toggleChecked(item.id, 'user-9');
    await repo.toggleChecked(item.id, 'user-9');
    const unchecked = await db.items.get(item.id);
    expect(unchecked?.checked).toBe(false);
    expect(unchecked?.checkedBy).toBeUndefined();
    expect(unchecked?.checkedAt).toBeUndefined();
  });

  it('update touches metadata and sets updatedBy', async () => {
    const item = await repo.create({
      listId: 'l',
      customName: 'Old',
      quantity: 1,
      createdBy: 'u',
    });
    const originalVersion = item.version;

    await repo.update(item.id, { customName: 'New', quantity: 5 }, 'user-2');
    const updated = await db.items.get(item.id);
    expect(updated?.customName).toBe('New');
    expect(updated?.quantity).toBe(5);
    expect(updated?.updatedBy).toBe('user-2');
    expect(updated?.version).toBe(originalVersion + 1);
  });

  it('getWithArticles joins articles correctly', async () => {
    const article: Article = {
      id: 'art-1',
      name: 'Latte',
      searchTerms: ['latte'],
      usageCount: 0,
      createdAt: Date.now(),
      createdBy: 'u',
      isDefault: true,
      version: 1,
    };
    await db.articles.add(article);

    const withArt = await repo.create({
      listId: 'l',
      articleId: 'art-1',
      quantity: 2,
      createdBy: 'u',
    });
    const withoutArt = await repo.create({
      listId: 'l',
      customName: 'Mele',
      quantity: 3,
      createdBy: 'u',
    });

    const joined = await repo.getWithArticles('l');
    expect(joined).toHaveLength(2);

    const enrichedWith = joined.find((i) => i.id === withArt.id);
    expect(enrichedWith?.article?.id).toBe('art-1');
    expect(enrichedWith?.article?.name).toBe('Latte');

    const enrichedWithout = joined.find((i) => i.id === withoutArt.id);
    expect(enrichedWithout?.article).toBeUndefined();
  });
});
