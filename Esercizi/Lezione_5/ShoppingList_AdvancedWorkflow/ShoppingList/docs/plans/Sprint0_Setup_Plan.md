# Sprint 0 — Setup Infrastruttura: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **User constraint:** L'utente gestisce git autonomamente. Non eseguire `git add/commit/push` — ad ogni "Checkpoint" l'utente revisionerà e committerà manualmente.

**Goal:** Scaffoldare il repo ShoppingList da vuoto a skeleton offline-only funzionante: DB Dexie v1 inizializzato, stub Supabase tipizzato, PWA installabile da preview locale HTTPS, test smoke Vitest verdi, strict TypeScript + ESLint 9 flat config + Tailwind 3 attivi.

**Architecture:** PWA React 18 offline-first. Dexie 4 come source of truth locale (DB schema da SRS §4.2/4.3). Stub Supabase tipizzato (nessuna connessione di rete, URL invalido) per preservare i tipi senza accoppiamento al backend. Routing con React Router 6. State con Zustand (auth-store funzionale, list/ui placeholder). Build+preview con Vite 5 + `@vitejs/plugin-basic-ssl` per HTTPS locale + `vite-plugin-pwa` per manifest/SW.

**Tech Stack:** React 18, TypeScript 5.5 strict, Vite 5, Dexie 4, Zustand 4, React Router 6, Tailwind 3, vite-plugin-pwa + Workbox, ESLint 9 flat config, Prettier 3, Vitest 2 + Testing Library + fake-indexeddb, Playwright 1.46 (config-only), sharp 0.33 (one-shot icon gen).

**Spec di riferimento:** [`docs/superpowers/specs/2026-04-13-sprint-0-setup-design.md`](../specs/2026-04-13-sprint-0-setup-design.md)

**Brainstorm summary:** [`docs/superpowers/brainstorms/2026-04-13-sprint-0-setup-brainstorm.md`](../brainstorms/2026-04-13-sprint-0-setup-brainstorm.md)

**Prerequisiti esecuzione:**
- Working directory: `D:/VibeCoding/ClaudeCourse/Esercizi/Lezione_5/ShoppingList_AdvancedWorkflow/ShoppingList/`
- Node.js >= 20 installato
- npm >= 10 installato
- Connessione internet per `npm install` (una sola volta)

**Convenzione per i percorsi:** tutti i path nel plan sono **relativi** alla solution root `ShoppingList/` a meno che non sia specificato altrimenti. Non guardare mai al di sopra di `ShoppingList/`.

**Ordine di esecuzione tasks:** sequenziale (ogni task dipende dal precedente). Non parallelizzare.

---

## Task 1: Bootstrap manuale — package.json + npm install

**Files:**
- Create: `package.json`

**Razionale:** il piano-sviluppo originale suggeriva `npm create vite@latest`, ma quel comando fallisce in directory non vuota (il nostro repo contiene già `CLAUDE.md`, `docs/`, `.claude/`). Creazione manuale = 100% deterministica, zero file auto-generati da pulire.

- [ ] **Step 1.1: Crea `package.json` con contenuto esatto**

Scrivi `package.json` con questo contenuto (preso dal spec §5.1, §5.2, §5.3, §7.31):

```json
{
  "name": "shoppinglist",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b --noEmit",
    "lint": "eslint src --max-warnings 0",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css}\"",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:install": "playwright install chromium",
    "gen:icons": "node scripts/gen-icons.mjs"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "dexie": "^4.0.0",
    "dexie-react-hooks": "^1.1.7",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.46.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "@vitejs/plugin-basic-ssl": "^1.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@vitest/coverage-v8": "^2.0.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.9.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^24.1.0",
    "postcss": "^8.4.0",
    "prettier": "^3.3.0",
    "sharp": "^0.33.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^2.0.0",
    "workbox-window": "^7.1.0"
  }
}
```

- [ ] **Step 1.2: Verifica che `package.json` esista**

Run: `ls -la package.json`
Expected: file presente, size > 0.

- [ ] **Step 1.3: Installa dipendenze**

Run: `npm install`
Expected: installazione completa senza errori. Creazione di `node_modules/` e `package-lock.json`. Alcuni warning di peer dependencies sono accettabili (es. su `eslint-plugin-*`), ma zero errori.

- [ ] **Step 1.4: Audit di sicurezza**

Run: `npm audit --audit-level=high`
Expected: exit code 0 (0 vulnerabilità high o critical). Se ci sono vulnerabilità moderate o basse, sono accettabili e non bloccano.

- [ ] **Step 1.5: Checkpoint utente**

Stato atteso: `package.json`, `package-lock.json`, `node_modules/` presenti. Nessun altro file creato in questo task.

---

## Task 2: TypeScript configuration strict

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`

- [ ] **Step 2.1: Crea `tsconfig.json`**

Contenuto esatto (spec §7.2):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": [
      "vite/client",
      "vitest/globals",
      "@testing-library/jest-dom",
      "vite-plugin-pwa/client"
    ]
  },
  "include": ["src", "src/test/setup.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 2.2: Crea `tsconfig.node.json`**

Contenuto esatto (spec §7.3):

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "tailwind.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 2.3: Checkpoint utente**

Stato atteso: entrambi i file esistono. Non eseguire `tsc` ancora — in questo momento `src/` non esiste e mancano `vite.config.ts`/`vitest.config.ts`/ecc. citati in `tsconfig.node.json`. Il typecheck avverrà dopo aver creato questi file.

---

## Task 3: Tailwind CSS + PostCSS configuration

**Files:**
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`

- [ ] **Step 3.1: Crea `tailwind.config.ts`**

Contenuto esatto (spec §7.7):

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#ecfdf5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 3.2: Crea `postcss.config.js`**

Contenuto esatto (spec §7.8):

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 3.3: Checkpoint utente**

Stato atteso: `tailwind.config.ts`, `postcss.config.js` esistono.

---

## Task 4: ESLint flat config + Prettier

**Files:**
- Create: `eslint.config.js`
- Create: `.prettierrc.json`

- [ ] **Step 4.1: Crea `eslint.config.js`**

Contenuto esatto (spec §7.9):

```javascript
import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettierConfig from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...tsPlugin.configs['recommended-type-checked'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
    },
  },
  prettierConfig,
]
```

- [ ] **Step 4.2: Crea `.prettierrc.json`**

Contenuto esatto (spec §7.10):

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

- [ ] **Step 4.3: Checkpoint utente**

Stato atteso: entrambi i file esistono. Non eseguire `npm run lint` ancora — `src/` non esiste.

---

## Task 5: Vite configuration con PWA + HTTPS

**Files:**
- Create: `vite.config.ts`

- [ ] **Step 5.1: Crea `vite.config.ts`**

Contenuto esatto (spec §7.4):

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons/pwa-192.png', 'icons/pwa-512.png'],
      manifest: {
        name: 'ShoppingList',
        short_name: 'ShoppingList',
        description: 'Lista della spesa offline-first collaborativa',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'it',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxAgeSeconds: 31536000 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    https: true,
    host: true,
    port: 5173,
  },
  preview: {
    https: true,
    host: true,
    port: 4173,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
})
```

- [ ] **Step 5.2: Checkpoint utente**

Stato atteso: `vite.config.ts` esiste. Non eseguire `vite build` ancora — `index.html` e `src/main.tsx` mancano.

---

## Task 6: `index.html` + `.env.example`

**Files:**
- Create: `index.html`
- Create: `.env.example`

- [ ] **Step 6.1: Crea `index.html`**

Contenuto esatto (spec §7.1):

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#10b981" />
    <meta name="description" content="Lista della spesa offline-first collaborativa" />
    <title>ShoppingList</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6.2: Crea `.env.example`**

Contenuto esatto (spec §7.11):

```bash
# Sprint 0: queste variabili non sono usate (Supabase stubbed).
# Sprint futuro "Backend Activation": popolare con credenziali reali.
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 6.3: Checkpoint utente**

Stato atteso: entrambi i file esistono.

---

## Task 7: Icone PWA — script generazione + SVG placeholder

**Files:**
- Create: `public/favicon.svg`
- Create: `scripts/gen-icons.mjs`
- Generate: `public/icons/pwa-192.png`, `public/icons/pwa-512.png`

**Razionale:** le icone PNG sono richieste dal manifest PWA (`vite.config.ts` §7.4). Senza di esse `vite build` produce warning e `manifest.webmanifest` punta a file inesistenti. Le genero ora con uno script one-shot basato su `sharp`.

- [ ] **Step 7.1: Crea directory `public/`**

Run: `mkdir -p public/icons`
Expected: directory create.

- [ ] **Step 7.2: Crea directory `scripts/`**

Run: `mkdir -p scripts`
Expected: directory creata.

- [ ] **Step 7.3: Crea `public/favicon.svg`**

Contenuto esatto (spec §7.31):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#10b981"/>
  <text x="50%" y="50%" font-size="32" font-family="system-ui" fill="white" text-anchor="middle" dy="0.35em">S</text>
</svg>
```

- [ ] **Step 7.4: Crea `scripts/gen-icons.mjs`**

Contenuto esatto (spec §7.31):

```javascript
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = resolve(__dirname, '../public/favicon.svg')
const outDir = resolve(__dirname, '../public/icons')

mkdirSync(outDir, { recursive: true })

const svg = readFileSync(svgPath)

for (const size of [192, 512]) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(resolve(outDir, `pwa-${size}.png`))
  console.log(`✓ pwa-${size}.png generato`)
}
```

- [ ] **Step 7.5: Genera le icone PNG**

Run: `npm run gen:icons`
Expected output:
```
✓ pwa-192.png generato
✓ pwa-512.png generato
```

- [ ] **Step 7.6: Verifica file PNG generati**

Run: `ls -la public/icons/`
Expected: `pwa-192.png` e `pwa-512.png` entrambi con size > 1000 bytes.

- [ ] **Step 7.7: Checkpoint utente**

Stato atteso: `public/favicon.svg`, `public/icons/pwa-192.png`, `public/icons/pwa-512.png`, `scripts/gen-icons.mjs` esistono.

---

## Task 8: Dexie entity types (SRS §4.3)

**Files:**
- Create: `src/db/types.ts`

**Razionale:** questo è il contratto di tipi per tutto il data layer. Deve essere creato prima di `database.ts` che lo importa.

- [ ] **Step 8.1: Crea directory `src/db/`**

Run: `mkdir -p src/db`
Expected: directory creata.

- [ ] **Step 8.2: Crea `src/db/types.ts`**

Contenuto esatto (spec §7.17, derivato letteralmente da SRS Sezione 4.3 righe 910–1015):

```typescript
// src/db/types.ts
// Tipi per le entità del database locale Dexie.
// Fonte autoritativa: docs/SoftwareRequirements.md Sezione 4.3
// In caso di discrepanza con .claude/architettura.md, l'SRS vince.

// ─── Enums ──────────────────────────────────────────────────

export type Permission = 'owner' | 'editor' | 'viewer'
export type ListStatus = 'active' | 'archived'
export type ItemStatus = 'pending' | 'completed'
export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATE_CHANGE'
export type EntityType = 'LIST' | 'ITEM' | 'INVITE'
export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired'
export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'error' | 'offline'

export type UnitOfMeasure =
  | 'kg' | 'g' | 'mg'
  | 'l' | 'ml' | 'cl'
  | 'pcs' | 'pack' | 'box' | 'bottle' | 'can' | 'bag'

export type Category =
  | 'fruits_vegetables'
  | 'dairy'
  | 'meat_fish'
  | 'beverages'
  | 'frozen'
  | 'pantry'
  | 'bakery'
  | 'cleaning'
  | 'personal_care'
  | 'other'

// ─── Entità ─────────────────────────────────────────────────

export interface ShareEntry {
  userId: string
  permission: Exclude<Permission, 'owner'>
  invitedAt: number
  invitedBy: string
}

export interface List {
  id: string
  name: string
  userId: string
  status: ListStatus
  isTemplate: boolean
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  sharedWith: ShareEntry[]
  itemOrder: string[]
  syncedAt: number | null
}

export interface Item {
  id: string
  listId: string
  name: string
  quantity: number | null
  unit: UnitOfMeasure | null
  notes: string | null
  category: Category | null
  status: ItemStatus
  sortOrder: number
  createdAt: number
  updatedAt: number
  completedAt: number | null
  deletedAt: number | null
  createdBy: string
  updatedBy: string
}

export interface ChangeLogEntry {
  id: string
  userId: string
  operationType: OperationType
  entityType: EntityType
  entityId: string
  changes: {
    before: Partial<List | Item> | null
    after: Partial<List | Item> | null
  }
  timestamp: number
  synced: boolean
  syncedAt: number | null
  conflictResolution: string | null
}

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

export interface Invite {
  token: string
  listId: string
  permission: Exclude<Permission, 'owner'>
  createdBy: string
  createdAt: number
  expiresAt: number
  status: InviteStatus
  invitedEmail: string | null
}
```

- [ ] **Step 8.3: Checkpoint utente**

Stato atteso: `src/db/types.ts` esiste.

---

## Task 9: Dexie database schema v1

**Files:**
- Create: `src/db/database.ts`

- [ ] **Step 9.1: Crea `src/db/database.ts`**

Contenuto esatto (spec §7.18, derivato da SRS Sezione 4.2 righe 795–826):

```typescript
// src/db/database.ts
// Schema Dexie v1 — fonte autoritativa: docs/SoftwareRequirements.md Sezione 4.2
// REGOLA: MAI modificare una .version() già esistente.
// Nuove modifiche → nuova .version(N).stores({}).upgrade(...)

import Dexie, { type Table } from 'dexie'
import type { List, Item, ChangeLogEntry, CatalogItem, Invite } from '@/db/types'

export class ShoppingListDB extends Dexie {
  lists!: Table<List, string>
  items!: Table<Item, string>
  changeLog!: Table<ChangeLogEntry, string>
  itemCatalog!: Table<CatalogItem, string>
  invites!: Table<Invite, string>

  constructor() {
    super('ShoppingListDB')
    this.version(1).stores({
      lists: '&id, userId, updatedAt, status, isTemplate',
      items: '&id, listId, [listId+status], [listId+deletedAt], createdAt, updatedAt',
      changeLog: '&id, [userId+synced], entityType, entityId, timestamp',
      itemCatalog: '&id, &name, userId, frequency',
      invites: '&token, listId, status',
    })
  }
}

export const db = new ShoppingListDB()
```

- [ ] **Step 9.2: Verifica typecheck parziale**

Run: `npx tsc --noEmit src/db/types.ts src/db/database.ts --moduleResolution bundler --module esnext --target es2022 --jsx react-jsx --strict --esModuleInterop --baseUrl . --paths '{"@/*":["src/*"]}'`

Nota: questo è un typecheck isolato per verificare che questi due file compilino senza errori. Il typecheck full del progetto avverrà dopo Task 17.

Expected: exit code 0, zero errori.

- [ ] **Step 9.3: Checkpoint utente**

Stato atteso: `src/db/types.ts` e `src/db/database.ts` esistono, compilano isolatamente.

---

## Task 10: Supabase client stub tipizzato

**Files:**
- Create: `src/lib/supabase.ts`

**Razionale:** stub verso URL invalido (vedi spec §4.2 Decisione 1). I tipi sono reali, le chiamate falliranno con errore di rete — comportamento intenzionale.

- [ ] **Step 10.1: Crea directory `src/lib/`**

Run: `mkdir -p src/lib`
Expected: directory creata.

- [ ] **Step 10.2: Crea `src/lib/supabase.ts`**

Contenuto esatto (spec §7.19):

```typescript
// src/lib/supabase.ts
// STUB tipizzato — Sprint 0 non ha Supabase Cloud disponibile.
// Mantiene la stessa shape di SupabaseClient così il codice futuro non cambia.
// Quando il progetto Supabase sarà disponibile, sostituire con createClient reale
// usando VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (vedi CLAUDE.md "Riattivazione backend").

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const STUB_URL = 'https://stub.invalid'
const STUB_KEY = 'stub-anon-key-not-a-real-credential'

/**
 * Client Supabase stub.
 *
 * Il client è creato con createClient reale verso un URL invalido.
 * Qualsiasi chiamata .from(), .auth.signIn() etc. fallirà con errore di rete.
 * Questo è INTENZIONALE: vogliamo che il codice che tenta una chiamata
 * Supabase in Sprint 0 fallisca rumorosamente, non silenziosamente.
 */
export const supabase: SupabaseClient = createClient(STUB_URL, STUB_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

/**
 * Flag runtime per narrowing "siamo in stub mode?".
 * Usato da auth-store per ritornare un userId locale invece di auth.getUser().
 */
export const SUPABASE_IS_STUB = true as const
```

- [ ] **Step 10.3: Checkpoint utente**

Stato atteso: `src/lib/supabase.ts` esiste.

---

## Task 11: Zustand stores — auth funzionale + list/ui placeholder

**Files:**
- Create: `src/stores/auth-store.ts`
- Create: `src/stores/list-store.ts`
- Create: `src/stores/ui-store.ts`

- [ ] **Step 11.1: Crea directory `src/stores/`**

Run: `mkdir -p src/stores`
Expected: directory creata.

- [ ] **Step 11.2: Crea `src/stores/auth-store.ts`**

Contenuto esatto (spec §7.20):

```typescript
// src/stores/auth-store.ts
// Sprint 0: stub funzionale. Ritorna sempre un userId locale fisso.
// Sprint 2 (Autenticazione) sostituirà l'implementazione reale con Supabase auth.

import { create } from 'zustand'

type AuthState = {
  userId: string
  isGuest: boolean
  isAuthenticated: boolean
}

export const useAuthStore = create<AuthState>(() => ({
  userId: 'local-user-stub',
  isGuest: true,
  isAuthenticated: false,
}))

/**
 * Helper non-hook per services/repositories (fuori da React).
 */
export function getCurrentUserId(): string {
  return useAuthStore.getState().userId
}
```

- [ ] **Step 11.3: Crea `src/stores/list-store.ts`**

Contenuto esatto (spec §7.21):

```typescript
// src/stores/list-store.ts — placeholder, popolato in Sprint 1
import { create } from 'zustand'

type ListState = Record<string, never>
export const useListStore = create<ListState>(() => ({}))
```

- [ ] **Step 11.4: Crea `src/stores/ui-store.ts`**

Contenuto esatto (spec §7.22):

```typescript
// src/stores/ui-store.ts — placeholder, popolato in Sprint 1
import { create } from 'zustand'

type UIState = Record<string, never>
export const useUIStore = create<UIState>(() => ({}))
```

- [ ] **Step 11.5: Checkpoint utente**

Stato atteso: tre file stores esistono.

---

## Task 12: Types UI + constants

**Files:**
- Create: `src/types/ui.ts`
- Create: `src/constants/index.ts`

- [ ] **Step 12.1: Crea directory `src/types/`**

Run: `mkdir -p src/types`
Expected: directory creata.

- [ ] **Step 12.2: Crea `src/types/ui.ts`**

Contenuto esatto (spec §7.23):

```typescript
// src/types/ui.ts
import type { SyncStatus } from '@/db/types'

export type AppError = {
  code:
    | 'VALIDATION_ERROR'
    | 'NETWORK_ERROR'
    | 'PERMISSION_DENIED'
    | 'NOT_FOUND'
    | 'SUPABASE_NOT_CONFIGURED'
    | 'UNKNOWN_ERROR'
  message: string
  details?: unknown
}

export type AppResult<T> =
  | { data: T; error: null }
  | { data: null; error: AppError }

export type { SyncStatus }
```

- [ ] **Step 12.3: Crea directory `src/constants/`**

Run: `mkdir -p src/constants`
Expected: directory creata.

- [ ] **Step 12.4: Crea `src/constants/index.ts`**

Contenuto esatto (spec §7.24):

```typescript
// src/constants/index.ts — placeholder, popolato negli sprint successivi
export {}
```

- [ ] **Step 12.5: Checkpoint utente**

Stato atteso: `src/types/ui.ts`, `src/constants/index.ts` esistono.

---

## Task 13: CSS base — Tailwind directives

**Files:**
- Create: `src/index.css`

- [ ] **Step 13.1: Crea `src/index.css`**

Contenuto esatto (spec §7.12):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body, #root {
    height: 100%;
  }
  body {
    @apply bg-white text-gray-900 antialiased;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  }
}
```

- [ ] **Step 13.2: Checkpoint utente**

Stato atteso: `src/index.css` esiste.

---

## Task 14: Vitest configuration + test setup

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 14.1: Crea `vitest.config.ts`**

Contenuto esatto (spec §7.5):

```typescript
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.config.*',
          '**/*.d.ts',
          'e2e/',
        ],
      },
    },
  }),
)
```

- [ ] **Step 14.2: Crea directory `src/test/`**

Run: `mkdir -p src/test`
Expected: directory creata.

- [ ] **Step 14.3: Crea `src/test/setup.ts`**

Contenuto esatto (spec §7.25):

```typescript
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 14.4: Checkpoint utente**

Stato atteso: `vitest.config.ts`, `src/test/setup.ts` esistono.

---

## Task 15: TDD Step 1 — Write the failing test FIRST

**Files:**
- Create: `src/test/app.test.tsx`

**Razionale TDD:** scrivo il test **prima** di qualsiasi codice applicativo (`app.tsx`, `home-page.tsx`, `not-found-page.tsx`, `main.tsx`). Il test deve fallire con errori di modulo non trovato (`@/app` non esiste). Poi nei task successivi creo i componenti uno alla volta e rieseguo il test.

- [ ] **Step 15.1: Crea `src/test/app.test.tsx`**

Contenuto esatto (spec §7.26):

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '@/app'

describe('App', () => {
  it('mostra "Hello World" sulla home page', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello World')
  })

  it('mostra 404 su route sconosciuta', () => {
    render(
      <MemoryRouter initialEntries={['/rotta-inesistente']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404')
  })
})
```

- [ ] **Step 15.2: Run test e verifica il FALLIMENTO atteso**

Run: `npm run test`
Expected: **FAIL** con errore del tipo:
- `Error: Failed to resolve import "@/app" from "src/test/app.test.tsx"` oppure
- `Cannot find module '@/app'`

Questo fallimento è **atteso** e **corretto**. Il test è scritto, i componenti non esistono, quindi il test deve fallire. Procedere al Task 16.

- [ ] **Step 15.3: Checkpoint utente**

Stato atteso: `src/test/app.test.tsx` esiste. Il test fallisce in modo prevedibile (import non trovato). Questa è la fase **RED** di TDD — da risolvere nei task successivi.

---

## Task 16: TDD Step 2 — Home page

**Files:**
- Create: `src/pages/home-page.tsx`

- [ ] **Step 16.1: Crea directory `src/pages/`**

Run: `mkdir -p src/pages`
Expected: directory creata.

- [ ] **Step 16.2: Crea `src/pages/home-page.tsx`**

Contenuto esatto (spec §7.15):

```typescript
export default function HomePage(): JSX.Element {
  return (
    <main className="flex min-h-full flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-brand-600">Hello World</h1>
      <p className="mt-2 text-gray-600">ShoppingList — Sprint 0 skeleton</p>
    </main>
  )
}
```

- [ ] **Step 16.3: Checkpoint utente**

Stato atteso: `src/pages/home-page.tsx` esiste. Il test fallisce ancora (manca `NotFoundPage` e `App`).

---

## Task 17: TDD Step 3 — Not Found page

**Files:**
- Create: `src/pages/not-found-page.tsx`

- [ ] **Step 17.1: Crea `src/pages/not-found-page.tsx`**

Contenuto esatto (spec §7.16):

```typescript
export default function NotFoundPage(): JSX.Element {
  return (
    <main className="flex min-h-full flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-semibold">404 — Pagina non trovata</h1>
    </main>
  )
}
```

- [ ] **Step 17.2: Checkpoint utente**

Stato atteso: `src/pages/not-found-page.tsx` esiste. Il test fallisce ancora (manca `App`).

---

## Task 18: TDD Step 4 — App component con routing

**Files:**
- Create: `src/app.tsx`

- [ ] **Step 18.1: Crea `src/app.tsx`**

Contenuto esatto (spec §7.14):

```typescript
import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/home-page'
import NotFoundPage from '@/pages/not-found-page'

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
```

- [ ] **Step 18.2: TDD Step 5 — Run test e verifica il PASS (fase GREEN)**

Run: `npm run test`
Expected: **PASS** con 2 test verdi:
```
✓ src/test/app.test.tsx (2)
  ✓ App (2)
    ✓ mostra "Hello World" sulla home page
    ✓ mostra 404 su route sconosciuta

Test Files  1 passed (1)
     Tests  2 passed (2)
```

Se i test falliscono, **NON** procedere al Task 19. Analizzare il motivo del fallimento:
- Import path alias `@/` non risolto → verificare `vite.config.ts` `resolve.alias` e `vitest.config.ts` `mergeConfig`
- `JSX.Element` non riconosciuto → verificare `tsconfig.json` `jsx: "react-jsx"` e `types: ["vite/client", ...]`
- `toHaveTextContent` non riconosciuto → verificare `src/test/setup.ts` import di `@testing-library/jest-dom/vitest`

- [ ] **Step 18.3: Checkpoint utente**

Stato atteso: `src/app.tsx` esiste. I 2 test Vitest passano. Questa è la fase **GREEN** di TDD — test implementati e verdi.

---

## Task 19: Entry point `main.tsx`

**Files:**
- Create: `src/main.tsx`

**Razionale:** `main.tsx` non è coperto dai test Vitest (i test usano `MemoryRouter`, non `BrowserRouter` che è in `main.tsx`). Viene creato dopo il TDD perché abilita solo il dev server e il build, non influenza i test.

- [ ] **Step 19.1: Crea `src/main.tsx`**

Contenuto esatto (spec §7.13):

```typescript
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from '@/app'
import { db } from '@/db/database'
import '@/index.css'

db.open()
  .then(() => console.log('[db] ShoppingListDB v1 opened'))
  .catch((err: unknown) => console.error('[db] init failed', err))

registerSW({
  onNeedRefresh() {
    console.log('[pwa] nuova versione disponibile')
  },
  onOfflineReady() {
    console.log('[pwa] app pronta per uso offline')
  },
})

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root non trovato in index.html')

ReactDOM.createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 19.2: Full typecheck del progetto**

Run: `npm run typecheck`
Expected: exit code 0, zero errori TypeScript. Se appaiono errori, leggerli con attenzione — di solito sono:
- Mancato import di `@/index.css` nei types — errore "module not found" su `.css` — soluzione: aggiungere `/// <reference types="vite/client" />` se necessario, oppure verificare che `types: ["vite/client"]` sia in `tsconfig.json`
- `virtual:pwa-register` non tipizzato — verificare `types: ["vite-plugin-pwa/client"]`

- [ ] **Step 19.3: Full lint del progetto**

Run: `npm run lint`
Expected: exit code 0, zero errori ESLint e zero warning (`--max-warnings 0`). Se appaiono warning, risolverli (i più comuni: `react-refresh/only-export-components` su file che esportano sia componenti che utility — in Sprint 0 non dovrebbero apparire).

- [ ] **Step 19.4: Full prettier check**

Run: `npm run format:check`
Expected: exit code 0. Se ci sono file non formattati, eseguire `npm run format` per auto-fix e ri-eseguire il check.

- [ ] **Step 19.5: Re-run test dopo `main.tsx`**

Run: `npm run test`
Expected: 2 test ancora verdi (nessuna regressione).

- [ ] **Step 19.6: Verifica `npm run dev`**

Run: `npm run dev` (in un terminale separato o in background)
Expected: il server parte su `https://localhost:5173`. Il primo avvio potrebbe richiedere qualche secondo per la compilazione.

Poi: aprire `https://localhost:5173` in Chrome → accettare il cert warning (Advanced → Proceed) → verificare che la pagina mostri:
- Titolo tab: "ShoppingList"
- Body: heading grande "Hello World" in verde brand
- Sottotitolo: "ShoppingList — Sprint 0 skeleton"

Aprire Chrome DevTools → Console e verificare la presenza dei log:
- `[db] ShoppingListDB v1 opened`
- `[pwa] app pronta per uso offline` (dopo qualche secondo)

Fermare il dev server: `Ctrl+C` nel terminale del dev server.

- [ ] **Step 19.7: Checkpoint utente**

Stato atteso: skeleton applicativo completo funzionante in dev mode. DB Dexie inizializzato, SW registrato, "Hello World" visibile, lint/typecheck/test tutti verdi.

---

## Task 20: Verifica `npm run build` e artefatti PWA

**Files:** nessuno nuovo — verifica che i file esistenti producano un build corretto.

- [ ] **Step 20.1: Build production**

Run: `npm run build`
Expected: output simile a:
```
> tsc -b && vite build
vite v5.4.x building for production...
✓ N modules transformed.
dist/index.html                   X.XX kB │ gzip: X.XX kB
dist/assets/index-XXXXXXXX.css    X.XX kB │ gzip: X.XX kB
dist/assets/index-XXXXXXXX.js   XXX.XX kB │ gzip: XX.XX kB
...
PWA v0.20.x
mode      generateSW
precache  N entries (XXX.XX KiB)
files generated
  dist/sw.js
  dist/workbox-XXXXXXXX.js
✓ built in XX.XXs
```

- [ ] **Step 20.2: Verifica artefatti PWA nel build**

Run: `ls dist/ dist/assets/ dist/icons/`
Expected:
- `dist/index.html` presente
- `dist/sw.js` presente (service worker generato)
- `dist/manifest.webmanifest` presente
- `dist/workbox-*.js` presente
- `dist/favicon.svg` presente
- `dist/icons/pwa-192.png` e `dist/icons/pwa-512.png` presenti
- `dist/assets/index-*.js` e `dist/assets/index-*.css` presenti (hashed)

- [ ] **Step 20.3: Verifica contenuto `manifest.webmanifest`**

Run: `cat dist/manifest.webmanifest`
Expected: JSON valido contenente i campi `name: "ShoppingList"`, `short_name: "ShoppingList"`, `theme_color: "#10b981"`, `icons` array con 3 entries (192, 512, 512 maskable).

- [ ] **Step 20.4: Checkpoint utente**

Stato atteso: build production passa. Artefatti PWA presenti e validi.

---

## Task 21: Playwright configuration (solo config, zero test)

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/.gitkeep`

- [ ] **Step 21.1: Crea `playwright.config.ts`**

Contenuto esatto (spec §7.6):

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://localhost:4173',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'https://localhost:4173',
    reuseExistingServer: !process.env.CI,
    ignoreHTTPSErrors: true,
  },
})
```

- [ ] **Step 21.2: Crea directory `e2e/` con `.gitkeep`**

Run: `mkdir -p e2e && touch e2e/.gitkeep`
Expected: directory e file creati.

- [ ] **Step 21.3: Verifica che Playwright riconosca zero test senza errori**

Run: `npx playwright test --list`
Expected: output tipo `Total: 0 tests in 0 files` (o equivalente messaggio "no tests found") senza errori di configurazione. Se Playwright si lamenta di browser non installati, eseguire `npm run test:e2e:install` per installare il browser chromium (richiede connessione internet).

- [ ] **Step 21.4: Checkpoint utente**

Stato atteso: `playwright.config.ts`, `e2e/.gitkeep` esistono. Playwright riconosce 0 test senza errori di configurazione.

---

## Task 22: Verifica PWA installabile da `vite preview`

**Files:** nessuno nuovo — verifica manuale dei check PWA del DoD §3.3 criterio 4.

- [ ] **Step 22.1: Avvia `vite preview` in background**

Run: `npm run preview` (in un terminale separato o in background)
Expected: server parte su `https://localhost:4173`.

- [ ] **Step 22.2: Verifica smoke automatica via curl**

In un altro terminale: `curl -k https://localhost:4173 | grep -q "<title>ShoppingList</title>" && echo "OK" || echo "FAIL"`
Expected: `OK`.

Nota: `curl` non vede il testo "Hello World" perché quello è renderizzato client-side da React. Si greppa il `<title>` che è statico in `index.html`.

- [ ] **Step 22.3: Check manuale PWA installabile in Chrome**

Aprire `https://localhost:4173` in Chrome:
- Accettare il cert warning (Advanced → Proceed)
- Verificare rendering: heading "Hello World" in verde brand, testo "ShoppingList — Sprint 0 skeleton"
- DevTools (F12) → Application tab → Manifest: deve mostrare campo **"Installable: yes"** (se "Installable: no", verificare che i PNG siano generati correttamente e raggiungibili)
- DevTools → Application → Service Workers: deve mostrare stato **"activated and running"**
- DevTools → Application → IndexedDB → espandere: deve mostrare database **`ShoppingListDB`** con versione 1 e 5 object store: `lists`, `items`, `changeLog`, `itemCatalog`, `invites`
- DevTools → Console: deve contenere i log `[db] ShoppingListDB v1 opened` e `[pwa] app pronta per uso offline`

- [ ] **Step 22.4: Check manuale install PWA**

Chrome address bar → icon "install app" (a destra della URL): click → conferma install. L'app installata avvia in una standalone window e mostra "Hello World".

- [ ] **Step 22.5: Check manuale route 404**

Navigare a `https://localhost:4173/rotta-inesistente`: deve mostrare "404 — Pagina non trovata".

- [ ] **Step 22.6: Ferma il preview server**

`Ctrl+C` nel terminale del preview server.

- [ ] **Step 22.7: Checkpoint utente**

Stato atteso: tutti i check manuali DoD §9.2 spuntati. PWA installabile, DB visibile, routing funzionante.

---

## Task 23: Crea `docs/supabase-schema-v1.sql` — copia letterale da SRS §5

**Files:**
- Create: `docs/supabase-schema-v1.sql`

**Razionale:** file di riferimento non applicato. Contenuto: header commentato con istruzioni di applicazione futura, poi copia letterale delle Sezioni 5.2, 5.3, 5.4, 5.5 dell'SRS.

- [ ] **Step 23.1: Leggi Sezione 5.2 SRS (DDL tabelle)**

Usa il tool Read sull'SRS:
Run: Read `docs/SoftwareRequirements.md` con `offset=1085, limit=116`
Expected: il chunk contiene `CREATE TABLE public.profiles`, `CREATE TABLE public.lists`, `CREATE TABLE public.list_permissions`, `CREATE TABLE public.items`, `CREATE TABLE public.invite_tokens`, `CREATE TABLE public.change_log`.

Salva il contenuto SQL (dall'apertura del fence SQL alla chiusura) per il Step 23.5.

- [ ] **Step 23.2: Leggi Sezione 5.3 SRS (RLS policies)**

Run: Read `docs/SoftwareRequirements.md` con `offset=1204, limit=172`
Expected: il chunk contiene `ENABLE ROW LEVEL SECURITY` e multipli `CREATE POLICY` per le tabelle `profiles`, `lists`, `list_permissions`, `items`, `invite_tokens`.

Salva il contenuto SQL per il Step 23.5.

- [ ] **Step 23.3: Leggi Sezione 5.4 SRS (indici)**

Run: Read `docs/SoftwareRequirements.md` con `offset=1379, limit=25`
Expected: il chunk contiene multipli `CREATE INDEX idx_*` per tutte le tabelle.

Salva il contenuto SQL per il Step 23.5.

- [ ] **Step 23.4: Leggi Sezione 5.5 SRS (trigger e funzioni)**

Run: Read `docs/SoftwareRequirements.md` con `offset=1407, limit=58`
Expected: il chunk contiene `CREATE OR REPLACE FUNCTION public.handle_updated_at`, i trigger `lists_updated_at`, `items_updated_at`, `profiles_updated_at`, la funzione `handle_new_user`, il trigger `on_auth_user_created`, la funzione `expire_old_invites`.

Salva il contenuto SQL per il Step 23.5.

- [ ] **Step 23.5: Crea `docs/supabase-schema-v1.sql`**

Struttura del file:
1. Header `-- ` con metadata e istruzioni di applicazione
2. Marker `-- BEGIN DDL`
3. Contenuto letterale degli step 23.1, 23.2, 23.3, 23.4 **nell'ordine**, separati da linea vuota
4. Marker `-- END DDL`

Contenuto header (copiare letteralmente):

```sql
-- ============================================================
-- ShoppingList MVP — Schema Database Remoto v1
-- ============================================================
-- Fonte autoritativa: docs/SoftwareRequirements.md Sezione 5
-- Data estrazione: 2026-04-13
--
-- STATO: NON APPLICATO. Questo file è una copia di riferimento
-- del DDL PostgreSQL che dovrà essere applicato al progetto
-- Supabase quando disponibile (oggi non lo è).
--
-- Istruzioni di applicazione futura:
--   1. Crea progetto Supabase: https://supabase.com/dashboard
--   2. Supabase Studio → SQL Editor
--   3. Incolla l'intero contenuto di questo file (escluso l'header
--      commentato fino a "-- BEGIN DDL")
--   4. Esegui
--   5. Popola .env.local con VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
--   6. Sostituisci src/lib/supabase.ts stub con client reale
--      (vedi CLAUDE.md sezione "Riattivazione backend")
--
-- Versione schema: v1
-- Dipendenze: estensione auth di Supabase (auth.users preesistente)
-- ============================================================

-- BEGIN DDL

```

Poi concatenare:
- Separatore `-- Sezione 5.2 — DDL tabelle` seguito dal contenuto dello Step 23.1
- Separatore `-- Sezione 5.3 — Row Level Security` seguito dal contenuto dello Step 23.2
- Separatore `-- Sezione 5.4 — Indici performance` seguito dal contenuto dello Step 23.3
- Separatore `-- Sezione 5.5 — Trigger e funzioni` seguito dal contenuto dello Step 23.4

Chiudere con:

```sql

-- END DDL
```

**Importante:** il contenuto SQL copiato dai blocchi deve essere letterale, senza modifiche, senza rimuovere commenti o whitespace.

- [ ] **Step 23.6: Verifica contenuto del file**

Run: `grep -c "CREATE TABLE public\." docs/supabase-schema-v1.sql`
Expected: `6` (sei `CREATE TABLE public.<nome>`).

Run: `grep -c "ENABLE ROW LEVEL SECURITY" docs/supabase-schema-v1.sql`
Expected: `5` (cinque abilitazioni RLS sulle 5 tabelle non-audit).

Run: `grep -c "CREATE POLICY" docs/supabase-schema-v1.sql`
Expected: almeno `15` (policy per profiles, lists, list_permissions, items, invite_tokens).

Run: `grep -c "CREATE INDEX" docs/supabase-schema-v1.sql`
Expected: almeno `8` (indici da §5.4).

Run: `grep -c "CREATE.*FUNCTION public\." docs/supabase-schema-v1.sql`
Expected: `3` (`handle_updated_at`, `handle_new_user`, `expire_old_invites`).

Run: `grep -c "CREATE TRIGGER" docs/supabase-schema-v1.sql`
Expected: `4` (`lists_updated_at`, `items_updated_at`, `profiles_updated_at`, `on_auth_user_created`).

Se uno qualsiasi di questi conteggi non matcha, rileggere la relativa sezione SRS e correggere.

- [ ] **Step 23.7: Checkpoint utente**

Stato atteso: `docs/supabase-schema-v1.sql` presente, contiene DDL completo letterale da SRS §5.

---

## Task 24: Aggiorna `CLAUDE.md` con sezione "Stato Progetto"

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 24.1: Leggi CLAUDE.md corrente**

Usa Read sul file `CLAUDE.md` per ottenere il contenuto completo.

- [ ] **Step 24.2: Identifica il punto di inserimento**

La sezione "Stato Progetto" va inserita:
- **Dopo** il blocco header metadata (righe iniziali con title e blockquote)
- **Prima** della sezione "## Struttura Configurazione"

Il pattern da trovare per l'Edit:
```
> **Versione config:** 1.0 | **Data:** Marzo 2026

---

## Struttura Configurazione
```

- [ ] **Step 24.3: Edit CLAUDE.md — inserisci nuova sezione**

Sostituire il pattern sopra con:

````
> **Versione config:** 1.0 | **Data:** Marzo 2026

---

## Stato Progetto (aggiornato: 2026-04-13)

### Sprint corrente: Sprint 0 in esecuzione

L'app è stata scaffoldata come skeleton funzionante **offline-only**.
Il DB locale Dexie v1 è attivo. Il client Supabase è uno **stub
tipizzato** non connesso (vedi `src/lib/supabase.ts`). Il deploy
Vercel non esiste: verifica PWA via `npm run preview` su HTTPS locale.

### Cosa funziona oggi

- `npm run dev` → app su https://localhost:5173 con "Hello World"
- `npm run build && npm run preview` → PWA installabile da Chrome
- `npm run test` → smoke test Vitest (2 test)
- `npm run typecheck` / `npm run lint` → passa
- DB Dexie v1 inizializzato (visibile in DevTools → IndexedDB)

### Cosa è intenzionalmente stubbed

| Area | Stato | File rilevanti |
|------|-------|----------------|
| Supabase client | Stub verso URL invalido | `src/lib/supabase.ts` |
| Autenticazione | userId fisso `'local-user-stub'` | `src/stores/auth-store.ts` |
| Sync IndexedDB ↔ Supabase | Non esiste ancora | — |
| Deploy pubblico | Non esiste ancora | — |
| Schema PostgreSQL | Documentato non applicato | `docs/supabase-schema-v1.sql` |

### Riattivazione backend (quando Supabase sarà disponibile)

1. Creare progetto Supabase, ottenere URL + anon key
2. Applicare `docs/supabase-schema-v1.sql` via SQL Editor
3. Popolare `.env.local`:
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. Sostituire `src/lib/supabase.ts` con:
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY,
   )
   export const SUPABASE_IS_STUB = false as const
   ```
5. Aggiornare `src/stores/auth-store.ts` con auth reale
6. Scrivere test RLS

### Riattivazione deploy (quando hosting sarà disponibile)

1. Scegliere target (Vercel / Netlify / Cloudflare Pages / GitHub Pages)
2. Connettere repo
3. Configurare env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
4. Verificare build remoto + install PWA su device fisico

### Fonti autoritative in caso di discrepanza

Ordine di priorità quando documenti divergono:

1. **`docs/SoftwareRequirements.md`** — fonte primaria (DDL, schema Dexie, tipi)
2. **Questo `CLAUDE.md`** — stato corrente del progetto
3. **`.claude/architettura.md`** — pattern architetturali
4. **`docs/mappa-progetto.md`** — localizzazione file

**Discrepanze note da risolvere nei prossimi sprint:**
- `.claude/architettura.md` cita Dexie v3 → si usa Dexie 4
- `.claude/architettura.md` elenca tabella `syncState` → non esiste in SRS v1, rimossa
- `.claude/architettura.md` cita `types/domain.ts` → si usa `db/types.ts` da SRS §4.3

---

## Struttura Configurazione
````

- [ ] **Step 24.4: Verifica il contenuto aggiornato**

Run: `grep -q "## Stato Progetto (aggiornato: 2026-04-13)" CLAUDE.md && echo "OK"`
Expected: `OK`.

Run: `grep -q "SUPABASE_IS_STUB" CLAUDE.md && echo "OK"`
Expected: `OK`.

- [ ] **Step 24.5: Checkpoint utente**

Stato atteso: `CLAUDE.md` aggiornato con nuova sezione in cima.

---

## Task 25: Aggiorna `docs/mappa-progetto.md` con sezione "Stato Sprint 0"

**Files:**
- Modify: `docs/mappa-progetto.md`

- [ ] **Step 25.1: Leggi mappa-progetto.md corrente**

Usa Read su `docs/mappa-progetto.md` per ottenere il contenuto.

- [ ] **Step 25.2: Identifica il punto di inserimento**

La nuova sezione va **subito dopo** l'header introduttivo e **prima** della prima sezione esistente ("## Configurazione Claude Code").

Il pattern da trovare per l'Edit:
```
> Ultimo aggiornamento: Marzo 2026 (struttura iniziale — da aggiornare durante sviluppo)

---

## Configurazione Claude Code
```

- [ ] **Step 25.3: Edit mappa-progetto.md — inserisci nuova sezione**

Sostituire il pattern sopra con:

```markdown
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

## Configurazione Claude Code
```

- [ ] **Step 25.4: Verifica il contenuto aggiornato**

Run: `grep -q "## Stato Sprint 0 (2026-04-13)" docs/mappa-progetto.md && echo "OK"`
Expected: `OK`.

- [ ] **Step 25.5: Checkpoint utente**

Stato atteso: `docs/mappa-progetto.md` aggiornato con nuova sezione in cima.

---

## Task 26: Final verification — esecuzione completa DoD

**Files:** nessuno — verifica che tutto lo skeleton passi i criteri DoD dello spec §3.3.

- [ ] **Step 26.1: Pulizia e re-install**

Run: `rm -rf node_modules dist && npm install`
Expected: installazione pulita senza errori.

- [ ] **Step 26.2: Audit sicurezza**

Run: `npm audit --audit-level=high`
Expected: exit code 0.

- [ ] **Step 26.3: Typecheck**

Run: `npm run typecheck`
Expected: exit code 0.

- [ ] **Step 26.4: Lint**

Run: `npm run lint`
Expected: exit code 0 (zero errori, zero warning).

- [ ] **Step 26.5: Format check**

Run: `npm run format:check`
Expected: exit code 0.

- [ ] **Step 26.6: Test unit**

Run: `npm run test`
Expected: 2 test verdi in `src/test/app.test.tsx`.

- [ ] **Step 26.7: Rigenera icone (se eliminate)**

Run: `npm run gen:icons`
Expected: `pwa-192.png` e `pwa-512.png` presenti in `public/icons/`.

- [ ] **Step 26.8: Build production**

Run: `npm run build`
Expected: `dist/` generato con `sw.js`, `manifest.webmanifest`, `icons/`, `assets/`, `index.html`.

- [ ] **Step 26.9: Verifica artefatti PWA**

Run:
```bash
test -f dist/sw.js && echo "OK sw.js" || echo "FAIL sw.js"
test -f dist/manifest.webmanifest && echo "OK manifest" || echo "FAIL manifest"
test -f dist/icons/pwa-192.png && echo "OK pwa-192" || echo "FAIL pwa-192"
test -f dist/icons/pwa-512.png && echo "OK pwa-512" || echo "FAIL pwa-512"
```
Expected: 4 `OK`.

- [ ] **Step 26.10: Smoke check preview**

Run in background: `npm run preview &` → attendere 3 secondi → `curl -k https://localhost:4173 | grep -q "<title>ShoppingList</title>" && echo "OK preview" || echo "FAIL preview"` → killare il preview.

Expected: `OK preview`.

- [ ] **Step 26.11: Grep orfani**

Run: `grep -rn "TODO\|FIXME\|XXX" src/ 2>/dev/null || true`
Expected: output vuoto oppure solo commenti intenzionali documentati (in Sprint 0 non dovrebbero esserci orfani).

- [ ] **Step 26.12: Conferma finale DoD**

Verifica manuale della checklist DoD (spec §3.3):

- [ ] DoD 1: `npm install` completa senza warning sicurezza
- [ ] DoD 2: `npm run dev` mostra "Hello World" su https://localhost:5173
- [ ] DoD 3: `npm run build` produce `dist/` senza errori
- [ ] DoD 4: `npm run preview` serve HTTPS locale, Manifest "Installable: yes"
- [ ] DoD 5: `npm run test` — 2 test verdi
- [ ] DoD 6: `npm run typecheck` — exit 0
- [ ] DoD 7: `npm run lint` — exit 0
- [ ] DoD 8: DB Dexie v1 visibile in DevTools → IndexedDB → 5 object store
- [ ] DoD 9: `import { supabase } from '@/lib/supabase'` compila
- [ ] DoD 10: `docs/mappa-progetto.md` aggiornato con "Stato Sprint 0"
- [ ] DoD 11: `docs/supabase-schema-v1.sql` contiene DDL + RLS letterali
- [ ] DoD 12: `CLAUDE.md` contiene sezione "Stato Progetto"

- [ ] **Step 26.13: Hand-off a Sprint 1**

Sprint 0 è completo quando tutti i punti DoD sopra sono verificati. Sprint 1 (Core Offline: Liste e Articoli) può partire con le seguenti garanzie:

- `import { db } from '@/db/database'` → istanza Dexie aperta, 5 object store
- `import { getCurrentUserId } from '@/stores/auth-store'` → `'local-user-stub'`
- `import { supabase } from '@/lib/supabase'` → stub (chiamate falliranno)
- `import type { List, Item, ... } from '@/db/types'` → tipi SRS §4.3
- `import type { AppResult, AppError } from '@/types/ui'` → contract error handling
- Path alias `@/` → `src/` attivo
- Strict TS (+ `noUncheckedIndexedAccess`), ESLint 9 flat, Prettier attivi
- Kebab-case naming rispettato
- PWA manifest + SW registrati

Prossimi task (Sprint 1 o sprint ausiliari):
- Aggiornare stati task in `docs/piano-sviluppo.md` a `[✅]` per i task completati (S0-01, S0-02, S0-03, S0-06, S0-07, S0-08, S0-09, S0-10, S0-11, S0-13, S0-14). I task `[⏸]` (S0-04, S0-05, S0-12) restano bloccati.
- Aggiungere a `docs/piano-sviluppo.md` i nuovi sprint "Backend Activation" e "Deploy Activation" come descritti nelle Note di deviazione già presenti nel file.
- Iniziare Sprint 1 con il primo task: `listRepository` (CRUD Dexie).

---

## Riepilogo task

| Task | Descrizione | File creati/modificati |
|------|-------------|------------------------|
| 1 | Bootstrap manuale + npm install | `package.json` |
| 2 | TypeScript config strict | `tsconfig.json`, `tsconfig.node.json` |
| 3 | Tailwind + PostCSS | `tailwind.config.ts`, `postcss.config.js` |
| 4 | ESLint flat + Prettier | `eslint.config.js`, `.prettierrc.json` |
| 5 | Vite config (PWA + HTTPS) | `vite.config.ts` |
| 6 | index.html + .env.example | `index.html`, `.env.example` |
| 7 | Icone PWA (SVG + script + PNG) | `public/favicon.svg`, `scripts/gen-icons.mjs`, `public/icons/*.png` |
| 8 | Dexie types (SRS §4.3) | `src/db/types.ts` |
| 9 | Dexie database v1 (SRS §4.2) | `src/db/database.ts` |
| 10 | Supabase stub | `src/lib/supabase.ts` |
| 11 | Zustand stores | `src/stores/{auth,list,ui}-store.ts` |
| 12 | Types UI + constants | `src/types/ui.ts`, `src/constants/index.ts` |
| 13 | CSS base Tailwind | `src/index.css` |
| 14 | Vitest config + test setup | `vitest.config.ts`, `src/test/setup.ts` |
| 15 | TDD RED — failing test | `src/test/app.test.tsx` |
| 16 | TDD — Home page | `src/pages/home-page.tsx` |
| 17 | TDD — 404 page | `src/pages/not-found-page.tsx` |
| 18 | TDD GREEN — App + routing | `src/app.tsx` |
| 19 | Entry point main.tsx + full checks | `src/main.tsx` |
| 20 | Verifica build production + artefatti PWA | (verifica) |
| 21 | Playwright config + e2e/.gitkeep | `playwright.config.ts`, `e2e/.gitkeep` |
| 22 | Verifica PWA manuale | (verifica) |
| 23 | `docs/supabase-schema-v1.sql` (da SRS §5) | `docs/supabase-schema-v1.sql` |
| 24 | Aggiornamento CLAUDE.md | `CLAUDE.md` |
| 25 | Aggiornamento mappa-progetto.md | `docs/mappa-progetto.md` |
| 26 | Final verification DoD completa | (verifica) |

**Totale file creati:** 31 file sorgente + 3 file docs + 2 file modificati

**Estimated execution time:** 60-90 minuti (esclusi manual check browser che aggiungono 10-15 min)

---

*Plan v1 — 2026-04-13 — Deriva da `docs/superpowers/specs/2026-04-13-sprint-0-setup-design.md`*
