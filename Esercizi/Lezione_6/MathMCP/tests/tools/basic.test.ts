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
