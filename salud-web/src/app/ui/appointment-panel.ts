import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewChecked,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  effect,
  inject,
  untracked,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormFeedback } from "./form-feedback";
import { RouterLink } from "@angular/router";
import { WorkspaceStore } from "../core/workspace.store";
import { TemporaryDrafts } from "../core/temporary-drafts";
import type {
  BookingEligibilityDto,
  BookingPatientDto,
  PageDto,
} from "../core/api-contracts";
import { ApiError } from "../core/api.client";
import type { BookingInput, Appointment } from "../core/models";
import { dateLabel, initials, normalized } from "../core/domain";
import { Icon } from "./icon";
import { Status } from "./shared";
import { readAllPages } from '../core/paging';
import { BookingPatients, PatientRegistration, PatientMatch, RegisteredPatient } from '../core/booking-patients';
import { StaffStore } from '../core/staff.store';
interface BookingDraft {
  form: BookingInput;
  coverageMode: string;
  patientMode?: string;
  registration?: PatientRegistration;
  patientLabel?: string;
}
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: "app-appointment-panel",
  standalone: true,
  imports: [FormFeedback, FormsModule, RouterLink, Icon, Status],
  templateUrl: "./appointment-panel.html",
})
export class AppointmentPanel implements AfterViewChecked {
  readonly s = inject(WorkspaceStore);
  readonly patientRegistry=inject(BookingPatients);
  readonly staff=inject(StaffStore);
  async setReception(state:string){if(!this.turn)return;await this.staff.setReception(this.turn.id,state);if(this.staff.error())this.error=this.staff.error();this.cdr.markForCheck();}
  patientMode='registered';
  registration:PatientRegistration=this.blankPatient();
  matches:PatientMatch[]=[];
  registering=false;
  matching=false;
  requestedTime='';
  blankPatient():PatientRegistration{return{firstName:'',lastName:'',document:'',email:'',phone:'',address:'',contactConsent:false};}
  private readonly drafts = inject(TemporaryDrafts);
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild("dialog", { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  form: BookingInput = {
    patientId: "",
    agendaId: "",
    offerId: "",
    date: "",
    time: "",
    note: "",
  };
  slots: string[] = [];
  affiliations: { id: string; name: string }[] = [];
  authorizations: any[] = [];
  saving = false;
  loadingSlots = false;
  error = "";
  timeError = "";
  restoredDraft = false;
  private draftKey = "";
  private initialForm = "";
  private initialDraft?: BookingDraft;
  private restoredPatient?: { id: string; label: string };
  cancelMode = false;
  reason = "";
  editing = false;
  coverageMode = "particular";
  dateLabel = dateLabel;
  initials = initials;
  private slotEpoch = 0;
  private patientEpoch = 0;
  private panelEpoch = 0;
  private candidatesEpoch = 0;
  candidateQuery = "";
  candidateCount = 0;
  candidatesLoading = false;
  candidates: { id: string; label: string }[] = [];
  private candidateTimer?: ReturnType<typeof setTimeout>;
  private lastFocus: HTMLElement | null = null;
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.candidateTimer);
      this.candidatesEpoch++;
      this.slotEpoch++;
      this.patientEpoch++;
    });
    effect(() => {
      const panel = this.s.appointmentPanel();
      untracked(() => {
        this.slotEpoch++;
        this.patientEpoch++;
        this.panelEpoch++;
        this.candidatesEpoch++;
        this.candidates = [];
        this.patientMode='registered';this.registration=this.blankPatient();this.matches=[];this.registering=false;this.matching=false;this.requestedTime=panel?.time||'';
        this.candidateQuery = "";
        this.candidateCount = 0;
        clearTimeout(this.candidateTimer);
        this.saving = false;
        this.loadingSlots = false;
        this.error = "";
        this.timeError = "";
        this.restoredDraft = false;
        this.restoredPatient = undefined;
        this.cancelMode = false;
        this.reason = "";
        this.slots = [];
        this.coverageMode = "particular";
        this.affiliations = [];
        this.editing = !!panel?.reschedule;
        if (!panel) return;
        const turn = this.turn;
        this.form = {
          patientId: panel.patientId || turn?.patientId || "",
          agendaId:
            panel.agendaId ||
            turn?.agendaId ||
            this.s.data().agendas[0]?.id ||
            "",
          offerId: turn?.offerId || "",
          date: panel.date || turn?.date || this.s.date(),
          time: panel.time || "",
          note: turn?.note || "",
        };
        if (!panel.id || this.editing) {
          this.ensureOffer();
          this.draftKey = `booking:${panel.id || 'new'}:${panel.patientId || ''}:${panel.agendaId || ''}:${panel.date || ''}:${panel.time || ''}`;
          this.initialDraft = { form: { ...this.form }, coverageMode: this.coverageMode, patientMode:this.patientMode, registration:{...this.registration} };
          this.initialForm = JSON.stringify(this.initialDraft);
          const draft = this.drafts.get<BookingDraft>(this.draftKey);
          if (draft && this.permittedAgendas.some((agenda) => agenda.id === draft.form.agendaId)) {
            this.form = { ...draft.form };
            this.coverageMode = draft.coverageMode;
            this.patientMode=draft.patientMode==='new'?'new':'registered';
            this.registration={...this.blankPatient(),...draft.registration};
            this.restoredPatient = draft.patientLabel ? { id: draft.form.patientId, label: draft.patientLabel } : undefined;
            this.restoredDraft = true;
          }
          void this.loadCandidates();
          if(this.restoredDraft&&this.patientMode==='new'&&/^\d{6,12}$/.test(this.registration.document.replace(/\D/g,'')))void this.matchPatient();
          if (this.form.patientId) void this.restoreAvailability(this.restoredDraft ? draft : undefined, panel.time);
        }
      });
    });
  }
  get turn(): Appointment | undefined {
    return this.s
      .data()
      .appointments.find((a) => a.id === this.s.appointmentPanel()?.id);
  }
  get creating() {
    return !this.s.appointmentPanel()?.id || this.editing;
  }
  get offers() {
    return this.s
      .data()
      .offers.filter((o) => o.agendaId === this.form.agendaId);
  }
  get selectedOffer() {
    return this.offers.find((o) => o.id === this.form.offerId);
  }
  get eligiblePatients() {
    if (!this.s.demo()) {
      const candidates = [...this.candidates],
        turn = this.turn;
      if (this.restoredPatient && !candidates.some((patient) => patient.id === this.restoredPatient!.id))
        candidates.unshift(this.restoredPatient);
      if (turn && !candidates.some((p) => p.id === turn.patientId))
        candidates.unshift({
          id: turn.patientId,
          label: `${this.s.patientName(turn.patientId)} · N.º ${turn.number}`,
        });
      return candidates;
    }
    const patients = this.s
      .data()
      .patients.filter((p) =>
        p.professionalIds.includes(
          this.s.agenda(this.form.agendaId)?.professionalId || "",
        ),
      )
      .map((p) => ({
        id: p.id,
        label: `${p.lastName}, ${p.firstName}${p.number ? " · N.º " + p.number : ""}`,
      }));
    for (const a of this.s
      .data()
      .appointments.filter((a) => a.agendaId === this.form.agendaId)) {
      if (!patients.some((p) => p.id === a.patientId))
        patients.push({ id: a.patientId, label: `Paciente N.º ${a.number}` });
    }
    const matches = patients.filter((patient) => normalized(`${patient.label} ${this.s.patient(patient.id)?.document||''}`).includes(normalized(this.candidateQuery)));
    const selected = patients.find((patient) => patient.id === this.form.patientId);
    if (selected && !matches.some((patient) => patient.id === selected.id)) matches.unshift(selected);
    return matches;
  }
  get candidateTotal() { return this.s.demo() ? this.eligiblePatients.length : this.candidateCount; }
  get permittedAgendas() {
    return this.s
      .data()
      .agendas.filter(
        (a) =>
          this.s.agendaCan(
            a.id,
            this.editing ? "booking:reschedule" : "booking:create",
          ) &&
          (!this.editing ||
            a.professionalId ===
              this.s.agenda(this.turn?.agendaId || "")?.professionalId),
      );
  }
  findCandidates() {
    clearTimeout(this.candidateTimer);
    this.candidateTimer = setTimeout(() => void this.loadCandidates(), 200);
  }
  async loadCandidates() {
    if (this.s.demo()) return;
    const epoch = ++this.candidatesEpoch,
      context = this.s.contextVersion(),
      agenda = this.form.agendaId;
    if (!agenda) return;
    this.candidatesLoading = true;
    try {
      const rows = await readAllPages<BookingPatientDto>(this.s.api,`${this.s.base}/workspace/agendas/${agenda}/booking-patients?q=${encodeURIComponent(this.candidateQuery)}`,100);
      if (epoch !== this.candidatesEpoch || context !== this.s.contextVersion())
        return;
      this.candidateCount = rows.length;
      this.candidates = rows.map((p) => ({
        id: p.id,
        label: `${p.apellidos}, ${p.nombres} · N.º ${p.numero_visible}`,
      }));
    } catch (e) {
      if (epoch === this.candidatesEpoch) this.error = (e as Error).message;
    } finally {
      if (epoch === this.candidatesEpoch) {
        this.candidatesLoading = false;
        this.cdr.markForCheck();
      }
    }
  }
  changePatientMode(mode:string){this.patientMode=mode;this.form.patientId='';this.matches=[];this.error='';this.slots=[];}
  async matchPatient(){if(this.matching||this.registering)return;const epoch=this.panelEpoch;this.error='';this.matching=true;try{if(!/^\d{6,12}$/.test(this.registration.document.replace(/\D/g,'')))throw new Error('Ingresá un DNI válido para buscar el registro.');const rows=await this.patientRegistry.match(this.form.agendaId,this.registration.document);if(epoch===this.panelEpoch)this.matches=rows;}catch(e){if(epoch===this.panelEpoch)this.error=(e as Error).message;}finally{if(epoch===this.panelEpoch){this.matching=false;this.cdr.markForCheck();}}}
  async registerPatient(){if(this.registering||this.matching)return;const fields=document.getElementById('new-patient-fields');const invalid=[...fields?.querySelectorAll<HTMLInputElement>('input')||[]].find(input=>!input.checkValidity());if(invalid){invalid.reportValidity();invalid.focus();return;}const epoch=this.panelEpoch;this.error='';this.registering=true;try{const row=await this.patientRegistry.register(this.form.agendaId,this.registration);if(epoch===this.panelEpoch)await this.selectRegistered(row);}catch(e){if(epoch===this.panelEpoch)this.error=(e as Error).message;}finally{if(epoch===this.panelEpoch){this.registering=false;this.cdr.markForCheck();}}}
  async linkPatient(match:PatientMatch){if(this.registering)return;const epoch=this.panelEpoch;this.registering=true;this.error='';try{const row=await this.patientRegistry.link(this.form.agendaId,match.id,this.registration.document);if(epoch===this.panelEpoch)await this.selectRegistered(row);}catch(e){if(epoch===this.panelEpoch)this.error=(e as Error).message;}finally{if(epoch===this.panelEpoch){this.registering=false;this.cdr.markForCheck();}}}
  private async selectRegistered(row:RegisteredPatient){this.patientMode='registered';this.candidateQuery='';this.form.patientId=row.id;this.restoredPatient={id:row.id,label:`${row.apellidos}, ${row.nombres} · N.º ${row.numero_visible}`};await this.loadCandidates();await this.patientChanged(this.requestedTime);this.s.flash(row.reused?'Paciente vinculado al profesional.':'Paciente registrado y vinculado al profesional.');}
  get validAuthorizations() {
    return this.authorizations.filter(
      (a) =>
        a.afiliacion_id === this.form.affiliationId &&
        a.practica_id === this.selectedOffer?.practiceId &&
        a.estado === "VERIFICADA" &&
        String(a.desde).slice(0, 10) <= this.form.date &&
        String(a.hasta).slice(0, 10) >= this.form.date,
    );
  }
  ngAfterViewChecked() {
    const el = this.dialog.nativeElement;
    if (this.s.appointmentPanel() && !el.open) {
      this.lastFocus = document.activeElement as HTMLElement;
      el.showModal();
    }
    if (!this.s.appointmentPanel() && el.open) {
      el.close();
      this.lastFocus?.focus();
    }
  }
  close() {
    if (this.saving) return;
    if (this.creating && this.s.appointmentPanel()) {
      const draft = { form: { ...this.form }, coverageMode: this.coverageMode, patientMode:this.patientMode, registration:{...this.registration} };
      if (JSON.stringify(draft) !== this.initialForm) this.drafts.put<BookingDraft>(this.draftKey, {
        ...draft,
        patientLabel: this.eligiblePatients.find((patient) => patient.id === this.form.patientId)?.label,
      });
    }
    this.s.appointmentPanel.set(null);
  }
  discardDraft() {
    this.drafts.remove(this.draftKey);
    this.restoredDraft = false;
    this.restoredPatient = undefined;
    this.patientMode='registered';this.registration=this.blankPatient();this.matches=[];
    this.error = "";
    this.timeError = "";
    if (!this.initialDraft) return;
    this.form = { ...this.initialDraft.form };
    this.coverageMode = this.initialDraft.coverageMode;
    this.affiliations = [];
    this.authorizations = [];
    this.slots = [];
    void this.loadCandidates();
    if (this.form.patientId) void this.patientChanged();
  }
  private async restoreAvailability(draft: BookingDraft | undefined, preferredTime = "") {
    const epoch = this.panelEpoch;
    await this.patientChanged(draft?.form.time || preferredTime);
    if (!draft || epoch !== this.panelEpoch) return;
    if (this.affiliations.some((affiliation) => affiliation.id === draft.form.affiliationId)) {
      this.form.affiliationId = draft.form.affiliationId;
      if (this.validAuthorizations.some((authorization) => authorization.id === draft.form.authorizationId))
        this.form.authorizationId = draft.form.authorizationId;
    }
  }
  cancelDialog(e: Event) {
    e.preventDefault();
    this.close();
  }
  backdrop(e: MouseEvent) {
    if (e.target === this.dialog.nativeElement) this.close();
  }
  ensureOffer() {
    if (!this.offers.some((o) => o.id === this.form.offerId))
      this.form.offerId = this.offers[0]?.id || "";
    this.form.time = "";
    this.timeError = "";
    this.slots = [];
  }
  async patientChanged(preferredTime = this.requestedTime) {
    const selected = this.eligiblePatients.find((patient) => patient.id === this.form.patientId);
    if (selected) this.restoredPatient = selected;
    const epoch = ++this.patientEpoch,
      context = this.s.contextVersion(),
      patientId = this.form.patientId,
      date = this.form.date;
    this.slotEpoch++;
    this.loadingSlots = !!(patientId && this.form.offerId && date);
    this.form.time = "";
    this.slots = [];
    this.form.affiliationId = "";
    this.form.authorizationId = "";
    this.affiliations = [];
    this.authorizations = [];
    if (this.s.demo()) {
      const p = this.s.patient(patientId);
      if (p && p.coverage !== "Particular")
        this.affiliations = [{ id: "demo-affiliation", name: p.coverage }];
      this.authorizations = this.s
        .data()
        .demoRecords.authorizations.filter((a) => a.patientId === patientId);
    } else if (patientId && this.form.offerId && date)
      try {
        const r = await this.s.api.request<BookingEligibilityDto>(
          `${this.s.base}/workspace/agendas/${this.form.agendaId}/booking-patients/${patientId}/eligibility?offerVersionId=${this.form.offerId}&date=${date}${this.editing ? "&appointmentId=" + this.turn?.id : ""}`,
        );
        if (epoch !== this.patientEpoch || context !== this.s.contextVersion())
          return;
        this.authorizations = r.authorizations || [];
        if (!r.privatePaymentEnabled) this.coverageMode = "coverage";
        this.affiliations = r.affiliations
          .filter(
            (a) =>
              a.estado_verificacion === "VERIFICADA" &&
              (!a.desde || a.desde <= date) &&
              (!a.hasta || a.hasta >= date),
          )
          .map((a) => ({
            id: a.id,
            name: `${a.nombre} · ${a.numero_afiliado || "Afiliación"}`,
          }));
      } catch (e) {
        if (epoch !== this.patientEpoch || context !== this.s.contextVersion())
          return;
        this.error = (e as Error).message;
        this.loadingSlots = false;
        this.cdr.markForCheck();
        return;
      }
    if (epoch === this.patientEpoch && context === this.s.contextVersion())
      await this.loadSlots(preferredTime);
  }
  agendaChanged() {
    this.matches=[];this.requestedTime='';
    this.ensureOffer();
    this.form.patientId = "";
    this.restoredPatient = undefined;
    this.patientChanged();
    void this.loadCandidates();
  }
  async loadSlots(preferredTime = "") {
    const epoch = ++this.slotEpoch,
      context = this.s.contextVersion();
    this.error = "";
    this.form.time = "";
    this.slots = [];
    if (!this.form.patientId || !this.form.offerId || !this.form.date) {
      this.loadingSlots = false;
      return;
    }
    this.loadingSlots = true;
    try {
      const slots = await this.s.available({
        ...this.form,
        appointmentId: this.editing ? this.turn?.id : undefined,
      });
      if (epoch === this.slotEpoch && context === this.s.contextVersion()) {
        this.slots = slots;
        if (slots.includes(preferredTime)) this.form.time = preferredTime;
      }
    } catch (e) {
      if (epoch === this.slotEpoch && context === this.s.contextVersion())
        this.error = (e as Error).message;
    } finally {
      if (epoch === this.slotEpoch) {
        this.loadingSlots = false;
        this.cdr.markForCheck();
      }
    }
  }
  async submit() {
    if (this.saving) return;
    if(this.patientMode==='new'&&!this.form.patientId){await this.registerPatient();return;}
    this.timeError = "";
    if (!this.slots.includes(this.form.time)) {
      this.timeError = "Elegí un horario disponible antes de registrar el turno.";
      setTimeout(() => document.getElementById("booking-time")?.focus());
      return;
    }
    const epoch = this.panelEpoch;
    this.saving = true;
    this.error = "";
    try {
      if (!this.slots.includes(this.form.time))
        throw new Error(
          "Elegí un horario disponible antes de registrar el turno.",
        );
      if (this.coverageMode === "coverage" && !this.form.affiliationId)
        throw new Error("Seleccioná una afiliación verificada.");
      await this.s.book(
        {
          ...this.form,
          authorizationId:
            this.coverageMode === "coverage"
              ? this.form.authorizationId
              : undefined,
          affiliationId:
            this.coverageMode === "coverage"
              ? this.form.affiliationId
              : undefined,
        },
        this.editing ? this.turn?.id : undefined,
      );
      this.drafts.remove(this.draftKey);
    } catch (e) {
      if (e instanceof ApiError && e.status === 412 && this.turn)
        void this.s.refreshAppointment(this.turn.id);
      if (epoch === this.panelEpoch) {
        this.error = (e as Error).message;
        setTimeout(() => document.getElementById("appointment-form-error")?.focus());
      }
    } finally {
      if (epoch === this.panelEpoch) {
        this.saving = false;
        this.cdr.markForCheck();
      }
    }
  }
  reschedule() {
    const turn = this.turn;
    if (turn) this.s.appointmentPanel.set({ id: turn.id, reschedule: true });
  }
  async confirm() {
    if (!this.turn) return;
    const epoch = this.panelEpoch;
    this.saving = true;
    this.error = "";
    try {
      await this.s.confirm(this.turn.id);
    } catch (e) {
      if (e instanceof ApiError && e.status === 412 && this.turn)
        void this.s.refreshAppointment(this.turn.id);
      if (epoch === this.panelEpoch) this.error = (e as Error).message;
    } finally {
      if (epoch === this.panelEpoch) {
        this.saving = false;
        this.cdr.markForCheck();
      }
    }
  }
  async cancel() {
    if (!this.turn) return;
    const epoch = this.panelEpoch;
    this.saving = true;
    this.error = "";
    try {
      await this.s.cancel(this.turn.id, this.reason);
      this.cancelMode = false;
    } catch (e) {
      if (e instanceof ApiError && e.status === 412 && this.turn)
        void this.s.refreshAppointment(this.turn.id);
      if (epoch === this.panelEpoch) this.error = (e as Error).message;
    } finally {
      if (epoch === this.panelEpoch) {
        this.saving = false;
        this.cdr.markForCheck();
      }
    }
  }
}
