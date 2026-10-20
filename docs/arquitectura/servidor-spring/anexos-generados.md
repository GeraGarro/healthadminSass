# Anexos generados del manual Spring

Fuente: modelo E-R 1.1, matriz MP y casos de uso. Asignaciones y rutas propuestas por el manual.

## identity - 10 entidades

| Entidad | Ámbito | Propósito |
| --- | --- | --- |
| CUENTA | G | Identidad personal reutilizable, separada de la ficha y los roles. |
| IDENTIDAD_EXTERNA | G | Identidad estable del proveedor vinculada mediante verificación. |
| CREDENCIAL_LOCAL | G | Credencial protegida de una cuenta que admite contraseña. |
| SESION | G | Sesión y revocación independiente de membresías y habilitaciones. |
| FACTOR_MFA | G | Segundo factor administrativo y ciclo de revocación. |
| TOKEN_IDENTIDAD | G | Acción limitada de recuperación, contacto o invitación de identidad. |
| FACULTAD_PLATAFORMA | G | Concesión global acotada para incorporación y operación. |
| CANAL_IDENTIDAD | G | Remitente de plataforma para recuperar una cuenta sin contexto de entidad. |
| TAREA_IDENTIDAD | G | Trabajo persistido de recuperación o verificación de identidad. |
| ENVIO_IDENTIDAD | G | Intento técnico del correo de identidad con entrega y fallo. |

## organization - 15 entidades

| Entidad | Ámbito | Propósito |
| --- | --- | --- |
| ENTIDAD | G | Cliente y raíz del aislamiento, incluida actividad independiente. |
| SEDE | T | Lugar de atención dentro de una entidad. |
| MEMBRESIA | T | Pertenencia del equipo con vigencia local. |
| ROL | G | Definición de agrupaciones de facultades sin concederlas. |
| PERMISO | G | Acción autorizable y tipo de ámbito. |
| ROL_PERMISO | G | Descompone roles en acciones explícitas. |
| MEMBRESIA_ROL | T | Asignación múltiple de roles al miembro de la entidad. |
| MEMBRESIA_PERMISO | T | Facultades locales expresas adicionales y vigencia. |
| PROFESIONAL_GLOBAL | G | Identidad profesional verificada para coordinar capacidad. |
| PROFESIONAL_ENTIDAD | T | Vínculo profesional local, separado de la membresía de acceso. |
| SOLICITUD_ENTIDAD | G | Trámite de incorporación del solicitante y designación administrativa. |
| INVITACION_EQUIPO | T | Invitación personal al equipo con alcance predeterminado. |
| TRANSICION_PROFESIONAL | X | Operación administrativa excepcional entre origen y destino. |
| CORRESPONDENCIA_FICHAJE | X | Procedencia explícita de vínculos origen y destino durante continuidad. |
| PETICION_ELIMINACION | G | Petición expresa del profesional diferenciada de ejecución. |

## patient - 9 entidades

| Entidad | Ámbito | Propósito |
| --- | --- | --- |
| PACIENTE | T | Ficha administrativa local, exista o no cuenta. |
| CONTACTO_PACIENTE | T | Contacto administrativo que no otorga representación. |
| SOLICITUD_ADMISION | T | Solicitud protegida que nunca ocupa capacidad. |
| REPRESENTACION | T | Relación verificada entre representante y paciente. |
| REPRESENTACION_PERMISO | T | Facultad concreta de representación. |
| ACCESO_PACIENTE | T | Cuenta vinculada a ficha con admisión y activación verificadas. |
| ALCANCE_ACCESO | T | Contextos concretos autorizados del portal. |
| PACIENTE_PROFESIONAL | T | Relación numerada, independiente de agendas y cuenta. |
| CONTADOR_PACIENTE | T | Asignación transaccional por serie profesional y entidad. |

## scheduling - 31 entidades

| Entidad | Ámbito | Propósito |
| --- | --- | --- |
| AGENDA | T | Agenda de un vínculo profesional y sede. |
| DELEGACION_AGENDA | T | Autorización por persona y agenda otorgada por su profesional. |
| DELEGACION_PERMISO | T | Acciones específicas delegadas. |
| PRACTICA | T | Identidad estable de una práctica administrativa de la entidad. |
| VERSION_PRACTICA | T | Definición inmutable usada por las ofertas. |
| OFERTA | T | Habilitación de una práctica en una agenda concreta. |
| VERSION_OFERTA | T | Condiciones inmutables y vigencia de la oferta. |
| HORARIO_AGENDA | T | Disponibilidad semanal recurrente según zona de agenda. |
| EXCEPCION_AGENDA | T | Apertura o indisponibilidad puntual que no cancela turnos. |
| RECURSO | T | Recurso físico administrativo con disponibilidad a validar. |
| OFERTA_RECURSO | T | Recursos exigidos por una versión de oferta. |
| RESERVA_RECURSO | T | Ocupación física vinculada al mismo bloqueo profesional. |
| COBERTURA_MEDICA | T | Catálogo local de obras sociales y prepagas, separado del cliente SaaS. |
| PLAN_COBERTURA | T | Plan o producto de una cobertura médica local. |
| AFILIACION_PACIENTE | T | Cobertura declarada y verificación administrativa diferenciadas. |
| CONVENIO | T | Acuerdo aplicable a una oferta concreta, cobertura y plan. |
| VERSION_CONVENIO | T | Regla de cobertura inmutable que conserva vigencia y condiciones. |
| AUTORIZACION_COBERTURA | T | Constancia administrativa específica para una práctica. |
| EVALUACION_ELEGIBILIDAD | T | Resultado y regla aplicados antes de adquirir y completar una reserva. |
| OCUPACION_GLOBAL | G | Registro mínimo compartido para excluir intervalos del profesional. |
| PRE_RESERVA | T | Bloqueo persistido previo al registro del turno. |
| TURNO | T | Identidad estable de una cita registrada para un paciente. |
| VERSION_TURNO | T | Condiciones y horario históricos inmutables por registro o cambio. |
| CONFIRMACION_ASISTENCIA | T | Acción explícita sobre una versión determinada. |
| EVENTO_TURNO | T | Historia cronológica de cambios, llegada, atención y cancelación. |
| IDEMPOTENCIA | T | Resultado de una operación repetible y su huella de entrada. |
| LOTE_REPROGRAMACION | T | Operación del profesional por ausencia en agendas autorizadas. |
| INTERVALO_LOTE | T | Uno o más tramos afectados y agenda local. |
| TURNO_AFECTADO | T | Seguimiento separado del aviso y del reemplazo. |
| SOLICITUD_GESTION | T | Pedido humano sin selección ni bloqueo de horarios. |
| TOKEN_TURNO | T | Token de acción limitado a una versión y destinatario autorizado. |

## communication - 14 entidades

| Entidad | Ámbito | Propósito |
| --- | --- | --- |
| CANAL_ENTIDAD | T | Remitente y cuenta de proveedor verificados por entidad. |
| DESTINO_AVISO | T | Contacto autorizado para un paciente y propósito. |
| PRESUPUESTO_CANAL | T | Límite técnico de consumo y continuidad operativa. |
| CONSUMO_CANAL | T | Costo técnico estimado o conciliado por intento. |
| TAREA_PERSISTIDA | T | Trabajo diferido recuperable, consistente con la operación de origen. |
| AVISO_EXTERNO | T | Mensaje lógico individual, separado de cada intento del proveedor. |
| INTENTO_ENVIO | T | Ejecución técnica del mensaje y correlación externa. |
| EVENTO_PROVEEDOR | T | Webhook autenticado, correlacionado y deduplicado. |
| AVISO_INTERNO | T | Aviso persistido a una cuenta autorizada, incluido cierre T-24. |
| CONVERSACION | T | Conversación de paciente y profesional dentro de una entidad. |
| PARTICIPANTE_CHAT | T | Participación vigente y verificable de una cuenta. |
| PARTICIPANTE_PERMISO | T | Facultades de lectura, envío o respuesta independientes de agenda. |
| MENSAJE | T | Texto humano persistido con autoría real. |
| LECTURA_MENSAJE | T | Lectura por participante, separada de atención o respuesta. |

## audit - 9 entidades

| Entidad | Ámbito | Propósito |
| --- | --- | --- |
| AUDITORIA_ENTIDAD | T | Registro cronológico restringido del actor real y contexto local. |
| AUDITORIA_GLOBAL | G | Identidad y operación global sin exposición a administradores locales. |
| POLITICA_OPERATIVA | T | Versión de parámetros de reserva, confirmación, cuotas y gasto. |
| EXCEPCION_POLITICA | T | Excepción asistida, temporal y motivada a una política. |
| CASO_ABUSO | T | Revisión humana de señales sin compartir listas entre entidades. |
| ACCESO_SOPORTE | T | Concesión excepcional temporal a recursos delimitados. |
| RESPALDO | G | Evidencia operativa protegida del backup, sin credenciales ni fichas. |
| ENSAYO_RESTAURACION | G | Evidencia de recuperación en entorno separado. |
| INCIDENTE | G | Coordinación técnica de contención y recuperación. |

## Casos de uso y API propuesta

### CU-01. Solicitar admisión

POST /public/admissions

Módulo: patient. Actor original: Solicitante. Referencias: R09.a; D14-D15. MP: sin fila específica; aplicar facultad/operación técnica. Condición: Formulario protegido; no concede acceso.

### CU-02. Resolver admisión o habilitar conocido

POST /admissions/{id}/decisions

Módulo: patient. Actor original: Personal con facultad de admisión. Referencias: R09-R09.a; D08, D14. MP: MP-02. Condición: Facultad de admisión; no delegación de agenda.

### CU-03. Activar acceso y vincular cuenta

POST /access-activations

Módulo: patient + identity. Actor original: Paciente, representante. Referencias: R09.a; D14. MP: MP-01, MP-06. Condición: Token limitado y aprobación vigente.

### CU-04. Ingresar y seleccionar contexto

POST /auth/login; GET /me/contexts

Módulo: identity. Actor original: Usuarios. Referencias: R04, R09.a, R10; D14, D16. MP: MP-01. Condición: Sesión; contexto no concede facultades.

### CU-05. Recuperar contraseña del equipo

POST /auth/recovery; POST /auth/reset

Módulo: identity. Actor original: Equipo y administradores. Referencias: R10.a; ADR-012; D14, D16. MP: MP-05, MP-06. Condición: Equipo; token un solo uso; no enumera cuentas.

### CU-06. Gestionar representación

POST /patients/{id}/representations

Módulo: patient. Actor original: Personal con facultad específica. Referencias: R09; D08. MP: MP-03. Condición: Evidencia y facultades pendientes D08.

### CU-07. Incorporar entidad y equipo a beta

POST /platform/entities; POST /team-invitations

Módulo: organization. Actor original: Plataforma, administración local. Referencias: R01, R10; D03, D14. MP: MP-35, MP-36. Condición: Alta controlada; facultades específicas.

### CU-08. Otorgar o revocar delegación

POST /agendas/{id}/delegations; POST /delegations/{id}/revocation

Módulo: scheduling.agenda. Actor original: Profesional. Referencias: R04; D03. MP: MP-24. Condición: Profesional otorgante; acción y vigencia.

### CU-09. Administrar ficha y vínculo numerado

POST /patients; POST /patients/{id}/professional-links

Módulo: patient. Actor original: Personal autorizado. Referencias: R01.a, R09; D08, D12, D14; docs/18. MP: MP-07, MP-08, MP-09, MP-11. Condición: Número estable y contador atómico.

### CU-10. Administrar catálogo de prácticas

POST /practices; POST /practices/{id}/versions

Módulo: scheduling.catalog. Actor original: Titular de facultad de catálogo. Referencias: R06; D05; CAT-01..12, HC-01..12. MP: MP-28, MP-29. Condición: Facultad de catálogo todavía por asignar.

### CU-11. Configurar agenda y oferta

POST /agendas; POST /agendas/{id}/offers

Módulo: scheduling.agenda. Actor original: Profesional, secretaría delegada. Referencias: R04, R06; D02, D03, D05. MP: MP-22, MP-23, MP-30. Condición: Profesional/delegado; tiempos por validar.

### CU-12. Configurar convenios de cobertura

POST /agreements; POST /agreements/{id}/versions

Módulo: scheduling.coverage. Actor original: Profesional, personal facultado. Referencias: R07; D06. MP: MP-10. Condición: Facultad y reglas locales de cobertura.

### CU-13. Consultar disponibilidad elegible

GET /availability

Módulo: scheduling. Actor original: Paciente, representante, personal. Referencias: R02-R03, R06-R07; D02, D05-D06. MP: MP-13, MP-45. Condición: Solo oferta elegible; no ocupa.

### CU-14. Reservar Consulta por portal

POST /holds; POST /appointments

Módulo: scheduling.booking. Actor original: Paciente, representante. Referencias: R02-R03, R06-R09; D01, D07, D15. MP: MP-14. Condición: Paciente/representante solo Consulta.

### CU-15. Registrar turno desde personal

POST /holds; POST /appointments

Módulo: scheduling.booking. Actor original: Profesional, secretaría delegada. Referencias: R02-R04, R06-R09; D01, D03, D07. MP: MP-14, MP-15. Condición: Personal con permiso; misma capacidad.

### CU-16. Solicitar gestión de otra práctica

POST /management-requests

Módulo: scheduling.rescheduling. Actor original: Paciente, representante. Referencias: R06, R11.a; D13. MP: MP-16. Condición: Sin elegir intervalo ni ocupar capacidad.

### CU-17. Consultar turnos e historial autorizado

GET /appointments; GET /appointments/{id}/history

Módulo: scheduling. Actor original: Paciente, representante, personal. Referencias: R04, R09, R12; D03, D08. MP: MP-12. Condición: Alcance por paciente/agenda.

### CU-18. Confirmar asistencia

POST /appointments/{id}/attendance-confirmations

Módulo: scheduling.attendance. Actor original: Paciente, representante, personal facultado. Referencias: R08-R09; D07-D08. MP: MP-17, MP-18. Condición: Acción explícita; token/sesión acotados.

### CU-19. Cancelar turno

POST /appointments/{id}/cancellations

Módulo: scheduling.booking. Actor original: Paciente, representante, personal facultado. Referencias: R03, R06, R08; D07. MP: MP-19. Condición: Política; liberar una sola vez.

### CU-20. Reprogramar turno individual

POST /appointments/{id}/reschedules

Módulo: scheduling.rescheduling. Actor original: Paciente, representante, personal facultado. Referencias: R02-R03, R06-R08; D01, D07. MP: MP-20, MP-21. Condición: Mover atómicamente; Consulta en portal.

### CU-21. Gestionar reprogramación del profesional

POST /rescheduling-batches

Módulo: scheduling.rescheduling. Actor original: Profesional, personal facultado. Referencias: R11.b; ADR-013; D07, D09. MP: MP-27. Condición: WhatsApp a todos los afectados; D07/D09.

### CU-22. Registrar llegada y jornada de atención

POST /appointments/{id}/arrival; POST /appointments/{id}/journey-events

Módulo: scheduling.attendance. Actor original: Profesional, secretaría delegada. Referencias: R04, R08, R12; transiciones pendientes. MP: MP-25, MP-26. Condición: Transiciones/titulares pendientes; sin estado libre.

### CU-23. Intercambiar consultas por chat

GET/POST /conversations/{id}/messages

Módulo: communication.chat. Actor original: Paciente, representante, profesional. Referencias: R11.a; D08, D13, D15. MP: MP-31, MP-32. Condición: Participante con facultad; separado de agenda.

### CU-24. Ejecutar avisos de confirmación

INTERNO: procesar planes de confirmación

Módulo: scheduling + communication. Actor original: Disparador interno; correo, WhatsApp y destinatarios. Referencias: R08, R11; D07, D09. MP: sin fila específica; aplicar facultad/operación técnica. Condición: Sin ruta pública de cron.

### CU-25. Cerrar turno sin confirmación a T-24

INTERNO: cerrar no confirmado

Módulo: scheduling.attendance. Actor original: Disparador interno; personal destinatario. Referencias: R08, R12; D07. MP: MP-33. Condición: Lock y política T-24; aviso interno durable.

### CU-26. Resolver avisos fallidos y gestiones pendientes

GET /work-items; POST /work-items/{id}/resolutions

Módulo: communication.inbox. Actor original: Personal facultado, soporte acotado. Referencias: R08, R11-R11.b; D07, D09. MP: MP-33, MP-34, MP-44. Condición: Facultad y seguimiento; no acceso general.

### CU-27. Revisar abuso y excepciones

GET /abuse-cases; POST /abuse-cases/{id}/decisions

Módulo: audit.abuse. Actor original: Revisor con facultad específica. Referencias: R02.a; D15. MP: MP-43. Condición: Revisión/excepción auditada; D15.

### CU-28. Suspender o revocar acceso local

POST /access-grants/{id}/revocation

Módulo: patient + organization. Actor original: Administración facultada. Referencias: R04, R09.a, R10; D03, D14. MP: MP-04. Condición: Distinguir admisión, membresía y delegación.

### CU-29. Dar baja institucional al profesional

POST /professionals/{id}/institutional-exits

Módulo: organization. Actor original: Administrador local facultado. Referencias: R05, R10; ADR-011; D04. MP: MP-37, MP-41. Condición: Administrador local facultado; cuenta persiste.

### CU-30. Tramitar continuidad profesional

POST /platform/professional-transitions

Módulo: organization.transition. Actor original: Plataforma facultada, profesional. Referencias: R05, R10; ADR-011; D04, D12. MP: MP-38. Condición: D04/D12; deshabilitado hasta resolver modelo.

### CU-31. Tramitar eliminación solicitada por profesional

POST /account-deletion-requests

Módulo: organization + identity. Actor original: Profesional, ejecutor facultado. Referencias: R05, R10; ADR-011; D04. MP: MP-39, MP-40, MP-41. Condición: Solicitud expresa; ejecución separada pendiente.

### CU-32. Consultar auditoría y reportes básicos

POST /reports; GET /reports/{id}/download; GET /audit-events

Módulo: reporting + audit. Actor original: Usuario con facultad específica. Referencias: R12; S10; matriz y conservación pendientes. MP: MP-42. Condición: Ámbito/campos autorizados; revalidar descarga.

### CU-33. Respaldar y comprobar restauración

OPERACIÓN: respaldo y ensayo de restauración

Módulo: audit.operations. Actor original: Operador de infraestructura. Referencias: S11; D11, D16. MP: sin fila específica; aplicar facultad/operación técnica. Condición: Sin endpoint de paciente; credenciales separadas.

### CU-34. Contener incidente y recuperar operación

OPERACIÓN: runbook de incidente

Módulo: audit.operations. Actor original: Operador y plataforma facultados. Referencias: S01, S06, S10-S12; D16. MP: MP-44. Condición: Operador/plataforma facultados; evidencia.

### CU-35. Solicitar incorporación de entidad

PROPUESTO: POST /public/entity-requests

Módulo: organization.onboarding. Actor original: Solicitante, plataforma. Referencias: Propuesto en docs/20; D14. MP: sin fila específica; aplicar facultad/operación técnica. Condición: CU-35 no aprobado; deshabilitado.

### CU-36. Adquirir pre-reserva

SUBFUNCIÓN: POST /holds

Módulo: scheduling.booking. Actor original: Subfunción de CU-14/CU-15. Referencias: R02-R03, R06-R07; D01, D02, D15. MP: MP-14, MP-15, MP-45. Condición: Idempotencia, cuota y exclusión global.

### CU-37. Completar registro de turno

SUBFUNCIÓN: POST /appointments

Módulo: scheduling.booking. Actor original: Subfunción de CU-14/CU-15. Referencias: R02-R03, R06-R08, R11-R12; D01, D07. MP: MP-14, MP-15. Condición: Reutiliza ocupación y persiste plan.

## Matriz original

### MP-01. Activar acceso previamente aprobado e ingresar

Marcas: C / C / - / - / - / -

Paciente o representante: admisión vigente, activación y vinculación verificadas al contexto correcto. Google o correo no sustituyen esas comprobaciones. El equipo ingresa por su propia membresía y facultades, no por admisión de pacientes.

CU: CU-03, CU-04. Pendientes: D08, D14, D16. Fuentes: R09.a, DOC12.

### MP-02. Revisar solicitud y admitir al paciente conocido o nuevo

Marcas: X / X / F / ? / ? / -

Secretaría necesita facultad administrativa de admisión explícita. El permiso de agenda no basta. Quién concede esta facultad y su asignación a otros actores siguen pendientes. Nadie se autoaprueba como paciente o representante.

CU: CU-02. Pendientes: D08, D14. Fuentes: R09.a, DOC12.

### MP-03. Verificar, otorgar o revocar representación

Marcas: - / - / ? / ? / ? / -

La representación verificada y revocable está aceptada; responsable, evidencia y procedimiento concretos pendientes. Parentesco, contacto de emergencia o teléfono familiar no conceden acceso.

CU: CU-06. Pendientes: D08, D14. Fuentes: R09.

### MP-04. Suspender o revocar acceso local

Marcas: - / - / ? / ? / ? / ?

La capacidad de revocación por seguridad está aceptada; distribución operativa pendiente. Se aplica al ámbito afectado, incluso con sesión abierta; no borra cuenta ni cancela turnos automáticamente. Revocar una delegación de agenda se trata en MP-24.

CU: CU-28. Pendientes: D03, D14, D16. Fuentes: R09.a, R10, S.

### MP-05. Recuperar la contraseña propia por email (equipo)

Marcas: ? / ? / C / C / C / C

Confirmado para secretaría, profesionales y administradores, sobre su propia cuenta. No restituye permisos revocados. Método de acceso/recuperación del paciente y representante pendiente; no extender automáticamente el diseño del equipo. MFA y cuentas exclusivamente externas requieren tratamiento propio.

CU: CU-05. Pendientes: D14, D16. Fuentes: R10.a, ADR-012.

### MP-06. Conocer o establecer la contraseña de otro usuario

Marcas: X / X / X / X / X / X

El alta administrativa no permite manejar credenciales del paciente. La recuperación verificada permite al titular recuperar su cuenta; no es una facultad para leer o fijar contraseñas ajenas.

CU: CU-03, CU-05. Pendientes: -. Fuentes: R09.a, R10.a, DOC12.

### MP-07. Consultar ficha administrativa del paciente

Marcas: ? / ? / ? / ? / ? / -

La ficha administrativa y su aislamiento están aceptados. Asignación de lectores, campos, visibilidad del portal y alcance de cada facultad siguen en revisión; no conceder toda la población por un rol o por un vínculo numerado. Consultar turnos autorizados se distingue en MP-12.

CU: CU-09. Pendientes: D08, D12, D14. Fuentes: R01.a, R09, DOC18.

### MP-08. Crear o actualizar ficha y cobertura declarada

Marcas: ? / ? / ? / ? / ? / -

La gestión administrativa requiere facultad sobre la ficha y campos concretos; el desglose de edición por actor sigue propuesto. El registro de datos para admitir al conocido se distingue en MP-02 y no concede toda edición posterior. Una cobertura declarada no equivale a afiliación verificada ni a autorización de práctica.

CU: CU-09. Pendientes: D06, D08, D12, D14. Fuentes: R01.a, R07, DOC18.

### MP-09. Fusionar fichas o importar vínculos numerados

Marcas: - / - / ? / ? / ? / ?

Requiere permiso e historia; procedimiento y responsables pendientes. No fusionar por coincidencia de nombre, DNI, email o teléfono. La importación no habilita transferencia indiscriminada entre entidades.

CU: CU-09. Pendientes: D12, D14. Fuentes: R01.a, R09.

### MP-10. Configurar convenios de cobertura

Marcas: - / - / ? / C / ? / -

El profesional configura a qué beneficiarios atiende dentro de su ámbito. Planes, vigencias, excepciones y delegación a otros actores pendientes; no inferir este permiso del de duración o reserva.

CU: CU-12. Pendientes: D06. Fuentes: R07.

### MP-11. Renumerar o reutilizar un número confirmado

Marcas: X / X / X / X / X / X

La baja conserva el número del vínculo original y no desplaza posteriores. Reactivar conserva ese número. Correcciones/fusiones auditadas no conceden facultad general para renumerar ni reutilizar números.

CU: CU-09. Pendientes: -. Fuentes: R01.a.

### MP-12. Consultar turnos e historial autorizado

Marcas: C / C / D / C / - / -

Paciente: sus turnos, también los cargados por personal. Representante: solo el paciente y datos cubiertos por su facultad. Personal: agenda y recursos autorizados. El historial del turno no concede toda la ficha ni auditoría global.

CU: CU-17. Pendientes: D03, D08. Fuentes: R04, R06, R09, R12.

### MP-13. Consultar disponibilidad elegible

Marcas: C / C / D / C / - / -

En portal solo oferta elegible de la práctica base Consulta. Personal: ofertas de agendas autorizadas. Devuelve disponibilidad/conflicto sin paciente, entidad o turno ajenos; ver disponibilidad no ocupa capacidad.

CU: CU-13. Pendientes: D02, D05, D06. Fuentes: R02, R03, R06, R07.

### MP-14. Pre-reservar y registrar Consulta habilitada

Marcas: C / C / D / C / - / -

Identidad de la práctica base Consulta, oferta habilitada, ausencia de gestión obligatoria, elegibilidad, disponibilidad y cuotas. Paciente admitido y activado; representación vigente cuando aplique. Secretaría: acción de reserva delegada. Registro y confirmación de asistencia son hitos diferentes.

CU: CU-14, CU-15, CU-36, CU-37. Pendientes: D01, D05, D06, D15. Fuentes: R02, R03, R06, R09.a, ADR-009.

### MP-15. Elegir, pre-reservar y registrar otras prácticas

Marcas: X / X / D / C / - / -

Extracción, limpieza, cirugía y toda práctica personalizada: horario asignado por profesional o secretaría autorizada. Llamar o clasificar una personalizada como Consulta no amplía autogestión; tampoco una duración breve.

CU: CU-15, CU-36, CU-37. Pendientes: D01, D05, D06, D15. Fuentes: R02, R06, ADR-009.

### MP-16. Solicitar gestión de otra práctica sin elegir horario

Marcas: C / C / - / - / - / -

Paciente o representante autorizado pide atención al personal por el circuito habilitado. No bloquea capacidad, crea turno ni concede acceso automático a una conversación.

CU: CU-16. Pendientes: D08, D13, D15. Fuentes: R06, R11.a.

### MP-17. Confirmar asistencia propia o representada

Marcas: C / C / - / - / - / -

Turno vigente y confirmación explícita por actor autorizado. Representación con facultad específica. Entrega, lectura, clic, login o mensaje informal no confirman; un token de turno no abre ficha ni chat.

CU: CU-18. Pendientes: D07, D08. Fuentes: R08, R09.

### MP-18. Registrar confirmación asistida o telefónica

Marcas: - / - / F / ? / ? / -

Sigue vigente asistencia por secretaría, con autor, fecha y medio. Requiere acción autorizada sobre agenda/turno; consultar o reservar no la concede. Alcance de excepciones, otros responsables y tratamiento cerca de T-24 pendientes.

CU: CU-18. Pendientes: D03, D07. Fuentes: R08.

### MP-19. Cancelar turno con política vigente

Marcas: C / C / D / C / - / -

Paciente/representante: turno propio/autorizado de cualquier práctica, según facultades y política. Secretaría: delegación de cancelación. Plazo voluntario y excepciones pendientes; no usar T-24 de asistencia como plazo de cancelación.

CU: CU-19. Pendientes: D03, D07, D08. Fuentes: R04, R06, R08, R09.

### MP-20. Elegir nuevo horario para Consulta habilitada

Marcas: C / C / D / C / - / -

Reprogramación con facultad vigente, elegibilidad y oferta Consulta habilitada. Si el reemplazo falla se conserva el turno anterior. El enlace de aviso no sustituye comprobaciones; invalidar acciones del horario anterior cuando corresponda.

CU: CU-20. Pendientes: D01, D03, D07. Fuentes: R02, R04, R06, R08.

### MP-21. Elegir nuevo horario para otra práctica

Marcas: X / X / D / C / - / -

Lo gestiona personal autorizado, también tras un WhatsApp por ausencia del profesional. Paciente y representante pueden solicitar el cambio, pero no elegir ni bloquear el reemplazo.

CU: CU-20. Pendientes: D03, D07. Fuentes: R06, ADR-009, ADR-013.

### MP-22. Configurar disponibilidad y excepciones de agenda

Marcas: - / - / D / C / - / -

Profesional en agenda propia autorizada; secretaría con acción de configuración delegada. Un bloqueo por ausencia no cancela automáticamente los turnos ya existentes.

CU: CU-11. Pendientes: D02, D03, D05. Fuentes: R04, R05, R06.

### MP-23. Configurar duración de atención por práctica y agenda

Marcas: - / - / D / C / - / -

Facultad de duración separada de consultar, reservar y cancelar. Tiempos reales por validar; ampliar pausas, recursos y ciclo de oferta requiere revisión del detalle del catálogo. No cambia silenciosamente los turnos vigentes.

CU: CU-11. Pendientes: D03, D05. Fuentes: R04, R06.

### MP-24. Otorgar o revocar delegación de agenda

Marcas: - / - / X / C / - / -

Profesional otorgante sobre sus agendas y a una persona con membresía de la misma entidad, por acción y vigencia. Revocación efectiva en la siguiente operación aun con pantalla abierta. Recibir delegación no autoriza subdelegar; administración de entidad no sustituye al otorgante.

CU: CU-08. Pendientes: D03. Fuentes: R04, R05.

### MP-25. Registrar llegada del paciente

Marcas: - / - / D / C / - / -

Acción independiente de confirmar asistencia; secretaría requiere delegación específica. El profesional actúa en su agenda autorizada. Validar estados y transiciones antes de implementar.

CU: CU-22. Pendientes: D03, D07. Fuentes: R04, R08, R12.

### MP-26. Marcar en atención, atendido o ausente

Marcas: - / - / ? / ? / - / -

Estados administrativos contemplados; asignación detallada por estado y transición pendiente. No extender automáticamente la facultad de registrar llegada a todos los estados.

CU: CU-22. Pendientes: D03, D07. Fuentes: R08, R12, CU.

### MP-27. Iniciar gestión por ausencia o reprogramación del profesional

Marcas: - / - / ? / C / - / -

Profesional en sus agendas. Delegación específica para secretaría y operación por lote pendientes. Debe generar WhatsApp a todos los turnos vigentes afectados, incluidos confirmados; la ejecución del envío es una tarea acotada del sistema.

CU: CU-21. Pendientes: D03, D07, D09. Fuentes: R11.b, ADR-013.

### MP-28. Crear práctica personalizada de la entidad

Marcas: X / X / ? / ? / ? / -

Aprobada la posibilidad mediante facultad explícita. Quién concede esa facultad y su asignación a roles no están aprobados; documento 16 propone opciones. No equivale a facultad de agenda ni habilita elección por paciente.

CU: CU-10. Pendientes: D03, D05. Fuentes: R06, ADR-009, DOC16.

### MP-29. Editar, activar o desactivar definición compartida

Marcas: - / - / ? / ? / ? / -

Desglose de facultades y ciclo de catálogo propuestos para revisión. Definición de entidad distinta de oferta por agenda; el permiso de una agenda no alcanza para alterar todas las demás.

CU: CU-10. Pendientes: D03, D05. Fuentes: R06, DOC16.

### MP-30. Habilitar o retirar oferta y autoselección de Consulta

Marcas: - / - / ? / ? / - / -

Se exige oferta habilitada y acción autorizada. El desglose de permisos para habilitar/retirar y conceder portal sigue propuesto. Solo la práctica base Consulta puede admitir autoselección; ninguna facultad permite extenderla a las personalizadas.

CU: CU-11. Pendientes: D03, D05. Fuentes: R06, ADR-009, DOC16.

### MP-31. Leer y enviar mensajes en conversación autorizada

Marcas: C / C / ? / C / ? / -

Paciente y profesional participantes, dentro de la entidad y con facultades vigentes. Representante requiere permiso específico. Participación administrativa pendiente de diseño; delegación de agenda no concede lectura. No incluye IA, adjuntos ni llamadas.

CU: CU-23. Pendientes: D08, D13, D15. Fuentes: R09, R11.a, S.

### MP-32. Acceder al chat solo por delegación de agenda

Marcas: - / - / X / - / X / X

Ni secretaría ni administradores reciben lectura de chat por gestionar una agenda o por su cargo. Ser profesional de otra conversación tampoco concede acceso. Las facultades de conversación se verifican por separado.

CU: CU-23. Pendientes: -. Fuentes: R04, R11.a, S.

### MP-33. Recibir aviso interno sobre turno de agenda autorizada

Marcas: - / - / D / C / - / -

Cierre T-24: destinatarios secretaría y/o profesional autorizados de la agenda. Consulta y gestión del aviso requieren facultad vigente; destinatarios concretos y bandeja pendientes. Un aviso previo no conserva acceso tras la revocación.

CU: CU-25, CU-26. Pendientes: D03, D07, D09. Fuentes: R04, R08, S.

### MP-34. Resolver avisos fallidos y gestiones pendientes

Marcas: - / - / ? / ? / ? / ?

Seguimiento requerido; responsables y acciones de resolución por concretar. Fallo de entrega no cuenta como notificación ni permite cancelar por sí solo. Soporte de plataforma no obtiene acceso general al contenido.

CU: CU-26. Pendientes: D07, D09. Fuentes: R08, R11.b, R10, ADR-013.

### MP-35. Incorporar entidades y cuentas a beta controlada

Marcas: - / - / - / - / - / F

Facultad operativa acotada de plataforma. No concede lectura de agendas, fichas o chats. El formulario comercial de incorporación no está aprobado; no atribuir administración a quien solicita o paga.

CU: CU-07. Pendientes: D03, D14. Fuentes: R01, R10.

### MP-36. Invitar equipo y asignar membresías o roles locales

Marcas: - / - / ? / ? / ? / ?

Membresías y permisos son necesarios; reparto de facultades e invitaciones del documento 20 aún propuesto. Invitar a un profesional no delega sus agendas. El alta controlada por plataforma de MP-35 no aprueba todo este recorrido.

CU: CU-07. Pendientes: D03, D14. Fuentes: R04, R10, DOC20.

### MP-37. Dar baja institucional a un profesional

Marcas: - / - / - / - / F / -

Administrador de la entidad con facultad local; finaliza vínculo y permisos de esa institución. Conserva cuenta global, fichaje e historial y otros vínculos. Fecha efectiva y tratamiento de turnos futuros pendientes.

CU: CU-29. Pendientes: D04. Fuentes: R05, ADR-011.

### MP-38. Tramitar continuidad profesional en otra entidad

Marcas: - / - / - / - / - / F

Plataforma con facultad específica, conserva cuenta, identidad y fichaje para continuidad independiente. Datos compartidos, numeración y turnos por modelar. No copia toda la clínica ni permite acceso cruzado general; desarrollador solo actúa si tiene esta facultad.

CU: CU-30. Pendientes: D04, D12. Fuentes: R05, R10, ADR-011.

### MP-39. Pedir eliminación de la cuenta profesional propia

Marcas: - / - / - / C / - / -

Solo petición expresa y verificada del profesional afectado. Solicitar no equivale a ejecutar. Se conservan fichas e historial administrativo de pacientes; procedimiento pendiente.

CU: CU-31. Pendientes: D04. Fuentes: R05, ADR-011.

### MP-40. Ejecutar eliminación solicitada de cuenta y vínculos

Marcas: - / - / - / - / - / ?

La condición de solicitud expresa está confirmada; ejecutor, verificación, tratamiento de referencias y procedimiento pendientes. No conceder borrado al administrador institucional ni al profesional por poder solicitarlo.

CU: CU-31. Pendientes: D04. Fuentes: R05, ADR-011.

### MP-41. Borrar fichas e historial por baja profesional

Marcas: X / X / X / X / X / X

La baja institucional o eliminación de cuenta y vínculos del profesional conservan las fichas e historial de pacientes. Esta fila no determina otras solicitudes de datos ni plazos de conservación.

CU: CU-29, CU-31. Pendientes: -. Fuentes: R05, ADR-011.

### MP-42. Consultar auditoría y reportes administrativos

Marcas: - / - / ? / ? / ? / ?

Auditoría restringida aceptada; lectores, alcance, eventos, reportes y conservación pendientes. Ver historial propio de un turno no concede auditoría de la entidad ni logs técnicos.

CU: CU-32. Pendientes: D03, D08, D11, D16. Fuentes: R12, S.

### MP-43. Revisar abuso y autorizar excepciones

Marcas: - / - / ? / ? / ? / ?

Revisión humana y excepciones previstas, con facultad, motivo y trazabilidad; responsables, umbrales y alcance por definir. No suspender a un paciente solo por DNI ajeno declarado o IP compartida.

CU: CU-27. Pendientes: D07, D15. Fuentes: R02.a, R08, S.

### MP-44. Acceder a datos de pacientes para soporte

Marcas: - / - / - / - / - / ?

El soporte excepcional autorizado, temporal y trazable es un diseño propuesto. Autoridad concedente, motivo, duración y datos visibles pendientes. Ser desarrollador o administrador global no concede acceso indiscriminado ni suplantación libre.

CU: CU-26, CU-34. Pendientes: D03, D16. Fuentes: R10, S.

### MP-45. Ver detalles de ocupación de otra entidad por conflicto

Marcas: X / X / X / X / X / X

El coordinador solo devuelve disponibilidad o conflicto; no revela quién reservó, paciente, turno ni entidad ajenos. Una misma persona con varios contextos debe autorizar cada contexto por separado.

CU: CU-13, CU-36. Pendientes: -. Fuentes: R01.a, R03, S.

### MP-46. Habilitar funciones clínicas especializadas en beta

Marcas: X / X / X / X / X / X

Odontograma e historia clínica especializada quedan excluidos de esta versión. Tener permisos administrativos no amplía ese alcance.

CU: Fuera de beta. Pendientes: -. Fuentes: R01, ADR-010.

## Operaciones técnicas originales

### OP-01. Servicio de avisos

Correo de confirmación entre T-72/T-48 y WhatsApp T-36 si sigue pendiente.

Solo turno vigente, entidad/remitente y destinatario autorizados. No leer ficha completa ni confirmar por entrega/apertura.

Fuentes: R08, S

### OP-02. Tarea de cierre

A T-24 sin confirmar: cancelar, liberar y persistir aviso interno.

Política y excepciones aplicables; consistencia, idempotencia y auditoría. No actuar sobre entidades/turnos fuera del trabajo asignado.

Fuentes: R08, R12

### OP-03. Servicio de reprogramación

WhatsApp a todos los afectados por ausencia, incluidos confirmados, con enlace al portal.

Evento separado de T-36; solo lote y destinatarios autorizados. No asigna horarios ni considera el envío reemplazo efectivo. Permisos del lote pendientes.

Fuentes: R11.b, ADR-013

### OP-04. Coordinador de capacidad

Resolver ocupación mínima del mismo profesional entre entidades.

Operación interna acotada; sin consulta general ni datos de fichas, chat o turnos ajenos. Auditar; no usar superusuario como acceso ordinario.

Fuentes: R03, S

### OP-05. Operador de infraestructura facultado

Respaldar, comprobar restauración y contener incidentes.

Facultad técnica separada del administrador de plataforma; acceso restringido a respaldos y entorno de recuperación. No concede navegación indiscriminada en producción. Responsables concretos pendientes.

Fuentes: S, R10

## Reglas y seguridad

| Regla | Capítulos | Evidencia |
| --- | --- | --- |
| R01 | 02, 04, 10-12 | Aislamiento local, entidad independiente y ficha administrativa |
| R02 | 14-15, 28 | Hold durable, cuotas concurrentes e idempotencia |
| R03 | 14-15, 17 | Una sola ocupación entre entidades; conflicto sin detalles |
| R04 | 05, 09 | Membresía más delegación por acción; revocación efectiva |
| R05 | 19, 26-27 | Baja local, continuidad y eliminación solicitada separadas |
| R06 | 11, 13, 17 | Solo Consulta en portal; duración/versiones preservadas |
| R07 | 12-13 | Convenio y modalidad explícitos; sin pasar a particular |
| R08 | 16-18 | Correo, WhatsApp y cierre consistente; carrera T-24 |
| R09 | 08-09, 12 | Representante verificado; actor y paciente separados |
| R10 | 08-09, 19, 27 | Facultades de plataforma; recuperación sin restaurar permisos |
| R11 | 17-19 | Canales, chat humano y WhatsApp por ausencia |
| R12 | 06, 22-25 | Evidencia cronológica, reportes y recuperación controlada |
| S01 | 08-09 | Acceso y recuperación sin apropiación ni permisos residuales |
| S02 | 09, 20 | API negativa por paciente, agenda y entidad; revocación |
| S03 | 10, 14 | RLS con rol real, pool reutilizado y capacidad mínima |
| S04 | 07-08, 24 | TLS, cookies, sesión y CSRF en despliegue real |
| S05 | 13-15, 20, 28 | Validación, parámetros SQL y límites por operación |
| S06 | 08, 24-25 | MFA administrativo y separación de operación |
| S07 | 08, 16-17 | Tokens limitados, GET sin mutación e idempotencia |
| S08 | 07, 18, 24-25 | Secretos fuera de Git y webhooks firmados |
| S09 | 09, 12, 18 | Representación y destinatario autorizado mínimo |
| S10 | 20, 22, 24 | Auditoría restringida, errores y logs sin secretos |
| S11 | 24-25 | Copia externa y restauración íntegra demostrada |
| S12 | 24-25 | Ensayo de incidente, revocación y recuperación |
| S13 | 13, 15, 17 | Rechazo de otras prácticas incluso renombradas Consulta |
| S14 | 09, 19 | Chat por participantes; delegar agenda no da lectura |
| S15 | 08-09, 12 | Admisión y activación previas al acceso privado |
| S16 | 14-15, 18, 28 | Cuota atómica incluidos confirmados, familias y revisión |