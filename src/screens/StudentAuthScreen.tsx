// src/screens/auth/StudentAuthScreen.tsx
import React, { useState } from 'react';
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
import {
  PerfilUsuarioAtril,
  signInStudent,
  signUpStudent,
  TipoEstudiante,
} from '../services/authService';

export interface StudentAuthScreenProps {
  onBack: () => void;
  onAuthSuccess: (usuario: PerfilUsuarioAtril) => void;
}

type ModoFormularioAuth = 'login' | 'registro';

interface ErroresValidacion {
  nombreCompleto?: string;
  cedula?: string;
  email?: string;
  password?: string;
  general?: string;
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StudentAuthScreen({
  onBack,
  onAuthSuccess,
}: StudentAuthScreenProps) {
  const [modo, setModo] = useState<ModoFormularioAuth>('login');
  const [tipoEstudiante, setTipoEstudiante] =
    useState<TipoEstudiante>('apoderado');

  const [nombreCompleto, setNombreCompleto] = useState<string>('');
  const [cedula, setCedula] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);

  const [errores, setErrores] = useState<ErroresValidacion>({});
  const [cargando, setCargando] = useState<boolean>(false);

  const limpiarErrores = () => setErrores({});

  const validarCampos = (): boolean => {
    const nuevosErrores: ErroresValidacion = {};

    if (modo === 'registro') {
      if (!nombreCompleto.trim() || nombreCompleto.trim().length < 3) {
        nuevosErrores.nombreCompleto =
          'Ingresa tu nombre y apellido completos.';
      }
      if (!cedula.trim() || cedula.trim().length < 5) {
        nuevosErrores.cedula =
          'Ingresa un número de cédula o documento válido.';
      }
    }

    if (!email.trim() || !REGEX_EMAIL.test(email.trim())) {
      nuevosErrores.email =
        'Ingresa un correo electrónico válido (ej. usuario@correo.com).';
    }

    if (!password || password.length < 6) {
      nuevosErrores.password =
        'La contraseña debe tener al menos 6 caracteres.';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async () => {
    if (!validarCampos()) return;

    setCargando(true);
    setErrores({});
    try {
      if (modo === 'login') {
        const perfil = await signInStudent(email, password);
        onAuthSuccess(perfil);
      } else {
        const perfil = await signUpStudent({
          email,
          password,
          nombreCompleto,
          tipoEstudiante,
          cedula,
        });
        onAuthSuccess(perfil);
      }
    } catch (err: any) {
      setErrores({
        general:
          err?.message ||
          'No se pudo completar la autenticación con Supabase Auth.',
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Barra Superior con Regreso a R0 */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Volver a Perfiles</Text>
          </TouchableOpacity>
          <View style={styles.securityBadge}>
            <Text style={styles.securityBadgeText}>SUPABASE AUTH</Text>
          </View>
        </View>

        {/* Encabezado Institucional */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Portal del Estudiante y Representante</Text>
          <Text style={styles.subtitle}>
            Accede a las cátedras verificadas de FundaOboeHJK con custodia fiduciaria Escrow
          </Text>
        </View>

        {/* Segmento Conmutador Interactivo: [ Iniciar Sesión ] | [ Crear Cuenta ] */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              modo === 'login' && styles.segmentButtonActive,
            ]}
            activeOpacity={0.85}
            onPress={() => {
              setModo('login');
              limpiarErrores();
            }}
          >
            <Text
              style={[
                styles.segmentText,
                modo === 'login' && styles.segmentTextActive,
              ]}
            >
              Iniciar Sesión
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              modo === 'registro' && styles.segmentButtonActive,
            ]}
            activeOpacity={0.85}
            onPress={() => {
              setModo('registro');
              limpiarErrores();
            }}
          >
            <Text
              style={[
                styles.segmentText,
                modo === 'registro' && styles.segmentTextActive,
              ]}
            >
              Crear Cuenta
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta Principal del Formulario */}
        <View style={styles.formCard}>
          {/* Selector de Tipo de Estudiante en modo Crear Cuenta */}
          {modo === 'registro' && (
            <View style={styles.profileTypeSection}>
              <Text style={styles.fieldLabel}>
                Selecciona tu modalidad de titularidad:
              </Text>

              {/* Opción A: Soy Padre / Representante (A1) */}
              <TouchableOpacity
                style={[
                  styles.profileOptionCard,
                  tipoEstudiante === 'apoderado' &&
                    styles.profileOptionCardSelected,
                ]}
                activeOpacity={0.85}
                onPress={() => setTipoEstudiante('apoderado')}
              >
                <View style={styles.radioRow}>
                  <View
                    style={[
                      styles.radioOuter,
                      tipoEstudiante === 'apoderado' && styles.radioOuterSelected,
                    ]}
                  >
                    {tipoEstudiante === 'apoderado' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileOptionTitle}>
                      👨‍👧 Soy Padre / Representante
                    </Text>
                    <Text style={styles.profileOptionSub}>
                      Gestiono la formación de mis representados menores de edad
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Opción B: Soy Estudiante Mayor de Edad (A0) */}
              <TouchableOpacity
                style={[
                  styles.profileOptionCard,
                  tipoEstudiante === 'estudiante_adulto' &&
                    styles.profileOptionCardSelected,
                ]}
                activeOpacity={0.85}
                onPress={() => setTipoEstudiante('estudiante_adulto')}
              >
                <View style={styles.radioRow}>
                  <View
                    style={[
                      styles.radioOuter,
                      tipoEstudiante === 'estudiante_adulto' &&
                        styles.radioOuterSelected,
                    ]}
                  >
                    {tipoEstudiante === 'estudiante_adulto' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileOptionTitle}>
                      🎓 Soy Estudiante Mayor de Edad
                    </Text>
                    <Text style={styles.profileOptionSub}>
                      Mayor de 18 años, gestiono y pago mis propias clases
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Campos adicionales de Registro: Nombre y Cédula */}
          {modo === 'registro' && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nombre y Apellido</Text>
                <TextInput
                  style={[
                    styles.input,
                    errores.nombreCompleto ? styles.inputError : undefined,
                  ]}
                  placeholder="Ej. Samuel Sanabria"
                  placeholderTextColor="#94A3B8"
                  value={nombreCompleto}
                  onChangeText={(t) => {
                    setNombreCompleto(t);
                    if (errores.nombreCompleto) {
                      setErrores((prev) => ({ ...prev, nombreCompleto: undefined }));
                    }
                  }}
                />
                {errores.nombreCompleto && (
                  <Text style={styles.inlineErrorText}>
                    {errores.nombreCompleto}
                  </Text>
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
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  value={cedula}
                  onChangeText={(t) => {
                    setCedula(t);
                    if (errores.cedula) {
                      setErrores((prev) => ({ ...prev, cedula: undefined }));
                    }
                  }}
                />
                {errores.cedula && (
                  <Text style={styles.inlineErrorText}>{errores.cedula}</Text>
                )}
              </View>
            </>
          )}

          {/* Campo Correo Institucional / Personal */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Correo Institucional / Personal</Text>
            <TextInput
              style={[
                styles.input,
                errores.email ? styles.inputError : undefined,
              ]}
              placeholder="estudiante@usb.ve o correo@ejemplo.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errores.email) {
                  setErrores((prev) => ({ ...prev, email: undefined }));
                }
              }}
            />
            {errores.email && (
              <Text style={styles.inlineErrorText}>{errores.email}</Text>
            )}
          </View>

          {/* Campo Contraseña con Toggle Ver/Ocultar */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Contraseña</Text>
            <View
              style={[
                styles.passwordWrapper,
                errores.password ? styles.inputError : undefined,
              ]}
            >
              <TextInput
                style={styles.passwordInput}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!mostrarPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errores.password) {
                    setErrores((prev) => ({ ...prev, password: undefined }));
                  }
                }}
              />
              <TouchableOpacity
                style={styles.eyeToggleBtn}
                onPress={() => setMostrarPassword((prev) => !prev)}
              >
                <Text style={styles.eyeToggleText}>
                  {mostrarPassword ? 'Ocultar' : 'Ver'}
                </Text>
              </TouchableOpacity>
            </View>
            {errores.password && (
              <Text style={styles.inlineErrorText}>{errores.password}</Text>
            )}
          </View>

          {/* Error General en Línea */}
          {errores.general && (
            <View style={styles.generalErrorBanner}>
              <Text style={styles.generalErrorText}>⚠ {errores.general}</Text>
            </View>
          )}

          {/* Botón Primario de Acción */}
          <TouchableOpacity
            disabled={cargando}
            style={[styles.submitBtn, cargando && styles.submitBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleSubmit}
          >
            {cargando ? (
              <ActivityIndicator size="small" color={BLANCO} />
            ) : (
              <Text style={styles.submitBtnText}>
                {modo === 'login'
                  ? 'Iniciar Sesión en ATRIL →'
                  : tipoEstudiante === 'apoderado'
                  ? 'Crear Cuenta de Representante (A1) →'
                  : 'Crear Cuenta de Estudiante Adulto (A0) →'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const AZUL_REY = '#1D4ED8';
const AZUL_INSTITUCIONAL = '#1E40AF';
const FONDO = '#F8FAFC';
const BLANCO = '#FFFFFF';
const VERDE = '#059669';
const ROJO = '#DC2626';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FONDO,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 34,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  backBtn: {
    backgroundColor: BLANCO,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  backBtnText: {
    color: AZUL_INSTITUCIONAL,
    fontSize: 12,
    fontWeight: '800',
  },
  securityBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  securityBadgeText: {
    color: VERDE,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  headerBlock: {
    marginBottom: 18,
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0A192F',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: AZUL_REY,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  segmentTextActive: {
    color: BLANCO,
  },
  formCard: {
    backgroundColor: BLANCO,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileTypeSection: {
    marginBottom: 14,
    gap: 10,
  },
  profileOptionCard: {
    backgroundColor: FONDO,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
  },
  profileOptionCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: AZUL_REY,
    borderWidth: 2,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLANCO,
  },
  radioOuterSelected: {
    borderColor: AZUL_REY,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AZUL_REY,
  },
  profileOptionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 2,
  },
  profileOptionSub: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: FONDO,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    color: '#0F172A',
  },
  inputError: {
    borderColor: ROJO,
    backgroundColor: '#FEF2F2',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FONDO,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 13,
    color: '#0F172A',
  },
  eyeToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#DBEAFE',
  },
  eyeToggleText: {
    color: AZUL_INSTITUCIONAL,
    fontSize: 11,
    fontWeight: '800',
  },
  inlineErrorText: {
    color: ROJO,
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 5,
  },
  generalErrorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: ROJO,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  generalErrorText: {
    color: ROJO,
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: AZUL_REY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitBtnText: {
    color: BLANCO,
    fontSize: 13,
    fontWeight: '800',
  },
});