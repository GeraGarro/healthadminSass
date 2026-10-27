import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.ROLE_TEST_URL||'http://127.0.0.1:4392';
assert.ok(['127.0.0.1','localhost'].includes(new URL(origin).hostname));
const out=fileURLToPath(new URL('../../.impeccable/review/roles/',import.meta.url));
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const checks=[],errors=[];
async function shot(p,name){const close=p.locator('.toast button');if(await close.isVisible())await close.click();await p.evaluate(async()=>{scrollTo(0,0);await document.fonts.ready;});await p.screenshot({path:`${out}/${name}.png`,fullPage:true});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${name} desborda`);}
try{
 for(const width of [1440,1280,390]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`${origin}/acceso`);
  await p.getByRole('button',{name:'Secretaría · primer ingreso',exact:true}).click();
  await p.getByRole('button',{name:'Guardar y continuar'}).click();
  await p.getByRole('heading',{name:'Tu próxima jornada empieza acá'}).waitFor();
  const elena=p.locator('.person-profile').filter({hasText:'Dra. Elena Martínez'});
  await elena.getByRole('button',{name:'Solicitar acceso',exact:true}).click();
  await elena.getByText('Autorización pendiente',{exact:true}).waitFor();
  assert.equal(await p.locator('app-calendar').count(),0);
  await p.getByRole('combobox',{name:'Explorar como',exact:true}).selectOption('profesional');
  await p.getByRole('heading',{name:'Solicitudes de acceso a tus agendas',exact:true}).waitFor();
  await p.getByRole('button',{name:'Rechazar solicitud de Ana García',exact:true}).click();
  await p.getByRole('heading',{name:'Solicitudes de acceso a tus agendas',exact:true}).waitFor({state:'hidden'});
  await p.getByRole('combobox',{name:'Explorar como',exact:true}).selectOption('secretaria');
  await elena.getByRole('button',{name:'Volver a solicitar',exact:true}).click();
  await p.getByRole('combobox',{name:'Explorar como',exact:true}).selectOption('profesional');
  await p.getByRole('heading',{name:'Solicitudes de acceso a tus agendas',exact:true}).waitFor();
  await shot(p,`owner-requests-${width}`);
  await p.getByRole('button',{name:'Autorizar agenda a Ana García',exact:true}).click();
  await p.getByRole('heading',{name:'Solicitudes de acceso a tus agendas',exact:true}).waitFor({state:'hidden'});
  await p.getByRole('combobox',{name:'Explorar como',exact:true}).selectOption('secretaria');
  await p.getByRole('heading',{name:/Tu jornada, en un vistazo/}).waitFor();
  await p.locator('.professional-heading').first().waitFor();
  assert.equal(await p.locator('.professional-heading').count(),1);
  assert.match(await p.locator('.professional-heading').innerText(),/Elena Martínez/);
  assert.equal(await p.locator('nav a[href="/mensajes"]').count(),0);
  await shot(p,`access-approved-${width}`);
  checks.push(`${width}px: solicitud sin acceso → rechazo del titular → nueva solicitud → aprobación → inicio con una agenda, sin chat`);
  await context.close();
 }
 assert.deepEqual(errors,[]);
 await writeFile(`${out}/access-checks.json`,JSON.stringify({checks,errors},null,2));
 console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
