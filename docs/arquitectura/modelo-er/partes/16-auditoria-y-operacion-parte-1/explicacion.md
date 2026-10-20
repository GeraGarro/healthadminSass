# 16. Auditoría y operación, parte 1

18 de octubre de 2026

Revise cómo se registra quién actuó, qué políticas se aplicaron y qué intervenciones excepcionales se autorizaron. Después compruebe la diferencia entre hacer una copia y demostrar que puede recuperarse.

**Ejemplo de conjunto.** Se audita una modificación de turno sin exponer secretos; una excepción necesita alcance y motivo. Operación registra el respaldo y realiza un ensayo separado para disponer de evidencia de recuperación.

**Recorrido.** AUDITORIA_ENTIDAD y AUDITORIA_GLOBAL separan ámbitos; POLITICA_OPERATIVA > EXCEPCION_POLITICA; CASO_ABUSO y ACCESO_SOPORTE acotan intervenciones; RESPALDO > ENSAYO_RESTAURACION.

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

## 1. AUDITORIA_ENTIDAD: Registro de quién hizo qué dentro de una clínica

Guarda una cronología restringida de acciones, actor real, contexto local, resultado y cambios mínimos necesarios para trazabilidad.

**Ejemplo ficticio.** Se registra que Pedro modificó un turno autorizado de Clínica Norte, con fecha y resultado.

**Cómo distinguirlo.** Referenciar un paciente o recurso desde auditoría no concede acceso al recurso. No deben incluirse secretos ni cuerpos completos de chat. La baja profesional no borra la auditoría.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| actor_id | FK/uuid/opcional | Cuenta de la persona que realiza la acción; cuando es opcional debe interpretarse con el actor de servicio. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| servicio_actor | texto/opcional | Identificación del servicio automático que realizó la acción cuando no corresponde atribuirla a una persona. El modelo admite dejarlo vacío. |
| paciente_id | FK/uuid/opcional | Ficha administrativa local del paciente involucrado. Destino: PACIENTE, ficha administrativa de un paciente en una clínica. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| agenda_id | FK/uuid/opcional | Agenda local a la que se refiere la configuración, acción o autorización. Destino: AGENDA, agenda de atención de un profesional en una sede. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| accion | texto/obligatorio | Operación autorizable o acción efectivamente auditada, según la tabla. Debe interpretarse junto con su ámbito y resultado. |
| recurso_tipo | texto/obligatorio | Clase de objeto sobre el que se auditó una acción. Se combina con recurso_ref para localizar el contexto. |
| recurso_ref | texto/obligatorio | Localizador del objeto auditado. Es una referencia polimórfica documentada y no una FK que conceda acceso al recurso. |
| ocurrido_en | instante/obligatorio | Momento en que ocurrió el hecho. Puede diferir del instante en que se recibió una notificación sobre él. |
| resultado | enum/obligatorio | Resultado de esta evaluación, operación o ensayo. Su catálogo depende de la entidad y no debe inferirse solo de que exista un registro. |
| motivo | texto/opcional | Razón documentada de la operación, decisión o excepción, con acceso acorde al contexto. El modelo admite dejarlo vacío. |
| cambios_minimos | json/obligatorio | Información mínima de los cambios necesarios para trazabilidad. No debe incluir contraseñas, tokens ni cuerpos de chat. |
| correlacion | texto/obligatorio | Identificador que permite seguir hechos relacionados de una misma operación sin copiar todo su contenido. |

**Reglas del modelo.** Actor humano o servicio identificados. Referencia polimórfica es localizador auditado, no FK; no secretos ni cuerpos de chat. No se borra por baja profesional.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R12; S10.

## 2. AUDITORIA_GLOBAL: Registro restringido de acciones de identidad y plataforma

Conserva eventos globales como acceso, recuperación y concesiones operativas, con actor y contexto mínimo.

**Ejemplo ficticio.** Se registra un cambio de contraseña o la concesión de una facultad de plataforma.

**Cómo distinguirlo.** Su alcance está separado de la auditoría local. Un administrador de clínica no obtiene por ello visibilidad sobre todas las actividades globales de las cuentas.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| actor_id | FK/uuid/opcional | Cuenta de la persona que realiza la acción; cuando es opcional debe interpretarse con el actor de servicio. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| servicio_actor | texto/opcional | Identificación del servicio automático que realizó la acción cuando no corresponde atribuirla a una persona. El modelo admite dejarlo vacío. |
| cuenta_afectada_id | FK/uuid/opcional | Cuenta sobre la que recae el hecho auditado. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| accion | texto/obligatorio | Operación autorizable o acción efectivamente auditada, según la tabla. Debe interpretarse junto con su ámbito y resultado. |
| ocurrido_en | instante/obligatorio | Momento en que ocurrió el hecho. Puede diferir del instante en que se recibió una notificación sobre él. |
| resultado | enum/obligatorio | Resultado de esta evaluación, operación o ensayo. Su catálogo depende de la entidad y no debe inferirse solo de que exista un registro. |
| contexto_minimo | json/obligatorio | Datos mínimos necesarios para entender un evento global. Excluye fichas de pacientes y cuerpos de mensajes. |

**Reglas del modelo.** Sin datos de ficha ni mensajes. Eventos de login, recuperación y facultades globales; acceso separado de auditoría local.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R10 R12; S10; docs/20.

## 3. POLITICA_OPERATIVA: Versión de reglas y parámetros de operación

Identifica un conjunto versionado de parámetros para una clase de política y conserva vigencia y aprobación. El tipo determina cómo interpretar esos parámetros.

**Ejemplo ficticio.** Se documenta una versión de la política de reserva con los valores que se aprueben para la operación.

**Cómo distinguirlo.** El registro no aprueba valores por sí mismo. Los plazos de retención y cuotas pendientes no deben inventarse, y la regla general T-24 no se anula silenciosamente.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| tipo | enum/obligatorio | Clase de política que determina el esquema y significado de parametros. Sus valores concretos deben revisarse. |
| numero_version | entero/obligatorio | Secuencia de versiones dentro del objeto padre. Permite distinguir definiciones históricas sin alterar sus registros anteriores. |
| parametros | json/obligatorio | Valores estructurados de la política, interpretados por su tipo y versión. Deben revisarse; no se admiten parámetros arbitrarios que anulen reglas confirmadas. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| aprobador_id | FK/uuid/obligatorio | Cuenta de quien aprueba la concesión, acceso o política. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |

**Reglas del modelo.** UQ(tenant_id,tipo,numero_version). Sin valores inventados de TTL/cuotas. Tipo identifica esquema de parámetros; regla general T-24 no se anula silenciosamente.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R02.a R08 R11; D01 D07 D15.

## 4. EXCEPCION_POLITICA: Excepción acotada y aprobada a una regla

Registra una desviación asistida de una política para un sujeto o turno concreto, con motivo, alcance, aprobador y período.

**Ejemplo ficticio.** Una situación particular se tramita con una excepción expresamente autorizada sobre un turno identificado.

**Cómo distinguirlo.** Debe existir un alcance concreto y al menos un sujeto o turno. No representa suspensión masiva de reglas ni un permiso global para quien la recibe.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| politica_id | FK/uuid/obligatorio | Versión de política sobre la que se plantea la excepción. Destino: POLITICA_OPERATIVA, versión de reglas y parámetros de operación. Cada registro requiere exactamente un destino válido. |
| paciente_id | FK/uuid/opcional | Ficha administrativa local del paciente involucrado. Destino: PACIENTE, ficha administrativa de un paciente en una clínica. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| turno_id | FK/uuid/opcional | Cita estable sobre la que se registra la versión, evento o excepción. Destino: TURNO, identidad estable de una cita registrada. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| actor_beneficiario_id | FK/uuid/opcional | Cuenta beneficiada por la excepción concreta de política. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| aprobador_id | FK/uuid/obligatorio | Cuenta de quien aprueba la concesión, acceso o política. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| motivo | texto/obligatorio | Razón documentada de la operación, decisión o excepción, con acceso acorde al contexto. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/obligatorio | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| alcance | json/obligatorio | Operaciones, sujetos o recursos concretos comprendidos en la autorización o excepción. Su definición debe ser explícita y verificable. |

**Reglas del modelo.** Debe indicar al menos un sujeto/turno y alcance concreto; no es suspensión masiva ni permiso global.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R02.a R08; D07 D15.

## 5. CASO_ABUSO: Revisión humana de una posible conducta abusiva

Agrupa señales mínimas, revisión, decisión y cierre de un caso local. Permite analizar problemas sin convertir automáticamente un indicio en una sanción.

**Ejemplo ficticio.** Un patrón de reservas requiere revisión por personal autorizado de Clínica Norte.

**Cómo distinguirlo.** Un DNI declarado o una dirección IP compartida no bastan para sancionar. El modelo no comparte listas entre entidades ni necesita una tabla de dominio por cada petición técnica.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| paciente_id | FK/uuid/opcional | Ficha administrativa local del paciente involucrado. Destino: PACIENTE, ficha administrativa de un paciente en una clínica. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| cuenta_id | FK/uuid/opcional | Cuenta personal asociada a este registro. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| revisor_id | FK/uuid/opcional | Cuenta de quien revisa el trámite o caso. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| senal_minima | json/obligatorio | Indicio mínimo necesario para revisar un posible abuso. No es por sí solo una decisión sancionatoria. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| decision | texto/opcional | Resultado de la revisión humana del caso de abuso, con criterios y facultades todavía por definir cuando corresponda. El modelo admite dejarlo vacío. |
| abierto_en | instante/obligatorio | Fecha y hora de apertura del caso o incidente. |
| cerrado_en | instante/opcional | Fecha y hora de cierre del caso o incidente. El modelo admite dejarlo vacío. |

**Reglas del modelo.** DNI declarado o IP familiar no bastan para sanción. Métricas de frecuencia efímeras no requieren entidad de dominio por cada petición.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R02.a; S16; CU-27.

## 6. ACCESO_SOPORTE: Autorización excepcional y temporal para soporte

Registra quién recibe una concesión de soporte, quién la concede, el motivo, los recursos o acciones comprendidos y la vigencia.

**Ejemplo ficticio.** Un problema operativo requiere una intervención de soporte con alcance delimitado y trazable, si se aprueba el diseño.

**Cómo distinguirlo.** Concedente, recursos y acciones todavía deben aprobarse. Ser desarrollador o administrador de plataforma no implica lectura libre ni suplantación de usuarios.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| operador_id | FK/uuid/obligatorio | Cuenta de quien ejecuta la operación administrativa o de soporte. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| concedente_id | FK/uuid/obligatorio | Cuenta de quien concede el acceso excepcional de soporte. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| motivo | texto/obligatorio | Razón documentada de la operación, decisión o excepción, con acceso acorde al contexto. |
| alcance | json/obligatorio | Operaciones, sujetos o recursos concretos comprendidos en la autorización o excepción. Su definición debe ser explícita y verificable. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/obligatorio | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| revocado_en | instante/opcional | Fecha y hora en que se dejó sin efecto este factor, token o autorización. Su ausencia no sustituye las demás verificaciones de vigencia. |

**Reglas del modelo.** Concedente, recursos y acciones aún por aprobar. No suplantación libre ni lectura por ser administrador de plataforma.

**Estado.** Propuesta de soporte pendiente. **Fuentes.** R10; S02; MP-44; D03 D16.

## 7. RESPALDO: Ficha técnica de una copia de seguridad

Conserva metadatos protegidos sobre la ejecución y ubicación segura de un respaldo, con evidencia de alcance e integridad.

**Ejemplo ficticio.** Operación registra que se generó un respaldo, dónde está protegido y cómo se comprobó su integridad.

**Cómo distinguirlo.** La tabla no contiene el archivo de respaldo, fichas ni credenciales. Puede residir fuera de la base de negocio y debe abarcar datos consistentes, incluidos contadores y tareas.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| operador_ref | texto/obligatorio | Referencia operativa de quien ejecutó o controló el respaldo; puede pertenecer a la infraestructura y no ser una FK de usuario de negocio. |
| repositorio_seguro_ref | texto/obligatorio | Referencia al almacenamiento protegido donde reside la copia real; no contiene la copia ni credenciales de acceso. |
| iniciado_en | instante/obligatorio | Fecha y hora de inicio del intento técnico o del proceso documentado. |
| finalizado_en | instante/opcional | Fecha y hora de finalización del proceso de respaldo. El modelo admite dejarlo vacío. |
| alcance_ref | texto/obligatorio | Referencia a los componentes y datos comprendidos por el respaldo, incluidos los que deben mantenerse consistentes. |
| integridad_ref | texto/opcional | Referencia a la comprobación de integridad del respaldo, para disponer de evidencia verificable. El modelo admite dejarlo vacío. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** Metadatos de infraestructura fuera de API de negocio. Archivo real reside en almacenamiento protegido; incluye consistencia de turnos, contadores, ocupación y tareas.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** S11; CU-33.

## 8. ENSAYO_RESTAURACION: Prueba documentada de recuperación de un respaldo

Guarda el respaldo probado, entorno separado, momento, duración, pérdida de datos observada y evidencia del resultado.

**Ejemplo ficticio.** Se restaura una copia en un entorno de prueba y se comprueba la consistencia de turnos, numeración y trabajos pendientes.

**Cómo distinguirlo.** Tener un backup no demuestra que pueda recuperarse. El ensayo aporta evidencia; sus resultados no son garantías de RPO o RTO, objetivos que aún deben acordarse. El ensayo no debe enviar avisos reales.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| respaldo_id | FK/uuid/obligatorio | Copia de seguridad cuya recuperación se puso a prueba. Destino: RESPALDO, ficha técnica de una copia de seguridad. Cada registro requiere exactamente un destino válido. |
| entorno_ref | texto/obligatorio | Referencia del entorno separado donde se realizó el ensayo de restauración. Debe impedir envíos reales de comunicaciones. |
| ejecutado_en | instante/obligatorio | Fecha y hora de ejecución del ensayo de restauración. |
| duracion_seg | entero/obligatorio | Duración observada del ensayo en segundos; es una medición y no una garantía de recuperación futura. |
| perdida_datos_seg | entero/opcional | Ventana de pérdida de datos observada o medida en el ensayo, expresada en segundos según el criterio que se acuerde. El modelo admite dejarlo vacío. |
| resultado | enum/obligatorio | Resultado de esta evaluación, operación o ensayo. Su catálogo depende de la entidad y no debe inferirse solo de que exista un registro. |
| evidencia_ref | texto/obligatorio | Referencia a la evidencia autorizada que respalda una verificación, ensayo o actuación. No implica almacenar archivos sensibles directamente aquí. |

**Reglas del modelo.** Sin envíos reales desde ensayo. RPO/RTO son objetivos por acordar, no valores garantizados.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** S11; CU-33; D16.

## Relaciones de esta lámina, incluidas las referencias externas

- AUDITORIA_ENTIDAD.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de AUDITORIA_ENTIDAD mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- AUDITORIA_ENTIDAD.actor_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de AUDITORIA_ENTIDAD mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- AUDITORIA_ENTIDAD.paciente_id: cada registro puede no referir a ninguno o referir a un solo registro de PACIENTE. Como padre, cada registro de PACIENTE puede ser referido por cero, uno o varios registros de AUDITORIA_ENTIDAD mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- AUDITORIA_ENTIDAD.agenda_id: cada registro puede no referir a ninguno o referir a un solo registro de AGENDA. Como padre, cada registro de AGENDA puede ser referido por cero, uno o varios registros de AUDITORIA_ENTIDAD mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- AUDITORIA_GLOBAL.actor_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de AUDITORIA_GLOBAL mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- AUDITORIA_GLOBAL.cuenta_afectada_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de AUDITORIA_GLOBAL mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- POLITICA_OPERATIVA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de POLITICA_OPERATIVA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- POLITICA_OPERATIVA.aprobador_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de POLITICA_OPERATIVA mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- EXCEPCION_POLITICA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de EXCEPCION_POLITICA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- EXCEPCION_POLITICA.politica_id: cada registro debe referir a exactamente un registro de POLITICA_OPERATIVA. Como padre, cada registro de POLITICA_OPERATIVA puede ser referido por cero, uno o varios registros de EXCEPCION_POLITICA mediante ese campo. Destino en carpeta 16-auditoria-y-operacion-parte-1. compuesta tenant_id + id.
- EXCEPCION_POLITICA.paciente_id: cada registro puede no referir a ninguno o referir a un solo registro de PACIENTE. Como padre, cada registro de PACIENTE puede ser referido por cero, uno o varios registros de EXCEPCION_POLITICA mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- EXCEPCION_POLITICA.turno_id: cada registro puede no referir a ninguno o referir a un solo registro de TURNO. Como padre, cada registro de TURNO puede ser referido por cero, uno o varios registros de EXCEPCION_POLITICA mediante ese campo. Destino en carpeta 10-reservas-y-capacidad. compuesta tenant_id + id.
- EXCEPCION_POLITICA.actor_beneficiario_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de EXCEPCION_POLITICA mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- EXCEPCION_POLITICA.aprobador_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de EXCEPCION_POLITICA mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- CASO_ABUSO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de CASO_ABUSO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- CASO_ABUSO.paciente_id: cada registro puede no referir a ninguno o referir a un solo registro de PACIENTE. Como padre, cada registro de PACIENTE puede ser referido por cero, uno o varios registros de CASO_ABUSO mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- CASO_ABUSO.cuenta_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de CASO_ABUSO mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- CASO_ABUSO.revisor_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de CASO_ABUSO mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- ACCESO_SOPORTE.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de ACCESO_SOPORTE mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- ACCESO_SOPORTE.operador_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de ACCESO_SOPORTE mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- ACCESO_SOPORTE.concedente_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de ACCESO_SOPORTE mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- ENSAYO_RESTAURACION.respaldo_id: cada registro debe referir a exactamente un registro de RESPALDO. Como padre, cada registro de RESPALDO puede ser referido por cero, uno o varios registros de ENSAYO_RESTAURACION mediante ese campo. Destino en carpeta 16-auditoria-y-operacion-parte-1. ID global restringido.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
