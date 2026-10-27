## verdict

Evidencia válida: releídas las mismas 30 capturas requeridas y las tres draft-restored-1440.png, draft-restored-1343.png y draft-restored-390.png. Corresponden a sus escenarios y anchos; los diálogos mantienen el desplazamiento interno declarado. Sin navegador, edición de código ni segunda ejecución del detector. Este pase puntúa únicamente los dos hallazgos del finish-review.md.

1. **resolved — Truth / borrador del alta.** Las tres draft-restored muestran «Borrador recuperado», la acción Descartar, el modo Nuevo paciente y los datos que entran en el cuerpo visible; conservan profesional y franja. BookingDraft y close() ahora incluyen patientMode y registration; al recuperar se restaura ese objeto y se vuelve a consultar DNI, y la disponibilidad se revalida para el paciente seleccionado. TemporaryDrafts usa exclusivamente Map en memoria y copias estructuradas; invalidateContext() vacía las entradas y discardDraft() reinicia modo y datos. El recorrido suministrado verifica por separado los seis valores, incluidos los que quedan fuera del viewport modal, y después registra paciente y turno en los tres anchos; checks.json conserva errors: []. Las pruebas incorporadas cubren recuperación íntegra, consulta de DNI, descarte y limpieza al salir. La promesa visible del pie queda respaldada por el comportamiento implementado.
2. **resolved — Persistence / cierre documental.** DESIGN.md actual registra los pares temporales, sus seis estados y precedencias, identidad de agenda separada de recepción/asistencia, la nueva composición de jornada y las superficies Agenda/Actividad/Aranceles/cancelación. .impeccable/design.json parsea correctamente y contiene tokens y ejemplo de los seis estados; su descripción explicita que recepción prevalece sobre el horario. La documentación coincide con la paleta y las composiciones conservadas en las recapturas. También describe el borrador temporal del alta y su revalidación.

## remaining

clear. Sin regresiones materiales observadas atribuibles al lote. El ship cubre los fixes puntuados, no toda la superficie.

disposition: ship
