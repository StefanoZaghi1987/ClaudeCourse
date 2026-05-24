# Mappa Progetto — ShoppingList

> **Aggiorna questo file ogni volta che crei, sposti o elimini un file.**  
> Scopo: permettere a Claude di localizzare qualsiasi file senza cercare nell'intero codebase.  
> Ultimo aggiornamento: Marzo 2026 (struttura iniziale — da aggiornare durante sviluppo)

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
