import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormFeedback } from "../ui/form-feedback";
import { ActivatedRoute } from "@angular/router";
import { WorkspaceStore } from "../core/workspace.store";
import type { WorkItem } from "../core/models";
import { Icon } from "../ui/icon";
import { Empty } from "../ui/shared";
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormFeedback, FormsModule, Icon, Empty],
  template: ` <div class="page-heading">
      <div>
        <h1>Solicitudes</h1>
        <p>Un lugar para cada gestión que necesita una persona.</p>
      </div>
      <span class="heading-count">{{ s.pending().length }} pendientes</span>
    </div>
    <div class="tabs">
      <button [class.active]="type === 'all'" (click)="type = 'all'">
        Todas
      </button>
      @if (s.has("admissions:manage")) {
        <button
          [class.active]="type === 'admision'"
          (click)="type = 'admision'"
        >
          Admisiones
        </button>
      }
      <button [class.active]="type === 'gestion'" (click)="type = 'gestion'">
        Gestión asistida</button
      ><button
        [class.active]="type === 'reprogramacion'"
        (click)="type = 'reprogramacion'"
      >
        Reprogramaciones
      </button>
    </div>
    <div class="inbox-workspace">
      <section class="panel">
        <div class="directory-toolbar">
          <h2>
            {{
              type === "all"
                ? "Bandeja de trabajo"
                : type === "admision"
                  ? "Solicitudes de acceso"
                  : type === "gestion"
                    ? "Prácticas para coordinar"
                    : "Turnos afectados"
            }}
          </h2>
          <select aria-label="Estado de solicitudes" [(ngModel)]="state">
            <option value="PENDIENTE">Pendientes</option>
            <option value="all">Todos los estados</option>
          </select>
        </div>
        @for (item of items; track item.id) {
          <button
            class="work-item"
            [class.selected-row]="selected?.id === item.id"
            (click)="select(item)"
          >
            <span [class]="'task-mark ' + item.type"
              ><app-icon
                [name]="
                  item.type === 'admision'
                    ? 'people'
                    : item.type === 'reprogramacion'
                      ? 'refresh'
                      : 'inbox'
                " /></span
            ><span class="work-item-content"
              ><strong>{{ item.name }}</strong>
              <p>{{ item.detail }}</p>
              <small
                >{{
                  item.type === "admision"
                    ? "Admisión"
                    : item.type === "reprogramacion"
                      ? "Reprogramación"
                      : "Gestión asistida"
                }}
                · {{ item.date || "Fecha de la reserva" }}</small
              ></span
            ><span class="plain-state">{{
              item.state === "PENDIENTE" ? "Pendiente" : item.state
            }}</span
            ><app-icon name="chevron" />
          </button>
        }
        @if (!items.length) {
          <app-empty
            title="Todo al día por acá"
            text="No hay solicitudes que coincidan con estos filtros."
            icon="inbox"
          />
        }
      </section>
      @if (selected; as item) {
        <aside class="panel action-panel">
          <div class="section-heading">
            <h2>Gestionar solicitud</h2>
            <button
              class="icon-btn"
              aria-label="Cerrar solicitud"
              (click)="selected = null"
            >
              <app-icon name="close" />
            </button>
          </div>
          <h3 class="selected-name">{{ item.name }}</h3>
          <p>{{ item.detail }}</p>
          @if (error) {
            <div class="alert error" role="alert">{{ error }}</div>
          }
          @if (item.state === "PENDIENTE") {
            @if (item.type === "admision" && s.has("admissions:manage")) {
              <form class="form-stack" (ngSubmit)="approve()">
                <label
                  >Referencia de identidad y contacto verificados<textarea
                    name="verification"
                    required
                    rows="3"
                    maxlength="300"
                    [(ngModel)]="verification"
                    placeholder="Registrá la evidencia que verificaste."
                  ></textarea>
                </label>
                <p class="form-hint">
                  <app-icon name="shield" />Aprobar no reemplaza la activación
                  de cuenta ni concede acceso clínico.
                </p>
                <button
                  class="btn primary"
                  [disabled]="saving || !verification.trim()"
                >
                  {{ saving ? "Guardando…" : "Aprobar admisión" }}</button
                ><button
                  type="button"
                  class="btn danger-text"
                  [disabled]="saving"
                  (click)="rejectMode = !rejectMode"
                >
                  Rechazar solicitud
                </button>
                @if (rejectMode) {
                  <div class="alert warning">
                    La solicitud dejará de estar pendiente. El solicitante no
                    recibirá acceso.
                  </div>
                  <button
                    type="button"
                    class="btn danger"
                    [disabled]="saving"
                    (click)="reject()"
                  >
                    Confirmar rechazo
                  </button>
                }
              </form>
            }
            @if (item.type === "gestion") {
              <div class="form-hint">
                Esta solicitud no ocupa un horario. Coordiná la práctica con el
                paciente y registrá el turno.
              </div>
              <div class="form-stack subsection">
                <button
                  class="btn primary"
                  (click)="
                    s.newAppointment({
                      patientId: item.patientId,
                      agendaId: item.agendaId,
                    })
                  "
                >
                  <app-icon name="plus" />Coordinar un turno</button
                ><button class="btn" [disabled]="saving" (click)="resolve()">
                  Marcar gestión como resuelta
                </button>
              </div>
            }
            @if (item.type === "reprogramacion") {
              <div class="alert warning">
                <app-icon name="phone" />El aviso por WhatsApp es obligatorio
                también para turnos confirmados. No modifica el turno.
              </div>
              <button
                class="btn primary full subsection"
                [disabled]="!affectedTurn()"
                (click)="reprogram()"
              >
                <app-icon name="refresh" />Elegir nuevo horario
              </button>
              <p class="form-hint">
                La resolución se registra al reprogramar el turno. Revisá la
                entrega en Comunicaciones.
              </p>
            }
          } @else {
            <div class="alert success">
              <app-icon name="check" />Esta solicitud ya fue gestionada.
            </div>
          }
        </aside>
      }
    </div>`,
})
export class Inbox {
  readonly s = inject(WorkspaceStore);
  private readonly cdr = inject(ChangeDetectorRef);
  type = inject(ActivatedRoute).snapshot.queryParamMap.get("tipo") || "all";
  state = "PENDIENTE";
  selected: WorkItem | null = null;
  verification = "";
  error = "";
  saving = false;
  rejectMode = false;
  get items() {
    return this.s
      .data()
      .items.filter(
        (i) =>
          (this.type === "all" || i.type === this.type) &&
          (this.state === "all" || i.state === this.state),
      );
  }
  select(item: WorkItem) {
    this.selected = item;
    this.error = "";
    this.verification = "";
    this.rejectMode = false;
  }
  async run(work: () => Promise<void>) {
    this.error = "";
    this.saving = true;
    try {
      await work();
      if (this.selected)
        this.selected =
          this.s.data().items.find((i) => i.id === this.selected!.id) || null;
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.saving = false;
    }
  }
  approve() {
    return this.run(async () => {
      const i = this.selected!;
      if (!this.verification.trim())
        throw new Error("Registrá la referencia de verificación.");
      await this.s.command(
        `/admissions/${i.id}/approve`,
        {
          accountId: i.accountId,
          professionalEntityId: i.professionalId,
          agendaId: null,
          verificationReference: this.verification,
          representationId: null,
        },
        "Admisión aprobada. La cuenta debe completar su activación.",
      );
      if (this.s.demo()) {
        this.s.mutate((d) => ({
          ...d,
          items: d.items.map((x) =>
            x.id === i.id ? { ...x, state: "APROBADA" } : x,
          ),
          patients: [
            ...d.patients,
            {
              id: crypto.randomUUID(),
              firstName: i.name.split(" ")[0],
              lastName: i.name.split(" ").slice(1).join(" "),
              number: String(
                Math.max(
                  1041,
                  ...d.patients.map((p) => Number(p.number) || 0),
                ) + 1,
              ),
              document: "",
              birthDate: "",
              address: "",
              email: "",
              phone: "",
              coverage: "Sin registrar",
              memberNumber: "",
              status: "ACTIVO",
              professionalIds: i.professionalId ? [i.professionalId] : [],
            },
          ],
        }));
      }
    });
  }
  reject() {
    return this.run(async () => {
      const id = this.selected!.id;
      await this.s.command(
        `/admissions/${id}/reject`,
        undefined,
        "Solicitud rechazada.",
      );
      if (this.s.demo())
        this.s.mutate((d) => ({
          ...d,
          items: d.items.map((i) =>
            i.id === id ? { ...i, state: "RECHAZADA" } : i,
          ),
        }));
    });
  }
  resolve() {
    return this.run(async () => {
      const i = this.selected!;
      await this.s.command(
        `/management-requests/${i.id}/resolve?agendaId=${i.agendaId}`,
        undefined,
        "Gestión marcada como resuelta.",
      );
      if (this.s.demo())
        this.s.mutate((d) => ({
          ...d,
          items: d.items.map((x) =>
            x.id === i.id ? { ...x, state: "RESUELTA" } : x,
          ),
        }));
    });
  }
  affectedTurn() {
    return (
      this.s
        .data()
        .appointments.find((a) => a.id === this.selected?.appointmentId) ||
      this.s
        .data()
        .appointments.find(
          (a) =>
            a.patientId === this.selected?.patientId &&
            a.agendaId === this.selected?.agendaId &&
            a.status === "REGISTRADO",
        )
    );
  }
  reprogram() {
    const a = this.affectedTurn();
    if (a) this.s.appointmentPanel.set({ id: a.id, reschedule: true });
  }
}
