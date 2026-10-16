# Alcance y entregables: glosario y catálogo de prácticas

Fecha: 15 de octubre de 2026. Versión: 1.1. Incremento 1, etapa de dominio y alcance.

Estado: documentación preparada para revisión. La lista inicial y la posibilidad de añadir prácticas personalizadas fueron indicadas por el responsable; los detalles nuevos de administración se presentan como propuesta. No hay implementación ni pruebas funcionales ejecutadas.

## Objetivo del producto

Gestionar administrativamente pacientes y turnos, inicialmente odontológicos, para clínicas, profesionales independientes y actividad mixta, con datos y permisos aislados por entidad. Permitir organizar la atención según prácticas configurables, evitar ocupaciones incompatibles y conservar trazabilidad.

La beta pertenece al incremento 1. Las etapas de documentación, arquitectura, construcción y piloto son pasos dentro de ese incremento. El [alcance general de beta](05-incrementos-y-beta.md) y las [reglas R01-R12](03-reglas-del-dominio.md) mantienen el contrato completo.

## Límite de este ítem documental

| Entregable | Contenido | Documento |
| --- | --- | --- |
| Glosario | Vocabulario de organización, actores, acceso, prácticas, turnos, coberturas y comunicaciones | [Glosario](14-glosario-del-dominio.md) |
| Alcance | Inclusiones, exclusiones, actores, dependencias y condiciones de cierre | Este documento |
| Catálogo | Cuatro prácticas iniciales, personalización, campos, permisos, ciclo de cambios e historias verificables | [Catálogo](16-catalogo-de-practicas.md) |
| Registro de decisión | Requerimiento confirmado y separación de propuestas pendientes | [ADR-009](arquitectura/adr/009-catalogo-inicial-y-personalizacion.md) |

Este ítem prepara el comportamiento revisable del catálogo. El modelo SQL, la API y las pantallas se concretarán en las etapas siguientes; la matriz de permisos aquí incluida cubre prácticas, no todos los recursos del sistema.

## Actores y responsabilidad

| Actor | Participación en el alcance |
| --- | --- |
| Responsable del producto | Revisa vocabulario, límites y propuestas de comportamiento. |
| Profesional | Define su oferta de atención y valida tiempos, condiciones y recursos; administra sus agendas según facultades. |
| Secretaría autorizada | Opera y configura únicamente lo expresamente permitido dentro de la entidad y las agendas delegadas. |
| Administrador de entidad | Gestiona funciones organizativas concedidas; no sustituye las delegaciones del profesional. La concesión del permiso de catálogo debe quedar definida. |
| Paciente o representante verificado | Elige horario de la práctica «Consulta» habilitada, consulta sus turnos y confirma asistencia según facultades. Solicita gestión de otras prácticas. |
| Administrador de plataforma | Incorpora y opera la beta con acceso acotado. |

## Alcance funcional de la beta

| Área incluida | Comportamiento esperado | Referencia |
| --- | --- | --- |
| Organización | Entidades, sedes y vínculos profesionales, con agendas institucionales e independientes. | R01, R05 |
| Identificación de pacientes | Ficha local y número por profesional y entidad, conservado al reactivar. | R01.a |
| Admisión y acceso | Aprobación administrativa, activación y vinculación verificadas, autenticación y autorización vigentes. | R09.a |
| Representación | Actor y paciente diferenciados, con facultades comprobadas. | R09 |
| Catálogo configurable | Consulta, extracción, limpieza y cirugía como base, con nuevas prácticas personalizadas mediante facultad explícita. | R06, ADR-009 |
| Configuración de atención | Práctica por profesional/agenda, duración, pausas, sede, modalidad y recursos validados. Alcance de recursos adicionales por concretar. | R03, R06 |
| Asignación | Portal para la práctica «Consulta» habilitada; personal autorizado para otras prácticas y sus reprogramaciones. | R02, R06 |
| Capacidad y turnos | Pre-reserva breve, registro, exclusión del mismo profesional entre entidades y cambios con historia. | R02, R03, R08 |
| Coberturas | Convenios configurados y elegibilidad revisada antes de ocupar capacidad y al completar. | R07 |
| Asistencia y avisos | Correo T-72/T-48, WhatsApp T-36 pendiente, cierre T-24 con aviso interno y excepciones por definir. | R08, R11 |
| Chat | Comunicación humana con permisos específicos y sin cambios automáticos de agenda por texto. | R11.a |
| Protección y operación | Aislamiento, permisos en servidor, prevención de abuso, auditoría, copias y restauración comprobada antes de datos reales. | R01.a, R02.a, R12 |

## Catálogo: límites específicos

La lista inicial es ampliable mediante facultad explícita. Las prácticas personalizadas se configuran sin modificar el código de la aplicación. Una práctica personalizada debe poder gestionarse sin modificar el código de la aplicación.

La práctica específica **«Consulta»** es la única candidata a elección de horario por paciente o representante, sujeta a habilitación y demás controles. Extracción, limpieza, cirugía y todas las prácticas personalizadas quedan bajo asignación del personal, incluida su reprogramación. Añadir, renombrar o reclasificar una práctica no permite ampliar esa facultad. La restricción es por identidad de la práctica base y se valida en servidor.

La existencia de la práctica en catálogo se separa de su habilitación en una agenda. Se propone conservar las modificaciones mediante versiones y desactivación sin borrar referencias históricas. El detalle y las facultades correspondientes están en el catálogo.

## Exclusiones y evolución

| Elemento | Situación |
| --- | --- |
| Historia clínica especializada, diagnósticos, prescripciones o indicaciones automáticas | Fuera del alcance de esta beta administrativa. |
| IA administrativa o clínica | Sin aprobación para esta beta; el chat incluido es humano. |
| Directorio público de profesionales y empadronamiento simplificado entre entidades | Evolución futura, distinta del catálogo interno de prácticas. |
| Cobros de pacientes, facturación y liquidaciones | Requieren alcance propio. |
| Motor de suscripciones y finalización comercial del SaaS | Diferido a I2/I3. |
| APIs de coberturas y nomencladores oficiales automáticos | Integración futura; los códigos locales propuestos no acreditan reconocimiento externo. |
| Agenda grupal, sobrecupos, lista de espera automática y calendario externo | Pendientes de decisión propia. |
| Adjuntos, audio, video y teleconsulta | No se incorporan por añadir campos de práctica o por incluir chat. |
| Transferencia automática de fichas, prácticas configuradas o turnos entre entidades | No habilitada por reutilizar cuenta o identidad profesional. |

## Dependencias y decisiones pendientes

| ID | Decisión necesaria | Responsable de definición | Efecto |
| --- | --- | --- | --- |
| P01 | Duración y pausas de las cuatro prácticas y de cada personalizada | Profesional del piloto | Sin valores válidos no se ofrece esa práctica en esa agenda. |
| P02 | Profesionales, sedes, agendas, modalidad y recursos reales | Responsable del piloto y profesionales | Determina dónde y con qué capacidad se atiende. |
| P03 | Convenios, planes y tratamiento de casos que requieren revisión | Profesional y administración autorizada | Determina elegibilidad administrativa. |
| P04 | Quién concede la facultad de catálogo y qué cambios puede hacer cada actor | Responsable del producto | Completa la matriz propuesta de catálogo y su concesión por entidad. |
| P05 | Revisar estados, versiones, códigos y política de duplicados propuestos | Responsable del producto | Cierra el diseño detallado antes de implementarlo. |
| P06 | Atención individual y alcance del control de recursos adicionales | Responsable del producto y profesionales | La atención individual sin sobrecupos sigue como propuesta. |
| P07 | Parámetros globales de pre-reserva, cancelación, representación, excepciones y canales | Responsable del producto y piloto | Siguen abiertos en D01-D16; no se fijan por este ítem. |

No es necesario configurar las cuatro prácticas en todas las agendas. Cada oferta que se habilite debe estar completa y validada. Las prácticas todavía incompletas pueden permanecer sin ofrecerse según el ciclo propuesto.

## Criterios de cierre y evidencia

| Nivel | Condición | Estado al generar este documento |
| --- | --- | --- |
| Entrega documental | Existen glosario, alcance, catálogo, historias, criterios de aceptación, pendientes y referencias coherentes. | Preparada; enlaces y coherencia se verifican documentalmente. |
| Revisión del responsable | Se revisan las propuestas y se decide sobre P04-P06 sin reabrir las reglas ya aceptadas. | Pendiente de revisión. |
| Configuración del piloto | Cada práctica ofrecida tiene tiempos, ámbito y condiciones completos. | Pendiente; no se inventan valores. |
| Entrega funcional | Se implementan y demuestran los criterios del catálogo y los de beta. | Pendiente; no hay aplicación. |

La entrega de este ítem no declara cerradas las etapas de permisos, arquitectura ni implementación. Las historias del catálogo constituyen el material de entrada para su construcción y validación posteriores.
