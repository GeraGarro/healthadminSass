# Modelo entidad relación completo

17 de octubre de 2026 · Versión 1.1 · Modelo lógico propuesto para revisión con identificadores aceptados en ADR-015

88 entidades, 252 referencias FK y 17 láminas de detalle, más un plano integral en draw.io con conectores entre áreas.

## Estado del modelo

Modelo lógico del alcance documentado al 16 de octubre de 2026, actualizado el 17 de octubre con ADR-015. Las reglas confirmadas se conservan. Se acepta UUID versión 7 para los IDs internos; las demás tablas, columnas, tipos, estados y mecanismos nuevos mantienen su condición de propuesta para revisión. No es una migración SQL ni acredita implementación.

## Identificadores internos

ADR-015 establece UUIDv7 para toda PK interna y tipo PostgreSQL uuid para PK y FK, incluido tenant_id. PostgreSQL genera cada PK mediante DEFAULT uuidv7(); las FK conservan el UUID del padre y no generan valores propios. El ID es inmutable, no se reutiliza y mantiene restricciones PK/UQ. Java usa java.util.UUID y JSON/frontend cadenas UUID con guiones. Los números visibles, contadores, versiones y códigos externos conservan su tipo propio.

## Uso de identificadores

El número visible del paciente es entero y pertenece al profesional dentro de la entidad; no se deriva del UUID ni lo sustituye. Las pantallas y reportes habituales usan ese número con su contexto. Conocer un UUID no concede acceso ni sustituye tokens secretos. UUIDv7 incorpora tiempo; no reemplaza creado_en, auditoría ni el orden de confirmación de transacciones. Se conservan tenant_id, claves compuestas, RLS y permisos del servidor.

## Ámbito y lectura

G significa global restringido; T pertenece a una entidad y lleva tenant_id obligatorio; X es una excepción administrativa entre origen y destino, accesible solo mediante operación controlada. Global no significa público. Cada ficha es local: no se crea un paciente global compartido por coincidencia de datos.

## Claves y cardinalidad

PK identifica la clave interna; FK identifica la referencia; UQ indica unicidad; ? significa opcional. Toda tabla T tiene PK(id) y UQ(tenant_id,id); cada referencia T a T usa FK(tenant_id,campo_id) a (tenant_id,id). Los IDs internos son únicos. Un padre admite 0..N hijos salvo UQ específico. La nulabilidad de la FK determina 1 o 0..1 padre por hijo; las UQ descritas pueden reducir los hijos a 0..1.

## Convención de atributos

Se muestran todos los atributos propuestos en el diccionario, JSON, Mermaid y draw.io. Para legibilidad, cada lámina enlaza las relaciones dentro de su grupo; las FK a otros grupos nombran su destino en la fila. El registro de relaciones enumera todas las referencias, incluido tenant_id. Restricciones de igualdad y ámbito adicionales se explicitan por entidad.

## Aislamiento y acceso

RLS y permisos del servidor complementan las claves compuestas. La cuenta, membresía, admisión, representación, alcance, delegación y participación de chat son comprobaciones separadas. Los roles no resuelven celdas pendientes de la matriz MP. La auditoría no concede acceso a los recursos referidos.

## Numeración estable

PACIENTE_PROFESIONAL conserva la serie por tenant_id y profesional_id. CONTADOR_PACIENTE empieza en 0 y asigna el primer número 1 dentro de una transacción serializada. La baja del 12 conserva su número, no altera el 13 y no permite reutilizar el 12. Reactivar devuelve la misma relación; no se infiere un total desde el último número.

## Reserva y capacidad

OCUPACION_GLOBAL no contiene pacientes, agendas ni entidades. PRE_RESERVA y primera VERSION_TURNO pueden referir a la misma ocupación, con el mismo profesional, pero solo una fase puede estar activa. La conversión conserva esa ocupación sin intervalo libre. Ninguna ocupación activa queda sin propietario local válido. Confirmar asistencia no crea ni libera capacidad.

## Horarios y concurrencia

Los intervalos son [inicio,fin), con inicio menor que fin. Se guardan instantes y zona de agenda; las recurrencias conservan hora local. La exclusión por profesional se aplica a ocupaciones activas; vencer requiere transición explícita. La política de locks, pausas de traslado y recursos sigue D02. Reprogramar adquiere destino y sustituye origen de forma atómica, conservando original si falla.

## Versiones y estados

VERSION_PRACTICA, VERSION_OFERTA, VERSION_CONVENIO y VERSION_TURNO son inmutables. Una sola versión de turno está vigente. Estados de admisión, pre-reserva, turno, asistencia, jornada, entrega y reemplazo son dimensiones distintas; sus transiciones detalladas requieren revisión. Los snapshots JSON solo conservan condiciones aplicadas, no reemplazan las FK principales ni autorizan contenido clínico.

## Selección exclusiva de Consulta

PRACTICA.base_inicial es una identidad reservada a las cuatro prácticas iniciales. La base CONSULTA es única por entidad e inmutable mediante edición común. Una personalizada tiene base nula aunque su nombre o clasificación sea Consulta. VERSION_OFERTA.portal_habilitado solo es válido para la base CONSULTA sin gestión obligatoria. Servidor valida la relación completa al reservar y reprogramar.

## Cobertura y atención particular

La ficha admite ninguna, una o varias afiliaciones; sin dato es distinto de sin cobertura. Cada evaluación y versión de turno conserva modalidad elegida y regla aplicada. El plan pertenece a su cobertura y la autorización a la afiliación/práctica correctas. No pasar a particular ante incompatibilidad sin elección expresa. Validación electrónica con cobertura está fuera del alcance.

## Confirmación y avisos

Un correo se programa dentro de T-72/T-48; WhatsApp a T-36 si sigue pendiente; T-24 sin confirmar cancela y libera con evento y aviso interno consistentes. Entrega, lectura, clic y texto libre nunca confirman. TOKEN_TURNO es limitado a versión y destinatario. Tareas antiguas se invalidan al cambiar horario; excepciones y turnos cercanos siguen D07.

## Reprogramación del profesional

LOTE_REPROGRAMACION e INTERVALO_LOTE identifican agenda y tramos. TURNO_AFECTADO deduplica el original y sigue aviso y reemplazo por separado. Todos los afectados vigentes reciben WhatsApp, incluidos confirmados, sin esperar T-36. No se libera la indisponibilidad ni se considera resuelto por enviar. Estado del original, liberación, cierre del lote y reemplazo siguen D07/D09.

## Continuidad del fichaje

TRANSICION_PROFESIONAL y CORRESPONDENCIA_FICHAJE son una alternativa de modelado, no una decisión sobre copia o proyección de fichas. El mecanismo autorizado debe preservar procedencia, pacientes compartidos y fichaje del profesional sin revelar operaciones ajenas. No se cambian tenant_id en bloque. Admisión, representación, convenios, chat, delegaciones y numeración del destino se resuelven expresamente en D04/D12.

## Eliminación y referencias históricas

PETICION_ELIMINACION registra la petición expresa verificada. No se propone ON DELETE CASCADE sobre fichas, turnos o auditoría. Retirar credenciales, cuenta y vínculos exige definir referencias históricas y anonimización antes del SQL; no se decide aquí retener una cuenta borrada como si siguiera activa. La baja institucional no activa eliminación ni cancela turnos.

## Operación y conservación

Las tablas de respaldo, restauración e incidente son metadatos de operación y pueden residir fuera de la base de negocio. No incluyen copias de datos ni secretos. Retención, índices físicos, RLS, normalización de correo, presupuesto y pruebas con rol real siguen pendientes. Los reportes básicos derivan de turnos/eventos y no requieren una tabla por reporte.

## Evolución fuera de beta

No se incorporan tablas de odontograma, prestaciones clínicas, facturación, cobros, suscripciones, pagadores, directorio público, IA, adjuntos, llamadas, calendarios externos o lista de espera automática. Suscripciones y tratamiento de datos por fin comercial se diseñan en I2/I3. SOLICITUD_ENTIDAD queda identificada como propuesta de docs/20 y no requisito aprobado.

## Documentación explicativa paso a paso

La [colección de estudio](arquitectura/modelo-er/partes/README.md) organiza las 17 láminas en carpetas numeradas, con PDF explicativos de todas las entidades, campos, reglas y relaciones. Empezar por el [índice y ruta de lectura](arquitectura/modelo-er/partes/00-indice-y-ruta-de-lectura.pdf). Regenerar con `scripts/generar-guia-modelo-er.py` tras actualizar el modelo. Los ejemplos son ficticios y no aprueban decisiones pendientes.

## Láminas editables

- [01 Identidad y credenciales parte 1](arquitectura/modelo-er/partes/01-identidad-y-credenciales-parte-1/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/01-identidad-y-credenciales-parte-1/diagrama.svg)
- [01 Identidad y credenciales parte 2](arquitectura/modelo-er/partes/02-identidad-y-credenciales-parte-2/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/02-identidad-y-credenciales-parte-2/diagrama.svg)
- [02 Organización y permisos](arquitectura/modelo-er/partes/03-organizacion-y-permisos/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/03-organizacion-y-permisos/diagrama.svg)
- [03 Profesionales e incorporación](arquitectura/modelo-er/partes/04-profesionales-e-incorporacion/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/04-profesionales-e-incorporacion/diagrama.svg)
- [04 Ficha y acceso del paciente parte 1](arquitectura/modelo-er/partes/05-ficha-y-acceso-del-paciente-parte-1/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/05-ficha-y-acceso-del-paciente-parte-1/diagrama.svg)
- [04 Ficha y acceso del paciente parte 2](arquitectura/modelo-er/partes/06-ficha-y-acceso-del-paciente-parte-2/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/06-ficha-y-acceso-del-paciente-parte-2/diagrama.svg)
- [05 Agendas y catálogo](arquitectura/modelo-er/partes/07-agendas-y-catalogo/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/07-agendas-y-catalogo/diagrama.svg)
- [06 Excepciones y recursos](arquitectura/modelo-er/partes/08-excepciones-y-recursos/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/08-excepciones-y-recursos/diagrama.svg)
- [07 Coberturas y convenios](arquitectura/modelo-er/partes/09-coberturas-y-convenios/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/09-coberturas-y-convenios/diagrama.svg)
- [08 Reservas y capacidad](arquitectura/modelo-er/partes/10-reservas-y-capacidad/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/10-reservas-y-capacidad/diagrama.svg)
- [09 Reprogramación y gestión](arquitectura/modelo-er/partes/11-reprogramacion-y-gestion/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/11-reprogramacion-y-gestion/diagrama.svg)
- [10 Canales y destinatarios](arquitectura/modelo-er/partes/12-canales-y-destinatarios/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/12-canales-y-destinatarios/diagrama.svg)
- [11 Avisos y entrega](arquitectura/modelo-er/partes/13-avisos-y-entrega/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/13-avisos-y-entrega/diagrama.svg)
- [12 Chat humano](arquitectura/modelo-er/partes/14-chat-humano/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/14-chat-humano/diagrama.svg)
- [13 Continuidad del fichaje](arquitectura/modelo-er/partes/15-continuidad-del-fichaje/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/15-continuidad-del-fichaje/diagrama.svg)
- [14 Auditoría y operación parte 1](arquitectura/modelo-er/partes/16-auditoria-y-operacion-parte-1/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/16-auditoria-y-operacion-parte-1/diagrama.svg)
- [14 Auditoría y operación parte 2](arquitectura/modelo-er/partes/17-auditoria-y-operacion-parte-2/diagrama.drawio) · [SVG](arquitectura/modelo-er/partes/17-auditoria-y-operacion-parte-2/diagrama.svg)

## Diccionario de datos

### CUENTA

Identidad personal reutilizable, separada de la ficha y los roles.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R09.a R10.a; ADR-012; docs/20.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| nombre | Texto |   | No |
| email_acceso | Texto |   | Sí |
| email_verificado_en | Instante con zona |   | Sí |
| estado | Estado o código |   | No |
| creada_en | Instante con zona |   | No |

No se fusiona por correo o documento. La baja institucional conserva la cuenta. Normalización y unicidad de contacto por revisar.

### IDENTIDAD_EXTERNA

Identidad estable del proveedor vinculada mediante verificación.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R09.a; docs/12.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| cuenta_id | UUID | FK CUENTA | No |
| emisor | Texto |   | No |
| sujeto | Texto |   | No |
| vinculada_en | Instante con zona |   | No |
| revocada_en | Instante con zona |   | Sí |

UQ(emisor,sujeto). El correo del proveedor no reemplaza esta clave.

### CREDENCIAL_LOCAL

Credencial protegida de una cuenta que admite contraseña.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R10.a; S01; docs/20.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| cuenta_id | UUID | FK CUENTA | No |
| hash_contrasena | Huella o referencia protegida |   | No |
| algoritmo_version | Texto |   | No |
| actualizada_en | Instante con zona |   | No |
| revocada_en | Instante con zona |   | Sí |

Una credencial local vigente por cuenta. No crear contraseña a cuentas solo externas mediante recuperación.

### SESION

Sesión y revocación independiente de membresías y habilitaciones.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: S01 S04; D16.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| cuenta_id | UUID | FK CUENTA | No |
| huella_sesion | Huella o referencia protegida |   | No |
| iniciada_en | Instante con zona |   | No |
| vence_en | Instante con zona |   | No |
| revocada_en | Instante con zona |   | Sí |
| mfa_verificada_en | Instante con zona |   | Sí |

La sesión no almacena permisos permanentes ni sustituye su revalidación. Mecanismo por definir.

### FACTOR_MFA

Segundo factor administrativo y ciclo de revocación.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: S06; docs/20; D16.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| cuenta_id | UUID | FK CUENTA | No |
| tipo | Estado o código |   | No |
| referencia_secreta | Huella o referencia protegida |   | No |
| verificado_en | Instante con zona |   | Sí |
| revocado_en | Instante con zona |   | Sí |

Recuperación de contraseña no retira MFA. Tipo y custodia por definir.

### TOKEN_IDENTIDAD

Acción limitada de recuperación, contacto o invitación de identidad.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R10.a; docs/20.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| cuenta_id | UUID | FK CUENTA | Sí |
| destinatario | Texto |   | No |
| huella | Huella o referencia protegida |   | No |
| proposito | Estado o código |   | No |
| vence_en | Instante con zona |   | No |
| usado_en | Instante con zona |   | Sí |
| revocado_en | Instante con zona |   | Sí |

UQ(huella). Uso único con consumo atómico; GET no consume. Sin token en claro. No sirve para confirmar turnos.

### FACULTAD_PLATAFORMA

Concesión global acotada para incorporación y operación.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R10; MP-35 MP-38; D03.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| cuenta_id | UUID | FK CUENTA | No |
| permiso_id | UUID | FK PERMISO | No |
| otorgante_id | UUID | FK CUENTA | No |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | Sí |
| revocada_en | Instante con zona |   | Sí |

No concede lectura general de fichas ni suplantación.

### CANAL_IDENTIDAD

Remitente de plataforma para recuperar una cuenta sin contexto de entidad.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R10.a; docs/20; D09 D16.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| proveedor | Texto |   | No |
| remitente | Texto |   | No |
| secreto_ref | Huella o referencia protegida |   | No |
| estado | Estado o código |   | No |

Canal restringido de identidad, separado de los remitentes de avisos de pacientes. No se elige una clínica para recuperar la cuenta.

### TAREA_IDENTIDAD

Trabajo persistido de recuperación o verificación de identidad.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R10.a; docs/20.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| token_id | UUID | FK TOKEN_IDENTIDAD | No |
| canal_id | UUID | FK CANAL_IDENTIDAD | No |
| tipo | Estado o código |   | No |
| clave_logica | Texto |   | No |
| programada_en | Instante con zona |   | No |
| estado | Estado o código |   | No |
| intentos | Entero |   | No |

UQ(clave_logica). Sin datos de pacientes ni membresías; contenido mínimo y sin tokens en logs. Respuesta pública no revela cuenta.

### ENVIO_IDENTIDAD

Intento técnico del correo de identidad con entrega y fallo.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R10.a; docs/20.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| tarea_id | UUID | FK TAREA_IDENTIDAD | No |
| numero | Entero |   | No |
| referencia_proveedor | Texto |   | Sí |
| iniciado_en | Instante con zona |   | No |
| estado | Estado o código |   | No |
| error_codigo | Texto |   | Sí |

UQ(tarea_id,numero). Se revalida token y presupuesto global; no reutiliza canal ni permisos de una entidad ajena.

### ENTIDAD

Cliente y raíz del aislamiento, incluida actividad independiente.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R01 R01.a; ADR-001.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| tipo | Estado o código |   | No |
| nombre | Texto |   | No |
| zona_horaria | Texto |   | No |
| estado | Estado o código |   | No |
| creada_en | Instante con zona |   | No |

Cada fila es una raíz de tenant. No cambiar una clínica completa por la entidad de un profesional.

### SEDE

Lugar de atención dentro de una entidad.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R01 R06.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| nombre | Texto |   | No |
| direccion | Texto |   | Sí |
| zona_horaria | Texto |   | No |
| estado | Estado o código |   | No |

Claves y ámbito sujetos a las convenciones generales.

### MEMBRESIA

Pertenencia del equipo con vigencia local.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R04 R10; docs/20.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| cuenta_id | UUID | FK CUENTA | No |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | Sí |
| estado | Estado o código |   | No |

UQ(tenant_id,cuenta_id). Reactivar preserva la identidad local; historial en auditoría.

### ROL

Definición de agrupaciones de facultades sin concederlas.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R04 R10; docs/22.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| codigo | Texto |   | No |
| nombre | Texto |   | No |
| ambito | Estado o código |   | No |

UQ(codigo). Catálogo técnico propuesto; no asigna permisos pendientes.

### PERMISO

Acción autorizable y tipo de ámbito.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R04 R12; docs/22; D03.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| codigo | Texto |   | No |
| accion | Texto |   | No |
| tipo_ambito | Estado o código |   | No |

UQ(codigo). Códigos MP son trazabilidad y no permisos definitivos.

### ROL_PERMISO

Descompone roles en acciones explícitas.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R04; docs/22.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| rol_id | UUID | FK ROL | No |
| permiso_id | UUID | FK PERMISO | No |

UQ(rol_id,permiso_id). Contenido a aprobar; sin concesiones automáticas por cargo.

### MEMBRESIA_ROL

Asignación múltiple de roles al miembro de la entidad.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R04 R10.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| membresia_id | UUID | FK MEMBRESIA | No |
| rol_id | UUID | FK ROL | No |
| otorgante_id | UUID | FK CUENTA | No |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | Sí |
| revocada_en | Instante con zona |   | Sí |

Claves y ámbito sujetos a las convenciones generales.

### MEMBRESIA_PERMISO

Facultades locales expresas adicionales y vigencia.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R04 R06; D03.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| membresia_id | UUID | FK MEMBRESIA | No |
| permiso_id | UUID | FK PERMISO | No |
| otorgante_id | UUID | FK CUENTA | No |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | Sí |
| revocada_en | Instante con zona |   | Sí |

No sustituye delegación de agenda ni participación de chat.

### PROFESIONAL_GLOBAL

Identidad profesional verificada para coordinar capacidad.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R03 R05; ADR-011; D02.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| cuenta_id | UUID | FK CUENTA | Sí |
| nombre_referencia | Texto |   | No |
| matricula_referencia | Texto |   | Sí |
| verificacion_ref | Texto |   | Sí |
| estado | Estado o código |   | No |

UQ(cuenta_id) cuando presente. No deduplicar por nombre. Referencia histórica mínima tras eliminación por resolver.

### PROFESIONAL_ENTIDAD

Vínculo profesional local, separado de la membresía de acceso.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R01 R05; ADR-011.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| profesional_id | UUID | FK PROFESIONAL_GLOBAL | No |
| membresia_id | UUID | FK MEMBRESIA | Sí |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | Sí |
| estado | Estado o código |   | No |

UQ(tenant_id,profesional_id). Finalizar no libera turnos ni destruye fichaje. Retención de referencia histórica por revisar.

### SOLICITUD_ENTIDAD

Trámite de incorporación del solicitante y designación administrativa.

Ámbito G. Estado: Propuesta funcional no aprobada. Fuentes: docs/20; CU-35; D14.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| solicitante_id | UUID | FK CUENTA | No |
| tipo_entidad | Estado o código |   | No |
| nombre_propuesto | Texto |   | No |
| relacion_declarada | Texto |   | No |
| admin_contacto | Texto |   | Sí |
| estado | Estado o código |   | No |
| entidad_resultado_id | UUID | FK ENTIDAD | Sí |
| revisor_id | UUID | FK CUENTA | Sí |
| resuelta_en | Instante con zona |   | Sí |

No concede administración, contrato ni suscripción.

### INVITACION_EQUIPO

Invitación personal al equipo con alcance predeterminado.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: docs/20; CU-07; D14.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| emisor_id | UUID | FK CUENTA | No |
| destinatario | Texto |   | No |
| cuenta_destino_id | UUID | FK CUENTA | Sí |
| token_id | UUID | FK TOKEN_IDENTIDAD | No |
| rol_propuesto_id | UUID | FK ROL | Sí |
| estado | Estado o código |   | No |
| vence_en | Instante con zona |   | No |
| membresia_id | UUID | FK MEMBRESIA | Sí |

UQ(token_id). Correspondencia verificada al aceptar; invitación no delega agendas.

### PACIENTE

Ficha administrativa local, exista o no cuenta.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R01.a R09; ADR-010; docs/18.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| nombres | Texto |   | No |
| apellidos | Texto |   | No |
| tipo_documento | Texto |   | Sí |
| documento_declarado | Texto |   | Sí |
| nacimiento | Fecha |   | Sí |
| domicilio | Texto |   | Sí |
| estado | Estado o código |   | No |
| estado_datos_cobertura | Estado o código |   | No |

Campos concretos propuestos. No guarda edad redundante ni historia clínica; sin dato no significa sin cobertura.

### CONTACTO_PACIENTE

Contacto administrativo que no otorga representación.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R09 R11; docs/18.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| paciente_id | UUID | FK PACIENTE | No |
| tipo | Estado o código |   | No |
| valor | Texto |   | No |
| titular_descripcion | Texto |   | Sí |
| verificado_en | Instante con zona |   | Sí |
| estado | Estado o código |   | No |

Teléfono familiar no acredita identidad ni es único por paciente.

### SOLICITUD_ADMISION

Solicitud protegida que nunca ocupa capacidad.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R09.a; ADR-007; docs/11-12.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| solicitante_id | UUID | FK CUENTA | Sí |
| profesional_entidad_id | UUID | FK PROFESIONAL_ENTIDAD | Sí |
| datos_declarados | Estructura versionada |   | No |
| contacto_verificado_en | Instante con zona |   | Sí |
| paciente_resuelto_id | UUID | FK PACIENTE | Sí |
| estado | Estado o código |   | No |
| revisor_id | UUID | FK CUENTA | Sí |
| motivo_interno | Texto |   | Sí |
| resuelta_en | Instante con zona |   | Sí |

Solicitante puede actuar por otro; sin cuenta previa es posible. No fusionar por coincidencias.

### REPRESENTACION

Relación verificada entre representante y paciente.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R09; D08.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| paciente_id | UUID | FK PACIENTE | No |
| representante_id | UUID | FK CUENTA | No |
| tipo | Estado o código |   | No |
| evidencia_ref | Texto |   | No |
| verificador_id | UUID | FK CUENTA | No |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | Sí |
| restricciones | Texto |   | Sí |
| revocada_en | Instante con zona |   | Sí |

Varios representantes posibles. Contacto de emergencia y titular de cobertura no confieren esta relación.

### REPRESENTACION_PERMISO

Facultad concreta de representación.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R09; docs/22; D08.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| representacion_id | UUID | FK REPRESENTACION | No |
| permiso_id | UUID | FK PERMISO | No |

UQ(tenant_id,representacion_id,permiso_id). Gestión de turnos y lectura de chat son distintas.

### ACCESO_PACIENTE

Cuenta vinculada a ficha con admisión y activación verificadas.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R09.a; ADR-007/008.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| paciente_id | UUID | FK PACIENTE | No |
| cuenta_id | UUID | FK CUENTA | No |
| representacion_id | UUID | FK REPRESENTACION | Sí |
| solicitud_id | UUID | FK SOLICITUD_ADMISION | Sí |
| aprobador_id | UUID | FK CUENTA | No |
| aprobado_en | Instante con zona |   | No |
| activado_en | Instante con zona |   | Sí |
| estado | Estado o código |   | No |
| vinculacion_ref | Texto |   | No |

UQ(tenant_id,paciente_id,cuenta_id). Sin representación opera como propio tras verificar correspondencia; con representación se exige paciente y cuenta coincidentes.

### ALCANCE_ACCESO

Contextos concretos autorizados del portal.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R09.a; D14.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| acceso_id | UUID | FK ACCESO_PACIENTE | No |
| profesional_entidad_id | UUID | FK PROFESIONAL_ENTIDAD | No |
| agenda_id | UUID | FK AGENDA | Sí |
| permiso_id | UUID | FK PERMISO | No |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | Sí |
| revocado_en | Instante con zona |   | Sí |

Profesional obligatorio; agenda nula propone alcance a sus agendas locales. Semántica exacta pendiente; no habilita otras entidades.

### PACIENTE_PROFESIONAL

Relación numerada, independiente de agendas y cuenta.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R01.a; ADR-001.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| profesional_id | UUID | FK PROFESIONAL_GLOBAL | No |
| profesional_entidad_id | UUID | FK PROFESIONAL_ENTIDAD | No |
| paciente_id | UUID | FK PACIENTE | No |
| numero_visible | Entero |   | No |
| estado | Estado o código |   | No |
| alta_en | Instante con zona |   | No |

UQ(tenant_id,profesional_id,paciente_id) y UQ(tenant_id,profesional_id,numero_visible). Número positivo; profesional coincide con vínculo local; no renumerar ni reutilizar.

### CONTADOR_PACIENTE

Asignación transaccional por serie profesional y entidad.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R01.a; ADR-001.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| profesional_id | UUID | FK PROFESIONAL_GLOBAL | No |
| profesional_entidad_id | UUID | FK PROFESIONAL_ENTIDAD | No |
| ultimo_confirmado | Entero |   | No |
| version | Entero |   | No |

UQ(tenant_id,profesional_id) y UQ(tenant_id,profesional_entidad_id). Inicial 0; alta serializada e idempotente; no usar COUNT o MAX sin serialización.

### AGENDA

Agenda de un vínculo profesional y sede.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R04 R06.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| profesional_entidad_id | UUID | FK PROFESIONAL_ENTIDAD | No |
| sede_id | UUID | FK SEDE | No |
| nombre | Texto |   | No |
| zona_horaria | Texto |   | No |
| estado | Estado o código |   | No |

Sede y vínculo profesional pertenecen al mismo tenant.

### DELEGACION_AGENDA

Autorización por persona y agenda otorgada por su profesional.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R04.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| agenda_id | UUID | FK AGENDA | No |
| membresia_id | UUID | FK MEMBRESIA | No |
| otorgante_profesional_id | UUID | FK PROFESIONAL_ENTIDAD | No |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | Sí |
| revocada_en | Instante con zona |   | Sí |

Otorgante debe ser titular de la agenda; destinatario es miembro activo de la misma entidad. Sin subdelegación implícita.

### DELEGACION_PERMISO

Acciones específicas delegadas.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R04; D03.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| delegacion_id | UUID | FK DELEGACION_AGENDA | No |
| permiso_id | UUID | FK PERMISO | No |

UQ(tenant_id,delegacion_id,permiso_id). No concede chat ni admisión por operar agenda.

### PRACTICA

Identidad estable de una práctica administrativa de la entidad.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R06; ADR-009; docs/16.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| codigo_local | Texto |   | No |
| origen | Estado o código |   | No |
| base_inicial | Estado o código |   | Sí |
| estado | Estado o código |   | No |

UQ(tenant_id,codigo_local). UQ parcial(tenant_id,base_inicial). Base CONSULTA reservada al alta inicial; personalizada exige base nula e inmutable.

### VERSION_PRACTICA

Definición inmutable usada por las ofertas.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R06 R12; docs/16.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| practica_id | UUID | FK PRACTICA | No |
| numero_version | Entero |   | No |
| nombre | Texto |   | No |
| clasificacion | Texto |   | No |
| descripcion | Texto |   | Sí |
| autor_id | UUID | FK CUENTA | No |
| creada_en | Instante con zona |   | No |

UQ(tenant_id,practica_id,numero_version). Cambiar nombre o clasificación no cambia base ni permite autoselección.

### OFERTA

Habilitación de una práctica en una agenda concreta.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R06; docs/16.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| agenda_id | UUID | FK AGENDA | No |
| practica_id | UUID | FK PRACTICA | No |
| estado | Estado o código |   | No |

UQ(tenant_id,agenda_id,practica_id). Crear catálogo no habilita ofertas.

### VERSION_OFERTA

Condiciones inmutables y vigencia de la oferta.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R06 R07; docs/16.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| oferta_id | UUID | FK OFERTA | No |
| version_practica_id | UUID | FK VERSION_PRACTICA | No |
| numero_version | Entero |   | No |
| duracion_min | Entero |   | No |
| preparacion_min | Entero |   | No |
| cierre_min | Entero |   | No |
| modalidad | Estado o código |   | No |
| portal_habilitado | Sí o no |   | No |
| gestion_personal | Sí o no |   | No |
| particular_habilitado | Sí o no |   | No |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | Sí |

UQ(tenant_id,oferta_id,numero_version). Duración >0 y pausas >=0. Práctica de versión coincide con oferta; portal implica base CONSULTA y no gestión obligatoria. Vigencias activas sin solapamiento.

### HORARIO_AGENDA

Disponibilidad semanal recurrente según zona de agenda.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R06; D05.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| agenda_id | UUID | FK AGENDA | No |
| dia_semana | Entero |   | No |
| hora_inicio | Hora local |   | No |
| hora_fin | Hora local |   | No |
| desde | Fecha |   | No |
| hasta | Fecha |   | Sí |

Inicio anterior a fin; horarios nocturnos se dividen. No es ocupación ni garantiza disponibilidad efectiva.

### EXCEPCION_AGENDA

Apertura o indisponibilidad puntual que no cancela turnos.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R03 R06; ADR-013.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| agenda_id | UUID | FK AGENDA | No |
| inicio | Instante con zona |   | No |
| fin | Instante con zona |   | No |
| tipo | Estado o código |   | No |
| motivo_interno | Texto |   | Sí |
| lote_id | UUID | FK LOTE_REPROGRAMACION | Sí |
| autor_id | UUID | FK CUENTA | No |

Inicio < fin. Bloquear una ausencia no libera los turnos ya existentes.

### RECURSO

Recurso físico administrativo con disponibilidad a validar.

Ámbito T. Estado: Extensión propuesta pendiente de validación. Fuentes: R03 R06; D02 D05.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| sede_id | UUID | FK SEDE | No |
| nombre | Texto |   | No |
| tipo | Estado o código |   | No |
| capacidad | Entero |   | No |
| estado | Estado o código |   | No |

Control automático de recursos condicionado al piloto; no asumir sobrecupos.

### OFERTA_RECURSO

Recursos exigidos por una versión de oferta.

Ámbito T. Estado: Extensión propuesta pendiente de validación. Fuentes: R06; docs/16; D02.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| version_oferta_id | UUID | FK VERSION_OFERTA | No |
| recurso_id | UUID | FK RECURSO | No |
| cantidad | Entero |   | No |
| incluye_preparacion | Sí o no |   | No |
| incluye_cierre | Sí o no |   | No |

UQ(tenant_id,version_oferta_id,recurso_id). Sede del recurso coincide con agenda, salvo regla futura explícita.

### RESERVA_RECURSO

Ocupación física vinculada al mismo bloqueo profesional.

Ámbito T. Estado: Extensión propuesta pendiente de validación. Fuentes: R03 R06; D02.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| recurso_id | UUID | FK RECURSO | No |
| ocupacion_id | UUID | FK OCUPACION_GLOBAL | No |
| inicio | Instante con zona |   | No |
| fin | Instante con zona |   | No |
| cantidad | Entero |   | No |
| estado | Estado o código |   | No |
| vence_en | Instante con zona |   | Sí |

Capacidad del recurso y profesional se adquieren/liberan en la misma unidad consistente; alcance por aprobar.

### COBERTURA_MEDICA

Catálogo local de obras sociales y prepagas, separado del cliente SaaS.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R01 R07; docs/18.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| nombre | Texto |   | No |
| codigo_local | Texto |   | Sí |
| estado | Estado o código |   | No |

Se propone catálogo local para evitar compartir configuración; un catálogo de referencia global futuro no compartiría afiliaciones.

### PLAN_COBERTURA

Plan o producto de una cobertura médica local.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R07; D06.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| cobertura_id | UUID | FK COBERTURA_MEDICA | No |
| nombre | Texto |   | No |
| codigo | Texto |   | Sí |
| estado | Estado o código |   | No |

Claves y ámbito sujetos a las convenciones generales.

### AFILIACION_PACIENTE

Cobertura declarada y verificación administrativa diferenciadas.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R07; docs/18.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| paciente_id | UUID | FK PACIENTE | No |
| cobertura_id | UUID | FK COBERTURA_MEDICA | No |
| plan_id | UUID | FK PLAN_COBERTURA | Sí |
| numero_afiliado | Texto |   | Sí |
| titular_declarado | Texto |   | Sí |
| parentesco | Texto |   | Sí |
| desde | Fecha |   | Sí |
| hasta | Fecha |   | Sí |
| estado_verificacion | Estado o código |   | No |
| verificacion_ref | Texto |   | Sí |

Plan debe pertenecer a cobertura. No hacer único el número familiar de afiliado ni inferir representación. Pueden existir varias afiliaciones por paciente.

### CONVENIO

Acuerdo aplicable a una oferta concreta, cobertura y plan.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R07; D06.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| oferta_id | UUID | FK OFERTA | No |
| cobertura_id | UUID | FK COBERTURA_MEDICA | No |
| plan_id | UUID | FK PLAN_COBERTURA | Sí |
| estado | Estado o código |   | No |

Granularidad explícita por oferta identifica práctica, agenda y profesional; plan nulo propone todos los planes de esa cobertura, sujeto a revisión y precedencia explícita.

### VERSION_CONVENIO

Regla de cobertura inmutable que conserva vigencia y condiciones.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R07 R12.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| convenio_id | UUID | FK CONVENIO | No |
| numero_version | Entero |   | No |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | Sí |
| requiere_autorizacion | Sí o no |   | No |
| resultado_regla | Estado o código |   | No |
| condiciones | Estructura versionada |   | No |

UQ(tenant_id,convenio_id,numero_version). Conflictos de reglas se resuelven explícitamente; no elegir particular automáticamente.

### AUTORIZACION_COBERTURA

Constancia administrativa específica para una práctica.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R07; docs/18; D06.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| afiliacion_id | UUID | FK AFILIACION_PACIENTE | No |
| practica_id | UUID | FK PRACTICA | No |
| referencia | Texto |   | No |
| estado | Estado o código |   | No |
| desde | Instante con zona |   | Sí |
| hasta | Instante con zona |   | Sí |
| verificador_id | UUID | FK CUENTA | Sí |

No equivale a afiliación verificada ni permiso de sistema. Sin API externa aprobada.

### EVALUACION_ELEGIBILIDAD

Resultado y regla aplicados antes de adquirir y completar una reserva.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R02 R07 R12.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| paciente_id | UUID | FK PACIENTE | No |
| version_oferta_id | UUID | FK VERSION_OFERTA | No |
| modalidad_elegida | Estado o código |   | No |
| afiliacion_id | UUID | FK AFILIACION_PACIENTE | Sí |
| version_convenio_id | UUID | FK VERSION_CONVENIO | Sí |
| autorizacion_id | UUID | FK AUTORIZACION_COBERTURA | Sí |
| resultado | Estado o código |   | No |
| evaluada_en | Instante con zona |   | No |
| evidencia | Estructura versionada |   | No |

Elegible, incompatible o revisión. Particular exige elección expresa y oferta habilitada. Cobertura exige afiliación del paciente y compatibilidad de plan/práctica/oferta.

### OCUPACION_GLOBAL

Registro mínimo compartido para excluir intervalos del profesional.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R03; ADR-001.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| profesional_id | UUID | FK PROFESIONAL_GLOBAL | No |
| inicio | Instante con zona |   | No |
| fin | Instante con zona |   | No |
| estado | Estado o código |   | No |
| vence_en | Instante con zona |   | Sí |
| referencia_opaca | Texto |   | No |

UQ(referencia_opaca). Sin paciente, tenant, agenda ni motivo. Inicio < fin; rangos [inicio,fin). Exclusión por profesional para ocupaciones activas. Vencimiento se resuelve explícitamente y transaccionalmente; sin índice dinámico now().

### PRE_RESERVA

Bloqueo persistido previo al registro del turno.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R02 R03; CU-36.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| paciente_profesional_id | UUID | FK PACIENTE_PROFESIONAL | No |
| agenda_id | UUID | FK AGENDA | No |
| version_oferta_id | UUID | FK VERSION_OFERTA | No |
| elegibilidad_id | UUID | FK EVALUACION_ELEGIBILIDAD | No |
| ocupacion_id | UUID | FK OCUPACION_GLOBAL | No |
| actor_id | UUID | FK CUENTA | No |
| representacion_id | UUID | FK REPRESENTACION | Sí |
| inicio_atencion | Instante con zona |   | No |
| fin_atencion | Instante con zona |   | No |
| vence_en | Instante con zona |   | No |
| estado | Estado o código |   | No |
| renovaciones | Entero |   | No |

UQ(ocupacion_id) dentro de esta tabla. Profesional, paciente y oferta coinciden. TTL pendiente; expirar no desplaza ocupaciones posteriores. No conservar transacción abierta durante el formulario.

### TURNO

Identidad estable de una cita registrada para un paciente.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R02 R08 R12; CU-37.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| paciente_profesional_id | UUID | FK PACIENTE_PROFESIONAL | No |
| pre_reserva_id | UUID | FK PRE_RESERVA | No |
| creador_id | UUID | FK CUENTA | No |
| creado_en | Instante con zona |   | No |
| estado_turno | Estado o código |   | No |
| estado_asistencia | Estado o código |   | No |
| estado_jornada | Estado o código |   | No |
| version_concurrencia | Entero |   | No |

UQ(tenant_id,pre_reserva_id). Registro no confirma asistencia. Dimensiones separadas y combinaciones válidas por revisar. Una pre-reserva produce como máximo un turno.

### VERSION_TURNO

Condiciones y horario históricos inmutables por registro o cambio.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R06 R07 R08 R12.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| turno_id | UUID | FK TURNO | No |
| numero_version | Entero |   | No |
| agenda_id | UUID | FK AGENDA | No |
| version_oferta_id | UUID | FK VERSION_OFERTA | No |
| elegibilidad_id | UUID | FK EVALUACION_ELEGIBILIDAD | No |
| ocupacion_id | UUID | FK OCUPACION_GLOBAL | No |
| inicio_atencion | Instante con zona |   | No |
| fin_atencion | Instante con zona |   | No |
| zona_horaria | Texto |   | No |
| condiciones_aplicadas | Estructura versionada |   | No |
| creada_en | Instante con zona |   | No |
| sustituida_en | Instante con zona |   | Sí |

UQ(tenant_id,turno_id,numero_version). Una versión vigente por turno; snapshot conserva nombre, duración, pausas y cobertura. Primera versión reutiliza ocupación de pre-reserva; cambiar horario adquiere destino y retira origen atómicamente.

### CONFIRMACION_ASISTENCIA

Acción explícita sobre una versión determinada.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R08 R09.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| version_turno_id | UUID | FK VERSION_TURNO | No |
| actor_id | UUID | FK CUENTA | No |
| representacion_id | UUID | FK REPRESENTACION | Sí |
| medio | Estado o código |   | No |
| confirmada_en | Instante con zona |   | No |
| referencia_evidencia | Texto |   | Sí |

UQ(tenant_id,version_turno_id). Repetir es idempotente; confirmar no reserva otra capacidad. Medio telefónico conserva operador y evidencia, con facultad específica.

### EVENTO_TURNO

Historia cronológica de cambios, llegada, atención y cancelación.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R08 R12.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| turno_id | UUID | FK TURNO | No |
| version_turno_id | UUID | FK VERSION_TURNO | Sí |
| actor_id | UUID | FK CUENTA | Sí |
| servicio_actor | Texto |   | Sí |
| tipo | Estado o código |   | No |
| ocurrido_en | Instante con zona |   | No |
| motivo | Texto |   | Sí |
| resultado | Estado o código |   | No |
| cambios_minimos | Estructura versionada |   | No |

Actor humano o servicio identificados. La baja del profesional no borra eventos ni crea cancelación implícita.

### IDEMPOTENCIA

Resultado de una operación repetible y su huella de entrada.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R02 R03 R12.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| actor_id | UUID | FK CUENTA | No |
| operacion | Texto |   | No |
| clave | Texto |   | No |
| huella_entrada | Texto |   | No |
| resultado_ref | Texto |   | No |
| estado | Estado o código |   | No |
| creada_en | Instante con zona |   | No |
| vence_en | Instante con zona |   | Sí |

UQ(tenant_id,actor_id,operacion,clave). Misma clave con entrada distinta se rechaza. No almacena secretos; retención por definir.

### LOTE_REPROGRAMACION

Operación del profesional por ausencia en agendas autorizadas.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R11.b; ADR-013.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| profesional_entidad_id | UUID | FK PROFESIONAL_ENTIDAD | No |
| iniciador_id | UUID | FK CUENTA | No |
| motivo_interno | Texto |   | No |
| estado | Estado o código |   | No |
| creado_en | Instante con zona |   | No |
| clave_operacion | Texto |   | No |

UQ(tenant_id,clave_operacion). WhatsApp a todos los afectados, incluso confirmados. Estados y política de liberación pendientes.

### INTERVALO_LOTE

Uno o más tramos afectados y agenda local.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R11.b; ADR-013.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| lote_id | UUID | FK LOTE_REPROGRAMACION | No |
| agenda_id | UUID | FK AGENDA | No |
| inicio | Instante con zona |   | No |
| fin | Instante con zona |   | No |

Inicio < fin y agenda del profesional del lote. Una fecha completa se convierte desde zona horaria de agenda. Detectar toda ocupación superpuesta, aunque el turno comience antes.

### TURNO_AFECTADO

Seguimiento separado del aviso y del reemplazo.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R11.b; ADR-013; docs/04.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| lote_id | UUID | FK LOTE_REPROGRAMACION | No |
| version_original_id | UUID | FK VERSION_TURNO | No |
| turno_reemplazo_id | UUID | FK TURNO | Sí |
| estado_aviso | Estado o código |   | No |
| estado_resolucion | Estado o código |   | No |
| responsable_id | UUID | FK CUENTA | Sí |
| resuelto_en | Instante con zona |   | Sí |
| motivo_cierre | Texto |   | Sí |

UQ(tenant_id,lote_id,version_original_id). Reemplazo no duplicado ni cruzado de paciente. Envío no resuelve reemplazo. Diseño propone nuevo turno para reemplazo de lote; cambio individual crea versión del mismo turno.

### SOLICITUD_GESTION

Pedido humano sin selección ni bloqueo de horarios.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R06 R11.a; CU-16 CU-26.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| paciente_id | UUID | FK PACIENTE | No |
| profesional_entidad_id | UUID | FK PROFESIONAL_ENTIDAD | No |
| practica_id | UUID | FK PRACTICA | Sí |
| turno_afectado_id | UUID | FK TURNO_AFECTADO | Sí |
| solicitante_id | UUID | FK CUENTA | No |
| responsable_id | UUID | FK CUENTA | Sí |
| motivo | Texto |   | No |
| estado | Estado o código |   | No |
| creada_en | Instante con zona |   | No |
| resuelta_en | Instante con zona |   | Sí |

Un mensaje puede motivar este trámite; crearlo requiere acción explícita y nunca ocupa capacidad.

### TOKEN_TURNO

Token de acción limitado a una versión y destinatario autorizado.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R08; S07.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| version_turno_id | UUID | FK VERSION_TURNO | No |
| destino_id | UUID | FK DESTINO_AVISO | No |
| huella | Huella o referencia protegida |   | No |
| proposito | Estado o código |   | No |
| vence_en | Instante con zona |   | No |
| usado_en | Instante con zona |   | Sí |
| revocado_en | Instante con zona |   | Sí |

UQ(huella). Cancelar/reprogramar invalida token obsoleto. GET no modifica; la acción exige autorización actual.

### CANAL_ENTIDAD

Remitente y cuenta de proveedor verificados por entidad.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R11; docs/04.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| canal | Estado o código |   | No |
| proveedor | Texto |   | No |
| cuenta_externa | Texto |   | No |
| remitente | Texto |   | No |
| secreto_ref | Huella o referencia protegida |   | No |
| verificada_en | Instante con zona |   | Sí |
| estado | Estado o código |   | No |

Credencial solo referencia al almacén seguro. Correlación de webhooks por cuenta verificada, nunca por tenant recibido sin comprobar.

### DESTINO_AVISO

Contacto autorizado para un paciente y propósito.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R09 R11; S09.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| paciente_id | UUID | FK PACIENTE | No |
| contacto_id | UUID | FK CONTACTO_PACIENTE | No |
| cuenta_destinataria_id | UUID | FK CUENTA | Sí |
| representacion_id | UUID | FK REPRESENTACION | Sí |
| canal | Estado o código |   | No |
| proposito | Estado o código |   | No |
| autorizacion_ref | Texto |   | No |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | Sí |
| revocado_en | Instante con zona |   | Sí |

Contacto pertenece al paciente. Representación, si presente, coincide con paciente y cuenta. Autorización y contacto se revalidan al enviar; recepción no concede portal.

### PRESUPUESTO_CANAL

Límite técnico de consumo y continuidad operativa.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R11; docs/04; D09 D15.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| canal_id | UUID | FK CANAL_ENTIDAD | No |
| periodo_inicio | Instante con zona |   | No |
| periodo_fin | Instante con zona |   | No |
| moneda | Texto |   | No |
| limite_tecnico | Decimal |   | No |
| umbral_alerta | Decimal |   | No |
| politica_continuidad | Texto |   | No |

No es cuota facturada ni suscripción; agotamiento no cancela turnos ni cierra portal.

### CONSUMO_CANAL

Costo técnico estimado o conciliado por intento.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R11; docs/04.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| intento_id | UUID | FK INTENTO_ENVIO | No |
| moneda | Texto |   | No |
| importe | Decimal |   | No |
| tipo_medicion | Estado o código |   | No |
| tarifa_version_ref | Texto |   | No |
| registrado_en | Instante con zona |   | No |

Estimación y conciliación se distinguen; no sumar ambas como dos cargos del mismo intento.

### TAREA_PERSISTIDA

Trabajo diferido recuperable, consistente con la operación de origen.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R08 R11 R12; docs/04.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| version_turno_id | UUID | FK VERSION_TURNO | Sí |
| turno_afectado_id | UUID | FK TURNO_AFECTADO | Sí |
| tipo | Estado o código |   | No |
| deduplicacion | Texto |   | No |
| programada_en | Instante con zona |   | No |
| estado | Estado o código |   | No |
| intentos | Entero |   | No |
| bloqueada_hasta | Instante con zona |   | Sí |
| version_politica_ref | Texto |   | No |

UQ(tenant_id,deduplicacion). Correo único dentro de T-72/T-48; WA T-36 solo pendiente; T-24 cierra. Reprogramación profesional es evento independiente. Trabajos sin turno llevan tipo y referencia de origen controlada; no datos arbitrarios.

### AVISO_EXTERNO

Mensaje lógico individual, separado de cada intento del proveedor.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R11 R11.b; ADR-013.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| tarea_id | UUID | FK TAREA_PERSISTIDA | No |
| destino_id | UUID | FK DESTINO_AVISO | No |
| canal_id | UUID | FK CANAL_ENTIDAD | No |
| clave_logica | Texto |   | No |
| plantilla_version_ref | Texto |   | No |
| estado | Estado o código |   | No |
| creado_en | Instante con zona |   | No |

UQ(tenant_id,clave_logica). Dedupe por evento, versión, destinatario y canal; reprogramación exige WhatsApp. Fallo queda pendiente de seguimiento.

### INTENTO_ENVIO

Ejecución técnica del mensaje y correlación externa.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R11; docs/04.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| aviso_id | UUID | FK AVISO_EXTERNO | No |
| numero | Entero |   | No |
| referencia_proveedor | Texto |   | Sí |
| iniciado_en | Instante con zona |   | No |
| estado | Estado o código |   | No |
| error_codigo | Texto |   | Sí |
| entregado_en | Instante con zona |   | Sí |
| leido_en | Instante con zona |   | Sí |

UQ(tenant_id,aviso_id,numero). Ref externa única dentro de cuenta proveedor cuando exista. No prometer entrega exactamente una vez.

### EVENTO_PROVEEDOR

Webhook autenticado, correlacionado y deduplicado.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R11; S08.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| canal_id | UUID | FK CANAL_ENTIDAD | No |
| intento_id | UUID | FK INTENTO_ENVIO | No |
| evento_externo | Texto |   | No |
| tipo | Estado o código |   | No |
| ocurrido_en | Instante con zona |   | No |
| recibido_en | Instante con zona |   | No |
| validacion_ref | Texto |   | No |

UQ(tenant_id,canal_id,evento_externo). Canal coincide con aviso del intento. Lectura, entrega o texto libre no confirman asistencia.

### AVISO_INTERNO

Aviso persistido a una cuenta autorizada, incluido cierre T-24.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R08 R11.a R12; MP-33.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| tarea_id | UUID | FK TAREA_PERSISTIDA | Sí |
| version_turno_id | UUID | FK VERSION_TURNO | Sí |
| conversacion_id | UUID | FK CONVERSACION | Sí |
| destinatario_id | UUID | FK CUENTA | No |
| tipo | Estado o código |   | No |
| clave_logica | Texto |   | No |
| creado_en | Instante con zona |   | No |
| leido_en | Instante con zona |   | Sí |
| resuelto_en | Instante con zona |   | Sí |

UQ(tenant_id,clave_logica,destinatario_id). Consultar exige permiso actual aun tras recibir el aviso. Aviso y cierre T-24 se persisten consistentemente.

### CONVERSACION

Conversación de paciente y profesional dentro de una entidad.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R11.a; D13.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| paciente_profesional_id | UUID | FK PACIENTE_PROFESIONAL | No |
| estado | Estado o código |   | No |
| creada_en | Instante con zona |   | No |
| cerrada_en | Instante con zona |   | Sí |

Número de conversaciones simultáneas por vínculo pendiente. No participa secretaría por delegación de agenda.

### PARTICIPANTE_CHAT

Participación vigente y verificable de una cuenta.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R09 R11.a; S14.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| conversacion_id | UUID | FK CONVERSACION | No |
| cuenta_id | UUID | FK CUENTA | No |
| representacion_id | UUID | FK REPRESENTACION | Sí |
| tipo | Estado o código |   | No |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | Sí |
| revocado_en | Instante con zona |   | Sí |

UQ(tenant_id,conversacion_id,cuenta_id). Cuenta debe corresponder al paciente/profesional o representante habilitado; participación administrativa pendiente.

### PARTICIPANTE_PERMISO

Facultades de lectura, envío o respuesta independientes de agenda.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R11.a; docs/22; D13.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| participante_id | UUID | FK PARTICIPANTE_CHAT | No |
| permiso_id | UUID | FK PERMISO | No |

UQ(tenant_id,participante_id,permiso_id). Participar no concede todas las operaciones.

### MENSAJE

Texto humano persistido con autoría real.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R11.a R12.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| conversacion_id | UUID | FK CONVERSACION | No |
| participante_autor_id | UUID | FK PARTICIPANTE_CHAT | No |
| texto | Texto |   | No |
| enviado_en | Instante con zona |   | No |
| estado | Estado o código |   | No |
| correccion_de_id | UUID | FK MENSAJE | Sí |

Autor y corrección pertenecen a la conversación. Correcciones trazables por revisar; no adjuntos, IA ni cambios de turno por inferencia.

### LECTURA_MENSAJE

Lectura por participante, separada de atención o respuesta.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R11.a; D13.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| mensaje_id | UUID | FK MENSAJE | No |
| participante_id | UUID | FK PARTICIPANTE_CHAT | No |
| leido_en | Instante con zona |   | No |

UQ(tenant_id,mensaje_id,participante_id). Mensaje y participante de la misma conversación.

### TRANSICION_PROFESIONAL

Operación administrativa excepcional entre origen y destino.

Ámbito X. Estado: Alternativa de modelado pendiente D04 D12. Fuentes: R05 R10; ADR-011; docs/19.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| profesional_id | UUID | FK PROFESIONAL_GLOBAL | No |
| entidad_origen_id | UUID | FK ENTIDAD | No |
| entidad_destino_id | UUID | FK ENTIDAD | Sí |
| operador_id | UUID | FK CUENTA | No |
| tipo | Estado o código |   | No |
| estado | Estado o código |   | No |
| fecha_efectiva | Instante con zona |   | Sí |
| autorizacion_ref | Texto |   | No |
| clave_operacion | Texto |   | No |

UQ(clave_operacion). Metadatos restringidos de plataforma; no almacena fichas. Baja puede no tener destino; continuidad sí lo exige. No modifica tenant de registros existentes.

### CORRESPONDENCIA_FICHAJE

Procedencia explícita de vínculos origen y destino durante continuidad.

Ámbito X. Estado: Alternativa de modelado pendiente D04 D12. Fuentes: ADR-011; docs/19; D04 D12.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| transicion_id | UUID | FK TRANSICION_PROFESIONAL | No |
| vinculo_origen_id | UUID | FK PACIENTE_PROFESIONAL | No |
| vinculo_destino_id | UUID | FK PACIENTE_PROFESIONAL | Sí |
| estado | Estado o código |   | No |
| alcance_datos_ref | Texto |   | No |
| resolucion_numeracion_ref | Texto |   | Sí |

Excepción cruzada explícita: validar tenant origen/destino contra transición y mismo profesional. UQ(transicion_id,vinculo_origen_id). No habilita lectura general ni decide copia/proyección. Números destino pendientes.

### PETICION_ELIMINACION

Petición expresa del profesional diferenciada de ejecución.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R05; ADR-011; CU-31.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| profesional_id | UUID | FK PROFESIONAL_GLOBAL | No |
| solicitante_id | UUID | FK CUENTA | Sí |
| peticion_verificada_ref | Texto |   | No |
| solicitada_en | Instante con zona |   | No |
| estado | Estado o código |   | No |
| ejecutor_id | UUID | FK CUENTA | Sí |
| ejecutada_en | Instante con zona |   | Sí |
| referencias_historicas_ref | Texto |   | Sí |

Solo petición verificada del propio profesional. Conservar fichas e historial; anonimización, retiro de vínculos y referencia histórica requieren diseño. Ningún borrado en cascada aprobado.

### AUDITORIA_ENTIDAD

Registro cronológico restringido del actor real y contexto local.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R12; S10.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| actor_id | UUID | FK CUENTA | Sí |
| servicio_actor | Texto |   | Sí |
| paciente_id | UUID | FK PACIENTE | Sí |
| agenda_id | UUID | FK AGENDA | Sí |
| accion | Texto |   | No |
| recurso_tipo | Texto |   | No |
| recurso_ref | Texto |   | No |
| ocurrido_en | Instante con zona |   | No |
| resultado | Estado o código |   | No |
| motivo | Texto |   | Sí |
| cambios_minimos | Estructura versionada |   | No |
| correlacion | Texto |   | No |

Actor humano o servicio identificados. Referencia polimórfica es localizador auditado, no FK; no secretos ni cuerpos de chat. No se borra por baja profesional.

### AUDITORIA_GLOBAL

Identidad y operación global sin exposición a administradores locales.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: R10 R12; S10; docs/20.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| actor_id | UUID | FK CUENTA | Sí |
| servicio_actor | Texto |   | Sí |
| cuenta_afectada_id | UUID | FK CUENTA | Sí |
| accion | Texto |   | No |
| ocurrido_en | Instante con zona |   | No |
| resultado | Estado o código |   | No |
| contexto_minimo | Estructura versionada |   | No |

Sin datos de ficha ni mensajes. Eventos de login, recuperación y facultades globales; acceso separado de auditoría local.

### POLITICA_OPERATIVA

Versión de parámetros de reserva, confirmación, cuotas y gasto.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R02.a R08 R11; D01 D07 D15.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| tipo | Estado o código |   | No |
| numero_version | Entero |   | No |
| parametros | Estructura versionada |   | No |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | Sí |
| aprobador_id | UUID | FK CUENTA | No |

UQ(tenant_id,tipo,numero_version). Sin valores inventados de TTL/cuotas. Tipo identifica esquema de parámetros; regla general T-24 no se anula silenciosamente.

### EXCEPCION_POLITICA

Excepción asistida, temporal y motivada a una política.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R02.a R08; D07 D15.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| politica_id | UUID | FK POLITICA_OPERATIVA | No |
| paciente_id | UUID | FK PACIENTE | Sí |
| turno_id | UUID | FK TURNO | Sí |
| actor_beneficiario_id | UUID | FK CUENTA | Sí |
| aprobador_id | UUID | FK CUENTA | No |
| motivo | Texto |   | No |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | No |
| alcance | Estructura versionada |   | No |

Debe indicar al menos un sujeto/turno y alcance concreto; no es suspensión masiva ni permiso global.

### CASO_ABUSO

Revisión humana de señales sin compartir listas entre entidades.

Ámbito T. Estado: Propuesta lógica de requisito vigente. Fuentes: R02.a; S16; CU-27.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| paciente_id | UUID | FK PACIENTE | Sí |
| cuenta_id | UUID | FK CUENTA | Sí |
| revisor_id | UUID | FK CUENTA | Sí |
| senal_minima | Estructura versionada |   | No |
| estado | Estado o código |   | No |
| decision | Texto |   | Sí |
| abierto_en | Instante con zona |   | No |
| cerrado_en | Instante con zona |   | Sí |

DNI declarado o IP familiar no bastan para sanción. Métricas de frecuencia efímeras no requieren entidad de dominio por cada petición.

### ACCESO_SOPORTE

Concesión excepcional temporal a recursos delimitados.

Ámbito T. Estado: Propuesta de soporte pendiente. Fuentes: R10; S02; MP-44; D03 D16.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| tenant_id | UUID | FK ENTIDAD | No |
| id | UUID | PK  | No |
| operador_id | UUID | FK CUENTA | No |
| concedente_id | UUID | FK CUENTA | No |
| motivo | Texto |   | No |
| alcance | Estructura versionada |   | No |
| desde | Instante con zona |   | No |
| hasta | Instante con zona |   | No |
| revocado_en | Instante con zona |   | Sí |

Concedente, recursos y acciones aún por aprobar. No suplantación libre ni lectura por ser administrador de plataforma.

### RESPALDO

Evidencia operativa protegida del backup, sin credenciales ni fichas.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: S11; CU-33.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| operador_ref | Texto |   | No |
| repositorio_seguro_ref | Texto |   | No |
| iniciado_en | Instante con zona |   | No |
| finalizado_en | Instante con zona |   | Sí |
| alcance_ref | Texto |   | No |
| integridad_ref | Texto |   | Sí |
| estado | Estado o código |   | No |

Metadatos de infraestructura fuera de API de negocio. Archivo real reside en almacenamiento protegido; incluye consistencia de turnos, contadores, ocupación y tareas.

### ENSAYO_RESTAURACION

Evidencia de recuperación en entorno separado.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: S11; CU-33; D16.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| respaldo_id | UUID | FK RESPALDO | No |
| entorno_ref | Texto |   | No |
| ejecutado_en | Instante con zona |   | No |
| duracion_seg | Entero |   | No |
| perdida_datos_seg | Entero |   | Sí |
| resultado | Estado o código |   | No |
| evidencia_ref | Texto |   | No |

Sin envíos reales desde ensayo. RPO/RTO son objetivos por acordar, no valores garantizados.

### INCIDENTE

Coordinación técnica de contención y recuperación.

Ámbito G. Estado: Propuesta lógica de requisito vigente. Fuentes: S12; CU-34.

| Campo | Tipo | Clave o destino | Nulo |
| --- | --- | --- | --- |
| id | UUID | PK  | No |
| responsable_ref | Texto |   | No |
| abierto_en | Instante con zona |   | No |
| cerrado_en | Instante con zona |   | Sí |
| estado | Estado o código |   | No |
| alcance_minimo | Texto |   | No |
| acciones_ref | Texto |   | No |
| evidencia_ref | Texto |   | Sí |

Metadatos técnicos mínimos; información local sensible permanece bajo su entidad y acceso autorizado.

## Registro completo de relaciones

Cada fila expresa la cantidad de padres por hijo y la colección inversa. Las unicidades específicas reducen el máximo de hijos; no son concesiones de acceso.

| Hijo y FK | Padre | Padre por hijo | Hijos por padre | Integridad |
| --- | --- | --- | --- | --- |
| IDENTIDAD_EXTERNA.cuenta_id | CUENTA | 1 | 0..N | ID global restringido |
| CREDENCIAL_LOCAL.cuenta_id | CUENTA | 1 | 0..N | ID global restringido |
| SESION.cuenta_id | CUENTA | 1 | 0..N | ID global restringido |
| FACTOR_MFA.cuenta_id | CUENTA | 1 | 0..N | ID global restringido |
| TOKEN_IDENTIDAD.cuenta_id | CUENTA | 0..1 | 0..N | ID global restringido |
| FACULTAD_PLATAFORMA.cuenta_id | CUENTA | 1 | 0..N | ID global restringido |
| FACULTAD_PLATAFORMA.permiso_id | PERMISO | 1 | 0..N | ID global restringido |
| FACULTAD_PLATAFORMA.otorgante_id | CUENTA | 1 | 0..N | ID global restringido |
| TAREA_IDENTIDAD.token_id | TOKEN_IDENTIDAD | 1 | 0..N | ID global restringido |
| TAREA_IDENTIDAD.canal_id | CANAL_IDENTIDAD | 1 | 0..N | ID global restringido |
| ENVIO_IDENTIDAD.tarea_id | TAREA_IDENTIDAD | 1 | 0..N | ID global restringido |
| SEDE.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| MEMBRESIA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| MEMBRESIA.cuenta_id | CUENTA | 1 | 0..N | ID global restringido |
| ROL_PERMISO.rol_id | ROL | 1 | 0..N | ID global restringido |
| ROL_PERMISO.permiso_id | PERMISO | 1 | 0..N | ID global restringido |
| MEMBRESIA_ROL.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| MEMBRESIA_ROL.membresia_id | MEMBRESIA | 1 | 0..N | compuesta tenant_id + id |
| MEMBRESIA_ROL.rol_id | ROL | 1 | 0..N | ID global restringido |
| MEMBRESIA_ROL.otorgante_id | CUENTA | 1 | 0..N | ID global restringido |
| MEMBRESIA_PERMISO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| MEMBRESIA_PERMISO.membresia_id | MEMBRESIA | 1 | 0..N | compuesta tenant_id + id |
| MEMBRESIA_PERMISO.permiso_id | PERMISO | 1 | 0..N | ID global restringido |
| MEMBRESIA_PERMISO.otorgante_id | CUENTA | 1 | 0..N | ID global restringido |
| PROFESIONAL_GLOBAL.cuenta_id | CUENTA | 0..1 | 0..1 | ID global restringido |
| PROFESIONAL_ENTIDAD.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| PROFESIONAL_ENTIDAD.profesional_id | PROFESIONAL_GLOBAL | 1 | 0..N | ID global restringido |
| PROFESIONAL_ENTIDAD.membresia_id | MEMBRESIA | 0..1 | 0..N | compuesta tenant_id + id |
| SOLICITUD_ENTIDAD.solicitante_id | CUENTA | 1 | 0..N | ID global restringido |
| SOLICITUD_ENTIDAD.entidad_resultado_id | ENTIDAD | 0..1 | 0..N | ID global restringido |
| SOLICITUD_ENTIDAD.revisor_id | CUENTA | 0..1 | 0..N | ID global restringido |
| INVITACION_EQUIPO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| INVITACION_EQUIPO.emisor_id | CUENTA | 1 | 0..N | ID global restringido |
| INVITACION_EQUIPO.cuenta_destino_id | CUENTA | 0..1 | 0..N | ID global restringido |
| INVITACION_EQUIPO.token_id | TOKEN_IDENTIDAD | 1 | 0..1 | ID global restringido |
| INVITACION_EQUIPO.rol_propuesto_id | ROL | 0..1 | 0..N | ID global restringido |
| INVITACION_EQUIPO.membresia_id | MEMBRESIA | 0..1 | 0..N | compuesta tenant_id + id |
| PACIENTE.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| CONTACTO_PACIENTE.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| CONTACTO_PACIENTE.paciente_id | PACIENTE | 1 | 0..N | compuesta tenant_id + id |
| SOLICITUD_ADMISION.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| SOLICITUD_ADMISION.solicitante_id | CUENTA | 0..1 | 0..N | ID global restringido |
| SOLICITUD_ADMISION.profesional_entidad_id | PROFESIONAL_ENTIDAD | 0..1 | 0..N | compuesta tenant_id + id |
| SOLICITUD_ADMISION.paciente_resuelto_id | PACIENTE | 0..1 | 0..N | compuesta tenant_id + id |
| SOLICITUD_ADMISION.revisor_id | CUENTA | 0..1 | 0..N | ID global restringido |
| REPRESENTACION.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| REPRESENTACION.paciente_id | PACIENTE | 1 | 0..N | compuesta tenant_id + id |
| REPRESENTACION.representante_id | CUENTA | 1 | 0..N | ID global restringido |
| REPRESENTACION.verificador_id | CUENTA | 1 | 0..N | ID global restringido |
| REPRESENTACION_PERMISO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| REPRESENTACION_PERMISO.representacion_id | REPRESENTACION | 1 | 0..N | compuesta tenant_id + id |
| REPRESENTACION_PERMISO.permiso_id | PERMISO | 1 | 0..N | ID global restringido |
| ACCESO_PACIENTE.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| ACCESO_PACIENTE.paciente_id | PACIENTE | 1 | 0..N | compuesta tenant_id + id |
| ACCESO_PACIENTE.cuenta_id | CUENTA | 1 | 0..N | ID global restringido |
| ACCESO_PACIENTE.representacion_id | REPRESENTACION | 0..1 | 0..N | compuesta tenant_id + id |
| ACCESO_PACIENTE.solicitud_id | SOLICITUD_ADMISION | 0..1 | 0..N | compuesta tenant_id + id |
| ACCESO_PACIENTE.aprobador_id | CUENTA | 1 | 0..N | ID global restringido |
| ALCANCE_ACCESO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| ALCANCE_ACCESO.acceso_id | ACCESO_PACIENTE | 1 | 0..N | compuesta tenant_id + id |
| ALCANCE_ACCESO.profesional_entidad_id | PROFESIONAL_ENTIDAD | 1 | 0..N | compuesta tenant_id + id |
| ALCANCE_ACCESO.agenda_id | AGENDA | 0..1 | 0..N | compuesta tenant_id + id |
| ALCANCE_ACCESO.permiso_id | PERMISO | 1 | 0..N | ID global restringido |
| PACIENTE_PROFESIONAL.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| PACIENTE_PROFESIONAL.profesional_id | PROFESIONAL_GLOBAL | 1 | 0..N | ID global restringido |
| PACIENTE_PROFESIONAL.profesional_entidad_id | PROFESIONAL_ENTIDAD | 1 | 0..N | compuesta tenant_id + id |
| PACIENTE_PROFESIONAL.paciente_id | PACIENTE | 1 | 0..N | compuesta tenant_id + id |
| CONTADOR_PACIENTE.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| CONTADOR_PACIENTE.profesional_id | PROFESIONAL_GLOBAL | 1 | 0..N | ID global restringido |
| CONTADOR_PACIENTE.profesional_entidad_id | PROFESIONAL_ENTIDAD | 1 | 0..N | compuesta tenant_id + id |
| AGENDA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| AGENDA.profesional_entidad_id | PROFESIONAL_ENTIDAD | 1 | 0..N | compuesta tenant_id + id |
| AGENDA.sede_id | SEDE | 1 | 0..N | compuesta tenant_id + id |
| DELEGACION_AGENDA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| DELEGACION_AGENDA.agenda_id | AGENDA | 1 | 0..N | compuesta tenant_id + id |
| DELEGACION_AGENDA.membresia_id | MEMBRESIA | 1 | 0..N | compuesta tenant_id + id |
| DELEGACION_AGENDA.otorgante_profesional_id | PROFESIONAL_ENTIDAD | 1 | 0..N | compuesta tenant_id + id |
| DELEGACION_PERMISO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| DELEGACION_PERMISO.delegacion_id | DELEGACION_AGENDA | 1 | 0..N | compuesta tenant_id + id |
| DELEGACION_PERMISO.permiso_id | PERMISO | 1 | 0..N | ID global restringido |
| PRACTICA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| VERSION_PRACTICA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| VERSION_PRACTICA.practica_id | PRACTICA | 1 | 0..N | compuesta tenant_id + id |
| VERSION_PRACTICA.autor_id | CUENTA | 1 | 0..N | ID global restringido |
| OFERTA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| OFERTA.agenda_id | AGENDA | 1 | 0..N | compuesta tenant_id + id |
| OFERTA.practica_id | PRACTICA | 1 | 0..N | compuesta tenant_id + id |
| VERSION_OFERTA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| VERSION_OFERTA.oferta_id | OFERTA | 1 | 0..N | compuesta tenant_id + id |
| VERSION_OFERTA.version_practica_id | VERSION_PRACTICA | 1 | 0..N | compuesta tenant_id + id |
| HORARIO_AGENDA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| HORARIO_AGENDA.agenda_id | AGENDA | 1 | 0..N | compuesta tenant_id + id |
| EXCEPCION_AGENDA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| EXCEPCION_AGENDA.agenda_id | AGENDA | 1 | 0..N | compuesta tenant_id + id |
| EXCEPCION_AGENDA.lote_id | LOTE_REPROGRAMACION | 0..1 | 0..N | compuesta tenant_id + id |
| EXCEPCION_AGENDA.autor_id | CUENTA | 1 | 0..N | ID global restringido |
| RECURSO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| RECURSO.sede_id | SEDE | 1 | 0..N | compuesta tenant_id + id |
| OFERTA_RECURSO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| OFERTA_RECURSO.version_oferta_id | VERSION_OFERTA | 1 | 0..N | compuesta tenant_id + id |
| OFERTA_RECURSO.recurso_id | RECURSO | 1 | 0..N | compuesta tenant_id + id |
| RESERVA_RECURSO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| RESERVA_RECURSO.recurso_id | RECURSO | 1 | 0..N | compuesta tenant_id + id |
| RESERVA_RECURSO.ocupacion_id | OCUPACION_GLOBAL | 1 | 0..N | ID global restringido |
| COBERTURA_MEDICA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| PLAN_COBERTURA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| PLAN_COBERTURA.cobertura_id | COBERTURA_MEDICA | 1 | 0..N | compuesta tenant_id + id |
| AFILIACION_PACIENTE.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| AFILIACION_PACIENTE.paciente_id | PACIENTE | 1 | 0..N | compuesta tenant_id + id |
| AFILIACION_PACIENTE.cobertura_id | COBERTURA_MEDICA | 1 | 0..N | compuesta tenant_id + id |
| AFILIACION_PACIENTE.plan_id | PLAN_COBERTURA | 0..1 | 0..N | compuesta tenant_id + id |
| CONVENIO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| CONVENIO.oferta_id | OFERTA | 1 | 0..N | compuesta tenant_id + id |
| CONVENIO.cobertura_id | COBERTURA_MEDICA | 1 | 0..N | compuesta tenant_id + id |
| CONVENIO.plan_id | PLAN_COBERTURA | 0..1 | 0..N | compuesta tenant_id + id |
| VERSION_CONVENIO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| VERSION_CONVENIO.convenio_id | CONVENIO | 1 | 0..N | compuesta tenant_id + id |
| AUTORIZACION_COBERTURA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| AUTORIZACION_COBERTURA.afiliacion_id | AFILIACION_PACIENTE | 1 | 0..N | compuesta tenant_id + id |
| AUTORIZACION_COBERTURA.practica_id | PRACTICA | 1 | 0..N | compuesta tenant_id + id |
| AUTORIZACION_COBERTURA.verificador_id | CUENTA | 0..1 | 0..N | ID global restringido |
| EVALUACION_ELEGIBILIDAD.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| EVALUACION_ELEGIBILIDAD.paciente_id | PACIENTE | 1 | 0..N | compuesta tenant_id + id |
| EVALUACION_ELEGIBILIDAD.version_oferta_id | VERSION_OFERTA | 1 | 0..N | compuesta tenant_id + id |
| EVALUACION_ELEGIBILIDAD.afiliacion_id | AFILIACION_PACIENTE | 0..1 | 0..N | compuesta tenant_id + id |
| EVALUACION_ELEGIBILIDAD.version_convenio_id | VERSION_CONVENIO | 0..1 | 0..N | compuesta tenant_id + id |
| EVALUACION_ELEGIBILIDAD.autorizacion_id | AUTORIZACION_COBERTURA | 0..1 | 0..N | compuesta tenant_id + id |
| OCUPACION_GLOBAL.profesional_id | PROFESIONAL_GLOBAL | 1 | 0..N | ID global restringido |
| PRE_RESERVA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| PRE_RESERVA.paciente_profesional_id | PACIENTE_PROFESIONAL | 1 | 0..N | compuesta tenant_id + id |
| PRE_RESERVA.agenda_id | AGENDA | 1 | 0..N | compuesta tenant_id + id |
| PRE_RESERVA.version_oferta_id | VERSION_OFERTA | 1 | 0..N | compuesta tenant_id + id |
| PRE_RESERVA.elegibilidad_id | EVALUACION_ELEGIBILIDAD | 1 | 0..N | compuesta tenant_id + id |
| PRE_RESERVA.ocupacion_id | OCUPACION_GLOBAL | 1 | 0..1 | ID global restringido |
| PRE_RESERVA.actor_id | CUENTA | 1 | 0..N | ID global restringido |
| PRE_RESERVA.representacion_id | REPRESENTACION | 0..1 | 0..N | compuesta tenant_id + id |
| TURNO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| TURNO.paciente_profesional_id | PACIENTE_PROFESIONAL | 1 | 0..N | compuesta tenant_id + id |
| TURNO.pre_reserva_id | PRE_RESERVA | 1 | 0..1 | compuesta tenant_id + id |
| TURNO.creador_id | CUENTA | 1 | 0..N | ID global restringido |
| VERSION_TURNO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| VERSION_TURNO.turno_id | TURNO | 1 | 0..N | compuesta tenant_id + id |
| VERSION_TURNO.agenda_id | AGENDA | 1 | 0..N | compuesta tenant_id + id |
| VERSION_TURNO.version_oferta_id | VERSION_OFERTA | 1 | 0..N | compuesta tenant_id + id |
| VERSION_TURNO.elegibilidad_id | EVALUACION_ELEGIBILIDAD | 1 | 0..N | compuesta tenant_id + id |
| VERSION_TURNO.ocupacion_id | OCUPACION_GLOBAL | 1 | 0..N | ID global restringido |
| CONFIRMACION_ASISTENCIA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| CONFIRMACION_ASISTENCIA.version_turno_id | VERSION_TURNO | 1 | 0..1 | compuesta tenant_id + id |
| CONFIRMACION_ASISTENCIA.actor_id | CUENTA | 1 | 0..N | ID global restringido |
| CONFIRMACION_ASISTENCIA.representacion_id | REPRESENTACION | 0..1 | 0..N | compuesta tenant_id + id |
| EVENTO_TURNO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| EVENTO_TURNO.turno_id | TURNO | 1 | 0..N | compuesta tenant_id + id |
| EVENTO_TURNO.version_turno_id | VERSION_TURNO | 0..1 | 0..N | compuesta tenant_id + id |
| EVENTO_TURNO.actor_id | CUENTA | 0..1 | 0..N | ID global restringido |
| IDEMPOTENCIA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| IDEMPOTENCIA.actor_id | CUENTA | 1 | 0..N | ID global restringido |
| LOTE_REPROGRAMACION.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| LOTE_REPROGRAMACION.profesional_entidad_id | PROFESIONAL_ENTIDAD | 1 | 0..N | compuesta tenant_id + id |
| LOTE_REPROGRAMACION.iniciador_id | CUENTA | 1 | 0..N | ID global restringido |
| INTERVALO_LOTE.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| INTERVALO_LOTE.lote_id | LOTE_REPROGRAMACION | 1 | 0..N | compuesta tenant_id + id |
| INTERVALO_LOTE.agenda_id | AGENDA | 1 | 0..N | compuesta tenant_id + id |
| TURNO_AFECTADO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| TURNO_AFECTADO.lote_id | LOTE_REPROGRAMACION | 1 | 0..N | compuesta tenant_id + id |
| TURNO_AFECTADO.version_original_id | VERSION_TURNO | 1 | 0..N | compuesta tenant_id + id |
| TURNO_AFECTADO.turno_reemplazo_id | TURNO | 0..1 | 0..N | compuesta tenant_id + id |
| TURNO_AFECTADO.responsable_id | CUENTA | 0..1 | 0..N | ID global restringido |
| SOLICITUD_GESTION.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| SOLICITUD_GESTION.paciente_id | PACIENTE | 1 | 0..N | compuesta tenant_id + id |
| SOLICITUD_GESTION.profesional_entidad_id | PROFESIONAL_ENTIDAD | 1 | 0..N | compuesta tenant_id + id |
| SOLICITUD_GESTION.practica_id | PRACTICA | 0..1 | 0..N | compuesta tenant_id + id |
| SOLICITUD_GESTION.turno_afectado_id | TURNO_AFECTADO | 0..1 | 0..N | compuesta tenant_id + id |
| SOLICITUD_GESTION.solicitante_id | CUENTA | 1 | 0..N | ID global restringido |
| SOLICITUD_GESTION.responsable_id | CUENTA | 0..1 | 0..N | ID global restringido |
| TOKEN_TURNO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| TOKEN_TURNO.version_turno_id | VERSION_TURNO | 1 | 0..N | compuesta tenant_id + id |
| TOKEN_TURNO.destino_id | DESTINO_AVISO | 1 | 0..N | compuesta tenant_id + id |
| CANAL_ENTIDAD.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| DESTINO_AVISO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| DESTINO_AVISO.paciente_id | PACIENTE | 1 | 0..N | compuesta tenant_id + id |
| DESTINO_AVISO.contacto_id | CONTACTO_PACIENTE | 1 | 0..N | compuesta tenant_id + id |
| DESTINO_AVISO.cuenta_destinataria_id | CUENTA | 0..1 | 0..N | ID global restringido |
| DESTINO_AVISO.representacion_id | REPRESENTACION | 0..1 | 0..N | compuesta tenant_id + id |
| PRESUPUESTO_CANAL.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| PRESUPUESTO_CANAL.canal_id | CANAL_ENTIDAD | 1 | 0..N | compuesta tenant_id + id |
| CONSUMO_CANAL.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| CONSUMO_CANAL.intento_id | INTENTO_ENVIO | 1 | 0..N | compuesta tenant_id + id |
| TAREA_PERSISTIDA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| TAREA_PERSISTIDA.version_turno_id | VERSION_TURNO | 0..1 | 0..N | compuesta tenant_id + id |
| TAREA_PERSISTIDA.turno_afectado_id | TURNO_AFECTADO | 0..1 | 0..N | compuesta tenant_id + id |
| AVISO_EXTERNO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| AVISO_EXTERNO.tarea_id | TAREA_PERSISTIDA | 1 | 0..N | compuesta tenant_id + id |
| AVISO_EXTERNO.destino_id | DESTINO_AVISO | 1 | 0..N | compuesta tenant_id + id |
| AVISO_EXTERNO.canal_id | CANAL_ENTIDAD | 1 | 0..N | compuesta tenant_id + id |
| INTENTO_ENVIO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| INTENTO_ENVIO.aviso_id | AVISO_EXTERNO | 1 | 0..N | compuesta tenant_id + id |
| EVENTO_PROVEEDOR.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| EVENTO_PROVEEDOR.canal_id | CANAL_ENTIDAD | 1 | 0..N | compuesta tenant_id + id |
| EVENTO_PROVEEDOR.intento_id | INTENTO_ENVIO | 1 | 0..N | compuesta tenant_id + id |
| AVISO_INTERNO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| AVISO_INTERNO.tarea_id | TAREA_PERSISTIDA | 0..1 | 0..N | compuesta tenant_id + id |
| AVISO_INTERNO.version_turno_id | VERSION_TURNO | 0..1 | 0..N | compuesta tenant_id + id |
| AVISO_INTERNO.conversacion_id | CONVERSACION | 0..1 | 0..N | compuesta tenant_id + id |
| AVISO_INTERNO.destinatario_id | CUENTA | 1 | 0..N | ID global restringido |
| CONVERSACION.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| CONVERSACION.paciente_profesional_id | PACIENTE_PROFESIONAL | 1 | 0..N | compuesta tenant_id + id |
| PARTICIPANTE_CHAT.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| PARTICIPANTE_CHAT.conversacion_id | CONVERSACION | 1 | 0..N | compuesta tenant_id + id |
| PARTICIPANTE_CHAT.cuenta_id | CUENTA | 1 | 0..N | ID global restringido |
| PARTICIPANTE_CHAT.representacion_id | REPRESENTACION | 0..1 | 0..N | compuesta tenant_id + id |
| PARTICIPANTE_PERMISO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| PARTICIPANTE_PERMISO.participante_id | PARTICIPANTE_CHAT | 1 | 0..N | compuesta tenant_id + id |
| PARTICIPANTE_PERMISO.permiso_id | PERMISO | 1 | 0..N | ID global restringido |
| MENSAJE.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| MENSAJE.conversacion_id | CONVERSACION | 1 | 0..N | compuesta tenant_id + id |
| MENSAJE.participante_autor_id | PARTICIPANTE_CHAT | 1 | 0..N | compuesta tenant_id + id |
| MENSAJE.correccion_de_id | MENSAJE | 0..1 | 0..N | compuesta tenant_id + id |
| LECTURA_MENSAJE.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| LECTURA_MENSAJE.mensaje_id | MENSAJE | 1 | 0..N | compuesta tenant_id + id |
| LECTURA_MENSAJE.participante_id | PARTICIPANTE_CHAT | 1 | 0..N | compuesta tenant_id + id |
| TRANSICION_PROFESIONAL.profesional_id | PROFESIONAL_GLOBAL | 1 | 0..N | excepción validada |
| TRANSICION_PROFESIONAL.entidad_origen_id | ENTIDAD | 1 | 0..N | excepción validada |
| TRANSICION_PROFESIONAL.entidad_destino_id | ENTIDAD | 0..1 | 0..N | excepción validada |
| TRANSICION_PROFESIONAL.operador_id | CUENTA | 1 | 0..N | excepción validada |
| CORRESPONDENCIA_FICHAJE.transicion_id | TRANSICION_PROFESIONAL | 1 | 0..N | excepción validada |
| CORRESPONDENCIA_FICHAJE.vinculo_origen_id | PACIENTE_PROFESIONAL | 1 | 0..N | excepción validada |
| CORRESPONDENCIA_FICHAJE.vinculo_destino_id | PACIENTE_PROFESIONAL | 0..1 | 0..N | excepción validada |
| PETICION_ELIMINACION.profesional_id | PROFESIONAL_GLOBAL | 1 | 0..N | ID global restringido |
| PETICION_ELIMINACION.solicitante_id | CUENTA | 0..1 | 0..N | ID global restringido |
| PETICION_ELIMINACION.ejecutor_id | CUENTA | 0..1 | 0..N | ID global restringido |
| AUDITORIA_ENTIDAD.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| AUDITORIA_ENTIDAD.actor_id | CUENTA | 0..1 | 0..N | ID global restringido |
| AUDITORIA_ENTIDAD.paciente_id | PACIENTE | 0..1 | 0..N | compuesta tenant_id + id |
| AUDITORIA_ENTIDAD.agenda_id | AGENDA | 0..1 | 0..N | compuesta tenant_id + id |
| AUDITORIA_GLOBAL.actor_id | CUENTA | 0..1 | 0..N | ID global restringido |
| AUDITORIA_GLOBAL.cuenta_afectada_id | CUENTA | 0..1 | 0..N | ID global restringido |
| POLITICA_OPERATIVA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| POLITICA_OPERATIVA.aprobador_id | CUENTA | 1 | 0..N | ID global restringido |
| EXCEPCION_POLITICA.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| EXCEPCION_POLITICA.politica_id | POLITICA_OPERATIVA | 1 | 0..N | compuesta tenant_id + id |
| EXCEPCION_POLITICA.paciente_id | PACIENTE | 0..1 | 0..N | compuesta tenant_id + id |
| EXCEPCION_POLITICA.turno_id | TURNO | 0..1 | 0..N | compuesta tenant_id + id |
| EXCEPCION_POLITICA.actor_beneficiario_id | CUENTA | 0..1 | 0..N | ID global restringido |
| EXCEPCION_POLITICA.aprobador_id | CUENTA | 1 | 0..N | ID global restringido |
| CASO_ABUSO.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| CASO_ABUSO.paciente_id | PACIENTE | 0..1 | 0..N | compuesta tenant_id + id |
| CASO_ABUSO.cuenta_id | CUENTA | 0..1 | 0..N | ID global restringido |
| CASO_ABUSO.revisor_id | CUENTA | 0..1 | 0..N | ID global restringido |
| ACCESO_SOPORTE.tenant_id | ENTIDAD | 1 | 0..N | ID global restringido |
| ACCESO_SOPORTE.operador_id | CUENTA | 1 | 0..N | ID global restringido |
| ACCESO_SOPORTE.concedente_id | CUENTA | 1 | 0..N | ID global restringido |
| ENSAYO_RESTAURACION.respaldo_id | RESPALDO | 1 | 0..N | ID global restringido |

## Trazabilidad funcional

| Regla | Entidades principales | Casos y decisiones |
| --- | --- | --- |
| R01 R01.a | ENTIDAD, SEDE, PACIENTE, PACIENTE_PROFESIONAL, CONTADOR_PACIENTE | CU-07,09,13-15,29-32,36-37; MP-07,35,37-41; D11 D12 |
| R02 R02.a R03 | PRE_RESERVA, TURNO, OCUPACION_GLOBAL, IDEMPOTENCIA, POLITICA_OPERATIVA, CASO_ABUSO | CU-13-15,19-21,27,36-37; S03 S16; D01 D02 D15 |
| R04 | MEMBRESIA, ROL, PERMISO, DELEGACION_AGENDA, DELEGACION_PERMISO | CU-04,08,11,15,17,19-22,28; MP-12..15,19..25,36; D03 |
| R05 R10 | PROFESIONAL_ENTIDAD, TRANSICION_PROFESIONAL, CORRESPONDENCIA_FICHAJE, PETICION_ELIMINACION | CU-29-31; MP-37..41; ADR-011; D04 D12 |
| R06 | PRACTICA, VERSION_PRACTICA, OFERTA, VERSION_OFERTA, HORARIO_AGENDA, RECURSO | CU-10-16,20,36-37; CAT-01..12; ADR-009; D05 |
| R07 | COBERTURA_MEDICA, PLAN_COBERTURA, AFILIACION_PACIENTE, CONVENIO, EVALUACION_ELEGIBILIDAD | CU-09,12-15,20,36-37; D06; docs/18 |
| R08 | VERSION_TURNO, CONFIRMACION_ASISTENCIA, EVENTO_TURNO, TOKEN_TURNO, TAREA_PERSISTIDA, AVISO_INTERNO | CU-18-22,24-26; OP-01/02; ADR-004; D07 |
| R09 R09.a | REPRESENTACION, REPRESENTACION_PERMISO, SOLICITUD_ADMISION, ACCESO_PACIENTE, ALCANCE_ACCESO | CU-01-04,06,09,14-19,23,28; S09 S15; D08 D14 |
| R10.a | CUENTA, CREDENCIAL_LOCAL, TOKEN_IDENTIDAD, SESION, FACTOR_MFA, INVITACION_EQUIPO | CU-05,07,35; ADR-012; S01 S06; D14 D16 |
| R11 | CANAL_ENTIDAD, DESTINO_AVISO, AVISO_EXTERNO, INTENTO_ENVIO, EVENTO_PROVEEDOR, CONSUMO_CANAL | CU-24-26; docs/04; D09 |
| R11.a | CONVERSACION, PARTICIPANTE_CHAT, PARTICIPANTE_PERMISO, MENSAJE, LECTURA_MENSAJE | CU-16,23; MP-31/32; S14; D13 |
| R11.b | LOTE_REPROGRAMACION, INTERVALO_LOTE, TURNO_AFECTADO, SOLICITUD_GESTION | CU-21,26; OP-03; ADR-013; D07 D09 |
| R12 S10-S12 | AUDITORIA_ENTIDAD, AUDITORIA_GLOBAL, ACCESO_SOPORTE, RESPALDO, ENSAYO_RESTAURACION, INCIDENTE | CU-32-34; OP-05; D11 D16 |

## Fuentes documentales

Prevalecen las reglas y ADR vigentes. Los análisis históricos sustituidos no se usan como norma. El inventario conserva todos los documentos del relevamiento y permite rastrear el corte utilizado.

- [01-propuesta-v1.md](01-propuesta-v1.md)
- [02-plan-de-trabajo.md](02-plan-de-trabajo.md)
- [03-reglas-del-dominio.md](03-reglas-del-dominio.md)
- [04-canales-y-costos.md](04-canales-y-costos.md)
- [05-incrementos-y-beta.md](05-incrementos-y-beta.md)
- [06-seguridad-beta.md](06-seguridad-beta.md)
- [07-revision-decisiones-producto.md](07-revision-decisiones-producto.md)
- [08-presupuesto-y-operacion.md](08-presupuesto-y-operacion.md)
- [09-portal-correo-y-membresia.md](09-portal-correo-y-membresia.md)
- [10-prevencion-de-reservas-abusivas.md](10-prevencion-de-reservas-abusivas.md)
- [11-formulario-empadronamiento-y-catalogo.md](11-formulario-empadronamiento-y-catalogo.md)
- [12-acceso-con-aprobacion-administrativa.md](12-acceso-con-aprobacion-administrativa.md)
- [13-estado-consolidado-y-pendientes.md](13-estado-consolidado-y-pendientes.md)
- [14-glosario-del-dominio.md](14-glosario-del-dominio.md)
- [15-alcance-y-cierre-del-item.md](15-alcance-y-cierre-del-item.md)
- [16-catalogo-de-practicas.md](16-catalogo-de-practicas.md)
- [17-revision-y-limpieza-documental.md](17-revision-y-limpieza-documental.md)
- [18-ficha-paciente-y-cobertura-medica.md](18-ficha-paciente-y-cobertura-medica.md)
- [19-desvinculacion-y-transicion-del-profesional.md](19-desvinculacion-y-transicion-del-profesional.md)
- [20-registro-de-usuarios-y-recuperacion-de-acceso.md](20-registro-de-usuarios-y-recuperacion-de-acceso.md)
- [21-casos-de-uso.md](21-casos-de-uso.md)
- [22-matriz-de-permisos.md](22-matriz-de-permisos.md)
- [24-verificacion-base-servidor.md](24-verificacion-base-servidor.md)
- [001-aislamiento-y-numeracion-pacientes.md](arquitectura/adr/001-aislamiento-y-numeracion-pacientes.md)
- [002-producto-y-operacion-inicial.md](arquitectura/adr/002-producto-y-operacion-inicial.md)
- [003-portal-y-revision-de-canales.md](arquitectura/adr/003-portal-y-revision-de-canales.md)
- [004-confirmacion-por-correo-y-respaldo.md](arquitectura/adr/004-confirmacion-por-correo-y-respaldo.md)
- [005-chat-y-seleccion-de-consultas.md](arquitectura/adr/005-chat-y-seleccion-de-consultas.md)
- [006-admision-y-vision-de-empadronamiento.md](arquitectura/adr/006-admision-y-vision-de-empadronamiento.md)
- [007-acceso-sujeto-a-admision-administrativa.md](arquitectura/adr/007-acceso-sujeto-a-admision-administrativa.md)
- [008-consolidacion-del-chat.md](arquitectura/adr/008-consolidacion-del-chat.md)
- [009-catalogo-inicial-y-personalizacion.md](arquitectura/adr/009-catalogo-inicial-y-personalizacion.md)
- [010-ficha-de-referencia-y-alcance-administrativo.md](arquitectura/adr/010-ficha-de-referencia-y-alcance-administrativo.md)
- [011-transicion-administrada-del-profesional.md](arquitectura/adr/011-transicion-administrada-del-profesional.md)
- [012-recuperacion-y-alta-de-usuarios.md](arquitectura/adr/012-recuperacion-y-alta-de-usuarios.md)
- [013-reprogramacion-profesional-por-whatsapp.md](arquitectura/adr/013-reprogramacion-profesional-por-whatsapp.md)
- [014-base-tecnica-servidor.md](arquitectura/adr/014-base-tecnica-servidor.md)
- [015-identificadores-uuidv7.md](arquitectura/adr/015-identificadores-uuidv7.md)
