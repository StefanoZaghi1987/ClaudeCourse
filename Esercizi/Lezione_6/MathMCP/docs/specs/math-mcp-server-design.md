# MathMCP Server — Design Spec

## Overview

MCP Server in TypeScript che espone 8 tool per operazioni matematiche (4 base + 4 avanzate), utilizzando l'MCP SDK ufficiale con transport stdio.

---

## Tool Inventory

### Tool base

| Tool | Parametri | Descrizione |
|---|---|---|
| `math_add` | `augend: number`, `addend: number` | Add two numbers together |
| `math_subtract` | `minuend: number`, `subtrahend: number` | Subtract the subtrahend from the minuend |
| `math_multiply` | `multiplier: number`, `multiplicand: number` | Multiply two numbers |
| `math_divide` | `dividend: number`, `divisor: number` | Divide the dividend by the divisor |

### Tool avanzati

| Tool | Parametri | Descrizione |
|---|---|---|
| `math_power` | `base: number`, `exponent: number` | Raise base to the power of exponent |
| `math_sqrt` | `radicand: number` | Compute the square root |
| `math_modulo` | `dividend: number`, `divisor: number` | Compute the remainder of division |
| `math_logarithm` | `value: number`, `base?: number` (default: `10`) | Compute the logarithm of value in given base |

---

## Formato dell'Output

### Successo

Ogni tool restituisce un `CallToolResult` con un singolo `TextContent`. Il testo contiene il risultato numerico convertito a stringa.

Esempi:
- `math_add(2, 3)` → `{ content: [{ type: "text", text: "5" }] }`
- `math_sqrt(16)` → `{ content: [{ type: "text", text: "4" }] }`
- `math_divide(7, 2)` → `{ content: [{ type: "text", text: "3.5" }] }`

### Errore

Il flag `isError: true` viene settato e il testo descrive l'errore in modo leggibile.

Esempio:
- `math_divide(5, 0)` → `{ content: [{ type: "text", text: "Division by zero: divisor cannot be 0" }], isError: true }`

Valori speciali JavaScript (`Infinity`, `-Infinity`, `NaN`) non vengono mai restituiti — le condizioni che li produrrebbero sono intercettate e restituiscono errore con `isError: true`.

---

## Gestione Errori e Casi Limite

### Matrice dei casi limite

| Tool | Condizione | Messaggio di errore |
|---|---|---|
| `math_divide` | `divisor === 0` | `"Division by zero: divisor cannot be 0"` |
| `math_modulo` | `divisor === 0` | `"Modulo by zero: divisor cannot be 0"` |
| `math_sqrt` | `radicand < 0` | `"Invalid input: radicand must be non-negative"` |
| `math_logarithm` | `value <= 0` | `"Invalid input: value must be positive"` |
| `math_logarithm` | `base <= 0 \|\| base === 1` | `"Invalid input: base must be positive and not equal to 1"` |
| `math_power` | risultato non finito | `"Result is not a finite number"` |

### Validazione a due livelli

1. **Livello schema** — L'MCP SDK valida automaticamente tipo e presenza dei parametri tramite Zod. Input mancanti o di tipo sbagliato non raggiungono l'handler.
2. **Livello handler** — Il codice verifica le precondizioni matematiche (tabella sopra) e restituisce `isError: true` se violate.

### Guardia globale

Ogni handler controlla il risultato prima di restituirlo: se il valore è `NaN`, `Infinity` o `-Infinity`, restituisce errore. Questo cattura casi non previsti nella matrice esplicita.

---

## Architettura

### Struttura del progetto

```
MathMCP/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Entry point: crea McpServer, registra tool, connette transport
│   ├── registry.ts       # Aggrega i tool da tools/*.ts, esporta l'array completo
│   ├── types.ts          # Tipo ToolDefinition e helper types
│   └── tools/
│       ├── basic.ts      # math_add, math_subtract, math_multiply, math_divide
│       └── advanced.ts   # math_power, math_sqrt, math_modulo, math_logarithm
```

### Tipo centrale: ToolDefinition

Ogni tool è descritto da un oggetto con:

- **`name`**: stringa (es. `"math_add"`)
- **`description`**: stringa per l'LLM (es. `"Add two numbers together"`)
- **`schema`**: oggetto Zod che definisce i parametri di input
- **`handler`**: funzione che riceve i parametri validati e restituisce un `CallToolResult`

### Flusso di registrazione

1. `basic.ts` e `advanced.ts` esportano ciascuno un array di `ToolDefinition`
2. `registry.ts` importa entrambi gli array e li concatena in un unico array
3. `index.ts` importa il registry, crea il `McpServer`, e itera sull'array chiamando `server.tool(name, schema, handler)` per ciascun elemento

### Transport

`StdioServerTransport` — comunicazione via stdin/stdout.

---

## Configurazione del Progetto

### Dipendenze

- **Runtime**: `@modelcontextprotocol/sdk`, `zod`
- **Dev**: `typescript`, `@types/node`

### Build

- Compilazione TypeScript con `tsc`, output in `dist/`
- Script npm: `build` (compila), `start` (esegue il server)

### tsconfig.json

- Target: `ES2022`
- Module: `Node16` (ESM)
- `strict: true`
- `"type": "module"` nel `package.json`

### Integrazione Claude Desktop

Il server va registrato in `claude_desktop_config.json` con il comando `node` che punta al file compilato in `dist/index.js`.
