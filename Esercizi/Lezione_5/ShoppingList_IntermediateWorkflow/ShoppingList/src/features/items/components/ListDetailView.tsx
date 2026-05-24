import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useList } from '@/features/lists/hooks/useList'
import { useItems } from '../hooks/useItems'
import { useItemOperations } from '../hooks/useItemOperations'
import { ItemForm } from './ItemForm'
import { ItemList } from './ItemList'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Item } from '../../../types/domain'

export function ListDetailView() {
  const { id } = useParams<{ id: string }>()
  const list = useList(id)
  const items = useItems(id)
  const ops = useItemOperations(id)
  const [editTarget, setEditTarget] = useState<Item | null>(null)

  if (list === undefined || items === undefined) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (list === null) {
    return (
      <div className="text-neutral-500 italic">
        Lista non trovata. <Link to="/lists" className="text-brand-600 underline">Torna all'elenco</Link>
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <Link to="/lists" className="text-sm text-neutral-500 hover:text-brand-600">← Liste</Link>
          <h1 className="text-2xl font-bold text-neutral-900">{list.name}</h1>
          <p className="text-sm text-neutral-500">{items.length} articoli</p>
        </div>
      </header>

      <ItemForm
        mode="add"
        onSubmit={async (data) => { await ops.createItem(data) }}
        loading={ops.loading}
      />

      {items.length === 0 ? (
        <p className="text-neutral-500 italic">Nessun articolo. Aggiungine uno qui sopra.</p>
      ) : (
        <ItemList
          items={items}
          onToggle={(itemId) => { void ops.toggleItem(itemId) }}
          onEdit={(item) => setEditTarget(item)}
          onDelete={(itemId) => { void ops.softDeleteItem(itemId) }}
          onReorder={(orderedIds) => { void ops.reorderItems(orderedIds) }}
        />
      )}

      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica articolo</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <ItemForm
              mode="edit"
              initial={{
                name: editTarget.name,
                quantity: editTarget.quantity,
                unit: typeof editTarget.unit === 'string' ? editTarget.unit : null,
                notes: editTarget.notes,
                category: typeof editTarget.category === 'string' ? editTarget.category : null,
              }}
              onSubmit={async (data) => {
                await ops.updateItem(editTarget.id, data)
                setEditTarget(null)
              }}
              onCancel={() => setEditTarget(null)}
              loading={ops.loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
