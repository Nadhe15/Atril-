// src/screens/StudentTeachersScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import THEME from '../constants/theme';
import { obtenerCatalogoDocentes } from '../services/teacherCatalogService';
import { DocenteCatalogoItem } from '../types/atril.types';

export interface StudentTeachersScreenProps {
  nombreEstudiante?: string;
  onSelectTeacher: (docente: DocenteCatalogoItem) => void;
}

interface ChipFiltroArea {
  key: string;
  label: string;
  query: string;
}

const CHIPS_FILTRO_AREAS: ChipFiltroArea[] = [
  { key: 'Todos', label: 'Todos', query: '' },
  { key: 'Oboe', label: 'Oboe', query: 'Oboe' },
  { key: 'Guitarra', label: 'Guitarra', query: 'Guitarra' },
  { key: 'Cuatro', label: 'Cuatro', query: 'Cuatro' },
  { key: 'Fagot', label: 'Fagot', query: 'Fagot' },
  { key: 'Violín', label: 'Violín', query: 'Violín' },
  { key: 'Canto', label: 'Canto', query: 'Canto' },
  { key: 'Armonía', label: 'Armonía', query: 'Armonía' },
];

function obtenerIconoArea(area: string): string {
  const lower = area.toLowerCase();
  if (lower.includes('canto') || lower.includes('vocal')) return '🎤';
  if (lower.includes('guitarra') || lower.includes('cuatro')) return '🎸';
  if (lower.includes('violín') || lower.includes('violin')) return '🎻';
  if (lower.includes('armonía') || lower.includes('lenguaje')) return '📘';
  return '🎼';
}

function obtenerIniciales(nombre: string): string {
  const limpio = nombre.replace(/^(Prof\.?|Mtro\.?)\s*/i, '').trim();
  const partes = limpio.split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase();
}

export default function StudentTeachersScreen({
  nombreEstudiante,
  onSelectTeacher,
}: StudentTeachersScreenProps) {
  const [busqueda, setBusqueda] = useState<string>('');
  const [chipActivo, setChipActivo] = useState<string>('Todos');
  const [profesores, setProfesores] = useState<DocenteCatalogoItem[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const cargarProfesores = useCallback(async () => {
    setCargando(true);
    try {
      const chipObj = CHIPS_FILTRO_AREAS.find((c) => c.key === chipActivo);
      const filtroChip = chipObj?.query || '';
      const terminoCombinado = busqueda.trim() || filtroChip || undefined;

      const resultado = await obtenerCatalogoDocentes({
        area: terminoCombinado,
      });

      // Si hay tanto texto en el buscador como un chip seleccionado distinto de 'Todos', aplicar ambos
      const filtradoFinal =
        busqueda.trim() && filtroChip
          ? resultado.filter((p) => {
              const qChip = filtroChip.toLowerCase();
              return (
                p.areaPrincipal.toLowerCase().includes(qChip) ||
                p.areasCertificadas.some((a) => a.toLowerCase().includes(qChip))
              );
            })
          : resultado;

      setProfesores(filtradoFinal);
    } finally {
      setCargando(false);
    }
  }, [busqueda, chipActivo]);

  useEffect(() => {
    cargarProfesores();
  }, [cargarProfesores]);

  return (
    <View style={styles.container}>
      {/* Cabecera Principal */}
      <View style={styles.headerBlock}>
        <Text style={styles.microTag}>DIRECTORIO ACADÉMICO • FUNDAOBOE</Text>
        <Text style={styles.mainTitle}>Profesores</Text>
        <Text style={styles.subtitle}>
          {nombreEstudiante
            ? `Hola, ${nombreEstudiante}. Explora las cátedras disponibles e inicia una conversación directa con tu profesor.`
            : 'Explora las cátedras disponibles e inicia una conversación directa con tu profesor.'}
        </Text>
      </View>

      {/* Buscador por Nombre o Área/Cátedra */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por profesor o área (ej. Oboe, Canto, Armonía)..."
          placeholderTextColor={THEME.borderSoft}
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setBusqueda('')}
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chips de Filtro por Área/Cátedra */}
      <View style={styles.chipsWrap}>
        {CHIPS_FILTRO_AREAS.map((chip) => {
          const activo = chipActivo === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.filterChip, activo && styles.filterChipActive]}
              activeOpacity={0.85}
              onPress={() => setChipActivo(chip.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activo && styles.filterChipTextActive,
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Listado de Tarjetas de Profesores */}
      {cargando ? (
        <View style={styles.statusBox}>
          <ActivityIndicator size="small" color={THEME.primary} />
          <Text style={styles.statusText}>Consultando profesores...</Text>
        </View>
      ) : profesores.length === 0 ? (
        <View style={styles.statusBox}>
          <Text style={styles.emptyTitle}>
            No se encontraron profesores para este filtro
          </Text>
          <Text style={styles.statusText}>
            Prueba seleccionando &ldquo;Todos&rdquo; o buscando otra cátedra musical.
          </Text>
        </View>
      ) : (
        profesores.map((profesor) => {
          const iniciales = obtenerIniciales(profesor.nombre);
          const iconoArea = obtenerIconoArea(profesor.areaPrincipal);

          return (
            <View key={profesor.id} style={styles.teacherCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{iniciales}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.nameAndBadgeRow}>
                    <Text style={styles.teacherName}>{profesor.nombre}</Text>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>
                        ✓ VERIFICADO FUNDAOBOE
                      </Text>
                    </View>
                  </View>

                  {/* Área Principal Directa (sin etiqueta "Instrumento que toca") */}
                  <Text style={styles.primaryAreaText}>
                    {iconoArea} {profesor.areaPrincipal}
                  </Text>

                  {/* Escuela / Orquesta */}
                  <Text style={styles.institutionText}>
                    🏛️ {profesor.nivel_docente}
                  </Text>
                </View>
              </View>

              <Text style={styles.bioText} numberOfLines={2}>
                {profesor.bio}
              </Text>

              {/* Chips de Áreas Certificadas */}
              <View style={styles.certifiedAreasRow}>
                {profesor.areasCertificadas.map((area) => (
                  <View key={area} style={styles.areaBadgeChip}>
                    <Text style={styles.areaBadgeChipText}>{area}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.profileChatBtn}
                activeOpacity={0.85}
                onPress={() => onSelectTeacher(profesor)}
              >
                <Text style={styles.profileChatBtnText}>
                  Ver Perfil y Chatear →
                </Text>
              </TouchableOpacity>
            </View>
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
  headerBlock: {
    marginBottom: 14,
  },
  microTag: {
    color: THEME.primary,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  mainTitle: {
    color: THEME.textTitle,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: THEME.textBody,
    fontSize: 13,
    lineHeight: 19,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderWidth: 1.5,
    borderColor: THEME.borderUi,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: THEME.textTitle,
    fontSize: 13.5,
    paddingVertical: 2,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  clearBtnText: {
    color: THEME.textMuted,
    fontSize: 14,
    fontWeight: '900',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: THEME.surface,
    borderWidth: 1.5,
    borderColor: THEME.borderSoft,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  filterChipText: {
    color: THEME.textBody,
    fontSize: 12,
    fontWeight: '800',
  },
  filterChipTextActive: {
    color: THEME.surface,
    fontWeight: '900',
  },
  statusBox: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1.5,
    borderColor: THEME.borderSoft,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: THEME.textTitle,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  statusText: {
    color: THEME.textMuted,
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 6,
  },
  teacherCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: THEME.borderUi,
    marginBottom: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.surfaceSub,
    borderWidth: 2,
    borderColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: THEME.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  nameAndBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  teacherName: {
    color: THEME.textTitle,
    fontSize: 16,
    fontWeight: '900',
  },
  verifiedBadge: {
    backgroundColor: THEME.successTint,
    borderWidth: 1,
    borderColor: THEME.success,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  verifiedBadgeText: {
    color: THEME.successText,
    fontSize: 9.5,
    fontWeight: '900',
  },
  primaryAreaText: {
    color: THEME.primary,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  institutionText: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  bioText: {
    color: THEME.textBody,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
  },
  certifiedAreasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  areaBadgeChip: {
    backgroundColor: THEME.surfaceSub,
    borderWidth: 1,
    borderColor: THEME.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  areaBadgeChipText: {
    color: THEME.textTitle,
    fontSize: 11.5,
    fontWeight: '800',
  },
  profileChatBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileChatBtnText: {
    color: THEME.surface,
    fontSize: 13.5,
    fontWeight: '900',
  },
});
