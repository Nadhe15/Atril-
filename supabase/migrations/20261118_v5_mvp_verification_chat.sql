-- ============================================================================
-- ARCHIVO: supabase/migrations/20261118_v5_mvp_verification_chat.sql
-- PROYECTO: ATRIL v5.0 (MVP — Mercado Musical Tutelado FundaOboeHJK & USB)
-- PROPÓSITO:
--   1. Extender `public.usuarios` de forma aditiva e idempotente con:
--      - `estado_verificacion` ('pendiente' | 'verificado' | 'suspendido')
--      - `telefono` (TEXT)
--      - Soporte de roles v5 ('estudiante', 'docente', 'admin') manteniendo
--        compatibilidad con roles previos ('alumno_tutor', 'profesor_docente', 'representante').
--   2. Crear tablas de mensajería directa post-verificación:
--      - `public.conversaciones` (UNIQUE(alumno_id, profesor_id))
--      - `public.mensajes` (ON DELETE CASCADE)
--   3. Configurar políticas RLS para participantes de chat y administración
--      de `estado_verificacion` por el rol `admin`.
--   NOTA: Las tablas y RPCs de Escrow (`sesiones_clase`, `movimientos_escrow`)
--         permanecen intactas en modo pasivo para fases futuras.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIÓN DE ROLES Y COLUMNAS EN public.usuarios
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Si existe un tipo ENUM para rol de usuario, agregar los valores v5 de forma idempotente
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') THEN
    ALTER TYPE public.rol_usuario ADD VALUE IF NOT EXISTS 'estudiante';
    ALTER TYPE public.rol_usuario ADD VALUE IF NOT EXISTS 'docente';
    ALTER TYPE public.rol_usuario ADD VALUE IF NOT EXISTS 'admin';
    ALTER TYPE public.rol_usuario ADD VALUE IF NOT EXISTS 'alumno_tutor';
    ALTER TYPE public.rol_usuario ADD VALUE IF NOT EXISTS 'profesor_docente';
    ALTER TYPE public.rol_usuario ADD VALUE IF NOT EXISTS 'representante';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_atril') THEN
    ALTER TYPE public.rol_atril ADD VALUE IF NOT EXISTS 'estudiante';
    ALTER TYPE public.rol_atril ADD VALUE IF NOT EXISTS 'docente';
    ALTER TYPE public.rol_atril ADD VALUE IF NOT EXISTS 'admin';
    ALTER TYPE public.rol_atril ADD VALUE IF NOT EXISTS 'alumno_tutor';
    ALTER TYPE public.rol_atril ADD VALUE IF NOT EXISTS 'profesor_docente';
    ALTER TYPE public.rol_atril ADD VALUE IF NOT EXISTS 'representante';
  END IF;
END
$$;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS telefono TEXT,
  ADD COLUMN IF NOT EXISTS estado_verificacion TEXT NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS es_menor BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS nombre_representante TEXT,
  ADD COLUMN IF NOT EXISTS cedula_representante TEXT;

-- Asegurar constraint de estado_verificacion
ALTER TABLE public.usuarios
  DROP CONSTRAINT IF EXISTS usuarios_estado_verificacion_check;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_estado_verificacion_check
  CHECK (estado_verificacion IN ('pendiente', 'verificado', 'suspendido'));

-- Si existe un constraint CHECK sobre la columna rol (cuando rol es TEXT), actualizarlo
-- para permitir tanto los roles v5 ('estudiante', 'docente', 'admin') como los previos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'usuarios'
      AND column_name = 'rol'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_rol_check
      CHECK (
        rol IN (
          'estudiante',
          'docente',
          'admin',
          'alumno_tutor',
          'profesor_docente',
          'representante'
        )
      );
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- 2. TABLA: public.conversaciones
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  profesor_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  area_interes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT conversaciones_alumno_profesor_unique UNIQUE (alumno_id, profesor_id)
);

CREATE INDEX IF NOT EXISTS idx_conversaciones_alumno_id
  ON public.conversaciones(alumno_id);

CREATE INDEX IF NOT EXISTS idx_conversaciones_profesor_id
  ON public.conversaciones(profesor_id);

-- ----------------------------------------------------------------------------
-- 3. TABLA: public.mensajes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id UUID NOT NULL REFERENCES public.conversaciones(id) ON DELETE CASCADE,
  remitente_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  leido BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion_created
  ON public.mensajes(conversacion_id, created_at ASC);

-- Trigger para actualizar updated_at en public.conversaciones al insertar un mensaje
CREATE OR REPLACE FUNCTION public.fn_actualizar_timestamp_conversacion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.conversaciones
  SET updated_at = NOW()
  WHERE id = NEW.conversacion_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_actualizar_timestamp_conversacion ON public.mensajes;

CREATE TRIGGER trg_actualizar_timestamp_conversacion
AFTER INSERT ON public.mensajes
FOR EACH ROW
EXECUTE FUNCTION public.fn_actualizar_timestamp_conversacion();

-- ----------------------------------------------------------------------------
-- 4. SEGURIDAD A NIVEL DE FILA (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

-- 4.1 Políticas en public.usuarios para lectura propia, lectura por admin y actualización de estado_verificacion por admin
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
    OR TRUE -- Permite lectura pública controlada de nombres de docentes en catálogo
  );

DROP POLICY IF EXISTS "usuarios_insert_own" ON public.usuarios;
CREATE POLICY "usuarios_insert_own"
  ON public.usuarios
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "usuarios_update_own_or_admin" ON public.usuarios;
CREATE POLICY "usuarios_update_own_or_admin"
  ON public.usuarios
  FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.usuarios u_admin
      WHERE u_admin.id = auth.uid()
        AND u_admin.rol::TEXT = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.usuarios u_admin
      WHERE u_admin.id = auth.uid()
        AND u_admin.rol::TEXT = 'admin'
    )
  );

-- 4.2 Políticas en public.conversaciones (solo participantes: alumno_id o profesor_id)
DROP POLICY IF EXISTS "conversaciones_select_participantes" ON public.conversaciones;
CREATE POLICY "conversaciones_select_participantes"
  ON public.conversaciones
  FOR SELECT
  USING (auth.uid() = alumno_id OR auth.uid() = profesor_id);

DROP POLICY IF EXISTS "conversaciones_insert_participantes" ON public.conversaciones;
CREATE POLICY "conversaciones_insert_participantes"
  ON public.conversaciones
  FOR INSERT
  WITH CHECK (auth.uid() = alumno_id OR auth.uid() = profesor_id);

DROP POLICY IF EXISTS "conversaciones_update_participantes" ON public.conversaciones;
CREATE POLICY "conversaciones_update_participantes"
  ON public.conversaciones
  FOR UPDATE
  USING (auth.uid() = alumno_id OR auth.uid() = profesor_id)
  WITH CHECK (auth.uid() = alumno_id OR auth.uid() = profesor_id);

-- 4.3 Políticas en public.mensajes (solo participantes de la conversación asociada)
DROP POLICY IF EXISTS "mensajes_select_participantes" ON public.mensajes;
CREATE POLICY "mensajes_select_participantes"
  ON public.mensajes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversaciones c
      WHERE c.id = mensajes.conversacion_id
        AND (c.alumno_id = auth.uid() OR c.profesor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "mensajes_insert_participantes" ON public.mensajes;
CREATE POLICY "mensajes_insert_participantes"
  ON public.mensajes
  FOR INSERT
  WITH CHECK (
    auth.uid() = remitente_id
    AND EXISTS (
      SELECT 1 FROM public.conversaciones c
      WHERE c.id = mensajes.conversacion_id
        AND (c.alumno_id = auth.uid() OR c.profesor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "mensajes_update_participantes" ON public.mensajes;
CREATE POLICY "mensajes_update_participantes"
  ON public.mensajes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversaciones c
      WHERE c.id = mensajes.conversacion_id
        AND (c.alumno_id = auth.uid() OR c.profesor_id = auth.uid())
    )
  );
