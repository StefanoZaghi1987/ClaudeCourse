// src/components/items/item-name-autocomplete.tsx
import { useState } from 'react'
import type { JSX, KeyboardEvent, RefObject } from 'react'
import type { CatalogItem } from '@/db/types'
import { useCatalogSuggestions } from '@/hooks/use-catalog-suggestions'
import { Badge } from '@/components/common/badge'
import { formatCategory, formatUnit } from '@/utils/item-labels'

type Props = {
  value: string
  onChange: (value: string) => void
  onSuggestionPick: (suggestion: CatalogItem) => void
  onSubmitEnter: () => void
  inputRef?: RefObject<HTMLInputElement>
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ItemNameAutocomplete({
  value,
  onChange,
  onSuggestionPick,
  onSubmitEnter,
  inputRef,
  placeholder,
  disabled,
  className = '',
}: Props): JSX.Element {
  const [focused, setFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)

  const { suggestions } = useCatalogSuggestions(value)

  const showDropdown = focused && suggestions.length > 0

  function handleFocus(): void {
    setFocused(true)
    setHighlightedIndex(null)
  }

  function handleBlur(): void {
    window.setTimeout(() => {
      setFocused(false)
    }, 150)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev === null ? 0 : Math.min(prev + 1, suggestions.length - 1),
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev === null || prev === 0 ? null : prev - 1,
      )
    } else if (e.key === 'Enter') {
      if (highlightedIndex !== null && suggestions[highlightedIndex] !== undefined) {
        e.preventDefault()
        onSuggestionPick(suggestions[highlightedIndex])
        setHighlightedIndex(null)
      } else {
        onSubmitEnter()
      }
    } else if (e.key === 'Escape') {
      setFocused(false)
      setHighlightedIndex(null)
    }
  }

  function handleSuggestionClick(suggestion: CatalogItem): void {
    onSuggestionPick(suggestion)
    setHighlightedIndex(null)
    inputRef?.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => { onChange(e.target.value) }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        role="combobox"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls="catalog-suggestions-listbox"
        aria-activedescendant={
          highlightedIndex !== null ? `suggestion-${highlightedIndex}` : undefined
        }
        className="w-full rounded border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-200"
      />

      {showDropdown && (
        <ul
          id="catalog-suggestions-listbox"
          role="listbox"
          className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-60 overflow-y-auto rounded border border-gray-300 bg-white shadow-lg"
        >
          {suggestions.map((suggestion, index) => {
            const displayName =
              suggestion.name.charAt(0).toUpperCase() + suggestion.name.slice(1)
            const isHighlighted = index === highlightedIndex

            return (
              <li
                key={suggestion.id}
                id={`suggestion-${index}`}
                role="option"
                aria-selected={isHighlighted}
                onMouseDown={() => { handleSuggestionClick(suggestion) }}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                  isHighlighted ? 'bg-brand-100' : 'hover:bg-gray-100'
                }`}
              >
                <span className="font-medium text-gray-900">{displayName}</span>
                {suggestion.defaultCategory !== null && (
                  <Badge>{formatCategory(suggestion.defaultCategory)}</Badge>
                )}
                {suggestion.defaultQuantity !== null && (
                  <span className="ml-auto text-xs text-gray-500">
                    {suggestion.defaultQuantity}
                    {suggestion.defaultUnit !== null
                      ? ` ${formatUnit(suggestion.defaultUnit)}`
                      : ''}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
