// src/screens/BookingSuccessEscrowScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  ModalidadClase,
  OpcionContratacionDocente,
  SesionClaseRow,
  SubperfilAlumno,
} from '../types/atril.types';

export interface BookingSuccessEscrowScreenProps {
  sesion: SesionClaseRow;
  nombreDocente: string;
  horarioEtiqueta: string;
  opcionContratada: OpcionContratacionDocente;
  alumno: SubperfilAlumno;
  objetivoSesion?: string;
  onGoToDashboard: () => void;
}

const ETIQUETA_MODALIDAD: Record<ModalidadClase, string> = {
  online_en_vivo: 'Online En Vivo (Zoom Tutelado)',
  presencial_caracas: 'Presencial Caracas (Sede FundaOboeHJK)',
  hibrido: 'Híbrido (Presencial + Zoom)',
};

export default function BookingSuccessEscrowScreen({
  sesion,
  nombreDocente,
  horarioEtiqueta,
  opcionContratada,
  alumno,
  objetivoSesion,
  onGoToDashboard,
}: BookingSuccessEscrowScreenProps) {
  const [calendarioAgendado, setCalendarioAgendado] = useState<boolean>(false);

  return (
    <View style={styles.container}>
      {/* Cabecera con Icono Verde de Éxito */}
      <View style={styles.successHeaderCard}>
        <View style={styles.greenCheckCircle}>
          <Text style={styles.greenCheckIcon}>✓</Text>
        </View>
        <Text style={styles.successTitle}>✓ Reserva Formalizada con Éxito</Text>
        <Text style={styles.successSubtitle}>
          Folio #{sesion.id.slice(0, 8).toUpperCase()} • {opcionContratada.titulo}
        </Text>
      </View>

      {/* Tarjeta Azul Marino Profundo (#0A192F) — Retención Fiduciaria Escrow */}
      <View style={styles.escrowNavyCard}>
        <View style={styles.escrowStatusPill}>
          <Text style={styles.escrowStatusText}>EN CUSTODIA FIDUCIARIA (ESCROW)</Text>
        </View>

        <Text style={styles.frozenLabel}>MONTO CONGELADO</Text>
        <Text style={styles.frozenAmount}>${sesion.monto_bruto.toFixed(2)} USD</Text>

        <Text style={styles.escrowExplanation}>
          &ldquo;Los fondos quedan bloqueados y seguros. El profesor solo recibirá sus honorarios (85%) tras la validación de la sesión.&rdquo;
        </Text>
      </View>

      {/* Tarjeta de Cita Agendada */}
      <View style={styles.appointmentCard}>
        <Text style={styles.sectionTitle}>Cita Académica Agendada</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Docente:</Text>
          <Text style={styles.detailValue}>{nombreDocente}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Estudiante:</Text>
          <Text style={styles.detailValue}>{alumno.nombre_menor}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Modalidad:</Text>
          <Text style={styles.detailValue}>
            {ETIQUETA_MODALIDAD[sesion.modalidad] ?? sesion.modalidad}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fecha y Hora:</Text>
          <Text style={styles.detailValue}>{horarioEtiqueta}</Text>
        </View>

        {objetivoSesion && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Objetivo:</Text>
            <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>
              {objetivoSesion}
            </Text>
          </View>
        )}
      </View>

      {/* Generación Visible del Código de Sesión de 6 Dígitos */}
      <View style={styles.codeBox}>
        <Text style={styles.codeHeader}>CÓDIGO DE SESIÓN DE 6 DÍGITOS</Text>
        <Text style={styles.codeDigits}>{sesion.codigo_sesion}</Text>
        <Text style={styles.codeHelper}>
          Dicta este código al profesor al ingresar a Zoom para registrar el inicio formal de la clase y habilitar la liberación posterior.
        </Text>
      </View>

      {/* Acciones Finales */}
      <TouchableOpacity
        style={styles.primaryActionBtn}
        activeOpacity={0.85}
        onPress={onGoToDashboard}
      >
        <Text style={styles.primaryActionText}>Ir a Mis Clases / Billetera</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryActionBtn}
        activeOpacity={0.85}
        onPress={() => setCalendarioAgendado(true)}
      >
        <Text style={styles.secondaryActionText}>
          {calendarioAgendado
            ? '✓ Recordatorio Añadido a tu Calendario'
            : '🗓️ Agendar en Calendario'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const AZUL_REY = '#1D4ED8';
const AZUL_INSTITUCIONAL = '#1E40AF';
const AZUL_MARINO_PROFUNDO = '#0A192F';
const FONDO = '#F8FAFC';
const BLANCO = '#FFFFFF';
const AMBAR = '#D97706';
const VERDE = '#059669';

const styles = StyleSheet.create({
  container: {
    backgroundColor: FONDO,
  },
  successHeaderCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: VERDE,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  greenCheckCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: VERDE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  greenCheckIcon: {
    color: BLANCO,
    fontSize: 24,
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: VERDE,
    marginBottom: 4,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#065F46',
    textAlign: 'center',
  },
  escrowNavyCard: {
    backgroundColor: AZUL_MARINO_PROFUNDO,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  escrowStatusPill: {
    backgroundColor: AMBAR,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  escrowStatusText: {
    color: BLANCO,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  frozenLabel: {
    color: '#93C5FD',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  frozenAmount: {
    color: BLANCO,
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 4,
  },
  escrowExplanation: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 4,
  },
  appointmentCard: {
    backgroundColor: BLANCO,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
    gap: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  detailValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0A192F',
  },
  codeBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: AZUL_REY,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  codeHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    color: AZUL_INSTITUCIONAL,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  codeDigits: {
    fontSize: 28,
    fontWeight: '900',
    color: AZUL_REY,
    letterSpacing: 4,
    marginBottom: 6,
  },
  codeHelper: {
    fontSize: 11.5,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 16,
  },
  primaryActionBtn: {
    backgroundColor: AZUL_REY,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryActionText: {
    color: BLANCO,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    backgroundColor: BLANCO,
    borderWidth: 1.5,
    borderColor: AZUL_INSTITUCIONAL,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryActionText: {
    color: AZUL_INSTITUCIONAL,
    fontSize: 13,
    fontWeight: '800',
  },
});
