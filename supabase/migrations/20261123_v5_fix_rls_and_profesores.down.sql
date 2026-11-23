-- ============================================================================
-- ARCHIVO: supabase/migrations/20261123_v5_fix_rls_and_profesores.down.sql
-- PROPÓSITO: Rollback reversible de `20261123_v5_fix_rls_and_profesores.sql`
-- ============================================================================

BEGIN;

DROP TRIGGER IF EXISTS trg_sync_perfil_profesor_verificado ON public.usuarios;
DROP FUNCTION IF EXISTS public.fn_sync_perfil_profesor_verificado();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.fn_sincronizar_usuario_desde_auth();

DROP POLICY IF EXISTS "perfiles_profesores_update_own_or_admin" ON public.perfiles_profesores;
DROP POLICY IF EXISTS "perfiles_profesores_insert_own_or_admin" ON public.perfiles_profesores;
DROP POLICY IF EXISTS "perfiles_profesores_select_public_or_own_or_admin" ON public.perfiles_profesores;
DROP TABLE IF EXISTS public.perfiles_profesores;

DROP POLICY IF EXISTS "usuarios_update_own_or_admin" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_own" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_select_own_or_admin" ON public.usuarios;

DROP FUNCTION IF EXISTS public.es_admin_atril();

ALTER TABLE public.usuarios
  DROP COLUMN IF EXISTS tipo_estudiante,
  DROP COLUMN IF EXISTS area_docente;

NOTIFY pgrst, 'reload schema';

COMMIT;
