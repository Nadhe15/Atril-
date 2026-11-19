// src/screens/TeacherDetailScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import THEME from '../constants/theme';
import { obtenerOCrearConversacion } from '../services/chatService';
import {
  ConversacionRow,
  DocenteCatalogoItem,
  ModalidadClase,
} from '../types/atril.types';

export interface TeacherDetailScreenProps {
  docente: DocenteCatalogoItem;
  alumnoId: string;
  nombreAlumno: string;
  onBack: () => void;
  onOpenChatRoom: (conversacion: ConversacionRow) => void;
}

const ETIQUETA_MODALIDAD: Record<ModalidadClase, string> = {
  presencial_caracas: 'Presencial Caracas (Sede FundaOboeHJK)',
  online_en_vivo: 'Aula Virtual en Vivo',
  hibrido: 'Híbrido (Presencial y Virtual)',
};

function obtenerIniciales(nombre: string): string {
  const limpio = nombre.replace(/^(Prof\.?|Mtro\.?)\s*/i, '').trim();
  const partes = limpio.split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase();
}

export default function TeacherDetailScreen({
  docente,
  alumnoId,
  nombreAlumno,
  onBack,
  onOpenChatRoom,
}: TeacherDetailScreenProps) {
  const areasDisponibles =
    docente.areasCertificadas.length > 0
      ? docente.areasCertificadas
      : [docente.areaPrincipal];

  const [areaSeleccionada, setAreaSeleccionada] = useState<string>(
    areasDisponibles[0]
  );
  const [iniciandoChat, setIniciandoChat] = useState<boolean>(false);
  const [errorChat, setErrorChat] = useState<string | null>(null);

  const iniciales = obtenerIniciales(docente.nombre);
  const modalidadesTexto = docente.modalidades
    .map((m) => ETIQUETA_MODALIDAD[m] ?? m)
    .join(' • ');

  const handleIniciarChat = async () => {
    setIniciandoChat(true);
    setErrorChat(null);
    try {
      const conversacion = await obtenerOCrearConversacion(
        alumnoId,
        docente.profesor_id,
        areaSeleccionada,
        {
          nombreAlumno,
          nombreProfesor: docente.nombre,
        }
      );
      onOpenChatRoom(conversacion);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar la conversación con el profesor.';
      setErrorChat(msg);
    } finally {
      setIniciandoChat(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Botón Superior de Regreso */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Volver a Profesores</Text>
        </TouchableOpacity>
      </View>

      {/* Cabecera Académica del Profesor */}
      <View style={styles.heroNavyCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{iniciales}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>
                ✓ ACREDITADO POR FUNDAOBOE
              </Text>
            </View>
            <Text style={styles.teacherName}>{docente.nombre}</Text>
            <Text style={styles.primaryAreaText}>
              🎼 {docente.areaPrincipal}
            </Text>
          </View>
        </View>

        <View style={styles.heroDivider} />

        <Text style={styles.heroMetaLine}>
          🏛️ <Text style={styles.heroMetaBold}>Credencial:</Text>{' '}
          {docente.nivel_docente}
        </Text>
        <Text style={styles.heroMetaLine}>
          📍 <Text style={styles.heroMetaBold}>Modalidad:</Text>{' '}
          {modalidadesTexto}
        </Text>
        {docente.sedeReferencia && (
          <Text style={styles.heroMetaLine}>
            🎼 <Text style={styles.heroMetaBold}>Referencia:</Text>{' '}
            {docente.sedeReferencia}
          </Text>
        )}
      </View>

      {/* Trayectoria y Certificaciones Validadas */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Trayectoria y Perfil Pedagógico</Text>
        <Text style={styles.bioText}>{docente.bio}</Text>

        <View style={styles.certBox}>
          <Text style={styles.certBoxTitle}>
            🛡️ Certificaciones Validadas por Fundaoboe
          </Text>
          <Text style={styles.certBullet}>
            • Identidad, títulos académicos y trayectoria artística auditados por el comité institucional.
          </Text>
          <Text style={styles.certBullet}>
            • Áreas autorizadas para formación directa:{' '}
            <Text style={styles.certBold}>{areasDisponibles.join(', ')}</Text>.
          </Text>
        </View>
      </View>

      {/* Selector Interactivo del Área/Cátedra que desea aprender */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Selecciona el Área o Cátedra que deseas estudiar
        </Text>
        <Text style={styles.helperText}>
          Elige la cátedra de tu interés para indicarla al profesor al abrir el canal de mensajería:
        </Text>

        <View style={styles.areasGrid}>
          {areasDisponibles.map((area) => {
            const activa = area === areaSeleccionada;
            return (
              <TouchableOpacity
                key={area}
                style={[styles.areaOption, activa && styles.areaOptionActive]}
                activeOpacity={0.85}
                onPress={() => setAreaSeleccionada(area)}
              >
                <View
                  style={[styles.radioOuter, activa && styles.radioOuterActive]}
                >
                  {activa && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.areaOptionText,
                    activa && styles.areaOptionTextActive,
                  ]}
                >
                  {area}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {errorChat && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠ {errorChat}</Text>
          </View>
        )}

        <TouchableOpacity
          disabled={iniciandoChat}
          style={[styles.chatButton, iniciandoChat && styles.chatButtonDisabled]}
          activeOpacity={0.85}
          onPress={handleIniciarChat}
        >
          {iniciandoChat ? (
            <ActivityIndicator size="small" color={THEME.surface} />
          ) : (
            <Text style={styles.chatButtonText}>
              💬 Iniciar Chat con el Profesor →
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    backgroundColor: THEME.surface,
    borderWidth: 1.5,
    borderColor: THEME.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backBtnText: {
    color: THEME.primary,
    fontSize: 12.5,
    fontWeight: '900',
  },
  heroNavyCard: {
    backgroundColor: THEME.navy,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.primary,
    borderWidth: 2,
    borderColor: THEME.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: THEME.surface,
    fontSize: 19,
    fontWeight: '900',
  },
  verifiedBadge: {
    backgroundColor: THEME.gold,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginBottom: 6,
  },
  verifiedBadgeText: {
    color: THEME.navy,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  teacherName: {
    color: THEME.surface,
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 3,
  },
  primaryAreaText: {
    color: THEME.gold,
    fontSize: 14,
    fontWeight: '800',
  },
  heroDivider: {
    height: 1,
    backgroundColor: THEME.borderUi,
    marginVertical: 14,
  },
  heroMetaLine: {
    color: THEME.surfaceSub,
    fontSize: 12.5,
    lineHeight: 19,
    marginBottom: 4,
  },
  heroMetaBold: {
    color: THEME.surface,
    fontWeight: '900',
  },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: THEME.borderUi,
    marginBottom: 16,
  },
  sectionTitle: {
    color: THEME.textTitle,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  bioText: {
    color: THEME.textBody,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 14,
  },
  certBox: {
    backgroundColor: THEME.successTint,
    borderWidth: 1.5,
    borderColor: THEME.success,
    borderRadius: 12,
    padding: 14,
  },
  certBoxTitle: {
    color: THEME.successText,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  certBullet: {
    color: THEME.successText,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 4,
  },
  certBold: {
    fontWeight: '900',
  },
  helperText: {
    color: THEME.textMuted,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
  },
  areasGrid: {
    gap: 10,
    marginBottom: 16,
  },
  areaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background,
    borderWidth: 1.5,
    borderColor: THEME.borderSoft,
    borderRadius: 12,
    padding: 13,
    gap: 10,
  },
  areaOptionActive: {
    backgroundColor: THEME.surfaceSub,
    borderColor: THEME.primary,
    borderWidth: 2,
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
  },
  radioOuterActive: {
    borderColor: THEME.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.primary,
  },
  areaOptionText: {
    color: THEME.textBody,
    fontSize: 13.5,
    fontWeight: '800',
  },
  areaOptionTextActive: {
    color: THEME.primary,
    fontWeight: '900',
  },
  errorBanner: {
    backgroundColor: THEME.dangerTint,
    borderWidth: 1.5,
    borderColor: THEME.danger,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: THEME.dangerText,
    fontSize: 12,
    fontWeight: '800',
  },
  chatButton: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonDisabled: {
    backgroundColor: THEME.borderSoft,
  },
  chatButtonText: {
    color: THEME.surface,
    fontSize: 14,
    fontWeight: '900',
  },
});
