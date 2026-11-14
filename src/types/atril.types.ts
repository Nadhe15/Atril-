// src/types/atril.types.ts

export type RolAtril = 'DOCENTE' | 'ALUMNO' | 'REVISION_FUNDAOBOE';

export type EstadoAcreditacionDocente =
  | 'ACREDITADO'
  | 'EN_REVISION'
  | 'BANCO_TALENTOS'
  | 'DESCARTADO';

export type ModalidadEnsenanza = 'Online (En Vivo)';

export type NivelMusical = 'iniciacion' | 'intermedio' | 'avanzado' | 'audicion_sinfonica';

export interface ArchivoRecaudo {
  nombreArchivo: string;
  formato: 'JPG' | 'PNG' | 'PDF';
  pesoMb: number;
  cargado: boolean;
  descripcion?: string;
}

export interface DocumentosAcreditacionDocente {
  cedulaIdentidad: ArchivoRecaudo;
  fotoPersonal: ArchivoRecaudo;
  curriculumVitae: ArchivoRecaudo;
  certificacionesMusicales: ArchivoRecaudo;
}

export interface PerfilDocenteAtril {
  id: string;
  user_id: string;
  nombre_completo: string;
  cedula_identidad: string;
  email: string;
  telefono: string;
  instrumento_principal: string;
  instrumentos_certificados: string[];
  acreditado_fundaoboe: boolean;
  estado_acreditacion: EstadoAcreditacionDocente;
  orquesta_o_conservatorio: string;
  anos_experiencia: number;
  trayectoria_biografia: string;
  certificaciones_avales: string[];
  modalidades: ModalidadEnsenanza[];
  documentos: DocumentosAcreditacionDocente;
  observacion_revisor?: string;
  created_at?: string;
}

export interface RepresentadoMenor {
  id: string;
  nombre_completo: string;
  edad: number;
  filiacion: 'Padre / Madre' | 'Representante Legal' | 'Tutor Autorizado';
  instrumento_interes: string;
}

export interface SubperfilAlumno {
  id: string;
  tutor_id: string;
  nombre_menor: string;
  edad_anos: number;
  instrumento: string;
  nivel: NivelMusical;
  foto_privada_url: string | null;
  created_at?: string;
}

export interface Usuario {
  id: string;
  email: string;
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
  created_at?: string;
}

export interface SolicitudContactoDocente {
  id: string;
  docente_id: string;
  nombre_docente: string;
  instrumento_seleccionado: string;
  nombre_solicitante: string;
  beneficiario_alumno: string;
  mensaje_consulta: string;
  fecha_solicitud: string;
  estado: 'PENDIENTE_VERIFICACION';
}