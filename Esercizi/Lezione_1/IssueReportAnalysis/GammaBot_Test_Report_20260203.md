# GammaBot – Report di Riepilogo Sessione di Test
**Tester:** Stefano Zaghi  
**Periodo di test:** 28 gennaio – 3 febbraio 2026  
**Documento redatto il:** 6 marzo 2026  
**Versione:** 1.0

---

## Indice
1. [Sezione Executive – Board Gamma S.p.A.](#1-sezione-executive--board-gamma-spa)
2. [Sezione Tecnica – Tech Lead Partner Esterno (TechMakers)](#2-sezione-tecnica--tech-lead-partner-esterno-techmakers)

---

---

# 1. Sezione Executive – Board Gamma S.p.A.

## 1.1 Contesto e Obiettivo

Nel corso della prima settimana di febbraio 2026 è stata condotta una sessione di test end-to-end sulla piattaforma **GammaBot**, sviluppata dal partner esterno TechMakers, basata su tecnologie di AI generativa. L'obiettivo della sessione era valutare la qualità complessiva della soluzione, l'affidabilità delle funzionalità implementate e l'usabilità generale della piattaforma, sia dal punto di vista dell'utente finale sia da quello dell'amministratore di sistema.

## 1.2 Sintesi dei Risultati

Sono stati redatti **116 item** complessivi nel corso della sessione di test, suddivisi come segue:

| Categoria | Quantità | Incidenza |
|---|---|---|
| **Bug** (anomalie funzionali) | 63 | 54% |
| **Improvement** (suggerimenti di miglioramento) | 40 | 34% |
| **Test case superati** *(esito OK)* | 13 | 12% |
| **Totale** | **116** | **100%** |

Dei 63 bug identificati, l'esito dei relativi test è stato il seguente:

| Esito | Quantità |
|---|---|
| **KO** (test fallito) | 60 |
| **OK / KO** (esito parziale) | 3 |
| **Totale bug rilevati** | **63** |

> ⚠️ **Nessun bug identificato ha prodotto un esito completamente positivo.** La totalità delle anomalie segnalate richiede un intervento correttivo da parte del team di sviluppo.

### Stato degli item
Quasi la totalità degli item risulta ancora **aperta** e in attesa di risoluzione:

| Stato | Quantità |
|---|---|
| Aperto | 103 |
| Chiuso *(test superati)* | 13 |

---

## 1.3 Distribuzione dei Bug per Priorità

La priorità di ciascun bug è stata assegnata dal tester in base all'impatto sull'operatività della piattaforma e alla gravità delle conseguenze per l'utente finale.

| Priorità | N° Bug | % sul totale bug |
|---|---|---|
| 🔴 **Alta** | 16 | 25% |
| 🟠 **Medio / Alta** | 10 | 16% |
| 🟡 **Media** | 12 | 19% |
| 🟢 **Bassa** | 25 | 40% |
| **Totale** | **63** | **100%** |

**Il 41% dei bug (26 su 63) è classificato ad alta o medio-alta priorità**, a indicare che una quota significativa delle anomalie impatta in modo rilevante l'operatività della piattaforma. La presenza di numerosi bug a priorità bassa non deve essere sottovalutata: molti di essi riguardano la coerenza dei dati visualizzati o la robustezza delle operazioni di configurazione del sistema.

---

## 1.4 Aree Funzionali Più Critiche

Le aree applicative maggiormente colpite da anomalie sono le seguenti:

| Area | N° Bug | Priorità prevalente |
|---|---|---|
| **Gestione Content Management** | 10 | Media / Medio-Alta |
| **Gestione Utenti** | 8 | Alta |
| **Richiesta Informazioni da Manuali SAP** | 8 | Alta |
| **Gestione Ruoli** | 6 | Alta / Medio-Alta |
| **Gestione Knowledge Base** | 5 | Medio-Alta |
| **Gestione API di Terze Parti** | 3 | Alta |
| **Best Practices** | 3 | Medio-Alta |
| **Gestione MCP Server** | 2 | Alta |

---

## 1.5 Valutazione d'Insieme

L'analisi complessiva dei risultati porta alle seguenti considerazioni:

**Aspetti positivi**
- Le funzionalità di **ricerca semantica** (su documenti SAP) hanno mostrato un comportamento sostanzialmente corretto nelle prove di base.
- Le funzionalità di **classificazione TARIC** hanno prodotto risultati potenzialmente corretti nella maggioranza dei casi testati.
- Il sistema di **autenticazione base** (login, OTP) funziona, pur con margini di miglioramento.

**Aspetti critici**
- **Il motore di ricerca AI sui manuali SAP presenta anomalie gravi e ricorrenti**, con errori di parsing JSON che compromettono in modo sistematico la risposta dell'assistente virtuale. Questa è la funzionalità core della piattaforma e la sua inaffidabilità rappresenta un rischio operativo significativo.
- **Il sistema di gestione di utenti e ruoli presenta difetti strutturali** che compromettono la corretta attribuzione dei permessi. Tali difetti impattano direttamente sulla sicurezza e sulla governance della piattaforma.
- **Numerose funzionalità amministrative risultano non funzionanti** (configurazione MCP Server, gestione collection Vector DB, duplicazione Knowledge Base, autenticazione corporate per API di terze parti).
- **L'ambiente di TEST punta al database di sviluppo (DEV)**, il che rende i dati dei test inaffidabili e potenzialmente contaminati con dati di sviluppo.

**Raccomandazione**
La piattaforma necessita di un significativo ciclo di correzione prima di poter essere considerata adatta a un utilizzo operativo in produzione. Si raccomanda di **concordare con il partner TechMakers un piano di risoluzione strutturato**, con priorità ai bug classificati ad alta priorità e ai difetti strutturali che impattano sicurezza, governance e funzionalità core.

---

---

# 2. Sezione Tecnica – Tech Lead Partner Esterno (TechMakers)

## 2.1 Contesto

Di seguito viene presentata l'analisi tecnica dei **10 issue prioritari** individuati nel corso della sessione di test, selezionati in base alla combinazione di priorità assegnata, impatto funzionale e ricorrenza. Per ciascun issue vengono forniti: l'ID di riferimento nel report originale, la descrizione tecnica del problema, le evidenze raccolte e le azioni correttive raccomandate.

---

## 2.2 Top 10 Issue Prioritari

---

### 🔴 Issue #1 – Errore ricorrente nel tool `doc_search` / `GET_SAP_INFO`: `"Unexpected end of JSON input"`
**ID Report:** 45, 46, 47, 48, 116 *(5 occorrenze, tutti ad alta priorità)*  
**Area:** Richiesta Informazioni da Manuali SAP  
**Priorità:** 🔴 Alta  
**Cod. Funzionalità:** `GET_SAP_INFO`

**Descrizione tecnica:**  
Durante i test sulla funzionalità di interrogazione dei manuali SAP, il tool `doc_search` ha sistematicamente restituito un errore `"Unexpected end of JSON input"` alla prima invocazione. Questo errore si verifica durante il parsing della risposta JSON restituita dal tool stesso, prima che l'assistente AI possa utilizzarne i risultati.  

L'assistente virtuale, in assenza di un risultato valido, tenta di ritentare l'invocazione del tool più volte. In alcuni casi i tentativi successivi hanno avuto esito positivo, ma nella maggioranza dei casi l'assistente ha raggiunto il limite massimo di iterazioni, restituendo il messaggio `"Raggiunto limite massimo iterazioni"` e fallendo nell'elaborare qualsiasi risposta valida.  

Nei casi in cui si è ottenuta una risposta, questa è risultata nella maggioranza delle prove **errata o inventata (hallucination)**, verosimilmente perché l'assistente AI ha sintetizzato la risposta senza potersi basare su contesto documentale affidabile.

**Evidenze:**
- `"Unexpected end of JSON input"` al primo utilizzo del tool in quasi tutti i test
- Messaggio `"Raggiunto limite massimo iterazioni"` in diversi casi
- Risposte finali errate o incomplete anche nei casi parzialmente riusciti

**Azioni raccomandate:**
1. Verificare l'endpoint che serve il tool `doc_search`: il problema di "Unexpected end of JSON input" suggerisce una risposta tronca o malformata (possibile timeout lato server, buffer overflow nella risposta, o risposta vuota/null in certi scenari).
2. Implementare una gestione degli errori robusta nel wrapper del tool, con retry logic esplicita e limite ragionevole di tentativi.
3. Aggiungere logging strutturato per correlare gli errori con la query in input e il contesto della sessione.
4. Verificare il comportamento dell'assistente in caso di tool failure: l'AI non deve restituire risposte inventate in assenza di contesto documentale; deve esplicitare il fallimento della ricerca.

---

### 🔴 Issue #2 – Difetto strutturale nel modello dati di Utenti, Ruoli e Knowledge Base
**ID Report:** 64, 65, 66, 60 *(correlati)*  
**Area:** Gestione Utenti / Gestione Ruoli  
**Priorità:** 🔴 Alta  
**Cod. Funzionalità:** `USER_ASSIGN_ROLE`, `USER_ASSIGN_SUPERADMIN_ROLE`

**Descrizione tecnica:**  
Il modello dati sottostante alla gestione delle associazioni tra utenti, ruoli e knowledge base presenta un difetto architetturale. L'associazione viene gestita con una tabella a due chiavi (`utente`, `ruolo`), mentre il modello di business richiede una tabella a tre chiavi (`utente`, `ruolo`, `knowledge_base`).

Le conseguenze concrete di questo difetto sono:
- Attribuendo a un utente un ruolo che è associato a livello di anagrafica a più knowledge base, l'utente ottiene accesso a **tutte** le knowledge base associate a quel ruolo, non solo a quella per cui il ruolo è stato assegnato.
- Assegnando lo stesso ruolo su più knowledge base, vengono creati **record duplicati** nella tabella di associazione.
- La visualizzazione dell'elenco utenti e dei dettagli del singolo utente mostra i ruoli duplicati, rendendo i dati non affidabili.
- Attribuendo il ruolo di `superadmin` per una singola knowledge base, l'utente diventa superadmin su **tutte** le knowledge base associate a quel ruolo.

**Azioni raccomandate:**
1. Ridisegnare la tabella delle associazioni utente-ruolo includendo `knowledge_base_id` come terza chiave primaria composta: `(user_id, role_id, knowledge_base_id)`.
2. Rivedere tutta la logica di autorizzazione (middleware/guard) in modo che i permessi siano valutati sempre nel contesto della specifica knowledge base attiva.
3. Migrare i dati esistenti allineandoli al nuovo schema.
4. Aggiornare le interfacce di gestione utenti e ruoli per mostrare sempre la knowledge base associata a ciascun ruolo.

---

### 🔴 Issue #3 – Lista tools MCP Server statica e non dinamica
**ID Report:** 92, 105 *(correlato)*  
**Area:** Gestione MCP Server / Gestione Knowledge Base  
**Priorità:** 🔴 Alta  
**Cod. Funzionalità:** `MCP_SERVER_TOOLS`

**Descrizione tecnica:**  
Nell'interfaccia di configurazione dei tool associati a un MCP Server, l'elenco dei tool disponibili non viene popolato dinamicamente in base all'MCP Server selezionato. L'elenco risulta fisso e identico per tutti gli MCP Server censiti a sistema, indipendentemente dai tool effettivamente esposti da ciascuno di essi. Lo stesso comportamento errato è stato riscontrato nell'analogo selettore presente all'interno della configurazione delle knowledge base.

**Nota:** Il test di connessione all'MCP Server restituisce correttamente la lista dinamica dei tool disponibili, a conferma che l'informazione è accessibile lato server.

**Azioni raccomandate:**
1. Implementare il popolamento dinamico dell'elenco tool a partire dalla risposta del test di connessione (o da una chiamata API dedicata) per l'MCP Server selezionato.
2. Allineare il comportamento dei selettori tool in tutte le sezioni dell'applicazione in cui compaiono (modulo MCP Server e modulo Knowledge Base).

---

### 🔴 Issue #4 – API Keys Corporate mai proposte all'utente
**ID Report:** 102  
**Area:** Gestione API di Terze Parti  
**Priorità:** 🔴 Alta  
**Cod. Funzionalità:** `THIRD_PARTY_API_CORPORATE_AUTH`

**Descrizione tecnica:**  
La modalità di autenticazione "Corporate" (credenziali aziendali condivise) per le API di terze parti risulta completamente non funzionante. Le API Key configurate con tale modalità non vengono mai proposte né visualizzate agli utenti che ne hanno necessità (ovvero, agli utenti che devono accedere a knowledge base che sfruttano MCP Server dipendenti da tali API). La funzionalità risulta di fatto inutilizzabile.

**Azioni raccomandate:**
1. Verificare la logica di lookup delle API Key in base alla modalità di autenticazione; le chiavi in modalità Corporate dovrebbero essere risolte automaticamente dal sistema senza necessità di configurazione utente.
2. Verificare che il tab "API Keys" nelle impostazioni utente proponga correttamente le chiavi Corporate associate agli MCP Server a cui l'utente ha accesso.
3. Scrivere un test di integrazione che copra l'intero flusso: configurazione Corporate → accesso utente → risoluzione automatica della chiave → utilizzo dell'MCP Server.

---

### 🔴 Issue #5 – Anteprima PDF bloccata da Content Security Policy
**ID Report:** 35  
**Area:** Ricerca semantica – Visualizzazione anteprima PDF  
**Priorità:** 🔴 Alta  
**Cod. Funzionalità:** `VECTOR_SEARCH_PDF_PREVIEW`

**Descrizione tecnica:**  
L'apertura in modalità anteprima dei documenti PDF restituiti da una ricerca (esatta o semantica) risulta bloccata dalla Content Security Policy del browser. L'errore rilevato nella console è il seguente:

```
Framing 'http://192.0.2.49:5000/' violates the following Content Security Policy directive:
"default-src 'self'". The request has been blocked.
Note that 'frame-src' was not explicitly set, so 'default-src' is used as a fallback.
```

Il problema è doppio: (1) viene utilizzato l'indirizzo IP del server (`192.0.2.49`) invece del domain name, e (2) la direttiva CSP `default-src 'self'` non include la direttiva `frame-src` necessaria per consentire l'embedding di iframe da origini autorizzate.

**Azioni raccomandate:**
1. Aggiungere la direttiva `frame-src` nella CSP, indicando esplicitamente le origini autorizzate per i documenti da visualizzare in anteprima.
2. Sostituire il riferimento a `http://192.0.2.49:5000/` con il corrispondente domain name (allineato al fix già segnalato nei bug #2 e #3 relativi all'uso dell'IP nel reset password).
3. Valutare se il servizio di preview PDF (`192.0.2.49:5000`) debba essere accessibile tramite proxy del backend principale, eliminando così la necessità di gestire origini cross-domain nel frontend.

---

### 🟠 Issue #6 – Permessi ruoli non applicati correttamente: accesso al back-end negato
**ID Report:** 71  
**Area:** Gestione Ruoli  
**Priorità:** 🔴 Alta  
**Cod. Funzionalità:** `ROLE_PERMISSIONS_FEATURES`

**Descrizione tecnica:**  
La modifica dei permessi associati a un ruolo (abilitazione di accesso in sola lettura al back-end, alla dashboard e ad altre interfacce) non produce alcun effetto. L'utente a cui viene attribuito tale ruolo non riesce ad accedere al back-end della piattaforma, indipendentemente dalla configurazione dei permessi. Questo difetto compromette completamente la funzionalità RBAC della piattaforma lato back-end.

**Azioni raccomandate:**
1. Verificare la logica di valutazione dei permessi lato server per le rotte del back-end; il problema potrebbe essere nel middleware di autorizzazione che non legge correttamente i permessi assegnati al ruolo, oppure nella mancata propagazione della modifica dei permessi alla sessione attiva.
2. Verificare se l'errore è correlato al difetto strutturale descritto nell'Issue #2 (associazione utente-ruolo-knowledge base).
3. Aggiungere test di autorizzazione automatizzati per tutti i ruoli e permessi configurabili.

---

### 🟠 Issue #7 – Modulo Best Practices non accessibile: errore 403 Forbidden
**ID Report:** 7, 8  
**Area:** Best Practices  
**Priorità:** 🟠 Medio / Alta  
**Cod. Funzionalità:** `BEST_PRACTICES_READ`, `STATISTICS_READ`

**Descrizione tecnica:**  
Il caricamento dei dati nel modulo Best Practices (tab "Best Practices" e tab "Statistiche") fallisce con un errore HTTP `403 Forbidden`. Le chiamate API falliscono con le seguenti risposte:

```
GET http://gammabot-server-01:3000/api/bestpractices?  →  403 Forbidden
{"error":"Permesso negato","required":"bestpractices.read"}

GET http://gammabot-server-01:3000/api/conversations/stats?days=30  →  403 Forbidden
{"error":"Permesso negato","required":"chat.admin"}
```

I permessi `bestpractices.read` e `chat.admin` non risultano assegnati all'utente di test, che tuttavia aveva accesso al modulo. Il frontend non gestisce l'errore e non mostra alcun messaggio all'utente. Il modulo risulta completamente inutilizzabile.

**Azioni raccomandate:**
1. Verificare la configurazione dei permessi predefiniti associati ai ruoli utente standard; assicurarsi che `bestpractices.read` sia incluso nel set di permessi base.
2. Implementare una gestione degli errori HTTP 403 nel frontend che mostri all'utente un messaggio chiaro e comprensibile.
3. Valutare se la sezione "Statistiche" debba essere accessibile agli utenti standard o se debba essere riservata ai soli amministratori; in ogni caso, nascondere l'interfaccia se non accessibile.

---

### 🟠 Issue #8 – Duplicazione Knowledge Base: errore 500 non gestito
**ID Report:** 104  
**Area:** Gestione Knowledge Base  
**Priorità:** 🟠 Medio / Alta  
**Cod. Funzionalità:** `KNOWLEDGE_BASE_DUPLICATION`

**Descrizione tecnica:**  
Il pulsante di duplicazione di una knowledge base esistente genera un errore interno non gestito:

```
api.js:75 API request error: Error: Errore clonazione Knowledge Base
```

L'operazione di clonazione fallisce lato server con un'eccezione non gestita che produce un generico messaggio di errore lato client. La funzionalità è completamente non funzionante.

**Azioni raccomandate:**
1. Analizzare il log server in corrispondenza della chiamata di clonazione per identificare la causa root dell'eccezione (possibile problema con la duplicazione di associazioni FK, configurazioni JSON, o relazioni con entità collegate).
2. Implementare una transazione atomica per l'operazione di clonazione, con rollback in caso di errore parziale.
3. Migliorare la gestione degli errori lato API per restituire messaggi diagnostici più utili.

---

### 🟠 Issue #9 – Accesso amministrativo allo storico chat: visibilità limitata alle sole conversazioni proprie
**ID Report:** 53  
**Area:** Navigazione / Storico Conversazioni  
**Priorità:** 🔴 Alta  
**Cod. Funzionalità:** `CHAT_HISTORY_ADMIN_ACCESS`

**Descrizione tecnica:**  
Un utente con ruolo `superadmin` che accede al modulo "Storico Chat" (accettando il tracciamento dell'accesso tramite il pulsante "Accetta e Prosegui") visualizza soltanto le proprie conversazioni, non quelle di tutti gli utenti come previsto dalla specifica. Il tracciamento dell'accesso è stato implementato proprio per garantire consapevolezza sull'accesso ai dati di altri utenti, ma la funzionalità di aggregazione dei dati non è implementata correttamente.

Correlato: a seguito di un logout e di un nuovo accesso, il sistema non richiede nuovamente il tracciamento, rendendo la funzione di audit inefficace (Issue #55).

**Azioni raccomandate:**
1. Correggere la query di recupero delle conversazioni nel modulo storico per gli utenti amministratori: deve restituire le conversazioni di tutti gli utenti (con filtri opzionali per knowledge base e utente).
2. Correggere la logica di tracciamento: il consenso all'accesso deve essere richiesto ad ogni nuova sessione, non mantenuto tra sessioni diverse.
3. Implementare la distinzione tra "storico personale" (senza tracciamento) e "storico globale" (con tracciamento) come descritto nell'Issue #54.

---

### 🟠 Issue #10 – Ambiente TEST punta al database DEV
**ID Report:** 56  
**Area:** Connessione Database / Infrastruttura  
**Priorità:** 🔴 Alta  
**Cod. Funzionalità:** `DATABASE_CONNECTION`

**Descrizione tecnica:**  
L'ambiente di TEST attualmente pubblicato sull'intranet Gamma punta al database `[GammaBot]`, che rappresenta l'ambiente di **sviluppo (DEV)**, invece di puntare al database `[GammaBot-TEST]` dedicato all'ambiente di test. Questo comporta che:
- Tutti i dati scritti durante i test confluiscono nell'ambiente di sviluppo, potenzialmente inquinando il lavoro degli sviluppatori.
- I test vengono condotti su dati non rappresentativi di uno scenario di test controllato.
- Non esiste una separazione effettiva tra gli ambienti DEV e TEST.

**Azioni raccomandate:**
1. Correggere immediatamente i connection string dell'ambiente TEST in modo che puntino al database `[GammaBot-TEST]`.
2. Implementare una gestione degli ambienti tramite variabili di configurazione (`.env` o secret manager) con profili distinti per DEV, TEST e PROD.
3. Verificare che la pipeline di deploy sia configurata per iniettare automaticamente la configurazione corretta in base all'ambiente target.

---

## 2.3 Riepilogo Issue Tecnici per il Piano di Risoluzione

| # | ID Report | Priorità | Area | Impatto principale |
|---|---|---|---|---|
| 1 | 45, 46, 47, 48, 116 | 🔴 Alta | AI Core – SAP Manuali | Funzionalità core non affidabile |
| 2 | 64, 65, 66, 60 | 🔴 Alta | Gestione Utenti/Ruoli | Sicurezza e governance compromesse |
| 3 | 92, 105 | 🔴 Alta | MCP Server | Configurazione tool non funzionante |
| 4 | 102 | 🔴 Alta | API Terze Parti | Autenticazione corporate inutilizzabile |
| 5 | 35 | 🔴 Alta | Ricerca – Preview PDF | Anteprima documenti bloccata |
| 6 | 71 | 🔴 Alta | Gestione Ruoli | RBAC back-end non funzionante |
| 7 | 7, 8 | 🟠 Medio/Alta | Best Practices | Modulo completamente inaccessibile |
| 8 | 104 | 🟠 Medio/Alta | Gestione KB | Duplicazione KB non funzionante |
| 9 | 53, 55 | 🔴 Alta | Storico Chat | Accesso admin ai dati non corretto |
| 10 | 56 | 🔴 Alta | Infrastruttura | Separazione ambienti assente |

---

## 2.4 Note Aggiuntive

Oltre ai 10 issue prioritari sopra descritti, si segnala l'esistenza di una serie di **improvement** che, pur non costituendo anomalie bloccanti, risultano strategicamente importanti per l'usabilità della piattaforma:

- **Gestione documenti obsoleti** (Issue #43 – Alta): è necessario implementare un meccanismo formale per marcare e isolare i documenti obsoleti dall'indice di ricerca semantica. Attualmente l'assistente AI tende a estrarre informazioni da documenti posizionati in cartelle con dicitura "old".
- **Visualizzazione numero di pagina nei risultati di ricerca** (Issue #33, #34 – Alta): i chunk estratti dalle ricerche semantiche ed esatte dovrebbero riportare anche il numero di pagina del documento sorgente, per consentire una verifica rapida da parte dell'utente.
- **Refresh automatico del token JWT** (Issue #27 – Media): implementare un meccanismo di refresh silenzioso del token di sessione per evitare interruzioni del flusso di lavoro dell'utente.
- **Rinominare "AI Models" in "AI Agents"** (Issue #75 – Media): la nomenclatura attuale è fuorviante; ciascun "AI Model" rappresenta in realtà un AI Agent con system prompt configurato, non un modello linguistico grezzo.
- **Nomenclatura URL con IP invece di domain name** (Issue #2, #3): sistematicamente, i link presenti nelle email di sistema (reset password, OTP) usano l'indirizzo IP del server (`http://192.0.2.47:3000/`) invece del domain name. Da risolvere a livello di configurazione del servizio di notifica.

---

*Report generato a partire dal file `GammaBot_Test_Zaghi_20260203.xlsx` – Sessione di test condotta da Stefano Zaghi, Gamma S.p.A.*
