// src/screens/StudentProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { PerfilUsuarioAtril } from '../services/authService';
import { useParentProfiles } from '../hooks/useParentProfiles';

export interface StudentProfileScreenProps {
  usuario: PerfilUsuarioAtril | null;
  tutorId: string;
  onLogout: () => void;
}

export default function StudentProfileScreen({
  usuario,
  tutorId,
  onLogout,
}: StudentProfileScreenProps) {
  const esApoderado = usuario?.tipo_estudiante === 'apoderado';
  const {
    subperfiles,
    alumnoActivo,
    cargarSubperfiles,
    seleccionarHijoPorId,
    registrarNuevoHijo,
  } = useParentProfiles();

  const [nombreHijo, setNombreHijo] = useState<string>('');
  const [edadHijo, setEdadHijo] = useState<string>('10');
  const [instrumentoHijo, setInstrumentoHijo] = useState<string>('Oboe');
  const [mensajeHijo, setMensajeHijo] = useState<string | null>(null);

  useEffect(() => {
    if (esApoderado) {
      cargarSubperfiles(tutorId);
    }
  }, [esApoderado, tutorId, cargarSubperfiles]);

  const handleAgregarHijo = async () => {
    if (!nombreHijo.trim() || nombreHijo.trim().length < 2) {
      setMensajeHijo('⚠ Ingresa el nombre y apellido de tu hijo.');
      return;
    }
    const edadNum = parseInt(edadHijo, 10);
    if (isNaN(edadNum) || edadNum < 4 || edadNum > 17) {
      setMensajeHijo('⚠ La edad del representado menor debe estar entre 4 y 17 años.');
      return;
    }

    const creado = await registrarNuevoHijo({
      tutorId,
      nombre_menor: nombreHijo.trim(),
      edad_anos: edadNum,
      instrumento: instrumentoHijo.trim() || 'Oboe',
      nivel: 'iniciacion',
    });

    setNombreHijo('');
    setMensajeHijo(`✓ Hijo registrado: ${creado.nombre_menor} (${creado.instrumento})`);
  };

  const nombreMostrar = usuario?.nombre_completo || 'Estudiante ATRIL';
  const emailMostrar = usuario?.email || 'Sin correo registrado';
  const cedulaMostrar = usuario?.cedula_identidad || 'No especificada';

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.microTag}>MI CUENTA ATRIL</Text>
        <Text style={styles.title}>Resumen de Perfil</Text>
        <Text style={styles.subtitle}>
          Datos de titularidad sincronizados con Supabase Auth.
        </Text>
      </View>

      {/* Ficha de Datos del Titular */}
      <View style={styles.card}>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>
            {esApoderado
              ? '👨‍👧 PADRE / REPRESENTANTE LEGAL (A1)'
              : '🎓 ESTUDIANTE MAYOR DE EDAD (A0)'}
          </Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.rowLabel}>Nombre completo:</Text>
          <Text style={styles.rowValue}>{nombreMostrar}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.rowLabel}>Correo electrónico:</Text>
          <Text style={styles.rowValue}>{emailMostrar}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.rowLabel}>Cédula / Documento:</Text>
          <Text style={styles.rowValue}>{cedulaMostrar}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.rowLabel}>Modalidad de cuenta:</Text>
          <Text style={styles.rowValue}>
            {esApoderado
              ? 'Gestión parental de menores representados'
              : 'Autonomía académica y financiera directa (+18)'}
          </Text>
        </View>
      </View>

      {/* SECCIÓN EXCLUSIVA PARA PADRE / REPRESENTANTE: Gestión de Hijos con Nombres Propios */}
      {esApoderado && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mis Hijos / Representados</Text>
          <Text style={styles.helperText}>
            Agrega el nombre real de cada hijo menor de edad y selecciona para cuál de ellos vas a reservar clases:
          </Text>

          {subperfiles.length === 0 ? (
            <View style={styles.emptyChildrenBox}>
              <Text style={styles.emptyChildrenText}>
                Aún no has agregado ningún hijo. Escribe sus datos abajo para registrarlo.
              </Text>
            </View>
          ) : (
            <View style={styles.childrenList}>
              {subperfiles.map((hijo) => {
                const esActivo = alumnoActivo?.id === hijo.id;
                return (
                  <TouchableOpacity
                    key={hijo.id}
                    style={[styles.childItem, esActivo && styles.childItemActive]}
                    onPress={() => seleccionarHijoPorId(hijo.id)}
                  >
                    <View>
                      <Text style={styles.childName}>
                        {hijo.nombre_menor} ({hijo.edad_anos} años)
                      </Text>
                      <Text style={styles.childSub}>
                        Instrumento: {hijo.instrumento}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.activeChildBadge,
                        esActivo && styles.activeChildBadgeSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.activeChildBadgeText,
                          esActivo && { color: BLANCO },
                        ]}
                      >
                        {esActivo ? '✓ Activo' : 'Elegir'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Formulario para Agregar Nuevo Hijo */}
          <View style={styles.addFormDivider} />
          <Text style={styles.subFormTitle}>＋ Agregar Nuevo Hijo / Representado</Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre y Apellido del menor (ej. Valentina Gómez)"
            placeholderTextColor="#94A3B8"
            value={nombreHijo}
            onChangeText={setNombreHijo}
          />

          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Edad (4-17)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={edadHijo}
              onChangeText={setEdadHijo}
            />
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Instrumento (ej. Oboe, Fagot)"
              placeholderTextColor="#94A3B8"
              value={instrumentoHijo}
              onChangeText={setInstrumentoHijo}
            />
          </View>

          {mensajeHijo && (
            <Text style={styles.feedbackText}>{mensajeHijo}</Text>
          )}

          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.85}
            onPress={handleAgregarHijo}
          >
            <Text style={styles.addBtnText}>Guardar Hijo en Mi Cuenta</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botón Cerrar Sesión */}
      <TouchableOpacity
        style={styles.logoutFullBtn}
        activeOpacity={0.85}
        onPress={onLogout}
      >
        <Text style={styles.logoutFullBtnText}>Cerrar Sesión de Supabase Auth</Text>
      </TouchableOpacity>
    </View>
  );
}

const AZUL_REY = '#1D4ED8';
const AZUL_INSTITUCIONAL = '#1E40AF';
const AZUL_MARINO = '#0A192F';
const FONDO = '#F8FAFC';
const BLANCO = '#FFFFFF';
const VERDE = '#059669';
const ROJO = '#DC2626';

const styles = StyleSheet.create({
  container: {
    backgroundColor: FONDO,
  },
  headerBlock: {
    marginBottom: 14,
  },
  microTag: {
    fontSize: 10,
    fontWeight: '800',
    color: AZUL_REY,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: AZUL_MARINO,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  card: {
    backgroundColor: BLANCO,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  rolePill: {
    backgroundColor: '#DBEAFE',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 14,
  },
  rolePillText: {
    color: AZUL_INSTITUCIONAL,
    fontSize: 10.5,
    fontWeight: '800',
  },
  rowItem: {
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 14,
    color: AZUL_MARINO,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AZUL_MARINO,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  emptyChildrenBox: {
    backgroundColor: FONDO,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  emptyChildrenText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
  },
  childrenList: {
    gap: 8,
    marginBottom: 10,
  },
  childItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: FONDO,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
  },
  childItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: AZUL_REY,
  },
  childName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: AZUL_MARINO,
  },
  childSub: {
    fontSize: 11.5,
    color: '#64748B',
  },
  activeChildBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  activeChildBadgeSelected: {
    backgroundColor: AZUL_REY,
  },
  activeChildBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  addFormDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  subFormTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: AZUL_INSTITUCIONAL,
    marginBottom: 8,
  },
  input: {
    backgroundColor: FONDO,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '700',
    color: VERDE,
    marginBottom: 8,
  },
  addBtn: {
    backgroundColor: VERDE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addBtnText: {
    color: BLANCO,
    fontSize: 13,
    fontWeight: '800',
  },
  logoutFullBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: ROJO,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutFullBtnText: {
    color: ROJO,
    fontSize: 13,
    fontWeight: '800',
  },
});
