// src/components/BottomTabBar.tsx
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import THEME from '../constants/theme';

export type StudentTabKey = 'profesores' | 'chat';
export type TeacherTabKey = 'perfil' | 'chat';

interface TabItem<T extends string> {
  key: T;
  label: string;
  icon: string;
}

const STUDENT_TABS: TabItem<StudentTabKey>[] = [
  { key: 'profesores', label: 'Profesores', icon: '🎼' },
  { key: 'chat', label: 'Mensajes', icon: '💬' },
];

const TEACHER_TABS: TabItem<TeacherTabKey>[] = [
  { key: 'perfil', label: 'Mi Perfil', icon: '🎻' },
  { key: 'chat', label: 'Mensajes', icon: '💬' },
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

export type BottomTabBarProps =
  | StudentBottomTabBarProps
  | TeacherBottomTabBarProps;

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
                activeOpacity={0.78}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                onPress={() => props.onSelectTab(tab.key)}
              >
                <View
                  style={[styles.iconPill, isActive && styles.iconPillActive]}
                >
                  <Text style={styles.iconText}>{tab.icon}</Text>
                </View>
                <Text
                  style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                >
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
              activeOpacity={0.78}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              onPress={() => props.onSelectTab(tab.key)}
            >
              <View
                style={[styles.iconPill, isActive && styles.iconPillActive]}
              >
                <Text style={styles.iconText}>{tab.icon}</Text>
              </View>
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
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

const styles = StyleSheet.create({
  outerSafeWrapper: {
    backgroundColor: THEME.surface,
    borderTopWidth: 1.5,
    borderTopColor: THEME.borderUi,
    paddingBottom:
      Platform.OS === 'android' ? 28 : Platform.OS === 'ios' ? 22 : 10,
    paddingTop: 6,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconPill: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 3,
  },
  iconPillActive: {
    backgroundColor: THEME.surfaceSub,
    borderWidth: 1,
    borderColor: THEME.primary,
  },
  iconText: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.textMuted,
  },
  tabLabelActive: {
    fontWeight: '900',
    color: THEME.primary,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.primary,
    marginTop: 3,
  },
});
