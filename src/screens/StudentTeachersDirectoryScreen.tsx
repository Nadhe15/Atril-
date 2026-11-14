// src/screens/StudentTeachersDirectoryScreen.tsx
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
  PerfilDocenteAtril,
  SolicitudContactoDocente,
  Usuario,
} from '../types/atril.types';
import {
  FAMILIAS_E_INSTRUMENTOS_FILTRO,
  filtrarDocentesAcreditados,
} from '../services/teacherDirectoryService';

interface StudentTeachersDirectoryScreenProps {
  usuarioActual: Usuario;
  docentes: PerfilDocenteAtril[];
  onSendContactRequest: (solicitud: SolicitudContactoDocente) => void;
  onLogout: () => void;
}

const obtenerIniciales = (nombre: string): string => {
  const limpio = nombre.replace(/^(Prof\.?|Mtro\.?)\s*/i, '').trim();
  const partes = limpio.split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase();
};

export default function StudentTeachersDirectoryScreen({
  usuarioActual,
  docentes,
  onSendContactRequest,
  onLogout,
}: StudentTeachersDirectoryScreenProps) {
  const [busquedaInstrumento, setBusquedaInstrumento] = useState<string>('');
  const [instrumentoFiltro, setInstrumentoFiltro] = useState<string>('Todos');
  const [docenteSeleccionado, setDocenteSeleccionado] =
    useState<PerfilDocenteAtril | null>(null);

  // Estado dentro del Perfil del Docente seleccionado
  const [instrumentoElegidoAlumno, setInstrumentoElegidoAlumno] =
    useState<string>('');
  const [representadoActivoIdx, setRepresentadoActivoIdx] = useState<number>(0);
  const [mensajeContacto, setMensajeContacto] = useState<string>(
    'Hola profesor(a), me gustaría recibir información para aprender a tocar este instrumento con usted.'
  );
  const [confirmacionContacto, setConfirmacionContacto] = useState<
    string | null
  >(null);

  const docentesFiltrados = filtrarDocentesAcreditados(
    docentes,
    busquedaInstrumento,
    instrumentoFiltro
  );

  const abrirPerfilDocente = (docente: PerfilDocenteAtril) => {
    setDocenteSeleccionado(docente);
    setInstrumentoElegidoAlumno(
      docente.instrumentos_certificados[0] || docente.instrumento_principal
    );
    setConfirmacionContacto(null);
  };

  const handleContactarDocente = () => {
    if (!docenteSeleccionado) return;

    const tieneRepresentados =
      !usuarioActual.es_mayor_edad &&
      usuarioActual.representados &&
      usuarioActual.representados.length > 0;

    const nombreBeneficiario = tieneRepresentados
      ? `${usuarioActual.representados![representadoActivoIdx]?.nombre_completo} (${
          usuarioActual.representados![representadoActivoIdx]?.edad
        } años — Representado)`
      : `${usuarioActual.nombre_completo} (Estudiante Mayor de Edad)`;

    const nuevaSolicitud: SolicitudContactoDocente = {
      id: `sol-${Date.now()}`,
      docente_id: docenteSeleccionado.id,
      nombre_docente: docenteSeleccionado.nombre_completo,
      instrumento_seleccionado:
        instrumentoElegidoAlumno || docenteSeleccionado.instrumento_principal,
      nombre_solicitante: usuarioActual.nombre_completo,
      beneficiario_alumno: nombreBeneficiario,
      mensaje_consulta:
        mensajeContacto.trim() ||
        'Interesado en formación musical en este instrumento.',
      fecha_solicitud: 'Hoy • En espera de verificación de canal de contacto',
      estado: 'PENDIENTE_VERIFICACION',
    };

    onSendContactRequest(nuevaSolicitud);
    setConfirmacionContacto(
      `✓ Solicitud de contacto registrada para ${docenteSeleccionado.nombre_completo} en el instrumento "${nuevaSolicitud.instrumento_seleccionado}". (Nota: El mecanismo definitivo de verificación y contacto directo entre alumno y docente se encuentra en definición con Fundaoboe).`
    );
  };

  // =========================================================================
  // VISTA DETALLE: PERFIL DEL DOCENTE (AL PULSAR UN DOCENTE DE LA LISTA)
  // =========================================================================
  if (docenteSeleccionado) {
    const tieneRepresentados =
      !usuarioActual.es_mayor_edad &&
      usuarioActual.representados &&
      usuarioActual.representados.length > 0;

    return (
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setDocenteSeleccionado(null)}
        >
          <Text style={styles.backButtonText}>
            ← Volver a la sección de Docentes
          </Text>
        </TouchableOpacity>

        {/* Encabezado del Perfil del Docente */}
        <View style={styles.teacherHeroBanner}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>
                {obtenerIniciales(docenteSeleccionado.nombre_completo)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.verifiedPillGold}>
                <Text style={styles.verifiedPillGoldText}>
                  ✓ MÚSICO VERIFICADO FUNDAOBOE
                </Text>
              </View>
              <Text style={styles.heroTeacherName}>
                {docenteSeleccionado.nombre_completo}
              </Text>
              <Text style={styles.heroTeacherMeta}>
                {docenteSeleccionado.anos_experiencia} años de experiencia musical y pedagógica
              </Text>
            </View>
          </View>

          <View style={styles.heroInstrumentHighlight}>
            <Text style={styles.heroInstrumentLabel}>
              INSTRUMENTO PRINCIPAL QUE TOCA:
            </Text>
            <Text style={styles.heroInstrumentValue}>
              🎼 {docenteSeleccionado.instrumento_principal}
            </Text>
          </View>
        </View>

        {/* Acreditación, Dónde Estudió y Trayectoria */}
        <View style={styles.card}>
          <Text style={styles.sectionKicker}>
            ACREDITACIÓN Y TRAYECTORIA MUSICAL
          </Text>
          <Text style={styles.sectionTitle}>
            Formación, Conservatorio y Certificaciones
          </Text>

          <View style={styles.institutionBox}>
            <Text style={styles.institutionLabel}>
              Dónde estudió / Agrupación Sinfónica:
            </Text>
            <Text style={styles.institutionValue}>
              🏛️ {docenteSeleccionado.orquesta_o_conservatorio}
            </Text>
          </View>

          <Text style={styles.bodyParagraph}>
            {docenteSeleccionado.trayectoria_biografia}
          </Text>

          <Text style={styles.subTitle}>
            Avales y Certificaciones Verificadas por Fundaoboe:
          </Text>
          {docenteSeleccionado.certificaciones_avales.map((aval, idx) => (
            <View key={idx} style={styles.credentialRow}>
              <Text style={styles.credentialCheck}>✓</Text>
              <Text style={styles.credentialText}>{aval}</Text>
            </View>
          ))}
        </View>

        {/* Instrumentos en los que está certificado (Selección por el Alumno) */}
        <View style={styles.card}>
          <Text style={styles.sectionKicker}>
            INSTRUMENTOS CERTIFICADOS DEL DOCENTE
          </Text>
          <Text style={styles.sectionTitle}>
            ¿Qué instrumento deseas aprender con este docente?
          </Text>
          <Text style={styles.bodyParagraph}>
            Selecciona uno de los instrumentos en los que {docenteSeleccionado.nombre_completo} está certificado para enseñar:
          </Text>

          <View style={styles.certifiedInstrumentsList}>
            {docenteSeleccionado.instrumentos_certificados.map((inst, i) => {
              const activo = instrumentoElegidoAlumno === inst;
              return (
                <TouchableOpacity
                  key={`${inst}-${i}`}
                  style={[
                    styles.selectInstrumentBtn,
                    activo && styles.selectInstrumentBtnActive,
                  ]}
                  onPress={() => setInstrumentoElegidoAlumno(inst)}
                >
                  <Text
                    style={[
                      styles.selectInstrumentText,
                      activo && styles.selectInstrumentTextActive,
                    ]}
                  >
                    🎵 {inst}
                  </Text>
                  <Text
                    style={[
                      styles.selectInstrumentBadge,
                      activo && styles.selectInstrumentBadgeActive,
                    ]}
                  >
                    {activo ? '✓ Seleccionado' : 'Elegir'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sección de Contacto con el Docente (En definición de verificación) */}
        <View style={styles.card}>
          <Text style={styles.sectionKicker}>
            CONEXIÓN ENTRE ALUMNO Y DOCENTE
          </Text>
          <Text style={styles.sectionTitle}>
            Contactarse con {docenteSeleccionado.nombre_completo}
          </Text>

          <View style={styles.pendingDefinitionNotice}>
            <Text style={styles.pendingDefinitionTitle}>
              ℹ️ Canal de contacto directo en fase de definición institucional
            </Text>
            <Text style={styles.pendingDefinitionDesc}>
              En ATRIL no se venden paquetes ni cursos preempaquetados: la plataforma conecta al estudiante con el docente acreditado para que ambos acuerden directamente los detalles de su formación. El protocolo definitivo de verificación de contacto se encuentra en ajuste con Fundaoboe.
            </Text>
          </View>

          {tieneRepresentados && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.fieldLabel}>
                Selecciona para cuál representado menor realizas la consulta:
              </Text>
              <View style={styles.childrenChipsRow}>
                {usuarioActual.representados!.map((rep, idx) => (
                  <TouchableOpacity
                    key={rep.id}
                    style={[
                      styles.filterChip,
                      representadoActivoIdx === idx && styles.filterChipActive,
                    ]}
                    onPress={() => setRepresentadoActivoIdx(idx)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        representadoActivoIdx === idx &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      👦 {rep.nombre_completo} ({rep.edad} años)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.fieldLabel}>
              Instrumento seleccionado para consultar:
            </Text>
            <View style={styles.selectedInstrumentBanner}>
              <Text style={styles.selectedInstrumentBannerText}>
                🎼 {instrumentoElegidoAlumno}
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.fieldLabel}>
              Mensaje de presentación para el docente:
            </Text>
            <TextInput
              style={styles.textArea}
              value={mensajeContacto}
              onChangeText={setMensajeContacto}
              multiline
              placeholder="Escribe tu consulta para el docente..."
              placeholderTextColor="#64748B"
            />
          </View>

          {confirmacionContacto && (
            <View style={styles.successBox}>
              <Text style={styles.successBoxText}>{confirmacionContacto}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContactarDocente}
          >
            <Text style={styles.primaryButtonText}>
              📩 Contactar al Docente ({instrumentoElegidoAlumno}) →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // =========================================================================
  // VISTA PRINCIPAL DEL ALUMNO: SECCIÓN "DOCENTES" (BÚSQUEDA POR INSTRUMENTO)
  // =========================================================================
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Cabecera de bienvenida del Alumno / Representante */}
      <View style={styles.studentTopHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.studentRoleLabel}>
            {usuarioActual.es_mayor_edad === false
              ? 'CUENTA DE PADRE / REPRESENTANTE LEGAL'
              : 'CUENTA DE ALUMNO / ESTUDIANTE'}
          </Text>
          <Text style={styles.studentNameTitle}>
            Hola, {usuarioActual.nombre_completo}
          </Text>
          {usuarioActual.es_mayor_edad === false &&
            usuarioActual.representados &&
            usuarioActual.representados.length > 0 && (
              <Text style={styles.studentChildrenMeta}>
                Representados registrados:{' '}
                {usuarioActual.representados
                  .map((r) => `${r.nombre_completo} (${r.edad} años)`)
                  .join(', ')}
              </Text>
            )}
        </View>

        <TouchableOpacity style={styles.smallLogoutBtn} onPress={onLogout}>
          <Text style={styles.smallLogoutBtnText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Título Principal: DOCENTES (Sustituye al antiguo Catálogo de Clases) */}
      <View style={styles.directoryBanner}>
        <Text style={styles.directoryBadge}>SECCIÓN OFICIAL · FUNDAOBOE</Text>
        <Text style={styles.directoryTitle}>Docentes Acreditados</Text>
        <Text style={styles.directorySubtitle}>
          Busca el instrumento que quieres aprender a tocar, explora los perfiles de los maestros verificados por Fundaoboe y conéctate con ellos.
        </Text>
      </View>

      {/* Buscador por Instrumento o Nombre del Docente */}
      <View style={styles.searchCard}>
        <Text style={styles.fieldLabel}>
          🔍 Buscar docente por el instrumento que deseas aprender:
        </Text>
        <View style={styles.searchInputRow}>
          <TextInput
            style={[styles.searchInput, { flex: 1 }]}
            value={busquedaInstrumento}
            onChangeText={setBusquedaInstrumento}
            placeholder="Ej. Oboe, Guitarra Clásica, Cuatro, Violín, Clarinete..."
            placeholderTextColor="#64748B"
          />
          {busquedaInstrumento.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => setBusquedaInstrumento('')}
            >
              <Text style={styles.clearBtnText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Chips de Filtro Rápido por Instrumento */}
        <Text style={[styles.fieldLabel, { marginTop: 10, marginBottom: 6 }]}>
          Filtrar por instrumento:
        </Text>
        <View style={styles.filtersWrap}>
          {FAMILIAS_E_INSTRUMENTOS_FILTRO.map((inst) => {
            const activo = instrumentoFiltro === inst;
            return (
              <TouchableOpacity
                key={inst}
                style={[styles.filterChip, activo && styles.filterChipActive]}
                onPress={() => setInstrumentoFiltro(inst)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activo && styles.filterChipTextActive,
                  ]}
                >
                  {inst}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Encabezado de Conteo de Docentes */}
      <View style={styles.countHeaderRow}>
        <Text style={styles.countTitle}>
          Perfiles de Docentes Disponibles ({docentesFiltrados.length})
        </Text>
      </View>

      {/* Lista de Perfiles de Docentes */}
      {docentesFiltrados.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardTitle}>
            No se encontraron docentes para ese instrumento
          </Text>
          <Text style={styles.emptyCardSub}>
            Prueba seleccionando &quot;Todos&quot; o buscando otro instrumento como Oboe, Guitarra, Cuatro, Fagot o Violín.
          </Text>
        </View>
      ) : (
        docentesFiltrados.map((docente) => {
          const iniciales = obtenerIniciales(docente.nombre_completo);
          return (
            <View key={docente.id} style={styles.teacherCard}>
              <View style={styles.teacherCardTop}>
                <View style={styles.teacherAvatar}>
                  <Text style={styles.teacherAvatarText}>{iniciales}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.verifiedRow}>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>
                        ✓ MÚSICO VERIFICADO FUNDAOBOE
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.teacherCardName}>
                    {docente.nombre_completo}
                  </Text>
                  <Text style={styles.teacherMainInstrument}>
                    🎼 Instrumento principal: {docente.instrumento_principal}
                  </Text>
                  <Text style={styles.teacherInstitution}>
                    🏛️ {docente.orquesta_o_conservatorio}
                  </Text>
                </View>
              </View>

              {/* Instrumentos en los que está certificado */}
              <View style={styles.certifiedBlock}>
                <Text style={styles.certifiedBlockTitle}>
                  Instrumentos en los que está certificado:
                </Text>
                <View style={styles.certifiedTagsWrap}>
                  {docente.instrumentos_certificados.map((inst, idx) => (
                    <View key={`${docente.id}-${idx}`} style={styles.certTag}>
                      <Text style={styles.certTagText}>🎵 {inst}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <Text style={styles.teacherBioPreview} numberOfLines={2}>
                {docente.trayectoria_biografia}
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => abrirPerfilDocente(docente)}
              >
                <Text style={styles.primaryButtonText}>
                  Ver Perfil del Docente y Contactar →
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const AZUL_REY = '#0047AB';
const AZUL_NOCHE = '#0A192F';
const BORDE_ALTO_CONTRASTE = '#475569';

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 40,
  },
  studentTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    marginBottom: 14,
    gap: 10,
  },
  studentRoleLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: AZUL_REY,
    letterSpacing: 0.3,
  },
  studentNameTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  studentChildrenMeta: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#047857',
    marginTop: 2,
  },
  smallLogoutBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: AZUL_REY,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallLogoutBtnText: {
    color: AZUL_REY,
    fontSize: 13,
    fontWeight: '900',
  },
  directoryBanner: {
    backgroundColor: AZUL_NOCHE,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: AZUL_REY,
  },
  directoryBadge: {
    color: '#FFBF00',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  directoryTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  directorySubtitle: {
    color: '#B3D1FF',
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: AZUL_NOCHE,
    marginBottom: 6,
  },
  searchInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: AZUL_NOCHE,
    fontWeight: '600',
  },
  clearBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: AZUL_REY,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  clearBtnText: {
    color: AZUL_REY,
    fontSize: 13,
    fontWeight: '800',
  },
  filtersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterChipActive: {
    backgroundColor: AZUL_REY,
    borderColor: AZUL_REY,
  },
  filterChipText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  countHeaderRow: {
    marginBottom: 10,
  },
  countTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    alignItems: 'center',
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 6,
  },
  emptyCardSub: {
    fontSize: 13.5,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 19,
  },
  teacherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    marginBottom: 16,
  },
  teacherCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 12,
  },
  teacherAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: AZUL_REY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AZUL_NOCHE,
  },
  teacherAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  verifiedRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1.5,
    borderColor: '#047857',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: '#065F46',
    fontSize: 10.5,
    fontWeight: '900',
  },
  teacherCardName: {
    fontSize: 18.5,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 2,
  },
  teacherMainInstrument: {
    fontSize: 14.5,
    fontWeight: '800',
    color: AZUL_REY,
    marginBottom: 2,
  },
  teacherInstitution: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  certifiedBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    marginBottom: 10,
  },
  certifiedBlockTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 6,
  },
  certifiedTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  certTag: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: AZUL_REY,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  certTagText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
  teacherBioPreview: {
    fontSize: 13.5,
    color: '#1E293B',
    lineHeight: 19,
    marginBottom: 12,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: AZUL_REY,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AZUL_NOCHE,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: AZUL_REY,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: AZUL_REY,
    fontSize: 14,
    fontWeight: '900',
  },
  teacherHeroBanner: {
    backgroundColor: AZUL_NOCHE,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: AZUL_REY,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFBF00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroAvatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  verifiedPillGold: {
    backgroundColor: '#FFBF00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  verifiedPillGoldText: {
    color: AZUL_NOCHE,
    fontSize: 10.5,
    fontWeight: '900',
  },
  heroTeacherName: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 2,
  },
  heroTeacherMeta: {
    color: '#B3D1FF',
    fontSize: 13,
    fontWeight: '600',
  },
  heroInstrumentHighlight: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFBF00',
  },
  heroInstrumentLabel: {
    color: '#B3D1FF',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroInstrumentValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    marginBottom: 16,
  },
  sectionKicker: {
    fontSize: 11.5,
    fontWeight: '900',
    color: AZUL_REY,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 10,
  },
  institutionBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: AZUL_REY,
    marginBottom: 10,
  },
  institutionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: AZUL_REY,
    marginBottom: 2,
  },
  institutionValue: {
    fontSize: 14.5,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  bodyParagraph: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 8,
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 6,
  },
  credentialCheck: {
    color: '#047857',
    fontSize: 15,
    fontWeight: '900',
  },
  credentialText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: AZUL_NOCHE,
  },
  certifiedInstrumentsList: {
    gap: 8,
  },
  selectInstrumentBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  selectInstrumentBtnActive: {
    backgroundColor: AZUL_REY,
    borderColor: AZUL_REY,
  },
  selectInstrumentText: {
    fontSize: 15,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  selectInstrumentTextActive: {
    color: '#FFFFFF',
  },
  selectInstrumentBadge: {
    fontSize: 12.5,
    fontWeight: '800',
    color: AZUL_REY,
  },
  selectInstrumentBadgeActive: {
    color: '#FFBF00',
  },
  pendingDefinitionNotice: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#92400E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  pendingDefinitionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#92400E',
    marginBottom: 4,
  },
  pendingDefinitionDesc: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
    fontWeight: '600',
  },
  childrenChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedInstrumentBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: AZUL_REY,
    borderRadius: 10,
    padding: 12,
  },
  selectedInstrumentBannerText: {
    fontSize: 15,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontSize: 14.5,
    color: AZUL_NOCHE,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#047857',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  successBoxText: {
    color: '#065F46',
    fontSize: 13.5,
    fontWeight: '800',
    lineHeight: 19,
  },
});
