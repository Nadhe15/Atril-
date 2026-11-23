-- ============================================================================
-- ARCHIVO: supabase/migrations/20261122_v5_stride_rls_hardening.sql
-- PROYECTO: ATRIL v5.0 (Laboratorio 7 — DoD Seguridad Criterio #11 STRIDE)
-- PROPÓSITO:
--   Mitigar riesgo STRIDE de Divulgación de Información (Information Disclosure)
--   en `public.usuarios`, removiendo la cláusula permisiva `OR TRUE` de la política
--   `usuarios_select_own_or_admin`.
--   Solo permite lectura de:
--     a) El propio perfil del usuario autenticado (`auth.uid() = id`).
--     b) Cualquier usuario si quien consulta tiene rol `admin`.
--     c) Filas de docentes verificados (`estado_verificacion = 'verificado'`) para
--        el join público del catálogo (donde el cliente proyecta únicamente `id` y
--        `nombre_completo`, nunca correo, teléfono ni cédula).
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS "usuarios_select_own_or_admin" ON public.usuarios;

CREATE POLICY "usuarios_select_own_or_admin"
  ON public.usuarios
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.usuarios u_admin
      WHERE u_admin.id = auth.uid()
        AND u_admin.rol::TEXT = 'admin'
    )
    OR (
      rol::TEXT IN ('docente', 'profesor_docente')
      AND estado_verificacion = 'verificado'
    )
  );

COMMIT;
