// Duplication note: the body of this helper mirrors `appendSyncLog` in
// src/db/syncLog.ts. The existing helper imports the `db` singleton, which
// breaks test isolation when services use a fresh `ShoppingListDB`. This
// closure-bound version is the source of truth for service-layer writes.
// `appendSyncLog` is retained only for Fase 1 tests and will be removed once
// all callers migrate (see Sprint 2 plan, "Deviations from spec" §1).

import type { ShoppingListDB } from '@db';
import type { EntityType, SyncAction, SyncLog } from '@models';
import { generateUUID } from '@utils/uuid';

export type SyncLogger = (
  entityType: EntityType,
  entityId: string,
  action: SyncAction,
  payload: Record<string, unknown>,
  userId: string,
) => Promise<void>;

export function createSyncLogger(db: ShoppingListDB): SyncLogger {
  return async (entityType, entityId, action, payload, userId) => {
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
  };
}
