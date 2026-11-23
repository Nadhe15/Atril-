# ATRIL v5.0 — Mercado Controlado de Talento Artístico y Cultural (FundaOboeHJK & USB)

Plataforma educativa de mercado musical tutelado desarrollada por el **Equipo 2** (Sistemas de Información I, PS-1115 — Universidad Simón Bolívar) para la **Fundación Venezolana del Oboe (FundaOboeHJK / Fundaoboe)**.

---

## 1. Flujo Operativo del MVP (v5.0 — Rama `feature/auth-y-reserva-modular`)

1. **Bienvenida y Acceso Unificado (`SplashScreen` → `AuthLandingScreen`):**
   - Registro e inicio de sesión unificado para **Estudiante Mayor de Edad**, **Estudiante Menor de Edad con Representante Legal** (cumplimiento estricto **LOPNNA**) y **Profesor / Maestro** (con selección de cátedra oficial).
   - Incluye pestaña pública **Profesores** y **¿Quiénes Somos?** sin exponer datos privados (correo, teléfono ni cédula).
   - Cuenta con botones de **Acceso Rápido Demo** (`Superadmin Virginia`, `Maestro Verificado`, `Estudiante Verificado` y `Cuenta Pendiente`) para facilitar las pruebas E2E y la coevaluación.
2. **Acreditación y Entrevista Externa por Correo (`PendingVerificationScreen`):**
   - Toda cuenta nueva inicia en estado `pendiente`. El sistema bloquea el acceso al catálogo interno y al chat e instruye al postulante a enviar sus recaudos y coordinar su entrevista por correo (`acreditacion@fundaoboe.org.ve`).
3. **Consola Superadmin FundaOboeHJK (`AdminDashboardScreen`):**
   - Permite filtrar usuarios por estado (`pendiente | verificado | suspendido | todos`) y rol (`docente | estudiante`), ejecutando `aprobarUsuario` (`verificado`) o `suspenderUsuario` (`suspendido`).
4. **Catálogo Certificado y Mensajería Directa Tutelada (`StudentTeachersScreen` → `TeacherDetailScreen` → `ChatRoomScreen`):**
   - Los estudiantes verificados exploran las 8 cátedras certificadas (`Oboe Sinfónico`, `Fagot`, `Guitarra Clásica`, `Cuatro Venezolano`, `Violín`, `Canto`, `Armonía`, `Lenguaje Musical`), filtran por modalidad y abren una sala de chat directa con el docente verificado para coordinar sus clases.

---

## 2. Cómo Instalar y Ejecutar las Pruebas (Guía de Reproducibilidad — Laboratorio 6)

> **Requisitos:** Node.js `>= 22.0.0` y `npm`. No requiere credenciales reales ni conexión externa para correr la suite automatizada (utiliza datos 100% sintéticos y motor relacional de pruebas con limpieza automática).

### Paso 1: Clonar e instalar
```bash
git clone -b feature/auth-y-reserva-modular https://github.com/Nadhe15/Atril-.git
cd Atril-
cp .env.example .env
```

### Paso 2: Ejecutar toda la suite (Unitarias + Integración + E2E)
```bash
npm test
```

### Paso 3: Generar el reporte de cobertura (Meta Lab 6: >= 70% en lógica de negocio)
```bash
npm run test:coverage
```

### Paso 4: Comprobar estabilidad E2E (3 ejecuciones consecutivas sin fallos)
```bash
npm run test:e2e:3x
```

### Paso 5: Levantar la aplicación interactiva (Expo Web / Móvil)
```bash
npm install
npm run web
```

---

## 3. Estructura de Pruebas y Pipeline CI/CD

- `tests/atril.test.ts`:
  - **13 Pruebas Unitarias (`CU-001` a `CU-013`)**: Normalización de roles/estados, validación de registro (adulto, menor LOPNNA, docente), homologación y filtrado de las 8 cátedras certificadas, caché administrativa y validaciones de mensajería.
  - **7 Pruebas de Integración (`CI-001` a `CI-007`)**: Persistencia en Auth + `public.usuarios`, login válido/inválido, aprobación/suspensión admin, privacidad de catálogo y persistencia/unicidad de conversaciones y mensajes (`beforeEach`/`afterEach` limpia la BD automáticamente).
  - **2 Pruebas E2E (`E2E-001` y `E2E-002`)**: Los 2 flujos críticos del MVP de punta a punta.
- `tests/observability.test.ts`:
  - **Pruebas de Observabilidad, LOPNNA y DoD Operativa (`CU-014` a `CU-016`, `CI-008` a `CI-010`)**: Logs estructurados JSON con `correlationId` y redacción anti-PII, endpoints `/health`, `/ready` y `/metrics`, prueba de campo con diagnóstico de error HTTP 500, aviso legal LOPNNA y migraciones reversibles.
- `load-tests/k6-baseline.js`: Script de prueba de carga de línea base (50 a 100 usuarios concurrentes vs. RNF-01 `p95 < 500 ms`).
- `.github/workflows/ci-cd.yml`: Pipeline de Integración y Despliegue Continuo (typecheck estricto, pruebas + cobertura `>= 70%`, SAST, auditoría de dependencias, verificación de artefactos DoD, build web y smoke test `/health` + `/ready`).

---

## 4. Definition of Done (DoD), Observabilidad y Operación (Laboratorio 7)

- **Plantilla de Pull Request con Checklist DoD y Declaración de IA (`N0`–`N3`):** [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)
- **Runbook Operativo v0 (Una Página):** [`RUNBOOK.md`](RUNBOOK.md) — verificación de salud, diagnóstico por `correlationId`, reinicio, rollback, reversión de migraciones y rotación de secretos.
- **Migraciones Versionadas y Reversibles:** [`supabase/migrations/`](supabase/migrations/README.md) (`20261118_v5_mvp_verification_chat.{sql,down.sql}` y `20261122_v5_stride_rls_hardening.{sql,down.sql}`).
- **Decisiones de Arquitectura (ADRs):** [`docs/adr/ADR-001`](docs/adr/ADR-001-verificacion-externa-fundaoboe-v5.md) y [`docs/adr/ADR-002`](docs/adr/ADR-002-observabilidad-minima-health-ready-logs.md).
- **Servidor de Staging y Endpoints Operativos:**
  ```bash
  npm run build:web
  npm run start:staging
  # Verificar salud y preparación operativa:
  curl http://localhost:8081/health
  curl http://localhost:8081/ready
  curl http://localhost:8081/metrics
  # Escaneo SAST de secretos:
  npm run audit:sast
  ```
- **Despliegue Automático en Netlify (`netlify.toml` + `.nvmrc` + `netlify/functions/`):**
  - Al importar la rama `feature/auth-y-reserva-modular` en Netlify, `netlify.toml` configura automáticamente `NODE_VERSION=22`, el comando `npm run build:web`, la carpeta `dist`, la redirección SPA y las funciones `/health` y `/ready`.
  - Solo se deben configurar en **Netlify → Environment variables**: `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.


