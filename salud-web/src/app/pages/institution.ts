import { ChangeDetectionStrategy, Component, ElementRef, Injector, ViewChild, afterNextRender, computed, effect, inject, signal, untracked } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { WorkspaceStore } from "../core/workspace.store";
import { InstitutionStore, INSTITUTION_PERMISSIONS, InstitutionProfessional, InstitutionMember, InstitutionAudit } from "../core/institution.store";
import { initials, normalized, csvCell } from "../core/domain";
import { Icon } from "../ui/icon";
import { Empty } from "../ui/shared";
import { FormFeedback } from "../ui/form-feedback";
import { StaffStore, StaffPerson } from '../core/staff.store';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, DatePipe, Icon, Empty, FormFeedback],
  templateUrl: "./institution.html",
  styleUrl: "./institution.css",
})
export class Institution {
  readonly s = inject(WorkspaceStore);
  readonly i = inject(InstitutionStore);
  readonly staff = inject(StaffStore);
  readonly credentials = signal<{email:string;temporaryPassword:string}|null>(null);
  readonly section = inject(ActivatedRoute).snapshot.data["section"] as string;
  private readonly injector = inject(Injector);
  @ViewChild("revokeDialog") revokeDialog?: ElementRef<HTMLDialogElement>;
  query = "";
  state = "ACTIVO";
  branch = "";
  sort = "asc";
  page = 0;
  readonly selectedId = signal("");
  readonly selected = computed(() => this.i.data().professionals.find(p => p.id === this.selectedId()));
  formMode = "";
  existingAccount=false;
  form = this.blankForm();
  permissions: string[] = [];
  readonly permissionOptions = INSTITUTION_PERMISSIONS;
  error = signal("");
  audit = signal<InstitutionAudit[]>([]);
  auditTotal = signal(0);
  auditOffset = 0;
  auditBusy = signal(false);
  revoke: { id: string; accountId: string; name: string; professional?: InstitutionProfessional } | null = null;
  confirmed = false;
  private returnTo?: HTMLElement;
  private detailTrigger?: HTMLElement;
  initials = initials;
  readonly titles: Record<string, string> = { profesionales: "Profesionales", equipo: "Equipo y permisos", sedes: "Sedes y agendas", politicas: "Políticas de reserva", auditoria: "Auditoría" };
  readonly descriptions: Record<string, string> = {
    profesionales: "El equipo profesional que forma parte de tu institución.",
    equipo: "Personas y facultades, dentro de esta institución.",
    sedes: "Organizá dónde atiende cada profesional.",
    politicas: "Límites de reserva con aprobación y trazabilidad.",
    auditoria: "Actividad administrativa de la institución y sus responsables.",
  };
  readonly actionNames: Record<string, string> = { PROFESSIONAL_LINKED: "Profesional incorporado", MEMBER_GRANTED: "Membresía habilitada", MEMBER_REVOKED: "Baja institucional", MEMBER_PERMISSIONS_CHANGED: "Facultades actualizadas", BRANCH_CREATED: "Sede creada", AGENDA_CREATED: "Agenda creada", POLICY_CHANGED: "Política actualizada", WORKSPACE_READ: "Consulta del espacio", PATIENT_READ: "Consulta de ficha", PATIENT_CREATED: "Ficha creada", PATIENT_UPDATED: "Ficha actualizada", WORKSPACE_DIRECTORY_READ: "Consulta de pacientes", PATIENT_REFERENCES_READ: "Consulta de referencias", BOOKING_CREATED: "Turno registrado", BOOKING_READ: "Consulta de turno", BOOKING_CANCELLED: "Turno cancelado", ADMISSION_APPROVED: "Admisión aprobada", ADMISSION_REJECTED: "Admisión rechazada", REPORT_EXPORTED: "Reporte exportado", PRACTICE_CREATED: "Práctica creada", COVERAGE_CREATED: "Cobertura creada", ENTITY_CREATED: "Institución creada", AGENDA_DELEGATED: "Agenda delegada", DELEGATION_REVOKED: "Delegación revocada" };
  policy = { holdMinutes: 5, maxActiveBookings: 3, automaticCloseEnabled: false, approvalReference: "" };
  constructor() {
    effect(() => {
      this.s.contextVersion();
      untracked(() => { this.credentials.set(null); this.selectedId.set(""); this.formMode = ""; this.query = ""; this.branch = ""; this.error.set(""); this.revokeDialog?.nativeElement.close(); this.revoke = null; this.audit.set([]); this.auditOffset = 0; void this.refresh(); });
    });
  }
  blankForm() { return { id: "", accountId: "", name: "", email: "", registration: "", address: "", timezone: this.s?.entity().timezone || "America/Argentina/Buenos_Aires", professionalEntityId: "", branchId: "" }; }
  availability(id:string) { return this.staff.people().filter(p=>p.id===id); }
  schedule(id:string) { return this.availability(id).map(p=>this.staff.schedule(p)).filter(Boolean).join(' · '); }
  onDuty(id:string) { return this.availability(id).some(p=>this.staff.onDuty(p)); }
  get linkRequests() { return this.staff.requests().filter(r=>r.tipo==='INSTITUCION'&&r.estado==='PENDIENTE'); }
  async resolveLink(id:string,approve:boolean) { const r=this.linkRequests.find(r=>r.id===id);if(!r)return;await this.staff.resolve(r,approve);if(this.staff.error())return;if(this.s.demo()&&approve){await this.i.command('professionals:manage','/professionals','POST',{},d=>{const existing=d.professionals.find(p=>p.cuenta_id===r.solicitante_id);if(existing){existing.estado='ACTIVO';existing.hasta=null;}else{const memberId=crypto.randomUUID();d.members.push({id:memberId,cuenta_id:r.solicitante_id,nombre:r.nombre,email_acceso:'',estado:'ACTIVA',permisos:''});d.professionals.push({id:crypto.randomUUID(),membresia_id:memberId,cuenta_id:r.solicitante_id,nombre:r.nombre,matricula:r.matricula,estado:'ACTIVO',desde:new Date().toISOString(),hasta:null});}return d;},'PROFESSIONAL_LINKED','profesional_entidad');}await this.i.load(); }
  async refresh() {
    this.error.set("");
    await this.i.load();
    const p = this.i.data().policy;
    if (p) this.policy = { holdMinutes: p.hold_minutes, maxActiveBookings: p.max_active, automaticCloseEnabled: p.automatic_close, approvalReference: "" };
    if (this.section === "auditoria") await this.loadAudit(0);
  }
  get professionals() {
    const q = normalized(this.query);
    return this.i.data().professionals.filter(p => (!q || normalized(`${p.nombre} ${p.matricula}`).includes(q)) && (!this.state || p.estado === this.state) && (!this.branch || this.agendas(p.id).some(a => a.sede_id === this.branch)))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es") * (this.sort === "asc" ? 1 : -1));
  }
  get visibleProfessionals() { return this.professionals.slice(this.page * 10, (this.page + 1) * 10); }
  get members() { const q = normalized(this.query); return this.i.data().members.filter(m => (!q || normalized(`${m.nombre} ${m.email_acceso}`).includes(q)) && (!this.state || m.estado === (this.state === "ACTIVO" ? "ACTIVA" : "REVOCADA"))); }
  get visibleMembers() { return this.members.slice(this.page * 10, (this.page + 1) * 10); }
  get activeMembers() { return this.i.data().members.filter(m => m.estado === "ACTIVA"); }
  get filteredAudit() { const q = normalized(this.query); return this.audit().filter(a => !q || normalized(`${this.actionLabel(a.accion)} ${this.actor(a.actor_id)} ${a.recurso_tipo} ${a.resultado} ${a.recurso_ref}`).includes(q)); }
  resetFilters() { this.query = ""; this.state = ""; this.branch = ""; this.page = 0; }
  agendas(id: string) { return this.i.data().agendas.filter(a => a.profesional_entidad_id === id); }
  branchName(id: string) { return this.i.data().branches.find(b => b.id === id)?.nombre || "Sede no disponible"; }
  professionalName(id: string) { return this.i.data().professionals.find(p => p.id === id)?.nombre || "Profesional no disponible"; }
  professionalActive(id: string) { return this.i.active().some(p => p.id === id); }
  branchNames(id: string) { return [...new Set(this.agendas(id).map(a => this.branchName(a.sede_id)))].join(" · ") || "Sin agenda asignada"; }
  memberPermissions(m: InstitutionMember) { return m.permisos.split(",").filter(Boolean); }
  permissionLabel(code: string) { return this.permissionOptions.find(p => p.code === code)?.label || ({'patients:manage':'Fichas administrativas','admissions:manage':'Admisiones','notifications:manage':'Seguimiento de avisos','agenda:read':'Ver agenda','booking:read':'Ver turnos','booking:create':'Registrar turnos','booking:confirm':'Confirmar asistencia','booking:cancel':'Cancelar turnos','booking:reschedule':'Reprogramar turnos'} as Record<string,string>)[code] || 'Facultad adicional'; }
  actor(id: string) { return this.i.data().members.find(m => m.cuenta_id === id)?.nombre || (id === this.s.user().id ? this.s.user().name : id ? `Cuenta ${id.slice(0, 8)}` : "Proceso automático"); }
  actionLabel(action: string) { return ({STAFF_ACCOUNT_CREATED:'Cuenta provisoria creada',STAFF_REQUEST_RESOLVED:'Solicitud de vínculo resuelta',AGENDA_ACCESS_REQUESTED:'Acceso a agenda solicitado',RECEPTION_UPDATED:'Estado de recepción actualizado'} as Record<string,string>)[action] || this.actionNames[action] || action.replaceAll("_", " "); }
  select(p: InstitutionProfessional) {
    this.detailTrigger = document.activeElement as HTMLElement;
    this.selectedId.set(p.id);
    afterNextRender(() => { const detail = document.getElementById("professional-detail"); if (window.matchMedia("(max-width: 1240px)").matches) detail?.scrollIntoView({ block: "nearest" }); document.getElementById("professional-detail-title")?.focus({ preventScroll: true }); }, { injector: this.injector });
  }
  closeDetail() { this.selectedId.set(""); this.detailTrigger?.focus(); }
  openForm(mode: string, member?: InstitutionMember) {
    this.returnTo = document.activeElement as HTMLElement;
    this.formMode = mode; this.form = this.blankForm(); this.permissions = []; this.error.set("");
    this.existingAccount=false;
    if (member) { this.form.id = member.id; this.form.name = member.nombre; this.form.accountId = member.cuenta_id; this.permissions = this.memberPermissions(member); }
    afterNextRender(() => { const element = document.getElementById("institution-form"); element?.scrollIntoView({ block: "nearest" }); element?.querySelector<HTMLElement>("input,select")?.focus({ preventScroll: true }); }, { injector: this.injector });
  }
  closeForm() { this.formMode = ""; this.error.set(""); this.returnTo?.focus(); }
  togglePermission(code: string, checked: boolean) { this.permissions = checked ? [...this.permissions, code] : this.permissions.filter(p => p !== code); }
  chooseAccount(id: string) { this.form.accountId = id; this.form.name = this.i.data().members.find(m => m.cuenta_id === id)?.nombre || ""; }
  async submit() {
    this.error.set("");
    const f = { ...this.form, accountId: this.form.accountId.trim(), name: this.form.name.trim(), registration: this.form.registration.trim(), address: this.form.address.trim() }, id = crypto.randomUUID();
    try {
      if (['professional','member'].includes(this.formMode)) {
        if(!f.name || !f.email.trim()) throw new Error('Completá nombre y correo electrónico.');
        if(this.formMode==='professional'&&!f.registration) throw new Error('Registrá la matrícula verificada.');
        const professional=this.formMode==='professional', email=f.email.trim();
        const temporaryPassword=Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
        const response=await this.i.command('members:manage','/staff-accounts','POST',{name:f.name,email,role:professional?'PROFESIONAL':'SECRETARIA',registration:f.registration},d=>{
          if(d.members.some(m=>m.email_acceso.toLowerCase()===email.toLowerCase()))throw new Error('La cuenta ya existe. El profesional debe solicitar su vínculo desde su propia cuenta.');
          const accountId=crypto.randomUUID(),memberId=crypto.randomUUID();d.members.push({id:memberId,cuenta_id:accountId,nombre:f.name,email_acceso:email,estado:'ACTIVA',permisos:''});
          if(professional)d.professionals.push({id,membresia_id:memberId,cuenta_id:accountId,nombre:f.name,matricula:f.registration,estado:'ACTIVO',desde:new Date().toISOString(),hasta:null});return d;
        },'STAFF_ACCOUNT_CREATED','membresia') as {email:string;temporaryPassword:string}|undefined;
        this.credentials.set(this.s.demo()?{email,temporaryPassword}:response||null);this.closeForm();return;
      }
      if (["professional", "member"].includes(this.formMode) && !this.s.demo() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(f.accountId)) throw new Error("Ingresá el identificador de cuenta completo facilitado por plataforma.");
      if (["professional", "branch", "agenda"].includes(this.formMode) && !f.name) throw new Error("Completá el nombre sin dejarlo en blanco.");
      if (["branch", "agenda"].includes(this.formMode)) try { new Intl.DateTimeFormat("es", { timeZone: f.timezone }); } catch { throw new Error("La zona horaria no es válida. Usá una zona como America/Argentina/Buenos_Aires."); }
      if (this.formMode === "professional") {
        if (!f.registration) throw new Error("Registrá la matrícula verificada del profesional.");
        await this.i.command("professionals:manage", "/professionals", "POST", { accountId: f.accountId, name: f.name, registration: f.registration }, d => {
          const existing = d.professionals.find(p => p.cuenta_id === f.accountId);
          if (existing?.estado === "ACTIVO") throw new Error("Esa cuenta ya tiene un vínculo profesional activo en la institución.");
          const member = d.members.find(m => m.cuenta_id === f.accountId);
          const membershipId = member?.id || crypto.randomUUID();
          if (member) member.estado = "ACTIVA"; else d.members.push({ id: membershipId, cuenta_id: f.accountId, nombre: f.name, email_acceso: "", estado: "ACTIVA", permisos: "" });
          if (existing) { existing.estado = "ACTIVO"; existing.hasta = null; } else d.professionals.push({ id, membresia_id: membershipId, cuenta_id: f.accountId, nombre: f.name, matricula: f.registration, estado: "ACTIVO", desde: new Date().toISOString(), hasta: null }); return d;
        }, "PROFESSIONAL_LINKED", "profesional_entidad");
      } else if (this.formMode === "member" || this.formMode === "permissions") {
        const editing = this.formMode === "permissions";
        if (f.accountId === this.s.user().id && !this.permissions.includes("members:manage")) throw new Error("Otra persona autorizada debe revisar el retiro de tu facultad de administrar el equipo.");
        await this.i.command("members:manage", editing ? `/members/${f.id}/permissions` : "/members", editing ? "PUT" : "POST", editing ? { permissions: this.permissions } : { accountId: f.accountId, permissions: this.permissions }, d => {
          const member = d.members.find(m => m.cuenta_id === f.accountId);
          if (editing && !member) throw new Error("La membresía ya no está disponible.");
          if (member) { member.estado = "ACTIVA"; member.permisos = editing ? this.permissions.join(",") : [...new Set([...this.memberPermissions(member), ...this.permissions])].join(","); }
          else d.members.push({ id, cuenta_id: f.accountId, nombre: f.name || "Cuenta incorporada (demo)", email_acceso: "", estado: "ACTIVA", permisos: this.permissions.join(",") }); return d;
        }, editing ? "MEMBER_PERMISSIONS_CHANGED" : "MEMBER_GRANTED", "membresia");
      } else if (this.formMode === "branch") {
        await this.i.command("professionals:manage", "/branches", "POST", { name: f.name, address: f.address, timezone: f.timezone }, d => { d.branches.push({ id, nombre: f.name, direccion: f.address, zona_horaria: f.timezone, estado: "ACTIVA" }); return d; }, "BRANCH_CREATED", "sede");
      } else if (this.formMode === "agenda") {
        if (!this.i.active().some(p => p.id === f.professionalEntityId) || !this.i.data().branches.some(b => b.id === f.branchId && b.estado === "ACTIVA")) throw new Error("Elegí un profesional y una sede activos.");
        await this.i.command("professionals:manage", "/agendas", "POST", { name: f.name, professionalEntityId: f.professionalEntityId, branchId: f.branchId, timezone: f.timezone }, d => { d.agendas.push({ id, nombre: f.name, profesional_entidad_id: f.professionalEntityId, sede_id: f.branchId, zona_horaria: f.timezone, estado: "ACTIVA" }); return d; }, "AGENDA_CREATED", "agenda");
      }
      this.closeForm();
    } catch (e) { this.error.set((e as Error).message); }
  }
  askRevoke(member: InstitutionMember | InstitutionProfessional) {
    this.returnTo = document.activeElement as HTMLElement;
    const professional = "membresia_id" in member ? member : this.i.data().professionals.find(p => p.membresia_id === member.id);
    this.revoke = { id: "membresia_id" in member ? member.membresia_id : member.id, accountId: member.cuenta_id, name: member.nombre, professional };
    this.confirmed = false; this.error.set("");
    this.revokeDialog?.nativeElement.showModal();
  }
  closeRevoke() { if (this.i.saving()) return; this.revokeDialog?.nativeElement.close(); this.revoke = null; this.error.set(""); this.returnTo?.focus(); }
  async revokeMembership() {
    if (!this.revoke || !this.confirmed) return;
    const target = this.revoke;
    try {
      if (target.accountId === this.s.user().id) throw new Error("Otra persona autorizada debe revisar la baja de tu propia membresía.");
      await this.i.command("members:manage", `/members/${target.id}`, "DELETE", undefined, d => {
        // Synthetic fixture exercises the same conflict the live API checks authoritatively.
        if (target.professional && ["pr1", "pr3"].includes(target.professional.id)) throw new Error("Este profesional tiene turnos futuros. El personal autorizado debe resolverlos antes de finalizar el vínculo.");
        d.members.filter(m => m.id === target.id).forEach(m => { m.estado = "REVOCADA"; m.permisos = ""; });
        d.professionals.filter(p => p.membresia_id === target.id).forEach(p => { p.estado = "INACTIVO"; p.hasta = new Date().toISOString(); }); return d;
      }, "MEMBER_REVOKED", "membresia");
      this.closeRevoke();
      this.s.flash(this.s.demo()?'Baja aplicada en la demostración. Aviso simulado para la persona.':'Vínculo finalizado. Se registró un aviso en la cuenta de la persona.');
    } catch (e) { this.error.set((e as Error).message); }
  }
  async savePolicy() {
    this.error.set(""); const p = { ...this.policy, approvalReference: this.policy.approvalReference.trim() };
    try {
      if (!Number.isInteger(p.holdMinutes) || p.holdMinutes < 1 || p.holdMinutes > 30 || !Number.isInteger(p.maxActiveBookings) || p.maxActiveBookings < 1 || p.maxActiveBookings > 100 || !p.approvalReference) throw new Error("Revisá los límites e indicá la referencia de aprobación.");
      await this.i.command("policy:manage", "/policy", "PUT", p, d => { d.policy = { id: crypto.randomUUID(), numero_version: (d.policy?.numero_version || 0) + 1, hold_minutes: p.holdMinutes, max_active: p.maxActiveBookings, automatic_close: p.automaticCloseEnabled, approval: p.approvalReference }; return d; }, "POLICY_CHANGED", "politica_operativa");
      this.policy.approvalReference = "";
    } catch (e) { this.error.set((e as Error).message); }
  }
  async loadAudit(offset: number) {
    this.auditBusy.set(true); this.error.set(""); const version = this.s.contextVersion();
    try { const page = await this.i.auditPage(offset); this.s.assertContext(version); this.audit.set(page.items); this.auditTotal.set(page.total); this.auditOffset = offset; }
    catch (e) { if (version === this.s.contextVersion()) { this.audit.set([]); this.error.set((e as Error).message); } }
    finally { if (version === this.s.contextVersion()) this.auditBusy.set(false); }
  }
  exportProfessionals() {
    const rows = [["Nombre", "Matrícula", "Sedes", "Estado", "Desde", "Hasta"], ...this.professionals.map(p => [p.nombre, p.matricula, this.branchNames(p.id), p.estado, p.desde, p.hasta || ""])];
    const blob = new Blob(["\ufeff" + rows.map(row => row.map(csvCell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob), anchor = document.createElement("a"); anchor.href = url; anchor.download = `profesionales-${this.s.demo() ? "demo-" : ""}${this.s.today}.csv`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
