// src/components/common/confirm-dialog.tsx
import { useState, useCallback, type JSX } from 'react'
import { Modal } from '@/components/common/modal'
import { Button } from '@/components/common/button'

type ConfirmOptions = {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void
}

export function useConfirm(): {
  confirm(options: ConfirmOptions): Promise<boolean>
  ConfirmDialog: () => JSX.Element | null
} {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve })
    })
  }, [])

  const handleClose = (result: boolean): void => {
    if (state) {
      state.resolve(result)
      setState(null)
    }
  }

  const ConfirmDialog = (): JSX.Element | null => {
    if (!state) return null
    return (
      <Modal open={true} onClose={() => handleClose(false)} title={state.title}>
        <p className="text-gray-700">{state.message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => handleClose(false)}>
            {state.cancelText ?? 'Annulla'}
          </Button>
          <Button variant={state.danger ? 'danger' : 'primary'} onClick={() => handleClose(true)}>
            {state.confirmText ?? 'Conferma'}
          </Button>
        </div>
      </Modal>
    )
  }

  return { confirm, ConfirmDialog }
}
