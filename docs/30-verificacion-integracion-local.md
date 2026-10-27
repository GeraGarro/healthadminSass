# Verificación de la integración local

Fecha: 22/10/2026, Argentina. Entorno: Windows, Docker Desktop con motor Linux,
Node 24.21.0, JDK 21.0.12 y PostgreSQL 18.6. [Procedimiento reproducible](29-entorno-local-docker.md).

## Implementación verificada

- Compose raíz con Angular/Caddy, Spring y PostgreSQL, construidos desde fuentes.
- Publicación en loopback, sesión/CSRF por el mismo origen y descarga de reportes por el proxy.
- Volumen `salud-local_local-postgres`, independiente del PostgreSQL local preexistente.
- Selectores de profesionales autorizados para fichas y accesos sin conceder lectura de agendas.
- Lecturas de mensajes persistidas y contador de mensajes pendientes obtenido del servidor.
- Fecha de creación de admisiones nuevas mediante Flyway V10; compatibilidad con fechas históricas desconocidas.
- Puerto y URL del portal coherentes con la web local; enlaces de activación y recuperación hacia Patio.

## Resultados

| Verificación | Resultado |
| --- | --- |
| `npm test` | 5 pruebas de dominio Node y 75 pruebas Angular/Vitest aprobadas. |
| `npm run build` / construcción frontend Docker | Bundle de producción compilado. |
| Maven `verify` | 12 pruebas unitarias y 38 de integración sobre PostgreSQL descartable; migraciones V1–V10. |
| `node scripts/smoke-local.mjs` | 16 recorridos aprobados a través de `http://127.0.0.1:4387`. |
| Compose completo | PostgreSQL, API y web saludables; API en 8080 y web en 4387, ambos publicados en `127.0.0.1`. |
| Compose con backend en el host | Web temporal en 4391 obtuvo CSRF mediante `host.docker.internal:8080`; contenedor temporal retirado al terminar. Para esta comprobación se usó la API Docker publicada en el host; no se arrancó un JVM del IDE contra la base previa del usuario. |
| Navegador | Ingreso administrativo, carga de pacientes sin errores parciales y selector profesional disponible sin agendas delegadas. |

La cobertura de transporte, fechas y paginación alcanzó 98,63 % de líneas y 95,31 % de
ramas, con los gates aprobados. Es la cobertura de esos tres módulos, no de toda la aplicación.
Las pruebas Angular se ejecutaron fuera de la restricción de archivos que bloqueó un
worker de Vitest; la ronda final completó los once archivos sin errores.

Los recorridos locales cubren sesión y CSRF, permisos, ficha y contactos, catálogo,
coberturas y autorización, reserva e idempotencia, confirmación/conflicto/reprogramación,
CSV/XLSX/PDF, ausencias y tareas, gestión asistida, chat/lecturas/aislamiento, notificaciones,
auditoría, representación y acceso/revocación, admisión, membresía/delegación/revocación,
activación/recuperación y logout. Los turnos sintéticos se cancelaron al finalizar.

Informes regenerables, excluidos de Git: `tmp/smoke-local-result.json`,
`tmp/smoke-local.log`, `tmp/local-integration-maven.log`,
`tmp/local-integration-web-tests.log`, `salud-api/target/surefire-reports`,
`salud-api/target/failsafe-reports` y `salud-web/test-results/angular.xml`.

## Límites de la evidencia

Las verificaciones se realizaron con datos ficticios. Correo y WhatsApp quedaron
simulados; Google y proveedores reales no se validaron. El navegador comprobó los
flujos indicados, no una E2E automatizada de todas las pantallas. No es una prueba
de carga ni acredita preparación para datos reales o producción.

El Compose completo queda iniciado para realizar pruebas locales. La base preexistente
de `salud-api-local` y otros proyectos Docker se conservaron.
