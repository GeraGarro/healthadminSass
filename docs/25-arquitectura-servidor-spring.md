# Manual de arquitectura del servidor Spring

Sistema de Gestión Administrativa de Salud

Versión 1.0 | 20 de octubre de 2026 | America/Buenos_Aires

Diseño técnico integral basado en las reglas R01-R12, ADR-001..015, casos de uso CU-01..37, matriz MP y modelo E-R 1.1 del repositorio.

Documento de diseño para implementar y revisar. La base técnica existente está identificada como tal; los mecanismos nuevos son propuestas técnicas. Este manual no acredita una beta funcional ni aprueba parámetros de producto pendientes.

## 01. Propósito, alcance y estado real

El servidor será un monolito modular Spring Boot: un artefacto desplegable, módulos con responsabilidades explícitas y PostgreSQL como fuente de verdad. Resolverá admisión, acceso, pacientes administrativos, agendas, capacidad, turnos, representación, avisos, chat humano y auditoría. El diseño favorece transacciones locales para las operaciones que deben conservar capacidad y privacidad de forma consistente.

La solicitud actual autoriza desarrollar la arquitectura y su manual. Antes de esta elaboración se guardó la documentación previa en el commit 9383b98. Los cambios de código que ya estaban en el directorio del servidor no forman parte de ese commit documental. No se confunde la arquitectura propuesta con una implementación del negocio.

### Tres estados que deben conservarse

| Estado | Qué comprende | Cómo se comprueba |
| --- | --- | --- |
| Existente | Base Java 21, Spring Boot 4.1.1, Security, MVC, JPA, Flyway, PostgreSQL y motores de reportes | Código en salud-api; evidencia histórica en documento 24 |
| Aceptado como requisito | Aislamiento, numeración estable, Consulta exclusiva en portal, cronograma de avisos, admisión y demás ADR vigentes | Reglas y decisiones del proyecto |
| Propuesta de este manual | Contratos de módulos, puertos, endpoints, locks, ejecución durable, estructura y operación objetivo | Revisión e implementación posteriores con las pruebas aquí definidas |

La evidencia del 16/10 registra 15 pruebas de la base y arranque del JAR. No se volvieron a ejecutar en esta elaboración documental y no prueban los flujos futuros. El esquema inicial solo contiene infraestructura técnica: las 88 entidades del modelo lógico todavía no son tablas de negocio implementadas.

La beta es administrativa. Se excluyen odontograma, historia clínica especializada, IA clínica, cobros, suscripciones, adjuntos, videollamadas, calendarios externos y lista de espera automática. El directorio público y el alta comercial propuesta de CU-35 se conservan como evolución o detalle no aprobado. El manual no fija importes, plazos de conservación ni obligaciones jurídicas.

### Cómo leerlo

Arquitectura y código: capítulos 02-07. Seguridad y datos: 08-12. Flujos críticos: 13-19. API y operación: 20-25. Ejecución y trazabilidad: 26-30 y anexos. El diccionario E-R sigue siendo la referencia de campos; aquí se define quién los administra y cómo se usan.

## 02. Decisiones y atributos de calidad

Se conserva la base técnica de ADR-014 y la política UUIDv7 de ADR-015. Los detalles siguientes son recomendaciones para materializar esas decisiones sin alterar reglas aceptadas.

| Decisión de arquitectura | Motivo | Límite o costo |
| --- | --- | --- |
| Un JAR modular y una base PostgreSQL | Capacidad, turno, auditoría y trabajo pendiente pueden confirmarse juntos | Exige disciplina de dependencias y despliegue coordinado |
| MVC y servicios transaccionales | Encaja con el código existente y el acceso JDBC/JPA | Llamadas externas fuera de transacciones largas |
| Sesión de servidor para el portal | Facilita revocación y reduce exposición de credenciales en el navegador | Propuesta; protocolo definitivo y persistencia de sesión por implementar |
| PostgreSQL para tareas y avisos durables | Evita perder tareas al reiniciar y permite varios workers | Reclamo, deduplicación, leases y recuperación obligatorios |
| RLS más autorización de aplicación | Dos barreras contra cruces accidentales de entidad | RLS por entidad no decide permisos dentro de ella |
| Coordinador global de capacidad mínimo | Excluye al mismo profesional entre clientes | Excepción privilegiada pequeña y auditada |
| Proveedores por puertos | Cambiar correo/WhatsApp sin tocar reglas de turnos | Ningún proveedor se selecciona por este documento |

Prioridad de calidad: impedir filtraciones y doble ocupación; conservar operaciones ante fallos; poder explicar quién hizo cada cambio; mantener módulos comprensibles; medir rendimiento con carga realista. Los objetivos de 20 y hasta 100 profesionales orientan pruebas, no garantizan capacidad de un VPS.

No se incorporan Kafka, Redis, Kubernetes, un API gateway ni microservicios como requisitos iniciales. Si mediciones justifican separaciones, la primera candidata es la ejecución de comunicaciones, conservando contratos e idempotencia. Separar procesos no obliga a separar repositorios o bases.

Las versiones registradas son la fotografía del repositorio, no una recomendación de actualizar automáticamente. Java 21, Boot 4.1.1 y PostgreSQL 18.6 se mantienen hasta una revisión de compatibilidad. Las dependencias Spring se administran mediante el BOM existente. Nueva biblioteca requiere caso de uso, licencia compatible, revisión de vulnerabilidades y una prueba de integración pertinente.

## 03. Contexto y topología de ejecución

El navegador Angular accederá al servidor por HTTPS. Se propone servir portal y API bajo el mismo origen mediante proxy inverso; simplifica cookies, CORS y protección CSRF. El frontend seguirá siendo un cliente sin facultad de decidir permisos, duración efectiva, precios de comunicación ni identidad del profesional.

[[diagram:contexto]]

PostgreSQL contiene datos administrativos, aislamiento, ocupaciones mínimas, tareas y auditoría. El proceso Spring atiende HTTP y ejecuta workers acotados; puede desplegarse con roles de proceso distintos cuando la carga lo requiera. Los proveedores externos reciben únicamente el contenido y destino necesarios para cada aviso. Google interviene en autenticación si se adopta OIDC; no admite pacientes ni concede membresías.

El proxy termina TLS, limita tamaño/frecuencia y entrega identificadores de correlación controlados. El servidor sigue validando entradas y autorización. Solo se aceptan cabeceras de proxy desde infraestructura configurada como confiable. La base no se publica en Internet; el puerto local de Compose permanece en loopback.

### Fronteras de confianza

1. Navegador a API: validar sesión, CSRF, formato, contexto y facultades actuales.
2. API a base: consultas parametrizadas, rol sin DDL/BYPASSRLS y contexto transaccional.
3. Worker a proveedor: secreto de servicio, timeout, presupuesto, reintentos y deduplicación.
4. Proveedor a webhook: verificar firma, fecha y repetición antes de interpretar un evento.
5. Operación a producción: credenciales separadas, MFA administrativo y acceso trazable.

La indisponibilidad del proveedor no invalida una reserva confirmada en base. Un fallo de base impide confirmar que se persistió una operación; el cliente podrá reintentar con su misma clave de idempotencia. La respuesta nunca debe afirmar éxito antes del commit.

## 04. Módulos y propiedad de datos

Se conservan los siete paquetes de capacidad ya reservados. Los submódulos propuestos crecen dentro de ellos, con una fachada pequeña por capacidad. Cada tabla tiene un único dueño de escritura; otro módulo usa una fachada o una proyección autorizada.

| Paquete raíz | Responsabilidad | Subáreas previstas |
| --- | --- | --- |
| identity | Cuenta, credenciales, sesión, MFA y recuperación | account, authentication, recovery, identitydelivery |
| organization | Entidades, sedes, membresías, permisos y profesionales | membership, authorization, professional, onboarding, transition |
| patient | Ficha administrativa, admisión, representación y numeración | record, admission, representation, professionalnumber |
| scheduling | Reglas de agenda y ciclo completo del turno | agenda, catalog, coverage, capacity, booking, attendance, rescheduling |
| communication | Canales, avisos, entregas, bandejas y chat | channel, delivery, inbox, chat |
| audit | Evidencia de negocio y controles operativos | event, policy, abuse, support, operations |
| reporting | Consultas y exportaciones autorizadas | query, pdf, spreadsheet, csv |

Los ámbitos G, T y X del modelo se conservan. G es global restringido; T pertenece a una entidad; X permite una transición controlada entre origen y destino. Global no significa público. La tabla ENTIDAD no concede al runtime enumerar todos los clientes.

La cobertura médica es un convenio administrativo, no otro tenant ni una cuenta con acceso. Scheduling.coverage administra planes, afiliaciones, reglas y evaluación; patient mantiene la ficha referida mediante contrato. Esta asignación es una elección de diseño de este manual y no una modificación del modelo lógico.

Identity administra avisos de acceso separados de los avisos de turnos para no depender de scheduling. Organization contiene la transición del profesional, pero delega las tareas sobre fichas y turnos a puertos; sus adaptadores viven en patient y scheduling. Ningún módulo cambia tenant_id de fichas ajenas en bloque.

El anexo A asigna las 88 entidades a un dueño. Reporting no necesita tablas propias para cada reporte. Nuevas tablas técnicas, como una cola de despacho global mínima, necesitarán migración y revisión: el anexo no afirma que el modelo actual ya las contenga.

## 05. Capas, paquetes y reglas de dependencia

Cada módulo incorporará api, application, domain e infrastructure cuando implemente un caso de uso. api contiene controladores y contratos públicos de integración, incluidos los puertos que otros módulos implementan. application coordina casos de uso y puertos internos; domain conserva reglas; infrastructure adapta persistencia y servicios externos.

[[diagram:capas]]

```text
ar.com.salud
  config                       Ensamblado Spring, web y seguridad
  shared
    error                      Problem Details existente
    context                    Contextos inmutables y actor
    time                       Clock y tipos temporales
    audit                      Puerto mínimo de auditoría
  identity/, organization/, patient/, scheduling/
  communication/, audit/, reporting/
    api/, application/, domain/, infrastructure/
```

domain no importa Spring MVC, Servlet, controladores, proveedores ni entidades de otros módulos. application usa contratos públicos y puertos. infrastructure puede usar Spring Data JPA, JDBC, clientes HTTP y DTO del proveedor. config ensambla adaptadores. Los DTO de API y las entidades persistentes son distintos; no se serializan proxies ni relaciones JPA.

Se recomienda dominio separado de la representación JPA en capacidad, turnos y políticas complejas. Para catálogos simples se permite un modelo interno más directo, preservando invariantes y encapsulación. Evitar repositorios genéricos públicos que permitan saltarse casos de uso.

### Grafo permitido

Organization consume contratos de identity; patient consume identity y organization; scheduling consume patient y organization. Communication consume eventos/contratos públicos de scheduling, patient e identity. Reporting consume fachadas de consulta y compartimentos autorizados. Audit implementa el puerto de shared; los módulos no importan sus repositorios.

Scheduling define NotificationPlanPort y su adaptador en communication escribe el plan en la misma transacción. Así no existe dependencia Java scheduling -> communication. Organization define TransitionPort; los adaptadores de patient/scheduling implementan pasos acotados. Los eventos que solo sirven para notificar después del commit nunca sustituyen persistir un trabajo indispensable.

Una comprobación de arquitectura deberá rechazar ciclos, acceso a infrastructure ajena, domain -> web y repositorios usados desde controladores. ArchUnit es una dependencia candidata de pruebas, todavía no instalada.

## 06. Contratos de aplicación y transacciones

Los nombres siguientes son contratos propuestos, no clases ya implementadas. Un servicio representa una intención: AcquireHold, CompleteBooking, ConfirmAttendance, RescheduleAppointment, ApproveAdmission o RevokeDelegation. No se expone un CRUD genérico que permita asignar estados arbitrarios.

| Contrato | Entrada confiable | Salida | Garantía |
| --- | --- | --- | --- |
| AuthorizationFacade.check | Actor autenticado, acción y entidad | Decisión base o rechazo | Membresía/facultades; el dueño del recurso agrega su control |
| PatientAccessFacade.evaluate | Actor, paciente, acción y contexto | Alcance mínimo | Admisión y representación separadas |
| EligibilityFacade.evaluate | Oferta, paciente y modalidad elegida | Regla/versiones aplicadas | No cambia a particular silenciosamente |
| CapacityPort.acquire/convert/move/release | Referencias verificadas e intervalo | Handle opaco o conflicto | Sin detalles ajenos |
| NotificationPlanPort.persist | Evento, versión, destinatario autorizado | Plan durable | Mismo commit que el cambio local |
| AuditPort.append | Actor, acción, ámbito, cambios mínimos | Referencia de evidencia | Misma transacción de negocio |

La frontera transaccional vive en application y es corta. Las fachadas que participan en una reserva propagan la transacción existente y usan la misma base/conexión cuando requieren atomicidad. Los puertos críticos exigirán participación en esa transacción; no usarán REQUIRES_NEW para guardar una ocupación o un aviso independiente del turno.

La auditoría de un cambio exitoso confirma con el cambio. Un intento rechazado o un fallo que provoca rollback puede registrarse aparte en un evento de seguridad mínimo, con resultado fallido y sin afirmar que ocurrió el cambio de negocio.

Para tareas durables se define intención de negocio en dominio y plan técnico en persistencia. Un listener AFTER_COMMIT puede despertar al worker, pero el worker recupera de la base el trabajo pendiente aunque ese aviso se pierda. La documentación oficial de eventos transaccionales describe sus fases; la durabilidad proviene del registro persistido, no del listener [T4].

Cada caso de uso recibe ActorContext y AuthorizedTenantContext creados por el servidor. tenantId y actorId recibidos del cliente son referencias que se validan, nunca prueba de autorización. El paciente representado se conserva separado de la persona que ejecutó la operación.

## 07. Tecnología y configuración objetivo

| Componente | Estado del repositorio | Aplicación en el diseño |
| --- | --- | --- |
| JDK 21 LTS y Maven Wrapper | Existentes | Compilar con 21 y verificar con Wrapper |
| Spring Boot 4.1.1 | Existente | MVC, configuración, empaquetado y Actuator |
| Security, JPA, Validation, Flyway | Existentes, BOM de Boot | Sin sobrescribir versiones individuales |
| PostgreSQL 18.6 | Compose/Testcontainers existentes | Misma familia para pruebas y producción |
| JasperReports 7.1.0 | Dependencias existentes | Plantillas internas de PDF |
| Apache POI 5.5.1 y Commons CSV 1.14.1 | Dependencias existentes | XLSX y CSV con controles de exportación |
| OAuth2 Client, mail, sesión JDBC | Candidatos | Agregar al implementar identidad y proveedores |
| OpenAPI y ArchUnit | Candidatos | Contratos y límites verificables |

Se mantiene OSIV desactivado, hibernate ddl-auto=validate, conexión/JVM en UTC, errores sin trazas y cookies HttpOnly/Secure. El timeout de sesión existente es 20 minutos: configuración técnica actual, no una política de sesión aprobada para producción. Hikari máximo 10 es un punto de partida a medir.

Perfiles propuestos: local, test y prod. local permite HTTP en loopback con datos ficticios; test usa PostgreSQL desechable; prod requiere secretos inyectados, TLS y orígenes explícitos. No hay secretos predeterminados de producción ni usuario de desarrollo habilitado por accidente.

Se propone configurar capacidades mediante objetos @ConfigurationProperties validados al arrancar: booking.hold-ttl, booking.max-renewals, abuse.future-quota, reminders.email-offset, reminders.close-policy y delivery.retry-policy. Son nombres de diseño, todavía inexistentes. Los valores pendientes no tendrán defaults silenciosos que habiliten la beta: la funcionalidad afectada queda deshabilitada o el despliegue rechaza la configuración incompleta.

La producción debería ejecutar Flyway con un job de migración y omitir credenciales de migrador en el proceso HTTP. La base actual ejecuta Flyway al arrancar; separar este comportamiento es trabajo pendiente. La variable de origen permitida actual admite Content-Type y X-CSRF-TOKEN; si se incorporan Idempotency-Key e If-Match deberán agregarse expresamente y probarse. No aceptar comodines con credenciales.

## 08. Identidad, admisión y sesiones

Se propone autenticación del portal con sesión en cookie de servidor. OIDC con Google demostraría control de una identidad externa; el método alternativo por correo del paciente continúa pendiente. La recuperación por email del equipo está confirmada, pero no obliga a crear contraseña en una cuenta que solo tiene identidad externa.

El login crea una identidad autenticada con facultades mínimas. Antes de abrir información privada de un paciente se comprueban aprobación administrativa vigente, activación, vínculo de cuenta, ámbito y representación. La aprobación es persistente: no se pide al personal otra admisión por cada login. El equipo accede mediante sus membresías, no mediante admisión de paciente.

### Flujo propuesto de acceso

1. Recibir autenticación con protección de frecuencia y contra enumeración.
2. Validar contraseña protegida o respuesta OIDC completa, incluidos state/nonce cuando apliquen.
3. Rotar identificador de sesión tras autenticación y elevación de privilegios.
4. Ofrecer solo contextos autorizados y consultar permisos actuales por operación.
5. Cambiar de entidad mediante una acción validada; otra pestaña no debe heredar accidentalmente el contexto equivocado.
6. Revocar sesión, membresía, admisión o representación según su alcance, sin borrar historial.

Para evitar ambigüedad entre pestañas, la ruta incluye la entidad y el servidor la coteja en cada solicitud. No se confía solo en un tenant mutable guardado en sesión. La ficha no se enlaza por coincidencia de correo, DNI o nombre. Una identidad externa se identifica por emisor y sujeto; vincular otra requiere prueba de control y protección contra apropiación.

La sesión durable propuesta permite reinicio y más de una réplica sin sticky sessions obligatorias. Si se adopta Spring Session JDBC, su esquema técnico y la entidad conceptual SESION deben tener responsabilidades distintas o reconciliarse expresamente; no mantener dos autoridades contradictorias de expiración. Un único mecanismo resuelve revocación y MFA.

Tokens de recuperación/activación: aleatorios criptográficos, hash almacenado, propósito, destinatario, expiración, un solo uso y consumo atómico. GET muestra el formulario; POST ejecuta el cambio. No registrar tokens en logs ni permitir URLs de redirección arbitrarias. Recuperar contraseña no devuelve membresías revocadas. MFA administrativo de producción es requisito S06; método, recuperación y enrolamiento siguen por concretar. Referencias técnicas: [T3] y [T7].

## 09. Autorización por recurso y revocación

La decisión se resuelve por actor + entidad + recurso + acción + condiciones vigentes. Organization resuelve membresías y facultades base; el módulo dueño verifica el recurso, delegación, representación y estado mediante sus contratos. Así evita una dependencia inversa organization -> scheduling. @PreAuthorize puede exigir una autoridad inicial; no se asignan todas las acciones a ADMIN o SECRETARY.

| Actor/contexto | Condiciones obligatorias | Restricción relevante |
| --- | --- | --- |
| Paciente | Cuenta vinculada, admisión y alcance vigentes | Solo Consulta elegible para elegir horario |
| Representante | Condiciones anteriores más representación y facultad | Parentesco y contacto no conceden acceso |
| Secretaría | Membresía y delegación de persona/agenda/acción | Reservar no concede admisión ni chat |
| Profesional | Identidad verificada y vínculo local; agenda propia | Cuenta global no abre otra entidad |
| Administrador de entidad | Facultad específica local | No hereda fichas, agendas ni mensajes |
| Administrador de plataforma | Facultad de plataforma y caso autorizado | No es superusuario funcional universal |
| Worker/soporte | Identidad técnica/caso, operación acotada y evidencia | Sin acceso general ni bypass de RLS |

Las marcas ? de la matriz se interpretan como ausencia de concesión. C, D y F requieren sus condiciones; X mantiene la prohibición expresa. El anexo B enlaza los casos de uso y el anexo C incorpora las 46 filas y sus seis marcas originales. Los identificadores MP no son nombres de authorities instaladas.

Los permisos no se cachean por toda la sesión. Cada operación relee facultades vigentes, o verifica una versión de autorización contra la base antes de aplicar un resultado cacheado. La revocación afecta la próxima solicitud iniciada tras su commit. Para operaciones concurrentes sensibles se bloquea la concesión relevante o se usa un protocolo de versión que la revocación también actualiza; una comprobación hecha antes de comenzar una transacción no basta.

Se ordenan las filas de permisos antes de bloquearlas. Revocar no cancela automáticamente turnos ni borra sesiones de otras entidades. Los enlaces de turno solo autorizan su propósito limitado; no conceden ficha, chat ni navegación privada completa. Los recursos no autorizados se responden uniformemente para evitar revelar si existen; 404 puede ocultar su existencia, 403 corresponde a una acción denegada sobre un recurso ya visible.

## 10. Aislamiento PostgreSQL y contexto transaccional

Toda tabla T tiene tenant_id obligatorio, PK(id), UQ(tenant_id,id) y FK compuestas a padres T. Las FK globales se autorizan por contratos restringidos. El rol salud_app no es propietario, superusuario ni BYPASSRLS. Cada migración incorpora GRANT mínimo, RLS, políticas de lectura/escritura e índices asociados.

### Patrón propuesto, no migración ejecutable completa

```sql
-- Dentro de la misma transacción y conexión de trabajo.
SELECT set_config('app.tenant_id', :tenant_validado, true);

ALTER TABLE salud.paciente ENABLE ROW LEVEL SECURITY;
ALTER TABLE salud.paciente FORCE ROW LEVEL SECURITY;
CREATE POLICY paciente_tenant ON salud.paciente
  FOR ALL TO salud_app
  USING (tenant_id =
    NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id =
    NULLIF(current_setting('app.tenant_id', true), '')::uuid);
```

El establecimiento de contexto ocurre al abrir la transacción y antes de cualquier consulta local, en la conexión realmente usada por Hibernate/JDBC. El tercer argumento true limita set_config a la transacción. No se usa SET de sesión ni se depende de limpiar manualmente un ThreadLocal después. Una operación sin contexto no recibe filas T; un UUID mal formado produce rechazo seguro, sin reutilizar un contexto anterior.

Los repositorios conservan predicados por entidad además de RLS; la defensa en base detecta olvidos. RLS solo aísla entidades: pacientes o profesionales dentro de la misma entidad requieren filtros y permisos propios. El backend es responsable de validar el tenant antes de establecer el contexto. Un ajuste de sesión controlable por el mismo rol no protege frente a SQL arbitrario o un servidor comprometido; consultas parametrizadas y mínimo privilegio siguen siendo obligatorios.

Las políticas no cubren por sí mismas TRUNCATE ni validaciones de integridad; el rol runtime no recibe esos privilegios. Errores de FK/unicidad se traducen sin exponer datos ajenos. Las tablas G y X tienen acceso restringido por operación; no se les agrega una política true universal para simplificar.

Las pruebas usan el rol real: SELECT, INSERT, UPDATE y DELETE cruzados, FK cruzadas, contexto ausente, rollback y devolución de conexión al pool. Deben incluir workers y reportes. PostgreSQL documenta las excepciones de propietario y BYPASSRLS y la combinación de políticas [T1].

## 11. Persistencia, UUIDv7 y migraciones

Toda nueva PK interna usa uuid DEFAULT uuidv7() en PostgreSQL. Java usa UUID y la API cadenas con guiones. Las FK, incluido tenant_id, copian el ID del padre y no tienen generador. UUIDv7 no es un secreto, un número visible ni una prueba de orden de commit [T5].

Para garantizar la estrategia aprobada se propone que los adaptadores de alta usen INSERT ... RETURNING id con JDBC cuando el mapping JPA no se haya validado. El ID se omite del INSERT y la base devuelve el valor. No usar @UuidGenerator ni asignar UUID.randomUUID(). Si se elige un mapping JPA de valor generado por la base, una prueba PostgreSQL debe demostrar que Hibernate no lo sustituye y recupera el ID correctamente. Esta decisión de adaptación debe quedar uniforme por módulo.

Las tablas con versiones de negocio separan identidad del recurso y versión inmutable. VERSION_TURNO conserva horario, oferta, duración, regla y modalidad aplicada; una sola versión es vigente. @Version o un contador equivalente protege concurrencia sobre la cabecera mutable, no convierte una versión histórica en editable. Los snapshots guardan condiciones mínimas y no duplican fichas completas ni datos clínicos.

### Convenciones de esquema

| Tema | Criterio propuesto |
| --- | --- |
| Tiempo | timestamptz para instantes; zona IANA en agenda; hora local para recurrencias |
| Restricciones | CHECK inicio < fin, duraciones positivas, UQ de negocio y FK compuestas |
| Estado | Códigos explícitos y transiciones de servicio; evitar booleanos contradictorios |
| Índices | tenant_id más filtros principales; índices de FK y búsquedas medidas |
| Borrado | Sin cascadas sobre fichas, turnos o auditoría; política específica por recurso |
| Consulta | DTO/proyección, paginación y ventanas temporales limitadas; evitar N+1 |

Flyway mantiene scripts inmutables una vez aplicados. Cada incremento agrega tablas de su caso de uso, permisos, RLS, índices y datos semilla estrictamente necesarios. El orden depende de referencias: identidad/entidades; pacientes; catálogo/agendas/coberturas; capacidad/turnos; avisos/chat; operación/transiciones. El orden exacto V2..Vn se fija al construir, sin prometer un script por capítulo.

Cambios incompatibles usan expansión, migración de datos y contracción posterior. No editar V1 ni usar ddl-auto=update en producción. Antes del despliegue se revisan bloqueo DDL, duración y plan de recuperación; rollback de binario no revierte automáticamente el esquema.

## 12. Pacientes, representación y numeración

PACIENTE es una ficha local de la entidad. CUENTA es la identidad de acceso. PACIENTE_PROFESIONAL es el vínculo numerado local de atención. Ninguno de esos conceptos sustituye a los otros ni concede facultades por existir una FK.

El número visible se asigna por (tenant_id, profesional_id), comienza en 1 y es común a las agendas locales del profesional. Dos profesionales o dos entidades mantienen series independientes. Dar de baja al paciente 12 no renumera al 13; reactivar recupera el mismo vínculo, UUID y número. El total de pacientes se calcula por estado y permiso.

### Alta atómica propuesta

1. Autorizar la ficha y el profesional local; buscar vínculo existente, incluso inactivo.
2. Crear el contador con INSERT ... ON CONFLICT DO NOTHING si todavía no existe.
3. Bloquear la fila del contador de esa serie y volver a consultar el vínculo.
4. Si existe, devolverlo o reactivarlo según la acción autorizada sin consumir número.
5. Incrementar contador con UPDATE ... RETURNING y crear el vínculo en la misma transacción.
6. Confirmar vínculo, auditoría y resultado de idempotencia juntos.

Las UQ de vínculo y número cierran carreras adicionales. Un rollback del alta revierte también el incremento. No se promete una serie sin huecos por correcciones/importaciones; se prohíbe reutilizar números confirmados. Nunca usar COUNT + 1 ni MAX + 1 sin serialización.

La representación requiere evidencia, vigencia, paciente concreto y facultades separadas de información/gestión. Contacto de emergencia y parentesco no habilitan el portal. El actor real y el paciente sobre el que actúa se guardan en toda operación y auditoría. Los conflictos entre representantes se derivan a revisión con acceso mínimo.

La admisión pública solo crea solicitud pendiente. Su aprobación no crea automáticamente un turno ni permite al personal conocer contraseñas. Los campos administrativos/cobertura del documento 18 siguen propuestos; no se incorporan por defecto todos los datos de la ficha dental de referencia.

## 13. Catálogo, agendas y elegibilidad

Scheduling separa definición de práctica, versión de definición, oferta por agenda y versión de oferta. La duración y las pausas se resuelven en servidor. Una modificación futura no altera de forma silenciosa turnos ya registrados; cada versión de turno conserva la regla aplicada.

La base inicial contiene Consulta, extracción, limpieza y cirugía. Una práctica personalizada mantiene base_inicial nula aunque se llame Consulta. Solo la identidad reservada CONSULTA, con oferta portal habilitada y sin gestión obligatoria, admite que el paciente/representante elija horario. Esta condición se verifica en disponibilidad, pre-reserva, registro y reemplazo.

### Evaluación previa a adquirir capacidad

1. Actor y paciente autorizados en la entidad, agenda y acción.
2. Profesional local activo y asociado a una identidad global verificada.
3. Práctica/oferta vigente y modalidad elegida por el paciente o personal autorizado.
4. Convenio/plan/afiliación y autorización administrativa aplicables, si corresponden.
5. Horario, excepciones, duración, pausas y recursos configurados.
6. Cuotas y restricciones vigentes, incluido el consumo por turnos confirmados.
7. Capacidad global y recursos disponibles en la transacción de adquisición.

Una evaluación guardada registra versiones y resultado, pero no sirve como permiso permanente. Se revalida al completar o reprogramar. Si una regla cambia durante la pre-reserva, el contrato de política debe indicar si se conserva el snapshot o exige revisión; ese detalle no está aprobado y debe resolverse antes de habilitar la oferta.

Los intervalos de ocupación son [inicio,fin), incluyendo pausas según configuración. La agenda guarda zona IANA; recurrencias se expanden en hora local y los intervalos resultantes se almacenan como instantes UTC. Se rechazan horas inexistentes y se pide resolver horas ambiguas en zonas con cambio horario. Un offset fijo de Argentina no sustituye la zona de agenda.

Las coberturas se evalúan por plan y vigencia. Sin información de cobertura es distinto de atenderse como particular. Ante incompatibilidad no se cambia a particular sin elección expresa. No se incorpora validación electrónica con obra social ni un portal para pagadores. Duraciones, traslados, capacidad de recursos y excepciones continúan en D02/D05/D06.

## 14. Coordinador de capacidad y concurrencia

El coordinador impide solapamientos del mismo profesional entre entidades. OCUPACION_GLOBAL conserva solo identificador técnico, profesional, intervalo, fase/estado y vencimiento necesarios; no contiene paciente, agenda ni entidad. Las referencias locales a la ocupación están en PRE_RESERVA/VERSION_TURNO. La API devuelve ocupado/disponible, nunca datos del origen del conflicto.

Se propone un lock transaccional sobre una fila estable del profesional global, seguido de una exclusión GiST sobre (profesional_id con igualdad, intervalo tstzrange con superposición) para ocupaciones activas. El soporte de igualdad UUID en GiST requiere btree_gist y privilegio de migración revisado. Lock y restricción se complementan; disponibilidad consultada antes no garantiza reserva [T2, T6].

### Protocolo único de escritura

1. Autorizar actor, entidad, agenda, práctica y sujeto; tomar locks de autorización relevantes.
2. Reclamar la clave de idempotencia y serializar cuota por sujeto/contexto.
3. Bloquear profesionales en orden de UUID; luego ocupaciones/turnos/recursos en orden estable.
4. Resolver ocupaciones temporales vencidas usando hora de base y transición explícita.
5. Verificar cuota/capacidad e insertar, convertir, mover o liberar ocupación.
6. Escribir estado local, historial, resultado idempotente y tareas durables.
7. Confirmar o revertir toda la operación.

La propuesta usa READ COMMITTED con locks/restricciones explícitas; cualquier cambio a SERIALIZABLE requiere reintentos completos. La cuota debe bloquear una clave estable incluso si todavía no hay turnos. No basta contar filas bajo READ COMMITTED sin serialización. El orden de locks también lo respetan cancelación, vencimiento, confirmación y workers.

El runtime no recibe SELECT/UPDATE global irrestricto. Se propone encapsular el acceso en funciones SQL de comandos y consulta mínima, con EXECUTE limitado, parámetros cotejados contra referencias locales y search_path fijo. Si usan SECURITY DEFINER, el dueño es un rol NOLOGIN de privilegios mínimos, se revoca EXECUTE a PUBLIC y no se interpola SQL. La base continúa siendo la misma para conservar una transacción. Esta superficie necesita revisión específica y pruebas con salud_app.

La limpieza global puede marcar una ocupación temporal vencida como expirada sin leer ficha ajena; el propietario local se reconcilia de forma idempotente antes de completar. Un handle de ocupación solo es válido si corresponde al profesional y a la referencia local autorizada. Ninguna función permite liberar una ocupación arbitraria conociendo su UUID.

## 15. Pre-reserva, registro e idempotencia

La consulta de horarios no ocupa capacidad. AcquireHold crea una pre-reserva persistida con vencimiento y ocupación asociada. No se mantiene una transacción abierta mientras el usuario completa datos. CompleteBooking convierte la pre-reserva sin liberar y readquirir el intervalo.

[[diagram:reserva]]

La transición valida propiedad, expiración, versión de oferta, elegibilidad, cuota y permisos actuales. Se crea TURNO con su primera VERSION_TURNO y asistencia pendiente; se cambia la fase propietaria de la ocupación y se cierra la pre-reserva en el mismo commit. Una única ocupación puede estar referida históricamente por ambas fases, pero solo una fase está activa.

Si venció, la operación rechaza y nunca desplaza una nueva reserva válida. La tarea periódica mejora higiene, pero el protocolo de escritura resuelve vencimientos relevantes aun si el worker se retrasó. No se usa un índice parcial dependiente de now() como sustituto de esa transición.

### Contrato de idempotencia propuesto

La clave se delimita por entidad, actor y operación; se guarda además la huella del payload canónico, estado y referencia de resultado. La unicidad se resuelve en base. Misma clave/mismo contenido retorna el resultado autorizado previo; misma clave/diferente contenido devuelve 409. Un reintento exige autenticación y facultades actuales antes de revelar el resultado.

La fila de éxito se confirma junto con el turno. Si la transacción revierte, no queda un éxito ficticio. Dos solicitudes simultáneas esperan por la misma clave o reciben una respuesta de operación en curso definida en el contrato; nunca crean dos turnos. La retención de claves debe cubrir el horizonte real de reintentos y no está fijada aquí. Fuera de scheduling se aplican unicidades equivalentes o un registro técnico adicional, con revisión de esquema.

Errores de exclusión/UQ se traducen después del rollback a conflicto estable. Deadlocks o serialización admiten reintentos automáticos acotados con la misma clave; se reejecuta la transacción completa. Un timeout de red después del commit se resuelve consultando/reintentando esa clave, no adivinando si el usuario debe reservar otra vez.

## 16. Estados, asistencia y cronograma

Los nombres concretos de estado son propuestos. Se mantienen dimensiones separadas; no se expone PATCH estado para saltar invariantes. Las transiciones aún abiertas requieren responsables y evidencia antes de habilitarse.

| Dimensión | Transiciones de diseño | Condición |
| --- | --- | --- |
| Admisión | Pendiente -> aprobada/activación -> activa; rechazo/revocación | Personal con facultad; vinculación verificada |
| Pre-reserva | Activa -> completada, vencida o liberada | Tiempo de base, dueño y capacidad coherentes |
| Turno | Registrado -> cancelado o sustituido | Comando explícito, historia y liberación/movimiento |
| Asistencia | Pendiente -> confirmada | Acción explícita de paciente/representante o asistencia facultada |
| Jornada | Llegó, en atención, atendido, ausente | Transiciones y titulares todavía pendientes |
| Entrega | Pendiente, reclamada, enviada, entregada, fallida | Estado técnico no confirma asistencia |

[[diagram:tiempo]]

Se programa un solo correo en un instante parametrizado entre T-72 y T-48. A T-36 se prepara WhatsApp si sigue pendiente. A T-24, sin confirmación válida y sin excepción aplicable, se cancela, libera capacidad, escribe historial/auditoría y persiste aviso interno a personal autorizado en una transacción. El envío externo no forma parte de esa atomicidad.

ConfirmAttendance y CloseUnconfirmed toman los mismos locks y vuelven a leer la versión/estado antes de cambiar. Debe decidirse en D07 la regla exacta de igualdad temporal y el efecto de procesamiento tardío; no se adopta silenciosamente que gane el primer worker o que un clic tardío rescate un turno. La propuesta es medir con hora de base tomada después del lock y aplicar una política explícita versionada.

Entrega, lectura, abrir enlace, login y chat no confirman. GET del enlace solo muestra información mínima y un botón; POST consume el propósito. El token está limitado a turno, versión, destinatario, acción y vencimiento; reprogramar invalida el anterior. Una confirmación tardía no revive un turno cancelado.

Turnos creados cerca de T, fines de semana, fallos de contacto, presupuesto agotado y ejecución posterior al corte requieren política operativa explícita. Un fallo de proveedor no es por sí solo motivo de cancelación. El modo sin configuración aprobada impide activar el cierre automático de esa cohorte y deriva a revisión; no modifica el cronograma general aceptado ni promete una excepción universal. La beta exige resolver D07 antes de operar esos casos.

## 17. Cancelación y reprogramación

Cancelar exige facultad específica, vigencia y política de cancelación voluntaria; el corte de asistencia T-24 no es automáticamente el plazo de cancelación del usuario. Cancelación, liberación, invalidación de tokens/tareas e historial se confirman juntos. Repetir una cancelación devuelve su resultado sin liberar capacidad de otro turno.

RescheduleAppointment adquiere primero el destino dentro de la misma transacción que sustituye el origen. Se conserva el mismo turno con nueva versión inmutable, o la relación de sustitución prevista en el modelo que se apruebe; no se reescribe una versión anterior. Si el destino falla, el rollback conserva íntegro el original.

Si el nuevo intervalo se solapa con la propia ocupación, el coordinador modifica/reemplaza esa ocupación bajo el lock del profesional y comprueba conflicto con las demás. No debe provocar conflicto consigo mismo ni abrir un instante visible sin ocupación. Cambiar de profesional bloquea ambos en orden. Recursos se mueven en la misma unidad atómica.

### Ausencia del profesional: flujo distinto

1. Autorizar el lote y persistir fecha/intervalos afectados y responsable.
2. Registrar indisponibilidad efectiva para impedir nuevas reservas incompatibles.
3. Identificar turnos vigentes afectados con deduplicación por versión y lote.
4. Crear aviso WhatsApp para todos, incluidos los de asistencia confirmada, sin esperar T-36.
5. Conservar seguimiento separado de aviso y reemplazo, con bandeja de fallidos/sin respuesta.
6. Permitir elegir destino solo para Consulta habilitada; otras prácticas van a personal autorizado.

El lote se procesa en unidades pequeñas reiniciables. Durante su preparación debe existir una barrera efectiva que impida nuevas reservas en los tramos. Se vuelve a validar la afectación de cada turno para no avisar a un turno que ya cambió legítimamente. El estado del original, liberación de ocupación y plazo del reemplazo siguen D07/D09: no se inventa cancelación masiva automática.

Enviar el aviso no cierra el caso ni asigna reemplazo. Si WhatsApp falla o no existe contacto utilizable, se registra gestión asistida; cambiar de canal no demuestra cumplimiento del aviso obligatorio. El mensaje minimiza datos e incluye enlace de propósito limitado. Un lote solo cierra cuando sus casos y pendientes tienen un resultado operativo registrado.

## 18. Tareas durables, canales y webhooks

La misma transacción de negocio persiste la tarea o el aviso pendiente: patrón de salida transaccional sobre las tablas existentes TAREA_PERSISTIDA/AVISO_EXTERNO. No se añade una tabla outbox duplicada sin necesidad. Identity usa TAREA_IDENTIDAD/ENVIO_IDENTIDAD para recuperación y activación.

### Ejecución propuesta

1. Un dispatcher restringido obtiene solo entidad, ID de trabajo y vencimiento, sin datos de pacientes.
2. Un worker abre transacción con contexto de esa entidad, reclama mediante FOR UPDATE SKIP LOCKED y guarda lease, intento y versión.
3. Confirma el reclamo y termina la transacción antes de llamar al proveedor.
4. Envía con timeout y clave de deduplicación cuando el proveedor la soporte.
5. Abre otra transacción local y aplica respuesta solo si conserva el lease/versionado correcto.
6. Reprograma reintentos recuperables con espera creciente, variación y máximo parametrizado; fallos permanentes van a bandeja.

El dispatcher global es una excepción técnica limitada, a diseñar como función de metadatos sin SELECT sobre todas las tablas T. No se le entrega BYPASSRLS. Su cursor/cola mínima y los campos de lease son una ampliación física propuesta que debe revisarse al migrar. Una alternativa inicial es iterar entidades habilitadas mediante un contrato global acotado; en ambos casos las operaciones de negocio vuelven a RLS por entidad.

La entrega es al menos una vez. Caer tras enviar y antes de guardar respuesta puede duplicar un mensaje; se mitiga con deduplicación del proveedor y reconciliación de estado. No se promete exactamente una vez en la red. El estado enviado/entregado no confirma asistencia.

Webhooks verifican firma sobre el cuerpo original, fecha y protección contra replay. La clave única incluye proveedor, cuenta de canal e ID de evento. Se persiste el evento antes de responder aceptación; procesamiento posterior idempotente. El tenant se obtiene de la configuración de canal verificada, nunca de un tenant_id libre en el payload. Eventos fuera de orden no regresan el estado desde entregado a enviado.

Presupuesto y cuota de envío se reservan atómicamente antes de llamar al proveedor; se concilian según la política de costos. Agotar presupuesto genera alerta y revisión, sin cancelar turnos por ese hecho. Remitentes, consentimiento operativo, plantillas, proveedor y ventanas siguen pendientes; no se incorporan tarifas como valores aprobados.

## 19. Chat, bajas y continuidad profesional

El chat es texto humano persistido por entidad, conversación y participantes con facultades. Delegar agenda no permite leerlo. Cada lectura, envío y consulta de historial valida participación y representación actuales. El cuerpo se trata como texto, se limita tamaño/frecuencia y se escapa al presentar; no se ejecuta HTML ni instrucciones contenidas en mensajes.

Se propone HTTP paginado y consulta incremental para beta, con cursor estable por conversación. SSE/WebSocket podrá agregarse si mejora la experiencia, aplicando autenticación, origen y revocación también durante conexiones largas. No se necesita un canal en tiempo real para garantizar persistencia.

Un mensaje crea una consulta o solicitud de gestión; nunca adquiere capacidad ni confirma asistencia. Llegar a un turno desde chat llama al mismo caso de uso formal. Avisos internos evitan difundir texto sensible en correos o métricas. Inicio, participantes, edición, conservación y horarios de atención permanecen en D13; secretaría requiere concesión de chat separada.

### Tres operaciones distintas sobre un profesional

| Operación | Resultado permitido | Lo que requiere resolver |
| --- | --- | --- |
| Baja institucional | Finaliza vínculo/delegaciones locales | Tratamiento explícito de turnos y pendientes |
| Transición administrada | Habilita destino y continuidad del fichaje autorizado | Mecanismo de copia/proyección, numeración y pacientes compartidos |
| Eliminación solicitada | Tramita petición expresa verificada del profesional | Retiro de credenciales/referencias preservando fichas e historial |

La cuenta persiste aunque no tenga institución activa. La baja local no la elimina ni afecta agendas en otras entidades. La transición utiliza un plan con previsualización, aprobación administrativa facultada, pasos idempotentes y evidencia por origen/destino. Si ocupa varios commits, una máquina de proceso registra avance y recuperación; no se finge una única transacción distribuida.

No se copian automáticamente admisión, representación, chat, convenios, delegaciones o turnos. No se cambia tenant_id en bloque ni se convierte la clínica en entidad personal. Hasta resolver D04/D12, las operaciones de traslado/eliminación quedan deshabilitadas; el diseño permite implementarlas después sin abrir acceso general. No se define aquí retención legal ni anonimización definitiva.

## 20. API HTTP y contratos de error

La API propuesta usa /api/v1. Las rutas locales incluyen /entities/{tenantId}; el servidor valida el contexto en cada solicitud. Los nombres ingleses son convenciones técnicas candidatas; el dominio y mensajes al usuario permanecen en español. El anexo B propone una ruta por cada CU sin convertir trabajos internos en endpoints públicos.

| Convención | Contrato |
| --- | --- |
| Lectura | GET sin efectos de negocio, proyección autorizada y paginada |
| Creación | POST con validación; 201 y Location cuando hay recurso nuevo |
| Comando | POST al recurso/acción; idempotencia y versión cuando corresponda |
| Actualización | PUT/PATCH solo de campos editables, con control de versión |
| Identificadores | UUID como string; el servidor genera IDs de altas ordinarias |
| Tiempo | Instantes ISO-8601 con zona/offset; agenda con zona IANA explícita |
| Paginación | size acotado, orden estable; cursor en chat y cargas grandes |

No se publican controladores para ejecutar cron, liberar ocupaciones globales ni leer tablas de tokens. Disponibilidad retorna intervalos elegibles sin pacientes ajenos. El personal usa la misma lógica de capacidad que el portal; difieren sus facultades, no las garantías.

```json
{
  "type": "urn:salud:problem:capacity-conflict",
  "title": "Horario no disponible",
  "status": 409,
  "code": "CAPACITY_CONFLICT",
  "correlationId": "valor-generado-por-el-servidor"
}
```

Problem Details conserva status, title y type con extensiones estables. 400 indica formato/validación; 401 falta autenticación; 403 acción denegada; 404 recurso no visible; 409 conflicto de capacidad/idempotencia/estado; 412 versión If-Match obsoleta si se adopta ETag; 429 límite temporal con Retry-After cuando sea posible; 503 dependencia no disponible. No devolver SQL, stacktrace, tokens ni identidad de otra entidad.

Un identificador de correlación enlaza HTTP, tarea y auditoría sin incluir DNI, correo o mensaje. Los DTO de entrada no aceptan actor real, permisos, costo computado ni duración efectiva como autoridades. Una especificación OpenAPI deberá declarar seguridad, CSRF, DTO, ejemplos ficticios, idempotencia y alternativas; agregar una dependencia compatible es trabajo futuro.

## 21. Ejemplo de un caso de uso completo

Ejemplo de diseño: paciente admitido reserva Consulta. No es código compilado ni un endpoint ya disponible. Los valores de cuota y TTL se leen de política aprobada, no de números embebidos.

```text
POST /api/v1/entities/{tenantId}/holds
Cookie: sesión de servidor
X-CSRF-TOKEN: token vigente
Idempotency-Key: clave del cliente
Body: pacienteId, ofertaId, inicio, modalidad

Controller:
  valida formato -> obtiene actor autenticado
  llama AcquireHold con referencias del request

TenantTransactionExecutor:
  abre transacción -> fija tenant previamente autorizado
  valida facultades, representación y versión de política
  reclama idempotencia -> lock de cuota
  calcula intervalo desde oferta vigente
  CapacityPort adquiere lock y excluye superposición
  guarda pre-reserva + evidencia + resultado
  commit -> devuelve holdId, expiresAt y versión
```

El controlador no abre una conexión adicional para setear tenant ni decide permisos con datos del body. TenantTransactionExecutor es un nombre propuesto para un componente explícito de coordinación: autoriza el contexto mediante contratos globales mínimos y configura la conexión antes de leer tablas locales. La secuencia no depende del orden accidental de dos aspectos AOP ni de una llamada interna que evada @Transactional.

CompleteBooking requiere holdId, versión y datos administrativos mínimos. Revalida la misma identidad/entidad, conserva ocupación, registra el turno y persiste su plan de avisos mediante el puerto transaccional. El tiempo que el paciente tardó entre ambos POST no mantiene locks de base.

### Respuestas de ejemplo

| Situación | Resultado observable |
| --- | --- |
| Otra entidad ganó el intervalo | 409 sin mencionar entidad ni paciente |
| Personalizada renombrada Consulta | Rechazo por oferta no autogestionable |
| Dos reintentos de la misma clave | Una pre-reserva y el mismo resultado |
| Hold vencido o ya reemplazado | Conflicto estable; no reaparece capacidad |
| Delegación revocada tras abrir pantalla | Nueva operación rechazada |
| Fallo antes del commit | Sin turno, ocupación o tarea parciales |

En pruebas se inyecta Clock para decisiones de dominio y se controla la hora usada en SQL; no se simulan esperas de horas. El resultado HTTP se construye con datos ya persistidos y permisos actuales.

## 22. Auditoría, reportes y privacidad

La evidencia de negocio registra actor real, paciente representado cuando aplique, entidad, acción, recurso/versión, instante, motivo, cambios mínimos y resultado. Los eventos globales y de entidad se separan. No se copian cuerpos completos de chat, formularios, contraseñas, cookies o tokens a logs.

AUDITORIA_ENTIDAD es de agregado cronológico por servicios autorizados. Se propone que el runtime pueda insertar y consultar según facultad, con actualización/borrado ordinarios denegados. Esto mejora integridad operativa, pero no demuestra inmutabilidad criptográfica frente al administrador de base. Conservación, exportación y acceso de soporte necesitan política explícita.

Reporting recibe el alcance efectivo del solicitante, aplica RLS y filtros por agenda/paciente/campo. Los reportes básicos derivan de turnos y eventos; la dependencia Jasper no prueba que existan reportes de negocio. No se acepta SQL o plantilla JRXML enviada por un usuario.

### Exportaciones propuestas

1. Autorizar campos y recursos al solicitar, con filtros/ventanas acotados.
2. Ejecutar como consulta pequeña o trabajo asincrónico con el mismo contexto local.
3. Minimizar datos, registrar acceso y conservar un archivo temporal privado por tiempo definido.
4. Volver a comprobar facultades antes de descargar; enlaces firmados de vida corta si hay almacenamiento externo.
5. Eliminar el temporal conforme a política y registrar fallo sin exponer contenido.

Las plantillas PDF se versionan y compilan desde recursos confiables. XLSX escribe datos de usuario como texto cuando corresponda; CSV protege contra interpretación de fórmulas al abrir en hojas de cálculo. Se contemplan acentos UTF-8, separadores, comillas, zona horaria y nombre de archivo seguro. La numeración visible se muestra con profesional y entidad; UUID queda como referencia técnica cuando sea útil.

Las exportaciones grandes usan proyecciones/paginación y límites de memoria. No se entrega acceso general a toda la entidad por tener permiso de reportes. Una revocación cancela nuevas descargas, aunque el archivo se haya generado antes. La retención de fichas, mensajes, auditoría y documentos no se fija por conveniencia técnica: requiere decisión del responsable dentro de D11/D13/D16.

## 23. Pruebas y criterios verificables

Las pruebas futuras se priorizan por garantías del producto. La evidencia histórica de la base no sustituye estas pruebas. PostgreSQL real/Testcontainers es obligatorio para RLS, uuidv7, exclusión, locks, migraciones y FK; H2 no reproduce esas garantías.

| Nivel | Qué verificar | Evidencia de aceptación |
| --- | --- | --- |
| Dominio | Oferta Consulta, duración, estados, cortes y representación | Casos de reglas con Clock controlado |
| Aplicación | Coordinación, rollback, idempotencia y autorización | Fallos inyectados sin estados parciales |
| Persistencia | RLS, FK local, UUIDv7, contador y exclusión | Conexiones/rol runtime reales |
| HTTP | Sesión, CSRF, DTO, privacidad, errores y CORS | Solicitudes permitidas y negativas |
| Proveedores | Firma, duplicados, timeout, fuera de orden | Adaptador con servidor simulado/entorno de pruebas |
| Arquitectura | Capas, repositorios y ausencia de ciclos | Verificación automática de dependencias |
| Operación | Reinicio, backlog, restauración, migración y carga | Informe reproducible y objetivos acordados |

### Escenarios críticos mínimos

1. Dos entidades compiten por el mismo profesional/intervalo: solo una reserva.
2. Dos altas del mismo paciente-profesional: un vínculo y un número; otra serie sigue independiente.
3. Dos operaciones disputan la última cuota, incluidos turnos confirmados: una sola consume.
4. Convertir hold no abre una ventana libre; completar vencido no desplaza una reserva válida.
5. Reprogramar a destino ocupado conserva el original; cancelación repetida no libera otro turno.
6. Confirmación y cierre T-24 producen un solo resultado según la política aprobada.
7. Worker cae después de enviar: reanudación sin perder tarea y duplicado externo tratado.
8. Conexión reutilizada tras rollback/contexto ausente no ve datos de la entidad anterior.
9. Secretaría con delegación de agenda no lee chat ni admite pacientes sin facultad.
10. Paciente no elige otra práctica por API, cambio de nombre o WhatsApp de reprogramación.

La carga se deriva de turnos mensuales y ráfagas de agenda, no de usuarios registrados. Medir p95/p99, errores, lock waits, conexiones, duración de consulta, memoria de reportes y retraso de tareas. D11/D16 deben fijar umbrales de aceptación; este manual no declara un SLA ni una concurrencia validada.

## 24. Despliegue, observabilidad y recuperación

La primera topología propone VPS, proxy HTTPS, un proceso Spring y PostgreSQL en red privada, más almacenamiento externo protegido para copias. Colocar base y aplicación en el mismo host es una opción a evaluar; aumenta el impacto de una caída del VPS. Proveedor, región y recursos requieren cotización y medición.

Se construye un JAR una vez y se promueve el mismo artefacto por entornos. El pipeline ejecuta verificación, genera inventario de dependencias, revisa hallazgos relevantes y conserva evidencia. El job de migración usa credenciales separadas; el proceso HTTP no tiene permiso DDL. Despliegues múltiples requieren reclamo durable de tareas y sesiones compartidas antes de escalar réplicas.

### Señales de operación

| Señal | Qué permite detectar |
| --- | --- |
| HTTP latencia/errores sin datos personales | Degradación y rutas fallidas |
| Pool, locks y consultas lentas | Saturación y contención |
| Tareas vencidas y antigüedad del backlog | Avisos/cierres fuera de tiempo |
| Entregas fallidas, gasto y cuota | Fallos del proveedor o presupuesto |
| Conflictos y rechazos por acción | Abuso o configuración incorrecta |
| Último respaldo y ensayo de restauración | Riesgo real de recuperación |

No usar paciente, correo, tenant arbitrario o UUID de turno como etiquetas de alta cardinalidad de métricas. CorrelationId identifica un recorrido en logs restringidos. Actuator público conserva solo salud sin detalles; métricas/diagnóstico se exponen en red de gestión autenticada si se habilitan. Liveness no depende de base; readiness sí en la configuración actual [T8].

La política de alertas necesita responsables y canales operativos; no basta emitir un log. Un retraso de tareas de asistencia requiere revisar cohortes afectadas antes de ejecutar cierres tardíos. El apagado graceful detiene nuevos reclamos; leases permiten recuperar tareas abandonadas tras un crash.

Backups externos cifrados, credenciales distintas y restauración en entorno aislado son requisitos antes de datos reales. RPO/RTO se acuerdan y miden. Tras restaurar se revisan estado de turnos, ocupaciones, versiones, tareas y envíos ya realizados; se reconcilia con proveedor para no duplicar avisos o ejecutar cancelaciones viejas. PITR es candidato según RPO, con prueba y costo propios.

## 25. Manual operativo para desarrollo y soporte

Los comandos de arranque existentes se ejecutan desde salud-api. Docker Desktop requiere motor Linux; JDK 21 debe estar instalado. No se imprimen secretos ni se incluyen en parámetros de ejemplo.

```powershell
# Desde salud-api, con JAVA_HOME apuntando al JDK 21.
.\scripts\start-local.ps1

# Verificación completa en otra sesión de PowerShell.
.\mvnw.cmd -B -ntp clean verify

# Salud básica sin detalles privados.
Invoke-RestMethod http://localhost:8080/actuator/health
```

start-local crea un .env ignorado por Git si falta, inicia PostgreSQL local e inyecta variables al proceso; Spring no carga ese archivo por sí mismo. Cambiar el .env no cambia contraseñas de un volumen ya inicializado. Detener Compose conserva datos; no se elimina un volumen como solución rutinaria a un error de credenciales.

### Procedimientos propuestos de soporte

| Síntoma | Acción inicial | Recuperación controlada |
| --- | --- | --- |
| No arranca por esquema | Leer validación Flyway y versión del artefacto | Aplicar migración revisada; no editar historial |
| Horario aparece ocupado | Revisar capacidad con herramienta acotada | Corregir estado por comando auditado, sin SQL manual general |
| Aviso fallido | Verificar destino permitido, canal y presupuesto | Reintento o gestión asistida con deduplicación |
| Cuenta comprometida | Revocar sesiones y facultades afectadas | Recuperación verificada y revisión de eventos |
| Turnos pendientes tras caída | Identificar intervalo de interrupción | Aplicar política de ejecución tardía aprobada |
| Restauración requerida | Aislar incidente y preservar evidencia | Restaurar fuera de producción y validar antes de conmutar |

Soporte no obtiene acceso permanente a fichas por ser desarrollador. ACCESO_SOPORTE debe registrar caso, finalidad, ámbito, aprobación facultada y vencimiento. Operación puede conocer métricas/errores mínimos sin leer conversaciones.

Los secretos se inyectan por entorno o gestor de infraestructura con permisos mínimos. Rotación de contraseña de base, clave de webhook o credencial de canal requiere procedimiento que mantenga continuidad y evite logs sensibles. El responsable de producción, alertas, copias e incidentes debe quedar identificado antes del piloto.

## 26. Plan de construcción por incrementos

El plan respeta la documentación existente y evita generar todas las tablas/CRUD de una vez. Cada incremento entrega un recorrido verificable con autorización, RLS, auditoría, contrato HTTP y evidencia. Los nombres de clase y rutas de este manual pueden ajustarse conservando sus garantías.

| Etapa | Entrega técnica | Condición de cierre |
| --- | --- | --- |
| A. Contratos y seguridad | Revisar base, políticas abiertas, capas y esquema de contextos | Pruebas de arquitectura y matriz de facultades aplicable |
| B. Identidad y organización | Login/recuperación/MFA, entidades, membresías y delegación | Revocación, CSRF y sesiones comprobadas |
| C. Pacientes | Admisión, activación, representación y numeración | Solicitud sin acceso prematuro; contador concurrente |
| D. Oferta y capacidad | Catálogo, cobertura, agendas y coordinador | Cruces de entidad y superposición rechazados |
| E. Turno integral | Hold, registro, consulta, confirmación y cancelación | Idempotencia, rollback y carreras verificadas |
| F. Avisos y reprogramación | Cronograma durable, webhooks, lote WhatsApp y bandejas | Reinicios, duplicados y seguimiento completo |
| G. Chat y reportes | Participación, consulta incremental, exportación | Privacidad por acción y descarga revocable |
| H. Operación beta | Carga, observabilidad, copias, restauración e incidentes | Evidencia S01-S16 y pendientes aplicables resueltos |

Transición del fichaje y eliminación solicitada requieren resolver D04/D12 antes de habilitar sus comandos. Si su diseño no está listo, el piloto debe acordar explícitamente su alcance operativo; no se ocultan como funciones terminadas. CU-35 no se implementa como alta comercial automática por aparecer en el catálogo de casos de uso.

### Definición de terminado de una función

Regla y permiso trazables; contrato de entrada/salida; migración con claves/RLS/permisos; caso de uso con transacción; auditoría y tareas consistentes; prueba negativa/concurrencia según riesgo; documentación operativa y configuración; evidencia ejecutada. Una clase, un endpoint o un PDF por sí solos no cierran un incremento.

Cada cambio se mantiene revisable y se registra con un commit específico. El commit 9383b98 es el punto documental previo; este manual constituye una nueva entrega de diseño. No se publica ni se hace push por esta solicitud. La automatización de seguimiento de versiones existente no se modifica.

## 27. Decisiones pendientes y comportamiento seguro

Los pendientes originales se conservan con sus IDs. Este manual desarrolla una propuesta técnica pero no completa facultades o parámetros de producto por inferencia. El responsable funcional decide reglas; el equipo técnico aporta alternativas y evidencia.

| ID | Decisión necesaria | Dependencia práctica |
| --- | --- | --- |
| D01 | TTL, renovaciones y límites de holds | Sin valores aprobados no habilitar pre-reservas reales |
| D02 | Identidad global, traslado, recursos y locks | Verificar profesional; no asumir sincronización externa |
| D03 | Concesiones, delegación y revocación | ? de matriz permanece denegado |
| D04 | Salida/transición/eliminación y turnos | No mover fichas ni borrar cuenta por baja local |
| D05 | Duración, oferta y ciclo de catálogo | No habilitar oferta con tiempos ficticios |
| D06 | Planes, cobertura y excepciones | No convertir a particular silenciosamente |
| D07 | Correo exacto, T-24, turnos cercanos y fallos | Revisar cohortes sin política, sin cierres improvisados |
| D08 | Evidencia/facultades de representación | No conceder acceso por parentesco |
| D09 | Proveedor, plantilla, presupuesto y lote | Bandeja asistida; WhatsApp de ausencia obligatorio |
| D10 | Comercial y fin de servicio | Diferido I2/I3; no suspender por abono inexistente |
| D11 | Carga, conservación y rendimiento | Medir sin prometer capacidad por estimación |
| D12 | Numeración física, importación/fusión/destino | Conservar números; sin fusiones automáticas |
| D13 | Participantes y conservación de chat | Chat separado de agenda; sin IA ni cambio automático |
| D14 | Alta, admisión, método correo y vínculo | Login válido no equivale a acceso privado |
| D15 | Cuotas, frecuencia, anti-bot y excepciones | Incluir confirmados; no suspender por DNI denunciado |
| D16 | Sesión, proveedores, VPS, costo, RPO/RTO | Copias y restauración verificadas antes de datos reales |

La política de identificadores dejó de estar abierta con ADR-015. El cronograma general y WhatsApp para ausencia ya están aceptados; D07/D09 resuelven detalles sin reabrir esas decisiones. La recuperación por email del equipo también está confirmada.

Las opciones técnicas nuevas que deben revisarse son sesión JDBC, estrategia de inserción UUID, función restringida del coordinador, esquema de dispatcher/leases, locks de autorización y cuota, y herramientas de contrato/pruebas. Documentarlas permite discutirlas con precisión; no las convierte en componentes instalados.

## 28. Riesgos técnicos y respuesta de diseño

| Riesgo concreto | Prevención | Evidencia requerida |
| --- | --- | --- |
| Tenant incorrecto en conexión reutilizada | Contexto local por transacción y RLS | Pool reutilizado tras éxito, error y rollback |
| Dos reservas simultáneas | Lock estable y exclusión global | Dos conexiones reales y resultado único |
| Revocación ignorada por pantalla abierta | Permisos actuales y protocolo concurrente | Próxima operación rechazada |
| Cuota superada por carrera | Lock de cuota y consumo consistente | Dos actores disputan última unidad |
| Notificación perdida al reiniciar | Intención durable en commit local | Crash antes/después de envío y recuperación |
| Cierre incorrecto tras caída larga | Política de tardanza y revisión de cohorte | Simulación de interrupción cerca del corte |
| Aviso expone datos sensibles | Destino verificado y contenido mínimo | Revisión de payload y logs |
| Traslado rompe aislamiento | Proceso administrativo por pasos | Ensayo origen/destino y pacientes compartidos |
| Exportación filtra información | Alcance por recurso/campo y reautorización | Pruebas de reporte y descarga tras revocación |
| Restore duplica envíos/cierres | Reconciliación y política de reanudación | Ensayo con proveedor simulado |

La dependencia de un coordinador global merece revisión especial: es el único punto que debe conocer ocupación entre entidades. Su consulta mínima no permite inferir a qué paciente o clínica corresponde el bloqueo. Se limitan frecuencia y ventanas de disponibilidad para reducir enumeración, sin introducir una lista de ocupaciones ajenas.

La defensa de abuso contempla familias y representantes con varios menores. Se limita por actor, paciente, operación, entidad y señales de red; ninguna señal aislada prueba identidad. El modo de solo solicitudes conserva consulta y confirmación legítimas, sin cancelar masivamente por sospecha. Restricciones y excepciones se registran para revisión humana.

Escalar el JAR o el VPS no resuelve un modelo transaccional incorrecto. Las primeras optimizaciones deben salir de métricas de consulta, locks, pool y workers. Lecturas cacheadas de disponibilidad siempre se revalidan al escribir. No se cachean decisiones de permiso de forma que sobrevivan una revocación efectiva.

## 29. Referencias y trazabilidad de las decisiones

### Fuentes del repositorio

| Referencia | Documento | Uso en este manual |
| --- | --- | --- |
| F1 | docs/03-reglas-del-dominio.md | R01-R12 y D01-D16 |
| F2 | docs/13-estado-consolidado-y-pendientes.md | Vigencia, límites y decisiones abiertas |
| F3 | docs/06-seguridad-beta.md | S01-S16 y evidencia de beta |
| F4 | docs/21-casos-de-uso.md | CU-01..37; anexo B |
| F5 | docs/22-matriz-de-permisos.md y docs/permisos/matriz.json | Condiciones y 46 acciones; anexo C |
| F6 | docs/23-modelo-entidad-relacion.md y modelo-er/modelo-er.json | 88 entidades, 252 FK y ámbitos; anexo A |
| F7 | docs/arquitectura/adr/001..015 | Decisiones aceptadas y precisiones |
| F8 | salud-api/README.md, pom.xml, application.yml y SecurityConfiguration.java | Base real, configuración y dependencias |
| F9 | docs/24-verificacion-base-servidor.md | Evidencia histórica del 16/10, no reejecutada |

Los documentos 16, 18, 19 y 20 amplían catálogo, ficha, transición y acceso; se conserva su estado propuesto donde corresponda. Los antecedentes sustituidos de docs/archivo no se usan como reglas vigentes.

### Fuentes técnicas primarias consultadas el 20/10/2026

- [T1 - PostgreSQL 18: Row Security Policies](https://www.postgresql.org/docs/18/ddl-rowsecurity.html)
- [T2 - PostgreSQL 18: Range Types y exclusión](https://www.postgresql.org/docs/18/rangetypes.html)
- [T3 - Spring Security: protección CSRF](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html)
- [T4 - Spring Framework: eventos transaccionales](https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html)
- [T5 - PostgreSQL 18: funciones UUID](https://www.postgresql.org/docs/18/functions-uuid.html)
- [T6 - PostgreSQL 18: locks explícitos](https://www.postgresql.org/docs/18/explicit-locking.html)
- [T7 - Spring Security: persistencia de autenticación y sesiones](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html)
- [T8 - Spring Boot: endpoints Actuator](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html)

Las fuentes técnicas sustentan los mecanismos citados, no la aprobación del negocio ni el estado instalado. Los contratos, límites de módulo, estrategia de locks y plan de construcción son síntesis de ingeniería para este proyecto. No se copian plantillas externas ni se consultan otras conversaciones.

## 30. Mantenimiento y regeneración del manual

Fuente editable: docs/25-arquitectura-servidor-spring.md. Generador: scripts/generar-manual-arquitectura-spring.py. PDF de salida: output/pdf/manual-arquitectura-servidor-spring.pdf. Los anexos se derivan de las fuentes JSON y casos de uso existentes, de modo que las entidades y marcas MP puedan verificarse sin transcribirlas a mano.

El generador comprueba que cada entidad tenga un dueño, no haya entidades repetidas o ausentes, aparezcan los 37 casos y se conserven las 46 acciones y las cinco operaciones técnicas. El anexo D enlaza R01-R12 y S01-S16 con capítulos y evidencia futura. Los esquemas embebidos son vectoriales y mantienen texto legible al ampliar. El índice contiene páginas calculadas y marcadores de navegación.

Para regenerar, usar Python con ReportLab, pypdf y Pillow disponibles en el entorno. El script resuelve sus rutas desde su ubicación y no depende del directorio desde el que se ejecute.

```powershell
python scripts/generar-manual-arquitectura-spring.py
```

Antes de entregar una nueva versión: revisar consistencia con ADR vigentes; regenerar; comprobar texto y cobertura de anexos; renderizar páginas; inspeccionar tablas, figuras, encabezados y numeración. Las verificaciones documentales no se reportan como pruebas funcionales del servidor.

Un cambio de regla aceptada requiere su ADR y actualización coordinada de reglas, casos, matriz, modelo y manual según corresponda. Una mejora de nombre o estructura interna que preserve el contrato puede registrarse como revisión técnica. Los pendientes se cierran con decisión y evidencia, nunca eliminando su identificador de un texto aislado.

El manual establece una arquitectura implementable y un orden de trabajo. La entrega funcional se mide con los recorridos y pruebas del capítulo 23 y los criterios S01-S16, no por la cantidad de paquetes o tablas creados.
