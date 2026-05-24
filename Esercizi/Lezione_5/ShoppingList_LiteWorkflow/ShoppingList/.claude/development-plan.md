# ShoppingList MVP - Piano di Sviluppo

## Panoramica

**Progetto**: ShoppingList - PWA per gestione liste della spesa condivise
**Ispirazione**: "Buy me a pie"
**Stack**: HTML5 + TypeScript + Vite + IndexedDB (Dexie.js) + Tailwind CSS + Workbox
**Approccio**: Offline-first, Progressive Enhancement
**Fase**: MVP (Fase 1)

### Scope MVP

**INCLUSO**:
- CRUD liste e articoli con funzionamento offline
- Database articoli locale con autocomplete
- PWA installabile con Service Worker
- Guest mode + autenticazione email/password (locale)
- Condivisione liste (read/write) tramite link
- Sincronizzazione base (last-write-wins) con SyncLog
- Indicatori stato online/offline

**ESCLUSO dal MVP**:
- Push notifications
- OAuth (Google, Apple)
- CRDTs avanzati / Operational Transformation
- Modalita shopping con layout supermercato
- Import/Export CSV/JSON/TXT
- Stampa liste
- Backend remoto (sync engine predisposto ma senza server)

### Documentazione di Riferimento

Ogni task deve leggere i file di documentazione indicati nella sezione "Documentazione da leggere". I file si trovano in:

```
src/.claude/
  ├── CLAUDE.md          → Overview progetto e principi guida
  ├── architecture.md    → Stack, struttura progetto, setup, pattern architetturali
  ├── data-model.md      → Schema DB, interfacce TypeScript, relazioni, query patterns
  ├── features-mvp.md    → Specifiche funzionali dettagliate con UI mockup
  ├── sync-strategy.md   → Architettura sync, SyncLog, conflict resolution
  └── conventions.md     → Code style, naming, error handling, testing, a11y
```

### Architettura Layer

```
UI Layer (Views: HomeView, ListView, AuthView, SettingsView)
    ↕
Components Layer (ListCard, ItemRow, Autocomplete, Modal, Toast, SyncIndicator)
    ↕
Services Layer (ListService, ItemService, ArticleService, AuthService, ShareService, SyncService)
    ↕
Database Layer (ListsDB, ItemsDB, ArticlesDB, UsersDB, SharesDB + schema Dexie)
    ↕
IndexedDB Browser API
```

### Flusso Dati (Offline-First)

```
User Action → Component → Service → DB Layer → IndexedDB
                  ↓
            UI Update (Optimistic)
                  ↓
         SyncLog entry created
                  ↓
         Background Sync (quando online)
```

---

## Fasi di Sviluppo

| Fase | Nome | Task | Stato | Descrizione |
|------|------|------|-------|-------------|
| **1** | **Fondamenta** | 1.1 - 1.4 | ✅ Completata | Setup progetto, modelli dati, database layer, event system |
| **2** | **Core Offline** | 2.1 - 2.5 | ✅ Completata | 5 services (List/Item/Article/Auth/Share) + errors/permissions/PasswordHasher/sync-logger |
| **3** | **UI/UX** | 3.1 - 3.6 | ⬜ Da fare | Component system, HomeView, ListView, modal/form, routing, stili |
| **4** | **Auth & Sharing** | 4.1 - 4.3 | ⬜ Da fare | Guest mode, registrazione, condivisione liste |
| **5** | **Sync & PWA** | 5.1 - 5.4 | ⬜ Da fare | Sync engine, conflict resolution, Service Worker, PWA manifest |
| **6** | **Polish & Test** | 6.1 - 6.3 | ⬜ Da fare | Testing, performance, bug fix e rifinitura |

> **Stato aggiornato al 2026-04-14**: Fasi 1 e 2 completate. Fase 2 ha consegnato i 5 service business-logic (`src/services/` — 11 file sorgente + 7 file di test), 95 nuovi test co-located verdi (183 totali con Fase 1), `pnpm typecheck`/`lint`/`test`/`build` tutti clean, bundle ~48 KB gzipped (target <200 KB). `main.ts` ora bootstrap via `buildServices(db, eventBus, hasher, storage)` con `BcryptHasher` prod e guest-user fallback. Prossimo step: brainstorming/spec/plan per **Fase 3 UI/UX** (viste `src/views/`, componenti `src/components/`, routing).

---

## FASE 1: Fondamenta

> **Nota**: Questa fase è stata rivista nella sessione di brainstorming del 2026-04-13. Vedi `docs/brainstorming/2026-04-13-fase1-fondamenta-summary.md` per il razionale completo delle decisioni. Lo spec dettagliato vive in `docs/superpowers/specs/2026-04-13-fase1-fondamenta-design.md`.

### Task 1.1 - Setup Progetto

**Stato**: ✅ Completato — `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `src/styles/main.css`, `src/test-setup.ts`, `src/main.ts` e `.gitkeep` nelle directory placeholder sono presenti. Acceptance criteria runtime (bundle size, lint 0 warning) da verificare al prossimo `pnpm build && pnpm lint`.

**Obiettivo**: Inizializzare il progetto Vite con TypeScript, Tailwind CSS, Vitest e tutte le dipendenze.

**Documentazione da leggere**: `architecture.md` (sezioni "Setup Iniziale", "Struttura Progetto")

**Azioni richieste**:

1. **Inizializzare progetto Vite** direttamente nella directory del progetto `ShoppingList/`:
   ```bash
   pnpm create vite . --template vanilla-ts
   pnpm install
   ```
   > **Nota brainstorming**: Vite root = `ShoppingList/`. Il source code andrà in `ShoppingList/src/`. NON inizializzare Vite dentro una sottocartella `src/` (come erroneamente indicava una versione precedente del piano).

2. **Installare dipendenze**:
   ```bash
   # Core
   pnpm add dexie

   # Dev / Build
   pnpm add -D tailwindcss postcss autoprefixer
   pnpm add -D vite-plugin-pwa workbox-window
   pnpm add -D @types/node

   # Testing
   pnpm add -D vitest @vitest/ui fake-indexeddb

   # Linting / Formatting (obbligatori, non opzionali)
   pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
   pnpm add -D prettier
   ```

3. **Configurare TypeScript** (`tsconfig.json`):
   - `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
   - **Flag aggiuntivi da brainstorming**: `exactOptionalPropertyTypes: true`, `noImplicitReturns: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noFallthroughCasesInSwitch: true`
   - Path aliases: `@/*`, `@models/*`, `@db/*`, `@services/*`, `@components/*`, `@utils/*`
   - **Alias barrel aggiuntivi**: `@models` → `src/models/index.ts`, `@db` → `src/db/index.ts` (per import del barrel senza `/`)
   - Target: ES2020, module: ESNext
   - Vedi `architecture.md` sezione "TypeScript Config" per configurazione completa

4. **Configurare Vite** (`vite.config.ts`):
   - Path aliases corrispondenti a tsconfig
   - Plugin PWA (configurazione base, sarà completata nel Task 5.3)
   - Build target: es2020
   - Manual chunks per dexie
   - Vedi `architecture.md` sezione "Vite Config" per configurazione completa

5. **Configurare Tailwind CSS**:
   - `tailwind.config.js` con content paths e colori custom primary
   - `postcss.config.js`
   - File `src/styles/main.css` con direttive Tailwind (`@tailwind base/components/utilities`)
   - Vedi `architecture.md` sezione "Tailwind Config"

6. **Creare struttura directory** (le directory non popolate in Fase 1 vengono create con `.gitkeep`):
   ```
   src/
   ├── models/           ← popolato in Task 1.2
   ├── db/               ← popolato in Task 1.3
   ├── utils/            ← popolato in Task 1.4
   ├── styles/           ← main.css in Task 1.1
   ├── services/         ← .gitkeep (Fase 2)
   ├── components/
   │   ├── common/       ← .gitkeep
   │   ├── list/         ← .gitkeep
   │   ├── item/         ← .gitkeep
   │   └── sync/         ← .gitkeep
   ├── views/            ← .gitkeep (Fase 3)
   └── workers/          ← .gitkeep (Fase 5)
   ```

7. **Configurare file base**:
   - `index.html` con meta viewport, link a manifest, div#app
   - `src/main.ts` (bootstrap: apertura DB Dexie, seed idempotente articoli, placeholder DOM "ShoppingList — Fase 1 OK")
   - `src/styles/main.css` con direttive Tailwind
   - `src/test-setup.ts` one-liner `import 'fake-indexeddb/auto';` (usato da Vitest)
   - `.gitignore` (node_modules, dist, .env, .vite)
   - `.env.example`

8. **Configurare linting e formatting** (obbligatori):
   - ESLint + `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin`
   - Prettier con config base
   - Script `pnpm lint` deve passare con 0 warning

9. **Configurare Vitest** (`vitest.config.ts`):
   - `environment: 'node'` (non jsdom — IndexedDB via `fake-indexeddb`)
   - `globals: false` (forza import espliciti)
   - `setupFiles: ['./src/test-setup.ts']`
   - Path aliases allineati a `tsconfig.json`

10. **Script `package.json`**:
    ```json
    {
      "dev":       "vite",
      "build":     "tsc --noEmit && vite build",
      "preview":   "vite preview",
      "test":      "vitest run",
      "test:watch":"vitest",
      "test:ui":   "vitest --ui",
      "lint":      "eslint 'src/**/*.ts'",
      "lint:fix":  "eslint 'src/**/*.ts' --fix",
      "format":    "prettier --write 'src/**/*.{ts,css,json}'",
      "typecheck": "tsc --noEmit"
    }
    ```
    > **Nota brainstorming**: `build` esegue `tsc --noEmit` prima di `vite build` per forzare type-check (Vite di default non lo fa).

**Criteri di accettazione**:
- [ ] `pnpm dev` avvia il dev server senza errori, pagina mostra "ShoppingList — Fase 1 OK"
- [ ] `pnpm build` compila senza errori, bundle JS totale < 200KB gzipped
- [ ] `pnpm typecheck` → 0 errori
- [ ] `pnpm lint` → 0 errori, 0 warning
- [ ] TypeScript strict mode attivo (con flag aggiuntivi sopra)
- [ ] Tailwind CSS funzionante (testare con una classe su index.html)
- [ ] Path aliases funzionanti (testare con un import `from '@models'`)
- [ ] Struttura directory creata con `.gitkeep` dove necessario

**Output atteso**: Progetto funzionante con dev server, build, test setup, lint e tutte le configurazioni.

---

### Task 1.2 - Modelli Dati (Interfaces & Types)

**Stato**: ✅ Completato — `src/models/` contiene `List.ts`, `Item.ts`, `Article.ts`, `User.ts`, `Share.ts`, `SyncTypes.ts`, `index.ts` (barrel export).

**Obiettivo**: Definire tutte le interfacce TypeScript e i tipi del progetto.

**Documentazione da leggere**: `data-model.md` (tutte le sezioni)

**Dipendenze**: Task 1.1 completato

**Azioni richieste**:

1. **Creare `src/models/List.ts`**:
   ```typescript
   // Interfacce: List, NewList, ListWithStats
   // Campi chiave: id, name, ownerId, createdAt, updatedAt, deletedAt (soft delete),
   //               version, lastSyncedAt, sortBy, color
   ```

2. **Creare `src/models/Item.ts`**:
   ```typescript
   // Interfacce: Item, NewItem, ItemWithArticle
   // Type: UnitType = 'pz' | 'kg' | 'g' | 'l' | 'ml' | 'conf' | ''
   // Campi chiave: id, listId, articleId?, customName?, quantity, unit,
   //               notes, checked, checkedAt, checkedBy, order, version
   ```

3. **Creare `src/models/Article.ts`**:
   ```typescript
   // Interfacce: Article, NewArticle, ArticleAutocompleteResult
   // Type: CategoryType = 'frutta-verdura' | 'carne-pesce' | 'latticini' |
   //        'pane-pasta' | 'bevande' | 'surgelati' | 'conserve' | 'pulizia' | 'igiene' | 'altro'
   // Campi chiave: id, name, category, searchTerms[], usageCount, isDefault, version
   ```

4. **Creare `src/models/User.ts`**:
   ```typescript
   // Interfacce: User, NewUser, GuestUser (extends User con deviceId)
   // Campi chiave: id, email?, passwordHash?, name, isGuest, preferences (theme, defaultSortBy)
   ```

5. **Creare `src/models/Share.ts`**:
   ```typescript
   // Interfacce: Share, NewShare, ShareWithUser, ListPermissions
   // Type: Permission = 'read' | 'write'
   // Campi chiave: id, listId, userId, permission, inviteToken?, acceptedAt?
   ```

6. **Creare `src/models/SyncTypes.ts`**:
   ```typescript
   // Interfacce: SyncLog, SyncStatus, SyncConflict
   // Campi SyncLog: id, entityType, entityId, action, payload, timestamp, userId,
   //                synced, syncedAt?, syncError?, retryCount
   ```

7. **Creare `src/models/index.ts`**:
   - Re-export di tutte le interfacce e tipi da un unico punto

**Regole da rispettare** (da `conventions.md`):
- Usare `interface` per modelli dati, `type` per union types
- Usare `undefined` per valori opzionali (non `null`)
- Tutti i timestamp come `number` (Unix timestamp in millisecondi)
- Tutti gli ID come `string` (UUID v4)
- Zero `any` types

**Criteri di accettazione**:
- [ ] Tutti i file compilano senza errori in strict mode
- [ ] Nessun tipo `any` presente
- [ ] Tutti i re-export funzionano da `@models/index`
- [ ] Interfacce complete come da `data-model.md`

**Output atteso**: Tutti i file in `src/models/` con interfacce e tipi completi.

---

### Task 1.3 - Database Layer (Dexie.js)

**Stato**: ✅ Completato — `src/db/` contiene `schema.ts`, `BaseRepository.ts`, `ListsDB.ts`, `ItemsDB.ts`, `ArticlesDB.ts`, `UsersDB.ts`, `SharesDB.ts`, `syncLog.ts` (helper append-only), `seed.ts`, `index.ts`. Test co-located presenti per tutti i repository + `BaseRepository.test.ts` e `syncLog.test.ts`. Gotchas appresi in fase (vedi `CLAUDE.md` sezione Gotchas DB).

**Obiettivo**: Configurare IndexedDB con Dexie.js, schema, seed data e repository per ogni entita.

**Documentazione da leggere**: `data-model.md` (sezioni "Schema IndexedDB", "Seed Data", "Query Patterns")

**Dipendenze**: Task 1.2 completato (modelli definiti)

**Azioni richieste**:

1. **Creare `src/db/schema.ts`** - Definizione database Dexie:
   ```typescript
   // Class ShoppingListDB extends Dexie
   // Tables: lists, items, articles, users, shares, syncLog
   // Version 1 con indici:
   //   lists: 'id, name, ownerId, createdAt, updatedAt, deletedAt'
   //   items: 'id, listId, [listId+checked], articleId, createdAt, updatedAt, deletedAt'
   //   articles: 'id, name, category, usageCount, createdAt, createdBy'
   //   users: 'id, email, name, createdAt'
   //   shares: 'id, listId, [listId+userId], userId, permission, createdAt'
   //   syncLog: 'id, entityType, entityId, action, timestamp, synced'
   // Export singleton: export const db = new ShoppingListDB();
   ```

2. **Creare `src/db/seed.ts`** - Dati articoli predefiniti:
   - Minimo 15 articoli di default suddivisi per categoria
   - Categorie: frutta-verdura, latticini, carne-pesce, pane-pasta, bevande, igiene, pulizia
   - Ogni articolo con: name, category, searchTerms[] (parole chiave per autocomplete)
   - Funzione `seedDefaultArticles(userId: string)` che popola solo se DB vuoto
   - Flag `isDefault: true` per articoli seed
   - Vedi `data-model.md` sezione "Seed Data" per la lista completa

3. **Creare `src/db/BaseRepository.ts`** — classe base astratta condivisa (decisione brainstorming):
   ```typescript
   // abstract class BaseRepository<T extends BaseEntity, TNew>
   //   constructor(protected table: Table<T, string>)
   //   protected newEntity(data: TNew, userId: string): T  ← genera id, createdAt, updatedAt, version=1
   //   protected touchEntity(entity: T): Partial<T>        ← updatedAt = Date.now(), version++
   //   async softDelete(id: string): Promise<void>          ← imposta deletedAt
   //   async getById(id: string): Promise<T | undefined>    ← filtra deletedAt
   ```
   **Motivazione**: centralizza metadati/versioning/soft-delete in un unico posto, evita ripetizione in 6 repository e fornisce un solo punto di modifica per logica cross-cutting.

4. **Creare `src/db/syncLog.ts`** — helper append-only (NON un repository CRUD):
   ```typescript
   // export async function appendSyncLog(
   //   entityType: SyncLog['entityType'],
   //   entityId: string,
   //   action: SyncLog['action'],
   //   payload: Record<string, unknown>,
   //   userId: string
   // ): Promise<void>
   ```
   **Motivazione**: `SyncLog` è un log append-only, non un'entità con CRUD. In Fase 1 il helper è definito e testato ma non ancora chiamato (niente services che lo usano). In Fase 2 i services lo chiameranno dopo ogni create/update/delete.

5. **Creare repository per ogni entita** (pattern Repository, estendono `BaseRepository`):

   **`src/db/ListsDB.ts`**:
   - `getAll(userId: string): Promise<List[]>` - liste owned + shared (no soft-deleted)
   - `getById(id: string): Promise<List | undefined>`
   - `create(list: NewList): Promise<List>` - genera UUID, timestamps, version=1
   - `update(id: string, changes: Partial<List>): Promise<void>` - aggiorna updatedAt e version++
   - `softDelete(id: string): Promise<void>` - imposta deletedAt
   - `getWithStats(userId: string): Promise<ListWithStats[]>` - con contatori items e shares

   **`src/db/ItemsDB.ts`**:
   - `getByListId(listId: string): Promise<Item[]>` - ordinati per order, no soft-deleted
   - `getById(id: string): Promise<Item | undefined>`
   - `getWithArticles(listId: string): Promise<ItemWithArticle[]>` - join con articles
   - `create(item: NewItem): Promise<Item>` - genera UUID, timestamps, order, version=1
   - `update(id: string, changes: Partial<Item>): Promise<void>`
   - `toggleChecked(id: string, userId: string): Promise<void>` - toggle checked + checkedAt/By
   - `softDelete(id: string): Promise<void>`
   - `getNextOrder(listId: string): Promise<number>` - per ordinamento manuale

   **`src/db/ArticlesDB.ts`**:
   - `getAll(): Promise<Article[]>`
   - `getById(id: string): Promise<Article | undefined>`
   - `search(query: string, limit?: number): Promise<ArticleAutocompleteResult[]>` - match su name + searchTerms, ordinato per matchScore + usageCount
   - `create(article: NewArticle): Promise<Article>` - genera UUID, searchTerms dal nome
   - `incrementUsage(id: string): Promise<void>` - usageCount++
   - `bulkAdd(articles: Article[]): Promise<void>` - per seed e sync

   **`src/db/UsersDB.ts`**:
   - `getById(id: string): Promise<User | undefined>`
   - `getByEmail(email: string): Promise<User | undefined>`
   - `create(user: NewUser): Promise<User>`
   - `update(id: string, changes: Partial<User>): Promise<void>`

   **`src/db/SharesDB.ts`**:
   - `getByListId(listId: string): Promise<Share[]>`
   - `getByUserId(userId: string): Promise<Share[]>` - liste condivise con l'utente
   - `getPermissions(userId: string, listId: string): Promise<ListPermissions>`
   - `create(share: NewShare): Promise<Share>`
   - `getByToken(token: string): Promise<Share | undefined>` - per accettazione inviti
   - `update(id: string, changes: Partial<Share>): Promise<void>`
   - `delete(id: string): Promise<void>` - hard delete (revoca accesso)

6. **Creare `src/db/index.ts`** - Re-export del singleton db, `BaseRepository`, tutti i repository, helper `appendSyncLog` e `seedDefaultArticles`

**Utility necessaria**: Creare `src/utils/uuid.ts` con funzione `generateUUID()` usando `crypto.randomUUID()`.

**Test coverage Fase 1 (co-located, `*.test.ts` accanto al file sorgente)**:

| File test | Verifica |
|-----------|----------|
| `BaseRepository.test.ts` | metadati autogenerate, `softDelete` imposta `deletedAt`, `getById` ritorna `undefined` dopo delete |
| `ListsDB.test.ts` | ciclo create → read → update → soft-delete; `getWithStats` calcola contatori |
| `ItemsDB.test.ts` | `toggleChecked` aggiorna `checked`/`checkedAt`/`checkedBy`; `getNextOrder` incrementa |
| `ArticlesDB.test.ts` | `search("lat")` trova "Latte Intero" con `matchScore` corretto; `bulkAdd` seed; `incrementUsage` |
| `SharesDB.test.ts` | `getPermissions` ritorna `canWrite` per owner, filtra per `share.permission` |
| `UsersDB.test.ts` | `getByEmail` case-sensitive, `create` setta `isGuest` correttamente |
| `syncLog.test.ts` | `appendSyncLog` crea entry con `synced=false`, `retryCount=0` |

Tutti i test usano `fake-indexeddb/auto` (caricato da `src/test-setup.ts`) per istanziare un IndexedDB in-memory isolato per test.

**Criteri di accettazione**:
- [ ] Schema Dexie compila e crea database correttamente
- [ ] Seed function popola articoli solo al primo avvio (idempotente)
- [ ] Tutti i repository estendono `BaseRepository` e implementano le operazioni CRUD
- [ ] Helper `appendSyncLog` definito, testato, ma NON ancora chiamato dai repository (sarà in Fase 2)
- [ ] Query con indici composti funzionano (`[listId+checked]`, `[listId+userId]`)
- [ ] Soft delete imposta `deletedAt` senza rimuovere record
- [ ] Search articoli funziona con match parziale e scoring
- [ ] Tutti i test della tabella sopra sono verdi

**Output atteso**: Tutti i file in `src/db/` funzionanti con test co-located verdi.

---

### Task 1.4 - Event System e Utilities

**Stato**: ✅ Completato — `src/utils/` contiene `events.ts` (EventBus type-safe con `AppEventMap`), `uuid.ts`, `storage.ts`, `validators.ts`, `debounce.ts`, `dates.ts`, `dom.ts`. Test co-located verdi per `events`, `uuid`, `storage`, `validators`, `debounce` (per `dates.ts` e `dom.ts` test skip intenzionale come da piano).

**Obiettivo**: Creare il sistema di eventi per comunicazione tra layer e le utility comuni.

**Documentazione da leggere**: `architecture.md` (sezione "Event-Driven Updates"), `conventions.md` (sezioni "Debouncing", "Utilities")

**Dipendenze**: Task 1.1 completato

**Azioni richieste**:

1. **Creare `src/utils/events.ts`** - Event Bus tipizzato (decisione brainstorming: deviazione dal piano originale):
   ```typescript
   // Mappa eventi → payload (interface per declaration merging futuro)
   // export interface AppEventMap {
   //   'list:created':        { list: List };
   //   'list:updated':        { listId: string; changes: Partial<List> };
   //   'list:deleted':        { listId: string };
   //   'item:added':          { item: Item };
   //   'item:updated':        { itemId: string; changes: Partial<Item> };
   //   'item:checked':        { itemId: string; checked: boolean; userId: string };
   //   'item:deleted':        { itemId: string };
   //   'article:created':     { article: Article };
   //   'sync:status-changed': { status: SyncStatus };
   //   'sync:completed':      { timestamp: number };
   //   'sync:error':          { error: string };
   //   'auth:state-changed':  { userId?: string };
   //   'share:created':       { share: Share };
   //   'share:accepted':      { shareId: string };
   // }
   //
   // class EventBus:
   //   on<K extends keyof AppEventMap>(event: K, callback: (data: AppEventMap[K]) => void): void
   //   emit<K extends keyof AppEventMap>(event: K, data: AppEventMap[K]): void
   //   off<K extends keyof AppEventMap>(event: K, callback: (data: AppEventMap[K]) => void): void
   //   once<K extends keyof AppEventMap>(event: K, callback: (data: AppEventMap[K]) => void): void
   //
   // Export singleton: export const eventBus = new EventBus();
   ```
   **Motivazione type-safety**: se un componente fa `eventBus.on('list:created', data => data.itemId)`, TypeScript lo rifiuta a compile time perché `itemId` non esiste nel payload `{ list: List }`. Il pattern const-di-stringhe del piano originale perdeva questa sicurezza.

2. **Creare `src/utils/dom.ts`** - DOM helpers (snellito rispetto al piano originale: niente show/hide/toggle, useremo classi Tailwind):
   - `createElement<K extends keyof HTMLElementTagNameMap>(tag, attributes?, children?): HTMLElementTagNameMap[K]`
   - `qs<T extends Element = Element>(selector, parent?): T | null`
   - `qsa<T extends Element = Element>(selector, parent?): T[]`
   - `escapeHTML(input: string): string` (per innerHTML sicuro)

3. **Creare `src/utils/validators.ts`**:
   - `isValidEmail(email: string): boolean`
   - `isValidListName(name: string): boolean` (1-100 chars)
   - `isValidPassword(password: string): boolean` (min 8 chars)
   - `sanitizeInput(input: string): string` — trim + escape HTML tramite `DOMParser`/`textContent` (NON regex — decisione brainstorming: regex HTML strip sono notoriamente insicure)

4. **Creare `src/utils/dates.ts`**:
   - `formatRelativeTime(timestamp: number): string` (es. "2 min fa", "ieri")
   - `formatDateTime(timestamp: number): string` (es. "27 mar 2026, 14:30")

5. **Creare `src/utils/storage.ts`** - LocalStorage wrapper:
   - `get<T>(key: string): T | undefined`
   - `set<T>(key: string, value: T): void`
   - `remove(key: string): void`
   - Usato per: currentUserId, preferences, lastSyncTimestamp

6. **Creare `src/utils/debounce.ts`**:
   - `debounce<T extends (...args: never[]) => void>(func: T, wait: number): T & { cancel(): void }` — restituisce funzione debounced con metodo `cancel()` per annullare chiamate pending (utile quando un componente si unmounta durante una ricerca)

7. **Aggiornare `src/utils/uuid.ts`** (se non gia creato nel Task 1.3):
   - `generateUUID(): string` - usando `crypto.randomUUID()`
   - `generateSecureToken(): string` - per invite tokens (32 chars hex, via `crypto.getRandomValues`)

**Test coverage Fase 1 (co-located)**:

| File test | Verifica |
|-----------|----------|
| `events.test.ts` | `on` → `emit` → callback riceve payload tipato; `off` rimuove; `once` si auto-rimuove; emit senza listener non throwa |
| `validators.test.ts` | email validi/invalidi (table-driven), password <8 respinte, `listName` rifiutato se vuoto o >100 chars |
| `debounce.test.ts` | N chiamate in <wait → 1 esecuzione; wait trascorso → esecuzione; `cancel()` blocca esecuzione pending |
| `storage.test.ts` | get/set round-trip con oggetti; parse error ritorna `undefined`; chiavi inesistenti ritornano `undefined` |
| `uuid.test.ts` | 2 chiamate generano UUID diversi; formato matcha regex UUID v4 |

**Skip testing per Fase 1**: `dates.ts` e `dom.ts` — sono thin wrapper di API browser (`Intl.*`, DOM) e i test costerebbero più della loro complessità. Saranno eventualmente coperti indirettamente dai test dei componenti UI in fasi successive.

**Criteri di accettazione**:
- [ ] `EventBus` funziona con `emit`/`on`/`off`/`once` ed è type-safe (compile error su payload sbagliato)
- [ ] Tutti gli helper sono tipizzati correttamente (no `any`)
- [ ] `debounce` ritarda correttamente l'esecuzione e supporta `cancel()`
- [ ] Validators validano correttamente email, password, nomi
- [ ] `LocalStorage` wrapper gestisce serializzazione/deserializzazione JSON (anche errori)
- [ ] `sanitizeInput` usa `DOMParser`/`textContent` (NON regex)
- [ ] Tutti i test della tabella sopra sono verdi

**Output atteso**: Tutti i file in `src/utils/` funzionanti con test co-located verdi.

---

## FASE 2: Core Offline - Business Logic

> **Stato: ✅ COMPLETATA (2026-04-14)**. Implementata via `superpowers:subagent-driven-development` seguendo il piano `docs/plans/Sprint2_CoreOffline_Plan.md` (38 task TDD). Ogni phase è passata per spec review + code quality review + fix iteration. Esito finale: 183 test verdi (95 nuovi), typecheck/lint/test/build tutti clean, bundle ~48 KB gzipped, entrambi gli invariant grep di §10 verificati (nessun `db` singleton value import in `src/services/*.ts`, nessun `events.emit` dentro callback di `db.transaction`). Le sezioni Task 2.1–2.5 qui sotto restano utili come **overview funzionale** per Fase 3 (UI consumer). Gap noti lasciati a fasi successive: (a) `AppEventMap` manca `share:updated`/`share:revoked` — da aggiungere quando Fase 3 costruirà la view di gestione permessi; (b) `main.ts` bootstrap ha error-handling minimale (solo `console.error`) — Fase 3 aggiungerà error state UI-visible; (c) `login` genera `NotFoundError` su email sconosciuta (email enumeration leak) — rimandato al backend di Fase 5.

> **Nota storica**: Questa fase è stata rivista nella sessione di brainstorming del 2026-04-14. Vedi `docs/brainstorming/2026-04-14-fase2-core-offline-summary.md` per il razionale completo delle 9 decisioni architetturali. Lo spec dettagliato vive in `docs/specs/Sprint2_CoreOffline_Spec.md` e il piano di implementazione task-by-task in `docs/plans/Sprint2_CoreOffline_Plan.md` (38 task TDD).
>
> **Decisioni architetturali chiave** (dal brainstorming):
> 1. **Scope**: tutti e 5 i service in questa fase (List, Item, Article, Auth, Share)
> 2. **DI**: constructor injection esplicito, nessun import di singleton `db` in `src/services/`
> 3. **Atomicità**: ogni mutazione è una transazione Dexie unica (write + `syncLog`), evento emesso POST-commit
> 4. **Permessi**: pura funzione `checkPermissions(list, shares, userId)` in `src/services/permissions.ts`
> 5. **Share**: local-only infrastructure (senza backend, il link funziona solo condividendo lo stesso IndexedDB)
> 6. **Errori**: classi tipate `ServiceError → NotFoundError/ForbiddenError/ValidationError/ConflictError`
> 7. **Guest→registrato**: riuso dello stesso record User (stesso id), nessuna riscrittura di `ownerId`
> 8. **Password hasher**: iniettato via interfaccia `PasswordHasher` (`BcryptHasher` in prod, `FakeHasher` in test)
> 9. **Test**: co-located come Fase 1, con factory `buildTestServicesWired(db)` centralizzata
>
> **Deviazioni da questa sezione scoperte durante la scrittura del piano** (documentate in `Sprint2_CoreOffline_Plan.md` sezione "Deviations from spec"):
> - `appendSyncLog` di Fase 1 usa la singleton `db` → i service usano un nuovo `createSyncLogger(db)` in `src/services/sync-logger.ts`
> - `EntityType` non include `'user'` → AuthService NON scrive su syncLog (extensione cosciente di §3.4); utenti sono device-local, la sync arriverà in Fase 5
> - `NewShare`/`NewUser` non supportano `inviteToken`/`passwordHash`/`deviceId` → ShareService e AuthService bypassano `shares.create()`/`users.create()` e scrivono il record completo via `db.shares.add(...)`/`db.users.add(...)` dentro la transazione
> - `ListsDB.getWithStats` di Fase 1 usa la singleton → `ListService.getAllLists` non lo delega, calcola owned+shared direttamente
> - Micro-fix obbligatorio a Fase 1: aggiungere `export` alla classe `EventBus` in `src/utils/events.ts` (una parola, nessun impatto runtime, serve a `buildTestServices` per costruire bus freschi per test)

### Task 2.1 - ListService

**Stato**: ✅ Completato — `src/services/ListService.ts` + `ListService.test.ts` (14 test). Tutte le 7 metodi implementati (`getAllLists` con query dirette su `deps.db.*` per bypassare il singleton in `ListsDB.getWithStats`, `searchLists`, `getListById`, `createList`, `updateList` con silent-strip a `{name?, color?}`, `deleteList` soft, `duplicateList` multi-table con 1 solo `list:created` e N+1 logSync).

**Obiettivo**: Implementare la business logic per la gestione delle liste della spesa.

**Documentazione da leggere**: `features-mvp.md` (sezione 1 "Gestione Liste"), `data-model.md` (query patterns), `conventions.md` (service pattern)

**Dipendenze**: Task 1.2, 1.3, 1.4 completati

**File da creare**: `src/services/ListService.ts`

**Interfaccia attesa** (i repository DB devono gia esistere da Task 1.3):

```typescript
class ListService {
  // Dipendenze: db (ShoppingListDB), eventBus

  getAllLists(userId: string): Promise<ListWithStats[]>
  // - Recupera liste owned + liste condivise con l'utente
  // - Per ogni lista calcola: totalItems, checkedItems, sharedWith count
  // - Filtra soft-deleted (deletedAt !== undefined)
  // - Ordina per updatedAt DESC

  searchLists(query: string, userId: string): Promise<ListWithStats[]>
  // - Filtra per nome (case-insensitive)

  getListById(listId: string): Promise<List | undefined>

  createList(name: string, userId: string, color?: string): Promise<List>
  // - Validazione: nome non vuoto, max 100 chars
  // - Genera UUID, timestamps, version=1, sortBy='manual'
  // - Salva su DB locale
  // - Crea entry SyncLog (action: 'create')
  // - Emette evento LIST_CREATED

  updateList(listId: string, changes: Partial<List>, userId: string): Promise<void>
  // - Verifica permessi (owner o writer)
  // - Aggiorna updatedAt, version++
  // - Crea entry SyncLog (action: 'update')
  // - Emette evento LIST_UPDATED

  deleteList(listId: string, userId: string): Promise<void>
  // - Verifica: solo owner puo eliminare
  // - Soft delete (deletedAt = Date.now())
  // - Crea entry SyncLog (action: 'delete')
  // - Emette evento LIST_DELETED

  duplicateList(listId: string, userId: string): Promise<List>
  // - Crea nuova lista con nome "Copia di {nome}"
  // - Copia tutti gli items (non checked) nella nuova lista
  // - NON copia le condivisioni
}
```

**Helper necessario** - Funzione `logChange` per SyncLog:
```typescript
// Creare in src/services/SyncLogHelper.ts o dentro SyncService
async function logChange(
  entityType: SyncLog['entityType'],
  entityId: string,
  action: SyncLog['action'],
  payload: Record<string, unknown>,
  userId: string
): Promise<void>
```

**Criteri di accettazione**:
- [ ] CRUD completo per liste
- [ ] Permessi verificati per update e delete
- [ ] Soft delete funzionante
- [ ] SyncLog entry creata per ogni operazione
- [ ] Eventi emessi correttamente
- [ ] Duplicazione lista funzionante

---

### Task 2.2 - ItemService

**Stato**: ✅ Completato — `src/services/ItemService.ts` + `ItemService.test.ts` (16 test). 7 metodi: `getItemsByListId`, `addItem` nei 3 rami (A=`articleId` → `incrementUsage` no-log §3.4, B=`customName + saveToDatabase` crea Article ed emette 2 eventi ordinati, C=`customName` solo), `updateItem`, `toggleChecked` round-trip `checkedAt`/`checkedBy`, `deleteItem` soft, `reorderItems` con UNA sola entry aggregata `logSync('list', ..., { itemOrder })` e un solo `list:updated`.

**Obiettivo**: Implementare la business logic per la gestione degli articoli nelle liste.

**Documentazione da leggere**: `features-mvp.md` (sezione 2 "Gestione Articoli"), `data-model.md` (Item interface, query patterns)

**Dipendenze**: Task 2.1 completato (ListService per verifica permessi)

**File da creare**: `src/services/ItemService.ts`

**Interfaccia attesa**:

```typescript
class ItemService {
  // Dipendenze: db, eventBus, ArticleService (per incrementUsage)

  getItemsByListId(listId: string): Promise<ItemWithArticle[]>
  // - Recupera items con join su articles
  // - Filtra soft-deleted
  // - Ordina per: checked ASC (non spuntati prima), poi order ASC

  addItem(data: NewItem & { saveToDatabase?: boolean }): Promise<Item>
  // - Se articleId presente: usa articolo da DB, incrementa usageCount
  // - Se customName + saveToDatabase=true: crea nuovo articolo nel DB, poi usa il suo ID
  // - Se customName + saveToDatabase=false: salva con customName (senza articleId)
  // - Genera UUID, order = nextOrder, checked=false, version=1
  // - Crea SyncLog entry
  // - Emette ITEM_ADDED

  updateItem(itemId: string, changes: Partial<Item>, userId: string): Promise<void>
  // - Aggiorna updatedAt, updatedBy, version++
  // - Crea SyncLog entry
  // - Emette ITEM_UPDATED

  toggleChecked(itemId: string, userId: string): Promise<void>
  // - Toggle checked state
  // - Se checked=true: imposta checkedAt e checkedBy
  // - Se checked=false: resetta checkedAt e checkedBy
  // - Crea SyncLog entry
  // - Emette ITEM_CHECKED

  deleteItem(itemId: string): Promise<void>
  // - Soft delete
  // - Crea SyncLog entry
  // - Emette ITEM_DELETED

  reorderItems(listId: string, orderedIds: string[]): Promise<void>
  // - Aggiorna campo order per ogni item nell'ordine specificato
  // - Crea SyncLog entries
}
```

**Criteri di accettazione**:
- [ ] Aggiunta item da articolo DB (con articleId)
- [ ] Aggiunta item custom con opzione salvataggio nel dizionario
- [ ] Toggle check/uncheck funzionante
- [ ] Ordinamento per stato (non spuntati prima) e poi per order
- [ ] Soft delete funzionante
- [ ] SyncLog entry per ogni operazione

---

### Task 2.3 - ArticleService

**Stato**: ✅ Completato — `src/services/ArticleService.ts` + `ArticleService.test.ts` (11 test). 6 metodi: `search` (guard `<2 chars → []`), `create` (validation + txn + logSync + emit), `incrementUsage` (NO logSync per §3.4 hot-path stat), `getByCategory`, `initializeDatabase` idempotente (delega a `seedDefaultArticles(articles, userId)` — signature refactorata da Fase 1 per eliminare il singleton), `syncFromRemote` (merge per articolo: union `searchTerms`, `max(usageCount)`, `max(version)`, mai delete — bypassa il repository via `db.articles.add/put` per preservare i campi server-assigned; documentato in JSDoc).

**Obiettivo**: Implementare la logica di gestione del dizionario articoli con autocomplete.

**Documentazione da leggere**: `features-mvp.md` (sezioni 2.1 "Autocomplete" e 3 "Database Articoli"), `data-model.md` (Article interface, autocomplete query)

**Dipendenze**: Task 1.3 completato (ArticlesDB con seed)

**File da creare**: `src/services/ArticleService.ts`

**Interfaccia attesa**:

```typescript
class ArticleService {
  // Dipendenze: db, eventBus

  search(query: string, limit?: number): Promise<ArticleAutocompleteResult[]>
  // - Minimo 2 caratteri per attivare ricerca
  // - Cerca in: name (case-insensitive) + searchTerms[]
  // - Calcola matchScore:
  //     match esatto nome = 100
  //     prefix match nome = 50
  //     match in searchTerms = 25
  //     contains in nome = 10
  // - Ordina per: matchScore DESC, poi usageCount DESC
  // - Limit default: 5 risultati
  // - Ritorna: { id, name, category, usageCount, matchScore }

  create(data: NewArticle): Promise<Article>
  // - Genera UUID, searchTerms dal nome (split + lowercase)
  // - usageCount=0, isDefault=false, version=1
  // - Crea SyncLog entry
  // - Emette ARTICLE_CREATED

  incrementUsage(articleId: string): Promise<void>
  // - usageCount++ (per ranking autocomplete)

  getByCategory(category: CategoryType): Promise<Article[]>

  initializeDatabase(userId: string): Promise<void>
  // - Chiama seedDefaultArticles se DB vuoto
  // - Da eseguire al primo avvio app

  syncFromRemote(remoteArticles: Article[]): Promise<void>
  // - Per ogni articolo remoto:
  //   - Se non esiste localmente: aggiungi
  //   - Se esiste: merge searchTerms (union), max(usageCount), max(version)
  // - NON rimuovere mai articoli locali
}
```

**Algoritmo autocomplete** (dettaglio):
```
Input: "lat" (query dell'utente)

1. Filtra articoli dove:
   - name.toLowerCase().includes("lat") → "Latte Intero", "Latticini Misti"
   - searchTerms.some(term => term.includes("lat"))

2. Per ogni match, calcola score:
   - "Latte Intero" → name starts with "lat" → score 50 + usageCount bonus
   - "Insalata" → name contains "lat" → score 10

3. Ordina per score DESC, usageCount DESC
4. Ritorna primi 5
```

**Criteri di accettazione**:
- [ ] Search funziona con >= 2 caratteri
- [ ] Scoring corretto (exact > prefix > contains)
- [ ] Risultati ordinati per rilevanza
- [ ] Creazione articolo genera searchTerms automaticamente
- [ ] Seed iniziale funzionante
- [ ] Sync merge non perde dati locali

---

### Task 2.4 - AuthService

**Stato**: ✅ Completato — `src/services/AuthService.ts` + `AuthService.test.ts` (24 test). 7 metodi: `getCurrentUser`, `createGuestUser` (`deviceId` riusato da storage, bypass via `db.users.add`), `register` (con guard `ConflictError('session')` se un registered è già corrente + branch di migrazione guest→registered che PRESERVA lo stesso id via `db.users.update`, verificato con test critico che conferma accesso alle liste del guest), `login` (`NotFoundError` su email sconosciuta con SECURITY NOTE inline sul leak — da riaffrontare in Fase 5), `logout` (crea nuovo guest; ordine reversed per crash-safety), `updateProfile`, `isAuthenticated`. **NOTA**: AuthService NON scrive `syncLog` (`EntityType` esclude `'user'`), ma emette `auth:state-changed` su ogni transizione. `bcryptjs` + `@types/bcryptjs` installati in questa fase.

**Obiettivo**: Implementare autenticazione locale (guest mode + email/password).

**Documentazione da leggere**: `features-mvp.md` (sezione 5 "Autenticazione"), `conventions.md` (sezione "Security Best Practices")

**Dipendenze**: Task 1.3 (UsersDB), Task 1.4 (storage, validators)

**File da creare**: `src/services/AuthService.ts`

**Nota importante**: Nel MVP non c'e un backend. L'autenticazione e interamente locale (IndexedDB). Il password hash serve come preparazione per il futuro backend. Usare `bcryptjs` per l'hashing.

**Dipendenza aggiuntiva da installare**: `pnpm add bcryptjs` e `pnpm add -D @types/bcryptjs`

**Interfaccia attesa**:

```typescript
class AuthService {
  // Dipendenze: db, storage (localStorage), eventBus

  getCurrentUser(): Promise<User | undefined>
  // - Legge currentUserId da localStorage
  // - Recupera User da DB
  // - Se non esiste, ritorna undefined

  createGuestUser(): Promise<GuestUser>
  // - Genera UUID, deviceId (da localStorage o nuovo)
  // - name = "Ospite"
  // - isGuest = true
  // - Salva su DB e localStorage (currentUserId)
  // - Emette AUTH_STATE_CHANGED

  register(name: string, email: string, password: string): Promise<User>
  // - Validazione: email valida, password >= 8 chars, nome non vuoto
  // - Check email univoca
  // - Hash password con bcryptjs (salt rounds = 10)
  // - Se utente corrente e guest: migra dati (mantieni liste e items)
  // - Salva su DB, aggiorna localStorage
  // - Emette AUTH_STATE_CHANGED

  login(email: string, password: string): Promise<User>
  // - Cerca utente per email
  // - Verifica password con bcrypt.compare
  // - Aggiorna lastLoginAt
  // - Salva currentUserId in localStorage
  // - Emette AUTH_STATE_CHANGED

  logout(): Promise<void>
  // - Rimuovi currentUserId da localStorage
  // - Crea nuovo guest user
  // - Emette AUTH_STATE_CHANGED

  updateProfile(userId: string, changes: { name?: string; preferences?: User['preferences'] }): Promise<void>

  isAuthenticated(): Promise<boolean>
  // - true se currentUser esiste e non e guest
}
```

**Migrazione guest → registrato**:
Quando un utente guest si registra, i suoi dati (liste, items, articoli creati) devono essere mantenuti. La migrazione consiste nell'aggiornare il record User esistente piuttosto che crearne uno nuovo.

**Criteri di accettazione**:
- [ ] Guest user creato automaticamente al primo avvio
- [ ] Registrazione con validazione email e password
- [ ] Login verifica password hash correttamente
- [ ] Migrazione guest → registrato preserva tutti i dati
- [ ] getCurrentUser ritorna utente corrente da localStorage/DB
- [ ] Logout crea nuovo guest

---

### Task 2.5 - ShareService

**Stato**: ✅ Completato — `src/services/ShareService.ts` + `ShareService.test.ts` (13 test). 7 metodi: `createShareLink` (owner-only via `checkPermissions`, `generateSecureToken`, bypass `shares.create()` via `db.shares.add()` per persistere `inviteToken` che `NewShare` non supporta — documentato in JSDoc), `acceptInvite` (`NotFoundError`/`ConflictError`, clearing di `inviteToken` via `UpdateSpec<Share>` cast), `getListShares` (manual join con users), `getSharedListsForUser`, `getUserPermissions` (thin wrapper su `checkPermissions`), `updatePermission` + `revokeAccess` (owner-only, hard delete per revoke, logSync payload con record completo per Fase 5 replay). **NOTA**: `updatePermission`/`revokeAccess` loggano ma NON emettono eventi — `AppEventMap` manca `share:updated`/`share:revoked`. Da aggiungere quando Fase 3 consumerà questi metodi dalla UI.

**Obiettivo**: Implementare la logica di condivisione liste.

**Documentazione da leggere**: `features-mvp.md` (sezione 4 "Condivisione Liste"), `data-model.md` (Share interface, ListPermissions)

**Dipendenze**: Task 2.1 (ListService), Task 2.4 (AuthService)

**File da creare**: `src/services/ShareService.ts`

**Nota importante**: La condivisione tramite link richiede connessione internet (funzionalita online-only). Nel MVP senza backend, il link di condivisione puo funzionare solo tra utenti sullo stesso dispositivo (per demo) o si prepara l'infrastruttura per il futuro backend. La generazione del link e l'UI sono comunque da implementare.

**Interfaccia attesa**:

```typescript
class ShareService {
  // Dipendenze: db, eventBus, authService

  createShareLink(listId: string, permission: Permission, userId: string): Promise<string>
  // - Verifica: solo owner puo condividere
  // - Genera token sicuro (32 chars hex)
  // - Crea record Share con inviteToken, userId vuoto
  // - Crea SyncLog entry
  // - Ritorna URL: `${origin}/accept-invite/${token}`

  acceptInvite(token: string, userId: string): Promise<void>
  // - Cerca share per inviteToken
  // - Verifica: token valido e non ancora accettato
  // - Aggiorna userId, acceptedAt, rimuovi inviteToken
  // - Crea SyncLog entry
  // - Emette SHARE_ACCEPTED

  getListShares(listId: string): Promise<ShareWithUser[]>
  // - Recupera tutte le condivisioni per una lista
  // - Join con User per avere nome/email

  getSharedListsForUser(userId: string): Promise<List[]>
  // - Recupera tutte le liste condivise con l'utente

  getUserPermissions(userId: string, listId: string): Promise<ListPermissions>
  // - Calcola permessi: isOwner, canRead, canWrite, canDelete, canShare

  updatePermission(shareId: string, permission: Permission, userId: string): Promise<void>
  // - Verifica: solo owner puo modificare permessi
  // - Aggiorna permission

  revokeAccess(shareId: string, userId: string): Promise<void>
  // - Verifica: solo owner puo revocare
  // - Hard delete dello share record
}
```

**Criteri di accettazione**:
- [ ] Generazione link condivisione con token
- [ ] Accettazione invito aggiorna share
- [ ] Permessi calcolati correttamente (owner ha tutto, writer puo modificare, reader solo lettura)
- [ ] Solo owner puo condividere, modificare permessi, revocare
- [ ] SyncLog per operazioni di condivisione

---

## FASE 3: UI/UX

### Task 3.1 - Component System Base

**Obiettivo**: Creare i componenti UI riutilizzabili (common components) e il sistema di rendering.

**Documentazione da leggere**: `conventions.md` (sezione "Component Pattern", "CSS/Tailwind Conventions", "Accessibility")

**Dipendenze**: Task 1.1, 1.4 (dom helpers)

**Azioni richieste**:

1. **Creare `src/components/common/Button.ts`**:
   - Props: `{ text, onClick, variant ('primary'|'secondary'|'danger'|'ghost'), size ('sm'|'md'|'lg'), disabled?, icon?, fullWidth? }`
   - Render come `<button>` con classi Tailwind appropriate
   - Supporto icona + testo
   - Accessibilita: `aria-label`, `disabled` attribute

2. **Creare `src/components/common/Input.ts`**:
   - Props: `{ type, placeholder, value, onChange, label?, error?, required? }`
   - Label associata con `for`/`id`
   - Stato errore con messaggio
   - Supporto keyboard (Enter, Escape)

3. **Creare `src/components/common/Modal.ts`**:
   - Props: `{ title, content, onClose, size? }`
   - Overlay cliccabile per chiudere
   - Tasto Escape per chiudere
   - Focus trap (focus resta dentro il modal)
   - Animazione apertura/chiusura (CSS transitions)
   - Metodi: `open()`, `close()`, `setContent()`

4. **Creare `src/components/common/Toast.ts`**:
   - Props: `{ message, type ('success'|'error'|'warning'|'info'), duration? }`
   - Auto-dismiss dopo duration (default 3s)
   - Posizionamento fixed in basso
   - Stack di toast multipli
   - Export funzione globale: `showToast(message, type)`

5. **Creare `src/components/common/DropdownMenu.ts`**:
   - Props: `{ items: Array<{ label, icon?, onClick, danger? }>, trigger: HTMLElement }`
   - Click outside per chiudere
   - Posizionamento automatico (sopra/sotto)
   - Accessibilita: role="menu", aria-expanded

6. **Creare `src/styles/main.css`** - Stili globali:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   /* CSS custom variables per theme */
   :root {
     --color-primary: #4F46E5;
     --color-primary-light: #EEF2FF;
     /* ... */
   }

   /* Base styles */
   /* Animazioni comuni */
   /* Scrollbar custom */
   ```

7. **Creare `src/styles/components.css`** - Stili componenti custom (BEM):
   - `.modal`, `.toast`, `.dropdown-menu`
   - Animazioni: `@keyframes fadeIn`, `@keyframes slideUp`

**Pattern componente** (da seguire per tutti):
```typescript
export interface ComponentProps { /* ... */ }

export class Component {
  private element: HTMLElement;

  constructor(private props: ComponentProps) {
    this.element = this.render();
    this.attachEventListeners();
  }

  render(): HTMLElement { /* ... */ }
  private attachEventListeners(): void { /* ... */ }
  getElement(): HTMLElement { return this.element; }
  update(newProps: Partial<ComponentProps>): void { /* ... */ }
  destroy(): void { this.element.remove(); }
}
```

**Criteri di accettazione**:
- [ ] Tutti i componenti renderizzano correttamente
- [ ] Modal con focus trap e Escape per chiudere
- [ ] Toast con auto-dismiss e stacking
- [ ] Button con varianti visive distinte
- [ ] Input con stato errore
- [ ] DropdownMenu con click-outside
- [ ] Accessibilita base (aria attributes, semantic HTML, keyboard nav)
- [ ] Stili Tailwind + custom CSS funzionanti

---

### Task 3.2 - HomeView (Lista delle Liste)

**Obiettivo**: Creare la vista principale che mostra tutte le liste dell'utente.

**Documentazione da leggere**: `features-mvp.md` (sezione 1.1 "Visualizzazione Liste", 1.2 "Creazione Lista")

**Dipendenze**: Task 2.1 (ListService), Task 3.1 (componenti comuni)

**Azioni richieste**:

1. **Creare `src/components/list/ListCard.ts`**:
   - Mostra: nome lista, colore, contatori (totale/completati), stato sync, icona condivisione
   - Click → naviga a ListView
   - Menu button (⋯) → apre DropdownMenu con: Rinomina, Cambia colore, Gestisci accessi, Duplica, Elimina
   - Badge "condivisa" se ha shares

2. **Creare `src/views/HomeView.ts`**:
   - Header: logo/titolo "ShoppingList", menu utente (profilo/login/logout)
   - Barra ricerca liste
   - Griglia/lista di ListCard
   - FAB (Floating Action Button) "+" per nuova lista
   - Stato vuoto: messaggio "Nessuna lista. Crea la tua prima lista!"
   - Pull-to-refresh (o button refresh)
   - Ascolta eventi LIST_CREATED, LIST_UPDATED, LIST_DELETED per aggiornare UI

3. **Creare modal "Nuova Lista"** (dentro HomeView o come componente separato):
   - Input nome lista (obbligatorio)
   - Selezione colore (palette predefinita: blu, verde, giallo, rosso, viola)
   - Bottoni: Annulla, Crea
   - Validazione inline

**Layout UI (riferimento)**:
```
┌─────────────────────────────────────┐
│  ShoppingList              👤 Menu  │
├─────────────────────────────────────┤
│  🔍 Cerca liste...                  │
├─────────────────────────────────────┤
│                                     │
│  [ListCard 1]                       │
│  [ListCard 2]                       │
│  [ListCard 3]                       │
│                                     │
│                          [+ FAB]    │
└─────────────────────────────────────┘
```

**Criteri di accettazione**:
- [ ] Visualizza tutte le liste con statistiche
- [ ] Ricerca per nome funzionante
- [ ] Creazione nuova lista tramite modal
- [ ] Menu contestuale per ogni lista (rinomina, duplica, elimina)
- [ ] UI reattiva agli eventi (aggiornamento automatico)
- [ ] Stato vuoto gestito
- [ ] Responsive (mobile-first)

---

### Task 3.3 - ListView (Dettaglio Lista)

**Obiettivo**: Creare la vista dettaglio di una singola lista con gli articoli.

**Documentazione da leggere**: `features-mvp.md` (sezioni 1.3 "Dettaglio Lista", 2.1-2.4 "Gestione Articoli")

**Dipendenze**: Task 2.2 (ItemService), Task 2.3 (ArticleService), Task 3.1 (componenti comuni)

**Azioni richieste**:

1. **Creare `src/components/item/ItemRow.ts`**:
   - Checkbox per toggle checked
   - Nome articolo (da article o customName)
   - Quantita + unita (es. "2 L")
   - Categoria badge
   - Note (se presenti, icona con tooltip)
   - Stile diverso per checked (barrato, opacita ridotta)
   - Click → apre modal modifica
   - Supporto swipe (opzionale per MVP, puo essere tap su checkbox)

2. **Creare `src/components/item/Autocomplete.ts`** (componente critico):
   - Input di testo con debounce (300ms)
   - Dropdown suggerimenti da ArticleService.search()
   - Ogni suggerimento mostra: icona categoria, nome, usage count
   - Click su suggerimento → aggiunge item con dati pre-compilati
   - Enter su testo non in lista → apre modal "Nuovo Articolo"
   - Keyboard navigation: frecce su/giu per navigare suggerimenti, Enter per selezionare
   - Nasconde dropdown quando blur (con delay per permettere click)

3. **Creare `src/components/item/ItemForm.ts`** - Modal aggiunta/modifica articolo:
   - Campi: nome (readonly se da DB), quantita, unita (select), categoria (select), note
   - Checkbox "Salva nel dizionario" (solo per nuovi articoli custom)
   - Modalita: "Nuovo Articolo" o "Modifica Articolo"
   - Bottoni: Annulla, Aggiungi/Salva (+ Elimina in modalita modifica)
   - Validazione: nome obbligatorio, quantita > 0

4. **Creare `src/views/ListView.ts`**:
   - Header: back button, nome lista, menu (⋯)
   - Autocomplete input per aggiungere articoli
   - Sezione "Da comprare" con contatore
   - Sezione "Completati" collassabile con contatore
   - Ordinamento: manuale (drag&drop opzionale), alfabetico, per categoria, per stato
   - Ascolta eventi ITEM_ADDED, ITEM_UPDATED, ITEM_CHECKED, ITEM_DELETED
   - Indicatore permessi (se sola lettura, disabilita editing)

**Layout UI (riferimento)**:
```
┌─────────────────────────────────────┐
│ ← Nome Lista                ⋯ Menu │
├─────────────────────────────────────┤
│  🔍 Aggiungi articolo...            │
│  ┌─ Suggerimenti ────────────────┐  │
│  │ 🥛 Latte Intero (usato 12x)  │  │
│  │ 🧀 Latticini Misti (3x)      │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  Da comprare (7)                    │
│  [ItemRow] □ Latte Intero    2 L    │
│  [ItemRow] □ Pane            1 pz   │
│  [ItemRow] □ ...                    │
├─────────────────────────────────────┤
│  Completati (5)         [▼ Mostra]  │
│  [ItemRow] ☑ Mele          1 kg    │
│  [ItemRow] ☑ ...                    │
└─────────────────────────────────────┘
```

**Criteri di accettazione**:
- [ ] Autocomplete funzionante con debounce e scoring
- [ ] Aggiunta articolo da suggerimento (1 tap)
- [ ] Aggiunta articolo custom con modal
- [ ] Toggle check/uncheck su ogni item
- [ ] Sezione completati collassabile
- [ ] Modal modifica articolo funzionante
- [ ] Eliminazione articolo con conferma
- [ ] UI si aggiorna in tempo reale (eventi)
- [ ] Sola lettura per utenti viewer
- [ ] Keyboard navigation sull'autocomplete

---

### Task 3.4 - AuthView (Login/Registrazione)

**Obiettivo**: Creare le viste di autenticazione.

**Documentazione da leggere**: `features-mvp.md` (sezione 5 "Autenticazione")

**Dipendenze**: Task 2.4 (AuthService), Task 3.1 (componenti comuni)

**File da creare**: `src/views/AuthView.ts`

**Azioni richieste**:

1. **Form Login**:
   - Campi: email, password
   - Bottone "Accedi"
   - Link "Non hai un account? Registrati"
   - Link "Continua come ospite"
   - Validazione inline
   - Gestione errori (email non trovata, password errata)

2. **Form Registrazione**:
   - Campi: nome, email, password, conferma password
   - Bottone "Registrati"
   - Link "Hai gia un account? Accedi"
   - Validazione: email valida, password >= 8, password match
   - Se utente corrente e guest: mostrare messaggio "I tuoi dati verranno mantenuti"

3. **Profilo Utente** (accessibile da menu in HomeView):
   - Mostra nome, email
   - Modifica nome
   - Preferenze: tema (light/dark/auto), ordinamento default
   - Bottone "Esci" (logout)
   - Se guest: mostra "Registrati per sincronizzare i tuoi dati"

**Criteri di accettazione**:
- [ ] Login funzionante con feedback errori
- [ ] Registrazione con validazione completa
- [ ] Toggle tra login e registrazione
- [ ] Profilo con modifica nome e preferenze
- [ ] Guest mode funziona senza autenticazione
- [ ] Migrazione guest → registrato seamless

---

### Task 3.5 - Router e App Shell

**Obiettivo**: Implementare il routing client-side e l'inizializzazione dell'app.

**Documentazione da leggere**: `architecture.md` (sezioni "Entry point", "Router")

**Dipendenze**: Task 3.2, 3.3, 3.4 completati (views disponibili)

**Azioni richieste**:

1. **Creare `src/router.ts`** - Client-side router semplice:
   ```typescript
   // Routes:
   // '/' o '/lists'           → HomeView
   // '/lists/:id'             → ListView
   // '/auth'                  → AuthView (login)
   // '/auth/register'         → AuthView (registrazione)
   // '/accept-invite/:token'  → Logica accettazione invito
   // '/settings'              → SettingsView
   //
   // Metodi:
   // navigate(path: string): void
   // getCurrentRoute(): RouteInfo
   // onRouteChange(callback): void
   //
   // Usare History API (pushState/popState)
   // Gestire back button del browser
   ```

2. **Creare `src/app.ts`** - Inizializzazione app:
   ```typescript
   // class App:
   //   1. Inizializza database (Dexie)
   //   2. Seed articoli default
   //   3. Verifica/crea utente (guest se non esiste)
   //   4. Inizializza services (dependency injection manuale)
   //   5. Inizializza router
   //   6. Configura event listeners globali (online/offline)
   //   7. Renderizza vista iniziale
   //   8. Registra Service Worker (se produzione)
   ```

3. **Aggiornare `src/main.ts`** - Entry point:
   ```typescript
   import { App } from './app';
   import './styles/main.css';

   const app = new App();
   app.init();
   ```

4. **Aggiornare `index.html`**:
   - Meta tags (viewport, theme-color, description)
   - Link a manifest.json
   - Div `<div id="app"></div>`
   - Noscript fallback
   - Loading spinner iniziale

5. **Creare `src/views/SettingsView.ts`** (opzionale, puo essere parte del profilo):
   - Preferenze tema
   - Info app (versione)
   - Link "Esci"

**Criteri di accettazione**:
- [ ] Navigazione tra viste funzionante
- [ ] History API: back/forward del browser funzionano
- [ ] Deep linking: aprire URL diretto funziona
- [ ] App si inizializza correttamente (DB, utente, services)
- [ ] Route `/accept-invite/:token` gestita
- [ ] Loading state durante inizializzazione

---

### Task 3.6 - Stili e Responsive Design

**Obiettivo**: Rifinire l'aspetto visivo e garantire responsive design mobile-first.

**Documentazione da leggere**: `conventions.md` (sezione "CSS/Tailwind Conventions")

**Dipendenze**: Task 3.1-3.5 completati (UI base funzionante)

**Azioni richieste**:

1. **Design System**:
   - Palette colori: primary (indigo), success (green), warning (amber), error (red)
   - Tipografia: scale consistente (text-sm, text-base, text-lg, text-xl)
   - Spacing: basato su scale Tailwind (4, 8, 12, 16, 24, 32)
   - Border radius: `rounded-lg` per card, `rounded-full` per avatar/badge
   - Shadows: `shadow-sm` per card, `shadow-lg` per modal/dropdown

2. **Responsive breakpoints**:
   - Mobile (default): < 640px - layout single column
   - Tablet (sm): 640px+ - griglia 2 colonne per ListCard
   - Desktop (lg): 1024px+ - layout centrato max-width, sidebar opzionale

3. **Animazioni e transizioni**:
   - Apertura/chiusura modal (fade + scale)
   - Toast slide-in/slide-out
   - Check/uncheck item (strikethrough animation)
   - Autocomplete dropdown (slide-down)
   - Sync indicator (pulse per syncing)

4. **Dark mode** (opzionale ma consigliato):
   - Usare `prefers-color-scheme` media query
   - Classi `dark:` di Tailwind
   - Toggle manuale nelle preferenze

5. **Touch-friendly**:
   - Target minimo 44x44px per elementi interattivi
   - Padding adeguato per tap
   - No hover-only interactions su mobile

**Criteri di accettazione**:
- [ ] App utilizzabile su mobile (320px+)
- [ ] Layout responsive su tablet e desktop
- [ ] Animazioni fluide (no jank)
- [ ] Touch target adeguati
- [ ] Palette colori consistente
- [ ] Dark mode funzionante (se implementato)

---

## FASE 4: Auth & Sharing (UI Integration)

### Task 4.1 - Integrazione Condivisione nelle Viste

**Obiettivo**: Integrare la logica di condivisione (ShareService) nell'UI.

**Documentazione da leggere**: `features-mvp.md` (sezione 4 "Condivisione Liste" con UI mockup)

**Dipendenze**: Task 2.5 (ShareService), Task 3.2-3.3 (HomeView, ListView)

**Azioni richieste**:

1. **Creare componente "Gestisci Accessi"** (`src/components/list/ShareModal.ts`):
   - Mostra owner
   - Lista utenti con permesso e menu (cambia permesso, revoca)
   - Form invito: campo per generare link con scelta permesso (read/write)
   - Bottone copia link negli appunti
   - Solo visibile per owner della lista

2. **Creare vista "Accetta Invito"** (gestita dal router):
   - Mostra dettagli invito (nome lista, chi ha invitato, permesso)
   - Bottoni: Accetta, Rifiuta
   - Se utente non autenticato: redirect a login/registrazione prima

3. **Aggiornare HomeView**:
   - ListCard mostra badge "condivisa" e numero collaboratori
   - Distinguere visivamente liste proprie vs condivise
   - Menu lista include "Gestisci accessi" (solo per owner)

4. **Aggiornare ListView**:
   - Mostrare chi sta collaborando (icone utenti in header)
   - Disabilitare editing se utente ha solo permesso "read"
   - Mostrare chi ha modificato per ultimo ogni item (opzionale)

**Criteri di accettazione**:
- [ ] Modal condivisione funzionante (genera link, copia)
- [ ] Accettazione invito da URL
- [ ] Permessi rispettati nell'UI (viewer non puo editare)
- [ ] Badge condivisione visibile su ListCard
- [ ] Revoca accesso funzionante

---

### Task 4.2 - Gestione Offline/Online States

**Obiettivo**: Implementare la gestione degli stati online/offline nell'interfaccia.

**Documentazione da leggere**: `sync-strategy.md` (sezione 6 "Sync Status UI")

**Dipendenze**: Task 1.4 (events), Task 3.5 (app shell)

**Azioni richieste**:

1. **Creare `src/components/sync/SyncIndicator.ts`**:
   - Indicatore visivo nello header dell'app
   - Stati: Online (verde), Offline (ambra), Syncing (blu, animato), Error (rosso)
   - Mostra: ultimo sync, modifiche in attesa, errore
   - Bottone "Riprova" in caso di errore
   - Ascolta SYNC_STATUS_CHANGED

2. **Creare `src/services/ConnectionService.ts`**:
   - Monitora `navigator.onLine`
   - Ascolta eventi `online`/`offline`
   - Emette SYNC_STATUS_CHANGED
   - Fornisce metodo `isOnline(): boolean`

3. **Aggiornare App shell**:
   - Banner offline in cima alla pagina quando offline
   - Disabilitare funzionalita online-only (condivisione) quando offline
   - Indicare funzionalita limitate

4. **Feedback utente per operazioni offline**:
   - Toast "Salvato localmente. Sara sincronizzato quando torni online"
   - Indicatore su ogni lista: "sincronizzata" vs "modifiche in attesa"

**Criteri di accettazione**:
- [ ] Indicatore online/offline visibile e aggiornato
- [ ] Funzionalita online-only disabilitate offline
- [ ] Feedback chiaro su stato sincronizzazione
- [ ] App funziona completamente offline (CRUD locale)
- [ ] Transizione online→offline→online fluida

---

## FASE 5: Sync Engine & PWA

### Task 5.1 - SyncService Core

**Obiettivo**: Implementare il motore di sincronizzazione basato su SyncLog.

**Documentazione da leggere**: `sync-strategy.md` (tutte le sezioni)

**Dipendenze**: Task 2.1-2.5 (tutti i services), Task 4.2 (ConnectionService)

**File da creare**: `src/services/SyncService.ts`

**Nota critica**: Nel MVP senza backend, il SyncService viene predisposto con interfacce chiare ma senza endpoint reale. Le operazioni push/pull sono implementate ma puntano a un'interfaccia astratta che sara collegata al backend futuro. In locale, il SyncLog traccia comunque tutte le modifiche.

**Interfaccia attesa**:

```typescript
class SyncService {
  private isSyncing: boolean;
  private syncTimeout: ReturnType<typeof setTimeout> | null;

  triggerSync(): void
  // - Debounce 2 secondi
  // - Se gia in sync, accoda
  // - Se offline, ignora

  private performSync(): Promise<void>
  // - Se offline o gia in sync, return
  // - Emette SYNC_STATUS_CHANGED (syncing: true)
  // - 1. pushChanges()
  // - 2. pullChanges()
  // - Emette SYNC_STATUS_CHANGED (syncing: false, lastSyncAt)
  // - Catch: SYNC_STATUS_CHANGED con errore

  private pushChanges(): Promise<void>
  // - Legge SyncLog con synced=false, retryCount < MAX_RETRIES (3)
  // - Raggruppa per entityType
  // - Per ogni gruppo: chiama remote API (o mock)
  // - Se successo: marca synced=true, syncedAt=now
  // - Se errore: retryCount++, syncError=message

  private pullChanges(): Promise<void>
  // - Legge lastSyncTimestamp da storage
  // - Chiama remote API per changes since lastSync (o mock)
  // - Per ogni change: applyRemoteChange()
  // - Aggiorna lastSyncTimestamp

  private applyRemoteChange(change: RemoteChange): Promise<void>
  // - Se entita non esiste localmente e action != delete: aggiungi
  // - Se action = delete: soft delete locale
  // - Se conflitto (version diversa): resolveConflict()

  getSyncStatus(): Promise<SyncStatus>
  // - online, syncing, pendingChanges count, lastSyncAt, lastError

  getPendingChangesCount(): Promise<number>
  // - Conta SyncLog con synced=false

  // Setup listeners
  setupAutoSync(): void
  // - Dopo ogni modifica (eventi)
  // - Quando torna online
  // - Ogni 30s se online
  // - Su visibility change (app torna in foreground)
  // - Tutti con debounce 2s
}
```

**Interfaccia per Remote API** (astratta, per futuro backend):
```typescript
interface SyncRemoteAPI {
  pushChanges(changes: SyncLog[]): Promise<void>;
  pullChanges(since: number): Promise<RemoteChange[]>;
}

// MVP: implementazione mock che logga in console
class MockSyncRemoteAPI implements SyncRemoteAPI {
  async pushChanges(changes: SyncLog[]): Promise<void> {
    console.log('[Sync] Push:', changes.length, 'changes');
  }
  async pullChanges(since: number): Promise<RemoteChange[]> {
    console.log('[Sync] Pull since:', new Date(since));
    return [];
  }
}
```

**Criteri di accettazione**:
- [ ] SyncLog registra tutte le modifiche locali
- [ ] Debounce 2s funzionante
- [ ] Non sincronizza se offline
- [ ] Conta pendingChanges correttamente
- [ ] Auto-sync su eventi, online, timer, visibility
- [ ] Interfaccia astratta per remote API
- [ ] Retry con max 3 tentativi
- [ ] SyncStatus emesso correttamente

---

### Task 5.2 - Conflict Resolution

**Obiettivo**: Implementare la strategia last-write-wins per la risoluzione dei conflitti.

**Documentazione da leggere**: `sync-strategy.md` (sezioni 3 "Last-Write-Wins", 7 "Gestione Conflitti")

**Dipendenze**: Task 5.1 (SyncService core)

**File da creare/aggiornare**: `src/services/ConflictResolver.ts` (o integrato in SyncService)

**Azioni richieste**:

1. **Implementare `resolveConflict`**:
   ```typescript
   // Input: local entity, remote entity
   // Output: { winner: 'local' | 'remote', strategy: 'last-write-wins' }
   //
   // Logica:
   // 1. Confronta version: piu alta vince
   // 2. Se version uguale: confronta updatedAt timestamp
   // 3. Se tutto uguale: remote vince (server ha priorita)
   ```

2. **Gestire scenari specifici**:

   **Scenario A - Modifica concorrente item**:
   - User A modifica quantita offline
   - User B modifica quantita online
   - User A torna online → confronta timestamps → ultimo vince

   **Scenario B - Soft delete vs modifica**:
   - User A elimina item
   - User B modifica stesso item
   - Se delete e piu recente: mantieni eliminato
   - Se modifica e piu recente: ripristina con dati remote

   **Scenario C - Lista condivisa**:
   - Modifiche concorrenti su items diversi: nessun conflitto (merge diretto)
   - Modifiche concorrenti su stesso item: last-write-wins

3. **Creare `src/components/sync/ConflictResolver.ts`** (UI component - opzionale per MVP):
   - Mostrare conflitti rilevati
   - Per MVP: risoluzione automatica (last-write-wins)
   - Toast notifica: "Conflitto risolto automaticamente"

4. **Conflict logging**:
   - Loggare ogni conflitto risolto (per debug)
   - Opzionale: tabella conflictLogs in DB

**Criteri di accettazione**:
- [ ] Last-write-wins funziona correttamente
- [ ] Scenario soft-delete vs modifica gestito
- [ ] Conflitti loggati per debug
- [ ] Toast notifica per conflitti risolti

---

### Task 5.3 - Service Worker e PWA

**Obiettivo**: Configurare il Service Worker con Workbox e rendere l'app installabile come PWA.

**Documentazione da leggere**: `architecture.md` (sezione "Vite Config" per VitePWA)

**Dipendenze**: Task 3.5 (app shell funzionante)

**Azioni richieste**:

1. **Configurare VitePWA plugin** (aggiornare `vite.config.ts`):
   - `registerType: 'autoUpdate'` - aggiornamento automatico
   - Precache di tutti gli asset statici (HTML, CSS, JS, icons)
   - Runtime caching per Google Fonts (CacheFirst)
   - Offline fallback page

2. **Creare `public/manifest.json`** (o configurare in VitePWA):
   ```json
   {
     "name": "ShoppingList",
     "short_name": "ShoppingList",
     "description": "Gestione liste della spesa condivise",
     "start_url": "/",
     "display": "standalone",
     "theme_color": "#4F46E5",
     "background_color": "#ffffff",
     "icons": [
       { "src": "icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" },
       { "src": "icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
     ]
   }
   ```

3. **Creare icone PWA**:
   - `public/icons/icon-192x192.png`
   - `public/icons/icon-512x512.png`
   - (Generare con tool online o placeholder)

4. **Creare `public/offline.html`** - Pagina fallback offline:
   - Messaggio: "Sei offline. L'app funziona comunque, ma alcune funzionalita potrebbero essere limitate."
   - Link per tornare alla home

5. **Registrare Service Worker** in `src/app.ts`:
   ```typescript
   import { registerSW } from 'virtual:pwa-register';

   const updateSW = registerSW({
     onNeedRefresh() {
       // Mostra toast "Nuova versione disponibile. Aggiorna?"
     },
     onOfflineReady() {
       // Toast "App pronta per l'uso offline"
     }
   });
   ```

6. **Testare**:
   - Installazione su mobile (Add to Home Screen)
   - Funzionamento offline (kill network)
   - Aggiornamento app
   - Cache invalidation

**Criteri di accettazione**:
- [ ] App installabile come PWA (manifest valido)
- [ ] Service Worker registrato e attivo
- [ ] Asset precachati (funziona offline)
- [ ] Prompt aggiornamento per nuove versioni
- [ ] Lighthouse PWA score > 90
- [ ] Icone PWA presenti

---

## FASE 6: Polish, Testing e Rifinitura

### Task 6.1 - Testing

**Obiettivo**: Scrivere test per la business logic critica.

**Documentazione da leggere**: `conventions.md` (sezione "Testing Conventions")

**Dipendenze**: Tutti i task precedenti completati

**Azioni richieste**:

1. **Setup Vitest**:
   ```bash
   pnpm add -D vitest @vitest/ui happy-dom
   ```
   - Configurare in `vite.config.ts` o `vitest.config.ts`
   - Usare `happy-dom` come environment per test con DOM

2. **Test prioritari** (in ordine di importanza):

   **`src/services/ListService.test.ts`**:
   - Creazione lista con validazione
   - Soft delete (solo owner)
   - Duplicazione lista
   - Get lists con stats

   **`src/services/ItemService.test.ts`**:
   - Aggiunta item da articolo DB
   - Aggiunta item custom (con e senza salvataggio dizionario)
   - Toggle check/uncheck
   - Soft delete

   **`src/services/ArticleService.test.ts`**:
   - Search con scoring (exact > prefix > contains)
   - Creazione articolo genera searchTerms
   - Seed iniziale
   - Increment usage

   **`src/services/AuthService.test.ts`**:
   - Guest user creation
   - Registrazione con validazione
   - Login con verifica password
   - Migrazione guest → registrato

   **`src/services/ShareService.test.ts`**:
   - Generazione link condivisione
   - Accettazione invito
   - Calcolo permessi (owner, writer, reader)
   - Revoca accesso

   **`src/services/SyncService.test.ts`**:
   - SyncLog registra modifiche
   - Debounce trigger sync
   - Conflict resolution last-write-wins
   - Non sync quando offline

3. **Test utilities**:
   - Mock del database Dexie (in-memory)
   - Factory per creare entita di test
   - Helper per simulare online/offline

**Criteri di accettazione**:
- [ ] Vitest configurato e funzionante
- [ ] Test per ogni service con casi base e edge case
- [ ] Tutti i test passano
- [ ] Coverage > 70% per services/

---

### Task 6.2 - Performance e Ottimizzazione

**Obiettivo**: Verificare e ottimizzare le performance dell'applicazione.

**Documentazione da leggere**: `architecture.md` (sezione "Performance Budgets")

**Dipendenze**: Tutti i task precedenti completati

**Azioni richieste**:

1. **Analisi bundle**:
   - `pnpm add -D rollup-plugin-visualizer`
   - Verificare che bundle < 200KB gzipped
   - Code splitting per Dexie (chunk separato)
   - Tree shaking verificato

2. **Lighthouse audit**:
   - Performance > 90
   - Accessibility > 90
   - Best Practices > 90
   - PWA > 90
   - SEO > 80

3. **Ottimizzazioni specifiche**:
   - Debounce su autocomplete search (300ms)
   - Debounce su sync (2000ms)
   - Lazy loading per viste non iniziali
   - Memoization per query frequenti
   - Batch updates per liste lunghe

4. **Target performance**:
   | Metrica | Target | Critico |
   |---------|--------|---------|
   | FCP | < 1.5s | < 2.5s |
   | TTI | < 3.5s | < 5s |
   | Bundle | < 150KB | < 200KB |
   | Lighthouse | > 90 | > 80 |

**Criteri di accettazione**:
- [ ] Bundle size entro limiti
- [ ] Lighthouse scores entro target
- [ ] No jank visibile durante scroll/interazioni
- [ ] Autocomplete responsive (< 100ms percepito)

---

### Task 6.3 - Bug Fix, Rifinitura e Deploy

**Obiettivo**: Risolvere bug rimanenti, rifinire UX e preparare per il deploy.

**Dipendenze**: Tutti i task precedenti completati

**Azioni richieste**:

1. **QA manuale**:
   - Testare tutti i flussi utente su mobile (Chrome, Safari)
   - Testare offline: creare lista, aggiungere items, chiudere network, riaprire
   - Testare condivisione: generare link, accettare da altro browser
   - Testare edge cases: liste vuote, nomi lunghi, molti items

2. **Bug fix**:
   - Risolvere bug trovati durante QA
   - Verificare console per errori/warning

3. **UX polish**:
   - Loading states per tutte le operazioni async
   - Empty states per liste vuote, nessun risultato ricerca
   - Error states con messaggi utili
   - Conferma prima di eliminare (dialog)
   - Undo per azioni distruttive (opzionale)

4. **Preparazione deploy**:
   - Build di produzione: `pnpm build`
   - Verificare `dist/` contiene tutti gli asset
   - Configurare hosting (Vercel/Netlify):
     - Redirect per SPA (tutte le route → index.html)
     - Headers cache per asset statici
     - HTTPS obbligatorio
   - `.env.production` se necessario

5. **README.md**:
   - Descrizione progetto
   - Setup development
   - Comandi disponibili
   - Architettura sintetica
   - Deploy instructions

**Criteri di accettazione**:
- [ ] Nessun errore in console in produzione
- [ ] Tutti i flussi utente funzionanti
- [ ] App installabile come PWA
- [ ] Funzionamento offline verificato
- [ ] Build di produzione generata con successo
- [ ] Deploy su hosting statico funzionante (opzionale)

---

## Riepilogo Dipendenze tra Task

```
FASE 1: Fondamenta
  1.1 Setup Progetto
    ↓
  1.2 Modelli Dati ──────────────┐
    ↓                            │
  1.3 Database Layer ◄───────────┘
    ↓
  1.4 Event System & Utilities

FASE 2: Core Offline
  2.1 ListService ◄──── 1.2, 1.3, 1.4
    ↓
  2.2 ItemService ◄──── 2.1, 2.3
    ↓
  2.3 ArticleService ◄── 1.3
    ↓
  2.4 AuthService ◄──── 1.3, 1.4
    ↓
  2.5 ShareService ◄─── 2.1, 2.4

FASE 3: UI/UX
  3.1 Component System ◄── 1.1, 1.4
    ↓
  3.2 HomeView ◄──── 2.1, 3.1
    ↓
  3.3 ListView ◄──── 2.2, 2.3, 3.1
    ↓
  3.4 AuthView ◄──── 2.4, 3.1
    ↓
  3.5 Router & App Shell ◄── 3.2, 3.3, 3.4
    ↓
  3.6 Stili & Responsive ◄── 3.1-3.5

FASE 4: Auth & Sharing UI
  4.1 Integrazione Condivisione ◄── 2.5, 3.2, 3.3
    ↓
  4.2 Gestione Offline/Online ◄── 1.4, 3.5

FASE 5: Sync & PWA
  5.1 SyncService Core ◄── 2.1-2.5, 4.2
    ↓
  5.2 Conflict Resolution ◄── 5.1
    ↓
  5.3 Service Worker & PWA ◄── 3.5

FASE 6: Polish & Test
  6.1 Testing ◄── tutti
    ↓
  6.2 Performance ◄── tutti
    ↓
  6.3 Bug Fix & Deploy ◄── tutti
```

---

## Note e Decisioni Aperte

### Domande di Chiarimento

1. **Backend per sincronizzazione**:
   La documentazione predispone un sync engine con SyncLog e interfacce push/pull, ma non esiste un backend nel MVP. Come procedere?
   - **Opzione A**: Implementare solo il tracking locale (SyncLog) e l'interfaccia astratta, senza backend reale. La sincronizzazione tra utenti sara attivata post-MVP.
   - **Opzione B**: Includere un backend minimale (es. Supabase, Firebase) per abilitare la sincronizzazione reale gia nel MVP.
   - **Raccomandazione**: Opzione A - il SyncLog traccia tutto, l'interfaccia e pronta, ma il sync reale viene post-MVP.

2. **Condivisione senza backend**:
   La condivisione tramite link richiede un server per salvare/risolvere i token di invito. Senza backend:
   - **Opzione A**: La condivisione e solo UI-ready (genera link, ma non funziona tra dispositivi diversi).
   - **Opzione B**: Usare un servizio minimale (Supabase/Firebase) solo per gli inviti.
   - **Raccomandazione**: Opzione A per il MVP puro, ma e un'area dove un backend leggero aggiungerebbe molto valore.

3. **Autenticazione email/password senza backend**:
   Hashare password lato client e salvarle in IndexedDB non fornisce vera sicurezza (il DB e accessibile da DevTools). E accettabile per il MVP o si preferisce:
   - **Opzione A**: Solo guest mode per MVP, preparare l'UI login/register per il futuro backend.
   - **Opzione B**: Implementare come descritto (locale), consapevoli che e una demo.
   - **Raccomandazione**: Opzione B - implementare come demo funzionale, con nota che la vera auth richiedera backend.

4. **Drag & Drop per riordinamento**:
   Implementare drag & drop manuale in vanilla TypeScript e complesso. Opzioni:
   - **Opzione A**: Usare una libreria leggera (es. SortableJS, ~10KB)
   - **Opzione B**: Implementare solo ordinamento alfabetico/per categoria, senza drag manuale nel MVP
   - **Raccomandazione**: Opzione B per mantenere il bundle leggero, con possibilita di aggiungere drag&drop post-MVP.

5. **Icone e asset grafici**:
   Il progetto usa Heroicons o Lucide per le icone. Preferenza?
   - **Opzione A**: Lucide (SVG inline, tree-shakeable, ~0KB per icona singola)
   - **Opzione B**: Heroicons (simile, ottimo con Tailwind)
   - **Opzione C**: SVG custom inline (zero dipendenze)
   - **Raccomandazione**: Opzione C per MVP (poche icone necessarie), con possibilita di migrare a Lucide.

---

## Appendice: Checklist Rapida per Ogni Conversazione

Quando inizi un nuovo task in una conversazione dedicata, segui questa checklist:

1. **Leggi la documentazione indicata** nel campo "Documentazione da leggere"
2. **Verifica le dipendenze**: controlla che i file/moduli dei task precedenti esistano
3. **Segui le convenzioni**: `conventions.md` per stile codice, naming, error handling
4. **Rispetta l'architettura**: layer separation, event-driven, offline-first
5. **Crea SyncLog entry** per ogni operazione che modifica dati
6. **Emetti eventi** dal service layer per aggiornare la UI
7. **Zero `any` types** - TypeScript strict mode
8. **Testa manualmente** il codice scritto prima di dichiarare il task completato
9. **Non implementare feature post-MVP** elencate nella sezione "ESCLUSO"
