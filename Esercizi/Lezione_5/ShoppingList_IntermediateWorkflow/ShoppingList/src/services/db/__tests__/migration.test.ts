import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Dexie from 'dexie'
import { db } from '../schema'

class V1Seed extends Dexie {
  constructor() {
    super('ShoppingListDB')
    this.version(1).stores({
      lists:    '&id, ownerId, status, updatedAt',
      items:    '&id, listId, status, category, updatedAt, [listId+deletedAt]',
      changes:  '&id, entityType, entityId, synced, createdAt',
      catalog:  '&id, &name, lastUsedAt',
      invites:  '&id, listId, token, expiresAt',
    })
  }
}

describe('Dexie v1 -> v2 migration', () => {
  beforeEach(async () => {
    await Dexie.delete('ShoppingListDB')
  })
  afterEach(async () => {
    await Dexie.delete('ShoppingListDB')
  })

  it('backfills missing fields on v1 lists rows', async () => {
    const v1 = new V1Seed()
    await v1.open()
    await v1.table('lists').add({
      id: 'l1',
      name: 'Spesa',
      ownerId: 'guest-legacy',
      status: 'active',
      createdAt: 100,
      updatedAt: 200,
    })
    v1.close()

    await db.open()
    const list = await db.lists.get('l1')
    expect(list).toBeDefined()
    expect(list!.status).toBe('ACTIVE')
    expect(list!.isTemplate).toBe(false)
    expect(list!.sharedWith).toEqual([])
    expect(list!.syncedAt).toBeNull()
    expect(list!.localOnly).toBe(true)
    expect(list!.name).toBe('Spesa')
  })

  it('backfills missing fields on v1 items rows and maps statuses', async () => {
    const v1 = new V1Seed()
    await v1.open()
    await v1.table('items').add({
      id: 'i1',
      listId: 'l1',
      name: 'pane',
      status: 'pending',
      category: null,
      createdAt: 100,
      updatedAt: 200,
      deletedAt: null,
    })
    await v1.table('items').add({
      id: 'i2',
      listId: 'l1',
      name: 'latte',
      status: 'completed',
      category: null,
      createdAt: 100,
      updatedAt: 200,
      deletedAt: null,
    })
    v1.close()

    await db.open()
    const i1 = await db.items.get('i1')
    const i2 = await db.items.get('i2')

    expect(i1!.status).toBe('DA_COMPRARE')
    expect(i2!.status).toBe('COMPLETATO')

    for (const item of [i1!, i2!]) {
      expect(item.quantity).toBeNull()
      expect(item.unit).toBeNull()
      expect(item.notes).toBeNull()
      expect(item.completedAt).toBeNull()
      expect(item.createdBy).toBe('guest-legacy')
      expect(item.updatedBy).toBe('guest-legacy')
      expect(typeof item.sortOrder).toBe('number')
    }
  })

  it('is idempotent: reopening v2 does not re-run upgrade', async () => {
    await db.open()
    await db.lists.add({
      id: 'l2',
      name: 'Casa',
      ownerId: 'u',
      status: 'ACTIVE',
      isTemplate: false,
      sharedWith: [],
      createdAt: 1,
      updatedAt: 1,
      syncedAt: null,
      localOnly: true,
    })
    db.close()

    await db.open()
    const list = await db.lists.get('l2')
    expect(list).toBeDefined()
    expect(list!.status).toBe('ACTIVE')
  })
})
