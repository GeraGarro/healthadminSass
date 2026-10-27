---
version: 1
slug: "salud-web-src-app-pages-staff-directory-ts"
primary_target: "salud-web/src/app/pages/staff-directory.ts"
related_targets: ["salud-web/src/app/pages/staff-directory.html","salud-web/src/app/pages/staff-experience.css","salud-web/src/app/core/staff.store.ts"]
---

# Directorio y acceso a agendas · 27/10/2026

Modo: Operate. Extensión de Patio, bajo `.impeccable/roles-direction.md`.

THESIS: Conocer al equipo y pedir acceso a una agenda antes de operar su atención.

OWN-WORLD: Perfiles planos con avatar de iniciales, matrícula, sede y horario publicado; Nunito Sans, colores y controles existentes.

STORY: Sin acceso, el perfil permite solicitar autorización al titular. Pendiente informa espera; rechazado permite nuevo pedido; autorizado abre su agenda. Actualizar recarga workspace y facultades. Pertenencia institucional no concede turnos ni chat.

FIRST VIEWPORT: Encabezado y Actualizar; bienvenida cuando no hay agendas; Todo el equipo / Mis agendas, búsqueda por nombre/matrícula/sede y grilla de perfiles. Tres columnas, cuatro desde 1600px, dos hasta 1240px y una hasta 760px.

FORM: Perfiles y acciones legibles, sin tablas. El estado conserva texto. Un profesional sin agenda puede figurar, pero no permite pedir un acceso inexistente.

FINISH: directory-{1440,1280,390}.png y access-approved-{1440,1280,390}.png, checks.json y access-checks.json en `review/roles/`. El recorrido solicitud → rechazo → nuevo pedido → aprobación → agenda única sin chat está comprobado en demostración. No se amplía a extremo a extremo con API real. Cierre: review/roles/documentation.md.
