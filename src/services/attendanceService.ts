// src/services/attendanceService.ts
import { supabase } from '../lib/supabase';
import {
  MovimientoEscrowRow,
  RpcConfirmarAsistenciaArgs,
  RpcConfirmarAsistenciaResponse,
  SesionClaseRow,
} from '../types/atril.types';
import { calcularHonorarioClase } from '../utils/escrowCalculator';
import { guardarSesionEnCache, obtenerSesionEnCache } from './escrowService';

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
 * Protocolo Pre-Clase (Zoom):
 * El profesor ingresa el codigo_sesion de 6 caracteres proporcionado por el alumno.
 * Al coincidir, se marca el inicio formal ('iniciada') y se bloquea la posibilidad
 * de abrir disputa por inasistencia.
 */
export async function validarCodigoEIniciarSesion(
  sesionId: string,
  profesorId: string,
  codigoIngresado: string
): Promise<SesionClaseRow> {
  if (!sesionId || !profesorId || !codigoIngresado.trim()) {
    throw new Error('Se requieren sesionId, profesorId y el código de validación de 6 dígitos.');
  }

  const codigoNormalizado = codigoIngresado.trim().toUpperCase();

  const { data: sesionActual } = await supabase
    .from('sesiones_clase')
    .select('*')
    .eq('id', sesionId)
    .eq('profesor_id', profesorId)
    .single();

  const sesionPrev = (sesionActual as SesionClaseRow | null) ?? obtenerSesionEnCache(sesionId);

  if (!sesionPrev) {
    throw new Error('Sesión no encontrada para este docente.');
  }

  if (
    sesionPrev.estado_sesion !== 'programada' &&
    sesionPrev.estado_sesion !== 'reprogramada_fuerza_mayor'
  ) {
    throw new Error(
      `La sesión no puede iniciarse desde el estado actual (${sesionPrev.estado_sesion}).`
    );
  }

  if (sesionPrev.codigo_sesion.toUpperCase() !== codigoNormalizado) {
    throw new Error(
      'El código de validación ingresado no coincide con el código asignado al alumno.'
    );
  }

  const { data: sesionIniciada } = await supabase
    .from('sesiones_clase')
    .update({ estado_sesion: 'iniciada' })
    .eq('id', sesionId)
    .eq('profesor_id', profesorId)
    .select('*')
    .single();

  const resultado: SesionClaseRow = (sesionIniciada as SesionClaseRow | null) ?? {
    ...sesionPrev,
    estado_sesion: 'iniciada',
  };

  guardarSesionEnCache(resultado);
  return resultado;
}

/**
 * Paso 1 Post-Inicio (Docente): El profesor declara que la sesión (previamente 'iniciada'
 * con código validado) fue impartida.
 */
export async function declararClaseImpartida(
  sesionId: string,
  profesorId: string
): Promise<SesionClaseRow> {
  if (!sesionId || !profesorId) {
    throw new Error('Se requieren sesionId y profesorId para declarar la clase impartida.');
  }

  const { data: sesionActual } = await supabase
    .from('sesiones_clase')
    .select('*')
    .eq('id', sesionId)
    .eq('profesor_id', profesorId)
    .single();

  const sesionPrev = (sesionActual as SesionClaseRow | null) ?? obtenerSesionEnCache(sesionId);

  if (!sesionPrev) {
    throw new Error('Sesión no encontrada.');
  }

  if (sesionPrev.estado_sesion !== 'iniciada') {
    throw new Error(
      'Debes validar primero el código de sesión de 6 dígitos con el alumno para registrar la clase como impartida.'
    );
  }

  const { data } = await supabase
    .from('sesiones_clase')
    .update({ estado_sesion: 'declarada_docente' })
    .eq('id', sesionId)
    .eq('profesor_id', profesorId)
    .select('*')
    .single();

  const resultado: SesionClaseRow = (data as SesionClaseRow | null) ?? {
    ...sesionPrev,
    estado_sesion: 'declarada_docente',
  };

  guardarSesionEnCache(resultado);
  return resultado;
}

/**
 * Paso 2 (Tutor/Alumno): Ejecuta la función RPC atómica `rpc_confirmar_asistencia_y_liberar`
 * en PostgreSQL:
 * - Valida que el usuario sea el tutor legal y que la sesión esté en 'declarada_docente'.
 * - Actualiza la sesión a 'asistencia_validada' + 'liberado' y guarda calificacion_tutor (1 a 5).
 * - Inserta los asientos contables inmutables 'comision' (15%) y 'liberacion' (85%).
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
    throw new Error(
      'La calificación de la encuesta debe ser un número entero entre 1 y 5 estrellas.'
    );
  }

  const rpcArgs: RpcConfirmarAsistenciaArgs = {
    p_sesion_id: sesionId,
    p_tutor_id: tutorId,
    p_calificacion: calificacionEstrellas,
  };

  const { data, error } = await supabase.rpc('rpc_confirmar_asistencia_y_liberar', rpcArgs);

  if (!error && data) {
    const payload = data as RpcConfirmarAsistenciaResponse;
    guardarSesionEnCache(payload.sesion);
    return {
      sesion: payload.sesion,
      movimientoComision: payload.movimiento_comision,
      movimientoLiberacion: payload.movimiento_liberacion,
    };
  }

  // Respaldo controlado si la sesión está en caché local (ej. modo demo sin semillas en BD)
  const sesionPrev = obtenerSesionEnCache(sesionId);
  if (!sesionPrev) {
    throw new Error(
      `Error en transacción RPC rpc_confirmar_asistencia_y_liberar: ${error?.message ?? 'Sin respuesta del motor SQL'}`
    );
  }

  if (
    sesionPrev.estado_sesion !== 'declarada_docente' &&
    sesionPrev.estado_sesion !== 'iniciada'
  ) {
    throw new Error(
      `La sesión debe haber sido iniciada con código o declarada por el docente antes de confirmarse (estado actual: ${sesionPrev.estado_sesion}).`
    );
  }

  if (sesionPrev.estado_escrow !== 'bloqueado') {
    throw new Error(
      `Los fondos de esta sesión ya fueron procesados previamente (estado Escrow: ${sesionPrev.estado_escrow}).`
    );
  }

  const desglose = calcularHonorarioClase(Number(sesionPrev.monto_bruto));
  const ahoraIso = new Date().toISOString();

  const sesionActualizada: SesionClaseRow = {
    ...sesionPrev,
    estado_sesion: 'asistencia_validada',
    estado_escrow: 'liberado',
    calificacion_tutor: calificacionEstrellas,
    comision_plataforma: desglose.comisionPlataforma,
    honorario_neto: desglose.honorarioNeto,
  };

  guardarSesionEnCache(sesionActualizada);

  const movimientoComision: MovimientoEscrowRow = {
    id: `${sesionId}-com`,
    sesion_id: sesionId,
    usuario_id: sesionPrev.profesor_id,
    tipo: 'comision',
    monto_usd: desglose.comisionPlataforma,
    descripcion: `Comisión operativa FundaOboeHJK (15%) sobre sesión validada (${calificacionEstrellas}★)`,
    created_at: ahoraIso,
  };

  const movimientoLiberacion: MovimientoEscrowRow = {
    id: `${sesionId}-lib`,
    sesion_id: sesionId,
    usuario_id: sesionPrev.profesor_id,
    tipo: 'liberacion',
    monto_usd: desglose.honorarioNeto,
    descripcion: `Honorario neto (85%) acumulado para corte de fin de mes (${calificacionEstrellas}★)`,
    created_at: ahoraIso,
  };

  return {
    sesion: sesionActualizada,
    movimientoComision,
    movimientoLiberacion,
  };
}

/**
 * Módulo de Contingencia por Falla de Luz/Internet:
 * Permite al alumno/tutor o al profesor declarar una interrupción por fuerza mayor,
 * manteniendo los fondos congelados en Escrow ('bloqueado') sin debitar la clase
 * y marcando la sesión como 'reprogramada_fuerza_mayor' para reubicar la fecha en agenda.
 */
export async function solicitarReprogramacionContingencia(
  sesionId: string,
  motivo: string,
  nuevaFechaHoraOpcional?: string
): Promise<SesionClaseRow> {
  if (!sesionId || !motivo || !motivo.trim()) {
    throw new Error(
      'Debes indicar el identificador de la sesión y el motivo de fuerza mayor (ej. corte eléctrico o caída de internet).'
    );
  }

  const { data: sesionActual } = await supabase
    .from('sesiones_clase')
    .select('*')
    .eq('id', sesionId)
    .single();

  const sesionPrev = (sesionActual as SesionClaseRow | null) ?? obtenerSesionEnCache(sesionId);

  if (!sesionPrev) {
    throw new Error('Sesión no encontrada.');
  }

  if (sesionPrev.estado_escrow !== 'bloqueado') {
    throw new Error(
      `No se puede reprogramar por contingencia porque los fondos ya no están en custodia activa (estado Escrow: ${sesionPrev.estado_escrow}).`
    );
  }

  if (
    sesionPrev.estado_sesion === 'asistencia_validada' ||
    sesionPrev.estado_sesion === 'cancelada'
  ) {
    throw new Error(
      `No es posible declarar contingencia sobre una sesión en estado '${sesionPrev.estado_sesion}'.`
    );
  }

  const camposActualizados: Record<string, unknown> = {
    estado_sesion: 'reprogramada_fuerza_mayor',
    estado_escrow: 'bloqueado',
    motivo_contingencia: motivo.trim(),
  };

  if (nuevaFechaHoraOpcional) {
    camposActualizados.fecha_hora = nuevaFechaHoraOpcional;
  }

  const { data: sesionReprogramada } = await supabase
    .from('sesiones_clase')
    .update(camposActualizados)
    .eq('id', sesionId)
    .select('*')
    .single();

  const resultado: SesionClaseRow = (sesionReprogramada as SesionClaseRow | null) ?? {
    ...sesionPrev,
    estado_sesion: 'reprogramada_fuerza_mayor',
    estado_escrow: 'bloqueado',
    motivo_contingencia: motivo.trim(),
    fecha_hora: nuevaFechaHoraOpcional ?? sesionPrev.fecha_hora,
  };

  guardarSesionEnCache(resultado);
  return resultado;
}

/**
 * Reembolso al 100% en caso de inasistencia del docente.
 * Regla de seguridad: Si el código de sesión ya fue validado ('iniciada', 'declarada_docente'
 * o 'asistencia_validada'), queda bloqueada la disputa por inasistencia.
 */
export async function reportarIncumplimientoYReembolsar(
  sesionId: string,
  tutorId: string,
  motivo: string
): Promise<ReembolsoIncumplimientoResultado> {
  if (!sesionId || !tutorId || !motivo.trim()) {
    throw new Error('Debes indicar la sesión, el tutor y el motivo del incumplimiento.');
  }

  const { data: sesionActual } = await supabase
    .from('sesiones_clase')
    .select('*')
    .eq('id', sesionId)
    .eq('tutor_id', tutorId)
    .single();

  const sesionPrev = (sesionActual as SesionClaseRow | null) ?? obtenerSesionEnCache(sesionId);

  if (!sesionPrev) {
    throw new Error('Sesión no encontrada.');
  }

  if (
    sesionPrev.estado_sesion === 'iniciada' ||
    sesionPrev.estado_sesion === 'declarada_docente' ||
    sesionPrev.estado_sesion === 'asistencia_validada'
  ) {
    throw new Error(
      'Disputa por inasistencia bloqueada: el código de validación pre-clase ya fue verificado al inicio de la sesión.'
    );
  }

  const { data: sesionReembolsada } = await supabase
    .from('sesiones_clase')
    .update({
      estado_sesion: 'incumplimiento_reportado',
      estado_escrow: 'reembolsado',
      motivo_incumplimiento: motivo.trim(),
    })
    .eq('id', sesionId)
    .select('*')
    .single();

  const sesionFinal: SesionClaseRow = (sesionReembolsada as SesionClaseRow | null) ?? {
    ...sesionPrev,
    estado_sesion: 'incumplimiento_reportado',
    estado_escrow: 'reembolsado',
    motivo_incumplimiento: motivo.trim(),
  };

  guardarSesionEnCache(sesionFinal);

  const { data: movReembolso } = await supabase
    .from('movimientos_escrow')
    .insert([
      {
        sesion_id: sesionId,
        usuario_id: tutorId,
        tipo: 'reembolso',
        monto_usd: Number(sesionPrev.monto_bruto),
        descripcion: `Reembolso 100% a favor del tutor por inasistencia: ${motivo.trim()}`,
      },
    ])
    .select('*')
    .single();

  return {
    sesion: sesionFinal,
    movimientoReembolso: (movReembolso as MovimientoEscrowRow | null) ?? {
      id: `${sesionId}-reemb`,
      sesion_id: sesionId,
      usuario_id: tutorId,
      tipo: 'reembolso',
      monto_usd: Number(sesionPrev.monto_bruto),
      descripcion: `Reembolso 100% a favor del tutor por inasistencia: ${motivo.trim()}`,
      created_at: new Date().toISOString(),
    },
  };
}
