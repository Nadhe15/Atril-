// src/screens/AuthLandingScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import THEME from '../constants/theme';
import {
  AVISO_LEGAL_LOPNNA_MENORES,
  AVISO_LEGAL_LOPNNA_TITULO,
  MENSAJE_GUIA_EDAD_ESTUDIANTE,
  RECUADRO_SEGURIDAD_MENOR_LOPNNA_TEXTO,
  RECUADRO_SEGURIDAD_MENOR_LOPNNA_TITULO,
} from '../constants/lopnna';
import {
  iniciarSesionUnificado,
  PerfilUsuarioAtril,
  registrarUsuarioUnificado,
} from '../services/authService';
import {
  obtenerUsuarioDeCacheAdmin,
  sincronizarUsuarioEnCacheAdmin,
} from '../services/adminService';
import {
  AREAS_CATEDRAS_OFICIALES,
  obtenerCatalogoDocentes,
} from '../services/teacherCatalogService';
import { DocenteCatalogoItem } from '../types/atril.types';

export type AuthLandingTab = 'auth' | 'quienes_somos' | 'profesores_externa';
type ModoAuthForm = 'login' | 'registro';
type RolPostulacion = 'docente' | 'estudiante';

export interface AuthLandingScreenProps {
  onAuthSuccess: (usuario: PerfilUsuarioAtril) => void;
  onPendingVerification?: (usuario: PerfilUsuarioAtril) => void;
  onBackToSplash?: () => void;
  initialTab?: AuthLandingTab;
}

interface ErroresFormulario {
  nombreCompleto?: string;
  cedula?: string;
  telefono?: string;
  email?: string;
  password?: string;
  areaDocente?: string;
  nombreRepresentante?: string;
  cedulaRepresentante?: string;
  general?: string;
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthLandingScreen({
  onAuthSuccess,
  onPendingVerification,
  onBackToSplash,
  initialTab = 'auth',
}: AuthLandingScreenProps) {
  const [activeTopTab, setActiveTopTab] = useState<AuthLandingTab>(initialTab);
  const [modoAuth, setModoAuth] = useState<ModoAuthForm>('login');
  const [rolRegistro, setRolRegistro] = useState<RolPostulacion>('estudiante');
  const [esMenorEdad, setEsMenorEdad] = useState<boolean>(false);

  // Campos de formulario
  const [nombreCompleto, setNombreCompleto] = useState<string>('');
  const [cedula, setCedula] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);
  const [areaDocente, setAreaDocente] = useState<string>(AREAS_CATEDRAS_OFICIALES[0]);
  const [nombreRepresentante, setNombreRepresentante] = useState<string>('');
  const [cedulaRepresentante, setCedulaRepresentante] = useState<string>('');

  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [cargandoAuth, setCargandoAuth] = useState<boolean>(false);

  // Estado para la pestaña Profesores (Vista Externa)
  const [docentesExternos, setDocentesExternos] = useState<DocenteCatalogoItem[]>([]);
  const [cargandoDocentes, setCargandoDocentes] = useState<boolean>(false);

  const cargarVistaExternaDocentes = useCallback(async () => {
    setCargandoDocentes(true);
    try {
      const lista = await obtenerCatalogoDocentes();
      setDocentesExternos(lista);
    } finally {
      setCargandoDocentes(false);
    }
  }, []);

  useEffect(() => {
    if (activeTopTab === 'profesores_externa') {
      cargarVistaExternaDocentes();
    }
  }, [activeTopTab, cargarVistaExternaDocentes]);

  const limpiarErrores = () => setErrores({});

  const validarFormulario = (): boolean => {
    const nuevos: ErroresFormulario = {};

    if (modoAuth === 'registro') {
      if (!nombreCompleto.trim() || nombreCompleto.trim().length < 3) {
        nuevos.nombreCompleto = 'Ingresa nombre y apellido completos.';
      }
      if (!cedula.trim() || cedula.trim().length < 5) {
        nuevos.cedula = 'Ingresa un número de cédula o documento válido.';
      }
      if (!telefono.trim() || telefono.trim().length < 7) {
        nuevos.telefono = 'Ingresa un teléfono de contacto válido.';
      }

      if (rolRegistro === 'docente') {
        if (!areaDocente.trim()) {
          nuevos.areaDocente = 'Selecciona o indica tu área o cátedra principal.';
        }
      } else if (esMenorEdad) {
        if (!nombreRepresentante.trim() || nombreRepresentante.trim().length < 3) {
          nuevos.nombreRepresentante =
            'Ingresa el nombre y apellido del padre o representante legal.';
        }
        if (!cedulaRepresentante.trim() || cedulaRepresentante.trim().length < 5) {
          nuevos.cedulaRepresentante =
            'Ingresa la cédula de identidad del representante legal.';
        }
      }
    }

    if (!email.trim() || !REGEX_EMAIL.test(email.trim())) {
      nuevos.email = 'Ingresa un correo electrónico válido (ej. usuario@correo.com).';
    }

    if (!password || password.length < 6) {
      nuevos.password = 'La contraseña debe tener al menos 6 caracteres.';
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const handleSubmitAuth = async () => {
    if (!validarFormulario()) return;

    setCargandoAuth(true);
    setErrores({});

    try {
      if (modoAuth === 'login') {
        const perfil = await iniciarSesionUnificado(email, password);
        if (
          (perfil.estado_verificacion === 'pendiente' ||
            perfil.estado_verificacion === 'suspendido') &&
          perfil.rol_v5 !== 'admin' &&
          onPendingVerification
        ) {
          onPendingVerification(perfil);
        } else {
          onAuthSuccess(perfil);
        }
        return;
      }

      // Registro unificado: la cuenta queda en estado 'pendiente'
      const nuevoPerfil = await registrarUsuarioUnificado({
        nombreCompleto,
        cedula,
        telefono,
        email,
        password,
        rol: rolRegistro,
        esMenor: rolRegistro === 'estudiante' ? esMenorEdad : false,
        tipoEstudiante:
          rolRegistro === 'estudiante'
            ? esMenorEdad
              ? 'apoderado'
              : 'estudiante_adulto'
            : undefined,
        nombreRepresentante:
          rolRegistro === 'estudiante' && esMenorEdad ? nombreRepresentante : undefined,
        cedulaRepresentante:
          rolRegistro === 'estudiante' && esMenorEdad ? cedulaRepresentante : undefined,
        areaDocente: rolRegistro === 'docente' ? areaDocente : undefined,
      });

      if (onPendingVerification) {
        onPendingVerification(nuevoPerfil);
      } else {
        onAuthSuccess(nuevoPerfil);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudo procesar la solicitud en Supabase Auth.';
      setErrores({ general: msg });
    } finally {
      setCargandoAuth(false);
    }
  };

  const handleQuickDemoAccess = (
    demoKey: 'admin' | 'docente_verificado' | 'estudiante_verificado' | 'pendiente'
  ) => {
    const ahoraIso = new Date().toISOString();
    let perfilDemo: PerfilUsuarioAtril;

    if (demoKey === 'admin') {
      perfilDemo = {
        id: 'admin-virginia-01',
        email: 'virginia.admin@fundaoboe.org.ve',
        rol: 'admin',
        rol_v5: 'admin',
        estado_verificacion: 'verificado',
        cedula_identidad: 'V-10293847',
        nombre_completo: 'Virginia (Superadmin Fundaoboe)',
        telefono: '+58 412-9000001',
        created_at: ahoraIso,
      };
    } else if (demoKey === 'docente_verificado') {
      perfilDemo = {
        id: '99999999-9999-9999-9999-999999999999',
        email: 'jg.sanabria@fundaoboe.org',
        rol: 'docente',
        rol_v5: 'docente',
        estado_verificacion: 'verificado',
        cedula_identidad: 'V-10458921',
        nombre_completo: 'Mtro. José Gregorio Sanabria',
        telefono: '+58 412-9001122',
        area_docente: 'Oboe Sinfónico',
        created_at: ahoraIso,
      };
    } else if (demoKey === 'estudiante_verificado') {
      perfilDemo = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'samuel.sanabria@usb.ve',
        rol: 'estudiante',
        rol_v5: 'estudiante',
        estado_verificacion: 'verificado',
        tipo_estudiante: 'estudiante_adulto',
        cedula_identidad: 'V-26841920',
        nombre_completo: 'Samuel Sanabria',
        telefono: '+58 412-5550192',
        es_menor: false,
        created_at: ahoraIso,
      };
    } else {
      const enCache = obtenerUsuarioDeCacheAdmin('usr-pend-03');
      perfilDemo = {
        id: 'usr-pend-03',
        email: 'carlos.reveron@conservatorio.ve',
        rol: 'docente',
        rol_v5: 'docente',
        estado_verificacion: enCache?.estado_verificacion ?? 'pendiente',
        cedula_identidad: 'V-11204885',
        nombre_completo: 'Prof. Carlos Reverón (Guitarra Clásica)',
        telefono: '+58 424-1984432',
        area_docente: 'Guitarra Clásica',
        created_at: ahoraIso,
      };
    }

    sincronizarUsuarioEnCacheAdmin(perfilDemo);

    if (
      perfilDemo.rol_v5 !== 'admin' &&
      perfilDemo.estado_verificacion !== 'verificado' &&
      onPendingVerification
    ) {
      onPendingVerification(perfilDemo);
    } else {
      onAuthSuccess(perfilDemo);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Encabezado Institucional */}
        <View style={styles.brandHeader}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>🎼</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandTitle}>ATRIL • FUNDAOBOE</Text>
              <Text style={styles.brandSubtitle}>
                Red Académica de Cátedras Musicales Verificadas
              </Text>
            </View>
            {onBackToSplash && (
              <TouchableOpacity style={styles.splashBackBtn} onPress={onBackToSplash}>
                <Text style={styles.splashBackBtnText}>Inicio</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 3 Pestañas Superiores Tipo Chip */}
          <View style={styles.topChipsRow}>
            <TouchableOpacity
              style={[
                styles.topChip,
                activeTopTab === 'auth' && styles.topChipActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setActiveTopTab('auth')}
            >
              <Text
                style={[
                  styles.topChipText,
                  activeTopTab === 'auth' && styles.topChipTextActive,
                ]}
              >
                🔐 Iniciar Sesión / Registro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.topChip,
                activeTopTab === 'quienes_somos' && styles.topChipActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setActiveTopTab('quienes_somos')}
            >
              <Text
                style={[
                  styles.topChipText,
                  activeTopTab === 'quienes_somos' && styles.topChipTextActive,
                ]}
              >
                🏛️ Quiénes Somos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.topChip,
                activeTopTab === 'profesores_externa' && styles.topChipActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setActiveTopTab('profesores_externa')}
            >
              <Text
                style={[
                  styles.topChipText,
                  activeTopTab === 'profesores_externa' && styles.topChipTextActive,
                ]}
              >
                🎼 Profesores (Vista Externa)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================================================================= */}
        {/* PESTAÑA 1: 🔐 INICIAR SESIÓN / REGISTRO                           */}
        {/* ================================================================= */}
        {activeTopTab === 'auth' && (
          <View style={styles.card}>
            {/* Conmutador: [ Iniciar Sesión ] | [ Postularse / Verificarse ] */}
            <View style={styles.segmentBar}>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  modoAuth === 'login' && styles.segmentBtnActive,
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  setModoAuth('login');
                  limpiarErrores();
                }}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    modoAuth === 'login' && styles.segmentBtnTextActive,
                  ]}
                >
                  Iniciar Sesión
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  modoAuth === 'registro' && styles.segmentBtnActive,
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  setModoAuth('registro');
                  limpiarErrores();
                }}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    modoAuth === 'registro' && styles.segmentBtnTextActive,
                  ]}
                >
                  Postularse / Verificarse
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selector de Rol en Modo Registro */}
            {modoAuth === 'registro' && (
              <View style={styles.roleSelectionBlock}>
                <Text style={styles.fieldLabel}>
                  Selecciona el tipo de acreditación que solicitas:
                </Text>

                {/* Opción 1: 🎻 Postularse como Profesor */}
                <TouchableOpacity
                  style={[
                    styles.roleOptionCard,
                    rolRegistro === 'docente' && styles.roleOptionCardSelected,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setRolRegistro('docente');
                    limpiarErrores();
                  }}
                >
                  <View style={styles.radioRow}>
                    <View
                      style={[
                        styles.radioOuter,
                        rolRegistro === 'docente' && styles.radioOuterSelected,
                      ]}
                    >
                      {rolRegistro === 'docente' && <View style={styles.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roleOptionTitle}>
                        🎻 Postularse como Profesor
                      </Text>
                      <Text style={styles.roleOptionDesc}>
                        Registra tus datos básicos y área académica. La revisión curricular y entrevista se coordinan por correo con Fundaoboe.
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Opción 2: 🎓 Verificarse como Estudiante */}
                <TouchableOpacity
                  style={[
                    styles.roleOptionCard,
                    rolRegistro === 'estudiante' && styles.roleOptionCardSelected,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setRolRegistro('estudiante');
                    limpiarErrores();
                  }}
                >
                  <View style={styles.radioRow}>
                    <View
                      style={[
                        styles.radioOuter,
                        rolRegistro === 'estudiante' && styles.radioOuterSelected,
                      ]}
                    >
                      {rolRegistro === 'estudiante' && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roleOptionTitle}>
                        🎓 Verificarse como Estudiante
                      </Text>
                      <Text style={styles.roleOptionDesc}>
                        Valida tu identidad (o la de tu representante si eres menor de 18 años) para contactar directamente a los maestros.
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Sub-selector para Estudiante: Mayor de 18 vs Menor de 18 */}
                {rolRegistro === 'estudiante' && (
                  <View style={styles.ageSubBlock}>
                    <Text style={styles.fieldLabel}>Condición de edad del estudiante:</Text>
                    <Text style={styles.ageGuideText}>
                      ⚖️ {MENSAJE_GUIA_EDAD_ESTUDIANTE}
                    </Text>
                    <View style={styles.ageButtonsRow}>
                      <TouchableOpacity
                        accessibilityRole="radio"
                        accessibilityState={{ selected: !esMenorEdad }}
                        accessibilityLabel="Estudiante mayor de 18 años"
                        style={[
                          styles.ageChip,
                          !esMenorEdad && styles.ageChipSelected,
                        ]}
                        onPress={() => setEsMenorEdad(false)}
                      >
                        <Text
                          style={[
                            styles.ageChipText,
                            !esMenorEdad && styles.ageChipTextSelected,
                          ]}
                        >
                          Mayor de 18 años
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        accessibilityRole="radio"
                        accessibilityState={{ selected: esMenorEdad }}
                        accessibilityLabel="Estudiante menor de 18 años, requiere representante legal según LOPNNA"
                        style={[
                          styles.ageChip,
                          esMenorEdad && styles.ageChipSelected,
                        ]}
                        onPress={() => setEsMenorEdad(true)}
                      >
                        <Text
                          style={[
                            styles.ageChipText,
                            esMenorEdad && styles.ageChipTextSelected,
                          ]}
                        >
                          Menor de 18 (Con Representante)
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {esMenorEdad && (
                      <View
                        style={[styles.lopnnaNoticeBox, { marginTop: 10, marginBottom: 0 }]}
                        accessible
                        accessibilityRole="alert"
                        accessibilityLiveRegion="polite"
                      >
                        <Text style={styles.lopnnaNoticeTitle}>
                          {RECUADRO_SEGURIDAD_MENOR_LOPNNA_TITULO}
                        </Text>
                        <Text style={styles.lopnnaNoticeText}>
                          {RECUADRO_SEGURIDAD_MENOR_LOPNNA_TEXTO}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Campos exclusivos de Registro */}
            {modoAuth === 'registro' && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    {rolRegistro === 'docente'
                      ? 'Nombre y Apellido del Profesor'
                      : esMenorEdad
                      ? 'Nombre y Apellido del Estudiante Menor'
                      : 'Nombre y Apellido del Estudiante'}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      errores.nombreCompleto ? styles.inputError : undefined,
                    ]}
                    placeholder="Ej. José Gregorio Sanabria"
                    placeholderTextColor={THEME.borderSoft}
                    value={nombreCompleto}
                    onChangeText={setNombreCompleto}
                  />
                  {errores.nombreCompleto && (
                    <Text style={styles.errorText}>{errores.nombreCompleto}</Text>
                  )}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Cédula / Documento de Identidad</Text>
                  <TextInput
                    style={[
                      styles.input,
                      errores.cedula ? styles.inputError : undefined,
                    ]}
                    placeholder="Ej. V-18452910"
                    placeholderTextColor={THEME.borderSoft}
                    autoCapitalize="characters"
                    value={cedula}
                    onChangeText={setCedula}
                  />
                  {errores.cedula && (
                    <Text style={styles.errorText}>{errores.cedula}</Text>
                  )}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Teléfono de Contacto (WhatsApp / Móvil)</Text>
                  <TextInput
                    style={[
                      styles.input,
                      errores.telefono ? styles.inputError : undefined,
                    ]}
                    placeholder="Ej. +58 412-5550192"
                    placeholderTextColor={THEME.borderSoft}
                    keyboardType="phone-pad"
                    value={telefono}
                    onChangeText={setTelefono}
                  />
                  {errores.telefono && (
                    <Text style={styles.errorText}>{errores.telefono}</Text>
                  )}
                </View>

                {/* Selector de Área Principal si se postula como Profesor */}
                {rolRegistro === 'docente' && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Área o Cátedra Principal</Text>
                    <View style={styles.areasWrap}>
                      {AREAS_CATEDRAS_OFICIALES.map((area) => {
                        const activa = areaDocente === area;
                        return (
                          <TouchableOpacity
                            key={area}
                            style={[
                              styles.areaPill,
                              activa && styles.areaPillActive,
                            ]}
                            onPress={() => setAreaDocente(area)}
                          >
                            <Text
                              style={[
                                styles.areaPillText,
                                activa && styles.areaPillTextActive,
                              ]}
                            >
                              {area}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {errores.areaDocente && (
                      <Text style={styles.errorText}>{errores.areaDocente}</Text>
                    )}
                  </View>
                )}

                {/* Datos de Representante Legal si es Estudiante Menor de 18 */}
                {rolRegistro === 'estudiante' && esMenorEdad && (
                  <View style={styles.guardianBox}>
                    <Text style={styles.guardianBoxTitle}>
                      👨‍👧 Datos del Padre o Representante Legal
                    </Text>

                    <View
                      style={styles.lopnnaNoticeBox}
                      accessible
                      accessibilityRole="alert"
                      accessibilityLiveRegion="polite"
                    >
                      <Text style={styles.lopnnaNoticeTitle}>
                        ⚖️ {AVISO_LEGAL_LOPNNA_TITULO}
                      </Text>
                      <Text style={styles.lopnnaNoticeText}>
                        {AVISO_LEGAL_LOPNNA_MENORES}
                      </Text>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Nombre y Apellido del Representante
                      </Text>
                      <TextInput
                        accessibilityLabel="Nombre y apellido del padre o representante legal"
                        accessibilityHint="Campo obligatorio según la LOPNNA para estudiantes menores de 18 años"
                        style={[
                          styles.input,
                          errores.nombreRepresentante ? styles.inputError : undefined,
                        ]}
                        placeholder="Ej. Carolina Mendoza"
                        placeholderTextColor={THEME.borderSoft}
                        value={nombreRepresentante}
                        onChangeText={setNombreRepresentante}
                      />
                      {errores.nombreRepresentante && (
                        <Text
                          accessibilityLiveRegion="polite"
                          style={styles.errorText}
                        >
                          {errores.nombreRepresentante}
                        </Text>
                      )}
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Cédula de Identidad del Representante
                      </Text>
                      <TextInput
                        accessibilityLabel="Cédula de identidad del representante legal"
                        accessibilityHint="Documento de identidad obligatorio del representante legal"
                        style={[
                          styles.input,
                          errores.cedulaRepresentante ? styles.inputError : undefined,
                        ]}
                        placeholder="Ej. V-12450988"
                        placeholderTextColor={THEME.borderSoft}
                        autoCapitalize="characters"
                        value={cedulaRepresentante}
                        onChangeText={setCedulaRepresentante}
                      />
                      {errores.cedulaRepresentante && (
                        <Text
                          accessibilityLiveRegion="polite"
                          style={styles.errorText}
                        >
                          {errores.cedulaRepresentante}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Campos comunes: Correo y Contraseña */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Correo Electrónico</Text>
              <TextInput
                style={[styles.input, errores.email ? styles.inputError : undefined]}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={THEME.borderSoft}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
              {errores.email && <Text style={styles.errorText}>{errores.email}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Contraseña</Text>
              <View
                style={[
                  styles.passwordContainer,
                  errores.password ? styles.inputError : undefined,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={THEME.borderSoft}
                  secureTextEntry={!mostrarPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggleBtn}
                  onPress={() => setMostrarPassword((prev) => !prev)}
                >
                  <Text style={styles.passwordToggleText}>
                    {mostrarPassword ? 'Ocultar' : 'Ver'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errores.password && (
                <Text style={styles.errorText}>{errores.password}</Text>
              )}
            </View>

            {errores.general && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>⚠ {errores.general}</Text>
              </View>
            )}

            <TouchableOpacity
              disabled={cargandoAuth}
              style={[styles.submitBtn, cargandoAuth && styles.submitBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleSubmitAuth}
            >
              {cargandoAuth ? (
                <ActivityIndicator size="small" color={THEME.surface} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {modoAuth === 'login'
                    ? 'Iniciar Sesión →'
                    : rolRegistro === 'docente'
                    ? 'Enviar Postulación como Profesor →'
                    : 'Solicitar Verificación como Estudiante →'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Sección Discreta: ⚡ Accesos Rápidos de Prueba (Demo) en Modo Login */}
            {modoAuth === 'login' && (
              <View style={styles.demoSection}>
                <Text style={styles.demoSectionTitle}>
                  ⚡ Accesos Rápidos de Prueba (Demo)
                </Text>
                <View style={styles.demoButtonsGrid}>
                  <TouchableOpacity
                    style={styles.demoCompactBtn}
                    activeOpacity={0.85}
                    onPress={() => handleQuickDemoAccess('admin')}
                  >
                    <Text style={styles.demoCompactBtnText}>
                      🛡️ Admin (Virginia)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.demoCompactBtn}
                    activeOpacity={0.85}
                    onPress={() => handleQuickDemoAccess('docente_verificado')}
                  >
                    <Text style={styles.demoCompactBtnText}>
                      🎻 Profesor Verificado
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.demoCompactBtn}
                    activeOpacity={0.85}
                    onPress={() => handleQuickDemoAccess('estudiante_verificado')}
                  >
                    <Text style={styles.demoCompactBtnText}>
                      🎓 Estudiante Verificado
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.demoCompactBtn}
                    activeOpacity={0.85}
                    onPress={() => handleQuickDemoAccess('pendiente')}
                  >
                    <Text style={styles.demoCompactBtnText}>
                      ⏳ Usuario Pendiente
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ================================================================= */}
        {/* PESTAÑA 2: 🏛️ QUIÉNES SOMOS                                       */}
        {/* ================================================================= */}
        {activeTopTab === 'quienes_somos' && (
          <View style={styles.card}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>FUNDACIÓN VENEZOLANA DEL OBOE</Text>
            </View>

            <Text style={styles.infoMainTitle}>
              ¿Qué es ATRIL y cómo funciona nuestra comunidad académica?
            </Text>
            <Text style={styles.infoParagraph}>
              ATRIL es la red oficial de vinculación musical tutelada por FundaOboeHJK. Conectamos a maestros de trayectoria comprobada con estudiantes verificados en un entorno seguro y de excelencia académica.
            </Text>

            <View style={styles.infoRoleBox}>
              <Text style={styles.infoRoleTitle}>🎻 Para Profesores y Maestros</Text>
              <Text style={styles.infoRoleBullet}>
                • <Text style={styles.boldText}>Postulación sencilla:</Text> Registra tus datos básicos y el área o cátedra que impartes.
              </Text>
              <Text style={styles.infoRoleBullet}>
                • <Text style={styles.boldText}>Acreditación institucional:</Text> Fundaoboe valida tu trayectoria y credenciales directamente por vía institucional antes de publicar tu perfil.
              </Text>
              <Text style={styles.infoRoleBullet}>
                • <Text style={styles.boldText}>Contacto seguro:</Text> Solo los estudiantes verificados pueden iniciar conversaciones académicas contigo.
              </Text>
            </View>

            <View style={styles.infoRoleBox}>
              <Text style={styles.infoRoleTitle}>
                🎓 Para Estudiantes y Representantes
              </Text>
              <Text style={styles.infoRoleBullet}>
                • <Text style={styles.boldText}>Verificación de identidad:</Text> Garantizamos la seguridad de toda la comunidad validando a cada alumno o a su representante legal (para menores de 18 años).
              </Text>
              <Text style={styles.infoRoleBullet}>
                • <Text style={styles.boldText}>Cátedras especializadas:</Text> Accede a maestros de Oboe Sinfónico, Guitarra Clásica, Cuatro Venezolano, Fagot, Violín, Canto, Armonía y Lenguaje Musical.
              </Text>
              <Text style={styles.infoRoleBullet}>
                • <Text style={styles.boldText}>Mensajería directa:</Text> Una vez verificada tu cuenta, coordina horarios y objetivos directamente con el profesor en el chat interno.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={() => setActiveTopTab('auth')}
            >
              <Text style={styles.submitBtnText}>
                Ir a Iniciar Sesión / Postularse →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================================================================= */}
        {/* PESTAÑA 3: 🎼 PROFESORES (VISTA EXTERNA PÚBLICA)                  */}
        {/* ================================================================= */}
        {activeTopTab === 'profesores_externa' && (
          <View style={styles.card}>
            <Text style={styles.infoMainTitle}>Directorio Público de Cátedras</Text>
            <Text style={styles.infoParagraph}>
              Conoce a los maestros acreditados por Fundaoboe y sus áreas de formación. Para consultar perfiles completos y enviar mensajes debes iniciar sesión con una cuenta verificada.
            </Text>

            {cargandoDocentes ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={THEME.primary} />
                <Text style={styles.loadingText}>Cargando directorio de profesores...</Text>
              </View>
            ) : (
              docentesExternos.map((docente) => (
                <View key={docente.id} style={styles.externalTeacherCard}>
                  <View style={styles.externalTeacherInfo}>
                    <Text style={styles.externalTeacherName}>{docente.nombre}</Text>
                    <Text style={styles.externalTeacherArea}>
                      Cátedra: {docente.areaPrincipal}
                      {docente.areasCertificadas.length > 1
                        ? ` • ${docente.areasCertificadas.slice(1).join(' • ')}`
                        : ''}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.lockedBadge}
                    activeOpacity={0.85}
                    onPress={() => {
                      setModoAuth('login');
                      setActiveTopTab('auth');
                    }}
                  >
                    <Text style={styles.lockedBadgeText}>
                      🔒 Inicia sesión para ver perfil
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  brandHeader: {
    backgroundColor: THEME.navy,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: THEME.primary,
    borderWidth: 1,
    borderColor: THEME.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 22,
    color: THEME.surface,
  },
  brandTitle: {
    color: THEME.surface,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: THEME.surfaceSub,
    fontSize: 12,
    fontWeight: '600',
  },
  splashBackBtn: {
    backgroundColor: THEME.primaryHover,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.gold,
  },
  splashBackBtnText: {
    color: THEME.gold,
    fontSize: 11.5,
    fontWeight: '800',
  },
  topChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topChip: {
    backgroundColor: THEME.primaryHover,
    borderWidth: 1,
    borderColor: THEME.borderSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  topChipActive: {
    backgroundColor: THEME.gold,
    borderColor: THEME.gold,
  },
  topChipText: {
    color: THEME.surface,
    fontSize: 11.5,
    fontWeight: '800',
  },
  topChipTextActive: {
    color: THEME.navy,
    fontWeight: '900',
  },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: THEME.borderUi,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: THEME.surfaceSub,
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: THEME.borderSoft,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: THEME.primary,
  },
  segmentBtnText: {
    color: THEME.textBody,
    fontSize: 12.5,
    fontWeight: '800',
  },
  segmentBtnTextActive: {
    color: THEME.surface,
    fontWeight: '900',
  },
  roleSelectionBlock: {
    marginBottom: 16,
    gap: 10,
  },
  roleOptionCard: {
    backgroundColor: THEME.background,
    borderWidth: 1.5,
    borderColor: THEME.borderSoft,
    borderRadius: 12,
    padding: 13,
  },
  roleOptionCardSelected: {
    backgroundColor: THEME.surfaceSub,
    borderColor: THEME.primary,
    borderWidth: 2,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.borderUi,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOuterSelected: {
    borderColor: THEME.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.primary,
  },
  roleOptionTitle: {
    color: THEME.textTitle,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 3,
  },
  roleOptionDesc: {
    color: THEME.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  ageSubBlock: {
    backgroundColor: THEME.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.borderSoft,
    marginTop: 4,
  },
  ageButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  ageChip: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderWidth: 1.5,
    borderColor: THEME.borderSoft,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageChipSelected: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  ageChipText: {
    color: THEME.textBody,
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  ageChipTextSelected: {
    color: THEME.surface,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: THEME.textTitle,
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    backgroundColor: THEME.background,
    borderWidth: 1.5,
    borderColor: THEME.borderSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13.5,
    color: THEME.textTitle,
  },
  inputError: {
    borderColor: THEME.danger,
    backgroundColor: THEME.dangerTint,
  },
  errorText: {
    color: THEME.dangerText,
    fontSize: 11.5,
    fontWeight: '800',
    marginTop: 4,
  },
  areasWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  areaPill: {
    backgroundColor: THEME.background,
    borderWidth: 1.5,
    borderColor: THEME.borderSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  areaPillActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  areaPillText: {
    color: THEME.textBody,
    fontSize: 12,
    fontWeight: '800',
  },
  areaPillTextActive: {
    color: THEME.surface,
  },
  guardianBox: {
    backgroundColor: THEME.surfaceSub,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: THEME.primary,
    marginBottom: 14,
  },
  guardianBoxTitle: {
    color: THEME.textTitle,
    fontSize: 13.5,
    fontWeight: '900',
    marginBottom: 10,
  },
  ageGuideText: {
    color: THEME.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  lopnnaNoticeBox: {
    backgroundColor: THEME.warnTint,
    borderWidth: 1.5,
    borderColor: THEME.warnText,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  lopnnaNoticeTitle: {
    color: THEME.warnText,
    fontSize: 12.5,
    fontWeight: '900',
    marginBottom: 4,
  },
  lopnnaNoticeText: {
    color: THEME.textTitle,
    fontSize: 12,
    lineHeight: 17.5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background,
    borderWidth: 1.5,
    borderColor: THEME.borderSoft,
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 13.5,
    color: THEME.textTitle,
  },
  passwordToggleBtn: {
    backgroundColor: THEME.surfaceSub,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.primary,
  },
  passwordToggleText: {
    color: THEME.primary,
    fontSize: 11.5,
    fontWeight: '800',
  },
  errorBanner: {
    backgroundColor: THEME.dangerTint,
    borderWidth: 1.5,
    borderColor: THEME.danger,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorBannerText: {
    color: THEME.dangerText,
    fontSize: 12.5,
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    backgroundColor: THEME.borderSoft,
  },
  submitBtnText: {
    color: THEME.surface,
    fontSize: 13.5,
    fontWeight: '900',
  },
  sectionBadge: {
    backgroundColor: THEME.gold,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  sectionBadgeText: {
    color: THEME.navy,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  infoMainTitle: {
    color: THEME.textTitle,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  infoParagraph: {
    color: THEME.textBody,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  infoRoleBox: {
    backgroundColor: THEME.surfaceSub,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.borderSoft,
    marginBottom: 14,
  },
  infoRoleTitle: {
    color: THEME.textTitle,
    fontSize: 14.5,
    fontWeight: '900',
    marginBottom: 8,
  },
  infoRoleBullet: {
    color: THEME.textBody,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 6,
  },
  boldText: {
    fontWeight: '900',
    color: THEME.textTitle,
  },
  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.textMuted,
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 8,
  },
  externalTeacherCard: {
    backgroundColor: THEME.background,
    borderWidth: 1.5,
    borderColor: THEME.borderSoft,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  externalTeacherInfo: {
    gap: 4,
  },
  externalTeacherName: {
    color: THEME.textTitle,
    fontSize: 15.5,
    fontWeight: '900',
  },
  externalTeacherArea: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  lockedBadge: {
    backgroundColor: THEME.warnTint,
    borderWidth: 1,
    borderColor: THEME.warnText,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  lockedBadgeText: {
    color: THEME.warnText,
    fontSize: 12,
    fontWeight: '900',
  },
  demoSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: THEME.borderSoft,
  },
  demoSectionTitle: {
    color: THEME.textMuted,
    fontSize: 11.5,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  demoButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoCompactBtn: {
    width: '48.5%',
    backgroundColor: THEME.surfaceSub,
    borderWidth: 1.5,
    borderColor: THEME.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoCompactBtnText: {
    color: THEME.textTitle,
    fontSize: 11.5,
    fontWeight: '900',
    textAlign: 'center',
  },
});
