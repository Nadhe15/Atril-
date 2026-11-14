// App.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen, { NuevoDocenteEnRegistro } from './src/screens/LoginScreen';
import TeacherDocumentUploadScreen from './src/screens/TeacherDocumentUploadScreen';
import TeacherAccreditedProfileScreen from './src/screens/TeacherAccreditedProfileScreen';
import StudentTeachersDirectoryScreen from './src/screens/StudentTeachersDirectoryScreen';
import FundaoboeReviewScreen from './src/screens/FundaoboeReviewScreen';
import BottomTabBar, {
  StudentTabKey,
  TeacherTabKey,
} from './src/components/BottomTabBar';
import { DOCENTES_INICIALES_ATRIL } from './src/services/teacherDirectoryService';
import {
  EstadoAcreditacionDocente,
  PerfilDocenteAtril,
  SolicitudContactoDocente,
  Usuario,
} from './src/types/atril.types';

type PantallaActiva =
  | 'SPLASH'
  | 'LOGIN_Y_REGISTRO'
  | 'REGISTRO_DOCENTE_DOCUMENTOS'
  | 'PERFIL_DOCENTE_ACREDITADO'
  | 'DIRECTORIO_DOCENTES_ALUMNO'
  | 'REVISION_FUNDAOBOE';

export default function App() {
  const [pantallaActiva, setPantallaActiva] =
    useState<PantallaActiva>('SPLASH');
  const [usuarioActivo, setUsuarioActivo] = useState<Usuario | null>(null);
  const [docentes, setDocentes] = useState<PerfilDocenteAtril[]>(
    DOCENTES_INICIALES_ATRIL
  );
  const [docenteEnRegistroPaso2, setDocenteEnRegistroPaso2] =
    useState<NuevoDocenteEnRegistro | null>(null);
  const [docenteAcreditadoActivoId, setDocenteAcreditadoActivoId] =
    useState<string>('doc-elena-01');

  // Pestañas inferiores nativas para Alumno y Docente Acreditado
  const [studentTab, setStudentTab] = useState<StudentTabKey>('docentes');
  const [teacherTab, setTeacherTab] = useState<TeacherTabKey>('perfil');

  const [solicitudesContacto, setSolicitudesContacto] = useState<
    SolicitudContactoDocente[]
  >([
    {
      id: 'sol-inicial-1',
      docente_id: 'doc-elena-01',
      nombre_docente: 'Prof. Elena Morales',
      instrumento_seleccionado: 'Oboe Sinfónico',
      nombre_solicitante: 'María Fernanda Gómez',
      beneficiario_alumno: 'Lucas Sanabria (11 años — Representado)',
      mensaje_consulta:
        'Hola profesora Elena, deseamos coordinar clases de iniciación al Oboe para mi hijo Lucas. [Preferencia: Presencial Caracas • MIÉ 03:00 PM]',
      fecha_solicitud: 'Reciente • Presencial Caracas (MIÉ 03:00 PM)',
      estado: 'PENDIENTE_VERIFICACION',
    },
  ]);

  const handleLoginSuccess = (usuario: Usuario) => {
    setUsuarioActivo(usuario);

    if (usuario.rol === 'DOCENTE') {
      if (usuario.estado_acreditacion === 'ACREDITADO') {
        const idDoc =
          usuario.perfil_docente_id ||
          docentes.find((d) => d.acreditado_fundaoboe)?.id ||
          'doc-elena-01';
        setDocenteAcreditadoActivoId(idDoc);
        setTeacherTab('perfil');
        setPantallaActiva('PERFIL_DOCENTE_ACREDITADO');
      } else {
        setDocenteEnRegistroPaso2({
          nombre_completo: usuario.nombre_completo,
          cedula_identidad: usuario.cedula_identidad,
          email: usuario.email,
          telefono: usuario.telefono,
          instrumento_principal: 'Clarinete Sinfónico',
          instrumentos_certificados: ['Clarinete', 'Flauta Transversa'],
          orquesta_o_conservatorio: 'Conservatorio de Música Simón Bolívar',
          anos_experiencia: 6,
          trayectoria_biografia:
            'Músico ejecutante en proceso de acreditación ante Fundaoboe.',
        });
        setPantallaActiva('REGISTRO_DOCENTE_DOCUMENTOS');
      }
      return;
    }

    if (usuario.rol === 'ALUMNO') {
      setStudentTab('docentes');
      setPantallaActiva('DIRECTORIO_DOCENTES_ALUMNO');
      return;
    }

    if (usuario.rol === 'REVISION_FUNDAOBOE') {
      setPantallaActiva('REVISION_FUNDAOBOE');
    }
  };

  const handleStartTeacherDocumentStep = (
    datosIniciales: NuevoDocenteEnRegistro
  ) => {
    setDocenteEnRegistroPaso2(datosIniciales);
    setPantallaActiva('REGISTRO_DOCENTE_DOCUMENTOS');
  };

  const handleSubmitTeacherApplication = (
    nuevoExpediente: PerfilDocenteAtril
  ) => {
    setDocentes((prev) => {
      const sinDuplicado = prev.filter(
        (d) =>
          d.cedula_identidad.toLowerCase() !==
          nuevoExpediente.cedula_identidad.toLowerCase()
      );
      return [nuevoExpediente, ...sinDuplicado];
    });
  };

  const handleDecideTeacherStatus = (
    docenteId: string,
    nuevoEstado: EstadoAcreditacionDocente,
    observacion?: string
  ) => {
    setDocentes((prev) =>
      prev.map((d) => {
        if (d.id !== docenteId) return d;
        return {
          ...d,
          acreditado_fundaoboe: nuevoEstado === 'ACREDITADO',
          estado_acreditacion: nuevoEstado,
          observacion_revisor: observacion,
        };
      })
    );
  };

  const handleUpdateTeacherProfile = (actualizado: PerfilDocenteAtril) => {
    setDocentes((prev) =>
      prev.map((d) => (d.id === actualizado.id ? actualizado : d))
    );
  };

  const handleSendContactRequest = (solicitud: SolicitudContactoDocente) => {
    setSolicitudesContacto((prev) => [solicitud, ...prev]);
  };

  const handleLogout = () => {
    setUsuarioActivo(null);
    setDocenteEnRegistroPaso2(null);
    setPantallaActiva('LOGIN_Y_REGISTRO');
  };

  if (pantallaActiva === 'SPLASH') {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onEnter={() => setPantallaActiva('LOGIN_Y_REGISTRO')} />
      </>
    );
  }

  if (pantallaActiva === 'LOGIN_Y_REGISTRO') {
    return (
      <>
        <StatusBar style="dark" />
        <LoginScreen
          docentesPublicos={docentes}
          onLoginSuccess={handleLoginSuccess}
          onStartTeacherDocumentStep={handleStartTeacherDocumentStep}
          onBackToSplash={() => setPantallaActiva('SPLASH')}
        />
      </>
    );
  }

  const perfilDocenteActivo =
    docentes.find((d) => d.id === docenteAcreditadoActivoId) ||
    docentes.find((d) => d.acreditado_fundaoboe) ||
    docentes[0];

  const consultasDelDocenteActivo = solicitudesContacto.filter(
    (s) => s.docente_id === perfilDocenteActivo.id
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Barra Superior Compacta estilo App v2.0 */}
      <View style={styles.topNavigationBar}>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>
            {pantallaActiva === 'PERFIL_DOCENTE_ACREDITADO'
              ? '🎻 DOCENTE ACREDITADO'
              : pantallaActiva === 'REGISTRO_DOCENTE_DOCUMENTOS'
              ? '📄 REGISTRO DOCENTE · PASO 2'
              : pantallaActiva === 'DIRECTORIO_DOCENTES_ALUMNO'
              ? '🎼 ATRIL · DOCENTES'
              : '🛡️ REVISIÓN FUNDAOBOE'}
          </Text>
        </View>

        <TouchableOpacity style={styles.switchSessionBtn} onPress={handleLogout}>
          <Text style={styles.switchSessionBtnText}>⇄ Cambiar Sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {/* PANTALLA 2 DEL REGISTRO DOCENTE NO ACREDITADO: RECOLECCIÓN DE DOCUMENTOS */}
        {pantallaActiva === 'REGISTRO_DOCENTE_DOCUMENTOS' &&
          docenteEnRegistroPaso2 && (
            <TeacherDocumentUploadScreen
              datosDocente={docenteEnRegistroPaso2}
              onSubmitApplication={handleSubmitTeacherApplication}
              onGoToReviewerConsole={() => {
                setUsuarioActivo({
                  id: 'usr-rev-fundaoboe',
                  email: 'virginia.moreno@fundaoboe.org.ve',
                  rol: 'REVISION_FUNDAOBOE',
                  cedula_identidad: 'V-10.482.119',
                  nombre_completo: 'Coord. Virginia Moreno (Fundaoboe)',
                  telefono: '+58 212-5550100',
                  cargo_fundaoboe:
                    'Comité de Revisión y Acreditación Musical — Fundaoboe',
                });
                setPantallaActiva('REVISION_FUNDAOBOE');
              }}
              onBackToLogin={handleLogout}
            />
          )}

        {/* PANTALLA DEL DOCENTE ACREDITADO: PASA DIRECTO A SU PERFIL */}
        {pantallaActiva === 'PERFIL_DOCENTE_ACREDITADO' && (
          <TeacherAccreditedProfileScreen
            perfilDocente={perfilDocenteActivo}
            solicitudesContacto={solicitudesContacto}
            activeTab={teacherTab}
            onSelectTab={setTeacherTab}
            onUpdateTeacherProfile={handleUpdateTeacherProfile}
            onLogout={handleLogout}
          />
        )}

        {/* PANTALLA DEL ALUMNO: SECCIÓN "DOCENTES", "MIS CONSULTAS" Y "MI PERFIL" */}
        {pantallaActiva === 'DIRECTORIO_DOCENTES_ALUMNO' && (
          <StudentTeachersDirectoryScreen
            usuarioActual={
              usuarioActivo || {
                id: 'usr-alumno-demo',
                email: 'samuel.sanabria@estudiante.ve',
                rol: 'ALUMNO',
                cedula_identidad: 'V-20.105.918',
                nombre_completo: 'Samuel Sanabria',
                telefono: '+58 414-2201928',
                es_mayor_edad: true,
              }
            }
            docentes={docentes}
            solicitudesEnviadas={solicitudesContacto}
            activeTab={studentTab}
            onSelectTab={setStudentTab}
            onSendContactRequest={handleSendContactRequest}
            onUpdateUsuario={setUsuarioActivo}
            onLogout={handleLogout}
          />
        )}

        {/* PANTALLA DEL ENCARGADO DE FUNDAOBOE: REVISIÓN DE DOCUMENTOS Y ACREDITACIÓN */}
        {pantallaActiva === 'REVISION_FUNDAOBOE' && (
          <FundaoboeReviewScreen
            usuarioRevisor={
              usuarioActivo || {
                id: 'usr-rev-fundaoboe',
                email: 'virginia.moreno@fundaoboe.org.ve',
                rol: 'REVISION_FUNDAOBOE',
                cedula_identidad: 'V-10.482.119',
                nombre_completo: 'Coord. Virginia Moreno (Fundaoboe)',
                telefono: '+58 212-5550100',
                cargo_fundaoboe:
                  'Comité de Revisión y Acreditación Musical — Fundaoboe',
              }
            }
            docentes={docentes}
            onDecideTeacherStatus={handleDecideTeacherStatus}
            onOpenAccreditedTeacherPreview={(docente) => {
              setDocenteAcreditadoActivoId(docente.id);
              setTeacherTab('perfil');
              setPantallaActiva('PERFIL_DOCENTE_ACREDITADO');
            }}
            onLogout={handleLogout}
          />
        )}
      </View>

      {/* Barra de Navegación Inferior Nativa (BottomTabBar) */}
      {pantallaActiva === 'DIRECTORIO_DOCENTES_ALUMNO' && (
        <BottomTabBar
          variant="student"
          activeTab={studentTab}
          onSelectTab={setStudentTab}
          consultasCount={solicitudesContacto.length}
        />
      )}

      {pantallaActiva === 'PERFIL_DOCENTE_ACREDITADO' && (
        <BottomTabBar
          variant="teacher"
          activeTab={teacherTab}
          onSelectTab={setTeacherTab}
          consultasCount={consultasDelDocenteActivo.length}
        />
      )}
    </SafeAreaView>
  );
}

const AZUL_REY = '#1D4ED8';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  topNavigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 8,
  },
  rolePill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rolePillText: {
    color: AZUL_REY,
    fontSize: 11,
    fontWeight: '800',
  },
  switchSessionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AZUL_REY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchSessionBtnText: {
    color: AZUL_REY,
    fontSize: 12,
    fontWeight: '800',
  },
});
