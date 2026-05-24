# Guida: Connessione di Claude Desktop a MCP Server Remoti
## Progetto GammaBot — Configurazione e Troubleshooting

> **Versione:** 1.0  
> **Applicazione target:** Claude Desktop (Windows)  
> **Ultimo aggiornamento:** Aprile 2026

---

## Panoramica

Questa guida descrive i passaggi necessari per connettere **Claude Desktop** a due MCP Server remoti del progetto GammaBot:

| Nome Server | Endpoint |
|---|---|
| `gammabot-test-taric` | `http://GIT-VTA-MCP01.gamma-spa.com/mcp/` |
| `gammabot-test-manualisapb1` | `http://GIT-VTA-MCP02.gamma-spa.com/doc_indexer_mcp/sap_manuali/` |

La connessione avviene tramite il pacchetto **`mcp-remote`**, un bridge che consente a Claude Desktop di comunicare con server MCP esposti su HTTP/HTTPS remoti.

---

## Prerequisiti

Prima di procedere, assicurarsi di avere:

- ✅ **Claude Desktop** installato (versione recente)
- ✅ **Accesso alla rete aziendale** (i server sono su indirizzi interni `gamma-spa.com`)
- ✅ Permessi di scrittura sulla cartella di configurazione di Claude Desktop

---

## Passo 1 — Installazione di Node.js

Il pacchetto `mcp-remote` richiede **Node.js** come runtime.

### 1.1 Verifica se Node.js è già installato

Aprire un terminale (PowerShell o Prompt dei comandi) ed eseguire:

```bash
node --version
npm --version
```

Se entrambi i comandi restituiscono un numero di versione (es. `v20.x.x`), Node.js è già presente → passare al **Passo 2**.

### 1.2 Installazione di Node.js (se assente)

1. Andare su [https://nodejs.org](https://nodejs.org)
2. Scaricare la versione **LTS** (Long Term Support)
3. Eseguire il programma di installazione con le impostazioni predefinite
4. Al termine, verificare nuovamente con `node --version` e `npm --version`

> ⚠️ **Attenzione:** Dopo l'installazione di Node.js, potrebbe essere necessario **riavviare il terminale** (o il PC) affinché i comandi siano riconosciuti.

---

## Passo 2 — Installazione del pacchetto `mcp-remote`

`mcp-remote` è il componente che funge da ponte tra Claude Desktop e i server MCP remoti.

### 2.1 Installazione globale via npm

Aprire PowerShell (o Prompt dei comandi) **come Amministratore** ed eseguire:

```bash
npm install -g mcp-remote
```

### 2.2 Verifica dell'installazione

```bash
mcp-remote --version
```

Se il comando restituisce un numero di versione, l'installazione è avvenuta correttamente.

> 💡 **Nota:** L'installazione globale (`-g`) rende il comando `mcp-remote` disponibile da qualsiasi cartella del sistema, condizione necessaria per il funzionamento con Claude Desktop.

---

## Passo 3 — Configurazione di Claude Desktop

### 3.1 Individuare il file di configurazione

Il file di configurazione di Claude Desktop si trova in:

```
%APPDATA%\Claude\claude_desktop_config.json
```

Per aprire rapidamente la cartella giusta:
1. Premere `Win + R`
2. Digitare `%APPDATA%\Claude` e premere Invio
3. Aprire il file `claude_desktop_config.json` con un editor di testo (es. Notepad, VS Code)

> ⚠️ **Attenzione:** Se la cartella `Claude` o il file non esistono, è necessario crearli manualmente.

### 3.2 Contenuto del file di configurazione

Sostituire (o creare) il contenuto del file con la seguente configurazione:

```json
{
  "mcpServers": {
    "gammabot-test-taric": {
      "command": "mcp-remote",
      "args": [
        "http://GIT-VTA-MCP01.gamma-spa.com/mcp/",
        "--allow-http"
      ]
    },
    "gammabot-test-manualisapb1": {
      "command": "mcp-remote",
      "args": [
        "http://GIT-VTA-MCP02.gamma-spa.com/doc_indexer_mcp/sap_manuali/",
        "--allow-http"
      ]
    }
  },
  "preferences": {
    "coworkScheduledTasksEnabled": true,
    "ccdScheduledTasksEnabled": true,
    "sidebarMode": "chat",
    "autoPermissionsModeEnabled": true,
    "coworkWebSearchEnabled": true,
    "coworkOnboardingResumeStep": null
  }
}
```

### 3.3 Note sulla configurazione

| Parametro | Descrizione |
|---|---|
| `command: "mcp-remote"` | Indica a Claude Desktop di usare il bridge installato al Passo 2 |
| `args[0]` | URL dell'endpoint del server MCP remoto |
| `--allow-http` | Necessario perché i server usano HTTP (non HTTPS). Senza questo flag la connessione viene rifiutata |

> ⚠️ **Importante:** Il flag `--allow-http` è richiesto perché i server GammaBot sono esposti su protocollo HTTP non cifrato. In ambienti con server HTTPS questo flag non è necessario.

---

## Passo 4 — Riavvio e verifica

### 4.1 Riavviare Claude Desktop

Dopo aver salvato il file di configurazione:
1. **Chiudere completamente** Claude Desktop (assicurarsi che non sia in esecuzione nel system tray)
2. **Riaprire** Claude Desktop

### 4.2 Verificare la connessione agli MCP Server

1. Aprire una nuova conversazione in Claude Desktop
2. Fare clic sull'icona **Strumenti** (🔧) o verificare la sezione MCP nelle impostazioni
3. I due server dovrebbero comparire come disponibili:
   - `gammabot-test-taric`
   - `gammabot-test-manualisapb1`

> 💡 **Test rapido:** Chiedere a Claude qualcosa che richieda uno dei tool esposti dal server, per es. *"Cerca il codice TARIC per [prodotto]"* — se risponde usando lo strumento, la connessione funziona.

---

## Risoluzione dei Problemi Comuni

### ❌ Errore: `mcp-remote: command not found`

**Causa:** `mcp-remote` non è nel PATH di sistema, oppure Node.js non è stato installato correttamente.

**Soluzione:**
```bash
# Verificare dove npm installa i pacchetti globali
npm config get prefix

# Assicurarsi che la cartella bin sia nel PATH
# Su Windows, tipicamente: C:\Users\<utente>\AppData\Roaming\npm
```
Aggiungere manualmente il percorso alle variabili d'ambiente di sistema se necessario.

---

### ❌ Errore di connessione al server (timeout / ECONNREFUSED)

**Causa:** Il PC non riesce a raggiungere i server `GIT-VTA-MCP01` o `GIT-VTA-MCP02`.

**Soluzioni:**
- Verificare di essere connessi alla **rete aziendale** (o VPN)
- Testare la raggiungibilità dal terminale:
  ```bash
  ping GIT-VTA-MCP01.gamma-spa.com
  ```
- Contattare l'amministratore di rete in caso di blocchi firewall

---

### ❌ Gli MCP Server non appaiono in Claude Desktop

**Causa:** Il file JSON potrebbe contenere errori di sintassi, oppure Claude Desktop non è stato riavviato correttamente.

**Soluzioni:**
1. Validare il JSON su [https://jsonlint.com](https://jsonlint.com)
2. Assicurarsi che il file sia salvato in `%APPDATA%\Claude\claude_desktop_config.json`
3. Chiudere completamente Claude (incluso system tray) e riaprirlo

---

### ❌ Errore relativo a HTTP / connessione non sicura

**Causa:** Il flag `--allow-http` è mancante o scritto in modo errato.

**Soluzione:** Verificare che nell'array `args` sia presente esattamente la stringa `"--allow-http"` (con il doppio trattino iniziale).

---

## Riepilogo dei Comandi

```bash
# 1. Verificare Node.js
node --version && npm --version

# 2. Installare mcp-remote globalmente
npm install -g mcp-remote

# 3. Verificare installazione mcp-remote
mcp-remote --version

# 4. Aprire la cartella di configurazione di Claude Desktop
explorer %APPDATA%\Claude
```

---

## Riferimenti

- [Claude Desktop — Documentazione ufficiale](https://support.claude.com)
- [Specifiche Model Context Protocol (MCP)](https://modelcontextprotocol.io)
- [Pacchetto mcp-remote su npm](https://www.npmjs.com/package/mcp-remote)
- [Node.js — Download LTS](https://nodejs.org)

---

*Guida redatta per uso interno — Progetto GammaBot | Gamma S.p.A.*
