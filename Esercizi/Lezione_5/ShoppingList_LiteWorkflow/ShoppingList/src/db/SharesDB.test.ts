import { describe, it, expect, beforeEach } from 'vitest';
import { ShoppingListDB } from './schema';
import { SharesDB } from './SharesDB';

let db: ShoppingListDB;
let repo: SharesDB;

beforeEach(async () => {
  db = new ShoppingListDB();
  await db.delete();
  await db.open();
  repo = new SharesDB(db.shares);

  await db.lists.add({
    id: 'list-owned',
    name: 'Owned',
    ownerId: 'owner-1',
    createdAt: 1,
    updatedAt: 1,
    version: 1,
  });
});

describe('SharesDB', () => {
  it('getPermissions returns full access for owner', async () => {
    const perms = await repo.getPermissions('owner-1', 'list-owned');
    expect(perms.isOwner).toBe(true);
    expect(perms.canRead).toBe(true);
    expect(perms.canWrite).toBe(true);
    expect(perms.canDelete).toBe(true);
    expect(perms.canShare).toBe(true);
  });

  it('getPermissions returns write access for users with write share', async () => {
    await repo.create({
      listId: 'list-owned',
      userId: 'friend-1',
      permission: 'write',
      createdBy: 'owner-1',
    });
    const perms = await repo.getPermissions('friend-1', 'list-owned');
    expect(perms.isOwner).toBe(false);
    expect(perms.canRead).toBe(true);
    expect(perms.canWrite).toBe(true);
    expect(perms.canDelete).toBe(false);
    expect(perms.canShare).toBe(false);
  });

  it('getPermissions returns read-only for users with read share', async () => {
    await repo.create({
      listId: 'list-owned',
      userId: 'friend-2',
      permission: 'read',
      createdBy: 'owner-1',
    });
    const perms = await repo.getPermissions('friend-2', 'list-owned');
    expect(perms.canRead).toBe(true);
    expect(perms.canWrite).toBe(false);
  });

  it('getPermissions returns no access for strangers', async () => {
    const perms = await repo.getPermissions('stranger', 'list-owned');
    expect(perms.canRead).toBe(false);
    expect(perms.canWrite).toBe(false);
    expect(perms.isOwner).toBe(false);
  });

  it('delete revokes access (hard delete)', async () => {
    const share = await repo.create({
      listId: 'list-owned',
      userId: 'friend-3',
      permission: 'write',
      createdBy: 'owner-1',
    });
    await repo.delete(share.id);
    expect(await db.shares.get(share.id)).toBeUndefined();
  });

  it('getByListId returns shares for the list', async () => {
    await repo.create({
      listId: 'list-owned',
      userId: 'u1',
      permission: 'read',
      createdBy: 'owner-1',
    });
    await repo.create({
      listId: 'list-owned',
      userId: 'u2',
      permission: 'write',
      createdBy: 'owner-1',
    });
    const shares = await repo.getByListId('list-owned');
    expect(shares).toHaveLength(2);
  });
});
