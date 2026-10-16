# ADR-013. Aviso por WhatsApp ante reprogramación del profesional

Fecha: 15 de octubre de 2026. Estado: requisito y canal WhatsApp confirmados por el responsable; detalle operativo propuesto para revisión. Incremento 1. Reglas relacionadas: R02, R03, R04, R06, R08, R09, R11 y R12. Sin implementación ni envíos reales.

## Contexto y fuente

El responsable solicita avisar a todos los pacientes cuyos turnos resulten afectados por una reprogramación motivada por el profesional, para una fecha o uno o varios intervalos, y derivarlos a la plataforma de autogestión para gestionar nuevos turnos. En una aclaración posterior indica expresamente que este aviso debe utilizar WhatsApp.

## Requerimiento confirmado

- Generar un aviso por WhatsApp para todos los pacientes con turnos vigentes afectados, incluidos quienes ya confirmaron asistencia. Para menores o pacientes representados, usar el destinatario con facultades verificadas.
- Incluir enlace a la plataforma de autogestión para gestionar el reemplazo del turno. El envío, la lectura o el clic no asignan un nuevo horario ni confirman asistencia.
- Este WhatsApp responde al cambio del profesional: no depende de asistencia pendiente ni espera a T-36. ADR-004 conserva su flujo de confirmación para turnos vigentes.
- Mantener la selección de horarios de ADR-005/009: paciente o representante elige únicamente la práctica «Consulta» habilitada. Para otras prácticas, el portal deriva a gestión de personal autorizado. La derivación a autogestión no amplía permisos.

## Desarrollo operativo propuesto

El [flujo de canales](../../04-canales-y-costos.md#reprogramación-por-motivos-del-profesional-whatsapp-obligatorio) desarrolla selección de afectados, revisión previa, bloqueo del período no disponible, historial del turno original, tareas persistidas, reintentos y seguimiento de pendientes. Es una propuesta de funcionamiento, no una implementación ni aprobación de todos sus detalles.

La operación debe quedar vinculada al profesional, entidad, agendas autorizadas, fecha/intervalos y motivo interno. No exponer a los pacientes el motivo privado del profesional, listas de destinatarios ni información de otros turnos. Usar mensajes individuales.

## Consecuencias y pendientes

Incluir estos envíos y sus reintentos en el presupuesto técnico de WhatsApp por entidad, por separado del respaldo T-36. Un correo puede ser complementario si se acuerda; no sustituye el WhatsApp requerido para este evento. Sin contacto utilizable, autorización o entrega, conservar el caso pendiente y derivarlo a personal autorizado para resolución asistida.

Antes de implementar: concretar permisos para iniciar/aprobar el lote, estados y liberación de la ocupación original, límites temporales e intervalos, plantilla, plazo de envío, reintentos, política de contacto, falta de disponibilidad, tratamiento de fallos y cierre asistido. Si el profesional afecta agendas de varias entidades, procesar cada contexto por separado con permisos propios. No hay prueba funcional ni integración acreditada por este ADR.
