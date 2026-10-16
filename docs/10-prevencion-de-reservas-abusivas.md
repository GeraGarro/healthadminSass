# Prevención de reservas abusivas y acceso al portal

Actualización: 15 de octubre de 2026. **Dirección de defensa por capas aceptada en ADR-008**, junto con admisión administrativa de ADR-007. Sin implementación ni pruebas funcionales. Cuotas numéricas, ventanas, umbrales y proveedor anti-bot siguen pendientes.

Nuevo paciente: formulario propio protegido sin capacidad; personal con facultad revisa y acepta antes de activación/vínculo y acceso privado. Conocido: habilitación administrativa verificable. Aprobación persistente, autenticación y permisos comprobados en servidor. Cuenta reutilizable; política entre entidades y catálogo público son evolución por detallar. Ver [estado consolidado](13-estado-consolidado-y-pendientes.md) y [formulario](11-formulario-empadronamiento-y-catalogo.md).

## Problema y dirección aceptada

Una persona o un bot puede agotar agendas mediante cuentas falsas, apropiación de fichas, pre-reservas abandonadas, turnos confirmados ficticios o ciclos de reserva/cancelación. También puede abusar del chat y disparar gastos de verificación, correo o WhatsApp. El cierre T-24 de ADR-004 libera parte de esa capacidad demasiado tarde y el atacante puede confirmar asistencia; no es un control suficiente contra abuso.

**Dirección aceptada para el piloto:** elección de horarios exclusivamente de la práctica «Consulta» habilitada y chat profesional para cuentas autenticadas, vinculadas de forma verificada a la ficha del paciente y explícitamente habilitadas dentro de la entidad. Nuevos interesados pueden solicitar contacto/atención mediante un formulario protegido, sin seleccionar ni bloquear un intervalo. El personal revisa la solicitud, vincula o crea la ficha, valida contacto/relación por el procedimiento acordado y habilita el portal. Se exige habilitación controlada antes de autogestionar capacidad.

La política fue aceptada al consolidar el análisis. La facultad de admisión debe ser explícita para secretaría o profesional que cumpla esa función; el procedimiento de verificación y sus evidencias se detallan antes de implementar. No se exige consulta presencial previa solo por ser paciente nuevo.

## Distinciones necesarias

| Condición | Qué demuestra | Qué no concede automáticamente |
| --- | --- | --- |
| DNI escrito y con formato válido | Un dato declarado con sintaxis admisible | Identidad real, acceso a una ficha o permiso para reservar |
| Correo/teléfono verificado | Control de ese contacto en ese momento | Identidad de la persona atendida o ausencia de abuso; pueden crearse varios contactos |
| Cuenta autenticada | Control de credenciales/sesión válidas | Relación con todas las entidades ni confianza ilimitada |
| Ficha administrativa existente | La entidad conserva un registro | Que quien escribe sus datos sea su titular, ni que posea cuenta activa |
| Cuenta vinculada y habilitada en una entidad | Facultad local otorgada tras revisión de relación/contacto | Acceso a otra entidad o reservas sin cuotas/reglas |

El DNI no es contraseña ni secreto. Nunca conceder acceso al historial o emitir una invitación a un contacto nuevo solamente porque alguien conoce ese DNI. La validación de un correo de alta no realiza una comprobación estatal de identidad. Tampoco se propone recolectar imágenes de documentos o biometría como requisito general del piloto sin justificar el procedimiento y su tratamiento.

## Comparación de acceso

| Alternativa | Riesgo y ventaja | Recomendación |
| --- | --- | --- |
| Anónimo reserva con DNI declarado | Muy poca fricción; fácil falsificación/agotamiento | Descartar como esquema de reserva |
| Registro libre y correo verificado habilita reserva | Permite captar pacientes; muchas cuentas pueden superar la barrera | No usar como control suficiente en piloto |
| Solo cuentas vinculadas/habilitadas, sin entrada de pacientes nuevos | Superficie menor; dificulta captación | Usar el control de habilitación, pero conservar una vía de solicitud de atención |
| Vinculación/habilitación más solicitud inicial sin capacidad | Control local y acceso a pacientes nuevos | Opción adoptada para beta |
| Alta abierta con validación y permisos progresivos | Más autonomía; mayor complejidad y exposición | Evaluar después con evidencia del piloto y controles ya probados |

Una ficha registrada previamente no basta si se permite que el visitante se la adjudique sin verificar vínculo. La habilitación pertenece a la entidad: una cuenta conocida en A no obtiene permisos en B. No se envían a B detalles de agendas, fichas o conversaciones de A por sospecha o reputación compartida.

## Flujo aceptado de incorporación; mecanismo por especificar

### Paciente ya conocido

1. Personal autorizado identifica la ficha correcta dentro de su entidad y verifica que el contacto pertenece a la persona o representante correspondiente mediante el procedimiento acordado.
2. Invita a ese contacto verificado con token aleatorio, limitado, expirable y de uso único. Acceso con cuenta/sesión; no publicar enlaces que abran toda la ficha por conocer un dato.
3. El paciente realiza una acción explícita para activar y vincular su cuenta. Personal conserva facultad de habilitar/revocar el permiso de autogestión; registrar autor, motivo y fecha.
4. La elección de horario por paciente exige además la identidad de la práctica base «Consulta» habilitada, según ADR-005/009, cobertura, disponibilidad, facultades y controles de abuso.

### Paciente nuevo

1. Formulario de solicitud con datos mínimos y contacto, protección anti-bot y límites. Respuesta genérica que no revela si el DNI/correo ya pertenece a una ficha.
2. Verificar contacto y enviar a revisión de admisión; la solicitud no crea pre-reserva, ocupación ni mensajes de confirmación de turnos.
3. Personal revisa posibles coincidencias, situación de representación y relación con la entidad; registra el resultado de la comprobación. Puede atender/agendar la primera consulta por el flujo de personal o completar admisión, activación y vínculo para que el paciente elija horario de la práctica base «Consulta» habilitada.
4. El chat directo al profesional se habilita después de vinculación/permiso, evitando usarlo como buzón público para todos los profesionales. El formulario de admisión tiene su propia cola protegida y no equivale a acceso al chat.

Este proceso no demuestra por sí solo identidad legal: documentar qué se comprobó, qué falta y qué facultad se concede. La habilitación humana puede ser errónea y no sustituye los límites posteriores.

## Defensa por capas aceptada

1. **Acceso y servidor:** no crear ocupación antes de sesión, vínculo local, habilitación y práctica elegible. Validar permisos en cada operación, también por API directa. Revocar sesiones/permisos comprometidos según procedimiento, con trazabilidad.
2. **Pre-reservas:** una cantidad muy acotada de bloqueos activos por actor y paciente, con vencimiento breve y renovaciones limitadas. Contar también abandonos/reintentos; una solicitud de admisión no usa este mecanismo.
3. **Cuotas de turnos:** limitar turnos futuros activos por paciente/profesional y evaluar acumulación por cuenta/entidad. Incluir confirmados y pendientes para que confirmar no libere el cupo. Excepciones clínicas/operativas por personal autorizado y auditadas, respetando exclusión de agenda.
4. **Velocidad y patrones:** límites independientes por cuenta, paciente vinculado, operación, entidad e IP; contemplar ráfagas y periodos mayores, cambios de profesionales y reserva/cancelación/reprogramación. No limitar únicamente por IP: hogares, clínicas y redes móviles pueden compartirla y un atacante puede rotarla.
5. **Control técnico antes de asignar:** cuotas y adquisición de capacidad consistentes ante concurrencia. Comprobar en servidor antes de adquirir el intervalo y revalidar al completar; múltiples solicitudes paralelas no deben aprobarse todas por leer el mismo contador previo.
6. **Protección anti-bot gradual:** servicio como Turnstile o equivalente, con validación en servidor donde corresponda, combinado con cuotas y permisos. No es identificación de una persona ni protección absoluta; prever acceso asistido si falla o resulta inaccesible. Proveedor no seleccionado.
7. **Chat y costos:** límites de inicio de conversaciones, frecuencia, tamaño de mensajes y reenvíos de códigos/invitaciones. Ningún visitante puede enviar verificaciones masivas a terceros ni disparar WhatsApp sin un evento válido. Presupuesto por entidad y alertas de consumo, preservando portal y revisión humana.
8. **Detección y respuesta:** avisar sobre acumulación, abandonos o cambios anómalos; restringir nuevas reservas mientras se revisa según regla acordada. Modo temporal de solo solicitudes, por entidad/agenda, que conserve consulta/confirmación de turnos y permita al personal continuar. No cancelar turnos reales masivamente por una sospecha.

Si se necesita detectar que la misma cuenta opera en varias entidades, diseñar señales técnicas mínimas de abuso separadas de sus datos de salud y con acceso restringido. La coordinación no habilita a una clínica a leer las agendas de otra. Esa excepción de seguridad requiere diseño específico; no inventar una lista clínica compartida de pacientes sospechosos.

## Parámetros pendientes de validación

Fijar TTL, renovaciones, cantidad de pre-reservas, turnos futuros, solicitudes pendientes, ventanas de frecuencia, horizonte de agenda y criterios de revisión con el uso previsto del piloto. Las cuotas incluyen turnos confirmados y contemplan representantes con varios pacientes, familias y atención legítima con distintos profesionales.

No se fija aquí un número universal de bloqueos, turnos o minutos. Probar los valores acordados junto con controles de concurrencia y gestión de excepciones antes de habilitar el flujo.

## Evitar que el bloqueo perjudique al paciente legítimo

- No suspender permanentemente a una ficha porque un visitante escribió su DNI o generó intentos: un atacante podría bloquear a su víctima. La señal de sesión no autenticada no demuestra autoría del paciente.
- No revelar existencia de cuenta, contacto registrado ni datos de pacientes al consultar por DNI o solicitar recuperación.
- Un contacto familiar compartido no se rechaza automáticamente como duplicado fraudulento. Separar paciente representado de actor y aplicar facultades/cuotas justificadas.
- Límites progresivos, revisión y recuperación verificadas; no usar falta de respuesta al correo o una inasistencia aislada como prueba de fraude.
- Protección de tráfico en el borde complementa permisos y cuotas; no reemplaza controles de negocio. Mantener el acceso al origen/proxy correctamente configurado en el diseño de VPS.

## Criterios de verificación antes de beta

1. Solicitudes sin sesión/habilitación y altas nuevas no bloquean ninguna agenda ni disparan avisos de turnos.
2. Conocer DNI/nombre/correo no permite apropiarse de una ficha, recuperar una cuenta ajena ni enumerar pacientes.
3. Una cuenta habilitada en A no obtiene acceso en B sin su propio vínculo y habilitación.
4. Turnos confirmados consumen la cuota de futuros; alternar profesionales, IPs y cancelaciones no elimina todos los controles.
5. Varias solicitudes concurrentes respetan cuota/pre-reservas y consistencia de agenda; reintentos idempotentes no duplican turnos ni gasto.
6. Pacientes/familias legítimos tras una IP/contacto compartido conservan una vía de acceso asistido. Un atacante no bloquea permanentemente a la víctima solo usando su DNI.
7. Invitaciones, recuperación, formulario, chat y mensajes externos tienen límites y alertas propios.
8. Personal autorizado puede revisar, revocar y otorgar excepciones auditadas; un incidente no borra historia ni cancela automáticamente todos los turnos asociados.

## Relación con documentación existente

Esta decisión desarrolla S05/S15/S16 y R02.a/R09.a/R11.a. ADR-008 incorpora su dirección al alcance de beta sin cambiar cronograma de ADR-004 ni prácticas/chat de ADR-005. Reglas, criterios de beta y ayuda memoria se sincronizan en esta consolidación; medir impacto en captación y carga de secretaría. No exigir una foto de DNI, pago/seña o SMS como supuesta solución ya aprobada.

## Fuentes primarias del análisis previo; sin nueva consulta

- [OWASP API6: abuso de flujos sensibles, incluidas reservas](https://api-security.owasp.org/editions/2023/en/0xa6-unrestricted-access-to-sensitive-business-flows/).
- [OWASP: gestión de bots y defensa por capas](https://cheatsheetseries.owasp.org/cheatsheets/Bot_Management_and_Anti-Automation_Cheat_Sheet.html).
- [OWASP: autenticación](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).
- [OWASP: verificación de correo](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html).
- [Cloudflare: validación en servidor de Turnstile](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

Las referencias se conservan del análisis previo. La política de admisión y defensa es decisión del proyecto; las cuotas numéricas se fijarán con el piloto, no se derivan automáticamente de estas fuentes.
