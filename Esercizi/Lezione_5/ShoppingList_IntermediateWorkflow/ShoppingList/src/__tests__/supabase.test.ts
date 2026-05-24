import { describe, it, expect } from 'vitest'
import { isSupabaseConfigured } from '../services/supabase/client'

describe('supabase client guard', () => {
  it('riporta non configurato quando le env vars sono placeholder', () => {
    expect(isSupabaseConfigured()).toBe(false)
  })
})
