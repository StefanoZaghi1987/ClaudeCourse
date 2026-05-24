# Sprint 0 Setup Infrastruttura — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> ⚠️ **Vincolo utente: nessun comando git automatico.**
> Per preferenza esplicita dell'utente (vedi `MEMORY.md`), questo piano **non include** step di `git add` / `git commit`. L'utente gestisce i commit autonomamente al ritmo che preferisce. I task del piano si fermano dopo la verifica del test verde.

**Goal:** Setup completo dell'ambiente di sviluppo del MVP ShoppingList: tooling Vite + React + TypeScript + Tailwind + Vitest + PWA, layer di persistence locale Dexie, types minimi, client Supabase guarded, marker UI verificabile, suite di 5 test smoke verdi e build production servita in `npm run preview` con manifest PWA installabile.

**Architecture:** Tre fasi sequenziali con checkpoint bloccanti — Fase 1 TOOLING (init Vite + dipendenze + Tailwind), Fase 2 STRUTTURA E CONTENUTI (config files + cartelle feature-sliced + types + schema Dexie + supabase guarded + App marker + tests), Fase 3 SMOKE (test suite + build + preview + verifica PWA manuale). Struttura cartelle **feature-sliced** secondo `architettura.md` (canonical), supersede `development_plan.md §2.2`.

**Tech Stack:** React 18.3 · TypeScript 5 strict · Vite 5 · Tailwind 3 · vite-plugin-pwa 0.x · @vite-pwa/assets-generator · Dexie 3 + dexie-react-hooks · @supabase/supabase-js 2 · Zustand 4 (installato, non usato in Sprint 0) · react-router-dom 6 · Vitest 1 + @testing-library/react + jsdom + fake-indexeddb

**Spec di riferimento:** [`docs/superpowers/specs/2026-04-13-sprint0-setup-design.md`](../specs/2026-04-13-sprint0-setup-design.md)

---

## Mappa file (creati / modificati)

### File configurazione (root)
| File | Azione | Responsabilità |
|---|---|---|
| `package.json` | Generato + modificato (scripts) | Dipendenze + script `dev/build/preview/test/test:watch/lint/gen-icons` |
| `vite.config.ts` | Sostituito | Plugin React + PWA + alias `@/` + config Vitest integrata |
| `tsconfig.json` | Modificato | `strict`, `paths` per alias `@/`, `noUnusedLocals/Parameters` |
| `tsconfig.node.json` | Generato | (Da Vite, lasciato com'è) |
| `tailwind.config.js` | Sostituito | `content` glob su `index.html` e `src/**/*.{ts,tsx}` |
| `postcss.config.js` | Generato (`tailwindcss init -p`) | Pipeline PostCSS per Tailwind |
| `pwa-assets.config.ts` | Creato | Config `@vite-pwa/assets-generator` per icone placeholder |
| `index.html` | Mantenuto da Vite | Entry HTML |
| `.env.example` | Creato | Placeholder vuoti `VITE_SUPABASE_URL/ANON_KEY/APP_URL` |
| `.env.local` | Creato | Copia di `.env.example` (gitignored) |
| `.gitignore` | Esteso (merge) | Aggiunge `dist/`, `dev-dist/`, `node_modules/`, `coverage/`, `.env.local`, ecc. |

### File sorgente `src/`
| File | Azione | Responsabilità |
|---|---|---|
| `src/main.tsx` | Modificato (Vite default) | Import `./index.css` + render `<App />` |
| `src/index.css` | Creato | `@tailwind base/components/utilities` |
| `src/App.tsx` | Sostituito | `BrowserRouter` + route `/` con marker "Sprint 0 OK" |
| `src/types/domain.ts` | Creato | Tipi minimi: `List`, `Item`, `ItemCatalog`, `Invite`, enum |
| `src/types/sync.ts` | Creato | `ChangeLog`, `SyncStatus` |
| `src/services/db/schema.ts` | Creato | Classe `ShoppingListDB` Dexie v1 con 5 tabelle |
| `src/services/supabase/client.ts` | Creato | `createClient` + `isSupabaseConfigured()` guard |
| `src/utils/id.ts` | Creato | `newId()` via `crypto.randomUUID()` |
| `src/utils/date.ts` | Creato | `now()` helper |

### File test `src/__tests__/`
| File | Azione | Responsabilità |
|---|---|---|
| `src/__tests__/setup.ts` | Creato | `import '@testing-library/jest-dom/vitest'` |
| `src/__tests__/id.test.ts` | Creato | 2 test: non vuoto + 100 ID unici |
| `src/__tests__/App.test.tsx` | Creato | 1 test: marker "Sprint 0" presente |
| `src/__tests__/schema.test.ts` | Creato | 1 test: 5 tabelle dichiarate |
| `src/__tests__/supabase.test.ts` | Creato | 1 test: `isSupabaseConfigured() === false` |

### Cartelle feature-sliced (`.gitkeep`)
| Cartella | Stato Sprint 0 |
|---|---|
| `src/components/ui/` | vuota + `.gitkeep` |
| `src/components/layout/` | vuota + `.gitkeep` |
| `src/components/shared/` | vuota + `.gitkeep` |
| `src/features/lists/` | vuota + `.gitkeep` |
| `src/features/items/` | vuota + `.gitkeep` |
| `src/features/auth/` | vuota + `.gitkeep` |
| `src/features/catalog/` | vuota + `.gitkeep` |
| `src/features/sync/` | vuota + `.gitkeep` |
| `src/store/` | vuota + `.gitkeep` |
| `src/hooks/` | vuota + `.gitkeep` |

### Asset PWA (`public/icons/`)
| File | Azione |
|---|---|
| `public/icons/source.svg` | Creato (logo placeholder "S" emerald) |
| `public/icons/pwa-192x192.png` | Generato da `npm run gen-icons` |
| `public/icons/pwa-512x512.png` | Generato da `npm run gen-icons` |
| `public/icons/maskable-icon-512x512.png` | Generato da `npm run gen-icons` |

---

## FASE 1 — TOOLING

### Task 1: Init progetto Vite + React + TypeScript

**Files:**
- Create: `package.json` (generato da Vite)
- Create: `index.html`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts` (default), `src/main.tsx`, `src/App.tsx` (default), `src/vite-env.d.ts`
- Modify: `.gitignore` (merge manuale: NON sovrascrivere il preesistente)

**Pre-condizioni:** la cartella `ShoppingList/` contiene **solo** `.claude/`, `CLAUDE.md`, `.gitignore` (verificato in brainstorming).

- [ ] **Step 1.1: Init Vite in root**

Run dalla cartella `ShoppingList/`:
```bash
npm create vite@latest . -- --template react-ts
```

Quando Vite chiede di confermare l'init in cartella non vuota, rispondere **`y`**.
Quando Vite chiede di sovrascrivere `.gitignore` esistente, **rispondere `n`** (NON sovrascrivere).

Expected:
- Crea `package.json`, `index.html`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `src/assets/`, `public/`
- `.claude/`, `CLAUDE.md` non toccati

- [ ] **Step 1.2: Verifica file generati**

Run:
```bash
ls -la
ls -la src
```

Expected: presenza di `package.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`. Cartella `.claude/` ancora presente.

---

### Task 2: Install dipendenze runtime

**Files:**
- Modify: `package.json` (sezione `dependencies`)

- [ ] **Step 2.1: Install dipendenze runtime**

Run:
```bash
npm install zustand dexie dexie-react-hooks @supabase/supabase-js react-router-dom uuid
```

Expected: `node_modules/` creato, `package.json` `dependencies` aggiornato con tutte le 6 librerie. Zero errori.

- [ ] **Step 2.2: Verifica versioni**

Run:
```bash
npm ls --depth=0
```

Expected output contiene (versioni minime):
```
├── @supabase/supabase-js@^2
├── dexie@^3
├── dexie-react-hooks@^1
├── react-router-dom@^6
├── uuid@^9
└── zustand@^4
```

---

### Task 3: Install dipendenze dev

**Files:**
- Modify: `package.json` (sezione `devDependencies`)

- [ ] **Step 3.1: Install dipendenze dev**

Run (singola riga, evita escape per Windows bash):
```bash
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa workbox-window @vite-pwa/assets-generator vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom fake-indexeddb @types/uuid
```

Expected: tutte le librerie aggiunte a `devDependencies`. Zero errori.

- [ ] **Step 3.2: Verifica vitest disponibile**

Run:
```bash
npx vitest --version
```

Expected: stampa una versione (es. `1.x.x`). Zero errori.

---

### Task 4: Init Tailwind CSS

**Files:**
- Create: `tailwind.config.js`
- Create: `postcss.config.js`

- [ ] **Step 4.1: Init Tailwind**

Run:
```bash
npx tailwindcss init -p
```

Expected: crea `tailwind.config.js` (vuoto di default) e `postcss.config.js`.

- [ ] **Step 4.2: Verifica file creati**

Run:
```bash
ls -la tailwind.config.js postcss.config.js
```

Expected: entrambi i file esistono.

---

### Checkpoint 1 — Dev server

- [ ] **Step Checkpoint-1: Verifica dev server**

Run:
```bash
npm run dev
```

Expected: server parte su `http://localhost:5173`, pagina Vite default raggiungibile, zero errori in console. Premere `Ctrl+C` per chiudere.

**Se fallisce:** STOP. Debug prima di passare a Fase 2. Cause comuni:
- Versione Node < 18 → upgrade Node
- Porta 5173 occupata → kill processo o cambia porta

---

## FASE 2 — STRUTTURA E CONTENUTI

### Task 5: Sostituire `vite.config.ts`

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 5.1: Sostituire `vite.config.ts` con la versione completa**

Sovrascrivere `vite.config.ts` con:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'ShoppingList',
        short_name: 'ShoppingList',
        description: 'Liste della spesa offline-first',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.ts',
  },
})
```

- [ ] **Step 5.2: Aggiungere triple-slash reference Vitest types**

Aggiungere come **prima riga** di `vite.config.ts`:

```typescript
/// <reference types="vitest" />
```

Questo abilita IntelliSense per la sezione `test:`.

---

### Task 6: Sostituire `tailwind.config.js` + creare `src/index.css`

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css` (sovrascrivere quello generato da Vite)

- [ ] **Step 6.1: Sostituire `tailwind.config.js`**

Sovrascrivere con:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 6.2: Sovrascrivere `src/index.css`**

Sovrascrivere `src/index.css` (generato da Vite con stili default) con:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6.3: Verificare che `src/main.tsx` importi `./index.css`**

Aprire `src/main.tsx` e verificare la presenza di `import './index.css'` (Vite la mette di default). Se manca, aggiungerla come prima import.

---

### Task 7: Aggiornare `tsconfig.json`

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 7.1: Aggiungere alias `@/` e flag strict aggiuntivi**

Aprire `tsconfig.json` e nella sezione `compilerOptions` assicurarsi che siano presenti (aggiungere/modificare se necessario):

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Mantenere tutte le altre opzioni esistenti generate da Vite (`target`, `module`, `jsx`, `moduleResolution`, ecc.).

- [ ] **Step 7.2: Verifica tsc accetta la config**

Run:
```bash
npx tsc --noEmit
```

Expected: errori sull'`App.tsx` di default Vite (perché useremo classi Tailwind che non esistono ancora come tipi e Vite genera del codice di esempio). **È normale ora.** Verrà ripulito al Task 17.

Se ci sono errori sul `tsconfig.json` stesso (sintassi JSON, opzioni invalide) → STOP, sistemare.

---

### Task 8: Creare `.env.example`, `.env.local`, estendere `.gitignore`

**Files:**
- Create: `.env.example`
- Create: `.env.local`
- Modify: `.gitignore` (append)

- [ ] **Step 8.1: Creare `.env.example`**

```env
# .env.example — committato in repo, valori vuoti
# Popolare .env.local (gitignored) con i valori reali quando Supabase sarà disponibile
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_URL=http://localhost:5173
```

- [ ] **Step 8.2: Creare `.env.local` come copia identica**

Copiare il contenuto di `.env.example` in `.env.local`. Stesso contenuto byte per byte.

- [ ] **Step 8.3: Estendere `.gitignore` (append, no overwrite)**

Aggiungere in append al `.gitignore` esistente (verificare prima quali righe sono già presenti per non duplicare):

```
# Vite
dist/
dev-dist/

# Node
node_modules/
.npm/

# Env
.env.local
.env.*.local

# Testing
coverage/

# IDE
.vscode/*
!.vscode/extensions.json
.idea/
```

Se una riga esiste già nel `.gitignore` originale, non duplicarla.

- [ ] **Step 8.4: Verifica `.env.local` è ignorato**

Run:
```bash
git check-ignore .env.local
```

Expected output: `.env.local` (significa che è ignorato). Se non stampa nulla, il pattern non è attivo → fix `.gitignore`.

---

### Task 9: Creare struttura cartelle feature-sliced

**Files:**
- Create: `src/components/ui/.gitkeep`
- Create: `src/components/layout/.gitkeep`
- Create: `src/components/shared/.gitkeep`
- Create: `src/features/lists/.gitkeep`
- Create: `src/features/items/.gitkeep`
- Create: `src/features/auth/.gitkeep`
- Create: `src/features/catalog/.gitkeep`
- Create: `src/features/sync/.gitkeep`
- Create: `src/store/.gitkeep`
- Create: `src/hooks/.gitkeep`
- Create: `src/services/db/` (cartella)
- Create: `src/services/supabase/` (cartella)
- Create: `src/types/` (cartella)
- Create: `src/utils/` (cartella)
- Create: `src/__tests__/` (cartella)
- Create: `public/icons/` (cartella)

- [ ] **Step 9.1: Creare tutte le cartelle e i `.gitkeep`**

Run (Unix bash):
```bash
mkdir -p src/components/ui src/components/layout src/components/shared
mkdir -p src/features/lists src/features/items src/features/auth src/features/catalog src/features/sync
mkdir -p src/store src/hooks
mkdir -p src/services/db src/services/supabase
mkdir -p src/types src/utils src/__tests__
mkdir -p public/icons

touch src/components/ui/.gitkeep src/components/layout/.gitkeep src/components/shared/.gitkeep
touch src/features/lists/.gitkeep src/features/items/.gitkeep src/features/auth/.gitkeep src/features/catalog/.gitkeep src/features/sync/.gitkeep
touch src/store/.gitkeep src/hooks/.gitkeep
```

- [ ] **Step 9.2: Verifica struttura**

Run:
```bash
find src -type d | sort
```

Expected output contiene:
```
src
src/__tests__
src/components
src/components/layout
src/components/shared
src/components/ui
src/features
src/features/auth
src/features/catalog
src/features/items
src/features/lists
src/features/sync
src/hooks
src/services
src/services/db
src/services/supabase
src/store
src/types
src/utils
```

(Più eventuale `src/assets` generato da Vite, va bene se presente.)

---

### Task 10: Creare `src/__tests__/setup.ts`

**Files:**
- Create: `src/__tests__/setup.ts`

- [ ] **Step 10.1: Scrivere il file setup**

Creare `src/__tests__/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

Una sola riga. Estende `expect` di Vitest con i matcher di Testing Library (`toBeInTheDocument`, ecc.).

---

### Task 11: TDD `src/utils/id.ts` — newId()

**Files:**
- Create: `src/__tests__/id.test.ts`
- Create: `src/utils/id.ts`

- [ ] **Step 11.1: Scrivere il test che fallisce**

Creare `src/__tests__/id.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { newId } from '../utils/id'

describe('id', () => {
  it('genera ID non vuoti', () => {
    expect(newId()).toMatch(/.+/)
  })

  it('genera ID unici su 100 chiamate', () => {
    const ids = new Set(Array.from({ length: 100 }, () => newId()))
    expect(ids.size).toBe(100)
  })
})
```

- [ ] **Step 11.2: Eseguire il test e verificare che fallisca**

Run:
```bash
npx vitest run src/__tests__/id.test.ts
```

Expected: FAIL con errore "Cannot find module '../utils/id'" o equivalente.

- [ ] **Step 11.3: Implementare `src/utils/id.ts`**

Creare `src/utils/id.ts`:

```typescript
export const newId = (): string => crypto.randomUUID()
```

- [ ] **Step 11.4: Eseguire il test e verificare che passi**

Run:
```bash
npx vitest run src/__tests__/id.test.ts
```

Expected: PASS, 2/2 test verdi.

---

### Task 12: Creare `src/utils/date.ts`

**Files:**
- Create: `src/utils/date.ts`

Nessun test dedicato — è un wrapper banale di `Date.now()`. Se in futuro la logica si arricchisce (formatting, timezone), si aggiungerà.

- [ ] **Step 12.1: Creare il file**

Creare `src/utils/date.ts`:

```typescript
export const now = (): number => Date.now()
```

---

### Task 13: Creare `src/types/domain.ts`

**Files:**
- Create: `src/types/domain.ts`

Nessun test dedicato — i tipi sono validati implicitamente da `tsc --noEmit` e dagli usi in `schema.ts`.

- [ ] **Step 13.1: Creare il file con i tipi minimi Sprint 0**

Creare `src/types/domain.ts`:

```typescript
export type ItemStatus = 'pending' | 'completed'
export type ListStatus = 'active' | 'archived'
export type Permission = 'OWNER' | 'EDITOR' | 'VIEWER'
export type EntityType = 'LIST' | 'ITEM'
export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE'

export interface List {
  id: string
  name: string
  ownerId: string
  status: ListStatus
  createdAt: number
  updatedAt: number
}

export interface Item {
  id: string
  listId: string
  name: string
  status: ItemStatus
  category: string | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface ItemCatalog {
  id: string
  name: string
  lastUsedAt: number
}

export interface Invite {
  id: string
  listId: string
  token: string
  expiresAt: number
}
```

**Esclusioni deliberate** (verranno aggiunte in Sprint 1): `Category` enum, `UnitOfMeasure` enum, `SharedMember`, `UserSyncMeta`, campi sync (`remoteId`, `lastSyncedAt`, `hasLocalChanges`).

---

### Task 14: Creare `src/types/sync.ts`

**Files:**
- Create: `src/types/sync.ts`

- [ ] **Step 14.1: Creare il file**

Creare `src/types/sync.ts`:

```typescript
import type { EntityType, OperationType } from './domain'

export interface ChangeLog {
  id: string
  entityType: EntityType
  entityId: string
  operationType: OperationType
  payload: Record<string, unknown>
  createdAt: number
  synced: boolean
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'
```

---

### Task 15: TDD `src/services/db/schema.ts` — Dexie v1

**Files:**
- Create: `src/__tests__/schema.test.ts`
- Create: `src/services/db/schema.ts`

- [ ] **Step 15.1: Scrivere il test che fallisce**

Creare `src/__tests__/schema.test.ts`:

```typescript
import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { db } from '../services/db/schema'

describe('Dexie schema', () => {
  it('apre il database e dichiara tutte le tabelle attese', async () => {
    await db.open()
    const names = db.tables.map(t => t.name).sort()
    expect(names).toEqual(['catalog', 'changes', 'invites', 'items', 'lists'])
    db.close()
  })
})
```

**Importante:** `import 'fake-indexeddb/auto'` deve essere la **prima riga**. Registra `indexedDB` come globale; senza di esso Dexie crasha in jsdom.

- [ ] **Step 15.2: Eseguire il test e verificare che fallisca**

Run:
```bash
npx vitest run src/__tests__/schema.test.ts
```

Expected: FAIL con "Cannot find module '../services/db/schema'".

- [ ] **Step 15.3: Implementare `src/services/db/schema.ts`**

Creare `src/services/db/schema.ts`:

```typescript
import Dexie, { Table } from 'dexie'
import type { List, Item, ItemCatalog, Invite } from '../../types/domain'
import type { ChangeLog } from '../../types/sync'

export class ShoppingListDB extends Dexie {
  lists!: Table<List, string>
  items!: Table<Item, string>
  changes!: Table<ChangeLog, string>
  catalog!: Table<ItemCatalog, string>
  invites!: Table<Invite, string>

  constructor() {
    super('ShoppingListDB')
    this.version(1).stores({
      lists:    '&id, ownerId, status, updatedAt',
      items:    '&id, listId, status, category, updatedAt, [listId+deletedAt]',
      changes:  '&id, entityType, entityId, synced, createdAt',
      catalog:  '&id, &name, lastUsedAt',
      invites:  '&id, listId, token, expiresAt',
    })
  }
}

export const db = new ShoppingListDB()
```

**Decisioni di design (NON modificare):**
- `&id` (string PK, non `++id` autoincrement) → supporta UUID v4 generati offline
- Indice composito `[listId+deletedAt]` su `items` → query "non eliminati di una lista" senza scan
- `&name` su `catalog` → unique constraint anti-duplicati
- **Schema versioning:** mai modificare `version(1).stores(...)` in-place. Cambi futuri = `version(N).upgrade()`.

- [ ] **Step 15.4: Eseguire il test e verificare che passi**

Run:
```bash
npx vitest run src/__tests__/schema.test.ts
```

Expected: PASS, 1/1 test verde, 5 tabelle dichiarate (`catalog`, `changes`, `invites`, `items`, `lists`).

---

### Task 16: TDD `src/services/supabase/client.ts` — guarded

**Files:**
- Create: `src/__tests__/supabase.test.ts`
- Create: `src/services/supabase/client.ts`

- [ ] **Step 16.1: Scrivere il test che fallisce**

Creare `src/__tests__/supabase.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { isSupabaseConfigured } from '../services/supabase/client'

describe('supabase client guard', () => {
  it('riporta non configurato quando le env vars sono placeholder', () => {
    expect(isSupabaseConfigured()).toBe(false)
  })
})
```

- [ ] **Step 16.2: Eseguire il test e verificare che fallisca**

Run:
```bash
npx vitest run src/__tests__/supabase.test.ts
```

Expected: FAIL con "Cannot find module '../services/supabase/client'".

- [ ] **Step 16.3: Implementare `src/services/supabase/client.ts`**

Creare `src/services/supabase/client.ts`:

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured = (): boolean =>
  url.length > 0 && anonKey.length > 0 && !url.includes('placeholder')

export const supabase: SupabaseClient = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key'
)
```

**Pattern guard (NON modificare):**
- `createClient` invocato sempre, anche con placeholder → import-safe
- `isSupabaseConfigured()` ritorna `true` solo se entrambe le env sono non vuote E `url` non contiene "placeholder"
- Pattern d'uso negli sprint successivi:
  ```typescript
  if (!isSupabaseConfigured()) return localOnlyResult
  ```

- [ ] **Step 16.4: Eseguire il test e verificare che passi**

Run:
```bash
npx vitest run src/__tests__/supabase.test.ts
```

Expected: PASS, 1/1 test verde. `isSupabaseConfigured()` ritorna `false` perché `.env.local` ha i campi `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` vuoti.

---

### Task 17: TDD `src/App.tsx` — marker Sprint 0

**Files:**
- Create: `src/__tests__/App.test.tsx`
- Modify: `src/App.tsx` (sovrascrivere quello generato da Vite)

- [ ] **Step 17.1: Scrivere il test che fallisce**

Creare `src/__tests__/App.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renderizza senza crash e mostra il marker Sprint 0', () => {
    render(<App />)
    expect(screen.getByText(/Sprint 0/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 17.2: Eseguire il test e verificare che fallisca**

Run:
```bash
npx vitest run src/__tests__/App.test.tsx
```

Expected: FAIL — `App.tsx` di Vite non contiene il testo "Sprint 0".

- [ ] **Step 17.3: Sovrascrivere `src/App.tsx`**

Sovrascrivere `src/App.tsx` (cancellare il contenuto generato da Vite) con:

```typescript
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold text-emerald-600">Sprint 0 OK</h1>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}
```

**Note:**
- `text-emerald-600` valida la pipeline Tailwind: se nel browser è nero, il `content` glob in `tailwind.config.js` è sbagliato.
- `App.tsx` **non** importa da `services/db` né da `services/supabase` per Sprint 0. Quei moduli sono toccati **solo** dai test.

- [ ] **Step 17.4: Pulire i file di esempio Vite**

Vite genera `src/assets/react.svg` e usa `import reactLogo from './assets/react.svg'` nel suo `App.tsx`. Dopo la sovrascrittura non sono più usati. Eliminare:

```bash
rm -rf src/assets
```

(Se `src/assets/` non esiste già, il comando è no-op innocuo.)

- [ ] **Step 17.5: Eseguire il test e verificare che passi**

Run:
```bash
npx vitest run src/__tests__/App.test.tsx
```

Expected: PASS, 1/1 test verde.

---

### Task 18: Creare `pwa-assets.config.ts` + `source.svg` + generare icone

**Files:**
- Create: `pwa-assets.config.ts`
- Create: `public/icons/source.svg`
- Generate: `public/icons/pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`

- [ ] **Step 18.1: Creare `pwa-assets.config.ts`**

Creare nella root del progetto:

```typescript
import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset,
  images: ['public/icons/source.svg'],
})
```

- [ ] **Step 18.2: Creare `public/icons/source.svg`**

Creare `public/icons/source.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#10b981"/>
  <text x="256" y="340" font-family="sans-serif" font-size="320"
        font-weight="bold" fill="white" text-anchor="middle">S</text>
</svg>
```

- [ ] **Step 18.3: Generare le icone PWA**

Run:
```bash
npx pwa-assets-generator --preset minimal-2023 public/icons/source.svg
```

Expected: produce in `public/icons/` (o nel path che il preset configura) almeno:
- `pwa-192x192.png`
- `pwa-512x512.png`
- `maskable-icon-512x512.png`

- [ ] **Step 18.4: Verificare nomi e path delle icone generate**

Run:
```bash
ls -la public/icons/
```

Expected: presenza dei 3 PNG sopra elencati. Se i nomi differiscono (es. `pwa-192.png` invece di `pwa-192x192.png`):
1. Annotare i nomi reali
2. Aggiornare la sezione `icons` di `vite.config.ts` (Task 5) per riflettere i nomi reali
3. Re-run questo step finché le 3 icone sono nei path attesi

---

### Task 19: Aggiornare gli script in `package.json`

**Files:**
- Modify: `package.json`

- [ ] **Step 19.1: Aggiornare la sezione `scripts`**

Aprire `package.json` e sostituire la sezione `scripts` con:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint . --ext ts,tsx",
    "gen-icons": "pwa-assets-generator --preset minimal-2023 public/icons/source.svg"
  }
}
```

Mantenere intatte tutte le altre sezioni (`name`, `version`, `dependencies`, `devDependencies`, ecc.).

- [ ] **Step 19.2: Verificare che `npm run test` invochi vitest**

Run:
```bash
npm test
```

Expected: vitest parte ed esegue **tutti** i test fin qui creati. Atteso 5 test verdi (id:2, App:1, schema:1, supabase:1).

Se qualche test fallisce → STOP, fix prima di Fase 3.

---

### Checkpoint 2 — TypeScript build clean

- [ ] **Step Checkpoint-2: Verifica zero errori TypeScript**

Run:
```bash
npx tsc --noEmit
```

Expected: zero errori. Se errori → fix prima di Fase 3. Cause comuni:
- Path alias `@/*` non funziona → verifica `tsconfig.json` `baseUrl` + `paths`
- Tipi mancanti su `import.meta.env.VITE_*` → aggiungere a `src/vite-env.d.ts`:
  ```typescript
  /// <reference types="vite/client" />
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_APP_URL: string
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  ```
- Errori "unused parameter" → rinominare con `_` prefix o rimuovere

---

## FASE 3 — SMOKE

### Task 20: Suite test completa verde

**Files:** nessuna modifica, solo verifica.

- [ ] **Step 20.1: Eseguire la suite completa**

Run:
```bash
npm test
```

Expected output:
```
Test Files  4 passed (4)
     Tests  5 passed (5)
```

I 4 file:
- `src/__tests__/id.test.ts` (2 test)
- `src/__tests__/App.test.tsx` (1 test)
- `src/__tests__/schema.test.ts` (1 test)
- `src/__tests__/supabase.test.ts` (1 test)

Se qualche test fallisce → STOP, fix.

---

### Task 21: Build production

**Files:** Generato `dist/`

- [ ] **Step 21.1: Eseguire la build**

Run:
```bash
npm run build
```

Expected: zero errori, cartella `dist/` creata.

- [ ] **Step 21.2: Verificare gli artefatti di build**

Run:
```bash
ls -la dist/
```

Expected: presenza di:
- `index.html`
- `assets/` (contiene JS+CSS bundled)
- `sw.js` (service worker generato da vite-plugin-pwa)
- `manifest.webmanifest` (manifest PWA)
- `registerSW.js`
- `workbox-*.js`
- `icons/pwa-192x192.png`, `icons/pwa-512x512.png`, `icons/maskable-icon-512x512.png`

Se `sw.js` o `manifest.webmanifest` mancano → vite-plugin-pwa non ha funzionato. Verifica `vite.config.ts`.

---

### Task 22: Preview production locale

**Files:** nessuna modifica, solo verifica.

- [ ] **Step 22.1: Avviare il preview server**

Run:
```bash
npm run preview
```

Expected: server parte su `http://localhost:4173/`, output simile a:
```
  ➜  Local:   http://localhost:4173/
```

**NON chiudere il preview server.** Resta attivo per il prossimo step.

- [ ] **Step 22.2: Verifica visuale nel browser**

Aprire `http://localhost:4173/` in **Chrome** (necessario per gli step PWA seguenti).

Expected:
- Pagina mostra "Sprint 0 OK" centrato
- Il testo è **verde** (`text-emerald-600`), non nero. Se è nero → STOP, Tailwind non è attivo, controlla `content` glob in `tailwind.config.js`.

---

### Task 23: Verifica PWA manuale (DoD criterio 8)

**Files:** nessuna modifica, solo verifica manuale.

Questo è l'ultimo gate dello Sprint 0. Senza i 4 sotto-step verdi, lo sprint non è chiuso.

- [ ] **Step 23.1: Manifest visibile in DevTools**

Con `http://localhost:4173/` aperto in Chrome:
1. Apri DevTools (F12)
2. Tab **Application** → sezione **Manifest** (sidebar sinistra)

Expected:
- Nome: "ShoppingList"
- Short name: "ShoppingList"
- Theme color: `#10b981` (verde)
- Display: standalone
- 3 icone elencate: 192x192, 512x512, 512x512 (maskable)

- [ ] **Step 23.2: Service Worker attivo**

Sempre in DevTools → Application → **Service Workers**.

Expected:
- Status: **activated and is running**
- Source: `sw.js`
- Nessun errore in console

- [ ] **Step 23.3: Lighthouse PWA audit verde**

Sempre in DevTools → tab **Lighthouse** → seleziona solo **Progressive Web App** → **Analyze page load**.

Expected:
- Sezione "Installable" → tutti gli check verdi
- "Web app manifest meets the installability requirements" → ✅
- "Registers a service worker that controls page and start_url" → ✅

Se qualcosa fallisce, leggere il messaggio di Lighthouse e fixare. Errori comuni:
- Icona maskable non riconosciuta → verificare `purpose: 'maskable'` nel manifest
- HTTPS richiesto → su `localhost` è considerato sicuro, non dovrebbe essere un problema

- [ ] **Step 23.4: Icona "Installa app" presente**

Guardare la **barra indirizzi** di Chrome (a destra dell'URL).

Expected: icona "+" o "Install" cliccabile. Cliccando appare il prompt di installazione.

**Non installare effettivamente** (a meno che tu non voglia testarlo). Basta verificare che l'icona ci sia.

- [ ] **Step 23.5: Chiudere il preview server**

Tornare al terminale dove gira `npm run preview` e premere `Ctrl+C`.

---

## Definition of Done — Verifica finale

Spuntare ogni criterio. **Tutti gli 8 devono essere verdi.**

- [ ] **DoD 1:** `npm run dev` apre `:5173` con la pagina, zero errori console (verificato in Checkpoint 1)
- [ ] **DoD 2:** Marker "Sprint 0 OK" è verde nel browser (verificato in Step 22.2)
- [ ] **DoD 3:** `schema.test.ts` verde, 5 tabelle dichiarate (verificato in Step 15.4)
- [ ] **DoD 4:** `supabase.test.ts` verde, `isSupabaseConfigured() === false` (verificato in Step 16.4)
- [ ] **DoD 5:** `npm test` produce 5 test passati su 5 (verificato in Step 20.1)
- [ ] **DoD 6:** `npm run build` produce `dist/` con `sw.js` + `manifest.webmanifest` (verificato in Step 21.2)
- [ ] **DoD 7:** `npm run preview` serve l'app su `:4173` correttamente (verificato in Step 22.1)
- [ ] **DoD 8:** PWA installabile (manifest + SW + Lighthouse + icona Install) (verificato in Step 23.1-23.4)

---

## Stato finale del repository

A fine sprint, il repository contiene:
- ~25 file sorgente nuovi/modificati (config, types, schema, client, App, tests)
- ~10 cartelle vuote con `.gitkeep` (struttura feature-sliced pronta per Sprint 1)
- 1 cartella `public/icons/` con 1 SVG sorgente + 3 PNG generati
- 1 cartella `dist/` (gitignored) con build di produzione
- 1 cartella `node_modules/` (gitignored)

L'utente potrà committare quando vuole. Lo stato è coerente: la suite test è verde, il build funziona, l'app è servita.

---

## Riferimenti

- **Spec:** [`docs/superpowers/specs/2026-04-13-sprint0-setup-design.md`](../specs/2026-04-13-sprint0-setup-design.md)
- **Brainstorming:** [`docs/brainstorming/2026-04-13-sprint0-brainstorming-summary.md`](../../brainstorming/2026-04-13-sprint0-brainstorming-summary.md)
- **Architettura canonical:** [`.claude/architettura.md`](../../../.claude/architettura.md)
- **Piano di sviluppo:** [`.claude/development_plan.md`](../../../.claude/development_plan.md) §5 Sprint 0
