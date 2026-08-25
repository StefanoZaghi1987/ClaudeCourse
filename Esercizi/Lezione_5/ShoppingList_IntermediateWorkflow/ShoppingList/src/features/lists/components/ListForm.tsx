import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ListFormSchema, type ListFormInput } from '../logic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ListFormProps {
  mode: 'create' | 'rename'
  initial?: ListFormInput
  onSubmit: (data: ListFormInput) => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function ListForm({ mode, initial, onSubmit, onCancel, loading }: ListFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<ListFormInput>({
    resolver: zodResolver(ListFormSchema),
    mode: 'onChange',
    defaultValues: initial ?? { name: '' },
  })

  useEffect(() => {
    if (mode === 'create') reset({ name: '' })
  }, [mode, reset])

  const submit = handleSubmit(async (data) => {
    await onSubmit(data)
    if (mode === 'create') reset({ name: '' })
  })

  return (
    <form onSubmit={submit} className="flex flex-col gap-2" aria-label={mode === 'create' ? 'Crea lista' : 'Rinomina lista'}>
      <Label htmlFor="list-name">Nome lista</Label>
      <div className="flex gap-2">
        <Input
          id="list-name"
          autoFocus
          placeholder="es. Spesa settimanale"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'list-name-error' : undefined}
          {...register('name')}
        />
        <Button type="submit" disabled={!isValid || loading}>
          {mode === 'create' ? 'Crea' : 'Salva'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annulla
          </Button>
        )}
      </div>
      {errors.name && (
        <p id="list-name-error" className="text-sm text-destructive" role="alert">
          {errors.name.message}
        </p>
      )}
    </form>
  )
}
