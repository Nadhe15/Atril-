// src/hooks/useParentProfiles.ts
import { useState, useCallback } from 'react';
import { NivelMusical, SubperfilAlumno } from '../types/atril.types';
import { crearSubperfil, obtenerSubperfiles } from '../services/parentService';

// Almacén en memoria por tutorId para persistir los hijos creados durante la sesión
// incluso si la tabla remota `subperfiles_alumnos` aún no ha sido migrada en Supabase.
const CACHE_HIJOS_POR_TUTOR = new Map<string, SubperfilAlumno[]>();
const CACHE_HIJO_ACTIVO_ID = new Map<string, string>();

export interface NuevoHijoInput {
  tutorId: string;
  nombre_menor: string;
  edad_anos: number;
  instrumento: string;
  nivel?: NivelMusical;
}

export function useParentProfiles() {
  const [subperfiles, setSubperfiles] = useState<SubperfilAlumno[]>([]);
  const [alumnoActivo, setAlumnoActivo] = useState<SubperfilAlumno | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const cargarSubperfiles = useCallback(async (tutorId: string) => {
    if (!tutorId) return;
    setLoadingProfiles(true);
    try {
      const enCache = CACHE_HIJOS_POR_TUTOR.get(tutorId) ?? [];
      try {
        const remotos = await obtenerSubperfiles(tutorId);
        if (remotos.length > 0) {
          CACHE_HIJOS_POR_TUTOR.set(tutorId, remotos);
          setSubperfiles(remotos);
          const idGuardado = CACHE_HIJO_ACTIVO_ID.get(tutorId);
          const elegido = remotos.find((h) => h.id === idGuardado) ?? remotos[0];
          setAlumnoActivo(elegido);
          return;
        }
      } catch {
        // Si falla la consulta remota, usamos los hijos registrados en la sesión actual
      }

      setSubperfiles(enCache);
      const idGuardado = CACHE_HIJO_ACTIVO_ID.get(tutorId);
      const elegido = enCache.find((h) => h.id === idGuardado) ?? enCache[0] ?? null;
      setAlumnoActivo(elegido);
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  const alternarHijoActivo = useCallback(() => {
    setAlumnoActivo((actual) => {
      if (subperfiles.length === 0) return null;
      if (!actual) return subperfiles[0];
      const idx = subperfiles.findIndex((s) => s.id === actual.id);
      const nextIdx = (idx + 1) % subperfiles.length;
      const siguiente = subperfiles[nextIdx];
      if (siguiente) {
        CACHE_HIJO_ACTIVO_ID.set(siguiente.tutor_id, siguiente.id);
      }
      return siguiente;
    });
  }, [subperfiles]);

  const seleccionarHijoPorId = useCallback(
    (hijoId: string) => {
      const encontrado = subperfiles.find((s) => s.id === hijoId);
      if (encontrado) {
        CACHE_HIJO_ACTIVO_ID.set(encontrado.tutor_id, encontrado.id);
        setAlumnoActivo(encontrado);
      }
    },
    [subperfiles]
  );

  const registrarNuevoHijo = useCallback(
    async (input: NuevoHijoInput): Promise<SubperfilAlumno> => {
      const nombreLimpio = input.nombre_menor.trim();
      const instrumentoLimpio = input.instrumento.trim() || 'Oboe';
      const nivelElegido: NivelMusical = input.nivel ?? 'iniciacion';
      const edadValida = Math.min(17, Math.max(4, Math.round(input.edad_anos || 10)));

      let nuevoHijo: SubperfilAlumno;
      try {
        nuevoHijo = await crearSubperfil({
          tutor_id: input.tutorId,
          nombre_menor: nombreLimpio,
          edad_anos: edadValida,
          instrumento: instrumentoLimpio,
          nivel: nivelElegido,
          foto_privada_url: null,
        });
      } catch {
        // Respaldo local garantizado si RLS o migración aún no existe en el servidor
        nuevoHijo = {
          id: `hijo-${Date.now()}`,
          tutor_id: input.tutorId,
          nombre_menor: nombreLimpio,
          edad_anos: edadValida,
          instrumento: instrumentoLimpio,
          nivel: nivelElegido,
          foto_privada_url: null,
          created_at: new Date().toISOString(),
        };
      }

      const listaActual = CACHE_HIJOS_POR_TUTOR.get(input.tutorId) ?? [];
      const nuevaLista = [...listaActual, nuevoHijo];
      CACHE_HIJOS_POR_TUTOR.set(input.tutorId, nuevaLista);
      CACHE_HIJO_ACTIVO_ID.set(input.tutorId, nuevoHijo.id);

      setSubperfiles(nuevaLista);
      setAlumnoActivo(nuevoHijo);
      return nuevoHijo;
    },
    []
  );

  return {
    subperfiles,
    alumnoActivo,
    loadingProfiles,
    cargarSubperfiles,
    alternarHijoActivo,
    seleccionarHijoPorId,
    registrarNuevoHijo,
  };
}
