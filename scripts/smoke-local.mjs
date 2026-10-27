// Synthetic acceptance checks against the same origin used by the browser. Requires Node >= 22.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const config = Object.fromEntries((await readFile(new URL('../.env', import.meta.url), 'utf8'))
  .split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => {
    const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)];
  }));
const origin = new URL(process.env.LOCAL_BASE_URL || `http://127.0.0.1:${process.env.WEB_PORT || config.WEB_PORT || 4387}`);
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname), 'La prueba solo admite loopback.');
assert.equal(origin.protocol, 'http:');
const password = config.BOOTSTRAP_PASSWORD;
assert.ok(password && !password.includes('generate-with'), 'Ejecutá scripts/start-local.ps1 para generar .env.');
const checks = [], tag = randomUUID().slice(0, 8);
const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const date = day(7), until = day(8), now = new Date().toISOString(), future = new Date(Date.now() + 60 * 86400000).toISOString();
const run = async (name, fn) => { await fn(); checks.push(name); console.log('OK ' + name); };

function client() {
  const cookies = new Map(); let csrf = '';
  return async (path, method = 'GET', body, headers = {}, status = 200) => {
    const response = await fetch(new URL(path, origin), {
      method, headers: { Accept: 'application/json', Cookie: [...cookies].map(([k, v]) => k + '=' + v).join('; '),
        ...(method !== 'GET' ? { 'X-CSRF-TOKEN': csrf } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(45000),
    });
    for (const value of response.headers.getSetCookie()) {
      const pair = value.split(';')[0], i = pair.indexOf('='); cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const data = response.headers.get('content-type')?.includes('json') && bytes.length ? JSON.parse(bytes.toString()) : undefined;
    // Error reports intentionally omit bodies: recovery links and credentials must not enter logs.
    assert.equal(response.status, status, `${method} ${new URL(path, origin).pathname}: HTTP ${response.status}, esperado ${status}`);
    if (path.endsWith('/csrf')) csrf = data.token;
    return { data, bytes, headers: response.headers };
  };
}
async function login(email, credential = password) {
  const c = client(); await c('/api/v1/auth/csrf');
  await c('/api/v1/auth/login', 'POST', { email, password: credential });
  await c('/api/v1/auth/csrf');
  return { c, me: (await c('/api/v1/auth/me')).data };
}
const anonymous = client();
await run('SPA, rutas profundas y proxy de API sin sesión', async () => {
  const page = await fetch(new URL('/pacientes', origin)); assert.equal(page.status, 200); assert.match(await page.text(), /<app-root/);
  await anonymous('/api/v1/auth/me', 'GET', undefined, {}, 401);
  await anonymous('/api/v1/auth/login', 'POST', { email: 'admin@demo.test', password }, {}, 403);
});
const admin = await login('admin@demo.test');
const status = (await admin.c('/api/v1/dev/status')).data;
assert.deepEqual(status, { environment: 'local', demoEnabled: true, simulatedDelivery: true }, 'Se requiere perfil local, datos demo y proveedores simulados.');
const professional = await login('profesional@demo.test'), secretary = await login('secretaria@demo.test'), patient = await login('paciente@demo.test');
const tenant = admin.me.entities.find(e => e.nombre === 'Clínica de prueba local')?.id;
assert.ok(tenant, 'No se encontró la entidad de pruebas.');
const root = '/api/v1/entities/' + tenant;
const aw = (await admin.c(root + '/workspace')).data, pw = (await professional.c(root + '/workspace')).data;
const agenda = pw.agendas[0]; assert.ok(agenda);
const professionalId = agenda.profesional_entidad_id;
let appointment;
await run('Permisos efectivos y profesionales sin acceso administrativo a agendas', async () => {
  assert.equal(aw.agendas.length, 0); assert.ok(aw.professionals.some(p => p.id === professionalId));
  const sw = (await secretary.c(root + '/workspace')).data; assert.ok(sw.agendas.length); assert.equal(sw.professionals.length, 0);
  await secretary.c(root + '/workspace/directory', 'GET', undefined, {}, 403);
  await admin.c(root + '/workspace/appointments?agendaId=' + agenda.id + '&from=' + date + '&until=' + until, 'GET', undefined, {}, 403);
});
for (const resource of ['practices', 'coverages', 'notifications', 'tasks', 'admissions', 'plans', 'agreements']) {
  const page = (await admin.c(root + '/workspace/lists/' + resource)).data; assert.ok(Array.isArray(page.items));
}
let created, link, coverage, plan, affiliation, custom, offer, authorization;
await run('Ficha, actualización, vínculo y contacto persistidos', async () => {
  created = (await admin.c(root + '/patients', 'POST', { firstName: 'Prueba', lastName: 'Local ' + tag, document: null, birthDate: '1990-01-01', address: 'Domicilio ficticio' })).data;
  await admin.c(root + '/patients/' + created.id, 'PUT', { firstName: 'Prueba editada', lastName: 'Local ' + tag, document: 'FICTICIO-' + tag, birthDate: '1990-01-01', address: 'Domicilio ficticio' });
  link = (await admin.c(root + '/patients/' + created.id + '/professionals', 'POST', { professionalEntityId: professionalId })).data;
  assert.ok(link.numero_visible);
  await admin.c(root + '/patients/' + created.id + '/contacts', 'POST', { type: 'EMAIL', value: `local-${tag}@example.test`, authorizationReference: 'Prueba sintética local' });
  const detail = (await admin.c(root + '/patients/' + created.id)).data;
  assert.equal(detail.patient.nombres, 'Prueba editada'); assert.ok(detail.numbers.length);
  assert.ok((await admin.c(root + '/workspace/patients/' + created.id)).data.contacts.length);
});
await run('Catálogo, oferta versionada, cobertura, plan, afiliación y convenio', async () => {
  custom = (await admin.c(root + '/practices', 'POST', { code: 'LOCAL-' + tag, name: 'Práctica local ' + tag })).data;
  await professional.c(root + '/agendas/' + agenda.id + '/offers', 'POST', { practiceId: custom.id, durationMinutes: 20, preparationMinutes: 0, closingMinutes: 0, portalEnabled: false, privatePaymentEnabled: true });
  offer = (await professional.c(root + '/workspace/lists/offers?agendaId=' + agenda.id)).data.items.find(o => o.practica_id === custom.id); assert.ok(offer);
  coverage = (await admin.c(root + '/coverages', 'POST', { name: 'Cobertura ficticia ' + tag })).data;
  plan = (await admin.c(root + '/coverages/' + coverage.id + '/plans', 'POST', { name: 'Plan local ' + tag })).data;
  affiliation = (await admin.c(root + '/patients/' + created.id + '/affiliations', 'POST', { coverageId: coverage.id, planId: plan.id, memberNumber: 'LOCAL-' + tag, from: day(0), until: day(60), verificationReference: 'Verificación sintética' })).data;
  await admin.c(root + '/agreements', 'POST', { offerId: offer.oferta_id, coverageId: coverage.id, planId: plan.id, from: now, until: future, requiresAuthorization: true });
  authorization = (await admin.c(root + '/coverage-authorizations', 'POST', { affiliationId: affiliation.id, practiceId: custom.id, reference: 'AUT-' + tag, from: now, until: future })).data;
  const eligibility = (await secretary.c(root + '/workspace/agendas/' + agenda.id + '/booking-patients/' + created.id + '/eligibility?offerVersionId=' + offer.id + '&date=' + date)).data;
  assert.ok(eligibility.affiliations.some(a => a.id === affiliation.id)); assert.ok(eligibility.authorizations.some(a => a.id === authorization.id));
});
try {
  let slots;
  await run('Disponibilidad, pre-reserva y registro con cobertura e idempotencia', async () => {
    slots = (await secretary.c(root + '/availability?offerVersionId=' + offer.id + '&patientId=' + created.id + '&date=' + date)).data.starts;
    assert.ok(slots.length > 2);
    const body = { patientId: created.id, offerVersionId: offer.id, start: slots[0], affiliationId: affiliation.id, authorizationId: authorization.id };
    const hold = (await secretary.c(root + '/holds', 'POST', body, { 'Idempotency-Key': randomUUID() })).data;
    const key = randomUUID(); appointment = (await secretary.c(root + '/appointments', 'POST', { holdId: hold.id }, { 'Idempotency-Key': key })).data;
    assert.equal(appointment.estado_asistencia, 'PENDIENTE');
    assert.equal((await secretary.c(root + '/appointments', 'POST', { holdId: hold.id }, { 'Idempotency-Key': key })).data.id, appointment.id);
  });
  await run('Confirmación, conflicto de versión y reprogramación', async () => {
    await professional.c(root + '/appointments/' + appointment.id + '/confirm', 'POST', undefined, { 'If-Match': '"' + appointment.version_concurrencia + '"' });
    await secretary.c(root + '/appointments/' + appointment.id + '/cancel', 'POST', { reason: 'Versión antigua' }, { 'If-Match': '"' + appointment.version_concurrencia + '"' }, 412);
    appointment = (await secretary.c(root + '/appointments/' + appointment.id)).data;
    appointment = (await secretary.c(root + '/appointments/' + appointment.id + '/reschedule', 'POST', { patientId: created.id, offerVersionId: offer.id, start: slots[2], affiliationId: affiliation.id, authorizationId: authorization.id }, { 'If-Match': '"' + appointment.version_concurrencia + '"', 'Idempotency-Key': randomUUID() })).data;
    assert.equal(appointment.estado_asistencia, 'PENDIENTE'); assert.equal(appointment.numero_version, 2);
    const page = (await secretary.c(root + '/workspace/appointments?agendaId=' + agenda.id + '&from=' + date + '&until=' + until)).data;
    assert.ok(page.items.some(t => t.id === appointment.id && t.nombres === 'Prueba editada'));
  });
  await run('Descargas CSV, Excel y PDF a través del proxy', async () => {
    for (const format of ['csv', 'xlsx', 'pdf']) {
      const file = await secretary.c(root + '/reports/appointments?agendaId=' + agenda.id + '&from=' + date + '&until=' + date + '&format=' + format);
      assert.ok(file.bytes.length > 20); assert.match(file.headers.get('content-disposition'), new RegExp('turnos\\.' + format));
      if (format === 'pdf') assert.equal(file.bytes.subarray(0, 4).toString(), '%PDF');
      if (format === 'xlsx') assert.equal(file.bytes.subarray(0, 2).toString(), 'PK');
    }
  });
  await run('Ausencia, caso de reprogramación y cola de avisos', async () => {
    await professional.c(root + '/agendas/' + agenda.id + '/absences', 'POST', { start: appointment.inicio_atencion, end: appointment.fin_atencion, reason: 'Ausencia sintética ' + tag }, { 'Idempotency-Key': randomUUID() });
    const cases = (await professional.c(root + '/workspace/lists/rescheduling-cases?agendaId=' + agenda.id)).data.items;
    assert.ok(cases.some(c => c.turno_id === appointment.id));
    const tasks = (await admin.c(root + '/workspace/lists/tasks')).data.items;
    assert.ok(tasks.some(t => t.tipo === 'ABSENCE_WHATSAPP'));
  });
} finally {
  if (appointment) {
    const latest = (await secretary.c(root + '/appointments/' + appointment.id)).data;
    await secretary.c(root + '/appointments/' + appointment.id + '/cancel', 'POST', { reason: 'Fin de prueba local ' + tag }, { 'If-Match': '"' + latest.version_concurrencia + '"' });
  }
}
await run('Gestión asistida y resolución de pendientes', async () => {
  const request = (await secretary.c(root + '/management-requests', 'POST', { patientId: created.id, professionalEntityId: professionalId, practiceId: custom.id, reason: 'Gestión sintética ' + tag })).data;
  await secretary.c(root + '/management-requests/' + request.id + '/resolve?agendaId=' + agenda.id, 'POST');
  const page = (await secretary.c(root + '/workspace/lists/management-requests?agendaId=' + agenda.id)).data;
  assert.ok(page.items.some(i => i.id === request.id && i.estado === 'RESUELTA'));
});
await run('Chat humano, lecturas persistidas y aislamiento de secretaría', async () => {
  const patients = (await patient.c('/api/v1/my-patients/' + tenant)).data;
  const detail = (await patient.c(root + '/patients/' + patients[0].id)).data;
  // Patient detail exposes the stable patient-professional link ID, never inferred from names.
  const patientProfessionalId = detail.numbers.find(n => n.profesional_entidad_id === professionalId)?.id;
  assert.ok(patientProfessionalId);
  const conversation = (await patient.c(root + '/conversations', 'POST', { patientProfessionalId })).data;
  const message = (await patient.c(root + '/conversations/' + conversation.id + '/messages', 'POST', { text: 'Mensaje sintético local ' + tag })).data;
  let conversations = (await professional.c(root + '/workspace/conversations?offset=0')).data.items;
  assert.equal(conversations.find(c => c.id === conversation.id)?.unread, 1);
  await secretary.c(root + '/conversations/' + conversation.id + '/messages', 'GET', undefined, {}, 403);
  await professional.c(root + '/conversations/' + conversation.id + '/messages/' + message.id + '/read', 'POST');
  conversations = (await professional.c(root + '/workspace/conversations?offset=0')).data.items;
  assert.equal(conversations.find(c => c.id === conversation.id)?.unread, 0);
  await professional.c(root + '/conversations/' + conversation.id + '/messages', 'POST', { text: 'Respuesta sintética ' + tag });
});
await run('Notificaciones y auditoría', async () => {
  const notices = (await professional.c(root + '/workspace/lists/notifications')).data.items;
  assert.ok(notices.length); await professional.c(root + '/notifications/' + notices[0].id + '/read', 'POST');
  assert.ok((await professional.c(root + '/workspace/lists/notifications')).data.items.find(n => n.id === notices[0].id)?.leido_en);
  assert.ok((await admin.c(root + '/audit?offset=0')).data.length);
});
await run('Recuperación de cuenta ficticia y enlaces hacia el frontend', async () => {
  const email = `local-${tag}@example.test`;
  await admin.c('/api/v1/platform/accounts', 'POST', { name: 'Cuenta sintética ' + tag, email });
  let mailbox = (await admin.c('/api/v1/dev/mailbox')).data;
  const activation = new URL(mailbox.find(m => m.destination === email).link);
  assert.equal(activation.origin, origin.origin); assert.equal(activation.pathname, '/access/activate');
  const guest = client(); await guest('/api/v1/auth/csrf');
  const credential = 'Local-' + randomUUID();
  await guest('/api/v1/auth/reset', 'POST', { token: activation.searchParams.get('token'), password: credential });
  const account = await login(email, credential); assert.ok(account.me.account.id);
  await run('Representación, aprobación de acceso y revocación', async () => {
    const representation = (await admin.c(root + '/patients/' + created.id + '/representations', 'POST', {
      accountId: account.me.account.id, evidence: 'Evidencia sintética ' + tag,
      permissions: ['patient:read', 'booking:read'], until: future,
    })).data;
    const access = (await admin.c(root + '/patients/' + created.id + '/access', 'POST', {
      accountId: account.me.account.id, professionalEntityId: professionalId, agendaId: agenda.id,
      verificationReference: 'Prueba local', representationId: representation.id,
    })).data;
    await account.c(root + '/patients/' + created.id);
    await admin.c(root + '/patients/' + created.id + '/access/' + access.id, 'DELETE');
    await account.c(root + '/patients/' + created.id, 'GET', undefined, {}, 403);
    await admin.c(root + '/patients/' + created.id + '/representations/' + representation.id, 'DELETE');
  });
  await run('Admisión aprobada y solicitud rechazada', async () => {
    const body = { patient: { firstName: 'Admisión', lastName: 'Sintética ' + tag, document: null, birthDate: null, address: null }, professionalEntityId: professionalId };
    const request = (await account.c('/api/v1/admission-requests/' + tenant, 'POST', body)).data;
    const approved = (await admin.c(root + '/admissions/' + request.id + '/approve', 'POST', {
      accountId: account.me.account.id, professionalEntityId: professionalId, agendaId: null,
      verificationReference: 'Admisión de prueba', representationId: null,
    })).data;
    assert.ok(approved.patientId); await account.c(root + '/patients/' + approved.patientId);
    const rejected = (await account.c('/api/v1/admission-requests/' + tenant, 'POST', body)).data;
    await admin.c(root + '/admissions/' + rejected.id + '/reject', 'POST');
    const admissions = (await admin.c(root + '/workspace/lists/admissions')).data.items;
    assert.ok(admissions.some(i => i.id === rejected.id && i.estado === 'RECHAZADA' && typeof i.creada_en === 'string'));
  });
  await run('Membresía, delegación y revocación inmediata', async () => {
    const membership = (await admin.c(root + '/members', 'POST', { accountId: account.me.account.id, permissions: [] })).data;
    const delegation = (await professional.c(root + '/agendas/' + agenda.id + '/delegations', 'POST', {
      membershipId: membership.id, permissions: ['agenda:read', 'booking:read'],
    })).data;
    assert.ok((await account.c(root + '/workspace')).data.agendas.some(a => a.id === agenda.id));
    await professional.c(root + '/agendas/' + agenda.id + '/delegations/' + delegation.id, 'DELETE');
    assert.equal((await account.c(root + '/workspace')).data.agendas.length, 0);
    await admin.c(root + '/members/' + membership.id, 'DELETE');
  });
  await guest('/api/v1/auth/recover', 'POST', { email });
  mailbox = (await admin.c('/api/v1/dev/mailbox')).data;
  const recovery = new URL(mailbox.find(m => m.destination === email).link);
  assert.equal(recovery.origin, origin.origin); assert.equal(recovery.pathname, '/access/reset');
  await guest('/api/v1/auth/reset', 'POST', { token: recovery.searchParams.get('token'), password: credential });
});
await run('Logout invalida la sesión', async () => {
  await secretary.c('/api/v1/auth/logout', 'POST'); await secretary.c(root + '/workspace', 'GET', undefined, {}, 401);
});
await mkdir(new URL('../tmp/', import.meta.url), { recursive: true });
await writeFile(new URL('../tmp/smoke-local-result.json', import.meta.url), JSON.stringify({ at: new Date().toISOString(), origin: origin.origin, passed: checks.length, checks }, null, 2));
console.log(`${checks.length} recorridos locales aprobados. Se conservan registros sintéticos identificados con ${tag}.`);
