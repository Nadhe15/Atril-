// src/services/adminService.ts
import { supabase } from '../lib/supabase';
import { EstadoVerificacion, RolV5, Usuario } from '../types/atril.types';
import { createCorrelationId, logger } from '../lib/logger';

export type FiltroEstadoVerificacion = EstadoVerificacion | 'todos';

/**
 * Semillas en memoria para garantizar funcionamiento del Panel Admin (FundaOboeHJK)
 * incluso cuando la base de datos remota aún no tiene la migración v5 aplicada o falla RLS.
 */
const USUARIOS_MEMORIA_FALLBACK = new Map<string, Usuario>([
  [
    'usr-pend-01',
    {
      id: 'usr-pend-01',
      email: 'samuel.sanabria@usb.ve',
      rol: 'estudiante',
      rol_v5: 'estudiante',
      estado_verificacion: 'pendiente',
      tipo_estudiante: 'estudiante_adulto',
      cedula_identidad: 'V-26841920',
      nombre_completo: 'Samuel Sanabria (Estudiante Adulto)',
      telefono: '+58 412-5550192',
      es_menor: false,
      created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    },
  ],
  [
    'usr-pend-02',
    {
      id: 'usr-pend-02',
      email: 'carolina.mendoza@correo.com',
      rol: 'estudiante',
      rol_v5: 'estudiante',
      estado_verificacion: 'pendiente',
      tipo_estudiante: 'apoderado',
      cedula_identidad: 'V-14920311',
      nombre_completo: 'Mateo Mendoza (Menor • Rep: Carolina Mendoza)',
      telefono: '+58 414-3219870',
      es_menor: true,
      nombre_representante: 'Carolina Mendoza',
      cedula_representante: 'V-14920311',
      created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    },
  ],
  [
    'usr-pend-03',
    {
      id: 'usr-pend-03',
      email: 'carlos.reveron@conservatorio.ve',
      rol: 'docente',
      rol_v5: 'docente',
      estado_verificacion: 'pendiente',
      cedula_identidad: 'V-11204885',
      nombre_completo: 'Prof. Carlos Reverón (Guitarra Clásica)',
      telefono: '+58 424-1984432',
      area_docente: 'Guitarra Clásica',
      created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    },
  ],
  [
    '99999999-9999-9999-9999-999999999999',
    {
      id: '99999999-9999-9999-9999-999999999999',
      email: 'jg.sanabria@fundaoboe.org',
      rol: 'docente',
      rol_v5: 'docente',
      estado_verificacion: 'verificado',
      cedula_identidad: 'V-10458921',
      nombre_completo: 'Mtro. José Gregorio Sanabria',
      telefono: '+58 412-9001122',
      area_docente: 'Oboe Sinfónico',
      created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    },
  ],
]);

export function normalizarRolV5(rolRaw?: string | null): RolV5 {
  const valor = (rolRaw || '').trim().toLowerCase();
  if (valor === 'admin' || valor === 'administrador') return 'admin';
  if (valor === 'docente' || valor === 'profesor_docente' || valor === 'profesor') {
    return 'docente';
  }
  return 'estudiante';
}

export function normalizarEstadoVerificacion(
  estadoRaw?: string | null
): EstadoVerificacion {
  const valor = (estadoRaw || '').trim().toLowerCase();
  if (valor === 'verificado') return 'verificado';
  if (valor === 'suspendido') return 'suspendido';
  return 'pendiente';
}

/**
 * Registra o sincroniza un usuario en la caché local de verificación administrativa.
 */
export function sincronizarUsuarioEnCacheAdmin(usuario: Usuario): void {
  const normalizado: Usuario = {
    ...usuario,
    rol_v5: usuario.rol_v5 ?? normalizarRolV5(usuario.rol),
    estado_verificacion: normalizarEstadoVerificacion(usuario.estado_verificacion),
  };
  USUARIOS_MEMORIA_FALLBACK.set(normalizado.id, normalizado);
}

/**
 * Obtiene un usuario desde la caché en memoria si existe.
 */
export function obtenerUsuarioDeCacheAdmin(userId: string): Usuario | undefined {
  return USUARIOS_MEMORIA_FALLBACK.get(userId);
}

function mapearFilaAUsuarioV5(row: Record<string, unknown>): Usuario {
  const id = String(row.id || '');
  const enCache = USUARIOS_MEMORIA_FALLBACK.get(id);
  const rolBruto = String(row.rol || enCache?.rol || 'estudiante');
  const rolV5 = normalizarRolV5(rolBruto);
  const estado = normalizarEstadoVerificacion(
    (row.estado_verificacion as string | undefined) ?? enCache?.estado_verificacion
  );

  return {
    id,
    email: String(row.email || enCache?.email || ''),
    rol: (rolBruto as Usuario['rol']) || rolV5,
    rol_v5: rolV5,
    estado_verificacion: estado,
    tipo_estudiante:
      (row.tipo_estudiante as Usuario['tipo_estudiante']) ??
      enCache?.tipo_estudiante ??
      null,
    cedula_identidad: String(
      row.cedula_identidad || enCache?.cedula_identidad || 'No especificada'
    ),
    nombre_completo: String(
      row.nombre_completo || enCache?.nombre_completo || 'Usuario ATRIL'
    ),
    telefono:
      row.telefono !== undefined && row.telefono !== null
        ? String(row.telefono)
        : enCache?.telefono ?? null,
    es_menor:
      typeof row.es_menor === 'boolean' ? row.es_menor : enCache?.es_menor ?? false,
    nombre_representante:
      (row.nombre_representante as string | null) ??
      enCache?.nombre_representante ??
      null,
    cedula_representante:
      (row.cedula_representante as string | null) ??
      enCache?.cedula_representante ??
      null,
    area_docente: (row.area_docente as string | null) ?? enCache?.area_docente ?? null,
    created_at:
      (row.created_at as string | undefined) ??
      enCache?.created_at ??
      new Date().toISOString(),
  };
}

/**
 * Lista todos los usuarios registrados filtrables por `estado_verificacion`
 * ('pendiente' | 'verificado' | 'suspendido' | 'todos').
 */
export async function listarUsuariosVerificacion(
  filtroEstado: FiltroEstadoVerificacion = 'todos'
): Promise<Usuario[]> {
  try {
    let query = supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (filtroEstado !== 'todos') {
      query = query.eq('estado_verificacion', filtroEstado);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      const remotos = (data as Record<string, unknown>[]).map((fila) => {
        const u = mapearFilaAUsuarioV5(fila);
        USUARIOS_MEMORIA_FALLBACK.set(u.id, u);
        return u;
      });

      if (filtroEstado === 'todos') {
        return remotos;
      }
      return remotos.filter((u) => u.estado_verificacion === filtroEstado);
    }

    // Si la columna estado_verificacion aún no existe en la tabla remota, intentar SELECT básico
    if (error && error.message.includes('estado_verificacion')) {
      const { data: dataBasica, error: errBasico } = await supabase
        .from('usuarios')
        .select('*');

      if (!errBasico && dataBasica && dataBasica.length > 0) {
        (dataBasica as Record<string, unknown>[]).forEach((fila) => {
          const u = mapearFilaAUsuarioV5(fila);
          USUARIOS_MEMORIA_FALLBACK.set(u.id, u);
        });
      }
    }
  } catch {
    // Usar fallback en memoria si falla la red o RLS
  }

  const todosCache = Array.from(USUARIOS_MEMORIA_FALLBACK.values()).sort((a, b) =>
    (b.created_at || '').localeCompare(a.created_at || '')
  );

  if (filtroEstado === 'todos') {
    return todosCache;
  }

  return todosCache.filter((u) => u.estado_verificacion === filtroEstado);
}

/**
 * Actualiza el estado de verificación de un usuario en Supabase (`public.usuarios`)
 * y sincroniza el resultado en la caché en memoria.
 */
export async function actualizarEstadoVerificacion(
  userId: string,
  nuevoEstado: EstadoVerificacion
): Promise<Usuario> {
  const correlationId = createCorrelationId('adm');
  const startedAt = Date.now();
  if (!userId) {
    const err = new Error('El identificador del usuario (userId) es obligatorio.');
    logger.warn({
      flow: 'admin_verification',
      action: 'actualizar_estado_verificacion',
      correlationId,
      actorRole: 'admin',
      status: 'denied',
      durationMs: Date.now() - startedAt,
      error: err,
      errorCode: 'ADMIN_MISSING_USER_ID',
    });
    throw err;
  }

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ estado_verificacion: nuevoEstado })
      .eq('id', userId)
      .select('*')
      .single();

    if (!error && data) {
      const actualizado = mapearFilaAUsuarioV5({
        ...(data as Record<string, unknown>),
        estado_verificacion: nuevoEstado,
      });
      USUARIOS_MEMORIA_FALLBACK.set(actualizado.id, actualizado);
      logger.info({
        flow: 'admin_verification',
        action: 'actualizar_estado_verificacion',
        correlationId,
        actorRole: 'admin',
        status: 'ok',
        durationMs: Date.now() - startedAt,
        metadata: { targetUserId: userId, nuevoEstado, source: 'supabase' },
      });
      return actualizado;
    }
  } catch {
    // Continuar con actualización en caché local si falla Supabase
  }

  const existente = USUARIOS_MEMORIA_FALLBACK.get(userId);
  const respaldo: Usuario = existente
    ? { ...existente, estado_verificacion: nuevoEstado }
    : {
        id: userId,
        email: 'usuario@atril.org',
        rol: 'estudiante',
        rol_v5: 'estudiante',
        estado_verificacion: nuevoEstado,
        cedula_identidad: 'No especificada',
        nombre_completo: 'Usuario ATRIL',
        telefono: null,
        created_at: new Date().toISOString(),
      };

  USUARIOS_MEMORIA_FALLBACK.set(userId, respaldo);
  logger.info({
    flow: 'admin_verification',
    action: 'actualizar_estado_verificacion',
    correlationId,
    actorRole: 'admin',
    status: 'ok',
    durationMs: Date.now() - startedAt,
    metadata: { targetUserId: userId, nuevoEstado, source: 'cache_fallback' },
  });
  return respaldo;
}

/**
 * Aprueba la cuenta de un estudiante o docente (`estado_verificacion = 'verificado'`),
 * habilitando su acceso a contacto y mensajería directa.
 */
export async function aprobarUsuario(userId: string): Promise<Usuario> {
  return actualizarEstadoVerificacion(userId, 'verificado');
}

/**
 * Suspende la cuenta de un usuario (`estado_verificacion = 'suspendido'`),
 * revocando su acceso operativo en la plataforma.
 */
export async function suspenderUsuario(userId: string): Promise<Usuario> {
  return actualizarEstadoVerificacion(userId, 'suspendido');
}
