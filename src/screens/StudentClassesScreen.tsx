// src/screens/StudentClassesScreen.tsx
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SesionClaseRow } from '../types/atril.types';

export interface ClaseAgendadaItem {
  sesion: SesionClaseRow;
  nombreDocente: string;
  horarioEtiqueta: string;
  nombreAlumno: string;
  objetivoSesion: string;
  tituloPlan: string;
}

export interface StudentClassesScreenProps {
  clasesAgendadas: ClaseAgendadaItem[];
  estadoSesionActual: string;
  estadoEscrowActual: string;
  onGoToSearch: () => void;
  onConfirmAttendance: () => void;
  onReportContingency: () => void;
}

export default function StudentClassesScreen({
  clasesAgendadas,
  estadoSesionActual,
  estadoEscrowActual,
  onGoToSearch,
  onConfirmAttendance,
  onReportContingency,
}: StudentClassesScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.microTag}>AGENDA ACADÉMICA</Text>
        <Text style={styles.title}>Mis Clases Agendadas</Text>
        <Text style={styles.subtitle}>
          Consulta tus fechas reservadas, objetivos de estudio y códigos de acceso Zoom.
        </Text>
      </View>

      {clasesAgendadas.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>Tu calendario está vacío</Text>
          <Text style={styles.emptyDesc}>
            Aún no tienes clases programadas. Busca un maestro certificado para agendar tu primera sesión tutelada.
          </Text>
          <TouchableOpacity
            style={styles.bookNowBtn}
            activeOpacity={0.85}
            onPress={onGoToSearch}
          >
            <Text style={styles.bookNowBtnText}>Agendar una Clase →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        clasesAgendadas.map((item, idx) => {
          const esMasReciente = idx === 0;
          return (
            <View key={item.sesion.id} style={styles.classCard}>
              <View style={styles.topBadgeRow}>
                <View style={styles.datePill}>
                  <Text style={styles.datePillText}>🗓️ {item.horarioEtiqueta}</Text>
                </View>
                <View style={styles.escrowPill}>
                  <Text style={styles.escrowPillText}>
                    ${item.sesion.monto_bruto.toFixed(2)} USD • ESCROW
                  </Text>
                </View>
              </View>

              <Text style={styles.teacherName}>{item.nombreDocente}</Text>
              <Text style={styles.planSubtitle}>
                {item.tituloPlan} • Estudiante: {item.nombreAlumno}
              </Text>

              <View style={styles.infoBox}>
                <Text style={styles.infoLine}>
                  📌 <Text style={styles.infoBold}>Objetivo:</Text> {item.objetivoSesion}
                </Text>
                <Text style={styles.infoLine}>
                  📍 <Text style={styles.infoBold}>Modalidad:</Text>{' '}
                  {item.sesion.modalidad === 'online_en_vivo'
                    ? 'Online En Vivo (Zoom)'
                    : 'Presencial Caracas'}
                </Text>
                <Text style={styles.infoLine}>
                  📊 <Text style={styles.infoBold}>Estado:</Text>{' '}
                  {esMasReciente ? estadoSesionActual : item.sesion.estado_sesion} (
                  {esMasReciente ? estadoEscrowActual : item.sesion.estado_escrow})
                </Text>
              </View>

              {/* Código de 6 dígitos */}
              <View style={styles.codeBanner}>
                <View>
                  <Text style={styles.codeLabel}>CÓDIGO DE SESIÓN (6 DÍGITOS)</Text>
                  <Text style={styles.codeHint}>Dictar al maestro al iniciar Zoom</Text>
                </View>
                <Text style={styles.codeValue}>{item.sesion.codigo_sesion}</Text>
              </View>

              {esMasReciente && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: VERDE }]}
                    onPress={onConfirmAttendance}
                  >
                    <Text style={styles.actionBtnText}>✓ Confirmar Asistencia</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: AMBAR }]}
                    onPress={onReportContingency}
                  >
                    <Text style={styles.actionBtnText}>⚡ Reprogramar (Falla)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const AZUL_REY = '#1D4ED8';
const AZUL_INSTITUCIONAL = '#1E40AF';
const AZUL_MARINO = '#0A192F';
const FONDO = '#F8FAFC';
const BLANCO = '#FFFFFF';
const AMBAR = '#D97706';
const VERDE = '#059669';

const styles = StyleSheet.create({
  container: {
    backgroundColor: FONDO,
  },
  headerBlock: {
    marginBottom: 14,
  },
  microTag: {
    fontSize: 10,
    fontWeight: '800',
    color: AZUL_REY,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: AZUL_MARINO,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: BLANCO,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AZUL_MARINO,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  bookNowBtn: {
    backgroundColor: AZUL_REY,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  bookNowBtnText: {
    color: BLANCO,
    fontSize: 13,
    fontWeight: '800',
  },
  classCard: {
    backgroundColor: BLANCO,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  datePill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  datePillText: {
    color: AZUL_INSTITUCIONAL,
    fontSize: 11.5,
    fontWeight: '800',
  },
  escrowPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  escrowPillText: {
    color: VERDE,
    fontSize: 11,
    fontWeight: '800',
  },
  teacherName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: AZUL_MARINO,
    marginBottom: 2,
  },
  planSubtitle: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 10,
  },
  infoBox: {
    backgroundColor: FONDO,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 4,
  },
  infoLine: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  infoBold: {
    fontWeight: '800',
    color: AZUL_MARINO,
  },
  codeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: AZUL_REY,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: AZUL_INSTITUCIONAL,
  },
  codeHint: {
    fontSize: 11,
    color: '#475569',
  },
  codeValue: {
    fontSize: 20,
    fontWeight: '900',
    color: AZUL_REY,
    letterSpacing: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: BLANCO,
    fontSize: 11.5,
    fontWeight: '800',
  },
});
