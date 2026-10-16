# Evaluación de seguridad de V1 beta

Actualización: 15 de octubre de 2026. Seguridad básica y reglas contra conflictos entre entidades incluidas en el alcance de beta; aislamiento del inciso 5 y criterios de permisos/auditoría de ADR-002 aceptados, con diseño detallado y verificación aún pendientes. ADR-008 acepta la dirección de controles complementarios de admisión/abuso; [estado consolidado](13-estado-consolidado-y-pendientes.md). Ningún control se considera implementado por figurar en este documento.

## Recomendación

**Seguridad básica desde el primer incremento, verificada antes de entregar la beta.** El responsable confirmó que la beta debe prevenir conflictos entre entidades. Las siguientes revisiones pueden ampliar el marco y sus herramientas, pero credenciales, permisos, aislamiento y recuperación condicionan el funcionamiento correcto del SaaS.

No se propone crear una estructura empresarial extensa para empezar. Se propone un marco breve: identificar amenazas del producto, asignar controles, verificarlos en sus flujos y registrar la evidencia. [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) sirve para seleccionar requisitos verificables durante el desarrollo; no se declara conformidad o certificación.

## Riesgos relevantes del producto

- Un paciente consulta un turno ajeno cambiando su identificador.
- Una secretaría opera una agenda de otra entidad o conserva privilegios después de revocarlos.
- El coordinador común de capacidad expone datos de un consultorio a otro.
- Una cuenta comprometida o recuperación insegura concede acceso a agendas.
- Un enlace reenviado o previsualizado confirma una asistencia sin una acción autorizada.
- Un representante obtiene facultades sobre un menor que no le corresponden.
- Un webhook falso, reintentos abusivos o reservas masivas alteran turnos o agotan recursos.
- Credenciales o datos sensibles quedan en logs, entornos de pruebas o backups accesibles.
- Un fallo de persistencia o despliegue impide recuperar turnos registrados.
- Un canal mal configurado envía el aviso de A desde una cuenta de B o un webhook altera comunicaciones ajenas.

## Controles exigidos para el incremento 1; implementación pendiente

| ID | Control | Evidencia necesaria antes de entrega |
| --- | --- | --- |
| S01 | Autenticación con mecanismos establecidos, contraseñas protegidas, recuperación y revocación de sesiones | Acceso inválido rechazado; recuperación limitada y expirable; cuenta/sesión revocada sin privilegios restantes |
| S02 | Autorización en servidor por entidad, recurso y acción; mínimo privilegio y delegación vigente | Pruebas negativas entre entidades, pacientes y agendas; revocación con pantalla abierta |
| S03 | Contrato aceptado del inciso 5: `tenant_id`, integridad de relaciones y RLS; ocupación común mínima y coordinador acotado | Rol real sin bypass; operaciones y relaciones cruzadas denegadas; contexto ausente y conexiones reutilizadas tras error; cobertura de tablas y conflicto de capacidad sin datos ajenos |
| S04 | HTTPS, sesiones protegidas y protección CSRF cuando corresponda al mecanismo elegido | Configuración de despliegue revisada; cookies/expiración y rutas mutables protegidas |
| S05 | Validación de entradas y consultas seguras; límites en acceso, recuperación, pre-reservas y avisos | Solicitudes inválidas y abusivas rechazadas sin alterar estado ni retener agendas indefinidamente |
| S06 | MFA para cuentas administrativas de producción y separación de desarrollo/operación | Cuenta administrativa protegida y facultades limitadas; pruebas ordinarias con datos ficticios |
| S07 | Tokens de confirmación acotados, expirables y revocables; acción explícita e idempotencia | GET no confirma; token vencido/reprogramado rechazado; repetición sin cambios adicionales |
| S08 | Secretos fuera de Git; validación de webhooks y dependencia/configuración revisadas | Sin credenciales versionadas; webhook inválido rechazado; revisión de hallazgos relevantes del despliegue |
| S09 | Privacidad básica, representación verificada y destinatario autorizado de avisos | Matriz de facultades para menores; contactos y avisos acordados; contenido mínimo, sin acceso familiar automático |
| S10 | Auditoría restringida, errores sin datos sensibles y monitoreo operativo básico | Autor y destinatario trazables; ausencia de tokens/contraseñas en logs; detección de fallos del flujo |
| S11 | Backups protegidos, acceso restringido y restauración comprobada | Recuperación en un entorno separado con turnos íntegros; responsables y procedimiento documentados |
| S12 | Procedimiento breve de incidentes, revocación y actualización del servicio | Responsable identificado y ensayo de bloqueo de cuenta comprometida y recuperación operativa |
| S13 | Restricción de elección de horario por actor e identidad de la práctica base «Consulta», según ADR-005/009 | Paciente solo elige «Consulta» habilitada; rechazar extracción, limpieza, cirugía y todas las personalizadas, también si se renombran o reclasifican como consulta, por API y al reprogramar. Personal autorizado sí puede asignarlas |
| S14 | Chat por entidad y participantes con facultades verificadas, separado del permiso de agenda | Paciente/profesional autorizados intercambian mensajes; otro paciente, entidad o secretaría con solo delegación de agenda no accede; verificar representantes y revocación |
| S15 | Admisión administrativa previa al acceso privado, formulario propio, identidad vinculada y aprobación vigente según ADR-007/008 | Credencial externa válida sin aprobación no abre ficha, reservas o chat; solo personal con facultad admite; activación/cambio de proveedor/recuperación no apropian cuentas; revocación aplica con sesión abierta |
| S16 | Defensa por capas con cuotas de pre-reservas y futuros incluidos confirmados, frecuencia, anti-bot, chat/códigos/gasto y revisión | Valores acordados y pruebas de concurrencia cuota/capacidad, reintentos, cuentas activas abusivas, familias/IP compartida, restricciones graduales y ausencia de suspensión por DNI ajeno declarado |

La matriz de roles debe cubrir pacientes, representantes, profesionales, secretaría, administración de entidad y plataforma. Un rol no sustituye la comprobación sobre el recurso concreto. El aislamiento se verificará también en tareas y exportaciones implementadas, no solo en pantallas. Referencia: [OWASP sobre seguridad multientidad](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html).

ADR-005 y la aclaración de ADR-009 limitan la elección de horario a la práctica específica «Consulta». Validar en servidor su identidad estable, oferta habilitada, modalidad, duración, permisos y demás condiciones antes de mostrar selección y mutar agenda; revalidar ante cambios. Rechazar otras prácticas, incluidas todas las personalizadas, aunque se renombren «Consulta», se clasifiquen como consulta o se intente habilitar su elección en portal. Esa restricción también se exige al reprogramar. Mensajes con autoría, validación de contenido y acceso por conversación; no copiar cuerpos a logs operativos ni inferir confirmación o reserva desde texto. Definir límites, conservación y correcciones trazables. Notificar un mensaje no concede acceso al contenido; un token de confirmación de turno no abre el chat. La IA conserva alcance pendiente.

**Confirmado el 15 de octubre:** el servidor autentica y autoriza; la interfaz presenta vistas según roles, entidad y delegaciones verificadas, admitiendo varios contextos por usuario. Registrar logins exitosos/fallidos, cierres y revocaciones relevantes en servidor sin guardar credenciales. Los controles de interfaz no reemplazan autorización de API. Alojamiento VPS y stack actual confirmados; el mecanismo concreto de sesión, perfil/proveedor de VPS, versiones fijadas y objetivos RPO/RTO se resolverán y comprobarán antes de producción. Ver [presupuesto y operación](08-presupuesto-y-operacion.md).

S02, S08, S09 y S10 se verificarán en correo y WhatsApp del flujo de ADR-004: cuenta del proveedor vinculada a la entidad, destinatario autorizado, aislamiento, eventos autenticados y contenido mínimo. Correo entre T-72/T-48, WhatsApp T-36 sin confirmar y cierre T-24 con aviso interno son requisitos aceptados. Entrega, apertura o clic no sustituyen confirmación explícita; fallos o cuotas no cancelan por sí solos. Verificar contacto sin asumir identidad de la ficha ni abrir historial completo desde un enlace. La cancelación/liberación y el evento interno deben ser consistentes, auditados e idempotentes; el aviso solo llega a secretaría/profesional con permisos de esa agenda. Revocación impide nuevas consultas aunque exista un aviso previo.

Al elegir autenticación e infraestructura se concretarán estos controles sin inventar criptografía ni duplicar protecciones sin propósito. La elección de tablas compartidas y PostgreSQL RLS está aceptada en el inciso 5 y ADR-001; quedan pendientes las políticas, restricciones y pruebas concretas. Verificar también unicidad de números por entidad/profesional, referencias de la misma entidad e idempotencia de altas, sin tratar el número visible como autorización.

## Qué puede ampliar una revisión posterior

**Ampliación ADR-012:** la recuperación por email del equipo es requisito confirmado. El [documento 20](20-registro-de-usuarios-y-recuperacion-de-acceso.md) propone respuesta pública genérica, tokens por propósito de uso único, consumo consistente con cambio y revocación de sesiones, conservación de bajas/permisos y MFA separado. Incluye escenarios de concurrencia, cuentas externas, invitaciones y alta del primer administrador. Desarrolla S01/S04/S05/S06/S10/S15; exige verificación en la futura aplicación. Su maqueta no prueba autenticación ni controles de seguridad. Las fuentes OWASP de ese análisis sí se consultaron el 15/10/2026; las demás referencias de este archivo conservan el estado de la consolidación anterior.

- Evaluación externa más extensa y ampliación de cobertura ASVS según exposición y datos.
- Alertas y detección de anomalías más avanzadas, herramientas centralizadas y endurecimiento adicional de infraestructura.
- Proveedor de identidad/SSO, nuevas opciones de MFA y controles adicionales por dispositivo según necesidades del piloto.
- Automatización más amplia de análisis de dependencias y código, y ejercicios de incidentes/restauración más completos.
- Protección de los nuevos flujos de cobro, suscripción y fin de servicio cuando se incorporen.

Estas ampliaciones no justifican postergar un hallazgo grave de la beta. Una revisión externa acotada puede adelantarse si la evaluación de riesgo lo requiere; no se exige contratar una auditoría completa para cada modificación.

## Datos reales y fin de suscripciones

Las referencias normativas y técnicas de este archivo se conservan del análisis previo. Esta consolidación usa solo el chat y los archivos locales; no revalida vigencia ni determina cumplimiento legal.

El usuario difirió el tratamiento ligado al fin comercial de suscripciones, no la protección ordinaria de personas y datos. Antes de usar datos reales, definir responsables, finalidad, acceso, avisos, conservación básica y atención a solicitudes aplicables, sin construir todavía todo el motor de baja comercial.

En Argentina, el artículo 9 de la Ley 25.326 establece medidas para seguridad y confidencialidad de datos personales. La etiqueta beta no reemplaza esa revisión cuando se tratan datos reales. Fuente: [Ley 25.326, texto actualizado](https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion). Este documento no determina cumplimiento integral.

## Verificación y entrega

**Admisión y defensa ante abuso:** ADR-007 fija aprobación por personal administrativo autorizado antes del acceso privado, registrando datos o aceptando formulario. Login externo no concede facultades sin aprobación, activación/vinculación y contexto correctos. Dirección de beta Google + alternativa por correo aceptada, con estados de admisión diferenciados; concretar mecanismo de correo/sesión, verificación y recuperación; no unir cuentas por DNI/correo coincidentes. Para un proveedor como Google, validar credencial en servidor y usar identidad externa estable, sin tomar atributos de perfil como permiso local. La [evaluación 12](12-acceso-con-aprobacion-administrativa.md) detalla el diseño propuesto. La defensa por capas de la [evaluación 10](10-prevencion-de-reservas-abusivas.md) está aceptada: cuotas numéricas, proveedor anti-bot y umbrales siguen pendientes; el [catálogo futuro de evaluación 11](11-formulario-empadronamiento-y-catalogo.md) no publica fichas/turnos/chat ni elimina revisión del contexto de atención.

Aplicar controles a medida que se construyen las funciones; realizar una revisión antes de entregar a profesionales. Registrar para cada control: flujo afectado, resultado, evidencia y hallazgos pendientes. Las vulneraciones de acceso, aislamiento, credenciales o integridad deben resolverse antes de la entrega con datos reales.

Durante construcción se utilizarán datos ficticios. Las pruebas del producto incluyen roles, delegaciones, concurrencia entre entidades, representación y confirmaciones. Las comprobaciones de seguridad no sustituyen las pruebas funcionales del turnero ni viceversa.

Actualizar esta evaluación en cada incremento con las funciones nuevas y lo observado en el piloto. Referencia del alcance: [incrementos y beta](05-incrementos-y-beta.md).
