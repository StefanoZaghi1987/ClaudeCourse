import { describe, it, expect } from 'vitest'
import { buildDiff } from '@/utils/diff'

describe('buildDiff', () => {
  it('ritorna entrambi vuoti se before e after sono identici', () => {
    const before = { a: 1, b: 'hello', c: null }
    const after = { a: 1, b: 'hello', c: null }
    const diff = buildDiff(before, after)
    expect(diff.before).toEqual({})
    expect(diff.after).toEqual({})
  })

  it('include solo i campi cambiati nel diff parziale', () => {
    const before = { name: 'Latte', quantity: 1, unit: 'l' }
    const after = { name: 'Latte intero', quantity: 2, unit: 'l' }
    const diff = buildDiff(before, after)
    expect(diff.before).toEqual({ name: 'Latte', quantity: 1 })
    expect(diff.after).toEqual({ name: 'Latte intero', quantity: 2 })
  })

  it('rispetta ignoreFields escludendo i campi specificati', () => {
    const before = { id: 'abc', name: 'Old', createdAt: 100 }
    const after = { id: 'abc', name: 'New', createdAt: 100 }
    const diff = buildDiff(before, after, ['id', 'createdAt'])
    expect(diff.before).toEqual({ name: 'Old' })
    expect(diff.after).toEqual({ name: 'New' })
  })

  it('include chiavi presenti solo in before (key rimossa in after)', () => {
    const before = { name: 'Latte', quantity: 2 } as { name: string; quantity?: number }
    const after = { name: 'Latte' } as { name: string; quantity?: number }
    const diff = buildDiff(before, after)
    expect(diff.before).toEqual({ quantity: 2 })
    expect(diff.after).toEqual({ quantity: undefined })
  })
})
