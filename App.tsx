// App.tsx
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import RoleSelectionScreen, { SelectedAppRole } from './src/screens/RoleSelectionScreen';
import StudentAuthScreen from './src/screens/StudentAuthScreen';
import StudentHomeScreen from './src/screens/StudentHomeScreen';
import StudentCatalogScreen, { ModoAlumnoVista } from './src/screens/StudentCatalogScreen';
import StudentClassesScreen, { ClaseAgendadaItem } from './src/screens/StudentClassesScreen';
import StudentWalletScreen from './src/screens/StudentWalletScreen';
import StudentProfileScreen from './src/screens/StudentProfileScreen';
import TeacherProfileScheduleScreen, {
  Paso1SeleccionReserva,
} from './src/screens/TeacherProfileScheduleScreen';
import BookingConfirmationScreen from './src/screens/BookingConfirmationScreen';
import BookingSuccessEscrowScreen from './src/screens/BookingSuccessEscrowScreen';
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
  obtenerEnlaceZoomSeguro,
  obtenerResumenBilletera,
} from './src/services/escrowService';
import {
  validarCodigoEIniciarSesion,
  declararClaseImpartida,
  responderEncuestaYConfirmar,
  solicitarReprogramacionContingencia,
} from './src/services/attendanceService';
import {
  DocenteCatalogoItem,
  OpcionContratacionDocente,
  SesionClaseRow,
  SubperfilAlumno,
} from './src/types/atril.types';

const DEMO_TUTOR_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_PROFESOR_ID = '99999999-9999-9999-9999-999999999999';
const DEMO_ZOOM_URL = 'https://zoom.us/j/98451203941';

const ETIQUETA_ESTADO_SESION: Record<string, string> = {
  programada: 'Programada',
  iniciada: 'En Curso (Código Validado)',
  declarada_docente: 'Impartida (Pendiente de confirmar)',
  asistencia_validada: 'Asistencia Validada (Corte Fin de Mes)',
  reprogramada_fuerza_mayor: 'Reprogramada por Contingencia (Luz/Internet)',
  incumplimiento_reportado: 'Incidencia Reportada',
  cancelada: 'Cancelada',
};

const ETIQUETA_ESTADO_ESCROW: Record<string, string> = {
  bloqueado: 'Protegido en Custodia Escrow',
  liberado: 'Acumulado para Corte de Fin de Mes',
  reembolsado: 'Reembolsado al Representante',
  en_disputa: 'En Revisión Fiduciaria',
};

interface ResultadoPaso3Reserva {
  sesion: SesionClaseRow;
  opcion: OpcionContratacionDocente;
  alumno: SubperfilAlumno;
  objetivoSesion: string;
}

export default function App() {
  const [selectedRole, setSelectedRole] = useState<SelectedAppRole | null>(null);
  const [usuarioEstudiante, setUsuarioEstudiante] = useState<PerfilUsuarioAtril | null>(null);
  const [requiereAuthEstudiante, setRequiereAuthEstudiante] = useState<boolean>(false);

  const [studentTab, setStudentTab] = useState<StudentTabKey>('inicio');
  const [teacherTab, setTeacherTab] = useState<TeacherTabKey>('agenda');

  // Máquina de estados del flujo de reserva asistido en 3 pasos
  const [docenteEnReserva, setDocenteEnReserva] = useState<DocenteCatalogoItem | null>(null);
  const [pasoReserva, setPasoReserva] = useState<1 | 2 | 3>(1);
  const [seleccionPaso1, setSeleccionPaso1] = useState<Paso1SeleccionReserva | null>(null);
  const [resultadoPaso3, setResultadoPaso3] = useState<ResultadoPaso3Reserva | null>(null);

  const [sesionActiva, setSesionActiva] = useState<SesionClaseRow | null>(null);
  const [clasesAgendadas, setClasesAgendadas] = useState<ClaseAgendadaItem[]>([]);
  const [estadoSesion, setEstadoSesion] = useState<string>('Sin reservas activas');
  const [estadoEscrow, setEstadoEscrow] = useState<string>('Sin fondos en custodia');
  const [comprobanteReciente, setComprobanteReciente] = useState<string | null>(null);

  // Inputs para validación pre-clase Zoom y contingencia
  const [codigoInputDocente, setCodigoInputDocente] = useState<string>('');
  const [motivoContingencia, setMotivoContingencia] = useState<string>(
    'Interrupción eléctrica / caída de internet en zona residencial'
  );

  // Billetera Docente (Corte a Fin de Mes)
  const [saldoEnCustodiaDocente, setSaldoEnCustodiaDocente] = useState<number>(0);
  const [saldoDisponibleCorteDocente, setSaldoDisponibleCorteDocente] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const sesionGuardada = await getCurrentSessionUser();
      if (sesionGuardada) {
        setUsuarioEstudiante(sesionGuardada);
      }
    })();
  }, []);

  const notificar = (titulo: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${titulo}\n\n${msg}`);
    } else {
      Alert.alert(titulo, msg);
    }
  };

  const handleSelectRoleFromR0 = async (role: SelectedAppRole) => {
    if (role === 'ALUMNO') {
      const sesionActual = usuarioEstudiante ?? (await getCurrentSessionUser());
      if (sesionActual) {
        setUsuarioEstudiante(sesionActual);
        setRequiereAuthEstudiante(false);
        setStudentTab('inicio');
        setSelectedRole('ALUMNO');
      } else {
        setRequiereAuthEstudiante(true);
        setSelectedRole('ALUMNO');
      }
      return;
    }

    setRequiereAuthEstudiante(false);
    setSelectedRole(role);
  };

  const handleCerrarSesionEstudiante = async () => {
    try {
      await signOut();
    } catch {
      // Continuar limpieza local
    }
    setUsuarioEstudiante(null);
    setDocenteEnReserva(null);
    setPasoReserva(1);
    setSeleccionPaso1(null);
    setResultadoPaso3(null);
    setRequiereAuthEstudiante(false);
    setStudentTab('inicio');
    setSelectedRole(null);
  };

  const refrescarBilleteraDocente = async (
    profesorId: string,
    fallbackCustodia?: number,
    fallbackCorte?: number
  ) => {
    try {
      const resumen = await obtenerResumenBilletera(profesorId, 'profesor');
      if (resumen.rol === 'profesor') {
        setSaldoEnCustodiaDocente(resumen.saldo_en_custodia);
        setSaldoDisponibleCorteDocente(resumen.saldo_disponible_corte);
      }
    } catch {
      if (fallbackCustodia !== undefined) setSaldoEnCustodiaDocente(fallbackCustodia);
      if (fallbackCorte !== undefined) setSaldoDisponibleCorteDocente(fallbackCorte);
    }
  };

  // Callback al completar el Paso 2 -> Paso 3 de custodia Escrow
  const handlePaso2SuccessEscrow = async (
    sesion: SesionClaseRow,
    opcion: OpcionContratacionDocente,
    alumno: SubperfilAlumno,
    objetivoSesion: string
  ) => {
    setSesionActiva(sesion);
    setEstadoSesion(ETIQUETA_ESTADO_SESION[sesion.estado_sesion] ?? sesion.estado_sesion);
    setEstadoEscrow(ETIQUETA_ESTADO_ESCROW[sesion.estado_escrow] ?? sesion.estado_escrow);

    const folioCorto = sesion.id.slice(0, 8).toUpperCase();
    setComprobanteReciente(
      `Reserva #${folioCorto} (${alumno.nombre_menor}) • ${opcion.titulo} • Código: ${sesion.codigo_sesion}`
    );

    if (seleccionPaso1) {
      const nuevaClaseItem: ClaseAgendadaItem = {
        sesion,
        nombreDocente: seleccionPaso1.ficha.nombre,
        horarioEtiqueta: seleccionPaso1.bloqueHorario.etiqueta,
        nombreAlumno: alumno.nombre_menor,
        objetivoSesion,
        tituloPlan: opcion.titulo,
      };
      setClasesAgendadas((prev) => [nuevaClaseItem, ...prev]);
    }

    await refrescarBilleteraDocente(
      sesion.profesor_id,
      Number((saldoEnCustodiaDocente + opcion.honorarioNetoDocenteUsd).toFixed(2)),
      saldoDisponibleCorteDocente
    );

    setResultadoPaso3({ sesion, opcion, alumno, objetivoSesion });
    setPasoReserva(3);
  };

  // Validación del código de 6 dígitos por el profesor al iniciar el Zoom
  const handleValidarCodigoDocente = async () => {
    if (!sesionActiva) {
      notificar('Sin sesión activa', 'No hay una sesión programada para iniciar.');
      return;
    }

    try {
      const sesionIniciada = await validarCodigoEIniciarSesion(
        sesionActiva.id,
        sesionActiva.profesor_id || DEMO_PROFESOR_ID,
        codigoInputDocente
      );
      setSesionActiva(sesionIniciada);
      setEstadoSesion(
        ETIQUETA_ESTADO_SESION[sesionIniciada.estado_sesion] ?? sesionIniciada.estado_sesion
      );
      setComprobanteReciente(
        `Código ${sesionIniciada.codigo_sesion} validado • Clase en curso (disputa por inasistencia bloqueada)`
      );

      notificar(
        'Clase Iniciada Formalmente',
        'El código del alumno coincide. Se ha registrado el inicio formal de la sesión y se bloqueó la disputa por inasistencia.'
      );
    } catch (err: any) {
      notificar('Error de validación', err?.message || 'Código incorrecto.');
    }
  };

  // Declaración de clase impartida por el Maestro
  const handleDeclararClaseDocente = async () => {
    if (!sesionActiva) {
      notificar(
        'Sin clases en curso',
        'Actualmente no tienes sesiones iniciadas pendientes por declarar.'
      );
      return;
    }

    try {
      const data = await declararClaseImpartida(
        sesionActiva.id,
        sesionActiva.profesor_id || DEMO_PROFESOR_ID
      );
      setSesionActiva(data);
      setEstadoSesion(ETIQUETA_ESTADO_SESION[data.estado_sesion] ?? data.estado_sesion);
      const folioCorto = data.id.slice(0, 8).toUpperCase();
      setComprobanteReciente(
        `Clase impartida #${folioCorto} • En espera de evaluación del representante`
      );

      notificar(
        'Clase Impartida Registrada',
        `Has registrado la sesión #${folioCorto} como finalizada. Al confirmar el representante, el 85% neto pasará a tu saldo disponible para el corte de fin de mes.`
      );
    } catch (err: any) {
      notificar('No se pudo registrar la clase', err?.message || 'Intenta nuevamente.');
    }
  };

  // Confirmación de asistencia y acumulación para corte de fin de mes
  const handleConfirmarYLiberarEscrow = async () => {
    if (!sesionActiva) {
      notificar('Sin sesiones por confirmar', 'No tienes clases pendientes de confirmación.');
      return;
    }

    try {
      const tutorIdActivo = usuarioEstudiante?.id || DEMO_TUTOR_ID;
      const resultado = await responderEncuestaYConfirmar(sesionActiva.id, tutorIdActivo, 5);
      setSesionActiva(resultado.sesion);
      setEstadoSesion(
        ETIQUETA_ESTADO_SESION[resultado.sesion.estado_sesion] ?? resultado.sesion.estado_sesion
      );
      setEstadoEscrow(
        ETIQUETA_ESTADO_ESCROW[resultado.sesion.estado_escrow] ?? resultado.sesion.estado_escrow
      );

      const honorarioLiberado = resultado.movimientoLiberacion.monto_usd;
      await refrescarBilleteraDocente(
        resultado.sesion.profesor_id,
        Math.max(0, Number((saldoEnCustodiaDocente - honorarioLiberado).toFixed(2))),
        Number((saldoDisponibleCorteDocente + honorarioLiberado).toFixed(2))
      );

      const folioCorto = resultado.sesion.id.slice(0, 8).toUpperCase();
      setComprobanteReciente(
        `Corte actualizado #${folioCorto} • +$${honorarioLiberado.toFixed(2)} USD al corte mensual docente`
      );

      notificar(
        'Asistencia Confirmada',
        `Gracias por evaluar tu clase (★★★★★).\n\nSe acreditaron $${honorarioLiberado.toFixed(2)} USD (85%) al saldo de corte de fin de mes del docente y $${resultado.movimientoComision.monto_usd.toFixed(2)} USD (15%) a FundaOboeHJK.`
      );
    } catch (err: any) {
      notificar('Atención', err?.message || 'No se pudo confirmar la asistencia.');
    }
  };

  // Reprogramación por contingencia eléctrica / internet
  const handleReprogramarContingencia = async () => {
    if (!sesionActiva) {
      notificar('Sin sesión activa', 'Debes tener una sesión reservada para reportar contingencia.');
      return;
    }

    try {
      const actualizada = await solicitarReprogramacionContingencia(
        sesionActiva.id,
        motivoContingencia
      );
      setSesionActiva(actualizada);
      setEstadoSesion(
        ETIQUETA_ESTADO_SESION[actualizada.estado_sesion] ?? actualizada.estado_sesion
      );
      setEstadoEscrow(
        ETIQUETA_ESTADO_ESCROW[actualizada.estado_escrow] ?? actualizada.estado_escrow
      );
      setComprobanteReciente(
        `Contingencia registrada • Fondos congelados en Escrow sin debitar clase`
      );

      notificar(
        'Reprogramación por Fuerza Mayor Activada',
        'Los fondos permanecen protegidos en Escrow sin descontar la clase. La agenda quedó habilitada para reubicar la fecha.'
      );
    } catch (err: any) {
      notificar('No se pudo reprogramar', err?.message || 'Intenta nuevamente.');
    }
  };

  if (!selectedRole) {
    return (
      <>
        <StatusBar style="dark" />
        <RoleSelectionScreen onSelectRole={handleSelectRoleFromR0} />
      </>
    );
  }

  // Si seleccionó ALUMNO pero no tiene sesión iniciada, mostrar StudentAuthScreen
  if (selectedRole === 'ALUMNO' && requiereAuthEstudiante && !usuarioEstudiante) {
    return (
      <>
        <StatusBar style="dark" />
        <StudentAuthScreen
          onBack={() => {
            setRequiereAuthEstudiante(false);
            setSelectedRole(null);
          }}
          onAuthSuccess={(perfil: PerfilUsuarioAtril) => {
            setUsuarioEstudiante(perfil);
            setRequiereAuthEstudiante(false);
            setStudentTab('inicio');
          }}
        />
      </>
    );
  }

  const enlaceZoomVisible = sesionActiva ? obtenerEnlaceZoomSeguro(sesionActiva) : null;
  const tutorIdEfectivo = usuarioEstudiante?.id || DEMO_TUTOR_ID;
  const esApoderado = usuarioEstudiante?.tipo_estudiante === 'apoderado';
  const modoVistaCatalogo: ModoAlumnoVista = esApoderado ? 'A1_REPRESENTANTE' : 'A0_ADULTO';
  const nombreEstudianteMostrar = usuarioEstudiante?.nombre_completo || 'Estudiante ATRIL';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Barra Superior Institucional */}
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {selectedRole === 'ALUMNO'
                ? esApoderado
                  ? 'REPRESENTANTE / APODERADO (A1)'
                  : 'ESTUDIANTE MAYOR DE EDAD (A0)'
                : selectedRole === 'DOCENTE'
                ? 'PORTAL DEL MAESTRO'
                : 'VITRINA PÚBLICA (V0)'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                setDocenteEnReserva(null);
                setPasoReserva(1);
                setSelectedRole(null);
              }}
              style={styles.switchBtn}
            >
              <Text style={styles.switchBtnText}>⇄ Cambiar perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* VISTA ALUMNO / REPRESENTANTE: Flujo Reserva 3 Pasos O las 5 Pantallas de Tabs */}
        {selectedRole === 'ALUMNO' && (
          <>
            {docenteEnReserva ? (
              <>
                {pasoReserva === 1 && (
                  <TeacherProfileScheduleScreen
                    profesorId={docenteEnReserva.profesor_id}
                    tutorId={tutorIdEfectivo}
                    esApoderado={esApoderado}
                    nombreEstudianteAdulto={nombreEstudianteMostrar}
                    onBack={() => {
                      setDocenteEnReserva(null);
                      setPasoReserva(1);
                    }}
                    onContinueToConfirm={(seleccion) => {
                      setSeleccionPaso1(seleccion);
                      setPasoReserva(2);
                    }}
                  />
                )}

                {pasoReserva === 2 && seleccionPaso1 && (
                  <BookingConfirmationScreen
                    seleccionPaso1={seleccionPaso1}
                    tutorId={tutorIdEfectivo}
                    enlaceZoomDefault={DEMO_ZOOM_URL}
                    onBackToSchedule={() => setPasoReserva(1)}
                    onSuccessEscrow={handlePaso2SuccessEscrow}
                  />
                )}

                {pasoReserva === 3 && resultadoPaso3 && seleccionPaso1 && (
                  <BookingSuccessEscrowScreen
                    sesion={resultadoPaso3.sesion}
                    nombreDocente={seleccionPaso1.ficha.nombre}
                    horarioEtiqueta={seleccionPaso1.bloqueHorario.etiqueta}
                    opcionContratada={resultadoPaso3.opcion}
                    alumno={resultadoPaso3.alumno}
                    objetivoSesion={resultadoPaso3.objetivoSesion}
                    onGoToDashboard={() => {
                      setDocenteEnReserva(null);
                      setPasoReserva(1);
                      setSeleccionPaso1(null);
                      setResultadoPaso3(null);
                      setStudentTab('mis_clases');
                    }}
                  />
                )}
              </>
            ) : (
              <>
                {studentTab === 'inicio' && (
                  <StudentHomeScreen
                    nombreUsuario={nombreEstudianteMostrar}
                    esApoderado={esApoderado}
                    sesionActiva={sesionActiva}
                    estadoSesion={estadoSesion}
                    estadoEscrow={estadoEscrow}
                    comprobanteReciente={comprobanteReciente}
                    enlaceZoomVisible={enlaceZoomVisible}
                    onGoToSearch={() => setStudentTab('buscar')}
                    onGoToClasses={() => setStudentTab('mis_clases')}
                    onGoToWallet={() => setStudentTab('billetera')}
                    onConfirmAttendance={handleConfirmarYLiberarEscrow}
                    onReportContingency={handleReprogramarContingencia}
                  />
                )}

                {studentTab === 'buscar' && (
                  <StudentCatalogScreen
                    tutorId={tutorIdEfectivo}
                    initialModoAlumno={modoVistaCatalogo}
                    nombreUsuario={nombreEstudianteMostrar}
                    onSelectTeacher={(docente) => {
                      setDocenteEnReserva(docente);
                      setPasoReserva(1);
                      setSeleccionPaso1(null);
                      setResultadoPaso3(null);
                    }}
                  />
                )}

                {studentTab === 'mis_clases' && (
                  <StudentClassesScreen
                    clasesAgendadas={clasesAgendadas}
                    estadoSesionActual={estadoSesion}
                    estadoEscrowActual={estadoEscrow}
                    onGoToSearch={() => setStudentTab('buscar')}
                    onConfirmAttendance={handleConfirmarYLiberarEscrow}
                    onReportContingency={handleReprogramarContingencia}
                  />
                )}

                {studentTab === 'billetera' && (
                  <StudentWalletScreen
                    nombreUsuario={nombreEstudianteMostrar}
                    sesionActiva={sesionActiva}
                    estadoEscrow={estadoEscrow}
                  />
                )}

                {studentTab === 'perfil' && (
                  <StudentProfileScreen
                    usuario={usuarioEstudiante}
                    tutorId={tutorIdEfectivo}
                    onLogout={handleCerrarSesionEstudiante}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* VISTA DOCENTE / PROFESOR: Billetera Corte Fin de Mes + Inicio con Código */}
        {selectedRole === 'DOCENTE' && (
          <>
            <View style={styles.statusBanner}>
              <Text style={styles.statusBannerTitle}>CUSTODIA FIDUCIARIA ATRIL</Text>
              <Text style={styles.statusLine}>
                • Reserva activa:{' '}
                <Text style={styles.boldWhite}>
                  {sesionActiva ? `#${sesionActiva.id.slice(0, 8).toUpperCase()}` : 'Ninguna'}
                </Text>
              </Text>
              <Text style={styles.statusLine}>
                • Estado académico: <Text style={styles.boldGold}>{estadoSesion}</Text>
              </Text>
              <Text style={styles.statusLine}>
                • Garantía Escrow: <Text style={styles.boldGreen}>{estadoEscrow}</Text>
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Billetera Docente (Liquidación a Fin de Mes)
              </Text>
              <Text style={styles.helperText}>
                Los honorarios netos (85%) de clases validadas con código se acumulan para la transferencia mensual de FundaOboeHJK.
              </Text>

              <View style={styles.walletGrid}>
                <View style={styles.walletCardCustodia}>
                  <Text style={styles.walletLabel}>SALDO EN CUSTODIA</Text>
                  <Text style={styles.walletAmountCustodia}>
                    ${saldoEnCustodiaDocente.toFixed(2)} USD
                  </Text>
                  <Text style={styles.walletNote}>
                    Retenido por clases programadas o reprogramadas pendientes
                  </Text>
                </View>

                <View style={styles.walletCardCorte}>
                  <Text style={styles.walletLabelCorte}>DISPONIBLE CORTE FIN DE MES</Text>
                  <Text style={styles.walletAmountCorte}>
                    ${saldoDisponibleCorteDocente.toFixed(2)} USD
                  </Text>
                  <Text style={styles.walletNote}>
                    Honorarios netos (85%) validados para transferencia mensual
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Protocolo Pre-Clase Zoom y Contingencia</Text>
              <Text style={styles.helperText}>
                Solicita al alumno su código de 6 dígitos al ingresar al Zoom para marcar el inicio formal y bloquear disputas por inasistencia.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ingresa código de 6 dígitos del alumno (ej. A7K9M2)"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                maxLength={6}
                value={codigoInputDocente}
                onChangeText={setCodigoInputDocente}
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleValidarCodigoDocente}>
                <Text style={styles.primaryBtnText}>
                  🔑 Validar Código e Iniciar Sesión Formal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: '#059669' }]}
                onPress={handleDeclararClaseDocente}
              >
                <Text style={styles.primaryBtnText}>🎻 Registrar Clase Impartida</Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Motivo de contingencia (falla eléctrica / internet)"
                placeholderTextColor="#94A3B8"
                value={motivoContingencia}
                onChangeText={setMotivoContingencia}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: '#D97706' }]}
                onPress={handleReprogramarContingencia}
              >
                <Text style={styles.primaryBtnText}>
                  ⚡ Declarar Contingencia (Fuerza Mayor) y Reprogramar
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* VISTA VISITANTE (V0): Vitrina de Cátedras con Contacto e Identidad Bloqueados */}
        {selectedRole === 'VISITANTE' && (
          <StudentCatalogScreen
            isVisitorMode
            onRequestRegister={() => handleSelectRoleFromR0('ALUMNO')}
            onSelectTeacher={() => handleSelectRoleFromR0('ALUMNO')}
          />
        )}
      </ScrollView>

      {/* Barra de Navegación Inferior según Rol Activo */}
      {selectedRole === 'ALUMNO' && (
        <BottomTabBar
          variant="student"
          activeTab={studentTab}
          onSelectTab={(tab) => {
            setDocenteEnReserva(null);
            setPasoReserva(1);
            setStudentTab(tab);
          }}
        />
      )}

      {selectedRole === 'DOCENTE' && (
        <BottomTabBar
          variant="teacher"
          activeTab={teacherTab}
          onSelectTab={(tab) => setTeacherTab(tab)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '800',
  },
  switchBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchBtnText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
  },
  statusBanner: {
    backgroundColor: '#0A192F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statusBannerTitle: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  statusLine: {
    color: '#CBD5E1',
    fontSize: 12.5,
    marginBottom: 4,
  },
  boldWhite: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  boldGold: {
    color: '#FDE68A',
    fontWeight: '800',
  },
  boldGreen: {
    color: '#34D399',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  walletGrid: {
    gap: 12,
  },
  walletCardCustodia: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  walletCardCorte: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  walletLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 4,
  },
  walletLabelCorte: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#047857',
    marginBottom: 4,
  },
  walletAmountCustodia: {
    fontSize: 20,
    fontWeight: '900',
    color: '#92400E',
    marginBottom: 4,
  },
  walletAmountCorte: {
    fontSize: 20,
    fontWeight: '900',
    color: '#065F46',
    marginBottom: 4,
  },
  walletNote: {
    fontSize: 11.5,
    color: '#475569',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
  },
});
