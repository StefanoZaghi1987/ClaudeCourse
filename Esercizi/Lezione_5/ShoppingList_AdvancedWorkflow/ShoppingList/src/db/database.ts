// src/db/database.ts
// Schema Dexie v1 — fonte autoritativa: docs/SoftwareRequirements.md Sezione 4.2
// REGOLA: MAI modificare una .version() già esistente.
// Nuove modifiche → nuova .version(N).stores({}).upgrade(...)

import Dexie, { type Table } from 'dexie'
import type { List, Item, ChangeLogEntry, CatalogItem, Invite } from '@/db/types'

export class ShoppingListDB extends Dexie {
  lists!: Table<List, string>
  items!: Table<Item, string>
  changeLog!: Table<ChangeLogEntry, string>
  itemCatalog!: Table<CatalogItem, string>
  invites!: Table<Invite, string>

  constructor() {
    super('ShoppingListDB')
    this.version(1).stores({
      lists: '&id, userId, updatedAt, status, isTemplate',
      items: '&id, listId, [listId+status], [listId+deletedAt], createdAt, updatedAt',
      changeLog: '&id, [userId+synced], entityType, entityId, timestamp',
      itemCatalog: '&id, &name, userId, frequency',
      invites: '&token, listId, status',
    })
  }
}

export const db = new ShoppingListDB()
