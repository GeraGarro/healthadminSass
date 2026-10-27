import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StaffStore } from '../core/staff.store';
import { WorkspaceStore } from '../core/workspace.store';
import { dateLabel, initials } from '../core/domain';
import { Calendar } from '../ui/calendar';
import { Icon } from '../ui/icon';
import { StaffDirectory } from './staff-directory';
import { StaffProfilePage } from './staff-profile';
@Component({selector:'app-secretary-home',standalone:true,changeDetection:ChangeDetectionStrategy.Eager,imports:[FormsModule,RouterLink,Calendar,Icon,StaffDirectory,StaffProfilePage],templateUrl:'./secretary-home.html',styleUrl:'./secretary-home.css'})
export class SecretaryHome {
  readonly s=inject(WorkspaceStore);readonly staff=inject(StaffStore);dateLabel=dateLabel;initials=initials;
  readonly queueFilter=signal('all');
  readonly canCreate=computed(()=>this.s.activeAgendas().some(a=>a.permissions.includes('booking:create')));
  readonly affected=computed(()=>this.s.pending().filter(i=>i.type==='reprogramacion'&&(!i.agendaId||this.s.activeAgendas().some(a=>a.id===i.agendaId))));
  readonly queue=computed(()=>this.s.daily().filter(t=>this.staff.reception()[t.id]!=='FINALIZADO'&&(this.queueFilter()==='all'||this.staff.reception()[t.id]===this.queueFilter())).sort((a,b)=>{const rank=(id:string)=>this.staff.reception()[id]==='ATENCION'?0:this.staff.reception()[id]==='ESPERA'?1:2;return rank(a.id)-rank(b.id)||a.time.localeCompare(b.time);}));
  readonly waiting=computed(()=>this.s.daily().filter(t=>this.staff.reception()[t.id]==='ESPERA').length);
  readonly attending=computed(()=>this.s.daily().filter(t=>this.staff.reception()[t.id]==='ATENCION').length);
  state(id:string){return this.staff.reception()[id]||'';}
  constructor(){const timer=setInterval(()=>{if(!this.s.demo()&&!document.hidden&&!this.staff.saving()&&!this.s.busy()&&!this.s.appointmentPanel())void this.refresh();},60000);inject(DestroyRef).onDestroy(()=>clearInterval(timer));}
  async refresh(){try{await this.s.reload();await this.staff.load();}catch(e){this.staff.error.set((e as Error).message);}}
}
