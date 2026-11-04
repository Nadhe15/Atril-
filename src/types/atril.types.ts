// src/types/atril.types.ts

export type RolAtril = 'alumno_tutor' | 'profesor_docente' | 'representante';

export type ModalidadImparticion = 'presencial_caracas' | 'online_en_vivo' | 'hibrido';
export type ModalidadClase = ModalidadImparticion;

export type NivelMusical = 'iniciacion' | 'intermedio' | 'avanzado' | 'audicion_sinfonica';

export type TipoEstudiante = 'apoderado' | 'estudiante_adulto';

export type EstadoSesionClase =
  | 'programada'
  | 'iniciada'
  | 'declarada_docente'
  | 'asistencia_validada'
  | 'reprogramada_fuerza_mayor'
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
  tipo_estudiante?: TipoEstudiante | null;
  cedula_identidad: string;
  nombre_completo: string;
  telefono: string | null;
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
  nivel_docente?: string;
  created_at?: string;
}

/**
 * Vista pública de un docente en el catálogo (sin teléfono, email ni cédula
 * para cumplir la política de protección comunitaria y evitar evasión de custodia).
 */
export interface DocenteCatalogoItem {
  id: string;
  profesor_id: string;
  nombre: string;
  bio: string;
  instrumentos: string[];
  modalidades: ModalidadClase[];
  tarifa_usd: number;
  nivel_docente: string;
  verificado_fundaoboe: boolean;
}

export interface BloqueHorarioDisponible {
  id: string;
  etiqueta: string;
  fechaHoraIso: string;
  modalidadSugerida: 'presencial_caracas' | 'online_en_vivo';
}

export type TipoContratacionClase = 'CLASE_SUELTA_1' | 'ABONO_6_CLASES' | 'ABONO_8_CLASES';

export interface OpcionContratacionDocente {
  id: TipoContratacionClase;
  titulo: string;
  subtitulo: string;
  cantidadClases: 1 | 6 | 8;
  porcentajeDescuento: 0 | 10 | 12;
  montoTotalUsd: number;
  equivalentePorClaseUsd: number;
  ahorroUsd: number;
  comisionPlataformaUsd: number;
  honorarioNetoDocenteUsd: number;
}

export interface FichaDocenteDetalle extends DocenteCatalogoItem {
  sedeReferencia: string;
  bloquesHorarios: BloqueHorarioDisponible[];
  opcionesContratacion: OpcionContratacionDocente[];
}

export interface FiltrosCatalogoDocentes {
  modalidad?: ModalidadClase;
  instrumento?: string;
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
  comision_plataforma?: number | null;
  honorario_neto?: number | null;
  codigo_sesion: string;
  enlace_zoom: string | null;
  estado_sesion: EstadoSesionClase;
  estado_escrow: EstadoCustodiaEscrow;
  calificacion_tutor?: number | null;
  motivo_incumplimiento?: string | null;
  motivo_contingencia?: string | null;
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
  abonoId?: string | null;
  tutorId: string;
  alumnoId: string;
  profesorId: string;
  fechaHora: string;
  modalidad: ModalidadImparticion;
  montoBruto: number;
  codigoSesion?: string;
  enlaceZoom?: string;
}

export interface RpcBloquearFondosArgs {
  p_abono_id: string | null;
  p_tutor_id: string;
  p_alumno_id: string;
  p_profesor_id: string;
  p_fecha_hora: string;
  p_modalidad: ModalidadImparticion;
  p_monto_bruto: number;
  p_codigo_sesion: string;
}

export interface RpcConfirmarAsistenciaArgs {
  p_sesion_id: string;
  p_tutor_id: string;
  p_calificacion: number;
}

export interface RpcConfirmarAsistenciaResponse {
  ok: boolean;
  sesion: SesionClaseRow;
  movimiento_comision: MovimientoEscrowRow;
  movimiento_liberacion: MovimientoEscrowRow;
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
  /** Dinero retenido por clases programadas/iniciadas/reprogramadas pendientes */
  saldo_en_custodia: number;
  /** Honorarios netos (85%) de clases dadas y validadas por código, acumulados para el corte de fin de mes de FundaOboeHJK */
  saldo_disponible_corte: number;
}

export type ResumenBilletera = ResumenBilleteraTutor | ResumenBilleteraProfesor;
