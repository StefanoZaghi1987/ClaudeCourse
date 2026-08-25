import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/database'
import { listRepository } from '@/repositories/list-repository'
import type { List } from '@/db/types'

function buildMockList(overrides: Partial<List> = {}): List {
  const now = Date.now()
  return {
    id: 'list-test-1',
    name: 'Test List',
    userId: 'local-user-stub',
    status: 'active',
    isTemplate: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    sharedWith: [],
    itemOrder: [],
    syncedAt: null,
    ...overrides,
  }
}

describe('listRepository', () => {
  beforeEach(async () => {
    await db.lists.clear()
  })

  it('create → getById preserva tutti i campi', async () => {
    const list = buildMockList({ name: 'Spesa' })
    await listRepository.create(list)
    const got = await listRepository.getById(list.id)
    expect(got).toEqual(list)
  })

  it('listByUser filtra deletedAt !== null', async () => {
    await listRepository.create(buildMockList({ id: 'l1', name: 'Active' }))
    await listRepository.create(buildMockList({ id: 'l2', name: 'Deleted', deletedAt: Date.now() }))
    const result = await listRepository.listByUser('local-user-stub')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('l1')
  })

  it('listByUser filtra status !== active', async () => {
    await listRepository.create(buildMockList({ id: 'l1', name: 'Active', status: 'active' }))
    await listRepository.create(buildMockList({ id: 'l2', name: 'Archived', status: 'archived' }))
    const result = await listRepository.listByUser('local-user-stub')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('l1')
  })

  it('update modifica solo i campi passati', async () => {
    const list = buildMockList({ name: 'Old', status: 'active' })
    await listRepository.create(list)
    await listRepository.update(list.id, { name: 'New' })
    const got = await listRepository.getById(list.id)
    expect(got?.name).toBe('New')
    expect(got?.status).toBe('active')
  })

  it('listByUser ordina per updatedAt desc', async () => {
    await listRepository.create(buildMockList({ id: 'l1', name: 'Older', updatedAt: 100 }))
    await listRepository.create(buildMockList({ id: 'l2', name: 'Newer', updatedAt: 200 }))
    const result = await listRepository.listByUser('local-user-stub')
    expect(result.map(l => l.id)).toEqual(['l2', 'l1'])
  })
})
