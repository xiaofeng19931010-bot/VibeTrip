import { randomUUID } from 'crypto';
import { getGlobalSupabaseClient } from '../supabase/index.js';
import type { AuditLog } from '../schemas/index.js';
import { AuditLogSchema } from '../schemas/index.js';

export type ActorType = 'user' | 'system' | 'mcp' | 'cli';
export type AuditStatus = 'success' | 'error' | 'denied';

export interface CreateAuditLogInput {
  trace_id: string;
  actor_type: ActorType;
  actor_id?: string;
  tool_name?: string;
  trip_id?: string;
  status: AuditStatus;
  cost_ms?: number;
  metadata?: Record<string, unknown>;
}

export class AuditLogRepository {
  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const log = {
      id: randomUUID(),
      trace_id: input.trace_id,
      actor_type: input.actor_type,
      actor_id: input.actor_id ?? null,
      tool_name: input.tool_name ?? null,
      trip_id: input.trip_id ?? null,
      status: input.status,
      cost_ms: input.cost_ms ?? null,
      metadata: input.metadata ?? null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('audit_logs')
      .insert(log as never)
      .select()
      .single();

    if (error) throw error;

    return data as AuditLog;
  }

  async findByTraceId(traceId: string): Promise<AuditLog[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .eq('trace_id', traceId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []) as AuditLog[];
  }

  async findByTripId(tripId: string): Promise<AuditLog[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []) as AuditLog[];
  }

  async findByActorId(actorId: string): Promise<AuditLog[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .eq('actor_id', actorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as AuditLog[];
  }
}

export const auditLogRepository = new AuditLogRepository();
