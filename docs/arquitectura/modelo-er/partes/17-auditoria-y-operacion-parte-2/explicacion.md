# 17. Auditoría y operación, parte 2

18 de octubre de 2026

Cierre el recorrido con la coordinación de fallos técnicos. Un incidente vincula responsables, tiempos, actuaciones y evidencia mínima.

**Ejemplo de conjunto.** Ante una interrupción, un responsable coordina contención y recuperación. El registro permite seguir el problema sin copiar fichas o conversaciones a una descripción técnica general.

**Recorrido.** Apertura del INCIDENTE > identificación de alcance mínimo > actuaciones de contención y recuperación > evidencia > cierre autorizado y documentado.

[Explicación en PDF](explicacion.pdf) · [Lámina original PDF](diagrama.pdf) · [Diagrama SVG](diagrama.svg) · [Editable draw.io](diagrama.drawio) · [Fuente Mermaid](diagrama.mmd)

## Cómo leer las marcas

- **Entidad del diagrama:** Tipo de cosa sobre la que se guardan datos. Cada caja representa una tabla; cada fila de esa tabla es un caso particular.
- **ENTIDAD y tenant_id:** ENTIDAD es la clínica o actividad cliente. tenant_id identifica a la organización propietaria de un dato local; tenant significa ese ámbito de aislamiento.
- **PK y UUIDv7:** PK es la clave primaria del registro. Los identificadores internos usan UUIDv7. No son el número visible de paciente ni una autorización secreta.
- **FK:** Referencia a otra tabla. Se lee desde el campo y su destino, aunque las líneas se crucen o pasen cerca de otras cajas.
- **UQ:** Restricción de unicidad: impide repetir la combinación indicada. Puede reducir una relación de muchos registros a uno como máximo.
- **? y vacío:** El atributo es opcional. Un campo vacío no implica automáticamente una autorización ni la ausencia de otras condiciones.
- **1 / 0..1 / 0..N:** Exactamente uno / ninguno o uno / ninguno, uno o varios. El registro de relaciones aclara ambos sentidos.
- **[G] / [T] / [X]:** Global restringido / local de una entidad con tenant_id / excepción administrativa entre origen y destino. Global no significa público.
- **instante / enum / secreto:** Fecha y hora / código de un catálogo por definir / dato sensible o referencia protegida. Los estados de tablas diferentes son dimensiones separadas.
- **Versión / snapshot:** Una versión conserva una definición histórica. Snapshot significa copia de las condiciones aplicadas en un momento; complementa las FK y no permite datos clínicos fuera de alcance.

## 1. INCIDENTE: Registro de coordinación de un problema técnico

Organiza la contención y recuperación de un incidente mediante responsable, tiempos, situación, alcance mínimo, acciones y evidencia.

**Ejemplo ficticio.** Un fallo operativo interrumpe parte del servicio. Se registra quién coordina la resolución y dónde consultar la evidencia técnica autorizada.

**Cómo distinguirlo.** Es un registro mínimo de coordinación. Los datos locales sensibles se mantienen bajo sus controles y no se trasladan indiscriminadamente a la descripción del incidente.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| responsable_ref | texto/obligatorio | Referencia operativa de la persona o equipo que coordina el incidente. |
| abierto_en | instante/obligatorio | Fecha y hora de apertura del caso o incidente. |
| cerrado_en | instante/opcional | Fecha y hora de cierre del caso o incidente. El modelo admite dejarlo vacío. |
| estado | enum/obligatorio | Situación del tratamiento del incidente. El catálogo y sus transiciones deben acordarse; no implica que un respaldo o restauración hayan sido exitosos. |
| alcance_minimo | texto/obligatorio | Descripción técnica mínima de los servicios o componentes afectados por el incidente, sin trasladar datos locales sensibles. |
| acciones_ref | texto/obligatorio | Referencia al registro de las actuaciones de contención y recuperación del incidente. |
| evidencia_ref | texto/opcional | Referencia a la evidencia autorizada que respalda una verificación, ensayo o actuación. No implica almacenar archivos sensibles directamente aquí. El modelo admite dejarlo vacío. |

**Reglas del modelo.** Metadatos técnicos mínimos; información local sensible permanece bajo su entidad y acceso autorizado.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** S12; CU-34.

## Relaciones de esta lámina, incluidas las referencias externas


## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
