# 15. Continuidad del fichaje

18 de octubre de 2026

Esta parte estudia operaciones excepcionales entre organizaciones. Separe terminar un vínculo, autorizar continuidad y tramitar una petición expresa de eliminación.

**Ejemplo de conjunto.** Ana deja Clínica Norte. La continuidad, si se autoriza, debe definir procedencia y alcance de los vínculos del destino, preservando la información ajena y resolviendo su numeración.

**Recorrido.** TRANSICION_PROFESIONAL > CORRESPONDENCIA_FICHAJE para continuidad autorizada; PETICION_ELIMINACION es un trámite distinto que requiere verificación y diseño de ejecución.

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

## 1. TRANSICION_PROFESIONAL: Operación excepcional de baja o continuidad entre entidades

Registra una actuación administrativa sobre un profesional, con origen, posible destino, operador, autorización y fecha efectiva.

**Ejemplo ficticio.** Se administra la salida de Ana de una clínica y, si corresponde, una continuidad autorizada hacia su actividad independiente.

**Cómo distinguirlo.** Es una alternativa de modelado pendiente de revisión. No mueve fichas cambiando tenant_id ni contiene fichas en este registro. Una baja puede no tener destino; una continuidad sí lo requiere.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| profesional_id | FK/uuid/obligatorio | Identidad profesional global a la que corresponde el registro. Destino: PROFESIONAL_GLOBAL, identidad profesional reconocida en la plataforma. Cada registro requiere exactamente un destino válido. |
| entidad_origen_id | FK/uuid/obligatorio | Organización desde la cual se tramita la baja o continuidad. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| entidad_destino_id | FK/uuid/opcional | Organización de destino de la continuidad, cuando corresponde. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| operador_id | FK/uuid/obligatorio | Cuenta de quien ejecuta la operación administrativa o de soporte. Destino: CUENTA, usuario personal del sistema. Cada registro requiere exactamente un destino válido. |
| tipo | enum/obligatorio | Clase de operación excepcional propuesta, diferenciando baja y continuidad. No determina por sí sola copia ni traslado de fichas. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| fecha_efectiva | instante/opcional | Fecha prevista para que la transición o baja produzca sus efectos autorizados. El modelo admite dejarlo vacío. |
| autorizacion_ref | texto/obligatorio | Referencia a la autorización que permite el envío o la transición excepcional según el contexto. |
| clave_operacion | texto/obligatorio | Identificador de deduplicación de una operación de lote o transición dentro de su restricción de unicidad. |

**Reglas del modelo.** UQ(clave_operacion). Metadatos restringidos de plataforma; no almacena fichas. Baja puede no tener destino; continuidad sí lo exige. No modifica tenant de registros existentes.

**Estado.** Alternativa de modelado pendiente D04 D12. **Fuentes.** R05 R10; ADR-011; docs/19.

## 2. CORRESPONDENCIA_FICHAJE: Relación trazable entre vínculos de origen y destino

Documenta la procedencia entre el vínculo paciente-profesional original y el del destino dentro de una transición autorizada.

**Ejemplo ficticio.** Una continuidad autorizada necesita registrar qué vínculo de origen corresponde a cuál en el destino, con su alcance y resolución de numeración.

**Cómo distinguirlo.** Es una excepción administrativa entre entidades. No decide todavía si habrá copia o proyección y no habilita lectura general de datos de la clínica de origen.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| transicion_id | FK/uuid/obligatorio | Operación excepcional que autoriza y contextualiza la correspondencia. Destino: TRANSICION_PROFESIONAL, operación excepcional de baja o continuidad entre entidades. Cada registro requiere exactamente un destino válido. |
| vinculo_origen_id | FK/uuid/obligatorio | Relación paciente-profesional de la entidad de origen. Destino: PACIENTE_PROFESIONAL, relación del paciente con su profesional y su número visible. Cada registro requiere exactamente un destino válido. |
| vinculo_destino_id | FK/uuid/opcional | Relación paciente-profesional de la entidad de destino. Destino: PACIENTE_PROFESIONAL, relación del paciente con su profesional y su número visible. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| alcance_datos_ref | texto/obligatorio | Referencia al alcance de información autorizado para la continuidad entre origen y destino; no concede lectura general. |
| resolucion_numeracion_ref | texto/opcional | Referencia a cómo se resuelve la numeración en el destino. La política definitiva permanece pendiente. El modelo admite dejarlo vacío. |

**Reglas del modelo.** Excepción cruzada explícita: validar tenant origen/destino contra transición y mismo profesional. UQ(transicion_id,vinculo_origen_id). No habilita lectura general ni decide copia/proyección. Números destino pendientes.

**Estado.** Alternativa de modelado pendiente D04 D12. **Fuentes.** ADR-011; docs/19; D04 D12.

## 3. PETICION_ELIMINACION: Solicitud verificada de eliminación presentada por el profesional

Registra la petición expresa, quién la solicita, la evidencia de verificación y, si se ejecuta, quién interviene y cuándo.

**Ejemplo ficticio.** Ana presenta una petición de eliminación que debe verificarse y tramitarse según el diseño que se apruebe.

**Cómo distinguirlo.** Solicitar, aprobar y ejecutar no son equivalentes. La conservación de fichas e historial, la anonimización y las referencias históricas requieren diseño; no hay un borrado en cascada aprobado.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| profesional_id | FK/uuid/obligatorio | Identidad profesional global a la que corresponde el registro. Destino: PROFESIONAL_GLOBAL, identidad profesional reconocida en la plataforma. Cada registro requiere exactamente un destino válido. |
| solicitante_id | FK/uuid/opcional | Cuenta de quien presenta la solicitud; puede actuar por otra persona cuando el modelo lo permite. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| peticion_verificada_ref | texto/obligatorio | Evidencia de que la petición de eliminación corresponde al propio profesional y fue verificada. |
| solicitada_en | instante/obligatorio | Fecha y hora de presentación de la petición de eliminación. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| ejecutor_id | FK/uuid/opcional | Cuenta de quien ejecuta la petición de eliminación autorizada. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| ejecutada_en | instante/opcional | Fecha y hora de ejecución de la petición, cuando realmente se haya realizado el procedimiento autorizado. El modelo admite dejarlo vacío. |
| referencias_historicas_ref | texto/opcional | Referencia a la resolución de los vínculos históricos tras la eliminación, incluida la anonimización que se apruebe. El modelo admite dejarlo vacío. |

**Reglas del modelo.** Solo petición verificada del propio profesional. Conservar fichas e historial; anonimización, retiro de vínculos y referencia histórica requieren diseño. Ningún borrado en cascada aprobado.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R05; ADR-011; CU-31.

## Relaciones de esta lámina, incluidas las referencias externas

- TRANSICION_PROFESIONAL.profesional_id: cada registro debe referir a exactamente un registro de PROFESIONAL_GLOBAL. Como padre, cada registro de PROFESIONAL_GLOBAL puede ser referido por cero, uno o varios registros de TRANSICION_PROFESIONAL mediante ese campo. Destino en carpeta 04-profesionales-e-incorporacion. excepción validada.
- TRANSICION_PROFESIONAL.entidad_origen_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de TRANSICION_PROFESIONAL mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. excepción validada.
- TRANSICION_PROFESIONAL.entidad_destino_id: cada registro puede no referir a ninguno o referir a un solo registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de TRANSICION_PROFESIONAL mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. excepción validada.
- TRANSICION_PROFESIONAL.operador_id: cada registro debe referir a exactamente un registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de TRANSICION_PROFESIONAL mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. excepción validada.
- CORRESPONDENCIA_FICHAJE.transicion_id: cada registro debe referir a exactamente un registro de TRANSICION_PROFESIONAL. Como padre, cada registro de TRANSICION_PROFESIONAL puede ser referido por cero, uno o varios registros de CORRESPONDENCIA_FICHAJE mediante ese campo. Destino en carpeta 15-continuidad-del-fichaje. excepción validada.
- CORRESPONDENCIA_FICHAJE.vinculo_origen_id: cada registro debe referir a exactamente un registro de PACIENTE_PROFESIONAL. Como padre, cada registro de PACIENTE_PROFESIONAL puede ser referido por cero, uno o varios registros de CORRESPONDENCIA_FICHAJE mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. excepción validada.
- CORRESPONDENCIA_FICHAJE.vinculo_destino_id: cada registro puede no referir a ninguno o referir a un solo registro de PACIENTE_PROFESIONAL. Como padre, cada registro de PACIENTE_PROFESIONAL puede ser referido por cero, uno o varios registros de CORRESPONDENCIA_FICHAJE mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. excepción validada.
- PETICION_ELIMINACION.profesional_id: cada registro debe referir a exactamente un registro de PROFESIONAL_GLOBAL. Como padre, cada registro de PROFESIONAL_GLOBAL puede ser referido por cero, uno o varios registros de PETICION_ELIMINACION mediante ese campo. Destino en carpeta 04-profesionales-e-incorporacion. ID global restringido.
- PETICION_ELIMINACION.solicitante_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de PETICION_ELIMINACION mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- PETICION_ELIMINACION.ejecutor_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de PETICION_ELIMINACION mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
