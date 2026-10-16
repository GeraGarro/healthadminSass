# ADR-009. Catálogo inicial y facultad de personalización

Fecha: 15 de octubre de 2026. Estado: requerimiento confirmado por el responsable; especificación detallada propuesta para revisión. Reglas relacionadas: R02, R04, R06, R07 y R12. Sin implementación.

## Contexto y fuente

El responsable indicó: «Las practicas comunes son : consulta, extracción, limpieza, cirugia. Pero tenemos dar la posibilidad de establecer la facultad de añadir de manera personalizada más practicas». Solicitó generar toda la documentación del ítem glosario, alcance y catálogo de prácticas.

Posteriormente precisó: «el paciente solo elije horarios para la Practica de "Consulta"» y pidió revisar y actualizar toda la documentación pertinente. Esta aclaración restringe la elección a esa práctica específica; sustituye cualquier lectura anterior que pudiera permitir habilitar otras prácticas por clasificarlas como consulta.

## Requerimiento confirmado

1. Partir de consulta, extracción, limpieza y cirugía como prácticas comunes iniciales.
2. Permitir ampliar el catálogo con prácticas personalizadas, mediante una facultad que pueda concederse explícitamente.
3. El paciente o representante habilitado elige horarios exclusivamente para la práctica específica «Consulta», con oferta habilitada y condiciones válidas. Extracción, limpieza, cirugía y todas las personalizadas se asignan y reprograman por personal autorizado. Nombre, tipo, duración o permiso de catálogo no permiten extender la elección a otra práctica.
4. Mantener aislamiento por entidad, permisos y delegaciones por acción/agenda, y condiciones configurables por profesional/agenda.

## Desarrollo documental propuesto

Se preparan [glosario](../../14-glosario-del-dominio.md), [alcance](../../15-alcance-y-cierre-del-item.md) y [catálogo](../../16-catalogo-de-practicas.md), con separación entre definición de entidad y habilitación por agenda, campos, facultades desglosadas, estados, versiones, auditoría e historias de aceptación.

Estos detalles son propuestas revisables. No se atribuye al responsable la aprobación de un modelo de permisos completo, códigos definitivos, estados o políticas de duplicados por haber solicitado los documentos.

## Consecuencias y pendientes

- La lista no es cerrada ni depende de un cambio de código para ampliarse.
- Crear una práctica no autoriza automáticamente al paciente a elegir horario ni activa otras agendas.
- La propuesta de identificar de forma estable la práctica base «Consulta» aplica la restricción confirmada. La selección no se concede por comparar solo el nombre visible ni por permitir editar una clasificación. El mecanismo técnico definitivo sigue pendiente.
- Duraciones, pausas, recursos, cobertura, sedes y variantes deben validarse con los profesionales del piloto.
- Definir quién concede la facultad de catálogo por entidad y revisar las propuestas antes de implementar.
- Este catálogo de prácticas es interno a la operación de beta; el catálogo público de profesionales continúa como evolución futura.

La entrega actual verifica documentación y ayuda memoria. Los escenarios funcionales se comprobarán cuando exista aplicación; este ADR no declara construida ni probada ninguna función.
