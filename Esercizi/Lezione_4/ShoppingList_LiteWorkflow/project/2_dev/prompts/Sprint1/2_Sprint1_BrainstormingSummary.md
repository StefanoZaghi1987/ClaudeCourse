# Brainstorming Fase 1 — Fondamenta

**Data**: 2026-04-13
**Topic**: Setup progetto, modelli dati, database layer, event system
**Riferimento piano**: `.claude/development-plan.md` → Tasks 1.1 – 1.4
**Modalità**: Riprogettazione aperta (non aderenza stretta al piano)

## Contesto di partenza

- Progetto ShoppingList vuoto: solo `.claude/` con documentazione e `.gitignore`.
- Stack target: Vanilla TypeScript + Vite + Dexie.js + Tailwind CSS + Vitest.
- Obiettivo Fase 1: fornire fondamenta (setup, modelli, DB layer, utilities) su cui Fase 2 costruisce la business logic.

## Decisioni chiave

### Scope

| Area | Decisione |
|------|-----------|
| Entità data model | Tutte e 6 (`List`, `Item`, `Article`, `User`, `Share`, `SyncLog`) già in Fase 1 — schema Dexie v1 definitivo, nessuna migration futura |
| Testing | Vitest con test su DB layer + utilities. UI in fasi successive |
| Linting / formatting | ESLint + Prettier obbligatori (non opzionali come nel piano) |
| Package manager | pnpm |
| Coverage report | Rimandato a Fase 6 (niente `@vitest/coverage-v8` ora) |

### Struttura progetto

- **Vite root = `ShoppingList/`** (non `ShoppingList/src/` come erroneamente indicato dal piano). Source code in `ShoppingList/src/`.
- **Placeholder directories** create già in Fase 1 con `.gitkeep`: `services/`, `components/{common,list,item,sync}/`, `views/`, `workers/`. Motivazione: lock-in architetturale per fasi successive.
- **Test co-located** (`ListsDB.test.ts` accanto a `ListsDB.ts`) invece di `src/__tests__/` centralizzato. Motivi: import path locali, orfani impossibili, bundle production identico.

### Architettura DB layer

- **Approccio A — Repository classes** scelto tra 3 alternative (A: classi, B: moduli funzionali, C: Dexie diretto).
- **`BaseRepository<T, TNew>` classe astratta** introdotta (non nel piano originale) per centralizzare:
  - generazione UUID e timestamps in `newEntity()`
  - `touchEntity()` per `updatedAt` + `version++`
  - `softDelete()` e `getById()` generici
- **`SyncLog` gestito da helper append-only** (`src/db/syncLog.ts`, funzione `appendSyncLog`), non come repository CRUD. In Fase 1 definito e testato isolato; i services di Fase 2 lo chiameranno.
- **Indici composti confermati**: `[listId+checked]` su items, `[listId+userId]` su shares.
- **Seed idempotente**: `seedDefaultArticles()` esce senza side effect se articoli default già presenti.

### Event system

- **`EventBus` con mappa eventi tipata** (`AppEventMap` interface) invece del pattern const-di-stringhe del piano originale. Motivazione: type safety compile-time su payload (`eventBus.on('list:created', data => data.list)` validato dal compilatore).
- **`interface AppEventMap`** anziché `type` per supportare declaration merging in fasi future (es. eventi auth in file separato).
- Metodi: `on`, `emit`, `off`, `once` — tutti generici su `K extends keyof AppEventMap`.

### Utilities

- **`sanitizeInput` via DOMParser/`textContent`** invece di regex strip HTML. Motivazione: regex per HTML escape sono notoriamente insicure.
- **`dates.ts`** usa `Intl.RelativeTimeFormat` e `Intl.DateTimeFormat` locale `it-IT`. Zero dipendenze (no date-fns/dayjs).
- **`storage.ts`** LocalStorage wrapper gestisce errori `JSON.parse` silenziosamente (ritorna `undefined`).
- **`dom.ts`** snellito: niente `show/hide/toggle` (useremo classi Tailwind), solo `createElement`, `qs`, `qsa`, `escapeHTML`.
- **`debounce.ts`** restituisce funzione con metodo `cancel()` per annullare chiamate pending.

### TypeScript / build

- **`tsconfig.json`** arricchito rispetto al piano:
  - `exactOptionalPropertyTypes: true` (distingue `x?: T` da `x: T | undefined`)
  - `noImplicitReturns: true`
- **Path aliases barrel-aware**: `@models` → `src/models/index.ts` (non `src/models/*`) per import puliti.
- **`pnpm build` = `tsc --noEmit && vite build`**: forza type-check nel build pipeline (Vite di default non lo fa).

### Testing

- **Environment Vitest = `node`** (non `jsdom`): IndexedDB fornito da `fake-indexeddb/auto` in `src/test-setup.ts`. Motivazione: 10x più veloce di jsdom.
- **`globals: false`**: forza import espliciti di `describe`/`it`/`expect` da `vitest` per chiarezza.
- **Coverage test Fase 1** (co-located):
  - DB: `BaseRepository`, `ListsDB`, `ItemsDB`, `ArticlesDB`, `SharesDB`, `UsersDB`, `syncLog`
  - Utils: `events`, `validators`, `debounce`, `storage`, `uuid`
  - **Skip**: `dates.ts`, `dom.ts` (thin wrapper di API browser, test costerebbero più del loro beneficio)

### Bootstrap `main.ts`

- Funzione `bootstrap()` minimale che: apre DB, esegue seed, logga readiness, scrive placeholder DOM "ShoppingList — Fase 1 OK".
- Intenzionalmente brutto — serve come smoke test visuale del lower stack. Sparisce in Fase 3.

## Definition of Done

Criteri oggettivi (verificabili senza soggettività):

- [ ] `pnpm install` senza errori
- [ ] `pnpm dev` → pagina mostra placeholder, 0 errori console
- [ ] IndexedDB in DevTools contiene 6 tabelle + ≥15 articoli seed
- [ ] `pnpm typecheck` → 0 errori
- [ ] `pnpm lint` → 0 errori, 0 warning
- [ ] `pnpm test` → tutti verdi
- [ ] `pnpm build` → bundle JS totale <200KB gzipped
- [ ] Smoke test riproducibilità: `rm -rf node_modules dist .vite && pnpm install && pnpm build && pnpm test` funziona

## Scope creep da evitare

Durante l'implementazione di Fase 1 **non** aggiungere:

- File in `src/services/` (solo `.gitkeep`)
- Componenti UI oltre al placeholder di `main.ts`
- Gestione errori utente-facing (toast, modal)
- Configurazione workbox runtimeCaching dettagliata
- CI/CD (GitHub Actions)
- README verboso — solo skeleton Vite

## Deviazioni dal `development-plan.md` originale

| Tema | Piano originale | Dopo brainstorming |
|------|-----------------|-------------------|
| Vite root | `src/` (produrrebbe `src/src/`) | `ShoppingList/` (standard) |
| ESLint/Prettier | Opzionale | Obbligatori |
| `BaseRepository` | Non presente | Classe astratta condivisa |
| `SyncLog` handling | Implicito nello schema | Helper `appendSyncLog` esplicito |
| `EventBus` typing | Const di stringhe + metodi generici | Mappa eventi tipata con generics |
| `sanitizeInput` | Non specificato il "come" | Via `DOMParser`/`textContent`, no regex |
| tsconfig | `strict: true` base | + `exactOptionalPropertyTypes`, `noImplicitReturns` |
| Test location | Non specificato | Co-located |
| Test setup | Non specificato | `fake-indexeddb` + `environment: node` |
| `pnpm build` | `vite build` | `tsc --noEmit && vite build` |

## Prossimi passi

1. Aggiornamento `.claude/development-plan.md` Fase 1 con le decisioni sopra.
2. Scrittura spec dettagliata in `docs/superpowers/specs/2026-04-13-fase1-fondamenta-design.md`.
3. Spec self-review (placeholder, consistenza, ambiguità).
4. Review utente dello spec.
5. Invocazione `writing-plans` skill per creare il piano di implementazione eseguibile.
