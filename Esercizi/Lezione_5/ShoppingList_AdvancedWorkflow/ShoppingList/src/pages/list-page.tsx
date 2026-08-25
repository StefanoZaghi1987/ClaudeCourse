// src/pages/list-page.tsx
import { useState, type JSX } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Item } from '@/db/types'
import type { ItemFormInput } from '@/components/items/item-form'
import { useItems } from '@/hooks/use-items'
import { useUiStore } from '@/stores/ui-store'
import { listRepository } from '@/repositories/list-repository'
import { itemRepository } from '@/repositories/item-repository'
import { ItemRow } from '@/components/items/item-row'
import { ItemForm } from '@/components/items/item-form'
import { ItemQuickAddBar, type QuickAddInput } from '@/components/items/item-quick-add-bar'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { useConfirm } from '@/components/common/confirm-dialog'
import NotFoundPage from '@/pages/not-found-page'

export default function ListPage(): JSX.Element {
  const { listId: listIdParam } = useParams<{ listId: string }>()
  const listId = listIdParam ?? ''
  const itemsHook = useItems(listId)
  const { items, isLoading } = itemsHook

  const list = useLiveQuery(() => listRepository.getById(listId), [listId])
  const trashCount = useLiveQuery(
    () => itemRepository.listDeletedByList(listId).then(arr => arr.length),
    [listId],
    0,
  )
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const confirmHook = useConfirm()
  const toast = useUiStore(s => (type: Parameters<typeof s.pushToast>[0], message: string) => s.pushToast(type, message))

  if (list === undefined) return <LoadingSpinner />
  if (list === null || list.deletedAt !== null) return <NotFoundPage />

  const handleDelete = async (item: Item): Promise<void> => {
    const ok = await confirmHook.confirm({
      title: "Eliminare l'articolo?",
      message: `"${item.name}" sarà spostato nel cestino.`,
      danger: true,
      confirmText: 'Elimina',
    })
    if (!ok) return
    const result = await itemsHook.remove(item.id)
    if (result.error) {
      toast('error', result.error.message)
    }
  }

  const handleUpdate = async (input: ItemFormInput): Promise<void> => {
    if (!editingItem) return
    const result = await itemsHook.update(editingItem.id, input)
    if (result.error) {
      toast('error', result.error.message)
      return
    }
    setEditingItem(null)
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b bg-white p-4">
        <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">← Indietro</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{list.name}</h1>
        <Link
          to={`/lists/${listId}/trash`}
          className="mt-1 inline-block text-sm text-gray-500 hover:text-gray-700"
        >
          Cestino ({trashCount ?? 0})
        </Link>
      </header>

      <section className="mx-auto w-full max-w-2xl flex-1 p-4">
        {isLoading && <LoadingSpinner />}
        {!isLoading && items?.length === 0 && (
          <EmptyState title="Lista vuota" description="Aggiungi il primo articolo qui sotto." />
        )}
        {!isLoading && items && items.length > 0 && (
          <ul className="space-y-2">
            {items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={() => { void itemsHook.toggle(item.id) }}
                onEdit={() => { setEditingItem(item) }}
                onDelete={() => { void handleDelete(item) }}
              />
            ))}
          </ul>
        )}
      </section>

      <ItemQuickAddBar onSubmit={(input: QuickAddInput) => itemsHook.create(input)} />

      {editingItem && (
        <ItemForm
          open={true}
          item={editingItem}
          onSubmit={handleUpdate}
          onCancel={() => { setEditingItem(null) }}
        />
      )}
      <confirmHook.ConfirmDialog />
    </main>
  )
}
