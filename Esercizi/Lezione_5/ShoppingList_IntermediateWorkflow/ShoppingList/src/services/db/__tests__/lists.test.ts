import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '../schema'
import { createList, updateList, deleteList, queryActiveLists, queryArchivedLists } from '../lists'

describe('lists repository', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  describe('createList', () => {
    it('creates an active list with canonical shape', async () => {
      const r = await createList({ name: '  Spesa  ' })
      expect(r.ok).toBe(true)
      if (r.ok) {
        expect(r.data.name).toBe('Spesa')
        expect(r.data.status).toBe('ACTIVE')
        expect(r.data.isTemplate).toBe(false)
        expect(r.data.sharedWith).toEqual([])
        expect(r.data.localOnly).toBe(true)
        expect(r.data.syncedAt).toBeNull()
        expect(r.data.ownerId).toMatch(/^guest-/)
      }
    })

    it('writes one CREATE changeLog row', async () => {
      await createList({ name: 'Test' })
      const changes = await db.changes.toArray()
      expect(changes).toHaveLength(1)
      expect(changes[0].operationType).toBe('CREATE')
      expect(changes[0].entityType).toBe('LIST')
    })
  })

  describe('updateList', () => {
    it('renames and writes an UPDATE changeLog', async () => {
      const created = await createList({ name: 'Old' })
      if (!created.ok) throw new Error('setup failed')

      const r = await updateList(created.data.id, { name: 'New' })
      expect(r.ok).toBe(true)
      if (r.ok) expect(r.data.name).toBe('New')

      const changes = await db.changes.filter(c => c.operationType === 'UPDATE').toArray()
      expect(changes).toHaveLength(1)
      expect(changes[0].changes.name).toEqual({ from: 'Old', to: 'New' })
    })

    it('archives and writes a STATE_CHANGE changeLog', async () => {
      const created = await createList({ name: 'L' })
      if (!created.ok) throw new Error('setup failed')
      const r = await updateList(created.data.id, { status: 'ARCHIVED' })
      expect(r.ok).toBe(true)
      const changes = await db.changes.filter(c => c.operationType === 'STATE_CHANGE').toArray()
      expect(changes).toHaveLength(1)
    })

    it('no-op when patch matches current', async () => {
      const created = await createList({ name: 'L' })
      if (!created.ok) throw new Error('setup failed')
      const before = await db.changes.count()
      await updateList(created.data.id, { name: 'L' })
      const after = await db.changes.count()
      expect(after).toBe(before)
    })

    it('returns NOT_FOUND for missing id', async () => {
      const r = await updateList('missing', { name: 'x' })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error.code).toBe('NOT_FOUND')
    })
  })

  describe('deleteList', () => {
    it('cascades delete to items', async () => {
      const created = await createList({ name: 'L' })
      if (!created.ok) throw new Error('setup failed')
      await db.items.add({
        id: 'i1', listId: created.data.id, name: 'x',
        quantity: null, unit: null, notes: null, category: null,
        status: 'DA_COMPRARE', deletedAt: null, sortOrder: 1000,
        createdAt: 1, updatedAt: 1, completedAt: null,
        createdBy: 'u', updatedBy: 'u',
      })

      const r = await deleteList(created.data.id)
      expect(r.ok).toBe(true)
      expect(await db.items.count()).toBe(0)
      expect(await db.lists.count()).toBe(0)
    })
  })

  describe('queryActiveLists / queryArchivedLists', () => {
    it('separates by status', async () => {
      const a = await createList({ name: 'A' })
      const b = await createList({ name: 'B' })
      if (!a.ok || !b.ok) throw new Error('setup failed')
      await updateList(b.data.id, { status: 'ARCHIVED' })

      const active = await queryActiveLists()
      const archived = await queryArchivedLists()
      expect(active.map((l) => l.name)).toEqual(['A'])
      expect(archived.map((l) => l.name)).toEqual(['B'])
    })
  })
})
