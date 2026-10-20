# Salud API

Base del servidor del Sistema de Gestión Administrativa de Salud. Carpeta y artefacto
`salud-api`, paquete raíz `ar.com.salud`, monolito modular organizado por capacidad.
El paquete es un identificador técnico local; no presupone titularidad de un dominio web.

Política para los futuros módulos de negocio: [ADR-015](../docs/arquitectura/adr/015-identificadores-uuidv7.md)
establece nuevas PK UUIDv7 generadas en PostgreSQL con `DEFAULT uuidv7()`, FK de tipo
`uuid` que conservan el valor del padre y representación Java `java.util.UUID`.
No aplicar generación UUIDv4 del framework por defecto ni generación propia a las FK.
El número visible del paciente es entero por profesional y entidad. Esta política
está documentada; la base técnica actual todavía no implementa tablas de negocio.

## Requisitos y dependencias

- JDK **21 LTS** (compilación fijada a 21; verificado localmente con 21.0.12).
- Maven **3.10.0**, descargado por Maven Wrapper **3.3.4**. No instalar Maven global.
- Docker Desktop con motor Linux para PostgreSQL local y pruebas de integración.
- Spring Boot **4.1.1** administra Spring Security, MVC, JPA/Hibernate, Validation,
  Actuator, Flyway, JDBC PostgreSQL, JUnit y Testcontainers mediante su BOM.
- PostgreSQL **18.6**, compartido por Compose y Testcontainers; sin H2 como sustituto.
- Reportes: JasperReports **7.1.0** + módulo PDF + fuentes DejaVu, Apache POI **5.5.1**
  para XLSX y Apache Commons CSV **1.14.1** para CSV UTF-8.

Versiones externas fijadas en `pom.xml`; las administradas por Boot no se sobrescriben.
Maven valida checksums estrictos; el Wrapper verifica SHA-256 del ZIP de Maven,
contrastado inicialmente con su SHA-512 publicado en Maven Central.
Esto verifica descarga y compatibilidad; no equivale a una auditoría integral de CVE.

## Arranque local en Windows (PowerShell 7)

Desde esta carpeta, con Docker Desktop iniciado:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21.0.12' # adaptar al JDK 21 instalado
.\scripts\start-local.ps1
```

El script crea `.env` con tres contraseñas aleatorias si no existe, inicia PostgreSQL
y ejecuta el servidor con perfil `local`. Escucha en `127.0.0.1:8080`; PostgreSQL
se publica solo en loopback. `.env` no se versiona. El perfil local habilita HTTP
para desarrollo; los demás perfiles requieren cookie Secure y HTTPS en infraestructura.
Spring no carga `.env` automáticamente: el script exporta las variables al proceso.

```powershell
Invoke-RestMethod http://localhost:8080/actuator/health
Invoke-RestMethod http://localhost:8080/actuator/health/readiness
```

Ambos deben devolver `status: UP`. `liveness` no depende de la base; `readiness` sí.
Para detener el servidor: Ctrl+C. Para detener PostgreSQL conservando datos:
`docker compose stop`. No eliminar volúmenes para resolver fallos de configuración.
Las credenciales del script SQL se aplican al inicializar un volumen vacío;
editar `.env` después no cambia contraseñas ya almacenadas en PostgreSQL.
Para usar otra base, proveer URL/usuarios/secretos y crear los roles/esquema equivalentes.

## Configuración

| Variable | Uso |
| --- | --- |
| `DB_URL` | JDBC PostgreSQL; local `jdbc:postgresql://localhost:55432/salud` |
| `DB_USERNAME`, `DB_PASSWORD` | Rol de ejecución; contraseña obligatoria |
| `DB_MIGRATION_USERNAME`, `DB_MIGRATION_PASSWORD` | Rol propietario del esquema para Flyway; contraseña obligatoria |
| `DB_POOL_SIZE` | Máximo de conexiones Hikari; 10 iniciales, ajustar mediante mediciones |
| `SERVER_PORT` | Puerto HTTP, 8080 predeterminado |
| `CORS_ALLOWED_ORIGINS` | Lista separada por comas, sin comodines; vacía por defecto |
| `SPRING_PROFILES_ACTIVE` | `local` exclusivamente para desarrollo |
| `POSTGRES_PASSWORD` | Administrador exclusivo de Compose; no usado por Spring |
| `DB_PORT` | Puerto publicado por Compose; si cambia, actualizar también `DB_URL` |

En producción inyectar secretos desde la infraestructura, usar TLS también hacia
PostgreSQL según el proveedor y configurar explícitamente el proxy confiable.
Las cabeceras reenviadas no se aceptan automáticamente. El diseño de despliegue,
sesiones compartidas y ejecución de migraciones desde un job dedicado queda pendiente.

## Estructura

```text
salud-api/
  .mvn/                         Wrapper y verificación de descarga
  docker/postgres/              Inicialización de roles locales
  scripts/                      Arranque local
  src/main/java/ar/com/salud/
    config/                     Security, CORS y configuración transversal
    shared/error/               Errores HTTP Problem Details
    identity/                   Reserva: identidad, admisión y membresías
    organization/               Reserva: entidades y sedes
    patient/                    Reserva: fichas administrativas y representantes
    scheduling/                 Reserva: agendas, prácticas y turnos
    communication/              Reserva: notificaciones y chat
    audit/                      Reserva: auditoría de negocio
    reporting/                  Límite de integración para reportes
  src/main/resources/
    db/migration/               SQL versionado con Flyway
    reports/                    Futuras plantillas confiables
    application*.yml           Configuración común y local
  src/test/                     Seguridad, reportes e integración PostgreSQL
```

Los módulos reservados contienen `package-info.java`, sin servicios ficticios ni
CRUD generado. Cada módulo incorporará `api`, `application`, `domain` e
`infrastructure` a medida que tenga casos de uso reales. Los controladores reciben
DTO validados, llaman servicios y no exponen entidades JPA.

## Seguridad y persistencia

Solo GET de health/liveness/readiness es público. El resto requiere autenticación;
todavía no existe login, emisor JWT, OAuth/Google ni usuarios válidos. Se deshabilitan
Basic, formulario y logout automáticos y la cuenta generada por Spring.
CSRF permanece activo y la autorización por método está habilitada. La configuración
de cookies prepara el soporte de sesión de Spring; el protocolo definitivo de acceso
se decidirá al implementar identidad. No se habilita un endpoint CSRF público todavía.
Se conservan las cabeceras de seguridad de Spring, CORS explícito y errores 401/403
en `application/problem+json`, sin redirección a formularios ni trazas.

Hibernate valida el esquema y no lo crea; Flyway aplica y valida las migraciones.
V1 inicializa únicamente el esquema técnico. El usuario `salud_app` no es dueño,
superusuario ni BYPASSRLS y no tiene DDL ni acceso al historial de migraciones.
No hay concesiones automáticas sobre tablas futuras: cada migración debe incluir
permisos mínimos y RLS junto con sus pruebas de aislamiento. El modelo ER propuesto
no se convirtió en tablas. OSIV está deshabilitado y JDBC usa UTC.

## Verificación

```powershell
.\mvnw.cmd -B -ntp clean verify
.\mvnw.cmd -B -ntp dependency:tree '-DoutputFile=target/dependency-tree.txt'
```

`verify` compila, ejecuta pruebas, empaqueta el JAR y usa Failsafe para las pruebas
`*IT` con un PostgreSQL desechable. Docker es obligatorio: las pruebas de integración
no se omiten cuando falta. No se usa la base local ni se ejecutan migraciones sobre
datos del usuario durante estas pruebas.

Se comprueban autenticación exigida, CSRF, autorización por método, CORS, validación
HTTP, Flyway, separación de roles y health/readiness. Las pruebas de reportes generan
un PDF con acentos y fuentes, reabren XLSX y leen de vuelta CSV con comillas y acentos.
Resultados en `target/surefire-reports`, `target/failsafe-reports` y `target/report-smoke`.
El workflow `.github/workflows/salud-api.yml` repite `clean verify` en Linux cuando
se publique el cambio; no se ha ejecutado remotamente por crear este archivo.

Para ejecutar el artefacto empaquetado, inyectar las variables anteriores y usar
`java -jar target/salud-api-0.0.1-SNAPSHOT.jar`.

## Alcance posterior

Faltan identidad y recuperación, permisos de negocio, RLS por entidad, entidades del
dominio, endpoints funcionales, reportes del negocio y auditoría persistida.
Esta base no representa una beta lista para pacientes. Las siguientes etapas siguen
las decisiones y revisión del responsable registradas en la documentación del proyecto.

Fuentes oficiales consultadas para esta base: [Spring Initializr](https://start.spring.io/),
[requisitos de Boot](https://docs.spring.io/spring-boot/system-requirements.html),
[JasperReports](https://github.com/Jaspersoft/jasperreports),
[Apache POI](https://poi.apache.org/download.html),
[Commons CSV](https://commons.apache.org/proper/commons-csv/),
[metadatos publicados](https://repo.maven.apache.org/maven2/net/sf/jasperreports/jasperreports/maven-metadata.xml).
