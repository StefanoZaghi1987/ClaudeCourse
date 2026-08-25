import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useTrash } from '../hooks/useTrash'
import { useTrashOperations } from '../hooks/useTrashOperations'
import { db } from '../../../services/db/schema'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import type { Item } from '../../../types/domain'

export function TrashView() {
  const items = useTrash()
  const ops = useTrashOperations()
  const lists = useLiveQuery(() => db.lists.toArray(), [])
  const [purgeTarget, setPurgeTarget] = useState<Item | null>(null)

  if (items === undefined || lists === undefined) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  const listNameById = new Map(lists.map((l) => [l.id, l.name] as const))

  if (items.length === 0) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-neutral-900">Cestino</h1>
        <p className="text-neutral-500 italic mt-4">Il cestino è vuoto.</p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">Cestino</h1>
        <p className="text-sm text-neutral-500">{items.length} articoli eliminati</p>
      </header>

      <ul className="flex flex-col gap-2" aria-live="polite">
        {items.map((item) => {
          const listName = listNameById.get(item.listId) ?? '(lista rimossa)'
          return (
            <li key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
              <div className="min-w-0 flex-1">
                <p className="truncate">{item.name}</p>
                <p className="text-xs text-neutral-500">{listName}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { void ops.restoreItem(item.id) }}
                  disabled={ops.loading}
                >
                  Ripristina
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setPurgeTarget(item)}
                  disabled={ops.loading}
                >
                  Elimina
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={purgeTarget !== null}
        onOpenChange={(open) => !open && setPurgeTarget(null)}
        title={purgeTarget ? `Eliminare "${purgeTarget.name}" definitivamente?` : ''}
        description="Questa operazione non è reversibile. Clicca due volte per confermare."
        confirmLabel="Elimina"
        onConfirm={async () => {
          if (purgeTarget) await ops.purgeItem(purgeTarget.id)
          setPurgeTarget(null)
        }}
      />
    </section>
  )
}
