# 10. Reservas y capacidad

18 de octubre de 2026

Observe cómo una retención temporal se convierte en una cita y cómo se evita superponer al profesional entre clínicas. Separe registro del turno, horario histórico y confirmación de asistencia.

**Ejemplo de conjunto.** Lucía elige un horario; se adquiere una ocupación mínima, se guarda una pre-reserva y después se registra el turno. La confirmación posterior y los eventos dejan trazabilidad. Los reintentos no deben duplicar la cita.

**Recorrido.** EVALUACION_ELEGIBILIDAD > OCUPACION_GLOBAL y PRE_RESERVA > TURNO > VERSION_TURNO > confirmación y eventos. IDEMPOTENCIA controla repeticiones de operaciones.

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

## 1. OCUPACION_GLOBAL: Bloqueo mínimo del tiempo del profesional

Representa un intervalo ocupado de un profesional a nivel de plataforma para impedir superposición entre sus distintas entidades. Conserva el mínimo necesario para coordinar capacidad.

**Ejemplo ficticio.** Ana ya tiene una ocupación de 10:00 a 10:30 en una clínica. Otra entidad no debería reservar ese mismo tiempo como si estuviera libre.

**Cómo distinguirlo.** El registro no contiene paciente, agenda, entidad ni motivo. Global permite coordinar tiempo sin compartir las fichas. Los intervalos son [inicio, fin): el final no está incluido.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| profesional_id | FK/uuid/obligatorio | Identidad profesional global a la que corresponde el registro. Destino: PROFESIONAL_GLOBAL, identidad profesional reconocida en la plataforma. Cada registro requiere exactamente un destino válido. |
| inicio | instante/obligatorio | Instante de comienzo del intervalo. Debe ser anterior al fin; las ocupaciones usan intervalos con final excluido. |
| fin | instante/obligatorio | Instante de finalización del intervalo. En [inicio, fin), permite que otro intervalo empiece exactamente al terminar este. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| vence_en | instante/opcional | Fecha y hora límite de validez. Debe aplicarse la transición o comprobación correspondiente; la fecha por sí sola no ejecuta tareas. El modelo admite dejarlo vacío. |
| referencia_opaca | texto/obligatorio | Referencia de correlación de la ocupación que no revela paciente, entidad, agenda ni motivo. Su unicidad permite identificar el bloqueo sin exponer esos datos. |

**Reglas del modelo.** UQ(referencia_opaca). Sin paciente, tenant, agenda ni motivo. Inicio < fin; rangos [inicio,fin). Exclusión por profesional para ocupaciones activas. Vencimiento se resuelve explícitamente y transaccionalmente; sin índice dinámico now().

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R03; ADR-001.

## 2. PRE_RESERVA: Retención temporal de un horario

Es un bloqueo persistido previo a completar el turno. Reúne paciente-profesional, agenda, condiciones evaluadas, ocupación y vencimiento para coordinar el proceso.

**Ejemplo ficticio.** Lucía elige un horario y completa los datos mientras la capacidad queda retenida durante el plazo que finalmente se apruebe.

**Cómo distinguirlo.** El tiempo de retención sigue pendiente. No debe mantenerse una transacción de base de datos abierta mientras la persona llena el formulario. Una solicitud de admisión o gestión no crea esta retención.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| paciente_profesional_id | FK/uuid/obligatorio | Relación numerada entre el paciente y el profesional dentro de la entidad. Destino: PACIENTE_PROFESIONAL, relación del paciente con su profesional y su número visible. Cada registro requiere exactamente un destino válido. |
| agenda_id | FK/uuid/obligatorio | Agenda local a la que se refiere la configuración, acción o autorización. Destino: AGENDA, agenda de atención de un profesional en una sede. Cada registro requiere exactamente un destino válido. |
| version_oferta_id | FK/uuid/obligatorio | Condiciones históricas concretas de la oferta utilizadas. Destino: VERSION_OFERTA, condiciones de atención vigentes para una oferta. Cada registro requiere exactamente un destino válido. |
| elegibilidad_id | FK/uuid/obligatorio | Evaluación que documenta la compatibilidad de las condiciones elegidas. Destino: EVALUACION_ELEGIBILIDAD, comprobación de si se puede reservar bajo ciertas condiciones. Cada registro requiere exactamente un destino válido. |
| ocupacion_id | FK/uuid/obligatorio | Bloqueo mínimo del tiempo del profesional al que se vincula la operación. Destino: OCUPACION_GLOBAL, bloqueo mínimo del tiempo del profesional. Cada registro requiere exactamente un destino válido. |
| actor_id | FK/uuid/obligatorio | Cuenta de la persona que realiza la acción; cuando es opcional debe interpretarse con el actor de servicio. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| representacion_id | FK/uuid/opcional | Vínculo verificado que permite actuar por el paciente, cuando corresponde. Destino: REPRESENTACION, vínculo verificado para actuar por un paciente. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| inicio_atencion | instante/obligatorio | Instante de inicio de atención del paciente. Se diferencia de los márgenes de preparación o cierre que puedan afectar la ocupación. |
| fin_atencion | instante/obligatorio | Instante de finalización de la atención del paciente, separado de los márgenes adicionales de la oferta. |
| vence_en | instante/obligatorio | Fecha y hora límite de validez. Debe aplicarse la transición o comprobación correspondiente; la fecha por sí sola no ejecuta tareas. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| renovaciones | entero/obligatorio | Cantidad de renovaciones de la retención temporal. Sus límites y reglas deben acordarse; el campo no autoriza renovaciones ilimitadas. |

**Reglas del modelo.** UQ(ocupacion_id) dentro de esta tabla. Profesional, paciente y oferta coinciden. TTL pendiente; expirar no desplaza ocupaciones posteriores. No conservar transacción abierta durante el formulario.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R02 R03; CU-36.

## 3. TURNO: Identidad estable de una cita registrada

Representa la cita como objeto que conserva su identidad a lo largo de cambios. Registra quién la creó y separa situación del turno, asistencia y jornada.

**Ejemplo ficticio.** Se registra la cita de Lucía con Ana. Si cambia su horario individualmente, el turno conserva identidad y se registra una nueva versión.

**Cómo distinguirlo.** Registrar un turno no confirma asistencia. Tampoco debe confundirse el estado de cancelación con la llegada del paciente o la atención durante la jornada.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| paciente_profesional_id | FK/uuid/obligatorio | Relación numerada entre el paciente y el profesional dentro de la entidad. Destino: PACIENTE_PROFESIONAL, relación del paciente con su profesional y su número visible. Cada registro requiere exactamente un destino válido. |
| pre_reserva_id | FK/uuid/obligatorio | Retención temporal de origen que se convierte en un turno como máximo. Destino: PRE_RESERVA, retención temporal de un horario. Cada registro requiere exactamente un destino válido. |
| creador_id | FK/uuid/obligatorio | Cuenta de quien registra el turno. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| creado_en | instante/obligatorio | Fecha y hora de creación de este registro. |
| estado_turno | enum/obligatorio | Situación de la cita como turno, separada de la asistencia y la jornada. El catálogo y combinaciones válidas requieren revisión. |
| estado_asistencia | enum/obligatorio | Situación de la confirmación de asistencia. Registrar la cita o entregar un mensaje no confirma esta dimensión. |
| estado_jornada | enum/obligatorio | Situación operativa de la atención durante la jornada. No equivale al estado de reserva ni a la confirmación previa. |
| version_concurrencia | entero/obligatorio | Valor para detectar modificaciones simultáneas sobre el turno y evitar que una actualización sobrescriba otra sin control. |

**Reglas del modelo.** UQ(tenant_id,pre_reserva_id). Registro no confirma asistencia. Dimensiones separadas y combinaciones válidas por revisar. Una pre-reserva produce como máximo un turno.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R02 R08 R12; CU-37.

## 4. VERSION_TURNO: Horario y condiciones históricos de una cita

Conserva una versión inmutable con horario, agenda, oferta, elegibilidad, ocupación y condiciones aplicadas. Permite reconstruir cambios sin sobrescribir la historia.

**Ejemplo ficticio.** La cita de Lucía pasa del lunes al martes. Se conserva la versión del lunes y se crea la del martes, que queda vigente.

**Cómo distinguirlo.** Solo una versión está vigente. La primera reutiliza la ocupación de la pre-reserva. Reprogramar debe asegurar el destino y sustituir el origen en una operación consistente.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| turno_id | FK/uuid/obligatorio | Cita estable sobre la que se registra la versión, evento o excepción. Destino: TURNO, identidad estable de una cita registrada. Cada registro requiere exactamente un destino válido. |
| numero_version | entero/obligatorio | Secuencia de versiones dentro del objeto padre. Permite distinguir definiciones históricas sin alterar sus registros anteriores. |
| agenda_id | FK/uuid/obligatorio | Agenda local a la que se refiere la configuración, acción o autorización. Destino: AGENDA, agenda de atención de un profesional en una sede. Cada registro requiere exactamente un destino válido. |
| version_oferta_id | FK/uuid/obligatorio | Condiciones históricas concretas de la oferta utilizadas. Destino: VERSION_OFERTA, condiciones de atención vigentes para una oferta. Cada registro requiere exactamente un destino válido. |
| elegibilidad_id | FK/uuid/obligatorio | Evaluación que documenta la compatibilidad de las condiciones elegidas. Destino: EVALUACION_ELEGIBILIDAD, comprobación de si se puede reservar bajo ciertas condiciones. Cada registro requiere exactamente un destino válido. |
| ocupacion_id | FK/uuid/obligatorio | Bloqueo mínimo del tiempo del profesional al que se vincula la operación. Destino: OCUPACION_GLOBAL, bloqueo mínimo del tiempo del profesional. Cada registro requiere exactamente un destino válido. |
| inicio_atencion | instante/obligatorio | Instante de inicio de atención del paciente. Se diferencia de los márgenes de preparación o cierre que puedan afectar la ocupación. |
| fin_atencion | instante/obligatorio | Instante de finalización de la atención del paciente, separado de los márgenes adicionales de la oferta. |
| zona_horaria | texto/obligatorio | Zona utilizada para interpretar y mostrar horarios. Los instantes y las horas locales recurrentes requieren tratamientos diferentes. |
| condiciones_aplicadas | json/obligatorio | Copia histórica estructurada de nombre, duración, pausas y cobertura aplicados al turno. Complementa las referencias principales y no autoriza contenido clínico. |
| creada_en | instante/obligatorio | Fecha y hora de creación de este registro. |
| sustituida_en | instante/opcional | Momento en que esta versión dejó de ser la vigente al ser reemplazada. Las versiones históricas permanecen inmutables. El modelo admite dejarlo vacío. |

**Reglas del modelo.** UQ(tenant_id,turno_id,numero_version). Una versión vigente por turno; snapshot conserva nombre, duración, pausas y cobertura. Primera versión reutiliza ocupación de pre-reserva; cambiar horario adquiere destino y retira origen atómicamente.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R06 R07 R08 R12.

## 5. CONFIRMACION_ASISTENCIA: Confirmación expresa de una cita concreta

Registra una acción explícita de confirmar asistencia sobre una versión determinada del turno, indicando actor o representación, medio y evidencia.

**Ejemplo ficticio.** Lucía confirma que asistirá a la versión vigente de su cita mediante el mecanismo autorizado.

**Cómo distinguirlo.** Entregar o leer un mensaje no confirma asistencia. Confirmar tampoco ocupa otra capacidad. Una confirmación telefónica debe conservar operador y evidencia con facultad específica.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| version_turno_id | FK/uuid/obligatorio | Horario y condiciones de una versión concreta del turno. Destino: VERSION_TURNO, horario y condiciones históricos de una cita. Cada registro requiere exactamente un destino válido. |
| actor_id | FK/uuid/obligatorio | Cuenta de la persona que realiza la acción; cuando es opcional debe interpretarse con el actor de servicio. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| representacion_id | FK/uuid/opcional | Vínculo verificado que permite actuar por el paciente, cuando corresponde. Destino: REPRESENTACION, vínculo verificado para actuar por un paciente. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| medio | enum/obligatorio | Vía por la que se registró la confirmación, con las comprobaciones de actor y evidencia exigidas para cada caso. |
| confirmada_en | instante/obligatorio | Fecha y hora de la acción expresa de confirmar asistencia sobre esa versión del turno. |
| referencia_evidencia | texto/opcional | Referencia que respalda la confirmación, especialmente cuando interviene un operador por un medio asistido. El modelo admite dejarlo vacío. |

**Reglas del modelo.** UQ(tenant_id,version_turno_id). Repetir es idempotente; confirmar no reserva otra capacidad. Medio telefónico conserva operador y evidencia, con facultad específica.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R08 R09.

## 6. EVENTO_TURNO: Hecho registrado en la historia de una cita

Guarda los cambios y acontecimientos de un turno en orden temporal: acciones, motivos, resultados y actor humano o servicio que intervino.

**Ejemplo ficticio.** Se registra que Pedro reprogramó la cita, que Lucía llegó o que hubo una cancelación, según las operaciones autorizadas.

**Cómo distinguirlo.** La historia de eventos complementa el estado actual. La baja del profesional no borra estos eventos ni constituye automáticamente una cancelación.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| turno_id | FK/uuid/obligatorio | Cita estable sobre la que se registra la versión, evento o excepción. Destino: TURNO, identidad estable de una cita registrada. Cada registro requiere exactamente un destino válido. |
| version_turno_id | FK/uuid/opcional | Horario y condiciones de una versión concreta del turno. Destino: VERSION_TURNO, horario y condiciones históricos de una cita. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| actor_id | FK/uuid/opcional | Cuenta de la persona que realiza la acción; cuando es opcional debe interpretarse con el actor de servicio. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| servicio_actor | texto/opcional | Identificación del servicio automático que realizó la acción cuando no corresponde atribuirla a una persona. El modelo admite dejarlo vacío. |
| tipo | enum/obligatorio | Clase de hecho del turno, como un cambio o acontecimiento de jornada según las operaciones autorizadas. |
| ocurrido_en | instante/obligatorio | Momento en que ocurrió el hecho. Puede diferir del instante en que se recibió una notificación sobre él. |
| motivo | texto/opcional | Razón documentada de la operación, decisión o excepción, con acceso acorde al contexto. El modelo admite dejarlo vacío. |
| resultado | enum/obligatorio | Resultado de esta evaluación, operación o ensayo. Su catálogo depende de la entidad y no debe inferirse solo de que exista un registro. |
| cambios_minimos | json/obligatorio | Información mínima de los cambios necesarios para trazabilidad. No debe incluir contraseñas, tokens ni cuerpos de chat. |

**Reglas del modelo.** Actor humano o servicio identificados. La baja del profesional no borra eventos ni crea cancelación implícita.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R08 R12.

## 7. IDEMPOTENCIA: Control para que un reintento no duplique una operación

Guarda la clave de una operación, una huella de su entrada y la referencia al resultado. Permite reconocer una repetición de la misma petición.

**Ejemplo ficticio.** Pedro pulsa dos veces «Guardar turno» por una demora. Si ambas peticiones tienen la misma clave y entrada, deben resolver la misma operación.

**Cómo distinguirlo.** Idempotencia significa repetir sin duplicar el efecto. Usar la misma clave con datos diferentes debe rechazarse; la clave no es un permiso y no debe contener secretos.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| actor_id | FK/uuid/obligatorio | Cuenta de la persona que realiza la acción; cuando es opcional debe interpretarse con el actor de servicio. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| operacion | texto/obligatorio | Clase de acción cuya repetición se controla mediante idempotencia. |
| clave | texto/obligatorio | Valor que identifica una petición repetible dentro de su actor, operación y entidad. |
| huella_entrada | texto/obligatorio | Resumen de los datos de entrada para comprobar que una repetición de clave corresponde a la misma petición. |
| resultado_ref | texto/obligatorio | Referencia al resultado de la operación para devolverlo o reconocerlo sin duplicar su efecto. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| creada_en | instante/obligatorio | Fecha y hora de creación de este registro. |
| vence_en | instante/opcional | Fecha y hora límite de validez. Debe aplicarse la transición o comprobación correspondiente; la fecha por sí sola no ejecuta tareas. El modelo admite dejarlo vacío. |

**Reglas del modelo.** UQ(tenant_id,actor_id,operacion,clave). Misma clave con entrada distinta se rechaza. No almacena secretos; retención por definir.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R02 R03 R12.

## Relaciones de esta lámina, incluidas las referencias externas

- OCUPACION_GLOBAL.profesional_id: cada registro debe referir a exactamente un registro de PROFESIONAL_GLOBAL. Como padre, cada registro de PROFESIONAL_GLOBAL puede ser referido por cero, uno o varios registros de OCUPACION_GLOBAL mediante ese campo. Destino en carpeta 04-profesionales-e-incorporacion. ID global restringido.
- PRE_RESERVA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de PRE_RESERVA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- PRE_RESERVA.paciente_profesional_id: cada registro debe referir a exactamente un registro de PACIENTE_PROFESIONAL. Como padre, cada registro de PACIENTE_PROFESIONAL puede ser referido por cero, uno o varios registros de PRE_RESERVA mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- PRE_RESERVA.agenda_id: cada registro debe referir a exactamente un registro de AGENDA. Como padre, cada registro de AGENDA puede ser referido por cero, uno o varios registros de PRE_RESERVA mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- PRE_RESERVA.version_oferta_id: cada registro debe referir a exactamente un registro de VERSION_OFERTA. Como padre, cada registro de VERSION_OFERTA puede ser referido por cero, uno o varios registros de PRE_RESERVA mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- PRE_RESERVA.elegibilidad_id: cada registro debe referir a exactamente un registro de EVALUACION_ELEGIBILIDAD. Como padre, cada registro de EVALUACION_ELEGIBILIDAD puede ser referido por cero, uno o varios registros de PRE_RESERVA mediante ese campo. Destino en carpeta 09-coberturas-y-convenios. compuesta tenant_id + id.
- PRE_RESERVA.ocupacion_id: cada registro debe referir a exactamente un registro de OCUPACION_GLOBAL. Como padre, cada registro de OCUPACION_GLOBAL puede ser referido por cero o un registro de PRE_RESERVA mediante ese campo. Destino en carpeta 10-reservas-y-capacidad. ID global restringido.
- PRE_RESERVA.actor_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de PRE_RESERVA mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- PRE_RESERVA.representacion_id: cada registro puede no referir a ninguno o referir a un solo registro de REPRESENTACION. Como padre, cada registro de REPRESENTACION puede ser referido por cero, uno o varios registros de PRE_RESERVA mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- TURNO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de TURNO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- TURNO.paciente_profesional_id: cada registro debe referir a exactamente un registro de PACIENTE_PROFESIONAL. Como padre, cada registro de PACIENTE_PROFESIONAL puede ser referido por cero, uno o varios registros de TURNO mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- TURNO.pre_reserva_id: cada registro debe referir a exactamente un registro de PRE_RESERVA. Como padre, cada registro de PRE_RESERVA puede ser referido por cero o un registro de TURNO mediante ese campo. Destino en carpeta 10-reservas-y-capacidad. compuesta tenant_id + id.
- TURNO.creador_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de TURNO mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- VERSION_TURNO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de VERSION_TURNO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- VERSION_TURNO.turno_id: cada registro debe referir a exactamente un registro de TURNO. Como padre, cada registro de TURNO puede ser referido por cero, uno o varios registros de VERSION_TURNO mediante ese campo. Destino en carpeta 10-reservas-y-capacidad. compuesta tenant_id + id.
- VERSION_TURNO.agenda_id: cada registro debe referir a exactamente un registro de AGENDA. Como padre, cada registro de AGENDA puede ser referido por cero, uno o varios registros de VERSION_TURNO mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- VERSION_TURNO.version_oferta_id: cada registro debe referir a exactamente un registro de VERSION_OFERTA. Como padre, cada registro de VERSION_OFERTA puede ser referido por cero, uno o varios registros de VERSION_TURNO mediante ese campo. Destino en carpeta 07-agendas-y-catalogo. compuesta tenant_id + id.
- VERSION_TURNO.elegibilidad_id: cada registro debe referir a exactamente un registro de EVALUACION_ELEGIBILIDAD. Como padre, cada registro de EVALUACION_ELEGIBILIDAD puede ser referido por cero, uno o varios registros de VERSION_TURNO mediante ese campo. Destino en carpeta 09-coberturas-y-convenios. compuesta tenant_id + id.
- VERSION_TURNO.ocupacion_id: cada registro debe referir a exactamente un registro de OCUPACION_GLOBAL. Como padre, cada registro de OCUPACION_GLOBAL puede ser referido por cero, uno o varios registros de VERSION_TURNO mediante ese campo. Destino en carpeta 10-reservas-y-capacidad. ID global restringido.
- CONFIRMACION_ASISTENCIA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de CONFIRMACION_ASISTENCIA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- CONFIRMACION_ASISTENCIA.version_turno_id: cada registro debe referir a exactamente un registro de VERSION_TURNO. Como padre, cada registro de VERSION_TURNO puede ser referido por cero o un registro de CONFIRMACION_ASISTENCIA mediante ese campo. Destino en carpeta 10-reservas-y-capacidad. compuesta tenant_id + id.
- CONFIRMACION_ASISTENCIA.actor_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de CONFIRMACION_ASISTENCIA mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- CONFIRMACION_ASISTENCIA.representacion_id: cada registro puede no referir a ninguno o referir a un solo registro de REPRESENTACION. Como padre, cada registro de REPRESENTACION puede ser referido por cero, uno o varios registros de CONFIRMACION_ASISTENCIA mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- EVENTO_TURNO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de EVENTO_TURNO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- EVENTO_TURNO.turno_id: cada registro debe referir a exactamente un registro de TURNO. Como padre, cada registro de TURNO puede ser referido por cero, uno o varios registros de EVENTO_TURNO mediante ese campo. Destino en carpeta 10-reservas-y-capacidad. compuesta tenant_id + id.
- EVENTO_TURNO.version_turno_id: cada registro puede no referir a ninguno o referir a un solo registro de VERSION_TURNO. Como padre, cada registro de VERSION_TURNO puede ser referido por cero, uno o varios registros de EVENTO_TURNO mediante ese campo. Destino en carpeta 10-reservas-y-capacidad. compuesta tenant_id + id.
- EVENTO_TURNO.actor_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de EVENTO_TURNO mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- IDEMPOTENCIA.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de IDEMPOTENCIA mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- IDEMPOTENCIA.actor_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de IDEMPOTENCIA mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
