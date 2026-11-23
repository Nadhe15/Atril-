// tests/atril.test.ts
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizarRolV5,
  normalizarEstadoVerificacion,
  actualizarEstadoVerificacion,
  aprobarUsuario,
  suspenderUsuario,
  listarUsuariosVerificacion,
  obtenerUsuarioDeCacheAdmin,
  sincronizarUsuarioEnCacheAdmin,
} from '../src/services/adminService';
import {
  registrarUsuarioUnificado,
  iniciarSesionUnificado,
  getCurrentSessionUser,
  signOut,
  signUpStudent,
  signInStudent,
  registrarUsuarioConRol,
  iniciarSesionConRol,
} from '../src/services/authService';
import {
  AREAS_CATEDRAS_OFICIALES,
  obtenerCatalogoDocentes,
  obtenerDocentePorId,
} from '../src/services/teacherCatalogService';
import {
  obtenerOCrearConversacion,
  listarConversacionesUsuario,
  obtenerMensajes,
  enviarMensaje,
  suscribirMensajesConversacion,
} from '../src/services/chatService';
import { testDb } from './supabase-test-db';

/**
 * Función pura de validación de formulario de registro unificado v5.0
 * (espejo verificable de las reglas de negocio de AuthLandingScreen.tsx, incluyendo LOPNNA).
 */
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormValidationInput {
  modoAuth: 'login' | 'registro';
  rolRegistro: 'estudiante' | 'docente';
  esMenorEdad: boolean;
  nombreCompleto: string;
  cedula: string;
  telefono: string;
  email: string;
  password: string;
  areaDocente?: string;
  nombreRepresentante?: string;
  cedulaRepresentante?: string;
}

function validarFormularioAuthV5(input: FormValidationInput): {
  esValido: boolean;
  errores: Record<string, string>;
} {
  const errores: Record<string, string> = {};

  if (input.modoAuth === 'registro') {
    if (!input.nombreCompleto.trim() || input.nombreCompleto.trim().length < 3) {
      errores.nombreCompleto = 'Ingresa nombre y apellido completos.';
    }
    if (!input.cedula.trim() || input.cedula.trim().length < 5) {
      errores.cedula = 'Ingresa un número de cédula o documento válido.';
    }
    if (!input.telefono.trim() || input.telefono.trim().length < 7) {
      errores.telefono = 'Ingresa un teléfono de contacto válido.';
    }

    if (input.rolRegistro === 'docente') {
      if (!input.areaDocente || !input.areaDocente.trim()) {
        errores.areaDocente = 'Selecciona o indica tu área o cátedra principal.';
      }
    } else if (input.esMenorEdad) {
      if (
        !input.nombreRepresentante ||
        input.nombreRepresentante.trim().length < 3
      ) {
        errores.nombreRepresentante =
          'Ingresa el nombre y apellido del padre o representante legal.';
      }
      if (
        !input.cedulaRepresentante ||
        input.cedulaRepresentante.trim().length < 5
      ) {
        errores.cedulaRepresentante =
          'Ingresa la cédula de identidad del representante legal.';
      }
    }
  }

  if (!input.email.trim() || !REGEX_EMAIL.test(input.email.trim())) {
    errores.email = 'Ingresa un correo electrónico válido (ej. usuario@correo.com).';
  }

  if (!input.password || input.password.length < 6) {
    errores.password = 'La contraseña debe tener al menos 6 caracteres.';
  }

  return {
    esValido: Object.keys(errores).length === 0,
    errores,
  };
}

describe('1. PRUEBAS UNITARIAS — ATRIL v5.0 (CU-001 a CU-013)', () => {
  beforeEach(() => {
    testDb.reset();
  });

  it('CU-001: normalizarRolV5 mapea correctamente roles válidos, variantes legacy y valores nulos', () => {
    assert.equal(normalizarRolV5('admin'), 'admin');
    assert.equal(normalizarRolV5('  ADMINISTRADOR '), 'admin');
    assert.equal(normalizarRolV5('docente'), 'docente');
    assert.equal(normalizarRolV5('profesor_docente'), 'docente');
    assert.equal(normalizarRolV5('Profesor'), 'docente');
    assert.equal(normalizarRolV5('estudiante'), 'estudiante');
    assert.equal(normalizarRolV5('representante'), 'estudiante');
    assert.equal(normalizarRolV5(''), 'estudiante');
    assert.equal(normalizarRolV5(null), 'estudiante');
    assert.equal(normalizarRolV5(undefined), 'estudiante');
  });

  it('CU-002: normalizarEstadoVerificacion garantiza mínimo privilegio retornando pendiente por defecto', () => {
    assert.equal(normalizarEstadoVerificacion('verificado'), 'verificado');
    assert.equal(normalizarEstadoVerificacion(' VERIFICADO '), 'verificado');
    assert.equal(normalizarEstadoVerificacion('suspendido'), 'suspendido');
    assert.equal(normalizarEstadoVerificacion('aprobado'), 'pendiente');
    assert.equal(normalizarEstadoVerificacion(''), 'pendiente');
    assert.equal(normalizarEstadoVerificacion(null), 'pendiente');
    assert.equal(normalizarEstadoVerificacion(undefined), 'pendiente');
  });

  it('CU-003: validarFormularioAuthV5 valida límites exactos para estudiante adulto (3, 5, 7, 6 chars)', () => {
    const casoLimiteValido = validarFormularioAuthV5({
      modoAuth: 'registro',
      rolRegistro: 'estudiante',
      esMenorEdad: false,
      nombreCompleto: 'Ana',
      cedula: '12345',
      telefono: '0412000',
      email: 'test.adulto@example.org',
      password: '123456',
    });
    assert.equal(casoLimiteValido.esValido, true);
    assert.deepEqual(casoLimiteValido.errores, {});

    const casoInvalido = validarFormularioAuthV5({
      modoAuth: 'registro',
      rolRegistro: 'estudiante',
      esMenorEdad: false,
      nombreCompleto: 'An',
      cedula: '1234',
      telefono: '123456',
      email: 'correo-sin-arroba',
      password: '12345',
    });
    assert.equal(casoInvalido.esValido, false);
    assert.ok(casoInvalido.errores.nombreCompleto);
    assert.ok(casoInvalido.errores.cedula);
    assert.ok(casoInvalido.errores.telefono);
    assert.ok(casoInvalido.errores.email);
    assert.ok(casoInvalido.errores.password);
  });

  it('CU-004: validarFormularioAuthV5 exige representante legal cuando esMenorEdad=true (Cumplimiento LOPNNA)', () => {
    const sinRepresentante = validarFormularioAuthV5({
      modoAuth: 'registro',
      rolRegistro: 'estudiante',
      esMenorEdad: true,
      nombreCompleto: 'Mateo Menor Prueba',
      cedula: 'V-32000001',
      telefono: '04140001122',
      email: 'menor.sintetico@example.org',
      password: 'Password123!',
      nombreRepresentante: '',
      cedulaRepresentante: '',
    });
    assert.equal(sinRepresentante.esValido, false);
    assert.match(sinRepresentante.errores.nombreRepresentante, /representante legal/i);
    assert.match(sinRepresentante.errores.cedulaRepresentante, /representante legal/i);

    const conRepresentante = validarFormularioAuthV5({
      modoAuth: 'registro',
      rolRegistro: 'estudiante',
      esMenorEdad: true,
      nombreCompleto: 'Mateo Menor Prueba',
      cedula: 'V-32000001',
      telefono: '04140001122',
      email: 'menor.sintetico@example.org',
      password: 'Password123!',
      nombreRepresentante: 'Carolina Tutor Prueba',
      cedulaRepresentante: 'V-14000001',
    });
    assert.equal(conRepresentante.esValido, true);
    assert.deepEqual(conRepresentante.errores, {});
  });

  it('CU-005: validarFormularioAuthV5 exige área o cátedra cuando el rol es docente', () => {
    const docenteSinArea = validarFormularioAuthV5({
      modoAuth: 'registro',
      rolRegistro: 'docente',
      esMenorEdad: false,
      nombreCompleto: 'Mtro. Prueba',
      cedula: 'V-11000001',
      telefono: '04129998877',
      email: 'docente.test@example.org',
      password: 'Password123!',
      areaDocente: '   ',
    });
    assert.equal(docenteSinArea.esValido, false);
    assert.ok(docenteSinArea.errores.areaDocente);

    const docenteConArea = validarFormularioAuthV5({
      modoAuth: 'registro',
      rolRegistro: 'docente',
      esMenorEdad: false,
      nombreCompleto: 'Mtro. Prueba',
      cedula: 'V-11000001',
      telefono: '04129998877',
      email: 'docente.test@example.org',
      password: 'Password123!',
      areaDocente: AREAS_CATEDRAS_OFICIALES[0],
    });
    assert.equal(docenteConArea.esValido, true);
  });

  it('CU-006: actualizarEstadoVerificacion rechaza userId vacío con excepción explícita', async () => {
    await assert.rejects(
      () => actualizarEstadoVerificacion('', 'verificado'),
      /El identificador del usuario \(userId\) es obligatorio/
    );
  });

  it('CU-007: obtenerCatalogoDocentes filtra por área, modalidad y búsqueda parcial sin exponer datos privados', async () => {
    testDb.tables.perfiles_profesores = [];

    const porOboe = await obtenerCatalogoDocentes({ area: 'oboe' });
    assert.ok(porOboe.length >= 1);
    assert.ok(
      porOboe.every(
        (d) =>
          d.areaPrincipal === 'Oboe Sinfónico' ||
          d.areasCertificadas.includes('Oboe Sinfónico')
      )
    );

    const porOnline = await obtenerCatalogoDocentes({ modalidad: 'online_en_vivo' });
    assert.ok(porOnline.length >= 1);
    assert.ok(
      porOnline.every(
        (d) =>
          d.modalidades.includes('online_en_vivo') || d.modalidades.includes('hibrido')
      )
    );

    const inexistente = await obtenerCatalogoDocentes({ area: 'Trompeta Espacial 999' });
    assert.equal(inexistente.length, 0);
  });

  it('CU-008: obtenerDocentePorId lanza error cuando profesorId es vacío y retorna perfil cuando es válido', async () => {
    await assert.rejects(
      () => obtenerDocentePorId(''),
      /El identificador del profesor \(profesorId\) es obligatorio/
    );

    const docente = await obtenerDocentePorId('99999999-9999-9999-9999-999999999999');
    assert.equal(docente.nombre, 'Mtro. José Gregorio Sanabria');
    assert.equal(docente.areaPrincipal, 'Oboe Sinfónico');
    assert.equal(docente.verificado_fundaoboe, true);
  });

  it('CU-009: obtenerOCrearConversacion rechaza invocaciones sin alumnoId o profesorId', async () => {
    await assert.rejects(
      () => obtenerOCrearConversacion('', 'prof-01', 'Oboe Sinfónico'),
      /Se requieren alumnoId y profesorId para iniciar una conversación/
    );
    await assert.rejects(
      () => obtenerOCrearConversacion('alum-01', '', 'Oboe Sinfónico'),
      /Se requieren alumnoId y profesorId para iniciar una conversación/
    );
  });

  it('CU-010: enviarMensaje rechaza mensajes vacíos o solo espacios y recorta espacios externos', async () => {
    await assert.rejects(
      () => enviarMensaje('conv-01', 'usr-01', '    '),
      /La conversación, el remitente y el contenido del mensaje son obligatorios/
    );
    await assert.rejects(
      () => enviarMensaje('', 'usr-01', 'Hola'),
      /La conversación, el remitente y el contenido del mensaje son obligatorios/
    );

    const msg = await enviarMensaje(
      'conv-unit-01',
      'usr-unit-01',
      '  Hola maestro, consulto horario  ',
      'Alumno Test'
    );
    assert.equal(msg.contenido, 'Hola maestro, consulto horario');
    assert.equal(msg.leido, false);
  });

  it('CU-011: AREAS_CATEDRAS_OFICIALES y homologación de áreas musicales v5.0 cubren las 8 cátedras certificadas', async () => {
    assert.equal(AREAS_CATEDRAS_OFICIALES.length, 8);
    assert.deepEqual(AREAS_CATEDRAS_OFICIALES, [
      'Oboe Sinfónico',
      'Guitarra Clásica',
      'Cuatro Venezolano',
      'Fagot',
      'Violín',
      'Canto',
      'Armonía',
      'Lenguaje Musical',
    ]);

    testDb.tables.perfiles_profesores = [
      {
        id: 'prof-homolog-01',
        user_id: 'usr-homolog-01',
        bio: 'Docente de solfeo, canto vocal y cuatro.',
        instrumentos: ['solfeo', 'vocal', 'cuatro', 'armonia', 'violin'],
        modalidades: ['online'],
        verificado_fundaoboe: true,
        usuarios: { id: 'usr-homolog-01', nombre_completo: 'Prof. Homologación' },
      },
    ];

    const lista = await obtenerCatalogoDocentes();
    assert.equal(lista.length, 1);
    assert.deepEqual(lista[0].areasCertificadas, [
      'Lenguaje Musical',
      'Canto',
      'Cuatro Venezolano',
      'Armonía',
      'Violín',
    ]);
  });

  it('CU-012: sincronizarUsuarioEnCacheAdmin y obtenerUsuarioDeCacheAdmin normalizan estado y rol del usuario', () => {
    assert.equal(obtenerUsuarioDeCacheAdmin('id-inexistente-999'), undefined);

    sincronizarUsuarioEnCacheAdmin({
      id: 'usr-cache-test-01',
      email: 'cache.test@example.org',
      rol: 'profesor_docente',
      estado_verificacion: 'estado_invalido' as unknown as 'pendiente',
      cedula_identidad: 'V-20000111',
      nombre_completo: 'Docente Cache Test',
      telefono: '+58 412-0001122',
    });

    const recuperado = obtenerUsuarioDeCacheAdmin('usr-cache-test-01');
    assert.ok(recuperado);
    assert.equal(recuperado.rol_v5, 'docente');
    assert.equal(recuperado.estado_verificacion, 'pendiente');
  });

  it('CU-013: funciones de consulta y suscripción en chatService manejan identificadores vacíos sin fallar', async () => {
    const convsVacias = await listarConversacionesUsuario('');
    assert.deepEqual(convsVacias, []);

    const msgsVacios = await obtenerMensajes('');
    assert.deepEqual(msgsVacios, []);

    const unsub = suscribirMensajesConversacion('', () => {});
    assert.equal(typeof unsub, 'function');
    unsub();
  });
});

describe('2. PRUEBAS DE INTEGRACIÓN — ATRIL v5.0 (CI-001 a CI-007)', () => {
  beforeEach(() => {
    testDb.reset();
  });

  afterEach(() => {
    testDb.reset();
  });

  it('CI-001: registrarUsuarioUnificado persiste estudiante adulto en Auth y public.usuarios en estado pendiente', async () => {
    const perfil = await registrarUsuarioUnificado({
      nombreCompleto: 'Luis Estudiante Prueba',
      cedula: 'V-90000001',
      telefono: '+58 412-0000001',
      email: 'luis.adulto.test@example.org',
      password: 'TestPassword123!',
      rol: 'estudiante',
      esMenor: false,
    });

    assert.equal(perfil.rol_v5, 'estudiante');
    assert.equal(perfil.tipo_estudiante, 'estudiante_adulto');
    assert.equal(perfil.es_menor, false);
    assert.equal(perfil.estado_verificacion, 'pendiente');

    const filaBd = testDb.tables.usuarios.find((u) => u.id === perfil.id);
    assert.ok(filaBd, 'El usuario debe existir en la tabla public.usuarios');
    assert.equal(filaBd.email, 'luis.adulto.test@example.org');
    assert.equal(filaBd.estado_verificacion, 'pendiente');
  });

  it('CI-002: signUpStudent / registrarUsuarioUnificado persiste estudiante menor con representante legal (LOPNNA)', async () => {
    const perfilMenor = await signUpStudent({
      email: 'sofia.menor.test@example.org',
      password: 'TestPassword123!',
      nombreCompleto: 'Sofía Menor Prueba',
      tipoEstudiante: 'apoderado',
      cedula: 'V-90000002',
      telefono: '+58 414-0000002',
      esMenor: true,
      nombreRepresentante: 'Elena Tutor Prueba',
      cedulaRepresentante: 'V-10000002',
    });

    assert.equal(perfilMenor.rol_v5, 'estudiante');
    assert.equal(perfilMenor.tipo_estudiante, 'apoderado');
    assert.equal(perfilMenor.es_menor, true);
    assert.equal(perfilMenor.nombre_representante, 'Elena Tutor Prueba');
    assert.equal(perfilMenor.cedula_representante, 'V-10000002');
    assert.equal(perfilMenor.estado_verificacion, 'pendiente');

    const sesionActual = await getCurrentSessionUser();
    assert.ok(sesionActual);
    assert.equal(sesionActual.id, perfilMenor.id);
    assert.equal(sesionActual.es_menor, true);
    assert.equal(sesionActual.nombre_representante, 'Elena Tutor Prueba');
  });

  it('CI-003: iniciarSesionUnificado autentica credenciales válidas, rechaza inválidas y limpia sesión en signOut', async () => {
    await registrarUsuarioConRol({
      email: 'docente.login.test@example.org',
      password: 'CorrectPassword123!',
      rol: 'profesor_docente',
      cedula_identidad: 'V-12000001',
      nombre_completo: 'Prof. Prueba Login',
      telefono: '+58 424-0000003',
    });
    await signOut();

    await assert.rejects(
      () => iniciarSesionUnificado('docente.login.test@example.org', 'ClaveErronea999!'),
      /Invalid login credentials|incorrectos/i
    );

    const sesionValida = await signInStudent(
      'docente.login.test@example.org',
      'CorrectPassword123!'
    );
    assert.equal(sesionValida.rol_v5, 'docente');
    assert.equal(sesionValida.estado_verificacion, 'pendiente');

    const porWrapper = await iniciarSesionConRol(
      'docente.login.test@example.org',
      'CorrectPassword123!'
    );
    assert.equal(porWrapper.email, 'docente.login.test@example.org');

    await signOut();
    const postLogout = await getCurrentSessionUser();
    assert.equal(postLogout, null);
  });

  it('CI-004: aprobarUsuario y suspenderUsuario actualizan public.usuarios y filtran en listarUsuariosVerificacion', async () => {
    const creado = await registrarUsuarioUnificado({
      nombreCompleto: 'Postulante Oboe Test',
      cedula: 'V-15000099',
      telefono: '+58 412-5559999',
      email: 'postulante.oboe@example.org',
      password: 'TestPassword123!',
      rol: 'docente',
      areaDocente: 'Oboe Sinfónico',
    });

    const pendientes = await listarUsuariosVerificacion('pendiente');
    assert.ok(pendientes.some((u) => u.id === creado.id));

    const aprobado = await aprobarUsuario(creado.id);
    assert.equal(aprobado.estado_verificacion, 'verificado');

    const verificados = await listarUsuariosVerificacion('verificado');
    assert.ok(verificados.some((u) => u.id === creado.id));

    const suspendido = await suspenderUsuario(creado.id);
    assert.equal(suspendido.estado_verificacion, 'suspendido');

    const listaSuspendidos = await listarUsuariosVerificacion('suspendido');
    assert.ok(listaSuspendidos.some((u) => u.id === creado.id));
    assert.equal(obtenerUsuarioDeCacheAdmin(creado.id)?.estado_verificacion, 'suspendido');
  });

  it('CI-005: obtenerCatalogoDocentes filtra docentes no verificados y oculta email, teléfono y cédula', async () => {
    const catalogo = await obtenerCatalogoDocentes();
    assert.ok(catalogo.length >= 1);
    assert.ok(catalogo.every((d) => d.verificado_fundaoboe === true));
    assert.ok(!catalogo.some((d) => d.nombre === 'Prof. No Verificado'));

    for (const item of catalogo) {
      const keys = Object.keys(item);
      assert.ok(!keys.includes('email'), 'No debe exponer email privado del docente');
      assert.ok(!keys.includes('telefono'), 'No debe exponer teléfono privado del docente');
      assert.ok(!keys.includes('cedula_identidad'), 'No debe exponer cédula del docente');
    }
  });

  it('CI-006: obtenerOCrearConversacion es idempotente y respeta UNIQUE(alumno_id, profesor_id)', async () => {
    const conv1 = await obtenerOCrearConversacion(
      'alumno-test-01',
      '99999999-9999-9999-9999-999999999999',
      'Oboe Sinfónico',
      {
        nombreAlumno: 'Alumno Verificado Test',
        nombreProfesor: 'Mtro. José Gregorio Sanabria',
      }
    );

    const conv2 = await obtenerOCrearConversacion(
      'alumno-test-01',
      '99999999-9999-9999-9999-999999999999',
      'Oboe Sinfónico'
    );

    assert.equal(conv1.id, conv2.id);

    const conversacionesAlumno = await listarConversacionesUsuario('alumno-test-01');
    assert.equal(
      conversacionesAlumno.filter(
        (c) =>
          c.alumno_id === 'alumno-test-01' &&
          c.profesor_id === '99999999-9999-9999-9999-999999999999'
      ).length,
      1
    );
  });

  it('CI-007: enviarMensaje, obtenerMensajes y suscribirMensajesConversacion sincronizan historial cronológico', async () => {
    const conv = await obtenerOCrearConversacion(
      'alumno-chat-02',
      'profesor-chat-02',
      'Fagot',
      { nombreAlumno: 'Estudiante Fagot', nombreProfesor: 'Prof. Valentina Meneses' }
    );

    const recibidosRealtime: string[] = [];
    const unsubscribe = suscribirMensajesConversacion(conv.id, (msg) => {
      recibidosRealtime.push(msg.contenido);
    });

    await enviarMensaje(
      conv.id,
      'alumno-chat-02',
      'Buenas tardes profesora, consulto disponibilidad para Fagot.',
      'Estudiante Fagot'
    );
    await enviarMensaje(
      conv.id,
      'profesor-chat-02',
      'Hola, tenemos cupo el viernes a las 2:00 PM.',
      'Prof. Valentina Meneses'
    );

    const historial = await obtenerMensajes(conv.id);
    assert.equal(historial.length, 2);
    assert.equal(
      historial[0].contenido,
      'Buenas tardes profesora, consulto disponibilidad para Fagot.'
    );
    assert.equal(
      historial[1].contenido,
      'Hola, tenemos cupo el viernes a las 2:00 PM.'
    );
    assert.equal(recibidosRealtime.length, 2);

    unsubscribe();
  });
});

describe('3. PRUEBAS END-TO-END DE FLUJOS CRÍTICOS DEL MVP v5.0 (E2E-001 y E2E-002)', () => {
  beforeEach(() => {
    testDb.reset();
  });

  it('E2E-001: Flujo Crítico 1 — Registro de menor (LOPNNA) -> Bloqueo por verificación externa por correo -> Aprobación Admin -> Acceso habilitado', async () => {
    const intentoSinTutor = validarFormularioAuthV5({
      modoAuth: 'registro',
      rolRegistro: 'estudiante',
      esMenorEdad: true,
      nombreCompleto: 'Mateo E2E Menor',
      cedula: 'V-33111222',
      telefono: '+58 412-1112233',
      email: 'mateo.e2e@example.org',
      password: 'AtrilTest2026!',
      nombreRepresentante: '',
      cedulaRepresentante: '',
    });
    assert.equal(intentoSinTutor.esValido, false);

    const validacionConTutor = validarFormularioAuthV5({
      modoAuth: 'registro',
      rolRegistro: 'estudiante',
      esMenorEdad: true,
      nombreCompleto: 'Mateo E2E Menor',
      cedula: 'V-33111222',
      telefono: '+58 412-1112233',
      email: 'mateo.e2e@example.org',
      password: 'AtrilTest2026!',
      nombreRepresentante: 'Laura Tutor E2E',
      cedulaRepresentante: 'V-15111222',
    });
    assert.equal(validacionConTutor.esValido, true);

    const usuarioRegistrado = await registrarUsuarioUnificado({
      nombreCompleto: 'Mateo E2E Menor',
      cedula: 'V-33111222',
      telefono: '+58 412-1112233',
      email: 'mateo.e2e@example.org',
      password: 'AtrilTest2026!',
      rol: 'estudiante',
      esMenor: true,
      nombreRepresentante: 'Laura Tutor E2E',
      cedulaRepresentante: 'V-15111222',
    });

    const bloqueadoEnPending =
      usuarioRegistrado.rol_v5 !== 'admin' &&
      usuarioRegistrado.estado_verificacion !== 'verificado';
    assert.equal(
      bloqueadoEnPending,
      true,
      'El usuario recién registrado debe quedar retenido en PendingVerificationScreen'
    );

    const listaPendientesAdmin = await listarUsuariosVerificacion('pendiente');
    assert.ok(listaPendientesAdmin.some((u) => u.id === usuarioRegistrado.id));

    await aprobarUsuario(usuarioRegistrado.id);

    const sesionActualizada = await iniciarSesionUnificado(
      'mateo.e2e@example.org',
      'AtrilTest2026!'
    );
    assert.equal(sesionActualizada.estado_verificacion, 'verificado');
    const sigueBloqueado =
      sesionActualizada.rol_v5 !== 'admin' &&
      sesionActualizada.estado_verificacion !== 'verificado';
    assert.equal(sigueBloqueado, false);

    const catalogoVisible = await obtenerCatalogoDocentes();
    assert.ok(catalogoVisible.length >= 1);
  });

  it('E2E-002: Flujo Crítico 2 — Estudiante verificado filtra cátedra -> Abre detalle sin datos privados -> Inicia chat -> Docente verificado recibe y responde', async () => {
    const estudiante = await registrarUsuarioUnificado({
      nombreCompleto: 'Samuel Estudiante E2E',
      cedula: 'V-26000111',
      telefono: '+58 412-0002222',
      email: 'samuel.e2e@example.org',
      password: 'AtrilTest2026!',
      rol: 'estudiante',
      esMenor: false,
    });
    await aprobarUsuario(estudiante.id);

    const resultadosBusqueda = await obtenerCatalogoDocentes({
      area: 'Oboe Sinfónico',
      modalidad: 'online_en_vivo',
    });
    assert.ok(resultadosBusqueda.length >= 1);
    const docenteElegido = resultadosBusqueda[0];

    const detalleDocente = await obtenerDocentePorId(docenteElegido.profesor_id);
    assert.equal(detalleDocente.verificado_fundaoboe, true);
    assert.equal('email' in detalleDocente, false);
    assert.equal('telefono' in detalleDocente, false);

    const conversacion = await obtenerOCrearConversacion(
      estudiante.id,
      detalleDocente.profesor_id,
      detalleDocente.areaPrincipal,
      {
        nombreAlumno: estudiante.nombre_completo,
        nombreProfesor: detalleDocente.nombre,
      }
    );

    await enviarMensaje(
      conversacion.id,
      estudiante.id,
      'Hola maestro, deseo coordinar mi horario de Oboe Sinfónico.',
      estudiante.nombre_completo
    );

    const bandejaDocente = await listarConversacionesUsuario(detalleDocente.profesor_id);
    const convEnBandeja = bandejaDocente.find((c) => c.id === conversacion.id);
    assert.ok(convEnBandeja, 'La conversación debe aparecer en la bandeja del docente');
    assert.equal(
      convEnBandeja.ultimo_mensaje,
      'Hola maestro, deseo coordinar mi horario de Oboe Sinfónico.'
    );

    await enviarMensaje(
      conversacion.id,
      detalleDocente.profesor_id,
      'Bienvenido Samuel, nos vemos el jueves a las 4:00 PM en el aula virtual.',
      detalleDocente.nombre
    );

    const mensajesFinales = await obtenerMensajes(conversacion.id);
    assert.equal(mensajesFinales.length, 2);
    assert.equal(mensajesFinales[0].remitente_id, estudiante.id);
    assert.equal(mensajesFinales[1].remitente_id, detalleDocente.profesor_id);
  });
});
