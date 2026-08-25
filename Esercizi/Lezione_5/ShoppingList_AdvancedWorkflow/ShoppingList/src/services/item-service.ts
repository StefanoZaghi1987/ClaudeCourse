// src/services/item-service.ts
// Business logic per la gestione degli articoli (items) delle liste.
// Ogni mutazione è atomica (Dexie rw transaction su items + changeLog [+ lists]).
// Validazione fail-fast PRIMA della transazione. DomainError dentro la tx → rollback.

import { db } from '@/db/database'
import type { Item, ItemStatus, ChangeLogEntry, UnitOfMeasure, Category } from '@/db/types'
import type { AppResult } from '@/types/ui'
import { itemRepository } from '@/repositories/item-repository'
import { listRepository } from '@/repositories/list-repository'
import { changeLogRepository } from '@/repositories/change-log-repository'
import { validateItemInput, validateItemPatch } from '@/utils/validation'
import { generateId } from '@/utils/id-utils'
import { buildDiff } from '@/utils/diff'
import { getCurrentUserId } from '@/stores/auth-store'
import { DomainError } from './_internal/domain-error'
import { mapDbError } from './_internal/map-db-error'
import { catalogService } from './catalog-service'

export type CreateItemInput = {
  listId: string
  name: string
  quantity?: number | null
  unit?: UnitOfMeasure | null
  category?: Category | null
  notes?: string | null
}

async function createItem(input: CreateItemInput): Promise<AppResult<Item>> {
  const validationError = validateItemInput({
    name: input.name,
    quantity: input.quantity,
    notes: input.notes,
  })
  if (validationError) return { data: null, error: validationError }

  const userId = getCurrentUserId()
  const now = Date.now()
  const id = generateId()
  const trimmedName = input.name.trim()

  try {
    const newItem = await db.transaction('rw', db.items, db.changeLog, db.itemCatalog, async (tx) => {
      const maxSort = await itemRepository.getMaxSortOrder(input.listId, tx)

      const item: Item = {
        id,
        listId: input.listId,
        name: trimmedName,
        quantity: input.quantity ?? null,
        unit: input.unit ?? null,
        notes: input.notes ?? null,
        category: input.category ?? null,
        status: 'pending',
        sortOrder: maxSort + 1,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      }

      await itemRepository.create(item, tx)

      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'CREATE',
        entityType: 'ITEM',
        entityId: id,
        changes: { before: null, after: item },
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)

      await catalogService.recordUsage(trimmedName, {
        category: input.category ?? null,
        unit: input.unit ?? null,
        quantity: input.quantity ?? null,
      }, tx)

      return item
    })
    return { data: newItem, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

export type UpdateItemInput = Partial<Pick<Item, 'name' | 'quantity' | 'unit' | 'category' | 'notes'>>

async function updateItem(id: string, changes: UpdateItemInput): Promise<AppResult<Item>> {
  const validationError = validateItemPatch(changes)
  if (validationError) return { data: null, error: validationError }

  const userId = getCurrentUserId()
  const now = Date.now()

  try {
    const updated = await db.transaction('rw', db.items, db.changeLog, async (tx) => {
      const before = await itemRepository.getById(id, tx)
      if (!before || before.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Articolo ${id} non trovato`)
      }

      const sanitized: Partial<Item> = {}
      if (changes.name !== undefined) sanitized.name = changes.name.trim()
      if (changes.quantity !== undefined) sanitized.quantity = changes.quantity
      if (changes.unit !== undefined) sanitized.unit = changes.unit
      if (changes.category !== undefined) sanitized.category = changes.category
      if (changes.notes !== undefined) sanitized.notes = changes.notes

      const updatedItem: Item = {
        ...before,
        ...sanitized,
        updatedAt: now,
        updatedBy: userId,
      }

      await itemRepository.update(id, { ...sanitized, updatedAt: now, updatedBy: userId }, tx)

      const diff = buildDiff(before, updatedItem, ['id', 'listId', 'createdAt', 'createdBy'])
      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'UPDATE',
        entityType: 'ITEM',
        entityId: id,
        changes: diff,
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)
      return updatedItem
    })
    return { data: updated, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

async function toggleItemStatus(itemId: string): Promise<AppResult<Item>> {
  const userId = getCurrentUserId()
  const now = Date.now()

  try {
    const updated = await db.transaction('rw', db.items, db.changeLog, async (tx) => {
      const before = await itemRepository.getById(itemId, tx)
      if (!before || before.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Articolo ${itemId} non trovato`)
      }

      const newStatus: ItemStatus = before.status === 'pending' ? 'completed' : 'pending'
      const newCompletedAt = newStatus === 'completed' ? now : null

      await itemRepository.update(
        itemId,
        {
          status: newStatus,
          completedAt: newCompletedAt,
          updatedAt: now,
          updatedBy: userId,
        },
        tx,
      )

      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'STATE_CHANGE',
        entityType: 'ITEM',
        entityId: itemId,
        changes: {
          before: { status: before.status, completedAt: before.completedAt } as Partial<Item>,
          after: { status: newStatus, completedAt: newCompletedAt } as Partial<Item>,
        },
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)

      return {
        ...before,
        status: newStatus,
        completedAt: newCompletedAt,
        updatedAt: now,
        updatedBy: userId,
      }
    })
    return { data: updated, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

async function deleteItem(id: string): Promise<AppResult<void>> {
  const userId = getCurrentUserId()
  const now = Date.now()

  try {
    await db.transaction('rw', db.items, db.changeLog, async (tx) => {
      const before = await itemRepository.getById(id, tx)
      if (!before || before.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Articolo ${id} non trovato`)
      }

      await itemRepository.update(id, { deletedAt: now, updatedAt: now, updatedBy: userId }, tx)

      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'DELETE',
        entityType: 'ITEM',
        entityId: id,
        changes: { before, after: { deletedAt: now, updatedAt: now } },
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)
    })
    return { data: undefined, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

async function restoreItem(id: string): Promise<AppResult<Item>> {
  const userId = getCurrentUserId()
  const now = Date.now()

  try {
    const restored = await db.transaction('rw', db.items, db.lists, db.changeLog, async (tx) => {
      const before = await itemRepository.getById(id, tx)
      if (!before || before.deletedAt === null) {
        throw new DomainError('NOT_FOUND', `Articolo ${id} non in cestino`)
      }

      const parentList = await listRepository.getById(before.listId, tx)
      if (!parentList || parentList.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Lista parent cancellata, restore non possibile`)
      }

      // Plan-compliant: restore sempre come 'pending'. Lo stato completed pre-delete
      // viene intenzionalmente perso — l'utente ripristina per ri-shoppare.
      const sanitized: Partial<Item> = {
        deletedAt: null,
        status: 'pending',
        completedAt: null,
        updatedAt: now,
        updatedBy: userId,
      }

      await itemRepository.update(id, sanitized, tx)

      const updatedItem: Item = { ...before, ...sanitized }
      const diff = buildDiff(before, updatedItem, ['id', 'listId', 'createdAt', 'createdBy'])

      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'UPDATE',
        entityType: 'ITEM',
        entityId: id,
        changes: diff,
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)
      return updatedItem
    })
    return { data: restored, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

export const itemService = {
  createItem,
  updateItem,
  toggleItemStatus,
  deleteItem,
  restoreItem,
}
