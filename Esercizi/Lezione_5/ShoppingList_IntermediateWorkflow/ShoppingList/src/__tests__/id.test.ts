import { describe, it, expect } from 'vitest'
import { newId } from '../utils/id'

describe('id', () => {
  it('genera ID non vuoti', () => {
    expect(newId()).toMatch(/.+/)
  })

  it('genera ID unici su 100 chiamate', () => {
    const ids = new Set(Array.from({ length: 100 }, () => newId()))
    expect(ids.size).toBe(100)
  })
})
