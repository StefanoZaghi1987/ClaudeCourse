# Piano di sviluppo — Sprint 1.5: Item CRUD UX Refinement

> **Audience:** nuova conversazione Claude Code che deve eseguire questo plan da zero.
> **Data creazione:** 2026-04-15
> **Stato:** APPROVATO dall'utente — da eseguire in sessione separata
> **Effort stimato:** 6-8 ore in 1-2 sessioni
> **Metodologia:** rigoroso `superpowers:subagent-driven-development` (un implementer subagent fresco + spec review + code quality review per ogni fase)

---

## A. Kickoff per la nuova conversazione

### A.1 Come iniziare

Incolla questo messaggio nella nuova conversazione (o usa `/feature-dev` con link a questo file):

```
Eseguiamo lo Sprint 1.5 - Item CRUD UX Refinement sul progetto ShoppingList.

Il piano completo è approvato e si trova in:
C:\Users\stefano.zaghi\.claude\plans\delightful-dazzling-quokka.md
(copia anche in docs/plans/Sprint1_5_ItemCrudUxRefinement_Plan.md se serve versionarlo)

Leggi il plan integralmente, crea la task list corrispondente alle fasi Phase 0-9,
e procedi con superpowers:subagent-driven-development fase per fase.

Vincoli operativi non negoziabili:
- NON eseguire comandi git (l'utente committa manualmente)
- A fine di ogni fase, lista i file pronti al commit
- Gate tra le fasi: typecheck + lint + test tutti verdi
- Rispetta le gotchas ESLint (sezione B.5 del plan)
```

### A.2 Environment

- **Primary working directory:** `D:\VibeCoding\ClaudeCourse\Esercizi\Lezione_5\ShoppingList_AdvancedWorkflow\ShoppingList`
- **Git:** `feat-course` branch, ramo origine `master`. L'utente fa tutti i commit.
- **Platform:** Windows 11 Pro, shell `bash` (Git Bash). Path style: forward slashes `/`, `/dev/null` non `NUL`.
- **Node scripts disponibili:** `npm run dev`, `npm run build`, `npm run preview`, `npm run test`, `npm run test:watch`, `npm run lint`, `npm run typecheck`.
- **Dev server:** `https://localhost:5173` (HTTPS self-signed via `@vitejs/plugin-basic-ssl`).

### A.3 Stack e convenzioni rigide

- **Stack:** React 18 + TypeScript strict + Vite + Dexie.js 4 + Zustand + Tailwind CSS 3 + Radix UI Dialog
- **Test:** Vitest + @testing-library/react + fake-indexeddb (già installati)
- **File naming:** kebab-case obbligatorio in `src/` (es. `item-row.tsx`, non `ItemRow.tsx`)
- **Import alias:** `@/foo` → `src/foo`, mai path relativi `../../`
- **TypeScript strict:** no `any` mai, no `@ts-ignore`, no `eslint-disable`. Usa `import type { JSX } from 'react'` nei `.tsx`.
- **File size:** target < 200 LOC, warning 150, max 400. Componenti React max 200 LOC. Funzioni max 20 LOC, max 4 parametri.
- **Layer assoluto:** UI → Hook → Service → Repository → Dexie. Mai salti. Regola non negoziabile.
- **Offline-first:** ogni mutazione va dentro `db.transaction('rw', ...)` esplicita che tocca sia la tabella dominio sia `changeLog`.

---

## B. Contesto essenziale del codebase

### B.1 Stato Sprint 1 (completato 2026-04-14)

- CRUD completo di liste e articoli offline-first funzionante
- 75 test verdi (`npm run test`)
- Coverage services: `list-service` 98.9%, `item-service` 99.11%
- Schema Dexie v1 stabile — **NON aggiungere version(2) se non strettamente necessario**
- `docs/plans/Sprint1_CoreOffline_Plan.md` contiene il plan del lavoro già fatto
- `userId` è stub: `'local-user-stub'` in `src/stores/auth-store.ts` — Sprint 2 sostituirà con auth Supabase
- `src/lib/supabase.ts` è uno stub verso `https://stub.invalid`, non chiamarlo

### B.2 Cosa c'è già e va RIUSATO (riferimenti precisi)

| Utilità/Componente | File | Uso nel plan |
|---|---|---|
| `Modal` (Radix Dialog wrapper) | `src/components/common/modal.tsx` | `ItemForm` invariato |
| `Input` (forwardRef-enabled) | `src/components/common/input.tsx` | Base per autocomplete + quick-add |
| `Button` (variants primary/secondary/ghost/danger) | `src/components/common/button.tsx` | Icone tap-target |
| `Badge` | `src/components/common/badge.tsx` | Categoria in `ItemRow` |
| `useConfirm` | `src/components/common/confirm-dialog.tsx` | Delete item |
| `useUiStore.pushToast(type, message)` | `src/stores/ui-store.ts` | Errori service |
| `validateItemInput`, `validateItemPatch`, `LIMITS` | `src/utils/validation.ts` | Invariati |
| `generateId()` | `src/utils/id-utils.ts` | Per nuovi `CatalogItem.id` |
| `buildDiff` | `src/utils/diff.ts` | Non serve per catalog (no changeLog) |
| `DomainError` | `src/services/_internal/domain-error.ts` | Errori business catalog |
| `mapDbError` | `src/services/_internal/map-db-error.ts` | Catch Dexie in catalog |
| `getCurrentUserId()` | `src/stores/auth-store.ts` | Per `catalogItem.userId` |
| `db` singleton + tabelle | `src/db/database.ts` | Usa `db.itemCatalog`, già dichiarata |
| Pattern repository con `tx?: Transaction` | `src/repositories/item-repository.ts:8-13` | Copiare struttura `itemsTable(tx)` |
| Pattern service con `db.transaction('rw', ...)` | `src/services/item-service.ts:42-84` (createItem) | Copiare il template tx |

### B.3 Schema Dexie attuale (v1) — NON modificare

File: `src/db/database.ts`

```ts
this.version(1).stores({
  lists: '&id, userId, updatedAt, status, isTemplate',
  items: '&id, listId, [listId+status], [listId+deletedAt], createdAt, updatedAt',
  changeLog: '&id, [userId+synced], entityType, entityId, timestamp',
  itemCatalog: '&id, &name, userId, frequency',
  invites: '&token, listId, status',
})
```

`itemCatalog` è **già dichiarata**. La colonna `&name` è unique (fondamentale per upsert per nome case-insensitive). La colonna `frequency` è indicizzata per potenziali query future. Il tipo `CatalogItem` (`src/db/types.ts:99-108`):

```ts
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
```

**Gotcha schema:** l'unique `&name` è case-sensitive in Dexie. Il plan memorizza sempre `name` in lowercase-trimmed nel repository (normalizzazione a scrittura), e mostra il display con `initialCaps` a UI.

### B.4 Taxonomy enums (da `src/db/types.ts`)

```ts
export type Category =
  | 'fruits_vegetables' | 'dairy' | 'meat_fish' | 'beverages' | 'frozen'
  | 'pantry' | 'bakery' | 'cleaning' | 'personal_care' | 'other'

export type UnitOfMeasure =
  | 'kg' | 'g' | 'mg' | 'l' | 'ml' | 'cl'
  | 'pcs' | 'pack' | 'box' | 'bottle' | 'can' | 'bag'

export type ItemStatus = 'pending' | 'completed'
```

Oggi in `ItemRow` viene mostrato l'enum grezzo (`<Badge>{item.category}</Badge>`), cosa che il plan Phase 0 risolve creando `src/utils/item-labels.ts`.

### B.5 ESLint gotchas (hanno tolto ore a Sprint 1, rispettare!)

Queste regole sono enforced con `max-warnings 0` — **se le violi, il build fallisce**.

1. **`@typescript-eslint/unbound-method`**: MAI destrutturare metodi da hook return. Tieni sempre l'hook object e chiama via property-access.
   ```ts
   // ❌ const { create, toggle } = useItems(listId)
   // ✅ const itemsHook = useItems(listId); await itemsHook.create(...)
   ```

2. **`@typescript-eslint/no-misused-promises` + `no-floating-promises`**: handler async passati come prop sincrono vanno wrappati.
   ```tsx
   // ❌ <button onClick={handleAsync} />
   // ✅ <button onClick={() => { void handleAsync() }} />
   // ✅ <form onSubmit={(e) => { void handleSubmit(e) }} />
   ```

3. **Callback prop TypeScript**: sempre property syntax, MAI method shorthand.
   ```ts
   // ❌ type Props = { onFoo(): void }
   // ✅ type Props = { onFoo: () => void }
   ```

4. **Globals whitelist ESLint**: solo `window/document/navigator/console`. Per UUID usa `generateId()` da `@/utils/id-utils`, per timer usa `window.setTimeout`. Mai `setTimeout` nudo, mai `crypto.randomUUID` nudo, mai namespace `React.Foo` (importa i tipi direttamente da `'react'`).

5. **`import type { JSX } from 'react'`** obbligatorio nei `.tsx` perché `tsconfig.json` ha `types: [...]` che esclude `@types/react`.

6. **`tsc -b --noEmit` fallisce** in TS 5.6+ → lo script `typecheck` esegue `tsc --noEmit && tsc --noEmit -p tsconfig.node.json`. Usa sempre `npm run typecheck`.

7. **Scope regole qualità**: valgono anche per config files root (`vite.config.ts`, `vitest.config.ts`, ecc.), non solo `src/**`.

### B.6 Pattern service con transazione Dexie (da copiare)

Questo è il template da replicare in `catalogService.recordUsage` (per upsert dentro la tx di `createItem`). Preso da `src/services/item-service.ts:28-85`:

```ts
async function createItem(input: CreateItemInput): Promise<AppResult<Item>> {
  const validationError = validateItemInput({
    name: input.name, quantity: input.quantity, notes: input.notes,
  })
  if (validationError) return { data: null, error: validationError }

  const userId = getCurrentUserId()
  const now = Date.now()
  const id = generateId()
  const trimmedName = input.name.trim()

  try {
    const newItem = await db.transaction('rw', db.items, db.changeLog, async (tx) => {
      const maxSort = await itemRepository.getMaxSortOrder(input.listId, tx)
      const item: Item = { /* ... */ }
      await itemRepository.create(item, tx)
      const logEntry: ChangeLogEntry = { /* ... */ }
      await changeLogRepository.append(logEntry, tx)
      return item
    })
    return { data: newItem, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}
```

**Phase 1 modifica richiesta:** aggiungere `db.itemCatalog` al set di tabelle della transazione e chiamare `catalogService.recordUsage(trimmedName, { category, unit, quantity }, tx)` come ultima operazione prima del `return item`.

### B.7 Pattern repository con `tx?: Transaction` (da copiare)

Da `src/repositories/item-repository.ts:1-16`:

```ts
import { db } from '@/db/database'
import type { Item } from '@/db/types'
import type { Table, Transaction } from 'dexie'

function itemsTable(tx?: Transaction): Table<Item, string> {
  if (tx) return tx.table<Item, string>('items')
  return db.items
}

export const itemRepository = {
  async create(item: Item, tx?: Transaction): Promise<void> {
    await itemsTable(tx).add(item)
  },
  // ...
}
```

**Replicare** per `catalog-repository.ts` con helper `catalogTable(tx?)`.

### B.8 File di stato attuali da leggere prima di toccarli

Il new-conversation agent DEVE leggere questi 11 file prima di iniziare Phase 0:

1. `src/db/database.ts` — schema Dexie
2. `src/db/types.ts` — tutti i tipi entità (incluso `CatalogItem`)
3. `src/services/item-service.ts` — pattern tx, firma `CreateItemInput`, `UpdateItemInput`
4. `src/services/item-service.test.ts` — struttura test service (per estendere con test catalog)
5. `src/repositories/item-repository.ts` — pattern repository
6. `src/hooks/use-items.ts` — firma `UseItemsResult`
7. `src/components/items/item-row.tsx` — stato attuale da refactorare
8. `src/components/items/item-form.tsx` — label da localizzare
9. `src/components/items/item-quick-add-bar.tsx` — stato attuale da refactorare
10. `src/pages/list-page.tsx` — call-sites
11. `src/utils/validation.ts` — `LIMITS` e validatori

### B.9 Test attuali da NON rompere

```
src/hooks/use-items.test.ts              (4 test)
src/hooks/use-lists.test.ts              (4 test)
src/hooks/use-deleted-items.test.ts      (3 test)
src/services/item-service.test.ts        (21 test)
src/services/list-service.test.ts        (16 test)
src/repositories/item-repository.test.ts (5 test)
src/repositories/list-repository.test.ts (5 test)
src/repositories/change-log-repository.test.ts (alcuni smoke)
src/utils/*.test.ts                      (validazione + diff ~15 test)
```

Totale ~75 test. Obiettivo fine Phase 9: ~99 test (75 + 24 nuovi).

---

## C. Contesto del refinement

### C.1 Pain points UX identificati dall'utente

1. **Controlli di aggiunta articolo disposti male** — `ItemQuickAddBar` accetta solo il nome. Categoria, quantità e unità richiedono di aprire il modale `ItemForm` DOPO la creazione. Due step per un'operazione che dovrebbe essere una.
2. **Categoria/quantità/unità non specificabili al momento dell'input** — conseguenza diretta del #1.
3. **Autocompletamento sugli articoli da migliorare** — il piano originale lo colloca in Sprint 5, ma oggi **non esiste affatto** (né repo, né service, né UI). La tabella Dexie `itemCatalog` è però già dichiarata in schema v1 → infrastruttura pronta, manca il layer applicativo.
4. **Marcare come acquistato cliccando direttamente sull'articolo** (non solo sul checkbox).
5. **Accesso CRUD scomodo** — oggi serve cliccare `⋮` → "Modifica"/"Elimina". Due tap per operazioni frequenti.

### C.2 Decisioni prese con l'utente (2026-04-15, via AskUserQuestion)

- **Autocomplete** ⇒ **catalogo persistente Dexie** (anticipa Sprint 5 S5-01/02/03).
- **Quick-add** ⇒ **progressive disclosure** (bar compatta → espansa al focus con chips categoria, stepper quantità, dropdown unità).
- **Row actions** ⇒ layout ibrido (§D.5): tap sull'area nome toggla, icone ✎ e 🗑 sempre visibili gestiscono CRUD, checkbox a11y mantenuto.
- **Toggle** ⇒ checkbox mantenuto per a11y keyboard.

---

## D. Decisioni architetturali

### D.1 Dove vive il catalogo articoli

Nuovi file:
- `src/repositories/catalog-repository.ts`
- `src/services/catalog-service.ts`
- `src/hooks/use-catalog-suggestions.ts`
- `src/components/items/item-name-autocomplete.tsx`

**Scrittura:** modifico `itemService.createItem` per aggiornare `itemCatalog` dentro la **stessa transazione** che già tocca `items + changeLog`. Pattern `upsert` per nome normalizzato.

**Lettura:** `catalogRepository.searchByPrefix(prefix, userId, limit)` sull'indice `&name` di Dexie. `catalogService.getSuggestions(query, limit=5)` combina prefix-match + ordinamento per `frequency desc, lastUsedAt desc`.

### D.2 Schema Dexie — ZERO migration

Restiamo su v1. Usiamo `.where('name').startsWithIgnoreCase(prefix)` filtrato in memoria per `userId === getCurrentUserId()`. In Sprint 1 c'è un solo user (`local-user-stub`), filtro userId è equivalente a `.toArray()`.

### D.3 Catalogo è locale-only, NON sync

Il `catalogRepository` NON scrive su `changeLog`. Motivazione: in Sprint 3 il sync processa `changeLog` per replicare solo le entità dominio (`LIST`, `ITEM`, `INVITE`). Il catalogo è un indice personale derivabile (`DISTINCT name FROM items GROUP BY name`), riaggregabile offline. Evitare entry extra nel changeLog riduce il debito sync.

La task `S5-04` ("Sync catalogo tra collaboratori") resta nel plan di Sprint 5, sarà implementata allora con strategia dedicata.

### D.4 Label localizzati categoria/unità

Nuovo file: `src/utils/item-labels.ts` con mappe italiane:

```ts
import type { Category, UnitOfMeasure } from '@/db/types'

export const CATEGORY_LABELS_IT: Record<Category, string> = {
  fruits_vegetables: 'Frutta e verdura',
  dairy: 'Latticini',
  meat_fish: 'Carne e pesce',
  beverages: 'Bevande',
  frozen: 'Surgelati',
  pantry: 'Dispensa',
  bakery: 'Panetteria',
  cleaning: 'Pulizie',
  personal_care: 'Cura persona',
  other: 'Altro',
}

export const UNIT_LABELS_IT: Record<UnitOfMeasure, string> = {
  kg: 'kg', g: 'g', mg: 'mg',
  l: 'L', ml: 'ml', cl: 'cl',
  pcs: 'pz', pack: 'conf.', box: 'scat.',
  bottle: 'bott.', can: 'latt.', bag: 'busta',
}

export function formatCategory(c: Category | null): string {
  return c === null ? '' : CATEGORY_LABELS_IT[c]
}

export function formatUnit(u: UnitOfMeasure | null): string {
  return u === null ? '' : UNIT_LABELS_IT[u]
}
```

Usato da `ItemRow`, `ItemForm`, `ItemQuickAddBar`, `ItemTrashRow`.

### D.5 Risoluzione tensione req #4 vs scelta Q3 — **layout ibrido**

La requisito #4 chiede "cliccando direttamente sull'articolo per marchiarlo come acquistato". La scelta Q3 dell'AskUserQuestion era "tap su riga → inline edit". Incompatibili se lette letteralmente.

**Layout risolutivo** (onora entrambi):

```
┌──────────────────────────────────────────────┐
│ ☐   Latte 1 L                     ✎    🗑   │
│     [Latticini] note breve                   │
└──────────────────────────────────────────────┘
 ↑   ↑                              ↑    ↑
 |   └── tap qui = TOGGLE (req #4)   |    └── delete (req #5, no ⋮)
 |       (area nome/quantità/badge)  └─── edit (req #5, no ⋮)
 └─ checkbox a11y keyboard = TOGGLE
```

**Meccanica DOM:**
- `<li>` contiene: `<input type="checkbox">`, `<button className="flex-1 text-left" onClick={onToggle}>...body...</button>`, due `<button>` icone con `onClick={(e) => { e.stopPropagation(); onEdit() }}` e idem per delete.
- Tap sull'area body (dentro il button flex-1) invoca `onToggle`.
- Tap sulle icone ✎/🗑 invoca edit/delete e NON propaga al parent (stopPropagation).
- Checkbox resta con `onChange={onToggle}` (accessibile da tastiera).
- **Risultato:** req #4, #5 e intento Q3 (eliminare il menu ⋮) tutti soddisfatti.
- Touch targets icone ≥ 40×40 px via `min-w-[40px] min-h-[40px] p-2`.

### D.6 Quick-add progressive disclosure

Nuovo `ItemQuickAddBar` con stato `expanded: boolean`. Al focus sull'input nome si espande, al blur con `name` vuoto collassa.

- **Riga 1 (sempre):** `<ItemNameAutocomplete>` (flex-1) + bottone `+` grande (44×44 px touch target).
- **Riga 2 (expanded):** chip categoria top-4 (hardcoded per ora: Frutta&verdura, Latticini, Panetteria, Carne&pesce) + chip "Altre…" → apre `<select>` con tutte. Stepper quantità `[−] n [+]` (min 0, max 9999). Dropdown unità compatto.
- **`onSuggestionPick(suggestion)`:** pre-popola `category/unit/quantity` dai default del suggerimento, **senza sovrascrivere valori già editati dall'utente** (check se i campi sono al default prima di scriverci).
- **Firma `onSubmit` cambia** da `(name: string) => Promise<AppResult<Item>>` a `(input: Omit<CreateItemInput, 'listId'>) => Promise<AppResult<Item>>` — allineata a `useItems.create`.
- **Flow atteso:**
  1. Focus → bar espansa
  2. Digita "lat" → dropdown autocomplete 5 suggerimenti dal catalog (dopo debounce 200ms)
  3. ↓/↑ + Enter pick → pre-popola campi
  4. `+` o Enter nel campo nome → `itemsHook.create({ name, category, unit, quantity })`
  5. Reset ma resta espansa, autofocus su nome

---

## E. Piano per fasi — dettaglio eseguibile

Ogni fase è un commit point. Gate "typecheck + lint + test" deve essere verde prima di passare alla successiva. A fine fase si listano i file modificati/nuovi; l'utente committa manualmente.

### Phase 0 — Setup & labels (0.5h)

**File nuovi:** `src/utils/item-labels.ts` (vedi snippet completo §D.4)

**File nuovi (test):** nessuno in Phase 0 (le mappe sono static const).

**Gate:** `npm run typecheck` ✅

**File pronti al commit:** 1 nuovo.

---

### Phase 1 — Catalog repository + service + test (1.5h)

**Sub-fase 1a: repository**

`src/repositories/catalog-repository.ts`:

```ts
import { db } from '@/db/database'
import type { CatalogItem } from '@/db/types'
import type { Table, Transaction } from 'dexie'

function catalogTable(tx?: Transaction): Table<CatalogItem, string> {
  if (tx) return tx.table<CatalogItem, string>('itemCatalog')
  return db.itemCatalog
}

export const catalogRepository = {
  async getByName(name: string, tx?: Transaction): Promise<CatalogItem | undefined> {
    return catalogTable(tx).where('name').equals(name).first()
  },

  async add(entry: CatalogItem, tx?: Transaction): Promise<void> {
    await catalogTable(tx).add(entry)
  },

  async update(id: string, changes: Partial<CatalogItem>, tx?: Transaction): Promise<number> {
    return catalogTable(tx).update(id, changes)
  },

  async searchByPrefix(prefix: string, userId: string, limit: number): Promise<CatalogItem[]> {
    const results = await db.itemCatalog
      .where('name').startsWithIgnoreCase(prefix)
      .toArray()
    return results
      .filter(r => r.userId === userId)
      .sort((a, b) => {
        if (b.frequency !== a.frequency) return b.frequency - a.frequency
        return b.lastUsedAt - a.lastUsedAt
      })
      .slice(0, limit)
  },

  async topByFrequency(userId: string, limit: number): Promise<CatalogItem[]> {
    const all = await db.itemCatalog.where('userId').equals(userId).toArray()
    return all
      .sort((a, b) => {
        if (b.frequency !== a.frequency) return b.frequency - a.frequency
        return b.lastUsedAt - a.lastUsedAt
      })
      .slice(0, limit)
  },
}
```

**Gotcha normalizzazione:** `name` è memorizzato sempre in `trim().toLowerCase()`. Il display applicherà capitalizzazione a UI.

**Sub-fase 1b: service**

`src/services/catalog-service.ts`:

```ts
import type { Transaction } from 'dexie'
import type { CatalogItem, Category, UnitOfMeasure } from '@/db/types'
import type { AppResult } from '@/types/ui'
import { catalogRepository } from '@/repositories/catalog-repository'
import { generateId } from '@/utils/id-utils'
import { getCurrentUserId } from '@/stores/auth-store'
import { mapDbError } from './_internal/map-db-error'

const MIN_QUERY_LENGTH = 2
const STALE_DEFAULT_MS = 30 * 24 * 60 * 60 * 1000 // 30 giorni

export type CatalogDefaults = {
  category: Category | null
  unit: UnitOfMeasure | null
  quantity: number | null
}

async function getSuggestions(query: string, limit = 5): Promise<AppResult<CatalogItem[]>> {
  try {
    const userId = getCurrentUserId()
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return { data: await catalogRepository.topByFrequency(userId, limit), error: null }
    }
    const results = await catalogRepository.searchByPrefix(trimmed.toLowerCase(), userId, limit)
    return { data: results, error: null }
  } catch (e) {
    return { data: null, error: mapDbError(e) }
  }
}

/**
 * Chiamata DENTRO itemService.createItem transaction.
 * Upsert per nome normalizzato: se esiste incrementa frequency + aggiorna lastUsedAt;
 * aggiorna defaults solo se null o se più vecchi di STALE_DEFAULT_MS.
 */
async function recordUsage(
  rawName: string,
  defaults: CatalogDefaults,
  tx: Transaction,
): Promise<void> {
  const normalizedName = rawName.trim().toLowerCase()
  if (normalizedName.length === 0) return
  const now = Date.now()
  const userId = getCurrentUserId()
  const existing = await catalogRepository.getByName(normalizedName, tx)

  if (existing) {
    const updates: Partial<CatalogItem> = {
      frequency: existing.frequency + 1,
      lastUsedAt: now,
    }
    const stale = now - existing.lastUsedAt > STALE_DEFAULT_MS
    if (existing.defaultCategory === null || stale) {
      if (defaults.category !== null) updates.defaultCategory = defaults.category
    }
    if (existing.defaultUnit === null || stale) {
      if (defaults.unit !== null) updates.defaultUnit = defaults.unit
    }
    if (existing.defaultQuantity === null || stale) {
      if (defaults.quantity !== null) updates.defaultQuantity = defaults.quantity
    }
    await catalogRepository.update(existing.id, updates, tx)
  } else {
    const entry: CatalogItem = {
      id: generateId(),
      userId,
      name: normalizedName,
      frequency: 1,
      lastUsedAt: now,
      defaultCategory: defaults.category,
      defaultUnit: defaults.unit,
      defaultQuantity: defaults.quantity,
    }
    await catalogRepository.add(entry, tx)
  }
}

export const catalogService = {
  getSuggestions,
  recordUsage,
}
```

**Sub-fase 1c: integrazione con `item-service.ts`**

Modifica a `createItem` (riga ~42 attuale):

```ts
// PRIMA
const newItem = await db.transaction('rw', db.items, db.changeLog, async (tx) => { ... })

// DOPO
const newItem = await db.transaction('rw', db.items, db.changeLog, db.itemCatalog, async (tx) => {
  // ... logica esistente ...
  await changeLogRepository.append(logEntry, tx)
  await catalogService.recordUsage(trimmedName, {
    category: input.category ?? null,
    unit: input.unit ?? null,
    quantity: input.quantity ?? null,
  }, tx)
  return item
})
```

Import da aggiungere in `item-service.ts`: `import { catalogService } from './catalog-service'`.

**File nuovi (test):**
- `src/repositories/catalog-repository.test.ts` (4-5 smoke test):
  1. add + getByName case-insensitive
  2. searchByPrefix con risultati ordinati per frequency
  3. topByFrequency limite rispettato
  4. update incrementa frequency
  5. filtraggio per userId
- `src/services/catalog-service.test.ts` (6-8 test):
  1. getSuggestions con query vuota → topByFrequency
  2. getSuggestions con query < 2 → topByFrequency
  3. getSuggestions con prefix match → risultati ordinati
  4. recordUsage nuovo nome → crea entry con frequency=1
  5. recordUsage nome esistente → frequency incrementa
  6. recordUsage default aggiornato solo se null
  7. recordUsage default aggiornato se stale (> 30 giorni)
  8. recordUsage normalizza case+trim

**File modificati (test):**
- `src/services/item-service.test.ts`: aggiungere 2 test:
  1. `createItem` popola itemCatalog per nome nuovo
  2. `createItem` incrementa frequency per nome duplicato

**Gate:** typecheck + lint + test (75 + ~13 = ~88)

**File pronti al commit:** 3 nuovi src + 2 nuovi test + 2 modificati.

---

### Phase 2 — Hook `use-catalog-suggestions` (0.5h)

**File nuovi:** `src/hooks/use-catalog-suggestions.ts`:

```ts
import { useEffect, useState } from 'react'
import type { CatalogItem } from '@/db/types'
import { catalogService } from '@/services/catalog-service'

const DEBOUNCE_MS = 200

export type UseCatalogSuggestionsResult = {
  suggestions: CatalogItem[]
  isLoading: boolean
}

export function useCatalogSuggestions(query: string, limit = 5): UseCatalogSuggestionsResult {
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const handle = window.setTimeout(() => {
      void (async () => {
        const result = await catalogService.getSuggestions(query, limit)
        if (result.data) setSuggestions(result.data)
        setIsLoading(false)
      })()
    }, DEBOUNCE_MS)
    return () => { window.clearTimeout(handle) }
  }, [query, limit])

  return { suggestions, isLoading }
}
```

**Gotcha:** NON usare `useLiveQuery` qui. I suggerimenti sono derivation on-demand, non subscription reattiva su tutti i cambiamenti del catalogo.

**File nuovi (test):** `src/hooks/use-catalog-suggestions.test.ts` (3 test, con `vi.useFakeTimers()`):
1. query vuota dopo debounce → suggestions popolate da topByFrequency
2. query con prefix → suggestions filtrate
3. debounce rispetta 200ms (fake timer advance)

**Gate:** typecheck + lint + test (~91 test)

---

### Phase 3 — `ItemNameAutocomplete` component (1h)

**File nuovi:** `src/components/items/item-name-autocomplete.tsx`. Target <150 LOC.

**Firma:**
```ts
type Props = {
  value: string
  onChange: (value: string) => void
  onSuggestionPick: (suggestion: CatalogItem) => void
  onSubmitEnter: () => void
  inputRef?: RefObject<HTMLInputElement>
  placeholder?: string
  disabled?: boolean
  className?: string
}
```

**Logica:**
- Usa `useCatalogSuggestions(value)`.
- Stato locale: `focused: boolean`, `highlightedIndex: number | null`.
- Dropdown visibile quando `focused && suggestions.length > 0`.
- Posizionamento: `absolute` bottom-full (sopra l'input) perché la quick-add bar è sticky-bottom.
- Keyboard: ↓/↑ cambiano `highlightedIndex`, Enter con highlightedIndex≠null → `onSuggestionPick`, Enter senza selezione → `onSubmitEnter`, Esc chiude.
- `onBlur` con `setTimeout 150ms` per permettere il click sulle voci prima di chiudere.
- Ogni voce: nome formattato (capitalize) + `Badge` categoria default (se presente) + qty default piccolo grigio.
- ARIA: `role="combobox"` sull'input wrapper, `aria-expanded`, `aria-activedescendant`, opzioni con `role="option"` e `id="suggestion-{n}"`.

**Gotcha stopPropagation:** se montato dentro un `<form>`, Enter deve **solo** triggerare `onSubmitEnter` se `highlightedIndex === null`; altrimenti deve prevenire il submit del form e chiamare `onSuggestionPick`. Usa `e.preventDefault()` sul keydown Enter con highlight attivo.

**File nuovi (test):** rinviato a Phase 7

**Gate:** typecheck + lint ✅

---

### Phase 4 — `ItemQuickAddBar` progressive disclosure (1.5h)

**File modificati:** `src/components/items/item-quick-add-bar.tsx`. Refactor completo. Target <200 LOC, se sfora estrarre `item-quick-add-bar-expanded.tsx`.

**Nuova firma (breaking — 1 sola call-site):**
```ts
type QuickAddInput = {
  name: string
  category: Category | null
  unit: UnitOfMeasure | null
  quantity: number | null
}

type Props = {
  onSubmit: (input: QuickAddInput) => Promise<AppResult<Item>>
}
```

**Stato interno:**
- `name: string`
- `expanded: boolean`
- `category: Category | null`
- `unit: UnitOfMeasure | null`
- `quantity: number | null` (default null, stepper parte da 1 al primo +)
- `userTouchedCategory/Unit/Quantity: boolean` (per onSuggestionPick intelligente)
- `submitting: boolean`

**Layout:**
```tsx
<form className="sticky bottom-0 border-t bg-white p-3 space-y-2">
  <div className="flex gap-2">
    <ItemNameAutocomplete
      value={name}
      onChange={setName}
      onSuggestionPick={handlePick}
      onSubmitEnter={() => { void handleSubmit() }}
      inputRef={inputRef}
      placeholder="Aggiungi articolo..."
      className="flex-1"
    />
    <Button type="submit" disabled={!canSubmit} className="min-w-[44px] min-h-[44px]">
      +
    </Button>
  </div>
  {expanded && (
    <div className="flex flex-wrap gap-2">
      {TOP_CATEGORIES.map(c => <CategoryChip key={c} active={category===c} onClick={...} />)}
      <Button variant="ghost" size="sm" onClick={() => setShowAllCategories(true)}>Altre…</Button>
      <QuantityStepper value={quantity ?? 0} onChange={setQuantity} />
      <UnitSelect value={unit} onChange={setUnit} />
    </div>
  )}
</form>
```

**`handlePick(suggestion)`:**
```ts
setName(suggestion.name) // capitalize per UI? o mantieni lowercase? → capitalize nel display dropdown, ma memorizzato lowercase
if (!userTouchedCategory && suggestion.defaultCategory !== null) setCategory(suggestion.defaultCategory)
if (!userTouchedUnit && suggestion.defaultUnit !== null) setUnit(suggestion.defaultUnit)
if (!userTouchedQuantity && suggestion.defaultQuantity !== null) setQuantity(suggestion.defaultQuantity)
inputRef.current?.focus()
```

**`handleSubmit()`:**
```ts
if (!canSubmit) return
setSubmitting(true)
const result = await onSubmit({ name: name.trim(), category, unit, quantity })
setSubmitting(false)
if (result.error) { uiStore.pushToast('error', result.error.message); return }
// reset parziale: mantieni expanded per rapid add
setName(''); setCategory(null); setUnit(null); setQuantity(null)
setUserTouchedCategory(false); setUserTouchedUnit(false); setUserTouchedQuantity(false)
inputRef.current?.focus()
```

**Collapse on blur:** `onBlur` sul form con timeout 200ms — se focus esce dal form (e non solo si sposta tra i campi interni) e `name === ''`, `setExpanded(false)`.

**Call-site update:** `src/pages/list-page.tsx:95`:
```tsx
// PRIMA
<ItemQuickAddBar onSubmit={(name) => itemsHook.create({ name })} />

// DOPO
<ItemQuickAddBar onSubmit={(input) => itemsHook.create(input)} />
```

Nota: `useItems.create` ha firma `(input: Omit<CreateItemInput, 'listId'>) => Promise<AppResult<Item>>`, quindi passare `input` direttamente funziona.

**Gate:** typecheck + lint + test esistenti ✅ (i test su `item-service` verificano automaticamente che il catalog upsert non rompa i test esistenti)

---

### Phase 5 — `ItemRow` refactor: tap-to-toggle + inline edit/delete (1h)

**File modificati:** `src/components/items/item-row.tsx`. Rimuovi tutto lo stato `menuOpen` e il menu `⋮`. Target <100 LOC.

```tsx
import type { JSX, MouseEvent } from 'react'
import type { Item } from '@/db/types'
import { Badge } from '@/components/common/badge'
import { formatCategory, formatUnit } from '@/utils/item-labels'

type Props = {
  item: Item
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ItemRow({ item, onToggle, onEdit, onDelete }: Props): JSX.Element {
  const isCompleted = item.status === 'completed'

  const handleEdit = (e: MouseEvent): void => {
    e.stopPropagation()
    onEdit()
  }

  const handleDelete = (e: MouseEvent): void => {
    e.stopPropagation()
    onDelete()
  }

  return (
    <li className="flex items-center gap-2 rounded border bg-white p-2">
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={onToggle}
        className="h-5 w-5 cursor-pointer accent-brand-600"
        aria-label={
          isCompleted
            ? `Segna ${item.name} come da comprare`
            : `Segna ${item.name} come completato`
        }
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Toggla stato di ${item.name}`}
        className={`flex-1 rounded p-2 text-left hover:bg-gray-50 ${
          isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
        }`}
      >
        <div className="font-medium">{item.name}</div>
        {(item.quantity !== null || item.notes) && (
          <div className="mt-1 text-xs text-gray-500">
            {item.quantity !== null && (
              <span>
                {item.quantity}
                {item.unit ? ` ${formatUnit(item.unit)}` : ''}
              </span>
            )}
            {item.notes && <span className="ml-2 italic">{item.notes}</span>}
          </div>
        )}
        {item.category && (
          <div className="mt-1">
            <Badge>{formatCategory(item.category)}</Badge>
          </div>
        )}
      </button>
      <button
        type="button"
        onClick={handleEdit}
        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded hover:bg-gray-100"
        aria-label={`Modifica ${item.name}`}
      >
        ✎
      </button>
      <button
        type="button"
        onClick={handleDelete}
        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded text-red-600 hover:bg-red-50"
        aria-label={`Elimina ${item.name}`}
      >
        🗑
      </button>
    </li>
  )
}
```

**Gotcha keyboard:** il `<button>` body è raggiungibile via Tab. Invio su di esso triggra `onToggle`. Doppio input method (checkbox + button) è intenzionale, lo screen reader leggerà entrambi ma con `aria-label` distinti.

**Gotcha emoji icons:** ✎ e 🗑 sono acceptabili come placeholder. Se serve più coerenza visiva, usare icone SVG inline (no lib — manteniamo zero dipendenze nuove). In questa iterazione teniamo le emoji.

**Gate:** typecheck + lint ✅

---

### Phase 6 — `ItemForm` label localizzati (0.5h)

**File modificati:** `src/components/items/item-form.tsx`.

Sostituisci:
```tsx
{UNITS.map(u => <option key={u} value={u}>{u}</option>)}
```
con:
```tsx
import { CATEGORY_LABELS_IT, UNIT_LABELS_IT } from '@/utils/item-labels'
// ...
{UNITS.map(u => <option key={u} value={u}>{UNIT_LABELS_IT[u]}</option>)}
{CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS_IT[c]}</option>)}
```

Nient'altro cambia. Form modale invariato.

**Gate:** typecheck + lint ✅

---

### Phase 7 — Test di componente essenziali (1h)

Target copertura minima delle aree nuove. Niente 100%.

**File nuovi:**

- `src/components/items/item-row.test.tsx` (4 test):
  1. Render base: mostra nome, quantità, unità localizzata, badge categoria localizzato
  2. Click sul button body → chiama `onToggle`
  3. Click su ✎ → chiama `onEdit`, NON chiama `onToggle`
  4. Click su 🗑 → chiama `onDelete`, NON chiama `onToggle`

- `src/components/items/item-quick-add-bar.test.tsx` (3 test):
  1. Render compatto (non expanded) all'inizio
  2. Focus sull'input → bar si espande rivelando stepper, unit select, chip categoria
  3. Submit con tutti i campi → chiama `onSubmit` con `{ name, category, unit, quantity }` completo

- `src/components/items/item-name-autocomplete.test.tsx` (3 test, con `vi.useFakeTimers()`):
  1. Digitare query "lat" + avanzare timer → dropdown mostra suggerimenti
  2. Click su una voce → chiama `onSuggestionPick` con il `CatalogItem` intero
  3. Esc → chiude dropdown

**Setup test:** usa `renderHook` + `@testing-library/react`. Per i component test serve `render()`. Mock `catalogService.getSuggestions` nei test di `ItemNameAutocomplete` con `vi.spyOn`.

**Gate:** `npm run test` → target ~101 test green.

---

### Phase 8 — Docs & mappa progetto (0.5h)

**File modificati:**

1. `docs/mappa-progetto.md` — aggiungere nuovi file in sezioni appropriate:
   - Sezione repositories: `catalog-repository.ts`
   - Sezione services: `catalog-service.ts`
   - Sezione hooks: `use-catalog-suggestions.ts`
   - Sezione components/items: `item-name-autocomplete.tsx`
   - Sezione utils: `item-labels.ts`

2. `docs/piano-sviluppo.md` — aggiungere sezione nuova:
   ```md
   ## Sprint 1.5 — Item CRUD UX Refinement (2026-04-15)

   Refinement UX dopo Sprint 1, anticipa parzialmente S5-01/02/03 (catalog locale).
   Plan: [delightful-dazzling-quokka.md](...)

   | ID | Task | Stato |
   |----|------|-------|
   | S1.5-00 | Labels italiani categoria/unità | [✅] |
   | S1.5-01 | catalog-repository + test | [✅] |
   | S1.5-02 | catalog-service + integration item-service | [✅] |
   | S1.5-03 | use-catalog-suggestions hook | [✅] |
   | S1.5-04 | item-name-autocomplete component | [✅] |
   | S1.5-05 | ItemQuickAddBar progressive disclosure | [✅] |
   | S1.5-06 | ItemRow refactor tap-to-toggle + inline icons | [✅] |
   | S1.5-07 | ItemForm label localizzati | [✅] |
   | S1.5-08 | Component tests (item-row, quick-add, autocomplete) | [✅] |
   | S1.5-09 | Docs update | [✅] |
   ```
   + marcare S5-01, S5-02, S5-03 come "parzialmente anticipate in Sprint 1.5".

3. `CLAUDE.md` — sezione "Stato Progetto":
   - Data 2026-04-15
   - Menzionare refinement UX
   - Menzionare catalog anticipato locale-only (no sync)
   - Aggiornare test count a ~101

**Gate:** nessuno tecnico. Lettura rapida per coerenza.

---

### Phase 9 — Final DoD (0.5h)

Comandi gate:
```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Attesi: tutti verdi, `~101` test, bundle size < 360 KB (attuale 328 KB).

**Smoke manuale offline** (DevTools → Network → Offline):
1. `/` → crea lista "Spesa test" → entra
2. Focus sulla quick-add bar → verifica espansione (stepper, chips, unit)
3. Digita "pomodori" → nessun suggerimento (catalog vuoto) → seleziona chip "Frutta&verdura", stepper 3, unit "kg" → `+`
4. Ripeti con "latte" → chip "Latticini", stepper 2, unit "L" → `+`
5. Tap sull'area nome "pomodori" → toggla (strikethrough)
6. Tap su ✎ pomodori → apre ItemForm in edit con valori pre-popolati
7. Tap su 🗑 latte → apre confirm → elimina
8. Nella quick-add bar digita "lat" → verifica dropdown suggerimenti mostra "latte" con default (dairy, L, 2) pre-popolato al pick
9. DevTools → IndexedDB → ShoppingListDB → itemCatalog → verifica entry "latte" con `frequency: 1` (non si è ancora ricreato); dopo il pick e un nuovo `+`, `frequency: 2`
10. DevTools → IndexedDB → ShoppingListDB → changeLog → verifica NO entry con `entityType: 'CATALOG'` (architettura §D.3)
11. Resize 375×667 (iPhone SE) → verifica layout responsive
12. Offline test end-to-end: tutte le operazioni funzionano senza rete

**File pronti al commit:** totali fine sprint:
- 11 nuovi
- 8 modificati

---

## F. File summary totali

**Nuovi (11 file):**
```
src/utils/item-labels.ts
src/repositories/catalog-repository.ts
src/repositories/catalog-repository.test.ts
src/services/catalog-service.ts
src/services/catalog-service.test.ts
src/hooks/use-catalog-suggestions.ts
src/hooks/use-catalog-suggestions.test.ts
src/components/items/item-name-autocomplete.tsx
src/components/items/item-row.test.tsx
src/components/items/item-quick-add-bar.test.tsx
src/components/items/item-name-autocomplete.test.tsx
```

**Modificati (8 file):**
```
src/services/item-service.ts          (aggiungi catalogService.recordUsage in tx + db.itemCatalog a tabelle tx)
src/services/item-service.test.ts     (+2 test catalog integration)
src/components/items/item-row.tsx     (refactor: no ⋮ menu, inline icons, tap-to-toggle)
src/components/items/item-quick-add-bar.tsx  (refactor: progressive disclosure + autocomplete)
src/components/items/item-form.tsx    (label localizzati)
src/pages/list-page.tsx               (call-site onSubmit quick-add aggiornato)
docs/mappa-progetto.md
docs/piano-sviluppo.md
CLAUDE.md
```

Totale: **19 file** toccati.

---

## G. Rischi e mitigazioni

| Rischio | Prob. | Impatto | Mitigazione |
|---|---|---|---|
| Race su `itemCatalog.upsert` dentro tx | Bassa | Medio | Tx include `db.itemCatalog`, upsert è `get → update OR add` atomico dentro la stessa rw-tx |
| Click su ✎/🗑 triggera anche il button parent | Media | Medio | `e.stopPropagation()` esplicito + 3 test di regressione in Phase 7 |
| Dropdown autocomplete clip-behind di sticky bar | Media | Basso | `position: absolute` con `bottom-full` e `z-20` esplicito, verificato a 375×667 |
| `startsWithIgnoreCase` non case-insensitive | Bassa | Medio | Dexie 4 lo supporta; fallback: normalize lowercase in repository (scelto) |
| Refactor `ItemRow` rompe test esistenti | Nulla | — | Nessun test componente su `item-row` oggi |
| Firma `ItemQuickAddBar.onSubmit` cambia → rompe call-site | Nulla | — | Unica call-site: `src/pages/list-page.tsx:95`, aggiornata in stessa fase |
| `catalogService.recordUsage` rompe test `item-service.test.ts` esistenti | Bassa | Alto | I 21 test esistenti non verificano content di `itemCatalog` → zero impact. Ma `fake-indexeddb` deve includere `itemCatalog` nella transazione rw — verificare che non esploda all'add `db.itemCatalog` al set tabelle tx |
| Deviazione da Q3 literal (tap→edit) → utente cambia idea | Bassa | Basso | Codice strutturato con handler separati: invertire body click ↔ ✎ icon è diff di 4 righe |
| Stepper/chip su mobile 375px cramped | Media | Basso | Flex-wrap + min-w-[40px] su touch target; test manuale Phase 9 step 11 |

---

## H. Verifica end-to-end

### H.1 Gate automatici

```bash
cd D:\VibeCoding\ClaudeCourse\Esercizi\Lezione_5\ShoppingList_AdvancedWorkflow\ShoppingList
npm run typecheck  # tsc --noEmit && tsc --noEmit -p tsconfig.node.json
npm run lint       # eslint src --max-warnings 0
npm run test       # vitest run
npm run build      # vite build
```

Attesi:
- typecheck: ✅
- lint: ✅ (zero warnings)
- test: ~101/101 green (75 → +24 nuovi + 2 modificati item-service)
- build: `dist/` generato, bundle size < 360 KB gzipped

### H.2 Smoke manuale

```bash
npm run dev
# Apri https://localhost:5173, accetta cert self-signed
```

Esegui i 12 step elencati in Phase 9. Se tutti verdi → DoD soddisfatta.

### H.3 Verifica IndexedDB (debug)

DevTools → Application → IndexedDB → ShoppingListDB:
- `items`: tutte le voci hanno `category/unit/quantity` se specificati nel quick-add
- `itemCatalog`: una riga per ogni nome distinto, `frequency` crescente su duplicati
- `changeLog`: entry `CREATE ITEM` presenti; NESSUNA entry con `entityType` non in `{LIST, ITEM}`

---

## I. Punto di decisione già risolto

Durante il planning (2026-04-15) l'utente ha esplicitamente approvato:

- **§D.5 layout ibrido** (tap-body=toggle, icone inline=edit/delete): ✅ approvato
- **§D.3 catalog locale-only, no changeLog**: ✅ approvato
- **Effort 6-8h**: l'utente decide in fase di kickoff se spezzare in 2 sessioni (Phase 0-4 + Phase 5-9) o farlo in una singola

---

## J. Chiavi di ricerca per orientarsi

Se il nuovo agent si perde, questi snippet git-grep aiutano:

- "Come si fa una transazione Dexie rw" → `git grep "db.transaction('rw'"` in `src/services/`
- "Come è strutturato un repository thin" → `src/repositories/item-repository.ts`
- "Come è strutturato un service con AppResult" → `src/services/item-service.ts`
- "Come funziona un hook con useLiveQuery" → `src/hooks/use-items.ts`
- "Come è configurato Vitest + fake-indexeddb" → `vitest.config.ts`, `src/test/setup.ts`
- "Convenzioni tailwind brand colors" → `tailwind.config.js`
- "Come usa Radix Dialog" → `src/components/common/modal.tsx`

---

**END OF PLAN**
