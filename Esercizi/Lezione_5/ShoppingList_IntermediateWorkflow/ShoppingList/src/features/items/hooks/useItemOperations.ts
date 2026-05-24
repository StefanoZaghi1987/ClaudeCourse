import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import * as itemsRepo from '../../../services/db/items'
import { ItemFormSchema, type ItemFormInput } from '../logic'
import { err, type Result, type AppError } from '../../../utils/result'
import type { Item } from '../../../types/domain'

export function useItemOperations(listId: string | undefined) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  const run = useCallback(async <T,>(
    fn: () => Promise<Result<T, AppError>>,
    successMsg?: string
  ): Promise<Result<T, AppError>> => {
    setLoading(true)
    setError(null)
    try {
      const r = await fn()
      if (r.ok && successMsg) toast.success(successMsg)
      if (!r.ok) {
        setError(r.error)
        toast.error(r.error.message)
      }
      return r
    } finally {
      setLoading(false)
    }
  }, [])

  const createItem = useCallback(async (input: ItemFormInput): Promise<Result<Item, AppError>> => {
    if (!listId) {
      toast.error('Nessuna lista selezionata')
      return err({ code: 'VALIDATION' as const, message: 'Nessuna lista selezionata' })
    }
    const parsed = ItemFormSchema.safeParse(input)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Input invalido'
      toast.error(msg)
      return err({ code: 'VALIDATION' as const, message: msg })
    }
    return run(() => itemsRepo.createItem({ listId, ...parsed.data }), 'Articolo aggiunto')
  }, [listId, run])

  const updateItem = useCallback(async (id: string, patch: Partial<ItemFormInput>): Promise<Result<Item, AppError>> => {
    const parsed = ItemFormSchema.partial().safeParse(patch)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Input invalido'
      toast.error(msg)
      return err({ code: 'VALIDATION' as const, message: msg })
    }
    return run(() => itemsRepo.updateItem(id, parsed.data), 'Articolo aggiornato')
  }, [run])

  const toggleItem = useCallback((id: string) =>
    run(() => itemsRepo.toggleItemStatus(id)),
  [run])

  const softDeleteItem = useCallback((id: string) =>
    run(() => itemsRepo.softDeleteItem(id), 'Articolo spostato nel cestino'),
  [run])

  const restoreItem = useCallback((id: string) =>
    run(() => itemsRepo.restoreItem(id), 'Articolo ripristinato'),
  [run])

  const reorderItems = useCallback((orderedIds: string[]): Promise<Result<void, AppError>> => {
    if (!listId) return Promise.resolve(err({ code: 'VALIDATION' as const, message: 'Nessuna lista' }))
    return run(() => itemsRepo.reorderItems(listId, orderedIds))
  }, [listId, run])

  return {
    loading,
    error,
    createItem,
    updateItem,
    toggleItem,
    softDeleteItem,
    restoreItem,
    reorderItems,
  }
}
