import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject } from "@angular/core";
import { Icon } from "./icon";
import { WorkspaceStore } from "../core/workspace.store";

@Component({
  selector: "app-help-panel",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [Icon],
  template: `<dialog #dialog class="help-dialog" aria-labelledby="help-title" (close)="restoreFocus()" (click)="backdrop($event)">
    <header><h2 id="help-title">{{ s.role() === 'administrador' ? 'Ayuda para tu institución' : 'Ayuda para tu jornada' }}</h2><button class="icon-btn" aria-label="Cerrar ayuda" (click)="dialog.close()"><app-icon name="close" /></button></header>
    <div class="help-content">
      @if (s.role() === 'administrador') {
      <details open><summary>Incorporar y consultar profesionales</summary><p>En Profesionales, buscá por nombre o matrícula y filtrá por vínculo o sede. Seleccioná un nombre para consultar su incorporación, sedes y agendas.</p><p>Para incorporar a una persona necesitás su cuenta existente y su matrícula verificada. Plataforma gestiona la creación y activación de cuentas nuevas. Las sedes y agendas se crean desde Sedes y agendas.</p></details>
      <details><summary>Equipo y facultades</summary><p>En Equipo y permisos, agregá una cuenta existente o editá las facultades de una membresía activa. Las facultades corresponden únicamente a la institución seleccionada.</p><p>La membresía no concede agenda ni chat. Cada profesional titular delega acciones de sus agendas; las conversaciones requieren participación explícita. Las pantallas disponibles dependen de las facultades efectivas de tu cuenta.</p></details>
      <details><summary>Baja institucional y continuidad</summary><p>Abrí un profesional y elegí Revisar baja institucional. Revisá las consecuencias y confirmá la operación. Los turnos futuros y las pre-reservas vigentes deben resolverse antes de finalizar el vínculo.</p><p>La baja conserva la cuenta global, el fichaje, el historial y los vínculos con otras entidades. La continuidad como independiente se tramita con plataforma. Esta baja no elimina la cuenta del profesional.</p></details>
      <details><summary>Políticas, auditoría y teclado</summary><p>Los cambios en políticas requieren una referencia de aprobación y crean una nueva versión. Auditoría permite revisar responsable, acción, fecha, recurso y resultado, con filtros por página.</p><p>Tab recorre los controles. Escape cierra la confirmación de baja y la navegación móvil. El cambio de institución descarta los formularios abiertos para mantener separados sus datos.</p></details>
      } @else {
      <details open><summary>Registrar y confirmar un turno</summary>
        <p>En Nuevo turno, elegí paciente, agenda, práctica, fecha y un horario disponible. El registro vuelve a verificar la disponibilidad.</p>
        <p>Una pre-reserva aparta temporalmente un horario. El turno queda registrado al completar el registro. La confirmación de asistencia es una acción posterior y se realiza desde el detalle del turno.</p>
      </details>
      <details><summary>Reprogramar o cancelar</summary>
        <p>Abrí el turno y elegí Reprogramar para consultar otro horario del mismo profesional. Revisá la fecha y la agenda antes de guardar.</p>
        <p>Para cancelar, indicá el motivo y revisá la confirmación. La cancelación libera el horario y conserva el historial.</p>
      </details>
      <details><summary>Avisos, mensajes y borradores</summary>
        <p>Entregar un aviso no confirma asistencia. Las conversaciones humanas no cambian turnos: las reprogramaciones se gestionan desde la agenda.</p>
        <p>Los borradores de turnos y mensajes se conservan en memoria mientras continuás en el mismo contexto. No reservan horarios ni envían mensajes. Se eliminan al cambiar de entidad, rol o cuenta, y al recargar la aplicación.</p>
      </details>
      <details><summary>Usar el teclado y leer la agenda</summary>
        <p>Tab recorre los controles y Escape cierra los paneles. En escritorio, Ctrl K o Cmd K abre la búsqueda de pacientes.</p>
        <p>Dentro del calendario diario, las flechas recorren horarios y profesionales; Enter activa el turno o el horario elegido. Inicio y Fin llevan al primer y último elemento de una agenda. Podés usar Lista para leer todos los datos en filas.</p>
        <p>El fondo identifica al profesional. La etiqueta Confirmado o Pendiente indica la asistencia del paciente.</p>
      </details>
      }
    </div>
  </dialog>`,
})
export class HelpPanel {
  readonly s = inject(WorkspaceStore);
  @ViewChild("dialog", { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  private returnTo?: HTMLElement;
  open(returnTo?: HTMLElement) {
    this.returnTo = returnTo;
    this.dialog.nativeElement.showModal();
  }
  restoreFocus() { this.returnTo?.focus(); }
  backdrop(event: MouseEvent) {
    if (event.target === this.dialog.nativeElement) this.dialog.nativeElement.close();
  }
}
