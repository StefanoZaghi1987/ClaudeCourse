import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ItemFormSchema, type ItemFormInput } from '../logic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ItemFormProps {
  mode: 'add' | 'edit'
  initial?: ItemFormInput
  onSubmit: (data: ItemFormInput) => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
}

const EMPTY: ItemFormInput = {
  name: '',
  quantity: null,
  unit: null,
  notes: null,
  category: null,
}

export function ItemForm({ mode, initial, onSubmit, onCancel, loading }: ItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<ItemFormInput>({
    resolver: zodResolver(ItemFormSchema),
    mode: 'onChange',
    defaultValues: initial ?? EMPTY,
  })

  const submit = handleSubmit(async (data) => {
    await onSubmit(data)
    if (mode === 'add') reset(EMPTY)
  })

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 p-4 rounded-lg border bg-white"
      aria-label={mode === 'add' ? 'Aggiungi articolo' : 'Modifica articolo'}
    >
      <div>
        <Label htmlFor="item-name">Nome</Label>
        <Input
          id="item-name"
          autoFocus
          placeholder="es. pane integrale"
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <p className="text-sm text-destructive mt-1" role="alert">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="item-quantity">Quantità</Label>
          <Input
            id="item-quantity"
            type="number"
            step="0.01"
            min="0"
            placeholder="1"
            aria-invalid={!!errors.quantity}
            {...register('quantity', {
              setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
            })}
          />
          {errors.quantity && <p className="text-sm text-destructive mt-1" role="alert">{errors.quantity.message}</p>}
        </div>
        <div>
          <Label htmlFor="item-unit">Unità</Label>
          <Input
            id="item-unit"
            placeholder="es. kg, pezzi, bottiglie"
            {...register('unit', {
              setValueAs: (v) => (v === '' ? null : v),
            })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="item-category">Categoria</Label>
        <Input
          id="item-category"
          placeholder="es. Frutta e Verdura"
          {...register('category', {
            setValueAs: (v) => (v === '' ? null : v),
          })}
        />
      </div>

      <div>
        <Label htmlFor="item-notes">Note</Label>
        <Textarea
          id="item-notes"
          placeholder="Note opzionali"
          rows={2}
          aria-invalid={!!errors.notes}
          {...register('notes', {
            setValueAs: (v) => (v === '' ? null : v),
          })}
        />
        {errors.notes && <p className="text-sm text-destructive mt-1" role="alert">{errors.notes.message}</p>}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Annulla</Button>
        )}
        <Button type="submit" disabled={!isValid || loading}>
          {mode === 'add' ? 'Aggiungi' : 'Salva'}
        </Button>
      </div>
    </form>
  )
}
