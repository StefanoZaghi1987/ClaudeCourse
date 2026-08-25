// src/types/ui.ts
import type { SyncStatus } from '@/db/types'

export type AppError = {
  code:
    | 'VALIDATION_ERROR'
    | 'NETWORK_ERROR'
    | 'PERMISSION_DENIED'
    | 'NOT_FOUND'
    | 'SUPABASE_NOT_CONFIGURED'
    | 'UNKNOWN_ERROR'
  message: string
  details?: unknown
}

export type AppResult<T> = { data: T; error: null } | { data: null; error: AppError }

export type { SyncStatus }
