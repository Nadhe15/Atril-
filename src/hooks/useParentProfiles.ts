// src/hooks/useParentProfiles.ts
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SubperfilAlumno } from '../types/database';

const MOCK_SUBPERFILES_FALLBACK: SubperfilAlumno[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    tutor_id: '00000000-0000-0000-0000-000000000001',
    nombre_alumno: 'Lucas Sanabria',
    edad: 11,
    grado_escolar: 'Oboe Inicial • 6to Grado',
    observaciones_aprendizaje: 'Iniciación en embocadura y cañas',
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    tutor_id: '00000000-0000-0000-0000-000000000001',
    nombre_alumno: 'Sofía Sanabria',
    edad: 14,
    grado_escolar: 'Fagot Intermedio • 3er Año',
    observaciones_aprendizaje: 'Preparación audición juvenil',
    created_at: new Date().toISOString(),
  },
];

export function useParentProfiles() {
  const [subperfiles, setSubperfiles] = useState<SubperfilAlumno[]>(MOCK_SUBPERFILES_FALLBACK);
  const [alumnoActivo, setAlumnoActivo] = useState<SubperfilAlumno>(MOCK_SUBPERFILES_FALLBACK[0]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const cargarSubperfiles = useCallback(async (tutorId?: string) => {
    setLoadingProfiles(true);
    try {
      let query = supabase
        .from('subperfiles_alumnos')
        .select('*')
        .order('created_at', { ascending: true });
      if (tutorId) {
        query = query.eq('tutor_id', tutorId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        setSubperfiles(data as SubperfilAlumno[]);
        setAlumnoActivo(data[0] as SubperfilAlumno);
      }
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  const alternarHijoActivo = useCallback(() => {
    setAlumnoActivo((actual) => {
      const idx = subperfiles.findIndex((s) => s.id === actual.id);
      const nextIdx = (idx + 1) % subperfiles.length;
      return subperfiles[nextIdx];
    });
  }, [subperfiles]);

  return {
    subperfiles,
    alumnoActivo,
    loadingProfiles,
    cargarSubperfiles,
    alternarHijoActivo,
  };
}
