# 06. Ficha y acceso del paciente, parte 2

18 de octubre de 2026

Comprenda cómo se asigna un número visible estable sin repetirlo cuando varias personas registran pacientes a la vez.

**Ejemplo de conjunto.** Lucía recibe el número 12 de Ana en Clínica Norte. Su baja no libera el 12, y dos altas simultáneas deben recibir números diferentes mediante una operación coordinada.

**Recorrido.** Serie por entidad y profesional > CONTADOR_PACIENTE > asignación confirmada > PACIENTE_PROFESIONAL, explicado en la parte 1.

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

## 1. CONTADOR_PACIENTE: Control del próximo número de paciente de un profesional

Mantiene la serie de numeración por profesional y entidad. Permite asignar números sin duplicados cuando se producen altas simultáneas.

**Ejemplo ficticio.** El contador de Ana empieza en 0 y asigna 1 al primer vínculo. Si el último confirmado es 12, el siguiente alta válida asigna 13 mediante una operación controlada.

**Cómo distinguirlo.** No se obtiene el siguiente número contando pacientes ni buscando un máximo sin coordinar la concurrencia. El último número tampoco expresa cuántos pacientes activos existen.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| profesional_id | FK/uuid/obligatorio | Identidad profesional global a la que corresponde el registro. Destino: PROFESIONAL_GLOBAL, identidad profesional reconocida en la plataforma. Cada registro requiere exactamente un destino válido. |
| profesional_entidad_id | FK/uuid/obligatorio | Vínculo local del profesional con la entidad de este registro. Destino: PROFESIONAL_ENTIDAD, vínculo de un profesional con una clínica. Cada registro requiere exactamente un destino válido. |
| ultimo_confirmado | entero/obligatorio | Último número cuya asignación quedó confirmada en la serie. Empieza en 0; el primer número asignado es 1. No cuenta pacientes activos. |
| version | entero/obligatorio | Número de control del contador para coordinar actualizaciones concurrentes; no es una versión de práctica ni de turno. |

**Reglas del modelo.** UQ(tenant_id,profesional_id) y UQ(tenant_id,profesional_entidad_id). Inicial 0; alta serializada e idempotente; no usar COUNT o MAX sin serialización.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R01.a; ADR-001.

## Relaciones de esta lámina, incluidas las referencias externas

- CONTADOR_PACIENTE.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de CONTADOR_PACIENTE mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- CONTADOR_PACIENTE.profesional_id: cada registro debe referir a exactamente un registro de PROFESIONAL_GLOBAL. Como padre, cada registro de PROFESIONAL_GLOBAL puede ser referido por cero, uno o varios registros de CONTADOR_PACIENTE mediante ese campo. Destino en carpeta 04-profesionales-e-incorporacion. ID global restringido.
- CONTADOR_PACIENTE.profesional_entidad_id: cada registro debe referir a exactamente un registro de PROFESIONAL_ENTIDAD. Como padre, cada registro de PROFESIONAL_ENTIDAD puede ser referido por cero, uno o varios registros de CONTADOR_PACIENTE mediante ese campo. Destino en carpeta 04-profesionales-e-incorporacion. compuesta tenant_id + id.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
