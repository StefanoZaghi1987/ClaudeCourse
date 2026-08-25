// src/components/common/modal.tsx
import * as Dialog from '@radix-ui/react-dialog'
import type { JSX, ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, description, children }: Props): JSX.Element {
  const handleOpenChange = (o: boolean): void => { if (!o) onClose() }
  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-bold text-gray-900">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="mt-1 text-sm text-gray-600">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
