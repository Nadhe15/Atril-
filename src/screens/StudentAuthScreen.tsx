// src/screens/StudentAuthScreen.tsx
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
  DatosHijoRegistro,
} from '../services/authService';
import { NivelMusical } from '../types/atril.types';

export interface StudentAuthScreenProps {
  onBack: () => void;
  onAuthSuccess: (usuario: PerfilUsuarioAtril) => void;
}

type ModoFormularioAuth = 'login' | 'registro';
type Parentesco = 'Padre' | 'Madre' | 'Tutor Legal';

interface ErroresValidacion {
  nombreCompleto?: string;
  cedula?: string;
  telefono?: string;
  email?: string;
  password?: string;
  consentimiento?: string;
  hijos?: string;
  general?: string;
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CATEDRAS_DISPONIBLES = [
  'Oboe',
  'Cuatro Venezolano',
  'Guitarra Acústica',
  'Percusión',
  'Flauta Traversa',
  'Clarinete',
  'Fagot',
  'Iniciación Musical (4 a 8 años)',
  'Solfeo y Teoría',
];

export default function StudentAuthScreen({
  onBack,
  onAuthSuccess,
}: StudentAuthScreenProps) {
  const [modo, setModo] = useState<ModoFormularioAuth>('registro');
  const [tipoEstudiante, setTipoEstudiante] =
    useState<TipoEstudiante>('apoderado');

  // Campos Comunes del Usuario Titular (Adulto)
  const [nombreCompleto, setNombreCompleto] = useState<string>('');
  const [cedula, setCedula] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);

  // Campos específicos de Representante (A1)
  const [parentesco, setParentesco] = useState<Parentesco>('Padre');
  const [hijos, setHijos] = useState<DatosHijoRegistro[]>([
    {
      nombreMenor: '',
      edadAnos: 8,
      instrumento: 'Oboe',
      nivel: 'iniciacion',
    },
  ]);
  const [consentimientoMenores, setConsentimientoMenores] =
    useState<boolean>(false);

  // Campos específicos de Alumno Adulto (A0)
  const [instrumentoAdulto, setInstrumentoAdulto] = useState<string>('Oboe');
  const [nivelAdulto, setNivelAdulto] = useState<NivelMusical>('iniciacion');
  const [declaracionMayorEdad, setDeclaracionMayorEdad] =
    useState<boolean>(false);

  const [errores, setErrores] = useState<ErroresValidacion>({});
  const [cargando, setCargando] = useState<boolean>(false);

  const limpiarErrores = () => setErrores({});

  // Gestión de Alumnos Representados (Soporte Multihijo)
  const agregarHijo = () => {
    setHijos((prev) => [
      ...prev,
      {
        nombreMenor: '',
        edadAnos: 7,
        instrumento: 'Cuatro Venezolano',
        nivel: 'iniciacion',
      },
    ]);
  };

  const eliminarHijo = (index: number) => {
    if (hijos.length <= 1) return;
    setHijos((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarHijo = (
    index: number,
    campo: keyof DatosHijoRegistro,
    valor: any
  ) => {
    setHijos((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  };

  const validarCampos = (): boolean => {
    const nuevosErrores: ErroresValidacion = {};

    if (modo === 'registro') {
      if (!nombreCompleto.trim() || nombreCompleto.trim().length < 3) {
        nuevosErrores.nombreCompleto =
          'Ingresa el nombre y apellido completos del titular.';
      }

      if (!cedula.trim() || cedula.trim().length < 5) {
        nuevosErrores.cedula =
          'Ingresa una cédula de identidad válida (ej. V-18452910).';
      }

      if (!telefono.trim() || telefono.trim().length < 8) {
        nuevosErrores.telefono =
          'Ingresa un número telefónico o WhatsApp de contacto.';
      }

      // Validaciones específicas según bifurcación
      if (tipoEstudiante === 'apoderado') {
        if (!consentimientoMenores) {
          nuevosErrores.consentimiento =
            'Debes certificar la patria potestad o tutela legal de los menores.';
        }

        // Validar cada hijo representado
        for (let i = 0; i < hijos.length; i++) {
          const h = hijos[i];
          if (!h.nombreMenor.trim() || h.nombreMenor.trim().length < 2) {
            nuevosErrores.hijos = `Ingresa el nombre del representado #${i + 1}.`;
            break;
          }
          if (h.edadAnos < 4 || h.edadAnos > 17) {
            nuevosErrores.hijos = `La edad del representado #${i + 1} debe estar entre 4 y 17 años (menor de edad).`;
            break;
          }
        }
      } else {
        // Estudiante Adulto
        if (!declaracionMayorEdad) {
          nuevosErrores.consentimiento =
            'Debes confirmar que eres mayor de 18 años de edad.';
        }
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
          telefono,
          parentesco: tipoEstudiante === 'apoderado' ? parentesco : undefined,
          instrumentoInteres:
            tipoEstudiante === 'estudiante_adulto' ? instrumentoAdulto : undefined,
          hijosIniciales: tipoEstudiante === 'apoderado' ? hijos : undefined,
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
        {/* Barra Superior con Regreso */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Volver al Menú</Text>
          </TouchableOpacity>
          <View style={styles.securityBadge}>
            <Text style={styles.securityBadgeText}>VERSIÓN 2.0 • USB</Text>
          </View>
        </View>

        {/* Encabezado Institucional */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Portal del Estudiante y Representante</Text>
          <Text style={styles.subtitle}>
            Plataforma oficial de cátedras musicales tuteladas de FundaOboeHJK
          </Text>
        </View>

        {/* Conmutador [ Iniciar Sesión ] | [ Crear Cuenta ] */}
        <View style={styles.segmentContainer}>
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
        </View>

        {/* Tarjeta Principal del Formulario */}
        <View style={styles.formCard}>
          {modo === 'registro' && (
            <>
              {/* BIFURCACIÓN DE TITULARIDAD OBLIGATORIA */}
              <View style={styles.profileTypeSection}>
                <Text style={styles.sectionHeaderTitle}>
                  Selecciona tu titularidad legal:
                </Text>

                {/* Opción A: Soy Padre / Representante Legal (A1) */}
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
                        tipoEstudiante === 'apoderado' &&
                          styles.radioOuterSelected,
                      ]}
                    >
                      {tipoEstudiante === 'apoderado' && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.profileOptionTitle}>
                        👨‍👧 Soy Padre / Representante Legal
                      </Text>
                      <Text style={styles.profileOptionSub}>
                        El titular legal es el adulto. Inscribe y tutela a menores
                        de edad con soporte multihijo.
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
                        🎓 Soy Alumno Mayor de Edad (+18)
                      </Text>
                      <Text style={styles.profileOptionSub}>
                        Usuario mayor de 18 años con autonomía académica y legal
                        directa.
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* BLOQUE 1: DATOS DEL TITULAR ADULTO */}
              <View style={styles.subSectionBox}>
                <Text style={styles.subSectionLabel}>
                  {tipoEstudiante === 'apoderado'
                    ? '1. Datos del Representante Legal (Adulto Titular)'
                    : '1. Datos Personales del Alumno'}
                </Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Nombre y Apellido Completo</Text>
                  <TextInput
                    style={[
                      styles.input,
                      errores.nombreCompleto ? styles.inputError : undefined,
                    ]}
                    placeholder={
                      tipoEstudiante === 'apoderado'
                        ? 'Ej. Carlos Mendoza (Representante)'
                        : 'Ej. Samuel Sanabria'
                    }
                    placeholderTextColor="#94A3B8"
                    value={nombreCompleto}
                    onChangeText={(t) => {
                      setNombreCompleto(t);
                      if (errores.nombreCompleto) {
                        setErrores((prev) => ({
                          ...prev,
                          nombreCompleto: undefined,
                        }));
                      }
                    }}
                  />
                  {errores.nombreCompleto && (
                    <Text style={styles.inlineErrorText}>
                      {errores.nombreCompleto}
                    </Text>
                  )}
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.fieldLabel}>Cédula de Identidad</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errores.cedula ? styles.inputError : undefined,
                      ]}
                      placeholder="Ej. V-14283910"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      value={cedula}
                      onChangeText={(t) => {
                        setCedula(t);
                        if (errores.cedula) {
                          setErrores((prev) => ({
                            ...prev,
                            cedula: undefined,
                          }));
                        }
                      }}
                    />
                    {errores.cedula && (
                      <Text style={styles.inlineErrorText}>{errores.cedula}</Text>
                    )}
                  </View>

                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Teléfono / WhatsApp</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errores.telefono ? styles.inputError : undefined,
                      ]}
                      placeholder="0414-1234567"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      value={telefono}
                      onChangeText={(t) => {
                        setTelefono(t);
                        if (errores.telefono) {
                          setErrores((prev) => ({
                            ...prev,
                            telefono: undefined,
                          }));
                        }
                      }}
                    />
                    {errores.telefono && (
                      <Text style={styles.inlineErrorText}>
                        {errores.telefono}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Si es representante, selector de Parentesco */}
                {tipoEstudiante === 'apoderado' && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Parentesco con el Alumno</Text>
                    <View style={styles.pillRow}>
                      {(['Padre', 'Madre', 'Tutor Legal'] as Parentesco[]).map(
                        (p) => (
                          <TouchableOpacity
                            key={p}
                            style={[
                              styles.pillBtn,
                              parentesco === p && styles.pillBtnActive,
                            ]}
                            onPress={() => setParentesco(p)}
                          >
                            <Text
                              style={[
                                styles.pillBtnText,
                                parentesco === p && styles.pillBtnTextActive,
                              ]}
                            >
                              {p}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </View>
                )}
              </View>

              {/* BLOQUE 2: REPRESENTADOS MENORES DE EDAD (MULTIHÍJO) */}
              {tipoEstudiante === 'apoderado' && (
                <View style={styles.subSectionBox}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.subSectionLabel}>
                      2. Alumnos Representados (Hijos / Menores)
                    </Text>
                    <TouchableOpacity
                      style={styles.addChildSmallBtn}
                      onPress={agregarHijo}
                    >
                      <Text style={styles.addChildSmallBtnText}>
                        + Añadir Hijo
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {errores.hijos && (
                    <Text style={[styles.inlineErrorText, { marginBottom: 8 }]}>
                      ⚠ {errores.hijos}
                    </Text>
                  )}

                  {hijos.map((hijo, idx) => (
                    <View key={idx} style={styles.childCard}>
                      <View style={styles.childCardHeader}>
                        <Text style={styles.childCardTitle}>
                          👦 Representado #{idx + 1}
                        </Text>
                        {hijos.length > 1 && (
                          <TouchableOpacity
                            onPress={() => eliminarHijo(idx)}
                            style={styles.deleteChildBtn}
                          >
                            <Text style={styles.deleteChildBtnText}>
                              Eliminar
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.rowTwoCols}>
                        <View
                          style={[styles.fieldGroup, { flex: 2, marginRight: 8 }]}
                        >
                          <Text style={styles.fieldLabel}>
                            Nombre del Menor
                          </Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ej. Sofía Mendoza"
                            placeholderTextColor="#94A3B8"
                            value={hijo.nombreMenor}
                            onChangeText={(t) =>
                              actualizarHijo(idx, 'nombreMenor', t)
                            }
                          />
                        </View>

                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                          <Text style={styles.fieldLabel}>Edad (Años)</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="4 - 17"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            value={String(hijo.edadAnos || '')}
                            onChangeText={(t) => {
                              const num = parseInt(t, 10);
                              actualizarHijo(
                                idx,
                                'edadAnos',
                                isNaN(num) ? 0 : num
                              );
                            }}
                          />
                        </View>
                      </View>

                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>
                          Cátedra / Instrumento de Formación
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.horizontalChips}
                        >
                          {CATEDRAS_DISPONIBLES.map((cat) => (
                            <TouchableOpacity
                              key={cat}
                              style={[
                                styles.chipBtn,
                                hijo.instrumento === cat && styles.chipBtnActive,
                              ]}
                              onPress={() =>
                                actualizarHijo(idx, 'instrumento', cat)
                              }
                            >
                              <Text
                                style={[
                                  styles.chipText,
                                  hijo.instrumento === cat &&
                                    styles.chipTextActive,
                                Shad
                                ]}
                              >
                                {cat}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Nivel de Experiencia</Text>
                        <View style={styles.pillRow}>
                          {(
                            [
                              { id: 'iniciacion', label: 'Iniciación' },
                              { id: 'intermedio', label: 'Intermedio' },
                              { id: 'avanzado', label: 'Avanzado' },
                            ] as const
                          ).map((lvl) => (
                            <TouchableOpacity
                              key={lvl.id}
                              style={[
                                styles.pillBtn,
                                hijo.nivel === lvl.id && styles.pillBtnActive,
                              ]}
                              onPress={() =>
                                actualizarHijo(idx, 'nivel', lvl.id)
                              }
                            >
                              <Text
                                style={[
                                  styles.pillBtnText,
                                  hijo.nivel === lvl.id &&
                                    styles.pillBtnTextActive,
                                ]}
                              >
                                {lvl.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* SI ES ESTUDIANTE ADULTO: CÁTEDRA Y NIVEL */}
              {tipoEstudiante === 'estudiante_adulto' && (
                <View style={styles.subSectionBox}>
                  <Text style={styles.subSectionLabel}>
                    2. Cátedra e Interés Formativo
                  </Text>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      Instrumento Principal a Cursar
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.horizontalChips}
                    >
                      {CATEDRAS_DISPONIBLES.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.chipBtn,
                            instrumentoAdulto === cat && styles.chipBtnActive,
                          ]}
                          onPress={() => setInstrumentoAdulto(cat)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              instrumentoAdulto === cat && styles.chipTextActive,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Nivel de Experiencia</Text>
                    <View style={styles.pillRow}>
                      {(
                        [
                          { id: 'iniciacion', label: 'Iniciación' },
                          { id: 'intermedio', label: 'Intermedio' },
                          { id: 'avanzado', label: 'Avanzado' },
                        ] as const
                      ).map((lvl) => (
                        <TouchableOpacity
                          key={lvl.id}
                          style={[
                            styles.pillBtn,
                            nivelAdulto === lvl.id && styles.pillBtnActive,
                          ]}
                          onPress={() => setNivelAdulto(lvl.id)}
                        >
                          <Text
                            style={[
                              styles.pillBtnText,
                              nivelAdulto === lvl.id &&
                                styles.pillBtnTextActive,
                            ]}
                          >
                            {lvl.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </>
          )}

          {/* CREDENCIALES DE ACCESO A SUPABASE AUTH */}
          <View style={styles.subSectionBox}>
            <Text style={styles.subSectionLabel}>
              {modo === 'registro' ? '3. Credenciales de Acceso' : 'Credenciales'}
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {tipoEstudiante === 'apoderado' && modo === 'registro'
                  ? 'Correo Electrónico del Representante'
                  : 'Correo Electrónico'}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  errores.email ? styles.inputError : undefined,
                ]}
                placeholder="usuario@correo.com"
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

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Contraseña de Acceso</Text>
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
          </View>

          {/* CLÁUSULA DE CONSENTIMIENTO Y PROTECCIÓN */}
          {modo === 'registro' && (
            <View style={styles.consentBox}>
              {tipoEstudiante === 'apoderado' ? (
                <TouchableOpacity
                  style={styles.checkboxRow}
                  activeOpacity={0.8}
                  onPress={() => setConsentimientoMenores((prev) => !prev)}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      consentimientoMenores && styles.checkboxBoxChecked,
                    ]}
                  >
                    {consentimientoMenores && (
                      <Text style={styles.checkboxCheck}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.consentText}>
                    Certifico que soy el padre/madre o tutor legal autorizado y
                    asumo la representación legal de los menores aquí registrados.
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.checkboxRow}
                  activeOpacity={0.8}
                  onPress={() => setDeclaracionMayorEdad((prev) => !prev)}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      declaracionMayorEdad && styles.checkboxBoxChecked,
                    ]}
                  >
                    {declaracionMayorEdad && (
                      <Text style={styles.checkboxCheck}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.consentText}>
                    Declaro bajo fe de juramento que soy mayor de 18 años de edad
                    y gestiono mis cátedras con plena autonomía legal.
                  </Text>
                </TouchableOpacity>
              )}
              {errores.consentimiento && (
                <Text style={styles.inlineErrorText}>
                  {errores.consentimiento}
                </Text>
              )}
            </View>
          )}

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
                  ? 'Registrar Representante y Alumnos (A1) →'
                  : 'Registrar Estudiante Adulto (A0) →'}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  securityBadgeText: {
    color: AZUL_REY,
    fontSize: 10,
    fontWeight: '800',
  },
  headerBlock: {
    marginBottom: 18,
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 18,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: BLANCO,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: AZUL_REY,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: BLANCO,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
  },
  profileTypeSection: {
    marginBottom: 16,
  },
  profileOptionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  profileOptionCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: AZUL_REY,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
    color: '#0F172A',
  },
  profileOptionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  subSectionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  subSectionLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: AZUL_INSTITUCIONAL,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addChildSmallBtn: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addChildSmallBtnText: {
    color: AZUL_REY,
    fontSize: 11,
    fontWeight: '800',
  },
  childCard: {
    backgroundColor: BLANCO,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 10,
  },
  childCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  childCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  deleteChildBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  deleteChildBtnText: {
    color: ROJO,
    fontSize: 11,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  input: {
    backgroundColor: BLANCO,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  inputError: {
    borderColor: ROJO,
    backgroundColor: '#FEF2F2',
  },
  inlineErrorText: {
    color: ROJO,
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
  rowTwoCols: {
    flexDirection: 'row',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillBtnActive: {
    backgroundColor: AZUL_REY,
    borderColor: AZUL_REY,
  },
  pillBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475511',
  },
  pillBtnTextActive: {
    color: BLANCO,
  },
  horizontalChips: {
    flexDirection: 'row',
    marginTop: 2,
  },
  chipBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipBtnActive: {
    backgroundColor: AZUL_REY,
    borderColor: AZUL_REY,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: BLANCO,
    fontWeight: '800',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLANCO,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  eyeToggleBtn: {
    paddingHorizontal: 12,
  },
  eyeToggleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: AZUL_REY,
  },
  consentBox: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: BLANCO,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: AZUL_REY,
    borderColor: AZUL_REY,
  },
  checkboxCheck: {
    color: BLANCO,
    fontSize: 12,
    fontWeight: '900',
  },
  consentText: {
    flex: 1,
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  generalErrorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  generalErrorText: {
    color: ROJO,
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: AZUL_REY,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: AZUL_REY,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    color: BLANCO,
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
