// src/hooks/use-lists.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { db } from '@/db/database'
import { useLists } from '@/hooks/use-lists'

describe('useLists', () => {
  beforeEach(async () => {
    await db.lists.clear()
    await db.items.clear()
    await db.changeLog.clear()
  })

  it('inizia con lists === undefined poi emette array vuoto', async () => {
    const { result } = renderHook(() => useLists())
    expect(result.current.lists).toBe(undefined)
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.lists).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('emette nuovo array dopo create via mutation', async () => {
    const { result } = renderHook(() => useLists())
    await waitFor(() => expect(result.current.lists).toEqual([]))

    await act(async () => {
      await result.current.create('Nuova lista')
    })

    await waitFor(() => {
      expect(result.current.lists).toHaveLength(1)
      expect(result.current.lists![0]?.name).toBe('Nuova lista')
    })
  })

  it('propaga AppError da service in caso di input invalido', async () => {
    const { result } = renderHook(() => useLists())
    await waitFor(() => expect(result.current.lists).toEqual([]))

    let mutationResult: Awaited<ReturnType<typeof result.current.create>> | undefined
    await act(async () => {
      mutationResult = await result.current.create('   ')
    })

    expect(mutationResult!.error?.code).toBe('VALIDATION_ERROR')
    expect(result.current.lists).toEqual([])
  })

  it('rimuove la lista dall array dopo remove', async () => {
    const { result } = renderHook(() => useLists())
    await waitFor(() => expect(result.current.lists).toEqual([]))

    let createdId = ''
    await act(async () => {
      const r = await result.current.create('To delete')
      if (r.data) createdId = r.data.id
    })
    await waitFor(() => expect(result.current.lists).toHaveLength(1))

    await act(async () => {
      await result.current.remove(createdId)
    })

    await waitFor(() => expect(result.current.lists).toEqual([]))
  })
})
