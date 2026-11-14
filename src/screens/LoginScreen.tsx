// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import SupabaseStatusBadge from '../components/SupabaseStatusBadge';
import {
  PerfilDocenteAtril,
  RepresentadoMenor,
  RolAtril,
  Usuario,
} from '../types/atril.types';

export interface NuevoDocenteEnRegistro {
  nombre_completo: string;
  cedula_identidad: string;
  email: string;
  telefono: string;
  instrumento_principal: string;
  instrumentos_certificados: string[];
  orquesta_o_conservatorio: string;
  anos_experiencia: number;
  trayectoria_biografia: string;
}

interface LoginScreenProps {
  docentesPublicos: PerfilDocenteAtril[];
  onLoginSuccess: (usuario: Usuario) => void;
  onStartTeacherDocumentStep: (datosIniciales: NuevoDocenteEnRegistro) => void;
  onBackToSplash?: () => void;
}

type ModoAcceso = 'INICIAR_SESION' | 'REGISTRARSE';
type SeccionSuperior = 'ACCESO' | 'QUIENES_SOMOS' | 'VISTA_PUBLICA';

export default function LoginScreen({
  docentesPublicos,
  onLoginSuccess,
  onStartTeacherDocumentStep,
  onBackToSplash,
}: LoginScreenProps) {
  const [seccionSuperior, setSeccionSuperior] = useState<SeccionSuperior>('ACCESO');
  const [modoAcceso, setModoAcceso] = useState<ModoAcceso>('INICIAR_SESION');
  const [rolRegistro, setRolRegistro] = useState<RolAtril>('DOCENTE');

  // Campos Iniciar Sesión
  const [loginEmail, setLoginEmail] = useState<string>('elena.morales@fundaoboe.org.ve');
  const [loginPassword, setLoginPassword] = useState<string>('••••••••');
  const [loginRolDemo, setLoginRolDemo] = useState<
    | 'DOCENTE_ACREDITADO'
    | 'DOCENTE_SIN_ACREDITAR'
    | 'ALUMNO'
    | 'REPRESENTANTE'
    | 'REVISION_FUNDAOBOE'
  >('DOCENTE_ACREDITADO');
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Campos Comunes de Registro
  const [regNombre, setRegNombre] = useState<string>('');
  const [regCedula, setRegCedula] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regTelefono, setRegTelefono] = useState<string>('');

  // Campos Registro Docente (Paso 1 -> pasa a Paso 2 de Recolección de Documentos)
  const [docInstrumentoPrincipal, setDocInstrumentoPrincipal] =
    useState<string>('Oboe Sinfónico');
  const [docOtrosInstrumentos, setDocOtrosInstrumentos] = useState<string>(
    'Corno Inglés, Lenguaje Musical y Solfeo'
  );
  const [docOrquestaConservatorio, setDocOrquestaConservatorio] = useState<string>(
    'Conservatorio de Música Simón Bolívar / Orquesta Sinfónica'
  );
  const [docAnosExp, setDocAnosExp] = useState<string>('8');
  const [docBiografia, setDocBiografia] = useState<string>(
    'Músico ejecutante y pedagogo formado en conservatorio y práctica orquestal.'
  );

  // Campos Registro Alumno / Estudiante (Mayor de 18 vs Menor con Representante)
  const [esMayorDe18, setEsMayorDe18] = useState<boolean>(true);
  const [instrumentoAlumnoAdulto, setInstrumentoAlumnoAdulto] =
    useState<string>('Guitarra Clásica');
  const [representados, setRepresentados] = useState<RepresentadoMenor[]>([
    {
      id: 'rep-1',
      nombre_completo: 'Lucas Sanabria',
      edad: 11,
      filiacion: 'Padre / Madre',
      instrumento_interes: 'Oboe Sinfónico',
    },
  ]);

  // Campos Registro Revisión (Encargado de Fundaoboe)
  const [cargoFundaoboe, setCargoFundaoboe] = useState<string>(
    'Coordinador de Revisión y Acreditación Docente — Fundaoboe'
  );

  const seleccionarPerfilDemoLogin = (
    tipo:
      | 'DOCENTE_ACREDITADO'
      | 'DOCENTE_SIN_ACREDITAR'
      | 'ALUMNO'
      | 'REPRESENTANTE'
      | 'REVISION_FUNDAOBOE'
  ) => {
    setLoginRolDemo(tipo);
    setMensajeError(null);
    if (tipo === 'DOCENTE_ACREDITADO') {
      setLoginEmail('elena.morales@fundaoboe.org.ve');
    } else if (tipo === 'DOCENTE_SIN_ACREDITAR') {
      setLoginEmail('pedro.ramirez@musica.ve');
    } else if (tipo === 'ALUMNO') {
      setLoginEmail('samuel.sanabria@estudiante.ve');
    } else if (tipo === 'REPRESENTANTE') {
      setLoginEmail('maria.gomez@representante.ve');
    } else {
      setLoginEmail('virginia.moreno@fundaoboe.org.ve');
    }
  };

  const handleIniciarSesion = () => {
    setMensajeError(null);
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setMensajeError(
        'Por favor ingresa tu correo electrónico y tu contraseña para iniciar sesión.'
      );
      return;
    }

    const correo = loginEmail.trim().toLowerCase();

    if (
      loginRolDemo === 'DOCENTE_SIN_ACREDITAR' ||
      correo.includes('pedro') ||
      correo.includes('postulante')
    ) {
      onStartTeacherDocumentStep({
        nombre_completo: 'Pedro Ramírez',
        cedula_identidad: 'V-24.819.302',
        email: correo,
        telefono: '+58 412-7748291',
        instrumento_principal: 'Clarinete Sinfónico',
        instrumentos_certificados: [
          'Clarinete en Si bemol',
          'Flauta Transversa',
          'Teoría y Solfeo',
        ],
        orquesta_o_conservatorio:
          'Orquesta Juvenil de Caracas • Conservatorio Vicente Emilio Sojo',
        anos_experiencia: 6,
        trayectoria_biografia:
          'Clarinetista y flautista egresado del Conservatorio Vicente Emilio Sojo.',
      });
      return;
    }

    if (
      loginRolDemo === 'DOCENTE_ACREDITADO' ||
      correo.includes('elena') ||
      correo.includes('carlos') ||
      correo.includes('docente')
    ) {
      const docenteEncontrado =
        docentesPublicos.find(
          (d) => d.email.toLowerCase() === correo && d.acreditado_fundaoboe
        ) || docentesPublicos[0];

      onLoginSuccess({
        id: docenteEncontrado?.user_id || 'usr-doc-elena',
        email: docenteEncontrado?.email || correo,
        rol: 'DOCENTE',
        cedula_identidad: docenteEncontrado?.cedula_identidad || 'V-16.482.910',
        nombre_completo: docenteEncontrado?.nombre_completo || 'Prof. Elena Morales',
        telefono: docenteEncontrado?.telefono || '+58 412-5551020',
        perfil_docente_id: docenteEncontrado?.id || 'doc-elena-01',
        estado_acreditacion: 'ACREDITADO',
      });
      return;
    }

    if (
      loginRolDemo === 'REVISION_FUNDAOBOE' ||
      correo.includes('virginia') ||
      correo.includes('moderador') ||
      correo.includes('revision')
    ) {
      onLoginSuccess({
        id: 'usr-rev-fundaoboe',
        email: correo,
        rol: 'REVISION_FUNDAOBOE',
        cedula_identidad: 'V-10.482.119',
        nombre_completo: 'Coord. Virginia Moreno (Fundaoboe)',
        telefono: '+58 212-5550100',
        cargo_fundaoboe: 'Comité de Revisión y Acreditación Musical — Fundaoboe',
      });
      return;
    }

    if (
      loginRolDemo === 'REPRESENTANTE' ||
      correo.includes('representante') ||
      correo.includes('maria')
    ) {
      onLoginSuccess({
        id: '00000000-0000-0000-0000-000000000001',
        email: correo,
        rol: 'ALUMNO',
        cedula_identidad: 'V-15.420.118',
        nombre_completo: 'María Fernanda Gómez',
        telefono: '+58 414-3091122',
        es_mayor_edad: false,
        instrumento_interes: 'Oboe Sinfónico',
        representados: [
          {
            id: 'rep-1',
            nombre_completo: 'Lucas Sanabria',
            edad: 11,
            filiacion: 'Padre / Madre',
            instrumento_interes: 'Oboe Sinfónico',
          },
          {
            id: 'rep-2',
            nombre_completo: 'Sofía Sanabria',
            edad: 14,
            filiacion: 'Padre / Madre',
            instrumento_interes: 'Fagot',
          },
        ],
      });
      return;
    }

    // Por defecto o si selecciona ALUMNO ADULTO (+18)
    onLoginSuccess({
      id: 'usr-alumno-samuel',
      email: correo,
      rol: 'ALUMNO',
      cedula_identidad: 'V-20.105.918',
      nombre_completo: 'Samuel Sanabria',
      telefono: '+58 414-2201928',
      es_mayor_edad: true,
      instrumento_interes: 'Oboe Sinfónico',
      representados: [],
    });
  };

  const agregarRepresentado = () => {
    setRepresentados((prev) => [
      ...prev,
      {
        id: `rep-${Date.now()}`,
        nombre_completo: '',
        edad: 10,
        filiacion: 'Padre / Madre',
        instrumento_interes: 'Guitarra Clásica',
      },
    ]);
  };

  const actualizarRepresentado = (
    idx: number,
    campo: keyof RepresentadoMenor,
    valor: string | number
  ) => {
    setRepresentados((prev) => {
      const copia = [...prev];
      copia[idx] = { ...copia[idx], [campo]: valor };
      return copia;
    });
  };

  const eliminarRepresentado = (idx: number) => {
    if (representados.length <= 1) return;
    setRepresentados((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleContinuarRegistro = () => {
    setMensajeError(null);

    if (!regNombre.trim() || !regCedula.trim() || !regEmail.trim() || !regPassword.trim()) {
      setMensajeError(
        'Completa tu nombre completo, cédula de identidad, correo electrónico y contraseña.'
      );
      return;
    }

    if (rolRegistro === 'DOCENTE') {
      if (!docInstrumentoPrincipal.trim()) {
        setMensajeError('Indica el instrumento principal que ejecutas y enseñas.');
        return;
      }

      const listaInstrumentos = Array.from(
        new Set(
          [
            docInstrumentoPrincipal.trim(),
            ...docOtrosInstrumentos
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          ].filter(Boolean)
        )
      );

      // Pasa a la Segunda Pantalla del Registro Docente: Recolección de Documentos (Cédula, Foto, CV y Certificaciones)
      onStartTeacherDocumentStep({
        nombre_completo: regNombre.trim(),
        cedula_identidad: regCedula.trim(),
        email: regEmail.trim().toLowerCase(),
        telefono: regTelefono.trim() || '+58 412-0000000',
        instrumento_principal: docInstrumentoPrincipal.trim(),
        instrumentos_certificados: listaInstrumentos,
        orquesta_o_conservatorio:
          docOrquestaConservatorio.trim() ||
          'Conservatorio / Orquesta Sinfónica en verificación',
        anos_experiencia: Math.max(1, parseInt(docAnosExp, 10) || 5),
        trayectoria_biografia:
          docBiografia.trim() ||
          'Músico en proceso de acreditación ante Fundaoboe.',
      });
      return;
    }

    if (rolRegistro === 'ALUMNO') {
      if (!esMayorDe18) {
        for (let i = 0; i < representados.length; i++) {
          const rep = representados[i];
          if (!rep.nombre_completo.trim()) {
            setMensajeError(
              `Ingresa el nombre y apellido del representado menor #${i + 1}.`
            );
            return;
          }
          if (rep.edad < 4 || rep.edad > 17) {
            setMensajeError(
              `La edad del representado #${i + 1} debe estar entre 4 y 17 años.`
            );
            return;
          }
        }
      }

      onLoginSuccess({
        id: `usr-alumno-${Date.now()}`,
        email: regEmail.trim().toLowerCase(),
        rol: 'ALUMNO',
        cedula_identidad: regCedula.trim(),
        nombre_completo: regNombre.trim(),
        telefono: regTelefono.trim() || '+58 414-0000000',
        es_mayor_edad: esMayorDe18,
        instrumento_interes: esMayorDe18
          ? instrumentoAlumnoAdulto.trim()
          : representados[0]?.instrumento_interes || 'Oboe Sinfónico',
        representados: esMayorDe18 ? [] : representados,
      });
      return;
    }

    // rolRegistro === 'REVISION_FUNDAOBOE'
    onLoginSuccess({
      id: `usr-rev-${Date.now()}`,
      email: regEmail.trim().toLowerCase(),
      rol: 'REVISION_FUNDAOBOE',
      cedula_identidad: regCedula.trim(),
      nombre_completo: regNombre.trim(),
      telefono: regTelefono.trim() || '+58 212-5550100',
      cargo_fundaoboe:
        cargoFundaoboe.trim() ||
        'Encargado de Revisión de Documentos — Fundaoboe',
    });
  };

  const docentesAcreditados = docentesPublicos.filter((d) => d.acreditado_fundaoboe);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera Institucional Fundaoboe & ATRIL */}
        <View style={styles.brandBanner}>
          <View style={styles.brandTopRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onBackToSplash}
              style={styles.logoCircle}
            >
              <Text style={styles.logoEmoji}>🎼</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandName}>ATRIL · FUNDAOBOE</Text>
              <Text style={styles.brandTagline}>
                Red Venezolana de Docentes Musicales Acreditados
              </Text>
            </View>
          </View>

          {/* Barra de navegación institucional (Inicio / Quiénes Somos / Vista Pública) */}
          <View style={styles.instNavRow}>
            <TouchableOpacity
              style={[
                styles.instNavBtn,
                seccionSuperior === 'ACCESO' && styles.instNavBtnActive,
              ]}
              onPress={() => setSeccionSuperior('ACCESO')}
            >
              <Text
                style={[
                  styles.instNavText,
                  seccionSuperior === 'ACCESO' && styles.instNavTextActive,
                ]}
              >
                🔐 Inicio de Sesión
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.instNavBtn,
                seccionSuperior === 'QUIENES_SOMOS' && styles.instNavBtnActive,
              ]}
              onPress={() => setSeccionSuperior('QUIENES_SOMOS')}
            >
              <Text
                style={[
                  styles.instNavText,
                  seccionSuperior === 'QUIENES_SOMOS' && styles.instNavTextActive,
                ]}
              >
                🏛️ Quiénes Somos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.instNavBtn,
                seccionSuperior === 'VISTA_PUBLICA' && styles.instNavBtnActive,
              ]}
              onPress={() => setSeccionSuperior('VISTA_PUBLICA')}
            >
              <Text
                style={[
                  styles.instNavText,
                  seccionSuperior === 'VISTA_PUBLICA' && styles.instNavTextActive,
                ]}
              >
                🎼 Docentes (Vista Pública)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECCIÓN INSTITUCIONAL: QUIÉNES SOMOS (Sin el recuadro de los 3 roles) */}
        {seccionSuperior === 'QUIENES_SOMOS' && (
          <View style={styles.card}>
            <Text style={styles.cardKicker}>FUNDACIÓN VENEZOLANA DEL OBOE (FUNDAOBOE)</Text>
            <Text style={styles.cardTitle}>¿Qué es ATRIL y Quiénes Somos?</Text>
            <Text style={styles.cardParagraph}>
              La Fundación Venezolana del Oboe (Fundaoboe) impulsa el desarrollo académico y artístico de músicos y docentes en Venezuela.
            </Text>
            <Text style={styles.cardParagraph}>
              ATRIL es la plataforma oficial tutelada por Fundaoboe diseñada para conectar la oferta de maestros venezolanos debidamente verificados y acreditados con estudiantes y familias que buscan formación musical en su instrumento de interés.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setSeccionSuperior('ACCESO')}
            >
              <Text style={styles.primaryButtonText}>
                Ir a Iniciar Sesión o Registrarse →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SECCIÓN PÚBLICA LIMITADA (Visitante sin sesión: solo ve nombre e instrumento) */}
        {seccionSuperior === 'VISTA_PUBLICA' && (
          <View style={styles.card}>
            <Text style={styles.cardKicker}>CONSULTA EXTERNA LIMITADA</Text>
            <Text style={styles.cardTitle}>Docentes Acreditados en Fundaoboe</Text>
            <Text style={styles.cardParagraph}>
              Sin iniciar sesión solo puedes consultar el nombre del maestro y su instrumento principal. Para ver sus certificaciones, trayectoria completa y contactarlo, inicia sesión o regístrate como Alumno.
            </Text>

            {docentesAcreditados.map((doc) => (
              <View key={doc.id} style={styles.publicTeacherRow}>
                <View style={styles.publicTeacherIcon}>
                  <Text style={{ fontSize: 16 }}>🎵</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.publicTeacherName}>{doc.nombre_completo}</Text>
                  <Text style={styles.publicTeacherInst}>
                    Instrumento: {doc.instrumento_principal}
                  </Text>
                </View>
                <View style={styles.lockedTag}>
                  <Text style={styles.lockedTagText}>🔒 Solo miembros</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 12 }]}
              onPress={() => {
                setSeccionSuperior('ACCESO');
                setModoAcceso('REGISTRARSE');
                setRolRegistro('ALUMNO');
              }}
            >
              <Text style={styles.primaryButtonText}>
                Registrarme como Alumno para ver perfiles completos →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SECCIÓN PRINCIPAL: INICIAR SESIÓN O REGISTRARSE */}
        {seccionSuperior === 'ACCESO' && (
          <>
            {/* Conmutador Principal: Iniciar Sesión vs Registrarse */}
            <View style={styles.modeSwitchContainer}>
              <TouchableOpacity
                style={[
                  styles.modeSwitchBtn,
                  modoAcceso === 'INICIAR_SESION' && styles.modeSwitchBtnActive,
                ]}
                onPress={() => {
                  setModoAcceso('INICIAR_SESION');
                  setMensajeError(null);
                }}
              >
                <Text
                  style={[
                    styles.modeSwitchText,
                    modoAcceso === 'INICIAR_SESION' && styles.modeSwitchTextActive,
                  ]}
                >
                  Iniciar Sesión
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeSwitchBtn,
                  modoAcceso === 'REGISTRARSE' && styles.modeSwitchBtnActive,
                ]}
                onPress={() => {
                  setModoAcceso('REGISTRARSE');
                  setMensajeError(null);
                }}
              >
                <Text
                  style={[
                    styles.modeSwitchText,
                    modoAcceso === 'REGISTRARSE' && styles.modeSwitchTextActive,
                  ]}
                >
                  Registrarse (Nuevo Usuario)
                </Text>
              </TouchableOpacity>
            </View>

            {mensajeError && (
              <View style={styles.errorAlert}>
                <Text style={styles.errorAlertText}>⚠️ {mensajeError}</Text>
              </View>
            )}

            {/* ==================== MODO 1: INICIAR SESIÓN ==================== */}
            {modoAcceso === 'INICIAR_SESION' && (
              <View style={styles.card}>
                <Text style={styles.cardKicker}>ACCESO DE USUARIOS REGISTRADOS</Text>
                <Text style={styles.cardTitle}>Iniciar Sesión en ATRIL</Text>
                <Text style={styles.cardParagraph}>
                  Ingresa tus credenciales. Según tu perfil accederás directamente a tu vista correspondiente:
                </Text>

                {/* Selector rápido de perfil para demostrar cada caso en vivo */}
                <Text style={styles.fieldLabel}>
                  Selecciona con qué perfil deseas probar el inicio de sesión:
                </Text>

                <View style={styles.demoRolesGrid}>
                  <TouchableOpacity
                    style={[
                      styles.demoRoleCard,
                      loginRolDemo === 'DOCENTE_ACREDITADO' &&
                        styles.demoRoleCardActive,
                    ]}
                    onPress={() => seleccionarPerfilDemoLogin('DOCENTE_ACREDITADO')}
                  >
                    <Text style={styles.demoRoleTitle}>
                      🎻 Docente Acreditado
                    </Text>
                    <Text style={styles.demoRoleSub}>
                      Pasa directo a su Perfil de Profesor Verificado
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.demoRoleCard,
                      loginRolDemo === 'ALUMNO' && styles.demoRoleCardActive,
                    ]}
                    onPress={() => seleccionarPerfilDemoLogin('ALUMNO')}
                  >
                    <Text style={styles.demoRoleTitle}>
                      🎓 Alumno / Estudiante (+18)
                    </Text>
                    <Text style={styles.demoRoleSub}>
                      Pasa a la sección de Docentes por instrumento
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.demoRoleCard,
                      loginRolDemo === 'REPRESENTANTE' && styles.demoRoleCardActive,
                    ]}
                    onPress={() => seleccionarPerfilDemoLogin('REPRESENTANTE')}
                  >
                    <Text style={styles.demoRoleTitle}>
                      👨‍👧 Padre / Representante (Menores)
                    </Text>
                    <Text style={styles.demoRoleSub}>
                      Pasa a Docentes con gestión de hijos representados
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.demoRoleCard,
                      loginRolDemo === 'REVISION_FUNDAOBOE' &&
                        styles.demoRoleCardActive,
                    ]}
                    onPress={() => seleccionarPerfilDemoLogin('REVISION_FUNDAOBOE')}
                  >
                    <Text style={styles.demoRoleTitle}>
                      🛡️ Revisión Fundaoboe
                    </Text>
                    <Text style={styles.demoRoleSub}>
                      Encargado que revisa documentos y acredita docentes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.demoRoleCard,
                      loginRolDemo === 'DOCENTE_SIN_ACREDITAR' &&
                        styles.demoRoleCardActive,
                    ]}
                    onPress={() =>
                      seleccionarPerfilDemoLogin('DOCENTE_SIN_ACREDITAR')
                    }
                  >
                    <Text style={styles.demoRoleTitle}>
                      📄 Docente No Acreditado
                    </Text>
                    <Text style={styles.demoRoleSub}>
                      Pasa a la 2da pantalla de carga de documentos
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Correo Electrónico *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    placeholder="ejemplo@fundaoboe.org.ve"
                    placeholderTextColor="#64748B"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Contraseña *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    placeholder="Ingresa tu contraseña"
                    placeholderTextColor="#64748B"
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleIniciarSesion}
                >
                  <Text style={styles.primaryButtonText}>
                    Iniciar Sesión Ahora →
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryOutlineButton}
                  onPress={() => {
                    setModoAcceso('REGISTRARSE');
                    setMensajeError(null);
                  }}
                >
                  <Text style={styles.secondaryOutlineButtonText}>
                    ¿No tienes cuenta previa? Regístrate aquí
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ==================== MODO 2: REGISTRARSE (3 OPCIONES DE ROL) ==================== */}
            {modoAcceso === 'REGISTRARSE' && (
              <View style={styles.card}>
                <Text style={styles.cardKicker}>NUEVO REGISTRO EN ATRIL</Text>
                <Text style={styles.cardTitle}>
                  1. Elige tu tipo de cuenta para registrarte
                </Text>
                <Text style={styles.cardParagraph}>
                  Selecciona una de las tres opciones según tu función dentro de Fundaoboe:
                </Text>

                {/* LAS 3 OPCIONES DE REGISTRO SOLICITADAS */}
                <View style={styles.roleOptionsStack}>
                  {/* Opción 1: Docente */}
                  <TouchableOpacity
                    style={[
                      styles.roleOptionButton,
                      rolRegistro === 'DOCENTE' && styles.roleOptionButtonActive,
                    ]}
                    onPress={() => {
                      setRolRegistro('DOCENTE');
                      setMensajeError(null);
                    }}
                  >
                    <View style={styles.roleOptionHeader}>
                      <Text style={styles.roleOptionBadge}>OPCIÓN 1 · DOCENTE</Text>
                      {rolRegistro === 'DOCENTE' && (
                        <Text style={styles.roleOptionSelectedMark}>✓ Seleccionado</Text>
                      )}
                    </View>
                    <Text style={styles.roleOptionTitle}>
                      🎻 Registro para Docente / Profesor
                    </Text>
                    <Text style={styles.roleOptionDesc}>
                      En 2 pasos: registra tus datos musicales y pasa a la recolección de documentos (Cédula, Foto, CV y Certificaciones Musicales/Sinfónicas) para acreditación.
                    </Text>
                  </TouchableOpacity>

                  {/* Opción 2: Alumno o Estudiante */}
                  <TouchableOpacity
                    style={[
                      styles.roleOptionButton,
                      rolRegistro === 'ALUMNO' && styles.roleOptionButtonActive,
                    ]}
                    onPress={() => {
                      setRolRegistro('ALUMNO');
                      setMensajeError(null);
                    }}
                  >
                    <View style={styles.roleOptionHeader}>
                      <Text style={styles.roleOptionBadge}>
                        OPCIÓN 2 · ALUMNO O ESTUDIANTE
                      </Text>
                      {rolRegistro === 'ALUMNO' && (
                        <Text style={styles.roleOptionSelectedMark}>✓ Seleccionado</Text>
                      )}
                    </View>
                    <Text style={styles.roleOptionTitle}>
                      🎓 Registro para Alumno / Representante
                    </Text>
                    <Text style={styles.roleOptionDesc}>
                      Si eres mayor de 18 años te registras directamente; si el alumno es menor de edad, se registra su Padre o Representante Legal.
                    </Text>
                  </TouchableOpacity>

                  {/* Opción 3: Revisión (Encargado de Fundaoboe) */}
                  <TouchableOpacity
                    style={[
                      styles.roleOptionButton,
                      rolRegistro === 'REVISION_FUNDAOBOE' &&
                        styles.roleOptionButtonActive,
                    ]}
                    onPress={() => {
                      setRolRegistro('REVISION_FUNDAOBOE');
                      setMensajeError(null);
                    }}
                  >
                    <View style={styles.roleOptionHeader}>
                      <Text style={styles.roleOptionBadge}>
                        OPCIÓN 3 · REVISIÓN (ENCARGADO FUNDAOBOE)
                      </Text>
                      {rolRegistro === 'REVISION_FUNDAOBOE' && (
                        <Text style={styles.roleOptionSelectedMark}>✓ Seleccionado</Text>
                      )}
                    </View>
                    <Text style={styles.roleOptionTitle}>
                      🛡️ Encargado de Revisión de Fundaoboe
                    </Text>
                    <Text style={styles.roleOptionDesc}>
                      Personal encargado de recibir y revisar los documentos de los docentes para otorgar su acreditación oficial.
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* FORMULARIO DINÁMICO SEGÚN LA OPCIÓN DE REGISTRO ELEGIDA */}
                <Text style={styles.cardTitle}>
                  2. Datos de Registro (
                  {rolRegistro === 'DOCENTE'
                    ? 'Docente — Paso 1 de 2'
                    : rolRegistro === 'ALUMNO'
                    ? 'Alumno / Representante'
                    : 'Encargado de Revisión Fundaoboe'}
                  )
                </Text>

                {/* Si es ALUMNO: Discriminación Sine Qua Non Mayor de 18 vs Menor de 18 */}
                {rolRegistro === 'ALUMNO' && (
                  <View style={styles.ageDiscriminationBox}>
                    <Text style={styles.fieldLabel}>
                      Condición del Estudiante (Obligatorio): ¿Es mayor o menor de 18 años? *
                    </Text>
                    <View style={styles.ageButtonsRow}>
                      <TouchableOpacity
                        style={[
                          styles.ageOptionBtn,
                          esMayorDe18 && styles.ageOptionBtnActive,
                        ]}
                        onPress={() => setEsMayorDe18(true)}
                      >
                        <Text
                          style={[
                            styles.ageOptionText,
                            esMayorDe18 && styles.ageOptionTextActive,
                          ]}
                        >
                          👤 Mayor de 18 años (Estudiante Adulto)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.ageOptionBtn,
                          !esMayorDe18 && styles.ageOptionBtnActive,
                        ]}
                        onPress={() => setEsMayorDe18(false)}
                      >
                        <Text
                          style={[
                            styles.ageOptionText,
                            !esMayorDe18 && styles.ageOptionTextActive,
                          ]}
                        >
                          👨‍👧 Menor de 18 años (Se registra Padre / Representante)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    {rolRegistro === 'ALUMNO' && !esMayorDe18
                      ? 'Nombre y Apellido del Padre / Madre o Representante Legal *'
                      : 'Nombre y Apellido Completo *'}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={regNombre}
                    onChangeText={setRegNombre}
                    placeholder="Ej. María Fernanda Gómez"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Documento de Identidad (Cédula) *
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={regCedula}
                    onChangeText={setRegCedula}
                    placeholder="Ej. V-24819302 (puedes escribirlo con o sin puntos)"
                    placeholderTextColor="#64748B"
                  />
                  <Text style={styles.helperNote}>
                    Guía de formato: escribe V o E seguido de tus números (ej. V-20105918).
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Correo Electrónico *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={regEmail}
                    onChangeText={setRegEmail}
                    placeholder="correo@ejemplo.com"
                    placeholderTextColor="#64748B"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Contraseña *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={regPassword}
                    onChangeText={setRegPassword}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#64748B"
                    secureTextEntry
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Teléfono de Contacto</Text>
                  <TextInput
                    style={styles.textInput}
                    value={regTelefono}
                    onChangeText={setRegTelefono}
                    placeholder="Ej. +58 412-5551234"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                  />
                </View>

                {/* CAMPOS ESPECÍFICOS PARA REGISTRO DOCENTE */}
                {rolRegistro === 'DOCENTE' && (
                  <View style={styles.roleSpecificBox}>
                    <Text style={styles.subBoxTitle}>
                      Perfil Musical del Docente (Paso 1)
                    </Text>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Instrumento Principal que Toca *
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        value={docInstrumentoPrincipal}
                        onChangeText={setDocInstrumentoPrincipal}
                        placeholder="Ej. Oboe Sinfónico, Guitarra Clásica, Violín..."
                        placeholderTextColor="#64748B"
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Otros Instrumentos o Cátedras en los que está Certificado (separados por coma)
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        value={docOtrosInstrumentos}
                        onChangeText={setDocOtrosInstrumentos}
                        placeholder="Ej. Guitarra Española, Cuatro Venezolano, Solfeo"
                        placeholderTextColor="#64748B"
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Orquesta Sinfónica / Conservatorio de Formación *
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        value={docOrquestaConservatorio}
                        onChangeText={setDocOrquestaConservatorio}
                        placeholder="Ej. Conservatorio Simón Bolívar / Orquesta Sinfónica"
                        placeholderTextColor="#64748B"
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Años de Experiencia Musical</Text>
                      <TextInput
                        style={styles.textInput}
                        value={docAnosExp}
                        onChangeText={setDocAnosExp}
                        keyboardType="numeric"
                        placeholder="Ej. 8"
                        placeholderTextColor="#64748B"
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Resumen de Trayectoria y Estudios Musicales
                      </Text>
                      <TextInput
                        style={[styles.textInput, { minHeight: 72 }]}
                        value={docBiografia}
                        onChangeText={setDocBiografia}
                        multiline
                        placeholder="Describe dónde estudiaste, orquestas en las que has participado y experiencia docente..."
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>
                )}

                {/* CAMPOS ESPECÍFICOS PARA REGISTRO ALUMNO */}
                {rolRegistro === 'ALUMNO' && esMayorDe18 && (
                  <View style={styles.roleSpecificBox}>
                    <Text style={styles.subBoxTitle}>
                      Preferencia Musical del Estudiante Mayor de Edad
                    </Text>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Instrumento que deseas aprender a tocar *
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        value={instrumentoAlumnoAdulto}
                        onChangeText={setInstrumentoAlumnoAdulto}
                        placeholder="Ej. Oboe, Guitarra Clásica, Cuatro, Violín..."
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>
                )}

                {rolRegistro === 'ALUMNO' && !esMayorDe18 && (
                  <View style={styles.roleSpecificBox}>
                    <Text style={styles.subBoxTitle}>
                      Datos de los Hijos / Representados Menores de Edad
                    </Text>
                    <Text style={styles.helperNote}>
                      Todos los representados menores quedan asociados dentro del registro del Padre o Representante Legal:
                    </Text>

                    {representados.map((rep, idx) => (
                      <View key={rep.id} style={styles.childCard}>
                        <View style={styles.childCardHeader}>
                          <Text style={styles.childCardTitle}>
                            Representado Menor #{idx + 1}
                          </Text>
                          {representados.length > 1 && (
                            <TouchableOpacity
                              onPress={() => eliminarRepresentado(idx)}
                            >
                              <Text style={styles.removeChildText}>✕ Quitar</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>
                            Nombre y Apellido del Menor *
                          </Text>
                          <TextInput
                            style={styles.textInput}
                            value={rep.nombre_completo}
                            onChangeText={(v) =>
                              actualizarRepresentado(idx, 'nombre_completo', v)
                            }
                            placeholder="Ej. Lucas Sanabria"
                            placeholderTextColor="#64748B"
                          />
                        </View>

                        <View style={styles.twoColRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>Edad (4–17 años) *</Text>
                            <TextInput
                              style={styles.textInput}
                              value={String(rep.edad)}
                              onChangeText={(v) =>
                                actualizarRepresentado(
                                  idx,
                                  'edad',
                                  parseInt(v, 10) || 0
                                )
                              }
                              keyboardType="numeric"
                            />
                          </View>

                          <View style={{ flex: 1.5 }}>
                            <Text style={styles.fieldLabel}>
                              Filiación con el Menor *
                            </Text>
                            <TextInput
                              style={styles.textInput}
                              value={rep.filiacion}
                              onChangeText={(v) =>
                                actualizarRepresentado(
                                  idx,
                                  'filiacion',
                                  v as RepresentadoMenor['filiacion']
                                )
                              }
                              placeholder="Padre/Madre o Representante Legal"
                              placeholderTextColor="#64748B"
                            />
                          </View>
                        </View>

                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>
                            Instrumento que desea aprender *
                          </Text>
                          <TextInput
                            style={styles.textInput}
                            value={rep.instrumento_interes}
                            onChangeText={(v) =>
                              actualizarRepresentado(idx, 'instrumento_interes', v)
                            }
                            placeholder="Ej. Oboe, Violín, Guitarra..."
                            placeholderTextColor="#64748B"
                          />
                        </View>
                      </View>
                    ))}

                    <TouchableOpacity
                      style={styles.secondaryOutlineButton}
                      onPress={agregarRepresentado}
                    >
                      <Text style={styles.secondaryOutlineButtonText}>
                        ＋ Agregar otro hijo / representado menor
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* CAMPOS ESPECÍFICOS PARA REGISTRO ENCARGADO DE REVISIÓN FUNDAOBOE */}
                {rolRegistro === 'REVISION_FUNDAOBOE' && (
                  <View style={styles.roleSpecificBox}>
                    <Text style={styles.subBoxTitle}>
                      Acreditación Institucional Fundaoboe
                    </Text>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Cargo o Departamento en Fundaoboe *
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        value={cargoFundaoboe}
                        onChangeText={setCargoFundaoboe}
                        placeholder="Ej. Coordinador de Revisión de Credenciales"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleContinuarRegistro}
                >
                  <Text style={styles.primaryButtonText}>
                    {rolRegistro === 'DOCENTE'
                      ? 'Continuar a Pantalla 2: Subir Documentos de Acreditación →'
                      : rolRegistro === 'ALUMNO'
                      ? 'Completar Registro y Ver Docentes →'
                      : 'Completar Registro y Abrir Panel de Revisión →'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>
            Fundaoboe & Universidad Simón Bolívar — PS-1115 (2026)
          </Text>
          <Text style={styles.footerSub}>
            Alto contraste verificado WCAG 2.2 AA • Sin pasarelas ni billetera en MVP
          </Text>
          <SupabaseStatusBadge />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const AZUL_REY = '#0047AB';
const AZUL_NOCHE = '#0A192F';
const FONDO_APP = '#F4F7FC';
const BORDE_ALTO_CONTRASTE = '#475569';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FONDO_APP,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  brandBanner: {
    backgroundColor: AZUL_NOCHE,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: AZUL_REY,
  },
  brandTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  logoCircle: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: AZUL_REY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFBF00',
  },
  logoEmoji: {
    fontSize: 26,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  brandTagline: {
    color: '#B3D1FF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  instNavRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  instNavBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#1E293B',
  },
  instNavBtnActive: {
    backgroundColor: '#FFBF00',
    borderColor: '#FFBF00',
  },
  instNavText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  instNavTextActive: {
    color: AZUL_NOCHE,
  },
  modeSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 6,
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    marginBottom: 16,
    gap: 8,
  },
  modeSwitchBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitchBtnActive: {
    backgroundColor: AZUL_REY,
  },
  modeSwitchText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  modeSwitchTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    marginBottom: 16,
  },
  cardKicker: {
    fontSize: 11.5,
    fontWeight: '900',
    color: AZUL_REY,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 8,
  },
  cardParagraph: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 10,
    fontWeight: '500',
  },
  demoRolesGrid: {
    gap: 10,
    marginBottom: 16,
    marginTop: 6,
  },
  demoRoleCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#64748B',
    borderRadius: 12,
    padding: 12,
  },
  demoRoleCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: AZUL_REY,
    borderWidth: 2.5,
  },
  demoRoleTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 2,
  },
  demoRoleSub: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  roleOptionsStack: {
    gap: 12,
    marginBottom: 14,
  },
  roleOptionButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: '#64748B',
  },
  roleOptionButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: AZUL_REY,
    borderWidth: 3,
  },
  roleOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roleOptionBadge: {
    fontSize: 11.5,
    fontWeight: '900',
    color: AZUL_REY,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleOptionSelectedMark: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#047857',
  },
  roleOptionTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 4,
  },
  roleOptionDesc: {
    fontSize: 13.5,
    color: '#1E293B',
    lineHeight: 19,
    fontWeight: '500',
  },
  divider: {
    height: 2,
    backgroundColor: '#CBD5E1',
    marginVertical: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: AZUL_NOCHE,
    fontWeight: '600',
  },
  helperNote: {
    fontSize: 12.5,
    color: '#334155',
    marginTop: 5,
    fontWeight: '600',
    lineHeight: 18,
  },
  ageDiscriminationBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: AZUL_REY,
    marginBottom: 14,
  },
  ageButtonsRow: {
    gap: 8,
    marginTop: 4,
  },
  ageOptionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  ageOptionBtnActive: {
    backgroundColor: AZUL_REY,
    borderColor: AZUL_REY,
  },
  ageOptionText: {
    fontSize: 14,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
  ageOptionTextActive: {
    color: '#FFFFFF',
  },
  roleSpecificBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: BORDE_ALTO_CONTRASTE,
    marginBottom: 16,
  },
  subBoxTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: AZUL_REY,
    marginBottom: 10,
  },
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#64748B',
    marginTop: 10,
    marginBottom: 10,
  },
  childCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  childCardTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  removeChildText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C81E1E',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: AZUL_REY,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: AZUL_NOCHE,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '900',
    textAlign: 'center',
  },
  secondaryOutlineButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AZUL_REY,
  },
  secondaryOutlineButtonText: {
    color: AZUL_REY,
    fontSize: 14.5,
    fontWeight: '900',
    textAlign: 'center',
  },
  errorAlert: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#C81E1E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorAlertText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '800',
  },
  publicTeacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  publicTeacherIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: AZUL_REY,
  },
  publicTeacherName: {
    fontSize: 15,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  publicTeacherInst: {
    fontSize: 13.5,
    fontWeight: '700',
    color: AZUL_REY,
  },
  lockedTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#92400E',
  },
  lockedTagText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#92400E',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: AZUL_NOCHE,
    textAlign: 'center',
  },
  footerSub: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  howItWorksBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: AZUL_REY,
    marginVertical: 14,
  },
  howItWorksTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 6,
  },
  howItWorksParagraph: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 10,
    fontWeight: '600',
  },
  howItWorksItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 8,
  },
  howItWorksRoleTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: AZUL_REY,
    marginBottom: 3,
  },
  howItWorksDesc: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
    fontWeight: '500',
  },
});
