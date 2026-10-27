disposition: ship

## verdict

- **P1 — resolved.** Se inspeccionaron `owner-requests-{1440,1280,390}.png` y `access-approved-{1440,1280,390}.png`. La bandeja aparece al comienzo del inicio profesional, identifica a Ana García y Consultorio 01, explica ver/registrar/confirmar/cancelar/reprogramar y excluye modificar horarios y acceder a conversaciones. Aprobar y rechazar quedan visibles y utilizables en escritorio, tamaño intermedio y móvil. La fuente de `ui/agenda-access-requests.ts` limita las solicitudes AGENDA pendientes a agendas propias, presenta error con role alert, aria-busy y acciones deshabilitadas durante saving; está integrada en Dashboard. Las capturas posteriores muestran a secretaría con exactamente una agenda autorizada. `access-checks.json` registra sin errores el recorrido de rechazo, nueva solicitud y aprobación a los tres anchos; el script `salud-web/scripts/verify-agenda-access.mjs` comprueba ausencia de calendario antes del acceso, desaparición de la solicitud resuelta, una única agenda de Elena y ausencia de Mensajes después de autorizar. StaffDirectory.refresh recarga el workspace; la restauración demo observada excluye agenda:configure y deja conversaciones vacías. Evidencia suficiente para cerrar el corte funcional señalado, dentro del recorrido de demostración y la fuente revisada; no se atribuye aquí una nueva prueba de extremo a extremo contra API real.
- **P2 — resolved.** Se reabrieron las mismas rutas `equipo-{1440,1280,390}.png` y `auditoria-{1440,1280,390}.png`. Las facultades de Ana se leen «Admisiones», «Fichas administrativas» y «Seguimiento de avisos»; la creación se lee «Cuenta provisoria creada». Institution.permissionLabel y actionLabel contienen las traducciones de las facultades y nuevos eventos solicitados. El cambio revisado es de presentación y conserva los códigos/concesiones.

Las doce capturas utilizadas en este scoring son válidas: muestran la superficie nombrada desde el inicio del documento, con fuentes asentadas, sin regiones negras o vacías ni desborde global visible. No se observaron regresiones materiales introducidas por esta tanda en los estados corregidos. No se ejecutó otro detector ni se abrió otra búsqueda general. Las pruebas/build adicionales informadas por el implementador no se ejecutaron de nuevo en esta revisión.

## remaining

clear para los dos hallazgos puntuados. Este ship cubre exclusivamente su resolución; no sustituye la revisión completa previa ni amplía sus límites de accesibilidad, backend o cobertura. El cierre de documentación y la finalización del build corresponden al handoff de entrega.

disposition: ship
