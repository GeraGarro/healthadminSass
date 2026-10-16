# Sistema de Gestión Administrativa de Salud

SaaS de gestión administrativa de pacientes y turnos, inicialmente odontológico y preparado para otras especialidades. Admite clínicas, profesionales independientes y actividad mixta, con datos y permisos aislados por entidad.

## Estado al 16 de octubre de 2026

Diseño general aceptado y requisitos del catálogo confirmados; su detalle de administración sigue propuesto para revisión. Todavía no hay aplicación implementada, despliegue ni pruebas funcionales superadas. Precios, cuotas, tiempos e infraestructura pendientes de validación no son compromisos aprobados.

**Acceso del equipo:** recuperación de contraseña por email para secretaría, administradores y profesionales confirmada en [ADR-012](docs/arquitectura/adr/012-recuperacion-y-alta-de-usuarios.md). Se preparó el [análisis de registro y recuperación](docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md) y una [maqueta navegable local](docs/prototipos/acceso-y-registro.html), sin backend ni envío de correos. Formulario de incorporación + cuenta personal + revisión de plataforma es la propuesta de alta para quien gestiona la adquisición; aún no está aceptada. Esta ampliación consultó las fuentes técnicas indicadas en el análisis 20.

Comenzar por el [estado consolidado y pendientes](docs/13-estado-consolidado-y-pendientes.md). Las [reglas R01-R12](docs/03-reglas-del-dominio.md) detallan el comportamiento; los [ADR](docs/arquitectura/adr/008-consolidacion-del-chat.md) registran decisiones y sustituciones. El [ADR-009](docs/arquitectura/adr/009-catalogo-inicial-y-personalizacion.md) incorpora las cuatro prácticas iniciales y la facultad de personalización; su especificación detallada queda propuesta para revisión. La consolidación anterior usó exclusivamente este chat y los archivos del proyecto. La ampliación de acceso de ADR-012 añade la consulta técnica indicada en el documento 20, sin consultar otras conversaciones.

**Casos de uso preparados el 16/10/2026:** [especificación editable](docs/21-casos-de-uso.md), [lectura navegable con diagramas](docs/casos-de-uso/index.html) y [PDF completo](output/pdf/casos-de-uso-salud.pdf). Contiene 37 fichas (incluidas 2 subfunciones), 7 diagramas y 16 escenarios integrales, con actores, flujos, alternativas, criterios de aceptación y trazabilidad a reglas/decisiones. El detalle está para revisión; conserva las propuestas y parámetros abiertos, sin implementación ni pruebas funcionales ejecutadas.

**Matriz de permisos preparada el 16/10/2026:** [documento 22](docs/22-matriz-de-permisos.md), con 46 acciones, seis actores principales y cinco operaciones técnicas separadas. La visualización permite consultar por ámbito y actor, con condiciones y fuentes por acción. Distingue facultades condicionadas, delegadas, expresas, pendientes y restricciones; no convierte detalles propuestos en aprobados ni cierra D03/D08/D14. Fuente editable: [matriz](docs/permisos/matriz.json).

La documentación vigente presenta las reglas actuales. Los análisis sustituidos están separados en un [archivo histórico](docs/archivo/2026-10-15-analisis-sustituidos.md), sin vigencia operativa. El [registro de revisión](docs/17-revision-y-limpieza-documental.md) explica la limpieza y la función de cada documento.

**Reprogramación del profesional:** [ADR-013](docs/arquitectura/adr/013-reprogramacion-profesional-por-whatsapp.md) confirma aviso obligatorio **por WhatsApp** a todos los pacientes con turnos afectados por una fecha o intervalos, incluidos los ya confirmados, con enlace a autogestión. Es independiente del respaldo T-36. Se conserva la selección de horarios solo para «Consulta» habilitada; las demás prácticas se derivan a personal autorizado. [Flujo y detalle pendiente](docs/04-canales-y-costos.md#reprogramación-por-motivos-del-profesional-whatsapp-obligatorio), sin implementación ni envíos reales.

## Beta del primer incremento

- Entidades, sedes y profesionales con agendas institucionales o independientes. Secretaría opera con membresía y delegación explícitas por agenda y acción.
- Admisión administrativa antes del acceso privado: personal habilita al conocido o acepta el formulario propio del nuevo. Activación y vinculación verificadas; aprobación persistente, sin repetirla en cada login. Dirección de acceso: Google y alternativa por correo; mecanismo concreto pendiente.
- Portal del paciente y representantes verificados, incluidos menores. Elección de horarios exclusivamente para la práctica específica «Consulta» habilitada. Extracción, limpieza, cirugía y todas las personalizadas, incluida su reprogramación, las gestiona personal autorizado; nombre o clasificación no amplían esa facultad.
- Catálogo inicial de consulta, extracción, limpieza y cirugía, ampliable con prácticas personalizadas mediante facultad explícita. Duraciones y ofertas reales por validar; permisos detallados y ciclo de catálogo propuestos para revisión.
- Pre-reserva breve y persistida; turno registrado y confirmación de asistencia separados. Exclusión del mismo profesional entre entidades sin revelar agendas ajenas.
- Un correo de confirmación entre T-72 y T-48; WhatsApp de respaldo a T-36 si sigue pendiente. A T-24 sin confirmar: cancelar, liberar y notificar en plataforma a secretaría y/o profesional autorizados. Excepciones asistidas/técnicas por delimitar.
- Reprogramación por motivos del profesional: WhatsApp a todos los pacientes afectados por fecha/intervalos, incluso confirmados, con enlace al portal para gestionar el reemplazo según las facultades de cada práctica. Seguimiento de avisos fallidos y casos sin nuevo turno.
- Chat humano paciente-profesional, con participantes y permisos específicos; delegación de agenda no concede lectura. Mensajes no modifican turnos automáticamente.
- Protección contra abuso por capas: solicitudes sin capacidad, cuotas que incluyen turnos confirmados, límites de frecuencia y costos, revisión y excepciones asistidas. Los valores numéricos requieren validación.
- Autorización en servidor, aislamiento PostgreSQL con `tenant_id` y RLS, auditoría cronológica, copias externas y restauración comprobada antes de datos reales.

Suscripciones y datos ligados a su finalización se evalúan en I2/I3. Catálogo público y empadronamiento simplificado entre entidades son evolución futura; IA y funciones clínicas especializadas siguen fuera del alcance aprobado de beta.

## Documentación

| Documento | Contenido |
| --- | --- |
| [Estado consolidado](docs/13-estado-consolidado-y-pendientes.md) | Decisiones vigentes, parámetros abiertos y siguiente trabajo |
| [Propuesta V1](docs/01-propuesta-v1.md) | Alcance, arquitectura, modelo conceptual y diagramas |
| [Plan de trabajo](docs/02-plan-de-trabajo.md) | Etapas supervisadas y Git |
| [Reglas R01-R12](docs/03-reglas-del-dominio.md) | Contrato funcional y decisiones D01-D16 |
| [Canales](docs/04-canales-y-costos.md) | Orquestación, aislamiento y costos |
| [Incrementos y beta](docs/05-incrementos-y-beta.md) | Inclusiones, exclusiones y criterios de entrega |
| [Seguridad](docs/06-seguridad-beta.md) | Controles y evidencia exigida |
| [Ocho decisiones](docs/07-revision-decisiones-producto.md) | Respuestas iniciales y resolución vigente |
| [Presupuesto y operación](docs/08-presupuesto-y-operacion.md) | Volumen del flujo vigente, referencias técnicas y VPS |
| [Portal, correo y abono](docs/09-portal-correo-y-membresia.md) | Flujo operativo y supuestos económicos de comunicaciones incluidas |
| [Prevención de abuso](docs/10-prevencion-de-reservas-abusivas.md) | Admisión, cuotas, detección y recuperación |
| [Formulario y catálogo](docs/11-formulario-empadronamiento-y-catalogo.md) | Formulario propio y futura red de profesionales |
| [Acceso administrativo](docs/12-acceso-con-aprobacion-administrativa.md) | Login, activación, estados y permisos |
| [Glosario del dominio](docs/14-glosario-del-dominio.md) | Definiciones comunes de actores, acceso, prácticas, turnos y coberturas |
| [Alcance del ítem](docs/15-alcance-y-cierre-del-item.md) | Entregables, inclusiones, exclusiones, responsables y condiciones de cierre |
| [Catálogo de prácticas](docs/16-catalogo-de-practicas.md) | Base inicial, personalización, permisos propuestos, campos e historias de aceptación |
| [Revisión documental](docs/17-revision-y-limpieza-documental.md) | Limpieza, organización de fuentes y comprobaciones |
| [Ficha y cobertura médica](docs/18-ficha-paciente-y-cobertura-medica.md) | Alcance administrativo confirmado en ADR-010; campos y modalidad propuestos para revisión. Odontograma y especificaciones clínicas excluidos |
| [Transición del profesional](docs/19-desvinculacion-y-transicion-del-profesional.md) | ADR-011: continuidad independiente con fichaje, baja institucional y cuenta persistente; eliminación de cuenta/vínculos solo a petición del profesional, conservando fichas e historial de pacientes. Modelado pendiente |
| [Registro y recuperación de acceso](docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md) | ADR-012: recuperación por email confirmada; pantallas, alta del solicitante comercial, invitaciones y permisos propuestos. Incluye maqueta local sin autenticación real |
| [Casos de uso](docs/21-casos-de-uso.md) | 37 fichas, actores y condiciones comunes, 7 diagramas UML/actividad/secuencia/avisos, 16 escenarios y trazabilidad. [HTML](docs/casos-de-uso/index.html), [PDF](output/pdf/casos-de-uso-salud.pdf) y [fuentes de diagramas](docs/arquitectura/diagramas/casos-de-uso/README.md); detalle para revisión |
| [Matriz de permisos](docs/22-matriz-de-permisos.md) | 46 acciones por seis actores, condiciones y fuentes, acceso previo y cinco operaciones técnicas. Conserva asignaciones abiertas; no concede facultades nuevas |
| [Archivo histórico](docs/archivo/2026-10-15-analisis-sustituidos.md) | Análisis sustituidos, sin vigencia operativa |
| [Ayuda memoria A4](output/pdf/ayuda-memoria-arquitectura-a4.pdf) | Mapa de consulta e impresión |

## Base técnica y operación

Angular/TypeScript, Java/Spring Boot/Spring Security y PostgreSQL, con versiones estables compatibles fijadas al implementar. Dirección arquitectónica: monolito modular y tareas persistidas. VPS aceptado, proveedor y capacidad por cotizar y medir. El seguimiento de versiones se realiza cada 15 días a las 09:00 de Argentina, según el cambio solicitado el 15/10/2026; propone revisiones y no actualiza producción automáticamente. Las versiones y tarifas citadas en los análisis son fotografías previas, no verificaciones nuevas.

La referencia técnica local más reciente se conserva en el [seguimiento del 15/10/2026 a las 09:11](docs/seguimiento/2026-10-15-0911-versiones.md) y se refleja en presupuesto y operación; no equivale a una matriz instalada. El estado de la automatización no se consulta ni modifica durante esta revisión.

Objetivo de planificación: 20 profesionales a tres meses y hasta 100 al año; 100 vínculos de pacientes por profesional y un turno mensual por vínculo. Actividad profesional mayor L-V 08-20, con portal y tareas fuera de esa franja. Concurrencia, presupuesto integral y recuperación siguen pendientes.

Una **entidad de cobertura médica** es una obra social, prepaga o similar; se distingue de la entidad cliente del SaaS. Una cuenta global no comparte fichas entre clientes. El número visible del paciente pertenece a cada profesional y entidad y se conserva al reactivar; no sustituye el ID interno ni una credencial.

## Forma de trabajo y mantenimiento

Etapas supervisadas y commits específicos; no se realiza implementación por esta actualización documental. Mantener R01-R12 como referencias estables y registrar cambios de decisión en ADR. El próximo trabajo es revisar la matriz preparada, concretar sus asignaciones pendientes, transiciones, parámetros y evidencia del piloto, sin reabrir las decisiones aceptadas.

La hoja A4 se genera desde `docs/arquitectura/ayuda-memoria.json` con `scripts/generar-ayuda-memoria.py` (Python y ReportLab). Cambiar reglas, fuente y PDF en el mismo trabajo y verificar visualmente el resultado. Los diagramas Mermaid y el modelo actual son conceptuales; no constituyen esquema SQL ni controles implementados.

Los casos de uso tienen su fuente principal en `docs/21-casos-de-uso.md`. `scripts/generar-casos-de-uso.py` regenera SVG, PlantUML, HTML y PDF con ReportLab, sin servicios externos. Mantener los identificadores CU-01..37 y los pendientes D01-D16; revisar cambios de detalle antes de implementar.

La [vista web](docs/casos-de-uso/README.md) separa estructura en `plantilla.html`, estilos en `casos-de-uso.css` y comportamiento opcional en `casos-de-uso.js`, con cada función explicada. `--solo-web` regenera el HTML sin tocar PDF o diagramas. Los [siete diagramas editables](docs/arquitectura/diagramas/casos-de-uso/README.md) se entregan individualmente en draw.io y PlantUML, con enlaces junto a cada figura; el exportador conserva ediciones manuales de draw.io salvo reemplazo explícito.
