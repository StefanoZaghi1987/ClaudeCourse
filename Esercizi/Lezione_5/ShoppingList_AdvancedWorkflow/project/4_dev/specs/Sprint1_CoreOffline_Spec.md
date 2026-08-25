# Design Spec — Sprint 1: Core Offline (Liste e Articoli)

| Campo | Valore |
|-------|--------|
| **Titolo** | Sprint 1 — Core Offline: CRUD Liste e Articoli |
| **Data** | 2026-04-14 |
| **Stato** | Draft — in attesa di review utente |
| **Sprint target** | Sprint 1 — `docs/piano-sviluppo.md` |
| **Metodologia** | Spec-Driven Development con `superpowers:brainstorming` skill |
| **Brainstorm summary** | [`docs/superpowers/brainstorms/2026-04-14-sprint-1-core-offline-brainstorm.md`](../brainstorms/2026-04-14-sprint-1-core-offline-brainstorm.md) |
| **Fonte autoritativa requisiti** | `docs/SoftwareRequirements.md` §RF-LIST-001..004, §RF-ITEM-001..005, §4.2/4.3 |
| **Sprint precedente** | Sprint 0 — `docs/specs/Sprint0_Setup_Spec.md` (skeleton offline-only completato 2026-04-13) |
| **Prossimo step dopo approvazione** | `superpowers:writing-plans` per il plan implementativo dei 25 task |

---

## 1. Executive Summary

Questo design definisce l'implementazione di **Sprint 1: Core Offline (Liste e Articoli)** del progetto ShoppingList MVP. L'obiettivo è realizzare il CRUD completo di liste della spesa e dei loro articoli funzionante **interamente offline**, sopra lo skeleton di Sprint 0 (Dexie v1, stub auth, PWA installabile).

**Risultato atteso:** ~40 file nuovi distribuiti su 5 layer (repository, service, hook, UI, utility) + 4 file esistenti modificati, 10 metodi service con copertura test 100%, ~72 unit test totali, 1 nuova dipendenza runtime (`@radix-ui/react-dialog`), zero accesso di rete in qualsiasi flusso utente. L'app passa il criterio di completamento "tutte le operazioni funzionano con DevTools → Network → Offline" e mantiene `npm run typecheck` + `npm run lint` + `npm run test` verdi.

**Decisioni di scope chiave:**
- **`Item.sortOrder`** è l'unica fonte di ordinamento; `List.itemOrder` resta `[]`
- **Solo tap/click** — nessuna gesture swipe (rinviata a V1.0 Modalità Shopping)
- **Solo TrashPage** — nessun undo toast con azioni (rinviato a V1.0 con `useUndo`)

**Decisioni architetturali chiave:**
- **ChangeLog scritto al layer service** dentro `db.transaction()` esplicita, repository restano CRUD puri
- **Cestino per-lista** (`/lists/:listId/trash`), non globale
- **Cascade delete eager** con una entry changeLog per ogni entità coinvolta, atomicamente
- **Diff minimale** in `ChangeLogEntry.changes` per UPDATE (snapshot completo solo per CREATE e DELETE)
- **`AppResult<T>`** già definito da Sprint 0 come unico canale di propagazione errori; tutti i service ritornano `AppResult`, mai throw

---

## 2. Contesto e motivazione

### 2.1 Stato di Sprint 0 (input)

Lo Sprint 0 (completato 2026-04-13) ha lasciato uno skeleton offline-only con:

- DB Dexie v1 inizializzato (`src/db/database.ts`) con tabelle `lists`, `items`, `changeLog`, `itemCatalog`, `invites` e indici come da SRS §4.2
- Tipi entità in `src/db/types.ts` (importati letteralmente da SRS §4.3)
- `src/types/ui.ts` con `AppError` e `AppResult<T>` già definiti
- `auth-store` stub in `src/stores/auth-store.ts` che ritorna `userId: 'local-user-stub'`, `isGuest: true`
- Routing minimale (`HomePage` "Hello World", `NotFoundPage`)
- Vitest + `fake-indexeddb` + Testing Library già configurati in `src/test/setup.ts`
- Cartelle `src/components/`, `src/hooks/`, `src/services/`, `src/repositories/`, `src/utils/` **intenzionalmente non create** in Sprint 0

### 2.2 Cosa Sprint 1 aggiunge

Sprint 1 popola le 5 cartelle vuote con i layer di dominio per il CRUD di liste e articoli. **Nessuna interazione di rete** in alcun flusso (Supabase resta stub, sync rimandato a Sprint 3). L'utente è sempre `'local-user-stub'`, sempre guest, sempre owner implicito di tutte le sue liste — i permessi RBAC arrivano con Sprint 4.

### 2.3 Requisiti funzionali coperti

| RF | Nome | Coperto da |
|----|------|-----------|
| RF-LIST-001 | Creazione lista | S1-01, S1-02, S1-03, S1-04, S1-05 |
| RF-LIST-002 | Modifica nome lista | S1-02, S1-04, S1-05 |
| RF-LIST-003 | Soft delete lista (cascade) | S1-02, S1-06 |
| RF-LIST-004 | Archiviazione lista | S1-02, S1-04, S1-07 |
| RF-ITEM-001 | Aggiunta rapida articolo | S1-08, S1-09, S1-10, S1-11 (autocomplete escluso) |
| RF-ITEM-002 | Toggle stato articolo | S1-09, S1-12 (solo tap, no swipe) |
| RF-ITEM-003 | Modifica articolo | S1-09, S1-13 |
| RF-ITEM-004 | Soft delete articolo | S1-09, S1-14 (no undo toast) |
| RF-ITEM-005 | Ripristino dal cestino | S1-09, S1-15 (per-lista, no globale) |

### 2.4 Vincoli non funzionali rispettati

Da `CLAUDE.md` "Standard di Codice":

- File: target < 200 LOC, max 400 LOC, warning a 150 LOC
- Funzione: max 20 LOC, max 4 parametri, una sola responsabilità
- Componente React: max 200 LOC, no business logic inline
- Duplicazione: estrai alla 3ª occorrenza
- Nesting: max 3 livelli
- TypeScript strict, no `any`
- File naming: kebab-case obbligatorio (`home-page.tsx`, non `HomePage.tsx`)
- Import: sempre via path alias `@/foo`, mai relativi `../`

---

## 3. Architettura: vista d'insieme

### 3.1 Layer cake e regola del flusso

`CLAUDE.md` impone la regola dei layer non negoziabile:

```
UI (React Components / Pages)
    ↓ chiama
Custom Hooks (useLists, useItems, useDeletedItems)
    ↓ chiama
Services (listService, itemService) ← APRE TRANSAZIONI DEXIE
    ↓ chiama
Repositories (listRepository, itemRepository, changeLogRepository) ← CRUD PURO
    ↓ chiama
Dexie.js (IndexedDB locale)
```

**Regola assoluta:** ogni layer chiama solo il layer direttamente sottostante. Niente salti. Niente UI che chiama un repository, niente hook che apre transazioni, niente repository con business logic.

### 3.2 File map di Sprint 1 (delta su Sprint 0)

```
src/
├── repositories/                       ← NUOVA cartella [3 file]
│   ├── list-repository.ts              [S1-01]
│   ├── list-repository.test.ts         [S1-01b]
│   ├── item-repository.ts              [S1-08]
│   ├── item-repository.test.ts         [S1-08b]
│   └── change-log-repository.ts        [parte di S1-16]
│
├── services/                           ← NUOVA cartella
│   ├── list-service.ts                 [S1-02, S1-06, S1-07]
│   ├── list-service.test.ts            [S1-18]
│   ├── item-service.ts                 [S1-09, S1-12, S1-14]
│   ├── item-service.test.ts            [S1-19]
│   └── _internal/
│       ├── domain-error.ts             [parte di S1-02]
│       └── map-db-error.ts             [parte di S1-02]
│
├── hooks/                              ← NUOVA cartella
│   ├── use-lists.ts                    [S1-03]
│   ├── use-lists.test.ts               [S1-03b]
│   ├── use-items.ts                    [S1-10]
│   ├── use-items.test.ts               [S1-10b]
│   ├── use-deleted-items.ts            [parte di S1-15]
│   └── use-deleted-items.test.ts       [S1-15b]
│
├── components/                         ← NUOVA cartella
│   ├── common/                         [S1-17 — 9 file]
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── modal.tsx                   ← usa @radix-ui/react-dialog
│   │   ├── confirm-dialog.tsx
│   │   ├── toast-container.tsx
│   │   ├── empty-state.tsx
│   │   ├── loading-spinner.tsx
│   │   └── error-message.tsx
│   ├── lists/                          [S1-04, S1-05, S1-07]
│   │   ├── list-card.tsx
│   │   ├── list-form.tsx
│   │   └── archived-section.tsx
│   └── items/                          [S1-11, S1-13, S1-15]
│       ├── item-row.tsx
│       ├── item-form.tsx
│       ├── item-quick-add-bar.tsx
│       └── item-trash-row.tsx
│
├── pages/
│   ├── home-page.tsx                   ← REWRITE [S1-04]
│   ├── list-page.tsx                   ← NUOVO [S1-11]
│   └── trash-page.tsx                  ← NUOVO [S1-15]
│
├── utils/                              ← NUOVA cartella
│   ├── validation.ts                   [parte di S1-02, S1-09]
│   ├── validation.test.ts              [parte di S1-02]
│   ├── id-utils.ts                     [parte di S1-02]
│   ├── diff.ts                         [parte di S1-16]
│   └── diff.test.ts                    [parte di S1-16]
│
├── stores/
│   └── ui-store.ts                     ← REWRITE [parte di S1-17] (toast queue)
│
└── app.tsx                             ← UPDATE: nuove route /lists/:listId, /lists/:listId/trash

docs/
└── mappa-progetto.md                   ← UPDATE [S1-20]
```

**Totale:** ~40 file nuovi (di cui ~17 test files) + 4 file esistenti modificati (`home-page.tsx` rewrite, `ui-store.ts` rewrite, `app.tsx` update, `docs/mappa-progetto.md` update). Tutto kebab-case.

### 3.3 Flusso di chiamata di esempio (creazione articolo)

```
1.  ItemQuickAddBar.handleSubmit(name="Latte")
2.    └─→ useItems(listId).create({ name: "Latte" })
3.          └─→ itemService.createItem({ listId, name: "Latte" })
4.                ├─→ validateItemInput({ name }) [pure utility]
5.                └─→ db.transaction('rw', db.items, db.changeLog, async (tx) => {
6.                      ├─→ itemRepository.getMaxSortOrder(listId, tx)
7.                      ├─→ itemRepository.create(newItem, tx)
8.                      └─→ changeLogRepository.append(entry, tx)
9.                    })
10. ←─ ritorna AppResult<Item>: { data: Item, error: null }
11. useLiveQuery in useItems re-emette automaticamente (Dexie commit notification)
12. ListPage re-render: nuovo ItemRow appare in fondo alla lista
13. ItemQuickAddBar: input cleared + auto-focus per inserimento successivo
```

**Note chiave:**
- Il punto 11 è il meccanismo di "optimistic UI" automatico: `useLiveQuery` riemette al commit della transazione (sub-millisecond), quindi l'utente vede il cambiamento istantaneamente senza alcun codice di optimistic update manuale
- I service **non chiamano direttamente Dexie** se non per `db.transaction(...)`. Tutte le mutazioni interne passano dai repository
- I repository accettano un parametro opzionale `tx?: Transaction` per partecipare alla transazione del chiamante

---

## 4. Layer Repository

### 4.1 Contratto

I repository sono **thin wrapper** intorno a Dexie. Regole:

1. Ogni metodo di mutazione accetta `tx?: Transaction` opzionale per partecipare alla transazione del chiamante. Se assente, opera fuori transazione.
2. **Niente business logic**: no validazione input, no diff before/after, no scrittura changeLog, no calcolo di `userId`, no `Date.now()`. Tutti questi parametri arrivano calcolati dal service.
3. **Niente `throw` semantici**: i repository propagano errori Dexie nativi senza wrapping. Il service li converte in `AppError` via `mapDbError`.
4. **Filtri di dominio limitati alle read reattive di pagina**: i metodi `listByUser`, `listActiveByList`, `listDeletedByList` includono il filtro `deletedAt` perché sono pensati per essere consumati da `useLiveQuery` e l'UI non deve mai vedere entità cancellate. I metodi generici (`getById`, `update`) sono "raw" — il service decide quando filtrare.

### 4.2 `src/repositories/list-repository.ts` [S1-01]

```typescript
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

  /** Read reattiva: liste archiviate non cancellate */
  async listArchivedByUser(userId: string): Promise<List[]> {
    const items = await db.lists
      .where('userId').equals(userId)
      .and(l => l.deletedAt === null && l.status === 'archived')
      .toArray()
    return items.sort((a, b) => b.updatedAt - a.updatedAt)
  },
}
```

### 4.3 `src/repositories/item-repository.ts` [S1-08]

```typescript
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

### 4.4 `src/repositories/change-log-repository.ts` [parte di S1-16]

```typescript
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

  // Sprint 3 aggiungerà: listPending, markSynced, ecc.
}
```

### 4.5 Test repository (S1-01b, S1-08b)

**`src/repositories/list-repository.test.ts`** — 5 test smoke:

1. `create → getById` round-trip preserva tutti i campi
2. `listByUser` filtra correttamente `deletedAt !== null`
3. `listByUser` filtra correttamente `status !== 'active'`
4. `update` modifica solo i campi passati nel `Partial<List>`
5. `listByUser` ordina per `updatedAt desc`

**`src/repositories/item-repository.test.ts`** — 5 test smoke:

1. `create → getById` round-trip
2. `listActiveByList` ordina per `sortOrder asc`
3. `listActiveByList` filtra `deletedAt !== null`
4. `getMaxSortOrder` su lista vuota ritorna `0`
5. `listActiveInList` materializza array dentro transazione esplicita

Tooling: `fake-indexeddb` da `src/test/setup.ts` (già configurato in Sprint 0). Pattern `beforeEach` per `db.<table>.clear()`.

---

## 5. Layer Service

### 5.1 Contratto

I service contengono **tutto il dominio** di Sprint 1: validazione input, calcolo diff, gestione transazioni, scrittura changeLog, mapping errori. Sono l'unico layer che apre transazioni Dexie.

**Regole:**

1. **Mai `throw` esce dal modulo service.** Tutti i metodi pubblici ritornano `Promise<AppResult<T>>`.
2. **Tutte le mutazioni dentro `db.transaction('rw', <tabelle>, db.changeLog, ...)`** — atomicità garantita dal motore IndexedDB.
3. **`DomainError` interno per triggerare rollback**: dentro la callback della transazione, lanciare `DomainError` causa il rollback automatico di Dexie. Il `catch` esterno converte in `AppError`.
4. **Diff calcolato prima della scrittura nel log** via `buildDiff()` per UPDATE; snapshot completo per CREATE/DELETE; sottoinsieme fisso `{status, completedAt}` per STATE_CHANGE.

### 5.2 Pattern comune

Ogni metodo service che muta dati segue questa struttura:

```typescript
export async function <action>(...input): Promise<AppResult<T>> {
  // 1. Validazione sincrona (fuori transazione, fail-fast)
  const validationError = validate<X>(input)
  if (validationError) return { data: null, error: validationError }

  // 2. Resolve contesto runtime
  const userId = getCurrentUserId()
  const now = Date.now()

  // 3. Transazione atomica
  try {
    const result = await db.transaction('rw', <tabelle>, db.changeLog, async (tx) => {
      // 3a. Leggi stato `before` via repository (con tx)
      // 3b. Muta via repository (con tx)
      // 3c. Accoda changeLog entry via changeLogRepository (con tx)
      return <entità>
    })
    return { data: result, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}
```

### 5.3 `src/services/_internal/domain-error.ts`

```typescript
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

**Posizionamento:** in `_internal/` perché è un dettaglio di implementazione del layer service che **non deve** essere importato da hook, componenti o repository. Convenzione `_internal/` rende esplicito "non esportare fuori dal layer".

### 5.4 `src/services/_internal/map-db-error.ts`

```typescript
import type { AppError } from '@/types/ui'
import { DomainError } from './domain-error'

export function mapDbError(e: unknown): AppError {
  if (e instanceof DomainError) {
    return { code: e.code === 'NOT_FOUND' ? 'NOT_FOUND' : 'VALIDATION_ERROR', message: e.message }
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

### 5.5 `src/services/list-service.ts` — firme complete

```typescript
import type { List } from '@/db/types'
import type { AppResult } from '@/types/ui'

export const listService = {
  createList(input: { name: string }): Promise<AppResult<List>>
  updateList(id: string, changes: { name: string }): Promise<AppResult<List>>
  deleteList(id: string): Promise<AppResult<void>>
  archiveList(id: string): Promise<AppResult<List>>
  unarchiveList(id: string): Promise<AppResult<List>>
}
```

**Implementazione di `createList`:**

```typescript
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
    itemOrder: [],          // sempre vuoto (Decisione 1)
    syncedAt: null,
  }

  try {
    await db.transaction('rw', db.lists, db.changeLog, async (tx) => {
      await listRepository.create(newList, tx)
      await changeLogRepository.append({
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
      }, tx)
    })
    return { data: newList, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}
```

**Implementazione di `deleteList` (cascade — il metodo più denso):**

```typescript
async function deleteList(id: string): Promise<AppResult<void>> {
  const userId = getCurrentUserId()
  const now = Date.now()

  try {
    await db.transaction('rw', db.lists, db.items, db.changeLog, async (tx) => {
      // 1. Snapshot lista (before)
      const listBefore = await listRepository.getById(id, tx)
      if (!listBefore || listBefore.deletedAt !== null) {
        throw new DomainError('NOT_FOUND', `Lista ${id} non trovata o già cancellata`)
      }

      // 2. Snapshot articoli attivi (before per ognuno)
      const itemsBefore = await itemRepository.listActiveInList(id, tx)

      // 3. Soft-delete lista
      await listRepository.update(id, { deletedAt: now, updatedAt: now }, tx)

      // 4. Soft-delete cascade articoli (bulk modify dentro transazione)
      await tx.table<Item>('items')
        .where('listId').equals(id)
        .and(i => i.deletedAt === null)
        .modify({ deletedAt: now, updatedAt: now })

      // 5. ChangeLog: 1 entry LIST + N entries ITEM, stesso timestamp
      const logEntries: ChangeLogEntry[] = [
        {
          id: generateId(), userId, timestamp: now,
          operationType: 'DELETE', entityType: 'LIST', entityId: id,
          changes: { before: listBefore, after: { deletedAt: now, updatedAt: now } },
          synced: false, syncedAt: null, conflictResolution: null,
        },
        ...itemsBefore.map(item => ({
          id: generateId(), userId, timestamp: now,
          operationType: 'DELETE' as const, entityType: 'ITEM' as const, entityId: item.id,
          changes: { before: item, after: { deletedAt: now, updatedAt: now } },
          synced: false, syncedAt: null, conflictResolution: null,
        })),
      ]
      await changeLogRepository.appendMany(logEntries, tx)
    })
    return { data: undefined, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}
```

**Note sulle altre 3 firme di `listService`:**

- **`updateList(id, { name })`**: stessa impalcatura di `createList` ma con diff calcolato via `buildDiff(before, updated, ['id', 'userId', 'createdAt'])`. Genera entry `operationType: 'UPDATE'`. Throw `DomainError('NOT_FOUND')` se la lista non esiste o è cancellata.
- **`archiveList(id)`**: aggiorna `status: 'archived'` + `updatedAt`. Diff parziale `{ status, updatedAt }`. Entry `operationType: 'UPDATE'`.
- **`unarchiveList(id)`**: simmetrico, `status: 'active'`.

### 5.6 `src/services/item-service.ts` — firme complete

```typescript
type CreateItemInput = {
  listId: string
  name: string
  quantity?: number | null
  unit?: UnitOfMeasure | null
  category?: Category | null
  notes?: string | null
}

type UpdateItemInput = Partial<Pick<Item, 'name' | 'quantity' | 'unit' | 'category' | 'notes'>>

export const itemService = {
  createItem(input: CreateItemInput): Promise<AppResult<Item>>
  updateItem(id: string, changes: UpdateItemInput): Promise<AppResult<Item>>
  toggleItemStatus(id: string): Promise<AppResult<Item>>
  deleteItem(id: string): Promise<AppResult<void>>
  restoreItem(id: string): Promise<AppResult<Item>>
}
```

**Implementazione di `toggleItemStatus`** (esempio canonico di `STATE_CHANGE`):

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
      const changes: Partial<Item> = {
        status: newStatus,
        completedAt: newStatus === 'completed' ? now : null,
        updatedAt: now,
        updatedBy: userId,
      }

      await itemRepository.update(itemId, changes, tx)

      await changeLogRepository.append({
        id: generateId(), userId, timestamp: now,
        operationType: 'STATE_CHANGE',
        entityType: 'ITEM', entityId: itemId,
        changes: {
          before: { status: before.status, completedAt: before.completedAt },
          after:  { status: newStatus,     completedAt: changes.completedAt! },
        },
        synced: false, syncedAt: null, conflictResolution: null,
      }, tx)

      return { ...before, ...changes } as Item
    })
    return { data: updated, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}
```

**Note sulle altre 4 firme di `itemService`:**

- **`createItem(input)`**: legge `getMaxSortOrder(listId, tx)` dentro la transazione → `sortOrder = max + 1`. Costruisce `Item` completo con UUID, `status: 'pending'`, `createdBy = updatedBy = userId`. Entry `operationType: 'CREATE'`.
- **`updateItem(id, changes)`**: legge before, costruisce `updated = {...before, ...changes, updatedAt: now, updatedBy: userId}`, calcola `buildDiff(before, updated, ['id', 'listId', 'createdAt', 'createdBy'])`. Entry `operationType: 'UPDATE'`.
- **`deleteItem(id)`**: aggiorna `{ deletedAt: now, updatedAt: now }`. Entry `operationType: 'DELETE'` con `before` snapshot completo.
- **`restoreItem(id)`**: aggiorna `{ deletedAt: null, status: 'pending', updatedAt: now }`. Validazione: deve essere in stato cancellato (`deletedAt !== null`), altrimenti `NOT_FOUND`. Entry `operationType: 'UPDATE'` con diff `{ deletedAt, status, updatedAt }`. Inoltre **verifica che la lista parent non sia cancellata**: se `parent.deletedAt !== null`, throw `DomainError('NOT_FOUND', 'Lista parent cancellata')`.

---

## 6. Layer Hook

### 6.1 Contratto

Gli hook sono **colla sottile** tra `useLiveQuery` (read reattiva) e i service (mutation). Regole:

1. **Niente business logic** — solo passa-through di mutation
2. **Niente toast automatici** — gli hook ritornano `AppResult` al chiamante; il componente decide come mostrare l'errore
3. **Niente local state complesso** — solo lo stato derivato da `useLiveQuery`
4. **Limite size:** se un hook supera ~40 LOC, qualcosa è al posto sbagliato

### 6.2 `src/hooks/use-lists.ts` [S1-03]

```typescript
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

**Convenzione `undefined` come valore iniziale:** distingue "ancora caricando" da "caricato e vuoto". L'UI usa `if (isLoading) <LoadingSpinner />; if (lists?.length === 0) <EmptyState />`.

### 6.3 `src/hooks/use-items.ts` [S1-10]

```typescript
export type UseItemsResult = {
  items: Item[] | undefined
  isLoading: boolean
  create(input: CreateItemInput): Promise<AppResult<Item>>
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

### 6.4 `src/hooks/use-deleted-items.ts` [parte di S1-15]

```typescript
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

### 6.5 Cosa NON fanno gli hook in Sprint 1

- **Niente optimistic update manuale**: `useLiveQuery` re-emette al commit della transazione (sub-ms), quindi l'UI è già istantanea. Aggiungere uno stato "pending" sarebbe duplicazione.
- **Niente toast automatico**: il chiamante decide se mostrare un toast, un inline error sull'input, o niente. Più controllo, meno accoppiamento.
- **Niente cache layer custom**: Dexie + `useLiveQuery` sono già la cache.
- **Niente `listStore` Zustand per le liste**: il file `src/stores/list-store.ts` resta vuoto con commento `// Riservato a V1.0`. La source of truth è Dexie.

---

## 7. Layer UI

### 7.1 Routing (`src/app.tsx`)

```tsx
import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/home-page'
import ListPage from '@/pages/list-page'
import TrashPage from '@/pages/trash-page'
import NotFoundPage from '@/pages/not-found-page'
import { ToastContainer } from '@/components/common/toast-container'

export default function App() {
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

**Routing piatto, niente layout annidati.** Ogni pagina monta il proprio header inline. `AppShell`/`Header`/`BottomNav` arriveranno con Sprint 2 quando ci saranno auth e più destinazioni.

### 7.2 Pagine

#### `src/pages/home-page.tsx` [S1-04, REWRITE]

Responsabilità:
- Lista delle liste attive dell'utente (via `useLists`)
- Pulsante "+ Nuova lista" che apre `<ListForm>` in modale
- Empty state se `lists.length === 0`
- Loading spinner durante il primo load
- `ArchivedSection` inline collassabile (visibile solo se ci sono archiviate)

Struttura JSX (semplificata):

```tsx
function HomePage() {
  const { lists, isLoading, create, archive, remove } = useLists()
  const userId = useAuthStore(s => s.userId)
  const [showForm, setShowForm] = useState(false)

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Le mie liste</h1>
        <Button onClick={() => setShowForm(true)}>+ Nuova lista</Button>
      </header>

      {isLoading && <LoadingSpinner />}
      {!isLoading && lists?.length === 0 && (
        <EmptyState
          title="Nessuna lista"
          description="Crea la tua prima lista della spesa"
          action={<Button onClick={() => setShowForm(true)}>Crea lista</Button>}
        />
      )}
      {!isLoading && lists && lists.length > 0 && (
        <ul className="space-y-2">
          {lists.map(l => (
            <ListCard
              key={l.id}
              list={l}
              onArchive={() => archive(l.id)}
              onDelete={() => handleDelete(l.id)}
            />
          ))}
        </ul>
      )}

      {showForm && (
        <ListForm
          onSubmit={async (name) => {
            const result = await create(name)
            if (result.error) {
              useUiStore.getState().pushToast('error', result.error.message)
              return
            }
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ArchivedSection userId={userId} />
    </main>
  )
}
```

#### `src/pages/list-page.tsx` [S1-11, NUOVO]

Responsabilità:
- Header con back link a `/`, nome lista, link al cestino con badge count
- Lista articoli reattiva (via `useItems(listId)`)
- `ItemQuickAddBar` sticky in fondo per inserimento rapido
- `ItemForm` modale per edit
- `ConfirmDialog` per delete
- Guard: redirect a NotFoundPage se la lista è cancellata o non esiste

Struttura JSX (semplificata):

```tsx
function ListPage() {
  const { listId } = useParams<{ listId: string }>()
  const { items, isLoading, create, update, toggle, remove } = useItems(listId!)
  const list = useLiveQuery(() => listRepository.getById(listId!), [listId])
  const trashCount = useLiveQuery(
    () => itemRepository.listDeletedByList(listId!).then(arr => arr.length),
    [listId],
    0,
  )
  const [editingItem, setEditingItem] = useState<Item | null>(null)

  if (list === undefined) return <LoadingSpinner />
  if (list === null || list.deletedAt !== null) return <NotFoundPage />

  return (
    <main className="flex flex-col min-h-screen">
      <header className="p-4 border-b">
        <Link to="/" className="text-sm text-gray-600">← Indietro</Link>
        <h1 className="text-2xl font-bold mt-2">{list.name}</h1>
        <Link to={`/lists/${listId}/trash`} className="text-sm text-gray-500 mt-1 inline-block">
          Cestino ({trashCount})
        </Link>
      </header>

      <section className="flex-1 p-4">
        {isLoading && <LoadingSpinner />}
        {items?.length === 0 && (
          <EmptyState title="Lista vuota" description="Aggiungi il primo articolo qui sotto" />
        )}
        {items && items.length > 0 && (
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
          item={editingItem}
          onSubmit={async (changes) => {
            const result = await update(editingItem.id, changes)
            if (result.error) { /* toast */ return }
            setEditingItem(null)
          }}
          onCancel={() => setEditingItem(null)}
        />
      )}
    </main>
  )
}
```

#### `src/pages/trash-page.tsx` [S1-15, NUOVO]

Responsabilità:
- Header con back link a `/lists/:listId`, titolo "Cestino"
- Lista articoli cancellati (via `useDeletedItems(listId)`)
- Pulsante "Ripristina" per ogni `ItemTrashRow`
- Empty state se cestino vuoto
- Guard: redirect a NotFoundPage se la lista parent è cancellata

Struttura JSX (semplificata):

```tsx
function TrashPage() {
  const { listId } = useParams<{ listId: string }>()
  const { items, isLoading, restore } = useDeletedItems(listId!)
  const list = useLiveQuery(() => listRepository.getById(listId!), [listId])

  if (list === undefined) return <LoadingSpinner />
  if (list === null || list.deletedAt !== null) return <NotFoundPage />

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <header>
        <Link to={`/lists/${listId}`}>← {list.name}</Link>
        <h1 className="text-2xl font-bold mt-2">Cestino</h1>
      </header>

      {isLoading && <LoadingSpinner />}
      {items?.length === 0 && <EmptyState title="Cestino vuoto" />}
      {items && items.length > 0 && (
        <ul className="space-y-2 mt-4">
          {items.map(item => (
            <ItemTrashRow
              key={item.id}
              item={item}
              onRestore={async () => {
                const result = await restore(item.id)
                if (result.error) {
                  useUiStore.getState().pushToast('error', result.error.message)
                }
              }}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
```

### 7.3 Componenti common (S1-17 — 9 file)

| File | Responsabilità | Note |
|------|----------------|------|
| `button.tsx` | Variants: primary, secondary, danger, ghost. Sizes: sm, md | Stateless |
| `input.tsx` | Label + error inline + helper text | `forwardRef` per `inputRef` esterno |
| `badge.tsx` | Badge numerico/stato | Stateless |
| `modal.tsx` | Wrapper su `@radix-ui/react-dialog` con focus trap + ESC | Headless, stilizzato con Tailwind |
| `confirm-dialog.tsx` | Wrapper promise-based: `await confirm({title, message, danger})` | Renderizzato da hook locale `useConfirm` |
| `toast-container.tsx` | Legge `useUiStore.toasts`, render con auto-dismiss 3s | Montato in `app.tsx` |
| `empty-state.tsx` | Icon + title + description + optional action | Stateless |
| `loading-spinner.tsx` | Single div con animazione Tailwind | Stateless |
| `error-message.tsx` | Renderizza `AppError` con retry opzionale | Stateless |

### 7.4 Componenti lists/ (S1-04, S1-05, S1-07)

- **`list-card.tsx`** — Card singola lista con nome, contatori articoli (live count via `useLiveQuery`), menu kebab (rinomina, archivia/disarchivia, elimina). `variant: 'active' | 'archived'`.
- **`list-form.tsx`** — Form create/edit (modale via `Modal`), con `validateListName` live, disabled submit se invalido. Riusato per create e edit (parametro `initialValue?`).
- **`archived-section.tsx`** — Componente collassabile che usa `useLiveQuery` su `listRepository.listArchivedByUser`. Mostra solo se `count > 0`. Default collassato.

### 7.5 Componenti items/ (S1-11, S1-13, S1-15)

- **`item-row.tsx`** — Riga articolo con checkbox (toggle), nome, quantità + unità, badge categoria, menu kebab (modifica, elimina). Animazione fade + strikethrough quando `status === 'completed'`.
- **`item-form.tsx`** — Form completo: name (Input), quantity (number Input), unit (select dropdown su `UnitOfMeasure`), category (select su `Category`), notes (textarea). Validazione live via `validateItemInput`. **Niente autocompletamento** (Sprint 5).
- **`item-quick-add-bar.tsx`** — Sticky bottom bar con singolo Input + Button "Aggiungi". State locale: input value, submitting flag. Validazione "non vuoto". Auto-focus dopo submit per inserimento sequenziale. Toast su errore service.
- **`item-trash-row.tsx`** — Riga semplice con nome articolo, data eliminazione formattata ("3 giorni fa"), Button "Ripristina".

### 7.6 Store UI (`src/stores/ui-store.ts` REWRITE)

```typescript
import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'warning' | 'info'
type ToastEntry = { id: string; type: ToastType; message: string }

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
    // Auto-dismiss dopo 3s
    setTimeout(() => get().dismissToast(id), 3000)
  },
  dismissToast(id) {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },
}))

// Sprint 1: solo toast queue.
// theme/networkStatus/shoppingMode arriveranno con Sprint 3+.
```

`<ToastContainer />` montato in `app.tsx` legge `useUiStore(s => s.toasts)` e li rende come notifiche dismissable in alto a destra.

---

## 8. ChangeLog: forma e operationType semantics

### 8.1 Forma di `ChangeLogEntry.changes`

| `operationType` | `changes.before` | `changes.after` |
|---|---|---|
| **CREATE** | `null` | Entità completa |
| **UPDATE** | Solo i campi cambiati, valori vecchi | Solo i campi cambiati, valori nuovi |
| **STATE_CHANGE** | `{ status, completedAt }` (sottoinsieme fisso) | `{ status, completedAt }` (sottoinsieme fisso) |
| **DELETE** | Entità completa (snapshot pre-delete) | `{ deletedAt, updatedAt }` |

**Razionale del diff minimale per UPDATE:** garantisce che il sync di Sprint 3 sia semanticamente sicuro in scenari multi-device offline. Vedi brainstorm summary §6.d per il caso d'uso completo.

### 8.2 Esempi concreti

**CREATE item:**
```json
{
  "id": "log-1", "userId": "local-user-stub", "timestamp": 1744569600000,
  "operationType": "CREATE", "entityType": "ITEM", "entityId": "item-abc",
  "changes": {
    "before": null,
    "after": {
      "id": "item-abc", "listId": "list-1", "name": "Latte",
      "quantity": 1, "unit": "l", "category": "dairy", "notes": null,
      "status": "pending", "sortOrder": 5,
      "createdAt": 1744569600000, "updatedAt": 1744569600000,
      "completedAt": null, "deletedAt": null,
      "createdBy": "local-user-stub", "updatedBy": "local-user-stub"
    }
  },
  "synced": false, "syncedAt": null, "conflictResolution": null
}
```

**UPDATE item** (cambio solo `name` e `quantity`):
```json
{
  "operationType": "UPDATE", "entityType": "ITEM", "entityId": "item-abc",
  "changes": {
    "before": { "name": "Latte",        "quantity": 1, "updatedAt": 1744569600000 },
    "after":  { "name": "Latte intero", "quantity": 2, "updatedAt": 1744570000000 }
  }
}
```

**STATE_CHANGE item** (toggle pending → completed):
```json
{
  "operationType": "STATE_CHANGE", "entityType": "ITEM", "entityId": "item-abc",
  "changes": {
    "before": { "status": "pending",   "completedAt": null },
    "after":  { "status": "completed", "completedAt": 1744570500000 }
  }
}
```

**DELETE item:**
```json
{
  "operationType": "DELETE", "entityType": "ITEM", "entityId": "item-abc",
  "changes": {
    "before": { /* snapshot completo dell'item pre-delete */ },
    "after":  { "deletedAt": 1744571000000, "updatedAt": 1744571000000 }
  }
}
```

**DELETE list (cascade)**: una entry `entityType: 'LIST'` + N entries `entityType: 'ITEM'`, tutte con lo stesso `timestamp`. Sprint 3 sync le processa come blocco logico ordinato per timestamp.

### 8.3 Utility `src/utils/diff.ts`

```typescript
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

**Limite noto:** confronto shallow `!==`. Funziona per tutti i campi scalari (`string`, `number`, `null`, enum) di `Item` e `List`. Non funzionerebbe per oggetti annidati o array, ma in Sprint 1 non ne usiamo (`sharedWith` è gestito da Sprint 4, `itemOrder` resta `[]`).

**Test (`diff.test.ts`) — 3 test:**
1. Identico `before == after` → entrambi `Partial` vuoti
2. Diff parziale → solo i campi cambiati appaiono
3. `ignoreFields` esclude correttamente i campi specificati

---

## 9. Validazione, errori, AppResult flow

### 9.1 Tipo `AppResult<T>` (già in Sprint 0)

```typescript
export type AppError = {
  code: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'PERMISSION_DENIED'
      | 'NOT_FOUND' | 'SUPABASE_NOT_CONFIGURED' | 'UNKNOWN_ERROR'
  message: string
  details?: unknown
}

export type AppResult<T> =
  | { data: T;    error: null }
  | { data: null; error: AppError }
```

**Discriminante:** `result.error === null` ⇒ success, `result.error !== null` ⇒ failure. Sprint 1 usa solo 3 dei 6 `code`: `VALIDATION_ERROR`, `NOT_FOUND`, `UNKNOWN_ERROR`.

### 9.2 `src/utils/validation.ts`

```typescript
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

export function validateItemInput(input: {
  name: string
  quantity?: number | null
  notes?: string | null
}): AppError | null {
  const name = input.name.trim()
  if (name.length === 0) {
    return { code: 'VALIDATION_ERROR', message: 'Il nome dell\'articolo non può essere vuoto', details: { field: 'name' } }
  }
  if (name.length > LIMITS.ITEM_NAME_MAX) {
    return { code: 'VALIDATION_ERROR', message: `Il nome non può superare ${LIMITS.ITEM_NAME_MAX} caratteri`, details: { field: 'name' } }
  }
  if (input.quantity != null) {
    if (input.quantity < LIMITS.ITEM_QUANTITY_MIN || input.quantity > LIMITS.ITEM_QUANTITY_MAX) {
      return { code: 'VALIDATION_ERROR', message: `La quantità deve essere tra ${LIMITS.ITEM_QUANTITY_MIN} e ${LIMITS.ITEM_QUANTITY_MAX}`, details: { field: 'quantity' } }
    }
  }
  if (input.notes != null && input.notes.length > LIMITS.ITEM_NOTES_MAX) {
    return { code: 'VALIDATION_ERROR', message: `Le note non possono superare ${LIMITS.ITEM_NOTES_MAX} caratteri`, details: { field: 'notes' } }
  }
  return null
}
```

**`details: { field: ... }`** permette al form component di evidenziare l'input specifico in errore senza string matching sul `message`.

**Test (`validation.test.ts`) — ~8 test:**
- `validateListName`: 3 test (empty/whitespace, oltre max, valido)
- `validateItemInput`: 5 test (name empty, name oltre max, quantity oltre range, notes oltre max, valido completo)

### 9.3 Flusso end-to-end di un errore

Esempio: utente prova a creare articolo con nome troppo lungo.

```
ItemQuickAddBar.handleSubmit("a".repeat(150))
   └─→ useItems(listId).create({ name: "a".repeat(150) })
         └─→ itemService.createItem({ listId, name: "a".repeat(150) })
               └─→ validateItemInput(...) ritorna { code: 'VALIDATION_ERROR', ... }
               ←─ ritorna SUBITO { data: null, error: {...} }
                  (NO transazione, NO Dexie touch)
ItemQuickAddBar:
   if (result.error) {
     useUiStore.getState().pushToast('error', result.error.message)
     // Non clear input → permette correzione
     return
   }
```

**Tre proprietà importanti:**
1. **Validation fail-fast prima della transazione**: zero write sprecate, zero rollback
2. **L'errore viaggia intatto attraverso i layer**: hook è passa-through puro, niente trasformazione/log/modifica
3. **La UI decide come mostrare**: toast (esempio sopra), inline error sull'input via `details.field`, banner, niente — stessa `AppError`, scelte UX diverse

---

## 10. Strategia di test

### 10.1 Scope

| Layer | Scope | Tooling | File |
|---|---|---|---|
| Services | **100% line + branch** | Vitest + fake-indexeddb | `src/services/*.test.ts` |
| Repositories | Smoke (5 test/repo) | Vitest + fake-indexeddb | `src/repositories/*.test.ts` |
| Hooks | State transitions | Vitest + @testing-library/react | `src/hooks/*.test.ts` |
| Utility | Tutti i path | Vitest | `src/utils/*.test.ts` |
| **Components** | **Nessun test** | — | — |
| **E2E** | **Nessun test** | — | — |

**Esclusioni motivate:**
- **Component test**: il piano-sviluppo non li mandata; i componenti Sprint 1 sono UI dichiarativa sottile coperta indirettamente dai test hook
- **E2E Playwright**: il primo E2E utile richiede Sprint 3 (sync multi-device offline/online). Sprint 5 aggiungerà E2E QA completo

### 10.2 Pattern test service (canonico)

Ogni metodo service ha **minimo 4 test** seguendo il pattern:

1. **Happy path** — verifica result success + scrittura tabella primaria + scrittura changeLog
2. **Validation error** — verifica `error.code === 'VALIDATION_ERROR'` + **nessuna write** (né tabella primaria né changeLog)
3. **Not found** (se applicabile) — verifica `error.code === 'NOT_FOUND'` + nessuna write
4. **Edge case** specifico del metodo (trim, sortOrder corretto, atomicity cascade, ecc.)

**Regola di atomicità:** ogni test su path di errore verifica esplicitamente `db.<table>.count() === 0` (o lo stato pre-test), per garantire che il rollback transazionale funzioni. Se un test trova entries spurie nel changeLog dopo un VALIDATION_ERROR, qualcuno ha committato fuori transazione → bug intercettato.

### 10.3 Pattern test repository smoke

```typescript
describe('listRepository', () => {
  beforeEach(async () => {
    await db.lists.clear()
    await db.changeLog.clear()
  })

  it('create → getById preserva tutti i campi', async () => {
    const list = buildMockList({ name: 'Test' })
    await listRepository.create(list)
    const got = await listRepository.getById(list.id)
    expect(got).toEqual(list)
  })

  it('listByUser filtra deletedAt !== null', async () => { /* ... */ })
  it('listByUser filtra status !== active', async () => { /* ... */ })
  it('update modifica solo i campi passati', async () => { /* ... */ })
  it('listByUser ordina per updatedAt desc', async () => { /* ... */ })
})
```

### 10.4 Pattern test hook (con `useLiveQuery` reattiva)

```typescript
import { renderHook, waitFor, act } from '@testing-library/react'

describe('useItems', () => {
  let testListId: string

  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
    const result = await listService.createList({ name: 'Test' })
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
    expect(mutationResult.error?.code).toBe('VALIDATION_ERROR')
    expect(result.current.items).toEqual([])
  })

  it('re-query su cambio listId', async () => { /* ... */ })
})
```

### 10.5 Bilancio test Sprint 1

| Categoria | Test stimati | Task | Ore |
|---|---|---|---|
| `listService` (5 metodi × ~4) | ~20 | S1-18 | 2h |
| `itemService` (5 metodi × ~4) | ~20 | S1-19 | 2h |
| `listRepository` smoke | 5 | S1-01b | 0.5h |
| `itemRepository` smoke | 5 | S1-08b | 0.5h |
| `useLists` | 4 | S1-03b | 1h |
| `useItems` | 4 | S1-10b | 1h |
| `useDeletedItems` | 3 | S1-15b | 1h |
| `validation` | ~8 | parte di S1-02 | 0.5h |
| `diff` | 3 | parte di S1-16 | 0.5h |
| **Totale** | **~72** | — | **~9h** |

---

## 11. Mapping ai 25 task Sprint 1

Tabella completa con tutti i 20 task originali + 5 nuovi. Legenda: 🔄 = riformulato, ➕ = nuovo, ⏱ ore stimate.

| ID | Task | File principali | Dipende da | ⏱ |
|---|---|---|---|---|
| S1-01 | listRepository (CRUD puro Dexie + parametro `tx?`) | `src/repositories/list-repository.ts` | — | 3h |
| ➕ S1-01b | list-repository smoke test (5 test) | `src/repositories/list-repository.test.ts` | S1-01 | 0.5h |
| S1-02 | listService (createList, updateList, archiveList, unarchiveList) + utility shared (validation, id-utils, diff, _internal/) | `src/services/list-service.ts`, `src/services/_internal/{domain-error,map-db-error}.ts`, `src/utils/{validation,id-utils,diff}.ts` | S1-01, S1-16 | 3h |
| S1-03 | useLists hook | `src/hooks/use-lists.ts` | S1-01, S1-02 | 2h |
| ➕ S1-03b | useLists test (4 test) | `src/hooks/use-lists.test.ts` | S1-03 | 1h |
| S1-04 | HomePage rewrite + ListCard + ArchivedSection inline | `src/pages/home-page.tsx`, `src/components/lists/list-card.tsx`, `src/components/lists/archived-section.tsx` | S1-03, S1-17 | 4h |
| S1-05 | ListForm modale | `src/components/lists/list-form.tsx` | S1-17, S1-02 | 2h |
| 🔄 S1-06 | listService.deleteList con cascade eager + ConfirmDialog | `src/services/list-service.ts` (ampliamento), integrazione UI in `list-card.tsx` | S1-02, S1-17 | 1h |
| S1-07 | archiveList/unarchiveList UI (menu kebab + ArchivedSection) | `src/services/list-service.ts` (ampliamento), `src/components/lists/{archived-section,list-card}.tsx` | S1-02, S1-04 | 1h |
| S1-08 | itemRepository (CRUD + getMaxSortOrder + listActiveInList) | `src/repositories/item-repository.ts` | S1-01 (precedente per pattern) | 3h |
| ➕ S1-08b | item-repository smoke test (5 test) | `src/repositories/item-repository.test.ts` | S1-08 | 0.5h |
| S1-09 | itemService (createItem, updateItem, deleteItem, restoreItem) | `src/services/item-service.ts` | S1-08, S1-02 (per shared utils) | 3h |
| S1-10 | useItems hook | `src/hooks/use-items.ts` | S1-08, S1-09 | 2h |
| ➕ S1-10b | useItems test (4 test) | `src/hooks/use-items.test.ts` | S1-10 | 1h |
| S1-11 | ListPage + ItemRow + ItemQuickAddBar + route `/lists/:listId` | `src/pages/list-page.tsx`, `src/components/items/{item-row,item-quick-add-bar}.tsx`, `src/app.tsx` | S1-10, S1-13, S1-17 | 4h |
| 🔄 S1-12 | toggleItemStatus (`STATE_CHANGE`) — solo tap, no swipe | `src/services/item-service.ts` (toggleItemStatus), integrazione in `item-row.tsx` | S1-09, S1-11 | 2h |
| S1-13 | ItemForm completo (no autocomplete) | `src/components/items/item-form.tsx` | S1-17, S1-09 | 3h |
| 🔄 S1-14 | deleteItem — solo pulsante menu/form, no swipe | `src/services/item-service.ts` (deleteItem), integrazione in `item-row.tsx` | S1-09, S1-11 | 1h |
| 🔄 S1-15 | TrashPage per-lista + ItemTrashRow + useDeletedItems + restoreItem + route `/lists/:listId/trash` | `src/pages/trash-page.tsx`, `src/components/items/item-trash-row.tsx`, `src/hooks/use-deleted-items.ts`, `src/services/item-service.ts` (restoreItem), `src/app.tsx` | S1-09, S1-17 | 3h |
| ➕ S1-15b | useDeletedItems test (3 test) | `src/hooks/use-deleted-items.test.ts` | S1-15 | 1h |
| 🔄 S1-16 | changeLogRepository + utility diff.ts + diff.test.ts + documentazione operationType semantics | `src/repositories/change-log-repository.ts`, `src/utils/diff.ts`, `src/utils/diff.test.ts` | — (precondizione di S1-02) | 3h |
| 🔄 S1-17 | 9 componenti common + uiStore rewrite + installazione `@radix-ui/react-dialog` | `src/components/common/*.tsx` (9 file), `src/stores/ui-store.ts`, `package.json` | — | 4h |
| S1-18 | listService 100% coverage (~20 test) | `src/services/list-service.test.ts` | S1-02, S1-06, S1-07 | 2h |
| S1-19 | itemService 100% coverage (~20 test) | `src/services/item-service.test.ts` | S1-09, S1-12, S1-14, S1-15 (restoreItem) | 2h |
| S1-20 | Aggiorna `docs/mappa-progetto.md` con i ~33 file effettivi | `docs/mappa-progetto.md` | tutti | 0.5h |

**Totale ore stimate:** ~52.5h (48.5h originali da piano-sviluppo + 4h nuove dal brainstorming)

### 11.1 Ordering critico

Sequenza che minimizza blockage e rework:

1. **Fondamenta** (parallelizzabili):
   - S1-16 (changeLog infra + diff utility)
   - S1-17 (componenti common + radix install)
   - S1-01 + S1-01b (listRepository + test)
   - S1-08 + S1-08b (itemRepository + test)

2. **Service layer** (richiede S1-16 completato):
   - S1-02 (listService + utility shared incluso `_internal/`)
   - S1-09 (itemService — riusa `_internal/` di S1-02)

3. **Test service mandatori** (prima di toccare UI):
   - S1-18 (listService 100%)
   - S1-19 (itemService 100%)

4. **Hook layer**:
   - S1-03 + S1-03b
   - S1-10 + S1-10b

5. **UI layer**:
   - S1-04 (HomePage + ListCard + ArchivedSection)
   - S1-05 (ListForm)
   - S1-06 (delete list UI wiring) + S1-07 (archive UI wiring)
   - S1-13 (ItemForm)
   - S1-11 (ListPage + ItemRow + ItemQuickAddBar)
   - S1-12 (toggle UI wiring) + S1-14 (delete UI wiring)
   - S1-15 + S1-15b (TrashPage + restore + test)

6. **Documentazione finale**:
   - S1-20 (`mappa-progetto.md` snapshot finale)

---

## 12. Dipendenze, scope esclusioni, rischi

### 12.1 Nuove dipendenze runtime

| Pacchetto | Versione | Bundle | Uso |
|-----------|----------|--------|-----|
| `@radix-ui/react-dialog` | ^1.x | ~15 kB gz | Focus trap per `Modal`/`ConfirmDialog` |

Installazione: `npm install @radix-ui/react-dialog`

Nessun'altra dipendenza nuova. Tutto il resto è da Sprint 0.

### 12.2 Scope esplicitamente escluso

| Esclusione | Destinazione | Motivo |
|------------|--------------|--------|
| Auth, LoginPage, RegisterPage | Sprint 2 | Sprint 1 usa stub `'local-user-stub'` |
| Sync IndexedDB ↔ Supabase | Sprint 3 | Richiede Backend/Deploy Activation prima |
| Permessi RBAC, viewer read-only | Sprint 4 | Sprint 1 ha utente singolo |
| Autocompletamento articoli | Sprint 5 (RF-AUTO-001) | ItemForm rimane statico |
| Gesture swipe, Modalità Shopping | V1.0 | Decisione di scope 2 |
| Undo toast con azioni, useUndo | V1.0 | Decisione di scope 3 |
| Cestino globale `/trash` | Mai pianificato | Decisione architettura 5 |
| Riordino articoli (drag-and-drop) | Dexie v2 futura | Decisione di scope 1 |
| Component test | Sprint 5 QA | ROI basso con service 100% |
| E2E Playwright | Sprint 3/Sprint 5 | Primo E2E utile richiede sync |
| Lighthouse audit | Sprint 5 (S5-07) | QA fase finale |
| WCAG 2.1 AA audit | Sprint 5 (S5-08) | QA fase finale |
| Test su device fisico | Sprint 5 (S5-06) | QA fase finale |
| Bottom nav, AppShell, Header | Sprint 2 | Routing piatto sufficiente con 3 pagine |
| Pulizia cestino > 30 giorni | Sprint 5 (S5-05) | Background job |

### 12.3 Rischi e mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Transazione cascade-delete troppo grande per liste > 200 articoli | Bassa | Medio | Non realistica per MVP; Sprint 5 QA verifica |
| `useLiveQuery` non riemette dopo transazione lunga | Bassa | Basso | Test hook coprono la transizione `undefined → []` e mutation reflection |
| Multi-tab race su `getMaxSortOrder` | Bassa | Basso | Lettura dentro transazione → consistenza garantita dal motore IndexedDB |
| Radix Dialog non tree-shakable in Vite build | Bassa | Basso | Verificabile a build time; fallback custom è ~2h |
| Test hook con `useLiveQuery` flaky in CI | Media | Basso | Uso consistente di `waitFor`, `beforeEach` pulisce DB |
| File `list-page.tsx` supera 200 LOC | Media | Basso | Estrazione `ItemQuickAddBar` già fatta; valutare estrazione header se cresce |

---

## 13. Definition of Done

Sprint 1 è completato quando **tutte** le seguenti condizioni sono verificate:

### 13.1 Quality gates

- [ ] `npm run typecheck` passa senza errori (sia `tsc --noEmit` sia `tsc --noEmit -p tsconfig.node.json`)
- [ ] `npm run lint` passa senza errori
- [ ] `npm run test` → tutti i ~72 test verdi
- [ ] `vitest --coverage` → `listService` e `itemService` al **100% line + branch**

### 13.2 Funzionalità (manual smoke con DevTools → Network → Offline)

- [ ] Crea una lista da HomePage
- [ ] Modifica nome di una lista
- [ ] Archivia una lista → scompare dalla vista principale → appare in `ArchivedSection`
- [ ] Disarchivia una lista → torna nella vista principale
- [ ] Cancella una lista → richiede conferma → scompare
- [ ] Apri una lista (`/lists/:listId`)
- [ ] Aggiungi articolo via `ItemQuickAddBar` → appare in fondo
- [ ] Aggiungi più articoli in sequenza (auto-focus funziona)
- [ ] Toggle stato articolo (tap su checkbox) → animazione strikethrough
- [ ] Modifica articolo via `ItemForm` (tutti i campi)
- [ ] Cancella articolo → scompare dalla lista
- [ ] Vai al cestino (`/lists/:listId/trash`) → vedi articoli cancellati
- [ ] Ripristina articolo dal cestino → torna nella lista
- [ ] Cancella la lista parent → naviga al cestino → redirect a NotFoundPage
- [ ] Crea articolo con nome vuoto → toast errore, niente write
- [ ] Crea articolo con nome > 100 caratteri → toast errore
- [ ] Tutto sopra funziona con DevTools → Network → Offline ✓

### 13.3 Documentazione

- [ ] `docs/mappa-progetto.md` aggiornato con i ~33 file effettivi creati in Sprint 1 (S1-20)
- [ ] Sprint 1 marcato come `[✅]` in `docs/piano-sviluppo.md`
- [ ] `CLAUDE.md` "Stato Progetto" aggiornato con la nuova milestone M2

### 13.4 Esplicitamente NON nel DoD di Sprint 1

- ❌ Lighthouse / bundle size check (Sprint 5)
- ❌ WCAG 2.1 AA audit (Sprint 5)
- ❌ Test su device mobile fisico iOS/Android (Sprint 5)
- ❌ Sync funzionante con Supabase (Sprint 3)
- ❌ Login/registrazione (Sprint 2)
- ❌ Component test e E2E Playwright

---

## 14. Riferimenti

- **Brainstorm:** [`docs/superpowers/brainstorms/2026-04-14-sprint-1-core-offline-brainstorm.md`](../brainstorms/2026-04-14-sprint-1-core-offline-brainstorm.md)
- **Piano sviluppo:** `docs/piano-sviluppo.md` (Sprint 1, righe 107-135)
- **SRS Requisiti:** `docs/SoftwareRequirements.md` §RF-LIST-001..004 (righe 1685-1796), §RF-ITEM-001..005 (righe 1799-1928), §4.2/4.3 (schema Dexie + tipi)
- **Sprint 0 spec:** `docs/specs/Sprint0_Setup_Spec.md`
- **CLAUDE.md:** `CLAUDE.md` (Stato Progetto + Principi Core + Standard Codice)
- **Architettura:** `.claude/architettura.md` (con riserva su discrepanze documentate in CLAUDE.md "Fonti autoritative in caso di discrepanza")
- **Dominio:** `.claude/dominio.md`
- **Qualità:** `.claude/qualita.md`
- **Testing:** `.claude/testing.md`

---

*Documento: `docs/superpowers/specs/2026-04-14-sprint-1-core-offline-design.md`*
*Stato: Draft — in attesa di review utente prima di transizionare a `superpowers:writing-plans`*
