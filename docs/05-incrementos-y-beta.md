# Ciclo incremental y alcance de V1 beta

Actualización: 15 de octubre de 2026. El responsable definió el alcance funcional y difirió suscripciones. Las propuestas de producto 1-5 fueron aceptadas en ADR-002; stack actual y VPS confirmados. ADR-008 consolida la aceptación del diseño y de los controles básicos; especificaciones y parámetros pendientes. La distribución concreta de I2/I3 sigue por resolver. Ver [estado consolidado](13-estado-consolidado-y-pendientes.md).

## Objetivo del primer incremento

Entregar a profesionales interesados una **beta funcional de un SaaS multientidad para gestionar el contexto completo de turnos**, con credenciales y roles correctamente configurados. La beta debe permitir operar y validar el producto; todavía no hay implementación.

**Alcance vigente:** prevención de conflictos entre entidades, portal principal y flujo de ADR-004: correo T-72/T-48, WhatsApp T-36 sin confirmar y cancelación/liberación T-24 con notificación interna a secretaría y/o profesional autorizados. Ambos canales deben integrarse y verificarse antes de entregar el flujo. Proveedores y excepciones operativas pendientes; WhatsApp sigue como respaldo.

**Ampliación aceptada ADR-005:** chat humano paciente-profesional para consultas adicionales. Paciente/representante elige horarios solo de la práctica «Consulta» habilitada; todas las demás prácticas, incluidas las personalizadas, se asignan por secretaría autorizada/profesional, también al reprogramar. Confirmación de turno propio sigue disponible aunque lo haya agendado personal. IA pendiente.

**Admisión ADR-007:** personal administrativo autorizado registra datos o acepta formulario antes del acceso privado. Aprobación persistente, activación/vinculación verificadas y login válido; autenticación externa sola no concede permisos. Formulario propio y dirección Google + alternativa por correo aceptados; estados pendiente/aprobado con activación pendiente/activo/rechazado/suspendido aceptados como modelo. Métodos concretos, verificación, transiciones y plazos por especificar. Cuenta reutilizable aceptada; política del nuevo vínculo entre entidades en análisis; catálogo futuro no adelanta suscripciones.

La beta culmina el incremento 1. Las etapas de estudio, arquitectura, construcción, verificación y piloto son pasos dentro de ese incremento, no incrementos distintos del producto.

## Incremento 1: contexto de turnos

Incluye lo estudiado sobre turnos en R01-R12:

- Formulario propio protegido, admisión administrativa y activación/vinculación verificadas antes de acceso privado; recuperación y enlace de identidades seguros.
- Prevención de abuso por capas de R02.a: cuotas de pre-reservas y turnos futuros incluidos confirmados, frecuencia, anti-bot, límites de mensajes/gasto, alertas y revisión; valores/proveedor pendientes.
- Incorporación controlada de entidades, profesionales y usuarios; identidad, credenciales, roles, membresías y recuperación/revocación de acceso.
- Contrato aceptado del inciso 5: tablas compartidas con `tenant_id`, relaciones dentro de la entidad y PostgreSQL RLS adicional a los permisos del backend.
- Serie de pacientes por profesional dentro de cada entidad, independiente del ID interno de la ficha; asignación concurrente sin duplicados y conservación del vínculo en reintentos. Ver R01.a.
- Dimensionamiento con objetivo de 20 profesionales en uso a tres meses y hasta 100 al año, usando volumen derivado y concurrencia por validar; no es un límite ni una capacidad medida.
- Agendas por consultorio, autonomía profesional y delegación explícita a secretaría dentro de su entidad.
- Baja institucional por administrador local y transición administrada por plataforma, conservando cuenta e identidad y dando continuidad independiente al fichaje vinculado al profesional. Cuenta persistente; eliminación de cuenta/vínculos solo a petición expresa del profesional, conservando fichas e historial de pacientes. Modelado por entidad, datos compartidos, numeración, permisos, turnos y procedimiento de eliminación pendientes. ADR-011; el motor comercial de contratación individual sigue en I2/I3.
- Prácticas, duraciones, pausas, horarios recurrentes y excepciones. Base confirmada en ADR-009: consulta, extracción, limpieza y cirugía, ampliable mediante facultad explícita de añadir prácticas personalizadas. Ver [catálogo y criterios de aceptación](16-catalogo-de-practicas.md); detalles propuestos y tiempos reales pendientes.
- Pre-reserva temporal, exclusión de intervalos incompatibles del mismo profesional entre entidades y registro definitivo del turno.
- Coberturas y convenios configurados por entidad de cobertura médica, plan, profesional, agenda, práctica y vigencia.
- Autogestión de selección de la práctica «Consulta» habilitada y gestión por personal autorizado de otras prácticas; menores/representantes con las mismas restricciones y facultades verificadas.
- Chat de consultas adicionales paciente-profesional, con mensajes persistidos, participantes autorizados, autoría y tratamiento de pendientes. Secretaría no accede por tener permiso de agenda.
- Confirmación de asistencia, cancelación, reprogramación, llegada, atención e inasistencia.
- Reprogramación por motivos del profesional para fecha/intervalos: aviso obligatorio por WhatsApp a todos los pacientes con turnos afectados, incluso confirmados, con enlace a autogestión. Requisito confirmado en [ADR-013](arquitectura/adr/013-reprogramacion-profesional-por-whatsapp.md); el [detalle de operación](04-canales-y-costos.md#reprogramación-por-motivos-del-profesional-whatsapp-obligatorio) queda propuesto para revisión, conservando selección solo de «Consulta» habilitada.
- Portal para acciones del paciente; un correo de solicitud T-72/T-48 y respaldo WhatsApp T-36 si no confirmó. A T-24 cancelar/liberar y avisar en plataforma a secretaría y/o profesional autorizados, conservando historia. No prometer integraciones sin verificarlas.
- Auditoría, reportes operativos básicos y soporte acotado de plataforma.
- Seguridad básica incluida desde diseño y verificada antes de entregar la beta: [evaluación de seguridad](06-seguridad-beta.md).

Antes de implementar cada flujo deberán resolverse sus parámetros pendientes. Se aceptan registro directo y cronograma de ADR-004, con cierre T-24 resuelto. Quedan TTL, instante del correo en su ventana, excepciones asistidas/técnicas y de turnos cercanos, ejecución tardía, contacto, límite de cancelación voluntaria y representación. Confirmación telefónica trazable sigue vigente. Objetivo: 20 profesionales a tres meses y hasta 100 al año, pico L-V 08-20; no determina concurrencia ni limita el portal a esa franja.

## Capacidades diferidas por decisión del responsable

Los controles comerciales de suscripción se evaluarán en el **incremento 2 o 3**:

- Planes, precios, abonos, altas comerciales, renovaciones y cobro del SaaS.
- Morosidad, gracia, suspensión, cancelación y finalización de suscripciones.
- Adicionales comerciales de mensajería y facturación de excedentes.
- Políticas de acceso, conservación, exportación, transferencia o eliminación vinculadas a la finalización de una suscripción.

La beta no necesita un motor de suscripciones ni simulaciones de cobro. Registrar entidades para el piloto e incorporar profesionales son funciones operativas del incremento 1.

La protección básica de datos personales, el manejo de incidentes y la revocación de permisos por seguridad **pertenecen al incremento 1**. Si hay datos reales, definir responsables, avisos y tratamiento básico aplicable antes de su uso; las políticas comerciales diferidas no eximen de esas medidas.

La desvinculación profesional de un consultorio es un flujo de turnos de R05. La finalización de una suscripción del SaaS es otro proceso y se difiere. No confundir revocación de una delegación con suspensión comercial de un cliente.

## Ruta de evolución propuesta

| Incremento | Entrega u objetivo | Estado de alcance |
| --- | --- | --- |
| 1 | V1 beta: turnos, admisión/acceso, defensa contra abuso, seguridad, portal/chat y flujo correo/WhatsApp/cierre de ADR-004 | Diseño aceptado; especificaciones, parámetros, proveedores, implementación y evidencia pendientes |
| 2 | Evaluar gestión comercial de suscripciones, adicionales y mejoras del piloto | Propuesta de distribución, sin implementación ni asignación definitiva |
| 3 | Evaluar ciclo de fin de suscripción y políticas de datos asociadas; ampliar operación y seguridad | Propuesta de distribución; puede adelantarse al incremento 2 según revisión |

Los incrementos siguientes amplían la revisión de seguridad y corrigen hallazgos. Un defecto que permita acceso indebido o pérdida de datos en la beta requiere atención en el incremento 1, aunque se descubra al final de su construcción.

Historia clínica, cobros de pacientes, liquidaciones, APIs de entidades de cobertura médica y otras ampliaciones ya excluidas siguen como producto futuro; esta planificación no las incorpora automáticamente a los incrementos 2 o 3. El responsable reafirmó en [ADR-010](arquitectura/adr/010-ficha-de-referencia-y-alcance-administrativo.md) que odontograma y demás especificaciones clínicas de la ficha aportada quedan fuera de esta versión, que mantiene turnos y gestión administrativa. Esto no elimina el catálogo administrativo de prácticas, los estados de asistencia/atención ni la auditoría de operaciones.

## Criterios de entrega de la beta

1. Profesional configura una agenda y prácticas; secretaría autorizada puede operarla y una secretaría sin delegación no puede hacerlo.
2. Paciente o representante habilitado elige horarios solo de la práctica específica «Consulta» habilitada; recepción opera según delegación. Todos cumplen disponibilidad, elegibilidad, cuotas y demás reglas centrales.
3. Dos entidades que intentan ocupar al mismo profesional simultáneamente no obtienen reservas incompatibles; los detalles ajenos permanecen privados.
4. Vencimiento, abandono, reintentos y confirmación tardía de pre-reserva conservan consistencia.
5. Convenios incompatibles se detectan y se conserva la práctica, duración y cobertura elegida.
6. Correo programado una vez entre T-72/T-48 y respaldo WhatsApp T-36 solo si sigue sin confirmar. A T-24 cancelar/liberar y persistir aviso interno para secretaría y/o profesional autorizados una sola vez, con historia/motivo. Probar confirmación concurrente, reinicio/reintentos, reprogramación y nueva reserva; una respuesta posterior a cancelación no reactiva ni recupera capacidad ocupada. Verificar excepciones técnicas/asistidas y confirmación telefónica trazable.
7. Los casos de menores incluidos en el piloto tienen representación y destinatarios de avisos verificados según facultades acordadas.
8. Correo y WhatsApp oficial envían a contactos de prueba autorizados, registran entrega/fallo/rebote y procesan eventos autenticados. Los avisos internos son visibles solo para destinatarios autorizados de la agenda y no se pierden al reiniciar. Reintentos/fallos tienen tratamiento operativo. Simulación, apertura o clic no demuestran entrega real ni confirmación; no cancelar por esos eventos aislados.
9. El administrador opera cuentas y entidades sin acceso indiscriminado; revocar membresía/delegación funciona.
10. Los controles de seguridad del primer incremento tienen evidencia de verificación y una copia se restaura correctamente.
11. Hay instrucciones de uso, soporte y limitaciones conocidas; los profesionales reciben un alcance de beta explícito.
12. Configuración de canales, mensajes, contactos y credenciales del proveedor están aislados por entidad; un usuario o evento de A no obtiene ni altera comunicaciones de B.
13. Paciente reserva la práctica «Consulta» habilitada; no selecciona ni bloquea otra práctica, incluidas todas las personalizadas, ni una oferta de «Consulta» reservada a gestión del personal, tampoco por API, duración manipulada, formulario antiguo o reprogramación. Personal autorizado sí puede asignar esas prácticas; secretaría sin delegación no. Confirmar un turno propio de esa práctica sigue permitido según facultades.
14. Paciente y profesional autorizados intercambian mensajes con autoría/fechas y persistencia. Otros pacientes/entidades/profesionales y secretaría con solo permiso de agenda no acceden. Probar representación, revocación y reintentos. El texto de chat no modifica turnos ni genera automáticamente un WhatsApp.
15. Personal con permiso administrativo registra al conocido o acepta la solicitud del nuevo recibida por formulario propio antes del acceso privado. Probar pendiente/aprobado con activación pendiente/activo/revocado según diseño concreto: credencial externa válida sin aprobación no abre ficha, pre-reserva, reservas o chat. Reintento de solicitud no duplica; vinculación y cambio de proveedor no permiten apropiarse de cuentas. Aprobación persiste entre accesos, revocación se aplica con pantalla abierta y sin afectar permisos ajenos. La política entre entidades/catálogo requiere resolución propia.

16. Solicitudes, invitaciones, recuperación, chat y comunicaciones externas tienen límites verificables y alertas. Cuentas activas siguen sujetas a cuotas; turnos confirmados cuentan como futuros. Competencia paralela por cuota/capacidad no admite excedentes ni duplica avisos por reintento. Excepciones familiares verificadas funcionan y DNI declarado por terceros no suspende a la víctima. Restricciones temporales conservan confirmación/consulta legítimas y gestión de personal.
17. Google y alternativa por correo resuelven la cuenta correcta bajo el mecanismo que se especifique; añadir proveedor, cambiar contacto o recuperar acceso no permite apropiación de fichas. Personal no conoce credenciales del paciente. Los demás proveedores de autenticación quedan fuera de este recorrido de beta.

18. Catálogo admite las cuatro prácticas iniciales y nuevas personalizadas sin cambio de código fuente; solo actores con facultad pueden añadirlas. Crear una práctica no activa agendas ni permite eludir la selección de horarios limitada a la práctica «Consulta». Los escenarios HC-01 a HC-12 del [catálogo](16-catalogo-de-practicas.md) desarrollan la propuesta de aceptación, sujeta a revisión del detalle antes de implementar.

**Comprobaciones adicionales del inciso 5:** series independientes por profesional y entidad, sin duplicados ante concurrencia; una misma relación conserva el número en reintentos. Según el criterio aceptado al consolidar el análisis, visitas posteriores y reactivaciones mantienen el número, sin reutilizar confirmados. Ejecutar las pruebas de aislamiento con el rol real y conexiones reutilizadas tras éxito y fallo. Antes del piloto, acordar y verificar carga concurrente, tiempos de respuesta y recuperación con volumen representativo.

Portal, correo y WhatsApp de respaldo se exigen por ADR-004. ADR-005 incorpora explícitamente chat humano y selección de horarios limitada a la práctica «Consulta» como requisitos de beta. SMS/push e IA siguen como opciones pendientes. Integración, permisos específicos, detalle propuesto del catálogo de prácticas y excepciones aún deben revisarse, implementarse y verificarse.

La disponibilidad de una función se verifica mediante comportamiento observable. Los documentos actuales no demuestran que esos criterios estén implementados o superados.

## Aceptación del aviso de reprogramación del profesional

Requisito confirmado y escenarios propuestos para verificar en la futura aplicación, una vez revisado el detalle de ADR-013:

1. Una fecha completa o varios intervalos alcanzan todos los turnos vigentes superpuestos del profesional en las agendas autorizadas, incluidos los ya confirmados. Excluyen turnos cancelados, atendidos, fuera del período y de entidades no autorizadas. Intervalos superpuestos no duplican avisos.
2. Cada afectado o representante verificado recibe aviso individual por WhatsApp con enlace al portal, aun si faltan menos de 36 horas o ya confirmó. Correo solo no satisface el requisito. Verificar integración real con contactos autorizados y estados de entrega/fallo.
3. La indisponibilidad impide nuevas reservas; historial y motivo interno se conservan sin exponerlos en el mensaje. Tareas y enlaces obsoletos no confirman ni cancelan por inasistencia el turno que requiere reemplazo. Reinicios, fallos parciales y reintentos no pierden casos ni duplican reemplazos.
4. El portal permite elegir otra «Consulta» habilitada cumpliendo permisos, cobertura y disponibilidad. Para otras prácticas, sin acceso o sin horarios, deriva a gestión asistida. No asigna reemplazos por leer, abrir o responder al aviso.
5. El reemplazo conserva vínculo al original y tiene sus propias reglas de confirmación. Resolver reemplazos simultáneos y avisos pendientes obsoletos. Bandeja autorizada diferencia fallos de contacto/entrega y pacientes todavía sin nuevo turno; cada caso requiere reemplazo o cierre asistido explícito.

No son pruebas ejecutadas: todavía no existe aplicación ni integración de este flujo.

## Trabajo supervisado y Git

Cada revisión indicará incremento, etapa, reglas afectadas, cambios, evidencia y decisiones pendientes. Los commits mantendrán una intención específica. La separación incremental no cambia el requisito de revisión del responsable antes de avanzar.
