---
version: 1
slug: "salud-web-src-app-ui-agenda-access-requests-ts"
primary_target: "salud-web/src/app/ui/agenda-access-requests.ts"
related_targets: ["salud-web/src/app/pages/dashboard.ts","salud-web/src/app/core/staff.store.ts"]
---

# Bandeja del titular · 27/10/2026

Modo: Operate. Extensión de Patio para completar el recorrido de autorización.

THESIS: El titular decide sobre una solicitud identificada y un alcance escrito antes de conceder acceso.

OWN-WORLD: Superficie ámbar de pendiente, texto legible, avatar de iniciales y botones existentes. Sin nuevos tokens ni raster.

STORY: Aparece al comienzo del inicio profesional solo para solicitudes AGENDA pendientes de agendas propias. Rechazar y Autorizar agenda resuelven el pedido; las acciones se deshabilitan durante el guardado y los errores se explican en un alert.

FIRST VIEWPORT: Solicitante, agenda, cantidad pendiente y alcance: ver/registrar/confirmar/cancelar/reprogramar turnos. Se excluyen modificar horarios y acceder a conversaciones antes de la decisión.

FORM: Lista de solicitudes dentro de una franja de acción; en móvil los botones pasan a una fila completa. La decisión se verifica por titular en servidor y no se deduce del nombre del rol.

FINISH: owner-requests-{1440,1280,390}.png, access-approved-{1440,1280,390}.png y access-checks.json. verdict-pass.md dispone ship del hallazgo de autorización desde UI y limita la evidencia al recorrido de demostración y la fuente revisada. Cierre: review/roles/documentation.md.
