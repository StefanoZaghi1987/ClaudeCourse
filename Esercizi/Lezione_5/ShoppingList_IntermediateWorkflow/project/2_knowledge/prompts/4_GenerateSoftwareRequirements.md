# Prompt per Claude — Specifica Tecnica ShoppingList MVP

---

Sei un senior business analyst e full-stack software engineer con oltre 20 anni di esperienza in architetture software enterprise, PWA offline-first, React, TypeScript, Dexie.js, Supabase e metodologie Spec-Driven Development.

Il tuo compito è produrre un documento di specifica tecnica (Software Requirements Specification — SRS) dettagliato ed esaustivo per il progetto **ShoppingList MVP**, seguendo rigorosamente le istruzioni e i vincoli definiti in questo prompt.

---

## REGOLE OPERATIVE FONDAMENTALI (da rispettare sempre)

### R1 — Ordine di esecuzione critico
Le attività devono essere eseguite **nell'ordine sequenziale definito**. Non è consentito anticipare, saltare o invertire attività.

### R2 — Completamento obbligatorio di ogni attività
Ogni attività deve essere eseguita e completata integralmente. Non è ammessa l'omissione parziale o totale di alcuna attività.

### R3 — Verifica dell'output prima di procedere
- Al termine di ogni attività, verifica che l'output prodotto sia completo, coerente e corretto rispetto alle specifiche.
- Se la verifica fallisce, correggi l'attività corrente prima di passare a quella successiva.
- Non procedere all'attività successiva finché quella corrente non supera la verifica.

### R4 — Richiesta di chiarimenti
Se un requisito o un dettaglio risulta ambiguo o incompleto, formula esplicitamente le domande di chiarimento e attendi risposta prima di procedere.

### R5 — Nessuna assunzione implicita
Tutte le affermazioni tecniche devono basarsi sulla documentazione ufficiale delle tecnologie citate o su fonti affidabili e verificabili. Non formulare assunzioni non supportate da evidenza.

### R6 — Profondità e copertura dell'analisi
Il documento di output deve essere **dettagliato, esaustivo e professionale**. Ogni sezione deve fornire copertura completa del proprio dominio, senza rimandare dettagli a fasi successive senza giustificazione.

---

## ATTIVITÀ 1 — Analisi e comprensione della documentazione di progetto

### 1.1 — Lettura dei documenti caricati

Leggi integralmente e con attenzione tutti i documenti di progetto forniti:

- **`ProjectContext.md`**: contiene la documentazione funzionale completa del progetto ShoppingList, inclusi obiettivi, funzionalità, architettura concettuale, user stories, requisiti non funzionali e roadmap.
- **`FrameworkAnalysis.md`**: contiene l'analisi comparativa degli stack tecnologici candidati, la metodologia di valutazione, la matrice di selezione ponderata e la raccomandazione finale dello stack adottato.

Non procedere all'Attività 1.2 finché non hai letto entrambi i documenti nella loro interezza.

### 1.2 — Verifica della comprensione

Prima di procedere con l'Attività 2, dimostra la comprensione dei documenti producendo un **Executive Summary di comprensione** (max 500 parole) che includa obbligatoriamente:

1. **Sintesi del progetto**: cos'è ShoppingList, qual è il suo obiettivo principale, a chi si rivolge.
2. **Tre sfide tecniche critiche**: identifica le tre complessità tecniche più rilevanti per lo sviluppo dell'MVP.
3. **Stack tecnologico adottato**: elenca tutti i componenti dello stack selezionato con il relativo ruolo architetturale.
4. **Funzionalità Core MVP (Must Have)**: elenca le funzionalità obbligatorie per il rilascio dell'MVP.
5. **Vincoli di sviluppo**: riassumi i vincoli chiave (profilo developer, metodologia, budget, strumenti).

> **VERIFICA 1.2**: L'Executive Summary è completo e coerente con i documenti caricati? Se sì, procedi con l'Attività 2. Se no, rivedi e correggi prima di procedere.

---

## ATTIVITÀ 2 — Produzione del documento di Specifica Tecnica (SRS)

Produci un documento **Software Requirements Specification (SRS)** completo, in **lingua italiana** e in **formato Markdown (.md)**, per il progetto ShoppingList MVP.

### Contesto di riferimento per l'output

- **Stack tecnologico**: React 18 + Vite 5 + TypeScript 5 + Dexie.js 3 + vite-plugin-pwa (Workbox 7) + Supabase 2 + Zustand 4 + React Router 6 + Tailwind CSS 3
- **Paradigma architetturale**: Offline-First SPA (Single Page Application) con PWA
- **Ambiente di sviluppo**: Visual Studio Code + Claude Desktop + Claude Code
- **Metodologia**: Spec-Driven Development con Claude Code
- **Profilo developer**: sviluppatore singolo, non esperto, che adotta SDD con LLM
- **Fase**: MVP — prototipo funzionale estendibile a soluzione production-ready

### Struttura obbligatoria del documento SRS

Il documento deve includere **tutte e sole** le seguenti sezioni, nell'ordine indicato. Ogni sezione deve essere sviluppata con la massima profondità e completezza.

---

#### SEZIONE 1 — Introduzione e Scopo del Documento

- 1.1 Scopo del documento (SRS, destinatari, utilizzo previsto)
- 1.2 Ambito del sistema (nome, descrizione sintetica, obiettivi, esclusioni esplicite)
- 1.3 Definizioni, acronimi e abbreviazioni (glossario tecnico completo)
- 1.4 Riferimenti (documenti di progetto, standard, documentazioni ufficiali tecnologie)
- 1.5 Panoramica del documento

---

#### SEZIONE 2 — Descrizione Generale del Sistema

- 2.1 Prospettiva del sistema (contesto e posizionamento nel panorama applicativo)
- 2.2 Funzioni principali del sistema (overview ad alto livello)
- 2.3 Caratteristiche degli utenti
  - Utente Guest (non autenticato)
  - Utente Registrato — Owner
  - Utente Registrato — Editor
  - Utente Registrato — Viewer
- 2.4 Vincoli generali del sistema
- 2.5 Assunzioni e dipendenze
- 2.6 Dipendenze esterne (Supabase, CDN, browser API)

---

#### SEZIONE 3 — Stack Tecnologico e Architettura

- 3.1 Stack tecnologico dettagliato
  - Tabella componenti: tecnologia, versione, ruolo, riferimento ufficiale
- 3.2 Architettura del sistema — diagramma a layer
  - UI Layer (React, Tailwind, React Router)
  - Business Logic Layer (TypeScript Services, Custom Hooks)
  - Persistence Layer (Dexie.js, IndexedDB)
  - Sync Layer (Supabase JS Client, Realtime)
  - PWA Layer (vite-plugin-pwa, Workbox, Service Worker)
  - Diagramma ASCII/testuale dell'architettura a layer
- 3.3 Struttura del progetto (directory tree completo con descrizione di ogni cartella/file chiave)
- 3.4 Flussi dati principali
  - Flusso operazione offline (diagramma sequenziale)
  - Flusso sincronizzazione (diagramma sequenziale)
  - Flusso autenticazione (diagramma sequenziale)
  - Flusso condivisione lista e accettazione invito (diagramma sequenziale)
- 3.5 Configurazione ambiente di sviluppo (prerequisiti, setup step-by-step, variabili d'ambiente)
- 3.6 Configurazione PWA (vite.config.ts, manifest, strategie Workbox)

---

#### SEZIONE 4 — Schema del Database Locale (Dexie.js / IndexedDB)

- 4.1 Introduzione al modello dati locale
- 4.2 Tabelle e schema Dexie.js (versione, indici, relazioni)
  - Tabella `lists`
  - Tabella `items`
  - Tabella `changeLog`
  - Tabella `itemCatalog`
  - Tabella `invites`
- 4.3 Tipi TypeScript per ogni entità (interfacce complete)
- 4.4 Strategia di versionamento e migrazione schema
- 4.5 Vincoli di integrità e validazione lato client

---

#### SEZIONE 5 — Schema del Database Remoto (Supabase / PostgreSQL)

- 5.1 Introduzione al modello dati remoto
- 5.2 Tabelle PostgreSQL (DDL completo con commenti)
  - `profiles`
  - `lists`
  - `list_permissions`
  - `items`
  - `invite_tokens`
  - `change_log` (opzionale per audit server-side)
- 5.3 Row Level Security (RLS) — politiche complete per ogni tabella
  - Policy per `lists`
  - Policy per `items`
  - Policy per `list_permissions`
  - Policy per `invite_tokens`
- 5.4 Indici PostgreSQL (performance)
- 5.5 Trigger e funzioni PostgreSQL (updated_at automatico, etc.)
- 5.6 Supabase Realtime — configurazione e canali sottoscritti

---

#### SEZIONE 6 — Requisiti Funzionali

Per ogni requisito funzionale, specifica:
- **ID**: RF-XXX (numerazione progressiva)
- **Nome**: nome breve del requisito
- **Descrizione**: descrizione dettagliata
- **Priorità**: MUST / SHOULD / COULD (MoSCoW)
- **Attori**: chi esegue l'azione
- **Precondizioni**: stato del sistema richiesto
- **Flusso principale**: passi del flusso normale
- **Flussi alternativi**: varianti e casi edge
- **Postcondizioni**: stato del sistema dopo l'operazione
- **Regole di business**: vincoli e logiche applicate
- **Note implementative**: indicazioni tecniche specifiche per lo stack

**Domini funzionali da coprire (TUTTI obbligatori):**

- **RF-AUTH**: Autenticazione e gestione sessioni (registrazione, login, OAuth, recupero password, logout, modalità guest, upgrade guest→registrato)
- **RF-LIST**: Gestione liste (CRUD completo, archiviazione, ordinamento, metadati)
- **RF-ITEM**: Gestione articoli (CRUD, toggle stato, attributi, soft delete, cestino, ripristino, duplicazione, spostamento)
- **RF-SHARE**: Condivisione liste (generazione invito, accettazione, revoca, modifica permessi, trasferimento ownership)
- **RF-SYNC**: Sincronizzazione (change tracking, delta sync, conflict detection, conflict resolution, indicatori stato)
- **RF-PERM**: Sistema permessi (enforcement OWNER/EDITOR/VIEWER, validazione client e server)
- **RF-AUTO**: Autocompletamento (database articoli locale, suggerimenti, parsing input, sincronizzazione catalogo)
- **RF-SHOP**: Modalità Shopping (UI semplificata, riordino per percorso, gesture, feedback)
- **RF-SEARCH**: Ricerca e filtri (ricerca globale, filtri per stato/categoria/lista, ordinamento)
- **RF-UNDO**: Undo/Redo e Cestino (stack operazioni, ripristino articoli eliminati)
- **RF-TMPL**: Template e duplicazione (salva template, crea da template, duplica lista)
- **RF-NOTIF**: Sistema notifiche (push notification, in-app, preferenze, batching)
- **RF-LOG**: Log attività (cronologia modifiche, filtri, formato visualizzazione)
- **RF-EXPORT**: Import/Export (formati TXT, CSV, JSON, clipboard, stampa)
- **RF-PROFILE**: Profilo utente (modifica dati, avatar, preferenze, dispositivi)

---

#### SEZIONE 7 — Requisiti Non Funzionali

Per ogni requisito non funzionale, specifica: ID, nome, descrizione, metrica misurabile, metodo di verifica.

- **RNF-PERF**: Performance (Time to Interactive, risposta UI, sync latency, bundle size)
- **RNF-OFFLINE**: Offline capability (funzionalità disponibili offline, persistenza, recovery)
- **RNF-SEC**: Sicurezza (autenticazione, autorizzazione, cifratura, input validation, rate limiting)
- **RNF-ACC**: Accessibilità (WCAG 2.1 AA, navigazione tastiera, screen reader, touch targets)
- **RNF-UX**: Usabilità (curva apprendimento, feedback, error handling, responsive design)
- **RNF-COMPAT**: Compatibilità (browser supportati, sistemi operativi, dispositivi)
- **RNF-MAINT**: Manutenibilità (struttura codice, test coverage, documentazione, naming conventions)
- **RNF-SCALE**: Scalabilità (limiti dati per utente, performance con dataset crescenti)
- **RNF-I18N**: Localizzazione (lingua italiana, formati data/numeri/valute, estendibilità)
- **RNF-GDPR**: Privacy e GDPR (data minimization, diritto all'oblio, esportazione dati, consensi)

---

#### SEZIONE 8 — Architettura dei Componenti React

- 8.1 Principi di componentizzazione adottati
- 8.2 Gerarchia dei componenti (tree completo)
- 8.3 Specifica di ogni componente principale:
  - **Nome componente**
  - Props (interfaccia TypeScript completa)
  - State locale gestito
  - Hook utilizzati
  - Responsabilità e comportamento
  - Accessibilità (aria-label, role, keyboard navigation)
  - Note implementative

**Componenti da specificare (tutti obbligatori):**

*Layout:*
- `App`, `AppLayout`, `AuthLayout`, `Header`, `BottomNav`, `SyncStatusBar`

*Pagine:*
- `HomePage`, `ListPage`, `LoginPage`, `RegisterPage`, `ProfilePage`, `InvitePage`, `TrashPage`, `SearchPage`, `TemplatePage`

*Liste:*
- `ListCard`, `ListList`, `ListForm`, `ListHeader`, `ListSharingModal`, `ListMembersPanel`, `ListActionsMenu`

*Articoli:*
- `ItemRow`, `ItemList`, `ItemForm`, `ItemQuickAdd`, `TrashItemRow`, `ItemSortableList`

*Sync:*
- `SyncIndicator`, `ConflictResolutionModal`, `OfflineBanner`

*Auth:*
- `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `OAuthButtons`, `GuestBanner`

*Comuni:*
- `Button`, `Input`, `Checkbox`, `Modal`, `Toast`, `ConfirmDialog`, `EmptyState`, `LoadingSpinner`, `Badge`, `Avatar`

---

#### SEZIONE 9 — Business Logic Layer (Services e Custom Hooks)

- 9.1 Principi del layer di business logic
- 9.2 Specifica di ogni Service (TypeScript puro, indipendente da UI):
  - `listService.ts` — interfaccia pubblica completa con firme funzioni e descrizioni
  - `itemService.ts`
  - `syncService.ts`
  - `conflictService.ts`
  - `permissionService.ts`
  - `authService.ts`
  - `catalogService.ts` (autocompletamento)
  - `inviteService.ts`
  - `exportService.ts`

- 9.3 Specifica di ogni Custom Hook (integrazione React + Dexie + Supabase):
  - `useAuth.ts`
  - `useLists.ts`
  - `useItems.ts`
  - `useSync.ts`
  - `usePermissions.ts`
  - `useAutocomplete.ts`
  - `useUndo.ts`
  - `useConflicts.ts`
  - `useNotifications.ts`
  - `useSearch.ts`

Per ogni Service e Hook specifica: scopo, dipendenze, interfaccia pubblica (firme TypeScript complete), comportamento in modalità offline, gestione errori.

---

#### SEZIONE 10 — Persistence Layer (Dexie.js)

- 10.1 Istanza Dexie e configurazione (`src/db/database.ts`)
- 10.2 Pattern di accesso al database (repository pattern)
- 10.3 useLiveQuery — utilizzo e pattern reattivi
- 10.4 Change Log — struttura, registrazione operazioni, gestione del log
- 10.5 Strategia di pulizia dati (cestino, change log sincronizzati, catalogo obsoleto)
- 10.6 Gestione errori database (quota exceeded, versione incompatibile, corruzione)
- 10.7 Testing del Persistence Layer

---

#### SEZIONE 11 — Sync Layer e Conflict Resolution

- 11.1 Architettura del Sync Layer
- 11.2 Change Tracking — struttura record, operazioni tracciate, timestamp
- 11.3 Delta Sync Protocol — flusso dettagliato upload e download
- 11.4 Strategia di conflict detection
  - Definizione di conflitto (operazioni concorrenti, clock skew)
  - Tipologie di conflitti (campo diverso, stesso campo, delete vs update, create conflict)
- 11.5 Strategie di conflict resolution
  - Merge automatico (conflitti su campi diversi)
  - Last-Write-Wins con logging (conflitti semantici semplici)
  - Prompt utente (conflitti critici)
  - Regole per ogni tipo di conflitto
- 11.6 Supabase Realtime — sottoscrizioni, gestione eventi remoti, aggiornamento UI
- 11.7 Retry e resilienza (exponential backoff, gestione rete intermittente, queue manager)
- 11.8 Indicatori stato sincronizzazione (stati, transizioni, UI)
- 11.9 Scenari edge case e relative strategie (multi-device stesso utente, revoca accesso durante sync, etc.)

---

#### SEZIONE 12 — Autenticazione e Gestione Sessioni (Supabase Auth)

- 12.1 Flussi di autenticazione supportati
  - Email + Password (registrazione e login)
  - OAuth Google (OpenID Connect)
  - OAuth Apple (OpenID Connect)
  - Modalità Guest (localStorage anonymous ID)
- 12.2 Gestione token JWT (access token, refresh token, scadenza, rinnovo automatico)
- 12.3 Persistenza sessione (Supabase session storage, ripristino al reload)
- 12.4 Upgrade Guest → Utente Registrato (migrazione dati locali, primo sync)
- 12.5 Rate limiting e protezione brute force
- 12.6 Gestione errori autenticazione (UX e messaggi d'errore)
- 12.7 Sicurezza implementativa (HTTPS, CORS, token rotation)

---

#### SEZIONE 13 — Sistema di Permessi

- 13.1 Modello RBAC (Role-Based Access Control) adottato
- 13.2 Matrice permessi completa (tabella OWNER / EDITOR / VIEWER × azioni)
- 13.3 Enforcement lato client (UI adattiva, disabilitazione controlli)
- 13.4 Enforcement lato server (RLS Supabase, validazione ogni chiamata API)
- 13.5 Gestione inviti (generazione token, invio, accettazione, scadenza, revoca)
- 13.6 Trasferimento ownership (flusso, conferme, notifiche)
- 13.7 Gestione revoca accesso (immediata, sincronizzazione forzata, notifica)

---

#### SEZIONE 14 — PWA e Service Worker

- 14.1 Requisiti PWA (installabilità, offline, manifest, icone)
- 14.2 Configurazione vite-plugin-pwa (vite.config.ts annotato)
- 14.3 Web App Manifest (tutti i campi richiesti)
- 14.4 Strategie Workbox per tipologia di risorsa:
  - Asset statici (CacheFirst)
  - API Supabase (NetworkFirst con fallback)
  - Pagine (StaleWhileRevalidate)
- 14.5 Background Sync API (gestione operazioni offline in coda)
- 14.6 Aggiornamento Service Worker (strategia autoUpdate, notifica utente)
- 14.7 Limitazioni PWA su iOS Safari (documentazione vincoli noti)
- 14.8 Test PWA (Lighthouse, installabilità, offline mode)

---

#### SEZIONE 15 — Accessibilità (WCAG 2.1 AA)

- 15.1 Principi POUR (Perceivable, Operable, Understandable, Robust)
- 15.2 Requisiti implementativi per ogni componente (aria-label, role, focus, keyboard)
- 15.3 Gestione focus management (modal, navigazione, transizioni pagina)
- 15.4 Contrasto colori (requisiti minimi, palette conforme)
- 15.5 Touch targets (dimensioni minime 44×44px, modalità shopping 60×60px)
- 15.6 Screen reader support (NVDA, VoiceOver, TalkBack)
- 15.7 Testing accessibilità (strumenti: axe-core, Lighthouse, test manuale)

---

#### SEZIONE 16 — Gestione Stato (Zustand)

- 16.1 Principi di state management adottati
- 16.2 Store globali definiti:
  - `useAuthStore` (utente, sessione, isGuest)
  - `useAppStore` (connettività, sync status, notifiche)
  - `useUIStore` (loading states, modali aperte, toast)
- 16.3 Interfacce TypeScript complete per ogni store
- 16.4 Pattern di aggiornamento state (actions, selectors)
- 16.5 Persistenza state tra sessioni (zustand/middleware/persist)
- 16.6 Integrazione Zustand + Dexie (useLiveQuery + Zustand)

---

#### SEZIONE 17 — Routing (React Router 6)

- 17.1 Struttura route (tabella percorso → componente → protezione)
- 17.2 Route protette (autenticazione richiesta, reindirizzamento)
- 17.3 Route pubbliche (invite, link pubblici)
- 17.4 Navigazione offline (fallback pagine non disponibili offline)
- 17.5 Deep linking (apertura diretta da notifica push)
- 17.6 Gestione history e back-navigation

---

#### SEZIONE 18 — Testing Strategy

- 18.1 Filosofia di testing per Spec-Driven Development
- 18.2 Tipologie di test e strumenti:
  - Unit test (Vitest + @testing-library/react)
  - Integration test (Vitest + MSW per mock Supabase)
  - E2E test (Playwright)
- 18.3 Coverage target (> 80% per Business Logic, > 60% per UI)
- 18.4 Test plan per scenari critici:
  - Operazioni offline complete
  - Sincronizzazione con conflitti
  - Sistema permessi (accesso non autorizzato)
  - Upgrade guest → registrato
  - Revoca accesso durante sessione attiva
- 18.5 Test di performance (Lighthouse CI, bundle size monitoring)
- 18.6 Test di accessibilità (axe-core integrato nei test)
- 18.7 Strategia CI/CD per i test (GitHub Actions)

---

#### SEZIONE 19 — Sicurezza

- 19.1 Threat model (minacce identificate per questo tipo di applicazione)
- 19.2 Autenticazione e autorizzazione (misure implementate)
- 19.3 Validazione e sanitizzazione input (prevenzione XSS, injection)
- 19.4 Gestione dati sensibili (no storage in chiaro, HTTPS, token handling)
- 19.5 Rate limiting (endpoint critici: login, registrazione, inviti)
- 19.6 CORS configuration (Supabase + Vite dev server)
- 19.7 Sicurezza Service Worker (scope, update, HTTPS obbligatorio)
- 19.8 Supabase RLS come difesa in profondità
- 19.9 Dipendenze di terze parti (policy aggiornamento, vulnerability scanning)

---

#### SEZIONE 20 — Deployment e Infrastruttura MVP

- 20.1 Architettura di deployment MVP
  - Frontend: Vercel (free tier) o Netlify (free tier) — configurazione
  - Backend: Supabase Cloud (free tier) — limiti e monitoraggio
- 20.2 Variabili d'ambiente (lista completa, classificazione pubblica/privata)
- 20.3 Build pipeline (comandi npm, ottimizzazioni bundle, code splitting)
- 20.4 Configurazione dominio e HTTPS
- 20.5 Monitoring base (Supabase dashboard, Vercel analytics)
- 20.6 Backup e recovery (Supabase backup automatici, export dati)
- 20.7 Limiti free tier e piano di escalation

---

#### SEZIONE 21 — Piano di Sviluppo MVP (Sprint Plan)

- 21.1 Metodologia Spec-Driven Development con Claude Code (workflow dettagliato)
- 21.2 Sprint plan dettagliato:
  - Sprint 0: Setup infrastruttura e ambiente (task, durata, criteri di completamento)
  - Sprint 1: Core offline — liste e articoli
  - Sprint 2: Autenticazione e profilo
  - Sprint 3: Sincronizzazione base
  - Sprint 4: Condivisione e permessi
  - Sprint 5: Autocompletamento e refinement
- 21.3 Definition of Done per ogni sprint
- 21.4 Milestone e deliverable
- 21.5 Rischi e mitigazioni (tabella: rischio, probabilità, impatto, mitigazione)
- 21.6 Dipendenze tra sprint e task critici

---

#### SEZIONE 22 — Appendici

- **Appendice A**: Glossario tecnico completo (termine → definizione)
- **Appendice B**: Riferimenti e documentazioni ufficiali (tecnologie, standard W3C, WCAG)
- **Appendice C**: Esempi di codice TypeScript per pattern chiave
  - Esempio: definizione schema Dexie.js completo
  - Esempio: custom hook `useLists` con useLiveQuery
  - Esempio: syncService — loop di sincronizzazione
  - Esempio: conflictService — algoritmo di merge
  - Esempio: componente React accessibile (ItemRow con aria)
- **Appendice D**: Comandi utili di sviluppo (npm scripts, Supabase CLI, Vite, etc.)
- **Appendice E**: Checklist di qualità pre-release MVP

---

### Requisiti di qualità per il documento SRS

Il documento prodotto deve rispettare i seguenti standard qualitativi:

1. **Lingua**: italiano corretto, tecnico e professionale
2. **Formato**: Markdown valido, heading gerarchici corretti, tabelle ben formate
3. **Completezza**: tutte le 22 sezioni devono essere sviluppate integralmente
4. **Precisione tecnica**: ogni affermazione tecnica deve essere verificata rispetto alla documentazione ufficiale delle tecnologie
5. **Coerenza interna**: nessuna contraddizione tra sezioni diverse
6. **Riferimenti incrociati**: dove opportuno, le sezioni devono richiamarsi vicendevolmente
7. **Esempi concreti**: ogni concetto astratto deve essere illustrato con almeno un esempio concreto
8. **Diagrammi**: utilizzare diagrammi ASCII o testuali per architetture, flussi e strutture dati
9. **Codice TypeScript**: gli snippet di codice devono essere sintatticamente corretti e commentati

---

## VERIFICA FINALE

Al termine della produzione del documento SRS, esegui una verifica finale e produci un **Riepilogo di Completamento** che confermi:

| Attività | Stato | Note |
|----------|-------|------|
| 1.1 Lettura documenti | ✅/❌ | |
| 1.2 Executive Summary di comprensione | ✅/❌ | |
| 2 Documento SRS — Sezione 1 (Introduzione) | ✅/❌ | |
| 2 Documento SRS — Sezione 2 (Descrizione Generale) | ✅/❌ | |
| 2 Documento SRS — Sezione 3 (Stack e Architettura) | ✅/❌ | |
| 2 Documento SRS — Sezione 4 (DB Locale Dexie.js) | ✅/❌ | |
| 2 Documento SRS — Sezione 5 (DB Remoto Supabase) | ✅/❌ | |
| 2 Documento SRS — Sezioni 6-7 (Requisiti F/NF) | ✅/❌ | |
| 2 Documento SRS — Sezioni 8-9 (Componenti e Services) | ✅/❌ | |
| 2 Documento SRS — Sezioni 10-11 (Persistence e Sync) | ✅/❌ | |
| 2 Documento SRS — Sezioni 12-13 (Auth e Permessi) | ✅/❌ | |
| 2 Documento SRS — Sezioni 14-15 (PWA e Accessibilità) | ✅/❌ | |
| 2 Documento SRS — Sezioni 16-17 (State e Routing) | ✅/❌ | |
| 2 Documento SRS — Sezioni 18-19 (Testing e Sicurezza) | ✅/❌ | |
| 2 Documento SRS — Sezioni 20-21 (Deploy e Sprint Plan) | ✅/❌ | |
| 2 Documento SRS — Sezione 22 (Appendici) | ✅/❌ | |
| Verifica coerenza interna documento | ✅/❌ | |
| Output generato come artifact Markdown scaricabile | ✅/❌ | |

Il documento SRS deve essere prodotto come **artifact Markdown (.md) scaricabile**.
