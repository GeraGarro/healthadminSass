# 07. Agendas y catálogo

18 de octubre de 2026

Distinga la agenda, el servicio del catálogo y la oferta concreta que se habilita en esa agenda. Después agregue condiciones históricas, horarios y autorizaciones para gestionarla.

**Ejemplo de conjunto.** Ana tiene una agenda en sede Centro. La práctica Consulta se habilita como una oferta con duración y condiciones versionadas. Pedro solo gestiona esa agenda si existe delegación válida con acciones comprendidas.

**Recorrido.** AGENDA > OFERTA > VERSION_OFERTA; PRACTICA > VERSION_PRACTICA; HORARIO_AGENDA define recurrencia; DELEGACION_AGENDA y DELEGACION_PERMISO delimitan gestión.

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

## 1. AGENDA: Agenda de atención de un profesional en una sede

Identifica una agenda local asociada al vínculo profesional y al lugar de atención. Es el contexto donde se habilitan prácticas, horarios y delegaciones.

**Ejemplo ficticio.** Ana tiene una agenda de consultas en la sede Centro de Clínica Norte.

**Cómo distinguirlo.** La agenda identifica dónde se organiza la atención. Las franjas recurrentes se guardan en HORARIO_AGENDA y los turnos concretos se registran por separado.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| profesional_entidad_id | FK/uuid/obligatorio | Vínculo local del profesional con la entidad de este registro. Destino: PROFESIONAL_ENTIDAD, vínculo de un profesional con una clínica. Cada registro requiere exactamente un destino válido. |
| sede_id | FK/uuid/obligatorio | Lugar de atención perteneciente a la misma entidad. Destino: SEDE, lugar de atención de una organización. Cada registro requiere exactamente un destino válido. |
| nombre | texto/obligatorio | Nombre legible del registro para identificarlo en su contexto; no reemplaza su identificador interno. |
| zona_horaria | texto/obligatorio | Zona utilizada para interpretar y mostrar horarios. Los instantes y las horas locales recurrentes requieren tratamientos diferentes. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** Sede y vínculo profesional pertenecen al mismo tenant.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R04 R06.

## 2. DELEGACION_AGENDA: Autorización personal para gestionar una agenda

Registra a qué integrante del equipo le delega el titular profesional el manejo de una agenda, durante qué período y con posibilidad de revocación.

**Ejemplo ficticio.** Ana delega a Pedro la gestión autorizada de su agenda de consultas.

**Cómo distinguirlo.** El otorgante debe ser titular de la agenda y el destinatario miembro activo de la misma entidad. Ser secretario o administrador no reemplaza esta delegación y no implica poder volver a delegar.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| agenda_id | FK/uuid/obligatorio | Agenda local a la que se refiere la configuración, acción o autorización. Destino: AGENDA, agenda de atención de un profesional en una sede. Cada registro requiere exactamente un destino válido. |
| membresia_id | FK/uuid/obligatorio | Pertenencia al equipo de la entidad sobre la que se apoya esta relación. Destino: MEMBRESIA, pertenencia de una persona al equipo de una clínica. Cada registro requiere exactamente un destino válido. |
| otorgante_profesional_id | FK/uuid/obligatorio | Vínculo profesional del titular que concede la delegación de su agenda. Destino: PROFESIONAL_ENTIDAD, vínculo de un profesional con una clínica. Cada registro requiere exactamente un destino válido. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| revocada_en | instante/opcional | Fecha y hora en que se dejó sin efecto esta vinculación, autorización o credencial. Vacío solo indica que no consta revocación; pueden existir otras condiciones de validez. |

**Reglas del modelo.** Otorgante debe ser titular de la agenda; destinatario es miembro activo de la misma entidad. Sin subdelegación implícita.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R04.

## 3. DELEGACION_PERMISO: Operación permitida dentro de una delegación

Indica cada acción específica que comprende la delegación de una agenda. Hace posible separar consulta, registro u otras operaciones que se aprueben.

**Ejemplo ficticio.** La delegación de Pedro puede incluir ciertas operaciones de turnos expresamente autorizadas.

**Cómo distinguirlo.** La delegación no concede chat ni admisión por el mero hecho de permitir operar una agenda. Cada acción debe estar comprendida en el permiso correspondiente.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| delegacion_id | FK/uuid/obligatorio | Autorización de agenda cuyo alcance se descompone en acciones. Destino: DELEGACION_AGENDA, autorización personal para gestionar una agenda. Cada registro requiere exactamente un destino válido. |
| permiso_id | FK/uuid/obligatorio | Acción concreta que define o concede esta relación. Destino: PERMISO, acción concreta que puede autorizarse. Cada registro requiere exactamente un destino válido. |

**Reglas del modelo.** UQ(tenant_id,delegacion_id,permiso_id). No concede chat ni admisión por operar agenda.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R04; D03.

## 4. PRACTICA: Tipo estable de servicio de atención

Es la identidad de catálogo de una práctica administrativa dentro de una entidad. Conserva código, origen y una posible identidad reservada del catálogo inicial.

**Ejemplo ficticio.** Clínica Norte tiene una práctica base Consulta y puede crear otras prácticas personalizadas para su operación.

**Cómo distinguirlo.** El nombre y la descripción están en sus versiones. Llamar «Consulta» a una práctica personalizada no le otorga la identidad base CONSULTA ni habilita la selección desde el portal.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| codigo_local | texto/obligatorio | Código de la práctica o cobertura dentro de la entidad, sujeto a las restricciones locales del modelo. |
| origen | enum/obligatorio | Procedencia de la práctica, por ejemplo catálogo inicial o creación personalizada según la definición que se apruebe. |
| base_inicial | enum/opcional | Identidad reservada de una práctica del catálogo inicial. La base CONSULTA no se obtiene cambiando el nombre; una práctica personalizada tiene esta base vacía. El modelo admite dejarlo vacío. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** UQ(tenant_id,codigo_local). UQ parcial(tenant_id,base_inicial). Base CONSULTA reservada al alta inicial; personalizada exige base nula e inmutable.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R06; ADR-009; docs/16.

## 5. VERSION_PRACTICA: Descripción histórica de una práctica

Conserva una definición inmutable de nombre, clasificación y descripción, con autor y fecha. Permite saber qué definición se utilizó en una oferta histórica.

**Ejemplo ficticio.** La práctica cambia su descripción. Se crea una nueva versión mientras las ofertas históricas siguen referenciando la anterior.

**Cómo distinguirlo.** Modificar la descripción no altera la identidad base de PRACTICA. Las versiones preservan historia; no deben sobrescribirse para aparentar que una definición vieja siempre tuvo el texto nuevo.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| practica_id | FK/uuid/obligatorio | Identidad estable de la práctica a la que corresponde este registro. Destino: PRACTICA, tipo estable de servicio de atención. Cada registro requiere exactamente un destino válido. |
| numero_version | entero/obligatorio | Secuencia de versiones dentro del objeto padre. Permite distinguir definiciones históricas sin alterar sus registros anteriores. |
| nombre | texto/obligatorio | Nombre legible del registro para identificarlo en su contexto; no reemplaza su identificador interno. |
| clasificacion | texto/obligatorio | Clasificación administrativa de la práctica en esta versión. No cambia su identidad base ni habilita por sí sola la selección desde el portal. |
| descripcion | texto/opcional | Descripción legible de la práctica en esta versión histórica. El modelo admite dejarlo vacío. |
| autor_id | FK/uuid/obligatorio | Cuenta de quien crea esta definición o excepción. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| creada_en | instante/obligatorio | Fecha y hora de creación de este registro. |

**Reglas del modelo.** UQ(tenant_id,practica_id,numero_version). Cambiar nombre o clasificación no cambia base ni permite autoselección.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R06 R12; docs/16.

## 6. OFERTA: Práctica habilitada en una agenda concreta

Asocia una práctica del catálogo con una agenda donde efectivamente se puede ofrecer. Marca la habilitación operativa de ese servicio en ese contexto.

**Ejemplo ficticio.** La práctica Consulta se habilita en la agenda de Ana en sede Centro.

**Cómo distinguirlo.** Crear una práctica en el catálogo no la vuelve reservable en todas las agendas. OFERTA establece esa vinculación y VERSION_OFERTA conserva sus condiciones.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| agenda_id | FK/uuid/obligatorio | Agenda local a la que se refiere la configuración, acción o autorización. Destino: AGENDA, agenda de atención de un profesional en una sede. Cada registro requiere exactamente un destino válido. |
| practica_id | FK/uuid/obligatorio | Identidad estable de la práctica a la que corresponde este registro. Destino: PRACTICA, tipo estable de servicio de atención. Cada registro requiere exactamente un destino válido. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** UQ(tenant_id,agenda_id,practica_id). Crear catálogo no habilita ofertas.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R06; docs/16.

## 7. VERSION_OFERTA: Condiciones de atención vigentes para una oferta

Guarda una versión inmutable de duración, preparación, cierre, modalidades y habilitaciones de una oferta. Conserva también qué versión de práctica utiliza y durante qué período se aplica.

**Ejemplo ficticio.** Las consultas de Ana duran 30 minutos y requieren un margen de cierre, como ejemplo ilustrativo. Al cambiar las condiciones, se crea otra versión.

**Cómo distinguirlo.** Los minutos del ejemplo no son una regla aprobada. Habilitar el portal requiere la base CONSULTA y ausencia de gestión obligatoria; llamar Consulta a otra práctica no satisface esa condición.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| oferta_id | FK/uuid/obligatorio | Habilitación de una práctica en una agenda concreta. Destino: OFERTA, práctica habilitada en una agenda concreta. Cada registro requiere exactamente un destino válido. |
| version_practica_id | FK/uuid/obligatorio | Definición histórica concreta de la práctica utilizada. Destino: VERSION_PRACTICA, descripción histórica de una práctica. Cada registro requiere exactamente un destino válido. |
| numero_version | entero/obligatorio | Secuencia de versiones dentro del objeto padre. Permite distinguir definiciones históricas sin alterar sus registros anteriores. |
| duracion_min | entero/obligatorio | Duración de la atención expresada en minutos. Debe ser mayor que cero. |
| preparacion_min | entero/obligatorio | Minutos de preparación contemplados por la oferta; deben ser cero o positivos. |
| cierre_min | entero/obligatorio | Minutos de cierre contemplados por la oferta; deben ser cero o positivos. |
| modalidad | enum/obligatorio | Modalidad de la oferta según el catálogo que se defina; debe diferenciarse de la modalidad de cobertura elegida al evaluar elegibilidad. |
| portal_habilitado | bool/obligatorio | Indica si esta versión permite selección desde el portal. Requiere la base CONSULTA y ausencia de gestión obligatoria según las reglas vigentes. |
| gestion_personal | bool/obligatorio | Indica si la oferta necesita gestión del personal en lugar de selección autónoma habilitada desde el portal. |
| particular_habilitado | bool/obligatorio | Indica si la oferta admite atención particular. No reemplaza la elección expresa de esa modalidad por el paciente. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |

**Reglas del modelo.** UQ(tenant_id,oferta_id,numero_version). Duración >0 y pausas >=0. Práctica de versión coincide con oferta; portal implica base CONSULTA y no gestión obligatoria. Vigencias activas sin solapamiento.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R06 R07; docs/16.

## 8. HORARIO_AGENDA: Horario semanal habitual de una agenda

Registra disponibilidad recurrente por día de semana, hora local y período de aplicación. La zona horaria de la agenda permite interpretar esas horas.

**Ejemplo ficticio.** La agenda de Ana se ofrece los lunes de 09:00 a 12:00 durante un período determinado, como ejemplo.

**Cómo distinguirlo.** El horario habitual no garantiza que un instante esté libre: hay que considerar excepciones, ocupaciones, condiciones de oferta y recursos. Los horarios nocturnos se dividen según la regla documentada.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| agenda_id | FK/uuid/obligatorio | Agenda local a la que se refiere la configuración, acción o autorización. Destino: AGENDA, agenda de atención de un profesional en una sede. Cada registro requiere exactamente un destino válido. |
| dia_semana | entero/obligatorio | Día al que se aplica el horario semanal recurrente. La codificación exacta debe acordarse. |
| hora_inicio | hora/obligatorio | Hora local de inicio del tramo semanal, interpretada en la zona de la agenda. |
| hora_fin | hora/obligatorio | Hora local de finalización del tramo semanal. Debe ser posterior a su inicio; los tramos nocturnos se dividen. |
| desde | fecha/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | fecha/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |

**Reglas del modelo.** Inicio anterior a fin; horarios nocturnos se dividen. No es ocupación ni garantiza disponibilidad efectiva.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R06; D05.

## Relaciones de esta lámina, incluidas las referencias externas

- AGENDA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de AGENDA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- AGENDA.profesional_entidad_id: cada registro debe referir a exactamente un registro de PROFESIONAL_ENTIDAD. Como padre, cada registro de PROFESIONAL_ENTIDAD puede ser referido por cero, uno o varios registros de AGENDA mediante ese campo. Destino en carpeta 04-profesionales-e-incorporacion. compuesta tenant_id + id.
- AGENDA.sede_id: cada registro debe referir a exactamente un registro de SEDE. Como padre, cada registro de SEDE puede ser referido por cero, uno o varios registros de AGENDA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. compuesta tenant_id + id.
- DELEGACION_AGENDA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de DELEGACION_AGENDA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- DELEGACION_AGENDA.agenda_id: cada registro debe referir a exactamente un registro de AGENDA. Como padre, cada registro de AGENDA puede ser referido por cero, uno o varios registros de DELEGACION_AGENDA mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- DELEGACION_AGENDA.membresia_id: cada registro debe referir a exactamente un registro de MEMBRESIA. Como padre, cada registro de MEMBRESIA puede ser referido por cero, uno o varios registros de DELEGACION_AGENDA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. compuesta tenant_id + id.
- DELEGACION_AGENDA.otorgante_profesional_id: cada registro debe referir a exactamente un registro de PROFESIONAL_ENTIDAD. Como padre, cada registro de PROFESIONAL_ENTIDAD puede ser referido por cero, uno o varios registros de DELEGACION_AGENDA mediante ese campo. Destino en carpeta 04-profesionales-e-incorporacion. compuesta tenant_id + id.
- DELEGACION_PERMISO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de DELEGACION_PERMISO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- DELEGACION_PERMISO.delegacion_id: cada registro debe referir a exactamente un registro de DELEGACION_AGENDA. Como padre, cada registro de DELEGACION_AGENDA puede ser referido por cero, uno o varios registros de DELEGACION_PERMISO mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- DELEGACION_PERMISO.permiso_id: cada registro debe referir a exactamente un registro de PERMISO. Como padre, cada registro de PERMISO puede ser referido por cero, uno o varios registros de DELEGACION_PERMISO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- PRACTICA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de PRACTICA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- VERSION_PRACTICA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de VERSION_PRACTICA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- VERSION_PRACTICA.practica_id: cada registro debe referir a exactamente un registro de PRACTICA. Como padre, cada registro de PRACTICA puede ser referido por cero, uno o varios registros de VERSION_PRACTICA mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- VERSION_PRACTICA.autor_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de VERSION_PRACTICA mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- OFERTA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de OFERTA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- OFERTA.agenda_id: cada registro debe referir a exactamente un registro de AGENDA. Como padre, cada registro de AGENDA puede ser referido por cero, uno o varios registros de OFERTA mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- OFERTA.practica_id: cada registro debe referir a exactamente un registro de PRACTICA. Como padre, cada registro de PRACTICA puede ser referido por cero, uno o varios registros de OFERTA mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- VERSION_OFERTA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de VERSION_OFERTA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- VERSION_OFERTA.oferta_id: cada registro debe referir a exactamente un registro de OFERTA. Como padre, cada registro de OFERTA puede ser referido por cero, uno o varios registros de VERSION_OFERTA mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- VERSION_OFERTA.version_practica_id: cada registro debe referir a exactamente un registro de VERSION_PRACTICA. Como padre, cada registro de VERSION_PRACTICA puede ser referido por cero, uno o varios registros de VERSION_OFERTA mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- HORARIO_AGENDA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de HORARIO_AGENDA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- HORARIO_AGENDA.agenda_id: cada registro debe referir a exactamente un registro de AGENDA. Como padre, cada registro de AGENDA puede ser referido por cero, uno o varios registros de HORARIO_AGENDA mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
