disposition: fix

No se aportó una QUALITY BAR independiente; se evalúa la extensión contra DESIGN.md y el contrato Patio existente. Comp, diff y placas raster no aplican al camino de código directo. Integraciones de layout, routes, auth, settings y help-panel no se inspeccionaron exhaustivamente; se revisaron los archivos primarios y los resultados funcionales aportados.

## persistence

pass. PRODUCT.md, DESIGN.md, contrato de superficie y docs/33-administracion-institucional.md existen. DESIGN.md corresponde al mundo renderizado: Nunito Sans, verde Patio, rail celadón, superficies planas y profundidad localizada. La referencia heredada de FORM fue corroborada: `concept-seed --check-seed seed:8657e53ae5336fbd` devuelve `SEED KNOWN`. No hay una nueva ronda de identidad que requiera comp o estado de reproducción. Detector aportado: `[]`. Las 28 capturas requeridas existen y muestran el documento desde arriba, con contenido correspondiente a su estado y anchos 1440, 1280 o 390; ninguna requiere recaptura. Los avisos transitorios de estructura y política son estados reales de confirmación, sin invalidar la evidencia de esas vistas.

## fidelity

| Elemento / promesa | Estado | Evidencia |
| --- | --- | --- |
| TYPE | match | Nunito Sans y jerarquía compacta coherentes con OWN-WORLD y DESIGN.md en los tres anchos. |
| MATERIAL | match | Superficies de aplicación planas, bordes finos y SVG del sistema; sin imitación de material físico. |
| GROUND | match | Campo claro, rail celadón y verde funcional coinciden con los tokens de DESIGN.md; no aparece una nueva temperatura de fondo. |
| THESIS | match | Profesionales abre el espacio; el detalle distingue vínculo y estructura de acceso a turnos o chat. |
| OWN-WORLD | match | Shell, controles, estados textuales, iconografía y foco mantienen Patio. |
| STORY | match | Búsqueda, vínculo, sede, incorporación de cuenta existente y revisión protegida de baja aparecen en contexto; equipo, estructura, política y auditoría permanecen en el rail. |
| FIRST VIEWPORT | match | Directorio inicial, acción principal, resumen compacto y filtros preceden a nombres, matrícula, sedes y vínculo en 1440 y 1280. |
| Directorio y detalle en móvil | adaptation | Filas verticales y detalle primero, a ancho disponible, conforme a FIRST VIEWPORT; `mobile.png` y `detail-390.png` conservan datos y acciones legibles. |
| Orden del padrón en móvil | missing | `mobile.png` carece de control de orden. El único botón está dentro de `thead` en institution.html:56 y institution.css:117 oculta ese encabezado hasta 760px. La función documentada queda inaccesible en teléfono. |
| FORM | match | Se extiende la composición directorio/detalle existente; seed heredado validado y sin identidad nueva. |
| Estados, foco y validación | match | Vacío con recuperación, controles deshabilitados, error de baja y errores junto a campos son visibles. Las capturas de vacío, formulario y facultades muestran anillo de foco; institution.ts:90–102 conserva orientación y retorno de foco. |
| Verdad de la demostración | match | El shell identifica demostración; datos y direcciones ficticios se declaran, y los mensajes de guardado nombran la demostración. No se afirma despliegue productivo. |

## ceiling

reached para la extensión Operate del mundo Patio en jerarquía, densidad, continuidad directorio/detalle y contención visual. No hay una firma gráfica nueva exigida ni un recurso material pendiente de producir. La paridad funcional móvil tiene el único hallazgo material de esta revisión.

## material_fixes

1. [P2] Restituir el orden del padrón hasta 760px con un control visible y accesible, enlazado al mismo `sort` y reinicio de página: `salud-web/src/app/pages/institution.css:117` oculta el único disparador de `salud-web/src/app/pages/institution.html:56`; `mobile.png` prueba su ausencia. Verificar A–Z/Z–A en 390px y regenerar las capturas con las mismas rutas. Check: cobertura del alcance documentado y responsive.

## keep

Conservar Patio, el padrón como entrada, la continuidad con el detalle, las consecuencias explícitas de la baja y la separación entre facultades institucionales, agenda y chat.
