# Salud API — servidor y PostgreSQL

Implementación administrativa del proyecto, desarrollada el 20/10/2026 sobre la base
Spring Boot 4.1.1, Java 21 y PostgreSQL 18.6. Incluye las 88 tablas del modelo E-R,
diez migraciones Flyway y API de acceso, organización, pacientes, agenda, turnos,
coberturas, avisos, chat y reportes. El frontend Angular Patio y su [integración/pruebas estrictas](../docs/28-integracion-frontend-servidor-y-pruebas.md) están en `salud-web`.

## Probar en local

Para iniciar **frontend + backend + PostgreSQL en Docker**, usar `scripts/start-local.ps1` desde la **raíz del repositorio** (distinto del script de esta carpeta). Construye desde fuentes, espera los healthchecks y mantiene una base independiente. [Guía completa y prueba por funcionalidades](../docs/29-entorno-local-docker.md). El procedimiento siguiente conserva Spring en el host/IDE.

Requisitos: JDK 21, PowerShell 7 y Docker Desktop iniciado con motor Linux.
Desde `salud-api`:

```powershell
.\scripts\start-local.ps1
```

El script crea/completa `.env` con secretos aleatorios, inicia PostgreSQL conservando
el volumen y arranca Spring. Si hace falta, indicar `JAVA_HOME` al JDK 21 instalado.
API: `http://localhost:8080`; salud: `/actuator/health/readiness`.

Para arrancar o depurar desde IntelliJ, ejecutar primero
`scripts/start-local.ps1 -DatabaseOnly` y seleccionar **Salud API local** en Run/Debug.
La configuración compartida en `.run/` usa el módulo `salud-api`, la carpeta del
proyecto como directorio de trabajo y carga las variables desde `.env`. No contiene
contraseñas. Al crear otra configuración desde `main()`, asociarle también `.env`
en **Run > Edit Configurations > Environment variables > Browse for .env files**.
Ejecutar el script en la terminal de IntelliJ no transmite sus variables al botón Run.

Cuatro usuarios ficticios: `admin@demo.test`, `profesional@demo.test`,
`paciente@demo.test` y `secretaria@demo.test`. La contraseña inicial compartida está
en `BOOTSTRAP_PASSWORD` de `.env`; no se imprime ni se versiona. El administrador
gestiona la entidad; el profesional es titular de agenda; secretaría solo tiene las
acciones de agenda delegadas; el paciente tiene admisión activa y ficha propia.
Todos los datos demo son ficticios. El bootstrap no cambia contraseñas ya creadas.

En otra consola:

```powershell
.\scripts\smoke-local.ps1
```

Ejecuta login con cookies y CSRF reales, descubre contexto/paciente/oferta, pre-reserva,
registra, confirma, consulta y cancela un turno. La cancelación deja libre el horario
y conserva el historial. No eliminar volúmenes para repetir pruebas.

Para detener: Ctrl+C y `docker compose stop`. Para iniciar solamente la base:
`scripts/start-local.ps1 -DatabaseOnly`. PostgreSQL queda en `127.0.0.1:55432` y la
API local en loopback. `.env` se carga mediante el script o la configuración de
ejecución de IntelliJ; Spring no interpreta archivos `.env` por sí mismo.
Cambiar contraseñas de `.env` no modifica
roles de un volumen existente: se necesita rotación explícita de esos roles.

## Sesión y peticiones

1. GET `/api/v1/auth/csrf`, conservando la cookie del servidor.
2. POST `/api/v1/auth/login`, JSON `{ "email": "…", "password": "…" }`, con
   `X-CSRF-TOKEN` obtenido en el paso anterior.
3. Repetir GET de CSRF después del login, porque se rota la sesión.
4. Enviar cookie y `X-CSRF-TOKEN` en todas las escrituras posteriores.
5. GET `/api/v1/auth/me` devuelve cuenta y contextos vigentes.

`/api/v1/my-patients/{tenant}` identifica las fichas propias habilitadas. El actor
se obtiene de la sesión; no se acepta como facultad un ID de usuario enviado por el
cliente. `Idempotency-Key` es obligatorio en pre-reserva, registro, reprogramación y
ausencia: 1–100 caracteres; reintentar con igual clave y cuerpo conserva el resultado.
Usar una clave distinta para una operación nueva. Confirmar, cancelar y reprogramar requieren además `If-Match: "N"`, con la versión leída del turno; una versión antigua responde 412 y una ausente 428. Los timestamps de entrada usan ISO
8601 con offset; la zona de cada agenda determina su horario local.

Sesión HTTP en memoria de una instancia, registro/revocación en PostgreSQL, cookie
HttpOnly/SameSite=Lax, expiración inactiva 20 min y absoluta 8 h. Reiniciar la instancia
requiere volver a ingresar. Esta entrega despliega **una réplica**; varias réplicas
requieren añadir sesiones compartidas. Recuperar contraseña revoca todas las sesiones
sin reactivar membresías, delegaciones o admisiones revocadas.

## MFA y Google

Producción exige MFA al equipo y a plataforma antes de operaciones de negocio.
Después del login, POST `/auth/mfa/enroll` con contraseña actual devuelve secreto y
URI `otpauth`; registrar en un autenticador TOTP. POST `/auth/mfa/verify` con
`{"code":"123456"}` verifica el factor y la sesión. No repetir el mismo código:
hay protección contra replay. En ingresos siguientes, verificar el código de nuevo.
Local permite experimentar sin MFA; al verificar un factor, se exige en sesiones
posteriores también en local. Secretos TOTP y enlaces de identidad usan AES-256-GCM.
La recuperación de un autenticador perdido requiere procedimiento operativo verificado;
no existe una API pública que permita omitirlo o reiniciarlo por solo recuperar correo.

Google es opcional: configurar `GOOGLE_CLIENT_ID`. GET `/auth/google/nonce` devuelve
nonce y clientId; el frontend solicita un ID token de Google con ese nonce. POST
`/auth/google` recibe `idToken`; valida firma, emisor, vencimiento, audiencia y nonce
de un solo uso. Para vincular por primera vez, ingresar mediante correo y POST
`/auth/google/link` con `idToken` y contraseña actual. Se conserva el sujeto estable;
no se fusionan cuentas por coincidencia de correo. Ningún login aprueba admisiones.
Se necesita configurar el cliente y los orígenes en Google para probar el servicio real.

## API de negocio

Prefijo de entidad: `/api/v1/entities/{tenant}`. Los cuerpos y ejemplos adicionales
están en [API.md](docs/API.md). Las listas devuelven conjuntos acotados; la auditoría
usa `offset`, los mensajes usan `before` y los reportes filtran fechas.

| Área | Rutas principales |
| --- | --- |
| Incorporación controlada | `/api/v1/platform/accounts`, `/platform/entities` |
| Equipo y profesionales | `/members`, `/professionals`, `/branches` |
| Agenda | `/agendas`, `/agendas/{id}/hours`, `/agendas/{id}/delegations` |
| Catálogo | `/practices`, `/agendas/{id}/offers` |
| Admisión | `/api/v1/admission-requests/{tenant}`, `/admissions`, `/admissions/{id}/approve` o `/reject` |
| Pacientes | `/patients`, `/patients/{id}/professionals`, `/access`, `/representations`, `/contacts` |
| Cobertura | `/coverages`, `/coverages/{id}/plans`, `/patients/{id}/affiliations`, `/agreements`, `/coverage-authorizations` |
| Disponibilidad | `/availability?offerVersionId=…&patientId=…&date=YYYY-MM-DD` |
| Turnos | `/holds`, `/appointments`, `/appointments/{id}/confirm`, `/cancel`, `/reschedule` |
| Ausencia profesional | `/agendas/{id}/absences`, `/rescheduling-cases?agendaId=…` |
| Gestión asistida | `/management-requests`, `/management-requests/{id}/resolve?agendaId=…` |
| Avisos | `/channels`, `/tasks`, `/tasks/{id}/retry`, `/notifications` |
| Chat | `/conversations`, `/conversations/{id}/messages`, `/messages/{message}/read` |
| Auditoría/reportes | `/audit`, `/reports/appointments?agendaId=…&from=…&until=…&format=csv\|xlsx\|pdf` |

La administración de entidad no concede agenda o chat. La delegación de agenda solo
la otorga el titular y solo para las acciones pedidas. El chat se inicia por un paciente
o representante con facultad verificada, y agrega a ese actor y al profesional; se
revalida autorización en cada lectura/escritura. Un mensaje no altera turnos.
La numeración se asigna al vincular paciente/profesional, bajo lock transaccional;
no se reutiliza ni cambia al repetir el vínculo. No hay fusiones por DNI o correo.

## Avisos y políticas

Local simula la entrega; `/api/v1/dev/mailbox`, disponible solo en perfil `local` y
para plataforma, permite leer enlaces ficticios de activación/recuperación. No se
envían mensajes reales. Los avisos de turnos se consultan en tareas y estados de envío.

Producción usa un gateway HTTPS configurable mediante `DELIVERY_URL` y
`DELIVERY_TOKEN`. El contrato está en [API.md](docs/API.md#gateway-de-comunicaciones).
Ese gateway debe implementar correo/WhatsApp con los proveedores contratados y
deduplicar `Idempotency-Key`. No se seleccionó ni se contrató un proveedor real.
Cada entidad configura su canal/remitente y destinos verificados con autorización.

Plan: correo T-60 (dentro de la ventana aceptada T-72/T-48), respaldo WhatsApp T-36 si
continúa pendiente y evaluación de cierre T-24. La ausencia del profesional crea un
WhatsApp por cada turno afectado, incluidos confirmados, independientemente de T-36.
Entregar un aviso no confirma asistencia. El worker reclama con `SKIP LOCKED`, lease
de 2 min, hasta 5 intentos y reintentos a 5 min; conserva deduplicación al reiniciar.
No garantiza exactamente una entrega en redes externas sin soporte del gateway.

TTL demo: 5 min; cuota demo: 3 pre-reservas/turnos futuros, incluidos confirmados.
La política se versiona por entidad mediante PUT `/policy` con referencia de aprobación.
Solo Consulta base habilitada permite elegir horarios; renombrar una personalizada no
amplía esa facultad. La cobertura se evalúa explícitamente, sin convertir a particular
cuando falla. Reservas a menos de 48 h requieren personal y generan revisión asistida.

**Cierre automático deshabilitado inicialmente.** Habilitarlo requiere política explícita;
además, el worker exige evidencia de entrega y ejecuta solo dentro de 15 min del corte.
Fallo de entrega, cierre tardío o política no aprobada generan revisión interna y
conservan el turno. Los valores son decisiones técnicas provisionales para pruebas:
resolver D01/D07/D09/D15 antes de usar políticas reales.

## Base y permisos

Flyway aplica V1–V10 sin `ddl-auto=create` ni H2. PK nuevas con `DEFAULT uuidv7()`;
FK UUID y claves compuestas por tenant para referencias entre tablas locales.
Las tablas locales tienen RLS forzado y el contexto usa `set_config(..., true)` sobre
la misma transacción/conexión. El pool no conserva contexto de una petición anterior.

`salud_app` no tiene DDL, superusuario ni BYPASSRLS. La auditoría solo permite agregar
y consultar. El runtime no tiene consulta general de ocupaciones globales: funciones
`SECURITY DEFINER` con `search_path` fijo coordinan locks por identidad profesional y
devuelven disponibilidad o conflicto sin detalles de otras entidades. Las tablas de
evolución no reciben permisos de runtime por el solo hecho de existir.

El código usa JDBC parametrizado para hacer explícitos contexto, locks y snapshots;
Hibernate permanece en validación y no administra el esquema. Ningún endpoint acepta
SQL, plantillas de reporte, nombre de tabla ni duración calculada por el cliente.

## Compilar y verificar

El Wrapper fija Maven 3.9.16 con checksum de distribución. Esta versión evita el
error `No implementation for ArtifactHandlerManager was bound` al importar Maven
3.10.0 con integraciones de IntelliJ que todavía usan componentes Plexus antiguos.
En IntelliJ, abrir `salud-api/pom.xml`, seleccionar **Use Maven wrapper** en
**Settings > Build, Execution, Deployment > Build Tools > Maven > Maven home path**
y ejecutar **Reload All Maven Projects**. Usar JDK 21 para importar y ejecutar Maven.

```powershell
.\mvnw.cmd -B -ntp --strict-checksums clean verify
```

La primera ejecución descarga Maven y dependencias; requiere Internet. Las siguientes
pueden usar `-o` cuando todo esté en caché. Docker debe estar iniciado. La suite usa
PostgreSQL 18.6 real mediante Testcontainers y verifica migraciones, RLS, FK, UUIDv7,
concurrencia entre entidades, cuota, rollback, idempotencia, permisos, sesión/CSRF,
activación/recuperación, MFA, chat, tareas, webhooks y exportaciones PDF/XLSX/CSV.

## Preparar producción

```powershell
# Construir el mismo artefacto probado.
.\mvnw.cmd -B -ntp clean verify
docker build -t salud-api:local .
Copy-Item .env.production.example .env.production
# Editar .env.production con secretos nuevos, dominio y gateway real.
docker compose --env-file .env.production -f compose.production.yml config --quiet
docker compose --env-file .env.production -f compose.production.yml up -d
```

Requiere dominio apuntando al servidor y puertos 80/443 disponibles. Caddy obtiene TLS.
No se publicó este proyecto en Internet durante el desarrollo. La topología sirve API;
el portal Angular deberá desplegarse bajo el mismo origen o configurar CORS explícito.
No hay pantalla web funcional incluida en el backend.

El job `migrate` usa las credenciales de migración y termina después del bootstrap;
`api` usa perfil `production`, Flyway deshabilitado y solo credenciales de runtime.
El contenedor API corre como usuario no privilegiado, filesystem de solo lectura y
`/tmp` efímero. PostgreSQL no publica un puerto de host. El proceso normal no recibe
contraseña de bootstrap ni migrador. El primer ingreso administrativo requiere configurar
y verificar MFA. En despliegues posteriores reutilizar la cuenta inicial; el bootstrap
no sobrescribe su contraseña. Conservar la clave AES para recuperar secretos cifrados.

Antes de datos reales: configurar y probar proveedores/remitentes, consentimientos,
políticas, responsables, respaldos externos y restauración; validar carga y RPO/RTO.
Elegir digests de imágenes revisados para fijar el despliegue; los tags base se mantienen
actualizables para facilitar la preparación inicial. No se declara certificación productiva.

```powershell
.\scripts\backup.ps1                         # dump local; guardar fuera del host, cifrado
.\scripts\restore-check.ps1 -BackupFile .\backups\salud-AAAAMMDD-HHMMSS.dump
```

El ensayo restaura en un contenedor temporal sin puertos y no reemplaza la base origen.
Comprobar también roles, permisos, RLS, secretos y reconciliación de avisos al realizar
una recuperación real; `--no-owner/--no-privileges` del ensayo no despliega roles productivos.

## Límites conservados de la documentación

No hay motor comercial, directorio público, historia clínica, odontograma, IA, adjuntos
ni llamadas. Transferir fichajes entre entidades, eliminar cuentas a petición, acceso
excepcional de soporte, recursos de capacidad múltiple y presupuestos facturables
conservan esquema pero no comandos habilitados: necesitan las decisiones pendientes
del manual. La baja de un profesional con turnos futuros exige resolverlos antes;
la baja institucional nunca elimina su cuenta ni fichas.

La configuración productiva está preparada; los proveedores externos y una beta con
datos reales requieren su validación operativa. Ver [estado de implementación](../docs/26-implementacion-servidor.md).

Referencias técnicas de implementación: [RLS PostgreSQL](https://www.postgresql.org/docs/18/ddl-rowsecurity.html),
[sesiones Spring Security](https://docs.spring.io/spring-security/reference/7.0/servlet/authentication/persistence.html),
[validación JWT](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)
y [vectores TOTP RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238).
