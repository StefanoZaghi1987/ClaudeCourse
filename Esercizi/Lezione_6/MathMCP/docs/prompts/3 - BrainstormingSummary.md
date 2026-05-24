# MathMCP Server — Brainstorming Summary

**Data:** 2026-04-10  
**Obiettivo:** Progettare un MCP Server in TypeScript per operazioni matematiche  
**Stack:** TypeScript + MCP SDK ufficiale

---

## Decisioni Prese

### 1. Granularità dei Tool

**Domanda:** Come esporre le 8 operazioni matematiche?

| Opzione | Descrizione | Valutazione |
|---|---|---|
| A) Un tool per operazione | 8 tool separati | **Scelta** |
| B) Un tool per categoria | 2 tool con parametro `operation` | Scartata |
| C) Un singolo tool | 1 tool generico `calculate` | Scartata |

**Motivazione:** Nel protocollo MCP, l'LLM sceglie il tool basandosi su nome e descrizione. Tool con nomi espliciti (`math_divide`) vengono selezionati con più accuratezza rispetto a un tool generico dove l'LLM deve comporre anche il parametro `operation`. Con 8 operazioni il numero di tool è gestibile.

---

### 2. Naming Convention

**Domanda:** Come nominare i tool?

| Opzione | Esempio | Valutazione |
|---|---|---|
| A) Verbi brevi | `add`, `divide` | Rischio collisioni |
| B) Prefisso namespace | `math_add`, `math_divide` | **Scelta** |
| C) Nomi descrittivi estesi | `calculate_sum` | Troppo verboso |

**Motivazione:** Il prefisso `math_` evita collisioni con tool di altri server MCP (un `add` generico potrebbe confondersi con un tool che aggiunge elementi a una lista) e rende immediatamente chiaro il dominio.

---

### 3. Gestione degli Errori

**Domanda:** Come comunicare gli errori al client MCP?

| Opzione | Descrizione | Valutazione |
|---|---|---|
| A) `isError: true` nel CallToolResult | Flag idiomatico MCP | **Scelta** |
| B) Eccezione/throw | Errore di protocollo | Meno informativo per l'LLM |
| C) Campo strutturato nel risultato | `{ success: false, error: "..." }` | L'LLM deve parsare |

**Motivazione:** Il flag `isError` è il meccanismo standard dell'MCP SDK, progettato esattamente per questo scopo. L'LLM riceve un messaggio leggibile e sa che l'operazione è fallita.

---

### 4. Naming dei Parametri

**Domanda:** Come nominare i parametri delle operazioni binarie?

| Opzione | Esempio per `divide` | Valutazione |
|---|---|---|
| A) Generici | `a`, `b` | Ambiguo per operazioni non commutative |
| B) Semantici | `dividend`, `divisor` | **Scelta** |
| C) Misto | Generici per commutative, semantici per le altre | Non scelto |

**Motivazione:** Nomi semantici come `dividend`/`divisor` rendono la description quasi superflua — il nome stesso documenta l'intento, riducendo gli errori di invocazione da parte dell'LLM.

---

### 5. Default del Logaritmo

**Domanda:** Quale base di default per `math_logarithm`?

| Opzione | Base | Valutazione |
|---|---|---|
| A) Base `e` | Logaritmo naturale | Convenzione scientifica |
| B) Base `10` | Logaritmo decimale | **Scelta** |
| C) Nessun default | Base obbligatoria | Nessuna ambiguità ma meno ergonomico |

---

### 6. Organizzazione dei File

**Domanda:** Come strutturare i file sorgente?

| Opzione | Descrizione | Valutazione |
|---|---|---|
| A) File singolo | Tutto in `index.ts` | Troppo grande (~400 righe) |
| B) File per categoria | `basic.ts` + `advanced.ts` | **Scelta** |
| C) File per tool | Un file per operazione | Overengineering |

---

### 7. Pattern di Registrazione

**Domanda:** Come registrare i tool nel server MCP?

| Opzione | Descrizione | Valutazione |
|---|---|---|
| A) Registrazione diretta | `server.tool()` chiamato per ogni tool | Più semplice |
| B) Pattern registry | Array di definizioni iterato per la registrazione | **Scelta** |

**Motivazione:** Scelta orientata all'estensibilità — aggiungere un tool significa aggiungere un elemento all'array, senza modificare il flusso di registrazione.

---

## Architettura Risultante

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

## Tool Finali

| Tool | Parametri | Casi limite |
|---|---|---|
| `math_add` | `augend`, `addend` | — |
| `math_subtract` | `minuend`, `subtrahend` | — |
| `math_multiply` | `multiplier`, `multiplicand` | — |
| `math_divide` | `dividend`, `divisor` | Divisione per zero |
| `math_power` | `base`, `exponent` | Risultato non finito |
| `math_sqrt` | `radicand` | Numero negativo |
| `math_modulo` | `dividend`, `divisor` | Divisore zero |
| `math_logarithm` | `value`, `base?` (default: 10) | Valore ≤ 0, base ≤ 0 o = 1 |

## Principi Chiave

- **Output:** risultato numerico come stringa in `TextContent`
- **Errori:** `isError: true` con messaggio leggibile, mai `Infinity`/`NaN`
- **Validazione:** due livelli (schema Zod + handler)
- **Transport:** `StdioServerTransport`
- **Moduli:** ESM (`"type": "module"`)
- **Dipendenze runtime:** `@modelcontextprotocol/sdk`, `zod`
