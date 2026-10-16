# Glosario del dominio

Fecha: 15 de octubre de 2026. Versión: 1.1. Incremento 1, etapa de dominio y alcance.

Estado: primera versión documental para revisión. Consolida las decisiones vigentes y el requerimiento del responsable de comenzar con consulta, extracción, limpieza y cirugía, permitiendo añadir prácticas personalizadas. Las propuestas de detalle se identifican en el [catálogo](16-catalogo-de-practicas.md); documentarlas no implica que estén aprobadas o implementadas.

## Propósito y convenciones

Establecer un vocabulario común para responsables, profesionales, secretaría y desarrollo. Las definiciones describen la gestión administrativa; los nombres de prácticas no constituyen indicaciones clínicas.

Se propone usar **práctica** como término principal y **servicio** como sinónimo en documentos anteriores. Se recomienda escribir **entidad cliente** o **entidad de cobertura médica** cuando pueda haber ambigüedad. Cada bloque remite a las reglas que desarrollan su comportamiento.

## Organización y actores

Referencia: R01, R04, R05, R09 y R10 de las [reglas del dominio](03-reglas-del-dominio.md).

| Término | Definición y límite |
| --- | --- |
| Sistema de gestión administrativa de salud | Plataforma para administrar pacientes, acceso, agendas, turnos y comunicaciones, inicialmente odontológica. Las funciones clínicas especializadas requieren otro alcance. |
| Entidad cliente | Unidad organizativa que utiliza el sistema y delimita datos y permisos. Puede representar una clínica o la actividad independiente de un profesional. |
| Sede | Lugar de atención perteneciente a una entidad cliente. Una sede adicional no constituye por sí sola otra entidad. |
| Consultorio | Espacio o establecimiento de atención en el lenguaje habitual. Al modelarlo se precisa si corresponde a entidad, sede o recurso físico. |
| Profesional | Persona que presta atención y puede trabajar en varias entidades. |
| Identidad profesional global | Identificación verificada del mismo profesional en la plataforma, utilizada para coordinar su capacidad entre entidades. No comparte fichas de pacientes. |
| Vínculo profesional | Relación del profesional con una entidad, con estado y vigencia propios. |
| Profesional independiente | Profesional que opera mediante una entidad propia, además de los vínculos institucionales que pudiera tener. |
| Transición administrada del profesional | Cambio gestionado por plataforma, conservando cuenta e identidad y dando continuidad a su fichaje al independizarse. Modelado por entidad, datos compartidos, turnos y numeración pendientes; ADR-011. |
| Fichaje vinculado al profesional | Conjunto de pacientes y relaciones administrativas vinculados al profesional que debe conservarse para su continuidad independiente. Su representación técnica con fichas locales por entidad sigue pendiente; no incluye por defecto las operaciones de otros profesionales. |
| Baja institucional del profesional | Finalización del vínculo con una entidad, ejecutable por su administrador autorizado. Revoca facultades en esa entidad y conserva cuenta global, fichaje y otros vínculos. |
| Eliminación de cuenta profesional | Procedimiento solo a petición expresa del profesional para eliminar cuenta y vínculos, conservando fichas de pacientes e historial administrativo. Verificación y tratamiento de referencias históricas por diseñar. |
| Secretaría o recepción | Personal administrativo cuya actuación exige membresía, facultad específica y, al operar una agenda delegada, autorización del profesional. |
| Administrador de entidad | Actor encargado de funciones organizativas autorizadas dentro de una entidad. Su cargo no concede automáticamente gestión de agendas o lectura de chats. |
| Administrador de plataforma | Actor que incorpora y opera entidades y cuentas de la beta con permisos acotados. Su función no concede acceso indiscriminado a datos asistenciales. |
| Responsable de contratación | Persona que gestiona la adquisición del SaaS. Se propone registrar su cuenta/contacto separado de la administración de entidad; puede tramitar para otra persona. Titular contractual, pagador y contrato se concretarán en I2/I3; docs/20. |
| Paciente | Persona que recibe atención. Puede tener ficha sin disponer de cuenta de acceso. |
| Representante | Persona con facultades verificadas para actuar por un paciente, según alcance, vigencia y restricciones registrados. |
| Actor | Usuario o automatización que ejecuta una acción. Puede ser distinto del paciente al que afecta. |
| Destinatario de aviso | Persona autorizada a recibir una comunicación concreta. Ser contacto no implica representación ni permiso de acceso. |

## Identidad, acceso y permisos

Referencia: R01.a, R04 y R09.a; [diseño de acceso](12-acceso-con-aprobacion-administrativa.md).

| Término | Definición y límite |
| --- | --- |
| Cuenta de usuario | Identidad de acceso reutilizable por una persona. Una cuenta no habilita automáticamente todas las entidades. |
| Solicitud de incorporación comercial | Propuesta de trámite para solicitar alta de una entidad, con contacto verificado y revisión por plataforma. Distinta de admisión del paciente, membresía y suscripción; docs/20. |
| Restablecimiento de contraseña | Recuperación de una credencial olvidada mediante email, confirmada para secretaría, administración y profesionales. No modifica roles ni reactiva vínculos revocados; mecanismo propuesto en docs/20. |
| Ficha de paciente | Registro administrativo del paciente dentro de una entidad. Se distingue de la cuenta y de una historia clínica especializada. |
| Identificador interno | Clave técnica estable que identifica un registro. No es el número visible del paciente ni una credencial. |
| Número de paciente por profesional y entidad | Número visible asignado a esa relación. Se conserva al reactivar y se comparte entre agendas del mismo profesional en esa entidad; las series de otras entidades o profesionales son independientes. |
| Membresía de entidad | Relación vigente que permite a un usuario participar en una entidad. No equivale a suscripción comercial. |
| Abono comercial | Precio total contratado por el servicio SaaS y su alcance, incluidas las comunicaciones según condiciones acordadas. Precio y cupos siguen pendientes. |
| Rol | Agrupación de funciones o permisos de un actor. Su nombre no reemplaza las comprobaciones por entidad y recurso. |
| Permiso o facultad | Autorización para una acción concreta sobre un ámbito definido, por ejemplo crear prácticas o configurar su duración. |
| Delegación de agenda | Autorización del profesional a una persona para acciones específicas sobre una agenda de la misma entidad. Puede revocarse. |
| Solicitud de admisión | Pedido protegido de incorporación del paciente, sujeto a revisión administrativa. No crea turno ni ocupa capacidad. |
| Admisión administrativa | Decisión de personal autorizado que habilita al paciente en un contexto determinado, tras las comprobaciones definidas. |
| Habilitación de acceso | Autorización persistente para acceder al contexto aprobado, sujeta a activación, vinculación y permisos vigentes. |
| Activación | Paso verificable por el que se completa el acceso previamente aprobado. Sus mecanismos concretos siguen pendientes. |
| Vinculación de cuenta y ficha | Asociación verificada entre una cuenta y la ficha del paciente o su representación. No se realiza por una coincidencia de nombre o contacto solamente. |
| Autenticación | Comprobación del control de las credenciales usadas para ingresar. No sustituye admisión ni autorización. |
| Autorización | Comprobación de que el actor puede realizar la acción solicitada sobre la entidad y el recurso concretos. |
| Suspensión o revocación de acceso | Restricción que impide nuevas operaciones en el ámbito afectado. No borra automáticamente la cuenta, la historia ni los turnos. |
| Representación verificada | Relación comprobada con facultades para actuar por otra persona. Un parentesco declarado o un contacto de emergencia no bastan. |

## Prácticas y catálogo

Referencia: R06 y [especificación del catálogo](16-catalogo-de-practicas.md).

| Término | Definición y límite |
| --- | --- |
| Práctica o servicio | Prestación administrativamente identificada que puede asociarse a un turno y a condiciones de duración, recursos, cobertura y asignación. |
| Catálogo de prácticas | Conjunto administrable de prácticas de la entidad. Incluye las iniciales y las personalizadas autorizadas. |
| Práctica inicial | Una de las cuatro indicadas por el responsable: consulta, extracción, limpieza o cirugía. El listado no es cerrado. |
| Práctica personalizada | Práctica añadida por un actor con facultad explícita. Se somete a las mismas reglas de configuración y permisos que una inicial. |
| Consulta | Práctica específica del catálogo inicial y única para la que paciente o representante habilitado puede elegir horarios. Exige oferta habilitada y condiciones válidas; una práctica personalizada no obtiene ese permiso por llamarse o clasificarse como consulta. |
| Extracción | Nombre de una práctica inicial del catálogo. Su turno y reprogramación se asignan por personal autorizado; sus variantes y duración requieren definición profesional. |
| Limpieza | Nombre de una práctica inicial del catálogo, con asignación de horario por personal autorizado. Su denominación específica y duración se validan con el piloto. |
| Cirugía | Nombre general de una práctica inicial, con asignación por personal autorizado. Sus posibles variantes y recursos deben concretarse antes de ofrecerla. |
| Tipo de práctica | Clasificación administrativa del catálogo. No concede elección de horario por paciente: esa posibilidad se limita a la identidad de la práctica base «Consulta». |
| Modalidad de asignación | Regla que establece quién puede elegir el horario. Solo la práctica base «Consulta» puede habilitar elección por paciente o representante; todas las demás, incluidas las personalizadas, requieren personal autorizado. |
| Modalidad de atención | Forma o contexto de prestación, por ejemplo presencial si así se configura. Es distinta de la modalidad de asignación; otras modalidades requieren definición de alcance. |
| Habilitación por agenda | Configuración que determina si un profesional ofrece una práctica en una agenda, con duración, condiciones y vigencia propias. Crear la práctica no habilita todas las agendas. |
| Duración de atención | Tiempo previsto de prestación, establecido por personal con facultad para el profesional y la agenda correspondientes. |
| Pausa de preparación o cierre | Tiempo adicional reservado antes o después de la atención cuando la configuración lo exige. |
| Recurso | Medio necesario para atender, como un consultorio, sillón o equipo. El alcance concreto de su control de disponibilidad está pendiente de validación. |
| Vigencia | Período durante el cual una configuración, permiso o convenio puede aplicarse. |
| Versión de configuración | Identificación de las condiciones aplicadas a una reserva. Permite preservar el criterio usado aunque después se modifique la práctica. |
| Desactivación de práctica | Retiro de una práctica de nuevas asignaciones en el ámbito definido, preservando los turnos existentes y su historia. El procedimiento detallado se propone en el catálogo. |

## Agenda y ciclo del turno

Referencia: R02, R03, R06 y R08.

| Término | Definición y límite |
| --- | --- |
| Agenda | Organización de atención de un profesional en una entidad y sede, con horarios, prácticas y permisos propios. |
| Disponibilidad | Intervalos que pueden ofrecerse después de considerar horarios, excepciones, ocupación, práctica y condiciones aplicables. Verlos no los reserva. |
| Excepción de agenda | Cambio puntual a la disponibilidad habitual, como una ausencia o un bloqueo. No cancela por sí solo turnos existentes. |
| Intervalo | Tramo temporal con inicio y fin utilizado para calcular atención y ocupación. |
| Capacidad u ocupación efectiva | Recursos y tiempo comprometidos por una pre-reserva o turno; contempla pausas configuradas. |
| Solapamiento incompatible | Coincidencia temporal que impide asignar dos ocupaciones según las reglas del profesional o recurso. |
| Pre-reserva | Bloqueo breve y persistido de capacidad mientras se completa el pedido de turno. Tiene vencimiento; su duración exacta sigue pendiente. |
| Turno registrado | Cita guardada que conserva capacidad y queda inicialmente pendiente de confirmar asistencia. Puede haber sido registrada por paciente, representante o personal autorizado. |
| Confirmación de asistencia | Acción explícita válida que expresa la intención de asistir a un turno registrado. No crea una segunda reserva ni acredita llegada. |
| Reprogramación | Cambio autorizado de horario que conserva historia y mantiene el turno anterior si el cambio falla. Las prácticas de gestión del personal conservan esa restricción. |
| Cancelación | Transición autorizada que deja sin efecto el turno y libera su ocupación, conservando motivo e historia. |
| Llegada o presente | Registro de que el paciente se presentó según la política operativa. Es distinto de confirmar asistencia. |
| En atención, atendido y ausente | Estados del ciclo operativo para indicar inicio, finalización o inasistencia. Sus transiciones y ventanas exactas se detallarán en la etapa correspondiente. |
| Cuota de turnos futuros | Límite de acumulación de turnos activos, incluidos los confirmados. Sus valores y excepciones están pendientes. |

## Coberturas y elegibilidad

Referencia: R07.

| Término | Definición y límite |
| --- | --- |
| Entidad de cobertura médica | Obra social, prepaga u organización similar. Se distingue de la entidad cliente del sistema. |
| Plan de cobertura | Producto o nivel de cobertura ofrecido por una entidad de cobertura médica. |
| Cobertura declarada | Información aportada sobre la afiliación del paciente, todavía diferenciada de su verificación. |
| Afiliación verificada | Comprobación administrativa de la relación del paciente con una cobertura. Su procedimiento y evidencia deben definirse. |
| Convenio de atención | Configuración que determina compatibilidad de cobertura y plan con profesional, agenda, práctica, entidad y vigencia. |
| Elegibilidad administrativa | Resultado de revisar las condiciones para asignar un turno: elegible, incompatible o requiere revisión. No es una evaluación clínica. |
| Autorización de cobertura para una práctica | Aprobación específica exigida por la cobertura cuando corresponda. No equivale a afiliación ni a permiso de acceso al sistema. |
| Atención particular | Atención bajo condiciones particulares habilitadas y elegidas por el paciente. No se asigna automáticamente ante una cobertura incompatible. |

## Portal, comunicaciones y trazabilidad

Referencia: R08, R11, R11.a y R12.

| Término | Definición y límite |
| --- | --- |
| Portal del paciente | Espacio privado para acciones sobre recursos propios autorizados, como turnos, confirmación y chat. |
| Autogestión | Acciones que realiza paciente o representante habilitado dentro de sus facultades. La elección de horarios se limita a la práctica «Consulta» elegible. |
| Chat humano | Conversación paciente-profesional con participantes autorizados. El texto no modifica automáticamente turnos ni concede permisos. |
| Solicitud de gestión | Pedido al personal para resolver una asignación o cambio. Un mensaje por sí solo no bloquea capacidad. |
| Notificación interna | Aviso persistido en la plataforma para destinatarios autorizados. Se distingue de correo y WhatsApp. |
| Solicitud de confirmación | Aviso que pide una acción explícita de asistencia: un correo entre T-72 y T-48, con respaldo WhatsApp a T-36 si corresponde. |
| T-72, T-48, T-36 y T-24 | Cantidad de horas anteriores al inicio vigente del turno. A T-24 rige el cierre por falta de confirmación, con excepciones operativas por concretar. |
| Excepción asistida o técnica | Tratamiento explícito de situaciones que requieren intervención humana o revisión de fallos, con motivo y trazabilidad. Sus reglas concretas están pendientes. |
| Auditoría | Registro restringido de actor, contexto, acción, fecha, resultado y cambios relevantes. No implica copiar indiscriminadamente mensajes o credenciales. |
| Historial del turno | Secuencia de eventos y condiciones aplicadas que permite reconstruir sus cambios. |
| Aislamiento por entidad | Separación de datos y permisos que impide acceder a recursos de otra entidad sin autorización. |
| Catálogo público de profesionales | Directorio futuro de profesionales publicables. Es diferente del catálogo de prácticas de la beta. |
| Suscripción comercial | Contratación del servicio SaaS y sus condiciones económicas. Su motor se difiere a I2/I3 y no equivale a membresía de usuario. |

## Ejemplos de uso consistente

- Una paciente puede tener ficha en una clínica sin cuenta; secretaría registra su turno como actor.
- Un representante puede confirmar por un menor cuando tiene esa facultad verificada; el paciente atendido sigue siendo el menor.
- La práctica «Consulta» habilitada permite elegir horario en portal. La limpieza se gestiona por personal aunque su duración resulte breve.
- Añadir una práctica personalizada no la activa en otras agendas y siempre requiere personal autorizado para asignar o reprogramar su horario, aunque su nombre o clasificación sea «Consulta».
- Una misma persona atendida por dos profesionales puede tener números diferentes dentro de la misma entidad sin duplicar su ficha.

## Mantenimiento

Cambiar definiciones junto con las reglas afectadas, mantener las referencias R01-R12 y registrar decisiones nuevas en ADR. Este glosario no fija duraciones, cuotas, aranceles, facultades de representación ni reglas clínicas pendientes.
