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
