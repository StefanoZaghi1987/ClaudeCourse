// src/hooks/use-deleted-items.ts
import { useLiveQuery } from 'dexie-react-hooks'
import { itemRepository } from '@/repositories/item-repository'
import { itemService } from '@/services/item-service'
import type { Item } from '@/db/types'
import type { AppResult } from '@/types/ui'

export type UseDeletedItemsResult = {
  items: Item[] | undefined
  isLoading: boolean
  restore(id: string): Promise<AppResult<Item>>
}

export function useDeletedItems(listId: string): UseDeletedItemsResult {
  const items = useLiveQuery(
    () => itemRepository.listDeletedByList(listId),
    [listId],
    undefined,
  )

  return {
    items,
    isLoading: items === undefined,
    restore: (id) => itemService.restoreItem(id),
  }
}
