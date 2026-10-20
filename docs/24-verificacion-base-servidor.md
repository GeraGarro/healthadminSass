# Verificación de la base del servidor

Fecha: 16/10/2026, America/Buenos_Aires. Alcance autorizado: base del servidor y
dependencias para reportes. Sin funcionalidad del turnero, frontend ni datos reales.

## Resultado

`clean verify`: **BUILD SUCCESS**. 15 pruebas ejecutadas, cero fallos, errores u
omisiones: ocho de seguridad/MVC, tres de reportes y cuatro de integración real.
JAR ejecutable generado y arrancado contra PostgreSQL local. No se ejecutó CI remota.

| Comprobación | Evidencia observada |
| --- | --- |
| Compilación y empaquetado | JAR Spring Boot de 100 MB aproximadamente, Java 21 |
| Herramientas | JDK 21.0.12, Maven 3.10.0, Wrapper 3.3.4, Docker Engine 29.8.1 |
| Dependencias | Árbol resuelto sin fallos; checksums estrictos en Maven; ZIP Maven cotejado SHA-512 y fijado SHA-256 |
| Seguridad HTTP | Acceso privado sin sesión: 401 Problem Details; escrituras sin CSRF: 403 |
| Autorización por método | Autoridad ausente rechazada; autoridad requerida aceptada en controlador exclusivo de pruebas |
| CORS | Origen configurado aceptado; origen desconocido rechazado |
| Validación | Entrada vacía rechazada con 400 Problem Details |
| PostgreSQL | 18.6 real, contenedor Testcontainers desechable y servicio Compose local |
| Flyway | V1 aplicada y validada; sin migraciones pendientes |
| Rol runtime | `salud_app`, sin superusuario ni BYPASSRLS; DDL e historial Flyway rechazados |
| Tiempo | JVM y conexión PostgreSQL UTC comprobadas |
| PDF | Jasper compila plantilla y exporta una página con DejaVu Sans; cabecera y terminación PDF válidas |
| XLSX | Archivo generado y reabierto; texto acentuado y celda numérica preservados |
| CSV | Escritura y lectura RFC4180 UTF-8; comas, comillas y ñ preservadas |
| Secretos | `.env` local con contraseñas aleatorias; ignorado por Git junto con `target/` y `tmp/` |
| Diff | `git diff --check` sin errores de whitespace |

## Matriz instalada

| Componente | Versión resuelta |
| --- | --- |
| Spring Boot | 4.1.1 |
| Spring Security | 7.1.1, administrada por Boot |
| Hibernate ORM | 7.4.5.Final, administrada por Boot |
| Flyway | 12.4.0, administrada por Boot |
| JDBC PostgreSQL | 42.7.13, administrada por Boot |
| Testcontainers | 2.0.5, administrada por Boot |
| JasperReports / PDF / fuentes | 7.1.0 |
| Apache POI OOXML | 5.5.1 |
| Apache Commons CSV | 1.14.1 |

Las versiones externas se consultaron en metadatos de Maven Central. La matriz
resuelta y las pruebas sustituyen la propuesta previa de Java 25 para esta base,
sin modificar el seguimiento histórico del 15/10.

## Arranque del artefacto

Se ejecutó `java -jar target/salud-api-0.0.1-SNAPSHOT.jar` con perfil `local`,
en `127.0.0.1:8080`, usando la base de Compose en `127.0.0.1:55432`.

| Ruta | Estado HTTP | Cuerpo relevante |
| --- | --- | --- |
| `/actuator/health` | 200 | `status: UP`, sin componentes internos |
| `/actuator/health/liveness` | 200 | `status: UP` |
| `/actuator/health/readiness` | 200 | `status: UP` |
| `/api/v1/patients` | 401 | Autenticación requerida; no existe aún el recurso del negocio |
| `/actuator/env` | 401 | Autenticación requerida; endpoint no expuesto |

El proceso usado para verificar el JAR y el servicio local se detienen al finalizar
la comprobación; se conserva el volumen local para el siguiente arranque. Docker
Desktop queda iniciado. Los contenedores de integración los elimina Testcontainers.

SHA-256 del JAR verificado:
`b335955d98f2042225bb976b4c6c07a636244ac00673b191a7cbf2898fa6e5c0`.

Digest de imagen PostgreSQL observado:
`postgres@sha256:74935e72241653ca55e0414067e6d8763aceb8a810eb51b452253ec3dcfc4336`.
Compose y las pruebas fijan la etiqueta 18.6; el digest documenta la descarga
observada y no se presenta como pin inmutable en esos manifiestos.

## Hallazgos resueltos y límites

- JasperReports modifica su mapa de parámetros: la prueba pasó a utilizar `HashMap`.
- PostgreSQL rechazó el alias JVM `America/Buenos_Aires`: el punto de entrada fija
  UTC antes de crear conexiones. La integración ejecuta ese punto de entrada y
  comprueba `show timezone = UTC`.
- Windows no permitió publicar 5432: se fijó 55432 para desarrollo local,
  conservando 5432 dentro del contenedor.
- Maven mostró avisos 401 al explorar índices de prefijos de repositorios Flyway
  declarados transitivamente; todos los artefactos necesarios se resolvieron y
  `verify` y `dependency:tree` finalizaron correctamente. No requieren credenciales
  privadas para reproducir esta base.
- Mockito informa carga dinámica de agente en JDK 21; las pruebas pasan. No se
  modificó globalmente la JVM ni se ocultó la advertencia.

La verificación no es auditoría integral de vulnerabilidades, prueba de RLS entre
entidades, prueba funcional de login ni certificación productiva. Todavía no hay
tablas de negocio ni permisos/aprobaciones de usuarios implementados.

## Reproducción y evidencia local

Desde `salud-api/`: `./mvnw -B -ntp clean verify`, con JDK 21 y Docker disponibles.
La ejecución local descargó herramientas y dependencias en `tmp/maven/` mediante
`MAVEN_USER_HOME` y `-Dmaven.repo.local=../tmp/maven/repository`, sin Maven global.
El arranque normal puede usar la caché Maven habitual del desarrollador.

Evidencia regenerable, excluida de Git:

- `salud-api/target/surefire-reports/` y `salud-api/target/failsafe-reports/`.
- `salud-api/target/report-smoke/infrastructure.{pdf,xlsx,csv}`.
- `salud-api/target/dependency-tree.txt`.
- `tmp/salud-api-verify.log`, `tmp/salud-api-startup.log`, `tmp/salud-api-http-smoke.json`.

Guía operativa: [salud-api/README.md](../salud-api/README.md).
Decisiones: [ADR-014](arquitectura/adr/014-base-tecnica-servidor.md).
