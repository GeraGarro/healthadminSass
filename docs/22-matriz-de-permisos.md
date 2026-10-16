# Matriz de permisos de beta

Fecha: 16 de octubre de 2026. Versión documental 1.0. Fuente: reglas vigentes y ADR del proyecto. Sin consulta externa.

**Estado: preparada para revisión.** Transcribe las facultades y restricciones respaldadas por la documentación aprobada; conserva sin asignar los detalles abiertos. Esta entrega no aprueba una política nueva, no cierra D03/D08/D14 ni acredita implementación o pruebas funcionales. Los casos de uso y documentos 16, 18 y 20 sirven para trazabilidad de detalle propuesto, no como aprobación adicional.

Incluye 46 acciones, seis actores humanos principales y 5 operaciones técnicas separadas. Los identificadores MP y OP son referencias de esta matriz, no nombres de permisos/API aprobados.

## Cómo interpretar las celdas

| Marca | Significado |
| --- | --- |
| C | Condicionado: recurso propio o vínculo autorizado; exige las condiciones de la fila. |
| D | Delegado: membresía y delegación vigente por persona, entidad, agenda y acción. |
| F | Facultad expresa: requiere autorización específica en el ámbito indicado; el rol solo no basta. |
| ? | Pendiente: no hay asignación o alcance suficientemente aprobado; no concede permiso. |
| — | Sin concesión por este rol: otra actuación exige un rol o facultad adicional validado. |
| X | Prohibido por una restricción expresa de la documentación. |

**C, D y F nunca son permisos universales.** Se verifican entidad, recurso, acción, vínculo y estado vigentes. Una facultad F no está concedida a todas las cuentas del rol; su otorgante y procedimiento pueden seguir pendientes. Una marca ? no es una propuesta de concesión ni permiso utilizable. — no es una prohibición absoluta para la persona: puede actuar bajo otro rol o una facultad adicional previamente validada. X se limita a la acción y causa expresadas en esa fila.

Una misma persona puede ser profesional, administrador y/o secretaría en distintos contextos. Cada actuación debe declarar y verificar el contexto correspondiente; los roles no se combinan para eludir restricciones. El rol de administrador no hereda gestión de agendas, lectura de fichas o chat.

## Condiciones comunes

1. El servidor autoriza cada operación por identidad, entidad, recurso y acción; la interfaz solo presenta las facultades resueltas.
2. Paciente: admisión vigente, activación y vínculo verificados. Representante: además facultad, alcance y vigencia sobre el paciente; acceso informativo, gestión de turnos y consentimiento sanitario son facultades distintas.
3. Secretaría en agenda delegada: membresía vigente + delegación de esa persona y agenda en la misma entidad + acción concreta. Las delegaciones las otorga el profesional; no hay subdelegación implícita.
4. Profesional: agenda propia autorizada y vínculo vigente con la entidad. Identidad global y número de paciente no abren datos de otros profesionales o entidades.
5. Revocación efectiva en la siguiente operación, incluso con pantalla abierta. No borra historial ni cancela automáticamente turnos existentes.
6. Elegibilidad, disponibilidad, cuotas, vigencia del turno y políticas aplican además del permiso. Confirmar, cancelar y reprogramar requieren acciones explícitas, consistentes y auditadas; un chat o una lectura no las ejecutan.
7. Auditoría registra actor real y paciente/representado por separado, ámbito, acción, resultado, cambios y motivo, sin contraseñas, tokens completos ni cuerpos de chat en logs generales.

## Puerta de acceso de paciente y representante

| Estado | Facultad privada |
| --- | --- |
| Sin admisión / solicitud pendiente | No permite ficha, reservas, pre-reservas ni chat. El formulario propio protegido no crea capacidad. Consulta limitada del trámite: diseño pendiente. |
| Aprobado, activación pendiente | Solo completar activación/vinculación; aún no habilita facultades privadas sobre esa ficha. |
| Activo | Solo los recursos y acciones autorizados por la matriz y los vínculos vigentes. |
| Rechazado / suspendido / revocado | Sin nuevas operaciones privadas en el contexto afectado. Otros contextos autorizados de la cuenta se conservan. |

Fuente: [R09.a](03-reglas-del-dominio.md#r09a-admisión-habilitación-y-solicitud-de-empadronamiento) y [documento 12](12-acceso-con-aprobacion-administrativa.md). El equipo ingresa según sus propias membresías/facultades. Un solicitante público solo presenta el trámite protegido; un contacto, familiar o entidad de cobertura médica no recibe acceso privado por esa condición.

## Acceso y admisión

| Acción | Paciente | Representante | Secretaría | Profesional | Adm. entidad | Adm. plataforma |
| --- | --- | --- | --- | --- | --- | --- |
| MP-01 · Activar acceso previamente aprobado e ingresar | C | C | — | — | — | — |
| MP-02 · Revisar solicitud y admitir al paciente conocido o nuevo | X | X | F | ? | ? | — |
| MP-03 · Verificar, otorgar o revocar representación | — | — | ? | ? | ? | — |
| MP-04 · Suspender o revocar acceso local | — | — | ? | ? | ? | ? |
| MP-05 · Recuperar la contraseña propia por email (equipo) | ? | ? | C | C | C | C |
| MP-06 · Conocer o establecer la contraseña de otro usuario | X | X | X | X | X | X |

### Condiciones y trazabilidad

- **MP-01:** Paciente o representante: admisión vigente, activación y vinculación verificadas al contexto correcto. Google o correo no sustituyen esas comprobaciones. El equipo ingresa por su propia membresía y facultades, no por admisión de pacientes. Fuentes: [R09.a](03-reglas-del-dominio.md#r09a-admisión-habilitación-y-solicitud-de-empadronamiento), [DOC12](12-acceso-con-aprobacion-administrativa.md). Trazabilidad: CU-03, CU-04. Pendientes: D08, D14, D16.
- **MP-02:** Secretaría necesita facultad administrativa de admisión explícita. El permiso de agenda no basta. Quién concede esta facultad y su asignación a otros actores siguen pendientes. Nadie se autoaprueba como paciente o representante. Fuentes: [R09.a](03-reglas-del-dominio.md#r09a-admisión-habilitación-y-solicitud-de-empadronamiento), [DOC12](12-acceso-con-aprobacion-administrativa.md). Trazabilidad: CU-02. Pendientes: D08, D14.
- **MP-03:** La representación verificada y revocable está aceptada; responsable, evidencia y procedimiento concretos pendientes. Parentesco, contacto de emergencia o teléfono familiar no conceden acceso. Fuentes: [R09](03-reglas-del-dominio.md#r09-menores-y-representación). Trazabilidad: CU-06. Pendientes: D08, D14.
- **MP-04:** La capacidad de revocación por seguridad está aceptada; distribución operativa pendiente. Se aplica al ámbito afectado, incluso con sesión abierta; no borra cuenta ni cancela turnos automáticamente. Revocar una delegación de agenda se trata en MP-24. Fuentes: [R09.a](03-reglas-del-dominio.md#r09a-admisión-habilitación-y-solicitud-de-empadronamiento), [R10](03-reglas-del-dominio.md#r10-administrador-de-plataforma-y-evolución-de-suscripciones), [S](06-seguridad-beta.md). Trazabilidad: CU-28. Pendientes: D03, D14, D16.
- **MP-05:** Confirmado para secretaría, profesionales y administradores, sobre su propia cuenta. No restituye permisos revocados. Método de acceso/recuperación del paciente y representante pendiente; no extender automáticamente el diseño del equipo. MFA y cuentas exclusivamente externas requieren tratamiento propio. Fuentes: [R10.a](03-reglas-del-dominio.md#r10a-recuperación-de-credenciales-y-alta-de-usuarios), [ADR-012](arquitectura/adr/012-recuperacion-y-alta-de-usuarios.md). Trazabilidad: CU-05. Pendientes: D14, D16.
- **MP-06:** El alta administrativa no permite manejar credenciales del paciente. La recuperación verificada permite al titular recuperar su cuenta; no es una facultad para leer o fijar contraseñas ajenas. Fuentes: [R09.a](03-reglas-del-dominio.md#r09a-admisión-habilitación-y-solicitud-de-empadronamiento), [R10.a](03-reglas-del-dominio.md#r10a-recuperación-de-credenciales-y-alta-de-usuarios), [DOC12](12-acceso-con-aprobacion-administrativa.md). Trazabilidad: CU-03, CU-05. Pendientes: —.

## Ficha y cobertura

| Acción | Paciente | Representante | Secretaría | Profesional | Adm. entidad | Adm. plataforma |
| --- | --- | --- | --- | --- | --- | --- |
| MP-07 · Consultar ficha administrativa del paciente | ? | ? | ? | ? | ? | — |
| MP-08 · Crear o actualizar ficha y cobertura declarada | ? | ? | ? | ? | ? | — |
| MP-09 · Fusionar fichas o importar vínculos numerados | — | — | ? | ? | ? | ? |
| MP-10 · Configurar convenios de cobertura | — | — | ? | C | ? | — |
| MP-11 · Renumerar o reutilizar un número confirmado | X | X | X | X | X | X |

### Condiciones y trazabilidad

- **MP-07:** La ficha administrativa y su aislamiento están aceptados. Asignación de lectores, campos, visibilidad del portal y alcance de cada facultad siguen en revisión; no conceder toda la población por un rol o por un vínculo numerado. Consultar turnos autorizados se distingue en MP-12. Fuentes: [R01.a](03-reglas-del-dominio.md#r01a-aislamiento-y-numeración-de-pacientes), [R09](03-reglas-del-dominio.md#r09-menores-y-representación), [DOC18](18-ficha-paciente-y-cobertura-medica.md). Trazabilidad: CU-09. Pendientes: D08, D12, D14.
- **MP-08:** La gestión administrativa requiere facultad sobre la ficha y campos concretos; el desglose de edición por actor sigue propuesto. El registro de datos para admitir al conocido se distingue en MP-02 y no concede toda edición posterior. Una cobertura declarada no equivale a afiliación verificada ni a autorización de práctica. Fuentes: [R01.a](03-reglas-del-dominio.md#r01a-aislamiento-y-numeración-de-pacientes), [R07](03-reglas-del-dominio.md#r07-coberturas-y-convenios-de-atención), [DOC18](18-ficha-paciente-y-cobertura-medica.md). Trazabilidad: CU-09. Pendientes: D06, D08, D12, D14.
- **MP-09:** Requiere permiso e historia; procedimiento y responsables pendientes. No fusionar por coincidencia de nombre, DNI, email o teléfono. La importación no habilita transferencia indiscriminada entre entidades. Fuentes: [R01.a](03-reglas-del-dominio.md#r01a-aislamiento-y-numeración-de-pacientes), [R09](03-reglas-del-dominio.md#r09-menores-y-representación). Trazabilidad: CU-09. Pendientes: D12, D14.
- **MP-10:** El profesional configura a qué beneficiarios atiende dentro de su ámbito. Planes, vigencias, excepciones y delegación a otros actores pendientes; no inferir este permiso del de duración o reserva. Fuentes: [R07](03-reglas-del-dominio.md#r07-coberturas-y-convenios-de-atención). Trazabilidad: CU-12. Pendientes: D06.
- **MP-11:** La baja conserva el número del vínculo original y no desplaza posteriores. Reactivar conserva ese número. Correcciones/fusiones auditadas no conceden facultad general para renumerar ni reutilizar números. Fuentes: [R01.a](03-reglas-del-dominio.md#r01a-aislamiento-y-numeración-de-pacientes). Trazabilidad: CU-09. Pendientes: —.

## Turnos y disponibilidad

| Acción | Paciente | Representante | Secretaría | Profesional | Adm. entidad | Adm. plataforma |
| --- | --- | --- | --- | --- | --- | --- |
| MP-12 · Consultar turnos e historial autorizado | C | C | D | C | — | — |
| MP-13 · Consultar disponibilidad elegible | C | C | D | C | — | — |
| MP-14 · Pre-reservar y registrar Consulta habilitada | C | C | D | C | — | — |
| MP-15 · Elegir, pre-reservar y registrar otras prácticas | X | X | D | C | — | — |
| MP-16 · Solicitar gestión de otra práctica sin elegir horario | C | C | — | — | — | — |
| MP-17 · Confirmar asistencia propia o representada | C | C | — | — | — | — |
| MP-18 · Registrar confirmación asistida o telefónica | — | — | F | ? | ? | — |
| MP-19 · Cancelar turno con política vigente | C | C | D | C | — | — |
| MP-20 · Elegir nuevo horario para Consulta habilitada | C | C | D | C | — | — |
| MP-21 · Elegir nuevo horario para otra práctica | X | X | D | C | — | — |

### Condiciones y trazabilidad

- **MP-12:** Paciente: sus turnos, también los cargados por personal. Representante: solo el paciente y datos cubiertos por su facultad. Personal: agenda y recursos autorizados. El historial del turno no concede toda la ficha ni auditoría global. Fuentes: [R04](03-reglas-del-dominio.md#r04-delegación-explícita-de-cada-agenda), [R06](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda), [R09](03-reglas-del-dominio.md#r09-menores-y-representación), [R12](03-reglas-del-dominio.md#r12-auditoría-trazabilidad-y-memoria-del-proyecto). Trazabilidad: CU-17. Pendientes: D03, D08.
- **MP-13:** En portal solo oferta elegible de la práctica base Consulta. Personal: ofertas de agendas autorizadas. Devuelve disponibilidad/conflicto sin paciente, entidad o turno ajenos; ver disponibilidad no ocupa capacidad. Fuentes: [R02](03-reglas-del-dominio.md#r02-reserva-temporal-antes-de-completar-el-turno), [R03](03-reglas-del-dominio.md#r03-exclusión-del-mismo-profesional-entre-entidades), [R06](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda), [R07](03-reglas-del-dominio.md#r07-coberturas-y-convenios-de-atención). Trazabilidad: CU-13. Pendientes: D02, D05, D06.
- **MP-14:** Identidad de la práctica base Consulta, oferta habilitada, ausencia de gestión obligatoria, elegibilidad, disponibilidad y cuotas. Paciente admitido y activado; representación vigente cuando aplique. Secretaría: acción de reserva delegada. Registro y confirmación de asistencia son hitos diferentes. Fuentes: [R02](03-reglas-del-dominio.md#r02-reserva-temporal-antes-de-completar-el-turno), [R03](03-reglas-del-dominio.md#r03-exclusión-del-mismo-profesional-entre-entidades), [R06](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda), [R09.a](03-reglas-del-dominio.md#r09a-admisión-habilitación-y-solicitud-de-empadronamiento), [ADR-009](arquitectura/adr/009-catalogo-inicial-y-personalizacion.md). Trazabilidad: CU-14, CU-15, CU-36, CU-37. Pendientes: D01, D05, D06, D15.
- **MP-15:** Extracción, limpieza, cirugía y toda práctica personalizada: horario asignado por profesional o secretaría autorizada. Llamar o clasificar una personalizada como Consulta no amplía autogestión; tampoco una duración breve. Fuentes: [R02](03-reglas-del-dominio.md#r02-reserva-temporal-antes-de-completar-el-turno), [R06](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda), [ADR-009](arquitectura/adr/009-catalogo-inicial-y-personalizacion.md). Trazabilidad: CU-15, CU-36, CU-37. Pendientes: D01, D05, D06, D15.
- **MP-16:** Paciente o representante autorizado pide atención al personal por el circuito habilitado. No bloquea capacidad, crea turno ni concede acceso automático a una conversación. Fuentes: [R06](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda), [R11.a](03-reglas-del-dominio.md#r11a-chat-del-portal-para-consultas-al-profesional). Trazabilidad: CU-16. Pendientes: D08, D13, D15.
- **MP-17:** Turno vigente y confirmación explícita por actor autorizado. Representación con facultad específica. Entrega, lectura, clic, login o mensaje informal no confirman; un token de turno no abre ficha ni chat. Fuentes: [R08](03-reglas-del-dominio.md#r08-confirmación-de-asistencia-y-plazos), [R09](03-reglas-del-dominio.md#r09-menores-y-representación). Trazabilidad: CU-18. Pendientes: D07, D08.
- **MP-18:** Sigue vigente asistencia por secretaría, con autor, fecha y medio. Requiere acción autorizada sobre agenda/turno; consultar o reservar no la concede. Alcance de excepciones, otros responsables y tratamiento cerca de T-24 pendientes. Fuentes: [R08](03-reglas-del-dominio.md#r08-confirmación-de-asistencia-y-plazos). Trazabilidad: CU-18. Pendientes: D03, D07.
- **MP-19:** Paciente/representante: turno propio/autorizado de cualquier práctica, según facultades y política. Secretaría: delegación de cancelación. Plazo voluntario y excepciones pendientes; no usar T-24 de asistencia como plazo de cancelación. Fuentes: [R04](03-reglas-del-dominio.md#r04-delegación-explícita-de-cada-agenda), [R06](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda), [R08](03-reglas-del-dominio.md#r08-confirmación-de-asistencia-y-plazos), [R09](03-reglas-del-dominio.md#r09-menores-y-representación). Trazabilidad: CU-19. Pendientes: D03, D07, D08.
- **MP-20:** Reprogramación con facultad vigente, elegibilidad y oferta Consulta habilitada. Si el reemplazo falla se conserva el turno anterior. El enlace de aviso no sustituye comprobaciones; invalidar acciones del horario anterior cuando corresponda. Fuentes: [R02](03-reglas-del-dominio.md#r02-reserva-temporal-antes-de-completar-el-turno), [R04](03-reglas-del-dominio.md#r04-delegación-explícita-de-cada-agenda), [R06](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda), [R08](03-reglas-del-dominio.md#r08-confirmación-de-asistencia-y-plazos). Trazabilidad: CU-20. Pendientes: D01, D03, D07.
- **MP-21:** Lo gestiona personal autorizado, también tras un WhatsApp por ausencia del profesional. Paciente y representante pueden solicitar el cambio, pero no elegir ni bloquear el reemplazo. Fuentes: [R06](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda), [ADR-009](arquitectura/adr/009-catalogo-inicial-y-personalizacion.md), [ADR-013](arquitectura/adr/013-reprogramacion-profesional-por-whatsapp.md). Trazabilidad: CU-20. Pendientes: D03, D07.

## Agenda y delegaciones

| Acción | Paciente | Representante | Secretaría | Profesional | Adm. entidad | Adm. plataforma |
| --- | --- | --- | --- | --- | --- | --- |
| MP-22 · Configurar disponibilidad y excepciones de agenda | — | — | D | C | — | — |
| MP-23 · Configurar duración de atención por práctica y agenda | — | — | D | C | — | — |
| MP-24 · Otorgar o revocar delegación de agenda | — | — | X | C | — | — |
| MP-25 · Registrar llegada del paciente | — | — | D | C | — | — |
| MP-26 · Marcar en atención, atendido o ausente | — | — | ? | ? | — | — |
| MP-27 · Iniciar gestión por ausencia o reprogramación del profesional | — | — | ? | C | — | — |

### Condiciones y trazabilidad

- **MP-22:** Profesional en agenda propia autorizada; secretaría con acción de configuración delegada. Un bloqueo por ausencia no cancela automáticamente los turnos ya existentes. Fuentes: [R04](03-reglas-del-dominio.md#r04-delegación-explícita-de-cada-agenda), [R05](03-reglas-del-dominio.md#r05-autonomía-y-desvinculación-del-profesional), [R06](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda). Trazabilidad: CU-11. Pendientes: D02, D03, D05.
- **MP-23:** Facultad de duración separada de consultar, reservar y cancelar. Tiempos reales por validar; ampliar pausas, recursos y ciclo de oferta requiere revisión del detalle del catálogo. No cambia silenciosamente los turnos vigentes. Fuentes: [R04](03-reglas-del-dominio.md#r04-delegación-explícita-de-cada-agenda), [R06](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda). Trazabilidad: CU-11. Pendientes: D03, D05.
- **MP-24:** Profesional otorgante sobre sus agendas y a una persona con membresía de la misma entidad, por acción y vigencia. Revocación efectiva en la siguiente operación aun con pantalla abierta. Recibir delegación no autoriza subdelegar; administración de entidad no sustituye al otorgante. Fuentes: [R04](03-reglas-del-dominio.md#r04-delegación-explícita-de-cada-agenda), [R05](03-reglas-del-dominio.md#r05-autonomía-y-desvinculación-del-profesional). Trazabilidad: CU-08. Pendientes: D03.
- **MP-25:** Acción independiente de confirmar asistencia; secretaría requiere delegación específica. El profesional actúa en su agenda autorizada. Validar estados y transiciones antes de implementar. Fuentes: [R04](03-reglas-del-dominio.md#r04-delegación-explícita-de-cada-agenda), [R08](03-reglas-del-dominio.md#r08-confirmación-de-asistencia-y-plazos), [R12](03-reglas-del-dominio.md#r12-auditoría-trazabilidad-y-memoria-del-proyecto). Trazabilidad: CU-22. Pendientes: D03, D07.
- **MP-26:** Estados administrativos contemplados; asignación detallada por estado y transición pendiente. No extender automáticamente la facultad de registrar llegada a todos los estados. Fuentes: [R08](03-reglas-del-dominio.md#r08-confirmación-de-asistencia-y-plazos), [R12](03-reglas-del-dominio.md#r12-auditoría-trazabilidad-y-memoria-del-proyecto), [CU](21-casos-de-uso.md). Trazabilidad: CU-22. Pendientes: D03, D07.
- **MP-27:** Profesional en sus agendas. Delegación específica para secretaría y operación por lote pendientes. Debe generar WhatsApp a todos los turnos vigentes afectados, incluidos confirmados; la ejecución del envío es una tarea acotada del sistema. Fuentes: [R11.b](03-reglas-del-dominio.md#r11b-reprogramación-por-motivos-del-profesional), [ADR-013](arquitectura/adr/013-reprogramacion-profesional-por-whatsapp.md). Trazabilidad: CU-21. Pendientes: D03, D07, D09.

## Catálogo de prácticas

| Acción | Paciente | Representante | Secretaría | Profesional | Adm. entidad | Adm. plataforma |
| --- | --- | --- | --- | --- | --- | --- |
| MP-28 · Crear práctica personalizada de la entidad | X | X | ? | ? | ? | — |
| MP-29 · Editar, activar o desactivar definición compartida | — | — | ? | ? | ? | — |
| MP-30 · Habilitar o retirar oferta y autoselección de Consulta | — | — | ? | ? | — | — |

### Condiciones y trazabilidad

- **MP-28:** Aprobada la posibilidad mediante facultad explícita. Quién concede esa facultad y su asignación a roles no están aprobados; documento 16 propone opciones. No equivale a facultad de agenda ni habilita elección por paciente. Fuentes: [R06](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda), [ADR-009](arquitectura/adr/009-catalogo-inicial-y-personalizacion.md), [DOC16](16-catalogo-de-practicas.md). Trazabilidad: CU-10. Pendientes: D03, D05.
- **MP-29:** Desglose de facultades y ciclo de catálogo propuestos para revisión. Definición de entidad distinta de oferta por agenda; el permiso de una agenda no alcanza para alterar todas las demás. Fuentes: [R06](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda), [DOC16](16-catalogo-de-practicas.md). Trazabilidad: CU-10. Pendientes: D03, D05.
- **MP-30:** Se exige oferta habilitada y acción autorizada. El desglose de permisos para habilitar/retirar y conceder portal sigue propuesto. Solo la práctica base Consulta puede admitir autoselección; ninguna facultad permite extenderla a las personalizadas. Fuentes: [R06](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda), [ADR-009](arquitectura/adr/009-catalogo-inicial-y-personalizacion.md), [DOC16](16-catalogo-de-practicas.md). Trazabilidad: CU-11. Pendientes: D03, D05.

## Chat y comunicaciones

| Acción | Paciente | Representante | Secretaría | Profesional | Adm. entidad | Adm. plataforma |
| --- | --- | --- | --- | --- | --- | --- |
| MP-31 · Leer y enviar mensajes en conversación autorizada | C | C | ? | C | ? | — |
| MP-32 · Acceder al chat solo por delegación de agenda | — | — | X | — | X | X |
| MP-33 · Recibir aviso interno sobre turno de agenda autorizada | — | — | D | C | — | — |
| MP-34 · Resolver avisos fallidos y gestiones pendientes | — | — | ? | ? | ? | ? |

### Condiciones y trazabilidad

- **MP-31:** Paciente y profesional participantes, dentro de la entidad y con facultades vigentes. Representante requiere permiso específico. Participación administrativa pendiente de diseño; delegación de agenda no concede lectura. No incluye IA, adjuntos ni llamadas. Fuentes: [R09](03-reglas-del-dominio.md#r09-menores-y-representación), [R11.a](03-reglas-del-dominio.md#r11a-chat-del-portal-para-consultas-al-profesional), [S](06-seguridad-beta.md). Trazabilidad: CU-23. Pendientes: D08, D13, D15.
- **MP-32:** Ni secretaría ni administradores reciben lectura de chat por gestionar una agenda o por su cargo. Ser profesional de otra conversación tampoco concede acceso. Las facultades de conversación se verifican por separado. Fuentes: [R04](03-reglas-del-dominio.md#r04-delegación-explícita-de-cada-agenda), [R11.a](03-reglas-del-dominio.md#r11a-chat-del-portal-para-consultas-al-profesional), [S](06-seguridad-beta.md). Trazabilidad: CU-23. Pendientes: —.
- **MP-33:** Cierre T-24: destinatarios secretaría y/o profesional autorizados de la agenda. Consulta y gestión del aviso requieren facultad vigente; destinatarios concretos y bandeja pendientes. Un aviso previo no conserva acceso tras la revocación. Fuentes: [R04](03-reglas-del-dominio.md#r04-delegación-explícita-de-cada-agenda), [R08](03-reglas-del-dominio.md#r08-confirmación-de-asistencia-y-plazos), [S](06-seguridad-beta.md). Trazabilidad: CU-25, CU-26. Pendientes: D03, D07, D09.
- **MP-34:** Seguimiento requerido; responsables y acciones de resolución por concretar. Fallo de entrega no cuenta como notificación ni permite cancelar por sí solo. Soporte de plataforma no obtiene acceso general al contenido. Fuentes: [R08](03-reglas-del-dominio.md#r08-confirmación-de-asistencia-y-plazos), [R11.b](03-reglas-del-dominio.md#r11b-reprogramación-por-motivos-del-profesional), [R10](03-reglas-del-dominio.md#r10-administrador-de-plataforma-y-evolución-de-suscripciones), [ADR-013](arquitectura/adr/013-reprogramacion-profesional-por-whatsapp.md). Trazabilidad: CU-26. Pendientes: D07, D09.

## Entidad, transición y cuenta

| Acción | Paciente | Representante | Secretaría | Profesional | Adm. entidad | Adm. plataforma |
| --- | --- | --- | --- | --- | --- | --- |
| MP-35 · Incorporar entidades y cuentas a beta controlada | — | — | — | — | — | F |
| MP-36 · Invitar equipo y asignar membresías o roles locales | — | — | ? | ? | ? | ? |
| MP-37 · Dar baja institucional a un profesional | — | — | — | — | F | — |
| MP-38 · Tramitar continuidad profesional en otra entidad | — | — | — | — | — | F |
| MP-39 · Pedir eliminación de la cuenta profesional propia | — | — | — | C | — | — |
| MP-40 · Ejecutar eliminación solicitada de cuenta y vínculos | — | — | — | — | — | ? |
| MP-41 · Borrar fichas e historial por baja profesional | X | X | X | X | X | X |

### Condiciones y trazabilidad

- **MP-35:** Facultad operativa acotada de plataforma. No concede lectura de agendas, fichas o chats. El formulario comercial de incorporación no está aprobado; no atribuir administración a quien solicita o paga. Fuentes: [R01](03-reglas-del-dominio.md#r01-entidad-cliente-sede-y-entidad-de-cobertura-médica), [R10](03-reglas-del-dominio.md#r10-administrador-de-plataforma-y-evolución-de-suscripciones). Trazabilidad: CU-07. Pendientes: D03, D14.
- **MP-36:** Membresías y permisos son necesarios; reparto de facultades e invitaciones del documento 20 aún propuesto. Invitar a un profesional no delega sus agendas. El alta controlada por plataforma de MP-35 no aprueba todo este recorrido. Fuentes: [R04](03-reglas-del-dominio.md#r04-delegación-explícita-de-cada-agenda), [R10](03-reglas-del-dominio.md#r10-administrador-de-plataforma-y-evolución-de-suscripciones), [DOC20](20-registro-de-usuarios-y-recuperacion-de-acceso.md). Trazabilidad: CU-07. Pendientes: D03, D14.
- **MP-37:** Administrador de la entidad con facultad local; finaliza vínculo y permisos de esa institución. Conserva cuenta global, fichaje e historial y otros vínculos. Fecha efectiva y tratamiento de turnos futuros pendientes. Fuentes: [R05](03-reglas-del-dominio.md#r05-autonomía-y-desvinculación-del-profesional), [ADR-011](arquitectura/adr/011-transicion-administrada-del-profesional.md). Trazabilidad: CU-29. Pendientes: D04.
- **MP-38:** Plataforma con facultad específica, conserva cuenta, identidad y fichaje para continuidad independiente. Datos compartidos, numeración y turnos por modelar. No copia toda la clínica ni permite acceso cruzado general; desarrollador solo actúa si tiene esta facultad. Fuentes: [R05](03-reglas-del-dominio.md#r05-autonomía-y-desvinculación-del-profesional), [R10](03-reglas-del-dominio.md#r10-administrador-de-plataforma-y-evolución-de-suscripciones), [ADR-011](arquitectura/adr/011-transicion-administrada-del-profesional.md). Trazabilidad: CU-30. Pendientes: D04, D12.
- **MP-39:** Solo petición expresa y verificada del profesional afectado. Solicitar no equivale a ejecutar. Se conservan fichas e historial administrativo de pacientes; procedimiento pendiente. Fuentes: [R05](03-reglas-del-dominio.md#r05-autonomía-y-desvinculación-del-profesional), [ADR-011](arquitectura/adr/011-transicion-administrada-del-profesional.md). Trazabilidad: CU-31. Pendientes: D04.
- **MP-40:** La condición de solicitud expresa está confirmada; ejecutor, verificación, tratamiento de referencias y procedimiento pendientes. No conceder borrado al administrador institucional ni al profesional por poder solicitarlo. Fuentes: [R05](03-reglas-del-dominio.md#r05-autonomía-y-desvinculación-del-profesional), [ADR-011](arquitectura/adr/011-transicion-administrada-del-profesional.md). Trazabilidad: CU-31. Pendientes: D04.
- **MP-41:** La baja institucional o eliminación de cuenta y vínculos del profesional conservan las fichas e historial de pacientes. Esta fila no determina otras solicitudes de datos ni plazos de conservación. Fuentes: [R05](03-reglas-del-dominio.md#r05-autonomía-y-desvinculación-del-profesional), [ADR-011](arquitectura/adr/011-transicion-administrada-del-profesional.md). Trazabilidad: CU-29, CU-31. Pendientes: —.

## Auditoría y operación

| Acción | Paciente | Representante | Secretaría | Profesional | Adm. entidad | Adm. plataforma |
| --- | --- | --- | --- | --- | --- | --- |
| MP-42 · Consultar auditoría y reportes administrativos | — | — | ? | ? | ? | ? |
| MP-43 · Revisar abuso y autorizar excepciones | — | — | ? | ? | ? | ? |
| MP-44 · Acceder a datos de pacientes para soporte | — | — | — | — | — | ? |
| MP-45 · Ver detalles de ocupación de otra entidad por conflicto | X | X | X | X | X | X |
| MP-46 · Habilitar funciones clínicas especializadas en beta | X | X | X | X | X | X |

### Condiciones y trazabilidad

- **MP-42:** Auditoría restringida aceptada; lectores, alcance, eventos, reportes y conservación pendientes. Ver historial propio de un turno no concede auditoría de la entidad ni logs técnicos. Fuentes: [R12](03-reglas-del-dominio.md#r12-auditoría-trazabilidad-y-memoria-del-proyecto), [S](06-seguridad-beta.md). Trazabilidad: CU-32. Pendientes: D03, D08, D11, D16.
- **MP-43:** Revisión humana y excepciones previstas, con facultad, motivo y trazabilidad; responsables, umbrales y alcance por definir. No suspender a un paciente solo por DNI ajeno declarado o IP compartida. Fuentes: [R02.a](03-reglas-del-dominio.md#r02a-prevención-de-reservas-abusivas), [R08](03-reglas-del-dominio.md#r08-confirmación-de-asistencia-y-plazos), [S](06-seguridad-beta.md). Trazabilidad: CU-27. Pendientes: D07, D15.
- **MP-44:** El soporte excepcional autorizado, temporal y trazable es un diseño propuesto. Autoridad concedente, motivo, duración y datos visibles pendientes. Ser desarrollador o administrador global no concede acceso indiscriminado ni suplantación libre. Fuentes: [R10](03-reglas-del-dominio.md#r10-administrador-de-plataforma-y-evolución-de-suscripciones), [S](06-seguridad-beta.md). Trazabilidad: CU-26, CU-34. Pendientes: D03, D16.
- **MP-45:** El coordinador solo devuelve disponibilidad o conflicto; no revela quién reservó, paciente, turno ni entidad ajenos. Una misma persona con varios contextos debe autorizar cada contexto por separado. Fuentes: [R01.a](03-reglas-del-dominio.md#r01a-aislamiento-y-numeración-de-pacientes), [R03](03-reglas-del-dominio.md#r03-exclusión-del-mismo-profesional-entre-entidades), [S](06-seguridad-beta.md). Trazabilidad: CU-13, CU-36. Pendientes: —.
- **MP-46:** Odontograma e historia clínica especializada quedan excluidos de esta versión. Tener permisos administrativos no amplía ese alcance. Fuentes: [R01](03-reglas-del-dominio.md#r01-entidad-cliente-sede-y-entidad-de-cobertura-médica), [ADR-010](arquitectura/adr/010-ficha-de-referencia-y-alcance-administrativo.md). Trazabilidad: Fuera de beta. Pendientes: —.

## Automatizaciones y operador técnico

No son roles de paciente ni facultades generales de administración. Cada trabajo debe conservar su propio alcance de entidad, recurso, destinatario y acción; los proveedores transportan o almacenan datos autorizados y no adquieren permisos de portal.

| ID / actor | Operación | Límite | Fuente |
| --- | --- | --- | --- |
| OP-01 · Servicio de avisos | Correo de confirmación entre T-72/T-48 y WhatsApp T-36 si sigue pendiente. | Solo turno vigente, entidad/remitente y destinatario autorizados. No leer ficha completa ni confirmar por entrega/apertura. | R08, S |
| OP-02 · Tarea de cierre | A T-24 sin confirmar: cancelar, liberar y persistir aviso interno. | Política y excepciones aplicables; consistencia, idempotencia y auditoría. No actuar sobre entidades/turnos fuera del trabajo asignado. | R08, R12 |
| OP-03 · Servicio de reprogramación | WhatsApp a todos los afectados por ausencia, incluidos confirmados, con enlace al portal. | Evento separado de T-36; solo lote y destinatarios autorizados. No asigna horarios ni considera el envío reemplazo efectivo. Permisos del lote pendientes. | R11.b, ADR-013 |
| OP-04 · Coordinador de capacidad | Resolver ocupación mínima del mismo profesional entre entidades. | Operación interna acotada; sin consulta general ni datos de fichas, chat o turnos ajenos. Auditar; no usar superusuario como acceso ordinario. | R03, S |
| OP-05 · Operador de infraestructura facultado | Respaldar, comprobar restauración y contener incidentes. | Facultad técnica separada del administrador de plataforma; acceso restringido a respaldos y entorno de recuperación. No concede navegación indiscriminada en producción. Responsables concretos pendientes. | S, R10 |

## Pendientes que esta matriz conserva abiertos

| Decisión | Qué falta definir |
| --- | --- |
| D03 | Concedentes, titulares y alcance de facultades; administración de miembros, acciones delegables y revocación. Los códigos MP no son permisos técnicos definitivos. |
| D04 / D12 | Procedimiento de salida, fichaje compartido, numeración de destino, turnos futuros y ejecutor de eliminación solicitada. No cambiar la conservación confirmada en ADR-011. |
| D05 | Concedente y destinatarios de catálogo; edición/estados, oferta por agenda y habilitación de portal. La restricción a Consulta permanece confirmada. |
| D06 | Planes, verificación de afiliación, configuración delegada y excepciones de cobertura. |
| D07 / D09 | Políticas voluntarias de cancelación/reprogramación, asistencia telefónica, excepciones, responsables de avisos fallidos y lotes por ausencia. El WhatsApp obligatorio de ADR-013 se conserva. |
| D08 / D14 | Evidencia y facultades de representación, admisión, asignación de permisos, campos visibles/editables y activación. La recuperación del equipo por email está confirmada. |
| D13 / D15 | Alta y participantes del chat, eventual participación administrativa, límites y revisión de abuso. |
| D11 / D16 | Lectores de auditoría, reportes, soporte excepcional y responsables técnicos; retención, sesiones, infraestructura y restauración. |

Las transiciones del turno y la asignación de cada estado operativo también requieren revisión. I2/I3 comercial, alta por formulario de contratación no aprobada, directorio público, historia clínica especializada, IA, adjuntos y llamadas no reciben permisos por figurar en esta matriz.

## Escenarios de verificación para la futura aplicación

Son criterios derivados, no pruebas ejecutadas ni autorización para tratar datos reales.

| Escenario | Resultado esperado |
| --- | --- |
| Login válido con admisión pendiente o activación incompleta | Rechazar ficha, pre-reserva, turno y chat privados. |
| Secretaría con consulta de agenda intenta reservar, admitir o leer chat | Rechazar cada acción no concedida; consulta no hereda otras facultades. |
| Se revoca delegación o representación con pantalla abierta | Rechazar la siguiente operación; conservar historial y otros contextos autorizados. |
| Paciente intenta elegir extracción o personalizada llamada Consulta, al reservar o reprogramar | Rechazar selección por pantalla y API; derivar a personal autorizado. |
| Paciente ve turno de limpieza cargado por personal | Permitir consulta/confirmación y cancelación según política; rechazar elección directa de reemplazo. |
| Administrador de entidad intenta operar agenda o chat solo por su cargo | Rechazar; exigir actuación y facultad específica vigentes. |
| Representante tiene facultad de turnos e intenta leer chat o actuar por otro paciente | Rechazar sin facultad de conversación o vínculo sobre ese paciente. |
| Dos entidades compiten por el mismo profesional | Una ocupación válida; la otra recibe conflicto sin datos de la entidad o paciente ajenos. |
| Profesional inicia gestión por ausencia con turnos confirmados y pendientes | Incluir a todos los afectados en el WhatsApp; el aviso no reemplaza ni confirma turnos. |
| Administrador local da baja a profesional | Finalizar permisos institucionales; conservar cuenta, fichaje, historia y otros vínculos. Revisar turnos con procedimiento definido. |
| Recuperación de contraseña de cuenta con membresía revocada | Recuperar credencial sin reactivar permisos ni acceso revocado. |
| Celda pendiente o sin concesión se interpreta como permiso | Rechazar: se necesita una decisión y asignación explícitas antes de implementarla. |

## Mantenimiento y fuentes

Fuente única de celdas y condiciones: [matriz.json](permisos/matriz.json). Presentación: [plantilla de visualización](permisos/plantilla.html). Regenerar con `node scripts/generar-matriz-permisos.cjs`; un directorio adicional permite copiar la vista a la ubicación autorizada para mostrarla en conversación. El generador valida IDs, seis celdas por acción, marcas y archivos de referencia.

Este documento es un derivado; ante una discrepancia prevalecen las reglas y ADR vigentes. Cambiar una decisión exige el proceso documental correspondiente, no editar una celda silenciosamente. La preparación de esta matriz no altera aprobaciones anteriores.

- [R01 · R01 · Entidad y alcance](03-reglas-del-dominio.md#r01-entidad-cliente-sede-y-entidad-de-cobertura-médica)
- [R01.a · R01.a · Aislamiento y numeración](03-reglas-del-dominio.md#r01a-aislamiento-y-numeración-de-pacientes)
- [R02 · R02 · Pre-reserva](03-reglas-del-dominio.md#r02-reserva-temporal-antes-de-completar-el-turno)
- [R02.a · R02.a · Abuso](03-reglas-del-dominio.md#r02a-prevención-de-reservas-abusivas)
- [R03 · R03 · Capacidad entre entidades](03-reglas-del-dominio.md#r03-exclusión-del-mismo-profesional-entre-entidades)
- [R04 · R04 · Delegación de agenda](03-reglas-del-dominio.md#r04-delegación-explícita-de-cada-agenda)
- [R05 · R05 · Desvinculación](03-reglas-del-dominio.md#r05-autonomía-y-desvinculación-del-profesional)
- [R06 · R06 · Práctica y agenda](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda)
- [R07 · R07 · Cobertura](03-reglas-del-dominio.md#r07-coberturas-y-convenios-de-atención)
- [R08 · R08 · Asistencia y plazos](03-reglas-del-dominio.md#r08-confirmación-de-asistencia-y-plazos)
- [R09 · R09 · Representación](03-reglas-del-dominio.md#r09-menores-y-representación)
- [R09.a · R09.a · Admisión](03-reglas-del-dominio.md#r09a-admisión-habilitación-y-solicitud-de-empadronamiento)
- [R10 · R10 · Plataforma](03-reglas-del-dominio.md#r10-administrador-de-plataforma-y-evolución-de-suscripciones)
- [R10.a · R10.a · Recuperación](03-reglas-del-dominio.md#r10a-recuperación-de-credenciales-y-alta-de-usuarios)
- [R11.a · R11.a · Chat](03-reglas-del-dominio.md#r11a-chat-del-portal-para-consultas-al-profesional)
- [R11.b · R11.b · Reprogramación del profesional](03-reglas-del-dominio.md#r11b-reprogramación-por-motivos-del-profesional)
- [R12 · R12 · Auditoría](03-reglas-del-dominio.md#r12-auditoría-trazabilidad-y-memoria-del-proyecto)
- [S · S01–S16 · Seguridad beta](06-seguridad-beta.md)
- [ADR-009 · ADR-009 · Consulta y catálogo](arquitectura/adr/009-catalogo-inicial-y-personalizacion.md)
- [ADR-010 · ADR-010 · Alcance administrativo](arquitectura/adr/010-ficha-de-referencia-y-alcance-administrativo.md)
- [ADR-011 · ADR-011 · Transición y cuenta persistente](arquitectura/adr/011-transicion-administrada-del-profesional.md)
- [ADR-012 · ADR-012 · Recuperación del equipo](arquitectura/adr/012-recuperacion-y-alta-de-usuarios.md)
- [ADR-013 · ADR-013 · WhatsApp obligatorio](arquitectura/adr/013-reprogramacion-profesional-por-whatsapp.md)
- [DOC12 · Documento 12 · Acceso](12-acceso-con-aprobacion-administrativa.md)
- [DOC16 · Documento 16 · Detalle de catálogo propuesto](16-catalogo-de-practicas.md)
- [DOC18 · Documento 18 · Campos de ficha propuestos](18-ficha-paciente-y-cobertura-medica.md)
- [DOC20 · Documento 20 · Alta e invitaciones propuestas](20-registro-de-usuarios-y-recuperacion-de-acceso.md)
- [CU · Documento 21 · Casos de uso para revisión](21-casos-de-uso.md)
