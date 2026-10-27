# 31. Relevamiento de errores HTTP y mensajes entregados

Fecha: **23/10/2026**. Alcance: código actual de `salud-api`, cliente HTTP y pantallas de `salud-web`, y configuración de los servidores web incluidos en el repositorio.

Se identificaron **64 puntos de emisión explícita en Java**, que corresponden a **57 combinaciones distintas de código HTTP y mensaje**. A esto se agregan las respuestas automáticas de Spring, los mensajes de respaldo del frontend y los fallos de transporte o infraestructura. Este documento describe el comportamiento existente; no modifica los mensajes ni las reglas de negocio.

La matriz de negocio surge de la lectura del código. Se comprobó el procesamiento HTTP con **29 verificaciones aisladas de Spring MVC/Security** y el comportamiento del frontend con **44 pruebas existentes aprobadas**. No se reprodujeron las 57 situaciones contra una base de datos ni contra proveedores externos.

## 1. Qué mensaje termina viendo la persona

El cliente común, `ApiClient.exchange`, aplica este orden:

1. Si la respuesta HTTP de error contiene un JSON con `detail` de tipo texto y no vacío, muestra **ese texto tal como llegó**.
2. Si no encuentra ese detalle, usa el mensaje de respaldo correspondiente al código HTTP.
3. Si el código no tiene respaldo específico, usa **«No pudimos completar la operación.»**.

El cliente no usa `title`, `message`, errores por campo ni un código funcional para elegir el texto. Esto explica por qué pueden aparecer mensajes en inglés aunque exista un respaldo en castellano. Un JSON que solo contenga `message` tampoco reemplaza el respaldo.

En las pantallas, los errores de acceso, pacientes, catálogo, comunicaciones, reportes y turnos normalmente se presentan mediante `Error.message`. Hay excepciones: alertas globales de sesión/MFA, errores de carga parcial y mensajes posteriores a una escritura exitosa, detallados en la sección 7.

Las respuestas controladas de MVC usan Problem Details con `status`, `title`, `detail` e `instance`. Los filtros de seguridad escriben `type: "about:blank"`, `title`, `status` y `detail`; no agregan `instance`. El cuerpo no es uniforme para CORS, errores internos no controlados ni todos los servidores web.

Ejemplo de conflicto de agenda, con ruta ilustrativa:

```json
{
  "status": 409,
  "title": "Conflict",
  "detail": "Horario no disponible.",
  "instance": "/api/v1/entities/{tenant}/holds"
}
```

## 2. Distribución de mensajes explícitos de la API

| HTTP | Significado en este proyecto | Mensajes distintos |
| --- | --- | ---: |
| 400 | Datos, parámetros, encabezados o reglas de entrada inválidos | 17 |
| 401 | Autenticación, sesión, Google, MFA o firma de callback | 7 |
| 403 | Solicitud no autorizada o MFA pendiente | 2 |
| 404 | Recurso no visible o listado no disponible | 2 |
| 409 | Conflictos de horario, estado, cobertura, acceso o configuración | 22 |
| 412 | Versión del turno desactualizada | 1 |
| 428 | Falta la versión requerida del turno | 1 |
| 429 | Exceso de solicitudes o cuota de reservas activas | 2 |
| 500 | Fallo al generar un reporte | 1 |
| 503 | Acceso a datos fallido o Google no configurado | 2 |
| **Total** | **Pares únicos de estado y texto; sin contar respuestas automáticas** | **57** |

Para abreviar las rutas de las tablas: **A** = `/api/v1/auth`; **B** = `/api/v1/entities/{tenant}`. Las referencias como `BookingService:58` indican archivo y línea, con enlaces a cada archivo en la sección 10.

## 3. Autenticación, sesión y seguridad

| HTTP | Situación que produce el rechazo | Ruta o alcance | Mensaje exacto de la API | Fuente |
| --- | --- | --- | --- | --- |
| 401 | Se solicita una ruta protegida sin autenticación válida | Cualquier ruta protegida | Autenticación requerida. | SecurityConfiguration:56 |
| 401 | La sesión persistida venció, fue revocada, dejó de existir o la cuenta dejó de estar activa | Peticiones con sesión autenticada | Sesión vencida o revocada. | SessionGuard:24 |
| 401 | Contraseña incorrecta, cuenta inexistente o estado distinto de `ACTIVA` | `POST A/login`; también comprobación de contraseña al vincular Google o enrolar MFA | Credenciales inválidas. | IdentityService:50 |
| 401 | El código TOTP no coincide con la ventana admitida o ya fue usado | `POST A/mfa/verify` | Código inválido o ya utilizado. | MfaService:39 |
| 401 | La identidad Google no está vinculada a una cuenta activa | `POST A/google` | Vincule Google desde su cuenta verificada mediante correo. | GoogleController:34 |
| 401 | Token Google inválido; nonce ausente, usado, vencido o distinto; audiencia, sujeto o `azp` inválidos | `POST A/google`, `POST A/google/link` | Identidad Google inválida. | GoogleController:53 |
| 401 | Firma de callback inválida; timestamp inválido o fuera de ±300 segundos; secreto menor de 32 caracteres; cuerpo mayor de 16.384 caracteres; fallo al calcular/verificar HMAC | `POST /api/v1/delivery-events` | Firma de callback inválida. | DeliveryWebhookController:24–29,47 |
| 403 | Falta o es inválido CSRF, o se deniega una facultad, contexto, ficha, agenda, representación o conversación | Escrituras protegidas y controles de autorización | Solicitud no autorizada. | SecurityConfiguration:58; ApiExceptionHandler:29 |
| 403 | La cuenta requiere MFA y la sesión actual aún no lo verificó | Rutas `/api/v1/` fuera de `/api/v1/auth/` | Verificación MFA requerida. | SessionGuard:31 |
| 409 | Se intenta enrolar MFA cuando ya existe un factor verificado y no revocado | `POST A/mfa/enroll` | Factor ya configurado. | MfaService:25 |
| 400 | No se envía la contraseña actual para vincular Google | `POST A/google/link` | Verifique su contraseña actual. | GoogleController:40 |
| 503 | No se configuró `GOOGLE_CLIENT_ID` | `GET A/google/nonce`, `POST A/google`, `POST A/google/link` | Google no está configurado en este entorno. | GoogleController:55 |
| 429 | Se superó alguno de los límites de frecuencia indicados debajo | Autenticación, MFA, solicitudes de admisión y envío de chat | Espere antes de reintentar. | IdentityService:42 |

El mismo texto 403 reemplaza mensajes internos como «Facultad no concedida», «Contexto no autorizado», «Sin facultad de ficha», «Sin facultad de coordinación», «Pre-reserva de otro actor», «Práctica de gestión asistida», «Participantes explícitos requeridos» y «Sin permiso de conversación». Esos motivos internos **no se entregan** como `detail`.

Para una práctica que requiere gestión asistida, consultar disponibilidad desde el portal puede devolver el 403 genérico, mientras que intentar adquirir una pre-reserva devuelve el 409 específico «Esta práctica requiere gestión de personal autorizado.». En MFA, un código que no tiene exactamente seis dígitos se rechaza por validación con 400; uno de seis dígitos que no es válido se rechaza con el 401 indicado arriba.

Los límites de frecuencia comparten una ventana de **15 minutos**: login, 80 intentos por IP y 15 por email; recuperación, 30 por IP y 3 por email; reset, 30 por IP; Google, 30 por IP; verificación MFA, 10 por cuenta; admisión, 10 por cuenta; envío de chat, 60 por cuenta. Se rechaza al superar el límite. La comprobación de contraseña al enrolar MFA o vincular Google también usa los contadores del login. No se define un encabezado `Retry-After` ni se comunica un tiempo restante en estas respuestas.

El perfil `local` desactiva la obligación general de MFA para personal. Un factor ya enrolado y verificado sigue requiriendo MFA en una sesión nueva.

## 4. Datos, parámetros y configuración: HTTP 400

Esta tabla completa los 17 textos explícitos 400; «Verifique su contraseña actual.» está en la sección anterior.

| Situación | Ruta o alcance | Mensaje exacto de la API | Fuente |
| --- | --- | --- | --- |
| No se indica agenda ni paciente al listar turnos | `GET B/appointments` | Indique agendaId o patientId. | BookingController:71 |
| `Idempotency-Key` recibido vacío, en blanco o con más de 100 caracteres | `POST B/holds`, `B/appointments`, `B/appointments/{id}/reschedule`, `B/agendas/{agenda}/absences` | Idempotency-Key requerido, de hasta 100 caracteres. | BookingService:197 |
| `If-Match` no contiene un entero positivo de hasta 18 cifras, entre comillas dobles | Confirmar, cancelar o reprogramar un turno | If-Match debe contener la versión entre comillas. | BookingController:88 |
| Falta `agendaId` en los listados que lo necesitan | `GET B/workspace/lists/{resource}`: `management-requests`, `rescheduling-cases`, `offers`, `hours` | agendaId requerido. | WorkspaceQueryController:46 |
| `until` no es posterior a `from`, o la diferencia supera 93 días | `GET B/workspace/appointments` | El rango debe abarcar de 1 a 93 días; hasta es exclusivo. | WorkspaceQueryController:65 |
| La oferta seleccionada pertenece a otra agenda | `GET B/workspace/agendas/{agenda}/booking-patients/{patient}/eligibility` | La oferta no corresponde a la agenda. | WorkspaceQueryController:120 |
| Se asigna una facultad fuera de las nueve admitidas para membresías | `POST B/members` | Permiso no asignable a membresía. | OrganizationController:73 |
| Hora final no posterior a la inicial, o fecha final anterior a la inicial | `POST B/agendas/{agenda}/hours` | Horario o vigencia inválida. | OrganizationController:116 |
| Se delega una acción fuera de las siete admitidas para agenda | `POST B/agendas/{agenda}/delegations` | Acción no delegable por agenda. | OrganizationController:128 |
| Se habilita elección en portal para una práctica distinta de la Consulta base | `POST B/agendas/{agenda}/offers` | Solo la Consulta base permite elección en portal. | OrganizationController:157 |
| Se concede a un representante una facultad fuera de las ocho admitidas | `POST B/patients/{id}/representations` | Facultad de representación inválida. | PatientController:129 |
| Autorización o convenio: fin no posterior al inicio. Afiliación: fin anterior al inicio | `POST B/coverage-authorizations`, `B/agreements`, `B/patients/{id}/affiliations` | Vigencia inválida. | PatientController:163,170,178 |
| Fechas invertidas, diferencia mayor de 30 días o formato distinto de `csv`, `xlsx`, `pdf` | `GET B/reports/appointments` | Rango máximo 31 días; formatos csv, xlsx o pdf. | ReportController:27 |
| La exportación incluye más de 1.000 turnos | `GET B/reports/appointments` | Reduzca el rango: más de 1000 turnos. | ReportController:31 |
| Callback firmado cuyo JSON no se puede interpretar o cuyos campos comprobados no son válidos | `POST /api/v1/delivery-events` | Evento inválido. | DeliveryWebhookController:31,33 |
| Se propaga `DateTimeException`, por ejemplo al resolver una zona horaria inválida | Operaciones MVC que usan fechas, horas o zonas | Fecha, hora o zona horaria inválida. | ApiExceptionHandler:17 |

**Diferencias de entrada que cambian el mensaje:** si falta por completo `Idempotency-Key`, Spring rechaza la solicitud antes de entrar al servicio y devuelve su mensaje automático en inglés. Lo mismo ocurre con otros encabezados o parámetros obligatorios. Una fecha inválida durante la conversión del JSON o de un parámetro puede generar el mensaje automático de lectura/conversión, en lugar del texto de `DateTimeException`.

## 5. Conflictos funcionales: HTTP 409

| Situación | Operación afectada | Mensaje exacto de la API | Fuente |
| --- | --- | --- | --- |
| Un paciente intenta reservar una práctica sin elección habilitada en portal o distinta de la Consulta base | Crear pre-reserva; también adquisición del reemplazo al reprogramar | Esta práctica requiere gestión de personal autorizado. | BookingService:28 |
| El paciente intenta reservar con menos de 48 horas de anticipación | Crear pre-reserva/reemplazo | Un turno cercano requiere atención del personal. | BookingService:43 |
| La pre-reserva no está activa o ya venció | Convertir pre-reserva en turno | La pre-reserva venció o ya fue utilizada. | BookingService:58 |
| La oferta dejó de estar habilitada en portal para el paciente | Convertir pre-reserva en turno | Oferta ya no disponible en portal. | BookingService:64 |
| La ocupación ya no se puede convertir a turno | Registrar o reprogramar | Capacidad vencida. | BookingService:67,125 |
| El turno no está `REGISTRADO` | Confirmar o reprogramar | Turno no vigente. | BookingService:89,111 |
| El paciente confirma cuando faltan 24 horas o menos | Confirmar asistencia | Plazo de confirmación finalizado. Contacte al personal. | BookingService:91 |
| El paciente enviado no es el del turno original | Reprogramar | Paciente no corresponde al turno. | BookingService:112 |
| El paciente intenta reprogramar una práctica original distinta de la Consulta base | Reprogramar | Reprogramación asistida requerida para esta práctica. | BookingService:116 |
| El reemplazo corresponde a otro vínculo de profesional y entidad | Reprogramar; consultar disponibilidad/elegibilidad de reemplazo | El reemplazo requiere el mismo profesional y entidad. | BookingService:117,186 |
| El intervalo de ausencia termina antes del inicio o en el mismo instante | `POST B/agendas/{agenda}/absences` | Intervalo inválido. | BookingService:140 |
| El intervalo completo, incluida preparación y cierre, cruza de día o no está contenido en un horario vigente | Crear o convertir una pre-reserva; reprogramar | Fuera del horario habilitado. | BookingService:164 |
| Existe una excepción de agenda que se superpone | Crear o convertir una pre-reserva; reprogramar | Horario no disponible. | BookingService:165 |
| Se envía una autorización sin afiliación | Reservar o revalidar elegibilidad | Una autorización requiere una afiliación verificada. | BookingService:170 |
| Se intenta reservar sin afiliación y la oferta no permite atención particular | Reservar o revalidar elegibilidad | La oferta no admite modalidad particular. | BookingService:171 |
| Se consulta un reemplazo para un paciente distinto o un turno no registrado | Disponibilidad/elegibilidad para reprogramación | Turno no vigente o paciente incompatible. | BookingService:184 |
| Se repite la clave de una operación con otros datos | Pre-reserva, registro, reprogramación o ausencia | Clave de idempotencia reutilizada con otros datos. | BookingService:201 |
| Violación de integridad de datos: por ejemplo, superposición global del profesional, duplicado, referencia inválida o restricción de estado | Operaciones MVC de escritura | Conflicto de horario, estado o referencia. Revise la operación. | ApiExceptionHandler:21 |
| Se aprueba una admisión para otra cuenta o vínculo profesional | `POST B/admissions/{id}/approve` | La aprobación debe corresponder a la solicitud. | PatientController:64 |
| Se revoca una membresía profesional que aún tiene turnos futuros registrados | `DELETE B/members/{id}` | Resuelva los turnos futuros del profesional antes de finalizar el vínculo. | OrganizationController:83 |
| El profesional intenta iniciar una conversación sin actuar como paciente o representante habilitado | `POST B/conversations` | La conversación debe iniciarla el paciente o representante habilitado. | CommunicationController:49 |

El mensaje 409 restante es **«Factor ya configurado.»**, documentado en la sección 3. Por tanto, hay 22 textos 409 distintos. Los controles de anticipación y plazo de confirmación indicados aquí permiten la intervención del personal con la facultad correspondiente.

Una repetición válida de una clave con los mismos datos puede recuperar el resultado anterior sin generar error. Cancelar un turno ya cancelado o confirmar uno ya confirmado también puede responder correctamente si se cumplen las precondiciones de versión.

## 6. Recursos, concurrencia, cuotas y fallos del servicio

| HTTP | Situación | Ruta o alcance | Mensaje exacto de la API | Fuente |
| --- | --- | --- | --- | --- |
| 404 | Una consulta que exige un resultado no devuelve filas visibles | Cualquier uso de `Db.one` | Recurso no visible. | Db:21 |
| 404 | El nombre de listado no está admitido | `GET B/workspace/lists/{resource}` | Listado no disponible. | WorkspaceQueryController:54 |
| 412 | La versión enviada no coincide con `version_concurrencia` | Confirmar, cancelar o reprogramar | El turno cambió desde que se abrió. Actualice y revise la nueva versión antes de continuar. | BookingService:191 |
| 428 | Falta `If-Match` | Confirmar, cancelar o reprogramar | If-Match es requerido para modificar un turno. | BookingController:87 |
| 429 | Pre-reservas activas no vencidas más turnos futuros registrados alcanzan la cuota del paciente | Crear pre-reserva; también reemplazo al reprogramar | Límite de reservas activas alcanzado. | BookingService:33–37 |
| 500 | Falla la construcción o serialización del archivo de reporte | `GET B/reports/appointments` | No se pudo generar el reporte. | ReportController:34–40 |
| 503 | Una operación MVC propaga `DataAccessException`, salvo la violación de integridad tratada como 409 | Acceso a base de datos dentro de MVC | Operación temporalmente no disponible. | ApiExceptionHandler:25 |

El segundo texto 429 es **«Espere antes de reintentar.»** y el segundo texto 503 es **«Google no está configurado en este entorno.»**, incluidos en la sección 3.

**Casos concretos que actualmente terminan en el 404 genérico «Recurso no visible.»:** token de activación/reset inexistente, vencido, usado o revocado; factor MFA inexistente; oferta inexistente, inactiva o fuera de vigencia; paciente o vínculo inactivo; afiliación no verificada, de otro paciente o no vigente; convenio no aplicable; autorización ausente, incompatible o no vigente; plan de cobertura no válido; recurso filtrado por aislamiento de entidad. No hay un texto específico para distinguir estos motivos.

La cuota de reservas se obtiene de la política operativa vigente y cuenta también turnos confirmados. No equivale al límite de frecuencia de autenticación. Durante una reprogramación se excluye el turno original del cómputo antes de adquirir el reemplazo.

Los errores de base de datos que ocurren **dentro de un filtro**, como `SessionGuard`, no pasan por el manejador MVC descrito aquí. No puede garantizarse para ellos el 503 con ese mensaje.

## 7. Presentación y mensajes de respaldo en el frontend

### 7.1. Respaldo por HTTP cuando falta un `detail` utilizable

| HTTP | Texto exacto de respaldo |
| --- | --- |
| 400 | Revisá los datos ingresados. |
| 401 | La sesión venció. Volvé a ingresar. |
| 403 | No tenés permiso para esta acción. |
| 404 | El recurso ya no está disponible en este contexto. |
| 409 | El horario o el estado cambió. Actualizá la agenda y elegí nuevamente. |
| 412 | El turno cambió. Actualizá y revisá la nueva versión antes de repetir la acción. |
| 428 | Actualizá el turno antes de modificarlo: falta su versión actual. |
| 429 | Se alcanzó el límite de solicitudes. Esperá un momento. |
| 503 | El servicio no está disponible. Volvé a intentar. |
| Otros, incluidos 405, 406, 415, 500 y 502 | No pudimos completar la operación. |

### 7.2. Reacciones adicionales de la interfaz

| Situación | Comportamiento y texto |
| --- | --- |
| HTTP 401 en una ruta distinta de `/auth/…` | Activa `expired`, borra el CSRF en memoria y vacía datos/permisos del espacio. La vista general agrega: **«Tu sesión venció. Volvé a ingresar para continuar.»**, con enlace para ingresar. El error de la operación puede aparecer además. |
| HTTP 401 en `/auth/…` | Muestra el error de la operación. No activa automáticamente `expired`; un código MFA incorrecto no se convierte en un aviso global de sesión vencida. |
| HTTP 403 con `detail` que contiene literalmente `MFA` | Activa `mfaRequired`. La vista general muestra **«Completá la verificación de dos pasos para acceder a tus agendas.»**. Al seleccionar entidad desde acceso, se navega a `/mfa`. |
| HTTP 412 al guardar, confirmar o cancelar desde el panel de turno | Presenta el mensaje recibido y solicita una actualización del turno. No repite automáticamente el comando rechazado. |
| Falla una sección del espacio, pero otras cargan | Conserva las secciones disponibles y agrega **`{sección}: {mensaje}`**. La vista general indica **«Hay {cantidad} secciones que no se pudieron cargar.»**. |
| Falla una agenda al consultar turnos/reportes | Agrega el nombre de la agenda al mensaje, por ejemplo **`Turnos · {agenda}: {mensaje}`** o **`{agenda}: {mensaje}`** en reportes. |
| Una escritura se guardó, pero falló la recarga posterior del espacio | Reemplaza el error de recarga por **«La acción se guardó, pero no se pudo actualizar la vista. Volvé a cargar el espacio.»**. |
| Un mensaje de chat se envió, pero falló la recarga de la conversación | Agrega **«Mensaje enviado. Actualizá la conversación para ver la respuesta.»**. |
| Se cargaron mensajes, pero falló registrar alguna lectura | Entrega **«Los mensajes se cargaron, pero no pudimos registrar todas las lecturas. Volvé a abrir la conversación.»**. |

`ApiError` conserva el encabezado `X-Correlation-ID` si llega, pero las pantallas revisadas no muestran ese identificador. `RequestAuditFilter` lo genera para las solicitudes que lo atraviesan; rechazos anteriores, como CSRF o CORS, pueden no tenerlo.

### 7.3. Errores creados por el cliente, sin ese estado HTTP entregado por el servidor

| Estado local de `ApiError` | Situación | Mensaje exacto |
| --- | --- | --- |
| 0 | GET/descarga sin conexión o fallo de red | No hay conexión con el servidor. Volvé a intentar. |
| 0 | GET/descarga supera los 30 segundos de espera | El servidor tardó demasiado. Volvé a intentar. |
| 0 | Se interrumpe una escritura o vence su espera; su resultado es incierto | Se interrumpió la conexión y no pudimos confirmar el resultado. Revisá el estado antes de repetir la acción. |
| 502 | Respuesta HTTP exitosa de lectura que el decodificador no puede interpretar; por ejemplo, JSON mal formado o token CSRF no válido | La respuesta del servidor está incompleta o no es válida. Volvé a cargar la vista. |
| 502 | Respuesta HTTP exitosa de escritura cuyo resultado no puede interpretarse | El servidor respondió, pero no pudimos interpretar el resultado. Actualizá el estado antes de repetir la acción. |
| 428 | Se pasa `expectedVersion` y no es un entero seguro positivo | Actualizá el turno antes de modificarlo: falta su versión actual. |

Los estados locales 0 y 502 no prueban que el servidor haya respondido con esos códigos. El 428 local impide enviar la modificación, aunque antes puede haberse solicitado el token CSRF. Una respuesta vacía puede aceptarse; este cliente no valida por completo el esquema de cada JSON exitoso. Las descargas se decodifican como `Blob`.

Si falla obtener CSRF, no se envía la escritura. La petición de CSRF es un GET: sus fallos usan los textos de lectura. El transporte no reintenta automáticamente las operaciones.

## 8. Respuestas automáticas de Spring y de infraestructura

### 8.1. Spring MVC / Security

Estos ejemplos se comprobaron con las dependencias instaladas del proyecto, `ApiExceptionHandler` y, para seguridad/CORS, `SecurityConfiguration`. Los valores entre llaves son variables según la solicitud.

| HTTP | Situación | `detail` o cuerpo recibido | Resultado en el cliente |
| --- | --- | --- | --- |
| 400 | Cuerpo JSON que incumple Bean Validation: por ejemplo campo obligatorio vacío, email inválido, longitud o fecha no admitidos | `Invalid request content.` | Se muestra ese texto en inglés. No se incluye una lista propia de mensajes por campo. |
| 400 | JSON mal formado, cuerpo requerido ausente o fallo de lectura del cuerpo | `Failed to read request` | Se muestra ese texto en inglés. |
| 400 | Falta un parámetro obligatorio | `Required parameter '{nombre}' is not present.` | Se muestra ese texto en inglés. |
| 400 | Falta un encabezado obligatorio, por ejemplo `Idempotency-Key` o los de delivery | `Required header '{nombre}' is not present.` | Se muestra ese texto en inglés. |
| 400 | Conversión inválida de UUID, número u otro parámetro/ruta | `Failed to convert '{nombre}' with value: '{valor}'` | Se muestra ese texto en inglés; puede incluir el valor recibido. |
| 400 | Restricción de parámetro de método, por ejemplo `limit=501` con máximo 500 | `Validation failure` | Se muestra ese texto en inglés. |
| 403 | Origen CORS rechazado | Cuerpo de texto: `Invalid CORS request`, sin Problem Details | En una llamada bloqueada por el navegador normalmente se recibe un fallo de red, estado local 0. Si el cliente recibe el HTTP sin JSON, aplica el respaldo 403. |
| 404 | Ruta sin controlador ni manejador de recursos | `No endpoint {MÉTODO} {ruta}.` | Se muestra ese texto en inglés. |
| 404 | Ruta atendida por el manejador de recursos estáticos, sin archivo existente | `No static resource {recurso}.` | Se muestra ese texto en inglés. |
| 405 | Método no soportado para la ruta | `Method '{MÉTODO}' is not supported.` | Se muestra ese texto en inglés. |
| 406 | El `Accept` solicitado no admite una representación disponible | `Acceptable representations: […].` | Se muestra el listado en inglés; depende de los conversores de esa respuesta. |
| 415 | `Content-Type` no soportado, por ejemplo `text/plain` para JSON | `Content-Type 'text/plain' is not supported.` | Se muestra ese texto en inglés. |

La validación sucede antes del método de negocio. La ausencia de sesión, un CSRF inválido o MFA pendiente puede impedir llegar a la situación funcional que se desea probar. En particular, una escritura anónima sin CSRF puede devolver **403** antes del **401** por falta de autenticación.

### 8.2. Servidores web incluidos en el proyecto

Revisión de configuración y código; estos escenarios no se reprodujeron contra Caddy ni contra el servidor de preview.

| Componente | HTTP / situación | Mensaje o cuerpo definido |
| --- | --- | --- |
| `salud-web/scripts/preview.mjs` | 503: no puede conectarse al backend | JSON `detail`: **«El servidor no está disponible en el puerto {BACKEND_PORT}.»**; puerto predeterminado 8080. La interfaz prioriza este mensaje. |
| Preview | 405: método distinto de GET/HEAD para contenido estático | Cuerpo vacío. |
| Preview | 403: ruta de archivo resuelta fuera de la raíz | Cuerpo vacío. |
| Preview | 404: archivo no disponible o ruta estática no procesable | **«Archivo no disponible.»**, como texto. |
| `salud-web/deploy/Caddyfile.local` | Error manejado por Caddy; por ejemplo fallo del proxy con estado 502 | JSON `detail`: **«El servidor no está disponible. Volvé a intentar.»**; conserva `{err.status_code}`. No reemplaza necesariamente las respuestas HTTP normales que ya entregó la API. |
| `salud-web/deploy/Caddyfile.example` | Fallos del proxy o servidor estático | No define un mensaje de error propio: depende de la respuesta de Caddy o del upstream. |

### 8.3. Excepciones internas no controladas

No existe un manejador general `@ExceptionHandler(Exception.class)`. Para el manejo de error de Spring Boot se configura `include-message: never`, `include-stacktrace: never` e `include-binding-errors: never`. Por tanto, no hay un `detail` funcional propio garantizado para todos los 500. Cuando falta, el frontend usa **«No pudimos completar la operación.»**.

Los errores de configuración que impiden arrancar la aplicación —clave de cifrado inválida, configuración de producción, bootstrap o CORS con comodines— no son mensajes HTTP de una API operativa. Un cliente podría ver después un error del proxy o de conexión.

## 9. Hallazgos para revisar

| Hallazgo | Efecto actual |
| --- | --- |
| Validaciones automáticas sin traducción | Se muestran textos como `Invalid request content.` o `Validation failure`; el respaldo castellano no interviene porque existe `detail`. |
| Recuperación/activación con enlace inválido | Se informa «Recurso no visible.», sin explicar que el enlace venció, se utilizó o debe renovarse. |
| Elegibilidad de cobertura, convenio y autorización resuelta mediante `Db.one` | Varias causas distintas se presentan como el mismo 404 «Recurso no visible.». |
| Autorización agrupada en un único 403 | El texto no distingue falta de permiso, contexto no autorizado, CSRF ni acceso ajeno. MFA sí tiene un texto distinto. |
| Sin identificador funcional estable del error | El frontend detecta MFA buscando la cadena `MFA` dentro del mensaje. Una modificación de texto podría afectar esa reacción. |
| Correlación almacenada, sin presentación en pantalla | El error puede contener una referencia útil para soporte que la persona no ve. Tampoco está garantizada en todos los rechazos de filtros. |
| 503 de datos aplicado a toda `DataAccessException` no tratada como integridad | El mensaje de indisponibilidad también puede representar un fallo de consulta o acceso a datos que no sea una caída temporal. |
| Callback con campos nulos | El chequeo no contempla expresamente que el evento completo sea `null` ni comprueba `status == null` antes de `Set.of(...).contains(status)`. Por lectura del código, estos valores pueden provocar una excepción no controlada en vez del 400 «Evento inválido.». No se reprodujo este caso con una firma válida. |
| Ausencia de un contrato uniforme para fallos no controlados e infraestructura | No todos los errores contienen `detail`, `instance`, correlación o incluso JSON. |

Como primer ajuste posterior al relevamiento, conviene revisar los textos de validación y los 404 de enlaces/cobertura, y definir un código funcional estable junto a `detail`. Estas son propuestas; no se implementaron en este trabajo.

## 10. Fuentes y evidencia de verificación

### Archivos de implementación

| Referencia en las tablas | Archivo |
| --- | --- |
| ApiExceptionHandler | [Manejo de excepciones MVC](../salud-api/src/main/java/ar/com/salud/shared/error/ApiExceptionHandler.java) |
| SecurityConfiguration | [Reglas y respuestas de seguridad](../salud-api/src/main/java/ar/com/salud/config/SecurityConfiguration.java) |
| SecurityProblemWriter | [Serialización de errores en filtros](../salud-api/src/main/java/ar/com/salud/shared/error/SecurityProblemWriter.java) |
| SessionGuard | [Sesión y MFA](../salud-api/src/main/java/ar/com/salud/identity/SessionGuard.java) |
| IdentityService | [Credenciales, tokens y límites](../salud-api/src/main/java/ar/com/salud/identity/IdentityService.java) |
| GoogleController | [Acceso y vinculación Google](../salud-api/src/main/java/ar/com/salud/identity/GoogleController.java) |
| MfaService | [Enrolamiento y verificación MFA](../salud-api/src/main/java/ar/com/salud/identity/MfaService.java) |
| BookingController | [Rutas y encabezados de turnos](../salud-api/src/main/java/ar/com/salud/scheduling/BookingController.java) |
| BookingService | [Reglas de reservas y turnos](../salud-api/src/main/java/ar/com/salud/scheduling/BookingService.java) |
| OrganizationController | [Membresías, delegaciones y ofertas](../salud-api/src/main/java/ar/com/salud/organization/OrganizationController.java) |
| WorkspaceQueryController | [Listados y elegibilidad](../salud-api/src/main/java/ar/com/salud/organization/WorkspaceQueryController.java) |
| PatientController | [Admisión, representación y cobertura](../salud-api/src/main/java/ar/com/salud/patient/PatientController.java) |
| CommunicationController | [Chat y comunicaciones](../salud-api/src/main/java/ar/com/salud/communication/CommunicationController.java) |
| DeliveryWebhookController | [Callback de entrega](../salud-api/src/main/java/ar/com/salud/communication/DeliveryWebhookController.java) |
| ReportController | [Exportación de reportes](../salud-api/src/main/java/ar/com/salud/reporting/ReportController.java) |
| Db | [Consulta de recursos visibles](../salud-api/src/main/java/ar/com/salud/shared/Db.java) |
| Autorización interna | [Facultades](../salud-api/src/main/java/ar/com/salud/organization/Authorization.java), [contexto de entidad](../salud-api/src/main/java/ar/com/salud/shared/TenantTransactions.java) |
| Correlación | [RequestAuditFilter](../salud-api/src/main/java/ar/com/salud/audit/RequestAuditFilter.java) |
| Configuración | [application.yml](../salud-api/src/main/resources/application.yml), [perfil local](../salud-api/src/main/resources/application-local.yml) |
| Transporte frontend | [ApiClient](../salud-web/src/app/core/api.client.ts) |
| Presentación | [Acceso](../salud-web/src/app/pages/auth.ts), [layout](../salud-web/src/app/layout.html), [panel de turno](../salud-web/src/app/ui/appointment-panel.ts) |
| Cargas y escrituras | [WorkspaceStore](../salud-web/src/app/core/workspace.store.ts), [WorkspaceLoader](../salud-web/src/app/core/workspace.loader.ts), [reportes](../salud-web/src/app/pages/reports.ts) |
| Infraestructura | [Preview](../salud-web/scripts/preview.mjs), [Caddy local](../salud-web/deploy/Caddyfile.local), [Caddy de ejemplo](../salud-web/deploy/Caddyfile.example) |

### Verificaciones ejecutadas en este relevamiento

- **44 pruebas frontend aprobadas:** `api.client.spec.ts` (19), `workspace.loader.spec.ts` (7), `workspace.store.spec.ts` (10) y `appointment-panel.spec.ts` (8). Se utilizaron temporales dentro del workspace después de un primer intento con archivos temporales no encontrados. Evidencia de esta ejecución: `tmp/http-error-survey/frontend-tests.log`; JUnit: `salud-web/test-results/angular.xml`.
- **29 verificaciones aisladas de MVC/Security aprobadas**, sin red ni base de datos: nueve estados explícitos, cuatro manejadores de excepciones, doce respuestas automáticas y cuatro casos de seguridad/CORS/recurso estático. Se usaron clases compiladas del proyecto y su classpath de pruebas existente. Sonda y salida local: `tmp/http-error-survey/HttpErrorProbe.java`, `tmp/http-error-survey/mvc-probe.log`.
- **Inventario automático del código fuente:** `tmp/http-error-survey/inventory.mjs` y `explicit-messages.json`, con 64 ubicaciones y 57 pares únicos de HTTP/texto. Los textos se contrastaron con las tablas de este documento.
- Se revisaron las pruebas de integración existentes como trazabilidad, pero **no se ejecutó la suite de PostgreSQL ni el recorrido HTTP con fixture**. El intento de ejecutar `SecurityConfigurationTest` mediante Maven no concluyó durante esta revisión y se interrumpió; sus reportes anteriores no se cuentan como evidencia nueva.

Los archivos bajo `tmp` son auxiliares locales y pueden ser ignorados por Git. El resultado permanente del relevamiento es este documento. Las respuestas de infraestructura y los escenarios funcionales no reproducidos están identificados como revisión de código/configuración.
