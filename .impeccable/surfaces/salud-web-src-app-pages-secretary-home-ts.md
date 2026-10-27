---
version: 1
slug: "salud-web-src-app-pages-secretary-home-ts"
primary_target: "salud-web/src/app/pages/secretary-home.ts"
related_targets: ["salud-web/src/app/pages/secretary-home.html","salud-web/src/app/pages/secretary-home.css","salud-web/src/app/ui/calendar.ts","salud-web/src/app/ui/calendar.html"]
---

# Jornada de secretaría · 27/10/2026

Modo: Operate. Extiende Patio y el contrato `.impeccable/roles-direction.md`; la continuación `.impeccable/calendar-evolution-direction.md` autoriza sustituir la paleta temporal del calendario compartido.

THESIS: Coordinar la jornada desde el calendario y registrar la presencia mediante acciones explícitas.

OWN-WORLD: Nunito Sans local, verde funcional, celadón, paneles planos y SVG existentes. Calendario azul/gris azulado con estados escritos de hora prevista, espera, atención y finalizado; hora actual roja. Urgencia con color y texto; identidad de agenda en selector y avatares, separada del tiempo y recepción.

STORY: Perfil incompleto abre el primer ingreso. Sin agendas autorizadas abre el directorio; con al menos una abre jornada. La autorización requiere al titular y no incluye horarios ni chat.

FIRST VIEWPORT: Título y Nuevo turno, incidencia de reprogramación cuando existe, selector de profesionales y calendario. Recepción acompaña al calendario en escritorio con columna de 300px (330px amplia, 260px compacta); hasta 1080px se apila después de la agenda con dos columnas de pacientes, y hasta 760px con una. El calendario móvil conserva selector y desplazamiento horizontal local.

FORM: Calendario compartido y lista de recepción, sin tablas administrativas. Registrar llegada → En espera → En atención → Finalizado exige intervención; reloj y asistencia confirmada no registran presencia. Reprogramar requiere booking:reschedule, conserva profesional/entidad y no cancela la agenda automáticamente.

FINISH: La entrega inicial conserva `review/roles/secretary-{1440,1280,390}.png`, checks.json, access-checks.json y su veredicto. La continuación tiene secretary-{1440,1343,390}.png, urgent-{1440,1343,390}.png y checks.json en `review/calendar-evolution/`; documentation.md registra sus resultados y estado de revisión. DESIGN.md y sidecar incorporan la paleta temporal autorizada; sin raster de producción nuevo.
