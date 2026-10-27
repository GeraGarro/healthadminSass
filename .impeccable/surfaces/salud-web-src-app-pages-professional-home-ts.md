---
version: 1
slug: "salud-web-src-app-pages-professional-home-ts"
primary_target: "salud-web/src/app/pages/professional-home.ts"
related_targets: ["salud-web/src/app/pages/professional-home.html","salud-web/src/app/pages/professional-home.css","salud-web/src/app/core/professional-workspace.ts","salud-web/src/app/ui/calendar.ts"]
---

# Agenda, actividad y aranceles · 27/10/2026

Modo: Operate. Extensión de Patio y del contrato `.impeccable/calendar-evolution-direction.md`; cambio de sistema autorizado únicamente en la paleta temporal de calendarios. seed:8657e53ae5336fbd heredada.

THESIS: El profesional puede coordinar su atención desde la agenda propia, revisar resultados registrados y mantener importes de referencia sin depender de secretaría.

OWN-WORLD: Nunito Sans local, navegación celadón, verde funcional, paneles planos y SVG existentes. El calendario compartido usa colores temporales con texto; atención finalizada exige registro explícito. Importe y cantidades usan cifras tabulares.

STORY: Agenda reúne franja, paciente, próximos y cancelados. Actividad consulta un período y cuenta finalización explícita. Aranceles conserva versiones en ARS/USD. Mi personal permite al propietario independiente administrar su equipo en la entidad activa, sin ampliar permisos en otras instituciones.

FIRST VIEWPORT: Título y navegación horizontal Agenda/Actividad/Aranceles, con Mi personal solo para propietario independiente. Agenda ofrece Nuevo turno, solicitudes de acceso, selector de agenda y Cancelar un período; calendario flexible con próximos/cancelados a la derecha. Actividad usa resumen y movimiento diario; Aranceles muestra prestaciones y editor. Hasta 1080px se apilan calendario y editor; en móvil el contexto y las acciones ocupan el ancho disponible.

FORM: Cancelación en diálogo contenido: día, semana de lunes a domingo o mes; cantidad, fechas, motivo y checkbox antes de confirmar. Preserva los iniciados por hora o con ATENCION/FINALIZADO. La operación idempotente suspende el intervalo, libera holds y registra cancelaciones, pendientes de reasignación y avisos urgentes internos más outbox correo/WhatsApp. Destinos autorizados y canal configurado condicionan entrega; local SIMULADA. Los aranceles son referencia versionada, sin cobros ni comprobantes. Administración institucional continúa sin pacientes.

FINISH: professional-{1440,1343,390}.png, activity-{1440,1343,390}.png, fees-{1440,1343,390}.png, cancel-period-{1440,1343,390}.png e independent-staff-{1440,1343,390}.png y checks.json en `review/calendar-evolution/`. La revisión y el estado de veredicto se conservan en documentation.md. [Modelo y endpoints](../../docs/35-turnos-pacientes-y-espacio-profesional.md).
