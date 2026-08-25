# Sprint 1 Core Offline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement offline-first CRUD for shopping lists and items with soft-delete trash, drag-reorder, full canonical domain types, Dexie v2 migration, and a guest-mode UI built on shadcn/ui + React Hook Form + Zod + sonner — all without authentication or network calls.

**Architecture:** Feature-sliced React app (`src/features/{lists,items}/`) with Dexie as the single source of truth. Reactive UI via `useLiveQuery` from `dexie-react-hooks`. Repository pattern in `src/services/db/` with `Result<T, E>` at module boundaries and a `recordChange()` chokepoint writing to the `changes` table on every CRUD. Zod schemas in `src/types/domain.ts` are the source of truth — TypeScript types are derived via `z.infer`. Approach B — vertical slices: Phase 0 foundation → Phase 1 lists → Phase 2 items → Phase 3 trash + E2E.

**Tech Stack:** React 18, Vite, TypeScript (strict + `verbatimModuleSyntax`), Dexie.js v4 + `dexie-react-hooks`, Zod, React Hook Form + `@hookform/resolvers`, shadcn/ui (copy-paste via CLI), sonner (toast), `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`, Tailwind CSS 3, Vitest + Testing Library + `fake-indexeddb`, Playwright, React Router v6.

**Spec reference:** [`docs/specs/Sprint1_CoreOffline_Spec.md`](../specs/Sprint1_CoreOffline_Spec.md). When this plan says "per spec §N", read that section of the spec first.

**Important execution rules (from CLAUDE.md):**
- `import 'fake-indexeddb/auto'` is line 1 of every Dexie test file.
- `import type { X }` for type-only imports (`verbatimModuleSyntax: true`).
- Never mutate `version(1).stores(...)` in-place.
- Never call Supabase without `isSupabaseConfigured()` guard.
- Feature-sliced paths only — translate any `development_plan.md §2.2` paths to canonical.
- The user manages git personally — commit steps in this plan are instructions for the executing agent, but the **user must be the one executing `git` commands**. If running this plan inline, pause at each commit step and ask the user to commit, then continue.

---

## File Structure

### Files to create (Phase 0 — Foundation)

| Path | Responsibility |
|---|---|
| `src/types/domain.ts` | **REWRITE** — Zod schemas as source of truth for `List`, `Item`, `GuestSession`, enums, form inputs. TypeScript types derived via `z.infer`. |
| `src/types/sync.ts` | **MODIFY** — extend `ChangeLog` with `STATE_CHANGE` op, `userId`, `changes` diff map, `syncAttempts`. |
| `src/utils/result.ts` | **NEW** — `Result<T, E>`, `AppError`, `ok`, `err`, `toAppError`. |
| `src/services/db/schema.ts` | **REWRITE** — keeps frozen v1, adds v2 with `session` table, new indices, idempotent `.upgrade()` backfill. |
| `src/services/db/session.ts` | **NEW** — `getOrCreateGuestSession()` (Result) + `getCurrentUserId()` (throwing internal). |
| `src/services/db/changeLog.ts` | **NEW** — `recordChange()` single chokepoint. |
| `src/services/db/__tests__/migration.test.ts` | **NEW** — v1 → v2 backfill idempotency + status string mapping. |
| `src/services/db/__tests__/session.test.ts` | **NEW** — first-call creates, second-call reuses, userId format. |
| `src/services/db/__tests__/changeLog.test.ts` | **NEW** — one row per call, shape assertions. |
| `src/index.css` | **MODIFY** — add `Inter` font import. |
| `tailwind.config.js` | **MODIFY** — add `brand` colors, `Inter` sans family. |
| `src/components/ui/*.tsx` | **NEW (via shadcn CLI)** — button, input, label, textarea, dialog, skeleton, sonner, dropdown-menu, checkbox. |
| `package.json` | **MODIFY** — add runtime deps. |
| `src/__tests__/schema.test.ts` | **UPDATE** — account for v2 shape. |
| `src/__tests__/App.test.tsx` | **UPDATE** — Sprint 0 marker will be removed in Phase 1. |
| `.claude/ui-ux.md` | **MODIFY** — deprecation note for `react-beautiful-dnd`. |
| `.claude/qualita.md` | **MODIFY** — paragraph on `Result<T, E>` boundary rule. |

### Files to create (Phase 1 — Lists slice)

| Path | Responsibility |
|---|---|
| `src/services/db/lists.ts` | List CRUD + queries. |
| `src/services/db/__tests__/lists.test.ts` | Repo tests. |
| `src/features/lists/logic.ts` | Re-exports Zod schemas + pure helpers (e.g. `formatUpdatedAt`). |
| `src/features/lists/__tests__/logic.test.ts` | Schema validation tests. |
| `src/features/lists/hooks/useLists.ts` | `useLiveQuery(queryActiveLists)`. |
| `src/features/lists/hooks/useArchivedLists.ts` | `useLiveQuery(queryArchivedLists)`. |
| `src/features/lists/hooks/useList.ts` | `useLiveQuery(() => getListById(id), [id])`. |
| `src/features/lists/hooks/useListOperations.ts` | create/rename/archive/unarchive/delete + toast + error state. |
| `src/features/lists/__tests__/hooks.test.tsx` | Hook lifecycle with fake-indexeddb. |
| `src/components/shared/ConfirmDialog.tsx` | Physical double-click confirm on shadcn Dialog. |
| `src/features/lists/components/ListForm.tsx` | RHF + zodResolver form (create/rename). |
| `src/features/lists/components/ListCard.tsx` | Single card with dropdown menu. |
| `src/features/lists/components/ArchivedListsSection.tsx` | `<details>` collapsible. |
| `src/features/lists/components/ListDashboard.tsx` | `/lists` body. |
| `src/components/layout/AppShell.tsx` | Skip link + header + `<Outlet />` + `<Toaster />`. |
| `src/App.tsx` | **REWRITE** — router with AppShell + 4 routes. |

### Files to create (Phase 2 — Items slice)

| Path | Responsibility |
|---|---|
| `src/services/db/items.ts` | Item CRUD + queries + reorder. |
| `src/services/db/__tests__/items.test.ts` | Repo tests (including toggle, reorder semantics). |
| `src/features/items/logic.ts` | Zod re-exports + `computeNextSortOrder`. |
| `src/features/items/__tests__/logic.test.ts` | Schema + helper tests. |
| `src/features/items/hooks/useItems.ts` | Active items for listId. |
| `src/features/items/hooks/useItemOperations.ts` | create/update/toggle/softDelete/reorder + toast. |
| `src/features/items/__tests__/hooks.test.tsx` | Full lifecycle tests. |
| `src/features/items/components/ItemForm.tsx` | RHF + zodResolver form (add/edit). |
| `src/features/items/components/ItemRow.tsx` | One item with checkbox + edit + delete. |
| `src/features/items/components/ItemList.tsx` | DndContext + SortableContext + aria-live. |
| `src/features/items/components/ListDetailView.tsx` | `/lists/:id` body. |

### Files to create (Phase 3 — Trash + E2E)

| Path | Responsibility |
|---|---|
| `src/features/items/hooks/useTrash.ts` | `useLiveQuery(queryTrashedItems)`. |
| `src/features/items/hooks/useTrashOperations.ts` | restore + purge. |
| `src/features/items/components/TrashView.tsx` | `/trash` body. |
| `e2e/offline-core.spec.ts` | Playwright golden path under offline. |
| `playwright.config.ts` | **NEW** — webServer runs `npm run build && npm run preview`. |

---

# PHASE 0 — Foundation

No UI changes. At the end of Phase 0, the app still renders the Sprint 0 marker. All data-layer pieces are in place and tested.

---

## Task 0.1: Install runtime dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime packages**

Run:
```bash
npm install \
  @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities \
  dexie-react-hooks \
  react-hook-form zod @hookform/resolvers \
  sonner \
  clsx tailwind-merge class-variance-authority \
  @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-checkbox
```

Expected: `package.json` and `package-lock.json` updated. No peer dependency warnings beyond React 18 expected warnings.

- [ ] **Step 2: Verify versions**

Run: `npm ls zod react-hook-form @dnd-kit/core sonner dexie-react-hooks`

Expected: all packages listed with their installed versions, no errors.

- [ ] **Step 3: Smoke test existing suite**

Run: `npm test`

Expected: 5 tests still pass (Sprint 0 baseline).

- [ ] **Step 4: USER COMMIT**

Ask the user to commit:
```bash
git add package.json package-lock.json
git commit -m "chore(sprint1): install runtime deps for shadcn/ui, RHF+Zod, @dnd-kit, sonner"
```

---

## Task 0.2: Initialize shadcn/ui

**Files:**
- Create: `components.json` (project root), `src/lib/utils.ts`, and multiple `src/components/ui/*.tsx`

- [ ] **Step 1: Run shadcn init**

Run: `npx shadcn@latest init`

Answer prompts:
- Style: `default` (or `new-york` if offered)
- Base color: `neutral`
- CSS variables: `yes`
- React Server Components: `no`
- Components path: `src/components/ui`
- Utilities path: `src/lib/utils`
- Tailwind config file: `tailwind.config.js`
- Global CSS: `src/index.css`
- Import alias: `@/*` (this updates `tsconfig.app.json` paths)

Expected: `components.json` created, `src/lib/utils.ts` created, `src/index.css` updated with CSS variables, `tailwind.config.js` updated.

- [ ] **Step 2: Add all required components**

Run:
```bash
npx shadcn@latest add button input label textarea dialog skeleton sonner dropdown-menu checkbox
```

Expected: files created in `src/components/ui/`:
- `button.tsx`, `input.tsx`, `label.tsx`, `textarea.tsx`
- `dialog.tsx`, `skeleton.tsx`, `sonner.tsx`
- `dropdown-menu.tsx`, `checkbox.tsx`

- [ ] **Step 3: Verify path alias works**

Run: `npx tsc --noEmit`

Expected: zero errors. If `@/*` alias is not resolved, update `tsconfig.app.json` `compilerOptions.paths` to `{"@/*": ["./src/*"]}` and `vite.config.ts` `resolve.alias` to `[{ find: '@', replacement: path.resolve(__dirname, './src') }]`.

- [ ] **Step 4: Verify tests still pass**

Run: `npm test`

Expected: 5 tests pass.

- [ ] **Step 5: USER COMMIT**

Ask the user to commit:
```bash
git add components.json src/lib src/components/ui src/index.css tailwind.config.js tsconfig.app.json vite.config.ts
git commit -m "chore(sprint1): scaffold shadcn/ui components"
```

---

## Task 0.3: Configure Tailwind brand tokens and Inter font

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: Add brand colors and Inter to tailwind.config.js**

Open `tailwind.config.js`. Add to the `theme.extend` section (keep whatever shadcn init added, merging these keys in):

```js
// tailwind.config.js — theme.extend
colors: {
  brand: {
    500: '#16A34A',
    600: '#15803D',
  },
  // ... keep shadcn-added colors
},
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
},
```

- [ ] **Step 2: Add Inter font import to index.css**

Open `src/index.css`. Add at the very top, before any `@tailwind` or shadcn CSS variables:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: build succeeds, no CSS errors.

- [ ] **Step 4: Verify dev server renders with new font**

Run: `npm run dev` in a separate terminal.

Open http://localhost:5173 in a browser. Inspect the "Sprint 0 OK" text — DevTools → Computed → `font-family` should show Inter as the first font.

Stop the dev server.

- [ ] **Step 5: USER COMMIT**

Ask the user to commit:
```bash
git add tailwind.config.js src/index.css
git commit -m "chore(sprint1): add brand tokens and Inter font"
```

---

## Task 0.4: Rewrite `src/types/domain.ts` with Zod schemas

**Files:**
- Modify: `src/types/domain.ts`

- [ ] **Step 1: Rewrite the file with full canonical schemas**

Replace the entire contents of `src/types/domain.ts` with:

```ts
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
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`

Expected: zero errors. If old consumers reference `'pending' | 'completed'`, fix them (likely `src/__tests__/schema.test.ts`).

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: tests pass, or only `schema.test.ts` fails due to new status strings — we'll fix it in Task 0.7.

- [ ] **Step 4: USER COMMIT** (wait for Task 0.7 before committing to batch data-layer changes)

---

## Task 0.5: Extend `src/types/sync.ts` with richer ChangeLog

**Files:**
- Modify: `src/types/sync.ts`

- [ ] **Step 1: Replace the file contents**

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
  synced: boolean
  syncAttempts: number
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

- [ ] **Step 3: USER COMMIT** (batched with Task 0.7)

---

## Task 0.6: Create `src/utils/result.ts`

**Files:**
- Create: `src/utils/result.ts`

- [ ] **Step 1: Write the Result utility**

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

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

- [ ] **Step 3: USER COMMIT** (batched with Task 0.7)

---

## Task 0.7: Rewrite Dexie schema with v2 migration

**Files:**
- Modify: `src/services/db/schema.ts`
- Modify: `src/__tests__/schema.test.ts` (if needed)

- [ ] **Step 1: Rewrite `src/services/db/schema.ts`**

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

    // v1 — Sprint 0 baseline, FROZEN
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

- [ ] **Step 2: Update `src/__tests__/schema.test.ts` to assert v2 shape**

Read the file. If it asserts exact table count (5), update to 6. If it asserts indices on items, update to include `sortOrder`, `[listId+sortOrder]`, `[listId+status]`. If it asserts on `session`, add it. Example delta (show the final assertion block):

```ts
// src/__tests__/schema.test.ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '../services/db/schema'

describe('ShoppingListDB schema', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  it('declares 6 tables at v2', () => {
    const names = db.tables.map((t) => t.name).sort()
    expect(names).toEqual(
      ['catalog', 'changes', 'invites', 'items', 'lists', 'session'].sort()
    )
  })

  it('opens at version 2', () => {
    expect(db.verno).toBe(2)
  })
})
```

- [ ] **Step 3: Run schema test**

Run: `npm test -- schema`

Expected: green.

- [ ] **Step 4: Run full test suite**

Run: `npm test`

Expected: all previously-green tests still green.

- [ ] **Step 5: USER COMMIT**

Ask the user to commit the accumulated data-type and schema work (Tasks 0.4–0.7):
```bash
git add src/types src/utils/result.ts src/services/db/schema.ts src/__tests__/schema.test.ts
git commit -m "feat(sprint1): canonical domain types (Zod), Result<T,E>, Dexie v2 migration"
```

---

## Task 0.8: Create `src/services/db/session.ts`

**Files:**
- Create: `src/services/db/session.ts`

- [ ] **Step 1: Write the file**

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

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 0.9: Write `session.test.ts`

**Files:**
- Create: `src/services/db/__tests__/session.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '../schema'
import { getOrCreateGuestSession, getCurrentUserId } from '../session'

describe('session', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  it('creates a guest session on first call', async () => {
    const r = await getOrCreateGuestSession()
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.id).toBe('current')
      expect(r.data.userId).toMatch(/^guest-/)
      expect(r.data.createdAt).toBeGreaterThan(0)
    }
  })

  it('returns the same session on second call', async () => {
    const first = await getOrCreateGuestSession()
    const second = await getOrCreateGuestSession()
    expect(first.ok && second.ok).toBe(true)
    if (first.ok && second.ok) {
      expect(first.data.userId).toBe(second.data.userId)
    }
  })

  it('getCurrentUserId returns the stored id', async () => {
    const uid = await getCurrentUserId()
    expect(uid).toMatch(/^guest-/)
    const r = await getOrCreateGuestSession()
    if (r.ok) expect(r.data.userId).toBe(uid)
  })
})
```

- [ ] **Step 2: Run the test**

Run: `npm test -- session`

Expected: green (implementation already written in Task 0.8).

- [ ] **Step 3: USER COMMIT** (batched with Task 0.11)

---

## Task 0.10: Create `src/services/db/changeLog.ts`

**Files:**
- Create: `src/services/db/changeLog.ts`

- [ ] **Step 1: Write the helper**

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

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 0.11: Write `changeLog.test.ts`

**Files:**
- Create: `src/services/db/__tests__/changeLog.test.ts`

- [ ] **Step 1: Write the tests**

```ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '../schema'
import { recordChange } from '../changeLog'

describe('recordChange', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  it('writes one row per call with correct shape', async () => {
    await recordChange({
      entityType: 'LIST',
      entityId: 'list-1',
      operationType: 'CREATE',
      userId: 'guest-x',
      changes: { name: { from: null, to: 'Test' } },
    })
    const all = await db.changes.toArray()
    expect(all).toHaveLength(1)
    const row = all[0]
    expect(row.entityType).toBe('LIST')
    expect(row.entityId).toBe('list-1')
    expect(row.operationType).toBe('CREATE')
    expect(row.userId).toBe('guest-x')
    expect(row.synced).toBe(false)
    expect(row.syncAttempts).toBe(0)
    expect(row.createdAt).toBeGreaterThan(0)
    expect(row.id).toBeTruthy()
  })

  it('writes multiple rows with unique ids', async () => {
    await recordChange({
      entityType: 'ITEM', entityId: 'i1', operationType: 'CREATE',
      userId: 'u', changes: {},
    })
    await recordChange({
      entityType: 'ITEM', entityId: 'i2', operationType: 'CREATE',
      userId: 'u', changes: {},
    })
    const all = await db.changes.toArray()
    expect(all).toHaveLength(2)
    expect(new Set(all.map((r) => r.id)).size).toBe(2)
  })
})
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- changeLog`

Expected: green.

- [ ] **Step 3: USER COMMIT**

Ask the user to commit session + changeLog:
```bash
git add src/services/db/session.ts src/services/db/changeLog.ts src/services/db/__tests__/session.test.ts src/services/db/__tests__/changeLog.test.ts
git commit -m "feat(sprint1): guest session bootstrap and recordChange helper"
```

---

## Task 0.12: Write `migration.test.ts` (v1 → v2 idempotency)

**Files:**
- Create: `src/services/db/__tests__/migration.test.ts`

- [ ] **Step 1: Write the migration test**

```ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Dexie from 'dexie'
import { db } from '../schema'

// A throwaway class declaring ONLY v1, used to seed a v1-shaped DB
// before opening the real ShoppingListDB (which runs the v2 upgrade).
class V1Seed extends Dexie {
  constructor() {
    super('ShoppingListDB')
    this.version(1).stores({
      lists:    '&id, ownerId, status, updatedAt',
      items:    '&id, listId, status, category, updatedAt, [listId+deletedAt]',
      changes:  '&id, entityType, entityId, synced, createdAt',
      catalog:  '&id, &name, lastUsedAt',
      invites:  '&id, listId, token, expiresAt',
    })
  }
}

describe('Dexie v1 -> v2 migration', () => {
  beforeEach(async () => {
    await Dexie.delete('ShoppingListDB')
  })
  afterEach(async () => {
    await Dexie.delete('ShoppingListDB')
  })

  it('backfills missing fields on v1 lists rows', async () => {
    const v1 = new V1Seed()
    await v1.open()
    await v1.table('lists').add({
      id: 'l1',
      name: 'Spesa',
      ownerId: 'guest-legacy',
      status: 'active',
      createdAt: 100,
      updatedAt: 200,
    })
    v1.close()

    await db.open()
    const list = await db.lists.get('l1')
    expect(list).toBeDefined()
    expect(list!.status).toBe('ACTIVE')
    expect(list!.isTemplate).toBe(false)
    expect(list!.sharedWith).toEqual([])
    expect(list!.syncedAt).toBeNull()
    expect(list!.localOnly).toBe(true)
    expect(list!.name).toBe('Spesa')
  })

  it('backfills missing fields on v1 items rows and maps statuses', async () => {
    const v1 = new V1Seed()
    await v1.open()
    await v1.table('items').add({
      id: 'i1',
      listId: 'l1',
      name: 'pane',
      status: 'pending',
      category: null,
      createdAt: 100,
      updatedAt: 200,
      deletedAt: null,
    })
    await v1.table('items').add({
      id: 'i2',
      listId: 'l1',
      name: 'latte',
      status: 'completed',
      category: null,
      createdAt: 100,
      updatedAt: 200,
      deletedAt: null,
    })
    v1.close()

    await db.open()
    const i1 = await db.items.get('i1')
    const i2 = await db.items.get('i2')

    expect(i1!.status).toBe('DA_COMPRARE')
    expect(i2!.status).toBe('COMPLETATO')

    for (const item of [i1!, i2!]) {
      expect(item.quantity).toBeNull()
      expect(item.unit).toBeNull()
      expect(item.notes).toBeNull()
      expect(item.completedAt).toBeNull()
      expect(item.createdBy).toBe('guest-legacy')
      expect(item.updatedBy).toBe('guest-legacy')
      expect(typeof item.sortOrder).toBe('number')
    }
  })

  it('is idempotent: reopening v2 does not re-run upgrade', async () => {
    // Open v2 from scratch (no v1 data)
    await db.open()
    await db.lists.add({
      id: 'l2',
      name: 'Casa',
      ownerId: 'u',
      status: 'ACTIVE',
      isTemplate: false,
      sharedWith: [],
      createdAt: 1,
      updatedAt: 1,
      syncedAt: null,
      localOnly: true,
    })
    db.close()

    await db.open()
    const list = await db.lists.get('l2')
    expect(list).toBeDefined()
    expect(list!.status).toBe('ACTIVE') // untouched
  })
})
```

- [ ] **Step 2: Run the test**

Run: `npm test -- migration`

Expected: green. If fails with "DatabaseClosedError" or similar, ensure `beforeEach` deletes the DB fully before each test.

- [ ] **Step 3: Run full suite**

Run: `npm test`

Expected: all tests green.

- [ ] **Step 4: USER COMMIT**

```bash
git add src/services/db/__tests__/migration.test.ts
git commit -m "test(sprint1): v1->v2 migration backfill idempotency"
```

---

## Task 0.13: Update canonical docs with deprecation notes

**Files:**
- Modify: `.claude/ui-ux.md`
- Modify: `.claude/qualita.md`

- [ ] **Step 1: Add deprecation note to `ui-ux.md`**

At the very top of `.claude/ui-ux.md`, after the `**Dipende da**` line, insert:

```markdown
> **⚠️ Aggiornamento brainstorming 2026-04-14 (Sprint 1)**: `react-beautiful-dnd` listato in §"Stack UI" è **deprecato**. Libreria archiviata dal 2021 con problemi noti di compatibilità React 18. Canonical successor: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`, usato a partire da Sprint 1. Quando un task cita `react-beautiful-dnd`, tradurre a `@dnd-kit`.
```

- [ ] **Step 2: Add Result boundary rule to `qualita.md`**

At the end of `.claude/qualita.md` §"Error Handling" (just before the next section), append:

```markdown
### Regola `Result<T, E>` boundary (Sprint 1)

`Result<T, E>` è un tipo di confine. Usarlo al limite tra "codice che può fallire per cause esterne (disco, rete, input utente)" e "codice che consuma questi risultati (componenti React, hooks)". **All'interno di un modulo**, i metodi interni throw-ano normalmente, perché il metodo esterno wrapper ha già il try/catch che cattura.

- `getCurrentUserId()` in `services/db/session.ts` → throws (interno, chiamato solo da repo methods).
- `createList()`, `updateList()`, `deleteList()` in `services/db/lists.ts` → ritornano `Result<List, AppError>` (confine).
- `useListOperations.createList()` in `features/lists/hooks/` → ritorna `Result<List, AppError>` (propaga il confine alla UI).

Evita `Result<T, Result<U, E>>` chains. Una sola conversione throw→Result per percorso.
```

- [ ] **Step 3: Verify no link/format regression**

Run: `npm run build` (ensures `.claude/` markdown is not imported into bundles).

Expected: build succeeds.

- [ ] **Step 4: USER COMMIT**

```bash
git add .claude/ui-ux.md .claude/qualita.md
git commit -m "docs(sprint1): deprecate react-beautiful-dnd, document Result<T,E> boundary rule"
```

---

## Task 0.14: Phase 0 checkpoint

- [ ] **Step 1: Lint**

Run: `npm run lint`

Expected: zero errors.

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`

Expected: zero errors.

- [ ] **Step 3: Full test suite**

Run: `npm test`

Expected: all tests green. Sprint 0 + new data layer tests, ~12-15 tests total.

- [ ] **Step 4: Build production**

Run: `npm run build`

Expected: `dist/` created, zero errors.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`

Open http://localhost:5173. Expected: "Sprint 0 OK" still rendering (we haven't touched UI yet). Stop dev server.

- [ ] **Step 6: Phase 0 complete — no additional commit**

Phase 0 is done. The data layer is fully tested. The app still shows "Sprint 0 OK". Proceed to Phase 1.

---

# PHASE 1 — Lists slice

At the end of Phase 1, `/lists` dashboard renders reactively, you can create/rename/archive/unarchive/delete lists, and toasts fire on every operation. `/lists/:id` and `/trash` are placeholder divs until Phase 2 and Phase 3.

---

## Task 1.1: Create `src/services/db/lists.ts`

**Files:**
- Create: `src/services/db/lists.ts`

- [ ] **Step 1: Write the repository**

```ts
import { db } from './schema'
import { recordChange } from './changeLog'
import { getCurrentUserId } from './session'
import { nanoid } from '../../utils/id'
import type { List, ListStatus } from '../../types/domain'
import { ok, err, toAppError, type Result, type AppError } from '../../utils/result'

interface CreateListInput { name: string }
interface UpdateListInput { name?: string; status?: ListStatus }

export async function createList(input: CreateListInput): Promise<Result<List, AppError>> {
  try {
    const userId = await getCurrentUserId()
    const now = Date.now()
    const list: List = {
      id: nanoid(),
      name: input.name.trim(),
      ownerId: userId,
      status: 'ACTIVE',
      isTemplate: false,
      sharedWith: [],
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      localOnly: true,
    }
    await db.transaction('rw', db.lists, db.changes, async () => {
      await db.lists.add(list)
      await recordChange({
        entityType: 'LIST',
        entityId: list.id,
        operationType: 'CREATE',
        userId,
        changes: { name: { from: null, to: list.name } },
      })
    })
    return ok(list)
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function updateList(
  id: string,
  patch: UpdateListInput
): Promise<Result<List, AppError>> {
  try {
    const userId = await getCurrentUserId()
    return await db.transaction('rw', db.lists, db.changes, async () => {
      const current = await db.lists.get(id)
      if (!current) return err({ code: 'NOT_FOUND' as const, message: `List ${id} not found` })

      const next: List = {
        ...current,
        ...(patch.name !== undefined && { name: patch.name.trim() }),
        ...(patch.status !== undefined && { status: patch.status }),
        updatedAt: Date.now(),
      }

      const diff: Record<string, { from: unknown; to: unknown }> = {}
      if (patch.name !== undefined && patch.name.trim() !== current.name) {
        diff.name = { from: current.name, to: next.name }
      }
      if (patch.status !== undefined && patch.status !== current.status) {
        diff.status = { from: current.status, to: next.status }
      }
      if (Object.keys(diff).length === 0) return ok(current)

      await db.lists.put(next)
      await recordChange({
        entityType: 'LIST',
        entityId: id,
        operationType: patch.status !== undefined ? 'STATE_CHANGE' : 'UPDATE',
        userId,
        changes: diff,
      })
      return ok(next)
    })
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function deleteList(id: string): Promise<Result<void, AppError>> {
  try {
    const userId = await getCurrentUserId()
    return await db.transaction('rw', db.lists, db.items, db.changes, async () => {
      const existing = await db.lists.get(id)
      if (!existing) return err({ code: 'NOT_FOUND' as const, message: `List ${id} not found` })

      await db.items.where('listId').equals(id).delete()
      await db.lists.delete(id)
      await recordChange({
        entityType: 'LIST',
        entityId: id,
        operationType: 'DELETE',
        userId,
        changes: { deleted: { from: false, to: true } },
      })
      return ok(undefined as void)
    })
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

// Queries (used by useLiveQuery — do not return Result)
export const queryActiveLists = () =>
  db.lists.where('status').equals('ACTIVE').reverse().sortBy('updatedAt')

export const queryArchivedLists = () =>
  db.lists.where('status').equals('ARCHIVED').reverse().sortBy('updatedAt')

export const getListById = (id: string) => db.lists.get(id)
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 1.2: Write `lists.test.ts`

**Files:**
- Create: `src/services/db/__tests__/lists.test.ts`

- [ ] **Step 1: Write the tests**

```ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '../schema'
import { createList, updateList, deleteList, queryActiveLists, queryArchivedLists } from '../lists'

describe('lists repository', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  describe('createList', () => {
    it('creates an active list with canonical shape', async () => {
      const r = await createList({ name: '  Spesa  ' })
      expect(r.ok).toBe(true)
      if (r.ok) {
        expect(r.data.name).toBe('Spesa')
        expect(r.data.status).toBe('ACTIVE')
        expect(r.data.isTemplate).toBe(false)
        expect(r.data.sharedWith).toEqual([])
        expect(r.data.localOnly).toBe(true)
        expect(r.data.syncedAt).toBeNull()
        expect(r.data.ownerId).toMatch(/^guest-/)
      }
    })

    it('writes one CREATE changeLog row', async () => {
      await createList({ name: 'Test' })
      const changes = await db.changes.toArray()
      expect(changes).toHaveLength(1)
      expect(changes[0].operationType).toBe('CREATE')
      expect(changes[0].entityType).toBe('LIST')
    })
  })

  describe('updateList', () => {
    it('renames and writes an UPDATE changeLog', async () => {
      const created = await createList({ name: 'Old' })
      if (!created.ok) throw new Error('setup failed')

      const r = await updateList(created.data.id, { name: 'New' })
      expect(r.ok).toBe(true)
      if (r.ok) expect(r.data.name).toBe('New')

      const changes = await db.changes.where('operationType').equals('UPDATE').toArray()
      expect(changes).toHaveLength(1)
      expect(changes[0].changes.name).toEqual({ from: 'Old', to: 'New' })
    })

    it('archives and writes a STATE_CHANGE changeLog', async () => {
      const created = await createList({ name: 'L' })
      if (!created.ok) throw new Error('setup failed')
      const r = await updateList(created.data.id, { status: 'ARCHIVED' })
      expect(r.ok).toBe(true)
      const changes = await db.changes.where('operationType').equals('STATE_CHANGE').toArray()
      expect(changes).toHaveLength(1)
    })

    it('no-op when patch matches current', async () => {
      const created = await createList({ name: 'L' })
      if (!created.ok) throw new Error('setup failed')
      const before = await db.changes.count()
      await updateList(created.data.id, { name: 'L' })
      const after = await db.changes.count()
      expect(after).toBe(before)
    })

    it('returns NOT_FOUND for missing id', async () => {
      const r = await updateList('missing', { name: 'x' })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error.code).toBe('NOT_FOUND')
    })
  })

  describe('deleteList', () => {
    it('cascades delete to items', async () => {
      const created = await createList({ name: 'L' })
      if (!created.ok) throw new Error('setup failed')
      await db.items.add({
        id: 'i1', listId: created.data.id, name: 'x',
        quantity: null, unit: null, notes: null, category: null,
        status: 'DA_COMPRARE', deletedAt: null, sortOrder: 1000,
        createdAt: 1, updatedAt: 1, completedAt: null,
        createdBy: 'u', updatedBy: 'u',
      })

      const r = await deleteList(created.data.id)
      expect(r.ok).toBe(true)
      expect(await db.items.count()).toBe(0)
      expect(await db.lists.count()).toBe(0)
    })
  })

  describe('queryActiveLists / queryArchivedLists', () => {
    it('separates by status', async () => {
      const a = await createList({ name: 'A' })
      const b = await createList({ name: 'B' })
      if (!a.ok || !b.ok) throw new Error('setup failed')
      await updateList(b.data.id, { status: 'ARCHIVED' })

      const active = await queryActiveLists()
      const archived = await queryArchivedLists()
      expect(active.map((l) => l.name)).toEqual(['A'])
      expect(archived.map((l) => l.name)).toEqual(['B'])
    })
  })
})
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- lists`

Expected: all tests green.

- [ ] **Step 3: USER COMMIT**

```bash
git add src/services/db/lists.ts src/services/db/__tests__/lists.test.ts
git commit -m "feat(sprint1): lists repository with CRUD + cascade + changeLog"
```

---

## Task 1.3: Create `src/features/lists/logic.ts`

**Files:**
- Create: `src/features/lists/logic.ts`

- [ ] **Step 1: Write the file**

```ts
import { ListFormSchema, type ListFormInput, type List } from '../../types/domain'

export { ListFormSchema }
export type { ListFormInput }

const RTF = new Intl.RelativeTimeFormat('it', { numeric: 'auto' })

export function formatUpdatedAt(list: List): string {
  const deltaMs = Date.now() - list.updatedAt
  const deltaSec = Math.round(-deltaMs / 1000)
  if (Math.abs(deltaSec) < 60) return RTF.format(deltaSec, 'second')
  const deltaMin = Math.round(deltaSec / 60)
  if (Math.abs(deltaMin) < 60) return RTF.format(deltaMin, 'minute')
  const deltaHour = Math.round(deltaMin / 60)
  if (Math.abs(deltaHour) < 24) return RTF.format(deltaHour, 'hour')
  const deltaDay = Math.round(deltaHour / 24)
  return RTF.format(deltaDay, 'day')
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 1.4: Write `logic.test.ts` for lists

**Files:**
- Create: `src/features/lists/__tests__/logic.test.ts`

- [ ] **Step 1: Write the tests**

```ts
import { describe, it, expect } from 'vitest'
import { ListFormSchema, formatUpdatedAt } from '../logic'
import type { List } from '../../../types/domain'

describe('ListFormSchema', () => {
  it('accepts a valid name', () => {
    const r = ListFormSchema.safeParse({ name: 'Spesa' })
    expect(r.success).toBe(true)
  })

  it('rejects empty name', () => {
    const r = ListFormSchema.safeParse({ name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.errors[0].message).toMatch(/obbligatorio/i)
  })

  it('rejects whitespace-only', () => {
    const r = ListFormSchema.safeParse({ name: '   ' })
    expect(r.success).toBe(false)
  })

  it('rejects >100 chars', () => {
    const r = ListFormSchema.safeParse({ name: 'x'.repeat(101) })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.errors[0].message).toMatch(/max/i)
  })
})

describe('formatUpdatedAt', () => {
  const baseList: List = {
    id: 'x', name: 'x', ownerId: 'u', status: 'ACTIVE',
    isTemplate: false, sharedWith: [], createdAt: 0, updatedAt: 0,
    syncedAt: null, localOnly: true,
  }

  it('returns a non-empty string for any input', () => {
    const r = formatUpdatedAt({ ...baseList, updatedAt: Date.now() - 5000 })
    expect(typeof r).toBe('string')
    expect(r.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- features/lists`

Expected: green.

- [ ] **Step 3: USER COMMIT** (batched with 1.5)

---

## Task 1.5: Create read hooks (`useLists`, `useArchivedLists`, `useList`)

**Files:**
- Create: `src/features/lists/hooks/useLists.ts`
- Create: `src/features/lists/hooks/useArchivedLists.ts`
- Create: `src/features/lists/hooks/useList.ts`

- [ ] **Step 1: Write `useLists.ts`**

```ts
import { useLiveQuery } from 'dexie-react-hooks'
import { queryActiveLists } from '../../../services/db/lists'

export function useLists() {
  return useLiveQuery(() => queryActiveLists(), [])
}
```

- [ ] **Step 2: Write `useArchivedLists.ts`**

```ts
import { useLiveQuery } from 'dexie-react-hooks'
import { queryArchivedLists } from '../../../services/db/lists'

export function useArchivedLists() {
  return useLiveQuery(() => queryArchivedLists(), [])
}
```

- [ ] **Step 3: Write `useList.ts`**

```ts
import { useLiveQuery } from 'dexie-react-hooks'
import { getListById } from '../../../services/db/lists'

export function useList(id: string | undefined) {
  return useLiveQuery(
    () => (id ? getListById(id) : undefined),
    [id]
  )
}
```

- [ ] **Step 4: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

- [ ] **Step 5: USER COMMIT** (batched with 1.6)

---

## Task 1.6: Create `useListOperations.ts`

**Files:**
- Create: `src/features/lists/hooks/useListOperations.ts`

- [ ] **Step 1: Write the hook**

```ts
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import * as listsRepo from '../../../services/db/lists'
import { ListFormSchema } from '../logic'
import { err, type Result, type AppError } from '../../../utils/result'
import type { List, ListStatus } from '../../../types/domain'

export function useListOperations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  const run = useCallback(async <T,>(
    fn: () => Promise<Result<T, AppError>>,
    successMsg?: string
  ): Promise<Result<T, AppError>> => {
    setLoading(true)
    setError(null)
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
  }, [])

  const createList = useCallback(async (name: string): Promise<Result<List, AppError>> => {
    const parsed = ListFormSchema.safeParse({ name })
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Input invalido'
      toast.error(msg)
      return err({ code: 'VALIDATION' as const, message: msg })
    }
    return run(() => listsRepo.createList({ name: parsed.data.name }), 'Lista creata')
  }, [run])

  const renameList = useCallback(async (id: string, name: string): Promise<Result<List, AppError>> => {
    const parsed = ListFormSchema.safeParse({ name })
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Input invalido'
      toast.error(msg)
      return err({ code: 'VALIDATION' as const, message: msg })
    }
    return run(() => listsRepo.updateList(id, { name: parsed.data.name }), 'Lista rinominata')
  }, [run])

  const setListStatus = useCallback((id: string, status: ListStatus) => {
    const msg = status === 'ARCHIVED' ? 'Lista archiviata' : 'Lista riattivata'
    return run(() => listsRepo.updateList(id, { status }), msg)
  }, [run])

  const deleteList = useCallback((id: string) =>
    run(() => listsRepo.deleteList(id), 'Lista eliminata'),
  [run])

  return {
    loading,
    error,
    clearError: () => setError(null),
    createList,
    renameList,
    archiveList: (id: string) => setListStatus(id, 'ARCHIVED'),
    unarchiveList: (id: string) => setListStatus(id, 'ACTIVE'),
    deleteList,
  }
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 1.7: Write `features/lists/__tests__/hooks.test.tsx`

**Files:**
- Create: `src/features/lists/__tests__/hooks.test.tsx`

- [ ] **Step 1: Write the hook tests**

```tsx
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { db } from '../../../services/db/schema'
import { useLists } from '../hooks/useLists'
import { useListOperations } from '../hooks/useListOperations'

// sonner is a side-effect module — stub it so toasts don't crash tests
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}))

describe('useLists + useListOperations', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  it('creates a list and hook reflects it reactively', async () => {
    const hook = renderHook(() => ({
      lists: useLists(),
      ops: useListOperations(),
    }))

    await act(async () => {
      const r = await hook.result.current.ops.createList('Spesa')
      expect(r.ok).toBe(true)
    })

    await waitFor(() => {
      expect(hook.result.current.lists).toBeDefined()
      expect(hook.result.current.lists).toHaveLength(1)
    })
    expect(hook.result.current.lists![0].name).toBe('Spesa')
  })

  it('rejects empty name at validation without hitting the repo', async () => {
    const hook = renderHook(() => useListOperations())
    let result: Awaited<ReturnType<typeof hook.result.current.createList>> | undefined
    await act(async () => {
      result = await hook.result.current.createList('')
    })
    expect(result?.ok).toBe(false)
    if (result && !result.ok) expect(result.error.code).toBe('VALIDATION')
    expect(await db.lists.count()).toBe(0)
  })

  it('archives a list', async () => {
    const hook = renderHook(() => useListOperations())
    let id: string = ''
    await act(async () => {
      const r = await hook.result.current.createList('L')
      if (r.ok) id = r.data.id
    })
    await act(async () => {
      await hook.result.current.archiveList(id)
    })
    const row = await db.lists.get(id)
    expect(row?.status).toBe('ARCHIVED')
  })
})
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- features/lists/__tests__/hooks`

Expected: green.

- [ ] **Step 3: USER COMMIT**

```bash
git add src/features/lists/logic.ts src/features/lists/hooks src/features/lists/__tests__
git commit -m "feat(sprint1): lists feature — logic, hooks, tests"
```

---

## Task 1.8: Create `ConfirmDialog.tsx`

**Files:**
- Create: `src/components/shared/ConfirmDialog.tsx`

- [ ] **Step 1: Write the dialog component**

```tsx
import { useState, useRef, useCallback, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
}

const DOUBLE_CLICK_WINDOW_MS = 500

/**
 * Destructive-action confirm dialog.
 *
 * Physical double-click on the Confirm button: the first click arms the
 * button (label changes to "Conferma di nuovo"), the second click within
 * {@link DOUBLE_CLICK_WINDOW_MS} actually fires onConfirm.
 * If the user waits longer than the window, the button disarms.
 *
 * This enforces CLAUDE.md §"Vincoli Assoluti":
 * "Mai operazioni distruttive senza conferma (dialog + doppio click)".
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Elimina',
  cancelLabel = 'Annulla',
  onConfirm,
}: ConfirmDialogProps) {
  const [armed, setArmed] = useState(false)
  const armTimer = useRef<number | null>(null)

  const handleConfirmClick = useCallback(async () => {
    if (!armed) {
      setArmed(true)
      armTimer.current = window.setTimeout(() => setArmed(false), DOUBLE_CLICK_WINDOW_MS)
      return
    }
    if (armTimer.current !== null) window.clearTimeout(armTimer.current)
    setArmed(false)
    await onConfirm()
    onOpenChange(false)
  }, [armed, onConfirm, onOpenChange])

  const handleOpenChange = useCallback((next: boolean) => {
    if (!next) {
      if (armTimer.current !== null) window.clearTimeout(armTimer.current)
      setArmed(false)
    }
    onOpenChange(next)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmClick}
            aria-pressed={armed}
          >
            {armed ? 'Conferma di nuovo' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors. If `@/components/ui/*` imports fail, see Task 0.2 Step 3 on path aliases.

---

## Task 1.9: Create `ListForm.tsx`

**Files:**
- Create: `src/features/lists/components/ListForm.tsx`

- [ ] **Step 1: Write the form**

```tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ListFormSchema, type ListFormInput } from '../logic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ListFormProps {
  mode: 'create' | 'rename'
  initial?: ListFormInput
  onSubmit: (data: ListFormInput) => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function ListForm({ mode, initial, onSubmit, onCancel, loading }: ListFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<ListFormInput>({
    resolver: zodResolver(ListFormSchema),
    mode: 'onChange',
    defaultValues: initial ?? { name: '' },
  })

  useEffect(() => {
    if (mode === 'create') reset({ name: '' })
  }, [mode, reset])

  const submit = handleSubmit(async (data) => {
    await onSubmit(data)
    if (mode === 'create') reset({ name: '' })
  })

  return (
    <form onSubmit={submit} className="flex flex-col gap-2" aria-label={mode === 'create' ? 'Crea lista' : 'Rinomina lista'}>
      <Label htmlFor="list-name">Nome lista</Label>
      <div className="flex gap-2">
        <Input
          id="list-name"
          autoFocus
          placeholder="es. Spesa settimanale"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'list-name-error' : undefined}
          {...register('name')}
        />
        <Button type="submit" disabled={!isValid || loading}>
          {mode === 'create' ? 'Crea' : 'Salva'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annulla
          </Button>
        )}
      </div>
      {errors.name && (
        <p id="list-name-error" className="text-sm text-destructive" role="alert">
          {errors.name.message}
        </p>
      )}
    </form>
  )
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 1.10: Create `ListCard.tsx`

**Files:**
- Create: `src/features/lists/components/ListCard.tsx`

- [ ] **Step 1: Write the card component**

```tsx
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { db } from '../../../services/db/schema'
import { formatUpdatedAt } from '../logic'
import type { List } from '../../../types/domain'

interface ListCardProps {
  list: List
  onArchive: (id: string) => void
  onUnarchive: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string) => void
}

export function ListCard({ list, onArchive, onUnarchive, onDelete, onRename }: ListCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Count of active (non-trashed) items in this list
  const itemCount = useLiveQuery(
    () => db.items.where('[listId+deletedAt]').equals([list.id, null]).count(),
    [list.id]
  )

  const isArchived = list.status === 'ARCHIVED'

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm flex items-center justify-between gap-3">
      <Link to={`/lists/${list.id}`} className="flex-1 min-w-0 hover:underline">
        <h3 className="font-semibold text-brand-600 truncate">{list.name}</h3>
        <p className="text-sm text-neutral-500">
          {itemCount ?? 0} articoli · aggiornata {formatUpdatedAt(list)}
        </p>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label={`Menu lista ${list.name}`}>
            ⋯
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onRename(list.id)}>Rinomina</DropdownMenuItem>
          {isArchived ? (
            <DropdownMenuItem onSelect={() => onUnarchive(list.id)}>Riattiva</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => onArchive(list.id)}>Archivia</DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() => setConfirmOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            Elimina
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Eliminare "${list.name}"?`}
        description={`Verranno eliminati anche tutti gli articoli. Questa operazione non è reversibile. Clicca "Elimina" due volte per confermare.`}
        confirmLabel="Elimina"
        onConfirm={() => onDelete(list.id)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 1.11: Create `ArchivedListsSection.tsx`

**Files:**
- Create: `src/features/lists/components/ArchivedListsSection.tsx`

- [ ] **Step 1: Write the section**

```tsx
import { useArchivedLists } from '../hooks/useArchivedLists'
import { ListCard } from './ListCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { List } from '../../../types/domain'

interface Props {
  onArchive: (id: string) => void
  onUnarchive: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string) => void
}

export function ArchivedListsSection({ onArchive, onUnarchive, onDelete, onRename }: Props) {
  const archived: List[] | undefined = useArchivedLists()

  if (archived === undefined) return <Skeleton className="h-20 w-full" />
  if (archived.length === 0) return null

  return (
    <details className="mt-6 border-t pt-4">
      <summary className="cursor-pointer text-sm text-neutral-600 hover:text-neutral-900">
        Mostra archiviate ({archived.length})
      </summary>
      <div className="mt-3 flex flex-col gap-2">
        {archived.map((list) => (
          <ListCard
            key={list.id}
            list={list}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
            onDelete={onDelete}
            onRename={onRename}
          />
        ))}
      </div>
    </details>
  )
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 1.12: Create `ListDashboard.tsx`

**Files:**
- Create: `src/features/lists/components/ListDashboard.tsx`

- [ ] **Step 1: Write the dashboard**

```tsx
import { useState } from 'react'
import { useLists } from '../hooks/useLists'
import { useListOperations } from '../hooks/useListOperations'
import { ListCard } from './ListCard'
import { ListForm } from './ListForm'
import { ArchivedListsSection } from './ArchivedListsSection'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { List } from '../../../types/domain'

export function ListDashboard() {
  const lists = useLists()
  const ops = useListOperations()
  const [renameTarget, setRenameTarget] = useState<List | null>(null)

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">Le mie liste</h1>
        <p className="text-sm text-neutral-500">Guest mode · offline-first</p>
      </header>

      <ListForm
        mode="create"
        onSubmit={(data) => ops.createList(data.name)}
        loading={ops.loading}
      />

      {lists === undefined ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : lists.length === 0 ? (
        <p className="text-neutral-500 italic">Nessuna lista. Creane una qui sopra.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onArchive={ops.archiveList}
              onUnarchive={ops.unarchiveList}
              onDelete={ops.deleteList}
              onRename={(id) => {
                const target = lists.find((l) => l.id === id)
                if (target) setRenameTarget(target)
              }}
            />
          ))}
        </div>
      )}

      <ArchivedListsSection
        onArchive={ops.archiveList}
        onUnarchive={ops.unarchiveList}
        onDelete={ops.deleteList}
        onRename={(id) => {
          // also look up in archived set
          // (for Sprint 1 we fetch via db.lists on demand)
        }}
      />

      <Dialog open={renameTarget !== null} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rinomina lista</DialogTitle>
          </DialogHeader>
          {renameTarget && (
            <ListForm
              mode="rename"
              initial={{ name: renameTarget.name }}
              onSubmit={async (data) => {
                await ops.renameList(renameTarget.id, data.name)
                setRenameTarget(null)
              }}
              onCancel={() => setRenameTarget(null)}
              loading={ops.loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 1.13: Create `AppShell.tsx`

**Files:**
- Create: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Write the shell**

```tsx
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'

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
          <NavLink
            to="/lists"
            className={({ isActive }) => isActive ? 'font-semibold text-brand-600' : 'text-neutral-600'}
          >
            Liste
          </NavLink>
          <NavLink
            to="/trash"
            className={({ isActive }) => isActive ? 'font-semibold text-brand-600' : 'text-neutral-600'}
          >
            Cestino
          </NavLink>
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

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 1.14: Rewrite `App.tsx` with router

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/__tests__/App.test.tsx`

- [ ] **Step 1: Replace `App.tsx`**

```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ListDashboard } from '@/features/lists/components/ListDashboard'

function Placeholder({ label }: { label: string }) {
  return <div className="text-neutral-500 italic">{label}</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/lists" replace />} />
          <Route path="/lists" element={<ListDashboard />} />
          <Route path="/lists/:id" element={<Placeholder label="Dettaglio lista — Phase 2" />} />
          <Route path="/trash" element={<Placeholder label="Cestino — Phase 3" />} />
          <Route path="*" element={<Navigate to="/lists" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Update `App.test.tsx`**

Replace with:

```tsx
import 'fake-indexeddb/auto'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}))

describe('App', () => {
  it('renders the AppShell with nav', () => {
    render(<App />)
    expect(screen.getByText('ShoppingList')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Liste' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cestino' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run full suite**

Run: `npm test`

Expected: all tests green.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`

Open http://localhost:5173 — expected:
- Redirected to `/lists`
- Dashboard renders with "Le mie liste" heading
- Create a list → appears instantly
- Rename via dropdown → changes reflect
- Archive via dropdown → moves to "Mostra archiviate"
- Delete via dropdown → dialog opens → first click arms → second click within 500ms deletes
- Toast appears on each operation
- Navigate to `/trash` → placeholder text

Stop the dev server.

- [ ] **Step 5: USER COMMIT**

```bash
git add src/components src/features/lists/components src/App.tsx src/__tests__/App.test.tsx
git commit -m "feat(sprint1): lists dashboard UI with AppShell, ConfirmDialog, toasts"
```

---

## Task 1.15: Phase 1 checkpoint

- [ ] **Step 1: Lint + typecheck + test**

Run: `npm run lint && npx tsc --noEmit && npm test`

Expected: all green.

- [ ] **Step 2: Production build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 3: Preview smoke**

Run: `npm run preview`

Open http://localhost:4173. Repeat the Task 1.14 Step 4 manual smoke test. Expected: identical behavior.

- [ ] **Step 4: Phase 1 DoD check**

Verify the following DoD criteria from the spec are green:
- DoD #3 (repos + changeLog): ✓ (tests)
- DoD #4 (validation): ✓ (logic test)
- DoD #5 (hook tests): ✓ (features/lists hooks)
- DoD #6 (`/lists` reactive): ✓ (manual)
- DoD #11 (shadcn/ui rendered): ✓ (manual)
- DoD #12 (toasts fire): ✓ (manual)
- DoD #13 (RHF + Zod block invalid submit): ✓ (manual — try submitting empty name)

Phase 1 done. Stop the preview server. Proceed to Phase 2.

---

# PHASE 2 — Items slice

At the end of Phase 2, `/lists/:id` shows item CRUD, toggle, soft-delete, and drag-reorder.

---

## Task 2.1: Create `src/services/db/items.ts`

**Files:**
- Create: `src/services/db/items.ts`

- [ ] **Step 1: Write the repository**

```ts
import { db } from './schema'
import { recordChange } from './changeLog'
import { getCurrentUserId } from './session'
import { nanoid } from '../../utils/id'
import type { Item, ItemStatus } from '../../types/domain'
import { ok, err, toAppError, type Result, type AppError } from '../../utils/result'

interface CreateItemInput {
  listId: string
  name: string
  quantity: number | null
  unit: string | null
  notes: string | null
  category: string | null
}

interface UpdateItemInput {
  name?: string
  quantity?: number | null
  unit?: string | null
  notes?: string | null
  category?: string | null
}

async function nextSortOrder(listId: string): Promise<number> {
  const siblings = await db.items.where('listId').equals(listId).toArray()
  if (siblings.length === 0) return 1000
  return Math.max(...siblings.map((s) => s.sortOrder)) + 1000
}

export async function createItem(input: CreateItemInput): Promise<Result<Item, AppError>> {
  try {
    const userId = await getCurrentUserId()
    const now = Date.now()
    const item: Item = {
      id: nanoid(),
      listId: input.listId,
      name: input.name.trim(),
      quantity: input.quantity,
      unit: input.unit,
      notes: input.notes,
      category: input.category,
      status: 'DA_COMPRARE',
      deletedAt: null,
      sortOrder: await nextSortOrder(input.listId),
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      createdBy: userId,
      updatedBy: userId,
    }
    await db.transaction('rw', db.items, db.changes, async () => {
      await db.items.add(item)
      await recordChange({
        entityType: 'ITEM',
        entityId: item.id,
        operationType: 'CREATE',
        userId,
        changes: { name: { from: null, to: item.name } },
      })
    })
    return ok(item)
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function updateItem(id: string, patch: UpdateItemInput): Promise<Result<Item, AppError>> {
  try {
    const userId = await getCurrentUserId()
    return await db.transaction('rw', db.items, db.changes, async () => {
      const current = await db.items.get(id)
      if (!current) return err({ code: 'NOT_FOUND' as const, message: `Item ${id} not found` })

      const next: Item = {
        ...current,
        ...(patch.name !== undefined && { name: patch.name.trim() }),
        ...(patch.quantity !== undefined && { quantity: patch.quantity }),
        ...(patch.unit !== undefined && { unit: patch.unit }),
        ...(patch.notes !== undefined && { notes: patch.notes }),
        ...(patch.category !== undefined && { category: patch.category }),
        updatedAt: Date.now(),
        updatedBy: userId,
      }

      const diff: Record<string, { from: unknown; to: unknown }> = {}
      for (const key of ['name', 'quantity', 'unit', 'notes', 'category'] as const) {
        if (patch[key] !== undefined && next[key] !== current[key]) {
          diff[key] = { from: current[key], to: next[key] }
        }
      }
      if (Object.keys(diff).length === 0) return ok(current)

      await db.items.put(next)
      await recordChange({
        entityType: 'ITEM',
        entityId: id,
        operationType: 'UPDATE',
        userId,
        changes: diff,
      })
      return ok(next)
    })
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function toggleItemStatus(id: string): Promise<Result<Item, AppError>> {
  try {
    const userId = await getCurrentUserId()
    return await db.transaction('rw', db.items, db.changes, async () => {
      const current = await db.items.get(id)
      if (!current) return err({ code: 'NOT_FOUND' as const, message: `Item ${id} not found` })

      const nextStatus: ItemStatus = current.status === 'DA_COMPRARE' ? 'COMPLETATO' : 'DA_COMPRARE'
      const now = Date.now()
      const next: Item = {
        ...current,
        status: nextStatus,
        completedAt: nextStatus === 'COMPLETATO' ? now : null,
        updatedAt: now,
        updatedBy: userId,
      }
      await db.items.put(next)
      await recordChange({
        entityType: 'ITEM',
        entityId: id,
        operationType: 'STATE_CHANGE',
        userId,
        changes: { status: { from: current.status, to: nextStatus } },
      })
      return ok(next)
    })
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function softDeleteItem(id: string): Promise<Result<Item, AppError>> {
  try {
    const userId = await getCurrentUserId()
    return await db.transaction('rw', db.items, db.changes, async () => {
      const current = await db.items.get(id)
      if (!current) return err({ code: 'NOT_FOUND' as const, message: `Item ${id} not found` })

      const next: Item = {
        ...current,
        deletedAt: Date.now(),
        updatedAt: Date.now(),
        updatedBy: userId,
      }
      await db.items.put(next)
      await recordChange({
        entityType: 'ITEM',
        entityId: id,
        operationType: 'DELETE',
        userId,
        changes: { deletedAt: { from: null, to: next.deletedAt } },
      })
      return ok(next)
    })
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function restoreItem(id: string): Promise<Result<Item, AppError>> {
  try {
    const userId = await getCurrentUserId()
    return await db.transaction('rw', db.items, db.changes, async () => {
      const current = await db.items.get(id)
      if (!current) return err({ code: 'NOT_FOUND' as const, message: `Item ${id} not found` })

      const prevDeletedAt = current.deletedAt
      const next: Item = {
        ...current,
        deletedAt: null,
        updatedAt: Date.now(),
        updatedBy: userId,
      }
      await db.items.put(next)
      await recordChange({
        entityType: 'ITEM',
        entityId: id,
        operationType: 'UPDATE',
        userId,
        changes: { deletedAt: { from: prevDeletedAt, to: null } },
      })
      return ok(next)
    })
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function reorderItems(
  listId: string,
  orderedIds: string[]
): Promise<Result<void, AppError>> {
  try {
    const userId = await getCurrentUserId()
    return await db.transaction('rw', db.items, db.changes, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i]
        const current = await db.items.get(id)
        if (!current) continue
        const newSort = (i + 1) * 1000
        if (current.sortOrder === newSort) continue
        await db.items.put({ ...current, sortOrder: newSort, updatedAt: Date.now(), updatedBy: userId })
        await recordChange({
          entityType: 'ITEM',
          entityId: id,
          operationType: 'UPDATE',
          userId,
          changes: { sortOrder: { from: current.sortOrder, to: newSort } },
        })
      }
      return ok(undefined as void)
    })
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

// Queries
export const queryActiveItems = (listId: string) =>
  db.items.where('[listId+deletedAt]').equals([listId, null]).sortBy('sortOrder')

export const queryTrashedItems = () =>
  db.items.where('deletedAt').above(0).reverse().sortBy('deletedAt')

export const getItemById = (id: string) => db.items.get(id)
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 2.2: Write `items.test.ts`

**Files:**
- Create: `src/services/db/__tests__/items.test.ts`

- [ ] **Step 1: Write the tests**

```ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '../schema'
import { createList } from '../lists'
import {
  createItem, updateItem, toggleItemStatus, softDeleteItem, restoreItem, reorderItems,
  queryActiveItems, queryTrashedItems,
} from '../items'

async function mkList(): Promise<string> {
  const r = await createList({ name: 'L' })
  if (!r.ok) throw new Error('setup failed')
  return r.data.id
}

describe('items repository', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  describe('createItem', () => {
    it('creates DA_COMPRARE item with sortOrder = 1000 for first item', async () => {
      const listId = await mkList()
      const r = await createItem({
        listId, name: 'pane',
        quantity: null, unit: null, notes: null, category: null,
      })
      expect(r.ok).toBe(true)
      if (r.ok) {
        expect(r.data.status).toBe('DA_COMPRARE')
        expect(r.data.sortOrder).toBe(1000)
        expect(r.data.completedAt).toBeNull()
        expect(r.data.deletedAt).toBeNull()
      }
    })

    it('assigns incremental sortOrder for subsequent items', async () => {
      const listId = await mkList()
      const a = await createItem({ listId, name: 'a', quantity: null, unit: null, notes: null, category: null })
      const b = await createItem({ listId, name: 'b', quantity: null, unit: null, notes: null, category: null })
      if (!a.ok || !b.ok) throw new Error('setup failed')
      expect(b.data.sortOrder).toBe(2000)
    })
  })

  describe('toggleItemStatus', () => {
    it('flips DA_COMPRARE -> COMPLETATO and sets completedAt', async () => {
      const listId = await mkList()
      const r = await createItem({ listId, name: 'x', quantity: null, unit: null, notes: null, category: null })
      if (!r.ok) throw new Error('setup failed')
      const toggled = await toggleItemStatus(r.data.id)
      expect(toggled.ok).toBe(true)
      if (toggled.ok) {
        expect(toggled.data.status).toBe('COMPLETATO')
        expect(toggled.data.completedAt).not.toBeNull()
      }
    })

    it('flips back and clears completedAt', async () => {
      const listId = await mkList()
      const r = await createItem({ listId, name: 'x', quantity: null, unit: null, notes: null, category: null })
      if (!r.ok) throw new Error('setup failed')
      await toggleItemStatus(r.data.id)
      const back = await toggleItemStatus(r.data.id)
      expect(back.ok).toBe(true)
      if (back.ok) {
        expect(back.data.status).toBe('DA_COMPRARE')
        expect(back.data.completedAt).toBeNull()
      }
    })
  })

  describe('softDeleteItem + restoreItem', () => {
    it('sets deletedAt and hides from active query', async () => {
      const listId = await mkList()
      const r = await createItem({ listId, name: 'x', quantity: null, unit: null, notes: null, category: null })
      if (!r.ok) throw new Error('setup failed')
      await softDeleteItem(r.data.id)

      const active = await queryActiveItems(listId)
      expect(active).toHaveLength(0)

      const trashed = await queryTrashedItems()
      expect(trashed).toHaveLength(1)
      expect(trashed[0].deletedAt).not.toBeNull()
    })

    it('restores item and clears deletedAt', async () => {
      const listId = await mkList()
      const r = await createItem({ listId, name: 'x', quantity: null, unit: null, notes: null, category: null })
      if (!r.ok) throw new Error('setup failed')
      await softDeleteItem(r.data.id)
      const restored = await restoreItem(r.data.id)
      expect(restored.ok).toBe(true)
      if (restored.ok) expect(restored.data.deletedAt).toBeNull()

      const active = await queryActiveItems(listId)
      expect(active).toHaveLength(1)
    })
  })

  describe('reorderItems', () => {
    it('reassigns sortOrder and writes one changeLog per moved item', async () => {
      const listId = await mkList()
      const a = await createItem({ listId, name: 'a', quantity: null, unit: null, notes: null, category: null })
      const b = await createItem({ listId, name: 'b', quantity: null, unit: null, notes: null, category: null })
      const c = await createItem({ listId, name: 'c', quantity: null, unit: null, notes: null, category: null })
      if (!a.ok || !b.ok || !c.ok) throw new Error('setup failed')

      const changesBefore = await db.changes.count()
      await reorderItems(listId, [c.data.id, a.data.id, b.data.id])
      const changesAfter = await db.changes.count()

      // c: 3000 -> 1000, a: 1000 -> 2000, b: 2000 -> 3000 = 3 moves
      expect(changesAfter - changesBefore).toBe(3)

      const items = await queryActiveItems(listId)
      expect(items.map((i) => i.name)).toEqual(['c', 'a', 'b'])
    })

    it('is a no-op for items already in target order', async () => {
      const listId = await mkList()
      const a = await createItem({ listId, name: 'a', quantity: null, unit: null, notes: null, category: null })
      if (!a.ok) throw new Error('setup failed')

      const changesBefore = await db.changes.count()
      await reorderItems(listId, [a.data.id])
      const changesAfter = await db.changes.count()
      expect(changesAfter - changesBefore).toBe(0)
    })
  })

  describe('updateItem', () => {
    it('updates fields and writes diffed changeLog', async () => {
      const listId = await mkList()
      const r = await createItem({ listId, name: 'x', quantity: null, unit: null, notes: null, category: null })
      if (!r.ok) throw new Error('setup failed')
      await updateItem(r.data.id, { quantity: 3, notes: 'fresche' })

      const updated = await db.items.get(r.data.id)
      expect(updated?.quantity).toBe(3)
      expect(updated?.notes).toBe('fresche')
    })
  })
})
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- items`

Expected: green.

- [ ] **Step 3: USER COMMIT**

```bash
git add src/services/db/items.ts src/services/db/__tests__/items.test.ts
git commit -m "feat(sprint1): items repository with CRUD, toggle, soft-delete, reorder"
```

---

## Task 2.3: Create `src/features/items/logic.ts`

**Files:**
- Create: `src/features/items/logic.ts`

- [ ] **Step 1: Write the file**

```ts
import { ItemFormSchema, type ItemFormInput, type Item } from '../../types/domain'

export { ItemFormSchema }
export type { ItemFormInput }

export function computeNextSortOrder(siblings: Item[]): number {
  if (siblings.length === 0) return 1000
  return Math.max(...siblings.map((s) => s.sortOrder)) + 1000
}
```

- [ ] **Step 2: Write `src/features/items/__tests__/logic.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { ItemFormSchema, computeNextSortOrder } from '../logic'
import type { Item } from '../../../types/domain'

describe('ItemFormSchema', () => {
  const valid = { name: 'pane', quantity: 2, unit: 'pezzi', notes: null, category: null }

  it('accepts valid input', () => {
    expect(ItemFormSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts null quantity', () => {
    expect(ItemFormSchema.safeParse({ ...valid, quantity: null }).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(ItemFormSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('rejects quantity <= 0', () => {
    expect(ItemFormSchema.safeParse({ ...valid, quantity: 0 }).success).toBe(false)
    expect(ItemFormSchema.safeParse({ ...valid, quantity: -1 }).success).toBe(false)
  })

  it('rejects notes > 500 chars', () => {
    expect(ItemFormSchema.safeParse({ ...valid, notes: 'x'.repeat(501) }).success).toBe(false)
  })

  it('rejects name > 200 chars', () => {
    expect(ItemFormSchema.safeParse({ ...valid, name: 'x'.repeat(201) }).success).toBe(false)
  })
})

describe('computeNextSortOrder', () => {
  const base: Omit<Item, 'id' | 'sortOrder'> = {
    listId: 'l', name: 'x', quantity: null, unit: null, notes: null, category: null,
    status: 'DA_COMPRARE', deletedAt: null, createdAt: 0, updatedAt: 0,
    completedAt: null, createdBy: 'u', updatedBy: 'u',
  }

  it('returns 1000 for empty siblings', () => {
    expect(computeNextSortOrder([])).toBe(1000)
  })

  it('returns max + 1000 for non-empty', () => {
    const siblings: Item[] = [
      { ...base, id: 'a', sortOrder: 1000 },
      { ...base, id: 'b', sortOrder: 2500 },
    ]
    expect(computeNextSortOrder(siblings)).toBe(3500)
  })
})
```

- [ ] **Step 3: Run tests**

Run: `npm test -- features/items/__tests__/logic`

Expected: green.

---

## Task 2.4: Create item hooks (`useItems`, `useItemOperations`)

**Files:**
- Create: `src/features/items/hooks/useItems.ts`
- Create: `src/features/items/hooks/useItemOperations.ts`

- [ ] **Step 1: Write `useItems.ts`**

```ts
import { useLiveQuery } from 'dexie-react-hooks'
import { queryActiveItems } from '../../../services/db/items'

export function useItems(listId: string | undefined) {
  return useLiveQuery(
    () => (listId ? queryActiveItems(listId) : []),
    [listId]
  )
}
```

- [ ] **Step 2: Write `useItemOperations.ts`**

```ts
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import * as itemsRepo from '../../../services/db/items'
import { ItemFormSchema, type ItemFormInput } from '../logic'
import { err, type Result, type AppError } from '../../../utils/result'
import type { Item } from '../../../types/domain'

export function useItemOperations(listId: string | undefined) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  const run = useCallback(async <T,>(
    fn: () => Promise<Result<T, AppError>>,
    successMsg?: string
  ): Promise<Result<T, AppError>> => {
    setLoading(true)
    setError(null)
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
  }, [])

  const createItem = useCallback(async (input: ItemFormInput): Promise<Result<Item, AppError>> => {
    if (!listId) {
      toast.error('Nessuna lista selezionata')
      return err({ code: 'VALIDATION' as const, message: 'Nessuna lista selezionata' })
    }
    const parsed = ItemFormSchema.safeParse(input)
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Input invalido'
      toast.error(msg)
      return err({ code: 'VALIDATION' as const, message: msg })
    }
    return run(() => itemsRepo.createItem({ listId, ...parsed.data }), 'Articolo aggiunto')
  }, [listId, run])

  const updateItem = useCallback(async (id: string, patch: Partial<ItemFormInput>): Promise<Result<Item, AppError>> => {
    // Validate only fields present in patch
    const parsed = ItemFormSchema.partial().safeParse(patch)
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Input invalido'
      toast.error(msg)
      return err({ code: 'VALIDATION' as const, message: msg })
    }
    return run(() => itemsRepo.updateItem(id, parsed.data), 'Articolo aggiornato')
  }, [run])

  const toggleItem = useCallback((id: string) =>
    run(() => itemsRepo.toggleItemStatus(id)),
  [run])

  const softDeleteItem = useCallback((id: string) =>
    run(() => itemsRepo.softDeleteItem(id), 'Articolo spostato nel cestino'),
  [run])

  const restoreItem = useCallback((id: string) =>
    run(() => itemsRepo.restoreItem(id), 'Articolo ripristinato'),
  [run])

  const reorderItems = useCallback((orderedIds: string[]) => {
    if (!listId) return Promise.resolve(err({ code: 'VALIDATION' as const, message: 'Nessuna lista' }))
    return run(() => itemsRepo.reorderItems(listId, orderedIds))
  }, [listId, run])

  return {
    loading,
    error,
    createItem,
    updateItem,
    toggleItem,
    softDeleteItem,
    restoreItem,
    reorderItems,
  }
}
```

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 2.5: Write `features/items/__tests__/hooks.test.tsx`

**Files:**
- Create: `src/features/items/__tests__/hooks.test.tsx`

- [ ] **Step 1: Write the tests**

```tsx
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { db } from '../../../services/db/schema'
import { createList } from '../../../services/db/lists'
import { useItems } from '../hooks/useItems'
import { useItemOperations } from '../hooks/useItemOperations'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}))

async function mkList(): Promise<string> {
  const r = await createList({ name: 'L' })
  if (!r.ok) throw new Error('setup failed')
  return r.data.id
}

describe('useItems + useItemOperations', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  it('full lifecycle: create -> toggle -> reorder -> soft-delete -> restore', async () => {
    const listId = await mkList()
    const hook = renderHook(() => ({
      items: useItems(listId),
      ops: useItemOperations(listId),
    }))

    // Create
    await act(async () => {
      await hook.result.current.ops.createItem({ name: 'a', quantity: null, unit: null, notes: null, category: null })
      await hook.result.current.ops.createItem({ name: 'b', quantity: null, unit: null, notes: null, category: null })
    })
    await waitFor(() => {
      expect(hook.result.current.items).toHaveLength(2)
    })

    // Toggle
    const aId = hook.result.current.items![0].id
    await act(async () => {
      await hook.result.current.ops.toggleItem(aId)
    })
    await waitFor(() => {
      const a = hook.result.current.items!.find((i) => i.id === aId)!
      expect(a.status).toBe('COMPLETATO')
      expect(a.completedAt).not.toBeNull()
    })

    // Reorder: b, a
    const bId = hook.result.current.items!.find((i) => i.id !== aId)!.id
    await act(async () => {
      await hook.result.current.ops.reorderItems([bId, aId])
    })
    await waitFor(() => {
      expect(hook.result.current.items!.map((i) => i.id)).toEqual([bId, aId])
    })

    // Soft-delete a
    await act(async () => {
      await hook.result.current.ops.softDeleteItem(aId)
    })
    await waitFor(() => {
      expect(hook.result.current.items).toHaveLength(1)
      expect(hook.result.current.items![0].id).toBe(bId)
    })

    // Restore a
    await act(async () => {
      await hook.result.current.ops.restoreItem(aId)
    })
    await waitFor(() => {
      expect(hook.result.current.items).toHaveLength(2)
    })
  })

  it('rejects invalid input at validation without hitting repo', async () => {
    const listId = await mkList()
    const hook = renderHook(() => useItemOperations(listId))
    let r: Awaited<ReturnType<typeof hook.result.current.createItem>> | undefined
    await act(async () => {
      r = await hook.result.current.createItem({ name: '', quantity: null, unit: null, notes: null, category: null })
    })
    expect(r?.ok).toBe(false)
    if (r && !r.ok) expect(r.error.code).toBe('VALIDATION')
    expect(await db.items.count()).toBe(0)
  })
})
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- features/items/__tests__/hooks`

Expected: green.

- [ ] **Step 3: USER COMMIT**

```bash
git add src/features/items/logic.ts src/features/items/hooks src/features/items/__tests__
git commit -m "feat(sprint1): items feature — logic, hooks, tests"
```

---

## Task 2.6: Create `ItemForm.tsx`

**Files:**
- Create: `src/features/items/components/ItemForm.tsx`

- [ ] **Step 1: Write the form**

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ItemFormSchema, type ItemFormInput } from '../logic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ItemFormProps {
  mode: 'add' | 'edit'
  initial?: ItemFormInput
  onSubmit: (data: ItemFormInput) => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
}

const EMPTY: ItemFormInput = {
  name: '',
  quantity: null,
  unit: null,
  notes: null,
  category: null,
}

export function ItemForm({ mode, initial, onSubmit, onCancel, loading }: ItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<ItemFormInput>({
    resolver: zodResolver(ItemFormSchema),
    mode: 'onChange',
    defaultValues: initial ?? EMPTY,
  })

  const submit = handleSubmit(async (data) => {
    await onSubmit(data)
    if (mode === 'add') reset(EMPTY)
  })

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 p-4 rounded-lg border bg-white"
      aria-label={mode === 'add' ? 'Aggiungi articolo' : 'Modifica articolo'}
    >
      <div>
        <Label htmlFor="item-name">Nome</Label>
        <Input
          id="item-name"
          autoFocus
          placeholder="es. pane integrale"
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <p className="text-sm text-destructive mt-1" role="alert">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="item-quantity">Quantità</Label>
          <Input
            id="item-quantity"
            type="number"
            step="0.01"
            min="0"
            placeholder="1"
            aria-invalid={!!errors.quantity}
            {...register('quantity', {
              setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
            })}
          />
          {errors.quantity && <p className="text-sm text-destructive mt-1" role="alert">{errors.quantity.message}</p>}
        </div>
        <div>
          <Label htmlFor="item-unit">Unità</Label>
          <Input
            id="item-unit"
            placeholder="es. kg, pezzi, bottiglie"
            {...register('unit', {
              setValueAs: (v) => (v === '' ? null : v),
            })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="item-category">Categoria</Label>
        <Input
          id="item-category"
          placeholder="es. Frutta e Verdura"
          {...register('category', {
            setValueAs: (v) => (v === '' ? null : v),
          })}
        />
      </div>

      <div>
        <Label htmlFor="item-notes">Note</Label>
        <Textarea
          id="item-notes"
          placeholder="Note opzionali"
          rows={2}
          aria-invalid={!!errors.notes}
          {...register('notes', {
            setValueAs: (v) => (v === '' ? null : v),
          })}
        />
        {errors.notes && <p className="text-sm text-destructive mt-1" role="alert">{errors.notes.message}</p>}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Annulla</Button>
        )}
        <Button type="submit" disabled={!isValid || loading}>
          {mode === 'add' ? 'Aggiungi' : 'Salva'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 2.7: Create `ItemRow.tsx`

**Files:**
- Create: `src/features/items/components/ItemRow.tsx`

- [ ] **Step 1: Write the row component**

```tsx
import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import type { Item } from '../../../types/domain'

interface ItemRowProps {
  item: Item
  onToggle: (id: string) => void
  onEdit: (item: Item) => void
  onDelete: (id: string) => void
  disabled?: boolean
}

export function ItemRow({ item, onToggle, onEdit, onDelete, disabled }: ItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const completed = item.status === 'COMPLETATO'

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg border bg-white"
      aria-label={`Articolo ${item.name}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Riordina ${item.name}`}
        className="cursor-grab text-neutral-400 hover:text-neutral-600 px-1"
        disabled={disabled}
      >
        ≡
      </button>

      <Checkbox
        checked={completed}
        onCheckedChange={() => onToggle(item.id)}
        aria-label={`Segna ${item.name} come ${completed ? 'da comprare' : 'completato'}`}
        disabled={disabled}
      />

      <div className="flex-1 min-w-0">
        <p className={`truncate ${completed ? 'line-through text-neutral-400' : ''}`}>
          {item.name}
          {item.quantity !== null && (
            <span className="text-neutral-500 ml-2">
              {item.quantity}{item.unit ? ` ${item.unit}` : ''}
            </span>
          )}
        </p>
        {item.notes && <p className="text-xs text-neutral-500 truncate">{item.notes}</p>}
        {item.category && <p className="text-xs text-brand-600">{item.category}</p>}
      </div>

      <Button variant="ghost" size="sm" onClick={() => onEdit(item)} aria-label={`Modifica ${item.name}`} disabled={disabled}>
        ✎
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} aria-label={`Elimina ${item.name}`} disabled={disabled}>
        🗑
      </Button>
    </li>
  )
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 2.8: Create `ItemList.tsx` with dnd-kit

**Files:**
- Create: `src/features/items/components/ItemList.tsx`

- [ ] **Step 1: Write the list container**

```tsx
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { ItemRow } from './ItemRow'
import type { Item } from '../../../types/domain'

interface ItemListProps {
  items: Item[]
  onToggle: (id: string) => void
  onEdit: (item: Item) => void
  onDelete: (id: string) => void
  onReorder: (orderedIds: string[]) => void
}

export function ItemList({ items, onToggle, onEdit, onDelete, onReorder }: ItemListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const ordered = arrayMove(items, oldIndex, newIndex).map((i) => i.id)
    onReorder(ordered)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul aria-live="polite" aria-label="Articoli della lista" className="flex flex-col gap-2">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 2.9: Create `ListDetailView.tsx`

**Files:**
- Create: `src/features/items/components/ListDetailView.tsx`

- [ ] **Step 1: Write the detail view**

```tsx
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useList } from '../../lists/hooks/useList'
import { useItems } from '../hooks/useItems'
import { useItemOperations } from '../hooks/useItemOperations'
import { ItemForm } from './ItemForm'
import { ItemList } from './ItemList'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Item } from '../../../types/domain'

export function ListDetailView() {
  const { id } = useParams<{ id: string }>()
  const list = useList(id)
  const items = useItems(id)
  const ops = useItemOperations(id)
  const [editTarget, setEditTarget] = useState<Item | null>(null)

  if (list === undefined || items === undefined) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (list === null) {
    return (
      <div className="text-neutral-500 italic">
        Lista non trovata. <Link to="/lists" className="text-brand-600 underline">Torna all'elenco</Link>
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <Link to="/lists" className="text-sm text-neutral-500 hover:text-brand-600">← Liste</Link>
          <h1 className="text-2xl font-bold text-neutral-900">{list.name}</h1>
          <p className="text-sm text-neutral-500">{items.length} articoli</p>
        </div>
      </header>

      <ItemForm
        mode="add"
        onSubmit={(data) => ops.createItem(data)}
        loading={ops.loading}
      />

      {items.length === 0 ? (
        <p className="text-neutral-500 italic">Nessun articolo. Aggiungine uno qui sopra.</p>
      ) : (
        <ItemList
          items={items}
          onToggle={ops.toggleItem}
          onEdit={(item) => setEditTarget(item)}
          onDelete={ops.softDeleteItem}
          onReorder={ops.reorderItems}
        />
      )}

      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica articolo</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <ItemForm
              mode="edit"
              initial={{
                name: editTarget.name,
                quantity: editTarget.quantity,
                unit: typeof editTarget.unit === 'string' ? editTarget.unit : null,
                notes: editTarget.notes,
                category: typeof editTarget.category === 'string' ? editTarget.category : null,
              }}
              onSubmit={async (data) => {
                await ops.updateItem(editTarget.id, data)
                setEditTarget(null)
              }}
              onCancel={() => setEditTarget(null)}
              loading={ops.loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 2.10: Wire `/lists/:id` into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace the Placeholder for `/lists/:id`**

Open `src/App.tsx`. Add the import:

```tsx
import { ListDetailView } from '@/features/items/components/ListDetailView'
```

Replace this line:

```tsx
<Route path="/lists/:id" element={<Placeholder label="Dettaglio lista — Phase 2" />} />
```

With:

```tsx
<Route path="/lists/:id" element={<ListDetailView />} />
```

- [ ] **Step 2: Run full suite**

Run: `npm test`

Expected: all tests green.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`

Open http://localhost:5173, create a list, click to navigate to `/lists/:id`, and verify:
- Add item form renders with 5 fields
- Invalid input blocks submit (try empty name, quantity 0)
- Adding item appears instantly in the list
- Checkbox toggles between DA_COMPRARE and COMPLETATO (strikethrough)
- Edit pencil opens dialog with filled form
- Delete trash icon removes item from list
- Drag handle reorders items (click and drag, or Tab to handle + Space + Arrow keys)
- Toast appears on each operation

Stop the dev server.

- [ ] **Step 4: USER COMMIT**

```bash
git add src/features/items/components src/App.tsx
git commit -m "feat(sprint1): items detail view with CRUD, toggle, drag-reorder"
```

---

## Task 2.11: Phase 2 checkpoint

- [ ] **Step 1: Lint + typecheck + test**

Run: `npm run lint && npx tsc --noEmit && npm test`

Expected: all green.

- [ ] **Step 2: Production build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 3: Phase 2 DoD check**

Verify:
- DoD #3, #4, #5 (items part): ✓ (tests)
- DoD #7 (`/lists/:id` full lifecycle): ✓ (manual)
- DoD #11, #12, #13: ✓ (manual)

Phase 2 done. Proceed to Phase 3.

---

# PHASE 3 — Trash slice + E2E

At the end of Phase 3, `/trash` shows soft-deleted items with restore, and the Playwright golden-path E2E passes under offline mode.

---

## Task 3.1: Create `useTrash.ts` and `useTrashOperations.ts`

**Files:**
- Create: `src/features/items/hooks/useTrash.ts`
- Create: `src/features/items/hooks/useTrashOperations.ts`

- [ ] **Step 1: Write `useTrash.ts`**

```ts
import { useLiveQuery } from 'dexie-react-hooks'
import { queryTrashedItems } from '../../../services/db/items'

export function useTrash() {
  return useLiveQuery(() => queryTrashedItems(), [])
}
```

- [ ] **Step 2: Write `useTrashOperations.ts`**

```ts
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { restoreItem as restoreRepo } from '../../../services/db/items'
import { db } from '../../../services/db/schema'
import { recordChange } from '../../../services/db/changeLog'
import { getCurrentUserId } from '../../../services/db/session'
import { ok, err, toAppError, type Result, type AppError } from '../../../utils/result'

async function purgeItem(id: string): Promise<Result<void, AppError>> {
  try {
    const userId = await getCurrentUserId()
    await db.transaction('rw', db.items, db.changes, async () => {
      const current = await db.items.get(id)
      if (!current) return
      await db.items.delete(id)
      await recordChange({
        entityType: 'ITEM',
        entityId: id,
        operationType: 'DELETE',
        userId,
        changes: { purged: { from: false, to: true } },
      })
    })
    return ok(undefined as void)
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export function useTrashOperations() {
  const [loading, setLoading] = useState(false)

  const run = useCallback(async <T,>(
    fn: () => Promise<Result<T, AppError>>,
    successMsg: string
  ) => {
    setLoading(true)
    try {
      const r = await fn()
      if (r.ok) toast.success(successMsg)
      else toast.error(r.error.message)
      return r
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    restoreItem: (id: string) => run(() => restoreRepo(id), 'Articolo ripristinato'),
    purgeItem: (id: string) => run(() => purgeItem(id), 'Articolo eliminato definitivamente'),
  }
}
```

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 3.2: Create `TrashView.tsx`

**Files:**
- Create: `src/features/items/components/TrashView.tsx`

- [ ] **Step 1: Write the view**

```tsx
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useTrash } from '../hooks/useTrash'
import { useTrashOperations } from '../hooks/useTrashOperations'
import { db } from '../../../services/db/schema'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import type { Item } from '../../../types/domain'

export function TrashView() {
  const items = useTrash()
  const ops = useTrashOperations()
  const lists = useLiveQuery(() => db.lists.toArray(), [])
  const [purgeTarget, setPurgeTarget] = useState<Item | null>(null)

  if (items === undefined || lists === undefined) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  const listNameById = new Map(lists.map((l) => [l.id, l.name] as const))

  if (items.length === 0) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-neutral-900">Cestino</h1>
        <p className="text-neutral-500 italic mt-4">Il cestino è vuoto.</p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">Cestino</h1>
        <p className="text-sm text-neutral-500">{items.length} articoli eliminati</p>
      </header>

      <ul className="flex flex-col gap-2" aria-live="polite">
        {items.map((item) => {
          const listName = listNameById.get(item.listId) ?? '(lista rimossa)'
          return (
            <li key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
              <div className="min-w-0 flex-1">
                <p className="truncate">{item.name}</p>
                <p className="text-xs text-neutral-500">{listName}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => ops.restoreItem(item.id)}
                  disabled={ops.loading}
                >
                  Ripristina
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setPurgeTarget(item)}
                  disabled={ops.loading}
                >
                  Elimina
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={purgeTarget !== null}
        onOpenChange={(open) => !open && setPurgeTarget(null)}
        title={purgeTarget ? `Eliminare "${purgeTarget.name}" definitivamente?` : ''}
        description="Questa operazione non è reversibile. Clicca due volte per confermare."
        confirmLabel="Elimina"
        onConfirm={async () => {
          if (purgeTarget) await ops.purgeItem(purgeTarget.id)
          setPurgeTarget(null)
        }}
      />
    </section>
  )
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

Expected: zero errors.

---

## Task 3.3: Wire `/trash` route

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace the `/trash` Placeholder**

Open `src/App.tsx`. Add the import:

```tsx
import { TrashView } from '@/features/items/components/TrashView'
```

Replace:

```tsx
<Route path="/trash" element={<Placeholder label="Cestino — Phase 3" />} />
```

With:

```tsx
<Route path="/trash" element={<TrashView />} />
```

Also remove the `Placeholder` helper function if no longer used anywhere — check if any `<Placeholder>` remains; if not, delete the function definition.

- [ ] **Step 2: Run full test suite**

Run: `npm test`

Expected: all green.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`

- Create a list, add 3 items, soft-delete 2 of them.
- Navigate to `/trash` → 2 items visible with list names.
- Click "Ripristina" on one → toast, item disappears from trash.
- Navigate back to the list → restored item is present.
- Click "Elimina" on remaining → dialog, double-click → item gone.
- Refresh page → state persists.

Stop the dev server.

- [ ] **Step 4: USER COMMIT**

```bash
git add src/features/items/hooks/useTrash.ts src/features/items/hooks/useTrashOperations.ts src/features/items/components/TrashView.tsx src/App.tsx
git commit -m "feat(sprint1): trash view with restore and purge"
```

---

## Task 3.4: Configure Playwright for production preview

**Files:**
- Create: `playwright.config.ts`

- [ ] **Step 1: Check if Playwright is already installed**

Run: `npx playwright --version`

Expected: a version is printed. If "command not found":

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

- [ ] **Step 3: Ensure `package.json` has `test:e2e` script**

Open `package.json`. Under `"scripts"`, confirm or add:

```json
"test:e2e": "playwright test"
```

- [ ] **Step 4: Smoke-run Playwright without a spec**

Run: `npx playwright test --list`

Expected: "no tests found in `./e2e`" or similar — that's fine, we're about to add one.

---

## Task 3.5: Write `offline-core.spec.ts` golden path

**Files:**
- Create: `e2e/offline-core.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { test, expect, type Page } from '@playwright/test'

async function waitForServiceWorker(page: Page) {
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false
    const reg = await navigator.serviceWorker.getRegistration()
    return reg?.active?.state === 'activated'
  }, { timeout: 20_000 })
}

test.describe('offline-core golden path', () => {
  test('create list, add items, toggle, soft-delete, restore — all offline', async ({ page, context }) => {
    const networkRequests: string[] = []
    page.on('request', (req) => {
      const url = req.url()
      // ignore localhost preview server and chrome-extension:// noise
      if (!url.startsWith('http://localhost:4173') && !url.startsWith('chrome-extension://')) {
        networkRequests.push(url)
      }
    })

    // Step 1: first load brings in the SW
    await page.goto('/')
    await waitForServiceWorker(page)

    // Step 2: go offline
    await context.setOffline(true)

    // Step 3: navigate to /lists
    await page.goto('/lists')
    await expect(page.getByRole('heading', { name: 'Le mie liste' })).toBeVisible()

    // Verify skip link exists
    await expect(page.getByRole('link', { name: 'Vai al contenuto' })).toBeAttached()

    // Step 4: create a list
    const listName = 'E2E Test ' + Date.now()
    await page.getByLabel('Nome lista').fill(listName)
    await page.getByRole('button', { name: 'Crea' }).click()
    await expect(page.getByRole('heading', { name: listName })).toBeVisible()

    // Step 5: enter list detail
    await page.getByRole('link', { name: new RegExp(listName) }).click()
    await expect(page.getByRole('heading', { name: listName })).toBeVisible()

    // Step 6: add 3 items
    for (const name of ['pane', 'latte', 'uova']) {
      await page.getByLabel('Nome', { exact: true }).fill(name)
      await page.getByRole('button', { name: 'Aggiungi' }).click()
      await expect(page.getByText(name, { exact: true })).toBeVisible()
    }

    // aria-live region present
    await expect(page.getByRole('list', { name: 'Articoli della lista' })).toBeVisible()

    // Step 7: toggle 'pane' to COMPLETATO
    await page.getByRole('checkbox', { name: /pane.*completato/i }).click()

    // Step 8: soft-delete 'latte'
    await page.getByRole('button', { name: 'Elimina latte' }).click()
    await expect(page.getByText('latte', { exact: true })).toHaveCount(0)

    // Step 9: navigate to /trash
    await page.getByRole('link', { name: 'Cestino' }).click()
    await expect(page.getByText('latte', { exact: true })).toBeVisible()

    // Step 10: restore 'latte'
    await page.getByRole('button', { name: 'Ripristina' }).first().click()
    await expect(page.getByText('latte', { exact: true })).toHaveCount(0)

    // Step 11: back to list, verify 'latte' is restored
    await page.getByRole('link', { name: 'Liste' }).click()
    await page.getByRole('link', { name: new RegExp(listName) }).click()
    await expect(page.getByText('latte', { exact: true })).toBeVisible()

    // Step 12: assert zero external network requests
    expect(networkRequests).toEqual([])
  })
})
```

- [ ] **Step 2: Run the E2E**

Run: `npm run test:e2e`

Expected: green. If "service worker never activated", the build may be missing `vite-plugin-pwa` PWA registration — check `vite.config.ts` has `VitePWA({ registerType: 'autoUpdate' })`.

If the spec fails on a specific selector, run:
```bash
npx playwright test --debug
```
This opens the inspector; step through and fix selector names to match actual rendered text.

- [ ] **Step 3: USER COMMIT**

```bash
git add playwright.config.ts e2e/offline-core.spec.ts package.json
git commit -m "test(sprint1): Playwright offline-core golden path E2E"
```

---

## Task 3.6: Phase 3 checkpoint — full DoD verification

- [ ] **Step 1: Lint**

Run: `npm run lint`

Expected: zero errors.

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`

Expected: zero errors.

- [ ] **Step 3: Full test suite**

Run: `npm test`

Expected: all green. Approximately 30–40 tests total.

- [ ] **Step 4: Production build**

Run: `npm run build`

Expected: build succeeds, `dist/` populated.

- [ ] **Step 5: E2E offline path**

Run: `npm run test:e2e -- offline-core`

Expected: green.

- [ ] **Step 6: Manual preview smoke**

Run: `npm run preview`

Open http://localhost:4173 in an incognito window. In DevTools → Application → Service Workers, confirm the SW is active. Check "Offline" and reload. Repeat the full user flow:
- Create list
- Add 3 items with quantities/notes/categories
- Toggle one
- Drag-reorder (click + drag, AND Tab + Space + Arrow keys)
- Soft-delete one
- Navigate to trash
- Restore
- Hard-delete a list via the dashboard dropdown (dialog + double-click)
- Archive a list, verify it moves to "Mostra archiviate"
- Unarchive

Stop the preview server.

- [ ] **Step 7: Full DoD checklist**

Verify every DoD criterion from spec §3:

| # | Criterion | Status |
|---|---|---|
| 1 | Dexie v2 migration idempotent | Task 0.12 passed |
| 2 | Guest session persists | Task 0.9 passed |
| 3 | Repos + changeLog tests | Tasks 1.2, 2.2 passed |
| 4 | Zod validation tests | Tasks 1.4, 2.3 passed |
| 5 | Hook tests (RTL + fake-indexeddb) | Tasks 1.7, 2.5 passed |
| 6 | `/lists` reactive | Manual smoke in Task 1.14 |
| 7 | `/lists/:id` full lifecycle | Manual smoke in Task 2.10 |
| 8 | `/trash` with restore | Manual smoke in Task 3.3 |
| 9 | E2E offline golden path | Task 3.5 passed |
| 10 | Build + preview production | Step 4 + Step 6 |
| 11 | shadcn/ui rendered | Steps 6 manual |
| 12 | Toasts firing | Steps 6 manual |
| 13 | RHF + Zod block invalid submit | Steps 6 manual |

All 13 must be green to close the sprint.

- [ ] **Step 8: Final USER COMMIT**

```bash
git add -A
git commit -m "chore(sprint1): sprint 1 complete — all DoD criteria green"
```

Sprint 1 is done.

---

## Post-sprint notes

- **Scope freeze**: all the Sprint 2/3/4 items listed in spec §1 "fuori scope" and §13 "scope freeze" remain out of scope. Any PR that adds them should be bounced and rewritten as Sprint 2+.
- **Known technical debt**:
  - Reorder writes N changeLog rows per drag instead of using midpoint insertion. Optimize in Sprint 3 if real lists exceed ~50 items.
  - `TrashView` doesn't show category/quantity of deleted items, only the name and source list. Add in Sprint 3 polish pass.
  - `ArchivedListsSection` rename handler is a no-op (archived lists can only be unarchived or deleted). Document or wire up in Sprint 2.
- **Canonical doc updates from Task 0.13** should propagate to any future sprint plans — check them before drafting Sprint 2.
