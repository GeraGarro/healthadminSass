# Cierre documental · calendarios, pacientes y espacio profesional

Fecha: 27/10/2026. Modo Operate; fusión del cambio de sistema expresamente autorizado para la paleta temporal de todos los calendarios. Patio, Nunito Sans, navegación celadón, tokens y decisiones ajenos a este incremento se conservan. Seed heredada `8657e53ae5336fbd`; no se generó una nueva dirección visual.

## Fuentes y alcance

Se contrastaron [contrato de dirección](../../calendar-evolution-direction.md), CSS final de [tokens y calendarios](../../../salud-web/src/styles.css), calendario/panel de turno y composición de jornada/espacio profesional. La documentación describe el código final y el alcance real de [PRODUCT.md](../../../PRODUCT.md). La revisión no incluye operación productiva, accesibilidad certificada ni entrega real de mensajes.

Actualizados:

- [DESIGN.md](../../../DESIGN.md): tokens de calendario, seis estados, identidad de agenda separada de recepción, composición vigente de secretaría y espacio profesional; tipografía y resto del mundo preservados.
- [Sidecar v2](../../design.json): metadatos de paleta, rampa de inspección, narrativa sincronizada y muestra del turno temporal con sus seis estados. Diez muestras totales; las otras nueve se conservan.
- [Brief de app](../../surfaces/salud-web-src-app-app-ts.md), [jornada de secretaría](../../surfaces/salud-web-src-app-pages-secretary-home-ts.md), [calendario/panel de turno](../../surfaces/salud-web-src-app-ui-calendar-ts.md) y [espacio profesional](../../surfaces/salud-web-src-app-pages-professional-home-ts.md). Los frontmatter existentes se conservaron.
- [README de frontend](../../../salud-web/README.md), [README raíz](../../../README.md), [documento 35](../../../docs/35-turnos-pacientes-y-espacio-profesional.md) y enlace de continuidad en [documento 34](../../../docs/34-rediseno-roles-institucion-y-secretaria.md). No se reescribe la historia del documento 33.

El documento 35 detalla identidad global mínima por UUID/HMAC de DNI con fichas institucionales aisladas, alta de seis datos, reutilización local y vínculo profesional, paginación completa, borrador solo en memoria y reconsulta. También registra actividad por finalización explícita, aranceles versionados de referencia, facultades del propietario independiente limitadas a su entidad activa y cancelación idempotente por período con sus efectos y límites de entrega.

## Evidencia disponible

- [Recorridos finales](checks.json): 1440, 1343 y 390px; flujo desde celda, alta/coincidencia DNI, actividad, aranceles, cancelación y aviso urgente, personal independiente y restauración de borrador. El registro final informa `errors: []`; el orquestador confirmó ausencia de overflow y pageerror.
- [Revisión visual](finish-review.md): único arreglo funcional solicitado, recuperar también modo y seis datos del nuevo paciente en el borrador, ya implementado y comprobado. Recapturas finales `draft-restored-{1440,1343,390}.png` incluyen comprobación de los seis valores recuperados y registro posterior del turno.
- Pruebas confirmadas por el orquestador: 99 Angular y 5 de dominio; compilación de producción correcta; API con 54 de integración PostgreSQL y 12 unitarias. Este pase documental no repitió pruebas ni detector.
- [Resumen de integración API](api-integration-summary.txt) y [detector existente](detector.json) conservados; no se modificaron capturas ni contratos.

El [veredicto final del reviewer](verdict-pass.md) registra disposición `ship`, ambos hallazgos resueltos y ningún pendiente de revisión dentro del lote puntuado. Es aprobación del incremento revisado; no afirma despliegue productivo ni entrega real de mensajes.

## Drift no canonizado

El sidecar heredado conserva diferencias de medida en muestras de campo (tipografía/anillo), navegación (altura mínima) y panel (título) frente al CSS vigente. Son previas y ajenas al cambio autorizado de calendario; no se reparan ni se promueven como decisiones nuevas. La documentación histórica sigue describiendo sus entregas originales; los enlaces a 34/35 indican la continuidad vigente.

Verificación documental: 128 enlaces Markdown locales comprobados, sin destinos faltantes; sidecar JSON v2 válido, diez muestras y quince colores de calendario contrastados con el CSS final. DESIGN.md conserva las ocho secciones canónicas en su orden. Sin pruebas ni detector adicionales.
