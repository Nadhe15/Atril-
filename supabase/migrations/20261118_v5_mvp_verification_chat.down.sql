-- ============================================================================
-- ARCHIVO: supabase/migrations/20261118_v5_mvp_verification_chat.down.sql
-- PROYECTO: ATRIL v5.0 (MVP — Mercado Musical Tutelado FundaOboeHJK & USB)
-- PROPÓSITO:
--   Script de reversión (ROLLBACK) idempotente para la migración
--   `20261118_v5_mvp_verification_chat.sql`.
--   Cumplimiento DoD Criterio #12: Migración versionada, reproducible y reversible.
-- ============================================================================

BEGIN;

-- 1. Eliminar políticas RLS de mensajes y conversaciones
DROP POLICY IF EXISTS "mensajes_update_participantes" ON public.mensajes;
DROP POLICY IF EXISTS "mensajes_insert_participantes" ON public.mensajes;
DROP POLICY IF EXISTS "mensajes_select_participantes" ON public.mensajes;

DROP POLICY IF EXISTS "conversaciones_update_participantes" ON public.conversaciones;
DROP POLICY IF EXISTS "conversaciones_insert_participantes" ON public.conversaciones;
DROP POLICY IF EXISTS "conversaciones_select_participantes" ON public.conversaciones;

-- 2. Eliminar trigger y función de actualización de timestamp
DROP TRIGGER IF EXISTS trg_actualizar_timestamp_conversacion ON public.mensajes;
DROP FUNCTION IF EXISTS public.fn_actualizar_timestamp_conversacion();

-- 3. Eliminar tablas de mensajería en orden inverso de dependencias
DROP TABLE IF EXISTS public.mensajes;
DROP TABLE IF EXISTS public.conversaciones;

-- 4. Eliminar políticas RLS v5 sobre public.usuarios
DROP POLICY IF EXISTS "usuarios_update_own_or_admin" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_own" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_select_own_or_admin" ON public.usuarios;

-- 5. Eliminar constraints y columnas agregadas por v5 en public.usuarios
ALTER TABLE public.usuarios
  DROP CONSTRAINT IF EXISTS usuarios_estado_verificacion_check;

ALTER TABLE public.usuarios
  DROP COLUMN IF EXISTS cedula_representante,
  DROP COLUMN IF EXISTS nombre_representante,
  DROP COLUMN IF EXISTS es_menor,
  DROP COLUMN IF EXISTS estado_verificacion,
  DROP COLUMN IF EXISTS telefono;

COMMIT;
