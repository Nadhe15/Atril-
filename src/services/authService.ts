// src/services/authService.ts
import { supabase } from '../lib/supabase';
import {
  EstadoAcreditacionDocente,
  RepresentadoMenor,
  RolAtril,
  Usuario,
} from '../types/atril.types';

export interface RegistroUsuarioInput {
  email: string;
  password: string;
  rol: RolAtril;
  cedula_identidad: string;
  nombre_completo: string;
  telefono: string;
  es_mayor_edad?: boolean;
  instrumento_interes?: string;
  representados?: RepresentadoMenor[];
  cargo_fundaoboe?: string;
  perfil_docente_id?: string;
  estado_acreditacion?: EstadoAcreditacionDocente;
}

export async function registrarUsuarioConRol(
  input: RegistroUsuarioInput
): Promise<Usuario> {
  const {
    email,
    password,
    rol,
    cedula_identidad,
    nombre_completo,
    telefono,
    es_mayor_edad,
    instrumento_interes,
    representados,
    cargo_fundaoboe,
    perfil_docente_id,
    estado_acreditacion,
  } = input;

  if (rol !== 'DOCENTE' && rol !== 'ALUMNO' && rol !== 'REVISION_FUNDAOBOE') {
    throw new Error('Debes seleccionar un rol válido al registrarte.');
  }

  const usuarioLocal: Usuario = {
    id: `usr-${Date.now()}`,
    email: email.trim().toLowerCase(),
    rol,
    cedula_identidad: cedula_identidad.trim(),
    nombre_completo: nombre_completo.trim(),
    telefono: telefono.trim(),
    es_mayor_edad,
    instrumento_interes,
    representados,
    cargo_fundaoboe,
    perfil_docente_id,
    estado_acreditacion,
  };

  try {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: usuarioLocal.email,
      password,
      options: {
        data: {
          rol,
          nombre_completo: usuarioLocal.nombre_completo,
          cedula_identidad: usuarioLocal.cedula_identidad,
          telefono: usuarioLocal.telefono,
        },
      },
    });

    if (!signUpError && authData?.user) {
      usuarioLocal.id = authData.user.id;
      await supabase.from('usuarios').upsert([
        {
          id: usuarioLocal.id,
          email: usuarioLocal.email,
          rol: usuarioLocal.rol,
          cedula_identidad: usuarioLocal.cedula_identidad,
          nombre_completo: usuarioLocal.nombre_completo,
          telefono: usuarioLocal.telefono,
        },
      ]);
    }
  } catch {
    // Modo local/offline: retorna el usuario creado en sesión local
  }

  return usuarioLocal;
}

export async function iniciarSesionConRol(
  email: string,
  password: string
): Promise<Usuario | null> {
  try {
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (!signInError && signInData?.user) {
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (usuarioData) {
        return usuarioData as Usuario;
      }
    }
  } catch {
    // Continúa con validación de cuentas locales en la app
  }
  return null;
}