# ADR-007. Acceso sujeto a admisión administrativa

Fecha: 15 de octubre de 2026. Estado: requisito funcional aclarado y análisis aceptado posteriormente en ADR-008; mecanismos y parámetros por especificar.

## Instrucción

El responsable solicita acceso directo con mecanismos como los botones de teléfono/Google/Facebook/Apple de su imagen de referencia, pero solo tras aceptación administrativa: secretaría registra datos del paciente o acepta el formulario para atenderse con el profesional. Pide evaluar su adecuación para beta. La imagen es referencia de experiencia, no selección de todos esos proveedores.

## Decisión funcional

Acceso al portal privado del contexto aprobado sujeto a admisión por personal con facultad explícita. Se resuelve la indefinición de ADR-006 sobre quién habilita al nuevo: personal administrativo autorizado, por ejemplo secretaría. La mera presentación del formulario o autenticación externa no da acceso a reservas, fichas ni chat. Activación y verificación de vínculo/contacto preceden a una sesión con facultades de paciente.

La aprobación es persistente mientras esté vigente; no se repite en cada login. La cuenta de acceso puede reutilizarse sin compartir fichas ni conceder permiso en todas las entidades. Una revocación local afecta ese contexto y no cancela turnos automáticamente ni destruye la cuenta global. Política de nuevo empadronamiento entre entidades sigue en análisis.

## Dirección adoptada al aceptar el análisis (ADR-008)

Para beta, pocos métodos de acceso: Google y alternativa por correo; teléfono, Apple y Facebook quedan por evaluar. Formulario propio protegido y estados pendiente/aprobado con activación pendiente/activo/rechazado/suspendido-revocado adoptados como dirección. Mecanismo de correo/sesión, vinculación, transiciones, recuperación, verificación, responsables y plazos se especifican antes de implementar. Defensa por capas aceptada, con cuotas numéricas, umbrales y proveedor anti-bot pendientes. La última aceptación del chat consta en [ADR-008](008-consolidacion-del-chat.md).

La evaluación considera el procedimiento adecuado para beta si el servidor exige aprobación en cada operación y se verifican la vinculación y los controles complementarios. Ver [análisis de acceso](../../12-acceso-con-aprobacion-administrativa.md). ADR-004 y ADR-005 mantienen cronograma y restricciones de prácticas/chat.
