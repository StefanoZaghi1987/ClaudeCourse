import { useState } from 'react'
import { useLists } from '../hooks/useLists'
import { useArchivedLists } from '../hooks/useArchivedLists'
import { useListOperations } from '../hooks/useListOperations'
import { ListCard } from './ListCard'
import { ListForm } from './ListForm'
import { ArchivedListsSection } from './ArchivedListsSection'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { List } from '../../../types/domain'

export function ListDashboard() {
  const lists = useLists()
  const archived = useArchivedLists()
  const ops = useListOperations()
  const [renameTarget, setRenameTarget] = useState<List | null>(null)

  const handleRename = (id: string) => {
    const target =
      lists?.find((l) => l.id === id) ??
      archived?.find((l) => l.id === id) ??
      null
    if (target) setRenameTarget(target)
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">Le mie liste</h1>
        <p className="text-sm text-neutral-500">Guest mode · offline-first</p>
      </header>

      <ListForm
        mode="create"
        onSubmit={async (data) => { await ops.createList(data.name) }}
        loading={ops.loading}
      />

      {lists === undefined ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : lists.length === 0 ? (
        <p className="text-neutral-500 italic">Nessuna lista. Creane una qui sopra.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onArchive={ops.archiveList}
              onUnarchive={ops.unarchiveList}
              onDelete={ops.deleteList}
              onRename={handleRename}
            />
          ))}
        </div>
      )}

      {archived === undefined ? (
        <Skeleton className="h-10 w-full mt-6" />
      ) : (
        <ArchivedListsSection
          archived={archived}
          onArchive={ops.archiveList}
          onUnarchive={ops.unarchiveList}
          onDelete={ops.deleteList}
          onRename={handleRename}
        />
      )}

      <Dialog open={renameTarget !== null} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rinomina lista</DialogTitle>
          </DialogHeader>
          {renameTarget && (
            <ListForm
              mode="rename"
              initial={{ name: renameTarget.name }}
              onSubmit={async (data) => {
                await ops.renameList(renameTarget.id, data.name)
                setRenameTarget(null)
              }}
              onCancel={() => setRenameTarget(null)}
              loading={ops.loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
