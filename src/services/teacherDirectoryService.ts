// src/services/teacherDirectoryService.ts
import { PerfilDocenteAtril } from '../types/atril.types';

export const DOCENTES_INICIALES_ATRIL: PerfilDocenteAtril[] = [
  {
    id: 'doc-elena-01',
    user_id: 'usr-doc-elena',
    nombre_completo: 'Prof. Elena Morales',
    cedula_identidad: 'V-16.482.910',
    email: 'elena.morales@fundaoboe.org.ve',
    telefono: '+58 412-5551020',
    instrumento_principal: 'Oboe Sinfónico',
    instrumentos_certificados: [
      'Oboe Sinfónico',
      'Corno Inglés',
      'Fabricación y Raspado de Cañas',
      'Lenguaje Musical y Solfeo',
    ],
    acreditado_fundaoboe: true,
    estado_acreditacion: 'ACREDITADO',
    orquesta_o_conservatorio:
      'Conservatorio de Música Simón Bolívar • Solista de Oboe en Orquesta Sinfónica',
    anos_experiencia: 14,
    trayectoria_biografia:
      'Oboísta principal con 14 años de trayectoria sinfónica y pedagógica en El Sistema y Fundaoboe. Especialista en técnica de embocadura, repertorio orquestal e iniciación infantil y juvenil.',
    certificaciones_avales: [
      'Título de Maestro Ejecutante de Oboe — Conservatorio de Música Simón Bolívar',
      'Constancia de Músico Titular — Orquesta Sinfónica Simón Bolívar',
      'Certificación Pedagógica y Aval de Acreditación Musical — Fundaoboe',
    ],
    modalidades: ['Online (En Vivo)'],
    documentos: {
      cedulaIdentidad: {
        nombreArchivo: 'cedula_elena_morales.png',
        formato: 'PNG',
        pesoMb: 2.1,
        cargado: true,
      },
      fotoPersonal: {
        nombreArchivo: 'foto_perfil_elena.jpg',
        formato: 'JPG',
        pesoMb: 2.8,
        cargado: true,
      },
      curriculumVitae: {
        nombreArchivo: 'CV_Elena_Morales_Oboe.pdf',
        formato: 'PDF',
        pesoMb: 3.4,
        cargado: true,
      },
      certificacionesMusicales: {
        nombreArchivo: 'Certificados_Sinfonica_y_Conservatorio_Elena.pdf',
        formato: 'PDF',
        pesoMb: 4.9,
        cargado: true,
        descripcion: 'Certificado Orquesta Sinfónica + Título Conservatorio',
      },
    },
  },
  {
    id: 'doc-carlos-02',
    user_id: 'usr-doc-carlos',
    nombre_completo: 'Prof. Carlos Briceño',
    cedula_identidad: 'V-18.920.334',
    email: 'carlos.briceno@fundaoboe.org.ve',
    telefono: '+58 414-3328910',
    instrumento_principal: 'Guitarra Clásica',
    instrumentos_certificados: [
      'Guitarra Clásica',
      'Guitarra Española',
      'Cuatro Venezolano (Tradicional y Solista)',
      'Armonía Aplicada',
    ],
    acreditado_fundaoboe: true,
    estado_acreditacion: 'ACREDITADO',
    orquesta_o_conservatorio:
      'Escuela de Música José Ángel Lamas • Cátedra de Cuerdas Pulsadas',
    anos_experiencia: 11,
    trayectoria_biografia:
      'Guitarrista clásico y cuatrista concertista egresado de la Escuela Superior de Música José Ángel Lamas. Ganador del Concurso Nacional de Guitarra y preparador de repertorio venezolano y académico.',
    certificaciones_avales: [
      'Diploma de Maestro de Guitarra Clásica — Escuela José Ángel Lamas',
      'Certificado de Cátedra de Cuatro Venezolano — Orquesta Típica Nacional',
      'Acreditación Oficial de Músico Verificado — Fundaoboe',
    ],
    modalidades: ['Online (En Vivo)'],
    documentos: {
      cedulaIdentidad: {
        nombreArchivo: 'cedula_carlos_briceno.jpg',
        formato: 'JPG',
        pesoMb: 1.9,
        cargado: true,
      },
      fotoPersonal: {
        nombreArchivo: 'foto_carlos_briceno.jpg',
        formato: 'JPG',
        pesoMb: 2.3,
        cargado: true,
      },
      curriculumVitae: {
        nombreArchivo: 'CV_Carlos_Briceno_Cuerdas.pdf',
        formato: 'PDF',
        pesoMb: 2.7,
        cargado: true,
      },
      certificacionesMusicales: {
        nombreArchivo: 'Diplomas_Lamas_y_Orquesta_Tipica.pdf',
        formato: 'PDF',
        pesoMb: 5.2,
        cargado: true,
        descripcion: 'Diploma José Ángel Lamas + Aval Orquesta Típica',
      },
    },
  },
  {
    id: 'doc-mariana-03',
    user_id: 'usr-doc-mariana',
    nombre_completo: 'Prof. Mariana Salcedo',
    cedula_identidad: 'V-19.741.508',
    email: 'mariana.salcedo@fundaoboe.org.ve',
    telefono: '+58 424-2094411',
    instrumento_principal: 'Fagot',
    instrumentos_certificados: [
      'Fagot',
      'Contrafagot',
      'Clarinete',
      'Música de Cámara (Vientos Madera)',
    ],
    acreditado_fundaoboe: true,
    estado_acreditacion: 'ACREDITADO',
    orquesta_o_conservatorio:
      'Orquesta Sinfónica Municipal de Caracas • Conservatorio Nacional Juan José Landaeta',
    anos_experiencia: 9,
    trayectoria_biografia:
      'Fagotista principal e instructora de la fila de maderas en seminarios juveniles. Formación integral en repertorio sinfónico, lectura a primera vista y preparación de audiciones.',
    certificaciones_avales: [
      'Título de Ejecutante de Fagot — Conservatorio Juan José Landaeta',
      'Certificación de Fila de Vientos Madera — Orquesta Sinfónica Municipal',
      'Acreditación Docente Verificada — Fundaoboe',
    ],
    modalidades: ['Online (En Vivo)'],
    documentos: {
      cedulaIdentidad: {
        nombreArchivo: 'cedula_mariana_salcedo.png',
        formato: 'PNG',
        pesoMb: 2.0,
        cargado: true,
      },
      fotoPersonal: {
        nombreArchivo: 'foto_mariana_salcedo.jpg',
        formato: 'JPG',
        pesoMb: 2.5,
        cargado: true,
      },
      curriculumVitae: {
        nombreArchivo: 'CV_Mariana_Salcedo_Fagot.pdf',
        formato: 'PDF',
        pesoMb: 3.1,
        cargado: true,
      },
      certificacionesMusicales: {
        nombreArchivo: 'Certificados_Fagot_Sinfonica_Municipal.pdf',
        formato: 'PDF',
        pesoMb: 4.1,
        cargado: true,
        descripcion: 'Certificado Orquesta Sinfónica Municipal + Conservatorio',
      },
    },
  },
  {
    id: 'doc-alejandro-04',
    user_id: 'usr-doc-alejandro',
    nombre_completo: 'Prof. Alejandro Iturriza',
    cedula_identidad: 'V-17.305.812',
    email: 'alejandro.iturriza@fundaoboe.org.ve',
    telefono: '+58 412-9013345',
    instrumento_principal: 'Violín Sinfónico',
    instrumentos_certificados: [
      'Violín Sinfónico',
      'Viola',
      'Piano Complementario',
      'Dirección de Ensambles Juveniles',
    ],
    acreditado_fundaoboe: true,
    estado_acreditacion: 'ACREDITADO',
    orquesta_o_conservatorio:
      'Academia Latinoamericana de Violín • Orquesta Sinfónica Teresa Carreño',
    anos_experiencia: 12,
    trayectoria_biografia:
      'Violinista formado en la Academia Latinoamericana de Violín. Experiencia en formación técnica de arco, afinación, repertorio solista y preparación de niños y adultos.',
    certificaciones_avales: [
      'Certificado Academia Latinoamericana de Violín',
      'Constancia de Integrante — Orquesta Sinfónica Teresa Carreño',
      'Acreditación Oficial de Músico Verificado — Fundaoboe',
    ],
    modalidades: ['Online (En Vivo)'],
    documentos: {
      cedulaIdentidad: {
        nombreArchivo: 'cedula_alejandro_iturriza.jpg',
        formato: 'JPG',
        pesoMb: 1.8,
        cargado: true,
      },
      fotoPersonal: {
        nombreArchivo: 'foto_alejandro_iturriza.jpg',
        formato: 'JPG',
        pesoMb: 2.2,
        cargado: true,
      },
      curriculumVitae: {
        nombreArchivo: 'CV_Alejandro_Iturriza_Violin.pdf',
        formato: 'PDF',
        pesoMb: 2.9,
        cargado: true,
      },
      certificacionesMusicales: {
        nombreArchivo: 'Certificados_Academia_Violin_OSTC.pdf',
        formato: 'PDF',
        pesoMb: 4.6,
        cargado: true,
        descripcion: 'Certificado Academia Latinoamericana de Violín',
      },
    },
  },
  // Postulante en espera de revisión por el encargado de Fundaoboe
  {
    id: 'doc-pedro-05',
    user_id: 'usr-doc-pedro',
    nombre_completo: 'Pedro Ramírez',
    cedula_identidad: 'V-24.819.302',
    email: 'pedro.ramirez@musica.ve',
    telefono: '+58 412-7748291',
    instrumento_principal: 'Clarinete Sinfónico',
    instrumentos_certificados: [
      'Clarinete en Si bemol',
      'Flauta Transversa',
      'Teoría y Solfeo',
    ],
    acreditado_fundaoboe: false,
    estado_acreditacion: 'EN_REVISION',
    orquesta_o_conservatorio:
      'Orquesta Juvenil de Caracas • Conservatorio Vicente Emilio Sojo',
    anos_experiencia: 6,
    trayectoria_biografia:
      'Clarinetista y flautista egresado del Conservatorio Vicente Emilio Sojo, con 6 años de experiencia como instructor de cátedra de vientos madera.',
    certificaciones_avales: [
      'Constancia de Clarinetista Fila Principal — Orquesta Juvenil de Caracas',
      'Certificado de Estudios Superiores — Conservatorio Vicente Emilio Sojo',
    ],
    modalidades: ['Online (En Vivo)'],
    documentos: {
      cedulaIdentidad: {
        nombreArchivo: 'cedula_pedro_ramirez.png',
        formato: 'PNG',
        pesoMb: 2.4,
        cargado: true,
      },
      fotoPersonal: {
        nombreArchivo: 'foto_pedro_ramirez.jpg',
        formato: 'JPG',
        pesoMb: 3.1,
        cargado: true,
      },
      curriculumVitae: {
        nombreArchivo: 'CV_Pedro_Ramirez_Clarinete.pdf',
        formato: 'PDF',
        pesoMb: 2.8,
        cargado: true,
      },
      certificacionesMusicales: {
        nombreArchivo: 'Certificados_Orquesta_Juvenil_y_Sojo.pdf',
        formato: 'PDF',
        pesoMb: 5.4,
        cargado: true,
        descripcion: 'Certificado Orquesta Juvenil + Conservatorio V.E. Sojo',
      },
    },
  },
  // Postulante previamente enviado al Banco de Talentos
  {
    id: 'doc-luis-06',
    user_id: 'usr-doc-luis',
    nombre_completo: 'Luis Mendoza',
    cedula_identidad: 'V-19.220.410',
    email: 'luis.mendoza@musica.ve',
    telefono: '+58 416-8812034',
    instrumento_principal: 'Percusión Sinfónica',
    instrumentos_certificados: ['Percusión Sinfónica', 'Timbales', 'Marimba'],
    acreditado_fundaoboe: false,
    estado_acreditacion: 'BANCO_TALENTOS',
    orquesta_o_conservatorio: 'Orquesta Sinfónica de Aragua',
    anos_experiencia: 7,
    trayectoria_biografia:
      'Percusionista sinfónico con experiencia en timbales y percusión afrovenezolana.',
    certificaciones_avales: ['Certificado Orquesta Sinfónica de Aragua'],
    modalidades: ['Online (En Vivo)'],
    observacion_revisor:
      'Cumple con el perfil musical, pero la foto de la cédula está borrosa. Queda en el Banco de Talentos hasta subsanar documento.',
    documentos: {
      cedulaIdentidad: {
        nombreArchivo: 'cedula_luis_borrosa.jpg',
        formato: 'JPG',
        pesoMb: 1.5,
        cargado: true,
      },
      fotoPersonal: {
        nombreArchivo: 'foto_luis_mendoza.jpg',
        formato: 'JPG',
        pesoMb: 2.0,
        cargado: true,
      },
      curriculumVitae: {
        nombreArchivo: 'CV_Luis_Mendoza_Percusion.pdf',
        formato: 'PDF',
        pesoMb: 2.2,
        cargado: true,
      },
      certificacionesMusicales: {
        nombreArchivo: 'Certificado_Sinfonica_Aragua.pdf',
        formato: 'PDF',
        pesoMb: 3.6,
        cargado: true,
        descripcion: 'Constancia Orquesta Sinfónica de Aragua',
      },
    },
  },
];

export const FAMILIAS_E_INSTRUMENTOS_FILTRO: string[] = [
  'Todos',
  'Oboe',
  'Guitarra',
  'Cuatro',
  'Clarinete',
  'Fagot',
  'Violín',
  'Flauta',
  'Piano',
  'Solfeo',
];

export function filtrarDocentesAcreditados(
  lista: PerfilDocenteAtril[],
  terminoBusqueda: string,
  instrumentoFiltro: string
): PerfilDocenteAtril[] {
  const acreditados = lista.filter(
    (d) => d.acreditado_fundaoboe && d.estado_acreditacion === 'ACREDITADO'
  );

  return acreditados.filter((docente) => {
    if (instrumentoFiltro && instrumentoFiltro !== 'Todos') {
      const f = instrumentoFiltro.toLowerCase();
      const tocaFiltro =
        docente.instrumento_principal.toLowerCase().includes(f) ||
        docente.instrumentos_certificados.some((i) => i.toLowerCase().includes(f));
      if (!tocaFiltro) return false;
    }

    if (terminoBusqueda.trim().length > 0) {
      const q = terminoBusqueda.trim().toLowerCase();
      const coincideNombre = docente.nombre_completo.toLowerCase().includes(q);
      const coincidePrincipal = docente.instrumento_principal.toLowerCase().includes(q);
      const coincideCertificados = docente.instrumentos_certificados.some((i) =>
        i.toLowerCase().includes(q)
      );
      const coincideOrquesta = docente.orquesta_o_conservatorio.toLowerCase().includes(q);
      return (
        coincideNombre ||
        coincidePrincipal ||
        coincideCertificados ||
        coincideOrquesta
      );
    }

    return true;
  });
}
