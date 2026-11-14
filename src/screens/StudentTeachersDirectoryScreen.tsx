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
  ModalidadEnsenanza,
  PerfilDocenteAtril,
  RepresentadoMenor,
  SolicitudContactoDocente,
  Usuario,
} from '../types/atril.types';
import {
  FAMILIAS_E_INSTRUMENTOS_FILTRO,
  filtrarDocentesAcreditados,
} from '../services/teacherDirectoryService';
import { StudentTabKey } from '../components/BottomTabBar';

interface StudentTeachersDirectoryScreenProps {
  usuarioActual: Usuario;
  docentes: PerfilDocenteAtril[];
  solicitudesEnviadas: SolicitudContactoDocente[];
  activeTab: StudentTabKey;
  onSelectTab: (tab: StudentTabKey) => void;
  onSendContactRequest: (solicitud: SolicitudContactoDocente) => void;
  onUpdateUsuario?: (usuarioActualizado: Usuario) => void;
  onLogout: () => void;
}

const DIAS_SEMANA_DISPONIBLES = [
  { id: 'lun', diaSemana: 'LUN', fechaCorta: 'Lun' },
  { id: 'mar', diaSemana: 'MAR', fechaCorta: 'Mar' },
  { id: 'mie', diaSemana: 'MIÉ', fechaCorta: 'Mié' },
  { id: 'jue', diaSemana: 'JUE', fechaCorta: 'Jue' },
  { id: 'vie', diaSemana: 'VIE', fechaCorta: 'Vie' },
  { id: 'sab', diaSemana: 'SÁB', fechaCorta: 'Sáb' },
];

const BLOQUES_HORARIOS_REFERENCIALES = [
  { id: 'h1', horaLabel: '09:00 AM', turno: 'Mañana' },
  { id: 'h2', horaLabel: '11:00 AM', turno: 'Mañana' },
  { id: 'h3', horaLabel: '03:00 PM', turno: 'Tarde' },
  { id: 'h4', horaLabel: '05:00 PM', turno: 'Tarde' },
];

const obtenerIniciales = (nombre: string): string => {
  const limpio = nombre.replace(/^(Prof\.?|Mtro\.?)\s*/i, '').trim();
  const partes = limpio.split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase();
};

export default function StudentTeachersDirectoryScreen({
  usuarioActual,
  docentes,
  solicitudesEnviadas,
  activeTab,
  onSelectTab,
  onSendContactRequest,
  onUpdateUsuario,
  onLogout,
}: StudentTeachersDirectoryScreenProps) {
  const [busquedaInstrumento, setBusquedaInstrumento] = useState<string>('');
  const [instrumentoFiltro, setInstrumentoFiltro] = useState<string>('Todos');
  const [modalidadFiltro, setModalidadFiltro] = useState<
    'TODOS' | ModalidadEnsenanza
  >('TODOS');

  const [docenteSeleccionado, setDocenteSeleccionado] =
    useState<PerfilDocenteAtril | null>(null);

  // Gestión de hijos representados para cuentas de Padre / Representante (A1)
  const [representadosLocales, setRepresentadosLocales] = useState<
    RepresentadoMenor[]
  >(
    usuarioActual.representados && usuarioActual.representados.length > 0
      ? usuarioActual.representados
      : [
          {
            id: 'rep-1',
            nombre_completo: 'Lucas Sanabria',
            edad: 11,
            filiacion: 'Padre / Madre',
            instrumento_interes: 'Oboe Sinfónico',
          },
        ]
  );
  const [representadoActivoIdx, setRepresentadoActivoIdx] = useState<number>(0);
  const [mostrarFormHijo, setMostrarFormHijo] = useState<boolean>(false);
  const [nuevoHijoNombre, setNuevoHijoNombre] = useState<string>('');
  const [nuevoHijoEdad, setNuevoHijoEdad] = useState<string>('10');
  const [nuevoHijoInstrumento, setNuevoHijoInstrumento] =
    useState<string>('Oboe');
  const [mensajeHijo, setMensajeHijo] = useState<string | null>(null);

  // Estado dentro del Perfil del Docente seleccionado
  const [instrumentoElegidoAlumno, setInstrumentoElegidoAlumno] =
    useState<string>('');
  const [modalidadPreferida, setModalidadPreferida] =
    useState<ModalidadEnsenanza>('Presencial Caracas');
  const [diaPreferido, setDiaPreferido] = useState<string>('MIÉ');
  const [horaPreferida, setHoraPreferida] = useState<string>('03:00 PM');
  const [mensajeContacto, setMensajeContacto] = useState<string>(
    'Hola profesor(a), me gustaría coordinar clases de este instrumento con usted.'
  );
  const [confirmacionContacto, setConfirmacionContacto] = useState<
    string | null
  >(null);

  const esRepresentante = usuarioActual.es_mayor_edad === false;
  const hijoActivo = representadosLocales[representadoActivoIdx] ?? representadosLocales[0];

  const alternarHijoActivo = () => {
    if (representadosLocales.length <= 1) {
      setMostrarFormHijo((prev) => !prev);
      return;
    }
    setRepresentadoActivoIdx((prev) => (prev + 1) % representadosLocales.length);
  };

  const handleAgregarHijo = () => {
    if (!nuevoHijoNombre.trim() || nuevoHijoNombre.trim().length < 2) {
      setMensajeHijo('Por favor escribe el nombre y apellido del representado.');
      return;
    }
    const edadNum = parseInt(nuevoHijoEdad, 10);
    if (isNaN(edadNum) || edadNum < 4 || edadNum > 17) {
      setMensajeHijo('La edad del representado debe estar entre 4 y 17 años.');
      return;
    }

    const nuevo: RepresentadoMenor = {
      id: `rep-${Date.now()}`,
      nombre_completo: nuevoHijoNombre.trim(),
      edad: edadNum,
      filiacion: 'Padre / Madre',
      instrumento_interes: nuevoHijoInstrumento.trim() || 'Oboe',
    };

    const nuevaLista = [...representadosLocales, nuevo];
    setRepresentadosLocales(nuevaLista);
    setRepresentadoActivoIdx(nuevaLista.length - 1);
    setNuevoHijoNombre('');
    setMostrarFormHijo(false);
    setMensajeHijo(`✓ Se agregó a ${nuevo.nombre_completo} como representado.`);

    if (onUpdateUsuario) {
      onUpdateUsuario({
        ...usuarioActual,
        representados: nuevaLista,
      });
    }
  };

  const docentesBase = filtrarDocentesAcreditados(
    docentes,
    busquedaInstrumento,
    instrumentoFiltro
  );

  const docentesFiltrados = docentesBase.filter((d) => {
    if (modalidadFiltro === 'TODOS') return true;
    return d.modalidades.includes(modalidadFiltro);
  });

  const abrirPerfilDocente = (docente: PerfilDocenteAtril) => {
    setDocenteSeleccionado(docente);
    setInstrumentoElegidoAlumno(
      docente.instrumentos_certificados[0] || docente.instrumento_principal
    );
    setModalidadPreferida(docente.modalidades[0] || 'Presencial Caracas');
    setConfirmacionContacto(null);
  };

  const handleContactarDocente = () => {
    if (!docenteSeleccionado) return;

    const nombreBeneficiario = esRepresentante && hijoActivo
      ? `${hijoActivo.nombre_completo} (${hijoActivo.edad} años — Representado)`
      : `${usuarioActual.nombre_completo} (Estudiante Mayor de Edad)`;

    const nuevaSolicitud: SolicitudContactoDocente = {
      id: `sol-${Date.now()}`,
      docente_id: docenteSeleccionado.id,
      nombre_docente: docenteSeleccionado.nombre_completo,
      instrumento_seleccionado:
        instrumentoElegidoAlumno || docenteSeleccionado.instrumento_principal,
      nombre_solicitante: usuarioActual.nombre_completo,
      beneficiario_alumno: nombreBeneficiario,
      mensaje_consulta: `${
        mensajeContacto.trim() || 'Interesado en formación musical.'
      } [Preferencia: ${modalidadPreferida} • ${diaPreferido} ${horaPreferida}]`,
      fecha_solicitud: `Hoy • ${modalidadPreferida} (${diaPreferido} ${horaPreferida})`,
      estado: 'PENDIENTE_VERIFICACION',
    };

    onSendContactRequest(nuevaSolicitud);
    setConfirmacionContacto(
      `✓ Solicitud enviada a ${docenteSeleccionado.nombre_completo} para la cátedra de "${nuevaSolicitud.instrumento_seleccionado}". Puedes hacerle seguimiento en la pestaña "Mis Consultas".`
    );
  };

  // =========================================================================
  // PESTAÑA 2: MIS CONSULTAS ENVIADAS A DOCENTES
  // =========================================================================
  if (activeTab === 'consultas') {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabHeaderBlock}>
          <Text style={styles.microTag}>SEGUIMIENTO DE SOLICITUDES</Text>
          <Text style={styles.tabMainTitle}>Mis Consultas a Docentes</Text>
          <Text style={styles.tabSubtitle}>
            Solicitudes de contacto e interés académico enviadas a los maestros acreditados por Fundaoboe.
          </Text>
        </View>

        {solicitudesEnviadas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              Aún no has enviado consultas a docentes
            </Text>
            <Text style={styles.emptySubtitle}>
              Explora la pestaña &quot;Docentes&quot;, selecciona el instrumento que deseas aprender y envía tu consulta al profesor.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 14, width: '100%' }]}
              onPress={() => onSelectTab('docentes')}
            >
              <Text style={styles.primaryButtonText}>
                Ir a Buscar Docentes →
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          solicitudesEnviadas.map((sol) => {
            const docObj = docentes.find((d) => d.id === sol.docente_id);
            return (
              <View key={sol.id} style={styles.consultaCard}>
                <View style={styles.consultaHeaderRow}>
                  <View style={styles.teacherAvatarCircle}>
                    <Text style={styles.teacherAvatarText}>
                      {obtenerIniciales(sol.nombre_docente)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teacherName}>{sol.nombre_docente}</Text>
                    <Text style={styles.teacherSpecialtyText}>
                      🎼 Instrumento: {sol.instrumento_seleccionado}
                    </Text>
                    <Text style={styles.teacherLocationText}>
                      🎓 Alumno: {sol.beneficiario_alumno}
                    </Text>
                  </View>
                  <View style={styles.statusPendingPill}>
                    <Text style={styles.statusPendingText}>EN GESTIÓN</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <Text style={styles.consultaDateText}>
                  📅 {sol.fecha_solicitud}
                </Text>
                <View style={styles.consultaMsgBox}>
                  <Text style={styles.consultaMsgText}>
                    &quot;{sol.mensaje_consulta}&quot;
                  </Text>
                </View>

                {docObj && (
                  <TouchableOpacity
                    style={styles.secondaryOutlineBtn}
                    onPress={() => {
                      abrirPerfilDocente(docObj);
                      onSelectTab('docentes');
                    }}
                  >
                    <Text style={styles.secondaryOutlineBtnText}>
                      Ver Perfil de {sol.nombre_docente} →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    );
  }

  // =========================================================================
  // PESTAÑA 3: MI PERFIL (ESTUDIANTE ADULTO A0 O PADRE/REPRESENTANTE A1)
  // =========================================================================
  if (activeTab === 'perfil') {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabHeaderBlock}>
          <Text style={styles.microTag}>MI CUENTA EN ATRIL</Text>
          <Text style={styles.tabMainTitle}>Perfil del Estudiante</Text>
          <Text style={styles.tabSubtitle}>
            Información del titular y gestión de beneficiarios académicos.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.rolePillBlue}>
            <Text style={styles.rolePillBlueText}>
              {esRepresentante
                ? '👨‍👧 PADRE / MADRE O REPRESENTANTE LEGAL (A1)'
                : '🎓 ESTUDIANTE MAYOR DE EDAD (+18 AÑOS · A0)'}
            </Text>
          </View>

          <View style={styles.profileRowItem}>
            <Text style={styles.profileRowLabel}>Nombre completo:</Text>
            <Text style={styles.profileRowValue}>
              {usuarioActual.nombre_completo}
            </Text>
          </View>

          <View style={styles.profileRowItem}>
            <Text style={styles.profileRowLabel}>Cédula de Identidad:</Text>
            <Text style={styles.profileRowValue}>
              {usuarioActual.cedula_identidad}
            </Text>
          </View>

          <View style={styles.profileRowItem}>
            <Text style={styles.profileRowLabel}>Correo electrónico:</Text>
            <Text style={styles.profileRowValue}>{usuarioActual.email}</Text>
          </View>

          <View style={styles.profileRowItem}>
            <Text style={styles.profileRowLabel}>Teléfono:</Text>
            <Text style={styles.profileRowValue}>{usuarioActual.telefono}</Text>
          </View>
        </View>

        {/* Gestión de Hijos Representados (si es Representante o desea agregar uno) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {esRepresentante
              ? 'Mis Hijos / Representados Menores'
              : 'Modalidad de Cuenta Académica'}
          </Text>
          {esRepresentante ? (
            <>
              <Text style={styles.bodyParagraph}>
                Selecciona cuál de tus hijos representados estará activo al consultar docentes o agrega otro representado menor:
              </Text>

              <View style={{ gap: 8, marginBottom: 12 }}>
                {representadosLocales.map((hijo, idx) => {
                  const esActivo = representadoActivoIdx === idx;
                  return (
                    <TouchableOpacity
                      key={hijo.id}
                      style={[
                        styles.childProfileRow,
                        esActivo && styles.childProfileRowActive,
                      ]}
                      onPress={() => setRepresentadoActivoIdx(idx)}
                    >
                      <View>
                        <Text style={styles.childProfileName}>
                          {hijo.nombre_completo} ({hijo.edad} años)
                        </Text>
                        <Text style={styles.childProfileSub}>
                          Instrumento de interés: {hijo.instrumento_interes}
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
                            esActivo && { color: '#FFFFFF' },
                          ]}
                        >
                          {esActivo ? '✓ Activo' : 'Elegir'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.cardDivider} />

              <Text style={styles.subTitle}>
                ＋ Agregar Nuevo Hijo / Representado
              </Text>
              <TextInput
                style={styles.childInput}
                placeholder="Nombre y Apellido del menor (ej. Valentina Gómez)"
                placeholderTextColor="#94A3B8"
                value={nuevoHijoNombre}
                onChangeText={setNuevoHijoNombre}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.childInput, { flex: 1 }]}
                  placeholder="Edad (4-17)"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={nuevoHijoEdad}
                  onChangeText={setNuevoHijoEdad}
                />
                <TextInput
                  style={[styles.childInput, { flex: 2 }]}
                  placeholder="Instrumento (ej. Oboe, Violín)"
                  placeholderTextColor="#94A3B8"
                  value={nuevoHijoInstrumento}
                  onChangeText={setNuevoHijoInstrumento}
                />
              </View>

              {mensajeHijo && (
                <Text style={styles.feedbackGreenText}>{mensajeHijo}</Text>
              )}

              <TouchableOpacity
                style={styles.saveChildBtn}
                onPress={handleAgregarHijo}
              >
                <Text style={styles.saveChildBtnText}>
                  Guardar Hijo en Mi Cuenta
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.bodyParagraph}>
              Cuenta de estudiante mayor de edad (+18 años). Gestionas directamente tus consultas con los docentes acreditados por Fundaoboe en la cátedra de tu preferencia ({usuarioActual.instrumento_interes || 'Oboe Sinfónico'}).
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.logoutFullBtn} onPress={onLogout}>
          <Text style={styles.logoutFullBtnText}>
            Cerrar Sesión / Cambiar de Usuario
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // =========================================================================
  // VISTA DETALLE (DENTRO DE PESTAÑA "DOCENTES"): PERFIL DEL DOCENTE
  // =========================================================================
  if (docenteSeleccionado) {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topHeaderRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setDocenteSeleccionado(null)}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.microTag}>PERFIL DEL DOCENTE ACREDITADO</Text>
            <Text style={styles.screenTitle}>
              Ficha Académica y Contacto
            </Text>
          </View>
        </View>

        {/* Tarjeta Principal del Maestro (Estilo v2.0 TeacherProfileScheduleScreen) */}
        <View style={styles.card}>
          <View style={styles.teacherCardMainRow}>
            <View style={styles.teacherAvatarCircleLarge}>
              <Text style={styles.teacherAvatarTextLarge}>
                {obtenerIniciales(docenteSeleccionado.nombre_completo)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameAndBadgeRow}>
                <Text style={styles.teacherNameLarge}>
                  {docenteSeleccionado.nombre_completo}
                </Text>
                <View style={styles.fundaoboeBadge}>
                  <Text style={styles.fundaoboeBadgeText}>
                    ✓ MÚSICO VERIFICADO FUNDAOBOE
                  </Text>
                </View>
              </View>
              <Text style={styles.teacherSpecialtyText}>
                🎼 Instrumento principal: {docenteSeleccionado.instrumento_principal}
              </Text>
              <Text style={styles.teacherLocationText}>
                🏛️ {docenteSeleccionado.orquesta_o_conservatorio} ({docenteSeleccionado.anos_experiencia} años exp.)
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

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

        {/* Selección de Instrumento Certificado */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            1. Instrumentos en los que está Certificado
          </Text>
          <Text style={styles.bodyParagraph}>
            Elige cuál de los instrumentos certificados de {docenteSeleccionado.nombre_completo} deseas aprender:
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

        {/* Selección de Modalidad y Horario Referencial (Interactividad tipo TeacherProfileScheduleScreen) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            2. Modalidad y Horario Referencial de Preferencia
          </Text>
          <Text style={styles.bodyParagraph}>
            Indica tu disponibilidad preferida para que el docente la reciba junto a tu solicitud:
          </Text>

          <View style={styles.modalityToggleRow}>
            {docenteSeleccionado.modalidades.map((mod) => {
              const activo = modalidadPreferida === mod;
              return (
                <TouchableOpacity
                  key={mod}
                  style={[
                    styles.modalityOption,
                    activo && styles.modalityOptionActive,
                  ]}
                  onPress={() => setModalidadPreferida(mod)}
                >
                  <Text
                    style={[
                      styles.modalityOptionTitle,
                      activo && styles.modalityOptionTitleActive,
                    ]}
                  >
                    {mod === 'Presencial Caracas' ? '🏛️ Presencial' : '💻 ' + mod}
                  </Text>
                  <Text style={styles.modalityOptionSub}>{mod}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.subTitle, { marginTop: 12 }]}>
            Día de la semana preferido:
          </Text>
          <View style={styles.daysRow}>
            {DIAS_SEMANA_DISPONIBLES.map((d) => {
              const esDiaActivo = diaPreferido === d.diaSemana;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.dayBox, esDiaActivo && styles.dayBoxActive]}
                  onPress={() => setDiaPreferido(d.diaSemana)}
                >
                  <Text
                    style={[
                      styles.dayWeekText,
                      esDiaActivo && styles.dayTextActive,
                    ]}
                  >
                    {d.diaSemana}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.subTitle}>Bloque horario referencial:</Text>
          <View style={styles.timeGrid}>
            {BLOQUES_HORARIOS_REFERENCIALES.map((slot) => {
              const seleccionado = horaPreferida === slot.horaLabel;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeSlotBtn,
                    seleccionado && styles.timeSlotBtnSelected,
                  ]}
                  onPress={() => setHoraPreferida(slot.horaLabel)}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      seleccionado && styles.timeSlotTextSelected,
                    ]}
                  >
                    🕒 {slot.horaLabel}
                  </Text>
                  <Text
                    style={[
                      styles.timeSlotDuration,
                      seleccionado && styles.timeSlotTextSelected,
                    ]}
                  >
                    Turno {slot.turno} • Disponible
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Formulario de Contacto con el Docente */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            3. Contactarse con {docenteSeleccionado.nombre_completo}
          </Text>

          {esRepresentante && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.subTitle}>
                Hijo representado para quien solicitas la clase:
              </Text>
              <View style={styles.filterRow}>
                {representadosLocales.map((rep, idx) => {
                  const activo = representadoActivoIdx === idx;
                  return (
                    <TouchableOpacity
                      key={rep.id}
                      style={[
                        styles.filterChip,
                        activo && styles.filterChipActive,
                      ]}
                      onPress={() => setRepresentadoActivoIdx(idx)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          activo && styles.filterChipTextActive,
                        ]}
                      >
                        👦 {rep.nombre_completo} ({rep.edad}a)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <Text style={styles.subTitle}>Mensaje para el docente:</Text>
          <TextInput
            style={styles.textArea}
            value={mensajeContacto}
            onChangeText={setMensajeContacto}
            multiline
            placeholder="Escribe tu consulta para el docente..."
            placeholderTextColor="#94A3B8"
          />

          {confirmacionContacto && (
            <View style={styles.successBox}>
              <Text style={styles.successBoxText}>{confirmacionContacto}</Text>
              <TouchableOpacity
                style={styles.goToConsultasBtn}
                onPress={() => {
                  setDocenteSeleccionado(null);
                  onSelectTab('consultas');
                }}
              >
                <Text style={styles.goToConsultasBtnText}>
                  Ver en Mis Consultas →
                </Text>
              </TouchableOpacity>
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
  // PESTAÑA 1 (PRINCIPAL): SECCIÓN "DOCENTES" (Basada en StudentCatalogScreen v2.0)
  // =========================================================================
  const inicialesUsuario = obtenerIniciales(usuarioActual.nombre_completo);
  const nombreCortoHijo = hijoActivo?.nombre_completo.split(' ')[0] ?? null;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Cabecera Dinámica estilo StudentCatalogScreen v2.0 (A0 Adulto vs A1 Padre/Representante) */}
      {!esRepresentante ? (
        <View style={styles.userHeaderRow}>
          <View style={styles.userAvatarRow}>
            <View style={styles.avatarCircleBlue}>
              <Text style={styles.avatarInitials}>{inicialesUsuario}</Text>
            </View>
            <View>
              <Text style={styles.userRoleMicro}>
                ESTUDIANTE MAYOR DE EDAD (A0)
              </Text>
              <Text style={styles.userNameText}>
                {usuarioActual.nombre_completo}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.profileQuickPill}
            onPress={() => onSelectTab('perfil')}
          >
            <Text style={styles.profileQuickPillText}>👤 Mi Perfil</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.userHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userRoleMicro}>PADRE / REPRESENTANTE (A1)</Text>
            <Text style={styles.userNameText}>
              {usuarioActual.nombre_completo}
            </Text>
          </View>

          {hijoActivo && nombreCortoHijo ? (
            <TouchableOpacity
              style={styles.childSelectorPill}
              activeOpacity={0.85}
              onPress={alternarHijoActivo}
            >
              <View style={styles.childAvatarMini}>
                <Text style={styles.childAvatarMiniText}>
                  {nombreCortoHijo[0]?.toUpperCase() ?? 'A'}
                </Text>
              </View>
              <Text style={styles.childSelectorText}>
                Hijo: {nombreCortoHijo}
              </Text>
              <Text style={styles.childSelectorArrow}>▾</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addChildQuickBtn}
              activeOpacity={0.85}
              onPress={() => setMostrarFormHijo((prev) => !prev)}
            >
              <Text style={styles.addChildQuickBtnText}>＋ Registrar Hijo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Formulario rápido desplegable para Padre / Representante (A1) */}
      {esRepresentante && mostrarFormHijo && (
        <View style={styles.addChildFormCard}>
          <Text style={styles.addChildFormTitle}>
            👨‍👧 Registrar Hijo / Representado Menor
          </Text>
          <TextInput
            style={styles.childInput}
            placeholder="Nombre y Apellido del menor (ej. Mateo Pérez)"
            placeholderTextColor="#94A3B8"
            value={nuevoHijoNombre}
            onChangeText={setNuevoHijoNombre}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[styles.childInput, { flex: 1 }]}
              placeholder="Edad (4-17)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={nuevoHijoEdad}
              onChangeText={setNuevoHijoEdad}
            />
            <TextInput
              style={[styles.childInput, { flex: 2 }]}
              placeholder="Instrumento (ej. Oboe)"
              placeholderTextColor="#94A3B8"
              value={nuevoHijoInstrumento}
              onChangeText={setNuevoHijoInstrumento}
            />
          </View>
          <TouchableOpacity
            style={styles.saveChildBtn}
            onPress={handleAgregarHijo}
          >
            <Text style={styles.saveChildBtnText}>
              Guardar Hijo Representado →
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Buscador de Docentes por Instrumento */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por instrumento: Oboe, Clarinete, Violín, Guitarra..."
          placeholderTextColor="#94A3B8"
          value={busquedaInstrumento}
          onChangeText={setBusquedaInstrumento}
        />
        {busquedaInstrumento.length > 0 && (
          <TouchableOpacity onPress={() => setBusquedaInstrumento('')}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros de Modalidad (Estilo StudentCatalogScreen v2.0) */}
      <View style={[styles.filterRow, { marginBottom: 10 }]}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            modalidadFiltro === 'TODOS' && styles.filterChipActive,
          ]}
          onPress={() => setModalidadFiltro('TODOS')}
        >
          <Text
            style={[
              styles.filterChipText,
              modalidadFiltro === 'TODOS' && styles.filterChipTextActive,
            ]}
          >
            Todas las modalidades
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            modalidadFiltro === 'Presencial Caracas' && styles.filterChipActive,
          ]}
          onPress={() => setModalidadFiltro('Presencial Caracas')}
        >
          <Text
            style={[
              styles.filterChipText,
              modalidadFiltro === 'Presencial Caracas' &&
                styles.filterChipTextActive,
            ]}
          >
            Presencial Caracas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            modalidadFiltro === 'Online (Zoom)' && styles.filterChipActive,
          ]}
          onPress={() => setModalidadFiltro('Online (Zoom)')}
        >
          <Text
            style={[
              styles.filterChipText,
              modalidadFiltro === 'Online (Zoom)' &&
                styles.filterChipTextActive,
            ]}
          >
            Online En Vivo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chips de Instrumentos */}
      <View style={[styles.filterRow, { marginBottom: 16 }]}>
        {FAMILIAS_E_INSTRUMENTOS_FILTRO.map((inst) => {
          const activo = instrumentoFiltro === inst;
          return (
            <TouchableOpacity
              key={inst}
              style={[
                styles.instrumentFilterPill,
                activo && styles.instrumentFilterPillActive,
              ]}
              onPress={() => setInstrumentoFiltro(inst)}
            >
              <Text
                style={[
                  styles.instrumentFilterPillText,
                  activo && styles.instrumentFilterPillTextActive,
                ]}
              >
                {inst}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Encabezado de Sección: DOCENTES */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Docentes Acreditados</Text>
        <Text style={styles.sectionLinkText}>
          Disponibles ({docentesFiltrados.length})
        </Text>
      </View>

      {/* Listado de Tarjetas de Docentes (Estilo StudentCatalogScreen v2.0 sin tarifas ni abonos) */}
      {docentesFiltrados.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>
            Sin docentes para este filtro de instrumento
          </Text>
          <Text style={styles.emptySubtitle}>
            Intenta buscar otro instrumento o selecciona &quot;Todos&quot;.
          </Text>
        </View>
      ) : (
        docentesFiltrados.map((docente) => {
          const iniciales = obtenerIniciales(docente.nombre_completo);
          const textoModalidades = docente.modalidades.join(' • ');

          return (
            <View key={docente.id} style={styles.teacherCard}>
              <View style={styles.teacherCardMainRow}>
                <View style={styles.teacherAvatarCircle}>
                  <Text style={styles.teacherAvatarText}>{iniciales}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.nameAndBadgeRow}>
                    <Text style={styles.teacherName}>
                      {docente.nombre_completo}
                    </Text>
                    <View style={styles.fundaoboeBadge}>
                      <Text style={styles.fundaoboeBadgeText}>
                        ✓ FUNDAOBOE
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.teacherSpecialtyText}>
                    🎼 Instrumento principal: {docente.instrumento_principal}
                  </Text>
                  <Text style={styles.teacherLocationText}>
                    🏛️ {docente.orquesta_o_conservatorio}
                  </Text>
                  <Text style={styles.teacherLocationText}>
                    📍 {textoModalidades}
                  </Text>
                  <Text style={styles.teacherBio} numberOfLines={2}>
                    {docente.trayectoria_biografia}
                  </Text>
                </View>
              </View>

              {/* Instrumentos Certificados */}
              <View style={styles.certTagsRow}>
                {docente.instrumentos_certificados.map((inst, idx) => (
                  <View key={`${docente.id}-${idx}`} style={styles.certMiniPill}>
                    <Text style={styles.certMiniPillText}>🎵 {inst}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardFooterBar}>
                <View style={styles.verifiedExperiencePill}>
                  <Text style={styles.verifiedExperienceText}>
                    🏅 {docente.anos_experiencia} años exp.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.profileButton}
                  activeOpacity={0.85}
                  onPress={() => abrirPerfilDocente(docente)}
                >
                  <Text style={styles.profileButtonText}>
                    Ver Perfil del Docente y Contactar →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* Tarjeta Contextual Inferior para Padre / Representante (A1) */}
      {esRepresentante && (
        <View style={styles.bottomContextCard}>
          <Text style={styles.bottomContextTitle}>
            👨‍👧‍👦 Gestión de Hijos Representados
          </Text>
          <Text style={styles.bottomContextDesc}>
            {hijoActivo
              ? `Consultando docentes para: ${hijoActivo.nombre_completo} (${hijoActivo.edad} años — ${hijoActivo.instrumento_interes}).`
              : 'Agrega a tus hijos menores para asociar sus consultas.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {representadosLocales.length > 1 && (
              <TouchableOpacity
                style={[styles.manageChildrenBtn, { flex: 1 }]}
                onPress={alternarHijoActivo}
              >
                <Text style={styles.manageChildrenBtnText}>
                  ⇄ Cambiar Hijo Activo
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.manageChildrenBtn, { flex: 1 }]}
              onPress={() => setMostrarFormHijo((prev) => !prev)}
            >
              <Text style={styles.manageChildrenBtnText}>
                {mostrarFormHijo ? 'Cerrar Formulario' : '＋ Añadir Otro Hijo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const AZUL_REY = '#1D4ED8';
const AZUL_OSCURO = '#1E40AF';
const AZUL_NOCHE = '#0A192F';
const FONDO_OFICIAL = '#F8FAFC';
const BLANCO = '#FFFFFF';
const VERDE = '#059669';

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 28,
    backgroundColor: FONDO_OFICIAL,
  },
  tabHeaderBlock: {
    marginBottom: 14,
  },
  microTag: {
    fontSize: 10,
    fontWeight: '800',
    color: AZUL_REY,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  tabMainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 4,
  },
  tabSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 10,
  },
  userAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircleBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AZUL_REY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: BLANCO,
    fontSize: 15,
    fontWeight: '800',
  },
  userRoleMicro: {
    fontSize: 9.5,
    fontWeight: '800',
    color: AZUL_REY,
    letterSpacing: 0.4,
  },
  userNameText: {
    fontSize: 16.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
  profileQuickPill: {
    backgroundColor: BLANCO,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  profileQuickPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: AZUL_OSCURO,
  },
  childSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  childAvatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AZUL_REY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarMiniText: {
    color: BLANCO,
    fontSize: 11,
    fontWeight: '800',
  },
  childSelectorText: {
    fontSize: 12,
    fontWeight: '800',
    color: AZUL_OSCURO,
  },
  childSelectorArrow: {
    fontSize: 11,
    color: AZUL_OSCURO,
    fontWeight: '900',
  },
  addChildQuickBtn: {
    backgroundColor: AZUL_REY,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  addChildQuickBtnText: {
    color: BLANCO,
    fontSize: 11.5,
    fontWeight: '800',
  },
  addChildFormCard: {
    backgroundColor: BLANCO,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  addChildFormTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
    marginBottom: 8,
  },
  childInput: {
    backgroundColor: FONDO_OFICIAL,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },
  saveChildBtn: {
    backgroundColor: VERDE,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveChildBtnText: {
    color: BLANCO,
    fontSize: 12.5,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLANCO,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    paddingVertical: 2,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    paddingHorizontal: 6,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: BLANCO,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  filterChipActive: {
    backgroundColor: AZUL_REY,
    borderColor: AZUL_REY,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: BLANCO,
    fontWeight: '800',
  },
  instrumentFilterPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  instrumentFilterPillActive: {
    backgroundColor: AZUL_NOCHE,
    borderColor: AZUL_NOCHE,
  },
  instrumentFilterPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: AZUL_OSCURO,
  },
  instrumentFilterPillTextActive: {
    color: '#FBBF24',
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
  sectionLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: AZUL_REY,
  },
  emptyBox: {
    backgroundColor: BLANCO,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  teacherCard: {
    backgroundColor: BLANCO,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  teacherCardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  teacherAvatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: AZUL_REY,
  },
  teacherAvatarCircleLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DBEAFE',
    borderWidth: 1.5,
    borderColor: AZUL_REY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarTextLarge: {
    fontSize: 18,
    fontWeight: '800',
    color: AZUL_OSCURO,
  },
  nameAndBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  teacherName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
  teacherNameLarge: {
    fontSize: 17,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
  fundaoboeBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  fundaoboeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: VERDE,
  },
  teacherSpecialtyText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: AZUL_OSCURO,
    marginBottom: 2,
  },
  teacherLocationText: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 3,
  },
  teacherBio: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginTop: 2,
  },
  certTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  certMiniPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  certMiniPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  cardFooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  verifiedExperiencePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  verifiedExperienceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  profileButton: {
    flex: 1,
    backgroundColor: AZUL_REY,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    color: BLANCO,
    fontSize: 12,
    fontWeight: '800',
  },
  bottomContextCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  bottomContextTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: AZUL_OSCURO,
    marginBottom: 4,
  },
  bottomContextDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    marginBottom: 10,
  },
  manageChildrenBtn: {
    backgroundColor: BLANCO,
    borderWidth: 1,
    borderColor: AZUL_REY,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  manageChildrenBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: AZUL_REY,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: BLANCO,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 17,
    fontWeight: '900',
    color: AZUL_OSCURO,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
  card: {
    backgroundColor: BLANCO,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AZUL_NOCHE,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: AZUL_NOCHE,
    marginTop: 8,
    marginBottom: 6,
  },
  bodyParagraph: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: FONDO_OFICIAL,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  credentialCheck: {
    color: VERDE,
    fontSize: 14,
    fontWeight: '900',
  },
  credentialText: {
    flex: 1,
    fontSize: 12.5,
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
    backgroundColor: FONDO_OFICIAL,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  selectInstrumentBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: AZUL_REY,
  },
  selectInstrumentText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
  selectInstrumentTextActive: {
    color: AZUL_REY,
  },
  selectInstrumentBadge: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748B',
  },
  selectInstrumentBadgeActive: {
    color: AZUL_REY,
  },
  modalityToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalityOption: {
    flex: 1,
    minWidth: 130,
    backgroundColor: FONDO_OFICIAL,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 10,
  },
  modalityOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: AZUL_REY,
  },
  modalityOptionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 2,
  },
  modalityOptionTitleActive: {
    color: AZUL_REY,
  },
  modalityOptionSub: {
    fontSize: 11,
    color: '#64748B',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  dayBox: {
    flex: 1,
    backgroundColor: FONDO_OFICIAL,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dayBoxActive: {
    backgroundColor: AZUL_OSCURO,
    borderColor: AZUL_OSCURO,
  },
  dayWeekText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  dayTextActive: {
    color: BLANCO,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotBtn: {
    width: '48%',
    backgroundColor: FONDO_OFICIAL,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  timeSlotBtnSelected: {
    backgroundColor: AZUL_REY,
    borderColor: AZUL_REY,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '800',
    color: AZUL_NOCHE,
    marginBottom: 2,
  },
  timeSlotDuration: {
    fontSize: 10.5,
    fontWeight: '600',
    color: VERDE,
  },
  timeSlotTextSelected: {
    color: BLANCO,
  },
  textArea: {
    backgroundColor: FONDO_OFICIAL,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: AZUL_NOCHE,
    minHeight: 76,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  successBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: VERDE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  successBoxText: {
    color: '#065F46',
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 18,
  },
  goToConsultasBtn: {
    marginTop: 8,
    backgroundColor: VERDE,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  goToConsultasBtnText: {
    color: BLANCO,
    fontSize: 12,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: AZUL_REY,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: BLANCO,
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  consultaCard: {
    backgroundColor: BLANCO,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  consultaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPendingPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPendingText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },
  consultaDateText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: AZUL_REY,
    marginBottom: 6,
  },
  consultaMsgBox: {
    backgroundColor: FONDO_OFICIAL,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  consultaMsgText: {
    fontSize: 12.5,
    color: '#334155',
    fontStyle: 'italic',
  },
  secondaryOutlineBtn: {
    borderWidth: 1,
    borderColor: AZUL_REY,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  secondaryOutlineBtnText: {
    color: AZUL_REY,
    fontSize: 12,
    fontWeight: '800',
  },
  rolePillBlue: {
    backgroundColor: '#DBEAFE',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 12,
  },
  rolePillBlueText: {
    color: AZUL_OSCURO,
    fontSize: 10.5,
    fontWeight: '800',
  },
  profileRowItem: {
    marginBottom: 10,
  },
  profileRowLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  profileRowValue: {
    fontSize: 14,
    color: AZUL_NOCHE,
    fontWeight: '800',
  },
  childProfileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: FONDO_OFICIAL,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
  },
  childProfileRowActive: {
    backgroundColor: '#EFF6FF',
    borderColor: AZUL_REY,
  },
  childProfileName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
  childProfileSub: {
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
  feedbackGreenText: {
    fontSize: 12,
    fontWeight: '700',
    color: VERDE,
    marginBottom: 8,
  },
  logoutFullBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutFullBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
});
