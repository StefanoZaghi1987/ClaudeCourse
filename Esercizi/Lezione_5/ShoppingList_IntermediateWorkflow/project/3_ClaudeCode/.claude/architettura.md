# Architettura — ShoppingList

**Dipende da**: CLAUDE.md (principi fondamentali)

---

## Layer Architecture

```
UI Layer          → components/, pages/
Business Logic    → hooks/, features/*/logic.ts
Persistence       → services/db/ (Dexie.js)
Sync              → services/sync/ (Supabase Realtime)
State             → store/ (Zustand)
```

**Regola**: ogni layer comunica solo con il layer adiacente.  
UI → hooks → services. Mai UI → services diretto.

---

## Struttura Cartelle Dettagliata

```
src/
├── components/
│   ├── ui/             # Atoms: Button, Input, Badge, Icon
│   ├── layout/         # Shell, Sidebar, Header
│   └── shared/         # Componenti riutilizzabili cross-feature
├── features/
│   ├── lists/          # Liste della spesa
│   │   ├── components/ # ListCard, ListForm, ListDetail
│   │   ├── hooks/      # useListOperations, useListSync
│   │   ├── logic.ts    # Validazioni, trasformazioni
│   │   └── types.ts    # Tipi specifici feature
│   ├── items/          # Articoli nelle liste
│   ├── auth/           # Autenticazione utente
│   ├── catalog/        # Database articoli locale
│   └── sync/           # Engine sincronizzazione
├── services/
│   ├── db/
│   │   ├── schema.ts   # Dexie schema + migrations
│   │   ├── lists.ts    # CRUD liste locale
│   │   ├── items.ts    # CRUD articoli locale
│   │   └── catalog.ts  # CRUD catalogo locale
│   └── supabase/
│       ├── client.ts   # Singleton Supabase client
│       ├── lists.ts    # API liste remote
│       ├── items.ts    # API articoli remoti
│       └── auth.ts     # Auth helpers
├── store/
│   ├── authStore.ts    # User, session, isGuest
│   ├── uiStore.ts      # Loading, toasts, modals
│   └── syncStore.ts    # Sync status, pending changes
├── hooks/
│   ├── useOfflineDetect.ts
│   ├── useOptimisticUpdate.ts
│   └── useDebounce.ts
├── types/
│   ├── domain.ts       # List, Item, User, Permission
│   ├── sync.ts         # ChangeLog, SyncStatus
│   └── api.ts          # Request/Response shapes
└── utils/
    ├── id.ts           # nanoid generator
    ├── date.ts         # timestamp helpers
    └── sanitize.ts     # XSS sanitization
```

---

## Dexie.js Schema

```typescript
// services/db/schema.ts
const db = new Dexie('ShoppingListDB');

db.version(1).stores({
  lists:    '++id, ownerId, status, updatedAt',
  items:    '++id, listId, status, category, updatedAt, &[listId+deletedAt]',
  catalog:  '++id, &name, frequency, lastUsed',
  changes:  '++id, entityType, entityId, synced, createdAt',
  invites:  '++id, listId, token, expiresAt',
});
```

**Indici critici**: `listId` su items, `name` su catalog (unique), `synced` su changes.

---

## Zustand Store Pattern

```typescript
// Store slice standard
interface ListsStore {
  lists: List[];
  loading: boolean;
  error: string | null;
  // Actions (non async nel store, delegano a hooks)
  setLists: (lists: List[]) => void;
  addList: (list: List) => void;
  updateList: (id: string, patch: Partial<List>) => void;
  removeList: (id: string) => void;
}
```

**Regola**: store contiene solo stato serializzabile. Logica async nei custom hooks.

---

## Routing (React Router v6)

```
/                    → Redirect → /lists
/lists               → Dashboard liste
/lists/:id           → Dettaglio lista
/lists/:id/shopping  → Modalità shopping
/invite/:token       → Accetta invito
/auth/login          → Login
/auth/register       → Registrazione
/profile             → Profilo utente
/trash               → Cestino articoli
```

---

## Patterns Obbligatori

**Optimistic Update:**
```typescript
async function toggleItem(id: string) {
  // 1. Update locale immediato
  await db.items.update(id, { status: 'COMPLETATO' });
  // 2. Aggiorna store
  store.updateItem(id, { status: 'COMPLETATO' });
  // 3. Sync background (non awaited nell'UI)
  syncQueue.enqueue({ type: 'UPDATE', entityId: id });
}
```

**Error Boundary**: ogni feature ha il proprio `ErrorBoundary`.  
**Suspense**: lazy import per routes non critiche.  
**Code Splitting**: ogni feature è un chunk separato via `React.lazy`.
