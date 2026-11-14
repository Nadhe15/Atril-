// src/components/BottomTabBar.tsx
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';

export type StudentTabKey = 'docentes' | 'consultas' | 'perfil';
export type TeacherTabKey = 'perfil' | 'consultas' | 'horarios';
export type ReviewerTabKey = 'pendientes' | 'banco' | 'acreditados';

interface TabItem<T extends string> {
  key: T;
  label: string;
  icon: string;
  badgeCount?: number;
}

interface StudentBottomTabBarProps {
  variant: 'student';
  activeTab: StudentTabKey;
  onSelectTab: (tab: StudentTabKey) => void;
  consultasCount?: number;
}

interface TeacherBottomTabBarProps {
  variant: 'teacher';
  activeTab: TeacherTabKey;
  onSelectTab: (tab: TeacherTabKey) => void;
  consultasCount?: number;
}

interface ReviewerBottomTabBarProps {
  variant: 'reviewer';
  activeTab: ReviewerTabKey;
  onSelectTab: (tab: ReviewerTabKey) => void;
  pendientesCount?: number;
}

export type BottomTabBarProps =
  | StudentBottomTabBarProps
  | TeacherBottomTabBarProps
  | ReviewerBottomTabBarProps;

export default function BottomTabBar(props: BottomTabBarProps) {
  let tabs: TabItem<any>[] = [];

  if (props.variant === 'student') {
    tabs = [
      { key: 'docentes', label: 'Docentes', icon: '🎼' },
      {
        key: 'consultas',
        label: 'Mis Consultas',
        icon: '📩',
        badgeCount: props.consultasCount,
      },
      { key: 'perfil', label: 'Mi Perfil', icon: '👤' },
    ];
  } else if (props.variant === 'teacher') {
    tabs = [
      { key: 'perfil', label: 'Mi Perfil', icon: '🎻' },
      {
        key: 'consultas',
        label: 'Consultas',
        icon: '📩',
        badgeCount: props.consultasCount,
      },
      { key: 'horarios', label: 'Horarios', icon: '📅' },
    ];
  } else {
    tabs = [
      {
        key: 'pendientes',
        label: 'Por Revisar',
        icon: '⏳',
        badgeCount: props.pendientesCount,
      },
      { key: 'banco', label: 'Banco Talentos', icon: '🗂️' },
      { key: 'acreditados', label: 'Acreditados', icon: '✓' },
    ];
  }

  return (
    <View style={styles.outerSafeWrapper}>
      <View style={styles.barContainer}>
        {tabs.map((tab) => {
          const isActive = props.activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              activeOpacity={0.75}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              onPress={() => (props.onSelectTab as (k: any) => void)(tab.key)}
            >
              <View style={[styles.iconPill, isActive && styles.iconPillActive]}>
                <Text style={styles.iconText}>{tab.icon}</Text>
                {typeof tab.badgeCount === 'number' && tab.badgeCount > 0 && (
                  <View style={styles.badgeBubble}>
                    <Text style={styles.badgeBubbleText}>{tab.badgeCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const AZUL_REY = '#1D4ED8';
const BLANCO = '#FFFFFF';

const styles = StyleSheet.create({
  outerSafeWrapper: {
    backgroundColor: BLANCO,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 12 : 6,
    paddingTop: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 3,
    position: 'relative',
  },
  iconPillActive: {
    backgroundColor: '#DBEAFE',
  },
  iconText: {
    fontSize: 16,
  },
  badgeBubble: {
    position: 'absolute',
    top: -2,
    right: 2,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBubbleText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabLabelActive: {
    fontWeight: '800',
    color: AZUL_REY,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: AZUL_REY,
    marginTop: 3,
  },
});
