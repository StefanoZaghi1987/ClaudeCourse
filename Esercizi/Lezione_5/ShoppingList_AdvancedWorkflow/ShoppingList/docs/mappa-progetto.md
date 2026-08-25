# Mappa Progetto — ShoppingList

> **Aggiorna questo file ogni volta che crei, sposti o elimini un file.**  
> Scopo: permettere a Claude di localizzare qualsiasi file senza cercare nell'intero codebase.  
> Ultimo aggiornamento: Marzo 2026 (struttura iniziale — da aggiornare durante sviluppo)

---

## Stato Sprint 0 (2026-04-13)

Lo Sprint 0 ha scaffoldato lo skeleton iniziale. I file elencati nel
resto del documento rappresentano l'**obiettivo** della struttura MVP;
quelli effettivamente presenti al termine dello Sprint 0 sono solo
i seguenti:

### Root
- `package.json`, `tsconfig.json`, `tsconfig.node.json`
- `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`
- `tailwind.config.ts`, `postcss.config.js`
- `eslint.config.js`, `.prettierrc.json`
- `index.html`, `.env.example`

### Source (`src/`)
- `main.tsx` — entry + SW register + DB open
- `app.tsx` — root + routing
- `index.css` — Tailwind base
- `db/database.ts` — Dexie schema v1 (da SRS §4.2)
- `db/types.ts` — TypeScript entities (da SRS §4.3)
- `lib/supabase.ts` — STUB tipizzato (vedi CLAUDE.md)
- `stores/auth-store.ts` — stub con `getCurrentUserId()`
- `stores/list-store.ts` — placeholder vuoto
- `stores/ui-store.ts` — placeholder vuoto
- `types/ui.ts` — AppError, AppResult, SyncStatus re-export
- `constants/index.ts` — placeholder vuoto
- `pages/home-page.tsx` — "Hello World"
- `pages/not-found-page.tsx` — 404 stub
- `test/setup.ts` — Vitest + jest-dom + fake-indexeddb
- `test/app.test.tsx` — smoke test Hello World + 404

### Scripts
- `scripts/gen-icons.mjs` — one-shot SVG → PNG via sharp

### Public (`public/`)
- `favicon.svg`, `icons/pwa-192.png`, `icons/pwa-512.png`

### Docs (`docs/`)
- `supabase-schema-v1.sql` — DDL+RLS di riferimento (non applicato)
- `superpowers/brainstorms/2026-04-13-sprint-0-setup-brainstorm.md`
- `superpowers/specs/2026-04-13-sprint-0-setup-design.md`
- `superpowers/plans/2026-04-13-sprint-0-setup-infrastruttura.md`

### E2E
- `e2e/.gitkeep` — dir vuota, config Playwright pronta (0 test)

### Cartelle intenzionalmente NON create in Sprint 0
- `src/components/` — Sprint 1
- `src/hooks/` — Sprint 1
- `src/services/` — Sprint 1
- `src/repositories/` — Sprint 1

---

## Stato Sprint 1 (2026-04-14)

Sprint 1 (Core Offline) ha popolato i layer repository, service, hook, UI e
utility. La struttura effettiva al termine dello Sprint 1 è quella elencata
di seguito. Tutto il CRUD di liste e articoli funziona offline-first con
changeLog atomico per ogni mutazione.

### Source (`src/`) — file aggiunti

#### Repositories (`src/repositories/`)
- `list-repository.ts` + `list-repository.test.ts` — CRUD Dexie thin wrapper, 5 smoke test
- `item-repository.ts` + `item-repository.test.ts` — CRUD + `getMaxSortOrder` + `listActiveByList`/`listDeletedByList`, 5 smoke test
- `change-log-repository.ts` — append + appendMany, consumato dai service dentro transazione

#### Services (`src/services/`)
- `list-service.ts` + `list-service.test.ts` — `createList`, `updateList`, `archiveList`, `unarchiveList`, `deleteList` (cascade su items + changeLog atomico), 16 test
- `item-service.ts` + `item-service.test.ts` — `createItem`, `updateItem`, `toggleItemStatus`, `deleteItem`, `restoreItem`, 21 test
- `_internal/domain-error.ts` — `DomainError` class (rollback transazione)
- `_internal/map-db-error.ts` — traduce `DomainError` / Dexie errors → `AppError`

#### Hooks (`src/hooks/`)
- `use-lists.ts` + `use-lists.test.ts` — `useLiveQuery` + mutations, 4 test
- `use-items.ts` + `use-items.test.ts` — reattivo per `listId`, 4 test
- `use-deleted-items.ts` + `use-deleted-items.test.ts` — reattivo per trash, 3 test

#### Components (`src/components/`)
- `common/` — `button.tsx`, `input.tsx` (forwardRef), `badge.tsx`, `modal.tsx` (Radix Dialog), `confirm-dialog.tsx` (`useConfirm` hook), `toast-container.tsx`, `empty-state.tsx`, `loading-spinner.tsx`, `error-message.tsx`
- `lists/` — `list-card.tsx` (menu kebab + inline rename + live count), `list-form.tsx` (Modal + validation), `archived-section.tsx` (collassabile)
- `items/` — `item-row.tsx` (checkbox toggle + menu), `item-form.tsx` (form completo con select unit/category), `item-quick-add-bar.tsx` (sticky bottom), `item-trash-row.tsx` (restore)

#### Pages (`src/pages/`) — modificati / aggiunti
- `home-page.tsx` — rewrite completo (CRUD liste)
- `list-page.tsx` — NUOVA, articoli di una lista con quick add / toggle / edit / delete
- `trash-page.tsx` — NUOVA, cestino per-lista con restore

#### Utils (`src/utils/`)
- `validation.ts` + `validation.test.ts` — `validateListName`, `validateItemInput`, `validateItemPatch`, `LIMITS` (11 test)
- `id-utils.ts` — `generateId` UUID offline-safe
- `diff.ts` + `diff.test.ts` — `buildDiff` con union keys (4 test)

#### Stores (`src/stores/`) — modificati
- `ui-store.ts` — rewrite con `toasts` queue (`pushToast`, `dismissToast`, auto-dismiss 3s)

#### Root (`src/`) — modificati
- `app.tsx` — route `/`, `/lists/:listId`, `/lists/:listId/trash` + `<ToastContainer />`
- `test/app.test.tsx` — smoke aggiornato post-rewrite (HomePage titolo "Le mie liste")

### Dipendenze aggiunte
- `@radix-ui/react-dialog@^1` — focus trap + ARIA per Modal / ConfirmDialog
- `dexie-react-hooks@^1` — `useLiveQuery` per reattività UI

### Cosa NON è ancora presente
- Nessun file in `src/services/` per auth, sync, permissions, conflict, catalog (Sprint 2-5)
- Nessun file in `src/components/` per auth, sync, layout (Sprint 2-3)
- Nessun E2E test in `e2e/` (Sprint 3+)

### Quality gates Sprint 1

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` → **75 test green** (64 service/repo/util + 11 hook)
- Coverage service: `list-service.ts` 98.9% lines / 96.66% branches; `item-service.ts` 99.11% lines / 91.83% branches — unreachable sono i `catch` defensive per fallimenti Dexie imprevisti

---

## Stato Sprint 1.5 (2026-04-15) — Item CRUD UX Refinement

Sprint 1.5 ha aggiunto il catalogo articoli locale (anticipazione parziale Sprint 5),
l'autocomplete con debounce, la quick-add bar a progressive disclosure, e refactor
`item-row` (tap-to-toggle + icone inline, rimosso menu `⋮`). `item-form` ora usa
label italiani per unità e categoria.

### Source (`src/`) — file aggiunti Sprint 1.5

#### Utils (`src/utils/`)
- `item-labels.ts` — mappe IT `CATEGORY_LABELS_IT` / `UNIT_LABELS_IT` + helper `formatCategory`/`formatUnit`

#### Repositories (`src/repositories/`)
- `catalog-repository.ts` + `catalog-repository.test.ts` — thin wrapper Dexie per `itemCatalog` (add/getByName/update/searchByPrefix/topByFrequency), 5 test. Pattern `tx?: Transaction` come gli altri repo. **Locale-only, NON scrive su changeLog** (decisione architetturale §D.3 plan 1.5)

#### Services (`src/services/`)
- `catalog-service.ts` + `catalog-service.test.ts` — `getSuggestions(query, limit=5)` (read, on-demand) + `recordUsage(name, defaults, tx)` (upsert atomico dentro tx di `itemService.createItem`), 8 test. Logica stale-default 30 giorni

#### Hooks (`src/hooks/`)
- `use-catalog-suggestions.ts` + `use-catalog-suggestions.test.ts` — hook con debounce 200ms, **NO `useLiveQuery`** (derivation on-demand), 3 test

#### Components (`src/components/items/`) — aggiunti
- `item-name-autocomplete.tsx` — controlled combobox ARIA con keyboard nav (↑↓/Enter/Esc), dropdown `absolute bottom-full z-20` (la quick-add bar è sticky-bottom)
- `item-row.test.tsx` — 4 test di regressione per layout ibrido (tap-to-toggle + stopPropagation sulle icone)
- `item-quick-add-bar.test.tsx` — 3 test (render compatto, espansione on-focus, submit completo)
- `item-name-autocomplete.test.tsx` — 3 test (query→dropdown, click pick, Escape chiude)

### Source (`src/`) — file modificati Sprint 1.5

- `src/services/item-service.ts` — `createItem` ora aggiorna `db.itemCatalog` nella **stessa transazione** che tocca `items + changeLog`. Nuove due righe: `db.itemCatalog` nel set tabelle tx + `catalogService.recordUsage(...)` come ultima operazione prima del `return item`
- `src/services/item-service.test.ts` — +2 test integrazione catalog (nuovo nome → frequency=1; duplicato → frequency=2)
- `src/components/items/item-row.tsx` — rewrite: rimosso stato `menuOpen` e menu `⋮`; nuovo layout "checkbox + `<button>` body tap-to-toggle + icone `✎`/`🗑` inline con `stopPropagation`"; touch target 40×40 px; display `item.unit`/`item.category` ora usa `formatUnit`/`formatCategory` (label IT)
- `src/components/items/item-form.tsx` — `<option>` di `unit-select` e `category-select` ora mostrano `UNIT_LABELS_IT[u]` / `CATEGORY_LABELS_IT[c]` invece dell'enum grezzo
- `src/components/items/item-quick-add-bar.tsx` — rewrite completo: progressive disclosure (collapsed/expanded on-focus), embed `<ItemNameAutocomplete>`, chip top-4 categorie + "Altre…", stepper quantità 0-9999, select unità compatto, firma `onSubmit` cambia a `(input: QuickAddInput) => Promise<AppResult<Item>>`
- `src/pages/list-page.tsx` — call-site aggiornato: `<ItemQuickAddBar onSubmit={(input) => itemsHook.create(input)} />`

### Dipendenze aggiunte Sprint 1.5
Nessuna. `@testing-library/user-event` era già installato in Sprint 0.

### Architettura catalogo (decisione §D.3)

Il `catalogRepository` è **locale-only** e NON scrive su `changeLog`. Motivazione: il catalogo è un indice personale derivabile (aggregabile offline da `items`), replicarlo via changeLog incrementerebbe il debito sync senza valore funzionale. Lo schema `itemCatalog` esiste già in Dexie v1 (NESSUNA migration). Il task `S5-04` (sync catalogo tra collaboratori) resta nel plan di Sprint 5.

### Quality gates Sprint 1.5

- `npm run typecheck` ✅
- `npm run lint` ✅ (max-warnings 0)
- `npm run test` → **103 test green** (+28 vs Sprint 1: catalog repo 5, catalog service 8, item-service integration +2, use-catalog-suggestions 3, component tests 10)

---

## Configurazione Claude Code

```
CLAUDE.md                          # Config principale (principi core + navigazione)
.claude/
  architettura.md                  # Stack, layer, struttura directory, naming, pattern
  dominio.md                       # Entità, business rules, permessi, glossario
  qualita.md                       # Enforcement rules, TypeScript, React, naming, checklist
  sync.md                          # Offline-first, changeLog, sync, conflict resolution
  testing.md                       # Strategia test, copertura, factory, comandi
  sicurezza.md                     # Auth, RLS, validazione, sanitizzazione, OWASP
docs/
  piano-sviluppo.md                # Sprint plan con task, milestone, stati completamento
  mappa-progetto.md                # Questo file — project map
  SoftwareRequirements.md          # SRS completo (riferimento autoritativo)
  FrameworkAnalysis.md             # Analisi e motivazione stack tecnologico
  UniversalSoftwareDevelopmentBestPractices.md  # Best practices universali
```

---

## Struttura Progetto (src/)

### Componenti React (`src/components/`)

```
src/components/
├── common/                        # Componenti UI riutilizzabili
│   ├── Button.tsx                 # Pulsante base (varianti: primary, secondary, danger)
│   ├── Modal.tsx                  # Dialog/modale generico con focus trap
│   ├── Toast.tsx                  # Notifiche temporanee (success, error, warning, info)
│   ├── Input.tsx                  # Campo input con label, errore, helper text
│   ├── Badge.tsx                  # Badge numerico/stato
│   ├── ConfirmDialog.tsx          # Dialog di conferma per azioni distruttive
│   ├── LoadingSpinner.tsx         # Spinner loading
│   ├── EmptyState.tsx             # Stato vuoto (no items)
│   └── ErrorMessage.tsx           # Visualizzazione errori con retry
├── lists/                         # Componenti relativi alle liste
│   ├── ListCard.tsx               # Card singola lista (nome, contatori, sync status)
│   ├── ListForm.tsx               # Form creazione/modifica lista
│   ├── ListHeader.tsx             # Header lista (nome, menu, modalità shopping)
│   ├── ListMembersPanel.tsx       # Gestione collaboratori (invita, revoca)
│   └── SortableListContainer.tsx  # Container con drag-and-drop per liste
├── items/                         # Componenti relativi agli articoli
│   ├── ItemRow.tsx                # Riga singolo articolo (checkbox, nome, quantità, cat)
│   ├── ItemForm.tsx               # Form aggiunta/modifica articolo (con autocompletamento)
│   ├── ItemTrashRow.tsx           # Riga articolo nel cestino (con ripristino)
│   ├── ItemCategoryBadge.tsx      # Badge categoria colorato
│   └── ItemUnitSelect.tsx         # Selezione unità di misura
├── sync/                          # Componenti stato sincronizzazione
│   ├── SyncStatusBadge.tsx        # Icona stato sync (synced/syncing/pending/error/offline)
│   └── SyncIndicator.tsx          # Indicatore globale con count pending
├── auth/                          # Componenti autenticazione
│   ├── LoginForm.tsx              # Form login email+password
│   ├── RegisterForm.tsx           # Form registrazione
│   ├── ProfileMenu.tsx            # Menu profilo utente (avatar, logout, settings)
│   └── GuestBanner.tsx            # Banner "Registrati per sincronizzare"
└── layout/                        # Layout e struttura pagina
    ├── AppShell.tsx               # Shell principale (header + main + bottom nav)
    ├── Header.tsx                 # Header applicazione
    ├── BottomNav.tsx              # Navigazione bottom su mobile
    └── OfflineBanner.tsx          # Banner modalità offline
```

### Pagine (`src/pages/`)

```
src/pages/
├── HomePage.tsx                   # Lista di tutte le liste dell'utente
├── ListPage.tsx                   # Vista singola lista con articoli
├── TrashPage.tsx                  # Cestino articoli eliminati
├── LoginPage.tsx                  # Pagina di login
├── RegisterPage.tsx               # Pagina di registrazione
├── InvitePage.tsx                 # Accettazione invito a lista condivisa
├── ProfilePage.tsx                # Profilo utente + impostazioni
└── NotFoundPage.tsx               # 404
```

### Custom Hooks (`src/hooks/`)

```
src/hooks/
├── useLists.ts                    # CRUD liste + stato reattivo (useLiveQuery)
├── useItems.ts                    # CRUD articoli per lista + stato reattivo
├── useSync.ts                     # Trigger sync, stato sync, retry
├── useAuth.ts                     # Stato sessione, login, register, logout
├── usePermissions.ts              # Permesso utente corrente per lista specifica
├── useAutocomplete.ts             # Suggerimenti autocompletamento da catalogo
├── useUndo.ts                     # Stack undo/redo (max 20 operazioni)
└── useNetworkStatus.ts            # Stato connessione online/offline
```

### Services (`src/services/`)

```
src/services/
├── listService.ts                 # Business logic: crea, modifica, archivia, elimina lista
├── itemService.ts                 # Business logic: crea, modifica, elimina, toggle articolo
├── syncService.ts                 # Orchestrazione upload/download changeLog ↔ Supabase
├── authService.ts                 # Login, register, logout, migrazione guest
├── permissionService.ts           # Verifica permessi (canPerform), matrice RBAC
├── conflictService.ts             # Rilevamento e risoluzione conflitti di sync
└── catalogService.ts              # Gestione catalogo articoli e autocompletamento
```

### Repositories (`src/repositories/`)

```
src/repositories/
├── listRepository.ts              # CRUD Dexie.js per tabella lists
├── itemRepository.ts              # CRUD Dexie.js per tabella items
├── changeLogRepository.ts         # Read/write changeLog (pending entries)
└── catalogRepository.ts           # CRUD Dexie.js per itemCatalog
```

### Database (`src/db/`)

```
src/db/
├── database.ts                    # Dexie schema, versioni, migrations, indici
└── types.ts                       # TypeScript types per entità DB locale
```

### Stores Zustand (`src/stores/`)

```
src/stores/
├── authStore.ts                   # Stato: user, isGuest, isLoading — Actions: login, logout
├── listStore.ts                   # Stato: lists, activeListId, isLoading — Actions: CRUD
└── uiStore.ts                     # Stato: theme, networkStatus, toasts, shoppingMode
```

### Librerie e Utility (`src/lib/`, `src/utils/`, `src/types/`, `src/constants/`)

```
src/lib/
├── supabase.ts                    # Singleton client Supabase
└── workbox.ts                     # Registrazione Service Worker

src/utils/
├── validation.ts                  # Funzioni di validazione input (liste, articoli)
├── sanitization.ts                # Sanitizzazione anti-XSS (DOMPurify)
├── dateUtils.ts                   # Formattazione date, calcolo "X minuti fa"
└── idUtils.ts                     # Generatore UUID locale (offline-safe)

src/types/
├── domain.ts                      # Tipi di dominio (LocalList, LocalItem, ListMember, ecc.)
├── api.ts                         # Tipi Supabase (tabelle remote, responses)
└── ui.ts                          # Tipi UI (SyncStatus, AppError, ToastType, ecc.)

src/constants/
└── index.ts                       # Costanti (MAX_ITEM_NAME_LENGTH, SYNC_INTERVAL_MS, ecc.)
```

### Test (`src/` — co-locati + `e2e/`)

```
src/
  services/*.test.ts               # Unit test services (co-locati)
  repositories/*.test.ts           # Unit test repositories
  hooks/*.test.ts                  # Unit test hooks
  components/**/*.test.tsx         # Test componenti React
  test/
    factories.ts                   # Mock factories (buildMockList, buildMockItem)
    setup.ts                       # Setup globale Vitest
    mocks/                         # MSW handlers per mock Supabase

e2e/
  shopping-flow.spec.ts            # E2E: flusso acquisto completo
  sharing-flow.spec.ts             # E2E: invito e collaborazione
  offline-sync.spec.ts             # E2E: offline e ritorno online
  auth-flow.spec.ts                # E2E: login, register, guest
```

### Root Files

```
src/
  App.tsx                          # Root component (Router + QueryProvider + Toaster)
  main.tsx                         # Entry point React (ReactDOM.createRoot)
  index.css                        # Import Tailwind + global CSS minimal

public/
  manifest.webmanifest             # PWA manifest (nome, icone, colori, display)
  icons/                           # Icone PWA (192x192, 512x512, maskable)

vite.config.ts                     # Vite config (pwa plugin, path aliases)
vitest.config.ts                   # Vitest config
playwright.config.ts               # Playwright E2E config
tsconfig.json                      # TypeScript config (strict: true)
tsconfig.app.json                  # TypeScript config applicazione
tailwind.config.ts                 # Tailwind config (theme, plugins)
postcss.config.js                  # PostCSS (autoprefixer)
.env.example                       # Template variabili d'ambiente
.gitignore                         # Include .env.local, dist, node_modules
package.json                       # Dipendenze e scripts
```

---

## Indice Responsabilità → File

| Responsabilità | File |
|---------------|------|
| Crea/modifica/elimina lista | `services/listService.ts` |
| Crea/modifica/elimina articolo | `services/itemService.ts` |
| Toggle stato articolo | `services/itemService.ts` → `itemRepository.ts` |
| Verifica permessi utente | `services/permissionService.ts` |
| Genera token invito | `services/authService.ts` (o inviteService) |
| Change log tracking | `repositories/changeLogRepository.ts` |
| Sync con Supabase | `services/syncService.ts` |
| Risoluzione conflitti | `services/conflictService.ts` |
| Autocompletamento articoli | `services/catalogService.ts` + `hooks/useAutocomplete.ts` |
| Stato autenticazione | `stores/authStore.ts` + `hooks/useAuth.ts` |
| Stato liste (globale) | `stores/listStore.ts` + `hooks/useLists.ts` |
| Stato UI (toast, offline) | `stores/uiStore.ts` |
| Schema IndexedDB | `db/database.ts` |
| Client Supabase | `lib/supabase.ts` |
| Validazione input | `utils/validation.ts` |
| Sanitizzazione XSS | `utils/sanitization.ts` |

---

*Documento: `docs/mappa-progetto.md`*  
*⚠️ Aggiornare SEMPRE quando si creano, spostano o eliminano file*
