import { randomUUID } from 'crypto';
import type { ActorType, AuditStatus } from '../repositories/audit-log.repository.js';
import { auditLogRepository } from '../repositories/audit-log.repository.js';
import { getCurrentTrace } from './trace.js';

export interface AuditContext {
  actorType: ActorType;
  actorId?: string;
  toolName?: string;
  tripId?: string;
}

export interface AuditEntry {
  traceId: string;
  actorType: ActorType;
  actorId?: string;
  toolName?: string;
  tripId?: string;
  status: AuditStatus;
  costMs?: number;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const trace = getCurrentTrace();

  await auditLogRepository.create({
    trace_id: entry.traceId || trace?.traceId || randomUUID(),
    actor_type: entry.actorType,
    actor_id: entry.actorId,
    tool_name: entry.toolName,
    trip_id: entry.tripId,
    status: entry.status,
    cost_ms: entry.costMs,
    metadata: entry.metadata,
  });
}

export async function auditToolCall(
  context: AuditContext,
  handler: () => Promise<unknown>
): Promise<unknown> {
  const startTime = Date.now();
  const trace = getCurrentTrace();

  try {
    const result = await handler();
    const costMs = Date.now() - startTime;

    await writeAuditLog({
      traceId: trace?.traceId || randomUUID(),
      actorType: context.actorType,
      actorId: context.actorId,
      toolName: context.toolName,
      tripId: context.tripId,
      status: 'success',
      costMs,
    });

    return result;
  } catch (error) {
    const costMs = Date.now() - startTime;

    await writeAuditLog({
      traceId: trace?.traceId || randomUUID(),
      actorType: context.actorType,
      actorId: context.actorId,
      toolName: context.toolName,
      tripId: context.tripId,
      status: 'error',
      costMs,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

export async function auditAccessDenied(
  context: AuditContext,
  reason: string
): Promise<void> {
  const trace = getCurrentTrace();

  await writeAuditLog({
    traceId: trace?.traceId || randomUUID(),
    actorType: context.actorType,
    actorId: context.actorId,
    toolName: context.toolName,
    tripId: context.tripId,
    status: 'denied',
    metadata: { reason },
  });
}

export async function getAuditTrail(tripId: string): Promise<{
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  deniedCalls: number;
  tools: Record<string, number>;
  totalCostMs: number;
}> {
  const logs = await auditLogRepository.findByTripId(tripId);

  const stats = {
    totalCalls: logs.length,
    successfulCalls: logs.filter(l => l.status === 'success').length,
    failedCalls: logs.filter(l => l.status === 'error').length,
    deniedCalls: logs.filter(l => l.status === 'denied').length,
    tools: {} as Record<string, number>,
    totalCostMs: 0,
  };

  for (const log of logs) {
    if (log.tool_name) {
      stats.tools[log.tool_name] = (stats.tools[log.tool_name] || 0) + 1;
    }
    if (log.cost_ms) {
      stats.totalCostMs += log.cost_ms;
    }
  }

  return stats;
}

export const auditService = {
  writeAuditLog,
  auditToolCall,
  auditAccessDenied,
  getAuditTrail,
};
