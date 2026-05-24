import { describe, it, expect } from 'vitest'
import { validateListName, validateItemInput, LIMITS } from '@/utils/validation'

describe('validateListName', () => {
  it('ritorna null per nome valido', () => {
    expect(validateListName('Spesa settimanale')).toBe(null)
  })

  it('ritorna VALIDATION_ERROR per stringa vuota', () => {
    const err = validateListName('')
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'name' })
  })

  it('ritorna VALIDATION_ERROR per solo whitespace', () => {
    const err = validateListName('   ')
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'name' })
  })

  it(`ritorna VALIDATION_ERROR per nome oltre ${LIMITS?.LIST_NAME_MAX ?? 100} caratteri`, () => {
    const err = validateListName('a'.repeat(101))
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'name' })
  })
})

describe('validateItemInput', () => {
  it('ritorna null per input minimo valido', () => {
    expect(validateItemInput({ name: 'Latte' })).toBe(null)
  })

  it('ritorna null per input completo valido', () => {
    expect(validateItemInput({ name: 'Latte', quantity: 2, notes: 'intero' })).toBe(null)
  })

  it('ritorna VALIDATION_ERROR per nome vuoto', () => {
    const err = validateItemInput({ name: '   ' })
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'name' })
  })

  it('ritorna VALIDATION_ERROR per nome oltre 100 caratteri', () => {
    const err = validateItemInput({ name: 'a'.repeat(101) })
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'name' })
  })

  it('ritorna VALIDATION_ERROR per quantity negativa', () => {
    const err = validateItemInput({ name: 'Latte', quantity: -1 })
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'quantity' })
  })

  it('ritorna VALIDATION_ERROR per quantity oltre max', () => {
    const err = validateItemInput({ name: 'Latte', quantity: 10000 })
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'quantity' })
  })

  it('ritorna VALIDATION_ERROR per notes oltre 500 caratteri', () => {
    const err = validateItemInput({ name: 'Latte', notes: 'a'.repeat(501) })
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'notes' })
  })
})
