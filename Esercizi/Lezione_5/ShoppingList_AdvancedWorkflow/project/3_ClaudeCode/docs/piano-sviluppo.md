# Piano di Sviluppo MVP — ShoppingList

> **Metodologia:** Spec-Driven Development con Claude Code  
> **Stack:** React 18 + TypeScript + Vite + Dexie.js + Supabase + Zustand + Tailwind CSS  
> **Durata stimata totale:** 7-9 settimane  
> **Ultimo aggiornamento:** Marzo 2026

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

**Obiettivo:** Ambiente di sviluppo funzionante, infrastruttura configurata, PWA installabile.  
**Criterio completamento:** App vuota deployata su Vercel con Supabase connesso, test "Hello World" passa, PWA installabile su mobile.

| ID | Task | Durata | Dipendenze | Stato |
|----|------|--------|-----------|-------|
| S0-01 | Setup progetto: `npm create vite@latest` + React + TypeScript | 1h | — | [ ] |
| S0-02 | Configurazione Tailwind CSS 3 | 30min | S0-01 | [ ] |
| S0-03 | Configurazione ESLint + Prettier (strict TypeScript) | 30min | S0-01 | [ ] |
| S0-04 | Setup Supabase progetto + DDL schema v1 (SRS Sezione 5) | 2h | — | [ ] |
| S0-05 | Configurazione RLS Supabase (SRS Sezione 5.3) | 2h | S0-04 | [ ] |
| S0-06 | Setup Dexie.js schema locale v1 (SRS Sezione 4) | 1h | S0-01 | [ ] |
| S0-07 | Setup vite-plugin-pwa + manifest + Service Worker base | 1h | S0-01 | [ ] |
| S0-08 | Setup Vitest + Testing Library + Playwright | 1h | S0-01 | [ ] |
| S0-09 | Struttura directory progetto (src/components, hooks, services, etc.) | 30min | S0-01 | [ ] |
| S0-10 | Setup Zustand stores base (authStore, listStore, uiStore) | 1h | S0-01 | [ ] |
| S0-11 | Configurazione Supabase client singleton (lib/supabase.ts) | 30min | S0-04 | [ ] |
| S0-12 | Deploy pipeline Vercel (connect GitHub repo, env vars) | 1h | S0-01 | [ ] |
| S0-13 | Routing base: AppShell, HomePage, LoginPage (React Router 6) | 1h | S0-01 | [ ] |
| S0-14 | Aggiorna `docs/mappa-progetto.md` con struttura iniziale | 30min | S0-09 | [ ] |

**✅ Milestone M1:** App avviabile, auth configurata, PWA installabile

---

## Sprint 1 — Core Offline: Liste e Articoli (Settimane 2-3)

**Obiettivo:** CRUD completo di liste e articoli offline-first, senza autenticazione.  
**Criterio completamento:** Tutte le operazioni funzionano con DevTools → Network → Offline.

| ID | RF | Task | Durata | Stato |
|----|-----|------|--------|-------|
| S1-01 | RF-LIST-001 | Repository: listRepository (CRUD Dexie) | 3h | [ ] |
| S1-02 | RF-LIST-001 | Service: listService (create, update, archive, delete) | 3h | [ ] |
| S1-03 | RF-LIST-001 | Hook: useLists (lista reattiva con useLiveQuery) | 2h | [ ] |
| S1-04 | RF-LIST-001 | UI: HomePage con lista delle liste + ListCard | 4h | [ ] |
| S1-05 | RF-LIST-002 | UI: Form creazione/modifica lista (ListForm) | 2h | [ ] |
| S1-06 | RF-LIST-003 | Soft delete lista + conferma | 1h | [ ] |
| S1-07 | RF-LIST-004 | Archiviazione lista (status: ARCHIVED) | 1h | [ ] |
| S1-08 | RF-ITEM-001 | Repository: itemRepository (CRUD Dexie) | 3h | [ ] |
| S1-09 | RF-ITEM-001 | Service: itemService (create, update, delete, toggle) | 3h | [ ] |
| S1-10 | RF-ITEM-001 | Hook: useItems (articoli reattivi per listId) | 2h | [ ] |
| S1-11 | RF-ITEM-001 | UI: ListPage con lista articoli + ItemRow | 4h | [ ] |
| S1-12 | RF-ITEM-002 | Toggle stato DA_COMPRARE/COMPLETATO (swipe + tap) | 2h | [ ] |
| S1-13 | RF-ITEM-003 | UI: Form aggiunta/modifica articolo (ItemForm) | 3h | [ ] |
| S1-14 | RF-ITEM-004 | Soft delete articolo (deleted:true) | 1h | [ ] |
| S1-15 | RF-ITEM-005 | UI: TrashPage — cestino articoli + ripristino | 3h | [ ] |
| S1-16 | — | Change Tracking automatico (changeLogRepository) | 3h | [ ] |
| S1-17 | — | Componenti comuni: Button, Modal, Toast, Input, Badge, ConfirmDialog | 4h | [ ] |
| S1-18 | — | Test Unit: listService (100% copertura) | 2h | [ ] |
| S1-19 | — | Test Unit: itemService (100% copertura) | 2h | [ ] |
| S1-20 | — | Aggiorna `docs/mappa-progetto.md` | 30min | [ ] |

**✅ Milestone M2:** CRUD completo offline funzionante

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
| S5-01 | RF-AUTO-001 | catalogRepository: CRUD catalogo articoli locale | 2h | [ ] |
| S5-02 | RF-AUTO-001 | catalogService: aggiorna frequenza, suggerimenti top-10 | 3h | [ ] |
| S5-03 | RF-AUTO-001 | UI: Autocompletamento in ItemForm (debounce 300ms) | 3h | [ ] |
| S5-04 | RF-AUTO-002 | Sync catalogo tra collaboratori (merge additivo) | 2h | [ ] |
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
