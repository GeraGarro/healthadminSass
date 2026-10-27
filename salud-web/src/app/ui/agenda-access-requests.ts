import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { StaffStore } from '../core/staff.store';
import { WorkspaceStore } from '../core/workspace.store';
import { initials } from '../core/domain';
import { Icon } from './icon';

@Component({
  selector:'app-agenda-access-requests',standalone:true,
  changeDetection:ChangeDetectionStrategy.Eager,imports:[Icon],
  template:`
    @if(requests().length){
      <section class="agenda-access-inbox" aria-labelledby="agenda-access-title" [attr.aria-busy]="staff.saving()">
        <div class="access-heading"><div><h2 id="agenda-access-title">Solicitudes de acceso a tus agendas</h2><p>Vos decidís quién puede ayudarte a gestionar los turnos.</p></div><span class="count-badge">{{ requests().length }}</span></div>
        <p class="access-scope"><app-icon name="shield" /><span>Al autorizar, esta persona podrá ver, registrar, confirmar, cancelar y reprogramar turnos de esa agenda. No podrá modificar tus horarios ni acceder a conversaciones.</span></p>
        @if(staff.error()){<div class="alert error" role="alert">{{ staff.error() }}</div>}
        @for(request of requests();track request.id){<article class="access-request"><span class="avatar">{{ initials(request.nombre) }}</span><div><h3>{{ request.nombre }}</h3><p>Solicita gestionar {{ s.agenda(request.agenda_id || '')?.name }}</p></div><div class="access-actions"><button class="btn" [disabled]="staff.saving()" (click)="staff.resolve(request,false)" [attr.aria-label]="'Rechazar solicitud de '+request.nombre">Rechazar</button><button class="btn primary" [disabled]="staff.saving()" (click)="staff.resolve(request,true)" [attr.aria-label]="'Autorizar agenda a '+request.nombre">Autorizar agenda<app-icon name="check" /></button></div></article>}
      </section>
    }
  `,
  styles:`
    :host{display:block}.agenda-access-inbox{background:var(--amber);border-radius:14px;padding:24px;margin-bottom:28px}.access-heading{display:flex;gap:16px;justify-content:space-between;align-items:start}.access-heading h2{font-size:1.125rem;margin:0 0 4px}.access-heading p{font-size:.875rem;margin:0;color:var(--amber-ink)}.access-scope{display:flex;align-items:start;gap:10px;color:var(--amber-ink);font-size:.8125rem;line-height:1.7;max-width:85ch;margin:20px 0}.access-scope app-icon{width:18px;height:18px;flex-shrink:0;margin-top:3px}.access-request{display:flex;gap:14px;align-items:center;border-top:1px solid var(--control-border);padding:18px 0 0;margin-top:18px}.access-request>.avatar{flex-shrink:0}.access-request>div:nth-child(2){flex:1;min-width:0}.access-request h3{font-size:.9375rem;margin:0 0 3px;overflow-wrap:anywhere}.access-request p{font-size:.8125rem;margin:0;color:var(--amber-ink)}.access-actions{display:flex;gap:10px;flex-shrink:0}@media(max-width:760px){.agenda-access-inbox{padding:20px}.access-request{flex-wrap:wrap}.access-request>div:nth-child(2){flex-basis:calc(100% - 54px)}.access-actions{width:100%}.access-actions .btn{flex:1;justify-content:center;min-height:44px}.access-heading h2{line-height:1.4}.access-scope{margin:16px 0}}
  `,
})
export class AgendaAccessRequests {
  readonly s=inject(WorkspaceStore);
  readonly staff=inject(StaffStore);
  readonly initials=initials;
  readonly requests=computed(()=>this.staff.requests().filter(r=>r.tipo==='AGENDA'&&r.estado==='PENDIENTE'&&this.s.data().agendas.some(a=>a.id===r.agenda_id&&a.owner)));
}
