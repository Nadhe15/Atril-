// src/screens/ChatRoomScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import THEME from '../constants/theme';
import { PerfilUsuarioAtril } from '../services/authService';
import {
  enviarMensaje,
  obtenerMensajes,
  suscribirMensajesConversacion,
} from '../services/chatService';
import { ConversacionRow, MensajeRow } from '../types/atril.types';

export interface ChatRoomScreenProps {
  conversacion: ConversacionRow;
  usuarioActual: PerfilUsuarioAtril;
  onBack: () => void;
}

function formatearHora(isoString: string): string {
  try {
    const fecha = new Date(isoString);
    return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ChatRoomScreen({
  conversacion,
  usuarioActual,
  onBack,
}: ChatRoomScreenProps) {
  const [mensajes, setMensajes] = useState<MensajeRow[]>([]);
  const [textoInput, setTextoInput] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);
  const [enviando, setEnviando] = useState<boolean>(false);

  const esDocente =
    usuarioActual.rol_v5 === 'docente' || usuarioActual.rol === 'docente';

  const nombreContraparte = esDocente
    ? conversacion.nombre_alumno || 'Estudiante Verificado'
    : conversacion.nombre_profesor || 'Profesor FundaOboeHJK';

  const cargarHistorial = useCallback(async () => {
    setCargando(true);
    try {
      const historial = await obtenerMensajes(conversacion.id);
      setMensajes(historial);
    } finally {
      setCargando(false);
    }
  }, [conversacion.id]);

  useEffect(() => {
    cargarHistorial();

    const unsubscribe = suscribirMensajesConversacion(
      conversacion.id,
      (nuevoMensaje) => {
        setMensajes((prev) => {
          if (prev.some((m) => m.id === nuevoMensaje.id)) {
            return prev;
          }
          return [...prev, nuevoMensaje];
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversacion.id, cargarHistorial]);

  const handleEnviar = async () => {
    if (!textoInput.trim() || enviando) return;
    const contenido = textoInput.trim();
    setTextoInput('');
    setEnviando(true);

    try {
      const creado = await enviarMensaje(
        conversacion.id,
        usuarioActual.id,
        contenido,
        usuarioActual.nombre_completo
      );
      setMensajes((prev) => {
        if (prev.some((m) => m.id === creado.id)) {
          return prev;
        }
        return [...prev, creado];
      });
    } finally {
      setEnviando(false);
    }
  };

  const renderMensaje = ({ item }: { item: MensajeRow }) => {
    const esMio = item.remitente_id === usuarioActual.id;

    return (
      <View
        style={[
          styles.bubbleWrapper,
          esMio ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft,
        ]}
      >
        <View
          style={[
            styles.bubble,
            esMio ? styles.bubbleRight : styles.bubbleLeft,
          ]}
        >
          <Text
            style={[
              styles.bubbleAuthor,
              esMio ? styles.bubbleAuthorRight : styles.bubbleAuthorLeft,
            ]}
          >
            {esMio ? 'Tú' : item.nombre_remitente || nombreContraparte}
          </Text>
          <Text
            style={[
              styles.bubbleText,
              esMio ? styles.bubbleTextRight : styles.bubbleTextLeft,
            ]}
          >
            {item.contenido}
          </Text>
          <Text
            style={[
              styles.bubbleTime,
              esMio ? styles.bubbleTimeRight : styles.bubbleTimeLeft,
            ]}
          >
            {formatearHora(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Cabecera de la Sala de Chat */}
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Bandeja</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.counterpartTitle} numberOfLines={1}>
            {nombreContraparte}
          </Text>
          <Text style={styles.areaSubtitle} numberOfLines={1}>
            🎼 {conversacion.area_interes || 'Cátedra Musical FundaOboeHJK'}
          </Text>
        </View>
      </View>

      {/* Lista de Mensajes con FlatList */}
      <View style={styles.messagesContainer}>
        {cargando ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={THEME.primary} />
            <Text style={styles.loadingText}>Cargando mensajes...</Text>
          </View>
        ) : (
          <FlatList
            data={mensajes}
            keyExtractor={(item) => item.id}
            renderItem={renderMensaje}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyBoxText}>
                  Escribe el primer mensaje para coordinar tu clase de{' '}
                  {conversacion.area_interes || 'música'}.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Barra Inferior de Entrada de Mensaje */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Escribe un mensaje académico..."
          placeholderTextColor={THEME.borderSoft}
          value={textoInput}
          onChangeText={setTextoInput}
          multiline
        />
        <TouchableOpacity
          disabled={!textoInput.trim() || enviando}
          style={[
            styles.sendBtn,
            (!textoInput.trim() || enviando) && styles.sendBtnDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleEnviar}
        >
          <Text style={styles.sendBtnText}>
            {enviando ? '...' : 'Enviar →'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.navy,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  backBtn: {
    backgroundColor: THEME.primaryHover,
    borderWidth: 1,
    borderColor: THEME.gold,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  backBtnText: {
    color: THEME.gold,
    fontSize: 12,
    fontWeight: '900',
  },
  counterpartTitle: {
    color: THEME.surface,
    fontSize: 16,
    fontWeight: '900',
  },
  areaSubtitle: {
    color: THEME.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  messagesContainer: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: THEME.borderUi,
    padding: 14,
    minHeight: 340,
    maxHeight: 460,
    marginBottom: 12,
  },
  flatListContent: {
    paddingVertical: 6,
    gap: 10,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.textMuted,
    fontSize: 12.5,
    marginTop: 8,
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyBoxText: {
    color: THEME.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  bubbleWrapperRight: {
    justifyContent: 'flex-end',
  },
  bubbleWrapperLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleRight: {
    backgroundColor: THEME.primary,
    borderBottomRightRadius: 4,
  },
  bubbleLeft: {
    backgroundColor: THEME.surfaceSub,
    borderWidth: 1,
    borderColor: THEME.borderSoft,
    borderBottomLeftRadius: 4,
  },
  bubbleAuthor: {
    fontSize: 10.5,
    fontWeight: '900',
    marginBottom: 3,
  },
  bubbleAuthorRight: {
    color: THEME.gold,
  },
  bubbleAuthorLeft: {
    color: THEME.primary,
  },
  bubbleText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  bubbleTextRight: {
    color: THEME.surface,
    fontWeight: '600',
  },
  bubbleTextLeft: {
    color: THEME.textTitle,
    fontWeight: '600',
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  bubbleTimeRight: {
    color: THEME.surfaceSub,
  },
  bubbleTimeLeft: {
    color: THEME.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderWidth: 1.5,
    borderColor: THEME.borderUi,
    borderRadius: 14,
    padding: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: THEME.background,
    borderWidth: 1,
    borderColor: THEME.borderSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: THEME.textTitle,
    fontSize: 13.5,
    maxHeight: 90,
  },
  sendBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: THEME.borderSoft,
  },
  sendBtnText: {
    color: THEME.surface,
    fontSize: 13,
    fontWeight: '900',
  },
});
