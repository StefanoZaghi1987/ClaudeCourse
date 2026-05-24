# Prompt: Analisi e Selezione dello Stack Tecnologico per ShoppingList MVP

---

## 🎯 Contesto e Ruolo

Sei un **Senior Business Analyst e Full-Stack Software Engineer** con oltre 20 anni di esperienza in qualsiasi tipo di framework e tecnologia. Hai una profonda conoscenza delle architetture software moderne, delle best practice di sviluppo e dei criteri di valutazione tecnica per soluzioni MVP.

Il tuo obiettivo è supportare la valutazione e la selezione del miglior stack tecnologico per lo sviluppo di un MVP della soluzione **ShoppingList**: un'applicazione web offline-first per la gestione collaborativa di liste della spesa.

---

## ⚠️ Istruzioni Generali Critiche

Prima di iniziare, leggi attentamente e rispetta tutte le seguenti istruzioni:

### A. Ordine di Esecuzione Critico
L'ordine di esecuzione delle attività è **critico e vincolante**. Rispetta rigorosamente l'ordine sequenziale definito. Non passare mai all'attività successiva prima di aver completato e verificato quella corrente.

### B. Nessuna Attività Ignorata
Devi **eseguire e completare ogni singola attività** elencata. Non saltare, abbreviare o condensare alcuna attività. Ogni attività ha uguale importanza.

### C. Verifica dell'Output
Dopo aver completato ciascuna attività:
- **Verifica l'output** prima di passare a quella successiva
- Se la verifica fallisce, **rivedi e correggi** l'attività corrente prima di continuare
- Non procedere se l'output è incompleto, incoerente o non rispetta i requisiti
- Al termine, fornisci un **riepilogo finale** che confermi il completamento corretto di tutte le attività

### D. Richiedi Chiarimenti
Se alcuni requisiti o dettagli non risultano chiari, **sottoponi domande specifiche** con le relative richieste di chiarimento prima di procedere. Non procedere su basi ambigue.

### E. Nessuna Assunzione Implicita
- **Non fare assunzioni implicite**: verifica ogni affermazione utilizzando fonti certificate o affidabili
- Tutte le analisi devono basarsi sull'esame di fonti di informazione certificate (documentazione ufficiale, benchmark pubblicati, case study verificabili)
- Indica esplicitamente la fonte di ogni affermazione tecnica rilevante

### F. Profondità e Copertura Tecnica
- L'analisi deve coprire **ogni aspetto rilevante** in modo dettagliato ed esaustivo
- Introduce una sezione specifica per ogni dominio funzionale e tecnico trattato
- Includi **diagrammi architetturali e diagrammi di flusso** in formato Mermaid o ASCII dove utile per chiarire architetture e flussi

### G. Formato di Output
- Il report finale deve essere scritto in **lingua italiana**
- Il formato di output è **Markdown (.md)**
- Il report deve essere generato come **artifact scaricabile**
- Usa intestazioni gerarchiche (`#`, `##`, `###`), tabelle comparative, elenchi strutturati e blocchi di codice dove appropriato

---

## 🛠️ Vincoli e Parametri di Selezione

Tieni conto dei seguenti vincoli per tutta l'analisi:

| Parametro | Valore |
|-----------|--------|
| **Costo stack** | Totalmente free (open source o free tier) |
| **Fase di sviluppo** | MVP / Prototipo |
| **Evoluzione futura** | Il MVP deve poter essere esteso o riprogettato per produzione |
| **Profilo sviluppatore** | Non esperto o specializzato in sviluppo software |
| **Metodologia** | Spec-Driven Development con Claude Code |
| **Strumenti disponibili** | Visual Studio Code, Claude Desktop + Claude Code |
| **Complessità target** | Minima: preferire soluzioni semplici come HTML5 + TypeScript o analoghe |
| **Best practice** | Seguire le moderne best practice sin dall'MVP |

---

## 📋 Attività da Eseguire in Sequenza

---

### ▶️ ATTIVITÀ 1 — Analisi e Comprensione della Documentazione di Progetto

#### 1.1 Lettura Integrale della Documentazione
Leggi e comprendi **tutta la documentazione di progetto** fornita in questa conversazione (file `ProjectContext.md` e le istruzioni di progetto Claude).

Per ciascun documento letto, produci un breve riepilogo strutturato che includa:
- Obiettivo del documento
- Principali argomenti trattati
- Aspetti critici rilevanti per la selezione dello stack tecnologico

#### 1.2 Verifica della Comprensione
Prima di procedere all'Attività 2, verifica di aver compreso correttamente:
- I **principi fondamentali** del progetto (Offline-First, sincronizzazione, condivisione, performance)
- Le **funzionalità Core e Advanced** richieste
- I **requisiti non funzionali** (performance, affidabilità, usabilità, compatibilità, sicurezza)
- Le **fasi di sviluppo** previste (MVP → V1.0 → Produzione)
- I **vincoli tecnologici** indicati nelle istruzioni

**✅ Verifica superata se:** riesci a sintetizzare in modo coerente l'intero progetto in un paragrafo di massimo 10 righe, senza omettere elementi critici.

---

### ▶️ ATTIVITÀ 2 — Valutazione degli Stack Tecnologici per l'MVP

#### 2.1 Identificazione dei 6 Migliori Stack Tecnologici

Sulla base della documentazione analizzata e dei vincoli definiti, identifica e proponi i **6 migliori stack tecnologici** per lo sviluppo dell'MVP di ShoppingList.

Per ciascuno stack, fornisci:

**a) Composizione dello Stack**
Elenca ogni tecnologia componente lo stack, specificando per ciascuna:
- Nome e versione raccomandata
- Ruolo nell'architettura (frontend, backend, database, sync, etc.)
- Sito ufficiale o repository di riferimento

**b) Architettura di Riferimento**
Descrivi l'architettura applicativa prevista con questo stack, includendo:
- Struttura dei layer (UI, Business Logic, Persistence, Sync)
- Diagramma architetturale (Mermaid o ASCII)
- Flusso dati principale (online e offline)

**c) Aderenza ai Requisiti del Progetto**
Valuta come lo stack risponde ai requisiti critici di ShoppingList:
- Offline-First (database locale, service worker, PWA)
- Sincronizzazione e gestione conflitti
- Sistema permessi e condivisione
- Performance (< 100ms risposta UI, < 3s caricamento)
- Accessibilità (WCAG 2.1 AA)

**d) Curva di Apprendimento e Adozione**
- Stima del tempo di apprendimento per uno sviluppatore non esperto
- Disponibilità di documentazione, tutorial e community
- Compatibilità con la metodologia Spec-Driven Development via Claude Code

**e) Livello di Complessità**
Assegna un punteggio da 1 (semplicissimo) a 10 (molto complesso) per:
- Setup iniziale e configurazione
- Sviluppo feature Core MVP
- Gestione offline e sync
- Debug e manutenzione
- Deployment

**f) Scalabilità verso Produzione**
- Quanto facilmente il MVP può essere esteso a soluzione production-ready
- Eventuali refactoring o migrazioni necessari nella fase successiva

**g) Tooling e Compatibilità**
- Integrazione con Visual Studio Code
- Compatibilità con Claude Code e metodologia spec-driven
- Estensioni e plugin raccomandati

#### 2.2 Confronto Dettagliato tra gli Stack

Costruisci un **confronto comparativo strutturato** tra i 6 stack identificati, organizzato nelle seguenti dimensioni:

**Tabella Comparativa Sintetica**

| Criterio | Stack 1 | Stack 2 | Stack 3 | Stack 4 | Stack 5 | Stack 6 |
|----------|---------|---------|---------|---------|---------|---------|
| Complessità Setup (1-10) | | | | | | |
| Offline-First Support | | | | | | |
| Sync & Conflict Mgmt | | | | | | |
| Curva Apprendimento | | | | | | |
| Velocità Sviluppo MVP | | | | | | |
| Scalabilità Produzione | | | | | | |
| Compatibilità Claude Code | | | | | | |
| Community & Docs | | | | | | |
| Maturità Tecnologia | | | | | | |
| Costo (free?) | | | | | | |

**Analisi Pro/Contro per Ciascuno Stack**

Per ciascuno dei 6 stack:
- **PRO**: almeno 5 vantaggi specifici e motivati nel contesto ShoppingList
- **CONTRO**: almeno 5 svantaggi specifici e motivati nel contesto ShoppingList
- **Rischi principali**: rischi tecnici o di progetto specifici per questo stack
- **Prerequisiti**: conoscenze minime richieste allo sviluppatore

**Analisi delle Dipendenze Critiche**

Per ogni stack, identifica:
- Dipendenze critiche senza le quali lo stack non funziona
- Librerie o moduli essenziali per le funzionalità Core di ShoppingList
- Potenziali problemi di compatibilità o deprecazione

**✅ Verifica superata se:** il confronto è completo per tutti e 6 gli stack, ogni cella della tabella è valorizzata, e i pro/contro sono specifici al contesto ShoppingList (non generici).

---

### ▶️ ATTIVITÀ 3 — Report Finale con Raccomandazioni

Genera un **report dettagliato, esaustivo e professionale** in lingua italiana, in formato Markdown (`.md`), con i risultati dell'intera analisi.

Il report deve essere strutturato con le seguenti sezioni obbligatorie:

---

#### 📄 Struttura del Report

```
# Report: Analisi e Selezione Stack Tecnologico — ShoppingList MVP

## 1. Executive Summary
## 2. Contesto di Progetto
## 3. Metodologia di Analisi
## 4. Vincoli e Criteri di Valutazione
## 5. Stack Tecnologici Analizzati
   ### 5.1 Stack 1 — [Nome]
   ### 5.2 Stack 2 — [Nome]
   ### 5.3 Stack 3 — [Nome]
   ### 5.4 Stack 4 — [Nome]
   ### 5.5 Stack 5 — [Nome]
   ### 5.6 Stack 6 — [Nome]
## 6. Confronto Comparativo
## 7. Matrice di Selezione
## 8. Raccomandazione Finale
## 9. Stack Raccomandato — Dettaglio Tecnico
## 10. Piano di Avvio Sviluppo MVP
## 11. Rischi e Mitigazioni
## 12. Considerazioni per l'Evoluzione a Produzione
## 13. Conclusioni
## 14. Riferimenti e Fonti
```

---

#### Dettaglio delle Sezioni

**Sezione 1 — Executive Summary**
Sintesi di massimo 2 pagine destinata a un lettore non tecnico. Includi: obiettivo dell'analisi, numero di stack valutati, stack raccomandato e motivazione principale.

**Sezione 2 — Contesto di Progetto**
Descrizione del progetto ShoppingList, suoi obiettivi, principi fondamentali, funzionalità Core MVP richieste e profilo del team di sviluppo.

**Sezione 3 — Metodologia di Analisi**
Descrivi come hai condotto l'analisi, le fonti consultate e i criteri adottati per la valutazione.

**Sezione 4 — Vincoli e Criteri di Valutazione**
Elenca e spiega tutti i vincoli e i criteri utilizzati per la valutazione degli stack (vedi parametri indicati in questo prompt).

**Sezione 5 — Stack Tecnologici Analizzati**
Per ciascuno dei 6 stack: composizione, architettura (con diagramma), aderenza ai requisiti, pro, contro, livello di complessità, scalabilità.

**Sezione 6 — Confronto Comparativo**
Tabella comparativa completa + analisi narrativa delle differenze principali tra gli stack.

**Sezione 7 — Matrice di Selezione**
Matrice di scoring ponderata con pesi assegnati a ciascun criterio in base alla priorità per ShoppingList MVP. Formula il punteggio finale per ciascuno stack.

**Sezione 8 — Raccomandazione Finale**
Indica chiaramente lo stack raccomandato, motivando la scelta con riferimenti ai criteri e ai risultati della matrice. Indica anche la seconda scelta e quando potrebbe essere preferibile.

**Sezione 9 — Stack Raccomandato: Dettaglio Tecnico**
Approfondimento completo dello stack raccomandato:
- Versioni specifiche raccomandate di ogni componente
- Architettura dettagliata con diagramma
- Struttura cartelle/progetto consigliata
- Librerie e dipendenze chiave
- Configurazione iniziale raccomandata
- Flusso di sviluppo con Claude Code e Spec-Driven Development
- Risorse di apprendimento consigliate (tutorial, documentazione, corsi gratuiti)

**Sezione 10 — Piano di Avvio Sviluppo MVP**
Step-by-step guide per iniziare lo sviluppo:
- Setup ambiente di sviluppo (VS Code + Claude Code)
- Inizializzazione progetto
- Struttura iniziale del codice
- Ordine di sviluppo delle funzionalità Core MVP
- Milestone di sviluppo suggerite

**Sezione 11 — Rischi e Mitigazioni**
Tabella dei principali rischi tecnici e di progetto per lo stack raccomandato, con strategia di mitigazione per ciascuno.

**Sezione 12 — Considerazioni per l'Evoluzione a Produzione**
Come e quando estendere o riprogettare il MVP per arrivare a una soluzione production-ready. Identificare i punti di attenzione e le eventuali migrazioni necessarie.

**Sezione 13 — Conclusioni**
Sintesi finale, considerazioni strategiche e prossimi passi raccomandati.

**Sezione 14 — Riferimenti e Fonti**
Elenco completo di tutte le fonti citate, con link alle documentazioni ufficiali.

---

**✅ Verifica superata se:** il report contiene tutte le 14 sezioni, ogni sezione è completa e coerente con le altre, la raccomandazione finale è supportata da dati e analisi, e il documento è leggibile e professionale.

---

## ✅ Riepilogo Finale Obbligatorio

Al termine di tutte le attività, fornisci un **riepilogo finale** strutturato come segue:

```
## ✅ Riepilogo Completamento Attività

| Attività | Stato | Note |
|----------|-------|------|
| 1.1 Lettura documentazione | ✅ Completata | ... |
| 1.2 Verifica comprensione | ✅ Superata | ... |
| 2.1 Identificazione 6 stack | ✅ Completata | ... |
| 2.2 Confronto dettagliato | ✅ Completata | ... |
| 3. Report finale generato | ✅ Completata | ... |

**Tutte le attività sono state completate correttamente.**
**Stack raccomandato:** [Nome Stack]
**Seconda scelta:** [Nome Stack]
```

---

*Prompt versione 1.0 — Progetto ShoppingList MVP — Stack Tecnologico*
