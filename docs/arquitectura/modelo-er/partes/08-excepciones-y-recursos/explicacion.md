# 08. Excepciones y recursos

18 de octubre de 2026

Añada al horario habitual los cambios puntuales y las necesidades físicas. Distinga declarar que hace falta un recurso de reservarlo efectivamente.

**Ejemplo de conjunto.** La ausencia de Ana genera una excepción de agenda. Una atención que necesita un equipo requiere que el recurso físico y el tiempo profesional se adquieran de manera consistente según el alcance aprobado.

**Recorrido.** HORARIO_AGENDA, lámina anterior > EXCEPCION_AGENDA; RECURSO > OFERTA_RECURSO, necesidad > RESERVA_RECURSO, uso concreto.

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

## 1. EXCEPCION_AGENDA: Cambio puntual al horario habitual

Describe una apertura extraordinaria o una indisponibilidad de una agenda en un intervalo concreto, con autor y motivo interno. Puede relacionarse con un lote de reprogramación.

**Ejemplo ficticio.** Ana informa una ausencia el próximo lunes y se registra una excepción de indisponibilidad.

**Cómo distinguirlo.** Bloquear la franja evita nuevas disponibilidades según la operación autorizada, pero no cancela ni resuelve los turnos ya existentes. Esos turnos requieren gestión expresa.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| agenda_id | FK/uuid/obligatorio | Agenda local a la que se refiere la configuración, acción o autorización. Destino: AGENDA, agenda de atención de un profesional en una sede. Cada registro requiere exactamente un destino válido. |
| inicio | instante/obligatorio | Instante de comienzo del intervalo. Debe ser anterior al fin; las ocupaciones usan intervalos con final excluido. |
| fin | instante/obligatorio | Instante de finalización del intervalo. En [inicio, fin), permite que otro intervalo empiece exactamente al terminar este. |
| tipo | enum/obligatorio | Clase de cambio puntual: apertura o indisponibilidad dentro de las reglas de agenda. Sus transiciones detalladas deben revisarse. |
| motivo_interno | texto/opcional | Explicación de uso interno para la solicitud, excepción o lote. Debe mantenerse en el ámbito autorizado. El modelo admite dejarlo vacío. |
| lote_id | FK/uuid/opcional | Operación colectiva de reprogramación con la que se relaciona el registro. Destino: LOTE_REPROGRAMACION, conjunto de cambios por una ausencia del profesional. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| autor_id | FK/uuid/obligatorio | Cuenta de quien crea esta definición o excepción. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |

**Reglas del modelo.** Inicio < fin. Bloquear una ausencia no libera los turnos ya existentes.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R03 R06; ADR-013.

## 2. RECURSO: Sala, equipo u otro recurso físico

Representa un recurso administrativo de una sede y su capacidad. Sirve para describir necesidades adicionales al tiempo del profesional.

**Ejemplo ficticio.** Una práctica necesita el consultorio 2 o un equipo de la sede Centro, como ejemplos de recursos posibles.

**Cómo distinguirlo.** La capacidad del profesional y la del recurso son controles distintos. El alcance del control automático de recursos depende del piloto y no permite asumir sobrecupos.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| sede_id | FK/uuid/obligatorio | Lugar de atención perteneciente a la misma entidad. Destino: SEDE, lugar de atención de una organización. Cada registro requiere exactamente un destino válido. |
| nombre | texto/obligatorio | Nombre legible del registro para identificarlo en su contexto; no reemplaza su identificador interno. |
| tipo | enum/obligatorio | Clase de recurso físico administrativo; ayuda a interpretar capacidad y cantidad. El catálogo concreto depende del alcance aprobado. |
| capacidad | entero/obligatorio | Capacidad administrativa del recurso físico. La unidad y el control efectivo dependen del tipo de recurso y del alcance aprobado. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** Control automático de recursos condicionado al piloto; no asumir sobrecupos.

**Estado.** Extensión propuesta pendiente de validación. **Fuentes.** R03 R06; D02 D05.

## 3. OFERTA_RECURSO: Recurso necesario para prestar una oferta

Relaciona una versión de oferta con el recurso requerido, indicando cantidad y si su uso abarca preparación o cierre.

**Ejemplo ficticio.** Una versión de oferta requiere una unidad de un equipo durante la atención y su preparación.

**Cómo distinguirlo.** Describe la necesidad; no es todavía una reserva concreta. La sede del recurso debe coincidir con la agenda salvo una regla futura explícita.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| version_oferta_id | FK/uuid/obligatorio | Condiciones históricas concretas de la oferta utilizadas. Destino: VERSION_OFERTA, condiciones de atención vigentes para una oferta. Cada registro requiere exactamente un destino válido. |
| recurso_id | FK/uuid/obligatorio | Recurso físico cuya necesidad u ocupación se está registrando. Destino: RECURSO, sala, equipo u otro recurso físico. Cada registro requiere exactamente un destino válido. |
| cantidad | entero/obligatorio | Cantidad de unidades del recurso requeridas o reservadas en este registro. Debe interpretarse con la capacidad del recurso. |
| incluye_preparacion | bool/obligatorio | Indica si el recurso debe ocuparse también durante el tiempo de preparación de la oferta. |
| incluye_cierre | bool/obligatorio | Indica si el recurso debe ocuparse también durante el margen de cierre de la oferta. |

**Reglas del modelo.** UQ(tenant_id,version_oferta_id,recurso_id). Sede del recurso coincide con agenda, salvo regla futura explícita.

**Estado.** Extensión propuesta pendiente de validación. **Fuentes.** R06; docs/16; D02.

## 4. RESERVA_RECURSO: Uso reservado de un recurso físico

Registra la ocupación concreta de un recurso en un intervalo y la vincula con el bloqueo de capacidad del profesional.

**Ejemplo ficticio.** Al asegurar un horario para Ana, también se reserva el equipo necesario para esa atención.

**Cómo distinguirlo.** La adquisición y liberación de recurso y profesional deben ser consistentes. El detalle de este control está sujeto al alcance aprobado; una reserva aislada no debe dejar el sistema en contradicción.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| recurso_id | FK/uuid/obligatorio | Recurso físico cuya necesidad u ocupación se está registrando. Destino: RECURSO, sala, equipo u otro recurso físico. Cada registro requiere exactamente un destino válido. |
| ocupacion_id | FK/uuid/obligatorio | Bloqueo mínimo del tiempo del profesional al que se vincula la operación. Destino: OCUPACION_GLOBAL, bloqueo mínimo del tiempo del profesional. Cada registro requiere exactamente un destino válido. |
| inicio | instante/obligatorio | Instante de comienzo del intervalo. Debe ser anterior al fin; las ocupaciones usan intervalos con final excluido. |
| fin | instante/obligatorio | Instante de finalización del intervalo. En [inicio, fin), permite que otro intervalo empiece exactamente al terminar este. |
| cantidad | entero/obligatorio | Cantidad de unidades del recurso requeridas o reservadas en este registro. Debe interpretarse con la capacidad del recurso. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| vence_en | instante/opcional | Fecha y hora límite de validez. Debe aplicarse la transición o comprobación correspondiente; la fecha por sí sola no ejecuta tareas. El modelo admite dejarlo vacío. |

**Reglas del modelo.** Capacidad del recurso y profesional se adquieren/liberan en la misma unidad consistente; alcance por aprobar.

**Estado.** Extensión propuesta pendiente de validación. **Fuentes.** R03 R06; D02.

## Relaciones de esta lámina, incluidas las referencias externas

- EXCEPCION_AGENDA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de EXCEPCION_AGENDA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- EXCEPCION_AGENDA.agenda_id: cada registro debe referir a exactamente un registro de AGENDA. Como padre, cada registro de AGENDA puede ser referido por cero, uno o varios registros de EXCEPCION_AGENDA mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- EXCEPCION_AGENDA.lote_id: cada registro puede no referir a ninguno o referir a un solo registro de LOTE_REPROGRAMACION. Como padre, cada registro de LOTE_REPROGRAMACION puede ser referido por cero, uno o varios registros de EXCEPCION_AGENDA mediante ese campo. Destino en carpeta 11-reprogramacion-y-gestion. compuesta tenant_id + id.
- EXCEPCION_AGENDA.autor_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de EXCEPCION_AGENDA mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- RECURSO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de RECURSO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- RECURSO.sede_id: cada registro debe referir a exactamente un registro de SEDE. Como padre, cada registro de SEDE puede ser referido por cero, uno o varios registros de RECURSO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. compuesta tenant_id + id.
- OFERTA_RECURSO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de OFERTA_RECURSO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- OFERTA_RECURSO.version_oferta_id: cada registro debe referir a exactamente un registro de VERSION_OFERTA. Como padre, cada registro de VERSION_OFERTA puede ser referido por cero, uno o varios registros de OFERTA_RECURSO mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- OFERTA_RECURSO.recurso_id: cada registro debe referir a exactamente un registro de RECURSO. Como padre, cada registro de RECURSO puede ser referido por cero, uno o varios registros de OFERTA_RECURSO mediante ese campo. Destino en carpeta 08-excepciones-y-recursos. compuesta tenant_id + id.
- RESERVA_RECURSO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de RESERVA_RECURSO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- RESERVA_RECURSO.recurso_id: cada registro debe referir a exactamente un registro de RECURSO. Como padre, cada registro de RECURSO puede ser referido por cero, uno o varios registros de RESERVA_RECURSO mediante ese campo. Destino en carpeta 08-excepciones-y-recursos. compuesta tenant_id + id.
- RESERVA_RECURSO.ocupacion_id: cada registro debe referir a exactamente un registro de OCUPACION_GLOBAL. Como padre, cada registro de OCUPACION_GLOBAL puede ser referido por cero, uno o varios registros de RESERVA_RECURSO mediante ese campo. Destino en carpeta 10-reservas-y-capacidad. ID global restringido.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
