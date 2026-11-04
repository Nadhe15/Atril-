// src/screens/ClassBookingScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  BloqueHorarioDisponible,
  FichaDocenteDetalle,
  ModalidadClase,
  OpcionContratacionDocente,
  SesionClaseRow,
  SubperfilAlumno,
} from '../types/atril.types';
import { obtenerFichaDocente } from '../services/teacherCatalogService';
import { bloquearFondosEscrow, normalizarModalidadClase } from '../services/escrowService';
import { useParentProfiles } from '../hooks/useParentProfiles';

export interface ClassBookingScreenProps {
  profesorId: string;
  tutorId: string;
  enlaceZoomDefault?: string;
  onBack: () => void;
  onBookingConfirmed: (
    sesion: SesionClaseRow,
    opcionElegida: OpcionContratacionDocente,
    alumno: SubperfilAlumno
  ) => void;
}

const ETIQUETA_MODALIDAD_UI: Record<ModalidadClase, string> = {
  online_en_vivo: 'Online En Vivo (Zoom)',
  presencial_caracas: 'Presencial Caracas',
  hibrido: 'Híbrido (Presencial + Zoom)',
};

const obtenerIniciales = (nombre: string): string => {
  const limpio = nombre.replace(/^Prof\.?\s*/i, '').trim();
  const partes = limpio.split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase();
};

export default function ClassBookingScreen({
  profesorId,
  tutorId,
  enlaceZoomDefault = 'https://zoom.us/j/98451203941',
  onBack,
  onBookingConfirmed,
}: ClassBookingScreenProps) {
  const { subperfiles, alumnoActivo, cargarSubperfiles } = useParentProfiles();

  const [ficha, setFicha] = useState<FichaDocenteDetalle | null>(null);
  const [cargandoFicha, setCargandoFicha] = useState<boolean>(true);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<SubperfilAlumno>(alumnoActivo);
  const [modalidadSeleccionada, setModalidadSeleccionada] =
    useState<ModalidadClase>('online_en_vivo');
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<OpcionContratacionDocente | null>(
    null
  );
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState<BloqueHorarioDisponible | null>(
    null
  );
  const [aceptaTerminos24h, setAceptaTerminos24h] = useState<boolean>(false);
  const [procesandoReserva, setProcesandoReserva] = useState<boolean>(false);

  const notificar = (titulo: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${titulo}\n\n${msg}`);
    } else {
      Alert.alert(titulo, msg);
    }
  };

  useEffect(() => {
    cargarSubperfiles(tutorId);
  }, [tutorId, cargarSubperfiles]);

  useEffect(() => {
    setAlumnoSeleccionado(alumnoActivo);
  }, [alumnoActivo]);

  useEffect(() => {
    let montado = true;
    (async () => {
      setCargandoFicha(true);
      try {
        const detalle = await obtenerFichaDocente(profesorId);
        if (!montado) return;
        setFicha(detalle);

        const modInicial: ModalidadClase =
          detalle.modalidades.includes('online_en_vivo') || detalle.modalidades.includes('hibrido')
            ? 'online_en_vivo'
            : 'presencial_caracas';

        setModalidadSeleccionada(modInicial);
        // Seleccionar por defecto el Abono de 6 clases (Más Popular) si existe, o la 1ra opción
        const popular =
          detalle.opcionesContratacion.find((o) => o.cantidadClases === 6) ??
          detalle.opcionesContratacion[0] ??
          null;
        setOpcionSeleccionada(popular);
        setBloqueSeleccionado(detalle.bloquesHorarios[0] ?? null);
      } finally {
        if (montado) setCargandoFicha(false);
      }
    })();

    return () => {
      montado = false;
    };
  }, [profesorId]);

  if (cargandoFicha || !ficha || !opcionSeleccionada || !bloqueSeleccionado) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator size="small" color={AZUL_REY} />
        <Text style={styles.loadingText}>Cargando ficha académica y horarios del maestro...</Text>
      </View>
    );
  }

  const admitePresencial =
    ficha.modalidades.includes('presencial_caracas') || ficha.modalidades.includes('hibrido');
  const admiteOnline =
    ficha.modalidades.includes('online_en_vivo') || ficha.modalidades.includes('hibrido');
  const admiteHibrido =
    ficha.modalidades.includes('hibrido') || (admitePresencial && admiteOnline);

  const handleConfirmarYBloquear = async () => {
    if (!aceptaTerminos24h) {
      notificar(
        'Términos obligatorios',
        'Debes aceptar los Términos, Condiciones y Políticas de Cancelación (regla de 24h) antes de continuar.'
      );
      return;
    }

    setProcesandoReserva(true);
    try {
      const modalidadEnum = normalizarModalidadClase(modalidadSeleccionada);
      const incluyeZoom =
        modalidadEnum === 'online_en_vivo' || modalidadEnum === 'hibrido';

      const { sesion } = await bloquearFondosEscrow({
        tutorId,
        alumnoId: alumnoSeleccionado.id,
        profesorId: ficha.profesor_id,
        fechaHora: bloqueSeleccionado.fechaHoraIso,
        modalidad: modalidadEnum,
        montoBruto: opcionSeleccionada.montoTotalUsd,
        enlaceZoom: incluyeZoom ? enlaceZoomDefault : undefined,
      });

      const folioCorto = sesion.id.slice(0, 8).toUpperCase();
      notificar(
        'Reserva Confirmada en Custodia Escrow',
        `Folio: #${folioCorto}\n` +
          `Docente: ${ficha.nombre}\n` +
          `Beneficiario: ${alumnoSeleccionado.nombre_menor}\n` +
          `Modalidad: ${ETIQUETA_MODALIDAD_UI[modalidadEnum]}\n` +
          `Plan: ${opcionSeleccionada.titulo}\n` +
          `Monto protegido: $${sesion.monto_bruto.toFixed(2)} USD\n\n` +
          `🔑 Código de validación pre-clase (6 dígitos): ${sesion.codigo_sesion}`
      );

      onBookingConfirmed(sesion, opcionSeleccionada, alumnoSeleccionado);
    } catch (err: any) {
      notificar(
        'Error al procesar la reserva en Escrow',
        err?.message || 'No se pudo completar la transacción RPC en Supabase.'
      );
    } finally {
      setProcesandoReserva(false);
    }
  };

  const inicialesDocente = obtenerIniciales(ficha.nombre);
  const instrumentoPrincipal = ficha.instrumentos[0] ?? 'Oboe Principal';

  return (
    <View style={styles.container}>
      {/* Barra Superior de Navegación A2 */}
      <View style={styles.topNavRow}>
        <TouchableOpacity style={styles.backSquareBtn} onPress={onBack}>
          <Text style={styles.backSquareText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenMainTitle}>Ficha del Profesor</Text>
      </View>

      
      {/* Opciones de Contratación y Paquetes (A2 Oficial) */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Opciones de Contratación y Paquetes</Text>
        <Text style={styles.sectionHelper}>
          Elige clase suelta o ahorra con abonos prepagados protegidos en Escrow:
        </Text>

        <View style={styles.optionsList}>
          {ficha.opcionesContratacion.map((opcion) => {
            const activa = opcion.id === opcionSeleccionada.id;
            const esPopular = opcion.cantidadClases === 6;
            const precioOriginalUsd = Number(
              (opcion.montoTotalUsd + opcion.ahorroUsd).toFixed(2)
            );

            return (
              <TouchableOpacity
                key={opcion.id}
                style={[styles.packageCard, activa && styles.packageCardSelected]}
                activeOpacity={0.85}
                onPress={() => setOpcionSeleccionada(opcion)}
              >
                {/* Fila de Badges Superiores */}
                <View style={styles.packageBadgeRow}>
                  <View
                    style={[
                      styles.packageTypeBadge,
                      opcion.ahorroUsd > 0 && styles.packageTypeBadgeBlue,
                    ]}
                  >
                    <Text
                      style={[
                        styles.packageTypeBadgeText,
                        opcion.ahorroUsd > 0 && styles.packageTypeBadgeTextBlue,
                      ]}
                    >
                      {opcion.ahorroUsd > 0 ? 'ABONO FORMATIVO' : 'PAGO POR SESIÓN'}
                    </Text>
                  </View>

                  <View style={styles.rightBadgesGroup}>
                    {esPopular && (
                      <View style={styles.popularGoldPill}>
                        <Text style={styles.popularGoldText}>★ MÁS POPULAR</Text>
                      </View>
                    )}
                    {opcion.porcentajeDescuento > 0 && (
                      <View
                        style={[
                          styles.discountPill,
                          opcion.porcentajeDescuento >= 12
                            ? styles.discountPillAmber
                            : styles.discountPillGreen,
                        ]}
                      >
                        <Text
                          style={[
                            styles.discountPillText,
                            opcion.porcentajeDescuento >= 12
                              ? styles.discountPillTextAmber
                              : styles.discountPillTextGreen,
                          ]}
                        >
                          {opcion.porcentajeDescuento}% AHORRO
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Fila Principal: Título + Precio (con original tachado si aplica) */}
                <View style={styles.packageMainRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.packageTitle}>{opcion.titulo}</Text>
                    <Text style={styles.packageSub}>{opcion.subtitulo}</Text>
                  </View>

                  <View style={styles.packagePriceCol}>
                    <Text
                      style={[
                        styles.packagePriceMain,
                        activa && { color: AZUL_OSCURO },
                      ]}
                    >
                      ${opcion.montoTotalUsd.toFixed(2)}
                    </Text>
                    {opcion.ahorroUsd > 0 ? (
                      <Text style={styles.packagePriceStrike}>
                        ${precioOriginalUsd.toFixed(2)}
                      </Text>
                    ) : (
                      <Text style={styles.packagePriceUnit}>USD / clase</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selector de Alumno Beneficiario y Modalidad */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Configuración de Asistencia y Horario</Text>
        <Text style={styles.sectionHelper}>
          Selecciona beneficiario, modalidad autorizada y bloque disponible:
        </Text>

        {/* Subperfiles */}
        <View style={[styles.optionsList, { marginBottom: 14 }]}>
          {subperfiles.map((hijo) => {
            const seleccionado = hijo.id === alumnoSeleccionado.id;
            return (
              <TouchableOpacity
                key={hijo.id}
                style={[styles.optionCard, seleccionado && styles.optionCardSelected]}
                onPress={() => setAlumnoSeleccionado(hijo)}
              >
                <View style={styles.radioCircle}>
                  {seleccionado && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>
                    Alumno: {hijo.nombre_menor} ({hijo.edad_anos} años)
                  </Text>
                  <Text style={styles.optionSub}>
                    Cátedra: {hijo.instrumento} • Nivel: {hijo.nivel}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Modalidad */}
        <View style={[styles.modalityRow, { marginBottom: 14 }]}>
          <TouchableOpacity
            disabled={!admiteOnline}
            style={[
              styles.modalityBtn,
              modalidadSeleccionada === 'online_en_vivo' && styles.modalityBtnSelected,
              !admiteOnline && styles.modalityBtnDisabled,
            ]}
            onPress={() => setModalidadSeleccionada('online_en_vivo')}
          >
            <Text
              style={[
                styles.modalityBtnText,
                modalidadSeleccionada === 'online_en_vivo' && styles.modalityBtnTextSelected,
              ]}
            >
              🎥 Online En Vivo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!admitePresencial}
            style={[
              styles.modalityBtn,
              modalidadSeleccionada === 'presencial_caracas' && styles.modalityBtnSelected,
              !admitePresencial && styles.modalityBtnDisabled,
            ]}
            onPress={() => setModalidadSeleccionada('presencial_caracas')}
          >
            <Text
              style={[
                styles.modalityBtnText,
                modalidadSeleccionada === 'presencial_caracas' && styles.modalityBtnTextSelected,
              ]}
            >
              🏛️ Presencial Caracas
            </Text>
          </TouchableOpacity>

          {admiteHibrido && (
            <TouchableOpacity
              style={[
                styles.modalityBtn,
                modalidadSeleccionada === 'hibrido' && styles.modalityBtnSelected,
              ]}
              onPress={() => setModalidadSeleccionada('hibrido')}
            >
              <Text
                style={[
                  styles.modalityBtnText,
                  modalidadSeleccionada === 'hibrido' && styles.modalityBtnTextSelected,
                ]}
              >
                🔄 Híbrido
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bloques horarios */}
        <View style={styles.optionsList}>
          {ficha.bloquesHorarios.map((slot) => {
            const activo = slot.id === bloqueSeleccionado.id;
            return (
              <TouchableOpacity
                key={slot.id}
                style={[styles.optionCard, activo && styles.optionCardSelected]}
                onPress={() => setBloqueSeleccionado(slot)}
              >
                <View style={styles.radioCircle}>
                  {activo && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>🗓️ {slot.etiqueta}</Text>
                  <Text style={styles.optionSub}>
                    Sugerido:{' '}
                    {slot.modalidadSugerida === 'online_en_vivo'
                      ? 'Online En Vivo (Zoom)'
                      : 'Presencial Caracas'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Tarjeta Oficial A2: CONDICIONES DE CONTRATACIÓN (4 Puntos Institucionales) */}
      <View style={styles.conditionsCard}>
        <Text style={styles.conditionsTitle}>📋 CONDICIONES DE CONTRATACIÓN</Text>
        <Text style={styles.conditionBullet}>
          • <Text style={styles.conditionBold}>Cancelación 24h:</Text> Toda reprogramación requiere mínimo 24 horas de antelación.
        </Text>
        <Text style={styles.conditionBullet}>
          • <Text style={styles.conditionBold}>Modalidad Online:</Text> Cámara activa obligatoria para supervisión de postura y embocadura.
        </Text>
        <Text style={styles.conditionBullet}>
          • <Text style={styles.conditionBold}>Titularidad:</Text> Alumnos menores deben ser contratados por su representante legal.
        </Text>
        <Text style={styles.conditionBullet}>
          • <Text style={styles.conditionBold}>Custodia Escrow:</Text> El pago se libera al docente únicamente tras validar cada sesión.
        </Text>
      </View>

      {/* Resumen Financiero Fiduciario + Checkbox 24h + Botón de Bloqueo Escrow */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryHeader}>RESUMEN FINANCIERO Y CUSTODIA ESCROW</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Alumno beneficiario:</Text>
          <Text style={styles.summaryValue}>{alumnoSeleccionado.nombre_menor}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Modalidad seleccionada:</Text>
          <Text style={styles.summaryValue}>
            {ETIQUETA_MODALIDAD_UI[modalidadSeleccionada]}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Honorario neto docente (85% corte mes):</Text>
          <Text style={styles.summaryValue}>
            ${opcionSeleccionada.honorarioNetoDocenteUsd.toFixed(2)} USD
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Aporte operativo FundaOboeHJK (15%):</Text>
          <Text style={styles.summaryValue}>
            ${opcionSeleccionada.comisionPlataformaUsd.toFixed(2)} USD
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>TOTAL A PROTEGER EN ESCROW:</Text>
          <Text style={styles.summaryTotalAmount}>
            ${opcionSeleccionada.montoTotalUsd.toFixed(2)} USD
          </Text>
        </View>

        <View style={styles.escrowNoticeBox}>
          <Text style={styles.escrowNoticeText}>
            🛡️ Tus fondos permanecen congelados en la cuenta fiduciaria de FundaOboeHJK. El enlace de Zoom se desbloquea 15 minutos antes de la sesión y recibirás tu código de 6 dígitos para iniciar la clase.
          </Text>
        </View>

        {/* CHECKBOX OBLIGATORIO: Regla de 24h */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          activeOpacity={0.8}
          onPress={() => setAceptaTerminos24h((prev) => !prev)}
        >
          <View style={[styles.checkboxBox, aceptaTerminos24h && styles.checkboxBoxChecked]}>
            {aceptaTerminos24h && <Text style={styles.checkboxTick}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            Acepto los Términos, Condiciones y Políticas de Cancelación (regla de 24h)
          </Text>
        </TouchableOpacity>

        {/* BOTÓN INTERACTIVO DE CONFIRMACIÓN Y BLOQUEO ESCROW */}
        <TouchableOpacity
          disabled={!aceptaTerminos24h || procesandoReserva}
          style={[
            styles.confirmEscrowBtn,
            (!aceptaTerminos24h || procesandoReserva) && styles.confirmEscrowBtnDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleConfirmarYBloquear}
        >
          <Text style={styles.confirmEscrowBtnText}>
            {procesandoReserva
              ? 'Procesando transacción fiduciaria...'
              : `Contratar ${opcionSeleccionada.titulo} ($${opcionSeleccionada.montoTotalUsd.toFixed(2)}) →`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const AZUL_REY = '#1D4ED8';
const AZUL_OSCURO = '#1E40AF';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4F7FC',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  backSquareBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSquareText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0A192F',
  },
  screenMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A192F',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  teacherProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  teacherAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: AZUL_REY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: AZUL_REY,
  },
  teacherTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 2,
  },
  teacherCredentialSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  auditedGreenPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  auditedGreenText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
  },
  ratingStarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  teacherBio: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 6,
  },
  sedeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: AZUL_OSCURO,
    marginBottom: 10,
  },
  credentialsBar: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  credentialsBarText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 4,
  },
  sectionHelper: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  optionsList: {
    gap: 10,
  },
  // Tarjetas de Paquetes A2
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 14,
  },
  packageCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: AZUL_REY,
    borderWidth: 2,
  },
  packageBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  packageTypeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  packageTypeBadgeBlue: {
    backgroundColor: '#DBEAFE',
  },
  packageTypeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
  },
  packageTypeBadgeTextBlue: {
    color: AZUL_OSCURO,
  },
  rightBadgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  popularGoldPill: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  popularGoldText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  discountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountPillGreen: {
    backgroundColor: '#ECFDF5',
  },
  discountPillAmber: {
    backgroundColor: '#FEF3C7',
  },
  discountPillText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  discountPillTextGreen: {
    color: '#059669',
  },
  discountPillTextAmber: {
    color: '#D97706',
  },
  packageMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 2,
  },
  packageSub: {
    fontSize: 11.5,
    color: '#475569',
  },
  packagePriceCol: {
    alignItems: 'flex-end',
  },
  packagePriceMain: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0A192F',
  },
  packagePriceStrike: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  packagePriceUnit: {
    fontSize: 10,
    color: '#64748B',
  },
  // Opciones estándar (hijos / horarios)
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  optionCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: AZUL_REY,
    borderWidth: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: AZUL_REY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AZUL_REY,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  optionSub: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 2,
  },
  modalityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalityBtn: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  modalityBtnSelected: {
    backgroundColor: AZUL_REY,
    borderColor: AZUL_REY,
  },
  modalityBtnDisabled: {
    opacity: 0.45,
  },
  modalityBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalityBtnTextSelected: {
    color: '#FFFFFF',
  },
  // Condiciones de Contratación A2
  conditionsCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  conditionsTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 8,
  },
  conditionBullet: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 4,
  },
  conditionBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  // Resumen Financiero y Escrow
  summaryCard: {
    backgroundColor: '#0A192F',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  summaryHeader: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 10,
  },
  summaryTotalLabel: {
    color: '#FDE68A',
    fontSize: 12.5,
    fontWeight: '800',
  },
  summaryTotalAmount: {
    color: '#34D399',
    fontSize: 16,
    fontWeight: '900',
  },
  escrowNoticeBox: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 14,
  },
  escrowNoticeText: {
    color: '#E2E8F0',
    fontSize: 11.5,
    lineHeight: 17,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#60A5FA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxBoxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  checkboxLabel: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  confirmEscrowBtn: {
    backgroundColor: AZUL_REY,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  confirmEscrowBtnDisabled: {
    backgroundColor: '#475569',
    opacity: 0.65,
  },
  confirmEscrowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
});
