import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './schema';
import { appendSyncLog } from './syncLog';

beforeEach(async () => {
  await db.syncLog.clear();
});

describe('appendSyncLog', () => {
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  it('creates a syncLog entry with synced=false and retryCount=0', async () => {
    const before = Date.now();
    await appendSyncLog('list', 'abc', 'create', { foo: 'bar' }, 'user1');
    const after = Date.now();

    const entries = await db.syncLog.toArray();
    expect(entries.length).toBe(1);

    const entry = entries[0]!;
    expect(entry.entityType).toBe('list');
    expect(entry.entityId).toBe('abc');
    expect(entry.action).toBe('create');
    expect(entry.payload).toEqual({ foo: 'bar' });
    expect(entry.userId).toBe('user1');
    expect(entry.synced).toBe(false);
    expect(entry.retryCount).toBe(0);
    expect(entry.timestamp).toBeGreaterThanOrEqual(before);
    expect(entry.timestamp).toBeLessThanOrEqual(after);
    expect(entry.id).toMatch(UUID_PATTERN);
    expect(entry.syncedAt).toBeUndefined();
    expect(entry.syncError).toBeUndefined();
  });

  it('creates multiple distinct rows on multiple appends (no overwrite)', async () => {
    await appendSyncLog('item', 'i1', 'create', { name: 'Milk' }, 'u');
    await appendSyncLog('item', 'i2', 'update', { name: 'Bread' }, 'u');
    await appendSyncLog('list', 'l1', 'delete', {}, 'u');

    const entries = await db.syncLog.toArray();
    expect(entries.length).toBe(3);

    const ids = new Set(entries.map((e) => e.id));
    expect(ids.size).toBe(3);

    const entityIds = entries.map((e) => e.entityId).sort();
    expect(entityIds).toEqual(['i1', 'i2', 'l1']);
  });

  it('preserves the payload object shape through IndexedDB round-trip', async () => {
    const payload: Record<string, unknown> = {
      name: 'Spesa',
      count: 42,
      nested: { a: 1, b: [1, 2, 3] },
      flag: true,
      nothing: null,
    };

    await appendSyncLog('list', 'list-1', 'update', payload, 'user-1');

    const entries = await db.syncLog.toArray();
    expect(entries.length).toBe(1);
    expect(entries[0]!.payload).toEqual(payload);
  });
});
