import { describe, it, expect } from 'vitest'
import { ItemFormSchema, computeNextSortOrder } from '../logic'
import type { Item } from '../../../types/domain'

describe('ItemFormSchema', () => {
  const valid = { name: 'pane', quantity: 2, unit: 'pezzi', notes: null, category: null }

  it('accepts valid input', () => {
    expect(ItemFormSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts null quantity', () => {
    expect(ItemFormSchema.safeParse({ ...valid, quantity: null }).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(ItemFormSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('rejects quantity <= 0', () => {
    expect(ItemFormSchema.safeParse({ ...valid, quantity: 0 }).success).toBe(false)
    expect(ItemFormSchema.safeParse({ ...valid, quantity: -1 }).success).toBe(false)
  })

  it('rejects notes > 500 chars', () => {
    expect(ItemFormSchema.safeParse({ ...valid, notes: 'x'.repeat(501) }).success).toBe(false)
  })

  it('rejects name > 200 chars', () => {
    expect(ItemFormSchema.safeParse({ ...valid, name: 'x'.repeat(201) }).success).toBe(false)
  })
})

describe('computeNextSortOrder', () => {
  const base: Omit<Item, 'id' | 'sortOrder'> = {
    listId: 'l', name: 'x', quantity: null, unit: null, notes: null, category: null,
    status: 'DA_COMPRARE', deletedAt: null, createdAt: 0, updatedAt: 0,
    completedAt: null, createdBy: 'u', updatedBy: 'u',
  }

  it('returns 1000 for empty siblings', () => {
    expect(computeNextSortOrder([])).toBe(1000)
  })

  it('returns max + 1000 for non-empty', () => {
    const siblings: Item[] = [
      { ...base, id: 'a', sortOrder: 1000 },
      { ...base, id: 'b', sortOrder: 2500 },
    ]
    expect(computeNextSortOrder(siblings)).toBe(3500)
  })
})
