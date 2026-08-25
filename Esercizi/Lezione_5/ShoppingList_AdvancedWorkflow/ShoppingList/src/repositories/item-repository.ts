// src/repositories/item-repository.ts
// Thin wrapper su Dexie per la tabella items.

import { db } from '@/db/database'
import type { Item } from '@/db/types'
import type { Table, Transaction } from 'dexie'

function itemsTable(tx?: Transaction): Table<Item, string> {
  if (tx) {
    return tx.table<Item, string>('items')
  }
  return db.items
}

export const itemRepository = {
  async create(item: Item, tx?: Transaction): Promise<void> {
    await itemsTable(tx).add(item)
  },

  async getById(id: string, tx?: Transaction): Promise<Item | undefined> {
    return itemsTable(tx).get(id)
  },

  async update(id: string, changes: Partial<Item>, tx?: Transaction): Promise<number> {
    return itemsTable(tx).update(id, changes)
  },

  /**
   * Read reattiva per UI: articoli attivi, ordinati per sortOrder asc.
   * NON accetta tx — pensato per useLiveQuery fuori transazione.
   * Per snapshot dentro una transazione usa `listActiveInList`.
   */
  async listActiveByList(listId: string): Promise<Item[]> {
    return db.items
      .where('listId').equals(listId)
      .and(i => i.deletedAt === null)
      .sortBy('sortOrder')
  },

  /** Read reattiva per cestino UI: articoli soft-deleted, ordinati per deletedAt desc. */
  async listDeletedByList(listId: string): Promise<Item[]> {
    const items = await db.items
      .where('listId').equals(listId)
      .and(i => i.deletedAt !== null)
      .toArray()
    return items.sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
  },

  /** Usato dentro transazione per calcolare il prossimo sortOrder su create. */
  async getMaxSortOrder(listId: string, tx?: Transaction): Promise<number> {
    const all = await itemsTable(tx)
      .where('listId').equals(listId)
      .toArray()
    if (all.length === 0) return 0
    return Math.max(...all.map(i => i.sortOrder))
  },

  /**
   * Snapshot NON ordinato pensato per l'uso DENTRO una transazione (cascade delete).
   * Non usare per UI: preferire `listActiveByList` che è ordinato e reattivo.
   */
  async listActiveInList(listId: string, tx?: Transaction): Promise<Item[]> {
    return itemsTable(tx)
      .where('listId').equals(listId)
      .and(i => i.deletedAt === null)
      .toArray()
  },
}
