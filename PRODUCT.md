# Sistema de Gestión Administrativa de Salud

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Angular y TypeScript, confirmados por el responsable el 20/10/2026. Servidor existente Java 21 / Spring Boot y PostgreSQL. Frontend servido bajo el mismo origen que `/api/v1` con sesión y CSRF.

## Users

Secretaría y profesionales, con la misma prioridad para clínicas con varios profesionales y para actividad independiente. La cuenta puede cambiar de entidad sin compartir datos entre ellas. Secretaría opera únicamente agendas y acciones delegadas; el profesional trabaja con sus agendas y facultades explícitas.

El propietario de una entidad independiente conserva el rol profesional y administra su personal solo en esa entidad activa, con comprobaciones explícitas de titularidad, vínculo y membresía. Puede operar sus turnos y registrar recepción sin depender de secretaría. Esa administración no amplía facultades en otras instituciones.

El administrador de institución gestiona vínculos profesionales, equipo, estructura, políticas y auditoría dentro de la entidad seleccionada. Su espacio excluye pacientes y datos relacionados con su atención, incluso ante facultades heredadas. Puede consultar días, horarios y «En jornada programada» del equipo; ese estado describe disponibilidad planificada. Secretaría y profesionales operan la atención con facultades explícitas por agenda.

## Product Purpose

Coordinar pacientes, disponibilidad, turnos, confirmaciones, solicitudes administrativas y reprogramaciones en servicios de salud inicialmente odontológicos. La primera necesidad visual expresada es distinguir con claridad calendarios, agendas, próximos turnos y consignas operativas.

## Operating Context

Escritorio de recepción y consulta profesional; uso frecuente durante la jornada, con adaptación a teléfonos. Idioma español de Argentina y zona de cada agenda. Clínica, sedes y actividad independiente conviven mediante contextos aislados.

## Capabilities and Constraints

- Contratos implementados en `salud-api/docs/API.md`; estado vigente en `docs/26-implementacion-servidor.md`.
- Rediseño vigente de institución y secretaría en `docs/34-rediseno-roles-institucion-y-secretaria.md`; `docs/33-administracion-institucional.md` conserva la implementación anterior. Institución usa perfiles y listas sin tablas: búsqueda, filtros, orden, paginación, exportación, equipo/facultades, sedes, estructura de agendas, políticas y auditoría.
- La continuación autorizada de turnos, pacientes, calendario y espacio profesional está en `docs/35-turnos-pacientes-y-espacio-profesional.md`. Agenda, Actividad y Aranceles comparten el espacio profesional; Mi personal está disponible para el propietario independiente.
- La administración autorizada crea cuentas nuevas de profesional o secretaría con correo como usuario y contraseña provisoria aleatoria, válida por 48 horas. La persona debe cambiarla antes de entrar al espacio de trabajo. Si el profesional ya tiene cuenta, solicita el vínculo desde su perfil y la institución de destino lo aprueba o rechaza; se conservan identidad y vínculos previos.
- Crear una agenda define estructura; los horarios y las delegaciones requieren autorización de agenda por separado. La baja institucional revoca vínculo, facultades y delegaciones locales y registra un aviso de cuenta que puede consultarse sin conservar membresía en la institución. Conserva cuenta global, fichaje, historial y otros contextos; una nueva aprobación de vínculo no restituye facultades revocadas. Turnos futuros y pre-reservas vigentes deben resolverse antes de la baja.
- En el primer ingreso de secretaría solo nombre y apellido son obligatorios; DNI, domicilio, celular y foto son opcionales. Sin agendas autorizadas abre el directorio profesional. El titular recibe las solicitudes de acceso en su inicio y decide sobre un alcance escrito: ver, registrar, confirmar, cancelar y reprogramar turnos de esa agenda; no incluye configurar horarios ni chat.
- Con al menos una agenda autorizada, secretaría abre la jornada con calendario y recepción. Registrar llegada, espera, atención y finalización son acciones explícitas; el reloj no presume presencia ni finaliza atenciones.
- Ficha administrativa, admisión, representantes verificados, contactos, coberturas y numeración estable por profesional y entidad.
- El alta desde un turno exige nombre, apellido, DNI, correo, celular internacional y domicilio. La búsqueda por DNI reutiliza una ficha local o crea su vínculo profesional sin revelar registros de otras instituciones. Registrar y vincular al paciente todavía no reserva el turno. El selector consulta todos los pacientes vinculados mediante paginación completa.
- La identidad documental mínima global conserva UUID, huella HMAC del DNI normalizado y fecha de creación; no nombres, contactos, entidad ni atención. Las fichas locales mantienen RLS y relaciones profesionales separadas. No hay fusión automática de registros históricos ni coincidencias por nombre.
- Agenda diaria/semanal/mensual, horarios, ofertas versionadas, disponibilidad, pre-reserva, registro, confirmación, cancelación, reprogramación y ausencias.
- Los calendarios comparten estados temporales escritos: horario pasado, hora prevista actual y próximo, con prioridad de espera, atención y finalización explícitas. El color de agenda queda en avatares y selectores. Que termine el horario no registra atención: Actividad cuenta como atendidos únicamente turnos registrados con recepción `FINALIZADO`, y excluye `ATENCION`/`FINALIZADO` de próximos.
- Aranceles de referencia versionados por prestación, en ARS o USD, consultados y editados por el titular de la agenda. No registran cobros ni generan comprobantes.
- Registrar un turno y confirmar asistencia son acciones diferentes. Entregar un aviso tampoco confirma asistencia.
- Solo Consulta base habilitada permite autogestión de horarios. Las otras prácticas requieren personal autorizado.
- Ausencia profesional genera aviso obligatorio por WhatsApp incluso para turnos confirmados. No cancela ni mueve turnos automáticamente.
- La operación explícita Cancelar un período permite al titular revisar un día, semana de lunes a domingo o mes, con cantidad afectada, motivo, confirmación e idempotencia. Cancela futuros, preserva los ya iniciados por hora o con recepción `ATENCION`/`FINALIZADO`, suspende el intervalo y libera pre-reservas. Crea pendientes de reasignación, avisos internos urgentes para delegados y tareas de correo/WhatsApp; la entrega exige destinos autorizados y canales configurados. La simulación local no acredita envíos reales.
- Los turnos afectados por suspensión y los cancelados afectados pueden reprogramarse por personal con `booking:reschedule`, dentro del alcance de la agenda. No se transfieren automáticamente a otro profesional o entidad.
- Chat humano con participantes explícitos; delegar agenda no habilita lectura. Mensajes no modifican turnos.
- Autorización siempre en servidor, nunca deducida del nombre del rol. Parámetros de cierre y cuotas conservan su estado documental.
- Sin historia clínica, odontograma, inteligencia artificial, facturación, suscripciones ni transferencias de fichajes en beta.
- La demostración visual utiliza exclusivamente datos ficticios, identificados como tales. No representa una conexión productiva ni envíos reales.
- Los borradores de turno existen solo en memoria y dentro del contexto actual, incluyendo modo de paciente y seis datos del alta incompleta. Reabrir reconsulta DNI y disponibilidad según corresponda; salir, cambiar contexto, vencer la sesión o recargar los elimina. No reservan ni registran automáticamente.

## Brand Commitments

Área de salud con una visión innovadora, según la solicitud del responsable. No existe nombre comercial, logotipo ni identidad aprobados. El nombre de trabajo de la interfaz puede identificarse como propuesta y no sustituye el nombre documental del sistema.

## Evidence on Hand

Reglas R01–R12, 37 casos de uso, matriz de 46 acciones, modelo E-R, servidor Java/Spring y frontend Angular dentro del proyecto. El sistema visual Patio está registrado en `DESIGN.md` y `.impeccable/design.json`; los briefs y la evidencia de revisión están en `.impeccable/`. El incremento de calendario conserva evidencia en `.impeccable/review/calendar-evolution/`. Las capturas de demostración y las comprobaciones locales no representan un despliegue productivo.

## Product Principles

1. Mostrar primero la jornada, las personas que vienen y las acciones pendientes.
2. Conservar contexto de entidad, agenda y profesional en cada operación.
3. Hacer visibles estados, consecuencias y resultados de las acciones.
4. Mantener separados asistencia, entrega de avisos, gestión administrativa y conversación.
5. Respetar facultades explícitas y las decisiones aún pendientes.
