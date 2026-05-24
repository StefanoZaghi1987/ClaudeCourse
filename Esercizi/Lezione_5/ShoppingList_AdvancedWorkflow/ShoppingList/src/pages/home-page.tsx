import { useState, type JSX } from 'react'
import { useLists } from '@/hooks/use-lists'
import { useAuthStore } from '@/stores/auth-store'
import { useUiStore } from '@/stores/ui-store'
import { ListCard } from '@/components/lists/list-card'
import { ListForm } from '@/components/lists/list-form'
import { ArchivedSection } from '@/components/lists/archived-section'
import { Button } from '@/components/common/button'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { useConfirm } from '@/components/common/confirm-dialog'

export default function HomePage(): JSX.Element {
  const userId = useAuthStore(s => s.userId)
  const listsHook = useLists()
  const { lists, isLoading } = listsHook
  const [showForm, setShowForm] = useState(false)
  const confirmHook = useConfirm()
  const toast = useUiStore(s => (type: Parameters<typeof s.pushToast>[0], message: string) => s.pushToast(type, message))

  const handleCreate = async (name: string): Promise<void> => {
    const result = await listsHook.create(name)
    if (result.error) {
      toast('error', result.error.message)
      return
    }
    setShowForm(false)
    toast('success', 'Lista creata')
  }

  const handleDelete = async (listId: string, listName: string): Promise<void> => {
    const ok = await confirmHook.confirm({
      title: 'Eliminare la lista?',
      message: `"${listName}" e tutti i suoi articoli saranno eliminati.`,
      danger: true,
      confirmText: 'Elimina',
    })
    if (!ok) return
    const result = await listsHook.remove(listId)
    if (result.error) {
      toast('error', result.error.message)
    } else {
      toast('success', 'Lista eliminata')
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Le mie liste</h1>
        <Button onClick={() => setShowForm(true)}>+ Nuova lista</Button>
      </header>

      {isLoading && <LoadingSpinner />}

      {!isLoading && lists?.length === 0 && (
        <EmptyState
          title="Nessuna lista"
          description="Crea la tua prima lista della spesa per iniziare."
          action={<Button onClick={() => setShowForm(true)}>Crea lista</Button>}
        />
      )}

      {!isLoading && lists && lists.length > 0 && (
        <ul className="space-y-2">
          {lists.map(list => (
            <ListCard
              key={list.id}
              list={list}
              onArchive={() => { void listsHook.archive(list.id) }}
              onUnarchive={() => { /* noop on active cards */ }}
              onDelete={() => { void handleDelete(list.id, list.name) }}
              onRename={(name) => { void listsHook.rename(list.id, name) }}
            />
          ))}
        </ul>
      )}

      <ArchivedSection userId={userId} />

      <ListForm open={showForm} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      <confirmHook.ConfirmDialog />
    </main>
  )
}
