# ADR-002. Producto inicial, confirmación y operación

Fecha: 15 de octubre de 2026. Estado: aceptadas las propuestas de producto 1-5 de la revisión; confirmados objetivo de uso, stack, seguimiento y VPS. Parámetros e implementación pendientes.

**Cronograma actualizado posteriormente en ADR-004:** correo T-72/T-48, respaldo WhatsApp T-36 y cancelación/liberación con notificación en plataforma T-24. Esta resolución sustituye el cronograma y la elección genérica de no respuesta de esta revisión; excepciones y demás decisiones no sustituidas conservan vigencia. Ver [ADR-004](004-confirmacion-por-correo-y-respaldo.md).

## Autorización

El responsable aceptó expresamente las propuestas 1, 2, 3, 4 y 5 de la respuesta de revisión. Confirmó inclusión de menores y representantes; estimó 20 profesionales en uso a tres meses y hasta 100 al año, actividad profesional principalmente de lunes a viernes de 08 a 20, versiones actuales de Spring Boot/Angular/PostgreSQL, revisión permanente de actualizaciones, acceso según permisos y alojamiento VPS.

## Decisiones de producto aceptadas

- Odontología como primera operación, con núcleo administrativo extensible a otras especialidades. Catálogo y duraciones reales por validar; funciones clínicas futuras no incorporadas automáticamente.
- Una identidad profesional con vínculos a clínicas y a su entidad independiente. Varias sedes dentro de una entidad; su uso real en piloto queda por validar. Autogestión de agenda institucional y agendas propias sin compartir fichas automáticamente.
- Bloqueo previo breve, turno registrado y confirmación de asistencia separados. Registro directo si se cumplen condiciones; aprobación manual únicamente donde una política explícita la requiera. TTL y condiciones de aprobación pendientes.
- Antecedente de esta decisión: solicitud T-48 y modos automático/asistido. **Sustituido en esos puntos por ADR-004:** un correo T-72/T-48, WhatsApp T-36 pendiente y cierre general T-24 con cancelación/liberación y aviso interno. Se conservan confirmación telefónica con autor/medio/fecha y revisión por fallo de aviso; excepciones asistidas/técnicas y turnos cercanos deben delimitarse sin anular la regla general.
- Vinculación verificada de cuentas con fichas dentro de la entidad; coincidencias ambiguas revisadas por personal. No fusionar solo por teléfono/nombre. Menores con representación verificada, facultades y destinatarios separados.
- Delegación por entidad, agenda, persona y acción, con revocación efectiva; acceso adicional requiere vínculo válido con su entidad. Coordinación global mínima de capacidad sin datos ajenos.
- Auditoría cronológica de acciones relevantes, accesos y consultas sensibles, autor real, cambios y motivos, con visibilidad restringida. No registrar credenciales ni capturar indiscriminadamente cada interacción.

## Decisiones técnicas y operativas

Se mantiene ADR-001. Se confirman Angular, Spring Boot y PostgreSQL, acceso según configuración autorizada y alojamiento VPS. Se interpreta versiones actuales como últimas estables compatibles verificadas al implementar; números observados y reservas técnicas en [presupuesto y operación](../../08-presupuesto-y-operacion.md).

Se creó seguimiento de versiones y seguridad inicialmente diario en el chat. Por instrucción posterior del responsable del 15/10/2026, su frecuencia vigente es cada 15 días a las 09:00 de Argentina. El seguimiento estudia y propone; no despliega cambios automáticamente. El perfil de VPS, presupuesto de mensajes, proveedor, autenticación concreta y objetivos RPO/RTO son propuestas o pendientes, no compromisos aceptados por esta decisión.

## Consolidación posterior

ADR-008 confirma el diseño desarrollado en el chat: formulario propio, dirección Google + correo, admisión previa, estados y defensa contra abuso por capas. Conserva parámetros sin fijar y catálogo público de profesionales/empadronamiento entre entidades fuera de beta. El catálogo interno de prácticas se precisa en ADR-009. Ver [estado consolidado](../../13-estado-consolidado-y-pendientes.md).

## Verificación requerida

Verificar el cronograma de ADR-004, sus excepciones asistidas/técnicas por concretar, confirmación telefónica y carrera entre confirmación/cierre/reasignación; ninguna confirmación tardía recupera un intervalo ocupado. Comprobar permisos negativos, vinculación y representación, trazabilidad cronológica y privacidad entre entidades. Validar carga, recuperación y costos con evidencia antes del piloto. No hay implementación ni pruebas funcionales superadas por registrar esta aceptación.
