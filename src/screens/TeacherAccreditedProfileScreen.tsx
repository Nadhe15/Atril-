// src/screens/TeacherAccreditedProfileScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  ModalidadEnsenanza,
  PerfilDocenteAtril,
  SolicitudContactoDocente,
} from '../types/atril.types';
import { TeacherTabKey } from '../components/BottomTabBar';

interface TeacherAccreditedProfileScreenProps {
  perfilDocente: PerfilDocenteAtril;
  solicitudesContacto: SolicitudContactoDocente[];
  activeTab?: TeacherTabKey;
  onSelectTab?: (tab: TeacherTabKey) => void;
  onUpdateTeacherProfile: (actualizado: PerfilDocenteAtril) => void;
  onLogout: () => void;
}

const MODALIDADES_DISPONIBLES: ModalidadEnsenanza[] = [
  'Presencial Caracas',
  'Online (Zoom)',
  'Híbrido',
];

const BLOQUES_SEMANALES_INICIALES = [
  'Lunes y Miércoles • 03:00 PM a 06:00 PM',
  'Martes y Jueves • 09:00 AM a 12:00 PM',
  'Sábados • 10:00 AM a 01:00 PM',
];

const obtenerIniciales = (nombre: string): string => {
  const limpio = nombre.replace(/^(Prof\.?|Mtro\.?)\s*/i, '').trim();
  const partes = limpio.split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase();
};

export default function TeacherAccreditedProfileScreen({
  perfilDocente,
  solicitudesContacto,
  activeTab = 'perfil',
  onSelectTab,
  onUpdateTeacherProfile,
  onLogout,
}: TeacherAccreditedProfileScreenProps) {
  const [nuevoInstrumento, setNuevoInstrumento] = useState<string>('');
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState<string | null>(
    null
  );
  const [bloquesHorarios, setBloquesHorarios] = useState<string[]>(
    BLOQUES_SEMANALES_INICIALES
  );
  const [nuevoBloqueTexto, setNuevoBloqueTexto] = useState<string>('');
  const [solicitudesConfirmadasIds, setSolicitudesConfirmadasIds] = useState<
    string[]
  >([]);

  const handleAgregarInstrumentoCertificado = () => {
    const inst = nuevoInstrumento.trim();
    if (!inst) return;
    if (
      perfilDocente.instrumentos_certificados.some(
        (i) => i.toLowerCase() === inst.toLowerCase()
      )
    ) {
      setMensajeConfirmacion('Ese instrumento ya figura en tu lista certificada.');
      return;
    }

    const actualizado: PerfilDocenteAtril = {
      ...perfilDocente,
      instrumentos_certificados: [
        ...perfilDocente.instrumentos_certificados,
        inst,
      ],
    };
    onUpdateTeacherProfile(actualizado);
    setNuevoInstrumento('');
    setMensajeConfirmacion(
      `✓ Se agregó "${inst}" a tus instrumentos certificados en tu perfil de docente.`
    );
  };

  const toggleModalidadDocente = (mod: ModalidadEnsenanza) => {
    const existe = perfilDocente.modalidades.includes(mod);
    let nuevas = existe
      ? perfilDocente.modalidades.filter((m) => m !== mod)
      : [...perfilDocente.modalidades, mod];
    if (nuevas.length === 0) nuevas = ['Presencial Caracas'];
    onUpdateTeacherProfile({
      ...perfilDocente,
      modalidades: nuevas,
    });
  };

  const handleAgregarBloqueHorario = () => {
    if (!nuevoBloqueTexto.trim()) return;
    setBloquesHorarios((prev) => [...prev, nuevoBloqueTexto.trim()]);
    setNuevoBloqueTexto('');
  };

  const misSolicitudes = solicitudesContacto.filter(
    (s) => s.docente_id === perfilDocente.id
  );

  // =========================================================================
  // PESTAÑA 2 DEL DOCENTE: CONSULTAS DE ALUMNOS
  // =========================================================================
  if (activeTab === 'consultas') {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabHeaderBlock}>
          <Text style={styles.sectionKicker}>BANDEJA DEL PROFESOR ACREDITADO</Text>
          <Text style={styles.tabMainTitle}>
            Consultas de Alumnos ({misSolicitudes.length})
          </Text>
          <Text style={styles.bodyText}>
            Solicitudes enviadas por estudiantes y representantes interesados en tus cátedras certificadas:
          </Text>
        </View>

        {misSolicitudes.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Sin solicitudes pendientes</Text>
            <Text style={styles.bodyText}>
              Cuando un alumno busque tu instrumento en la sección de Docentes y solicite contactarte, aparecerá aquí inmediatamente.
            </Text>
          </View>
        ) : (
          misSolicitudes.map((sol) => {
            const confirmada = solicitudesConfirmadasIds.includes(sol.id);
            return (
              <View key={sol.id} style={styles.card}>
                <View style={styles.requestTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactRequestTitle}>
                      🎓 {sol.nombre_solicitante}
                    </Text>
                    <Text style={styles.contactRequestSub}>
                      Alumno beneficiario: {sol.beneficiario_alumno}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      confirmada && styles.statusBadgeConfirmed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        confirmada && styles.statusBadgeTextConfirmed,
                      ]}
                    >
                      {confirmada ? '✓ RECIBIDA' : 'PENDIENTE'}
                    </Text>
                  </View>
                </View>

                <View style={styles.instrumentRequestBanner}>
                  <Text style={styles.instrumentRequestText}>
                    🎼 Instrumento solicitado: {sol.instrumento_seleccionado}
                  </Text>
                  <Text style={styles.instrumentRequestDate}>
                    📅 {sol.fecha_solicitud}
                  </Text>
                </View>

                <Text style={styles.contactRequestMsg}>
                  &quot;{sol.mensaje_consulta}&quot;
                </Text>

                <TouchableOpacity
                  style={[
                    styles.confirmContactBtn,
                    confirmada && styles.confirmContactBtnDone,
                  ]}
                  onPress={() => {
                    if (!confirmada) {
                      setSolicitudesConfirmadasIds((prev) => [...prev, sol.id]);
                    }
                  }}
                >
                  <Text style={styles.confirmContactBtnText}>
                    {confirmada
                      ? '✓ Solicitud marcada como atendida'
                      : '✓ Confirmar Disponibilidad para este Alumno'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    );
  }

  // =========================================================================
  // PESTAÑA 3 DEL DOCENTE: HORARIOS Y MODALIDADES DE ENSEÑANZA
  // =========================================================================
  if (activeTab === 'horarios') {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabHeaderBlock}>
          <Text style={styles.sectionKicker}>CONFIGURACIÓN ACADÉMICA</Text>
          <Text style={styles.tabMainTitle}>Modalidades y Horarios</Text>
          <Text style={styles.bodyText}>
            Configura las modalidades y bloques horarios que verán los estudiantes al consultar tu perfil de docente:
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Modalidades que impartes</Text>
          <Text style={styles.bodyText}>
            Toca para activar o desactivar tus modalidades de clase disponibles:
          </Text>
          <View style={styles.instrumentsGrid}>
            {MODALIDADES_DISPONIBLES.map((mod) => {
              const activa = perfilDocente.modalidades.includes(mod);
              return (
                <TouchableOpacity
                  key={mod}
                  style={[
                    styles.instrumentPill,
                    !activa && {
                      backgroundColor: '#F8FAFC',
                      borderColor: '#CBD5E1',
                    },
                  ]}
                  onPress={() => toggleModalidadDocente(mod)}
                >
                  <Text style={styles.instrumentPillText}>
                    {mod === 'Presencial Caracas' ? '🏛️ ' : '💻 '}
                    {mod}
                  </Text>
                  <View
                    style={[
                      styles.certifiedMiniTag,
                      !activa && { backgroundColor: '#94A3B8' },
                    ]}
                  >
                    <Text style={styles.certifiedMiniTagText}>
                      {activa ? 'Activa' : 'Inactiva'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Bloques Horarios Referenciales
          </Text>
          {bloquesHorarios.map((b, idx) => (
            <View key={idx} style={styles.certRow}>
              <Text style={styles.certCheck}>🕒</Text>
              <Text style={styles.certText}>{b}</Text>
            </View>
          ))}

          <View style={[styles.addInstrumentBox, { marginTop: 10 }]}>
            <Text style={styles.fieldLabel}>Agregar nuevo bloque horario:</Text>
            <View style={styles.addInstrumentRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={nuevoBloqueTexto}
                onChangeText={setNuevoBloqueTexto}
                placeholder="Ej. Viernes • 02:00 PM a 05:00 PM"
                placeholderTextColor="#64748B"
              />
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleAgregarBloqueHorario}
              >
                <Text style={styles.addBtnText}>＋ Añadir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // =========================================================================
  // PESTAÑA 1 (POR DEFECTO AL INICIAR SESIÓN): MI PERFIL DE PROFESOR ACREDITADO
  // =========================================================================
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Cabecera del Perfil del Profesor Acreditado */}
      <View style={styles.profileBanner}>
        <View style={styles.topRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {obtenerIniciales(perfilDocente.nombre_completo)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.verifiedBadgeGold}>
              <Text style={styles.verifiedBadgeGoldText}>
                ✓ MÚSICO VERIFICADO Y ACREDITADO POR FUNDAOBOE
              </Text>
            </View>
            <Text style={styles.teacherName}>
              {perfilDocente.nombre_completo}
            </Text>
            <Text style={styles.teacherDocMeta}>
              C.I. {perfilDocente.cedula_identidad} • {perfilDocente.anos_experiencia} años de trayectoria
            </Text>
          </View>
        </View>

        {/* Destacado del Instrumento Principal que Toca */}
        <View style={styles.mainInstrumentBox}>
          <Text style={styles.mainInstrumentLabel}>
            INSTRUMENTO PRINCIPAL QUE TOCA:
          </Text>
          <Text style={styles.mainInstrumentValue}>
            🎼 {perfilDocente.instrumento_principal}
          </Text>
        </View>
      </View>

      {/* BLOQUE 1: ACREDITACIÓN OFICIAL DE MÚSICO VERIFICADO */}
      <View style={styles.card}>
        <Text style={styles.sectionKicker}>
          1. ACREDITACIÓN INSTITUCIONAL FUNDAOBOE
        </Text>
        <Text style={styles.sectionTitle}>
          Estado de Acreditación: Músico Verificado
        </Text>
        <View style={styles.accreditationStatusBox}>
          <Text style={styles.accreditationStatusTitle}>
            🏅 Docente Acreditado por el Comité de Revisión de Fundaoboe
          </Text>
          <Text style={styles.accreditationStatusDesc}>
            Tu identidad, Currículum Vitae y certificaciones sinfónicas/académicas han sido auditadas y aprobadas. Tu perfil es visible en la sección de Docentes para los alumnos.
          </Text>
        </View>

        <Text style={styles.subHeading}>
          Institución / Orquesta Sinfónica / Conservatorio:
        </Text>
        <Text style={styles.bodyText}>
          🏛️ {perfilDocente.orquesta_o_conservatorio}
        </Text>

        <Text style={[styles.subHeading, { marginTop: 10 }]}>
          Trayectoria y Formación Musical:
        </Text>
        <Text style={styles.bodyText}>
          {perfilDocente.trayectoria_biografia}
        </Text>
      </View>

      {/* BLOQUE 2: INSTRUMENTOS EN LOS QUE ESTÁ CERTIFICADO */}
      <View style={styles.card}>
        <Text style={styles.sectionKicker}>
          2. ESPECIALIDADES E INSTRUMENTOS AVALADOS
        </Text>
        <Text style={styles.sectionTitle}>
          Instrumentos en los que estás Certificado
        </Text>
        <Text style={styles.bodyText}>
          Instrumentos y cátedras musicales en los que cuentas con certificación verificada ante Fundaoboe:
        </Text>

        <View style={styles.instrumentsGrid}>
          {perfilDocente.instrumentos_certificados.map((inst, index) => (
            <View key={`${inst}-${index}`} style={styles.instrumentPill}>
              <Text style={styles.instrumentPillText}>🎵 {inst}</Text>
              <View style={styles.certifiedMiniTag}>
                <Text style={styles.certifiedMiniTagText}>Certificado</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Agregar nuevo instrumento certificado */}
        <View style={styles.addInstrumentBox}>
          <Text style={styles.fieldLabel}>
            Declarar otro instrumento en el que posees certificación:
          </Text>
          <View style={styles.addInstrumentRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={nuevoInstrumento}
              onChangeText={setNuevoInstrumento}
              placeholder="Ej. Flauta Dulce, Contrafagot, Armonía..."
              placeholderTextColor="#64748B"
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAgregarInstrumentoCertificado}
            >
              <Text style={styles.addBtnText}>＋ Agregar</Text>
            </TouchableOpacity>
          </View>
          {mensajeConfirmacion && (
            <Text style={styles.confirmText}>{mensajeConfirmacion}</Text>
          )}
        </View>
      </View>

      {/* BLOQUE 3: CERTIFICACIONES Y DOCUMENTOS VALIDADOS */}
      <View style={styles.card}>
        <Text style={styles.sectionKicker}>
          3. EXPEDIENTE Y CREDENCIALES MUSICALES
        </Text>
        <Text style={styles.sectionTitle}>
          Certificaciones y Documentos Aprobados
        </Text>

        {perfilDocente.certificaciones_avales.map((cert, i) => (
          <View key={i} style={styles.certRow}>
            <Text style={styles.certCheck}>✓</Text>
            <Text style={styles.certText}>{cert}</Text>
          </View>
        ))}

        <View style={styles.docsSummaryGrid}>
          <View style={styles.docSummaryItem}>
            <Text style={styles.docSummaryLabel}>Cédula de Identidad</Text>
            <Text style={styles.docSummaryValue}>
              ✓ {perfilDocente.documentos.cedulaIdentidad.nombreArchivo}
            </Text>
          </View>
          <View style={styles.docSummaryItem}>
            <Text style={styles.docSummaryLabel}>Foto de Perfil</Text>
            <Text style={styles.docSummaryValue}>
              ✓ {perfilDocente.documentos.fotoPersonal.nombreArchivo}
            </Text>
          </View>
          <View style={styles.docSummaryItem}>
            <Text style={styles.docSummaryLabel}>Currículum Vitae (PDF)</Text>
            <Text style={styles.docSummaryValue}>
              ✓ {perfilDocente.documentos.curriculumVitae.nombreArchivo}
            </Text>
          </View>
          <View style={styles.docSummaryItem}>
            <Text style={styles.docSummaryLabel}>
              Certificados Sinfónicos / Conservatorio (PDF)
            </Text>
            <Text style={styles.docSummaryValue}>
              ✓ {perfilDocente.documentos.certificacionesMusicales.nombreArchivo}
            </Text>
          </View>
        </View>
      </View>

      {/* Acceso rápido a Consultas de Alumnos */}
      <View style={styles.card}>
        <Text style={styles.sectionKicker}>4. SOLICITUDES DE ESTUDIANTES</Text>
        <Text style={styles.sectionTitle}>
          Consultas Recibidas ({misSolicitudes.length})
        </Text>
        <Text style={styles.bodyText}>
          Tienes {misSolicitudes.length} consulta(s) de alumnos interesados en tus instrumentos certificados.
        </Text>
        {onSelectTab && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => onSelectTab('consultas')}
          >
            <Text style={[styles.addBtnText, { textAlign: 'center' }]}>
              📩 Abrir Bandeja de Consultas de Alumnos →
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>
          ← Cerrar Sesión / Cambiar de Usuario
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const AZUL_REY = '#1D4ED8';
const AZUL_NOCHE = '#0A192F';

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 32,
    backgroundColor: '#F8FAFC',
  },
  tabHeaderBlock: {
    marginBottom: 14,
  },
  tabMainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 4,
  },
  profileBanner: {
    backgroundColor: AZUL_NOCHE,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: AZUL_REY,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarInitials: {
    fontSize: 21,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  verifiedBadgeGold: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  verifiedBadgeGoldText: {
    color: AZUL_NOCHE,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  teacherName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  teacherDocMeta: {
    color: '#93C5FD',
    fontSize: 12.5,
    fontWeight: '600',
  },
  mainInstrumentBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FBBF24',
  },
  mainInstrumentLabel: {
    color: '#93C5FD',
    fontSize: 10.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  mainInstrumentValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionKicker: {
    fontSize: 10.5,
    fontWeight: '800',
    color: AZUL_REY,
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
    marginBottom: 8,
  },
  accreditationStatusBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  accreditationStatusTitle: {
    color: '#065F46',
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  accreditationStatusDesc: {
    color: '#065F46',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  subHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 8,
  },
  instrumentsGrid: {
    gap: 8,
    marginTop: 4,
    marginBottom: 14,
  },
  instrumentPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: AZUL_REY,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  instrumentPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
  certifiedMiniTag: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  certifiedMiniTagText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  addInstrumentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
    marginBottom: 6,
  },
  addInstrumentRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: AZUL_NOCHE,
  },
  addBtn: {
    backgroundColor: AZUL_REY,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  confirmText: {
    color: '#059669',
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 6,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  certCheck: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '900',
  },
  certText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: AZUL_NOCHE,
    lineHeight: 18,
  },
  docsSummaryGrid: {
    gap: 8,
    marginTop: 8,
  },
  docSummaryItem: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  docSummaryLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: AZUL_REY,
  },
  docSummaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: AZUL_NOCHE,
    marginTop: 2,
  },
  requestTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  contactRequestTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
  contactRequestSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeConfirmed: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  statusBadgeTextConfirmed: {
    color: '#059669',
  },
  instrumentRequestBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  instrumentRequestText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: AZUL_REY,
  },
  instrumentRequestDate: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 2,
  },
  contactRequestMsg: {
    fontSize: 13,
    color: '#1E293B',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  confirmContactBtn: {
    backgroundColor: AZUL_REY,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  confirmContactBtnDone: {
    backgroundColor: '#059669',
  },
  confirmContactBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DC2626',
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
