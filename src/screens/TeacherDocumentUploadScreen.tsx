// src/screens/TeacherDocumentUploadScreen.tsx
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
  DocumentosAcreditacionDocente,
  PerfilDocenteAtril,
} from '../types/atril.types';
import { NuevoDocenteEnRegistro } from './LoginScreen';

interface TeacherDocumentUploadScreenProps {
  datosDocente: NuevoDocenteEnRegistro;
  onSubmitApplication: (nuevoExpediente: PerfilDocenteAtril) => void;
  onGoToReviewerConsole: () => void;
  onBackToLogin: () => void;
}

const LIMITE_MAXIMO_MB = 10.0;

export default function TeacherDocumentUploadScreen({
  datosDocente,
  onSubmitApplication,
  onGoToReviewerConsole,
  onBackToLogin,
}: TeacherDocumentUploadScreenProps) {
  const [documentos, setDocumentos] = useState<DocumentosAcreditacionDocente>({
    cedulaIdentidad: {
      nombreArchivo: 'cedula_identidad_docente.png',
      formato: 'PNG',
      pesoMb: 2.3,
      cargado: true,
    },
    fotoPersonal: {
      nombreArchivo: 'foto_rostro_docente.jpg',
      formato: 'JPG',
      pesoMb: 2.8,
      cargado: true,
    },
    curriculumVitae: {
      nombreArchivo: 'CV_Musical_Actualizado.pdf',
      formato: 'PDF',
      pesoMb: 3.5,
      cargado: true,
    },
    certificacionesMusicales: {
      nombreArchivo: 'Certificados_Orquesta_Sinfonica_y_Conservatorio.pdf',
      formato: 'PDF',
      pesoMb: 5.8,
      cargado: true,
      descripcion:
        'Constancia de Orquesta Sinfónica + Título / Certificado de Conservatorio',
    },
  });

  const [detalleCertificaciones, setDetalleCertificaciones] = useState<string>(
    'Certificado de Orquesta Sinfónica Simón Bolívar, Título de Conservatorio y Aval de Ejecución Instrumental'
  );
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [enviadoExitosamente, setEnviadoExitosamente] = useState<boolean>(false);

  const simularPesoCedula = (pesoMb: number, nombre: string) => {
    setErrorCarga(null);
    setDocumentos((prev) => ({
      ...prev,
      cedulaIdentidad: {
        ...prev.cedulaIdentidad,
        nombreArchivo: nombre,
        pesoMb,
        cargado: true,
      },
    }));
  };

  const toggleDocumento = (clave: keyof DocumentosAcreditacionDocente) => {
    setErrorCarga(null);
    setDocumentos((prev) => ({
      ...prev,
      [clave]: {
        ...prev[clave],
        cargado: !prev[clave].cargado,
      },
    }));
  };

  const handleEnviarRecaudos = () => {
    setErrorCarga(null);

    if (!documentos.cedulaIdentidad.cargado) {
      setErrorCarga('Debes adjuntar la imagen de tu Cédula de Identidad (JPG o PNG).');
      return;
    }
    if (documentos.cedulaIdentidad.pesoMb > LIMITE_MAXIMO_MB) {
      setErrorCarga(
        `El archivo "${documentos.cedulaIdentidad.nombreArchivo}" pesa ${documentos.cedulaIdentidad.pesoMb} MB y supera el límite estándar permitido de ${LIMITE_MAXIMO_MB} MB.`
      );
      return;
    }
    if (!documentos.fotoPersonal.cargado) {
      setErrorCarga('Debes adjuntar tu Foto Personal de perfil docente (JPG o PNG).');
      return;
    }
    if (!documentos.curriculumVitae.cargado) {
      setErrorCarga('Debes adjuntar tu Currículum Vitae (CV) en formato PDF.');
      return;
    }
    if (!documentos.certificacionesMusicales.cargado) {
      setErrorCarga(
        'Debes adjuntar las Certificaciones Musicales en PDF que avalen que eres músico y dominas el instrumento.'
      );
      return;
    }

    const listaCertificaciones = detalleCertificaciones
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const nuevoExpediente: PerfilDocenteAtril = {
      id: `doc-${Date.now()}`,
      user_id: `usr-doc-${Date.now()}`,
      nombre_completo: datosDocente.nombre_completo.startsWith('Prof.')
        ? datosDocente.nombre_completo
        : `Prof. ${datosDocente.nombre_completo}`,
      cedula_identidad: datosDocente.cedula_identidad,
      email: datosDocente.email,
      telefono: datosDocente.telefono,
      instrumento_principal: datosDocente.instrumento_principal,
      instrumentos_certificados: datosDocente.instrumentos_certificados,
      acreditado_fundaoboe: false,
      estado_acreditacion: 'EN_REVISION',
      orquesta_o_conservatorio: datosDocente.orquesta_o_conservatorio,
      anos_experiencia: datosDocente.anos_experiencia,
      trayectoria_biografia: datosDocente.trayectoria_biografia,
      certificaciones_avales:
        listaCertificaciones.length > 0
          ? listaCertificaciones
          : [
              'Certificado de Orquesta Sinfónica',
              'Credencial de Conservatorio de Música',
            ],
      modalidades: ['Online (En Vivo)'],
      documentos: {
        ...documentos,
        certificacionesMusicales: {
          ...documentos.certificacionesMusicales,
          descripcion: detalleCertificaciones,
        },
      },
    };

    onSubmitApplication(nuevoExpediente);
    setEnviadoExitosamente(true);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Encabezado Paso 2 del Registro Docente */}
      <View style={styles.headerBanner}>
        <Text style={styles.stepBadge}>
          SEGUNDA PANTALLA · REGISTRO DE DOCENTE NO ACREDITADO (PASO 2 DE 2)
        </Text>
        <Text style={styles.headerTitle}>
          Recolección de Documentos para Acreditación Musical
        </Text>
        <Text style={styles.headerSubtitle}>
          Postulante: {datosDocente.nombre_completo} ({datosDocente.cedula_identidad}) • Instrumento principal: {datosDocente.instrumento_principal}
        </Text>
      </View>

      {/* Guía Sencilla de Carga (Mejora de Usabilidad) */}
      <View style={styles.guideBox}>
        <Text style={styles.guideTitle}>
          📌 Guía rápida para subir tus recaudos sin complicaciones:
        </Text>
        <Text style={styles.guideText}>
          • Para tu Cédula y tu Foto personal: toma una foto clara con tu celular (formatos de imagen JPG o PNG, hasta 10 MB).
        </Text>
        <Text style={styles.guideText}>
          • Para tu Currículum (CV) y tus Certificaciones Musicales (orquesta sinfónica, conservatorio, diplomas): súbelos como documento PDF (hasta 10 MB).
        </Text>
      </View>

      {/* RECAUDO 1: CÉDULA DE IDENTIDAD */}
      <View style={styles.docCard}>
        <View style={styles.docHeaderRow}>
          <Text style={styles.docNumberTitle}>1. Cédula de Identidad Legible *</Text>
          <View style={styles.formatPill}>
            <Text style={styles.formatPillText}>Imagen JPG / PNG • Máx. 10 MB</Text>
          </View>
        </View>
        <Text style={styles.docDescription}>
          Fotografía nítida de tu documento de identidad donde se lean tus nombres y número de cédula.
        </Text>
        <View style={styles.fileStatusBox}>
          <Text style={styles.fileStatusText}>
            {documentos.cedulaIdentidad.cargado
              ? `✓ Adjunto: ${documentos.cedulaIdentidad.nombreArchivo} (${documentos.cedulaIdentidad.pesoMb} MB)`
              : '⚠️ Sin archivo adjunto'}
          </Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.chipBtn,
              documentos.cedulaIdentidad.pesoMb <= LIMITE_MAXIMO_MB &&
                styles.chipBtnActive,
            ]}
            onPress={() =>
              simularPesoCedula(2.3, 'cedula_identidad_docente.png')
            }
          >
            <Text
              style={[
                styles.chipBtnText,
                documentos.cedulaIdentidad.pesoMb <= LIMITE_MAXIMO_MB &&
                  styles.chipBtnTextActive,
              ]}
            >
              📷 Subir Cédula Válida (2.3 MB)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chipBtn,
              documentos.cedulaIdentidad.pesoMb > LIMITE_MAXIMO_MB &&
                styles.chipBtnDanger,
            ]}
            onPress={() =>
              simularPesoCedula(12.4, 'cedula_sin_comprimir.png')
            }
          >
            <Text
              style={[
                styles.chipBtnText,
                documentos.cedulaIdentidad.pesoMb > LIMITE_MAXIMO_MB &&
                  styles.chipBtnTextActive,
              ]}
            >
              Simular archivo &gt; 10 MB (12.4 MB)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* RECAUDO 2: FOTO PERSONAL DEL DOCENTE */}
      <View style={styles.docCard}>
        <View style={styles.docHeaderRow}>
          <Text style={styles.docNumberTitle}>
            2. Fotografía Personal del Docente *
          </Text>
          <View style={styles.formatPill}>
            <Text style={styles.formatPillText}>Imagen JPG / PNG • Máx. 10 MB</Text>
          </View>
        </View>
        <Text style={styles.docDescription}>
          Foto clara de frente (rostro despejado o con tu instrumento) que se mostrará en tu perfil de docente una vez acreditado.
        </Text>
        <View style={styles.fileStatusBox}>
          <Text style={styles.fileStatusText}>
            {documentos.fotoPersonal.cargado
              ? `✓ Adjunto: ${documentos.fotoPersonal.nombreArchivo} (${documentos.fotoPersonal.pesoMb} MB)`
              : '⚠️ Pendiente por adjuntar'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.chipBtn,
            documentos.fotoPersonal.cargado && styles.chipBtnActive,
          ]}
          onPress={() => toggleDocumento('fotoPersonal')}
        >
          <Text
            style={[
              styles.chipBtnText,
              documentos.fotoPersonal.cargado && styles.chipBtnTextActive,
            ]}
          >
            {documentos.fotoPersonal.cargado
              ? '✓ Foto Personal Cargada (Cambiar)'
              : '📷 Adjuntar Foto Personal'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* RECAUDO 3: CURRÍCULUM VITAE (CV MUSICAL) */}
      <View style={styles.docCard}>
        <View style={styles.docHeaderRow}>
          <Text style={styles.docNumberTitle}>
            3. Currículum Vitae Musical (CV) *
          </Text>
          <View style={styles.formatPillPdf}>
            <Text style={styles.formatPillPdfText}>Documento PDF • Máx. 10 MB</Text>
          </View>
        </View>
        <Text style={styles.docDescription}>
          Resumen curricular con tus estudios musicales, cátedras cursadas, orquestas donde has tocado y experiencia pedagógica.
        </Text>
        <View style={styles.fileStatusBox}>
          <Text style={styles.fileStatusText}>
            {documentos.curriculumVitae.cargado
              ? `✓ Adjunto: ${documentos.curriculumVitae.nombreArchivo} (${documentos.curriculumVitae.pesoMb} MB)`
              : '⚠️ Pendiente por adjuntar'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.chipBtn,
            documentos.curriculumVitae.cargado && styles.chipBtnActive,
          ]}
          onPress={() => toggleDocumento('curriculumVitae')}
        >
          <Text
            style={[
              styles.chipBtnText,
              documentos.curriculumVitae.cargado && styles.chipBtnTextActive,
            ]}
          >
            {documentos.curriculumVitae.cargado
              ? '✓ CV en PDF Adjunto (Cambiar)'
              : '📄 Adjuntar Currículum Vitae (PDF)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* RECAUDO 4: CERTIFICACIONES QUE DEMUESTREN QUE ES MÚSICO Y SABE TOCAR EL INSTRUMENTO */}
      <View style={styles.docCard}>
        <View style={styles.docHeaderRow}>
          <Text style={styles.docNumberTitle}>
            4. Certificaciones y Avales Musicales / Sinfónicos *
          </Text>
          <View style={styles.formatPillPdf}>
            <Text style={styles.formatPillPdfText}>Documento PDF • Máx. 10 MB</Text>
          </View>
        </View>
        <Text style={styles.docDescription}>
          Certificados de una Orquesta Sinfónica, títulos de Conservatorio, constancias de El Sistema o diplomas que avalen que eres músico y estás capacitado para enseñar los instrumentos indicados.
        </Text>

        <View style={{ marginBottom: 10 }}>
          <Text style={styles.fieldLabel}>
            Describe las certificaciones incluidas en tu archivo PDF *:
          </Text>
          <TextInput
            style={styles.textInput}
            value={detalleCertificaciones}
            onChangeText={setDetalleCertificaciones}
            multiline
            placeholder="Ej. Certificado de la Orquesta Sinfónica Simón Bolívar, Título de Conservatorio..."
            placeholderTextColor="#64748B"
          />
        </View>

        <View style={styles.fileStatusBox}>
          <Text style={styles.fileStatusText}>
            {documentos.certificacionesMusicales.cargado
              ? `✓ Adjunto: ${documentos.certificacionesMusicales.nombreArchivo} (${documentos.certificacionesMusicales.pesoMb} MB)`
              : '⚠️ Pendiente por adjuntar'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.chipBtn,
            documentos.certificacionesMusicales.cargado && styles.chipBtnActive,
          ]}
          onPress={() => toggleDocumento('certificacionesMusicales')}
        >
          <Text
            style={[
              styles.chipBtnText,
              documentos.certificacionesMusicales.cargado &&
                styles.chipBtnTextActive,
            ]}
          >
            {documentos.certificacionesMusicales.cargado
              ? '✓ Certificaciones Musicales en PDF Adjuntas'
              : '🏅 Adjuntar Certificados de Sinfónica / Conservatorio (PDF)'}
          </Text>
        </TouchableOpacity>
      </View>

      {errorCarga && (
        <View style={styles.errorAlert}>
          <Text style={styles.errorAlertText}>⚠️ {errorCarga}</Text>
        </View>
      )}

      {enviadoExitosamente && (
        <View style={styles.successAlert}>
          <Text style={styles.successAlertTitle}>
            ✓ ¡Documentos enviados a Revisión de Fundaoboe!
          </Text>
          <Text style={styles.successAlertDesc}>
            Tu expediente con Cédula, Foto, CV y Certificaciones Musicales ya fue recibido por el Encargado de Fundaoboe. Una vez aprobado, al iniciar sesión entrarás directo a tu Perfil de Profesor Acreditado.
          </Text>
          <TouchableOpacity
            style={styles.goReviewerButton}
            onPress={onGoToReviewerConsole}
          >
            <Text style={styles.goReviewerButtonText}>
              🛡️ Ir al Panel del Encargado de Fundaoboe para Acreditar este Docente →
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleEnviarRecaudos}
      >
        <Text style={styles.primaryButtonText}>
          Enviar Documentos para Acreditación de Fundaoboe →
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onBackToLogin}
      >
        <Text style={styles.secondaryButtonText}>
          ← Volver a Inicio de Sesión
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
  headerBanner: {
    backgroundColor: AZUL_NOCHE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: AZUL_REY,
  },
  stepBadge: {
    color: '#FFBF00',
    fontSize: 11.5,
    fontWeight: '900',
    marginBottom: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 6,
  },
  headerSubtitle: {
    color: '#B3D1FF',
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 19,
  },
  guideBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: AZUL_REY,
    marginBottom: 14,
  },
  guideTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: AZUL_NOCHE,
    marginBottom: 6,
  },
  guideText: {
    fontSize: 13.5,
    color: '#1E293B',
    lineHeight: 19,
    marginBottom: 4,
    fontWeight: '600',
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    marginBottom: 14,
  },
  docHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  docNumberTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: AZUL_NOCHE,
  },
  formatPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#92400E',
  },
  formatPillText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#92400E',
  },
  formatPillPdf: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AZUL_REY,
  },
  formatPillPdfText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: AZUL_REY,
  },
  docDescription: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 10,
    fontWeight: '500',
  },
  fileStatusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#64748B',
    marginBottom: 10,
  },
  fileStatusText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: BORDE_ALTO_CONTRASTE,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipBtnActive: {
    backgroundColor: AZUL_REY,
    borderColor: AZUL_REY,
  },
  chipBtnDanger: {
    backgroundColor: '#C81E1E',
    borderColor: '#C81E1E',
  },
  chipBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: AZUL_NOCHE,
  },
  chipBtnTextActive: {
    color: '#FFFFFF',
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
    fontSize: 14,
    color: AZUL_NOCHE,
    fontWeight: '600',
  },
  errorAlert: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#C81E1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  errorAlertText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  successAlert: {
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#047857',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  successAlertTitle: {
    color: '#065F46',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  successAlertDesc: {
    color: '#065F46',
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
    marginBottom: 12,
  },
  goReviewerButton: {
    backgroundColor: '#047857',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  goReviewerButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: AZUL_REY,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
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
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AZUL_REY,
  },
  secondaryButtonText: {
    color: AZUL_REY,
    fontSize: 14.5,
    fontWeight: '900',
  },
});
