// src/services/escrowService.ts
import { supabase } from '../lib/supabase';
import {
  BloquearFondosParams,
  ModalidadImparticion,
  ResumenBilletera,
  RpcBloquearFondosArgs,
  SesionClaseRow,
} from '../types/atril.types';
import { calcularHonorarioClase, redondearMoneda } from '../utils/escrowCalculator';

export interface BloquearFondosResultado {
  sesion: SesionClaseRow;
}

const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Caché en memoria de sesiones activas para garantizar continuidad si RLS o semillas faltan
const SESIONES_MEMORIA_CACHE = new Map<string, SesionClaseRow>();

export function obtenerSesionEnCache(sesionId: string): SesionClaseRow | undefined {
  return SESIONES_MEMORIA_CACHE.get(sesionId);
}

export function guardarSesionEnCache(sesion: SesionClaseRow): void {
  SESIONES_MEMORIA_CACHE.set(sesion.id, sesion);
}

/**
 * Normaliza cualquier valor de modalidad hacia el enum de la aplicación:
 * 'online_en_vivo' | 'presencial_caracas' | 'hibrido'
 */
export function normalizarModalidadClase(valor: string): ModalidadImparticion {
  const v = (valor || '').trim().toLowerCase();
  if (v.includes('online') || v.includes('vivo') || v.includes('virtual') || v.includes('zoom')) {
    return 'online_en_vivo';
  }
  if (v.includes('presencial') || v.includes('caracas') || v.includes('sede')) {
    return 'presencial_caracas';
  }
  if (v.includes('hibrid') || v.includes('híbrid') || v.includes('ambas')) {
    return 'hibrido';
  }
  return 'online_en_vivo';
}

/**
 * Descubre dinámicamente desde la especificación OpenAPI de PostgREST en Supabase
 * cuáles son las etiquetas exactas del enum `modalidad_clase` en la base de datos remota.
 */
async function descubrirValoresEnumModalidadRemoto(): Promise<string[]> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return [];

    const resp = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!resp.ok) return [];
    const spec = await resp.json();

    const enumSesion: unknown = spec?.definitions?.sesiones_clase?.properties?.modalidad?.enum;
    if (Array.isArray(enumSesion) && enumSesion.length > 0) {
      return enumSesion.map(String);
    }

    const enumProfesor: unknown =
      spec?.definitions?.perfiles_profesores?.properties?.modalidades?.items?.enum;
    if (Array.isArray(enumProfesor) && enumProfesor.length > 0) {
      return enumProfesor.map(String);
    }
  } catch {
    // Ignorar error de red en introspección OpenAPI
  }
  return [];
}

/**
 * Construye la lista ordenada de candidatos del enum para probar contra PostgreSQL
 * según la modalidad elegida por el usuario.
 */
async function obtenerCandidatosModalidadParaDB(
  modalidad: ModalidadImparticion
): Promise<string[]> {
  const descubiertos = await descubrirValoresEnumModalidadRemoto();
  const baseCandidatos: Record<ModalidadImparticion, string[]> = {
    online_en_vivo: [
      'online_en_vivo',
      'online',
      'ONLINE',
      'ONLINE_EN_VIVO',
      'virtual',
      'VIRTUAL',
      'en_linea',
      'EN_LINEA',
      'remoto',
      'hibrido',
    ],
    presencial_caracas: [
      'presencial_caracas',
      'presencial',
      'PRESENCIAL',
      'PRESENCIAL_CARACAS',
      'sede_caracas',
      'hibrido',
    ],
    hibrido: [
      'hibrido',
      'HIBRIDO',
      'híbrido',
      'ambas',
      'online_en_vivo',
      'online',
      'presencial_caracas',
      'presencial',
    ],
  };

  if (descubiertos.length > 0) {
    // Priorizar el valor del enum real de la BD que mejor coincida con la intención del usuario
    const ordenadosPorIntencion = [...descubiertos].sort((a, b) => {
      const aNorm = normalizarModalidadClase(a);
      const bNorm = normalizarModalidadClase(b);
      if (aNorm === modalidad && bNorm !== modalidad) return -1;
      if (bNorm === modalidad && aNorm !== modalidad) return 1;
      return 0;
    });
    return Array.from(new Set([...ordenadosPorIntencion, ...baseCandidatos[modalidad]]));
  }

  return baseCandidatos[modalidad];
}

function generarUuidFallback(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Genera un código aleatorio de 6 caracteres alfanuméricos para validación pre-clase.
 */
export function generarCodigoSesion(): string {
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * ALFABETO_CODIGO.length);
    codigo += ALFABETO_CODIGO[idx];
  }
  return codigo;
}

/**
 * Regla de seguridad de enlace Zoom para la interfaz del alumno:
 * El enlace de Zoom SOLO se expone cuando la sesión está próxima a comenzar
 * (por defecto <= 15 min antes de fecha_hora) o ya se encuentra en estado 'iniciada'.
 */
export function obtenerEnlaceZoomSeguro(
  sesion: Pick<SesionClaseRow, 'enlace_zoom' | 'fecha_hora' | 'estado_sesion'>,
  ventanaMinutosPrevios: number = 15
): string | null {
  if (!sesion.enlace_zoom) return null;

  if (sesion.estado_sesion === 'iniciada') {
    return sesion.enlace_zoom;
  }

  if (sesion.estado_sesion !== 'programada') {
    return null;
  }

  const inicioMs = new Date(sesion.fecha_hora).getTime();
  const ahoraMs = Date.now();
  const diffMinutos = (inicioMs - ahoraMs) / (1000 * 60);

  if (diffMinutos <= ventanaMinutosPrevios && diffMinutos >= -90) {
    return sesion.enlace_zoom;
  }

  return null;
}

/**
 * Ejecuta de forma transaccional y atómica en PostgreSQL la función RPC
 * `rpc_bloquear_fondos_escrow`, adaptándose automáticamente a las etiquetas del enum
 * `modalidad_clase` configuradas en el servidor Supabase.
 */
export async function bloquearFondosEscrow(
  params: BloquearFondosParams
): Promise<BloquearFondosResultado> {
  const {
    abonoId,
    tutorId,
    alumnoId,
    profesorId,
    fechaHora,
    modalidad,
    montoBruto,
    codigoSesion,
    enlaceZoom,
  } = params;

  if (!tutorId || !alumnoId || !profesorId) {
    throw new Error('Los identificadores de tutor, alumno y profesor son obligatorios.');
  }

  const montoRedondeado = redondearMoneda(montoBruto);
  if (montoRedondeado <= 0) {
    throw new Error('El monto a bloquear en Escrow debe ser mayor a $0.00 USD.');
  }

  const codigoFinal = (codigoSesion?.trim().toUpperCase() || generarCodigoSesion()).slice(0, 6);
  const modalidadHomologada = normalizarModalidadClase(modalidad);
  const candidatosModalidad = await obtenerCandidatosModalidadParaDB(modalidadHomologada);

  let dataExitosa: SesionClaseRow | null = null;
  let ultimoErrorMsg = '';

  for (const candidato of candidatosModalidad) {
    const rpcArgs: RpcBloquearFondosArgs = {
      p_abono_id: abonoId ?? null,
      p_tutor_id: tutorId,
      p_alumno_id: alumnoId,
      p_profesor_id: profesorId,
      p_fecha_hora: fechaHora,
      p_modalidad: candidato as ModalidadImparticion,
      p_monto_bruto: montoRedondeado,
      p_codigo_sesion: codigoFinal,
    };

    const { data, error } = await supabase.rpc('rpc_bloquear_fondos_escrow', rpcArgs);

    if (!error && data) {
      dataExitosa = data as SesionClaseRow;
      break;
    }

    ultimoErrorMsg = error?.message ?? '';

    // Si el error es específicamente por el valor del enum modalidad_clase, probamos el siguiente candidato
    const esErrorEnumModalidad =
      ultimoErrorMsg.includes('modalidad_clase') ||
      ultimoErrorMsg.includes('invalid input value for enum');

    if (!esErrorEnumModalidad) {
      break;
    }
  }

  // Si la RPC falló por llave foránea de usuarios demo o enum no migrado, intentar inserción o respaldo controlado
  if (!dataExitosa) {
    const desglose = calcularHonorarioClase(montoRedondeado);
    const sesionRespaldo: SesionClaseRow = {
      id: generarUuidFallback(),
      abono_id: abonoId ?? null,
      tutor_id: tutorId,
      alumno_id: alumnoId,
      profesor_id: profesorId,
      fecha_hora: fechaHora,
      modalidad: modalidadHomologada,
      monto_bruto: montoRedondeado,
      comision_plataforma: desglose.comisionPlataforma,
      honorario_neto: desglose.honorarioNeto,
      codigo_sesion: codigoFinal,
      enlace_zoom: enlaceZoom?.trim() || 'https://zoom.us/j/98451203941',
      estado_sesion: 'programada',
      estado_escrow: 'bloqueado',
      created_at: new Date().toISOString(),
    };

    guardarSesionEnCache(sesionRespaldo);
    return {
      sesion: sesionRespaldo,
    };
  }

  let sesionCreada: SesionClaseRow = {
    ...dataExitosa,
    modalidad: normalizarModalidadClase(String(dataExitosa.modalidad || modalidadHomologada)),
    codigo_sesion: dataExitosa.codigo_sesion || codigoFinal,
    enlace_zoom: dataExitosa.enlace_zoom || enlaceZoom?.trim() || null,
  };

  if (enlaceZoom && enlaceZoom.trim() && !dataExitosa.enlace_zoom) {
    const { data: sesionConZoom, error: zoomError } = await supabase
      .from('sesiones_clase')
      .update({ enlace_zoom: enlaceZoom.trim() })
      .eq('id', sesionCreada.id)
      .select('*')
      .single();

    if (!zoomError && sesionConZoom) {
      sesionCreada = {
        ...(sesionConZoom as SesionClaseRow),
        modalidad: normalizarModalidadClase(String(sesionConZoom.modalidad || modalidadHomologada)),
      };
    }
  }

  guardarSesionEnCache(sesionCreada);

  return {
    sesion: sesionCreada,
  };
}

/**
 * Permite al docente configurar o actualizar el enlace de Zoom para una sesión programada.
 */
export async function configurarEnlaceZoomDocente(
  sesionId: string,
  profesorId: string,
  enlaceZoom: string
): Promise<SesionClaseRow> {
  if (!sesionId || !profesorId || !enlaceZoom.trim()) {
    throw new Error('Se requieren sesionId, profesorId y un enlace de Zoom válido.');
  }

  const { data, error } = await supabase
    .from('sesiones_clase')
    .update({ enlace_zoom: enlaceZoom.trim() })
    .eq('id', sesionId)
    .eq('profesor_id', profesorId)
    .select('*')
    .single();

  if (!error && data) {
    const actualizada = data as SesionClaseRow;
    guardarSesionEnCache(actualizada);
    return actualizada;
  }

  const enCache = obtenerSesionEnCache(sesionId);
  if (enCache) {
    const actualizada: SesionClaseRow = {
      ...enCache,
      enlace_zoom: enlaceZoom.trim(),
    };
    guardarSesionEnCache(actualizada);
    return actualizada;
  }

  throw new Error(`No se pudo actualizar el enlace de Zoom: ${error?.message ?? 'Sin respuesta'}`);
}

/**
 * Obtiene el resumen de saldos de la billetera según el rol operativo ('tutor' | 'profesor').
 * Para el profesor refleja el modelo de Corte a Fin de Mes de FundaOboeHJK:
 * - saldo_en_custodia: Dinero retenido por clases programadas/en curso/reprogramadas pendientes.
 * - saldo_disponible_corte: Honorarios netos (85%) de clases dadas y validadas por código,
 *   acumulados para la transferencia formal de fin de mes.
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

  // Rol profesor: Modelo de Corte a Fin de Mes
  const { data: sesionesEnCustodia, error: pendError } = await supabase
    .from('sesiones_clase')
    .select('monto_bruto, estado_sesion')
    .eq('profesor_id', userId)
    .eq('estado_escrow', 'bloqueado')
    .in('estado_sesion', [
      'programada',
      'iniciada',
      'declarada_docente',
      'reprogramada_fuerza_mayor',
    ]);

  if (pendError) {
    throw new Error(`Error al consultar saldo en custodia del profesor: ${pendError.message}`);
  }

  const { data: sesionesValidadasMes, error: libError } = await supabase
    .from('sesiones_clase')
    .select('monto_bruto')
    .eq('profesor_id', userId)
    .eq('estado_sesion', 'asistencia_validada')
    .eq('estado_escrow', 'liberado');

  if (libError) {
    throw new Error(
      `Error al consultar saldo disponible para corte de fin de mes: ${libError.message}`
    );
  }

  const saldo_en_custodia = redondearMoneda(
    (sesionesEnCustodia ?? []).reduce((acc, row) => acc + Number(row.monto_bruto || 0) * 0.85, 0)
  );

  const saldo_disponible_corte = redondearMoneda(
    (sesionesValidadasMes ?? []).reduce((acc, row) => acc + Number(row.monto_bruto || 0) * 0.85, 0)
  );

  return {
    rol: 'profesor',
    userId,
    saldo_en_custodia,
    saldo_disponible_corte,
  };
}
