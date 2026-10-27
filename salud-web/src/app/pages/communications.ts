import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { readAllPages } from "../core/paging";
import { WorkspaceStore } from "../core/workspace.store";
import { Icon } from "../ui/icon";
import { Empty } from "../ui/shared";
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormsModule, Icon, Empty],
  template: `
    <div class="page-heading">
      <div>
        <h1>Comunicaciones</h1>
        <p>Avisos, entregas y acciones que requieren seguimiento.</p>
      </div>
      <button class="btn" [disabled]="loading" (click)="load()">
        <app-icon name="refresh" />Actualizar
      </button>
    </div>
    <div class="tabs">
      <button [class.active]="tab === 'notices'" (click)="tab = 'notices'">
        Mis notificaciones <span>{{ s.unread() }}</span>
      </button>
      @if (s.has("notifications:manage")) {
        <button [class.active]="tab === 'delivery'" (click)="tab = 'delivery'">
          Seguimiento de envíos
        </button>
      }
    </div>
    @if (error) {
      <div class="alert error" role="alert">{{ error }}</div>
    }
    @if (tab === "notices") {
      <section class="panel">
        <div class="directory-toolbar">
          <h2>Lo que necesitás saber</h2>
          <label class="checkbox-label"
            ><input type="checkbox" [(ngModel)]="onlyUnread" />Solo sin
            leer</label
          >
        </div>
        @for (notice of notices; track notice.id) {
          <div class="notice-row" [class.unread]="!notice.read" [class.urgent-notice-row]="notice.kind==='urgente'">
            <span class="notice-icon"
              ><app-icon
                [name]="
                  notice.kind === 'envio'
                    ? 'mail'
                    : notice.kind === 'reprogramacion'
                      ? 'refresh'
                      : 'bell'
                "
            /></span>
            <div>
              <h3>{{ notice.title }}</h3>
              <p>{{ notice.detail }}</p>
              <small>{{ notice.time }}</small>
            </div>
            @if (!notice.read) {
              <button
                class="btn small"
                [disabled]="saving === notice.id"
                (click)="read(notice.id)"
              >
                Marcar leída
              </button>
            } @else {
              <span class="read-label"><app-icon name="check" />Leída</span>
            }
          </div>
        }
        @if (!notices.length) {
          <app-empty
            title="Estás al día"
            text="No hay notificaciones para estos filtros."
            icon="bell"
          />
        }
      </section>
    }
    @if (tab === "delivery") {
      <div class="alert info">
        <app-icon name="help" /><span
          >Un aviso entregado no confirma asistencia. Las ausencias generan
          WhatsApp para todos los turnos afectados.</span
        >
      </div>
      <section class="panel">
        <div class="directory-toolbar">
          <h2>Cola de comunicaciones</h2>
          <select [(ngModel)]="taskFilter" aria-label="Filtrar envíos">
            <option value="all">Todos los estados</option>
            <option value="REVISION">Requieren revisión</option>
            <option value="PENDIENTE">Pendientes</option>
          </select>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Comunicación</th>
                <th>Programada</th>
                <th>Estado</th>
                <th>Intentos</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (task of visibleTasks; track task.id) {
                <tr>
                  <td>
                    <strong>{{ label(task.type) }}</strong>
                    @if (task.error) {
                      <small class="cell-note">{{ task.error }}</small>
                    }
                  </td>
                  <td>{{ task.date }}</td>
                  <td>
                    <span class="plain-state">{{
                      task.state === "REVISION"
                        ? "Revisar entrega"
                        : task.state === "PENDIENTE"
                          ? "En cola"
                          : task.state
                    }}</span>
                  </td>
                  <td>{{ task.attempts }}</td>
                  <td>
                    @if (canRetry(task)) {
                      <button
                        class="btn small"
                        [disabled]="saving === task.id"
                        (click)="retry(task)"
                      >
                        Reintentar aviso
                      </button>
                    } @else {
                      <span class="subtle">{{
                        task.type === "CLOSE"
                          ? "Revisión asistida"
                          : "Sin acción pendiente"
                      }}</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (!visibleTasks.length) {
          <app-empty
            title="No hay envíos en esta selección"
            text="Las tareas aparecerán cuando se programen avisos."
            icon="mail"
          />
        }
      </section>
      <div class="confirmation-flow">
        <h2>El recorrido de una confirmación</h2>
        <div>
          <span
            ><app-icon name="mail" /><b>Entre 72 y 48 h antes</b
            ><small>Un correo de confirmación</small></span
          ><app-icon name="arrow" /><span
            ><app-icon name="phone" /><b>36 h antes</b
            ><small>WhatsApp si sigue pendiente</small></span
          ><app-icon name="arrow" /><span
            ><app-icon name="shield" /><b>24 h antes</b
            ><small>Evaluación según política aprobada</small></span
          >
        </div>
        <p>
          Las excepciones de entrega o plazo pasan a revisión. No se infiere
          confirmación por la lectura del aviso.
        </p>
      </div>
    }
  `,
})
export class Communications implements OnInit {
  readonly s = inject(WorkspaceStore);
  private readonly cdr = inject(ChangeDetectorRef);
  tab = "notices";
  onlyUnread = false;
  taskFilter = "all";
  tasks: any[] = [];
  error = "";
  saving = "";
  loading = false;
  ngOnInit() {
    this.load();
  }
  get notices() {
    return this.s.data().notices.filter((n) => !this.onlyUnread || !n.read);
  }
  get visibleTasks() {
    return this.tasks.filter(
      (t) => this.taskFilter === "all" || t.state === this.taskFilter,
    );
  }
  label(type: string) {
    return (
      (
        {
          CONFIRMATION_EMAIL: "Confirmación por correo",
          BACKUP_WHATSAPP: "Respaldo por WhatsApp",
          ABSENCE_WHATSAPP: "Ausencia profesional · WhatsApp",
          CANCELLED_PERIOD_EMAIL: "Agenda cancelada · Correo",
          CANCELLED_PERIOD_WHATSAPP: "Agenda cancelada · WhatsApp",
          CLOSE: "Evaluación de cierre",
        } as Record<string, string>
      )[type] || type
    );
  }
  async load() {
    this.loading = true;
    this.error = "";
    try {
      if (this.s.demo()) {
        this.tasks = [
          {
            id: "n3",
            type: "ABSENCE_WHATSAPP",
            date: "20/10/2026 09:20",
            state:
              this.s.data().notices.find((n) => n.id === "n3")?.state ===
              "PENDIENTE"
                ? "PENDIENTE"
                : "REVISION",
            attempts: 2,
            error: "Demostración de un aviso sin entregar",
          },
          {
            id: "t2",
            type: "CONFIRMATION_EMAIL",
            date: "21/10/2026 10:00",
            state: "PENDIENTE",
            attempts: 0,
            error: "",
          },
        ];
      } else if (this.s.has("notifications:manage")) {
        const r = await readAllPages<any>(
          this.s.api,
          `${this.s.base}/workspace/lists/tasks`,
        );
        this.tasks = r.map((t: any) => ({
          id: t.id,
          type: t.tipo,
          date: new Date(t.programada_en).toLocaleString("es-AR"),
          state: t.estado,
          attempts: t.intentos,
          error: t.ultimo_error,
        }));
      }
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.loading = false;
    }
  }
  canRetry(t: any) {
    return (
      ["REVISION", "REINTENTO"].includes(t.state) &&
      ["CONFIRMATION_EMAIL", "BACKUP_WHATSAPP", "ABSENCE_WHATSAPP", "CANCELLED_PERIOD_EMAIL", "CANCELLED_PERIOD_WHATSAPP"].includes(
        t.type,
      )
    );
  }
  async read(id: string) {
    this.saving = id;
    try {
      await this.s.markNotice(id);
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.saving = "";
    }
  }
  async retry(task: any) {
    this.saving = task.id;
    this.error = "";
    try {
      await this.s.command(
        `/tasks/${task.id}/retry`,
        undefined,
        "Aviso puesto nuevamente en cola. No implica entrega.",
      );
      if (this.s.demo()) {
        this.s.mutate((d) => ({
          ...d,
          notices: d.notices.map((n) =>
            n.id === task.id ? { ...n, state: "PENDIENTE" } : n,
          ),
        }));
      }
      await this.load();
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.saving = "";
    }
  }
}
