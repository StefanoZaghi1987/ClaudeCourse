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

> ⚠️ **DEPRECATA — Aggiornamento brainstorming 2026-04-13**
> La struttura layer-sliced descritta sotto è **superata** dalla struttura **feature-sliced** definita in [`.claude/architettura.md`](./architettura.md), che è ora la **canonical reference** per l'organizzazione di `src/`.
>
> **Conseguenze pratiche per gli sprint successivi:**
> - I path citati nei task S1-S5 (es. `services/listService.ts`, `db/repositories/listRepository.ts`) vanno **tradotti** ai path equivalenti nella struttura feature-sliced (es. `features/lists/logic.ts`, `features/lists/hooks/`, `services/db/lists.ts`).
> - Tabella di traduzione di riferimento:
>
> | Vecchio path (deprecato) | Nuovo path canonical |
> |---|---|
> | `src/services/listService.ts` | `src/features/lists/logic.ts` (+ hooks in `features/lists/hooks/`) |
> | `src/services/itemService.ts` | `src/features/items/logic.ts` |
> | `src/services/authService.ts` | `src/features/auth/logic.ts` |
> | `src/services/syncService.ts` | `src/features/sync/logic.ts` |
> | `src/db/database.ts` | `src/services/db/schema.ts` |
> | `src/db/repositories/listRepository.ts` | `src/services/db/lists.ts` |
> | `src/db/repositories/itemRepository.ts` | `src/services/db/items.ts` |
> | `src/lib/supabase.ts` | `src/services/supabase/client.ts` |
> | `src/stores/useAuthStore.ts` | `src/store/authStore.ts` |
> | `src/pages/*` | distribuiti nelle `features/<nome>/components/` o sotto `components/layout/` |
>
> Il blocco originale qui sotto è mantenuto **solo per riferimento storico**.

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

> ℹ️ **Nota brainstorming 2026-04-13 — Supabase non disponibile**
> Finché il progetto Supabase non è disponibile, `.env.local` contiene **placeholder vuoti**. Il client Supabase viene comunque creato (in `src/services/supabase/client.ts`) ma è **guarded** tramite la funzione `isSupabaseConfigured()`, che ogni service futuro DEVE consultare prima di tentare chiamate di rete. Quando il progetto sarà disponibile, basterà popolare `.env.local` con le credenziali reali — nessun cambiamento di codice richiesto.

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

> ⚠️ **Aggiornamento Sprint 0 (2026-04-13)** — Schema implementato con **nomi tabelle e path aggiornati** rispetto al blocco storico sottostante:
>
> | Plan originale | Sprint 0 canonical |
> |---|---|
> | File `src/db/database.ts` | `src/services/db/schema.ts` |
> | Tabella `changeLog` | `changes` |
> | Tabella `itemCatalog` | `catalog` |
> | Tabella `userSyncMeta` | **rinviata** (sostituita da `invites` per sharing Sprint 4) |
>
> **Canonical:** `src/services/db/schema.ts` — schema `version(1)` bloccato. Cambi schema futuri = **nuovo `version(N).upgrade()`**, mai modificare `version(1)` in-place (corrompe i DB esistenti degli utenti).
>
> Il blocco TypeScript sotto è mantenuto **solo per riferimento storico**.

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

> ⚠️ **Avviso brainstorming 2026-04-13 — Path da tradurre**
> Tutti i path sorgente citati nei task degli sprint S1-S5 (es. `src/services/listService.ts`, `src/db/repositories/listRepository.ts`, `src/lib/supabase.ts`) seguono il vecchio layout layer-sliced di §2.2, ora **deprecato**. La struttura canonical è quella **feature-sliced** definita in [`.claude/architettura.md`](./architettura.md). Prima di eseguire un task, consultare la **tabella di traduzione** in §2.2 per mappare il path al suo equivalente nel nuovo layout.

---

### Sprint 0 — Setup Infrastruttura

**Durata stimata:** 1 settimana
**Obiettivo:** Ambiente funzionante, app servita in build production locale, client Supabase guarded, PWA installabile da Chrome locale.

**Stato:** ✅ **COMPLETATO 2026-04-13** — DoD 8/8 verdi, 5 test smoke passati (id:2, App:1, schema:1, supabase:1), `npm run build` clean con `sw.js` + `manifest.webmanifest`, `npm run preview` su `:4173` verificato, PWA installabile da Chrome (Lighthouse Installable ✅).

**Criterio di completamento (aggiornato 2026-04-13):**
1. App vuota servita via `npm run preview` locale (Vercel **non disponibile**)
2. Client Supabase importabile e *guarded* tramite `isSupabaseConfigured()` (Supabase **non disponibile**)
3. Suite Vitest con 4 file di test smoke verdi (id, App, schema, supabase)
4. App installabile come PWA da Chrome locale (manifest + 3 icone + SW attivo, Lighthouse PWA verde)

> 📋 **Brainstorming di riferimento:** [`docs/brainstorming/2026-04-13-sprint0-brainstorming-summary.md`](../docs/brainstorming/2026-04-13-sprint0-brainstorming-summary.md)
> **Spec tecnica:** [`docs/specs/Sprint0_Setup_Spec.md`](../docs/specs/Sprint0_Setup_Spec.md)
> **Piano implementazione:** [`docs/plans/Sprint0_Setup_Plan.md`](../docs/plans/Sprint0_Setup_Plan.md)

#### Tasks (aggiornati 2026-04-13)

| ID | Task | Dettaglio | Dipendenze | Stato |
|----|------|-----------|------------|-------|
| S0-01 | Setup progetto Vite + React + TypeScript | `npm create vite@latest . -- --template react-ts` (init in root `ShoppingList/`). Versioni pinnate manualmente post-init: React 18.3.1, Vite 5.4.21, TS 5.9.3 (template default installava React 19 / Vite 8 incompatibili con `vite-plugin-pwa@0.20`) | — | ✅ done |
| S0-02 | Configurazione Tailwind CSS | Installa `tailwindcss@^3.4 postcss autoprefixer`, configura `tailwind.config.js` (ESM) + `postcss.config.js` via `npx tailwindcss init -p` | S0-01 | ✅ done |
| S0-03 | ~~Setup Supabase progetto~~ | **DEFERITO**: Supabase non disponibile. Le credenziali reali e il DDL §4.2 si applicheranno quando il progetto sarà disponibile (target Sprint 2) | — | **deferito → Sprint 2** |
| S0-04 | Crea `src/services/supabase/client.ts` | Client Supabase guarded: `createClient` sempre invocato (placeholder se env mancanti) + export `isSupabaseConfigured()` che gli altri layer DEVONO consultare prima di chiamate di rete | S0-01 | ✅ done |
| S0-05 | Setup Dexie.js | Installa `dexie@^3 dexie-react-hooks@^1`, crea `src/services/db/schema.ts` con schema v1 (5 tabelle: `lists`, `items`, `changes`, `catalog`, `invites`; PK `&id` string per supportare UUID offline; indice composito `[listId+deletedAt]` su `items`; unique `&name` su `catalog`) | S0-01 | ✅ done |
| S0-06 | Setup vite-plugin-pwa | Installa `vite-plugin-pwa@^0.20 workbox-window`, configura manifest con `name`, `icons` (3 placeholder), `display: standalone`, `theme_color: '#10b981'` (Tailwind emerald-500), `registerType: 'autoUpdate'`, `devOptions.enabled: false` | S0-01 | ✅ done |
| S0-07 | Setup Vitest + Testing Library | Installa `vitest@^1 @testing-library/react@^14 @testing-library/user-event @testing-library/jest-dom jsdom fake-indexeddb`. Config integrata in `vite.config.ts` (sezione `test:` con `environment: 'jsdom'`, `setupFiles: './src/__tests__/setup.ts'`) | S0-01 | ✅ done |
| S0-08 | Struttura directory feature-sliced | Crea cartelle in `src/` secondo la struttura canonical di `architettura.md`: `components/{ui,layout,shared}/`, `features/{lists,items,auth,catalog,sync}/`, `services/{db,supabase}/`, `store/`, `hooks/`, `types/`, `utils/` (tutte con `.gitkeep` se vuote) | S0-01 | ✅ done |
| S0-09 | TypeScript types — minimi Sprint 0 | Crea `src/types/domain.ts` (`List`, `Item`, `ItemCatalog`, `Invite`, enum base) e `src/types/sync.ts` (`ChangeLog`, `SyncStatus`). **Esclusi deliberatamente**: `Category`, `UnitOfMeasure`, `SharedMember`, `UserSyncMeta` (espansione in Sprint 1) | S0-01 | ✅ done |
| S0-10 | ~~Costanti e Enums~~ | **DEFERITO a Sprint 1**: niente `CATEGORIES`/`UNITS`/`PERMISSIONS` in Sprint 0 (verranno introdotti col primo `ItemFormModal`) | — | **deferito → Sprint 1** |
| S0-11 | ~~Setup Zustand stores scheletro~~ | **DEFERITO a Sprint 1**: la cartella `src/store/` viene creata vuota con `.gitkeep`, ma nessuno store viene istanziato in Sprint 0 (profondità "medio" decisa nel brainstorming) | — | **deferito → Sprint 1** |
| S0-12 | Routing base + marker Sprint 0 | Installa `react-router-dom@^6`, crea `App.tsx` con `BrowserRouter` e una sola route `/` che renderizza `<h1 className="text-emerald-600">Sprint 0 OK</h1>` (marker verde valida anche pipeline Tailwind) | S0-01 | ✅ done |
| S0-13 | ~~Deploy pipeline Vercel~~ | **SOSTITUITO**: Vercel non disponibile. Equivalente locale: `npm run build` + `npm run preview` su `http://localhost:4173`. Verifica PWA manuale in Chrome (DevTools Application + Lighthouse PWA audit). Deploy reale rimandato a quando un provider sarà disponibile. | S0-06 | ✅ done (locale) |
| **S0-14** | **(NUOVO) Smoke test suite** | Crea 4 file di test in `src/__tests__/`: `id.test.ts` (2 test utility pura), `App.test.tsx` (1 test jsdom + RTL), `schema.test.ts` (1 test Dexie + `fake-indexeddb/auto`), `supabase.test.ts` (1 test guard). Plus `setup.ts` con `import '@testing-library/jest-dom/vitest'`. Totale: **5/5 test verdi** | S0-04, S0-05, S0-07, S0-12 | ✅ done |
| **S0-15** | **(NUOVO) Generazione icone PWA placeholder** | Genera `public/icons/pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png` da `public/icons/source.svg` via `@vite-pwa/assets-generator` (preset `minimal-2023`), config in `pwa-assets.config.ts`, script `npm run gen-icons`. Bonus generati: `pwa-64x64.png`, `apple-touch-icon-180x180.png`, `favicon.ico` | S0-06 | ✅ done |

#### Contesto per Claude Code (Sprint 0) — aggiornato 2026-04-13

```
PROGETTO: ShoppingList MVP — PWA offline-first per liste della spesa
STACK: React 18 + TypeScript + Vite + Dexie.js (IndexedDB) + Supabase + Zustand + Tailwind CSS

PRINCIPIO CORE: Il database locale Dexie.js è la source of truth.
Ogni operazione scrive prima localmente, poi sincronizza in background.

VINCOLI AMBIENTE (2026-04-13):
- Vercel NON disponibile → "produzione" = npm run preview locale
- Supabase NON disponibile → client guarded, env vars placeholder

STRUTTURA DIRECTORY canonical (feature-sliced, da architettura.md):
  src/
  ├── components/{ui,layout,shared}/       (vuote in Sprint 0)
  ├── features/{lists,items,auth,catalog,sync}/  (vuote in Sprint 0)
  ├── services/db/schema.ts                (Dexie v1)
  ├── services/supabase/client.ts          (guarded)
  ├── store/                               (vuota in Sprint 0)
  ├── hooks/                               (vuota in Sprint 0)
  ├── types/{domain.ts, sync.ts}
  ├── utils/{id.ts, date.ts}
  └── __tests__/{setup,id,App,schema,supabase}.{ts,tsx}

FILE CHIAVE DA CREARE IN SPRINT 0:
- src/types/domain.ts          → List, Item, ItemCatalog, Invite, enum minimi
- src/types/sync.ts             → ChangeLog, SyncStatus
- src/services/db/schema.ts     → schema Dexie v1 (5 tabelle, PK string)
- src/services/supabase/client.ts → client guarded + isSupabaseConfigured()
- src/utils/id.ts, src/utils/date.ts
- src/App.tsx                   → marker "Sprint 0 OK" verde
- vite.config.ts                → vite-plugin-pwa + alias @/ + test config
- public/icons/{icon-192,icon-512,icon-maskable-512}.png (placeholder)
- src/__tests__/{setup.ts, id.test.ts, App.test.tsx, schema.test.ts, supabase.test.ts}

ESCLUSI DA SPRINT 0 (rimandati):
- Stub stores Zustand → Sprint 1
- Costanti CATEGORIES/UNITS/PERMISSIONS → Sprint 1
- Setup progetto Supabase + DDL → Sprint 2
- Deploy reale Vercel/altro → quando provider disponibile

APPROCCIO: Layered (3 fasi sequenziali con checkpoint bloccanti)
1. TOOLING: Vite + deps + Tailwind init + Vitest config
2. STRUTTURA: cartelle .gitkeep + file sorgente sopra elencati
3. SMOKE: vitest run + npm run build + npm run preview + verifica PWA manuale
```

---

### Sprint 1 — Core Offline: Liste e Articoli

**Durata stimata:** 1.5 settimane
**Obiettivo:** CRUD completo di liste e articoli offline-first, senza autenticazione (modalità guest).

**Stato:** ✅ **COMPLETATO 2026-04-14** — DoD 13/13 verdi, 55 vitest passing (13 test files), 1 Playwright E2E offline-core golden-path passing con `context.setOffline(true)` e zero richieste di rete esterne, `npm run build` clean (638 kB / 207 kB gzipped), `npm run lint` zero errori. Esecuzione tramite `superpowers:subagent-driven-development` sui 36 task del plan.

**Criterio di completamento (vincolante — vedi spec §3 per versione completa e verificabile):** L'app funziona completamente offline: creare/modificare/eliminare liste e articoli, spuntare articoli, cestino item-only con restore, drag-reorder, toast, form con validazione Zod, Playwright E2E golden-path verde con `context.setOffline(true)`. Zero chiamate di rete osservate durante l'E2E.

> 📋 **Brainstorming di riferimento:** [`docs/brainstorming/2026-04-14-sprint1-brainstorming-summary.md`](../docs/brainstorming/2026-04-14-sprint1-brainstorming-summary.md)
> **Spec tecnica:** [`docs/specs/Sprint1_CoreOffline_Spec.md`](../docs/specs/Sprint1_CoreOffline_Spec.md)
> **Piano implementazione:** [`docs/plans/Sprint1_CoreOffline_Plan.md`](../docs/plans/Sprint1_CoreOffline_Plan.md)

> 📌 **Divergenze di implementazione dal plan** (rilevanti per Sprint 2+):
> - **shadcn CLI default è `base-nova` + `@base-ui/react`**, non Radix. I 5 pacchetti `@radix-ui/*` installati dal plan Task 0.1 sono stati rimossi come dead deps; i componenti shadcn importano da `@base-ui/react/*`.
> - **`Input` e `Textarea` riscritti** come native elements + `React.forwardRef` (`src/components/ui/{input,textarea}.tsx`) perché `@base-ui/react/input` non inoltra ref a React Hook Form (`isValid` restava false, submit disabled).
> - **Zod v4** installato (non v3): API `ZodError.issues` invece di `.errors`. Tutti gli accessi a errori Zod nei hook e nei test usano `.issues`.
> - **Dexie compound index con `null`**: `.where('[listId+deletedAt]').equals([id, null])` non ha tipi TS validi. Query attive (`queryActiveItems`, `ListCard` item count) usano `.where('listId').equals(id).filter((r) => r.deletedAt === null)`.
> - **Workbox `navigateFallback: 'index.html'`** aggiunto a `vite.config.ts` per servire route SPA (`/lists`, `/lists/:id`, `/trash`) offline — senza questa config il Playwright E2E falliva con `ERR_INTERNET_DISCONNECTED`.
> - **`newId()` invece di `nanoid`**: `src/utils/id.ts` espone `newId()` (crypto.randomUUID) e non è stato installato `nanoid`. Tutti i riferimenti a `nanoid` nel plan sono stati tradotti a `newId()`.
> - **Vitest config**: aggiunto `exclude: ['node_modules', 'dist', 'e2e/**']` in `vite.config.ts` per evitare che vitest raccolga i file Playwright.
> - **Test con Toaster/App**: richiedono `vi.mock('next-themes', ...)` perché `src/components/ui/sonner.tsx` importa `useTheme` a render-time.
> - **`ArchivedListsSection` refactored a presentational**: riceve `archived: List[]` come prop invece di chiamare `useArchivedLists()` internamente, così `ListDashboard` può risolvere `onRename` cercando in active + archived.
> - **`tsc --noEmit` ≠ `npm run build`**: il root `tsconfig.json` è meno stretto di `tsconfig.app.json`. Verifica sempre con `npm run build` (catturato 3 errori di strict mode in Phase 1 checkpoint che `tsc --noEmit` non aveva visto).
>
> Tutti questi gotcha sono anche documentati in `CLAUDE.md` §"Gotcha Sprint 1".

> ⚠️ **La vecchia tabella task S1-01…S1-15 è stata SUPERSEDUTA** dal plan sopra. Quei task usavano path layer-sliced (`listRepository.ts`, `itemService.ts`, `useListStore.ts`, `db/repositories/`, `stores/`) che CLAUDE.md marca come deprecati in favore della struttura feature-sliced (`src/features/lists/`, `src/features/items/`, `src/services/db/`). La decomposizione canonical è in 4 fasi — vedi sotto. I task originali sono preservati in fondo alla sezione come **Storico** per tracciabilità.

#### Tasks canonical (da `docs/plans/Sprint1_CoreOffline_Plan.md`)

**Fase 0 — Foundation** (14 task, nessun cambiamento UI)
| ID | Task | File target | Dipendenze |
|----|------|-------------|------------|
| S1.0.1 | Install runtime deps | `package.json` | — |
| S1.0.2 | Scaffold shadcn/ui + alias `@/*` | `components.json`, `src/components/ui/*`, `src/lib/utils.ts` | S1.0.1 |
| S1.0.3 | Tailwind brand tokens + Inter font | `tailwind.config.js`, `src/index.css` | S1.0.2 |
| S1.0.4 | Zod schemas as source of truth | `src/types/domain.ts` (rewrite) | S1.0.1 |
| S1.0.5 | Extended ChangeLog shape | `src/types/sync.ts` | S1.0.4 |
| S1.0.6 | `Result<T, E>` utility | `src/utils/result.ts` | — |
| S1.0.7 | Dexie v2 migration + schema test update | `src/services/db/schema.ts`, `src/__tests__/schema.test.ts` | S1.0.4, S1.0.5 |
| S1.0.8 | Guest session repo | `src/services/db/session.ts` | S1.0.6, S1.0.7 |
| S1.0.9 | `session.test.ts` | `src/services/db/__tests__/session.test.ts` | S1.0.8 |
| S1.0.10 | `recordChange()` chokepoint | `src/services/db/changeLog.ts` | S1.0.5 |
| S1.0.11 | `changeLog.test.ts` | `src/services/db/__tests__/changeLog.test.ts` | S1.0.10 |
| S1.0.12 | v1→v2 migration backfill test | `src/services/db/__tests__/migration.test.ts` | S1.0.7 |
| S1.0.13 | Canonical doc updates | `.claude/ui-ux.md`, `.claude/qualita.md` | — |
| S1.0.14 | Phase 0 checkpoint | lint + tsc + test + build | all 0.* |

**Fase 1 — Lists slice** (15 task)
| ID | Task | File target | Dipendenze |
|----|------|-------------|------------|
| S1.1.1 | Lists repository | `src/services/db/lists.ts` | S1.0.10, S1.0.8 |
| S1.1.2 | `lists.test.ts` | `src/services/db/__tests__/lists.test.ts` | S1.1.1 |
| S1.1.3 | `features/lists/logic.ts` | `src/features/lists/logic.ts` | S1.0.4 |
| S1.1.4 | Lists logic tests | `src/features/lists/__tests__/logic.test.ts` | S1.1.3 |
| S1.1.5 | Read hooks (`useLists`, `useArchivedLists`, `useList`) | `src/features/lists/hooks/use{Lists,ArchivedLists,List}.ts` | S1.1.1 |
| S1.1.6 | `useListOperations` with toast wiring | `src/features/lists/hooks/useListOperations.ts` | S1.1.5 |
| S1.1.7 | Lists hook tests | `src/features/lists/__tests__/hooks.test.tsx` | S1.1.6 |
| S1.1.8 | `ConfirmDialog` (double-click) | `src/components/shared/ConfirmDialog.tsx` | S1.0.2 |
| S1.1.9 | `ListForm` (RHF + Zod) | `src/features/lists/components/ListForm.tsx` | S1.1.3 |
| S1.1.10 | `ListCard` with dropdown menu | `src/features/lists/components/ListCard.tsx` | S1.1.8 |
| S1.1.11 | `ArchivedListsSection` | `src/features/lists/components/ArchivedListsSection.tsx` | S1.1.10 |
| S1.1.12 | `ListDashboard` | `src/features/lists/components/ListDashboard.tsx` | S1.1.9, S1.1.10, S1.1.11 |
| S1.1.13 | `AppShell` with skip link + Toaster | `src/components/layout/AppShell.tsx` | S1.0.2 |
| S1.1.14 | Router rewrite with AppShell | `src/App.tsx`, `src/__tests__/App.test.tsx` | S1.1.12, S1.1.13 |
| S1.1.15 | Phase 1 checkpoint | manual smoke + DoD #3,4,5,6,11,12,13 | all 1.* |

**Fase 2 — Items slice** (11 task)
| ID | Task | File target | Dipendenze |
|----|------|-------------|------------|
| S1.2.1 | Items repository | `src/services/db/items.ts` | S1.0.10, S1.1.1 |
| S1.2.2 | `items.test.ts` | `src/services/db/__tests__/items.test.ts` | S1.2.1 |
| S1.2.3 | `features/items/logic.ts` + tests | `src/features/items/logic.ts`, `__tests__/logic.test.ts` | S1.0.4 |
| S1.2.4 | Item hooks (`useItems`, `useItemOperations`) | `src/features/items/hooks/use{Items,ItemOperations}.ts` | S1.2.1, S1.2.3 |
| S1.2.5 | Items hook tests | `src/features/items/__tests__/hooks.test.tsx` | S1.2.4 |
| S1.2.6 | `ItemForm` (RHF + Zod, 5 fields) | `src/features/items/components/ItemForm.tsx` | S1.2.3 |
| S1.2.7 | `ItemRow` (sortable + checkbox) | `src/features/items/components/ItemRow.tsx` | S1.2.4 |
| S1.2.8 | `ItemList` (DndContext + aria-live) | `src/features/items/components/ItemList.tsx` | S1.2.7 |
| S1.2.9 | `ListDetailView` | `src/features/items/components/ListDetailView.tsx` | S1.2.6, S1.2.8 |
| S1.2.10 | Wire `/lists/:id` route | `src/App.tsx` | S1.2.9 |
| S1.2.11 | Phase 2 checkpoint | manual smoke + DoD #3,4,5,7,11,12,13 | all 2.* |

**Fase 3 — Trash slice + E2E** (6 task)
| ID | Task | File target | Dipendenze |
|----|------|-------------|------------|
| S1.3.1 | Trash hooks (`useTrash`, `useTrashOperations`) | `src/features/items/hooks/use{Trash,TrashOperations}.ts` | S1.2.1 |
| S1.3.2 | `TrashView` with restore + purge | `src/features/items/components/TrashView.tsx` | S1.3.1 |
| S1.3.3 | Wire `/trash` route | `src/App.tsx` | S1.3.2 |
| S1.3.4 | Playwright config (`:4173` preview, SW wait) | `playwright.config.ts` | S1.3.3 |
| S1.3.5 | `offline-core.spec.ts` golden path | `e2e/offline-core.spec.ts` | S1.3.4 |
| S1.3.6 | Phase 3 checkpoint — full DoD 13/13 | all 3.* + manual offline run | all 3.* |

**Totale:** 36 task canonical in 4 fasi con checkpoint bloccanti. Ogni task è TDD con codice completo nel plan, un commit per task (marcato `USER COMMIT` perché l'utente gestisce git personalmente).

#### Business Rules critiche (canonical — vedi `dominio.md` §"Regole di Business")

- **Nome lista:** obbligatorio, max 100 caratteri, trim automatico (Zod schema `ListFormSchema` in `src/types/domain.ts`)
- **Nome articolo:** obbligatorio, max 200 caratteri (Zod schema `ItemFormSchema`)
- **Quantità:** `number | null`; se presente deve essere `> 0` (Zod `.positive().nullable()`)
- **Note:** max 500 caratteri, nessuna sanitizzazione HTML in Sprint 1 (nessun rendering `dangerouslySetInnerHTML`, quindi XSS non applicabile; sanitizzazione differita a Sprint 3 quando arriva il markdown viewer)
- **Toggle stato articolo:** `DA_COMPRARE` ↔ `COMPLETATO` (uppercase canonical, **non** `pending`/`completed`). Il passaggio a `COMPLETATO` imposta `completedAt = now()`, il ritorno a `DA_COMPRARE` lo annulla
- **Soft delete articoli:** imposta `deletedAt = now()`, row resta in DB, `operationType: 'DELETE'` nel changeLog (tombstone per Sprint 4 sync)
- **Hard delete liste:** nessun soft-delete per `List`; `deleteList()` cascade-elimina gli item e scrive un `CREATE/UPDATE/DELETE` changeLog — richiede conferma `ConfirmDialog` con physical double-click (CLAUDE.md §"Vincoli Assoluti")
- **Archive lista:** `status: 'ACTIVE' | 'ARCHIVED'`; archivio è reversibile, delete no
- **Svuotamento cestino automatico:** rimandato a Sprint 2 (richiede un job/trigger che Sprint 1 non ha)
- **Reorder articoli:** `sortOrder` sparse (1000, 2000, 3000…), full rewrite su drag in Sprint 1, gap-insertion optimization deferita a Sprint 3

#### Decisioni architetturali Sprint 1 (da brainstorming 2026-04-14)

1. **Zod schemas come source of truth** per i tipi — `TypeScript types` derivati via `z.infer<typeof ListSchema>`
2. **`useLiveQuery` diretto da Dexie** — nessun Zustand mirror per `lists`/`items`, Zustand riservato a `authStore`/`uiStore`
3. **Guest identity** — tabella `session` Dexie singleton con `userId = 'guest-<nanoid>'`
4. **`Result<T, E>` ai confini modulo** — repo methods ritornano `Result`, helper interni (`getCurrentUserId()`) throw-ano
5. **shadcn/ui + RHF + Zod + sonner** — adottati in Phase 0 per allineamento con `ui-ux.md`
6. **`@dnd-kit/*`** — successor canonical di `react-beautiful-dnd` (libreria archiviata); deprecation note aggiunta a `ui-ux.md` nel task S1.0.13
7. **Dexie v2 migration idempotente** — v1 frozen, v2 aggiunge `session` table + indici `[listId+sortOrder]`, `[listId+status]`, `[synced+createdAt]` + `.upgrade()` backfill con `??=`
8. **Strict destructive confirm** — ogni delete lista passa da `ConfirmDialog` con physical double-click, indipendente dalla dimensione
9. **Playwright base URL `:4173`** — service worker richiede production build, non dev server
10. **Responsive shell deferito** — top nav desktop-optimized in Sprint 1; mobile bottom nav + sidebar tablet/desktop in Sprint 2

#### Contesto per Claude Code (Sprint 1) — aggiornato 2026-04-14

```
PROGETTO: ShoppingList MVP — Sprint 1 Core Offline
OBIETTIVO: CRUD liste + articoli + trash completamente offline, guest-mode, no network

PRINCIPIO CORE: Dexie è source of truth. useLiveQuery rende l'UI reattiva.
Zod schemas in src/types/domain.ts sono la source of truth per tipi + validazione.
Ogni CRUD locale scrive un row in db.changes via recordChange().

STRUTTURA DIRECTORY canonical (feature-sliced, da architettura.md):
  src/
  ├── components/
  │   ├── ui/                  (shadcn/ui: button, input, dialog, ...)
  │   ├── layout/AppShell.tsx  (skip link + header + Outlet + Toaster)
  │   └── shared/ConfirmDialog.tsx  (double-click destructive confirm)
  ├── features/
  │   ├── lists/
  │   │   ├── logic.ts         (Zod re-exports + formatUpdatedAt)
  │   │   ├── hooks/           (useLists, useArchivedLists, useList, useListOperations)
  │   │   ├── components/      (ListDashboard, ListCard, ListForm, ArchivedListsSection)
  │   │   └── __tests__/
  │   └── items/
  │       ├── logic.ts         (Zod re-exports + computeNextSortOrder)
  │       ├── hooks/           (useItems, useItemOperations, useTrash, useTrashOperations)
  │       ├── components/      (ListDetailView, ItemList, ItemRow, ItemForm, TrashView)
  │       └── __tests__/
  ├── services/db/
  │   ├── schema.ts            (Dexie v1 FROZEN + v2 con .upgrade())
  │   ├── session.ts           (guest session bootstrap)
  │   ├── changeLog.ts         (recordChange() chokepoint)
  │   ├── lists.ts             (list CRUD repo, returns Result)
  │   └── items.ts             (item CRUD repo, returns Result)
  ├── types/
  │   ├── domain.ts            (Zod schemas + z.infer types)
  │   └── sync.ts              (ChangeLog shape)
  ├── utils/
  │   └── result.ts            (Result<T, AppError>, ok, err, toAppError)
  └── __tests__/               (Sprint 0 smoke + any cross-cutting)
  e2e/
  └── offline-core.spec.ts     (Playwright golden path with setOffline(true))

PATTERN DA SEGUIRE:
1. Repository (services/db/*.ts) → accesso diretto Dexie, ritorna Result<T, AppError>,
   scrive changeLog tramite recordChange() in una transazione unica per ogni CRUD.
2. Hook (features/*/hooks/use*Operations.ts) → wrapping del repo con toast (sonner)
   integrato + loading/error state + validazione Zod pre-call.
3. Hook di lettura (features/*/hooks/use*.ts) → useLiveQuery() su query Dexie pure.
4. Component → legge via useLiveQuery hooks, chiama use*Operations, usa shadcn/ui
   components + RHF + zodResolver per i form.

REGOLA CRITICA 1: Ogni operazione CRUD DEVE passare attraverso recordChange() in
src/services/db/changeLog.ts. Nessun db.lists.put()/db.items.put() senza changeLog.
REGOLA CRITICA 2: Ogni delete di List passa da ConfirmDialog con double-click.
REGOLA CRITICA 3: import 'fake-indexeddb/auto' è LINE 1 di ogni test Dexie.
REGOLA CRITICA 4: Non mutare version(1).stores() in-place — appendere version(2).
REGOLA CRITICA 5: Playwright gira su :4173 (preview), non :5173 (dev) — il service
worker è registrato solo nella production build.

OPTIMISTIC UI: Dexie è "abbastanza sincrono" (<10ms writes). useLiveQuery re-renders
automaticamente al cambio delle tabelle. Non servono optimistic store updates manuali.

RIFERIMENTO OPERATIVO:
- Spec completa: docs/specs/Sprint1_CoreOffline_Spec.md (13 criteri DoD, 14 decisioni)
- Plan TDD: docs/plans/Sprint1_CoreOffline_Plan.md (36 task, codice completo in ogni step)
- Brainstorming: docs/brainstorming/2026-04-14-sprint1-brainstorming-summary.md
```

---

#### Storico: task S1-01…S1-15 (SUPERSEDUTI 2026-04-14)

> Questi task sono preservati solo per tracciabilità. **Non eseguirli** — seguono il layout layer-sliced deprecato e non sono compatibili con la struttura canonical. L'equivalente canonical è la decomposizione in 4 fasi qui sopra.

| ID | Task (deprecato) | Sostituito da |
|----|------|------|
| S1-01 | `listRepository.ts` | S1.1.1 `src/services/db/lists.ts` |
| S1-02 | `listService.ts` | S1.1.1 (logica in repo) + S1.1.6 (`useListOperations` wrapper) |
| S1-03 | `useListStore.ts` (Zustand) | S1.1.5 (useLiveQuery hooks) + S1.1.6 (operations hook) — **nessun Zustand store per lists data** |
| S1-04 | `HomePage` | S1.1.12 `ListDashboard.tsx` |
| S1-05 | `ListCard` component | S1.1.10 `src/features/lists/components/ListCard.tsx` |
| S1-06 | `ListFormModal` | S1.1.9 `ListForm.tsx` (usa shadcn/ui Dialog per rename, inline per create) |
| S1-07 | `itemRepository.ts` | S1.2.1 `src/services/db/items.ts` |
| S1-08 | `itemService.ts` | S1.2.1 + S1.2.4 `useItemOperations` |
| S1-09 | `ListPage` | S1.2.9 `ListDetailView.tsx` |
| S1-10 | `ItemRow` component | S1.2.7 `src/features/items/components/ItemRow.tsx` |
| S1-11 | `ItemFormModal` | S1.2.6 `ItemForm.tsx` |
| S1-12 | `TrashPage` | S1.3.2 `TrashView.tsx` |
| S1-13 | Change Tracking `recordChange()` | S1.0.10 `src/services/db/changeLog.ts` |
| S1-14 | Componenti comuni (Button, Modal, Toast, ...) | S1.0.2 shadcn/ui CLI install (button, input, label, textarea, dialog, skeleton, sonner, dropdown-menu, checkbox) |
| S1-15 | Test unitari | Distribuiti su S1.1.2, S1.1.4, S1.1.7, S1.2.2, S1.2.3, S1.2.5 |

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
