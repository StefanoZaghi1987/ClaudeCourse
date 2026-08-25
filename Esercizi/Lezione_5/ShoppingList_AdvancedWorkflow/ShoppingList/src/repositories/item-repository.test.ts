import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/database'
import { itemRepository } from '@/repositories/item-repository'
import type { Item } from '@/db/types'

function buildMockItem(overrides: Partial<Item> = {}): Item {
  const now = Date.now()
  return {
    id: 'item-test-1',
    listId: 'list-1',
    name: 'Latte',
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

describe('itemRepository', () => {
  beforeEach(async () => {
    await db.items.clear()
  })

  it('create → getById preserva tutti i campi', async () => {
    const item = buildMockItem({ name: 'Pane' })
    await itemRepository.create(item)
    const got = await itemRepository.getById(item.id)
    expect(got).toEqual(item)
  })

  it('listActiveByList ordina per sortOrder asc', async () => {
    await itemRepository.create(buildMockItem({ id: 'i1', sortOrder: 3 }))
    await itemRepository.create(buildMockItem({ id: 'i2', sortOrder: 1 }))
    await itemRepository.create(buildMockItem({ id: 'i3', sortOrder: 2 }))
    const result = await itemRepository.listActiveByList('list-1')
    expect(result.map(i => i.id)).toEqual(['i2', 'i3', 'i1'])
  })

  it('listActiveByList filtra deletedAt !== null', async () => {
    await itemRepository.create(buildMockItem({ id: 'i1' }))
    await itemRepository.create(buildMockItem({ id: 'i2', deletedAt: Date.now() }))
    const result = await itemRepository.listActiveByList('list-1')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('i1')
  })

  it('getMaxSortOrder su lista vuota ritorna 0', async () => {
    const max = await itemRepository.getMaxSortOrder('list-empty')
    expect(max).toBe(0)
  })

  it('listActiveInList materializza array dentro transazione esplicita', async () => {
    await itemRepository.create(buildMockItem({ id: 'i1', sortOrder: 1 }))
    await itemRepository.create(buildMockItem({ id: 'i2', sortOrder: 2, deletedAt: Date.now() }))
    const result = await db.transaction('r', db.items, async (tx) => {
      return itemRepository.listActiveInList('list-1', tx)
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('i1')
  })
})
