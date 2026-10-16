# Formulario de admisión y evolución del catálogo público

Actualización: 15 de octubre de 2026. Formulario propio y admisión administrativa aceptados en ADR-007/008. Datos mínimos y mecanismos detallados propuestos para revisión. Catálogo público y simplificación entre entidades pertenecen a una evolución futura. Sin implementación.

## Admisión incluida en beta

El conocido es habilitado por personal con facultad administrativa; el nuevo presenta una solicitud en el formulario propio protegido y ese personal la revisa y acepta. Ambos completan activación y vinculación verificadas antes de acceder al contexto privado. La aprobación se mantiene mientras esté vigente y no se repite en cada inicio de sesión o reserva.

La solicitud no crea turno, pre-reserva, ocupación ni acceso a chat. Google y la alternativa por correo autentican la cuenta; no sustituyen la admisión ni acreditan por sí solos identidad legal o correspondencia con ficha. La elección de formulario propio está resuelta: Google Forms no integra el recorrido de beta. La comparación anterior se conserva en el [archivo histórico](archivo/2026-10-15-analisis-sustituidos.md).

## Formulario y revisión: detalle propuesto

| Información | Tratamiento propuesto |
| --- | --- |
| Paciente y actor que solicita | Separarlos cuando actúe representante; recoger solo lo necesario para la admisión |
| Contacto | Verificar control y destinatario autorizado, sin inferir identidad legal |
| Entidad y profesional de destino | Resolver identificadores contra configuración autorizada, sin permitir acceso cruzado |
| Relación con ficha existente | Revisar coincidencias dentro de la entidad; no fusionar ni vincular automáticamente por DNI, nombre o contacto |
| Representación | Comprobar facultades, evidencia, vigencia y restricciones antes de otorgar acceso |
| Estado y decisión | Registrar autor, ámbito, fecha, resultado y motivo con visibilidad restringida |

El formulario debe ser usable desde el celular y tener límites de frecuencia, protección anti-bot, bandeja de revisión y respuestas que no revelen fichas ajenas. Los campos obligatorios, evidencias, responsables, plazos y tratamiento de duplicados se decidirán antes de implementarlo.

Después de admisión, activación y autenticación, el paciente o representante autorizado elige horarios exclusivamente para la práctica específica «Consulta» habilitada. Las demás prácticas, incluidas las personalizadas, se asignan y reprograman por personal autorizado. El detalle está en [R06](03-reglas-del-dominio.md#r06-intervalos-por-práctica-y-agenda) y el [catálogo de prácticas](16-catalogo-de-practicas.md).

## Cuenta, ficha y ámbito autorizado

| Objeto | Regla vigente |
| --- | --- |
| Cuenta | Reutilizable; no exige otra contraseña por profesional ni habilita automáticamente todas las entidades |
| Ficha | Pertenece a una entidad; no se comparte ni fusiona al reutilizar la cuenta |
| Número visible | Pertenece a la relación profesional-paciente dentro de la entidad y conserva su serie |
| Habilitación | Autoriza un contexto local persistente; alcance exacto por profesional/agendas y transiciones por concretar |
| Turno y chat | Conservan entidad, participantes y permisos propios |

Se usa **solicitud de admisión** para el trámite de beta. **Solicitud de empadronamiento** describe la relación de atención futura cuyo mecanismo entre entidades está por definir. Ninguna de las dos equivale a una reserva, a suscripción comercial ni a consentimiento sanitario general.

## Catálogo público y nuevo vínculo entre entidades: fuera de beta

La visión futura es un directorio autorizado de profesionales y un trámite simplificado para solicitar atención con la misma cuenta, compartiendo solo datos administrativos aceptados por el paciente. No hay publicación ni acceso inmediato a todas las agendas aprobado para beta.

Si se desarrolla ese recorrido, deberán definirse publicación y verificación de perfiles, datos compartidos, nuevo vínculo local, alcance institucional/profesional y bajas que preserven los turnos existentes. La continuidad comercial se evaluará con el módulo de suscripciones de I2/I3. No se transfiere automáticamente ficha, número, turno o chat de una entidad a otra.

Publicar un perfil no autoriza una reserva. La publicación es una condición de ese futuro recorrido público, no un requisito para usar las agendas privadas de la beta. En beta bastan los requisitos locales de admisión, permisos, práctica elegible, cobertura, cuota y disponibilidad establecidos en las reglas.

## Prevención de solicitudes abusivas

Aplicar límites por actor, paciente representado, operación y entidad, con señales complementarias de red y controles consistentes ante concurrencia. Los reintentos al mismo contexto no deben crear solicitudes duplicadas. Contemplar familias y contactos compartidos. No suspender a un paciente por datos que un tercero declaró.

Las señales técnicas entre entidades requieren un diseño específico y mínimo; no se publican listas de pacientes sospechosos ni se comparte información de salud. Ver [defensa contra abuso](10-prevencion-de-reservas-abusivas.md).

## Pendientes y verificación

Para beta: campos, evidencia de vínculo/representación, plazos de revisión, activación, recuperación, alcance local y transiciones; cuotas y proveedor anti-bot. Para evolución: directorio público y política simplificada de nuevo vínculo entre entidades.

Los criterios de admisión y revocación se detallan en [acceso](12-acceso-con-aprobacion-administrativa.md) y [seguridad](06-seguridad-beta.md). Las decisiones de origen se conservan en [ADR-006](arquitectura/adr/006-admision-y-vision-de-empadronamiento.md), [ADR-007](arquitectura/adr/007-acceso-sujeto-a-admision-administrativa.md) y [ADR-008](arquitectura/adr/008-consolidacion-del-chat.md). Las pruebas se ejecutarán cuando exista aplicación.
