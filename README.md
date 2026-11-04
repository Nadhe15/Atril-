#  ATRIL — Guía General de Arquitectura y Operación

Documento explicativo del estado actual de la plataforma, arquitectura de navegación, persistencia de datos y flujo transaccional tutelado.

---

##  1. Objetivo y Modelo de Negocio
**ATRIL** es una plataforma educativa de mercado musical tutelado (respaldada por FundaOboeHJK y la Universidad Simón Bolívar).
Su núcleo operativo es la **Custodia Fiduciaria (Escrow)**:
1. **Reserva y Bloqueo:** El estudiante o representante reserva una sesión; los fondos quedan congelados en Escrow y el docente no percibe el dinero por adelantado.
2. **Protocolo Pre-Clase (Código de 6 Dígitos):** Al iniciar la conexión (Zoom o presencial), el estudiante dicta al maestro un código alfanumérico único generado por el sistema. Esto valida el inicio formal e imposibilita disputas por inasistencia sin fundamento.
3. **Liberación y Comisión:** Al finalizar, el representante/alumno confirma la recepción y evalúa la sesión. Esto dispersa automáticamente los fondos: 85% honorario neto para el docente (acumulado para corte mensual) y 15% aporte operativo para la plataforma.
4. **Contingencias:** Si ocurre una interrupción eléctrica o de conectividad, se reporta contingencia y la clase queda abierta para reprogramación sin débito de fondos.

---

##  Puertas de Entrada y Tipos de Cuenta

La pantalla inicial (`RoleSelectionScreen`) divide el acceso en tres perfiles:

### A. Estudiante / Representante (`ALUMNO`)
Gestionado mediante **Supabase Auth** (`supabase.auth`) con sesión persistente en almacenamiento seguro. Al registrarse se bifurca en:
* ** Estudiante Mayor de Edad (`estudiante_adulto` / A0):**
  * Usuario mayor de 18 años con autonomía académica y financiera directa.
  * No requiere tutores ni visualiza opciones de gestión infantil o multihijo.
* ** Padre / Representante Legal (`apoderado` / A1):**
  * Administrador de la cuenta que inscribe y tutela a menores de edad (4 a 17 años).
  * Cuenta con soporte multihijo para registrar nombres reales, edades e instrumentos de sus representados y alternar entre ellos al reservar.

### B. Portal del Maestro (`DOCENTE`)
* Espacio del profesor para consultar su agenda, validar el código de 6 dígitos que dicta el alumno, registrar clases impartidas, reportar contingencias y monitorear su acumulado fiduciario para liquidación mensual.

### C. Vitrina Pública (`VISITANTE` / V0)
* Catálogo restringido para explorar cátedras disponibles.
* Por políticas de privacidad comunitaria y para evitar evasión de custodia, los nombres completos, teléfonos, correos y tarifas detalladas permanecen bloqueados bajo candado hasta autenticarse.

---

##  3. Navegación Inferior Modular (Módulo Estudiante)

La aplicación cuenta con una barra de navegación elevada ergonómicamente sobre los márgenes del sistema operativo (`BottomTabBar`), con 5 pantallas dedicadas:

1. ** Inicio (`StudentHomeScreen`):**
   * Panel de control central: estado de la reserva activa en tiempo real, garantía Escrow, tarjeta de la sesión en curso con código de validación, botón directo de acceso Zoom, y acciones de confirmación o contingencia.
2. ** Buscar (`StudentCatalogScreen`):**
   * Catálogo con filtros por instrumento y modalidad (`Online En Vivo` / `Presencial Caracas`). Al presionar *"Ver Perfil y Horarios"*, lanza el asistente multipaso de reserva.
3. ** Mis Clases (`StudentClassesScreen`):**
   * Agenda de clases programadas que muestra fecha, hora, docente, modalidad, tema académico asignado y código de 6 dígitos.
4. ** Billetera (`StudentWalletScreen`):**
   * Balance financiero: saldo disponible, monto congelado en Escrow y saldo liberado a docentes, acompañado del historial de transacciones.
5. ** Perfil (`StudentProfileScreen`):**
   * Información del titular autenticado (Cédula, Correo, Rol institucional).
   * **Exclusivo para Representantes (A1):** Formulario para añadir y seleccionar hijos con nombre propio.

---

##  4. Flujo Asistido de Reserva en 3 Pasos

Se reemplazó la pantalla monolítica por un flujo secuencial desacoplado:

* **Paso 1 — Disponibilidad (`TeacherProfileScheduleScreen`):**
  * Resumen del docente (Cátedra, Aval `✓ FUNDAOBOE`, Tarifa/h).
  * Selector de modalidad (`Online En Vivo` / `Presencial`).
  * Selector de fecha y parrilla interactiva de bloques horarios (`09:00 AM`, `11:00 AM`, `02:00 PM`, `04:00 PM`). El avance requiere seleccionar un bloque.
* **Paso 2 — Paquete y Políticas (`BookingConfirmationScreen`):**
  * Entrada de texto para *"Objetivo / Tema de la Sesión"*.
  * Selector de contratación: `Clase Individual (60 min)`, `Abono 6 Clases (-10%) ★ Más Popular` o `Abono 8 Clases (-12%)`.
  * Desglose contable (Subtotal, Descuento y Total a Bloquear).
  * Casilla de verificación obligatoria aceptando políticas de cancelación (regla de 24 horas).
* **Paso 3 — Custodia y Formalización (`BookingSuccessEscrowScreen`):**
  * Pantalla de éxito con tarjeta de confirmación fiduciaria (`EN CUSTODIA FIDUCIARIA - ESCROW`), generación del código de 6 dígitos, resumen de la cita agendada y accesos a la agenda o calendario.

---

##  5. Entorno y Comandos de Trabajo

* **Instalación de paquetes:** `npx expo install <paquete>` (mantiene compatibilidad de dependencias de Expo SDK).
* **Servidor de desarrollo:** `npx expo start`
* **Verificación estricta de TypeScript:** `npx tsc --noEmit`
* **Estándar visual:** React Native nativo (`StyleSheet`), paleta institucional estricta (Azul Rey `#1D4ED8`, Azul Institucional `#1E40AF`, Fondo `#F8FAFC`, Blanco `#FFFFFF`, Ámbar `#D97706`, Verde Esmeralda `#059669`, Rojo Alerta `#DC2626`). Cero tonalidades moradas o componentes web.
