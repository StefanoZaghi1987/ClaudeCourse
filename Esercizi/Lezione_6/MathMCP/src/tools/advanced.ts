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
