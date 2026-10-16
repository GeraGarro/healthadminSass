# Plan de trabajo y Git

Actualización: 16 de octubre de 2026. Estado: dirección documental aceptada; especificación y construcción pendientes. Consolidación exclusiva de este chat en [estado vigente](13-estado-consolidado-y-pendientes.md) y ADR-008.

## Supervisión

Cada etapa tiene esta secuencia: explicar el problema, comparar opciones relevantes, preparar el entregable, mostrar sus cambios y evidencia, recibir la revisión del responsable y registrar el resultado en Git. No avanzar a la siguiente etapa sin su revisión.

El análisis documental está aceptado en ADR-008: aislamiento aceptado en ADR-001 y propuestas de producto 1-5 aceptadas el 15 de octubre en ADR-002. El objetivo es de 20 profesionales en uso a tres meses y hasta 100 al año; la numeración por profesional y entidad integra R01.a. Stack Angular/Spring Boot/PostgreSQL actual y VPS confirmados; ver presupuesto y operación para versiones recogidas previamente y parámetros pendientes, sin nueva verificación externa. El responsable autorizó el primer commit documental el 16/10/2026, con el mensaje `documentación`, en [GeraGarro/healthadminSass](https://github.com/GeraGarro/healthadminSass). Todavía no se creó una aplicación.

## Etapas

Las etapas 0-8 siguientes son pasos de estudio y construcción **dentro del incremento 1**, que culmina en la V1 beta funcional para profesionales interesados. No equivalen a los incrementos del producto. Los incrementos 2 y 3 incorporarán las capacidades comerciales y políticas de fin de suscripción que el responsable difirió; ver [ciclo incremental](05-incrementos-y-beta.md).

| Etapa | Resultado revisable | Criterio para avanzar | Ejemplo de commit |
| --- | --- | --- | --- |
| 0. Contexto y propuesta | Relevamiento, alcance inicial y diagramas conceptuales | Revisar esta propuesta y acordar cómo se trabajará | `docs: documentar propuesta inicial del turnero SaaS` |
| 1. Dominio y alcance | Glosario, actores, historias, reglas y exclusiones de V1 | Resolver las reglas que cambian reservas y permisos | `docs: definir alcance y reglas de turnos de la V1` |
| 2. Autorización y privacidad | Matriz de permisos, amenazas y ciclo de credenciales | Resolver alcance por entidad, paciente y profesional | `docs: definir permisos por entidad y recurso` |
| 3. Arquitectura | Alternativas, decisiones ADR, diagramas C4 y modelo de datos | Concretar aislamiento, stack aceptado, sesión/activación y restricciones | `docs: registrar arquitectura y modelo de datos` |
| 4. Base técnica | Frontend y backend mínimos, migraciones y CI | Arranque reproducible y verificación automatizada básica | `chore: inicializar backend con Spring Boot` |
| 5. Identidad y entidades | Acceso, membresías, roles y aislamiento | Pruebas positivas y negativas entre dos entidades | `feat: limitar operaciones a membresias autorizadas` |
| 6. Primer flujo completo | Agenda, reserva y consulta por paciente y recepción | Demostrar permisos, concurrencia e idempotencia | `feat: reservar turnos sin solapar disponibilidad` |
| 7. Operación del turnero | Cancelación, reprogramación, atención y avisos | Verificar transiciones, recuperación y avisos vigentes | `feat: reprogramar turnos conservando su historial` |
| 8. Piloto | Despliegue, restauración, monitoreo y guía de uso | Validación técnica y operativa con una entidad piloto | `docs: documentar operacion y recuperacion del piloto` |

La entrega de beta exige turnos, credenciales, roles, seguridad, conflictos entre entidades, portal y flujo de ADR-004: correo T-72/T-48, WhatsApp T-36 y cierre T-24. ADR-005 agrega chat humano al profesional y selección de horarios por paciente solo para la práctica «Consulta» habilitada; otras prácticas las asigna personal autorizado. Elegir proveedores, concretar chat/catálogo de prácticas, parámetros antiabuso y resolver excepciones antes de verificar. El catálogo público es evolución futura. Suscripciones e IA siguen pendientes de sus etapas.

Los mensajes son ejemplos, no commits ejecutados. Una etapa puede necesitar varios commits: cada uno debe mantener una intención principal y corresponder al cambio realmente realizado.

## Documentación y trabajo pendiente

- Visión y alcance: problema, usuarios, límites y métricas.
- Ítem de dominio preparado para revisión: [glosario](14-glosario-del-dominio.md), [alcance y condiciones de cierre](15-alcance-y-cierre-del-item.md) y [catálogo de prácticas](16-catalogo-de-practicas.md). Consulta, extracción, limpieza y cirugía como base ampliable mediante facultad explícita; propuestas de detalle y configuración piloto pendientes. Ver ADR-009.
- [Casos de uso preparados para revisión](21-casos-de-uso.md): 37 fichas, 7 diagramas, 16 escenarios integrales y trazabilidad; conservar los pendientes y aprobar su detalle antes de implementar. Las historias del catálogo siguen en docs/16.
- Matriz de permisos por acción, actor, entidad y recurso.
- Diagramas C4 de contexto y contenedores; componentes cuando ayuden a entender un módulo.
- Diagrama entidad-relación y diccionario de datos.
- Diagramas de secuencia para reserva, reprogramación y notificaciones.
- Máquina de estados con transiciones y actores habilitados.
- ADR: una decisión de arquitectura con contexto, alternativas, resultado y consecuencias.
- Contrato de API, incluyendo errores, paginación e idempotencia.
- Plan de verificación, seguridad, despliegue, backups y restauración.
- Registro R01-R12: alcance, reservas temporales, capacidad entre entidades, delegaciones, coberturas, menores y avisos.
- Evaluación de costos por canal, con tarifas fechadas y presupuesto por cliente.
- Arquitectura de comunicación: orquestación, adaptadores, destinatarios autorizados, eventos e aislamiento por entidad; portal, correo, respaldo WhatsApp y aviso interno de ADR-004.
- Chat del portal: participantes, permisos separados de agenda y pruebas de acceso. La elección de horarios queda limitada a la identidad de la práctica base «Consulta» según ADR-009; el catálogo detalla sus criterios.
- Admisión: formulario propio, habilitación administrativa, cuenta reutilizable, aprobación persistente y activación/vinculación verificadas. Concretar Google + alternativa por correo, recuperación, sesión, transiciones, alcance local y límites; los requisitos ya resueltos no se reabren.
- Ayuda memoria A4 regenerable y actualizado junto a las reglas.
- Guías de desarrollo y de uso por actor.
- Alcance por incremento, criterios de entrega de la beta y evaluación de seguridad básica.

Documentar al ritmo de las decisiones y funcionalidades. Mantener diagramas y contratos junto al código para evitar documentación que contradiga la aplicación.

## Estructura de repositorio propuesta

La estructura de aplicación aún no fue creada. Se propone un único repositorio:

```text
/
  README.md
  .gitignore
  docs/
    producto/
    arquitectura/
      adr/
      diagramas/
    seguridad/
    operacion/
  backend/
    src/main/java/<paquete>/
      identidad/
      entidades/
      profesionales/
      coberturas/
      pacientes/
      agendas/
      turnos/
        capacidad/
      notificaciones/
        canales/         correo y respaldo WhatsApp aceptados; ADR-004
      auditoria/
    src/main/resources/db/migration/
    src/test/
  frontend/
    src/app/
      core/
      shared/
      features/
        acceso/
        administracion/
        agenda/
        pacientes/
        turnos/
        portal-paciente/
  infra/
  scripts/               Generadores de documentación
  output/pdf/            Ayuda memoria listo para imprimir
  .github/workflows/  # Solo si elegimos GitHub
```

Los módulos de backend se organizarán por capacidad del negocio. Dentro de ellos se distinguirán casos de uso, reglas, API y persistencia según su complejidad. Un worker puede ejecutar el mismo código con una configuración propia; no necesita otro producto o repositorio inicial.

## Convenciones Git propuestas

- Rama principal: `main`, conforme al repositorio de GitHub indicado por el responsable para el primer commit.
- Ramas de cambios: `codex/<objetivo>` para trabajo asistido.
- Commits específicos con prefijos `docs`, `chore`, `feat`, `fix`, `refactor` o `test`, y descripción concreta en español. El primer commit usa el mensaje exacto `documentación`, solicitado por el responsable.
- Revisar el diff completo y el estado de Git antes de cada commit; agregar rutas explícitas, sin incluir archivos ajenos.
- No versionar credenciales, datos reales de pacientes, backups ni compilaciones.
- Cada commit de código debe compilar y superar las comprobaciones pertinentes. Una modificación documental necesita revisión de coherencia, enlaces y diagramas.
- Cuando exista remoto, revisar cambios mediante pull requests y activar las comprobaciones acordadas.
- No imponer una rama `develop` al comienzo: una rama principal y ramas cortas permiten un flujo inicial más sencillo.

## Qué se verificará al implementar

Pruebas unitarias para reglas importantes; integración con PostgreSQL para aislamiento, relaciones, delegaciones y concurrencia entre entidades; recorridos de navegador para paciente, representante y personal. Incluir vencimiento/confirmación simultáneos y ocupación global del profesional. Los mocks no demuestran que las restricciones de la base funcionen. Verificar además RLS con el rol real, reutilización de conexiones tras errores y numeración concurrente por entidad/profesional, incluidos reintentos de una misma alta.

Antes del piloto, comprobar también recuperación de cuenta, revocación de permisos, tareas tras reinicios y restauración de backups. La definición de terminado incluirá código, documentación y evidencia proporcional al riesgo del cambio.

## Próximo entregable

El 16/10/2026 se preparó la [especificación de casos de uso](21-casos-de-uso.md), con [versión navegable](casos-de-uso/index.html), [PDF](../output/pdf/casos-de-uso-salud.pdf) y fuentes UML/SVG regenerables. Este entregable desarrolla el dominio ya documentado; no inicia construcción ni aprueba por sí mismo los permisos, transiciones y mecanismos pendientes. Revisar sus fichas y resolver los grupos de decisiones del apartado 11 antes de implementar los respectivos flujos.

Se agrega para revisión el [registro y recuperación de acceso](20-registro-de-usuarios-y-recuperacion-de-acceso.md), con maqueta navegable local. ADR-012 confirma recuperar contraseña por email del equipo; el alta comercial y su mecanismo detallado son propuestas. La maqueta permite evaluar pantallas y no inicia la etapa de base técnica ni acredita autenticación, email o pruebas de producto. Revisar el diseño antes de construir conforme a la supervisión de este plan.

Concretar matriz de permisos por entidad/recurso/acción, transiciones de admisión/turno/asistencia y representación, catálogo real y parámetros D01-D16. La aceptación del diseño en este chat no exige volver a elegir especialidad, entidades, flujo de canales o admisión. Presentar esas especificaciones y la evidencia prevista para revisión antes de implementar. El primer commit autorizado incluye documentación, `.gitignore`, los PDF y sus fuentes regenerables; excluye los archivos temporales de revisión. Sigue sin haber implementación. El inciso 5 y el alcance de numeración por profesional y entidad ya fueron aceptados; la revisión restante no vuelve a dejarlos como alternativas abiertas. Después continuará la definición detallada del dominio.

## Cómo evitar releer toda la arquitectura

1. Consultar primero la hoja A4 y los identificadores de regla.
2. Abrir solo la regla afectada en `03-reglas-del-dominio.md`.
3. Anotar la decisión aprobada en un ADR, indicando reglas afectadas y fecha.
4. En cada revisión mostrar: regla afectada, qué cambia, evidencia y decisiones abiertas.
5. Actualizar el resumen JSON y regenerar/verificar el A4 en el mismo cambio cuando cambie una regla resumida.

Los identificadores R01-R12 deben conservarse. La hoja orienta; el registro de reglas y los ADR aprobados guardan el detalle. Ningún resumen transforma una propuesta pendiente en una decisión aprobada.
