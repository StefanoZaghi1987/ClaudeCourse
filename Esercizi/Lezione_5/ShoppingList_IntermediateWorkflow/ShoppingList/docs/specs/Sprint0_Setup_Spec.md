# Spec — Sprint 0 Setup Infrastruttura ShoppingList

**Data:** 2026-04-13
**Autore:** Brainstorming Stefano Zaghi + Claude
**Stato:** Approvato per implementazione
**Brainstorming:** [`docs/brainstorming/2026-04-13-sprint0-brainstorming-summary.md`](../../brainstorming/2026-04-13-sprint0-brainstorming-summary.md)
**Piano padre:** [`.claude/development_plan.md`](../../../.claude/development_plan.md) §5 Sprint 0
**Architettura canonical:** [`.claude/architettura.md`](../../../.claude/architettura.md)

---

## 1. Scopo

Definire in modo non ambiguo cosa lo Sprint 0 produce, come lo produce e come si verifica che sia completo. Lo Sprint 0 setta l'infrastruttura del MVP ShoppingList in modo che lo Sprint 1 possa partire con tutti i layer (UI scheletro, persistence locale, types, test) già operativi.

**Non è in scope** alcuna feature di dominio (liste, articoli, auth, sync, sharing, catalog). Quelle arrivano in Sprint 1-5.

---

## 2. Vincoli ambientali

| Vincolo | Conseguenza |
|---|---|
| **Vercel non disponibile** | "App in produzione" = `npm run build` + `npm run preview` su `http://localhost:4173`. Deploy reale rimandato a quando un provider sarà disponibile. |
| **Supabase non disponibile** | Client Supabase creato con env vars placeholder. Funzione `isSupabaseConfigured()` esposta perché i layer futuri possano fare guard prima di invocare la rete. Nessuna chiamata reale a Supabase in Sprint 0. |
| **Struttura cartelle canonical** | Feature-sliced, da [`architettura.md`](../../../.claude/architettura.md). Supersede `development_plan.md §2.2` (deprecata). |
| **CI assente** | Verifiche eseguite localmente. CI rimandata a quando il repo sarà su un provider. |

---

## 3. Definition of Done (8 criteri verificabili)

| # | Criterio | Comando di verifica | Output atteso |
|---|---|---|---|
| 1 | Vite + React + TS attivo | `npm run dev` | Server su `:5173`, pagina rendering, zero errori console |
| 2 | Tailwind operativo | Aprire `localhost:5173` | Marker "Sprint 0 OK" è verde (`text-emerald-600`), non nero |
| 3 | Schema Dexie istanziabile | `npm test -- schema` | `schema.test.ts` verde, 5 tabelle dichiarate (`catalog`, `changes`, `invites`, `items`, `lists`) |
| 4 | Supabase client guarded | `npm test -- supabase` | `supabase.test.ts` verde, `isSupabaseConfigured()` ritorna `false` con env placeholder |
| 5 | Suite Vitest completa | `npm test` | 4 file di test, **5 test** totali (id:2, App:1, schema:1, supabase:1), tutti verdi |
| 6 | Build production senza errori | `npm run build` | `dist/` creato con `sw.js`, `manifest.webmanifest`, `assets/` |
| 7 | Preview locale serve l'app | `npm run preview` | `:4173` mostra "Sprint 0 OK", asset cachati dal SW |
| 8 | PWA installabile | DevTools → Application + Lighthouse | Manifest visibile (3 icone), SW attivo, Lighthouse "Installable" verde, icona "Installa app" nella barra indirizzi |

**Tutti gli 8 criteri devono essere verdi prima di chiudere lo sprint.** Nessuno è opzionale.

---

## 4. Architettura: tre fasi sequenziali

L'esecuzione segue **Approccio 3 — Layered**: tre fasi nette con checkpoint bloccanti tra una fase e l'altra. Saltare un checkpoint per "andare avanti" non è ammesso.

```
Fase 1 — TOOLING               Fase 2 — STRUTTURA E CONTENUTI         Fase 3 — SMOKE
─────────────────              ──────────────────────────────         ──────────────
Vite + React 18 + TS    →     features/{lists,items,auth,             vitest run
Tailwind 3                    catalog,sync}/                          npm run build
Vitest + jsdom + RTL          components/{ui,layout,shared}/          npm run preview
vite-plugin-pwa               services/{db,supabase}/                 verifica PWA
                              store/  hooks/  types/  utils/          installabile
                              types/domain.ts  types/sync.ts          locale
                              services/db/schema.ts (Dexie v1)
                              services/supabase/client.ts (guarded)
                              utils/id.ts  utils/date.ts
                              App.tsx (marker)
                              5 file di test smoke

Checkpoint 1: npm run dev   Checkpoint 2: npx tsc --noEmit         Checkpoint 3: DoD §3
```

**Razionale dell'ordine:** la struttura ha bisogno del tooling per compilarsi; lo smoke ha bisogno di entrambi per girare. Eseguire fuori ordine produce errori senza causa apparente.

---

## 5. Struttura cartelle target

Feature-sliced, da `architettura.md`. Le cartelle vuote ricevono `.gitkeep` per materializzare la struttura prima che ci sia codice.

```
ShoppingList/
├── package.json
├── vite.config.ts
├── tsconfig.json, tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .env.example                              # SOLO placeholder commentati
├── .env.local                                # gitignored, copia di .env.example
├── .gitignore                                # estende il preesistente
├── pwa-assets.config.ts                      # config @vite-pwa/assets-generator
├── public/
│   └── icons/
│       ├── source.svg                        # SVG sorgente (logo placeholder "S" emerald)
│       ├── pwa-192x192.png                   # generato (placeholder)
│       ├── pwa-512x512.png                   # generato (placeholder)
│       └── maskable-icon-512x512.png         # generato (placeholder)
├── src/
│   ├── main.tsx                              # generato da Vite, importa ./index.css
│   ├── index.css                             # @tailwind base/components/utilities
│   ├── App.tsx                               # BrowserRouter + marker "Sprint 0 OK"
│   ├── components/
│   │   ├── ui/.gitkeep                       # vuoto Sprint 0
│   │   ├── layout/.gitkeep                   # vuoto Sprint 0
│   │   └── shared/.gitkeep                   # vuoto Sprint 0
│   ├── features/
│   │   ├── lists/.gitkeep                    # vuoto Sprint 0
│   │   ├── items/.gitkeep                    # vuoto Sprint 0
│   │   ├── auth/.gitkeep                     # vuoto Sprint 0
│   │   ├── catalog/.gitkeep                  # vuoto Sprint 0
│   │   └── sync/.gitkeep                     # vuoto Sprint 0
│   ├── services/
│   │   ├── db/
│   │   │   └── schema.ts                     # Dexie v1, 5 tabelle
│   │   └── supabase/
│   │       └── client.ts                     # createClient + isSupabaseConfigured()
│   ├── store/.gitkeep                        # vuoto Sprint 0
│   ├── hooks/.gitkeep                        # vuoto Sprint 0
│   ├── types/
│   │   ├── domain.ts                         # tipi minimi Sprint 0
│   │   └── sync.ts                           # ChangeLog, SyncStatus
│   ├── utils/
│   │   ├── id.ts                             # newId() via crypto.randomUUID()
│   │   └── date.ts                           # now() helper
│   └── __tests__/
│       ├── setup.ts                          # @testing-library/jest-dom/vitest
│       ├── id.test.ts                        # smoke utility pura
│       ├── App.test.tsx                      # smoke React (jsdom + RTL)
│       ├── schema.test.ts                    # smoke Dexie + fake-indexeddb
│       └── supabase.test.ts                  # smoke guard
└── docs/
    ├── brainstorming/
    │   └── 2026-04-13-sprint0-brainstorming-summary.md
    └── superpowers/
        └── specs/
            └── 2026-04-13-sprint0-setup-design.md   ← questo file
```

**Nota sui `.gitkeep`:** sono volutamente presenti anche dove la cartella sarà popolata in Sprint 1. Costo zero, beneficio: gli sprint successivi non devono "pensare a dove mettere le cose".

---

## 6. Specifiche dei file sorgente

### 6.1 `package.json` — dipendenze e script

**Dipendenze runtime:**
- `react@^18.3.0`
- `react-dom@^18.3.0`
- `react-router-dom@^6`
- `zustand@^4` (installato, non usato in Sprint 0)
- `dexie@^3`
- `dexie-react-hooks@^1`
- `@supabase/supabase-js@^2`
- `uuid@^9`

**Dipendenze dev:**
- `typescript@^5`
- `vite@^5`
- `@vitejs/plugin-react@^4`
- `vite-plugin-pwa@^0` + `workbox-window`
- `tailwindcss@^3`, `postcss`, `autoprefixer`
- `vitest@^1`
- `@testing-library/react@^14`
- `@testing-library/user-event@^14`
- `@testing-library/jest-dom`
- `jsdom`
- `fake-indexeddb`
- `@types/uuid`, `@types/react`, `@types/react-dom`
- `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-plugin-react-hooks`
- `@vite-pwa/assets-generator` (tool ufficiale per generare le icone PWA placeholder dello sprint 0)

**Script:**
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

### 6.2 `vite.config.ts`

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

**Note:**
- `registerType: 'autoUpdate'`: il SW si aggiorna senza prompt utente. Conferma utente è una feature di Sprint 5.
- `devOptions.enabled: false`: SW disabilitato in dev per evitare interferenze con HMR.
- Sezione `test:` integrata nel `vite.config.ts` invece di `vitest.config.ts` separato: meno file da mantenere, alias condivisi automaticamente.

### 6.3 `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

Nessun theme custom in Sprint 0. Estensioni arrivano quando c'è UI vera da stilare.

### 6.4 `tsconfig.json` — chiavi obbligatorie

- `"strict": true`
- `"noUnusedLocals": true`
- `"noUnusedParameters": true`
- `"paths": { "@/*": ["./src/*"] }` allineato all'alias Vite
- `"jsx": "react-jsx"`
- `"moduleResolution": "bundler"`

### 6.5 `.env.example` e `.env.local`

```env
# .env.example — committato in repo, valori vuoti
# Popolare .env.local (gitignored) con i valori reali quando Supabase sarà disponibile
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_URL=http://localhost:5173
```

`.env.local` è una **copia identica** di `.env.example`. Serve perché `import.meta.env.VITE_*` non risolva `undefined`; `isSupabaseConfigured()` rileva la stringa vuota e ritorna `false`.

### 6.6 `.gitignore` — estensione

Aggiungere al `.gitignore` esistente:
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

Non sovrascrivere il `.gitignore` esistente: fare merge appendendo solo le righe nuove.

### 6.7 `src/types/domain.ts`

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

**Esclusioni deliberate** (espansione in Sprint 1):
- enum `Category` (8 valori)
- enum `UnitOfMeasure` (10 valori)
- `SharedMember`
- `UserSyncMeta`
- campi sync (`remoteId`, `lastSyncedAt`, `hasLocalChanges`)

**Razionale:** Sprint 0 ha bisogno di tipi che facciano compilare lo schema e i test smoke, non di tutta la specifica di dominio. Espandere ora significa congelare decisioni (es. categorie italiane vs internazionali) prima di averle validate con la UI di Sprint 1.

### 6.8 `src/types/sync.ts`

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

### 6.9 `src/services/db/schema.ts` — Dexie v1

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

**Decisioni di design:**
- `&id` (string PK) invece di `++id` (autoincrement): allinea con UUID v4 generati lato client, indispensabili per offline-first (un ID generato in offline non può dipendere dal server).
- Indice composito `[listId+deletedAt]` su `items`: permette query "items non eliminati di una lista" senza scan completo della tabella.
- `&name` su `catalog`: unique constraint per evitare duplicati nel catalogo articoli.
- **Niente `userSyncMeta`** in v1 — si aggiunge in Sprint 3 con `version(2)` + `.upgrade()`.
- **Mai modificare schema in-place**: ogni cambio = nuova `version(N).stores(...).upgrade(...)`.

### 6.10 `src/services/supabase/client.ts` — guarded

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

**Pattern guard:**
- `createClient` invocato sempre, anche con placeholder: l'import non ha side-effect distruttivi (è una funzione pura che costruisce un oggetto).
- Le chiamate effettive (es. `supabase.auth.signIn()`) **falliranno** se invocate con placeholder, ma il guard previene quelle invocazioni a livello di service.
- Pattern d'uso negli sprint successivi:
  ```typescript
  if (!isSupabaseConfigured()) return localOnlyResult
  // safe to call supabase here
  ```

### 6.11 `src/utils/id.ts`

```typescript
export const newId = (): string => crypto.randomUUID()
```

`crypto.randomUUID()` è disponibile in Node 19+ e jsdom 22+. Fallback al pacchetto `uuid` non necessario per gli ambienti target.

### 6.12 `src/utils/date.ts`

```typescript
export const now = (): number => Date.now()
```

Tutti i timestamp dell'app sono `number` (epoch ms). Convenzione del piano.

### 6.13 `src/App.tsx` — marker Sprint 0

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
- `text-emerald-600` valida la pipeline Tailwind: se è nero, il `content` glob in `tailwind.config.js` è sbagliato.
- `App.tsx` **non** importa da `services/db` né da `services/supabase`. Quei moduli sono toccati **solo** dai test in Sprint 0. Questo verifica che compilino e siano accessibili senza accoppiare prematuramente UI a persistence.

### 6.14 `src/__tests__/setup.ts`

```typescript
import '@testing-library/jest-dom/vitest'
```

Estende `expect` con i matcher di Testing Library (`toBeInTheDocument`, ecc.).

### 6.15 `src/__tests__/id.test.ts`

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

### 6.16 `src/__tests__/App.test.tsx`

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

### 6.17 `src/__tests__/schema.test.ts`

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

**Nota:** `import 'fake-indexeddb/auto'` deve essere la **prima riga**. Registra `indexedDB` come globale al primo import; senza di esso Dexie crasha in jsdom.

### 6.18 `src/__tests__/supabase.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { isSupabaseConfigured } from '../services/supabase/client'

describe('supabase client guard', () => {
  it('riporta non configurato quando le env vars sono placeholder', () => {
    expect(isSupabaseConfigured()).toBe(false)
  })
})
```

### 6.19 Generazione icone PWA placeholder

**Strumento:** [`@vite-pwa/assets-generator`](https://github.com/vite-pwa/assets-generator) — tool ufficiale del team `vite-plugin-pwa`. Genera tutte le icone PWA (192, 512, maskable, apple-touch) a partire da una singola immagine sorgente.

**Razionale del cambio rispetto al brainstorming:**
Durante la self-review è emerso che l'opzione "PNG base64 hardcoded in script Node senza dipendenze" è impraticabile in modo pulito: richiederebbe un encoder PNG manuale (~40 righe di bit-twiddling con `zlib`) o 3 stringhe base64 distinte committate, entrambe peggiori per chiarezza/manutenibilità di un singolo dev dep. La regola "no nuove dipendenze" del brainstorming è rilassata per questo caso specifico.

**Sorgente:** `public/icons/source.svg` — un SVG quadrato con il logo placeholder ShoppingList. Per Sprint 0 lo definiamo come un cerchio emerald `#10b981` con la lettera "S" bianca al centro. Esempio minimale:

```xml
<!-- public/icons/source.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#10b981"/>
  <text x="256" y="340" font-family="sans-serif" font-size="320"
        font-weight="bold" fill="white" text-anchor="middle">S</text>
</svg>
```

**Config:** `pwa-assets.config.ts` nella root del progetto.

```typescript
import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset,
  images: ['public/icons/source.svg'],
})
```

**Script `package.json`:**
```json
{
  "scripts": {
    "gen-icons": "pwa-assets-generator --preset minimal-2023 public/icons/source.svg"
  }
}
```

**Esecuzione:** `npm run gen-icons` — produce in `public/icons/` (o nel path configurato) almeno:
- `pwa-192x192.png`
- `pwa-512x512.png`
- `maskable-icon-512x512.png`

I path generati vanno **allineati** a quelli citati nel manifest `vite.config.ts` (§6.2). Se il preset usa nomi diversi (`pwa-192x192.png` vs `icon-192.png`), aggiornare il manifest di conseguenza al momento dell'implementazione.

**Vincolo:** lo script `gen-icons` viene eseguito **una volta** in Fase 2 dell'esecuzione (passo 11). I PNG generati vengono committati come artefatti placeholder. Asset definitivi in Sprint 5.

---

## 7. Sequenza di esecuzione

### Fase 1 — TOOLING

```bash
# 1.1 Init Vite in root (la cartella ha solo .claude/, CLAUDE.md, .gitignore)
npm create vite@latest . -- --template react-ts
# Confermare "y" alla richiesta di creare in cartella non vuota
# NON sovrascrivere .gitignore esistente: merge manuale (vedi §6.6)

# 1.2 Install dipendenze runtime
npm install zustand dexie dexie-react-hooks @supabase/supabase-js \
  react-router-dom uuid

# 1.3 Install dipendenze dev
npm install -D tailwindcss postcss autoprefixer \
  vite-plugin-pwa workbox-window @vite-pwa/assets-generator \
  vitest @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom jsdom fake-indexeddb \
  @types/uuid

# 1.4 Init Tailwind
npx tailwindcss init -p
```

**Checkpoint 1:** `npm run dev` apre `:5173` con la pagina Vite default. Se fallisce → STOP, debug prima di Fase 2.

### Fase 2 — STRUTTURA E CONTENUTI

1. Sostituire `vite.config.ts` con la versione §6.2
2. Sostituire `tailwind.config.js` con §6.3
3. Aggiornare `tsconfig.json` con le chiavi §6.4
4. Creare `.env.example` e `.env.local` (§6.5)
5. Estendere `.gitignore` (§6.6)
6. Creare cartelle vuote con `.gitkeep`:
   - `src/components/{ui,layout,shared}/`
   - `src/features/{lists,items,auth,catalog,sync}/`
   - `src/store/`
   - `src/hooks/`
7. Scrivere file sorgente:
   - `src/types/domain.ts` (§6.7)
   - `src/types/sync.ts` (§6.8)
   - `src/services/db/schema.ts` (§6.9)
   - `src/services/supabase/client.ts` (§6.10)
   - `src/utils/id.ts` (§6.11)
   - `src/utils/date.ts` (§6.12)
   - `src/App.tsx` (§6.13)
8. Aggiornare `src/main.tsx` per importare `./index.css`
9. Creare `src/index.css` con `@tailwind base/components/utilities`
10. Scrivere file di test:
    - `src/__tests__/setup.ts` (§6.14)
    - `src/__tests__/id.test.ts` (§6.15)
    - `src/__tests__/App.test.tsx` (§6.16)
    - `src/__tests__/schema.test.ts` (§6.17)
    - `src/__tests__/supabase.test.ts` (§6.18)
11. Creare `public/icons/source.svg` + `pwa-assets.config.ts` (§6.19), poi eseguire `npm run gen-icons` per generare le 3 icone in `public/icons/`. **Allineare** i path delle icone in `vite.config.ts` (§6.2) ai nomi effettivamente prodotti dal tool.
12. Aggiornare `package.json` script (§6.1)

**Checkpoint 2:** `npx tsc --noEmit` ritorna senza errori. Se fallisce → STOP, sistemare prima di Fase 3.

### Fase 3 — SMOKE

```bash
# 3.1 Test suite
npm test
# atteso: 4 file di test, 5 test, tutti verdi

# 3.2 Build production
npm run build
# atteso: dist/ creato con sw.js, manifest.webmanifest, assets/

# 3.3 Preview locale
npm run preview
# atteso: http://localhost:4173 mostra "Sprint 0 OK" verde
```

**Verifica PWA manuale** in Chrome:
1. Apri preview in Chrome
2. DevTools → Application → Manifest: verifica nome + 3 icone
3. DevTools → Application → Service Workers: SW attivo
4. Lighthouse → PWA audit: "Installable" verde
5. Barra indirizzi: icona "Installa app" presente

**Checkpoint 3:** tutti gli 8 criteri della Definition of Done (§3) verificati.

---

## 8. Error handling e rischi

### 8.1 Rischi noti e mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| `npm create vite` su cartella non vuota fallisce o sovrascrive contenuti | Media | Alto | Verifico prima che `.claude/`, `CLAUDE.md`, `.gitignore` siano gli unici file presenti. Conferma "yes to non-empty". `.gitignore` merge manuale, mai sovrascritto. |
| `vite-plugin-pwa` versione recente cambia API manifest | Bassa | Medio | Pin major `^0.x` dal piano. Test build subito dopo install (Fase 3 immediata). |
| `fake-indexeddb` non si registra perché importato dopo Dexie | Bassa | Medio | Import `'fake-indexeddb/auto'` come **prima** riga di `schema.test.ts`. ESLint rule `import/order` rispettata. |
| Tailwind non applica gli stili (`content` glob sbagliato) | Media | Basso | Marker "Sprint 0 OK" usa `text-emerald-600`. Se nero invece che verde → fix `tailwind.config.js`. |
| Service worker dev mode interferisce con HMR | Media | Basso | `vite-plugin-pwa` con `devOptions.enabled: false`. |
| `crypto.randomUUID` non disponibile | Bassa | Basso | Node 19+ e jsdom 22+ lo supportano. Fallback a `uuid` package se necessario. |
| Path `@/` alias funziona in Vite ma non in Vitest | Media | Medio | Config `test:` integrata in `vite.config.ts` eredita gli alias automaticamente. |
| Dexie crasha all'import in Node senza shim IndexedDB | Alta in test | Alto in test | `fake-indexeddb/auto` import in **ogni** test che tocca `db`. |

### 8.2 Pattern error handling Sprint 0

**Supabase client guard** (§6.10): `isSupabaseConfigured()` previene crash a runtime con env placeholder. **Non** è un fallback silent: se in Sprint 2+ qualcuno chiama `supabase.auth.signIn()` senza guard, il SDK lancia un errore esplicito.

**Schema Dexie versioning**: mai modificare `version(1).stores(...)` in-place. Ogni cambio = nuova `version(N)` con `.upgrade()`. Sprint 0 stabilisce la regola; Sprint 3 la applicherà per la prima volta.

**Test failures = build failures**: `npm test` è parte della Definition of Done. Niente "test rossi che fixiamo dopo".

---

## 9. Debiti tecnici accettati esplicitamente

| Debito | Quando si paga |
|---|---|
| Struttura A (feature-sliced) ≠ path nei task S1-S5 del piano | Sprint 1: ogni task traduce path tramite tabella in `development_plan.md §2.2` (~5 min/task) |
| Tipi minimi in `domain.ts` (no `Category`, `UnitOfMeasure`, `SharedMember`) | Sprint 1: espansione tipi al primo `ItemFormModal` |
| Stub Zustand stores assenti | Sprint 1: creazione `useListStore.ts` con pattern di `architettura.md` |
| Icone PWA placeholder monocromatiche | Sprint 5 ("Refinement"): asset definitivi |
| Niente CI (GitHub Actions) | Quando il repo sarà su un provider |
| Niente RLS/DDL Supabase | Sprint 2 (Auth) — primo sprint che parla col cloud |
| `App.tsx` ha una sola route placeholder | Sprint 1: routing reale con `HomePage`, `ListPage`, ecc. |

---

## 10. Fuori scope esplicito Sprint 0

- ❌ Componenti UI di dominio (`ListCard`, `ItemRow`, ecc.) — Sprint 1
- ❌ Pagine reali (solo `<h1>Sprint 0 OK</h1>` come marker) — Sprint 1
- ❌ Repository (`listRepository.ts`) — Sprint 1
- ❌ Service di dominio (`listService.ts`) — Sprint 1
- ❌ Store Zustand popolati (cartella esiste vuota) — Sprint 1
- ❌ Autenticazione funzionante (client esiste, login form) — Sprint 2
- ❌ Test E2E Playwright — Sprint 5
- ❌ Logica di sincronizzazione — Sprint 3
- ❌ Deploy reale — quando provider disponibile
- ❌ RLS Supabase — Sprint 2
- ❌ Icone PWA definitive — Sprint 5
- ❌ Migrazioni Dexie v2+ — Sprint 3+
- ❌ Logging strutturato (`logger`) — Sprint 1
- ❌ Error boundary React — Sprint 1
- ❌ `Result<T,E>` type per error handling — Sprint 1

---

## 11. Riferimenti

- **Brainstorming completo:** [`docs/brainstorming/2026-04-13-sprint0-brainstorming-summary.md`](../../brainstorming/2026-04-13-sprint0-brainstorming-summary.md)
- **Piano di sviluppo (canonical per gli sprint):** [`.claude/development_plan.md`](../../../.claude/development_plan.md)
- **Architettura (canonical per la struttura cartelle):** [`.claude/architettura.md`](../../../.claude/architettura.md)
- **CLAUDE.md (principi fondamentali):** [`CLAUDE.md`](../../../CLAUDE.md)

---

## 12. Prossimi passi

1. ✅ Brainstorming
2. ✅ Riassunto brainstorming + aggiornamento file di piano
3. ✅ Spec dettagliata (questo documento)
4. ⏭ Self-review della spec
5. ⏭ Review utente sulla spec
6. ⏭ Invocare skill `writing-plans` per generare il piano di implementazione
7. ⏭ Esecuzione delle 3 fasi (tooling → struttura → smoke) seguendo il piano
