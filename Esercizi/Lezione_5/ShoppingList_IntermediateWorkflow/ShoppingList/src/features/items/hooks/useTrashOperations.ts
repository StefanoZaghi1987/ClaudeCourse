import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { restoreItem as restoreRepo } from '../../../services/db/items'
import { db } from '../../../services/db/schema'
import { recordChange } from '../../../services/db/changeLog'
import { getCurrentUserId } from '../../../services/db/session'
import { ok, err, toAppError, type Result, type AppError } from '../../../utils/result'

async function purgeItem(id: string): Promise<Result<void, AppError>> {
  try {
    const userId = await getCurrentUserId()
    await db.transaction('rw', db.items, db.changes, async () => {
      const current = await db.items.get(id)
      if (!current) return
      await db.items.delete(id)
      await recordChange({
        entityType: 'ITEM',
        entityId: id,
        operationType: 'DELETE',
        userId,
        changes: { purged: { from: false, to: true } },
      })
    })
    return ok(undefined as void)
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export function useTrashOperations() {
  const [loading, setLoading] = useState(false)

  const run = useCallback(async <T,>(
    fn: () => Promise<Result<T, AppError>>,
    successMsg: string
  ): Promise<Result<T, AppError>> => {
    setLoading(true)
    try {
      const r = await fn()
      if (r.ok) toast.success(successMsg)
      else toast.error(r.error.message)
      return r
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    restoreItem: (id: string) => run(() => restoreRepo(id), 'Articolo ripristinato'),
    purgeItem: (id: string) => run(() => purgeItem(id), 'Articolo eliminato definitivamente'),
  }
}
