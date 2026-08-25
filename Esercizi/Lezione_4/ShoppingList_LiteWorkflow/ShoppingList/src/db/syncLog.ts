import type { SyncLog, EntityType, SyncAction } from '@models';
import { generateUUID } from '@utils/uuid';
import { db } from './schema';

export async function appendSyncLog(
  entityType: EntityType,
  entityId: string,
  action: SyncAction,
  payload: Record<string, unknown>,
  userId: string,
): Promise<void> {
  const entry: SyncLog = {
    id: generateUUID(),
    entityType,
    entityId,
    action,
    payload,
    timestamp: Date.now(),
    userId,
    synced: false,
    retryCount: 0,
  };
  await db.syncLog.add(entry);
}
