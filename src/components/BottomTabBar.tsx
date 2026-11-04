// src/components/BottomTabBar.tsx
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';

export type StudentTabKey = 'inicio' | 'buscar' | 'mis_clases' | 'billetera' | 'perfil';
export type TeacherTabKey = 'agenda' | 'alumnos' | 'validar' | 'ingresos' | 'docente';

interface TabItem<T extends string> {
  key: T;
  label: string;
  icon: string;
}

const STUDENT_TABS: TabItem<StudentTabKey>[] = [
  { key: 'inicio', label: 'Inicio', icon: '🏠' },
  { key: 'buscar', label: 'Buscar', icon: '🔍' },
  { key: 'mis_clases', label: 'Mis Clases', icon: '🎼' },
  { key: 'billetera', label: 'Billetera', icon: '💳' },
  { key: 'perfil', label: 'Perfil', icon: '👤' },
];

const TEACHER_TABS: TabItem<TeacherTabKey>[] = [
  { key: 'agenda', label: 'Agenda', icon: '📅' },
  { key: 'alumnos', label: 'Alumnos', icon: '🎓' },
  { key: 'validar', label: 'Validar', icon: '🔑' },
  { key: 'ingresos', label: 'Ingresos', icon: '💼' },
  { key: 'docente', label: 'Docente', icon: '🎻' },
];

interface StudentBottomTabBarProps {
  variant: 'student';
  activeTab: StudentTabKey;
  onSelectTab: (tab: StudentTabKey) => void;
}

interface TeacherBottomTabBarProps {
  variant: 'teacher';
  activeTab: TeacherTabKey;
  onSelectTab: (tab: TeacherTabKey) => void;
}

export type BottomTabBarProps = StudentBottomTabBarProps | TeacherBottomTabBarProps;

export default function BottomTabBar(props: BottomTabBarProps) {
  if (props.variant === 'student') {
    return (
      <View style={styles.outerSafeWrapper}>
        <View style={styles.barContainer}>
          {STUDENT_TABS.map((tab) => {
            const isActive = props.activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabButton}
                activeOpacity={0.75}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                onPress={() => props.onSelectTab(tab.key)}
              >
                <View style={[styles.iconPill, isActive && styles.iconPillActive]}>
                  <Text style={styles.iconText}>{tab.icon}</Text>
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

  return (
    <View style={styles.outerSafeWrapper}>
      <View style={styles.barContainer}>
        {TEACHER_TABS.map((tab) => {
          const isActive = props.activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              activeOpacity={0.75}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              onPress={() => props.onSelectTab(tab.key)}
            >
              <View style={[styles.iconPill, isActive && styles.iconPillActive]}>
                <Text style={styles.iconText}>{tab.icon}</Text>
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

const styles = StyleSheet.create({
  outerSafeWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    // Elevación ergonómica para no chocar con la barra de tareas/gestos de Android o iOS
    paddingBottom: Platform.OS === 'android' ? 28 : Platform.OS === 'ios' ? 22 : 10,
    paddingTop: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 3,
  },
  iconPillActive: {
    backgroundColor: '#DBEAFE',
  },
  iconText: {
    fontSize: 16,
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
