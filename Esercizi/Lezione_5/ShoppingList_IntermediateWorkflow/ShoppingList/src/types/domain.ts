import { z } from 'zod'

// --- Enum ---
export const UNITS = [
  'kg', 'g', 'l', 'ml',
  'pezzi', 'confezioni', 'pacchi',
  'fette', 'bottiglie', 'lattine',
] as const
export const UnitEnumSchema = z.enum(UNITS)
export type UnitEnum = z.infer<typeof UnitEnumSchema>

export const CATEGORIES = [
  'Frutta e Verdura', 'Latticini', 'Carne e Pesce',
  'Bevande', 'Surgelati', 'Dispensa',
  'Pane e Dolci', 'Igiene e Pulizia', 'Altro',
] as const
export const CategoryEnumSchema = z.enum(CATEGORIES)
export type CategoryEnum = z.infer<typeof CategoryEnumSchema>

export const ItemStatusSchema = z.enum(['DA_COMPRARE', 'COMPLETATO'])
export type ItemStatus = z.infer<typeof ItemStatusSchema>

export const ListStatusSchema = z.enum(['ACTIVE', 'ARCHIVED'])
export type ListStatus = z.infer<typeof ListStatusSchema>

export const PermissionLevelSchema = z.enum(['OWNER', 'EDITOR', 'VIEWER'])
export type PermissionLevel = z.infer<typeof PermissionLevelSchema>

// --- Entities ---
export const SharedUserSchema = z.object({
  userId: z.string(),
  permission: z.enum(['EDITOR', 'VIEWER']),
  invitedAt: z.number(),
})
export type SharedUser = z.infer<typeof SharedUserSchema>

export const ListSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Nome obbligatorio').max(100, 'Max 100 caratteri'),
  ownerId: z.string(),
  status: ListStatusSchema,
  isTemplate: z.boolean(),
  sharedWith: z.array(SharedUserSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
  syncedAt: z.number().nullable(),
  localOnly: z.boolean(),
})
export type List = z.infer<typeof ListSchema>

export const ItemSchema = z.object({
  id: z.string(),
  listId: z.string(),
  name: z.string().trim().min(1, 'Nome obbligatorio').max(200, 'Max 200 caratteri'),
  quantity: z.number().positive('Quantità > 0').nullable(),
  unit: z.union([UnitEnumSchema, z.string(), z.null()]),
  notes: z.string().max(500, 'Max 500 caratteri').nullable(),
  category: z.union([CategoryEnumSchema, z.string(), z.null()]),
  status: ItemStatusSchema,
  deletedAt: z.number().nullable(),
  sortOrder: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  completedAt: z.number().nullable(),
  createdBy: z.string(),
  updatedBy: z.string(),
})
export type Item = z.infer<typeof ItemSchema>

// --- Form inputs ---
export const ListFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome obbligatorio').max(100, 'Max 100 caratteri'),
})
export type ListFormInput = z.infer<typeof ListFormSchema>

export const ItemFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome obbligatorio').max(200, 'Max 200 caratteri'),
  quantity: z.number().positive('Quantità > 0').nullable(),
  unit: z.string().max(20).nullable(),
  notes: z.string().max(500, 'Max 500 caratteri').nullable(),
  category: z.string().max(50).nullable(),
})
export type ItemFormInput = z.infer<typeof ItemFormSchema>

// --- Guest session ---
export const GuestSessionSchema = z.object({
  id: z.literal('current'),
  userId: z.string(),
  createdAt: z.number(),
})
export type GuestSession = z.infer<typeof GuestSessionSchema>

// --- Untouched for forward-compat (Sprint 2+) ---
export interface ItemCatalog {
  id: string
  name: string
  lastUsedAt: number
}

export interface Invite {
  id: string
  listId: string
  token: string
  expiresAt: number
}

// --- ChangeLog entity type ---
export type EntityType = 'LIST' | 'ITEM'
