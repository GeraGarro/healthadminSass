# 12. Canales y destinatarios

18 de octubre de 2026

Antes de enviar, identifique desde qué cuenta se comunica la entidad, a quién puede hacerlo y qué límites técnicos de consumo tiene.

**Ejemplo de conjunto.** Clínica Norte configura su canal y autoriza un destino para Lucía según propósito. El presupuesto controla la operación y el consumo registra mediciones del costo de los intentos.

**Recorrido.** CANAL_ENTIDAD + DESTINO_AVISO > envío autorizado; PRESUPUESTO_CANAL controla el período; CONSUMO_CANAL referencia INTENTO_ENVIO, de la siguiente lámina.

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

## 1. CANAL_ENTIDAD: Servicio y remitente de avisos de una clínica

Configura el medio de envío y la cuenta de proveedor verificada que utiliza una entidad para sus comunicaciones.

**Ejemplo ficticio.** Clínica Norte configura su remitente de correo y su cuenta autorizada para WhatsApp, según lo que se habilite.

**Cómo distinguirlo.** Se diferencia del canal global de recuperación de cuentas. Los eventos del proveedor deben correlacionarse con la cuenta verificada; no se confía en un tenant declarado sin comprobar.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| canal | enum/obligatorio | Medio de comunicación, como correo o WhatsApp dentro del alcance que se habilite. Se diferencia del proveedor que lo presta. |
| proveedor | texto/obligatorio | Servicio externo utilizado para enviar los mensajes del canal. |
| cuenta_externa | texto/obligatorio | Identificador de la cuenta del proveedor de comunicaciones utilizada por la entidad. No es una CUENTA de usuario de esta aplicación. |
| remitente | texto/obligatorio | Dirección o identidad desde la que la plataforma o la entidad envía los mensajes. |
| secreto_ref | secreto/obligatorio | Referencia protegida a la credencial del servicio de envío. No debe exponerse una clave de proveedor en pantallas, diagramas ni registros de operación. |
| verificada_en | instante/opcional | Fecha y hora en que se verificó la configuración o cuenta del canal de comunicación. El modelo admite dejarlo vacío. |
| estado | enum/obligatorio | Situación de este objeto dentro de su propio ciclo de vida. La lista completa de valores y transiciones debe revisarse; no se deduce del estado de otras tablas. |

**Reglas del modelo.** Credencial solo referencia al almacén seguro. Correlación de webhooks por cuenta verificada, nunca por tenant recibido sin comprobar.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R11; docs/04.

## 2. DESTINO_AVISO: Destinatario autorizado para cierto mensaje de un paciente

Relaciona paciente, contacto y eventual cuenta o representación con un canal y propósito autorizados. Delimita a quién corresponde enviar un aviso.

**Ejemplo ficticio.** Se autoriza enviar el aviso de una cita de Lucía a un contacto verificado que corresponde al propósito.

**Cómo distinguirlo.** Tener un contacto en la ficha no autoriza todos los mensajes. La autorización se revalida al enviar y recibir un aviso no concede acceso al portal.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| paciente_id | FK/uuid/obligatorio | Ficha administrativa local del paciente involucrado. Destino: PACIENTE, ficha administrativa de un paciente en una clínica. Cada registro requiere exactamente un destino válido. |
| contacto_id | FK/uuid/obligatorio | Medio de contacto registrado para el mismo paciente. Destino: CONTACTO_PACIENTE, teléfono o correo registrado para contactar al paciente. Cada registro requiere exactamente un destino válido. |
| cuenta_destinataria_id | FK/uuid/opcional | Cuenta autorizada que corresponde al destinatario del aviso. Destino: CUENTA, usuario personal del sistema. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| representacion_id | FK/uuid/opcional | Vínculo verificado que permite actuar por el paciente, cuando corresponde. Destino: REPRESENTACION, vínculo verificado para actuar por un paciente. La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde. |
| canal | enum/obligatorio | Medio de comunicación, como correo o WhatsApp dentro del alcance que se habilite. Se diferencia del proveedor que lo presta. |
| proposito | enum/obligatorio | Finalidad para la cual se autoriza ese contacto como destinatario. Debe revalidarse antes de enviar un aviso. |
| autorizacion_ref | texto/obligatorio | Referencia a la autorización que permite el envío o la transición excepcional según el contexto. |
| desde | instante/obligatorio | Inicio de la vigencia de esta relación, configuración o autorización. |
| hasta | instante/opcional | Fin de la vigencia, si está definido. Estar vacío no evita otras comprobaciones de estado, revocación o contexto. |
| revocado_en | instante/opcional | Fecha y hora en que se dejó sin efecto este factor, token o autorización. Su ausencia no sustituye las demás verificaciones de vigencia. |

**Reglas del modelo.** Contacto pertenece al paciente. Representación, si presente, coincide con paciente y cuenta. Autorización y contacto se revalidan al enviar; recepción no concede portal.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R09 R11; S09.

## 3. PRESUPUESTO_CANAL: Límite operativo del gasto en comunicaciones

Registra un período, moneda, límite técnico, umbral de alerta y política de continuidad para un canal de una entidad.

**Ejemplo ficticio.** Clínica Norte fija un límite técnico de consumo y una alerta antes de alcanzarlo, con valores aún por acordar.

**Cómo distinguirlo.** Es un control operativo del canal. No representa una suscripción ni una cuota facturada; agotarlo no cancela turnos ni cierra el portal automáticamente.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| canal_id | FK/uuid/obligatorio | Configuración de envío que corresponde al tipo de comunicación de esta tabla. Destino: CANAL_ENTIDAD, servicio y remitente de avisos de una clínica. Cada registro requiere exactamente un destino válido. |
| periodo_inicio | instante/obligatorio | Comienzo del período al que se aplica el presupuesto técnico del canal. |
| periodo_fin | instante/obligatorio | Final del período de presupuesto del canal. |
| moneda | texto/obligatorio | Moneda en la que se expresa el límite o importe; permite interpretar correctamente la medición. |
| limite_tecnico | decimal/obligatorio | Tope operativo de consumo del canal para el período. Los valores exactos requieren acuerdo y no representan una cuota facturada. |
| umbral_alerta | decimal/obligatorio | Nivel de consumo a partir del cual debe advertirse sobre la proximidad del límite, según la política aprobada. |
| politica_continuidad | texto/obligatorio | Definición de cómo continuar operando ante límites o fallos del canal. Agotar presupuesto no cancela citas ni cierra el portal por sí solo. |

**Reglas del modelo.** No es cuota facturada ni suscripción; agotamiento no cancela turnos ni cierra portal.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R11; docs/04; D09 D15.

## 4. CONSUMO_CANAL: Costo técnico de un intento de comunicación

Guarda una medición estimada o conciliada del consumo asociado a un intento de envío, su moneda y referencia de tarifa.

**Ejemplo ficticio.** Un intento de WhatsApp tiene un costo estimado y luego se concilia con el proveedor.

**Cómo distinguirlo.** Estimación y conciliación representan dos mediciones del mismo hecho. No deben sumarse como si fueran dos cargos independientes. El detalle de tarifas no queda aprobado por el ejemplo.

| Campo | Tipo / condición | Explicación |
| --- | --- | --- |
| tenant_id | FK/uuid/obligatorio | Entidad propietaria de este registro y límite de aislamiento de sus datos. Destino: ENTIDAD, clínica o actividad independiente que usa el sistema. Cada registro requiere exactamente un destino válido. |
| id | PK/uuid/obligatorio | Identificador interno único e inmutable de este registro. Es UUIDv7; PostgreSQL lo genera para la clave primaria. Conocerlo no concede acceso. |
| intento_id | FK/uuid/obligatorio | Ejecución técnica de envío con la que se correlaciona el costo o evento. Destino: INTENTO_ENVIO, ejecución concreta de envío de un aviso. Cada registro requiere exactamente un destino válido. |
| moneda | texto/obligatorio | Moneda en la que se expresa el límite o importe; permite interpretar correctamente la medición. |
| importe | decimal/obligatorio | Monto de consumo asociado a la medición de un intento, interpretado con moneda y tipo de medición. |
| tipo_medicion | enum/obligatorio | Distingue una estimación de una conciliación del consumo para evitar contarlas como cargos separados. |
| tarifa_version_ref | texto/obligatorio | Referencia a la versión de tarifa utilizada para estimar o conciliar el costo técnico. |
| registrado_en | instante/obligatorio | Fecha y hora en que se registró la medición del consumo. |

**Reglas del modelo.** Estimación y conciliación se distinguen; no sumar ambas como dos cargos del mismo intento.

**Estado.** Propuesta lógica de requisito vigente. **Fuentes.** R11; docs/04.

## Relaciones de esta lámina, incluidas las referencias externas

- CANAL_ENTIDAD.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de CANAL_ENTIDAD mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- DESTINO_AVISO.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de DESTINO_AVISO mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- DESTINO_AVISO.paciente_id: cada registro debe referir a exactamente un registro de PACIENTE. Como padre, cada registro de PACIENTE puede ser referido por cero, uno o varios registros de DESTINO_AVISO mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- DESTINO_AVISO.contacto_id: cada registro debe referir a exactamente un registro de CONTACTO_PACIENTE. Como padre, cada registro de CONTACTO_PACIENTE puede ser referido por cero, uno o varios registros de DESTINO_AVISO mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- DESTINO_AVISO.cuenta_destinataria_id: cada registro puede no referir a ninguno o referir a un solo registro de CUENTA. Como padre, cada registro de CUENTA puede ser referido por cero, uno o varios registros de DESTINO_AVISO mediante ese campo. Destino en carpeta 01-identidad-y-credenciales-parte-1. ID global restringido.
- DESTINO_AVISO.representacion_id: cada registro puede no referir a ninguno o referir a un solo registro de REPRESENTACION. Como padre, cada registro de REPRESENTACION puede ser referido por cero, uno o varios registros de DESTINO_AVISO mediante ese campo. Destino en carpeta 05-ficha-y-acceso-del-paciente-parte-1. compuesta tenant_id + id.
- PRESUPUESTO_CANAL.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de PRESUPUESTO_CANAL mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- PRESUPUESTO_CANAL.canal_id: cada registro debe referir a exactamente un registro de CANAL_ENTIDAD. Como padre, cada registro de CANAL_ENTIDAD puede ser referido por cero, uno o varios registros de PRESUPUESTO_CANAL mediante ese campo. Destino en carpeta 12-canales-y-destinatarios. compuesta tenant_id + id.
- CONSUMO_CANAL.tenant_id: cada registro debe referir a exactamente un registro de ENTIDAD. Como padre, cada registro de ENTIDAD puede ser referido por cero, uno o varios registros de CONSUMO_CANAL mediante ese campo. Destino en carpeta 03-organizacion-y-permisos. ID global restringido.
- CONSUMO_CANAL.intento_id: cada registro debe referir a exactamente un registro de INTENTO_ENVIO. Como padre, cada registro de INTENTO_ENVIO puede ser referido por cero, uno o varios registros de CONSUMO_CANAL mediante ese campo. Destino en carpeta 13-avisos-y-entrega. compuesta tenant_id + id.

## Fuentes y estado

Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.

Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.
