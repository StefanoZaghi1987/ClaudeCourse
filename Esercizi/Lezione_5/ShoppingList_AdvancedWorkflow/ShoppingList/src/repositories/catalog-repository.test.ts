import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/database'
import { catalogRepository } from '@/repositories/catalog-repository'
import type { CatalogItem } from '@/db/types'

function buildMockCatalogItem(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: 'catalog-test-1',
    userId: 'local-user-stub',
    name: 'latte',
    frequency: 1,
    lastUsedAt: Date.now(),
    defaultCategory: null,
    defaultUnit: null,
    defaultQuantity: null,
    ...overrides,
  }
}

describe('catalogRepository', () => {
  beforeEach(async () => {
    await db.itemCatalog.clear()
  })

  it('add + getByName case-sensitive sul lookup', async () => {
    const item = buildMockCatalogItem({ id: 'c1', name: 'latte' })
    await catalogRepository.add(item)
    const found = await catalogRepository.getByName('latte')
    expect(found).toEqual(item)
    const notFound = await catalogRepository.getByName('Latte')
    expect(notFound).toBeUndefined()
  })

  it('searchByPrefix ordina per frequency desc, poi lastUsedAt desc', async () => {
    const now = Date.now()
    await catalogRepository.add(buildMockCatalogItem({ id: 'c1', name: 'latte intero', frequency: 2, lastUsedAt: now - 1000 }))
    await catalogRepository.add(buildMockCatalogItem({ id: 'c2', name: 'latte parziale', frequency: 3, lastUsedAt: now - 2000 }))
    await catalogRepository.add(buildMockCatalogItem({ id: 'c3', name: 'latte scremato', frequency: 2, lastUsedAt: now }))
    const results = await catalogRepository.searchByPrefix('latte', 'local-user-stub', 10)
    expect(results[0]?.id).toBe('c2') // frequency 3
    expect(results[1]?.id).toBe('c3') // frequency 2, lastUsedAt now (most recent)
    expect(results[2]?.id).toBe('c1') // frequency 2, lastUsedAt now-1000
  })

  it('searchByPrefix filtra per userId', async () => {
    await catalogRepository.add(buildMockCatalogItem({ id: 'c1', name: 'latte', userId: 'local-user-stub' }))
    await catalogRepository.add(buildMockCatalogItem({ id: 'c2', name: 'lattuga', userId: 'other-user' }))
    const results = await catalogRepository.searchByPrefix('latt', 'local-user-stub', 10)
    expect(results).toHaveLength(1)
    expect(results[0]?.id).toBe('c1')
  })

  it('topByFrequency rispetta il limit', async () => {
    for (let i = 1; i <= 5; i++) {
      await catalogRepository.add(buildMockCatalogItem({ id: `c${i}`, name: `item${i}`, frequency: i }))
    }
    const results = await catalogRepository.topByFrequency('local-user-stub', 3)
    expect(results).toHaveLength(3)
  })

  it('update incrementa frequency', async () => {
    const item = buildMockCatalogItem({ id: 'c1', name: 'latte', frequency: 1 })
    await catalogRepository.add(item)
    await catalogRepository.update('c1', { frequency: 2 })
    const updated = await catalogRepository.getByName('latte')
    expect(updated?.frequency).toBe(2)
  })
})
