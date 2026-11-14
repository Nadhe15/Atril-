// src/screens/FundaoboeReviewScreen.tsx
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
  EstadoAcreditacionDocente,
  PerfilDocenteAtril,
  Usuario,
} from '../types/atril.types';

interface FundaoboeReviewScreenProps {
  usuarioRevisor: Usuario;
  docentes: PerfilDocenteAtril[];
  onDecideTeacherStatus: (
    docenteId: string,
    nuevoEstado: EstadoAcreditacionDocente,
    observacion?: string
  ) => void;
  onOpenAccreditedTeacherPreview: (docente: PerfilDocenteAtril) => void;
  onLogout: () => void;
}

export default function FundaoboeReviewScreen({
  usuarioRevisor,
  docentes,
  onDecideTeacherStatus,
  onOpenAccreditedTeacherPreview,
  onLogout,
}: FundaoboeReviewScreenProps) {
  const [observacionesPorDocente, setObservacionesPorDocente] = useState<
    Record<string, string>
  >({});
  const [mensajeAlerta, setMensajeAlerta] = useState<{
    tipo: 'exito' | 'error';
    texto: string;
  } | null>(null);

  const enRevision = docentes.filter(
    (d) => d.estado_acreditacion === 'EN_REVISION'
  );
  const acreditados = docentes.filter(
    (d) => d.estado_acreditacion === 'ACREDITADO'
  );
  const enBancoTalentos = docentes.filter(
    (d) => d.estado_acreditacion === 'BANCO_TALENTOS'
  );
  const descartados = docentes.filter(
    (d) => d.estado_acreditacion === 'DESCARTADO'
  );

  const handleAcreditar = (docente: PerfilDocenteAtril) => {
    const nota =
      observacionesPorDocente[docente.id]?.trim() ||
      'Recaudos completos: Cédula, Foto, CV y Certificaciones Musicales verificados por Fundaoboe.';
    onDecideTeacherStatus(docente.id, 'ACREDITADO', nota);
    setMensajeAlerta({
      tipo: 'exito',
      texto: `✓ ${docente.nombre_completo} ha sido ACREDITADO como Músico Verificado por Fundaoboe. Ya está visible en la sección de Docentes y su perfil está activo.`,
    });
  };

  const handleEnviarBancoTalentos = (docente: PerfilDocenteAtril) => {
    const nota = observacionesPorDocente[docente.id]?.trim() || '';
    if (!nota) {
      setMensajeAlerta({
        tipo: 'error',
        texto: `Para enviar a ${docente.nombre_completo} al Banco de Talentos, escribe primero el motivo u orientación (ej. "La foto de la cédula está borrosa, por favor resúbela").`,
      });
      return;
    }
    onDecideTeacherStatus(docente.id, 'BANCO_TALENTOS', nota);
    setMensajeAlerta({
      tipo: 'exito',
      texto: `⏳ ${docente.nombre_completo} fue archivado en el Banco de Talentos con notificación al postulante: "${nota}".`,
    });
  };

  const handleDescartarDefinitivamente = (docente: PerfilDocenteAtril) => {
    const nota =
      observacionesPorDocente[docente.id]?.trim() ||
      'No cumple con los requisitos musicales ni superó la evaluación institucional.';
    onDecideTeacherStatus(docente.id, 'DESCARTADO', nota);
    setMensajeAlerta({
      tipo: 'exito',
      texto: `✕ Salida terminante ejecutada: ${docente.nombre_completo} fue descartado y retirado del sistema activo.`,
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Cabecera del Encargado de Revisión de Fundaoboe */}
      <View style={styles.reviewerBanner}>
        <View style={styles.reviewerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewerBadge}>
              PANEL INSTITUCIONAL DE REVISIÓN · FUNDAOBOE
            </Text>
            <Text style={styles.reviewerTitle}>
              Revisión y Acreditación de Docentes
            </Text>
            <Text style={styles.reviewerSubtitle}>
              Encargado(a): {usuarioRevisor.nombre_completo} •{' '}
              {usuarioRevisor.cargo_fundaoboe || 'Comité de Acreditación'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      {mensajeAlerta && (
        <View
          style={[
            styles.alertBox,
            mensajeAlerta.tipo === 'error'
              ? styles.alertBoxError
              : styles.alertBoxSuccess,
          ]}
        >
          <Text
            style={[
              styles.alertBoxText,
              mensajeAlerta.tipo === 'error'
                ? styles.alertTextError
                : styles.alertTextSuccess,
            ]}
          >
            {mensajeAlerta.texto}
          </Text>
        </View>
      )}

      {/* SECCIÓN 1: EXPEDIENTES DE DOCENTES PENDIENTES POR REVISAR */}
      <View style={styles.card}>
        <Text style={styles.sectionKicker}>
          1. SOLICITUDES PENDIENTES DE REVISIÓN ({enRevision.length})
        </Text>
        <Text style={styles.sectionTitle}>
          Documentos Recibidos de Docentes Postulantes
        </Text>
        <Text style={styles.helperParagraph}>
          Revisa la Cédula, Foto personal, Currículum Vitae (PDF) y Certificaciones Musicales/Sinfónicas (PDF) de cada aspirante para decidir si se acredita, si pasa al Banco de Talentos o si se descarta del sistema:
        </Text>

        {enRevision.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyBoxText}>
              ✓ Todos los expedientes pendientes han sido revisados.
            </Text>
          </View>
        ) : (
          enRevision.map((doc) => (
            <View key={doc.id} style={styles.dossierCard}>
              <View style={styles.dossierHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dossierName}>{doc.nombre_completo}</Text>
                  <Text style={styles.dossierMeta}>
                    C.I. {doc.cedula_identidad} • {doc.email} • {doc.telefono}
                  </Text>
                </View>
                <View style={styles.statusPendingBadge}>
                  <Text style={styles.statusPendingText}>EN REVISIÓN</Text>
                </View>
              </View>

              <View style={styles.musicProfileBox}>
                <Text style={styles.musicProfileLine}>
                  🎼 <Text style={styles.boldText}>Instrumento Principal:</Text>{' '}
                  {doc.instrumento_principal}
                </Text>
                <Text style={styles.musicProfileLine}>
                  🎵 <Text style={styles.boldText}>Instrumentos que declara enseñar:</Text>{' '}
                  {doc.instrumentos_certificados.join(', ')}
                </Text>
                <Text style={styles.musicProfileLine}>
                  🏛️ <Text style={styles.boldText}>Formación / Sinfónica:</Text>{' '}
                  {doc.orquesta_o_conservatorio} ({doc.anos_experiencia} años de experiencia)
                </Text>
              </View>

              {/* Los 4 Documentos Recolectados */}
              <Text style={styles.subHeading}>
                Documentos Adjuntos para Verificación:
              </Text>
              <View style={styles.docsGrid}>
                <View style={styles.docItemBox}>
                  <Text style={styles.docItemLabel}>1. Cédula de Identidad</Text>
                  <Text style={styles.docItemValue}>
                    📷 {doc.documentos.cedulaIdentidad.nombreArchivo} (
                    {doc.documentos.cedulaIdentidad.pesoMb} MB)
                  </Text>
                </View>

                <View style={styles.docItemBox}>
                  <Text style={styles.docItemLabel}>2. Foto Personal</Text>
                  <Text style={styles.docItemValue}>
                    📷 {doc.documentos.fotoPersonal.nombreArchivo} (
                    {doc.documentos.fotoPersonal.pesoMb} MB)
                  </Text>
                </View>

                <View style={styles.docItemBox}>
                  <Text style={styles.docItemLabel}>3. Currículum Vitae (CV)</Text>
                  <Text style={styles.docItemValue}>
                    📄 {doc.documentos.curriculumVitae.nombreArchivo} (
                    {doc.documentos.curriculumVitae.pesoMb} MB)
                  </Text>
                </View>

                <View style={styles.docItemBox}>
                  <Text style={styles.docItemLabel}>
                    4. Certificaciones Musicales / Sinfónicas
                  </Text>
                  <Text style={styles.docItemValue}>
                    🏅 {doc.documentos.certificacionesMusicales.nombreArchivo} (
                    {doc.documentos.certificacionesMusicales.pesoMb} MB)
                  </Text>
                  {doc.documentos.certificacionesMusicales.descripcion && (
                    <Text style={styles.docItemSub}>
                      Avales: {doc.documentos.certificacionesMusicales.descripcion}
                    </Text>
                  )}
                </View>
              </View>

              {/* Campo de Observación / Orientación */}
              <View style={{ marginTop: 10, marginBottom: 12 }}>
                <Text style={styles.fieldLabel}>
                  Observación del Revisor de Fundaoboe (Obligatoria para Banco de Talentos):
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={observacionesPorDocente[doc.id] || ''}
                  onChangeText={(texto) =>
                    setObservacionesPorDocente((prev) => ({
                      ...prev,
                      [doc.id]: texto,
                    }))
                  }
                  placeholder="Ej. Cédula borrosa, por favor volver a subir / Documentación completa y verificada..."
                  placeholderTextColor="#64748B"
                  multiline
                />
              </View>

              {/* Las 3 Ramas de Decisión */}
              <View style={styles.decisionStack}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleAcreditar(doc)}
                >
                  <Text style={styles.approveButtonText}>
                    ✓ Acreditar Docente (Músico Verificado)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.talentBankButton}
                  onPress={() => handleEnviarBancoTalentos(doc)}
                >
                  <Text style={styles.talentBankButtonText}>
                    ⏳ Enviar al Banco de Talentos (Con Observación)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.discardButton}
                  onPress={() => handleDescartarDefinitivamente(doc)}
                >
                  <Text style={styles.discardButtonText}>
                    ✕ Descartar y Eliminar del Sistema (Salida Terminante)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* SECCIÓN 2: DOCENTES YA ACREDITADOS POR FUNDAOBOE */}
      <View style={styles.card}>
        <Text style={styles.sectionKicker}>
          2. PLANTILLA ACTIVA ({acreditados.length})
        </Text>
        <Text style={styles.sectionTitle}>
          Docentes Acreditados (Visibles para los Alumnos)
        </Text>

        {acreditados.map((doc) => (
          <View key={doc.id} style={styles.accreditedRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.accreditedName}>
                ✓ {doc.nombre_completo} — {doc.instrumento_principal}
              </Text>
              <Text style={styles.accreditedCerts}>
                Certificado en: {doc.instrumentos_certificados.join(', ')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.previewProfileBtn}
              onPress={() => onOpenAccreditedTeacherPreview(doc)}
            >
              <Text style={styles.previewProfileBtnText}>Ver Perfil →</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* SECCIÓN 3: BANCO DE TALENTOS (EN RESPALDO) Y DESCARTADOS */}
      <View style={styles.card}>
        <Text style={styles.sectionKicker}>
          3. BANCO DE TALENTOS Y REGISTRO DE SALIDAS
        </Text>
        <Text style={styles.sectionTitle}>
          Postulantes en Banco de Talentos ({enBancoTalentos.length})
        </Text>

        {enBancoTalentos.map((doc) => (
          <View key={doc.id} style={styles.bankItem}>
            <Text style={styles.bankItemTitle}>
              ⏳ {doc.nombre_completo} ({doc.instrumento_principal} •{' '}
              {doc.cedula_identidad})
            </Text>
            <Text style={styles.bankItemNote}>
              Motivo / Orientación enviada:{' '}
              {doc.observacion_revisor ||
                'En reserva para próxima convocatoria.'}
            </Text>
            <TouchableOpacity
              style={[styles.approveButton, { marginTop: 8, paddingVertical: 10 }]}
              onPress={() => handleAcreditar(doc)}
            >
              <Text style={styles.approveButtonText}>
                ✓ Aprobar y Pasar a Docentes Acreditados
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {descartados.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <Text style={styles.subHeading}>
              Postulantes Descartados Definitivamente ({descartados.length}):
            </Text>
            {descartados.map((doc) => (
              <Text key={doc.id} style={styles.discardedLine}>
                ✕ {doc.nombre_completo} ({doc.cedula_identidad}) — Eliminado del flujo activo.
              </Text>
            ))}
          </View>
        )}
      </View>
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
  reviewerBanner: {
    backgroundColor: AZUL_NOCHE,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: AZUL_REY,
  },
  reviewerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  reviewerBadge: {
    color: '#FFBF00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  reviewerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  reviewerSubtitle: {
    color: '#B3D1FF',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutBtnText: {
    color: AZUL_NOCHE,
    fontSize: 12.5,
    fontWeight: '900',
  },
  alertBox: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    marginBottom: 14,
  },
  alertBoxSuccess: {
    backgroundColor: '#D1FAE5',
    borderColor: '#047857',
  },
  alertBoxError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#C81E1E',
  },
  alertBoxText: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  alertTextSuccess: {
    color: '#065F46',
  },
  alertTextError: {
    color: '#991B1B',
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
    marginBottom: 8,
  },
  helperParagraph: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 14,
    fontWeight: '500',
  },
  emptyBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#047857',
  },
  emptyBoxText: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '800',
  },
  dossierCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    marginBottom: 14,
  },
  dossierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  dossierName: {
    fontSize: 18,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  dossierMeta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  statusPendingBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#92400E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPendingText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '900',
  },
  musicProfileBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    marginBottom: 12,
    gap: 4,
  },
  musicProfileLine: {
    fontSize: 13.5,
    color: '#1E293B',
    lineHeight: 19,
  },
  boldText: {
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 8,
  },
  docsGrid: {
    gap: 8,
  },
  docItemBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: AZUL_REY,
  },
  docItemLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: AZUL_REY,
  },
  docItemValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
    marginTop: 2,
  },
  docItemSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 68,
    fontSize: 14,
    color: AZUL_NOCHE,
    fontWeight: '600',
  },
  decisionStack: {
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#047857',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '900',
  },
  talentBankButton: {
    backgroundColor: '#0047AB',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  talentBankButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  discardButton: {
    backgroundColor: '#C81E1E',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  discardButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  accreditedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    marginBottom: 8,
    gap: 10,
  },
  accreditedName: {
    fontSize: 14.5,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  accreditedCerts: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '600',
    marginTop: 2,
  },
  previewProfileBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: AZUL_REY,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  previewProfileBtnText: {
    color: AZUL_REY,
    fontSize: 12.5,
    fontWeight: '900',
  },
  bankItem: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#92400E',
    marginBottom: 10,
  },
  bankItemTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#78350F',
  },
  bankItemNote: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '700',
    marginTop: 4,
  },
  discardedLine: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '700',
    marginBottom: 4,
  },
});
