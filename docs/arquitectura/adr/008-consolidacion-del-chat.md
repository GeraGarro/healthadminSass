# ADR-008. Consolidación y aceptación del diseño desarrollado en este chat

Fecha: 15 de octubre de 2026. Estado: aceptada la dirección de diseño; especificaciones e implementación pendientes. Reglas afectadas: R01-R12. Alcance de la actualización: documentación local y ayuda memoria, sin construir aplicación ni contratar proveedores.

**Precisión posterior:** [ADR-009](009-catalogo-inicial-y-personalizacion.md) registra las prácticas iniciales, la facultad de personalización y la aclaración del responsable: el paciente elige horarios exclusivamente para la práctica específica «Consulta». La clasificación como consulta no permite habilitar otras prácticas, incluidas las personalizadas. Esta precisión rige sobre formulaciones anteriores de selección por tipo; el detalle nuevo propuesto del catálogo sigue pendiente de revisión.

## Autorización y fuente

Tras analizar el acceso mediante admisión administrativa, el responsable indicó: “Perfecto, todo el analisis es el correcto y esperado” y pidió revisar/actualizar toda la documentación con lo conversado, trabajando solo con este chat. Esta aceptación confirma la dirección de diseño, sin fijar ejemplos que se habían presentado como hipótesis ni adelantar funcionalidades expresamente futuras.

## Decisión

1. Mantener las decisiones de producto, aislamiento, confirmación y chat de ADR-001 a ADR-007, aplicando las sustituciones posteriores en el orden documentado.
2. Adoptar formulario propio protegido para nuevos pacientes y admisión por personal con facultad explícita, también para conocidos. La solicitud no ocupa capacidad. Aprobación persistente y activación/vinculación verificadas antes de acceso privado; autenticación externa sola no habilita.
3. Adoptar pocos mecanismos de acceso como dirección de beta: Google y alternativa por correo. Estados de admisión: pendiente, aprobado con activación pendiente, activo, rechazado y suspendido/revocado. Flujo de correo, sesión, transición, recuperación y enlace seguro de identidades pendientes de especificación. La imagen no exige teléfono, Facebook y Apple.
4. Adoptar defensa por capas del análisis 10: habilitación local, cuotas de pre-reservas/turnos futuros incluidos confirmados, frecuencia, anti-bot, límites de comunicaciones/gasto y revisión. Controles consistentes ante concurrencia, familias contempladas, sin suspensión por mero DNI declarado por terceros. Números, proveedor anti-bot y umbrales no se fijan por esta aceptación.
5. Conservar cuenta reutilizable sin compartir fichas. Empadronamiento entre entidades y catálogo público siguen como evolución por detallar; admisión local de beta no depende de construir esa red.
6. Conservar portal principal, un correo T-72/T-48, respaldo WhatsApp T-36 y cancelación/liberación/aviso interno T-24 sin confirmar. Integración de ambos canales requerida; excepciones operativas explícitas por concretar. Chat humano incluido; IA pendiente.
7. Adoptar como dirección comercial comunicaciones incluidas en el abono total, con condiciones transparentes y sin recargo API sorpresivo. Precios, cupos y rentabilidad no aprobados; motor comercial diferido I2/I3.
8. Conservar stack estable compatible, monolito modular como dirección arquitectónica y VPS sujeto a dimensionamiento y recuperación comprobados. Versiones/tarifas anteriores son referencias registradas, sin nueva validación externa en este trabajo.

## No resuelto por esta aceptación

TTL, cuotas, duraciones y ofertas reales de prácticas (base inicial y personalización confirmadas después en ADR-009), facultades/evidencia de representación, políticas de cancelación, detalles de excepciones y turnos cercanos, mecanismos de sesión/recuperación, proveedores, precios, capacidad medida, concurrencia, RPO/RTO y SLA. Tampoco se aprueban IA, catálogo público de profesionales en beta, transferencia de fichas ni suscripciones en I1.

## Consecuencias y evidencia

Actualizar propuesta, reglas, plan, alcance, seguridad, análisis, ADR y ayuda memoria para eliminar dudas ya resueltas. [Estado consolidado](../../13-estado-consolidado-y-pendientes.md) identifica qué se acepta y qué se concreta después. Mantener ejemplos económicos separados del flujo contratado. Las referencias externas existentes se conservan como antecedentes sin nuevas consultas; no se presenta una cifra como vigente por reproducirla.

La verificación realizada en esta etapa es documental: coherencia, enlaces y PDF. Las pruebas de admisión, aislamiento, cuota/capacidad concurrente, chat, confirmaciones, envío real, carga y restauración se ejecutarán cuando exista aplicación. No se declara comportamiento implementado ni certificación por mantener este registro.
