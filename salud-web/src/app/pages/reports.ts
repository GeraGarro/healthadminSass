import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  DestroyRef,
  OnInit,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { Appointment } from "../core/models";
import type { AppointmentDto } from "../core/api-contracts";
import { readAllPages, settleLimited } from "../core/paging";
import { appointmentFromDto } from "../core/workspace.loader";
import { WorkspaceStore } from "../core/workspace.store";
import { addDays, csvCell } from "../core/domain";
import { Icon } from "../ui/icon";
import { Status, Empty } from "../ui/shared";
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormsModule, Icon, Status, Empty],
  template: `
    <div class="page-heading">
      <div>
        <h1>Reportes</h1>
        <p>Información para coordinar mejor la atención.</p>
      </div>
      <div class="button-row">
        <select [(ngModel)]="format" aria-label="Formato de exportación">
          <option value="csv">CSV</option>
          <option value="pdf" [disabled]="s.demo()">PDF</option>
          <option value="xlsx" [disabled]="s.demo()">Excel</option></select
        ><button
          class="btn primary"
          [disabled]="exporting || tab === 'audit'"
          (click)="exportReport()"
        >
          <app-icon name="download" />{{
            exporting ? "Generando…" : "Exportar"
          }}
        </button>
      </div>
    </div>
    <div class="tabs">
      <button
        [class.active]="tab === 'appointments'"
        (click)="tab = 'appointments'"
      >
        Turnos y confirmaciones
      </button>
      @if (s.has("audit:read")) {
        <button
          [class.active]="tab === 'audit'"
          (click)="tab = 'audit'; loadAudit()"
        >
          Registro de actividad
        </button>
      }
    </div>
    @if (error) {
      <div class="alert error" role="alert">{{ error }}</div>
    }
    @if (loadingRange) {
      <p role="status">Consultando los turnos del período…</p>
    }
    @if (tab === "appointments") {
      <div class="filter-bar">
        <label
          >Desde<input
            type="date"
            [(ngModel)]="from"
            (ngModelChange)="loadRange()" /></label
        ><label
          >Hasta<input
            type="date"
            [(ngModel)]="until"
            (ngModelChange)="loadRange()" /></label
        ><label
          >Agenda<select [(ngModel)]="agendaId" (ngModelChange)="loadRange()">
            <option value="all">Todas las agendas habilitadas</option>
            @for (a of s.data().agendas; track a.id) {
              <option [value]="a.id">
                {{ a.professional }} · {{ a.name }}
              </option>
            }
          </select></label
        ><span class="filter-caption"
          >{{ rows.length }} turnos cargados en el período</span
        >
      </div>
      <section class="panel report-overview">
        <div>
          <h2>Confirmación de asistencia</h2>
          <p>Distribución de los turnos registrados del período.</p>
        </div>
        <div class="report-legend">
          <span><i class="legend-dot green"></i>Confirmados</span
          ><span><i class="legend-dot amber"></i>Por confirmar</span>
        </div>
        @for (agenda of chartAgendas; track agenda.id) {
          <div class="report-bar-row">
            <span>{{ agenda.professional }}</span>
            <div
              class="stacked-bar"
              [attr.aria-label]="
                count(agenda.id, 'CONFIRMADA') +
                ' confirmados y ' +
                count(agenda.id, 'PENDIENTE') +
                ' pendientes'
              "
            >
              <span
                class="confirmed-bar"
                [style.width.%]="
                  (count(agenda.id, 'CONFIRMADA') / maxCount) * 100
                "
              ></span
              ><span
                class="pending-bar"
                [style.width.%]="
                  (count(agenda.id, 'PENDIENTE') / maxCount) * 100
                "
              ></span>
            </div>
            <b>{{ count(agenda.id) }}</b>
          </div>
        }
        @if (!rows.length) {
          <app-empty
            title="Sin turnos en este período"
            text="Cambiá las fechas o la agenda seleccionada."
            icon="chart"
          />
        }
      </section>
      <section class="panel subsection">
        <div class="directory-toolbar">
          <h2>Detalle de turnos</h2>
          <span class="subtle">{{ from }} a {{ until }}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Paciente</th>
                <th>Profesional</th>
                <th>Práctica</th>
                <th>Asistencia</th>
                <th>Turno</th>
              </tr>
            </thead>
            <tbody>
              @for (turn of rows; track turn.id) {
                <tr>
                  <td>
                    {{ turn.date
                    }}<small class="cell-note">{{ turn.time }}</small>
                  </td>
                  <td>
                    <button
                      class="table-link"
                      (click)="s.openAppointment(turn.id)"
                    >
                      {{ s.patientName(turn.patientId) }}</button
                    ><small class="cell-note">N.º {{ turn.number }}</small>
                  </td>
                  <td>{{ s.agenda(turn.agendaId)?.professional }}</td>
                  <td>{{ turn.practice }}</td>
                  <td><app-status [value]="turn.attendance" /></td>
                  <td>
                    {{
                      turn.status === "REGISTRADO" ? "Registrado" : "Cancelado"
                    }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
      <p class="quiet-note subsection">
        {{
          s.demo()
            ? "La demostración exporta CSV con datos ficticios. PDF y Excel se generan al conectar el servidor."
            : "La vista consulta el período completo, hasta 93 días. La exportación del servidor admite hasta 31 días y 1000 turnos por agenda."
        }}
      </p>
    } @else {
      <section class="panel">
        <div class="directory-toolbar">
          <h2>Actividad de la entidad</h2>
          <div class="button-row">
            <button
              class="btn small"
              [disabled]="offset === 0 || loading"
              (click)="offset = offset - 100; loadAudit()"
            >
              Anterior</button
            ><span>{{ offset + 1 }}–{{ offset + audit.length }}</span
            ><button
              class="btn small"
              [disabled]="audit.length < 100 || loading"
              (click)="offset = offset + 100; loadAudit()"
            >
              Siguiente
            </button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Acción</th>
                <th>Actor</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              @for (event of audit; track event.id) {
                <tr>
                  <td>{{ event.time }}</td>
                  <td>{{ event.action }}</td>
                  <td>{{ event.actor }}</td>
                  <td>{{ event.result }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (!audit.length) {
          <app-empty
            title="No hay actividad para mostrar"
            text="El registro cronológico conserva las acciones administrativas."
            icon="shield"
          />
        }
      </section>
    }
  `,
})
export class Reports implements OnInit {
  reportRows: Appointment[] = [];
  loadingRange = false;
  private rangeEpoch = 0;
  constructor() {
    inject(DestroyRef).onDestroy(() => this.rangeEpoch++);
  }
  ngOnInit() {
    void this.loadRange();
  }
  async loadRange() {
    if (this.s.demo()) return;
    const epoch = ++this.rangeEpoch,
      context = this.s.contextVersion(),
      base = this.s.base;
    this.reportRows = [];
    this.error = "";
    this.loadingRange = false;
    if (!this.from || !this.until || this.from > this.until) return;
    if ((Date.parse(this.until) - Date.parse(this.from)) / 86400000 > 92) {
      this.error = "La consulta admite hasta 93 días. Reducí el período.";
      return;
    }
    const agendas = this.s
      .data()
      .agendas.filter(
        (a) =>
          a.permissions.includes("booking:read") &&
          (this.agendaId === "all" || a.id === this.agendaId),
      );
    this.loadingRange = true;
    try {
      const results = await settleLimited(
        agendas.map(
          (a) => () =>
            readAllPages<AppointmentDto>(
              this.s.api,
              `${base}/workspace/appointments?agendaId=${a.id}&from=${this.from}&until=${addDays(this.until, 1)}`,
            ),
        ),
      );
      if (epoch !== this.rangeEpoch || context !== this.s.contextVersion())
        return;
      this.reportRows = results.flatMap((r) =>
        r.status === "fulfilled" ? r.value.map(appointmentFromDto) : [],
      );
      this.error = results
        .flatMap((r, i) =>
          r.status === "rejected"
            ? [`${agendas[i].name}: ${r.reason.message}`]
            : [],
        )
        .join(" · ");
    } finally {
      this.cdr.markForCheck();
      if (epoch === this.rangeEpoch) this.loadingRange = false;
    }
  }
  readonly s = inject(WorkspaceStore);
  private readonly cdr = inject(ChangeDetectorRef);
  from = addDays(this.s.today, -7);
  until = this.s.today;
  agendaId = "all";
  format = "csv";
  tab = "appointments";
  error = "";
  exporting = false;
  loading = false;
  offset = 0;
  audit: any[] = [];
  get rows() {
    return (this.s.demo() ? this.s.data().appointments : this.reportRows)
      .filter(
        (a) =>
          a.date >= this.from &&
          a.date <= this.until &&
          (this.agendaId === "all" || a.agendaId === this.agendaId),
      )
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }
  get chartAgendas() {
    return this.s
      .data()
      .agendas.filter((a) => this.agendaId === "all" || a.id === this.agendaId);
  }
  count(id: string, status?: string) {
    return this.rows.filter(
      (a) =>
        a.agendaId === id &&
        a.status === "REGISTRADO" &&
        (!status || a.attendance === status),
    ).length;
  }
  get maxCount() {
    return Math.max(1, ...this.chartAgendas.map((a) => this.count(a.id)));
  }
  async exportReport() {
    this.error = "";
    this.exporting = true;
    try {
      if (!this.from || !this.until || this.from > this.until)
        throw new Error("Elegí un período válido.");
      let blob: Blob;
      if (this.s.demo()) {
        const header = [
          "Fecha",
          "Hora",
          "Paciente",
          "Número",
          "Profesional",
          "Práctica",
          "Asistencia",
          "Estado",
        ];
        const lines = this.rows.map((a) => [
          a.date,
          a.time,
          this.s.patientName(a.patientId),
          a.number,
          this.s.agenda(a.agendaId)?.professional,
          a.practice,
          a.attendance,
          a.status,
        ]);
        blob = new Blob(
          [
            "\uFEFF" +
              [header, ...lines]
                .map((row) => row.map(csvCell).join(";"))
                .join("\r\n"),
          ],
          { type: "text/csv;charset=utf-8" },
        );
      } else {
        if (this.agendaId === "all")
          throw new Error(
            "Seleccioná una agenda para exportar el reporte del servidor.",
          );
        if ((Date.parse(this.until) - Date.parse(this.from)) / 86400000 > 30)
          throw new Error(
            "La exportación admite hasta 31 días. Reducí el período.",
          );
        blob = await this.s.api.download(
          `${this.s.base}/reports/appointments?agendaId=${this.agendaId}&from=${this.from}&until=${this.until}&format=${this.format}`,
        );
      }
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = `patio-turnos-${this.from}-${this.until}.${this.format}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.s.flash("Reporte generado.");
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.exporting = false;
    }
  }
  async loadAudit() {
    this.loading = true;
    this.error = "";
    try {
      if (this.s.demo()) this.audit = this.s.data().audit;
      else {
        const r = await this.s.api.request(
          `${this.s.base}/audit?offset=${this.offset}`,
        );
        this.audit = r.map((e: any) => ({
          id: e.id,
          time: new Date(e.ocurrido_en).toLocaleString("es-AR"),
          action: e.accion,
          actor: e.actor_id || e.servicio_actor || "Sistema",
          result: e.resultado,
        }));
      }
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.loading = false;
    }
  }
}
