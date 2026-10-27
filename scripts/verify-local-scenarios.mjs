// HTTP acceptance against the running local server. Does not reset the database.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const directory = new URL('../local-data/escenarios-integrales/', import.meta.url);
const fixture = JSON.parse(await readFile(new URL('escenarios.json', directory), 'utf8'));
const target = process.env.LOCAL_SCENARIOS_TARGET || 'ide';
const data = fixture.targets[target];
assert.ok(data, 'No hay fixture para el destino ' + target);
const origin = new URL(process.env.LOCAL_BASE_URL || 'http://127.0.0.1:4387');
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname));
assert.equal(origin.protocol, 'http:');
const checks = [];
const run = async (name, fn) => { await fn(); checks.push(name); console.log('OK ' + name); };
function client() {
  const cookies = new Map();
  let csrf = '';
  return async (route, method = 'GET', body, expected = 200, headers = {}) => {
    const response = await fetch(new URL(route, origin), {
      method, headers: { Accept: 'application/json', Cookie: [...cookies].map(([k,v]) => `${k}=${v}`).join('; '),
        ...(method === 'GET' ? {} : { 'X-CSRF-TOKEN': csrf }),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000),
    });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';')[0], i = pair.indexOf('=');
      cookies.set(pair.slice(0,i), pair.slice(i+1));
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const parsed = response.headers.get('content-type')?.includes('json') && bytes.length ? JSON.parse(bytes.toString()) : undefined;
    assert.equal(response.status, expected, `${method} ${route}: HTTP ${response.status}; esperado ${expected}`);
    if (route.endsWith('/csrf')) csrf = parsed.token;
    return { data: parsed, bytes, headers: response.headers };
  };
}
const clients = {};
const root = entity => '/api/v1/entities/' + data.entities[entity].id;
const day = offset => {
  const d = new Date(Date.now() + offset * 86400000);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const get = t => parts.find(p => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
};
const from = day(7), until = day(8);
await run('Web, API y protección sin sesión', async () => {
  const page = await fetch(new URL('/agenda', origin));
  assert.equal(page.status,200); assert.match(await page.text(), /<app-root/);
  await client()('/api/v1/auth/me','GET',undefined,401);
});
await run('Ingreso real de las 9 cuentas y entidades correctas', async () => {
  for (const person of fixture.people) {
    const c = client(); await c('/api/v1/auth/csrf');
    await c('/api/v1/auth/login','POST',{ email: person.email, password: person.password });
    await c('/api/v1/auth/csrf');
    const me = (await c('/api/v1/auth/me')).data;
    assert.equal(me.account.id, data.accounts[person.key], 'La API usa una base distinta de la fixture seleccionada.');
    assert.deepEqual(me.entities.map(e => e.id), [data.entities[person.entity].id]);
    assert.equal(me.entities[0].tipo, data.entities[person.entity].type);
    clients[person.key] = c;
  }
});
await run('Perfil local y entrega simulada', async () => {
  const status = (await clients.admin('/api/v1/dev/status')).data;
  assert.equal(status.environment, 'local'); assert.equal(status.simulatedDelivery, true);
  // The IDE process may still have DEMO_ENABLED=true in memory until its next restart.
});
const expectedAgendas = {
  admin: [], solo: ['solo'], acompanado: ['acompanado'], secretaria_ind: ['acompanado'],
  institucional1: ['institucional1'], institucional2: ['institucional2'], institucional3: ['institucional3'],
  secretaria1: ['institucional1','institucional2'], secretaria2: ['institucional1','institucional2'],
};
await run('5 perfiles con agendas y facultades efectivas exactas', async () => {
  for (const person of fixture.people) {
    const workspace = (await clients[person.key](root(person.entity) + '/workspace')).data;
    assert.deepEqual(workspace.agendas.map(a => a.id).sort(), expectedAgendas[person.key].map(k => data.professionals[k].agendaId).sort(), person.email);
    for (const agenda of workspace.agendas) {
      assert.equal(agenda.titular, Boolean(person.registration));
      assert.deepEqual(agenda.permissions.sort(), ['agenda:read','agenda:configure','booking:read','booking:create','booking:confirm','booking:cancel','booking:reschedule'].sort());
    }
    if (person.key.startsWith('secretaria')) {
      assert.deepEqual(workspace.permissions, []); assert.deepEqual(workspace.professionals, []);
      await clients[person.key](root(person.entity) + '/workspace/directory','GET',undefined,403);
      await clients[person.key](root(person.entity) + '/members','GET',undefined,403);
    }
  }
});
await run('Las dos secretarias institucionales reciben 403 para el profesional 3', async () => {
  const forbidden = data.professionals.institucional3, r = root('institucion');
  for (const key of ['secretaria1','secretaria2']) {
    const c = clients[key];
    await c(`${r}/workspace/appointments?agendaId=${forbidden.agendaId}&from=${from}&until=${until}`,'GET',undefined,403);
    await c(`${r}/workspace/lists/hours?agendaId=${forbidden.agendaId}`,'GET',undefined,403);
    await c(`${r}/workspace/lists/offers?agendaId=${forbidden.agendaId}`,'GET',undefined,403);
    await c(`${r}/workspace/agendas/${forbidden.agendaId}/booking-patients`,'GET',undefined,403);
    await c(`${r}/reports/appointments?agendaId=${forbidden.agendaId}&from=${from}&until=${from}&format=csv`,'GET',undefined,403);
    await c(`${r}/availability?offerVersionId=${forbidden.offerVersionId}&patientId=${forbidden.patientId}&date=${from}`,'GET',undefined,403);
    await c(`${r}/agendas/${forbidden.agendaId}/hours`,'POST',{ day:1,start:'06:00:00',end:'07:00:00',from },403);
    await c(`${r}/holds`,'POST',{ patientId:forbidden.patientId,offerVersionId:forbidden.offerVersionId,start:`${from}T11:00:00Z`,affiliationId:null,authorizationId:null },403,{'Idempotency-Key':randomUUID()});
    await c(`${r}/patients/${forbidden.patientId}`,'GET',undefined,403);
  }
});
await run('Aislamiento entre entidades y entre profesionales institucionales', async () => {
  await clients.secretaria1(root('solo')+'/workspace','GET',undefined,403);
  await clients.secretaria_ind(root('institucion')+'/workspace','GET',undefined,403);
  await clients.solo(root('acompanado')+'/workspace','GET',undefined,403);
  const p = data.professionals.institucional2;
  await clients.institucional1(`${root('institucion')}/workspace/appointments?agendaId=${p.agendaId}&from=${from}&until=${until}`,'GET',undefined,403);
});
// Exercise every agenda, plus each institution secretary on BOTH delegated agendas.
const flows = [ ['solo','solo'], ['secretaria_ind','acompanado'], ['institucional3','institucional3'],
  ['secretaria1','institucional1'], ['secretaria1','institucional2'], ['secretaria2','institucional1'], ['secretaria2','institucional2'] ];
for (const [actor, professional] of flows) {
  await run(`${actor}: crear, confirmar, reprogramar y cancelar turno de ${professional}`, async () => {
    const p = data.professionals[professional], person = fixture.people.find(x => x.key === professional);
    const c = clients[actor], r = root(person.entity);
    const candidates = (await c(`${r}/workspace/agendas/${p.agendaId}/booking-patients`)).data.items;
    assert.equal(candidates.length,2); assert.ok(candidates.some(x => x.id === p.patientId));
    const slots = (await c(`${r}/availability?offerVersionId=${p.offerVersionId}&patientId=${p.patientId}&date=${from}`)).data.starts;
    assert.ok(slots.length>2);
    const body = {patientId:p.patientId,offerVersionId:p.offerVersionId,start:slots[0],affiliationId:null,authorizationId:null};
    let appointment;
    try {
      const hold = (await c(r+'/holds','POST',body,200,{'Idempotency-Key':randomUUID()})).data;
      const idempotency = randomUUID();
      appointment = (await c(r+'/appointments','POST',{holdId:hold.id},200,{'Idempotency-Key':idempotency})).data;
      assert.equal(appointment.estado_asistencia,'PENDIENTE');
      assert.equal((await c(r+'/appointments','POST',{holdId:hold.id},200,{'Idempotency-Key':idempotency})).data.id,appointment.id);
      await c(`${r}/appointments/${appointment.id}/confirm`,'POST',undefined,200,{'If-Match':`"${appointment.version_concurrencia}"`});
      appointment = (await c(`${r}/appointments/${appointment.id}`)).data;
      assert.equal(appointment.estado_asistencia,'CONFIRMADA');
      appointment = (await c(`${r}/appointments/${appointment.id}/reschedule`,'POST',{...body,start:slots[2]},200,{'If-Match':`"${appointment.version_concurrencia}"`,'Idempotency-Key':randomUUID()})).data;
      assert.equal(appointment.estado_asistencia,'PENDIENTE'); assert.equal(appointment.numero_version,2);
      const csv = await c(`${r}/reports/appointments?agendaId=${p.agendaId}&from=${from}&until=${from}&format=csv`);
      assert.ok(csv.bytes.length>20);
      if (professional === 'institucional3') {
        for (const secretary of ['secretaria1','secretaria2']) {
          await clients[secretary](`${r}/appointments/${appointment.id}`,'GET',undefined,403);
          await clients[secretary](`${r}/appointments/${appointment.id}/confirm`,'POST',undefined,403,{'If-Match':`"${appointment.version_concurrencia}"`});
          await clients[secretary](`${r}/appointments/${appointment.id}/cancel`,'POST',{reason:'Intento sin permiso'},403,{'If-Match':`"${appointment.version_concurrencia}"`});
          await clients[secretary](`${r}/appointments/${appointment.id}/reschedule`,'POST',{...body,start:slots[3]},403,{'If-Match':`"${appointment.version_concurrencia}"`,'Idempotency-Key':randomUUID()});
        }
      }
    } finally {
      if (appointment) {
        const latest = (await c(`${r}/appointments/${appointment.id}`)).data;
        await c(`${r}/appointments/${appointment.id}/cancel`,'POST',{reason:'Fin de verificación integral local'},200,{'If-Match':`"${latest.version_concurrencia}"`});
        assert.equal((await c(`${r}/appointments/${appointment.id}`)).data.estado_turno,'CANCELADO');
      }
    }
  });
}
await run('Cerrar las 9 sesiones de verificación', async () => {
  for (const c of Object.values(clients)) {
    await c('/api/v1/auth/logout','POST');
    await c('/api/v1/auth/me','GET',undefined,401);
  }
});
const result = { at:new Date().toISOString(),origin:origin.origin,target,passed:checks.length,checks,
  note:'Pruebas HTTP con sesión/CSRF reales. Se conserva historial de 7 turnos cancelados, sin turnos futuros activos. No es una prueba de carga ni de todas las pantallas.' };
await writeFile(new URL('verificacion.json',directory),JSON.stringify(result,null,2),'utf8');
console.log(`${checks.length} recorridos aprobados. Verificación: local-data/escenarios-integrales/verificacion.json`);
