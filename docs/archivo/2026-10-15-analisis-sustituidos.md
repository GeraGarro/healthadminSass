# Archivo de análisis sustituidos

Fecha de archivo: 15 de octubre de 2026. Estado: antecedente histórico; no es especificación vigente ni recomendación de contratación.

Estos fragmentos se retiraron de las guías operativas para evitar confundir alternativas descartadas, precios ilustrativos y referencias técnicas anteriores con las decisiones actuales. Se preserva su contenido para trazabilidad. Sus referencias a «esta revisión», recomendaciones, fechas y pendientes describen el análisis original y no el estado actual. Las fuentes externas no se consultaron durante esta limpieza.

La regla vigente se consulta en el [estado consolidado](../13-estado-consolidado-y-pendientes.md), las [reglas R01-R12](../03-reglas-del-dominio.md) y el [catálogo](../16-catalogo-de-practicas.md). Solo la práctica específica «Consulta» permite al paciente elegir horarios cuando está habilitada. El flujo general usa un correo T-72/T-48 y un WhatsApp T-36 si sigue sin confirmar, con cierre T-24 y excepciones por definir. Las suscripciones comerciales siguen diferidas.

## WhatsApp intensivo y propuesta comercial anterior

Procedencia: [08-presupuesto-y-operacion.md](../08-presupuesto-y-operacion.md), versión anterior a esta limpieza. Sección archivada, sin vigencia operativa.

Se conserva la hipótesis de 100 vínculos con pacientes por profesional y un turno mensual por vínculo. La estimación de envíos no depende del número de pacientes únicos: cada turno puede generar sus propios avisos.

Escenario histórico de uso intensivo: tres mensajes salientes por turno, todos entregados y supuestos cobrables como utilidad: comprobante, solicitud de confirmación y recordatorio pertinente. No es el cronograma vigente: este usa correo T-72/T-48 y un WhatsApp a T-36 solo para pendientes. No enviar un recordatorio obsoleto ni un pedido de confirmación ya resuelto. Los casos de turnos cercanos, cancelaciones, reprogramaciones y confirmaciones por teléfono pueden modificar la cantidad real. El tercer envío es una hipótesis presupuestaria, no una obligación funcional.

Supuestos económicos:

- Destinos argentinos. Referencia provisional: USD 0,026 por mensaje de utilidad. Alibaba Cloud documenta ese importe para Argentina con vigencia desde el 1 de octubre de 2025 en un aviso actualizado el 30 de enero de 2026. **No se logró recuperar la tabla técnica vigente de Meta en esta revisión: el valor es una base de cálculo, no una tarifa confirmada de octubre de 2026.**
- Twilio se usa como alternativa ilustrativa de intermediario: USD 0,005 por mensaje entrante o saliente, además del cargo de Meta. No constituye selección del proveedor. Su página tiene explicaciones contradictorias sobre gratuidad en ventana de atención; no se aplican descuentos ni cupos gratuitos en estos cálculos de utilidad.
- Para comparar con Twilio se agrega una respuesta entrante por turno a USD 0,005. No se modela respuesta automática saliente a esa interacción. Confirmar desde el portal no genera necesariamente ese mensaje entrante; es una previsión de sensibilidad, no un requisito del flujo.
- API directa elimina la comisión de este intermediario, pero no los costos propios de integración, operación, incorporación de entidades/números ni los cargos de Meta aplicables.
- Reserva operativa propuesta: 20% sobre los importes calculados, con redondeo hacia arriba. No es un descuento, impuesto ni límite máximo garantizado. Una tarifa distinta, conversación adicional o uso fuera del escenario obliga a recalcular.
- No se incluyen marketing, códigos de autenticación por WhatsApp, chatbot, llamadas, abonos de otros proveedores, alquiler de números, impuestos, diferencias de cambio, VPS ni trabajo de desarrollo/soporte.

Fuentes primarias consultadas:

- [Alibaba Cloud: actualización de tarifas por país](https://www.alibabacloud.com/help/en/chatapp/notice-about-whatsapp-individual-country-message-fee-update), referencia histórica explícita para el supuesto USD 0,026.
- [Twilio: precios de WhatsApp](https://www.twilio.com/en-us/whatsapp/pricing), comisión de mensajería entrante/saliente USD 0,005. Se distingue de su tabla de llamadas por minuto, que no se usa aquí.
- [Meta: precios de WhatsApp](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing), tabla específica no recuperable mediante la herramienta web. Revalidar antes de contratar y al configurar tarifas.

### Comparación histórica mensual: tres mensajes WhatsApp salientes por turno

| Profesionales | Turnos/mes | Mensajes salientes | Meta/API directa, supuesto | Con Twilio y una respuesta entrante por turno | Reserva propuesta API directa | Reserva propuesta con Twilio |
| --- | --- | --- | --- | --- | --- | --- |
| 20 | 2.000 | 6.000 | USD 156 | USD 196 | USD 190 | USD 240 |
| 40 | 4.000 | 12.000 | USD 312 | USD 392 | USD 380 | USD 480 |
| 60 | 6.000 | 18.000 | USD 468 | USD 588 | USD 570 | USD 710 |
| 80 | 8.000 | 24.000 | USD 624 | USD 784 | USD 750 | USD 950 |
| 100 | 10.000 | 30.000 | USD 780 | USD 980 | USD 940 | USD 1.180 |

Los redondeos son al siguiente múltiplo de USD 10 después de agregar 20%. Por ejemplo, 20 profesionales con intermediario: 196 × 1,20 = 235,20, redondeado a USD 240. A 100: 980 × 1,20 = 1.176, redondeado a USD 1.180.

```text
T = profesionales × 100 turnos por mes
S = T × mensajes salientes por turno
I = T × 1 respuesta entrante por turno, solo para el escenario con Twilio
Meta = S × 0,026
Twilio total = Meta + (S + I) × 0,005
Reserva propuesta = redondear hacia arriba a decenas(costo × 1,20)
```

Costo central por profesional: USD 7,80 en mensajes de Meta; USD 9,80 con el intermediario y la respuesta entrante modelada, antes de reserva e impuestos. No es un precio de venta del SaaS.

### Sensibilidad al número de avisos

Solo cargo base de Meta con la referencia provisional de USD 0,026:

| Avisos salientes por turno | 20 profesionales: envíos / costo | 100 profesionales: envíos / costo |
| --- | --- | --- |
| 2 | 4.000 / USD 104 | 20.000 / USD 520 |
| 3 | 6.000 / USD 156 | 30.000 / USD 780 |
| 4 | 8.000 / USD 208 | 40.000 / USD 1.040 |

Por cada USD 0,001 de variación en la tarifa, el escenario de tres avisos cambia USD 6 mensuales a 20 profesionales y USD 30 a 100. No multiplicar otra vez por pacientes: ya están incluidos en los turnos.

Medición vigente: un correo de confirmación por turno elegible y un respaldo WhatsApp solo si sigue pendiente a T-36. Comprobantes, cambios y aviso final requieren política propia; no heredan tres WhatsApp del escenario histórico. Registrar consumo por entidad, número, categoría, destinatario e intento. Acordar responsable del pago y límites antes de habilitar datos reales. Conservar funcionamiento del portal y revisión del personal si falla el canal o se alcanza el presupuesto. Los controles comerciales se mantienen diferidos.

### Antecedente comercial: tarifa con WhatsApp intensivo

El responsable indicó una intención inicial de cobrar aproximadamente USD 20 mensuales por profesional y solicitó evaluar el efecto del canal. Las cifras siguientes son recomendaciones de planificación, no precios aprobados ni validación de disposición de pago. El motor comercial sigue diferido a los incrementos 2 o 3.

La reserva de USD 240 para 20 profesionales equivale a USD 12 por profesional. Incluye el escenario ilustrativo con intermediario, respuesta entrante y colchón del 20% redondeado; no es una factura íntegra de Meta ni un recargo nuevo en su totalidad. El gasto central del escenario, antes de reserva, es USD 196. Con API directa la reserva estimada sería USD 190 para el conjunto. La referencia de Meta sigue siendo provisional.

Escenario prudente para comparar tarifas: 20 profesionales, reserva de canal USD 240 y USD 100 adicionales mensuales como hipótesis ilustrativa de otros gastos. Esos USD 100 **no son una cotización del VPS ni una estimación validada de todos los gastos operativos**.

| Tarifa mensual por profesional | Ingresos con 20 profesionales | Reserva WhatsApp | Otros gastos hipotéticos | Saldo antes de impuestos, comisiones de cobro, trabajo propio, captación y gastos no modelados |
| --- | --- | --- | --- | --- |
| USD 20 | USD 400 | USD 240 | USD 100 | USD 60 |
| USD 30 | USD 600 | USD 240 | USD 100 | USD 260 |
| USD 35 | USD 700 | USD 240 | USD 100 | USD 360 |
| USD 39 | USD 780 | USD 240 | USD 100 | USD 440 |

El saldo no es beneficio neto ni margen bruto contable: incluye una provisión sin gastar necesariamente, y excluye costos relevantes. Que cubra gastos mensuales tampoco demuestra recuperación del desarrollo.

**Propuesta histórica sustituida como dirección de oferta por portal/correo con respaldo incluido:** se evaluaron USD 35 mensuales por profesional para el lanzamiento con hasta 300 avisos salientes administrativos de WhatsApp incluidos; contrastar USD 39 como tarifa regular mediante ventas del piloto. El paquete conserva aproximadamente USD 23 por profesional después de la reserva de canal ilustrativa, antes de otros gastos. También se comparó USD 20 de plataforma más alrededor de USD 15 de WhatsApp; esta separación no se adopta como oferta vigente, dado el costo integrado en abono solicitado posteriormente. Estos precios no derivan de una comparación de mercado ni se aprueban por este documento.

Definir unidad de cobro como profesional habilitado; secretaría y sedes no crean por sí solas una segunda licencia profesional. No duplicar automáticamente el cobro por una misma persona que trabaja en dos entidades: aclarar comprador, alcance de cada contratación y quién paga cada consumo antes de fijar condiciones comerciales. No aplicar descuentos institucionales que ignoren consumo y soporte.

El cupo es de mensajes salientes, no pacientes ni turnos. Reprogramaciones y cancelaciones consumen mensajes. Una interacción por WhatsApp puede agregar respuestas y cargos entrantes del intermediario; el paquete supone el patrón modelado y exige una política explícita para uso adicional. Evitar un chatbot abierto sin presupuesto. Confirmar en portal reduce conversaciones adicionales.

Como comparación histórica, paquetes adicionales de 100 avisos salientes a USD 5 podrían cubrir USD 2,60 de Meta o USD 3,10 con el cargo saliente del intermediario bajo las tarifas supuestas, pero faltan interacciones, impuestos, cobro y soporte. No se fija todavía una tarifa contractual de excedente. Todo extra debe informarse y autorizarse antes de cobrarlo; al llegar al límite, conservar turnos y portal, generar revisión operativa y aplicar el respaldo acordado.

Revalidar tarifa de Meta, proveedor, costos reales, uso por profesional y aceptación comercial antes de publicar precios. Si la base de costos cambia, ajustar precio o cupos expresamente, sin convertir una estimación provisional en una promesa de margen.

## Reglas de proveedor no verificadas en la limpieza

Procedencia: [04-canales-y-costos.md](../04-canales-y-costos.md), versión anterior a esta limpieza. Sección archivada, sin vigencia operativa.

El relevamiento anterior de este chat dejó las siguientes referencias sobre documentación de Meta y cambios atribuidos a octubre de 2026. Esta actualización documental no los revalida. No tratarlos como garantía de vigencia, gratuidad ni facturación; comprobar políticas y tabla oficial antes de contratar o enviar. La tabla numérica vigente no pudo recuperarse en el presupuesto posterior.

Resumen del relevamiento previo, sujeto a revalidación:

- El cobro depende de mensajes entregados, categoría y mercado del destinatario.
- Desde octubre de 2026, las respuestas de servicio se cobran después de los primeros 1.000 mensajes mensuales por número del negocio; ese cupo no se acumula.
- Las plantillas de utilidad dentro de la ventana de atención también pasan a ser cobrables.
- La ventana de atención de 24 horas permite respuestas sin plantilla; fuera se requieren plantillas aprobadas.
- Los niveles de volumen se aplican a utilidad y autenticación; no presuponer que el cupo de servicio cubre recordatorios.

Fuente primaria: [Meta: precios de WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing).

Para iniciar contacto se requiere autorización del destinatario y plantilla aprobada; también hay que respetar bajas y restricciones sobre información sensible. Fuente: [política oficial de mensajes, actualizada el 23 de septiembre de 2026](https://whatsappbusiness.com/policy/).

### Qué falta validar antes de presupuestar

**Actualización del 15 de octubre:** se elaboró un presupuesto de planificación, no una cotización: tres avisos por turno, 100 turnos mensuales por profesional y USD 0,026 como referencia histórica de utilidad Argentina publicada por Alibaba Cloud. Para 20 profesionales, 6.000 envíos/mes y USD 156 de Meta bajo ese supuesto; para 100, 30.000 y USD 780. Intermediario, respuestas y reserva se detallan en el documento de presupuesto. La tabla vigente de Meta no pudo recuperarse en esta revisión; revalidar antes de contratar. No descontar cupos de servicio a las plantillas de utilidad.

La hoja numérica vigente para Argentina se enlaza desde la documentación, pero no se pudo recuperar/verificar su contenido en este relevamiento. **No se fija un importe por mensaje ni se adopta una cifra histórica como precio actual.** Confirmar mercado, categoría, moneda, niveles de volumen, elegibilidad especial y precio del proveedor al elegir la integración.

Un recordatorio de un turno existente podría corresponder a utilidad si cumple los criterios; no asegurar categoría o aprobación antes de validar la plantilla. Separar anuncios/promociones del aviso administrativo.

## Comparación de correo con tres envíos por turno

Procedencia: [09-portal-correo-y-membresia.md](../09-portal-correo-y-membresia.md), versión anterior a esta limpieza. Sección archivada, sin vigencia operativa.

Amazon SES publica USD 0,10 por 1.000 correos salientes en modalidad a la carta y USD 0,16 por 1.000 en Essentials para el primer tramo. La página informa Essentials como configuración inicial para ciertas cuentas nuevas, por lo que el cálculo a la carta exige elegir esa modalidad. Son cargos base, sin datos, funciones adicionales, impuestos ni operación.

Resend publica Pro por USD 20/mes con 50.000 correos y 10 dominios, sin límite diario. Publica un adicional de USD 20/mes por 100 dominios extra. El plan gratuito tiene 3.000 correos/mes y 100/día: no cubre el escenario comparativo de 6.000. El flujo recién aprobado tiene un correo de solicitud por turno y otros eventos por definir; no asumir que el cupo mensual o diario gratuito alcanza sin sumar picos, altas, recuperación y cambios. Cien profesionales no significan cien dominios; depende de entidades y remitentes elegidos.

**Efecto del cronograma aprobado:** con 100 turnos mensuales por profesional, solo el correo de solicitud suma 2.000 envíos a 20 profesionales y 10.000 a 100. Con las tarifas relevadas arriba, cargos base SES a la carta de USD 0,20/USD 1 y Essentials de USD 0,32/USD 1,60, respectivamente. No son el costo total de comunicación: agregar comprobantes, cambios, aviso al paciente cancelado, verificación, recuperación y operación. WhatsApp sigue dependiendo de la proporción sin confirmar a T-36; la notificación interna de liberación no es un mensaje WhatsApp.

| Profesionales | Turnos mensuales | Tres correos por turno | SES a la carta, cargo base | SES Essentials, cargo base | Resend Pro, abono con hasta 10 dominios |
| --- | --- | --- | --- | --- | --- |
| 20 | 2.000 | 6.000 | USD 0,60 | USD 0,96 | USD 20 |
| 40 | 4.000 | 12.000 | USD 1,20 | USD 1,92 | USD 20 |
| 60 | 6.000 | 18.000 | USD 1,80 | USD 2,88 | USD 20 |
| 80 | 8.000 | 24.000 | USD 2,40 | USD 3,84 | USD 20 |
| 100 | 10.000 | 30.000 | USD 3,00 | USD 4,80 | USD 20 |

La tabla de tres correos conserva un escenario comparativo de dimensionamiento; no sustituye el correo único de solicitud del flujo aprobado. Agregar los demás eventos reales antes de presupuestar. Un proveedor barato por envío puede exigir más trabajo de configuración y operación; el precio publicado no garantiza entrega ni costo total inferior. No se selecciona proveedor por esta tabla.

## Alternativas comerciales y precios ilustrativos anteriores

Procedencia: [09-portal-correo-y-membresia.md](../09-portal-correo-y-membresia.md), versión anterior a esta limpieza. Sección archivada, sin vigencia operativa.

**Dirección aceptada:** membresía que incluye portal, correo transaccional y avisos de respaldo bajo una política publicada; precio y alcance numérico pendientes. Internamente se controla costo por entidad/profesional/canal, aunque el cliente vea un precio total. No mostrar una línea por API ni un recargo inesperado por una confirmación.

La membresía define el alcance comprado; la configuración operativa de la entidad ordena canales permitidos; la preferencia del destinatario y la evidencia de autorización determinan qué puede enviarse; finalmente aplican evento, estado del turno y presupuesto. Pagar una membresía no habilita a contactar por cualquier canal ni concede acceso a agendas/fichas.

Recomendaciones comparadas:

- **Una membresía y selección dentro del alcance:** dirección para el piloto, con condiciones por concretar. Correo primero y respaldo ocasional incluido; permitir excepciones justificadas sin forzar a todos a utilizar correo. Acordar volumen, horarios y conducta ante agotamiento. Una reserva interna de 25-50 avisos WhatsApp por profesional/mes es una hipótesis para probar, no un cupo aprobado ni promesa de cobertura ilimitada.
- **Clientes que desean WhatsApp como canal habitual:** evaluar un abono total con mayor cobertura, explicitado al contratar, sin sumar sorpresivamente la factura del proveedor. Si se exige mismo precio para todos, calcular con el escenario de alto consumo y admitir que puede elevar el precio a quienes usan correo.
- **Clínicas:** evaluar abono por profesionales habilitados y bolsa de avisos de la entidad. No duplicar por secretario o sede; resolver titular y uso del mismo profesional en varias entidades. El promedio general no debe permitir que una sola entidad agote el presupuesto de las demás.

Revisar la recomendación anterior de USD 35-39, que suponía 300 avisos WhatsApp por profesional. Con portal/correo y respaldo ocasional, **USD 20 como piloto y USD 25 como precio regular son hipótesis comerciales a evaluar**, no tarifas aprobadas ni rentabilidad demostrada. Para 20 profesionales a USD 20, ingreso USD 400; restando el escenario de proveedores de USD 26,20 quedan USD 373,80 antes de VPS, backups, soporte, cobro, impuestos, IA, captación y desarrollo. Es un saldo previo a gastos, no ganancia neta.

El ahorro del canal no demuestra que USD 20 alcance para mantener el negocio. Incorporar costo del tiempo humano y, si se incorpora IA, consumo y operación propios. Precio, comisiones de cobro, margen buscado, continuidad ante límites y aceptación de clientes deben validarse antes de publicar la oferta.

Texto comercial ilustrativo, sujeto a definir alcance: “La membresía incluye portal del paciente y comunicaciones de turnos por los canales habilitados, con avisos de respaldo dentro del alcance contratado. No se cobran mensajes individuales sin acuerdo previo”. Sustituir términos vagos por cantidades/condiciones verificables al contratar; no usar “ilimitado” para un servicio que depende de consumo.

## Comparación descartada para beta: Google Forms

Procedencia: [11-formulario-empadronamiento-y-catalogo.md](../11-formulario-empadronamiento-y-catalogo.md), versión anterior a esta limpieza. Sección archivada, sin vigencia operativa.

| Criterio | Formulario propio | Google Forms |
| --- | --- | --- |
| Primer prototipo | Requiere construir un formulario y su validación | Permite preparar una captación manual rápidamente |
| Cuenta y datos reutilizables | Integración con sesión y perfil del portal | Necesita relacionar respuesta externa con cuenta/ficha del sistema |
| Entidad, profesional y práctica | Identificadores validados por servidor | Valores recibidos/importados deben validarse; el formulario no concede permisos de agenda |
| Estado de solicitud y habilitación | Misma base/reglas y bandeja de revisión | Hace falta proceso manual o integración para mantener estados y resolver duplicados |
| Protección del flujo de reservas | Puede aplicarse antes de otorgar capacidad | El envío de una respuesta no prueba identidad ni limita por sí solo el uso de la agenda |
| Operación con muchas entidades | Permisos y trazabilidad dentro del producto | Añade configuración, accesos y sincronización externos |
| Costo | Desarrollo, mantenimiento y defensa propios | También hay costo de integración/operación; no asumir ahorro total por crear un formulario rápido |

Google ofrece API para recuperar respuestas y notificaciones de cambios; por tanto la integración es posible, pero no sustituye el backend ni la autorización del turnero. Su opción de una respuesta requiere iniciar sesión con cuenta Google: una cuenta Google no equivale a un paciente identificado ni evita varias cuentas. La opción de compartir resumen de respuestas debe revisarse para no exponer información a otros respondientes.

**Dirección aceptada en ADR-008:** formulario propio, dentro de la plataforma y usable desde el celular, con bandeja de revisión integrada. Google Forms queda como alternativa comparada, sin incorporarlo al recorrido de beta. Si se reconsidera para un ensayo, definir datos, permisos y responsables; no puede dar acceso ni bloquear horarios por sí solo. Esta revisión no crea formularios externos.

## Referencia técnica reemplazada en el seguimiento local

Procedencia: [08-presupuesto-y-operacion.md](../08-presupuesto-y-operacion.md), versión anterior a esta limpieza. Sección archivada, sin vigencia operativa.

Esta tabla conserva la fotografía del relevamiento anterior de este chat, sin nueva verificación externa en esta actualización. No es manifiesto instalado ni afirmación de versión más reciente a la fecha de lectura. Revalidar parches, soporte y compatibilidad al iniciar la base técnica y antes de desplegar.

| Componente | Referencia estable observada el 15/10/2026 | Verificación pendiente al implementar |
| --- | --- | --- |
| Spring Boot | 4.1.1, marcada estable por su documentación | Java, Spring Security y bibliotecas mediante BOM compatible; pruebas de arranque y seguridad |
| Angular | 22.2.2, publicación estable observada en el repositorio oficial | Angular CLI y dependencias compatibles; comprobar matriz de Node.js/TypeScript/RxJS para 22.2.x |
| PostgreSQL | 18.6, estable más reciente listada en la portada oficial consultada | Extensiones, JDBC, migraciones y alojamiento; comprobar si existe un parche estable posterior al desplegar |

Spring Boot 4.2.0-M2, Angular 22.3.0-next.1 y PostgreSQL 19 Beta 4 son preliminares en las fuentes consultadas, por lo que no forman la base productiva propuesta. La página de compatibilidad de Angular consultada aún enumera 22.0.x; no se afirma haber verificado con ella toda la matriz de 22.2.x. Java y Node.js requieren resolver versiones de ejecución compatibles y mantenidas, sin deducir que el mayor número disponible sea automáticamente apropiado.

Fuentes oficiales:

- [Spring Boot: requisitos y versiones estables](https://docs.spring.io/spring-boot/system-requirements.html).
- [Angular: publicaciones oficiales](https://github.com/angular/angular/releases).
- [Angular: compatibilidad](https://angular.dev/reference/versions).
- [PostgreSQL: publicaciones y versiones](https://www.postgresql.org/).
