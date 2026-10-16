# Acceso al portal después de aprobación administrativa

Fecha: 15 de octubre de 2026. Diseño de acceso aceptado por el responsable y consolidado en ADR-008; sin implementación ni contratación. Google + alternativa por correo adoptados como dirección de beta, mecanismos concretos pendientes. Ver [estado consolidado](13-estado-consolidado-y-pendientes.md).

## Regla de acceso vigente

El procedimiento es adecuado para la beta como admisión controlada: secretaría u otro personal expresamente autorizado registra al paciente o acepta su solicitud; solo después se permite el acceso al portal de autogestión del contexto aprobado. La aprobación persiste mientras esté vigente y no se repite en cada inicio de sesión.

**Métodos de beta del paciente:** Google y alternativa por correo, con recuperación segura. Queda por definir si el correo usa contraseña, código o enlace, junto con sesión y vinculación. Otros proveedores no forman parte de este recorrido. La recuperación por email de secretaría, administradores y profesionales está confirmada en ADR-012; su diseño y el alta de quien gestiona la adquisición se analizan aparte en [registro y recuperación](20-registro-de-usuarios-y-recuperacion-de-acceso.md). El formulario comercial no sustituye esta admisión.

## Dos comprobaciones separadas

| Comprobación | Responsable | Resultado |
| --- | --- | --- |
| Autenticación: quién controla la cuenta usada para ingresar | Proveedor de identidad o mecanismo de credenciales del sistema | Identidad de acceso verificada técnicamente, no validación del DNI del paciente |
| Autorización: a qué portal, ficha, agenda y chat puede acceder | Backend con aprobación administrativa vigente y vínculo correcto | Acceso solo al contexto/recursos aprobados |

Una credencial válida del proveedor no concede por sí sola facultades de paciente: el servidor exige admisión, activación/vinculación y permisos vigentes para el contexto solicitado.

Si se decide identificar a alguien para consultar estado de solicitud, ese trámite es de alcance limitado: no abre reservas, ficha, chat ni historial clínico. Una pantalla pública o solicitud protegida puede existir antes de la admisión; no constituye acceso al portal privado. El diseño de esa consulta de estado sigue pendiente.

## Flujo aceptado; detalle técnico pendiente

1. **Ingreso por alta del personal:** secretaría con facultad de admisión registra datos/contacto y la relación correcta con entidad/profesional, revisa correspondencia con ficha y otorga habilitación. No elige ni conoce la contraseña del paciente ni sus credenciales Google.
2. **Ingreso por solicitud nueva:** formulario protegido con datos mínimos y contacto; estado pendiente. No crea turno/pre-reserva, no dispara avisos de confirmación y no abre chat privado.
3. **Revisión administrativa:** personal con permiso consulta solo sus solicitudes, verifica contacto/correspondencia con ficha/representación y aprueba, pide corrección o rechaza con motivo interno. Registrar autor, entidad/contexto, fecha y resultado; revisión humana no equivale por sí sola a validación estatal de identidad.
4. **Activación por el paciente:** invitación o mecanismo equivalente vincula de forma verificable la cuenta al contexto aprobado. Si hay enlace, debe ser aleatorio, expirable, de uso único y de alcance limitado. El paciente elige el mecanismo disponible y demuestra control de su contacto/cuenta.
5. **Acceso habitual:** autenticar al usuario, comprobar habilitación vigente en el servidor y resolver sus contextos permitidos. Accede a selección de la práctica «Consulta» elegible y a sus turnos/chat según facultades, sin nueva autorización administrativa en cada ingreso.
6. **Suspensión o revocación:** impedir nuevas operaciones del contexto afectado y revalidar sesiones abiertas. Una baja local no borra cuenta, historia o habilitaciones de otras entidades ni cancela turnos automáticamente; tratamiento operativo de turnos vigentes se define aparte.

No fusionar cuentas o vincular fichas automáticamente solo por coincidencia de DNI, nombre, correo o número de teléfono. Añadir/cambiar un proveedor de acceso requiere un proceso autenticado o recuperación verificada, no una nueva solicitud que permita apropiarse de otra cuenta.

## Estados del vínculo de acceso adoptados para el diseño

| Estado | Facultades de autogestión |
| --- | --- |
| Solicitud pendiente | Sin acceso al portal privado, reservas o chat; eventual consulta limitada del propio trámite por mecanismo verificado |
| Aprobado, activación pendiente | Permite completar activación/invitación; aún sin sesión con facultades de paciente sobre esa ficha |
| Activo | Acceso autenticado al contexto aprobado; elección de horario solo de la práctica base «Consulta» habilitada, con permisos y controles antiabuso |
| Rechazado | Sin autogestión del contexto; canal para corregir o pedir revisión según política |
| Suspendido/revocado | Sin nuevas operaciones del contexto; revisión/recuperación por personal autorizado |

Son estados de admisión/vínculo, no estados de turno ni una prohibición de usar una cuenta legítima en otra entidad habilitada. Las reglas de transición, activación, revisión y plazos se concretarán al modelar.

## Integración propuesta de identidad

Para Google se usan mecanismos establecidos de OpenID Connect y validación en servidor, vinculando la identidad externa estable de proveedor (`iss`/`sub`) con la cuenta interna; el correo visible no debe usarse como única clave de identidad. Verificar credencial, destinatario de token, emisor y vencimiento con bibliotecas mantenidas y protecciones del flujo elegidas. El identificador de identidad externa no sustituye el `paciente_id` ni su numeración profesional/entidad.

La documentación de Google exige validación del ID token en servidor y recomienda identificar por `sub`. Un correo verificado y el control de una cuenta Google no demuestran que el usuario sea el titular de un DNI ni que secretaría le haya concedido acceso al profesional.

Spring Security dispone de soporte OAuth2/OIDC; las facultades locales deben resolverse con las relaciones y habilitaciones propias del sistema. No aceptar como administrador a alguien por el correo o los permisos genéricos de su proveedor. No solicitar acceso a correo, Drive o redes sociales para iniciar sesión si no existe una función que lo justifique.

## Fortalezas y límites del procedimiento

**Ventajas:** evita altas autónomas con capacidad inmediata, da a la entidad una bandeja de admisión y vincula acceso con un responsable. Facilita un piloto de incorporación controlada y permite una cuenta reutilizable sin abrir agendas ajenas.

**Límites:** personal puede aprobar datos equivocados, una cuenta aprobada puede ser tomada y un paciente habilitado puede abusar. Mantener cuotas de turnos futuros —confirmados incluidos—, pre-reservas acotadas, límites de solicitudes/códigos/chat y alertas. La defensa por capas del análisis 10 fue aceptada al consolidar el chat en ADR-008; números y proveedores siguen pendientes.

Definir responsables y plazos de revisión para evitar que el trámite se convierta en una cola desatendida. Proveer un circuito asistido para pacientes sin los medios digitales elegidos. Las respuestas públicas de acceso/recuperación no deben revelar si existe una ficha o un correo ajeno. Un estado de trámite puede mostrarse al solicitante verificado sin exponer información clínica o motivos internos.

## Compatibilidad con decisiones vigentes y futuro catálogo

- ADR-005: paciente activo solo elige la práctica «Consulta» habilitada; personal asigna las demás prácticas. El chat requiere habilitación y autorización de participantes específica.
- ADR-004: los turnos registrados usan correo T-72/T-48, WhatsApp T-36 y cierre T-24; autenticarse no confirma asistencia por sí solo.
- ADR-001: identidad de acceso reutilizable, fichas/turnos/chat aislados por entidad. Una autorización local no es permiso para todas las clínicas.
- ADR-006: se resuelve quién habilita la nueva autogestión: actor administrativo autorizado. Formulario propio adoptado en ADR-008; criterios de verificación, campos y activación pendientes. Política entre entidades por definir como evolución. La aprobación automática de nuevos queda fuera del procedimiento de beta aclarado por el responsable.
- El catálogo público futuro puede seguir mostrándose sin admisión al portal privado. Nuevo vínculo de atención no implica nueva cuenta; su política entre entidades continúa en análisis. Publicar un profesional o contratar un abono no concede acceso automático a sus agendas; tampoco la membresía de entidad sustituye los permisos específicos.

## Criterios para considerar aceptable la beta

1. Sin aprobación vigente, una credencial externa válida no permite reservas, pre-reservas, chat ni leer fichas por pantalla o API.
2. El rol de admisión es explícito por contexto; paciente o personal sin facultad no pueden aprobarse ni aprobar terceros. Permiso de agenda no sustituye el permiso de admisión.
3. Aprobación y activación vinculan a la ficha/representante/contexto correctos, con invitaciones limitadas y trazabilidad.
4. Inicio de sesión repetido reutiliza la cuenta y habilitación; alta de otra identidad externa no duplica ni apropia fichas.
5. Revocación local se aplica con pantalla abierta y conserva aislamiento de otras entidades y la historia.
6. Solicitudes duplicadas, tokens repetidos/vencidos, recuperación, representación y cambios de proveedor no eluden la admisión ni revelan pacientes ajenos.
7. Límites antiabuso también operan para cuentas activas; existe responsable del trabajo pendiente y acceso asistido.

## Fuentes primarias del análisis previo; sin nueva consulta

- [Google: validar ID token en servidor](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
- [Google OpenID Connect: identificadores y atributos](https://developers.google.com/identity/openid-connect/reference).
- [OWASP: autorización distinta de autenticación](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).
- [Spring Security: OAuth2 Login](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html).

La aceptación confirma el diseño, no su implementación, certificación ni cumplimiento demostrado. Las fuentes se conservaron del análisis previo y no se reconsultaron para esta actualización exclusiva del chat.
