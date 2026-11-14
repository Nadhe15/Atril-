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
  PerfilDocenteAtril,
  SolicitudContactoDocente,
} from '../types/atril.types';

interface TeacherAccreditedProfileScreenProps {
  perfilDocente: PerfilDocenteAtril;
  solicitudesContacto: SolicitudContactoDocente[];
  onUpdateTeacherProfile: (actualizado: PerfilDocenteAtril) => void;
  onLogout: () => void;
}

const obtenerIniciales = (nombre: string): string => {
  const limpio = nombre.replace(/^(Prof\.?|Mtro\.?)\s*/i, '').trim();
  const partes = limpio.split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase();
};

export default function TeacherAccreditedProfileScreen({
  perfilDocente,
  solicitudesContacto,
  onUpdateTeacherProfile,
  onLogout,
}: TeacherAccreditedProfileScreenProps) {
  const [nuevoInstrumento, setNuevoInstrumento] = useState<string>('');
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState<string | null>(
    null
  );

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

  const misSolicitudes = solicitudesContacto.filter(
    (s) => s.docente_id === perfilDocente.id
  );

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
            <Text style={styles.teacherName}>{perfilDocente.nombre_completo}</Text>
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
            Tu identidad, Currículum Vitae y certificaciones sinfónicas/académicas han sido auditadas y aprobadas. Tu perfil es visible en el directorio de Docentes para todos los alumnos registrados.
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
          Estos son los instrumentos y cátedras musicales en los que cuentas con certificación verificada ante Fundaoboe:
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

      {/* BLOQUE 4: SOLICITUDES DE CONTACTO DE ALUMNOS */}
      <View style={styles.card}>
        <Text style={styles.sectionKicker}>
          4. CONEXIÓN OFERTA - DEMANDA
        </Text>
        <Text style={styles.sectionTitle}>
          Consultas de Contacto de Alumnos ({misSolicitudes.length})
        </Text>
        <Text style={styles.bodyText}>
          Cuando un alumno selecciona uno de los instrumentos que enseñas y solicita contactarte desde tu perfil, se registra aquí la solicitud (el mecanismo de contacto directo se encuentra en fase de definición con Fundaoboe):
        </Text>

        {misSolicitudes.length === 0 ? (
          <View style={styles.emptyContactBox}>
            <Text style={styles.emptyContactText}>
              Aún no tienes nuevas solicitudes de contacto en esta sesión.
            </Text>
          </View>
        ) : (
          misSolicitudes.map((sol) => (
            <View key={sol.id} style={styles.contactRequestCard}>
              <Text style={styles.contactRequestTitle}>
                🎓 {sol.nombre_solicitante} (Alumno: {sol.beneficiario_alumno})
              </Text>
              <Text style={styles.contactRequestSub}>
                Instrumento de interés: {sol.instrumento_seleccionado} • {sol.fecha_solicitud}
              </Text>
              <Text style={styles.contactRequestMsg}>
                &quot;{sol.mensaje_consulta}&quot;
              </Text>
            </View>
          ))
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

const AZUL_REY = '#0047AB';
const AZUL_NOCHE = '#0A192F';
const BORDE_ALTO_CONTRASTE = '#475569';

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 40,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFBF00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  verifiedBadgeGold: {
    backgroundColor: '#FFBF00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  verifiedBadgeGoldText: {
    color: AZUL_NOCHE,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  teacherName: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 2,
  },
  teacherDocMeta: {
    color: '#B3D1FF',
    fontSize: 13,
    fontWeight: '600',
  },
  mainInstrumentBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFBF00',
  },
  mainInstrumentLabel: {
    color: '#B3D1FF',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  mainInstrumentValue: {
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
  accreditationStatusBox: {
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#047857',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  accreditationStatusTitle: {
    color: '#065F46',
    fontSize: 14.5,
    fontWeight: '900',
    marginBottom: 4,
  },
  accreditationStatusDesc: {
    color: '#065F46',
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    fontWeight: '500',
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
    borderWidth: 2,
    borderColor: AZUL_REY,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  instrumentPillText: {
    fontSize: 15,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  certifiedMiniTag: {
    backgroundColor: '#047857',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  certifiedMiniTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  addInstrumentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#64748B',
  },
  fieldLabel: {
    fontSize: 13.5,
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
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: AZUL_NOCHE,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: AZUL_REY,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
  },
  confirmText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '800',
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
    borderColor: '#CBD5E1',
  },
  certCheck: {
    color: '#047857',
    fontSize: 15,
    fontWeight: '900',
  },
  certText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: AZUL_NOCHE,
    lineHeight: 19,
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
    borderColor: '#93C5FD',
  },
  docSummaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: AZUL_REY,
  },
  docSummaryValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
    marginTop: 2,
  },
  emptyContactBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  emptyContactText: {
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '600',
  },
  contactRequestCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: AZUL_REY,
    marginTop: 8,
  },
  contactRequestTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  contactRequestSub: {
    fontSize: 12.5,
    fontWeight: '700',
    color: AZUL_REY,
    marginVertical: 3,
  },
  contactRequestMsg: {
    fontSize: 13.5,
    color: '#1E293B',
    fontStyle: 'italic',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AZUL_REY,
  },
  logoutButtonText: {
    color: AZUL_REY,
    fontSize: 14.5,
    fontWeight: '900',
  },
});
