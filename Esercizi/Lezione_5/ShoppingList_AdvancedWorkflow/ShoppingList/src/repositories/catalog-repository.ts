// src/repositories/catalog-repository.ts
// Thin wrapper su Dexie per la tabella itemCatalog (catalogo articoli locale).
// NON scrive su changeLog: il catalogo è locale-only, NON sync (decisione architetturale §D.3).

import { db } from '@/db/database'
import type { CatalogItem } from '@/db/types'
import type { Table, Transaction } from 'dexie'

function catalogTable(tx?: Transaction): Table<CatalogItem, string> {
  if (tx) {
    return tx.table<CatalogItem, string>('itemCatalog')
  }
  return db.itemCatalog
}

export const catalogRepository = {
  /** Lookup per nome normalizzato (lowercase+trim). Case-sensitive: chiamante normalizza. */
  async getByName(name: string, tx?: Transaction): Promise<CatalogItem | undefined> {
    return catalogTable(tx).where('name').equals(name).first()
  },

  async add(entry: CatalogItem, tx?: Transaction): Promise<void> {
    await catalogTable(tx).add(entry)
  },

  async update(id: string, changes: Partial<CatalogItem>, tx?: Transaction): Promise<number> {
    return catalogTable(tx).update(id, changes)
  },

  /**
   * Prefix match sull'indice `&name` di Dexie.
   * Filtra per userId in memoria (in Sprint 1 c'è un solo user stub).
   * Ordina per frequency desc, lastUsedAt desc. Limita a `limit` risultati.
   */
  async searchByPrefix(prefix: string, userId: string, limit: number): Promise<CatalogItem[]> {
    const results = await db.itemCatalog
      .where('name').startsWithIgnoreCase(prefix)
      .toArray()
    return results
      .filter(r => r.userId === userId)
      .sort((a, b) => {
        if (b.frequency !== a.frequency) return b.frequency - a.frequency
        return b.lastUsedAt - a.lastUsedAt
      })
      .slice(0, limit)
  },

  /** Top per frequency, usato quando la query è troppo corta per un prefix match utile. */
  async topByFrequency(userId: string, limit: number): Promise<CatalogItem[]> {
    const all = await db.itemCatalog.where('userId').equals(userId).toArray()
    return all
      .sort((a, b) => {
        if (b.frequency !== a.frequency) return b.frequency - a.frequency
        return b.lastUsedAt - a.lastUsedAt
      })
      .slice(0, limit)
  },
}
