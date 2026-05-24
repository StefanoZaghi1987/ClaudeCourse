import { useLiveQuery } from 'dexie-react-hooks'
import { queryActiveLists } from '../../../services/db/lists'

export function useLists() {
  return useLiveQuery(() => queryActiveLists(), [])
}
