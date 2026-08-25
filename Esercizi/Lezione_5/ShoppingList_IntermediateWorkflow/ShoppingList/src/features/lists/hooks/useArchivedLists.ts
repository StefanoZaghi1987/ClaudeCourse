import { useLiveQuery } from 'dexie-react-hooks'
import { queryArchivedLists } from '../../../services/db/lists'

export function useArchivedLists() {
  return useLiveQuery(() => queryArchivedLists(), [])
}
