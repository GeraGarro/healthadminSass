---
version: 1
slug: "salud-web-src-app-ui-calendar-ts"
primary_target: "salud-web/src/app/ui/calendar.ts"
related_targets: ["salud-web/src/app/ui/calendar.html","salud-web/src/app/ui/appointment-panel.ts","salud-web/src/app/ui/appointment-panel.html","salud-web/src/app/pages/professional-home.ts","salud-web/src/app/pages/professional-home.html","salud-web/src/app/pages/professional-home.css"]
---

# Turnos y espacio profesional · 27/10/2026

Modo Operate. Cambio solicitado: corregir pacientes al reservar, dar de alta o reutilizar por DNI; seis campos obligatorios. Cancelar turnos futuros por día/semana/mes con avisos y reasignación. Profesional independiente administra su personal y sus turnos; estadísticas y aranceles de referencia.

## Direction contract

THESIS: El calendario concentra la jornada; seleccionar una franja mantiene profesional y horario, y el paciente se elige o registra dentro de ese contexto.

OWN-WORLD: Mantener Patio, Nunito Sans y navegación celadón. Cambio de sistema autorizado: azul para próximos, gris azulado para pasado, azul petróleo con contorno para hora prevista actual, petróleo con blanco para atención, ámbar para espera y verde para finalizado. Líneas nítidas, estado escrito y hora actual roja. El par temporal sustituye el color de agenda dentro de turnos; la identidad profesional permanece en avatares y selectores. El reloj no presume presencia ni atención.

STORY: Elegir franja, seleccionar paciente vinculado entre todos los resultados o registrarlo, detectar DNI existente y confirmar su vínculo. El profesional coordina su agenda, revisa actividad/aranceles y suspende un período con consecuencias y avisos visibles.

FIRST VIEWPORT: Calendario principal amplio con leyenda temporal y selección de agenda. Nuevo turno inicia con el profesional y la franja; dos opciones Paciente registrado/Nuevo paciente. Espacio profesional ofrece Agenda, Actividad y Aranceles; Mi personal aparece para el propietario independiente. Cancelación protegida muestra período, cantidad afectada y motivo antes de confirmar.

FORM: Extensión funcional y sustitución de paleta de calendarios expresamente solicitadas. Sin ronda de nueva identidad. seed:8657e53ae5336fbd (heredada).

FINISH: Evidencia en `../review/calendar-evolution/`: Día/Semana/Mes/Lista, alta, coincidencia DNI, borrador recuperado, actividad, aranceles, cancelación, aviso urgente y personal independiente. Recorridos de 1440, 1343 y 390px en checks.json; resultados, revisión y estado de veredicto en documentation.md. DESIGN.md y sidecar actualizados al CSS final. No hay raster de producción nuevo.

## Comportamiento implementado

Los estados de recepción prevalecen en orden finalizado, atención y espera; después se clasifica el horario pasado, previsto actual o próximo. Una hora pasada no cuenta como atención finalizada. Seleccionar una celda conserva agenda, profesional y hora.

El selector recorre todos los pacientes vinculados al profesional mediante paginación completa. Nuevo paciente exige nombre, apellido, DNI, correo, celular internacional y domicilio; una coincidencia local puede seleccionarse o vincularse sin exponer otra institución. Alta y vínculo no reservan el turno. La identidad global mínima no contiene nombres, contactos, tenant ni atención; las fichas administrativas conservan aislamiento local.

El borrador de turno conserva en memoria contextual modo y seis datos del paciente nuevo. Recuperarlo reconsulta DNI y disponibilidad según corresponda; descartar, recargar, salir o cambiar contexto lo elimina. No se convierte en persistencia de pacientes ni reserva.

Cancelar día, semana de lunes a domingo o mes requiere titularidad, previsualización, motivo y checkbox. Preserva iniciados por hora o con atención/finalización explícitas; crea suspensión, libera pre-reservas y registra cancelaciones, reasignaciones y avisos. La entrega externa requiere destinos autorizados y canales configurados; local es simulada. Modelo y endpoints en [documento 35](../../docs/35-turnos-pacientes-y-espacio-profesional.md).
