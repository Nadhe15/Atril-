// src/types/database.ts

export type RolUsuario = 'TUTOR' | 'DOCENTE' | 'ADMIN';
export type ModalidadClase = 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO';
export type EstadoSesion = 'SOLICITADA' | 'CONFIRMADA' | 'EN_CURSO' | 'FINALIZADA' | 'CANCELADA';
export type EstadoEscrow =
  | 'PENDIENTE_PAGO'
  | 'RETENIDO_ESCROW'
  | 'LIBERADO_DOCENTE'
  | 'REEMBOLSADO_TUTOR'
  | 'EN_DISPUTA';

export type MetodoPago = 'PAGO_MOVIL_BCV' | 'TRANSFERENCIA_NACIONAL' | 'BINANCE_USDT' | 'PAYPAL_INTL';

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

export interface SesionClase {
  id: string;
  tutor_id: string;
  alumno_id: string;
  docente_id: string;
  modalidad: ModalidadClase;
  estado_clase: EstadoSesion;
  estado_pago_escrow: EstadoEscrow;
  monto_usd: number;
  fecha_programada: string;
  created_at: string;
}

export interface PaqueteAbono {
  id: 'INDIVIDUAL_1' | 'ABONO_FORMATIVO_6' | 'ABONO_INTENSIVO_8';
  nombre: string;
  cantidad_clases: number;
  descuento_porcentaje: number;
  monto_bruto_usd: number;
  comision_atril_15_usd: number;
  honorario_neto_docente_usd: number;
}

export const CATALOGO_PAQUETES_ATRIL: Record<PaqueteAbono['id'], PaqueteAbono> = {
  INDIVIDUAL_1: {
    id: 'INDIVIDUAL_1',
    nombre: 'Clase Individual (60 min)',
    cantidad_clases: 1,
    descuento_porcentaje: 0,
    monto_bruto_usd: 25.0,
    comision_atril_15_usd: 3.75,
    honorario_neto_docente_usd: 21.25,
  },
  ABONO_FORMATIVO_6: {
    id: 'ABONO_FORMATIVO_6',
    nombre: 'Paquete 6 Clases (Prepago al Contado -10%)',
    cantidad_clases: 6,
    descuento_porcentaje: 10,
    monto_bruto_usd: 135.0,
    comision_atril_15_usd: 20.25,
    honorario_neto_docente_usd: 114.75,
  },
  ABONO_INTENSIVO_8: {
    id: 'ABONO_INTENSIVO_8',
    nombre: 'Abono Intensivo 8 Clases (Prepago al Contado -12%)',
    cantidad_clases: 8,
    descuento_porcentaje: 12,
    monto_bruto_usd: 176.0,
    comision_atril_15_usd: 26.4,
    honorario_neto_docente_usd: 149.6,
  },
};
