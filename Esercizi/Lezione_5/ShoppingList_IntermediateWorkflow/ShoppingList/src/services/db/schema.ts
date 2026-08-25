import Dexie, { type Table } from 'dexie'
import type { List, Item, ItemCatalog, Invite, GuestSession } from '../../types/domain'
import type { ChangeLog } from '../../types/sync'

export class ShoppingListDB extends Dexie {
  lists!: Table<List, string>
  items!: Table<Item, string>
  changes!: Table<ChangeLog, string>
  catalog!: Table<ItemCatalog, string>
  invites!: Table<Invite, string>
  session!: Table<GuestSession, 'current'>

  constructor() {
    super('ShoppingListDB')

    // v1 — Sprint 0 baseline, FROZEN
    this.version(1).stores({
      lists:    '&id, ownerId, status, updatedAt',
      items:    '&id, listId, status, category, updatedAt, [listId+deletedAt]',
      changes:  '&id, entityType, entityId, synced, createdAt',
      catalog:  '&id, &name, lastUsedAt',
      invites:  '&id, listId, token, expiresAt',
    })

    // v2 — Sprint 1
    this.version(2).stores({
      lists:    '&id, ownerId, status, updatedAt, localOnly',
      items:    '&id, listId, status, category, updatedAt, sortOrder, ' +
                '[listId+deletedAt], [listId+sortOrder], [listId+status]',
      changes:  '&id, entityType, entityId, synced, createdAt, [synced+createdAt]',
      catalog:  '&id, &name, lastUsedAt',
      invites:  '&id, listId, token, expiresAt',
      session:  '&id',
    }).upgrade(async (tx) => {
      const now = Date.now()
      await tx.table('lists').toCollection().modify((l: Record<string, unknown>) => {
        l.isTemplate ??= false
        l.sharedWith ??= []
        l.syncedAt ??= null
        l.localOnly ??= true
        if (l.status === 'active') l.status = 'ACTIVE'
        if (l.status === 'archived') l.status = 'ARCHIVED'
      })
      await tx.table('items').toCollection().modify((i: Record<string, unknown>) => {
        i.quantity ??= null
        i.unit ??= null
        i.notes ??= null
        i.sortOrder ??= now
        i.completedAt ??= null
        i.createdBy ??= 'guest-legacy'
        i.updatedBy ??= 'guest-legacy'
        if (i.status === 'pending') i.status = 'DA_COMPRARE'
        if (i.status === 'completed') i.status = 'COMPLETATO'
      })
    })
  }
}

export const db = new ShoppingListDB()
