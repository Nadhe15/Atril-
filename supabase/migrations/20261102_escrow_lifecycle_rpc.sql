-- ============================================================================
-- ARCHIVO: supabase/migrations/20261102_escrow_lifecycle_rpc.sql
-- PROYECTO: ATRIL (Mercado Musical Tutelado — FundaOboeHJK & USB)
-- PROPÓSITO:
--   1. Extensión de ENUMs (modalidad_clase y estado_sesion) y columnas de
--      public.sesiones_clase para protocolo pre-clase Zoom y contingencias.
--   2. Funciones RPC transaccionales ACID (SECURITY DEFINER):
--      - public.rpc_bloquear_fondos_escrow
--      - public.rpc_confirmar_asistencia_y_liberar
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIÓN DE TIPOS ENUM (estado_sesion y modalidad_clase)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'modalidad_clase') THEN
    CREATE TYPE public.modalidad_clase AS ENUM (
      'presencial',
      'online',
      'hibrido',
      'presencial_caracas',
      'online_en_vivo'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_sesion') THEN
    CREATE TYPE public.estado_sesion AS ENUM (
      'programada',
      'iniciada',
      'declarada_docente',
      'asistencia_validada',
      'reprogramada_fuerza_mayor',
      'incumplimiento_reportado',
      'cancelada'
    );
  END IF;
END
$$;

-- Asegurar soporte para todas las variantes de modalidad_clase en PostgreSQL
ALTER TYPE public.modalidad_clase ADD VALUE IF NOT EXISTS 'presencial';
ALTER TYPE public.modalidad_clase ADD VALUE IF NOT EXISTS 'online';
ALTER TYPE public.modalidad_clase ADD VALUE IF NOT EXISTS 'hibrido';
ALTER TYPE public.modalidad_clase ADD VALUE IF NOT EXISTS 'presencial_caracas';
ALTER TYPE public.modalidad_clase ADD VALUE IF NOT EXISTS 'online_en_vivo';

-- Extender valores del enum estado_sesion de forma idempotente
ALTER TYPE public.estado_sesion ADD VALUE IF NOT EXISTS 'programada';
ALTER TYPE public.estado_sesion ADD VALUE IF NOT EXISTS 'iniciada';
ALTER TYPE public.estado_sesion ADD VALUE IF NOT EXISTS 'declarada_docente';
ALTER TYPE public.estado_sesion ADD VALUE IF NOT EXISTS 'asistencia_validada';
ALTER TYPE public.estado_sesion ADD VALUE IF NOT EXISTS 'reprogramada_fuerza_mayor';
ALTER TYPE public.estado_sesion ADD VALUE IF NOT EXISTS 'incumplimiento_reportado';
ALTER TYPE public.estado_sesion ADD VALUE IF NOT EXISTS 'cancelada';

-- ----------------------------------------------------------------------------
-- 2. MODIFICACIÓN DE COLUMNAS EN public.sesiones_clase
-- ----------------------------------------------------------------------------
ALTER TABLE public.sesiones_clase
  ADD COLUMN IF NOT EXISTS codigo_sesion VARCHAR(6),
  ADD COLUMN IF NOT EXISTS enlace_zoom TEXT,
  ADD COLUMN IF NOT EXISTS calificacion_tutor SMALLINT,
  ADD COLUMN IF NOT EXISTS motivo_incumplimiento TEXT,
  ADD COLUMN IF NOT EXISTS motivo_contingencia TEXT,
  ADD COLUMN IF NOT EXISTS comision_plataforma NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS honorario_neto NUMERIC(10, 2);

UPDATE public.sesiones_clase
SET codigo_sesion = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))
WHERE codigo_sesion IS NULL;

ALTER TABLE public.sesiones_clase
  DROP CONSTRAINT IF EXISTS sesiones_clase_calificacion_tutor_check;

ALTER TABLE public.sesiones_clase
  ADD CONSTRAINT sesiones_clase_calificacion_tutor_check
  CHECK (calificacion_tutor IS NULL OR (calificacion_tutor BETWEEN 1 AND 5));

ALTER TABLE public.sesiones_clase
  DROP CONSTRAINT IF EXISTS sesiones_clase_codigo_sesion_check;

ALTER TABLE public.sesiones_clase
  ADD CONSTRAINT sesiones_clase_codigo_sesion_check
  CHECK (codigo_sesion IS NULL OR codigo_sesion ~ '^[A-Z0-9]{6}$');

-- ----------------------------------------------------------------------------
-- 3. FUNCIÓN RPC: rpc_bloquear_fondos_escrow
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_bloquear_fondos_escrow(
  p_abono_id UUID,
  p_tutor_id UUID,
  p_alumno_id UUID,
  p_profesor_id UUID,
  p_fecha_hora TIMESTAMPTZ,
  p_modalidad public.modalidad_clase,
  p_monto_bruto NUMERIC,
  p_codigo_sesion VARCHAR(6)
)
RETURNS public.sesiones_clase
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_monto_bruto NUMERIC(10, 2);
  v_comision_15 NUMERIC(10, 2);
  v_honorario_85 NUMERIC(10, 2);
  v_codigo VARCHAR(6);
  v_sesion public.sesiones_clase;
BEGIN
  IF p_tutor_id IS NULL OR p_alumno_id IS NULL OR p_profesor_id IS NULL THEN
    RAISE EXCEPTION 'Los identificadores p_tutor_id, p_alumno_id y p_profesor_id son obligatorios.';
  END IF;

  v_monto_bruto := ROUND(COALESCE(p_monto_bruto, 0), 2);
  IF v_monto_bruto <= 0 THEN
    RAISE EXCEPTION 'El monto bruto a bloquear en Escrow debe ser mayor a $0.00 USD.';
  END IF;

  v_codigo := UPPER(TRIM(COALESCE(p_codigo_sesion, '')));
  IF v_codigo !~ '^[A-Z0-9]{6}$' THEN
    RAISE EXCEPTION 'El código de sesión pre-clase debe contener exactamente 6 caracteres alfanuméricos.';
  END IF;

  v_comision_15 := ROUND(v_monto_bruto * 0.15, 2);
  v_honorario_85 := ROUND(v_monto_bruto - v_comision_15, 2);

  INSERT INTO public.sesiones_clase (
    abono_id,
    tutor_id,
    alumno_id,
    profesor_id,
    fecha_hora,
    modalidad,
    monto_bruto,
    comision_plataforma,
    honorario_neto,
    codigo_sesion,
    estado_sesion,
    estado_escrow
  )
  VALUES (
    p_abono_id,
    p_tutor_id,
    p_alumno_id,
    p_profesor_id,
    p_fecha_hora,
    p_modalidad,
    v_monto_bruto,
    v_comision_15,
    v_honorario_85,
    v_codigo,
    'programada',
    'bloqueado'
  )
  RETURNING * INTO v_sesion;

  INSERT INTO public.movimientos_escrow (
    sesion_id,
    usuario_id,
    tipo,
    monto_usd,
    descripcion
  )
  VALUES (
    v_sesion.id,
    p_tutor_id,
    'bloqueo',
    v_monto_bruto,
    FORMAT(
      'Retención fiduciaria Escrow por reserva (%s) • Código: %s • Neto docente (85%%): $%s USD',
      p_modalidad::TEXT,
      v_codigo,
      v_honorario_85::TEXT
    )
  );

  RETURN v_sesion;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. FUNCIÓN RPC: rpc_confirmar_asistencia_y_liberar
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_confirmar_asistencia_y_liberar(
  p_sesion_id UUID,
  p_tutor_id UUID,
  p_calificacion SMALLINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sesion public.sesiones_clase;
  v_comision_15 NUMERIC(10, 2);
  v_honorario_85 NUMERIC(10, 2);
  v_mov_comision public.movimientos_escrow;
  v_mov_liberacion public.movimientos_escrow;
BEGIN
  IF p_sesion_id IS NULL OR p_tutor_id IS NULL THEN
    RAISE EXCEPTION 'Los parámetros p_sesion_id y p_tutor_id son obligatorios.';
  END IF;

  IF p_calificacion IS NULL OR p_calificacion < 1 OR p_calificacion > 5 THEN
    RAISE EXCEPTION 'La calificación de la encuesta debe estar entre 1 y 5 estrellas.';
  END IF;

  SELECT *
  INTO v_sesion
  FROM public.sesiones_clase
  WHERE id = p_sesion_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La sesión especificada (%) no existe.', p_sesion_id;
  END IF;

  IF v_sesion.tutor_id <> p_tutor_id THEN
    RAISE EXCEPTION 'Acceso denegado: el usuario no es el representante legal registrado en esta sesión.';
  END IF;

  IF v_sesion.estado_sesion::TEXT <> 'declarada_docente' THEN
    RAISE EXCEPTION 'La sesión debe estar en estado declarada_docente para confirmar asistencia (estado actual: %).', v_sesion.estado_sesion;
  END IF;

  IF v_sesion.estado_escrow::TEXT <> 'bloqueado' THEN
    RAISE EXCEPTION 'Los fondos de esta sesión ya fueron procesados previamente (estado_escrow: %).', v_sesion.estado_escrow;
  END IF;

  v_comision_15 := ROUND(v_sesion.monto_bruto * 0.15, 2);
  v_honorario_85 := ROUND(v_sesion.monto_bruto - v_comision_15, 2);

  UPDATE public.sesiones_clase
  SET
    estado_sesion = 'asistencia_validada',
    estado_escrow = 'liberado',
    calificacion_tutor = p_calificacion,
    comision_plataforma = v_comision_15,
    honorario_neto = v_honorario_85
  WHERE id = p_sesion_id
  RETURNING * INTO v_sesion;

  INSERT INTO public.movimientos_escrow (
    sesion_id,
    usuario_id,
    tipo,
    monto_usd,
    descripcion
  )
  VALUES (
    p_sesion_id,
    v_sesion.profesor_id,
    'comision',
    v_comision_15,
    FORMAT('Comisión operativa FundaOboeHJK (15%%) sobre sesión validada (%s★)', p_calificacion)
  )
  RETURNING * INTO v_mov_comision;

  INSERT INTO public.movimientos_escrow (
    sesion_id,
    usuario_id,
    tipo,
    monto_usd,
    descripcion
  )
  VALUES (
    p_sesion_id,
    v_sesion.profesor_id,
    'liberacion',
    v_honorario_85,
    FORMAT('Honorario neto (85%%) acumulado para corte de fin de mes (%s★)', p_calificacion)
  )
  RETURNING * INTO v_mov_liberacion;

  RETURN jsonb_build_object(
    'ok', true,
    'sesion', to_jsonb(v_sesion),
    'movimiento_comision', to_jsonb(v_mov_comision),
    'movimiento_liberacion', to_jsonb(v_mov_liberacion)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_bloquear_fondos_escrow(
  UUID, UUID, UUID, UUID, TIMESTAMPTZ, public.modalidad_clase, NUMERIC, VARCHAR
) TO authenticated, anon;

GRANT EXECUTE ON FUNCTION public.rpc_confirmar_asistencia_y_liberar(
  UUID, UUID, SMALLINT
) TO authenticated, anon;
