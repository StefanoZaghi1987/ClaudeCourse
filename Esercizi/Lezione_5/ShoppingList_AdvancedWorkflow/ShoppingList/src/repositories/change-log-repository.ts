// src/repositories/change-log-repository.ts
// Thin wrapper su Dexie per la tabella changeLog.
// Sprint 1 espone solo append e appendMany.

import { db } from '@/db/database'
import type { ChangeLogEntry } from '@/db/types'
import type { Table, Transaction } from 'dexie'

function changeLogTable(tx?: Transaction): Table<ChangeLogEntry, string> {
  if (tx) {
    return tx.table<ChangeLogEntry, string>('changeLog')
  }
  return db.changeLog
}

export const changeLogRepository = {
  async append(entry: ChangeLogEntry, tx?: Transaction): Promise<void> {
    await changeLogTable(tx).add(entry)
  },

  async appendMany(entries: ChangeLogEntry[], tx?: Transaction): Promise<void> {
    await changeLogTable(tx).bulkAdd(entries)
  },
}
