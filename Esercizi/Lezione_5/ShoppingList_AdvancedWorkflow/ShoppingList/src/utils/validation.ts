import type { AppError } from '@/types/ui'

export const LIMITS = {
  LIST_NAME_MAX: 100,
  ITEM_NAME_MAX: 100,
  ITEM_NOTES_MAX: 500,
  ITEM_QUANTITY_MIN: 0,
  ITEM_QUANTITY_MAX: 9999,
} as const

export function validateListName(name: string): AppError | null {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Il nome della lista non può essere vuoto',
      details: { field: 'name' },
    }
  }
  if (trimmed.length > LIMITS.LIST_NAME_MAX) {
    return {
      code: 'VALIDATION_ERROR',
      message: `Il nome non può superare ${LIMITS.LIST_NAME_MAX} caratteri`,
      details: { field: 'name' },
    }
  }
  return null
}

export type ValidateItemInput = {
  name: string
  quantity?: number | null
  notes?: string | null
}

function validateItemName(name: string): AppError | null {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return {
      code: 'VALIDATION_ERROR',
      message: "Il nome dell'articolo non può essere vuoto",
      details: { field: 'name' },
    }
  }
  if (trimmed.length > LIMITS.ITEM_NAME_MAX) {
    return {
      code: 'VALIDATION_ERROR',
      message: `Il nome non può superare ${LIMITS.ITEM_NAME_MAX} caratteri`,
      details: { field: 'name' },
    }
  }
  return null
}

function validateItemQuantity(quantity: number | null | undefined): AppError | null {
  if (quantity == null) return null
  if (quantity < LIMITS.ITEM_QUANTITY_MIN || quantity > LIMITS.ITEM_QUANTITY_MAX) {
    return {
      code: 'VALIDATION_ERROR',
      message: `La quantità deve essere tra ${LIMITS.ITEM_QUANTITY_MIN} e ${LIMITS.ITEM_QUANTITY_MAX}`,
      details: { field: 'quantity' },
    }
  }
  return null
}

function validateItemNotes(notes: string | null | undefined): AppError | null {
  if (notes == null) return null
  if (notes.length > LIMITS.ITEM_NOTES_MAX) {
    return {
      code: 'VALIDATION_ERROR',
      message: `Le note non possono superare ${LIMITS.ITEM_NOTES_MAX} caratteri`,
      details: { field: 'notes' },
    }
  }
  return null
}

export function validateItemInput(input: ValidateItemInput): AppError | null {
  return (
    validateItemName(input.name) ??
    validateItemQuantity(input.quantity) ??
    validateItemNotes(input.notes)
  )
}

export type ValidateItemPatch = {
  name?: string
  quantity?: number | null
  notes?: string | null
}

/** Valida solo i campi presenti nella patch: usato da updateItem per patch parziali. */
export function validateItemPatch(patch: ValidateItemPatch): AppError | null {
  if (patch.name !== undefined) {
    const err = validateItemName(patch.name)
    if (err) return err
  }
  if (patch.quantity !== undefined) {
    const err = validateItemQuantity(patch.quantity)
    if (err) return err
  }
  if (patch.notes !== undefined) {
    const err = validateItemNotes(patch.notes)
    if (err) return err
  }
  return null
}
