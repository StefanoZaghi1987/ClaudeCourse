# Prompt — Analisi Documentazione Beas Manufacturing 2024.04 e Generazione Report Tecnico

---

## CONTESTO

Sei un Senior Technical Documentation Analyst con oltre 20 anni di esperienza in ambienti ERP manifatturieri, specializzato in Beas Manufacturing (Boyum IT Solutions) e SAP Business One.

L'ambiente di produzione di riferimento è il seguente:

| Componente | Dettaglio |
|---|---|
| ERP principale | SAP Business One 10.0 per SAP HANA (10.00.240) SP 2402 (Security) HOTFIX1 (64-bit) |
| Database | SAP HANA |
| Add-on SAP B1 | B1 Usability Package (B1UP) 2024.05 |
| Modulo di produzione | Beas Manufacturing (Boyum IT Solutions) ver. 2024H.04.00.08 per HANA (64-bit), Runtime 21.0.0.1288 |
| Azienda | Gamma S.p.A. |

---

## OBIETTIVO

Esegui le attività elencate di seguito in sequenza rigorosa, rispettando ogni vincolo e requisito specificato.

L'obiettivo finale è produrre un **riepilogo tecnico dettagliato ed esaustivo** della documentazione ufficiale di Beas Manufacturing versione 2024.04, in lingua **inglese**, in formato **Markdown (`.md`)**, come artifact scaricabile.

---

## ORDINE DI ESECUZIONE — CRITICO

> ⚠️ **L'ordine di esecuzione delle attività è critico. Rispetta il relativo ordine sequenziale.**
> Non procedere all'attività successiva finché quella corrente non è completata e verificata.

---

## ATTIVITÀ

### ATTIVITÀ 1 — Accesso alla Documentazione

**1.1** Utilizza gli strumenti di ricerca web (`web_search`) e recupero URL (`web_fetch`) per accedere alla documentazione ufficiale di Beas Manufacturing versione 2024.04 al seguente indirizzo:

```
https://help.beascloud.com/beas202404/
```

**1.2** Recupera il contenuto completo di tutte le pagine disponibili nella documentazione. Se la documentazione è strutturata su più pagine o sezioni, naviga e recupera sistematicamente ogni sezione, sottosezione e pagina disponibile.

**1.3** Se una pagina non è accessibile (errore, paywall, protezione bot), registra l'URL non accessibile con la relativa motivazione e prosegui con il contenuto già recuperato. Notifica l'utente degli URL non accessibili.

**1.4** Aggrega tutto il contenuto recuperato in un unico corpus di lavoro prima di procedere all'attività successiva.

> ✅ **Verifica Attività 1:** Conferma che il corpus sia stato costruito correttamente indicando: (a) l'URL principale verificato come accessibile, (b) il numero di sezioni/pagine recuperate, (c) eventuali URL non accessibili. Non procedere finché questa verifica non è superata.

---

### ATTIVITÀ 2 — Valutazione Dimensionale del Corpus

**2.1** Stima la dimensione totale del corpus recuperato.

**2.2** Se il corpus rientra nella finestra di contesto disponibile, procedi silenziosamente all'Attività 3.

**2.3** Se il corpus supera la finestra di contesto, determina la strategia di chunking ottimale (analisi sequenziale a chunk con riepilogo contestuale progressivo). Notifica l'utente come segue:

> *"La documentazione è di grandi dimensioni e verrà elaborata in [N] sezioni per garantire una copertura completa. I risultati saranno consolidati in un unico report coerente. Non è richiesta alcuna azione da parte tua — procedo automaticamente."*

Esegui la strategia multi-chunk e consolida i risultati prima di procedere all'Attività 3.

> ✅ **Verifica Attività 2:** Conferma la strategia adottata (contesto singolo o chunking) prima di procedere.

---

### ATTIVITÀ 3 — Analisi Approfondita della Documentazione

Esegui un'analisi strutturale e semantica approfondita dell'intero corpus:

**3.1 Tipologia documentale:** identifica la tipologia di ogni sezione (manuale utente, guida di configurazione, guida all'installazione, reference tecnica, guida alle API, note di rilascio, ecc.).

**3.2 Mappatura strutturale:** mappa tutte le sezioni, sottosezioni, appendici, riferimenti, figure, tabelle e note presenti nella documentazione.

**3.3 Identificazione degli argomenti:** estrai tutti gli argomenti e i temi rilevanti presenti nella documentazione. Per ogni argomento, indica il livello di dettaglio tecnico presente nel sorgente.

**3.4 Estrazione terminologica:** identifica i termini chiave, il vocabolario di dominio, gli acronimi, le abbreviazioni, i codici modello, i codici parte e i riferimenti a standard.

**3.5 Segnalazione elementi critici:** individua eventuali avvisi di sicurezza, note di compliance normativa, requisiti tecnici specifici di versione e valori numerici che devono essere preservati esattamente.

**3.6 Focus versione:** l'analisi deve essere focalizzata **esclusivamente** sulla versione **Beas Manufacturing 2024.04**. Se nella documentazione sono presenti riferimenti a versioni precedenti o successive, escludili o segnalali esplicitamente come fuori scope.

> ✅ **Verifica Attività 3:** Fornisci un riepilogo strutturato dell'analisi prima di procedere, elencando: (a) le macro-aree tematiche identificate, (b) il numero approssimativo di argomenti estratti, (c) eventuali ambiguità o passaggi poco chiari rilevati. Non procedere finché questa verifica non è superata.

---

### ATTIVITÀ 4 — Preparazione Pre-Riepilogo

**4.1** Costruisci un database terminologico interno che mappa i termini del sorgente ai loro equivalenti in lingua inglese.

**4.2** Segnala eventuali termini ambigui, contraddittori o poco chiari.

**4.3** Prepara le espansioni di tutti gli acronimi in inglese.

**4.4** Identifica i termini riconosciuti a livello internazionale (codici ISO, numeri di parte, codici modello, nomi propri di funzionalità Beas) che devono essere mantenuti nella loro forma originale indipendentemente dalla lingua di output.

**4.5** Se sono state rilevate ambiguità nell'Attività 3, formula domande di chiarimento concise da sottoporre all'utente prima di procedere alla generazione del report.

> ✅ **Verifica Attività 4:** Conferma il completamento del database terminologico e segnala eventuali ambiguità irrisolte. Non procedere finché questa verifica non è superata.

---

### ATTIVITÀ 5 — Generazione del Report Tecnico

Genera il report tecnico completo seguendo la struttura obbligatoria indicata di seguito.

**Lingua di output:** Inglese  
**Formato di output:** Markdown (`.md`)

#### Linee guida di scrittura

- **Livello di dettaglio:** proporzionale alla rilevanza dell'argomento. Gli argomenti principali ricevono sezioni complete; gli argomenti minori possono essere raggruppati sotto un'intestazione più ampia.
- **Registro linguistico:** tecnico ma accessibile. Spiega i termini di dominio specifici al primo utilizzo.
- **Integrità fattuale:** ogni affermazione deve essere direttamente tracciabile al sorgente. Non inferire, assumere o inventare. Se qualcosa non è dichiarato nel sorgente, non includerlo.
- **Terminologia:** applica il database costruito nell'Attività 4. Preserva i termini riconosciuti a livello internazionale.
- **Acronimi:** espandi ogni acronimo al primo utilizzo. Formato: *Full Name (ACRONYM)* o *ACRONYM (Full Name)* a seconda della forma che appare per prima nel sorgente.
- **Approfondimento:** il report deve essere scritto in modo **dettagliato ed esaustivo**. Ogni aspetto rilevante deve avere una propria sezione dedicata. Non tralasciare dettagli tecnici importanti.
- **Assunzioni implicite:** non effettuare assunzioni implicite. Ogni affermazione deve basarsi sul contenuto del sorgente verificato.

#### Struttura obbligatoria del report

Il report deve contenere esattamente queste tre sezioni di primo livello, in questo ordine:

---

##### `## [INTRODUCTION]`

Un'introduzione concisa (da 1 a 3 paragrafi) che risponde alle seguenti domande:
- Di cosa tratta questa documentazione?
- Qual è il suo scopo principale?
- A chi è destinata?
- Quali domini tecnici copre?

---

##### `## [DISCUSSED TOPICS]`

Una sottosezione `###` per ogni argomento rilevante identificato nel sorgente. Ogni sottosezione:
- Ha un titolo chiaro e descrittivo
- Spiega in modo approfondito l'argomento così come presentato nel sorgente
- Include tutti i dettagli tecnici rilevanti, i valori, gli avvisi, i riferimenti a standard e le specifiche
- È ordinata logicamente (seguendo l'ordine del sorgente, oppure per rilevanza se il sorgente manca di struttura)

Ogni sottosezione deve essere **completa e autosufficiente**: un lettore tecnico deve poter comprendere l'argomento leggendo solo quella sottosezione.

---

##### `## [SUMMARY]`

Una sezione di sintesi finale (da 2 a 5 paragrafi, o un elenco strutturato di punti chiave) che:
- Rafforza i concetti e le informazioni più critiche
- Fornisce un riepilogo di alto livello per una comprensione rapida
- Evidenzia informazioni critiche, requisiti di compliance o raccomandazioni operative

---

> ✅ **Verifica Attività 5:** Prima di generare il file, esegui una revisione interna silenziosa verificando:
> 1. **Coerenza terminologica:** stesso termine utilizzato uniformemente in tutto il documento.
> 2. **Completezza delle sezioni:** tutte e tre le sezioni obbligatorie presenti e completamente popolate.
> 3. **Accuratezza tecnica:** tutti i valori numerici, le specifiche, i codici parte e i riferimenti a standard corrispondono esattamente al sorgente.
> 4. **Politica sugli acronimi:** ogni acronimo espanso al primo utilizzo.
> 5. **Qualità linguistica:** correttezza grammaticale, fluidità, registro appropriato.
>
> Applica le correzioni silenziosamente. Non riportare il processo di verifica all'utente.

---

### ATTIVITÀ 6 — Generazione del File di Output

**6.1** Genera il report tecnico completo come file Markdown (`.md`) con la seguente convenzione di denominazione:

```
summary_beas_manufacturing_2024_04_EN.md
```

**6.2** Presenta il file all'utente come artifact scaricabile.

**6.3** Aggiungi una breve nota conclusiva (massimo 2-3 frasi) che riepiloga: cosa è stato generato, la fonte, la lingua di output e il formato.

> ✅ **Verifica Attività 6:** Conferma che il file sia stato generato correttamente e che sia accessibile come artifact scaricabile.

---

## RIEPILOGO FINALE

Al termine di tutte le attività, fornisci un riepilogo finale che confermi:

- ✅ Attività 1 — Accesso alla documentazione: completata
- ✅ Attività 2 — Valutazione dimensionale: completata
- ✅ Attività 3 — Analisi approfondita: completata
- ✅ Attività 4 — Preparazione pre-riepilogo: completata
- ✅ Attività 5 — Generazione del report: completata
- ✅ Attività 6 — Generazione del file di output: completata

---

## VINCOLI GLOBALI

| # | Vincolo | Descrizione |
|---|---|---|
| V1 | Ordine sequenziale | Le attività devono essere eseguite nell'ordine indicato. Non saltare né invertire attività. |
| V2 | Nessuna attività ignorata | Ogni singola attività deve essere eseguita e completata. |
| V3 | Verifica prima di procedere | Dopo ogni attività, verificare l'output prima di passare alla successiva. |
| V4 | Focus sulla versione | L'analisi è focalizzata **esclusivamente** su Beas Manufacturing 2024.04. |
| V5 | Nessuna assunzione implicita | Ogni affermazione deve basarsi sul contenuto del sorgente verificato. Non inferire. |
| V6 | Fonte certificata | Utilizzare esclusivamente la documentazione ufficiale all'URL indicato. |
| V7 | Lingua di output | Il report tecnico deve essere scritto in **inglese**. |
| V8 | Formato di output | Il file di output deve essere in formato **Markdown (`.md`)**. |
| V9 | Approfondimento | Il report deve essere dettagliato ed esaustivo. Ogni aspetto rilevante ha una sezione dedicata. |
| V10 | Richiesta di chiarimenti | Se requisiti o dettagli non sono chiari, sottoponi domande di chiarimento prima di procedere. |

---

## URL DI RIFERIMENTO

```
https://help.beascloud.com/beas202404/
```

---

*Prompt generato per uso interno — Gamma S.p.A.*  
*Versione prompt: 1.0*
