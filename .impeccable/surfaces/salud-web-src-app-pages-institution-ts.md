---
version: 1
slug: "salud-web-src-app-pages-institution-ts"
primary_target: "salud-web/src/app/pages/institution.ts"
related_targets: ["salud-web/src/app/pages/institution.html","salud-web/src/app/pages/institution.css"]
---

# Rediseño de roles · 26/10/2026

Modo: Operate. El usuario solicita perfiles y listados sin tablas, calendarios para turnos y alertas con color. Confirma mostrar días, horarios y estado «en jornada» sin pacientes.

## Direction contract

THESIS: Administrar personas y coordinar una jornada son trabajos diferentes: un directorio de perfiles para institución y una agenda viva para secretaría.

OWN-WORLD: Patio conserva Nunito Sans local, verde profundo, celadón y superficies claras. Avatares amplios, perfiles planos y listados con acciones visibles reemplazan las tablas. Los colores de urgencia siempre tienen texto.

STORY: Institución incorpora cuentas nuevas, revisa solicitudes iniciadas por profesionales y finaliza vínculos con aviso. Secretaría completa su perfil, pide autorización al titular y opera solo sus agendas autorizadas.

FIRST VIEWPORT: Institución abre un directorio en tres columnas con avatar, nombre, matrícula, sede y horario. Secretaría abre un calendario por profesional, con una franja de incidencias encima y una lista de recepción al lado; sin autorizaciones abre el directorio. La acción primaria permanece arriba a la derecha.

FORM: Composición especificada por el usuario; extensión del mundo Patio con reemplazo de tablas. Sin sorteo de identidad para este alcance preciso. seed:8657e53ae5336fbd (referencia heredada).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Implementación y cierre · 27/10/2026

El directorio usa perfiles en tres columnas, dos hasta 1240px y una hasta 760px; conserva búsqueda, filtros, orden A–Z/Z–A, paginación y exportación. Equipo, sedes y auditoría usan listas sin tablas. «En jornada programada» deriva del horario y no revela presencia ni pacientes. Los formularios de alta crean cuentas nuevas con correo y contraseña provisoria de 48 horas; una cuenta profesional existente inicia su solicitud desde Mi perfil. La institución decide sobre ese vínculo y la baja genera aviso de cuenta sin eliminar identidad ni otros vínculos.

La exclusión institucional de pacientes y datos de atención se refuerza en navegación, guard, loader y autorización del servidor, incluso con permisos heredados. La disponibilidad publicada permanece visible conforme al pedido.

`review/roles/finish-review.md` conserva la revisión inicial; `review/roles/verdict-pass.md` dispone ship para los dos fixes de bandeja del titular y etiquetas legibles. El cierre y sus límites están en `review/roles/documentation.md` y `docs/34-rediseno-roles-institucion-y-secretaria.md`. DESIGN.md y sidecar se compararon y conservaron: son patrones locales de Patio, sin tokens ni raster nuevo. No se reparó drift previo de configuración/buildPath.
