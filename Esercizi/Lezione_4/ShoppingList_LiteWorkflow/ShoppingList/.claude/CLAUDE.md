# ShoppingList - Progressive Web App

## Panoramica Progetto

**ShoppingList** è una PWA per la gestione di liste della spesa condivise, ispirata a "Buy me a pie".

### Obiettivi Chiave MVP
- ✅ Funzionamento **offline-first** con sincronizzazione online
- ✅ Gestione liste condivise con permessi granulari (read/write)
- ✅ Autocompletamento articoli da database locale
- ✅ Interfaccia semplice e rapida per uso in negozio

### Stack Tecnologico MVP
```
Frontend:  HTML5 + TypeScript + Vite
Storage:   IndexedDB (via Dexie.js)
PWA:       Workbox per Service Worker
UI:        Tailwind CSS
Sync:      Strategy da definire (vedere sync-strategy.md)
```

## Comandi Essenziali

> **Package manager: `pnpm`** (vedi `pnpm-lock.yaml`). Mai `npm` o `yarn`.

```bash
pnpm dev          # Vite dev server
pnpm build        # tsc --noEmit && vite build
pnpm test         # Vitest run-once (usato in CI)
pnpm test:watch   # Vitest watch mode
pnpm typecheck    # tsc --noEmit (no build)
pnpm lint         # eslint src/**/*.ts
pnpm format       # prettier --write
```

**Test stack**: Vitest + `fake-indexeddb` (setup in `src/test-setup.ts`). Il pattern `beforeEach` per test Dexie è documentato nella sezione Gotchas in fondo.

## Struttura Documentazione

Questo progetto utilizza documentazione modulare. **Includi solo i file necessari** per il task corrente:

### 📐 Architettura e Setup
- `architecture.md` - Stack tecnico, struttura progetto, setup iniziale
- `data-model.md` - Schema database, interfacce TypeScript, relazioni

### 🎯 Funzionalità
- `features-mvp.md` - Funzionalità core per MVP (Fase 1)
- `features-future.md` - Feature post-MVP (da implementare dopo)

### 🔄 Sincronizzazione
- `sync-strategy.md` - Architettura sync offline-first, conflict resolution

### 💻 Sviluppo
- `conventions.md` - Code style, naming, best practices TypeScript

## Comandi Rapidi per Claude

**Quando avvii un task**, specifica quale area stai sviluppando:

```
🏗️ Setup iniziale → Leggi: architecture.md, data-model.md
📝 CRUD liste/articoli → Leggi: data-model.md, features-mvp.md (sezioni 1-3)
🔄 Sincronizzazione → Leggi: sync-strategy.md, data-model.md
👥 Autenticazione/Sharing → Leggi: features-mvp.md (sezioni 4-5)
🎨 UI/UX → Leggi: features-mvp.md, conventions.md
```

## Principi Guida Sviluppo

### 1. Offline-First Architecture
```typescript
// Sempre: Local DB → UI → Background Sync
// MAI: API Call → UI Update
```

### 2. Progressive Enhancement
```
MVP → Funziona offline → +Sync → +Notifiche → +Advanced features
```

### 3. Code Quality
- **TypeScript strict mode** abilitato
- **Zero `any` types** nel codice MVP
- **Interfaces-first design** per tutti i modelli dati
- **Functional components** ove possibile

### 4. Performance Target
- First Load: < 3s (3G)
- Time to Interactive: < 5s
- Bundle size: < 200KB (gzipped)

## Stato Sviluppo

Per lo stato corrente di fasi/task, vedi `.claude/development-plan.md`. In sintesi: Fase 1 (DB layer) e Fase 2 (5 services) completate; Fase 3 (UI/UX) è il prossimo step.

## Note per Claude

### 🎯 Focus MVP
Per la Fase 1, **NON implementare**:
- Notifiche push
- OAuth/Social login (solo guest mode + email/password basic)
- Import/Export avanzato
- Modalità shopping con layout supermercato
- CRDTs avanzati

### 📝 Quando generi codice:
1. Inizia sempre con interfaces/types
2. Implementa storage layer per primo
3. Poi business logic
4. Infine UI layer
5. Commenta solo logica complessa (non ovvietà)

### 🔧 Convenzioni File
```
src/
├── models/       ✅ Interfaces e types
├── db/           ✅ IndexedDB layer (Dexie + BaseRepository)
├── utils/        ✅ Helper functions (uuid, storage, events, …)
├── test-setup.ts ✅ fake-indexeddb bootstrap per Vitest
├── main.ts       ✅ Entry point Vite
├── services/     ✅ Business logic (5 services + errors/permissions/PasswordHasher/sync-logger)
├── components/   ⏳ UI vanilla TS (da creare in Fase 3)
└── workers/      ⏳ Service Worker / Workbox (da creare in Fase 5)
```

### 🏛️ Architettura Service Layer (Fase 2)

Lo `src/services/` layer è business logic sopra i repository Dexie, con DI esplicito e un invariante transazionale unificante.

- **Composition root**: `main.ts` chiama `buildServices(db, eventBus, hasher, storage)` → `{ lists, items, articles, auth, share }`. Nessun service importa singleton. In test: `buildTestServicesWired()` da `test-helpers.ts` con fresh db + `FakeHasher` + `InMemoryStorage`
- **Pattern 3-fasi per ogni mutation** (invariante osservabile): (1) pre-txn read+validate+`checkPermissions`, (2) `db.transaction('rw', ...)` write+`logSync`, (3) POST-commit `events.emit`. Se un listener riceve un evento, il dato è già durevole. MAI `events.emit` dentro il callback di `db.transaction`
- **Errori tipati**: gerarchia `ServiceError` → `NotFoundError`/`ForbiddenError`/`ValidationError`/`ConflictError` in `src/services/errors.ts`. Discriminabili via `instanceof` per mapping a toast/dialog dalla UI
- **Permessi**: source of truth in `checkPermissions(list, shares, userId)` di `src/services/permissions.ts`, ritorna `ListPermissions { isOwner, canRead, canWrite, canDelete, canShare }`. La UI deve chiamare `services.share.getUserPermissions(userId, listId)` per gate sui controlli
- **Consumer contract (per Fase 3 UI)**: reactive re-render via `eventBus.on('list:*' | 'item:*' | 'article:*' | 'auth:*' | 'share:*', ...)`; azioni utente chiamano direttamente i metodi dei service; errori catturati e mappati a UI feedback. Gap noto: `AppEventMap` manca `share:updated`/`share:revoked` — da aggiungere quando Fase 3 costruirà la view di gestione permessi

### ⚠️ Gotchas DB layer (appresi in Fase 1)

- **`exactOptionalPropertyTypes: true`** è attivo: usa conditional spread `...(x !== undefined ? { field: x } : {})`, mai `{ field: undefined }` literal
- **Dexie 4 `Table.update()`** richiede `UpdateSpec<T>`, non `Partial<T>`: `await this.table.update(id, { ...changes } as unknown as UpdateSpec<T>)`. Mai `as any`
- **`BaseRepository`** si estende SOLO per entità con soft-delete (`List`, `Item`). `Article`, `User`, `Share` sono classi standalone (hard delete o immutabili). `syncLog` è un helper append-only (`appendSyncLog()`), non un repository
- **Test Dexie pattern**: `beforeEach`: `db = new ShoppingListDB(); await db.delete(); await db.open();`. I metodi del repository che leggono altre tabelle devono usare `this.table.db as ShoppingListDB`, mai importare la singleton `db` (rompe l'isolamento tra test)

### ⚠️ Gotchas service layer (appresi in Fase 2)

- **Nei servizi usa `createSyncLogger(db)` da `@services/sync-logger`**, non `appendSyncLog` da `@db/syncLog`: il secondo importa il singleton e rompe l'isolamento dei test. `appendSyncLog` sopravvive solo per i test di Fase 1
- **Due `new ShoppingListDB()` condividono lo stesso IndexedDB store** (Dexie name hardcoded) — test che vogliono instance isolation devono usare stub `{ syncLog: { add } } as unknown as ShoppingListDB`
- **`EntityType` esclude `'user'`**: `AuthService` NON scrive entry `syncLog`. I record user sono device-local, mappati a identità backend in Fase 5. Altre eccezioni §3.4 (solo queste write non loggano): `ArticleService.incrementUsage` (hot-path stat) e `AuthService.login.lastLoginAt` (metadata di sessione)
- **`ItemService.reorderItems` logga UNA entry aggregata** su `entityType: 'list'` con `payload: { itemOrder: string[] }`, non N entry per item. Emette un solo `list:updated`. Il replay di Fase 5 deve riconoscere questo contratto
- **Clearing optional fields in Dexie update** (es. `acceptedAt`, `checkedAt`/`checkedBy` su uncheck): richiede `import type { UpdateSpec } from 'dexie'` + cast `as unknown as UpdateSpec<T>` sulla chiamata `table.update`. Conditional spread non basta quando vuoi esplicitamente clearare il campo
- **Commit-before-emit test pattern**: listener async `await`a `db.<table>.count()` e risolve un `snapshotAtEmit` Promise; il test `await`a la promise dopo la mutation. Almeno un mutation test per service usa questo pattern — fissa l'invariante 3-fasi a runtime. Valida con negative probe (assertion flipped a valore impossibile) per confermare che il listener venga davvero eseguito

---

**Versione Documentazione**: 1.2  
**Ultimo Update**: 2026-04-14  
**Target MVP**: Fase 2 completata — DB + Services (5 service + 183 test). Prossimo: Fase 3 UI
