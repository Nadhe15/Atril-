// src/screens/StudentHomeScreen.tsx
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SesionClaseRow } from '../types/atril.types';

export interface StudentHomeScreenProps {
  nombreUsuario: string;
  esApoderado: boolean;
  sesionActiva: SesionClaseRow | null;
  estadoSesion: string;
  estadoEscrow: string;
  comprobanteReciente: string | null;
  enlaceZoomVisible: string | null;
  onGoToSearch: () => void;
  onGoToClasses: () => void;
  onGoToWallet: () => void;
  onConfirmAttendance: () => void;
  onReportContingency: () => void;
}

export default function StudentHomeScreen({
  nombreUsuario,
  esApoderado,
  sesionActiva,
  estadoSesion,
  estadoEscrow,
  comprobanteReciente,
  enlaceZoomVisible,
  onGoToSearch,
  onGoToClasses,
  onGoToWallet,
  onConfirmAttendance,
  onReportContingency,
}: StudentHomeScreenProps) {
  return (
    <View style={styles.container}>
      {/* Saludo Institucional */}
      <View style={styles.welcomeHeader}>
        <Text style={styles.welcomeMicro}>
          {esApoderado
            ? 'PORTAL DEL PADRE / REPRESENTANTE (A1)'
            : 'PORTAL DEL ESTUDIANTE ADULTO (A0)'}
        </Text>
        <Text style={styles.welcomeTitle}>Hola, {nombreUsuario}</Text>
        <Text style={styles.welcomeSubtitle}>
          Resumen en tiempo real de tu custodia fiduciaria y actividad académica en ATRIL.
        </Text>
      </View>

      {/* Tarjeta Principal: CUSTODIA FIDUCIARIA ATRIL */}
      <View style={styles.statusBanner}>
        <Text style={styles.statusBannerTitle}>🛡️ CUSTODIA FIDUCIARIA ATRIL</Text>
        <Text style={styles.statusLine}>
          • Reserva activa:{' '}
          <Text style={styles.boldWhite}>
            {sesionActiva ? `#${sesionActiva.id.slice(0, 8).toUpperCase()}` : 'Ninguna'}
          </Text>
        </Text>
        <Text style={styles.statusLine}>
          • Estado académico: <Text style={styles.boldGold}>{estadoSesion}</Text>
        </Text>
        <Text style={styles.statusLine}>
          • Garantía Escrow: <Text style={styles.boldGreen}>{estadoEscrow}</Text>
        </Text>
        {sesionActiva && (
          <>
            <Text style={styles.statusLine}>
              • Monto protegido:{' '}
              <Text style={styles.boldWhite}>
                ${sesionActiva.monto_bruto.toFixed(2)} USD
              </Text>
            </Text>
            <Text style={styles.statusLine}>
              • Código de validación (6 dígitos):{' '}
              <Text style={styles.boldWhite}>{sesionActiva.codigo_sesion}</Text>
            </Text>
          </>
        )}
        {comprobanteReciente && (
          <View style={styles.receiptPill}>
            <Text style={styles.receiptPillText}>✓ {comprobanteReciente}</Text>
          </View>
        )}
      </View>

      {/* Si hay una sesión activa: Panel de Sala Zoom y Validación */}
      {sesionActiva ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sesión Actual en Curso / Programada</Text>
          <View style={styles.zoomSecurityBox}>
            <Text style={styles.calcLine}>
              🔑 Código de inicio para dictar al profesor:{' '}
              <Text style={styles.codeHighlight}>{sesionActiva.codigo_sesion}</Text>
            </Text>
            <Text style={styles.calcLine}>
              🎥 Enlace Zoom:{' '}
              {enlaceZoomVisible
                ? enlaceZoomVisible
                : 'Oculto por seguridad (se habilita 15 min antes de la clase)'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: VERDE }]}
            activeOpacity={0.85}
            onPress={onConfirmAttendance}
          >
            <Text style={styles.primaryBtnText}>
              ✓ Confirmar Clase Recibida y Evaluar Docente
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: AMBAR }]}
            activeOpacity={0.85}
            onPress={onReportContingency}
          >
            <Text style={styles.primaryBtnText}>
              ⚡ Reportar Falla de Luz/Internet y Reprogramar sin Cargo
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Aún no tienes una sesión activa hoy</Text>
          <Text style={styles.helperText}>
            Explora el catálogo de maestros verificados por FundaOboeHJK, elige tu horario y protege tu pago en custodia Escrow.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={onGoToSearch}
          >
            <Text style={styles.primaryBtnText}>🔍 Buscar Clase y Reservar →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Accesos Rápidos del Estudiante */}
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.85}
          onPress={onGoToClasses}
        >
          <Text style={styles.quickIcon}>🎼</Text>
          <Text style={styles.quickTitle}>Mis Clases</Text>
          <Text style={styles.quickSub}>Ver calendario y códigos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.85}
          onPress={onGoToWallet}
        >
          <Text style={styles.quickIcon}>💳</Text>
          <Text style={styles.quickTitle}>Mi Billetera</Text>
          <Text style={styles.quickSub}>Saldo y custodia Escrow</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const AZUL_REY = '#1D4ED8';
const AZUL_MARINO = '#0A192F';
const FONDO = '#F8FAFC';
const BLANCO = '#FFFFFF';
const AMBAR = '#D97706';
const VERDE = '#059669';

const styles = StyleSheet.create({
  container: {
    backgroundColor: FONDO,
  },
  welcomeHeader: {
    marginBottom: 14,
  },
  welcomeMicro: {
    fontSize: 10,
    fontWeight: '800',
    color: AZUL_REY,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  welcomeTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: AZUL_MARINO,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  statusBanner: {
    backgroundColor: AZUL_MARINO,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  statusBannerTitle: {
    color: '#60A5FA',
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  statusLine: {
    color: '#CBD5E1',
    fontSize: 13,
    marginBottom: 5,
  },
  boldWhite: {
    color: BLANCO,
    fontWeight: '800',
  },
  boldGold: {
    color: '#FDE68A',
    fontWeight: '800',
  },
  boldGreen: {
    color: '#34D399',
    fontWeight: '800',
  },
  receiptPill: {
    marginTop: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#34D399',
  },
  receiptPillText: {
    color: '#E2E8F0',
    fontSize: 11.5,
    fontWeight: '600',
  },
  card: {
    backgroundColor: BLANCO,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AZUL_MARINO,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  zoomSecurityBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  calcLine: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 6,
  },
  codeHighlight: {
    color: AZUL_REY,
    fontWeight: '900',
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: AZUL_REY,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: BLANCO,
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: BLANCO,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
  },
  quickIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: AZUL_MARINO,
    marginBottom: 2,
  },
  quickSub: {
    fontSize: 11.5,
    color: '#64748B',
  },
});
