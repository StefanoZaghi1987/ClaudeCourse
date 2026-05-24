import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { db } from '../../../services/db/schema'
import { formatUpdatedAt } from '../logic'
import type { List } from '../../../types/domain'

interface ListCardProps {
  list: List
  onArchive: (id: string) => void
  onUnarchive: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string) => void
}

export function ListCard({ list, onArchive, onUnarchive, onDelete, onRename }: ListCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const itemCount = useLiveQuery(
    () => db.items.where('listId').equals(list.id).filter((item) => item.deletedAt === null).count(),
    [list.id]
  )

  const isArchived = list.status === 'ARCHIVED'

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm flex items-center justify-between gap-3">
      <Link to={`/lists/${list.id}`} className="flex-1 min-w-0 hover:underline">
        <h3 className="font-semibold text-brand-600 truncate">{list.name}</h3>
        <p className="text-sm text-neutral-500">
          {itemCount ?? 0} articoli · aggiornata {formatUpdatedAt(list)}
        </p>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" aria-label={`Menu lista ${list.name}`}>⋯</Button>} />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onRename(list.id)}>Rinomina</DropdownMenuItem>
          {isArchived ? (
            <DropdownMenuItem onSelect={() => onUnarchive(list.id)}>Riattiva</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => onArchive(list.id)}>Archivia</DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() => setConfirmOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            Elimina
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Eliminare "${list.name}"?`}
        description={`Verranno eliminati anche tutti gli articoli. Questa operazione non è reversibile. Clicca "Elimina" due volte per confermare.`}
        confirmLabel="Elimina"
        onConfirm={() => onDelete(list.id)}
      />
    </div>
  )
}
