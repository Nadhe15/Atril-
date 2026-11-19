// src/services/chatService.ts
import { supabase } from '../lib/supabase';
import { ConversacionRow, MensajeRow } from '../types/atril.types';

// Cachés en memoria para pruebas locales y respaldo cuando las tablas aún no estén migradas en Supabase
const CONVERSACIONES_CACHE = new Map<string, ConversacionRow>();
const MENSAJES_POR_CONVERSACION_CACHE = new Map<string, MensajeRow[]>();
const LISTENERS_MEMORIA = new Map<string, Set<(mensaje: MensajeRow) => void>>();

function generarIdLocal(prefijo: string): string {
  const randomHex = Math.random().toString(16).slice(2, 10);
  return `${prefijo}-${Date.now()}-${randomHex}`;
}

function notificarListenersLocales(conversacionId: string, mensaje: MensajeRow): void {
  const conjunto = LISTENERS_MEMORIA.get(conversacionId);
  if (!conjunto) return;
  conjunto.forEach((cb) => {
    try {
      cb(mensaje);
    } catch {
      // Ignorar errores en listener individual
    }
  });
}

function guardarMensajeEnCache(mensaje: MensajeRow): void {
  const lista = MENSAJES_POR_CONVERSACION_CACHE.get(mensaje.conversacion_id) ?? [];
  const yaExiste = lista.some((m) => m.id === mensaje.id);
  if (!yaExiste) {
    const nuevaLista = [...lista, mensaje].sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    );
    MENSAJES_POR_CONVERSACION_CACHE.set(mensaje.conversacion_id, nuevaLista);
  }

  const conv = CONVERSACIONES_CACHE.get(mensaje.conversacion_id);
  if (conv) {
    CONVERSACIONES_CACHE.set(mensaje.conversacion_id, {
      ...conv,
      ultimo_mensaje: mensaje.contenido,
      updated_at: mensaje.created_at,
    });
  }
}

export interface MetaNombresConversacion {
  nombreAlumno?: string;
  nombreProfesor?: string;
}

/**
 * Obtiene una conversación existente entre `alumnoId` y `profesorId`, o la crea
 * si aún no existe (respetando la restricción UNIQUE(alumno_id, profesor_id)).
 */
export async function obtenerOCrearConversacion(
  alumnoId: string,
  profesorId: string,
  areaInteres?: string,
  metaNombres?: MetaNombresConversacion
): Promise<ConversacionRow> {
  if (!alumnoId || !profesorId) {
    throw new Error('Se requieren alumnoId y profesorId para iniciar una conversación.');
  }

  const areaLimpia = areaInteres?.trim() || 'Cátedra Musical FundaOboeHJK';

  try {
    const { data: existente, error: selectErr } = await supabase
      .from('conversaciones')
      .select('*')
      .eq('alumno_id', alumnoId)
      .eq('profesor_id', profesorId)
      .maybeSingle();

    if (!selectErr && existente) {
      const fila = existente as ConversacionRow;
      const enriquecida: ConversacionRow = {
        ...fila,
        area_interes: fila.area_interes || areaLimpia,
        nombre_alumno: metaNombres?.nombreAlumno ?? fila.nombre_alumno,
        nombre_profesor: metaNombres?.nombreProfesor ?? fila.nombre_profesor,
      };
      CONVERSACIONES_CACHE.set(enriquecida.id, enriquecida);
      return enriquecida;
    }

    const { data: creada, error: insertErr } = await supabase
      .from('conversaciones')
      .insert([
        {
          alumno_id: alumnoId,
          profesor_id: profesorId,
          area_interes: areaLimpia,
        },
      ])
      .select('*')
      .single();

    if (!insertErr && creada) {
      const fila = creada as ConversacionRow;
      const enriquecida: ConversacionRow = {
        ...fila,
        nombre_alumno: metaNombres?.nombreAlumno,
        nombre_profesor: metaNombres?.nombreProfesor,
      };
      CONVERSACIONES_CACHE.set(enriquecida.id, enriquecida);
      return enriquecida;
    }
  } catch {
    // Fallback en memoria si falla Supabase
  }

  // Buscar en caché local por par (alumno_id, profesor_id)
  const enCache = Array.from(CONVERSACIONES_CACHE.values()).find(
    (c) => c.alumno_id === alumnoId && c.profesor_id === profesorId
  );

  if (enCache) {
    const actualizada: ConversacionRow = {
      ...enCache,
      area_interes: areaInteres?.trim() || enCache.area_interes,
      nombre_alumno: metaNombres?.nombreAlumno ?? enCache.nombre_alumno,
      nombre_profesor: metaNombres?.nombreProfesor ?? enCache.nombre_profesor,
    };
    CONVERSACIONES_CACHE.set(actualizada.id, actualizada);
    return actualizada;
  }

  const ahoraIso = new Date().toISOString();
  const nuevaLocal: ConversacionRow = {
    id: generarIdLocal('conv'),
    alumno_id: alumnoId,
    profesor_id: profesorId,
    area_interes: areaLimpia,
    nombre_alumno: metaNombres?.nombreAlumno || 'Estudiante Verificado',
    nombre_profesor: metaNombres?.nombreProfesor || 'Maestro FundaOboeHJK',
    ultimo_mensaje: 'Conversación académica iniciada tras verificación.',
    created_at: ahoraIso,
    updated_at: ahoraIso,
  };

  CONVERSACIONES_CACHE.set(nuevaLocal.id, nuevaLocal);

  // Mensaje institucional de bienvenida en la conversación local
  const mensajeBienvenida: MensajeRow = {
    id: generarIdLocal('msg'),
    conversacion_id: nuevaLocal.id,
    remitente_id: profesorId,
    nombre_remitente: nuevaLocal.nombre_profesor,
    contenido: `Hola. Bienvenido a la cátedra de ${areaLimpia}. Por este canal podemos coordinar tu horario y repertorio de estudio.`,
    leido: false,
    created_at: ahoraIso,
  };
  MENSAJES_POR_CONVERSACION_CACHE.set(nuevaLocal.id, [mensajeBienvenida]);

  return nuevaLocal;
}

/**
 * Lista todas las conversaciones donde el usuario participa como alumno o como profesor,
 * ordenadas por `updated_at` descendente.
 */
export async function listarConversacionesUsuario(
  userId: string
): Promise<ConversacionRow[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('conversaciones')
      .select('*')
      .or(`alumno_id.eq.${userId},profesor_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const remotas = (data as ConversacionRow[]).map((c) => {
        const previa = CONVERSACIONES_CACHE.get(c.id);
        const combinada: ConversacionRow = {
          ...c,
          nombre_alumno: c.nombre_alumno ?? previa?.nombre_alumno,
          nombre_profesor: c.nombre_profesor ?? previa?.nombre_profesor,
          ultimo_mensaje: c.ultimo_mensaje ?? previa?.ultimo_mensaje,
        };
        CONVERSACIONES_CACHE.set(combinada.id, combinada);
        return combinada;
      });
      return remotas;
    }
  } catch {
    // Continuar hacia caché en memoria
  }

  return Array.from(CONVERSACIONES_CACHE.values())
    .filter((c) => c.alumno_id === userId || c.profesor_id === userId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

/**
 * Obtiene el historial de mensajes de una conversación ordenado cronológicamente.
 */
export async function obtenerMensajes(conversacionId: string): Promise<MensajeRow[]> {
  if (!conversacionId) return [];

  try {
    const { data, error } = await supabase
      .from('mensajes')
      .select('*')
      .eq('conversacion_id', conversacionId)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      const mensajes = data as MensajeRow[];
      MENSAJES_POR_CONVERSACION_CACHE.set(conversacionId, mensajes);
      return mensajes;
    }
  } catch {
    // Continuar hacia caché local
  }

  return MENSAJES_POR_CONVERSACION_CACHE.get(conversacionId) ?? [];
}

/**
 * Envía un mensaje dentro de una conversación activa y notifica tanto a Supabase
 * como a los suscriptores locales en tiempo real.
 */
export async function enviarMensaje(
  conversacionId: string,
  remitenteId: string,
  contenido: string,
  nombreRemitente?: string
): Promise<MensajeRow> {
  if (!conversacionId || !remitenteId || !contenido.trim()) {
    throw new Error('La conversación, el remitente y el contenido del mensaje son obligatorios.');
  }

  const textoLimpio = contenido.trim();

  try {
    const { data, error } = await supabase
      .from('mensajes')
      .insert([
        {
          conversacion_id: conversacionId,
          remitente_id: remitenteId,
          contenido: textoLimpio,
          leido: false,
        },
      ])
      .select('*')
      .single();

    if (!error && data) {
      const msgRemoto: MensajeRow = {
        ...(data as MensajeRow),
        nombre_remitente: nombreRemitente,
      };
      guardarMensajeEnCache(msgRemoto);
      notificarListenersLocales(conversacionId, msgRemoto);
      return msgRemoto;
    }
  } catch {
    // Respaldo en memoria si la tabla remota no está disponible
  }

  const msgLocal: MensajeRow = {
    id: generarIdLocal('msg'),
    conversacion_id: conversacionId,
    remitente_id: remitenteId,
    nombre_remitente: nombreRemitente,
    contenido: textoLimpio,
    leido: false,
    created_at: new Date().toISOString(),
  };

  guardarMensajeEnCache(msgLocal);
  notificarListenersLocales(conversacionId, msgLocal);
  return msgLocal;
}

/**
 * Suscribe un callback en tiempo real a los nuevos mensajes de `conversacionId`
 * utilizando Supabase Realtime (`postgres_changes`) con fallback en memoria.
 * Retorna una función `unsubscribe()` para limpiar la suscripción al desmontar.
 */
export function suscribirMensajesConversacion(
  conversacionId: string,
  onNuevoMensaje: (mensaje: MensajeRow) => void
): () => void {
  if (!conversacionId) {
    return () => {};
  }

  // 1. Registrar listener en memoria para recibir mensajes en modo local/fallback
  const listenersActuales =
    LISTENERS_MEMORIA.get(conversacionId) ?? new Set<(mensaje: MensajeRow) => void>();
  listenersActuales.add(onNuevoMensaje);
  LISTENERS_MEMORIA.set(conversacionId, listenersActuales);

  // 2. Registrar canal de Supabase Realtime
  const channel = supabase
    .channel(`mensajes-conv-${conversacionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
        filter: `conversacion_id=eq.${conversacionId}`,
      },
      (payload) => {
        if (payload?.new) {
          const nuevo = payload.new as MensajeRow;
          guardarMensajeEnCache(nuevo);
          onNuevoMensaje(nuevo);
        }
      }
    )
    .subscribe();

  return () => {
    const setLocal = LISTENERS_MEMORIA.get(conversacionId);
    if (setLocal) {
      setLocal.delete(onNuevoMensaje);
      if (setLocal.size === 0) {
        LISTENERS_MEMORIA.delete(conversacionId);
      }
    }
    try {
      supabase.removeChannel(channel);
    } catch {
      // Ignorar error al remover canal en desconexión
    }
  };
}
