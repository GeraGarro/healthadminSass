import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { WorkspaceStore } from "../core/workspace.store";
import { Calendar } from "../ui/calendar";
import { Icon } from "../ui/icon";
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormsModule, Calendar, Icon],
  template: `
    <div class="page-heading">
      <div>
        <h1>Agenda</h1>
        <p>Personas, horarios y disponibilidad. Todo en su lugar.</p>
      </div>
      <button
        class="btn primary"
        [disabled]="!s.activeAgendas().some(canCreate)"
        (click)="s.newAppointment()"
      >
        <app-icon name="plus" />Nuevo turno
      </button>
    </div>
    <details class="agenda-filters" [open]="filtersExpanded" (toggle)="filtersExpanded = $any($event.target).open">
    <summary>Filtros de agenda<span>{{ filterSummary }}</span></summary>
    <div class="filter-bar">
      <label
        >Profesional<select
          [ngModel]="s.selectedAgenda()"
          (ngModelChange)="s.selectedAgenda.set($event)"
        >
          <option value="all">Todos los profesionales</option>
          @for (agenda of s.data().agendas; track agenda.id) {
            <option [value]="agenda.id">
              {{ agenda.professional }} · {{ agenda.name }}
            </option>
          }
        </select></label
      ><label
        >Asistencia<select [(ngModel)]="attendance">
          <option value="">Todos los estados</option>
          <option value="CONFIRMADA">Confirmados</option>
          <option value="PENDIENTE">Por confirmar</option>
        </select></label
      >
      <div class="filter-caption">
        <app-icon name="shield" />Solo agendas con acceso vigente
      </div>
    </div>
    </details>
    <app-calendar [attendance]="attendance" [showAgendaFilter]="false" />
  `,
})
export class AgendaPage {
  readonly s = inject(WorkspaceStore);
  attendance = "";
  filtersExpanded = !window.matchMedia("(max-width: 760px)").matches;
  get filterSummary() {
    const professional = this.s.selectedAgenda() === "all" ? "Todos los profesionales" : this.s.agenda(this.s.selectedAgenda())?.professional || "Profesional seleccionado";
    return `${professional} · ${this.attendance === 'CONFIRMADA' ? 'Confirmados' : this.attendance === 'PENDIENTE' ? 'Por confirmar' : 'Todos los estados'}`;
  }
  canCreate = (a: any) => a.permissions.includes("booking:create");
}
