import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild, effect, inject, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { WorkspaceStore } from '../core/workspace.store';
import { StaffStore } from '../core/staff.store';
import { ProfessionalWorkspace,Activity,FeeRecord,PeriodPreview,periodDates } from '../core/professional-workspace';
import { addDays,dateLabel,localTime } from '../core/domain';
import { Calendar } from '../ui/calendar';
import { Icon } from '../ui/icon';
import { Empty } from '../ui/shared';
import { AgendaAccessRequests } from '../ui/agenda-access-requests';
import { FormFeedback } from '../ui/form-feedback';
@Component({standalone:true,selector:'app-professional-home',changeDetection:ChangeDetectionStrategy.Eager,imports:[FormsModule,DatePipe,RouterLink,Calendar,Icon,Empty,AgendaAccessRequests,FormFeedback],templateUrl:'./professional-home.html',styleUrl:'./professional-home.css'})
export class ProfessionalHome {
  readonly s=inject(WorkspaceStore);readonly staff=inject(StaffStore);readonly workspace=inject(ProfessionalWorkspace);private cdr=inject(ChangeDetectorRef);
  readonly tab=inject(ActivatedRoute).snapshot.data['tab']||'agenda';
  @ViewChild('cancellation') cancellation?:ElementRef<HTMLDialogElement>;
  agendaId=this.s.data().agendas.find(a=>a.owner)?.id||'';
  from=this.s.today.slice(0,7)+'-01';until=this.s.today;
  activity:Activity|null=null;fees:FeeRecord[]=[];error='';busy=false;feeSaving=false;
  feeOffer='';amount='';currency='ARS';
  period='day';cancelDate=this.s.date();reason='';confirmed=false;preview:PeriodPreview|null=null;previewBusy=false;cancelling=false;cancelError='';cancelKey='';private previewEpoch=0;private returnTo?:HTMLElement;
  dateLabel=dateLabel;periodDates=periodDates;
  private context=this.s.contextVersion();
  constructor(){effect(()=>{const version=this.s.contextVersion();const agendas=this.s.data().agendas;untracked(()=>{if(version!==this.context){this.context=version;this.previewEpoch++;this.cancellation?.nativeElement.close();}if(!agendas.some(a=>a.id===this.agendaId&&a.owner))this.agendaId=agendas.find(a=>a.owner)?.id||'';if(this.agendaId)this.s.selectedAgenda.set(this.agendaId);void this.load();});});}
  periodLastDay(){return addDays(periodDates(this.cancelDate,this.period).until,-1);}
  get owned(){return this.s.data().agendas.filter(a=>a.owner);}
  get agenda(){return this.s.agenda(this.agendaId);}
  get offers(){return this.s.data().offers.filter(o=>o.agendaId===this.agendaId);}
  get upcoming(){return this.s.data().appointments.filter(t=>t.agendaId===this.agendaId&&!['ATENCION','FINALIZADO'].includes(this.staff.reception()[t.id])&&t.status==='REGISTRADO'&&`${t.date}T${t.time}`>=`${this.s.today}T${this.s.timeInZone(this.agenda?.timezone)}`).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,4);}
  get cancelled(){return this.s.data().appointments.filter(t=>t.agendaId===this.agendaId&&t.status==='CANCELADO'&&t.date===this.s.date());}
  get maxDay(){return Math.max(1,...this.activity?.days.map(d=>Number(d.total))||[]);}
  fee(id:string){return this.fees.find(f=>f.oferta_id===id);}
  formatAmount(amount:string,currency:string){return new Intl.NumberFormat('es-AR',{style:'currency',currency}).format(Number(amount));}
  changed(){this.s.selectedAgenda.set(this.agendaId);this.feeOffer='';void this.load();}
  async load(){if(!this.agendaId||this.tab==='agenda')return;const version=this.s.contextVersion(),agenda=this.agendaId;this.busy=true;this.error='';try{if(this.tab==='activity'){if(!this.from||!this.until||this.from>this.until)throw new Error('Revisá las fechas del período.');const result=await this.workspace.activity(agenda,this.from,addDays(this.until,1));this.s.assertContext(version);if(this.agendaId===agenda)this.activity=result;}else{const rows=await this.workspace.fees(agenda);this.s.assertContext(version);if(this.agendaId===agenda){this.fees=rows;this.feeOffer=this.feeOffer||this.offers[0]?.id||'';}}}catch(e){if(version===this.s.contextVersion())this.error=(e as Error).message;}finally{if(version===this.s.contextVersion()){this.busy=false;this.cdr.markForCheck();}}}
  async saveFee(){if(this.feeSaving)return;this.feeSaving=true;this.error='';try{await this.workspace.saveFee(this.agendaId,this.feeOffer,this.amount,this.currency);this.amount='';await this.load();}catch(e){this.error=(e as Error).message;}finally{this.feeSaving=false;this.cdr.markForCheck();}}
  openCancellation(){this.returnTo=document.activeElement as HTMLElement;this.cancelDate=this.s.date();this.period='day';this.reason='';this.confirmed=false;this.cancelError='';this.cancelKey='';this.cancellation?.nativeElement.showModal();void this.loadPreview();}
  closeCancellation(){if(this.cancelling)return;this.previewEpoch++;this.cancellation?.nativeElement.close();this.returnTo?.focus();}
  async loadPreview(){const epoch=++this.previewEpoch,version=this.s.contextVersion();this.previewBusy=true;this.preview=null;this.confirmed=false;this.cancelKey='';this.cancelError='';try{const row=await this.workspace.preview(this.agendaId,this.cancelDate,this.period);if(epoch===this.previewEpoch&&version===this.s.contextVersion())this.preview=row;}catch(e){if(epoch===this.previewEpoch)this.cancelError=(e as Error).message;}finally{if(epoch===this.previewEpoch){this.previewBusy=false;this.cdr.markForCheck();}}}
  async cancelPeriod(){if(this.cancelling||!this.confirmed||!this.preview)return;this.cancelling=true;this.cancelError='';this.cancelKey=this.cancelKey||crypto.randomUUID();try{const result=await this.workspace.cancel(this.agendaId,this.cancelDate,this.period,this.reason,this.preview.count,this.cancelKey);this.cancellation?.nativeElement.close();this.s.flash(`${result.cancelled} turnos cancelados. Avisos registrados y reasignación pendiente.`);this.returnTo?.focus();}catch(e){this.cancelError=(e as Error).message;}finally{this.cancelling=false;this.cdr.markForCheck();}}
  turnTime(value:string){if(value.endsWith('Z')||/\+\d\d:\d\d$/.test(value)){const t=localTime(value,this.agenda?.timezone||'America/Argentina/Buenos_Aires');return`${t.date} · ${t.time}`;}return value.replace('T',' · ');}
}

