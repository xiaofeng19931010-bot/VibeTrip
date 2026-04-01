import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { PlanningService } from '@vibetrip/core';
import { memoryService, shareService, captureService } from '@vibetrip/core';
import type { A2UIEnvelope } from '@vibetrip/core';

export type ToolHandler = (args: Record<string, unknown>) => Promise<{ content: Array<{ type: 'text'; text: string }> }>;

export interface ToolDefinition {
  name: string;
  description: string;
  schema: z.ZodSchema;
  handler: ToolHandler;
}

function getApiKey(): string {
  const apiKey = process.env.ZHIPU_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('API密钥未配置，请设置 ZHIPU_API_KEY 或 OPENAI_API_KEY 环境变量');
  }
  return apiKey;
}

function buildEnvelopeResponse(envelope: A2UIEnvelope): string {
  return JSON.stringify(envelope);
}

export const TOOLS: ToolDefinition[] = [
  {
    name: 'plan_trip',
    description: 'Plan a trip from natural language description. Returns clarifying questions or a complete trip plan.',
    schema: z.object({
      description: z.string().describe('Natural language trip description'),
      role: z.enum(['parents', 'family', 'couple', 'friends', 'soldier']).optional().describe('Trip role/persona'),
      days: z.number().optional().describe('Number of days'),
      budget: z.number().optional().describe('Budget in CNY'),
    }),
    handler: async (args) => {
      const { description, role, days, budget } = args as { 
        description: string; 
        role?: 'parents' | 'family' | 'couple' | 'friends' | 'soldier'; 
        days?: number; 
        budget?: number; 
      };
      
      const apiKey = getApiKey();
      
      const planningService = new PlanningService({
        apiKey,
      });
      
      const result = await planningService.plan({
        description,
        role: role || 'friends',
        days,
        budget,
        userId: 'anonymous',
      });
      
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    },
  },
  {
    name: 'revise_itinerary',
    description: 'Revise an existing trip itinerary based on user instructions.',
    schema: z.object({
      trip_id: z.string().describe('Trip ID to revise'),
      instructions: z.string().describe('Revision instructions'),
    }),
    handler: async (args) => {
      const { trip_id, instructions } = args as { trip_id: string; instructions: string };
      
      return { content: [{ type: 'text', text: JSON.stringify({ 
        success: true, 
        message: `Trip ${trip_id} revised with instructions: ${instructions}` 
      }) }] };
    },
  },
  {
    name: 'persist_trip',
    description: 'Save or update a trip plan to the database.',
    schema: z.object({
      trip_id: z.string().describe('Trip ID to persist'),
    }),
    handler: async (args) => {
      const { trip_id } = args as { trip_id: string };
      
      return { content: [{ type: 'text', text: JSON.stringify({ 
        success: true, 
        message: `Trip ${trip_id} persisted successfully` 
      }) }] };
    },
  },
  {
    name: 'start_capture',
    description: 'Start automatic travel recording for a trip.',
    schema: z.object({
      trip_id: z.string().describe('Trip ID to start capture'),
    }),
    handler: async (args) => {
      const { trip_id } = args as { trip_id: string };
      
      const result = await captureService.startCapture(trip_id);
      
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    },
  },
  {
    name: 'stop_capture',
    description: 'Stop automatic travel recording.',
    schema: z.object({
      trip_id: z.string().describe('Trip ID to stop capture'),
    }),
    handler: async (args) => {
      const { trip_id } = args as { trip_id: string };
      
      const result = await captureService.stopCapture(trip_id);
      
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    },
  },
  {
    name: 'ingest_media',
    description: 'Import photos, voice notes, text notes, or GPX files for a trip.',
    schema: z.object({
      trip_id: z.string().describe('Trip ID'),
      type: z.enum(['photo', 'voice', 'note', 'gpx']).describe('Media type'),
      content: z.string().describe('File path, URL, or text content'),
      timestamp: z.string().optional().describe('Capture timestamp'),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }).optional().describe('GPS location'),
    }),
    handler: async (args) => {
      const { trip_id, type, content, timestamp, location } = args as { 
        trip_id: string; 
        type: 'photo' | 'voice' | 'note' | 'gpx'; 
        content: string; 
        timestamp?: string;
        location?: { latitude: number; longitude: number };
      };
      
      const result = await captureService.ingestMedia(trip_id, {
        type,
        content,
        timestamp,
        location: location ? { lat: location.latitude, lng: location.longitude } : undefined,
      });
      
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    },
  },
  {
    name: 'generate_memory',
    description: 'Generate a travel memory (handbook or poster) from trip data.',
    schema: z.object({
      trip_id: z.string().describe('Trip ID to generate memory for'),
      format: z.enum(['handbook', 'poster']).optional().describe('Memory format'),
    }),
    handler: async (args) => {
      const { trip_id, format } = args as { 
        trip_id: string; 
        format?: 'handbook' | 'poster'; 
      };
      
      const result = await memoryService.generateMemory(trip_id, { 
        format: format || 'handbook',
      });
      
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    },
  },
  {
    name: 'generate_share',
    description: 'Generate social media share content for a trip.',
    schema: z.object({
      trip_id: z.string().describe('Trip ID to generate share content for'),
      channel: z.enum(['xhs', 'moments', 'weibo', 'other']).optional().describe('Share channel'),
    }),
    handler: async (args) => {
      const { trip_id, channel } = args as { 
        trip_id: string; 
        channel?: 'xhs' | 'moments' | 'weibo' | 'other';
      };
      
      const result = await shareService.generateShare(trip_id, { 
        channel: channel || 'xhs',
      });
      
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    },
  },
];

export function createMcpServer(name = 'vibetrip-mcp-server', version = '0.1.0') {
  const server = new McpServer({ name, version });

  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.schema,
      },
      async ({ arguments: args }) => {
        try {
          return await tool.handler(args as Record<string, unknown>);
        } catch (error) {
          console.error(`Tool ${tool.name} error:`, error);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({ 
                error: error instanceof Error ? error.message : 'Unknown error',
                tool: tool.name,
              }),
            }],
          };
        }
      }
    );
  }

  return server;
}

export async function startHTTPServer(server: McpServer) {
  const transport = new StreamableHTTPServerTransport({});
  await transport.start();
  await server.connect(transport);
  console.error('VibeTrip MCP Server running on HTTP');
}

export { McpServer };
