// src/screens/SplashScreen.tsx
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import THEME from '../constants/theme';

export interface SplashScreenProps {
  onEnter: () => void;
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Bloque Central Institucional */}
        <View style={styles.centerBlock}>
          <View style={styles.logoEmblem}>
            <Text style={styles.logoText}>🎼 A T R I L</Text>
          </View>

          <View style={styles.goldBadge}>
            <Text style={styles.goldBadgeText}>FUNDACIÓN VENEZOLANA</Text>
          </View>

          <Text style={styles.tagline}>
            Plataforma de vinculación académica y cátedras musicales verificadas por Fundaoboe.
          </Text>
        </View>

        {/* Acción Principal */}
        <View style={styles.bottomBlock}>
          <TouchableOpacity
            style={styles.enterButton}
            activeOpacity={0.88}
            onPress={onEnter}
          >
            <Text style={styles.enterButtonText}>Ingresar a la Plataforma →</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            FundaOboeHJK — Caracas
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.navy,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.navy,
    paddingHorizontal: 28,
    paddingVertical: 36,
    justifyContent: 'space-between',
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmblem: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: THEME.primary,
    backgroundColor: THEME.primaryHover,
    marginBottom: 20,
  },
  logoText: {
    color: THEME.surface,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
  },
  goldBadge: {
    backgroundColor: THEME.gold,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 18,
  },
  goldBadgeText: {
    color: THEME.navy,
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  tagline: {
    color: THEME.surfaceSub,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 320,
    fontWeight: '500',
  },
  bottomBlock: {
    width: '100%',
    alignItems: 'center',
  },
  enterButton: {
    width: '100%',
    backgroundColor: THEME.primary,
    borderWidth: 1.5,
    borderColor: THEME.gold,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  enterButtonText: {
    color: THEME.surface,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  footerNote: {
    color: THEME.surfaceSub,
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
  },
});
