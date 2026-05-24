import { useLiveQuery } from 'dexie-react-hooks'
import { queryActiveItems } from '../../../services/db/items'

export function useItems(listId: string | undefined) {
  return useLiveQuery(
    () => (listId ? queryActiveItems(listId) : []),
    [listId]
  )
}
