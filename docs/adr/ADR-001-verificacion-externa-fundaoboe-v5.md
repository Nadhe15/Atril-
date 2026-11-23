# ADR-001: Acreditación Externa por Correo y Modo Pasivo de Escrow en ATRIL v5.0 (Sprint 1)

- **Fecha:** 2026-11-18 (actualizado 2026-11-22)
- **Estado:** Aceptado (Consensuado con Virginia Moreno — PO FundaOboeHJK y Luis Lezama — Mentor)
- **Autores:** Equipo 2 (Samuel Sanabria, José Torbet, Nadheska García, Ernesto Barreto)

## Contexto
En versiones iniciales (v3.0), ATRIL contemplaba billetera fiduciaria Escrow y carga de recaudos/CV dentro de la aplicación. En la sesión de revisión con la Product Owner (Virginia Moreno) y el mentor técnico (Luis Lezama), se determinó que para el MVP del Sprint 1 la prioridad operativa de FundaOboeHJK es la verificación humana rigurosa de docentes y estudiantes (con cumplimiento LOPNNA para menores de 18 años) y la coordinación segura mediante mensajería directa, evitando complejidad financiera y sobrecarga documental temprana.

## Decisión
1. **Acreditación externa por correo (`acreditacion@fundaoboe.org.ve`):** Toda cuenta registrada (estudiante adulto, estudiante menor con representante legal o docente) se crea obligatoriamente con `estado_verificacion = 'pendiente'` y permanece retenida en `PendingVerificationScreen` hasta que el Superadmin de FundaOboeHJK apruebe o suspenda la cuenta tras la entrevista externa.
2. **Privacidad estricta y LOPNNA:** El catálogo nunca expone correo, teléfono ni cédula del docente; el registro de menores exige datos del representante legal y muestra un aviso legal explícito de la LOPNNA en pantalla.
3. **Escrow en modo pasivo:** Se preservan utilidades y tipos de Escrow sin exponerlos en el flujo activo v5.0, dejando la carga automatizada de archivos/CV planificada para el Sprint 2 (recomendación de escalabilidad de Luis Lezama).

## Consecuencias
- **Positivas:** Reduce la superficie de ataque, acelera la entrega del MVP del Sprint 1 y refleja el proceso real actual de FundaOboeHJK.
- **Compromisos / Deuda planificada:** Al escalar a cientos de postulaciones docentes, la revisión manual por correo generará cuello de botella; por ello queda registrada en el backlog del Sprint 2 la automatización de carga documental.
