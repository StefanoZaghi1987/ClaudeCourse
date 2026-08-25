# Piano di Sviluppo MVP — ShoppingList

> **Metodologia:** Spec-Driven Development con Claude Code  
> **Stack:** React 18 + TypeScript + Vite + Dexie.js + Supabase + Zustand + Tailwind CSS  
> **Durata stimata totale:** 7-9 settimane  
> **Ultimo aggiornamento:** 2026-04-15 (Sprint 1 completato; Sprint 1.5 completato — 103 test green)

---

## Legenda Stato Task

```
[ ] = Da fare
[🔄] = In corso
[✅] = Completato
[⏸] = Bloccato (motivo nel commento)
```

---

## Sprint 0 — Setup Infrastruttura (Settimana 1)

> **Brainstorming completato:** 2026-04-13 — [`docs/superpowers/brainstorms/2026-04-13-sprint-0-setup-brainstorm.md`](./superpowers/brainstorms/2026-04-13-sprint-0-setup-brainstorm.md)
> **Design spec:** [`docs/superpowers/specs/2026-04-13-sprint-0-setup-design.md`](./superpowers/specs/2026-04-13-sprint-0-setup-design.md) *(in scrittura dopo il brainstorming)*

**Obiettivo (riadattato):** Skeleton applicativo offline-only funzionante, DB Dexie v1 inizializzato, stub Supabase tipizzato importabile, PWA installabile da preview locale HTTPS.
**Criterio completamento (riadattato):** `npm run dev` avvia l'app con "Hello World" su HTTPS locale, `npm run build && npm run preview` produce PWA installabile da Chrome DevTools, `npm run test` supera smoke test Vitest, `npm run typecheck`/`lint` senza errori, DB Dexie v1 visibile in DevTools → IndexedDB.
**Deviazione dal piano originale:** Supabase Cloud e Vercel non sono disponibili in questo ambiente. I task **S0-04, S0-05, S0-12 sono bloccati e deferred**; **S0-11 è implementato come stub tipizzato**. Vedi **Note di deviazione Sprint 0** sotto.

| ID | Task | Durata | Dipendenze | Stato |
|----|------|--------|-----------|-------|
| S0-01 | Setup progetto: `npm create vite@latest` + React + TypeScript (bootstrap manuale `package.json` perché dir non vuota) | 1h | — | [✅] |
| S0-02 | Configurazione Tailwind CSS 3 | 30min | S0-01 | [✅] |
| S0-03 | Configurazione ESLint 9 flat config + Prettier (strict TypeScript) | 30min | S0-01 | [✅] |
| S0-04 | ~~Setup Supabase progetto + DDL schema v1 (SRS Sezione 5)~~ — deferred, DDL copiato in `docs/supabase-schema-v1.sql` come riferimento non applicato | 2h | — | [⏸] |
| S0-05 | ~~Configurazione RLS Supabase (SRS Sezione 5.3)~~ — deferred, incluso nel file SQL di riferimento | 2h | S0-04 | [⏸] |
| S0-06 | Setup Dexie.js 4 schema locale v1 (SRS Sezione 4.2/4.3) | 1h | S0-01 | [✅] |
| S0-07 | Setup vite-plugin-pwa + `@vitejs/plugin-basic-ssl` + manifest + Service Worker | 1h | S0-01 | [✅] |
| S0-08 | Setup Vitest + Testing Library + fake-indexeddb + Playwright (config-only) | 1h | S0-01 | [✅] |
| S0-09 | Struttura directory progetto (solo cartelle con file reali, no dead code) | 30min | S0-01 | [✅] |
| S0-10 | Setup Zustand stores base (`auth-store` funzionale, `list-store`/`ui-store` placeholder) | 1h | S0-01 | [✅] |
| S0-11 | Configurazione Supabase client singleton — **stub tipizzato** (no connessione rete) | 30min | S0-01 | [✅] |
| S0-12 | ~~Deploy pipeline Vercel~~ — deferred, verifica PWA via `vite preview` su HTTPS locale | 1h | S0-01 | [⏸] |
| S0-13 | Routing base: `App`, `HomePage`, `NotFoundPage` (React Router 6). LoginPage deferred a Sprint 2 | 1h | S0-01 | [✅] |
| S0-14 | Aggiorna `docs/mappa-progetto.md` + `CLAUDE.md` (sezione "Stato Progetto") con struttura iniziale | 30min | S0-09 | [✅] |

**✅ Milestone M1 (ridefinita):** App avviabile, DB Dexie v1 inizializzato, PWA installabile da preview locale HTTPS. Auth e sync deferred agli sprint dedicati.

### Note di deviazione Sprint 0

**Contesto del brainstorming 2026-04-13:** Nessun accesso disponibile a Supabase Cloud né a Vercel. Lo Sprint 0 è stato riadattato per eliminare queste dipendenze esterne senza violare il principio offline-first. Dettagli completi nel [brainstorm summary](./superpowers/brainstorms/2026-04-13-sprint-0-setup-brainstorm.md).

**Task riadattati:**

- **S0-04, S0-05 (Supabase DDL + RLS) → `[⏸]`**
  DDL + policy RLS + indici + trigger copiati letteralmente dalle Sezioni 5.2/5.3/5.4/5.5 dell'SRS in `docs/supabase-schema-v1.sql` come file di riferimento **non applicato**. Questo file deve essere applicato via Supabase SQL Editor quando il progetto Cloud sarà creato (vedi sprint "Backend Activation" sotto).

- **S0-11 (Supabase client singleton) → `[ ]` come stub**
  Implementato in `src/lib/supabase.ts` come `createClient()` reale verso URL invalido (`https://stub.invalid`) con `auth.autoRefreshToken`, `persistSession`, `detectSessionInUrl` tutti a `false`. Qualsiasi chiamata `.from()` / `.auth.*` fallisce con errore di rete — comportamento **intenzionale** per non nascondere il debito tecnico. I tipi sono identici a `SupabaseClient` reale (dipendenza `@supabase/supabase-js`), quindi il codice applicativo Sprint 1+ non dovrà cambiare import/call-site quando lo stub sarà sostituito. Flag `SUPABASE_IS_STUB = true as const` per narrowing compile-time.

- **S0-12 (Deploy Vercel) → `[⏸]`**
  Verifica PWA effettuata localmente tramite `@vitejs/plugin-basic-ssl` (cert self-signed auto-generato da Vite) + `vite preview --https`. Cert richiede click manuale "Advanced → Proceed" in browser al primo load. Scelto sopra `mkcert` per assenza di installazione binary manuale.

- **S0-13 (Routing) → parziale**
  Creati `App.tsx`, `HomePage`, `NotFoundPage`. `LoginPage` **deferred a Sprint 2** (Autenticazione) dove ha il contesto logico corretto.

**Nuovi sprint da programmare prima di Sprint 3 (Sincronizzazione):**

#### Sprint "Backend Activation" *(da programmare — blocca Sprint 3)*

1. Creare progetto Supabase Cloud, ottenere `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
2. Applicare `docs/supabase-schema-v1.sql` via Supabase Studio → SQL Editor (contenuto letterale di SRS §5)
3. Popolare `.env.local` con le credenziali
4. Sostituire `src/lib/supabase.ts` stub con client reale (snippet completo in `CLAUDE.md` sezione "Stato Progetto")
5. Aggiornare `src/stores/auth-store.ts` con auth Supabase reale
6. Test RLS policies con dati fake (script dedicato)
7. Rimuovere `SUPABASE_IS_STUB` o impostarlo a `false as const`

#### Sprint "Deploy Activation" *(da programmare — blocca Sprint 3)*

1. Scegliere target hosting: Vercel / Netlify / Cloudflare Pages / GitHub Pages
2. Connettere repo git e configurare build (`npm run build`, output `dist/`)
3. Configurare env vars `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in dashboard hosting
4. Verificare build remoto end-to-end
5. Test installabilità PWA su device fisico: iOS Safari + Android Chrome
6. Aggiungere CI minima (typecheck + lint + test) se il provider lo supporta nativamente

> **Entrambi questi sprint devono essere completati prima dello Sprint 3** (Sincronizzazione), altrimenti `syncService` non può essere implementato/testato.

**Discrepanze di documentazione risolte durante il brainstorming:**

| Documento | Contenuto | Risoluzione |
|-----------|-----------|-------------|
| `.claude/architettura.md` | Dexie v3 | Si usa **Dexie 4** (stable, backward-compatible con esempi SRS) |
| `.claude/architettura.md` | Tabella `syncState` nello schema Dexie | **Rimossa** — non esiste in SRS Sezione 4.2 v1 |
| `.claude/architettura.md` | `src/types/domain.ts`, `api.ts`, `ui.ts` | Si usa **`src/db/types.ts`** (da SRS §4.3) + `src/types/ui.ts` |

**Ordine di priorità autoritativa** (dichiarato in `CLAUDE.md` sezione "Stato Progetto"):

1. `docs/SoftwareRequirements.md` — fonte primaria (DDL, schema Dexie, tipi)
2. `CLAUDE.md` — stato corrente del progetto
3. `.claude/architettura.md` — pattern architetturali
4. `docs/mappa-progetto.md` — localizzazione file

---

## Sprint 1 — Core Offline: Liste e Articoli (Settimane 2-3)

> **Brainstorming completato:** 2026-04-14 — [`docs/superpowers/brainstorms/2026-04-14-sprint-1-core-offline-brainstorm.md`](./superpowers/brainstorms/2026-04-14-sprint-1-core-offline-brainstorm.md)
> **Design spec:** [`docs/specs/Sprint1_CoreOffline_Spec.md`](./specs/Sprint1_CoreOffline_Spec.md)
> **Implementation plan:** [`docs/plans/Sprint1_CoreOffline_Plan.md`](./plans/Sprint1_CoreOffline_Plan.md) — 33 task TDD su 9 fasi

**Obiettivo:** CRUD completo di liste e articoli offline-first, senza autenticazione.
**Criterio completamento:** Tutte le operazioni funzionano con DevTools → Network → Offline.
**Stima rivista post-brainstorming:** ~52.5h (48.5h originali + 4h test aggiunti)

**✅ Completato (2026-04-14):** Tutte le fasi (0-9) del plan sono state eseguite.
CRUD completo offline funzionante con 75 test green.

| ID | RF | Task | Durata | Stato |
|----|-----|------|--------|-------|
| S1-01 | RF-LIST-001 | Repository: listRepository (CRUD Dexie + parametro `tx?`) | 3h | [✅] |
| S1-01b | — | listRepository smoke test (5 test) — *aggiunto da brainstorming* | 0.5h | [✅] |
| S1-02 | RF-LIST-001 | Service: listService (create, update, archive, delete) + utility shared (`validation`, `id-utils`, `diff`, `_internal/{domain-error, map-db-error}`) | 3h | [✅] |
| S1-03 | RF-LIST-001 | Hook: useLists (lista reattiva con useLiveQuery) | 2h | [✅] |
| S1-03b | — | useLists test (4 test) — *aggiunto da brainstorming* | 1h | [✅] |
| S1-04 | RF-LIST-001 | UI: HomePage con lista delle liste + ListCard + ArchivedSection inline | 4h | [✅] |
| S1-05 | RF-LIST-002 | UI: Form creazione/modifica lista (ListForm) | 2h | [✅] |
| S1-06 | RF-LIST-003 | Soft delete lista + ConfirmDialog + cascade su articoli (1+N changeLog entries atomicamente) | 1h | [✅] |
| S1-07 | RF-LIST-004 | Archiviazione lista (status: ARCHIVED) — UI in menu kebab di ListCard + ArchivedSection | 1h | [✅] |
| S1-08 | RF-ITEM-001 | Repository: itemRepository (CRUD + getMaxSortOrder + listActiveInList + parametro `tx?`) | 3h | [✅] |
| S1-08b | — | itemRepository smoke test (5 test) — *aggiunto da brainstorming* | 0.5h | [✅] |
| S1-09 | RF-ITEM-001 | Service: itemService (create, update, delete, restore, toggle) | 3h | [✅] |
| S1-10 | RF-ITEM-001 | Hook: useItems (articoli reattivi per listId) | 2h | [✅] |
| S1-10b | — | useItems test (4 test) — *aggiunto da brainstorming* | 1h | [✅] |
| S1-11 | RF-ITEM-001 | UI: ListPage con lista articoli + ItemRow + ItemQuickAddBar (file separato) | 4h | [✅] |
| S1-12 | RF-ITEM-002 | Toggle stato DA_COMPRARE/COMPLETATO **(solo tap su checkbox)** — *swipe rinviato a V1.0 Modalità Shopping* | 2h | [✅] |
| S1-13 | RF-ITEM-003 | UI: Form aggiunta/modifica articolo (ItemForm) — *no autocompletamento (Sprint 5)* | 3h | [✅] |
| S1-14 | RF-ITEM-004 | Soft delete articolo (deletedAt timestamp) **— solo pulsante menu/form, no swipe** | 1h | [✅] |
| S1-15 | RF-ITEM-005 | UI: TrashPage **per-lista** (`/lists/:listId/trash`) — cestino articoli + ripristino. *No undo toast con azioni (rinviato a V1.0)* | 3h | [✅] |
| S1-15b | — | useDeletedItems test (3 test) — *aggiunto da brainstorming* | 1h | [✅] |
| S1-16 | — | changeLogRepository + utility `diff.ts` + documentazione `operationType` semantics | 3h | [✅] |
| S1-17 | — | Componenti comuni **(9 file)**: Button, Input, Badge, Modal (con `@radix-ui/react-dialog`), ConfirmDialog, ToastContainer, EmptyState, LoadingSpinner, ErrorMessage + rewrite `ui-store.ts` con toast queue | 4h | [✅] |
| S1-18 | — | Test Unit: listService (16 test verdi, 98.9% line coverage — catch defensive branches only) | 2h | [✅] |
| S1-19 | — | Test Unit: itemService (21 test verdi, 99.11% line coverage — catch defensive branches only) | 2h | [✅] |
| S1-20 | — | Aggiorna `docs/mappa-progetto.md` | 30min | [✅] |

**✅ Milestone M2 raggiunta:** CRUD completo offline funzionante. 75 test green. Typecheck + lint + test tutti verdi. Vedi `docs/plans/Sprint1_CoreOffline_Plan.md` per il plan eseguito e `docs/mappa-progetto.md` sezione "Stato Sprint 1" per l'inventario file.

### Progresso dettagliato Sprint 1 (completato 2026-04-14)

Sprint 1 è stato eseguito in **due sessioni consecutive** con `superpowers:subagent-driven-development`, entrambe il 2026-04-14. Tutte le 9 fasi del plan (`docs/plans/Sprint1_CoreOffline_Plan.md`) sono verdi.

**Sessione 1 — Fasi 0-3 (backend offline):**

- **Phase 0 — Setup:** `@radix-ui/react-dialog@^1` installato, `dexie-react-hooks` già presente
- **Phase 1 — Utilities di fondazione:** `src/utils/id-utils.ts`, `src/utils/validation.ts` (con `LIMITS`, `validateListName`, `validateItemInput`, **`validateItemPatch`** — quest'ultimo aggiunto dalla review per validare patch parziali senza nome), `src/utils/diff.ts` (con fix union keys da review), `src/services/_internal/domain-error.ts`, `src/services/_internal/map-db-error.ts`
- **Phase 2 — Repositories:** `src/repositories/list-repository.ts`, `item-repository.ts`, `change-log-repository.ts` — tutti thin wrapper con `tx?: Transaction`, smoke test 5+5
- **Phase 3 — Services:** `src/services/list-service.ts` (createList/updateList/archiveList/unarchiveList/deleteList cascade, 16 test) + `src/services/item-service.ts` (createItem/updateItem/toggleItemStatus/deleteItem/restoreItem, 21 test)

**Bug sanati dalle review a due stadi (Sessione 1):**
1. `buildDiff` non vedeva chiavi solo in `before` → union key set
2. `updateItem` saltava validazione quantity/notes su patch senza name → estratto `validateItemPatch`
3. `deleteItem` non aggiornava `updatedBy` → inconsistenza audit
4. `restoreItem` resettava silenziosamente `completedAt` → reset esplicito + comment

**Sessione 2 — Fasi 4-9 (hooks + UI + routing + docs):**

- **Phase 4 — Hooks reattivi:** `src/hooks/use-lists.ts`, `use-items.ts`, `use-deleted-items.ts` con `useLiveQuery` + TDD (4+4+3 test = +11 test verdi)
- **Phase 5 — UI common (9 file):** `src/components/common/{button,input,badge,modal,confirm-dialog,toast-container,empty-state,loading-spinner,error-message}.tsx` + rewrite `src/stores/ui-store.ts` con toast queue + auto-dismiss 3s
- **Phase 6 — UI liste:** `list-card.tsx` (menu kebab + inline rename + live count), `list-form.tsx` (Modal + validazione live), `archived-section.tsx` (collassabile) + rewrite `home-page.tsx` + update smoke test
- **Phase 7 — UI articoli + pagine:** `item-row.tsx`, `item-form.tsx` (form completo unit/category/notes), `item-quick-add-bar.tsx` (sticky bottom + auto-focus), `item-trash-row.tsx` + `list-page.tsx` (nuova) + `trash-page.tsx` (nuova)
- **Phase 8 — Wire & docs:** rewrite `src/app.tsx` con routing `/lists/:listId` + `/lists/:listId/trash` + `<ToastContainer />` globale, update `mappa-progetto.md` (sezione "Stato Sprint 1"), `piano-sviluppo.md`, `CLAUDE.md`
- **Phase 8.2 — Smoke test offline manuale:** eseguito dall'utente con DevTools → Network → Offline, **17 voci della checklist tutte verdi**
- **Phase 9 — Final DoD:** typecheck ✅, lint ✅, `npm run test` → **75/75 green**, `npm run build` → 328 KB (108 KB gzipped), coverage services 98.9%-99.11% (uncovered: solo branch `catch` defensive)

**Deviazioni dal plan verbatim (tutte documentate):**
- ESLint strict (`unbound-method`, `no-misused-promises`, `no-floating-promises`, globals whitelist) ha forzato pattern specifici ora codificati in `CLAUDE.md` → sezione "Gotchas tecniche"
- `ui-store.ts` usa `generateId()` da `@/utils/id-utils` + `window.setTimeout` invece di `crypto.randomUUID` + `setTimeout` nudi (globals non in whitelist)
- Tailwind `brand` palette estesa con tonalità `200` e `300` in `tailwind.config.js` per `focus:ring-brand-200` e `disabled:bg-brand-300`
- Hook consumer nelle pagine non destrutturano metodi (evita `unbound-method`); usano property-access `hook.create(…)`

**Tests totali finali:** 75 verdi (64 Sessione 1 + 11 hook test Sessione 2)
**Quality gates:** `npm run typecheck` ✅ | `npm run lint` (max-warnings 0) ✅ | `npm run test` ✅ | `npm run build` ✅

### Note di brainstorming Sprint 1 (2026-04-14)

Il brainstorming ha prodotto **6 decisioni vincolanti** che hanno riformulato 3 task originali e aggiunto 5 nuovi task di test. Le decisioni complete sono nel [brainstorm summary](./superpowers/brainstorms/2026-04-14-sprint-1-core-offline-brainstorm.md), riassunte qui:

**Decisioni di scope:**
1. **`Item.sortOrder` è l'unica fonte di ordinamento** — `List.itemOrder` resta `[]` per evitare merge nightmare nello Sprint 3 sync
2. **Solo tap/click, no swipe** in Sprint 1 — riformula S1-12 e S1-14, rinvia gesture a V1.0 Modalità Shopping
3. **Solo TrashPage, no undo toast con azioni** — `Toast.tsx` resta semplice (no actions), `useUndo` rinviato a V1.0

**Decisioni architetturali:**
4. **ChangeLog scritto al layer service** dentro `db.transaction()` esplicita — repository restano CRUD puri, atomicità garantita dal motore IndexedDB
5. **Cestino per-lista** (`/lists/:listId/trash`), non globale — risolve naturalmente l'edge case "lista parent cancellata" di RF-ITEM-005
6. **Cascade delete eager** con una entry changeLog per ogni entità — sync semanticamente sicuro in Sprint 3, no re-derivation lato server

**Micro-decisioni risolte nel design:**
- `ArchivedSection` come componente inline collassabile in HomePage (non pagina separata)
- `ItemQuickAddBar` come file separato (non inline in ListPage) — riconoscimento di complessità sottovalutata
- `@radix-ui/react-dialog` come dipendenza per focus trap di Modal/ConfirmDialog (a11y già fatta, +15kB gz)
- **Diff minimale** in `ChangeLogEntry.changes` per UPDATE — snapshot completo solo per CREATE/DELETE, sottoinsieme fisso `{status, completedAt}` per STATE_CHANGE. Non è ottimizzazione: snapshot completo introduce **bug di correttezza nel sync multi-device offline**
- `_internal/` per `DomainError` + `mapDbError` come dettagli implementativi del layer service non esportabili
- Test scope esteso con repository smoke (S1-01b, S1-08b) e tutti gli hook (S1-03b, S1-10b, S1-15b) — +4h totali

**Nuova dipendenza runtime:** `@radix-ui/react-dialog` (^1.x, ~15 kB gzipped).

---

## Sprint 1.5 — Item CRUD UX Refinement (fuori roadmap originale)

> **Tipo:** Refinement UX out-of-band (non milestone funzionale, non previsto nella roadmap 7-9 settimane originale).
> **Data pianificazione:** 2026-04-15
> **Stato:** **✅ Completato 2026-04-15 in due sessioni consecutive (Sessione 1: Phase 0-4 con `subagent-driven-development`; Sessione 2: Phase 5-9 con `/feature-dev` resume-from-interruption + code-review triangolata).**
> **Plan file:** [`docs/plans/Sprint1_AddedFeatures_ItemsCRUD.md`](./plans/Sprint1_AddedFeatures_ItemsCRUD.md) — versionato nel repo.
> **Metodologia:** Sessione 1 `superpowers:subagent-driven-development` fase per fase con gate `typecheck + lint + test` tra una fase e l'altra; Sessione 2 `/feature-dev` in modalità resume con code-review triangolata (3 reviewer paralleli per simplicity/correctness/conventions).
> **Effort stimato:** 6-8h in 1-2 sessioni. **Effort consumato:** ~4h sessione 1 (Phase 0-4 + DRY pass chip) + ~2h sessione 2 (Phase 5-9 + review fixes) = **~6h totali**.

**Obiettivo:** risolvere cinque pain points UX sul CRUD articoli emersi dopo l'uso pratico post-Sprint 1.

**Contesto:** lo Sprint 1 ha consegnato un CRUD articoli funzionante ma poco user-friendly. L'utente ha identificato che l'inserimento di un articolo completo (nome + categoria + quantità + unità) richiede due step (quick-add + edit), che non esiste autocompletamento, che il menu `⋮` nasconde le operazioni CRUD, che le categorie sono mostrate come enum grezzi (`fruits_vegetables`), e che il tap sulla riga non toggla lo stato completato.

**Deviazione dal roadmap:** anticipa selettivamente parti dei task `S5-01`, `S5-02`, `S5-03` dello Sprint 5 per costruire il catalogo articoli locale. La parte di sync del catalogo (`S5-04`) resta in Sprint 5 come previsto.

**Criteri di completamento:**
- Aggiunta di un articolo completo in 1 tap (quick-add progressive disclosure)
- Autocompletamento funzionante con default `category/unit/quantity` dal catalogo Dexie locale
- Tap sull'area nome toggla lo stato completato (con checkbox mantenuto per a11y)
- Icone `✎` e `🗑` sempre visibili inline (no menu nascosto)
- Categorie e unità mostrate come stringhe italiane localizzate
- Zero regression sui 75 test attuali. **Risultato finale:** 103 test green (+28 vs Sprint 1)

| ID | RF | Task | Durata | Stato |
|----|-----|------|--------|-------|
| S1.5-00 | — | Phase 0: `src/utils/item-labels.ts` — mappe italiane `CATEGORY_LABELS_IT`, `UNIT_LABELS_IT` + helper `formatCategory`, `formatUnit` | 0.5h | [✅] |
| S1.5-01 | — | Phase 1a: `catalog-repository.ts` — thin wrapper Dexie con `tx?: Transaction` (add/getByName/update/searchByPrefix/topByFrequency) | 0.5h | [✅] |
| S1.5-02 | — | Phase 1b: `catalog-service.ts` — `getSuggestions(query, limit)` + `recordUsage(name, defaults, tx)` con upsert atomico per nome normalizzato | 0.5h | [✅] |
| S1.5-03 | — | Phase 1c: integrazione in `itemService.createItem` — aggiungi `db.itemCatalog` al set tabelle tx + chiama `catalogService.recordUsage` | 0.5h | [✅] |
| S1.5-04 | — | Phase 1d: test catalog repo (5) + service (8) + item-service integration (+2) | — | [✅] |
| S1.5-05 | — | Phase 2: `use-catalog-suggestions.ts` — hook con debounce 200ms (NO `useLiveQuery`: derivation on-demand) + 3 test | 0.5h | [✅] |
| S1.5-06 | — | Phase 3: `item-name-autocomplete.tsx` — componente controlled con keyboard nav (↑↓/Enter/Esc), ARIA combobox, dropdown `absolute bottom-full z-20` | 1h | [✅] |
| S1.5-07 | — | Phase 4: rewrite `item-quick-add-bar.tsx` con progressive disclosure (focus→expanded: chip categoria + stepper qty + unit select + autocomplete). Firma `onSubmit` cambia a `(input: QuickAddInput) => Promise<AppResult<Item>>`. Call-site `list-page.tsx` aggiornato. | 1.5h | [✅] |
| S1.5-08 | — | Phase 5: refactor `item-row.tsx` — rimuovi menu `⋮`, layout ibrido (checkbox + `<button>` body=toggle + icone `✎` `🗑` inline con `stopPropagation`), touch target 40×40 | 1h | [✅] |
| S1.5-09 | — | Phase 6: `item-form.tsx` — sostituisci `<option>{enum}</option>` con label italiani localizzati da `item-labels.ts` | 0.5h | [✅] |
| S1.5-10 | — | Phase 7: component test — `item-row.test.tsx` (4) + `item-quick-add-bar.test.tsx` (3) + `item-name-autocomplete.test.tsx` (3) | 1h | [✅] |
| S1.5-11 | — | Phase 8: update `docs/mappa-progetto.md` + `CLAUDE.md` sezione "Stato Progetto" + marca in Sprint 5 i task anticipati | 0.5h | [✅] |
| S1.5-12 | — | Phase 9: Final DoD — `typecheck + lint + test + build` green, smoke offline 12-step checklist, verifica `itemCatalog` in IndexedDB, verifica ASSENZA entry `entityType:'CATALOG'` in changeLog | 0.5h | [✅] |

### Sessione 1 — Completata 2026-04-15 (Phase 0-4)

**Risultato gate:** `typecheck` ✅ | `lint` ✅ (0 warnings) | `test` ✅ **93/93 green** (da 75, +18 nuovi test: 5 catalog-repo + 8 catalog-service + 2 item-service integration + 3 use-catalog-suggestions).

**File nuovi (8):**
- `src/utils/item-labels.ts` (37 LOC)
- `src/repositories/catalog-repository.ts` (58 LOC)
- `src/repositories/catalog-repository.test.ts` (65 LOC)
- `src/services/catalog-service.ts` (96 LOC)
- `src/services/catalog-service.test.ts` (100 LOC)
- `src/hooks/use-catalog-suggestions.ts` (35 LOC)
- `src/hooks/use-catalog-suggestions.test.ts` (70 LOC)
- `src/components/items/item-name-autocomplete.tsx` (145 LOC)

**File modificati (4):**
- `src/services/item-service.ts` — `createItem` tx ora include `db.itemCatalog`, chiamata `catalogService.recordUsage` in coda prima del `return item`
- `src/services/item-service.test.ts` — `itemCatalog.clear()` aggiunto al `beforeEach` del `describe('createItem')` + 2 integration test (popola catalog + incrementa frequency per duplicati)
- `src/components/items/item-quick-add-bar.tsx` — **rewrite completo** (233 LOC, sopra soft target 200 ma sotto hard max 400): progressive disclosure via `expanded` state, chip categoria top-4 + "Altre…", stepper quantità `±`, select unit, integrato con `ItemNameAutocomplete`. Firma `onSubmit` cambiata a `(input: QuickAddInput) => Promise<AppResult<Item>>`. Estratto helper `<CategoryChip>` interno per DRY
- `src/pages/list-page.tsx` — call-site aggiornato a `(input: QuickAddInput) => itemsHook.create(input)` + import `QuickAddInput`

**Cosa funziona end-to-end dopo sessione 1:**
- Quick-add bar si espande al focus, mostra chip categoria, stepper qty, select unit
- Autocomplete con dropdown sopra (position absolute bottom-full) e keyboard nav (↑↓/Enter/Esc)
- Catalogo `itemCatalog` popolato atomicamente dentro la tx di `createItem` (zero changeLog pollution)
- `onSuggestionPick` intelligente: pre-popola default solo se `userTouched{Category,Unit,Quantity}` è false
- Label italiani usati in autocomplete dropdown (Badge categoria via `formatCategory`)

### Sessione 2 — Completata 2026-04-15 (Phase 5-9 + Code Review)

**Risultato gate finale:** `typecheck` ✅ | `lint` ✅ (0 warnings) | `test` ✅ **103/103 green** (da 93 sessione 1, +10 component test) | `build` ✅ bundle 335.75 KB gzip 110.34 KB (budget < 360 KB rispettato).

**File nuovi sessione 2 (3):**
- `src/components/items/item-row.test.tsx` (4 test: render con label IT, click body→toggle, click ✎→edit, click 🗑→delete)
- `src/components/items/item-quick-add-bar.test.tsx` (3 test: render compatto, espansione on-focus, submit completo `name+category+quantity+unit`)
- `src/components/items/item-name-autocomplete.test.tsx` (3 test con `vi.useFakeTimers()` + mock `catalogService.getSuggestions`: dropdown dopo debounce, click pick, Escape chiude)

**File modificati sessione 2 (5):**
- `src/components/items/item-row.tsx` — **rewrite** (88→80 LOC post-review): rimosso stato `menuOpen` e menu `⋮`; layout ibrido checkbox a11y + `<button>` body tap-to-toggle + icone `✎`/`🗑` inline; display ora usa `formatUnit`/`formatCategory` da `item-labels.ts`
- `src/components/items/item-form.tsx` — 2 edit mirati: `<option>` di unit-select e category-select usano ora `UNIT_LABELS_IT[u]` / `CATEGORY_LABELS_IT[c]` invece dell'enum grezzo
- `src/components/items/item-name-autocomplete.tsx` — fix ARIA WAI-ARIA 1.2 post-review: `role="combobox"` + tutti gli `aria-*` spostati dal wrapper `<div>` all'`<input>` stesso
- `docs/mappa-progetto.md` — aggiunta sezione "Stato Sprint 1.5" con inventario file + architettura catalogo locale-only
- `CLAUDE.md` — aggiornato a "Sprint 1.5 ✅ completato" con tabella Fasi dettagliata + 2 nuovi gotchas ESLint/test learned in sessione

**Code review triangolata** (3 reviewer paralleli dopo Phase 9):
1. **HIGH** — `item-row.tsx` aveva aria-label identico su checkbox e body button (violazione WAI-ARIA 4.1.2 Name/Role/Value + deviazione dal plan §D.5 che specificava label distinti). **Fix:** body button riceve `aria-label={\`Toggla stato di ${item.name}\`}` plan-verbatim; test selector aggiornato a `/Toggla stato di Latte/`.
2. **MEDIUM** — `item-row.tsx` aveva `handleEdit`/`handleDelete` wrapper con `stopPropagation` ridondante (le icone sono siblings del body button, non nested → niente da fermare). **Fix:** rimossi wrapper, `onClick={onEdit}`/`onClick={onDelete}` diretti. Guadagno: -8 LOC, ora 80 LOC (<100 target plan).
3. **MEDIUM (out-of-scope sessione 2)** — `item-name-autocomplete.tsx` (creato in sessione 1) aveva `role="combobox"` sul wrapper `<div>` invece che sull'`<input>`. Violazione WAI-ARIA 1.2 pattern combobox. **Fix:** attributi ARIA spostati direttamente sull'`<input>`; test semplificato a `getByRole('combobox')` diretto.
4. **LOW** — factory helper nei 2 nuovi test chiamati `buildItem()`, ma convenzione repo (da `catalog-service.test.ts`, `catalog-repository.test.ts`, `use-catalog-suggestions.test.ts`) è `buildMock<Entity>()`. **Fix:** rename `buildItem` → `buildMockItem` in entrambi i test file.

**Cosa funziona end-to-end a fine Sprint 1.5:**
- Quick-add bar espansa on-focus con chip categoria (top-4 + "Altre…"), stepper quantità 0-9999, select unità compatto
- Autocomplete debounced 200ms con dropdown `absolute bottom-full z-20` (ARIA combobox sull'`<input>`), keyboard nav ↑↓/Enter/Esc
- Catalog Dexie popolato atomicamente nella tx di `createItem` (zero changeLog pollution)
- `onSuggestionPick` intelligente: pre-popola default solo se campi non user-touched
- `ItemRow` senza menu `⋮`: tap sul body = toggle, icone inline `✎`/`🗑` per edit/delete (touch target 40×40)
- `ItemForm` e `ItemRow` mostrano `Latticini`/`kg` invece di `dairy`/`kg` grezzi
- Checkbox a11y keyboard mantenuto per screen reader users
- Tutte le operazioni funzionano offline (DevTools → Network → Offline)

**Note & concerns residui (da valutare in sessioni future):**
1. `item-quick-add-bar.tsx` a 233 LOC (sopra soft target 200 ma sotto hard max 400). Accettato per questo sprint; se Sprint 2+ aggiunge righe, valutare estrazione `item-quick-add-bar-expanded.tsx` come da plan §D.6.
2. `ItemNameAutocomplete` usa ARIA id letterale `catalog-suggestions-listbox`. Funziona oggi (singola istanza per view) ma se in futuro si monta in più punti sulla stessa pagina va reso unique-per-instance via `useId()`.
3. La tx di `createItem` ora prende write lock su 3 tabelle (`items + changeLog + itemCatalog`). Serializzazione marginale invisibile per uso personale, garantisce atomicity catalog ↔ item create.
4. Autocomplete non ancora montato in `ItemForm` (form di edit). Task `S5-03` residuo in Sprint 5 valuta se allinearlo.

**Decisioni architetturali vincolanti (dal plan):**

1. **Catalogo locale-only, NON sync.** Il `catalogRepository` NON scrive su `changeLog`. Motivazione: il catalogo è un indice personale derivabile (`DISTINCT name FROM items`), riaggregabile offline. Evita di inquinare il protocollo sync di Sprint 3. La task S5-04 ("Sync catalogo tra collaboratori") resta in Sprint 5 con strategia dedicata.
2. **Zero schema migration.** La tabella `itemCatalog` è già dichiarata in v1 (`src/db/database.ts:22`). Si resta su v1.
3. **Normalizzazione nome catalog.** Memorizzato sempre in `trim().toLowerCase()` nel repository (workaround per l'unique index `&name` case-sensitive di Dexie). Display applica capitalizzazione a UI.
4. **Layout ibrido row** (`§D.5` del plan): risolve la tensione tra requisito #4 ("tap su articolo = toggle") e la scelta Q3 ("tap→edit"). Onora entrambi: tap su body=toggle, icone inline=edit/delete.
5. **`onSuggestionPick` intelligente**: pre-popola default solo se l'utente non ha ancora editato i campi (`userTouchedX` flags).
6. **Upsert catalog in tx atomica**: `catalogService.recordUsage` chiamato DENTRO la stessa `db.transaction('rw', db.items, db.changeLog, db.itemCatalog, ...)` di `createItem`, prima del return.

**Nuove dipendenze runtime:** nessuna.

**File impatto:** 11 nuovi + 8 modificati = 19 file totali.

---

## Sprint 2 — Autenticazione e Modalità Guest (Settimana 3)

**Obiettivo:** Login, registrazione, modalità guest, migrazione dati.  
**Criterio completamento:** Utente può registrarsi, fare login, e i dati locali migrano all'account.

| ID | RF | Task | Durata | Stato |
|----|-----|------|--------|-------|
| S2-01 | RF-AUTH-001 | authService: register, login, logout, getSession | 3h | [ ] |
| S2-02 | RF-AUTH-001 | Hook: useAuth (stato sessione, refresh automatico) | 2h | [ ] |
| S2-03 | RF-AUTH-001 | UI: LoginPage + RegisterPage (form con validazione) | 4h | [ ] |
| S2-04 | RF-AUTH-002 | Route protette (PrivateRoute component) | 1h | [ ] |
| S2-05 | RF-AUTH-003 | Modalità Guest: flag isGuest, disabilita sync | 2h | [ ] |
| S2-06 | RF-AUTH-004 | Migrazione dati guest → account registrato | 3h | [ ] |
| S2-07 | RF-AUTH-005 | ProfilePage: visualizza profilo, logout | 2h | [ ] |
| S2-08 | RF-AUTH-006 | Recupero password (via Supabase Auth) | 1h | [ ] |
| S2-09 | — | Test: flussi auth (login, register, logout, guest) | 2h | [ ] |

---

## Sprint 3 — Sincronizzazione Base (Settimane 4-5)

**Obiettivo:** Sync bidirezionale IndexedDB ↔ Supabase, indicatori stato sync.  
**Criterio completamento:** Due dispositivi con stesso account vedono le stesse liste.

| ID | RF | Task | Durata | Stato |
|----|-----|------|--------|-------|
| S3-01 | RF-SYNC-001 | syncService: upload changeLog → Supabase | 4h | [ ] |
| S3-02 | RF-SYNC-001 | syncService: download delta remoto → IndexedDB | 4h | [ ] |
| S3-03 | RF-SYNC-001 | Hook: useSync (trigger sync, stato, retry) | 2h | [ ] |
| S3-04 | RF-SYNC-002 | Network monitor (online/offline detection) | 1h | [ ] |
| S3-05 | RF-SYNC-002 | Sync automatico: ogni 30s + al ritorno online | 2h | [ ] |
| S3-06 | RF-SYNC-003 | UI: SyncStatusBadge (synced/syncing/pending/error/offline) | 2h | [ ] |
| S3-07 | RF-SYNC-004 | Retry con exponential backoff (max 3 tentativi) | 2h | [ ] |
| S3-08 | RF-SYNC-005 | conflictService: merge automatico campi diversi | 3h | [ ] |
| S3-09 | RF-SYNC-005 | conflictService: last-write-wins con log | 2h | [ ] |
| S3-10 | — | Test: sync E2E (due device, offline/online) | 3h | [ ] |
| S3-11 | — | Test Unit: conflictService (scenari completi) | 2h | [ ] |

**✅ Milestone M3:** Sync funzionante tra dispositivi

---

## Sprint 4 — Condivisione e Permessi (Settimane 5-6)

**Obiettivo:** Liste condivisibili con sistema permessi OWNER/EDITOR/VIEWER.  
**Criterio completamento:** Due utenti con account diversi possono collaborare su una lista.

| ID | RF | Task | Durata | Stato |
|----|-----|------|--------|-------|
| S4-01 | RF-PERM-001 | permissionService: matrice permessi, canPerform() | 2h | [ ] |
| S4-02 | RF-PERM-001 | Hook: usePermissions (permesso utente corrente per lista) | 1h | [ ] |
| S4-03 | RF-PERM-001 | Enforcement UI: disabilita pulsanti/form per viewer | 2h | [ ] |
| S4-04 | RF-SHARE-001 | inviteService: genera token invito | 2h | [ ] |
| S4-05 | RF-SHARE-001 | UI: InvitePage (preview lista + "Accetta Invito") | 3h | [ ] |
| S4-06 | RF-SHARE-002 | UI: Gestione membri lista (lista collaboratori, revoca) | 3h | [ ] |
| S4-07 | RF-SHARE-003 | Revoca accesso (rimuovi da list_members) | 1h | [ ] |
| S4-08 | — | Test Unit: permissionService (tutti i casi) | 2h | [ ] |
| S4-09 | — | Test E2E: flusso invito e collaborazione | 3h | [ ] |

**✅ Milestone M4:** Collaborazione multi-utente funzionante

---

## Sprint 5 — Autocompletamento e Refinement (Settimane 7-8)

**Obiettivo:** Autocompletamento articoli, pulizia cestino automatica, QA completo.

| ID | RF | Task | Durata | Stato |
|----|-----|------|--------|-------|
| S5-01 | RF-AUTO-001 | ~~catalogRepository: CRUD catalogo articoli locale~~ — **parzialmente anticipato in Sprint 1.5** (Phase 1a): creato `catalog-repository.ts` con add/getByName/update/searchByPrefix/topByFrequency. Sprint 5 verifica soltanto completezza API e aggiunge eventuali query mancanti per `RF-AUTO-002`. | 0.5h (residuo) | [ ] |
| S5-02 | RF-AUTO-001 | ~~catalogService: aggiorna frequenza, suggerimenti top-10~~ — **parzialmente anticipato in Sprint 1.5** (Phase 1b): `catalog-service.ts` già implementa `getSuggestions` + `recordUsage` con upsert atomico e stale-default logic. Sprint 5 porta il `limit` da 5 a 10 e aggiunge metriche osservabili. | 0.5h (residuo) | [ ] |
| S5-03 | RF-AUTO-001 | ~~UI: Autocompletamento in ItemForm (debounce 300ms)~~ — **parzialmente anticipato in Sprint 1.5** (Phase 3+4): creato `item-name-autocomplete.tsx` con debounce 200ms (hook `use-catalog-suggestions.ts`) e montato in `ItemQuickAddBar`. Sprint 5 valuta se aggiungere l'autocompletamento anche nel form di edit (`ItemForm`) e se allineare il debounce a 300ms per conformità con il plan originale. | 1h (residuo) | [ ] |
| S5-04 | RF-AUTO-002 | Sync catalogo tra collaboratori (merge additivo) — **NON anticipato**, resta full scope Sprint 5. Il `catalogRepository` di Sprint 1.5 è locale-only e NON scrive su `changeLog` (decisione architetturale §D.3 del plan 1.5) | 2h | [ ] |
| S5-05 | — | Pulizia automatica cestino > 30 giorni | 1h | [ ] |
| S5-06 | — | QA: test su mobile iOS Safari e Android Chrome | 2h | [ ] |
| S5-07 | — | Performance: Lighthouse audit, bundle size check | 2h | [ ] |
| S5-08 | — | Accessibilità: WCAG 2.1 AA audit | 2h | [ ] |
| S5-09 | — | Bug fixing da QA | 4h | [ ] |
| S5-10 | — | Test copertura finale (target > 80%) | 2h | [ ] |

**✅ Milestone M5:** MVP completo, testato e stabile

---

## Features V1.0 (Post-MVP)

> Implementare dopo MVP stabile e validato con utenti reali.

- [ ] **Modalità Shopping** (font grande, bottoni XL, swipe gesture)
- [ ] **Notifiche Push** (PWA Push API + Supabase Realtime)
- [ ] **Ricerca Globale** (match su nome, note, lista)
- [ ] **Template e Duplicazione Liste**
- [ ] **Undo/Redo** (stack 20 operazioni)
- [ ] **Conflict Resolution UI** (dialog side-by-side per conflitti critici)
- [ ] **Log Attività** (cronologia modifiche per lista)
- [ ] **Filtri Avanzati** (per categoria, stato, data)

---

## Features V2.0 (Roadmap)

- [ ] Import/Export (TXT, CSV, JSON)
- [ ] Link Pubblici (read-only condivisione)
- [ ] Liste Ricorrenti Automatiche
- [ ] Statistiche Utilizzo
- [ ] Funzione Stampa
- [ ] OAuth (Google, Apple)

---

## Rischi e Mitigazioni

| Rischio | Probabilità | Strategia |
|---------|-------------|-----------|
| Conflitti offline dati corrotti | Media | Change log con timestamp + test aggressivi Sprint 3 |
| Supabase free tier esaurito | Bassa | Monitorare dashboard; Supabase self-hosting come backup |
| Service Worker caching errato | Media | Workbox strategie predefinite; aggiornare SW ad ogni release |
| IndexedDB quota esaurita | Bassa | Pulizia cestino > 30gg automatica (Sprint 5) |
| Versionamento Dexie schema incompatibile | Bassa | Nuova versione per ogni modifica, MAI modificare versione esistente |
| PWA non installabile iOS Safari | Media | Testare su iOS sin da Sprint 0 |

---

*Documento: `docs/piano-sviluppo.md`*  
*Aggiornare: al completamento di ogni task (segna ✅) e aggiunta di nuovi task*
