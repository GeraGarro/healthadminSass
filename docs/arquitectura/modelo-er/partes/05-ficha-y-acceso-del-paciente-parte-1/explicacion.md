# 05. Ficha y acceso del paciente, parte 1

18 de octubre de 2026

Separe los datos administrativos del paciente de su cuenta de acceso. Después revise quién puede actuar por él, cómo se aprueba el acceso y qué profesional o agenda comprende.

**Ejemplo de conjunto.** Lucía tiene una ficha local y contactos. Si solicita el portal, se revisa la admisión, se verifica la vinculación de su cuenta y se concede un alcance concreto. Una representante necesita su propio vínculo y facultades.

**Recorrido.** PACIENTE > contactos y solicitud de admisión > representación si corresponde > ACCESO_PACIENTE > ALCANCE_ACCESO. PACIENTE_PROFESIONAL conserva su relación numerada.

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

## 1. PACIENTE: Ficha administrativa de un paciente en una clínica

Reúne datos administrativos de una persona atendida dentro de una entidad, tenga o no cuenta de acceso. La ficha es local a esa organización.

**Ejemplo ficticio.** Clínica Norte registra a Lucía Gómez como paciente, aunque Lucía nunca haya entrado al portal.

**Cómo distinguirlo.** La tabla contiene información administrativa, no una historia clínica. Una ficha de otra entidad no se fusiona por coincidencias de nombre o documento. La edad se calcula a partir del nacimiento.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| nombres | texto/obligatorio | Nombres de la persona registrados en la ficha administrativa local. |
| apellidos | texto/obligatorio | Apellidos de la persona registrados en la ficha administrativa local. |
| tipo_documento | texto/opcional | Clase del documento declarado en la ficha; es distinta de su número y de una verificación de identidad. El modelo admite dejarlo vacío. |
| documento_declarado | texto/opcional | Dato documental proporcionado administrativamente. Su coincidencia no autoriza fusionar fichas ni sancionar automáticamente. El modelo admite dejarlo vacío. |
| nacimiento | fecha/opcional | Fecha de nacimiento; permite calcular la edad al momento de consulta sin almacenar una edad que quede desactualizada. El modelo admite dejarlo vacío. |
| domicilio | texto/opcional | Domicilio administrativo de la persona registrado en la ficha local. El modelo admite dejarlo vacío. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| estado_datos_cobertura | enum/obligatorio | Indica la situación del conocimiento de cobertura. «Sin dato» debe distinguirse de una declaración de ausencia de cobertura. |

**Reglas del modelo.** Campos concretos propuestos. No guarda edad redundante ni historia clínica; sin dato no significa sin cobertura.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R01.a R09; ADR-010; docs/18.

## 2. CONTACTO_PACIENTE: Teléfono o correo registrado para contactar al paciente

Guarda un medio de contacto y una descripción de su titular, con su verificación y situación. Permite conservar varios contactos por paciente.

**Ejemplo ficticio.** La ficha de Lucía incluye su correo y el teléfono de su madre, identificando quién utiliza cada contacto.

**Cómo distinguirlo.** Tener un teléfono registrado no demuestra representación ni habilita el portal. Un contacto familiar puede servir a varios pacientes; el número por sí solo no identifica inequívocamente a uno.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| paciente_id | FK/uuid/obligatorio | Ficha administrativa local del paciente involucrado. Destino: PACIENTE, ficha administrativa de un paciente en una clínica. Cada registro requiere exactamente un destino válido. |
| tipo | enum/obligatorio | Clase de medio de contacto, por ejemplo teléfono o correo según el catálogo que se defina. No expresa parentesco ni representación. |
| valor | texto/obligatorio | Contenido del medio de contacto, como una dirección de correo o número telefónico, según su tipo. |
| titular_descripcion | texto/opcional | Descripción de quién utiliza o es titular del contacto, por ejemplo paciente o familiar. No establece una representación. El modelo admite dejarlo vacío. |
| verificado_en | instante/opcional | Fecha y hora de la comprobación del factor o contacto descrito por este registro; no equivale a verificar todos los datos de la persona. El modelo admite dejarlo vacío. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** Teléfono familiar no acredita identidad ni es único por paciente.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R09 R11; docs/18.

## 3. SOLICITUD_ADMISION: Pedido de habilitación administrativa del paciente

Registra una solicitud para ingresar al circuito autorizado de una entidad. Conserva datos declarados, verificación de contacto, revisión y la ficha a la que se resolvió asociar.

**Ejemplo ficticio.** Lucía solicita acceso para atenderse con Ana. El personal revisa su solicitud antes de habilitar el acceso correspondiente.

**Cómo distinguirlo.** La solicitud no reserva horarios ni ocupa capacidad. El solicitante puede actuar por otra persona y puede no tener una cuenta previa. Coincidir en datos no autoriza una fusión automática.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| solicitante_id | FK/uuid/opcional | Cuenta de quien presenta la solicitud; puede actuar por otra persona cuando el modelo lo permite. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| profesional_entidad_id | FK/uuid/opcional | Vínculo local del profesional con la entidad de este registro. Destino: PROFESIONAL_ENTIDAD, vínculo de un profesional con una clínica. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| datos_declarados | json/obligatorio | Datos aportados en la solicitud de admisión. El formato estructurado conserva la declaración y requiere revisión; no reemplaza la ficha aprobada. |
| contacto_verificado_en | instante/opcional | Fecha y hora de verificación del contacto utilizado en la solicitud. El modelo admite dejarlo vacío. |
| paciente_resuelto_id | FK/uuid/opcional | Ficha local determinada como resultado de revisar la solicitud. Destino: PACIENTE, ficha administrativa de un paciente en una clínica. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| revisor_id | FK/uuid/opcional | Cuenta de quien revisa el trámite o caso. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| motivo_interno | texto/opcional | Explicación de uso interno para la solicitud, excepción o lote. Debe mantenerse en el ámbito autorizado. El modelo admite dejarlo vacío. |
| resuelta_en | instante/opcional | Fecha y hora de resolución de la solicitud. Debe leerse junto con su estado y motivo cuando corresponda. El modelo admite dejarlo vacío. |

**Reglas del modelo.** Solicitante puede actuar por otro; sin cuenta previa es posible. No fusionar por coincidencias.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R09.a; ADR-007; docs/11-12.

## 4. REPRESENTACION: Vínculo verificado para actuar por un paciente

Vincula la cuenta de un representante con un paciente, especificando tipo, evidencia, verificador, vigencia y restricciones.

**Ejemplo ficticio.** La madre de una paciente menor queda registrada como representante después de la comprobación correspondiente.

**Cómo distinguirlo.** Un contacto de emergencia o un titular de cobertura no se convierte automáticamente en representante. Puede haber varios representantes con alcances diferentes.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| paciente_id | FK/uuid/obligatorio | Ficha administrativa local del paciente involucrado. Destino: PACIENTE, ficha administrativa de un paciente en una clínica. Cada registro requiere exactamente un destino válido. |
| representante_id | FK/uuid/obligatorio | Cuenta de la persona habilitada para actuar por el paciente. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| tipo | enum/obligatorio | Clase de representación verificada según el catálogo y las evidencias que se aprueben. La relación familiar declarada por sí sola no concede facultades. |
| evidencia_ref | texto/obligatorio | Referencia a la evidencia autorizada que respalda una verificación, ensayo o actuación. No implica almacenar archivos sensibles directamente aquí. |
| verificador_id | FK/uuid/obligatorio | Cuenta de quien comprueba la evidencia administrativa. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| restricciones | texto/opcional | Límites específicos de la representación; deben considerarse junto con sus permisos y vigencia. El modelo admite dejarlo vacío. |
| revocada_en | instante/opcional | Fecha y hora en que se dejó sin efecto esta vinculación, autorización o credencial. Vacío solo indica que no consta revocación; pueden existir otras condiciones de validez. |

**Reglas del modelo.** Varios representantes posibles. Contacto de emergencia y titular de cobertura no confieren esta relación.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R09; D08.

## 5. REPRESENTACION_PERMISO: Acción que puede ejercer un representante

Descompone la representación en facultades concretas, mediante una relación entre el vínculo de representación y un permiso.

**Ejemplo ficticio.** Una representación permite gestionar turnos, mientras que otra facultad de lectura de chat debe analizarse por separado.

**Cómo distinguirlo.** Ser representante no concede todas las operaciones. La tabla permite expresar cada atribución sin inferirla a partir del parentesco.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| representacion_id | FK/uuid/obligatorio | Vínculo verificado que permite actuar por el paciente, cuando corresponde. Destino: REPRESENTACION, vínculo verificado para actuar por un paciente. Cada registro requiere exactamente un destino válido. |
| permiso_id | FK/uuid/obligatorio | Acción concreta que define o concede esta relación. Destino: PERMISO, acción concreta que puede autorizarse. Cada registro requiere exactamente un destino válido. |

**Reglas del modelo.** UQ(tenant_id,representacion_id,permiso_id). Gestión de turnos y lectura de chat son distintas.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R09; docs/22; D08.

## 6. ACCESO_PACIENTE: Vinculación aprobada de una cuenta con una ficha

Registra la cuenta que puede operar respecto de un paciente, con aprobación, activación y evidencia de vinculación. Puede tratarse de la persona misma o de su representante.

**Ejemplo ficticio.** La cuenta de Lucía se vincula con su ficha tras verificar correspondencia y aprobar su acceso. Para una menor, puede vincularse una cuenta representante.

**Cómo distinguirlo.** Aprobar y activar son momentos distintos. Si hay representación, debe coincidir con el paciente y la cuenta registrados. Conocer un número de paciente no concede acceso.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| paciente_id | FK/uuid/obligatorio | Ficha administrativa local del paciente involucrado. Destino: PACIENTE, ficha administrativa de un paciente en una clínica. Cada registro requiere exactamente un destino válido. |
| cuenta_id | FK/uuid/obligatorio | Cuenta personal asociada a este registro. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| representacion_id | FK/uuid/opcional | Vínculo verificado que permite actuar por el paciente, cuando corresponde. Destino: REPRESENTACION, vínculo verificado para actuar por un paciente. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| solicitud_id | FK/uuid/opcional | Solicitud de admisión vinculada al acceso aprobado. Destino: SOLICITUD_ADMISION, pedido de habilitación administrativa del paciente. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| aprobador_id | FK/uuid/obligatorio | Cuenta de quien aprueba la concesión, acceso o política. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| aprobado_en | instante/obligatorio | Momento de aprobación administrativa del acceso a la ficha. |
| activado_en | instante/opcional | Momento en que se completó la activación del acceso. Puede ser posterior a la aprobación. El modelo admite dejarlo vacío. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| vinculacion_ref | texto/obligatorio | Evidencia o referencia de cómo se comprobó la correspondencia entre la cuenta y la ficha. |

**Reglas del modelo.** UQ(tenant_id,paciente_id,cuenta_id). Sin representación opera como propio tras verificar correspondencia; con representación se exige paciente y cuenta coincidentes.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R09.a; ADR-007/008.

## 7. ALCANCE_ACCESO: Profesional, agenda y acción habilitados en el portal

Detalla qué contextos puede utilizar un acceso de paciente: el profesional local, una agenda cuando corresponda y el permiso concreto, con su vigencia.

**Ejemplo ficticio.** Lucía obtiene autorización para gestionar consultas con Ana en el ámbito habilitado de Clínica Norte.

**Cómo distinguirlo.** Tener acceso a la ficha no habilita todos los profesionales ni todas las clínicas. La semántica de una agenda vacía como alcance a las agendas locales del profesional sigue pendiente de revisión.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| acceso_id | FK/uuid/obligatorio | Vinculación aprobada entre una cuenta y la ficha del paciente. Destino: ACCESO_PACIENTE, vinculación aprobada de una cuenta con una ficha. Cada registro requiere exactamente un destino válido. |
| profesional_entidad_id | FK/uuid/obligatorio | Vínculo local del profesional con la entidad de este registro. Destino: PROFESIONAL_ENTIDAD, vínculo de un profesional con una clínica. Cada registro requiere exactamente un destino válido. |
| agenda_id | FK/uuid/opcional | Agenda concreta comprendida por el acceso. El valor vacío propone alcance a las agendas locales del profesional indicado, con semántica exacta todavía pendiente. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| permiso_id | FK/uuid/obligatorio | Acción concreta que define o concede esta relación. Destino: PERMISO, acción concreta que puede autorizarse. Cada registro requiere exactamente un destino válido. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| revocado_en | instante/opcional | Fecha y hora en que se dejó sin efecto este factor, token o autorización. Su ausencia no sustituye las demás verificaciones de vigencia. |

**Reglas del modelo.** Profesional obligatorio; agenda nula propone alcance a sus agendas locales. Semántica exacta pendiente; no habilita otras entidades.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R09.a; D14.

## 8. PACIENTE_PROFESIONAL: Relación del paciente con su profesional y su número visible

Une paciente y profesional dentro de la entidad y conserva el número estable que ese profesional utiliza para identificarlo administrativamente.

**Ejemplo ficticio.** Lucía es la paciente número 12 de Ana en Clínica Norte. Otro profesional puede tener otra numeración para su propia relación con Lucía.

**Cómo distinguirlo.** El número pertenece a la combinación entidad y profesional; no es el UUID ni un número universal del paciente. Una baja no permite renumerar ni reutilizar ese número.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| profesional_id | FK/uuid/obligatorio | Identidad profesional global a la que corresponde el registro. Destino: PROFESIONAL_GLOBAL, identidad profesional reconocida en la plataforma. Cada registro requiere exactamente un destino válido. |
| profesional_entidad_id | FK/uuid/obligatorio | Vínculo local del profesional con la entidad de este registro. Destino: PROFESIONAL_ENTIDAD, vínculo de un profesional con una clínica. Cada registro requiere exactamente un destino válido. |
| paciente_id | FK/uuid/obligatorio | Ficha administrativa local del paciente involucrado. Destino: PACIENTE, ficha administrativa de un paciente en una clínica. Cada registro requiere exactamente un destino válido. |
| numero_visible | entero/obligatorio | Número administrativo estable del paciente para ese profesional dentro de esa entidad. Es un entero positivo y no se reutiliza tras una baja. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| alta_en | instante/obligatorio | Fecha y hora de alta de la relación numerada entre paciente y profesional. |

**Reglas del modelo.** UQ(tenant_id,profesional_id,paciente_id) y UQ(tenant_id,profesional_id,numero_visible). Número positivo; profesional coincide con vínculo local; no renumerar ni reutilizar.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R01.a; ADR-001.

## Relaciones de esta lámina, incluidas las referencias externas

- PACIENTE.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de PACIENTE mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- CONTACTO_PACIENTE.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de CONTACTO_PACIENTE mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- CONTACTO_PACIENTE.paciente_id: cada registro debe referir a exactamente un registro de PACIENTE. Como padre, cada registro de PACIENTE puede ser referido por cero, uno o varios registros de CONTACTO_PACIENTE mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- SOLICITUD_ADMISION.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de SOLICITUD_ADMISION mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- SOLICITUD_ADMISION.solicitante_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de SOLICITUD_ADMISION mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- SOLICITUD_ADMISION.profesional_entidad_id: cada registro puede no referir a ninguno o referir a un solo registro de PROFESIONAL_ENTIDAD. Como padre, cada registro de PROFESIONAL_ENTIDAD puede ser referido por cero, uno o varios registros de SOLICITUD_ADMISION mediante ese campo. Destino en carpeta 04-profesionales-e-incorporacion. compuesta tenant_id + id.
- SOLICITUD_ADMISION.paciente_resuelto_id: cada registro puede no referir a ninguno o referir a un solo registro de PACIENTE. Como padre, cada registro de PACIENTE puede ser referido por cero, uno o varios registros de SOLICITUD_ADMISION mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- SOLICITUD_ADMISION.revisor_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de SOLICITUD_ADMISION mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- REPRESENTACION.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de REPRESENTACION mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- REPRESENTACION.paciente_id: cada registro debe referir a exactamente un registro de PACIENTE. Como padre, cada registro de PACIENTE puede ser referido por cero, uno o varios registros de REPRESENTACION mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- REPRESENTACION.representante_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de REPRESENTACION mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- REPRESENTACION.verificador_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de REPRESENTACION mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- REPRESENTACION_PERMISO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de REPRESENTACION_PERMISO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- REPRESENTACION_PERMISO.representacion_id: cada registro debe referir a exactamente un registro de REPRESENTACION. Como padre, cada registro de REPRESENTACION puede ser referido por cero, uno o varios registros de REPRESENTACION_PERMISO mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- REPRESENTACION_PERMISO.permiso_id: cada registro debe referir a exactamente un registro de PERMISO. Como padre, cada registro de PERMISO puede ser referido por cero, uno o varios registros de REPRESENTACION_PERMISO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- ACCESO_PACIENTE.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de ACCESO_PACIENTE mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- ACCESO_PACIENTE.paciente_id: cada registro debe referir a exactamente un registro de PACIENTE. Como padre, cada registro de PACIENTE puede ser referido por cero, uno o varios registros de ACCESO_PACIENTE mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- ACCESO_PACIENTE.cuenta_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de ACCESO_PACIENTE mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- ACCESO_PACIENTE.representacion_id: cada registro puede no referir a ninguno o referir a un solo registro de REPRESENTACION. Como padre, cada registro de REPRESENTACION puede ser referido por cero, uno o varios registros de ACCESO_PACIENTE mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- ACCESO_PACIENTE.solicitud_id: cada registro puede no referir a ninguno o referir a un solo registro de SOLICITUD_ADMISION. Como padre, cada registro de SOLICITUD_ADMISION puede ser referido por cero, uno o varios registros de ACCESO_PACIENTE mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- ACCESO_PACIENTE.aprobador_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de ACCESO_PACIENTE mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- ALCANCE_ACCESO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de ALCANCE_ACCESO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- ALCANCE_ACCESO.acceso_id: cada registro debe referir a exactamente un registro de ACCESO_PACIENTE. Como padre, cada registro de ACCESO_PACIENTE puede ser referido por cero, uno o varios registros de ALCANCE_ACCESO mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- ALCANCE_ACCESO.profesional_entidad_id: cada registro debe referir a exactamente un registro de PROFESIONAL_ENTIDAD. Como padre, cada registro de PROFESIONAL_ENTIDAD puede ser referido por cero, uno o varios registros de ALCANCE_ACCESO mediante ese campo. Destino en carpeta 04-profesionales-e-incorporacion. compuesta tenant_id + id.
- ALCANCE_ACCESO.agenda_id: cada registro puede no referir a ninguno o referir a un solo registro de AGENDA. Como padre, cada registro de AGENDA puede ser referido por cero, uno o varios registros de ALCANCE_ACCESO mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- ALCANCE_ACCESO.permiso_id: cada registro debe referir a exactamente un registro de PERMISO. Como padre, cada registro de PERMISO puede ser referido por cero, uno o varios registros de ALCANCE_ACCESO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- PACIENTE_PROFESIONAL.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de PACIENTE_PROFESIONAL mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- PACIENTE_PROFESIONAL.profesional_id: cada registro debe referir a exactamente un registro de PROFESIONAL_GLOBAL. Como padre, cada registro de PROFESIONAL_GLOBAL puede ser referido por cero, uno o varios registros de PACIENTE_PROFESIONAL mediante ese campo. Destino en carpeta 04-profesionales-e-incorporacion. ID global restringido.
- PACIENTE_PROFESIONAL.profesional_entidad_id: cada registro debe referir a exactamente un registro de PROFESIONAL_ENTIDAD. Como padre, cada registro de PROFESIONAL_ENTIDAD puede ser referido por cero, uno o varios registros de PACIENTE_PROFESIONAL mediante ese campo. Destino en carpeta 04-profesionales-e-incorporacion. compuesta tenant_id + id.
- PACIENTE_PROFESIONAL.paciente_id: cada registro debe referir a exactamente un registro de PACIENTE. Como padre, cada registro de PACIENTE puede ser referido por cero, uno o varios registros de PACIENTE_PROFESIONAL mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
