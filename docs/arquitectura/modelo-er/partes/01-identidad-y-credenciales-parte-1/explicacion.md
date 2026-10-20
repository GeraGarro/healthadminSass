# 01. Identidad y credenciales, parte 1

18 de octubre de 2026

Primero identifique al usuario y luego los mecanismos de acceso. Separe quién es la persona, cómo demuestra su identidad, qué acceso mantiene iniciado y qué facultades globales recibe.

**Ejemplo de conjunto.** CUENTA identifica a Ana. CREDENCIAL_LOCAL o IDENTIDAD_EXTERNA permiten autenticarla. FACTOR_MFA aporta la comprobación adicional y SESION recuerda el acceso. Si necesita recuperar la contraseña, TOKEN_IDENTIDAD delimita la acción y CANAL_IDENTIDAD configura el envío; la parte 2 explica la ejecución.

**Recorrido.** CUENTA > método de acceso > segundo factor cuando corresponda > SESION > comprobación de permisos en cada operación.

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

## 1. CUENTA: Usuario personal del sistema

Es el registro estable que identifica a una persona que puede acceder a la plataforma. Reúne nombre, contacto de acceso y situación de su cuenta. Una misma cuenta puede utilizarse para trabajar en distintas clínicas con permisos diferentes.

**Ejemplo ficticio.** Ana Pérez crea una cuenta personal. Con ella puede trabajar en Clínica Norte y Clínica Sur, siempre que tenga los vínculos y permisos correspondientes.

**Cómo distinguirlo.** La cuenta identifica a Ana; sus roles, su matrícula y los pacientes que puede consultar se registran por separado. La baja de una clínica conserva la cuenta global. Puede haber pacientes con ficha que nunca creen una cuenta.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| nombre | texto/obligatorio | Nombre que figura en la cuenta personal; no sustituye el nombre de referencia profesional ni los datos de una ficha local. |
| email_acceso | texto/opcional | Correo asociado al acceso a la cuenta. Su normalización y unicidad están pendientes de revisión. El modelo admite dejarlo vacío. |
| email_verificado_en | instante/opcional | Fecha y hora en que se comprobó el control del correo de acceso. Vacío indica que no consta esa verificación en el registro. El modelo admite dejarlo vacío. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| creada_en | instante/obligatorio | Fecha y hora de creación de este registro. |

**Reglas del modelo.** No se fusiona por correo o documento. La baja institucional conserva la cuenta. Normalización y unicidad de contacto por revisar.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R09.a R10.a; ADR-012; docs/20.

## 2. IDENTIDAD_EXTERNA: Vinculación con un proveedor de acceso

Asocia una cuenta propia con el identificador estable que reconoce un proveedor externo admitido. Sirve para reconocer a la misma persona cuando ingresa mediante ese proveedor, después de una vinculación verificada.

**Ejemplo ficticio.** Ana elige «Ingresar con Google». La plataforma reconoce la combinación del proveedor y el identificador de Ana, y encuentra su CUENTA.

**Cómo distinguirlo.** «Emisor» es quien emite la identidad y «sujeto» es el identificador del usuario en ese proveedor. La contraseña del proveedor queda a cargo del proveedor. Coincidir en correo no autoriza a unir cuentas.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| cuenta_id | FK/uuid/obligatorio | Cuenta personal asociada a este registro. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| emisor | texto/obligatorio | Identificador del proveedor que emite la identidad externa; permite distinguir identidades de proveedores diferentes. |
| sujeto | texto/obligatorio | Identificador estable del usuario dentro del proveedor externo. Junto con emisor distingue esa identidad; no se sustituye por el correo. |
| vinculada_en | instante/obligatorio | Fecha y hora en que se vinculó la identidad externa con la cuenta del sistema. |
| revocada_en | instante/opcional | Fecha y hora en que se dejó sin efecto esta vinculación, autorización o credencial. Vacío solo indica que no consta revocación; pueden existir otras condiciones de validez. |

**Reglas del modelo.** UQ(emisor,sujeto). El correo del proveedor no reemplaza esta clave.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R09.a; docs/12.

## 3. CREDENCIAL_LOCAL: Contraseña propia de esta aplicación

Guarda la información protegida que permite comprobar una contraseña creada en este sistema. «Local» indica que la administra la aplicación, en lugar de delegar la comprobación en un proveedor externo.

**Ejemplo ficticio.** Ana escribe su correo y contraseña. El sistema busca su cuenta y contrasta lo ingresado con la credencial local vigente.

**Cómo distinguirlo.** El hash es una representación para comprobar la contraseña sin guardarla como texto legible. Hay una sola credencial local vigente por cuenta; la relación 0..N no implica varias contraseñas válidas simultáneamente. Una cuenta exclusivamente externa puede no tener ninguna.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| cuenta_id | FK/uuid/obligatorio | Cuenta personal asociada a este registro. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| hash_contrasena | secreto/obligatorio | Representación protegida que permite comprobar la contraseña sin guardarla como texto legible. |
| algoritmo_version | texto/obligatorio | Identificación del método y versión utilizados para proteger la contraseña. Los parámetros concretos siguen pendientes. |
| actualizada_en | instante/obligatorio | Fecha y hora de la última actualización de la credencial local. |
| revocada_en | instante/opcional | Fecha y hora en que se dejó sin efecto esta vinculación, autorización o credencial. Vacío solo indica que no consta revocación; pueden existir otras condiciones de validez. |

**Reglas del modelo.** Una credencial local vigente por cuenta. No crear contraseña a cuentas solo externas mediante recuperación.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R10.a; S01; docs/20.

## 4. SESION: Acceso que queda iniciado

Representa un acceso autenticado que la aplicación recuerda durante un período. Permite que la persona pase de una pantalla a otra sin identificarse desde cero en cada operación. Su mecanismo concreto está pendiente de definición.

**Ejemplo ficticio.** Ana ingresa en la computadora del consultorio y después en su teléfono. Pueden existir dos sesiones asociadas a su cuenta.

**Cómo distinguirlo.** Una sesión acredita un acceso, pero cada operación debe revalidar sus permisos actuales. Cerrar o revocar una sesión es distinto de terminar la membresía de una clínica.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| cuenta_id | FK/uuid/obligatorio | Cuenta personal asociada a este registro. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| huella_sesion | secreto/obligatorio | Huella o referencia protegida que permite comprobar la sesión. El mecanismo exacto de sesión debe definirse. |
| iniciada_en | instante/obligatorio | Fecha y hora en que comenzó la sesión. |
| vence_en | instante/obligatorio | Momento límite de validez de la sesión, sujeto también a su posible revocación y al estado y permisos actuales de la cuenta. |
| revocada_en | instante/opcional | Fecha y hora en que se dejó sin efecto esta vinculación, autorización o credencial. Vacío solo indica que no consta revocación; pueden existir otras condiciones de validez. |
| mfa_verificada_en | instante/opcional | Momento en que se completó la comprobación adicional de identidad para esta sesión concreta. El modelo admite dejarlo vacío. |

**Reglas del modelo.** La sesión no almacena permisos permanentes ni sustituye su revalidación. Mecanismo por definir.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** S01 S04; D16.

## 5. FACTOR_MFA: Método adicional para comprobar identidad

Registra un segundo factor de autenticación y su ciclo de verificación o revocación. MFA significa autenticación multifactor. El tipo de factor y su custodia deben definirse en el proyecto.

**Ejemplo ficticio.** Como ejemplo de un método posible, Ana configura una aplicación autenticadora y luego utiliza sus códigos al ingresar.

**Cómo distinguirlo.** Verificar el factor registrado comprueba su configuración. SESION.mfa_verificada_en registra cuándo se comprobó ese factor en un acceso particular. Recuperar la contraseña no elimina el segundo factor.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| cuenta_id | FK/uuid/obligatorio | Cuenta personal asociada a este registro. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| tipo | enum/obligatorio | Clase del método adicional de autenticación. Una aplicación autenticadora es solo un ejemplo posible; la elección concreta sigue pendiente. |
| referencia_secreta | secreto/obligatorio | Dato protegido o referencia necesaria para comprobar el factor adicional; su custodia y tipo se definirán. |
| verificado_en | instante/opcional | Momento en que se comprobó la configuración del factor. Su uso en cada inicio de sesión se registra aparte en SESION.mfa_verificada_en. El modelo admite dejarlo vacío. |
| revocado_en | instante/opcional | Fecha y hora en que se dejó sin efecto este factor, token o autorización. Su ausencia no sustituye las demás verificaciones de vigencia. |

**Reglas del modelo.** Recuperación de contraseña no retira MFA. Tipo y custodia por definir.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** S06; docs/20; D16.

## 6. TOKEN_IDENTIDAD: Autorización temporal para una acción de acceso

Representa un valor secreto de uso limitado para recuperar una contraseña, verificar un contacto o intervenir en una invitación de identidad. Conserva propósito, destinatario, vencimiento y consumo.

**Ejemplo ficticio.** Ana pulsa «Olvidé mi contraseña» y recibe un enlace. El sistema comprueba su token cuando confirma la nueva contraseña.

**Cómo distinguirlo.** El token permite una acción concreta; su identificador interno no reemplaza el valor secreto. Puede existir antes de asociarse a una cuenta. Abrir el enlace no lo consume por sí solo y este token no confirma turnos.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| cuenta_id | FK/uuid/opcional | Cuenta relacionada con la acción, cuando ya puede asociarse. Es opcional para contemplar destinatarios aún sin una cuenta vinculada, como en ciertos procesos de invitación. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| destinatario | texto/obligatorio | Destino al que se dirige el proceso de identidad o invitación, por ejemplo un correo. Debe comprobarse su correspondencia al completar la acción. |
| huella | secreto/obligatorio | Representación protegida del valor secreto del token. El token completo en claro no se guarda en esta tabla. |
| proposito | enum/obligatorio | Acción o finalidad específica para la cual se admite este token o destinatario. Evita reutilizarlo para otra operación. |
| vence_en | instante/obligatorio | Fecha y hora límite de validez. Debe aplicarse la transición o comprobación correspondiente; la fecha por sí sola no ejecuta tareas. |
| usado_en | instante/opcional | Fecha y hora en que se consumió el token. Permite rechazar una reutilización del mismo valor. El modelo admite dejarlo vacío. |
| revocado_en | instante/opcional | Fecha y hora en que se dejó sin efecto este factor, token o autorización. Su ausencia no sustituye las demás verificaciones de vigencia. |

**Reglas del modelo.** UQ(huella). Uso único con consumo atómico; GET no consume. Sin token en claro. No sirve para confirmar turnos.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R10.a; docs/20.

## 7. FACULTAD_PLATAFORMA: Permiso administrativo sobre la plataforma

Es una concesión concreta para operar funciones globales, como la incorporación y operación de la plataforma. Conserva quién recibe el permiso, cuál es, quién lo otorga y durante qué período.

**Ejemplo ficticio.** Laura autoriza a Martín a revisar solicitudes de incorporación durante una semana, como ejemplo de una facultad operativa.

**Cómo distinguirlo.** «Facultad» significa atribución o autorización. Las dos referencias a CUENTA tienen papeles distintos: cuenta_id recibe y otorgante_id concede. Esta facultad no abre la lectura general de fichas ni permite suplantar usuarios.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| cuenta_id | FK/uuid/obligatorio | Cuenta personal que recibe el permiso global acotado. Se distingue de otorgante_id, que identifica a quien lo concede. Cada registro requiere exactamente un destino válido. |
| permiso_id | FK/uuid/obligatorio | Acción concreta que define o concede esta relación. Destino: PERMISO, acción concreta que puede autorizarse. Cada registro requiere exactamente un destino válido. |
| otorgante_id | FK/uuid/obligatorio | Cuenta de quien concede la autorización. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| revocada_en | instante/opcional | Fecha y hora en que se dejó sin efecto esta vinculación, autorización o credencial. Vacío solo indica que no consta revocación; pueden existir otras condiciones de validez. |

**Reglas del modelo.** No concede lectura general de fichas ni suplantación.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R10; MP-35 MP-38; D03.

## 8. CANAL_IDENTIDAD: Servicio y remitente de correos de acceso

Es la configuración de plataforma utilizada para enviar mensajes de recuperación o verificación sin exigir que la persona elija una clínica. Reúne proveedor, remitente y referencia protegida de acceso al servicio.

**Ejemplo ficticio.** El enlace de recuperación de Ana sale desde acceso@plataforma.ejemplo mediante un servicio de envío configurado.

**Cómo distinguirlo.** El destinatario de Ana figura en el proceso de identidad; esta tabla describe desde dónde se envía. IDENTIDAD_EXTERNA autentica usuarios; CANAL_IDENTIDAD permite enviar mensajes. Su conexión mediante TAREA_IDENTIDAD aparece en la parte 2.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| proveedor | texto/obligatorio | Servicio externo utilizado para enviar los mensajes del canal. |
| remitente | texto/obligatorio | Dirección o identidad desde la que la plataforma o la entidad envía los mensajes. |
| secreto_ref | secreto/obligatorio | Referencia protegida a la credencial del servicio de envío. No debe exponerse una clave de proveedor en pantallas, diagramas ni registros de operación. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** Canal restringido de identidad, separado de los remitentes de avisos de pacientes. No se elige una clínica para recuperar la cuenta.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R10.a; docs/20; D09 D16.

## Relaciones de esta lámina, incluidas las referencias externas

- IDENTIDAD_EXTERNA.cuenta_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de IDENTIDAD_EXTERNA mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- CREDENCIAL_LOCAL.cuenta_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de CREDENCIAL_LOCAL mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- SESION.cuenta_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de SESION mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- FACTOR_MFA.cuenta_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de FACTOR_MFA mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- TOKEN_IDENTIDAD.cuenta_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de TOKEN_IDENTIDAD mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- FACULTAD_PLATAFORMA.cuenta_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de FACULTAD_PLATAFORMA mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- FACULTAD_PLATAFORMA.permiso_id: cada registro debe referir a exactamente un registro de PERMISO. Como padre, cada registro de PERMISO puede ser referido por cero, uno o varios registros de FACULTAD_PLATAFORMA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- FACULTAD_PLATAFORMA.otorgante_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de FACULTAD_PLATAFORMA mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
