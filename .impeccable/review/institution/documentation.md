# Documentación final · Administración institucional

Fecha: 26 de octubre de 2026. Extensión Operate del sistema Patio existente, con el padrón profesional como entrada. No se estableció una identidad nueva ni se añadieron tokens globales.

## Evidencia comprobada

- Código muestreado: `salud-web/src/app/pages/institution.ts`, `.html`, `.css`, `core/institution.store.ts` y estilos compartidos de `salud-web/src/styles.css`. Se comprobó el selector móvil, el estado de orden compartido, el reinicio de página, los estados textuales, los formularios en contexto y la gestión de foco del detalle y de la baja.
- Referencias contrastadas: `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, el brief de institución y `docs/33-administracion-institucional.md`.
- Inspección directa de capturas finales: `desktop.png` (1440px), `mobile.png` (390px), `detail-390.png` y `permissions-1280.png`. Muestran el padrón como entrada, los controles nativos, el orden visible en teléfono, el detalle y las facultades dentro del mismo lenguaje visual.
- Evidencia leída: `finish-review.md`, `verdict-pass.md`, `functional-results.json` y `detector.json`. El registro funcional contiene 18 recorridos en 1440/1280/390px, incluye orden A–Z/Z–A y termina con `errors: []`; el detector registra `[]`. Este pase documental no volvió a ejecutar esos recorridos ni las pruebas de servidor.

## Comparación con el sistema registrado

| Aspecto | Resultado y evidencia |
| --- | --- |
| Paleta y superficies | Coinciden con Patio: lienzo claro, panel blanco, rail celadón y verde funcional. La hoja institucional referencia las variables existentes; no declara un nuevo bloque de tokens. El rojo se reserva para la baja y sus errores. |
| Tipografía | Nunito Sans local heredada. El encabezado compartido conserva 29px y el ajuste móvil vigente; datos operativos de 14px, detalle de 13px y metadatos de 12px. Los contadores usan cifras tabulares. No se añade una familia ni una escala global. |
| Formas y profundidad | Paneles planos con borde fino y curva de 14px del sistema; controles y campos heredados. La baja usa un diálogo nativo de foco protegido. No aparece una sombra decorativa nueva en la superficie institucional. |
| Componentes y estados | Botones primarios, secundarios y destructivos, campos etiquetados, SVG del sistema, selección tonal y vínculo escrito. La muestra de facultades conserva foco visible. Los formularios ordinarios se muestran en contexto; la confirmación de baja expone consecuencias. |
| Adaptación | Tabla de padrón en escritorio, filas verticales en teléfono y detalle a ancho disponible. Hasta 760px el selector de orden conserva ambas direcciones; el encabezado ordenable permanece en escritorio. Son decisiones de esta superficie, sin convertir su composición en una regla de marca. |
| Reglas existentes | Se conservan The Functional Green Rule, The Explicit State Rule, The Stable Clock Rule y The Local Depth Rule en el alcance muestreado. No se añadieron reglas ni prohibiciones a DESIGN.md. |

## Decisiones duraderas registradas

`PRODUCT.md` incorpora al administrador de institución y las capacidades institucionales implementadas, con sus límites de facultades, creación de cuentas, estructura de agendas y baja local. Se preservó el resto del contexto. `docs/33-administracion-institucional.md` sigue siendo la trazabilidad de funciones y contratos e incorpora una referencia breve a la continuidad visual y a la evidencia final. El brief registra únicamente la adaptación de orden móvil y el cierre correspondiente.

## Conservación y desajustes previos

Se conservaron sin modificación los archivos normativos del sistema. Hashes SHA-256 comprobados antes y después de la documentación:

| Archivo | SHA-256 |
| --- | --- |
| `DESIGN.md` | `2A394CDA61015E2A1FBE3A3BBB708E481B6F304597DAD61B535D7D67A0127D42` |
| `.impeccable/design.json` | `9C8EBF93F75B0615B513D59314A78E5FE78DA4E38FCED5A7F8E9855CABC24ACB` |

No canonizado ni reparado: la sección histórica Evidence on Hand de `PRODUCT.md` todavía dice que no existe un frontend funcional ni un sistema visual establecido. La muestra «Campo con etiqueta» del sidecar conserva texto de 14px y anillo de 2px, frente al texto vigente de 15px en escritorio y foco de campo de 3px del CSS compartido y de DESIGN.md. Son desajustes anteriores a esta extensión; no se reescribió el sistema ni se promovieron esas muestras a nuevas normas. El resto del drift histórico no fue auditado exhaustivamente.

## Límites del cierre

`finish-review.md` documenta la ausencia inicial del orden móvil; `verdict-pass.md` registra su corrección, `remaining: clear` y `disposition: ship` exclusivamente para ese hallazgo puntuado. La captura móvil revisada ya incluye «Ordenar / Nombre A–Z» y el código ofrece Z–A mediante el mismo estado. La revisión no certifica accesibilidad integral, toda la navegación de la aplicación ni operación productiva. Los resultados de pruebas Angular, dominio e integración se conservan en `docs/33-administracion-institucional.md` con su alcance; aquí se contrastó evidencia documental y visual, sin volver a ejecutarlos.

Las capturas son evidencia de revisión, no nuevos recursos raster servidos por la aplicación. No se introdujo un raster de producción ni una comp de identidad que requiera nueva procedencia. No se modificaron código de interfaz, backend, DESIGN.md ni sidecar en este pase.
