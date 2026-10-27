import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { WorkspaceStore } from "./core/workspace.store";
import { AppointmentPanel } from "./ui/appointment-panel";
import { Icon } from "./ui/icon";
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, AppointmentPanel, Icon],
  template: `<router-outlet /><app-appointment-panel />
    @if (s.toast()) {
      <div class="toast" role="status">
        <app-icon name="check" />{{ s.toast()
        }}<button
          class="icon-btn"
          aria-label="Cerrar aviso"
          (click)="s.toast.set('')"
        >
          <app-icon name="close" />
        </button>
      </div>
    }`,
})
export class App {
  readonly s = inject(WorkspaceStore);
  constructor() {
    if (sessionStorage.getItem("patio-mode") !== "demo") return;
    let view: { role?: string; independent?: boolean } = {};
    try {
      view = JSON.parse(localStorage.getItem("patio-demo-view") || "{}");
    } catch {}
    this.s.startDemo(
      view.role === "administrador" ? "administrador" : view.role === "profesional" ? "profesional" : "secretaria",
      !!view.independent,
    );
  }
}
