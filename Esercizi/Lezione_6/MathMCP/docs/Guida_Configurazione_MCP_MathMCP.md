# Guida: Configurazione di MathMCP Server per Claude Desktop
## Installazione locale e connessione via stdio transport

> **Versione:** 1.0  
> **Applicazione target:** Claude Desktop (Windows)  
> **Ultimo aggiornamento:** Aprile 2026

---

## Panoramica

Questa guida descrive i passaggi necessari per compilare, installare e connettere a **Claude Desktop** il server MCP locale **MathMCP**, che espone 8 tool per operazioni matematiche:

| Categoria | Tool disponibili |
|---|---|
| **Base** | `math_add`, `math_subtract`, `math_multiply`, `math_divide` |
| **Avanzati** | `math_power`, `math_sqrt`, `math_modulo`, `math_logarithm` |

La connessione avviene tramite **stdio transport**: Claude Desktop avvia il server come processo figlio e comunica con esso via stdin/stdout usando il protocollo JSON-RPC. Non sono necessari server HTTP, porte di rete o bridge esterni.

> 💡 **Come funziona stdio transport:** Claude Desktop esegue il comando `node dist/index.js` come processo figlio. Il server MCP legge richieste da stdin e scrive risposte su stdout, usando messaggi JSON-RPC. Questo approccio rende ogni server MCP un processo isolato e leggero — nessuna porta da aprire, nessun conflitto di rete.

---

## Prerequisiti

Prima di procedere, assicurarsi di avere:

- ✅ **Node.js** installato (versione 18 o successiva)
- ✅ **Claude Desktop** installato (versione recente)
- ✅ Permessi di scrittura sulla cartella di configurazione di Claude Desktop

### Verifica di Node.js

Aprire un terminale (PowerShell o Prompt dei comandi) ed eseguire:

```bash
node --version
npm --version
```

Se entrambi i comandi restituiscono un numero di versione (es. `v20.x.x`), Node.js è presente → passare al **Passo 1**.

Se Node.js non è installato:
1. Andare su [https://nodejs.org](https://nodejs.org)
2. Scaricare la versione **LTS** (Long Term Support)
3. Eseguire il programma di installazione con le impostazioni predefinite
4. Verificare nuovamente con `node --version` e `npm --version`

> ⚠️ **Attenzione:** Dopo l'installazione di Node.js, potrebbe essere necessario **riavviare il terminale** (o il PC) affinché i comandi siano riconosciuti.

---

## Passo 1 — Installazione delle dipendenze e compilazione

Il server MathMCP è scritto in TypeScript e deve essere compilato in JavaScript prima dell'uso. Claude Desktop esegue `node` (il runtime JavaScript), quindi necessita dei file compilati nella cartella `dist/`, non dei sorgenti TypeScript in `src/`.

### 1.1 Installare le dipendenze

Aprire un terminale nella cartella del progetto ed eseguire:

```bash
cd D:\VibeCoding\ClaudeCourse\Esercizi\Lezione_5\MathMCP
npm install
```

Questo scarica tutte le dipendenze necessarie (MCP SDK, Zod, TypeScript, Vitest) nella cartella `node_modules/`.

### 1.2 Compilare il progetto

```bash
npm run build
```

Il compilatore TypeScript (`tsc`) genera i file JavaScript nella cartella `dist/`:

| File sorgente | File compilato |
|---|---|
| `src/index.ts` | `dist/index.js` |
| `src/registry.ts` | `dist/registry.js` |
| `src/types.ts` | `dist/types.js` |
| `src/tools/basic.ts` | `dist/tools/basic.js` |
| `src/tools/advanced.ts` | `dist/tools/advanced.js` |

### 1.3 Verificare che i test passino (opzionale)

```bash
npm test
```

Risultato atteso: **28 test superati** (12 per i tool base + 16 per i tool avanzati).

> ⚠️ **Importante:** Ogni volta che si modificano file in `src/`, è necessario ri-eseguire `npm run build` prima di testare con Claude Desktop. I file in `dist/` non si aggiornano automaticamente.

---

## Passo 2 — Configurazione di Claude Desktop

### 2.1 Individuare il file di configurazione

Il file di configurazione di Claude Desktop si trova in:

```
%APPDATA%\Claude\claude_desktop_config.json
```

Per aprire rapidamente la cartella giusta:
1. Premere `Win + R`
2. Digitare `%APPDATA%\Claude` e premere Invio
3. Aprire il file `claude_desktop_config.json` con un editor di testo (es. Notepad, VS Code)

> ⚠️ **Attenzione:** Se la cartella `Claude` o il file non esistono, è necessario crearli manualmente.

### 2.2 Aggiungere il server MathMCP

Aggiungere (o unire all'oggetto `mcpServers` esistente) la seguente configurazione:

```json
{
  "mcpServers": {
    "math-mcp-server": {
      "command": "node",
      "args": ["D:/VibeCoding/ClaudeCourse/Esercizi/Lezione_5/MathMCP/dist/index.js"]
    }
  }
}
```

> ⚠️ **Importante:** Se il file contiene già altri server MCP, aggiungere `"math-mcp-server": { ... }` all'interno dell'oggetto `mcpServers` esistente, separando le voci con una virgola. Non sovrascrivere le configurazioni preesistenti.

### 2.3 Note sulla configurazione

| Parametro | Descrizione |
|---|---|
| `command: "node"` | Indica a Claude Desktop di avviare Node.js come runtime |
| `args[0]` | Percorso assoluto al file JavaScript compilato (`dist/index.js`) |

> 💡 **Nota:** Il percorso in `args` utilizza le barre oblique (`/`) anche su Windows. Questo è intenzionale e compatibile con Node.js. In alternativa, è possibile usare doppie barre inverse (`\\`).

---

## Passo 3 — Riavvio e verifica

### 3.1 Riavviare Claude Desktop

Dopo aver salvato il file di configurazione:
1. **Chiudere completamente** Claude Desktop (assicurarsi che non sia in esecuzione nel system tray)
2. **Riaprire** Claude Desktop

### 3.2 Verificare la connessione al server MathMCP

1. Aprire una nuova conversazione in Claude Desktop
2. Fare clic sull'icona **Strumenti** (🔧) nella barra della chat
3. Il server `math-mcp-server` dovrebbe comparire con **8 tool** disponibili

### 3.3 Test rapido

Chiedere a Claude qualcosa che richieda un calcolo, ad esempio:

- *"Quanto fa 2 elevato alla 10?"* → Claude chiamerà `math_power`
- *"Qual è la radice quadrata di 144?"* → Claude chiamerà `math_sqrt`
- *"Calcola il logaritmo in base 2 di 256"* → Claude chiamerà `math_logarithm`

Se Claude risponde utilizzando gli strumenti matematici, la connessione funziona correttamente.

---

## Risoluzione dei Problemi Comuni

### ❌ Il server non appare in Claude Desktop

**Causa:** Il file JSON potrebbe contenere errori di sintassi, oppure Claude Desktop non è stato riavviato correttamente.

**Soluzioni:**
1. Validare il JSON su [https://jsonlint.com](https://jsonlint.com)
2. Assicurarsi che il file sia salvato in `%APPDATA%\Claude\claude_desktop_config.json`
3. Chiudere completamente Claude (incluso system tray) e riaprirlo

---

### ❌ Errore: il percorso di `dist/index.js` non viene trovato

**Causa:** Il progetto non è stato compilato, oppure il percorso nel file di configurazione è errato.

**Soluzioni:**
1. Verificare che la cartella `dist/` esista e contenga `index.js`:
   ```bash
   dir D:\VibeCoding\ClaudeCourse\Esercizi\Lezione_5\MathMCP\dist\
   ```
2. Se la cartella è vuota o assente, eseguire la compilazione:
   ```bash
   cd D:\VibeCoding\ClaudeCourse\Esercizi\Lezione_5\MathMCP
   npm run build
   ```
3. Verificare che il percorso in `claude_desktop_config.json` corrisponda esattamente alla posizione del file

---

### ❌ Errore: `node: command not found`

**Causa:** Node.js non è installato o non è nel PATH di sistema.

**Soluzione:**
```bash
# Verificare l'installazione di Node.js
node --version
```
Se il comando non viene riconosciuto, installare Node.js seguendo la sezione **Prerequisiti**.

---

### ❌ I tool compaiono ma Claude non li utilizza

**Causa:** Claude sceglie autonomamente quando usare i tool. Per domande molto semplici potrebbe rispondere direttamente senza chiamarli.

**Soluzione:** Formulare la richiesta in modo esplicito, ad esempio: *"Usa lo strumento math_divide per calcolare 355 diviso 113"*.

---

## Riepilogo dei Comandi

```bash
# 1. Verificare Node.js
node --version && npm --version

# 2. Installare dipendenze
cd D:\VibeCoding\ClaudeCourse\Esercizi\Lezione_5\MathMCP
npm install

# 3. Compilare il progetto
npm run build

# 4. Eseguire i test (opzionale)
npm test

# 5. Aprire la cartella di configurazione di Claude Desktop
explorer %APPDATA%\Claude
```

---

## Riferimenti

- [Claude Desktop — Documentazione ufficiale](https://support.claude.com)
- [Specifiche Model Context Protocol (MCP)](https://modelcontextprotocol.io)
- [MCP SDK per TypeScript](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [Node.js — Download LTS](https://nodejs.org)

---

*Guida redatta per il progetto MathMCP — Lezione 5, Corso Claude*
