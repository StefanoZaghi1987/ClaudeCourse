import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import type { Item } from '../../../types/domain'

interface ItemRowProps {
  item: Item
  onToggle: (id: string) => void
  onEdit: (item: Item) => void
  onDelete: (id: string) => void
  disabled?: boolean
}

export function ItemRow({ item, onToggle, onEdit, onDelete, disabled }: ItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const completed = item.status === 'COMPLETATO'

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg border bg-white"
      aria-label={`Articolo ${item.name}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Riordina ${item.name}`}
        className="cursor-grab text-neutral-400 hover:text-neutral-600 px-1"
        disabled={disabled}
      >
        ≡
      </button>

      <Checkbox
        checked={completed}
        onCheckedChange={() => onToggle(item.id)}
        aria-label={`Segna ${item.name} come ${completed ? 'da comprare' : 'completato'}`}
        disabled={disabled}
      />

      <div className="flex-1 min-w-0">
        <p className={`truncate ${completed ? 'line-through text-neutral-400' : ''}`}>
          {item.name}
          {item.quantity !== null && (
            <span className="text-neutral-500 ml-2">
              {item.quantity}{item.unit ? ` ${item.unit}` : ''}
            </span>
          )}
        </p>
        {item.notes && <p className="text-xs text-neutral-500 truncate">{item.notes}</p>}
        {item.category && <p className="text-xs text-brand-600">{String(item.category)}</p>}
      </div>

      <Button variant="ghost" size="sm" onClick={() => onEdit(item)} aria-label={`Modifica ${item.name}`} disabled={disabled}>
        ✎
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} aria-label={`Elimina ${item.name}`} disabled={disabled}>
        🗑
      </Button>
    </li>
  )
}
