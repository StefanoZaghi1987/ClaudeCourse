import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { db } from '../../../services/db/schema'
import { createList } from '../../../services/db/lists'
import { useItemOperations } from '../hooks/useItemOperations'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}))

async function mkList(): Promise<string> {
  const r = await createList({ name: 'L' })
  if (!r.ok) throw new Error('setup failed')
  return r.data.id
}

describe('useItems + useItemOperations', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  it('full lifecycle via DB assertions: create -> toggle -> reorder -> soft-delete -> restore', async () => {
    const listId = await mkList()
    const hook = renderHook(() => useItemOperations(listId))

    // Create two items
    let aId = '', bId = ''
    await act(async () => {
      const ra = await hook.result.current.createItem({ name: 'a', quantity: null, unit: null, notes: null, category: null })
      const rb = await hook.result.current.createItem({ name: 'b', quantity: null, unit: null, notes: null, category: null })
      if (ra.ok) aId = ra.data.id
      if (rb.ok) bId = rb.data.id
    })
    expect(await db.items.count()).toBe(2)

    // Toggle a: DA_COMPRARE -> COMPLETATO
    await act(async () => { await hook.result.current.toggleItem(aId) })
    const toggled = await db.items.get(aId)
    expect(toggled?.status).toBe('COMPLETATO')
    expect(toggled?.completedAt).not.toBeNull()

    // Reorder: b first, a second
    await act(async () => { await hook.result.current.reorderItems([bId, aId]) })
    const rowB = await db.items.get(bId)
    const rowA = await db.items.get(aId)
    expect(rowB?.sortOrder).toBe(1000)
    expect(rowA?.sortOrder).toBe(2000)

    // Soft-delete a
    await act(async () => { await hook.result.current.softDeleteItem(aId) })
    const deleted = await db.items.get(aId)
    expect(deleted?.deletedAt).not.toBeNull()

    // Restore a
    await act(async () => { await hook.result.current.restoreItem(aId) })
    const restored = await db.items.get(aId)
    expect(restored?.deletedAt).toBeNull()
  })

  it('rejects invalid input at validation without hitting repo', async () => {
    const listId = await mkList()
    const hook = renderHook(() => useItemOperations(listId))
    let r: Awaited<ReturnType<typeof hook.result.current.createItem>> | undefined
    await act(async () => {
      r = await hook.result.current.createItem({ name: '', quantity: null, unit: null, notes: null, category: null })
    })
    expect(r?.ok).toBe(false)
    if (r && !r.ok) expect(r.error.code).toBe('VALIDATION')
    expect(await db.items.count()).toBe(0)
  })

  it('create persists to DB and sets correct defaults', async () => {
    const listId = await mkList()
    const hook = renderHook(() => useItemOperations(listId))
    let r: Awaited<ReturnType<typeof hook.result.current.createItem>> | undefined
    await act(async () => {
      r = await hook.result.current.createItem({ name: 'pane', quantity: null, unit: null, notes: null, category: null })
    })
    expect(r?.ok).toBe(true)
    const row = await db.items.get(r!.ok ? r!.data.id : '')
    expect(row?.status).toBe('DA_COMPRARE')
    expect(row?.deletedAt).toBeNull()
    expect(row?.sortOrder).toBe(1000)
  })

  it('toggle writes correct status to DB', async () => {
    const listId = await mkList()
    const hook = renderHook(() => useItemOperations(listId))
    let itemId = ''
    await act(async () => {
      const r = await hook.result.current.createItem({ name: 'x', quantity: null, unit: null, notes: null, category: null })
      if (r.ok) itemId = r.data.id
    })
    await act(async () => {
      await hook.result.current.toggleItem(itemId)
    })
    const row = await db.items.get(itemId)
    expect(row?.status).toBe('COMPLETATO')
    expect(row?.completedAt).not.toBeNull()
  })

  it('softDelete sets deletedAt in DB', async () => {
    const listId = await mkList()
    const hook = renderHook(() => useItemOperations(listId))
    let itemId = ''
    await act(async () => {
      const r = await hook.result.current.createItem({ name: 'x', quantity: null, unit: null, notes: null, category: null })
      if (r.ok) itemId = r.data.id
    })
    await act(async () => {
      await hook.result.current.softDeleteItem(itemId)
    })
    const row = await db.items.get(itemId)
    expect(row?.deletedAt).not.toBeNull()
  })

  it('restore clears deletedAt in DB', async () => {
    const listId = await mkList()
    const hook = renderHook(() => useItemOperations(listId))
    let itemId = ''
    await act(async () => {
      const r = await hook.result.current.createItem({ name: 'x', quantity: null, unit: null, notes: null, category: null })
      if (r.ok) itemId = r.data.id
    })
    await act(async () => {
      await hook.result.current.softDeleteItem(itemId)
    })
    await act(async () => {
      await hook.result.current.restoreItem(itemId)
    })
    const row = await db.items.get(itemId)
    expect(row?.deletedAt).toBeNull()
  })

  it('reorder updates sortOrder in DB', async () => {
    const listId = await mkList()
    const hook = renderHook(() => useItemOperations(listId))
    let aId = '', bId = ''
    await act(async () => {
      const ra = await hook.result.current.createItem({ name: 'a', quantity: null, unit: null, notes: null, category: null })
      const rb = await hook.result.current.createItem({ name: 'b', quantity: null, unit: null, notes: null, category: null })
      if (ra.ok) aId = ra.data.id
      if (rb.ok) bId = rb.data.id
    })
    await act(async () => {
      await hook.result.current.reorderItems([bId, aId])
    })
    const rowB = await db.items.get(bId)
    const rowA = await db.items.get(aId)
    expect(rowB?.sortOrder).toBe(1000)
    expect(rowA?.sortOrder).toBe(2000)
  })
})
