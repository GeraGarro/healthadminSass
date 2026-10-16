# Ficha de paciente y cobertura médica: análisis para revisión

Fecha: 15 de octubre de 2026.

**Estado: alcance administrativo confirmado; detalle de datos y modalidad pendiente de revisión.** El responsable aportó dos fotografías de una ficha dental utilizada para pacientes con cobertura médica y confirmó que esta versión mantiene exclusivamente turnos y gestión administrativa. Odontograma y demás especificaciones clínicas quedan excluidos, según [ADR-010](arquitectura/adr/010-ficha-de-referencia-y-alcance-administrativo.md). La referencia no aprueba por sí sola nuevos campos obligatorios ni reglas de cobertura. Posteriormente confirmó expresamente la estabilidad de numeración ante bajas: el 12 no se reutiliza y el 13 y los posteriores no se renumeran; ver [ADR-001](arquitectura/adr/001-aislamiento-y-numeracion-pacientes.md).

## 1. Referencia aportada

Las fotografías muestran un formulario en blanco con identificación FEMESA. Se conserva una copia de cada imagen en [referencias](referencias/ficha-dental-cm-frente.png) y [referencias](referencias/ficha-dental-cm-dorso.png). No se ha verificado su vigencia ni su aplicabilidad a otras coberturas; sirve como ejemplo del trabajo actual, no como norma universal.

Campos y sectores que se distinguen en las fotografías:

| Grupo | Información visible | Uso propuesto |
| --- | --- | --- |
| Identificación | Paciente/apellido y nombres, sexo, edad, fecha de nacimiento, domicilio y localidad | Base de datos del paciente; revisar cuáles son necesarios. Preferir fecha de nacimiento y calcular la edad para la fecha correspondiente |
| Afiliación | Obra social, número de afiliado, titular, grupo familiar y parentesco | Información adicional cuando se registra una cobertura; definir qué significa cada campo y su obligatoriedad |
| Encabezado del formulario | Entidad primaria y códigos | Aclarar significado con el responsable antes de mapearlos; no equiparar automáticamente con la entidad cliente del SaaS |
| Profesional y período | Odontólogo, matrícula, mes y año | Profesional y período de una eventual planilla de prestaciones; distinguirlos de la ficha permanente del paciente |
| Prestaciones | Fecha, diente, cara, código y conformidad del paciente | Registro clínico de prestaciones excluido de esta versión; no equivale a un turno ni a una práctica solo agendada |
| Odontograma | Piezas dentales, referencias de colores y símbolos, observaciones | Contenido clínico especializado, fuera del alcance actualmente aprobado de beta |
| Constancias | Cantidad de dientes existentes, cantidad de radiografías adjuntas, sello/firma profesional y auditoría odontológica con autorización/fecha | Constancias clínicas y auditoría odontológica de esta planilla excluidas de esta versión; se conserva la auditoría administrativa del sistema |

El campo «titular» de afiliación no demuestra representación para operar el portal. La conformidad o firma impresa tampoco equivale a confirmación de asistencia, autorización de cobertura o consentimiento sanitario digital.

## 2. Distinción propuesta

Mantener una ficha administrativa por paciente dentro de cada entidad y sus vínculos numerados por profesional según las reglas vigentes. Agregar información de cobertura sin crear una segunda ficha por ese motivo.

Separar dos conceptos:

- **Coberturas registradas del paciente:** ninguna declarada, una o varias, o información todavía pendiente de relevar. «Sin dato» no debe convertirse automáticamente en «sin cobertura».
- **Modalidad elegida para cada turno:** por una cobertura determinada o particular, cuando esa modalidad esté habilitada y el paciente la elija. Tener cobertura no obliga a utilizarla en todas las atenciones.

| Dato o comportamiento | Atención por cobertura | Atención particular |
| --- | --- | --- |
| Identificación y contacto | Base común | Base común |
| Ficha y número profesional/entidad | Se conservan | Se conservan; el cambio de modalidad no crea otra ficha ni otra serie |
| Obra social/prepaga y plan | Seleccionar la cobertura aplicable; plan cuando corresponda | No exigir estos datos para esa atención |
| Número de afiliado y datos de titular/grupo familiar | Registrar según requisitos que se validen para la cobertura | No exigirlos para esa atención |
| Convenio con profesional, agenda y práctica | Comprobar compatibilidad según R07; definir casos de revisión | Comprobar que se ofrece modalidad particular |
| Autorización de la cobertura | Solo cuando corresponda; reglas y evidencia pendientes | No corresponde autorización de una cobertura para esa atención |
| Tratamiento de datos anteriores | Conservar el contexto utilizado por cada turno | Pasar a particular no borra coberturas ni cambia turnos anteriores |

Registrar una cobertura declarada no acredita afiliación vigente ni autorización para una práctica. La cobertura elegida se conserva en el contexto del turno, con la regla de convenio aplicada, según R07. No se incorpora aquí un servicio externo de verificación.

Ejemplo: Ana tiene una obra social. Reserva una consulta por esa cobertura y posteriormente elige una atención particular habilitada. Sigue siendo la misma paciente en la entidad y conserva su número con el profesional; cambia la modalidad del turno. Si cambia de obra social, tampoco corresponde crear otra ficha solo por ese cambio.

## 3. Relación con el alcance actual

La parte administrativa puede orientar el diseño de paciente, coberturas y elegibilidad ya contemplado en [R07](03-reglas-del-dominio.md#r07-coberturas-y-convenios-de-atención). Se deben concretar campos, responsables y permisos antes de implementarla.

**Confirmado por el responsable:** esta versión mantiene solo turnos y gestión administrativa. Quedan fuera el odontograma, las anotaciones por diente/cara, radiografías, registro clínico de prestaciones realizadas, firmas clínicas y auditoría odontológica de la planilla. No se abre una ampliación clínica como siguiente paso de este estudio. Se mantienen el catálogo administrativo de prácticas para organizar turnos, los estados administrativos de asistencia/atención y la auditoría de operaciones del sistema. No convertir automáticamente los códigos de esta planilla en las cuatro prácticas iniciales del catálogo ni asumir que un turno acredita una prestación clínica realizada.

La afiliación a una cobertura no concede acceso a sus representantes a la ficha. La referencia tampoco modifica el aislamiento entre entidades, la admisión, la representación de menores ni las restricciones de autoselección de prácticas.

## 4. Relación con importación y duplicados

Si se importan fichas de este tipo, distinguir el número de afiliado, el número visible por profesional y el identificador interno. El número de afiliado puede corresponder a reglas familiares de una cobertura; su significado y formato deben validarse antes de usarlo para detectar coincidencias. No fusionar fichas automáticamente por nombre, titular o número de afiliado.

Un cambio de cobertura o de modalidad no es un duplicado. La importación y una eventual fusión deben conservar historial y resolver las referencias existentes con autorización y trazabilidad; el procedimiento concreto sigue pendiente. Esta propuesta no habilita traslados automáticos entre entidades.

## 5. Alcance resuelto y detalles pendientes

1. **Resuelto:** usar la referencia solo para estudiar datos administrativos y de cobertura. Odontograma y demás especificaciones clínicas fuera de esta versión. No implica aprobar todos los campos del formulario.
2. Revisar la propuesta de una ficha común y modalidad por turno, incluyendo personas con cobertura que elijan atención particular.
3. Aclarar significado de entidad primaria, códigos, titular y grupo familiar; identificar qué datos exige realmente cada cobertura del piloto.
4. Definir datos mínimos de identificación/contacto para todos y requisitos adicionales por cobertura, evitando exigir afiliación a pacientes particulares.
5. Concretar permisos, comprobaciones, cambios de cobertura, importación y tratamiento de duplicados con casos de aceptación.

La confirmación recibida resuelve el límite administrativo de esta versión. Las propuestas de campos, modalidad por turno y procedimientos adicionales siguen pendientes de revisión; no se consideran aceptadas por esa confirmación de alcance.
