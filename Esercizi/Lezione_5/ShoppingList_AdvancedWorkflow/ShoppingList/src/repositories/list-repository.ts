// src/repositories/list-repository.ts
// Thin wrapper su Dexie per la tabella lists.
// REGOLE: no business logic, no validazione, no changeLog.

import { db } from '@/db/database'
import type { List } from '@/db/types'
import type { Table, Transaction } from 'dexie'

function listsTable(tx?: Transaction): Table<List, string> {
  if (tx) {
    return tx.table<List, string>('lists')
  }
  return db.lists
}

export const listRepository = {
  async create(list: List, tx?: Transaction): Promise<void> {
    await listsTable(tx).add(list)
  },

  async getById(id: string, tx?: Transaction): Promise<List | undefined> {
    return listsTable(tx).get(id)
  },

  async update(id: string, changes: Partial<List>, tx?: Transaction): Promise<number> {
    return listsTable(tx).update(id, changes)
  },

  async listByUser(userId: string): Promise<List[]> {
    const items = await db.lists
      .where('userId').equals(userId)
      .and(l => l.deletedAt === null && l.status === 'active')
      .toArray()
    return items.sort((a, b) => b.updatedAt - a.updatedAt)
  },

  async listArchivedByUser(userId: string): Promise<List[]> {
    const items = await db.lists
      .where('userId').equals(userId)
      .and(l => l.deletedAt === null && l.status === 'archived')
      .toArray()
    return items.sort((a, b) => b.updatedAt - a.updatedAt)
  },
}
