# Contesto — Analisi Issue Report GammaBot
*Documento di continuità per nuova conversazione*  
*Generato il: 6 marzo 2026*

---

## Chi sono

Mi chiamo **Stefano Zaghi**, Senior Software Engineer presso **Gamma S.p.A.**  
Email: `stefano.zaghi@gamma-spa.com`

---

## Cos'è GammaBot

**GammaBot** è una piattaforma AI conversazionale sviluppata internamente da Gamma S.p.A. Si tratta di un assistente virtuale enterprise che integra funzionalità di:

- **Ricerca semantica** su documentazione aziendale (manuali SAP, documenti Word/PDF)
- **Classificazione TARIC** automatica tramite AI, con integrazione SAP Business One
- **Interrogazione di manuali SAP** tramite knowledge base vettoriali
- **Gestione MCP Server** (Model Context Protocol) per esporre tool all'AI
- **Gestione API di Terze Parti** (es. SAP Business One Service Layer)
- **Sistema di best practices** condivise tra utenti
- **Storico conversazioni** con statistiche e token counting
- **Back-office amministrativo** con gestione utenti, ruoli, permessi (RBAC), modelli AI, database vettoriali e content management documentale

L'architettura prevede un **frontend web** (HTML/JS), un **backend API REST** (esposto su `http://git-vtf-gb01:3000/`), e un **server di documenti** separato (esposto su `http://10.0.4.49:5000/`). Il sistema supporta modelli AI multipli, tra cui **Claude 3 Opus** (Anthropic) e modelli locali.

---

## La sessione di test

Il file analizzato (`GammaBot_Test_Zaghi_20260203.xlsx`) contiene il risultato di una **sessione di test esplorativo/funzionale** condotta da Stefano Zaghi tra il **28 gennaio** e il **3 febbraio 2026**, con picco di attività il 2 febbraio (46 test su 116 totali).

I test sono stati organizzati in un foglio Excel con le seguenti colonne:

| Colonna | Descrizione |
|---|---|
| `ID Test` | Identificativo progressivo (1–116) |
| `Tipo` | `Bug` / `Improvement` / (vuoto per test funzionali puri) |
| `Priorità` | `Alta` / `Medio / alta` / `Media` / `Bassa` |
| `Esito` | `OK` / `KO` / `OK / KO` / (vuoto per Improvement) |
| `Knowledge base` | KB di riferimento (`SAP - Manuali`, `Assegnazione codici TARIC`, o vuota) |
| `Area` | Macro-area funzionale |
| `Cod. funzionalità` | Codice tecnico della funzionalità testata |
| `Funzionalità` | Descrizione della funzionalità |
| `Test svolto` | Descrizione dettagliata dello scenario di test eseguito |
| `Risultato atteso` | Comportamento atteso |
| `Descrizione segnalazione` | Comportamento effettivo osservato / difetto riscontrato |
| `Stato` | `Aperto` / `Chiuso` |
| `Data` | Data di registrazione |
| `UserName` | Email tester |
| `Utente` | Nome tester |

---

## Struttura funzionale della piattaforma (aree testate)

Le 28 aree funzionali coperte dai test rispecchiano la struttura della piattaforma:

**Funzionalità AI core** (più mature):
- Richiesta codici TARIC (`GET_TARIC_BY_DESCR`)
- Ricerca semantica
- Ricerca esatta
- Richiesta informazioni da manuali SAP

**Back-office amministrativo** (più critico):
- Autenticazione (OTP, reset password, JWT)
- Gestione utenti
- Gestione ruoli e permessi (RBAC)
- Gestione knowledge base
- Gestione database vettoriali
- Gestione modelli AI
- Gestione MCP Server
- Gestione tools (per MCP)
- Gestione API di Terze Parti
- Gestione content management documentali (entrypoints, content source)

**Navigazione e UX**:
- Navigazione tra moduli
- Storico conversazioni
- Best practices
- Dashboard
- Brand/personalizzazione

---

## Stato attuale del progetto (al momento dei test)

- Il sistema è in una **fase di sviluppo attiva**, non ancora pronto per produzione
- Le **funzionalità AI core funzionano** (TARIC: 5/6 OK; ricerca semantica: 5/7 OK)
- Il **back-office è largamente non funzionante**: 63 bug aperti, di cui 28 ad alta/medio-alta priorità
- Il **sistema RBAC è sostanzialmente non operativo**: la modifica dei permessi non produce effetti, i ruoli non vengono attribuiti correttamente
- Il **tool `doc_search`** (ricerca semantica sui manuali SAP) ha un comportamento instabile alla prima invocazione
- Le **comunicazioni email** (OTP, reset password) usano l'IP del server anziché il domain name
- **Claude 3 Opus** non funziona correttamente con la configurazione attuale
- La gestione degli errori è carente: errori 403, eccezioni API e parsing JSON falliscono silenziosamente senza feedback all'utente

---

## Nomenclatura tecnica rilevante

- **Knowledge base**: unità logica che aggrega documenti, vector DB, modelli AI e MCP Server
- **Content source documentale**: sorgente di documenti con entrypoints configurabili
- **Entrypoint**: punto di accesso specifico all'interno di un content source
- **Vector DB**: database vettoriale per la ricerca semantica (es. per manuali SAP)
- **MCP Server**: server che espone tool all'AI tramite Model Context Protocol
- **Tool**: funzione invocabile dall'AI tramite MCP (es. `doc_search`, classificatore TARIC)
- **TARIC**: sistema di classificazione doganale europeo — GammaBot lo attribuisce automaticamente agli articoli SAP
- **SAP Business One**: ERP in uso in azienda, integrato tramite Service Layer API

---

## File di riferimento

| File | Descrizione |
|---|---|
| `GammaBot_Test_Zaghi_20260203.xlsx` | Issue report originale (Excel, 116 righe, 15 colonne) |
| `GammaBot_Report_Zaghi_20260203.md` | Report di analisi strutturato generato dalla conversazione precedente |

---

*Questo documento è stato generato per garantire la continuità dell'analisi in una nuova sessione di conversazione.*
