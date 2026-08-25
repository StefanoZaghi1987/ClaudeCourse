import { describe, it, expect, beforeEach } from 'vitest';
import { ShoppingListDB, ListsDB, SharesDB, UsersDB } from '@db';
import { EventBus } from '@utils/events';
import { createSyncLogger } from './sync-logger';
import { ShareService } from './ShareService';
import { NotFoundError, ForbiddenError, ConflictError } from './errors';

async function setup() {
  const db = new ShoppingListDB();
  await db.delete();
  await db.open();
  const lists = new ListsDB(db.lists);
  const shares = new SharesDB(db.shares);
  const users = new UsersDB(db.users);
  const events = new EventBus();
  const logSync = createSyncLogger(db);
  const svc = new ShareService({ db, shares, lists, users, events, logSync });
  return { db, svc, events, lists, shares, users };
}

describe('ShareService.getUserPermissions', () => {
  it('owner gets full permissions', async () => {
    const { svc, lists } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const perms = await svc.getUserPermissions('owner', list.id);
    expect(perms).toEqual({
      isOwner: true,
      canRead: true,
      canWrite: true,
      canDelete: true,
      canShare: true,
    });
  });

  it('stranger gets NO_ACCESS', async () => {
    const { svc, lists } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const perms = await svc.getUserPermissions('stranger', list.id);
    expect(perms.canRead).toBe(false);
    expect(perms.canWrite).toBe(false);
  });
});

describe('ShareService.createShareLink', () => {
  beforeEach(() => {
    // jsdom-safe fake for location.origin when running under node
    if (typeof globalThis.location === 'undefined') {
      (globalThis as unknown as { location: { origin: string } }).location = {
        origin: 'http://localhost',
      };
    }
  });

  it('owner can create a share link with a 32-hex token', async () => {
    const { svc, lists, db, events } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });

    const recorded: unknown[] = [];
    // Capture DB state at the moment the post-commit event fires.
    const snapshotAtEmit = new Promise<{ shares: number; syncLog: number }>(
      (resolve) => {
        events.on('share:created', (d) => {
          recorded.push(d);
          void (async () => {
            const sharesCount = await db.shares.count();
            const syncLogCount = await db.syncLog.count();
            resolve({ shares: sharesCount, syncLog: syncLogCount });
          })();
        });
      },
    );

    const url = await svc.createShareLink(list.id, 'write', 'owner');

    const token = url.split('/').pop() ?? '';
    expect(token).toMatch(/^[0-9a-f]{32}$/);

    const shares = await db.shares.where('listId').equals(list.id).toArray();
    expect(shares).toHaveLength(1);
    expect(shares[0]?.inviteToken).toBe(token);
    expect(shares[0]?.userId).toBe('');

    const logs = await db.syncLog.where({ entityId: shares[0]!.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('create');

    expect(recorded).toHaveLength(1);

    // Commit-before-emit: when the listener fired, both writes were already
    // visible in IndexedDB.
    const snapshot = await snapshotAtEmit;
    expect(snapshot.shares).toBe(1);
    expect(snapshot.syncLog).toBe(1);
  });

  it('non-owner cannot create a share link', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    await expect(
      svc.createShareLink(list.id, 'read', 'stranger'),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(await db.shares.count()).toBe(0);
  });

  it('throws NotFoundError when list does not exist', async () => {
    const { svc } = await setup();
    await expect(
      svc.createShareLink('missing', 'read', 'owner'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('ShareService.acceptInvite', () => {
  it('sets userId + acceptedAt, clears inviteToken', async () => {
    const { svc, lists, db, events } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const url = await svc.createShareLink(list.id, 'write', 'owner');
    const token = url.split('/').pop()!;

    const recorded: unknown[] = [];
    // Capture DB state at the moment the post-commit event fires so we can
    // assert that both the share update and the syncLog append were durable
    // before the listener ran. Guards against future refactors moving the
    // emit inside the transaction.
    const snapshotAtEmit = new Promise<{
      shares: number;
      syncLog: number;
      acceptedAt: number | undefined;
      inviteToken: string | undefined;
    }>((resolve) => {
      events.on('share:accepted', (d) => {
        recorded.push(d);
        void (async () => {
          const sharesCount = await db.shares.count();
          const syncLogCount = await db.syncLog.count();
          const fresh = (
            await db.shares.where('listId').equals(list.id).toArray()
          )[0];
          resolve({
            shares: sharesCount,
            syncLog: syncLogCount,
            acceptedAt: fresh?.acceptedAt,
            inviteToken: fresh?.inviteToken,
          });
        })();
      });
    });

    await svc.acceptInvite(token, 'alice');

    const share = (
      await db.shares.where('listId').equals(list.id).toArray()
    )[0];
    expect(share?.userId).toBe('alice');
    expect(share?.acceptedAt).toBeDefined();
    expect(share?.inviteToken).toBeUndefined();
    expect(recorded).toEqual([{ shareId: share!.id }]);

    // Commit-before-emit: when the listener fired the share update AND the
    // syncLog append (created in createShareLink + the update) were both
    // durably visible, and the new acceptedAt was set / inviteToken cleared.
    const snapshot = await snapshotAtEmit;
    expect(snapshot.shares).toBe(1);
    expect(snapshot.syncLog).toBe(2);
    expect(snapshot.acceptedAt).toBeDefined();
    expect(snapshot.inviteToken).toBeUndefined();
  });

  // Deviation from plan-verbatim test: the plan's "already accepted" test
  // re-calls acceptInvite with the same token after a successful accept, but
  // acceptInvite clears `inviteToken` on success (same plan, Task 16 step 3),
  // so a second lookup by token returns undefined → NotFoundError instead of
  // ConflictError. We test the ConflictError branch directly by seeding a
  // share that is already `acceptedAt` but still has its `inviteToken`.
  it('throws ConflictError if already accepted', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const url = await svc.createShareLink(list.id, 'read', 'owner');
    const token = url.split('/').pop()!;
    const seeded = (
      await db.shares.where('listId').equals(list.id).toArray()
    )[0]!;
    // Mark accepted WITHOUT clearing the inviteToken, so getByToken still
    // resolves and the acceptedAt guard is the one that fires.
    await db.shares.update(seeded.id, { acceptedAt: Date.now() });
    await expect(svc.acceptInvite(token, 'bob')).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('throws NotFoundError for unknown token', async () => {
    const { svc } = await setup();
    await expect(svc.acceptInvite('deadbeef', 'alice')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe('ShareService.getListShares', () => {
  it('returns shares with user info joined', async () => {
    const { svc, lists, users, shares } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const alice = await users.create({
      name: 'Alice',
      email: 'a@x',
      isGuest: false,
    });
    await shares.create({
      listId: list.id,
      userId: alice.id,
      permission: 'write',
      createdBy: 'owner',
    });

    const result = await svc.getListShares(list.id);
    expect(result).toHaveLength(1);
    expect(result[0]?.user?.name).toBe('Alice');
  });
});

describe('ShareService.getSharedListsForUser', () => {
  it('returns only lists with an accepted share for the user', async () => {
    const { svc, lists, shares, db } = await setup();
    const l1 = await lists.create({ name: 'L1', ownerId: 'owner' });
    const l2 = await lists.create({ name: 'L2', ownerId: 'owner' });

    await shares.create({
      listId: l1.id,
      userId: 'alice',
      permission: 'read',
      createdBy: 'owner',
    });
    // Mark the first share as accepted
    const s1 = (await db.shares.where('listId').equals(l1.id).toArray())[0]!;
    await db.shares.update(s1.id, { acceptedAt: Date.now() });

    await shares.create({
      listId: l2.id,
      userId: 'alice',
      permission: 'read',
      createdBy: 'owner',
    }); // pending

    const result = await svc.getSharedListsForUser('alice');
    expect(result.map((l) => l.id)).toEqual([l1.id]);
  });
});

describe('ShareService.updatePermission', () => {
  it('owner can change permission level', async () => {
    const { svc, lists, shares, db } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const s = await shares.create({
      listId: list.id,
      userId: 'alice',
      permission: 'read',
      createdBy: 'owner',
    });
    await svc.updatePermission(s.id, 'write', 'owner');
    const after = await db.shares.get(s.id);
    expect(after?.permission).toBe('write');

    const logs = await db.syncLog.where({ entityId: s.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.entityType).toBe('share');
    expect(logs[0]?.action).toBe('update');
    expect(logs[0]?.userId).toBe('owner');
    expect(logs[0]?.payload).toEqual({ permission: 'write' });
  });

  it('non-owner cannot change permission', async () => {
    const { svc, lists, shares } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const s = await shares.create({
      listId: list.id,
      userId: 'alice',
      permission: 'read',
      createdBy: 'owner',
    });
    await expect(
      svc.updatePermission(s.id, 'write', 'alice'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('ShareService.revokeAccess', () => {
  it('owner hard-deletes the share record', async () => {
    const { svc, lists, shares, db } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const s = await shares.create({
      listId: list.id,
      userId: 'alice',
      permission: 'read',
      createdBy: 'owner',
    });
    // Snapshot the full pre-delete record so we can prove Fase 5 replay
    // can reconstruct the share from the log payload alone.
    const preDelete = await db.shares.get(s.id);
    expect(preDelete).toBeDefined();

    await svc.revokeAccess(s.id, 'owner');
    expect(await db.shares.get(s.id)).toBeUndefined();

    const logs = await db.syncLog.where({ entityId: s.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.entityType).toBe('share');
    expect(logs[0]?.action).toBe('delete');
    expect(logs[0]?.userId).toBe('owner');
    // Payload must contain the FULL pre-delete record so a future replay
    // can reconstruct the lost share.
    expect(logs[0]?.payload).toEqual({ ...preDelete });
  });
});
