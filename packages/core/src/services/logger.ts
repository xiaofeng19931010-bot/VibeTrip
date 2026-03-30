export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  traceId?: string;
  toolName?: string;
  userKey?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface Metrics {
  requestCount: number;
  errorCount: number;
  totalLatencyMs: number;
  llmCallCount: number;
  llmCostMs: number;
  rateLimitHits: number;
}

const logs: LogEntry[] = [];
const metrics: Metrics = {
  requestCount: 0,
  errorCount: 0,
  totalLatencyMs: 0,
  llmCallCount: 0,
  llmCostMs: 0,
  rateLimitHits: 0,
};

export function log(
  level: LogLevel,
  message: string,
  context?: {
    traceId?: string;
    toolName?: string;
    userKey?: string;
    duration?: number;
    metadata?: Record<string, unknown>;
  }
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    traceId: context?.traceId,
    toolName: context?.toolName,
    userKey: context?.userKey,
    duration: context?.duration,
    metadata: context?.metadata,
  };

  logs.push(entry);

  if (logs.length > 10000) {
    logs.shift();
  }

  const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
  const contextStr = [
    entry.traceId ? `trace=${entry.traceId}` : '',
    entry.toolName ? `tool=${entry.toolName}` : '',
    entry.userKey ? `user=${entry.userKey}` : '',
    entry.duration ? `duration=${entry.duration}ms` : '',
  ].filter(Boolean).join(' ');

  const logMessage = `${prefix} ${message} ${contextStr}`.trim();

  if (level === 'error') {
    console.error(logMessage);
  } else if (level === 'warn') {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }
}

export function logRequest(
  toolName: string,
  traceId: string,
  userKey: string,
  durationMs: number
): void {
  metrics.requestCount++;
  metrics.totalLatencyMs += durationMs;

  log('info', `Request completed`, {
    traceId,
    toolName,
    userKey,
    duration: durationMs,
  });
}

export function logError(
  message: string,
  error: unknown,
  context?: {
    traceId?: string;
    toolName?: string;
    userKey?: string;
  }
): void {
  metrics.errorCount++;

  log('error', message, {
    ...context,
    metadata: {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
  });
}

export function logLLMCall(
  traceId: string,
  provider: string,
  costMs: number,
  success: boolean
): void {
  metrics.llmCallCount++;
  metrics.llmCostMs += costMs;

  log('info', `LLM call ${success ? 'succeeded' : 'failed'}`, {
    traceId,
    metadata: { provider, costMs },
  });
}

export function logRateLimitHit(userKey: string, endpoint: string): void {
  metrics.rateLimitHits++;

  log('warn', `Rate limit hit`, {
    userKey,
    metadata: { endpoint },
  });
}

export function getMetrics(): Metrics & { avgLatencyMs: number; errorRate: number } {
  return {
    ...metrics,
    avgLatencyMs: metrics.requestCount > 0
      ? metrics.totalLatencyMs / metrics.requestCount
      : 0,
    errorRate: metrics.requestCount > 0
      ? metrics.errorCount / metrics.requestCount
      : 0,
  };
}

export function getRecentLogs(count = 100): LogEntry[] {
  return logs.slice(-count);
}

export function getLogsByTraceId(traceId: string): LogEntry[] {
  return logs.filter(l => l.traceId === traceId);
}

export function resetMetrics(): void {
  metrics.requestCount = 0;
  metrics.errorCount = 0;
  metrics.totalLatencyMs = 0;
  metrics.llmCallCount = 0;
  metrics.llmCostMs = 0;
  metrics.rateLimitHits = 0;
}

export function resetLogs(): void {
  logs.length = 0;
}

export const logger = {
  log,
  logRequest,
  logError,
  logLLMCall,
  logRateLimitHit,
  getMetrics,
  getRecentLogs,
  getLogsByTraceId,
  resetMetrics,
  resetLogs,
};
