import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ElementRef,
  Injector,
  ViewChild,
  afterNextRender,
  effect,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { WorkspaceStore } from "../core/workspace.store";
import {
  addDays,
  dateLabel,
  monthDates,
  parseDate,
  weekDates,
  minutes,
} from "../core/domain";
import type { Appointment } from "../core/models";
import { Icon } from "./icon";
import { Status, Empty } from "./shared";
import { StaffStore } from '../core/staff.store';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: "app-calendar",
  standalone: true,
  imports: [FormsModule, Icon, Status, Empty],
  templateUrl: "./calendar.html",
})
export class Calendar {
  readonly s = inject(WorkspaceStore);
  readonly staff=inject(StaffStore);
  currentDate(zone=this.columns[0]?.timezone){return this.s.demo()?this.s.today:new Intl.DateTimeFormat('en-CA',{timeZone:zone||'America/Argentina/Buenos_Aires'}).format(new Date(this.s.clock()));}
  temporalState(turn:Appointment){const reception=this.staff.reception()[turn.id];if(reception==='FINALIZADO')return'finished';if(reception==='ATENCION')return'attending';if(reception==='ESPERA')return'waiting';const zone=this.s.agenda(turn.agendaId)?.timezone,today=this.currentDate(zone),now=minutes(this.s.timeInZone(zone));if(turn.date<today||turn.date===today&&minutes(turn.time)+turn.duration<=now)return'elapsed';if(turn.date===today&&minutes(turn.time)<=now)return'scheduled-now';return'upcoming';}
  temporalLabel(turn:Appointment){return({'finished':'Atendido','attending':'En atención','waiting':'En espera','elapsed':'Horario pasado','scheduled-now':'Hora prevista actual','upcoming':'Próximo'} as Record<string,string>)[this.temporalState(turn)];}
  pastHeight(zone:string){const today=this.currentDate(zone);return this.s.date()<today?this.timelineHeight:this.s.date()>today?0:Math.max(0,Math.min(this.timelineHeight,(minutes(this.s.timeInZone(zone))-this.startHour*60)*this.hourHeight/60));}
  receptionLabel(id:string){return ({ESPERA:'En espera',ATENCION:'En atención',FINALIZADO:'Atendido'} as Record<string,string>)[this.staff.reception()[id]]||'';}
  scheduled(agendaId:string,hour:string){const day=parseDate(this.s.date()).getDay()||7;return this.s.data().hours.some(h=>h.agendaId===agendaId&&h.day===day&&h.from<=this.s.date()&&h.start<=hour&&h.end>hour);}
  free(agendaId:string,hour:string){const start=minutes(hour),zone=this.s.agenda(agendaId)?.timezone,today=this.currentDate(zone);return(this.s.date()>today||this.s.date()===today&&hour>this.s.timeInZone(zone))&&this.scheduled(agendaId,hour)&&!this.appointments(this.s.date(),agendaId).some(t=>minutes(t.time)<start+30&&minutes(t.time)+t.duration>start)&&!this.s.data().absences.some(a=>a.agendaId===agendaId&&`${this.s.date()}T${hour}`>=a.start&&`${this.s.date()}T${hour}`<a.end);}
  @Input() compact = false;
  @Input() attendance = "";
  @Input() showAgendaFilter = true;
  @ViewChild("timelineScroll") timelineScroll?: ElementRef<HTMLDivElement>;
  private readonly injector = inject(Injector);
  private readonly viewState = signal<"day" | "week" | "month" | "list">("day");
  private readonly scrollPositions = new Map<string, { top: number; left: number }>();
  private currentScrollKey = "";
  get view() { return this.viewState(); }
  set view(value: "day" | "week" | "month" | "list") { this.viewState.set(value); }
  constructor() {
    effect(() => {
      this.s.activeAgendas();
      const key = `${this.s.entity().id}:${this.s.date()}:${this.s.selectedAgenda()}:${this.viewState()}`;
      afterNextRender(() => {
        this.currentScrollKey = key;
        const element = this.timelineScroll?.nativeElement;
        if (!element || this.view !== "day") return;
        const saved = this.scrollPositions.get(key);
        element.scrollTo({
          top: saved?.top ?? (this.s.date() === this.s.today ? Math.max(0, this.nowPosition - this.hourHeight * 0.5) : 0),
          left: saved?.left ?? 0,
        });
      }, { injector: this.injector });
    });
  }
  rememberScroll() {
    const element = this.timelineScroll?.nativeElement;
    if (element) this.scrollPositions.set(this.currentScrollKey, { top: element.scrollTop, left: element.scrollLeft });
  }
  navigateTimeline(event: KeyboardEvent) {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "Enter"].includes(event.key)) return;
    const element = this.timelineScroll?.nativeElement;
    if (!element) return;
    const cells = [...element.querySelectorAll<HTMLButtonElement>("button[data-minute]:not(:disabled)")];
    const current = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-minute]");
    if (event.key === "Enter" && current) return;
    event.preventDefault();
    if (!current) {
      const upcoming = cells.filter((cell) => cell.classList.contains("calendar-event"));
      const target = upcoming.find((cell) => Number(cell.dataset["minute"]) >= minutes(this.referenceTime)) || upcoming[0] || cells[0];
      target?.focus();
      return;
    }
    const column = Number(current.dataset["column"]), time = Number(current.dataset["minute"]);
    const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
    const targetColumn = horizontal ? column + (event.key === "ArrowLeft" ? -1 : 1) : column;
    const candidates = cells.filter((cell) => Number(cell.dataset["column"]) === targetColumn)
      .sort((a, b) => Number(a.dataset["minute"]) - Number(b.dataset["minute"]) || Number(b.classList.contains("calendar-event")) - Number(a.classList.contains("calendar-event")));
    const unique = candidates.filter((cell, index) => !index || cell.dataset["minute"] !== candidates[index - 1].dataset["minute"]);
    const target = horizontal ? unique.reduce<HTMLButtonElement | undefined>((nearest, cell) => !nearest || Math.abs(Number(cell.dataset["minute"]) - time) < Math.abs(Number(nearest.dataset["minute"]) - time) ? cell : nearest, undefined)
      : event.key === "Home" ? unique[0]
      : event.key === "End" ? unique.at(-1)
      : event.key === "ArrowUp" ? unique.filter((cell) => Number(cell.dataset["minute"]) < time).at(-1)
      : unique.find((cell) => Number(cell.dataset["minute"]) > time);
    target?.focus();
  }
  minuteOf(time: string) { return minutes(time); }
  goToday() {
    this.scrollPositions.delete(`${this.s.entity().id}:${this.s.today}:${this.s.selectedAgenda()}:day`);
    this.s.date.set(this.s.today);
    this.view = "day";
    afterNextRender(() => {
      this.timelineScroll?.nativeElement.scrollTo({ top: Math.max(0, this.nowPosition - this.hourHeight * 0.5) });
    }, { injector: this.injector });
  }
  get hourHeight() {
    const duration = Math.min(30, ...this.appointments(this.s.date()).map((turn) => Math.max(5, turn.duration)));
    return Math.max(144, Math.ceil(72 * 60 / duration));
  }
  get startHour() {
    return Math.min(
      8,
      ...this.s
        .data()
        .hours.filter((h) => this.columns.some((a) => a.id === h.agendaId))
        .map((h) => Math.floor(minutes(h.start) / 60)),
      ...this.appointments(this.s.date()).map((a) =>
        Math.floor(minutes(a.time) / 60),
      ),
    );
  }
  get endHour() {
    return Math.min(
      24,
      Math.max(
        19,
        ...this.s
          .data()
          .hours.filter((h) => this.columns.some((a) => a.id === h.agendaId))
          .map((h) => Math.ceil(minutes(h.end) / 60)),
        ...this.appointments(this.s.date()).map((a) =>
          Math.ceil((minutes(a.time) + a.duration) / 60),
        ),
      ),
    );
  }
  get hours() {
    return Array.from(
      { length: this.endHour - this.startHour + 1 },
      (_, i) => `${String(i + this.startHour).padStart(2, "0")}:00`,
    );
  }
  get zoneLabel() {
    const zones = [...new Set(this.columns.map((a) => a.timezone))];
    return zones.length === 1
      ? new Intl.DateTimeFormat("es-AR", {
          timeZone: zones[0],
          timeZoneName: "shortOffset",
        })
          .formatToParts(new Date())
          .find((p) => p.type === "timeZoneName")?.value || "Local"
      : "Local";
  }
  get referenceTime() {
    return this.s.timeInZone(this.columns[0]?.timezone);
  }
  get nowPosition() {
    return ((minutes(this.referenceTime) - this.startHour * 60) * this.hourHeight) / 60;
  }
  weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  dateLabel = dateLabel;
  get days() {
    return this.view === "month"
      ? monthDates(this.s.date())
      : weekDates(this.s.date());
  }
  get month() {
    return dateLabel(this.s.date(), { month: "long", year: "numeric" });
  }
  get columns() {
    return this.s.activeAgendas();
  }
  get timelineHeight() {
    return this.hours.length * this.hourHeight;
  }
  changeDate(amount: number) {
    if (this.view === "month") {
      const d = parseDate(this.s.date());
      d.setDate(1);
      d.setMonth(d.getMonth() + amount);
      this.s.date.set(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
      );
    } else
      this.s.date.set(
        addDays(this.s.date(), amount * (this.view === "week" ? 7 : 1)),
      );
  }
  appointments(date: string, agenda?: string) {
    return this.s
      .visibleAppointments()
      .filter(
        (a) =>
          a.date === date &&
          a.status === "REGISTRADO" &&
          (!agenda || a.agendaId === agenda) &&
          (!this.attendance || a.attendance === this.attendance),
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  }
  top(a: Appointment) {
    return ((minutes(a.time) - this.startHour * 60) * this.hourHeight) / 60;
  }
  height(a: Appointment) {
    return Math.max((a.duration * this.hourHeight) / 60 - 4, 68);
  }
  select(date: string) {
    this.s.date.set(date);
    this.view = "day";
  }
  monthDay(date: string) {
    return parseDate(date).getDate();
  }
  outside(date: string) {
    return date.slice(0, 7) !== this.s.date().slice(0, 7);
  }
  weekLabel(date: string) {
    return dateLabel(date, { weekday: "short" });
  }
}
