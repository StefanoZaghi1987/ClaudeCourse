import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/database'
import { catalogService } from '@/services/catalog-service'
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

describe('catalogService', () => {
  beforeEach(async () => {
    await db.itemCatalog.clear()
  })

  it('getSuggestions con query vuota ritorna topByFrequency', async () => {
    await db.itemCatalog.add(buildMockCatalogItem({ id: 'c1', name: 'latte', frequency: 2 }))
    await db.itemCatalog.add(buildMockCatalogItem({ id: 'c2', name: 'pane', frequency: 5 }))
    const result = await catalogService.getSuggestions('')
    expect(result.error).toBe(null)
    expect(result.data).toHaveLength(2)
    expect(result.data![0]?.id).toBe('c2') // higher frequency first
  })

  it('getSuggestions con query < 2 char ritorna topByFrequency', async () => {
    await db.itemCatalog.add(buildMockCatalogItem({ id: 'c1', name: 'latte', frequency: 2 }))
    await db.itemCatalog.add(buildMockCatalogItem({ id: 'c2', name: 'pane', frequency: 5 }))
    const result = await catalogService.getSuggestions('l')
    expect(result.error).toBe(null)
    expect(result.data).toHaveLength(2)
    expect(result.data![0]?.id).toBe('c2') // topByFrequency, not prefix filtered
  })

  it('getSuggestions con prefix match ordina per frequency desc', async () => {
    const now = Date.now()
    await db.itemCatalog.add(buildMockCatalogItem({ id: 'c1', name: 'latte intero', frequency: 1, lastUsedAt: now }))
    await db.itemCatalog.add(buildMockCatalogItem({ id: 'c2', name: 'latte parziale', frequency: 3, lastUsedAt: now }))
    await db.itemCatalog.add(buildMockCatalogItem({ id: 'c3', name: 'lattuga', frequency: 2, lastUsedAt: now }))
    const result = await catalogService.getSuggestions('lat')
    expect(result.error).toBe(null)
    expect(result.data![0]?.id).toBe('c2') // frequency 3
    expect(result.data![1]?.id).toBe('c3') // frequency 2
    expect(result.data![2]?.id).toBe('c1') // frequency 1
  })

  it('recordUsage nuovo nome crea entry con frequency=1', async () => {
    await db.transaction('rw', db.itemCatalog, async (tx) => {
      await catalogService.recordUsage('Latte', { category: 'dairy', unit: 'l', quantity: 2 }, tx)
    })
    const catalog = await db.itemCatalog.toArray()
    expect(catalog).toHaveLength(1)
    expect(catalog[0]?.frequency).toBe(1)
    expect(catalog[0]?.name).toBe('latte')
  })

  it('recordUsage nome esistente incrementa frequency', async () => {
    await db.transaction('rw', db.itemCatalog, async (tx) => {
      await catalogService.recordUsage('latte', { category: null, unit: null, quantity: null }, tx)
    })
    await db.transaction('rw', db.itemCatalog, async (tx) => {
      await catalogService.recordUsage('latte', { category: null, unit: null, quantity: null }, tx)
    })
    const catalog = await db.itemCatalog.toArray()
    expect(catalog).toHaveLength(1)
    expect(catalog[0]?.frequency).toBe(2)
  })

  it('recordUsage normalizza nome (trim+lowercase)', async () => {
    await db.transaction('rw', db.itemCatalog, async (tx) => {
      await catalogService.recordUsage('  LATTE  ', { category: null, unit: null, quantity: null }, tx)
    })
    const catalog = await db.itemCatalog.toArray()
    expect(catalog).toHaveLength(1)
    expect(catalog[0]?.name).toBe('latte')
  })

  it('recordUsage aggiorna default solo se esistente è null', async () => {
    await db.itemCatalog.add(buildMockCatalogItem({
      id: 'c1',
      name: 'latte',
      frequency: 1,
      lastUsedAt: Date.now(),
      defaultCategory: 'dairy',
    }))
    await db.transaction('rw', db.itemCatalog, async (tx) => {
      await catalogService.recordUsage('latte', { category: 'beverages', unit: null, quantity: null }, tx)
    })
    const updated = await db.itemCatalog.get('c1')
    expect(updated?.defaultCategory).toBe('dairy') // not updated because existing is not null and not stale
  })

  it('recordUsage aggiorna default se esistente è stale (> 30gg)', async () => {
    const staleTime = Date.now() - 31 * 24 * 60 * 60 * 1000
    await db.itemCatalog.add(buildMockCatalogItem({
      id: 'c1',
      name: 'latte',
      frequency: 1,
      lastUsedAt: staleTime,
      defaultCategory: 'dairy',
    }))
    await db.transaction('rw', db.itemCatalog, async (tx) => {
      await catalogService.recordUsage('latte', { category: 'beverages', unit: null, quantity: null }, tx)
    })
    const updated = await db.itemCatalog.get('c1')
    expect(updated?.defaultCategory).toBe('beverages') // updated because stale
  })
})
