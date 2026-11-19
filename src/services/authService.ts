// src/services/authService.ts
import { supabase } from '../lib/supabase';
import {
  EstadoVerificacion,
  RolAtril,
  RolV5,
  TipoEstudiante,
  Usuario,
} from '../types/atril.types';
import {
  normalizarEstadoVerificacion,
  normalizarRolV5,
  obtenerUsuarioDeCacheAdmin,
  sincronizarUsuarioEnCacheAdmin,
} from './adminService';

export type { TipoEstudiante };

export interface PerfilUsuarioAtril extends Usuario {
  rol_v5: RolV5;
  estado_verificacion: EstadoVerificacion;
  tipo_estudiante?: TipoEstudiante | null;
}

/**
 * Datos de entrada para el registro unificado v5.0 (Estudiante o Docente).
 * Si es estudiante menor de edad (`esMenor: true` o `tipoEstudiante === 'apoderado'`),
 * incluye los datos del padre o representante legal.
 */
export interface RegistroUnificadoV5Input {
  nombreCompleto: string;
  cedula: string;
  telefono: string;
  email: string;
  password: string;
  rol: 'estudiante' | 'docente';
  /** Indica si el estudiante es menor de edad y requiere representante legal */
  esMenor?: boolean;
  tipoEstudiante?: TipoEstudiante;
  nombreRepresentante?: string;
  cedulaRepresentante?: string;
  /** Área o cátedra principal cuando el rol es 'docente' (ej. "Oboe Sinfónico") */
  areaDocente?: string;
}

export interface SignUpStudentInput {
  email: string;
  password: string;
  nombreCompleto: string;
  tipoEstudiante: TipoEstudiante;
  cedula?: string;
  telefono?: string;
  esMenor?: boolean;
  nombreRepresentante?: string;
  cedulaRepresentante?: string;
}

export interface RegistroUsuarioInput {
  email: string;
  password: string;
  rol: RolAtril;
  cedula_identidad: string;
  nombre_completo: string;
  telefono: string;
}

/**
 * Construye un `PerfilUsuarioAtril` normalizando `rol_v5` y `estado_verificacion`,
 * respetando cualquier actualización administrativa en caché.
 */
function enriquecerPerfilConEstadoV5(
  base: Partial<Usuario> & { id: string; email: string },
  metaFallback?: Record<string, unknown>
): PerfilUsuarioAtril {
  const enCacheAdmin = obtenerUsuarioDeCacheAdmin(base.id);
  const meta = metaFallback ?? {};

  const rolRaw =
    (base.rol as string | undefined) ||
    (enCacheAdmin?.rol as string | undefined) ||
    (meta.rol as string | undefined) ||
    'estudiante';

  const rolV5 = normalizarRolV5(base.rol_v5 || enCacheAdmin?.rol_v5 || rolRaw);

  // Priorizar estado_verificacion actualizado por el administrador en caché o en BD
  const estadoRaw =
    enCacheAdmin?.estado_verificacion ||
    base.estado_verificacion ||
    (meta.estado_verificacion as string | undefined) ||
    'pendiente';

  const estadoVerificacion = normalizarEstadoVerificacion(estadoRaw);

  const esMenor =
    typeof base.es_menor === 'boolean'
      ? base.es_menor
      : typeof meta.es_menor === 'boolean'
      ? meta.es_menor
      : base.tipo_estudiante === 'apoderado' || meta.tipo_estudiante === 'apoderado';

  const tipoEstudiante: TipoEstudiante | null =
    rolV5 === 'estudiante'
      ? base.tipo_estudiante ??
        enCacheAdmin?.tipo_estudiante ??
        (meta.tipo_estudiante as TipoEstudiante | undefined) ??
        (esMenor ? 'apoderado' : 'estudiante_adulto')
      : null;

  const perfil: PerfilUsuarioAtril = {
    id: base.id,
    email: base.email,
    rol: (base.rol as RolAtril) || rolV5,
    rol_v5: rolV5,
    estado_verificacion: estadoVerificacion,
    tipo_estudiante: tipoEstudiante,
    cedula_identidad:
      base.cedula_identidad ||
      enCacheAdmin?.cedula_identidad ||
      (meta.cedula_identidad as string | undefined) ||
      '',
    nombre_completo:
      base.nombre_completo ||
      enCacheAdmin?.nombre_completo ||
      (meta.nombre_completo as string | undefined) ||
      'Usuario ATRIL',
    telefono:
      base.telefono ??
      enCacheAdmin?.telefono ??
      (meta.telefono as string | undefined) ??
      null,
    es_menor: esMenor,
    nombre_representante:
      base.nombre_representante ??
      enCacheAdmin?.nombre_representante ??
      (meta.nombre_representante as string | null | undefined) ??
      null,
    cedula_representante:
      base.cedula_representante ??
      enCacheAdmin?.cedula_representante ??
      (meta.cedula_representante as string | null | undefined) ??
      null,
    area_docente:
      base.area_docente ??
      enCacheAdmin?.area_docente ??
      (meta.area_docente as string | null | undefined) ??
      null,
    created_at: base.created_at ?? enCacheAdmin?.created_at ?? new Date().toISOString(),
  };

  sincronizarUsuarioEnCacheAdmin(perfil);
  return perfil;
}

/**
 * Registro Unificado v5.0 (MVP):
 * Registra un Estudiante (adulto o menor con representante) o un Docente en Supabase Auth
 * y en `public.usuarios`, dejando `estado_verificacion = 'pendiente'` por defecto.
 */
export async function registrarUsuarioUnificado(
  input: RegistroUnificadoV5Input
): Promise<PerfilUsuarioAtril> {
  const emailLimpio = input.email.trim().toLowerCase();
  const nombreLimpio = input.nombreCompleto.trim();
  const cedulaLimpia = input.cedula.trim();
  const telefonoLimpio = input.telefono.trim();
  const rolElegido: 'estudiante' | 'docente' = input.rol;

  const esMenor =
    rolElegido === 'estudiante' &&
    Boolean(input.esMenor || input.tipoEstudiante === 'apoderado');

  const tipoEstudiante: TipoEstudiante | null =
    rolElegido === 'estudiante'
      ? esMenor
        ? 'apoderado'
        : input.tipoEstudiante ?? 'estudiante_adulto'
      : null;

  const nombreRepresentante = esMenor ? input.nombreRepresentante?.trim() || null : null;
  const cedulaRepresentante = esMenor ? input.cedulaRepresentante?.trim() || null : null;
  const areaDocente =
    rolElegido === 'docente' ? input.areaDocente?.trim() || 'Oboe Sinfónico' : null;

  const estadoInicial: EstadoVerificacion = 'pendiente';

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: emailLimpio,
    password: input.password,
    options: {
      data: {
        nombre_completo: nombreLimpio,
        rol: rolElegido,
        rol_v5: rolElegido,
        estado_verificacion: estadoInicial,
        tipo_estudiante: tipoEstudiante,
        cedula_identidad: cedulaLimpia,
        telefono: telefonoLimpio,
        es_menor: esMenor,
        nombre_representante: nombreRepresentante,
        cedula_representante: cedulaRepresentante,
        area_docente: areaDocente,
      },
    },
  });

  if (signUpError || !authData.user) {
    throw new Error(
      signUpError?.message || 'No se pudo completar el registro en Supabase Auth.'
    );
  }

  const basePerfil: PerfilUsuarioAtril = {
    id: authData.user.id,
    email: emailLimpio,
    nombre_completo: nombreLimpio,
    rol: rolElegido,
    rol_v5: rolElegido,
    estado_verificacion: estadoInicial,
    tipo_estudiante: tipoEstudiante,
    cedula_identidad: cedulaLimpia,
    telefono: telefonoLimpio,
    es_menor: esMenor,
    nombre_representante: nombreRepresentante,
    cedula_representante: cedulaRepresentante,
    area_docente: areaDocente,
    created_at: new Date().toISOString(),
  };

  // Intentar upsert con columnas v5 completas; si el esquema remoto aún tiene un enum v3 estricto, hacer fallback
  const { data: perfilData, error: perfilError } = await supabase
    .from('usuarios')
    .upsert(
      [
        {
          id: authData.user.id,
          email: emailLimpio,
          nombre_completo: nombreLimpio,
          rol: rolElegido,
          estado_verificacion: estadoInicial,
          tipo_estudiante: tipoEstudiante,
          cedula_identidad: cedulaLimpia || null,
          telefono: telefonoLimpio || null,
        },
      ],
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (!perfilError && perfilData) {
    return enriquecerPerfilConEstadoV5(
      {
        ...(perfilData as Partial<Usuario>),
        id: authData.user.id,
        email: emailLimpio,
        rol: rolElegido,
        rol_v5: rolElegido,
        estado_verificacion:
          (perfilData as Partial<Usuario>).estado_verificacion ?? estadoInicial,
        telefono: (perfilData as Partial<Usuario>).telefono ?? telefonoLimpio,
        es_menor: esMenor,
        nombre_representante: nombreRepresentante,
        cedula_representante: cedulaRepresentante,
        area_docente: areaDocente,
      },
      authData.user.user_metadata
    );
  }

  // Fallback si la tabla remota aún no migró la columna `estado_verificacion` o `rol` v5
  await supabase
    .from('usuarios')
    .upsert(
      [
        {
          id: authData.user.id,
          email: emailLimpio,
          nombre_completo: nombreLimpio,
          tipo_estudiante: tipoEstudiante,
          cedula_identidad: cedulaLimpia || null,
          telefono: telefonoLimpio || null,
        },
      ],
      { onConflict: 'id' }
    )
    .select('*')
    .maybeSingle();

  sincronizarUsuarioEnCacheAdmin(basePerfil);
  return basePerfil;
}

export const signUpUnified = registrarUsuarioUnificado;

/**
 * Inicio de sesión unificado v5.0:
 * Autentica contra Supabase Auth y retorna el perfil con su `rol` ('estudiante' | 'docente' | 'admin')
 * y su `estado_verificacion` ('pendiente' | 'verificado' | 'suspendido').
 */
export async function iniciarSesionUnificado(
  email: string,
  password: string
): Promise<PerfilUsuarioAtril> {
  const emailLimpio = email.trim().toLowerCase();

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: emailLimpio,
      password,
    });

  if (signInError || !signInData.user) {
    throw new Error(
      signInError?.message || 'Correo o contraseña incorrectos. Verifica tus datos.'
    );
  }

  const user = signInData.user;
  const meta = (user.user_metadata || {}) as Record<string, unknown>;

  const { data: usuarioData } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (usuarioData) {
    return enriquecerPerfilConEstadoV5(
      {
        ...(usuarioData as Partial<Usuario>),
        id: user.id,
        email: user.email || emailLimpio,
      },
      meta
    );
  }

  return enriquecerPerfilConEstadoV5(
    {
      id: user.id,
      email: user.email || emailLimpio,
    },
    meta
  );
}

export const signInUnified = iniciarSesionUnificado;

/**
 * Wrapper compatible para registro de estudiante (Apoderado o Estudiante Adulto).
 * Deja `estado_verificacion = 'pendiente'` por defecto.
 */
export async function signUpStudent(
  input: SignUpStudentInput
): Promise<PerfilUsuarioAtril> {
  return registrarUsuarioUnificado({
    email: input.email,
    password: input.password,
    nombreCompleto: input.nombreCompleto,
    cedula: input.cedula || '',
    telefono: input.telefono || '',
    rol: 'estudiante',
    tipoEstudiante: input.tipoEstudiante,
    esMenor: input.esMenor ?? input.tipoEstudiante === 'apoderado',
    nombreRepresentante: input.nombreRepresentante,
    cedulaRepresentante: input.cedulaRepresentante,
  });
}

/**
 * Wrapper compatible para inicio de sesión que retorna el perfil enriquecido
 * con `rol`, `rol_v5` y `estado_verificacion`.
 */
export async function signInStudent(
  email: string,
  password: string
): Promise<PerfilUsuarioAtril> {
  return iniciarSesionUnificado(email, password);
}

/**
 * Recupera la sesión actual almacenada en AsyncStorage / Supabase Auth
 * y retorna el perfil enriquecido con `rol`, `rol_v5` y `estado_verificacion`.
 */
export async function getCurrentSessionUser(): Promise<PerfilUsuarioAtril | null> {
  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session?.user) {
      return null;
    }

    const user = sessionData.session.user;
    const meta = (user.user_metadata || {}) as Record<string, unknown>;

    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (usuarioData) {
      return enriquecerPerfilConEstadoV5(
        {
          ...(usuarioData as Partial<Usuario>),
          id: user.id,
          email: user.email || '',
        },
        meta
      );
    }

    return enriquecerPerfilConEstadoV5(
      {
        id: user.id,
        email: user.email || '',
      },
      meta
    );
  } catch {
    return null;
  }
}

/**
 * Cierra la sesión activa en Supabase Auth y limpia el almacenamiento seguro.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Error al cerrar sesión: ${error.message}`);
  }
}

export async function registrarUsuarioConRol(
  input: RegistroUsuarioInput
): Promise<Usuario> {
  const rolV5 = normalizarRolV5(input.rol);
  return registrarUsuarioUnificado({
    email: input.email,
    password: input.password,
    nombreCompleto: input.nombre_completo,
    cedula: input.cedula_identidad,
    telefono: input.telefono,
    rol: rolV5 === 'docente' ? 'docente' : 'estudiante',
  });
}

export async function iniciarSesionConRol(
  email: string,
  password: string
): Promise<Usuario> {
  return iniciarSesionUnificado(email, password);
}
