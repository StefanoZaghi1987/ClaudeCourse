// src/hooks/use-lists.ts
import { useLiveQuery } from 'dexie-react-hooks'
import { listRepository } from '@/repositories/list-repository'
import { listService } from '@/services/list-service'
import { useAuthStore } from '@/stores/auth-store'
import type { List } from '@/db/types'
import type { AppResult } from '@/types/ui'

export type UseListsResult = {
  lists: List[] | undefined
  isLoading: boolean
  create(name: string): Promise<AppResult<List>>
  rename(id: string, name: string): Promise<AppResult<List>>
  archive(id: string): Promise<AppResult<List>>
  unarchive(id: string): Promise<AppResult<List>>
  remove(id: string): Promise<AppResult<void>>
}

export function useLists(): UseListsResult {
  const userId = useAuthStore(s => s.userId)

  const lists = useLiveQuery(
    () => listRepository.listByUser(userId),
    [userId],
    undefined,
  )

  return {
    lists,
    isLoading: lists === undefined,
    create: (name) => listService.createList({ name }),
    rename: (id, name) => listService.updateList(id, { name }),
    archive: (id) => listService.archiveList(id),
    unarchive: (id) => listService.unarchiveList(id),
    remove: (id) => listService.deleteList(id),
  }
}
