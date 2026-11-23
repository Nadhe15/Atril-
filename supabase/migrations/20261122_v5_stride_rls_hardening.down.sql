-- ============================================================================
-- ARCHIVO: supabase/migrations/20261122_v5_stride_rls_hardening.down.sql
-- PROPÓSITO: Rollback reversible de `20261122_v5_stride_rls_hardening.sql`
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
    OR TRUE
  );

COMMIT;
