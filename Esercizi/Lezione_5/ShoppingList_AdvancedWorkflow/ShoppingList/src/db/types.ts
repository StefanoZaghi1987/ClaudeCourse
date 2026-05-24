// src/db/types.ts
// Tipi per le entità del database locale Dexie.
// Fonte autoritativa: docs/SoftwareRequirements.md Sezione 4.3
// In caso di discrepanza con .claude/architettura.md, l'SRS vince.

// ─── Enums ──────────────────────────────────────────────────

export type Permission = 'owner' | 'editor' | 'viewer'
export type ListStatus = 'active' | 'archived'
export type ItemStatus = 'pending' | 'completed'
export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATE_CHANGE'
export type EntityType = 'LIST' | 'ITEM' | 'INVITE'
export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired'
export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'error' | 'offline'

export type UnitOfMeasure =
  | 'kg'
  | 'g'
  | 'mg'
  | 'l'
  | 'ml'
  | 'cl'
  | 'pcs'
  | 'pack'
  | 'box'
  | 'bottle'
  | 'can'
  | 'bag'

export type Category =
  | 'fruits_vegetables'
  | 'dairy'
  | 'meat_fish'
  | 'beverages'
  | 'frozen'
  | 'pantry'
  | 'bakery'
  | 'cleaning'
  | 'personal_care'
  | 'other'

// ─── Entità ─────────────────────────────────────────────────

export interface ShareEntry {
  userId: string
  permission: Exclude<Permission, 'owner'>
  invitedAt: number
  invitedBy: string
}

export interface List {
  id: string
  name: string
  userId: string
  status: ListStatus
  isTemplate: boolean
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  sharedWith: ShareEntry[]
  itemOrder: string[]
  syncedAt: number | null
}

export interface Item {
  id: string
  listId: string
  name: string
  quantity: number | null
  unit: UnitOfMeasure | null
  notes: string | null
  category: Category | null
  status: ItemStatus
  sortOrder: number
  createdAt: number
  updatedAt: number
  completedAt: number | null
  deletedAt: number | null
  createdBy: string
  updatedBy: string
}

export interface ChangeLogEntry {
  id: string
  userId: string
  operationType: OperationType
  entityType: EntityType
  entityId: string
  changes: {
    before: Partial<List | Item> | null
    after: Partial<List | Item> | null
  }
  timestamp: number
  synced: boolean
  syncedAt: number | null
  conflictResolution: string | null
}

export interface CatalogItem {
  id: string
  userId: string
  name: string
  frequency: number
  lastUsedAt: number
  defaultCategory: Category | null
  defaultUnit: UnitOfMeasure | null
  defaultQuantity: number | null
}

export interface Invite {
  token: string
  listId: string
  permission: Exclude<Permission, 'owner'>
  createdBy: string
  createdAt: number
  expiresAt: number
  status: InviteStatus
  invitedEmail: string | null
}
