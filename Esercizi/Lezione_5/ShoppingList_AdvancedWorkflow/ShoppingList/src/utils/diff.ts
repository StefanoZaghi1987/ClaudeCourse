// src/utils/diff.ts
// Calcola un diff minimale shallow tra due oggetti.
// Usato dal layer service per popolare ChangeLogEntry.changes su UPDATE.

export function buildDiff<T extends object>(
  before: T,
  after: T,
  ignoreFields: (keyof T)[] = [],
): { before: Partial<T>; after: Partial<T> } {
  const diffBefore: Partial<T> = {}
  const diffAfter: Partial<T> = {}
  const allKeys = new Set<keyof T>([
    ...(Object.keys(before) as (keyof T)[]),
    ...(Object.keys(after) as (keyof T)[]),
  ])
  for (const key of allKeys) {
    if (ignoreFields.includes(key)) continue
    if (before[key] !== after[key]) {
      diffBefore[key] = before[key]
      diffAfter[key] = after[key]
    }
  }
  return { before: diffBefore, after: diffAfter }
}
