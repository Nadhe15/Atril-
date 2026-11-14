// src/screens/SplashScreen.tsx
import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';

interface SplashScreenProps {
  onEnter: () => void;
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  // Avance automático opcional a los 3.5 segundos o mediante botón directo
  useEffect(() => {
    const timer = setTimeout(() => {
      onEnter();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onEnter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {/* Simulación del Logo de ATRIL con atril sinfónico y notas musicales */}
        <View style={styles.logoBadgeContainer}>
          <View style={styles.musicRays}>
            <View style={[styles.ray, { transform: [{ rotate: '-40deg' }], backgroundColor: '#38BDF8' }]} />
            <View style={[styles.ray, { transform: [{ rotate: '-20deg' }], backgroundColor: '#FFBF00' }]} />
            <View style={[styles.ray, { transform: [{ rotate: '0deg' }], backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.ray, { transform: [{ rotate: '20deg' }], backgroundColor: '#FFBF00' }]} />
            <View style={[styles.ray, { transform: [{ rotate: '40deg' }], backgroundColor: '#38BDF8' }]} />
          </View>

          <View style={styles.logoCircle}>
            <Text style={styles.logoGlyph}>🎼</Text>
            <View style={styles.standIconMock}>
              <View style={styles.standShelf} />
              <View style={styles.standStem} />
              <View style={styles.standBase} />
            </View>
          </View>
        </View>

        <Text style={styles.brandTitle}>A T R I L</Text>
        <View style={styles.taglineBox}>
          <Text style={styles.taglineText}>FUNDACIÓN VENEZOLANA DEL OBOE</Text>
        </View>

        <Text style={styles.descriptionText}>
          Red oficial de conexión entre docentes musicales acreditados y estudiantes.
        </Text>

        <View style={styles.simulationNotice}>
          <Text style={styles.simulationBadge}>SIMULACIÓN DE PANTALLA DE LOGO / BIENVENIDA</Text>
          <Text style={styles.simulationText}>
            (Previo al inicio de sesión institucional)
          </Text>
        </View>

        <TouchableOpacity style={styles.enterButton} activeOpacity={0.85} onPress={onEnter}>
          <Text style={styles.enterButtonText}>Ingresar a la Plataforma →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const AZUL_REY = '#0047AB';
const AZUL_NOCHE = '#0A192F';
const DORADO = '#FFBF00';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AZUL_NOCHE,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  musicRays: {
    position: 'absolute',
    top: -18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 40,
    gap: 10,
  },
  ray: {
    width: 3.5,
    height: 22,
    borderRadius: 2,
    opacity: 0.85,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: AZUL_REY,
    borderWidth: 3.5,
    borderColor: DORADO,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  logoGlyph: {
    fontSize: 42,
  },
  standIconMock: {
    position: 'absolute',
    bottom: 12,
    alignItems: 'center',
  },
  standShelf: {
    width: 44,
    height: 5,
    backgroundColor: DORADO,
    borderRadius: 2,
  },
  standStem: {
    width: 3.5,
    height: 14,
    backgroundColor: '#FFFFFF',
  },
  standBase: {
    width: 26,
    height: 3,
    backgroundColor: DORADO,
    borderRadius: 2,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
    marginBottom: 6,
  },
  taglineBox: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DORADO,
    marginBottom: 16,
  },
  taglineText: {
    color: DORADO,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  descriptionText: {
    color: '#B3D1FF',
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
    maxWidth: 320,
    fontWeight: '500',
  },
  simulationNotice: {
    backgroundColor: 'rgba(255, 191, 0, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 191, 0, 0.4)',
    alignItems: 'center',
    marginBottom: 24,
  },
  simulationBadge: {
    color: DORADO,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  simulationText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  enterButton: {
    backgroundColor: DORADO,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: DORADO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  enterButtonText: {
    color: AZUL_NOCHE,
    fontSize: 15,
    fontWeight: '900',
  },
});
