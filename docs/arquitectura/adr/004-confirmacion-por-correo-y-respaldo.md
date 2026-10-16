# ADR-004. Confirmación por correo y respaldo por WhatsApp

Fecha: 15 de octubre de 2026. Estado: aceptado el flujo correo/WhatsApp/portal y cancelación con liberación y aviso interno a T-24. Implementación y excepciones operativas pendientes.

**Ampliación posterior:** [ADR-005](005-chat-y-seleccion-de-consultas.md) incorpora chat humano y selección de horarios por paciente solo para la práctica «Consulta» habilitada. El cronograma de este ADR también se aplica a turnos de otras prácticas registrados por personal; la restricción de elegir horario no impide confirmar asistencia. Chat humano incluido en beta; IA sigue pendiente.

## Instrucción y relación con decisiones anteriores

El responsable definió correo entre 72 y 48 horas antes de un turno ya reservado para derivar al portal de autogestión; si no hay confirmación, WhatsApp a las 36 horas previas con el mismo destino. Aclaró expresamente que a las 24 horas sin confirmar se debe “Cancelar, liberar horario y notificar en plataforma a secretaria y/o profesional de la liberación del mismo”. Esta aclaración resuelve el término “reserva” del mensaje inicial.

Este ADR concreta correo primero y WhatsApp de respaldo de ADR-003 como flujo de confirmación del incremento 1. Ambos canales deben estar integrados y verificados para declarar disponible este flujo. Los proveedores, costos y parámetros operativos no se aprueban por registrar el requisito. Portal es el lugar de la acción; chat humano se incorporó posteriormente en ADR-005 y la IA sigue pendiente. ADR-008 consolida estas decisiones sin reabrir el cronograma.

## Cronograma aceptado

T es el inicio vigente del turno. Las anticipaciones son horas transcurridas, no días hábiles ni el momento de la pre-reserva.

| Hito | Condición | Acción |
| --- | --- | --- |
| Entre T-72 y T-48 horas | Turno registrado, vigente y sin asistencia confirmada | Un pedido de confirmación por correo con enlace al portal; registrar el instante programado dentro de la ventana |
| T-36 horas | Turno vigente y sigue sin confirmación válida | Aviso de respaldo por WhatsApp con enlace al portal |
| T-24 horas | Turno vigente y sigue sin confirmación válida, bajo la política automática y sin excepción operativa vigente | Cancelar por falta de confirmación, liberar capacidad y generar aviso en plataforma a secretaría y/o profesional autorizados de esa agenda |
| Confirmación válida | Paciente, representante habilitado o personal autorizado que registra confirmación telefónica | Conservar capacidad y descartar solicitudes de confirmación o respaldos que ya no correspondan |

La ventana de correo no significa enviar obligatoriamente dos correos, uno a las 72 y otro a las 48. Elegir y registrar un instante dentro del intervalo; detalles de configuración pendientes. No enviar WhatsApp por falta de un evento de apertura: la condición es que no se haya registrado confirmación válida del turno.

El cierre T-24 es la regla general aceptada de no respuesta; deja de ser una elección genérica pendiente entre liberar o conservar. Las excepciones asistidas y por fallos técnicos previamente aceptadas se delimitan expresamente antes de implementar; no se aplican silenciosamente a todas las agendas ni se descartan por omisión.

## Cancelación y notificación interna

El cambio de estado, la liberación de la ocupación y el registro persistido del evento/aviso deben ser consistentes en una misma transacción o garantía equivalente. Motivo identificable: falta de confirmación al plazo. Conservar turno e historia; no borrar el registro. La notificación interna identifica entidad, agenda, profesional, turno, fecha/hora liberada, motivo y fecha/hora de ejecución; solo acceden personas con permiso vigente. Destinatarios: secretaría autorizada y/o profesional correspondiente según configuración; debe existir un destinatario o bandeja autorizada responsable, no un evento huérfano. Registrar lectura/gestión del aviso cuando se concrete ese diseño.

El aviso interno requerido no implica enviar otro WhatsApp a secretaría o profesional ni reasignar el turno automáticamente. La disponibilidad liberada podrá ofrecerse a una nueva solicitud válida. El portal del paciente refleja la cancelación; se conserva el requisito previo de informar al paciente con contenido/canal externo por concretar, sin añadir un WhatsApp adicional por suposición.

## Consistencia y excepciones

- Revalidar entidad, permisos, contacto autorizado, fecha/hora y estado antes de ejecutar cada tarea. Confirmar, cancelar o reprogramar invalida avisos obsoletos; el nuevo horario recalcula hitos e invalida enlaces anteriores.
- Persistir tareas, identificadores y resultados. Reintentos/eventos repetidos no deben producir cambios duplicados; diseñar tratamiento de posibles envíos duplicados del proveedor sin prometer entrega exactamente una vez.
- Abrir correo, enlace o portal no confirma asistencia. GET muestra la acción; confirmación explícita valida autorización y estado. No confirmar automáticamente por una respuesta libre al correo o WhatsApp.
- Mantener auditoría de autor real, política/versión aplicada, destinatario, canal, programación, intentos y respuesta autorizada. No exponer credenciales, datos clínicos innecesarios ni detalles de otras entidades.
- Fallo técnico, contacto ausente/no autorizado o presupuesto agotado genera tratamiento operativo/revisión por personal; no liberar por ese motivo. La excepción asistida y confirmación telefónica previamente aceptadas siguen vigentes salvo instrucción expresa que las cambie.
- Resolver turnos creados con menos de 48, 36 o 24 horas, caídas que impidan ejecutar a tiempo, horarios de contacto, fines de semana y límites de cancelación/reprogramación. No ejecutar retrospectivamente todo el cronograma ni cambiar plazos silenciosamente.
- Confirmación y cierre/reasignación concurrentes requieren una decisión atómica sobre el turno y su capacidad. Una confirmación después de la cancelación no reactiva automáticamente el turno ni recupera un horario ocupado. La nueva reserva sigue el flujo ordinario. Precisar el desempate al instante exacto de T-24 en el modelo; no prometer dos resultados simultáneos.

## Evidencia requerida antes de entregar el flujo

1. Correo programado una vez dentro de T-72/T-48 para un turno elegible, con enlace al portal y destinatario autorizado.
2. Confirmación antes de T-36 suprime el respaldo; sin confirmación se programa/envía WhatsApp a T-36, con eventos autenticados y tratamiento de fallos.
3. Lectura, precarga de enlace o ingreso sin acción explícita no suprime el respaldo ni confirma asistencia.
4. Confirmación posterior al respaldo y anterior al cierre conserva el turno; eventos repetidos no duplican la confirmación.
5. Reprogramación/cancelación impide aplicar tareas o enlaces del horario anterior.
6. A T-24 sin confirmar, cancelar/liberar una sola vez y crear aviso interno para secretaría/profesional autorizados; conservar historia. Probar competencia con confirmación y nueva reserva, fallo/reinicio después de guardar, reintentos del worker y acceso de otra entidad. Un aviso interno persistido no se pierde por fallar su entrega visual.
7. Probar representación, confirmación telefónica, contacto inválido, cuotas y horario cercano con las políticas de excepción resueltas.

## Efecto sobre presupuesto y abono comercial

El flujo confirmado requiere un correo de solicitud por turno elegible y un WhatsApp solo para el subconjunto no confirmado a T-36. Comprobantes, cambios, recuperación y avisos finales son eventos distintos: no contarlos como incluidos o gratuitos por este cronograma. Los análisis sustituidos están en el [archivo histórico](../../archivo/2026-10-15-analisis-sustituidos.md). Precio, cupos y consumo adicional siguen pendientes; la dirección aceptada integra comunicaciones al abono comercial total.
