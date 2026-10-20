# 04. Profesionales e incorporación

18 de octubre de 2026

Estudie la diferencia entre la identidad profesional que persiste y cada vínculo con una clínica. Luego revise las solicitudes de incorporación y las invitaciones del equipo.

**Ejemplo de conjunto.** Ana puede atender en dos entidades con una identidad profesional global y dos vínculos locales. Una nueva clínica puede atravesar el trámite propuesto de incorporación y después invitar a su equipo.

**Recorrido.** PROFESIONAL_GLOBAL > PROFESIONAL_ENTIDAD; SOLICITUD_ENTIDAD > revisión > entidad y primera habilitación autorizadas; INVITACION_EQUIPO > aceptación verificada > MEMBRESIA.

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

## 1. PROFESIONAL_GLOBAL: Identidad profesional reconocida en la plataforma

Identifica al mismo profesional a través de sus vínculos con distintas entidades. Permite coordinar su capacidad de atención y mantener una referencia profesional estable.

**Ejemplo ficticio.** Ana trabaja en dos clínicas. Ambas relaciones apuntan a su misma identidad profesional global.

**Cómo distinguirlo.** La identidad profesional es distinta de la cuenta de acceso, que puede ser opcional en este registro. Su alcance global no convierte las fichas de pacientes en información compartida.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| cuenta_id | FK/uuid/opcional | Cuenta personal asociada a este registro. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| nombre_referencia | texto/obligatorio | Nombre de referencia de la identidad profesional global. No es una clave segura para unir profesionales por coincidencia. |
| matricula_referencia | texto/opcional | Referencia de matrícula profesional. Los criterios exactos de verificación deben definirse. El modelo admite dejarlo vacío. |
| verificacion_ref | texto/opcional | Referencia a la evidencia de la verificación administrativa o profesional, según el registro; no sustituye los permisos de acceso. El modelo admite dejarlo vacío. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** UQ(cuenta_id) cuando presente. No deduplicar por nombre. Referencia histórica mínima tras eliminación por resolver.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R03 R05; ADR-011; D02.

## 2. PROFESIONAL_ENTIDAD: Vínculo de un profesional con una clínica

Une una identidad profesional global con una entidad concreta y registra vigencia y posible membresía de acceso.

**Ejemplo ficticio.** Ana tiene un vínculo profesional con Clínica Norte y otro con Clínica Sur.

**Cómo distinguirlo.** Terminar un vínculo local no elimina su identidad global ni implica cancelar todos sus turnos automáticamente. La pertenencia profesional y la cuenta de usuario son dimensiones distintas.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| profesional_id | FK/uuid/obligatorio | Identidad profesional global a la que corresponde el registro. Destino: PROFESIONAL_GLOBAL, identidad profesional reconocida en la plataforma. Cada registro requiere exactamente un destino válido. |
| membresia_id | FK/uuid/opcional | Pertenencia al equipo de la entidad sobre la que se apoya esta relación. Destino: MEMBRESIA, pertenencia de una persona al equipo de una clínica. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** UQ(tenant_id,profesional_id). Finalizar no libera turnos ni destruye fichaje. Retención de referencia histórica por revisar.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R01 R05; ADR-011.

## 3. SOLICITUD_ENTIDAD: Solicitud para incorporar una clínica o actividad

Registra el trámite de quien pide incorporar una organización, su relación declarada, el contacto administrativo y el resultado de revisión.

**Ejemplo ficticio.** Ana solicita incorporar su consultorio independiente. Plataforma revisa la solicitud y verifica quién será su primer administrador.

**Cómo distinguirlo.** Es una propuesta funcional todavía no aprobada. Presentar el formulario no concede administración, contrato ni suscripción y no prueba por sí solo representación legal.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| solicitante_id | FK/uuid/obligatorio | Cuenta de quien presenta la solicitud; puede actuar por otra persona cuando el modelo lo permite. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| tipo_entidad | enum/obligatorio | Clase de organización o actividad solicitada, como clínica o actividad independiente dentro de las propuestas documentadas. |
| nombre_propuesto | texto/obligatorio | Nombre que el solicitante propone para la entidad que desea incorporar. |
| relacion_declarada | texto/obligatorio | Relación que la persona afirma tener con la entidad solicitada. La declaración no prueba representación por sí sola. |
| admin_contacto | texto/opcional | Contacto de la persona propuesta para administrar la entidad, cuando es necesario registrarlo en el trámite. El modelo admite dejarlo vacío. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| entidad_resultado_id | FK/uuid/opcional | Entidad determinada o creada como resultado de la solicitud aprobada. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| revisor_id | FK/uuid/opcional | Cuenta de quien revisa el trámite o caso. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| resuelta_en | instante/opcional | Fecha y hora de resolución de la solicitud. Debe leerse junto con su estado y motivo cuando corresponda. El modelo admite dejarlo vacío. |

**Reglas del modelo.** No concede administración, contrato ni suscripción.

**Estado.** Propuesta funcional no aprobada. **Fuentes.** docs/20; CU-35; D14.

## 4. INVITACION_EQUIPO: Invitación personal para incorporarse al equipo

Identifica la entidad, quién invita, destinatario, token y alcance propuesto. Tras la aceptación verificada puede quedar asociada a una membresía.

**Ejemplo ficticio.** Una persona autorizada de Clínica Norte invita a Pedro a incorporarse al equipo y le envía una invitación personal.

**Cómo distinguirlo.** El destinatario debe corresponder a la cuenta que acepta. Reenviar el enlace no debería otorgar facultades a otra persona. La invitación no delega automáticamente agendas.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| emisor_id | FK/uuid/obligatorio | Cuenta de quien emite la invitación. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| destinatario | texto/obligatorio | Destino al que se dirige el proceso de identidad o invitación, por ejemplo un correo. Debe comprobarse su correspondencia al completar la acción. |
| cuenta_destino_id | FK/uuid/opcional | Cuenta destinataria de la invitación, cuando ya esté identificada. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| token_id | FK/uuid/obligatorio | Token de identidad que autoriza la acción de recuperación, verificación o invitación. Destino: TOKEN_IDENTIDAD, autorización temporal para una acción de acceso. Cada registro requiere exactamente un destino válido. |
| rol_propuesto_id | FK/uuid/opcional | Rol propuesto en la invitación, sujeto a aceptación y comprobación autorizadas. Destino: ROL, conjunto identificado de funciones. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| vence_en | instante/obligatorio | Fecha y hora límite de validez. Debe aplicarse la transición o comprobación correspondiente; la fecha por sí sola no ejecuta tareas. |
| membresia_id | FK/uuid/opcional | Pertenencia al equipo de la entidad sobre la que se apoya esta relación. Destino: MEMBRESIA, pertenencia de una persona al equipo de una clínica. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |

**Reglas del modelo.** UQ(token_id). Correspondencia verificada al aceptar; invitación no delega agendas.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** docs/20; CU-07; D14.

## Relaciones de esta lámina, incluidas las referencias externas

- PROFESIONAL_GLOBAL.cuenta_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero o un registro de PROFESIONAL_GLOBAL mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- PROFESIONAL_ENTIDAD.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de PROFESIONAL_ENTIDAD mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- PROFESIONAL_ENTIDAD.profesional_id: cada registro debe referir a exactamente un registro de PROFESIONAL_GLOBAL. Como padre, cada registro de PROFESIONAL_GLOBAL puede ser referido por cero, uno o varios registros de PROFESIONAL_ENTIDAD mediante ese campo. Destino en carpeta 04-profesionales-e-incorporacion. ID global restringido.
- PROFESIONAL_ENTIDAD.membresia_id: cada registro puede no referir a ninguno o referir a un solo registro de MEMBRESIA. Como padre, cada registro de MEMBRESIA puede ser referido por cero, uno o varios registros de PROFESIONAL_ENTIDAD mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. compuesta tenant_id + id.
- SOLICITUD_ENTIDAD.solicitante_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de SOLICITUD_ENTIDAD mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- SOLICITUD_ENTIDAD.entidad_resultado_id: cada registro puede no referir a ninguno o referir a un solo registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de SOLICITUD_ENTIDAD mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- SOLICITUD_ENTIDAD.revisor_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de SOLICITUD_ENTIDAD mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- INVITACION_EQUIPO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de INVITACION_EQUIPO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- INVITACION_EQUIPO.emisor_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de INVITACION_EQUIPO mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- INVITACION_EQUIPO.cuenta_destino_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de INVITACION_EQUIPO mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- INVITACION_EQUIPO.token_id: cada registro debe referir a exactamente un registro de TOKEN_IDENTIDAD. Como padre, cada registro de TOKEN_IDENTIDAD puede ser referido por cero o un registro de INVITACION_EQUIPO mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- INVITACION_EQUIPO.rol_propuesto_id: cada registro puede no referir a ninguno o referir a un solo registro de ROL. Como padre, cada registro de ROL puede ser referido por cero, uno o varios registros de INVITACION_EQUIPO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- INVITACION_EQUIPO.membresia_id: cada registro puede no referir a ninguno o referir a un solo registro de MEMBRESIA. Como padre, cada registro de MEMBRESIA puede ser referido por cero, uno o varios registros de INVITACION_EQUIPO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. compuesta tenant_id + id.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
