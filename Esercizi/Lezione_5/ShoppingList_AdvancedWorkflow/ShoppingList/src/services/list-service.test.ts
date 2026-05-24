import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/database'
import { listService } from '@/services/list-service'
import { itemRepository } from '@/repositories/item-repository'
import type { Item } from '@/db/types'

describe('listService.createList', () => {
  beforeEach(async () => {
    await db.lists.clear()
    await db.items.clear()
    await db.changeLog.clear()
  })

  it('happy path: crea lista e changeLog entry atomicamente', async () => {
    const result = await listService.createList({ name: 'Spesa settimanale' })
    expect(result.error).toBe(null)
    expect(result.data).not.toBe(null)
    expect(result.data!.name).toBe('Spesa settimanale')
    expect(result.data!.status).toBe('active')
    expect(result.data!.deletedAt).toBe(null)
    expect(result.data!.itemOrder).toEqual([])

    const listsInDb = await db.lists.toArray()
    expect(listsInDb).toHaveLength(1)
    expect(listsInDb[0]?.id).toBe(result.data!.id)

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0]?.operationType).toBe('CREATE')
    expect(log[0]?.entityType).toBe('LIST')
    expect(log[0]?.changes.before).toBe(null)
    expect(log[0]?.changes.after).toMatchObject({ name: 'Spesa settimanale' })
    expect(log[0]?.synced).toBe(false)
  })

  it('rifiuta nome vuoto con VALIDATION_ERROR e nessuna write', async () => {
    const result = await listService.createList({ name: '   ' })
    expect(result.data).toBe(null)
    expect(result.error?.code).toBe('VALIDATION_ERROR')
    expect(result.error?.details).toMatchObject({ field: 'name' })

    expect(await db.lists.count()).toBe(0)
    expect(await db.changeLog.count()).toBe(0)
  })

  it('rifiuta nome oltre 100 caratteri con VALIDATION_ERROR', async () => {
    const result = await listService.createList({ name: 'a'.repeat(101) })
    expect(result.error?.code).toBe('VALIDATION_ERROR')
    expect(await db.lists.count()).toBe(0)
  })

  it('trimma spazi iniziali/finali prima del salvataggio', async () => {
    const result = await listService.createList({ name: '  Latte  ' })
    expect(result.data?.name).toBe('Latte')
  })
})

describe('listService.updateList', () => {
  beforeEach(async () => {
    await db.lists.clear()
    await db.changeLog.clear()
  })

  it('happy path: aggiorna nome e produce UPDATE log con diff parziale', async () => {
    const created = await listService.createList({ name: 'Old name' })
    await db.changeLog.clear()

    const result = await listService.updateList(created.data!.id, { name: 'New name' })
    expect(result.error).toBe(null)
    expect(result.data?.name).toBe('New name')

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0]?.operationType).toBe('UPDATE')
    expect(log[0]?.entityType).toBe('LIST')
    expect(log[0]?.changes.before).toMatchObject({ name: 'Old name' })
    expect(log[0]?.changes.after).toMatchObject({ name: 'New name' })
  })

  it('rifiuta nome vuoto con VALIDATION_ERROR e nessuna write', async () => {
    const created = await listService.createList({ name: 'Original' })
    await db.changeLog.clear()

    const result = await listService.updateList(created.data!.id, { name: '   ' })
    expect(result.error?.code).toBe('VALIDATION_ERROR')

    const got = await db.lists.get(created.data!.id)
    expect(got?.name).toBe('Original')
    expect(await db.changeLog.count()).toBe(0)
  })

  it('ritorna NOT_FOUND su id inesistente', async () => {
    const result = await listService.updateList('nonexistent-id', { name: 'X' })
    expect(result.error?.code).toBe('NOT_FOUND')
    expect(await db.changeLog.count()).toBe(0)
  })

  it('ritorna NOT_FOUND su lista già cancellata', async () => {
    const created = await listService.createList({ name: 'To delete' })
    await db.lists.update(created.data!.id, { deletedAt: Date.now() })
    await db.changeLog.clear()

    const result = await listService.updateList(created.data!.id, { name: 'X' })
    expect(result.error?.code).toBe('NOT_FOUND')
    expect(await db.changeLog.count()).toBe(0)
  })
})

describe('listService.archiveList / unarchiveList', () => {
  beforeEach(async () => {
    await db.lists.clear()
    await db.changeLog.clear()
  })

  it('archiveList imposta status archived e produce log UPDATE', async () => {
    const created = await listService.createList({ name: 'Test' })
    await db.changeLog.clear()

    const result = await listService.archiveList(created.data!.id)
    expect(result.error).toBe(null)
    expect(result.data?.status).toBe('archived')

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0]?.operationType).toBe('UPDATE')
    expect(log[0]?.changes.after).toMatchObject({ status: 'archived' })
  })

  it('unarchiveList riporta status active', async () => {
    const created = await listService.createList({ name: 'Test' })
    await listService.archiveList(created.data!.id)
    await db.changeLog.clear()

    const result = await listService.unarchiveList(created.data!.id)
    expect(result.error).toBe(null)
    expect(result.data?.status).toBe('active')
    const log = await db.changeLog.toArray()
    expect(log[0]?.changes.after).toMatchObject({ status: 'active' })
  })

  it('archiveList ritorna NOT_FOUND su id inesistente', async () => {
    const result = await listService.archiveList('nonexistent')
    expect(result.error?.code).toBe('NOT_FOUND')
  })

  it('unarchiveList ritorna NOT_FOUND su lista cancellata', async () => {
    const created = await listService.createList({ name: 'Test' })
    await db.lists.update(created.data!.id, { deletedAt: Date.now() })
    const result = await listService.unarchiveList(created.data!.id)
    expect(result.error?.code).toBe('NOT_FOUND')
  })
})

function buildItemForList(listId: string, overrides: Partial<Item> = {}): Item {
  const now = Date.now()
  return {
    id: 'item-' + Math.random().toString(36).slice(2, 9),
    listId,
    name: 'Articolo',
    quantity: null,
    unit: null,
    notes: null,
    category: null,
    status: 'pending',
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    deletedAt: null,
    createdBy: 'local-user-stub',
    updatedBy: 'local-user-stub',
    ...overrides,
  }
}

describe('listService.deleteList (cascade)', () => {
  beforeEach(async () => {
    await db.lists.clear()
    await db.items.clear()
    await db.changeLog.clear()
  })

  it('cancella lista + tutti gli articoli attivi + emette 1 + N entries changeLog', async () => {
    const created = await listService.createList({ name: 'Test' })
    const listId = created.data!.id
    await itemRepository.create(buildItemForList(listId, { id: 'i1', sortOrder: 1 }))
    await itemRepository.create(buildItemForList(listId, { id: 'i2', sortOrder: 2 }))
    await itemRepository.create(buildItemForList(listId, { id: 'i3', sortOrder: 3 }))
    await db.changeLog.clear()

    const result = await listService.deleteList(listId)
    expect(result.error).toBe(null)

    const listAfter = await db.lists.get(listId)
    expect(listAfter?.deletedAt).not.toBe(null)

    const items = await db.items.where('listId').equals(listId).toArray()
    expect(items).toHaveLength(3)
    expect(items.every(i => i.deletedAt !== null)).toBe(true)

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(4)
    expect(log.filter(e => e.entityType === 'LIST')).toHaveLength(1)
    expect(log.filter(e => e.entityType === 'ITEM')).toHaveLength(3)
    expect(log.every(e => e.operationType === 'DELETE')).toBe(true)

    const timestamps = new Set(log.map(e => e.timestamp))
    expect(timestamps.size).toBe(1)
  })

  it('non genera log per articoli già cancellati prima del delete lista', async () => {
    const created = await listService.createList({ name: 'Test' })
    const listId = created.data!.id
    await itemRepository.create(buildItemForList(listId, { id: 'i1' }))
    await itemRepository.create(buildItemForList(listId, { id: 'i2', deletedAt: Date.now() }))
    await db.changeLog.clear()

    await listService.deleteList(listId)
    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(2)
  })

  it('ritorna NOT_FOUND su lista inesistente', async () => {
    const result = await listService.deleteList('nonexistent')
    expect(result.error?.code).toBe('NOT_FOUND')
    expect(await db.changeLog.count()).toBe(0)
  })

  it('ritorna NOT_FOUND su lista già cancellata', async () => {
    const created = await listService.createList({ name: 'Test' })
    await db.lists.update(created.data!.id, { deletedAt: Date.now() })
    await db.changeLog.clear()
    const result = await listService.deleteList(created.data!.id)
    expect(result.error?.code).toBe('NOT_FOUND')
  })
})
