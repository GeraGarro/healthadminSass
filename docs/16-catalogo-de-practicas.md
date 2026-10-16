# Catálogo de prácticas y personalización

Fecha: 15 de octubre de 2026. Versión: 1.1. Incremento 1, etapa de dominio y alcance. Referencias: R02, R04, R06, R07, R12 y [ADR-009](arquitectura/adr/009-catalogo-inicial-y-personalizacion.md).

## Estado de las definiciones

**Confirmado por el responsable:** prácticas comunes iniciales consulta, extracción, limpieza y cirugía; posibilidad de conceder la facultad de añadir prácticas personalizadas.

**Aclaración confirmada del responsable:** el paciente o representante habilitado elige horarios exclusivamente para la práctica específica **«Consulta»**, cuando esté habilitada en la agenda y cumpla las condiciones. Extracción, limpieza, cirugía y todas las prácticas personalizadas, también si se llaman o clasifican como consulta, requieren personal autorizado para asignación y reprogramación. Configuración por profesional/agenda y aislamiento por entidad. Los cambios conservan las reglas aplicadas a los turnos existentes.

**Propuesta para revisión:** campos detallados, códigos locales, estados de catálogo, permisos desglosados, versiones y resolución de duplicados que se describen abajo. No se presentan como nuevas decisiones ya aceptadas. Duraciones, pausas, sedes, recursos y coberturas reales siguen pendientes.

## Catálogo inicial

Los códigos son referencias documentales propuestas, no nomencladores odontológicos ni códigos de facturación. La aplicación deberá permitir añadir otras prácticas sin cambiar su código fuente. La carga de estas cuatro no implica habilitación automática de agendas.

| Referencia propuesta | Nombre | Tipo administrativo | Elección de horario por paciente | Asignación y reprogramación | Tiempos y condiciones |
| --- | --- | --- | --- | --- | --- |
| PRA-001 | Consulta | Consulta | Posible solo con habilitación de portal, admisión y condiciones válidas, sin gestión obligatoria del personal | Paciente/representante elegible o personal autorizado | Duración, pausas, modalidad, cobertura, sede y recursos por validar |
| PRA-002 | Extracción | Otra práctica | No | Personal autorizado | Duración, variantes y condiciones por validar |
| PRA-003 | Limpieza | Otra práctica | No | Personal autorizado | Duración, denominación específica y condiciones por validar |
| PRA-004 | Cirugía | Otra práctica | No | Personal autorizado | Duración, variantes y condiciones por validar |

No se fija una duración estándar para ninguna fila. El permiso de elección de horario se limita a la identidad de la práctica base «Consulta» y no se deduce del nombre, tipo o duración. La clasificación es administrativa; no determina complejidad clínica ni aptitud para atender a un paciente.

Se propone identificar la práctica base «Consulta» mediante una referencia estable por entidad que no pueda concederse a una práctica personalizada desde la edición del catálogo. PRA-001 es solo su referencia documental: el identificador y sus restricciones se diseñarán al modelar. Renombrar otra práctica como «Consulta», duplicarla o cambiar su tipo no la convierte en la práctica base elegible.

## Modelo funcional propuesto

Separar dos componentes:

1. **Definición en el catálogo de la entidad:** identifica y describe la práctica, su clasificación y su estado.
2. **Habilitación por profesional y agenda:** determina si se ofrece allí y bajo qué duración, pausas, sede, recursos, cobertura y modalidad de asignación.

La entidad A no modifica prácticas ni habilitaciones de B. Un profesional que trabaja en ambas usa los ámbitos autorizados por separado. Crear una definición no la activa para otros profesionales o agendas. La identidad profesional global únicamente coordina conflictos de capacidad conforme a R03.

### Ficha de definición

| Campo | Regla propuesta |
| --- | --- |
| Identificador interno | Estable y no editable por el usuario. |
| Entidad propietaria | Obligatoria, resuelta y validada en servidor. |
| Código local | Único dentro de la entidad y conservado para la trazabilidad; formato técnico definitivo por diseñar. |
| Nombre | Obligatorio, legible y sin espacios vacíos como contenido. |
| Descripción administrativa | Opcional; explica qué opción se agenda sin almacenar información clínica individual del paciente. |
| Origen | Inicial o personalizada; no altera requisitos de seguridad. |
| Tipo | Clasificación administrativa; no concede facultades de elección de horario. Sin clasificar no puede habilitarse para asignación. |
| Identidad de práctica base «Consulta» | Referencia estable propuesta, reservada a esa práctica inicial. Una práctica personalizada no puede recibirla mediante creación, copia, renombrado o reclasificación. |
| Estado | Borrador, activa o inactiva, según el ciclo propuesto. |
| Versión y auditoría | Autor real, fecha, motivo y cambios; referencias a habilitaciones y turnos que deben revisarse. |

### Ficha de habilitación por agenda

| Campo | Regla propuesta |
| --- | --- |
| Práctica y versión | Deben pertenecer a la entidad y estar vigentes. |
| Profesional, agenda y sede | Relación autorizada dentro de la misma entidad; sin activación implícita de otras agendas. |
| Duración de atención | Minutos positivos, validados por el profesional. No asumir un valor universal. |
| Preparación y cierre | Minutos no negativos, definidos explícitamente aunque sean cero. |
| Modalidad de atención | Configurada para el piloto. Una nueva modalidad no amplía por sí sola el alcance del producto. |
| Recursos necesarios | Identificación de lo que se requiere; si no hay adicionales, indicarlo expresamente. Su control automático depende del alcance validado de recursos. |
| Asignación | Personal autorizado para todas las prácticas; elección por paciente/representante solo para la práctica base «Consulta» habilitada. |
| Habilitada para elegir horario en portal | Indicador independiente, permitido únicamente para la identidad de la práctica base «Consulta», sin gestión obligatoria del personal. No limita la visualización o confirmación de turnos propios de otras prácticas. |
| Gestión obligatoria del personal | Impide elegir horario por paciente, incluso para una oferta de la práctica base «Consulta». Siempre se aplica a las otras prácticas y a todas las personalizadas. |
| Cobertura y condiciones | Particular cuando se habilite, convenios aplicables, vigencia y casos que requieren revisión. No equivale a autorización externa de la prestación. |
| Vigencia y estado | Delimitan cuándo puede ofrecerse la práctica. |
| Auditoría y versión | Conservan autor, fechas, motivo y condiciones aplicadas. |

Antes de activar una oferta se debe resolver si los tiempos de pausa comprometen solo al profesional o también a otros recursos. El servidor calcula la ocupación según esa configuración validada; no la toma del formulario del paciente.

## Facultad de añadir y administrar prácticas

La capacidad de personalizar forma parte del requisito confirmado. Se propone separar las facultades para evitar que reservar un turno implique poder cambiar su duración o su clasificación. Los nombres siguientes identifican acciones funcionales; no son un contrato API definitivo.

| Acción propuesta | Profesional | Secretaría | Paciente o representante |
| --- | --- | --- | --- |
| Crear práctica personalizada en la entidad | Con permiso explícito de catálogo en esa entidad | Con permiso explícito de catálogo en esa entidad | No |
| Editar definición, clasificación o estado de catálogo | Con permiso específico y revisión del impacto sobre otras habilitaciones | Con permiso específico y revisión del impacto; el rol de secretaría solo no basta | No |
| Configurar duración, pausas y condiciones de una oferta | En agenda propia con facultad vigente | Membresía y delegación de esa agenda para esa acción | No |
| Habilitar o retirar oferta de una agenda | En agenda propia con facultad específica | Membresía y delegación específica de esa agenda | No |
| Habilitar elección de horario en portal para la práctica base «Consulta» | Con facultad específica sobre su agenda y validaciones de R06; no puede extenderlo a otra práctica | Solo con delegación para esa acción y validaciones de R06; no puede extenderlo a otra práctica | No |
| Registrar o reprogramar otras prácticas | En agenda propia autorizada | Con facultad de reserva/reprogramación y delegación vigente | Solicitar gestión; no elegir ni bloquear horario |
| Elegir horario de la práctica base «Consulta» en portal | Según su actuación autorizada | Según delegación | Solo con acceso y representación vigentes, oferta de esa práctica habilitada y reglas satisfechas |
| Otorgar o revocar delegación de agenda | Profesional otorgante dentro de su ámbito | No por recibir la delegación; sin subdelegación implícita | No |

**Concesión pendiente:** definir quién otorga el permiso de catálogo de entidad. La administración de entidad o plataforma no lo obtiene automáticamente por el nombre de su rol. La delegación de una agenda no permite por sí sola editar una definición compartida por toda la entidad.

Para cambiar una definición utilizada por varias agendas se propone crear una nueva versión y revisar las habilitaciones afectadas. Tener facultad sobre catálogo no concede facultad para modificar silenciosamente las condiciones de otra agenda. Las nuevas facultades requieren validación en servidor y revocación efectiva con pantalla abierta.

## Flujo de alta personalizada propuesto

1. El actor ingresa en su entidad; el servidor comprueba facultad de creación de catálogo vigente.
2. Registra nombre, descripción, tipo y código local según la política acordada. La práctica se crea como borrador y no ocupa capacidad.
3. Se revisan posibles duplicados dentro de la entidad. Se propone normalizar espacios y mayúsculas para avisar coincidencias, sin fusionar automáticamente variantes.
4. Un actor con facultad de catálogo activa la definición cuando está completa.
5. El profesional o personal delegado configura la habilitación de una agenda: duración, pausas, condiciones, recursos y vigencia.
6. Se habilita esa oferta completa exclusivamente para asignación por personal autorizado. Una práctica personalizada nunca admite elección de horario por paciente, aunque su nombre o tipo sea consulta.
7. Se conserva auditoría de creación, configuración y activación. La oferta solo aparece a actores autorizados.

**Ejemplo ilustrativo:** añadir «Práctica personalizada A» genera una nueva definición y luego una oferta específica. Su horario siempre lo asigna y reprograma personal autorizado. Nombrarla «Consulta de control» o clasificarla como consulta no permite al paciente elegir horario. El paciente conserva visualización y confirmación de sus turnos según facultades.

## Estados y cambios propuestos

| Objeto | Estados o transición | Efecto |
| --- | --- | --- |
| Definición | Borrador → activa | Puede utilizarse para habilitaciones completas; no activa agendas automáticamente. |
| Definición | Activa → inactiva | Impide nuevas asignaciones en todas sus ofertas de esa entidad; exige revisar impacto y notificar internamente a responsables afectados. |
| Definición | Inactiva → activa | Requiere revalidar sus condiciones; no reactiva automáticamente ofertas retiradas. |
| Oferta en agenda | Borrador → habilitada | Solo tras completar y validar su configuración. |
| Oferta en agenda | Habilitada → deshabilitada | Impide nuevas asignaciones en esa agenda, preservando turnos registrados. |
| Oferta en agenda | Deshabilitada → habilitada | Requiere permisos y validación actual de la configuración. |

Se propone conservar las definiciones mediante desactivación, sin borrado físico desde la operación del catálogo. La conservación o eliminación de datos personales pertenece a su política propia.

Una modificación genera nueva versión de las condiciones relevantes. Los turnos existentes conservan referencia de práctica, nombre aplicado, duración, pausas, cobertura y regla de asignación usadas. Si un cambio exige revisar un turno, se genera gestión explícita: no se cambia su horario, duración ni estado automáticamente.

Si se renombra una práctica, su identificador estable mantiene la relación histórica. Al reprogramar se comprueban permisos y condiciones vigentes; si la operación falla, se conserva la reserva anterior. La política de excepción para reprogramar una oferta retirada queda pendiente; hasta definirla no se admite una nueva asignación sobre una oferta inhabilitada.

## Reglas verificables del catálogo

| ID | Regla | Base |
| --- | --- | --- |
| CAT-01 | El catálogo admite consulta, extracción, limpieza y cirugía y permite añadir más prácticas sin cambiar el código fuente. | Requerimiento confirmado |
| CAT-02 | Crear y administrar exige facultad explícita y ámbito de entidad válido. | Requerimiento de facultad; desglose propuesto |
| CAT-03 | Una práctica creada no se ofrece automáticamente en todas las agendas. | Desarrollo de R04/R06; modelo propuesto |
| CAT-04 | Paciente o representante solo elige horario para la práctica base «Consulta», habilitada y sin gestión obligatoria del personal. La identidad se valida en servidor; nombre, tipo o duración no conceden ese permiso a otra práctica. | Aclaración confirmada; R02/R06 |
| CAT-05 | Extracción, limpieza, cirugía y todas las prácticas personalizadas se asignan y reprograman por personal autorizado, aunque se llamen o clasifiquen como consulta. Ningún permiso de catálogo amplía la autoselección a otra práctica. | Aclaración confirmada; R06 |
| CAT-06 | Tiempos y reglas se calculan en servidor y se revalidan al pre-reservar, completar y reprogramar. | R02/R06 vigentes |
| CAT-07 | Práctica u oferta incompleta, inactiva o no vigente no admite nuevas asignaciones. | Propuesta de ciclo de catálogo |
| CAT-08 | Cambiar o retirar una práctica preserva turnos e historia; cambios que los afecten exigen gestión explícita. | R06/R12; versiones propuestas |
| CAT-09 | Cobertura incompatible se detecta antes de bloquear y se revalida al completar; la revisión no se trata como autorización automática. | R07 vigente |
| CAT-10 | Permisos, delegaciones, definiciones y ofertas se aíslan por entidad y se revalidan con sesión abierta. | R01/R04 vigentes |
| CAT-11 | Crear, cambiar, clasificar, habilitar y retirar deja autor, ámbito, fecha, motivo y resultado auditables. | R12; eventos detallados propuestos |
| CAT-12 | Reintentos de alta o configuración no deben duplicar prácticas u ofertas por una misma operación; el mecanismo se diseñará al implementar. | Aplicación propuesta de idempotencia al catálogo |

## Historias y criterios de aceptación

Los siguientes escenarios se ejecutarán cuando exista aplicación. Constituyen especificación de comportamiento, no resultados de pruebas realizadas.

| Historia | Escenario de aceptación |
| --- | --- |
| HC-01. Disponer de la base inicial | Dada una entidad del piloto, al preparar su catálogo se pueden registrar las cuatro prácticas iniciales con referencias propias, sin ofrecer horarios mientras falte configuración. |
| HC-02. Añadir una personalizada | Dado un actor con permiso de catálogo, cuando crea una nueva práctica válida, queda en su entidad, auditada y sin habilitar automáticamente agendas. Un actor sin permiso recibe rechazo sin cambios. |
| HC-03. Controlar duplicados y reintentos | Repetir la misma operación no crea dos registros. Un nombre posiblemente duplicado advierte dentro de la entidad sin fusionar ni revelar catálogos ajenos; la política final se valida en P05. |
| HC-04. Configurar por agenda | La misma práctica puede tener duraciones distintas en dos ofertas autorizadas. Una secretaría delegada en A no modifica B sin su delegación y facultad correspondientes. |
| HC-05. Ofrecer la práctica base «Consulta» | Paciente activo o representante facultado puede elegir y pre-reservar horario solo para la identidad de esa práctica, con oferta completa y habilitada, disponibilidad, cobertura, cuotas y demás condiciones válidas. |
| HC-06. Impedir elusión | Intentar elegir horario de limpieza, extracción, cirugía o cualquier personalizada se rechaza sin ocupar capacidad, también por API, cambio de nombre a «Consulta», tipo consulta, copia de PRA-001, duración corta, habilitación indebida de portal, formulario antiguo o reprogramación. |
| HC-07. Asignar desde personal | Personal con facultad registra una extracción en su agenda autorizada bajo disponibilidad y elegibilidad válidas. El paciente puede consultarla y confirmar asistencia según sus facultades. |
| HC-08. Preservar turnos al cambiar | Al modificar duración o nombre, el turno previo conserva las condiciones registradas. Nuevos turnos usan la configuración validada correspondiente. |
| HC-09. Retirar una oferta | Al deshabilitar limpieza en una agenda, deja de admitir nuevas asignaciones allí; otras ofertas habilitadas permanecen según su configuración y los turnos previos conservan historia. |
| HC-10. Revocar y aislar | Una facultad revocada impide el siguiente intento incluso con pantalla abierta. Usar un ID de otra entidad para leer o modificar catálogo u oferta se rechaza. |
| HC-11. Validar cambios concurrentes | Si una oferta se retira o cambia mientras se completa una pre-reserva, el servidor revalida y aplica una sola transición coherente; no registra condiciones obsoletas ni deja capacidad retenida indebidamente. El detalle de resolución se diseñará con R02/R03. |
| HC-12. Mantener controles generales | Una práctica personalizada respeta exclusión del profesional entre entidades, convenio, cuotas, confirmación y trazabilidad igual que las prácticas iniciales. |

## Datos del piloto por completar

| Práctica | Profesional / agenda / sede | Atención y pausas | Recursos / modalidad | Cobertura / condiciones | Oferta validada por |
| --- | --- | --- | --- | --- | --- |
| Consulta | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Extracción | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Limpieza | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Cirugía | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Cada personalizada añadida | Completar una fila por oferta | Por validar | Por validar | Por validar | Profesional responsable |

La plantilla se repite por cada oferta real; no basta una fila global si cambian profesional, agenda o condiciones. Antes de ofrecer horarios se completan y validan sus datos. El [alcance del ítem](15-alcance-y-cierre-del-item.md) registra los responsables y pendientes P01-P07.
