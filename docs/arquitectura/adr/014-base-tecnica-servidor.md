# ADR-014 — Base técnica del servidor

Fecha: 16/10/2026. Estado: implementado como base técnica por solicitud del responsable;
revisión del entregable pendiente. No habilita el siguiente incremento funcional.

## Contexto

El responsable solicita crear exclusivamente la base Spring Boot con Security,
conexión PostgreSQL, instalación y verificación de dependencias. Añade dependencias
para reportes durante la ejecución. El repositorio tenía documentación y modelo lógico,
sin aplicación. No se modifican reglas ni se aprueba el esquema propuesto por inferencia.

## Decisión

Crear `salud-api/` como raíz Maven y artefacto `salud-api`, evitando espacios y acentos
en identificadores del servidor. Mantener el monolito modular previsto, con paquetes
por capacidad y configuración transversal pequeña. La carpeta sustituye el nombre
`backend/` del bosquejo documental para identificar inequívocamente el artefacto.

Usar Spring Boot 4.1.1 estable, confirmado en Initializr oficial; JDK 21 LTS instalado
(21.0.12), compatible con Boot, con compilación y Enforcer fijados a 21. Java 25 figuraba
como propuesta en seguimiento, no decisión aprobada; no se instala otro JDK sin necesidad.
Maven Wrapper 3.3.4 fija Maven 3.10.0; las dependencias Spring se resuelven mediante
el BOM. Descargas con checksums estrictos y checksum de distribución fijado.

Spring MVC, Security, Validation, JPA, Flyway, JDBC PostgreSQL, Actuator y pruebas
JUnit/Spring Security/Testcontainers. Reportes: JasperReports 7.1.0/PDF/fuentes,
POI 5.5.1 y Commons CSV 1.14.1, verificados contra metadatos publicados en Maven Central.
No incorporar mail, mensajería, pagos o generación de tokens sin caso de uso definido.

PostgreSQL 18.6 en Compose y pruebas. Rol de migración propietario separado del rol
runtime sin superusuario/BYPASSRLS/DDL. Migraciones sin tablas del negocio ni RLS
ficticio. Concesiones futuras explícitas después de definir el aislamiento.

## Consecuencias

Acceso cerrado salvo salud técnica, sin usuarios generados. CSRF y cookies seguras
por defecto; solo `local` permite HTTP loopback. Autenticación definitiva sigue abierta
conforme a ADR-007/008/012; no se introduce JWT ni Google de manera anticipada.
El monolito puede incorporar módulos sin crear microservicios ni proyectos Maven vacíos.

La evidencia automatizada se registra en `docs/24-verificacion-base-servidor.md` y los
detalles operativos en `salud-api/README.md`. No se publican ni se crean commits en esta
etapa. Se conservan los cambios documentales previos que estaban en el árbol de trabajo.
