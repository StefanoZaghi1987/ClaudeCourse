import type { Category, UnitOfMeasure } from '@/db/types'

export const CATEGORY_LABELS_IT: Record<Category, string> = {
  fruits_vegetables: 'Frutta e verdura',
  dairy: 'Latticini',
  meat_fish: 'Carne e pesce',
  beverages: 'Bevande',
  frozen: 'Surgelati',
  pantry: 'Dispensa',
  bakery: 'Panetteria',
  cleaning: 'Pulizie',
  personal_care: 'Cura persona',
  other: 'Altro',
}

export const UNIT_LABELS_IT: Record<UnitOfMeasure, string> = {
  kg: 'kg',
  g: 'g',
  mg: 'mg',
  l: 'L',
  ml: 'ml',
  cl: 'cl',
  pcs: 'pz',
  pack: 'conf.',
  box: 'scat.',
  bottle: 'bott.',
  can: 'latt.',
  bag: 'busta',
}

export function formatCategory(c: Category | null): string {
  return c === null ? '' : CATEGORY_LABELS_IT[c]
}

export function formatUnit(u: UnitOfMeasure | null): string {
  return u === null ? '' : UNIT_LABELS_IT[u]
}
