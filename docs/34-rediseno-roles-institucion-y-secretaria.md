# Rediseño de institución y secretaría

Fecha de cierre: 27 de octubre de 2026. Angular, Java 21/Spring Boot y PostgreSQL; extensión del sistema visual Patio.

Continuación posterior: [turnos, pacientes y espacio profesional](35-turnos-pacientes-y-espacio-profesional.md) registra el cambio autorizado de paleta temporal, identidad mínima global por DNI, alta desde turno, actividad, aranceles y cancelación por período. Este documento conserva la entrega de roles que le dio origen.

## Alcance y fuente de verdad

El pedido confirmado separa la administración de personas de la coordinación de la atención. Institución trabaja con perfiles y listas sin tablas; secretaría trabaja con un directorio cuando no tiene agendas autorizadas y con calendario y recepción cuando tiene al menos una. Las incidencias conservan color, texto y una acción comprensible.

Este documento registra las decisiones vigentes para esos recorridos. Reemplaza las afirmaciones de [administración institucional del 26/10](33-administracion-institucional.md) que reservaban la creación de cuentas a plataforma o permitían datos de pacientes al administrador con permisos explícitos. El resto de los documentos conserva su valor histórico; una referencia anterior no revoca este pedido. La continuidad entre entidades mantiene identidad e historial, sin transferir fichajes ni turnos.

Fuentes de esta implementación: [PRODUCT.md](../PRODUCT.md), [contrato de dirección](../.impeccable/roles-direction.md), [brief institucional](../.impeccable/surfaces/salud-web-src-app-pages-institution-ts.md), código actual y [cierre de documentación y evidencia](../.impeccable/review/roles/documentation.md). Los contratos generales permanecen en [salud-api/docs/API.md](../salud-api/docs/API.md); los endpoints nuevos se detallan aquí.

## Roles y límites

| Contexto | Trabajo y datos visibles | Límite |
| --- | --- | --- |
| Administración institucional | Perfiles profesionales, matrícula, vínculo, sedes, días y horarios publicados, estado «En jornada programada»; equipo y facultades; estructura de agendas; políticas y auditoría administrativa. | Sin pacientes, fichas, turnos, recepción, admisiones, avisos de atención ni conversaciones. Los permisos heredados no abren esos datos. |
| Secretaría sin agenda autorizada | Perfil propio y directorio profesional de la entidad, con sede, matrícula y horarios publicados; solicitud de acceso. | Pertenecer al equipo no concede lectura de turnos. El inicio no muestra un calendario vacío que sugiera acceso. |
| Secretaría con agenda autorizada | Jornada y calendario por profesional, espacios libres, turnos y recepción dentro de la delegación concedida. | Cada acción verifica su facultad por agenda. El acceso concedido por solicitud excluye horarios y chat. |
| Profesional titular | Agendas propias, bandeja de solicitudes al inicio y decisiones de aprobación o rechazo. Puede pedir vincularse a otra institución desde su perfil. | Solo resuelve accesos a sus agendas. El vínculo con una institución nueva no elimina vínculos anteriores. |

«En jornada programada» se calcula con día, hora local de la agenda y vigencia del horario publicado. No representa fichaje, presencia física ni atención efectiva. Esa disponibilidad fue expresamente autorizada para el administrador y no contiene pacientes ni ocupación de turnos.

La identificación institucional actual usa facultades vigentes de `members:manage`, `professionals:manage` o `policy:manage` dentro de la entidad. `Authorization` deniega `patients:manage`, `admissions:manage`, `notifications:manage`, las facultades de agenda y el acceso de paciente a esas cuentas. Las lecturas de atención aplican además `requireCare`. Este es el criterio implementado; una cuenta que combine tareas de administración y atención queda bajo la restricción institucional en ese contexto.

La navegación, `careGuard`, `WorkspaceStore.has` y `workspace.loader.ts` refuerzan la separación en Angular. El loader limpia agendas y permisos de atención heredados y evita solicitar fuentes de pacientes, avisos de atención y conversaciones para institución. La autorización del servidor sigue siendo obligatoria aunque se invoque una URL directamente.

## Flujos de cuenta y vínculo

### Crear una cuenta nueva

1. La administración autorizada elige añadir profesional o secretaría. Indica nombre de referencia y correo; para profesional también registra matrícula verificada.
2. El servidor exige `members:manage`; para crear un profesional exige además `professionals:manage`. Rechaza un correo ya existente y evita crear una identidad duplicada.
3. Crea cuenta activa, membresía local y, para profesional, vínculo profesional. Devuelve usuario por correo y contraseña provisoria aleatoria. El resultado permite entregar el acceso y ocultar las credenciales; no representa un correo enviado.
4. La contraseña provisoria vence a las 48 horas. Antes de entrar al espacio de trabajo, la persona debe elegir otra contraseña de 12 a 72 caracteres, diferente de la provisoria. El servidor revoca las credenciales y sesiones anteriores y establece la nueva sesión.

`SessionGuard` bloquea las rutas de negocio mientras haya cambio pendiente; el guard de Angular lleva a `/cambiar-clave`. La creación de cuenta o membresía no otorga por sí sola facultades administrativas ni delegaciones de agenda. El profesional conserva su rol aun si todavía no tiene agenda: `/workspace` devuelve el indicador `professional` a partir del vínculo activo.

### Vincular una cuenta profesional existente

Desde **Mi perfil → Vincularme a otra institución**, el profesional introduce el código de la institución de destino y su matrícula. La institución facilita ese código; la pantalla no ofrece un buscador público de entidades. Solo el profesional inicia la solicitud con su cuenta global existente.

La institución de destino ve la solicitud en **Profesionales → Quieren sumarse al equipo** y la aprueba o rechaza con `professionals:manage`. Aprobar crea o reactiva la membresía y el vínculo local usando la identidad existente. No cambia los datos de referencia globales de esa persona ni sus vínculos previos, y no devuelve facultades revocadas. Rechazar no concede acceso. Ambas decisiones dejan aviso de cuenta y auditoría.

Las solicitudes tienen estados `PENDIENTE`, `APROBADA` y `RECHAZADA`; una restricción de base impide duplicados pendientes para el mismo destino y alcance. No se implementó un traslado automático entre instituciones.

### Finalizar el vínculo local

La administración con `members:manage` revisa las consecuencias y confirma la baja. No puede darse de baja a sí misma. Los turnos futuros registrados y las pre-reservas vigentes bloquean la operación hasta que personal autorizado los resuelva o las pre-reservas venzan.

La baja revoca membresía, facultades locales, vínculo profesional y delegaciones locales, incluidas las de las agendas del profesional desvinculado. Conserva cuenta global, identidad, fichas, numeración, historial y los otros contextos. Genera `VINCULO_FINALIZADO` en `aviso_cuenta_staff`; `/account/staff-notices` consulta los avisos de la propia cuenta sin exigir conservar membresía en la institución que los originó. La pantalla **Mi perfil** muestra los avisos al operar en un contexto disponible. Esta entrega no demuestra un recorrido visual sin ninguna entidad restante.

## Perfil e inicio de secretaría

En el primer ingreso, **Hagamos lugar a tu jornada** exige únicamente nombre y apellido. DNI, domicilio, celular y foto son opcionales. El formulario explica esa condición y guarda el perfil personal; cambiar de institución no crea otra identidad.

La foto es contenido aportado por la persona. Se aceptan PNG, JPEG y WebP hasta 200 KB en la interfaz; sin foto se muestran iniciales. El servidor valida el tipo de data URL y limita el tamaño del campo. La evidencia visual de esta tanda cubre el estado sin foto, no una foto cargada.

Después de guardar, sin agendas autorizadas aparece el directorio con búsqueda por nombre, matrícula o sede y filtros **Todo el equipo / Mis agendas**. Cada perfil muestra el estado de acceso y permite solicitarlo al titular cuando hay agenda activa. Una solicitud pendiente muestra **Autorización pendiente**; tras rechazo puede volver a solicitarse. **Actualizar** recarga permisos y workspace para reflejar una autorización obtenida fuera de esa pantalla.

## Autorización del titular

Las solicitudes de agenda se presentan al comienzo del inicio profesional en **Solicitudes de acceso a tus agendas**. Cada fila identifica persona y agenda y permite **Rechazar** o **Autorizar agenda**. La bandeja escribe el alcance antes de la decisión: ver, registrar, confirmar, cancelar y reprogramar turnos de esa agenda. Excluye modificar horarios y acceder a conversaciones.

El servidor verifica propiedad de la agenda y `agenda:configure` para resolver la solicitud. Al aprobar concede únicamente:

- `agenda:read` y `booking:read`;
- `booking:create`, `booking:confirm`, `booking:cancel` y `booking:reschedule`.

No concede `agenda:configure` al solicitante ni lo convierte en participante del chat. La bandeja filtra solicitudes `AGENDA` pendientes de agendas propias, deshabilita acciones durante el guardado y muestra errores con `role="alert"` y estado ocupado. Resolver retira la solicitud pendiente y registra aviso para quien la inició. En demostración, el cambio de rol permite recorrer rechazo, nuevo pedido y aprobación dentro del mismo contexto ficticio.

## Jornada, recepción y reprogramaciones

Con al menos una agenda autorizada, el inicio de secretaría muestra calendario por profesional, selector de agendas y espacios libres para registrar un turno según `booking:create`. Las vistas diaria, semanal, mensual y lista conservan los controles del calendario compartido. En escritorio, recepción acompaña al calendario; con menos espacio se apila, y en teléfono el calendario conserva desplazamiento horizontal local y selector de agenda.

Recepción distingue asistencia confirmada de presencia registrada. **Registrar llegada** guarda `ESPERA`; **Pasar a atención** guarda `ATENCION`; **Finalizar atención** guarda `FINALIZADO` y retira el turno de la cola pendiente. Antes de registrar la llegada se lee **Llegada sin registrar**. El reloj no ejecuta esas transiciones. Leer recepción requiere `booking:read`; cambiar su estado requiere `booking:confirm`. La API acepta los tres estados explícitos y la interfaz presenta la secuencia normal; no se declara aquí una máquina de transiciones más restrictiva.

Las ausencias y los turnos afectados requieren seguimiento visible con cantidad, texto y color. El acceso **Reasignar turnos** lleva a las reprogramaciones. Personal con `booking:reschedule` puede buscar un nuevo horario para una suspensión o un turno cancelado afectado, conservando profesional, entidad y alcance autorizado. La operación vuelve a comprobar disponibilidad. No cancela toda la agenda ni mueve turnos automáticamente; no transfiere la atención a otro profesional o entidad. Registrar, confirmar asistencia, entregar un aviso, registrar presencia y conversar siguen siendo hechos separados.

## Endpoints y persistencia

Todas las rutas de la tabla son relativas a `/api/v1`. Las rutas de entidad se ejecutan con contexto tenant y actor; las rutas de cuenta actúan sobre la cuenta autenticada. Sesión, CSRF y MFA continúan según la configuración vigente.

| Método y ruta | Contrato y control principal |
| --- | --- |
| `POST /entities/{tenant}/staff-accounts` | `{name,email,role,registration}`; `role` es `PROFESIONAL` o `SECRETARIA`. `members:manage` y además `professionals:manage` para profesional. Respuesta `{id,email,temporaryPassword}`. |
| `POST /auth/provisional-password` | `{password}`; cambio obligatorio de clave provisoria vigente, diferente de la anterior; renueva sesión. |
| `GET /account/profile` | Perfil JSON de la cuenta autenticada. |
| `PUT /account/profile` | `{firstName,lastName,document,address,phone,photo}`; solo nombre/apellido obligatorios, conserva `complete:true` y actualiza nombre de cuenta. |
| `POST /account/institution-requests` | `{institutionId,name,registration}`; exige identidad profesional global activa y destino clínico activo; rechaza vínculo ya disponible. |
| `GET /account/institution-requests` | Últimas 100 solicitudes institucionales de la propia cuenta. |
| `GET /entities/{tenant}/staff-directory` | Miembro activo. Perfiles, matrícula, sede, agenda activa si existe y horarios vigentes; sin pacientes ni turnos. Incluye profesionales sin agenda. |
| `GET /entities/{tenant}/staff-requests` | Hasta 200 pendientes: solicitudes de institución para quien tiene `professionals:manage`, solicitudes de agenda para su titular. |
| `POST /entities/{tenant}/agendas/{agenda}/access-requests` | Miembro activo; rechaza administración institucional, agenda inactiva y acceso ya concedido. |
| `POST /entities/{tenant}/staff-requests/{id}/resolve` | `{approve}`; `professionals:manage` para vínculo institucional; titular y `agenda:configure` para acceso a agenda. |
| `GET /account/staff-notices` | Últimos 100 avisos propios, aun sin membresía vigente en la entidad de origen. |
| `POST /account/staff-notices/{id}/read` | Marca lectura del aviso propio; no requiere membresía en la entidad de origen. |
| `GET /entities/{tenant}/reception?agendaId=...` | `booking:read` en esa agenda; estados de versiones de turno vigentes en la ventana de dos días anteriores a dos días posteriores al momento actual. |
| `PUT /entities/{tenant}/appointments/{id}/reception` | `{state:"ESPERA"|"ATENCION"|"FINALIZADO"}`; turno registrado y `booking:confirm` en la agenda. |
| `DELETE /entities/{tenant}/members/{id}` | Baja local con `members:manage`, bloqueos y aviso de cuenta descritos arriba. |
| `GET /entities/{tenant}/workspace` | Permisos efectivos, agendas y proyecciones autorizadas; incluye `professional` por vínculo aunque no haya agenda. |

`StaffExperienceController` concentra perfil, directorio, solicitudes, avisos y recepción. `IdentityService`, `AuthController` y `SessionGuard` incorporan la credencial provisoria. `OrganizationController`, `WorkspaceController` y `Authorization` conservan la frontera institucional y la identidad global.

La migración **V11__staff_experience.sql** añade a `cuenta` el cambio pendiente, el vencimiento de clave provisoria y el perfil JSON. Crea `solicitud_vinculo_staff`, `aviso_cuenta_staff` y `recepcion_turno`, con claves de entidad y RLS forzada. Las solicitudes y avisos tienen alcance por entidad o por actor propio; recepción se aísla por entidad. Los controles de autorización por operación se mantienen además de RLS. V10, correspondiente a la fecha de creación de admisión, se conserva; no se renumeró ni se reemplazó una migración aplicada.

## Sistema visual y composición

Se conserva **Patio**: Nunito Sans local, verde funcional, navegación celadón, lienzo claro, paneles planos, bordes finos, SVG del sistema e iniciales. Las tarjetas de perfil, las listas de equipo y sedes, el feed de auditoría, la recepción y la bandeja del titular son composiciones locales. No crean una identidad ni una escala de tokens nueva. Los estados urgentes usan rojo y texto; pendientes usan ámbar y texto; los colores de agenda siguen identificando agendas.

[DESIGN.md](../DESIGN.md) y [.impeccable/design.json](../.impeccable/design.json) se conservaron intactos tras comparar las fuentes y muestras. Los nuevos briefs mantienen las decisiones específicas fuera del sistema global. [El cierre documental](../.impeccable/review/roles/documentation.md) registra hashes, comparación y desajustes previos, sin afirmar conformidad visual de toda la aplicación. No se creó ni se sirve un raster nuevo; las capturas son evidencia de revisión y la foto opcional es aportada por la persona.

## Validación y estado local

Resultados del cierre de implementación, con alcances separados:

- **Angular y dominio:** 92 pruebas Angular y 5 de dominio aprobadas; `npm run build` aprobado. Este pase documental no volvió a ejecutarlos.
- **API:** 48 integraciones completas aprobadas antes del último ajuste de identidad; después pasaron 6 casos finales y, sobre el ajuste más reciente, 2 integraciones específicas de identidad y privacidad. El último informe `salud-api/target/failsafe-reports/ar.com.salud.PostgresIntegrationIT.txt` registra 2 pruebas, 0 fallos, 0 errores y 0 omitidas. No se presenta ese resultado como una nueva ejecución completa de las 48 integraciones.
- **Recorridos del rediseño:** [checks.json](../.impeccable/review/roles/checks.json) registra 9 recorridos sin errores en 1440, 1280 y 390 px: institución, recepción/directorio y primer ingreso.
- **Autorización completa desde la interfaz:** [access-checks.json](../.impeccable/review/roles/access-checks.json) registra 3 recorridos sin errores, uno por ancho: solicitud sin acceso → rechazo → nuevo pedido → aprobación → jornada con una única agenda y sin chat. Es evidencia de demostración, no un nuevo extremo a extremo de ese recorrido con cuentas de API real.
- **Regresión institucional:** 18 recorridos de `verify-institution.mjs`, adaptados a perfiles, aprobados; evidencia en `.impeccable/review/roles-regression/`.
- **Servidor local final:** `verify-role-server.mjs` pasó de nuevo después del empaquetado final en `http://127.0.0.1:4387`. [server-checks.json](../.impeccable/review/roles/server-checks.json) registra `failures: []` para ingreso institucional y las pantallas comprobadas; [server-admin-1440.png](../.impeccable/review/roles/server-admin-1440.png) muestra esa cuenta local con la API actual. La comprobación de readiness de la API en el puerto 8080 devolvió `UP`.
- **Revisión de acabado:** [finish-review.md](../.impeccable/review/roles/finish-review.md) conserva los hallazgos iniciales; [verdict-pass.md](../.impeccable/review/roles/verdict-pass.md) dispone `ship` para sus dos correcciones: bandeja del titular y etiquetas legibles de facultades/auditoría. Ese veredicto no amplía la cobertura a toda la aplicación.

`api-final-tests.log` conserva un fallo histórico de empaquetado por un JAR abierto, resuelto en el empaquetado final posterior. Los logs históricos no se borraron. `scripts/start-api-local.ps1` ejecuta una copia con nombre de versión en `output` para permitir nuevas compilaciones, conserva la base y admite `-Restart` únicamente sobre el proceso reconocido de esta API y su puerto. Reiniciar puede requerir otro ingreso. La entrega incluye el backend empaquetado y la API local actualizada; no se desplegó producción ni se realizaron envíos reales.

### Reproducir los recorridos de navegador

Con Playwright disponible como módulo (o ruta en `PLAYWRIGHT_MODULE`), Edge instalado y frontend actual accesible en loopback, desde la raíz:

```powershell
$env:ROLE_TEST_URL = 'http://127.0.0.1:4392'
node salud-web/scripts/verify-role-redesign.mjs
node salud-web/scripts/verify-agenda-access.mjs
```

Para la comprobación institucional contra API real, el script requiere la fixture existente `local-data/escenarios-integrales/escenarios.json`, una cuenta admin habilitada y el servidor actualizado:

```powershell
$env:ROLE_SERVER_URL = 'http://127.0.0.1:4387'
node salud-web/scripts/verify-role-server.mjs
```

Los scripts solo admiten origen de loopback. No deben sustituirse sus datos por credenciales de producción. Las pruebas normales de frontend se ejecutan desde `salud-web` con `npm test` y `npm run build`; los detalles de integración del servidor están en [pruebas estrictas](28-integracion-frontend-servidor-y-pruebas.md).

## Límites de la entrega

La revisión visual cubre los estados y tamaños identificados, no una auditoría de accesibilidad integral ni todas las combinaciones de permisos. El detector mecánico dejó un único aviso por `[src]` condicional de la foto; el revisor lo identificó como falso positivo al estar bajo `@if(form.photo)`, con iniciales como alternativa. No se ejecutó de nuevo el detector en el cierre documental ni se certificó visualmente una foto subida.

Las lecturas de solicitudes/avisos tienen los límites indicados y la proyección de recepción usa una ventana cercana al momento actual; no se promete historial ilimitado en esas pantallas. La aprobación no concede chat ni configuración de horarios. No hay nueva transferencia de profesionales, fichajes o turnos, ni cancelación general automática, historia clínica, facturación o envíos reales en la demostración. El drift previo de configuración/buildPath de Impeccable y los ejemplos históricos del sidecar no se repararon como efecto lateral.
