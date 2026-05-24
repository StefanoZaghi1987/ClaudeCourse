import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import * as listsRepo from '../../../services/db/lists'
import { ListFormSchema } from '../logic'
import { err, type Result, type AppError } from '../../../utils/result'
import type { List, ListStatus } from '../../../types/domain'

export function useListOperations() {
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

  const createList = useCallback(async (name: string): Promise<Result<List, AppError>> => {
    const parsed = ListFormSchema.safeParse({ name })
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Input invalido'
      toast.error(msg)
      return err({ code: 'VALIDATION' as const, message: msg })
    }
    return run(() => listsRepo.createList({ name: parsed.data.name }), 'Lista creata')
  }, [run])

  const renameList = useCallback(async (id: string, name: string): Promise<Result<List, AppError>> => {
    const parsed = ListFormSchema.safeParse({ name })
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Input invalido'
      toast.error(msg)
      return err({ code: 'VALIDATION' as const, message: msg })
    }
    return run(() => listsRepo.updateList(id, { name: parsed.data.name }), 'Lista rinominata')
  }, [run])

  const setListStatus = useCallback((id: string, status: ListStatus) => {
    const msg = status === 'ARCHIVED' ? 'Lista archiviata' : 'Lista riattivata'
    return run(() => listsRepo.updateList(id, { status }), msg)
  }, [run])

  const deleteList = useCallback((id: string) =>
    run(() => listsRepo.deleteList(id), 'Lista eliminata'),
  [run])

  return {
    loading,
    error,
    clearError: () => setError(null),
    createList,
    renameList,
    archiveList: (id: string) => setListStatus(id, 'ARCHIVED'),
    unarchiveList: (id: string) => setListStatus(id, 'ACTIVE'),
    deleteList,
  }
}
