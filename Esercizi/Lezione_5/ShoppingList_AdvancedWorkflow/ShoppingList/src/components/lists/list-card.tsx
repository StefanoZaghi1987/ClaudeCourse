import { useState, type JSX } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import type { List } from '@/db/types'
import { itemRepository } from '@/repositories/item-repository'
import { Button } from '@/components/common/button'
import { Badge } from '@/components/common/badge'

type Props = {
  list: List
  variant?: 'active' | 'archived'
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
  onRename: (newName: string) => void
}

export function ListCard({ list, variant = 'active', onArchive, onUnarchive, onDelete, onRename }: Props): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(list.name)

  const itemCount = useLiveQuery(
    () => itemRepository.listActiveByList(list.id).then(arr => arr.length),
    [list.id],
    0,
  )

  const handleRename = (): void => {
    if (editValue.trim() && editValue.trim() !== list.name) {
      onRename(editValue.trim())
    }
    setEditing(false)
  }

  return (
    <li className={`flex items-center justify-between rounded border bg-white p-3 ${variant === 'archived' ? 'opacity-60' : ''}`}>
      <div className="flex-1">
        {editing ? (
          <input
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => { if (e.key === 'Enter') handleRename() }}
            autoFocus
            className="rounded border px-2 py-1"
          />
        ) : (
          <Link to={`/lists/${list.id}`} className="font-medium text-gray-900 hover:text-brand-600">
            {list.name}
          </Link>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <Badge>{itemCount} articoli</Badge>
        </div>
      </div>
      <div className="relative">
        <Button variant="ghost" size="sm" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu lista">
          ⋮
        </Button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded border bg-white shadow-lg">
            <button
              onClick={() => { setEditing(true); setMenuOpen(false) }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              Rinomina
            </button>
            {variant === 'active' ? (
              <button
                onClick={() => { onArchive(); setMenuOpen(false) }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
              >
                Archivia
              </button>
            ) : (
              <button
                onClick={() => { onUnarchive(); setMenuOpen(false) }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
              >
                Disarchivia
              </button>
            )}
            <button
              onClick={() => { onDelete(); setMenuOpen(false) }}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Elimina
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
