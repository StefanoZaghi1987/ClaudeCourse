import { describe, it, expect } from 'vitest';
import { ShoppingListDB, UsersDB } from '@db';
import { EventBus } from '@utils/events';
import { InMemoryStorage } from './test-helpers';
import { FakeHasher } from './PasswordHasher';
import { AuthService } from './AuthService';
import {
  ValidationError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from './errors';

async function setup(): Promise<{
  db: ShoppingListDB;
  svc: AuthService;
  events: EventBus;
  users: UsersDB;
  storage: InMemoryStorage;
  hasher: FakeHasher;
}> {
  const db = new ShoppingListDB();
  await db.delete();
  await db.open();
  const users = new UsersDB(db.users);
  const events = new EventBus();
  const storage = new InMemoryStorage();
  const hasher = new FakeHasher();
  const svc = new AuthService({ db, users, events, storage, hasher });
  return { db, svc, events, users, storage, hasher };
}

describe('AuthService.getCurrentUser', () => {
  it('returns undefined when no currentUserId in storage', async () => {
    const { svc } = await setup();
    expect(await svc.getCurrentUser()).toBeUndefined();
  });

  it('returns the stored user when currentUserId is set', async () => {
    const { svc } = await setup();
    const guest = await svc.createGuestUser();
    const fetched = await svc.getCurrentUser();
    expect(fetched?.id).toBe(guest.id);
    expect(fetched?.isGuest).toBe(true);
  });
});

describe('AuthService.createGuestUser', () => {
  it('creates guest with isGuest=true, persists currentUserId, emits event (commit-before-emit)', async () => {
    const { svc, db, storage, events } = await setup();
    const recorded: Array<{ userId?: string }> = [];

    // commit-before-emit: capture the durable DB state observable from the
    // listener at the moment the event fires.
    const snapshotAtEmit = new Promise<{
      usersCount: number;
      storedUserId?: string;
    }>((resolve) => {
      events.on('auth:state-changed', (d) => {
        recorded.push(d);
        void Promise.resolve().then(async () => {
          const usersCount = await db.users.count();
          const storedUserId = storage.get<string>('currentUserId');
          resolve({
            usersCount,
            ...(storedUserId !== undefined ? { storedUserId } : {}),
          });
        });
      });
    });

    const guest = await svc.createGuestUser();

    expect(guest.isGuest).toBe(true);
    expect(guest.name).toBe('Ospite');
    expect(guest.deviceId).toBeDefined();

    const stored = await db.users.get(guest.id);
    expect(stored?.isGuest).toBe(true);

    expect(storage.get<string>('currentUserId')).toBe(guest.id);
    expect(recorded).toEqual([{ userId: guest.id }]);

    // Commit-before-emit: when the listener ran, both the users table AND
    // the storage wrapper already reflected the new guest.
    const snap = await snapshotAtEmit;
    expect(snap.usersCount).toBe(1);
    expect(snap.storedUserId).toBe(guest.id);
  });

  it('reuses deviceId across subsequent guest creations', async () => {
    const { svc, storage } = await setup();
    const g1 = await svc.createGuestUser();
    const firstDevice = storage.get<string>('deviceId');
    expect(firstDevice).toBeDefined();

    // Simulate logout by clearing currentUserId but keeping deviceId
    storage.remove('currentUserId');

    const g2 = await svc.createGuestUser();
    expect(g2.deviceId).toBe(firstDevice);
    expect(g2.id).not.toBe(g1.id);
  });
});

describe('AuthService.register', () => {
  it('creates a fresh registered user when no guest is current', async () => {
    const { svc, db, storage } = await setup();
    const user = await svc.register('Alice', 'alice@x.io', 'longpassword');
    expect(user.email).toBe('alice@x.io');
    expect(user.isGuest).toBe(false);
    expect(user.passwordHash).toBe('fake:longpassword');
    expect(storage.get<string>('currentUserId')).toBe(user.id);
    expect((await db.users.get(user.id))?.passwordHash).toBe('fake:longpassword');
  });

  it('migrates guest → registered preserving same user id AND preserving guest-owned lists', async () => {
    const { svc, db } = await setup();
    const guest = await svc.createGuestUser();
    // Create a list owned by the guest, directly via db
    await db.lists.add({
      id: 'L1',
      name: 'Owned by guest',
      ownerId: guest.id,
      createdAt: 1,
      updatedAt: 1,
      version: 1,
    });

    const registered = await svc.register('Alice', 'alice@x.io', 'longpassword');
    expect(registered.id).toBe(guest.id); // same id!
    expect(registered.isGuest).toBe(false);
    expect(registered.email).toBe('alice@x.io');

    // The list is still owned by that same id (trivially true, but this is
    // the contract the migration must uphold).
    const list = await db.lists.get('L1');
    expect(list?.ownerId).toBe(guest.id);
    expect(list?.ownerId).toBe(registered.id);

    // The user record itself was updated in place, not duplicated.
    expect(await db.users.count()).toBe(1);
    const stored = await db.users.get(guest.id);
    expect(stored?.isGuest).toBe(false);
    expect(stored?.email).toBe('alice@x.io');
    expect(stored?.passwordHash).toBe('fake:longpassword');
    // Migration must refresh lastLoginAt so the session metadata reflects
    // the registration event, not the stale guest-creation time.
    expect(stored?.lastLoginAt).toBeDefined();
    expect(typeof stored?.lastLoginAt).toBe('number');
    expect(stored?.lastLoginAt).toBeGreaterThan(0);
  });

  it('emits auth:state-changed on register', async () => {
    const { svc, events } = await setup();
    const recorded: Array<{ userId?: string }> = [];
    events.on('auth:state-changed', (d) => recorded.push(d));
    const user = await svc.register('Alice', 'alice@x.io', 'longpassword');
    expect(recorded).toEqual([{ userId: user.id }]);
  });

  it('throws ValidationError on empty name', async () => {
    const { svc } = await setup();
    await expect(
      svc.register('   ', 'alice@x.io', 'longpassword'),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError on invalid email', async () => {
    const { svc } = await setup();
    await expect(
      svc.register('Alice', 'not-an-email', 'longpassword'),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError on short password', async () => {
    const { svc } = await setup();
    await expect(
      svc.register('Alice', 'a@x.io', 'short'),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ConflictError on duplicate email', async () => {
    const { svc } = await setup();
    await svc.register('Alice', 'a@x.io', 'longpassword');
    await expect(
      svc.register('Other', 'a@x.io', 'longpassword'),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('throws ConflictError when a registered user is already current', async () => {
    const { svc } = await setup();
    // First registration succeeds (no prior guest; fresh branch).
    await svc.register('Alice', 'alice@x.io', 'longpassword');
    // A second call with a DIFFERENT email must not silently orphan Alice's
    // record by running the fresh branch again. It must fail fast with a
    // ConflictError on the 'session' field.
    const err = await svc
      .register('Bob', 'bob@x.io', 'longpassword')
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ConflictError);
    expect((err as ConflictError).field).toBe('session');
  });
});

describe('AuthService.login', () => {
  it('returns user on correct password, updates currentUserId and lastLoginAt', async () => {
    const { svc, db, storage } = await setup();
    const registered = await svc.register('Alice', 'a@x.io', 'longpassword');
    // Clear storage to simulate a fresh session
    storage.remove('currentUserId');

    const user = await svc.login('a@x.io', 'longpassword');
    expect(user.email).toBe('a@x.io');
    expect(user.id).toBe(registered.id);
    expect(storage.get<string>('currentUserId')).toBe(user.id);

    const stored = await db.users.get(user.id);
    expect(stored?.lastLoginAt).toBe(user.lastLoginAt);
  });

  it('emits auth:state-changed on login', async () => {
    const { svc, events, storage } = await setup();
    await svc.register('Alice', 'a@x.io', 'longpassword');
    storage.remove('currentUserId');

    const recorded: Array<{ userId?: string }> = [];
    events.on('auth:state-changed', (d) => recorded.push(d));
    const user = await svc.login('a@x.io', 'longpassword');
    expect(recorded).toEqual([{ userId: user.id }]);
  });

  it('throws NotFoundError if email unknown', async () => {
    const { svc } = await setup();
    await expect(svc.login('ghost@x.io', 'whatever')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('throws ForbiddenError on wrong password', async () => {
    const { svc } = await setup();
    await svc.register('Alice', 'a@x.io', 'longpassword');
    await expect(svc.login('a@x.io', 'wrongpass')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe('AuthService.logout', () => {
  it('clears previous currentUserId and creates a new guest', async () => {
    const { svc, storage } = await setup();
    const reg = await svc.register('Alice', 'a@x.io', 'longpassword');
    await svc.logout();
    const nowCurrent = storage.get<string>('currentUserId');
    expect(nowCurrent).toBeDefined();
    expect(nowCurrent).not.toBe(reg.id);
  });

  it('leaves the previous user record untouched', async () => {
    const { svc, db } = await setup();
    const reg = await svc.register('Alice', 'a@x.io', 'longpassword');
    await svc.logout();
    const stored = await db.users.get(reg.id);
    expect(stored?.email).toBe('a@x.io');
    expect(stored?.isGuest).toBe(false);
  });
});

describe('AuthService.updateProfile', () => {
  it('updates name and preferences', async () => {
    const { svc, db } = await setup();
    const user = await svc.register('Alice', 'a@x.io', 'longpassword');
    await svc.updateProfile(user.id, {
      name: 'Alice B',
      preferences: { theme: 'dark' },
    });
    const stored = await db.users.get(user.id);
    expect(stored?.name).toBe('Alice B');
    expect(stored?.preferences.theme).toBe('dark');
  });

  it('emits auth:state-changed on profile update', async () => {
    const { svc, events } = await setup();
    const user = await svc.register('Alice', 'a@x.io', 'longpassword');
    const recorded: Array<{ userId?: string }> = [];
    events.on('auth:state-changed', (d) => recorded.push(d));
    await svc.updateProfile(user.id, { name: 'Alice B' });
    expect(recorded).toEqual([{ userId: user.id }]);
  });

  it('throws ValidationError on empty name', async () => {
    const { svc } = await setup();
    const user = await svc.register('Alice', 'a@x.io', 'longpassword');
    await expect(
      svc.updateProfile(user.id, { name: '   ' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('AuthService.isAuthenticated', () => {
  it('false when no current user', async () => {
    const { svc } = await setup();
    expect(await svc.isAuthenticated()).toBe(false);
  });

  it('false when guest', async () => {
    const { svc } = await setup();
    await svc.createGuestUser();
    expect(await svc.isAuthenticated()).toBe(false);
  });

  it('true after register', async () => {
    const { svc } = await setup();
    await svc.register('Alice', 'a@x.io', 'longpassword');
    expect(await svc.isAuthenticated()).toBe(true);
  });
});
