// src/components/items/item-row.tsx
import type { JSX } from 'react'
import type { Item } from '@/db/types'
import { Badge } from '@/components/common/badge'
import { formatCategory, formatUnit } from '@/utils/item-labels'

type Props = {
  item: Item
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ItemRow({ item, onToggle, onEdit, onDelete }: Props): JSX.Element {
  const isCompleted = item.status === 'completed'

  return (
    <li className="flex items-center gap-2 rounded border bg-white p-2">
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={onToggle}
        className="h-5 w-5 cursor-pointer accent-brand-600"
        aria-label={
          isCompleted
            ? `Segna ${item.name} come da comprare`
            : `Segna ${item.name} come completato`
        }
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Toggla stato di ${item.name}`}
        className={`flex-1 rounded p-2 text-left hover:bg-gray-50 ${
          isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
        }`}
      >
        <div className="font-medium">{item.name}</div>
        {(item.quantity !== null || item.notes) && (
          <div className="mt-1 text-xs text-gray-500">
            {item.quantity !== null && (
              <span>
                {item.quantity}
                {item.unit ? ` ${formatUnit(item.unit)}` : ''}
              </span>
            )}
            {item.notes && <span className="ml-2 italic">{item.notes}</span>}
          </div>
        )}
        {item.category && (
          <div className="mt-1">
            <Badge>{formatCategory(item.category)}</Badge>
          </div>
        )}
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded hover:bg-gray-100"
        aria-label={`Modifica ${item.name}`}
      >
        ✎
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded text-red-600 hover:bg-red-50"
        aria-label={`Elimina ${item.name}`}
      >
        🗑
      </button>
    </li>
  )
}
