# ADR-005. Chat del portal y selección de turnos de consulta

Fecha: 15 de octubre de 2026. Estado: aceptados ambos requisitos para el portal de V1; detalle técnico e implementación pendientes.

## Instrucción del responsable

Incluir en el portal chat para consultas adicionales dirigidas al profesional. La instrucción inicial limitó la elección a consulta. **Aclaración posterior del responsable, registrada en [ADR-009](009-catalogo-inicial-y-personalizacion.md):** paciente o representante habilitado elige horarios únicamente para la práctica específica «Consulta». Extracción, limpieza, cirugía y todas las personalizadas se asignan y reprograman por personal autorizado, con independencia de su duración, nombre o clasificación.

Este ADR incorpora chat humano al alcance del primer incremento, que antes estaba pendiente, y acota la autogestión de selección de horarios. El asistente de IA conserva su estado pendiente. ADR-004 sigue rigiendo confirmaciones y avisos para turnos registrados, tanto por el paciente como por personal.

## Chat de consultas al profesional

**Aceptado:** paciente y profesional disponen de conversación dentro del portal para preguntas adicionales y respuestas. No se requiere salir a WhatsApp para conversar.

**Dirección aceptada al consolidar el análisis en ADR-008; detalle pendiente:** mensajería persistida que admite respuesta diferida, con identificación del profesional destinatario, paciente, entidad, autor real y fecha/hora. Mostrar conversaciones y mensajes pendientes/leídos/respondidos según el detalle que se acuerde. Confirmar horarios y expectativas de respuesta antes del piloto, sin prometer atención instantánea por llamar a la interfaz “chat”.

Reglas de acceso:

- Conversación vinculada a entidad, paciente y profesional habilitado; autorización de participantes en servidor para leer, enviar y responder. Verificar a quién se permite iniciar contacto antes de un primer turno en el diseño detallado.
- Paciente accede a sus propias conversaciones; representación exige facultad verificada y autoría diferenciada. No compartir automáticamente el chat con familiares, otros profesionales o entidades.
- Delegar agenda a secretaría no concede acceso al contenido del chat. Si se requiere participación o derivación a secretaría, definir permiso y alcance específicos; no asumir lectura de conversaciones profesionales por un rol administrativo genérico.
- Registrar autor y eventos relevantes sin copiar el contenido de mensajes a logs operativos indiscriminadamente. Definir conservación y correcciones con historia; verificar revocación y acceso a conversaciones previas.
- Los avisos de mensajes nuevos se muestran en el portal. Avisos externos adicionales requieren política, autorización y presupuesto; el cronograma de ADR-004 no es un permiso para enviar WhatsApp por cada mensaje del chat.

Un texto de chat no confirma, cancela, reserva ni reprograma automáticamente un turno. Esas acciones exigen operaciones explícitas autorizadas. Un pedido sobre una práctica compleja puede iniciar una gestión humana, pero no bloquea ni asigna por sí mismo capacidad. No se aprueban IA, adjuntos, llamadas ni otras funciones por incorporar este chat de texto.

## Selección de horarios según la práctica

| Operación | Paciente o representante con facultad verificada | Secretaría autorizada / profesional |
| --- | --- | --- |
| Elegir y pre-reservar horario de la práctica «Consulta» habilitada para portal | Permitido bajo disponibilidad, cobertura, identidad y demás reglas | Permitido dentro de sus facultades |
| Elegir horario de cualquier práctica distinta de la práctica base «Consulta», incluidas las personalizadas | No permitido; derivar la solicitud al personal sin ocupar agenda | Gestiona práctica, duración, recursos y horario según permisos |
| Elegir otro horario para reprogramar práctica de gestión del personal | Solicitar cambio; no elegir/asignar el nuevo intervalo por portal | Reprograma de forma autorizada y atómica |
| Consultar un turno propio ya registrado o confirmar asistencia | Permitido según vínculo/facultades, aunque la práctica se haya agendado por personal | Permitido según rol/delegación; confirmación telefónica trazable |
| Cancelar un turno propio | Conserva las políticas de cancelación acordadas; no obtiene permiso para reasignar horario | Permitido según facultades/políticas |

**Precisión vigente de ADR-009 sobre la dirección anterior de ADR-008:** clasificar una práctica como consulta no concede elección de horario. Se exige la identidad de la práctica base «Consulta», oferta habilitada en portal, ausencia de gestión obligatoria del personal y demás condiciones vigentes. Una oferta de «Consulta» que requiera gestión del personal tampoco permite autoselección. Las prácticas personalizadas no pueden habilitarse para elección por paciente, incluso si se denominan o clasifican como consulta. Personal con permiso configura condiciones y duración, pero no puede extender esa facultad a otras prácticas.

No fijar un umbral universal de minutos ni identificar la práctica base «Consulta» solamente por su nombre visible. Se propone una referencia estable por entidad, con mecanismo técnico por diseñar. La duración de otras prácticas no modifica su asignación por personal. Los tiempos concretos se validan en el catálogo con profesionales del piloto.

La regla se exige antes de ofrecer horarios de selección, pre-reservar, completar el pedido y reprogramar. El servidor comprueba identidad de la práctica base, oferta, duración y permisos desde su configuración; rechaza manipulación de identificadores, nombre, tipo o modalidad, aunque la pantalla o solicitud pertenezcan a un paso anterior. Una nueva restricción no cambia ni cancela silenciosamente los turnos existentes.

## Consecuencias de alcance y costos

El portal presenta selección directa de horarios de la práctica «Consulta» y una vía para contactar al profesional o solicitar gestión de otras prácticas. El personal no obtiene sobrecupos ni acceso entre entidades por gestionar casos complejos. El chat agrega desarrollo, almacenamiento, controles, monitoreo y tiempo humano; revisar dimensionamiento y presupuesto sin atribuirle una tarifa por mensaje de WhatsApp ni dar por aprobada otra tarifa de membresía.

## Evidencia necesaria para beta

1. Paciente reserva la práctica «Consulta» elegible con las reglas de disponibilidad, cobertura y confirmación existentes.
2. Paciente no obtiene horario ni bloqueo de práctica distinta de la práctica base «Consulta», incluidas las personalizadas o marcada para gestión del personal, tampoco modificando API, duración, identificadores o una pre-reserva anterior.
3. Paciente no elude la restricción mediante reprogramación ni convirtiendo una consulta a otra práctica. Personal autorizado sí agenda/reprograma la práctica gestionada; personal sin delegación no puede hacerlo.
4. Un turno complejo agendado por personal permanece visible al paciente autorizado y admite confirmación según ADR-004; la restricción de selección no impide esa confirmación.
5. Paciente y profesional autorizados intercambian mensajes con autor y fechas correctas. Otros pacientes, profesionales sin facultad, entidades y secretaría con solo delegación de agenda no leen ni modifican el chat.
6. Probar representación, revocación, mensajes repetidos, contenido inválido y continuidad tras reinicio con la política concreta. Mostrar error sin mezclar conversaciones ni registrar contenido sensible en logs generales.
7. Enviar “confirmo” o pedir un turno en el chat no modifica agenda por inferencia; se requiere una operación explícita de un actor autorizado.

Admisión administrativa, formulario propio y defensa por capas de ADR-007/008 condicionan el acceso al portal/chat y a capacidad; números y mecanismos pendientes. Ver [estado consolidado](../../13-estado-consolidado-y-pendientes.md).

Esta decisión documenta comportamiento requerido; no demuestra implementación ni pruebas funcionales superadas.
