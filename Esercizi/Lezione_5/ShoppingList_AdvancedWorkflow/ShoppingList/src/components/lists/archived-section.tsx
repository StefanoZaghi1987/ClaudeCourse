// src/components/lists/archived-section.tsx
import { useState, type JSX } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { listRepository } from '@/repositories/list-repository'
import { listService } from '@/services/list-service'
import { ListCard } from '@/components/lists/list-card'

type Props = { userId: string }

export function ArchivedSection({ userId }: Props): JSX.Element | null {
  const [expanded, setExpanded] = useState(false)
  const archived = useLiveQuery(
    () => listRepository.listArchivedByUser(userId),
    [userId],
    [],
  )

  if (!archived || archived.length === 0) return null

  return (
    <section className="mt-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        {expanded ? '▼' : '▶'} Archiviate ({archived.length})
      </button>
      {expanded && (
        <ul className="mt-2 space-y-2">
          {archived.map(list => (
            <ListCard
              key={list.id}
              list={list}
              variant="archived"
              onArchive={() => { /* noop: already archived */ }}
              onUnarchive={() => { void listService.unarchiveList(list.id) }}
              onDelete={() => { void listService.deleteList(list.id) }}
              onRename={(name) => { void listService.updateList(list.id, { name }) }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
