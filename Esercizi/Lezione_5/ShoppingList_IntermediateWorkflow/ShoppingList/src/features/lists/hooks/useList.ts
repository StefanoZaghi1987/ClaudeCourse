import { useLiveQuery } from 'dexie-react-hooks'
import { getListById } from '../../../services/db/lists'

export function useList(id: string | undefined) {
  return useLiveQuery(
    () => (id ? getListById(id) : undefined),
    [id]
  )
}
