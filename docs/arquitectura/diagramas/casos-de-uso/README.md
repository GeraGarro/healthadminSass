# Diagramas de casos de uso

Fecha: 16 de octubre de 2026. Diseño para revisión, sin implementación.

La [especificación principal](../../../21-casos-de-uso.md) es la fuente de las fichas. El [generador](../../../../scripts/generar-casos-de-uso.py) mantiene la configuración gráfica y produce SVG vectoriales y fuentes PlantUML equivalentes en contenido. Los dos renderizadores pueden distribuir las figuras de manera distinta. No se requiere red ni un servidor PlantUML para generar los SVG.

| Diagrama | Imagen | Edición visual | Fuente editable UML |
| --- | --- | --- | --- |
| Mapa de agrupación de objetivos | [SVG](01-mapa-general.svg) | [draw.io](01-mapa-general.drawio) | [PlantUML](01-mapa-general.puml) |
| Acceso y admisión | [SVG](02-acceso.svg) | [draw.io](02-acceso.drawio) | [PlantUML](02-acceso.puml) |
| Reserva y subfunciones incluidas | [SVG](03-turnos.svg) | [draw.io](03-turnos.drawio) | [PlantUML](03-turnos.puml) |
| Comunicaciones y operación | [SVG](04-operacion.svg) | [draw.io](04-operacion.drawio) | [PlantUML](04-operacion.puml) |
| Actividad de reserva | [SVG](05-actividad-reserva.svg) | [draw.io](05-actividad-reserva.drawio) | [PlantUML](05-actividad-reserva.puml) |
| Secuencia de reserva | [SVG](06-secuencia-reserva.svg) | [draw.io](06-secuencia-reserva.drawio) | [PlantUML](06-secuencia-reserva.puml) |
| Cronograma y evento profesional | [SVG](07-avisos.svg) | [draw.io](07-avisos.drawio) | [PlantUML](07-avisos.puml) |

Los SVG y PlantUML son derivados: cambiar la configuración del generador y regenerar junto con HTML/PDF. Los diagramas 02-04 son vistas parciales de casos de uso, no una matriz exhaustiva de permisos. El mapa 01 agrupa actores con / para lectura; no crea roles combinados. El diagrama 03 usa <<include>> solo para subfunciones obligatorias de ambos objetivos. No representa orden temporal ni permisos de ejecución independiente.

Los límites son explícitos en las vistas UML. Componentes internos (base, planificador y coordinador) solo aparecen en la secuencia, no como actores. Las asociaciones siguen sujetas a entidad, recurso, representación, membresía y facultad vigente.

## Editar visualmente en draw.io

Los siete `.drawio` contienen XML nativo sin comprimir, con figuras, textos y conectores editables; no contienen una captura aplanada ni un enlace a una imagen externa. Abrir el archivo con la aplicación draw.io/diagrams.net mediante su opción de abrir un archivo del dispositivo. Cada uno corresponde a una sola figura del documento. Se pueden modificar textos y figuras, mover elementos, agrupar selecciones y ajustar conectores. Las etiquetas contenidas se vinculan a su figura cuando se puede determinar su contenedor.

El [exportador de editables](../../../../scripts/exportar_diagramas_editables.py) crea estos archivos desde los SVG locales y conserva los `.drawio` existentes para no perder ediciones manuales:

```text
python scripts/exportar_diagramas_editables.py
```

Solo para reemplazar deliberadamente las versiones editadas por el estado actual de los SVG:

```text
python scripts/exportar_diagramas_editables.py --sobrescribir
```

La sincronización no es bidireccional: editar `.drawio` o `.puml` no actualiza automáticamente SVG, PDF o el generador. Para un cambio permanente de reglas, mantener el documento 21 y la configuración gráfica del generador; para una variante visual, conservar su archivo editable y exportar la imagen correspondiente. La generación completa puede reemplazar SVG/PlantUML; no reemplaza draw.io ni esta guía. El modo `--solo-web` conserva todos los diagramas y el PDF.

La estructura XML, referencias internas y textos de los draw.io se verifican mediante el verificador documental. Esa comprobación no equivale a haber abierto los archivos en la aplicación draw.io.
