// src/components/common/loading-spinner.tsx
import type { JSX } from 'react'

export function LoadingSpinner(): JSX.Element {
  return (
    <div className="flex items-center justify-center py-8" role="status" aria-label="Caricamento">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600" />
    </div>
  )
}
