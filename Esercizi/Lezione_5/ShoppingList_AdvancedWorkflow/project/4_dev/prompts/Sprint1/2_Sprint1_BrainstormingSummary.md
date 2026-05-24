# Brainstorm — Sprint 1: Core Offline (Liste e Articoli)

| Campo | Valore |
|-------|--------|
| **Data** | 2026-04-14 |
| **Sprint target** | Sprint 1 — `docs/piano-sviluppo.md` |
| **Obiettivo sprint** | CRUD completo di liste e articoli offline-first, senza autenticazione |
| **Criterio completamento** | Tutte le operazioni funzionano con DevTools → Network → Offline |
| **Metodologia** | Spec-Driven Development con `superpowers:brainstorming` skill |
| **Stato** | Completato — design approvato in ogni sezione |
| **Prossimo step** | Scrittura design spec → self-review → approvazione utente → `superpowers:writing-plans` |

---

## 1. Contesto di ingresso

Lo Sprint 0 (completato 2026-04-13) ha lasciato uno **skeleton offline-only funzionante**: schema Dexie v1 attivo, tipi importati da SRS §4.3 (`src/db/types.ts`), stub Supabase tipizzato verso URL invalido, `auth-store` stub che ritorna `'local-user-stub'` come `userId`, routing minimale con `HomePage` "Hello World" + `NotFoundPage`, PWA installabile da preview HTTPS locale, Vitest + `fake-indexeddb` + Playwright configurati (ma 0 test reali oltre al smoke Hello World).

Il piano-sviluppo descrive Sprint 1 come **20 task** (`S1-01` … `S1-20`) distribuiti tra CRUD liste, CRUD articoli, change tracking, componenti comuni, e test dei service. Durata stimata ~44h su 2 settimane. L'obiettivo del brainstorming è **trasformare la task list piatta in un design architetturale coerente**, prendendo le decisioni implicite prima di scrivere codice.

## 2. Input consultati durante la sessione

- `docs/piano-sviluppo.md` — Sprint 1 task list e contesto degli sprint precedenti/successivi
- `docs/mappa-progetto.md` — struttura attuale e target della codebase
- `docs/SoftwareRequirements.md` §RF-LIST-001..004 + §RF-ITEM-001..005 — requisiti funzionali autoritativi
- `src/db/database.ts` + `src/db/types.ts` — schema Dexie v1 esistente
- `src/stores/auth-store.ts` — stub che determina `userId` e `isGuest`
- `src/pages/home-page.tsx`, `src/app.tsx` — stato routing corrente
- `src/types/ui.ts` — `AppError` + `AppResult` già definiti da Sprint 0
- `CLAUDE.md` (Stato Progetto + Principi Core) — vincoli di offline-first, layering, kebab-case, no `any`

## 3. Flusso del brainstorming

Il brainstorming si è svolto in due fasi sequenziali:

1. **Fase scope** (3 domande) — identificare scogli nel task list prima del design
2. **Fase architettura** (3 domande vincolanti + 3 micro-decisioni risolte durante la presentazione del design) — definire i pattern dei layer

Ogni domanda è stata posta in formato multiple-choice con raccomandazione esplicita e razionale.

---

## 4. Decisioni di scope (3)

### Decisione 1 — Un solo meccanismo di ordinamento articoli

**Problema:** Lo schema Dexie v1 aveva **due campi per ordinare** gli articoli (`Item.sortOrder: number` e `List.itemOrder: string[]`). Mantenerli entrambi sincronizzati in ogni CRUD avrebbe introdotto bug di drift, rumore nel changeLog, e conflitti di merge nello Sprint 3 di sync.

**Scelta: `Item.sortOrder` è l'unica fonte autoritativa. `List.itemOrder` resta nel tipo per compatibilità di schema Dexie v1 ma è sempre `[]` in Sprint 1.**

**Razionale:** numeri scalari sono trivialmente merge-friendly (last-write-wins su campo singolo); array di ID richiedono merge custom complesso. Rimuovere `itemOrder` dal tipo richiederebbe Dexie v2 che non si vuole introdurre in questo sprint.

### Decisione 2 — Niente gesture swipe in Sprint 1

**Problema:** Il task `S1-12` descriveva "toggle stato (swipe + tap)", ma RF-ITEM-002 dell'SRS menziona **solo tap/click**. Lo swipe appartiene semanticamente alla Modalità Shopping (V1.0 post-MVP) dove font grande + bottoni XL + swipe formano un pacchetto coerente.

**Scelta: Sprint 1 usa esclusivamente tap/click. Il task `S1-12` viene riformulato come "Toggle stato (tap su checkbox)". Il task `S1-14` (soft delete articolo) usa solo il pulsante nel menu kebab di `ItemRow`.**

**Razionale:** swipe affidabile richiede libreria gesture (~15 kB), animazioni di feedback, test in Playwright (non affidabili in Vitest/jsdom), e gestione edge case (conflitto con scroll verticale, desktop vs mobile). Costo ~3-5h extra non giustificato dal valore MVP.

### Decisione 3 — Solo TrashPage, no undo toast con azioni

**Problema:** RF-ITEM-004 menziona un "undo toast con bottone 'Annulla' per 5 secondi" dopo il delete, e RF-ITEM-005 descrive la TrashPage per restore tardivo. I due meccanismi coesistono nei requisiti ma il piano-sviluppo prevede solo la TrashPage (S1-15).

**Scelta: Solo TrashPage in Sprint 1. `Toast.tsx` resta un componente semplice (success/error/warning/info, no actions). L'undo "veloce" sarà implementato in V1.0 con `useUndo` (già listato in `mappa-progetto.md` come hook futuro).**

**Razionale:** toast con azione + timer + dismiss programmatico + gestione race condition (delete multipli in sequenza) è ~3h di effort e codice delicato da testare con fake timers. La TrashPage copre già al 100% il caso d'uso "annulla un delete" — la differenza è solo UX.

---

## 5. Decisioni architetturali (6)

### Decisione 4 — ChangeLog al layer service con `db.transaction()` esplicita

**Alternative valutate:** Dexie hooks (`creating`/`updating`/`deleting`), repository layer, service layer + transazione esplicita.

**Scelta: i service aprono `db.transaction('rw', <tabelle>, db.changeLog, ...)` e dentro chiamano sia il repository primario sia `changeLogRepository.append()`. I repository restano CRUD puri su Dexie.**

**Razionale:**
- Dexie hooks sono troppo magici, non sanno distinguere `UPDATE` da `STATE_CHANGE`, e rendono rumoroso ogni test repository
- Repository con changeLog rompe il contratto "thin layer su Dexie" e introduce leakage di dominio
- Service + `db.transaction()` dà atomicità **garantita dal motore IndexedDB** + controllo semantico pieno (il service sa distinguere un toggle da un update, e mette il `operationType` corretto)
- Costo: ~5 righe extra per ogni metodo mutante. Accettabile; nessun helper `withChangeLog` per ora (evitare astrazione prematura)

### Decisione 5 — Cestino per-lista, non globale

**Alternative valutate:** `/lists/:listId/trash` (per-lista), `/trash` (globale), entrambi.

**Scelta: `/lists/:listId/trash` — il cestino appartiene alla lista.**

**Razionale:**
- Modello mentale naturale: "l'articolo è stato cancellato *da questa lista*, lo ripristino *da questa lista*"
- Edge case RF-ITEM-005 ("se la lista parent è cancellata, ripristino impossibile") diventa banale: se sei nella TrashPage di una lista, la lista esiste per definizione; se la lista viene cancellata, fare redirect a `NotFoundPage`
- Hook semplice: `useDeletedItems(listId)` riusa il filtro `deletedAt !== null` già disponibile in `itemRepository`
- Bottom-nav MVP resta pulita (niente icona "cestino" globale)
- Sprint 1 ha routing minimale (1-2 destinazioni) — bottom nav rimandata a Sprint 2

### Decisione 6 — Cascade delete eager + una entry changeLog per ogni entità

**Alternative valutate:** cascade eager con entry per ogni entità, cascade eager con singola entry "LIST", cascade lazy (marker-only).

**Scelta: `listService.deleteList` apre una sola `db.transaction('rw', db.lists, db.items, db.changeLog, ...)` e dentro:**
1. Legge snapshot lista + snapshot di tutti gli articoli attivi (per i `before` del changeLog)
2. Soft-delete lista via `listRepository.update`
3. Bulk soft-delete articoli via `db.items.where('listId').equals(id).and(i => i.deletedAt === null).modify({...})`
4. `changeLogRepository.appendMany([1 entry LIST + N entries ITEM])`, tutte con lo stesso `timestamp`

**Razionale:**
- **Sync semanticamente corretto in Sprint 3**: ogni articolo cancellato è esplicito nel log, il server applica DELETE riga per riga senza dover re-derivare la cascade lato remoto
- **Query client invariate**: `useItems(listId)` continua a filtrare `deletedAt === null` senza nuovi join
- **Atomicità per costruzione**: rollback automatico se qualcosa fallisce dentro la transazione
- **Costo accettabile**: per liste MVP (< 200 articoli) una transazione con 201 entries di log è istantanea. Non serve ottimizzare.

---

## 6. Micro-decisioni risolte durante la presentazione del design

### 6.a — Sezione "Archiviate" come componente inline nella HomePage

**Scelta:** un componente `ArchivedSection` dentro `HomePage`, collassabile, visibile solo se `count > 0`. **Non** una pagina `/lists/archived` separata.

**Razionale:** RF-LIST-004 parla di "sezione", non di pagina. Volume dati atteso: 0-5 liste archiviate per utente MVP. Costo pagina dedicata (route, wrapper, back button) è 4× del costo inline senza valore aggiunto. Pattern familiare (Gmail, Notion).

### 6.b — `ItemQuickAddBar` come file separato

**Scelta iniziale:** micro-componente inline in `list-page.tsx`.
**Scelta definitiva dopo riconsiderazione:** file separato `src/components/items/item-quick-add-bar.tsx`.

**Razionale del cambio di idea:** componente inizialmente sottovalutato. Contiene stato locale (input value), validazione live, clearing post-submit, auto-focus per aggiungere in sequenza, disabled durante mutation async, toast su errore. ~40-60 righe reali che inline porterebbero `ListPage` oltre il limite `200 LOC` di `CLAUDE.md`. Inoltre è il punto di innesto naturale per l'autocompletamento di Sprint 5 (RF-AUTO-001).

### 6.c — Focus trap Modal via `@radix-ui/react-dialog`

**Alternative valutate:** Radix, HeadlessUI, react-aria, implementazione custom.

**Scelta:** `@radix-ui/react-dialog` come unica nuova dipendenza di Sprint 1.

**Razionale:** accessibilità è un dominio difficile (focus return, ciclo Tab/Shift-Tab, inert siblings, ESC, click-outside, aria-*, iOS Safari quirk con `inert`). WCAG 2.1 AA è già nel piano (task S5-08); una soluzione custom ora genererebbe debito per Sprint 5. Radix è headless (zero styling imposto, compatibile con Tailwind), ~15 kB gzipped (trascurabile vs React 40 kB + Dexie 25 kB + Router 10 kB), e tree-shakable.

### 6.d — Diff minimale in `ChangeLogEntry.changes`

**Alternative valutate:** diff minimale (`before`/`after` contengono solo i campi cambiati), snapshot completo in `before` + diff in `after`, snapshot completo su entrambi i lati.

**Scelta:** diff minimale per UPDATE; snapshot completo per CREATE (come `after`) e DELETE (come `before`); sottoinsieme fisso `{status, completedAt}` per STATE_CHANGE.

**Razionale decisivo:** non è questione di dimensione del log — lo snapshot completo **introduce un bug di correttezza nel sync Sprint 3**. Scenario: device A offline vede `{name: "Latte"}`, device B online cambia name a "Latte intero", poi A offline cambia `quantity`. Con snapshot completo, la entry di A includerebbe `name: "Latte"` come "dopo", sovrascrivendo silenziosamente la modifica di B al sync. Con diff minimale, A emette solo `{quantity: 2}` → il server applica esattamente quello. Il diff minimale **è** il modello di dati che rende il sync semanticamente sicuro, non un'ottimizzazione prematura.

### 6.e — Scope `validation.ts` condiviso + `DomainError` interno ai service

**Scelta:** `src/utils/validation.ts` con funzioni pure riusate da service (difesa) e form component (UX); `src/services/_internal/domain-error.ts` come classe privata al layer service per triggerare rollback Dexie via throw; `src/services/_internal/map-db-error.ts` per convertire Dexie errors in `AppError`.

**Razionale:** separazione di responsabilità pulita — le funzioni di validazione sono pure e testabili singolarmente; `DomainError` è un dettaglio di implementazione del layer service che non deve leakare a hook/UI; `mapDbError` centralizza il mapping di errori Dexie noti (`QuotaExceededError`, `ConstraintError`) + fallback generico.

### 6.f — Test scope aggiunti oltre il minimo del piano-sviluppo

**Scelta utente:**
- `S1-01b` — list-repository smoke test (5 test, 0.5h)
- `S1-08b` — item-repository smoke test (5 test, 0.5h)
- `S1-03b` — use-lists test (4 test, 1h)
- `S1-10b` — use-items test (4 test, 1h)
- `S1-15b` — use-deleted-items test (3 test, 1h)

**Razionale:** il piano-sviluppo originale mandata solo `listService`/`itemService` al 100% (S1-18, S1-19). L'utente ha scelto di aggiungere smoke repository + tutti gli hook per catturare regressioni al confine tra Dexie e la business logic. Costo totale: +4h su ~44h originali (buffer sprint sufficiente).

**Fuori scope test Sprint 1:**
- Component test (rimandati a QA Sprint 5)
- E2E Playwright (il primo E2E utile richiede Sprint 3 per testare sync multi-device)

---

## 7. Sezioni del design presentate e validate

Il design è stato presentato in **9 sezioni**, ciascuna validata esplicitamente dall'utente prima di proseguire:

1. **Vista d'insieme dei layer** — file map, ~25 file nuovi, diagramma di chiamata per un create item ✅
2. **Layer Repository** — contratti dei 3 repository (`list`, `item`, `change-log`), parametro `tx?` opzionale, filtri `deletedAt` gestiti al repository per le read reattive ✅
3. **Layer Service** — pattern transazionale comune, esempi concreti per `createList`, `deleteList` (cascade), `toggleItemStatus`, firme complete dei 10 metodi (5 per `listService`, 5 per `itemService`) ✅
4. **Layer Hook** — `useLists`, `useItems`, `useDeletedItems` come colla tra `useLiveQuery` e service, ~25-35 LOC ciascuno, zero business logic ✅
5. **Layer UI** — routing piatto `/`, `/lists/:listId`, `/lists/:listId/trash`; 3 pagine; 9 componenti common (S1-17 ampliato da 6 a 9 per includere `LoadingSpinner`, `EmptyState`, `ErrorMessage`); `uiStore` popolato con toast queue ✅
6. **Forma di `ChangeLogEntry.changes`** — diff minimale con esempi per ogni `operationType`; utility `buildDiff()` + 3 test ✅
7. **Validazione, errori, AppResult** — taxonomy errori Sprint 1 (`VALIDATION_ERROR`, `NOT_FOUND`, `UNKNOWN_ERROR`), flusso end-to-end di un errore dal service al toast UI, `DomainError` interno, `mapDbError` ✅
8. **Strategia di test** — ~72 test totali distribuiti tra service (~40), repository (10), hook (11), utility (11); criterio completamento sprint aggiornato; no component test, no E2E ✅
9. **Mapping ai 20 + 5 task S1-XX** — ogni task del piano ha una riga con file principali, dipendenze, ore; verifica esplicita dello scope escluso ✅

---

## 8. Scope esplicitamente escluso da Sprint 1

| Esclusione | Sprint/Release destinazione | Motivo |
|------------|-----------------------------|--------|
| Auth, LoginPage, RegisterPage | Sprint 2 | Separazione concerns; Sprint 1 opera con `auth-store` stub |
| Sincronizzazione IndexedDB ↔ Supabase | Sprint 3 | Richiede Backend Activation + Deploy Activation prima |
| Permessi RBAC, viewer read-only | Sprint 4 | Sprint 1 ha utente singolo (stub), owner implicito |
| Autocompletamento articoli, catalog | Sprint 5 | RF-AUTO-001; form rimane statico |
| Gesture swipe, Modalità Shopping | V1.0 post-MVP | Decisione 2 |
| Undo toast con azioni, `useUndo` | V1.0 post-MVP | Decisione 3 |
| Cestino globale `/trash` top-level | Mai pianificato | Decisione 5 |
| Riordino articoli via drag-and-drop | Dexie v2 futura | Decisione 1 |
| Component test (Testing Library) | Sprint 5 QA | ROI basso con service 100% |
| E2E Playwright | Sprint 3 (sync) / Sprint 5 (QA) | Primo test E2E utile richiede sync |
| Lighthouse audit, bundle size | Sprint 5 (S5-07) | Performance budget fase QA |
| WCAG 2.1 AA audit | Sprint 5 (S5-08) | Accessibility audit fase QA |
| Test su device fisico | Sprint 5 (S5-06) | QA finale MVP |
| Bottom nav, `AppShell`, `Header` | Sprint 2 | Routing piatto sufficiente con 3 pagine |

---

## 9. Nuovi task emersi dal brainstorming

| ID | Task | Ore | Note |
|----|------|-----|------|
| S1-01b | `list-repository` smoke test (5 test) | 0.5h | Raccomandazione accettata |
| S1-08b | `item-repository` smoke test (5 test) | 0.5h | Raccomandazione accettata |
| S1-03b | `use-lists` test (4 test) | 1h | Scelto esplicitamente dall'utente |
| S1-10b | `use-items` test (4 test) | 1h | Scelto esplicitamente dall'utente |
| S1-15b | `use-deleted-items` test (3 test) | 1h | Scelto esplicitamente dall'utente |

**Totale nuovi task:** 5 | **Ore aggiunte:** +4h | **Sprint 1 revisionato:** ~48.5h (vs ~44h originali)

Inoltre due task originali sono stati riformulati:

- **S1-12** — da "Toggle stato (swipe + tap)" a **"Toggle stato (tap su checkbox)"** (Decisione 2)
- **S1-14** — da "Soft delete (swipe)" a **"Soft delete (pulsante menu/form)"** (Decisione 2)
- **S1-17** — da 6 componenti a **9 componenti** (aggiunti `LoadingSpinner`, `EmptyState`, `ErrorMessage` che erano nella `mappa-progetto.md` target ma non nel task)

## 10. Nuove dipendenze runtime

| Pacchetto | Versione target | Bundle impact | Uso |
|-----------|-----------------|---------------|-----|
| `@radix-ui/react-dialog` | ^1.x | ~15 kB gzipped | Focus trap per `Modal` e `ConfirmDialog` (S1-17) |

Nessun'altra dipendenza aggiunta. Tutto il resto (React, Dexie, Zustand, Tailwind, Vitest, Testing Library) è già installato dallo Sprint 0.

## 11. Rischi emersi e mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Transazione cascade-delete troppo grande per liste > 200 articoli | Bassa | Medio | Non preoccupante in MVP; se emerge in Sprint 5 QA, spezzare in chunk |
| `useLiveQuery` non reagisce prontamente dopo mutation in transazione lunga | Bassa | Basso | Dexie re-query a commit di transazione (sub-ms). Test hook copre la transizione. |
| Multi-tab race su `getMaxSortOrder` | Bassa | Basso | Letto dentro transazione (vedi Decisione 4) → consistenza garantita dal motore |
| Radix Dialog non tree-shakable in build Vite | Bassa | Basso | Verificabile a build time; fallback custom è 2h di rework |
| Test hook con `useLiveQuery` + `fake-indexeddb` flaky | Media | Basso | Uso consistente di `waitFor` per le transizioni async; `beforeEach` pulisce tutte le tabelle |

## 12. Prossimi passi

1. **Scrittura design spec** → `docs/superpowers/specs/2026-04-14-sprint-1-core-offline-design.md`
2. **Self-review inline del design spec** (placeholders, contradictions, scope, ambiguity)
3. **Review utente del design spec**
4. **Transizione a `superpowers:writing-plans`** per il plan implementativo dettagliato dei 25 task (20 originali + 5 nuovi)

---

*Documento: `docs/superpowers/brainstorms/2026-04-14-sprint-1-core-offline-brainstorm.md`*
*Generato da: `superpowers:brainstorming` skill — sessione 2026-04-14*
