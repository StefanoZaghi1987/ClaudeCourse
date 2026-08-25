// src/components/items/item-form.tsx
import { useState, type JSX, type FormEvent, type ChangeEvent } from 'react'
import type { Item, UnitOfMeasure, Category } from '@/db/types'
import { Modal } from '@/components/common/modal'
import { Input } from '@/components/common/input'
import { Button } from '@/components/common/button'
import { validateItemInput } from '@/utils/validation'
import { CATEGORY_LABELS_IT, UNIT_LABELS_IT } from '@/utils/item-labels'

export type ItemFormInput = {
  name: string
  quantity: number | null
  unit: UnitOfMeasure | null
  category: Category | null
  notes: string | null
}

type Props = {
  open: boolean
  item?: Item
  onSubmit: (input: ItemFormInput) => Promise<void>
  onCancel: () => void
}

const UNITS: UnitOfMeasure[] = [
  'kg', 'g', 'mg', 'l', 'ml', 'cl', 'pcs', 'pack', 'box', 'bottle', 'can', 'bag',
]

const CATEGORIES: Category[] = [
  'fruits_vegetables', 'dairy', 'meat_fish', 'beverages', 'frozen',
  'pantry', 'bakery', 'cleaning', 'personal_care', 'other',
]

export function ItemForm({ open, item, onSubmit, onCancel }: Props): JSX.Element {
  const [name, setName] = useState(item?.name ?? '')
  const [quantity, setQuantity] = useState(item?.quantity?.toString() ?? '')
  const [unit, setUnit] = useState<UnitOfMeasure | ''>(item?.unit ?? '')
  const [category, setCategory] = useState<Category | ''>(item?.category ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)

  const parsedQty = quantity === '' ? null : Number(quantity)
  const validationError = validateItemInput({
    name,
    quantity: parsedQty,
    notes: notes || null,
  })
  const canSubmit = !validationError && !submitting

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        quantity: parsedQty,
        unit: unit === '' ? null : unit,
        category: category === '' ? null : category,
        notes: notes.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnitChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const val = e.target.value
    setUnit(val === '' ? '' : (val as UnitOfMeasure))
  }

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const val = e.target.value
    setCategory(val === '' ? '' : (val as Category))
  }

  return (
    <Modal open={open} onClose={onCancel} title={item ? 'Modifica articolo' : 'Nuovo articolo'}>
      <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-4">
        <Input
          label="Nome"
          value={name}
          onChange={e => { setName(e.target.value) }}
          error={name.length > 0 ? validationError?.message : undefined}
          autoFocus
          maxLength={100}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantità"
            type="number"
            value={quantity}
            onChange={e => { setQuantity(e.target.value) }}
            min={0}
            max={9999}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="unit-select" className="text-sm font-medium text-gray-700">
              Unità
            </label>
            <select
              id="unit-select"
              value={unit}
              onChange={handleUnitChange}
              className="rounded border border-gray-300 px-3 py-2"
            >
              <option value="">—</option>
              {UNITS.map(u => <option key={u} value={u}>{UNIT_LABELS_IT[u]}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="category-select" className="text-sm font-medium text-gray-700">
            Categoria
          </label>
          <select
            id="category-select"
            value={category}
            onChange={handleCategoryChange}
            className="rounded border border-gray-300 px-3 py-2"
          >
            <option value="">—</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS_IT[c]}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="notes-textarea" className="text-sm font-medium text-gray-700">
            Note
          </label>
          <textarea
            id="notes-textarea"
            value={notes}
            onChange={e => { setNotes(e.target.value) }}
            maxLength={500}
            rows={2}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Annulla
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {submitting ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
