# 11. Reprogramación y gestión

18 de octubre de 2026

Estudie la ausencia que afecta muchas citas y el seguimiento individual de cada una. Mantenga por separado el aviso al paciente y la obtención de un reemplazo.

**Ejemplo de conjunto.** Ana falta una mañana. El lote indica los tramos afectados; cada cita tiene seguimiento de aviso y resolución. Una solicitud de gestión pide intervención humana y no retiene horarios.

**Recorrido.** LOTE_REPROGRAMACION > INTERVALO_LOTE > TURNO_AFECTADO > gestión y reemplazo. TOKEN_TURNO limita acciones sobre una versión concreta.

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

## 1. LOTE_REPROGRAMACION: Conjunto de cambios por una ausencia del profesional

Agrupa la gestión iniciada por una ausencia o cambio que afecta varias citas del mismo profesional en agendas autorizadas.

**Ejemplo ficticio.** Ana informa que no atenderá una mañana. Se crea un lote para identificar y seguir los turnos afectados.

**Cómo distinguirlo.** Avisar por WhatsApp a los afectados incluye a quienes ya habían confirmado. Enviar el aviso no resuelve el reemplazo; las políticas de liberación y cierre siguen pendientes.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| profesional_entidad_id | FK/uuid/obligatorio | Vínculo local del profesional con la entidad de este registro. Destino: PROFESIONAL_ENTIDAD, vínculo de un profesional con una clínica. Cada registro requiere exactamente un destino válido. |
| iniciador_id | FK/uuid/obligatorio | Cuenta de quien inicia el lote de reprogramación. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| motivo_interno | texto/obligatorio | Explicación de uso interno para la solicitud, excepción o lote. Debe mantenerse en el ámbito autorizado. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| creado_en | instante/obligatorio | Fecha y hora de creación de este registro. |
| clave_operacion | texto/obligatorio | Identificador de deduplicación de una operación de lote o transición dentro de su restricción de unicidad. |

**Reglas del modelo.** UQ(tenant_id,clave_operacion). WhatsApp a todos los afectados, incluso confirmados. Estados y política de liberación pendientes.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R11.b; ADR-013.

## 2. INTERVALO_LOTE: Franja de agenda afectada por un lote

Describe cada tramo temporal y agenda alcanzados por una reprogramación colectiva. Un lote puede incluir más de un intervalo.

**Ejemplo ficticio.** La ausencia de Ana afecta de 09:00 a 12:00 en una agenda y otro tramo en otra agenda local autorizada.

**Cómo distinguirlo.** Debe detectarse toda ocupación que se superponga, incluso si el turno empieza antes de la franja. Un día completo se interpreta según la zona horaria de la agenda.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| lote_id | FK/uuid/obligatorio | Operación colectiva de reprogramación con la que se relaciona el registro. Destino: LOTE_REPROGRAMACION, conjunto de cambios por una ausencia del profesional. Cada registro requiere exactamente un destino válido. |
| agenda_id | FK/uuid/obligatorio | Agenda local a la que se refiere la configuración, acción o autorización. Destino: AGENDA, agenda de atención de un profesional en una sede. Cada registro requiere exactamente un destino válido. |
| inicio | instante/obligatorio | Instante de comienzo del intervalo. Debe ser anterior al fin; las ocupaciones usan intervalos con final excluido. |
| fin | instante/obligatorio | Instante de finalización del intervalo. En [inicio, fin), permite que otro intervalo empiece exactamente al terminar este. |

**Reglas del modelo.** Inicio < fin y agenda del profesional del lote. Una fecha completa se convierte desde zona horaria de agenda. Detectar toda ocupación superpuesta, aunque el turno comience antes.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R11.b; ADR-013.

## 3. TURNO_AFECTADO: Seguimiento de una cita alcanzada por una ausencia

Une el lote con la versión original afectada y registra por separado aviso, resolución y posible turno de reemplazo.

**Ejemplo ficticio.** La cita de Lucía está afectada. Se marca el aviso y después se registra el reemplazo acordado con ella.

**Cómo distinguirlo.** Avisado y resuelto son estados diferentes. El diseño propone un nuevo turno para el reemplazo de lote; un cambio individual utiliza una nueva versión del mismo turno.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| lote_id | FK/uuid/obligatorio | Operación colectiva de reprogramación con la que se relaciona el registro. Destino: LOTE_REPROGRAMACION, conjunto de cambios por una ausencia del profesional. Cada registro requiere exactamente un destino válido. |
| version_original_id | FK/uuid/obligatorio | Versión del turno que quedó afectada por el lote. Destino: VERSION_TURNO, horario y condiciones históricos de una cita. Cada registro requiere exactamente un destino válido. |
| turno_reemplazo_id | FK/uuid/opcional | Cita que se propone como reemplazo del turno afectado. Destino: TURNO, identidad estable de una cita registrada. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| estado_aviso | enum/obligatorio | Seguimiento de la comunicación al afectado. Se mantiene separado del estado de resolución del reemplazo. |
| estado_resolucion | enum/obligatorio | Seguimiento de la solución del turno afectado. Un aviso enviado no equivale a tener reemplazo resuelto. |
| responsable_id | FK/uuid/opcional | Cuenta de quien tiene a cargo el seguimiento o resolución. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| resuelto_en | instante/opcional | Momento en que se registró la resolución del caso, aviso o turno afectado, según la entidad. El modelo admite dejarlo vacío. |
| motivo_cierre | texto/opcional | Razón por la que se cierra el seguimiento de un turno afectado, además de su estado de resolución. El modelo admite dejarlo vacío. |

**Reglas del modelo.** UQ(tenant_id,lote_id,version_original_id). Reemplazo no duplicado ni cruzado de paciente. Envío no resuelve reemplazo. Diseño propone nuevo turno para reemplazo de lote; cambio individual crea versión del mismo turno.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R11.b; ADR-013; docs/04.

## 4. SOLICITUD_GESTION: Pedido para que una persona gestione una necesidad

Registra un trámite humano relativo a un paciente, profesional o práctica, con solicitante, responsable y seguimiento.

**Ejemplo ficticio.** Lucía pide ayuda para conseguir una práctica que requiere gestión de personal. Se abre una solicitud para que alguien la resuelva.

**Cómo distinguirlo.** Crear la solicitud no elige ni bloquea un horario. Un mensaje puede motivarla, pero su creación requiere una acción explícita y autorizada.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| paciente_id | FK/uuid/obligatorio | Ficha administrativa local del paciente involucrado. Destino: PACIENTE, ficha administrativa de un paciente en una clínica. Cada registro requiere exactamente un destino válido. |
| profesional_entidad_id | FK/uuid/obligatorio | Vínculo local del profesional con la entidad de este registro. Destino: PROFESIONAL_ENTIDAD, vínculo de un profesional con una clínica. Cada registro requiere exactamente un destino válido. |
| practica_id | FK/uuid/opcional | Identidad estable de la práctica a la que corresponde este registro. Destino: PRACTICA, tipo estable de servicio de atención. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| turno_afectado_id | FK/uuid/opcional | Seguimiento de la cita alcanzada por una reprogramación colectiva. Destino: TURNO_AFECTADO, seguimiento de una cita alcanzada por una ausencia. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| solicitante_id | FK/uuid/obligatorio | Cuenta de quien presenta la solicitud; puede actuar por otra persona cuando el modelo lo permite. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| responsable_id | FK/uuid/opcional | Cuenta de quien tiene a cargo el seguimiento o resolución. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| motivo | texto/obligatorio | Razón documentada de la operación, decisión o excepción, con acceso acorde al contexto. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| creada_en | instante/obligatorio | Fecha y hora de creación de este registro. |
| resuelta_en | instante/opcional | Fecha y hora de resolución de la solicitud. Debe leerse junto con su estado y motivo cuando corresponda. El modelo admite dejarlo vacío. |

**Reglas del modelo.** Un mensaje puede motivar este trámite; crearlo requiere acción explícita y nunca ocupa capacidad.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R06 R11.a; CU-16 CU-26.

## 5. TOKEN_TURNO: Autorización temporal para una acción sobre una cita

Vincula un valor secreto con la versión concreta del turno y un destinatario autorizado. Conserva propósito, vencimiento y uso o revocación.

**Ejemplo ficticio.** Un mensaje a Lucía contiene un enlace para una acción habilitada sobre su cita vigente.

**Cómo distinguirlo.** Reprogramar o cancelar invalida el token obsoleto. Abrir un enlace no modifica el turno por sí solo. Su alcance es distinto al token para recuperar una cuenta.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| version_turno_id | FK/uuid/obligatorio | Horario y condiciones de una versión concreta del turno. Destino: VERSION_TURNO, horario y condiciones históricos de una cita. Cada registro requiere exactamente un destino válido. |
| destino_id | FK/uuid/obligatorio | Contacto y propósito autorizados para recibir el aviso de ese paciente. Destino: DESTINO_AVISO, destinatario autorizado para cierto mensaje de un paciente. Cada registro requiere exactamente un destino válido. |
| huella | secreto/obligatorio | Representación protegida del valor secreto del token. El token completo en claro no se guarda en esta tabla. |
| proposito | enum/obligatorio | Acción o finalidad específica para la cual se admite este token o destinatario. Evita reutilizarlo para otra operación. |
| vence_en | instante/obligatorio | Fecha y hora límite de validez. Debe aplicarse la transición o comprobación correspondiente; la fecha por sí sola no ejecuta tareas. |
| usado_en | instante/opcional | Fecha y hora en que se consumió el token. Permite rechazar una reutilización del mismo valor. El modelo admite dejarlo vacío. |
| revocado_en | instante/opcional | Fecha y hora en que se dejó sin efecto este factor, token o autorización. Su ausencia no sustituye las demás verificaciones de vigencia. |

**Reglas del modelo.** UQ(huella). Cancelar/reprogramar invalida token obsoleto. GET no modifica; la acción exige autorización actual.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R08; S07.

## Relaciones de esta lámina, incluidas las referencias externas

- LOTE_REPROGRAMACION.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de LOTE_REPROGRAMACION mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- LOTE_REPROGRAMACION.profesional_entidad_id: cada registro debe referir a exactamente un registro de PROFESIONAL_ENTIDAD. Como padre, cada registro de PROFESIONAL_ENTIDAD puede ser referido por cero, uno o varios registros de LOTE_REPROGRAMACION mediante ese campo. Destino en carpeta 04-profesionales-e-incorporacion. compuesta tenant_id + id.
- LOTE_REPROGRAMACION.iniciador_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de LOTE_REPROGRAMACION mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- INTERVALO_LOTE.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de INTERVALO_LOTE mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- INTERVALO_LOTE.lote_id: cada registro debe referir a exactamente un registro de LOTE_REPROGRAMACION. Como padre, cada registro de LOTE_REPROGRAMACION puede ser referido por cero, uno o varios registros de INTERVALO_LOTE mediante ese campo. Destino en carpeta 11-reprogramacion-y-gestion. compuesta tenant_id + id.
- INTERVALO_LOTE.agenda_id: cada registro debe referir a exactamente un registro de AGENDA. Como padre, cada registro de AGENDA puede ser referido por cero, uno o varios registros de INTERVALO_LOTE mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- TURNO_AFECTADO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de TURNO_AFECTADO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- TURNO_AFECTADO.lote_id: cada registro debe referir a exactamente un registro de LOTE_REPROGRAMACION. Como padre, cada registro de LOTE_REPROGRAMACION puede ser referido por cero, uno o varios registros de TURNO_AFECTADO mediante ese campo. Destino en carpeta 11-reprogramacion-y-gestion. compuesta tenant_id + id.
- TURNO_AFECTADO.version_original_id: cada registro debe referir a exactamente un registro de VERSION_TURNO. Como padre, cada registro de VERSION_TURNO puede ser referido por cero, uno o varios registros de TURNO_AFECTADO mediante ese campo. Destino en carpeta 10-reservas-y-capacidad. compuesta tenant_id + id.
- TURNO_AFECTADO.turno_reemplazo_id: cada registro puede no referir a ninguno o referir a un solo registro de TURNO. Como padre, cada registro de TURNO puede ser referido por cero, uno o varios registros de TURNO_AFECTADO mediante ese campo. Destino en carpeta 10-reservas-y-capacidad. compuesta tenant_id + id.
- TURNO_AFECTADO.responsable_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de TURNO_AFECTADO mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- SOLICITUD_GESTION.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de SOLICITUD_GESTION mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- SOLICITUD_GESTION.paciente_id: cada registro debe referir a exactamente un registro de PACIENTE. Como padre, cada registro de PACIENTE puede ser referido por cero, uno o varios registros de SOLICITUD_GESTION mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- SOLICITUD_GESTION.profesional_entidad_id: cada registro debe referir a exactamente un registro de PROFESIONAL_ENTIDAD. Como padre, cada registro de PROFESIONAL_ENTIDAD puede ser referido por cero, uno o varios registros de SOLICITUD_GESTION mediante ese campo. Destino en carpeta 04-profesionales-e-incorporacion. compuesta tenant_id + id.
- SOLICITUD_GESTION.practica_id: cada registro puede no referir a ninguno o referir a un solo registro de PRACTICA. Como padre, cada registro de PRACTICA puede ser referido por cero, uno o varios registros de SOLICITUD_GESTION mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- SOLICITUD_GESTION.turno_afectado_id: cada registro puede no referir a ninguno o referir a un solo registro de TURNO_AFECTADO. Como padre, cada registro de TURNO_AFECTADO puede ser referido por cero, uno o varios registros de SOLICITUD_GESTION mediante ese campo. Destino en carpeta 11-reprogramacion-y-gestion. compuesta tenant_id + id.
- SOLICITUD_GESTION.solicitante_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de SOLICITUD_GESTION mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- SOLICITUD_GESTION.responsable_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de SOLICITUD_GESTION mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- TOKEN_TURNO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de TOKEN_TURNO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- TOKEN_TURNO.version_turno_id: cada registro debe referir a exactamente un registro de VERSION_TURNO. Como padre, cada registro de VERSION_TURNO puede ser referido por cero, uno o varios registros de TOKEN_TURNO mediante ese campo. Destino en carpeta 10-reservas-y-capacidad. compuesta tenant_id + id.
- TOKEN_TURNO.destino_id: cada registro debe referir a exactamente un registro de DESTINO_AVISO. Como padre, cada registro de DESTINO_AVISO puede ser referido por cero, uno o varios registros de TOKEN_TURNO mediante ese campo. Destino en carpeta 12-canales-y-destinatarios. compuesta tenant_id + id.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
