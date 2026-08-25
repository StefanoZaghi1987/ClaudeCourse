import { ItemFormSchema, type ItemFormInput, type Item } from '../../types/domain'

export { ItemFormSchema }
export type { ItemFormInput }

export function computeNextSortOrder(siblings: Item[]): number {
  if (siblings.length === 0) return 1000
  return Math.max(...siblings.map((s) => s.sortOrder)) + 1000
}
