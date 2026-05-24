import type { EntityType } from './domain'

export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATE_CHANGE'

export interface ChangeLog {
  id: string
  entityType: EntityType
  entityId: string
  operationType: OperationType
  userId: string
  changes: Record<string, { from: unknown; to: unknown }>
  createdAt: number
  synced: boolean          // always false in Sprint 1
  syncAttempts: number     // always 0 in Sprint 1
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'
