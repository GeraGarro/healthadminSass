// Genera documentación y vista conversacional desde una única matriz documental.
// Uso: node scripts/generar-matriz-permisos.cjs [directorio de visualización]
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const input = path.join(root, 'docs/permisos');
const data = JSON.parse(fs.readFileSync(path.join(input, 'matriz.json'), 'utf8'));
const groups = [...new Set(data.filas.map(row => row.g))];
const codes = Object.keys(data.leyenda);
if (new Set(data.filas.map(row => row.id)).size !== data.filas.length) throw Error('IDs repetidos');
for (const row of data.filas) {
  if (row.p.length !== data.roles.length || row.p.some(code => !codes.includes(code))) throw Error(`Permisos inválidos: ${row.id}`);
  for (const key of row.refs) if (!data.fuentes[key]) throw Error(`Fuente inexistente: ${key}`);
}
for (const [, target] of Object.values(data.fuentes)) {
  if (!fs.existsSync(path.join(root, 'docs', target.split('#')[0]))) throw Error(`Archivo de fuente inexistente: ${target}`);
}
const sourceLinks = row => row.refs.map(key => `[${key}](${data.fuentes[key][1]})`).join(', ');
const lines = [
  '# Matriz de permisos de beta', '',
  'Fecha: 16 de octubre de 2026. Versión documental 1.0. Fuente: reglas vigentes y ADR del proyecto. Sin consulta externa.', '',
  '**Estado: preparada para revisión.** Transcribe las facultades y restricciones respaldadas por la documentación aprobada; conserva sin asignar los detalles abiertos. Esta entrega no aprueba una política nueva, no cierra D03/D08/D14 ni acredita implementación o pruebas funcionales. Los casos de uso y documentos 16, 18 y 20 sirven para trazabilidad de detalle propuesto, no como aprobación adicional.', '',
  `Incluye ${data.filas.length} acciones, seis actores humanos principales y ${data.operaciones.length} operaciones técnicas separadas. Los identificadores MP y OP son referencias de esta matriz, no nombres de permisos/API aprobados.`, '',
  '## Cómo interpretar las celdas', '',
  '| Marca | Significado |', '| --- | --- |',
  ...Object.entries(data.leyenda).map(([key,value]) => `| ${key} | ${value} |`), '',
  '**C, D y F nunca son permisos universales.** Se verifican entidad, recurso, acción, vínculo y estado vigentes. Una facultad F no está concedida a todas las cuentas del rol; su otorgante y procedimiento pueden seguir pendientes. Una marca ? no es una propuesta de concesión ni permiso utilizable. — no es una prohibición absoluta para la persona: puede actuar bajo otro rol o una facultad adicional previamente validada. X se limita a la acción y causa expresadas en esa fila.', '',
  'Una misma persona puede ser profesional, administrador y/o secretaría en distintos contextos. Cada actuación debe declarar y verificar el contexto correspondiente; los roles no se combinan para eludir restricciones. El rol de administrador no hereda gestión de agendas, lectura de fichas o chat.', '',
  '## Condiciones comunes', '',
  '1. El servidor autoriza cada operación por identidad, entidad, recurso y acción; la interfaz solo presenta las facultades resueltas.',
  '2. Paciente: admisión vigente, activación y vínculo verificados. Representante: además facultad, alcance y vigencia sobre el paciente; acceso informativo, gestión de turnos y consentimiento sanitario son facultades distintas.',
  '3. Secretaría en agenda delegada: membresía vigente + delegación de esa persona y agenda en la misma entidad + acción concreta. Las delegaciones las otorga el profesional; no hay subdelegación implícita.',
  '4. Profesional: agenda propia autorizada y vínculo vigente con la entidad. Identidad global y número de paciente no abren datos de otros profesionales o entidades.',
  '5. Revocación efectiva en la siguiente operación, incluso con pantalla abierta. No borra historial ni cancela automáticamente turnos existentes.',
  '6. Elegibilidad, disponibilidad, cuotas, vigencia del turno y políticas aplican además del permiso. Confirmar, cancelar y reprogramar requieren acciones explícitas, consistentes y auditadas; un chat o una lectura no las ejecutan.',
  '7. Auditoría registra actor real y paciente/representado por separado, ámbito, acción, resultado, cambios y motivo, sin contraseñas, tokens completos ni cuerpos de chat en logs generales.', '',
  '## Puerta de acceso de paciente y representante', '',
  '| Estado | Facultad privada |', '| --- | --- |',
  '| Sin admisión / solicitud pendiente | No permite ficha, reservas, pre-reservas ni chat. El formulario propio protegido no crea capacidad. Consulta limitada del trámite: diseño pendiente. |',
  '| Aprobado, activación pendiente | Solo completar activación/vinculación; aún no habilita facultades privadas sobre esa ficha. |',
  '| Activo | Solo los recursos y acciones autorizados por la matriz y los vínculos vigentes. |',
  '| Rechazado / suspendido / revocado | Sin nuevas operaciones privadas en el contexto afectado. Otros contextos autorizados de la cuenta se conservan. |', '',
  'Fuente: [R09.a](03-reglas-del-dominio.md#r09a-admisión-habilitación-y-solicitud-de-empadronamiento) y [documento 12](12-acceso-con-aprobacion-administrativa.md). El equipo ingresa según sus propias membresías/facultades. Un solicitante público solo presenta el trámite protegido; un contacto, familiar o entidad de cobertura médica no recibe acceso privado por esa condición.', ''
];
for (const group of groups) {
  lines.push(`## ${group}`, '', `| Acción | ${data.roles.join(' | ')} |`, `| --- | ${data.roles.map(() => '---').join(' | ')} |`);
  for (const row of data.filas.filter(row => row.g === group)) lines.push(`| ${row.id} · ${row.a} | ${row.p.join(' | ')} |`);
  lines.push('', '### Condiciones y trazabilidad', '');
  for (const row of data.filas.filter(row => row.g === group)) lines.push(`- **${row.id}:** ${row.n} Fuentes: ${sourceLinks(row)}. Trazabilidad: ${row.cu}. Pendientes: ${row.open}.`);
  lines.push('');
}
lines.push('## Automatizaciones y operador técnico', '', 'No son roles de paciente ni facultades generales de administración. Cada trabajo debe conservar su propio alcance de entidad, recurso, destinatario y acción; los proveedores transportan o almacenan datos autorizados y no adquieren permisos de portal.', '', '| ID / actor | Operación | Límite | Fuente |', '| --- | --- | --- | --- |');
for (const row of data.operaciones) lines.push(`| ${row[0]} · ${row[1]} | ${row[2]} | ${row[3]} | ${row[4]} |`);
lines.push('', '## Pendientes que esta matriz conserva abiertos', '',
  '| Decisión | Qué falta definir |', '| --- | --- |',
  '| D03 | Concedentes, titulares y alcance de facultades; administración de miembros, acciones delegables y revocación. Los códigos MP no son permisos técnicos definitivos. |',
  '| D04 / D12 | Procedimiento de salida, fichaje compartido, numeración de destino, turnos futuros y ejecutor de eliminación solicitada. No cambiar la conservación confirmada en ADR-011. |',
  '| D05 | Concedente y destinatarios de catálogo; edición/estados, oferta por agenda y habilitación de portal. La restricción a Consulta permanece confirmada. |',
  '| D06 | Planes, verificación de afiliación, configuración delegada y excepciones de cobertura. |',
  '| D07 / D09 | Políticas voluntarias de cancelación/reprogramación, asistencia telefónica, excepciones, responsables de avisos fallidos y lotes por ausencia. El WhatsApp obligatorio de ADR-013 se conserva. |',
  '| D08 / D14 | Evidencia y facultades de representación, admisión, asignación de permisos, campos visibles/editables y activación. La recuperación del equipo por email está confirmada. |',
  '| D13 / D15 | Alta y participantes del chat, eventual participación administrativa, límites y revisión de abuso. |',
  '| D11 / D16 | Lectores de auditoría, reportes, soporte excepcional y responsables técnicos; retención, sesiones, infraestructura y restauración. |', '',
  'Las transiciones del turno y la asignación de cada estado operativo también requieren revisión. I2/I3 comercial, alta por formulario de contratación no aprobada, directorio público, historia clínica especializada, IA, adjuntos y llamadas no reciben permisos por figurar en esta matriz.', '',
  '## Escenarios de verificación para la futura aplicación', '',
  'Son criterios derivados, no pruebas ejecutadas ni autorización para tratar datos reales.', '',
  '| Escenario | Resultado esperado |', '| --- | --- |',
  '| Login válido con admisión pendiente o activación incompleta | Rechazar ficha, pre-reserva, turno y chat privados. |',
  '| Secretaría con consulta de agenda intenta reservar, admitir o leer chat | Rechazar cada acción no concedida; consulta no hereda otras facultades. |',
  '| Se revoca delegación o representación con pantalla abierta | Rechazar la siguiente operación; conservar historial y otros contextos autorizados. |',
  '| Paciente intenta elegir extracción o personalizada llamada Consulta, al reservar o reprogramar | Rechazar selección por pantalla y API; derivar a personal autorizado. |',
  '| Paciente ve turno de limpieza cargado por personal | Permitir consulta/confirmación y cancelación según política; rechazar elección directa de reemplazo. |',
  '| Administrador de entidad intenta operar agenda o chat solo por su cargo | Rechazar; exigir actuación y facultad específica vigentes. |',
  '| Representante tiene facultad de turnos e intenta leer chat o actuar por otro paciente | Rechazar sin facultad de conversación o vínculo sobre ese paciente. |',
  '| Dos entidades compiten por el mismo profesional | Una ocupación válida; la otra recibe conflicto sin datos de la entidad o paciente ajenos. |',
  '| Profesional inicia gestión por ausencia con turnos confirmados y pendientes | Incluir a todos los afectados en el WhatsApp; el aviso no reemplaza ni confirma turnos. |',
  '| Administrador local da baja a profesional | Finalizar permisos institucionales; conservar cuenta, fichaje, historia y otros vínculos. Revisar turnos con procedimiento definido. |',
  '| Recuperación de contraseña de cuenta con membresía revocada | Recuperar credencial sin reactivar permisos ni acceso revocado. |',
  '| Celda pendiente o sin concesión se interpreta como permiso | Rechazar: se necesita una decisión y asignación explícitas antes de implementarla. |', '',
  '## Mantenimiento y fuentes', '',
  'Fuente única de celdas y condiciones: [matriz.json](permisos/matriz.json). Presentación: [plantilla de visualización](permisos/plantilla.html). Regenerar con `node scripts/generar-matriz-permisos.cjs`; un directorio adicional permite copiar la vista a la ubicación autorizada para mostrarla en conversación. El generador valida IDs, seis celdas por acción, marcas y archivos de referencia.', '',
  'Este documento es un derivado; ante una discrepancia prevalecen las reglas y ADR vigentes. Cambiar una decisión exige el proceso documental correspondiente, no editar una celda silenciosamente. La preparación de esta matriz no altera aprobaciones anteriores.', '',
  ...Object.entries(data.fuentes).map(([key,[title,url]]) => `- [${key} · ${title}](${url})`), ''
);
fs.writeFileSync(path.join(root, 'docs/22-matriz-de-permisos.md'), lines.join('\n'), 'utf8');
const template = fs.readFileSync(path.join(input, 'plantilla.html'), 'utf8');
if ((template.match(/__MATRIZ_JSON__/g) || []).length !== 1) throw Error('Marcador de datos inválido');
const fragment = template.replace('__MATRIZ_JSON__', () => JSON.stringify(data).replace(/</g, '\\u003c'));
fs.writeFileSync(path.join(input, 'vista.html'), fragment, 'utf8');
if (process.argv[2]) {
  const dest = path.resolve(process.argv[2]);
  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, 'matriz-permisos-salud.html'), fragment, 'utf8');
}
console.log(`Matriz generada: ${data.filas.length} acciones, ${data.roles.length} actores, ${data.operaciones.length} operaciones técnicas.`);
