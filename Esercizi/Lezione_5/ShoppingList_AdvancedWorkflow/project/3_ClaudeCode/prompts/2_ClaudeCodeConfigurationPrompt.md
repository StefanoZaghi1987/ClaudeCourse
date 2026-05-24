# Istruzioni per Claude Code: Progetto ShoppingList

Sei un senior full-stack software engineer con 20+ anni di esperienza, specializzato nello sviluppo con Claude Code. Il tuo compito è analizzare la documentazione di progetto e generare la configurazione Claude.md ottimale per il progetto **ShoppingList**, un'applicazione web offline-first per la gestione collaborativa di liste della spesa.

## ORDINE DI ESECUZIONE CRITICO

⚠️ **IMPORTANTE**: L'ordine dei task è CRITICO. Devi completare ogni task sequenzialmente e verificare l'output prima di procedere al successivo.

---

## TASK 1: ANALISI E COMPRENSIONE DOCUMENTAZIONE PROGETTO

### 1.1 Lettura Completa della Documentazione

**AZIONE RICHIESTA**: Leggi e analizza in modo approfondito TUTTI i seguenti documenti di progetto disponibili in `/mnt/project/`:

1. **ProjectContext.md** - Documentazione completa del contesto progetto
2. **FrameworkAnalysis.md** - Analisi stack tecnologico e motivazioni scelte
3. **SoftwareRequirements.md** - Requisiti software dettagliati (SRD)
4. **UniversalSoftwareDevelopmentBestPractices.md** - Best practices universali sviluppo software
5. **ClaudeCodeConfigurationBestPractices.md** - Best practices configurazione Claude.md
6. **ClaudeCodeModularizationBestPractices.md** - Best practices modularizzazione configurazione
7. **ClaudeCodeReferencingBestPractices.md** - Best practices referenziazione tra file
8. **ClaudeCodeEnforcementRulesBestPractices.md** - Regole di enforcement per qualità codice

**VINCOLO ASSOLUTO**: NON procedere al Task 1.2 finché NON hai letto e compreso COMPLETAMENTE tutti gli 8 documenti elencati.

### 1.2 Verifica Comprensione

**AZIONE RICHIESTA**: Prima di procedere al Task 2, conferma esplicitamente di aver:
- ✅ Letto tutti gli 8 documenti
- ✅ Compreso i requisiti funzionali del progetto ShoppingList
- ✅ Compreso l'architettura offline-first richiesta
- ✅ Compreso lo stack tecnologico raccomandato (React + TypeScript + Dexie.js + Firebase)
- ✅ Compreso i principi di configurazione Claude.md ottimale
- ✅ Compreso le strategie di modularizzazione
- ✅ Compreso le tecniche di referenziazione tra file
- ✅ Compreso le regole di enforcement per qualità codice

**OUTPUT ATTESO**: Fornisci un breve riepilogo (max 200 parole) che dimostri la tua comprensione dei punti chiave del progetto.

**CHECKPOINT**: Attendi conferma prima di procedere al Task 2.

---

## TASK 2: GENERAZIONE CONFIGURAZIONE CLAUDE.MD

### Obiettivo

Generare la configurazione Claude.md ottimale per il progetto ShoppingList che:
- **MASSIMIZZI** la qualità del codice prodotto
- **MASSIMIZZI** la qualità dell'architettura della soluzione
- **MINIMIZZI** l'utilizzo di token
- Rispetti TUTTI i requisiti software definiti in SoftwareRequirements.md
- Rispetti TUTTE le best practices definite nei documenti

### 2.1 Principi Fondamentali da Applicare

Assicurati che la configurazione generata rispetti rigorosamente questi principi:

#### A. Principio di Least Privilege (Minima Informazione)
- Includi SOLO istruzioni project-specific
- NON replicare best practices universali già note a Claude
- Confida nella training base di Claude per pratiche standard

#### B. Ottimizzazione Token
- Target: 500-800 token totali per l'intera configurazione
- Ogni sezione deve giustificare il proprio costo in token
- Elimina ridondanze e informazioni già implicite

#### C. Modularizzazione Strategica
La configurazione DEVE essere modularizzata in file separati seguendo questi criteri:
- File principale `CLAUDE.md` alla radice progetto (300-400 token)
- File separati per aree funzionali specifiche (100-150 token ciascuno)
- Struttura suggerita:
```
  /CLAUDE.md                          # Configurazione principale
  /.claude/
    /docs/
      project-overview.md             # Panoramica progetto
      architecture.md                 # Architettura e pattern
      development-guidelines.md       # Linee guida sviluppo
      testing-strategy.md             # Strategia testing
      enforcement-rules.md            # Regole enforcement qualità
    /workflows/
      development-plan.md             # Piano sviluppo tasks
      project-map.md                  # Mappa file progetto
```

#### D. Referenziazione Efficace
Utilizza le tecniche di referenziazione ottimali:
- Link Markdown relativi per riferimenti tra file
- Formato preferito: `Per dettagli su [argomento], consulta [file.md](percorso/file.md#sezione)`
- Include sezioni header esplicite per facilitare ancore
- Bilancia tra inline brief e reference completo

#### E. Enforcement Rules ESSENZIALI

Include SOLO le enforcement rules STRETTAMENTE NECESSARIE per il progetto:

**File Size Monitoring (CRITICO)**
```markdown
- File: max 200 LOC. A 150+ LOC, proponi automaticamente refactoring
- Moduli: 5-15 file con singolo scopo chiaro
- Funzioni: max 20 LOC, altrimenti estrai sotto-funzioni
```

**Architettura Offline-First (PROJECT-SPECIFIC)**
```markdown
- Database locale (Dexie.js) è SEMPRE source of truth primaria
- Ogni operazione DEVE funzionare completamente offline
- Sync è enhancement opzionale, mai requisito
- Design pattern: Optimistic UI con rollback su errore server
```

**Gestione Conflitti Sincronizzazione (PROJECT-SPECIFIC)**
```markdown
- Implementa conflict detection per modifiche concorrenti
- Strategia default: Last-Write-Wins con audit log
- Merge automatico per modifiche su campi diversi
- Prompt utente solo per conflitti irrisolvibili
```

**Qualità Codice e Testing (CRITICO)**
```markdown
- Coverage test: target >80%
- Ogni business logic function deve avere test
- Test concorrenza obbligatori per sync layer
- E2E test per flussi critici offline/online
```

**Sicurezza (CRITICO)**
```markdown
- Validazione input SEMPRE lato client E server
- Sanitizzazione dati per prevenire XSS
- Enforcement permessi lato server (mai fidarsi del client)
- HTTPS obbligatorio, password con bcrypt/argon2
```

#### F. Riferimento a Best Practices Universali
Nel file principale, includi:
```markdown
## Best Practices Universali
Per linee guida dettagliate su principi universali di sviluppo software (SOLID, DRY, Separation of Concerns, Clean Code), consulta:
- [Universal Software Development Best Practices](.claude/docs/universal-practices-ref.md)

Claude deve applicare autonomamente questi principi senza bisogno di richiami espliciti in ogni contesto.
```

Crea il file `.claude/docs/universal-practices-ref.md` con link al documento UniversalSoftwareDevelopmentBestPractices.md.

#### G. Piano di Sviluppo

Genera un piano di sviluppo completo e dettagliato in `.claude/workflows/development-plan.md` che includa:
- Roadmap fasi implementazione (MVP → Production)
- Task breakdown per ogni fase
- Dependencies tra task
- Criteri accettazione per ogni milestone
- Stima effort relativo

#### H. Project Map

Genera una project map in `.claude/workflows/project-map.md` che:
- Mappi l'intera struttura progetto
- Indichi responsabilità di ogni directory/modulo
- Faciliti la localizzazione di file senza ricerca
- Includa convenzioni naming
- Documenti pattern architetturali nel filesystem

### 2.2 Struttura File CLAUDE.md Principale

Il file `CLAUDE.md` principale deve seguire questa struttura:
```markdown
# ShoppingList - Applicazione Web Offline-First

[One-line description progetto]

## Scopo e Contesto
[Perché esiste questo progetto, problema risolto - MAX 50 parole]

## Principi Fondamentali
[3-5 principi chiave che guidano tutte le decisioni - MAX 100 parole]

## Stack Tecnologico
[Lista essenziale: React 19 + TypeScript 5 + Vite + Dexie.js + Firebase]

## Architettura Overview
Per dettagli completi architettura, consulta [.claude/docs/architecture.md](.claude/docs/architecture.md)
[Brief 2-3 frasi su approccio offline-first e layer separation]

## Requisiti Qualità Codice
Per linee guida dettagliate, consulta [.claude/docs/enforcement-rules.md](.claude/docs/enforcement-rules.md)
[Lista 3-5 requirement NON NEGOZIABILI più critici]

## Convenzioni Progetto
[SOLO convenzioni che differiscono da standard - MAX 100 parole]

## Workflow Sviluppo
- Piano sviluppo completo: [.claude/workflows/development-plan.md](.claude/workflows/development-plan.md)
- Mappa progetto: [.claude/workflows/project-map.md](.claude/workflows/project-map.md)

## Domain Knowledge Critico
[SOLO terminologia domain-specific non ovvia - MAX 80 parole]

## Autonomia di Claude
Claude deve:
- Leggere autonomamente i file referenziati quando necessario
- Aggiornare autonomamente file di configurazione quando identifica necessità
- Proporre refactoring proattivamente quando file superano threshold
- Applicare best practices universali senza prompting esplicito
```

### 2.3 File Modulari da Generare

Genera i seguenti file nella struttura `.claude/`:

#### .claude/docs/project-overview.md
- Contesto completo progetto (estratto da ProjectContext.md)
- User personas e use cases
- Differenziazione da competitor

#### .claude/docs/architecture.md
- Architettura dettagliata offline-first
- Layer separation (UI, Business Logic, Persistence, Sync)
- Pattern sincronizzazione e conflict resolution
- Schema database (Dexie.js e Firestore)
- Diagrammi architetturali (in formato Mermaid se possibile)

#### .claude/docs/development-guidelines.md
- Code style e formatting conventions
- Naming conventions
- Error handling patterns
- Logging standards
- Performance optimization guidelines

#### .claude/docs/testing-strategy.md
- Unit testing approach (Vitest)
- Integration testing approach
- E2E testing (Playwright)
- Concurrency testing specifics
- Coverage targets e CI/CD integration

#### .claude/docs/enforcement-rules.md
- Tutte le enforcement rules ESSENZIALI per qualità
- File size monitoring rules
- Modularity requirements
- Architecture dependency rules
- Security validation requirements

#### .claude/docs/universal-practices-ref.md
- Link a UniversalSoftwareDevelopmentBestPractices.md
- Breve sintesi principi SOLID, DRY, KISS, YAGNI
- Statement che Claude applichi autonomamente questi principi

#### .claude/workflows/development-plan.md
Deve contenere:
- **Fase 1: MVP Core (Settimane 1-4)**
  - Week 1: Setup + Auth + Database locale
  - Week 2-3: CRUD Liste + Articoli
  - Week 3-4: Testing + Deploy
- **Fase 2: Sincronizzazione (Settimane 5-7)**
  - Week 5-6: Sync layer + Conflict detection
  - Week 7: Condivisione e permessi
- **Fase 3: Features Avanzate (Settimane 8-12)**
  - Week 8: Autocompletamento
  - Week 9-10: Shopping mode
  - Week 11-12: Conflict resolution UI + Polish
- Per ogni task: descrizione, dependencies, criteri accettazione

#### .claude/workflows/project-map.md
Deve mappare:
```
/src
  /components        # React components (UI layer)
    /lists           # Liste components
    /items           # Articoli components
    /auth            # Authentication components
    /shared          # Componenti condivisi
  /hooks             # Custom React hooks
  /services          # Business logic layer
    /lists           # Liste services
    /items           # Articoli services
    /sync            # Sync service
    /auth            # Auth service
  /store             # State management (Zustand)
  /db                # Database layer (Dexie.js)
  /types             # TypeScript types/interfaces
  /utils             # Utility functions
  /api               # API client (Firebase)
  /constants         # Constants e enums
/tests
  /unit              # Unit tests
  /integration       # Integration tests
  /e2e               # E2E tests
```

### 2.4 Istruzioni Autonomia Claude

Nel CLAUDE.md principale, includi sezione esplicita:
```markdown
## Autonomia e Comportamento Proattivo di Claude

Claude DEVE operare autonomamente seguendo queste linee guida:

### Quando Leggere File Referenziati
Claude deve leggere autonomamente file di configurazione quando:
- L'utente chiede funzionalità correlate a una sezione specifica
- Sta per generare codice che richiede context dettagliato
- Deve validare decisioni architetturali
- Necessita chiarimenti su convenzioni o pattern

**Non chiedere permesso per leggere file referenziati** - fallo autonomamente quando necessario.

### Quando Aggiornare File di Configurazione
Claude deve proporre (e dopo approvazione, eseguire) aggiornamenti quando:
- Identifica pattern ricorrenti che dovrebbero diventare convenzioni
- Rileva drift tra configurazione e implementazione effettiva
- Scopre nuove best practices applicabili al progetto
- Implementa feature che richiedono nuove linee guida

### Monitoring e Refactoring Proattivo
Claude deve SEMPRE:
- ✅ Controllare LOC file prima di aggiungere codice
- ✅ Proporre split quando file approcciano 150 LOC
- ✅ Suggerire estrazione funzioni quando superano 20 LOC
- ✅ Identificare violazioni SRP e proporre refactoring
- ✅ Rilevare code smells e proporre correzioni
- ✅ Verificare coverage test e suggerire test mancanti

**Non aspettare che l'utente chieda queste verifiche** - sii proattivo.

### Applicazione Best Practices Universali
Claude deve applicare AUTOMATICAMENTE e SENZA PROMPTING:
- SOLID principles
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)
- YAGNI (You Aren't Gonna Need It)
- Separation of Concerns
- Clean Code principles

**Non è necessario citare questi principi** - applicali naturalmente nel codice generato.
```

### 2.5 Output Richiesto

Genera i seguenti artifact Markdown (.md) scaricabili:

1. **CLAUDE.md** - File configurazione principale
2. **.claude/docs/project-overview.md**
3. **.claude/docs/architecture.md**
4. **.claude/docs/development-guidelines.md**
5. **.claude/docs/testing-strategy.md**
6. **.claude/docs/enforcement-rules.md**
7. **.claude/docs/universal-practices-ref.md**
8. **.claude/workflows/development-plan.md**
9. **.claude/workflows/project-map.md**

Tutti i file devono essere in **lingua italiana**.

### 2.6 Verifica Output

Dopo aver generato tutti i file, verifica che:

#### Checklist Qualità
- [ ] File CLAUDE.md principale è 300-400 token
- [ ] Ogni file modulare è 100-200 token
- [ ] Token totali configurazione: 500-900 token
- [ ] Tutti i link relativi tra file sono corretti
- [ ] Nessuna ridondanza tra file
- [ ] Copertura completa requisiti SoftwareRequirements.md
- [ ] Include SOLO enforcement rules essenziali project-specific
- [ ] Riferimento esplicito a best practices universali
- [ ] Istruzioni chiare per autonomia Claude
- [ ] Piano sviluppo completo e dettagliato
- [ ] Project map navigabile e comprensibile

#### Checklist Completezza
- [ ] Architettura offline-first spiegata
- [ ] Pattern sincronizzazione documentati
- [ ] Gestione conflitti specificata
- [ ] Stack tecnologico elencato
- [ ] Convenzioni naming definite
- [ ] Security requirements inclusi
- [ ] Testing strategy completa
- [ ] Performance targets specificati
- [ ] Accessibility requirements (WCAG 2.1 AA)

**OUTPUT FINALE**: Conferma che tutte le checklist sono soddisfatte e fornisci summary token count per ogni file.

---

## VINCOLI E REQUISITI CRITICI

### Vincolo A: Ordine Esecuzione
✅ Task 1 DEVE completarsi prima di Task 2
✅ Verifica output di ogni task prima di procedere

### Vincolo B: Completezza
✅ Ogni singolo task DEVE essere completato
✅ Nessun task può essere saltato o parzialmente eseguito

### Vincolo C: Verifica Iterativa
✅ Dopo ogni task, verifica l'output
✅ Se verifica fallisce, rivedi prima di continuare
✅ Summary finale conferma completamento tutti task

### Vincolo D: No Assunzioni
✅ NON fare assunzioni non documentate
✅ Basa ogni decisione su documentazione fornita
✅ Usa SOLO informazioni certificate dai documenti

### Vincolo E: Lingua Italiana
✅ Tutti gli output DEVONO essere in italiano
✅ Commenti codice in italiano
✅ Documentazione in italiano

### Vincolo F: Rispetto Requisiti Software
✅ Configurazione DEVE garantire rispetto TUTTI i requisiti in SoftwareRequirements.md
✅ Architettura offline-first non negoziabile
✅ Gestione conflitti robusta obbligatoria
✅ Security by design obbligatorio

### Vincolo G: Modularizzazione Obbligatoria
✅ Configurazione DEVE essere modularizzata
✅ Seguire struttura file specificata in Task 2.3
✅ Link tra file devono essere funzionanti

### Vincolo H: Token Efficiency
✅ Target: 500-900 token totali
✅ Ogni sezione giustifica il suo costo
✅ Zero ridondanze

---

## DOMANDE DI CHIARIMENTO

Prima di procedere, hai domande o necessiti chiarimenti su:
- Requisiti del progetto?
- Struttura configurazione richiesta?
- Vincoli da rispettare?
- Output attesi?

Se tutto è chiaro, procedi con **Task 1: Analisi e Comprensione Documentazione**.

---

**NOTA FINALE**: Questo prompt è stato ottimizzato per massimizzare qualità codice e architettura minimizzando token usage, seguendo tutte le best practices documentate nei file di riferimento del progetto.