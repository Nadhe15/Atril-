// src/types/atril.types.ts

export type RolAtril = 'alumno_tutor' | 'profesor_docente';

export type ModalidadImparticion = 'presencial' | 'online' | 'hibrido';

export type NivelMusical = 'iniciacion' | 'intermedio' | 'avanzado' | 'audicion_sinfonica';

export type EstadoSesionClase =
  | 'programada'
  | 'declarada_docente'
  | 'asistencia_validada'
  | 'incumplimiento_reportado'
  | 'cancelada';

export type EstadoCustodiaEscrow =
  | 'bloqueado'
  | 'liberado'
  | 'reembolsado'
  | 'en_disputa';

export type TipoMovimientoEscrow =
  | 'recarga'
  | 'bloqueo'
  | 'liberacion'
  | 'comision'
  | 'reembolso';

export interface Usuario {
  id: string;
  email: string;
  rol: RolAtril;
  cedula_identidad: string;
  nombre_completo: string;
  telefono: string;
  created_at?: string;
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

export interface PerfilProfesor {
  id: string;
  user_id: string;
  bio: string;
  instrumentos: string[];
  modalidades: ModalidadImparticion[];
  tarifa_usd: number;
  verificado_fundaoboe: boolean;
  created_at?: string;
}

export interface SesionClaseRow {
  id: string;
  abono_id: string | null;
  tutor_id: string;
  alumno_id: string;
  profesor_id: string;
  fecha_hora: string;
  modalidad: ModalidadImparticion;
  monto_bruto: number;
  estado_sesion: EstadoSesionClase;
  estado_escrow: EstadoCustodiaEscrow;
  calificacion_tutor?: number | null;
  motivo_incumplimiento?: string | null;
  created_at: string;
}

export interface MovimientoEscrowRow {
  id: string;
  sesion_id: string;
  usuario_id: string;
  tipo: TipoMovimientoEscrow;
  monto_usd: number;
  descripcion: string;
  created_at: string;
}

export interface DesgloseHonorario {
  bruto: number;
  comisionPlataforma: number;
  honorarioNeto: number;
}

export interface DesgloseAbono {
  tipoClases: 6 | 8;
  tarifaBaseUnitaria: number;
  subtotalSinDescuento: number;
  porcentajeAhorro: 10 | 12;
  ahorroUsd: number;
  totalAPagarContado: number;
  equivalentePorClase: number;
  comisionPlataformaTotal: number;
  honorarioNetoDocenteTotal: number;
}

export interface BloquearFondosParams {
  abonoId?: string;
  tutorId: string;
  alumnoId: string;
  profesorId: string;
  fechaHora: string;
  modalidad: ModalidadImparticion;
  montoBruto: number;
}

export interface ResumenBilleteraTutor {
  rol: 'tutor';
  userId: string;
  saldoDisponibleUsd: number;
  saldoRetenidoEscrowUsd: number;
}

export interface ResumenBilleteraProfesor {
  rol: 'profesor';
  userId: string;
  saldoLiquidableAcumuladoUsd: number;
  saldoPendientePorLiberarUsd: number;
}

export type ResumenBilletera = ResumenBilleteraTutor | ResumenBilleteraProfesor;