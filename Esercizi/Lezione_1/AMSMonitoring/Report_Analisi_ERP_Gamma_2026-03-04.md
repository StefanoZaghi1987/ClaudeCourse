# Report di Analisi Infrastruttura ERP — Gamma S.p.A.

**Data report:** 4 marzo 2026  
**Fonte dati:** Alert Analysis — ENT_0300 (04/03/2026 ore 14:39)  
**Server analizzato:** `git-vpb-hana03` (IP: 10.0.76.10)  
**Elaborato da:** Analisi sistemistica senior

---

## Indice

1. [Riepilogo esecutivo](#1-riepilogo-esecutivo)
2. [Infrastruttura hardware e sistema operativo](#2-infrastruttura-hardware-e-sistema-operativo)
3. [SAP HANA — Database](#3-sap-hana--database)
   - 3.1 [Versione e stato del servizio](#31-versione-e-stato-del-servizio)
   - 3.2 [Utilizzo della memoria RAM](#32-utilizzo-della-memoria-ram)
   - 3.3 [Utilizzo del processore (CPU)](#33-utilizzo-del-processore-cpu)
   - 3.4 [Utilizzo dello spazio disco](#34-utilizzo-dello-spazio-disco)
4. [SAP Business One — Applicazione](#4-sap-business-one--applicazione)
   - 4.1 [Versione del sistema B1](#41-versione-del-sistema-b1)
   - 4.2 [Database aziendali (Companies)](#42-database-aziendali-companies)
   - 4.3 [Add-on installati](#43-add-on-installati)
5. [Riepilogo criticità e azioni consigliate](#5-riepilogo-criticità-e-azioni-consigliate)

---

## 1. Riepilogo esecutivo

L'analisi del report copre il periodo **dal 2 febbraio al 4 marzo 2026** e riguarda il server `git-vpb-hana03`, macchina virtuale VMware su cui è ospitata l'intera piattaforma ERP di Gamma S.p.A. (SAP Business One 10.00.240 su SAP HANA).

Sono stati individuati **tre punti di attenzione significativi** che richiedono verifica e/o intervento:

| Priorità | Area | Problema |
|---|---|---|
| 🔴 **Alta** | Disco | Filesystem HANA all'**80.82%** di utilizzo (~114 GB liberi su 597 GB) |
| 🟡 **Media** | HANA DB | Riavvio non pianificato (o non documentato) del database il **1° marzo 2026 alle 03:41** |
| 🟡 **Media** | HANA DB | Versione SAP HANA **obsoleta** (2.00.059 — SPS05, giugno 2023) |
| 🟡 **Media** | Add-on | Add-on **Beas Manufacturing lightweight** potenzialmente non aggiornato |
| 🟢 **Bassa** | CPU | CPU ben al di sotto dei limiti — nessuna criticità |

---

## 2. Infrastruttura hardware e sistema operativo

Il server analizzato è una **macchina virtuale VMware** (non un server fisico dedicato), ospitata su un hypervisor VMware.

> 💡 **Nota tecnica:** Un *hypervisor* è il software che permette di eseguire più macchine virtuali su un server fisico. VMware è uno dei prodotti leader in questo segmento.

### Caratteristiche hardware rilevate

| Parametro | Valore | Note |
|---|---|---|
| Tipo | Macchina virtuale | VMware, Inc. — Modello VMware7,1 |
| CPU | Intel Xeon Silver 4214 @ 2.20 GHz | 2 socket, 24 core totali |
| Hyperthreading | Disabilitato | ✅ Corretto per SAP HANA |
| Swap (memoria virtuale) | ~2,75 GB | ⚠️ Basso ma accettabile per HANA |
| Sistema Operativo | SUSE Linux Enterprise Server 15 SP5 | ✅ Certificato SAP HANA |
| Kernel Linux | 5.14.21-150500.55.62-default | ✅ Aggiornato |
| Fuso orario | CET (UTC+1) | ✅ Corretto |

### ⚠️ Punto di attenzione — Versione hardware virtuale VMware

La macchina virtuale utilizza il **modello di hardware virtuale VMware7,1**, che corrisponde a versioni molto datate dell'hypervisor ESXi (era attuale circa 10–15 anni fa). Le versioni attuali di VMware ESXi 7.x/8.x utilizzano versioni di hardware virtuale pari a 19–21.

- **Impatto pratico:** Le versioni di hardware virtuale più vecchie possono limitare alcune funzionalità avanzate di performance e sicurezza della VM.
- **Azione consigliata:** Verificare con il team di virtualizzazione la versione dell'hypervisor host e valutare un aggiornamento del *virtual hardware level* (operazione eseguibile a VM spenta, nell'ambito di una finestra di manutenzione).

---

## 3. SAP HANA — Database

### 3.1 Versione e stato del servizio

| Parametro | Valore |
|---|---|
| Host | `git-vpb-hana03` |
| SID (identificativo database) | `NDB` |
| Numero di sistema | `00` |
| Versione SAP HANA | **2.00.059.09** (SPS05, Revision 59) |
| Data compilazione build | 12 giugno 2023 |
| Ultimo avvio del servizio | **1° marzo 2026 ore 03:41:30** |

### ⚠️ Punto di attenzione — Versione SAP HANA obsoleta

La versione **SAP HANA 2.0 SPS05 (Rev. 59)**, risalente a giugno 2023, è significativamente **arretrata rispetto alle release correnti**. Al momento del report, SAP HANA 2.0 è disponibile in versione **SPS07**, con numerose revisioni di sicurezza, stabilità e performance rilasciate negli ultimi due anni.

- **Rischi:** Possibile esposizione a vulnerabilità di sicurezza già corrette nelle versioni successive; mancanza di fix a problemi di stabilità e performance già risolti da SAP.
- **Azione consigliata:** Pianificare un aggiornamento di SAP HANA a una versione SPS più recente (almeno SPS06 o SPS07), coordinandosi con il partner SAP in una finestra di manutenzione dedicata. Verificare la compatibilità con la versione di SAP Business One e dei relativi add-on prima di procedere.

---

### 3.2 Utilizzo della memoria RAM

> 💡 **Nota tecnica:** SAP HANA è un database *in-memory*, ovvero carica i propri dati direttamente nella RAM del server per garantire performance elevate. Il monitoraggio della memoria è quindi critico per la stabilità del sistema.

#### Trend memoria (ultimi 30 giorni)

Il sistema ha registrato un **riavvio il 1° marzo 2026 alle 03:41**, evento che ha generato un netto cambio nel profilo di utilizzo della memoria:

| Periodo | Memoria media utilizzata | Picco massimo registrato |
|---|---|---|
| **2 feb – 28 feb 2026** (pre-riavvio) | **65,03 GB** | **78,14 GB** (16 feb) |
| **1 mar – 4 mar 2026** (post-riavvio) | **48,39 GB** | 65,05 GB |

**Osservazioni:**
- Nel mese di febbraio, la memoria media si attestava stabilmente tra **62 e 67 GB**, con picchi fino a **78 GB**.
- Dopo il riavvio del 1° marzo, la memoria si è ridotta a una media di circa **48–51 GB**, con un calo di circa **17 GB** rispetto al valore pre-riavvio.
- Questo calo importante indica che prima del riavvio si era **accumulata in memoria una quantità significativa di dati/cache** che il riavvio ha liberato. Questo fenomeno è normale in SAP HANA, ma se si ripete periodicamente potrebbe segnalare una crescita non controllata di cache o query non ottimizzate.

### 🔴 Punto di attenzione URGENTE — Riavvio del database

Il database SAP HANA ha registrato un **riavvio il 1° marzo 2026 alle 03:41:30**, in un orario notturno inusuale.

- **Domanda chiave:** questo riavvio era **pianificato** (es. finestra di manutenzione) o è stato **inaspettato** (crash/errore del servizio)?
- Un riavvio non pianificato di HANA comporta un'interruzione completa del servizio ERP per tutti gli utenti connessi.
- **Azione consigliata:** Verificare nei **log di sistema di SAP HANA** (`nameserver.log`, `daemon.log`) e nei log del sistema operativo la causa del riavvio. Documentare l'evento e, se inaspettato, aprire un ticket con il partner SAP per analisi root cause.

---

### 3.3 Utilizzo del processore (CPU)

> 💡 **Nota tecnica:** Il carico CPU in SAP HANA si suddivide in: **SYSTEM** (attività del sistema operativo), **USER** (elaborazioni applicative), **IDLE** (CPU libera) e **WAITIO** (attesa di lettura/scrittura su disco — un valore alto qui indica un collo di bottiglia sul disco).

#### Utilizzo giornaliero (ultimi 30 giorni)

| Metrica | Valore medio |
|---|---|
| CPU SYSTEM | 0,6 – 0,7% |
| CPU USER | 3,4 – 7,5% |
| CPU IDLE | 91,9 – 96% |
| CPU WAITIO | **0%** ✅ |

#### Distribuzione oraria del carico (media su 30 giorni)

Il carico segue un **profilo tipico di utilizzo lavorativo**:

| Fascia oraria | CPU USER media | Stato |
|---|---|---|
| 00:00 – 07:00 (notte) | ~3,9 – 4,7% | 🟢 Basso |
| **08:00 – 11:00 (mattina lavorativa)** | **~7,1 – 8,0%** | ⬆️ Picco (normale) |
| 12:00 – 13:00 (pausa pranzo) | ~5,9 – 7,0% | Moderato |
| **13:00 – 16:00 (pomeriggio lavorativo)** | **~6,9 – 7,7%** | ⬆️ Picco (normale) |
| 17:00 – 23:00 (sera) | ~4,2 – 6,7% | Moderato/basso |

**Valutazione:** Il carico CPU è **assolutamente nella norma**. Il picco massimo registrato (ore 09:00, USER CPU all'8%) è ben al di sotto delle soglie di attenzione (generalmente >70%). Non si riscontrano problemi né colli di bottiglia sul fronte elaborativo. L'assenza completa di WAITIO conferma che il sottosistema disco non causa rallentamenti alle operazioni del database.

---

### 3.4 Utilizzo dello spazio disco

> 💡 **Nota tecnica:** SAP HANA utilizza diversi tipi di percorsi su disco: **DATA** (i dati del database), **LOG** (il registro delle transazioni, per garantire la consistenza in caso di crash), **DATA_BACKUP** e **LOG_BACKUP** (i backup), **TRACE** (i log diagnostici). In una configurazione ottimale, questi percorsi dovrebbero essere su volumi/dischi separati.

#### Stato attuale dei volumi HANA

Tutti i percorsi HANA sono mappati sullo **stesso filesystem** (`/dev/mapper/system-root`, montato su `/`, formato XFS):

| Tipo volume | Percorso | Capacità totale | Utilizzato | **% Utilizzo** |
|---|---|---|---|---|
| DATA | `/hana/data/NDB/` | 596,71 GB | 482,27 GB | **80,82%** |
| DATA_BACKUP | `/usr/sap/NDB/HDB00/backup/data/` | 596,71 GB | 482,27 GB | **80,82%** |
| LOG | `/hana/log/NDB/` | 596,71 GB | 482,27 GB | **80,82%** |
| LOG_BACKUP + CATALOG | `/usr/sap/NDB/HDB00/backup/log/` | 596,71 GB | 482,27 GB | **80,82%** |
| TRACE | `/usr/sap/NDB/HDB00/git-vpb-hana03/` | 596,71 GB | 482,27 GB | **80,82%** |

> ⚠️ **Nota:** Tutti i valori sono identici perché i percorsi condividono lo stesso volume logico. Lo spazio libero effettivo è **unico** per tutti i percorsi: circa **114 GB** (19,18% del totale).

### 🔴 CRITICITÀ PRINCIPALE — Disco all'80,82%

Questo è il **punto di maggiore urgenza** rilevato nel report.

**Situazione:**
- **Spazio totale:** 596,71 GB
- **Spazio utilizzato:** 482,27 GB
- **Spazio libero:** ~114,44 GB (**19,18%**)

**Rischi concreti:**
- **Tutti** i dati HANA, i log delle transazioni, i backup e i file di diagnostica condividono lo stesso spazio fisico. Se il disco si riempie completamente, **SAP HANA si arresta in modo anomalo** e non è possibile avviarlo finché lo spazio non viene liberato.
- I backup (DATA_BACKUP e LOG_BACKUP) consumano spazio sullo stesso volume dei dati operativi: man mano che crescono i backup, si riduce lo spazio per le operazioni correnti e viceversa.
- La crescita dei dati di produzione (es. nuove registrazioni, log di transazioni) ridurrà ulteriormente lo spazio disponibile.

**Azioni consigliate (in ordine di priorità):**
1. **Immediato:** Verificare la policy di retention dei backup (per quanto tempo vengono conservati i backup su questo volume). Eliminare i backup obsoleti secondo la policy aziendale.
2. **Breve termine:** Analizzare lo spazio occupato da ciascun percorso (DATA, LOG, BACKUP, TRACE) per identificare dove si concentra l'utilizzo.
3. **Medio termine:** Pianificare un'espansione del volume disco o spostare i backup su un volume dedicato/esterno (NAS, storage di backup). La separazione di backup e dati operativi è una **best practice SAP** fortemente raccomandata.
4. **Architetturale:** Valutare la separazione dei volumi HANA (DATA, LOG, BACKUP) su filesytem distinti, come raccomandato dalle linee guida SAP per ambienti di produzione.

---

## 4. SAP Business One — Applicazione

### 4.1 Versione del sistema B1

| Parametro | Valore | Note |
|---|---|---|
| Versione | **1000240** (10.00.240) | ✅ Corrisponde alla versione attesa |
| Fix Pack | **2402** | ✅ Corrisponde alla versione attesa |
| Patch Level | 14 | |
| App Date | 1° aprile 2024 | |
| Shared Folder | `\\git-vpb-hana03\B1_SHF` | |

La versione di SAP Business One è **aggiornata e in linea con le attese**.

---

### 4.2 Database aziendali (Companies)

Sono presenti **5 database aziendali** (companies), tutti in stato **Valido (V)** e con localizzazione Italia:

| Database | Descrizione | Memoria HANA | Disco | Tipo |
|---|---|---|---|---|
| `GAMMA_PROD` | **GAMMA S.P.A.** | **15,46 GB** | 15,07 GB | 🏭 **Produzione** |
| `241016_GAMMA_PROD_TEST5` | Z_TEST5 | 1,95 GB | 9,62 GB | 🧪 Test |
| `241016_GAMMA_PROD_DEV5` | Z_DEV5 | 1,65 GB | 9,51 GB | 🔧 Sviluppo |
| `TEST` | TEST | 0,73 GB | 8,11 GB | 🧪 Test |
| `TESTCONTABILE` | TESTCONTABILE | 0,31 GB | 0,37 GB | 🧪 Test |

**Osservazioni:**
- Il database di produzione `GAMMA_PROD` occupa circa **15,46 GB in memoria** e **15,07 GB su disco**: dimensioni nella norma per un'installazione SAP B1 HANA di medie dimensioni.
- Sono presenti **quattro ambienti non produttivi** (test/sviluppo), tutti con occupazione di memoria limitata. Tuttavia, contribuiscono al consumo complessivo di spazio disco (che sommato alla produzione supera i 40 GB solo per i database B1).
- **Azione consigliata:** Verificare se tutti gli ambienti di test/sviluppo sono ancora attivamente utilizzati. Quelli non necessari possono essere eliminati per recuperare spazio disco e ridurre il carico di memoria.

---

### 4.3 Add-on installati

#### Add-on Standard SAP (Normal)

Tutti gli add-on standard SAP sono aggiornati alla versione corrente del Fix Pack (1000.240.00.14):

| Add-on | Versione | Stato |
|---|---|---|
| EFM Format Definition | 1000.240.00.14 | ✅ |
| Outlook Integration | 1000.240.00.14 | ✅ |
| Payment (motore pagamenti) | 1000.240.00.14 | ✅ |

#### Add-on LightWeight (Extension Manager)

| Add-on | Vendor | Versione installata | Ultimo aggiornamento | Stato |
|---|---|---|---|---|
| **B1 Usability Package** | Boyum Solutions | **2024.05.00.1** | 7 giu 2024 | ✅ In linea con l'atteso |
| **Beas Manufacturing lightweight** | Boyum Solutions | **2023.11.00.5** | 8 giu 2024 | ⚠️ Vedi nota |
| Ring | Info-Bit s.r.l. | 4.01.01 | 28 giu 2024 | Da verificare |
| IFXOne | Polymatic | 100.100.093 | 28 giu 2024 | Da verificare |

### ⚠️ Punto di attenzione — Versione Beas Manufacturing lightweight

La componente **lightweight** di Beas Manufacturing risulta alla versione **2023.11.00.5**, aggiornata per l'ultima volta l'**8 giugno 2024**.

- La versione principale di Beas Manufacturing installata sul sistema è **2024H.04.00.08**, che è una release del 2024 significativamente più recente.
- Esiste una possibile **discrepanza di versione** tra il modulo principale Beas e la sua componente lightweight registrata in SAP B1.
- **Azione consigliata:** Verificare con Boyum IT Solutions o con il partner SAP se la versione del lightweight component è allineata a quella del modulo principale Beas 2024H.04.00.08, o se è necessario un aggiornamento. Un disallineamento di versione può causare malfunzionamenti nelle funzionalità integrate tra SAP B1 e Beas.

> 💡 **Nota su Ring e IFXOne:** Questi add-on di terze parti non figurano nella configurazione standard attesa. Si consiglia di verificare con gli utenti se sono ancora attivamente utilizzati e, in caso contrario, valutarne la rimozione.

---

## 5. Riepilogo criticità e azioni consigliate

### 🔴 Criticità prioritaria — Intervento urgente

| # | Problema | Impatto | Azione |
|---|---|---|---|
| 1 | **Disco HANA all'80,82%** (~114 GB liberi) | Arresto del sistema ERP in caso di esaurimento spazio | Pulizia backup obsoleti + pianificazione espansione disco o separazione volume backup |

### 🟡 Punti di attenzione — Intervento a breve termine

| # | Problema | Impatto | Azione |
|---|---|---|---|
| 2 | **Riavvio HANA il 1° marzo alle 03:41** (causa sconosciuta) | Possibile sintomo di instabilità | Analisi log HANA e OS; documentare l'evento |
| 3 | **SAP HANA versione 2.00.059 (SPS05)** — obsoleta | Vulnerabilità di sicurezza, bug non corretti | Pianificare aggiornamento a SPS06/SPS07 con il partner SAP |
| 4 | **Crescita memoria pre-riavvio** (avg 65 GB vs 48 GB post-riavvio) | Possibile accumulo progressivo di cache/sessioni | Monitorare trend memoria nelle prossime settimane; analizzare query ad alto consumo |
| 5 | **Beas lightweight v2023.11 vs Beas main v2024H** | Potenziale malfunzionamento funzionalità Beas | Verificare allineamento versioni con Boyum/partner SAP |

### 🔵 Osservazioni architetturali — Intervento a medio termine

| # | Problema | Azione consigliata |
|---|---|---|
| 6 | Tutti i volumi HANA su un unico filesystem | Separare i volumi DATA, LOG e BACKUP su filesystem/dischi distinti |
| 7 | Hardware virtuale VMware7,1 (obsoleto) | Aggiornare il virtual hardware level della VM durante la prossima finestra di manutenzione |
| 8 | Database test/sviluppo non verificati | Eliminare gli ambienti non più utilizzati per liberare risorse |

### 🟢 Elementi positivi — Nessun intervento necessario

- ✅ **CPU:** Carico ottimale, mai superiore all'8% durante le ore di picco
- ✅ **WAITIO:** Sempre a 0% — nessun collo di bottiglia sul disco per le operazioni database
- ✅ **SAP Business One:** Versione 10.00.240 SP2402 — aggiornata e in linea con le aspettative
- ✅ **B1 Usability Package:** Versione 2024.05 — aggiornata
- ✅ **Sistema operativo:** SUSE Linux 15 SP5 — certificato SAP HANA e aggiornato
- ✅ **Add-on standard SAP:** Tutti allineati alla versione corrente del Fix Pack

---

*Report generato sulla base del file Alert_Analysis-ENT_0300-2026-03-04_14-39.xlsx*  
*Analisi riferita al periodo: 2 febbraio 2026 – 4 marzo 2026*
