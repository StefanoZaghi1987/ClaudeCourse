import { db } from './schema'
import { newId } from '../../utils/id'
import type { ChangeLog } from '../../types/sync'
import type { EntityType } from '../../types/domain'

interface RecordChangeInput {
  entityType: EntityType
  entityId: string
  operationType: ChangeLog['operationType']
  userId: string
  changes: ChangeLog['changes']
}

export async function recordChange(input: RecordChangeInput): Promise<void> {
  const row: ChangeLog = {
    id: newId(),
    ...input,
    createdAt: Date.now(),
    synced: false,
    syncAttempts: 0,
  }
  await db.changes.add(row)
}
