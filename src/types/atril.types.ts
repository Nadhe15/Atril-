// src/types/atril.types.ts

export type EstadoVerificacion = 'pendiente' | 'verificado' | 'suspendido';

export type RolV5 = 'estudiante' | 'docente' | 'admin';

export type RolAtril =
  | 'alumno_tutor'
  | 'profesor_docente'
  | 'representante'
  | RolV5;

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
  rol_v5?: RolV5;
  estado_verificacion: EstadoVerificacion;
  tipo_estudiante?: TipoEstudiante | null;
  cedula_identidad: string;
  nombre_completo: string;
  telefono: string | null;
  es_menor?: boolean;
  nombre_representante?: string | null;
  cedula_representante?: string | null;
  area_docente?: string | null;
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
  area_principal?: string;
  areas_certificadas?: string[];
  instrumentos: string[];
  modalidades: ModalidadImparticion[];
  tarifa_usd?: number;
  verificado_fundaoboe: boolean;
  nivel_docente?: string;
  created_at?: string;
}

/**
 * Vista académica de un docente en el catálogo v5.0 (enfocada en áreas/cátedras
 * certificadas por FundaOboeHJK, sin exposición de datos privados ni tarifas/abonos).
 */
export interface DocenteCatalogoItem {
  id: string;
  profesor_id: string;
  nombre: string;
  bio: string;
  /** Área o cátedra principal que imparte el maestro (ej. "Oboe Sinfónico", "Cuatro Venezolano") */
  areaPrincipal: string;
  /** Lista de áreas y cátedras certificadas por FundaOboeHJK */
  areasCertificadas: string[];
  /** Alias mantenido por compatibilidad pasiva con componentes v3 */
  instrumentos: string[];
  modalidades: ModalidadClase[];
  /** Mantenido en modo pasivo (0 por defecto en v5.0) para compatibilidad de tipos */
  tarifa_usd: number;
  nivel_docente: string;
  verificado_fundaoboe: boolean;
  sedeReferencia?: string;
}

export interface ConversacionRow {
  id: string;
  alumno_id: string;
  profesor_id: string;
  area_interes: string | null;
  nombre_alumno?: string;
  nombre_profesor?: string;
  ultimo_mensaje?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MensajeRow {
  id: string;
  conversacion_id: string;
  remitente_id: string;
  nombre_remitente?: string;
  contenido: string;
  leido: boolean;
  created_at: string;
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
  /** Filtro por área o cátedra musical (v5.0) */
  area?: string;
  /** Alias compatible con búsqueda por texto de cátedra/instrumento */
  instrumento?: string;
}

// ============================================================================
// TIPOS EN MODO PASIVO (ESCROW Y BILLETERA — PRESERVADOS PARA FASES FUTURAS)
// ============================================================================

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
  saldo_en_custodia: number;
  saldo_disponible_corte: number;
}

export type ResumenBilletera = ResumenBilleteraTutor | ResumenBilleteraProfesor;
