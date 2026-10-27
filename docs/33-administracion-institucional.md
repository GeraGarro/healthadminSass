# Administración de institución

Fecha: 26 de octubre de 2026. Implementación Angular y Spring Boot, integrada con el sistema visual Patio existente.

> Actualización del 27/10/2026: este documento conserva la evidencia de la implementación anterior. El [rediseño vigente de institución y secretaría](34-rediseno-roles-institucion-y-secretaria.md) reemplaza sus reglas sobre presentación del padrón, creación de cuentas y vinculación profesional, y excluye pacientes y datos de atención del administrador institucional incluso con facultades heredadas. La administración ahora crea cuentas nuevas con contraseña provisoria de 48 horas; los profesionales existentes solicitan su vínculo desde su perfil. Días, horarios y «En jornada programada» siguen visibles sin exponer turnos. Ante contradicción, prevalecen el pedido confirmado y el documento 34. Los resultados de pruebas y capturas que siguen corresponden al corte histórico del 26/10.

## Alcance y fuentes

Se revisaron las reglas del dominio, la matriz de permisos (documento 22), las reglas de desvinculación y continuidad (documento 19 y ADR-011), el registro de usuarios (documento 20), el estado del servidor (documento 26) y sus contratos en `salud-api/docs/API.md`.

La matriz documental distingue reglas confirmadas, propuestas y decisiones pendientes. Esta implementación presenta las facultades explícitas que resuelve el servidor existente; **no convierte los permisos pendientes de la matriz en concesiones por el nombre del rol**. El rótulo «Administrador de institución» identifica el espacio de trabajo. Cada lectura y escritura requiere su permiso y contexto.

## Funciones y trazabilidad

| Función | Interfaz | Facultad y comportamiento |
| --- | --- | --- |
| Padrón profesional | `/institucion/profesionales` | `professionals:manage`. Nombres, matrícula de referencia, vínculo, incorporación, finalización y estructura de sedes/agendas. Búsqueda, filtros, orden, paginación y exportación CSV de la selección con protección frente a fórmulas. |
| Incorporación y reactivación | Formulario del padrón | Cuenta existente identificada explícitamente y matrícula verificada. Reutiliza identidad global; no identifica personas por coincidencia de nombre o matrícula. |
| Baja institucional | Detalle profesional o equipo | `members:manage`. Confirmación protegida; bloquea baja propia, turnos futuros y pre-reservas vigentes. Revoca membresía, facultades y delegaciones locales. Conserva identidad, fichaje, historia y otros contextos. Una reactivación no restituye facultades revocadas. |
| Equipo | `/institucion/equipo` | `members:manage`. Consulta membresías activas/revocadas, incorpora cuentas existentes y asigna facultades locales. |
| Facultades | Formulario de equipo | `PUT /members/{id}/permissions` reemplaza la selección vigente. La cuenta no puede retirarse a sí misma la facultad de administrar el equipo. Agenda y chat no son permisos asignables por este formulario. |
| Sedes y estructura de agendas | `/institucion/sedes` | `professionals:manage`. Crea sedes y agendas con zona horaria explícita. Crear una agenda exige sede y profesional activos; no concede lectura de turnos, horarios ni delegaciones. Las agendas cuyo vínculo profesional finalizó lo indican. |
| Políticas | `/institucion/politicas` | `policy:manage`. Lee valores vigentes, configura pre-reserva y máximo activo, referencia de aprobación y cierre automático explícito. Guarda una nueva versión. Los valores configurables no cierran decisiones documentales universales. |
| Auditoría | `/institucion/auditoria` | `audit:read`. Eventos paginados de 50, filtro de la página actual, actor, recurso, resultado y fecha. Sin contraseña, token completo ni cuerpo de chat. |
| Pacientes, admisiones, catálogo y avisos | Pantallas existentes | Solo con `patients:manage`, `admissions:manage`, `catalog:manage`, `coverage:manage` o `notifications:manage`, según la operación. El padrón no concede esas facultades por sí mismo. |
| Seguridad y ayuda | Configuración y Ayuda | Seguridad de cuenta propia y guía específica del rol. La navegación oculta gestión de agendas sin facultades y los formularios se descartan al cambiar contexto. |

## Límites conservados

- Plataforma crea e invita cuentas nuevas y gestiona continuidad entre entidades o actividad independiente. La interfaz institucional incorpora **cuentas existentes**; no simula una invitación ni una transferencia.
- La baja institucional no elimina cuentas globales, fichas, números ni historial. La eliminación global solicitada por el propio profesional mantiene su procedimiento documental pendiente.
- La administración no hereda agendas, fichas ni conversaciones. Las facultades de paciente requieren su concesión explícita; la delegación de agenda corresponde al titular y no concede chat.
- Crear una agenda define estructura. Configurar horarios, ofertas y delegaciones exige facultades de agenda resueltas por separado.
- No hay historia clínica, facturación, pagos, suscripciones ni transferencia automática de fichajes.

## Implementación

- `pages/institution.ts`, `.html` y `.css`: cinco secciones, formularios, padrón/detalle, confirmación de baja, políticas y auditoría.
- `core/institution.store.ts`: DTO tipados, proyecciones paginadas, comandos y aislamiento por versión de contexto. Una lectura fallida se distingue de un listado vacío. Una escritura guardada cuya actualización falla exige recargar antes de otra operación; no se reintenta automáticamente.
- `WorkspaceQueryController`: proyecciones `institution-professionals`, `institution-members`, `institution-branches`, `institution-agendas` e `institution-audit`, cada una con permiso específico y aislamiento de entidad.
- `OrganizationController`: lectura de política y reemplazo de facultades; baja con bloqueos y revocación local.
- `routes`, `layout`, `auth`, `settings` y `help-panel`: entrada y navegación del nuevo rol, demostración explícita, cuenta propia y ayuda.

La demostración usa exclusivamente datos ficticios. Persiste en el navegador por institución y cuenta demo, separada de los datos del servidor. La demo institucional no contiene agendas operables, turnos ni conversaciones. Elena y Paula representan el caso de baja con turnos futuros; Diego permite verificar la baja sin pendientes. No se realizan envíos reales.

## Verificación

### Continuidad visual y documentación

La administración institucional extiende Patio: conserva Nunito Sans local, verde funcional, navegación celadón, superficies planas, estados escritos y foco visible. El padrón usa directorio y detalle; hasta 760 px las filas se apilan y el orden permanece disponible mediante «Nombre A–Z / Nombre Z–A». Esta composición pertenece a la superficie institucional; no introduce una identidad ni tokens globales nuevos.

`DESIGN.md` y `.impeccable/design.json` se conservaron intactos. La comparación final, los límites de evidencia y los desajustes previos se registran en `.impeccable/review/institution/documentation.md`. Las capturas de escritorio y móvil y los resultados están en esa misma carpeta. `finish-review.md` conserva el hallazgo inicial de orden móvil; `verdict-pass.md` registra su corrección y dispone `ship` para ese único hallazgo, sin extender la revisión a toda la aplicación.

### Resultados

- `npm test`: 84 pruebas Angular y 5 pruebas de dominio aprobadas.
- `npm run build`: compilación de producción aprobada.
- PostgreSQL 18.6 descartable con Testcontainers: 42 pruebas de integración completas aprobadas antes del último caso adicional; posteriormente 5 casos institucionales aprobados, incluida pre-reserva vigente, y regresión específica de reactivación sin recuperación de permisos.
- `scripts/verify-institution.mjs`: 18 recorridos funcionales aprobados en 1440, 1280 y 390 px. Incluye filtros/vacío, detalle, baja bloqueada y exitosa, persistencia ficticia, validación, incorporación, exportación, permisos, sede, agenda, política, auditoría, teclado y regresión de los otros roles.
- Detector mecánico Impeccable: sin hallazgos en los archivos de interfaz revisados. Capturas y resultados: `.impeccable/review/institution/`.

Para usar las nuevas lecturas con una cuenta real, reiniciar la API y el frontend con este código. Las pruebas visuales usan demostración; las pruebas de servidor utilizan una base descartable. No se desplegó a producción ni se modificaron cuentas reales.

La verificación de navegador requiere Playwright disponible como módulo (o su ruta en `PLAYWRIGHT_MODULE`), Edge instalado por defecto y frontend en `http://127.0.0.1:4388`. `PLAYWRIGHT_CHANNEL` e `INSTITUTION_TEST_URL` permiten adaptar el entorno; se admiten únicamente direcciones de loopback. Se ejecuta con `node salud-web/scripts/verify-institution.mjs` desde la raíz del proyecto.
