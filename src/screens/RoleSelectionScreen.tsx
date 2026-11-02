// src/screens/RoleSelectionScreen.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import SupabaseStatusBadge from '../components/SupabaseStatusBadge';

export type SelectedAppRole = 'ALUMNO' | 'DOCENTE' | 'VISITANTE';

interface RoleSelectionScreenProps {
  onSelectRole: (role: SelectedAppRole) => void;
}

export default function RoleSelectionScreen({ onSelectRole }: RoleSelectionScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado de Marca ATRIL */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBox}>
            <Text style={styles.logoSymbol}>🎼</Text>
          </View>
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandTitle}>ATRIL</Text>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>MERCADO MUSICAL TUTELADO</Text>
            </View>
          </View>
        </View>

        {/* Título e Instrucciones */}
        <View style={styles.headerBlock}>
          <Text style={styles.mainTitle}>¿Cómo deseas ingresar?</Text>
          <Text style={styles.subtitle}>
            Configura tu rol para adaptar tu experiencia operativa
          </Text>
        </View>

        {/* TARJETA 1: ROL ALUMNO / APODERADO */}
        <TouchableOpacity
          style={[styles.roleCard, styles.studentCardBorder]}
          activeOpacity={0.9}
          onPress={() => onSelectRole('ALUMNO')}
        >
          <View style={styles.roleTagBlue}>
            <Text style={styles.roleTagBlueText}>ROL ALUMNO / APODERADO</Text>
          </View>

          <Text style={styles.cardTitle}>Quiero aprender música</Text>
          <Text style={styles.cardDescription}>
            Accede a maestros verificados de FundaOboe, abonos protegidos por Escrow y clases en vivo.
          </Text>

          <View style={styles.cardFooterRow}>
            <View style={styles.legalPill}>
              <Text style={styles.legalPillText}>
                Menores de edad: Registran sus padres
              </Text>
            </View>

            <TouchableOpacity
              style={styles.chooseButtonPrimary}
              activeOpacity={0.85}
              onPress={() => onSelectRole('ALUMNO')}
            >
              <Text style={styles.chooseButtonText}>Elegir →</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* TARJETA 2: ROL PROFESOR / DOCENTE */}
        <TouchableOpacity
          style={[styles.roleCard, styles.teacherCardBorder]}
          activeOpacity={0.9}
          onPress={() => onSelectRole('DOCENTE')}
        >
          <View style={styles.roleTagAmber}>
            <Text style={styles.roleTagAmberText}>ROL PROFESOR / MAESTRO</Text>
          </View>

          <Text style={styles.cardTitle}>Soy maestro de música</Text>
          <Text style={styles.cardDescription}>
            Imparte clases, gestiona tus horarios presenciales u online y cobra con liquidación fiduciaria segura.
          </Text>

          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsText}>
              Requisitos: CV, Diplomas + Entrevista FundaOboe
            </Text>
          </View>

          <View style={styles.teacherActionRow}>
            <TouchableOpacity
              style={styles.chooseButtonDarkBlue}
              activeOpacity={0.85}
              onPress={() => onSelectRole('DOCENTE')}
            >
              <Text style={styles.chooseButtonText}>Elegir →</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* OPCIÓN SECUNDARIA: VISITANTE RESTRINGIDO */}
        <View style={styles.visitorCard}>
          <Text style={styles.visitorTitle}>Explorar catálogo en modo público</Text>
          <Text style={styles.visitorDesc}>
            Vista general de instrumentos y oferta formativa.
          </Text>
          <Text style={styles.visitorWarning}>
            Perfil de profesores y contratación bloqueados.
          </Text>

          <TouchableOpacity
            style={styles.visitorButton}
            activeOpacity={0.8}
            onPress={() => onSelectRole('VISITANTE')}
          >
            <Text style={styles.visitorButtonText}>
              Continuar como visitante restringido →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pie Institucional + Diagnóstico de Conexión Backend en Vivo */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Al continuar aceptas los Términos de Servicio y Tutela
          </Text>
          <Text style={styles.footerInstitution}>
            FundaOboeHJK & USB — Caracas, 2026
          </Text>

          <SupabaseStatusBadge />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const AZUL_REY = '#1D4ED8';
const AZUL_OSCURO = '#1E40AF';
const FONDO_NEUTRO = '#F4F7FC';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FONDO_NEUTRO,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: AZUL_REY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AZUL_REY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  logoSymbol: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  brandTextContainer: {
    marginLeft: 14,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: AZUL_OSCURO,
    letterSpacing: 0.3,
  },
  brandBadge: {
    marginTop: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  brandBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: AZUL_REY,
    letterSpacing: 0.4,
  },
  headerBlock: {
    marginBottom: 22,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#64748B',
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  studentCardBorder: {
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  teacherCardBorder: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  roleTagBlue: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  roleTagBlueText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: AZUL_REY,
  },
  roleTagAmber: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  roleTagAmberText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#D97706',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  legalPill: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  legalPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  requirementsBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  requirementsText: {
    fontSize: 10,
    fontWeight: '700',
    color: AZUL_OSCURO,
  },
  teacherActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  chooseButtonPrimary: {
    backgroundColor: AZUL_REY,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseButtonDarkBlue: {
    backgroundColor: AZUL_OSCURO,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  visitorCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    padding: 18,
    marginTop: 4,
    marginBottom: 24,
  },
  visitorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 6,
  },
  visitorDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  visitorWarning: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 14,
  },
  visitorButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: AZUL_REY,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitorButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: AZUL_REY,
  },
  footer: {
    alignItems: 'center',
    marginTop: 6,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  footerInstitution: {
    fontSize: 11,
    fontWeight: '700',
    color: AZUL_OSCURO,
  },
});
