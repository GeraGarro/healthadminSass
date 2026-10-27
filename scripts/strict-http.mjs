import assert from 'node:assert/strict';
import {createHmac,randomUUID} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';
const base='http://127.0.0.1:18080',password='integration-test-only-password';
const checks=[];
function totp(offset=0){const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)+offset));const h=createHmac('sha1',Buffer.from('48656c6c6f21deadbeef','hex')).update(b).digest(),o=h.at(-1)&15;return String((h.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0');}
function client(){
  const cookies=new Map();let csrf='';
  return async(path,method='GET',body,headers={},status=200)=>{
    const r=await fetch(base+path,{method,headers:{Accept:'application/json',Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; '),...(method!=='GET'?{'X-CSRF-TOKEN':csrf}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
    for(const value of r.headers.getSetCookie()){const part=value.split(';')[0],i=part.indexOf('=');cookies.set(part.slice(0,i),part.slice(i+1));}
    const text=await r.text();let data;try{data=text?JSON.parse(text):undefined;}catch{data=text;}
    assert.equal(r.status,status,method+' '+path+' '+JSON.stringify(data));
    if(path.endsWith('/csrf'))csrf=data.token;
    return {data,headers:r.headers};
  };
}
const anonymous=client();const health=await anonymous('/actuator/health');
assert.equal(health.headers.get('X-Salud-Test-Fixture'),'disposable-postgres-mfa','Solo se ejecuta contra StrictTestApplication, nunca contra una base externa.');
const run=async(name,fn)=>{await fn();checks.push(name);console.log('OK '+name);};
async function staff(email){
  const c=client();await c('/api/v1/auth/csrf');await c('/api/v1/auth/login','POST',{email,password});await c('/api/v1/auth/csrf');
  const me=(await c('/api/v1/auth/me')).data;assert.ok(me.entities.length);const root='/api/v1/entities/'+me.entities[0].id;
  await c(root+'/workspace','GET',undefined,{},403);
  // A second isolated run in the same 30-second period may have consumed the current code.
  const code=totp();try{await c('/api/v1/auth/mfa/verify','POST',{code});}catch(e){if(!String(e).includes('Código inválido'))throw e;await c('/api/v1/auth/mfa/verify','POST',{code:totp(1)});}
  return {c,root};
}
await run('HTTP exige sesión y CSRF',async()=>{await anonymous('/api/v1/entities/00000000-0000-0000-0000-000000000000/workspace','GET',undefined,{},401);await anonymous('/api/v1/auth/login','POST',{email:'secretaria@demo.test',password},{},403);});
const secretary=await staff('secretaria@demo.test'),professional=await staff('profesional@demo.test');
await run('MFA obligatorio y facultades diferenciadas',async()=>{const s=(await secretary.c(secretary.root+'/workspace')).data,p=(await professional.c(professional.root+'/workspace')).data;assert.ok(!s.permissions.includes('patients:manage'));assert.equal(s.agendas[0].titular,false);assert.equal(p.agendas[0].titular,true);});
const {c,root}=secretary,workspace=(await c(root+'/workspace')).data,agenda=workspace.agendas[0];
const patients=(await c(root+'/workspace/agendas/'+agenda.id+'/booking-patients')).data;
const patient=patients.items[0],offers=(await c(root+'/workspace/lists/offers?agendaId='+agenda.id)).data.items;
const offer=offers.find(o=>o.particular_habilitado);assert.ok(patient&&offer);
await run('Secretaría coordina sin acceder a la ficha completa',async()=>{assert.deepEqual(Object.keys(patient).sort(),['id','nombres','apellidos','numero_visible'].sort());await c(root+'/workspace/directory','GET',undefined,{},403);await c(root+'/patients/'+patient.id,'GET',undefined,{},403);});
const date=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
const available=(await c(root+'/availability?offerVersionId='+offer.id+'&patientId='+patient.id+'&date='+date)).data.starts;assert.ok(available.length>2);
let appointment;
try{
  await run('Pre-reserva y registro idempotentes con asistencia pendiente',async()=>{
    const held=(await c(root+'/holds','POST',{patientId:patient.id,offerVersionId:offer.id,start:available[1],affiliationId:null,authorizationId:null},{'Idempotency-Key':randomUUID()})).data;
    const key=randomUUID(),body={holdId:held.id};appointment=(await c(root+'/appointments','POST',body,{'Idempotency-Key':key})).data;
    assert.equal(appointment.estado_asistencia,'PENDIENTE');assert.equal(appointment.estado_turno,'REGISTRADO');assert.equal((await c(root+'/appointments','POST',body,{'Idempotency-Key':key})).data.id,appointment.id);
  });
  await run('Confirmación del profesional y rechazo de una versión antigua',async()=>{
    await professional.c(professional.root+'/appointments/'+appointment.id+'/confirm','POST',undefined,{'If-Match':'"'+appointment.version_concurrencia+'"'});
    await c(root+'/appointments/'+appointment.id+'/cancel','POST',{reason:'Pantalla desactualizada'},{'If-Match':'"'+appointment.version_concurrencia+'"'},412);
    appointment=(await c(root+'/appointments/'+appointment.id)).data;assert.equal(appointment.estado_asistencia,'CONFIRMADA');
  });
  await run('Reprogramación conserva el turno y restablece asistencia pendiente',async()=>{
    const key=randomUUID(),headers={'If-Match':'"'+appointment.version_concurrencia+'"','Idempotency-Key':key},body={patientId:patient.id,offerVersionId:offer.id,start:available[2],affiliationId:null,authorizationId:null};
    const moved=(await c(root+'/appointments/'+appointment.id+'/reschedule','POST',body,headers)).data;assert.equal(moved.id,appointment.id);assert.equal(moved.estado_asistencia,'PENDIENTE');assert.equal(moved.numero_version,2);
    assert.equal((await c(root+'/appointments/'+appointment.id+'/reschedule','POST',body,headers)).data.id,moved.id);appointment=moved;
  });
  await run('Agenda por rango entrega nombres, modalidad y versión',async()=>{const until=new Date(Date.parse(date)+86400000).toISOString().slice(0,10),page=(await c(root+'/workspace/appointments?agendaId='+agenda.id+'&from='+date+'&until='+until)).data;assert.ok(page.items.some(t=>t.id===appointment.id&&t.nombres&&t.version_concurrencia===appointment.version_concurrencia&&t.modalidad_elegida==='PARTICULAR'));});
}finally{
  if(appointment){const latest=(await c(root+'/appointments/'+appointment.id)).data;await c(root+'/appointments/'+appointment.id+'/cancel','POST',{reason:'Fin de prueba HTTP sintética'},{'If-Match':'"'+latest.version_concurrencia+'"'});}
}
await run('Cierre de sesión invalida las lecturas posteriores',async()=>{await c('/api/v1/auth/logout','POST');await c(root+'/workspace','GET',undefined,{},401);});
await mkdir(new URL('../tmp/',import.meta.url),{recursive:true});
await writeFile(new URL('../tmp/strict-http-result.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),fixture:base,passed:checks.length,checks},null,2));
console.log(checks.length+' recorridos HTTP aprobados con Spring, MFA y PostgreSQL real.');
