import { randomUUID } from 'crypto';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

let currentTraceContext: TraceContext | null = null;

export function generateTraceId(): string {
  return randomUUID();
}

export function generateSpanId(): string {
  return randomUUID().substring(0, 16);
}

export function startTrace(parentSpanId?: string): TraceContext {
  const traceId = generateTraceId();
  const spanId = generateSpanId();

  currentTraceContext = {
    traceId,
    spanId,
    parentSpanId,
  };

  return currentTraceContext;
}

export function getCurrentTrace(): TraceContext | null {
  return currentTraceContext;
}

export function setCurrentTrace(context: TraceContext): void {
  currentTraceContext = context;
}

export function createChildSpan(): TraceContext | null {
  if (!currentTraceContext) {
    return null;
  }

  const newSpanId = generateSpanId();

  return {
    traceId: currentTraceContext.traceId,
    spanId: newSpanId,
    parentSpanId: currentTraceContext.spanId,
  };
}

export function formatTraceHeader(context: TraceContext): string {
  return `trace-id=${context.traceId};span-id=${context.spanId}`;
}

export function parseTraceHeader(header: string): TraceContext | null {
  try {
    const parts = header.split(';');
    const tracePart = parts.find(p => p.startsWith('trace-id='));
    const spanPart = parts.find(p => p.startsWith('span-id='));

    const traceIdPart = tracePart?.split('=')[1];
  const spanIdPart = spanPart?.split('=')[1];

  if (!traceIdPart || !spanIdPart) {
    return null;
  }

  return {
    traceId: traceIdPart,
    spanId: spanIdPart,
  };
  } catch {
    return null;
  }
}
