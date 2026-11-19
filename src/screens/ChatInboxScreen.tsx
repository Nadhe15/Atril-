// src/screens/ChatInboxScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import THEME from '../constants/theme';
import { PerfilUsuarioAtril } from '../services/authService';
import { listarConversacionesUsuario } from '../services/chatService';
import { obtenerCatalogoDocentes } from '../services/teacherCatalogService';
import { ConversacionRow } from '../types/atril.types';

export interface ChatInboxScreenProps {
  usuario: PerfilUsuarioAtril;
  onOpenConversation: (conversacion: ConversacionRow) => void;
  onExploreTeachers?: () => void;
}

export default function ChatInboxScreen({
  usuario,
  onOpenConversation,
  onExploreTeachers,
}: ChatInboxScreenProps) {
  const [conversaciones, setConversaciones] = useState<ConversacionRow[]>([]);
  const [nombresDocentesMap, setNombresDocentesMap] = useState<
    Record<string, string>
  >({});
  const [cargando, setCargando] = useState<boolean>(true);

  const esDocente = usuario.rol_v5 === 'docente' || usuario.rol === 'docente';

  const cargarBandeja = useCallback(async () => {
    setCargando(true);
    try {
      const [listaConv, catalogo] = await Promise.all([
        listarConversacionesUsuario(usuario.id),
        obtenerCatalogoDocentes(),
      ]);

      const mapa: Record<string, string> = {};
      catalogo.forEach((d) => {
        mapa[d.profesor_id] = d.nombre;
        mapa[d.id] = d.nombre;
      });
      setNombresDocentesMap(mapa);
      setConversaciones(listaConv);
    } finally {
      setCargando(false);
    }
  }, [usuario.id]);

  useEffect(() => {
    cargarBandeja();
  }, [cargarBandeja]);

  const obtenerNombreContraparte = (conv: ConversacionRow): string => {
    if (esDocente) {
      return conv.nombre_alumno || 'Estudiante Verificado ATRIL';
    }
    return (
      conv.nombre_profesor ||
      nombresDocentesMap[conv.profesor_id] ||
      'Profesor FundaOboeHJK'
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.microTag}>
            {esDocente
              ? 'CANAL DOCENTE • BANDEJA DE ESTUDIANTES'
              : 'CANAL ESTUDIANTIL • MIS CONVERSACIONES'}
          </Text>
          <Text style={styles.title}>Mensajes Directos</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={cargarBandeja}>
          <Text style={styles.refreshBtnText}>🔄 Actualizar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        {esDocente
          ? 'Coordina horarios, audiciones y repertorio con los estudiantes verificados que han contactado tu cátedra.'
          : 'Conversaciones académicas activas con tus profesores acreditados por Fundaoboe.'}
      </Text>

      {cargando ? (
        <View style={styles.emptyCard}>
          <ActivityIndicator size="small" color={THEME.primary} />
          <Text style={styles.emptyDesc}>Cargando conversaciones...</Text>
        </View>
      ) : conversaciones.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>
            Aún no tienes conversaciones activas
          </Text>
          <Text style={styles.emptyDesc}>
            {esDocente
              ? 'Cuando un estudiante verificado seleccione tu cátedra e inicie un chat, aparecerá aquí.'
              : 'Explora el directorio de Profesores, selecciona una cátedra y pulsa "Iniciar Chat con el Profesor".'}
          </Text>

          {!esDocente && onExploreTeachers && (
            <TouchableOpacity
              style={styles.exploreBtn}
              activeOpacity={0.85}
              onPress={onExploreTeachers}
            >
              <Text style={styles.exploreBtnText}>
                🎼 Explorar Profesores →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        conversaciones.map((conv) => {
          const nombreContraparte = obtenerNombreContraparte(conv);
          const area = conv.area_interes || 'Cátedra Musical';
          const ultimoTexto =
            conv.ultimo_mensaje || 'Toca para abrir los mensajes de esta cátedra';

          return (
            <TouchableOpacity
              key={conv.id}
              style={styles.convCard}
              activeOpacity={0.85}
              onPress={() =>
                onOpenConversation({
                  ...conv,
                  nombre_profesor:
                    conv.nombre_profesor || nombresDocentesMap[conv.profesor_id],
                })
              }
            >
              <View style={styles.convTopRow}>
                <View style={styles.areaPill}>
                  <Text style={styles.areaPillText}>🎼 {area}</Text>
                </View>
                <Text style={styles.openLinkText}>Abrir Chat →</Text>
              </View>

              <Text style={styles.counterpartName}>{nombreContraparte}</Text>
              <Text style={styles.lastMessageText} numberOfLines={2}>
                {ultimoTexto}
              </Text>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  microTag: {
    color: THEME.primary,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  title: {
    color: THEME.textTitle,
    fontSize: 22,
    fontWeight: '900',
  },
  refreshBtn: {
    backgroundColor: THEME.surface,
    borderWidth: 1.5,
    borderColor: THEME.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refreshBtnText: {
    color: THEME.primary,
    fontSize: 11.5,
    fontWeight: '900',
  },
  subtitle: {
    color: THEME.textBody,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1.5,
    borderColor: THEME.borderUi,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: THEME.textTitle,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDesc: {
    color: THEME.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 14,
  },
  exploreBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  exploreBtnText: {
    color: THEME.surface,
    fontSize: 13.5,
    fontWeight: '900',
  },
  convCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: THEME.borderUi,
    marginBottom: 12,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  areaPill: {
    backgroundColor: THEME.surfaceSub,
    borderWidth: 1,
    borderColor: THEME.primary,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  areaPillText: {
    color: THEME.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  openLinkText: {
    color: THEME.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  counterpartName: {
    color: THEME.textTitle,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  lastMessageText: {
    color: THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
