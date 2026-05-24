# ShoppingList — Piano di Sviluppo MVP
> **Versione:** 1.0.0 | **Data:** Marzo 2026 | **Metodologia:** Spec-Driven Development con Claude Code
> **Stack:** React 18 + TypeScript + Vite + Dexie.js + Supabase + Zustand + Tailwind CSS + PWA

---

## Indice

1. [Visione del MVP](#1-visione-del-mvp)
2. [Stack Tecnologico](#2-stack-tecnologico)
3. [Architettura a Layer](#3-architettura-a-layer)
4. [Schema Database](#4-schema-database)
5. [Sprint Plan](#5-sprint-plan)
   - [Sprint 0 — Setup Infrastruttura](#sprint-0--setup-infrastruttura)
   - [Sprint 1 — Core Offline: Liste e Articoli](#sprint-1--core-offline-liste-e-articoli)
   - [Sprint 2 — Autenticazione e Modalità Guest](#sprint-2--autenticazione-e-modalità-guest)
   - [Sprint 3 — Sincronizzazione Base](#sprint-3--sincronizzazione-base)
   - [Sprint 4 — Condivisione e Permessi](#sprint-4--condivisione-e-permessi)
   - [Sprint 5 — Autocompletamento e Refinement](#sprint-5--autocompletamento-e-refinement)
6. [Definition of Done](#6-definition-of-done)
7. [Architettura dei Componenti React](#7-architettura-dei-componenti-react)
8. [Business Logic Layer (Services e Hooks)](#8-business-logic-layer-services-e-hooks)
9. [Gestione Stato (Zustand)](#9-gestione-stato-zustand)
10. [Routing](#10-routing)
11. [PWA e Service Worker](#11-pwa-e-service-worker)
12. [Testing Strategy](#12-testing-strategy)
13. [Convenzioni di Sviluppo](#13-convenzioni-di-sviluppo)
14. [Contesto per Nuove Conversazioni Claude Code](#14-contesto-per-nuove-conversazioni-claude-code)

---

## 1. Visione del MVP

### 1.1 Obiettivo

Realizzare un'applicazione web **PWA offline-first** per la gestione collaborativa di liste della spesa. Il database locale (IndexedDB via Dexie.js) è la **source of truth primaria**. La sincronizzazione con il backend (Supabase) è un enhancement, non un requisito.

### 1.2 Funzionalità MVP (Must Have)

| Area | Funzionalità |
|------|-------------|
| **Liste** | CRUD liste, archiviazione, soft delete |
| **Articoli** | CRUD articoli, toggle spuntato/da comprare, soft delete, cestino |
| **Offline** | Tutte le operazioni funzionano senza rete |
| **Auth** | Registrazione/login email+password, modalità guest |
| **Sync** | Sincronizzazione base multi-device con indicatori di stato |
| **Condivisione** | Invita utenti via link, permessi OWNER/EDITOR/VIEWER |
| **Autocompletamento** | Catalogo articoli locale con suggerimenti intelligenti |

### 1.3 Fuori Scope per MVP

- Modalità Shopping avanzata (font grandi, gesture swipe)
- Ricerca globale cross-lista
- Template e liste ricorrenti
- Notifiche push
- Import/export avanzato
- Gestione conflitti con UI dedicata (solo last-write-wins automatico)
- Log attività completo
- Undo/redo stack

### 1.4 Milestone

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| **M1** | Fine Sprint 0 | App deployata, auth funzionante, PWA installabile |
| **M2** | Fine Sprint 1 | Liste e articoli offline-first completi |
| **M3** | Fine Sprint 2 | Auth con migrazione dati guest→utente registrato |
| **M4** | Fine Sprint 3 | Sync multi-device funzionante |
| **M5** | Fine Sprint 4 | Condivisione con permessi completa |
| **M6** | Fine Sprint 5 | MVP stabile, testato, pronto |

---

## 2. Stack Tecnologico

### 2.1 Dipendenze Principali

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.x",
    "zustand": "^4.x",
    "dexie": "^3.x",
    "dexie-react-hooks": "^1.x",
    "@supabase/supabase-js": "^2.x",
    "uuid": "^9.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "vite-plugin-pwa": "^0.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^3.x",
    "vitest": "^1.x",
    "@testing-library/react": "^14.x",
    "@testing-library/user-event": "^14.x",
    "playwright": "^1.x"
  }
}
```

### 2.2 Struttura Directory

```
src/
├── components/           # Componenti React UI
│   ├── common/           # Button, Modal, Toast, Input, Spinner…
│   ├── lists/            # ListCard, ListForm, ListHeader…
│   ├── items/            # ItemRow, ItemForm, ItemCatalogInput…
│   ├── auth/             # LoginForm, RegisterForm, GuestBanner
│   ├── sync/             # SyncStatusBadge, ConflictBanner
│   └── sharing/          # ShareModal, MembersPanel, InviteAccept
├── pages/                # Pagine (HomePage, ListPage, LoginPage…)
├── services/             # Business Logic pura (no React)
│   ├── listService.ts
│   ├── itemService.ts
│   ├── authService.ts
│   ├── syncService.ts
│   ├── conflictService.ts
│   ├── permissionService.ts
│   └── catalogService.ts
├── stores/               # Zustand stores
│   ├── useAuthStore.ts
│   ├── useListStore.ts
│   └── useUIStore.ts
├── db/                   # Dexie.js schema e repository
│   ├── database.ts       # Definizione schema e versioning
│   └── repositories/     # listRepository, itemRepository…
├── lib/                  # Client Supabase e utility
│   ├── supabase.ts
│   └── utils.ts
├── hooks/                # Custom hooks React
├── types/                # TypeScript types condivisi
│   └── index.ts
└── constants/            # Enums, costanti applicazione
    └── index.ts
```

### 2.3 Variabili d'Ambiente

```env
# .env.local
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
VITE_APP_URL=http://localhost:5173
```

---

## 3. Architettura a Layer

```
┌─────────────────────────────────────────────────┐
│  UI LAYER (React Components + Pages)            │
│  Solo rendering e gestione eventi               │
└────────────────────┬────────────────────────────┘
                     │ chiama
┌────────────────────▼────────────────────────────┐
│  BUSINESS LOGIC LAYER (Services + Custom Hooks) │
│  Validazione, orchestrazione, regole business   │
└──────────┬──────────────────────┬───────────────┘
           │                      │
┌──────────▼──────────┐  ┌────────▼───────────────┐
│  PERSISTENCE LAYER  │  │  SYNC LAYER             │
│  Dexie.js / IndexedDB│  │  Supabase Realtime      │
│  (source of truth)  │  │  Change tracking, delta │
└─────────────────────┘  └────────────────────────┘
```

**Principi:**
- L'UI non contiene logica di business — chiama solo i service o gli hooks
- I service sono funzioni pure, testabili in isolamento
- Il Persistence Layer scrive sempre prima localmente (Optimistic UI)
- Il Sync Layer opera in background, indipendentemente dall'UI

---

## 4. Schema Database

### 4.1 Database Locale — Dexie.js (IndexedDB)

#### File: `src/db/database.ts`

```typescript
import Dexie, { Table } from 'dexie'
import { List, Item, ChangeLog, ItemCatalog, UserSyncMeta } from '../types'

class ShoppingListDB extends Dexie {
  lists!: Table<List>
  items!: Table<Item>
  changeLog!: Table<ChangeLog>
  itemCatalog!: Table<ItemCatalog>
  userSyncMeta!: Table<UserSyncMeta>

  constructor() {
    super('ShoppingListDB')
    this.version(1).stores({
      lists:       '&id, userId, status, createdAt, updatedAt',
      items:       '&id, listId, status, category, createdAt, updatedAt, deletedAt',
      changeLog:   '&id, entityType, entityId, timestamp, synced',
      itemCatalog: '&id, name, userId, lastUsedAt',
      userSyncMeta:'&userId',
    })
  }
}

export const db = new ShoppingListDB()
```

#### TypeScript Types (`src/types/index.ts`)

```typescript
// ENUMS

export type ItemStatus = 'pending' | 'completed'
export type ListStatus = 'active' | 'archived'
export type Permission = 'OWNER' | 'EDITOR' | 'VIEWER'
export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATE_CHANGE'
export type EntityType = 'LIST' | 'ITEM'

export type Category =
  | 'Frutta e Verdura'
  | 'Latticini'
  | 'Carne e Pesce'
  | 'Bevande'
  | 'Surgelati'
  | 'Dispensa'
  | 'Igiene e Pulizia'
  | 'Altro'

export type UnitOfMeasure =
  | 'kg' | 'g' | 'l' | 'ml'
  | 'pezzi' | 'confezioni' | 'pacchi'
  | 'bottiglie' | 'lattine' | 'buste'

// ENTITIES

export interface SharedMember {
  userId: string
  permission: Permission
  invitedAt: number
  invitedBy: string
}

export interface List {
  id: string                    // UUID v4
  name: string                  // max 100 chars
  status: ListStatus
  ownerId: string
  sharedWith: SharedMember[]    // serializzato come JSON in IndexedDB
  createdAt: number
  updatedAt: number
  sortOrder: number
  isTemplate: boolean
  // sync fields
  remoteId?: string
  lastSyncedAt?: number
  hasLocalChanges: boolean
}

export interface Item {
  id: string                    // UUID v4
  listId: string
  name: string                  // max 200 chars
  quantity: number | null       // > 0 se presente
  unit: UnitOfMeasure | null
  notes: string | null          // max 500 chars, sanitizzato
  category: Category | null
  status: ItemStatus
  sortOrder: number
  createdAt: number
  updatedAt: number
  completedAt: number | null
  deletedAt: number | null      // null = non eliminato (soft delete)
  createdBy: string
  updatedBy: string
  // sync fields
  remoteId?: string
  lastSyncedAt?: number
  hasLocalChanges: boolean
}

export interface ChangeLog {
  id: string
  userId: string
  operationType: OperationType
  entityType: EntityType
  entityId: string
  changes: { before: Record<string, unknown>; after: Record<string, unknown> }
  timestamp: number
  synced: boolean
  syncedAt: number | null
  conflictResolution: string | null
}

export interface ItemCatalog {
  id: string
  userId: string
  name: string                  // lowercase per matching
  displayName: string           // case originale
  frequency: number             // quante volte usato
  lastUsedAt: number
  defaultCategory: Category | null
  defaultUnit: UnitOfMeasure | null
  defaultQuantity: number | null
}

export interface UserSyncMeta {
  userId: string
  lastSyncTimestamp: number     // timestamp ultimo sync completato
}
```

### 4.2 Database Remoto — Supabase / PostgreSQL

**DDL essenziale (da eseguire nella Supabase SQL Editor):**

```sql
-- EXTENSION
create extension if not exists "uuid-ossp";

-- PROFILES (estende auth.users di Supabase)
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  username    text unique,
  display_name text,
  avatar_url  text,
  created_at  timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Chiunque può vedere profili"
  on public.profiles for select using (true);
create policy "Utente modifica solo il suo profilo"
  on public.profiles for update using (auth.uid() = id);

-- LISTS
create table public.lists (
  id           uuid primary key default uuid_generate_v4(),
  local_id     text unique not null,
  name         text not null check (char_length(name) <= 100),
  status       text not null default 'active' check (status in ('active','archived')),
  owner_id     uuid not null references auth.users on delete cascade,
  shared_with  jsonb not null default '[]',
  sort_order   float8 not null default 0,
  is_template  boolean not null default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table public.lists enable row level security;

-- Trigger per updated_at automatico su lists
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger lists_updated_at before update on public.lists
  for each row execute function public.set_updated_at();

-- RLS LISTS
create policy "Utente vede le sue liste + condivise"
  on public.lists for select
  using (
    owner_id = auth.uid()
    or shared_with @> jsonb_build_array(jsonb_build_object('userId', auth.uid()::text))
  );
create policy "Owner crea liste"
  on public.lists for insert with check (owner_id = auth.uid());
create policy "Owner o Editor modifica lista"
  on public.lists for update using (
    owner_id = auth.uid()
    or (
      shared_with @> jsonb_build_array(jsonb_build_object('userId', auth.uid()::text))
      and (
        select (m->>'permission') from jsonb_array_elements(shared_with) m
        where m->>'userId' = auth.uid()::text
        limit 1
      ) = 'EDITOR'
    )
  );
create policy "Solo Owner elimina lista"
  on public.lists for delete using (owner_id = auth.uid());

-- ITEMS
create table public.items (
  id           uuid primary key default uuid_generate_v4(),
  local_id     text not null,
  list_id      uuid not null references public.lists on delete cascade,
  name         text not null check (char_length(name) <= 200),
  quantity     numeric check (quantity > 0),
  unit         text,
  notes        text check (char_length(notes) <= 500),
  category     text,
  status       text not null default 'pending' check (status in ('pending','completed')),
  sort_order   float8 not null default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  completed_at timestamptz,
  deleted_at   timestamptz,
  created_by   uuid not null references auth.users,
  updated_by   uuid not null references auth.users,
  unique(local_id, list_id)
);
alter table public.items enable row level security;
create trigger items_updated_at before update on public.items
  for each row execute function public.set_updated_at();

-- RLS ITEMS (eredita logica da lists)
create policy "Accesso items via lista"
  on public.items for select
  using (
    exists (
      select 1 from public.lists l
      where l.id = list_id
      and (
        l.owner_id = auth.uid()
        or l.shared_with @> jsonb_build_array(jsonb_build_object('userId', auth.uid()::text))
      )
    )
  );
create policy "Editor o Owner inserisce items"
  on public.items for insert
  with check (
    exists (
      select 1 from public.lists l where l.id = list_id
      and (
        l.owner_id = auth.uid()
        or (
          l.shared_with @> jsonb_build_array(jsonb_build_object('userId', auth.uid()::text))
          and (
            select (m->>'permission') from jsonb_array_elements(l.shared_with) m
            where m->>'userId' = auth.uid()::text limit 1
          ) in ('OWNER','EDITOR')
        )
      )
    )
  );
create policy "Editor o Owner modifica items"
  on public.items for update using (
    exists (
      select 1 from public.lists l where l.id = list_id
      and (
        l.owner_id = auth.uid()
        or (
          l.shared_with @> jsonb_build_array(jsonb_build_object('userId', auth.uid()::text))
          and (
            select (m->>'permission') from jsonb_array_elements(l.shared_with) m
            where m->>'userId' = auth.uid()::text limit 1
          ) in ('OWNER','EDITOR')
        )
      )
    )
  );

-- INVITE TOKENS
create table public.invite_tokens (
  id           uuid primary key default uuid_generate_v4(),
  list_id      uuid not null references public.lists on delete cascade,
  created_by   uuid not null references auth.users,
  permission   text not null check (permission in ('EDITOR','VIEWER')),
  token        text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at   timestamptz not null default now() + interval '7 days',
  used_by      uuid references auth.users,
  used_at      timestamptz,
  created_at   timestamptz default now()
);
alter table public.invite_tokens enable row level security;
create policy "Owner crea invite token"
  on public.invite_tokens for insert with check (
    exists (select 1 from public.lists where id = list_id and owner_id = auth.uid())
  );
create policy "Chiunque autenticato legge token valido"
  on public.invite_tokens for select using (
    auth.uid() is not null and expires_at > now() and used_at is null
  );

-- ITEM CATALOG (condiviso tra collaboratori)
create table public.item_catalog (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users on delete cascade,
  name           text not null,
  display_name   text not null,
  frequency      integer not null default 1,
  last_used_at   timestamptz default now(),
  default_category text,
  default_unit   text,
  default_quantity numeric,
  unique(user_id, name)
);
alter table public.item_catalog enable row level security;
create policy "Utente gestisce il suo catalogo"
  on public.item_catalog for all using (user_id = auth.uid());

-- INDICI ESSENZIALI
create index idx_items_list_id on public.items(list_id);
create index idx_items_status on public.items(status);
create index idx_items_deleted_at on public.items(deleted_at);
create index idx_lists_owner_id on public.lists(owner_id);
create index idx_item_catalog_user on public.item_catalog(user_id);
```

---

## 5. Sprint Plan

> **Convenzione prompt Claude Code:** All'inizio di ogni nuova conversazione dedicata, incolla il blocco "Contesto per Claude Code" della sezione corrispondente + il testo del task. Specifica sempre i file da creare/modificare.

---

### Sprint 0 — Setup Infrastruttura

**Durata stimata:** 1 settimana  
**Obiettivo:** Ambiente funzionante, app deployata su Vercel, auth configurata, PWA installabile.

**Criterio di completamento:** App vuota in produzione su Vercel, Supabase connesso, test "Hello World" verde, installabile come PWA.

#### Tasks

| ID | Task | Dettaglio | Dipendenze |
|----|------|-----------|------------|
| S0-01 | Setup progetto Vite + React + TypeScript | `npm create vite@latest shoppinglist -- --template react-ts` | — |
| S0-02 | Configurazione Tailwind CSS | Installa `tailwindcss postcss autoprefixer`, configura `tailwind.config.js` | S0-01 |
| S0-03 | Setup Supabase progetto | Crea progetto su supabase.com, esegui DDL sezione 4.2, configura variabili d'ambiente | S0-01 |
| S0-04 | Crea `src/lib/supabase.ts` | Client Supabase con `createClient(url, key)` | S0-03 |
| S0-05 | Setup Dexie.js | Installa `dexie dexie-react-hooks`, crea `src/db/database.ts` con schema sezione 4.1 | S0-01 |
| S0-06 | Setup vite-plugin-pwa | Installa `vite-plugin-pwa`, configura manifest con `name`, `icons`, `display: standalone` | S0-01 |
| S0-07 | Setup Vitest + Testing Library | Installa `vitest @testing-library/react @testing-library/user-event jsdom` | S0-01 |
| S0-08 | Struttura directory | Crea tutte le cartelle in `src/` come da sezione 2.2 | S0-01 |
| S0-09 | TypeScript types | Crea `src/types/index.ts` con tutti i tipi sezione 4.1 | S0-01 |
| S0-10 | Costanti e Enums | Crea `src/constants/index.ts` con `CATEGORIES`, `UNITS`, `PERMISSIONS` | S0-01 |
| S0-11 | Setup Zustand | Installa `zustand`, crea store scheletro `useAuthStore.ts`, `useListStore.ts`, `useUIStore.ts` | S0-01 |
| S0-12 | Routing base | Installa `react-router-dom`, crea `App.tsx` con `BrowserRouter` e route placeholder | S0-01 |
| S0-13 | Deploy pipeline Vercel | Collega repo GitHub a Vercel, imposta env vars, verifica deploy automatico | S0-03 |

#### Contesto per Claude Code (Sprint 0)

```
PROGETTO: ShoppingList MVP — PWA offline-first per liste della spesa
STACK: React 18 + TypeScript + Vite + Dexie.js (IndexedDB) + Supabase + Zustand + Tailwind CSS

PRINCIPIO CORE: Il database locale Dexie.js è la source of truth. 
Ogni operazione scrive prima localmente, poi sincronizza in background.

STRUTTURA DIRECTORY (da creare in src/):
  components/common, components/lists, components/items, components/auth,
  components/sync, components/sharing | pages | services | stores | 
  db/repositories | lib | hooks | types | constants

FILE CHIAVE DA CREARE:
- src/types/index.ts       → tutti i TypeScript types
- src/db/database.ts       → schema Dexie.js
- src/lib/supabase.ts      → client Supabase
- src/stores/useAuthStore.ts, useListStore.ts, useUIStore.ts
- vite.config.ts           → con vite-plugin-pwa configurato
```

---

### Sprint 1 — Core Offline: Liste e Articoli

**Durata stimata:** 1.5 settimane  
**Obiettivo:** CRUD completo di liste e articoli offline-first, senza autenticazione (modalità guest).

**Criterio di completamento:** L'app funziona completamente offline: creare/modificare/eliminare liste e articoli, spuntare articoli, cestino. Nessuna chiamata di rete richiesta.

#### Tasks

| ID | Task | Dettaglio | Dipendenze |
|----|------|-----------|------------|
| S1-01 | `listRepository.ts` | CRUD Dexie.js per tabella `lists`: `create`, `getAll`, `getById`, `update`, `softDelete`, `archive` | S0-05 |
| S1-02 | `listService.ts` | Business logic: validazione nome, creazione con UUID, gestione sortOrder | S1-01 |
| S1-03 | `useListStore.ts` (completo) | Zustand store: stato `lists[]`, azioni `addList`, `updateList`, `deleteList`, sync con Dexie via `useLiveQuery` | S1-02 |
| S1-04 | `HomePage` | Lista delle liste con `ListCard`, pulsante "Nuova Lista", filtri attive/archiviate | S1-03 |
| S1-05 | `ListCard` component | Card con nome, contatori (totale/completati), badge stato sync, azioni contestuali | S1-03 |
| S1-06 | `ListFormModal` | Modal per creare/modificare lista (validazione nome obbligatorio, max 100 chars) | S1-03 |
| S1-07 | `itemRepository.ts` | CRUD Dexie.js: `create`, `getByListId`, `update`, `toggleStatus`, `softDelete`, `restore`, `getTrash` | S0-05 |
| S1-08 | `itemService.ts` | Business logic: validazione, sanitizzazione note (XSS), gestione sortOrder float | S1-07 |
| S1-09 | `ListPage` | Pagina lista con header, lista articoli, FAB "Aggiungi", sezione completati collassabile | S1-03, S1-08 |
| S1-10 | `ItemRow` component | Riga articolo: checkbox toggle, nome, quantità+unità, categoria badge, menu azioni | S1-08 |
| S1-11 | `ItemFormModal` | Form completo: nome, quantità, unità (select), categoria (select), note | S1-08 |
| S1-12 | `TrashPage` | Vista cestino: articoli eliminati con timestamp, pulsanti ripristina/elimina definitivo | S1-07 |
| S1-13 | Change Tracking | Funzione `recordChange(op, entity, id, before, after)` che scrive in `changeLog` Dexie dopo ogni operazione CRUD | S1-01, S1-07 |
| S1-14 | Componenti comuni | `Button`, `Modal`, `Toast`, `Input`, `Select`, `Spinner`, `ConfirmDialog` | S0-02 |
| S1-15 | Test unitari Sprint 1 | Vitest per `listService` e `itemService` (validazioni, edge cases) | S1-02, S1-08 |

#### Business Rules critiche

- **Nome lista:** obbligatorio, max 100 chars, trim automatico
- **Nome articolo:** obbligatorio, max 200 chars
- **Quantità:** se presente, deve essere > 0 (numero decimale)
- **Note:** sanitizzate (escape HTML) per prevenire XSS
- **Toggle stato:** `pending` ↔ `completed`, aggiorna `completedAt`
- **Soft delete articoli:** imposta `deletedAt = Date.now()`, non elimina fisicamente
- **Svuotamento cestino automatico:** articoli con `deletedAt` > 30 giorni

#### Contesto per Claude Code (Sprint 1)

```
PROGETTO: ShoppingList MVP
OBIETTIVO SPRINT: CRUD liste e articoli completamente offline con Dexie.js

SCHEMA DEXIE (già definito in src/db/database.ts):
  - Tabella 'lists': campi in types/index.ts → interfaccia List
  - Tabella 'items': campi in types/index.ts → interfaccia Item
  - Tabella 'changeLog': traccia ogni operazione CRUD

PATTERN DA SEGUIRE:
1. Repository (db/repositories/) → accesso diretto Dexie, nessuna logica business
2. Service (services/) → logica business + chiama repository + chiama recordChange()
3. Store (stores/) → stato React, chiama service, espone via useLiveQuery
4. Component → legge da store/useLiveQuery, chiama store actions

REGOLA CRITICA: Ogni operazione CRUD DEVE chiamare recordChange() dopo la modifica locale.
Questo popola il changeLog per la futura sincronizzazione.

OPTIMISTIC UI: Le modifiche devono apparire immediatamente nell'UI (IndexedDB è sincrono abbastanza).
Non aspettare conferma server.
```

---

### Sprint 2 — Autenticazione e Modalità Guest

**Durata stimata:** 1 settimana  
**Obiettivo:** Login/registrazione email, OAuth Google, modalità guest con migrazione trasparente a utente registrato.

**Criterio di completamento:** Un nuovo utente può usare l'app come guest, poi registrarsi e trovare tutti i suoi dati migrati al suo account.

#### Tasks

| ID | Task | Dettaglio | Dipendenze |
|----|------|-----------|------------|
| S2-01 | `authService.ts` | Wrapping Supabase Auth: `register`, `login`, `loginWithGoogle`, `logout`, `getCurrentUser`, `onAuthStateChange` | S0-04 |
| S2-02 | `useAuthStore.ts` (completo) | Zustand: `user`, `isGuest`, `isLoading`, azioni auth, init da `onAuthStateChange` | S2-01 |
| S2-03 | `LoginPage` | Form email+password, link "Registrati", link "Recupera password", bottone "Continua senza account" | S2-02 |
| S2-04 | `RegisterPage` | Form email+password (min 8 chars, validazione robustezza), conferma password | S2-02 |
| S2-05 | Modalità Guest | Flag `isGuest=true` in `useAuthStore`, genera UUID locale anonimo, disabilita funzionalità cloud | S2-02 |
| S2-06 | `GuestBanner` | Banner persistente "Stai usando la modalità ospite — Registrati per sincronizzare" | S2-05 |
| S2-07 | Migrazione Guest→Registrato | Al login dopo sessione guest: associa tutte le liste locali (`ownerId = guestId`) al nuovo `userId`, aggiorna IndexedDB | S2-02 |
| S2-08 | Route protette | HOC o wrapper `<ProtectedRoute>` che redirige a `/login` se non autenticato (eccetto guest) | S2-02 |
| S2-09 | `ProfilePage` | Visualizzazione profilo, cambio display name, logout, lista dispositivi (placeholder) | S2-02 |
| S2-10 | Reset password | Pagina con link "Password dimenticata" → email → pagina reset con nuovo password | S2-01 |
| S2-11 | Test autenticazione | Vitest: validazioni form, logica migrazione guest | S2-07 |

#### Logica Migrazione Guest

```typescript
// Quando un utente guest si registra/fa login:
async function migrateGuestData(guestId: string, newUserId: string) {
  // 1. Prendi tutte le liste con ownerId = guestId da IndexedDB
  const guestLists = await db.lists.where('ownerId').equals(guestId).toArray()
  
  // 2. Per ogni lista, aggiorna ownerId e segna hasLocalChanges = true
  for (const list of guestLists) {
    await db.lists.update(list.id, { ownerId: newUserId, hasLocalChanges: true })
  }
  
  // 3. Fai lo stesso per gli items
  const guestItems = await db.items.where('createdBy').equals(guestId).toArray()
  for (const item of guestItems) {
    await db.items.update(item.id, { createdBy: newUserId, updatedBy: newUserId, hasLocalChanges: true })
  }
  
  // 4. Il Sync Layer provvederà a uploadare tutto al primo sync
}
```

#### Contesto per Claude Code (Sprint 2)

```
PROGETTO: ShoppingList MVP
OBIETTIVO SPRINT: Autenticazione Supabase + modalità guest con migrazione

SUPABASE AUTH:
- Provider: email/password + Google OAuth
- Token: JWT gestito automaticamente da @supabase/supabase-js
- onAuthStateChange: listener per aggiornare useAuthStore al cambio sessione

MODALITÀ GUEST:
- isGuest = true quando utente non autenticato usa l'app
- UUID locale anonimo come userId guest (salvato in localStorage)
- Tutte le funzionalità offline disponibili, nessuna sync
- GuestBanner sempre visibile

MIGRAZIONE GUEST→REGISTRATO:
- Al primo login/register dopo sessione guest
- Tutti i dati IndexedDB (lists, items) vengono riassegnati al nuovo userId
- hasLocalChanges = true per triggerare upload al primo sync
- Funzione: migrateGuestData(guestId, newUserId)

ROUTE PROTECTION:
- Guest può accedere a tutte le route locali
- Route cloud-only (/invite, /sync-settings) richiedono auth reale
```

---

### Sprint 3 — Sincronizzazione Base

**Durata stimata:** 1.5 settimane  
**Obiettivo:** Sincronizzazione bidirezionale tra IndexedDB locale e Supabase, con indicatori di stato.

**Criterio di completamento:** Aprire l'app su due dispositivi diversi con lo stesso account mostra gli stessi dati. Le modifiche propagano entro pochi secondi con rete attiva. Offline funziona perfettamente.

#### Tasks

| ID | Task | Dettaglio | Dipendenze |
|----|------|-----------|------------|
| S3-01 | `syncService.ts` — Upload | Legge `changeLog` dove `synced = false`, invia operazioni a Supabase in batch (upsert), marca `synced = true` | S1-13 |
| S3-02 | `syncService.ts` — Download | Interroga Supabase per entità aggiornate dopo `lastSyncTimestamp`, applica a IndexedDB locale | S3-01 |
| S3-03 | `syncService.ts` — Orchestration | `sync()`: sequenza upload → download → update `userSyncMeta.lastSyncTimestamp` | S3-01, S3-02 |
| S3-04 | Sync trigger automatico | `useSyncManager` hook: trigger sync su `window.online`, ogni 30s se online, su ritorno app in foreground | S3-03 |
| S3-05 | `conflictService.ts` — Base | Last-write-wins: se `remote.updatedAt > local.updatedAt`, il remote vince. Salva versione persa in `changeLog.conflictResolution` | S3-02 |
| S3-06 | Realtime Supabase | Subscribe a `supabase.channel()` per INSERT/UPDATE/DELETE su `lists` e `items`. Applica delta a IndexedDB | S3-03 |
| S3-07 | `SyncStatusBadge` | Indicatore: `synced` (✓ verde), `syncing` (spinner), `local-changes` (● arancione), `error` (✕ rosso), `offline` (nuvola grigia) | S3-04 |
| S3-08 | `useNetworkStatus` hook | Rileva `online`/`offline` via `navigator.onLine` + eventi `window.online/offline` | — |
| S3-09 | Retry con backoff | Se sync fallisce: retry con exponential backoff (1s, 2s, 4s, max 3 tentativi), poi stato `error` | S3-03 |
| S3-10 | Sync primo avvio | All'autenticazione, upload dell'intero stato locale se `lastSyncTimestamp = 0` | S3-01 |
| S3-11 | Test sync | Vitest: unit test upload/download logic. Test manuale: modifica su device A, verifica su device B | S3-03 |

#### Delta Sync Protocol

```
UPLOAD:
1. Leggi changeLog WHERE synced = false ORDER BY timestamp ASC
2. Raggruppa per entityType e entityId (prendi solo ultimo stato per ogni entità)
3. Upsert su Supabase (INSERT ... ON CONFLICT DO UPDATE)
4. Marca changeLog records come synced = true
5. Aggiorna lastSyncTimestamp

DOWNLOAD:
1. Leggi userSyncMeta.lastSyncTimestamp
2. Query Supabase: SELECT * FROM lists WHERE updated_at > lastSyncTimestamp AND (owner_id = userId OR shared_with @> [{userId}])
3. Query Supabase: SELECT * FROM items WHERE list_id IN (listIds from step 2)
4. Per ogni record remoto: se non esiste localmente → INSERT. Se esiste → applica conflictService.resolve()
5. Salva nuovo lastSyncTimestamp = now()
```

#### Contesto per Claude Code (Sprint 3)

```
PROGETTO: ShoppingList MVP
OBIETTIVO SPRINT: Sincronizzazione bidirezionale Dexie.js ↔ Supabase

SCHEMA SUPABASE: già creato (vedere sezione 4.2 del piano)
CHANGE LOG: tabella Dexie 'changeLog' popolata da ogni operazione CRUD

DELTA SYNC PROTOCOL:
- Upload: changeLog records con synced=false → upsert Supabase → marca synced=true
- Download: Supabase WHERE updated_at > lastSyncTimestamp → applica a Dexie
- Conflict (base): last-write-wins (updatedAt più recente vince)
- Retry: exponential backoff su errori rete

REALTIME:
- supabase.channel('db-changes').on('postgres_changes', ...).subscribe()
- Applica delta ricevuti a IndexedDB senza triggering nuovo sync

SYNC TRIGGERS:
- window 'online' event
- ogni 30 secondi se online
- visibilitychange (app torna in foreground)
- dopo ogni operazione CRUD locale (debounced 2s)

INDICATORI STATO:
- hasLocalChanges: boolean su ogni List/Item in Dexie
- SyncStatusBadge legge da useNetworkStatus + pending changeLog count
```

---

### Sprint 4 — Condivisione e Permessi

**Durata stimata:** 1 settimana  
**Obiettivo:** Owner può condividere lista via link. Editor può modificare. Viewer può solo leggere.

**Criterio di completamento:** Flusso completo invito: generazione link → accettazione → permessi enforced client-side e server-side (RLS Supabase).

#### Tasks

| ID | Task | Dettaglio | Dipendenze |
|----|------|-----------|------------|
| S4-01 | `permissionService.ts` | `canEdit(list, userId)`, `canDelete(list, userId)`, `canShare(list, userId)`, `getUserPermission(list, userId)` | S0-09 |
| S4-02 | Enforcement lato client | In ogni componente UI: disabilita pulsanti in base a `permissionService`. Esempio: pulsante "Elimina Lista" visibile solo se OWNER | S4-01 |
| S4-03 | `sharingService.ts` | `generateInviteToken(listId, permission)` → inserisce in `invite_tokens` Supabase, ritorna URL | Sprint 3 |
| S4-04 | `ShareModal` | Modal: mostra link invito, pulsante copia, selezione permesso (EDITOR/VIEWER), scadenza 7gg | S4-03 |
| S4-05 | `InvitePage` | Route `/invite/:token` — mostra preview lista, pulsante "Accetta Invito", redirect login se non autenticato | S4-03 |
| S4-06 | Accettazione invito | `acceptInvite(token)`: verifica token valido+non scaduto, aggiunge userId a `list.sharedWith`, invalida token | S4-05 |
| S4-07 | `MembersPanel` | Lista membri con permesso, pulsante revoca (solo Owner), pulsante modifica permesso | S4-03 |
| S4-08 | Revoca accesso | `revokeAccess(listId, userId)`: rimuove da `sharedWith`, sync immediato | S4-07 |
| S4-09 | Trasferimento ownership | `transferOwnership(listId, newOwnerId)`: modifica `ownerId`, vecchio owner diventa EDITOR | S4-01 |
| S4-10 | Verifica RLS | Test manuale: tentativo di modifica lista con permessi insufficienti → 403 da Supabase | S0-03 |
| S4-11 | Test permessi | Vitest: unit test `permissionService` con ogni combinazione OWNER/EDITOR/VIEWER | S4-01 |

#### Matrice Permessi

| Operazione | OWNER | EDITOR | VIEWER |
|------------|:-----:|:------:|:------:|
| Leggi lista e articoli | ✅ | ✅ | ✅ |
| Aggiungi/modifica articoli | ✅ | ✅ | ❌ |
| Completa articoli | ✅ | ✅ | ❌ |
| Modifica nome lista | ✅ | ✅ | ❌ |
| Elimina lista | ✅ | ❌ | ❌ |
| Invita utenti | ✅ | ❌ | ❌ |
| Revoca accessi | ✅ | ❌ | ❌ |
| Trasferisci ownership | ✅ | ❌ | ❌ |

#### Contesto per Claude Code (Sprint 4)

```
PROGETTO: ShoppingList MVP
OBIETTIVO SPRINT: Sistema inviti e permessi granulari OWNER/EDITOR/VIEWER

MODELLO DATI:
- list.sharedWith: SharedMember[] = { userId, permission, invitedAt, invitedBy }[]
- invite_tokens (Supabase): token, listId, permission, expiresAt, usedBy, usedAt

FLUSSO INVITO:
1. Owner clicca "Condividi" → ShareModal
2. Seleziona permesso → sharingService.generateInviteToken() → URL copiato
3. Invitato apre URL /invite/:token → InvitePage mostra preview lista
4. Se non autenticato → redirect /login?returnTo=/invite/:token
5. Clic "Accetta" → acceptInvite(token) → aggiunge a list.sharedWith → sync
6. Token marcato usato (used_at = now())

ENFORCEMENT:
- Client: permissionService.canEdit(list, userId) disabilita elementi UI
- Server: RLS Supabase (già configurato nel DDL) blocca operazioni non autorizzate
- Non fidarsi MAI del client → il server è l'arbiter finale

REVOCA:
- Immediata su Supabase
- Supabase Realtime notifica il device dell'utente revocato
- L'utente revocato perde accesso al prossimo sync
```

---

### Sprint 5 — Autocompletamento e Refinement

**Durata stimata:** 1 settimana  
**Obiettivo:** Autocompletamento intelligente, gestione conflitti base, accessibilità, performance.

**Criterio di completamento:** Lighthouse score > 90. Zero violazioni axe-core. Autocompletamento funzionante con ordinamento corretto. MVP stabile e pronto per beta.

#### Tasks

| ID | Task | Dettaglio | Dipendenze |
|----|------|-----------|------------|
| S5-01 | `catalogService.ts` | `getSuggestions(query, userId)`: match parziale case-insensitive, ordinamento freq+recency+alphabetico, max 10 risultati | S0-05 |
| S5-02 | `updateCatalog(itemName, metadata)` | Dopo ogni aggiunta articolo: upsert in `itemCatalog` (increment frequency, update lastUsedAt) | S5-01 |
| S5-03 | `ItemCatalogInput` component | Input con dropdown suggerimenti, pre-fill categoria/unità/quantità se riconosciuto, keyboard navigable | S5-01 |
| S5-04 | Sync catalogo | Upload `itemCatalog` locale a Supabase; download catalogo di collaboratori su lista condivisa (merge per frequenza) | S5-01 |
| S5-05 | `ConflictBanner` | Se rileva conflitti in `changeLog`: mostra banner non invasivo "X modifiche in conflitto — Visualizza" | Sprint 3 |
| S5-06 | Gestione conflitti auto | `conflictService.autoResolve()`: campi diversi → merge automatico. Stesso campo → last-write-wins + log | Sprint 3 |
| S5-07 | Accessibilità WCAG 2.1 AA | Audit con axe-core: focus management, aria-labels, contrasto colori, keyboard navigation | Sprint 4 |
| S5-08 | Performance | Virtualizzazione liste con `@tanstack/react-virtual` per liste > 50 articoli. Debounce search 300ms. | Sprint 4 |
| S5-09 | Pulizia cestino automatica | Job su apertura app: `db.items.where('deletedAt').below(now - 30days).delete()` | Sprint 1 |
| S5-10 | Service Worker avanzato | Workbox: `StaleWhileRevalidate` per asset, `NetworkFirst` per API Supabase con fallback cache | Sprint 0 |
| S5-11 | E2E tests Playwright | Flussi critici: onboarding guest, aggiunta articoli, condivisione lista, sync base | Sprint 4 |
| S5-12 | QA finale | Bug fix, revisione UX, verifica su mobile Chrome/Safari/Firefox | Sprint 4 |

#### Logica Autocompletamento

```typescript
async function getSuggestions(query: string, userId: string): Promise<ItemCatalog[]> {
  if (query.trim().length < 1) return []
  
  const normalized = query.toLowerCase().trim()
  
  // Match parziale in IndexedDB (Dexie)
  const matches = await db.itemCatalog
    .where('userId').equals(userId)
    .filter(item => item.name.includes(normalized))
    .toArray()
  
  // Ordinamento: 1) frequenza DESC, 2) lastUsedAt DESC, 3) nome ASC
  return matches
    .sort((a, b) => {
      if (b.frequency !== a.frequency) return b.frequency - a.frequency
      if (b.lastUsedAt !== a.lastUsedAt) return b.lastUsedAt - a.lastUsedAt
      return a.displayName.localeCompare(b.displayName)
    })
    .slice(0, 10)
}
```

#### Contesto per Claude Code (Sprint 5)

```
PROGETTO: ShoppingList MVP
OBIETTIVO SPRINT: Autocompletamento intelligente, accessibilità, performance, stabilità

CATALOGO ARTICOLI:
- Tabella Dexie 'itemCatalog': name (lowercase), displayName, frequency, lastUsedAt, defaultCategory, defaultUnit
- Aggiornamento automatico dopo ogni addItem()
- Sync con collaboratori: merge per somma frequency, max lastUsedAt

AUTOCOMPLETAMENTO UI:
- Input per il nome articolo con dropdown sotto
- Match parziale case-insensitive su 'name' (lowercase)
- Keyboard: ArrowUp/Down per navigare, Enter per selezionare, Esc per chiudere
- ARIA: role="combobox", aria-autocomplete="list", aria-expanded, aria-activedescendant

ACCESSIBILITÀ (WCAG 2.1 AA):
- Tutti gli elementi interattivi focusabili via tastiera
- Contrasto testo ≥ 4.5:1 (normale), ≥ 3:1 (grande)
- Focus visible sempre (no outline: none senza alternativa)
- aria-label su icone, aria-live per messaggi di stato
- Nessuna dipendenza solo dal colore per comunicare informazione

PERFORMANCE:
- Liste > 50 articoli: virtualizzazione con @tanstack/react-virtual
- Search input: debounce 300ms prima di query Dexie
- Componenti pesanti: React.lazy() + Suspense
```

---

## 6. Definition of Done

Uno sprint è completato quando **tutte** le seguenti condizioni sono soddisfatte:

1. ✅ Tutti i task del sprint implementati
2. ✅ `npm run typecheck` → zero errori TypeScript
3. ✅ `npm run lint` → zero errori ESLint
4. ✅ `npm run test` → tutti i test passano, coverage ≥ 70%
5. ✅ `npm run build` → build produzione senza errori
6. ✅ Deploy Vercel preview URL funzionante
7. ✅ Verifica manuale flussi principali dello sprint
8. ✅ Zero regressioni sugli sprint precedenti

**Definition of Done — MVP Completo:**
- Lighthouse PWA score ≥ 90 (Performance, Accessibility, Best Practices, SEO)
- Zero violazioni axe-core (accessibilità)
- Funzionamento offline verificato (DevTools → Network → Offline)
- Sync funzionante su due browser diversi
- RLS Supabase verificato (tentativo operazione senza permessi → 403)

---

## 7. Architettura dei Componenti React

### 7.1 Gerarchia Componenti

```
App
├── AuthGuard (redirect se non autenticato e route protetta)
├── Pages
│   ├── LoginPage          → LoginForm, OAuthButtons
│   ├── RegisterPage       → RegisterForm
│   ├── HomePage           → ListCard[], FAB "Nuova Lista", GuestBanner, SyncStatusBadge
│   ├── ListPage           → ListHeader, ItemRow[], ItemFormModal, FAB "Aggiungi"
│   ├── TrashPage          → ItemRow[] (eliminati), pulsanti ripristina
│   ├── InvitePage         → ListPreview, AcceptInviteButton
│   └── ProfilePage        → UserInfo, LogoutButton
└── Common
    ├── Toast (posizione fixed bottom)
    └── ConfirmDialog (overlay modale)
```

### 7.2 Componenti Chiave

#### `ListCard`
```typescript
interface ListCardProps {
  list: List
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void  // visibile solo se OWNER
  onArchive: (id: string) => void
}
```

#### `ItemRow`
```typescript
interface ItemRowProps {
  item: Item
  canEdit: boolean             // da permissionService
  onToggle: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}
```

#### `SyncStatusBadge`
```typescript
type SyncState = 'synced' | 'syncing' | 'local-changes' | 'error' | 'offline'
interface SyncStatusBadgeProps {
  listId?: string   // se undefined, mostra stato globale
}
```

---

## 8. Business Logic Layer (Services e Hooks)

### 8.1 Convenzioni Service

```typescript
// Ogni service è un oggetto con metodi puri o quasi-puri
// Dipendenze iniettate, mai import globali di stato React

export const listService = {
  validate: (data: Partial<List>): ValidationResult => { ... },
  create: async (name: string, userId: string): Promise<List> => { ... },
  update: async (id: string, changes: Partial<List>, userId: string): Promise<List> => { ... },
  delete: async (id: string, userId: string): Promise<void> => { ... },
  archive: async (id: string): Promise<void> => { ... },
}
```

### 8.2 Custom Hooks Principali

| Hook | Responsabilità |
|------|----------------|
| `useLists()` | `useLiveQuery` su `db.lists`, ritorna liste ordinate con contatori |
| `useList(id)` | `useLiveQuery` su singola lista |
| `useItems(listId)` | `useLiveQuery` su `db.items` WHERE `listId AND deletedAt IS NULL` |
| `useSyncManager()` | Gestisce ciclo di vita sync, espone `syncNow()`, `syncState` |
| `useNetworkStatus()` | `navigator.onLine` + eventi, ritorna `isOnline: boolean` |
| `usePermissions(list)` | Wrappa `permissionService` con utente corrente da `useAuthStore` |
| `useCatalogSuggestions(query)` | Debounced query su `catalogService.getSuggestions` |

---

## 9. Gestione Stato (Zustand)

### 9.1 `useAuthStore`

```typescript
interface AuthState {
  user: User | null
  isGuest: boolean
  isLoading: boolean
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  initAuth: () => void           // chiama onAuthStateChange di Supabase
}
```

### 9.2 `useListStore`

```typescript
interface ListState {
  selectedListId: string | null
  // Actions (chiamano listService internamente)
  setSelectedList: (id: string | null) => void
  createList: (name: string) => Promise<void>
  updateList: (id: string, changes: Partial<List>) => Promise<void>
  deleteList: (id: string) => Promise<void>
  archiveList: (id: string) => Promise<void>
}
// Nota: le liste stesse vengono lette da useLiveQuery, non dallo store
```

### 9.3 `useUIStore`

```typescript
interface UIState {
  toasts: Toast[]
  activeModal: ModalType | null
  isSidebarOpen: boolean
  // Actions
  showToast: (message: string, type: 'success'|'error'|'info') => void
  dismissToast: (id: string) => void
  openModal: (type: ModalType, data?: unknown) => void
  closeModal: () => void
}
```

---

## 10. Routing

```typescript
// src/App.tsx — React Router 6
const router = createBrowserRouter([
  { path: '/login',           element: <LoginPage /> },
  { path: '/register',        element: <RegisterPage /> },
  { path: '/invite/:token',   element: <ProtectedRoute requireAuth><InvitePage /></ProtectedRoute> },
  {
    element: <AppLayout />,   // Layout con header/nav/toast
    children: [
      { path: '/',            element: <HomePage /> },
      { path: '/list/:id',    element: <ListPage /> },
      { path: '/trash',       element: <TrashPage /> },
      { path: '/profile',     element: <ProtectedRoute requireAuth><ProfilePage /></ProtectedRoute> },
    ]
  },
  { path: '*',                element: <Navigate to="/" /> }
])
```

**`ProtectedRoute`:** se `requireAuth=true` e utente è guest → redirect a `/login?returnTo=currentPath`.

---

## 11. PWA e Service Worker

### 11.1 Configurazione vite-plugin-pwa

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 50, maxAgeSeconds: 300 }
            }
          }
        ]
      },
      manifest: {
        name: 'ShoppingList',
        short_name: 'ShoppingList',
        description: 'Liste della spesa collaborative offline-first',
        theme_color: '#22c55e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ]
})
```

---

## 12. Testing Strategy

### 12.1 Unit Tests (Vitest)

**Target: copertura > 70% su services**

```
src/services/__tests__/
├── listService.test.ts        → validazione, creazione, edge cases nome
├── itemService.test.ts        → validazione, sanitizzazione XSS, toggle status
├── permissionService.test.ts  → tutte le combinazioni OWNER/EDITOR/VIEWER
├── conflictService.test.ts    → last-write-wins, merge campi diversi
└── catalogService.test.ts     → getSuggestions ordinamento, edge cases
```

### 12.2 Integration Tests (Vitest + Testing Library)

```
src/__tests__/integration/
├── offlineFlow.test.ts        → CRUD completo senza rete
├── syncFlow.test.ts           → upload changeLog, download delta
└── authFlow.test.ts           → login, guest→registrato, migrazione dati
```

### 12.3 E2E Tests (Playwright)

```
e2e/
├── onboarding.spec.ts         → nuovo utente guest → aggiunge articoli
├── sharing.spec.ts            → crea lista → invita → accetta → modifica come editor
├── offline.spec.ts            → modifica offline → riconnessione → sync
└── permissions.spec.ts        → viewer non riesce a modificare
```

### 12.4 Scenari Critici da Testare Manualmente

1. **Scenario offline/online:** Modifica lista offline, chiudi app, riapri, riconnettiti → i dati si sincronizzano
2. **Invito con scadenza:** Token scaduto non può essere accettato
3. **Revoca in tempo reale:** Owner revoca Editor mentre Editor ha la lista aperta → aggiornamento immediato
4. **Migrazione guest:** Registrazione dopo uso guest → tutte le liste migrate correttamente
5. **Conflitto basic:** Stessa lista su due tab → modifica su entrambi → sync → last-write-wins applicato

---

## 13. Convenzioni di Sviluppo

### 13.1 Nomenclatura

```typescript
// Components: PascalCase
ItemRow, ListCard, ShareModal

// Hooks: camelCase con prefisso 'use'
useListStore, useSyncManager, usePermissions

// Services: camelCase con suffisso 'Service'
listService, syncService, conflictService

// Repositories: camelCase con suffisso 'Repository'
listRepository, itemRepository

// Types/Interfaces: PascalCase
List, Item, SharedMember, ChangeLog

// Constants/Enums: SCREAMING_SNAKE_CASE per valori
ITEM_STATUS.PENDING, PERMISSIONS.OWNER
```

### 13.2 Error Handling

```typescript
// Mai silent failures — sempre catch esplicito
try {
  await listService.create(name, userId)
  useUIStore.getState().showToast('Lista creata', 'success')
} catch (error) {
  console.error('[listService.create]', error)
  useUIStore.getState().showToast('Impossibile creare la lista. Riprova.', 'error')
}
```

### 13.3 Commit Convention

```
feat(lists): aggiunge CRUD liste con soft delete
fix(sync): corregge race condition su upload changeLog
test(permissions): aggiunge test per revoca accesso viewer
chore(deps): aggiorna dexie a 3.2.4
```

### 13.4 Comandi npm

```bash
npm run dev         # avvia server sviluppo
npm run build       # build produzione
npm run preview     # preview build locale
npm run test        # test in watch mode
npm run test:ci     # test in CI (no watch)
npm run test:e2e    # Playwright E2E
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
```

---

## 14. Contesto per Nuove Conversazioni Claude Code

> **Istruzioni:** Copia questo blocco all'inizio di ogni nuova conversazione dedicata a un singolo task o sprint, poi aggiungi la richiesta specifica.

```
===== CONTESTO PROGETTO SHOPPINGLIST =====

NOME PROGETTO: ShoppingList MVP
TIPO: PWA offline-first per liste della spesa collaborative
METODOLOGIA: Spec-Driven Development

STACK TECNOLOGICO:
- Frontend: React 18 + TypeScript (strict mode)
- Build tool: Vite 5
- Styling: Tailwind CSS 3
- State management: Zustand 4
- Database locale: Dexie.js 3 (IndexedDB)
- Backend/Auth/Realtime: Supabase (PostgreSQL + Auth + Realtime)
- PWA: vite-plugin-pwa + Workbox
- Testing: Vitest + Testing Library + Playwright

PRINCIPIO ARCHITETTURALE FONDAMENTALE:
Il database locale Dexie.js è la SOURCE OF TRUTH primaria.
Ogni operazione scrive PRIMA localmente, poi sincronizza in background.
L'app deve funzionare completamente offline.

LAYER ARCHITETTURALI (rispetta sempre questa separazione):
1. UI (components/, pages/) → solo rendering e eventi, ZERO business logic
2. Business Logic (services/) → validazione, orchestrazione, funzioni pure
3. Persistence (db/repositories/) → accesso Dexie.js
4. Sync (services/syncService.ts) → comunicazione Supabase, background

PATTERN OBBLIGATORI:
- Optimistic UI: mostra modifiche immediatamente, non aspettare server
- Change tracking: ogni CRUD scrive in db.changeLog (synced: false)
- Permessi: validare sempre con permissionService (OWNER > EDITOR > VIEWER)
- Error handling: mai silent failures, sempre showToast su errore
- TypeScript strict: niente 'any', interfacce esplicite

FILE STRUTTURA PRINCIPALE:
src/types/index.ts         → tutti i TypeScript types
src/db/database.ts         → schema Dexie.js
src/lib/supabase.ts        → client Supabase
src/services/*.ts          → business logic
src/db/repositories/*.ts   → accesso database locale
src/stores/*.ts            → Zustand stores
src/components/            → componenti React
src/pages/                 → pagine React
src/hooks/                 → custom hooks

TIPI CHIAVE:
- List: { id, name, status, ownerId, sharedWith: SharedMember[], hasLocalChanges, ... }
- Item: { id, listId, name, quantity, unit, notes, category, status, deletedAt, hasLocalChanges, ... }
- ChangeLog: { id, operationType, entityType, entityId, changes, timestamp, synced }
- Permission: 'OWNER' | 'EDITOR' | 'VIEWER'
- ItemStatus: 'pending' | 'completed'

CONVENZIONI:
- Components: PascalCase | Hooks: useXxx | Services: xxxService | Enums: SCREAMING_SNAKE
- Commit: feat/fix/test/chore(scope): descrizione
- Test: ogni service ha test unitari in services/__tests__/

=============================================
```

---

*Fine documento — ShoppingList MVP Development Plan v1.0.0*  
*Generato con Claude (Anthropic) — Spec-Driven Development — Marzo 2026*
