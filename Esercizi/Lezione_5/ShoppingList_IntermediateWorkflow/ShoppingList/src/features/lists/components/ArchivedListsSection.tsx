import { ListCard } from './ListCard'
import type { List } from '../../../types/domain'

interface Props {
  archived: List[]
  onArchive: (id: string) => void
  onUnarchive: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string) => void
}

export function ArchivedListsSection({ archived, onArchive, onUnarchive, onDelete, onRename }: Props) {
  if (archived.length === 0) return null

  return (
    <details className="mt-6 border-t pt-4">
      <summary className="cursor-pointer text-sm text-neutral-600 hover:text-neutral-900">
        Mostra archiviate ({archived.length})
      </summary>
      <div className="mt-3 flex flex-col gap-2">
        {archived.map((list) => (
          <ListCard
            key={list.id}
            list={list}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
            onDelete={onDelete}
            onRename={onRename}
          />
        ))}
      </div>
    </details>
  )
}
