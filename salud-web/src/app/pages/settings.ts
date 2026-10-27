import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormFeedback } from "../ui/form-feedback";
import { RouterLink } from "@angular/router";
import { WorkspaceStore } from "../core/workspace.store";
import { zonedTimestamp, minutes, timeLabel } from "../core/domain";
import { AGENDA_PERMISSIONS } from "../core/demo-data";
import { Icon } from "../ui/icon";
import { Empty } from "../ui/shared";
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormFeedback, FormsModule, RouterLink, Icon, Empty],
  templateUrl: "./settings.html",
})
export class Settings {
  readonly s = inject(WorkspaceStore);
  private readonly cdr = inject(ChangeDetectorRef);
  tab = this.s.role() === "administrador" ? "account" : "availability";
  error = "";
  saving = false;
  agendaId = this.s.data().agendas[0]?.id || "";
  days = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];
  hours = { day: 1, start: "08:00", end: "18:00", from: this.s.today };
  absence = {
    from: this.s.today,
    until: this.s.today,
    start: "08:00",
    end: "18:00",
    reason: "",
  };
  memberId = "";
  delegationPermissions = ["agenda:read", "booking:read"];
  allPermissions = AGENDA_PERMISSIONS;
  absenceKey = "";
  absenceFingerprint = "";
  showAbsence = false;
  confirmReset = false;
  get agenda() {
    return this.s.agenda(this.agendaId);
  }
  get configurable() {
    return this.s
      .data()
      .agendas.filter((a) => a.permissions.includes("agenda:configure"));
  }
  get owned() {
    return this.s.data().agendas.filter((a) => a.owner);
  }
  get schedule() {
    return this.s
      .data()
      .hours.filter((h) => h.agendaId === this.agendaId)
      .sort((a, b) => a.day - b.day);
  }
  get affected() {
    return this.s
      .data()
      .appointments.filter(
        (a) =>
          a.agendaId === this.agendaId &&
          a.status === "REGISTRADO" &&
          `${a.date}T${a.time}` < `${this.absence.until}T${this.absence.end}` &&
          `${a.date}T${timeLabel(minutes(a.time) + a.duration)}` >
            `${this.absence.from}T${this.absence.start}`,
      );
  }
  get delegations() {
    return this.s
      .data()
      .delegations.filter((d) => d.agendaId === this.agendaId);
  }
  label(p: string) {
    return (
      (
        {
          "agenda:read": "Ver agenda",
          "agenda:configure": "Configurar horarios y ofertas",
          "booking:read": "Ver turnos",
          "booking:create": "Registrar turnos",
          "booking:confirm": "Confirmar asistencia",
          "booking:cancel": "Cancelar turnos",
          "booking:reschedule": "Reprogramar turnos",
        } as Record<string, string>
      )[p] || p
    );
  }
  toggle(p: string) {
    this.delegationPermissions = this.delegationPermissions.includes(p)
      ? this.delegationPermissions.filter((v) => v !== p)
      : [...this.delegationPermissions, p];
  }
  async execute(work: () => Promise<void>) {
    this.saving = true;
    this.error = "";
    try {
      await work();
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.saving = false;
    }
  }
  saveHours() {
    return this.execute(async () => {
      if (!this.agenda?.permissions.includes("agenda:configure"))
        throw new Error("Elegí una agenda con configuración habilitada.");
      if (this.hours.start >= this.hours.end)
        throw new Error(
          "El horario de cierre debe ser posterior a la apertura.",
        );
      await this.s.command(
        `/agendas/${this.agendaId}/hours`,
        {
          ...this.hours,
          start: `${this.hours.start}:00`,
          end: `${this.hours.end}:00`,
          until: null,
        },
        "Horario de atención añadido.",
      );
      if (this.s.demo())
        this.s.mutate((d) => ({
          ...d,
          hours: [...d.hours, { agendaId: this.agendaId, ...this.hours }],
        }));
    });
  }
  saveAbsence() {
    return this.execute(async () => {
      if (!this.agenda?.permissions.includes("booking:reschedule"))
        throw new Error("No tenés facultad de reprogramación en esta agenda.");
      if (!this.absence.reason.trim())
        throw new Error("Indicá el motivo interno de la ausencia.");
      const start = zonedTimestamp(
          this.absence.from,
          this.absence.start,
          this.agenda.timezone,
        ),
        end = zonedTimestamp(
          this.absence.until,
          this.absence.end,
          this.agenda.timezone,
        );
      if (start >= end)
        throw new Error(
          "El final de la ausencia debe ser posterior al inicio.",
        );
      const body = { start, end, reason: this.absence.reason };
      const fp = JSON.stringify({ agendaId: this.agendaId, ...body });
      if (fp !== this.absenceFingerprint) {
        this.absenceFingerprint = fp;
        this.absenceKey = crypto.randomUUID();
      }
      const affected = [...this.affected];
      await this.s.command(
        `/agendas/${this.agendaId}/absences`,
        body,
        "Ausencia registrada. Los turnos conservan su horario hasta ser reprogramados.",
        "POST",
        this.absenceKey,
      );
      if (this.s.demo())
        this.s.mutate((d) => ({
          ...d,
          absences: [
            ...d.absences,
            {
              agendaId: this.agendaId,
              start: `${this.absence.from}T${this.absence.start}`,
              end: `${this.absence.until}T${this.absence.end}`,
              reason: this.absence.reason,
            },
          ],
          items: [
            ...d.items,
            ...affected.map((a) => ({
              id: crypto.randomUUID(),
              type: "reprogramacion" as const,
              name: this.s.patientName(a.patientId),
              detail:
                "Ausencia profesional · aviso obligatorio por WhatsApp en cola de demostración",
              date: a.date,
              state: "PENDIENTE",
              patientId: a.patientId,
              agendaId: a.agendaId,
              appointmentId: a.id,
            })),
          ],
          notices: [
            ...d.notices,
            {
              id: crypto.randomUUID(),
              title: "Ausencia profesional registrada",
              detail: `${affected.length} turnos requieren seguimiento de aviso y nuevo horario.`,
              time: "Ahora",
              read: false,
              kind: "reprogramacion",
              state: "PENDIENTE",
            },
          ],
        }));
      this.showAbsence = false;
      this.absence.reason = "";
    });
  }
  delegate() {
    return this.execute(async () => {
      if (!this.agenda?.owner)
        throw new Error("Solo el titular puede delegar acciones.");
      if (!this.memberId || !this.delegationPermissions.length)
        throw new Error("Elegí una membresía y al menos una acción.");
      await this.s.command(
        `/agendas/${this.agendaId}/delegations`,
        {
          membershipId: this.memberId,
          permissions: this.delegationPermissions,
        },
        "Delegación otorgada para las acciones seleccionadas.",
      );
      if (this.s.demo())
        this.s.mutate((d) => ({
          ...d,
          delegations: [
            ...d.delegations,
            {
              id: crypto.randomUUID(),
              agendaId: this.agendaId,
              memberId: this.memberId,
              name:
                this.s.members().find((m) => m.id === this.memberId)?.name ||
                "",
              permissions: [...this.delegationPermissions],
            },
          ],
        }));
      this.memberId = "";
    });
  }
  revoke(id: string) {
    return this.execute(async () => {
      if (!this.agenda?.owner)
        throw new Error("Solo el titular puede revocar esta delegación.");
      await this.s.command(
        `/agendas/${this.agendaId}/delegations/${id}`,
        undefined,
        "Delegación revocada. Se aplica desde la siguiente operación.",
        "DELETE",
      );
      if (this.s.demo())
        this.s.mutate((d) => ({
          ...d,
          delegations: d.delegations.filter((x) => x.id !== id),
        }));
    });
  }
  reset() {
    this.s.startDemo(
      this.s.role(),
      this.s.entity().type === "INDEPENDIENTE",
      true,
    );
    this.confirmReset = false;
    this.s.flash("Demostración restaurada a su estado inicial.");
  }
}
