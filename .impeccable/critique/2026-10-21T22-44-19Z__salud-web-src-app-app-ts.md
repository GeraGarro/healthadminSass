---
target: "Diseño del SaaS Patio: tipografía, paleta, iconos y distribución del viewport"
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\gerag\\OneDrive\\Documents\\ChatGPT\\Sistema de Gestión Administrativa Salud\\salud-web\\src\\app\\app.ts"
target_fingerprint: "sha256:a5eac3f8714dbe91f6801ab7a7665eb63dd239122b1c9078f9dc4b714910bde6"
target_path: "C:\\Users\\gerag\\OneDrive\\Documents\\ChatGPT\\Sistema de Gestión Administrativa Salud\\salud-web\\src\\app\\app.ts"
timestamp: 2026-10-21T22-44-19Z
slug: salud-web-src-app-app-ts
closed: true
---
Method: dual-agent (A: /root/design_review · B: /root/technical_evidence)

Patio tiene una identidad coherente para gestión administrativa de salud. Las correcciones más importantes son hacer legibles los datos operativos y dar prioridad al siguiente paciente y a los pendientes dentro del primer viewport. La evaluación heurística es **25/40**; es una revisión de la interfaz demostrativa, no una certificación de accesibilidad ni de funcionamiento del servidor.

## Alcance y evidencia

Objetivo estable: `salud-web/src/app/app.ts`, con layout, páginas, calendario, panel de turno e iconos relacionados y `salud-web/src/styles.css`.

Se revisaron PRODUCT.md, DESIGN.md y la implementación actual. Dos evaluaciones independientes: A, revisión de diseño; B, detector y evidencia técnica. A finalizó antes de incorporar los hallazgos del detector a la síntesis. Navegador con datos ficticios: acceso, jornada, agenda, nuevo turno sin registrar y pacientes. Viewports de 1280×720, 390×844 y 320×740 CSS px. Las imágenes emitidas por el navegador pueden tener dimensiones físicas diferentes; las posiciones aquí indicadas son CSS px.

El detector se ejecutó una vez sobre `salud-web/src/app` y devolvió `[]`: cero hallazgos, reglas y ubicaciones reportadas. No indicó cantidad de archivos analizados. Ese resultado no evalúa por sí solo contraste efectivo, legibilidad ni jerarquía operativa. No hubo falsos positivos del detector. No se modificó implementación.

## Especificidad e impresión general

La organización por profesional, el contexto de entidad, las consignas del próximo paciente y la separación entre registrar y confirmar asistencia vinculan el diseño con este producto. El sistema visual es sereno y consistente. La principal oportunidad consiste en convertir esa calma en una lectura rápida: actualmente los datos de trabajo son demasiado pequeños y el contenido prioritario queda desplazado por el calendario.

## Lo que funciona

- Nunito Sans local, cifras tabulares y SVG de trazo consistente forman una identidad clara.
- El próximo turno reúne hora, persona, práctica, consultorio, asistencia y consigna; es información útil para actuar.
- Registro, confirmación y cancelación conservan significados diferentes. El panel nativo tiene cierre, retorno de foco y acciones persistentes; el menú móvil dispone de manejo de foco e inert.

## Evaluación heurística

Escala: 0–4 por criterio. Todos aplican a una superficie Operate.

| Heurística | Puntaje | Hallazgo principal |
|---|---:|---|
| Visibilidad del estado | 3 | Contexto, carga y errores visibles; asistencia sutil en calendario. |
| Correspondencia con el mundo real | 3 | Lenguaje administrativo adecuado; explicar mejor pre-reserva y registro. |
| Control y libertad | 2 | Salidas claras; cierre del panel descarta el borrador. |
| Consistencia | 3 | Identidad cohesiva; estados y selección de Lista divergen. |
| Prevención de errores | 3 | Disponibilidad y consecuencias explícitas; falta proteger trabajo pendiente. |
| Reconocimiento frente a recuerdo | 2 | Leyenda fuera de vista y estados que requieren interpretación. |
| Flexibilidad y eficiencia | 2 | Búsqueda y vistas alternativas; muchos pasos de teclado y desplazamiento. |
| Estética y minimalismo | 3 | Calma visual; jerarquía vertical y tamaños perjudican la lectura. |
| Recuperación de errores | 3 | Reintentos disponibles; falta asociar algunos errores con su campo. |
| Ayuda y documentación | 1 | Aclaraciones dispersas sin acceso visible a ayuda de tareas. |
| **Total** | **25/40** | **Base coherente con correcciones operativas pendientes.** |

## Correcciones prioritarias

### 1. [P1] Reordenar la primera pantalla y situar la agenda en el momento actual

En Jornada a 1280×720, el cuerpo del calendario comienza aproximadamente en y=501 y muestra 08:00–09:00, aunque la referencia demo es 10:20 y el próximo turno es 10:30. Hay desplazamiento de página y del calendario. En Jornada a 390×844, Próximo turno comienza en y=1106 y Para resolver en y=1722, después del calendario.

Esto obliga a buscar lo que debería orientar el trabajo inmediato. Mover próximo turno y un resumen de pendientes antes del calendario al apilar en móvil/tablet; compactar saludo, descripción y separaciones de la jornada; abrir Hoy cerca de la hora actual con algo de contexto anterior y conservar el desplazamiento elegido por el usuario. Evaluar alturas del calendario a partir de la altura disponible, sin desbordar acciones ni suprimir horarios.

Fuentes: `salud-web/src/app/pages/dashboard.ts:18`, `:50`, `:75`; `salud-web/src/app/ui/calendar.ts:33`; `salud-web/src/styles.css:1257`, `:1263`, `:3344`.

Comandos sugeridos: `$impeccable layout`, `$impeccable adapt`.

### 2. [P1] Aumentar la tipografía operativa conservando Nunito Sans

Datos actuales: nombres de pacientes 11px/peso 800, prácticas 10px/peso 400, eje horario 9px y zona horaria 8px. En móvil los profesionales bajan a 10px y los consultorios a 9px. Los inputs usan 12px. En la vista mensual móvil, la fuente define horas de 7px y oculta nombres; ese último estado se comprobó en código, no mediante captura mensual.

La lectura frecuente no debe depender de abrir cada turno. Propuesta de escala a validar: nombres y datos de decisión 13–14px; horarios y estados 12–13px; metadatos al menos 11–12px, y texto general/formularios 14–16px según contexto. Usar rem, conservar cifras tabulares y reducir la variedad de pesos a funciones claras. Recalibrar altura de eventos, columnas, truncamiento y zoom al cambiar la escala. Estos tamaños son objetivos de diseño, no mínimos universales de WCAG.

Fuentes: `salud-web/src/styles.css:1281`, `:1322`, `:1730`, `:3950`, `:4147`, `:4159`, `:4220`.

Comando sugerido: `$impeccable typeset`.

### 3. [P1] Corregir contraste efectivo y separar identidad de agenda de asistencia

Los pares opacos funcionan: tinta sobre blanco 11,96:1; texto secundario sobre blanco 5,01:1; botón verde con blanco 7,75:1. Pero `.calendar-event > span:last-child:not(.event-line)` aplica opacidad 0,85 a práctica/duración: el contraste efectivo es 4,30:1 en salvia confirmada, 4,06:1 en lavanda confirmada y **3,64:1 en durazno confirmado**. Los pendientes lavanda/durazno también quedan por debajo de 4,5:1. El cálculo azul es de CSS; no apareció una agenda azul en la demo inspeccionada.

Eliminar esa atenuación y usar el texto opaco del par tonal, manteniendo al menos 4,5:1 para texto pequeño. Conservar verde Patio, superficies claras y colores de agendas. El borde de campo sobre blanco da 1,34:1 y el foco general 2,15:1: separar tokens de divisor decorativo, borde de control y foco, y reforzar las señales necesarias para identificar campos y foco. No oscurecer todos los separadores ni presentar cada borde claro como una infracción automática.

En la celda diaria el estado se representa con punto de 5px y, si está pendiente, borde discontinuo y fondo más claro. Hay un nombre accesible, pero la leyenda queda fuera de la vista inicial. Añadir etiqueta breve o iconos inequívocos de confirmado/pendiente, sin confundir color de profesional y estado. El sistema no depende exclusivamente del color: ya existe el borde discontinuo y los chips generales tienen texto.

Fuentes: `salud-web/src/styles.css:117`, `:1409`, `:1428`, `:1437`, `:1734`; `salud-web/src/app/ui/calendar.html:147`, `:163`.

Referencia: [WCAG, contraste de texto](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) y [contraste no textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

Comandos sugeridos: `$impeccable colorize`, `$impeccable clarify`.

### 4. [P2] Diferenciar iconos y ampliar áreas de interacción

Mi jornada y Prácticas y coberturas usan cuadrículas casi idénticas. Conservar el lenguaje SVG actual y cambiar uno de esos símbolos. La vista Lista es la única expresada solo con icono y no tiene aria-pressed, a diferencia de Día/Semana/Mes. Añadir etiqueta visible y estado seleccionado equivalente; incorporar aria-current a la navegación activa.

Las flechas de fecha miden 23×26px; los segmentos móviles, 24px de alto; menú móvil, 34×34px; perfil, 29×29px. Dar a los controles móviles de uso frecuente un área de interacción objetivo de 44×44px conservando iconos de 18–20px. Los 44px son una recomendación de comodidad; el mínimo AA de WCAG 2.2 es 24×24px o sus excepciones de separación/equivalencia, por lo que estas medidas no prueban por sí solas un incumplimiento de todos los controles.

Fuentes: `salud-web/src/app/ui/icon.ts:4`, `:18`; `salud-web/src/app/ui/calendar.html:52`; `salud-web/src/app/layout.html:41`; `salud-web/src/styles.css:1160`, `:3492`, `:3591`.

Referencia: [WCAG, tamaño mínimo de objetivos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Comandos sugeridos: `$impeccable adapt`, `$impeccable harden`.

### 5. [P2] Proteger borradores ante interrupciones

En la demo se escribió una consigna en Nuevo turno, se cerró el panel y se reabrió: el texto desapareció sin aviso ni recuperación. El cierre puede realizarse también con Escape o clic de fondo. La fuente de mensajes borra el texto al cambiar de conversación; ese caso se comprobó en código.

Conservar un borrador temporal acotado a entidad y operación/conversación, o advertir al cerrar solo si hay cambios pendientes. Limpiar borradores al cerrar sesión/cambiar contexto según la política de datos. Recuperar un borrador no debe comunicar que se reservó horario: la disponibilidad debe volver a validarse.

Fuentes: `salud-web/src/app/ui/appointment-panel.ts:96`, `:228`, `:231`, `:235`; `salud-web/src/app/pages/messages.ts:153`.

Comando sugerido: `$impeccable harden`.

## Carga cognitiva y recorrido

Carga moderada: fallan agrupación de opciones, jerarquía inicial y simplificación de elecciones al crecer. Secretaría presenta siete enlaces principales más configuración/cuenta; el selector de pacientes de demo contiene doce personas; la grilla introduce numerosos botones horarios en el recorrido de teclado. Agrupar navegación por tareas, mejorar búsqueda y estudiar navegación de teclado de la grilla. La tira de siete días es una convención útil y no necesita reducirse por un límite numérico arbitrario.

El acceso transmite calma; la jornada pierde fluidez cuando obliga a leer letras pequeñas y buscar el momento actual. El formulario recupera confianza con disponibilidad y consecuencias claras; la pérdida del borrador rompe esa confianza ante una interrupción.

## Riesgos por persona

- Recepción bajo interrupciones: texto pequeño, estados sutiles y pérdida de consignas al cerrar.
- Profesional desde teléfono: próximo paciente fuera de la primera pantalla; todas las agendas visibles por defecto añaden desplazamiento horizontal.
- Persona con baja visión o menor precisión motriz: datos de 8–11px, detalles atenuados, indicadores diminutos y controles compactos.

## Observaciones adicionales

- Los errores de formularios se concentran en avisos generales. Añadir mensajes junto al campo, aria-invalid y aria-describedby, y dirigir el foco al primer error pertinente.
- Agenda móvil muestra Profesional y Ver agenda, dos selectores sincronizados: unificar su presentación conservando el filtrado que ya funciona.
- Pacientes usa tabla de 500px dentro de 340px con scroll interno; priorizar nombre, identificación y apertura de ficha en el tramo visible móvil. No se confirmó un desborde general atribuible a esa tabla.
- Las prácticas de 35 minutos o menos se omiten en la celda diaria. Revisar si deben aparecer sin abrir detalle.
- Corregir text-transform: capitalize que produce “Martes, 20 De Octubre”.
- Ofrecer ayuda breve para confirmar asistencia, reprogramar y gestionar avisos.
- No se justifica incorporar fotografías, ilustraciones ni efectos adicionales para resolver estos problemas.

## Preguntas de diseño

¿Qué datos deben leerse sin abrir un turno: práctica, duración, asistencia y consigna? ¿Debe el profesional comenzar con su propia agenda y próximos encuentros, dejando todas las agendas como elección explícita?

Orden propuesto de trabajo: layout/adapt, typeset, colorize/clarify, harden y una pasada final de polish. Revalidar después los viewports de escritorio bajo, móvil de 390 y móvil de 320px, más zoom y estados de formularios. No se verificaron zoom 200%, dispositivos físicos, ultrawide ni todos los estados semanales/mensuales.
