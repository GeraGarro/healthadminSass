import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { WorkspaceStore } from "./workspace.store";
import { readAllPages } from "./paging";

export const INSTITUTION_PERMISSIONS = [
  { code: "professionals:manage", label: "Profesionales y estructura", detail: "Incorporar profesionales y crear sedes y agendas." },
  { code: "members:manage", label: "Equipo y permisos", detail: "Asignar facultades y finalizar membresías locales." },
  { code: "catalog:manage", label: "Catálogo de prácticas", detail: "Crear prácticas de la institución." },
  { code: "coverage:manage", label: "Coberturas", detail: "Administrar coberturas y planes autorizados." },
  { code: "policy:manage", label: "Políticas de reserva", detail: "Configurar límites con una referencia de aprobación." },
  { code: "audit:read", label: "Auditoría", detail: "Consultar actividad administrativa de esta institución." },
] as const;
export interface InstitutionProfessional { id: string; membresia_id: string; cuenta_id: string; nombre: string; matricula: string; estado: string; desde: string; hasta: string | null; }
export interface InstitutionMember { id: string; cuenta_id: string; nombre: string; email_acceso: string; estado: string; permisos: string; }
export interface InstitutionBranch { id: string; nombre: string; direccion: string; zona_horaria: string; estado: string; }
export interface InstitutionAgenda { id: string; nombre: string; profesional_entidad_id: string; sede_id: string; zona_horaria: string; estado: string; }
export interface InstitutionAudit { id: string; actor_id: string; servicio_actor: string; accion: string; recurso_tipo: string; recurso_ref: string; ocurrido_en: string; resultado: string; }
export interface InstitutionPolicy { id: string; numero_version: number; hold_minutes: number; max_active: number; automatic_close: boolean; approval: string; }
interface InstitutionData { professionals: InstitutionProfessional[]; members: InstitutionMember[]; branches: InstitutionBranch[]; agendas: InstitutionAgenda[]; audit: InstitutionAudit[]; policy: InstitutionPolicy | null; }
const empty = (): InstitutionData => ({ professionals: [], members: [], branches: [], agendas: [], audit: [], policy: null });
function fixture(userId: string, independent: boolean, userName='Gabriela Torres', userEmail='gabriela@example.test'): InstitutionData {
  const zone = "America/Argentina/Buenos_Aires", since = "2026-03-02T12:00:00Z";
  const names = ["Dra. Elena Martínez", "Dr. Diego Suárez", "Dra. Paula Vidal", "Dr. Martín Ríos"];
  const professionals = names.slice(0, independent ? 1 : 4).map((nombre, i) => ({ id: `pr${i + 1}`, membresia_id: `ip-m${i}`, cuenta_id: `ip-a${i}`, nombre, matricula: `M.N. ${[38421, 42108, 39870, 36512][i]}`, estado: i === 3 ? "INACTIVO" : "ACTIVO", desde: since, hasta: i === 3 ? "2026-09-30T12:00:00Z" : null }));
  if(independent&&userId==='demo-professional'){professionals[0].membresia_id='ip-admin';professionals[0].cuenta_id=userId;}
  return {
    professionals,
    members: [
      { id: "ip-admin", cuenta_id: userId, nombre: userName, email_acceso: userEmail, estado: "ACTIVA", permisos: INSTITUTION_PERMISSIONS.map(p => p.code).join(",") },
      ...professionals.filter(p=>p.cuenta_id!==userId).map(p => ({ id: p.membresia_id, cuenta_id: p.cuenta_id, nombre: p.nombre, email_acceso: `${p.cuenta_id}@example.test`, estado: p.estado === "ACTIVO" ? "ACTIVA" : "REVOCADA", permisos: "" })),
      { id: "ip-secretary", cuenta_id: "ip-secretary-account", nombre: "Ana García", email_acceso: "ana@example.test", estado: "ACTIVA", permisos: "admissions:manage,patients:manage,notifications:manage" },
    ],
    branches: [{ id: "ib1", nombre: independent ? "Consultorio particular" : "Sede Centro", direccion: "Av. del Parque 1240 · Datos ficticios", zona_horaria: zone, estado: "ACTIVA" }, ...independent ? [] : [{ id: "ib2", nombre: "Sede Norte", direccion: "Las Heras 845 · Datos ficticios", zona_horaria: zone, estado: "ACTIVA" }]],
    agendas: professionals.filter(p => p.estado === "ACTIVO").map((p, i) => ({ id: `ia${i}`, nombre: `Consultorio 0${i + 1}`, profesional_entidad_id: p.id, sede_id: i === 2 ? "ib2" : "ib1", zona_horaria: zone, estado: "ACTIVA" })),
    policy: { id: "ipolicy", numero_version: 1, hold_minutes: 5, max_active: 3, automatic_close: false, approval: "Configuración inicial de demostración" },
    audit: [{ id: "iaudit", actor_id: userId, servicio_actor: "", accion: "PROFESSIONAL_LINKED", recurso_tipo: "profesional_entidad", recurso_ref: "pr3", ocurrido_en: "2026-10-20T12:15:00Z", resultado: "OK" }],
  };
}

@Injectable({ providedIn: "root" })
export class InstitutionStore {
  readonly s = inject(WorkspaceStore);
  readonly data = signal<InstitutionData>(empty());
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly failures = signal<string[]>([]);
  readonly needsRefresh = signal(false);
  readonly active = computed(() => this.data().professionals.filter(p => p.estado === "ACTIVO"));
  private generation = 0;
  private demoKey = "";
  private context = this.s.contextVersion();
  constructor() {
    effect(() => {
      const context = this.s.contextVersion();
      if (context === this.context) return;
      this.context = context;
      this.generation++;
      this.data.set(empty()); this.error.set(""); this.failures.set([]); this.loading.set(false); this.saving.set(false); this.needsRefresh.set(false);
    });
  }
  async load() {
    const generation = ++this.generation, context = this.s.contextVersion(), base = this.s.base;
    this.context = context;
    this.loading.set(true); this.error.set(""); this.failures.set([]);
    if (this.s.demo()) {
      this.demoKey = `patio-institution-v1-${this.s.entity().id}-${this.s.user().id}`;
      let data = fixture(this.s.user().id, this.s.entity().type === "INDEPENDIENTE",this.s.user().name,this.s.user().email);
      try { const saved = JSON.parse(localStorage.getItem(this.demoKey) || "null"); if (saved?.professionals && saved?.members && saved?.branches && saved?.agendas && saved?.audit && saved?.policy) data = saved; } catch { /* Invalid synthetic storage uses the fixture. */ }
      this.data.set(data); this.loading.set(false); this.needsRefresh.set(false); return;
    }
    const next = empty();
    const jobs: { label: string; run: () => Promise<void> }[] = [];
    const read = <T extends { id: string }>(label: string, resource: string, apply: (items: T[]) => void) => jobs.push({ label, run: async () => apply(await readAllPages<T>(this.s.api, `${base}/workspace/lists/institution-${resource}`)) });
    if (this.s.has("professionals:manage")) {
      read<InstitutionProfessional>("Profesionales", "professionals", r => next.professionals = r);
      read<InstitutionBranch>("Sedes", "branches", r => next.branches = r);
      read<InstitutionAgenda>("Agendas", "agendas", r => next.agendas = r);
    }
    if (this.s.has("members:manage")) read<InstitutionMember>("Equipo", "members", r => next.members = r);
    // Audit is read on its own route, rather than downloading the institution's history on every visit.
    if (this.s.has("policy:manage")) jobs.push({ label: "Políticas", run: async () => { next.policy = await this.s.api.request<InstitutionPolicy>(`${base}/policy`); } });
    const results = await Promise.allSettled(jobs.map(j => j.run()));
    if (generation !== this.generation || context !== this.s.contextVersion()) return;
    this.data.set(next);
    this.failures.set(results.flatMap((r, i) => r.status === "rejected" ? [`${jobs[i].label}: ${r.reason instanceof Error ? r.reason.message : "No se pudo cargar. Volvé a actualizar."}`] : []));
    this.needsRefresh.set(this.failures().length > 0);
    this.loading.set(false);
  }
  async auditPage(offset: number) {
    if (this.s.demo()) return { items: this.data().audit.slice(offset, offset + 50), total: this.data().audit.length };
    if (!this.s.has("audit:read")) throw new Error("No tenés facultad para consultar auditoría.");
    const context = this.s.contextVersion();
    const page = await this.s.api.request<{ items: InstitutionAudit[]; total: number }>(`${this.s.base}/workspace/lists/institution-audit?offset=${offset}&limit=50`);
    this.s.assertContext(context); return page;
  }
  async command(permission: string, path: string, method: string, body: unknown, demo: (d: InstitutionData) => InstitutionData, action: string, resource = "institucion") {
    if (!this.s.has(permission)) throw new Error("Tu cuenta no tiene la facultad necesaria para esta acción.");
    if (this.needsRefresh()) throw new Error("Actualizá la información de la institución antes de realizar otra operación.");
    if (this.saving()) throw new Error("Esperá a que finalice la operación en curso.");
    const context = this.s.contextVersion(), generation = this.generation;
    this.saving.set(true);
    let result: unknown;
    try {
      if (this.s.demo()) {
        this.data.update(d => { const next = demo(structuredClone(d)); next.audit.unshift({ id: crypto.randomUUID(), actor_id: this.s.user().id, servicio_actor: "", accion: action, recurso_tipo: resource, recurso_ref: path.split("/")[2] || (resource === "politica_operativa" ? next.policy?.id || this.s.entity().id : crypto.randomUUID()), ocurrido_en: new Date().toISOString(), resultado: "OK" }); return next; });
        try { localStorage.setItem(this.demoKey, JSON.stringify(this.data())); } catch { this.s.flash("Cambio de demostración aplicado. Este navegador no permite conservarlo al recargar."); }
      } else {
        result = await this.s.api.request(`${this.s.base}${path}`, method, body);
        this.s.assertContext(context);
        try { await this.s.reload(); this.s.assertContext(context); await this.load(); }
        catch {
          this.s.assertContext(context);
          this.needsRefresh.set(true);
          this.error.set("El cambio se guardó, pero no pudimos actualizar la información. Usá Actualizar antes de realizar otra operación; no repitas el cambio.");
        }
      }
      this.s.assertContext(context);
      this.s.flash(this.needsRefresh() ? "Cambio guardado. Actualizá la información antes de continuar." : this.s.demo() ? "Cambio guardado en la demostración." : "Cambio guardado en la institución.");
      return result;
    } finally { if (context === this.s.contextVersion() && generation <= this.generation) this.saving.set(false); }
  }
}
