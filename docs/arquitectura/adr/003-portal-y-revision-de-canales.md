# ADR-003. Portal principal y revisión de canales

Fecha de decisión: 15 de octubre de 2026. Estado: portal principal aceptado; incertidumbre inicial sobre correo/respaldo resuelta posteriormente en ADR-004. Chat resuelto en ADR-005 y consolidación final en ADR-008.

## Contexto

Tras evaluar el costo de WhatsApp como vía habitual, el responsable confirmó portal con autogestión y pidió evaluar correo, respaldo WhatsApp, preferencia de canal y costo de API integrado al total de membresía. Esta decisión cambió la prioridad de canales; no eliminó las reglas de permisos, representación ni auditoría.

## Decisión y resolución posterior

- Portal como centro de consulta y gestión; WhatsApp deja de ser canal principal.
- La inclusión del respaldo quedó inicialmente abierta. ADR-004 la resolvió para beta: correo T-72/T-48 y WhatsApp T-36 pendiente, ambos operativos; T-24 cancelar/liberar y avisar en plataforma a personal autorizado.
- Comunicaciones dentro del abono total como dirección comercial, sin precio/cupos aprobados ni motor de suscripciones en I1. Condiciones transparentes; adicional API separado queda como antecedente comparativo.
- Chat estaba inicialmente pendiente; ADR-005 lo incorporó como chat humano paciente-profesional y limitó selección a la práctica «Consulta» habilitada. IA sigue pendiente.

## Consecuencias y evidencia

[ADR-004](004-confirmacion-por-correo-y-respaldo.md) y [ADR-005](005-chat-y-seleccion-de-consultas.md) rigen cronograma y portal. [ADR-008](008-consolidacion-del-chat.md) acepta la dirección final de admisión/defensa y [estado consolidado](../../13-estado-consolidado-y-pendientes.md) identifica pendientes. Verificar destinatario, proveedor real, eventos, permisos, asistencia/fallos y cuotas. Abrir/leer no confirma; no declarar integración operativa con un simulador.

Análisis económico en [portal, correo y membresía](../../09-portal-correo-y-membresia.md). Fuentes e importes se conservan del chat, sin nueva consulta ni contratación por esta actualización.
