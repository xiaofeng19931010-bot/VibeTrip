export enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  INVALID_INPUT = 'INVALID_INPUT',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  TRIP_NOT_FOUND = 'TRIP_NOT_FOUND',
  ITINERARY_NOT_FOUND = 'ITINERARY_NOT_FOUND',
  CAPTURE_NOT_FOUND = 'CAPTURE_NOT_FOUND',
  MEMORY_NOT_FOUND = 'MEMORY_NOT_FOUND',
  SHARE_NOT_FOUND = 'SHARE_NOT_FOUND',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  LLM_ERROR = 'LLM_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  MCP_ERROR = 'MCP_ERROR',
  CLI_ERROR = 'CLI_ERROR',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  traceId?: string;
}

export class VibeTripError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
    public readonly traceId?: string
  ) {
    super(message);
    this.name = 'VibeTripError';
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      traceId: this.traceId,
    };
  }
}

export function createError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  traceId?: string
): VibeTripError {
  return new VibeTripError(code, message, details, traceId);
}

export function isVibeTripError(error: unknown): error is VibeTripError {
  return error instanceof VibeTripError;
}

export function getErrorMessage(error: unknown): string {
  if (isVibeTripError(error)) {
    return `[${error.code}] ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
