// src/components/items/item-trash-row.tsx
import type { JSX } from 'react'
import type { Item } from '@/db/types'
import { Button } from '@/components/common/button'

type Props = {
  item: Item
  onRestore: () => void
}

function formatRelativeDate(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'oggi'
  if (diffDays === 1) return '1 giorno fa'
  if (diffDays < 30) return `${diffDays} giorni fa`
  return `${Math.floor(diffDays / 30)} mesi fa`
}

export function ItemTrashRow({ item, onRestore }: Props): JSX.Element {
  return (
    <li className="flex items-center justify-between rounded border bg-gray-50 p-3">
      <div>
        <div className="font-medium text-gray-700">{item.name}</div>
        <div className="text-xs text-gray-500">
          Eliminato {item.deletedAt != null ? formatRelativeDate(item.deletedAt) : ''}
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={onRestore}>
        Ripristina
      </Button>
    </li>
  )
}
