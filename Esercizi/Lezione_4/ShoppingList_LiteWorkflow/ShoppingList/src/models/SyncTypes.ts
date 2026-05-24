export type EntityType = 'list' | 'item' | 'article' | 'share';

export type SyncAction = 'create' | 'update' | 'delete';

export interface SyncLog {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: SyncAction;
  payload: Record<string, unknown>;
  timestamp: number;
  userId: string;
  synced: boolean;
  syncedAt?: number;
  syncError?: string;
  retryCount: number;
}

export interface NewSyncLog {
  entityType: EntityType;
  entityId: string;
  action: SyncAction;
  payload: Record<string, unknown>;
  userId: string;
}

export interface SyncStatus {
  online: boolean;
  syncing: boolean;
  pendingChanges: number;
  lastSyncAt?: number;
  lastError?: string;
}
