# Portal, correo y comunicaciones incluidas en el abono

Actualización: 15 de octubre de 2026. Dirección de canales y costo integrado aceptada; proveedores, tarifas contractuales, cupos e implementación pendientes. Este documento usa la conversación y los archivos locales; no vuelve a verificar precios externos. Ver [estado consolidado](13-estado-consolidado-y-pendientes.md).

## Flujo operativo vigente

El portal concentra las acciones autorizadas del paciente. Solo puede elegir horarios de la práctica específica «Consulta» habilitada. Extracción, limpieza, cirugía y todas las personalizadas se asignan y reprograman por personal autorizado. La visualización de turnos y confirmación de asistencia se conservan según facultades, aunque el turno lo haya registrado personal.

El acceso exige admisión administrativa, activación/vinculación verificadas y autenticación válida. La cuenta es reutilizable, pero no comparte fichas ni concede acceso automático a otras entidades. El chat incluido es humano, con permisos propios; un mensaje no modifica turnos ni genera WhatsApp automáticamente.

| Hito de confirmación | Acción general aceptada |
| --- | --- |
| Entre T-72 y T-48 | Un correo de solicitud con enlace al portal, en un instante de la ventana por definir |
| T-36 sin confirmación válida | Un WhatsApp de respaldo, revalidando turno y destinatario |
| T-24 sin confirmación válida | Cancelar, liberar y persistir aviso interno a secretaría y/o profesional autorizados, salvo excepción operativa aplicable |

El detalle de concurrencia, reintentos, turnos cercanos, asistencia telefónica y fallos está en [R08](03-reglas-del-dominio.md#r08-confirmación-de-asistencia-y-plazos) y [ADR-004](arquitectura/adr/004-confirmacion-por-correo-y-respaldo.md). Las excepciones se concretan antes de implementar; fallo de canal o presupuesto agotado no causa cancelación por sí solo. Correo y WhatsApp reales deben estar integrados y verificados para entregar el flujo.

## Reprogramación originada por el profesional

[ADR-013](arquitectura/adr/013-reprogramacion-profesional-por-whatsapp.md) confirma **WhatsApp obligatorio** a todos los pacientes con turnos afectados por una fecha o intervalos, incluidos los ya confirmados, con enlace a autogestión. Este envío se origina en el cambio y es independiente de T-36. El portal conserva selección de horario solo para «Consulta» habilitada y deriva las demás prácticas a personal autorizado. El [flujo de canales](04-canales-y-costos.md#reprogramación-por-motivos-del-profesional-whatsapp-obligatorio) propone seguimiento por caso, reintentos y resolución asistida.

Estos WhatsApp y sus reintentos se suman a los respaldos de confirmación estimados más abajo; los escenarios numéricos no incluyen ese volumen. Medir turnos afectados y consumo por entidad antes de presupuestarlo. Correo puede complementar el aviso si se acuerda, pero no reemplaza el WhatsApp requerido. Sin contacto/entrega o sin nuevo horario, conservar el caso pendiente para gestión asistida.

## Contacto y evidencia de respuesta

| Señal | Interpretación operativa |
| --- | --- |
| Dirección escrita | Contacto declarado, todavía por verificar |
| Verificación explícita del buzón | Control de ese contacto, no identidad legal ni autorización sobre una ficha |
| Entrega del proveedor | Señal técnica; no demuestra lectura ni confirmación |
| Apertura o clic | Puede provenir de precarga o automatización; no confirma ni justifica cancelar |
| Acción válida de confirmación | Confirma asistencia del turno vigente bajo facultades verificadas y suprime avisos pendientes de esa acción |
| Rebote, queja o contacto no utilizable | Suprimir intentos inaplicables y derivar a revisión o medio alternativo autorizado |

Ingresar al portal no confirma asistencia. Abrir el enlace muestra la acción; confirmar exige operación explícita sobre token, turno y autorización vigentes. Respuestas libres por correo, WhatsApp o chat no confirman por inferencia. La recepción de correo como bandeja de conversación no está incluida por el solo uso de correo transaccional.

Preferencias y evidencias de contacto se mantienen por entidad y finalidad. En menores se distingue paciente, representante y destinatario facultado. No se comparte entre clínicas un perfil de respuesta del paciente.

## Correo transaccional: propuesta técnica

Usar un proveedor transaccional y dominio autorizado, con configuración SPF/DKIM/DMARC, eventos autenticados, supresiones y reintentos acotados. Remitente, contacto y credenciales se resuelven por entidad. No operar un servidor de correo propio como requisito implícito del VPS.

Un dominio compartido de plataforma o dominios propios de clientes son alternativas por decidir. La configuración elegida debe identificar claramente a la entidad y controlar reputación y abuso. Cien profesionales no implican cien dominios.

Las [reglas de canales](04-canales-y-costos.md) detallan el aislamiento, el worker y el tratamiento de fallos.

## Supuestos económicos del relevamiento anterior

Los siguientes valores son referencias históricas de planificación, sin nueva verificación de precios. No seleccionan proveedor ni fijan precio de venta. Antes de contratar, revalidar categoría de mensaje, mercado, modalidad de correo, dominios, impuestos, disponibilidad y cargos adicionales.

| Referencia conservada | Supuesto de cálculo |
| --- | --- |
| SES a la carta | USD 0,10 por 1.000 correos salientes, cargo base |
| SES Essentials | USD 0,16 por 1.000 en el tramo registrado; modalidad por comprobar |
| Resend Pro | USD 20/mes, 50.000 correos y hasta 10 dominios según el relevamiento previo |
| Meta utilidad Argentina | USD 0,026 por aviso, provisional; tabla vigente no verificada |
| Intermediario ilustrativo | USD 0,005 adicionales por aviso saliente; no se incluyen respuestas entrantes en esta tabla |

Fuentes conservadas, sin nueva consulta: [SES](https://aws.amazon.com/ses/pricing), [Resend](https://resend.com/pricing), [referencia histórica de utilidad Argentina](https://www.alibabacloud.com/help/en/chatapp/notice-about-whatsapp-individual-country-message-fee-update), [Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) y [Twilio](https://www.twilio.com/en-us/whatsapp/pricing).

## Escenarios del flujo aceptado

Hipótesis: 100 turnos mensuales por profesional, todos elegibles para correo; un solo respaldo por turno pendiente. Altas, recuperación, comprobantes, cambios y otros eventos se suman por separado.

| Profesionales | Turnos y correos de solicitud/mes | Correo SES a la carta / Essentials, cargo base | Resend Pro bajo el supuesto |
| --- | --- | --- | --- |
| 20 | 2.000 | USD 0,20 / USD 0,32 | USD 20 |
| 100 | 10.000 | USD 1 / USD 1,60 | USD 20 |

| Profesionales | Turnos que requieren respaldo, hipótesis | WhatsApp/mes | Meta supuesto | Meta más cargo saliente del intermediario |
| --- | --- | --- | --- | --- |
| 20 | 10% | 200 | USD 5,20 | USD 6,20 |
| 20 | 100% | 2.000 | USD 52 | USD 62 |
| 100 | 10% | 1.000 | USD 26 | USD 31 |
| 100 | 100% | 10.000 | USD 260 | USD 310 |

Con Resend Pro y el intermediario modelado, el ejemplo al 10% suma USD 26,20/mes para 20 profesionales y USD 51 para 100. Al 100% suma USD 82 y USD 330. No incluye dominios extra, otros eventos que excedan el plan, impuestos, respuestas, VPS, copias, soporte, captación ni desarrollo. No es ganancia, cotización integral ni presupuesto aprobado. El porcentaje real de respaldo debe medirse.

## Abono comercial y presupuesto técnico

La dirección aceptada incluye comunicaciones en el precio total contratado, con condiciones transparentes y sin recargos sorpresivos por API. Precio, unidad de cobro, cupos, excepciones y rentabilidad siguen abiertos. El motor de suscripciones se difiere a I2/I3.

En esta documentación, **membresía** se reserva a la relación de usuario con una entidad. **Abono** o **suscripción comercial** nombran la contratación del SaaS. Pagar un abono no otorga permisos de agenda, lectura de fichas ni autorización para contactar por cualquier canal.

Antes de publicar la oferta hay que acordar alcance incluido, responsable del proveedor, presupuesto por entidad, alertas y actuación ante límites. El portal y los turnos no deben perderse por agotamiento de mensajes; se genera revisión operativa. La selección de canales debe respetar el flujo aceptado y las autorizaciones del destinatario.

Los paquetes, adicionales y tarifas ilustrativas anteriores se conservan en el [archivo histórico](archivo/2026-10-15-analisis-sustituidos.md), sin vigencia de oferta.

## Evidencia pendiente

Medir contactos verificados, rebotes, confirmaciones válidas en plazo, porcentaje de respaldo, consumo por entidad y trabajo de secretaría. Probar representación, contacto compartido, fallos, confirmación concurrente, reprogramación, eventos repetidos y agotamiento del presupuesto con tratamiento asistido definido. No usar aperturas como evidencia principal.

Las pruebas funcionales y de envío real se ejecutarán cuando exista aplicación; esta documentación no declara integraciones operativas.
