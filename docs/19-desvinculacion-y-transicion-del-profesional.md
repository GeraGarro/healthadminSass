# Desvinculación, fichaje y continuidad del profesional

Fecha: 15 de octubre de 2026. Estado: reglas funcionales confirmadas en [ADR-011](arquitectura/adr/011-transicion-administrada-del-profesional.md); modelo de datos y procedimiento propuestos para revisión. Sin implementación.

## 1. Requerimiento confirmado

El profesional puede dejar una clínica, incorporarse a otra o adquirir el servicio individual. Todo el fichaje de pacientes vinculado a él debe conservarse para permitir su reconfiguración como independiente. La transición administrada abarca esa continuidad, además de cuenta e identidad.

El administrador de la cuenta institucional puede dar de baja al profesional que deja el padrón. Finaliza su vínculo con la institución; conserva su cuenta global, fichaje y vínculos de otras entidades. La cuenta persiste aun sin instituciones activas.

Solo una petición expresa del propio profesional habilita tramitar la eliminación de su cuenta y vínculos. El responsable aclaró el alcance: «Cuenta y vínculos del profesional». Las fichas de pacientes y el historial administrativo se conservan. Esta documentación define una regla; no pide borrar una cuenta real.

Este requerimiento desarrolla R05 y R10 dentro del alcance de turnos y gestión administrativa; odontograma e historia clínica permanecen excluidos.

## 2. Operaciones y facultades

| Operación | Actor y alcance confirmado | Resultado |
| --- | --- | --- |
| Baja del padrón institucional | Administrador de esa entidad con la facultad correspondiente | Finalizar vínculo y permisos locales, conservando cuenta global, fichaje y otros vínculos |
| Reconfiguración como independiente | Administrador de plataforma; un desarrollador actúa con esa facultad operativa | Habilitar entidad propia o reutilizar una válida existente, dando continuidad al fichaje profesional |
| Incorporación a otra clínica | Gestión de plataforma y vínculo autorizado en destino | Conservar identidad; concretar datos y turnos del destino sin abrir toda la información de origen |
| Eliminación de cuenta y vínculos | Petición expresa del propio profesional, con verificación y ejecución administrativa por definir | Eliminar cuenta y vínculos conservando fichas e historial administrativo de pacientes; mecanismo de referencias históricas pendiente |

La cuenta persistente puede quedar sin contexto de trabajo activo hasta que se habilite uno. Persistencia no equivale a servicio gratuito, acceso vigente a la clínica anterior ni reserva automática de horarios.

## 3. Fichaje profesional y aislamiento

**Confirmado:** la baja institucional no puede destruir el fichaje vinculado al profesional ni obligar a reconstruirlo manualmente al independizarse. El diseño debe permitir conservarlo y darle continuidad en el contexto independiente.

**Diseño por concretar:** las fichas actuales pertenecen a una entidad y una misma ficha puede vincularse con varios profesionales. Distinguir paciente, ficha local, relación con cada profesional y datos operativos de cada entidad. No basta con conservar la cuenta o cambiar en bloque el identificador de entidad.

Se propone preparar en la transición los registros y vínculos del contexto independiente, conservando procedencia y referencias según el modelo que se apruebe. No se decide aquí entre copia administrativa, proyección u otro mecanismo autorizado; SQL, restricciones y permisos siguen pendientes.

Ejemplo: Ana está vinculada a A y B en una clínica y A se independiza. El sistema debe dar continuidad a su fichaje con A y mantener operativa la relación de Ana con B. Se propone que el cambio no retire a Ana de B ni exponga a A las operaciones de B. El tratamiento de campos compartidos y lo que conserva cada contexto requiere modelado y revisión.

La baja institucional revoca facultades sobre la clínica de origen. La continuidad en destino se ejecuta mediante el procedimiento específico sobre el fichaje profesional; no copia facultades de secretaría, credenciales de comunicación ni operaciones de otros profesionales. Definir acceso y representación de pacientes en destino: conservar una cuenta no concede autorización sobre todas las entidades.

## 4. Numeración, turnos y datos adicionales

| Elemento | Decisión vigente | Detalle pendiente |
| --- | --- | --- |
| Cuenta e identidad profesional | Persisten tras la baja institucional y se reutilizan al independizarse | Contactos institucionales, recuperación de acceso y estado sin actividad |
| Fichaje profesional | Se conserva para su continuidad independiente | Representación por entidad, datos compartidos, coincidencias y duplicados |
| Fichas e historial de pacientes | Persisten incluso ante eliminación de cuenta y vínculos del profesional | Referencias históricas y trazabilidad al retirar la cuenta |
| Numeración | No renumerar ni reutilizar por bajas dentro de una serie profesional/entidad | Números y referencias entre series, múltiples orígenes y serie previa en destino |
| Turnos futuros y pre-reservas | No se cancelan ni liberan por efecto de la baja | Responsable, permanencia o reprogramación, conflictos y avisos |
| Delegaciones | Finalizan en el contexto de baja; no pasan al destino | Fecha efectiva y facultades transitorias expresas |
| Convenios, ofertas y chat | No se transfieren por la sola conservación del fichaje | Alcance adicional que se apruebe; validación de oferta y permisos en destino |

Conservar el fichaje no decide trasladar todos los turnos a otra ubicación. Definir destino, horarios, elegibilidad, avisos y responsables, preservando la capacidad coordinada del profesional.

## 5. Procedimiento propuesto

1. Registrar profesional, origen, solicitante, operación y fecha efectiva. Comprobar facultad local para la baja y petición del profesional para eliminación global.
2. Distinguir baja de transición: puede haber baja sin destino inmediato, conservando cuenta y fichaje para continuidad posterior.
3. Preparar tratamiento de turnos/pre-reservas, responsables, avisos y delegaciones. Evitar que el cambio deje turnos sin responsable o intervalos falsamente libres.
4. Para la independencia, habilitar entidad propia y dar continuidad al fichaje mediante el modelo autorizado. Resolver duplicados, números y procedencia sin afectar otros profesionales.
5. Configurar oferta, agendas, convenios y permisos reales en destino. La incorporación manual pertenece a beta; el motor de pagos/suscripciones sigue en I2/I3.
6. Ejecutar con consistencia y auditoría. Reintentos no duplican cuentas, vínculos, fichas o reservas; verificar accesos y recuperación ante errores.
7. Para eliminación global solicitada, definir verificación, credenciales, referencias históricas y turnos pendientes, conservando fichas e historial de pacientes.

Las reglas funcionales indicadas están confirmadas; las etapas concretas son propuestas revisables, no implementación aprobada ni ejecutada.

## 6. Casos de aceptación para la futura implementación

- El administrador de A puede finalizar el vínculo local, conservando cuenta, fichaje y vínculos del profesional en B.
- Sin destino inmediato la cuenta y el fichaje persisten; al habilitar la entidad independiente se da continuidad al fichaje vinculado.
- Un paciente compartido permite continuidad con el profesional que se independiza sin perder la relación con el otro ni revelar sus operaciones.
- Un administrador de A no puede borrar la cuenta global ni finalizar vínculos de B con su permiso local.
- La baja no cancela ni libera turnos por sí sola; cada turno pendiente tiene tratamiento y responsable.
- La eliminación expresa de cuenta y vínculos conserva fichas e historial administrativo; una baja institucional no activa ese procedimiento.
- Reintentos o fallos no duplican fichas ni dejan referencias compartidas inválidas.
- Las bajas no renumeran pacientes; el comportamiento entre series se verifica al aprobar su diseño.

Son criterios para diseñar y verificar; no pruebas ejecutadas.

## 7. Pendientes abiertos

1. Modelo de continuidad del fichaje con fichas locales por entidad y pacientes compartidos, manteniendo el aislamiento.
2. Permisos detallados, procedimiento, fecha efectiva y coordinación de baja/transición; casos sin destino inmediato o con desacuerdo.
3. Turnos, pre-reservas, responsables y avisos; alcance adicional de chat o configuraciones.
4. Numeración de destino, procedencia y duplicados ante múltiples series o actividad independiente previa.
5. Acceso/representación de pacientes, contactos institucionales del profesional y nuevas delegaciones.
6. Eliminación de cuenta y vínculos a petición del profesional: verificación, referencias históricas, credenciales y turnos, conservando fichas e historial de pacientes.
7. Relación entre alta operativa y contratación individual, con el motor comercial en su incremento previsto.
