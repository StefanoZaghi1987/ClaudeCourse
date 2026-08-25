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
