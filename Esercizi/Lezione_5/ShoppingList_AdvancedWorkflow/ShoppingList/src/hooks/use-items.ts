// src/hooks/use-items.ts
import { useLiveQuery } from 'dexie-react-hooks'
import { itemRepository } from '@/repositories/item-repository'
import { itemService, type CreateItemInput, type UpdateItemInput } from '@/services/item-service'
import type { Item } from '@/db/types'
import type { AppResult } from '@/types/ui'

export type UseItemsResult = {
  items: Item[] | undefined
  isLoading: boolean
  create(input: Omit<CreateItemInput, 'listId'>): Promise<AppResult<Item>>
  update(id: string, changes: UpdateItemInput): Promise<AppResult<Item>>
  toggle(id: string): Promise<AppResult<Item>>
  remove(id: string): Promise<AppResult<void>>
}

export function useItems(listId: string): UseItemsResult {
  const items = useLiveQuery(
    () => itemRepository.listActiveByList(listId),
    [listId],
    undefined,
  )

  return {
    items,
    isLoading: items === undefined,
    create: (input) => itemService.createItem({ listId, ...input }),
    update: (id, changes) => itemService.updateItem(id, changes),
    toggle: (id) => itemService.toggleItemStatus(id),
    remove: (id) => itemService.deleteItem(id),
  }
}
