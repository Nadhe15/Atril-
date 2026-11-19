// src/services/teacherCatalogService.ts
import { supabase } from '../lib/supabase';
import {
  BloqueHorarioDisponible,
  DocenteCatalogoItem,
  FichaDocenteDetalle,
  FiltrosCatalogoDocentes,
  ModalidadClase,
  OpcionContratacionDocente,
} from '../types/atril.types';
import { calcularAbono, calcularHonorarioClase } from '../utils/escrowCalculator';
import { normalizarModalidadClase } from './escrowService';

/**
 * Áreas y cátedras musicales oficiales de ATRIL v5.0 (FundaOboeHJK & Conservatorio).
 * Reemplaza el concepto de "instrumento que toca" por áreas académicas certificadas.
 */
export const AREAS_CATEDRAS_OFICIALES: readonly string[] = [
  'Oboe Sinfónico',
  'Guitarra Clásica',
  'Cuatro Venezolano',
  'Fagot',
  'Violín',
  'Canto',
  'Armonía',
  'Lenguaje Musical',
] as const;

interface PerfilProfesorJoinRow {
  id: string;
  user_id: string;
  bio: string | null;
  area_principal?: string | null;
  areas_certificadas?: string[] | null;
  instrumentos: string[] | null;
  modalidades: string[] | null;
  verificado_fundaoboe: boolean | null;
  nivel_docente?: string | null;
  usuarios?:
    | {
        id: string;
        nombre_completo: string;
      }
    | {
        id: string;
        nombre_completo: string;
      }[]
    | null;
}

/**
 * Catálogo institucional de cátedras certificadas v5.0 (FundaOboeHJK & USB).
 * Sin tarifas ni opciones de abono; centrado en áreas formativas y verificación académica.
 */
const DOCENTES_INSTITUCIONALES_FALLBACK: DocenteCatalogoItem[] = [
  {
    id: 'ficha-prof-01',
    profesor_id: '99999999-9999-9999-9999-999999999999',
    nombre: 'Mtro. José Gregorio Sanabria',
    bio: 'Solista principal y formador titular de la Academia FundaOboeHJK. Especialista en técnica de embocadura, calibración de cañas y repertorio orquestal.',
    areaPrincipal: 'Oboe Sinfónico',
    areasCertificadas: ['Oboe Sinfónico', 'Lenguaje Musical', 'Armonía'],
    instrumentos: ['Oboe Sinfónico', 'Lenguaje Musical', 'Armonía'],
    modalidades: ['presencial_caracas', 'online_en_vivo', 'hibrido'],
    tarifa_usd: 0,
    nivel_docente: 'Maestro Titular • Solista FundaOboeHJK',
    verificado_fundaoboe: true,
    sedeReferencia: 'Sede Académica FundaOboeHJK — Caracas / Sala Virtual',
  },
  {
    id: 'ficha-prof-02',
    profesor_id: '88888888-8888-8888-8888-888888888888',
    nombre: 'Prof. Valentina Meneses',
    bio: 'Cátedra superior de Fagot y Música de Cámara. 12 años de experiencia en formación sinfónica juvenil, postura e interpretación académica.',
    areaPrincipal: 'Fagot',
    areasCertificadas: ['Fagot', 'Lenguaje Musical'],
    instrumentos: ['Fagot', 'Lenguaje Musical'],
    modalidades: ['presencial_caracas', 'online_en_vivo'],
    tarifa_usd: 0,
    nivel_docente: 'Cátedra Superior • Conservatorio & FundaOboeHJK',
    verificado_fundaoboe: true,
    sedeReferencia: 'Sede Académica FundaOboeHJK — Caracas',
  },
  {
    id: 'ficha-prof-03',
    profesor_id: '77777777-7777-7777-7777-777777777777',
    nombre: 'Mtro. Leonardo Montilla',
    bio: 'Concertista y pedagogo de Guitarra Clásica y Cuatro Venezolano. Especialista en polifonía, repertorio tradicional venezolano y lectura aplicada.',
    areaPrincipal: 'Guitarra Clásica',
    areasCertificadas: ['Guitarra Clásica', 'Cuatro Venezolano', 'Armonía'],
    instrumentos: ['Guitarra Clásica', 'Cuatro Venezolano', 'Armonía'],
    modalidades: ['presencial_caracas', 'online_en_vivo', 'hibrido'],
    tarifa_usd: 0,
    nivel_docente: 'Concertista Titular • Cátedra de Cuerdas Pulsadas',
    verificado_fundaoboe: true,
    sedeReferencia: 'Caracas / Aula Virtual Tutelada',
  },
  {
    id: 'ficha-prof-04',
    profesor_id: '66666666-6666-6666-6666-666666666666',
    nombre: 'Prof. Mariana Salcedo',
    bio: 'Violinista sinfónica y preparadora de fila. Enfoque en afinación, golpes de arco, técnica de mano izquierda y preparación de audiciones.',
    areaPrincipal: 'Violín',
    areasCertificadas: ['Violín', 'Lenguaje Musical'],
    instrumentos: ['Violín', 'Lenguaje Musical'],
    modalidades: ['presencial_caracas', 'online_en_vivo'],
    tarifa_usd: 0,
    nivel_docente: 'Formadora Orquestal • Cátedra de Violín',
    verificado_fundaoboe: true,
    sedeReferencia: 'Sede Caracas — FundaOboeHJK',
  },
  {
    id: 'ficha-prof-05',
    profesor_id: '55555555-5555-5555-5555-555555555555',
    nombre: 'Prof. Adriana Villamizar',
    bio: 'Cátedra de Canto Lírico, técnica vocal, respiración diafragmática y entrenamiento auditivo para jóvenes y adultos en formación académica.',
    areaPrincipal: 'Canto',
    areasCertificadas: ['Canto', 'Lenguaje Musical', 'Armonía'],
    instrumentos: ['Canto', 'Lenguaje Musical', 'Armonía'],
    modalidades: ['online_en_vivo', 'presencial_caracas'],
    tarifa_usd: 0,
    nivel_docente: 'Pedagoga Vocal Certificada • Aval FundaOboeHJK',
    verificado_fundaoboe: true,
    sedeReferencia: 'Sala Virtual / Sede Caracas',
  },
];

function extraerNombrePublico(row: PerfilProfesorJoinRow): string {
  if (!row.usuarios) {
    return 'Maestro Verificado FundaOboeHJK';
  }
  if (Array.isArray(row.usuarios)) {
    return row.usuarios[0]?.nombre_completo || 'Maestro Verificado FundaOboeHJK';
  }
  return row.usuarios.nombre_completo || 'Maestro Verificado FundaOboeHJK';
}

function homologarAreaMusical(etiquetaRaw: string): string {
  const limpio = etiquetaRaw.trim();
  const lower = limpio.toLowerCase();
  if (lower === 'oboe' || lower.includes('oboe')) return 'Oboe Sinfónico';
  if (lower.includes('guitarra')) return 'Guitarra Clásica';
  if (lower.includes('cuatro')) return 'Cuatro Venezolano';
  if (lower.includes('fagot')) return 'Fagot';
  if (lower.includes('violin') || lower.includes('violín')) return 'Violín';
  if (lower.includes('canto') || lower.includes('vocal')) return 'Canto';
  if (lower.includes('armonia') || lower.includes('armonía')) return 'Armonía';
  if (lower.includes('lenguaje') || lower.includes('solfeo') || lower.includes('teoría')) {
    return 'Lenguaje Musical';
  }
  return limpio || 'Oboe Sinfónico';
}

function mapearFilaADocenteCatalogo(row: PerfilProfesorJoinRow): DocenteCatalogoItem {
  const modalidadesNormalizadas: ModalidadClase[] =
    Array.isArray(row.modalidades) && row.modalidades.length > 0
      ? Array.from(new Set(row.modalidades.map((m) => normalizarModalidadClase(m))))
      : ['presencial_caracas', 'online_en_vivo'];

  const listaOrigen =
    Array.isArray(row.areas_certificadas) && row.areas_certificadas.length > 0
      ? row.areas_certificadas
      : Array.isArray(row.instrumentos) && row.instrumentos.length > 0
      ? row.instrumentos
      : ['Oboe Sinfónico', 'Lenguaje Musical'];

  const areasCertificadas = Array.from(
    new Set(listaOrigen.map((item) => homologarAreaMusical(item)))
  );

  const areaPrincipal = row.area_principal
    ? homologarAreaMusical(row.area_principal)
    : areasCertificadas[0] ?? 'Oboe Sinfónico';

  return {
    id: row.id,
    profesor_id: row.user_id || row.id,
    nombre: extraerNombrePublico(row),
    bio:
      row.bio?.trim() ||
      'Docente verificado por el consejo académico de FundaOboeHJK para enseñanza musical tutelada.',
    areaPrincipal,
    areasCertificadas,
    instrumentos: areasCertificadas,
    modalidades: modalidadesNormalizadas,
    tarifa_usd: 0,
    nivel_docente:
      row.nivel_docente?.trim() || 'Trayectoria Conservatorio • Aval FundaOboeHJK',
    verificado_fundaoboe: Boolean(row.verificado_fundaoboe ?? true),
    sedeReferencia: 'Sede Académica FundaOboeHJK / Sala Virtual Tutelada — Caracas',
  };
}

function aplicarFiltrosLocales(
  lista: DocenteCatalogoItem[],
  filtros?: FiltrosCatalogoDocentes
): DocenteCatalogoItem[] {
  if (!filtros) return lista;

  return lista.filter((docente) => {
    if (filtros.modalidad) {
      const modBuscada = normalizarModalidadClase(filtros.modalidad);
      const admiteModalidad =
        docente.modalidades.includes(modBuscada) || docente.modalidades.includes('hibrido');
      if (!admiteModalidad) return false;
    }

    const terminoArea = (filtros.area ?? filtros.instrumento ?? '').trim().toLowerCase();
    if (terminoArea.length > 0) {
      const coincideAreaPrincipal = docente.areaPrincipal.toLowerCase().includes(terminoArea);
      const coincideAreas = docente.areasCertificadas.some((a) =>
        a.toLowerCase().includes(terminoArea)
      );
      const coincideNombre = docente.nombre.toLowerCase().includes(terminoArea);
      if (!coincideAreaPrincipal && !coincideAreas && !coincideNombre) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Consulta el catálogo de cátedras y maestros verificados por FundaOboeHJK
 * enfocado en áreas académicas (`areaPrincipal` y `areasCertificadas`), sin tarifas ni abonos.
 */
export async function obtenerCatalogoDocentes(
  filtros?: FiltrosCatalogoDocentes
): Promise<DocenteCatalogoItem[]> {
  try {
    const { data, error } = await supabase
      .from('perfiles_profesores')
      .select(
        `
        id,
        user_id,
        bio,
        instrumentos,
        modalidades,
        verificado_fundaoboe,
        usuarios (
          id,
          nombre_completo
        )
      `
      )
      .eq('verificado_fundaoboe', true);

    if (!error && data && data.length > 0) {
      const mapeados = (data as unknown as PerfilProfesorJoinRow[]).map(
        mapearFilaADocenteCatalogo
      );
      return aplicarFiltrosLocales(mapeados, filtros);
    }
  } catch {
    // Continúa hacia el catálogo institucional de cátedras curadas
  }

  return aplicarFiltrosLocales(DOCENTES_INSTITUCIONALES_FALLBACK, filtros);
}

/**
 * Obtiene el perfil académico de un docente por su identificador (`profesor_id` o `id`)
 * para la vista de detalle y apertura de mensajería directa en v5.0.
 */
export async function obtenerDocentePorId(
  profesorId: string
): Promise<DocenteCatalogoItem> {
  if (!profesorId) {
    throw new Error('El identificador del profesor (profesorId) es obligatorio.');
  }

  const catalogo = await obtenerCatalogoDocentes();
  return (
    catalogo.find((d) => d.profesor_id === profesorId || d.id === profesorId) ??
    DOCENTES_INSTITUCIONALES_FALLBACK[0]
  );
}

// ============================================================================
// FUNCIONES EN MODO PASIVO (PRESERVADAS PARA COMPATIBILIDAD CON FLUJO ESCROW)
// ============================================================================

export function construirOpcionesContratacionDocente(
  tarifaUsd: number
): OpcionContratacionDocente[] {
  const tarifaSegura = tarifaUsd > 0 ? tarifaUsd : 25;
  const unitaria = calcularHonorarioClase(tarifaSegura);
  const abono6 = calcularAbono(6, tarifaSegura);
  const abono8 = calcularAbono(8, tarifaSegura);

  return [
    {
      id: 'CLASE_SUELTA_1',
      titulo: 'Clase Individual (60 min)',
      subtitulo: 'Coordinación académica por sesión',
      cantidadClases: 1,
      porcentajeDescuento: 0,
      montoTotalUsd: unitaria.bruto,
      equivalentePorClaseUsd: unitaria.bruto,
      ahorroUsd: 0,
      comisionPlataformaUsd: unitaria.comisionPlataforma,
      honorarioNetoDocenteUsd: unitaria.honorarioNeto,
    },
    {
      id: 'ABONO_6_CLASES',
      titulo: 'Abono Formativo 6 Clases (-10%)',
      subtitulo: 'Ciclo formativo de cátedra',
      cantidadClases: 6,
      porcentajeDescuento: 10,
      montoTotalUsd: abono6.totalAPagarContado,
      equivalentePorClaseUsd: abono6.equivalentePorClase,
      ahorroUsd: abono6.ahorroUsd,
      comisionPlataformaUsd: abono6.comisionPlataformaTotal,
      honorarioNetoDocenteUsd: abono6.honorarioNetoDocenteTotal,
    },
    {
      id: 'ABONO_8_CLASES',
      titulo: 'Abono Intensivo 8 Clases (-12%)',
      subtitulo: 'Ciclo completo de cátedra',
      cantidadClases: 8,
      porcentajeDescuento: 12,
      montoTotalUsd: abono8.totalAPagarContado,
      equivalentePorClaseUsd: abono8.equivalentePorClase,
      ahorroUsd: abono8.ahorroUsd,
      comisionPlataformaUsd: abono8.comisionPlataformaTotal,
      honorarioNetoDocenteUsd: abono8.honorarioNetoDocenteTotal,
    },
  ];
}

function generarBloquesHorariosDocente(profesorId: string): BloqueHorarioDisponible[] {
  const ahora = Date.now();
  return [
    {
      id: `${profesorId}-slot-1`,
      etiqueta: 'Hoy • 60 min',
      fechaHoraIso: new Date(ahora + 10 * 60 * 1000).toISOString(),
      modalidadSugerida: 'online_en_vivo',
    },
    {
      id: `${profesorId}-slot-2`,
      etiqueta: 'Mañana • 04:00 PM - 05:00 PM',
      fechaHoraIso: new Date(ahora + 26 * 3600 * 1000).toISOString(),
      modalidadSugerida: 'presencial_caracas',
    },
  ];
}

export async function obtenerFichaDocente(profesorId: string): Promise<FichaDocenteDetalle> {
  const base = await obtenerDocentePorId(profesorId);
  return {
    ...base,
    sedeReferencia:
      base.sedeReferencia || 'Sede Académica FundaOboeHJK / Sala Virtual Tutelada — Caracas',
    bloquesHorarios: generarBloquesHorariosDocente(base.profesor_id),
    opcionesContratacion: construirOpcionesContratacionDocente(base.tarifa_usd),
  };
}
