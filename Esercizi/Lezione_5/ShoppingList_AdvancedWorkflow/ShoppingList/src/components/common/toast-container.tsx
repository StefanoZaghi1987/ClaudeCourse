// src/components/common/toast-container.tsx
import type { JSX } from 'react'
import { useUiStore, type ToastType } from '@/stores/ui-store'

const TYPE_CLASSES: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-600 text-white',
}

export function ToastContainer(): JSX.Element {
  const toasts = useUiStore(s => s.toasts)
  const dismiss = useUiStore(s => (id: string) => s.dismissToast(id))

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center justify-between gap-4 rounded px-4 py-2 shadow-lg ${TYPE_CLASSES[t.type]}`}
          role="alert"
        >
          <span>{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="text-lg font-bold opacity-75 hover:opacity-100"
            aria-label="Chiudi notifica"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
