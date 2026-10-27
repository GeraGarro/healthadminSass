import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { Icon } from "./icon";
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: "app-status",
  standalone: true,
  template: `<span
    class="status"
    [class.confirmed]="good"
    [class.cancelled]="cancelled"
    ><span class="status-dot"></span>{{ label }}</span
  >`,
})
export class Status {
  @Input() value = "PENDIENTE";
  get good() {
    return [
      "CONFIRMADA",
      "ACTIVO",
      "ACTIVA",
      "ENTREGADO",
      "VERIFICADA",
      "RESUELTA",
      "RESUELTO",
    ].includes(this.value);
  }
  get cancelled() {
    return ["CANCELADO", "RECHAZADA", "FALLIDO"].includes(this.value);
  }
  get label() {
    return (
      (
        {
          PENDIENTE: "Por confirmar",
          CONFIRMADA: "Confirmado",
          REGISTRADO: "Registrado",
          CANCELADO: "Cancelado",
          ACTIVO: "Activo",
          ACTIVA: "Activa",
          FALLIDO: "Sin entregar",
          ENTREGADO: "Entregado",
          RESUELTA: "Resuelta",
          RESUELTO: "Resuelto",
          RECHAZADA: "Rechazada",
          VERIFICADA: "Verificada",
        } as Record<string, string>
      )[this.value] || this.value
    );
  }
}
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: "app-empty",
  standalone: true,
  imports: [Icon],
  template: `<div class="empty-state">
    <app-icon [name]="icon" />
    <h3>{{ title }}</h3>
    <p>{{ text }}</p>
    <ng-content />
  </div>`,
})
export class Empty {
  @Input() title = "Todo al día";
  @Input() text = "No hay pendientes para esta selección.";
  @Input() icon = "calendar";
}
