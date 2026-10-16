# Resolución de las ocho decisiones iniciales de producto

Actualización: 15 de octubre de 2026. Consolidación exclusiva de este chat. Diseño aceptado; implementación y parámetros pendientes. Se reemplaza el análisis provisional por las respuestas vigentes para evitar reabrir decisiones ya resueltas. El [estado consolidado](13-estado-consolidado-y-pendientes.md) integra las ampliaciones posteriores.

| Punto original | Resolución aceptada | Pendiente concreto |
| --- | --- | --- |
| 1. Especialidad | Odontología inicial; núcleo administrativo extensible a clínica, psicología, fisioterapia y otras | Base de catálogo y personalización confirmadas en ADR-009; duración y recursos reales por validar; no se añaden funciones clínicas por preparar la estructura |
| 2. Entidad | Clínica, independiente y combinación; sedes dentro de entidad, identidad profesional con varios vínculos | Uso piloto de sedes y salida del profesional, sin trasladar fichas institucionales |
| 3. Actores y turnos | Secretaría con delegación puede consultar, crear, cancelar y reprogramar. Pre-reserva breve, registro directo bajo reglas y asistencia diferenciados | TTL, aceptación excepcional del pedido y plazo de cancelación voluntaria |
| 4. Identidad y menores | Menores/representantes incluidos. Admisión administrativa previa por alta de personal o aceptación del formulario propio; activación verificable | Evidencia mínima, facultades, conflictos, contacto y recuperación; no identificar por DNI declarado ni fusionar por coincidencias |
| 5. Varias agendas | Permisos por entidad/agenda/acción; coordinación global mínima del profesional sin revelar datos ajenos; auditoría cronológica | Verificar identidad profesional, SQL/restricciones, traslados, salida y matriz de eventos |
| 6. Escala | 20 profesionales a tres meses, hasta 100 al año; 100 vínculos y un turno mensual por vínculo; pico L-V 08-20 | Entidades piloto, sesiones simultáneas, presupuesto integral, retención y RPO/RTO |
| 7. Avisos | Portal principal; correo T-72/T-48, respaldo WhatsApp T-36 pendiente; T-24 cancelar/liberar y avisar internamente. Costos incluidos en el abono total | Proveedores, contactos, plantillas, límites, precio y excepciones; un correo en la ventana, no dos |
| 8. Base técnica | Angular, Spring Boot y PostgreSQL estables compatibles, `tenant_id`/RLS, VPS, autorización en servidor y seguimiento de versiones | Versiones fijadas, sesión, biblioteca/proveedores y perfil medido de VPS; sin actualización automática productiva |

## Aclaraciones posteriores que completan las respuestas

- El paciente o representante habilitado elige horarios solo para la práctica específica «Consulta» habilitada, sin gestión obligatoria del personal. Todas las demás prácticas, incluidas las personalizadas, las asigna y reprograma personal autorizado. Su nombre o clasificación no amplían la facultad. Conserva visualización y confirmación de sus turnos según permisos.
- Chat humano paciente-profesional incluido en beta, persistido y con respuesta diferida. Permiso de agenda no da acceso al chat; participación de secretaría requiere permiso propio. Mensajes no reservan ni confirman por inferencia. IA pendiente.
- Cuenta reutilizable y aprobación administrativa persistente; no nueva aceptación en cada login o reserva. Dirección de beta: Google y alternativa por correo, con detalle de mecanismo pendiente. Otros proveedores de autenticación quedan fuera del recorrido de beta.
- Solicitud protegida de nuevos no bloquea capacidad ni abre chat privado. La admisión controlada se complementa con cuotas que incluyen turnos confirmados, velocidad, anti-bot, límites de mensajes/gasto y revisión. Los valores ilustrativos no quedan fijados.
- Empadronamiento simplificado en otra entidad y catálogo público son visión futura por detallar, sin compartir fichas ni adelantar suscripciones de I2/I3.
- Confirmación telefónica con autor/medio/fecha y excepciones asistidas/técnicas deben concretarse. Fallo de canal no cancela por sí solo; el cierre general T-24 permanece. Una confirmación tardía no restaura un turno cancelado.

## Cómo leer las estimaciones

Los 10.000 vínculos al objetivo no son necesariamente pacientes únicos. 10.000 turnos mensuales a ritmo constante equivalen a 120.000 anuales, no al primer año de incorporación. Horario comercial no es límite de disponibilidad del portal ni medida de concurrencia.

RPO expresa la pérdida máxima de datos tolerada y RTO el tiempo objetivo de recuperación. Los ejemplos previos de una hora/cuatro horas no son SLA aprobados. El VPS 4 vCPU/8 GB/100 GB es una hipótesis para medir, no una garantía ni contratación.

El flujo vigente requiere un correo y respaldo WhatsApp solo para pendientes. Precio, cupos y rentabilidad siguen abiertos. Los análisis sustituidos están en el [archivo histórico](archivo/2026-10-15-analisis-sustituidos.md); los supuestos del flujo actual en [comunicaciones y abono](09-portal-correo-y-membresia.md).

## Trazabilidad

[ADR-001](arquitectura/adr/001-aislamiento-y-numeracion-pacientes.md): aislamiento y numeración. [ADR-002](arquitectura/adr/002-producto-y-operacion-inicial.md): aceptación de producto inicial. [ADR-003](arquitectura/adr/003-portal-y-revision-de-canales.md): cambio a portal principal. [ADR-004](arquitectura/adr/004-confirmacion-por-correo-y-respaldo.md): cronograma y cierre. [ADR-005](arquitectura/adr/005-chat-y-seleccion-de-consultas.md): chat y consultas. [ADR-006](arquitectura/adr/006-admision-y-vision-de-empadronamiento.md): admisión y visión de red. [ADR-007](arquitectura/adr/007-acceso-sujeto-a-admision-administrativa.md): aceptación administrativa. [ADR-008](arquitectura/adr/008-consolidacion-del-chat.md): aceptación final y límites.

[ADR-009](arquitectura/adr/009-catalogo-inicial-y-personalizacion.md): prácticas iniciales, facultad de personalización y elección de horario exclusiva de la práctica «Consulta».
