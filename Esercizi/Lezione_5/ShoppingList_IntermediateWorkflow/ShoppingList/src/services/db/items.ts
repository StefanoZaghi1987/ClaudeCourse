import { db } from './schema'
import { recordChange } from './changeLog'
import { getCurrentUserId } from './session'
import { newId } from '../../utils/id'
import type { Item, ItemStatus } from '../../types/domain'
import { ok, err, toAppError, type Result, type AppError } from '../../utils/result'

interface CreateItemInput {
  listId: string
  name: string
  quantity: number | null
  unit: string | null
  notes: string | null
  category: string | null
}

interface UpdateItemInput {
  name?: string
  quantity?: number | null
  unit?: string | null
  notes?: string | null
  category?: string | null
}

async function nextSortOrder(listId: string): Promise<number> {
  const siblings = await db.items.where('listId').equals(listId).toArray()
  if (siblings.length === 0) return 1000
  return Math.max(...siblings.map((s) => s.sortOrder)) + 1000
}

export async function createItem(input: CreateItemInput): Promise<Result<Item, AppError>> {
  try {
    const userId = await getCurrentUserId()
    const now = Date.now()
    const item: Item = {
      id: newId(),
      listId: input.listId,
      name: input.name.trim(),
      quantity: input.quantity,
      unit: input.unit,
      notes: input.notes,
      category: input.category,
      status: 'DA_COMPRARE',
      deletedAt: null,
      sortOrder: await nextSortOrder(input.listId),
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      createdBy: userId,
      updatedBy: userId,
    }
    await db.transaction('rw', db.items, db.changes, async () => {
      await db.items.add(item)
      await recordChange({
        entityType: 'ITEM',
        entityId: item.id,
        operationType: 'CREATE',
        userId,
        changes: { name: { from: null, to: item.name } },
      })
    })
    return ok(item)
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function updateItem(id: string, patch: UpdateItemInput): Promise<Result<Item, AppError>> {
  try {
    const userId = await getCurrentUserId()
    return await db.transaction('rw', db.items, db.changes, async () => {
      const current = await db.items.get(id)
      if (!current) return err({ code: 'NOT_FOUND' as const, message: `Item ${id} not found` })

      const next: Item = {
        ...current,
        ...(patch.name !== undefined && { name: patch.name.trim() }),
        ...(patch.quantity !== undefined && { quantity: patch.quantity }),
        ...(patch.unit !== undefined && { unit: patch.unit }),
        ...(patch.notes !== undefined && { notes: patch.notes }),
        ...(patch.category !== undefined && { category: patch.category }),
        updatedAt: Date.now(),
        updatedBy: userId,
      }

      const diff: Record<string, { from: unknown; to: unknown }> = {}
      for (const key of ['name', 'quantity', 'unit', 'notes', 'category'] as const) {
        if (patch[key] !== undefined && next[key] !== current[key]) {
          diff[key] = { from: current[key], to: next[key] }
        }
      }
      if (Object.keys(diff).length === 0) return ok(current)

      await db.items.put(next)
      await recordChange({
        entityType: 'ITEM',
        entityId: id,
        operationType: 'UPDATE',
        userId,
        changes: diff,
      })
      return ok(next)
    })
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function toggleItemStatus(id: string): Promise<Result<Item, AppError>> {
  try {
    const userId = await getCurrentUserId()
    return await db.transaction('rw', db.items, db.changes, async () => {
      const current = await db.items.get(id)
      if (!current) return err({ code: 'NOT_FOUND' as const, message: `Item ${id} not found` })

      const nextStatus: ItemStatus = current.status === 'DA_COMPRARE' ? 'COMPLETATO' : 'DA_COMPRARE'
      const now = Date.now()
      const next: Item = {
        ...current,
        status: nextStatus,
        completedAt: nextStatus === 'COMPLETATO' ? now : null,
        updatedAt: now,
        updatedBy: userId,
      }
      await db.items.put(next)
      await recordChange({
        entityType: 'ITEM',
        entityId: id,
        operationType: 'STATE_CHANGE',
        userId,
        changes: { status: { from: current.status, to: nextStatus } },
      })
      return ok(next)
    })
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function softDeleteItem(id: string): Promise<Result<Item, AppError>> {
  try {
    const userId = await getCurrentUserId()
    return await db.transaction('rw', db.items, db.changes, async () => {
      const current = await db.items.get(id)
      if (!current) return err({ code: 'NOT_FOUND' as const, message: `Item ${id} not found` })

      const next: Item = {
        ...current,
        deletedAt: Date.now(),
        updatedAt: Date.now(),
        updatedBy: userId,
      }
      await db.items.put(next)
      await recordChange({
        entityType: 'ITEM',
        entityId: id,
        operationType: 'DELETE',
        userId,
        changes: { deletedAt: { from: null, to: next.deletedAt } },
      })
      return ok(next)
    })
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function restoreItem(id: string): Promise<Result<Item, AppError>> {
  try {
    const userId = await getCurrentUserId()
    return await db.transaction('rw', db.items, db.changes, async () => {
      const current = await db.items.get(id)
      if (!current) return err({ code: 'NOT_FOUND' as const, message: `Item ${id} not found` })

      const prevDeletedAt = current.deletedAt
      const next: Item = {
        ...current,
        deletedAt: null,
        updatedAt: Date.now(),
        updatedBy: userId,
      }
      await db.items.put(next)
      await recordChange({
        entityType: 'ITEM',
        entityId: id,
        operationType: 'UPDATE',
        userId,
        changes: { deletedAt: { from: prevDeletedAt, to: null } },
      })
      return ok(next)
    })
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function reorderItems(
  _listId: string,
  orderedIds: string[]
): Promise<Result<void, AppError>> {
  try {
    const userId = await getCurrentUserId()
    return await db.transaction('rw', db.items, db.changes, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i]
        const current = await db.items.get(id)
        if (!current) continue
        const newSort = (i + 1) * 1000
        if (current.sortOrder === newSort) continue
        await db.items.put({ ...current, sortOrder: newSort, updatedAt: Date.now(), updatedBy: userId })
        await recordChange({
          entityType: 'ITEM',
          entityId: id,
          operationType: 'UPDATE',
          userId,
          changes: { sortOrder: { from: current.sortOrder, to: newSort } },
        })
      }
      return ok(undefined as void)
    })
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

// Queries — use filter approach to avoid Dexie TS issues with null in compound keys
export const queryActiveItems = (listId: string) =>
  db.items
    .where('listId').equals(listId)
    .filter((i) => i.deletedAt === null)
    .sortBy('sortOrder')

export const queryTrashedItems = () =>
  db.items
    .filter((i) => i.deletedAt !== null)
    .toArray()
    .then((arr) => arr.sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0)))

export const getItemById = (id: string) => db.items.get(id)
