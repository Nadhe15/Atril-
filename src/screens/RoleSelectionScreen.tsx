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

export type SelectedAppRole = 'DOCENTE' | 'ALUMNO' | 'REVISION_FUNDAOBOE';

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
        <View style={styles.brandHeader}>
          <View style={styles.logoBox}>
            <Text style={styles.logoSymbol}>🎼</Text>
          </View>
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandTitle}>ATRIL · FUNDAOBOE</Text>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>CONEXIÓN MUSICAL VERIFICADA</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerBlock}>
          <Text style={styles.mainTitle}>Selecciona tu rol de registro</Text>
          <Text style={styles.subtitle}>
            Elige una de las tres opciones del ecosistema Fundaoboe
          </Text>
        </View>

        {/* OPCIÓN 1: DOCENTE */}
        <TouchableOpacity
          style={styles.roleCard}
          activeOpacity={0.9}
          onPress={() => onSelectRole('DOCENTE')}
        >
          <View style={styles.roleTagAmber}>
            <Text style={styles.roleTagAmberText}>OPCIÓN 1 · DOCENTE / PROFESOR</Text>
          </View>
          <Text style={styles.cardTitle}>Soy maestro de música</Text>
          <Text style={styles.cardDescription}>
            Regístrate en 2 pasos adjuntando Cédula, Foto, CV y Certificaciones Musicales/Sinfónicas para acreditación de Fundaoboe.
          </Text>
          <TouchableOpacity
            style={styles.chooseButtonPrimary}
            onPress={() => onSelectRole('DOCENTE')}
          >
            <Text style={styles.chooseButtonText}>Elegir Docente →</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* OPCIÓN 2: ALUMNO O ESTUDIANTE */}
        <TouchableOpacity
          style={styles.roleCard}
          activeOpacity={0.9}
          onPress={() => onSelectRole('ALUMNO')}
        >
          <View style={styles.roleTagBlue}>
            <Text style={styles.roleTagBlueText}>OPCIÓN 2 · ALUMNO O ESTUDIANTE</Text>
          </View>
          <Text style={styles.cardTitle}>Quiero aprender un instrumento</Text>
          <Text style={styles.cardDescription}>
            Explora los perfiles de docentes acreditados por instrumento. (Si es menor de 18 años, se registra su Padre o Representante Legal).
          </Text>
          <TouchableOpacity
            style={styles.chooseButtonPrimary}
            onPress={() => onSelectRole('ALUMNO')}
          >
            <Text style={styles.chooseButtonText}>Elegir Alumno →</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* OPCIÓN 3: REVISIÓN (ENCARGADO FUNDAOBOE) */}
        <TouchableOpacity
          style={styles.roleCard}
          activeOpacity={0.9}
          onPress={() => onSelectRole('REVISION_FUNDAOBOE')}
        >
          <View style={styles.roleTagGreen}>
            <Text style={styles.roleTagGreenText}>
              OPCIÓN 3 · REVISIÓN (ENCARGADO FUNDAOBOE)
            </Text>
          </View>
          <Text style={styles.cardTitle}>Revisión de Documentos Fundaoboe</Text>
          <Text style={styles.cardDescription}>
            Revisa las postulaciones docentes, verifica sus certificados musicales y otorga la acreditación oficial.
          </Text>
          <TouchableOpacity
            style={styles.chooseButtonPrimary}
            onPress={() => onSelectRole('REVISION_FUNDAOBOE')}
          >
            <Text style={styles.chooseButtonText}>Elegir Revisión →</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerInstitution}>
            Fundaoboe & USB — Caracas, 2026
          </Text>
          <SupabaseStatusBadge />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const AZUL_REY = '#0047AB';
const AZUL_NOCHE = '#0A192F';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FC',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  logoBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: AZUL_REY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSymbol: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  brandTextContainer: {
    marginLeft: 14,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: AZUL_NOCHE,
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
    fontSize: 10,
    fontWeight: '800',
    color: AZUL_REY,
  },
  headerBlock: {
    marginBottom: 18,
  },
  mainTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#475569',
  },
  roleTagBlue: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  roleTagBlueText: {
    fontSize: 11,
    fontWeight: '900',
    color: AZUL_REY,
  },
  roleTagAmber: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  roleTagAmberText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#92400E',
  },
  roleTagGreen: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  roleTagGreenText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#065F46',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13.5,
    color: '#1E293B',
    lineHeight: 19,
    marginBottom: 14,
    fontWeight: '500',
  },
  chooseButtonPrimary: {
    backgroundColor: AZUL_REY,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  chooseButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '900',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerInstitution: {
    fontSize: 12.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
});
