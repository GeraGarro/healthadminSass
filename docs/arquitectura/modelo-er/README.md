# Modelo entidad relación editable

Abrir `modelo-er-completo.drawio` en diagrams.net o draw.io. Contiene todas las láminas con entidades, atributos y conectores nativos; no son capturas incrustadas. También se entregan láminas individuales.

## Explicación paso a paso

La [colección de estudio](partes/README.md) organiza las 17 láminas en carpetas numeradas. Cada carpeta incluye una explicación detallada en PDF y Markdown, todos los campos y relaciones, ejemplos ficticios y su diagrama en PDF, SVG, draw.io y Mermaid. Comenzar por el [índice y ruta de lectura](partes/00-indice-y-ruta-de-lectura.pdf) y la [explicación de identidad y credenciales, parte 1](partes/01-identidad-y-credenciales-parte-1/explicacion.pdf).

Contenido pedagógico en el `contenido.json` de cada parte y en `partes/glosario-campos.json`; regenerar la colección con `scripts/generar-guia-modelo-er.py` después de actualizar las fuentes del modelo. El material explicativo conserva el estado propuesto y los pendientes de las decisiones originales.

`modelo-er.json` es la fuente estructurada generada por `scripts/generar-modelo-er.py`. El generador mantiene fuentes, Word, diagramas SVG, Mermaid y PDF de láminas coherentes. Los PNG de trabajo quedan en `tmp/modelo-er` y no son entregables.

El documento principal es `docs/23-modelo-entidad-relacion.md`; Word en `output/docx/modelo-entidad-relacion-salud.docx` y PDF en `output/pdf/modelo-entidad-relacion-salud.pdf`. Versión 1.1, 17 de octubre de 2026. [ADR-015](../adr/015-identificadores-uuidv7.md) fija UUIDv7 para PK internas y tipo uuid para sus FK, incluido tenant_id; el número visible del paciente sigue siendo entero por profesional y entidad. No es SQL ejecutable.

G global restringido, T entidad con tenant_id, X excepción administrativa. Las líneas de cada lámina conectan su propio grupo. Todas las referencias externas están escritas en la FK y enumeradas en el registro completo del documento. 1/0..1 expresa padres por hijo; 0..N salvo UQ expresa hijos por padre. Los puentes resuelven N a M. La tabla ENTIDAD es raíz global de aislamiento y sus referencias tenant_id se omiten como líneas para evitar saturación.

El modelo respeta las decisiones confirmadas y marca propuestas y pendientes. No cierra D01-D16, ni implementa permisos, RLS, capacidad, canales o eliminación. Las entidades X documentan una alternativa excepcional aún por revisar, sin traslado automático de fichas.

Las ediciones manuales del draw.io se preservan al ejecutar el generador salvo `--sobrescribir-editables`. Para conservarlas como fuente permanente, trasladar su intención al generador y regenerar bajo revisión.
