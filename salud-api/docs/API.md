# Contratos para pruebas de Salud API

Base `http://localhost:8080/api/v1` en local. Sesión por cookie y CSRF en escrituras;
no usar Basic ni token de paciente como sustituto de sesión. El script
`scripts/smoke-local.ps1` constituye un ejemplo ejecutable completo. Todos los ejemplos
usan referencias ficticias; reemplazar UUID por identificadores devueltos por la API.

## Incorporar equipo y organización

Plataforma invita una cuenta mediante POST `/platform/accounts`:

```json
{"name":"Profesional de prueba","email":"profesional@example.test"}
```

El enlace de activación permite elegir contraseña (12–72 caracteres) con POST
`/auth/reset`: `{"token":"TOKEN_DEL_ENLACE","password":"CONTRASEÑA_PERSONAL"}`.
Invitar no concede contextos. `/auth/recover` recibe `{"email":"…"}` y devuelve
respuesta genérica; el envío se procesa desde una cola persistida.

POST `/platform/entities`, con facultad explícita de plataforma:

```json
{
  "name":"Clínica ficticia",
  "timezone":"America/Argentina/Buenos_Aires",
  "administratorId":"UUID_CUENTA",
  "holdMinutes":5,
  "maxActiveBookings":3
}
```

Los siguientes ejemplos tienen prefijo `/entities/{tenant}`. El administrador puede
añadir una membresía con POST `/members`:

```json
{"accountId":"UUID_CUENTA","permissions":["admissions:manage","patients:manage"]}
```

Facultades asignables a membresía: `members:manage`, `patients:manage`,
`admissions:manage`, `catalog:manage`, `professionals:manage`, `coverage:manage`,
`policy:manage`, `audit:read` y `notifications:manage`. Ninguna concede agenda o chat.
DELETE `/members/{id}` revoca la membresía; impide baja de profesional con turnos
futuros hasta resolverlos y nunca elimina su identidad global.

POST `/professionals`: `{"accountId":"UUID","name":"Nombre","registration":"MATRÍCULA_VERIFICADA"}`.
La cuenta identifica al profesional global; no se deduce por nombre ni matrícula.
POST `/branches`: `{"name":"Sede","timezone":"America/Argentina/Buenos_Aires","address":"Domicilio ficticio"}`.
POST `/agendas`: `{"professionalEntityId":"UUID","branchId":"UUID","name":"Agenda","timezone":"America/Argentina/Buenos_Aires"}`.

El titular configura POST `/agendas/{agenda}/hours`:

```json
{"day":1,"start":"08:00:00","end":"19:00:00","from":"2026-10-20","until":null}
```

Día ISO 1=lunes a 7=domingo. El intervalo debe abarcar preparación y cierre.
POST `/agendas/{agenda}/delegations`:

```json
{"membershipId":"UUID","permissions":["agenda:read","booking:read","booking:create"]}
```

Solo el profesional titular otorga/revoca; DELETE en `/delegations/{id}`. Acciones
delegables adicionales: `agenda:configure`, `booking:confirm`, `booking:cancel` y
`booking:reschedule`. No se admiten facultades de admisión ni chat por esta ruta.

## Pacientes, admisión y representación

POST `/patients` crea ficha administrativa:

```json
{"firstName":"Persona","lastName":"Ficticia","document":"DECLARADO","birthDate":"1990-01-01","address":"Domicilio ficticio"}
```

PUT `/patients/{id}` actualiza esos campos con facultad de pacientes. GET `/patients`
lista hasta 100 fichas para personal facultado; GET `/patients/{id}` exige permiso
de ficha o personal facultado y registra el acceso.
POST `/patients/{id}/professionals`: `{"professionalEntityId":"UUID"}` crea/reutiliza
un vínculo y devuelve su número visible estable, independiente de otras entidades.

Un usuario autenticado que todavía no pertenece a la entidad puede enviar POST
`/admission-requests/{tenant}` (sin prefijo `/entities`):

```json
{"patient":{"firstName":"Persona","lastName":"Ficticia","document":null,"birthDate":null,"address":null},"professionalEntityId":"UUID"}
```

La solicitud no adquiere capacidad ni concede acceso. El administrador facultado
consulta GET `/entities/{tenant}/admissions` y aprueba POST `/admissions/{id}/approve`:

```json
{"accountId":"UUID_SOLICITANTE","professionalEntityId":"UUID_DE_LA_SOLICITUD","agendaId":null,"verificationReference":"Evidencia verificada por el operador","representationId":null}
```

La aprobación crea ficha y vínculo de ese solicitante; no fusiona fichas por documento.
POST `/admissions/{id}/reject` rechaza solicitudes pendientes. Para conocidos, POST
`/patients/{id}/access` usa el mismo cuerpo de aprobación y exige facultad de admisión.
La cuenta debe activarse con contacto verificado antes de entrar al contexto.
DELETE `/patients/{patient}/access/{id}` revoca ese acceso.

POST `/patients/{id}/representations`:

```json
{"accountId":"UUID_REPRESENTANTE","evidence":"Referencia de verificación","permissions":["booking:read","booking:create"],"until":"2027-01-01T00:00:00Z"}
```

Ese identificador debe indicarse en `representationId` al aprobar el acceso. Sus
facultades limitan el alcance aunque la admisión tenga permisos más amplios.
El parentesco declarado por sí solo no habilita representación. DELETE
`/patients/{patient}/representations/{id}` revoca y se refleja en la siguiente acción.

POST `/patients/{id}/contacts` registra un destino verificado por personal:

```json
{"type":"EMAIL","value":"persona@example.test","authorizationReference":"Consentimiento y verificación registrados"}
```

`type` admite `EMAIL` o `WHATSAPP`. En representantes, configurar destinatario conforme
a sus facultades: la API no infiere un adulto responsable a partir de parentesco.

## Catálogo, cobertura y disponibilidad

GET `/practices` devuelve las cuatro prácticas base y personalizadas. POST `/practices`
con `{"code":"PERSONAL_01","name":"Práctica personalizada"}` requiere `catalog:manage`.
POST `/agendas/{agenda}/offers` crea una versión inmutable de oferta:

```json
{"practiceId":"UUID","durationMinutes":30,"preparationMinutes":0,"closingMinutes":0,"portalEnabled":true,"privatePaymentEnabled":true}
```

Solo Consulta base puede tener `portalEnabled=true`. Cambiar de versión no reescribe
los turnos existentes; completar un hold exige oferta vigente. GET de ofertas/horarios
requiere agenda autorizada o `patientId` con alcance. GET `/availability` recibe
`offerVersionId`, `patientId` y `date`; devuelve `starts`, `timezone` y `durationMinutes`.
Es informativo: solo adquirir una pre-reserva garantiza capacidad.

POST `/coverages`: `{"name":"Obra social ficticia"}`; POST `/coverages/{id}/plans`
crea plan con ese mismo cuerpo. POST `/patients/{id}/affiliations`:

```json
{"coverageId":"UUID","planId":null,"memberNumber":"FICTICIO","from":"2026-01-01","until":null,"verificationReference":"Verificado por personal"}
```

POST `/agreements` recibe `offerId` (oferta, no versión), `coverageId`, `planId`,
`from`, `until` y `requiresAuthorization`. La vigencia se evalúa para el horario del turno.
Si se exige autorización, POST `/coverage-authorizations` recibe `affiliationId`,
`practiceId`, `reference`, `from`, `until`. La afiliación debe estar verificada y
pertenecer al paciente. Ausencia de convenio/autorización rechaza la operación.

## Ciclo de turnos

POST `/holds`, con `Idempotency-Key`:

```json
{"patientId":"UUID","offerVersionId":"UUID_VERSION","start":"2026-11-02T14:00:00Z","affiliationId":null,"authorizationId":null}
```

Duración y profesional proceden del servidor. Sin afiliación se pide explícitamente
modalidad particular; debe estar habilitada. La respuesta incluye `id`, `vence_en`
y `estado`. POST `/appointments`, con otra clave idempotente:

```json
{"holdId":"UUID_PRE_RESERVA"}
```

Las tres modificaciones siguientes requieren `If-Match: "N"`, con `version_concurrencia` obtenida al leer el turno. Falta de versión: 428; formato inválido: 400; versión antigua: 412. Revisar el turno antes de repetir; no reemplazar automáticamente la versión para ejecutar una intención vieja.

El registro conserva ocupación y deja `estado_asistencia=PENDIENTE`. POST
`/appointments/{id}/confirm` confirma asistencia. POST `/appointments/{id}/cancel`
recibe `{"reason":"Motivo"}` y conserva historial. POST `/appointments/{id}/reschedule`
recibe cuerpo de hold y clave idempotente: conserva ID del turno, agrega versión y
reinicia la confirmación. Un conflicto revierte todos los cambios del reemplazo.

GET `/appointments/{id}` devuelve el turno autorizado. GET `/appointments` requiere
`agendaId` o `patientId` y devuelve hasta 100 turnos. La autogestión de extracción,
limpieza, cirugía o personalizada se deriva a POST `/management-requests` con
`patientId`, `professionalEntityId`, `practiceId` y `reason`; no ocupa un horario.
Personal consulta/resuelve por `agendaId` autorizado.

POST `/agendas/{agenda}/absences`, con clave idempotente:

```json
{"start":"2026-11-02T11:00:00Z","end":"2026-11-02T23:00:00Z","reason":"Motivo interno registrado"}
```

Repetir para intervalos distintos con claves distintas. Se bloquea el intervalo,
se guardan los turnos afectados y se genera WhatsApp incluso para confirmados.
La notificación no mueve ni cancela automáticamente esos turnos. Consultar casos en
`/rescheduling-cases?agendaId=…`; el reemplazo explícito marca su resolución.

PUT `/policy` requiere facultad y referencia de aprobación:

```json
{"holdMinutes":5,"maxActiveBookings":3,"automaticCloseEnabled":false,"approvalReference":"Política de prueba local"}
```

## Chat, bandejas y exportaciones

POST `/conversations` con `{"patientProfessionalId":"UUID"}`: inicia el paciente o
representante habilitado; participantes iniciales explícitos: ese actor y profesional.
POST `/conversations/{id}/messages` recibe `{"text":"Mensaje"}` (máximo 4000 caracteres).
GET en esa ruta acepta cursor `before=UUID`; devuelve hasta 100 mensajes, recientes
primero. POST `/conversations/{id}/messages/{message}/read` registra lectura propia.
Una delegación de agenda nunca permite leer mensajes.

GET `/tasks` exige `notifications:manage`; POST `/tasks/{id}/retry` reintenta mensajes,
no cierres tardíos. GET `/notifications` solo muestra las del actor; POST
`/notifications/{id}/read` registra lectura propia. GET `/audit?offset=0` exige
`audit:read`. Reportes por agenda autorizada, hasta 31 días/1000 turnos:
`GET /reports/appointments?agendaId=…&from=2026-11-01&until=2026-11-30&format=pdf`.
CSV/XLSX/PDF incluyen numeración administrativa, fechas UTC y estados.

## Gateway de comunicaciones

Configurar URL HTTPS de mensajes y bearer token en secretos de infraestructura.
POST enviado al gateway, con `Authorization: Bearer …` y `Idempotency-Key: UUID_AVISO`:

```json
{
  "tenantId":"UUID",
  "messageId":"UUID_AVISO",
  "channel":"WHATSAPP",
  "from":"REMITENTE_VERIFICADO",
  "providerAccount":"CUENTA_DE_ENTIDAD",
  "to":"DESTINO_VERIFICADO",
  "event":"ABSENCE_WHATSAPP",
  "portalUrl":"https://dominio/ENTRADA_AL_PORTAL"
}
```

Otros eventos: `CONFIRMATION_EMAIL`, `BACKUP_WHATSAPP` e `IDENTITY`. Identidad envía
solo `channel`, `to`, `event` y `portalUrl`, con clave idempotente de la cola global.
El gateway usa su remitente verificado de acceso para identidad. Respuesta HTTP 2xx
significa aceptado por gateway; no equivale a entregado. Debe conservar la deduplicación
entre reintentos incluso si la primera respuesta se pierde. Integrar en ese gateway las
plantillas y APIs de los proveedores elegidos; no se emiten mensajes por APIs ficticias.

La configuración del canal por entidad se registra con POST `/channels`:
`{"channel":"WHATSAPP","sender":"…","providerAccount":"…","verificationReference":"…"}`.
Los secretos no se envían por este DTO ni se devuelven al paciente.

Callback POST `/api/v1/delivery-events` sin cookie ni CSRF; autenticación HMAC separada:

```json
{"tenantId":"UUID","channelId":"UUID","messageId":"UUID_AVISO","eventId":"ID_UNICO_PROVEEDOR","status":"DELIVERED","occurredAt":"2026-11-01T12:00:00Z"}
```

Cabeceras `X-Delivery-Timestamp` (epoch en segundos, tolerancia ±300 s) y
`X-Delivery-Signature` (hex minúscula de HMAC-SHA256 con `WEBHOOK_SECRET` sobre
`timestamp + "." + cuerpo_JSON_exacto`). Estado `DELIVERED` o `FAILED`; mensaje y
canal deben corresponder a un envío ya emitido. Deduplicación por canal/eventId.
Entrega prevalece frente a un fallo tardío; el callback nunca confirma asistencia.

## Proyección del espacio administrativo

Estas lecturas conservan sesión, MFA, contexto de entidad y autorización del resto de la API:

- GET `/api/v1/entities/{tenant}/workspace`: `permissions` efectivas de personal, `agendas` visibles con facultades por acción y titularidad, `members` cuando puede administrar membresías o delegar como titular y `delegations` de sus agendas propias. Una etiqueta de rol no concede facultades.
- GET `/api/v1/entities/{tenant}/workspace/patients/{id}`: contactos, afiliaciones y autorizaciones de cobertura de una ficha legible mediante `patients:manage` o autorización específica `patient:read`. Representaciones y accesos solo se incluyen con `admissions:manage`.
- GET `/api/v1/entities/{tenant}/workspace/coverage-configuration`: planes y últimas versiones de convenios activos; exige `coverage:manage`.

Los listados existentes de pacientes añaden número(s) visible(s), profesionales vinculados y cobertura verificada; las conversaciones autorizadas incluyen nombre de paciente y los mensajes indican autoría propia. Los casos de reprogramación incluyen el turno afectado. Son datos de representación para el cliente web; no amplían el acceso a fichas ni conversaciones.

## Errores

Problem Details sin SQL ni stacktrace: 400 validación, 401 credencial/sesión/firma,
403 facultad o CSRF, 404 recurso no visible, 409 horario/estado/referencia/idempotencia,
429 límite y 503 dependencia/configuración ausente. `X-Correlation-ID` relaciona
peticiones con auditoría. Los rechazos 401/403 se auditan sin credenciales ni cuerpos.


## Proyecciones administrativas paginadas

Administración institucional agrega los recursos paginados `institution-professionals`,
`institution-members`, `institution-branches`, `institution-agendas` e `institution-audit`
en `/entities/{tenant}/workspace/lists/{resource}`. Profesionales, sedes y estructura
de agendas requieren `professionals:manage`; equipo requiere `members:manage` y
auditoría `audit:read`. Devuelven `{items,total,offset,limit}`, con límite máximo 500.
Estas proyecciones no devuelven pacientes, turnos ni mensajes.

GET `/entities/{tenant}/policy`, con `policy:manage`, devuelve `id`, `numero_version`,
`hold_minutes`, `max_active`, `automatic_close` y `approval` de la versión vigente.
PUT `/entities/{tenant}/members/{id}/permissions`, con `members:manage`, recibe
`{"permissions":["catalog:manage"]}` y reemplaza las facultades activas de la membresía.
No admite permisos de agenda o chat ni retirar la propia facultad `members:manage`.
DELETE `/members/{id}` bloquea la baja propia, turnos futuros y pre-reservas vigentes;
revoca facultades y delegaciones locales y conserva identidad e historial. Reactivar
la membresía no restaura las facultades revocadas.

La UI actual utiliza `/workspace/appointments` por rango local (hasta exclusivo), `/workspace/directory`, `/workspace/lists/{resource}`, candidatos mínimos y elegibilidad de agenda, y cursor de conversaciones. Los endpoints de listado anteriores conservan su contrato legado. Ver [contratos y permisos completos](../../docs/28-integracion-frontend-servidor-y-pruebas.md#api-incorporada). Reprogramar consulta `/availability-for-rescheduling` con `appointmentId` y usa su facultad propia, sin exigir crear turnos. Flyway V9 añade disponibilidad con exclusión de ocupación propia manteniendo capacidad global opaca.
