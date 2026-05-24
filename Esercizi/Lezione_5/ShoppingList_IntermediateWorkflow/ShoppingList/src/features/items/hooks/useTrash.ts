import { useLiveQuery } from 'dexie-react-hooks'
import { queryTrashedItems } from '../../../services/db/items'

export function useTrash() {
  return useLiveQuery(() => queryTrashedItems(), [])
}
