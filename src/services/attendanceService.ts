// src/services/attendanceService.ts
import { supabase } from '../lib/supabase';
import { MovimientoEscrowRow, SesionClaseRow } from '../types/atril.types';
import { calcularHonorarioClase } from '../utils/escrowCalculator';

export interface LiquidacionBidireccionalResultado {
  sesion: SesionClaseRow;
  movimientoComision: MovimientoEscrowRow;
  movimientoLiberacion: MovimientoEscrowRow;
}

export interface ReembolsoIncumplimientoResultado {
  sesion: SesionClaseRow;
  movimientoReembolso: MovimientoEscrowRow;
}

/**
 * Paso 1 (Docente): El profesor declara que la sesión fue impartida.
 * Actualiza estado_sesion a 'declarada_docente' manteniendo los fondos en custodia ('bloqueado')
 * hasta que el tutor responda la encuesta de validación.
 */
export async function declararClaseImpartida(
  sesionId: string,
  profesorId: string
): Promise<SesionClaseRow> {
  if (!sesionId || !profesorId) {
    throw new Error('Se requieren sesionId y profesorId para declarar la clase impartida.');
  }

  const { data, error } = await supabase
    .from('sesiones_clase')
    .update({ estado_sesion: 'declarada_docente' })
    .eq('id', sesionId)
    .eq('profesor_id', profesorId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Error al declarar la clase impartida: ${error?.message ?? 'Sesión no encontrada'}`);
  }

  return data as SesionClaseRow;
}

/**
 * Paso 2 (Tutor/Alumno): Responde la encuesta post-clase (1 a 5 estrellas), confirma asistencia
 * y ejecuta la liquidación bidireccional del Escrow:
 * - 15% Comisión de plataforma (FundaOboeHJK)
 * - 85% Honorario líquido neto liberado a favor del docente
 */
export async function responderEncuestaYConfirmar(
  sesionId: string,
  tutorId: string,
  calificacionEstrellas: number
): Promise<LiquidacionBidireccionalResultado> {
  if (!sesionId || !tutorId) {
    throw new Error('Los identificadores sesionId y tutorId son obligatorios.');
  }

  if (
    !Number.isInteger(calificacionEstrellas) ||
    calificacionEstrellas < 1 ||
    calificacionEstrellas > 5
  ) {
    throw new Error('La calificación de la encuesta debe ser un número entero entre 1 y 5 estrellas.');
  }

  // 1. Verificar el estado actual de la sesión
  const { data: sesionActual, error: fetchError } = await supabase
    .from('sesiones_clase')
    .select('*')
    .eq('id', sesionId)
    .eq('tutor_id', tutorId)
    .single();

  if (fetchError || !sesionActual) {
    throw new Error(`No se encontró la sesión de clase: ${fetchError?.message ?? 'ID inválido'}`);
  }

  const sesionPrev = sesionActual as SesionClaseRow;

  if (sesionPrev.estado_sesion !== 'declarada_docente') {
    throw new Error(
      `El docente aún no ha declarado esta clase como impartida (estado actual: ${sesionPrev.estado_sesion}).`
    );
  }

  if (sesionPrev.estado_escrow !== 'bloqueado') {
    throw new Error(
      `Los fondos de esta sesión ya fueron procesados previamente (estado Escrow: ${sesionPrev.estado_escrow}).`
    );
  }

  // 2. Calcular partición fiduciaria (15% comisión / 85% honorario neto)
  const desglose = calcularHonorarioClase(Number(sesionPrev.monto_bruto));

  // 3. Actualizar sesión a asistencia_validada + liberado
  const { data: sesionActualizada, error: updateError } = await supabase
    .from('sesiones_clase')
    .update({
      estado_sesion: 'asistencia_validada',
      estado_escrow: 'liberado',
      calificacion_tutor: calificacionEstrellas,
    })
    .eq('id', sesionId)
    .select('*')
    .single();

  if (updateError || !sesionActualizada) {
    throw new Error(
      `Error al actualizar estado de liquidación de la sesión: ${updateError?.message ?? ''}`
    );
  }

  // 4. Registrar asiento de comisión (15%) y liberación al docente (85%)
  const { data: movComision, error: comError } = await supabase
    .from('movimientos_escrow')
    .insert([
      {
        sesion_id: sesionId,
        usuario_id: sesionPrev.profesor_id,
        tipo: 'comision',
        monto_usd: desglose.comisionPlataforma,
        descripcion: `Comisión operativa FundaOboeHJK (15%) sobre sesión validada (${calificacionEstrellas}★)`,
      },
    ])
    .select('*')
    .single();

  if (comError || !movComision) {
    throw new Error(`Error al registrar movimiento de comisión 15%: ${comError?.message ?? ''}`);
  }

  const { data: movLiberacion, error: libError } = await supabase
    .from('movimientos_escrow')
    .insert([
      {
        sesion_id: sesionId,
        usuario_id: sesionPrev.profesor_id,
        tipo: 'liberacion',
        monto_usd: desglose.honorarioNeto,
        descripcion: `Liberación de honorario neto (85%) tras encuesta del tutor (${calificacionEstrellas}★)`,
      },
    ])
    .select('*')
    .single();

  if (libError || !movLiberacion) {
    throw new Error(`Error al registrar liberación de honorario 85%: ${libError?.message ?? ''}`);
  }

  return {
    sesion: sesionActualizada as SesionClaseRow,
    movimientoComision: movComision as MovimientoEscrowRow,
    movimientoLiberacion: movLiberacion as MovimientoEscrowRow,
  };
}

/**
 * Reembolso automático al 100% en caso de inasistencia del docente o incumplimiento reportado.
 */
export async function reportarIncumplimientoYReembolsar(
  sesionId: string,
  tutorId: string,
  motivo: string
): Promise<ReembolsoIncumplimientoResultado> {
  if (!sesionId || !tutorId || !motivo.trim()) {
    throw new Error('Debes indicar la sesión, el tutor y el motivo del incumplimiento.');
  }

  const { data: sesionActual, error: fetchError } = await supabase
    .from('sesiones_clase')
    .select('*')
    .eq('id', sesionId)
    .eq('tutor_id', tutorId)
    .single();

  if (fetchError || !sesionActual) {
    throw new Error(`Sesión no encontrada: ${fetchError?.message ?? ''}`);
  }

  const sesionPrev = sesionActual as SesionClaseRow;

  const { data: sesionReembolsada, error: updError } = await supabase
    .from('sesiones_clase')
    .update({
      estado_sesion: 'incumplimiento_reportado',
      estado_escrow: 'reembolsado',
      motivo_incumplimiento: motivo.trim(),
    })
    .eq('id', sesionId)
    .select('*')
    .single();

  if (updError || !sesionReembolsada) {
    throw new Error(`Error al procesar reembolso de la sesión: ${updError?.message ?? ''}`);
  }

  const { data: movReembolso, error: movError } = await supabase
    .from('movimientos_escrow')
    .insert([
      {
        sesion_id: sesionId,
        usuario_id: tutorId,
        tipo: 'reembolso',
        monto_usd: Number(sesionPrev.monto_bruto),
        descripcion: `Reembolso 100% a favor del tutor por incumplimiento: ${motivo.trim()}`,
      },
    ])
    .select('*')
    .single();

  if (movError || !movReembolso) {
    throw new Error(`Error al registrar asiento de reembolso: ${movError?.message ?? ''}`);
  }

  return {
    sesion: sesionReembolsada as SesionClaseRow,
    movimientoReembolso: movReembolso as MovimientoEscrowRow,
  };
}
