-- ============================================================================
-- ARCHIVO: supabase/migrations/20261123_v5_fix_rls_and_profesores.sql
-- PROYECTO: ATRIL v5.0 (FundaOboeHJK & USB)
-- PROPÓSITO:
--   1. Resolver error PostgreSQL 42P17 ("infinite recursion detected in policy
--      for relation usuarios") reemplazando subconsultas recursivas por la
--      función SECURITY DEFINER `public.es_admin_atril()`.
--   2. Garantizar columnas v5 en `public.usuarios` (`area_docente`, `tipo_estudiante`,
--      LOPNNA y `estado_verificacion`).
--   3. Crear la tabla `public.perfiles_profesores` con FK a `public.usuarios(id)`
--      y políticas RLS seguras para el catálogo público y pruebas `/ready`.
--   4. Sincronizar automáticamente:
--      - `auth.users` -> `public.usuarios` al registrarse (funciona incluso con
--        confirmación de correo activa).
--      - `public.usuarios` -> `public.perfiles_profesores` cuando el admin
--        aprueba o suspende a un docente.
--   5. Habilitar Supabase Realtime para `public.mensajes` y recargar esquema PostgREST.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. COLUMNAS ADITIVAS EN public.usuarios (IDEMPOTENTE)
-- ----------------------------------------------------------------------------
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS telefono TEXT,
  ADD COLUMN IF NOT EXISTS estado_verificacion TEXT NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS es_menor BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS nombre_representante TEXT,
  ADD COLUMN IF NOT EXISTS cedula_representante TEXT,
  ADD COLUMN IF NOT EXISTS area_docente TEXT,
  ADD COLUMN IF NOT EXISTS tipo_estudiante TEXT;

ALTER TABLE public.usuarios
  DROP CONSTRAINT IF EXISTS usuarios_estado_verificacion_check;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_estado_verificacion_check
  CHECK (estado_verificacion IN ('pendiente', 'verificado', 'suspendido'));

-- ----------------------------------------------------------------------------
-- 2. FUNCIÓN AUXILIAR SECURITY DEFINER SIN RECURSIÓN RLS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.es_admin_atril()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE id = auth.uid()
      AND rol::TEXT = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.es_admin_atril() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.es_admin_atril() TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. POLÍTICAS RLS NO RECURSIVAS Y ENDURECIDAS (STRIDE) EN public.usuarios
-- ----------------------------------------------------------------------------
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'usuarios'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.usuarios;', pol.policyname);
  END LOOP;
END
$$;

CREATE POLICY "usuarios_select_own_or_admin"
  ON public.usuarios
  FOR SELECT
  USING (
    auth.uid() = id
    OR public.es_admin_atril()
    OR (
      rol::TEXT IN ('docente', 'profesor_docente')
      AND estado_verificacion = 'verificado'
    )
  );

CREATE POLICY "usuarios_insert_own"
  ON public.usuarios
  FOR INSERT
  WITH CHECK (auth.uid() = id OR public.es_admin_atril());

CREATE POLICY "usuarios_update_own_or_admin"
  ON public.usuarios
  FOR UPDATE
  USING (auth.uid() = id OR public.es_admin_atril())
  WITH CHECK (auth.uid() = id OR public.es_admin_atril());

-- ----------------------------------------------------------------------------
-- 4. TABLA public.perfiles_profesores + RLS PARA CATÁLOGO CERTIFICADO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfiles_profesores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
  bio TEXT,
  area_principal TEXT,
  areas_certificadas TEXT[] NOT NULL DEFAULT ARRAY['Oboe Sinfónico']::TEXT[],
  instrumentos TEXT[] NOT NULL DEFAULT ARRAY['Oboe Sinfónico']::TEXT[],
  modalidades TEXT[] NOT NULL DEFAULT ARRAY['presencial_caracas', 'online_en_vivo']::TEXT[],
  verificado_fundaoboe BOOLEAN NOT NULL DEFAULT FALSE,
  nivel_docente TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfiles_profesores_verificado
  ON public.perfiles_profesores(verificado_fundaoboe);

ALTER TABLE public.perfiles_profesores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfiles_profesores_select_public_or_own_or_admin" ON public.perfiles_profesores;
CREATE POLICY "perfiles_profesores_select_public_or_own_or_admin"
  ON public.perfiles_profesores
  FOR SELECT
  USING (
    verificado_fundaoboe = TRUE
    OR auth.uid() = user_id
    OR public.es_admin_atril()
  );

DROP POLICY IF EXISTS "perfiles_profesores_insert_own_or_admin" ON public.perfiles_profesores;
CREATE POLICY "perfiles_profesores_insert_own_or_admin"
  ON public.perfiles_profesores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.es_admin_atril());

DROP POLICY IF EXISTS "perfiles_profesores_update_own_or_admin" ON public.perfiles_profesores;
CREATE POLICY "perfiles_profesores_update_own_or_admin"
  ON public.perfiles_profesores
  FOR UPDATE
  USING (auth.uid() = user_id OR public.es_admin_atril())
  WITH CHECK (auth.uid() = user_id OR public.es_admin_atril());

-- ----------------------------------------------------------------------------
-- 5. TRIGGER: SINCRONIZAR auth.users -> public.usuarios EN REGISTRO
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_sincronizar_usuario_desde_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::JSONB);
  v_rol TEXT := COALESCE(NULLIF(TRIM(v_meta->>'rol'), ''), 'estudiante');
  v_rol_type TEXT;
  v_nombre TEXT := COALESCE(
    NULLIF(TRIM(v_meta->>'nombre_completo'), ''),
    split_part(COALESCE(NEW.email, 'usuario@atril.org'), '@', 1)
  );
  v_cedula TEXT := COALESCE(NULLIF(TRIM(v_meta->>'cedula_identidad'), ''), '');
  v_telefono TEXT := NULLIF(TRIM(v_meta->>'telefono'), '');
  v_es_menor BOOLEAN := COALESCE((v_meta->>'es_menor')::BOOLEAN, FALSE);
  v_tipo_est TEXT := NULLIF(TRIM(v_meta->>'tipo_estudiante'), '');
  v_nom_rep TEXT := NULLIF(TRIM(v_meta->>'nombre_representante'), '');
  v_ced_rep TEXT := NULLIF(TRIM(v_meta->>'cedula_representante'), '');
  v_area TEXT := NULLIF(TRIM(v_meta->>'area_docente'), '');
BEGIN
  IF v_rol NOT IN ('estudiante', 'docente', 'admin', 'alumno_tutor', 'profesor_docente', 'representante') THEN
    v_rol := 'estudiante';
  END IF;

  SELECT format_type(a.atttypid, a.atttypmod)
    INTO v_rol_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'usuarios'
    AND a.attname = 'rol'
    AND NOT a.attisdropped;

  IF v_rol_type IS NULL THEN
    v_rol_type := 'text';
  END IF;

  EXECUTE format(
    'INSERT INTO public.usuarios (
       id, email, nombre_completo, rol, estado_verificacion,
       cedula_identidad, telefono, es_menor, tipo_estudiante,
       nombre_representante, cedula_representante, area_docente
     )
     VALUES ($1, $2, $3, ($4)::%s, ''pendiente'', $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       nombre_completo = COALESCE(NULLIF(EXCLUDED.nombre_completo, ''''), public.usuarios.nombre_completo),
       telefono = COALESCE(EXCLUDED.telefono, public.usuarios.telefono),
       cedula_identidad = COALESCE(NULLIF(EXCLUDED.cedula_identidad, ''''), public.usuarios.cedula_identidad),
       es_menor = COALESCE(EXCLUDED.es_menor, public.usuarios.es_menor),
       tipo_estudiante = COALESCE(EXCLUDED.tipo_estudiante, public.usuarios.tipo_estudiante),
       nombre_representante = COALESCE(EXCLUDED.nombre_representante, public.usuarios.nombre_representante),
       cedula_representante = COALESCE(EXCLUDED.cedula_representante, public.usuarios.cedula_representante),
       area_docente = COALESCE(EXCLUDED.area_docente, public.usuarios.area_docente)',
    v_rol_type
  )
  USING NEW.id, COALESCE(NEW.email, ''), v_nombre, v_rol,
        v_cedula, v_telefono, v_es_menor, v_tipo_est,
        v_nom_rep, v_ced_rep, v_area;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'ATRIL trigger fn_sincronizar_usuario_desde_auth omitido para %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.fn_sincronizar_usuario_desde_auth();

-- ----------------------------------------------------------------------------
-- 6. TRIGGER: SINCRONIZAR DOCENTE VERIFICADO -> public.perfiles_profesores
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_sync_perfil_profesor_verificado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_area TEXT := COALESCE(NULLIF(TRIM(NEW.area_docente), ''), 'Oboe Sinfónico');
BEGIN
  IF NEW.rol::TEXT IN ('docente', 'profesor_docente') THEN
    INSERT INTO public.perfiles_profesores (
      user_id,
      bio,
      area_principal,
      areas_certificadas,
      instrumentos,
      modalidades,
      verificado_fundaoboe,
      nivel_docente,
      updated_at
    )
    VALUES (
      NEW.id,
      'Docente acreditado por el comité académico de FundaOboeHJK en la cátedra de ' || v_area || '.',
      v_area,
      ARRAY[v_area]::TEXT[],
      ARRAY[v_area]::TEXT[],
      ARRAY['presencial_caracas', 'online_en_vivo']::TEXT[],
      (NEW.estado_verificacion = 'verificado'),
      'Docente Certificado • Aval FundaOboeHJK',
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      verificado_fundaoboe = (NEW.estado_verificacion = 'verificado'),
      area_principal = COALESCE(NULLIF(TRIM(NEW.area_docente), ''), public.perfiles_profesores.area_principal),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_perfil_profesor_verificado ON public.usuarios;
CREATE TRIGGER trg_sync_perfil_profesor_verificado
AFTER INSERT OR UPDATE OF rol, estado_verificacion, area_docente ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_perfil_profesor_verificado();

-- Sincronizar docentes ya existentes en public.usuarios hacia perfiles_profesores
INSERT INTO public.perfiles_profesores (
  user_id,
  bio,
  area_principal,
  areas_certificadas,
  instrumentos,
  modalidades,
  verificado_fundaoboe,
  nivel_docente
)
SELECT
  u.id,
  'Docente acreditado por el comité académico de FundaOboeHJK.',
  COALESCE(NULLIF(TRIM(u.area_docente), ''), 'Oboe Sinfónico'),
  ARRAY[COALESCE(NULLIF(TRIM(u.area_docente), ''), 'Oboe Sinfónico')]::TEXT[],
  ARRAY[COALESCE(NULLIF(TRIM(u.area_docente), ''), 'Oboe Sinfónico')]::TEXT[],
  ARRAY['presencial_caracas', 'online_en_vivo']::TEXT[],
  (u.estado_verificacion = 'verificado'),
  'Docente Certificado • Aval FundaOboeHJK'
FROM public.usuarios u
WHERE u.rol::TEXT IN ('docente', 'profesor_docente')
ON CONFLICT (user_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. HABILITAR SUPABASE REALTIME EN public.mensajes Y RECARGAR CACHÉ POSTGREST
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'mensajes'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;
  END IF;
END
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
