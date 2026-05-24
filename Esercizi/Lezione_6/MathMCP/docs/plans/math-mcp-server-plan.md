# MathMCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MCP Server in TypeScript that exposes 8 math tools (4 basic + 4 advanced) using the official MCP SDK with stdio transport.

**Architecture:** Registry pattern — each tool is a `ToolDefinition` object (name, description, Zod schema, handler). Tool files export arrays of definitions, a central registry aggregates them, and the entry point iterates the registry to register each tool on the `McpServer`. Two-level validation: Zod schema for types, handler for math preconditions.

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk`, `zod`, `vitest`

**Spec:** `specs/2026-04-10-math-mcp-server-design.md`

---

## File Map

| File | Responsibility |
|---|---|
| `package.json` | Project metadata, dependencies, npm scripts |
| `tsconfig.json` | TypeScript compiler config (ES2022, Node16, strict) |
| `src/types.ts` | `ToolDefinition` type + `successResult`/`errorResult` helpers |
| `src/tools/basic.ts` | 4 basic tool definitions: add, subtract, multiply, divide |
| `src/tools/advanced.ts` | 4 advanced tool definitions: power, sqrt, modulo, logarithm |
| `src/registry.ts` | Aggregates all tool definitions into a single array |
| `src/index.ts` | Entry point: creates McpServer, registers tools from registry, connects stdio transport |
| `tests/tools/basic.test.ts` | Tests for basic tool handlers |
| `tests/tools/advanced.test.ts` | Tests for advanced tool handlers |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`

- [x] **Step 1: Create `package.json`**

```json
{
  "name": "math-mcp-server",
  "version": "1.0.0",
  "description": "MCP Server exposing math operation tools",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.1",
    "zod": "^3.24.4"
  },
  "devDependencies": {
    "@types/node": "^22.15.3",
    "typescript": "^5.8.3",
    "vitest": "^3.1.2"
  }
}
```

- [x] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src"]
}
```

- [x] **Step 3: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` generated, no errors.

- [x] **Step 4: Verify TypeScript compiles (empty project)**

Run: `npx tsc --noEmit`
Expected: No errors (no source files yet, that's fine).

- [x] **Step 5: Commit** *(user manages git)*

---

## Task 2: Types and Helpers

**Files:**
- Create: `src/types.ts`
- Test: `tests/tools/basic.test.ts` (partial — test helpers only)

- [x] **Step 1: Write tests for `successResult` and `errorResult` helpers**

Create `tests/tools/basic.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { successResult, errorResult } from "../../src/types.js";

describe("successResult", () => {
  it("wraps a number into a CallToolResult with text content", () => {
    const result = successResult(42);
    expect(result).toEqual({
      content: [{ type: "text", text: "42" }],
    });
  });

  it("converts decimals correctly", () => {
    const result = successResult(3.14);
    expect(result.content[0].text).toBe("3.14");
  });
});

describe("errorResult", () => {
  it("wraps an error message into a CallToolResult with isError flag", () => {
    const result = errorResult("Division by zero: divisor cannot be 0");
    expect(result).toEqual({
      content: [{ type: "text", text: "Division by zero: divisor cannot be 0" }],
      isError: true,
    });
  });
});
```

- [x] **Step 2: Run tests to verify they fail** *(FAIL — module not found, as expected)*

- [x] **Step 3: Implement `src/types.ts`**

```typescript
import { z } from "zod";

export interface ToolDefinition {
  name: string;
  description: string;
  schema: z.ZodRawShape;
  handler: (params: Record<string, unknown>) => {
    content: { type: "text"; text: string }[];
    isError?: boolean;
  };
}

export function successResult(value: number) {
  return {
    content: [{ type: "text" as const, text: String(value) }],
  };
}

export function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

export function safeResult(value: number): ReturnType<typeof successResult | typeof errorResult> {
  if (!Number.isFinite(value)) {
    return errorResult("Result is not a finite number");
  }
  return successResult(value);
}
```

- [x] **Step 4: Run tests to verify they pass** *(3/3 PASS)*

- [x] **Step 5: Commit** *(user manages git)*

---

## Task 3: Basic Math Tools

**Files:**
- Create: `src/tools/basic.ts`
- Modify: `tests/tools/basic.test.ts`

- [x] **Step 1: Write tests for all 4 basic tools**

Append to `tests/tools/basic.test.ts`:

```typescript
import { basicTools } from "../../src/tools/basic.js";

function findTool(name: string) {
  const tool = basicTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool;
}

describe("math_add", () => {
  const tool = findTool("math_add");

  it("adds two positive numbers", () => {
    const result = tool.handler({ augend: 2, addend: 3 });
    expect(result.content[0].text).toBe("5");
    expect(result.isError).toBeUndefined();
  });

  it("adds negative numbers", () => {
    const result = tool.handler({ augend: -5, addend: -3 });
    expect(result.content[0].text).toBe("-8");
  });

  it("adds decimals", () => {
    const result = tool.handler({ augend: 0.1, addend: 0.2 });
    expect(Number(result.content[0].text)).toBeCloseTo(0.3);
  });
});

describe("math_subtract", () => {
  const tool = findTool("math_subtract");

  it("subtracts two numbers", () => {
    const result = tool.handler({ minuend: 10, subtrahend: 4 });
    expect(result.content[0].text).toBe("6");
  });

  it("returns negative when subtrahend is larger", () => {
    const result = tool.handler({ minuend: 3, subtrahend: 7 });
    expect(result.content[0].text).toBe("-4");
  });
});

describe("math_multiply", () => {
  const tool = findTool("math_multiply");

  it("multiplies two numbers", () => {
    const result = tool.handler({ multiplier: 6, multiplicand: 7 });
    expect(result.content[0].text).toBe("42");
  });

  it("multiplies by zero", () => {
    const result = tool.handler({ multiplier: 999, multiplicand: 0 });
    expect(result.content[0].text).toBe("0");
  });
});

describe("math_divide", () => {
  const tool = findTool("math_divide");

  it("divides two numbers", () => {
    const result = tool.handler({ dividend: 10, divisor: 3 });
    expect(Number(result.content[0].text)).toBeCloseTo(3.3333);
  });

  it("returns error on division by zero", () => {
    const result = tool.handler({ dividend: 5, divisor: 0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Division by zero: divisor cannot be 0");
  });
});
```

- [x] **Step 2: Run tests to verify they fail** *(FAIL — module not found, as expected)*

- [x] **Step 3: Implement `src/tools/basic.ts`**

```typescript
import { z } from "zod";
import { type ToolDefinition, safeResult, errorResult } from "../types.js";

export const basicTools: ToolDefinition[] = [
  {
    name: "math_add",
    description: "Add two numbers together",
    schema: {
      augend: z.number().describe("The first number"),
      addend: z.number().describe("The second number"),
    },
    handler: (params) => {
      const { augend, addend } = params as { augend: number; addend: number };
      return safeResult(augend + addend);
    },
  },
  {
    name: "math_subtract",
    description: "Subtract the subtrahend from the minuend",
    schema: {
      minuend: z.number().describe("The number to subtract from"),
      subtrahend: z.number().describe("The number to subtract"),
    },
    handler: (params) => {
      const { minuend, subtrahend } = params as { minuend: number; subtrahend: number };
      return safeResult(minuend - subtrahend);
    },
  },
  {
    name: "math_multiply",
    description: "Multiply two numbers",
    schema: {
      multiplier: z.number().describe("The first number"),
      multiplicand: z.number().describe("The second number"),
    },
    handler: (params) => {
      const { multiplier, multiplicand } = params as { multiplier: number; multiplicand: number };
      return safeResult(multiplier * multiplicand);
    },
  },
  {
    name: "math_divide",
    description: "Divide the dividend by the divisor",
    schema: {
      dividend: z.number().describe("The number to divide"),
      divisor: z.number().describe("The number to divide by"),
    },
    handler: (params) => {
      const { dividend, divisor } = params as { dividend: number; divisor: number };
      if (divisor === 0) {
        return errorResult("Division by zero: divisor cannot be 0");
      }
      return safeResult(dividend / divisor);
    },
  },
];
```

- [x] **Step 4: Run tests to verify they pass** *(12/12 PASS)*

- [x] **Step 5: Commit** *(user manages git)*

---

## Task 4: Advanced Math Tools

**Files:**
- Create: `src/tools/advanced.ts`
- Create: `tests/tools/advanced.test.ts`

- [x] **Step 1: Write tests for all 4 advanced tools**

Create `tests/tools/advanced.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { advancedTools } from "../../src/tools/advanced.js";

function findTool(name: string) {
  const tool = advancedTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool;
}

describe("math_power", () => {
  const tool = findTool("math_power");

  it("computes power", () => {
    const result = tool.handler({ base: 2, exponent: 10 });
    expect(result.content[0].text).toBe("1024");
  });

  it("handles zero exponent", () => {
    const result = tool.handler({ base: 5, exponent: 0 });
    expect(result.content[0].text).toBe("1");
  });

  it("handles negative exponent", () => {
    const result = tool.handler({ base: 2, exponent: -1 });
    expect(result.content[0].text).toBe("0.5");
  });

  it("returns error for non-finite result", () => {
    const result = tool.handler({ base: 0, exponent: -1 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Result is not a finite number");
  });
});

describe("math_sqrt", () => {
  const tool = findTool("math_sqrt");

  it("computes square root", () => {
    const result = tool.handler({ radicand: 16 });
    expect(result.content[0].text).toBe("4");
  });

  it("computes square root of zero", () => {
    const result = tool.handler({ radicand: 0 });
    expect(result.content[0].text).toBe("0");
  });

  it("returns error for negative radicand", () => {
    const result = tool.handler({ radicand: -4 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Invalid input: radicand must be non-negative");
  });
});

describe("math_modulo", () => {
  const tool = findTool("math_modulo");

  it("computes remainder", () => {
    const result = tool.handler({ dividend: 10, divisor: 3 });
    expect(result.content[0].text).toBe("1");
  });

  it("handles negative dividend", () => {
    const result = tool.handler({ dividend: -10, divisor: 3 });
    expect(result.content[0].text).toBe("-1");
  });

  it("returns error for divisor zero", () => {
    const result = tool.handler({ divisor: 0, dividend: 10 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Modulo by zero: divisor cannot be 0");
  });
});

describe("math_logarithm", () => {
  const tool = findTool("math_logarithm");

  it("computes log base 10 by default", () => {
    const result = tool.handler({ value: 100 });
    expect(result.content[0].text).toBe("2");
  });

  it("computes log with custom base", () => {
    const result = tool.handler({ value: 8, base: 2 });
    expect(result.content[0].text).toBe("3");
  });

  it("returns error for value <= 0", () => {
    const result = tool.handler({ value: 0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Invalid input: value must be positive");
  });

  it("returns error for negative value", () => {
    const result = tool.handler({ value: -5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Invalid input: value must be positive");
  });

  it("returns error for base <= 0", () => {
    const result = tool.handler({ value: 10, base: -2 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Invalid input: base must be positive and not equal to 1");
  });

  it("returns error for base === 1", () => {
    const result = tool.handler({ value: 10, base: 1 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Invalid input: base must be positive and not equal to 1");
  });
});
```

- [x] **Step 2: Run tests to verify they fail** *(FAIL — module not found, as expected)*

- [x] **Step 3: Implement `src/tools/advanced.ts`**

```typescript
import { z } from "zod";
import { type ToolDefinition, safeResult, errorResult } from "../types.js";

export const advancedTools: ToolDefinition[] = [
  {
    name: "math_power",
    description: "Raise base to the power of exponent",
    schema: {
      base: z.number().describe("The base number"),
      exponent: z.number().describe("The exponent"),
    },
    handler: (params) => {
      const { base, exponent } = params as { base: number; exponent: number };
      return safeResult(Math.pow(base, exponent));
    },
  },
  {
    name: "math_sqrt",
    description: "Compute the square root",
    schema: {
      radicand: z.number().describe("The number to compute the square root of"),
    },
    handler: (params) => {
      const { radicand } = params as { radicand: number };
      if (radicand < 0) {
        return errorResult("Invalid input: radicand must be non-negative");
      }
      return safeResult(Math.sqrt(radicand));
    },
  },
  {
    name: "math_modulo",
    description: "Compute the remainder of division",
    schema: {
      dividend: z.number().describe("The number to divide"),
      divisor: z.number().describe("The number to divide by"),
    },
    handler: (params) => {
      const { dividend, divisor } = params as { dividend: number; divisor: number };
      if (divisor === 0) {
        return errorResult("Modulo by zero: divisor cannot be 0");
      }
      return safeResult(dividend % divisor);
    },
  },
  {
    name: "math_logarithm",
    description: "Compute the logarithm of value in given base",
    schema: {
      value: z.number().describe("The number to compute the logarithm of"),
      base: z.number().optional().default(10).describe("The logarithm base (default: 10)"),
    },
    handler: (params) => {
      const { value, base = 10 } = params as { value: number; base?: number };
      if (value <= 0) {
        return errorResult("Invalid input: value must be positive");
      }
      if (base <= 0 || base === 1) {
        return errorResult("Invalid input: base must be positive and not equal to 1");
      }
      return safeResult(Math.log(value) / Math.log(base));
    },
  },
];
```

- [x] **Step 4: Run tests to verify they pass** *(16/16 PASS)*

- [x] **Step 5: Commit** *(user manages git)*

---

## Task 5: Registry

**Files:**
- Create: `src/registry.ts`

- [x] **Step 1: Implement `src/registry.ts`**

```typescript
import { basicTools } from "./tools/basic.js";
import { advancedTools } from "./tools/advanced.js";
import type { ToolDefinition } from "./types.js";

export const allTools: ToolDefinition[] = [...basicTools, ...advancedTools];
```

- [x] **Step 2: Verify build compiles** *(clean, no errors)*

- [x] **Step 3: Commit** *(user manages git)*

---

## Task 6: Server Entry Point

**Files:**
- Create: `src/index.ts`

- [x] **Step 1: Implement `src/index.ts`**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { allTools } from "./registry.js";

const server = new McpServer({
  name: "math-mcp-server",
  version: "1.0.0",
});

for (const tool of allTools) {
  server.tool(tool.name, tool.description, tool.schema, tool.handler);
}

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [x] **Step 2: Verify full build compiles** *(clean build)*

- [x] **Step 3: Verify output structure** *(all 5 JS files present)*

- [x] **Step 4: Commit** *(user manages git)*

---

## Task 7: Full Test Suite Run and Final Verification

**Files:** None (verification only)

- [x] **Step 1: Run full test suite** *(28/28 tests PASS — 2 test files)*

- [x] **Step 2: Run build** *(clean build, no errors)*

- [x] **Step 3: Smoke test — start server** *(JSON-RPC initialize response received: math-mcp-server v1.0.0)*

- [x] **Step 4: Final commit** *(user manages git)*
