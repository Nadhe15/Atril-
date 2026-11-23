// src/services/healthService.ts
/**
 * Servicio de Salud y Preparación Operativa (/health y /ready) — ATRIL v5.0
 * Provee contratos verificables para probes de liveness, readiness y métricas básicas.
 */
import { supabase } from '../lib/supabase';
import {
  createCorrelationId,
  getMetricsSnapshot,
  logger,
} from '../lib/logger';
import type { OperationalMetricsSnapshot } from '../lib/logger';

export interface LivenessReport {
  status: 'ok';
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  correlationId: string;
}

export interface ReadinessCheckItem {
  ok: boolean;
  detail: string;
}

export interface ReadinessReport {
  status: 'ready' | 'not_ready';
  httpStatus: 200 | 503;
  service: string;
  version: string;
  environment: string;
  checks: {
    envConfig: ReadinessCheckItem;
    database: ReadinessCheckItem;
  };
  latencyMs: number;
  timestamp: string;
  correlationId: string;
}

export interface ReadinessOptions {
  correlationId?: string;
  envOverride?: Record<string, string | undefined>;
  skipRemoteDbProbe?: boolean;
}

const PROCESS_STARTED_AT = Date.now();

function getEnvironmentName(envOverride?: Record<string, string | undefined>): string {
  const source =
    envOverride ??
    (typeof process !== 'undefined' && process.env ? process.env : {});
  if (source.ATRIL_TEST_MODE === '1') return 'test';
  return source.ATRIL_ENV || source.NODE_ENV || 'staging';
}

/**
 * Liveness Probe (`GET /health`):
 * Confirma que el proceso y el runtime de ATRIL v5.0 responden correctamente.
 */
export function checkLiveness(
  correlationId: string = createCorrelationId('hlth')
): LivenessReport {
  const uptimeSeconds = Math.max(
    0,
    Math.floor((Date.now() - PROCESS_STARTED_AT) / 1000)
  );
  const report: LivenessReport = {
    status: 'ok',
    service: 'atril-v5',
    version: '5.0.0',
    environment: getEnvironmentName(),
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    correlationId,
  };

  logger.info({
    flow: 'observability',
    action: 'health_check',
    correlationId,
    status: 'ok',
    durationMs: 0.5,
    metadata: { uptimeSeconds },
  });

  return report;
}

/**
 * Readiness Probe (`GET /ready`):
 * Verifica que las variables de entorno requeridas estén presentes y que la capa
 * de datos (Supabase / BD de pruebas) responda dentro de los umbrales operativos.
 */
export async function checkReadiness(
  options: ReadinessOptions = {}
): Promise<ReadinessReport> {
  const started = Date.now();
  const correlationId = options.correlationId || createCorrelationId('rdy');
  const envSource =
    options.envOverride ??
    (typeof process !== 'undefined' && process.env ? process.env : {});

  const supabaseUrl = envSource.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
  const supabaseAnonKey = envSource.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
  const isTestMode = envSource.ATRIL_TEST_MODE === '1';

  const hasValidUrl =
    isTestMode ||
    (supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co'));
  const hasValidKey = isTestMode || supabaseAnonKey.length >= 16;

  const envConfigOk = hasValidUrl && hasValidKey;
  const envConfigCheck: ReadinessCheckItem = {
    ok: envConfigOk,
    detail: envConfigOk
      ? 'Variables EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY configuradas.'
      : 'Faltan variables EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY válidas.',
  };

  let databaseCheck: ReadinessCheckItem;
  if (!envConfigOk) {
    databaseCheck = {
      ok: false,
      detail: 'Consulta a base de datos omitida por configuración incompleta.',
    };
  } else if (options.skipRemoteDbProbe) {
    databaseCheck = {
      ok: true,
      detail: 'Sonda remota omitida por modo de verificación local controlada.',
    };
  } else {
    try {
      const { error } = await supabase
        .from('perfiles_profesores')
        .select('id')
        .eq('verificado_fundaoboe', true);

      if (error) {
        databaseCheck = {
          ok: false,
          detail: `Supabase respondió con error: ${error.message}`,
        };
      } else {
        databaseCheck = {
          ok: true,
          detail: 'Conexión y consulta a catálogo en Supabase/PostgreSQL operativa.',
        };
      }
    } catch (err: unknown) {
      databaseCheck = {
        ok: false,
        detail:
          err instanceof Error
            ? `Fallo de conectividad hacia Supabase: ${err.message}`
            : 'Fallo inesperado consultando Supabase.',
      };
    }
  }

  const allReady = envConfigCheck.ok && databaseCheck.ok;
  const latencyMs = Math.max(0, Date.now() - started);

  const report: ReadinessReport = {
    status: allReady ? 'ready' : 'not_ready',
    httpStatus: allReady ? 200 : 503,
    service: 'atril-v5',
    version: '5.0.0',
    environment: getEnvironmentName(options.envOverride),
    checks: {
      envConfig: envConfigCheck,
      database: databaseCheck,
    },
    latencyMs,
    timestamp: new Date().toISOString(),
    correlationId,
  };

  if (allReady) {
    logger.info({
      flow: 'observability',
      action: 'readiness_check',
      correlationId,
      status: 'ok',
      durationMs: latencyMs,
      metadata: { status: report.status },
    });
  } else {
    logger.warn({
      flow: 'observability',
      action: 'readiness_check',
      correlationId,
      status: 'error',
      durationMs: latencyMs,
      metadata: {
        status: report.status,
        envOk: envConfigCheck.ok,
        dbOk: databaseCheck.ok,
      },
    });
  }

  return report;
}

export function getOperationalMetrics(
  correlationId: string = createCorrelationId('mtr')
): OperationalMetricsSnapshot & { correlationId: string } {
  const snapshot = getMetricsSnapshot();
  return {
    ...snapshot,
    correlationId,
  };
}
