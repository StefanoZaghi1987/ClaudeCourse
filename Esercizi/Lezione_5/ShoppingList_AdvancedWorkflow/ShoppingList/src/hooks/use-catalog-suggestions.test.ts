import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { db } from '@/db/database'
import { useCatalogSuggestions } from '@/hooks/use-catalog-suggestions'
import type { CatalogItem } from '@/db/types'

function buildMockCatalogItem(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: `cat-${Math.random().toString(36).slice(2, 10)}`,
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

describe('useCatalogSuggestions', () => {
  beforeEach(async () => {
    await db.itemCatalog.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('con query vuota emette topByFrequency dopo il debounce', async () => {
    await db.itemCatalog.add(buildMockCatalogItem({ id: 'c1', name: 'latte', frequency: 5 }))
    await db.itemCatalog.add(buildMockCatalogItem({ id: 'c2', name: 'pane', frequency: 2 }))

    const { result } = renderHook(() => useCatalogSuggestions(''))
    expect(result.current.suggestions).toEqual([])

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })

    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(2)
      expect(result.current.suggestions[0]?.frequency).toBe(5)
    })
  })

  it('con query prefix emette suggerimenti filtrati', async () => {
    await db.itemCatalog.add(buildMockCatalogItem({ id: 'c1', name: 'latte' }))
    await db.itemCatalog.add(buildMockCatalogItem({ id: 'c2', name: 'pane' }))

    const { result } = renderHook(() => useCatalogSuggestions('lat'))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })

    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(1)
      expect(result.current.suggestions[0]?.name).toBe('latte')
    })
  })

  it('debounce a 200ms: non emette prima di 200ms', async () => {
    await db.itemCatalog.add(buildMockCatalogItem({ id: 'c1', name: 'latte' }))

    const { result } = renderHook(() => useCatalogSuggestions('lat'))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150)
    })
    expect(result.current.suggestions).toEqual([])

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(1)
    })
  })
})
