# 09. Coberturas y convenios

18 de octubre de 2026

Recorra la cobertura desde el catálogo hasta la evaluación de una reserva. Tener obra social, tener un plan y poder usarlo para una práctica son situaciones diferentes.

**Ejemplo de conjunto.** Lucía declara una afiliación. La oferta de Ana tiene convenios versionados y puede exigir autorización. La evaluación conserva qué se eligió y qué regla se aplicó antes de reservar.

**Recorrido.** COBERTURA_MEDICA > PLAN_COBERTURA > AFILIACION_PACIENTE; OFERTA > CONVENIO > VERSION_CONVENIO; AUTORIZACION_COBERTURA cuando corresponda > EVALUACION_ELEGIBILIDAD.

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

## 1. COBERTURA_MEDICA: Obra social o prepaga del catálogo local

Identifica una cobertura médica que la entidad configura administrativamente para sus pacientes y ofertas.

**Ejemplo ficticio.** Clínica Norte registra una cobertura ficticia Salud Ejemplo dentro de su catálogo.

**Cómo distinguirlo.** La cobertura del paciente es distinta de la organización que contrata el sistema. El catálogo local no comparte afiliaciones con otras entidades.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| nombre | texto/obligatorio | Nombre legible del registro para identificarlo en su contexto; no reemplaza su identificador interno. |
| codigo_local | texto/opcional | Código de la práctica o cobertura dentro de la entidad, sujeto a las restricciones locales del modelo. El modelo admite dejarlo vacío. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** Se propone catálogo local para evitar compartir configuración; un catálogo de referencia global futuro no compartiría afiliaciones.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R01 R07; docs/18.

## 2. PLAN_COBERTURA: Plan de una obra social o prepaga

Es un producto o plan perteneciente a una cobertura médica local. Permite distinguir condiciones dentro de la misma cobertura.

**Ejemplo ficticio.** Salud Ejemplo tiene un plan Básico y un plan Ampliado, como datos ficticios.

**Cómo distinguirlo.** Un plan siempre pertenece a su cobertura. Su presencia en el catálogo no significa que toda oferta de la entidad lo acepte.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| cobertura_id | FK/uuid/obligatorio | Obra social o prepaga del catálogo local. Destino: COBERTURA_MEDICA, obra social o prepaga del catálogo local. Cada registro requiere exactamente un destino válido. |
| nombre | texto/obligatorio | Nombre legible del registro para identificarlo en su contexto; no reemplaza su identificador interno. |
| codigo | texto/opcional | Código de catálogo que identifica esta definición dentro del alcance indicado por sus restricciones. El modelo admite dejarlo vacío. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** Se aplican las convenciones generales de claves, ámbito y autorización.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R07; D06.

## 3. AFILIACION_PACIENTE: Vínculo del paciente con una cobertura

Asocia al paciente con cobertura, posible plan y número de afiliado. Distingue lo declarado de su verificación administrativa y registra vigencia.

**Ejemplo ficticio.** Lucía declara afiliación a Salud Ejemplo, plan Básico, y el personal registra el resultado de la verificación.

**Cómo distinguirlo.** Un paciente puede tener varias afiliaciones. Un número familiar no es necesariamente único por paciente y ser titular de cobertura no prueba representación del paciente.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| paciente_id | FK/uuid/obligatorio | Ficha administrativa local del paciente involucrado. Destino: PACIENTE, ficha administrativa de un paciente en una clínica. Cada registro requiere exactamente un destino válido. |
| cobertura_id | FK/uuid/obligatorio | Obra social o prepaga del catálogo local. Destino: COBERTURA_MEDICA, obra social o prepaga del catálogo local. Cada registro requiere exactamente un destino válido. |
| plan_id | FK/uuid/opcional | Plan de la cobertura indicada; debe pertenecer a esa cobertura. Destino: PLAN_COBERTURA, plan de una obra social o prepaga. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| numero_afiliado | texto/opcional | Número declarado de afiliación a la cobertura. Puede compartirse dentro de un grupo familiar y no identifica por sí solo al paciente. El modelo admite dejarlo vacío. |
| titular_declarado | texto/opcional | Titular informado para la afiliación; no demuestra representación del paciente ante el sistema. El modelo admite dejarlo vacío. |
| parentesco | texto/opcional | Relación declarada respecto del titular de la cobertura; no otorga facultades sobre el portal. El modelo admite dejarlo vacío. |
| desde | fecha/opcional | Inicio de la vigencia de esta relación, configuración o autorización. El modelo admite dejarlo vacío. |
| hasta | fecha/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| estado_verificacion | enum/obligatorio | Situación de la comprobación administrativa de la afiliación, separada de la mera declaración del dato. |
| verificacion_ref | texto/opcional | Referencia a la evidencia de la verificación administrativa o profesional, según el registro; no sustituye los permisos de acceso. El modelo admite dejarlo vacío. |

**Reglas del modelo.** Plan debe pertenecer a cobertura. No hacer único el número familiar de afiliado ni inferir representación. Pueden existir varias afiliaciones por paciente.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R07; docs/18.

## 4. CONVENIO: Acuerdo de aceptación de cobertura para una oferta

Asocia una oferta concreta con una cobertura y, cuando corresponde, un plan. Al referir a una oferta identifica también la agenda, práctica y profesional involucrados.

**Ejemplo ficticio.** La oferta de consultas de Ana acepta cierto plan de Salud Ejemplo según un convenio local.

**Cómo distinguirlo.** La cobertura registrada en la ficha no alcanza para afirmar que un turno está cubierto. Un plan vacío propone abarcar los planes de esa cobertura, pero esa semántica y su precedencia requieren revisión.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| oferta_id | FK/uuid/obligatorio | Habilitación de una práctica en una agenda concreta. Destino: OFERTA, práctica habilitada en una agenda concreta. Cada registro requiere exactamente un destino válido. |
| cobertura_id | FK/uuid/obligatorio | Obra social o prepaga del catálogo local. Destino: COBERTURA_MEDICA, obra social o prepaga del catálogo local. Cada registro requiere exactamente un destino válido. |
| plan_id | FK/uuid/opcional | Plan al que se aplica el convenio. Vacío propone todos los planes de la cobertura indicada, sujeto a revisión y precedencia explícita. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** Granularidad explícita por oferta identifica práctica, agenda y profesional; plan nulo propone todos los planes de esa cobertura, sujeto a revisión y precedencia explícita.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R07; D06.

## 5. VERSION_CONVENIO: Condiciones históricas de un convenio

Conserva una regla inmutable de cobertura con período, exigencia de autorización y condiciones. Permite reconstruir qué regla se aplicó a una reserva.

**Ejemplo ficticio.** Un convenio empieza a requerir autorización. Se crea una versión nueva y los turnos históricos conservan la regla que utilizaron.

**Cómo distinguirlo.** La resolución de reglas en conflicto debe ser explícita. Si una cobertura resulta incompatible, la aplicación no debe convertir la atención a particular sin elección expresa.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| convenio_id | FK/uuid/obligatorio | Acuerdo local de cobertura cuya regla se versiona. Destino: CONVENIO, acuerdo de aceptación de cobertura para una oferta. Cada registro requiere exactamente un destino válido. |
| numero_version | entero/obligatorio | Secuencia de versiones dentro del objeto padre. Permite distinguir definiciones históricas sin alterar sus registros anteriores. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| requiere_autorizacion | bool/obligatorio | Indica si la regla de convenio exige una autorización específica para la práctica. |
| resultado_regla | enum/obligatorio | Resultado previsto por la regla de convenio, sujeto a interpretación y precedencia explícitas. |
| condiciones | json/obligatorio | Condiciones estructuradas de la versión del convenio. Deben tener un esquema revisado y conservar la regla histórica aplicada. |

**Reglas del modelo.** UQ(tenant_id,convenio_id,numero_version). Conflictos de reglas se resuelven explícitamente; no elegir particular automáticamente.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R07 R12.

## 6. AUTORIZACION_COBERTURA: Constancia administrativa para una práctica

Registra una autorización específica vinculada a una afiliación y a una práctica, con referencia, situación, vigencia y posible verificador.

**Ejemplo ficticio.** Para cierta práctica, el personal registra la referencia de autorización presentada para la afiliación de Lucía.

**Cómo distinguirlo.** Esta autorización corresponde a la cobertura de una prestación; no es un permiso para usar el software. Tampoco equivale a haber verificado toda la afiliación ni implica una API externa aprobada.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| afiliacion_id | FK/uuid/obligatorio | Afiliación concreta del paciente utilizada para esta práctica o evaluación. Destino: AFILIACION_PACIENTE, vínculo del paciente con una cobertura. Cada registro requiere exactamente un destino válido. |
| practica_id | FK/uuid/obligatorio | Identidad estable de la práctica a la que corresponde este registro. Destino: PRACTICA, tipo estable de servicio de atención. Cada registro requiere exactamente un destino válido. |
| referencia | texto/obligatorio | Número o referencia administrativa de la autorización de cobertura presentada. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| desde | instante/opcional | Inicio de la vigencia de esta relación, configuración o autorización. El modelo admite dejarlo vacío. |
| hasta | instante/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| verificador_id | FK/uuid/opcional | Cuenta de quien comprueba la evidencia administrativa. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |

**Reglas del modelo.** No equivale a afiliación verificada ni permiso de sistema. Sin API externa aprobada.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R07; docs/18; D06.

## 7. EVALUACION_ELEGIBILIDAD: Comprobación de si se puede reservar bajo ciertas condiciones

Guarda el resultado de aplicar oferta, modalidad elegida, afiliación, convenio y posible autorización antes de adquirir o completar una reserva.

**Ejemplo ficticio.** Lucía elige atenderse con su cobertura. El sistema evalúa las condiciones y registra si resulta elegible, incompatible o requiere revisión.

**Cómo distinguirlo.** La evaluación deja evidencia de la decisión aplicada. La atención particular necesita elección expresa y oferta habilitada; no puede inferirse como solución automática a una incompatibilidad.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| paciente_id | FK/uuid/obligatorio | Ficha administrativa local del paciente involucrado. Destino: PACIENTE, ficha administrativa de un paciente en una clínica. Cada registro requiere exactamente un destino válido. |
| version_oferta_id | FK/uuid/obligatorio | Condiciones históricas concretas de la oferta utilizadas. Destino: VERSION_OFERTA, condiciones de atención vigentes para una oferta. Cada registro requiere exactamente un destino válido. |
| modalidad_elegida | enum/obligatorio | Forma de cobertura elegida expresamente para la evaluación, como particular o mediante una afiliación aplicable. |
| afiliacion_id | FK/uuid/opcional | Afiliación concreta del paciente utilizada para esta práctica o evaluación. Destino: AFILIACION_PACIENTE, vínculo del paciente con una cobertura. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| version_convenio_id | FK/uuid/opcional | Regla histórica del convenio aplicada en la evaluación. Destino: VERSION_CONVENIO, condiciones históricas de un convenio. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| autorizacion_id | FK/uuid/opcional | Constancia específica de autorización de cobertura utilizada. Destino: AUTORIZACION_COBERTURA, constancia administrativa para una práctica. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| resultado | enum/obligatorio | Resultado de esta evaluación, operación o ensayo. Su catálogo depende de la entidad y no debe inferirse solo de que exista un registro. |
| evaluada_en | instante/obligatorio | Fecha y hora en que se realizó la evaluación de elegibilidad. |
| evidencia | json/obligatorio | Información mínima que permite reconstruir la evaluación y las reglas aplicadas, con contenido autorizado. |

**Reglas del modelo.** Elegible, incompatible o revisión. Particular exige elección expresa y oferta habilitada. Cobertura exige afiliación del paciente y compatibilidad de plan/práctica/oferta.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R02 R07 R12.

## Relaciones de esta lámina, incluidas las referencias externas

- COBERTURA_MEDICA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de COBERTURA_MEDICA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- PLAN_COBERTURA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de PLAN_COBERTURA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- PLAN_COBERTURA.cobertura_id: cada registro debe referir a exactamente un registro de COBERTURA_MEDICA. Como padre, cada registro de COBERTURA_MEDICA puede ser referido por cero, uno o varios registros de PLAN_COBERTURA mediante ese campo. Destino en carpeta 09-coberturas-y-convenios. compuesta tenant_id + id.
- AFILIACION_PACIENTE.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de AFILIACION_PACIENTE mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- AFILIACION_PACIENTE.paciente_id: cada registro debe referir a exactamente un registro de PACIENTE. Como padre, cada registro de PACIENTE puede ser referido por cero, uno o varios registros de AFILIACION_PACIENTE mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- AFILIACION_PACIENTE.cobertura_id: cada registro debe referir a exactamente un registro de COBERTURA_MEDICA. Como padre, cada registro de COBERTURA_MEDICA puede ser referido por cero, uno o varios registros de AFILIACION_PACIENTE mediante ese campo. Destino en carpeta 09-coberturas-y-convenios. compuesta tenant_id + id.
- AFILIACION_PACIENTE.plan_id: cada registro puede no referir a ninguno o referir a un solo registro de PLAN_COBERTURA. Como padre, cada registro de PLAN_COBERTURA puede ser referido por cero, uno o varios registros de AFILIACION_PACIENTE mediante ese campo. Destino en carpeta 09-coberturas-y-convenios. compuesta tenant_id + id.
- CONVENIO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de CONVENIO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- CONVENIO.oferta_id: cada registro debe referir a exactamente un registro de OFERTA. Como padre, cada registro de OFERTA puede ser referido por cero, uno o varios registros de CONVENIO mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- CONVENIO.cobertura_id: cada registro debe referir a exactamente un registro de COBERTURA_MEDICA. Como padre, cada registro de COBERTURA_MEDICA puede ser referido por cero, uno o varios registros de CONVENIO mediante ese campo. Destino en carpeta 09-coberturas-y-convenios. compuesta tenant_id + id.
- CONVENIO.plan_id: cada registro puede no referir a ninguno o referir a un solo registro de PLAN_COBERTURA. Como padre, cada registro de PLAN_COBERTURA puede ser referido por cero, uno o varios registros de CONVENIO mediante ese campo. Destino en carpeta 09-coberturas-y-convenios. compuesta tenant_id + id.
- VERSION_CONVENIO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de VERSION_CONVENIO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- VERSION_CONVENIO.convenio_id: cada registro debe referir a exactamente un registro de CONVENIO. Como padre, cada registro de CONVENIO puede ser referido por cero, uno o varios registros de VERSION_CONVENIO mediante ese campo. Destino en carpeta 09-coberturas-y-convenios. compuesta tenant_id + id.
- AUTORIZACION_COBERTURA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de AUTORIZACION_COBERTURA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- AUTORIZACION_COBERTURA.afiliacion_id: cada registro debe referir a exactamente un registro de AFILIACION_PACIENTE. Como padre, cada registro de AFILIACION_PACIENTE puede ser referido por cero, uno o varios registros de AUTORIZACION_COBERTURA mediante ese campo. Destino en carpeta 09-coberturas-y-convenios. compuesta tenant_id + id.
- AUTORIZACION_COBERTURA.practica_id: cada registro debe referir a exactamente un registro de PRACTICA. Como padre, cada registro de PRACTICA puede ser referido por cero, uno o varios registros de AUTORIZACION_COBERTURA mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- AUTORIZACION_COBERTURA.verificador_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de AUTORIZACION_COBERTURA mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- EVALUACION_ELEGIBILIDAD.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de EVALUACION_ELEGIBILIDAD mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- EVALUACION_ELEGIBILIDAD.paciente_id: cada registro debe referir a exactamente un registro de PACIENTE. Como padre, cada registro de PACIENTE puede ser referido por cero, uno o varios registros de EVALUACION_ELEGIBILIDAD mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- EVALUACION_ELEGIBILIDAD.version_oferta_id: cada registro debe referir a exactamente un registro de VERSION_OFERTA. Como padre, cada registro de VERSION_OFERTA puede ser referido por cero, uno o varios registros de EVALUACION_ELEGIBILIDAD mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- EVALUACION_ELEGIBILIDAD.afiliacion_id: cada registro puede no referir a ninguno o referir a un solo registro de AFILIACION_PACIENTE. Como padre, cada registro de AFILIACION_PACIENTE puede ser referido por cero, uno o varios registros de EVALUACION_ELEGIBILIDAD mediante ese campo. Destino en carpeta 09-coberturas-y-convenios. compuesta tenant_id + id.
- EVALUACION_ELEGIBILIDAD.version_convenio_id: cada registro puede no referir a ninguno o referir a un solo registro de VERSION_CONVENIO. Como padre, cada registro de VERSION_CONVENIO puede ser referido por cero, uno o varios registros de EVALUACION_ELEGIBILIDAD mediante ese campo. Destino en carpeta 09-coberturas-y-convenios. compuesta tenant_id + id.
- EVALUACION_ELEGIBILIDAD.autorizacion_id: cada registro puede no referir a ninguno o referir a un solo registro de AUTORIZACION_COBERTURA. Como padre, cada registro de AUTORIZACION_COBERTURA puede ser referido por cero, uno o varios registros de EVALUACION_ELEGIBILIDAD mediante ese campo. Destino en carpeta 09-coberturas-y-convenios. compuesta tenant_id + id.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
