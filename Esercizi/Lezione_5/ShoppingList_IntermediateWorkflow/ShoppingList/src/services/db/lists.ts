import { db } from './schema'
import { recordChange } from './changeLog'
import { getCurrentUserId } from './session'
import { newId } from '../../utils/id'
import type { List, ListStatus } from '../../types/domain'
import { ok, err, toAppError, type Result, type AppError } from '../../utils/result'

interface CreateListInput { name: string }
interface UpdateListInput { name?: string; status?: ListStatus }

export async function createList(input: CreateListInput): Promise<Result<List, AppError>> {
  try {
    const userId = await getCurrentUserId()
    const now = Date.now()
    const list: List = {
      id: newId(),
      name: input.name.trim(),
      ownerId: userId,
      status: 'ACTIVE',
      isTemplate: false,
      sharedWith: [],
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      localOnly: true,
    }
    await db.transaction('rw', db.lists, db.changes, async () => {
      await db.lists.add(list)
      await recordChange({
        entityType: 'LIST',
        entityId: list.id,
        operationType: 'CREATE',
        userId,
        changes: { name: { from: null, to: list.name } },
      })
    })
    return ok(list)
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function updateList(
  id: string,
  patch: UpdateListInput
): Promise<Result<List, AppError>> {
  try {
    const userId = await getCurrentUserId()
    return await db.transaction('rw', db.lists, db.changes, async () => {
      const current = await db.lists.get(id)
      if (!current) return err({ code: 'NOT_FOUND' as const, message: `List ${id} not found` })

      const next: List = {
        ...current,
        ...(patch.name !== undefined && { name: patch.name.trim() }),
        ...(patch.status !== undefined && { status: patch.status }),
        updatedAt: Date.now(),
      }

      const diff: Record<string, { from: unknown; to: unknown }> = {}
      if (patch.name !== undefined && patch.name.trim() !== current.name) {
        diff.name = { from: current.name, to: next.name }
      }
      if (patch.status !== undefined && patch.status !== current.status) {
        diff.status = { from: current.status, to: next.status }
      }
      if (Object.keys(diff).length === 0) return ok(current)

      await db.lists.put(next)
      await recordChange({
        entityType: 'LIST',
        entityId: id,
        operationType: patch.status !== undefined ? 'STATE_CHANGE' : 'UPDATE',
        userId,
        changes: diff,
      })
      return ok(next)
    })
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function deleteList(id: string): Promise<Result<void, AppError>> {
  try {
    const userId = await getCurrentUserId()
    return await db.transaction('rw', db.lists, db.items, db.changes, async () => {
      const existing = await db.lists.get(id)
      if (!existing) return err({ code: 'NOT_FOUND' as const, message: `List ${id} not found` })

      await db.items.where('listId').equals(id).delete()
      await db.lists.delete(id)
      await recordChange({
        entityType: 'LIST',
        entityId: id,
        operationType: 'DELETE',
        userId,
        changes: { deleted: { from: false, to: true } },
      })
      return ok(undefined as void)
    })
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export const queryActiveLists = () =>
  db.lists.where('status').equals('ACTIVE').reverse().sortBy('updatedAt')

export const queryArchivedLists = () =>
  db.lists.where('status').equals('ARCHIVED').reverse().sortBy('updatedAt')

export const getListById = (id: string) => db.lists.get(id)
