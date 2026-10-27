---
version: 1
slug: "salud-web-src-app-app-ts"
primary_target: "salud-web/src/app/app.ts"
related_targets: ["salud-web/src/styles.css"]
---

# Espacios de secretaría y profesional

Modo: Operate. Angular web. Igual prioridad para clínica y ejercicio independiente.

## Direction contract

THESIS: La jornada es el centro de la experiencia. Calendario y próximos pacientes llevan a acciones administrativas con contexto, sin una fila de métricas que desplace la agenda.

OWN-WORLD: Patio toma la luz, el verde vegetal y las superficies claras de arquitectura de salud contemporánea. Tinta verde profunda, base celadón y selección menta. Nunito Sans humanista local y horas tabulares; controles web familiares. El cambio autorizado del 27/10/2026 usa azul/gris azulado para tiempo, petróleo para atención, ámbar para espera y verde para finalizado dentro de todos los calendarios; identidad de agenda queda en avatares y selectores.

STORY: Identificar entidad y rol, leer la fecha y los turnos, resolver el siguiente pendiente, conservar orientación al abrir detalles. El profesional ve Agenda, Actividad y Aranceles; el propietario independiente también administra Mi personal en su entidad activa. Secretaría coordina agendas delegadas; el administrador institucional conserva perfiles y estructura sin pacientes.

FIRST VIEWPORT: Rail celadón de 224px y barra superior compacta con entidad, búsqueda y perfil. Secretaría con acceso abre selector profesional, calendario y recepción; sin acceso abre directorio, y con perfil incompleto abre primer ingreso. El profesional abre navegación Agenda/Actividad/Aranceles, selección de agenda, calendario y próximos/cancelados; Mi personal aparece para el titular independiente. En móvil las columnas auxiliares siguen al calendario. Hoy abre cerca de la hora actual y la selección compartida de día relaciona calendario y listas.

FORM: Candidata 7, arquitectura de salud con patios y luz natural. Lista fundada: señalética institucional, tarjetas de cita, herbarios, gráfica de salud pública, textiles sanitarios, índices de biblioteca, patios contemporáneos. seed:8657e53ae5336fbd. Patio elegida expresamente por el usuario mediante herramienta estructurada tras fallar la página de decisión.

FINISH: La evidencia inicial y el rediseño de roles se conservan en `.impeccable/review/`. La continuación de calendario se documenta en `review/calendar-evolution/documentation.md`, con capturas finales, resultados y estado de veredicto. DESIGN.md y sidecar incorporan exclusivamente el cambio de sistema de calendario autorizado.

## Alcance

Acceso, recuperación/activación y MFA; contexto; jornada; agenda diaria/semanal/mensual y lista; nuevo turno con pacientes registrados o alta de seis datos y reutilización local por DNI; confirmación, cancelación y reprogramación; cancelación protegida por día/semana/mes; pacientes y ficha administrativa; solicitudes; avisos; chat; prácticas y coberturas; actividad, aranceles de referencia versionados, reportes; horarios, ausencias, delegación, personal independiente y cuenta. Datos demostrativos etiquetados. Sin funciones clínicas ni facturación.
