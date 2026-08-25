// src/components/lists/list-form.tsx
import { useState, type JSX, type FormEvent } from 'react'
import { Modal } from '@/components/common/modal'
import { Input } from '@/components/common/input'
import { Button } from '@/components/common/button'
import { validateListName } from '@/utils/validation'

type Props = {
  open: boolean
  initialValue?: string
  onSubmit: (name: string) => Promise<void>
  onCancel: () => void
}

export function ListForm({ open, initialValue = '', onSubmit, onCancel }: Props): JSX.Element {
  const [name, setName] = useState(initialValue)
  const [submitting, setSubmitting] = useState(false)

  const validationError = validateListName(name)
  const canSubmit = !validationError && !submitting

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit(name.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onCancel} title={initialValue ? 'Rinomina lista' : 'Nuova lista'}>
      <form onSubmit={(e) => { void handleSubmit(e) }}>
        <Input
          label="Nome lista"
          value={name}
          onChange={e => setName(e.target.value)}
          error={name.length > 0 ? validationError?.message : undefined}
          autoFocus
          maxLength={100}
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Annulla
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {submitting ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
