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
