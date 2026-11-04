// src/screens/TeacherProfileScheduleScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  BloqueHorarioDisponible,
  FichaDocenteDetalle,
  ModalidadClase,
  SubperfilAlumno,
} from '../types/atril.types';
import { obtenerFichaDocente } from '../services/teacherCatalogService';
import { useParentProfiles } from '../hooks/useParentProfiles';

export interface Paso1SeleccionReserva {
  ficha: FichaDocenteDetalle;
  modalidad: ModalidadClase;
  fechaEtiqueta: string;
  bloqueHorario: BloqueHorarioDisponible;
  alumnoBeneficiario: SubperfilAlumno;
}

export interface TeacherProfileScheduleScreenProps {
  profesorId: string;
  tutorId: string;
  esApoderado?: boolean;
  nombreEstudianteAdulto?: string;
  onBack: () => void;
  onContinueToConfirm: (seleccion: Paso1SeleccionReserva) => void;
}

interface DiaAgendaOption {
  id: string;
  diaSemana: string;
  fechaCorta: string;
  offsetHoras: number;
}

const DIAS_AGENDA: DiaAgendaOption[] = [
  { id: 'dia-hoy', diaSemana: 'HOY', fechaCorta: '04 Nov', offsetHoras: 2 },
  { id: 'dia-man', diaSemana: 'JUE', fechaCorta: '05 Nov', offsetHoras: 24 },
  { id: 'dia-vie', diaSemana: 'VIE', fechaCorta: '06 Nov', offsetHoras: 48 },
  { id: 'dia-sab', diaSemana: 'SÁB', fechaCorta: '07 Nov', offsetHoras: 72 },
];

const PARRILLA_HORAS = [
  { id: 'h-09', horaLabel: '09:00 AM', addHours: 9 },
  { id: 'h-11', horaLabel: '11:00 AM', addHours: 11 },
  { id: 'h-14', horaLabel: '02:00 PM', addHours: 14 },
  { id: 'h-16', horaLabel: '04:00 PM', addHours: 16 },
];

const obtenerIniciales = (nombre: string): string => {
  const limpio = nombre.replace(/^(Prof\.?|Mtro\.?)\s*/i, '').trim();
  const partes = limpio.split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase();
};

export default function TeacherProfileScheduleScreen({
  profesorId,
  tutorId,
  esApoderado = false,
  nombreEstudianteAdulto,
  onBack,
  onContinueToConfirm,
}: TeacherProfileScheduleScreenProps) {
  const { subperfiles, alumnoActivo, cargarSubperfiles } = useParentProfiles();

  const fallbackBeneficiario: SubperfilAlumno = {
    id: tutorId,
    tutor_id: tutorId,
    nombre_menor: nombreEstudianteAdulto || 'Estudiante Titular',
    edad_anos: esApoderado ? 11 : 21,
    instrumento: 'Oboe',
    nivel: 'iniciacion',
    foto_privada_url: null,
  };

  const [ficha, setFicha] = useState<FichaDocenteDetalle | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [modalidad, setModalidad] = useState<ModalidadClase>('online_en_vivo');
  const [diaSeleccionado, setDiaSeleccionado] = useState<DiaAgendaOption>(DIAS_AGENDA[0]);
  const [horaSeleccionadaId, setHoraSeleccionadaId] = useState<string | null>(null);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<SubperfilAlumno>(
    alumnoActivo ?? fallbackBeneficiario
  );

  useEffect(() => {
    if (esApoderado) {
      cargarSubperfiles(tutorId);
    }
  }, [esApoderado, tutorId, cargarSubperfiles]);

  useEffect(() => {
    if (!esApoderado) {
      setAlumnoSeleccionado({
        id: tutorId,
        tutor_id: tutorId,
        nombre_menor: nombreEstudianteAdulto || 'Estudiante Mayor de Edad',
        edad_anos: 21,
        instrumento: ficha?.instrumentos[0] ?? 'Oboe',
        nivel: 'avanzado',
        foto_privada_url: null,
      });
    } else if (alumnoActivo) {
      setAlumnoSeleccionado(alumnoActivo);
    }
  }, [alumnoActivo, esApoderado, nombreEstudianteAdulto, tutorId, ficha]);

  useEffect(() => {
    let activo = true;
    (async () => {
      setCargando(true);
      try {
        const data = await obtenerFichaDocente(profesorId);
        if (!activo) return;
        setFicha(data);
        const modDefault: ModalidadClase =
          data.modalidades.includes('online_en_vivo') || data.modalidades.includes('hibrido')
            ? 'online_en_vivo'
            : 'presencial_caracas';
        setModalidad(modDefault);
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [profesorId]);

  if (cargando || !ficha) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator size="small" color={AZUL_REY} />
        <Text style={styles.loadingText}>Cargando disponibilidad del docente...</Text>
      </View>
    );
  }

  const admiteOnline =
    ficha.modalidades.includes('online_en_vivo') || ficha.modalidades.includes('hibrido');
  const admitePresencial =
    ficha.modalidades.includes('presencial_caracas') || ficha.modalidades.includes('hibrido');

  const iniciales = obtenerIniciales(ficha.nombre);
  const catedraPrincipal = ficha.instrumentos[0] ?? 'Oboe';

  const handleContinuar = () => {
    if (!horaSeleccionadaId) return;
    const itemHora = PARRILLA_HORAS.find((h) => h.id === horaSeleccionadaId) ?? PARRILLA_HORAS[0];
    const fechaIso = new Date(
      Date.now() + (diaSeleccionado.offsetHoras + itemHora.addHours) * 3600 * 1000
    ).toISOString();

    const bloqueConstruido: BloqueHorarioDisponible = {
      id: `${ficha.profesor_id}-${diaSeleccionado.id}-${itemHora.id}`,
      etiqueta: `${diaSeleccionado.diaSemana} ${diaSeleccionado.fechaCorta} • ${itemHora.horaLabel}`,
      fechaHoraIso: fechaIso,
      modalidadSugerida:
        modalidad === 'presencial_caracas' ? 'presencial_caracas' : 'online_en_vivo',
    };

    onContinueToConfirm({
      ficha,
      modalidad,
      fechaEtiqueta: `${diaSeleccionado.diaSemana} ${diaSeleccionado.fechaCorta}`,
      bloqueHorario: bloqueConstruido,
      alumnoBeneficiario: alumnoSeleccionado,
    });
  };

  return (
    <View style={styles.container}>
      {/* Cabecera de Navegación por Pasos (Paso 1 de 3) */}
      <View style={styles.topHeaderRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepPillText}>PASO 1 DE 3 • DATOS Y DISPONIBILIDAD</Text>
          <Text style={styles.screenTitle}>Seleccionar Horario</Text>
        </View>
      </View>

      {/* Tarjeta Resumen del Docente */}
      <View style={styles.card}>
        <View style={styles.teacherRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{iniciales}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.nameBadgeRow}>
              <Text style={styles.teacherName}>{ficha.nombre}</Text>
              {ficha.verificado_fundaoboe && (
                <View style={styles.fundaoboePill}>
                  <Text style={styles.fundaoboePillText}>✓ FUNDAOBOE</Text>
                </View>
              )}
            </View>
            <Text style={styles.catedraText}>
              Cátedra de {catedraPrincipal} • {ficha.nivel_docente}
            </Text>
            <View style={styles.ratingAndPriceRow}>
              <Text style={styles.ratingText}>★ 4.9 (42 sesiones auditadas)</Text>
              <Text style={styles.rateText}>
                Tarifa base: <Text style={styles.rateHighlight}>${ficha.tarifa_usd.toFixed(0)} USD/h</Text>
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.bioText}>{ficha.bio}</Text>
      </View>

      {/* Selector de Alumno Beneficiario si es Representante (A1) */}
      {esApoderado && subperfiles.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Alumno Representado</Text>
          <View style={styles.childrenRow}>
            {subperfiles.map((hijo) => {
              const activo = hijo.id === alumnoSeleccionado.id;
              return (
                <TouchableOpacity
                  key={hijo.id}
                  style={[styles.childChip, activo && styles.childChipActive]}
                  onPress={() => setAlumnoSeleccionado(hijo)}
                >
                  <Text style={[styles.childChipText, activo && styles.childChipTextActive]}>
                    {hijo.nombre_menor} ({hijo.instrumento})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Selector Interactivo de Modalidad */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Modalidad de Impartición</Text>
        <Text style={styles.sectionSubtitle}>
          Elige cómo deseas recibir tu sesión musical tutelada:
        </Text>

        <View style={styles.modalityToggleRow}>
          <TouchableOpacity
            disabled={!admiteOnline}
            style={[
              styles.modalityOption,
              modalidad === 'online_en_vivo' && styles.modalityOptionActive,
              !admiteOnline && styles.modalityOptionDisabled,
            ]}
            onPress={() => setModalidad('online_en_vivo')}
          >
            <Text
              style={[
                styles.modalityOptionTitle,
                modalidad === 'online_en_vivo' && styles.modalityOptionTitleActive,
              ]}
            >
              🎥 Online En Vivo
            </Text>
            <Text
              style={[
                styles.modalityOptionSub,
                modalidad === 'online_en_vivo' && styles.modalityOptionSubActive,
              ]}
            >
              Sala Zoom + Código 6 dígitos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!admitePresencial}
            style={[
              styles.modalityOption,
              modalidad === 'presencial_caracas' && styles.modalityOptionActive,
              !admitePresencial && styles.modalityOptionDisabled,
            ]}
            onPress={() => setModalidad('presencial_caracas')}
          >
            <Text
              style={[
                styles.modalityOptionTitle,
                modalidad === 'presencial_caracas' && styles.modalityOptionTitleActive,
              ]}
            >
              🏛️ Presencial
            </Text>
            <Text
              style={[
                styles.modalityOptionSub,
                modalidad === 'presencial_caracas' && styles.modalityOptionSubActive,
              ]}
            >
              Sede Caracas FundaOboeHJK
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selector de Fecha y Parrilla de Bloques Horarios */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2. Fecha y Bloque Horario Disponible</Text>
        <Text style={styles.sectionSubtitle}>
          Selecciona el día y la hora para bloquear el cupo en la agenda del maestro:
        </Text>

        {/* Selector de Fecha */}
        <View style={styles.daysRow}>
          {DIAS_AGENDA.map((d) => {
            const esDiaActivo = d.id === diaSeleccionado.id;
            return (
              <TouchableOpacity
                key={d.id}
                style={[styles.dayBox, esDiaActivo && styles.dayBoxActive]}
                onPress={() => setDiaSeleccionado(d)}
              >
                <Text style={[styles.dayWeekText, esDiaActivo && styles.dayTextActive]}>
                  {d.diaSemana}
                </Text>
                <Text style={[styles.dayDateText, esDiaActivo && styles.dayTextActive]}>
                  {d.fechaCorta}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Parrilla Interactiva de Bloques Horarios */}
        <View style={styles.timeGrid}>
          {PARRILLA_HORAS.map((slot) => {
            const seleccionado = slot.id === horaSeleccionadaId;
            return (
              <TouchableOpacity
                key={slot.id}
                style={[styles.timeSlotBtn, seleccionado && styles.timeSlotBtnSelected]}
                activeOpacity={0.85}
                onPress={() => setHoraSeleccionadaId(slot.id)}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    seleccionado && styles.timeSlotTextSelected,
                  ]}
                >
                  🕒 {slot.horaLabel}
                </Text>
                <Text
                  style={[
                    styles.timeSlotDuration,
                    seleccionado && styles.timeSlotTextSelected,
                  ]}
                >
                  60 min • Disponible
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Botón Inferior Fijado */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          disabled={!horaSeleccionadaId}
          style={[
            styles.continueBtn,
            !horaSeleccionadaId && styles.continueBtnDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleContinuar}
        >
          <Text style={styles.continueBtnText}>
            Continuar a Confirmación →
          </Text>
        </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: FONDO,
  },
  loadingCard: {
    backgroundColor: BLANCO,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
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
  card: {
    backgroundColor: BLANCO,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#DBEAFE',
    borderWidth: 1.5,
    borderColor: AZUL_REY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: AZUL_INSTITUCIONAL,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 3,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A192F',
  },
  fundaoboePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fundaoboePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: VERDE,
  },
  catedraText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  ratingAndPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: AMBAR,
  },
  rateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  rateHighlight: {
    color: AZUL_REY,
    fontWeight: '900',
  },
  bioText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
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
    marginBottom: 12,
  },
  childrenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  childChip: {
    backgroundColor: FONDO,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  childChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: AZUL_REY,
  },
  childChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  childChipTextActive: {
    color: AZUL_INSTITUCIONAL,
    fontWeight: '800',
  },
  modalityToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalityOption: {
    flex: 1,
    backgroundColor: FONDO,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
  },
  modalityOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: AZUL_REY,
  },
  modalityOptionDisabled: {
    opacity: 0.45,
  },
  modalityOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 3,
  },
  modalityOptionTitleActive: {
    color: AZUL_REY,
  },
  modalityOptionSub: {
    fontSize: 11,
    color: '#64748B',
  },
  modalityOptionSubActive: {
    color: AZUL_INSTITUCIONAL,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  dayBox: {
    flex: 1,
    backgroundColor: FONDO,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dayBoxActive: {
    backgroundColor: AZUL_INSTITUCIONAL,
    borderColor: AZUL_INSTITUCIONAL,
  },
  dayWeekText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  dayDateText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A192F',
  },
  dayTextActive: {
    color: BLANCO,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlotBtn: {
    width: '48%',
    backgroundColor: FONDO,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  timeSlotBtnSelected: {
    backgroundColor: AZUL_REY,
    borderColor: AZUL_REY,
  },
  timeSlotText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 2,
  },
  timeSlotDuration: {
    fontSize: 10.5,
    fontWeight: '600',
    color: VERDE,
  },
  timeSlotTextSelected: {
    color: BLANCO,
  },
  bottomBar: {
    marginTop: 4,
    marginBottom: 12,
  },
  continueBtn: {
    backgroundColor: AZUL_REY,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  continueBtnText: {
    color: BLANCO,
    fontSize: 14,
    fontWeight: '800',
  },
});
