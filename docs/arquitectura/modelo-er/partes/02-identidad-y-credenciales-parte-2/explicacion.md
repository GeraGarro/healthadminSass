# 02. Identidad y credenciales, parte 2

18 de octubre de 2026

Continúe con los trabajos de recuperación y verificación. La primera parte define el usuario y la autorización temporal; esta lámina muestra cómo se organiza y registra el envío.

**Ejemplo de conjunto.** Una tarea guardada enlaza el token de Ana con el canal de plataforma. Si el servicio falla, se conserva cada intento sin crear otra cuenta ni conceder nuevas facultades.

**Recorrido.** TOKEN_IDENTIDAD y CANAL_IDENTIDAD, en la parte 1 > TAREA_IDENTIDAD > uno o varios ENVIO_IDENTIDAD.

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

## 1. TAREA_IDENTIDAD: Trabajo pendiente de enviar un correo de acceso

Representa una tarea guardada para ejecutar la recuperación o verificación, con programación, estado e intentos. Conecta el token que autoriza la acción con el canal que enviará el mensaje.

**Ejemplo ficticio.** Se guarda una tarea para enviar a Ana el enlace de recuperación. Un proceso de trabajo la recoge y registra cada intento de envío.

**Cómo distinguirlo.** La tarea es el trabajo lógico que debe hacerse. ENVIO_IDENTIDAD registra cada ejecución técnica. Guardarla permite retomar el trabajo tras una interrupción sin depender de una pantalla abierta.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| token_id | FK/uuid/obligatorio | Token de identidad que autoriza la acción de recuperación, verificación o invitación. Destino: TOKEN_IDENTIDAD, autorización temporal para una acción de acceso. Cada registro requiere exactamente un destino válido. |
| canal_id | FK/uuid/obligatorio | Configuración de envío que corresponde al tipo de comunicación de esta tabla. Destino: CANAL_IDENTIDAD, servicio y remitente de correos de acceso. Cada registro requiere exactamente un destino válido. |
| tipo | enum/obligatorio | Clase de registro o mecanismo dentro de esta tabla. Sus opciones y significado se interpretan según la entidad, no como un catálogo común a todo el modelo. |
| clave_logica | texto/obligatorio | Identificador del trabajo o aviso lógico utilizado para reconocerlo y evitar su duplicación según la restricción de unicidad. |
| programada_en | instante/obligatorio | Fecha y hora prevista para ejecutar el trabajo. Ejecutarlo exige revalidar que siga siendo aplicable. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| intentos | entero/obligatorio | Cantidad de ejecuciones o reintentos registrados para el trabajo. El detalle de cada ejecución se conserva en su tabla de intentos. |

**Reglas del modelo.** UQ(clave_logica). Sin datos de pacientes ni membresías; contenido mínimo y sin tokens en logs. Respuesta pública no revela cuenta.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R10.a; docs/20.

## 2. ENVIO_IDENTIDAD: Intento concreto de envío de un correo de acceso

Registra cada ejecución técnica de una tarea de identidad, su número, referencia del proveedor y posible fallo. Permite distinguir que un correo fue solicitado de que su envío se intentó.

**Ejemplo ficticio.** El primer intento falla por un problema temporal del proveedor y el segundo se acepta. Ambos pertenecen a la misma tarea.

**Cómo distinguirlo.** Un reintento crea otro intento técnico; no debería duplicar la cuenta ni conceder permisos nuevos. Antes de reenviar se revalidan el token y el presupuesto global.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| tarea_id | FK/uuid/obligatorio | Trabajo persistido que origina el intento o aviso. Destino: TAREA_IDENTIDAD, trabajo pendiente de enviar un correo de acceso. Cada registro requiere exactamente un destino válido. |
| numero | entero/obligatorio | Número de intento dentro de la tarea o aviso. Distingue el primero de los reintentos. |
| referencia_proveedor | texto/opcional | Identificador devuelto por el servicio externo para correlacionar el intento con su respuesta o eventos posteriores. El modelo admite dejarlo vacío. |
| iniciado_en | instante/obligatorio | Fecha y hora de inicio del intento técnico o del proceso documentado. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |
| error_codigo | texto/opcional | Código técnico del fallo observado. Permite seguimiento sin guardar secretos ni contenido sensible innecesario. El modelo admite dejarlo vacío. |

**Reglas del modelo.** UQ(tarea_id,numero). Se revalida token y presupuesto global; no reutiliza canal ni permisos de una entidad ajena.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R10.a; docs/20.

## Relaciones de esta lámina, incluidas las referencias externas

- TAREA_IDENTIDAD.token_id: cada registro debe referir a exactamente un registro de TOKEN_IDENTIDAD. Como padre, cada registro de TOKEN_IDENTIDAD puede ser referido por cero, uno o varios registros de TAREA_IDENTIDAD mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- TAREA_IDENTIDAD.canal_id: cada registro debe referir a exactamente un registro de CANAL_IDENTIDAD. Como padre, cada registro de CANAL_IDENTIDAD puede ser referido por cero, uno o varios registros de TAREA_IDENTIDAD mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- ENVIO_IDENTIDAD.tarea_id: cada registro debe referir a exactamente un registro de TAREA_IDENTIDAD. Como padre, cada registro de TAREA_IDENTIDAD puede ser referido por cero, uno o varios registros de ENVIO_IDENTIDAD mediante ese campo. Destino en carpeta 02-identidad-y-credenciales-parte-2. ID global restringido.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
