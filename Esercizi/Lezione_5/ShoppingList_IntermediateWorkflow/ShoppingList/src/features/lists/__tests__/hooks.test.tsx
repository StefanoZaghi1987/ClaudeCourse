import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { db } from '../../../services/db/schema'
import { useLists } from '../hooks/useLists'
import { useListOperations } from '../hooks/useListOperations'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}))

describe('useLists + useListOperations', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  it('creates a list via ops and list is persisted in DB', async () => {
    const hook = renderHook(() => useListOperations())

    let result: Awaited<ReturnType<typeof hook.result.current.createList>> | undefined
    await act(async () => {
      result = await hook.result.current.createList('Spesa')
    })

    expect(result?.ok).toBe(true)
    // Verify persistence directly in DB
    const rows = await db.lists.toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('Spesa')
    expect(rows[0].status).toBe('ACTIVE')
  })

  it('useLists hook reads existing data on mount', async () => {
    // Pre-seed the DB before mounting hook
    await db.lists.add({
      id: 'pre1', name: 'Pre-seeded', ownerId: 'u', status: 'ACTIVE',
      isTemplate: false, sharedWith: [], createdAt: 1, updatedAt: 1,
      syncedAt: null, localOnly: true,
    })

    const hook = renderHook(() => useLists())

    await waitFor(() => {
      expect(hook.result.current).toBeDefined()
      expect(hook.result.current).toHaveLength(1)
    }, { timeout: 3000 })
    expect(hook.result.current![0].name).toBe('Pre-seeded')
  })

  it('rejects empty name at validation without hitting the repo', async () => {
    const hook = renderHook(() => useListOperations())
    let result: Awaited<ReturnType<typeof hook.result.current.createList>> | undefined
    await act(async () => {
      result = await hook.result.current.createList('')
    })
    expect(result?.ok).toBe(false)
    if (result && !result.ok) expect(result.error.code).toBe('VALIDATION')
    expect(await db.lists.count()).toBe(0)
  })

  it('archives a list', async () => {
    const hook = renderHook(() => useListOperations())
    let id: string = ''
    await act(async () => {
      const r = await hook.result.current.createList('L')
      if (r.ok) id = r.data.id
    })
    await act(async () => {
      await hook.result.current.archiveList(id)
    })
    const row = await db.lists.get(id)
    expect(row?.status).toBe('ARCHIVED')
  })
})
