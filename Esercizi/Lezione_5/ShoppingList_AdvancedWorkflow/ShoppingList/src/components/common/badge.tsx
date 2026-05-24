// src/components/common/badge.tsx
import type { JSX, ReactNode } from 'react'

type Variant = 'default' | 'success' | 'warning' | 'danger'

type Props = {
  variant?: Variant
  children: ReactNode
}

const CLASSES: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
}

export function Badge({ variant = 'default', children }: Props): JSX.Element {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${CLASSES[variant]}`}>
      {children}
    </span>
  )
}
