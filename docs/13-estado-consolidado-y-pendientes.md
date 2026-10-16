# Estado consolidado del proyecto y decisiones pendientes

Actualización: 16 de octubre de 2026. Fuente: conversación y documentación local, incluido el seguimiento técnico ya registrado. La limpieza anterior no consultó fuentes externas. La ampliación de acceso incorpora las fuentes técnicas de docs/20. La especificación de casos de uso del 16/10 se basa exclusivamente en documentación local vigente. No se modificaron automatizaciones.

**Estado:** diseño general aceptado en ADR-001 a ADR-008, con catálogo y restricción de selección confirmados en ADR-009. Los detalles nuevos del catálogo siguen propuestos para revisión. Aplicación, integraciones, despliegue y pruebas de producto pendientes.

**Casos de uso preparados para revisión:** [documento 21](21-casos-de-uso.md), [HTML navegable](casos-de-uso/index.html) y [PDF](../output/pdf/casos-de-uso-salud.pdf). Desarrollan 37 fichas, 7 diagramas y 16 escenarios integrales con precondiciones, alternativas, garantías, aceptación y trazabilidad. La descomposición y el detalle propuesto no cierran matriz de permisos, transiciones ni D01-D16. CU-35 conserva el alta de entidad como propuesta no aprobada; CU-36/CU-37 son subfunciones obligatorias del registro de turnos. No cambian reglas aceptadas ni agregan implementación.

**Matriz de permisos preparada para revisión:** [documento 22](22-matriz-de-permisos.md), con 46 acciones por seis actores y cinco operaciones técnicas. Explicita entidad/recurso/acción, facultades de representación, delegación y restricciones; conserva como pendientes las asignaciones no aprobadas. Incluye fuentes por acción y criterios para verificar en la futura aplicación, sin declarar pruebas ejecutadas. No cierra D03/D08/D14 ni sustituye las reglas o ADR vigentes.

**Alcance reafirmado en [ADR-010](arquitectura/adr/010-ficha-de-referencia-y-alcance-administrativo.md):** esta versión mantiene solo turnos y gestión administrativa. La ficha dental aportada sirve para estudiar datos personales y de cobertura; odontograma y demás especificaciones clínicas quedan excluidos. Los [campos y distinción administrativa](18-ficha-paciente-y-cobertura-medica.md) siguen propuestos para revisión.

Este documento resume el estado actual; las [reglas R01-R12](03-reglas-del-dominio.md) conservan el detalle funcional, el [catálogo](16-catalogo-de-practicas.md) la especificación de prácticas y los ADR la historia de decisiones. Los análisis sustituidos se encuentran en el [archivo histórico](archivo/2026-10-15-analisis-sustituidos.md).

**Ampliación de acceso en [ADR-012](arquitectura/adr/012-recuperacion-y-alta-de-usuarios.md):** recuperación de contraseña por email confirmada para secretaría, administradores y profesionales. [Documento 20](20-registro-de-usuarios-y-recuperacion-de-acceso.md) y maqueta local preparados para revisar pantallas, invitaciones y alta del solicitante comercial mediante cuenta personal + formulario + habilitación por plataforma. Esta propuesta de alta no está aprobada; no hay backend ni envío de correos. Para sus controles técnicos se consultaron las fuentes primarias citadas en ese documento, fuera de la limpieza anterior.

**Ampliación de canales en [ADR-013](arquitectura/adr/013-reprogramacion-profesional-por-whatsapp.md):** la reprogramación por motivos del profesional debe avisarse expresamente por WhatsApp a todos los pacientes con turnos afectados por fecha o intervalos, incluso confirmados, con enlace al portal para gestionar el reemplazo. Es independiente del respaldo T-36. La autoselección sigue limitada a «Consulta» habilitada; otras prácticas pasan a personal autorizado. El [detalle de operación](04-canales-y-costos.md#reprogramación-por-motivos-del-profesional-whatsapp-obligatorio) es propuesto para revisión; no hay implementación ni envíos reales.

## Decisiones vigentes

| Área | Decisión aceptada | Límite o detalle pendiente |
| --- | --- | --- |
| Producto | Odontología inicial y núcleo administrativo extensible a otras ramas | Validar ofertas, duración y recursos reales con profesionales del piloto; sin historia clínica especializada |
| Clientes | ADR-011 confirma continuidad independiente del profesional con su fichaje, baja institucional por administrador local y cuenta persistente. Eliminación de cuenta/vínculos solo a petición expresa del profesional; conservar fichas e historial de pacientes | Precisar modelo por entidad, pacientes compartidos, permisos, fecha, numeración, turnos y procedimiento de eliminación; ver [transición](19-desvinculacion-y-transicion-del-profesional.md) |
| Privacidad | Fichas, turnos y chats por entidad; `tenant_id`, integridad de relaciones y RLS adicional | SQL/políticas y pruebas con rol real, sin bypass, contexto transaccional y conexiones reutilizadas |
| Numeración | Serie por profesional y entidad, común a sus agendas locales, separada del ID interno; estabilidad y huecos reafirmados expresamente por el responsable el 15/10/2026 en ADR-001 | La baja del 12 no renumera al 13 ni a los posteriores; conservar el 12 para el vínculo original, sin reutilizarlo. Modelar contador, importación y fusión auditada |
| Secretaría | Membresía + delegación por agenda/persona/acción, otorgada por profesional | Revocación efectiva aun con pantalla abierta. Administración de entidad no sustituye delegación |
| Admisión | Conocido habilitado por personal; nuevo por formulario propio protegido y aceptación administrativa | Facultad de admisión explícita; registro/aceptación no otorga contraseña al personal ni demuestra DNI por sí solo |
| Cuenta y login | Cuenta reutilizable; aprobación persistente, activación/vínculo verificados; Google y alternativa por correo como dirección de beta | Modalidad de correo, sesión, recuperación y enlace de identidades por diseñar. Teléfono/Facebook/Apple no exigidos por la imagen |
| Acceso del equipo | Recuperación de contraseña por email para secretaría, administración y profesionales, ADR-012 | Revisar pantallas, contraseña local, sesión/MFA, tokens, límites y proveedor; no reactivar permisos por restablecer credenciales |
| Alta de quien gestiona la adquisición | Analizar registro comercial manteniendo incorporación controlada de beta | Propuesta: formulario + cuenta personal verificada + revisión de plataforma. Separar contacto comercial, administrador y entidad; invitaciones al equipo. Contratos/cobro siguen en I2/I3 |
| Estados de acceso | Solicitud pendiente, aprobado con activación pendiente, activo, rechazado y suspendido/revocado | Concretar transiciones, responsables, plazos y revisión. Sin facultades privadas antes de activación |
| Menores | Incluidos con representantes y facultades verificadas, separando actor y paciente | Evidencia, conflictos, privacidad y destinatarios; sin acceso familiar automático |
| Prácticas | Base: consulta, extracción, limpieza y cirugía; ampliable mediante facultad explícita. Paciente elige solo la práctica «Consulta» habilitada sin gestión obligatoria del personal | Otras prácticas y sus nuevos horarios por personal autorizado; sin umbral universal de minutos. Revisar facultades de catálogo, estados y versiones propuestos; validar tiempos y ofertas |
| Capacidad | Pre-reserva breve persistida; registro y asistencia separados; registro directo si cumple reglas | TTL/renovaciones por fijar; aceptación manual solo bajo política explícita, distinta de admisión del paciente |
| Varias entidades | Exclusión global de intervalos del mismo profesional, revelando solo disponibilidad/conflicto | Verificación de identidad profesional, restricciones y pausas de traslado; agendas externas no sincronizadas automáticamente |
| Confirmación | Un correo T-72/T-48, WhatsApp T-36 pendiente y cancelación/liberación/aviso interno T-24 sin confirmar | Delimitar excepciones, turnos cercanos y fallos; registrar confirmación telefónica. Leer o iniciar sesión no confirma |
| Reprogramación del profesional | WhatsApp obligatorio a todos los turnos afectados por fecha/intervalos, incluidos confirmados; enlace al portal, ADR-013 | Revisar permisos/lote, estados del original, indisponibilidad, plantilla, plazo, reintentos y seguimiento asistido. Solo «Consulta» habilitada permite elegir nuevo horario al paciente |
| Chat | Texto humano persistido, paciente-profesional, respuesta diferida y avisos internos | Participantes, horarios, límites y conservación. Secretaría requiere permiso específico; texto no cambia agenda |
| Abuso | Admisión controlada, cuotas de pre-reservas y turnos futuros incluidos confirmados, límites de velocidad, anti-bot, gasto y revisión | Números y proveedor anti-bot por validar; controles atómicos, familias contempladas y sin bloqueos por DNI declarado por terceros |
| Trazabilidad | Historial cronológico con actor real, paciente representado, entidad, acción, cambios, motivo y resultado | Matriz de eventos/conservación; sin credenciales ni copia indiscriminada de cuerpos a logs |
| Tecnología | Angular, Spring Boot y PostgreSQL estables compatibles; autorización en API; dirección de monolito modular | Fijar versiones al implementar; no adoptar previews. Bibliotecas, sesión y migraciones requieren especificación |
| Operación | VPS con capacidad demostrada, backups externos protegidos, restauración, monitoreo y revisión de versiones | Proveedor, región, presupuesto, RPO/RTO y carga acordados antes del piloto; no promesa de cero incidentes |
| Comercial | Costos de comunicación integrados al precio total, con alcance transparente y sin recargo API sorpresivo | Precio, inclusión y excepciones de uso por resolver; sin mensajes ilimitados ni precios aprobados por los ejemplos |

La aceptación adopta la dirección de diseño y los controles descritos. Los ejemplos de cuota, minutos, tarifas, VPS, concurrencia o recuperación siguen siendo hipótesis; el detalle técnico debe hacer verificable cada decisión.

## Recorrido de beta

1. Personal con permiso administrativo registra al conocido o revisa la solicitud propia del nuevo. El formulario público protegido no crea capacidad, turno ni chat privado.
2. Comprueba contacto, correspondencia con ficha y representación; decide el contexto autorizado y registra la admisión. Coincidencias de DNI, nombre, correo o teléfono no fusionan identidades ni fichas automáticamente.
3. Invitación/activación verificable vincula la cuenta. Google u otro método demuestra control de credenciales; el backend exige habilitación vigente y alcance correcto. No se repite la aceptación en cada ingreso.
4. Paciente o representante elige la práctica «Consulta» elegible. Servidor valida práctica, convenio, permisos, cuotas y disponibilidad; adquiere bloqueo breve de manera atómica. Para otras prácticas, pide gestión a personal autorizado sin ocupar un intervalo por el mensaje.
5. Completar el pedido conserva la ocupación y registra el turno pendiente de asistencia, con duración y reglas aplicadas. No mantiene abierta una transacción durante el formulario.
6. Un correo entre T-72/T-48 deriva al portal. A T-36 sin confirmación válida, WhatsApp. A T-24 sin confirmar y sin excepción operativa aplicable, cancelar/liberar y persistir aviso interno a secretaría y/o profesional autorizados. Reprogramar invalida enlaces/tareas anteriores; confirmar tarde no restaura el turno cancelado.
7. Portal y chat aplican siempre permisos actuales. Revocación local impide nuevas operaciones sin borrar cuenta, historia o autorizaciones de otra entidad. No cancela automáticamente turnos vigentes.
8. Si el profesional requiere reprogramar una fecha o intervalos, generar WhatsApp para todos los afectados, incluidos confirmados. Propuesta: bloquear indisponibilidad, conservar historial e invalidar tareas antiguas, y seguir cada aviso y reemplazo hasta su resolución. El portal permite elegir otra «Consulta» habilitada o deriva otras prácticas y casos sin disponibilidad a personal autorizado; recibir el aviso no asigna un turno.

El cierre, liberación, auditoría y aviso interno persistido deben ser consistentes. No se reasigna a lista de espera automáticamente. Fallo técnico, canal no utilizable o presupuesto agotado requiere revisión: no es por sí solo motivo para cancelar. Las excepciones asistidas se definen explícitamente sin anular el cierre general T-24.

## Escala y evaluación económica

| Magnitud | A tres meses | Objetivo anual |
| --- | --- | --- |
| Profesionales en uso | Aproximadamente 20 | Hasta 100 |
| Vínculos con pacientes, a 100 por profesional | 2.000 | 10.000 |
| Turnos mensuales, a uno por vínculo | 2.000 | 10.000 |
| Correos solo de solicitud de confirmación | Hasta 2.000 | Hasta 10.000 |
| Respaldo WhatsApp si lo requiere el 10%, hipótesis | 200 | 1.000 |

Los vínculos no equivalen a pacientes únicos. 120.000 turnos/año corresponde a un ritmo constante de 10.000 al mes, no al primer año de crecimiento. Pico profesional L-V 08-20; portal y tareas continúan fuera de ese horario. Usuarios registrados no determinan sesiones simultáneas.

El [modelo de comunicaciones y abono](09-portal-correo-y-membresia.md) reúne los supuestos y costos ilustrativos del flujo vigente. El [presupuesto y operación](08-presupuesto-y-operacion.md) cubre costo integral, VPS y referencias técnicas. No hay precio, cupo ni rentabilidad aprobados. Las estimaciones previas de ofertas y tres avisos por turno se retiraron de las guías y quedaron archivadas.

## Evolución futura y exclusiones

- **I2/I3:** motor de suscripciones, cobro del SaaS, renovaciones, morosidad, suspensión comercial y tratamiento de datos al finalizar la contratación. La privacidad básica de datos reales y la revocación por seguridad pertenecen a beta.
- **Visión futura:** catálogo público de profesionales autorizados para publicación y solicitud simplificada de empadronamiento, reutilizando cuenta y datos básicos que el paciente acepte compartir. Elegibilidad comercial y política de nuevo vínculo por entidad/profesional todavía en análisis; una cuenta existente no abre automáticamente agendas ajenas. Sin transferencia automática de fichas, turnos o chat.
- **Pendiente de alcance:** IA administrativa. El chat aceptado es humano; no se incorpora IA clínica. Adjuntos, audio, video, APIs de cobertura, cobros de pacientes, historia clínica, agenda grupal, calendario externo y lista de espera automática requieren decisiones propias.

## Pendientes concretos antes de construir y entregar

| Prioridad | Resolver | Referencia |
| --- | --- | --- |
| 1 | Base y personalización confirmadas; revisar detalle propuesto del catálogo y concesión de facultad; validar duración, pausas, recursos, modalidad, cobertura, sedes y condiciones de atención individual | D05-D06; docs/15 P01-P06; docs/16 |
| 2 | Matriz de permisos por recurso y estados de admisión/turno/asistencia/representación; revisar recuperación del equipo y alta del solicitante de docs/20; vinculación, sesión/MFA y revocación | D03, D08, D14; ADR-012 |
| 3 | TTL, renovaciones, cuotas de futuros/pre-reservas, solicitudes, códigos/chat y excepciones familiares; umbrales y respuesta al abuso | D01, D15 |
| 4 | Instante del correo, turnos cercanos, fin de semana/horas de contacto, fallos, ejecución tardía, asistencia telefónica y carrera exacta T-24; límite de cancelación voluntaria | D07 |
| 5 | Proveedores, remitentes, plantillas, contacto autorizado, bandeja responsable y aviso al paciente tras cancelación; presupuesto y límites. Reprogramación: concretar lote, estados, indisponibilidad, plazo y seguimiento; WhatsApp confirmado | D09; ADR-013 |
| 6 | SQL/RLS, contador y claves por entidad, verificación del profesional/coordinador y salida de una entidad | D02, D04, D12 |
| 7 | Chat: inicio de conversación, participantes, atención, conservación y correcciones | D13 |
| 8 | Entidades piloto, concurrencia, retención, versiones fijadas, VPS, costo integral, RPO/RTO, restauración y evidencia de seguridad/carga | D11, D16 |

D10 (comercial) y política entre entidades/catálogo de D14 se resuelven en su alcance futuro, sin impedir el diseño de admisión local de beta. [Plan](02-plan-de-trabajo.md), [criterios de beta](05-incrementos-y-beta.md) y [seguridad](06-seguridad-beta.md) concretan la evidencia requerida. No se declaran superados controles por documentarlos.

## Consulta de antecedentes y revisión

Los ADR identifican las decisiones y sus precisiones posteriores. El [archivo histórico](archivo/2026-10-15-analisis-sustituidos.md) conserva los análisis descartados o sustituidos; no rige el funcionamiento del producto. El [registro de limpieza](17-revision-y-limpieza-documental.md) indica los ajustes de esta revisión.

La revisión de textos y enlaces no constituye prueba de producto, certificación, cotización vigente ni contratación.
