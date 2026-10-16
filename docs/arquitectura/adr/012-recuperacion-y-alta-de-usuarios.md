# ADR-012. Recuperación de acceso y análisis del alta de usuarios

Fecha: 15 de octubre de 2026. Estado: recuperación por email para secretaría, administradores y profesionales confirmada; diseño detallado y registro de quien gestiona la adquisición propuestos para revisión. Reglas relacionadas: R01, R04, R05, R09.a, R10 y R12. Sin implementación de autenticación ni envío de correos.

## Contexto y fuente

El responsable solicita una interfaz para que secretaría, administración y profesionales puedan restablecer una contraseña olvidada mediante su email. También pide analizar cómo registrar usuarios, en particular a quien gestiona la adquisición del servicio, comparando creación de usuario y formulario de registro.

El proyecto mantiene incorporación controlada por plataforma en beta y cuenta global persistente del profesional conforme a ADR-011. El motor de pagos y suscripciones continúa diferido a I2/I3.

## Requerimiento confirmado

Incluir recuperación de contraseña por email para los tres actores indicados. Debe preservar permisos por entidad, bajas, cuenta global y trazabilidad; no sustituye la admisión de pacientes ni habilita contexto por recuperar una credencial.

## Propuesta preparada para revisión

1. Entrada común «Olvidé mi contraseña», email verificado, instrucciones por canal seguro, enlace limitado y elección de nueva contraseña; sin selección pública de rol ni revelación de cuentas.
2. Email + contraseña local como alternativa de personal; cuentas exclusivamente externas recuperan mediante su proveedor, sin agregar credenciales por coincidencia de email. MFA conserva su procedimiento separado.
3. Formulario propio que crea o reutiliza una cuenta personal verificada y genera una solicitud de entidad. Plataforma revisa representación y primer administrador antes de habilitar; alta asistida mediante invitación como alternativa.
4. Separar persona, responsable de contratación, administrador de entidad, entidad y futura relación contractual. El contacto comercial puede carecer de acceso operativo.
5. Incorporar secretaría/profesionales/otros administradores mediante invitaciones acotadas y permisos explícitos, sin cuentas compartidas ni contraseñas elegidas por administradores.

Estas propuestas no se registran como aceptadas por el responsable. El [análisis y especificación](../../20-registro-de-usuarios-y-recuperacion-de-acceso.md) contiene pantallas, controles, alternativas, criterios y pendientes; incluye una maqueta local para revisión, sin backend.

## Consecuencias y pendientes

La recuperación pertenece a identidad y no cambia membresías. La continuidad del profesional y su fichaje sigue en ADR-011. Solicitud comercial, admisión de pacientes, activación de cuenta y suscripción son estados distintos.

Antes de construir, revisar recorrido de alta, campos/verificación, permisos para invitar/otorgar administración, política de credenciales, sesión/MFA, recuperación asistida, proveedor de email y límites. La vigencia de 30 minutos es una propuesta; no un parámetro aprobado. Verificar estos controles en la aplicación antes de entregar datos reales.
