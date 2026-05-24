import { describe, it, expect, beforeEach } from 'vitest';
import { ShoppingListDB } from './schema';
import { ListsDB } from './ListsDB';

let db: ShoppingListDB;
let repo: ListsDB;

beforeEach(async () => {
  db = new ShoppingListDB();
  await db.delete();
  await db.open();
  repo = new ListsDB(db.lists);
});

describe('ListsDB', () => {
  it('creates a list with metadata', async () => {
    const list = await repo.create({ name: 'Spesa', ownerId: 'user-1' });
    expect(list.id).toBeTruthy();
    expect(list.name).toBe('Spesa');
    expect(list.ownerId).toBe('user-1');
    expect(list.version).toBe(1);
  });

  it('getAll returns lists owned by user, excluding soft-deleted', async () => {
    const a = await repo.create({ name: 'A', ownerId: 'user-1' });
    const b = await repo.create({ name: 'B', ownerId: 'user-1' });
    await repo.create({ name: 'Other', ownerId: 'user-2' });
    await repo.softDelete(b.id);

    const results = await repo.getAll('user-1');
    expect(results.map((l) => l.id)).toEqual([a.id]);
  });

  it('update merges changes and bumps version', async () => {
    const list = await repo.create({ name: 'Old', ownerId: 'user-1' });
    await repo.update(list.id, { name: 'New' });

    const updated = await repo.getById(list.id);
    expect(updated?.name).toBe('New');
    expect(updated?.version).toBe(2);
  });

  it('getWithStats returns totalItems, checkedItems and sharedWith', async () => {
    const list = await repo.create({ name: 'Spesa', ownerId: 'user-1' });
    await db.items.bulkAdd([
      {
        id: 'i1',
        listId: list.id,
        quantity: 1,
        checked: false,
        order: 1,
        createdAt: 1,
        createdBy: 'u',
        updatedAt: 1,
        updatedBy: 'u',
        version: 1,
      },
      {
        id: 'i2',
        listId: list.id,
        quantity: 1,
        checked: true,
        order: 2,
        createdAt: 1,
        createdBy: 'u',
        updatedAt: 1,
        updatedBy: 'u',
        version: 1,
      },
    ]);
    await db.shares.add({
      id: 's1',
      listId: list.id,
      userId: 'user-2',
      permission: 'read',
      createdAt: 1,
      createdBy: 'user-1',
      version: 1,
    });

    const [stats] = await repo.getWithStats('user-1');
    expect(stats).toBeDefined();
    expect(stats?.totalItems).toBe(2);
    expect(stats?.checkedItems).toBe(1);
    expect(stats?.sharedWith).toBe(1);
  });
});
