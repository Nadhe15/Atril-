// src/lib/logger.ts
/**
 * Módulo de Observabilidad Mínima — ATRIL v5.0 (Laboratorio 7 / DoD Operativa)
 * Emite logs estructurados en formato JSON de una línea con:
 * - correlationId (ID de correlación trazable de punta a punta)
 * - Sanitización automática anti-PII y anti-secretos (cumplimiento STRIDE y LOPNNA)
 * - Contadores de métricas básicas (total, errores, tasa de error y latencia p95)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  version: string;
  env: string;
  correlationId: string;
  flow: string;
  action: string;
  status?: 'started' | 'ok' | 'denied' | 'error';
  durationMs?: number;
  actorRole?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    code?: string;
    message: string;
  };
}

export interface OperationalMetricsSnapshot {
  service: string;
  version: string;
  env: string;
  uptimeSeconds: number;
  requestsTotal: number;
  errorsTotal: number;
  errorRate: number;
  p95LatencyMs: number;
  recentLogsCount: number;
  timestamp: string;
}

const SERVICE_NAME = 'atril-v5';
const SERVICE_VERSION = '5.0.0';
const STARTED_AT_MS = Date.now();
const MAX_BUFFER_LOGS = 250;
const MAX_LATENCY_SAMPLES = 500;

const SENSITIVE_KEY_PATTERN =
  /(password|passwd|secret|token|apikey|api_key|anon_key|service_role|authorization|cedula|telefono|phone|email|correo|representante)/i;

const logRingBuffer: StructuredLogEntry[] = [];
const latencySamplesMs: number[] = [];
let requestsTotal = 0;
let errorsTotal = 0;

function getRuntimeEnv(): string {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.ATRIL_TEST_MODE === '1') return 'test';
    return process.env.ATRIL_ENV || process.env.NODE_ENV || 'staging';
  }
  return 'client';
}

function isSilentTestOutput(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.env?.ATRIL_TEST_MODE === '1' &&
    process.env?.ATRIL_LOG_STDOUT !== '1'
  );
}

/**
 * Genera un identificador de correlación único por operación/petición HTTP.
 * Formato: `atril-<timestamp36>-<8hex>`
 */
export function createCorrelationId(prefix = 'atril'): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(16).slice(2, 10).padEnd(8, '0');
  return `${prefix}-${ts}-${rand}`;
}

/**
 * Redacta claves sensibles (credenciales, secretos y PII de estudiantes/menores LOPNNA)
 * antes de emitir cualquier evento de log estructurado.
 */
export function sanitizeLogMetadata(
  input?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!input) return undefined;

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      clean[key] = '[REDACTED]';
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      clean[key] = sanitizeLogMetadata(value as Record<string, unknown>);
      continue;
    }

    if (typeof value === 'string') {
      // Redactar correos o tokens JWT si aparecieran incrustados en valores libres
      const maskedEmail = value.replace(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
        '[REDACTED_EMAIL]'
      );
      const maskedJwt = maskedEmail.replace(
        /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/g,
        '[REDACTED_JWT]'
      );
      clean[key] = maskedJwt;
      continue;
    }

    clean[key] = value;
  }
  return clean;
}

export function recordRequestMetric(durationMs: number, isError: boolean): void {
  requestsTotal += 1;
  if (isError) {
    errorsTotal += 1;
  }
  const safeDuration = Number.isFinite(durationMs) && durationMs >= 0 ? durationMs : 0;
  latencySamplesMs.push(safeDuration);
  if (latencySamplesMs.length > MAX_LATENCY_SAMPLES) {
    latencySamplesMs.shift();
  }
}

export function calculateP95(samples: readonly number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * 0.95) - 1)
  );
  return Number(sorted[index].toFixed(2));
}

export function getMetricsSnapshot(): OperationalMetricsSnapshot {
  const uptimeSeconds = Math.max(0, Math.floor((Date.now() - STARTED_AT_MS) / 1000));
  const errorRate =
    requestsTotal > 0 ? Number((errorsTotal / requestsTotal).toFixed(4)) : 0;

  return {
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    env: getRuntimeEnv(),
    uptimeSeconds,
    requestsTotal,
    errorsTotal,
    errorRate,
    p95LatencyMs: calculateP95(latencySamplesMs),
    recentLogsCount: logRingBuffer.length,
    timestamp: new Date().toISOString(),
  };
}

export function getRecentLogs(limit = 50): StructuredLogEntry[] {
  return logRingBuffer.slice(-Math.max(1, limit));
}

export function findLogsByCorrelationId(correlationId: string): StructuredLogEntry[] {
  if (!correlationId) return [];
  return logRingBuffer.filter((entry) => entry.correlationId === correlationId);
}

export function resetObservabilityState(): void {
  logRingBuffer.length = 0;
  latencySamplesMs.length = 0;
  requestsTotal = 0;
  errorsTotal = 0;
}

export interface LogParams {
  level: LogLevel;
  flow: string;
  action: string;
  correlationId?: string;
  status?: 'started' | 'ok' | 'denied' | 'error';
  durationMs?: number;
  actorRole?: string;
  metadata?: Record<string, unknown>;
  error?: unknown;
  errorCode?: string;
}

export function emitStructuredLog(params: LogParams): StructuredLogEntry {
  const correlationId = params.correlationId || createCorrelationId();

  let errorPayload: StructuredLogEntry['error'];
  if (params.error !== undefined) {
    if (params.error instanceof Error) {
      errorPayload = {
        name: params.error.name || 'Error',
        code: params.errorCode,
        message: params.error.message,
      };
    } else {
      errorPayload = {
        name: 'Error',
        code: params.errorCode,
        message: String(params.error),
      };
    }
  }

  const entry: StructuredLogEntry = {
    timestamp: new Date().toISOString(),
    level: params.level,
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    env: getRuntimeEnv(),
    correlationId,
    flow: params.flow,
    action: params.action,
    ...(params.status ? { status: params.status } : {}),
    ...(params.durationMs !== undefined
      ? { durationMs: Number(params.durationMs.toFixed(2)) }
      : {}),
    ...(params.actorRole ? { actorRole: params.actorRole } : {}),
    ...(params.metadata ? { metadata: sanitizeLogMetadata(params.metadata) } : {}),
    ...(errorPayload ? { error: errorPayload } : {}),
  };

  logRingBuffer.push(entry);
  if (logRingBuffer.length > MAX_BUFFER_LOGS) {
    logRingBuffer.shift();
  }

  if (params.durationMs !== undefined) {
    recordRequestMetric(
      params.durationMs,
      params.level === 'error' || params.status === 'error'
    );
  }

  if (!isSilentTestOutput()) {
    const serialized = JSON.stringify(entry);
    if (params.level === 'error') {
      console.error(serialized);
    } else if (params.level === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }

  return entry;
}

export const logger = {
  info(params: Omit<LogParams, 'level'>): StructuredLogEntry {
    return emitStructuredLog({ ...params, level: 'info' });
  },
  warn(params: Omit<LogParams, 'level'>): StructuredLogEntry {
    return emitStructuredLog({ ...params, level: 'warn' });
  },
  error(params: Omit<LogParams, 'level'>): StructuredLogEntry {
    return emitStructuredLog({ ...params, level: 'error' });
  },
  debug(params: Omit<LogParams, 'level'>): StructuredLogEntry {
    return emitStructuredLog({ ...params, level: 'debug' });
  },
};
