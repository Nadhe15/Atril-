// src/services/authService.ts
import { supabase } from '../lib/supabase';
import { RolAtril, Usuario, NivelMusical } from '../types/atril.types';

export type TipoEstudiante = 'apoderado' | 'estudiante_adulto';

export interface PerfilUsuarioAtril extends Usuario {
  tipo_estudiante?: TipoEstudiante | null;
}

export interface DatosHijoRegistro {
  nombreMenor: string;
  edadAnos: number;
  instrumento: string;
  nivel: NivelMusical;
}

export interface SignUpStudentInput {
  email: string;
  password: string;
  nombreCompleto: string;
  tipoEstudiante: TipoEstudiante;
  cedula?: string;
  telefono?: string;
  parentesco?: 'Padre' | 'Madre' | 'Tutor Legal';
  instrumentoInteres?: string;
  hijosIniciales?: DatosHijoRegistro[];
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
 * Registra un estudiante (Apoderado o Estudiante Mayor de Edad) en Supabase Auth,
 * inyecta los metadatos para el trigger `on_auth_user_created` y asegura la fila en `public.usuarios`.
 * Si es apoderado, registra automáticamente los representados en `public.subperfiles_alumnos`.
 */
export async function signUpStudent(
  input: SignUpStudentInput
): Promise<PerfilUsuarioAtril> {
  const emailLimpio = input.email.trim().toLowerCase();
  const nombreLimpio = input.nombreCompleto.trim();
  const cedulaLimpia = input.cedula?.trim() || null;
  const telefonoLimpio = input.telefono?.trim() || null;

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: emailLimpio,
    password: input.password,
    options: {
      data: {
        nombre_completo: nombreLimpio,
        rol: 'representante',
        tipo_estudiante: input.tipoEstudiante,
        cedula_identidad: cedulaLimpia,
        telefono: telefonoLimpio,
        parentesco: input.parentesco ?? null,
      },
    },
  });

  if (signUpError || !authData.user) {
    throw new Error(
      signUpError?.message || 'No se pudo completar el registro en Supabase Auth.'
    );
  }

  const filaUsuario: PerfilUsuarioAtril = {
    id: authData.user.id,
    email: emailLimpio,
    nombre_completo: nombreLimpio,
    rol: 'alumno_tutor' as RolAtril,
    tipo_estudiante: input.tipoEstudiante,
    cedula_identidad: cedulaLimpia ?? '',
    telefono: telefonoLimpio,
  };

  const { data: perfilData, error: perfilError } = await supabase
    .from('usuarios')
    .upsert(
      [
        {
          id: authData.user.id,
          email: emailLimpio,
          nombre_completo: nombreLimpio,
          tipo_estudiante: input.tipoEstudiante,
          cedula_identidad: cedulaLimpia,
          telefono: telefonoLimpio,
        },
      ],
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  // Si es representante legal y cargó representados iniciales (soporte multihijo)
  if (
    input.tipoEstudiante === 'apoderado' &&
    input.hijosIniciales &&
    input.hijosIniciales.length > 0
  ) {
    for (const h of input.hijosIniciales) {
      if (h.nombreMenor.trim()) {
        try {
          await supabase.from('subperfiles_alumnos').insert([
            {
              tutor_id: authData.user.id,
              nombre_menor: h.nombreMenor.trim(),
              edad_anos: h.edadAnos,
              instrumento: h.instrumento.trim(),
              nivel: h.nivel,
            },
          ]);
        } catch (e) {
          console.warn('Advertencia registrando subperfil menor inicial:', e);
        }
      }
    }
  }

  if (!perfilError && perfilData) {
    return {
      ...(perfilData as PerfilUsuarioAtril),
      tipo_estudiante:
        (perfilData as PerfilUsuarioAtril).tipo_estudiante ?? input.tipoEstudiante,
    };
  }

  return filaUsuario;
}

/**
 * Inicia sesión de un estudiante o representante contra Supabase Auth
 * y recupera su perfil enriquecido desde `public.usuarios`.
 */
export async function signInStudent(
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
  const meta = user.user_metadata || {};

  const { data: usuarioData } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (usuarioData) {
    return {
      ...(usuarioData as PerfilUsuarioAtril),
      tipo_estudiante:
        (usuarioData as PerfilUsuarioAtril).tipo_estudiante ??
        (meta.tipo_estudiante as TipoEstudiante | undefined) ??
        'estudiante_adulto',
    };
  }

  return {
    id: user.id,
    email: user.email || emailLimpio,
    rol: (meta.rol as RolAtril) || 'alumno_tutor',
    nombre_completo: (meta.nombre_completo as string) || 'Estudiante ATRIL',
    cedula_identidad: (meta.cedula_identidad as string) || '',
    telefono: (meta.telefono as string) || '',
    tipo_estudiante:
      (meta.tipo_estudiante as TipoEstudiante) || 'estudiante_adulto',
  };
}

/**
 * Recupera la sesión actual almacenada en AsyncStorage / Supabase Auth
 * y retorna el perfil enriquecido desde `public.usuarios` (o `null` si no hay sesión).
 */
export async function getCurrentSessionUser(): Promise<PerfilUsuarioAtril | null> {
  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session?.user) {
      return null;
    }

    const user = sessionData.session.user;
    const meta = user.user_metadata || {};

    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (usuarioData) {
      return {
        ...(usuarioData as PerfilUsuarioAtril),
        tipo_estudiante:
          (usuarioData as PerfilUsuarioAtril).tipo_estudiante ??
          (meta.tipo_estudiante as TipoEstudiante | undefined) ??
          'estudiante_adulto',
      };
    }

    return {
      id: user.id,
      email: user.email || '',
      rol: (meta.rol as RolAtril) || 'alumno_tutor',
      nombre_completo: (meta.nombre_completo as string) || 'Estudiante ATRIL',
      cedula_identidad: (meta.cedula_identidad as string) || '',
      telefono: (meta.telefono as string) || '',
      tipo_estudiante:
        (meta.tipo_estudiante as TipoEstudiante) || 'estudiante_adulto',
    };
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
  const { email, password, rol, cedula_identidad, nombre_completo, telefono } = input;

  if (rol !== 'alumno_tutor' && rol !== 'profesor_docente') {
    throw new Error('Debes seleccionar un rol válido al registrarte.');
  }

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        rol,
        nombre_completo: nombre_completo.trim(),
        cedula_identidad: cedula_identidad.trim(),
        telefono: telefono.trim(),
      },
    },
  });

  if (signUpError || !authData.user) {
    throw new Error(`Error en registro de autenticación: ${signUpError?.message ?? 'Sin usuario'}`);
  }

  const nuevoUsuario: Usuario = {
    id: authData.user.id,
    email: email.trim().toLowerCase(),
    rol,
    cedula_identidad: cedula_identidad.trim(),
    nombre_completo: nombre_completo.trim(),
    telefono: telefono.trim(),
  };

  const { data: perfilData, error: perfilError } = await supabase
    .from('usuarios')
    .upsert([nuevoUsuario])
    .select('*')
    .single();

  if (perfilError || !perfilData) {
    throw new Error(`Error al guardar perfil en tabla usuarios: ${perfilError?.message ?? ''}`);
  }

  return perfilData as Usuario;
}
