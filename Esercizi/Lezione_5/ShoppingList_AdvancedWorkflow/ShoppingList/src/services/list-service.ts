// src/services/list-service.ts
// Business logic per la gestione delle liste della spesa.
// Ogni mutazione è atomica (Dexie rw transaction su lists + changeLog [+ items]).
// Validazione fail-fast PRIMA della transazione. DomainError dentro la tx → rollback.

import { db } from '@/db/database'
import type { List, ChangeLogEntry, Item } from '@/db/types'
import type { AppResult } from '@/types/ui'
import { listRepository } from '@/repositories/list-repository'
import { itemRepository } from '@/repositories/item-repository'
import { changeLogRepository } from '@/repositories/change-log-repository'
import { validateListName } from '@/utils/validation'
import { generateId } from '@/utils/id-utils'
import { buildDiff } from '@/utils/diff'
import { getCurrentUserId } from '@/stores/auth-store'
import { DomainError } from './_internal/domain-error'
import { mapDbError } from './_internal/map-db-error'

const LIST_DIFF_IGNORE: (keyof List)[] = [
  'id',
  'userId',
  'createdAt',
  'sharedWith',
  'itemOrder',
  'syncedAt',
]

async function createList(input: { name: string }): Promise<AppResult<List>> {
  const validationError = validateListName(input.name)
  if (validationError) return { data: null, error: validationError }

  const userId = getCurrentUserId()
  const now = Date.now()
  const id = generateId()
  const trimmed = input.name.trim()

  const newList: List = {
    id,
    name: trimmed,
    userId,
    status: 'active',
    isTemplate: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    sharedWith: [],
    itemOrder: [],
    syncedAt: null,
  }

  try {
    await db.transaction('rw', db.lists, db.changeLog, async (tx) => {
      await listRepository.create(newList, tx)
      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'CREATE',
        entityType: 'LIST',
        entityId: id,
        changes: { before: null, after: newList },
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)
    })
    return { data: newList, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

async function updateList(
  id: string,
  changes: { name: string },
): Promise<AppResult<List>> {
  const validationError = validateListName(changes.name)
  if (validationError) return { data: null, error: validationError }

  const userId = getCurrentUserId()
  const now = Date.now()
  const trimmed = changes.name.trim()

  try {
    const updated = await db.transaction('rw', db.lists, db.changeLog, async (tx) => {
      const before = await listRepository.getById(id, tx)
      if (!before || before.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Lista ${id} non trovata`)
      }

      const updatedList: List = { ...before, name: trimmed, updatedAt: now }
      await listRepository.update(id, { name: trimmed, updatedAt: now }, tx)

      const diff = buildDiff(before, updatedList, LIST_DIFF_IGNORE)
      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'UPDATE',
        entityType: 'LIST',
        entityId: id,
        changes: diff,
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)
      return updatedList
    })
    return { data: updated, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

async function setListStatus(
  id: string,
  newStatus: 'active' | 'archived',
): Promise<AppResult<List>> {
  const userId = getCurrentUserId()
  const now = Date.now()

  try {
    const updated = await db.transaction('rw', db.lists, db.changeLog, async (tx) => {
      const before = await listRepository.getById(id, tx)
      if (!before || before.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Lista ${id} non trovata`)
      }

      const updatedList: List = { ...before, status: newStatus, updatedAt: now }
      await listRepository.update(id, { status: newStatus, updatedAt: now }, tx)

      const diff = buildDiff(before, updatedList, LIST_DIFF_IGNORE)
      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'UPDATE',
        entityType: 'LIST',
        entityId: id,
        changes: diff,
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)
      return updatedList
    })
    return { data: updated, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

const archiveList = (id: string): Promise<AppResult<List>> => setListStatus(id, 'archived')
const unarchiveList = (id: string): Promise<AppResult<List>> => setListStatus(id, 'active')

async function deleteList(id: string): Promise<AppResult<void>> {
  const userId = getCurrentUserId()
  const now = Date.now()

  try {
    await db.transaction('rw', db.lists, db.items, db.changeLog, async (tx) => {
      const listBefore = await listRepository.getById(id, tx)
      if (!listBefore || listBefore.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Lista ${id} non trovata o già cancellata`)
      }

      const itemsBefore = await itemRepository.listActiveInList(id, tx)

      await listRepository.update(id, { deletedAt: now, updatedAt: now }, tx)

      await tx
        .table<Item>('items')
        .where('listId')
        .equals(id)
        .and((i) => i.deletedAt === null)
        .modify({ deletedAt: now, updatedAt: now })

      const logEntries: ChangeLogEntry[] = [
        {
          id: generateId(),
          userId,
          timestamp: now,
          operationType: 'DELETE',
          entityType: 'LIST',
          entityId: id,
          changes: { before: listBefore, after: { deletedAt: now, updatedAt: now } },
          synced: false,
          syncedAt: null,
          conflictResolution: null,
        },
        ...itemsBefore.map<ChangeLogEntry>((item) => ({
          id: generateId(),
          userId,
          timestamp: now,
          operationType: 'DELETE',
          entityType: 'ITEM',
          entityId: item.id,
          changes: { before: item, after: { deletedAt: now, updatedAt: now } },
          synced: false,
          syncedAt: null,
          conflictResolution: null,
        })),
      ]
      await changeLogRepository.appendMany(logEntries, tx)
    })
    return { data: undefined, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

export const listService = {
  createList,
  updateList,
  archiveList,
  unarchiveList,
  deleteList,
}
