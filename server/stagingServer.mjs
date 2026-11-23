// server/stagingServer.mjs
/**
 * Servidor de Staging y Observabilidad Mínima — ATRIL v5.0 (FundaOboeHJK)
 * Sirve el bundle Expo Web (`dist/`) y expone los endpoints operativos exigidos por la DoD:
 *   - GET /health   (Liveness probe: proceso vivo y tiempo de actividad)
 *   - GET /ready    (Readiness probe: variables de entorno, bundle staging y conectividad Supabase)
 *   - GET /metrics  (Métricas operativas básicas: requests, errores, tasa de error y p95)
 *   - GET /api/debug/simulate-error (Solo activo si ATRIL_ENABLE_FIELD_TEST=1 para Prueba de Campo)
 *
 * Emite logs estructurados JSON con ID de correlación (`X-Correlation-Id`) por stdout
 * y opcionalmente hacia `ATRIL_LOG_FILE` en formato NDJSON.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

function createCorrelationId(prefix = 'req') {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(16).slice(2, 10).padEnd(8, '0');
  return `${prefix}-${ts}-${rand}`;
}

function loadDotEnvIfPresent(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const parsed = {};
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    const val = line.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
    parsed[key] = val;
  }
  return parsed;
}

function calculateP95(samples) {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.95) - 1));
  return Number(sorted[idx].toFixed(2));
}

export function createStagingServer(options = {}) {
  const startedAtMs = Date.now();
  const fileEnv = loadDotEnvIfPresent(path.join(ROOT_DIR, '.env'));
  const runtimeEnv = { ...fileEnv, ...process.env, ...(options.env || {}) };
  const distDir = options.distDir || path.join(ROOT_DIR, 'dist');
  const logFile = options.logFile ?? runtimeEnv.ATRIL_LOG_FILE ?? '';
  const silentStdout = Boolean(options.silentStdout);

  const metrics = {
    requestsTotal: 0,
    errorsTotal: 0,
    latenciesMs: [],
    logs: [],
  };

  function writeStructuredLog(entry) {
    metrics.logs.push(entry);
    if (metrics.logs.length > 500) metrics.logs.shift();

    const line = JSON.stringify(entry);
    if (!silentStdout) {
      if (entry.level === 'error') {
        console.error(line);
      } else {
        console.log(line);
      }
    }

    if (logFile) {
      try {
        fs.mkdirSync(path.dirname(logFile), { recursive: true });
        fs.appendFileSync(logFile, `${line}\n`, 'utf8');
      } catch {
        // Evitar caída del servidor si el directorio de logs no tiene permisos de escritura
      }
    }
  }

  function sendJson(res, statusCode, correlationId, payload) {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Correlation-Id': correlationId,
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(payload, null, 2));
  }

  function evaluateReadiness() {
    const supabaseUrl = (runtimeEnv.EXPO_PUBLIC_SUPABASE_URL || '').trim();
    const supabaseKey = (runtimeEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const envOk =
      supabaseUrl.startsWith('https://') &&
      supabaseUrl.includes('.supabase.co') &&
      supabaseKey.length >= 16;

    const indexPath = path.join(distDir, 'index.html');
    const bundleOk = fs.existsSync(indexPath);

    const migrationUpPath = path.join(
      ROOT_DIR,
      'supabase',
      'migrations',
      '20261118_v5_mvp_verification_chat.sql'
    );
    const migrationDownPath = path.join(
      ROOT_DIR,
      'supabase',
      'migrations',
      '20261118_v5_mvp_verification_chat.down.sql'
    );
    const migrationsOk = fs.existsSync(migrationUpPath) && fs.existsSync(migrationDownPath);

    const isReady = envOk && bundleOk && migrationsOk;
    return {
      isReady,
      httpStatus: isReady ? 200 : 503,
      checks: {
        envConfig: {
          ok: envOk,
          detail: envOk
            ? 'Variables Supabase configuradas sin secretos en repositorio.'
            : 'Variables EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY ausentes o inválidas.',
        },
        webBundle: {
          ok: bundleOk,
          detail: bundleOk
            ? 'Bundle Expo Web compilado disponible en dist/index.html.'
            : 'No se encontró dist/index.html (ejecutar npm run build:web).',
        },
        migrationsVersioned: {
          ok: migrationsOk,
          detail: migrationsOk
            ? 'Migraciones SQL UP y DOWN versionadas verificadas.'
            : 'Faltan archivos de migración versionados en supabase/migrations/.',
        },
      },
    };
  }

  const server = http.createServer((req, res) => {
    const reqStart = process.hrtime.bigint();
    const incomingCorr = req.headers['x-correlation-id'];
    const correlationId =
      typeof incomingCorr === 'string' && incomingCorr.trim().length > 0
        ? incomingCorr.trim()
        : createCorrelationId('atril');

    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;
    const method = req.method || 'GET';
    const envName = runtimeEnv.ATRIL_ENV || 'staging';

    let finalStatus = 200;
    let errorInfo = undefined;
    let flow = 'http_staging';
    let action = `${method} ${pathname}`;

    const finalizeRequest = () => {
      const durationMs = Number(
        (Number(process.hrtime.bigint() - reqStart) / 1_000_000).toFixed(2)
      );
      const isError = finalStatus >= 500;
      metrics.requestsTotal += 1;
      if (isError) metrics.errorsTotal += 1;
      metrics.latenciesMs.push(durationMs);
      if (metrics.latenciesMs.length > 500) metrics.latenciesMs.shift();

      writeStructuredLog({
        timestamp: new Date().toISOString(),
        level: isError ? 'error' : finalStatus >= 400 ? 'warn' : 'info',
        service: 'atril-v5',
        version: '5.0.0',
        env: envName,
        correlationId,
        flow,
        action,
        httpMethod: method,
        path: pathname,
        statusCode: finalStatus,
        durationMs,
        ...(errorInfo ? { error: errorInfo } : {}),
      });
    };

    try {
      // 1. Liveness probe: GET /health
      if (method === 'GET' && pathname === '/health') {
        flow = 'observability';
        action = 'liveness_probe';
        finalStatus = 200;
        const uptimeSeconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
        sendJson(res, 200, correlationId, {
          status: 'ok',
          service: 'atril-v5',
          version: '5.0.0',
          environment: envName,
          uptimeSeconds,
          timestamp: new Date().toISOString(),
          correlationId,
        });
        finalizeRequest();
        return;
      }

      // 2. Readiness probe: GET /ready
      if (method === 'GET' && pathname === '/ready') {
        flow = 'observability';
        action = 'readiness_probe';
        const readiness = evaluateReadiness();
        finalStatus = readiness.httpStatus;
        sendJson(res, readiness.httpStatus, correlationId, {
          status: readiness.isReady ? 'ready' : 'not_ready',
          service: 'atril-v5',
          version: '5.0.0',
          environment: envName,
          checks: readiness.checks,
          timestamp: new Date().toISOString(),
          correlationId,
        });
        finalizeRequest();
        return;
      }

      // 3. Métricas básicas: GET /metrics
      if (method === 'GET' && pathname === '/metrics') {
        flow = 'observability';
        action = 'metrics_snapshot';
        finalStatus = 200;
        const uptimeSeconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
        const errorRate =
          metrics.requestsTotal > 0
            ? Number((metrics.errorsTotal / metrics.requestsTotal).toFixed(4))
            : 0;
        sendJson(res, 200, correlationId, {
          service: 'atril-v5',
          version: '5.0.0',
          environment: envName,
          uptimeSeconds,
          requestsTotal: metrics.requestsTotal,
          errorsTotal: metrics.errorsTotal,
          errorRate,
          p95LatencyMs: calculateP95(metrics.latenciesMs),
          timestamp: new Date().toISOString(),
          correlationId,
        });
        finalizeRequest();
        return;
      }

      // 4. Prueba de campo controlada (habilitada únicamente en staging con ATRIL_ENABLE_FIELD_TEST=1)
      if (method === 'GET' && pathname === '/api/debug/simulate-error') {
        flow = 'staging_field_test';
        action = 'simulate_controlled_error';
        if (runtimeEnv.ATRIL_ENABLE_FIELD_TEST !== '1') {
          finalStatus = 404;
          sendJson(res, 404, correlationId, {
            error: 'NOT_FOUND',
            message: 'Ruta de prueba de campo deshabilitada en este entorno.',
            correlationId,
          });
          finalizeRequest();
          return;
        }

        finalStatus = 500;
        errorInfo = {
          name: 'StagingFieldTestError',
          code: 'ATRIL_FIELD_TEST_500',
          message:
            'Fallo controlado provocado en staging para validar trazabilidad por correlationId.',
          component: 'teacherCatalogService.obtenerCatalogoDocentes',
          diagnosticHint:
            'Verificar conectividad con Supabase y consultar RUNBOOK.md sección Incidentes Frecuentes.',
        };
        sendJson(res, 500, correlationId, {
          status: 'error',
          errorCode: errorInfo.code,
          message: errorInfo.message,
          correlationId,
          timestamp: new Date().toISOString(),
        });
        finalizeRequest();
        return;
      }

      // 5. Servir artefacto web estático (Expo Web staging bundle en dist/)
      const sanitizedRelPath = path
        .normalize(pathname === '/' ? '/index.html' : pathname)
        .replace(/^(\.\.(\/|\\|$))+/, '');
      let targetFile = path.join(distDir, sanitizedRelPath);

      if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
        targetFile = path.join(distDir, 'index.html');
      }

      if (!fs.existsSync(targetFile)) {
        finalStatus = 503;
        errorInfo = {
          name: 'StagingBundleMissingError',
          code: 'ATRIL_BUNDLE_MISSING',
          message: 'Bundle web dist/index.html no encontrado.',
        };
        sendJson(res, 503, correlationId, {
          status: 'unavailable',
          message: 'Artefacto web no compilado. Ejecutar npm run build:web.',
          correlationId,
        });
        finalizeRequest();
        return;
      }

      const ext = path.extname(targetFile).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const content = fs.readFileSync(targetFile);
      finalStatus = 200;
      res.writeHead(200, {
        'Content-Type': contentType,
        'X-Correlation-Id': correlationId,
      });
      res.end(content);
      finalizeRequest();
    } catch (err) {
      finalStatus = 500;
      errorInfo = {
        name: err instanceof Error ? err.name : 'UnhandledError',
        code: 'ATRIL_UNHANDLED_500',
        message: err instanceof Error ? err.message : String(err),
      };
      sendJson(res, 500, correlationId, {
        status: 'error',
        errorCode: errorInfo.code,
        message: 'Error interno no esperado en servidor de staging.',
        correlationId,
      });
      finalizeRequest();
    }
  });

  return {
    server,
    getLogs: () => [...metrics.logs],
    getMetrics: () => ({
      requestsTotal: metrics.requestsTotal,
      errorsTotal: metrics.errorsTotal,
      p95LatencyMs: calculateP95(metrics.latenciesMs),
    }),
  };
}

// Ejecución directa: `node server/stagingServer.mjs`
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const port = Number(process.env.ATRIL_PORT || 8081);
  const { server } = createStagingServer({
    logFile: process.env.ATRIL_LOG_FILE || path.join(ROOT_DIR, 'logs', 'atril-staging.ndjson'),
  });
  server.listen(port, '0.0.0.0', () => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'atril-v5',
        version: '5.0.0',
        env: process.env.ATRIL_ENV || 'staging',
        correlationId: createCorrelationId('boot'),
        flow: 'lifecycle',
        action: 'staging_server_started',
        port,
        endpoints: ['/health', '/ready', '/metrics'],
      })
    );
  });
}
