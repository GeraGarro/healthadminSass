# Patio · frontend administrativo

Cliente Angular/TypeScript para secretaría, profesionales y administración institucional, tanto en clínicas como en ejercicio independiente. Dirección visual elegida: Patio, verde profundo, superficies claras y controles de trabajo habituales.

El incremento del 27/10/2026 añade [turnos, identidad de pacientes y espacio profesional](../docs/35-turnos-pacientes-y-espacio-profesional.md). La paleta temporal de todos los calendarios cambia de forma autorizada; Nunito Sans, navegación celadón y el resto de Patio se conservan.

El rol **Administrador de institución** abre perfiles profesionales y permite administrar cuentas nuevas, solicitudes de vínculo, equipo/facultades, sedes/agendas, políticas y auditoría según sus permisos efectivos. No accede a pacientes ni a datos de atención; puede consultar horarios y jornada programada. En acceso, **Explorar administración** abre la demostración. [Flujos, permisos, validación y límites vigentes](../docs/34-rediseno-roles-institucion-y-secretaria.md); [implementación anterior](../docs/33-administracion-institucional.md).

**Docker, frontend + API + PostgreSQL:** desde la raíz del repositorio ejecutar `scripts/start-local.ps1`. Para conectar el contenedor web a Spring ejecutándose en el host: `scripts/start-local.ps1 -BackendOnHost`. [Guía local, cuentas, configuración y pruebas completas](../docs/29-entorno-local-docker.md).

## Abrir en VS Code

Abrí la carpeta raíz **Sistema de Gestión Administrativa Salud**. En **Terminal → Nueva terminal**, con PowerShell:

```powershell
cd .\salud-web
npm ci
npm start
```

Abrí <http://127.0.0.1:4387>. Conservá la terminal abierta; `Ctrl+C` detiene la app. No requiere instalar Angular CLI globalmente: el proyecto usa su versión local. Usá Node.js 24.15 o superior de la rama 24 (la versión probada es 24.21).

Si abrís directamente `salud-web` en VS Code, omití `cd .\salud-web`. Si el puerto ya está ocupado por una ejecución de esta app, usá esa dirección o detené esa ejecución antes de iniciar otra.

Con la carpeta raíz abierta también podés usar **Terminal → Ejecutar tarea → Angular: iniciar Patio**. Hay tareas para instalar dependencias, compilar y probar. La extensión Angular Language Service aparece entre las recomendaciones del proyecto.

## Demostración y servidor

La primera visita muestra el **acceso al servidor** o restaura la sesión. La demostración con datos ficticios se elige expresamente desde acceso y se identifica en una franja visible. Permite explorar Secretaría, Profesional y Administración institucional, y los contextos Clínica/Independiente disponibles. **Secretaría · primer ingreso** permite completar solo nombre y apellido y empezar sin agendas. Sus cambios se guardan únicamente en el navegador; **Configuración → Mi cuenta → Restaurar demostración** restaura el contexto actual.

Para operar con datos del servidor:

1. Compilá e iniciá la versión actual de [salud-api](../salud-api/README.md) en `127.0.0.1:8080`. Requiere las migraciones hasta V12 y las proyecciones `/workspace` actuales; un proceso anterior debe recompilarse y reiniciarse para exponerlas. V12 incorpora la identidad mínima global por huella de DNI y aranceles institucionales; no fusiona fichas históricas. La clave `app.encryption-key` debe conservarse para mantener la identidad documental estable.
2. Configurá `PORTAL_URL=http://127.0.0.1:4387` en el entorno del servidor para que activaciones y recuperaciones vuelvan a esta app.
3. Abrí la app, usá tu cuenta habilitada y cambiá la contraseña si es provisoria; completá MFA si corresponde y elegí entidad. La interfaz toma las facultades efectivas del servidor. Una cuenta profesional conserva ese rol aunque aún no tenga agenda.

Con `salud-api/.env` configurado para el perfil local, el JAR compilado y Java 21 en la ruta prevista, `scripts/start-api-local.ps1` desde la raíz inicia la API en segundo plano y conserva la base. `scripts/start-api-local.ps1 -Restart` actualiza solo el proceso reconocido de esta API en su puerto. El script ejecuta una copia con nombre de versión en `output`, para permitir nuevas compilaciones de `target`; el reinicio puede requerir ingresar de nuevo. [Detalle del cierre y la verificación local](../docs/34-rediseno-roles-institucion-y-secretaria.md#validación-y-estado-local).

El proxy local reenvía `/api` a Spring conservando el mismo origen. La sesión usa cookie; CSRF se obtiene del servidor y se envía en las escrituras. No se guardan contraseñas, cookies ni datos reales de pacientes en `localStorage`. La demostración funciona sin Spring. Correo, WhatsApp y acceso con Google necesitan la configuración correspondiente del servidor y sus proveedores; explorar la demo no realiza envíos reales.

## Pantallas

Jornada y próximos pacientes; calendario diario, semanal, mensual y lista; alta, detalle, confirmación, cancelación y reprogramación de turnos; pacientes y ficha administrativa; admisiones y solicitudes asistidas; notificaciones y seguimiento de avisos; conversaciones humanas autorizadas; prácticas, ofertas, coberturas, planes y convenios; reportes; horarios, ausencias, delegaciones y seguridad de cuenta.

Estas pantallas se habilitan según el contexto y las facultades efectivas. La ficha es administrativa. El registro del turno, la confirmación de asistencia y los estados de recepción se muestran por separado. Solo la oferta de la práctica base Consulta puede habilitar autogestión. Delegar una agenda no concede acceso al chat.

Secretaría sin agendas ve el directorio y solicita acceso a cada titular. El profesional puede rechazar o autorizar desde la bandeja visible al comienzo de su inicio; el alcance escrito excluye configurar horarios y conversaciones. Con acceso, secretaría ve calendario por profesional, espacios libres y recepción con **Registrar llegada → Pasar a atención → Finalizar atención**. Las incidencias usan color y texto; la reprogramación requiere `booking:reschedule` y conserva profesional y entidad.

Seleccionar una franja conserva profesional, agenda y horario en Nuevo turno. Paciente registrado consulta todos los vinculados, con paginación completa; Nuevo paciente permite verificar DNI, reutilizar o vincular una ficha local y dar de alta con nombre, apellido, DNI, correo, celular internacional y domicilio. La identidad documental se reutiliza entre instituciones sin revelar ni copiar sus fichas. Registrar al paciente crea el vínculo profesional; todavía falta registrar el turno. La autorización de contactos se confirma por separado.

El profesional dispone de **Agenda, Actividad y Aranceles**; el propietario independiente también ve **Mi personal** y puede operar sin secretario dentro de su entidad seleccionada. Actividad cuenta atención finalizada explícitamente, no horarios pasados. Los importes ARS/USD conservan versiones de referencia y no generan cobros. **Cancelar un período** previsualiza día, semana de lunes a domingo o mes y exige motivo y confirmación: cancela futuros, conserva iniciados o en atención/finalizados, suspende el intervalo, libera pre-reservas y registra reasignaciones y avisos. La entrega externa requiere canal configurado y destinos autorizados; local es simulada.

## Comprobar y compilar

```powershell
npm test
npm run build
npm run verify:strict
```

La compilación queda en `dist/salud-web/browser`. Para revisar esa compilación localmente, detené primero `npm start` y ejecutá:

```powershell
npm run preview
```

El servidor de vista previa también usa `127.0.0.1:4387`, incluye fallback de rutas y proxy `/api`. No reemplaza un servidor de producción. [Ejemplo de Caddy](deploy/Caddyfile.example) para servir la SPA y Spring bajo un mismo origen HTTPS; ajustá dominio, rutas y operación antes del despliegue.

## Arquitectura y estado

La revisión visual del 21/10/2026 incorpora tipografía ampliada en `rem`, texto de agenda sin atenuación, foco de mayor contraste, estados textuales y controles móviles más amplios. Jornada prioriza próximo turno y pendientes al apilarse; Hoy vuelve al momento actual. El calendario diario se recorre con flechas, Inicio y Fin después de enfocarlo; Enter activa el elemento elegido. La vista Lista ofrece otra forma de consultar los datos.

Los borradores de turnos y mensajes se conservan **solo en memoria** durante el mismo contexto. Se eliminan al cambiar entidad, rol o cuenta, salir de sesión, vencer la sesión o recargar. El borrador de turno incluye la opción de paciente y los seis datos de un alta incompleta; reabrir reconsulta el DNI y la disponibilidad según corresponda, y permite descartar el borrador. No registra ni reserva automáticamente un horario. La navegación incluye Ayuda con las tareas administrativas y el uso del teclado. Los formularios muestran las restricciones de cada campo y enfocan el primer error al intentar enviarlos.

La evidencia de esta revisión está en [verificación visual y funcional](../.impeccable/review/polish-2026-10-21.md).

El rediseño de roles del 27/10/2026 extiende Patio y conserva sus tokens. Su [documentación de cierre](../.impeccable/review/roles/documentation.md) enlaza el veredicto de revisión, las capturas y los resultados. Los scripts de navegador `verify-role-redesign.mjs` y `verify-agenda-access.mjs` usan Edge, Playwright disponible como módulo (o `PLAYWRIGHT_MODULE`) y `ROLE_TEST_URL` de loopback, por defecto `http://127.0.0.1:4392`. Desde la raíz se ejecutan con `node salud-web/scripts/<nombre>.mjs`. `verify-role-server.mjs` usa `ROLE_SERVER_URL` (por defecto `http://127.0.0.1:4387`) y la fixture local existente; los detalles de reproducción están en el documento 34. Son recorridos específicos y no sustituyen `verify:strict`.

La continuación de calendarios registra [evidencia y cierre documental](../.impeccable/review/calendar-evolution/documentation.md). La grilla distingue horario pasado, próximo, hora prevista actual, espera, atención y atendido mediante texto y color; el reloj no registra presencia. `verify-calendar-evolution.mjs` usa Edge, `PLAYWRIGHT_MODULE` y `ROLE_TEST_URL` de loopback (por defecto `http://127.0.0.1:4393`); opera sobre demostración ficticia. La comprobación final confirmó 99 pruebas Angular y 5 de dominio, build de producción, 54 pruebas de integración PostgreSQL y 12 unitarias de API. El veredicto visual se consulta en esa evidencia; no equivale a despliegue ni a entrega real de avisos.

- `core/api.client.ts`: transporte, CSRF, sesión y errores.
- `core/api-contracts.ts`: contratos de lectura tipados.
- `core/workspace.loader.ts`: adaptación de DTO y carga de instantáneas con fallos parciales explícitos.
- `core/workspace.store.ts`: señales compartidas, contexto, permisos y comandos.
- `core/staff.store.ts`: perfil, directorio sin pacientes, solicitudes al titular y estados explícitos de recepción.
- `core/booking-patients.ts`: búsqueda completa de pacientes vinculados, coincidencia local por DNI, alta y vínculo desde turno.
- `core/professional-workspace.ts`: actividad, aranceles y cancelación protegida por período.
- `core/domain.ts`: fechas, zonas horarias, conflictos y exportación segura.
- `pages/`: pantallas cargadas por ruta; formularios y selección locales.
- `ui/`: calendario compartido, panel de turno, estados e iconos.
- `ui/agenda-access-requests.ts`: bandeja del titular con alcance escrito, aprobación y rechazo.
- `src/styles.css`: tokens y estilos adaptables de Patio.

La integración de negocio, la fixture descartable con MFA y el comando completo `scripts/verify-strict.ps1` están en [pruebas estrictas](../docs/28-integracion-frontend-servidor-y-pruebas.md). Para probar con esa fixture, la vista previa admite `PORT=4390` y `BACKEND_PORT=18080`.

Ver [revisión de arquitectura y verificación](../docs/27-frontend-patio.md), [contexto del producto](../PRODUCT.md) y [sistema visual](../DESIGN.md).
