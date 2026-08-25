import { describe, it, expect, beforeEach } from 'vitest';
import { ShoppingListDB } from './schema';
import { UsersDB } from './UsersDB';

let db: ShoppingListDB;
let repo: UsersDB;

beforeEach(async () => {
  db = new ShoppingListDB();
  await db.delete();
  await db.open();
  repo = new UsersDB(db.users);
});

describe('UsersDB', () => {
  it('creates a guest user with default empty preferences', async () => {
    const user = await repo.create({ name: 'Guest', isGuest: true });
    expect(user.id).toBeTruthy();
    expect(user.isGuest).toBe(true);
    expect(user.name).toBe('Guest');
    expect(user.preferences).toEqual({});
    expect(user.createdAt).toBeGreaterThan(0);
    expect(user.lastLoginAt).toBeGreaterThan(0);
  });

  it('creates a user with defaults', async () => {
    const user = await repo.create({ name: 'Mario', isGuest: false });
    expect(user.id).toBeTruthy();
    expect(user.isGuest).toBe(false);
    expect(user.createdAt).toBeGreaterThan(0);
  });

  it('getByEmail returns the user', async () => {
    await repo.create({ name: 'Anna', email: 'anna@test.io', isGuest: false });
    const found = await repo.getByEmail('anna@test.io');
    expect(found?.name).toBe('Anna');
  });

  it('getByEmail is case-sensitive', async () => {
    await repo.create({ name: 'Foo', email: 'Foo@example.com', isGuest: false });
    await repo.create({ name: 'foo', email: 'foo@example.com', isGuest: false });

    const upper = await repo.getByEmail('Foo@example.com');
    const lower = await repo.getByEmail('foo@example.com');

    expect(upper?.name).toBe('Foo');
    expect(lower?.name).toBe('foo');
    expect(upper?.id).not.toBe(lower?.id);
  });

  it('getById returns the user', async () => {
    const created = await repo.create({ name: 'Luigi', isGuest: false });
    const fetched = await repo.getById(created.id);
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.name).toBe('Luigi');
  });

  it('getByEmail returns undefined for missing email', async () => {
    expect(await repo.getByEmail('nope@test.io')).toBeUndefined();
  });

  it('getById returns undefined for missing id', async () => {
    expect(await repo.getById('nonexistent-id')).toBeUndefined();
  });

  it('update merges changes', async () => {
    const user = await repo.create({ name: 'X', isGuest: true });
    await repo.update(user.id, { name: 'Y' });
    const updated = await repo.getById(user.id);
    expect(updated?.name).toBe('Y');
  });
});
