# Frontend y backend: entorno local con Docker

Actualizado: 22/10/2026. Esta guía usa datos ficticios y el perfil `local` de Spring.
Complementa los [contratos de integración](28-integracion-frontend-servidor-y-pruebas.md) y la [API](../salud-api/docs/API.md).

## Arranque completo

Requisitos: Docker Desktop iniciado con contenedores Linux, Docker Compose v2 y PowerShell 7.
No requiere Java, Maven, Angular CLI ni Node en el host para construir o ejecutar la aplicación.
La primera construcción necesita Internet para obtener imágenes y dependencias.

Desde la **raíz del repositorio**, ejecutar:

```powershell
.\scripts\start-local.ps1
```

El script crea `.env` con secretos aleatorios si no existe, construye las dos imágenes desde
el código y espera las comprobaciones de salud. Abrir **http://127.0.0.1:4387/acceso**.
Elegir el acceso con correo y contraseña para operar con Spring.

La contraseña inicial de las cuatro cuentas ficticias está en `BOOTSTRAP_PASSWORD` del
archivo `.env` de la raíz. No se imprime en terminal ni se incluye en Git.

| Cuenta | Facultades iniciales |
| --- | --- |
| `secretaria@demo.test` | Agenda y comandos de turnos delegados; sin acceso general a fichas ni chat. |
| `profesional@demo.test` | Titular de la agenda; horarios, ofertas, delegaciones, turnos y conversaciones propias. |
| `admin@demo.test` | Fichas, admisiones, catálogo, cobertura, avisos y auditoría; sin lectura automática de agendas o chat. |
| `paciente@demo.test` | Identidad y acceso a su ficha para pruebas de API. Patio es actualmente la interfaz de personal; no implementa un portal de paciente completo. |

El perfil local permite ingresar al personal sin MFA obligatorio; se puede configurar desde
la cuenta. La fixture estricta mantiene MFA obligatorio para probar ese control.

## Topología y persistencia

```text
Navegador -> 127.0.0.1:4387 -> web (Angular compilado + Caddy :8080)
                                  /api/* -> api:8080 -> postgres:5432
Acceso directo a API para depurar: 127.0.0.1:8080
```

El navegador siempre pide `/api/v1` al origen de la web. Caddy conserva la ruta,
cookies, CSRF, claves idempotentes, `If-Match` y descargas. Una ruta de API fallida
no se convierte en HTML de la SPA. Las rutas profundas de Angular sí sirven `index.html`.
No se requiere configurar una URL de API dentro del bundle de Angular.

Compose espera PostgreSQL saludable antes de iniciar la API, y la API disponible con
base conectada antes de iniciar la web. La dependencia usa `service_healthy`, tal como
documenta [Docker Compose](https://docs.docker.com/compose/how-tos/startup-order/).

El proyecto se llama `salud-local`. Su volumen `salud-local_local-postgres` conserva los
datos al reiniciar o ejecutar `docker compose down`. Es independiente del proyecto
anterior `salud-api-local`; no se utiliza ni modifica su volumen. PostgreSQL no publica
puerto en el host. Los roles de migración y aplicación mantienen las restricciones y RLS.
En este perfil local la API aplica Flyway al arrancar; producción conserva su job separado.

Las imágenes finales de API y web ejecutan usuarios sin privilegios, con disco de solo
lectura y `/tmp` efímero. La construcción de las imágenes omite tests; ejecutarlos con los
comandos de verificación siguientes antes de considerar aprobado un cambio.

## Configuración y comandos habituales

`.env.example` documenta las variables. El script genera `.env` sin sobrescribir uno existente.
No copiar los valores de ejemplo como secretos: usar el script para generarlos. Si falta
alguna variable obligatoria, `docker compose config --quiet` señala el nombre sin mostrar
la configuración resuelta. Evitar publicar la salida de `docker compose config`, porque
contiene secretos interpolados.

| Variable | Valor inicial / función |
| --- | --- |
| `WEB_PORT` | `4387`, web publicada solo en `127.0.0.1`. También configura `PORTAL_URL` de la API Docker. |
| `API_PORT` | `8080`, acceso directo a Spring solo en `127.0.0.1`. El proxy usa siempre `api:8080`. |
| `HOST_API_PORT` | `8080`, usado únicamente por `compose.host-api.yml`. |
| `POSTGRES_PASSWORD`, `DB_PASSWORD`, `DB_MIGRATION_PASSWORD` | Secretos diferentes para administración, runtime y migraciones. |
| `APP_ENCRYPTION_KEY` | 32 bytes en Base64 para secretos cifrados; conservar junto con los datos. |
| `BOOTSTRAP_PASSWORD` | Contraseña inicial de las cuentas ficticias; no modifica cuentas ya creadas. |
| `GOOGLE_CLIENT_ID` | Opcional; requiere configuración real de Google y del origen de la web. |

Después de cambiar puertos o configuración, repetir el arranque. No cambiar las claves
de base de datos o cifrado conservando un volumen existente sin realizar su rotación correspondiente.
Si `8080` está ocupado por Spring en el IDE, usar el modo host siguiente o cambiar `API_PORT`.

```powershell
# Desde la raíz, con .env generado:
docker compose ps
docker compose logs --tail 100 api web
docker compose logs -f api
docker compose stop
docker compose start
docker compose down               # conserva la base
.\scripts\start-local.ps1 -NoBuild # reutiliza imágenes
.\scripts\start-local.ps1          # reconstruye después de editar código
```

Para empezar con una base ficticia nueva, **eliminar los datos locales** del proyecto con
`docker compose down --volumes`. Ese comando borra el volumen de este entorno: ejecutarlo
solo cuando se desee perder su contenido. El arranque normal nunca lo ejecuta.

## Usar Spring ejecutándose en el host / IDE

Para mantener el servicio backend en la computadora y contenerizar solo la web:

1. Iniciar Spring con el procedimiento de [salud-api](../salud-api/README.md). Configurar
   `PORTAL_URL=http://127.0.0.1:4387` en **ese proceso**. El `.env` de la raíz no se transmite
   automáticamente al backend del IDE ni sustituye `salud-api/.env`.
2. Desde la raíz, ejecutar:

```powershell
.\scripts\start-local.ps1 -BackendOnHost
```

La web utiliza `host.docker.internal:8080`; cambiar `HOST_API_PORT` si corresponde.
Consultar [red de Docker Desktop](https://docs.docker.com/desktop/features/networking/).
En Docker Desktop Windows comprobar la accesibilidad del servicio del host; si no acepta
conexiones desde Docker, establecer `SERVER_ADDRESS=0.0.0.0` **en el proceso Spring** y
limitar su acceso mediante el firewall. En Linux nativo, la API debe escuchar en una
interfaz accesible desde el bridge; se agrega el alias `host-gateway`.

Este modo no crea base ni API. Su healthcheck comprueba la web; la disponibilidad del
backend se comprueba al iniciar sesión o con una petición a `/api/v1/auth/csrf`.
Detenerlo desde la raíz con `docker compose -f compose.host-api.yml down`.
No ejecutar ambos modos publicando el mismo `WEB_PORT`.

Para desarrollar Angular con recarga automática y Spring local, sigue disponible
`npm start` desde `salud-web`; usa `proxy.conf.json` hacia `127.0.0.1:8080`.

## Verificación automatizada del entorno completo

Con el Compose completo iniciado y Node 22 compatible o Node 24 instalado en el host:

```powershell
node .\scripts\smoke-local.mjs
```

La prueba lee la contraseña de `.env`, usa la web como origen y exige una marca de perfil
local con demo y proveedores simulados antes de modificar datos. Recorre SPA/proxy,
CSRF y sesión, permisos, fichas y contactos, catálogo y ofertas, cobertura/planes/convenios,
afiliación y autorización, reserva idempotente, confirmación y versión, reprogramación,
CSV/XLSX/PDF, ausencias y avisos, gestión asistida, chat y lecturas, notificaciones y auditoría,
activación/recuperación, representación/acceso, admisión, membresía/delegación y logout.
El resultado queda en `tmp/smoke-local-result.json`, sin contraseñas ni enlaces de recuperación.

Genera registros sintéticos identificados con un sufijo y conserva su historia. El turno
creado se cancela en `finally`. Repetirla agrega registros; no es una limpieza de base ni
una medición de carga. Para una ejecución personalizada, `LOCAL_BASE_URL` admite solo
HTTP en loopback; usar el puerto configurado en `.env` para que coincidan los enlaces.

Para las pruebas de código y la fixture descartable con MFA:

```powershell
cd .\salud-web
npm ci
npm test
npm run build
cd ..\salud-api
.\mvnw.cmd -B -ntp --strict-checksums verify
cd ..
# Ronda estricta completa, incluyendo cobertura, auditoría npm y fixture HTTP:
.\scripts\verify-strict.ps1
```

Requieren Node, JDK 21 y Docker para Testcontainers. La fixture no usa el volumen persistente
del Compose. Los informes existentes y su alcance están en el documento 28.

## Prueba manual de las pantallas

| Pantalla / cuenta | Comprobación |
| --- | --- |
| Acceso | Ingresar con las cuentas del servidor; recargar y verificar restauración de sesión; cerrar sesión. |
| Agenda / secretaría | Buscar el paciente ficticio, elegir Consulta y particular, reservar; confirmar, reprogramar y cancelar. Revisar que registrar no confirme asistencia. |
| Pacientes / administrador | Crear ficha, editarla, vincular al profesional aun sin acceso a su agenda; añadir contactos, afiliación y autorización. |
| Catálogo / administrador | Crear práctica, cobertura, plan y convenio. El convenio requiere una oferta: crearla como profesional. |
| Configuración / profesional | Añadir horario vigente; registrar ausencia sobre un turno; comprobar el caso pendiente y que el turno conserve su horario. Delegar y revocar una acción. |
| Bandeja / administrador y secretaría | Revisar admisiones con el administrador y gestiones/reprogramaciones con el personal facultado. La prueba automática deja casos e historial sintéticos. |
| Comunicaciones / administrador | Consultar tareas y sus estados; reintentar únicamente las que el backend permite. Un envío simulado no equivale a entrega. |
| Mensajes / profesional | Tras la prueba automática hay una conversación iniciada por el paciente. Abrirla, revisar el contador y responder. Secretaría no recibe permiso por delegación de agenda. |
| Reportes | Elegir agenda, período y descargar CSV/XLSX/PDF; administrador consulta auditoría. |
| Recuperación | Solicitar recuperación; un administrador de plataforma consulta `/api/v1/dev/mailbox` autenticado para obtener el enlace simulado y abrirlo en esta web. |

La demostración del navegador sigue siendo una opción explícita, independiente de Spring.
Elegirla no prueba persistencia en PostgreSQL. Los cambios de sesión o entidad eliminan
el estado anterior de la interfaz; un rechazo de permisos del servidor sigue siendo definitivo.

## Alcance y diagnóstico

Se conectan las pantallas administrativas actuales de Patio. El backend también expone
comandos de plataforma, organización y paciente sin una pantalla dedicada; sus contratos
están en `salud-api/docs/API.md`. No se presenta un portal del paciente o administración
comercial inexistentes como funcionalidades implementadas en la web.

Correo y WhatsApp son simulados en local: se persisten tareas y estados, sin entregar mensajes
reales. Google requiere credenciales y conexión externas; las pruebas locales no certifican
Google ni proveedores reales. Producción conserva su configuración separada en
`salud-api/compose.production.yml`; este entorno HTTP local no es una configuración productiva.

| Síntoma | Acción |
| --- | --- |
| Docker inaccesible | Iniciar Docker Desktop y seleccionar contenedores Linux. |
| Puerto ocupado | Detener el proceso anterior o cambiar `WEB_PORT`/`API_PORT` en `.env`. |
| API no saludable | `docker compose logs --tail 100 api postgres`; verificar claves y permisos del volumen. |
| Web abre pero no ingresa | Comprobar `/api/v1/auth/csrf`, disponibilidad de Spring y modo Compose elegido. |
| Contraseña inicial rechazada | Usar el `.env` de este entorno; bootstrap no cambia contraseñas existentes. |
| Acción o agenda ausente | Ingresar con la cuenta facultada y revisar delegaciones; ser administrador no concede agenda/chat. |
| Cambios de código no aparecen | Reconstruir con `scripts/start-local.ps1`; las imágenes contienen el código compilado. |
| Error 412 | Recargar el turno y revisar la versión actual antes de repetir. |

El proxy sigue el contrato de [reverse_proxy de Caddy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).

La [evidencia de ejecución del 22/10/2026](30-verificacion-integracion-local.md) registra los resultados de las pruebas y sus límites.

La migración **V10** agrega `solicitud_admision.creada_en` con valor por defecto para
nuevas solicitudes. Las anteriores conservan `null`; Patio admite esa ausencia de fecha
y mantiene la bandeja disponible. El arranque aplica la migración al volumen de este entorno.
