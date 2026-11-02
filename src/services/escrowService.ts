// src/services/escrowService.ts
import { supabase } from '../lib/supabase';
import {
  BloquearFondosParams,
  MovimientoEscrowRow,
  ResumenBilletera,
  SesionClaseRow,
} from '../types/atril.types';
import { redondearMoneda } from '../utils/escrowCalculator';

export interface BloquearFondosResultado {
  sesion: SesionClaseRow;
  movimiento: MovimientoEscrowRow;
}

/**
 * Crea la sesión de clase con fondos retenidos en custodia fiduciaria (estado_escrow: 'bloqueado')
 * y registra el asiento contable inmutable en movimientos_escrow (tipo: 'bloqueo').
 */
export async function bloquearFondosEscrow(
  params: BloquearFondosParams
): Promise<BloquearFondosResultado> {
  const { abonoId, tutorId, alumnoId, profesorId, fechaHora, modalidad, montoBruto } = params;

  if (!tutorId || !alumnoId || !profesorId) {
    throw new Error('Los identificadores de tutor, alumno y profesor son obligatorios.');
  }

  const montoRedondeado = redondearMoneda(montoBruto);
  if (montoRedondeado <= 0) {
    throw new Error('El monto a bloquear en Escrow debe ser mayor a $0.00 USD.');
  }

  const { data: sesionData, error: sesionError } = await supabase
    .from('sesiones_clase')
    .insert([
      {
        abono_id: abonoId ?? null,
        tutor_id: tutorId,
        alumno_id: alumnoId,
        profesor_id: profesorId,
        fecha_hora: fechaHora,
        modalidad,
        monto_bruto: montoRedondeado,
        estado_sesion: 'programada',
        estado_escrow: 'bloqueado',
      },
    ])
    .select('*')
    .single();

  if (sesionError || !sesionData) {
    throw new Error(
      `Error al crear la sesión y bloquear fondos en Escrow: ${sesionError?.message ?? 'Sin respuesta'}`
    );
  }

  const sesion = sesionData as SesionClaseRow;

  const { data: movData, error: movError } = await supabase
    .from('movimientos_escrow')
    .insert([
      {
        sesion_id: sesion.id,
        usuario_id: tutorId,
        tipo: 'bloqueo',
        monto_usd: montoRedondeado,
        descripcion: `Retención fiduciaria Escrow por reserva de clase (${modalidad})`,
      },
    ])
    .select('*')
    .single();

  if (movError || !movData) {
    throw new Error(
      `Error al registrar el asiento contable de bloqueo en movimientos_escrow: ${movError?.message ?? 'Sin respuesta'}`
    );
  }

  return {
    sesion,
    movimiento: movData as MovimientoEscrowRow,
  };
}

/**
 * Obtiene el resumen de saldos de la billetera según el rol operativo ('tutor' | 'profesor').
 */
export async function obtenerResumenBilletera(
  userId: string,
  rol: 'tutor' | 'profesor'
): Promise<ResumenBilletera> {
  if (!userId) {
    throw new Error('El identificador del usuario (userId) es obligatorio.');
  }

  if (rol === 'tutor') {
    const { data: sesionesBloqueadas, error: sesError } = await supabase
      .from('sesiones_clase')
      .select('monto_bruto')
      .eq('tutor_id', userId)
      .eq('estado_escrow', 'bloqueado');

    if (sesError) {
      throw new Error(`Error al consultar custodia del tutor: ${sesError.message}`);
    }

    const { data: movimientos, error: movError } = await supabase
      .from('movimientos_escrow')
      .select('tipo, monto_usd')
      .eq('usuario_id', userId);

    if (movError) {
      throw new Error(`Error al consultar movimientos del tutor: ${movError.message}`);
    }

    const saldoRetenidoEscrowUsd = redondearMoneda(
      (sesionesBloqueadas ?? []).reduce((acc, row) => acc + Number(row.monto_bruto || 0), 0)
    );

    const recargasYReembolsos = (movimientos ?? []).reduce((acc, mov) => {
      if (mov.tipo === 'recarga' || mov.tipo === 'reembolso') {
        return acc + Number(mov.monto_usd || 0);
      }
      if (mov.tipo === 'bloqueo') {
        return acc - Number(mov.monto_usd || 0);
      }
      return acc;
    }, 0);

    return {
      rol: 'tutor',
      userId,
      saldoDisponibleUsd: Math.max(0, redondearMoneda(recargasYReembolsos)),
      saldoRetenidoEscrowUsd,
    };
  }

  // Rol profesor
  const { data: sesionesPendientes, error: pendError } = await supabase
    .from('sesiones_clase')
    .select('monto_bruto')
    .eq('profesor_id', userId)
    .eq('estado_escrow', 'bloqueado');

  if (pendError) {
    throw new Error(`Error al consultar honorarios por liberar del profesor: ${pendError.message}`);
  }

  const { data: liberaciones, error: libError } = await supabase
    .from('movimientos_escrow')
    .select('monto_usd')
    .eq('usuario_id', userId)
    .eq('tipo', 'liberacion');

  if (libError) {
    throw new Error(`Error al consultar honorarios liquidados del profesor: ${libError.message}`);
  }

  const saldoPendientePorLiberarUsd = redondearMoneda(
    (sesionesPendientes ?? []).reduce((acc, row) => acc + Number(row.monto_bruto || 0) * 0.85, 0)
  );

  const saldoLiquidableAcumuladoUsd = redondearMoneda(
    (liberaciones ?? []).reduce((acc, mov) => acc + Number(mov.monto_usd || 0), 0)
  );

  return {
    rol: 'profesor',
    userId,
    saldoLiquidableAcumuladoUsd,
    saldoPendientePorLiberarUsd,
  };
}
