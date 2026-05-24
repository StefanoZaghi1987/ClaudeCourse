import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '../schema'
import { getOrCreateGuestSession, getCurrentUserId } from '../session'

describe('session', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  it('creates a guest session on first call', async () => {
    const r = await getOrCreateGuestSession()
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.id).toBe('current')
      expect(r.data.userId).toMatch(/^guest-/)
      expect(r.data.createdAt).toBeGreaterThan(0)
    }
  })

  it('returns the same session on second call', async () => {
    const first = await getOrCreateGuestSession()
    const second = await getOrCreateGuestSession()
    expect(first.ok && second.ok).toBe(true)
    if (first.ok && second.ok) {
      expect(first.data.userId).toBe(second.data.userId)
    }
  })

  it('getCurrentUserId returns the stored id', async () => {
    const uid = await getCurrentUserId()
    expect(uid).toMatch(/^guest-/)
    const r = await getOrCreateGuestSession()
    if (r.ok) expect(r.data.userId).toBe(uid)
  })
})
