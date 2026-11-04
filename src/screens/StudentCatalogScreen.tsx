// src/screens/StudentCatalogScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { DocenteCatalogoItem, ModalidadClase, SubperfilAlumno } from '../types/atril.types';
import { obtenerCatalogoDocentes } from '../services/teacherCatalogService';
import { useParentProfiles } from '../hooks/useParentProfiles';

export type ModoAlumnoVista = 'A0_ADULTO' | 'A1_REPRESENTANTE';

export interface StudentCatalogScreenProps {
  onSelectTeacher: (docente: DocenteCatalogoItem, alumnoActivo?: SubperfilAlumno) => void;
  isVisitorMode?: boolean;
  onRequestRegister?: () => void;
  tutorId?: string;
  initialModoAlumno?: ModoAlumnoVista;
  nombreUsuario?: string;
}

type FiltroModalidadUI = 'TODOS' | 'presencial_caracas' | 'online_en_vivo';

const ETIQUETA_MODALIDAD: Record<ModalidadClase, string> = {
  presencial_caracas: 'Presencial Caracas',
  online_en_vivo: 'Online En Vivo',
  hibrido: 'Híbrido (Presencial + Zoom)',
};

const obtenerIniciales = (nombre: string): string => {
  const limpio = nombre.replace(/^Prof\.?\s*/i, '').trim();
  const partes = limpio.split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase();
};

export default function StudentCatalogScreen({
  onSelectTeacher,
  isVisitorMode = false,
  onRequestRegister,
  tutorId = '00000000-0000-0000-0000-000000000001',
  initialModoAlumno = 'A0_ADULTO',
  nombreUsuario = 'Estudiante ATRIL',
}: StudentCatalogScreenProps) {
  const {
    subperfiles,
    alumnoActivo,
    cargarSubperfiles,
    alternarHijoActivo,
    registrarNuevoHijo,
  } = useParentProfiles();

  const modoAlumno: ModoAlumnoVista = initialModoAlumno;

  const [busquedaInstrumento, setBusquedaInstrumento] = useState<string>('');
  const [modalidadActiva, setModalidadActiva] = useState<FiltroModalidadUI>('TODOS');
  const [docentes, setDocentes] = useState<DocenteCatalogoItem[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Formulario rápido para que el Padre (A1) agregue el nombre de su hijo si aún no tiene ninguno
  const [mostrarFormHijo, setMostrarFormHijo] = useState<boolean>(false);
  const [nuevoHijoNombre, setNuevoHijoNombre] = useState<string>('');
  const [nuevoHijoEdad, setNuevoHijoEdad] = useState<string>('10');
  const [nuevoHijoInstrumento, setNuevoHijoInstrumento] = useState<string>('Oboe');
  const [errorFormHijo, setErrorFormHijo] = useState<string | null>(null);

  const notificar = (titulo: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${titulo}\n\n${msg}`);
    } else {
      Alert.alert(titulo, msg);
    }
  };

  useEffect(() => {
    if (!isVisitorMode && modoAlumno === 'A1_REPRESENTANTE') {
      cargarSubperfiles(tutorId);
    }
  }, [isVisitorMode, modoAlumno, tutorId, cargarSubperfiles]);

  const cargarDocentes = useCallback(async () => {
    setCargando(true);
    try {
      const resultado = await obtenerCatalogoDocentes({
        modalidad: modalidadActiva === 'TODOS' ? undefined : modalidadActiva,
        instrumento: busquedaInstrumento.trim() || undefined,
      });
      setDocentes(resultado);
    } finally {
      setCargando(false);
    }
  }, [modalidadActiva, busquedaInstrumento]);

  useEffect(() => {
    cargarDocentes();
  }, [cargarDocentes]);

  const handleGuardarHijoRapido = async () => {
    if (!nuevoHijoNombre.trim() || nuevoHijoNombre.trim().length < 2) {
      setErrorFormHijo('Escribe el nombre del hijo o representado.');
      return;
    }
    const edadNum = parseInt(nuevoHijoEdad, 10);
    if (isNaN(edadNum) || edadNum < 4 || edadNum > 17) {
      setErrorFormHijo('La edad del representado menor debe estar entre 4 y 17 años.');
      return;
    }

    setErrorFormHijo(null);
    await registrarNuevoHijo({
      tutorId,
      nombre_menor: nuevoHijoNombre.trim(),
      edad_anos: edadNum,
      instrumento: nuevoHijoInstrumento.trim() || 'Oboe',
      nivel: 'iniciacion',
    });
    setNuevoHijoNombre('');
    setMostrarFormHijo(false);
  };

  // =========================================================================
  // VISTA V0: MODO VISITANTE RESTRINGIDO (Sin exposición de identidad docente)
  // =========================================================================
  if (isVisitorMode) {
    return (
      <View style={styles.container}>
        <View style={styles.visitorHeaderRow}>
          <View style={styles.visitorAmberPill}>
            <Text style={styles.visitorAmberText}>👁 MODO VISITANTE RESTRINGIDO</Text>
          </View>
          <TouchableOpacity
            style={styles.visitorTopRegisterBtn}
            activeOpacity={0.85}
            onPress={onRequestRegister}
          >
            <Text style={styles.visitorTopRegisterText}>Registrarse</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.visitorMainTitle}>Explora el Talento Musical</Text>
        <Text style={styles.visitorSubtitle}>
          Vista preliminar del catálogo. Crea una cuenta para ver perfiles completos.
        </Text>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Oboe, Clarinete, Fagot, Flauta..."
            placeholderTextColor="#94A3B8"
            value={busquedaInstrumento}
            onChangeText={setBusquedaInstrumento}
          />
          {busquedaInstrumento.length > 0 && (
            <TouchableOpacity onPress={() => setBusquedaInstrumento('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.filterRow, { marginBottom: 18 }]}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              modalidadActiva === 'TODOS' && styles.filterChipActive,
            ]}
            onPress={() => setModalidadActiva('TODOS')}
          >
            <Text
              style={[
                styles.filterChipText,
                modalidadActiva === 'TODOS' && styles.filterChipTextActive,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              modalidadActiva === 'presencial_caracas' && styles.filterChipActive,
            ]}
            onPress={() => setModalidadActiva('presencial_caracas')}
          >
            <Text
              style={[
                styles.filterChipText,
                modalidadActiva === 'presencial_caracas' && styles.filterChipTextActive,
              ]}
            >
              Presencial Caracas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              modalidadActiva === 'online_en_vivo' && styles.filterChipActive,
            ]}
            onPress={() => setModalidadActiva('online_en_vivo')}
          >
            <Text
              style={[
                styles.filterChipText,
                modalidadActiva === 'online_en_vivo' && styles.filterChipTextActive,
              ]}
            >
              Online En Vivo
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>Oferta Académica General</Text>

        {(docentes.length > 0
          ? docentes
          : [
              {
                id: 'v0-oboe',
                profesor_id: 'v0-1',
                nombre: 'Cátedra Protegida',
                bio: '',
                instrumentos: ['Oboe Avanzado'],
                modalidades: ['presencial_caracas', 'online_en_vivo'] as ModalidadClase[],
                tarifa_usd: 25,
                nivel_docente: 'Docente Titular FundaOboeHJK',
                verificado_fundaoboe: true,
              },
            ]
        ).map((catedra, idx) => {
          const instrumentoPrincipal = catedra.instrumentos[0] ?? 'Oboe';
          return (
            <View key={catedra.id || idx} style={styles.lockedChairCard}>
              <View style={styles.lockedChairTopRow}>
                <View style={styles.padlockAvatar}>
                  <Text style={styles.padlockIcon}>🔒</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedChairTitle}>
                    Cátedra de {instrumentoPrincipal}
                  </Text>
                  <Text style={styles.lockedChairSub}>
                    Docente Titular FundaOboeHJK • Caracas / Online
                  </Text>
                  <View style={styles.verifiedGreenBadge}>
                    <Text style={styles.verifiedGreenBadgeText}>✓ CATEDRA VERIFICADA</Text>
                  </View>
                </View>
              </View>

              <View style={styles.lockedOverlayBox}>
                <Text style={styles.lockedOverlayTitle}>
                  🔒 Perfil y contacto docente bloqueados
                </Text>
                <Text style={styles.lockedOverlayDesc}>
                  Regístrate como Alumno o Representante para desbloquear nombre, currículo, tarifas y horarios disponibles.
                </Text>
                <TouchableOpacity
                  style={styles.unlockAccountBtn}
                  activeOpacity={0.85}
                  onPress={onRequestRegister}
                >
                  <Text style={styles.unlockAccountBtnText}>
                    Crear Cuenta para Desbloquear
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={styles.whyRegisterCard}>
          <Text style={styles.whyRegisterTitle}>¿Por qué registrarse en Atril?</Text>
          <Text style={styles.whyRegisterBullet}>
            • Acceso a maestros certificados por FundaOboeHJK.
          </Text>
          <Text style={styles.whyRegisterBullet}>
            • Pagos protegidos en custodia (Escrow) hasta recibir tu clase.
          </Text>
          <Text style={styles.whyRegisterBullet}>
            • Gestión de múltiples hijos desde una sola cuenta de representante.
          </Text>
          <Text style={styles.whyRegisterBullet}>
            • Descuentos del 10% y 12% en paquetes de 6 y 8 clases.
          </Text>
        </View>
      </View>
    );
  }

  // =========================================================================
  // VISTA EXCLUSIVA SEGÚN EL ROL REAL DEL USUARIO:
  // - 'A0_ADULTO' -> Estudiante Mayor de Edad (sin opciones multihijo)
  // - 'A1_REPRESENTANTE' -> Padre / Representante con gestión de sus hijos reales
  // =========================================================================
  const inicialesUsuario = obtenerIniciales(nombreUsuario);
  const nombreCortoHijo = alumnoActivo?.nombre_menor.split(' ')[0] ?? null;

  return (
    <View style={styles.container}>
      {/* Cabecera Dinámica según A0 (Adulto) o A1 (Padre/Representante) */}
      {modoAlumno === 'A0_ADULTO' ? (
        <View style={styles.userHeaderRow}>
          <View style={styles.userAvatarRow}>
            <View style={styles.avatarCircleBlue}>
              <Text style={styles.avatarInitials}>{inicialesUsuario}</Text>
            </View>
            <View>
              <Text style={styles.userRoleMicro}>ESTUDIANTE MAYOR DE EDAD (A0)</Text>
              <Text style={styles.userNameText}>{nombreUsuario}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bellIconBox}
            activeOpacity={0.8}
            onPress={() =>
              notificar(
                'Notificaciones ATRIL',
                'Tienes disponible el Plan Formativo 2x1 Amigo y custodia fiduciaria activa para tus reservas.'
              )
            }
          >
            <Text style={styles.bellIconText}>🔔</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.userHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userRoleMicro}>PADRE / REPRESENTANTE (A1)</Text>
            <Text style={styles.userNameText}>{nombreUsuario}</Text>
          </View>

          {alumnoActivo && nombreCortoHijo ? (
            <TouchableOpacity
              style={styles.childSelectorPill}
              activeOpacity={0.85}
              onPress={alternarHijoActivo}
            >
              <View style={styles.childAvatarMini}>
                <Text style={styles.childAvatarMiniText}>
                  {nombreCortoHijo[0]?.toUpperCase() ?? 'A'}
                </Text>
              </View>
              <Text style={styles.childSelectorText}>Hijo: {nombreCortoHijo}</Text>
              <Text style={styles.childSelectorArrow}>▾</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addChildQuickBtn}
              activeOpacity={0.85}
              onPress={() => setMostrarFormHijo((prev) => !prev)}
            >
              <Text style={styles.addChildQuickBtnText}>＋ Registrar Hijo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Formulario Desplegable para Registrar Hijos (Solo para Padre / Representante A1) */}
      {modoAlumno === 'A1_REPRESENTANTE' && (mostrarFormHijo || subperfiles.length === 0) && (
        <View style={styles.addChildFormCard}>
          <Text style={styles.addChildFormTitle}>
            👨‍👧 Registrar Hijo / Representado Menor
          </Text>
          <Text style={styles.addChildFormSub}>
            Escribe el nombre de tu hijo para asignarle sus clases reservadas:
          </Text>

          <TextInput
            style={styles.childInput}
            placeholder="Nombre y Apellido del menor (ej. Mateo Pérez)"
            placeholderTextColor="#94A3B8"
            value={nuevoHijoNombre}
            onChangeText={setNuevoHijoNombre}
          />

          <View style={styles.childRowInputs}>
            <TextInput
              style={[styles.childInput, { flex: 1 }]}
              placeholder="Edad (4-17)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={nuevoHijoEdad}
              onChangeText={setNuevoHijoEdad}
            />
            <TextInput
              style={[styles.childInput, { flex: 2 }]}
              placeholder="Instrumento (ej. Oboe)"
              placeholderTextColor="#94A3B8"
              value={nuevoHijoInstrumento}
              onChangeText={setNuevoHijoInstrumento}
            />
          </View>

          {errorFormHijo && (
            <Text style={styles.childErrorText}>{errorFormHijo}</Text>
          )}

          <TouchableOpacity
            style={styles.saveChildBtn}
            activeOpacity={0.85}
            onPress={handleGuardarHijoRapido}
          >
            <Text style={styles.saveChildBtnText}>Guardar Hijo Representado →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Buscador y Filtros de Modalidad */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar Oboe, Clarinete, Fagot, Teoría..."
          placeholderTextColor="#94A3B8"
          value={busquedaInstrumento}
          onChangeText={setBusquedaInstrumento}
        />
        {busquedaInstrumento.length > 0 && (
          <TouchableOpacity onPress={() => setBusquedaInstrumento('')}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.filterRow, { marginBottom: 16 }]}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            modalidadActiva === 'TODOS' && styles.filterChipActive,
          ]}
          onPress={() => setModalidadActiva('TODOS')}
        >
          <Text
            style={[
              styles.filterChipText,
              modalidadActiva === 'TODOS' && styles.filterChipTextActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            modalidadActiva === 'presencial_caracas' && styles.filterChipActive,
          ]}
          onPress={() => setModalidadActiva('presencial_caracas')}
        >
          <Text
            style={[
              styles.filterChipText,
              modalidadActiva === 'presencial_caracas' && styles.filterChipTextActive,
            ]}
          >
            Presencial Caracas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            modalidadActiva === 'online_en_vivo' && styles.filterChipActive,
          ]}
          onPress={() => setModalidadActiva('online_en_vivo')}
        >
          <Text
            style={[
              styles.filterChipText,
              modalidadActiva === 'online_en_vivo' && styles.filterChipTextActive,
            ]}
          >
            Online En Vivo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Banner Oficial: PROMO COLABORATIVA Plan Formativo 2x1 Amigo */}
      <View style={styles.promoBanner}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.promoMicroTag}>PROMO COLABORATIVA</Text>
          <Text style={styles.promoTitle}>Plan Formativo 2x1 Amigo</Text>
          <Text style={styles.promoSubtitle}>
            Inscribe a un segundo alumno en horario grupal con 50% de descuento.
          </Text>
        </View>
        <View style={styles.promoGoldBadge}>
          <Text style={styles.promoGoldMain}>50%</Text>
          <Text style={styles.promoGoldSub}>2DO CUPO</Text>
          <Text style={styles.promoGoldSub}>AMIGO</Text>
        </View>
      </View>

      {/* Encabezado de Sección de Maestros */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Maestros Certificados</Text>
        <Text style={styles.sectionLinkText}>Ver todos ({docentes.length})</Text>
      </View>

      {/* Listado de Tarjetas de Docentes */}
      {cargando ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={AZUL_REY} />
          <Text style={styles.loadingText}>Consultando cátedras disponibles...</Text>
        </View>
      ) : docentes.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Sin resultados para este filtro</Text>
          <Text style={styles.emptySubtitle}>
            Intenta buscar otro instrumento o selecciona la modalidad &quot;Todos&quot;.
          </Text>
        </View>
      ) : (
        docentes.map((docente) => {
          const iniciales = obtenerIniciales(docente.nombre);
          const instrumentoPrincipal = docente.instrumentos[0] ?? 'Oboe';
          const textoModalidades = docente.modalidades
            .map((m) => ETIQUETA_MODALIDAD[m] ?? m)
            .join(' • ');

          return (
            <View key={docente.id} style={styles.teacherCard}>
              <View style={styles.teacherCardMainRow}>
                <View style={styles.teacherAvatarCircle}>
                  <Text style={styles.teacherAvatarText}>{iniciales}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.nameAndBadgeRow}>
                    <Text style={styles.teacherName}>{docente.nombre}</Text>
                    <View style={styles.fundaoboeBadge}>
                      <Text style={styles.fundaoboeBadgeText}>✓ FUNDAOBOE</Text>
                    </View>
                  </View>

                  <Text style={styles.teacherSpecialtyText}>
                    Cátedra de {instrumentoPrincipal} • {docente.nivel_docente}
                  </Text>
                  <Text style={styles.teacherLocationText}>📍 {textoModalidades}</Text>
                  <Text style={styles.teacherBio} numberOfLines={2}>
                    {docente.bio}
                  </Text>
                </View>

                <View style={styles.priceColumn}>
                  <Text style={styles.priceBigText}>${docente.tarifa_usd.toFixed(0)}/h</Text>
                  <Text style={styles.priceMicroLabel}>Clase suelta</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardFooterBar}>
                <View style={styles.abonoAmberPill}>
                  <Text style={styles.abonoAmberText}>★ Abono: -10%</Text>
                </View>

                <TouchableOpacity
                  style={styles.profileButton}
                  activeOpacity={0.85}
                  onPress={() =>
                    onSelectTeacher(
                      docente,
                      modoAlumno === 'A1_REPRESENTANTE' && alumnoActivo
                        ? alumnoActivo
                        : undefined
                    )
                  }
                >
                  <Text style={styles.profileButtonText}>Ver Perfil y Horarios</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* Tarjeta Contextual Inferior según A0 (Autonomía Universitaria) o A1 (Soporte Multihijo) */}
      {modoAlumno === 'A0_ADULTO' ? (
        <View style={styles.bottomContextCard}>
          <Text style={styles.bottomContextTitle}>
            🎓 Autonomía para Estudiantes Mayores de Edad
          </Text>
          <Text style={styles.bottomContextDesc}>
            Como alumno mayor de edad gestionas directamente tu agenda, abonos formativos y liberaciones en Escrow sin requerir cuenta parental.
          </Text>
          <View style={styles.bottomContextPill}>
            <Text style={styles.bottomContextPillText}>
              ✓ Titularidad financiera y académica directa habilitada
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.bottomContextCard}>
          <Text style={styles.bottomContextTitle}>
            👨‍👧‍👦 Gestión de Hijos Representados
          </Text>
          <Text style={styles.bottomContextDesc}>
            {alumnoActivo
              ? `Actualmente reservando para: ${alumnoActivo.nombre_menor} (${alumnoActivo.edad_anos} años — ${alumnoActivo.instrumento}). Total registrados: ${subperfiles.length}.`
              : 'Aún no has registrado hijos en tu cuenta. Usa el formulario superior o ve a la pestaña Perfil para añadirlos.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {subperfiles.length > 1 && (
              <TouchableOpacity
                style={[styles.manageChildrenBtn, { flex: 1 }]}
                activeOpacity={0.85}
                onPress={alternarHijoActivo}
              >
                <Text style={styles.manageChildrenBtnText}>
                  ⇄ Cambiar Hijo Activo
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.manageChildrenBtn, { flex: 1 }]}
              activeOpacity={0.85}
              onPress={() => setMostrarFormHijo((prev) => !prev)}
            >
              <Text style={styles.manageChildrenBtnText}>
                {mostrarFormHijo ? 'Cerrar Formulario' : '＋ Añadir Otro Hijo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const AZUL_REY = '#1D4ED8';
const AZUL_OSCURO = '#1E40AF';
const FONDO_OFICIAL = '#F8FAFC';

const styles = StyleSheet.create({
  container: {
    backgroundColor: FONDO_OFICIAL,
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  userAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircleBlue: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DBEAFE',
    borderWidth: 1.5,
    borderColor: AZUL_REY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '800',
    color: AZUL_OSCURO,
  },
  userRoleMicro: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A192F',
  },
  bellIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIconText: {
    fontSize: 16,
  },
  childSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  childAvatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AZUL_REY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarMiniText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  childSelectorText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: AZUL_OSCURO,
  },
  childSelectorArrow: {
    fontSize: 12,
    fontWeight: '900',
    color: AZUL_REY,
  },
  addChildQuickBtn: {
    backgroundColor: AZUL_REY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addChildQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  addChildFormCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  addChildFormTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 2,
  },
  addChildFormSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 10,
  },
  childInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 12.5,
    color: '#0F172A',
    marginBottom: 8,
  },
  childRowInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  childErrorText: {
    color: '#DC2626',
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  saveChildBtn: {
    backgroundColor: '#059669',
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveChildBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 2,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    paddingHorizontal: 6,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: AZUL_REY,
    borderColor: AZUL_REY,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AZUL_OSCURO,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: AZUL_OSCURO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  promoMicroTag: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FDE68A',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 11.5,
    color: '#DBEAFE',
    lineHeight: 16,
  },
  promoGoldBadge: {
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoGoldMain: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  promoGoldSub: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FEF3C7',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 8,
  },
  sectionLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: AZUL_REY,
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  teacherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  teacherCardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  teacherAvatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: AZUL_REY,
  },
  nameAndBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  teacherName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A192F',
  },
  fundaoboeBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fundaoboeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  teacherSpecialtyText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 2,
  },
  teacherLocationText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  teacherBio: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  priceBigText: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#0A192F',
  },
  priceMicroLabel: {
    fontSize: 9.5,
    color: '#64748B',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardFooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  abonoAmberPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  abonoAmberText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#D97706',
  },
  profileButton: {
    flex: 1,
    backgroundColor: AZUL_REY,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  bottomContextCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  bottomContextTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: AZUL_OSCURO,
    marginBottom: 4,
  },
  bottomContextDesc: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 17,
    marginBottom: 10,
  },
  bottomContextPill: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  bottomContextPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: AZUL_REY,
  },
  manageChildrenBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AZUL_REY,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  manageChildrenBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: AZUL_REY,
  },
  visitorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  visitorAmberPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  visitorAmberText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  visitorTopRegisterBtn: {
    backgroundColor: AZUL_REY,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  visitorTopRegisterText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  visitorMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 4,
  },
  visitorSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 14,
  },
  lockedChairCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  lockedChairTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  padlockAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padlockIcon: {
    fontSize: 22,
  },
  lockedChairTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 2,
  },
  lockedChairSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 6,
  },
  verifiedGreenBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  verifiedGreenBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
  },
  lockedOverlayBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  lockedOverlayTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 4,
    textAlign: 'center',
  },
  lockedOverlayDesc: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  unlockAccountBtn: {
    backgroundColor: AZUL_REY,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    width: '100%',
    alignItems: 'center',
  },
  unlockAccountBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  whyRegisterCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  whyRegisterTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: AZUL_OSCURO,
    marginBottom: 8,
  },
  whyRegisterBullet: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 4,
  },
});
