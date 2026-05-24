# Brainstorming Summary — Sprint 1 Core Offline

**Data:** 2026-04-14
**Partecipanti:** Stefano Zaghi + Claude (Opus 4.6)
**Skill utilizzata:** `superpowers:brainstorming`
**Output:** [`docs/specs/Sprint1_CoreOffline_Spec.md`](../specs/Sprint1_CoreOffline_Spec.md)
**Durata:** ~45 min conversazionali

---

## 1. Obiettivo iniziale

Trasformare la richiesta utente *"CRUD completo di liste e articoli offline-first, senza autenticazione (modalità guest)"* in una spec eseguibile, allineata ai documenti canonici del progetto (`.claude/architettura.md`, `.claude/dominio.md`, `.claude/sync.md`, `.claude/ui-ux.md`, `.claude/qualita.md`, `CLAUDE.md`).

**Requisiti input** (dall'utente):
1. L'app funziona completamente offline
2. creare/modificare/eliminare liste e articoli
3. spuntare articoli
4. gestione cestino
5. Nessuna chiamata di rete richiesta

---

## 2. Contesto esplorato

Prima di formulare domande, Claude ha verificato lo stato del progetto:

| Osservazione | Rilevanza |
|---|---|
| Sprint 0 completato: struttura feature-sliced scaffoldata, Dexie v1 con 5 tabelle, Supabase client guarded, 5 test smoke green | Base di partenza pulita |
| `src/types/domain.ts` contiene una **shape minimal** (`pending`/`completed`, no quantity/unit/notes/sortOrder) — sottoinsieme di `.claude/dominio.md` canonical | Conflitto canonico/codice da risolvere |
| Il task context utente cita path `src/db/database.ts`, `db/repositories/`, `stores/` — questi sono path **DEPRECATI** per CLAUDE.md (vengono da `development_plan.md §2.2`, superseduto da `.claude/architettura.md`) | Traduzione implicita ai path feature-sliced richiesta |
| `.claude/sync.md` definisce già il contratto `ChangeRecord` che Sprint 4 sync consumerà | Obbligo di shape coerente per `ChangeLog` già in Sprint 1 |
| `.claude/qualita.md` specifica stack test (Vitest + RTL + Playwright + MSW), pattern `Result<T, E>`, coverage target per layer | Vincolo architetturale ereditato |
| `.claude/ui-ux.md` specifica stack UI completo (`shadcn/ui`, RHF + Zod, sonner, `react-beautiful-dnd`, Framer Motion, React Virtual, responsive shell, WCAG 2.1 AA) — **letto parzialmente all'inizio, completamente solo prima di scrivere la spec** (vedi §4) | Canonico vincolante; ha causato revisione significativa in corso d'opera |

---

## 3. Domande e decisioni (cronologia)

### Domanda 1 — Domain shape
**Input alternatives**: (A) minimal corrente, (B) full canonical dominio.md, (C) ibrido.
**Scelta**: **full canonical** — inclusi `quantity`, `unit`, `notes`, `sortOrder`, `completedAt`, `createdBy`/`updatedBy`, `sharedWith`, `localOnly`, `syncedAt`, enums `DA_COMPRARE`/`COMPLETATO` e `ACTIVE`/`ARCHIVED`.
**Razionale**: eliminare drift tra canonical e codice; zero churn schema in sprint futuri; Dexie v2 migration one-shot.

### Domanda 2 — UI scope
**Input alternatives**: (A) bare wiring, (B) usable MVP, (C) full polish.
**Clarification richiesta dall'utente**: differenza tra MVP e full polish → risposta focalizzata su cinque delta concreti (modalità shopping, category grouping, empty/skeleton states, keyboard nav + ARIA pass, responsive tuning).
**Scelta**: **usable MVP** — dashboard, detail con form ricco, soft-delete, drag-reorder, trash page; no modalità shopping / grouping / animations.
**Razionale**: bilanciamento "demo-able" vs schedule; lascia polish per Sprint 3.

### Domanda 3 — Reactive flow
**Input alternatives**: (A) `useLiveQuery` only, (B) Zustand mirror di Dexie, (C) ibrido.
**Scelta**: **`useLiveQuery` only** — Dexie è unica source of truth per dati di dominio; Zustand riservato a `uiStore` (toast/modal) e `authStore` (guest flag).
**Razionale**: elimina double bookkeeping e possibili drift store↔DB; `dexie-react-hooks` è costo zero.

### Domanda 4 — Guest identity
**Input alternatives**: (A) Dexie `session` table singleton, (B) hardcoded constant, (C) localStorage-backed.
**Scelta**: **Dexie session table** con `userId = 'guest-<nanoid>'`.
**Razionale**: sopravvive a clear di localStorage; permette migrazione trasparente quando arriva auth; i path `createdBy`/`updatedBy` restano semanticamente corretti.

### Domanda 5 — Trash scope
**Input alternatives**: (A) items only (per-list + global), (B) items + lists, (C) global items only.
**Scelta**: **items only** (global con filtro per lista).
**Razionale**: `dominio.md` non definisce `deletedAt` per `List`; le liste usano `ACTIVE`/`ARCHIVED` + hard-delete con conferma. Evita stato aggiuntivo sul modello.

### Domanda 6 — Test depth
**Input alternatives**: (A) unit + hooks + 1 E2E, (B) unit + hooks only, (C) full `qualita.md` targets.
**Scelta**: **unit + hooks + 1 Playwright E2E** (golden path offline).
**Razionale**: verifica end-to-end dell'offline-first (il claim principale di Sprint 1) senza esplosione test boilerplate.

### Proposta di approcci (A/B/C)
Tre approcci di sequencing proposti:
- **A** — Data-first horizontal (data layer completo prima di qualsiasi UI)
- **B** — Vertical slices (Foundation → Lists → Items → Trash+E2E)
- **C** — Spike first, then harden

**Scelta**: **Approccio B — vertical slices**.
**Razionale**: ogni slice è demo-able e test-able; subagent-friendly; pattern TDD naturale; migration Dexie v2 come foundation one-shot.

### Sezioni di design presentate (con approvazione incrementale)

1. **Scope & DoD** — 10 criteri verificabili → approvato
2. **Data layer** — Zod-as-source-of-truth (refinement emerso più tardi), Dexie v2 migration con backfill idempotente, `ChangeLog` esteso con `STATE_CHANGE` e shape conforme a `sync.md`, `recordChange()` helper come single chokepoint → aperti 3 open points → approvato tutti e tre come proposti (uppercase enums, migration backfill, nuovo index `[synced+createdAt]`)
3. **Service layer** — `Result<T, E>` boundary pattern, `session.ts`, `lists.ts` con cascade on hard-delete, `items.ts` con toggle/softDelete/restore/reorder sparse (1000/2000/3000) → 3 open points → approvato tutti (hard-delete cascade, sparse no optimization, Result asymmetry with internal throws)
4. **Feature layer** — `features/lists/` + `features/items/` + `features/items/components/TrashView.tsx`, hooks + components + routing, `AppShell` minimo → 3 open points → approvato (dnd-kit, `unit` type widening, bare AppShell)
5. **Build order + test strategy + risks** — 4 fasi con checkpoint bloccanti, 11 nuovi test file, migration safety, matrice rischi → 3 open points → approvato (strict confirm dialog, Playwright :4173, leggere `ui-ux.md` subito)

---

## 4. Pivot significativo: lettura completa di `.claude/ui-ux.md`

Tra Sezione 5 e la stesura della spec, Claude ha letto integralmente `.claude/ui-ux.md`. **Questa lettura ha rivelato clash significativi** con le sezioni già approvate:

| # | `ui-ux.md` dice | Proposta originale | Risoluzione |
|---|---|---|---|
| 1 | `react-beautiful-dnd` | `@dnd-kit` | **`@dnd-kit`** + deprecation note su `ui-ux.md` (libreria archiviata 2021, React 18 issues) |
| 2 | `shadcn/ui` (Dialog, Button, Input, Toast, Skeleton) | Hand-rolled | **Adopt shadcn/ui** via CLI (copy-paste components, zero runtime cost) |
| 3 | Toast per ogni azione significativa | "No toast in Sprint 1" | **Adopt sonner** (~5KB), integrato in `useListOperations` / `useItemOperations` |
| 4 | React Hook Form + Zod | Hand-rolled validation | **Adopt RHF + Zod**, con Zod schemas come source of truth per tipi |
| 5 | Skeleton loaders | "No empty states" | **Adopt shadcn/ui Skeleton** |
| 6 | `brand.500` / `brand.600` tailwind colors | `emerald-600` | **Align** — rename in `tailwind.config.js` in Phase 0 |
| 7 | WCAG 2.1 AA baseline | "Mentioned" | **Baked into Section 4** — skip link, aria-live, aria-label, focus trap (shadcn/ui già li fornisce) |
| 8 | Font `Inter` | — | **Adopt** — import in `index.css` |

**Clash deferiti con nota esplicita**: Framer Motion (Sprint 3), responsive shell (Sprint 2), dark mode (Sprint 3), React Virtual (Sprint 3), modalità shopping (Sprint 3), autocompletamento catalogo (Sprint 2), error message map completo (Sprint 4).

**Lezione**: la lettura precoce e completa dei docs canonici è strettamente più economica della lettura differita — l'approvazione delle sezioni 4 e 5 è stata rivisitata *dopo* la loro firma, con costo cognitivo aggiuntivo. In futuro, leggere **tutti** i docs canonici rilevanti **prima** di proporre approcci.

### Domande post-pivot (triple question)

Tre domande in un unico `AskUserQuestion` multi-question per accelerare:

1. **Tool adoption** (shadcn/ui + RHF + Zod + sonner): **adopt all** (verificato dall'utente con follow-up request)
2. **dnd library** (discrepanza ui-ux.md vs realtà): **update ui-ux.md** con deprecation note
3. **Responsive shell** (full vs simple vs mobile-first): **desktop-optimized top nav**, responsive completo in Sprint 2

### Verifica del "adopt all"

L'utente ha chiesto esplicitamente una verifica sulla raccomandazione "adopt all". Claude ha scomposto la scelta in tre voti indipendenti:

- **shadcn/ui** — *very strong yes*: non è un package, è copy-paste di componenti; zero runtime cost.
- **sonner** — *very strong yes*: ~5KB per un requisito canonico esplicito.
- **RHF + Zod** — *moderate yes*: ~21KB bundle, solo 2 form in Sprint 1, ma (1) il pattern compounds su 7+ form nei sprint successivi, (2) Zod schemas diventano source of truth per tipi (eliminando drift tra `types/domain.ts` e validator), (3) deviare silently da canonical = trap.

Esito verificato: **adopt all**, con refinement aggiuntivo: invertire la convenzione in `types/domain.ts` facendo delle Zod schemas la source of truth e derivando i TypeScript types via `z.infer<typeof ...>`. Questo è una shape strettamente migliore della proposta originale in Sezione 2.

---

## 5. Decisioni finali (riassunto)

14 decisioni chiave catturate nella spec §2. In sintesi:

| Area | Decisione |
|---|---|
| Domain shape | Full canonical da `dominio.md`; Zod schemas come source of truth, TypeScript types via `z.infer` |
| Reactive flow | `useLiveQuery` da `dexie-react-hooks`, nessun Zustand mirror |
| Guest identity | Dexie `session` table singleton con `guest-<nanoid>` |
| Trash scope | Items only, global con filtro per lista |
| UI scope | Usable MVP (no modalità shopping, no responsive completa, no animations) |
| Test depth | Unit + hooks + 1 Playwright E2E golden-path offline su `:4173` |
| Build order | Approccio B — Foundation → Lists → Items → Trash+E2E |
| UI stack | shadcn/ui + RHF + Zod + sonner + @dnd-kit, tutti adottati in Phase 0 |
| Drag-reorder | `@dnd-kit/core` + `@dnd-kit/sortable`; `PointerSensor` con `distance: 8`, `KeyboardSensor` per a11y |
| Responsive | Desktop-optimized top nav; mobile usabile ma basic; responsive completa Sprint 2 |
| Confirm UX | Strict `ConfirmDialog` + physical double-click per ogni delete lista |
| Playwright | Base URL `:4173` (preview), wait `serviceWorker.ready` in beforeEach |
| Migration | v1 frozen, v2 con `.upgrade()` idempotente + `??=` backfill, nuovo index `[synced+createdAt]` |
| Error handling | `Result<T, E>` ai confini modulo, throws interni |

---

## 6. Output prodotti

1. **Spec doc**: [`docs/specs/Sprint1_CoreOffline_Spec.md`](../specs/Sprint1_CoreOffline_Spec.md) (~1800 righe) — contiene scope, DoD 13 criteri, data layer completo con Zod schemas, service layer con firme repo, feature layer con hooks + component contracts, build order 4 fasi, test strategy, migration safety, rischi, package manifest diff, canonical doc update richiesti, scope freeze.
2. **Brainstorming summary** (questo file).
3. **Canonical doc updates richiesti** (da fare in Phase 0):
   - Deprecation note su `.claude/ui-ux.md` (`react-beautiful-dnd` → `@dnd-kit`)
   - Paragrafo `Result<T, E>` boundary rule su `.claude/qualita.md`

---

## 7. Prossimi passi

1. **User review** della spec (`docs/specs/Sprint1_CoreOffline_Spec.md`)
2. Eventuali revisioni a fronte di feedback
3. Commit su branch corrente (`feat-course`)
4. Invocazione di `superpowers:writing-plans` skill per produrre `docs/plans/Sprint1_CoreOffline_Plan.md` (task subagent-executable, uno per step numerato in §7 della spec)
5. Esecuzione del plan in sessione separata via `superpowers:executing-plans` / `superpowers:subagent-driven-development`

---

## 8. Note per il futuro brainstorming

**Cosa è andato bene**:
- Approvazione incrementale sezione-per-sezione ha mantenuto allineamento continuo
- L'utente ha usato efficacemente "qual è la soluzione migliore?" come prompt per far esplicitare i trade-off prima di decidere
- La verifica richiesta esplicitamente sul "adopt all" ha rivelato che il ragionamento iniziale era solido ma poteva essere espresso meglio
- Le domande con `preview` ASCII per le opzioni UI hanno aiutato la comprensione visiva

**Cosa migliorare**:
- **Leggere TUTTI i docs canonici all'inizio**, non just-in-time — il clash rivelato da `ui-ux.md` ha richiesto revisione retroattiva di Sezione 4 e 5. Costo: ~15 min di cognitive overhead e revision churn.
- Le domande triple (3 in un'unica `AskUserQuestion`) accelerano quando i temi sono ortogonali, ma rischiano di nascondere l'interdipendenza. Usare con moderazione.
- Il recap "open points" dopo ogni sezione ha funzionato bene ma rende la sessione lunga — valutare se comprimere in un solo open-points dump finale.
