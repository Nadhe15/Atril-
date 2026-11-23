// src/screens/PendingVerificationScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import THEME from '../constants/theme';
import {
  getCurrentSessionUser,
  PerfilUsuarioAtril,
} from '../services/authService';
import { obtenerUsuarioDeCacheAdmin } from '../services/adminService';

export interface PendingVerificationScreenProps {
  usuario: PerfilUsuarioAtril;
  onStatusUpdated?: (usuarioActualizado: PerfilUsuarioAtril) => void;
  onRefreshStatus?: () => Promise<void> | void;
  onLogout: () => void;
}

const CORREO_ACREDITACION_FUNDAOBOE = 'acreditacion@fundaoboe.org.ve';

export default function PendingVerificationScreen({
  usuario,
  onStatusUpdated,
  onRefreshStatus,
  onLogout,
}: PendingVerificationScreenProps) {
  const [verificando, setVerificando] = useState<boolean>(false);
  const [mensajeEstado, setMensajeEstado] = useState<string | null>(null);

  const esSuspendido = usuario.estado_verificacion === 'suspendido';
  const esDocente = usuario.rol_v5 === 'docente' || usuario.rol === 'docente';

  const handleRefrescarEstado = async () => {
    setVerificando(true);
    setMensajeEstado(null);
    try {
      if (onRefreshStatus) {
        await onRefreshStatus();
      }

      const enCache = obtenerUsuarioDeCacheAdmin(usuario.id);
      const sesionRemota = await getCurrentSessionUser();

      const estadoActual =
        enCache?.estado_verificacion ??
        sesionRemota?.estado_verificacion ??
        usuario.estado_verificacion;

      const actualizado: PerfilUsuarioAtril = {
        ...usuario,
        ...(sesionRemota ?? {}),
        estado_verificacion: estadoActual,
      };

      if (onStatusUpdated) {
        onStatusUpdated(actualizado);
      }

      if (estadoActual === 'verificado') {
        setMensajeEstado('✓ ¡Tu cuenta ha sido verificada por Fundaoboe!');
      } else if (estadoActual === 'suspendido') {
        setMensajeEstado(
          'Tu cuenta figura como suspendida. Comunícate con el comité académico.'
        );
      } else {
        setMensajeEstado(
          'Tu solicitud sigue en estado pendiente de revisión por Fundaoboe.'
        );
      }
    } finally {
      setVerificando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Superior de Estado */}
        <View
          style={[
            styles.statusHeaderCard,
            esSuspendido ? styles.statusHeaderDanger : styles.statusHeaderWarn,
          ]}
        >
          <View
            style={[
              styles.statusPill,
              esSuspendido ? styles.statusPillDanger : styles.statusPillWarn,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                esSuspendido
                  ? styles.statusPillTextDanger
                  : styles.statusPillTextWarn,
              ]}
            >
              {esSuspendido
                ? '⛔ CUENTA SUSPENDIDA / INACTIVA'
                : '⏳ VERIFICACIÓN EN PROCESO'}
            </Text>
          </View>

          <Text style={styles.mainTitle}>
            {esSuspendido
              ? 'Acceso Temporalmente Restringido'
              : esDocente
              ? 'Postulación Docente Recibida'
              : 'Solicitud de Verificación Estudiantil Recibida'}
          </Text>

          <Text style={styles.subtitle}>
            {esSuspendido
              ? 'Tu cuenta ha sido marcada como suspendida por la administración de Fundaoboe.'
              : 'Por políticas de protección académica y tutela comunitaria, el acceso al catálogo completo y al chat directo requiere acreditación previa de Fundaoboe.'}
          </Text>
        </View>

        {/* Tarjeta Explicativa del Proceso Externo por Correo */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            📧 Proceso de Acreditación Externa con Fundaoboe
          </Text>
          <Text style={styles.bodyText}>
            La verificación de identidad, recepción de recaudos documentales y coordinación de entrevista se realizan de forma externa por correo electrónico con el comité de la Fundación Venezolana.
          </Text>

          <View style={styles.emailReferenceBox}>
            <Text style={styles.emailLabel}>
              CORREO INSTITUCIONAL DE ACREDITACIÓN:
            </Text>
            <Text style={styles.emailAddress}>{CORREO_ACREDITACION_FUNDAOBOE}</Text>
            <Text style={styles.emailHint}>
              Envía un mensaje indicando tu nombre completo, número de cédula y rol solicitado ({esDocente ? 'Profesor' : 'Estudiante'}) para completar tu validación.
            </Text>
          </View>

          <View style={styles.stepsList}>
            <Text style={styles.stepItem}>
              1. <Text style={styles.stepBold}>Revisión de identidad:</Text> Verificamos tus datos básicos{usuario.es_menor ? ' y los de tu representante legal' : ''}.
            </Text>
            <Text style={styles.stepItem}>
              2. <Text style={styles.stepBold}>Entrevista y aval:</Text>{' '}
              {esDocente
                ? 'El consejo académico valida tu cátedra y experiencia pedagógica.'
                : 'Confirmamos tu perfil formativo para asignarte acceso a los maestros.'}
            </Text>
            <Text style={styles.stepItem}>
              3. <Text style={styles.stepBold}>Activación inmediata:</Text> Una vez aprobado por un administrador, pulsa &ldquo;Comprobar Estado de Verificación&rdquo; para entrar.
            </Text>
          </View>
        </View>

        {/* Resumen de Datos Registrados */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resumen de tu Solicitud</Text>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Titular:</Text>
            <Text style={styles.dataValue}>{usuario.nombre_completo}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Rol solicitado:</Text>
            <Text style={styles.dataValue}>
              {esDocente ? '🎻 Profesor / Maestro' : '🎓 Estudiante'}
            </Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Correo registrado:</Text>
            <Text style={styles.dataValue}>{usuario.email}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Teléfono:</Text>
            <Text style={styles.dataValue}>
              {usuario.telefono || 'No especificado'}
            </Text>
          </View>

          {esDocente && usuario.area_docente && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Área / Cátedra:</Text>
              <Text style={styles.dataValue}>{usuario.area_docente}</Text>
            </View>
          )}

          {usuario.es_menor && usuario.nombre_representante && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Representante legal:</Text>
              <Text style={styles.dataValue}>
                {usuario.nombre_representante} ({usuario.cedula_representante})
              </Text>
            </View>
          )}
        </View>

        {mensajeEstado && (
          <View style={styles.feedbackBanner}>
            <Text style={styles.feedbackText}>{mensajeEstado}</Text>
          </View>
        )}

        {/* Acciones: Refrescar Estado y Cerrar Sesión */}
        <TouchableOpacity
          disabled={verificando}
          style={styles.refreshButton}
          activeOpacity={0.85}
          onPress={handleRefrescarEstado}
        >
          {verificando ? (
            <ActivityIndicator size="small" color={THEME.surface} />
          ) : (
            <Text style={styles.refreshButtonText}>
              🔄 Comprobar Estado de Verificación
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={onLogout}
        >
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  statusHeaderCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    marginBottom: 16,
  },
  statusHeaderWarn: {
    backgroundColor: THEME.warnTint,
    borderColor: THEME.warnText,
  },
  statusHeaderDanger: {
    backgroundColor: THEME.dangerTint,
    borderColor: THEME.danger,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 10,
  },
  statusPillWarn: {
    backgroundColor: THEME.gold,
  },
  statusPillDanger: {
    backgroundColor: THEME.danger,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  statusPillTextWarn: {
    color: THEME.navy,
  },
  statusPillTextDanger: {
    color: THEME.surface,
  },
  mainTitle: {
    color: THEME.textTitle,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    color: THEME.textBody,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
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
    fontSize: 15.5,
    fontWeight: '900',
    marginBottom: 8,
  },
  bodyText: {
    color: THEME.textBody,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  emailReferenceBox: {
    backgroundColor: THEME.navy,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: THEME.gold,
    marginBottom: 14,
  },
  emailLabel: {
    color: THEME.gold,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  emailAddress: {
    color: THEME.surface,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 6,
  },
  emailHint: {
    color: THEME.surfaceSub,
    fontSize: 12,
    lineHeight: 17,
  },
  stepsList: {
    gap: 8,
  },
  stepItem: {
    color: THEME.textBody,
    fontSize: 12.5,
    lineHeight: 18,
  },
  stepBold: {
    fontWeight: '900',
    color: THEME.textTitle,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: THEME.surfaceSub,
    gap: 10,
  },
  dataLabel: {
    color: THEME.textMuted,
    fontSize: 12.5,
    fontWeight: '700',
  },
  dataValue: {
    color: THEME.textTitle,
    fontSize: 12.5,
    fontWeight: '900',
    flex: 1,
    textAlign: 'right',
  },
  feedbackBanner: {
    backgroundColor: THEME.surfaceSub,
    borderWidth: 1.5,
    borderColor: THEME.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  feedbackText: {
    color: THEME.textTitle,
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  refreshButtonText: {
    color: THEME.surface,
    fontSize: 14,
    fontWeight: '900',
  },
  logoutButton: {
    backgroundColor: THEME.dangerTint,
    borderWidth: 1.5,
    borderColor: THEME.danger,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: THEME.dangerText,
    fontSize: 13.5,
    fontWeight: '900',
  },
});
