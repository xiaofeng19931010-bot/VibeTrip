import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

export type ToolHandler = (args: Record<string, unknown>) => Promise<{ content: Array<{ type: 'text'; text: string }> }>;

export interface ToolDefinition {
  name: string;
  schema: z.ZodSchema;
  handler: ToolHandler;
}

export const TOOLS: ToolDefinition[] = [
  {
    name: 'plan_trip',
    schema: z.object({
      description: z.string(),
      role: z.enum(['parents', 'family', 'couple', 'friends', 'soldier']).optional(),
      days: z.number().optional(),
      budget: z.number().optional(),
    }),
    handler: async (args) => {
      const { description, role, days, budget } = args as { description: string; role?: string; days?: number; budget?: number };
      return {
        content: [{
          type: 'text' as const,
          text: `Planning trip: ${description}\nRole: ${role || 'default'}\nDays: ${days || 'not specified'}\nBudget: ${budget || 'not specified'}`,
        }],
      };
    },
  },
  {
    name: 'revise_itinerary',
    schema: z.object({
      trip_id: z.string(),
      instructions: z.string(),
    }),
    handler: async (args) => {
      const { trip_id, instructions } = args as { trip_id: string; instructions: string };
      return { content: [{ type: 'text' as const, text: `Revising itinerary for trip ${trip_id}\nInstructions: ${instructions}` }] };
    },
  },
  {
    name: 'persist_trip',
    schema: z.object({
      trip_id: z.string(),
    }),
    handler: async (args) => {
      const { trip_id } = args as { trip_id: string };
      return { content: [{ type: 'text' as const, text: `Trip ${trip_id} has been persisted.` }] };
    },
  },
  {
    name: 'start_capture',
    schema: z.object({
      trip_id: z.string(),
    }),
    handler: async (args) => {
      const { trip_id } = args as { trip_id: string };
      return { content: [{ type: 'text' as const, text: `Capture started for trip ${trip_id}.` }] };
    },
  },
  {
    name: 'stop_capture',
    schema: z.object({
      trip_id: z.string(),
    }),
    handler: async (args) => {
      const { trip_id } = args as { trip_id: string };
      return { content: [{ type: 'text' as const, text: `Capture stopped for trip ${trip_id}.` }] };
    },
  },
  {
    name: 'ingest_media',
    schema: z.object({
      trip_id: z.string(),
      type: z.enum(['photo', 'voice', 'note', 'gpx']),
      content: z.string(),
      timestamp: z.string().optional(),
    }),
    handler: async (args) => {
      const { trip_id, type, content, timestamp } = args as { trip_id: string; type: string; content: string; timestamp?: string };
      return { content: [{ type: 'text' as const, text: `Media ${type} ingested for trip ${trip_id}${timestamp ? ` at ${timestamp}` : ''}.` }] };
    },
  },
  {
    name: 'generate_memory',
    schema: z.object({
      trip_id: z.string(),
      format: z.enum(['handbook', 'poster']).optional(),
    }),
    handler: async (args) => {
      const { trip_id, format } = args as { trip_id: string; format?: string };
      return { content: [{ type: 'text' as const, text: `Memory generated for trip ${trip_id} in format: ${format || 'handbook'}.` }] };
    },
  },
  {
    name: 'generate_share',
    schema: z.object({
      trip_id: z.string(),
      channel: z.enum(['xhs', 'moments', 'weibo', 'other']),
    }),
    handler: async (args) => {
      const { trip_id, channel } = args as { trip_id: string; channel: string };
      return { content: [{ type: 'text' as const, text: `Share content generated for trip ${trip_id} targeting ${channel}.` }] };
    },
  },
];

export function createMcpServer(name = 'vibetrip-mcp-server', version = '0.1.0') {
  const server = new McpServer({ name, version });

  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      {
        description: `${tool.name.replace(/_/g, ' ')} tool`,
        inputSchema: tool.schema,
      },
      async ({ arguments: args }) => {
        return tool.handler(args as Record<string, unknown>);
      }
    );
  }

  return server;
}

export async function startHTTPServer(server: McpServer) {
  const transport = new StreamableHTTPServerTransport({});
  await transport.start();
  await server.connect(transport);
  console.error('VibeTrip MCP Server running on stdio');
}

export { McpServer };
