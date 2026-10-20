# ADR-015 Identificadores internos UUID versión 7

Fecha: 17 de octubre de 2026. Estado: decisión aceptada por el responsable para la documentación y la futura implementación. No implementada en tablas de negocio.

## Contexto

El modelo lógico dejaba abierto el tipo ID entre UUID y entero. El responsable solicita adoptar UUID versión 7 para los identificadores internos y conservar números enteros para la numeración visible de pacientes. El sistema atiende a varias entidades con fichas locales y cuenta reutilizable, según ADR-001 y el modelo ER. PostgreSQL 18, elegido en ADR-014, dispone del tipo nativo `uuid` y de la función `uuidv7()`.

## Decisión

### Tipo y generación

- Todas las claves primarias internas `id` del modelo ER serán UUID versión 7, incluidas las tablas puente que ya tienen ID propio. Las referencias a esas claves, incluido `tenant_id`, usarán el mismo tipo PostgreSQL `uuid`; no texto ni entero. No se convierten códigos de catálogo, números de versión, contadores ni identificadores de proveedores externos en UUID.
- La base de datos generará el ID de cada nuevo registro mediante `DEFAULT uuidv7()`. El servidor recuperará el valor asignado dentro de la operación de inserción. Esta es la estrategia ordinaria única para evitar diferencias entre módulos; la configuración concreta de persistencia se resolverá y verificará al implementar.
- Las FK copiarán el UUID del registro al que apuntan. No generarán un UUID nuevo ni tendrán `DEFAULT uuidv7()`. En particular, `tenant_id` se obtiene del contexto autorizado de la entidad existente, nunca de un generador de IDs.
- Java representará el valor como `java.util.UUID`. API JSON y frontend lo tratarán como cadena en formato UUID con guiones, sin convertirlo a número. No usar un generador aleatorio UUIDv4 por defecto del framework para implementar esta decisión.
- En las altas ordinarias el servidor controla los IDs; el formulario no los elige. Una importación con conservación de IDs necesita un procedimiento explícito que valide formato, versión, unicidad, referencias y ámbito. No se habilita esa función por esta decisión.

### Estabilidad e integridad

El ID se asigna una vez, es inmutable y no se reutiliza para otro registro. Una reactivación conserva el ID original. Las PK y restricciones de unicidad de la base siguen siendo obligatorias: la baja probabilidad de colisión del generador no sustituye estas garantías.

Se conserva `PK(id)` y, en tablas de entidad, `UQ(tenant_id,id)`. Una referencia local usa `FK(tenant_id,campo_id)` a `(tenant_id,id)` para impedir relaciones entre entidades. Las demás unicidades funcionales del modelo siguen vigentes. Tener IDs únicos no crea una ficha global del paciente ni autoriza fusionar fichas por coincidencias de datos.

### Numeración visible del paciente

`PACIENTE_PROFESIONAL.numero_visible` continúa siendo un entero positivo, independiente del UUID. Su serie pertenece a `(tenant_id,profesional_id)` y es común a las agendas locales de ese profesional. Dos profesionales pueden tener cada uno un paciente 125. Un profesional en dos entidades mantiene dos series.

Se conserva la asignación transaccional y serializada del contador, junto al alta efectiva del vínculo, y la unicidad `(tenant_id,profesional_id,numero_visible)`. No obtener el número a partir del UUID, de `COUNT`, ni de `MAX` sin serialización. La baja del 12 no renumera al 13; el 12 no se reutiliza y se conserva al reactivar el vínculo original. El número visible no es el DNI ni una credencial.

Las pantallas y los reportes habituales mostrarán el número visible con el contexto del profesional y la entidad, más los datos permitidos para reconocer al paciente. El UUID se reserva para referencias técnicas, integraciones autorizadas y diagnóstico cuando corresponda.

### Acceso y tiempo

El UUID identifica un recurso; cada operación valida entidad, membresía y facultades vigentes en el servidor, con RLS como barrera adicional. Ni un UUID ni el número visible conceden acceso. Los enlaces de recuperación o confirmación usan sus propios tokens secretos, con propósito y vencimiento; no se sustituyen por el UUID del registro.

UUIDv7 incorpora información temporal y no es un secreto. Se mantienen campos explícitos como `creado_en` y el historial de auditoría. La fecha extraíble del UUID no sustituye esos campos ni garantiza el orden de confirmación de transacciones concurrentes.

## Consecuencias

La política uniforme facilita identificar registros en futuras integraciones y evita coordinar series numéricas internas entre sistemas. UUIDv7 ofrece ordenación temporal; UUID ocupa 16 bytes, frente a los 8 de `bigint`, por lo que claves e índices requieren más espacio. Esta elección no exige distribuir la aplicación ni compartir datos entre entidades.

El tipo deja de ser una decisión pendiente. Tablas, campos nuevos y demás mecanismos propuestos del modelo mantienen su estado de revisión. No se crean migraciones, módulos de negocio ni cambios de permisos en esta actualización documental.

## Verificación al implementar

Comprobar con PostgreSQL real que las altas generan UUIDv7, las FK conservan los IDs de sus padres y se rechazan duplicados y cruces de entidad. Verificar el recorrido Java, JSON y frontend sin pérdida de valor, el control de acceso aunque se conozca un UUID y la numeración concurrente por serie sin reutilizar números. Estos criterios están pendientes de ejecución sobre la futura implementación; la verificación documental no acredita su cumplimiento funcional.

## Fuentes

- [ADR-001 Aislamiento y numeración](001-aislamiento-y-numeracion-pacientes.md).
- [ADR-014 Base técnica del servidor](014-base-tecnica-servidor.md).
- [Modelo entidad relación](../../23-modelo-entidad-relacion.md).
- [PostgreSQL 18 Tipo UUID](https://www.postgresql.org/docs/18/datatype-uuid.html).
- [PostgreSQL 18 Generación y extracción UUID](https://www.postgresql.org/docs/18/functions-uuid.html).
- [OWASP Prevención de referencias directas sin autorización](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html).

Las fuentes técnicas se consultaron para la recomendación adoptada en esta conversación. No convierten el resto del modelo propuesto en un esquema aprobado.
