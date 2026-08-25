import { basicTools } from "./tools/basic.js";
import { advancedTools } from "./tools/advanced.js";
import type { ToolDefinition } from "./types.js";

export const allTools: ToolDefinition[] = [...basicTools, ...advancedTools];
