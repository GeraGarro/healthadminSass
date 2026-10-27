import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StaffStore } from '../core/staff.store';
import { WorkspaceStore } from '../core/workspace.store';
import { initials, normalized } from '../core/domain';
import { Icon } from '../ui/icon';
import { Empty } from '../ui/shared';
@Component({selector:'app-staff-directory',standalone:true,changeDetection:ChangeDetectionStrategy.Eager,imports:[FormsModule,RouterLink,Icon,Empty],templateUrl:'./staff-directory.html',styleUrl:'./staff-experience.css'})
export class StaffDirectory {
  readonly s=inject(WorkspaceStore);readonly staff=inject(StaffStore);initials=initials;
  readonly query=signal('');readonly filter=signal('all');
  readonly visible=computed(()=>this.staff.people().filter(p=>(!this.query()||normalized(`${p.nombre} ${p.matricula} ${p.sede}`).includes(normalized(this.query())))&&(this.filter()!=='authorized'||this.allowed(p.agenda_id))));
  allowed(id:string|null){return this.s.data().agendas.some(a=>a.id===id);}
  async refresh(){try{if(this.s.demo())this.s.startDemo(this.s.role(),this.s.entity().type==='INDEPENDIENTE');else await this.s.reload();await this.staff.load();}catch(e){this.staff.error.set((e as Error).message);}}
}
