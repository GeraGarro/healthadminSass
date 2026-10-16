# Registro de usuarios y recuperación de acceso

Fecha: 15 de octubre de 2026. Recuperación por email para secretaría, administración y profesionales: requisito confirmado en [ADR-012](arquitectura/adr/012-recuperacion-y-alta-de-usuarios.md). Pantallas, mecanismos y alta de quien gestiona la adquisición: propuesta para revisión. Sin aplicación ni envío de correos implementados.

## 1. Respuesta sobre el registro

Se recomienda **formulario de alta que crea o reutiliza una cuenta personal y solicita la incorporación de una entidad**. Formulario y cuenta son partes del mismo recorrido. La cuenta identifica a la persona; la entidad representa la clínica o actividad independiente. La contratación y sus contactos se registran aparte.

Para la beta, plataforma revisa y habilita la entidad y su primer administrador. El formulario no activa planes, cobra ni concede permisos administrativos por sí solo. El alta asistida también está disponible: plataforma prepara la solicitud y envía invitación; el destinatario activa su cuenta y establece sus credenciales. Nunca se entrega una contraseña elegida por el operador.

| Alternativa | Ventaja | Limitación | Recomendación |
| --- | --- | --- | --- |
| Crear todo manualmente desde plataforma | Incorporación controlada y acompañamiento | Carga operativa, errores de transcripción y dependencia de soporte | Conservar como vía asistida, con activación personal |
| Registro abierto con entidad y administrador activos de inmediato | Menos intervención inicial | Permite altas indebidas y requiere controles de contratación aún pendientes | No adoptarlo para la beta |
| Formulario propio + cuenta verificada + habilitación por plataforma | Recoge datos del solicitante y conserva control de incorporación | Requiere bandeja y responsable de revisión | Propuesta recomendada para beta |

La solicitud no prueba representación de una clínica. Verificar la facultad de quien la solicita y la del primer administrador antes de habilitar. Tener una cuenta verificada solo demuestra control del método de acceso.

## 2. Cuentas, responsabilidades y permisos

| Actor | Alta propuesta | Límite |
| --- | --- | --- |
| Responsable de contratación | Formulario propio o invitación asistida; reutilizar cuenta existente mediante autenticación | Contacto comercial; puede tramitar la adquisición sin administrar agendas ni pacientes |
| Primer administrador de entidad | Designación revisada por plataforma, invitación y activación verificadas | Administra solo su entidad y facultades asignadas; no se convierte en administrador de plataforma |
| Otros administradores de entidad | Invitación por actor con facultad explícita para conceder ese alcance | No otorgar más facultades de las que el otorgante puede conceder; cambios sensibles con autenticación reforzada |
| Secretaría | Invitación de personal autorizado de la entidad | Membresía y facultades explícitas; para agendas, delegación del profesional conforme a R04 |
| Profesional invitado | Invitación de personal autorizado y verificación del vínculo profesional | Cuenta e identidad persistentes; pertenecer a una clínica no concede acceso a otras |
| Profesional que contrata como independiente | Cuenta existente autenticada o alta personal + solicitud de entidad propia | Puede reunir funciones de contratante, administrador y profesional mediante concesiones explícitas |
| Administrador de plataforma | Aprovisionamiento controlado por operación con MFA | No existe registro público para este rol; separar de cuentas técnicas de desarrollo |
| Paciente/representante | Admisión y activación del [documento 12](12-acceso-con-aprobacion-administrativa.md) | El registro comercial no reemplaza la aprobación administrativa del paciente |

Una persona puede tener varios roles y entidades con una sola cuenta. Cada operación comprueba el contexto actual en servidor. No crear una cuenta genérica «Clínica X» compartida por todo el personal. El correo de facturación puede ser compartido como contacto, sin convertirlo en credencial colectiva.

El responsable de contratación, el futuro titular contractual y el administrador de entidad pueden ser personas diferentes. El modelo contractual, pagador, comprobantes y planes continúa en I2/I3. Para beta basta registrar solicitante, contacto y designación operativa verificada; no inferir titularidad legal a partir de un campo del formulario.

## 3. Alta propuesta del solicitante

1. **Entrada:** «Solicitar incorporación» para cuenta nueva o «Ya tengo cuenta» para quien pueda autenticarse. No pedir seleccionar secretario/administrador/profesional como mecanismo de concesión de privilegios.
2. **Verificación:** recoger nombre y email personal, y verificar el contacto mediante invitación o enlace limitado. Si la cuenta ya existe, solicitar acceso normal o recuperación; no unir cuentas automáticamente por coincidencia de correo. La respuesta pública no revela su existencia.
3. **Cuenta:** la persona establece su contraseña, o utiliza un proveedor admitido con vinculación verificada. La cuenta pendiente solo permite completar su incorporación y consultar su propio trámite.
4. **Solicitud de entidad:** tipo «Clínica/institución» o «Profesional independiente», nombre de la entidad y relación del solicitante («Seré administrador» / «Gestiono para otra persona»). Si el administrador será otro, recoger su contacto y enviarle una invitación propia después de la revisión. Teléfono opcional solo si tiene utilidad operativa acordada.
5. **Revisión de plataforma:** verificar solicitante, representación y destinatario administrador; detectar duplicados sin revelar entidades ajenas. Aprobar, pedir corrección o rechazar con motivo interno y trazabilidad. No crear una segunda entidad ante un reintento.
6. **Habilitación:** crear o reutilizar la entidad correcta y asignar la primera membresía administrativa mediante operación autorizada e idempotente. Si el destinatario no completó la activación, la concesión queda pendiente de aceptación verificada.
7. **Incorporar equipo:** invitar personas y otorgar permisos acotados. Configurar agendas y delegaciones en su recorrido específico.

Campos mínimos iniciales: nombre, email, tipo/nombre de entidad y relación con la solicitud. La verificación de representación y el contacto de otro administrador se completan en contexto limitado autenticado. Datos fiscales, medios de pago, planes, CUIT y condiciones contractuales se especificarán en su incremento; no recoger DNI ni datos de pacientes para esta solicitud.

Estados propuestos de la solicitud comercial: `borrador`, `contacto_pendiente`, `en_revision`, `requiere_correccion`, `aprobada`, `rechazada`, `retirada`. Son distintos del estado de cuenta, membresía, admisión del paciente y suscripción. Cuenta activa con solicitud pendiente no tiene acceso operativo a una entidad. La bandeja requiere responsable y plazos acordados antes del piloto.

## 4. Invitaciones del equipo

Una invitación identifica entidad, destinatario, alcance permitido, emisor y vencimiento. Aceptarla exige verificar la cuenta destinataria; tener el enlace reenviado no debe permitir asignar la membresía a otra persona. Para una cuenta existente, exigir autenticación y correspondencia verificada, sin vincular otro proveedor por email coincidente.

La invitación no contiene una contraseña ni permite elegir permisos adicionales. Revocar la invitación impide aceptarla; reintentos no duplican usuarios o membresías. La baja institucional conserva la cuenta y el fichaje conforme a ADR-011. Ser administrador de entidad no permite cambiar el email global, restablecer directamente credenciales de otra persona ni apropiarse de su cuenta.

## 5. Interfaz de recuperación confirmada; detalle propuesto

Una misma entrada «Olvidé mi contraseña» sirve para secretaría, profesionales y administradores; no solicita rol ni entidad. Trabaja sobre la cuenta personal y su email verificado. [Maqueta navegable](prototipos/acceso-y-registro.html): recorrido local con datos ficticios, sin backend, envío de correo ni persistencia de credenciales.

| Pantalla | Contenido y acción | Resultado esperado en la futura aplicación |
| --- | --- | --- |
| Iniciar sesión | Email, contraseña, «Ingresar», «Olvidé mi contraseña», acceso al alta y proveedor cuando corresponda | Autenticar y resolver contextos vigentes en servidor |
| Recuperar contraseña | Email y «Enviar enlace» | Solicitud protegida sin pedir contraseña anterior |
| Revisá tu correo | «Si ese correo corresponde a una cuenta habilitada para este método, recibirás instrucciones.»; reenvío sujeto a límites y volver | Mensaje, código y tiempos de respuesta equivalentes para cuentas existentes/inexistentes; sin mostrar clínicas o roles |
| Nueva contraseña | Nueva contraseña, repetición y «Guardar contraseña» | Validar token y política en servidor; el enlace solo concede cambiar la credencial |
| Enlace inválido | «El enlace no es válido o ya no está disponible» y nueva solicitud | Rechazar vencido, revocado, usado o manipulado, sin revelar el motivo interno |
| Contraseña actualizada | Confirmación y «Volver a ingresar» | Notificar al correo verificado y exigir nuevo login y MFA cuando corresponda |
| Sin acceso al email | Canal de asistencia y explicación del proceso | Verificación asistida, registrada y con facultad específica; no cambiar contacto solo por declarar DNI, clínica o rol |

Se propone email + contraseña local para estos roles cuando usen acceso por correo. Esto concreta su necesidad de restablecimiento; la elección del método del portal de pacientes sigue pendiente. Para cuentas exclusivamente Google, orientar al acceso/recuperación del proveedor por canal verificado. El formulario público conserva la respuesta genérica. Recuperar una contraseña local no crea credenciales locales para una cuenta solo externa ni elimina MFA; alta/cambio de método y recuperación de MFA tienen procesos propios.

## 6. Controles de implementación propuestos

- Usar tokens aleatorios de alta entropía generados mediante mecanismos mantenidos, almacenar su huella y limitar propósito, destinatario, vencimiento y uso único. Propuesta inicial de vigencia: **30 minutos**, valor por revisar antes de implementar. Invitaciones, verificación de email, cambio de email y confirmación de turno usan propósitos separados.
- Abrir el enlace mediante GET no cambia contraseña, consume el token ni inicia sesión. La confirmación explícita envía un POST protegido según el mecanismo de sesión. Verificar todo nuevamente en servidor al guardar.
- Consumir el token, guardar la nueva credencial protegida, invalidar los demás tokens de restablecimiento y revocar sesiones/renovaciones de la cuenta con garantía de consistencia. Dos guardados simultáneos con el mismo token solo permiten un cambio. No bloquear la cuenta ni invalidar sesiones por la mera solicitud pública; evitar que terceros causen la baja por pedir enlaces repetidamente.
- Mantener una política de contraseñas consistente entre alta, cambio y recuperación; admitir gestores y pegado. Algoritmo, parámetros, política exacta, límites/reenvíos, cuotas de envío y tratamiento de tokens coexistentes quedan por fijar. La maqueta solo exige coincidencia y campos completos; no representa validación de seguridad.
- Respuesta pública genérica y tiempos comparables; procesamiento de correo desacoplado, límites por cuenta/destino, origen y presupuesto global. Evitar que una IP compartida provoque un bloqueo indiscriminado. Registrar fallos de entrega sin filtrar existencia de cuentas.
- Generar enlaces HTTPS desde origen configurado y confiable, sin usar libremente `Host` ni redirecciones aportadas por el solicitante. Evitar tokens en logs, analítica, terceros o encabezados de referencia; usar política `no-referrer` y excluir estas pantallas de recursos externos. Nunca mandar la contraseña por email.
- Notificar el cambio al email verificado, sin incluir contraseña. Mantener permisos, suspensiones y bajas: restablecer credenciales no reabre membresías ni contexto institucional revocado. La baja de una clínica no impide recuperar una cuenta global legítima con credencial vigente.
- Para administradores de producción, conservar el requisito S06 de MFA y autenticación reforzada en acciones sensibles. El email no basta para recuperar el segundo factor ni para transferir administración. Cambios de email exigen autenticación/verificación específica y notificaciones; contemplar al profesional que pierde su correo institucional al dejar una clínica.
- Auditar solicitudes, resultados de consumo, revocaciones y concesiones con acceso restringido. No registrar contraseña, token completo, cuerpos de correo o fichas de pacientes. Distinguir eventos globales de identidad de los eventos de una entidad; no permitir a un administrador local inspeccionar todas las actividades globales del usuario.

Estos controles desarrollan S01, S04, S05, S06, S10 y S15. Son especificaciones por implementar y verificar, no controles superados.

## 7. Modelo conceptual propuesto

| Registro | Responsabilidad |
| --- | --- |
| Cuenta personal | Identificador interno estable, estado de identidad y contacto de acceso verificado; persiste al finalizar una membresía |
| Credencial / identidad externa | Contraseña protegida o identidad estable `iss`/`sub`, independiente de roles y entidades |
| Token de acción | Huella, cuenta/destinatario, propósito, vencimiento, uso/revocación y correlación; sin permisos de agenda |
| Solicitud de incorporación | Solicitante, tipo/nombre de entidad, relación declarada, designación administrativa, estado y decisiones de revisión |
| Entidad y membresía | Contexto de datos, persona, funciones y vigencia; separado de cuenta global y contrato |
| Invitación | Emisor autorizado, entidad, destinatario verificado, alcance y estado, vinculada a token de activación propio |
| Responsabilidad comercial | Solicitante/contacto y futura relación con contrato, titular y pagador; detalle de I2/I3 |
| Evento de auditoría | Actor real, ámbito autorizado, acción, momento y resultado sin secretos |

No son tablas SQL ni un contrato de API aprobado. Definir comparación/normalización del email de forma consistente y segura, restricciones, idempotencia y enlace de identidades antes de construir.

## 8. Criterios de aceptación futuros

1. Secretaría, administrador de entidad y profesional con credencial local recuperan acceso usando su email verificado y completan un nuevo login; administrador de plataforma mantiene MFA.
2. Email inexistente y existente reciben la misma respuesta pública y comportamiento temporal comparable; no se revelan roles, entidades, estado de solicitud o datos de pacientes.
3. Token usado, vencido, de otro propósito o alterado no modifica credenciales; GET y previsualización del email no lo consumen. Un POST concurrente gana una sola vez.
4. Tras el cambio, contraseña anterior, tokens de restablecimiento pendientes y sesiones anteriores dejan de servir. Solicitar el enlace sin usarlo no suspende la cuenta ni cierra sesiones.
5. Recuperar no reactiva una membresía revocada, no concede otro rol y no une cuentas ni fichas. Una baja institucional conserva la posibilidad de recuperación global legítima.
6. Cuenta exclusivamente externa no obtiene contraseña local por este flujo; restablecimiento local no evita MFA ni vincula otro proveedor.
7. Límites y fallos de envío no revelan cuentas; el canal de asistencia no permite apropiación por declarar un DNI o una clínica. No hay secretos en logs, referencias o analítica.
8. Una solicitud comercial y email verificado no conceden administración. Plataforma verifica la designación del primer administrador y deja trazabilidad.
9. Cuenta profesional existente que solicita entidad independiente se reutiliza después de autenticar; no duplica identidad, no transfiere fichas automáticamente y respeta ADR-011.
10. Un contacto comercial sin facultades operativas no lee fichas/agendas/chat. Una persona con varios roles conserva ámbitos separados.
11. Invitación reenviada, revocada, repetida o aceptada con otra cuenta no concede facultades indebidas; solo un emisor con alcance suficiente puede otorgarlas.
12. Alta asistida y reintentos de aprobación no duplican entidad, cuenta, invitación o membresía. Los pacientes conservan el flujo de admisión vigente.

Son escenarios para la futura aplicación. Las comprobaciones de la maqueta solo verifican navegación y presentación.

## 9. Decisiones que requieren revisión

- Adoptar el formulario + revisión de plataforma como vía principal de incorporación en beta, conservando alta asistida.
- Confirmar campos, evidencia de representación, responsable/plazo de revisión y concesión de la primera administración.
- Aprobar email + contraseña para personal y el mecanismo concreto de identidad/sesión; definir MFA, recuperación asistida y cambios de correo institucional.
- Fijar vigencia, coexistencia de tokens, límites, política de contraseñas, remitente/proveedor y presupuesto de correo transaccional. Estos correos se suman a los de confirmación de turnos; el costo aún debe estimarse.
- Revisar la maqueta antes de pasar a implementación según el [plan supervisado](02-plan-de-trabajo.md). El motor contractual y de cobro sigue en I2/I3.

## Verificación del entregable

El 15/10/2026 se revisó la maqueta en Chromium/Chrome con Playwright: 12 pantallas a 1440, 760 y 390 píxeles, sin desborde horizontal, errores JavaScript ni solicitudes HTTP externas. Se comprobó navegación de recuperación, reenvío simulado, rechazo de contraseñas distintas, visualización opcional, nueva solicitud ante enlace inválido, activación simulada y campos obligatorios del administrador propuesto cuando es otra persona. No se utiliza almacenamiento local ni de sesión. Se inspeccionaron visualmente escritorio, móvil y formulario de entidad.

Se verificaron los enlaces locales de los 35 documentos Markdown existentes. La ayuda memoria A4 se regeneró desde su JSON y se revisó visualmente. Estas comprobaciones corresponden a documentación/presentación; no verifican autenticación, correo, tokens, autorización, seguridad ni persistencia de una aplicación.

## Fuentes técnicas consultadas

Consulta del 15/10/2026: [OWASP: Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) y [OWASP: Email Validation and Verification](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html). Sustentan los controles de recuperación/verificación; no eligen el recorrido comercial del producto ni acreditan su implementación.
