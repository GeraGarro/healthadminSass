# Revisión y limpieza de la documentación

Fecha: 15 de octubre de 2026. Motivo: repaso solicitado por el responsable para retirar información corregida y evitar contradicciones. Fuente: conversación y archivos locales, incluido el seguimiento técnico registrado. Sin nuevas consultas externas ni cambios de alcance, implementación o automatizaciones.

## Organización de la documentación vigente

| Documento | Responsabilidad |
| --- | --- |
| [Estado consolidado](13-estado-consolidado-y-pendientes.md) | Punto de entrada: decisiones actuales y prioridades pendientes |
| [Reglas R01-R12](03-reglas-del-dominio.md) | Comportamiento funcional vigente y registro estable de pendientes D01-D16 |
| [Propuesta V1](01-propuesta-v1.md) | Contexto, arquitectura y modelo conceptual; conserva el contrato técnico del inciso 5 |
| [Incrementos y beta](05-incrementos-y-beta.md) | Inclusiones, exclusiones y criterios generales de entrega |
| [Seguridad](06-seguridad-beta.md) | Controles S01-S16 y evidencia requerida |
| [Glosario](14-glosario-del-dominio.md) | Significado común de términos |
| [Alcance del ítem](15-alcance-y-cierre-del-item.md) y [catálogo](16-catalogo-de-practicas.md) | Requisitos confirmados de prácticas y detalle propuesto para revisión, separado explícitamente |
| [Canales](04-canales-y-costos.md), [operación](08-presupuesto-y-operacion.md) y [comunicaciones/abono](09-portal-correo-y-membresia.md) | Arquitectura de avisos, dimensionamiento y supuestos económicos del flujo aceptado |
| [Formulario](11-formulario-empadronamiento-y-catalogo.md) y [acceso](12-acceso-con-aprobacion-administrativa.md) | Admisión de beta y separación de la evolución pública futura |
| [Registro y recuperación](20-registro-de-usuarios-y-recuperacion-de-acceso.md) | Ampliación posterior: recuperación del equipo confirmada en ADR-012; alta comercial propuesta y maqueta local sin backend. Sus fuentes técnicas se consultaron aparte de esta limpieza |
| [Casos de uso](21-casos-de-uso.md) | Ampliación del 16/10/2026: 37 fichas, 7 diagramas, 16 escenarios y trazabilidad; PDF y HTML regenerables. Descomposición/detalle para revisión, sin cambiar reglas ni declarar pruebas de producto |
| [ADR-001 a ADR-009](arquitectura/adr/009-catalogo-inicial-y-personalizacion.md) | Historia y origen de decisiones; los puntos sustituidos remiten a su resolución posterior |
| [Seguimiento técnico fechado](seguimiento/2026-10-15-0911-versiones.md) | Evidencia histórica de fuentes consultadas en aquella ejecución; no matriz instalada |
| [Archivo histórico](archivo/2026-10-15-analisis-sustituidos.md) | Análisis retirados de las guías; no es fuente de reglas operativas |

Una propuesta pendiente no sustituye un requisito confirmado. Cuando una decisión evoluciona, se actualiza la regla vigente y se conserva el antecedente identificado en ADR o archivo. Los identificadores R, D, S, CAT y HC mantienen su función para la trazabilidad.

## Información depurada

| Tema | Limpieza realizada |
| --- | --- |
| Selección de horarios | Unificada en la práctica específica «Consulta» habilitada. Extracción, limpieza, cirugía y todas las personalizadas son de asignación y reprogramación por personal autorizado. La clasificación y el nombre no amplían la facultad. |
| Avisos | Las guías usan un correo T-72/T-48, WhatsApp T-36 pendiente y cierre T-24 con aviso interno. Se archivaron los escenarios antiguos de tres avisos por turno. |
| Precios y ofertas | Se retiraron de las guías los paquetes y precios de venta anteriores; se mantienen supuestos de proveedor fechados, con escenarios del flujo vigente y validación comercial pendiente. |
| Condiciones de proveedores | Se archivaron afirmaciones previas no revalidadas sobre cupos y cambios tarifarios. Se conserva la tarea de comprobar condiciones antes de contratar. |
| Admisión | Formulario propio y aceptación administrativa se presentan como decisiones resueltas; la comparación con Google Forms queda archivada. Se retiraron explicaciones repetidas de una imagen de botones de acceso. |
| Catálogo público | Separado del catálogo interno de prácticas y del recorrido privado de beta. La publicación de un perfil no es requisito de reserva en beta ni concede acceso. |
| Vocabulario comercial | Membresía identifica la relación usuario-entidad; abono o suscripción comercial identifica contratación y precio del SaaS. |
| Permisos | Administración de entidad no sustituye delegación del profesional ni recibe facultad de catálogo automáticamente. Se conserva pendiente quién concede esa facultad por entidad. |
| Parámetros numéricos | Se retiraron ejemplos de duración y cuotas de las reglas operativas para no confundirlos con valores aprobados; los parámetros reales siguen pendientes. |
| Versiones | La tabla técnica usa el último informe local: Angular 22.2.3 reemplaza la referencia anterior 22.2.2 para el framework; CLI mantiene su referencia separada. Compatibilidad, vigencia y versiones instaladas siguen sin verificarse en esta limpieza. |
| Escala | Se usa el objetivo de 20 profesionales a tres meses y hasta 100 al año; no representa concurrencia medida ni capacidad garantizada. |
| Duplicación | La propuesta general remite a los criterios de beta y seguridad en lugar de mantener otra lista de aceptación; los pendientes se priorizan en el estado consolidado. |

## Comprobaciones de esta revisión

Revisión de coherencia entre reglas, alcance, catálogo, permisos y ADR; enlaces locales y anclas; estructura de tablas y bloques Markdown; identificadores R01-R12, D01-D16, S01-S16, CAT-01..12 y HC-01..12.

Resultado: 29 documentos y 179 enlaces locales/anclas comprobados, sin errores detectados. Tablas, bloques e identificadores verificados. Fuente JSON y PDF A4 sincronizados en versión 0.16; una página horizontal, con texto comprobado y render final revisado visualmente sin recortes ni superposiciones.

Estas comprobaciones son documentales. No demuestran pruebas funcionales, integración de canales, seguridad implementada, vigencia de tarifas ni capacidad de infraestructura. Los pendientes de producto y las propuestas revisables continúan en sus documentos correspondientes.

## Ampliación posterior: reprogramación por WhatsApp

El 15/10/2026 se incorporó ADR-013 y R11.b: aviso obligatorio por WhatsApp a todos los pacientes con turnos afectados por una reprogramación del profesional para fecha/intervalos, incluso con asistencia confirmada, con enlace a autogestión. Se actualizaron canales, portal/consumo, alcance y aceptación de beta, README y estado consolidado. La selección de nuevo horario conserva la restricción a «Consulta» habilitada; las demás prácticas se derivan a personal autorizado. El detalle de lote, estados, plazos, reintentos y seguimiento se identifica como propuesta para revisión.

Comprobación de esta ampliación: 36 documentos Markdown y 224 enlaces locales/anclas, sin errores; bloques de código cerrados. Ayuda memoria JSON/PDF sincronizada en v0.20, una página A4 horizontal; contenido nuevo comprobado y render final inspeccionado visualmente sin recortes ni superposiciones. No se implementaron ni probaron envíos reales ni operaciones de turnos.

## Ampliación del 16/10/2026: casos de uso

Se preparó el [documento 21](21-casos-de-uso.md) con 37 fichas identificadas, 10 condiciones transversales, actores humanos/servicios externos, catálogo trazable, flujos, alternativas, garantías, criterios de aceptación, dimensiones de estado y 16 escenarios integrales. Las fichas CU-36/CU-37 son subfunciones obligatorias de CU-14/CU-15; CU-35 mantiene la incorporación por formulario comercial como propuesta no aprobada. Se conservan los pendientes D01-D16, el aislamiento, la selección de la práctica base «Consulta» y el WhatsApp independiente para reprogramación del profesional.

Se agregaron 7 diagramas SVG con fuentes PlantUML, [lectura HTML](casos-de-uso/index.html), [PDF completo](../output/pdf/casos-de-uso-salud.pdf), [generador](../scripts/generar-casos-de-uso.py) y [verificador documental](../scripts/verificar-casos-de-uso.py). El PDF contiene 56 páginas con índice/enlaces internos, fichas y siete páginas horizontales de diagramas. Se renderizaron todas las páginas y se revisaron la composición general y páginas de detalle; los siete diagramas se inspeccionaron visualmente. Las fuentes PlantUML tienen delimitadores comprobados y se entregan editables; no se ejecutó un compilador PlantUML. Los SVG/PDF se generan directamente con ReportLab.

Se comprobó presencia y orden de CU-01..37, escenarios EI-01..16, cobertura R01-R12, enlaces locales/anclas, XML de SVG, anclas y recursos HTML y presencia del contenido en PDF. El verificador permite repetir las comprobaciones; el total incluye enlaces repetidos entre Markdown y HTML. La vista HTML se verificó con Chrome/Playwright a 1440, 760 y 390 píxeles: 37 fichas, siete imágenes cargadas, sin desbordes horizontales, errores JavaScript ni solicitudes HTTP externas.

La ampliación usa exclusivamente documentación local vigente, sin nuevas consultas externas. No cambia decisiones, no cierra permisos o transiciones pendientes y no prueba autenticación, concurrencia, canales reales, restauración o controles del producto. La ayuda memoria A4 se conserva en v0.20 porque las reglas resumidas no cambiaron. Sin aplicación, despliegue, envíos reales, automatizaciones modificadas ni commits realizados por esta entrega.

## Separación de la vista web y editables de diagramas

Por solicitud del responsable, se separaron [plantilla HTML](casos-de-uso/plantilla.html), [CSS](casos-de-uso/casos-de-uso.css) y [JavaScript](casos-de-uso/casos-de-uso.js). El índice, fichas, tablas y figuras se generan como HTML estático legible, con sangría y comentarios; el JavaScript documenta cada función y solo añade impresión y señalización del enlace activo. El [modo de mantenimiento](casos-de-uso/README.md) explica qué editar y cómo regenerar únicamente la web con `--solo-web`. Se agregaron siete [editables draw.io](arquitectura/diagramas/casos-de-uso/README.md), además de las fuentes PlantUML; cada figura enlaza a su archivo individual. Los draw.io contienen figuras, textos y conectores nativos y se conservan ante nuevas exportaciones salvo reemplazo explícito.

Se amplió el verificador para comprobar CSS/JS externos locales, ausencia de estilos/eventos/código inline, carga diferida de JS, XML/referencias y correspondencia de textos de los editables draw.io. El PDF se conserva: esta modificación afecta la presentación web y las fuentes editables, sin cambiar casos de uso o decisiones funcionales. La validación estructural de draw.io no equivale a abrir los archivos con ese editor.

Comprobación de esta modificación: vista en Chrome a 1440, 760 y 390 píxeles, con 37 fichas, siete imágenes y siete enlaces individuales de cada formato editable, sin desbordes ni solicitudes externas. Se verificaron selección del índice con acentos, URL con fragmento, navegación atrás, acción de impresión y estilos de impresión; con JavaScript desactivado se conservan fichas, enlaces y navegación. Se revisaron capturas de escritorio, móvil y una figura con sus descargas. La segunda ejecución del exportador conservó los siete draw.io existentes. El verificador documental final no detectó errores de enlaces, recursos o estructura.
