// src/hooks/use-items.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { db } from '@/db/database'
import { useItems } from '@/hooks/use-items'
import { listService } from '@/services/list-service'

describe('useItems', () => {
  let testListId: string

  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
    const result = await listService.createList({ name: 'Test list' })
    testListId = result.data!.id
  })

  it('inizia con items === undefined poi emette array vuoto', async () => {
    const { result } = renderHook(() => useItems(testListId))
    expect(result.current.items).toBe(undefined)
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => {
      expect(result.current.items).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('emette nuovo array dopo create via mutation', async () => {
    const { result } = renderHook(() => useItems(testListId))
    await waitFor(() => expect(result.current.items).toEqual([]))

    await act(async () => {
      await result.current.create({ name: 'Latte' })
    })

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1)
      expect(result.current.items![0]?.name).toBe('Latte')
    })
  })

  it('propaga AppError da service in caso di input invalido', async () => {
    const { result } = renderHook(() => useItems(testListId))
    await waitFor(() => expect(result.current.items).toEqual([]))

    let mutationResult: Awaited<ReturnType<typeof result.current.create>> | undefined
    await act(async () => {
      mutationResult = await result.current.create({ name: '' })
    })

    expect(mutationResult!.error?.code).toBe('VALIDATION_ERROR')
    expect(result.current.items).toEqual([])
  })

  it('toggle modifica status nell array', async () => {
    const { result } = renderHook(() => useItems(testListId))
    await waitFor(() => expect(result.current.items).toEqual([]))

    let createdId = ''
    await act(async () => {
      const r = await result.current.create({ name: 'Latte' })
      createdId = r.data!.id
    })
    await waitFor(() => expect(result.current.items).toHaveLength(1))

    await act(async () => {
      await result.current.toggle(createdId)
    })

    await waitFor(() => {
      expect(result.current.items![0]?.status).toBe('completed')
    })
  })
})
