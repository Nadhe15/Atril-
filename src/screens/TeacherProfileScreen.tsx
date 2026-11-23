// src/screens/TeacherProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import THEME from '../constants/theme';
import { PerfilUsuarioAtril } from '../services/authService';
import { obtenerDocentePorId } from '../services/teacherCatalogService';
import { DocenteCatalogoItem } from '../types/atril.types';

export interface TeacherProfileScreenProps {
  usuario: PerfilUsuarioAtril;
  onGoToChats: () => void;
  onLogout?: () => void;
}

export default function TeacherProfileScreen({
  usuario,
  onGoToChats,
  onLogout,
}: TeacherProfileScreenProps) {
  const [fichaCatalogo, setFichaCatalogo] = useState<DocenteCatalogoItem | null>(
    null
  );

  useEffect(() => {
    let montado = true;
    (async () => {
      try {
        const ficha = await obtenerDocentePorId(usuario.id);
        if (montado) {
          setFichaCatalogo(ficha);
        }
      } catch {
        // Usar datos del perfil de usuario
      }
    })();
    return () => {
      montado = false;
    };
  }, [usuario.id]);

  const areaPrincipal =
    usuario.area_docente ||
    fichaCatalogo?.areaPrincipal ||
    'Oboe Sinfónico';

  const areasCertificadas =
    fichaCatalogo &&
    (fichaCatalogo.profesor_id === usuario.id ||
      fichaCatalogo.nombre === usuario.nombre_completo)
      ? fichaCatalogo.areasCertificadas
      : [areaPrincipal, 'Lenguaje Musical'];

  const nivelCredencial =
    fichaCatalogo?.nivel_docente ||
    'Maestro Acreditado • Consejo Académico FundaOboeHJK';

  const bioMostrar =
    fichaCatalogo?.bio ||
    'Profesor verificado por el consejo académico de la Fundación Venezolana para impartir formación musical tutelada.';

  return (
    <View style={styles.container}>
      {/* Tarjeta Principal Azul Marino de Ficha Verificada */}
      <View style={styles.navyProfileCard}>
        <View style={styles.topBadgeRow}>
          <View style={styles.verifiedGoldPill}>
            <Text style={styles.verifiedGoldPillText}>
              ✓ PROFESOR VERIFICADO • FUNDAOBOE
            </Text>
          </View>
        </View>

        <Text style={styles.teacherName}>{usuario.nombre_completo}</Text>
        <Text style={styles.primaryArea}>🎼 Cátedra Principal: {areaPrincipal}</Text>
        <Text style={styles.credentialSub}>{nivelCredencial}</Text>
      </View>

      {/* Áreas / Cátedras Certificadas y Credenciales Aprobadas */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Áreas y Cátedras Certificadas
        </Text>
        <Text style={styles.helperText}>
          Estas son las áreas formativas habilitadas en tu ficha pública para que los estudiantes verificados puedan contactarte:
        </Text>

        <View style={styles.areasRow}>
          {areasCertificadas.map((area) => (
            <View key={area} style={styles.areaChip}>
              <Text style={styles.areaChipText}>🎼 {area}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Reseña Académica Publicada</Text>
        <Text style={styles.bioText}>{bioMostrar}</Text>
      </View>

      {/* Datos Institucionales Aprobados */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Credenciales y Datos de Contacto</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estado en plataforma:</Text>
          <View style={styles.statusSuccessPill}>
            <Text style={styles.statusSuccessText}>✓ VERIFICADO Y ACTIVO</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Correo institucional:</Text>
          <Text style={styles.infoValue}>{usuario.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Teléfono registrado:</Text>
          <Text style={styles.infoValue}>
            {usuario.telefono || 'Registrado en Fundaoboe'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Documento / Cédula:</Text>
          <Text style={styles.infoValue}>
            {usuario.cedula_identidad || 'Validado por comité'}
          </Text>
        </View>
      </View>

      {/* Acción Principal: Ir a Bandeja de Chats con Estudiantes */}
      <TouchableOpacity
        style={styles.inboxBtn}
        activeOpacity={0.85}
        onPress={onGoToChats}
      >
        <Text style={styles.inboxBtnText}>
          💬 Abrir Bandeja de Mensajes con Estudiantes →
        </Text>
      </TouchableOpacity>

      {onLogout && (
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.85}
          onPress={onLogout}
        >
          <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.background,
  },
  navyProfileCard: {
    backgroundColor: THEME.navy,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  verifiedGoldPill: {
    backgroundColor: THEME.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedGoldPillText: {
    color: THEME.navy,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  teacherName: {
    color: THEME.surface,
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 4,
  },
  primaryArea: {
    color: THEME.gold,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  credentialSub: {
    color: THEME.surfaceSub,
    fontSize: 12.5,
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
    marginBottom: 6,
  },
  helperText: {
    color: THEME.textMuted,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
  },
  areasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  areaChip: {
    backgroundColor: THEME.surfaceSub,
    borderWidth: 1.5,
    borderColor: THEME.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  areaChipText: {
    color: THEME.primary,
    fontSize: 12.5,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: THEME.surfaceSub,
    marginVertical: 14,
  },
  bioText: {
    color: THEME.textBody,
    fontSize: 13,
    lineHeight: 19,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.surfaceSub,
    gap: 10,
  },
  infoLabel: {
    color: THEME.textMuted,
    fontSize: 12.5,
    fontWeight: '700',
  },
  infoValue: {
    color: THEME.textTitle,
    fontSize: 12.5,
    fontWeight: '900',
    flex: 1,
    textAlign: 'right',
  },
  statusSuccessPill: {
    backgroundColor: THEME.successTint,
    borderWidth: 1,
    borderColor: THEME.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusSuccessText: {
    color: THEME.successText,
    fontSize: 10.5,
    fontWeight: '900',
  },
  inboxBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  inboxBtnText: {
    color: THEME.surface,
    fontSize: 14,
    fontWeight: '900',
  },
  logoutBtn: {
    backgroundColor: THEME.dangerTint,
    borderWidth: 1.5,
    borderColor: THEME.danger,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoutBtnText: {
    color: THEME.dangerText,
    fontSize: 13,
    fontWeight: '900',
  },
});
