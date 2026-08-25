# Spec — Sprint 1 Core Offline: Liste e Articoli

**Data:** 2026-04-14
**Autore:** Brainstorming Stefano Zaghi + Claude
**Stato:** In attesa di approvazione utente
**Sprint precedente:** [`Sprint0_Setup_Spec.md`](./Sprint0_Setup_Spec.md)
**Architettura canonical:** [`.claude/architettura.md`](../../.claude/architettura.md)
**Dominio canonical:** [`.claude/dominio.md`](../../.claude/dominio.md)
**UI/UX canonical:** [`.claude/ui-ux.md`](../../.claude/ui-ux.md)
**Qualità canonical:** [`.claude/qualita.md`](../../.claude/qualita.md)
**Sync canonical:** [`.claude/sync.md`](../../.claude/sync.md)

---

## 1. Scopo

Sprint 1 realizza il **nucleo offline** dell'app ShoppingList: CRUD completo di liste e articoli, soft-delete con cestino item-only, e ordinamento drag-and-drop, **tutto senza autenticazione né rete**. Al termine dello sprint, un utente guest può creare liste, aggiungere/modificare/spuntare/eliminare articoli, riordinarli, archiviare liste, recuperare articoli dal cestino — e l'app funziona identicamente con connessione assente.

**Obiettivo strategico:** stabilire la forma dei layer dati (tipi canonici, Dexie v2, repository pattern, `ChangeLog`) e la forma dei layer UI (shadcn/ui, React Hook Form + Zod, sonner, `useLiveQuery`) che tutti gli sprint successivi riuseranno. Le decisioni prese in Sprint 1 compongono precedenti vincolanti per Sprint 2–5.

**Fuori scope** (rimandato a sprint successivi):

| Scope | Sprint target |
|---|---|
| Autenticazione, utenti reali, sharing, inviti | Sprint 2/3 |
| Catalogo articoli (seed, autocompletamento, frequency) | Sprint 2 |
| Modalità shopping (`/lists/:id/shopping`, swipe, supermarket path) | Sprint 3 |
| Framer Motion animations (slide-in, strikethrough, fade) | Sprint 3 |
| Responsive shell (mobile bottom nav, tablet sidebar, desktop sidebar) | Sprint 2 |
| Dark mode | Sprint 3 |
| React Virtual per liste > 50 elementi | Sprint 3 (solo se dati reali lo richiedono) |
| Supabase push/pull, conflict resolution, Realtime | Sprint 4 |
| Messaggi errore estesi (NETWORK, SYNC_FAILED, PERMISSION) | Sprint 4 |

---

## 2. Decisioni chiave (brainstorming 2026-04-14)

| # | Decisione | Alternative scartate | Razionale |
|---|---|---|---|
| 1 | **Domain shape**: adottare pieno canonical `dominio.md` per `List` e `Item`, inclusi `quantity`, `unit`, `notes`, `sortOrder`, `completedAt`, `createdBy`/`updatedBy`, `sharedWith`, `localOnly`, `syncedAt`. | Minimal types (Sprint 0 baseline); ibrido senza `UnitEnum`. | Eliminare il drift tra docs canonici e codice; zero churn schema in sprint successivi. |
| 2 | **Reactive flow**: `useLiveQuery` da `dexie-react-hooks` direttamente dai componenti; Zustand usato solo per `uiStore`/`authStore`, non per dati di dominio. | Zustand mirror di Dexie; pattern ibrido. | Single source of truth (Dexie), zero staleness, meno layer. |
| 3 | **Guest identity**: tabella `session` Dexie singleton-row con `userId = 'guest-<nanoid>'`, creata al primo avvio. | Hardcoded `'guest-local'`; localStorage-backed. | Sopravvive a clear-storage di localStorage, permette migrazione trasparente quando arriva auth. |
| 4 | **Trash scope**: solo articoli soft-deleted in `/trash` (globale, cross-list con filtro). Liste usano stato `ACTIVE`/`ARCHIVED`; delete lista = hard-delete con conferma (no trash per liste). | Items + lists in trash; trash per-list. | Matcha `dominio.md` §"Regole di Business"; evita stato aggiuntivo su `List`. |
| 5 | **UI scope**: Usable MVP — dashboard `/lists`, detail `/lists/:id`, trash `/trash`. Form con quantity/notes/category. Drag-reorder. NO modalità shopping, NO category grouping, NO responsive shell completa, NO animations. | Bare wiring (throwaway UI); full polish (overrun rischio). | Bilanciamento tra "demo-able" e "schedule realistica". |
| 6 | **Test depth**: unit (logic/schemas) + hook (RTL + fake-indexeddb) + 1 Playwright E2E golden-path in modalità offline. | Solo unit; full coverage `qualita.md`. | Verifica offline-first end-to-end; evita esplosione test boilerplate. |
| 7 | **Build order**: Approccio B — vertical slices (Foundation → Lists → Items → Trash+E2E) con checkpoint tra fasi. | Data-first orizzontale; spike-first. | Ogni slice è demo-able e test-able, subagent-friendly, pattern TDD rispettato. |
| 8 | **UI stack**: adozione completa di `shadcn/ui` (CLI copy) + React Hook Form + Zod + sonner. Zod schemas come source of truth per i tipi (`z.infer`). | Hand-rolled; ibrido. | Onora `ui-ux.md`; elimina drift type/validator; pattern compound per sprint futuri. |
| 9 | **Drag-reorder**: `@dnd-kit/core` + `@dnd-kit/sortable`. `ui-ux.md` §"Stack UI" lista `react-beautiful-dnd` ma quella libreria è archiviata dal 2021 con problemi React 18 noti. Update di `ui-ux.md` con deprecation note è parte di Sprint 1. | `react-beautiful-dnd`; nessun reorder. | Canonical per React moderno, a11y first-class, mantained. |
| 10 | **Responsive shell**: top nav desktop-optimized; mobile usabile ma basic. | Full responsive da `ui-ux.md`; mobile-first only. | Sprint 1 è data-integrity, non UI polish. Responsive completo in Sprint 2. |
| 11 | **Cascade confirm**: dialog + physical double-click per ogni delete lista, indipendente dalla dimensione. | Scaled UX (double-click solo per >20 items); single confirm. | Predittibilità della destruttività > sofisticazione UX; onora `CLAUDE.md` §"Vincoli Assoluti" letteralmente. |
| 12 | **Playwright base URL**: `:4173` (preview, service worker attivo). | `:5173` (dev). | Offline-first esige SW reale; `:5173` testa "nulla risponde", non "offline". |
| 13 | **Migration upgrade**: idempotente, backfill difensivo dei campi nuovi su righe v1. Nuovo indice `[synced+createdAt]` su `changes` aggiunto ora. | Upgrade vuoto; versione v3 separata per indici. | Un solo version bump, nessuna migration futura per indici. |
| 14 | **`Result<T, E>` boundary**: ai confini modulo (repo methods), throws interni ai moduli. `getCurrentUserId()` throws, `createList()` ritorna `Result`. | Full-Result ovunque. | Evita `Result<T, Result<U, E>>` e ceremony ridondante. |

---

## 3. Definition of Done (13 criteri verificabili)

| # | Criterio | Comando di verifica | Output atteso |
|---|---|---|---|
| 1 | Migrazione Dexie v2 idempotente su DB vuoto e su v1 | `npm test -- migration` | Green; righe v1 sopravvivono con campi backfillati |
| 2 | Guest session persiste tra reload | `npm test -- session` | Green; stesso `userId` al secondo call |
| 3 | CRUD repos + `changeLog` green | `npm test -- services/db` | Green; ogni operazione scrive 1 row in `changes` |
| 4 | Validazioni Zod green | `npm test -- logic` | Green; edge cases coperti (nome vuoto, >100, qty ≤ 0) |
| 5 | Hook tests green (RTL + fake-indexeddb) | `npm test -- hooks` | Green; `useLists`, `useListOperations`, `useItems`, `useItemOperations`, `useTrash` |
| 6 | `/lists` dashboard reattivo | Manuale `npm run dev` | Crea/archivia/elimina aggiorna istantaneamente |
| 7 | `/lists/:id` + toggle + soft-delete + drag-reorder persistono | Manuale `npm run dev` | Operazioni round-trip attraverso Dexie |
| 8 | `/trash` mostra articoli soft-deleted con restore | Manuale `npm run dev` | Restore riporta l'articolo alla lista d'origine |
| 9 | Golden-path E2E passa offline | `npm run test:e2e -- offline-core` | Green; zero richieste di rete osservate |
| 10 | Build + preview production-grade | `npm run build && npm run preview` | `:4173` serve MVP, zero errori console |
| 11 | shadcn/ui components renderizzati | Manuale `/lists` | Button, Input, Dialog, Skeleton, Toast visibili e funzionanti |
| 12 | Toast firing su operazioni significative | Manuale su ogni CRUD | `toast.success` / `toast.error` visibile per ogni azione |
| 13 | RHF + Zod bloccano submit invalidi | Manuale form List/Item | Bottone submit disabilitato con form invalido; errori inline onChange |

**Tutti i 13 criteri devono essere green prima di chiudere lo sprint. Nessuno opzionale.**

---

## 4. Data layer

### 4.1 — Zod schemas come source of truth (`src/types/domain.ts`)

Invertiamo la convenzione: le Zod schemas sono definite per prime, e i tipi TypeScript sono derivati via `z.infer<>`. Questo elimina la possibilità di drift tra "interfaccia dice X" e "validator dice Y".

```ts
import { z } from 'zod'

// Enum
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

// SharedUser (Sprint 1: always [])
export const SharedUserSchema = z.object({
  userId: z.string(),
  permission: z.enum(['EDITOR', 'VIEWER']),
  invitedAt: z.number(),
})
export type SharedUser = z.infer<typeof SharedUserSchema>

// List (persisted row shape)
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

// Item (persisted row shape)
// unit: UnitEnum OR free string OR null (matches 'category' pattern)
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

// Form input schemas (subset of persisted shape)
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

// GuestSession
export const GuestSessionSchema = z.object({
  id: z.literal('current'),
  userId: z.string(),
  createdAt: z.number(),
})
export type GuestSession = z.infer<typeof GuestSessionSchema>

// Kept untouched for forward compat (Sprint 2+)
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

// EntityType used by ChangeLog
export type EntityType = 'LIST' | 'ITEM'
```

### 4.2 — ChangeLog estesa (`src/types/sync.ts`)

```ts
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
```

Matcha `sync.md` §"Change Log" → pronto per Sprint 4 senza re-migration.

### 4.3 — Dexie v2 migration (`src/services/db/schema.ts`)

```ts
import Dexie, { type Table } from 'dexie'
import type { List, Item, ItemCatalog, Invite, GuestSession } from '../../types/domain'
import type { ChangeLog } from '../../types/sync'

export class ShoppingListDB extends Dexie {
  lists!: Table<List, string>
  items!: Table<Item, string>
  changes!: Table<ChangeLog, string>
  catalog!: Table<ItemCatalog, string>
  invites!: Table<Invite, string>
  session!: Table<GuestSession, 'current'>

  constructor() {
    super('ShoppingListDB')

    // v1 — Sprint 0 baseline, FROZEN (CLAUDE.md forbids in-place edits)
    this.version(1).stores({
      lists:    '&id, ownerId, status, updatedAt',
      items:    '&id, listId, status, category, updatedAt, [listId+deletedAt]',
      changes:  '&id, entityType, entityId, synced, createdAt',
      catalog:  '&id, &name, lastUsedAt',
      invites:  '&id, listId, token, expiresAt',
    })

    // v2 — Sprint 1
    this.version(2).stores({
      lists:    '&id, ownerId, status, updatedAt, localOnly',
      items:    '&id, listId, status, category, updatedAt, sortOrder, ' +
                '[listId+deletedAt], [listId+sortOrder], [listId+status]',
      changes:  '&id, entityType, entityId, synced, createdAt, [synced+createdAt]',
      catalog:  '&id, &name, lastUsedAt',
      invites:  '&id, listId, token, expiresAt',
      session:  '&id',
    }).upgrade(async (tx) => {
      const now = Date.now()
      await tx.table('lists').toCollection().modify((l: Record<string, unknown>) => {
        l.isTemplate ??= false
        l.sharedWith ??= []
        l.syncedAt ??= null
        l.localOnly ??= true
        if (l.status === 'active') l.status = 'ACTIVE'
        if (l.status === 'archived') l.status = 'ARCHIVED'
      })
      await tx.table('items').toCollection().modify((i: Record<string, unknown>) => {
        i.quantity ??= null
        i.unit ??= null
        i.notes ??= null
        i.sortOrder ??= now
        i.completedAt ??= null
        i.createdBy ??= 'guest-legacy'
        i.updatedBy ??= 'guest-legacy'
        if (i.status === 'pending') i.status = 'DA_COMPRARE'
        if (i.status === 'completed') i.status = 'COMPLETATO'
      })
    })
  }
}

export const db = new ShoppingListDB()
```

### 4.4 — ChangeLog helper (`src/services/db/changeLog.ts`)

```ts
import { db } from './schema'
import { nanoid } from '../../utils/id'
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
    id: nanoid(),
    ...input,
    createdAt: Date.now(),
    synced: false,
    syncAttempts: 0,
  }
  await db.changes.add(row)
}
```

**Contratto**: single chokepoint. I repos non scrivono mai direttamente in `db.changes`. Il sync engine Sprint 4 legge solo da qui.

---

## 5. Service layer (`src/services/db/`)

### 5.1 — `Result<T, E>` utility (`src/utils/result.ts`)

```ts
export type Result<T, E = AppError> =
  | { ok: true; data: T }
  | { ok: false; error: E }

export interface AppError {
  code: 'VALIDATION' | 'NOT_FOUND' | 'DB_WRITE' | 'DB_READ' | 'UNKNOWN'
  message: string
  cause?: unknown
}

export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

export function toAppError(e: unknown, code: AppError['code'] = 'UNKNOWN'): AppError {
  if (e instanceof Error) return { code, message: e.message, cause: e }
  return { code, message: String(e), cause: e }
}
```

**Regola**: `Result` ai confini modulo (repo method → hook), throws interni al modulo.

### 5.2 — Guest session (`src/services/db/session.ts`)

```ts
import { db } from './schema'
import { nanoid } from '../../utils/id'
import type { GuestSession } from '../../types/domain'
import { ok, err, toAppError, type Result } from '../../utils/result'

export async function getOrCreateGuestSession(): Promise<Result<GuestSession>> {
  try {
    const existing = await db.session.get('current')
    if (existing) return ok(existing)
    const fresh: GuestSession = {
      id: 'current',
      userId: 'guest-' + nanoid(),
      createdAt: Date.now(),
    }
    await db.session.put(fresh)
    return ok(fresh)
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

// Internal helper: throws on failure. Only callable from repo methods
// that wrap themselves in try/catch.
export async function getCurrentUserId(): Promise<string> {
  const r = await getOrCreateGuestSession()
  if (!r.ok) throw new Error('Session bootstrap failed: ' + r.error.message)
  return r.data.userId
}
```

### 5.3 — Lists repository (`src/services/db/lists.ts`)

Firme e semantica (corpi completi scritti durante Phase 1):

```ts
export async function createList(input: { name: string }): Promise<Result<List>>
// - getCurrentUserId()
// - Transaction(rw, lists, changes): db.lists.add(list); recordChange('CREATE', ...)
// - Ritorna la riga creata

export async function updateList(
  id: string,
  patch: { name?: string; status?: ListStatus }
): Promise<Result<List>>
// - Transaction(rw, lists, changes): legge current; calcola diff; se vuoto ritorna current ok
// - db.lists.put(next); recordChange('UPDATE' | 'STATE_CHANGE' a seconda di patch)

export async function deleteList(id: string): Promise<Result<void>>
// - Transaction(rw, lists, items, changes): cascade items.where('listId').delete()
// - db.lists.delete(id); recordChange('DELETE', ...)

// Query (usati da useLiveQuery, NON ritornano Result)
export const queryActiveLists = () =>
  db.lists.where('status').equals('ACTIVE').reverse().sortBy('updatedAt')

export const queryArchivedLists = () =>
  db.lists.where('status').equals('ARCHIVED').reverse().sortBy('updatedAt')

export const getListById = (id: string) => db.lists.get(id)
```

### 5.4 — Items repository (`src/services/db/items.ts`)

```ts
export async function createItem(input: {
  listId: string
  name: string
  quantity: number | null
  unit: string | null
  notes: string | null
  category: string | null
}): Promise<Result<Item>>
// - sortOrder = computeNextSortOrder(siblings)
// - status = 'DA_COMPRARE', completedAt = null, deletedAt = null
// - createdBy = updatedBy = getCurrentUserId()

export async function updateItem(
  id: string,
  patch: { name?; quantity?; unit?; notes?; category? }
): Promise<Result<Item>>
// - Diff only changed fields, operationType='UPDATE'

export async function toggleItemStatus(id: string): Promise<Result<Item>>
// - Flip DA_COMPRARE <-> COMPLETATO
// - On -> COMPLETATO: completedAt = now(); on -> DA_COMPRARE: completedAt = null
// - operationType = 'STATE_CHANGE'

export async function softDeleteItem(id: string): Promise<Result<Item>>
// - deletedAt = now()
// - operationType = 'DELETE' (soft tombstone)

export async function restoreItem(id: string): Promise<Result<Item>>
// - deletedAt = null, sortOrder intatto
// - operationType = 'UPDATE'

export async function reorderItems(
  listId: string,
  orderedIds: string[]
): Promise<Result<void>>
// - Single transaction
// - Assigns sortOrder = 1000, 2000, 3000, ... (sparse; gap optimization Sprint 3)
// - 1 changeLog row per item whose sortOrder actually changed
// - operationType = 'UPDATE'

// Queries
export const queryActiveItems = (listId: string) =>
  db.items.where('[listId+deletedAt]').equals([listId, null]).sortBy('sortOrder')

export const queryTrashedItems = () =>
  db.items.where('deletedAt').above(0).reverse().sortBy('deletedAt')

export const getItemById = (id: string) => db.items.get(id)
```

### 5.5 — File layout recap

```
src/services/db/
├── schema.ts         ← v1 (frozen) + v2 (NEW)
├── session.ts        ← NEW
├── changeLog.ts      ← NEW
├── lists.ts          ← NEW
└── items.ts          ← NEW
```

Ogni file < 200 LOC. I componenti NON importano mai da `services/db/*` direttamente — passano attraverso gli hook in `features/*/hooks/`.

---

## 6. Feature layer (`src/features/*`) + UI shell

### 6.1 — shadcn/ui components da installare

Eseguito in Phase 0 via CLI:

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label textarea dialog skeleton sonner
```

File risultanti (copiati in repo, zero runtime dep):

```
src/components/ui/
├── button.tsx
├── input.tsx
├── label.tsx
├── textarea.tsx
├── dialog.tsx
├── skeleton.tsx
└── sonner.tsx
```

### 6.2 — Shared components

```
src/components/shared/
└── ConfirmDialog.tsx    ← NEW, built on shadcn/ui Dialog
                             physical double-click, focus trap, a11y
```

### 6.3 — Layout shell (`src/components/layout/AppShell.tsx`)

```tsx
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Toaster } from '../ui/sonner'

export function AppShell() {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-brand-500 text-white px-3 py-1 rounded"
      >
        Vai al contenuto
      </a>
      <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <Link to="/lists" className="text-xl font-bold text-brand-600">
          ShoppingList
        </Link>
        <nav className="flex gap-4 text-sm" aria-label="Navigazione principale">
          <NavLink to="/lists">Liste</NavLink>
          <NavLink to="/trash">Cestino</NavLink>
        </nav>
      </header>
      <main id="main-content" className="max-w-4xl mx-auto p-4">
        <Outlet />
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
```

Skip link onora `ui-ux.md` §"Accessibilità". Font `Inter` caricato in `index.css`. Brand colors in `tailwind.config.js`.

### 6.4 — `features/lists/`

```
features/lists/
├── logic.ts                      # Zod schemas + pure transforms
├── hooks/
│   ├── useLists.ts               # useLiveQuery(queryActiveLists)
│   ├── useArchivedLists.ts       # useLiveQuery(queryArchivedLists)
│   ├── useList.ts                # useLiveQuery(() => getListById(id), [id])
│   └── useListOperations.ts      # create/rename/setStatus/delete + toast
├── components/
│   ├── ListDashboard.tsx         # /lists body
│   ├── ListCard.tsx              # single card
│   ├── ListForm.tsx              # RHF + zodResolver(ListFormSchema)
│   └── ArchivedListsSection.tsx  # collapsible <details>
└── __tests__/
    ├── logic.test.ts
    └── hooks.test.tsx
```

**`logic.ts`** (Sprint 1 è principalmente re-exports delle Zod schemas + helpers puri):

```ts
import { ListFormSchema, type ListFormInput, type List } from '../../types/domain'
export { ListFormSchema, type ListFormInput }

export function formatUpdatedAt(list: List): string {
  // relative time helper (cheap, date-fns-tz-like)
}
```

**`useListOperations.ts`** — wrapper `run()` con toast integrato:

```ts
import { useState } from 'react'
import { toast } from 'sonner'
import * as listsRepo from '../../../services/db/lists'
import { ListFormSchema } from '../../../types/domain'
import { err, type Result, type AppError } from '../../../utils/result'
import type { List, ListStatus } from '../../../types/domain'

export function useListOperations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  async function run<T>(
    fn: () => Promise<Result<T>>,
    successMsg?: string
  ): Promise<Result<T>> {
    setLoading(true); setError(null)
    try {
      const r = await fn()
      if (r.ok && successMsg) toast.success(successMsg)
      if (!r.ok) {
        setError(r.error)
        toast.error(r.error.message)
      }
      return r
    } finally {
      setLoading(false)
    }
  }

  return {
    loading, error, clearError: () => setError(null),

    createList: async (name: string) => {
      const parsed = ListFormSchema.safeParse({ name })
      if (!parsed.success) {
        const msg = parsed.error.errors[0]?.message ?? 'Input invalido'
        toast.error(msg)
        return err({ code: 'VALIDATION' as const, message: msg })
      }
      return run(() => listsRepo.createList({ name: parsed.data.name }), 'Lista creata')
    },
    renameList: async (id: string, name: string) => {
      const parsed = ListFormSchema.safeParse({ name })
      if (!parsed.success) {
        const msg = parsed.error.errors[0]?.message ?? 'Input invalido'
        return err({ code: 'VALIDATION' as const, message: msg })
      }
      return run(() => listsRepo.updateList(id, { name: parsed.data.name }), 'Lista rinominata')
    },
    archiveList: (id: string) =>
      run(() => listsRepo.updateList(id, { status: 'ARCHIVED' }), 'Lista archiviata'),
    unarchiveList: (id: string) =>
      run(() => listsRepo.updateList(id, { status: 'ACTIVE' }), 'Lista riattivata'),
    deleteList: (id: string) =>
      run(() => listsRepo.deleteList(id), 'Lista eliminata'),
  }
}
```

**Component contracts**:

| Component | Props | Responsibility |
|---|---|---|
| `ListDashboard` | — | reads `useLists()` + `useArchivedLists()`, renders `ListForm` (create), grid of `ListCard`, `ArchivedListsSection`. Shows `<Skeleton>` on `lists === undefined`, empty string "Nessuna lista. Creane una." on `lists.length === 0`. |
| `ListCard` | `{ list, onOpen, onArchive, onDelete }` | name, `formatUpdatedAt`, active-items count via inner `useLiveQuery` on items, three-dot menu (shadcn/ui DropdownMenu — *note: add to shadcn/ui install list*). |
| `ListForm` | `{ mode: 'create' \| 'rename', initial?, onSubmit, onCancel? }` | RHF + `zodResolver(ListFormSchema)`, onChange errors, submit disabled when `!isValid`. |
| `ArchivedListsSection` | — | `<details>` with "Mostra archiviate (N)" summary; renders `ListCard` variant with "Ripristina" + "Elimina" buttons. |

Correction: `ListCard` needs a DropdownMenu, so add `dropdown-menu` to the shadcn/ui install list.

### 6.5 — `features/items/`

```
features/items/
├── logic.ts                      # Zod re-exports + computeNextSortOrder
├── hooks/
│   ├── useItems.ts               # active items for a listId
│   ├── useItemOperations.ts      # create/update/toggle/softDelete/reorder + toast
│   ├── useTrash.ts               # queryTrashedItems()
│   └── useTrashOperations.ts     # restore + purge
├── components/
│   ├── ItemList.tsx              # DndContext + SortableContext + aria-live
│   ├── ItemRow.tsx               # one item, checkbox, edit, delete
│   ├── ItemForm.tsx              # RHF + zodResolver(ItemFormSchema)
│   ├── ListDetailView.tsx        # /lists/:id body
│   └── TrashView.tsx             # /trash body
└── __tests__/
    ├── logic.test.ts
    └── hooks.test.tsx
```

**`logic.ts`**:

```ts
import { ItemFormSchema, type ItemFormInput, type Item } from '../../types/domain'
export { ItemFormSchema, type ItemFormInput }

export function computeNextSortOrder(siblings: Item[]): number {
  if (siblings.length === 0) return 1000
  return Math.max(...siblings.map((s) => s.sortOrder)) + 1000
}
```

**Drag-reorder wiring** (`ItemList.tsx`):

```tsx
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'

// PointerSensor with distance constraint to avoid accidental drags on tap
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
)

<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
    <ul aria-live="polite" aria-label="Articoli della lista">
      {items.map((item) => <ItemRow key={item.id} item={item} ... />)}
    </ul>
  </SortableContext>
</DndContext>
```

`aria-live="polite"` onora `ui-ux.md` §"Accessibilità". `KeyboardSensor` abilita keyboard reorder out-of-the-box.

**Component contracts**:

| Component | Props | Responsibility |
|---|---|---|
| `ListDetailView` | — | `useList(id)` + `useItems(id)`; back button; list name header; `ItemForm` add mode; `ItemList`. Skeleton on load, "Lista non trovata" on null. |
| `ItemList` | `{ items, onToggle, onEdit, onDelete, onReorder }` | DndContext wrapper, aria-live, maps to `ItemRow` via `useSortable`. |
| `ItemRow` | `{ item, onToggle, onEdit, onDelete, disabled? }` | shadcn/ui Checkbox wired to toggle; name + qty + notes; edit opens inline `ItemForm` in edit mode; delete soft-deletes. **Add `checkbox` to shadcn/ui install list**. |
| `ItemForm` | `{ mode: 'add' \| 'edit', initial?, listId, onSubmit, onCancel? }` | RHF + `zodResolver(ItemFormSchema)`, 5 fields (name, quantity, unit, notes, category), autofocus on name, Enter submits. |
| `TrashView` | — | `useTrash()` + `useLiveQuery` on lists for join; flat list grouped visually by list name; restore / purge buttons. Skeleton on load. |

**Final shadcn/ui install list**: `button input label textarea dialog skeleton sonner dropdown-menu checkbox`.

### 6.6 — Routing (`src/App.tsx`)

```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ListDashboard } from './features/lists/components/ListDashboard'
import { ListDetailView } from './features/items/components/ListDetailView'
import { TrashView } from './features/items/components/TrashView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/lists" replace />} />
          <Route path="/lists" element={<ListDashboard />} />
          <Route path="/lists/:id" element={<ListDetailView />} />
          <Route path="/trash" element={<TrashView />} />
          <Route path="*" element={<Navigate to="/lists" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

---

## 7. Build order (Approccio B — vertical slices)

### Phase 0 — Foundation

**No UI changes in this phase. App still renders "Sprint 0 OK" at the end.**

1. `npm install` new packages:
   - Runtime: `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities dexie-react-hooks react-hook-form zod @hookform/resolvers sonner`
   - shadcn/ui transitive deps: `clsx tailwind-merge class-variance-authority @radix-ui/react-dialog @radix-ui/react-slot @radix-ui/react-dropdown-menu @radix-ui/react-checkbox @radix-ui/react-label`
2. `npx shadcn-ui@latest init` with defaults (new-york style, CSS variables, `src/` alias)
3. `npx shadcn-ui@latest add button input label textarea dialog skeleton sonner dropdown-menu checkbox`
4. Update `tailwind.config.js`:
   - Add `brand: { 500: '#16A34A', 600: '#15803D' }` colors
   - Add `fontFamily.sans: ['Inter', 'system-ui', ...]`
5. Import `Inter` font in `src/index.css`
6. Rewrite `src/types/domain.ts` with Zod schemas as source of truth
7. Extend `src/types/sync.ts` with new `ChangeLog` shape
8. Create `src/utils/result.ts`
9. Rewrite `src/services/db/schema.ts` with v2 migration
10. Create `src/services/db/session.ts`
11. Create `src/services/db/changeLog.ts`
12. Update Sprint 0 tests (`schema.test.ts`, `App.test.tsx`, `id.test.ts`, `supabase.test.ts`) for new types if needed
13. Create `src/services/db/__tests__/migration.test.ts`
14. Create `src/services/db/__tests__/session.test.ts`
15. Create `src/services/db/__tests__/changeLog.test.ts`
16. Update `.claude/ui-ux.md` with deprecation note on `react-beautiful-dnd` (canonical successor: `@dnd-kit/*`)

**Phase 0 checkpoint** (blocking):
- `npm run lint` green
- `npx tsc --noEmit` green
- `npm test` green (all existing Sprint 0 + new data-layer tests)
- `npm run build` green
- App renders unchanged at `:5173`

### Phase 1 — Lists slice

1. `src/services/db/lists.ts` (full implementation)
2. `src/services/db/__tests__/lists.test.ts` (CRUD + cascade + changeLog assertions)
3. `src/features/lists/logic.ts`
4. `src/features/lists/__tests__/logic.test.ts`
5. `src/features/lists/hooks/useLists.ts`
6. `src/features/lists/hooks/useArchivedLists.ts`
7. `src/features/lists/hooks/useList.ts`
8. `src/features/lists/hooks/useListOperations.ts` (with sonner toast integration)
9. `src/features/lists/__tests__/hooks.test.tsx`
10. `src/components/shared/ConfirmDialog.tsx`
11. `src/features/lists/components/ListForm.tsx`
12. `src/features/lists/components/ListCard.tsx`
13. `src/features/lists/components/ArchivedListsSection.tsx`
14. `src/features/lists/components/ListDashboard.tsx`
15. `src/components/layout/AppShell.tsx`
16. `src/App.tsx` rewrite — routes `/lists` real, `/lists/:id` and `/trash` placeholder divs

**Phase 1 checkpoint** (blocking):
- All tests green
- `npm run dev`: create/rename/archive/unarchive/delete list all work with instant UI updates and toast notifications
- Validation errors appear inline + submit button disabled when invalid
- Delete confirms via double-click dialog
- DoD #3, #4 (lists part), #5 (lists part), #6, #11, #12, #13 green

### Phase 2 — Items slice

1. `src/services/db/items.ts` (full implementation)
2. `src/services/db/__tests__/items.test.ts` (CRUD + toggle + soft-delete + restore + reorder semantics)
3. `src/features/items/logic.ts`
4. `src/features/items/__tests__/logic.test.ts`
5. `src/features/items/hooks/useItems.ts`
6. `src/features/items/hooks/useItemOperations.ts`
7. `src/features/items/__tests__/hooks.test.tsx`
8. `src/features/items/components/ItemForm.tsx`
9. `src/features/items/components/ItemRow.tsx`
10. `src/features/items/components/ItemList.tsx` (with `@dnd-kit`)
11. `src/features/items/components/ListDetailView.tsx`
12. `src/App.tsx` — `/lists/:id` real route

**Phase 2 checkpoint** (blocking):
- All tests green
- `npm run dev`: add/edit/toggle/soft-delete/drag-reorder all work, keyboard reorder works (Tab to item, Space to grab, Arrow keys to move, Space to drop)
- DoD #3, #4, #5 (items part), #7, #11, #12, #13 green

### Phase 3 — Trash slice + E2E

1. `src/features/items/hooks/useTrash.ts`
2. `src/features/items/hooks/useTrashOperations.ts`
3. `src/features/items/__tests__/hooks.test.tsx` extended for trash
4. `src/features/items/components/TrashView.tsx`
5. `src/App.tsx` — `/trash` real route
6. `playwright.config.ts` — `webServer: npm run build && npm run preview`, `baseURL: http://localhost:4173`
7. `e2e/offline-core.spec.ts` — golden path:
   - Wait for `navigator.serviceWorker.ready`
   - `context.setOffline(true)`
   - Navigate to `/lists`, create list "Test"
   - Navigate to `/lists/:id`, add 3 items
   - Toggle item #1 to COMPLETATO
   - Soft-delete item #2
   - Navigate to `/trash`, restore item #2
   - Navigate back to list, assert item #2 is back
   - Assert skip link is reachable via Tab
   - Assert `aria-live="polite"` region is present
   - Assert **zero network requests** to non-`localhost:4173` origins

**Phase 3 checkpoint** (blocking):
- All 13 DoD criteria green

---

## 8. Test strategy

### 8.1 — Test file map

| File | Location | Coverage |
|---|---|---|
| `migration.test.ts` | `src/services/db/__tests__/` | v1→v2 idempotency, backfill of `isTemplate`, `sharedWith`, `localOnly`, `syncedAt`, `quantity`, `unit`, `notes`, `sortOrder`, `completedAt`, `createdBy`, `updatedBy`, status string mapping |
| `session.test.ts` | `src/services/db/__tests__/` | Create on first call, reuse on second call, `userId` format matches `/^guest-/`, throws if DB closed |
| `changeLog.test.ts` | `src/services/db/__tests__/` | One row per `recordChange()`, shape matches `ChangeLog`, `synced: false`, `syncAttempts: 0`, `id` is unique nanoid |
| `lists.test.ts` | `src/services/db/__tests__/` | `createList` writes row + 1 changeLog; `updateList` name only / status only / both / no-op; `deleteList` cascades items + writes changeLog; `queryActiveLists` returns only ACTIVE |
| `items.test.ts` | `src/services/db/__tests__/` | `createItem` sets sortOrder correctly; `toggleItemStatus` sets/clears `completedAt`; `softDeleteItem` sets `deletedAt`, doesn't remove row; `restoreItem` clears `deletedAt`; `reorderItems` updates sortOrder + 1 changeLog per moved item; `queryActiveItems` excludes trashed |
| `lists/logic.test.ts` | `src/features/lists/__tests__/` | `ListFormSchema.safeParse`: valid input passes; empty name fails with "Nome obbligatorio"; >100 chars fails with "Max 100 caratteri"; whitespace-only fails |
| `lists/hooks.test.tsx` | `src/features/lists/__tests__/` | `useLists` reacts to external write (add a list via repo, assert hook re-renders); `useListOperations.createList` returns Result; validation rejection doesn't call repo |
| `items/logic.test.ts` | `src/features/items/__tests__/` | `ItemFormSchema` validation; `computeNextSortOrder` on empty / populated siblings |
| `items/hooks.test.tsx` | `src/features/items/__tests__/` | Full lifecycle: create → toggle → reorder → soft-delete → restore; each step asserts hook state + DB state |
| `offline-core.spec.ts` | `e2e/` | Playwright golden path in offline mode |

### 8.2 — Test conventions (non-negotiables)

- `import 'fake-indexeddb/auto'` is **line 1** of every Dexie test file (`CLAUDE.md` §"Vincoli Assoluti")
- `beforeEach`: `await db.delete(); db.open()`
- Hook tests wrap in `<BrowserRouter>` when hooks read route params
- E2E test runs against `:4173` (preview), not `:5173` (dev), because service worker needs production build
- E2E `beforeEach` waits for `navigator.serviceWorker.ready` before calling `setOffline(true)`

### 8.3 — Coverage targets (from `qualita.md`)

| Layer | Target | Enforcement |
|---|---|---|
| `logic.ts` (schemas) | > 90% | Eyeballed at phase checkpoints |
| Custom hooks | > 80% | Eyeballed at phase checkpoints |
| `services/db/*` | > 85% | Eyeballed at phase checkpoints |

CI gate not enforced (CI non configurata in questo sprint).

---

## 9. Migration safety

Dexie migrations are **one-shot irreversible** per user browser. Guardrails:

1. `version(1)` block is **frozen** (CLAUDE.md `.claude/architettura.md` constraint). Only the new `version(2)` block and new imports are touched in Phase 0.
2. `migration.test.ts` simulates a v1 DB: instantiates a throwaway Dexie class declaring only `version(1)`, seeds fixture rows with v1 field shape, closes, reopens as the real `ShoppingListDB` (which runs the v2 upgrade). Asserts all backfilled fields present and no rows lost.
3. Upgrade callback uses `??=` so re-running on already-migrated rows is a no-op.
4. Dev workflow: developers **clear local IndexedDB via DevTools** between schema edits during Phase 0 to avoid "stale dev DB" confusion. Documented in the plan doc.

---

## 10. Rischi e mitigazioni

| Rischio | Prob. | Impatto | Mitigazione |
|---|---|---|---|
| IndexedDB Sprint 0 dev-testing incompatible | Med | Low | Backfill gestisce; docs istruisce "clear storage" |
| `@dnd-kit` touch event conflict con click (drag accidentale su tap) | Med | Med | `PointerSensor` con `activationConstraint: { distance: 8 }` |
| `useLiveQuery` stale closure bug | Low | Med | Deps array sempre incluso; hook test asserisce reattività su external writes |
| Playwright offline test flakes (SW non pronto) | Med | Low | `beforeEach` attende `serviceWorker.ready` |
| `sortOrder` drift su reorder concorrente | Very low | Low | Single transaction; last-writer-wins accettabile in guest single-user |
| Hard-delete cascade data loss | Med | Med | `ConfirmDialog` + physical double-click (CLAUDE.md §"Vincoli Assoluti") |
| Zod schema drift da `dominio.md` | Low | Med | Schemas ARE the source of truth; `dominio.md` cross-referenced in spec |
| shadcn/ui CLI failure on Windows bash shell | Low | Med | Test CLI install early in Phase 0; fallback to manual component copy if needed |
| Drag-reorder keyboard navigation regression | Low | Med | `KeyboardSensor` from `@dnd-kit`; hook test asserisce `sortOrder` change via keyboard |

---

## 11. Package manifest changes

### Runtime dependencies (aggiunte)

```
@dnd-kit/core                  ^6.1.x
@dnd-kit/sortable              ^8.0.x
@dnd-kit/utilities             ^3.2.x
dexie-react-hooks              ^1.1.x
react-hook-form                ^7.x
zod                            ^3.x
@hookform/resolvers            ^3.x
sonner                         ^1.x
clsx                           ^2.x
tailwind-merge                 ^2.x
class-variance-authority       ^0.7.x
@radix-ui/react-dialog         ^1.x
@radix-ui/react-dropdown-menu  ^2.x
@radix-ui/react-slot           ^1.x
@radix-ui/react-label          ^2.x
@radix-ui/react-checkbox       ^1.x
```

**Bundle impact stimato**: ~70–80KB gzipped (Zod 12KB + RHF 9KB + @dnd-kit 10KB + sonner 5KB + Radix primitives ~30KB + tw-merge/clsx/cva <5KB).

### Dev dependencies (nessuna nuova)

Playwright e Vitest già installati in Sprint 0.

### Commands utili post-installazione

```bash
# Phase 0 one-time setup
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label textarea dialog skeleton sonner dropdown-menu checkbox

# Lint + type check + test sequence
npm run lint && npx tsc --noEmit && npm test

# Production build + preview for E2E
npm run build && npm run preview

# E2E offline-only
npm run test:e2e -- offline-core
```

---

## 12. Canonical doc updates richiesti

Come parte di Phase 0:

1. **`.claude/ui-ux.md`** — Aggiungere deprecation note in cima al file:
   > **⚠️ Aggiornamento brainstorming 2026-04-14**: `react-beautiful-dnd` listato in §"Stack UI" è **deprecato**. Libreria archiviata dal 2021 con problemi noti di compatibilità React 18. Canonical successor: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`, usato a partire da Sprint 1.

2. **`.claude/qualita.md`** — Aggiungere paragrafo in §"Error Handling":
   > **Regola `Result<T, E>`**: ai confini modulo (repo methods → hooks), throws interni ai moduli. `getCurrentUserId()` throws, `createList()` ritorna `Result`. Evita `Result<T, Result<U, E>>` chains.

---

## 13. Scope freeze

Le seguenti feature NON sono in Sprint 1 e NON devono essere aggiunte:

- Auth, login, register, profile routes
- Catalog seed, catalog autocomplete
- Modalità shopping route, swipe gestures, vibration
- Framer Motion animations
- Mobile bottom nav, tablet sidebar, desktop sidebar
- Dark mode toggle
- React Virtual virtualization
- Supabase push, pull, Realtime, conflict resolution
- Invite flows, sharing UI
- Category grouping in item list
- Item quantity unit dropdown (plain text input in Sprint 1, dropdown in Sprint 2)
- Error messages `NETWORK`, `SYNC_FAILED`, `PERMISSION` (Sprint 1 uses only `VALIDATION` + generic)

Eventuali richieste di aggiungere queste feature vanno trattate come **scope creep** e respinte con riferimento a questa sezione.

---

## 14. Handoff al writing-plans skill

Al completamento di questa spec e alla sua approvazione:

1. Commit della spec su branch corrente
2. Invocazione di `writing-plans` skill per produrre `docs/plans/Sprint1_CoreOffline_Plan.md`
3. Il plan doc conterrà task step-by-step subagent-executable, uno per ogni numero in §7 "Build order"
4. Ogni task nel plan: descrizione, file target, tests da aggiungere, comando di verifica, criterio di successo
5. L'esecuzione del plan avverrà in sessione separata via `executing-plans` / `subagent-driven-development`

---

**Fine spec.**
