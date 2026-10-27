import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { WorkspaceStore } from './workspace.store';
import { createDemo } from './demo-data';

export interface StaffHour { dia_semana: number; hora_inicio: string; hora_fin: string; desde?: string; hasta?: string | null; }
export interface StaffPerson { id: string; nombre: string; matricula: string; agenda_id: string | null; agenda: string; sede: string; zona_horaria: string; solicitud: string; hours: StaffHour[]; }
export interface StaffRequest { id: string; solicitante_id: string; tipo: string; agenda_id: string | null; nombre: string; matricula: string; estado: string; }
export interface StaffProfile { firstName: string; lastName: string; document: string; address: string; phone: string; photo: string; complete: boolean; }
export interface StaffNotice { id: string; tipo: string; institucion: string; leido_en: string | null; }
const blankProfile = (): StaffProfile => ({firstName:'',lastName:'',document:'',address:'',phone:'',photo:'',complete:false});

@Injectable({providedIn:'root'})
export class StaffStore {
  readonly s = inject(WorkspaceStore);
  readonly people = signal<StaffPerson[]>([]);
  readonly requests = signal<StaffRequest[]>([]);
  readonly profile = signal<StaffProfile>(blankProfile());
  readonly notices = signal<StaffNotice[]>([]);
  readonly reception = signal<Record<string,string>>({});
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loaded = signal(false);
  readonly error = signal('');
  readonly authorized = computed(()=>this.people().filter(p=>this.s.data().agendas.some(a=>a.id===p.agenda_id)));
  private version = -1;
  constructor() {
    effect(()=>{const version=this.s.contextVersion(); untracked(()=>{this.version=version;this.saving.set(false);this.loading.set(false);this.people.set([]);this.requests.set([]);this.profile.set(blankProfile());this.reception.set({});this.notices.set([]);this.loaded.set(false);this.error.set(''); if(this.s.entity().id) void this.load();});});
  }
  private get key() {return `patio-staff-v2-${this.s.entity().id}`;}
  private get profileKey() {return `${this.key}-profile-${this.s.user().id}`;}
  private read<T>(key:string,fallback:T):T {try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}}
  private save(key:string,value:unknown) {try{localStorage.setItem(key,JSON.stringify(value));}catch{this.s.flash('Cambio aplicado. El navegador no permite conservar la demostración.');}}
  async load() {
    const version=this.s.contextVersion();this.version=version;this.loading.set(true);this.error.set('');
    try {
      if(this.s.demo()) {
        const demo=createDemo('secretaria',this.s.entity().type==='INDEPENDIENTE');
        this.people.set([...demo.agendas.map(a=>({id:a.professionalId,nombre:a.professional,matricula:({'pr1':'M.N. 38421','pr2':'M.N. 42108','pr3':'M.N. 39870'} as Record<string,string>)[a.professionalId],agenda_id:a.id,agenda:a.name,sede:a.branch,zona_horaria:a.timezone,solicitud:'',hours:demo.hours.filter(h=>h.agendaId===a.id).map(h=>({dia_semana:h.day,hora_inicio:h.start,hora_fin:h.end}))})),...this.s.entity().type==='INDEPENDIENTE'?[]:[{id:'pr4',nombre:'Dra. Julia Acosta',matricula:'M.N. 45729',agenda_id:'a4',agenda:'Consultorio 04',sede:'Sede Norte',zona_horaria:'America/Argentina/Buenos_Aires',solicitud:'',hours:[2,4].map(day=>({dia_semana:day,hora_inicio:'09:00',hora_fin:'16:00'}))}]]);
        const saved=this.read<StaffRequest[]>(`${this.key}-requests`,[]);
        this.requests.set(saved);
        this.people.update(people=>people.map(p=>({...p,solicitud:saved.filter(r=>r.agenda_id===p.agenda_id&&r.solicitante_id===this.s.user().id).at(-1)?.estado||''})));
        this.profile.set(this.read(this.profileKey,{...blankProfile(),firstName:this.s.user().name.split(' ')[0],lastName:this.s.user().name.split(' ').slice(1).join(' '),complete:sessionStorage.getItem('patio-first-visit')!=='true'}));
        this.reception.set(this.read(`${this.key}-reception`,{}));
      } else {
        const result=await Promise.all([
          this.s.api.request<StaffPerson[]>(`${this.s.base}/staff-directory`),
          this.s.api.request<StaffRequest[]>(`${this.s.base}/staff-requests`),
          this.s.api.request<{profile:string}>('/account/profile'),
          this.s.api.request<StaffNotice[]>('/account/staff-notices'),
        ]);
        this.s.assertContext(version);this.people.set(result[0]);this.requests.set(result[1]);this.profile.set({...blankProfile(),...JSON.parse(result[2].profile)});this.notices.set(result[3]);
        const rows=await Promise.all(this.s.data().agendas.filter(a=>a.permissions.includes('booking:read')).map(a=>this.s.api.request<{turno_id:string;estado:string}[]>(`${this.s.base}/reception?agendaId=${a.id}`)));
        this.s.assertContext(version);this.reception.set(Object.fromEntries(rows.flat().map(r=>[r.turno_id,r.estado])));
      }
      this.loaded.set(true);
    } catch(e) {if(version===this.s.contextVersion())this.error.set((e as Error).message);}
    finally {if(version===this.s.contextVersion())this.loading.set(false);}
  }
  async mutate(action:()=>Promise<void>) {
    if(this.saving())return; const version=this.s.contextVersion();this.saving.set(true);this.error.set('');
    try {await action();this.s.assertContext(version);await this.load();}
    catch(e){if(version===this.s.contextVersion())this.error.set((e as Error).message);}
    finally{if(version===this.s.contextVersion())this.saving.set(false);}
  }
  async requestAccess(p:StaffPerson) {
    if(!p.agenda_id || this.s.role()!=='secretaria')return;
    await this.mutate(async()=>{
      if(this.s.demo()) {const rows=this.read<StaffRequest[]>(`${this.key}-requests`,[]);if(rows.some(r=>r.agenda_id===p.agenda_id&&r.solicitante_id===this.s.user().id&&r.estado==='PENDIENTE'))return;rows.push({id:crypto.randomUUID(),solicitante_id:this.s.user().id,tipo:'AGENDA',agenda_id:p.agenda_id,nombre:this.s.user().name,matricula:'',estado:'PENDIENTE'});this.save(`${this.key}-requests`,rows);}
      else await this.s.api.request(`${this.s.base}/agendas/${p.agenda_id}/access-requests`,'POST',{});
      this.s.flash('Solicitud enviada. El profesional titular debe autorizar la agenda.');
    });
  }
  async resolve(r:StaffRequest,approve:boolean) {
    await this.mutate(async()=>{
      if(this.s.demo()) {const owned=this.s.data().agendas.filter(a=>a.owner).map(a=>a.id);if(r.tipo==='AGENDA'&&!owned.includes(r.agenda_id||''))throw new Error('Solo el titular puede autorizar esta agenda.');const rows=this.read<StaffRequest[]>(`${this.key}-requests`,[]);rows.filter(v=>v.id===r.id).forEach(v=>v.estado=approve?'APROBADA':'RECHAZADA');this.save(`${this.key}-requests`,rows);}
      else await this.s.api.request(`${this.s.base}/staff-requests/${r.id}/resolve`,'POST',{approve});
      this.s.flash(approve?'Solicitud aprobada. La persona recibirá un aviso.':'Solicitud rechazada. La persona recibirá un aviso.');
    });
  }
  async saveProfile(profile:StaffProfile) {
    const version=this.s.contextVersion();
    await this.mutate(async()=>{
      if(!profile.firstName.trim()||!profile.lastName.trim())throw new Error('Completá nombre y apellido.');
      const next={...profile,firstName:profile.firstName.trim(),lastName:profile.lastName.trim(),complete:true};
      if(this.s.demo()){this.save(this.profileKey,next);sessionStorage.removeItem('patio-first-visit');}
      else await this.s.api.request('/account/profile','PUT',next);
      this.s.assertContext(version);
      this.s.user.update(u=>({...u,name:`${next.firstName} ${next.lastName}`}));this.s.flash('Tu perfil está listo.');
    });
  }
  async setReception(id:string,state:string) {
    const turn=this.s.data().appointments.find(t=>t.id===id);if(!turn||!this.s.agendaCan(turn.agendaId,'booking:confirm'))return;
    await this.mutate(async()=>{
      if(this.s.demo()){this.reception.update(r=>({...r,[id]:state}));this.save(`${this.key}-reception`,this.reception());}
      else await this.s.api.request(`${this.s.base}/appointments/${id}/reception`,'PUT',{state});
      this.s.flash(state==='ESPERA'?'Llegada registrada.':state==='ATENCION'?'Paciente en atención.':'Atención finalizada.');
    });
  }
  schedule(person:StaffPerson) {return person.hours.map(h=>`${['','Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][h.dia_semana]} ${h.hora_inicio.slice(0,5)}–${h.hora_fin.slice(0,5)}`).join(' · ');}
  onDuty(person:StaffPerson) {
    const time=this.s.timeInZone(person.zona_horaria);const date=this.s.demo()?this.s.today:new Intl.DateTimeFormat('en-CA',{timeZone:person.zona_horaria}).format(new Date(this.s.clock()));
    const day=new Date(`${date}T12:00:00Z`).getUTCDay()||7;
    return person.hours.some(h=>h.dia_semana===day&&h.hora_inicio.slice(0,5)<=time&&h.hora_fin.slice(0,5)>time&&(!h.desde||h.desde<=date)&&(!h.hasta||h.hasta>=date));
  }
}
