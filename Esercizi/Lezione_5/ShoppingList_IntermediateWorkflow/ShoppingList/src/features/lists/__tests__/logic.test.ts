import { describe, it, expect } from 'vitest'
import { ListFormSchema, formatUpdatedAt } from '../logic'
import type { List } from '../../../types/domain'

describe('ListFormSchema', () => {
  it('accepts a valid name', () => {
    const r = ListFormSchema.safeParse({ name: 'Spesa' })
    expect(r.success).toBe(true)
  })

  it('rejects empty name', () => {
    const r = ListFormSchema.safeParse({ name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toMatch(/obbligatorio/i)
  })

  it('rejects whitespace-only', () => {
    const r = ListFormSchema.safeParse({ name: '   ' })
    expect(r.success).toBe(false)
  })

  it('rejects >100 chars', () => {
    const r = ListFormSchema.safeParse({ name: 'x'.repeat(101) })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toMatch(/max/i)
  })
})

describe('formatUpdatedAt', () => {
  const baseList: List = {
    id: 'x', name: 'x', ownerId: 'u', status: 'ACTIVE',
    isTemplate: false, sharedWith: [], createdAt: 0, updatedAt: 0,
    syncedAt: null, localOnly: true,
  }

  it('returns a non-empty string for any input', () => {
    const r = formatUpdatedAt({ ...baseList, updatedAt: Date.now() - 5000 })
    expect(typeof r).toBe('string')
    expect(r.length).toBeGreaterThan(0)
  })
})
