// src/hooks/use-deleted-items.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { db } from '@/db/database'
import { useDeletedItems } from '@/hooks/use-deleted-items'
import { listService } from '@/services/list-service'
import { itemService } from '@/services/item-service'

describe('useDeletedItems', () => {
  let testListId = ''

  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
    const result = await listService.createList({ name: 'Test list' })
    testListId = result.data!.id
  })

  it('inizia con items === undefined poi emette array vuoto se nessun deleted', async () => {
    const { result } = renderHook(() => useDeletedItems(testListId))
    expect(result.current.items).toBe(undefined)
    await waitFor(() => {
      expect(result.current.items).toEqual([])
    })
  })

  it('emette articoli cancellati dopo delete', async () => {
    const created = await itemService.createItem({ listId: testListId, name: 'Latte' })
    await itemService.deleteItem(created.data!.id)

    const { result } = renderHook(() => useDeletedItems(testListId))
    await waitFor(() => {
      expect(result.current.items).toHaveLength(1)
      expect(result.current.items![0]?.id).toBe(created.data!.id)
    })
  })

  it('rimuove l articolo dall array dopo restore', async () => {
    const created = await itemService.createItem({ listId: testListId, name: 'Latte' })
    await itemService.deleteItem(created.data!.id)

    const { result } = renderHook(() => useDeletedItems(testListId))
    await waitFor(() => expect(result.current.items).toHaveLength(1))

    await act(async () => {
      await result.current.restore(created.data!.id)
    })

    await waitFor(() => expect(result.current.items).toEqual([]))
  })
})
