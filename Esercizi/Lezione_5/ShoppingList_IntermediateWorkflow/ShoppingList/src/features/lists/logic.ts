import { ListFormSchema, type ListFormInput, type List } from '../../types/domain'

export { ListFormSchema }
export type { ListFormInput }

const RTF = new Intl.RelativeTimeFormat('it', { numeric: 'auto' })

export function formatUpdatedAt(list: List): string {
  const deltaMs = Date.now() - list.updatedAt
  const deltaSec = Math.round(-deltaMs / 1000)
  if (Math.abs(deltaSec) < 60) return RTF.format(deltaSec, 'second')
  const deltaMin = Math.round(deltaSec / 60)
  if (Math.abs(deltaMin) < 60) return RTF.format(deltaMin, 'minute')
  const deltaHour = Math.round(deltaMin / 60)
  if (Math.abs(deltaHour) < 24) return RTF.format(deltaHour, 'hour')
  const deltaDay = Math.round(deltaHour / 24)
  return RTF.format(deltaDay, 'day')
}
