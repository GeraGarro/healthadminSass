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
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`${origin}/acceso`);await p.getByRole('button',{name:'Explorar administración',exact:true}).click();await p.locator('.institution-profile').first().waitFor();
 assert.equal(await p.locator('table').count(),0);assert.equal(await p.locator('nav a[href="/pacientes"]').count(),0);assert.equal(await p.locator('#global-search').isVisible(),false);
 await shot(p,`admin-${width}`);
 await p.getByRole('button',{name:'Ver perfil de Dr. Diego Suárez',exact:true}).click();await p.getByRole('button',{name:'Revisar baja institucional'}).click();await p.getByRole('checkbox',{name:/Entiendo que esta baja/}).check();await p.getByRole('button',{name:'Confirmar baja institucional'}).click();await p.locator('#professional-detail').getByText('Vínculo finalizado',{exact:true}).waitFor();
 await p.getByRole('button',{name:'Cerrar detalle profesional'}).click();await p.getByRole('button',{name:'Añadir profesional',exact:true}).click();await p.getByLabel('Correo de acceso').fill('nuevo@example.test');await p.getByLabel('Nombre de referencia').fill('Dra. Laura Campos');await p.getByLabel('Matrícula verificada').fill('M.N. 55000');await p.locator('#institution-form .institution-form-actions .primary').click();await p.getByRole('heading',{name:'Cuenta creada. Entregá el acceso a la persona.'}).waitFor();await shot(p,`credentials-${width}`);await p.getByRole('button',{name:'Ocultar credenciales'}).click();
 for(const route of ['equipo','sedes','auditoria']){await p.goto(`${origin}/institucion/${route}`);await p.locator('.institution-loading').waitFor({state:'hidden'});assert.equal(await p.locator('table').count(),0);await shot(p,`${route}-${width}`);}
 await p.goto(`${origin}/pacientes`);await p.waitForURL('**/institucion/profesionales');checks.push(`${width}px: institución sin tablas ni pacientes, alta provisoria, baja y rutas protegidas`);
 await p.getByRole('combobox',{name:'Explorar como',exact:true}).selectOption('secretaria');await p.getByRole('heading',{name:/Tu jornada, en un vistazo/}).waitFor();await p.getByRole('button',{name:'Registrar llegada',exact:true}).first().click();await p.getByRole('button',{name:'Pasar a atención',exact:true}).first().click();await p.getByRole('button',{name:'Registrar llegada',exact:true}).first().click();await shot(p,`secretary-${width}`);
 await p.goto(`${origin}/profesionales`);await p.locator('.person-profile').first().waitFor();assert.equal(await p.locator('.person-profile').count(),4);await p.getByRole('button',{name:/Mis agendas/}).click();await p.waitForFunction(()=>document.querySelectorAll('.person-profile').length===3);assert.equal(await p.locator('.person-profile').count(),3);await p.getByRole('button',{name:/Todo el equipo/}).click();await p.getByRole('button',{name:'Solicitar acceso',exact:true}).click();await p.getByText('Autorización pendiente',{exact:true}).waitFor();await shot(p,`directory-${width}`);checks.push(`${width}px: recepción, agenda multicolumna, filtros y autorización pendiente`);
 await p.goto(`${origin}/acceso`);await p.getByRole('button',{name:'Secretaría · primer ingreso',exact:true}).click();await p.getByRole('heading',{name:'Hagamos lugar a tu jornada'}).waitFor();await shot(p,`onboarding-${width}`);await p.getByLabel('Nombre',{exact:true}).fill('Ana');await p.getByLabel('Apellido',{exact:true}).fill('García');await p.getByRole('button',{name:'Guardar y continuar'}).click();await p.getByRole('heading',{name:'Tu próxima jornada empieza acá'}).waitFor();assert.equal(await p.locator('app-calendar').count(),0);checks.push(`${width}px: primer ingreso con solo nombre y apellido, directorio como inicio sin agenda`);
 await context.close();
}
assert.deepEqual(errors,[]);await writeFile(`${out}/checks.json`,JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
