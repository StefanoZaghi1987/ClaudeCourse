import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '../schema'
import { createList } from '../lists'
import {
  createItem, updateItem, toggleItemStatus, softDeleteItem, restoreItem, reorderItems,
  queryActiveItems, queryTrashedItems,
} from '../items'

async function mkList(): Promise<string> {
  const r = await createList({ name: 'L' })
  if (!r.ok) throw new Error('setup failed')
  return r.data.id
}

describe('items repository', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  describe('createItem', () => {
    it('creates DA_COMPRARE item with sortOrder = 1000 for first item', async () => {
      const listId = await mkList()
      const r = await createItem({
        listId, name: 'pane',
        quantity: null, unit: null, notes: null, category: null,
      })
      expect(r.ok).toBe(true)
      if (r.ok) {
        expect(r.data.status).toBe('DA_COMPRARE')
        expect(r.data.sortOrder).toBe(1000)
        expect(r.data.completedAt).toBeNull()
        expect(r.data.deletedAt).toBeNull()
      }
    })

    it('assigns incremental sortOrder for subsequent items', async () => {
      const listId = await mkList()
      const a = await createItem({ listId, name: 'a', quantity: null, unit: null, notes: null, category: null })
      const b = await createItem({ listId, name: 'b', quantity: null, unit: null, notes: null, category: null })
      if (!a.ok || !b.ok) throw new Error('setup failed')
      expect(b.data.sortOrder).toBe(2000)
    })
  })

  describe('toggleItemStatus', () => {
    it('flips DA_COMPRARE -> COMPLETATO and sets completedAt', async () => {
      const listId = await mkList()
      const r = await createItem({ listId, name: 'x', quantity: null, unit: null, notes: null, category: null })
      if (!r.ok) throw new Error('setup failed')
      const toggled = await toggleItemStatus(r.data.id)
      expect(toggled.ok).toBe(true)
      if (toggled.ok) {
        expect(toggled.data.status).toBe('COMPLETATO')
        expect(toggled.data.completedAt).not.toBeNull()
      }
    })

    it('flips back and clears completedAt', async () => {
      const listId = await mkList()
      const r = await createItem({ listId, name: 'x', quantity: null, unit: null, notes: null, category: null })
      if (!r.ok) throw new Error('setup failed')
      await toggleItemStatus(r.data.id)
      const back = await toggleItemStatus(r.data.id)
      expect(back.ok).toBe(true)
      if (back.ok) {
        expect(back.data.status).toBe('DA_COMPRARE')
        expect(back.data.completedAt).toBeNull()
      }
    })
  })

  describe('softDeleteItem + restoreItem', () => {
    it('sets deletedAt and hides from active query', async () => {
      const listId = await mkList()
      const r = await createItem({ listId, name: 'x', quantity: null, unit: null, notes: null, category: null })
      if (!r.ok) throw new Error('setup failed')
      await softDeleteItem(r.data.id)

      const active = await queryActiveItems(listId)
      expect(active).toHaveLength(0)

      const trashed = await queryTrashedItems()
      expect(trashed).toHaveLength(1)
      expect(trashed[0].deletedAt).not.toBeNull()
    })

    it('restores item and clears deletedAt', async () => {
      const listId = await mkList()
      const r = await createItem({ listId, name: 'x', quantity: null, unit: null, notes: null, category: null })
      if (!r.ok) throw new Error('setup failed')
      await softDeleteItem(r.data.id)
      const restored = await restoreItem(r.data.id)
      expect(restored.ok).toBe(true)
      if (restored.ok) expect(restored.data.deletedAt).toBeNull()

      const active = await queryActiveItems(listId)
      expect(active).toHaveLength(1)
    })
  })

  describe('reorderItems', () => {
    it('reassigns sortOrder and writes one changeLog per moved item', async () => {
      const listId = await mkList()
      const a = await createItem({ listId, name: 'a', quantity: null, unit: null, notes: null, category: null })
      const b = await createItem({ listId, name: 'b', quantity: null, unit: null, notes: null, category: null })
      const c = await createItem({ listId, name: 'c', quantity: null, unit: null, notes: null, category: null })
      if (!a.ok || !b.ok || !c.ok) throw new Error('setup failed')

      const changesBefore = await db.changes.count()
      await reorderItems(listId, [c.data.id, a.data.id, b.data.id])
      const changesAfter = await db.changes.count()

      // c: 3000 -> 1000, a: 1000 -> 2000, b: 2000 -> 3000 = 3 moves
      expect(changesAfter - changesBefore).toBe(3)

      const items = await queryActiveItems(listId)
      expect(items.map((i) => i.name)).toEqual(['c', 'a', 'b'])
    })

    it('is a no-op for items already in target order', async () => {
      const listId = await mkList()
      const a = await createItem({ listId, name: 'a', quantity: null, unit: null, notes: null, category: null })
      if (!a.ok) throw new Error('setup failed')

      const changesBefore = await db.changes.count()
      await reorderItems(listId, [a.data.id])
      const changesAfter = await db.changes.count()
      expect(changesAfter - changesBefore).toBe(0)
    })
  })

  describe('updateItem', () => {
    it('updates fields and writes diffed changeLog', async () => {
      const listId = await mkList()
      const r = await createItem({ listId, name: 'x', quantity: null, unit: null, notes: null, category: null })
      if (!r.ok) throw new Error('setup failed')
      await updateItem(r.data.id, { quantity: 3, notes: 'fresche' })

      const updated = await db.items.get(r.data.id)
      expect(updated?.quantity).toBe(3)
      expect(updated?.notes).toBe('fresche')
    })
  })
})
