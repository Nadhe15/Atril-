// src/services/parentService.ts
import { supabase } from '../lib/supabase';
import { SubperfilAlumno } from '../types/atril.types';

const EDAD_MINIMA_MENOR = 4;
const EDAD_MAXIMA_MENOR = 17;

/**
 * Consulta todos los subperfiles de menores asociados al tutor activo (protegido por RLS: auth.uid() = tutor_id).
 */
export async function obtenerSubperfiles(tutorId: string): Promise<SubperfilAlumno[]> {
  if (!tutorId) {
    throw new Error('El identificador del tutor (tutorId) es obligatorio.');
  }

  const { data, error } = await supabase
    .from('subperfiles_alumnos')
    .select('*')
    .eq('tutor_id', tutorId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Error al obtener subperfiles del representante: ${error.message}`);
  }

  return (data ?? []) as SubperfilAlumno[];
}

/**
 * Crea un subperfil de alumno menor de edad validando estrictamente el rango (4 a 17 años).
 */
export async function crearSubperfil(
  data: Omit<SubperfilAlumno, 'id'>
): Promise<SubperfilAlumno> {
  if (!Number.isInteger(data.edad_anos) || data.edad_anos < EDAD_MINIMA_MENOR || data.edad_anos > EDAD_MAXIMA_MENOR) {
    throw new Error(
      `La edad del alumno menor debe estar entre ${EDAD_MINIMA_MENOR} y ${EDAD_MAXIMA_MENOR} años.`
    );
  }

  if (!data.nombre_menor.trim() || !data.instrumento.trim()) {
    throw new Error('El nombre del menor y el instrumento son obligatorios.');
  }

  const { data: creado, error } = await supabase
    .from('subperfiles_alumnos')
    .insert([
      {
        tutor_id: data.tutor_id,
        nombre_menor: data.nombre_menor.trim(),
        edad_anos: data.edad_anos,
        instrumento: data.instrumento.trim(),
        nivel: data.nivel,
        foto_privada_url: data.foto_privada_url ?? null,
      },
    ])
    .select('*')
    .single();

  if (error || !creado) {
    throw new Error(`Error al registrar el subperfil del menor: ${error?.message ?? 'Sin respuesta'}`);
  }

  return creado as SubperfilAlumno;
}