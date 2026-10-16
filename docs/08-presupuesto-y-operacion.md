# Presupuesto, versiones y operación en VPS

Consolidación: 15 de octubre de 2026, usando exclusivamente este chat. Fuentes, tarifas y versiones del relevamiento anterior se conservan sin nueva consulta; el seguimiento local posterior se distingue en la sección de referencias técnicas. Ver [estado consolidado](13-estado-consolidado-y-pendientes.md). Alcance: análisis y decisiones para V1 beta; todavía no existe aplicación desplegada. Importes en USD por mes, sin contratación ni conversión a pesos.

**Ampliación ADR-005:** chat humano del portal y selección por paciente solo para la práctica «Consulta» habilitada incorporados a V1. El chat requiere revisar desarrollo, almacenamiento, permisos, monitoreo y tiempo de respuesta humano; las tablas de envío no calculan ese costo total. No implica mensajes WhatsApp externos por cada conversación ni nueva tarifa comercial aprobada. La IA sigue pendiente.

**Revisión posterior de estrategia:** ADR-004 concreta portal principal, correo de solicitud entre T-72/T-48, WhatsApp T-36 sin confirmar y cancelación/liberación/aviso interno T-24. El [modelo de comunicaciones y abono](09-portal-correo-y-membresia.md) calcula ese flujo y separa los supuestos económicos. Los escenarios sustituidos se retiraron de esta guía y se archivaron.

## Decisiones del responsable

- Aceptadas las propuestas 1-5 de la revisión de producto: odontología inicial extensible, entidades mixtas, turnos y confirmación diferenciados, menores/representantes, delegación y auditoría. Registro: [ADR-002](arquitectura/adr/002-producto-y-operacion-inicial.md).
- Objetivo de aproximadamente 20 profesionales en uso a los tres meses y hasta 100 al año. No son usuarios simultáneos ni límites comerciales.
- Mayor actividad profesional de lunes a viernes, de 08:00 a 20:00, usando como referencia America/Argentina/Buenos_Aires. Las zonas horarias de cada agenda siguen siendo explícitas.
- Angular, Spring Boot y PostgreSQL en versiones actuales; se adopta como criterio operativo la última estable compatible al implementar, con revisión continua y versiones fijadas.
- Acceso e interfaz según identidad, roles, entidad y autorizaciones configuradas; validación obligatoria en servidor.
- Alojamiento en VPS con capacidad validada. Proveedor, región y plan no elegidos.

## Presupuesto del flujo vigente

El presupuesto se calcula sobre el flujo de ADR-004: un correo de solicitud por turno elegible y un WhatsApp a T-36 únicamente para el subconjunto que siga sin confirmar. Se suman por separado altas, recuperación, cambios, comprobantes y aviso al paciente tras cancelación, con sus políticas por definir. El aviso interno a secretaría/profesional no es otro WhatsApp.

La hipótesis de planificación es 100 vínculos por profesional y un turno mensual por vínculo. No equivale a pacientes únicos ni a capacidad demostrada.

| Magnitud | 20 profesionales a tres meses | Hasta 100 al año |
| --- | --- | --- |
| Turnos mensuales bajo la hipótesis | 2.000 | 10.000 |
| Correos de solicitud, si todos son elegibles | 2.000 | 10.000 |
| Respaldos WhatsApp si el 10% lo necesita | 200 | 1.000 |
| Respaldos WhatsApp si el 100% lo necesita | 2.000 | 10.000 |

Los porcentajes son escenarios de sensibilidad, no tasas medidas. Los turnos cercanos y las excepciones operativas pendientes pueden cambiar el volumen. No se presupuestan tres avisos por turno como obligación del producto.

Las tarifas del relevamiento previo se usan solo como supuestos fechados, sin nueva verificación ni contratación. El [modelo de comunicaciones](09-portal-correo-y-membresia.md) reúne los escenarios del flujo vigente. Antes de contratar se deben verificar tabla oficial, intermediario, dominios, impuestos, límites y operación.

El costo integral incluye VPS, copias externas, monitoreo, soporte humano, comunicaciones, incorporación de entidades, desarrollo y demás gastos aplicables. No hay precio comercial, cupo, margen ni rentabilidad aprobados. La dirección aceptada es integrar comunicaciones al abono total con alcance transparente; el motor de suscripciones sigue en I2/I3.

Los escenarios anteriores de WhatsApp intensivo, tres avisos por turno y ofertas con un adicional separado se conservan únicamente en el [archivo histórico](archivo/2026-10-15-analisis-sustituidos.md).

## Referencias técnicas y política de actualización

La fuente local más reciente es el [seguimiento del 15/10/2026 a las 09:11](seguimiento/2026-10-15-0911-versiones.md). Esta limpieza usa ese informe, sin volver a consultar sus fuentes ni presentar sus números como versiones instaladas o verificadas hoy.

| Componente | Última referencia registrada en ese informe | Pendiente antes de fijar la base |
| --- | --- | --- |
| Spring Boot | 4.1.1 | Java, BOM y bibliotecas compatibles; arranque y seguridad |
| Spring Security | 7.1.1 administrada por el BOM de referencia | Confirmar conjunto y funciones usadas |
| Angular | 22.2.3, candidata que reemplaza la referencia anterior 22.2.2 | CLI, Node.js, TypeScript y RxJS compatibles |
| Angular CLI | 22.2.2 registrada para CLI | No igualar automáticamente su parche al del framework |
| PostgreSQL | 18.6 | JDBC, extensiones, migraciones, RLS y versión mantenida al desplegar |
| Node.js | 24.22.0 LTS observada; rama 24 propuesta | Revalidar parche, soporte y compatibilidad del conjunto |
| Java | JDK 25 como propuesta; referencia Oracle 25.0.4.1+1 | Elegir distribuidor y parche mantenido; no extrapolar condiciones de Oracle |

El informe conserva avisos y límites de comprobación de compatibilidad; deben revisarse al implementar. No se adoptan versiones preliminares ni se declara una auditoría de vulnerabilidades sin aplicación y árbol de dependencias. Las referencias anteriores permanecen solo como historial del seguimiento y del archivo.

Cada actualización debe identificar versión actual/objetivo, cambios incompatibles, vulnerabilidades corregidas, dependencias, pruebas, backup y reversión. Fijar versiones reproducibles; no usar imágenes o paquetes `latest` sin versión en despliegues. Las migraciones mayores de PostgreSQL requieren un plan de datos específico; bajar una imagen no revierte una migración de datos.

La frecuencia de seguimiento documentada es **cada 15 días a las 09:00 de America/Buenos_Aires**. Identificador registrado: `revisar-versiones-del-sistema-de-salud`. Su estado de ejecución no se consulta ni modifica en esta limpieza. El seguimiento revisa fuentes oficiales y comunica solo novedades relevantes o errores que requieran acción; no instala ni despliega automáticamente. Para trabajo sobre archivos locales, el equipo y la aplicación deben estar disponibles. Referencia: [OpenAI: tareas programadas](https://learn.chatgpt.com/docs/automations?surface=app).

## Acceso, sesiones e interfaces

**Confirmado:** tanto el acceso como las funciones visibles dependen de la identidad y de las autorizaciones configuradas.

Flujo propuesto: servidor verifica credenciales, crea sesión protegida, resuelve membresías/roles/delegaciones y devuelve al frontend el contexto autorizado. Angular presenta las vistas correspondientes. En usuarios con varios roles o entidades, seleccionar contexto sin perder la separación de permisos. Cada solicitud de API vuelve a exigir facultades sobre el recurso; ocultar un botón o una ruta no autoriza una operación.

Registrar accesos exitosos/fallidos, cierres y revocaciones relevantes en servidor, con datos mínimos. La interfaz no registra contraseñas ni replica tokens en logs. La auditoría de negocio identifica actor real y paciente representado. ADR-007/008 exige admisión administrativa y vinculación verificadas antes del acceso privado; dirección Google + alternativa por correo aceptada. Credencial válida sin admisión no concede facultades. El mecanismo concreto de correo, sesión/CSRF, recuperación y enlace de identidades se especificará en seguridad; sesiones de servidor con cookies protegidas son la dirección recomendada, sin afirmar implementación. La revocación se aplica en cada petición.

## VPS: capacidad inicial y evolución

**Alojamiento aceptado:** VPS. **Perfil propuesto para presupuestar el piloto:** Linux mantenido, 4 vCPU, 8 GB RAM y aproximadamente 100 GB SSD/NVMe, con posibilidad de ampliar. Es una hipótesis de ingeniería, no una capacidad probada ni cotización de proveedor. Reservar memoria para sistema, base, aplicación y worker; no asignarla íntegra al heap Java. Compilar fuera del servidor productivo.

Distribución inicial propuesta: proxy HTTPS que sirve la interfaz compilada, API Spring Boot, PostgreSQL y worker de tareas persistidas; accesos de base restringidos. Backups cifrados en almacenamiento externo al VPS, rotación de logs, alertas y entornos de desarrollo/prueba separados de producción. Monitorizar CPU, RAM, disco, E/S, conexiones, tiempos de respuesta y retraso de avisos.

Los horarios comerciales identifican un pico previsto, no una ventana de apagado. El paciente puede gestionar turnos fuera de ese horario y las tareas de aviso deben respetar los plazos y horarios de contacto acordados. Disponibilidad del servicio propuesta: continua, salvo mantenimiento planificado.

Un solo VPS puede ser adecuado para comenzar si supera pruebas, pero concentra un punto de fallo. No ofrece alta disponibilidad por tener más RAM. Si el objetivo de continuidad lo exige, separar base/aplicación y evaluar redundancia. Evaluar ampliación, por ejemplo a 8 vCPU/16 GB, o separación de componentes según mediciones, no automáticamente al llegar a 100 profesionales.

## Dirección comercial vigente tras revisar canales

Portal principal, correo primero y WhatsApp de respaldo T-36 incluido en el total contratado, con condiciones de uso transparentes y sin recargo API sorpresivo. El modelo vigente y sus supuestos están en [comunicaciones y abono](09-portal-correo-y-membresia.md). No hay tarifa final ni margen aprobado. El análisis no selecciona proveedores ni autoriza contratación. Motor de suscripciones I2/I3.

Los límites técnicos de gasto y protección contra abuso pertenecen a beta aunque no exista facturación automática. Medir formularios, invitaciones, recuperación, chat, tareas, entregas/fallos y respaldo efectivo; no asumir que la admisión humana elimina cuentas abusivas. Los valores de VPS, recuperación y carga siguientes siguen por validar con evidencia.

## Evidencia pendiente antes del piloto

1. Acordar simultaneidad, tiempos de respuesta y objetivos RPO/RTO; la franja 08-20 no define cuántos usuarios operan juntos.
2. Probar volúmenes de 2.000 a 10.000 turnos mensuales y crecimiento histórico con datos ficticios, auditoría y mensajería. Incluir lecturas, modificaciones, delegaciones, competencia por el mismo intervalo y tareas de aviso.
3. Como propuesta de ensayo por aprobar: escalones de 20, 50 y 100 sesiones activas, con mezcla realista de solicitudes y ráfagas de confirmaciones. Sesiones activas no equivalen a solicitudes por segundo ni solo a profesionales.
4. Medir latencias p95, errores, recursos y colas en el VPS elegido; ensayar proveedor de WhatsApp con límites de gasto y contactos de prueba autorizados.
5. Restaurar una copia en otro entorno, medir pérdida/tiempo y comprobar consistencia. RPO/RTO siguen sin aprobarse.
6. Cotizar proveedor/región, transferencia, backups, monitoreo y soporte del VPS por separado del presupuesto de WhatsApp. No se contrata infraestructura en esta etapa.

La capacidad suficiente se demuestra con estas mediciones y margen operativo; ninguna configuración elimina todos los posibles incidentes técnicos.
