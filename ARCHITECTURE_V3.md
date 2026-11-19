# ARCHITECTURE_V3.md — Documento Técnico de Contexto (ATRIL v3.0)

> **Propósito de este documento:** Servir como fuente de verdad técnica (100% fiel al código fuente actual de la versión 3.0 de `atril-app`) para que otra IA Arquitecta compare y diseñe las evoluciones de **UI/UX (v4.0)** y **Reglas de Negocio (v5.0)**.

---

## 1. Stack Técnico y Dependencias Clave

Datos extraídos directamente de `package.json`, `app.json`, `tsconfig.json` y `metro.config.js`:

| Categoría | Tecnología / Paquete | Versión Exacta | Observaciones Arquitectónicas |
| :--- | :--- | :--- | :--- |
| **Framework Base** | `expo` | `~58.0.22` | Configurado en modo portrait, tema claro (`"userInterfaceStyle": "light"`), entry point en `index.ts` (`registerRootComponent(App)`). |
| **Core UI** | `react` / `react-dom` | `19.3.0` | React 19 sobre arquitectura móvil y web. |
| **Runtime Nativo** | `react-native` | `0.88.1` | Incluye soporte web mediante `react-native-web` (`^0.21.4`). |
| **Lenguaje y Tipado** | `typescript` | `~6.0.3` | `@types/react`: `~19.3.0`. `tsconfig.json` extiende `expo/tsconfig.base` con `"strict": true`. |
| **Navegación** | **Ninguna librería externa** | N/A | **No están instalados `expo-router` ni `@react-navigation/*`**. Toda la navegación es controlada por estado (`useState`) en `App.tsx` y un componente propio `BottomTabBar.tsx`. |
| **Manejo de Estilos** | `StyleSheet` (`react-native`) | Nativo | **No usa NativeWind, Tailwind ni Styled Components**. Cada pantalla define sus propios estilos y constantes de color al final del archivo. |
| **Manejo de Estado** | React `useState` + Custom Hooks + `Map` en memoria | Nativo | Estado global levantado en `App.tsx`, hooks `useParentProfiles` y `useEscrow`, y cachés `Map` a nivel de módulo (`CACHE_HIJOS_POR_TUTOR`, `SESIONES_MEMORIA_CACHE`). No usa Context API, Zustand ni Redux. |
| **Persistencia Local** | `@react-native-async-storage/async-storage` | `2.2.0` | Utilizado por el cliente de Supabase Auth para persistir el JWT y la sesión del usuario. |
| **Backend / BaaS** | `@supabase/supabase-js` | `^2.118.0` | Acompañado de `react-native-url-polyfill` (`^4.0.0`). |
| **Gráficos / Iconos** | `react-native-svg` + Emojis Unicode | `15.16.0` | `react-native-svg-transformer` (`^1.5.3`) configurado en `metro.config.js` y tipado en `src/types/svg.d.ts`, aunque la UI actual v3.0 renderiza emojis nativos (`🎼`, `🏠`, `🔍`, `💳`, `👤`, `🔒`, `🔑`, `🎻`, `⚡`). |
| **Status Bar** | `expo-status-bar` | `~58.0.4` | Configurado en `<StatusBar style="dark" />`. |

---

## 2. Árbol de Directorios

Mapa del repositorio excluyendo carpetas autogeneradas (`node_modules`, `.expo`, `.git`, `assets` binarios):

```text
atril-app/
├── App.tsx                                         # Orquestador raíz: máquina de estados de navegación por rol, tabs, flujo de reserva en 3 pasos y vista inline del Portal Docente.
├── index.ts                                        # Punto de entrada de Expo que registra el componente raíz App.
├── app.json                                        # Manifiesto de configuración de Expo (nombre, orientación portrait, iconos, estilo light).
├── package.json                                    # Declaración de dependencias (Expo 58, RN 0.88, React 19, Supabase 2.118) y scripts.
├── tsconfig.json                                   # Configuración de TypeScript con modo estricto (strict: true).
├── metro.config.js                                 # Configuración de Metro Bundler para transformar archivos .svg mediante react-native-svg-transformer.
├── README.md                                       # Documentación general del modelo de negocio (Custodia Escrow) y guía de operación v3.0.
├── supabase/
│   └── migrations/
│       └── 20261102_escrow_lifecycle_rpc.sql       # Migración PostgreSQL: tipos ENUM (modalidad_clase, estado_sesion), columnas en sesiones_clase y funciones RPC transaccionales ACID.
└── src/
    ├── components/
    │   ├── BottomTabBar.tsx                        # Barra de navegación inferior ergonómica con 2 variantes: 'student' (5 tabs) y 'teacher' (5 tabs).
    │   └── SupabaseStatusBadge.tsx                 # Chip interactivo que ejecuta un ping HEAD a public.usuarios y muestra estado HTTP 200 y latencia en ms.
    ├── hooks/
    │   ├── useEscrow.ts                            # Hook envoltorio para reservar en Escrow, consultar billeteras (tutor/profesor) y actualizar enlace Zoom (actualmente no importado en vistas).
    │   └── useParentProfiles.ts                    # Hook para listar, registrar y alternar hijos representados (4-17 años) con caché en memoria por tutorId.
    ├── lib/
    │   └── supabase.ts                             # Inicialización del cliente Supabase con AsyncStorage, autoRefreshToken y variables EXPO_PUBLIC_SUPABASE_*.
    ├── screens/
    │   ├── RoleSelectionScreen.tsx                 # Pantalla inicial (R0): selector de perfil entre Alumno/Apoderado, Profesor/Maestro y Visitante Restringido.
    │   ├── StudentAuthScreen.tsx                   # Pantalla de Login y Registro en Supabase Auth con selector de titularidad: Padre/Representante (A1) vs Estudiante Adulto (A0).
    │   ├── StudentHomeScreen.tsx                   # Tab 'inicio' del estudiante: banner de custodia fiduciaria, código de 6 dígitos, enlace Zoom condicional y botones de confirmación/contingencia.
    │   ├── StudentCatalogScreen.tsx                # Tab 'buscar' y vista Visitante (V0): catálogo filtrable de docentes, gestión rápida de hijos (A1), banner Promo 2x1 y bloqueo con candado en modo V0.
    │   ├── StudentClassesScreen.tsx                # Tab 'mis_clases': listado de clases agendadas en la sesión con objetivo, modalidad, código de 6 dígitos y acciones sobre la reserva más reciente.
    │   ├── StudentWalletScreen.tsx                 # Tab 'billetera': tarjeta de saldo disponible (con botón de recarga demo +$50), saldo congelado en Escrow, liberado a docentes e historial.
    │   ├── StudentProfileScreen.tsx                # Tab 'perfil': ficha del titular autenticado, CRUD/selección de hijos (exclusivo A1) y cierre de sesión.
    │   ├── TeacherProfileScheduleScreen.tsx        # Paso 1 de 3 del flujo de reserva: resumen del docente, selector de hijo (A1), selector de modalidad, día y parrilla de 4 bloques horarios.
    │   ├── BookingConfirmationScreen.tsx           # Paso 2 de 3 del flujo de reserva: input de objetivo académico, selector de paquete (1, 6 u 8 clases), desglose contable y checkbox regla 24h.
    │   ├── BookingSuccessEscrowScreen.tsx          # Paso 3 de 3 del flujo de reserva: comprobante de bloqueo fiduciario Escrow, código de 6 dígitos generado y botón de recordatorio en calendario.
    │   └── ClassBookingScreen.tsx                  # [LEGACY / NO IMPORTADO] Pantalla monolítica anterior (A2) de reserva; reemplazada en App.tsx por el flujo de 3 pasos.
    ├── services/
    │   ├── authService.ts                          # Servicio de autenticación contra Supabase Auth (signUpStudent, signInStudent, getCurrentSessionUser, signOut) y upsert en public.usuarios.
    │   ├── teacherCatalogService.ts                # Consulta de catálogo docente en public.perfiles_profesores + usuarios, fallback de 3 docentes curados y cálculo de opciones de contratación.
    │   ├── parentService.ts                        # Consultas y creación de subperfiles de menores (4 a 17 años) en public.subperfiles_alumnos.
    │   ├── escrowService.ts                        # Lógica fiduciaria: introspección OpenAPI de enums, llamada a rpc_bloquear_fondos_escrow, regla de 15 min de Zoom, resumen de billeteras y caché de sesiones.
    │   └── attendanceService.ts                    # Ciclo de vida de la clase: validación del código de 6 dígitos, declaración docente, rpc_confirmar_asistencia_y_liberar, contingencia eléctrica y reembolso.
    ├── types/
    │   ├── atril.types.ts                          # Definiciones de tipos de dominio, estados de sesión/Escrow, filas de BD, contratos de RPC y resúmenes de billetera.
    │   └── svg.d.ts                                # Declaración de módulo TypeScript para importar archivos *.svg como componentes React.
    └── utils/
        └── escrowCalculator.ts                     # Motor matemático puro con redondeo IEEE 754 a 2 decimales, reparto 85%/15% y descuentos de abonos de 6 (-10%) y 8 (-12%) clases.
```

---

## 3. Mapa de Navegación y Pantallas (Crítico para comparar con UI v4.0)

### 3.1 Mecanismo de Navegación Actual (v3.0)
No existen rutas URL ni pilas de navegación (`Stack` / `Tabs` de React Navigation). El archivo `App.tsx` actúa como enrutador central evaluando variables de estado en este orden estricto:
1. Si `selectedRole === null` $\rightarrow$ Renderiza `<RoleSelectionScreen />`.
2. Si `selectedRole === 'ALUMNO' && requiereAuthEstudiante && !usuarioEstudiante` $\rightarrow$ Renderiza `<StudentAuthScreen />`.
3. Si hay un rol activo (`'ALUMNO' | 'DOCENTE' | 'VISITANTE'`), renderiza un contenedor global `<SafeAreaView>` con:
   - **Barra Superior Institucional fija** (muestra un badge con el rol activo: `'REPRESENTANTE / APODERADO (A1)'`, `'ESTUDIANTE MAYOR DE EDAD (A0)'`, `'PORTAL DEL MAESTRO'` o `'VITRINA PÚBLICA (V0)'` y el botón `⇄ Cambiar perfil` que resetea `selectedRole` a `null`).
   - **Cuerpo condicional según `selectedRole`**:
     - Si `selectedRole === 'ALUMNO'`:
       - Si `docenteEnReserva !== null`: renderiza el **Asistente de Reserva en 3 Pasos** según `pasoReserva` (`1 | 2 | 3`).
       - Si `docenteEnReserva === null`: renderiza la pantalla correspondiente a `studentTab` (`'inicio' | 'buscar' | 'mis_clases' | 'billetera' | 'perfil'`).
     - Si `selectedRole === 'DOCENTE'`: renderiza **inline en `App.tsx`** la interfaz del Portal del Maestro.
     - Si `selectedRole === 'VISITANTE'`: renderiza `<StudentCatalogScreen isVisitorMode />`.
   - **Barra Inferior (`BottomTabBar`)**: visible cuando `selectedRole === 'ALUMNO'` (`variant="student"`) o `selectedRole === 'DOCENTE'` (`variant="teacher"`). No se muestra en modo `'VISITANTE'`.

---

### 3.2 Detalle Exhaustivo por Pantalla / Vista

#### A. Flujo de Entrada y Autenticación

##### 1. Pantalla de Selección de Rol (Puerta R0)
- **Ruta / Condición de estado:** `!selectedRole`
- **Archivo exacto:** `src/screens/RoleSelectionScreen.tsx`
- **Roles con acceso:** Público / No autenticado.
- **Qué muestra actualmente:**
  - Encabezado de marca con logo `🎼`, título `ATRIL` y badge `MERCADO MUSICAL TUTELADO`.
  - Título `¿Cómo deseas ingresar?`.
  - **Tarjeta 1 (`ROL ALUMNO / APODERADO`):** *"Quiero aprender música"*, píldora legal *"Menores de edad: Registran sus padres"* y botón `Elegir →`.
  - **Tarjeta 2 (`ROL PROFESOR / MAESTRO`):** *"Soy maestro de música"*, recuadro *"Requiere CV, Títulos + Entrevista FundaOboeHJK"* y botón `Elegir →`.
  - **Tarjeta 3 (Borde punteado - Modo Visitante):** *"Explorar catálogo en modo público"*, advertencia en rojo *"Sin cuenta no podrás ver perfiles de docentes ni reservar clases"* y botón `Continuar como visitante restringido →`.
  - Pie institucional (*"FundaOboeHJK & USB — Caracas, 2026"*) y el componente `<SupabaseStatusBadge />`.
- **Qué acciones ejecuta:**
  - Al pulsar `ALUMNO`: invoca `handleSelectRoleFromR0('ALUMNO')` en `App.tsx`, que verifica `getCurrentSessionUser()`. Si hay sesión guardada en Supabase Auth, entra directo al tab `'inicio'`; si no, activa `requiereAuthEstudiante = true` y muestra `StudentAuthScreen`.
  - Al pulsar `DOCENTE`: cambia `selectedRole = 'DOCENTE'` directamente (sin pantalla de login).
  - Al pulsar `VISITANTE`: cambia `selectedRole = 'VISITANTE'` directamente.
  - Al pulsar `<SupabaseStatusBadge />`: ejecuta un query `HEAD` a `public.usuarios` en Supabase para comprobar conectividad y latencia.

##### 2. Pantalla de Autenticación de Estudiante y Representante
- **Ruta / Condición de estado:** `selectedRole === 'ALUMNO' && requiereAuthEstudiante && !usuarioEstudiante`
- **Archivo exacto:** `src/screens/StudentAuthScreen.tsx` (Nota: el comentario en la línea 1 dice `// src/screens/auth/StudentAuthScreen.tsx`, pero su ubicación real es `src/screens/StudentAuthScreen.tsx`).
- **Roles con acceso:** Estudiantes Adultos (`A0`) y Padres/Representantes (`A1`).
- **Qué muestra actualmente:**
  - Barra superior con botón `← Volver a Perfiles` y badge verde `SUPABASE AUTH`.
  - Conmutador segmentado (tabs internos): `[ Iniciar Sesión ]` | `[ Crear Cuenta ]`.
  - **En modo `registro` (`Crear Cuenta`):**
    - Selector de modalidad de titularidad con radio buttons:
      - `👨‍👧 Soy Padre / Representante` (`tipoEstudiante = 'apoderado'`)
      - `🎓 Soy Estudiante Mayor de Edad` (`tipoEstudiante = 'estudiante_adulto'`)
    - Input `Nombre y Apellido` (mínimo 3 caracteres).
    - Input `Cédula / Documento de Identidad` (mínimo 5 caracteres, ej. `V-18452910`).
  - **En ambos modos (`login` y `registro`):**
    - Input `Correo Institucional / Personal` (validado con regex).
    - Input `Contraseña` (mínimo 6 caracteres) con botón toggle `Ver` / `Ocultar`.
    - Banner de error general en línea si falla Supabase Auth.
    - Botón primario dinámico: `Iniciar Sesión en ATRIL →`, `Crear Cuenta de Representante (A1) →` o `Crear Cuenta de Estudiante Adulto (A0) →`.
- **Qué acciones ejecuta:**
  - `modo === 'login'` $\rightarrow$ Llama a `signInStudent(email, password)` en `src/services/authService.ts` (`supabase.auth.signInWithPassword` + lectura de `public.usuarios`).
  - `modo === 'registro'` $\rightarrow$ Llama a `signUpStudent(...)` en `src/services/authService.ts` (`supabase.auth.signUp` con `user_metadata` + `upsert` en `public.usuarios`).
  - Al completarse con éxito, dispara `onAuthSuccess(perfil)`, guardando `usuarioEstudiante` en `App.tsx` y redirigiendo a `studentTab = 'inicio'`.

---

#### B. Flujo Estudiante (`A0` Adulto) y Representante (`A1` Apoderado) — 5 Pestañas Principales

##### 3. Tab 1: Inicio del Estudiante (`StudentHomeScreen`)
- **Ruta / Condición de estado:** `selectedRole === 'ALUMNO' && !docenteEnReserva && studentTab === 'inicio'`
- **Archivo exacto:** `src/screens/StudentHomeScreen.tsx`
- **Roles con acceso:** `ALUMNO` autenticado (`A0` Estudiante Adulto o `A1` Padre/Representante).
- **Qué muestra actualmente:**
  - Saludo personalizado con etiqueta superior según rol (`PORTAL DEL PADRE / REPRESENTANTE (A1)` o `PORTAL DEL ESTUDIANTE ADULTO (A0)`) y `Hola, {nombreUsuario}`.
  - **Banner Azul Marino (`🛡️ CUSTODIA FIDUCIARIA ATRIL`):** muestra ID corto de reserva activa (`#XXXXXXXX` o `Ninguna`), Estado académico (`estadoSesion`), Garantía Escrow (`estadoEscrow`), Monto protegido en USD, Código de validación de 6 dígitos y píldora de último comprobante (`comprobanteReciente`).
  - **Tarjeta condicional de Sesión Actual:**
    - Si `sesionActiva !== null`: muestra caja de seguridad Zoom con el código de 6 dígitos y el enlace Zoom (o el texto *"Oculto por seguridad (se habilita 15 min antes de la clase)"* si `enlaceZoomVisible` es `null`), botón verde `✓ Confirmar Clase Recibida y Evaluar Docente` y botón ámbar `⚡ Reportar Falla de Luz/Internet y Reprogramar sin Cargo`.
    - Si `sesionActiva === null`: muestra mensaje de estado vacío y botón azul `🔍 Buscar Clase y Reservar →`.
  - **Grilla de 2 Accesos Rápidos:** tarjeta `🎼 Mis Clases` y tarjeta `💳 Mi Billetera`.
- **Qué acciones ejecuta:**
  - `onGoToSearch` $\rightarrow$ Cambia a `studentTab = 'buscar'`.
  - `onGoToClasses` $\rightarrow$ Cambia a `studentTab = 'mis_clases'`.
  - `onGoToWallet` $\rightarrow$ Cambia a `studentTab = 'billetera'`.
  - `onConfirmAttendance` $\rightarrow$ Ejecuta `handleConfirmarYLiberarEscrow()` en `App.tsx`, que invoca `responderEncuestaYConfirmar(sesionActiva.id, tutorIdActivo, 5)` en `attendanceService.ts` (calificación fija de 5 estrellas).
  - `onReportContingency` $\rightarrow$ Ejecuta `handleReprogramarContingencia()` en `App.tsx`, que invoca `solicitarReprogramacionContingencia(sesionActiva.id, motivoContingencia)` en `attendanceService.ts`.

##### 4. Tab 2: Catálogo de Maestros (`StudentCatalogScreen` — Modo Autenticado)
- **Ruta / Condición de estado:** `selectedRole === 'ALUMNO' && !docenteEnReserva && studentTab === 'buscar'`
- **Archivo exacto:** `src/screens/StudentCatalogScreen.tsx`
- **Roles con acceso:** `ALUMNO` (`A0_ADULTO` o `A1_REPRESENTANTE`).
- **Qué muestra actualmente:**
  - **Cabecera dinámica según sub-rol:**
    - Si `A0_ADULTO`: avatar circular con iniciales, etiqueta `ESTUDIANTE MAYOR DE EDAD (A0)`, nombre del usuario y botón de campana `🔔` (muestra alerta informativa sobre Plan 2x1 y Escrow).
    - Si `A1_REPRESENTANTE`: etiqueta `PADRE / REPRESENTANTE (A1)`, nombre del titular y a la derecha una píldora interactiva `Hijo: {nombreCortoHijo} ▾` (para rotar entre hijos registrados) o botón `＋ Registrar Hijo` si no tiene ninguno.
  - **Formulario desplegable de Registro Rápido de Hijo (solo `A1_REPRESENTANTE`):** visible si no hay hijos o si el padre abre el formulario. Contiene inputs de `Nombre y Apellido del menor`, `Edad (4-17)` e `Instrumento`, más botón verde `Guardar Hijo Representado →`.
  - **Buscador y Filtros:** barra de búsqueda por texto (`busquedaInstrumento`) con botón `✕` para limpiar, y 3 chips de filtro de modalidad: `Todos`, `Presencial Caracas`, `Online En Vivo`.
  - **Banner Promocional (`PROMO COLABORATIVA`):** *"Plan Formativo 2x1 Amigo — Inscribe a un segundo alumno en horario grupal con 50% de descuento"* con insignia dorada `50% 2DO CUPO AMIGO` (informativo/visual, sin acción al pulsar).
  - **Listado de Maestros Certificados:** tarjetas con avatar de iniciales, nombre del docente, badge verde `✓ FUNDAOBOE`, cátedra principal y `nivel_docente`, modalidades disponibles, biografía (2 líneas), tarifa por hora (`$XX/h Clase suelta`), píldora ámbar `★ Abono: -10%` y botón azul `Ver Perfil y Horarios`.
  - **Tarjeta Contextual Inferior:**
    - Para `A0_ADULTO`: explica autonomía académica/financiera para mayores de 18 años.
    - Para `A1_REPRESENTANTE`: indica para qué hijo se está reservando actualmente y botones `⇄ Cambiar Hijo Activo` y `＋ Añadir Otro Hijo`.
- **Qué acciones ejecuta:**
  - Al montar y al cambiar filtros (`modalidadActiva`, `busquedaInstrumento`): llama a `obtenerCatalogoDocentes(filtros)` en `teacherCatalogService.ts`.
  - Si es `A1_REPRESENTANTE`: llama a `cargarSubperfiles(tutorId)` del hook `useParentProfiles`, permite crear un hijo vía `registrarNuevoHijo(...)` y rotar con `alternarHijoActivo()`.
  - Al pulsar `Ver Perfil y Horarios`: invoca `onSelectTeacher(docente, alumnoActivo)`, lo que en `App.tsx` asigna `docenteEnReserva = docente` y `pasoReserva = 1`, abriendo `TeacherProfileScheduleScreen`.

##### 5. Tab 3: Mis Clases Agendadas (`StudentClassesScreen`)
- **Ruta / Condición de estado:** `selectedRole === 'ALUMNO' && !docenteEnReserva && studentTab === 'mis_clases'`
- **Archivo exacto:** `src/screens/StudentClassesScreen.tsx`
- **Roles con acceso:** `ALUMNO` (`A0` y `A1`).
- **Qué muestra actualmente:**
  - Encabezado `AGENDA ACADÉMICA — Mis Clases Agendadas`.
  - Si `clasesAgendadas.length === 0`: tarjeta vacía `📅 Tu calendario está vacío` con botón `Agendar una Clase →`.
  - Si hay elementos en `clasesAgendadas` (estado local de `App.tsx` poblado al completar reservas en la sesión): lista de tarjetas con píldora de fecha/hora (`🗓️ {horarioEtiqueta}`), píldora verde `${monto_bruto} USD • ESCROW`, nombre del docente, plan contratado, nombre del alumno beneficiario, objetivo de la sesión, modalidad, estado actual, banner azul con el **Código de Sesión de 6 dígitos**, y en la reserva más reciente (`idx === 0`) los botones `✓ Confirmar Asistencia` y `⚡ Reprogramar (Falla)`.
- **Qué acciones ejecuta:**
  - `onGoToSearch` $\rightarrow$ Navega al tab `'buscar'`.
  - `onConfirmAttendance` $\rightarrow$ Ejecuta `handleConfirmarYLiberarEscrow()` en `App.tsx`.
  - `onReportContingency` $\rightarrow$ Ejecuta `handleReprogramarContingencia()` en `App.tsx`.

##### 6. Tab 4: Billetera Fiduciaria del Estudiante (`StudentWalletScreen`)
- **Ruta / Condición de estado:** `selectedRole === 'ALUMNO' && !docenteEnReserva && studentTab === 'billetera'`
- **Archivo exacto:** `src/screens/StudentWalletScreen.tsx`
- **Roles con acceso:** `ALUMNO` (`A0` y `A1`).
- **Qué muestra actualmente:**
  - Encabezado `BILLETERA FIDUCIARIA — Mi Saldo y Custodia Escrow`.
  - **Tarjeta Azul Marino de Saldos:**
    - `SALDO DISPONIBLE (PRUEBA)`: inicia en `$180.00 USD` (estado local `saldoDisponiblePrueba`) junto al botón `＋ Recargar $50`.
    - `CONGELADO EN ESCROW`: muestra `sesionActiva.monto_bruto` si `estado_escrow === 'bloqueado'`, o `$0.00 USD`.
    - `LIBERADO A DOCENTES`: muestra `sesionActiva.monto_bruto` si `estado_escrow === 'liberado'`, o `$0.00 USD`.
  - Tarjeta informativa `¿Cómo protege ATRIL tu dinero?` (Bloqueo Preventivo, Validación por Código, Garantía de Contingencia).
  - Tarjeta `Movimientos Recientes`: muestra el asiento de la `sesionActiva` (si existe) y un asiento fijo `Abono Inicial de Prueba ATRIL (+$180.00 USD)`.
- **Qué acciones ejecuta:**
  - Botón `＋ Recargar $50`: incrementa el estado local `saldoDisponiblePrueba` en `+$50.00` (no realiza llamada a Supabase).

##### 7. Tab 5: Perfil del Estudiante / Representante (`StudentProfileScreen`)
- **Ruta / Condición de estado:** `selectedRole === 'ALUMNO' && !docenteEnReserva && studentTab === 'perfil'`
- **Archivo exacto:** `src/screens/StudentProfileScreen.tsx`
- **Roles con acceso:** `ALUMNO` (`A0` y `A1`).
- **Qué muestra actualmente:**
  - Ficha de Datos del Titular: badge de rol (`👨‍👧 PADRE / REPRESENTANTE LEGAL (A1)` o `🎓 ESTUDIANTE MAYOR DE EDAD (A0)`), Nombre completo, Correo electrónico, Cédula/Documento y Modalidad de cuenta.
  - **Sección exclusiva si `esApoderado === true` (`Mis Hijos / Representados`):**
    - Lista de hijos registrados con botón para marcar uno como `✓ Activo` o `Elegir`.
    - Formulario `＋ Agregar Nuevo Hijo / Representado` con inputs de Nombre y Apellido, Edad (4-17) e Instrumento, y botón verde `Guardar Hijo en Mi Cuenta`.
  - Botón rojo de borde `Cerrar Sesión de Supabase Auth`.
- **Qué acciones ejecuta:**
  - Si `esApoderado`: carga subperfiles con `cargarSubperfiles(tutorId)`, selecciona hijo activo con `seleccionarHijoPorId(hijo.id)` y crea nuevos hijos con `registrarNuevoHijo(...)` del hook `useParentProfiles`.
  - `onLogout`: ejecuta `handleCerrarSesionEstudiante()` en `App.tsx`, que llama a `signOut()` en `authService.ts` y limpia todo el estado de navegación volviendo a `RoleSelectionScreen`.

---

#### C. Sub-Flujo Asistido de Reserva en 3 Pasos (Rol `ALUMNO` con `docenteEnReserva !== null`)

##### 8. Paso 1 de 3: Perfil del Docente y Selección de Horario (`TeacherProfileScheduleScreen`)
- **Ruta / Condición de estado:** `selectedRole === 'ALUMNO' && docenteEnReserva !== null && pasoReserva === 1`
- **Archivo exacto:** `src/screens/TeacherProfileScheduleScreen.tsx`
- **Roles con acceso:** `ALUMNO` (`A0` y `A1`).
- **Qué muestra actualmente:**
  - Cabecera con botón `←`, etiqueta `PASO 1 DE 3 • DATOS Y DISPONIBILIDAD` y título `Seleccionar Horario`.
  - Tarjeta Resumen del Docente: avatar con iniciales, nombre, badge `✓ FUNDAOBOE`, cátedra y nivel, rating `★ 4.9 (42 sesiones auditadas)` (hardcodeado en UI), tarifa base por hora y biografía.
  - Selector de `Alumno Representado` (chips horizontales visibles solo si `esApoderado && subperfiles.length > 0`).
  - **Sección 1. Modalidad de Impartición:** 2 botones toggle (`🎥 Online En Vivo` y `🏛️ Presencial`), deshabilitando automáticamente la opción que el docente no admita.
  - **Sección 2. Fecha y Bloque Horario Disponible:**
    - Selector horizontal de 4 días (`DIAS_AGENDA`: `HOY 04 Nov`, `JUE 05 Nov`, `VIE 06 Nov`, `SÁB 07 Nov`).
    - Parrilla 2x2 de 4 bloques horarios (`PARRILLA_HORAS`: `09:00 AM`, `11:00 AM`, `02:00 PM`, `04:00 PM`, cada uno de `60 min • Disponible`).
  - Barra inferior con botón `Continuar a Confirmación →` (deshabilitado hasta que se elija una hora en la parrilla).
- **Qué acciones ejecuta:**
  - Al montar: llama a `obtenerFichaDocente(profesorId)` en `teacherCatalogService.ts` y, si es apoderado, a `cargarSubperfiles(tutorId)`.
  - Al pulsar `←`: ejecuta `onBack()`, limpiando `docenteEnReserva = null` para volver al catálogo.
  - Al pulsar `Continuar a Confirmación →`: construye el objeto `Paso1SeleccionReserva` (ficha, modalidad, fechaEtiqueta, bloqueHorario ISO calculado y alumnoBeneficiario) y pasa a `pasoReserva = 2`.

##### 9. Paso 2 de 3: Paquete, Objetivo y Políticas 24h (`BookingConfirmationScreen`)
- **Ruta / Condición de estado:** `selectedRole === 'ALUMNO' && docenteEnReserva !== null && pasoReserva === 2 && seleccionPaso1 !== null`
- **Archivo exacto:** `src/screens/BookingConfirmationScreen.tsx`
- **Roles con acceso:** `ALUMNO` (`A0` y `A1`).
- **Qué muestra actualmente:**
  - Cabecera `PASO 2 DE 3 • PAQUETE Y REGLAS 24H — Confirmación y Custodia`.
  - Banner azul institucional `RESUMEN DE SELECCIÓN PREVIA` (Docente, Horario, Modalidad, Estudiante).
  - Tarjeta `Objetivo / Tema de la Sesión`: `TextInput` multilínea pre-rellenado con `"Revisión de concierto de Haydn, afinación y digitación"`.
  - Tarjeta `Selector de Contratación`: 3 tarjetas seleccionables generadas por `ficha.opcionesContratacion` (por defecto selecciona el Abono de 6 clases):
    1. `Clase Individual (60 min)` (0% descuento)
    2. `Abono 6 Clases (-10%)` con badge dorado `★ Más Popular`
    3. `Abono 8 Clases (-12%)` con badge verde `Descuento intensivo`
  - Tarjeta `Desglose Contable Fiduciario`: Subtotal Bruto, Ahorro por Abono, `Total a Bloquear en Escrow`.
  - **Checkbox obligatorio:** *"Acepto los Términos, Políticas de Cancelación (regla 24h) y Supervisión Docente"*.
  - Botones de acción: `← Cambiar Horario` y `Confirmar y Proceder al Pago` (deshabilitado si no se marca el checkbox).
- **Qué acciones ejecuta:**
  - `← Cambiar Horario` $\rightarrow$ Regresa a `pasoReserva = 1`.
  - `Confirmar y Proceder al Pago` $\rightarrow$ Invoca `bloquearFondosEscrow(...)` en `src/services/escrowService.ts` (que ejecuta la RPC `rpc_bloquear_fondos_escrow` en Supabase o genera sesión de respaldo en caché). Al terminar, dispara `handlePaso2SuccessEscrow` en `App.tsx`, actualizando `sesionActiva`, agregando la clase a `clasesAgendadas`, refrescando la billetera docente y avanzando a `pasoReserva = 3`.

##### 10. Paso 3 de 3: Comprobante de Custodia Escrow (`BookingSuccessEscrowScreen`)
- **Ruta / Condición de estado:** `selectedRole === 'ALUMNO' && docenteEnReserva !== null && pasoReserva === 3 && resultadoPaso3 !== null`
- **Archivo exacto:** `src/screens/BookingSuccessEscrowScreen.tsx`
- **Roles con acceso:** `ALUMNO` (`A0` y `A1`).
- **Qué muestra actualmente:**
  - Tarjeta verde `✓ Reserva Formalizada con Éxito` con número de folio (`#XXXXXXXX`) y título del plan contratado.
  - Tarjeta azul marino profundo (`#0A192F`) con badge ámbar `EN CUSTODIA FIDUCIARIA (ESCROW)`, `MONTO CONGELADO` en USD y leyenda fiduciaria.
  - Tarjeta `Cita Académica Agendada`: Docente, Estudiante, Modalidad, Fecha y Hora, Objetivo.
  - Caja destacada `CÓDIGO DE SESIÓN DE 6 DÍGITOS` con tipografía grande (`fontSize: 28`, `letterSpacing: 4`) mostrando `sesion.codigo_sesion`.
  - Botón primario `Ir a Mis Clases / Billetera` y botón secundario `🗓️ Agendar en Calendario` (cambia su etiqueta local a `✓ Recordatorio Añadido a tu Calendario` al pulsarlo).
- **Qué acciones ejecuta:**
  - `Ir a Mis Clases / Billetera` $\rightarrow$ Limpia `docenteEnReserva = null`, reinicia `pasoReserva = 1` y posiciona al usuario en `studentTab = 'mis_clases'`.

---

#### D. Flujo Visitante Restringido (`V0`)

##### 11. Vitrina Pública con Identidad Docente Bloqueada (`StudentCatalogScreen` en modo `isVisitorMode`)
- **Ruta / Condición de estado:** `selectedRole === 'VISITANTE'`
- **Archivo exacto:** `src/screens/StudentCatalogScreen.tsx` (rama `if (isVisitorMode)` en líneas 130-296).
- **Roles con acceso:** `VISITANTE` (público no autenticado).
- **Qué muestra actualmente:**
  - Cabecera con píldora ámbar `👁 MODO VISITANTE RESTRINGIDO` y botón `Registrarse`.
  - Buscador por instrumento y chips de filtro (`Todos`, `Presencial Caracas`, `Online En Vivo`).
  - Lista de tarjetas `lockedChairCard`: oculta el nombre real, biografía y tarifa del docente. En su lugar muestra un avatar con candado `🔒`, título genérico `Cátedra de {instrumentoPrincipal}`, subtítulo `Docente Titular FundaOboeHJK • Caracas / Online`, badge `✓ CATEDRA VERIFICADA` y un recuadro de bloqueo *"🔒 Perfil y contacto docente bloqueados"* con botón `Crear Cuenta para Desbloquear`.
  - Tarjeta informativa inferior `¿Por qué registrarse en Atril?`.
- **Qué acciones ejecuta:**
  - Pulsar `Registrarse` o `Crear Cuenta para Desbloquear` invoca `handleSelectRoleFromR0('ALUMNO')` en `App.tsx`, llevando al usuario a `StudentAuthScreen` (o a `StudentHomeScreen` si ya tenía sesión).

---

#### E. Flujo Portal del Maestro (`DOCENTE`)

##### 12. Portal del Maestro (Renderizado Inline en `App.tsx`)
- **Ruta / Condición de estado:** `selectedRole === 'DOCENTE'`
- **Archivo exacto:** `App.tsx` (líneas 532-628 y 653-659). **No tiene un archivo separado en `src/screens/`**.
- **Roles con acceso:** `DOCENTE` (acceso directo desde R0 sin pantalla de login).
- **Qué muestra actualmente:**
  - **Banner Azul Marino (`CUSTODIA FIDUCIARIA ATRIL`):** muestra Reserva activa (`#XXXXXXXX` o `Ninguna`), Estado académico (`estadoSesion`) y Garantía Escrow (`estadoEscrow`).
  - **Tarjeta `Billetera Docente (Liquidación a Fin de Mes)`:**
    - Recuadro ámbar `SALDO EN CUSTODIA`: `${saldoEnCustodiaDocente.toFixed(2)} USD` (*"Retenido por clases programadas o reprogramadas pendientes"*).
    - Recuadro verde `DISPONIBLE CORTE FIN DE MES`: `${saldoDisponibleCorteDocente.toFixed(2)} USD` (*"Honorarios netos (85%) validados para transferencia mensual"*).
  - **Tarjeta `Protocolo Pre-Clase Zoom y Contingencia`:**
    - Input `codigoInputDocente` (máx. 6 caracteres, mayúsculas) para ingresar el código dictado por el alumno.
    - Botón azul `🔑 Validar Código e Iniciar Sesión Formal`.
    - Botón verde `🎻 Registrar Clase Impartida`.
    - Input `motivoContingencia` (pre-rellenado con `"Interrupción eléctrica / caída de internet en zona residencial"`).
    - Botón ámbar `⚡ Declarar Contingencia (Fuerza Mayor) y Reprogramar`.
  - **Barra de navegación inferior (`BottomTabBar` con `variant="teacher"`):** muestra 5 pestañas (`📅 Agenda`, `🎓 Alumnos`, `🔑 Validar`, `💼 Ingresos`, `🎻 Docente`). **Nota crítica:** aunque `teacherTab` cambia el estado activo visual de la barra inferior, el contenido renderizado en `App.tsx` para `selectedRole === 'DOCENTE'` es único y no cambia según `teacherTab`.
- **Qué acciones ejecuta:**
  - `handleValidarCodigoDocente` $\rightarrow$ Llama a `validarCodigoEIniciarSesion(sesionActiva.id, profesorId, codigoInputDocente)` en `attendanceService.ts`.
  - `handleDeclararClaseDocente` $\rightarrow$ Llama a `declararClaseImpartida(sesionActiva.id, profesorId)` en `attendanceService.ts`.
  - `handleReprogramarContingencia` $\rightarrow$ Llama a `solicitarReprogramacionContingencia(sesionActiva.id, motivoContingencia)` en `attendanceService.ts`.

---

#### F. Pantalla Legacy / No Conectada

##### 13. Pantalla Monolítica de Reserva A2 (`ClassBookingScreen`)
- **Ruta / Condición de estado:** **Inaccesible actualmente** (no está importada en `App.tsx`).
- **Archivo exacto:** `src/screens/ClassBookingScreen.tsx`
- **Descripción:** Versión monolítica anterior que combinaba selección de paquete, beneficiario, modalidad, bloque horario, condiciones de contratación y resumen financiero en una sola vista. Fue reemplazada en v3.0 por el flujo asistido de 3 pantallas (`TeacherProfileScheduleScreen` $\rightarrow$ `BookingConfirmationScreen` $\rightarrow$ `BookingSuccessEscrowScreen`).

---

## 4. Sistema de Diseño y Componentes Reutilizables

### 4.1 Paleta de Colores, Tipografías y Constantes de Tema
- **Ubicación del archivo de tema:** **No existe un archivo centralizado de tema** (no hay `src/constants/theme.ts`). Cada pantalla y componente define sus propias constantes al pie del archivo antes de `StyleSheet.create`.
- **Paleta Institucional Estricta (cero tonos morados):**

| Token Semántico | Constante Local Usual | Valor Hex | Uso en la Interfaz |
| :--- | :--- | :--- | :--- |
| **Azul Rey (Primario)** | `AZUL_REY` | `#1D4ED8` | Botones primarios, bordes de tarjetas activas, códigos de 6 dígitos, tab activo, enlaces. |
| **Azul Institucional** | `AZUL_INSTITUCIONAL` / `AZUL_OSCURO` | `#1E40AF` | Título de marca `ATRIL`, banners de resumen, botones secundarios oscuros, textos de insignias azules. |
| **Azul Marino Profundo** | `AZUL_MARINO` / `AZUL_MARINO_PROFUNDO` | `#0A192F` | Tarjetas fiduciarias de Custodia Escrow, tarjeta principal de Billetera y títulos principales (`mainTitle`, `sectionTitle`). |
| **Fondo General** | `FONDO` / `FONDO_OFICIAL` | `#F8FAFC` / `#F4F7FC` | Fondo de `SafeAreaView`, contenedores de pantallas e inputs (`#F4F7FC` en `RoleSelectionScreen` y `ClassBookingScreen`; `#F8FAFC` en el resto). |
| **Superficie / Tarjeta** | `BLANCO` | `#FFFFFF` | Fondo de tarjetas (`card`), barra de navegación inferior y botones secundarios. |
| **Verde Esmeralda (Éxito)** | `VERDE` / `VERDE_INSTITUCIONAL` | `#059669` | Badges `✓ FUNDAOBOE`, `SUPABASE AUTH`, conexión PostgreSQL, saldo liberado y confirmación de asistencia. Fondos suaves en `#ECFDF5` y texto claro sobre marino en `#34D399`. |
| **Ámbar (Custodia / Alerta)** | `AMBAR` | `#D97706` | Badges de Profesor, `★ Más Popular`, botones de contingencia eléctrica y saldos retenidos. Fondos suaves en `#FEF3C7` y texto dorado sobre marino en `#FDE68A`. |
| **Rojo (Error / Peligro)** | `ROJO` | `#DC2626` | Validaciones de formulario, advertencia de modo visitante y botón de cerrar sesión (`#FEF2F2`). |
| **Grises Pizarra (Slate)** | Inline en `StyleSheet` | `#0F172A`, `#334155`, `#475569`, `#64748B`, `#94A3B8`, `#CBD5E1`, `#E2E8F0` | Jerarquía de textos secundarios, placeholders (`#94A3B8`) y bordes de tarjetas/inputs (`#CBD5E1`, `#E2E8F0`). |

- **Tipografía:** Fuente del sistema por defecto de React Native (San Francisco en iOS, Roboto en Android) con uso intensivo de pesos gruesos (`fontWeight: '700' | '800' | '900'`) y `letterSpacing: 0.3` a `0.6` en micro-etiquetas en mayúsculas (`fontSize: 9.5` a `11`). Códigos de 6 dígitos con `letterSpacing: 2` a `4` y `fontSize: 20` a `28`.

### 4.2 Componentes Compartidos (`src/components/`)

1. **`BottomTabBar`** (`src/components/BottomTabBar.tsx`)
   - **Descripción:** Barra de navegación inferior fija con elevación ergonómica (`paddingBottom: 28` en Android, `22` en iOS, `10` en Web), píldora azul clara (`#DBEAFE`) sobre el icono activo y punto indicador (`activeDot`).
   - **Tipos exportados:**
     - `StudentTabKey = 'inicio' | 'buscar' | 'mis_clases' | 'billetera' | 'perfil'`
     - `TeacherTabKey = 'agenda' | 'alumnos' | 'validar' | 'ingresos' | 'docente'`
   - **Props (`BottomTabBarProps` — unión discriminada por `variant`):**
     - Variante Estudiante: `{ variant: 'student'; activeTab: StudentTabKey; onSelectTab: (tab: StudentTabKey) => void }`
     - Variante Docente: `{ variant: 'teacher'; activeTab: TeacherTabKey; onSelectTab: (tab: TeacherTabKey) => void }`

2. **`SupabaseStatusBadge`** (`src/components/SupabaseStatusBadge.tsx`)
   - **Descripción:** Chip redondeado de diagnóstico en vivo ubicado en el pie de `RoleSelectionScreen`. Mide latencia contra PostgreSQL en Supabase (`supabase.from('usuarios').select('id', { count: 'exact', head: true })`).
   - **Props:** Ninguna (`()`). Maneja internamente los estados `'IDLE' | 'CHECKING' | 'CONNECTED' | 'ERROR'` y `latencyMs: number | null`.

---

## 5. Capa de Datos, Autenticación y Supabase

### 5.1 Esquema de Base de Datos en Supabase y Tipos TypeScript

El proyecto interactúa con **4 tablas principales** y **2 funciones RPC** en el esquema `public` de PostgreSQL (definidas o referenciadas en `supabase/migrations/20261102_escrow_lifecycle_rpc.sql`, `src/types/atril.types.ts` y `src/services/*`):

#### A. Tipos ENUM en PostgreSQL
- `public.modalidad_clase`: `'presencial' | 'online' | 'hibrido' | 'presencial_caracas' | 'online_en_vivo'` (en TypeScript normalizado al tipo `ModalidadImparticion = 'presencial_caracas' | 'online_en_vivo' | 'hibrido'`).
- `public.estado_sesion`: `'programada' | 'iniciada' | 'declarada_docente' | 'asistencia_validada' | 'reprogramada_fuerza_mayor' | 'incumplimiento_reportado' | 'cancelada'` (en TypeScript: `EstadoSesionClase`).
- Estados de custodia Escrow (`EstadoCustodiaEscrow` en TS): `'bloqueado' | 'liberado' | 'reembolsado' | 'en_disputa'`.
- Tipos de movimiento contable (`TipoMovimientoEscrow` en TS): `'recarga' | 'bloqueo' | 'liberacion' | 'comision' | 'reembolso'`.

#### B. Tablas del Esquema `public`

1. **`public.usuarios`** (Interfaz TS: `Usuario` y `PerfilUsuarioAtril`)
   - **Columnas:**
     - `id` (`UUID`, PK, vinculada a `auth.users.id`)
     - `email` (`TEXT`)
     - `rol` (`RolAtril`: `'alumno_tutor' | 'profesor_docente' | 'representante'`)
     - `tipo_estudiante` (`TipoEstudiante | null`: `'apoderado' | 'estudiante_adulto'`)
     - `cedula_identidad` (`TEXT`)
     - `nombre_completo` (`TEXT`)
     - `telefono` (`TEXT | null`)
     - `created_at` (`TIMESTAMPTZ`)

2. **`public.subperfiles_alumnos`** (Interfaz TS: `SubperfilAlumno`)
   - **Columnas:**
     - `id` (`UUID`, PK)
     - `tutor_id` (`UUID`, FK $\rightarrow$ `public.usuarios.id`, protegida por RLS `auth.uid() = tutor_id`)
     - `nombre_menor` (`TEXT`)
     - `edad_anos` (`INTEGER`, validado en cliente entre 4 y 17 años)
     - `instrumento` (`TEXT`)
     - `nivel` (`NivelMusical`: `'iniciacion' | 'intermedio' | 'avanzado' | 'audicion_sinfonica'`)
     - `foto_privada_url` (`TEXT | null`)
     - `created_at` (`TIMESTAMPTZ`)

3. **`public.perfiles_profesores`** (Interfaz TS: `PerfilProfesor`, proyectada públicamente como `DocenteCatalogoItem` y `FichaDocenteDetalle`)
   - **Columnas:**
     - `id` (`UUID`, PK)
     - `user_id` (`UUID`, FK $\rightarrow$ `public.usuarios.id`)
     - `bio` (`TEXT`)
     - `instrumentos` (`TEXT[]`)
     - `modalidades` (`modalidad_clase[]` / `TEXT[]`)
     - `tarifa_usd` (`NUMERIC(10,2)`)
     - `verificado_fundaoboe` (`BOOLEAN`)
     - `nivel_docente` (`TEXT`, opcional)
     - `created_at` (`TIMESTAMPTZ`)
   - **Relación:** Join `N:1` con `public.usuarios ( id, nombre_completo )`. Por regla de privacidad, las consultas de catálogo nunca seleccionan `email`, `telefono` ni `cedula_identidad` del docente.

4. **`public.sesiones_clase`** (Interfaz TS: `SesionClaseRow`)
   - **Columnas:**
     - `id` (`UUID`, PK)
     - `abono_id` (`UUID | null`)
     - `tutor_id` (`UUID`, FK $\rightarrow$ `public.usuarios.id`)
     - `alumno_id` (`UUID`, FK $\rightarrow$ `public.subperfiles_alumnos.id` o `usuarios.id`)
     - `profesor_id` (`UUID`, FK $\rightarrow$ `public.usuarios.id` / `perfiles_profesores`)
     - `fecha_hora` (`TIMESTAMPTZ`)
     - `modalidad` (`public.modalidad_clase`)
     - `monto_bruto` (`NUMERIC(10,2)`)
     - `comision_plataforma` (`NUMERIC(10,2) | null`) — 15% FundaOboeHJK
     - `honorario_neto` (`NUMERIC(10,2) | null`) — 85% Docente
     - `codigo_sesion` (`VARCHAR(6)`, constraint `CHECK (codigo_sesion ~ '^[A-Z0-9]{6}$')`)
     - `enlace_zoom` (`TEXT | null`)
     - `estado_sesion` (`public.estado_sesion`)
     - `estado_escrow` (`TEXT` / enum `'bloqueado' | 'liberado' | 'reembolsado' | 'en_disputa'`)
     - `calificacion_tutor` (`SMALLINT | null`, constraint `CHECK (calificacion_tutor BETWEEN 1 AND 5)`)
     - `motivo_incumplimiento` (`TEXT | null`)
     - `motivo_contingencia` (`TEXT | null`)
     - `created_at` (`TIMESTAMPTZ`)

5. **`public.movimientos_escrow`** (Interfaz TS: `MovimientoEscrowRow`)
   - **Columnas:**
     - `id` (`UUID`, PK)
     - `sesion_id` (`UUID`, FK $\rightarrow$ `public.sesiones_clase.id`)
     - `usuario_id` (`UUID`, FK $\rightarrow$ `public.usuarios.id`)
     - `tipo` (`TipoMovimientoEscrow`: `'recarga' | 'bloqueo' | 'liberacion' | 'comision' | 'reembolso'`)
     - `monto_usd` (`NUMERIC(10,2)`)
     - `descripcion` (`TEXT`)
     - `created_at` (`TIMESTAMPTZ`)

#### C. Funciones RPC Transaccionales en PostgreSQL (`SECURITY DEFINER`)
1. **`public.rpc_bloquear_fondos_escrow(p_abono_id, p_tutor_id, p_alumno_id, p_profesor_id, p_fecha_hora, p_modalidad, p_monto_bruto, p_codigo_sesion)`:**
   - Valida que `p_monto_bruto > 0` y `p_codigo_sesion ~ '^[A-Z0-9]{6}$'`.
   - Calcula `v_comision_15 = ROUND(v_monto_bruto * 0.15, 2)` y `v_honorario_85 = ROUND(v_monto_bruto - v_comision_15, 2)`.
   - Inserta la fila en `public.sesiones_clase` con `estado_sesion = 'programada'` y `estado_escrow = 'bloqueado'`.
   - Inserta el asiento contable `'bloqueo'` en `public.movimientos_escrow`.
   - Retorna la fila creada de `public.sesiones_clase`.
2. **`public.rpc_confirmar_asistencia_y_liberar(p_sesion_id, p_tutor_id, p_calificacion)`:**
   - Bloquea la fila con `SELECT * FROM public.sesiones_clase WHERE id = p_sesion_id FOR UPDATE`.
   - Verifica que `tutor_id = p_tutor_id`, `estado_sesion = 'declarada_docente'`, `estado_escrow = 'bloqueado'` y `p_calificacion BETWEEN 1 AND 5`.
   - Actualiza `sesiones_clase` a `estado_sesion = 'asistencia_validada'` y `estado_escrow = 'liberado'`.
   - Inserta 2 asientos contables en `public.movimientos_escrow` asociados a `v_sesion.profesor_id`: uno de tipo `'comision'` (15%) y otro de tipo `'liberacion'` (85%).
   - Retorna un `JSONB` `{ ok: true, sesion, movimiento_comision, movimiento_liberacion }`.

---

### 5.2 Funcionamiento de Autenticación y Gestión de Roles en el Cliente

- **Configuración del cliente (`src/lib/supabase.ts`):**
  - Requiere `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` en `.env` (lanza `Error` en arranque si faltan).
  - Usa `AsyncStorage` como motor de almacenamiento de sesión (`persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false`).
- **Autenticación por Rol:**
  - **Estudiante / Representante (`ALUMNO`):** Es el **único rol que pasa por Supabase Auth en la UI actual**. Al iniciar la app (`useEffect` en `App.tsx`), se llama a `getCurrentSessionUser()`, que ejecuta `supabase.auth.getSession()` y cruza el `user.id` contra `public.usuarios` (con fallback a `user.user_metadata` si la fila aún no existe).
  - **Diferenciación `A0` (Estudiante Adulto) vs `A1` (Padre/Representante):** Determinada por la propiedad `usuarioEstudiante.tipo_estudiante` (`'estudiante_adulto'` vs `'apoderado'`).
    - Si `tipo_estudiante === 'apoderado'`, `esApoderado` es `true` y se habilitan los selectores y formularios multihijo en `StudentCatalogScreen`, `StudentProfileScreen` y `TeacherProfileScheduleScreen`.
    - Si `tipo_estudiante === 'estudiante_adulto'`, toda interfaz parental o de menores queda oculta y el estudiante actúa como su propio beneficiario.
  - **Docente (`DOCENTE`):** En v3.0 **no tiene pantalla de login conectada**. Al elegir `DOCENTE` en `RoleSelectionScreen`, entra directo al Portal del Maestro en `App.tsx` operando sobre la `sesionActiva` en memoria o usando el ID constante `DEMO_PROFESOR_ID = '99999999-9999-9999-9999-999999999999'`.
  - **Visitante (`VISITANTE`):** Acceso anónimo sin sesión.

---

### 5.3 Catálogo Completo de Servicios, Funciones y Hooks de Datos

| Archivo | Función / Hook | Tablas / RPC que Toca | Qué Devuelve y Comportamiento de Respaldo |
| :--- | :--- | :--- | :--- |
| `src/services/authService.ts` | `signUpStudent(input)` | `supabase.auth.signUp` + `UPSERT` en `public.usuarios` | Devuelve `Promise<PerfilUsuarioAtril>`. Inyecta `nombre_completo`, `rol: 'representante'`, `tipo_estudiante` y `cedula_identidad` en `user_metadata`. Si falla el upsert en `public.usuarios`, devuelve el objeto construido en memoria. |
| `src/services/authService.ts` | `signInStudent(email, password)` | `supabase.auth.signInWithPassword` + `SELECT` en `public.usuarios` | Devuelve `Promise<PerfilUsuarioAtril>`. Si la fila en `public.usuarios` no existe, reconstruye el perfil desde `user.user_metadata`. |
| `src/services/authService.ts` | `getCurrentSessionUser()` | `supabase.auth.getSession` + `SELECT` en `public.usuarios` | Devuelve `Promise<PerfilUsuarioAtril \| null>`. Recupera la sesión persistida en `AsyncStorage`. |
| `src/services/authService.ts` | `signOut()` | `supabase.auth.signOut` | Devuelve `Promise<void>`. Cierra sesión y limpia `AsyncStorage`. |
| `src/services/authService.ts` | `registrarUsuarioConRol(input)` / `iniciarSesionConRol(email, password)` | `supabase.auth` + `public.usuarios` | Devuelve `Promise<Usuario>`. Funciones genéricas exportadas pero **no invocadas** por ninguna pantalla actual (las pantallas usan `signUpStudent`/`signInStudent`). |
| `src/services/teacherCatalogService.ts` | `obtenerCatalogoDocentes(filtros?)` | `SELECT` en `public.perfiles_profesores` con join a `usuarios (id, nombre_completo)` filtrando `verificado_fundaoboe = true` | Devuelve `Promise<DocenteCatalogoItem[]>`. Si la tabla remota está vacía o da error, retorna `DOCENTES_INSTITUCIONALES_FALLBACK` (3 docentes curados: Mtro. José Gregorio Sanabria, Prof. Valentina Meneses, Prof. Alejandro Iturriza) y aplica filtros locales de modalidad e instrumento. |
| `src/services/teacherCatalogService.ts` | `obtenerFichaDocente(profesorId)` | Reutiliza `obtenerCatalogoDocentes()` | Devuelve `Promise<FichaDocenteDetalle>` agregando `sedeReferencia`, 4 `bloquesHorarios` dinámicos y 3 `opcionesContratacion` calculadas con `escrowCalculator.ts`. |
| `src/services/teacherCatalogService.ts` | `construirOpcionesContratacionDocente(tarifaUsd)` | Cálculo puro (sin BD) | Devuelve `OpcionContratacionDocente[]` para 1 clase (0%), 6 clases (-10%) y 8 clases (-12%). |
| `src/services/parentService.ts` | `obtenerSubperfiles(tutorId)` | `SELECT * FROM public.subperfiles_alumnos WHERE tutor_id = tutorId` | Devuelve `Promise<SubperfilAlumno[]>` ordenado por `created_at ASC`. |
| `src/services/parentService.ts` | `crearSubperfil(data)` | `INSERT INTO public.subperfiles_alumnos` | Valida edad entera entre `4` y `17` años y devuelve `Promise<SubperfilAlumno>`. |
| `src/services/escrowService.ts` | `bloquearFondosEscrow(params)` | ` GET /rest/v1/` (OpenAPI spec) + RPC `rpc_bloquear_fondos_escrow` + `UPDATE public.sesiones_clase` (para `enlace_zoom`) | Devuelve `Promise<BloquearFondosResultado>`. Introspecciona los valores válidos del enum `modalidad_clase` en PostgREST, prueba los candidatos en la RPC y, si falla por FK de usuarios demo o migración pendiente, crea una sesión con UUID local en `SESIONES_MEMORIA_CACHE`. |
| `src/services/escrowService.ts` | `obtenerEnlaceZoomSeguro(sesion, ventanaMinutosPrevios = 15)` | Cálculo puro sobre `SesionClaseRow` | Devuelve `string \| null`. Solo revela `enlace_zoom` si `estado_sesion === 'iniciada'`, o si está `'programada'` dentro de la ventana de `[-90, +15]` minutos respecto a `fecha_hora`. |
| `src/services/escrowService.ts` | `configurarEnlaceZoomDocente(sesionId, profesorId, enlaceZoom)` | `UPDATE public.sesiones_clase SET enlace_zoom = ...` | Devuelve `Promise<SesionClaseRow>`. Actualiza BD y caché en memoria. |
| `src/services/escrowService.ts` | `obtenerResumenBilletera(userId, rol)` | `SELECT` en `public.sesiones_clase` y `public.movimientos_escrow` | Devuelve `Promise<ResumenBilletera>`. Para `'tutor'` calcula `saldoDisponibleUsd` y `saldoRetenidoEscrowUsd`. Para `'profesor'` calcula el 85% en `saldo_en_custodia` (sesiones bloqueadas) y `saldo_disponible_corte` (sesiones `asistencia_validada` + `liberado`). |
| `src/services/attendanceService.ts` | `validarCodigoEIniciarSesion(sesionId, profesorId, codigoIngresado)` | `SELECT` y `UPDATE` en `public.sesiones_clase` | Devuelve `Promise<SesionClaseRow>`. Verifica que la sesión esté en `'programada'` o `'reprogramada_fuerza_mayor'` y que `codigo_sesion` coincida (case-insensitive); actualiza `estado_sesion = 'iniciada'`. |
| `src/services/attendanceService.ts` | `declararClaseImpartida(sesionId, profesorId)` | `SELECT` y `UPDATE` en `public.sesiones_clase` | Devuelve `Promise<SesionClaseRow>`. Exige que `estado_sesion === 'iniciada'` (código previamente validado) y pasa a `'declarada_docente'`. |
| `src/services/attendanceService.ts` | `responderEncuestaYConfirmar(sesionId, tutorId, calificacionEstrellas)` | RPC `rpc_confirmar_asistencia_y_liberar` | Devuelve `Promise<LiquidacionBidireccionalResultado>`. Si la RPC falla y la sesión existe en `SESIONES_MEMORIA_CACHE`, ejecuta la liquidación 85%/15% en memoria permitiendo confirmar desde `'declarada_docente'` o `'iniciada'`. |
| `src/services/attendanceService.ts` | `solicitarReprogramacionContingencia(sesionId, motivo, nuevaFechaHoraOpcional?)` | `SELECT` y `UPDATE` en `public.sesiones_clase` | Devuelve `Promise<SesionClaseRow>`. Mantiene `estado_escrow = 'bloqueado'`, cambia `estado_sesion = 'reprogramada_fuerza_mayor'` y guarda `motivo_contingencia`. |
| `src/services/attendanceService.ts` | `reportarIncumplimientoYReembolsar(sesionId, tutorId, motivo)` | `SELECT` y `UPDATE` en `public.sesiones_clase` + `INSERT` en `public.movimientos_escrow` | Devuelve `Promise<ReembolsoIncumplimientoResultado>`. Bloquea la disputa si el código ya fue validado (`'iniciada'`, `'declarada_docente'`, `'asistencia_validada'`). Si procede, pasa a `'incumplimiento_reportado'` + `'reembolsado'`. (**Nota:** Función implementada en el servicio pero sin botón conectado en la UI actual). |
| `src/hooks/useParentProfiles.ts` | `useParentProfiles()` | Invoca `obtenerSubperfiles` y `crearSubperfil` de `parentService.ts` + `CACHE_HIJOS_POR_TUTOR` (`Map`) | Expone `{ subperfiles, alumnoActivo, loadingProfiles, cargarSubperfiles, alternarHijoActivo, seleccionarHijoPorId, registrarNuevoHijo }`. Si la tabla remota falla, persiste los hijos en memoria durante la sesión. |
| `src/hooks/useEscrow.ts` | `useEscrow()` | Invoca `escrowService.ts` | Expone `{ loadingEscrow, errorEscrow, sesionActiva, billeteraTutor, billeteraProfesor, reservarConCustodia, cargarBilleteraTutor, cargarBilleteraProfesor, actualizarZoomDocente, obtenerEnlaceZoomSeguro }`. (**Nota:** Hook implementado pero no importado actualmente por las pantallas). |

---

## 6. Flujos de Negocio Actuales (v3.0)

### 6.1 Inicio de Sesión, Persistencia y Redirección por Rol
1. **Arranque (`App.tsx`):** Un `useEffect` inicial invoca `getCurrentSessionUser()` (`src/services/authService.ts`). Si existe una sesión válida en `AsyncStorage`, precarga `usuarioEstudiante` en el estado de `App.tsx`, pero **siempre muestra primero la puerta `RoleSelectionScreen` (`selectedRole === null`)**.
2. **Selección en R0 (`src/screens/RoleSelectionScreen.tsx`):**
   - Si el usuario elige **`ALUMNO`**: `handleSelectRoleFromR0('ALUMNO')` verifica si `usuarioEstudiante` ya existe (o vuelve a consultar `getCurrentSessionUser()`).
     - Si no hay sesión activa: activa `requiereAuthEstudiante = true` y muestra `StudentAuthScreen`.
     - En `StudentAuthScreen` (`src/screens/StudentAuthScreen.tsx`), el usuario inicia sesión (`signInStudent`) o crea cuenta (`signUpStudent`) eligiendo entre **Padre/Representante (`apoderado` / A1)** o **Estudiante Mayor de Edad (`estudiante_adulto` / A0)**.
     - Al autenticarse, `App.tsx` evalúa `esApoderado = usuarioEstudiante?.tipo_estudiante === 'apoderado'` y adapta todas las pantallas del tab bar de estudiante.
   - Si el usuario elige **`DOCENTE`**: `App.tsx` asigna `selectedRole = 'DOCENTE'` sin solicitar credenciales y renderiza el Portal del Maestro.
   - Si el usuario elige **`VISITANTE`**: `App.tsx` asigna `selectedRole = 'VISITANTE'` y renderiza `StudentCatalogScreen` con `isVisitorMode={true}`.

### 6.2 Gestión de Subperfiles de Menores (Exclusivo Representante A1)
1. Cuando un usuario con `tipo_estudiante === 'apoderado'` entra a `StudentCatalogScreen` (tab `buscar`) o `StudentProfileScreen` (tab `perfil`), el hook `useParentProfiles` (`src/hooks/useParentProfiles.ts`) llama a `obtenerSubperfiles(tutorId)` (`src/services/parentService.ts`).
2. Si el representante registra un nuevo hijo (4 a 17 años), `registrarNuevoHijo` intenta insertarlo en `public.subperfiles_alumnos` mediante `crearSubperfil`. Si la BD rechaza por RLS o tabla inexistente, crea un objeto de respaldo con `id: "hijo-{timestamp}"` y lo guarda en `CACHE_HIJOS_POR_TUTOR` (`Map` en memoria a nivel de módulo), garantizando que los hijos registrados se compartan entre las pestañas `Buscar`, `Perfil` y el asistente de reserva.

### 6.3 Exploración de Catálogo y Reserva con Bloqueo Fiduciario Escrow (3 Pasos)
1. **Catálogo (`src/screens/StudentCatalogScreen.tsx`):** Consulta `obtenerCatalogoDocentes(filtros)` en `src/services/teacherCatalogService.ts`. Muestra docentes verificados de Supabase o los 3 docentes institucionales del fallback local.
2. **Paso 1 — Horario y Modalidad (`src/screens/TeacherProfileScheduleScreen.tsx`):**
   - Al pulsar `Ver Perfil y Horarios`, `App.tsx` fija `docenteEnReserva` y `pasoReserva = 1`.
   - `obtenerFichaDocente(profesorId)` calcula las 3 opciones de contratación con `construirOpcionesContratacionDocente(tarifa_usd)` (`src/utils/escrowCalculator.ts`).
   - El usuario elige alumno beneficiario (si es A1), modalidad (`online_en_vivo` o `presencial_caracas`), día (`DIAS_AGENDA`) y hora (`PARRILLA_HORAS`), y avanza al Paso 2.
3. **Paso 2 — Paquete, Regla 24h y Bloqueo Escrow (`src/screens/BookingConfirmationScreen.tsx`):**
   - El usuario define el objetivo académico de la clase, selecciona entre **Clase Individual (1 clase, 0%)**, **Abono Formativo (6 clases, -10%)** o **Abono Intensivo (8 clases, -12%)**, y marca el checkbox obligatorio de políticas de cancelación de 24 horas.
   - Al confirmar, se invoca `bloquearFondosEscrow` (`src/services/escrowService.ts`):
     - Genera un código aleatorio de 6 caracteres (`generarCodigoSesion()`, alfabeto sin caracteres ambiguos `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).
     - Descubre dinámicamente los valores del enum `modalidad_clase` vía OpenAPI (`/rest/v1/`) e invoca la RPC `rpc_bloquear_fondos_escrow`.
     - Si la RPC falla, crea la sesión en `SESIONES_MEMORIA_CACHE` con `estado_sesion: 'programada'` y `estado_escrow: 'bloqueado'`.
   - `App.tsx` (`handlePaso2SuccessEscrow`) guarda `sesionActiva`, inserta la cita en `clasesAgendadas`, incrementa `saldoEnCustodiaDocente` con el 85% neto (`opcion.honorarioNetoDocenteUsd`) y avanza al Paso 3.
4. **Paso 3 — Comprobante (`src/screens/BookingSuccessEscrowScreen.tsx`):**
   - Muestra el folio, el monto congelado en Escrow y el código de 6 dígitos que el estudiante deberá dictar al profesor.

### 6.4 Protocolo Pre-Clase (Código de 6 Dígitos), Declaración y Liquidación 85% / 15%
1. **Protección del Enlace Zoom (`obtenerEnlaceZoomSeguro` en `src/services/escrowService.ts`):**
   - En `StudentHomeScreen`, el enlace de Zoom permanece oculto mientras la sesión está en estado `'programada'` y faltan más de 15 minutos para `fecha_hora`. Se revela automáticamente 15 minutos antes o cuando la sesión pasa a `'iniciada'`.
2. **Inicio Formal con Código de 6 Dígitos (Rol `DOCENTE` en `App.tsx`):**
   - El usuario cambia de perfil a `DOCENTE` usando el botón superior `⇄ Cambiar perfil`.
   - El profesor introduce el código de 6 caracteres dictado por el alumno y presiona `🔑 Validar Código e Iniciar Sesión Formal` (`handleValidarCodigoDocente` en `App.tsx` $\rightarrow$ `validarCodigoEIniciarSesion` en `src/services/attendanceService.ts`).
   - Si el código coincide con `sesionActiva.codigo_sesion`, el estado pasa de `'programada'` (o `'reprogramada_fuerza_mayor'`) a **`'iniciada'`**. A partir de este instante queda bloqueada cualquier disputa por inasistencia docente.
3. **Declaración de Clase Impartida (Rol `DOCENTE` en `App.tsx`):**
   - Al concluir la lección, el maestro presiona `🎻 Registrar Clase Impartida` (`handleDeclararClaseDocente` $\rightarrow$ `declararClaseImpartida` en `src/services/attendanceService.ts`).
   - El servicio verifica que la sesión esté en `'iniciada'` y actualiza `estado_sesion` a **`'declarada_docente'`**.
4. **Confirmación, Evaluación y Dispersión para Corte Mensual (Rol `ALUMNO` en `StudentHomeScreen` o `StudentClassesScreen`):**
   - El estudiante o representante presiona `✓ Confirmar Clase Recibida y Evaluar Docente` (`handleConfirmarYLiberarEscrow` en `App.tsx` $\rightarrow$ `responderEncuestaYConfirmar(sesionActiva.id, tutorIdActivo, 5)` en `src/services/attendanceService.ts`).
   - Se ejecuta la RPC `rpc_confirmar_asistencia_y_liberar` (o su respaldo en memoria), que cambia la sesión a **`estado_sesion: 'asistencia_validada'`** y **`estado_escrow: 'liberado'`**, registrando dos movimientos contables:
     - **85% Honorario Neto Docente** (`tipo: 'liberacion'`), que pasa de `saldoEnCustodiaDocente` a `saldoDisponibleCorteDocente` (acumulado para el corte de fin de mes de FundaOboeHJK).
     - **15% Comisión Operativa** (`tipo: 'comision'`) a favor de FundaOboeHJK.

### 6.5 Flujo de Contingencia por Fuerza Mayor (Falla Eléctrica / Internet)
1. Tanto el estudiante (desde `StudentHomeScreen` o `StudentClassesScreen`) como el docente (desde la vista `DOCENTE` en `App.tsx`) pueden pulsar el botón ámbar de contingencia (`handleReprogramarContingencia` $\rightarrow$ `solicitarReprogramacionContingencia` en `src/services/attendanceService.ts`).
2. El servicio verifica que `estado_escrow === 'bloqueado'` y que la sesión no esté ya validada ni cancelada.
3. Actualiza `estado_sesion` a **`'reprogramada_fuerza_mayor'`** y registra `motivo_contingencia`, manteniendo `estado_escrow` en **`'bloqueado'`** sin descontar la clase ni liberar los fondos, permitiendo que posteriormente pueda iniciarse con el código de 6 dígitos (`validarCodigoEIniciarSesion` acepta sesiones en `'reprogramada_fuerza_mayor'`).

---

## 7. Estado Actual y Deuda Técnica

Lista verificada de pantallas incompletas, datos mockeados/hardcodeados y brechas arquitectónicas presentes en el código de la v3.0:

1. **Divergencia con `AGENTS.md` en Navegación:**
   - Aunque `AGENTS.md` menciona Expo Router (`src/app/`), **Expo Router no está instalado en `package.json` ni existe la carpeta `src/app/`**. Toda la navegación vive en estados locales dentro de `App.tsx` (826 líneas).
2. **Portal del Docente Incompleto y Renderizado Inline en `App.tsx`:**
   - El rol `DOCENTE` no tiene pantallas propias en `src/screens/`; su UI está escrita directamente dentro de `App.tsx` (líneas 532-628).
   - El componente `BottomTabBar` en modo `variant="teacher"` renderiza 5 pestañas (`agenda`, `alumnos`, `validar`, `ingresos`, `docente`), pero **cambiar `teacherTab` no cambia nada en pantalla** porque `App.tsx` no tiene bloques condicionales por pestaña para el docente.
   - No existe flujo de autenticación (`login`/`registro`) para docentes en la UI; el acceso desde `RoleSelectionScreen` es inmediato y utiliza `DEMO_PROFESOR_ID = '99999999-9999-9999-9999-999999999999'` como fallback.
3. **Billetera del Estudiante Mockeada (`StudentWalletScreen.tsx`):**
   - El saldo disponible del estudiante es un `useState` local hardcodeado en `$180.00 USD` (`saldoDisponiblePrueba`) con un botón `＋ Recargar $50` que solo suma `50` en memoria sin persistir en `public.movimientos_escrow` ni descontar de dicho saldo al reservar.
   - El servicio real `obtenerResumenBilletera(tutorId, 'tutor')` de `escrowService.ts` sí está implementado, pero `StudentWalletScreen` no lo invoca (solo se invoca para el rol `'profesor'` desde `App.tsx`).
4. **Agenda de Clases (`clasesAgendadas`) No Persistida al Recargar la App:**
   - En `App.tsx`, `clasesAgendadas` es un arreglo en memoria (`useState<ClaseAgendadaItem[]>([])`) que solo se alimenta cuando el usuario completa el Paso 2 de reserva durante la sesión actual. Al cerrar o recargar la app, no hay un `SELECT` inicial a `public.sesiones_clase` para hidratar `clasesAgendadas` ni `sesionActiva`.
5. **Fechas y Horarios del Docente Hardcodeados:**
   - En `TeacherProfileScheduleScreen.tsx`, los días disponibles están fijos en la constante `DIAS_AGENDA` (`HOY 04 Nov`, `JUE 05 Nov`, `VIE 06 Nov`, `SÁB 07 Nov`) y las horas en `PARRILLA_HORAS` (`09:00 AM`, `11:00 AM`, `02:00 PM`, `04:00 PM`), además del rating estático `★ 4.9 (42 sesiones auditadas)`.
   - Asimismo, `generarBloquesHorariosDocente` en `teacherCatalogService.ts` genera 4 slots relativos a `Date.now()`, los cuales eran usados por la pantalla legacy `ClassBookingScreen.tsx`, pero `TeacherProfileScheduleScreen.tsx` usa sus propias constantes `DIAS_AGENDA` y `PARRILLA_HORAS`.
6. **Calificación del Docente Hardcodeada en 5 Estrellas y Motivo de Contingencia Fijo para el Alumno:**
   - En `App.tsx` (línea 289), `handleConfirmarYLiberarEscrow` pasa siempre `5` como calificación (`responderEncuestaYConfirmar(sesionActiva.id, tutorIdActivo, 5)`); no existe un modal o selector interactivo de 1 a 5 estrellas en la UI del estudiante.
   - Cuando el estudiante reporta contingencia desde `StudentHomeScreen` o `StudentClassesScreen`, se envía automáticamente el string por defecto de `motivoContingencia` (`"Interrupción eléctrica / caída de internet en zona residencial"`) sin abrir un input para que el alumno escriba su motivo (el `TextInput` de motivo solo está renderizado en la vista `DOCENTE`).
7. **Código Huérfano / No Conectado a la UI y Errores de Tipado (`tsc`):**
   - `src/screens/ClassBookingScreen.tsx` (981 líneas): pantalla monolítica legacy no importada en `App.tsx`. Además, presenta **2 errores de compilación en `npx tsc --noEmit`** (líneas 60 y 85: `TS2345: Argument of type 'SubperfilAlumno | null' is not assignable to parameter of type 'SubperfilAlumno'`) debido a que `alumnoActivo` en `useParentProfiles` pasó a ser nullable (`SubperfilAlumno | null`).
   - `src/hooks/useEscrow.ts`: custom hook completo que no se importa en ninguna pantalla ni en `App.tsx`.
   - `reportarIncumplimientoYReembolsar` (`src/services/attendanceService.ts`): lógica de disputa y reembolso 100% por inasistencia docente implementada en la capa de servicios, pero sin botón en la UI para dispararla.
   - `registrarUsuarioConRol` e `iniciarSesionConRol` (`src/services/authService.ts`): funciones exportadas sin uso en vistas.
   - Botón `🗓️ Agendar en Calendario` en `BookingSuccessEscrowScreen.tsx`: solo cambia el booleano local `calendarioAgendado = true` sin integrarse con el calendario nativo del dispositivo (`expo-calendar`).
   - Banner `Plan Formativo 2x1 Amigo` en `StudentCatalogScreen.tsx`: es puramente visual y no modifica la lógica de precios ni permite inscribir un segundo alumno en la reserva.
