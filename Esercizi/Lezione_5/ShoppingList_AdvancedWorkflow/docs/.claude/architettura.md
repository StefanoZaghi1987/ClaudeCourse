# Architettura — ShoppingList

**Dipendenze:** Leggi prima `CLAUDE.md` (principi core)  
**Aggiorna questo file:** Se cambia struttura directory, pattern o stack

---

## Stack Tecnologico

| Layer | Tecnologia | Versione | Scopo |
|-------|-----------|---------|-------|
| UI | React | 18 | Componenti dichiarativi |
| Linguaggio | TypeScript | 5 (strict) | Type safety completo |
| Build | Vite | 5 | Dev server + bundle |
| PWA | vite-plugin-pwa + Workbox | latest | Offline capability |
| DB Locale | Dexie.js (IndexedDB) | 3 | Source of truth offline |
| State | Zustand | 4 | Stato globale minimalista |
| Router | React Router | 6 | SPA navigation |
| Stili | Tailwind CSS | 3 | Utility-first CSS |
| Backend/Auth | Supabase | 2 | Auth + DB remoto + Realtime |
| Test | Vitest + Testing Library + Playwright | latest | Unit/Int/E2E |
| Deploy | Vercel | — | Hosting + CDN |

---

## Struttura Directory

```
src/
├── components/           # Componenti React riutilizzabili
│   ├── common/           # Button, Modal, Toast, Input, Badge, etc.
│   ├── lists/            # ListCard, ListForm, ListHeader, etc.
│   ├── items/            # ItemRow, ItemForm, ItemTrash, etc.
│   ├── sync/             # SyncStatusBadge, SyncIndicator
│   ├── auth/             # LoginForm, RegisterForm, ProfileMenu
│   └── layout/           # AppShell, Header, BottomNav
├── pages/                # Componenti-pagina (route-level)
│   ├── HomePage.tsx
│   ├── ListPage.tsx
│   ├── TrashPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── InvitePage.tsx
│   ├── ProfilePage.tsx
│   └── NotFoundPage.tsx
├── hooks/                # Custom hooks (orchestrazione UI ↔ Services)
│   ├── useLists.ts
│   ├── useItems.ts
│   ├── useSync.ts
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   ├── useAutocomplete.ts
│   └── useUndo.ts
├── services/             # Business logic pura (testabile, no I/O diretto)
│   ├── listService.ts
│   ├── itemService.ts
│   ├── syncService.ts
│   ├── authService.ts
│   ├── permissionService.ts
│   ├── conflictService.ts
│   └── catalogService.ts
├── repositories/         # Accesso dati Dexie.js (no business logic)
│   ├── listRepository.ts
│   ├── itemRepository.ts
│   ├── changeLogRepository.ts
│   └── catalogRepository.ts
├── db/
│   ├── database.ts       # Dexie schema + migrations
│   └── types.ts          # TypeScript types per DB locale
├── stores/               # Zustand stores (stato globale)
│   ├── authStore.ts
│   ├── listStore.ts
│   └── uiStore.ts
├── lib/
│   ├── supabase.ts       # Supabase client singleton
│   └── workbox.ts        # Service Worker registration
├── utils/                # Funzioni pure di utilità
│   ├── validation.ts
│   ├── sanitization.ts
│   ├── dateUtils.ts
│   └── idUtils.ts
├── types/                # TypeScript types globali
│   ├── domain.ts         # Entità di dominio
│   ├── api.ts            # Tipi API Supabase
│   └── ui.ts             # Tipi UI-specifici
├── constants/            # Costanti applicazione
│   └── index.ts
└── App.tsx               # Root component + routing
```

---

## Layer Architecture

### Regola delle Dipendenze
```
Components/Pages → Hooks → Services → Repositories → Dexie.js
                                    ↘ Supabase (asincrono)
```
- Le dipendenze scorrono **solo verso il basso**
- Un component **non** chiama mai un service direttamente
- Un service **non** importa mai da un component o hook
- Nessuna dipendenza circolare

### Layer UI (Components + Pages)
- **Responsabilità:** rendering, eventi utente, animazioni, feedback visivo
- **Non deve:** contenere logica di business, chiamare Dexie o Supabase direttamente
- **Deve:** usare hook per ogni operazione dati/logica
- **Dimensione max:** 200 LOC per componente

### Layer Hook (Custom Hooks)
- **Responsabilità:** orchestrare UI ↔ Services, gestire stato locale UI, loading/error states
- **Non deve:** contenere business logic (delegare ai Services)
- **Pattern obbligatorio:** 
  ```typescript
  // ✅ Corretto
  const { lists, isLoading, error } = useLists()
  // Hook chiama service, service chiama repository
  ```

### Layer Service (Business Logic)
- **Responsabilità:** validazione, regole business, orchestrazione operazioni
- **Non deve:** contenere I/O diretto (usare repository), stato React, logica UI
- **Deve:** essere testabile in isolamento (pure functions dove possibile)
- **Pattern:**
  ```typescript
  // Ogni service esporta funzioni pure o classi stateless
  export async function createList(input: CreateListInput): Promise<List> {
    validate(input)              // Validazione
    const list = toEntity(input) // Trasformazione
    await listRepository.save(list) // Persistenza
    await changeLogRepository.record('CREATE', 'LIST', list.id) // Tracking
    return list
  }
  ```

### Layer Repository (Persistenza Locale)
- **Responsabilità:** CRUD su IndexedDB via Dexie.js
- **Non deve:** contenere business logic, chiamare Supabase
- **Pattern:** ogni repository ha metodi CRUD + query specifiche
- **Return type:** sempre `Promise<T>` o `Observable<T>` (useLiveQuery)

---

## Dexie.js — Schema Database Locale

```typescript
// db/database.ts — Versione corrente: 1
class ShoppingListDB extends Dexie {
  lists!: Table<LocalList>
  items!: Table<LocalItem>
  changeLog!: Table<ChangeLogEntry>
  itemCatalog!: Table<CatalogItem>
  syncState!: Table<SyncState>
}

// Indici obbligatori per performance
// lists: id, userId, status, updatedAt
// items: id, listId, status, category, deleted, updatedAt  
// changeLog: id, synced, timestamp, entityType
// itemCatalog: id, name, frequency, lastUsedAt
```

**Regola migrazioni:** ogni nuova versione schema = nuova `version(N).stores()`.  
**MAI** modificare una versione già esistente.

---

## Supabase — Database Remoto

### Tabelle remote (specchio del locale)
- `lists` — con RLS per accesso utente/collaboratori
- `list_members` — permessi OWNER/EDITOR/VIEWER
- `items` — con RLS tramite list membership
- `change_log` — audit trail sincronizzato
- `item_catalog` — per merge catalogo tra collaboratori
- `invite_tokens` — token invito con expiry 7 giorni

**RLS obbligatoria su ogni tabella.** Nessuna tabella pubblica senza policy esplicita.

---

## Workbox — Service Worker Strategies

```
Route pattern          → Strategy
────────────────────────────────────
/api/* (Supabase)      → NetworkFirst (timeout 5s → cache)
/*.js, /*.css          → CacheFirst (immutable assets)
/index.html            → StaleWhileRevalidate
Immagini               → CacheFirst (max 30 giorni)
Font                   → CacheFirst (max 1 anno)
```

---

## Pattern di Codice Obbligatori

### Naming Conventions
```typescript
// Componenti: PascalCase
export function ListCard({ list }: ListCardProps) {}

// Hook: camelCase con prefisso "use"
export function useListPermissions(listId: string) {}

// Service: camelCase, verbo + noun
export async function createList(...) {}
export async function archiveList(...) {}

// Repository: camelCase, noun + Repository
export const listRepository = { ... }

// Types: PascalCase con suffisso descrittivo
type LocalList = { ... }
type CreateListInput = { ... }
type ListPermission = 'OWNER' | 'EDITOR' | 'VIEWER'

// Costanti: SCREAMING_SNAKE_CASE
const MAX_LIST_NAME_LENGTH = 100

// File: kebab-case
list-card.tsx, list-service.ts, list-repository.ts
```

### Error Handling
```typescript
// Pattern obbligatorio per operazioni async
try {
  const result = await service.operation(input)
  return { data: result, error: null }
} catch (error) {
  console.error('[context]', { operation: 'createList', input, error })
  return { data: null, error: toAppError(error) }
}

// MAI: catch silenzioso, catch che rilancia senza log, throw di stringhe
```

### TypeScript Obbligatorio
```typescript
// ✅ Sempre tipizzare esplicitamente i return delle funzioni
async function getList(id: string): Promise<List | null> {}

// ✅ Preferire tipi nominali a "string" o "number" generici
type ListId = string & { readonly brand: 'ListId' }

// ❌ MAI usare "any" — usare "unknown" e narrowing
```

---

*File: `.claude/architettura.md` — Aggiorna se cambia struttura o pattern*
