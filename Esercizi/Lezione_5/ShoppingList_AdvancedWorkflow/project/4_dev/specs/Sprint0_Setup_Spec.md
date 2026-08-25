# Design Spec — Sprint 0: Setup Infrastruttura

| Campo | Valore |
|-------|--------|
| **Titolo** | Sprint 0 — Setup Infrastruttura (riadattato per ambiente senza Supabase Cloud / Vercel) |
| **Data** | 2026-04-13 |
| **Stato** | Draft — in attesa di review utente |
| **Sprint target** | Sprint 0 — piano-sviluppo.md |
| **Metodologia** | Spec-Driven Development con Claude Code (`superpowers:brainstorming`) |
| **Brainstorm summary** | [`docs/superpowers/brainstorms/2026-04-13-sprint-0-setup-brainstorm.md`](../brainstorms/2026-04-13-sprint-0-setup-brainstorm.md) |
| **Fonte autoritativa dati** | `docs/SoftwareRequirements.md` Sezioni 4 e 5 |
| **Prossimo step dopo approvazione** | `superpowers:writing-plans` per il plan implementativo |

---

## 1. Executive Summary

Questo spec definisce lo scaffold iniziale del progetto ShoppingList MVP come **skeleton offline-only funzionante**, riadattando lo Sprint 0 del piano di sviluppo per operare in un ambiente privo di accesso a Supabase Cloud e Vercel.

**Risultato atteso:** repo da vuoto a skeleton che passa tutti i check del Definition of Done, con DB Dexie v1 inizializzato, stub Supabase tipizzato, PWA installabile da preview locale HTTPS, test smoke Vitest verdi, strict TypeScript + ESLint 9 flat config + Tailwind 3 attivi. Pronto come fondazione per Sprint 1 (Core Offline: Liste e Articoli).

**Deviazione chiave:** i task di creazione backend (Supabase DDL + RLS + client singleton) e deploy pubblico (Vercel) sono sostituiti da un set di alternative locali che preservano i tipi e i contratti ma rimandano l'attivazione reale a due sprint nuovi — "Backend Activation" e "Deploy Activation" — da eseguire prima dello Sprint 3 (Sincronizzazione).

---

## 2. Contesto e motivazione

### 2.1 Piano originale (piano-sviluppo.md)

Sprint 0 originale richiedeva 14 task (S0-01..S0-14) per portare il progetto da repo vuoto a "app deployata su Vercel con Supabase connesso, PWA installabile su mobile, test Hello World passa".

### 2.2 Vincolo bloccante emerso

Durante il brainstorming l'utente ha comunicato che **non ha accesso né a Supabase Cloud né a Vercel** in questo ambiente. Questo invalida 4 dei 14 task (S0-04, S0-05, S0-11, S0-12) come scritti nel piano originale.

### 2.3 Principio guida della deviazione

La deviazione rispetta tre principi non negoziabili di `CLAUDE.md`:

1. **Offline-first è non negoziabile** → lo skeleton locale è consistente con questa filosofia; Supabase era un "enhancement", non un requisito per la UX
2. **Nessuna perdita di dati** → il DDL PostgreSQL non viene perso ma preservato letteralmente in `docs/supabase-schema-v1.sql` come riferimento futuro
3. **Non nascondere debito tecnico dietro flag di configurazione** → gli stub sono espliciti, documentati, e falliscono rumorosamente se qualcuno li usa per caso

### 2.4 Documenti autoritativi consultati

- **`docs/SoftwareRequirements.md`** (6440 righe) — fonte primaria per schema Dexie v1 (§4.2/4.3) e schema PostgreSQL v1 (§5.2/5.3/5.4/5.5)
- **`docs/FrameworkAnalysis.md`** — giustificazione stack
- **`.claude/architettura.md`** — pattern architetturali di layer (UI → Hooks → Services → Repositories → Dexie/Supabase)
- **`.claude/qualita.md`** — enforcement rules (LOC, strict TS, no `any`, kebab-case, self-check checklist)
- **`.claude/dominio.md`** — entità di dominio e permessi
- **`docs/mappa-progetto.md`** — struttura directory obiettivo MVP

### 2.5 Discrepanze di documentazione risolte

| Documento | Contenuto | Risoluzione |
|-----------|-----------|-------------|
| `architettura.md` | Dexie v3 | Si usa **Dexie 4** (stable, backward-compatible con esempi SRS) |
| `architettura.md` | Tabella `syncState` in schema Dexie | **Rimossa** — non esiste in SRS §4.2 v1 |
| `architettura.md` | `src/types/domain.ts`, `api.ts`, `ui.ts` | Si usa **`src/db/types.ts`** (da SRS §4.3) + `src/types/ui.ts` |

**Ordine di priorità autoritativa** (dichiarato anche in `CLAUDE.md` sezione "Stato Progetto"):
`SoftwareRequirements.md` > `CLAUDE.md` > `.claude/architettura.md` > `docs/mappa-progetto.md`

---

## 3. Scope

### 3.1 In scope — 14 task dello Sprint 0 riadattati

Tutti i 14 task sono inclusi. Quelli deferred (S0-04, S0-05, S0-12) sono esplicitamente sostituiti da attività di documentazione di riferimento.

| ID | Task | Riadattamento |
|----|------|---------------|
| S0-01 | Setup Vite + React + TypeScript | Invariato |
| S0-02 | Tailwind CSS 3 | Invariato |
| S0-03 | ESLint + Prettier (strict TS) | Aggiornato a **ESLint 9 flat config** |
| S0-04 | ~~Supabase progetto + DDL~~ | **Deferred** → `docs/supabase-schema-v1.sql` copia letterale SRS §5 non applicata |
| S0-05 | ~~RLS Supabase~~ | **Deferred** → incluso in `docs/supabase-schema-v1.sql` |
| S0-06 | Dexie schema locale v1 | Invariato, da SRS §4.2/4.3; Dexie 4 |
| S0-07 | vite-plugin-pwa + manifest + SW | Aggiunto `@vitejs/plugin-basic-ssl` per HTTPS locale |
| S0-08 | Vitest + Testing Library + Playwright | Vitest full, Playwright solo config (0 test) |
| S0-09 | Struttura directory | Solo cartelle con file reali (no dead code) |
| S0-10 | Zustand stores base | `auth-store` funzionale, `list-store`/`ui-store` placeholder |
| S0-11 | Supabase client singleton | **Stub tipizzato** verso URL invalido |
| S0-12 | ~~Deploy Vercel~~ | **Deferred** → verifica via `vite preview --https` locale |
| S0-13 | Routing base | `App` + `HomePage` + `NotFoundPage`; `LoginPage` deferred a Sprint 2 |
| S0-14 | Aggiorna `mappa-progetto.md` | Esteso a `CLAUDE.md` (sezione "Stato Progetto") |

### 3.2 Out of scope — esplicitamente non fatti in Sprint 0

- Autenticazione reale (Sprint 2)
- CRUD liste/articoli (Sprint 1)
- Sync IndexedDB ↔ Supabase (Sprint 3)
- Componenti di dominio (`ListCard`, `ItemRow`, ecc.) — Sprint 1
- Test E2E Playwright (config pronta, primo test in Sprint 1)
- Deploy pubblico (sprint "Deploy Activation")
- Verifica installabilità PWA su device mobile fisico (richiede HTTPS con cert valido)
- Accessibilità WCAG audit (Sprint 5)
- Performance Lighthouse audit (Sprint 5)
- CI/CD pipeline (post-MVP)

### 3.3 Definition of Done

Un task è "done" quando **tutti** i seguenti criteri sono veri. Ogni criterio è verificabile con un comando esplicito (vedi §9 Verification).

| # | Criterio | Comando di verifica |
|---|----------|---------------------|
| 1 | `npm install` completa senza warning di sicurezza high/critical | `npm audit --audit-level=high` ritorna 0 |
| 2 | `npm run dev` avvia su https://localhost:5173 e mostra "Hello World" | Manuale: aprire URL, accettare cert warning, verificare testo |
| 3 | `npm run build` produce `dist/` con `sw.js` + `manifest.webmanifest` senza errori | `ls dist/sw.js dist/manifest.webmanifest` entrambi presenti |
| 4 | `npm run preview` serve `dist/` su HTTPS locale | Manuale: aprire https://localhost:4173, verificare "Installable: yes" in DevTools → Application → Manifest |
| 5 | `npm run test` passa (2 test Vitest verdi) | Exit code 0 |
| 6 | `npm run typecheck` passa (strict TypeScript, zero errori, zero `any`) | Exit code 0 |
| 7 | `npm run lint` passa (ESLint 9 flat config + Prettier) | Exit code 0 |
| 8 | DB Dexie v1 si inizializza al primo load | Manuale: DevTools → Application → IndexedDB → `ShoppingListDB` → 5 object store |
| 9 | `import { supabase } from '@/lib/supabase'` funziona e i tipi matchano `SupabaseClient` | Coperto da `npm run typecheck` |
| 10 | `docs/mappa-progetto.md` aggiornato con nuova sezione "Stato Sprint 0" | Manuale: verifica sezione presente |
| 11 | `docs/supabase-schema-v1.sql` contiene DDL + RLS + indici + trigger letterali da SRS §5 | Manuale: verifica presenza 6 tabelle + policy |
| 12 | `CLAUDE.md` contiene sezione "Stato Progetto" in cima con istruzioni di riattivazione | Manuale: verifica sezione presente |

---

## 4. Architettura e decisioni di design

### 4.1 Stack tecnologico concreto

| Layer | Tecnologia | Versione target | Note |
|-------|-----------|-----------------|------|
| UI framework | React | ^18.3.0 | |
| Linguaggio | TypeScript | ^5.5.0 | strict mode completo + `noUncheckedIndexedAccess` |
| Build tool | Vite | ^5.4.0 | |
| HTTPS dev | `@vitejs/plugin-basic-ssl` | ^1.1.0 | cert self-signed auto-generato |
| PWA | vite-plugin-pwa + workbox-window | ^0.20.0 / ^7.1.0 | |
| DB locale | Dexie | **^4.0.0** (sopra v3 di architettura.md) | + dexie-react-hooks |
| State management | Zustand | ^4.5.0 | |
| Routing | React Router | ^6.26.0 | |
| CSS | Tailwind CSS | ^3.4.0 | brand color `#10b981` emerald |
| Backend/Auth | `@supabase/supabase-js` | ^2.45.0 | usato solo per tipi — il client è stubbed |
| Test unit | Vitest | ^2.0.0 | |
| Test DOM | Testing Library + jest-dom | ^16.0.0 / ^6.5.0 | |
| Mock IndexedDB | fake-indexeddb | ^6.0.0 | |
| Test E2E | Playwright | ^1.46.0 | solo config, zero test in Sprint 0 |
| Lint | ESLint 9 flat config + @typescript-eslint | ^9.9.0 / ^8.0.0 | |
| Format | Prettier | ^3.3.0 | |

### 4.2 Decisioni architetturali chiave

#### Decisione 1 — Backend stubbed via URL invalido

`src/lib/supabase.ts` esporta un `SupabaseClient` reale creato con `createClient('https://stub.invalid', 'stub-key', {...})`. Le opzioni `autoRefreshToken`, `persistSession`, `detectSessionInUrl` sono tutte `false` per evitare side effect di storage.

**Perché non un Proxy che throwa?**
- Divergenza tipo/runtime: un Proxy dichiara di essere `SupabaseClient` ma throwa a ogni accesso → l'editor suggerisce metodi che crashano.
- Classe di errori inconsistente: un Proxy throwa `Error`, ma la rete reale throwa `FetchError`/`AuthError` specifici. Il codice chiamante cattura errori di rete in modo diverso dalle eccezioni custom.
- La soluzione URL-invalido mantiene **comportamento coerente con Supabase reale offline**.

**Garanzie fornite:**
- `import { supabase } from '@/lib/supabase'` funziona in Sprint 1+
- I tipi sono identici al client reale (importati da `@supabase/supabase-js`)
- Qualsiasi chiamata `.from()` / `.auth.*` fallisce con errore di rete tipizzato
- Flag `SUPABASE_IS_STUB = true as const` permette narrowing compile-time

#### Decisione 2 — Dexie init al bootstrap, parallelo al render

`src/main.tsx` invoca `db.open()` fire-and-forget (non bloccante):

```typescript
db.open()
  .then(() => console.log('[db] ShoppingListDB v1 opened'))
  .catch((err: unknown) => console.error('[db] init failed', err))
```

**Perché non awaitato?**
- Awaitato aggiungerebbe ~50ms al time-to-first-paint.
- Sprint 0 non ha codice UI che usa il DB — zero valore nel bloccare il render.
- Il DoD "DB visibile in DevTools" è soddisfatto perché l'open triggera la creazione delle object store anche se avviene in parallelo al render.

**Perché non lazy?**
- Dexie di default è lazy: le tabelle vengono create al primo `.from()/.where()`.
- Lazy fallisce il DoD 8 — le tabelle non compaiono in DevTools → IndexedDB finché non c'è una query.

#### Decisione 3 — File creati solo se necessari per DoD

Le cartelle `src/components/`, `src/hooks/`, `src/services/`, `src/repositories/` **non vengono create** in Sprint 0. Principio YAGNI + `qualita.md` "don't add features beyond what the task requires".

Sprint 1 creerà queste cartelle quando il primo componente/hook/service/repository avrà bisogno di esistere.

#### Decisione 4 — `list-store` / `ui-store` placeholder vuoti

Invece, `src/stores/list-store.ts` e `src/stores/ui-store.ts` **sono creati** come placeholder con `Record<string, never>`. Differenza di trattamento rispetto alle cartelle sopra:

1. Il task S0-10 li richiede esplicitamente
2. `mappa-progetto.md` li elenca come file attesi
3. Un placeholder tipizzato dichiara intent, non è dead code speculativo

#### Decisione 5 — TypeScript strict flags

- **`noUncheckedIndexedAccess: true`** — attivo, allinea col principio "nessuna perdita di dati"
- **`exactOptionalPropertyTypes: false`** — disabilitato, friction-to-value troppo alto

#### Decisione 6 — ESLint 9 flat config

ESLint 9 flat config invece del classico `.eslintrc`. Motivi:
- Standard ufficiale corrente (ESLint 9 è la default da 2024)
- Vite 5 + `@typescript-eslint` 8 lo supportano nativamente
- Niente `overrides` nested che creano confusione

#### Decisione 7 — Nessun `manualChunks` bundle splitting

`qualita.md` dice "memoize/optimize solo quando misuri un problema reale". Il bundle splitting è premature optimization. Se Sprint 2+ misura bundle > 500KB, allora si aggiunge.

#### Decisione 8 — `supabase-schema-v1.sql` plain `.sql` con header commentato

File SQL valido e eseguibile come-is quando il progetto Supabase sarà creato. Non wrappato in block comment (sarebbe non convenzionale e romperebbe copy-paste). Header `-- ` spiega status e istruzioni di applicazione.

### 4.3 Layer architetturali — allineamento con `architettura.md`

Lo skeleton Sprint 0 rispetta la regola delle dipendenze (`.claude/architettura.md`):

```
UI (pages/) → Hooks → Services → Repositories → Dexie/Supabase
```

In Sprint 0 l'unica UI (`HomePage`) non ha dipendenze down-stream (è letteralmente un `<h1>`). Il layer hooks/services/repositories viene creato da Sprint 1. Il layer Dexie è preparato con `db.ts` + `types.ts`. Il layer Supabase è stubbed.

---

## 5. Dipendenze npm

### 5.1 `dependencies` (runtime)

```json
{
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "react-router-dom": "^6.26.0",
  "dexie": "^4.0.0",
  "dexie-react-hooks": "^1.1.7",
  "zustand": "^4.5.0",
  "@supabase/supabase-js": "^2.45.0"
}
```

### 5.2 `devDependencies` (build + test + lint)

```json
{
  "vite": "^5.4.0",
  "@vitejs/plugin-react": "^4.3.0",
  "@vitejs/plugin-basic-ssl": "^1.1.0",
  "vite-plugin-pwa": "^0.20.0",
  "workbox-window": "^7.1.0",

  "typescript": "^5.5.0",
  "@types/react": "^18.3.0",
  "@types/react-dom": "^18.3.0",
  "@types/node": "^20.0.0",

  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.0",
  "autoprefixer": "^10.4.0",

  "eslint": "^9.9.0",
  "@typescript-eslint/eslint-plugin": "^8.0.0",
  "@typescript-eslint/parser": "^8.0.0",
  "eslint-plugin-react-hooks": "^5.0.0",
  "eslint-plugin-react-refresh": "^0.4.0",
  "prettier": "^3.3.0",
  "eslint-config-prettier": "^9.1.0",

  "vitest": "^2.0.0",
  "@vitest/coverage-v8": "^2.0.0",
  "@testing-library/react": "^16.0.0",
  "@testing-library/jest-dom": "^6.5.0",
  "@testing-library/user-event": "^14.5.0",
  "jsdom": "^24.1.0",
  "fake-indexeddb": "^6.0.0",

  "@playwright/test": "^1.46.0",

  "sharp": "^0.33.0"
}
```

### 5.3 `package.json` scripts

```json
{
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
  }
}
```

---

## 6. Struttura directory dopo Sprint 0

```
ShoppingList/                                    ← solution root (già esiste)
├── CLAUDE.md                                    ← aggiornato: nuova sezione "Stato Progetto" in cima
├── .gitignore                                   ← invariato
├── package.json                                 ← NUOVO
├── tsconfig.json                                ← NUOVO — strict TS + path alias
├── tsconfig.node.json                           ← NUOVO — config per vite.config.ts etc.
├── vite.config.ts                               ← NUOVO — PWA + basicSsl + alias
├── vitest.config.ts                             ← NUOVO — jsdom + setup
├── playwright.config.ts                         ← NUOVO — config-only, 0 test
├── tailwind.config.ts                           ← NUOVO
├── postcss.config.js                            ← NUOVO
├── eslint.config.js                             ← NUOVO — flat config
├── .prettierrc.json                             ← NUOVO
├── .env.example                                 ← NUOVO — placeholder per VITE_SUPABASE_*
├── index.html                                   ← NUOVO
│
├── scripts/
│   └── gen-icons.mjs                            ← NUOVO — one-shot SVG→PNG via sharp
│
├── public/
│   ├── favicon.svg                              ← NUOVO — placeholder tinta unita brand
│   └── icons/
│       ├── pwa-192.png                          ← NUOVO — generato da gen-icons.mjs
│       └── pwa-512.png                          ← NUOVO — generato da gen-icons.mjs
│
├── src/
│   ├── main.tsx                                 ← NUOVO — entry + SW register + db.open()
│   ├── app.tsx                                  ← NUOVO — root + routing
│   ├── index.css                                ← NUOVO — Tailwind base
│   │
│   ├── pages/
│   │   ├── home-page.tsx                        ← NUOVO — "Hello World"
│   │   └── not-found-page.tsx                   ← NUOVO — 404 stub
│   │
│   ├── db/
│   │   ├── database.ts                          ← NUOVO — Dexie schema v1 (da SRS §4.2)
│   │   └── types.ts                             ← NUOVO — entità TS (da SRS §4.3)
│   │
│   ├── lib/
│   │   └── supabase.ts                          ← NUOVO — STUB tipizzato
│   │
│   ├── stores/
│   │   ├── auth-store.ts                        ← NUOVO — stub con getCurrentUserId()
│   │   ├── list-store.ts                        ← NUOVO — placeholder vuoto
│   │   └── ui-store.ts                          ← NUOVO — placeholder vuoto
│   │
│   ├── types/
│   │   └── ui.ts                                ← NUOVO — AppError, AppResult, SyncStatus
│   │
│   ├── constants/
│   │   └── index.ts                             ← NUOVO — placeholder vuoto
│   │
│   └── test/
│       ├── setup.ts                             ← NUOVO — jest-dom + fake-indexeddb
│       └── app.test.tsx                         ← NUOVO — Hello World + 404 routing
│
├── e2e/
│   └── .gitkeep                                 ← NUOVO — dir vuota (config Playwright pronta)
│
├── docs/
│   ├── piano-sviluppo.md                        ← aggiornato: Sprint 0 annotato
│   ├── mappa-progetto.md                        ← aggiornato: nuova sezione "Stato Sprint 0" in cima
│   ├── supabase-schema-v1.sql                   ← NUOVO — DDL+RLS da SRS §5 (NON applicato)
│   └── superpowers/
│       ├── brainstorms/
│       │   └── 2026-04-13-sprint-0-setup-brainstorm.md   ← creato durante brainstorming
│       └── specs/
│           └── 2026-04-13-sprint-0-setup-design.md       ← QUESTO FILE
│
└── .claude/                                     ← invariato
    ├── architettura.md
    ├── dominio.md
    ├── qualita.md
    ├── sicurezza.md
    ├── sync.md
    └── testing.md
```

**Cartelle intenzionalmente NON create** in Sprint 0: `src/components/`, `src/hooks/`, `src/services/`, `src/repositories/`. Verranno create in Sprint 1 quando avranno file reali.

---

## 7. Contenuto dei file (code spec)

> Questa sezione contiene i file completi da scrivere. Il plan implementativo successivo li tratterà come contratti: ogni file deve matchare esattamente (salvo minor fix tipografici).

### 7.1 `index.html`

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

### 7.2 `tsconfig.json`

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

### 7.3 `tsconfig.node.json`

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

### 7.4 `vite.config.ts`

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

### 7.5 `vitest.config.ts`

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

### 7.6 `playwright.config.ts`

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

### 7.7 `tailwind.config.ts`

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

### 7.8 `postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 7.9 `eslint.config.js`

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

### 7.10 `.prettierrc.json`

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

### 7.11 `.env.example`

```bash
# Sprint 0: queste variabili non sono usate (Supabase stubbed).
# Sprint futuro "Backend Activation": popolare con credenziali reali.
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 7.12 `src/index.css`

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

### 7.13 `src/main.tsx`

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

### 7.14 `src/app.tsx`

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

### 7.15 `src/pages/home-page.tsx`

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

### 7.16 `src/pages/not-found-page.tsx`

```typescript
export default function NotFoundPage(): JSX.Element {
  return (
    <main className="flex min-h-full flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-semibold">404 — Pagina non trovata</h1>
    </main>
  )
}
```

### 7.17 `src/db/types.ts`

Copia letterale da SRS Sezione 4.3 (entità Dexie + enum). L'SRS è la fonte autoritativa.

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

### 7.18 `src/db/database.ts`

Copia letterale da SRS Sezione 4.2 (schema Dexie v1). Dexie 4 API.

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

### 7.19 `src/lib/supabase.ts`

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

### 7.20 `src/stores/auth-store.ts`

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

### 7.21 `src/stores/list-store.ts`

```typescript
// src/stores/list-store.ts — placeholder, popolato in Sprint 1
import { create } from 'zustand'

type ListState = Record<string, never>
export const useListStore = create<ListState>(() => ({}))
```

### 7.22 `src/stores/ui-store.ts`

```typescript
// src/stores/ui-store.ts — placeholder, popolato in Sprint 1
import { create } from 'zustand'

type UIState = Record<string, never>
export const useUIStore = create<UIState>(() => ({}))
```

### 7.23 `src/types/ui.ts`

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

### 7.24 `src/constants/index.ts`

```typescript
// src/constants/index.ts — placeholder, popolato negli sprint successivi
export {}
```

### 7.25 `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

### 7.26 `src/test/app.test.tsx`

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

### 7.27 `docs/supabase-schema-v1.sql`

File di riferimento **non applicato**. Contenuto: header `-- ` con istruzioni, seguito dalla copia letterale delle Sezioni 5.2, 5.3, 5.4, 5.5 del SRS.

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

-- >>> Il plan implementativo copia qui LETTERALMENTE il contenuto di:
-- >>>   docs/SoftwareRequirements.md righe 1085–1200 (Sezione 5.2 — DDL delle 6 tabelle)
-- >>>   docs/SoftwareRequirements.md righe 1204–1375 (Sezione 5.3 — RLS policies)
-- >>>   docs/SoftwareRequirements.md righe 1379–1403 (Sezione 5.4 — indici performance)
-- >>>   docs/SoftwareRequirements.md righe 1407–1464 (Sezione 5.5 — trigger e funzioni)
-- >>>
-- >>> NESSUNA modifica al contenuto. Preservare whitespace e commenti originali.
-- >>> Il plan DEVE usare il tool Read con offset+limit per estrarre ogni blocco,
-- >>> poi concatenarli in questo ordine.

-- END DDL
```

**Nota per il plan implementativo:** i marker `-- >>>` sopra sono istruzioni direttive per il plan, non commenti SQL decorativi. Il plan **deve** leggere il file `docs/SoftwareRequirements.md` con il tool Read usando i range di righe specificati, e sostituire letteralmente ogni blocco `-- >>>` con il SQL corrispondente. Risultato finale: file `docs/supabase-schema-v1.sql` con header `-- ` iniziale, BEGIN DDL marker, ~400 righe di SQL reale, END DDL marker. Il file è classificato come documentazione (eccezione esplicita ai limiti LOC di `qualita.md`).

**Verifica post-scrittura del SQL:** il plan deve verificare che il file contenga almeno le seguenti stringhe chiave (grep manuale): `CREATE TABLE public.profiles`, `CREATE TABLE public.lists`, `CREATE TABLE public.list_permissions`, `CREATE TABLE public.items`, `CREATE TABLE public.invite_tokens`, `CREATE TABLE public.change_log`, `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`, `CREATE INDEX`, `CREATE OR REPLACE FUNCTION public.handle_updated_at`.

### 7.28 Aggiornamento `CLAUDE.md` — sezione "Stato Progetto"

Aggiungere **in cima** al file (dopo header metadata, prima di "Struttura Configurazione"). Contenuto (fence esterno 4 backtick per permettere fence interni 3 backtick):

````markdown
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
````

### 7.29 Aggiornamento `docs/mappa-progetto.md`

Aggiungere **in cima** al file (dopo header):

```markdown
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

### Public (`public/`)
- `favicon.svg`, `icons/pwa-192.png`, `icons/pwa-512.png`

### Docs (`docs/`)
- `supabase-schema-v1.sql` — DDL+RLS di riferimento (non applicato)
- `superpowers/brainstorms/2026-04-13-sprint-0-setup-brainstorm.md`
- `superpowers/specs/2026-04-13-sprint-0-setup-design.md` — questo spec

### E2E
- `e2e/.gitkeep` — dir vuota, config Playwright pronta (0 test)

### Cartelle intenzionalmente NON create in Sprint 0
- `src/components/` — Sprint 1
- `src/hooks/` — Sprint 1
- `src/services/` — Sprint 1
- `src/repositories/` — Sprint 1

---

## Struttura obiettivo (finale MVP)
```

Il contenuto esistente del file segue invariato dopo questa nuova sezione.

### 7.30 `e2e/.gitkeep`

File vuoto. Serve solo a mantenere la cartella `e2e/` nel repo per il webServer config di Playwright.

### 7.31 `public/favicon.svg` e `public/icons/pwa-{192,512}.png`

**Placeholder visuali**: SVG favicon e PNG icons con tinta unita brand (`#10b981`). Non richiedono design, verranno sostituiti in Sprint 5 (QA).

#### `public/favicon.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#10b981"/>
  <text x="50%" y="50%" font-size="32" font-family="system-ui" fill="white" text-anchor="middle" dy="0.35em">S</text>
</svg>
```

#### Generazione `public/icons/pwa-192.png` e `public/icons/pwa-512.png`

**Approccio scelto (non ambiguo):** il plan implementativo crea uno script one-shot `scripts/gen-icons.mjs` che usa il package `sharp` (aggiunto come `devDependencies`) per convertire il file SVG sopra in due PNG delle dimensioni richieste. Lo script viene eseguito una sola volta con `node scripts/gen-icons.mjs`, produce i PNG in `public/icons/`, e poi **non viene più eseguito**. Né `sharp` né lo script fanno parte del build pipeline di Vite.

Contenuto `scripts/gen-icons.mjs`:

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

Aggiungere a `devDependencies` del `package.json`: `"sharp": "^0.33.0"`.

Aggiungere a `package.json` scripts: `"gen:icons": "node scripts/gen-icons.mjs"`.

**Verifica del file binario**: il plan controlla che `public/icons/pwa-192.png` e `public/icons/pwa-512.png` esistano dopo l'esecuzione dello script, con dimensione file > 0. Una volta generati, i file PNG vengono trattati come asset statici; lo script è conservato per future rigenerazioni.

---

## 8. Ordine di esecuzione (12 step con gate)

Ogni step ha un gate verificabile. Se un gate fallisce, fermarsi e risolvere prima di procedere.

| # | Step | Gate |
|---|------|------|
| 1 | **Scaffold Vite base** — `npm create vite@latest . -- --template react-ts`, pulire file placeholder Vite (`App.css`, `App.tsx` auto-generato, `vite.svg`, `react.svg`, `counter.ts` ecc.) | `npm run dev` avvia e schermata default Vite carica |
| 2 | **Dipendenze runtime + dev** — aggiornare `package.json` con tutte le dipendenze §5, `npm install` | `npm audit --audit-level=high` ritorna 0 |
| 3 | **tsconfig + path alias + types** — `tsconfig.json`, `tsconfig.node.json` | `npx tsc -b --noEmit` passa sui file default |
| 4 | **Tailwind + PostCSS + index.css** — `tailwind.config.ts`, `postcss.config.js`, `src/index.css` | `npm run dev` applica classi Tailwind al placeholder Vite |
| 5 | **ESLint flat config + Prettier** — `eslint.config.js`, `.prettierrc.json` | `npm run lint` passa sui file default |
| 6 | **Vite config completo** — `vite.config.ts` con `basicSsl` + `VitePWA` + alias + HTTPS | `npm run build` produce `dist/sw.js` + `dist/manifest.webmanifest` |
| 7 | **Dexie schema + types** — `src/db/types.ts`, `src/db/database.ts` | `npx tsc -b --noEmit` passa con nuovi file |
| 8 | **Stub Supabase + stores + types/ui** — `src/lib/supabase.ts`, `src/stores/{auth,list,ui}-store.ts`, `src/types/ui.ts`, `src/constants/index.ts` | `npx tsc -b --noEmit` passa |
| 9a | **Icone PWA** — `public/favicon.svg`, `scripts/gen-icons.mjs`, poi `npm run gen:icons` per generare `public/icons/pwa-192.png` e `public/icons/pwa-512.png` | `ls public/icons/pwa-*.png` elenca entrambi i file con size > 0 |
| 9b | **Entry point + App + pages + index.html** — `src/main.tsx`, `src/app.tsx`, `src/pages/{home,not-found}-page.tsx`, `index.html` | `npm run dev` apre https://localhost:5173 e mostra "Hello World" (accettando cert warning) |
| 10 | **Testing setup + Hello World test** — `vitest.config.ts`, `src/test/setup.ts`, `src/test/app.test.tsx` | `npm run test` passa (2 test verdi) |
| 11 | **Playwright config** — `playwright.config.ts`, `e2e/.gitkeep` | `npx playwright test --list` enumera 0 test senza errori |
| 12 | **Documentazione** — `docs/supabase-schema-v1.sql`, aggiornare `docs/mappa-progetto.md`, aggiornare `docs/piano-sviluppo.md`, aggiornare `CLAUDE.md`, `.env.example` | Verifica manuale: ogni file esiste e contiene i blocchi attesi |

---

## 9. Verification procedure

### 9.1 Verification script automatica

Al termine dello Sprint 0, eseguire in sequenza:

```bash
# 1. Install pulita da zero
rm -rf node_modules dist
npm install

# 2. Audit sicurezza
npm audit --audit-level=high

# 3. Type check
npm run typecheck

# 4. Lint
npm run lint

# 5. Format check
npm run format:check

# 6. Unit test
npm run test

# 7. Build production
npm run build

# 8. Verifica artefatti PWA
test -f dist/sw.js && echo "OK: sw.js presente" || echo "FAIL: sw.js mancante"
test -f dist/manifest.webmanifest && echo "OK: manifest presente" || echo "FAIL: manifest mancante"

# 9. Preview HTTPS locale in background + smoke check
npm run preview &
PREVIEW_PID=$!
sleep 3
curl -k https://localhost:4173 | grep -q "<title>ShoppingList</title>" && echo "OK: preview risponde" || echo "FAIL: preview non risponde"
kill $PREVIEW_PID 2>/dev/null || true
```

Tutti gli output devono essere verdi / exit code 0.

> **Nota sul grep target:** `curl` restituisce l'HTML statico iniziale di `dist/index.html`, non il DOM post-idratazione. Il testo "Hello World" è rendering client-side di React e **non** è presente in questo HTML. Quindi si greppa il `<title>ShoppingList</title>` che è statico in `index.html` (§7.1). La verifica del rendering del testo "Hello World" avviene nei test Vitest (§7.26) che montano `<App />` con jsdom.

### 9.2 Verification manuale

Check non automatizzabili in Sprint 0 (richiedono interazione browser):

- [ ] Aprire https://localhost:4173 in Chrome, accettare cert warning "Advanced → Proceed"
- [ ] Verificare che la pagina mostri "Hello World" grande in testa
- [ ] DevTools → Application → Manifest → campo "Installable: yes"
- [ ] DevTools → Application → Service Workers → stato "activated and running"
- [ ] DevTools → Application → IndexedDB → espandere → `ShoppingListDB` → database versione 1 → 5 object store visibili: `lists`, `items`, `changeLog`, `itemCatalog`, `invites`
- [ ] DevTools → Console → log `[db] ShoppingListDB v1 opened` presente
- [ ] DevTools → Console → log `[pwa] app pronta per uso offline` presente (dopo il primo load completo)
- [ ] Chrome → address bar → icon "install app" visibile → click → accetta "install"
- [ ] L'app installata avvia in standalone window e mostra correttamente "Hello World"
- [ ] Navigare a https://localhost:4173/rotta-inesistente → mostra "404 — Pagina non trovata"

### 9.3 Gate di completamento (verification-before-completion)

**Non dichiarare lo sprint completo finché:**

1. **Tutti i comandi automatici** della §9.1 hanno esito positivo (prova documentata: output salvato o conferma esplicita che sono stati eseguiti)
2. **Tutti i check manuali** della §9.2 sono spuntati
3. **Documentazione aggiornata**: `CLAUDE.md`, `piano-sviluppo.md`, `mappa-progetto.md` contengono i blocchi previsti
4. **Nessun TODO/FIXME orfano**: `grep -r "TODO\|FIXME\|XXX" src/` ritorna vuoto o solo commenti documentati

---

## 10. Rischi accettati

| # | Rischio | Probabilità | Impatto | Mitigazione / Sprint di risoluzione |
|---|---------|-------------|---------|-------------------------------------|
| 1 | Cert self-signed richiede click manuale "Advanced → Proceed" al primo load | Alta | Basso | Documentato in CLAUDE.md; "Deploy Activation" avrà cert valido |
| 2 | Nessun test E2E Playwright | Certa | Basso | YAGNI in Sprint 0; Sprint 1 scriverà il primo E2E |
| 3 | Schema PostgreSQL mai validato da DB reale | Certa | Medio | Sprint "Backend Activation" applicherà e validerà |
| 4 | Stores `list-store`/`ui-store` placeholder vuoti | Certa | Nullo | Sprint 1 li popola con actions reali |
| 5 | Nessuna CI configurata | Certa | Basso | Post-MVP o "Deploy Activation" |
| 6 | Discrepanza `architettura.md` vs SRS tratta implicitamente | Media | Medio | Documentata in CLAUDE.md "Stato Progetto"; futuro task di allineamento esplicito |
| 7 | Dexie 4 backward incompatibilità non rilevate | Bassa | Medio | Rollback a Dexie 3 possibile; `database.ts` è 20 righe |
| 8 | ESLint 9 flat config plugin drift | Bassa | Basso | Versioni pinnate in `package.json` |
| 9 | PWA manifest non installabile in Chrome dev mode senza HTTPS | Certa | Nullo | Gestito da `basicSsl()` che abilita HTTPS anche in dev |
| 10 | Supabase-js import carica ~60KB anche se stubbed | Certa | Basso | Accettato (il client reale è comunque richiesto da Sprint 2) |

---

## 11. Hand-off a Sprint 1

Al termine di Sprint 0, Sprint 1 (Core Offline: Liste e Articoli) parte con queste **garanzie documentate**:

### 11.1 API disponibili

- `import { db } from '@/db/database'` → istanza Dexie aperta, 5 object store pronti
- `import { getCurrentUserId } from '@/stores/auth-store'` → ritorna `'local-user-stub'`
- `import { supabase } from '@/lib/supabase'` → importabile (le chiamate `.from()` falliranno con errore di rete — Sprint 1 non deve toccare Supabase)
- `import type { List, Item, ChangeLogEntry, ... } from '@/db/types'` → tipi completi da SRS §4.3
- `import type { AppResult, AppError } from '@/types/ui'` → contract error handling

### 11.2 Pattern attivi

- Path alias `@/` → `src/`
- Kebab-case file naming
- Strict TypeScript (incluso `noUncheckedIndexedAccess`)
- ESLint 9 flat config + Prettier
- Vitest con `fake-indexeddb` per test repositories
- PWA manifest + service worker registrati

### 11.3 File che Sprint 1 deve creare

- `src/repositories/list-repository.ts`, `item-repository.ts`, `change-log-repository.ts`
- `src/services/list-service.ts`, `item-service.ts`
- `src/hooks/use-lists.ts`, `use-items.ts`
- `src/components/lists/list-card.tsx`, `list-form.tsx`
- `src/components/items/item-row.tsx`, `item-form.tsx`
- `src/components/common/` (button, modal, toast, input, badge, confirm-dialog, loading-spinner, empty-state, error-message)
- Prima cartella `components/`, `hooks/`, `services/`, `repositories/` create "on demand"
- Primo test E2E Playwright

---

## 12. Non-goals (ribaditi per chiarezza)

- ❌ Nessuna creazione di progetto Supabase Cloud
- ❌ Nessun deploy pubblico
- ❌ Nessuna authentication reale
- ❌ Nessun sync IndexedDB ↔ backend
- ❌ Nessun componente di dominio (list-card, item-row, ecc.)
- ❌ Nessun test E2E Playwright (config-only)
- ❌ Nessun audit WCAG 2.1 AA
- ❌ Nessun Lighthouse performance audit
- ❌ Nessuna CI/CD pipeline
- ❌ Nessuna icona PWA brand-designed (placeholder OK)
- ❌ Nessuna installazione PWA su device fisico verificata

---

## 13. Riferimenti

- **Brainstorm summary**: [`docs/superpowers/brainstorms/2026-04-13-sprint-0-setup-brainstorm.md`](../brainstorms/2026-04-13-sprint-0-setup-brainstorm.md)
- **Piano sviluppo**: [`docs/piano-sviluppo.md`](../../piano-sviluppo.md) — Sprint 0 annotato con stati aggiornati
- **SRS**: [`docs/SoftwareRequirements.md`](../../SoftwareRequirements.md) — Sezione 4 (Dexie), Sezione 5 (PostgreSQL)
- **Architettura**: [`.claude/architettura.md`](../../../.claude/architettura.md) — pattern di layer
- **Qualità**: [`.claude/qualita.md`](../../../.claude/qualita.md) — enforcement rules
- **CLAUDE.md**: principi core e stato progetto

---

*Spec v1 — 2026-04-13 — In attesa di review utente prima del passaggio a `superpowers:writing-plans`.*
