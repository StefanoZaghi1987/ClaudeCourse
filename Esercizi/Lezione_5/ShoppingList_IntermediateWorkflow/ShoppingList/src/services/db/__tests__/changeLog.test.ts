import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '../schema'
import { recordChange } from '../changeLog'

describe('recordChange', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  it('writes one row per call with correct shape', async () => {
    await recordChange({
      entityType: 'LIST',
      entityId: 'list-1',
      operationType: 'CREATE',
      userId: 'guest-x',
      changes: { name: { from: null, to: 'Test' } },
    })
    const all = await db.changes.toArray()
    expect(all).toHaveLength(1)
    const row = all[0]
    expect(row.entityType).toBe('LIST')
    expect(row.entityId).toBe('list-1')
    expect(row.operationType).toBe('CREATE')
    expect(row.userId).toBe('guest-x')
    expect(row.synced).toBe(false)
    expect(row.syncAttempts).toBe(0)
    expect(row.createdAt).toBeGreaterThan(0)
    expect(row.id).toBeTruthy()
  })

  it('writes multiple rows with unique ids', async () => {
    await recordChange({
      entityType: 'ITEM', entityId: 'i1', operationType: 'CREATE',
      userId: 'u', changes: {},
    })
    await recordChange({
      entityType: 'ITEM', entityId: 'i2', operationType: 'CREATE',
      userId: 'u', changes: {},
    })
    const all = await db.changes.toArray()
    expect(all).toHaveLength(2)
    expect(new Set(all.map((r) => r.id)).size).toBe(2)
  })
})
