# ADR-001. Aislamiento por entidad y numeración de pacientes

Fecha: 14 de octubre de 2026. Reglas: R01.a, R03 y R12. Alcance: incremento 1, V1 beta.

**Estado:** aceptada la estrategia del inciso 5 y confirmado el requisito de numeración por profesional dentro de cada entidad. Los criterios de estabilidad y huecos y el mecanismo de contador eran recomendaciones de esta revisión; ADR-008 adopta esa dirección al consolidar el análisis, con SQL por especificar. SQL, políticas e infraestructura todavía no están implementados ni verificados.

## Contexto y autorización

El responsable aceptó la revisión del inciso 5 como parte del contrato de la aplicación y pidió actualizar la documentación. Declaró un objetivo inicial aproximado de 100 profesionales registrados y solicitó numeración de pacientes independiente por profesional, separada de los IDs internos. Al consultar el caso de profesionales en varias entidades, confirmó expresamente una serie por profesional dentro de cada entidad.

## Decisión aceptada

- PostgreSQL con tablas compartidas y `tenant_id` para datos de entidad; RLS agrega una barrera a la autorización del backend.
- Toda tabla se clasifica como global o de entidad. Las identidades pueden ser globales; membresías, fichas y datos operativos mantienen entidad y permisos propios.
- La entidad seleccionada se valida en el servidor contra identidad, membresía vigente y permisos. El cliente no puede otorgarse alcance modificando un parámetro.
- Restricciones de base impiden relaciones entre entidades. Consultas, tareas, archivos, exportaciones y cachés mantienen el mismo alcance.
- Rol ordinario sin superusuario, `BYPASSRLS` ni bypass efectivo por propiedad; conexiones privilegiadas separadas de solicitudes normales.
- Contexto de entidad establecido en cada transacción y conexión devuelta al pool después de confirmar o revertir; denegación sin contexto válido.
- Pruebas con el rol y el camino reales de la aplicación, incluidas escrituras, relaciones, reutilización de conexiones tras errores y cobertura de tablas nuevas.
- Se conserva la excepción mínima de R03 para coordinar capacidad global del profesional sin exponer fichas o detalles ajenos.

La aceptación obliga a demostrar el comportamiento antes de entregar beta. El contrato detallado está en [inciso 5](../../01-propuesta-v1.md#5-aislamiento-entre-entidades); este ADR registra la decisión, sin aprobar automáticamente el resto de la arquitectura.

## Numeración confirmada y criterio adoptado al consolidar

La serie pertenece a `(tenant_id, profesional_id)`. A y B pueden tener cada uno un paciente 1. Un profesional en dos entidades tiene dos series; sus agendas dentro de una misma entidad comparten serie. El número corresponde a la relación profesional-paciente, no al turno ni a una nueva copia de la ficha.

El `paciente_id` interno es único e inmutable en el sistema. El número visible no lo sustituye y solo es único dentro de su serie; no funciona como credencial ni como prueba de identidad.

Como criterio adoptado en ADR-008, asignar desde 1 al primer alta efectiva de la relación y conservar el número en nuevas visitas y reactivaciones. No reiniciar por año, renumerar ni reutilizar números confirmados. Los huecos por bajas o correcciones auditadas son admisibles bajo este criterio. El total de pacientes activos o históricos se calcula por consulta autorizada, independientemente del mayor número. Una exigencia estricta de ausencia de huecos requeriría revisión expresa.

**Confirmación expresa del responsable, 15 de octubre de 2026:** ante la consulta sobre desactivar al paciente 12 y conservar los números posteriores y el 12 para su eventual regreso, respondió: «que el paciente 12 deje de existir o suceda algun hecho con el mismo que deje de ser activo, no amerita que el paciente 13 y los consecuentes sean reasignados». Queda reafirmada la estabilidad: el 13 y los posteriores mantienen su número; el 12 no se reutiliza para otra persona y se conserva si se reactiva el vínculo original. Se admiten huecos entre los pacientes activos.

Esta confirmación trata la numeración ante una baja o inactividad; no decide por sí sola un borrado físico de fichas ni plazos de conservación. Ejemplo de aceptación: con los números 11, 12 y 13 ya confirmados y sin altas posteriores, desactivar al 12 deja activos al 11 y al 13; un nuevo vínculo recibe el 14 y reactivar al original conserva el 12. Los conteos se actualizan según estado sin renumerar.

Diseño recomendado para el modelo detallado:

- Relación con entidad, profesional, paciente y número positivo, todos obligatorios.
- Unicidad de `(tenant_id, profesional_id, numero_paciente_profesional)` y `(tenant_id, profesional_id, paciente_id)`.
- Claves foráneas compuestas o garantías equivalentes que impidan vincular ficha o profesional de otra entidad.
- Contador transaccional por serie y asignación serializada en una transacción breve junto al alta; resolver también creación concurrente del primer contador.
- Reintentos o altas simultáneas de una misma relación devuelven el vínculo existente, sin asignar otro número confirmado. No usar conteos ni máximos sin serialización para asignar números.
- El contador y los vínculos quedan sujetos al mismo aislamiento. No publicar números antes de confirmar la transacción. Restaurar contadores y vínculos de forma consistente; comprobar que la siguiente asignación no colisione con números confirmados.

La secuencialidad resulta útil como referencia operativa, pero hace predecibles los números; toda consulta sigue requiriendo autorización. Una secuencia PostgreSQL ordinaria no garantiza ausencia de huecos. No se ha fijado todavía el tipo concreto del ID interno ni el SQL definitivo.

## Alternativas y consecuencias

Base por entidad permite separar administración y recuperación cuando también se separan credenciales y rutas administrativas, con más costo operativo. Esquema por entidad exige permisos y migraciones por esquema. Tablas compartidas simplifican los cambios comunes, a cambio de controles rigurosos por fila y procedimientos específicos para recuperar una sola entidad sin afectar las demás.

La cantidad de profesionales apoya una estrategia inicial sencilla, pero no demuestra capacidad. El inciso 5.4 consolida las hipótesis del responsable: 20 a tres meses y hasta 100 profesionales al año, 100 vínculos por profesional y un turno mensual por vínculo; no equivalen a pacientes únicos ni a carga medida. Queda pendiente acordar retención, carga concurrente, tiempos de respuesta, almacenamiento y objetivos de recuperación. Revisar la estrategia ante evidencia operativa o necesidades de aislamiento distintas.

## Evidencia requerida

1. Operaciones permitidas dentro de una entidad funcionan; intentos cruzados de lectura, inserción, actualización, borrado o relación fallan con el rol real.
2. Contexto ausente, manipulado o heredado de una conexión reutilizada no permite acceso ajeno; incluir error y rollback.
3. Series independientes entre profesionales y entidades, y compartidas entre agendas del mismo profesional dentro de una entidad.
4. Altas concurrentes de pacientes distintos no duplican números; alta repetida o concurrente de la misma relación no la duplica.
5. Según el criterio adoptado, visitas posteriores y reactivaciones conservan número, las bajas no renumeran ni permiten reutilización y el total se calcula aparte.
6. Recuperación consistente de fichas, vínculos y contadores; pruebas de carga sintética con volumen y criterios acordados antes del piloto.

## Referencias

- [OWASP: seguridad multientidad](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html).
- [PostgreSQL: políticas por fila](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
- [PostgreSQL: restricciones](https://www.postgresql.org/docs/current/ddl-constraints.html).
- [PostgreSQL: secuencias y huecos](https://www.postgresql.org/docs/current/functions-sequence.html).
