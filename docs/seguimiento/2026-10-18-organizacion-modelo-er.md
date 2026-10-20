# Organización y limpieza del estudio del modelo E-R

18 de octubre de 2026.

## Ubicación vigente

Las 17 láminas individuales y sus explicaciones se encuentran en
[docs/arquitectura/modelo-er/partes](../arquitectura/modelo-er/partes/README.md).
El [índice PDF](../arquitectura/modelo-er/partes/00-indice-y-ruta-de-lectura.pdf)
indica el recorrido de lectura. El modelo integral y su diccionario permanecen
en sus ubicaciones documentales y de exportación vigentes.

Cada parte reúne:

- `README.md`: entrada a los archivos de esa parte.
- `contenido.json`: contenido pedagógico editable de la lámina y sus entidades.
- `explicacion.md` y `explicacion.pdf`: guía de lectura generada.
- `diagrama.drawio`, `diagrama.mmd`, `diagrama.svg` y `diagrama.pdf`: formatos del diagrama.

`partes/glosario-campos.json` conserva las definiciones compartidas de campos,
papeles de las FK, símbolos, aclaraciones y glosario. `partes/estructura.json`
establece el orden y la correspondencia con los nombres anteriores de las láminas.
En `scripts` permanecen los generadores, verificadores y utilidades técnicas.

## Material retirado o sustituido

- La colección duplicada de `output/pdf/modelo-er-paso-a-paso/`, sustituida por las carpetas de `docs`.
- Los 51 archivos individuales `.drawio`, `.mmd` y `.svg` que estaban sueltos en la raíz de `modelo-er`; sus originales se conservaron en la carpeta correspondiente de `partes`.
- `scripts/contenido_guia_modelo_er.py`, sustituido por los JSON documentales de cada parte y el glosario compartido.
- Las imágenes, PDF de trabajo y utilidades puntuales de revisión de `tmp/modelo-er/`, incluidas salidas de numeraciones anteriores de las láminas.
- Las cachés Python del estudio y el informe temporal de verificación de la ubicación anterior.
- Los paquetes ZIP anteriores se sustituyeron por exportaciones de la estructura vigente.

La limpieza se limita al material duplicado o temporal del estudio E-R. Las
reglas del dominio, ADR, documentación histórica y demás áreas del proyecto
conservan su contenido. La reorganización no cambia decisiones del modelo ni
convierte las propuestas pendientes en requisitos aprobados.

## Comprobaciones de conservación

Antes de retirar las ubicaciones anteriores se comprobó:

- Igualdad SHA256 de los 51 diagramas originales y sus destinos.
- Igualdad del texto y de la cantidad de páginas de las 17 guías trasladadas.
- Igualdad de las explicaciones de las 88 entidades y de los diccionarios pedagógicos extraídos del módulo Python.
- Cobertura de los 722 campos y las 252 referencias FK del modelo.

Los generadores y verificadores utilizan la nueva estructura. Las exportaciones
ZIP se generan a partir de ella. Los informes actuales de verificación se guardan
en `modelo-er/verificacion-modelo.json` y `partes/verificacion-documental.json`.
