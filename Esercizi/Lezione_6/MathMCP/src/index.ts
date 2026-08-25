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
