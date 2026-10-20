# Modelo E-R explicado paso a paso

18 de octubre de 2026

88 entidades · 722 campos · 252 referencias FK · 17 carpetas.

[Abrir índice general en PDF](00-indice-y-ruta-de-lectura.pdf)

Cada carpeta contiene explicacion.pdf, explicacion.md, diagrama.pdf, diagrama.svg, diagrama.drawio, diagrama.mmd y README.md.

## Orden recomendado

1. [Identidad y credenciales, parte 1](01-identidad-y-credenciales-parte-1/explicacion.pdf): Primero identifique al usuario y luego los mecanismos de acceso. Separe quién es la persona, cómo demuestra su identidad, qué acceso mantiene iniciado y qué facultades globales recibe.
2. [Identidad y credenciales, parte 2](02-identidad-y-credenciales-parte-2/explicacion.pdf): Continúe con los trabajos de recuperación y verificación. La primera parte define el usuario y la autorización temporal; esta lámina muestra cómo se organiza y registra el envío.
3. [Organización y permisos](03-organizacion-y-permisos/explicacion.pdf): Una vez reconocida la persona, ubíquela en una organización y determine qué puede hacer allí. Distinga la clínica, sus sedes, la pertenencia del usuario y las acciones autorizadas.
4. [Profesionales e incorporación](04-profesionales-e-incorporacion/explicacion.pdf): Estudie la diferencia entre la identidad profesional que persiste y cada vínculo con una clínica. Luego revise las solicitudes de incorporación y las invitaciones del equipo.
5. [Ficha y acceso del paciente, parte 1](05-ficha-y-acceso-del-paciente-parte-1/explicacion.pdf): Separe los datos administrativos del paciente de su cuenta de acceso. Después revise quién puede actuar por él, cómo se aprueba el acceso y qué profesional o agenda comprende.
6. [Ficha y acceso del paciente, parte 2](06-ficha-y-acceso-del-paciente-parte-2/explicacion.pdf): Comprenda cómo se asigna un número visible estable sin repetirlo cuando varias personas registran pacientes a la vez.
7. [Agendas y catálogo](07-agendas-y-catalogo/explicacion.pdf): Distinga la agenda, el servicio del catálogo y la oferta concreta que se habilita en esa agenda. Después agregue condiciones históricas, horarios y autorizaciones para gestionarla.
8. [Excepciones y recursos](08-excepciones-y-recursos/explicacion.pdf): Añada al horario habitual los cambios puntuales y las necesidades físicas. Distinga declarar que hace falta un recurso de reservarlo efectivamente.
9. [Coberturas y convenios](09-coberturas-y-convenios/explicacion.pdf): Recorra la cobertura desde el catálogo hasta la evaluación de una reserva. Tener obra social, tener un plan y poder usarlo para una práctica son situaciones diferentes.
10. [Reservas y capacidad](10-reservas-y-capacidad/explicacion.pdf): Observe cómo una retención temporal se convierte en una cita y cómo se evita superponer al profesional entre clínicas. Separe registro del turno, horario histórico y confirmación de asistencia.
11. [Reprogramación y gestión](11-reprogramacion-y-gestion/explicacion.pdf): Estudie la ausencia que afecta muchas citas y el seguimiento individual de cada una. Mantenga por separado el aviso al paciente y la obtención de un reemplazo.
12. [Canales y destinatarios](12-canales-y-destinatarios/explicacion.pdf): Antes de enviar, identifique desde qué cuenta se comunica la entidad, a quién puede hacerlo y qué límites técnicos de consumo tiene.
13. [Avisos y entrega](13-avisos-y-entrega/explicacion.pdf): Separe el trabajo programado, el mensaje lógico, cada intento de envío y las notificaciones del proveedor. Luego diferencie entrega, lectura y resolución.
14. [Chat humano](14-chat-humano/explicacion.pdf): Empiece por el hilo de conversación y compruebe quién puede participar y qué acciones tiene permitidas. Después examine mensajes y lectura.
15. [Continuidad del fichaje](15-continuidad-del-fichaje/explicacion.pdf): Esta parte estudia operaciones excepcionales entre organizaciones. Separe terminar un vínculo, autorizar continuidad y tramitar una petición expresa de eliminación.
16. [Auditoría y operación, parte 1](16-auditoria-y-operacion-parte-1/explicacion.pdf): Revise cómo se registra quién actuó, qué políticas se aplicaron y qué intervenciones excepcionales se autorizaron. Después compruebe la diferencia entre hacer una copia y demostrar que puede recuperarse.
17. [Auditoría y operación, parte 2](17-auditoria-y-operacion-parte-2/explicacion.pdf): Cierre el recorrido con la coordinación de fallos técnicos. Un incidente vincula responsables, tiempos, actuaciones y evidencia mínima.

## Uso y regeneración

Esta es la ubicación única de las láminas individuales y sus explicaciones. Cada carpeta reúne el diagrama editable y la guía correspondiente; el modelo integral se conserva en el nivel superior.

Para editar una explicación, modificar el contenido.json de su carpeta. glosario-campos.json conserva las definiciones compartidas, símbolos y glosario; estructura.json fija el orden y los nombres de las 17 láminas. Las guías Markdown y PDF se regeneran con scripts/generar-guia-modelo-er.py.

Estado: guía de un modelo lógico propuesto; no aprueba decisiones pendientes ni acredita implementación. Los ejemplos son ficticios.
