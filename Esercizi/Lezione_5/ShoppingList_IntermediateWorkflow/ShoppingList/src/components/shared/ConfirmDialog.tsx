import { useState, useRef, useCallback, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
}

const DOUBLE_CLICK_WINDOW_MS = 500

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Elimina',
  cancelLabel = 'Annulla',
  onConfirm,
}: ConfirmDialogProps) {
  const [armed, setArmed] = useState(false)
  const armTimer = useRef<number | null>(null)

  const handleConfirmClick = useCallback(async () => {
    if (!armed) {
      setArmed(true)
      armTimer.current = window.setTimeout(() => setArmed(false), DOUBLE_CLICK_WINDOW_MS)
      return
    }
    if (armTimer.current !== null) window.clearTimeout(armTimer.current)
    setArmed(false)
    await onConfirm()
    onOpenChange(false)
  }, [armed, onConfirm, onOpenChange])

  const handleOpenChange = useCallback((next: boolean) => {
    if (!next) {
      if (armTimer.current !== null) window.clearTimeout(armTimer.current)
      setArmed(false)
    }
    onOpenChange(next)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmClick}
            aria-pressed={armed}
          >
            {armed ? 'Conferma di nuovo' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
