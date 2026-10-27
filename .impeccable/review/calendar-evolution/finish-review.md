disposition: fix

Alcance: extensión Operate de Patio, code-led; no comp aprobado ni nueva QUALITY BAR card. Sin leer: backend, pruebas completas y partes no muestreadas de communications.ts/styles.css; su verificación funcional se apoya en el paquete de pruebas provisto, no en una auditoría independiente del servidor.

## persistence

Fail de cierre documental. PRODUCT.md existe y conserva separación institucional, facultades explícitas y demostración ficticia. DESIGN.md conserva Patio, pero todavía prescribe colores de evento por agenda y el resumen anterior de jornada; no registra la paleta temporal implementada ni las superficies profesionales nuevas. La actualización posterior del documenter está prevista y debe cerrarse antes de entregar. No corresponde exigir estado de reproducción o ronda de comps a esta extensión code-led.

Evidencia: las 30 capturas requeridas existen y se inspeccionaron: nueve escenarios a 1440, 1343 y 390px, más professional-week-1440.png, professional-month-1440.png y professional-list-1440.png. Dimensiones y contenido coinciden; no hay áreas negras o vacías. El documento está arriba y los diálogos nativos conservan su viewport de 1000px con desplazamiento interno; en new-patient-390.png el foco desplazó ese cuerpo, tal como declara el paquete. No se interpreta la parte del documento que queda debajo del viewport modal como un fallo de captura. checks.json registra nueve recorridos y errors: []; detector.json contiene []. No se abrió navegador ni se volvió a ejecutar el detector.

## fidelity

| Promesa o elemento | Estado | Evidencia |
| --- | --- | --- |
| TYPE | match | Nunito Sans local; nombres y horarios con prioridad, pesos claros y numerales tabulares; misma voz humanista Patio en los tres anchos. |
| MATERIAL | match | Superficies planas, líneas finas, SVG geométrico coherente y elevación localizada; no hay física fingida ni placas raster prometidas. |
| GROUND | match | Lienzo #f6f8f6, rail celadón #e9efea y superficies blancas conservados en CSS y capturas; el campo del calendario adopta los azules pedidos en OWN-WORLD. |
| THESIS: calendario como centro y franja conservada | match | secretary-* y new-patient-*/patient-match-* muestran contexto de profesional y 12:00; el código conserva requestedTime al seleccionar o registrar paciente. |
| OWN-WORLD: legibilidad y estados temporales separados de recepción | adaptation | Cambio de paleta expresamente autorizado y escrito en el contrato: próximo azul, pasado gris azulado, atención petróleo/blanco y espera ámbar. Etiquetas y hora actual visibles; recepción se registra explícitamente. |
| STORY: paciente relacionado, alta y detección por DNI | match | Dos modos dentro del turno, seis campos etiquetados y resultado de DNI con selección o vínculo. loadCandidates usa readAllPages; el paquete informa prueba con 237 pacientes. La operación permanece en su institución. |
| STORY: espacio profesional | match | Agenda principal, próximos/cancelados, Actividad y Aranceles visibles; cancelación ofrece día/semana/mes, preview, motivo y confirmación. La copia dice avisos registrados y reasignación pendiente. El código de próximos excluye ATENCION/FINALIZADO. |
| FIRST VIEWPORT | match | Calendario dominante, selección de agenda y acciones reconocibles. En móvil el contexto y los controles preceden a la grilla, y las superficies auxiliares reordenan en una columna sin desbordar documento. |
| FORM | match | Extensión funcional de Patio sin nueva identidad. concept-seed --check-seed seed:8657e53ae5336fbd devuelve SEED KNOWN; la referencia heredada queda corroborada. |
| Personas y alertas urgentes | match | Personal independiente en perfiles, sin tablas de personas. El aviso de cancelación, su texto, icono y señal superior son rojos en urgent-*. |
| Verdad del borrador del alta | contradicted | appointment-panel.html:327 promete guardar «tus cambios» al cerrar; BookingDraft (appointment-panel.ts:31) y close() (:281) solo guardan form/coverageMode/patientLabel. Al reabrir se reinician patientMode y los seis datos registration (:109). Se pierde el alta aún no registrada pese a la promesa visible. |

No se observan incumplimientos materiales adicionales del craft floor en las capturas. La revisión no amplía las pruebas suministradas a una certificación de accesibilidad o de aislamiento del servidor.

## ceiling

reached para la extensión comprometida: marco celadón, contraste operativo, tipografía humanista, profundidad localizada y controles familiares conservados. No hay autoridad de una nueva QUALITY BAR card para pedir ornamento, materiales o movimiento ajenos al mundo existente.

## material_fixes

1. Truth / borradores: preservar patientMode y registration en el borrador contextual, limpiarlos con las mismas reglas de contexto y revalidar DNI/disponibilidad al continuar, o acotar explícitamente la promesa del pie cuando se está dando de alta un paciente; cerrar y reabrir antes de registrar no puede perder seis campos mientras la interfaz promete conservarlos. Evidencia: appointment-panel.ts:31, :109, :281 y appointment-panel.html:327.
2. Persistence / FINISH: cerrar con el documenter DESIGN.md y .impeccable/design.json para que describan la paleta temporal autorizada, la separación de identidad de agenda/estado, el espacio profesional y la nueva composición de jornada; hoy el sistema persistido todavía afirma que el par tonal del turno depende de la agenda.

## keep

Conservar el calendario dominante y nítido, la franja/profesional elegidos, los estados escritos con recepción explícita, la cancelación protegida y las alertas urgentes rojas.
