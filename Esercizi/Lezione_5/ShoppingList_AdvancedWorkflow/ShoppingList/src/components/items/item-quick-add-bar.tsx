// src/components/items/item-quick-add-bar.tsx
import { useState, useRef, type JSX, type ChangeEvent, type FocusEvent } from 'react'
import type { Item, UnitOfMeasure, Category, CatalogItem } from '@/db/types'
import type { AppResult } from '@/types/ui'
import { Button } from '@/components/common/button'
import { ItemNameAutocomplete } from '@/components/items/item-name-autocomplete'
import { CATEGORY_LABELS_IT, UNIT_LABELS_IT } from '@/utils/item-labels'
import { useUiStore } from '@/stores/ui-store'

export type QuickAddInput = {
  name: string
  category: Category | null
  unit: UnitOfMeasure | null
  quantity: number | null
}

type Props = {
  onSubmit: (input: QuickAddInput) => Promise<AppResult<Item>>
}

const TOP_CATEGORIES: Category[] = ['fruits_vegetables', 'dairy', 'bakery', 'meat_fish']
const ALL_CATEGORIES: Category[] = [
  'fruits_vegetables', 'dairy', 'meat_fish', 'beverages', 'frozen',
  'pantry', 'bakery', 'cleaning', 'personal_care', 'other',
]
const EXTRA_CATEGORIES: Category[] = ALL_CATEGORIES.filter(c => !TOP_CATEGORIES.includes(c))
const UNITS: UnitOfMeasure[] = [
  'kg', 'g', 'mg', 'l', 'ml', 'cl', 'pcs', 'pack', 'box', 'bottle', 'can', 'bag',
]

const CHIP_BASE = 'rounded-full border px-3 py-1 text-sm transition-colors'
const CHIP_ACTIVE = 'border-brand-600 bg-brand-100 text-brand-700'
const CHIP_IDLE = 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'

type CategoryChipProps = {
  category: Category
  active: boolean
  onSelect: (c: Category) => void
}

function CategoryChip({ category, active, onSelect }: CategoryChipProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => { onSelect(category) }}
      aria-pressed={active}
      className={`${CHIP_BASE} ${active ? CHIP_ACTIVE : CHIP_IDLE}`}
    >
      {CATEGORY_LABELS_IT[category]}
    </button>
  )
}

export function ItemQuickAddBar({ onSubmit }: Props): JSX.Element {
  const [name, setName] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [category, setCategory] = useState<Category | null>(null)
  const [unit, setUnit] = useState<UnitOfMeasure | null>(null)
  const [quantity, setQuantity] = useState<number | null>(null)
  const [userTouchedCategory, setUserTouchedCategory] = useState(false)
  const [userTouchedUnit, setUserTouchedUnit] = useState(false)
  const [userTouchedQuantity, setUserTouchedQuantity] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const uiStore = useUiStore()

  const trimmed = name.trim()
  const canSubmit = trimmed.length > 0 && !submitting

  function handleCategoryToggle(c: Category): void {
    setCategory(prev => (prev === c ? null : c))
    setUserTouchedCategory(true)
  }

  function handleUnitChange(e: ChangeEvent<HTMLSelectElement>): void {
    const val = e.target.value
    setUnit(val === '' ? null : (val as UnitOfMeasure))
    setUserTouchedUnit(true)
  }

  function handleQuantityStep(delta: number): void {
    setQuantity(prev => {
      const base = prev ?? 0
      const next = Math.max(0, Math.min(9999, base + delta))
      return next === 0 ? null : next
    })
    setUserTouchedQuantity(true)
  }

  function handlePick(suggestion: CatalogItem): void {
    const displayName = suggestion.name.charAt(0).toUpperCase() + suggestion.name.slice(1)
    setName(displayName)
    if (!userTouchedCategory && suggestion.defaultCategory !== null) {
      setCategory(suggestion.defaultCategory)
    }
    if (!userTouchedUnit && suggestion.defaultUnit !== null) {
      setUnit(suggestion.defaultUnit)
    }
    if (!userTouchedQuantity && suggestion.defaultQuantity !== null) {
      setQuantity(suggestion.defaultQuantity)
    }
    inputRef.current?.focus()
  }

  async function handleSubmit(): Promise<void> {
    if (!canSubmit) return
    setSubmitting(true)
    const result = await onSubmit({ name: trimmed, category, unit, quantity })
    setSubmitting(false)
    if (result.error) {
      uiStore.pushToast('error', result.error.message)
      return
    }
    setName('')
    setCategory(null)
    setUnit(null)
    setQuantity(null)
    setUserTouchedCategory(false)
    setUserTouchedUnit(false)
    setUserTouchedQuantity(false)
    inputRef.current?.focus()
  }

  function handleBlurForm(e: FocusEvent<HTMLFormElement>): void {
    const related = e.relatedTarget
    if (related !== null && e.currentTarget.contains(related)) return
    if (trimmed.length === 0) {
      window.setTimeout(() => {
        if (!e.currentTarget.contains(document.activeElement)) {
          setExpanded(false)
        }
      }, 200)
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void handleSubmit() }}
      onFocus={() => { setExpanded(true) }}
      onBlur={handleBlurForm}
      className="sticky bottom-0 border-t bg-white p-3 space-y-2"
    >
      <div className="flex gap-2 items-stretch">
        <ItemNameAutocomplete
          value={name}
          onChange={(v) => { setName(v) }}
          onSuggestionPick={handlePick}
          onSubmitEnter={() => { void handleSubmit() }}
          inputRef={inputRef}
          placeholder="Aggiungi articolo..."
          disabled={submitting}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!canSubmit}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          +
        </Button>
      </div>

      {expanded && (
        <div className="flex flex-wrap items-center gap-2">
          {TOP_CATEGORIES.map(c => (
            <CategoryChip
              key={c}
              category={c}
              active={category === c}
              onSelect={handleCategoryToggle}
            />
          ))}
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => { setShowAllCategories(prev => !prev) }}
          >
            {showAllCategories ? 'Meno…' : 'Altre…'}
          </Button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { handleQuantityStep(-1) }}
              aria-label="Diminuisci quantità"
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              −
            </button>
            <span className="min-w-[2ch] text-center text-sm font-medium" aria-live="polite">
              {quantity ?? 0}
            </span>
            <button
              type="button"
              onClick={() => { handleQuantityStep(1) }}
              aria-label="Aumenta quantità"
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              +
            </button>
          </div>

          <select
            value={unit ?? ''}
            onChange={handleUnitChange}
            aria-label="Unità di misura"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">—</option>
            {UNITS.map(u => (
              <option key={u} value={u}>{UNIT_LABELS_IT[u]}</option>
            ))}
          </select>
        </div>
      )}

      {expanded && showAllCategories && (
        <div className="flex flex-wrap gap-2">
          {EXTRA_CATEGORIES.map(c => (
            <CategoryChip
              key={c}
              category={c}
              active={category === c}
              onSelect={handleCategoryToggle}
            />
          ))}
        </div>
      )}
    </form>
  )
}
