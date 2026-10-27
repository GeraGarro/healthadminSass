---
name: "Patio · Gestión en salud"
description: "Verde profundo, superficies claras y tipografía humanista para la gestión administrativa de salud."
colors:
  green: "#205c50"
  green-hover: "#184c42"
  ink: "#253b35"
  muted: "#63736b"
  canvas: "#f6f8f6"
  surface: "#fff"
  rail: "#e9efea"
  line: "#e3e9e4"
  mint: "#dbece1"
  button-line: "#7d9487"
  button-hover: "#eef4ef"
  button-hover-line: "#526f60"
  field-line: "#7d9487"
  field-hover-line: "#526f60"
  field-focus-line: "#205c50"
  field-focus-ring: "#205c50"
  focus: "#205c50"
  agenda-sage: "#e7efe3"
  agenda-sage-ink: "#436044"
  agenda-lavender: "#eeebf5"
  agenda-lavender-ink: "#68557d"
  agenda-peach: "#f7e9df"
  agenda-peach-ink: "#855d43"
  agenda-blue: "#e6eef5"
  agenda-blue-ink: "#47677b"
  pending: "#f8edda"
  pending-ink: "#79591c"
  confirmed: "#edf3e9"
  confirmed-ink: "#436b4e"
  error: "#a13e3b"
  error-hover: "#873432"
  error-bg: "#fbebea"
  next-surface: "#e2eee4"
  calendar-ink: "#193859"
  calendar-line: "#b9c8da"
  calendar-future: "#dbeafe"
  calendar-future-ink: "#193e70"
  calendar-past: "#e7edf3"
  calendar-past-ink: "#41546c"
  calendar-attending: "#006157"
  calendar-waiting: "#ffedb5"
  calendar-waiting-ink: "#624109"
  calendar-finished: "#dcebe5"
  calendar-finished-ink: "#174e44"
  calendar-scheduled-now: "#c9e5ed"
  calendar-scheduled-now-ink: "#16495a"
  calendar-scheduled-now-line: "#2f7489"
  calendar-now: "#b33228"
typography:
  display:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "49px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "29px"
    fontWeight: 700
    lineHeight: 1.22
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.012em"
  subhead:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 700
  button:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.35
  brand:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "31px"
    fontWeight: 850
    lineHeight: 1
    letterSpacing: "-0.04em"
  clock:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
rounded:
  panel: "14px"
  control: "8px"
  field: "7px"
  segmented: "6px"
  status: "5px"
  segment: "4px"
  detail: "10px"
  none: "0"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "28": "28px"
  "32": "32px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "9px 15px"
  button-primary-hover:
    backgroundColor: "{colors.green-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "9px 15px"
  button-secondary-hover:
    backgroundColor: "{colors.button-hover}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "9px 15px"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "9px 15px"
  button-danger-hover:
    backgroundColor: "{colors.error-hover}"
    textColor: "{colors.surface}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
  status-pending:
    backgroundColor: "{colors.pending}"
    textColor: "{colors.pending-ink}"
    rounded: "{rounded.status}"
    padding: "4px 7px"
  status-confirmed:
    backgroundColor: "{colors.confirmed}"
    textColor: "{colors.confirmed-ink}"
    rounded: "{rounded.status}"
    padding: "4px 7px"
  status-cancelled:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.error}"
    rounded: "{rounded.status}"
    padding: "4px 7px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
  nav-item:
    textColor: "#53665b"
    backgroundColor: "transparent"
    rounded: "{rounded.control}"
    padding: "11px 15px"
  nav-item-active:
    backgroundColor: "{colors.green}"
    textColor: "{colors.surface}"
  calendar-segment:
    backgroundColor: "transparent"
    textColor: "#66746a"
    rounded: "{rounded.segment}"
    padding: "4px 11px"
  calendar-segment-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.green}"
  calendar-event-upcoming:
    backgroundColor: "{colors.calendar-future}"
    textColor: "{colors.calendar-future-ink}"
    rounded: "{rounded.field}"
    padding: "5px 7px"
  calendar-event-elapsed:
    backgroundColor: "{colors.calendar-past}"
    textColor: "{colors.calendar-past-ink}"
  calendar-event-scheduled-now:
    backgroundColor: "{colors.calendar-scheduled-now}"
    textColor: "{colors.calendar-scheduled-now-ink}"
  calendar-event-waiting:
    backgroundColor: "{colors.calendar-waiting}"
    textColor: "{colors.calendar-waiting-ink}"
  calendar-event-attending:
    backgroundColor: "{colors.calendar-attending}"
    textColor: "{colors.surface}"
  calendar-event-finished:
    backgroundColor: "{colors.calendar-finished}"
    textColor: "{colors.calendar-finished-ink}"
---

# Design System: Patio · Gestión en salud

## Overview

**Creative North Star: "Patio"**

Patio toma la luz, el verde vegetal y las superficies claras de los patios contemporáneos y los convierte en una interfaz serena y precisa. El verde profundo da identidad a las acciones y selecciones; los fondos apenas teñidos permiten distinguir áreas sin recurrir a ornamentación. Los controles conservan formas web familiares y una densidad adecuada para trabajo administrativo frecuente.

Una sola familia humanista relaciona nombres, horarios y formularios. Los bordes finos y las curvas contenidas aportan calidez sin competir con la información. Los calendarios usan una paleta temporal azul, gris azulado, petróleo, ámbar y verde; los tonos de identidad profesional se conservan en avatares y selectores. Patio es el nombre de trabajo de esta propuesta visual; no constituye una identidad comercial aprobada. La finalidad y composición de cada pantalla se conservan en su propio brief.

Base de extracción: `salud-web/src/styles.css`, la estructura de navegación, los componentes de calendario, estados y panel de turno, y las pantallas de pacientes, acceso, jornada de secretaría y espacio profesional. La actualización del 27/10/2026 incorpora el cambio de sistema autorizado para todos los calendarios; conserva los demás tokens y decisiones de Patio. La evidencia de este incremento está en `.impeccable/review/calendar-evolution/`; no amplía la revisión local a una certificación de accesibilidad o de operación productiva.

**Key Characteristics:**

- Superficies blancas sobre un lienzo claro, con navegación celadón.
- Verde profundo para acciones y selección; identidad de agenda separada del color temporal del calendario.
- Calendario azul y gris azulado con atención, espera y finalización escritas; hora actual roja.
- Nunito Sans local, jerarquía compacta y cifras tabulares en horarios.
- Contenedores planos; elevación localizada en elementos flotantes.

## Colors

La paleta combina verdes sobrios y neutros claros con una capa temporal de mayor definición dentro del calendario. Las rampas del sidecar se sintetizan en OKLCH para inspección en el visor; no son una escala adicional implementada ni reemplazan los colores normativos del frontmatter.

### Primary

- **Verde Patio** (`green`): acciones principales, navegación activa, enlaces de acción y selección de horarios. Su variante `green-hover` identifica la respuesta al puntero.
- **Menta de selección** (`mint`): contadores y señales secundarias relacionadas con la selección.

### Secondary

- **Salvia** (`agenda-sage` / `agenda-sage-ink`), **lavanda** (`agenda-lavender` / `agenda-lavender-ink`), **durazno** (`agenda-peach` / `agenda-peach-ink`) y **azul niebla** (`agenda-blue` / `agenda-blue-ink`): pares de identidad de agenda conservados para avatares, selectores y contexto. Los bloques de turno del calendario usan los pares temporales que siguen.
- **Verde de próximo encuentro** (`next-surface`): fondo tonal del resumen del siguiente turno.
- Las antiguas variantes de componente `agenda-event-*` quedan sustituidas por `calendar-event-*`; los pares de color de identidad se conservan.
- **Azul próximo** (`calendar-future` / `calendar-future-ink`) y **gris azulado pasado** (`calendar-past` / `calendar-past-ink`): horario futuro y horario terminado sin estado de recepción explícito.
- **Azul petróleo de hora prevista** (`calendar-scheduled-now` / `calendar-scheduled-now-ink` / `calendar-scheduled-now-line`): intervalo previsto que contiene la hora actual, con borde y contorno; la etiqueta «Hora prevista actual» no presume presencia.
- **Petróleo de atención** (`calendar-attending` con `surface`), **ámbar de espera** (`calendar-waiting` / `calendar-waiting-ink`) y **verde finalizado** (`calendar-finished` / `calendar-finished-ink`): estados de recepción explícitos que tienen prioridad sobre la clasificación horaria.

### Tertiary

- **Ámbar de pendiente** (`pending` / `pending-ink`): estado pendiente de confirmación y señales operativas relacionadas.
- **Verde de confirmación** (`confirmed` / `confirmed-ink`): estados favorables; el texto especifica si se trata de asistencia, entrega u otra condición.
- **Rojo de incidencia** (`error` / `error-bg`): errores, cancelación y acciones destructivas. `error-hover` conserva texto blanco sobre un rojo más profundo al pasar el puntero por una acción destructiva.
- **Rojo de hora actual** (`calendar-now`): línea, punto y etiqueta de la hora actual dentro de la grilla; no modifica recepción.

### Neutral

- **Tinta vegetal** (`ink`) y **texto secundario** (`muted`): lectura principal y metadatos.
- **Lienzo** (`canvas`), **superficie** (`surface`) y **celadón lateral** (`rail`): capas principales de la aplicación.
- **Línea** (`line`): separadores y bordes de paneles. Botones y campos usan los pares de borde y hover específicos del frontmatter.
- **Tinta y línea de calendario** (`calendar-ink` / `calendar-line`): texto del marco, cabeceras y divisores horarios más definidos dentro del calendario compartido.
- **Foco** (`focus`) y **foco de campo** (`field-focus-line` / `field-focus-ring`): orientación de teclado y edición.

### Named Rules

**The Functional Green Rule.** El verde profundo señala una acción o selección; los fondos suaves separan áreas y la identidad de agenda permanece en su contexto.

**The Explicit State Rule.** Todo estado conserva una etiqueta legible; el tono y el punto de color acompañan el significado escrito.

**The Temporal Calendar Rule.** El color del turno describe tiempo o recepción explícita, nunca identidad profesional. «Horario pasado» y «Hora prevista actual» no significan «Atendido»; solo la finalización registrada habilita ese estado.

## Typography

**Display Font:** Nunito Sans, con Segoe UI y sans-serif como respaldo.

**Body Font:** la misma familia. Se sirve un archivo WOFF2 variable local, con pesos disponibles de 200 a 1000 y `font-display: swap`.

**Character:** las curvas humanistas suavizan la información densa; los pesos intermedios y fuertes distinguen etiquetas, nombres y títulos. No se utiliza una segunda familia monoespaciada para los horarios.

### Hierarchy

- **Display** (`display`): mensaje amplio de acceso. Se reduce a 42, 36 y 31px en los puntos de adaptación existentes.
- **Headline** (`headline`): título principal de pantalla; en móvil se reduce a 25px. El título del formulario de acceso usa 28px en escritorio y 25px en móvil.
- **Title** (`title`) y **Subhead** (`subhead`): encabezados de sección y nombres destacados. Los componentes densos reducen sus títulos según el espacio real.
- **Body** (`body`): base del documento; los datos operativos usan 13–14px y los metadatos tienen un piso de 12px. Los tamaños se expresan en rem para respetar las preferencias de lectura.
- **Label** (`label`): etiquetas de campos de 14px. **Button** (`button`): texto de acción de 14px, incluida la variante compacta.
- **Brand** (`brand`): firma propuesta Patio; conservar el tracking explícito del token para mantener legibilidad y encaje. El subtítulo usa 12px, peso 600 y tracking de 0.02em.
- **Clock** (`clock`): hora del próximo turno, 34px en escritorio y 32px en el resumen móvil. Horas del calendario, listas, disponibilidad y cifras de resumen usan `font-variant-numeric: tabular-nums`.

La jerarquía es una escala práctica extraída de los componentes; no se impone una proporción matemática que el código no utiliza.

### Named Rules

**The Stable Clock Rule.** Alinear horarios y cantidades con cifras tabulares de Nunito Sans; conservar la misma familia que el resto de la interfaz.

## Layout

La estructura de aplicación usa un lateral fijo de 224px y un área principal flexible con `minmax(0, 1fr)`. La barra superior mide 68px; el contenido habitual tiene márgenes interiores de 24px 32px 28px. Los paneles se alinean a ese marco y los formularios usan columnas flexibles, con separaciones de 16px.

La jornada de secretaría combina calendario flexible y recepción de 300px, separados por 24px; la recepción pasa a 330px desde 1600px y a 260px con separación de 18px hasta 1240px. Hasta 1080px se ubica después del calendario, con dos columnas de pacientes; hasta 760px usa una. El selector de profesionales precede al calendario y se desplaza horizontalmente dentro de su área. El espacio profesional combina calendario y una columna de próximos turnos/cancelados de 285px; hasta 1240px se reduce a 250px y hasta 1080px se apila. Estas composiciones pertenecen a sus superficies, no son plantillas obligatorias para las demás páginas.

Los valores de `spacing` son pasos reutilizados observados. El código conserva ajustes intermedios para densidad y alineación, como los 7px entre etiqueta y campo, los 9px 15px de botón y los 17px entre campos; no existe una cuadrícula rígida de múltiplos de cuatro.

- **Desde 1600px:** contenido con ancho máximo de 1600px y padding de 38px 44px; cada superficie conserva su relación entre columnas.
- **Hasta 1240px:** márgenes laterales de 24px y detalles de perfil más compactos.
- **Hasta 1080px:** lateral de 190px y apilamiento de jornada y detalles según su superficie.
- **Hasta 760px:** lateral superpuesto de 224px, barra superior de 66px y contenido con padding de 18px 16px. La búsqueda global se oculta; permanece el contexto de entidad. El panel de turno ocupa todo el ancho y la altura dinámica del viewport.

El calendario diario usa un eje de 60px y una escala de al menos 144px por hora. La escala aumenta para mantener legibles las prácticas cortas sin superponer eventos. Al abrir Hoy se sitúa cerca de la hora actual y conserva el desplazamiento manual por fecha, agenda y vista. Sus cabeceras permanecen visibles durante el desplazamiento interno. En móvil, Jornada conserva un selector de agenda; Agenda utiliza su único filtro dentro de un desplegable inicialmente cerrado. Las vistas semanal y mensual permiten desplazamiento horizontal, con texto legible y nombres visibles. Los formularios extensos usan desplazamiento interno del panel de turno y mantienen cabecera y acciones fuera de ese recorrido.

## Elevation & Depth

La profundidad parte de capas tonales y bordes finos. Los paneles permanecen planos en reposo; las sombras tienen una función localizada en resultados de búsqueda, selección segmentada, respuesta de un turno, panel lateral y aviso flotante.

### Shadow Vocabulary

- **Flotante:** `0 12px 40px rgb(29 55 43 / 13%)`; resultados de búsqueda.
- **Segmento seleccionado:** `0 1px 4px rgb(24 55 37 / 10%)`.
- **Turno al pasar el puntero:** `0 3px 8px rgb(35 65 43 / 10%)`.
- **Panel lateral:** `-10px 0 45px rgb(32 53 38 / 15%)`.
- **Aviso flotante:** `0 8px 28px rgb(23 54 35 / 18%)`.

El fondo del diálogo usa `rgb(24 46 34 / 30%)`; la navegación móvil usa `rgb(28 49 34 / 30%)`. Son capas translúcidas sin desenfoque. Las transiciones de color, borde y sombra duran 160ms con `ease-out`; el panel de turno y el lateral móvil entran en 200ms con `cubic-bezier(0.16, 1, 0.3, 1)`. La preferencia de movimiento reducido elimina animaciones, transiciones y desplazamiento suave.

### Named Rules

**The Local Depth Rule.** Mantener los paneles planos en reposo y reservar las sombras para los elementos y estados flotantes ya definidos.

## Shapes

Los paneles usan la curva amplia de `rounded.panel`; los botones y enlaces de navegación, `rounded.control`; los campos y turnos, `rounded.field`. Estados y controles segmentados tienen esquinas más contenidas. Los avatares y puntos de estado son circulares. El panel de turno tiene esquinas rectas para continuar el borde de la ventana.

Los bordes son de 1px. El turno pendiente conserva borde discontinuo; su relleno temporal no cambia a un color de identidad de agenda. Hora prevista actual y atención usan contorno interior de 2px. El conjunto de iconos es SVG propio con trazo de 1.7, extremos y uniones redondeados, y una caja base de 24 unidades; los controles ajustan su tamaño según contexto.

No se requieren fotografías ni ilustraciones raster en esta implementación. La identidad se apoya en tipografía, color, geometría de marca e iconos SVG.

## Components

### Buttons

Acciones compactas y reconocibles, con texto de peso fuerte.

- **Forma:** `rounded.control`, altura mínima habitual de 40px y padding del token; la acción del encabezado usa 42px.
- **Principal:** verde Patio con texto blanco; hover en verde más profundo.
- **Secundario:** blanco, borde propio y texto de tinta; hover con fondo y borde verdosos.
- **Quieto:** fondo y borde transparentes; comparte la respuesta de hover del botón base.
- **Destructivo:** rojo de incidencia y texto blanco; su hover usa `error-hover` para fondo y borde, conservando el texto blanco.
- **Foco y deshabilitado:** anillo general de 3px con separación de 3px; opacidad de 0.55 y cursor no disponible cuando está deshabilitado.

### Chips / States

Indicadores breves, textuales y sin apariencia de acción.

Usan los tres pares de tokens de estado, una tipografía de 12px y peso 700, interlínea de 1.2 y un punto de 4px. El panel del próximo turno adapta su estado confirmado a un fondo verde tonal propio. Los indicadores no reciben tabulación por sí mismos.

### Cards / Containers

Superficies tranquilas que agrupan contenido por borde y tono.

El panel general usa fondo blanco, borde de línea, curva amplia y recorte del contenido. El padding depende del contenido; el contenedor acolchado habitual usa 24px, se reduce a 21px hasta 1240px y a 20px en móvil. No se añade hover a un contenedor estático. Los resúmenes tonales conservan sus propias superficies.

### Inputs / Fields

Campos nativos, con etiqueta visible y borde claro.

Fondo blanco, curva de campo, altura mínima de 40px y padding del token; texto de 15px y peso 500 (16px en móvil). La etiqueta usa el rol `label` con separación de 7px. Al editar, el borde y anillo usan los tokens de foco de campo, con anillo de 3px y separación de 1px; al pasar el puntero se refuerza el borde. Las restricciones nativas muestran mensajes junto al campo con aria-invalid y aria-describedby. Un envío inválido dirige el foco al primer campo que necesita corrección; los errores de operación conservan un aviso general. Los campos de acceso tienen altura mínima de 45px.

### Navigation

Una columna celadón con selección verde profunda.

Los enlaces usan 14px (13px en el lateral compacto) y peso 600, altura mínima de 44px, icono y etiqueta. La selección invierte a texto blanco; el hover usa un fondo verde claro. El lateral móvil tiene cierre visible, fondo superpuesto, contexto modal y manejo de foco. Al cerrarse queda oculto e inerte; al abrirse el contenido de fondo queda inerte; Escape y el cierre devuelven el foco al disparador. Estas son conductas implementadas, no una declaración de conformidad completa.

### Agenda Event

Una cita es una tarjeta de agenda compacta con hora, nombre y contexto.

El par tonal depende del tiempo o de recepción, con precedencia finalizado → en atención → en espera → horario pasado → hora prevista actual → próximo. Día, Semana, Mes y Lista comparten esta clasificación. El estado pendiente conserva el borde discontinuo sin sustituir el par temporal. Hora y nombre mantienen prioridad: el nombre diario usa 14px y peso 800, y la línea horaria usa 12px con cifras tabulares. La práctica conserva color heredado y opacidad completa. La respuesta al puntero reduce el brillo a 0.975 y aplica la sombra localizada del turno. La selección del día se comparte entre calendario y listas del mismo espacio de trabajo.

La grilla usa cabeceras azuladas, líneas horarias definidas y un velo gris azulado sobre el tiempo transcurrido. La línea roja con hora escrita atraviesa el calendario diario. La leyenda textual distingue horario pasado, próximo, atención, espera y atendido; el estado de hora prevista actual también se escribe en el turno. Identidad de agenda, asistencia confirmada y recepción conservan significados separados.

### Calendar Segments

Vistas de calendario reunidas en un control compacto.

Contenedor con borde de línea, fondo claro, curva de 6px y padding de 3px. Los segmentos tienen curva de 4px, texto de 13px y peso 700; el activo es blanco con texto verde y una sombra breve. En móvil conservan texto de 13px, etiqueta visible para Lista y objetivos de 44px de alto; todas las vistas exponen aria-pressed.

### Appointment Dialog

El turno conserva el contexto de la pantalla mediante un diálogo lateral nativo.

Usa `<dialog>` modal, ancho de 500px, altura de `100dvh`, título visible y cierre por teclado. Cabecera, cuerpo y pie se separan con líneas; el cuerpo desplaza y las acciones permanecen en el pie. En móvil ocupa el ancho completo; los horarios disponibles pasan de cinco a cuatro columnas. Al cerrar restaura el foco al elemento que lo abrió.

La cabecera contextual del alta conserva profesional, agenda, fecha y franja. «Paciente registrado» y «Nuevo paciente» son opciones segmentadas; los campos del paciente nuevo siguen los controles existentes, con nombre/apellido en dos columnas que pasan a una en móvil. El aviso de borrador recuperado y la acción Descartar permanecen dentro del cuerpo.

### Professional Workspace

Agenda, Actividad y Aranceles comparten una navegación horizontal con subrayado verde para la ruta activa; Mi personal aparece para el propietario independiente. Calendario y próximos/cancelados se relacionan por la agenda seleccionada. Actividad muestra cifras tabulares y una barra azul por día; los aranceles se presentan como filas con importe, moneda y versión, junto al formulario. Hasta 1080px el editor se apila y la actividad reduce sus columnas; en móvil contexto, filas y acciones se leen verticalmente.

La cancelación por período usa diálogo contenido de hasta 640px, fondo modal existente y desplazamiento interno. El impacto rojo con cantidad y fechas antecede a motivo y confirmación explícita. La acción destructiva mantiene el botón rojo existente; las acciones pasan a ancho completo en móvil. Es una composición de esta operación, no un nuevo estilo de diálogo universal.

## Do's and Don'ts

### Do:

- **Do** usar el verde profundo para acciones y selección; conservar identidad de agenda en contexto y paleta temporal dentro del calendario.
- **Do** conservar la etiqueta textual junto a los colores de estado.
- **Do** usar Nunito Sans local y cifras tabulares para horarios y cantidades alineadas.
- **Do** mantener bordes finos, paneles planos y sombras localizadas según su función.
- **Do** conservar foco visible, retorno de foco y la preferencia de movimiento reducido al extender componentes interactivos.
- **Do** distinguir por texto horario pasado, hora prevista actual y recepción registrada, con la misma clasificación en todas las vistas de calendario.

### Don't:

- **Don't** comunicar confirmación, cancelación o entrega únicamente mediante color.
- **Don't** trasladar el color de una agenda al significado de su estado.
- **Don't** mostrar «Atendido» porque terminó el horario previsto ni usar la línea de hora actual como registro de presencia.
- **Don't** tratar un panel estático como botón ni añadirle una elevación de reposo ajena al sistema.
- **Don't** reemplazar los SVG existentes por glifos de texto o una tipografía de iconos.
- **Don't** convertir la composición de jornada o su modo de uso en una regla de marca para todas las superficies.

No canonizado: las variables de color declaradas sin uso y los valores sustituidos por la cascada no se promueven a tokens. Los tamaños contextuales pequeños del calendario se registran donde existen, sin convertirlos en tamaño general de lectura. El hover destructivo anterior queda excluido; la documentación recoge su corrección final. Los snippets heredados de campo, navegación y panel del sidecar conservan pequeñas diferencias de medida frente al CSS actual; este incremento no las repara ni las convierte en reglas nuevas.


<!-- Contexto de lectura incorporado el 21/10/2026; composición de jornada actualizada el 27/10/2026. -->

- Escala compartida: texto base 1rem, etiquetas y nombres operativos 0.875rem, detalle 0.8125rem y metadatos 0.75rem. El texto de práctica mantiene opacidad completa sobre su par de agenda.
- Los divisores suaves y los bordes de controles son tokens diferentes. Foco en verde Patio con anillo visible; los pares de agenda no cambian su significado.
- Jornada de secretaría mantiene calendario antes de recepción al apilarse; el espacio profesional conserva próximos y cancelados después del calendario.
- Cada turno diario muestra hora, paciente, práctica, duración y asistencia con texto e icono. Un solo punto de tabulación permite entrar a la grilla y recorrer horarios con flechas, Inicio y Fin.
- Pacientes adapta la tabla a filas verticales con documento, cobertura, estado y apertura de ficha visibles, sin desplazamiento horizontal en móvil. Abrir/cerrar una ficha conserva orientación y foco.
- Los objetivos móviles habituales miden 44px; los siete días de la tira conservan el ancho disponible y al menos 54px de alto.
- Los borradores viven solo en memoria, se recuperan dentro del mismo contexto y se eliminan al cambiar entidad, rol, cuenta, vencer la sesión o recargar. Incluyen el modo de paciente y los seis datos de un alta incompleta; recuperar un turno vuelve a consultar DNI y disponibilidad según corresponda, sin pre-reserva ni registro automático.
- Ayuda está disponible en la navegación y explica registro, asistencia, reprogramación, avisos, borradores y teclado.
