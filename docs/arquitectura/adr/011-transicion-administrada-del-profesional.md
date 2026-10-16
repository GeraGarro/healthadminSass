# ADR-011. Transición administrada del profesional entre entidades

Fecha: 15 de octubre de 2026. Estado: continuidad del fichaje, baja institucional y persistencia de cuenta confirmadas; eliminación de cuenta y vínculos solo a petición expresa del profesional. Modelado y procedimiento pendientes. Reglas relacionadas: R01, R01.a, R03, R04, R05, R10 y R12. Sin implementación.

## Contexto y fuente

El responsable requiere que, cuando un profesional deje un consultorio vinculado al servicio conjunto de una clínica, pueda pasar a otra clínica o contratar el servicio de forma individual. Los desarrolladores y administradores globales deben tener la posibilidad de gestionar el traspaso o reformular su condición.

**Aclaración posterior del responsable:** el fichaje de pacientes debe permanecer vinculado al profesional para poder reconfigurarlo como independiente. Si deja el padrón de la institución, el administrador de esa cuenta debe poder darlo de baja. La cuenta profesional persiste salvo petición expresa del propio profesional para eliminarla. Al precisar el alcance de esa eliminación, eligió «Cuenta y vínculos del profesional»; las fichas de pacientes y el historial administrativo se conservan.

## Requerimiento confirmado

1. Permitir gestionar administrativamente la salida y la continuidad del profesional en otra clínica o en su actividad independiente.
2. Conservar la identidad del profesional. Su salida de una entidad no elimina su cuenta ni sus vínculos con otras entidades.
3. Dotar al administrador de plataforma de una facultad operativa para tramitar la transición, con permisos y trazabilidad. Una persona del equipo de desarrollo podrá actuar cuando tenga asignada esa facultad administrativa; el cargo de desarrollador no sustituye la autorización.
4. Mantener el alcance de turnos y gestión administrativa. La atención independiente se representa mediante una entidad propia; si ya existe una entidad independiente válida, se revisará su reutilización.
5. Conservar todo el fichaje de pacientes vinculado al profesional para su continuidad como independiente. La baja institucional no debe destruirlo ni impedir su recuperación al reconfigurarlo. Esto sustituye la incertidumbre anterior sobre si la transición debía limitarse a la cuenta.
6. Permitir al administrador de la entidad dar de baja al profesional de su padrón, con la facultad correspondiente y alcance limitado a esa institución. Finalizar el vínculo y sus permisos locales; conservar cuenta global, fichaje y vínculos con otras entidades.
7. Mantener la cuenta profesional aun sin vínculos institucionales activos. La persistencia no concede por sí sola servicio activo ni acceso al contexto institucional de origen; habilitar el contexto independiente para operar.
8. Tramitar la eliminación de cuenta y vínculos solo ante petición expresa y verificada del profesional involucrado. Conservar fichas de pacientes e historial administrativo; definir referencias históricas y trazabilidad antes de implementar. Esta regla no es una petición de borrar una cuenta real.

## Límites y propuestas pendientes

La continuidad del fichaje del profesional queda confirmada. Siguen pendientes su representación con fichas locales por entidad, los datos compartidos con otros profesionales, la numeración de destino y el tratamiento de turnos futuros, chats, convenios y avisos. No equivale a copiar todos los datos de la clínica ni a abrir acceso entre entidades por compartir identidad.

Se propone una solicitud con origen, destino, fecha efectiva, responsable y plan de tratamiento de turnos, seguida de una revisión y ejecución auditada. El [análisis de transición](../../19-desvinculacion-y-transicion-del-profesional.md) describe casos y pendientes; su procedimiento no queda aprobado por este ADR.

La incorporación operativa a una entidad independiente puede gestionarse en el incremento 1. Esta necesidad no adelanta el motor de planes, pagos o suscripciones de I2/I3. La aceptación comercial individual y el cambio operativo se registran como conceptos distintos.

## Consecuencias

No convertir la entidad de una clínica en la entidad personal del profesional ni cambiar el propietario de sus datos en bloque. El cambio de vínculo exige tratar turnos vigentes, permisos, delegaciones y capacidad compartida sin cancelar ni liberar reservas por efecto colateral.

La estabilidad del número dentro de una serie, reafirmada en ADR-001, no determina cómo resolver números y referencias entre entidades: concretar múltiples orígenes y serie previa en destino. La baja institucional tampoco resuelve por sí sola los turnos pendientes. La eliminación solicitada de cuenta y vínculos conserva fichas e historial de pacientes, incluidos los compartidos con otros profesionales.
