// src/screens/BookingConfirmationScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {
  ModalidadClase,
  OpcionContratacionDocente,
  SesionClaseRow,
  SubperfilAlumno,
} from '../types/atril.types';
import { bloquearFondosEscrow, normalizarModalidadClase } from '../services/escrowService';
import { Paso1SeleccionReserva } from './TeacherProfileScheduleScreen';

export interface BookingConfirmationScreenProps {
  seleccionPaso1: Paso1SeleccionReserva;
  tutorId: string;
  enlaceZoomDefault?: string;
  onBackToSchedule: () => void;
  onSuccessEscrow: (
    sesion: SesionClaseRow,
    opcion: OpcionContratacionDocente,
    alumno: SubperfilAlumno,
    objetivoSesion: string
  ) => void;
}

const ETIQUETA_MODALIDAD: Record<ModalidadClase, string> = {
  online_en_vivo: 'Online En Vivo (Sala Zoom)',
  presencial_caracas: 'Presencial Caracas (Sede FundaOboeHJK)',
  hibrido: 'Híbrido (Presencial + Zoom)',
};

export default function BookingConfirmationScreen({
  seleccionPaso1,
  tutorId,
  enlaceZoomDefault = 'https://zoom.us/j/98451203941',
  onBackToSchedule,
  onSuccessEscrow,
}: BookingConfirmationScreenProps) {
  const { ficha, modalidad, bloqueHorario, alumnoBeneficiario } = seleccionPaso1;

  const opcionPopular =
    ficha.opcionesContratacion.find((o) => o.cantidadClases === 6) ??
    ficha.opcionesContratacion[0];

  const [opcionSeleccionada, setOpcionSeleccionada] =
    useState<OpcionContratacionDocente>(opcionPopular);
  const [objetivoSesion, setObjetivoSesion] = useState<string>(
    'Revisión de concierto de Haydn, afinación y digitación'
  );
  const [aceptaRegla24h, setAceptaRegla24h] = useState<boolean>(false);
  const [procesando, setProcesando] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const subtotalBruto = Number(
    (opcionSeleccionada.montoTotalUsd + opcionSeleccionada.ahorroUsd).toFixed(2)
  );

  const handleConfirmarPagoEscrow = async () => {
    if (!aceptaRegla24h) {
      setErrorMsg('Debes aceptar las políticas de cancelación (regla 24h) para continuar.');
      return;
    }

    setErrorMsg(null);
    setProcesando(true);
    try {
      const modNorm = normalizarModalidadClase(modalidad);
      const { sesion } = await bloquearFondosEscrow({
        tutorId,
        alumnoId: alumnoBeneficiario.id,
        profesorId: ficha.profesor_id,
        fechaHora: bloqueHorario.fechaHoraIso,
        modalidad: modNorm,
        montoBruto: opcionSeleccionada.montoTotalUsd,
        enlaceZoom: modNorm === 'online_en_vivo' ? enlaceZoomDefault : undefined,
      });

      onSuccessEscrow(
        sesion,
        opcionSeleccionada,
        alumnoBeneficiario,
        objetivoSesion.trim() || 'Sesión académica personalizada'
      );
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'No se pudo procesar la custodia fiduciaria en este momento.'
      );
    } finally {
      setProcesando(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabecera Paso 2 de 3 */}
      <View style={styles.topHeaderRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBackToSchedule}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepPillText}>PASO 2 DE 3 • PAQUETE Y REGLAS 24H</Text>
          <Text style={styles.screenTitle}>Confirmación y Custodia</Text>
        </View>
      </View>

      {/* Resumen del Profesor y Bloque Seleccionado en Paso 1 */}
      <View style={styles.summaryBanner}>
        <Text style={styles.summaryBannerTag}>RESUMEN DE SELECCIÓN PREVIA</Text>
        <Text style={styles.summaryTeacherName}>{ficha.nombre}</Text>
        <Text style={styles.summaryDetailLine}>
          🗓️ Horario: <Text style={styles.summaryBold}>{bloqueHorario.etiqueta}</Text>
        </Text>
        <Text style={styles.summaryDetailLine}>
          📍 Modalidad: <Text style={styles.summaryBold}>{ETIQUETA_MODALIDAD[modalidad]}</Text>
        </Text>
        <Text style={styles.summaryDetailLine}>
          🎓 Estudiante: <Text style={styles.summaryBold}>{alumnoBeneficiario.nombre_menor}</Text>
        </Text>
      </View>

      {/* Input para Objetivo / Tema de la Sesión */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Objetivo / Tema de la Sesión</Text>
        <Text style={styles.sectionSubtitle}>
          Indica el repertorio, estudio técnico o pasaje que trabajarás con el maestro:
        </Text>
        <TextInput
          style={styles.topicInput}
          placeholder="Ej. Revisión de concierto de Haydn, afinación y digitación"
          placeholderTextColor="#94A3B8"
          multiline
          value={objetivoSesion}
          onChangeText={setObjetivoSesion}
        />
      </View>

      {/* Selector de Contratación */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Selector de Contratación</Text>
        <Text style={styles.sectionSubtitle}>
          Elige clase individual o ahorra con abonos custodiados en Escrow:
        </Text>

        <View style={styles.packagesContainer}>
          {ficha.opcionesContratacion.map((opcion) => {
            const seleccionada = opcion.id === opcionSeleccionada.id;
            const esMasPopular = opcion.cantidadClases === 6;
            const esIntensivo = opcion.cantidadClases === 8;

            return (
              <TouchableOpacity
                key={opcion.id}
                style={[
                  styles.packageOptionCard,
                  seleccionada && styles.packageOptionCardSelected,
                ]}
                activeOpacity={0.85}
                onPress={() => setOpcionSeleccionada(opcion)}
              >
                <View style={styles.packageTopRow}>
                  <Text
                    style={[
                      styles.packageTitle,
                      seleccionada && { color: AZUL_INSTITUCIONAL },
                    ]}
                  >
                    {opcion.cantidadClases === 1
                      ? 'Clase Individual (60 min)'
                      : opcion.cantidadClases === 6
                      ? 'Abono 6 Clases (-10%)'
                      : 'Abono 8 Clases (-12%)'}
                  </Text>

                  {esMasPopular && (
                    <View style={styles.goldPopularPill}>
                      <Text style={styles.goldPopularText}>★ Más Popular</Text>
                    </View>
                  )}

                  {esIntensivo && (
                    <View style={styles.emeraldDiscountPill}>
                      <Text style={styles.emeraldDiscountText}>Descuento intensivo</Text>
                    </View>
                  )}
                </View>

                <View style={styles.packageBottomRow}>
                  <Text style={styles.packageSubText}>{opcion.subtitulo}</Text>
                  <Text style={styles.packagePriceText}>
                    ${opcion.montoTotalUsd.toFixed(2)} USD
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Desglose Contable Claro */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Desglose Contable Fiduciario</Text>

        <View style={styles.accountingRow}>
          <Text style={styles.accountingLabel}>
            Subtotal Bruto ({opcionSeleccionada.cantidadClases}{' '}
            {opcionSeleccionada.cantidadClases === 1 ? 'clase' : 'clases'}):
          </Text>
          <Text style={styles.accountingValue}>${subtotalBruto.toFixed(2)} USD</Text>
        </View>

        <View style={styles.accountingRow}>
          <Text style={styles.accountingLabel}>
            Ahorro por Abono ({opcionSeleccionada.porcentajeDescuento}%):
          </Text>
          <Text
            style={[
              styles.accountingValue,
              opcionSeleccionada.ahorroUsd > 0 && { color: VERDE, fontWeight: '800' },
            ]}
          >
            {opcionSeleccionada.ahorroUsd > 0
              ? `-$${opcionSeleccionada.ahorroUsd.toFixed(2)} USD`
              : '$0.00 USD'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.accountingRow}>
          <Text style={styles.totalLabel}>Total a Bloquear en Escrow:</Text>
          <Text style={styles.totalAmount}>
            ${opcionSeleccionada.montoTotalUsd.toFixed(2)} USD
          </Text>
        </View>

        {/* Checkbox Obligatorio Regla 24h */}
        <TouchableOpacity
          style={styles.checkboxRow}
          activeOpacity={0.8}
          onPress={() => {
            setAceptaRegla24h((prev) => !prev);
            setErrorMsg(null);
          }}
        >
          <View style={[styles.checkboxBox, aceptaRegla24h && styles.checkboxBoxActive]}>
            {aceptaRegla24h && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
          <Text style={styles.checkboxText}>
            Acepto los Términos, Políticas de Cancelación (regla 24h) y Supervisión Docente
          </Text>
        </TouchableOpacity>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Acciones de Navegación del Paso 2 */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onBackToSchedule}
            disabled={procesando}
          >
            <Text style={styles.secondaryBtnText}>← Cambiar Horario</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!aceptaRegla24h || procesando}
            style={[
              styles.primaryBtn,
              (!aceptaRegla24h || procesando) && styles.primaryBtnDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleConfirmarPagoEscrow}
          >
            <Text style={styles.primaryBtnText}>
              {procesando ? 'Procesando...' : 'Confirmar y Proceder al Pago'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const AZUL_REY = '#1D4ED8';
const AZUL_INSTITUCIONAL = '#1E40AF';
const FONDO = '#F8FAFC';
const BLANCO = '#FFFFFF';
const AMBAR = '#D97706';
const VERDE = '#059669';
const ROJO = '#DC2626';

const styles = StyleSheet.create({
  container: {
    backgroundColor: FONDO,
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
    fontSize: 16,
    fontWeight: '900',
    color: AZUL_INSTITUCIONAL,
  },
  stepPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: AZUL_REY,
    letterSpacing: 0.4,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A192F',
  },
  summaryBanner: {
    backgroundColor: AZUL_INSTITUCIONAL,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  summaryBannerTag: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FDE68A',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryTeacherName: {
    fontSize: 16,
    fontWeight: '800',
    color: BLANCO,
    marginBottom: 6,
  },
  summaryDetailLine: {
    fontSize: 12,
    color: '#DBEAFE',
    marginBottom: 3,
  },
  summaryBold: {
    color: BLANCO,
    fontWeight: '800',
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
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  topicInput: {
    backgroundColor: FONDO,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 54,
    textAlignVertical: 'top',
  },
  packagesContainer: {
    gap: 10,
  },
  packageOptionCard: {
    backgroundColor: FONDO,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 13,
  },
  packageOptionCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: AZUL_REY,
    borderWidth: 2,
  },
  packageTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  packageTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0A192F',
  },
  goldPopularPill: {
    backgroundColor: AMBAR,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  goldPopularText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: BLANCO,
  },
  emeraldDiscountPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  emeraldDiscountText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: VERDE,
  },
  packageBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageSubText: {
    fontSize: 11.5,
    color: '#475569',
    flex: 1,
    paddingRight: 8,
  },
  packagePriceText: {
    fontSize: 15,
    fontWeight: '900',
    color: AZUL_REY,
  },
  accountingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountingLabel: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '600',
  },
  accountingValue: {
    fontSize: 13,
    color: '#0A192F',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#0A192F',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: AZUL_REY,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 14,
    backgroundColor: FONDO,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: AZUL_REY,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLANCO,
  },
  checkboxBoxActive: {
    backgroundColor: AZUL_REY,
  },
  checkboxCheck: {
    color: BLANCO,
    fontSize: 13,
    fontWeight: '900',
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    lineHeight: 17,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: ROJO,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: ROJO,
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    backgroundColor: BLANCO,
    borderWidth: 1.5,
    borderColor: AZUL_INSTITUCIONAL,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: AZUL_INSTITUCIONAL,
    fontSize: 12,
    fontWeight: '800',
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: AZUL_REY,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  primaryBtnText: {
    color: BLANCO,
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
  },
});
