import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '../services/db/schema'

describe('ShoppingListDB schema', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  it('declares 6 tables at v2', () => {
    const names = db.tables.map((t) => t.name).sort()
    expect(names).toEqual(['catalog', 'changes', 'invites', 'items', 'lists', 'session'])
  })

  it('opens at version 2', () => {
    expect(db.verno).toBe(2)
  })
})
