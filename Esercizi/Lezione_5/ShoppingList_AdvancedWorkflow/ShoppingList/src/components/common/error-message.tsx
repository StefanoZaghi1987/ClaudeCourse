// src/components/common/error-message.tsx
import type { JSX } from 'react'
import type { AppError } from '@/types/ui'
import { Button } from '@/components/common/button'

type Props = {
  error: AppError
  onRetry?: () => void
}

export function ErrorMessage({ error, onRetry }: Props): JSX.Element {
  return (
    <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
      <p className="font-medium">{error.message}</p>
      {onRetry && (
        <div className="mt-2">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Riprova
          </Button>
        </div>
      )}
    </div>
  )
}
