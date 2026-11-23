# ADR-002: Observabilidad Mínima (`/health`, `/ready` y Logs Estructurados JSON) en Expo Web + Supabase

- **Fecha:** 2026-11-22
- **Estado:** Aceptado
- **Autores:** Equipo 2 (Samuel Sanabria, José Torbet, Nadheska García, Ernesto Barreto)

## Contexto
ATRIL v5.0 utiliza Expo / React Native (con compilación estática web `dist/`) acoplado a Supabase (BaaS) sin un backend monolítico tradicional. La Definition of Done operativa del Laboratorio 7 exige logs estructurados con ID de correlación en flujos críticos, endpoints `/health` y `/ready`, métricas básicas y capacidad de diagnosticar incidentes en staging sin introducir dependencias externas pesadas ni exponer datos personales (PII/LOPNNA).

## Decisión
1. **Logger estructurado isomórfico (`src/lib/logger.ts`):** Emite eventos JSON de una línea con `correlationId`, `flow`, `action`, `status`, `durationMs` y aplica redacción automática de PII/secretos (`email`, `cedula`, `telefono`, `password`, `token`, `representante`).
2. **Contrato compartido de salud (`src/services/healthService.ts`):** Implementa `checkLiveness()`, `checkReadiness()` y `getOperationalMetrics()` reutilizables en pruebas y cliente.
3. **Servidor liviano de Staging (`server/stagingServer.mjs`):** Construido exclusivamente con módulos nativos de Node.js (`node:http`, `node:fs`, `node:path`) para servir el bundle Expo Web (`dist/`) y exponer `GET /health`, `GET /ready`, `GET /metrics` y el encabezado `X-Correlation-Id`, además de un endpoint controlado de prueba de campo (`/api/debug/simulate-error`) deshabilitado por defecto salvo `ATRIL_ENABLE_FIELD_TEST=1`.

## Consecuencias
- **Positivas:** Cero dependencias nuevas en `package.json` (cero superficie adicional de vulnerabilidades npm), trazabilidad inmediata por `correlationId` y verificabilidad total en CI y staging.
- **Compromisos:** Las métricas en memoria son por instancia; para múltiples réplicas en producción futura (Sprint 2+) se exportarán hacia Prometheus/Grafana o Logtail.
