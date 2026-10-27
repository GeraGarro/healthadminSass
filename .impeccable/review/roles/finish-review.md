disposition: fix

## Veredicto

Revisión completa nueva, de solo lectura y en contexto separado, del rediseño de roles y de la evidencia aportada por el usuario. La evidencia visual es válida; no corresponde recapture ni rebuild. La composición mantiene Patio y el pedido concreto de perfiles/calendarios. Falta cerrar un recorrido esencial de autorización y completar etiquetas operativas legibles antes de ship.

PRODUCT.md, DESIGN.md, el contrato `.impeccable/roles-direction.md` y el brief de superficie existen. Este alcance es code-led y extiende el mundo vigente: el paquete declara que no hay comp aprobada ni QUALITY BAR card, por lo que no afirmo fidelidad a una imagen inexistente. La composición prescrita por el usuario justifica conservar el mundo y el seed heredado sin abrir otra selección visual.

## Hallazgos materiales con ubicación

1. **P1 — El titular no puede resolver desde la interfaz las solicitudes de acceso a su agenda.** `salud-web/src/app/pages/staff-directory.html:7` envía la solicitud y muestra «Autorización pendiente»; `salud-web/src/app/core/staff.store.ts:72` implementa `resolve`, pero la única UI que lee las solicitudes es `salud-web/src/app/pages/institution.ts:70`, filtrada a `INSTITUCION`. `salud-web/src/app/pages/dashboard.ts:20` muestra el inicio profesional sin bandeja de solicitudes `AGENDA` y sin inyectar StaffStore. Configuración conserva delegación manual, que no identifica ni resuelve la solicitud pendiente. El recorrido solicitado se interrumpe. **Corrección:** ofrecer al titular una bandeja explícita con solicitante, agenda, alcance escrito, aprobar/rechazar, saving, error y resultado; conservar autorización por titular y exclusión de horarios/chat. Verificar secretaría sin acceso → solicitud → titular aprueba/rechaza → estado actualizado y acceso a la agenda cuando corresponda, también en demostración.
2. **P2 — Equipo y auditoría exponen códigos técnicos en información que debe permitir comprender facultades y acciones.** En `equipo-{1440,1280,390}.png`, Ana García presenta `admissions:manage`, `patients:manage` y `notifications:manage`; `salud-web/src/app/pages/institution.ts:96` devuelve el código cuando no pertenece a INSTITUTION_PERMISSIONS, y `institution.html:95` lo imprime como descripción de facultades. En `auditoria-{1440,1280,390}.png`, el alta nueva aparece como «STAFF ACCOUNT CREATED» porque `institution.ts:58,98` no la traduce. **Corrección:** incorporar etiquetas claras en español para las facultades y los nuevos eventos de estos recorridos, sin cambiar sus códigos ni concesiones. La lista de equipo debe permitir entender qué puede hacer cada persona; la auditoría debe nombrar la acción realizada.

La lupa de búsqueda del directorio está desplazada hacia el borde superior del campo en los tres tamaños. Es visible y no tapa ni impide usar el campo: no se eleva a hallazgo material.

## Cobertura del pedido

| Promesa / elemento | Estado | Evidencia e implicación |
| --- | --- | --- |
| THESIS: institución administra personas; secretaría coordina jornada | match | Directorio institucional y jornada de secretaría tienen composiciones y tareas diferentes. |
| OWN-WORLD / TYPE | match | Nunito Sans, pesos y escala consistentes con DESIGN.md; nombres, horarios y acciones conservan jerarquía. |
| OWN-WORLD / MATERIAL | match | Superficies planas, avatares amplios, bordes finos y SVG coherentes; no se simula material físico ni se sustituye una fotografía prometida. |
| OWN-WORLD / GROUND | match | Lienzo claro, celadón y verde profundo declarados en el sistema y visibles en las capturas; no hay comp contra la que atribuir equivalencia de píxeles. |
| FIRST VIEWPORT / FORM: perfiles sin tablas y acción superior | match | Administrador abre tres perfiles en escritorio y una columna en móvil; equipo, sedes y auditoría también se presentan sin tablas. |
| Secretaría con calendario, espacios libres y recepción | match | Tres tamaños muestran agenda por profesional, «Sin turno», espera/en atención y acciones de recepción; en móvil el calendario conserva desplazamiento horizontal local y selector. |
| Alertas urgentes textuales y con color | match | Reprogramación roja con cantidad, explicación y «Reasignar turnos»; los estados también tienen texto. |
| Administrador sin pacientes ni datos de turnos; disponibilidad permitida | match dentro del alcance revisado | Capturas institucionales y cuenta local sin pacientes en navegación ni contenido; careGuard y loadWorkspace excluyen rutas/datos de atención. Se muestran días, horas y «En jornada programada», como se confirmó. Esto no certifica toda la autorización del servidor. |
| Altas con credenciales provisorias y cambio obligatorio | match con comprobación de fuente | Credenciales visibles y explicación en tres tamaños; sesión y rutas derivan a `/cambiar-clave` y Auth usa el cambio provisorio. No se repitió aquí el recorrido real de contraseña. |
| Baja con aviso y conservación de cuenta/vínculos externos | match con comprobación de fuente | La fuente presenta consecuencias y devolución de aviso; checks.json registra baja en tres tamaños. No hay captura del diálogo de baja en este paquete. |
| Profesional existente inicia su vínculo | match con comprobación de fuente | Mi perfil tiene formulario de solicitud; institución presenta instrucciones y revisión de solicitudes INSTITUCION. No hay captura de ese estado en este paquete. |
| Nombre/apellido obligatorios; DNI/domicilio/celular/foto opcionales | match | Onboarding y StaffProfilePage coinciden; validación de nombre/apellido y carga opcional de foto. |
| Sin agendas autorizadas: directorio y solicitud al titular | contradicted en el cierre | La llegada y el envío están implementados; falta la resolución visible para el titular, hallazgo 1. |
| Reasignación de afectados solo con facultad profesional | match dentro de la fuente revisada | La alerta usa pendientes cargados por `booking:reschedule`; la acción conduce a solicitudes. No se inspeccionó una reasignación ejecutada. |
| STORY / FINISH | missing parcialmente | La autorización no tiene su salida visible; la documentación final debe realizarse después de corregir. |

## Evidencia visual, responsive y accesibilidad

Se abrieron individualmente las 24 capturas requeridas: admin, secretary, directory, onboarding, equipo, sedes, auditoria y credentials, cada una a 1440, 1280 y 390px. También se inspeccionaron contact.png, server-admin-1440.png y la captura original del usuario `C:/Users/gerag/AppData/Local/Temp/codex-clipboard-daba9c95-22ab-4b56-9f9c-257bb64f1ae2.png`. Todas las capturas requeridas muestran la superficie nombrada desde el inicio del documento, sin regiones negras, estado de carga incompleto ni desborde global visible. Las listas y formularios se reorganizan de forma legible. La cola y el calendario tienen desplazamiento interno declarado; los recortes locales correspondientes no invalidan la captura completa.

La captura del usuario muestra fallos de carga de profesionales/sedes/agendas/equipo, método GET no soportado y ruta staff-directory inexistente en `127.0.0.1:4387`. La nueva server-admin-1440.png muestra esa cuenta institucional local con tres perfiles, sede y horarios cargados, sin esos errores; server-checks.json registra el mismo origen y ninguna falla HTTP en las pantallas comprobadas. Esta evidencia respalda la corrección local de aquel fallo. No se extrapola a disponibilidad continua ni a otros entornos.

checks.json declara nueve recorridos de navegador, tres por tamaño, sin errores. Los resultados de 90 pruebas Angular, 5 de dominio, build y pruebas API fueron informados en el paquete; no se volvieron a ejecutar ni se inspeccionaron logs completos en esta revisión.

En fuente se observaron etiquetas nativas de formulario, nombre accesible para búsqueda, required en nombre/apellido, aria-pressed para selecciones, role alert/status, foco visible global, teclado del calendario y preferencia de movimiento reducido. Los pares de tokens muestreados dan contraste 5,01:1 (muted/blanco), 4,69:1 (muted/lienzo), 7,75:1 (verde/blanco), 5,56:1 (error/fondo de error) y 5,56:1 (ámbar/fondo pendiente). No se realizó auditoría completa con lector de pantalla, zoom o contraste de todos los estados.

Se conserva la única advertencia del detector, sin ejecutar otro barrido. `staff-profile.ts:14` renderiza `[src]="form.photo"` solo dentro de `@if(form.photo)`; la carga usa FileReader para una imagen seleccionada PNG/JPEG/WebP, con tamaño limitado, y el estado vacío usa iniciales. El warning estático no demuestra una imagen rota y es un falso positivo para ese enlace Angular. La captura del estado sin foto es válida; no se certificó visualmente una foto subida.

El nivel visual propio del modo Operate está alcanzado en las superficies mostradas: precisión, lectura y consistencia. El bloqueo es el cierre funcional señalado, no un cambio de mundo visual.

## Handoff y documentación

Aplicar ambos hallazgos en una sola tanda y devolver para scoring con fuente actualizada y recapturas de los mismos estados/tamaños afectados. Añadir evidencia del titular con solicitud pendiente y resultado, en escritorio y móvil, y del recorrido completo de acceso; el simple registro de resolve en API no prueba una salida utilizable desde la interfaz.

Mantener: directorio de perfiles, calendario por profesional, texto en todos los estados de urgencia, separación institucional de pacientes/turnos y las limitaciones explícitas de delegación. No convertir la corrección de etiquetas en cambios de permisos.

Después de corregir, completar el handoff del documenter contra DESIGN.md y registrar estos patrones como extensión del sistema existente. No se exige generar un raster: la interfaz revisada se apoya en tipografía local, SVG y avatares por iniciales; las fotos opcionales son contenido aportado por cada persona. No se modificó implementación ni se reparó drift de Impeccable.

Límites de lectura: se muestrearon los archivos principales y las rutas/loader relacionados; no se auditó exhaustivamente el backend ni se abrió navegador propio. El contexto cargado menciona buildPath no registrado para futuras superficies Persuade/Experience; no altera esta revisión Operate y no se reparó como efecto lateral.
