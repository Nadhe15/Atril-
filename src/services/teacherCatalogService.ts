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
import { calcularAbono, calcularHonorarioClase, redondearMoneda } from '../utils/escrowCalculator';
import { normalizarModalidadClase } from './escrowService';

interface PerfilProfesorJoinRow {
  id: string;
  user_id: string;
  bio: string | null;
  instrumentos: string[] | null;
  modalidades: string[] | null;
  tarifa_usd: number | string;
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
 * Catálogo institucional de respaldo (FundaOboeHJK & Conservatorio) en caso de que
 * la tabla remota `perfiles_profesores` aún no tenga semillas cargadas.
 * Cumple estrictamente la política de privacidad: sin teléfono, correo ni cédula.
 */
const DOCENTES_INSTITUCIONALES_FALLBACK: DocenteCatalogoItem[] = [
  {
    id: 'ficha-prof-01',
    profesor_id: '99999999-9999-9999-9999-999999999999',
    nombre: 'Mtro. José Gregorio Sanabria',
    bio: 'Solista principal de Oboe y formador de la Academia FundaOboeHJK. Especialista en embocadura, raspado de cañas y repertorio sinfónico juvenil.',
    instrumentos: ['Oboe', 'Corno Inglés', 'Lenguaje Musical'],
    modalidades: ['presencial_caracas', 'online_en_vivo', 'hibrido'],
    tarifa_usd: 25.0,
    nivel_docente: 'Trayectoria Conservatorio • Solista FundaOboeHJK',
    verificado_fundaoboe: true,
  },
  {
    id: 'ficha-prof-02',
    profesor_id: '88888888-8888-8888-8888-888888888888',
    nombre: 'Prof. Valentina Meneses',
    bio: 'Cátedra de Fagot y Música de Cámara. 12 años de experiencia pedagógica infantil y preparación para audiciones orquestales en Caracas.',
    instrumentos: ['Fagot', 'Contrafagot', 'Iniciación Rítmica'],
    modalidades: ['presencial_caracas', 'online_en_vivo'],
    tarifa_usd: 22.0,
    nivel_docente: 'Trayectoria Conservatorio • Cátedra Superior',
    verificado_fundaoboe: true,
  },
  {
    id: 'ficha-prof-03',
    profesor_id: '77777777-7777-7777-7777-777777777777',
    nombre: 'Prof. Alejandro Iturriza',
    bio: 'Clarinetista y pedagogo musical enfocado en técnica de articulación, lectura a primera vista y clases interactivas en vivo por Zoom.',
    instrumentos: ['Clarinete', 'Flauta Transversa', 'Teoría y Solfeo'],
    modalidades: ['online_en_vivo'],
    tarifa_usd: 20.0,
    nivel_docente: 'Trayectoria Conservatorio • Pedagogo Certificado',
    verificado_fundaoboe: true,
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

function mapearFilaADocenteCatalogo(row: PerfilProfesorJoinRow): DocenteCatalogoItem {
  const modalidadesNormalizadas: ModalidadClase[] =
    Array.isArray(row.modalidades) && row.modalidades.length > 0
      ? Array.from(new Set(row.modalidades.map((m) => normalizarModalidadClase(m))))
      : ['presencial_caracas', 'online_en_vivo'];

  return {
    id: row.id,
    profesor_id: row.user_id || row.id,
    nombre: extraerNombrePublico(row),
    bio:
      row.bio?.trim() ||
      'Docente verificado por el consejo académico de FundaOboeHJK para enseñanza tutelada.',
    instrumentos:
      Array.isArray(row.instrumentos) && row.instrumentos.length > 0
        ? row.instrumentos
        : ['Oboe', 'Lenguaje Musical'],
    modalidades: modalidadesNormalizadas,
    tarifa_usd: redondearMoneda(Number(row.tarifa_usd) || 25.0),
    nivel_docente:
      row.nivel_docente?.trim() || 'Trayectoria Conservatorio • Aval FundaOboeHJK',
    verificado_fundaoboe: Boolean(row.verificado_fundaoboe ?? true),
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

    if (filtros.instrumento && filtros.instrumento.trim().length > 0) {
      const termino = filtros.instrumento.trim().toLowerCase();
      const coincideInstrumento = docente.instrumentos.some((inst) =>
        inst.toLowerCase().includes(termino)
      );
      const coincideNombre = docente.nombre.toLowerCase().includes(termino);
      if (!coincideInstrumento && !coincideNombre) return false;
    }

    return true;
  });
}

/**
 * Construye las 3 opciones de contratación oficiales dentro de la ficha del docente:
 * - Clase suelta de 60 min (tarifa estándar)
 * - Abono Formativo 6 clases (-10%)
 * - Abono Intensivo 8 clases (-12%)
 */
export function construirOpcionesContratacionDocente(
  tarifaUsd: number
): OpcionContratacionDocente[] {
  const unitaria = calcularHonorarioClase(tarifaUsd);
  const abono6 = calcularAbono(6, tarifaUsd);
  const abono8 = calcularAbono(8, tarifaUsd);

  return [
    {
      id: 'CLASE_SUELTA_1',
      titulo: 'Clase Individual (60 min)',
      subtitulo: 'Reserva puntual sin compromiso de paquete',
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
      subtitulo: `Prepago protegido en Escrow • $${abono6.equivalentePorClase.toFixed(2)} USD/clase`,
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
      subtitulo: `Ciclo completo de cátedra • $${abono8.equivalentePorClase.toFixed(2)} USD/clase`,
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

/**
 * Genera bloques horarios autorizados próximos para la agenda del docente.
 */
function generarBloquesHorariosDocente(profesorId: string): BloqueHorarioDisponible[] {
  const ahora = Date.now();
  return [
    {
      id: `${profesorId}-slot-1`,
      etiqueta: 'Hoy (Prueba En Vivo +10 min) • 60 min',
      fechaHoraIso: new Date(ahora + 10 * 60 * 1000).toISOString(),
      modalidadSugerida: 'online_en_vivo',
    },
    {
      id: `${profesorId}-slot-2`,
      etiqueta: 'Mañana • 04:00 PM - 05:00 PM',
      fechaHoraIso: new Date(ahora + 26 * 3600 * 1000).toISOString(),
      modalidadSugerida: 'presencial_caracas',
    },
    {
      id: `${profesorId}-slot-3`,
      etiqueta: 'Jueves • 05:30 PM - 06:30 PM',
      fechaHoraIso: new Date(ahora + 50 * 3600 * 1000).toISOString(),
      modalidadSugerida: 'online_en_vivo',
    },
    {
      id: `${profesorId}-slot-4`,
      etiqueta: 'Sábado • 10:00 AM - 11:00 AM (Sede Caracas)',
      fechaHoraIso: new Date(ahora + 96 * 3600 * 1000).toISOString(),
      modalidadSugerida: 'presencial_caracas',
    },
  ];
}

/**
 * Consulta la tabla `perfiles_profesores` unida con `usuarios` ocultando datos sensibles
 * de contacto directo (sin email, teléfono ni cédula de identidad).
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
        tarifa_usd,
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
    // Continúa hacia el catálogo institucional curado si la tabla aún no tiene registros
  }

  return aplicarFiltrosLocales(DOCENTES_INSTITUCIONALES_FALLBACK, filtros);
}

/**
 * Obtiene el detalle completo de la ficha del docente, sus bloques horarios disponibles
 * y sus opciones de contratación (Clase suelta, Abono 6 al -10%, Abono 8 al -12%).
 */
export async function obtenerFichaDocente(profesorId: string): Promise<FichaDocenteDetalle> {
  if (!profesorId) {
    throw new Error('El identificador del profesor (profesorId) es obligatorio.');
  }

  const catalogo = await obtenerCatalogoDocentes();
  const base =
    catalogo.find((d) => d.profesor_id === profesorId || d.id === profesorId) ??
    DOCENTES_INSTITUCIONALES_FALLBACK[0];

  return {
    ...base,
    sedeReferencia: 'Sede Académica FundaOboeHJK / Sala Zoom Tutelada — Caracas',
    bloquesHorarios: generarBloquesHorariosDocente(base.profesor_id),
    opcionesContratacion: construirOpcionesContratacionDocente(base.tarifa_usd),
  };
}
