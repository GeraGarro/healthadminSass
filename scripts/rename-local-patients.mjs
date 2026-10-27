// Rename only the ten known synthetic fixture records, without reseeding the database.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { localPatientNames } from './local-patient-names.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(repo, 'local-data', 'escenarios-integrales');
const flag = process.argv.indexOf('--target');
const target = flag === -1 ? 'ide' : process.argv[flag + 1];
assert.ok(['ide', 'docker', 'both'].includes(target), 'Usá --target ide|docker|both y --apply para aplicar. Sin --apply solo verifica.');
const apply = process.argv.includes('--apply');
const fixture = JSON.parse(await readFile(path.join(directory, 'escenarios.json'), 'utf8'));
const definitions = {
  ide: { container: 'salud-api-local-postgres-1', project: 'salud-api-local', root: 'salud-api' },
  docker: { container: 'salud-local-postgres-1', project: 'salud-local', root: '.' },
};
const selected = target === 'both' ? Object.entries(definitions) : [[target, definitions[target]]];
assert.equal(localPatientNames.length, 10);
assert.equal(new Set(localPatientNames.map(p => `${p.firstName} ${p.lastName}`)).size, 10);
function command(args, input) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8', cwd: repo, timeout: 30000, windowsHide: true });
  assert.equal(result.status, 0, result.error?.message || result.stderr || 'Docker no pudo completar la operación.');
  return result.stdout.trim();
}
function sqlFor(key, update) {
  const data = fixture.targets[key];
  assert.ok(data, 'No existe el manifiesto local para ' + key);
  const rows = localPatientNames.map(p => {
    const professional = data.professionals[p.professionalKey];
    const person = fixture.people.find(person => person.key === p.professionalKey);
    assert.ok(professional && person);
    return { number: p.number, tenant: professional.entityId, professional: professional.id, account: data.accounts[p.professionalKey],
      first_patient: professional.patientId, old_first: `Paciente ${p.number}`, old_last: `Prueba de ${person.name}`,
      first_name: p.firstName, last_name: p.lastName };
  });
  const payload = JSON.stringify(rows);
  assert.ok(!payload.includes('$names$'));
  return `\\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '20s';
SET LOCAL search_path = salud,pg_catalog;
CREATE TEMP TABLE rename_input ON COMMIT DROP AS SELECT * FROM jsonb_to_recordset($names$${payload}$names$::jsonb)
 AS i(number integer,tenant uuid,professional uuid,account uuid,first_patient uuid,old_first text,old_last text,first_name text,last_name text);
-- Require the exact fixture identity, tenant and patient/professional number, then lock only those records.
CREATE TEMP TABLE rename_matches ON COMMIT DROP AS
 SELECT p.id,p.tenant_id,pp.id link_id,pp.numero_visible,pp.profesional_entidad_id,
 p.nombres previous_first,p.apellidos previous_last,i.first_name,i.last_name,i.old_first,i.old_last,i.first_patient
 FROM rename_input i JOIN profesional_entidad pe ON pe.id=i.professional AND pe.tenant_id=i.tenant
 JOIN profesional_global pg ON pg.id=pe.profesional_id AND pg.cuenta_id=i.account
 JOIN paciente_profesional pp ON pp.profesional_entidad_id=pe.id AND pp.tenant_id=pe.tenant_id AND pp.numero_visible=i.number
 JOIN paciente p ON p.id=pp.paciente_id AND p.tenant_id=pp.tenant_id
 FOR UPDATE OF p;
DO $check$
BEGIN
 IF current_database()<>'salud' OR (SELECT count(*) FROM rename_matches)<>10 OR
 (SELECT count(DISTINCT id) FROM rename_matches)<>10 THEN RAISE EXCEPTION 'Los diez pacientes no coinciden con el manifiesto local'; END IF;
 IF EXISTS(SELECT 1 FROM rename_matches WHERE numero_visible=1 AND id<>first_patient) THEN
 RAISE EXCEPTION 'Cambió la identidad del paciente de prueba'; END IF;
 IF EXISTS(SELECT 1 FROM rename_matches WHERE (previous_first,previous_last)<>(old_first,old_last)
 AND (previous_first,previous_last)<>(first_name,last_name)) THEN
 RAISE EXCEPTION 'Hay nombres editados manualmente: se conservan sin modificar'; END IF;
END $check$;
CREATE TEMP TABLE rename_before ON COMMIT DROP AS SELECT
 (SELECT md5(jsonb_agg(to_jsonb(p)-'nombres'-'apellidos' ORDER BY p.id)::text) FROM paciente p) patient_fields,
 (SELECT md5(jsonb_agg(to_jsonb(pp) ORDER BY pp.id)::text) FROM paciente_profesional pp) links,
 (SELECT md5(jsonb_agg(to_jsonb(p) ORDER BY p.id)::text) FROM paciente p WHERE NOT EXISTS(SELECT 1 FROM rename_matches m WHERE m.id=p.id AND m.tenant_id=p.tenant_id)) other_patients;
${update ? `UPDATE paciente p SET nombres=m.first_name,apellidos=m.last_name FROM rename_matches m
 WHERE p.id=m.id AND p.tenant_id=m.tenant_id AND (p.nombres,p.apellidos) IS DISTINCT FROM (m.first_name,m.last_name);` : ''}
DO $unchanged$
BEGIN
 ${update ? `IF EXISTS(SELECT 1 FROM rename_matches m JOIN paciente p ON p.id=m.id AND p.tenant_id=m.tenant_id
 WHERE (p.nombres,p.apellidos) IS DISTINCT FROM (m.first_name,m.last_name)) THEN
 RAISE EXCEPTION 'No se aplicaron todos los nombres ficticios'; END IF;` : ''}
 IF EXISTS(SELECT 1 FROM rename_before b WHERE
 b.patient_fields IS DISTINCT FROM (SELECT md5(jsonb_agg(to_jsonb(p)-'nombres'-'apellidos' ORDER BY p.id)::text) FROM paciente p)
 OR b.links IS DISTINCT FROM (SELECT md5(jsonb_agg(to_jsonb(pp) ORDER BY pp.id)::text) FROM paciente_profesional pp)
 OR b.other_patients IS DISTINCT FROM (SELECT md5(jsonb_agg(to_jsonb(p) ORDER BY p.id)::text) FROM paciente p WHERE NOT EXISTS(SELECT 1 FROM rename_matches m WHERE m.id=p.id AND m.tenant_id=p.tenant_id))) THEN
 RAISE EXCEPTION 'La actualización alteró campos o relaciones fuera de alcance'; END IF;
END $unchanged$;
SELECT jsonb_build_object('patients',(SELECT jsonb_agg(jsonb_build_object(
 'id',id,'tenantId',tenant_id,'professionalId',profesional_entidad_id,'number',numero_visible,
 'previousFirstName',previous_first,'previousLastName',previous_last,'firstName',first_name,'lastName',last_name) ORDER BY first_name) FROM rename_matches),
 'patientFieldsPreserved',true,'linksAndNumbersPreserved',true,'otherPatientsPreserved',true);
${update ? 'COMMIT' : 'ROLLBACK'};
`;
}
const runSql = (definition, sql) => JSON.parse(command(['exec', '-i', definition.container, 'psql', '-X', '-qAt', '-U', 'postgres', '-d', 'salud', '-v', 'ON_ERROR_STOP=1'], sql));
const results = {};
// Check every destination before performing any write.
for (const [key, definition] of selected) {
  const info = JSON.parse(command(['inspect', definition.container]))[0];
  assert.equal(info.State.Running, true);
  assert.equal(info.Config.Labels['com.docker.compose.project'], definition.project);
  assert.equal(path.resolve(info.Config.Labels['com.docker.compose.project.working_dir']).toLowerCase(), path.resolve(repo, definition.root).toLowerCase());
  assert.equal(fixture.targets[key]?.container, definition.container);
  results[key] = runSql(definition, sqlFor(key, false));
  console.log(`Verificado ${key}: 10 pacientes ficticios identificados; vínculos y números conservados.`);
}
if (apply) {
  const backup = path.join(directory, `nombres-pacientes-antes-${new Date().toISOString().replaceAll(':', '-')}.json`);
  await writeFile(backup, JSON.stringify({ capturedAt: new Date().toISOString(), targets: results }, null, 2), 'utf8');
  for (const [key, definition] of selected) {
    results[key] = runSql(definition, sqlFor(key, true));
    console.log(`Actualizado ${key}: nombres ficticios aplicados sin regenerar registros.`);
  }
  await writeFile(path.join(directory, 'nombres-pacientes.json'), JSON.stringify({ updatedAt: new Date().toISOString(), targets: results }, null, 2), 'utf8');
}
