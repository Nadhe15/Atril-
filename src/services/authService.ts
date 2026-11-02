// src/services/authService.ts
import { supabase } from '../lib/supabase';
import { RolAtril, Usuario } from '../types/atril.types';

export interface RegistroUsuarioInput {
  email: string;
  password: string;
  rol: RolAtril;
  cedula_identidad: string;
  nombre_completo: string;
  telefono: string;
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

export async function iniciarSesionConRol(
  email: string,
  password: string
): Promise<Usuario> {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (signInError || !signInData.user) {
    throw new Error(`Credenciales inválidas: ${signInError?.message ?? 'Acceso denegado'}`);
  }

  const { data: usuarioData, error: userError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', signInData.user.id)
    .single();

  if (userError || !usuarioData) {
    throw new Error(`No se encontró el perfil del usuario: ${userError?.message ?? ''}`);
  }

  return usuarioData as Usuario;
}