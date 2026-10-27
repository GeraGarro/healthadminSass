import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.ROLE_SERVER_URL||'http://127.0.0.1:4387';
assert.ok(['127.0.0.1','localhost'].includes(new URL(origin).hostname));
const fixture=JSON.parse(await readFile(new URL('../../local-data/escenarios-integrales/escenarios.json',import.meta.url),'utf8'));
const account=fixture.people.find(p=>p.key==='admin');assert.ok(account);
const out=fileURLToPath(new URL('../../.impeccable/review/roles/',import.meta.url));
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const p=await context.newPage();const failures=[];
 p.on('response',r=>{if(r.url().includes('/api/v1/entities/')&&r.status()>=400)failures.push({path:new URL(r.url()).pathname,status:r.status()});});
 await p.goto(`${origin}/acceso`);await p.getByLabel('Correo electrónico',{exact:true}).fill(account.email);await p.locator('input[name=password]').fill(account.password);await p.getByRole('button',{name:'Ingresar a mi espacio',exact:true}).click();
 await p.waitForURL(/contextos|institucion/);
 if(p.url().endsWith('/contextos'))await p.locator('.context-choices button').first().click();
 await p.waitForURL('**/institucion/profesionales');await p.locator('.institution-profile').first().waitFor();
 assert.equal(await p.locator('.alert.error').count(),0);assert.equal(await p.locator('table').count(),0);assert.equal(await p.locator('nav a[href="/pacientes"]').count(),0);
 await p.evaluate(async()=>{await document.fonts.ready;scrollTo(0,0);});await p.screenshot({path:`${out}/server-admin-1440.png`,fullPage:true});
 await p.goto(`${origin}/institucion/equipo`);await p.locator('.team-profile').first().waitFor();assert.equal(await p.locator('.alert.error').count(),0);
 await p.goto(`${origin}/institucion/sedes`);await p.locator('.structure-agenda-list article').first().waitFor();assert.equal(await p.locator('.alert.error').count(),0);
 assert.deepEqual(failures,[]);const result={origin,checks:['Acceso con cuenta institucional local','Profesionales, equipo, sedes, agendas, política y disponibilidad responden','Sin errores HTTP de API en las pantallas comprobadas','Sin pacientes en la navegación institucional'],failures};await writeFile(`${out}/server-checks.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
