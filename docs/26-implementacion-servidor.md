# Implementación del servidor — 20/10/2026

La solicitud de desarrollar servidor y base habilita la implementación funcional que
el documento 25 describía como futura. El manual y la documentación histórica conservan
su fecha; este documento y `salud-api/README.md` describen el código actual.

## Entrega

Se mantiene Java 21/Spring Boot/PostgreSQL 18.6 y monolito por capacidades. V1–V8
materializan las 88 entidades del modelo, más tablas técnicas de throttle y entrega
de identidad. Las referencias locales incluyen tenant, RLS está forzado y el runtime
carece de DDL/BYPASSRLS. Las tablas de funciones pendientes conservan acceso denegado.

Implementado: credencial local, invitación/activación y recuperación, sesión revocable,
MFA TOTP, vinculación opcional de Google, incorporación de entidades, membresías y
delegaciones, ficha administrativa, admisión y representación verificadas, numeración
estable concurrente, catálogo y oferta versionados, horarios, cobertura/convenio,
disponibilidad, pre-reserva, registro, confirmación, cancelación, reprogramación,
ausencia profesional, gestión asistida, tareas durables, callbacks firmados, chat con
participantes, bandejas, auditoría y reportes PDF/XLSX/CSV.

Operación: bootstrap local con datos ficticios, prueba HTTP reproducible, JAR, Dockerfile
sin usuario privilegiado, Compose de producción con proxy TLS y red privada, migrador
separado de runtime, scripts de respaldo y restauración aislada.

## Decisiones técnicas para poder probar

No sustituyen aprobaciones de producto. Permisos concretos se conceden explícitamente;
un rol nominal o una celda pendiente no se convierte en permiso general. La administración
inicial obtiene facultades administrativas identificadas, pero no acceso a agenda/chat.

Política por entidad: TTL, cuota y autorización de cierre se versionan con referencia
de aprobación. Demo usa TTL=5 min y cuota=3. Consulta se identifica por origen/base,
no por el nombre editable. Correo a T-60 dentro de la ventana aceptada; intentos y
plazos de workers documentados en README. Cierre no habilitado por defecto: sin
política, evidencia de entrega o ejecución oportuna conserva turno y genera revisión.
Turnos cercanos se gestionan asistidamente. No hay conversión silenciosa de cobertura.

Sesión HTTP de una instancia y revocación absoluta en BD; reiniciar fuerza nuevo login.
La coordinación global usa funciones restringidas y locks por identidad profesional,
sin instalar extensiones ni conceder consulta general de ocupaciones. La disponibilidad
es orientativa hasta adquirir la pre-reserva. Mover un turno libera/adquiere en la misma
transacción; fallar revierte la liberación. Se conserva historial y la numeración.

## Trazabilidad práctica

| Reglas | Evidencia del código |
| --- | --- |
| R01/R01.a | Migraciones V2/V3/V5, RLS, FK compuestas, contador transaccional |
| R02/R02.a/R03 | Hold persistido, idempotencia, cuota con confirmados, locks globales |
| R04 | Delegación explícita por acción; revocación inmediata en siguiente operación |
| R05 | Revocar membresía no elimina identidad/fichas; bloqueo ante turnos futuros |
| R06/R07 | Consulta base exclusiva, oferta versionada, horarios y elegibilidad |
| R08 | Asistencia independiente, cronograma durable y revisión de excepciones |
| R09/R09.a | Representación verificada, admisión y activación separadas de login |
| R10/R10.a | Plataforma acotada, alta por invitación, recuperación sin reactivar permisos |
| R11/R11.a/R11.b | Gateway, chat autorizado y WhatsApp de ausencia para confirmados/pendientes |
| R12 | Eventos, auditoría solo agregable, correlación y registro mínimo de rechazos |

## Validación y límites

Verificación ejecutada el 20/10/2026:

| Comprobación | Resultado |
| --- | --- |
| Maven `verify` | 40 pruebas, 0 fallos, 0 errores: 12 de seguridad/reportes/TOTP y 28 de integración |
| PostgreSQL 18.6 | V1–V8 aplicadas y validadas; 88 tablas del modelo, 2 técnicas nuevas y el historial Flyway |
| API local por HTTP | Login, CSRF, contexto, ficha propia, pre-reserva, registro, confirmación, consulta y cancelación correctos |
| Imagen Docker | Construida desde el JAR probado |
| Job Docker `bootstrap` | Validación de migraciones y salida con código 0 |
| Contenedor `production` | Readiness UP; usuario 10001:10001, filesystem de solo lectura, sin secretos de migración/bootstrap |
| Respaldo y restauración | Dump local restaurado en contenedor aislado: 91 tablas y 0 restricciones sin validar |

SHA-256 del JAR verificado:
`3E9D07E5F1F5A376EBCA1317CF41BCEEB3715173132B4E58664840632FAE7F93`.
No equivale a firma de publicación; recompilar puede producir otro hash. Los ensayos
usan datos ficticios; el contenedor de comprobación productiva y el de restauración
se eliminaron al terminar, conservando la base local del proyecto.

La suite ejecuta PostgreSQL real con Testcontainers: migraciones/roles/RLS/FK/UUIDv7,
concurrencia entre entidades, cuota, idempotencia, expiración, rollback de reprogramación,
revocación, activación, recuperación, CSRF/sesión, replay MFA, TOTP según RFC 6238,
chat, reanudación por lease, callback firmado/deduplicado y reportes reales.
Los resultados reproducibles se registran en `salud-api/target/surefire-reports` y
`failsafe-reports` y se regeneran con `mvnw clean verify`.

No se envió correo/WhatsApp real ni se verificó un cliente Google contratado. El gateway
tiene contrato implementado y Google valida tokens firmados, pero requieren credenciales,
proveedores y pruebas externas. No hay despliegue público ni frontend terminado.

Conservan esquema, sin comandos habilitados: transición entre entidades/importación
de fichaje, eliminación solicitada, soporte excepcional y recursos de capacidad múltiple.
Se necesitan D02/D04/D08/D12/D16 y procedimientos concretos para sus variantes; no se
resuelven inventando movimientos de datos o acceso administrativo universal.
Presupuestos facturables, suscripciones y otras exclusiones comerciales siguen diferidos.

Para datos reales todavía corresponde aprobar parámetros, verificar destinatarios y
representantes, probar remitentes/proveedores, revisar recuperación de MFA, fijar
imágenes/secretos/retención, medir carga y acordar RPO/RTO. El Compose prepara el
despliegue; no acredita por sí solo el cumplimiento integral S01–S16 ni capacidad de un VPS.

Guías: [arranque y producción](../salud-api/README.md), [contratos API](../salud-api/docs/API.md).
