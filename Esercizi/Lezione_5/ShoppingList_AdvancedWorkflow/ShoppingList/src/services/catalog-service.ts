// src/services/catalog-service.ts
// Business logic per il catalogo locale articoli.
// - getSuggestions: read-only, usato dall'autocomplete UI
// - recordUsage: write, chiamato DENTRO la transaction di itemService.createItem
//
// Upsert per nome normalizzato: frequency++ e lastUsedAt aggiornato.
// Default (category/unit/quantity) aggiornati solo se null o se > 30 giorni (stale).
// NON scrive su changeLog (architettura §D.3).

import type { Transaction } from 'dexie'
import type { CatalogItem, Category, UnitOfMeasure } from '@/db/types'
import type { AppResult } from '@/types/ui'
import { catalogRepository } from '@/repositories/catalog-repository'
import { generateId } from '@/utils/id-utils'
import { getCurrentUserId } from '@/stores/auth-store'
import { mapDbError } from './_internal/map-db-error'

const MIN_QUERY_LENGTH = 2
const STALE_DEFAULT_MS = 30 * 24 * 60 * 60 * 1000 // 30 giorni

export type CatalogDefaults = {
  category: Category | null
  unit: UnitOfMeasure | null
  quantity: number | null
}

async function getSuggestions(query: string, limit = 5): Promise<AppResult<CatalogItem[]>> {
  try {
    const userId = getCurrentUserId()
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      const top = await catalogRepository.topByFrequency(userId, limit)
      return { data: top, error: null }
    }
    const results = await catalogRepository.searchByPrefix(trimmed.toLowerCase(), userId, limit)
    return { data: results, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

/**
 * Deve essere chiamata DENTRO la transaction di itemService.createItem.
 * - Se il nome normalizzato esiste: frequency++, lastUsedAt=now, default aggiornati se null o stale.
 * - Altrimenti: add nuovo CatalogItem con frequency=1.
 *
 * Non propaga errori: se la scrittura fallisce, l'errore risale al caller (che rollbacka la tx).
 */
async function recordUsage(
  rawName: string,
  defaults: CatalogDefaults,
  tx: Transaction,
): Promise<void> {
  const normalizedName = rawName.trim().toLowerCase()
  if (normalizedName.length === 0) return

  const now = Date.now()
  const userId = getCurrentUserId()
  const existing = await catalogRepository.getByName(normalizedName, tx)

  if (existing) {
    const updates: Partial<CatalogItem> = {
      frequency: existing.frequency + 1,
      lastUsedAt: now,
    }
    const stale = now - existing.lastUsedAt > STALE_DEFAULT_MS
    if ((existing.defaultCategory === null || stale) && defaults.category !== null) {
      updates.defaultCategory = defaults.category
    }
    if ((existing.defaultUnit === null || stale) && defaults.unit !== null) {
      updates.defaultUnit = defaults.unit
    }
    if ((existing.defaultQuantity === null || stale) && defaults.quantity !== null) {
      updates.defaultQuantity = defaults.quantity
    }
    await catalogRepository.update(existing.id, updates, tx)
    return
  }

  const entry: CatalogItem = {
    id: generateId(),
    userId,
    name: normalizedName,
    frequency: 1,
    lastUsedAt: now,
    defaultCategory: defaults.category,
    defaultUnit: defaults.unit,
    defaultQuantity: defaults.quantity,
  }
  await catalogRepository.add(entry, tx)
}

export const catalogService = {
  getSuggestions,
  recordUsage,
}
