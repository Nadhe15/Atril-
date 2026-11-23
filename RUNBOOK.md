# RUNBOOK v0 (Una Página) — ATRIL v5.0 (FundaOboeHJK)

> **Propósito:** Guía operativa autosuficiente para verificar salud, diagnosticar incidentes con `correlationId`, reiniciar, ejecutar rollback y rotar secretos en ATRIL v5.0, diseñada para que cualquier integrante (o quien no conozca el sistema) pueda operarlo en minutos.

---

## 1. Ficha del Servicio y Responsables

| Campo | Detalle |
|---|---|
| **Servicio / Versión** | **ATRIL v5.0** — Mercado Musical Tutelado (FundaOboeHJK & USB, Sprint 1) |
| **URL de Staging** | `http://localhost:8081` (staging controlado local/CI; despliegue staging privado acordado con Fundaoboe) |
| **Repositorio / Rama** | `https://github.com/Nadhe15/Atril-` · Rama activa: `feature/auth-y-reserva-modular` (`main` protegida por CI) |
| **Componentes** | 1) Cliente Expo Web / React Native (`dist/`), 2) Servidor Staging/Observabilidad (`server/stagingServer.mjs`), 3) Supabase Auth + PostgreSQL (RLS) + Realtime |
| **Responsables** | **Líder:** Samuel Sanabria · **BD/Seguridad:** José Torbet · **QA/CI:** Ernesto Barreto · **UI/Requisitos:** Nadheska García · **PO:** Virginia Moreno · **Mentor:** Luis Lezama |

---

## 2. Verificación de Salud (`/health`, `/ready`, `/metrics`)

```bash
# 1) Liveness (proceso activo) -> Esperado: HTTP 200 {"status":"ok", ...}
curl -i http://localhost:8081/health

# 2) Readiness (variables .env, bundle dist/ y migraciones UP/DOWN) -> Esperado: HTTP 200 {"status":"ready", ...} (503 si falla algo)
curl -i http://localhost:8081/ready

# 3) Métricas básicas (tasa de errores < 1% y latencia p95 < 500 ms)
curl -s http://localhost:8081/metrics
```

---

## 3. Dónde Ver los Logs y Cómo Seguir un `correlationId`

- **Ubicación de logs:** Salida estándar (`stdout`/`stderr`) y archivo NDJSON en `Atril-/logs/atril-staging.ndjson` (JSON estructurado de 1 línea por evento, **sin PII ni secretos**).
- **Seguir una petición o incidente de punta a punta:** Cada respuesta HTTP incluye el encabezado `X-Correlation-Id`. Para diagnosticar un error reportado:
```bash
# Buscar todos los eventos de una petición por su correlationId
grep "atril-m8x..." logs/atril-staging.ndjson
# Filtrar únicamente errores recientes (HTTP 5xx o fallos de servicio)
grep '"level":"error"' logs/atril-staging.ndjson | tail -n 20
```

---

## 4. Procedimientos Operativos Críticos

1. **Reiniciar servicio de staging:**
   ```bash
   pkill -f "server/stagingServer.mjs" || true
   npm run build:web && ATRIL_ENV=staging ATRIL_PORT=8081 npm run start:staging
   curl -fsS http://localhost:8081/health && curl -fsS http://localhost:8081/ready
   ```
2. **Ejecutar Rollback a la versión anterior (código + artefacto):**
   ```bash
   git log --oneline -n 5                      # Identificar último commit estable en verde
   git checkout <COMMIT_ESTABLE> -- src/ App.tsx server/
   npm run typecheck && npm test && npm run build:web
   # Reiniciar servidor y confirmar HTTP 200 en /health y /ready
   ```
3. **Revertir una migración de base de datos (sin cambios manuales):**
   ```bash
   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261122_v5_stride_rls_hardening.down.sql
   # Si requiere revertir todo v5:
   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261118_v5_mvp_verification_chat.down.sql
   ```
4. **Rotar un secreto comprometido (`EXPO_PUBLIC_SUPABASE_ANON_KEY` o credenciales Supabase):**
   1) Generar nueva clave en *Supabase Dashboard → Settings → API* y revocar la anterior.
   2) Actualizar secretos en *GitHub → Settings → Secrets and variables → Actions* y en `.env` local (nunca subir `.env` a Git).
   3) Ejecutar `npm run build:web`, reiniciar staging y verificar `GET /ready` (`200 OK`) y `npm run audit:sast` (`0 secretos`).

---

## 5. Incidentes Frecuentes y Escalamiento

| Síntoma | Diagnóstico Rápido | Acción Inmediata | Escalamiento |
|---|---|---|---|
| `GET /ready` responde `503 not_ready` | Revisar `checks` en JSON (`envConfig`, `webBundle`, `migrationsVersioned`). | Completar `.env` desde `.env.example` o ejecutar `npm run build:web` y reiniciar. | **N1:** Ernesto Barreto (QA/CI) |
| Error `500` en flujo de catálogo/auth | Tomar `X-Correlation-Id` de la respuesta y ejecutar `grep "<ID>" logs/atril-staging.ndjson`. | Revisar `error.code` y `diagnosticHint`; si persiste tras despliegue, ejecutar Rollback (#2). | **N2:** José Torbet (BD/Seguridad) |
| Usuario aprobado sigue bloqueado en pantalla Pendiente | Verificar `estado_verificacion` en `public.usuarios` y políticas RLS. | Confirmar que `aprobarUsuario` guardó `'verificado'`; pedir al usuario pulsar *Comprobar Estado*. | **N2:** Samuel Sanabria (Líder) |
| Fuga sospechosa de clave o incidencia LOPNNA | Ejecutar `npm run audit:sast` y revisar `git log -p`. | Rotar clave inmediatamente (#4), restringir el acceso temporalmente si aplica y notificar incidente. | **N3:** Virginia Moreno (PO) + Luis Lezama (Mentor) + Profa. Marla Corniel |
