// tests/observability.test.ts
/**
 * Suite de Pruebas de Observabilidad Mínima, Seguridad STRIDE, Migraciones Reversibles
 * y Cumplimiento LOPNNA (Laboratorio 7 — Definition of Done v1.0, ATRIL v5.0).
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  createCorrelationId,
  findLogsByCorrelationId,
  getMetricsSnapshot,
  logger,
  resetObservabilityState,
  sanitizeLogMetadata,
} from '../src/lib/logger';
import {
  checkLiveness,
  checkReadiness,
  getOperationalMetrics,
} from '../src/services/healthService';
import {
  AVISO_LEGAL_LOPNNA_MENORES,
  AVISO_LEGAL_LOPNNA_TITULO,
  MENSAJE_GUIA_EDAD_ESTUDIANTE,
} from '../src/constants/lopnna';
import { createStagingServer } from '../server/stagingServer.mjs';
import { testDb } from './supabase-test-db';

describe('4. OBSERVABILIDAD MÍNIMA, LOPNNA Y DOD OPERATIVA — ATRIL v5.0 (Lab 7)', () => {
  beforeEach(() => {
    testDb.reset();
    resetObservabilityState();
  });

  it('CU-014: logger estructurado emite eventos con correlationId y redacta PII/secretos (LOPNNA y STRIDE)', () => {
    const corrId = createCorrelationId('test');
    assert.match(corrId, /^test-[a-z0-9]+-[a-f0-9]{8}$/);

    const sanitized = sanitizeLogMetadata({
      userId: 'usr-123',
      email: 'menor.prueba@example.org',
      cedula_identidad: 'V-30123456',
      telefono: '+58 412-0001122',
      password: 'SecretPassword123!',
      nombre_representante: 'Carolina Mendoza',
      notaLibre: 'Contacto usuario@correo.com con jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.firma',
    });

    assert.ok(sanitized);
    assert.equal(sanitized.userId, 'usr-123');
    assert.equal(sanitized.email, '[REDACTED]');
    assert.equal(sanitized.cedula_identidad, '[REDACTED]');
    assert.equal(sanitized.telefono, '[REDACTED]');
    assert.equal(sanitized.password, '[REDACTED]');
    assert.equal(sanitized.nombre_representante, '[REDACTED]');
    assert.match(String(sanitized.notaLibre), /\[REDACTED_EMAIL\]/);
    assert.match(String(sanitized.notaLibre), /\[REDACTED_JWT\]/);

    logger.info({
      flow: 'auth_signup',
      action: 'registro_verificado',
      correlationId: corrId,
      status: 'ok',
      durationMs: 12.5,
      metadata: { userId: 'usr-123', email: 'oculto@example.org' },
    });

    const encontrados = findLogsByCorrelationId(corrId);
    assert.equal(encontrados.length, 1);
    assert.equal(encontrados[0].correlationId, corrId);
    assert.equal(encontrados[0].metadata?.email, '[REDACTED]');

    const snap = getMetricsSnapshot();
    assert.equal(snap.requestsTotal, 1);
    assert.equal(snap.errorsTotal, 0);
    assert.equal(snap.p95LatencyMs, 12.5);
  });

  it('CU-015: checkLiveness (/health) y checkReadiness (/ready) reportan 200 OK y detectan fallo de configuración (503)', async () => {
    const liveness = checkLiveness('hlth-unit-001');
    assert.equal(liveness.status, 'ok');
    assert.equal(liveness.service, 'atril-v5');
    assert.equal(liveness.correlationId, 'hlth-unit-001');

    const readyOk = await checkReadiness({
      correlationId: 'rdy-unit-ok',
      envOverride: {
        EXPO_PUBLIC_SUPABASE_URL: 'https://staging-demo.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'synthetic_valid_key_length_for_testing_123456',
        ATRIL_ENV: 'staging',
      },
    });
    assert.equal(readyOk.status, 'ready');
    assert.equal(readyOk.httpStatus, 200);
    assert.equal(readyOk.checks.envConfig.ok, true);
    assert.equal(readyOk.checks.database.ok, true);

    const readyFail = await checkReadiness({
      correlationId: 'rdy-unit-fail',
      envOverride: {
        EXPO_PUBLIC_SUPABASE_URL: '',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: '',
        ATRIL_ENV: 'staging',
      },
    });
    assert.equal(readyFail.status, 'not_ready');
    assert.equal(readyFail.httpStatus, 503);
    assert.equal(readyFail.checks.envConfig.ok, false);

    const metrics = getOperationalMetrics('mtr-unit-001');
    assert.equal(metrics.correlationId, 'mtr-unit-001');
    assert.ok(metrics.requestsTotal >= 2);
  });

  it('CU-016: Aviso legal LOPNNA informa explícitamente el fundamento legal del representante para menores de 18 años', () => {
    assert.match(AVISO_LEGAL_LOPNNA_TITULO, /LOPNNA/i);
    assert.match(AVISO_LEGAL_LOPNNA_MENORES, /Ley Orgánica para la Protección de Niños, Niñas y Adolescentes/i);
    assert.match(AVISO_LEGAL_LOPNNA_MENORES, /menores de 18 años/i);
    assert.match(AVISO_LEGAL_LOPNNA_MENORES, /representante legal/i);
    assert.match(MENSAJE_GUIA_EDAD_ESTUDIANTE, /LOPNNA/i);
  });

  it('CI-008 y CI-009: Servidor staging responde /health, /ready, /metrics y permite diagnosticar error provocado (Prueba de Campo)', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atril-lab7-'));
    const logPath = path.join(tmpDir, 'staging-test.ndjson');

    const { server } = createStagingServer({
      env: {
        EXPO_PUBLIC_SUPABASE_URL: 'https://staging-demo.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'synthetic_valid_key_length_for_testing_123456',
        ATRIL_ENV: 'staging',
        ATRIL_ENABLE_FIELD_TEST: '1',
      },
      logFile: logPath,
      silentStdout: true,
    });

    await new Promise<void>((resolveListen) => {
      server.listen(0, '127.0.0.1', () => resolveListen());
    });

    try {
      const addr = server.address();
      assert.ok(addr && typeof addr !== 'string');
      const baseUrl = `http://127.0.0.1:${addr.port}`;

      // 1. /health
      const resHealth = await fetch(`${baseUrl}/health`);
      assert.equal(resHealth.status, 200);
      const corrHealth = resHealth.headers.get('x-correlation-id');
      assert.ok(corrHealth);
      const bodyHealth = (await resHealth.json()) as Record<string, unknown>;
      assert.equal(bodyHealth.status, 'ok');
      assert.equal(bodyHealth.correlationId, corrHealth);

      // 2. /ready
      const resReady = await fetch(`${baseUrl}/ready`);
      assert.equal(resReady.status, 200);
      const bodyReady = (await resReady.json()) as Record<string, unknown>;
      assert.equal(bodyReady.status, 'ready');

      // 3. Prueba de campo: provocar error controlado HTTP 500 con correlationId propio
      const corrField = 'fieldtest-lab7-001';
      const resErr = await fetch(`${baseUrl}/api/debug/simulate-error`, {
        headers: { 'X-Correlation-Id': corrField },
      });
      assert.equal(resErr.status, 500);
      const bodyErr = (await resErr.json()) as Record<string, unknown>;
      assert.equal(bodyErr.errorCode, 'ATRIL_FIELD_TEST_500');
      assert.equal(bodyErr.correlationId, corrField);

      // 4. Comprobar diagnóstico en archivo de logs estructurados usando únicamente el correlationId
      const rawLines = fs
        .readFileSync(logPath, 'utf8')
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line) as Record<string, unknown>);
      const diagnosticLog = rawLines.find(
        (entry) => entry.correlationId === corrField && entry.level === 'error'
      );
      assert.ok(diagnosticLog, 'El log estructurado debe registrar el error bajo el correlationId exacto');
      assert.equal(diagnosticLog.statusCode, 500);
      assert.equal(diagnosticLog.flow, 'staging_field_test');
      const errObj = diagnosticLog.error as Record<string, unknown>;
      assert.equal(errObj.code, 'ATRIL_FIELD_TEST_500');

      // 5. /metrics refleja la solicitud con error
      const resMetrics = await fetch(`${baseUrl}/metrics`);
      assert.equal(resMetrics.status, 200);
      const bodyMetrics = (await resMetrics.json()) as Record<string, unknown>;
      assert.ok(Number(bodyMetrics.requestsTotal) >= 3);
      assert.equal(bodyMetrics.errorsTotal, 1);
    } finally {
      await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('CI-010: Artefactos estructurales de la DoD (migraciones UP/DOWN, RLS STRIDE, PR template y RUNBOOK) existen y son consistentes', () => {
    const rootDir = process.cwd();

    const upV5 = path.join(rootDir, 'supabase/migrations/20261118_v5_mvp_verification_chat.sql');
    const downV5 = path.join(rootDir, 'supabase/migrations/20261118_v5_mvp_verification_chat.down.sql');
    const upStride = path.join(rootDir, 'supabase/migrations/20261122_v5_stride_rls_hardening.sql');
    const downStride = path.join(rootDir, 'supabase/migrations/20261122_v5_stride_rls_hardening.down.sql');
    const prTemplate = path.join(rootDir, '.github/PULL_REQUEST_TEMPLATE.md');
    const runbook = path.join(rootDir, 'RUNBOOK.md');

    for (const file of [upV5, downV5, upStride, downStride, prTemplate, runbook]) {
      assert.equal(fs.existsSync(file), true, `Debe existir el artefacto DoD: ${file}`);
    }

    const sqlUp = fs.readFileSync(upV5, 'utf8');
    const sqlDown = fs.readFileSync(downV5, 'utf8');
    const sqlStride = fs.readFileSync(upStride, 'utf8');

    assert.match(sqlUp, /CREATE TABLE IF NOT EXISTS public\.conversaciones/i);
    assert.match(sqlUp, /CREATE TABLE IF NOT EXISTS public\.mensajes/i);
    assert.match(sqlDown, /DROP TABLE IF EXISTS public\.mensajes/i);
    assert.match(sqlDown, /DROP TABLE IF EXISTS public\.conversaciones/i);
    const sqlStrideExecutable = sqlStride
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');
    assert.doesNotMatch(
      sqlStrideExecutable,
      /\bOR TRUE\b/i,
      'La mitigación STRIDE debe eliminar la cláusula permisiva OR TRUE'
    );
  });
});
