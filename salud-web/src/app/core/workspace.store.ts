import {
  DestroyRef,
  Injectable,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from "@angular/core";
import { ApiClient, ApiError } from "./api.client";
import { TemporaryDrafts } from "./temporary-drafts";
import { createDemo } from "./demo-data";
import {
  DEMO_DATE,
  TIMEZONE,
  can,
  dateKey,
  hasConflict,
  localTime,
  minutes,
  normalized,
  timeLabel,
  zonedTimestamp,
} from "./domain";
import type {
  Agenda,
  BookingInput,
  Entity,
  Patient,
  Role,
  Workspace,
} from "./models";
import type { MessageDto, PatientDetailDto, SessionDto } from "./api-contracts";
import { readAllPages, settleLimited } from "./paging";
import type { AppointmentDto } from "./api-contracts";
import {
  emptyWorkspace as empty,
  loadWorkspace,
  calendarWindow,
  appointmentFromDto,
} from "./workspace.loader";

@Injectable({ providedIn: "root" })
export class WorkspaceStore {
  readonly api = inject(ApiClient);
  private readonly drafts = inject(TemporaryDrafts);
  private agendaPreferenceInitialized = false;
  readonly demo = signal(false);
  readonly sessionReady = signal(false);
  readonly passwordChangeRequired = signal(false);
  readonly calendarBusy = signal(false);
  readonly loadedWindow = signal<{ from: string; until: string } | null>(null);
  readonly appointmentLoading = signal(false);
  readonly detailError = signal("");
  private calendarEpoch = 0;
  readonly role = signal<Role>("secretaria");
  readonly independentOwner = signal(false);
  readonly roleLabel = computed(() => this.role() === "administrador" ? "Administrador de institución" : this.role() === "profesional" ? "Profesional" : "Secretaría");
  readonly home = computed(() => {
    if (this.role() !== "administrador") return "/inicio";
    if (this.has("professionals:manage")) return "/institucion/profesionales";
    if (this.has("members:manage")) return "/institucion/equipo";
    if (this.has("policy:manage")) return "/institucion/politicas";
    return "/institucion/auditoria";
  });
  readonly entity = signal<Entity>({
    id: "",
    name: "",
    type: "",
  });
  readonly entities = signal<Entity[]>([]);
  readonly user = signal({
    id: "demo-secretary",
    name: "Ana García",
    email: "ana@example.test",
  });
  readonly permissions = signal<string[]>([]);
  readonly members = signal<{ id: string; name: string }[]>([]);
  private readonly entityProfessionals = signal<{ id: string; name: string }[]>([]);
  readonly professionals = computed(() => this.demo() && this.role() !== "administrador"
    ? [...new Map(this.data().agendas.map(a => [a.professionalId, { id: a.professionalId, name: a.professional }])).values()]
    : this.entityProfessionals());
  readonly data = signal<Workspace>(empty());
  readonly busy = signal(false);
  readonly error = signal("");
  readonly partialErrors = signal<string[]>([]);
  readonly toast = signal("");
  readonly clock = signal(Date.now());
  readonly date = signal(DEMO_DATE);
  readonly selectedAgenda = signal("all");
  readonly search = signal("");
  readonly appointmentPanel = signal<{
    id?: string;
    date?: string;
    time?: string;
    agendaId?: string;
    patientId?: string;
    reschedule?: boolean;
  } | null>(null);
  readonly activeAgendas = computed(() =>
    this.data().agendas.filter(
      (a) => this.selectedAgenda() === "all" || a.id === this.selectedAgenda(),
    ),
  );
  readonly visibleAppointments = computed(() =>
    this.data().appointments.filter((a) =>
      this.activeAgendas().some((g) => g.id === a.agendaId),
    ),
  );
  readonly daily = computed(() =>
    this.visibleAppointments()
      .filter((a) => a.date === this.date() && a.status === "REGISTRADO")
      .sort((a, b) => a.time.localeCompare(b.time)),
  );
  readonly pending = computed(() =>
    this.data().items.filter((i) => i.state === "PENDIENTE"),
  );
  readonly unread = computed(
    () => this.data().notices.filter((n) => !n.read).length,
  );
  readonly urgentNotices=computed(()=>this.data().notices.filter(n=>!n.read&&n.kind==='urgente').length);
  readonly contextVersion = signal(0);
  private epoch = 0;
  private toastTimer?: ReturnType<typeof setTimeout>;
  private bookingKeys = new Map<
    string,
    { hold: string; complete: string; holdId?: string }
  >();
  constructor() {
    const timer = setInterval(() => this.clock.set(Date.now()), 60000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
    effect(() => {
      const date = this.date(),
        loaded = this.loadedWindow();
      if (
        !this.demo() &&
        loaded &&
        this.data().agendas.length &&
        !this.busy() &&
        calendarWindow(date).from !== loaded.from
      )
        untracked(() => void this.refreshCalendar());
    });
    effect(() => {
      if (this.api.expired() && !this.demo()) {
        this.invalidateContext();
        this.data.set(empty());
        this.permissions.set([]);
      }
    });
  }
  timeInZone(timezone = TIMEZONE): string {
    return this.demo()
      ? "10:20"
      : new Intl.DateTimeFormat("en-GB", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(new Date(this.clock()));
  }
  private invalidateContext(): void {
    this.independentOwner.set(false);
    this.drafts.clear();
    this.agendaPreferenceInitialized = false;
    this.epoch++;
    this.calendarEpoch++;
    this.calendarBusy.set(false);
    this.loadedWindow.set(null);
    this.appointmentLoading.set(false);
    this.detailError.set("");
    this.contextVersion.update((version) => version + 1);
    this.bookingKeys.clear();
    this.appointmentPanel.set(null);
    this.members.set([]);
    this.entityProfessionals.set([]);
    this.toast.set("");
    clearTimeout(this.toastTimer);
  }
  assertContext(version: number): void {
    if (version !== this.contextVersion())
      throw new Error(
        "El espacio de trabajo cambió. Volvé al contexto anterior y actualizalo para consultar el resultado.",
      );
  }
  private async refreshAfterWrite(version: number): Promise<void> {
    this.assertContext(version);
    try {
      await this.reload();
    } catch {
      this.assertContext(version);
      this.error.set("");
      this.partialErrors.update((e) => [
        ...e,
        "La acción se guardó, pero no se pudo actualizar la vista. Volvé a cargar el espacio.",
      ]);
    }
    this.assertContext(version);
  }
  get base(): string {
    return `/entities/${encodeURIComponent(this.entity().id)}`;
  }
  get today(): string {
    return this.demo()
      ? DEMO_DATE
      : new Intl.DateTimeFormat("en-CA", {
          timeZone: this.entity().timezone || TIMEZONE,
        }).format(new Date());
  }
  get isOwner(): boolean {
    return this.data().agendas.some((a) => a.owner);
  }
  has(permission: string): boolean {
    if(this.role()==='administrador' && ['patients:manage','admissions:manage','notifications:manage'].includes(permission)) return false;
    return this.permissions().includes(permission);
  }
  agendaCan(id: string, permission: string): boolean {
    return can(this.agenda(id), permission);
  }
  agenda(id: string): Agenda | undefined {
    return this.data().agendas.find((a) => a.id === id);
  }
  patient(id: string): Patient | undefined {
    return this.data().patients.find((p) => p.id === id);
  }
  patientName(id: string): string {
    const p = this.patient(id);
    return p
      ? `${p.firstName} ${p.lastName}`
      : this.data().appointments.find((a) => a.patientId === id)
          ?.patientLabel || "Paciente con acceso de agenda";
  }
  flash(message: string): void {
    this.toast.set(message);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(""), 4500);
  }
  private persist(): void {
    if (this.demo())
      try {
        localStorage.setItem(
          `patio-demo-v1-${this.entity().id}-${this.role()}`,
          JSON.stringify(this.data()),
        );
      } catch {
        /* Demo remains usable when storage is unavailable. */
      }
  }
  mutate(change: (data: Workspace) => Workspace): void {
    this.data.update(change);
    this.persist();
  }
  startDemo(
    role: Role = "secretaria",
    independent = false,
    reset = false,
  ): void {
    this.invalidateContext();
    this.demo.set(true);
    this.sessionReady.set(false);
    sessionStorage.setItem("patio-mode", "demo");
    this.role.set(role);
    this.independentOwner.set(role==='profesional'&&independent);
    this.entity.set({
      id: independent ? "demo-independent" : "demo-clinic",
      name: independent
        ? "Elena Martínez · independiente"
        : "Clínica del Parque",
      type: independent ? "INDEPENDIENTE" : "CLINICA",
    });
    this.entities.set([
      { id: "demo-clinic", name: "Clínica del Parque", type: "CLINICA" },
      {
        id: "demo-independent",
        name: "Elena Martínez · independiente",
        type: "INDEPENDIENTE",
      },
    ]);
    this.user.set({
      id: role === "administrador" ? "demo-administrator" : role === "profesional" ? "demo-professional" : "demo-secretary",
      name: role === "administrador" ? "Gabriela Torres" : role === "profesional" ? "Elena Martínez" : "Ana García",
      email: role === "administrador" ? "gabriela@example.test" : role === "profesional" ? "elena@example.test" : "ana@example.test",
    });
    this.permissions.set([
      "patients:manage",
      "admissions:manage",
      "catalog:manage",
      "coverage:manage",
      "notifications:manage",
      "audit:read",
      ...(role === "administrador" ? ["members:manage", "professionals:manage", "policy:manage"] : []),
      ...(role==='profesional'&&independent?['members:manage','professionals:manage','policy:manage']:[]),
    ]);
    this.members.set([
      { id: "member1", name: "Ana García" },
      { id: "member2", name: "Laura Costa" },
    ]);
    let data = createDemo(role, independent);
    if (!reset)
      try {
        const saved = JSON.parse(
          localStorage.getItem(`patio-demo-v1-${this.entity().id}-${role}`) ||
            "null",
        );
        if (saved?.agendas && saved?.appointments)
          data = {
            ...saved,
            absences: saved.absences || [],
            demoRecords: saved.demoRecords || {
              plans: [],
              agreements: [],
              authorizations: [],
              representations: [],
              access: [],
            },
          };
      } catch {
        /* Invalid demo state is replaced by the fixture. */
      }
    if (role === "administrador") {
      this.entityProfessionals.set(data.agendas.map(a => ({ id: a.professionalId, name: a.professional })));
      data = { ...data, patients: [], agendas: [], appointments: [], offers: [], hours: [], delegations: [], absences: [], conversations: [], notices: [], items: [] };
    }
    if(role==='secretaria'&&sessionStorage.getItem('patio-first-visit')==='true') data={...empty(),practices:data.practices,coverages:data.coverages};
    if(role==='secretaria'&&this.demo()) {
      try {
        const requests=JSON.parse(localStorage.getItem(`patio-staff-v2-${this.entity().id}-requests`)||'[]') as {tipo:string;solicitante_id:string;agenda_id:string;estado:string}[];
        const approved=requests.filter(r=>r.tipo==='AGENDA'&&r.solicitante_id===this.user().id&&r.estado==='APROBADA').map(r=>r.agenda_id);
        if(approved.length&&sessionStorage.getItem('patio-first-visit')!=='true'&&data.agendas.length===0){const fixture=createDemo(role,independent);data={...fixture,agendas:fixture.agendas.filter(a=>approved.includes(a.id)).map(a=>({...a,permissions:a.permissions.filter(p=>p!=='agenda:configure')})),appointments:fixture.appointments.filter(a=>approved.includes(a.agendaId)),hours:fixture.hours.filter(a=>approved.includes(a.agendaId)),offers:fixture.offers.filter(a=>approved.includes(a.agendaId)),patients:fixture.patients,conversations:[],notices:[],items:fixture.items.filter(i=>!!i.agendaId&&approved.includes(i.agendaId))};}
      } catch {}
    }
    this.data.set(data);
    this.selectedAgenda.set(role === "profesional" ? data.agendas.find((agenda) => agenda.owner)?.id || "all" : "all");
    this.agendaPreferenceInitialized = true;
    this.date.set(DEMO_DATE);
    this.search.set("");
    this.error.set("");
    this.partialErrors.set([]);
    this.appointmentPanel.set(null);
    this.api.expired.set(false);
    this.api.mfaRequired.set(false);
    this.bookingKeys.clear();
    this.busy.set(false);
    if (reset) this.persist();
    try {
      localStorage.setItem(
        "patio-demo-view",
        JSON.stringify({ role, independent }),
      );
    } catch {}
  }
  async establishSession(me: SessionDto): Promise<void> {
    this.invalidateContext();
    this.demo.set(false);
    this.sessionReady.set(true);
    this.passwordChangeRequired.set(!!me.account.cambio_clave_pendiente);
    this.data.set(empty());
    this.permissions.set([]);
    this.appointmentPanel.set(null);
    this.search.set("");
    this.bookingKeys.clear();
    this.user.set({
      id: me.account.id,
      name: me.account.nombre,
      email: me.account.email_acceso,
    });
    this.entities.set(
      me.entities.map((e) => ({ id: e.id, name: e.nombre, type: e.tipo })),
    );
    this.date.set(this.today);
  }
  async chooseEntity(id: string): Promise<void> {
    if (this.demo()) {
      this.startDemo(this.role(), id === "demo-independent");
      return;
    }
    const e = this.entities().find((e) => e.id === id);
    if (!e) throw new Error("Elegí un contexto habilitado.");
    this.invalidateContext();
    this.entity.set(e);
    this.selectedAgenda.set("all");
    this.appointmentPanel.set(null);
    this.data.set(empty());
    this.permissions.set([]);
    this.search.set("");
    this.bookingKeys.clear();
    await this.reload();
  }
  async reload(): Promise<void> {
    if (this.demo()) return;
    const epoch = ++this.epoch,
      base = this.base;
    this.busy.set(true);
    this.error.set("");
    this.partialErrors.set([]);
    try {
      const snapshot = await loadWorkspace(this.api, base, this.date());
      if (epoch !== this.epoch) return;
      this.permissions.set(snapshot.permissions);
      this.independentOwner.set(snapshot.independentOwner);
      this.members.set(snapshot.members);
      this.entityProfessionals.set(snapshot.professionals);
      this.role.set(
        !snapshot.independentOwner&&snapshot.permissions.some(p => ["members:manage", "professionals:manage", "policy:manage"].includes(p))
          ? "administrador"
          : snapshot.professional || snapshot.data.agendas.some((a) => a.owner)
          ? "profesional"
          : "secretaria",
      );
      this.loadedWindow.set(snapshot.range);
      if (snapshot.timezone)
        this.entity.update((e) => ({ ...e, timezone: snapshot.timezone }));
      this.data.set(snapshot.data);
      if (!this.agendaPreferenceInitialized) {
        this.selectedAgenda.set(snapshot.data.agendas.find((agenda) => agenda.owner)?.id || "all");
        this.agendaPreferenceInitialized = true;
      }
      this.partialErrors.set(snapshot.errors);
    } catch (e) {
      if (epoch === this.epoch) {
        this.data.set(empty());
        this.permissions.set([]);
        this.members.set([]);
        this.entityProfessionals.set([]);
        this.error.set(
          e instanceof Error ? e.message : "No se pudo cargar el espacio.",
        );
      }
      throw e;
    } finally {
      if (epoch === this.epoch) this.busy.set(false);
    }
  }
  clearSession(): void {
    this.invalidateContext();
    this.sessionReady.set(false);
    this.passwordChangeRequired.set(false);
    this.demo.set(false);
    this.data.set(empty());
    this.entities.set([]);
    this.permissions.set([]);
    this.search.set("");
    this.user.set({ id: "", name: "", email: "" });
  }
  async refreshCalendar(): Promise<void> {
    const epoch = ++this.calendarEpoch,
      context = this.contextVersion(),
      base = this.base,
      range = calendarWindow(this.date());
    const agendas = this.data().agendas.filter((a) => can(a, "booking:read"));
    this.calendarBusy.set(true);
    this.loadedWindow.set(range);
    this.data.update((d) => ({ ...d, appointments: [] }));
    try {
      const results = await settleLimited(
        agendas.map(
          (a) => () =>
            readAllPages<AppointmentDto>(
              this.api,
              `${base}/workspace/appointments?agendaId=${a.id}&from=${range.from}&until=${range.until}`,
            ),
        ),
      );
      if (epoch !== this.calendarEpoch || context !== this.contextVersion())
        return;
      this.data.update((d) => ({
        ...d,
        appointments: results.flatMap((r) =>
          r.status === "fulfilled" ? r.value.map(appointmentFromDto) : [],
        ),
      }));
      this.partialErrors.update((e) => [
        ...e,
        ...results.flatMap((r, i) =>
          r.status === "rejected"
            ? [`Turnos · ${agendas[i].name}: ${r.reason.message}`]
            : [],
        ),
      ]);
    } finally {
      if (epoch === this.calendarEpoch) this.calendarBusy.set(false);
    }
  }
  openAppointment(id: string): void {
    this.appointmentPanel.set({ id });
    this.detailError.set("");
    if (!this.demo()) void this.refreshAppointment(id);
  }
  async refreshAppointment(id: string): Promise<void> {
    const context = this.contextVersion();
    this.appointmentLoading.set(true);
    this.detailError.set("");
    try {
      const raw = await this.api.request<AppointmentDto>(
        `${this.base}/appointments/${id}`,
      );
      this.assertContext(context);
      if (this.appointmentPanel()?.id !== id) return;
      const update = appointmentFromDto(raw);
      this.data.update((d) => ({
        ...d,
        appointments: d.appointments.map((a) =>
          a.id === id
            ? {
                ...a,
                ...update,
                practice: a.practice,
                patientLabel: a.patientLabel,
                modality: a.modality,
              }
            : a,
        ),
      }));
    } catch (e) {
      if (
        context === this.contextVersion() &&
        this.appointmentPanel()?.id === id
      )
        this.detailError.set((e as Error).message);
    } finally {
      if (
        context === this.contextVersion() &&
        this.appointmentPanel()?.id === id
      )
        this.appointmentLoading.set(false);
    }
  }
  newAppointment(
    options: {
      date?: string;
      time?: string;
      agendaId?: string;
      patientId?: string;
    } = {},
  ): void {
    this.appointmentPanel.set({
      date: this.date(),
      agendaId: this.activeAgendas().find((a) => can(a, "booking:create"))?.id,
      ...options,
    });
  }
  async available(input: BookingInput): Promise<string[]> {
    const offer = this.data().offers.find((o) => o.id === input.offerId),
      agenda = this.agenda(input.agendaId);
    if (!offer || !agenda || !input.patientId) return [];
    if (!this.demo()) {
      const r = await this.api.request(
        `${this.base}/${input.appointmentId ? "availability-for-rescheduling" : "availability"}?offerVersionId=${encodeURIComponent(offer.id)}&patientId=${encodeURIComponent(input.patientId)}&date=${input.date}${input.appointmentId ? "&appointmentId=" + encodeURIComponent(input.appointmentId) : ""}`,
      );
      return r.starts.map((s: string) => localTime(s, agenda.timezone).time);
    }
    const day = new Date(`${input.date}T12:00:00`).getDay() || 7;
    const slots: string[] = [];
    for (const h of this.data().hours.filter(
      (h) => h.agendaId === agenda.id && h.day === day,
    ))
      for (
        let m = minutes(h.start) + offer.preparation;
        m + offer.duration + offer.closing <= minutes(h.end);
        m += offer.duration + offer.preparation + offer.closing
      ) {
        const time = timeLabel(m);
        if (
          !hasConflict(this.data().appointments, {
            agendaId: agenda.id,
            date: input.date,
            time,
            duration: offer.duration,
          })
        )
          slots.push(time);
      }
    return [...new Set(slots)].filter(
      (time) =>
        !this.data().absences.some(
          (a) =>
            a.agendaId === agenda.id &&
            `${input.date}T${time}` < a.end &&
            `${input.date}T${timeLabel(minutes(time) + offer.duration)}` >
              a.start,
        ),
    );
  }
  async book(input: BookingInput, rescheduleId?: string): Promise<void> {
    const context = this.contextVersion(),
      base = this.base;
    const agenda = this.agenda(input.agendaId),
      offer = this.data().offers.find((o) => o.id === input.offerId);
    if (!agenda || !offer || !input.patientId || !input.date || !input.time)
      throw new Error("Completá paciente, agenda, práctica, fecha y horario.");
    if (!can(agenda, rescheduleId ? "booking:reschedule" : "booking:create"))
      throw new Error("No tenés esta acción delegada en la agenda.");
    if (!input.affiliationId && !offer.privatePayment)
      throw new Error(
        "La modalidad particular no está habilitada para esta oferta. Elegí una cobertura verificada.",
      );
    if (this.demo()) {
      if (input.date < this.today)
        throw new Error("Elegí una fecha actual o futura.");
      if (
        hasConflict(
          this.data().appointments,
          {
            agendaId: agenda.id,
            date: input.date,
            time: input.time,
            duration: offer.duration,
          },
          rescheduleId,
        )
      )
        throw new Error(
          "Este horario acaba de ocuparse. Elegí otro disponible.",
        );
      const patient = this.patient(input.patientId)!;
      const fields = {
        patientId: input.patientId,
        agendaId: input.agendaId,
        offerId: offer.id,
        practice: offer.name,
        date: input.date,
        time: input.time,
        duration: offer.duration,
        attendance: "PENDIENTE" as const,
        status: "REGISTRADO" as const,
        number: patient.number,
        modality: input.affiliationId ? patient.coverage : "Particular",
        note: input.note,
      };
      this.mutate((d) => ({
        ...d,
        items: rescheduleId
          ? d.items.map((i) =>
              i.type === "reprogramacion" &&
              (i.appointmentId === rescheduleId ||
                (!i.appointmentId &&
                  i.patientId === input.patientId &&
                  i.agendaId === input.agendaId))
                ? { ...i, state: "RESUELTA" }
                : i,
            )
          : d.items,
        appointments: rescheduleId
          ? d.appointments.map((a) =>
              a.id === rescheduleId
                ? {
                    ...a,
                    ...fields,
                    history: [
                      ...a.history,
                      `Reprogramado a ${input.date} ${input.time}; asistencia pendiente`,
                    ],
                  }
                : a,
            )
          : [
              ...d.appointments,
              {
                id: crypto.randomUUID(),
                ...fields,
                history: [
                  "Turno registrado por el equipo. Asistencia pendiente.",
                ],
              },
            ],
      }));
    } else {
      const body = {
        patientId: input.patientId,
        offerVersionId: offer.id,
        start: zonedTimestamp(input.date, input.time, agenda.timezone),
        affiliationId: input.affiliationId || null,
        authorizationId: input.authorizationId || null,
      };
      const expectedVersion = rescheduleId
        ? this.data().appointments.find((a) => a.id === rescheduleId)?.version
        : undefined;
      const fingerprint = JSON.stringify({
        rescheduleId,
        expectedVersion,
        ...body,
      });
      let keys = this.bookingKeys.get(fingerprint);
      if (!keys) {
        keys = { hold: crypto.randomUUID(), complete: crypto.randomUUID() };
        this.bookingKeys.set(fingerprint, keys);
      }
      try {
        if (rescheduleId)
          await this.api.request(
            `${base}/appointments/${rescheduleId}/reschedule`,
            "POST",
            body,
            keys.hold,
            expectedVersion,
          );
        else {
          if (!keys.holdId) {
            const h = await this.api.request(
              `${base}/holds`,
              "POST",
              body,
              keys.hold,
            );
            keys.holdId = h.id;
          }
          this.assertContext(context);
          await this.api.request(
            `${base}/appointments`,
            "POST",
            { holdId: keys.holdId },
            keys.complete,
          );
        }
      } catch (e) {
        if (
          e instanceof ApiError &&
          [400, 403, 404, 409, 412, 428].includes(e.status)
        )
          this.bookingKeys.delete(fingerprint);
        throw e;
      }
      this.bookingKeys.delete(fingerprint);
      await this.refreshAfterWrite(context);
    }
    this.appointmentPanel.set(null);
    this.flash(
      rescheduleId
        ? "Turno reprogramado. La asistencia vuelve a estar pendiente."
        : "Turno registrado. La asistencia está pendiente de confirmación.",
    );
  }
  async confirm(id: string): Promise<void> {
    const context = this.contextVersion();
    const a = this.data().appointments.find((a) => a.id === id);
    if (!a || !this.agendaCan(a.agendaId, "booking:confirm"))
      throw new Error("No tenés permiso para confirmar este turno.");
    if (this.demo())
      this.mutate((d) => ({
        ...d,
        appointments: d.appointments.map((a) =>
          a.id === id
            ? {
                ...a,
                attendance: "CONFIRMADA",
                history: [...a.history, "Asistencia confirmada por el equipo"],
              }
            : a,
        ),
      }));
    else {
      await this.api.request(
        `${this.base}/appointments/${id}/confirm`,
        "POST",
        undefined,
        undefined,
        a.version,
      );
      await this.refreshAfterWrite(context);
    }
    this.flash("Asistencia confirmada.");
  }
  async cancel(id: string, reason: string): Promise<void> {
    const context = this.contextVersion();
    const a = this.data().appointments.find((a) => a.id === id);
    if (!reason.trim()) throw new Error("Indicá el motivo de cancelación.");
    if (!a || !this.agendaCan(a.agendaId, "booking:cancel"))
      throw new Error("No tenés permiso para cancelar este turno.");
    if (this.demo())
      this.mutate((d) => ({
        ...d,
        appointments: d.appointments.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "CANCELADO",
                history: [...a.history, `Cancelado: ${reason}`],
              }
            : a,
        ),
      }));
    else {
      await this.api.request(
        `${this.base}/appointments/${id}/cancel`,
        "POST",
        { reason },
        undefined,
        a.version,
      );
      await this.refreshAfterWrite(context);
    }
    this.flash("Turno cancelado. El horario quedó disponible.");
  }
  async patientDetail(id: string): Promise<Patient> {
    const context = this.contextVersion();
    let patient = this.patient(id);
    if (!patient) throw new Error("No hay acceso a esta ficha.");
    if (!this.demo()) {
      const r = await this.api.request<PatientDetailDto>(
        `${this.base}/patients/${id}`,
      );
      this.assertContext(context);
      const p = r.patient;
      patient = {
        ...patient,
        document: p.documento_declarado || "",
        birthDate: p.nacimiento || "",
        address: p.domicilio || "",
        number: r.numbers.map((n) => `${n.numero_visible}`).join(" / "),
        professionalIds: r.numbers.map((n) => n.profesional_entidad_id),
      };
      this.data.update((d) => ({
        ...d,
        patients: d.patients.map((p) => (p.id === id ? patient! : p)),
      }));
    }
    return patient;
  }
  async savePatient(patient: Patient, isNew: boolean): Promise<void> {
    const context = this.contextVersion();
    if (!this.has("patients:manage"))
      throw new Error("No tenés permiso para modificar fichas.");
    if (!patient.firstName.trim() || !patient.lastName.trim())
      throw new Error("Completá nombre y apellido.");
    if (patient.birthDate && patient.birthDate > this.today)
      throw new Error("La fecha de nacimiento no puede ser futura.");
    if (this.demo()) {
      if (isNew)
        patient = {
          ...patient,
          id: crypto.randomUUID(),
          number: "",
          status: "ACTIVO",
        };
      this.mutate((d) => ({
        ...d,
        patients: isNew
          ? [...d.patients, patient]
          : d.patients.map((p) => (p.id === patient.id ? patient : p)),
      }));
    } else {
      await this.api.request(
        `${this.base}/patients${isNew ? "" : `/${patient.id}`}`,
        isNew ? "POST" : "PUT",
        {
          firstName: patient.firstName.trim(),
          lastName: patient.lastName.trim(),
          document: patient.document || null,
          birthDate: patient.birthDate || null,
          address: patient.address || null,
        },
      );
      await this.refreshAfterWrite(context);
    }
    this.flash(
      isNew
        ? "Ficha administrativa creada."
        : "Ficha administrativa actualizada.",
    );
  }
  async markNotice(id: string): Promise<void> {
    const context = this.contextVersion();
    if (!this.demo())
      await this.api.request(`${this.base}/notifications/${id}/read`, "POST");
    this.assertContext(context);
    this.mutate((d) => ({
      ...d,
      notices: d.notices.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }
  async loadMessages(id: string, before?: string): Promise<void> {
    if (this.demo()) {
      this.mutate((d) => ({
        ...d,
        conversations: d.conversations.map((c) =>
          c.id === id ? { ...c, unread: 0 } : c,
        ),
      }));
      return;
    }
    const context = this.contextVersion(),
      base = this.base;
    const r = await this.api.request<MessageDto[]>(
      `${base}/conversations/${id}/messages${before ? "?before=" + encodeURIComponent(before) : ""}`,
    );
    this.assertContext(context);
    const messages = [...r].reverse().map((m) => ({
      id: m.id,
      text: m.texto,
      own: !!m.propio,
      time: new Date(m.enviado_en).toLocaleString("es-AR"),
      participantId: m.participante_autor_id,
      read: !!m.leido,
    }));
    this.data.update((d) => ({
      ...d,
      conversations: d.conversations.map((c) =>
        c.id === id
          ? {
              ...c,
              hasOlder: r.length === 100,
              messages: before
                ? [...messages, ...c.messages].filter(
                    (m, i, all) => all.findIndex((x) => x.id === m.id) === i,
                  )
                : messages,
            }
          : c,
      ),
    }));
  }
  async markMessagesRead(id: string): Promise<void> {
    if (this.demo()) return;
    const context = this.contextVersion(), base = this.base;
    const messages = this.data().conversations.find(c => c.id === id)?.messages || [];
    const unread = messages.filter(m => !m.own && !m.read);
    const results = await settleLimited(unread.map(m => async () => {
      this.assertContext(context);
      await this.api.request(`${base}/conversations/${id}/messages/${m.id}/read`, "POST");
      return m.id;
    }));
    this.assertContext(context);
    const read = new Set(results.filter(r => r.status === "fulfilled").map(r => r.value));
    this.data.update(d => ({ ...d, conversations: d.conversations.map(c => {
      if (c.id !== id) return c;
      const newlyRead = c.messages.filter(m => read.has(m.id) && !m.read).length;
      return { ...c, unread: Math.max(0, c.unread - newlyRead), messages: c.messages.map(m => read.has(m.id) ? { ...m, read: true } : m) };
    }) }));
    if (results.some(r => r.status === "rejected"))
      throw new Error("Los mensajes se cargaron, pero no pudimos registrar todas las lecturas. Volvé a abrir la conversación.");
  }
  async sendMessage(id: string, text: string): Promise<void> {
    const context = this.contextVersion();
    if (!text.trim() || text.length > 4000)
      throw new Error("Escribí un mensaje de hasta 4000 caracteres.");
    if (!this.data().conversations.some((c) => c.id === id))
      throw new Error("Conversación no disponible.");
    if (!this.demo()) {
      await this.api.request(
        `${this.base}/conversations/${id}/messages`,
        "POST",
        { text: text.trim() },
      );
      this.assertContext(context);
      try {
        await this.loadMessages(id);
      } catch {
        this.assertContext(context);
        this.partialErrors.update((e) => [
          ...e,
          "Mensaje enviado. Actualizá la conversación para ver la respuesta.",
        ]);
      }
    } else
      this.mutate((d) => ({
        ...d,
        conversations: d.conversations.map((c) =>
          c.id === id
            ? {
                ...c,
                preview: text,
                messages: [
                  ...c.messages,
                  {
                    id: crypto.randomUUID(),
                    text: text.trim(),
                    own: true,
                    time: "Ahora",
                  },
                ],
              }
            : c,
        ),
      }));
  }
  async command(
    path: string,
    body: unknown,
    success: string,
    method = "POST",
    key?: string,
  ): Promise<void> {
    const context = this.contextVersion();
    if (!this.demo()) {
      await this.api.request(`${this.base}${path}`, method, body, key);
      await this.refreshAfterWrite(context);
    }
    this.flash(success);
  }
  searchPatients(query: string): Patient[] {
    const q = normalized(query);
    return this.data().patients.filter((p) =>
      normalized(
        `${p.firstName} ${p.lastName} ${p.document} ${p.number}`,
      ).includes(q),
    );
  }
}
