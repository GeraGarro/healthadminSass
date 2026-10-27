// Destructive, explicitly selected LOCAL fixtures. Node >= 22, Docker and JDK 21.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { localPatientNameRows, localPatientInsertSql } from './local-patient-names.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
const dir = path.join(repo, 'local-data', 'escenarios-integrales');
const target = process.argv[process.argv.indexOf('--reset') + 1];
assert.ok(process.argv.includes('--reset') && ['ide', 'docker', 'both'].includes(target),
  'Uso: node scripts/prepare-local-scenarios.mjs --reset ide|docker|both. VACÍA salud antes de cargar.');
const targets = {
  ide: { container: 'salud-api-local-postgres-1', project: 'salud-api-local', env: 'salud-api/.env' },
  docker: { container: 'salud-local-postgres-1', project: 'salud-local', env: '.env' },
};
const selected = target === 'both' ? Object.entries(targets) : [[target, targets[target]]];
function command(executable, args, input) {
  const r = spawnSync(executable, args, { input, encoding: 'utf8', cwd: repo, timeout: 120000, windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  assert.equal(r.status, 0, `${path.basename(executable)} falló: ${r.error?.message || r.stderr || 'sin diagnóstico'}`);
  return r.stdout.trim();
}
const envs = new Map();
for (const [key, t] of selected) {
  const info = JSON.parse(command('docker', ['inspect', t.container]))[0];
  assert.equal(info.Config.Labels['com.docker.compose.project'], t.project);
  const source = info.Config.Labels['com.docker.compose.project.working_dir'];
  assert.equal(path.resolve(source).toLowerCase(), path.resolve(repo, key === 'ide' ? 'salud-api' : '.').toLowerCase());
  assert.equal(info.State.Running, true);
  const database = command('docker', ['exec', t.container, 'psql', '-X', '-U', 'postgres', '-d', 'salud', '-At', '-v', 'ON_ERROR_STOP=1', '-c',
    "SELECT current_database() || '|' || count(*) FROM salud.flyway_schema_history WHERE success; SELECT count(*) FROM salud.permiso;"]);
  assert.match(database, /^salud\|10\r?\n20$/);
  envs.set(key, await readFile(path.join(repo, t.env), 'utf8'));
}
await mkdir(dir, { recursive: true });
const people = [
  { key: 'admin', name: 'Administración institucional local', email: 'admin@demo.test', profile: 'Soporte y administración institucional', entity: 'institucion' },
  { key: 'solo', name: 'Valentina Sola', email: 'profesional.solo@salud.test', profile: '1. Profesional independiente sin secretaria', entity: 'solo', registration: 'LOCAL-001' },
  { key: 'acompanado', name: 'Martín Acompañado', email: 'profesional.consecretaria@salud.test', profile: '2. Profesional independiente con secretaria', entity: 'acompanado', registration: 'LOCAL-002' },
  { key: 'secretaria_ind', name: 'Lucía Secretaría Independiente', email: 'secretaria.independiente@salud.test', profile: '3. Secretaria de profesional independiente', entity: 'acompanado' },
  { key: 'institucional1', name: 'Camila Institucional Uno', email: 'profesional1.institucion@salud.test', profile: '4. Profesional institucional', entity: 'institucion', registration: 'LOCAL-003' },
  { key: 'institucional2', name: 'Diego Institucional Dos', email: 'profesional2.institucion@salud.test', profile: '4. Profesional institucional', entity: 'institucion', registration: 'LOCAL-004' },
  { key: 'institucional3', name: 'Elena Institucional Tres', email: 'profesional3.institucion@salud.test', profile: '4. Profesional institucional sin delegación a secretaría', entity: 'institucion', registration: 'LOCAL-005' },
  { key: 'secretaria1', name: 'Ana Secretaría Institucional', email: 'secretaria1.institucion@salud.test', profile: '5. Secretaria institucional (profesionales 1 y 2)', entity: 'institucion' },
  { key: 'secretaria2', name: 'Brenda Secretaría Institucional', email: 'secretaria2.institucion@salud.test', profile: '5. Secretaria institucional (profesionales 1 y 2)', entity: 'institucion' },
].map(p => ({ ...p, password: 'Local!' + randomBytes(12).toString('base64url') }));

// Hash with the project's own Spring library. Passwords travel through stdin, never arguments/logs.
const cryptoRoot = path.join(homedir(), '.m2', 'repository', 'org', 'springframework', 'security', 'spring-security-crypto');
const versions = (await readdir(cryptoRoot)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
const cryptoJar = path.join(cryptoRoot, versions[0], `spring-security-crypto-${versions[0]}.jar`);
const helper = path.join(dir, 'LocalPasswordHashes.java');
await writeFile(helper, `import java.io.*;
import org.springframework.security.crypto.bcrypt.BCrypt;
class LocalPasswordHashes {
  public static void main(String[] args) throws Exception {
    var r = new BufferedReader(new InputStreamReader(System.in));
    for (String line; (line = r.readLine()) != null;) System.out.println("{bcrypt}" + BCrypt.hashpw(line, BCrypt.gensalt(10)));
  }
}
`, 'utf8');
const java = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : 'java';
const hashes = command(java, ['--class-path', cryptoJar, helper], people.map(p => p.password).join('\n') + '\n').split(/\r?\n/);
assert.equal(hashes.length, people.length);
const entities = [
  { key: 'solo', name: 'Consultorio independiente · Valentina Sola', type: 'INDEPENDIENTE', administrator: 'solo' },
  { key: 'acompanado', name: 'Consultorio con secretaría · Martín Acompañado', type: 'INDEPENDIENTE', administrator: 'acompanado' },
  { key: 'institucion', name: 'Institución Integral Local', type: 'CLINICA', administrator: 'admin' },
];
const fixture = { people: people.map(({ password, ...p }, i) => ({ ...p, hash: hashes[i] })), entities, patients: localPatientNameRows };
const fixtureJson = JSON.stringify(fixture);
assert.ok(!fixtureJson.includes('$fixture$'));
const sql = `\\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '15s';
SET LOCAL statement_timeout = '90s';
SET LOCAL search_path = salud, pg_catalog;
-- Keep only migrations and the 20 static permission definitions. No user/business data survives.
DO $reset$
DECLARE tables text;
BEGIN
 IF current_database() <> 'salud' THEN RAISE EXCEPTION 'Solo BD salud'; END IF;
 SELECT string_agg(format('%I.%I',schemaname,tablename),', ' ORDER BY tablename) INTO tables
 FROM pg_tables WHERE schemaname='salud' AND tablename NOT IN ('flyway_schema_history','permiso');
 EXECUTE 'TRUNCATE TABLE ' || tables || ' RESTART IDENTITY';
END $reset$;
DO $empty$
DECLARE t record; n bigint;
BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='salud' AND tablename NOT IN ('flyway_schema_history','permiso') LOOP
  EXECUTE format('SELECT count(*) FROM salud.%I',t.tablename) INTO n;
  IF n <> 0 THEN RAISE EXCEPTION 'Tabla sin limpiar: %',t.tablename; END IF;
 END LOOP;
END $empty$;
CREATE TEMP TABLE fixture_data ON COMMIT DROP AS SELECT $fixture$${fixtureJson}$fixture$::jsonb AS data;
CREATE TEMP TABLE fixture_accounts ON COMMIT DROP AS
 SELECT p.*,uuidv7() account_id FROM fixture_data,jsonb_to_recordset(data->'people')
 AS p(key text,name text,email text,profile text,entity text,registration text,hash text);
INSERT INTO cuenta(id,nombre,email_acceso,email_verificado_en,estado,creada_en)
 SELECT account_id,name,email,now(),'ACTIVA',now() FROM fixture_accounts;
INSERT INTO credencial_local(cuenta_id,hash_contrasena,algoritmo_version,actualizada_en)
 SELECT account_id,hash,'bcrypt',now() FROM fixture_accounts;
INSERT INTO facultad_plataforma(cuenta_id,permiso_id,otorgante_id,desde)
 SELECT a.account_id,p.id,a.account_id,now() FROM fixture_accounts a CROSS JOIN permiso p WHERE a.key='admin' AND p.codigo='entities:manage';
CREATE TEMP TABLE fixture_entities ON COMMIT DROP AS
 SELECT e.*,uuidv7() entity_id,uuidv7() branch_id FROM fixture_data,jsonb_to_recordset(data->'entities')
 AS e(key text,name text,type text,administrator text);
INSERT INTO entidad(id,tipo,nombre,zona_horaria,estado,creada_en)
 SELECT entity_id,type,name,'America/Argentina/Buenos_Aires','ACTIVA',now() FROM fixture_entities;
INSERT INTO sede(tenant_id,id,nombre,direccion,zona_horaria,estado)
 SELECT entity_id,branch_id,'Sede local de pruebas','Domicilio ficticio','America/Argentina/Buenos_Aires','ACTIVA' FROM fixture_entities;
CREATE TEMP TABLE fixture_members ON COMMIT DROP AS
 SELECT a.key,a.account_id,e.entity_id,uuidv7() membership_id FROM fixture_accounts a JOIN fixture_entities e ON e.key=a.entity;
INSERT INTO membresia(tenant_id,id,cuenta_id,desde,estado)
 SELECT entity_id,membership_id,account_id,now(),'ACTIVA' FROM fixture_members;
INSERT INTO membresia_permiso(tenant_id,membresia_id,permiso_id,otorgante_id,desde)
 SELECT e.entity_id,m.membership_id,p.id,a.account_id,now() FROM fixture_entities e
 JOIN fixture_members m ON m.key=e.administrator JOIN fixture_accounts a ON a.key=e.administrator CROSS JOIN permiso p
 WHERE p.codigo IN ('members:manage','patients:manage','admissions:manage','catalog:manage','professionals:manage','coverage:manage','policy:manage','audit:read','notifications:manage');
CREATE TEMP TABLE fixture_professionals ON COMMIT DROP AS
 SELECT a.key,a.account_id,a.name,a.registration,m.entity_id,m.membership_id,e.branch_id,
 uuidv7() global_id,uuidv7() professional_id,uuidv7() agenda_id
 FROM fixture_accounts a JOIN fixture_members m ON m.key=a.key JOIN fixture_entities e ON e.entity_id=m.entity_id WHERE a.registration IS NOT NULL;
INSERT INTO profesional_global(id,cuenta_id,nombre_referencia,matricula_referencia,estado)
 SELECT global_id,account_id,name,registration,'ACTIVO' FROM fixture_professionals;
INSERT INTO profesional_entidad(tenant_id,id,profesional_id,membresia_id,desde,estado)
 SELECT entity_id,professional_id,global_id,membership_id,now(),'ACTIVO' FROM fixture_professionals;
INSERT INTO agenda(tenant_id,id,profesional_entidad_id,sede_id,nombre,zona_horaria,estado)
 SELECT entity_id,agenda_id,professional_id,branch_id,'Agenda · '||name,'America/Argentina/Buenos_Aires','ACTIVA' FROM fixture_professionals;
INSERT INTO horario_agenda(tenant_id,agenda_id,dia_semana,hora_inicio,hora_fin,desde)
 SELECT entity_id,agenda_id,day,'08:00','20:00',(now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
 FROM fixture_professionals CROSS JOIN generate_series(1,7) day;
CREATE TEMP TABLE fixture_delegations ON COMMIT DROP AS
 SELECT p.*,m.membership_id secretary_membership_id,uuidv7() delegation_id
 FROM fixture_professionals p JOIN fixture_members m ON m.entity_id=p.entity_id
 WHERE (p.key='acompanado' AND m.key='secretaria_ind') OR (p.key IN ('institucional1','institucional2') AND m.key IN ('secretaria1','secretaria2'));
INSERT INTO delegacion_agenda(tenant_id,id,agenda_id,membresia_id,otorgante_profesional_id,desde)
 SELECT entity_id,delegation_id,agenda_id,secretary_membership_id,professional_id,now() FROM fixture_delegations;
INSERT INTO delegacion_permiso(tenant_id,delegacion_id,permiso_id)
 SELECT d.entity_id,d.delegation_id,p.id FROM fixture_delegations d CROSS JOIN permiso p
 WHERE p.codigo IN ('agenda:read','agenda:configure','booking:read','booking:create','booking:confirm','booking:cancel','booking:reschedule');
CREATE TEMP TABLE fixture_practices ON COMMIT DROP AS
 SELECT e.entity_id,p.*,uuidv7() practice_id,uuidv7() version_id
 FROM fixture_entities e CROSS JOIN (VALUES ('CONSULTA','Consulta'),('EXTRACCION','Extracción'),('LIMPIEZA','Limpieza'),('CIRUGIA','Cirugía')) p(code,name);
INSERT INTO practica(tenant_id,id,codigo_local,origen,base_inicial,estado)
 SELECT entity_id,practice_id,code,'BASE',code,'ACTIVA' FROM fixture_practices;
INSERT INTO version_practica(tenant_id,id,practica_id,numero_version,nombre,clasificacion,autor_id,creada_en)
 SELECT p.entity_id,p.version_id,p.practice_id,1,p.name,'ADMINISTRATIVA',a.account_id,now()
 FROM fixture_practices p CROSS JOIN fixture_accounts a WHERE a.key='admin';
CREATE TEMP TABLE fixture_offers ON COMMIT DROP AS
 SELECT p.entity_id,p.agenda_id,r.practice_id,r.version_id,r.code,uuidv7() offer_id,uuidv7() offer_version_id
 FROM fixture_professionals p JOIN fixture_practices r ON r.entity_id=p.entity_id;
INSERT INTO oferta(tenant_id,id,agenda_id,practica_id,estado)
 SELECT entity_id,offer_id,agenda_id,practice_id,'ACTIVA' FROM fixture_offers;
INSERT INTO version_oferta(tenant_id,id,oferta_id,version_practica_id,numero_version,duracion_min,preparacion_min,cierre_min,modalidad,portal_habilitado,gestion_personal,particular_habilitado,desde)
 SELECT entity_id,offer_version_id,offer_id,version_id,1,30,0,0,'PRESENCIAL',code='CONSULTA',code<>'CONSULTA',true,now() FROM fixture_offers;
CREATE TEMP TABLE fixture_patients ON COMMIT DROP AS
 SELECT p.*,n,uuidv7() patient_id FROM fixture_professionals p CROSS JOIN generate_series(1,2) n;
${localPatientInsertSql}
INSERT INTO contador_paciente(tenant_id,profesional_id,profesional_entidad_id,ultimo_confirmado,version)
 SELECT entity_id,global_id,professional_id,2,1 FROM fixture_professionals;
INSERT INTO paciente_profesional(tenant_id,profesional_id,profesional_entidad_id,paciente_id,numero_visible,estado,alta_en)
 SELECT entity_id,global_id,professional_id,patient_id,n,'ACTIVO',now() FROM fixture_patients;
INSERT INTO politica_operativa(tenant_id,tipo,numero_version,parametros,desde,aprobador_id)
 SELECT e.entity_id,'RESERVAS',1,'{"holdMinutes":5,"maxActive":3,"automaticClose":false,"approval":"Pruebas integrales locales"}',now(),a.account_id
 FROM fixture_entities e CROSS JOIN fixture_accounts a WHERE a.key='admin';
DO $check$
BEGIN
 IF (SELECT count(*) FROM cuenta)<>9 OR (SELECT count(*) FROM entidad)<>3 OR
 (SELECT count(*) FROM profesional_global)<>5 OR (SELECT count(*) FROM delegacion_agenda)<>5 OR
 (SELECT count(*) FROM paciente)<>10 THEN RAISE EXCEPTION 'Fixture incompleta'; END IF;
END $check$;
SELECT jsonb_build_object(
 'accounts',(SELECT jsonb_object_agg(key,account_id) FROM fixture_accounts),
 'entities',(SELECT jsonb_object_agg(key,jsonb_build_object('id',entity_id,'name',name,'type',type)) FROM fixture_entities),
 'professionals',(SELECT jsonb_object_agg(key,jsonb_build_object('id',professional_id,'agendaId',agenda_id,'entityId',entity_id,
   'offerVersionId',(SELECT offer_version_id FROM fixture_offers o WHERE o.agenda_id=p.agenda_id AND o.code='CONSULTA'),
   'patientId',(SELECT patient_id FROM fixture_patients f WHERE f.key=p.key AND n=1))) FROM fixture_professionals p));
COMMIT;
`;
await writeFile(path.join(dir, 'carga-local.sql'), sql, 'utf8');
// Save before mutation so an interrupted run still has the credentials for every created account.
const manifest = { createdAt: new Date().toISOString(), targets: {}, people, entities, status: 'prepared' };
await writeFile(path.join(dir, 'escenarios.json'), JSON.stringify(manifest, null, 2), 'utf8');
for (const [key, t] of selected) {
  const result = command('docker', ['exec', '-i', t.container, 'psql', '-X', '-qAt', '-U', 'postgres', '-d', 'salud', '-v', 'ON_ERROR_STOP=1'], sql);
  manifest.targets[key] = { container: t.container, ...JSON.parse(result) };
  await writeFile(path.join(dir, 'escenarios.json'), JSON.stringify(manifest, null, 2), 'utf8');
  let env = envs.get(key);
  for (const [name, value] of Object.entries({ DEMO_ENABLED: 'false', BOOTSTRAP_EMAIL: 'admin@demo.test', BOOTSTRAP_PASSWORD: people[0].password })) {
    const pattern = new RegExp(`^${name}=.*$`, 'm');
    env = pattern.test(env) ? env.replace(pattern, () => `${name}=${value}`) : env.trimEnd() + `\n${name}=${value}\n`;
  }
  await writeFile(path.join(repo, t.env), env, 'utf8');
  console.log(`OK ${key}: BD salud limpiada y cargada; 9 cuentas, 3 entidades, 5 profesionales, 3 secretarias y 5 delegaciones.`);
}
manifest.status = 'seeded';
await writeFile(path.join(dir, 'escenarios.json'), JSON.stringify(manifest, null, 2), 'utf8');
const credentials = [
  'SALUD - CREDENCIALES PARA PRUEBAS INTEGRALES LOCALES',
  'Fecha Argentina: ' + new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date()),
  'Web: http://127.0.0.1:4387',
  'API: http://127.0.0.1:8080',
  'Bases preparadas: ' + selected.map(([key, t]) => `${key} (${t.container}, BD salud)`).join('; '),
  'La instancia IDE publica PostgreSQL en localhost:55432. Docker completo mantiene su propia base.',
  'Usar el ingreso al servidor con correo y contraseña. Si estaba abierta la demo del navegador, salir de ella.',
  'Estas cuentas nuevas no tienen MFA enrolado; el perfil local permite el ingreso sin segundo factor.',
  'Los datos anteriores fueron eliminados; se conservaron esquema, migraciones y catálogo técnico de permisos.',
  '5 perfiles, representados por 8 cuentas operativas + 1 cuenta administrativa de soporte.',
  '',
  ...people.flatMap(p => [p.profile, 'Nombre: ' + p.name, 'Correo: ' + p.email, 'Contraseña: ' + p.password,
    'Entidad: ' + entities.find(e => e.key === p.entity).name, '']),
  'ALCANCE DE SECRETARÍA',
  'Lucía: solo agenda de Martín Acompañado, dentro de su consultorio independiente.',
  'Ana y Brenda: ambas administran las agendas de Camila (profesional 1) y Diego (profesional 2).',
  'Ninguna de las dos administra ni consulta la agenda de Elena (profesional 3).',
  'Acciones delegadas: consultar/configurar agenda y crear/consultar/confirmar/cancelar/reprogramar turnos.',
  'No reciben permisos generales de fichas, membresías, admisiones, catálogo, coberturas, auditoría ni chat.',
  'Los profesionales institucionales acceden a su propia agenda. Los independientes también administran su consultorio.',
  '',
  'DATOS DE APOYO',
  '3 entidades; 5 agendas; horarios todos los días de 08:00 a 20:00, hora Argentina.',
  '2 pacientes ficticios por profesional (10 en total), vinculados exclusivamente a su profesional.',
  '4 prácticas base por entidad y por agenda, de 30 minutos, con pago particular habilitado.',
  'No hay cuentas de pacientes en esta carga. No se envían correos ni WhatsApp reales.',
  'La carga automática anterior de usuarios demo quedó desactivada en ambos .env para futuros arranques.',
  '',
  'VERIFICACIÓN',
  'Ejecutar: node scripts/verify-local-scenarios.mjs',
  'Resultado técnico sin contraseñas: local-data/escenarios-integrales/verificacion.json',
  'Este archivo contiene contraseñas locales y está excluido de Git mediante local-data/.',
  '',
].join('\r\n');
await writeFile(path.join(dir, 'credenciales-pruebas-locales.txt'), credentials, 'utf8');
console.log('Credenciales: ' + path.join(dir, 'credenciales-pruebas-locales.txt'));
