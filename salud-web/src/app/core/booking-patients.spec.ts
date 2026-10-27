import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {WorkspaceStore} from './workspace.store';
import {ApiClient} from './api.client';
import {BookingPatients,PatientRegistration} from './booking-patients';
import {periodDates} from './professional-workspace';
import {Calendar} from '../ui/calendar';
let s:WorkspaceStore,patients:BookingPatients;
const registration:PatientRegistration={firstName:'Ana',lastName:'Luna',document:'46111222',email:'ana@example.test',phone:'+5491112345678',address:'Parque 100',contactConsent:false};
beforeEach(()=>{sessionStorage.clear();localStorage.clear();TestBed.configureTestingModule({providers:[WorkspaceStore,{provide:ApiClient,useValue:{request:vi.fn(),expired:signal(false),mfaRequired:signal(false)}}]});s=TestBed.inject(WorkspaceStore);s.startDemo('secretaria');patients=TestBed.inject(BookingPatients);});
afterEach(()=>TestBed.resetTestingModule());
it('exige los seis datos y evita otro registro del mismo DNI',async()=>{
  for(const field of ['firstName','lastName','document','email','phone','address'] as const)await expect(patients.register('a1',{...registration,[field]:''})).rejects.toThrow('Completá');
  const created=await patients.register('a1',registration);expect(s.patient(created.id)?.professionalIds).toEqual(['pr1']);
  await expect(patients.register('a1',{...registration,document:'46.111.222'})).rejects.toThrow('Ya existe');
});
it('vincula el paciente de otro profesional sin aumentar los registros',async()=>{
  const candidate=s.data().patients[0];s.data.update(d=>({...d,patients:d.patients.map(p=>p.id===candidate.id?{...p,professionalIds:['pr2']}:p)}));const count=s.data().patients.length;
  const matches=await patients.match('a1',candidate.document);expect(matches[0].vinculado).toBe(false);
  await patients.link('a1',candidate.id,candidate.document);await patients.link('a1',candidate.id,candidate.document);
  expect(s.data().patients).toHaveLength(count);expect(s.patient(candidate.id)?.professionalIds.filter(id=>id==='pr1')).toHaveLength(1);
});
it('calcula semanas completas y meses que cruzan el año',()=>{expect(periodDates('2026-12-31','week')).toEqual({from:'2026-12-28',until:'2027-01-04'});expect(periodDates('2026-12-31','month')).toEqual({from:'2026-12-01',until:'2027-01-01'});});
it('distingue horario pasado de atención finalizada, espera y atención actual',()=>{
  const reception=signal<Record<string,string>>({});const calendar={s,staff:{reception},currentDate:()=>s.today} as unknown as Calendar;
  const turn={...s.data().appointments[0],date:'2020-01-01',time:'08:00'};
  expect(Calendar.prototype.temporalState.call(calendar,turn)).toBe('elapsed');
  for(const [state,color] of [['ESPERA','waiting'],['ATENCION','attending'],['FINALIZADO','finished']]){reception.set({[turn.id]:state});expect(Calendar.prototype.temporalState.call(calendar,turn)).toBe(color);}
  reception.set({});expect(Calendar.prototype.temporalState.call(calendar,{...turn,date:'2030-01-01'})).toBe('upcoming');
});
