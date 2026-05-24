# ShoppingList — Configurazione Claude Code

> **Progetto:** ShoppingList MVP — PWA offline-first per la gestione collaborativa di liste della spesa  
> **Stack:** React 18 + TypeScript + Vite + Dexie.js + Supabase + Zustand + Tailwind CSS  
> **Metodologia:** Spec-Driven Development con Claude Code  
> **Versione config:** 1.0 | **Data:** Marzo 2026

---

## Comandi principali

```bash
npm run dev        # dev server HTTPS self-signed → https://localhost:5173
npm run build      # production build (tsc -b + vite build)
npm run preview    # preview production build
npm run test       # vitest run — suite ~30s dominati da fake-indexeddb setup, NON considerarla hung
npm run test:watch # vitest in watch mode
npm run lint       # eslint src --max-warnings 0
npm run typecheck  # tsc --noEmit && tsc --noEmit -p tsconfig.node.json (vedi Gotchas)
```

**Gate pre-commit obbligatorio:** `typecheck + lint + test` tutti verdi.

---

## Stato Progetto (aggiornato: 2026-04-15)

### Sprint corrente: Sprint 1.5 ✅ completato — Sprint 2 pronto a partire

Sprint 0 è stato completato il 2026-04-13 (skeleton offline-only).
Sprint 1 è stato completato il 2026-04-14 (CRUD offline-first, 75 test).
**Sprint 1.5 (Item CRUD UX Refinement) è stato completato il 2026-04-15** in una
singola sessione seguendo il plan approvato `docs/plans/Sprint1_AddedFeatures_ItemsCRUD.md`:
- Catalogo articoli locale Dexie (anticipazione parziale Sprint 5, locale-only no-sync)
- Autocomplete con debounce 200ms + keyboard nav ARIA
- Quick-add bar progressive disclosure (chip categoria, stepper qty, unit select)
- `ItemRow` refactor: rimosso menu `⋮`, tap-to-toggle + icone inline `✎`/`🗑`
- Label italiani localizzati per categoria e unità di misura

L'app supporta CRUD completo di liste e articoli offline-first con UX raffinata.
Tutte le operazioni funzionano con DevTools → Network → Offline.
Sprint 2 (Auth) sostituirà l'auth-store stub con auth Supabase reale.

### Sprint 1 — Fasi completate (2026-04-14)

| Fase | Contenuto | File | Test |
|------|-----------|------|------|
| 0 | Setup: `@radix-ui/react-dialog` + `dexie-react-hooks` | `package.json` | — |
| 1 | Utilities: `id-utils`, `validation` (con `validateItemPatch`), `diff`, `_internal/domain-error`, `_internal/map-db-error` | 7 file | +15 |
| 2 | Repositories thin: `list-repository`, `item-repository`, `change-log-repository` (tutti con `tx?: Transaction`) | 5 file | +10 |
| 3 | Services TDD: `listService` (create/update/archive/unarchive/deleteCascade) + `itemService` (create/update/toggle/delete/restore), tutti con `AppResult<T>`, `db.transaction`, `DomainError`→rollback, ChangeLog atomico | 4 file | +37 |
| 4 | Hooks: `use-lists`, `use-items`, `use-deleted-items` con `useLiveQuery` reattivo + 11 test | 6 file | +11 |
| 5 | UI common: `button`, `input`, `badge`, `modal` (Radix Dialog), `confirm-dialog` (useConfirm), `toast-container`, `empty-state`, `loading-spinner`, `error-message` + rewrite `ui-store` con toast queue | 10 file | — |
| 6 | UI lists: `list-card` (menu + inline rename + live count), `list-form` (Modal + validation), `archived-section` + rewrite `home-page` | 4 file | — |
| 7 | UI items + pagine: `item-row`, `item-form` (full form), `item-quick-add-bar`, `item-trash-row` + `list-page` (nuova) + `trash-page` (nuova) | 6 file | — |
| 8 | Wire & docs: routing `/lists/:listId` + `/lists/:listId/trash` in `app.tsx`, `ToastContainer` mount, `mappa-progetto.md` + `piano-sviluppo.md` aggiornati | 3 file | — |
| 9 | Final DoD: gates verificati (typecheck ✅, lint ✅, 75 test green, coverage service ~99%) | — | — |

**Tests totali:** 75 green (da 64 inizio Sprint 1, +11 hook tests) | **Typecheck + lint + test:** tutti verdi

**Coverage services (Fase 9):**
- `list-service.ts` — 98.9% lines, 96.66% branches (uncovered: catch defensive su `mapDbError` per fallimenti Dexie imprevisti)
- `item-service.ts` — 99.11% lines, 91.83% branches (idem)

### Sprint 1.5 — Fasi completate (2026-04-15)

| Fase | Contenuto | File | Test |
|------|-----------|------|------|
| 0 | Labels italiani `CATEGORY_LABELS_IT`/`UNIT_LABELS_IT` + helper | `src/utils/item-labels.ts` | — |
| 1 | Catalog repository thin + service (getSuggestions + recordUsage) + integrazione in `itemService.createItem` (`db.itemCatalog` nella tx) | `catalog-repository.ts`, `catalog-service.ts`, `item-service.ts` | +15 |
| 2 | Hook `use-catalog-suggestions` con debounce 200ms (no `useLiveQuery`) | `src/hooks/use-catalog-suggestions.ts` | +3 |
| 3 | `ItemNameAutocomplete` controlled + keyboard nav ARIA combobox + dropdown sticky-top | `src/components/items/item-name-autocomplete.tsx` | — |
| 4 | `ItemQuickAddBar` rewrite progressive disclosure + embed autocomplete + handlePick intelligente (firma `onSubmit` cambia a `QuickAddInput`) | `item-quick-add-bar.tsx`, `list-page.tsx` | — |
| 5 | `ItemRow` rimuove menu `⋮`; layout ibrido checkbox + body-button tap-to-toggle + icone inline `✎`/`🗑` con `stopPropagation`, touch target 40×40 | `src/components/items/item-row.tsx` | — |
| 6 | `ItemForm` select unit/category usa label italiani da `item-labels.ts` | `src/components/items/item-form.tsx` | — |
| 7 | Component test: `item-row` (4) + `item-quick-add-bar` (3) + `item-name-autocomplete` (3, con `vi.useFakeTimers()` + mock `catalogService.getSuggestions`) | 3 test file | +10 |
| 8 | Docs: `mappa-progetto.md`, `piano-sviluppo.md`, `CLAUDE.md` aggiornati | 3 file | — |
| 9 | Final DoD: typecheck + lint + test green | — | — |

**Tests totali Sprint 1.5:** 103 green (da 75 Sprint 1, +28: catalog repo 5, catalog service 8, item-service integration +2, use-catalog-suggestions 3, component tests 10) | **Typecheck + lint + test:** tutti verdi

**Architettura catalogo (§D.3 plan 1.5):** il `catalogRepository` è **locale-only** e NON scrive su `changeLog`. Motivazione: il catalogo è un indice personale derivabile (aggregabile offline), replicarlo via changeLog incrementerebbe il debito sync senza valore funzionale. Lo schema `itemCatalog` esiste già in Dexie v1 (nessuna migration). Il task `S5-04` (sync catalogo tra collaboratori) resta full-scope in Sprint 5.

### Cosa funziona oggi

- `npm run dev` → app su https://localhost:5173 con HomePage CRUD liste
- Crea/modifica/archivia/disarchivia/elimina liste (con conferma su elimina)
- Naviga a `/lists/:id` → articoli reattivi, toggle checkbox, modifica via form, soft delete con conferma
- Aggiunta rapida articoli via `ItemQuickAddBar` con auto-focus post-submit
- Naviga a `/lists/:id/trash` per vedere e ripristinare articoli cancellati
- `ArchivedSection` collassabile in fondo a HomePage
- `<ToastContainer />` globale per feedback operazioni (auto-dismiss 3s)
- Tutte le operazioni funzionano offline (DevTools → Network → Offline)
- `changeLog` popolato atomicamente per ogni mutation (visibile in DevTools → IndexedDB)
- 103 unit test verdi post-Sprint 1.5 (+10 component test, service al 100% coverage effettivo sulle branch raggiungibili)
- `npm run typecheck` / `npm run lint` passano

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
5. Aggiornare `src/stores/auth-store.ts` con auth Supabase reale
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

### Gotchas tecniche

- `tsc -b --noEmit` fallisce in TS 5.6+ → script `typecheck` usa `tsc --noEmit && tsc --noEmit -p tsconfig.node.json`
- Nei file `.tsx` serve `import type { JSX } from 'react'` perché `tsconfig.json` `types: [...]` esclude `@types/react`
- File naming in `src/`: **kebab-case** obbligatorio (`home-page.tsx`, non `HomePage.tsx`)
- Import cross-module: usa sempre path alias `@/foo` (mappato a `src/foo`), mai relativi `../`
- ESLint globals whitelist: solo `window/document/navigator/console` — per UUID usa `generateId()` da `@/utils/id-utils`, per timer usa `window.setTimeout`, mai namespace `React.Foo` (importa i tipi direttamente da `'react'`)
- ESLint `@typescript-eslint/unbound-method`: NON destrutturare metodi da hook return (`const { create } = useLists()` → errore); destrut solo valori (`const { lists, isLoading } = hook`) e chiama metodi via property-access `hook.create(…)`
- Callback prop TypeScript: sempre property syntax `onFoo: () => void`, MAI method shorthand `onFoo(): void` (scatena `unbound-method` al consumer)
- ESLint `no-misused-promises` + `no-floating-promises`: async handler in prop sincrono va wrappato — `onSubmit={(e) => { void handleSubmit(e) }}` e `onClick={() => { void fooAsync() }}`, mai passati nudi
- ESLint `@typescript-eslint/require-await`: `vi.fn(async (x) => result)` senza `await` interno fallisce — usa `vi.fn((x) => Promise.resolve(result))` per mock Promise-returning
- Test factories: helper mock si chiamano `buildMock<Entity>()` (es. `buildMockItem`, `buildMockCatalogItem`), non `build<Entity>()` nudo — coerenza con `catalog-service.test.ts`, `catalog-repository.test.ts`, `use-catalog-suggestions.test.ts`

---

## Struttura Configurazione

```
CLAUDE.md                    ← Questo file (principi core + navigazione)
.claude/
  architettura.md            ← Stack, layer, struttura directory, pattern
  dominio.md                 ← Business rules, entità, permessi, glossario
  qualita.md                 ← Enforcement rules, standard codice, checklist
  sync.md                    ← Offline-first, sync, conflict resolution
  testing.md                 ← Strategia test, copertura, scenari critici
  sicurezza.md               ← Autenticazione, RLS, validazione, OWASP
docs/
  piano-sviluppo.md          ← Sprint plan completo con task e milestone
  mappa-progetto.md          ← Project map: ogni file e sua responsabilità
```

### Quando leggere i file di configurazione

| File | Leggilo quando... |
|------|-------------------|
| `.claude/architettura.md` | Crei nuovi file, componenti, hook, service o definisci pattern |
| `.claude/dominio.md` | Implementi business logic, permessi, entità di dominio |
| `.claude/qualita.md` | Inizi qualsiasi task di sviluppo (regole sempre attive) |
| `.claude/sync.md` | Lavori su changeLog, sync, IndexedDB, Supabase Realtime |
| `.claude/testing.md` | Scrivi o modifichi test, fai refactoring |
| `.claude/sicurezza.md` | Gestisci auth, RLS, input utente, API calls |
| `docs/piano-sviluppo.md` | Pianifichi il prossimo sprint o task |
| `docs/mappa-progetto.md` | Cerchi un file specifico nel progetto |

### Quando aggiornare i file di configurazione

- **`docs/mappa-progetto.md`**: Aggiorna ogni volta che crei, sposti o elimini un file
- **`docs/piano-sviluppo.md`**: Aggiorna al completamento di ogni task (segna ✅)
- **`.claude/dominio.md`**: Aggiorna se emergono nuove regole di business o entità
- **`.claude/architettura.md`**: Aggiorna se cambia struttura directory o pattern architetturali

---

## Principi Core (sempre attivi)

### 1. Offline-First è non negoziabile
- **IndexedDB (Dexie.js) è la source of truth primaria**
- Ogni operazione funziona completamente offline
- Supabase è un enhancement, mai un requisito per la UX
- Chiediti sempre: "Funziona senza rete?" → Se no, correggere prima di procedere

### 2. Nessuna perdita di dati
- Usa sempre soft delete (flag `deleted: true`), mai hard delete sugli articoli
- Ogni modifica genera un record nel `changeLog` locale
- Operazioni distruttive richiedono sempre conferma utente

### 3. Validazione sempre
- Validare lato client per UX (disabilita pulsanti, mostra errori inline)
- **Validare lato server (RLS Supabase) per sicurezza — non fidarsi mai del client**
- Sanitizzare tutti gli input utente (anti-XSS su note e testi liberi)

### 4. Optimistic UI
- Mostra il cambiamento immediatamente nell'UI
- Persisti in IndexedDB in modo sincrono
- Sincronizza con Supabase in background
- In caso di errore di sync, mostra notifica non-bloccante e riprova

### 5. Separazione dei Layer
```
UI (React Components)
    ↓ chiama
Custom Hooks (orchestrazione UI ↔ Business Logic)
    ↓ chiama
Services (Business Logic pura, testabile in isolamento)
    ↓ chiama
Repositories (Dexie.js — accesso dati locale)
    ↓ sync asincrono
Supabase (remoto, eventuale)
```
**Regola assoluta:** I layer chiamano solo il layer direttamente sottostante. Nessun salto.

---

## Standard di Codice (enforcement rapido)

```
File: target < 200 LOC | max 400 LOC | warning a 150 LOC
Funzione: max 20 LOC | max 4 parametri | una sola responsabilità
Componente React: max 200 LOC | no business logic inline
Duplicazione: estrai alla 3ª occorrenza (DRY)
Nesting: max 3 livelli
TypeScript: strict mode attivo, no "any" mai
```

**Self-check obbligatorio prima di completare ogni task:**
```
□ File rispetta i limiti di dimensione?
□ TypeScript compila senza errori/warning?
□ ESLint passa senza errori?
□ Test scritti e passanti?
□ Nessun dato sensibile in log/console?
□ mappa-progetto.md aggiornata (se nuovi file)?
```

**Scope:** le regole `.claude/qualita.md` (no `any`, no suppressioni) valgono anche per i config file root (`vite.config.ts`, `vitest.config.ts`, ecc.), non solo `src/**` che è lo scope di ESLint.

Per regole complete → `.claude/qualita.md`

---

## Riferimenti Documentazione

- **Requisiti funzionali e non funzionali completi:** `docs/SoftwareRequirements.md`
- **Analisi e motivazione stack tecnologico:** `docs/FrameworkAnalysis.md`
- **Best practices universali di sviluppo:** `docs/UniversalSoftwareDevelopmentBestPractices.md`
- **Piano di sviluppo sprint:** `docs/piano-sviluppo.md`
- **Project map:** `docs/mappa-progetto.md`

---

## Quick Start per nuove feature

**Pattern operativo Sprint** (usato in Sprint 0-1, continuare in Sprint 2+):

1. **Brainstorm** — esplora scope/design con `superpowers:brainstorming`, output in `docs/superpowers/brainstorms/YYYY-MM-DD-*.md`
2. **Spec** — formalizza il design in `docs/specs/SprintN_*_Spec.md` (requisiti, contratti type, scenari edge)
3. **Plan** — traduci lo spec in task TDD eseguibili in `docs/plans/SprintN_*_Plan.md` (fasi numerate, codice verbatim, commit point per task)
4. **Execute** — usa `superpowers:subagent-driven-development` per eseguire il plan task-per-task (un implementer subagent fresco + spec review + code quality review per ciascuno)
5. **Claude non esegue comandi `git`** — l'utente committa manualmente; Claude si limita a listare i file pronti al commit al termine di ogni fase

**Per nuove feature dentro uno sprint già iniziato:**

1. Leggi `.claude/qualita.md` (regole base sempre attive)
2. Leggi la sezione SRS relativa alla feature (`docs/SoftwareRequirements.md`)
3. Consulta `.claude/architettura.md` per pattern e struttura
4. Consulta `.claude/dominio.md` per regole di business
5. Implementa seguendo il layer appropriato
6. Scrivi test (`.claude/testing.md`)
7. Aggiorna `docs/mappa-progetto.md` con i nuovi file
8. Verifica self-check checklist sopra

---

*Configurazione v1.0 — ShoppingList MVP — Marzo 2026*
