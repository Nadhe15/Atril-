// App.tsx
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import THEME from './src/constants/theme';
import SplashScreen from './src/screens/SplashScreen';
import AuthLandingScreen from './src/screens/AuthLandingScreen';
import PendingVerificationScreen from './src/screens/PendingVerificationScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import StudentTeachersScreen from './src/screens/StudentTeachersScreen';
import TeacherDetailScreen from './src/screens/TeacherDetailScreen';
import TeacherProfileScreen from './src/screens/TeacherProfileScreen';
import ChatInboxScreen from './src/screens/ChatInboxScreen';
import ChatRoomScreen from './src/screens/ChatRoomScreen';
import BottomTabBar, {
  StudentTabKey,
  TeacherTabKey,
} from './src/components/BottomTabBar';
import {
  getCurrentSessionUser,
  PerfilUsuarioAtril,
  signOut,
} from './src/services/authService';
import {
  normalizarRolV5,
  obtenerUsuarioDeCacheAdmin,
} from './src/services/adminService';
import {
  ConversacionRow,
  DocenteCatalogoItem,
} from './src/types/atril.types';

export default function App() {
  const [mostrarSplash, setMostrarSplash] = useState<boolean>(true);
  const [usuarioActual, setUsuarioActual] =
    useState<PerfilUsuarioAtril | null>(null);

  // Pestañas activas por rol verificado
  const [studentTab, setStudentTab] = useState<StudentTabKey>('profesores');
  const [teacherTab, setTeacherTab] = useState<TeacherTabKey>('perfil');

  // Sub-vistas de detalle de profesor y sala de chat
  const [profesorSeleccionado, setProfesorSeleccionado] =
    useState<DocenteCatalogoItem | null>(null);
  const [conversacionActiva, setConversacionActiva] =
    useState<ConversacionRow | null>(null);

  useEffect(() => {
    (async () => {
      const sesionGuardada = await getCurrentSessionUser();
      if (sesionGuardada) {
        setUsuarioActual(sesionGuardada);
      }
    })();
  }, []);

  const handleIngresoExitoso = (perfil: PerfilUsuarioAtril) => {
    const rolNorm = perfil.rol_v5 ?? normalizarRolV5(perfil.rol);
    const enCache = obtenerUsuarioDeCacheAdmin(perfil.id);
    const perfilSincronizado: PerfilUsuarioAtril = {
      ...perfil,
      rol_v5: rolNorm,
      estado_verificacion:
        perfil.estado_verificacion ?? enCache?.estado_verificacion,
    };

    setUsuarioActual(perfilSincronizado);
    setProfesorSeleccionado(null);
    setConversacionActiva(null);
    setStudentTab('profesores');
    setTeacherTab('perfil');
  };

  const handleCerrarSesion = async () => {
    try {
      await signOut();
    } catch {
      // Continuar limpieza local si era sesión de prueba demo
    }
    setUsuarioActual(null);
    setProfesorSeleccionado(null);
    setConversacionActiva(null);
    setStudentTab('profesores');
    setTeacherTab('perfil');
  };

  // 1. Pantalla Inicial: SplashScreen
  if (mostrarSplash) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onEnter={() => setMostrarSplash(false)} />
      </>
    );
  }

  // 2. Sin sesión activa -> AuthLandingScreen
  if (!usuarioActual) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthLandingScreen
          onAuthSuccess={handleIngresoExitoso}
          onPendingVerification={handleIngresoExitoso}
          onBackToSplash={() => setMostrarSplash(true)}
        />
      </>
    );
  }

  const rolActivo = usuarioActual.rol_v5 ?? normalizarRolV5(usuarioActual.rol);

  // 3. Con sesión y estado_verificacion !== 'verificado' (y no es admin) -> PendingVerificationScreen
  if (
    rolActivo !== 'admin' &&
    usuarioActual.estado_verificacion !== 'verificado'
  ) {
    return (
      <>
        <StatusBar style="dark" />
        <PendingVerificationScreen
          usuario={usuarioActual}
          onStatusUpdated={(actualizado) => setUsuarioActual(actualizado)}
          onLogout={handleCerrarSesion}
        />
      </>
    );
  }

  // 4. Rol 'admin' -> AdminDashboardScreen
  if (rolActivo === 'admin') {
    return (
      <>
        <StatusBar style="dark" />
        <AdminDashboardScreen
          adminUser={usuarioActual}
          onLogout={handleCerrarSesion}
        />
      </>
    );
  }

  // 5 y 6. Rol 'estudiante' verificado o 'docente' verificado
  const esDocente = rolActivo === 'docente';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Barra Superior Institucional para Usuario Verificado */}
      <View style={styles.topHeaderBar}>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {esDocente
              ? '🎻 PROFESOR VERIFICADO'
              : '🎓 ESTUDIANTE VERIFICADO'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.85}
          onPress={handleCerrarSesion}
        >
          <Text style={styles.logoutBtnText}>⇄ Cambiar cuenta / Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Si hay una sala de chat abierta, se renderiza directo con KeyboardAvoidingView + FlatList */}
      {conversacionActiva ? (
        <View style={styles.chatRoomWrapper}>
          <ChatRoomScreen
            conversacion={conversacionActiva}
            usuarioActual={usuarioActual}
            onBack={() => setConversacionActiva(null)}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 5. Rol 'estudiante' verificado */}
          {!esDocente && (
            <>
              {studentTab === 'profesores' && (
                <>
                  {profesorSeleccionado ? (
                    <TeacherDetailScreen
                      docente={profesorSeleccionado}
                      alumnoId={usuarioActual.id}
                      nombreAlumno={usuarioActual.nombre_completo}
                      onBack={() => setProfesorSeleccionado(null)}
                      onOpenChatRoom={(conv) => {
                        setProfesorSeleccionado(null);
                        setStudentTab('chat');
                        setConversacionActiva(conv);
                      }}
                    />
                  ) : (
                    <StudentTeachersScreen
                      nombreEstudiante={usuarioActual.nombre_completo}
                      onSelectTeacher={(docente) =>
                        setProfesorSeleccionado(docente)
                      }
                    />
                  )}
                </>
              )}

              {studentTab === 'chat' && (
                <ChatInboxScreen
                  usuario={usuarioActual}
                  onOpenConversation={(conv) => setConversacionActiva(conv)}
                  onExploreTeachers={() => {
                    setProfesorSeleccionado(null);
                    setStudentTab('profesores');
                  }}
                />
              )}
            </>
          )}

          {/* 6. Rol 'docente' verificado */}
          {esDocente && (
            <>
              {teacherTab === 'perfil' && (
                <TeacherProfileScreen
                  usuario={usuarioActual}
                  onGoToChats={() => setTeacherTab('chat')}
                  onLogout={handleCerrarSesion}
                />
              )}

              {teacherTab === 'chat' && (
                <ChatInboxScreen
                  usuario={usuarioActual}
                  onOpenConversation={(conv) => setConversacionActiva(conv)}
                />
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Barra de Navegación Inferior v5.0 */}
      {!esDocente ? (
        <BottomTabBar
          variant="student"
          activeTab={studentTab}
          onSelectTab={(tab) => {
            setConversacionActiva(null);
            setProfesorSeleccionado(null);
            setStudentTab(tab);
          }}
        />
      ) : (
        <BottomTabBar
          variant="teacher"
          activeTab={teacherTab}
          onSelectTab={(tab) => {
            setConversacionActiva(null);
            setTeacherTab(tab);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: THEME.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: THEME.borderUi,
    flexWrap: 'wrap',
    gap: 8,
  },
  roleBadge: {
    backgroundColor: THEME.surfaceSub,
    borderWidth: 1,
    borderColor: THEME.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  roleBadgeText: {
    color: THEME.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  logoutBtn: {
    backgroundColor: THEME.surface,
    borderWidth: 1.5,
    borderColor: THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: THEME.primary,
    fontSize: 11.5,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 28,
  },
  chatRoomWrapper: {
    flex: 1,
    padding: 16,
  },
});
