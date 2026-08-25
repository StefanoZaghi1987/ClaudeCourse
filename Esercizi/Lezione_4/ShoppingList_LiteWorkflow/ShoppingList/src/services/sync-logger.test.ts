import { describe, it, expect, beforeEach } from 'vitest';
import { ShoppingListDB } from '@db';
import { createSyncLogger } from './sync-logger';

describe('createSyncLogger', () => {
  let db: ShoppingListDB;

  beforeEach(async () => {
    db = new ShoppingListDB();
    await db.delete();
    await db.open();
  });

  it('writes a syncLog entry with defaults', async () => {
    const logSync = createSyncLogger(db);
    await logSync('list', 'L1', 'create', { name: 'Spesa' }, 'user-1');

    const all = await db.syncLog.toArray();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      entityType: 'list',
      entityId: 'L1',
      action: 'create',
      payload: { name: 'Spesa' },
      userId: 'user-1',
      synced: false,
      retryCount: 0,
    });
    expect(all[0]?.id).toBeDefined();
    expect(typeof all[0]?.timestamp).toBe('number');
  });

  it('writes into the db handle passed at construction, not a singleton', async () => {
    const calls: unknown[] = [];
    const fakeDb = {
      syncLog: {
        add: async (entry: unknown): Promise<void> => {
          calls.push(entry);
        },
      },
    } as unknown as ShoppingListDB;

    const logSync = createSyncLogger(fakeDb);
    await logSync('item', 'I1', 'update', { checked: true }, 'user-2');

    expect(calls).toHaveLength(1);
    expect(await db.syncLog.count()).toBe(0);
  });
});
