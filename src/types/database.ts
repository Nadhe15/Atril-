// src/types/database.ts

export type RolUsuario = 'DOCENTE' | 'ALUMNO' | 'REVISION_FUNDAOBOE';

export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  telefono: string | null;
  rol: RolUsuario;
  verificado: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubperfilAlumno {
  id: string;
  tutor_id: string;
  nombre_alumno: string;
  edad: number;
  grado_escolar: string;
  observaciones_aprendizaje: string | null;
  created_at: string;
}
