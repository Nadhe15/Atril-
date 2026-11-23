// src/screens/AdminDashboardScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
  aprobarUsuario,
  FiltroEstadoVerificacion,
  listarUsuariosVerificacion,
  normalizarRolV5,
  suspenderUsuario,
} from '../services/adminService';
import { PerfilUsuarioAtril } from '../services/authService';
import { EstadoVerificacion, Usuario } from '../types/atril.types';

type FiltroRolAdmin = 'todos' | 'docente' | 'estudiante';

export interface AdminDashboardScreenProps {
  adminUser?: PerfilUsuarioAtril | null;
  onLogout?: () => void;
  onUserStatusChanged?: (usuarioActualizado: Usuario) => void;
}

const ETIQUETA_ESTADO: Record<EstadoVerificacion, string> = {
  pendiente: 'PENDIENTE',
  verificado: 'VERIFICADO',
  suspendido: 'SUSPENDIDO',
};

export default function AdminDashboardScreen({
  adminUser,
  onLogout,
  onUserStatusChanged,
}: AdminDashboardScreenProps) {
  const [filtroEstado, setFiltroEstado] =
    useState<FiltroEstadoVerificacion>('todos');
  const [filtroRol, setFiltroRol] = useState<FiltroRolAdmin>('todos');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    try {
      const lista = await listarUsuariosVerificacion(filtroEstado);
      setUsuarios(lista);
    } finally {
      setCargando(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const handleAprobar = async (userId: string) => {
    setProcesandoId(userId);
    try {
      const actualizado = await aprobarUsuario(userId);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? actualizado : u))
      );
      if (onUserStatusChanged) {
        onUserStatusChanged(actualizado);
      }
    } finally {
      setProcesandoId(null);
    }
  };

  const handleSuspender = async (userId: string) => {
    setProcesandoId(userId);
    try {
      const actualizado = await suspenderUsuario(userId);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? actualizado : u))
      );
      if (onUserStatusChanged) {
        onUserStatusChanged(actualizado);
      }
    } finally {
      setProcesandoId(null);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const rolNorm = u.rol_v5 ?? normalizarRolV5(u.rol);
    if (rolNorm === 'admin') return false;
    if (filtroEstado !== 'todos' && u.estado_verificacion !== filtroEstado) {
      return false;
    }
    if (filtroRol !== 'todos' && rolNorm !== filtroRol) {
      return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera Institucional Superadmin / Fundaoboe */}
        <View style={styles.headerNavyCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.goldAdminBadge}>
              <Text style={styles.goldAdminBadgeText}>
                CONSOLA SUPERADMIN • FUNDAOBOE
              </Text>
            </View>
            {onLogout && (
              <TouchableOpacity style={styles.logoutChip} onPress={onLogout}>
                <Text style={styles.logoutChipText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.headerTitle}>
            Control de Verificación y Acreditación
          </Text>
          <Text style={styles.headerSubtitle}>
            {adminUser?.nombre_completo
              ? `Administrador activo: ${adminUser.nombre_completo}`
              : 'Aprueba o suspende cuentas de Profesores y Estudiantes tras validar sus recaudos por correo.'}
          </Text>
        </View>

        {/* Bloque de Filtros: Estado y Rol */}
        <View style={styles.filtersCard}>
          <Text style={styles.filterGroupLabel}>Filtrar por Estado:</Text>
          <View style={styles.chipsRow}>
            {(
              [
                { key: 'todos', label: 'Todos' },
                { key: 'pendiente', label: 'Pendientes' },
                { key: 'verificado', label: 'Verificados' },
                { key: 'suspendido', label: 'Suspendidos' },
              ] as { key: FiltroEstadoVerificacion; label: string }[]
            ).map((item) => {
              const activo = filtroEstado === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.filterChip, activo && styles.filterChipActive]}
                  onPress={() => setFiltroEstado(item.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activo && styles.filterChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.filterGroupLabel, { marginTop: 12 }]}>
            Filtrar por Rol:
          </Text>
          <View style={styles.chipsRow}>
            {(
              [
                { key: 'todos', label: 'Todos los Roles' },
                { key: 'docente', label: '🎻 Profesor' },
                { key: 'estudiante', label: '🎓 Estudiante' },
              ] as { key: FiltroRolAdmin; label: string }[]
            ).map((item) => {
              const activo = filtroRol === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.filterChip, activo && styles.filterChipActive]}
                  onPress={() => setFiltroRol(item.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activo && styles.filterChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Encabezado de Conteo y Botón Refrescar */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>
            Usuarios Registrados ({usuariosFiltrados.length})
          </Text>
          <TouchableOpacity style={styles.reloadBtn} onPress={cargarUsuarios}>
            <Text style={styles.reloadBtnText}>🔄 Actualizar</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Tarjetas de Usuario */}
        {cargando ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="small" color={THEME.primary} />
            <Text style={styles.emptySubtitle}>
              Consultando registros de usuarios...
            </Text>
          </View>
        ) : usuariosFiltrados.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No hay usuarios para el filtro seleccionado
            </Text>
            <Text style={styles.emptySubtitle}>
              Cambia los filtros de estado o rol para visualizar otros registros.
            </Text>
          </View>
        ) : (
          usuariosFiltrados.map((u) => {
            const rolNorm = u.rol_v5 ?? normalizarRolV5(u.rol);
            const esDocente = rolNorm === 'docente';
            const estado = u.estado_verificacion;
            const enProceso = procesandoId === u.id;

            return (
              <View key={u.id} style={styles.userCard}>
                {/* Fila Superior: Rol y Estado Actual */}
                <View style={styles.userTopRow}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {esDocente ? '🎻 PROFESOR' : '🎓 ESTUDIANTE'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      estado === 'verificado'
                        ? styles.statusBadgeSuccess
                        : estado === 'suspendido'
                        ? styles.statusBadgeDanger
                        : styles.statusBadgeWarn,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        estado === 'verificado'
                          ? styles.statusBadgeTextSuccess
                          : estado === 'suspendido'
                          ? styles.statusBadgeTextDanger
                          : styles.statusBadgeTextWarn,
                      ]}
                    >
                      {ETIQUETA_ESTADO[estado]}
                    </Text>
                  </View>
                </View>

                {/* Datos Principales del Usuario */}
                <Text style={styles.userName}>{u.nombre_completo}</Text>

                <View style={styles.metaBox}>
                  <Text style={styles.metaLine}>
                    📧 <Text style={styles.metaLabel}>Correo:</Text>{' '}
                    {u.email || 'Sin correo'}
                  </Text>
                  <Text style={styles.metaLine}>
                    📱 <Text style={styles.metaLabel}>Teléfono:</Text>{' '}
                    {u.telefono || 'No registrado'}
                  </Text>
                  <Text style={styles.metaLine}>
                    🪪 <Text style={styles.metaLabel}>Cédula:</Text>{' '}
                    {u.cedula_identidad || 'No especificada'}
                  </Text>
                  {esDocente && u.area_docente && (
                    <Text style={styles.metaLine}>
                      🎼 <Text style={styles.metaLabel}>Cátedra:</Text>{' '}
                      {u.area_docente}
                    </Text>
                  )}
                  {!esDocente && u.es_menor && u.nombre_representante && (
                    <Text style={styles.metaLine}>
                      👨‍👧 <Text style={styles.metaLabel}>Representante:</Text>{' '}
                      {u.nombre_representante} ({u.cedula_representante})
                    </Text>
                  )}
                </View>

                {/* Botones de Acción Directa */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    disabled={enProceso || estado === 'verificado'}
                    style={[
                      styles.approveBtn,
                      (enProceso || estado === 'verificado') &&
                        styles.actionBtnDisabled,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleAprobar(u.id)}
                  >
                    <Text style={styles.approveBtnText}>
                      ✓ Aprobar / Verificar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={enProceso || estado === 'suspendido'}
                    style={[
                      styles.suspendBtn,
                      (enProceso || estado === 'suspendido') &&
                        styles.actionBtnDisabled,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleSuspender(u.id)}
                  >
                    <Text style={styles.suspendBtnText}>
                      ✕ Suspender / Desactivar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
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
  headerNavyCard: {
    backgroundColor: THEME.navy,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  goldAdminBadge: {
    backgroundColor: THEME.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  goldAdminBadgeText: {
    color: THEME.navy,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  logoutChip: {
    backgroundColor: THEME.dangerTint,
    borderWidth: 1,
    borderColor: THEME.danger,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  logoutChipText: {
    color: THEME.dangerText,
    fontSize: 11.5,
    fontWeight: '900',
  },
  headerTitle: {
    color: THEME.surface,
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: THEME.surfaceSub,
    fontSize: 12.5,
    lineHeight: 18,
  },
  filtersCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: THEME.borderUi,
    marginBottom: 16,
  },
  filterGroupLabel: {
    color: THEME.textTitle,
    fontSize: 12.5,
    fontWeight: '900',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: THEME.background,
    borderWidth: 1.5,
    borderColor: THEME.borderSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
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
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderTitle: {
    color: THEME.textTitle,
    fontSize: 15.5,
    fontWeight: '900',
  },
  reloadBtn: {
    backgroundColor: THEME.surface,
    borderWidth: 1.5,
    borderColor: THEME.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reloadBtnText: {
    color: THEME.primary,
    fontSize: 11.5,
    fontWeight: '900',
  },
  emptyCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1.5,
    borderColor: THEME.borderSoft,
    alignItems: 'center',
  },
  emptyTitle: {
    color: THEME.textTitle,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: THEME.textMuted,
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 4,
  },
  userCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: THEME.borderUi,
    marginBottom: 14,
  },
  userTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: THEME.surfaceSub,
    borderWidth: 1,
    borderColor: THEME.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: THEME.primary,
    fontSize: 10.5,
    fontWeight: '900',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeWarn: {
    backgroundColor: THEME.warnTint,
    borderColor: THEME.warnText,
  },
  statusBadgeSuccess: {
    backgroundColor: THEME.successTint,
    borderColor: THEME.success,
  },
  statusBadgeDanger: {
    backgroundColor: THEME.dangerTint,
    borderColor: THEME.danger,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  statusBadgeTextWarn: {
    color: THEME.warnText,
  },
  statusBadgeTextSuccess: {
    color: THEME.successText,
  },
  statusBadgeTextDanger: {
    color: THEME.dangerText,
  },
  userName: {
    color: THEME.textTitle,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  metaBox: {
    backgroundColor: THEME.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.borderSoft,
    marginBottom: 12,
    gap: 4,
  },
  metaLine: {
    color: THEME.textBody,
    fontSize: 12.5,
    lineHeight: 18,
  },
  metaLabel: {
    fontWeight: '900',
    color: THEME.textTitle,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: THEME.success,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    color: THEME.surface,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  suspendBtn: {
    flex: 1,
    backgroundColor: THEME.danger,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suspendBtnText: {
    color: THEME.surface,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
});
