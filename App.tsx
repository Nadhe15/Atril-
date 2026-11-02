// App.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import RoleSelectionScreen, { SelectedAppRole } from './src/screens/RoleSelectionScreen';
import {
  calcularAbono,
  calcularHonorarioClase,
} from './src/utils/escrowCalculator';
import { bloquearFondosEscrow } from './src/services/escrowService';
import {
  declararClaseImpartida,
  responderEncuestaYConfirmar,
} from './src/services/attendanceService';

const DEMO_TUTOR_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_ALUMNO_ID = '11111111-1111-1111-1111-111111111111';
const DEMO_PROFESOR_ID = '99999999-9999-9999-9999-999999999999';

const ETIQUETA_ESTADO_SESION: Record<string, string> = {
  programada: 'Programada',
  declarada_docente: 'Impartida (Pendiente de confirmar)',
  asistencia_validada: 'Asistencia Confirmada',
  incumplimiento_reportado: 'Incidencia Reportada',
  cancelada: 'Cancelada',
};

const ETIQUETA_ESTADO_ESCROW: Record<string, string> = {
  bloqueado: 'Protegido en Custodia Escrow',
  liberado: 'Honorario Liquidado al Docente',
  reembolsado: 'Reembolsado al Representante',
  en_disputa: 'En Revisión Fiduciaria',
};

export default function App() {
  const [selectedRole, setSelectedRole] = useState<SelectedAppRole | null>(null);
  const [tarifaBase] = useState<number>(25.0);
  const [sesionActivaId, setSesionActivaId] = useState<string | null>(null);
  const [estadoSesion, setEstadoSesion] = useState<string>('Sin reservas activas');
  const [estadoEscrow, setEstadoEscrow] = useState<string>('Sin fondos en custodia');
  const [comprobanteReciente, setComprobanteReciente] = useState<string | null>(null);

  const desgloseUnitario = calcularHonorarioClase(tarifaBase);
  const abono6 = calcularAbono(6, tarifaBase);
  const abono8 = calcularAbono(8, tarifaBase);

  const notificar = (titulo: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${titulo}\n\n${msg}`);
    } else {
      Alert.alert(titulo, msg);
    }
  };

  // Reserva y retención en custodia fiduciaria (Alumno / Representante)
  const handleReservarConEscrow = async (monto: number, etiqueta: string) => {
    try {
      const { sesion } = await bloquearFondosEscrow({
        tutorId: DEMO_TUTOR_ID,
        alumnoId: DEMO_ALUMNO_ID,
        profesorId: DEMO_PROFESOR_ID,
        fechaHora: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        modalidad: 'online',
        montoBruto: monto,
      });

      setSesionActivaId(sesion.id);
      setEstadoSesion(ETIQUETA_ESTADO_SESION[sesion.estado_sesion] ?? sesion.estado_sesion);
      setEstadoEscrow(ETIQUETA_ESTADO_ESCROW[sesion.estado_escrow] ?? sesion.estado_escrow);

      const folioCorto = sesion.id.slice(0, 8).toUpperCase();
      setComprobanteReciente(
        `Reserva #${folioCorto} • ${etiqueta} • $${sesion.monto_bruto.toFixed(2)} USD en custodia`
      );

      notificar(
        'Reserva Protegida con Escrow',
        `Tu pago por ${etiqueta} ($${sesion.monto_bruto.toFixed(2)} USD) quedó resguardado bajo custodia fiduciaria de FundaOboeHJK.\n\nFolio de operación: #${folioCorto}`
      );
    } catch (err: any) {
      notificar(
        'No se pudo procesar la reserva',
        err?.message || 'Verifica tu conexión e intenta nuevamente.'
      );
    }
  };

  // Declaración de clase impartida por el Maestro
  const handleDeclararClaseDocente = async () => {
    if (!sesionActivaId) {
      notificar(
        'Sin clases pendientes',
        'Actualmente no tienes sesiones programadas pendientes por declarar.'
      );
      return;
    }

    try {
      const data = await declararClaseImpartida(sesionActivaId, DEMO_PROFESOR_ID);

      setEstadoSesion(ETIQUETA_ESTADO_SESION[data.estado_sesion] ?? data.estado_sesion);
      const folioCorto = data.id.slice(0, 8).toUpperCase();
      setComprobanteReciente(
        `Asistencia registrada #${folioCorto} • En espera de confirmación del representante`
      );

      notificar(
        'Asistencia Registrada',
        `Has registrado la sesión #${folioCorto} como impartida. El representante recibirá la solicitud de confirmación para liberar tus honorarios.`
      );
    } catch (err: any) {
      notificar('No se pudo registrar la asistencia', err?.message || 'Intenta nuevamente.');
    }
  };

  // Confirmación de asistencia y calificación por el Tutor/Alumno
  const handleConfirmarYLiberarEscrow = async () => {
    if (!sesionActivaId) {
      notificar('Sin sesiones por confirmar', 'No tienes clases pendientes de confirmación.');
      return;
    }

    try {
      const resultado = await responderEncuestaYConfirmar(sesionActivaId, DEMO_TUTOR_ID, 5);
      setEstadoSesion(
        ETIQUETA_ESTADO_SESION[resultado.sesion.estado_sesion] ?? resultado.sesion.estado_sesion
      );
      setEstadoEscrow(
        ETIQUETA_ESTADO_ESCROW[resultado.sesion.estado_escrow] ?? resultado.sesion.estado_escrow
      );

      const folioCorto = resultado.sesion.id.slice(0, 8).toUpperCase();
      setComprobanteReciente(
        `Liquidación #${folioCorto} completada • Honorario liberado: $${resultado.movimientoLiberacion.monto_usd.toFixed(2)} USD`
      );

      notificar(
        'Asistencia Confirmada',
        `Gracias por evaluar tu clase (★★★★★).\n\nSe ha liberado el pago al docente ($${resultado.movimientoLiberacion.monto_usd.toFixed(2)} USD netos) y el aporte institucional FundaOboeHJK ($${resultado.movimientoComision.monto_usd.toFixed(2)} USD).`
      );
    } catch (err: any) {
      notificar('Atención', err?.message || 'No se pudo confirmar la asistencia.');
    }
  };

  if (!selectedRole) {
    return (
      <>
        <StatusBar style="dark" />
        <RoleSelectionScreen onSelectRole={(role) => setSelectedRole(role)} />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Barra Superior Institucional */}
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {selectedRole === 'ALUMNO'
                ? 'ESTUDIANTE / REPRESENTANTE'
                : selectedRole === 'DOCENTE'
                ? 'PORTAL DEL MAESTRO'
                : 'VITRINA PÚBLICA'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedRole(null)} style={styles.switchBtn}>
            <Text style={styles.switchBtnText}>⇄ Cambiar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Resumen de Billetera y Custodia Fiduciaria */}
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerTitle}>CUSTODIA FIDUCIARIA ATRIL</Text>
          <Text style={styles.statusLine}>
            • Reserva activa:{' '}
            <Text style={styles.boldWhite}>
              {sesionActivaId ? `#${sesionActivaId.slice(0, 8).toUpperCase()}` : 'Ninguna'}
            </Text>
          </Text>
          <Text style={styles.statusLine}>
            • Estado académico: <Text style={styles.boldGold}>{estadoSesion}</Text>
          </Text>
          <Text style={styles.statusLine}>
            • Garantía Escrow: <Text style={styles.boldGreen}>{estadoEscrow}</Text>
          </Text>
          {comprobanteReciente && (
            <View style={styles.receiptPill}>
              <Text style={styles.receiptPillText}>✓ {comprobanteReciente}</Text>
            </View>
          )}
        </View>

        {/* VISTA ALUMNO / APODERADO */}
        {selectedRole === 'ALUMNO' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Planes y Abonos Formativos</Text>
            <View style={styles.calcBox}>
              <Text style={styles.calcLine}>
                • Sesión Individual (60 min): ${desgloseUnitario.bruto.toFixed(2)} USD
              </Text>
              <Text style={styles.calcLine}>
                • Abono Formativo 6 Clases (-{abono6.porcentajeAhorro}%): $
                {abono6.totalAPagarContado.toFixed(2)} USD (Ahorras ${abono6.ahorroUsd.toFixed(2)})
              </Text>
              <Text style={styles.calcLine}>
                • Abono Intensivo 8 Clases (-{abono8.porcentajeAhorro}%): $
                {abono8.totalAPagarContado.toFixed(2)} USD (Ahorras ${abono8.ahorroUsd.toFixed(2)})
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Contratación y Confirmación de Clases</Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => handleReservarConEscrow(25.0, 'Sesión Individual')}
            >
              <Text style={styles.primaryBtnText}>
                🔒 Reservar Sesión Individual ($25.00 USD)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: '#1E40AF' }]}
              onPress={() =>
                handleReservarConEscrow(abono6.totalAPagarContado, 'Abono Formativo 6 Clases')
              }
            >
              <Text style={styles.primaryBtnText}>
                ★ Contratar Abono 6 Clases ($135.00 USD • -10%)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: '#059669' }]}
              onPress={handleConfirmarYLiberarEscrow}
            >
              <Text style={styles.primaryBtnText}>
                ✓ Confirmar Clase Recibida y Evaluar Docente
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* VISTA DOCENTE / PROFESOR */}
        {selectedRole === 'DOCENTE' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Control de Clases y Honorarios</Text>
            <Text style={styles.helperText}>
              Al finalizar tu sesión en vivo o presencial, registra la clase impartida para notificar al representante y liberar tus honorarios en billetera.
            </Text>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: '#059669' }]}
              onPress={handleDeclararClaseDocente}
            >
              <Text style={styles.primaryBtnText}>
                🎻 Registrar Clase Impartida
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* VISTA VISITANTE */}
        {selectedRole === 'VISITANTE' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Catálogo Público</Text>
            <Text style={styles.helperText}>
              Por normativas de protección a menores de FundaOboeHJK, la reserva de horarios y la billetera Escrow requieren una cuenta verificada de estudiante o representante.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: '#1D4ED8',
    fontSize: 11.5,
    fontWeight: '800',
  },
  switchBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchBtnText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
  },
  statusBanner: {
    backgroundColor: '#0A192F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statusBannerTitle: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  statusLine: {
    color: '#CBD5E1',
    fontSize: 12.5,
    marginBottom: 4,
  },
  boldWhite: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  boldGold: {
    color: '#FDE68A',
    fontWeight: '800',
  },
  boldGreen: {
    color: '#34D399',
    fontWeight: '800',
  },
  receiptPill: {
    marginTop: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#34D399',
  },
  receiptPillText: {
    color: '#E2E8F0',
    fontSize: 11.5,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  calcBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  calcLine: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 6,
  },
  primaryBtn: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
  },
});
