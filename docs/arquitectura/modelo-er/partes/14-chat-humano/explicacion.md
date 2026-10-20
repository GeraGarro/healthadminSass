# 14. Chat humano

18 de octubre de 2026

Empiece por el hilo de conversación y compruebe quién puede participar y qué acciones tiene permitidas. Después examine mensajes y lectura.

**Ejemplo de conjunto.** Lucía conversa con Ana dentro de su relación local. Cada texto conserva su autor real y cada lectura se registra por participante. Pedro no obtiene acceso por gestionar la agenda.

**Recorrido.** CONVERSACION > PARTICIPANTE_CHAT > PARTICIPANTE_PERMISO; CONVERSACION > MENSAJE > LECTURA_MENSAJE.

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

## 1. CONVERSACION: Hilo de chat de un paciente con un profesional

Agrupa mensajes en el contexto de una relación paciente-profesional de una entidad. Tiene ciclo de apertura y cierre.

**Ejemplo ficticio.** Lucía y Ana tienen una conversación vinculada a su relación en Clínica Norte.

**Cómo distinguirlo.** El número de conversaciones simultáneas permitido sigue pendiente. Tener delegación de agenda no incorpora automáticamente a secretaría a este chat.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| paciente_profesional_id | FK/uuid/obligatorio | Relación numerada entre el paciente y el profesional dentro de la entidad. Destino: PACIENTE_PROFESIONAL, relación del paciente con su profesional y su número visible. Cada registro requiere exactamente un destino válido. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| creada_en | instante/obligatorio | Fecha y hora de creación de este registro. |
| cerrada_en | instante/opcional | Fecha y hora en que se cerró la conversación según su ciclo de vida. El modelo admite dejarlo vacío. |

**Reglas del modelo.** Número de conversaciones simultáneas por vínculo pendiente. No participa secretaría por delegación de agenda.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R11.a; D13.

## 2. PARTICIPANTE_CHAT: Cuenta habilitada para participar en una conversación

Registra quién participa, con qué tipo de vínculo, posible representación y período de validez.

**Ejemplo ficticio.** La cuenta de Lucía participa como paciente y la de Ana como profesional, previa comprobación de correspondencia.

**Cómo distinguirlo.** Cada participante debe tener un vínculo verificable con la conversación. La participación administrativa sigue pendiente y los permisos de lectura o envío se detallan aparte.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| conversacion_id | FK/uuid/obligatorio | Hilo de chat al que pertenece el registro o se refiere la notificación. Destino: CONVERSACION, hilo de chat de un paciente con un profesional. Cada registro requiere exactamente un destino válido. |
| cuenta_id | FK/uuid/obligatorio | Cuenta personal asociada a este registro. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| representacion_id | FK/uuid/opcional | Vínculo verificado que permite actuar por el paciente, cuando corresponde. Destino: REPRESENTACION, vínculo verificado para actuar por un paciente. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| tipo | enum/obligatorio | Papel verificado de la cuenta en esa conversación, con las opciones y alcances que se aprueben. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| revocado_en | instante/opcional | Fecha y hora en que se dejó sin efecto este factor, token o autorización. Su ausencia no sustituye las demás verificaciones de vigencia. |

**Reglas del modelo.** UQ(tenant_id,conversacion_id,cuenta_id). Cuenta debe corresponder al paciente/profesional o representante habilitado; participación administrativa pendiente.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R09 R11.a; S14.

## 3. PARTICIPANTE_PERMISO: Acción autorizada a un participante del chat

Relaciona un participante con una operación permitida, como las facultades de lectura, envío o respuesta que se definan.

**Ejemplo ficticio.** Una cuenta participante recibe una facultad concreta sobre esa conversación.

**Cómo distinguirlo.** Participar no concede todas las operaciones. Estos permisos son independientes de los permisos sobre agendas y deben comprobarse en su propio contexto.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| participante_id | FK/uuid/obligatorio | Participación autorizada dentro de una conversación. Destino: PARTICIPANTE_CHAT, cuenta habilitada para participar en una conversación. Cada registro requiere exactamente un destino válido. |
| permiso_id | FK/uuid/obligatorio | Acción concreta que define o concede esta relación. Destino: PERMISO, acción concreta que puede autorizarse. Cada registro requiere exactamente un destino válido. |

**Reglas del modelo.** UQ(tenant_id,participante_id,permiso_id). Participar no concede todas las operaciones.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R11.a; docs/22; D13.

## 4. MENSAJE: Texto enviado por una persona en una conversación

Guarda el contenido de un mensaje humano, su participante autor, fecha y posible referencia a un mensaje que corrige.

**Ejemplo ficticio.** Lucía escribe una consulta y Ana responde. Cada texto conserva la identidad del participante que lo envió.

**Cómo distinguirlo.** El chat no ejecuta cambios de turnos interpretando el texto. El alcance excluye adjuntos e IA y el mecanismo exacto de correcciones trazables debe revisarse.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| conversacion_id | FK/uuid/obligatorio | Hilo de chat al que pertenece el registro o se refiere la notificación. Destino: CONVERSACION, hilo de chat de un paciente con un profesional. Cada registro requiere exactamente un destino válido. |
| participante_autor_id | FK/uuid/obligatorio | Participante real que escribió el mensaje en esa conversación. Destino: PARTICIPANTE_CHAT, cuenta habilitada para participar en una conversación. Cada registro requiere exactamente un destino válido. |
| texto | texto/obligatorio | Contenido del mensaje humano dentro de la conversación autorizada. No implica ejecutar instrucciones de cambio de turno. |
| enviado_en | instante/obligatorio | Momento en que se registró el envío del mensaje humano. |
| estado | enum/obligatorio | Situación del mensaje en su propio ciclo de vida. No expresa confirmación de turno, llegada ni atención del paciente. |
| correccion_de_id | FK/uuid/opcional | Mensaje anterior que se corrige; debe pertenecer a la misma conversación. Destino: MENSAJE, texto enviado por una persona en una conversación. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |

**Reglas del modelo.** Autor y corrección pertenecen a la conversación. Correcciones trazables por revisar; no adjuntos, IA ni cambios de turno por inferencia.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R11.a R12.

## 5. LECTURA_MENSAJE: Constancia de que un participante leyó un mensaje

Asocia un mensaje con un participante y el momento de lectura, evitando duplicar la misma relación.

**Ejemplo ficticio.** Se registra cuándo Ana leyó el mensaje de Lucía.

**Cómo distinguirlo.** Leer no significa haber respondido ni haber atendido a la paciente. El mensaje y el participante deben pertenecer a la misma conversación.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| mensaje_id | FK/uuid/obligatorio | Mensaje concreto del que se registra la lectura. Destino: MENSAJE, texto enviado por una persona en una conversación. Cada registro requiere exactamente un destino válido. |
| participante_id | FK/uuid/obligatorio | Participación autorizada dentro de una conversación. Destino: PARTICIPANTE_CHAT, cuenta habilitada para participar en una conversación. Cada registro requiere exactamente un destino válido. |
| leido_en | instante/obligatorio | Momento de lectura del mensaje o aviso según el contexto. Leer no confirma asistencia ni prueba resolución de una gestión. |

**Reglas del modelo.** UQ(tenant_id,mensaje_id,participante_id). Mensaje y participante de la misma conversación.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R11.a; D13.

## Relaciones de esta lámina, incluidas las referencias externas

- CONVERSACION.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de CONVERSACION mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- CONVERSACION.paciente_profesional_id: cada registro debe referir a exactamente un registro de PACIENTE_PROFESIONAL. Como padre, cada registro de PACIENTE_PROFESIONAL puede ser referido por cero, uno o varios registros de CONVERSACION mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- PARTICIPANTE_CHAT.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de PARTICIPANTE_CHAT mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- PARTICIPANTE_CHAT.conversacion_id: cada registro debe referir a exactamente un registro de CONVERSACION. Como padre, cada registro de CONVERSACION puede ser referido por cero, uno o varios registros de PARTICIPANTE_CHAT mediante ese campo. Destino en carpeta 14-chat-humano. compuesta tenant_id + id.
- PARTICIPANTE_CHAT.cuenta_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de PARTICIPANTE_CHAT mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- PARTICIPANTE_CHAT.representacion_id: cada registro puede no referir a ninguno o referir a un solo registro de REPRESENTACION. Como padre, cada registro de REPRESENTACION puede ser referido por cero, uno o varios registros de PARTICIPANTE_CHAT mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- PARTICIPANTE_PERMISO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de PARTICIPANTE_PERMISO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- PARTICIPANTE_PERMISO.participante_id: cada registro debe referir a exactamente un registro de PARTICIPANTE_CHAT. Como padre, cada registro de PARTICIPANTE_CHAT puede ser referido por cero, uno o varios registros de PARTICIPANTE_PERMISO mediante ese campo. Destino en carpeta 14-chat-humano. compuesta tenant_id + id.
- PARTICIPANTE_PERMISO.permiso_id: cada registro debe referir a exactamente un registro de PERMISO. Como padre, cada registro de PERMISO puede ser referido por cero, uno o varios registros de PARTICIPANTE_PERMISO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- MENSAJE.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de MENSAJE mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- MENSAJE.conversacion_id: cada registro debe referir a exactamente un registro de CONVERSACION. Como padre, cada registro de CONVERSACION puede ser referido por cero, uno o varios registros de MENSAJE mediante ese campo. Destino en carpeta 14-chat-humano. compuesta tenant_id + id.
- MENSAJE.participante_autor_id: cada registro debe referir a exactamente un registro de PARTICIPANTE_CHAT. Como padre, cada registro de PARTICIPANTE_CHAT puede ser referido por cero, uno o varios registros de MENSAJE mediante ese campo. Destino en carpeta 14-chat-humano. compuesta tenant_id + id.
- MENSAJE.correccion_de_id: cada registro puede no referir a ninguno o referir a un solo registro de MENSAJE. Como padre, cada registro de MENSAJE puede ser referido por cero, uno o varios registros de MENSAJE mediante ese campo. Destino en carpeta 14-chat-humano. compuesta tenant_id + id.
- LECTURA_MENSAJE.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de LECTURA_MENSAJE mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- LECTURA_MENSAJE.mensaje_id: cada registro debe referir a exactamente un registro de MENSAJE. Como padre, cada registro de MENSAJE puede ser referido por cero, uno o varios registros de LECTURA_MENSAJE mediante ese campo. Destino en carpeta 14-chat-humano. compuesta tenant_id + id.
- LECTURA_MENSAJE.participante_id: cada registro debe referir a exactamente un registro de PARTICIPANTE_CHAT. Como padre, cada registro de PARTICIPANTE_CHAT puede ser referido por cero, uno o varios registros de LECTURA_MENSAJE mediante ese campo. Destino en carpeta 14-chat-humano. compuesta tenant_id + id.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
