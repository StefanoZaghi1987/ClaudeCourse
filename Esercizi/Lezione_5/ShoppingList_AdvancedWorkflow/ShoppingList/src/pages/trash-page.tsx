// src/pages/trash-page.tsx
import type { JSX } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useDeletedItems } from '@/hooks/use-deleted-items'
import { useUiStore } from '@/stores/ui-store'
import { listRepository } from '@/repositories/list-repository'
import { ItemTrashRow } from '@/components/items/item-trash-row'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import NotFoundPage from '@/pages/not-found-page'

export default function TrashPage(): JSX.Element {
  const { listId: listIdParam } = useParams<{ listId: string }>()
  const listId = listIdParam ?? ''
  const deletedHook = useDeletedItems(listId)
  const { items, isLoading } = deletedHook

  const list = useLiveQuery(() => listRepository.getById(listId), [listId])
  const toast = useUiStore(s => (type: Parameters<typeof s.pushToast>[0], message: string) => s.pushToast(type, message))

  if (list === undefined) return <LoadingSpinner />
  if (list === null || list.deletedAt !== null) return <NotFoundPage />

  const handleRestore = async (id: string): Promise<void> => {
    const result = await deletedHook.restore(id)
    if (result.error) {
      toast('error', result.error.message)
    } else {
      toast('success', 'Articolo ripristinato')
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <Link to={`/lists/${listId}`} className="text-sm text-gray-600 hover:text-gray-900">
          ← {list.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Cestino</h1>
      </header>

      {isLoading && <LoadingSpinner />}
      {!isLoading && items?.length === 0 && <EmptyState title="Cestino vuoto" />}
      {!isLoading && items && items.length > 0 && (
        <ul className="space-y-2">
          {items.map(item => (
            <ItemTrashRow
              key={item.id}
              item={item}
              onRestore={() => { void handleRestore(item.id) }}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
