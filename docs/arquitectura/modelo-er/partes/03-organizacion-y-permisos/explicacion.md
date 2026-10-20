# 03. Organización y permisos

18 de octubre de 2026

Una vez reconocida la persona, ubíquela en una organización y determine qué puede hacer allí. Distinga la clínica, sus sedes, la pertenencia del usuario y las acciones autorizadas.

**Ejemplo de conjunto.** Pedro tiene una cuenta global, una membresía en Clínica Norte y roles o permisos locales expresamente concedidos. La sede ubica la atención y las delegaciones de agendas se estudian más adelante.

**Recorrido.** ENTIDAD > SEDE; CUENTA > MEMBRESIA > MEMBRESIA_ROL o MEMBRESIA_PERMISO; ROL > ROL_PERMISO > PERMISO.

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

## 1. ENTIDAD: Clínica o actividad independiente que usa el sistema

Representa el ámbito organizativo que separa los datos de un cliente de los de otro. Una clínica y la actividad independiente de un profesional pueden ser entidades diferentes.

**Ejemplo ficticio.** Clínica Norte es una ENTIDAD. El consultorio independiente de Ana puede ser otra, con sus propias fichas y configuración.

**Cómo distinguirlo.** En un diagrama E-R, «entidad» también significa cualquier tipo de registro. La tabla ENTIDAD tiene el significado específico de organización o actividad cliente; su id aparece como tenant_id en los datos locales.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| tipo | enum/obligatorio | Clase de organización cliente, incluida la actividad profesional independiente en el alcance documentado. |
| nombre | texto/obligatorio | Nombre legible del registro para identificarlo en su contexto; no reemplaza su identificador interno. |
| zona_horaria | texto/obligatorio | Zona utilizada para interpretar y mostrar horarios. Los instantes y las horas locales recurrentes requieren tratamientos diferentes. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| creada_en | instante/obligatorio | Fecha y hora de creación de este registro. |

**Reglas del modelo.** Cada fila es una raíz de tenant. No cambiar una clínica completa por la entidad de un profesional.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R01 R01.a; ADR-001.

## 2. SEDE: Lugar de atención de una organización

Identifica un lugar de atención perteneciente a una entidad. Permite ubicar agendas y recursos dentro de una organización con más de una dirección.

**Ejemplo ficticio.** Clínica Norte tiene una sede Centro y otra sede Barrio Sur. Cada agenda se vincula con la sede correspondiente.

**Cómo distinguirlo.** Una sede no crea otra organización aislada. Las sedes pertenecen a la misma entidad, aunque sus lugares y horarios puedan diferir.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| nombre | texto/obligatorio | Nombre legible del registro para identificarlo en su contexto; no reemplaza su identificador interno. |
| direccion | texto/opcional | Dirección del lugar de atención registrado como sede. El modelo admite dejarlo vacío. |
| zona_horaria | texto/obligatorio | Zona utilizada para interpretar y mostrar horarios. Los instantes y las horas locales recurrentes requieren tratamientos diferentes. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** Se aplican las convenciones generales de claves, ámbito y autorización.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R01 R06.

## 3. MEMBRESIA: Pertenencia de una persona al equipo de una clínica

Une una cuenta personal con una entidad durante una vigencia. Registra que esa persona pertenece al equipo de esa organización.

**Ejemplo ficticio.** Pedro tiene una CUENTA y una MEMBRESIA en Clínica Norte como integrante de su equipo.

**Cómo distinguirlo.** La membresía acredita pertenencia. Los roles, permisos y delegaciones de agenda se asignan con relaciones adicionales. Finalizar esta membresía no borra la cuenta global de Pedro.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| cuenta_id | FK/uuid/obligatorio | Cuenta personal asociada a este registro. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** UQ(tenant_id,cuenta_id). Reactivar preserva la identidad local; historial en auditoría.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R04 R10; docs/20.

## 4. ROL: Conjunto identificado de funciones

Es una definición de catálogo para agrupar permisos. Sirve como una plantilla de facultades que luego se puede asignar expresamente a una membresía.

**Ejemplo ficticio.** Puede definirse un rol de secretaría con un conjunto revisado de operaciones permitidas, como ejemplo de organización de permisos.

**Cómo distinguirlo.** Crear el rol no se lo concede a nadie. Su contenido y asignación se registran en ROL_PERMISO y MEMBRESIA_ROL. Los nombres y permisos definitivos requieren aprobación.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| codigo | texto/obligatorio | Código de catálogo que identifica esta definición dentro del alcance indicado por sus restricciones. |
| nombre | texto/obligatorio | Nombre legible del registro para identificarlo en su contexto; no reemplaza su identificador interno. |
| ambito | enum/obligatorio | Nivel o contexto para el cual se define el rol. No concede una asignación a una persona por sí mismo. |

**Reglas del modelo.** UQ(codigo). Catálogo técnico propuesto; no asigna permisos pendientes.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R04 R10; docs/22.

## 5. PERMISO: Acción concreta que puede autorizarse

Describe una operación autorizable y el tipo de ámbito donde se ejerce. Es una unidad más precisa que un cargo o un nombre de rol.

**Ejemplo ficticio.** «Consultar una agenda autorizada» puede ser una acción que el catálogo de permisos llegue a definir.

**Cómo distinguirlo.** El permiso define la acción. Otra tabla registra a quién se le concede y sobre qué contexto. Los códigos de la matriz MP permiten rastrear decisiones, pero no son automáticamente permisos implementados.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| codigo | texto/obligatorio | Código de catálogo que identifica esta definición dentro del alcance indicado por sus restricciones. |
| accion | texto/obligatorio | Operación autorizable o acción efectivamente auditada, según la tabla. Debe interpretarse junto con su ámbito y resultado. |
| tipo_ambito | enum/obligatorio | Clase de contexto en que se ejerce el permiso, para distinguir dónde puede aplicarse. |

**Reglas del modelo.** UQ(codigo). Códigos MP son trazabilidad y no permisos definitivos.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R04 R12; docs/22; D03.

## 6. ROL_PERMISO: Acción incluida en un rol

Es una tabla de unión: cada registro agrega un permiso a un rol. Así un rol puede reunir varias acciones y la misma acción puede integrar varios roles.

**Ejemplo ficticio.** Un registro asocia el rol de secretaría con una operación permitida de consulta de agenda.

**Cómo distinguirlo.** Resuelve una relación de muchos a muchos. La combinación rol y permiso es única, de modo que la misma acción no se incorpora dos veces al mismo rol.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| rol_id | FK/uuid/obligatorio | Rol definido en el catálogo que se incluye o concede. Destino: ROL, conjunto identificado de funciones. Cada registro requiere exactamente un destino válido. |
| permiso_id | FK/uuid/obligatorio | Acción concreta que define o concede esta relación. Destino: PERMISO, acción concreta que puede autorizarse. Cada registro requiere exactamente un destino válido. |

**Reglas del modelo.** UQ(rol_id,permiso_id). Contenido a aprobar; sin concesiones automáticas por cargo.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R04; docs/22.

## 7. MEMBRESIA_ROL: Rol concedido a un integrante del equipo

Registra la asignación de un rol a una membresía local, incluyendo quién lo otorga y su período de validez.

**Ejemplo ficticio.** Una persona autorizada asigna a Pedro un rol dentro de Clínica Norte desde una fecha determinada.

**Cómo distinguirlo.** El rol queda asociado a su pertenencia a esa clínica. Tener un rol en una organización no lo extiende a otra donde Pedro también trabaje.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| membresia_id | FK/uuid/obligatorio | Pertenencia al equipo de la entidad sobre la que se apoya esta relación. Destino: MEMBRESIA, pertenencia de una persona al equipo de una clínica. Cada registro requiere exactamente un destino válido. |
| rol_id | FK/uuid/obligatorio | Rol definido en el catálogo que se incluye o concede. Destino: ROL, conjunto identificado de funciones. Cada registro requiere exactamente un destino válido. |
| otorgante_id | FK/uuid/obligatorio | Cuenta de quien concede la autorización. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| revocada_en | instante/opcional | Fecha y hora en que se dejó sin efecto esta vinculación, autorización o credencial. Vacío solo indica que no consta revocación; pueden existir otras condiciones de validez. |

**Reglas del modelo.** Se aplican las convenciones generales de claves, ámbito y autorización.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R04 R10.

## 8. MEMBRESIA_PERMISO: Permiso local concedido expresamente

Asocia una operación concreta con una membresía y registra otorgante y vigencia. Permite representar facultades locales expresas adicionales.

**Ejemplo ficticio.** Pedro recibe una facultad local específica mediante una concesión autorizada y trazable.

**Cómo distinguirlo.** Operar una agenda exige su delegación correspondiente. Esta concesión tampoco incorpora por sí sola a Pedro a un chat ni aprueba pacientes.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| membresia_id | FK/uuid/obligatorio | Pertenencia al equipo de la entidad sobre la que se apoya esta relación. Destino: MEMBRESIA, pertenencia de una persona al equipo de una clínica. Cada registro requiere exactamente un destino válido. |
| permiso_id | FK/uuid/obligatorio | Acción concreta que define o concede esta relación. Destino: PERMISO, acción concreta que puede autorizarse. Cada registro requiere exactamente un destino válido. |
| otorgante_id | FK/uuid/obligatorio | Cuenta de quien concede la autorización. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| revocada_en | instante/opcional | Fecha y hora en que se dejó sin efecto esta vinculación, autorización o credencial. Vacío solo indica que no consta revocación; pueden existir otras condiciones de validez. |

**Reglas del modelo.** No sustituye delegación de agenda ni participación de chat.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R04 R06; D03.

## Relaciones de esta lámina, incluidas las referencias externas

- SEDE.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de SEDE mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- MEMBRESIA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de MEMBRESIA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- MEMBRESIA.cuenta_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de MEMBRESIA mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- ROL_PERMISO.rol_id: cada registro debe referir a exactamente un registro de ROL. Como padre, cada registro de ROL puede ser referido por cero, uno o varios registros de ROL_PERMISO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- ROL_PERMISO.permiso_id: cada registro debe referir a exactamente un registro de PERMISO. Como padre, cada registro de PERMISO puede ser referido por cero, uno o varios registros de ROL_PERMISO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- MEMBRESIA_ROL.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de MEMBRESIA_ROL mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- MEMBRESIA_ROL.membresia_id: cada registro debe referir a exactamente un registro de MEMBRESIA. Como padre, cada registro de MEMBRESIA puede ser referido por cero, uno o varios registros de MEMBRESIA_ROL mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. compuesta tenant_id + id.
- MEMBRESIA_ROL.rol_id: cada registro debe referir a exactamente un registro de ROL. Como padre, cada registro de ROL puede ser referido por cero, uno o varios registros de MEMBRESIA_ROL mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- MEMBRESIA_ROL.otorgante_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de MEMBRESIA_ROL mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- MEMBRESIA_PERMISO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de MEMBRESIA_PERMISO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- MEMBRESIA_PERMISO.membresia_id: cada registro debe referir a exactamente un registro de MEMBRESIA. Como padre, cada registro de MEMBRESIA puede ser referido por cero, uno o varios registros de MEMBRESIA_PERMISO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. compuesta tenant_id + id.
- MEMBRESIA_PERMISO.permiso_id: cada registro debe referir a exactamente un registro de PERMISO. Como padre, cada registro de PERMISO puede ser referido por cero, uno o varios registros de MEMBRESIA_PERMISO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- MEMBRESIA_PERMISO.otorgante_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de MEMBRESIA_PERMISO mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
