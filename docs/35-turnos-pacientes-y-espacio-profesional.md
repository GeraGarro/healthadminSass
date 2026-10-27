# Turnos, identidad de pacientes y espacio profesional

Fecha: 27/10/2026. Continúa el [rediseño de roles del documento 34](34-rediseno-roles-institucion-y-secretaria.md). El alcance vigente se registra en [PRODUCT.md](../PRODUCT.md); el cambio visual autorizado, en [DESIGN.md](../DESIGN.md).

## Identidad y duplicados

La identidad documental es global; las fichas administrativas y las relaciones con profesionales pertenecen a cada institución. No se crean personas globales distintas por atenderse en dos instituciones. Tampoco se comparte una ficha de atención entre instituciones.

Para DNI argentino se normalizan los dígitos y se calcula una huella HMAC-SHA256 de `AR:DNI:<documento>`. `identidad_paciente_global` conserva únicamente UUID, huella única y fecha de creación. No incluye nombres, contactos, instituciones ni información de atención. El servicio usa `app.encryption-key`; esa clave debe mantenerse estable. Su rotación requiere una migración coordinada de huellas, además del procedimiento de cifrado existente.

Cada `paciente` institucional referencia esa identidad. Un índice único impide dos fichas nuevas con la misma identidad en una institución, y un bloqueo transaccional evita altas simultáneas por el mismo DNI. Las relaciones `paciente_profesional` conservan su numeración y se reutilizan al vincular nuevamente. La unicidad es una garantía de base de datos, además de la detección en formulario. Véase [restricciones de PostgreSQL](https://www.postgresql.org/docs/18/ddl-constraints.html).

El costo principal de duplicar pacientes no es el almacenamiento: son las fichas contradictorias, búsquedas incompletas, avisos repetidos y estadísticas fragmentadas. Mantener registros institucionales separados sigue siendo necesario para delimitar permisos y datos propios. No se fusionan automáticamente registros históricos ni coincidencias por nombre. Los registros antiguos adquieren identidad al reutilizar su DNI; si hay varias fichas locales con ese DNI, el flujo detiene la vinculación y pide revisión administrativa.

La búsqueda de coincidencias de una agenda requiere `booking:create` y devuelve solamente ID, nombre, apellido y estado del vínculo de fichas de la institución actual. No revela si ese DNI existe en otra institución. Al dar de alta en otra institución se completa una ficha local y el servidor reutiliza la identidad mínima global, sin copiar contactos ni atención.

## Pacientes dentro del turno

Elegir una celda conserva profesional, agenda y horario. El formulario ofrece «Paciente registrado» y «Nuevo paciente». El selector de registrados incluye todos los pacientes vinculados al profesional, mediante paginación completa; buscar por nombre, apellido, DNI o número limita esa lista. Nunca usa el directorio profesional como fuente de pacientes.

El alta desde el turno exige nombre, apellido, DNI, correo, celular con código internacional y domicilio. Primero se puede verificar el DNI: una ficha local existente se selecciona o vincula, incluso cuando pertenece a otro profesional. Registrar crea el vínculo al profesional de la agenda; todavía hace falta elegir disponibilidad y registrar el turno. El checkbox de contactos y autorización de avisos es independiente de los seis campos obligatorios. Sin autorización, los contactos se guardan, pero no se habilitan destinos de avisos.

Cerrar el panel conserva un borrador solo en memoria y en el mismo contexto: opción de paciente, seis datos de alta y datos del turno. Al recuperarlo se reconsulta el DNI del alta incompleta y la disponibilidad cuando ya hay paciente seleccionado. No conserva una reserva ni da por válida una coincidencia anterior. Descartar lo elimina; también se borra al salir, cambiar entidad/rol/cuenta, vencer la sesión o recargar. No se escribe en almacenamiento persistente del navegador.

Endpoints usados por el flujo, bajo `/api/v1`:

- `GET /entities/{tenant}/agendas/{agenda}/booking-patients` (búsqueda paginada; el cliente recorre todas las páginas).
- `GET /entities/{tenant}/agendas/{agenda}/patient-match?document=...`
- `POST /entities/{tenant}/agendas/{agenda}/booking-patients`
- `POST /entities/{tenant}/agendas/{agenda}/booking-patients/{patient}/link`

## Espacio profesional

El inicio muestra la agenda propia con próximos turnos y cancelados de la fecha seleccionada. Las rutas `/actividad` y `/aranceles` ofrecen actividad por período y aranceles de referencia versionados por prestación. Se cuentan como atendidos solo los turnos registrados con recepción `FINALIZADO`; que haya pasado su hora no demuestra atención. Los turnos `ATENCION` o `FINALIZADO` no se presentan como próximos.

Los importes admiten ARS y USD y conservan versiones en `arancel_prestacion`. No registran pagos, facturación ni comprobantes. La consulta y edición requieren titularidad de la agenda.

El titular independiente conserva rol profesional y recibe facultades de administración y atención únicamente en su entidad independiente activa. La comprobación incluye explícitamente el tenant seleccionado, la cuenta profesional, su vínculo y membresía vigentes. No amplía sus facultades en otras instituciones. «Mi personal» abre el listado de perfiles y permite incorporar secretaría. El profesional puede registrar turnos y estados de recepción sin depender de un secretario. El administrador institucional continúa separado de la atención y sin acceso a pacientes.

## Cancelación por período

El titular puede previsualizar y cancelar un día, una semana de lunes a domingo o un mes calendario, según la zona horaria de su agenda. Debe indicar motivo y confirmar los efectos mostrados. Se cancelan turnos registrados cuyo inicio todavía es futuro; se conservan horarios ya iniciados y estados explícitos `ATENCION` o `FINALIZADO`, incluso si se registraron antes de la hora prevista.

Una transacción crea la suspensión del intervalo, libera reservas provisorias del período, cancela los turnos afectados y crea casos `PENDIENTE` de reasignación. Una clave de idempotencia evita repetir la operación; si cambia la cantidad previsualizada, se exige volver a revisar. Solo el titular puede cancelar períodos; una delegación de reprogramación no otorga esa facultad.

Se registran avisos internos urgentes para miembros con acceso delegado de lectura a esa agenda y tareas externas por correo y WhatsApp para los pacientes afectados. La campana y la bandeja destacan el aviso urgente en rojo, con texto explícito. Las tareas externas requieren destinos autorizados y canales configurados; pueden reintentarse desde seguimiento de envíos. «Registrado» no significa «entregado». El entorno local usa entrega simulada y no prueba envío real a proveedores.

Endpoints adicionales, relativos a la agenda:

- `GET /activity?from=...&until=...` (`until` exclusivo en API, fechas inclusivas en interfaz).
- `GET /fees` y `PUT /fees`.
- `GET /period-cancellation?date=...&period=day|week|month`.
- `POST /period-cancellation` con `Idempotency-Key`.

## Calendarios y verificación

La paleta compartida distingue gris azulado para horario pasado, azul para próximo, azul petróleo con contorno para hora prevista actual, petróleo con texto blanco para atención, ámbar para espera y verde para atención finalizada. Las vistas Día, Semana, Mes y Lista usan los mismos estados. Las etiquetas textuales acompañan los colores. La línea roja indica la hora actual; no modifica el estado de recepción. Los colores de identidad profesional permanecen en avatares y selectores, separados de tiempo, recepción y asistencia.

Evidencia y comandos:

- [Cierre documental y evidencia](../.impeccable/review/calendar-evolution/documentation.md): capturas en 1440, 1343 y 390 px, recorridos en `checks.json`, revisión visual, detector existente y resultados confirmados de compilación y pruebas.
- `npm test` y `npm run build` en `salud-web`.
- `./mvnw.cmd verify` con Java 21 y Docker en `salud-api`, contra PostgreSQL aislado de Testcontainers.
- `node salud-web/scripts/verify-calendar-evolution.mjs` usa `ROLE_TEST_URL` de loopback (predeterminado 4393), Edge y Playwright mediante `PLAYWRIGHT_MODULE`. Opera solo sobre demostración ficticia.
- `verify-role-server.mjs` comprueba con la fixture existente y sin cambios de negocio la administración institucional en el servidor local.

La migración `V12__patient_identity_and_professional_fees.sql` añade identidad mínima global, índices y aranceles con aislamiento por tenant. No borra pacientes ni deduplica retrospectivamente. El veredicto visual final y el cierre de documentación se conservan junto con la evidencia de esta entrega.
