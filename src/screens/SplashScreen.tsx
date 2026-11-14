// src/screens/SplashScreen.tsx
import React from 'react';
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
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {/* Emblema / Logo de ATRIL con atril sinfónico y notas musicales */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onEnter}
          style={styles.logoBadgeContainer}
        >
          <View style={styles.musicRays}>
            <View
              style={[
                styles.ray,
                { transform: [{ rotate: '-35deg' }], backgroundColor: '#60A5FA' },
              ]}
            />
            <View
              style={[
                styles.ray,
                { transform: [{ rotate: '-18deg' }], backgroundColor: '#FBBF24' },
              ]}
            />
            <View
              style={[
                styles.ray,
                { transform: [{ rotate: '0deg' }], backgroundColor: '#FFFFFF' },
              ]}
            />
            <View
              style={[
                styles.ray,
                { transform: [{ rotate: '18deg' }], backgroundColor: '#FBBF24' },
              ]}
            />
            <View
              style={[
                styles.ray,
                { transform: [{ rotate: '35deg' }], backgroundColor: '#60A5FA' },
              ]}
            />
          </View>

          <View style={styles.logoOuterRing}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoGlyph}>🎼</Text>
              <View style={styles.standIconMock}>
                <View style={styles.standShelf} />
                <View style={styles.standStem} />
                <View style={styles.standBase} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.brandTitle}>A T R I L</Text>
        <View style={styles.taglineBox}>
          <Text style={styles.taglineText}>FUNDACIÓN VENEZOLANA DEL OBOE</Text>
        </View>

        <Text style={styles.subtitleText}>
          Plataforma de Acreditación y Conexión Musical
        </Text>
        <Text style={styles.descriptionText}>
          Conectamos a maestros venezolanos verificados por Fundaoboe con estudiantes y familias en todo el país.
        </Text>

        <View style={styles.featuresPillsRow}>
          <View style={styles.featurePill}>
            <Text style={styles.featurePillText}>✓ Docentes Acreditados</Text>
          </View>
          <View style={styles.featurePill}>
            <Text style={styles.featurePillText}>✓ Aval Fundaoboe</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.enterButton}
          activeOpacity={0.85}
          onPress={onEnter}
        >
          <Text style={styles.enterButtonText}>
            Continuar al Inicio de Sesión →
          </Text>
        </TouchableOpacity>

        <Text style={styles.versionFooter}>
          ATRIL App Móvil • Fundaoboe Venezuela
        </Text>
      </View>
    </SafeAreaView>
  );
}

const AZUL_REY = '#1D4ED8';
const AZUL_NOCHE = '#0A192F';
const DORADO = '#FBBF24';

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
    paddingHorizontal: 28,
  },
  logoBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  musicRays: {
    position: 'absolute',
    top: -20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    height: 40,
    gap: 12,
  },
  ray: {
    width: 3.5,
    height: 22,
    borderRadius: 2,
    opacity: 0.9,
  },
  logoOuterRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(29, 78, 216, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: AZUL_REY,
    borderWidth: 3.5,
    borderColor: DORADO,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  logoGlyph: {
    fontSize: 44,
    marginBottom: 8,
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
    height: 3.5,
    backgroundColor: DORADO,
    borderRadius: 2,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 7,
    marginBottom: 8,
  },
  taglineBox: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DORADO,
    marginBottom: 18,
  },
  taglineText: {
    color: DORADO,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  subtitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  descriptionText: {
    color: '#93C5FD',
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    maxWidth: 320,
    fontWeight: '500',
  },
  featuresPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  featurePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  featurePillText: {
    color: '#DBEAFE',
    fontSize: 11.5,
    fontWeight: '700',
  },
  enterButton: {
    backgroundColor: DORADO,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 14,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: DORADO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  enterButtonText: {
    color: AZUL_NOCHE,
    fontSize: 15,
    fontWeight: '900',
  },
  versionFooter: {
    marginTop: 24,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
});
