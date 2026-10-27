import { Injectable, inject } from '@angular/core';
import { WorkspaceStore } from './workspace.store';
import type { Patient } from './models';
export interface PatientRegistration {firstName:string;lastName:string;document:string;email:string;phone:string;address:string;contactConsent:boolean;}
export interface PatientMatch {id:string;nombres:string;apellidos:string;vinculado:boolean;}
export interface RegisteredPatient {id:string;nombres:string;apellidos:string;numero_visible:number;reused:boolean;}
export const patientDni=(value:string)=>value.replace(/\D/g,'');
@Injectable({providedIn:'root'})
export class BookingPatients {
  readonly s=inject(WorkspaceStore);
  async match(agenda:string,document:string):Promise<PatientMatch[]>{
    const version=this.s.contextVersion();
    if(this.s.demo())return this.s.data().patients.filter(p=>patientDni(p.document)===patientDni(document)).map(p=>({id:p.id,nombres:p.firstName,apellidos:p.lastName,vinculado:p.professionalIds.includes(this.s.agenda(agenda)?.professionalId||'')}));
    const rows=await this.s.api.request<PatientMatch[]>(`${this.s.base}/agendas/${agenda}/patient-match?document=${encodeURIComponent(document)}`);this.s.assertContext(version);return rows;
  }
  async register(agendaId:string,input:PatientRegistration):Promise<RegisteredPatient>{
    const version=this.s.contextVersion();
    if(!this.s.agendaCan(agendaId,'booking:create'))throw new Error('No tenés permiso para registrar pacientes en esta agenda.');
    if([input.firstName,input.lastName,input.document,input.email,input.phone,input.address].some(v=>!v.trim()))throw new Error('Completá nombre, apellido, DNI, correo, celular y domicilio.');
    if(!/^\d{6,12}$/.test(patientDni(input.document)))throw new Error('Ingresá un DNI válido.');
    if(!/^\+[1-9][0-9]{7,14}$/.test(input.phone.replace(/[\s()-]/g,'')))throw new Error('Ingresá el celular con código de país, por ejemplo +5491112345678.');
    if(this.s.demo()){
      if((await this.match(agendaId,input.document)).length)throw new Error('Ya existe un paciente con ese DNI. Buscalo y vinculalo para evitar otro registro.');
      const professionalId=this.s.agenda(agendaId)!.professionalId;
      const number=String(Math.max(0,...this.s.data().patients.map(p=>Number(p.number)||0))+1);
      const patient:Patient={id:crypto.randomUUID(),firstName:input.firstName.trim(),lastName:input.lastName.trim(),document:patientDni(input.document),email:input.email.trim(),phone:input.phone.trim(),address:input.address.trim(),number,birthDate:'',coverage:'Particular',memberNumber:'',status:'ACTIVO',professionalIds:[professionalId]};
      this.s.mutate(d=>({...d,patients:[...d.patients,patient]}));return{id:patient.id,nombres:patient.firstName,apellidos:patient.lastName,numero_visible:Number(number),reused:false};
    }
    const row=await this.s.api.request<RegisteredPatient>(`${this.s.base}/agendas/${agendaId}/booking-patients`,'POST',input);this.s.assertContext(version);return row;
  }
  async link(agendaId:string,patientId:string,document:string):Promise<RegisteredPatient>{
    const version=this.s.contextVersion();
    if(!this.s.agendaCan(agendaId,'booking:create'))throw new Error('No tenés permiso para vincular pacientes a esta agenda.');
    if(this.s.demo()){
      const matches=await this.match(agendaId,document);if(matches.length!==1||matches[0].id!==patientId)throw new Error('Revisá el DNI: no identifica un único registro.');
      const professional=this.s.agenda(agendaId)!.professionalId;
      this.s.mutate(d=>({...d,patients:d.patients.map(p=>p.id===patientId?{...p,professionalIds:[...new Set([...p.professionalIds,professional])]}:p)}));
      const p=this.s.patient(patientId)!;return{id:p.id,nombres:p.firstName,apellidos:p.lastName,numero_visible:Number(p.number),reused:true};
    }
    const row=await this.s.api.request<RegisteredPatient>(`${this.s.base}/agendas/${agendaId}/booking-patients/${patientId}/link`,'POST',{document});this.s.assertContext(version);return row;
  }
}
