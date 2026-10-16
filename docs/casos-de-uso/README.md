# Vista web de los casos de uso

La documentación se puede abrir directamente con [index.html](index.html). No requiere servidor, instalación de dependencias de navegador ni conexión a internet. Las 37 fichas, tablas, enlaces y diagramas son HTML estático; JavaScript solo mejora navegación e impresión.

## Archivos y responsabilidades

| Archivo | Responsabilidad | Cómo editarlo |
| --- | --- | --- |
| [index.html](index.html) | Documento generado, con etiquetas semánticas, sangría y comentarios por ficha. Carga un CSS y un JS locales. | Para cambios permanentes de contenido usar el documento 21; para estructura general usar la plantilla. |
| [plantilla.html](plantilla.html) | Estructura base: metadatos, índice, acciones, accesibilidad y referencias a CSS/JS. | Editar directamente; conservar los marcadores `{{NAVEGACION}}` y `{{CONTENIDO}}`. No abrirla como documento final: sus marcadores se completan al generar. |
| [casos-de-uso.css](casos-de-uso.css) | Variables, índice, tipografía, tablas, diagramas, fichas, móvil e impresión, organizados por bloques comentados. | Editar directamente; el generador no lo sobrescribe. |
| [casos-de-uso.js](casos-de-uso.js) | Tres funciones documentadas: imprimir, marcar la ubicación del índice e inicializar esas mejoras. | Editar directamente; el generador no lo sobrescribe. No necesita bibliotecas ni peticiones de red. |
| [Documento 21](../21-casos-de-uso.md) | Fuente del contenido funcional: casos, reglas, criterios y pendientes. | Editar y regenerar la vista. |
| [Generador](../../scripts/generar-casos-de-uso.py) | Convierte Markdown en bloques HTML legibles y rellena la plantilla; también mantiene generación completa de diagramas/PDF. | Cambiar las funciones de representación si cambia la transformación, no para ajustar estilos. |

## Actualizar solamente la web

Desde la raíz del proyecto, ejecutar:

```text
python scripts/generar-casos-de-uso.py --solo-web
python scripts/verificar-casos-de-uso.py
```

Este modo conserva PDF y diagramas. Para cambios solo de estilos o comportamiento, editar CSS/JS y recargar el navegador; ni siquiera hace falta regenerar el HTML. El botón de impresión permanece oculto si JavaScript no está disponible. Los enlaces del índice y las fuentes de diagramas funcionan sin JavaScript.

La impresión desde navegador usa el CSS de impresión. El PDF ya preparado es un entregable independiente con su propia composición; los cambios de CSS no lo modifican.

## Diagramas editables

Cada figura de la vista web ofrece enlaces individuales a draw.io, PlantUML y SVG. La [guía de diagramas](../arquitectura/diagramas/casos-de-uso/README.md) enumera los siete y explica qué archivo editar y cómo conservar los cambios.
