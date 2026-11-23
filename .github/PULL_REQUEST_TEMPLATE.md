## Identificación del Cambio (ATRIL v5.0 — Equipo 2)

- **Historia de Usuario / Ticket:** `US-XX` (ej. `US-01`, `US-10 LOPNNA`, `US-02`, `US-03/04`)
- **Sprint:** Sprint 1 (MVP FundaOboeHJK)
- **Tipo de cambio:** `[ ] Funcionalidad nueva` | `[ ] Corrección de error (Bugfix)` | `[ ] Seguridad / Migración` | `[ ] Observabilidad / Documentación`
- **Autor del PR:** `@usuario`
- **Revisor asignado (obligatoriamente distinto del autor):** `@revisor`

### Resumen del cambio
> Describir brevemente qué regla de negocio, componente o requerimiento se implementa o corrige y cómo probarlo en staging.

---

## Checklist de Definition of Done (DoD v1.0 — ATRIL v5.0)

> **Regla no negociable:** Una historia/tarea solo pasa a **"Hecho"** si cumple todos los criterios aplicables **con evidencia enlazada**. Un criterio marcado sin enlace, reporte o captura **no cuenta** y el revisor debe rechazar el PR.

### Funcional
- [ ] **1.** Cumple todos los criterios de aceptación (`Dado / Cuando / Entonces`), incluidos los casos negativos y de borde. — **Evidencia:** `<!-- enlace a prueba / captura -->`
- [ ] **2.** Validado por el Product Owner (Virginia Moreno / Mentor Luis Lezama) o en staging. — **Evidencia:** `<!-- enlace a staging / minuta -->`

### Código
- [ ] **3.** Revisado y aprobado por al menos un integrante distinto del autor. — **Evidencia:** `<!-- aprobación de GitHub Review -->`
- [ ] **4.** Lint, tipado estricto (`npm run typecheck`) y formato sin errores; sin código muerto ni cambios sin ticket. — **Evidencia:** `<!-- enlace a job CI -->`

### Pruebas
- [ ] **5.** Pruebas nuevas o actualizadas (unitarias; de integración si toca API o base de datos). — **Evidencia:** `<!-- ruta en tests/ -->`
- [ ] **6.** Pipeline CI en verde y cobertura de la lógica de negocio `>= 70%` (sin disminuir). — **Evidencia:** `<!-- reporte npm run test:coverage -->`
- [ ] **7.** Defecto deliberado comprobado: al menos una prueba falla si se rompe la regla implementada. — **Evidencia:** `<!-- captura o registro de corrida roja/verde -->`

### Seguridad
- [ ] **8.** Entradas validadas y autorización comprobada por rol (`estudiante`, `docente`, `admin`) y por recurso (RLS). — **Evidencia:** `<!-- prueba / política RLS -->`
- [ ] **9.** SAST y auditoría de dependencias (`npm audit`) ejecutados sin hallazgos críticos abiertos. — **Evidencia:** `<!-- enlace a job sast-and-dependencies -->`
- [ ] **10.** Sin secretos ni credenciales reales en el código, prompts o historial (escaneo SAST en CI). — **Evidencia:** `<!-- salida SAST + .env.example -->`
- [ ] **11.** Mitigaciones STRIDE afectadas actualizadas (Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege). — **Evidencia:** `<!-- migración / matriz STRIDE -->`

### Datos
- [ ] **12.** Migración versionada, reproducible y reversible (`.sql` + `.down.sql` en `supabase/migrations/`), si aplica. — **Evidencia:** `<!-- enlace o N/A justificado -->`
- [ ] **13.** Sin cambios manuales en la base de datos de staging/producción. — **Evidencia:** `<!-- confirmación / enlace a migración -->`

### Accesibilidad y Documentación
- [ ] **14.** La interfaz cumple la lista de verificación **WCAG 2.1 AA** que aplica (contraste `>= 4.5:1`, roles/etiquetas accesibles, navegación por teclado). — **Evidencia:** `<!-- captura / reporte accesibilidad -->`
- [ ] **15.** `README.md`, documentación de API/servicios, `.env.example` y `RUNBOOK.md` actualizados si aplica. — **Evidencia:** `<!-- enlace a diff -->`
- [ ] **16.** ADR creado en `docs/adr/` si hubo una decisión relevante de arquitectura. — **Evidencia:** `<!-- enlace o N/A -->`

### Observabilidad Operativa y Criterios Propios de ATRIL v5.0
- [ ] **17. (DoD #20 — Observabilidad mínima):** Logs estructurados JSON con `correlationId` (sin PII) en flujos nuevos/modificados y endpoints `/health` y `/ready` operativos sin degradar RNF (`p95 < 500 ms`, tasa de errores `< 1%`). — **Evidencia:** `<!-- JSON /health, /ready y log con correlationId -->`
- [ ] **18. (DoD #21 — LOPNNA):** Si toca registro/perfil de menores de 18 años, exige datos del representante legal y muestra aviso legal informativo LOPNNA en pantalla. — **Evidencia:** `<!-- prueba CU-004 / captura pantalla -->`
- [ ] **19. (DoD #22 — Acreditación y Privacidad FundaOboeHJK):** Toda cuenta nueva queda en estado `pendiente` con guía hacia `acreditacion@fundaoboe.org.ve` y nunca expone correo, teléfono ni cédula del docente en catálogo público/interno. — **Evidencia:** `<!-- prueba CI-005 / captura -->`

---

## Declaración Obligatoria de Uso de IA (DoD Criterios #17, #18 y #19)

> **Regla no negociable:** Declarar siempre la herramienta y el nivel real de uso de IA (`N0` Sin IA | `N1` Asistencia puntual/consulta | `N2` Generación supervisada y auditada | `N3` Generación extensa con validación integral). Verificar manualmente cada ítem que la IA sugiera como "cumplido".

- **Nivel de IA utilizado:** `[ ] N0` | `[ ] N1` | `[ ] N2` | `[ ] N3`
- **Herramienta(s) empleada(s):** `<!-- ej. Antigravity / Claude / ChatGPT / Ninguna -->`
- **Qué se aceptó de la propuesta de IA:**
  - `...`
- **Qué se modificó por criterio humano:**
  - `...`
- **Qué se rechazó o alucinaciones detectadas:**
  - `...`
- **Verificación humana realizada:** `[ ] Probado localmente` | `[ ] Revisado sin datos reales ni secretos en prompts` | `[ ] Caso destacado documentado si hubo hallazgo relevante`

---

## Registro de Excepciones (solo si algún criterio no aplica o se difiere temporalmente)

| Criterio | Motivo / Justificación | Aprobado por (Rol) | Plazo de corrección |
|---|---|---|---|
| `N/A` | `Ninguna excepción solicitada en este PR` | `—` | `—` |
