# 13. Avisos y entrega

18 de octubre de 2026

Separe el trabajo programado, el mensaje lógico, cada intento de envío y las notificaciones del proveedor. Luego diferencie entrega, lectura y resolución.

**Ejemplo de conjunto.** Un trabajo genera el aviso de la cita de Lucía. Un fallo produce reintento. El proveedor informa entrega y el sistema puede avisar al equipo; ninguno de esos hechos confirma asistencia por sí solo.

**Recorrido.** TAREA_PERSISTIDA > AVISO_EXTERNO > INTENTO_ENVIO > EVENTO_PROVEEDOR; AVISO_INTERNO comunica hechos a cuentas autorizadas.

[Explicación en PDF](explicacion.pdf) · [Lámina original PDF](diagrama.pdf) · [Diagrama SVG](diagrama.svg) · [Editable draw.io](diagrama.drawio) · [Fuente Mermaid](diagrama.mmd)

## Cómo leer las marcas

- **Entidad del diagrama:** Tipo de cosa sobre la que se guardan datos. Cada caja representa una tabla; cada fila de esa tabla es un caso particular.
- **ENTIDAD y tenant_id:** ENTIDAD es la clínica o actividad cliente. tenant_id identifica a la organización propietaria de un dato local; tenant significa ese ámbito de aislamiento.
- **PK y UUIDv7:** PK es la clave primaria del registro. Los identificadores internos usan UUIDv7. No son el número visible de paciente ni una autorización secreta.
- **FK:** Referencia a otra tabla. Se lee desde el campo y su destino, aunque las líneas se crucen o pasen cerca de otras cajas.
- **UQ:** Restricción de unicidad: impide repetir la combinación indicada. Puede reducir una relación de muchos registros a uno como máximo.
- **? y vacío:** El atributo es opcional. Un campo vacío no implica automáticamente una autorización ni la ausencia de otras condiciones.
- **1 / 0..1 / 0..N:** Exactamente uno / ninguno o uno / ninguno, uno o varios. El registro de relaciones aclara ambos sentidos.
- **[G] / [T] / [X]:** Global restringido / local de una entidad con tenant_id / excepción administrativa entre origen y destino. Global no significa público.
- **instante / enum / secreto:** Fecha y hora / código de un catálogo por definir / dato sensible o referencia protegida. Los estados de tablas diferentes son dimensiones separadas.
- **Versión / snapshot:** Una versión conserva una definición histórica. Snapshot significa copia de las condiciones aplicadas en un momento; complementa las FK y no permite datos clínicos fuera de alcance.

## 1. TAREA_PERSISTIDA: Trabajo automático guardado para ejecutarse después

Registra una acción diferida con programación, deduplicación, estado, reintentos y origen controlado. Permite retomar trabajos tras fallos del proceso que los ejecuta.

**Ejemplo ficticio.** Se guarda el trabajo de enviar un recordatorio de una versión de turno en la ventana temporal correspondiente.

**Cómo distinguirlo.** La tarea organiza cuándo y por qué se trabaja. AVISO_EXTERNO representa el mensaje y cada INTENTO_ENVIO representa su ejecución técnica. Persistir el trabajo no prueba entrega.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| version_turno_id | FK/uuid/opcional | Horario y condiciones de una versión concreta del turno. Destino: VERSION_TURNO, horario y condiciones históricos de una cita. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| turno_afectado_id | FK/uuid/opcional | Seguimiento de la cita alcanzada por una reprogramación colectiva. Destino: TURNO_AFECTADO, seguimiento de una cita alcanzada por una ausencia. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| tipo | enum/obligatorio | Clase de registro o mecanismo dentro de esta tabla. Sus opciones y significado se interpretan según la entidad, no como un catálogo común a todo el modelo. |
| deduplicacion | texto/obligatorio | Clave del trabajo dentro de la entidad para evitar programar duplicados lógicos de la misma acción. |
| programada_en | instante/obligatorio | Fecha y hora prevista para ejecutar el trabajo. Ejecutarlo exige revalidar que siga siendo aplicable. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| intentos | entero/obligatorio | Cantidad de ejecuciones o reintentos registrados para el trabajo. El detalle de cada ejecución se conserva en su tabla de intentos. |
| bloqueada_hasta | instante/opcional | Momento hasta el que un ejecutor retiene temporalmente el trabajo para coordinar su ejecución. No es un bloqueo de agenda ni de paciente. El modelo admite dejarlo vacío. |
| version_politica_ref | texto/obligatorio | Referencia a la política aplicada al programar o ejecutar el trabajo para conservar trazabilidad de sus reglas. |

**Reglas del modelo.** UQ(tenant_id,deduplicacion). Correo único dentro de T-72/T-48; WA T-36 solo pendiente; T-24 cierra. Reprogramación profesional es evento independiente. Trabajos sin turno llevan tipo y referencia de origen controlada; no datos arbitrarios.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R08 R11 R12; docs/04.

## 2. AVISO_EXTERNO: Mensaje lógico que debe enviarse a un destinatario

Representa un mensaje individual con tarea de origen, destino, canal y versión de plantilla. Conserva su identidad aunque sean necesarios varios intentos.

**Ejemplo ficticio.** El aviso de la cita de Lucía es un mensaje lógico. Si falla su envío, se reintenta ese mismo aviso según la política.

**Cómo distinguirlo.** Mensaje e intento son objetos diferentes. La deduplicación considera evento, versión, destinatario y canal para evitar crear mensajes lógicos repetidos.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| tarea_id | FK/uuid/obligatorio | Trabajo persistido que origina el intento o aviso. Destino: TAREA_PERSISTIDA, trabajo automático guardado para ejecutarse después. Cada registro requiere exactamente un destino válido. |
| destino_id | FK/uuid/obligatorio | Contacto y propósito autorizados para recibir el aviso de ese paciente. Destino: DESTINO_AVISO, destinatario autorizado para cierto mensaje de un paciente. Cada registro requiere exactamente un destino válido. |
| canal_id | FK/uuid/obligatorio | Configuración de envío que corresponde al tipo de comunicación de esta tabla. Destino: CANAL_ENTIDAD, servicio y remitente de avisos de una clínica. Cada registro requiere exactamente un destino válido. |
| clave_logica | texto/obligatorio | Identificador del trabajo o aviso lógico utilizado para reconocerlo y evitar su duplicación según la restricción de unicidad. |
| plantilla_version_ref | texto/obligatorio | Referencia a la versión de plantilla utilizada para construir el aviso externo. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| creado_en | instante/obligatorio | Fecha y hora de creación de este registro. |

**Reglas del modelo.** UQ(tenant_id,clave_logica). Dedupe por evento, versión, destinatario y canal; reprogramación exige WhatsApp. Fallo queda pendiente de seguimiento.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R11 R11.b; ADR-013.

## 3. INTENTO_ENVIO: Ejecución concreta de envío de un aviso

Registra el número de intento, referencia del proveedor, estado y posibles momentos de entrega o lectura.

**Ejemplo ficticio.** El primer intento del aviso falla. Un segundo intento queda aceptado por el proveedor y puede recibir actualizaciones posteriores.

**Cómo distinguirlo.** Aceptación, entrega, lectura y confirmación de asistencia son hechos distintos. El modelo no promete entrega exactamente una vez frente a todos los fallos externos.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| aviso_id | FK/uuid/obligatorio | Mensaje lógico cuyo intento de envío se registra. Destino: AVISO_EXTERNO, mensaje lógico que debe enviarse a un destinatario. Cada registro requiere exactamente un destino válido. |
| numero | entero/obligatorio | Número de intento dentro de la tarea o aviso. Distingue el primero de los reintentos. |
| referencia_proveedor | texto/opcional | Identificador devuelto por el servicio externo para correlacionar el intento con su respuesta o eventos posteriores. El modelo admite dejarlo vacío. |
| iniciado_en | instante/obligatorio | Fecha y hora de inicio del intento técnico o del proceso documentado. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| error_codigo | texto/opcional | Código técnico del fallo observado. Permite seguimiento sin guardar secretos ni contenido sensible innecesario. El modelo admite dejarlo vacío. |
| entregado_en | instante/opcional | Momento de entrega informado por el proveedor. No equivale a lectura ni a confirmación de asistencia. El modelo admite dejarlo vacío. |
| leido_en | instante/opcional | Momento de lectura del mensaje o aviso según el contexto. Leer no confirma asistencia ni prueba resolución de una gestión. El modelo admite dejarlo vacío. |

**Reglas del modelo.** UQ(tenant_id,aviso_id,numero). Ref externa única dentro de cuenta proveedor cuando exista. No prometer entrega exactamente una vez.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R11; docs/04.

## 4. EVENTO_PROVEEDOR: Notificación técnica recibida del servicio de envío

Registra un evento externo autenticado, correlacionado con un canal e intento y deduplicado. Un webhook es una notificación que el proveedor envía al sistema.

**Ejemplo ficticio.** El proveedor informa que un mensaje fue entregado y se registra ese evento con su identificador externo.

**Cómo distinguirlo.** Un evento de lectura o entrega informa sobre el mensaje. No confirma asistencia ni convierte texto libre en una operación sobre el turno.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| canal_id | FK/uuid/obligatorio | Configuración de envío que corresponde al tipo de comunicación de esta tabla. Destino: CANAL_ENTIDAD, servicio y remitente de avisos de una clínica. Cada registro requiere exactamente un destino válido. |
| intento_id | FK/uuid/obligatorio | Ejecución técnica de envío con la que se correlaciona el costo o evento. Destino: INTENTO_ENVIO, ejecución concreta de envío de un aviso. Cada registro requiere exactamente un destino válido. |
| evento_externo | texto/obligatorio | Identificador del evento comunicado por el proveedor; se utiliza para deduplicar notificaciones repetidas. |
| tipo | enum/obligatorio | Clase de notificación informada por el proveedor, como entrega o lectura cuando el servicio las soporte. |
| ocurrido_en | instante/obligatorio | Momento en que ocurrió el hecho. Puede diferir del instante en que se recibió una notificación sobre él. |
| recibido_en | instante/obligatorio | Fecha y hora en que el sistema recibió la notificación del proveedor, que puede ser posterior al hecho informado. |
| validacion_ref | texto/obligatorio | Referencia a la comprobación de autenticidad y correspondencia del evento del proveedor. |

**Reglas del modelo.** UQ(tenant_id,canal_id,evento_externo). Canal coincide con aviso del intento. Lectura, entrega o texto libre no confirman asistencia.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R11; S08.

## 5. AVISO_INTERNO: Notificación guardada dentro del sistema

Representa un aviso destinado a una cuenta autorizada dentro de una entidad, con origen y seguimiento de lectura o resolución.

**Ejemplo ficticio.** Pedro recibe un aviso interno sobre un turno cancelado por la regla de cierre o sobre una conversación que requiere intervención autorizada.

**Cómo distinguirlo.** Recibirlo no concede permisos nuevos sobre el recurso. Leído y resuelto tienen significados distintos; consultar el recurso exige autorización actual.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| tarea_id | FK/uuid/opcional | Trabajo persistido que origina el intento o aviso. Destino: TAREA_PERSISTIDA, trabajo automático guardado para ejecutarse después. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| version_turno_id | FK/uuid/opcional | Horario y condiciones de una versión concreta del turno. Destino: VERSION_TURNO, horario y condiciones históricos de una cita. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| conversacion_id | FK/uuid/opcional | Hilo de chat al que pertenece el registro o se refiere la notificación. Destino: CONVERSACION, hilo de chat de un paciente con un profesional. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| destinatario_id | FK/uuid/obligatorio | Cuenta a la que se dirige la notificación interna. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| tipo | enum/obligatorio | Clase de registro o mecanismo dentro de esta tabla. Sus opciones y significado se interpretan según la entidad, no como un catálogo común a todo el modelo. |
| clave_logica | texto/obligatorio | Identificador del trabajo o aviso lógico utilizado para reconocerlo y evitar su duplicación según la restricción de unicidad. |
| creado_en | instante/obligatorio | Fecha y hora de creación de este registro. |
| leido_en | instante/opcional | Momento de lectura del mensaje o aviso según el contexto. Leer no confirma asistencia ni prueba resolución de una gestión. El modelo admite dejarlo vacío. |
| resuelto_en | instante/opcional | Momento en que se registró la resolución del caso, aviso o turno afectado, según la entidad. El modelo admite dejarlo vacío. |

**Reglas del modelo.** UQ(tenant_id,clave_logica,destinatario_id). Consultar exige permiso actual aun tras recibir el aviso. Aviso y cierre T-24 se persisten consistentemente.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R08 R11.a R12; MP-33.

## Relaciones de esta lámina, incluidas las referencias externas

- TAREA_PERSISTIDA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de TAREA_PERSISTIDA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- TAREA_PERSISTIDA.version_turno_id: cada registro puede no referir a ninguno o referir a un solo registro de VERSION_TURNO. Como padre, cada registro de VERSION_TURNO puede ser referido por cero, uno o varios registros de TAREA_PERSISTIDA mediante ese campo. Destino en carpeta 10-reservas-y-capacidad. compuesta tenant_id + id.
- TAREA_PERSISTIDA.turno_afectado_id: cada registro puede no referir a ninguno o referir a un solo registro de TURNO_AFECTADO. Como padre, cada registro de TURNO_AFECTADO puede ser referido por cero, uno o varios registros de TAREA_PERSISTIDA mediante ese campo. Destino en carpeta 11-reprogramacion-y-gestion. compuesta tenant_id + id.
- AVISO_EXTERNO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de AVISO_EXTERNO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- AVISO_EXTERNO.tarea_id: cada registro debe referir a exactamente un registro de TAREA_PERSISTIDA. Como padre, cada registro de TAREA_PERSISTIDA puede ser referido por cero, uno o varios registros de AVISO_EXTERNO mediante ese campo. Destino en carpeta 13-avisos-y-entrega. compuesta tenant_id + id.
- AVISO_EXTERNO.destino_id: cada registro debe referir a exactamente un registro de DESTINO_AVISO. Como padre, cada registro de DESTINO_AVISO puede ser referido por cero, uno o varios registros de AVISO_EXTERNO mediante ese campo. Destino en carpeta 12-canales-y-destinatarios. compuesta tenant_id + id.
- AVISO_EXTERNO.canal_id: cada registro debe referir a exactamente un registro de CANAL_ENTIDAD. Como padre, cada registro de CANAL_ENTIDAD puede ser referido por cero, uno o varios registros de AVISO_EXTERNO mediante ese campo. Destino en carpeta 12-canales-y-destinatarios. compuesta tenant_id + id.
- INTENTO_ENVIO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de INTENTO_ENVIO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- INTENTO_ENVIO.aviso_id: cada registro debe referir a exactamente un registro de AVISO_EXTERNO. Como padre, cada registro de AVISO_EXTERNO puede ser referido por cero, uno o varios registros de INTENTO_ENVIO mediante ese campo. Destino en carpeta 13-avisos-y-entrega. compuesta tenant_id + id.
- EVENTO_PROVEEDOR.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de EVENTO_PROVEEDOR mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- EVENTO_PROVEEDOR.canal_id: cada registro debe referir a exactamente un registro de CANAL_ENTIDAD. Como padre, cada registro de CANAL_ENTIDAD puede ser referido por cero, uno o varios registros de EVENTO_PROVEEDOR mediante ese campo. Destino en carpeta 12-canales-y-destinatarios. compuesta tenant_id + id.
- EVENTO_PROVEEDOR.intento_id: cada registro debe referir a exactamente un registro de INTENTO_ENVIO. Como padre, cada registro de INTENTO_ENVIO puede ser referido por cero, uno o varios registros de EVENTO_PROVEEDOR mediante ese campo. Destino en carpeta 13-avisos-y-entrega. compuesta tenant_id + id.
- AVISO_INTERNO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de AVISO_INTERNO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- AVISO_INTERNO.tarea_id: cada registro puede no referir a ninguno o referir a un solo registro de TAREA_PERSISTIDA. Como padre, cada registro de TAREA_PERSISTIDA puede ser referido por cero, uno o varios registros de AVISO_INTERNO mediante ese campo. Destino en carpeta 13-avisos-y-entrega. compuesta tenant_id + id.
- AVISO_INTERNO.version_turno_id: cada registro puede no referir a ninguno o referir a un solo registro de VERSION_TURNO. Como padre, cada registro de VERSION_TURNO puede ser referido por cero, uno o varios registros de AVISO_INTERNO mediante ese campo. Destino en carpeta 10-reservas-y-capacidad. compuesta tenant_id + id.
- AVISO_INTERNO.conversacion_id: cada registro puede no referir a ninguno o referir a un solo registro de CONVERSACION. Como padre, cada registro de CONVERSACION puede ser referido por cero, uno o varios registros de AVISO_INTERNO mediante ese campo. Destino en carpeta 14-chat-humano. compuesta tenant_id + id.
- AVISO_INTERNO.destinatario_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de AVISO_INTERNO mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
