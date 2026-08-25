# Sprint 1: Core Offline (Liste e Articoli) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

## 🔄 Progress Summary (updated 2026-04-14 — RESUME POINT)

**Execution started** on 2026-04-14 using `superpowers:subagent-driven-development`.
The plan below is **unchanged**. Use this summary to locate the resume point when continuing in a new conversation.

### ✅ Completed phases (already implemented)

| Phase | Tasks | Files produced | Tests | Notes |
|-------|-------|---------------|-------|-------|
| **Phase 0 — Setup** | 0.1 | `package.json` (+`@radix-ui/react-dialog@^1.1.15`, confirmed `dexie-react-hooks@^1.1.7`) | — | No new source files |
| **Phase 1 — Utilities** | 1.1–1.4 | `src/utils/id-utils.ts`, `src/utils/validation.ts` (+ `.test.ts`), `src/utils/diff.ts` (+ `.test.ts`), `src/services/_internal/domain-error.ts`, `src/services/_internal/map-db-error.ts` | 15 new | `diff.ts` includes union-key fix from review; `validation.ts` has **extra `validateItemPatch` export** added during Phase 3 code review |
| **Phase 2 — Repositories** | 2.1–2.3 | `src/repositories/change-log-repository.ts`, `src/repositories/list-repository.ts` (+ `.test.ts`), `src/repositories/item-repository.ts` (+ `.test.ts`) | 10 new | Small private helpers `listsTable(tx)` / `itemsTable(tx)` / `changeLogTable(tx)` used to normalize `tx?.table<T>('x')` vs `db.x` — contract unchanged |
| **Phase 3 — Services** | 3.1–3.9 | `src/services/list-service.ts` (+ `.test.ts`), `src/services/item-service.ts` (+ `.test.ts`) | 37 new | 100% coverage listService + itemService. `updateItem` refactored to use `validateItemPatch` (bug fix). `deleteItem` updates `updatedBy` (bug fix). `restoreItem` explicitly resets `completedAt` (bug fix + comment) |

**Total tests green:** 64 (was 2 in Sprint 0)
**Quality gates:** `npm run typecheck` ✅ | `npm run lint` ✅ | `npm run test` ✅

### ⚠️ Deviations from the verbatim plan (accepted, documented)

1. **`validation.ts` gained `validateItemPatch`** — extracted per-field validators (`validateItemName`, `validateItemQuantity`, `validateItemNotes`) and added a public `validateItemPatch` used by `updateItem`. The plan's verbatim approach (run full `validateItemInput` gated by `changes.name !== undefined`) silently skipped quantity/notes validation on nameless patches — real bug caught by review.
2. **Repositories use private `<table>Table(tx)` helpers** — the plan's inline `(tx ?? db).table<T>('name').add(...)` doesn't compile under strict TS because the union `Dexie.Table<T>|Transaction.Table<T>` is non-callable. Private helpers in each repo file return `Table<T, string>` cleanly. Same semantics.
3. **Test accessors use optional chaining** — `noUncheckedIndexedAccess` requires `log[0]?.field` instead of `log[0].field`. Mechanical substitution throughout test files.
4. **`item-service.ts` at ~290 LOC** — above 200 target, below 400 max. Phase 9 may refactor by extracting a shared `buildItemLogEntry(...)` factory.
5. **`diff.ts` iterates union of both key sets** — plan iterated only `Object.keys(after)`, silently missing keys present only in `before`. Fix applied with new test.

### 🔴 Pending phases (resume from here)

- **Phase 4 — Hooks** (Tasks 4.1, 4.2, 4.3): `use-lists.ts`, `use-items.ts`, `use-deleted-items.ts` + tests. **START HERE.**
- **Phase 5 — UI common** (Tasks 5.1–5.4): rewrite `ui-store.ts` with toast queue; `button.tsx`, `input.tsx`, `badge.tsx`, `modal.tsx`, `confirm-dialog.tsx`, `toast-container.tsx`, `empty-state.tsx`, `loading-spinner.tsx`, `error-message.tsx`.
- **Phase 6 — UI lists** (Tasks 6.1–6.4): `list-card.tsx`, `list-form.tsx`, `archived-section.tsx`, rewrite `home-page.tsx`.
- **Phase 7 — UI items + pages** (Tasks 7.1–7.6): `item-row.tsx`, `item-form.tsx`, `item-quick-add-bar.tsx`, `item-trash-row.tsx`, `list-page.tsx`, `trash-page.tsx`.
- **Phase 8 — Wire & Verify** (Tasks 8.1–8.4): update routing in `app.tsx`, **manual offline smoke test (user-driven)**, update `docs/mappa-progetto.md`, update `docs/piano-sviluppo.md`.
- **Phase 9 — Final verification** (Task 9.1): full quality gates including coverage and bundle size.

### 🧭 How to resume

1. Open a fresh Claude Code session in the project root.
2. Confirm state: `npm run test -- --run` → expect **64 tests green**.
3. Re-read `CLAUDE.md` (state section) + this Progress Summary.
4. Continue with **Phase 4 / Task 4.1** using `superpowers:subagent-driven-development`.
5. User preferences carried over: **no git commands by Claude** (user commits), **max parallelization where plan allows** (but no parallel implementers — skill rule), **commit points reported per phase**, **manual offline smoke test executed by user in Phase 8.2**.

---

**Goal:** Implementare CRUD completo offline-first di liste della spesa e articoli, con change tracking transazionale, sopra lo skeleton Sprint 0, senza autenticazione né sync.

**Architecture:** Layer cake `UI → Hooks (useLiveQuery) → Services (db.transaction) → Repositories (CRUD puro Dexie) → Dexie/IndexedDB`. Errori propagati come `AppResult<T>`. Cambiamenti registrati nel `changeLog` dentro la stessa transazione che muta l'entità. Cestino per-lista con soft delete cascade.

**Tech Stack:** React 18 + TypeScript strict + Vite + Dexie.js 4 + dexie-react-hooks + Zustand + Tailwind CSS 3 + `@radix-ui/react-dialog` (NUOVO) + Vitest + @testing-library/react + fake-indexeddb.

**Spec di riferimento:** [`docs/superpowers/specs/2026-04-14-sprint-1-core-offline-design.md`](../specs/2026-04-14-sprint-1-core-offline-design.md)

**Brainstorm summary:** [`docs/superpowers/brainstorms/2026-04-14-sprint-1-core-offline-brainstorm.md`](../brainstorms/2026-04-14-sprint-1-core-offline-brainstorm.md)

---

## Convenzioni del plan

- **File naming:** kebab-case obbligatorio (`home-page.tsx`, non `HomePage.tsx`)
- **Import:** sempre via path alias `@/foo`, mai relativi `../`
- **Test co-locati:** `foo.ts` + `foo.test.ts` nella stessa directory
- **Limiti LOC:** file < 200 (warning a 150), funzione < 20, componente < 200
- **Strict TS:** mai `any`, mai suppressioni
- **Self-check checklist** (CLAUDE.md "Standard di Codice") prima di ogni commit

---

## Phase 0 — Setup ambiente

### Task 0.1: Installazione dipendenze e creazione directory layer

**Files:**
- Modify: `package.json` (aggiunta `@radix-ui/react-dialog`, `dexie-react-hooks`)

- [ ] **Step 1: Verifica stato corrente del repo**

```bash
git status
npm run typecheck
npm run lint
npm run test
```

Expected: working tree clean, tutti i comandi passano (skeleton Sprint 0).

- [ ] **Step 2: Installa `@radix-ui/react-dialog`**

```bash
npm install @radix-ui/react-dialog@^1
```

Expected: aggiunta a `dependencies` in `package.json`.

- [ ] **Step 3: Verifica che `dexie-react-hooks` sia già presente**

```bash
npm list dexie-react-hooks
```

Expected: `dexie-react-hooks@<version>`. Se NON presente, installalo:

```bash
npm install dexie-react-hooks
```

- [ ] **Step 4: Verifica typecheck dopo install**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @radix-ui/react-dialog and dexie-react-hooks for Sprint 1"
```

---

## Phase 1 — Utilities di fondazione

### Task 1.1: `id-utils.ts` — generatore UUID locale

**Files:**
- Create: `src/utils/id-utils.ts`

- [ ] **Step 1: Crea il file**

```typescript
// src/utils/id-utils.ts
// Generatore UUID locale offline-safe per entità Dexie.

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback per ambienti senza crypto.randomUUID (vecchi browser, jsdom alcuni casi)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16)
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
```

- [ ] **Step 2: Verifica typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/utils/id-utils.ts
git commit -m "feat(utils): add generateId for offline-safe UUIDs"
```

---

### Task 1.2: `validation.ts` con TDD (S1-02 parziale, S1-09 parziale)

**Files:**
- Create: `src/utils/validation.test.ts`
- Create: `src/utils/validation.ts`

- [ ] **Step 1: Scrivi i test FAILING per `validateListName`**

```typescript
// src/utils/validation.test.ts
import { describe, it, expect } from 'vitest'
import { validateListName, validateItemInput, LIMITS } from '@/utils/validation'

describe('validateListName', () => {
  it('ritorna null per nome valido', () => {
    expect(validateListName('Spesa settimanale')).toBe(null)
  })

  it('ritorna VALIDATION_ERROR per stringa vuota', () => {
    const err = validateListName('')
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'name' })
  })

  it('ritorna VALIDATION_ERROR per solo whitespace', () => {
    const err = validateListName('   ')
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'name' })
  })

  it(`ritorna VALIDATION_ERROR per nome oltre ${LIMITS?.LIST_NAME_MAX ?? 100} caratteri`, () => {
    const err = validateListName('a'.repeat(101))
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'name' })
  })
})

describe('validateItemInput', () => {
  it('ritorna null per input minimo valido', () => {
    expect(validateItemInput({ name: 'Latte' })).toBe(null)
  })

  it('ritorna null per input completo valido', () => {
    expect(validateItemInput({ name: 'Latte', quantity: 2, notes: 'intero' })).toBe(null)
  })

  it('ritorna VALIDATION_ERROR per nome vuoto', () => {
    const err = validateItemInput({ name: '   ' })
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'name' })
  })

  it('ritorna VALIDATION_ERROR per nome oltre 100 caratteri', () => {
    const err = validateItemInput({ name: 'a'.repeat(101) })
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'name' })
  })

  it('ritorna VALIDATION_ERROR per quantity negativa', () => {
    const err = validateItemInput({ name: 'Latte', quantity: -1 })
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'quantity' })
  })

  it('ritorna VALIDATION_ERROR per quantity oltre max', () => {
    const err = validateItemInput({ name: 'Latte', quantity: 10000 })
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'quantity' })
  })

  it('ritorna VALIDATION_ERROR per notes oltre 500 caratteri', () => {
    const err = validateItemInput({ name: 'Latte', notes: 'a'.repeat(501) })
    expect(err?.code).toBe('VALIDATION_ERROR')
    expect(err?.details).toEqual({ field: 'notes' })
  })
})
```

- [ ] **Step 2: Esegui i test e verifica che falliscano**

```bash
npm run test -- src/utils/validation.test.ts
```

Expected: FAIL — modulo `@/utils/validation` non esiste.

- [ ] **Step 3: Implementa `validation.ts`**

```typescript
// src/utils/validation.ts
import type { AppError } from '@/types/ui'

export const LIMITS = {
  LIST_NAME_MAX: 100,
  ITEM_NAME_MAX: 100,
  ITEM_NOTES_MAX: 500,
  ITEM_QUANTITY_MIN: 0,
  ITEM_QUANTITY_MAX: 9999,
} as const

export function validateListName(name: string): AppError | null {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Il nome della lista non può essere vuoto',
      details: { field: 'name' },
    }
  }
  if (trimmed.length > LIMITS.LIST_NAME_MAX) {
    return {
      code: 'VALIDATION_ERROR',
      message: `Il nome non può superare ${LIMITS.LIST_NAME_MAX} caratteri`,
      details: { field: 'name' },
    }
  }
  return null
}

export type ValidateItemInput = {
  name: string
  quantity?: number | null
  notes?: string | null
}

export function validateItemInput(input: ValidateItemInput): AppError | null {
  const name = input.name.trim()
  if (name.length === 0) {
    return {
      code: 'VALIDATION_ERROR',
      message: "Il nome dell'articolo non può essere vuoto",
      details: { field: 'name' },
    }
  }
  if (name.length > LIMITS.ITEM_NAME_MAX) {
    return {
      code: 'VALIDATION_ERROR',
      message: `Il nome non può superare ${LIMITS.ITEM_NAME_MAX} caratteri`,
      details: { field: 'name' },
    }
  }
  if (input.quantity != null) {
    if (input.quantity < LIMITS.ITEM_QUANTITY_MIN || input.quantity > LIMITS.ITEM_QUANTITY_MAX) {
      return {
        code: 'VALIDATION_ERROR',
        message: `La quantità deve essere tra ${LIMITS.ITEM_QUANTITY_MIN} e ${LIMITS.ITEM_QUANTITY_MAX}`,
        details: { field: 'quantity' },
      }
    }
  }
  if (input.notes != null && input.notes.length > LIMITS.ITEM_NOTES_MAX) {
    return {
      code: 'VALIDATION_ERROR',
      message: `Le note non possono superare ${LIMITS.ITEM_NOTES_MAX} caratteri`,
      details: { field: 'notes' },
    }
  }
  return null
}
```

- [ ] **Step 4: Esegui i test e verifica che passino**

```bash
npm run test -- src/utils/validation.test.ts
```

Expected: PASS — tutti i test verdi (~12 test).

- [ ] **Step 5: Verifica typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/utils/validation.ts src/utils/validation.test.ts
git commit -m "feat(utils): add validation for list and item input with tests"
```

---

### Task 1.3: `diff.ts` con TDD (S1-16 parziale)

**Files:**
- Create: `src/utils/diff.test.ts`
- Create: `src/utils/diff.ts`

- [ ] **Step 1: Scrivi i test FAILING**

```typescript
// src/utils/diff.test.ts
import { describe, it, expect } from 'vitest'
import { buildDiff } from '@/utils/diff'

describe('buildDiff', () => {
  it('ritorna entrambi vuoti se before e after sono identici', () => {
    const before = { a: 1, b: 'hello', c: null }
    const after = { a: 1, b: 'hello', c: null }
    const diff = buildDiff(before, after)
    expect(diff.before).toEqual({})
    expect(diff.after).toEqual({})
  })

  it('include solo i campi cambiati nel diff parziale', () => {
    const before = { name: 'Latte', quantity: 1, unit: 'l' }
    const after = { name: 'Latte intero', quantity: 2, unit: 'l' }
    const diff = buildDiff(before, after)
    expect(diff.before).toEqual({ name: 'Latte', quantity: 1 })
    expect(diff.after).toEqual({ name: 'Latte intero', quantity: 2 })
  })

  it('rispetta ignoreFields escludendo i campi specificati', () => {
    const before = { id: 'abc', name: 'Old', createdAt: 100 }
    const after = { id: 'abc', name: 'New', createdAt: 100 }
    const diff = buildDiff(before, after, ['id', 'createdAt'])
    expect(diff.before).toEqual({ name: 'Old' })
    expect(diff.after).toEqual({ name: 'New' })
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/utils/diff.test.ts
```

Expected: FAIL — modulo non esiste.

- [ ] **Step 3: Implementa `diff.ts`**

```typescript
// src/utils/diff.ts
// Calcola un diff minimale shallow tra due oggetti.
// Usato dal layer service per popolare ChangeLogEntry.changes su UPDATE.

export function buildDiff<T extends object>(
  before: T,
  after: T,
  ignoreFields: (keyof T)[] = [],
): { before: Partial<T>; after: Partial<T> } {
  const diffBefore: Partial<T> = {}
  const diffAfter: Partial<T> = {}
  for (const key of Object.keys(after) as (keyof T)[]) {
    if (ignoreFields.includes(key)) continue
    if (before[key] !== after[key]) {
      diffBefore[key] = before[key]
      diffAfter[key] = after[key]
    }
  }
  return { before: diffBefore, after: diffAfter }
}
```

- [ ] **Step 4: Esegui e verifica passaggio**

```bash
npm run test -- src/utils/diff.test.ts
```

Expected: PASS — 3 test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/utils/diff.ts src/utils/diff.test.ts
git commit -m "feat(utils): add buildDiff for changeLog UPDATE entries"
```

---

### Task 1.4: `_internal/domain-error.ts` e `_internal/map-db-error.ts`

**Files:**
- Create: `src/services/_internal/domain-error.ts`
- Create: `src/services/_internal/map-db-error.ts`

- [ ] **Step 1: Crea `domain-error.ts`**

```typescript
// src/services/_internal/domain-error.ts
// Classe interna al layer service per triggerare il rollback di Dexie tramite throw.
// NON esportare fuori dal layer services.

export class DomainError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'VALIDATION_ERROR',
    message: string,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}
```

- [ ] **Step 2: Crea `map-db-error.ts`**

```typescript
// src/services/_internal/map-db-error.ts
// Converte qualunque errore lanciato dentro db.transaction() in AppError.

import type { AppError } from '@/types/ui'
import { DomainError } from './domain-error'

export function mapDbError(e: unknown): AppError {
  if (e instanceof DomainError) {
    return {
      code: e.code === 'NOT_FOUND' ? 'NOT_FOUND' : 'VALIDATION_ERROR',
      message: e.message,
    }
  }
  if (e instanceof Error && e.name === 'QuotaExceededError') {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Memoria insufficiente nel dispositivo',
      details: { dexieName: e.name },
    }
  }
  if (e instanceof Error && e.name === 'ConstraintError') {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Errore di integrità dei dati',
      details: { dexieName: e.name },
    }
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: 'Operazione fallita. Riprova.',
    details: { raw: e instanceof Error ? e.message : String(e) },
  }
}
```

- [ ] **Step 3: Verifica typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/services/_internal/
git commit -m "feat(services): add DomainError and mapDbError internal helpers"
```

---

## Phase 2 — Repositories

### Task 2.1: `change-log-repository.ts` (S1-16)

**Files:**
- Create: `src/repositories/change-log-repository.ts`

- [ ] **Step 1: Crea il file**

```typescript
// src/repositories/change-log-repository.ts
// Thin wrapper su Dexie per la tabella changeLog.
// Sprint 1 espone solo append e appendMany.
// Sprint 3 aggiungerà listPending, markSynced, ecc.

import { db } from '@/db/database'
import type { ChangeLogEntry } from '@/db/types'
import type { Transaction } from 'dexie'

export const changeLogRepository = {
  async append(entry: ChangeLogEntry, tx?: Transaction): Promise<void> {
    await (tx ?? db).table<ChangeLogEntry>('changeLog').add(entry)
  },

  async appendMany(entries: ChangeLogEntry[], tx?: Transaction): Promise<void> {
    await (tx ?? db).table<ChangeLogEntry>('changeLog').bulkAdd(entries)
  },
}
```

- [ ] **Step 2: Verifica typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/repositories/change-log-repository.ts
git commit -m "feat(repos): add changeLogRepository (append, appendMany)"
```

---

### Task 2.2: `list-repository.ts` con smoke test (S1-01 + S1-01b)

**Files:**
- Create: `src/repositories/list-repository.test.ts`
- Create: `src/repositories/list-repository.ts`

- [ ] **Step 1: Scrivi i test FAILING**

```typescript
// src/repositories/list-repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/database'
import { listRepository } from '@/repositories/list-repository'
import type { List } from '@/db/types'

function buildMockList(overrides: Partial<List> = {}): List {
  const now = Date.now()
  return {
    id: 'list-test-1',
    name: 'Test List',
    userId: 'local-user-stub',
    status: 'active',
    isTemplate: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    sharedWith: [],
    itemOrder: [],
    syncedAt: null,
    ...overrides,
  }
}

describe('listRepository', () => {
  beforeEach(async () => {
    await db.lists.clear()
  })

  it('create → getById preserva tutti i campi', async () => {
    const list = buildMockList({ name: 'Spesa' })
    await listRepository.create(list)
    const got = await listRepository.getById(list.id)
    expect(got).toEqual(list)
  })

  it('listByUser filtra deletedAt !== null', async () => {
    await listRepository.create(buildMockList({ id: 'l1', name: 'Active' }))
    await listRepository.create(buildMockList({ id: 'l2', name: 'Deleted', deletedAt: Date.now() }))
    const result = await listRepository.listByUser('local-user-stub')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('l1')
  })

  it('listByUser filtra status !== active', async () => {
    await listRepository.create(buildMockList({ id: 'l1', name: 'Active', status: 'active' }))
    await listRepository.create(buildMockList({ id: 'l2', name: 'Archived', status: 'archived' }))
    const result = await listRepository.listByUser('local-user-stub')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('l1')
  })

  it('update modifica solo i campi passati', async () => {
    const list = buildMockList({ name: 'Old', status: 'active' })
    await listRepository.create(list)
    await listRepository.update(list.id, { name: 'New' })
    const got = await listRepository.getById(list.id)
    expect(got?.name).toBe('New')
    expect(got?.status).toBe('active')
  })

  it('listByUser ordina per updatedAt desc', async () => {
    await listRepository.create(buildMockList({ id: 'l1', name: 'Older', updatedAt: 100 }))
    await listRepository.create(buildMockList({ id: 'l2', name: 'Newer', updatedAt: 200 }))
    const result = await listRepository.listByUser('local-user-stub')
    expect(result.map(l => l.id)).toEqual(['l2', 'l1'])
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/repositories/list-repository.test.ts
```

Expected: FAIL — modulo non esiste.

- [ ] **Step 3: Implementa `list-repository.ts`**

```typescript
// src/repositories/list-repository.ts
// Thin wrapper su Dexie per la tabella lists.
// REGOLE: no business logic, no validazione, no changeLog.
// I service decidono quando filtrare deletedAt; le read reattive di pagina filtrano "automaticamente".

import { db } from '@/db/database'
import type { List } from '@/db/types'
import type { Transaction } from 'dexie'

export const listRepository = {
  async create(list: List, tx?: Transaction): Promise<void> {
    await (tx ?? db).table<List>('lists').add(list)
  },

  async getById(id: string, tx?: Transaction): Promise<List | undefined> {
    return (tx ?? db).table<List>('lists').get(id)
  },

  async update(id: string, changes: Partial<List>, tx?: Transaction): Promise<number> {
    return (tx ?? db).table<List>('lists').update(id, changes)
  },

  /** Read reattiva: liste attive non cancellate, ordinate per updatedAt desc */
  async listByUser(userId: string): Promise<List[]> {
    const items = await db.lists
      .where('userId').equals(userId)
      .and(l => l.deletedAt === null && l.status === 'active')
      .toArray()
    return items.sort((a, b) => b.updatedAt - a.updatedAt)
  },

  /** Read reattiva: liste archiviate non cancellate, ordinate per updatedAt desc */
  async listArchivedByUser(userId: string): Promise<List[]> {
    const items = await db.lists
      .where('userId').equals(userId)
      .and(l => l.deletedAt === null && l.status === 'archived')
      .toArray()
    return items.sort((a, b) => b.updatedAt - a.updatedAt)
  },
}
```

- [ ] **Step 4: Esegui test e verifica passaggio**

```bash
npm run test -- src/repositories/list-repository.test.ts
```

Expected: PASS — 5 test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/repositories/list-repository.ts src/repositories/list-repository.test.ts
git commit -m "feat(repos): add listRepository with smoke tests"
```

---

### Task 2.3: `item-repository.ts` con smoke test (S1-08 + S1-08b)

**Files:**
- Create: `src/repositories/item-repository.test.ts`
- Create: `src/repositories/item-repository.ts`

- [ ] **Step 1: Scrivi i test FAILING**

```typescript
// src/repositories/item-repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/database'
import { itemRepository } from '@/repositories/item-repository'
import type { Item } from '@/db/types'

function buildMockItem(overrides: Partial<Item> = {}): Item {
  const now = Date.now()
  return {
    id: 'item-test-1',
    listId: 'list-1',
    name: 'Latte',
    quantity: null,
    unit: null,
    notes: null,
    category: null,
    status: 'pending',
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    deletedAt: null,
    createdBy: 'local-user-stub',
    updatedBy: 'local-user-stub',
    ...overrides,
  }
}

describe('itemRepository', () => {
  beforeEach(async () => {
    await db.items.clear()
  })

  it('create → getById preserva tutti i campi', async () => {
    const item = buildMockItem({ name: 'Pane' })
    await itemRepository.create(item)
    const got = await itemRepository.getById(item.id)
    expect(got).toEqual(item)
  })

  it('listActiveByList ordina per sortOrder asc', async () => {
    await itemRepository.create(buildMockItem({ id: 'i1', sortOrder: 3 }))
    await itemRepository.create(buildMockItem({ id: 'i2', sortOrder: 1 }))
    await itemRepository.create(buildMockItem({ id: 'i3', sortOrder: 2 }))
    const result = await itemRepository.listActiveByList('list-1')
    expect(result.map(i => i.id)).toEqual(['i2', 'i3', 'i1'])
  })

  it('listActiveByList filtra deletedAt !== null', async () => {
    await itemRepository.create(buildMockItem({ id: 'i1' }))
    await itemRepository.create(buildMockItem({ id: 'i2', deletedAt: Date.now() }))
    const result = await itemRepository.listActiveByList('list-1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('i1')
  })

  it('getMaxSortOrder su lista vuota ritorna 0', async () => {
    const max = await itemRepository.getMaxSortOrder('list-empty')
    expect(max).toBe(0)
  })

  it('listActiveInList materializza array dentro transazione esplicita', async () => {
    await itemRepository.create(buildMockItem({ id: 'i1', sortOrder: 1 }))
    await itemRepository.create(buildMockItem({ id: 'i2', sortOrder: 2, deletedAt: Date.now() }))
    const result = await db.transaction('r', db.items, async (tx) => {
      return itemRepository.listActiveInList('list-1', tx)
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('i1')
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/repositories/item-repository.test.ts
```

Expected: FAIL — modulo non esiste.

- [ ] **Step 3: Implementa `item-repository.ts`**

```typescript
// src/repositories/item-repository.ts
// Thin wrapper su Dexie per la tabella items.
// REGOLE: no business logic, no validazione, no changeLog.

import { db } from '@/db/database'
import type { Item } from '@/db/types'
import type { Transaction } from 'dexie'

export const itemRepository = {
  async create(item: Item, tx?: Transaction): Promise<void> {
    await (tx ?? db).table<Item>('items').add(item)
  },

  async getById(id: string, tx?: Transaction): Promise<Item | undefined> {
    return (tx ?? db).table<Item>('items').get(id)
  },

  async update(id: string, changes: Partial<Item>, tx?: Transaction): Promise<number> {
    return (tx ?? db).table<Item>('items').update(id, changes)
  },

  /** Read reattiva: articoli attivi della lista, ordinati per sortOrder asc */
  async listActiveByList(listId: string): Promise<Item[]> {
    return db.items
      .where('listId').equals(listId)
      .and(i => i.deletedAt === null)
      .sortBy('sortOrder')
  },

  /** Read reattiva: articoli cancellati (cestino), ordinati per deletedAt desc */
  async listDeletedByList(listId: string): Promise<Item[]> {
    const items = await db.items
      .where('listId').equals(listId)
      .and(i => i.deletedAt !== null)
      .toArray()
    return items.sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
  },

  /** Usato dentro transazione per calcolare il prossimo sortOrder */
  async getMaxSortOrder(listId: string, tx?: Transaction): Promise<number> {
    const all = await (tx ?? db).table<Item>('items')
      .where('listId').equals(listId)
      .toArray()
    if (all.length === 0) return 0
    return Math.max(...all.map(i => i.sortOrder))
  },

  /** Usato dal cascade delete: snapshot pre-delete per i `before` del changeLog */
  async listActiveInList(listId: string, tx?: Transaction): Promise<Item[]> {
    return (tx ?? db).table<Item>('items')
      .where('listId').equals(listId)
      .and(i => i.deletedAt === null)
      .toArray()
  },
}
```

- [ ] **Step 4: Esegui test**

```bash
npm run test -- src/repositories/item-repository.test.ts
```

Expected: PASS — 5 test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/repositories/item-repository.ts src/repositories/item-repository.test.ts
git commit -m "feat(repos): add itemRepository with smoke tests"
```

---

## Phase 3 — Services

> **Pattern comune di tutti i service di Phase 3:** ogni metodo mutante apre `db.transaction('rw', <tabelle>, db.changeLog, async (tx) => {...})`, valida fail-fast prima della transazione, lancia `DomainError` dentro per triggerare rollback, ritorna `AppResult<T>` con `mapDbError(e)` nel catch esterno.
>
> **TDD discipline:** ogni metodo è una task con (1) test happy path, (2) test validation error, (3) test not-found (se applicabile), (4) test edge case. Tutti i test verificano esplicitamente atomicità (`db.<table>.count() === 0` dopo errore).

### Task 3.1: `listService.createList` con TDD (S1-02 parziale, S1-18 parziale)

**Files:**
- Create: `src/services/list-service.test.ts`
- Create: `src/services/list-service.ts`

- [ ] **Step 1: Scrivi i test FAILING per createList**

```typescript
// src/services/list-service.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/database'
import { listService } from '@/services/list-service'

describe('listService.createList', () => {
  beforeEach(async () => {
    await db.lists.clear()
    await db.items.clear()
    await db.changeLog.clear()
  })

  it('happy path: crea lista e changeLog entry atomicamente', async () => {
    const result = await listService.createList({ name: 'Spesa settimanale' })
    expect(result.error).toBe(null)
    expect(result.data).not.toBe(null)
    expect(result.data!.name).toBe('Spesa settimanale')
    expect(result.data!.status).toBe('active')
    expect(result.data!.deletedAt).toBe(null)
    expect(result.data!.itemOrder).toEqual([])

    const listsInDb = await db.lists.toArray()
    expect(listsInDb).toHaveLength(1)
    expect(listsInDb[0].id).toBe(result.data!.id)

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0].operationType).toBe('CREATE')
    expect(log[0].entityType).toBe('LIST')
    expect(log[0].changes.before).toBe(null)
    expect(log[0].changes.after).toMatchObject({ name: 'Spesa settimanale' })
    expect(log[0].synced).toBe(false)
  })

  it('rifiuta nome vuoto con VALIDATION_ERROR e nessuna write', async () => {
    const result = await listService.createList({ name: '   ' })
    expect(result.data).toBe(null)
    expect(result.error?.code).toBe('VALIDATION_ERROR')
    expect(result.error?.details).toMatchObject({ field: 'name' })

    expect(await db.lists.count()).toBe(0)
    expect(await db.changeLog.count()).toBe(0)
  })

  it('rifiuta nome oltre 100 caratteri con VALIDATION_ERROR', async () => {
    const result = await listService.createList({ name: 'a'.repeat(101) })
    expect(result.error?.code).toBe('VALIDATION_ERROR')
    expect(await db.lists.count()).toBe(0)
  })

  it('trimma spazi iniziali/finali prima del salvataggio', async () => {
    const result = await listService.createList({ name: '  Latte  ' })
    expect(result.data?.name).toBe('Latte')
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/services/list-service.test.ts
```

Expected: FAIL — modulo non esiste.

- [ ] **Step 3: Implementa `list-service.ts` con `createList`**

```typescript
// src/services/list-service.ts
import { db } from '@/db/database'
import type { List, ChangeLogEntry } from '@/db/types'
import type { AppResult } from '@/types/ui'
import { listRepository } from '@/repositories/list-repository'
import { changeLogRepository } from '@/repositories/change-log-repository'
import { validateListName } from '@/utils/validation'
import { generateId } from '@/utils/id-utils'
import { getCurrentUserId } from '@/stores/auth-store'
import { mapDbError } from './_internal/map-db-error'

async function createList(input: { name: string }): Promise<AppResult<List>> {
  const validationError = validateListName(input.name)
  if (validationError) return { data: null, error: validationError }

  const userId = getCurrentUserId()
  const now = Date.now()
  const id = generateId()
  const trimmed = input.name.trim()

  const newList: List = {
    id,
    name: trimmed,
    userId,
    status: 'active',
    isTemplate: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    sharedWith: [],
    itemOrder: [],
    syncedAt: null,
  }

  try {
    await db.transaction('rw', db.lists, db.changeLog, async (tx) => {
      await listRepository.create(newList, tx)
      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'CREATE',
        entityType: 'LIST',
        entityId: id,
        changes: { before: null, after: newList },
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)
    })
    return { data: newList, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

export const listService = {
  createList,
}
```

- [ ] **Step 4: Esegui test**

```bash
npm run test -- src/services/list-service.test.ts
```

Expected: PASS — 4 test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/services/list-service.ts src/services/list-service.test.ts
git commit -m "feat(services): add listService.createList with TDD"
```

---

### Task 3.2: `listService.updateList` con TDD

**Files:**
- Modify: `src/services/list-service.test.ts` (aggiungi describe block)
- Modify: `src/services/list-service.ts` (aggiungi metodo)

- [ ] **Step 1: Aggiungi i test FAILING per updateList**

Append al file `src/services/list-service.test.ts`:

```typescript
describe('listService.updateList', () => {
  beforeEach(async () => {
    await db.lists.clear()
    await db.changeLog.clear()
  })

  it('happy path: aggiorna nome e produce UPDATE log con diff parziale', async () => {
    const created = await listService.createList({ name: 'Old name' })
    await db.changeLog.clear()

    const result = await listService.updateList(created.data!.id, { name: 'New name' })
    expect(result.error).toBe(null)
    expect(result.data?.name).toBe('New name')

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0].operationType).toBe('UPDATE')
    expect(log[0].entityType).toBe('LIST')
    expect(log[0].changes.before).toMatchObject({ name: 'Old name' })
    expect(log[0].changes.after).toMatchObject({ name: 'New name' })
  })

  it('rifiuta nome vuoto con VALIDATION_ERROR e nessuna write', async () => {
    const created = await listService.createList({ name: 'Original' })
    await db.changeLog.clear()

    const result = await listService.updateList(created.data!.id, { name: '   ' })
    expect(result.error?.code).toBe('VALIDATION_ERROR')

    const got = await db.lists.get(created.data!.id)
    expect(got?.name).toBe('Original')
    expect(await db.changeLog.count()).toBe(0)
  })

  it('ritorna NOT_FOUND su id inesistente', async () => {
    const result = await listService.updateList('nonexistent-id', { name: 'X' })
    expect(result.error?.code).toBe('NOT_FOUND')
    expect(await db.changeLog.count()).toBe(0)
  })

  it('ritorna NOT_FOUND su lista già cancellata', async () => {
    const created = await listService.createList({ name: 'To delete' })
    await db.lists.update(created.data!.id, { deletedAt: Date.now() })
    await db.changeLog.clear()

    const result = await listService.updateList(created.data!.id, { name: 'X' })
    expect(result.error?.code).toBe('NOT_FOUND')
    expect(await db.changeLog.count()).toBe(0)
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/services/list-service.test.ts
```

Expected: FAIL — `listService.updateList is not a function`.

- [ ] **Step 3: Aggiungi `updateList` a `list-service.ts`**

Aggiungi le import necessarie in cima al file (se non già presenti):

```typescript
import { DomainError } from './_internal/domain-error'
import { buildDiff } from '@/utils/diff'
```

Aggiungi la funzione e includila nell'export `listService`:

```typescript
async function updateList(id: string, changes: { name: string }): Promise<AppResult<List>> {
  const validationError = validateListName(changes.name)
  if (validationError) return { data: null, error: validationError }

  const userId = getCurrentUserId()
  const now = Date.now()
  const trimmed = changes.name.trim()

  try {
    const updated = await db.transaction('rw', db.lists, db.changeLog, async (tx) => {
      const before = await listRepository.getById(id, tx)
      if (!before || before.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Lista ${id} non trovata`)
      }

      const updatedList: List = { ...before, name: trimmed, updatedAt: now }
      await listRepository.update(id, { name: trimmed, updatedAt: now }, tx)

      const diff = buildDiff(before, updatedList, ['id', 'userId', 'createdAt', 'sharedWith', 'itemOrder', 'syncedAt'])
      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'UPDATE',
        entityType: 'LIST',
        entityId: id,
        changes: diff,
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)
      return updatedList
    })
    return { data: updated, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

export const listService = {
  createList,
  updateList,
}
```

- [ ] **Step 4: Esegui test**

```bash
npm run test -- src/services/list-service.test.ts
```

Expected: PASS — 8 test totali verdi (4 createList + 4 updateList).

- [ ] **Step 5: Commit**

```bash
git add src/services/list-service.ts src/services/list-service.test.ts
git commit -m "feat(services): add listService.updateList with TDD"
```

---

### Task 3.3: `listService.archiveList` e `unarchiveList` con TDD

**Files:**
- Modify: `src/services/list-service.test.ts`
- Modify: `src/services/list-service.ts`

- [ ] **Step 1: Aggiungi i test FAILING per archive/unarchive**

Append al test file:

```typescript
describe('listService.archiveList / unarchiveList', () => {
  beforeEach(async () => {
    await db.lists.clear()
    await db.changeLog.clear()
  })

  it('archiveList imposta status archived e produce log UPDATE', async () => {
    const created = await listService.createList({ name: 'Test' })
    await db.changeLog.clear()

    const result = await listService.archiveList(created.data!.id)
    expect(result.error).toBe(null)
    expect(result.data?.status).toBe('archived')

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0].operationType).toBe('UPDATE')
    expect(log[0].changes.after).toMatchObject({ status: 'archived' })
  })

  it('unarchiveList riporta status active', async () => {
    const created = await listService.createList({ name: 'Test' })
    await listService.archiveList(created.data!.id)
    await db.changeLog.clear()

    const result = await listService.unarchiveList(created.data!.id)
    expect(result.error).toBe(null)
    expect(result.data?.status).toBe('active')
    expect(((await db.changeLog.toArray())[0]).changes.after).toMatchObject({ status: 'active' })
  })

  it('archiveList ritorna NOT_FOUND su id inesistente', async () => {
    const result = await listService.archiveList('nonexistent')
    expect(result.error?.code).toBe('NOT_FOUND')
  })

  it('unarchiveList ritorna NOT_FOUND su lista cancellata', async () => {
    const created = await listService.createList({ name: 'Test' })
    await db.lists.update(created.data!.id, { deletedAt: Date.now() })
    const result = await listService.unarchiveList(created.data!.id)
    expect(result.error?.code).toBe('NOT_FOUND')
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/services/list-service.test.ts
```

Expected: FAIL — `archiveList`/`unarchiveList` non esistono.

- [ ] **Step 3: Aggiungi metodi a `list-service.ts`**

```typescript
async function setListStatus(id: string, newStatus: 'active' | 'archived'): Promise<AppResult<List>> {
  const userId = getCurrentUserId()
  const now = Date.now()

  try {
    const updated = await db.transaction('rw', db.lists, db.changeLog, async (tx) => {
      const before = await listRepository.getById(id, tx)
      if (!before || before.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Lista ${id} non trovata`)
      }

      const updatedList: List = { ...before, status: newStatus, updatedAt: now }
      await listRepository.update(id, { status: newStatus, updatedAt: now }, tx)

      const diff = buildDiff(before, updatedList, ['id', 'userId', 'createdAt', 'sharedWith', 'itemOrder', 'syncedAt'])
      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'UPDATE',
        entityType: 'LIST',
        entityId: id,
        changes: diff,
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)
      return updatedList
    })
    return { data: updated, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

const archiveList = (id: string) => setListStatus(id, 'archived')
const unarchiveList = (id: string) => setListStatus(id, 'active')

export const listService = {
  createList,
  updateList,
  archiveList,
  unarchiveList,
}
```

- [ ] **Step 4: Esegui test**

```bash
npm run test -- src/services/list-service.test.ts
```

Expected: PASS — 12 test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/services/list-service.ts src/services/list-service.test.ts
git commit -m "feat(services): add archiveList/unarchiveList via setListStatus helper"
```

---

### Task 3.4: `listService.deleteList` cascade con TDD (S1-06)

**Files:**
- Modify: `src/services/list-service.test.ts`
- Modify: `src/services/list-service.ts`

> **Nota**: questo task richiede che `itemRepository` esista già (Task 2.3).

- [ ] **Step 1: Aggiungi i test FAILING per deleteList cascade**

```typescript
import { itemRepository } from '@/repositories/item-repository'
import type { Item } from '@/db/types'

function buildItemForList(listId: string, overrides: Partial<Item> = {}): Item {
  const now = Date.now()
  return {
    id: 'item-' + Math.random().toString(36).slice(2, 9),
    listId,
    name: 'Articolo',
    quantity: null, unit: null, notes: null, category: null,
    status: 'pending',
    sortOrder: 1,
    createdAt: now, updatedAt: now,
    completedAt: null, deletedAt: null,
    createdBy: 'local-user-stub', updatedBy: 'local-user-stub',
    ...overrides,
  }
}

describe('listService.deleteList (cascade)', () => {
  beforeEach(async () => {
    await db.lists.clear()
    await db.items.clear()
    await db.changeLog.clear()
  })

  it('cancella lista + tutti gli articoli attivi + emette 1 + N entries changeLog', async () => {
    const created = await listService.createList({ name: 'Test' })
    const listId = created.data!.id
    await itemRepository.create(buildItemForList(listId, { id: 'i1', sortOrder: 1 }))
    await itemRepository.create(buildItemForList(listId, { id: 'i2', sortOrder: 2 }))
    await itemRepository.create(buildItemForList(listId, { id: 'i3', sortOrder: 3 }))
    await db.changeLog.clear()

    const result = await listService.deleteList(listId)
    expect(result.error).toBe(null)

    const listAfter = await db.lists.get(listId)
    expect(listAfter?.deletedAt).not.toBe(null)

    const items = await db.items.where('listId').equals(listId).toArray()
    expect(items).toHaveLength(3)
    expect(items.every(i => i.deletedAt !== null)).toBe(true)

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(4)
    expect(log.filter(e => e.entityType === 'LIST')).toHaveLength(1)
    expect(log.filter(e => e.entityType === 'ITEM')).toHaveLength(3)
    expect(log.every(e => e.operationType === 'DELETE')).toBe(true)

    const timestamps = new Set(log.map(e => e.timestamp))
    expect(timestamps.size).toBe(1)
  })

  it('non genera log per articoli già cancellati prima del delete lista', async () => {
    const created = await listService.createList({ name: 'Test' })
    const listId = created.data!.id
    await itemRepository.create(buildItemForList(listId, { id: 'i1' }))
    await itemRepository.create(buildItemForList(listId, { id: 'i2', deletedAt: Date.now() }))
    await db.changeLog.clear()

    await listService.deleteList(listId)
    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(2) // 1 LIST + 1 ITEM (i1 attivo)
  })

  it('ritorna NOT_FOUND su lista inesistente', async () => {
    const result = await listService.deleteList('nonexistent')
    expect(result.error?.code).toBe('NOT_FOUND')
    expect(await db.changeLog.count()).toBe(0)
  })

  it('ritorna NOT_FOUND su lista già cancellata', async () => {
    const created = await listService.createList({ name: 'Test' })
    await db.lists.update(created.data!.id, { deletedAt: Date.now() })
    await db.changeLog.clear()
    const result = await listService.deleteList(created.data!.id)
    expect(result.error?.code).toBe('NOT_FOUND')
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/services/list-service.test.ts
```

Expected: FAIL — `deleteList` non esiste.

- [ ] **Step 3: Aggiungi `deleteList` a `list-service.ts`**

```typescript
import type { Item } from '@/db/types'
import { itemRepository } from '@/repositories/item-repository'

async function deleteList(id: string): Promise<AppResult<void>> {
  const userId = getCurrentUserId()
  const now = Date.now()

  try {
    await db.transaction('rw', db.lists, db.items, db.changeLog, async (tx) => {
      const listBefore = await listRepository.getById(id, tx)
      if (!listBefore || listBefore.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Lista ${id} non trovata o già cancellata`)
      }

      const itemsBefore = await itemRepository.listActiveInList(id, tx)

      await listRepository.update(id, { deletedAt: now, updatedAt: now }, tx)

      await tx.table<Item>('items')
        .where('listId').equals(id)
        .and(i => i.deletedAt === null)
        .modify({ deletedAt: now, updatedAt: now })

      const logEntries: ChangeLogEntry[] = [
        {
          id: generateId(),
          userId,
          timestamp: now,
          operationType: 'DELETE',
          entityType: 'LIST',
          entityId: id,
          changes: { before: listBefore, after: { deletedAt: now, updatedAt: now } },
          synced: false,
          syncedAt: null,
          conflictResolution: null,
        },
        ...itemsBefore.map(item => ({
          id: generateId(),
          userId,
          timestamp: now,
          operationType: 'DELETE' as const,
          entityType: 'ITEM' as const,
          entityId: item.id,
          changes: { before: item, after: { deletedAt: now, updatedAt: now } },
          synced: false,
          syncedAt: null,
          conflictResolution: null,
        })),
      ]
      await changeLogRepository.appendMany(logEntries, tx)
    })
    return { data: undefined, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

export const listService = {
  createList,
  updateList,
  archiveList,
  unarchiveList,
  deleteList,
}
```

- [ ] **Step 4: Esegui test**

```bash
npm run test -- src/services/list-service.test.ts
```

Expected: PASS — 16 test verdi (S1-18 100% del listService completato).

- [ ] **Step 5: Commit**

```bash
git add src/services/list-service.ts src/services/list-service.test.ts
git commit -m "feat(services): add listService.deleteList with cascade soft delete"
```

---

### Task 3.5: `itemService.createItem` con TDD (S1-09 parziale, S1-19 parziale)

**Files:**
- Create: `src/services/item-service.test.ts`
- Create: `src/services/item-service.ts`

- [ ] **Step 1: Scrivi i test FAILING per createItem**

```typescript
// src/services/item-service.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/database'
import { itemService } from '@/services/item-service'
import { listService } from '@/services/list-service'

async function seedList(name = 'Test'): Promise<string> {
  const result = await listService.createList({ name })
  return result.data!.id
}

describe('itemService.createItem', () => {
  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
  })

  it('happy path: crea item con sortOrder=1 e changeLog CREATE', async () => {
    const listId = await seedList()
    await db.changeLog.clear()

    const result = await itemService.createItem({ listId, name: 'Latte' })
    expect(result.error).toBe(null)
    expect(result.data!.name).toBe('Latte')
    expect(result.data!.sortOrder).toBe(1)
    expect(result.data!.status).toBe('pending')
    expect(result.data!.deletedAt).toBe(null)
    expect(result.data!.listId).toBe(listId)

    const items = await db.items.toArray()
    expect(items).toHaveLength(1)

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0].operationType).toBe('CREATE')
    expect(log[0].entityType).toBe('ITEM')
    expect(log[0].changes.before).toBe(null)
  })

  it('sortOrder = max + 1 quando esistono già articoli', async () => {
    const listId = await seedList()
    await itemService.createItem({ listId, name: 'A' })
    await itemService.createItem({ listId, name: 'B' })
    const result = await itemService.createItem({ listId, name: 'C' })
    expect(result.data!.sortOrder).toBe(3)
  })

  it('rifiuta nome vuoto con VALIDATION_ERROR e nessuna write', async () => {
    const listId = await seedList()
    await db.changeLog.clear()
    const result = await itemService.createItem({ listId, name: '   ' })
    expect(result.error?.code).toBe('VALIDATION_ERROR')
    expect(await db.items.count()).toBe(0)
    expect(await db.changeLog.count()).toBe(0)
  })

  it('accetta tutti i campi opzionali', async () => {
    const listId = await seedList()
    const result = await itemService.createItem({
      listId,
      name: 'Latte',
      quantity: 2,
      unit: 'l',
      category: 'dairy',
      notes: 'intero',
    })
    expect(result.data?.quantity).toBe(2)
    expect(result.data?.unit).toBe('l')
    expect(result.data?.category).toBe('dairy')
    expect(result.data?.notes).toBe('intero')
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/services/item-service.test.ts
```

Expected: FAIL — modulo non esiste.

- [ ] **Step 3: Implementa `item-service.ts` con `createItem`**

```typescript
// src/services/item-service.ts
import { db } from '@/db/database'
import type { Item, ItemStatus, ChangeLogEntry, UnitOfMeasure, Category } from '@/db/types'
import type { AppResult } from '@/types/ui'
import { itemRepository } from '@/repositories/item-repository'
import { changeLogRepository } from '@/repositories/change-log-repository'
import { validateItemInput } from '@/utils/validation'
import { generateId } from '@/utils/id-utils'
import { buildDiff } from '@/utils/diff'
import { getCurrentUserId } from '@/stores/auth-store'
import { DomainError } from './_internal/domain-error'
import { mapDbError } from './_internal/map-db-error'

export type CreateItemInput = {
  listId: string
  name: string
  quantity?: number | null
  unit?: UnitOfMeasure | null
  category?: Category | null
  notes?: string | null
}

async function createItem(input: CreateItemInput): Promise<AppResult<Item>> {
  const validationError = validateItemInput({
    name: input.name,
    quantity: input.quantity,
    notes: input.notes,
  })
  if (validationError) return { data: null, error: validationError }

  const userId = getCurrentUserId()
  const now = Date.now()
  const id = generateId()
  const trimmedName = input.name.trim()

  try {
    const newItem = await db.transaction('rw', db.items, db.changeLog, async (tx) => {
      const maxSort = await itemRepository.getMaxSortOrder(input.listId, tx)

      const item: Item = {
        id,
        listId: input.listId,
        name: trimmedName,
        quantity: input.quantity ?? null,
        unit: input.unit ?? null,
        notes: input.notes ?? null,
        category: input.category ?? null,
        status: 'pending',
        sortOrder: maxSort + 1,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      }

      await itemRepository.create(item, tx)

      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'CREATE',
        entityType: 'ITEM',
        entityId: id,
        changes: { before: null, after: item },
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)

      return item
    })
    return { data: newItem, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

export const itemService = {
  createItem,
}
```

- [ ] **Step 4: Esegui test**

```bash
npm run test -- src/services/item-service.test.ts
```

Expected: PASS — 4 test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/services/item-service.ts src/services/item-service.test.ts
git commit -m "feat(services): add itemService.createItem with TDD"
```

---

### Task 3.6: `itemService.updateItem` con TDD

**Files:**
- Modify: `src/services/item-service.test.ts`
- Modify: `src/services/item-service.ts`

- [ ] **Step 1: Aggiungi i test FAILING**

```typescript
describe('itemService.updateItem', () => {
  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
  })

  it('happy path: aggiorna nome e quantity, log UPDATE con diff parziale', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte', quantity: 1 })
    await db.changeLog.clear()

    const result = await itemService.updateItem(created.data!.id, { name: 'Latte intero', quantity: 2 })
    expect(result.error).toBe(null)
    expect(result.data?.name).toBe('Latte intero')
    expect(result.data?.quantity).toBe(2)

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0].operationType).toBe('UPDATE')
    expect(log[0].changes.before).toMatchObject({ name: 'Latte', quantity: 1 })
    expect(log[0].changes.after).toMatchObject({ name: 'Latte intero', quantity: 2 })
  })

  it('rifiuta nome vuoto con VALIDATION_ERROR', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await db.changeLog.clear()

    const result = await itemService.updateItem(created.data!.id, { name: '   ' })
    expect(result.error?.code).toBe('VALIDATION_ERROR')
    expect(await db.changeLog.count()).toBe(0)
  })

  it('ritorna NOT_FOUND su id inesistente', async () => {
    const result = await itemService.updateItem('nonexistent', { name: 'X' })
    expect(result.error?.code).toBe('NOT_FOUND')
  })

  it('ritorna NOT_FOUND su articolo cancellato', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await db.items.update(created.data!.id, { deletedAt: Date.now() })
    await db.changeLog.clear()

    const result = await itemService.updateItem(created.data!.id, { name: 'X' })
    expect(result.error?.code).toBe('NOT_FOUND')
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/services/item-service.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Aggiungi `updateItem` a `item-service.ts`**

```typescript
export type UpdateItemInput = Partial<Pick<Item, 'name' | 'quantity' | 'unit' | 'category' | 'notes'>>

async function updateItem(id: string, changes: UpdateItemInput): Promise<AppResult<Item>> {
  if (changes.name !== undefined) {
    const validationError = validateItemInput({
      name: changes.name,
      quantity: changes.quantity,
      notes: changes.notes,
    })
    if (validationError) return { data: null, error: validationError }
  }

  const userId = getCurrentUserId()
  const now = Date.now()

  try {
    const updated = await db.transaction('rw', db.items, db.changeLog, async (tx) => {
      const before = await itemRepository.getById(id, tx)
      if (!before || before.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Articolo ${id} non trovato`)
      }

      const sanitized: Partial<Item> = {}
      if (changes.name !== undefined) sanitized.name = changes.name.trim()
      if (changes.quantity !== undefined) sanitized.quantity = changes.quantity
      if (changes.unit !== undefined) sanitized.unit = changes.unit
      if (changes.category !== undefined) sanitized.category = changes.category
      if (changes.notes !== undefined) sanitized.notes = changes.notes

      const updatedItem: Item = {
        ...before,
        ...sanitized,
        updatedAt: now,
        updatedBy: userId,
      }

      await itemRepository.update(id, { ...sanitized, updatedAt: now, updatedBy: userId }, tx)

      const diff = buildDiff(before, updatedItem, ['id', 'listId', 'createdAt', 'createdBy'])
      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'UPDATE',
        entityType: 'ITEM',
        entityId: id,
        changes: diff,
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)
      return updatedItem
    })
    return { data: updated, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

export const itemService = {
  createItem,
  updateItem,
}
```

- [ ] **Step 4: Esegui test**

```bash
npm run test -- src/services/item-service.test.ts
```

Expected: PASS — 8 test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/services/item-service.ts src/services/item-service.test.ts
git commit -m "feat(services): add itemService.updateItem with TDD"
```

---

### Task 3.7: `itemService.toggleItemStatus` con TDD (S1-12)

**Files:**
- Modify: `src/services/item-service.test.ts`
- Modify: `src/services/item-service.ts`

- [ ] **Step 1: Aggiungi i test FAILING**

```typescript
describe('itemService.toggleItemStatus', () => {
  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
  })

  it('toggle pending → completed imposta completedAt e log STATE_CHANGE', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await db.changeLog.clear()

    const result = await itemService.toggleItemStatus(created.data!.id)
    expect(result.error).toBe(null)
    expect(result.data?.status).toBe('completed')
    expect(result.data?.completedAt).not.toBe(null)

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0].operationType).toBe('STATE_CHANGE')
    expect(log[0].changes.before).toEqual({ status: 'pending', completedAt: null })
    expect(log[0].changes.after).toMatchObject({ status: 'completed' })
  })

  it('toggle completed → pending azzera completedAt', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await itemService.toggleItemStatus(created.data!.id)
    await db.changeLog.clear()

    const result = await itemService.toggleItemStatus(created.data!.id)
    expect(result.data?.status).toBe('pending')
    expect(result.data?.completedAt).toBe(null)

    const log = await db.changeLog.toArray()
    expect(log[0].changes.after).toEqual({ status: 'pending', completedAt: null })
  })

  it('ritorna NOT_FOUND su articolo inesistente', async () => {
    const result = await itemService.toggleItemStatus('nonexistent')
    expect(result.error?.code).toBe('NOT_FOUND')
  })

  it('ritorna NOT_FOUND su articolo cancellato', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await db.items.update(created.data!.id, { deletedAt: Date.now() })
    const result = await itemService.toggleItemStatus(created.data!.id)
    expect(result.error?.code).toBe('NOT_FOUND')
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/services/item-service.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Aggiungi `toggleItemStatus`**

```typescript
async function toggleItemStatus(itemId: string): Promise<AppResult<Item>> {
  const userId = getCurrentUserId()
  const now = Date.now()

  try {
    const updated = await db.transaction('rw', db.items, db.changeLog, async (tx) => {
      const before = await itemRepository.getById(itemId, tx)
      if (!before || before.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Articolo ${itemId} non trovato`)
      }

      const newStatus: ItemStatus = before.status === 'pending' ? 'completed' : 'pending'
      const newCompletedAt = newStatus === 'completed' ? now : null

      await itemRepository.update(itemId, {
        status: newStatus,
        completedAt: newCompletedAt,
        updatedAt: now,
        updatedBy: userId,
      }, tx)

      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'STATE_CHANGE',
        entityType: 'ITEM',
        entityId: itemId,
        changes: {
          before: { status: before.status, completedAt: before.completedAt },
          after: { status: newStatus, completedAt: newCompletedAt },
        },
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)

      return {
        ...before,
        status: newStatus,
        completedAt: newCompletedAt,
        updatedAt: now,
        updatedBy: userId,
      }
    })
    return { data: updated, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

export const itemService = {
  createItem,
  updateItem,
  toggleItemStatus,
}
```

- [ ] **Step 4: Esegui test**

```bash
npm run test -- src/services/item-service.test.ts
```

Expected: PASS — 12 test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/services/item-service.ts src/services/item-service.test.ts
git commit -m "feat(services): add itemService.toggleItemStatus (STATE_CHANGE)"
```

---

### Task 3.8: `itemService.deleteItem` con TDD (S1-14)

**Files:**
- Modify: `src/services/item-service.test.ts`
- Modify: `src/services/item-service.ts`

- [ ] **Step 1: Aggiungi i test FAILING**

```typescript
describe('itemService.deleteItem', () => {
  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
  })

  it('soft-delete imposta deletedAt e log DELETE con before snapshot', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await db.changeLog.clear()

    const result = await itemService.deleteItem(created.data!.id)
    expect(result.error).toBe(null)

    const got = await db.items.get(created.data!.id)
    expect(got?.deletedAt).not.toBe(null)

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0].operationType).toBe('DELETE')
    expect(log[0].changes.before).toMatchObject({ name: 'Latte' })
    expect(log[0].changes.after).toMatchObject({ deletedAt: expect.any(Number) })
  })

  it('ritorna NOT_FOUND su id inesistente', async () => {
    const result = await itemService.deleteItem('nonexistent')
    expect(result.error?.code).toBe('NOT_FOUND')
  })

  it('ritorna NOT_FOUND su articolo già cancellato', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await db.items.update(created.data!.id, { deletedAt: Date.now() })
    await db.changeLog.clear()
    const result = await itemService.deleteItem(created.data!.id)
    expect(result.error?.code).toBe('NOT_FOUND')
    expect(await db.changeLog.count()).toBe(0)
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/services/item-service.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Aggiungi `deleteItem`**

```typescript
async function deleteItem(id: string): Promise<AppResult<void>> {
  const userId = getCurrentUserId()
  const now = Date.now()

  try {
    await db.transaction('rw', db.items, db.changeLog, async (tx) => {
      const before = await itemRepository.getById(id, tx)
      if (!before || before.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Articolo ${id} non trovato`)
      }

      await itemRepository.update(id, { deletedAt: now, updatedAt: now }, tx)

      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'DELETE',
        entityType: 'ITEM',
        entityId: id,
        changes: { before, after: { deletedAt: now, updatedAt: now } },
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)
    })
    return { data: undefined, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

export const itemService = {
  createItem,
  updateItem,
  toggleItemStatus,
  deleteItem,
}
```

- [ ] **Step 4: Esegui test**

```bash
npm run test -- src/services/item-service.test.ts
```

Expected: PASS — 15 test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/services/item-service.ts src/services/item-service.test.ts
git commit -m "feat(services): add itemService.deleteItem with TDD"
```

---

### Task 3.9: `itemService.restoreItem` con TDD (parte di S1-15)

**Files:**
- Modify: `src/services/item-service.test.ts`
- Modify: `src/services/item-service.ts`

- [ ] **Step 1: Aggiungi i test FAILING**

```typescript
import { listRepository } from '@/repositories/list-repository'

describe('itemService.restoreItem', () => {
  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
  })

  it('happy path: ripristina articolo cancellato con status pending', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await itemService.deleteItem(created.data!.id)
    await db.changeLog.clear()

    const result = await itemService.restoreItem(created.data!.id)
    expect(result.error).toBe(null)
    expect(result.data?.deletedAt).toBe(null)
    expect(result.data?.status).toBe('pending')

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0].operationType).toBe('UPDATE')
    expect(log[0].changes.after).toMatchObject({ deletedAt: null })
  })

  it('ritorna NOT_FOUND su articolo non cancellato', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    const result = await itemService.restoreItem(created.data!.id)
    expect(result.error?.code).toBe('NOT_FOUND')
  })

  it('ritorna NOT_FOUND se la lista parent è cancellata', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await itemService.deleteItem(created.data!.id)
    await listRepository.update(listId, { deletedAt: Date.now() })
    await db.changeLog.clear()

    const result = await itemService.restoreItem(created.data!.id)
    expect(result.error?.code).toBe('NOT_FOUND')
    expect(await db.changeLog.count()).toBe(0)
  })

  it('ritorna NOT_FOUND su id inesistente', async () => {
    const result = await itemService.restoreItem('nonexistent')
    expect(result.error?.code).toBe('NOT_FOUND')
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/services/item-service.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Aggiungi `restoreItem`**

```typescript
import { listRepository } from '@/repositories/list-repository'

async function restoreItem(id: string): Promise<AppResult<Item>> {
  const userId = getCurrentUserId()
  const now = Date.now()

  try {
    const restored = await db.transaction('rw', db.items, db.lists, db.changeLog, async (tx) => {
      const before = await itemRepository.getById(id, tx)
      if (!before || before.deletedAt === null) {
        throw new DomainError('NOT_FOUND', `Articolo ${id} non in cestino`)
      }

      const parentList = await listRepository.getById(before.listId, tx)
      if (!parentList || parentList.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Lista parent cancellata, restore non possibile`)
      }

      const sanitized: Partial<Item> = {
        deletedAt: null,
        status: 'pending',
        updatedAt: now,
        updatedBy: userId,
      }

      await itemRepository.update(id, sanitized, tx)

      const updatedItem: Item = { ...before, ...sanitized }
      const diff = buildDiff(before, updatedItem, ['id', 'listId', 'createdAt', 'createdBy'])

      const logEntry: ChangeLogEntry = {
        id: generateId(),
        userId,
        operationType: 'UPDATE',
        entityType: 'ITEM',
        entityId: id,
        changes: diff,
        timestamp: now,
        synced: false,
        syncedAt: null,
        conflictResolution: null,
      }
      await changeLogRepository.append(logEntry, tx)
      return updatedItem
    })
    return { data: restored, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

export const itemService = {
  createItem,
  updateItem,
  toggleItemStatus,
  deleteItem,
  restoreItem,
}
```

- [ ] **Step 4: Esegui test**

```bash
npm run test -- src/services/item-service.test.ts
```

Expected: PASS — 19 test verdi (S1-19 100% del itemService completato).

- [ ] **Step 5: Verifica coverage services**

```bash
npx vitest run --coverage src/services/
```

Expected: `listService` e `itemService` al 100% line + branch coverage.

- [ ] **Step 6: Commit**

```bash
git add src/services/item-service.ts src/services/item-service.test.ts
git commit -m "feat(services): add itemService.restoreItem with parent list check"
```

---

## Phase 4 — Hooks

### Task 4.1: `use-lists.ts` con TDD (S1-03 + S1-03b)

**Files:**
- Create: `src/hooks/use-lists.test.ts`
- Create: `src/hooks/use-lists.ts`

- [ ] **Step 1: Scrivi i test FAILING**

```typescript
// src/hooks/use-lists.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { db } from '@/db/database'
import { useLists } from '@/hooks/use-lists'

describe('useLists', () => {
  beforeEach(async () => {
    await db.lists.clear()
    await db.items.clear()
    await db.changeLog.clear()
  })

  it('inizia con lists === undefined poi emette array vuoto', async () => {
    const { result } = renderHook(() => useLists())
    expect(result.current.lists).toBe(undefined)
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.lists).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('emette nuovo array dopo create via mutation', async () => {
    const { result } = renderHook(() => useLists())
    await waitFor(() => expect(result.current.lists).toEqual([]))

    await act(async () => {
      await result.current.create('Nuova lista')
    })

    await waitFor(() => {
      expect(result.current.lists).toHaveLength(1)
      expect(result.current.lists![0].name).toBe('Nuova lista')
    })
  })

  it('propaga AppError da service in caso di input invalido', async () => {
    const { result } = renderHook(() => useLists())
    await waitFor(() => expect(result.current.lists).toEqual([]))

    let mutationResult
    await act(async () => {
      mutationResult = await result.current.create('   ')
    })

    expect(mutationResult!.error?.code).toBe('VALIDATION_ERROR')
    expect(result.current.lists).toEqual([])
  })

  it('rimuove la lista dall array dopo remove', async () => {
    const { result } = renderHook(() => useLists())
    await waitFor(() => expect(result.current.lists).toEqual([]))

    let createdId: string
    await act(async () => {
      const r = await result.current.create('To delete')
      createdId = r.data!.id
    })
    await waitFor(() => expect(result.current.lists).toHaveLength(1))

    await act(async () => {
      await result.current.remove(createdId)
    })

    await waitFor(() => expect(result.current.lists).toEqual([]))
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/hooks/use-lists.test.ts
```

Expected: FAIL — modulo non esiste.

- [ ] **Step 3: Implementa `use-lists.ts`**

```typescript
// src/hooks/use-lists.ts
import { useLiveQuery } from 'dexie-react-hooks'
import { listRepository } from '@/repositories/list-repository'
import { listService } from '@/services/list-service'
import { useAuthStore } from '@/stores/auth-store'
import type { List } from '@/db/types'
import type { AppResult } from '@/types/ui'

export type UseListsResult = {
  lists: List[] | undefined
  isLoading: boolean
  create(name: string): Promise<AppResult<List>>
  rename(id: string, name: string): Promise<AppResult<List>>
  archive(id: string): Promise<AppResult<List>>
  unarchive(id: string): Promise<AppResult<List>>
  remove(id: string): Promise<AppResult<void>>
}

export function useLists(): UseListsResult {
  const userId = useAuthStore(s => s.userId)

  const lists = useLiveQuery(
    () => listRepository.listByUser(userId),
    [userId],
    undefined,
  )

  return {
    lists,
    isLoading: lists === undefined,
    create: (name) => listService.createList({ name }),
    rename: (id, name) => listService.updateList(id, { name }),
    archive: (id) => listService.archiveList(id),
    unarchive: (id) => listService.unarchiveList(id),
    remove: (id) => listService.deleteList(id),
  }
}
```

- [ ] **Step 4: Esegui test**

```bash
npm run test -- src/hooks/use-lists.test.ts
```

Expected: PASS — 4 test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-lists.ts src/hooks/use-lists.test.ts
git commit -m "feat(hooks): add useLists with TDD"
```

---

### Task 4.2: `use-items.ts` con TDD (S1-10 + S1-10b)

**Files:**
- Create: `src/hooks/use-items.test.ts`
- Create: `src/hooks/use-items.ts`

- [ ] **Step 1: Scrivi i test FAILING**

```typescript
// src/hooks/use-items.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { db } from '@/db/database'
import { useItems } from '@/hooks/use-items'
import { listService } from '@/services/list-service'

describe('useItems', () => {
  let testListId: string

  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
    const result = await listService.createList({ name: 'Test list' })
    testListId = result.data!.id
  })

  it('inizia con items === undefined poi emette array vuoto', async () => {
    const { result } = renderHook(() => useItems(testListId))
    expect(result.current.items).toBe(undefined)
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => {
      expect(result.current.items).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('emette nuovo array dopo create via mutation', async () => {
    const { result } = renderHook(() => useItems(testListId))
    await waitFor(() => expect(result.current.items).toEqual([]))

    await act(async () => {
      await result.current.create({ name: 'Latte' })
    })

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1)
      expect(result.current.items![0].name).toBe('Latte')
    })
  })

  it('propaga AppError da service in caso di input invalido', async () => {
    const { result } = renderHook(() => useItems(testListId))
    await waitFor(() => expect(result.current.items).toEqual([]))

    let mutationResult
    await act(async () => {
      mutationResult = await result.current.create({ name: '' })
    })

    expect(mutationResult!.error?.code).toBe('VALIDATION_ERROR')
    expect(result.current.items).toEqual([])
  })

  it('toggle modifica status nell array', async () => {
    const { result } = renderHook(() => useItems(testListId))
    await waitFor(() => expect(result.current.items).toEqual([]))

    let createdId: string
    await act(async () => {
      const r = await result.current.create({ name: 'Latte' })
      createdId = r.data!.id
    })
    await waitFor(() => expect(result.current.items).toHaveLength(1))

    await act(async () => {
      await result.current.toggle(createdId)
    })

    await waitFor(() => {
      expect(result.current.items![0].status).toBe('completed')
    })
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/hooks/use-items.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implementa `use-items.ts`**

```typescript
// src/hooks/use-items.ts
import { useLiveQuery } from 'dexie-react-hooks'
import { itemRepository } from '@/repositories/item-repository'
import { itemService, type CreateItemInput, type UpdateItemInput } from '@/services/item-service'
import type { Item } from '@/db/types'
import type { AppResult } from '@/types/ui'

export type UseItemsResult = {
  items: Item[] | undefined
  isLoading: boolean
  create(input: Omit<CreateItemInput, 'listId'>): Promise<AppResult<Item>>
  update(id: string, changes: UpdateItemInput): Promise<AppResult<Item>>
  toggle(id: string): Promise<AppResult<Item>>
  remove(id: string): Promise<AppResult<void>>
}

export function useItems(listId: string): UseItemsResult {
  const items = useLiveQuery(
    () => itemRepository.listActiveByList(listId),
    [listId],
    undefined,
  )

  return {
    items,
    isLoading: items === undefined,
    create: (input) => itemService.createItem({ listId, ...input }),
    update: (id, changes) => itemService.updateItem(id, changes),
    toggle: (id) => itemService.toggleItemStatus(id),
    remove: (id) => itemService.deleteItem(id),
  }
}
```

- [ ] **Step 4: Esegui test**

```bash
npm run test -- src/hooks/use-items.test.ts
```

Expected: PASS — 4 test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-items.ts src/hooks/use-items.test.ts
git commit -m "feat(hooks): add useItems with TDD"
```

---

### Task 4.3: `use-deleted-items.ts` con TDD (S1-15b)

**Files:**
- Create: `src/hooks/use-deleted-items.test.ts`
- Create: `src/hooks/use-deleted-items.ts`

- [ ] **Step 1: Scrivi i test FAILING**

```typescript
// src/hooks/use-deleted-items.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { db } from '@/db/database'
import { useDeletedItems } from '@/hooks/use-deleted-items'
import { listService } from '@/services/list-service'
import { itemService } from '@/services/item-service'

describe('useDeletedItems', () => {
  let testListId: string

  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
    const result = await listService.createList({ name: 'Test list' })
    testListId = result.data!.id
  })

  it('inizia con items === undefined poi emette array vuoto se nessun deleted', async () => {
    const { result } = renderHook(() => useDeletedItems(testListId))
    expect(result.current.items).toBe(undefined)
    await waitFor(() => {
      expect(result.current.items).toEqual([])
    })
  })

  it('emette articoli cancellati dopo delete', async () => {
    const created = await itemService.createItem({ listId: testListId, name: 'Latte' })
    await itemService.deleteItem(created.data!.id)

    const { result } = renderHook(() => useDeletedItems(testListId))
    await waitFor(() => {
      expect(result.current.items).toHaveLength(1)
      expect(result.current.items![0].id).toBe(created.data!.id)
    })
  })

  it('rimuove l articolo dall array dopo restore', async () => {
    const created = await itemService.createItem({ listId: testListId, name: 'Latte' })
    await itemService.deleteItem(created.data!.id)

    const { result } = renderHook(() => useDeletedItems(testListId))
    await waitFor(() => expect(result.current.items).toHaveLength(1))

    await act(async () => {
      await result.current.restore(created.data!.id)
    })

    await waitFor(() => expect(result.current.items).toEqual([]))
  })
})
```

- [ ] **Step 2: Esegui e verifica fallimento**

```bash
npm run test -- src/hooks/use-deleted-items.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implementa `use-deleted-items.ts`**

```typescript
// src/hooks/use-deleted-items.ts
import { useLiveQuery } from 'dexie-react-hooks'
import { itemRepository } from '@/repositories/item-repository'
import { itemService } from '@/services/item-service'
import type { Item } from '@/db/types'
import type { AppResult } from '@/types/ui'

export type UseDeletedItemsResult = {
  items: Item[] | undefined
  isLoading: boolean
  restore(id: string): Promise<AppResult<Item>>
}

export function useDeletedItems(listId: string): UseDeletedItemsResult {
  const items = useLiveQuery(
    () => itemRepository.listDeletedByList(listId),
    [listId],
    undefined,
  )

  return {
    items,
    isLoading: items === undefined,
    restore: (id) => itemService.restoreItem(id),
  }
}
```

- [ ] **Step 4: Esegui test**

```bash
npm run test -- src/hooks/use-deleted-items.test.ts
```

Expected: PASS — 3 test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-deleted-items.ts src/hooks/use-deleted-items.test.ts
git commit -m "feat(hooks): add useDeletedItems with TDD"
```

---

## Phase 5 — Componenti UI common (S1-17)

### Task 5.1: `ui-store.ts` rewrite con toast queue

**Files:**
- Modify: `src/stores/ui-store.ts`

- [ ] **Step 1: Sovrascrivi `ui-store.ts`**

```typescript
// src/stores/ui-store.ts
// Sprint 1: solo toast queue.
// theme/networkStatus/shoppingMode arriveranno con Sprint 3+.

import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'
export type ToastEntry = { id: string; type: ToastType; message: string }

type UiState = {
  toasts: ToastEntry[]
  pushToast(type: ToastType, message: string): void
  dismissToast(id: string): void
}

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  pushToast(type, message) {
    const id = crypto.randomUUID()
    set(state => ({ toasts: [...state.toasts, { id, type, message }] }))
    setTimeout(() => get().dismissToast(id), 3000)
  },
  dismissToast(id) {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },
}))
```

- [ ] **Step 2: Verifica typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/stores/ui-store.ts
git commit -m "feat(stores): rewrite uiStore with toast queue for Sprint 1"
```

---

### Task 5.2: `button.tsx`, `input.tsx`, `badge.tsx`

**Files:**
- Create: `src/components/common/button.tsx`
- Create: `src/components/common/input.tsx`
- Create: `src/components/common/badge.tsx`

- [ ] **Step 1: Crea `button.tsx`**

```typescript
// src/components/common/button.tsx
import type { JSX, ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...rest
}: Props): JSX.Element {
  return (
    <button
      className={`rounded font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Crea `input.tsx`**

```typescript
// src/components/common/input.tsx
import { forwardRef, type InputHTMLAttributes, type JSX } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, helperText, className = '', id, ...rest },
  ref,
): JSX.Element {
  const inputId = id ?? `input-${label?.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`rounded border px-3 py-2 text-base focus:outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-brand-200'
        } ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...rest}
      />
      {error && (
        <span id={`${inputId}-error`} className="text-sm text-red-600">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${inputId}-helper`} className="text-sm text-gray-500">
          {helperText}
        </span>
      )}
    </div>
  )
})
```

- [ ] **Step 3: Crea `badge.tsx`**

```typescript
// src/components/common/badge.tsx
import type { JSX, ReactNode } from 'react'

type Variant = 'default' | 'success' | 'warning' | 'danger'

type Props = {
  variant?: Variant
  children: ReactNode
}

const CLASSES: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
}

export function Badge({ variant = 'default', children }: Props): JSX.Element {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${CLASSES[variant]}`}>
      {children}
    </span>
  )
}
```

- [ ] **Step 4: Verifica typecheck**

```bash
npm run typecheck && npm run lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/common/button.tsx src/components/common/input.tsx src/components/common/badge.tsx
git commit -m "feat(ui): add Button, Input, Badge primitive components"
```

---

### Task 5.3: `modal.tsx` e `confirm-dialog.tsx` con Radix

**Files:**
- Create: `src/components/common/modal.tsx`
- Create: `src/components/common/confirm-dialog.tsx`

- [ ] **Step 1: Crea `modal.tsx` (wrapper su Radix Dialog)**

```typescript
// src/components/common/modal.tsx
import * as Dialog from '@radix-ui/react-dialog'
import type { JSX, ReactNode } from 'react'

type Props = {
  open: boolean
  onClose(): void
  title: string
  description?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, description, children }: Props): JSX.Element {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-bold text-gray-900">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="mt-1 text-sm text-gray-600">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 2: Crea `confirm-dialog.tsx`**

```typescript
// src/components/common/confirm-dialog.tsx
import { useState, useCallback, type JSX } from 'react'
import { Modal } from './modal'
import { Button } from './button'

type ConfirmOptions = {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void
}

export function useConfirm(): {
  confirm(options: ConfirmOptions): Promise<boolean>
  ConfirmDialog: () => JSX.Element | null
} {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve })
    })
  }, [])

  const handleClose = (result: boolean) => {
    if (state) {
      state.resolve(result)
      setState(null)
    }
  }

  const ConfirmDialog = () => {
    if (!state) return null
    return (
      <Modal open={true} onClose={() => handleClose(false)} title={state.title}>
        <p className="text-gray-700">{state.message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => handleClose(false)}>
            {state.cancelText ?? 'Annulla'}
          </Button>
          <Button variant={state.danger ? 'danger' : 'primary'} onClick={() => handleClose(true)}>
            {state.confirmText ?? 'Conferma'}
          </Button>
        </div>
      </Modal>
    )
  }

  return { confirm, ConfirmDialog }
}
```

- [ ] **Step 3: Verifica typecheck**

```bash
npm run typecheck && npm run lint
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/common/modal.tsx src/components/common/confirm-dialog.tsx
git commit -m "feat(ui): add Modal and useConfirm with Radix Dialog"
```

---

### Task 5.4: `toast-container.tsx`, `empty-state.tsx`, `loading-spinner.tsx`, `error-message.tsx`

**Files:**
- Create: `src/components/common/toast-container.tsx`
- Create: `src/components/common/empty-state.tsx`
- Create: `src/components/common/loading-spinner.tsx`
- Create: `src/components/common/error-message.tsx`

- [ ] **Step 1: Crea `toast-container.tsx`**

```typescript
// src/components/common/toast-container.tsx
import type { JSX } from 'react'
import { useUiStore, type ToastType } from '@/stores/ui-store'

const TYPE_CLASSES: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-600 text-white',
}

export function ToastContainer(): JSX.Element {
  const toasts = useUiStore(s => s.toasts)
  const dismiss = useUiStore(s => s.dismissToast)

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center justify-between gap-4 rounded px-4 py-2 shadow-lg ${TYPE_CLASSES[t.type]}`}
          role="alert"
        >
          <span>{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="text-lg font-bold opacity-75 hover:opacity-100"
            aria-label="Chiudi notifica"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Crea `empty-state.tsx`**

```typescript
// src/components/common/empty-state.tsx
import type { JSX, ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: Props): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 3: Crea `loading-spinner.tsx`**

```typescript
// src/components/common/loading-spinner.tsx
import type { JSX } from 'react'

export function LoadingSpinner(): JSX.Element {
  return (
    <div className="flex items-center justify-center py-8" role="status" aria-label="Caricamento">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600" />
    </div>
  )
}
```

- [ ] **Step 4: Crea `error-message.tsx`**

```typescript
// src/components/common/error-message.tsx
import type { JSX } from 'react'
import type { AppError } from '@/types/ui'
import { Button } from './button'

type Props = {
  error: AppError
  onRetry?: () => void
}

export function ErrorMessage({ error, onRetry }: Props): JSX.Element {
  return (
    <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
      <p className="font-medium">{error.message}</p>
      {onRetry && (
        <div className="mt-2">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Riprova
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verifica typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/common/toast-container.tsx src/components/common/empty-state.tsx src/components/common/loading-spinner.tsx src/components/common/error-message.tsx
git commit -m "feat(ui): add ToastContainer, EmptyState, LoadingSpinner, ErrorMessage"
```

---

## Phase 6 — Componenti UI lists

### Task 6.1: `list-card.tsx`

**Files:**
- Create: `src/components/lists/list-card.tsx`

- [ ] **Step 1: Crea il file**

```typescript
// src/components/lists/list-card.tsx
import { useState, type JSX } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import type { List } from '@/db/types'
import { itemRepository } from '@/repositories/item-repository'
import { Button } from '@/components/common/button'
import { Badge } from '@/components/common/badge'

type Props = {
  list: List
  variant?: 'active' | 'archived'
  onArchive(): void
  onUnarchive(): void
  onDelete(): void
  onRename(newName: string): void
}

export function ListCard({ list, variant = 'active', onArchive, onUnarchive, onDelete, onRename }: Props): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(list.name)

  const itemCount = useLiveQuery(
    () => itemRepository.listActiveByList(list.id).then(arr => arr.length),
    [list.id],
    0,
  )

  const handleRename = () => {
    if (editValue.trim() && editValue.trim() !== list.name) {
      onRename(editValue.trim())
    }
    setEditing(false)
  }

  return (
    <li className={`flex items-center justify-between rounded border bg-white p-3 ${variant === 'archived' ? 'opacity-60' : ''}`}>
      <div className="flex-1">
        {editing ? (
          <input
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => { if (e.key === 'Enter') handleRename() }}
            autoFocus
            className="rounded border px-2 py-1"
          />
        ) : (
          <Link to={`/lists/${list.id}`} className="font-medium text-gray-900 hover:text-brand-600">
            {list.name}
          </Link>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <Badge>{itemCount} articoli</Badge>
        </div>
      </div>
      <div className="relative">
        <Button variant="ghost" size="sm" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu lista">
          ⋮
        </Button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded border bg-white shadow-lg">
            <button
              onClick={() => { setEditing(true); setMenuOpen(false) }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              Rinomina
            </button>
            {variant === 'active' ? (
              <button
                onClick={() => { onArchive(); setMenuOpen(false) }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
              >
                Archivia
              </button>
            ) : (
              <button
                onClick={() => { onUnarchive(); setMenuOpen(false) }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
              >
                Disarchivia
              </button>
            )}
            <button
              onClick={() => { onDelete(); setMenuOpen(false) }}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Elimina
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
```

- [ ] **Step 2: Verifica typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/lists/list-card.tsx
git commit -m "feat(ui): add ListCard with menu and live item count"
```

---

### Task 6.2: `list-form.tsx`

**Files:**
- Create: `src/components/lists/list-form.tsx`

- [ ] **Step 1: Crea il file**

```typescript
// src/components/lists/list-form.tsx
import { useState, type JSX, type FormEvent } from 'react'
import { Modal } from '@/components/common/modal'
import { Input } from '@/components/common/input'
import { Button } from '@/components/common/button'
import { validateListName } from '@/utils/validation'

type Props = {
  open: boolean
  initialValue?: string
  onSubmit(name: string): Promise<void>
  onCancel(): void
}

export function ListForm({ open, initialValue = '', onSubmit, onCancel }: Props): JSX.Element {
  const [name, setName] = useState(initialValue)
  const [submitting, setSubmitting] = useState(false)

  const validationError = validateListName(name)
  const canSubmit = !validationError && !submitting

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit(name.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onCancel} title={initialValue ? 'Rinomina lista' : 'Nuova lista'}>
      <form onSubmit={handleSubmit}>
        <Input
          label="Nome lista"
          value={name}
          onChange={e => setName(e.target.value)}
          error={name.length > 0 ? validationError?.message : undefined}
          autoFocus
          maxLength={100}
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Annulla
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {submitting ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/lists/list-form.tsx
git commit -m "feat(ui): add ListForm modal with live validation"
```

---

### Task 6.3: `archived-section.tsx`

**Files:**
- Create: `src/components/lists/archived-section.tsx`

- [ ] **Step 1: Crea il file**

```typescript
// src/components/lists/archived-section.tsx
import { useState, type JSX } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { listRepository } from '@/repositories/list-repository'
import { listService } from '@/services/list-service'
import { ListCard } from './list-card'

type Props = { userId: string }

export function ArchivedSection({ userId }: Props): JSX.Element | null {
  const [expanded, setExpanded] = useState(false)
  const archived = useLiveQuery(
    () => listRepository.listArchivedByUser(userId),
    [userId],
    [],
  )

  if (!archived || archived.length === 0) return null

  return (
    <section className="mt-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        {expanded ? '▼' : '▶'} Archiviate ({archived.length})
      </button>
      {expanded && (
        <ul className="mt-2 space-y-2">
          {archived.map(list => (
            <ListCard
              key={list.id}
              list={list}
              variant="archived"
              onArchive={() => {}}
              onUnarchive={() => listService.unarchiveList(list.id)}
              onDelete={() => listService.deleteList(list.id)}
              onRename={(name) => { listService.updateList(list.id, { name }) }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/lists/archived-section.tsx
git commit -m "feat(ui): add ArchivedSection collapsible component"
```

---

### Task 6.4: `home-page.tsx` rewrite (S1-04, S1-06, S1-07)

**Files:**
- Modify: `src/pages/home-page.tsx`

- [ ] **Step 1: Sovrascrivi `home-page.tsx`**

```typescript
// src/pages/home-page.tsx
import { useState, type JSX } from 'react'
import { useLists } from '@/hooks/use-lists'
import { useAuthStore } from '@/stores/auth-store'
import { useUiStore } from '@/stores/ui-store'
import { ListCard } from '@/components/lists/list-card'
import { ListForm } from '@/components/lists/list-form'
import { ArchivedSection } from '@/components/lists/archived-section'
import { Button } from '@/components/common/button'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { useConfirm } from '@/components/common/confirm-dialog'

export default function HomePage(): JSX.Element {
  const userId = useAuthStore(s => s.userId)
  const { lists, isLoading, create, rename, archive, remove } = useLists()
  const [showForm, setShowForm] = useState(false)
  const { confirm, ConfirmDialog } = useConfirm()
  const pushToast = useUiStore(s => s.pushToast)

  const handleCreate = async (name: string) => {
    const result = await create(name)
    if (result.error) {
      pushToast('error', result.error.message)
      return
    }
    setShowForm(false)
    pushToast('success', 'Lista creata')
  }

  const handleDelete = async (listId: string, listName: string) => {
    const ok = await confirm({
      title: 'Eliminare la lista?',
      message: `"${listName}" e tutti i suoi articoli saranno eliminati.`,
      danger: true,
      confirmText: 'Elimina',
    })
    if (!ok) return
    const result = await remove(listId)
    if (result.error) {
      pushToast('error', result.error.message)
    } else {
      pushToast('success', 'Lista eliminata')
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Le mie liste</h1>
        <Button onClick={() => setShowForm(true)}>+ Nuova lista</Button>
      </header>

      {isLoading && <LoadingSpinner />}

      {!isLoading && lists?.length === 0 && (
        <EmptyState
          title="Nessuna lista"
          description="Crea la tua prima lista della spesa per iniziare."
          action={<Button onClick={() => setShowForm(true)}>Crea lista</Button>}
        />
      )}

      {!isLoading && lists && lists.length > 0 && (
        <ul className="space-y-2">
          {lists.map(list => (
            <ListCard
              key={list.id}
              list={list}
              onArchive={() => archive(list.id)}
              onUnarchive={() => {}}
              onDelete={() => handleDelete(list.id, list.name)}
              onRename={(name) => { rename(list.id, name) }}
            />
          ))}
        </ul>
      )}

      <ArchivedSection userId={userId} />

      <ListForm open={showForm} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      <ConfirmDialog />
    </main>
  )
}
```

- [ ] **Step 2: Verifica typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: PASS.

- [ ] **Step 3: Esegui tutti i test**

```bash
npm run test
```

Expected: tutti i test verdi. La home-page rewrite non rompe nulla perché il vecchio smoke test in `src/test/app.test.tsx` cerca solo "Hello World"... che ora non c'è più.

- [ ] **Step 4: Aggiorna `src/test/app.test.tsx`**

Aggiorna il test smoke per riflettere la nuova HomePage:

```typescript
// src/test/app.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '@/app'
import { db } from '@/db/database'

describe('App smoke', () => {
  beforeEach(async () => {
    await db.lists.clear()
    await db.items.clear()
    await db.changeLog.clear()
  })

  it('mostra HomePage con titolo "Le mie liste"', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('Le mie liste')).toBeInTheDocument()
    })
  })

  it('mostra NotFoundPage su route inesistente', () => {
    render(
      <MemoryRouter initialEntries={['/nonexistent']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText(/404|non trovata/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Esegui test**

```bash
npm run test
```

Expected: tutti verdi.

- [ ] **Step 6: Commit**

```bash
git add src/pages/home-page.tsx src/test/app.test.tsx
git commit -m "feat(pages): rewrite HomePage with full list CRUD UI"
```

---

## Phase 7 — Componenti UI items + pagine

### Task 7.1: `item-row.tsx`

**Files:**
- Create: `src/components/items/item-row.tsx`

- [ ] **Step 1: Crea il file**

```typescript
// src/components/items/item-row.tsx
import { useState, type JSX } from 'react'
import type { Item } from '@/db/types'
import { Button } from '@/components/common/button'
import { Badge } from '@/components/common/badge'

type Props = {
  item: Item
  onToggle(): void
  onEdit(): void
  onDelete(): void
}

export function ItemRow({ item, onToggle, onEdit, onDelete }: Props): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const isCompleted = item.status === 'completed'

  return (
    <li className="flex items-center gap-3 rounded border bg-white p-3">
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={onToggle}
        className="h-5 w-5 cursor-pointer accent-brand-600"
        aria-label={isCompleted ? `Segna ${item.name} come da comprare` : `Segna ${item.name} come completato`}
      />
      <div className={`flex-1 ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
        <div className="font-medium">{item.name}</div>
        {(item.quantity != null || item.notes) && (
          <div className="mt-1 text-xs text-gray-500">
            {item.quantity != null && (
              <span>
                {item.quantity}
                {item.unit ? ` ${item.unit}` : ''}
              </span>
            )}
            {item.notes && <span className="ml-2 italic">{item.notes}</span>}
          </div>
        )}
        {item.category && (
          <div className="mt-1">
            <Badge>{item.category}</Badge>
          </div>
        )}
      </div>
      <div className="relative">
        <Button variant="ghost" size="sm" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu articolo">
          ⋮
        </Button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded border bg-white shadow-lg">
            <button
              onClick={() => { onEdit(); setMenuOpen(false) }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              Modifica
            </button>
            <button
              onClick={() => { onDelete(); setMenuOpen(false) }}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Elimina
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/items/item-row.tsx
git commit -m "feat(ui): add ItemRow with checkbox toggle and menu"
```

---

### Task 7.2: `item-form.tsx`

**Files:**
- Create: `src/components/items/item-form.tsx`

- [ ] **Step 1: Crea il file**

```typescript
// src/components/items/item-form.tsx
import { useState, type JSX, type FormEvent } from 'react'
import type { Item, UnitOfMeasure, Category } from '@/db/types'
import { Modal } from '@/components/common/modal'
import { Input } from '@/components/common/input'
import { Button } from '@/components/common/button'
import { validateItemInput } from '@/utils/validation'

type Props = {
  open: boolean
  item?: Item
  onSubmit(input: {
    name: string
    quantity: number | null
    unit: UnitOfMeasure | null
    category: Category | null
    notes: string | null
  }): Promise<void>
  onCancel(): void
}

const UNITS: UnitOfMeasure[] = ['kg', 'g', 'mg', 'l', 'ml', 'cl', 'pcs', 'pack', 'box', 'bottle', 'can', 'bag']
const CATEGORIES: Category[] = [
  'fruits_vegetables', 'dairy', 'meat_fish', 'beverages', 'frozen',
  'pantry', 'bakery', 'cleaning', 'personal_care', 'other',
]

export function ItemForm({ open, item, onSubmit, onCancel }: Props): JSX.Element {
  const [name, setName] = useState(item?.name ?? '')
  const [quantity, setQuantity] = useState(item?.quantity?.toString() ?? '')
  const [unit, setUnit] = useState<UnitOfMeasure | ''>(item?.unit ?? '')
  const [category, setCategory] = useState<Category | ''>(item?.category ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)

  const parsedQty = quantity === '' ? null : Number(quantity)
  const validationError = validateItemInput({
    name,
    quantity: parsedQty,
    notes: notes || null,
  })
  const canSubmit = !validationError && !submitting

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        quantity: parsedQty,
        unit: unit === '' ? null : unit,
        category: category === '' ? null : category,
        notes: notes.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onCancel} title={item ? 'Modifica articolo' : 'Nuovo articolo'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome"
          value={name}
          onChange={e => setName(e.target.value)}
          error={name.length > 0 ? validationError?.message : undefined}
          autoFocus
          maxLength={100}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantità"
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            min={0}
            max={9999}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="unit-select" className="text-sm font-medium text-gray-700">Unità</label>
            <select
              id="unit-select"
              value={unit}
              onChange={e => setUnit(e.target.value as UnitOfMeasure | '')}
              className="rounded border border-gray-300 px-3 py-2"
            >
              <option value="">—</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="category-select" className="text-sm font-medium text-gray-700">Categoria</label>
          <select
            id="category-select"
            value={category}
            onChange={e => setCategory(e.target.value as Category | '')}
            className="rounded border border-gray-300 px-3 py-2"
          >
            <option value="">—</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="notes-textarea" className="text-sm font-medium text-gray-700">Note</label>
          <textarea
            id="notes-textarea"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={500}
            rows={2}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onCancel}>Annulla</Button>
          <Button type="submit" disabled={!canSubmit}>{submitting ? 'Salvataggio...' : 'Salva'}</Button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/items/item-form.tsx
git commit -m "feat(ui): add ItemForm with all fields and live validation"
```

---

### Task 7.3: `item-quick-add-bar.tsx`

**Files:**
- Create: `src/components/items/item-quick-add-bar.tsx`

- [ ] **Step 1: Crea il file**

```typescript
// src/components/items/item-quick-add-bar.tsx
import { useState, useRef, type JSX, type FormEvent } from 'react'
import type { Item } from '@/db/types'
import type { AppResult } from '@/types/ui'
import { Input } from '@/components/common/input'
import { Button } from '@/components/common/button'
import { useUiStore } from '@/stores/ui-store'

type Props = {
  onSubmit(name: string): Promise<AppResult<Item>>
}

export function ItemQuickAddBar({ onSubmit }: Props): JSX.Element {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pushToast = useUiStore(s => s.pushToast)

  const trimmed = name.trim()
  const canSubmit = trimmed.length > 0 && !submitting

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    const result = await onSubmit(trimmed)
    setSubmitting(false)
    if (result.error) {
      pushToast('error', result.error.message)
      return
    }
    setName('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="sticky bottom-0 border-t bg-white p-4">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Aggiungi articolo..."
          disabled={submitting}
          maxLength={100}
          aria-label="Nome nuovo articolo"
          className="flex-1"
        />
        <Button type="submit" disabled={!canSubmit}>Aggiungi</Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/items/item-quick-add-bar.tsx
git commit -m "feat(ui): add ItemQuickAddBar sticky bottom input"
```

---

### Task 7.4: `item-trash-row.tsx`

**Files:**
- Create: `src/components/items/item-trash-row.tsx`

- [ ] **Step 1: Crea il file**

```typescript
// src/components/items/item-trash-row.tsx
import type { JSX } from 'react'
import type { Item } from '@/db/types'
import { Button } from '@/components/common/button'

type Props = {
  item: Item
  onRestore(): void
}

function formatRelativeDate(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'oggi'
  if (diffDays === 1) return '1 giorno fa'
  if (diffDays < 30) return `${diffDays} giorni fa`
  return `${Math.floor(diffDays / 30)} mesi fa`
}

export function ItemTrashRow({ item, onRestore }: Props): JSX.Element {
  return (
    <li className="flex items-center justify-between rounded border bg-gray-50 p-3">
      <div>
        <div className="font-medium text-gray-700">{item.name}</div>
        <div className="text-xs text-gray-500">
          Eliminato {item.deletedAt != null ? formatRelativeDate(item.deletedAt) : ''}
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={onRestore}>Ripristina</Button>
    </li>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/items/item-trash-row.tsx
git commit -m "feat(ui): add ItemTrashRow with relative date formatting"
```

---

### Task 7.5: `list-page.tsx` (S1-11, S1-12, S1-14)

**Files:**
- Create: `src/pages/list-page.tsx`

- [ ] **Step 1: Crea il file**

```typescript
// src/pages/list-page.tsx
import { useState, type JSX } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Item } from '@/db/types'
import { useItems } from '@/hooks/use-items'
import { useUiStore } from '@/stores/ui-store'
import { listRepository } from '@/repositories/list-repository'
import { itemRepository } from '@/repositories/item-repository'
import { ItemRow } from '@/components/items/item-row'
import { ItemForm } from '@/components/items/item-form'
import { ItemQuickAddBar } from '@/components/items/item-quick-add-bar'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { useConfirm } from '@/components/common/confirm-dialog'
import NotFoundPage from './not-found-page'

export default function ListPage(): JSX.Element {
  const { listId } = useParams<{ listId: string }>()
  const { items, isLoading, create, update, toggle, remove } = useItems(listId!)
  const list = useLiveQuery(() => listRepository.getById(listId!), [listId])
  const trashCount = useLiveQuery(
    () => itemRepository.listDeletedByList(listId!).then(arr => arr.length),
    [listId],
    0,
  )
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const { confirm, ConfirmDialog } = useConfirm()
  const pushToast = useUiStore(s => s.pushToast)

  if (list === undefined) return <LoadingSpinner />
  if (list === null || list.deletedAt !== null) return <NotFoundPage />

  const handleDelete = async (item: Item) => {
    const ok = await confirm({
      title: 'Eliminare l\'articolo?',
      message: `"${item.name}" sarà spostato nel cestino.`,
      danger: true,
      confirmText: 'Elimina',
    })
    if (!ok) return
    const result = await remove(item.id)
    if (result.error) {
      pushToast('error', result.error.message)
    }
  }

  const handleUpdate = async (changes: Parameters<typeof update>[1]) => {
    if (!editingItem) return
    const result = await update(editingItem.id, changes)
    if (result.error) {
      pushToast('error', result.error.message)
      return
    }
    setEditingItem(null)
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b bg-white p-4">
        <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">← Indietro</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{list.name}</h1>
        <Link
          to={`/lists/${listId}/trash`}
          className="mt-1 inline-block text-sm text-gray-500 hover:text-gray-700"
        >
          Cestino ({trashCount ?? 0})
        </Link>
      </header>

      <section className="mx-auto w-full max-w-2xl flex-1 p-4">
        {isLoading && <LoadingSpinner />}
        {!isLoading && items?.length === 0 && (
          <EmptyState title="Lista vuota" description="Aggiungi il primo articolo qui sotto." />
        )}
        {!isLoading && items && items.length > 0 && (
          <ul className="space-y-2">
            {items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={() => toggle(item.id)}
                onEdit={() => setEditingItem(item)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </ul>
        )}
      </section>

      <ItemQuickAddBar onSubmit={(name) => create({ name })} />

      {editingItem && (
        <ItemForm
          open={true}
          item={editingItem}
          onSubmit={handleUpdate}
          onCancel={() => setEditingItem(null)}
        />
      )}
      <ConfirmDialog />
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/list-page.tsx
git commit -m "feat(pages): add ListPage with item CRUD and trash link"
```

---

### Task 7.6: `trash-page.tsx` (S1-15)

**Files:**
- Create: `src/pages/trash-page.tsx`

- [ ] **Step 1: Crea il file**

```typescript
// src/pages/trash-page.tsx
import type { JSX } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useDeletedItems } from '@/hooks/use-deleted-items'
import { useUiStore } from '@/stores/ui-store'
import { listRepository } from '@/repositories/list-repository'
import { ItemTrashRow } from '@/components/items/item-trash-row'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import NotFoundPage from './not-found-page'

export default function TrashPage(): JSX.Element {
  const { listId } = useParams<{ listId: string }>()
  const { items, isLoading, restore } = useDeletedItems(listId!)
  const list = useLiveQuery(() => listRepository.getById(listId!), [listId])
  const pushToast = useUiStore(s => s.pushToast)

  if (list === undefined) return <LoadingSpinner />
  if (list === null || list.deletedAt !== null) return <NotFoundPage />

  const handleRestore = async (id: string) => {
    const result = await restore(id)
    if (result.error) {
      pushToast('error', result.error.message)
    } else {
      pushToast('success', 'Articolo ripristinato')
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <Link to={`/lists/${listId}`} className="text-sm text-gray-600 hover:text-gray-900">
          ← {list.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Cestino</h1>
      </header>

      {isLoading && <LoadingSpinner />}
      {!isLoading && items?.length === 0 && <EmptyState title="Cestino vuoto" />}
      {!isLoading && items && items.length > 0 && (
        <ul className="space-y-2">
          {items.map(item => (
            <ItemTrashRow key={item.id} item={item} onRestore={() => handleRestore(item.id)} />
          ))}
        </ul>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/trash-page.tsx
git commit -m "feat(pages): add TrashPage with restore action"
```

---

## Phase 8 — Wire & Verify

### Task 8.1: Aggiorna routing in `app.tsx`

**Files:**
- Modify: `src/app.tsx`

- [ ] **Step 1: Sovrascrivi `app.tsx`**

```typescript
// src/app.tsx
import type { JSX } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/home-page'
import ListPage from '@/pages/list-page'
import TrashPage from '@/pages/trash-page'
import NotFoundPage from '@/pages/not-found-page'
import { ToastContainer } from '@/components/common/toast-container'

export default function App(): JSX.Element {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lists/:listId" element={<ListPage />} />
        <Route path="/lists/:listId/trash" element={<TrashPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer />
    </>
  )
}
```

- [ ] **Step 2: Verifica typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: PASS.

- [ ] **Step 3: Esegui tutti i test**

```bash
npm run test
```

Expected: tutti i ~75 test verdi.

- [ ] **Step 4: Esegui coverage**

```bash
npx vitest run --coverage src/services/
```

Expected: `listService` e `itemService` al **100% line + branch**.

- [ ] **Step 5: Commit**

```bash
git add src/app.tsx
git commit -m "feat(routing): wire ListPage, TrashPage, ToastContainer in app"
```

---

### Task 8.2: Manual smoke test offline-first

**Files:** nessun file modificato.

- [ ] **Step 1: Avvia dev server**

```bash
npm run dev
```

Expected: `Local: https://localhost:5173/`. Apri Chrome e accetta il certificato self-signed.

- [ ] **Step 2: DevTools → Network → Offline**

Apri DevTools (F12) → Network tab → seleziona "Offline" dal throttling dropdown.

- [ ] **Step 3: Esegui la checklist funzionale del DoD §13.2**

Verifica manualmente, una per una:

- [ ] Crea una lista da HomePage (clicca "+ Nuova lista", inserisci nome, salva)
- [ ] Modifica nome lista (menu ⋮ → Rinomina)
- [ ] Archivia una lista → scompare dalla vista principale → appare in `ArchivedSection` (espandibile in fondo)
- [ ] Disarchivia una lista → torna nella vista principale
- [ ] Cancella una lista → ConfirmDialog → conferma → scompare
- [ ] Apri una lista (click su nome lista) → naviga a `/lists/:id`
- [ ] Aggiungi articolo via `ItemQuickAddBar` → appare in fondo
- [ ] Aggiungi 3 articoli in sequenza (verifica auto-focus dopo enter)
- [ ] Toggle stato articolo (tap su checkbox) → animazione strikethrough
- [ ] Modifica articolo (menu ⋮ → Modifica → cambia campi → salva)
- [ ] Cancella articolo (menu ⋮ → Elimina → conferma) → scompare
- [ ] Vai al cestino (link "Cestino (N)" sotto il titolo lista) → vedi articoli cancellati
- [ ] Ripristina articolo dal cestino → torna nella lista
- [ ] Cancella la lista parent → torna in HomePage → naviga manualmente a `/lists/<id>/trash` → redirect a NotFoundPage
- [ ] Crea articolo con nome vuoto → toast errore "Il nome dell'articolo non può essere vuoto"
- [ ] Crea articolo con nome > 100 caratteri → toast errore
- [ ] **Tutto sopra ha funzionato con Network → Offline ✓**

- [ ] **Step 4: Verifica IndexedDB in DevTools**

DevTools → Application → IndexedDB → ShoppingListDB → verifica che `lists`, `items`, `changeLog` contengano i record creati durante il test. Verifica che ogni operazione abbia generato una entry in `changeLog`.

- [ ] **Step 5: Termina dev server**

```bash
# Ctrl+C nel terminal
```

- [ ] **Step 6: Niente commit (test manuale, nessun file modificato)**

---

### Task 8.3: Aggiorna `mappa-progetto.md` (S1-20)

**Files:**
- Modify: `docs/mappa-progetto.md`

- [ ] **Step 1: Aggiungi sezione "Stato Sprint 1" in cima al documento**

Apri `docs/mappa-progetto.md` e aggiungi DOPO la sezione "Stato Sprint 0" (e prima di "Configurazione Claude Code"):

```markdown
## Stato Sprint 1 (2026-04-XX)

Sprint 1 (Core Offline) ha popolato i layer repository, service, hook, UI e utility. La struttura effettiva al termine dello Sprint 1 è quella elencata di seguito.

### Source (`src/`) — file aggiunti

#### Repositories (`src/repositories/`)
- `list-repository.ts` + `list-repository.test.ts`
- `item-repository.ts` + `item-repository.test.ts`
- `change-log-repository.ts`

#### Services (`src/services/`)
- `list-service.ts` + `list-service.test.ts`
- `item-service.ts` + `item-service.test.ts`
- `_internal/domain-error.ts`
- `_internal/map-db-error.ts`

#### Hooks (`src/hooks/`)
- `use-lists.ts` + `use-lists.test.ts`
- `use-items.ts` + `use-items.test.ts`
- `use-deleted-items.ts` + `use-deleted-items.test.ts`

#### Components (`src/components/`)
- `common/` — button, input, badge, modal, confirm-dialog, toast-container, empty-state, loading-spinner, error-message
- `lists/` — list-card, list-form, archived-section
- `items/` — item-row, item-form, item-quick-add-bar, item-trash-row

#### Pages (`src/pages/`) — modificati
- `home-page.tsx` (rewrite completo)
- `list-page.tsx` (NUOVO)
- `trash-page.tsx` (NUOVO)

#### Utils (`src/utils/`)
- `validation.ts` + `validation.test.ts`
- `id-utils.ts`
- `diff.ts` + `diff.test.ts`

#### Stores (`src/stores/`) — modificati
- `ui-store.ts` (rewrite con toast queue)

#### Root (`src/`) — modificati
- `app.tsx` (route /lists/:listId, /lists/:listId/trash, ToastContainer)
- `test/app.test.tsx` (smoke aggiornato post-rewrite home-page)

### Dipendenze aggiunte
- `@radix-ui/react-dialog` (focus trap per Modal/ConfirmDialog)
- `dexie-react-hooks` (useLiveQuery reattiva)

### Cosa NON è ancora presente
- Nessun file in `src/services/` per auth, sync, permissions, conflict, catalog (Sprint 2-5)
- Nessun file in `src/components/` per auth, sync, layout (Sprint 2-3)
- Nessun E2E test in `e2e/` (Sprint 3+)
```

- [ ] **Step 2: Aggiorna data dell'aggiornamento finale del documento**

In fondo al file, aggiorna l'ultimo aggiornamento:

```markdown
*Ultimo aggiornamento: aggiornato post-Sprint 1 (vedi sezione "Stato Sprint 1")*
```

- [ ] **Step 3: Commit**

```bash
git add docs/mappa-progetto.md
git commit -m "docs: update mappa-progetto with Sprint 1 file layout"
```

---

### Task 8.4: Aggiorna `piano-sviluppo.md` con stato Sprint 1 completato

**Files:**
- Modify: `docs/piano-sviluppo.md`

- [ ] **Step 1: Marca tutti i task Sprint 1 come `[✅]`**

Nella sezione "Sprint 1 — Core Offline: Liste e Articoli (Settimane 2-3)", cambia ogni `[ ]` in `[✅]` per S1-01..S1-20.

Aggiungi una riga per i 5 task nuovi emersi dal brainstorming:

```markdown
| S1-01b | — | list-repository smoke test (5 test) | 0.5h | [✅] |
| S1-03b | — | use-lists test (4 test) | 1h | [✅] |
| S1-08b | — | item-repository smoke test (5 test) | 0.5h | [✅] |
| S1-10b | — | use-items test (4 test) | 1h | [✅] |
| S1-15b | — | use-deleted-items test (3 test) | 1h | [✅] |
```

E aggiungi sotto la tabella:

```markdown
**✅ Milestone M2 raggiunta:** CRUD completo offline funzionante. Vedi `docs/superpowers/specs/2026-04-14-sprint-1-core-offline-design.md` per il design e `docs/superpowers/plans/2026-04-14-sprint-1-core-offline-plan.md` per il plan eseguito.
```

- [ ] **Step 2: Aggiorna `CLAUDE.md` "Stato Progetto"**

Apri `CLAUDE.md`. Nella sezione "Stato Progetto", aggiorna lo sprint corrente:

```markdown
### Sprint corrente: Sprint 1 ✅ completato — Sprint 2 pronto a partire

L'app supporta CRUD completo di liste e articoli offline-first.
Tutto funziona con DevTools → Network → Offline. Sprint 2 (Auth)
sostituirà l'auth-store stub con auth Supabase reale.
```

E aggiorna la sezione "Cosa funziona oggi":

```markdown
### Cosa funziona oggi

- `npm run dev` → app su https://localhost:5173 con HomePage CRUD
- Crea/modifica/archivia/elimina liste
- Naviga a /lists/:id per vedere articoli, aggiungi/modifica/toggle/elimina
- Naviga a /lists/:id/trash per ripristinare articoli cancellati
- Tutte le operazioni funzionano offline (DevTools → Network → Offline)
- changeLog popolato per ogni mutation (visibile in DevTools → IndexedDB)
- ~75 unit test verdi, services al 100% coverage
- `npm run typecheck` / `npm run lint` passano
```

- [ ] **Step 3: Commit finale Sprint 1**

```bash
git add docs/piano-sviluppo.md CLAUDE.md
git commit -m "docs: mark Sprint 1 as completed in piano-sviluppo and CLAUDE.md"
```

---

## Phase 9 — Final verification (Definition of Done)

### Task 9.1: Verifica completa quality gates

**Files:** nessuno.

- [ ] **Step 1: Typecheck**

```bash
npm run typecheck
```

Expected: PASS senza errori.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: PASS senza errori.

- [ ] **Step 3: Test totali**

```bash
npm run test
```

Expected: tutti i ~75 test verdi.

- [ ] **Step 4: Coverage services**

```bash
npx vitest run --coverage src/services/
```

Expected: `listService` 100% line + branch, `itemService` 100% line + branch.

- [ ] **Step 5: Build production**

```bash
npm run build
```

Expected: build successo, output in `dist/`.

- [ ] **Step 6: Preview PWA**

```bash
npm run preview
```

Expected: app installabile da Chrome (icona "Install" nella URL bar).

- [ ] **Step 7: Self-check checklist (CLAUDE.md)**

Verifica manualmente:

- [ ] Tutti i file rispettano i limiti LOC (target < 200, max 400)
- [ ] Niente `any` o `// @ts-ignore` in tutto il diff Sprint 1
- [ ] Niente `console.log` di debug residui
- [ ] Niente file kebab-case violato (es. `HomePage.tsx`)
- [ ] Tutti gli import usano `@/` (mai relativi `../`)
- [ ] `docs/mappa-progetto.md` aggiornato

- [ ] **Step 8: Commit finale (se ci sono file dimenticati)**

```bash
git status
```

Se pulito: niente da committare. Sprint 1 completo.

---

## Self-Review (post plan writing)

### Spec coverage check

Ogni RF dello spec è coperto da almeno una task del plan?

- ✅ RF-LIST-001 (Creazione lista) → Task 3.1, 6.2, 6.4
- ✅ RF-LIST-002 (Modifica nome) → Task 3.2, 6.1, 6.4
- ✅ RF-LIST-003 (Soft delete cascade) → Task 3.4, 6.4
- ✅ RF-LIST-004 (Archive/unarchive) → Task 3.3, 6.3, 6.4
- ✅ RF-ITEM-001 (Aggiunta rapida) → Task 3.5, 7.3, 7.5
- ✅ RF-ITEM-002 (Toggle stato) → Task 3.7, 7.1, 7.5
- ✅ RF-ITEM-003 (Modifica articolo) → Task 3.6, 7.2, 7.5
- ✅ RF-ITEM-004 (Soft delete articolo) → Task 3.8, 7.5
- ✅ RF-ITEM-005 (Ripristino dal cestino) → Task 3.9, 7.4, 7.6

### Task coverage del piano-sviluppo

Tutti i 25 task (20 originali + 5 nuovi) sono presenti?

- S1-01 (listRepository) → Task 2.2 ✅
- S1-01b (list-repository test) → Task 2.2 (incluso TDD) ✅
- S1-02 (listService) → Task 3.1, 3.2, 3.3, 3.4 ✅
- S1-03 (useLists) → Task 4.1 ✅
- S1-03b (useLists test) → Task 4.1 ✅
- S1-04 (HomePage + ListCard) → Task 6.1, 6.4 ✅
- S1-05 (ListForm) → Task 6.2 ✅
- S1-06 (deleteList cascade) → Task 3.4 ✅
- S1-07 (archive/unarchive) → Task 3.3, 6.3 ✅
- S1-08 (itemRepository) → Task 2.3 ✅
- S1-08b (item-repository test) → Task 2.3 ✅
- S1-09 (itemService) → Task 3.5, 3.6, 3.8 ✅
- S1-10 (useItems) → Task 4.2 ✅
- S1-10b (useItems test) → Task 4.2 ✅
- S1-11 (ListPage + ItemRow) → Task 7.1, 7.5 ✅
- S1-12 (toggleItemStatus) → Task 3.7, 7.1 ✅
- S1-13 (ItemForm) → Task 7.2 ✅
- S1-14 (deleteItem) → Task 3.8 ✅
- S1-15 (TrashPage + restoreItem) → Task 3.9, 4.3, 7.4, 7.6 ✅
- S1-15b (useDeletedItems test) → Task 4.3 ✅
- S1-16 (changeLogRepository + diff) → Task 1.3, 2.1 ✅
- S1-17 (componenti common) → Task 5.1, 5.2, 5.3, 5.4 ✅
- S1-18 (listService test 100%) → Task 3.1-3.4 (TDD interleaved) ✅
- S1-19 (itemService test 100%) → Task 3.5-3.9 (TDD interleaved) ✅
- S1-20 (mappa-progetto) → Task 8.3 ✅

### Type/method consistency

Verificato che `useLists`, `useItems`, `useDeletedItems` espongano metodi consistenti tra plan e spec. Verificato che `CreateItemInput`/`UpdateItemInput` siano definiti in `item-service.ts` e importati dove serve. Verificato che il discriminante `AppResult` sia sempre `{ data, error: null }` e mai `{ ok: true }`.

### Placeholder scan

Nessun "TBD", "TODO", "implement later", "similar to Task N", "appropriate error handling". Tutto il codice è completo, ogni step ha contenuto eseguibile.

---

## Summary

**Total tasks:** 33 task across 9 phases
**Total commits attesi:** ~33 (uno per task task, alcuni multi-step)
**Stima ore (umano focused):** ~52.5h come da spec §11

**Phasing:**
- Phase 0: Setup (1 task)
- Phase 1: Utilities (4 task)
- Phase 2: Repositories (3 task)
- Phase 3: Services (9 task — uno per metodo)
- Phase 4: Hooks (3 task)
- Phase 5: UI common (4 task)
- Phase 6: UI lists (4 task)
- Phase 7: UI items + pages (6 task)
- Phase 8: Wire & verify (4 task)
- Phase 9: Final DoD (1 task)

**Esecuzione TDD:** ogni metodo service ha test scritti PRIMA dell'implementazione, eseguiti per verificare il fail, poi implementati per il pass. Ogni task ends con commit.

---

*Documento: `docs/superpowers/plans/2026-04-14-sprint-1-core-offline-plan.md`*
*Stato: pronto per esecuzione*
