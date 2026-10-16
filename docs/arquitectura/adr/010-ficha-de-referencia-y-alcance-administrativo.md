# ADR-010. Ficha de referencia y alcance exclusivamente administrativo

Fecha: 15 de octubre de 2026. Estado: confirmado por el responsable. Reglas relacionadas: R01, R06, R07 y R12. Sin implementación.

## Contexto y fuente

El responsable aportó dos fotografías de una ficha dental utilizada para pacientes con cobertura médica para estudiar la información administrativa y la distinción respecto de pacientes sin cobertura. Ante la separación propuesta entre datos administrativos y contenido clínico, precisó: «Mi idea es seguir manteniendo en esta versión la funcionalidad de solo turnero y gestión administrativas, por lo cual odontograma y demas especificaciones quedan fuera».

## Decisión confirmada

1. Mantener esta versión centrada en turnos y gestión administrativa, reafirmando el alcance existente.
2. Usar la ficha aportada como referencia para estudiar identificación y cobertura médica. Los campos concretos, su obligatoriedad y las comprobaciones requieren revisión.
3. Excluir odontograma y demás especificaciones clínicas: anotaciones por diente/cara, radiografías, registro clínico de prestaciones, firmas clínicas y auditoría odontológica de la planilla.
4. Conservar el catálogo administrativo de prácticas para organizar turnos, los estados administrativos de asistencia/atención y la auditoría de operaciones del sistema ya incluidos. No equivalen a documentar una prestación clínica.

## Consecuencias y pendientes

El [análisis de ficha y cobertura](../../18-ficha-paciente-y-cobertura-medica.md) continúa únicamente por su parte administrativa. No se propone como siguiente paso ampliar el producto con una historia clínica ni reproducir integralmente el formulario.

La confirmación de alcance no aprueba por sí sola la propuesta de modalidad por turno, todos los campos de afiliación, reglas de importación/fusión ni una nueva decisión sobre numeración. Esos detalles conservan su estado previo y se revisarán dentro del alcance administrativo.
