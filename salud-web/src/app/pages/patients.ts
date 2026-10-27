import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Injector,
  afterNextRender,
  inject,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormFeedback } from "../ui/form-feedback";
import { ActivatedRoute } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { readAllPages } from "../core/paging";
import { WorkspaceStore } from "../core/workspace.store";
import type { PatientReferencesDto } from "../core/api-contracts";
import type { Patient } from "../core/models";
import { initials, normalized, inclusiveDateRange } from "../core/domain";
import { Icon } from "../ui/icon";
import { Status, Empty } from "../ui/shared";
const blank = (): Patient => ({
  id: "",
  firstName: "",
  lastName: "",
  number: "",
  document: "",
  birthDate: "",
  address: "",
  email: "",
  phone: "",
  coverage: "Particular",
  memberNumber: "",
  status: "ACTIVO",
  professionalIds: [],
});
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormFeedback, FormsModule, Icon, Status, Empty],
  templateUrl: "./patients.html",
})
export class Patients {
  private readonly injector = inject(Injector);
  private detailReturnTo?: HTMLElement;
  private focusDetail() {
    this.detailReturnTo = document.activeElement as HTMLElement;
    afterNextRender(() => {
      const detail = document.getElementById("patient-detail");
      detail?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 1080px)").matches) detail?.scrollIntoView({ block: "start" });
    }, { injector: this.injector });
  }
  readonly s = inject(WorkspaceStore);
  private readonly cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  query = "";
  coverage = "";
  sort = "name";
  selected: Patient | null = null;
  edit = false;
  isNew = false;
  saving = false;
  loading = false;
  error = "";
  tab = "datos";
  form = blank();
  initials = initials;
  contacts: any[] = [];
  affiliations: any[] = [];
  plans: {
    id: string;
    cobertura_id: string;
    nombre: string;
    estado: string;
  }[] = [];
  representations: any[] = [];
  access: any[] = [];
  action = "";
  professionalId = "";
  contact = { type: "EMAIL", value: "", authorizationReference: "" };
  affiliation = {
    coverageId: "",
    planId: "",
    memberNumber: "",
    verificationReference: "",
    from: this.s.today,
    until: "",
  };
  representation = {
    accountId: "",
    evidence: "",
    until: "",
    permissions: ["booking:read", "booking:create"],
  };
  enableAccess = {
    accountId: "",
    professionalEntityId: "",
    verificationReference: "",
    representationId: "",
  };
  authorizations: any[] = [];
  authorization = {
    affiliationId: "",
    practiceId: "",
    reference: "",
    from: this.s.today,
    until: this.s.today,
  };
  page = 0;
  readonly pageSize = 25;
  get pagePatients() {
    return this.patients.slice(
      this.page * this.pageSize,
      (this.page + 1) * this.pageSize,
    );
  }
  get pageCount() {
    return Math.max(1, Math.ceil(this.patients.length / this.pageSize));
  }
  private requestEpoch = 0;
  constructor() {
    inject(DestroyRef).onDestroy(() => this.requestEpoch++);
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((p) => {
      const id = p.get("ficha");
      if (id && this.s.patient(id)) this.select(id);
    });
  }
  get patients() {
    const q = normalized(this.query);
    return this.s
      .data()
      .patients.filter(
        (p) =>
          normalized(
            `${p.firstName} ${p.lastName} ${p.document} ${p.number}`,
          ).includes(q) &&
          (!this.coverage || p.coverage === this.coverage),
      )
      .sort((a, b) =>
        this.sort === "number"
          ? a.number.localeCompare(b.number, undefined, { numeric: true })
          : `${a.lastName} ${a.firstName}`.localeCompare(
              `${b.lastName} ${b.firstName}`,
              "es",
            ),
      );
  }
  async select(id: string) {
    if (this.saving) return;
    const epoch = ++this.requestEpoch;
    this.loading = true;
    this.error = "";
    this.edit = false;
    this.isNew = false;
    this.action = "";
    this.tab = "datos";
    this.selected = this.s.patient(id) || null;
    this.focusDetail();
    this.contacts = [];
    this.affiliations = [];
    this.representations = [];
    this.access = [];
    this.authorizations = [];
    try {
      const patient = await this.s.patientDetail(id);
      if (epoch !== this.requestEpoch) return;
      this.selected = patient;
      this.form = { ...patient };
      await this.references(id);
    } catch (e) {
      if (epoch === this.requestEpoch) this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      if (epoch === this.requestEpoch) this.loading = false;
    }
  }
  async references(id: string) {
    const epoch = this.requestEpoch,
      context = this.s.contextVersion();
    if (this.s.demo()) {
      const p = this.s.patient(id);
      if (!p || this.selected?.id !== id) return;
      this.contacts = [
        { id: "email", tipo: "EMAIL", valor: p.email, verificado_en: true },
        { id: "phone", tipo: "WHATSAPP", valor: p.phone, verificado_en: true },
      ].filter((c) => c.valor);
      this.affiliations =
        p.coverage === "Particular"
          ? []
          : [
              {
                id: "demo-affiliation",
                nombre: p.coverage,
                numero_afiliado: p.memberNumber,
                estado_verificacion: "VERIFICADA",
              },
            ];
      this.representations = this.s
        .data()
        .demoRecords.representations.filter((r) => r.patientId === id);
      this.access = this.s
        .data()
        .demoRecords.access.filter((r) => r.patientId === id);
      this.authorizations = this.s
        .data()
        .demoRecords.authorizations.filter((r) => r.patientId === id);
      return;
    }
    const [r, plans] = await Promise.all([
      this.s.api.request<PatientReferencesDto>(
        `${this.s.base}/workspace/patients/${id}`,
      ),
      this.s.has("coverage:manage")
        ? readAllPages<any>(this.s.api, `${this.s.base}/workspace/lists/plans`)
        : Promise.resolve([]),
    ]);
    if (
      epoch !== this.requestEpoch ||
      context !== this.s.contextVersion() ||
      this.selected?.id !== id
    )
      return;
    this.plans = plans;
    this.contacts = r.contacts;
    this.affiliations = r.affiliations;
    this.representations = r.representations.filter((r) => !r.revocada_en);
    this.access = r.access.filter((a) => a.estado !== "REVOCADO");
    this.authorizations = r.authorizations || [];
  }
  close() {
    if (this.saving) return;
    this.requestEpoch++;
    this.selected = null;
    this.loading = false;
    this.detailReturnTo?.focus();
  }
  newPatient() {
    if (this.saving) return;
    this.requestEpoch++;
    this.loading = false;
    this.selected = blank();
    this.form = blank();
    this.isNew = true;
    this.edit = true;
    this.error = "";
    this.tab = "datos";
    this.action = "";
    this.focusDetail();
  }
  editPatient() {
    if (this.selected) {
      this.form = { ...this.selected };
      this.edit = true;
    }
  }
  cancelEdit() {
    if (this.isNew) this.selected = null;
    else this.edit = false;
  }
  async save() {
    this.saving = true;
    this.error = "";
    try {
      await this.s.savePatient(this.form, this.isNew);
      this.edit = false;
      if (this.isNew) {
        this.selected = null;
        this.isNew = false;
      } else this.selected = { ...this.form };
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.saving = false;
    }
  }
  async doAction() {
    if (!this.selected || this.saving) return;
    const id = this.selected.id,
      action = this.action;
    this.saving = true;
    this.error = "";
    try {
      if (this.action === "contact") {
        if (
          !this.contact.value.trim() ||
          !this.contact.authorizationReference.trim()
        )
          throw new Error(
            "Completá el contacto y la evidencia de verificación.",
          );
        if (
          this.contact.type === "EMAIL" &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.contact.value)
        )
          throw new Error("Ingresá una dirección de correo válida.");
        await this.s.command(
          `/patients/${id}/contacts`,
          this.contact,
          "Contacto verificado registrado.",
        );
        if (this.s.demo())
          this.s.mutate((d) => ({
            ...d,
            patients: d.patients.map((p) =>
              p.id === id
                ? {
                    ...p,
                    [this.contact.type === "EMAIL" ? "email" : "phone"]:
                      this.contact.value,
                  }
                : p,
            ),
          }));
      }
      if (this.action === "affiliation") {
        if (!this.s.has("coverage:manage"))
          throw new Error("No tenés facultad para verificar coberturas.");
        if (
          !this.affiliation.from ||
          !this.affiliation.coverageId ||
          !this.affiliation.memberNumber ||
          !this.affiliation.verificationReference
        )
          throw new Error(
            "Completá cobertura, número de afiliado y verificación.",
          );
        if (
          this.affiliation.until &&
          this.affiliation.from > this.affiliation.until
        )
          throw new Error("La vigencia final debe ser posterior al inicio.");
        await this.s.command(
          `/patients/${id}/affiliations`,
          {
            ...this.affiliation,
            planId: this.affiliation.planId || null,
            from: this.affiliation.from,
            until: this.affiliation.until || null,
          },
          "Afiliación verificada registrada.",
        );
        if (this.s.demo())
          this.s.mutate((d) => ({
            ...d,
            patients: d.patients.map((p) =>
              p.id === id
                ? {
                    ...p,
                    coverage:
                      d.coverages.find(
                        (c) => c.id === this.affiliation.coverageId,
                      )?.name || "",
                    memberNumber: this.affiliation.memberNumber,
                  }
                : p,
            ),
          }));
      }
      if (this.action === "authorization") {
        if (!this.s.has("coverage:manage"))
          throw new Error("No tenés facultad para verificar autorizaciones.");
        if (
          !this.authorization.affiliationId ||
          !this.authorization.practiceId ||
          !this.authorization.reference.trim()
        )
          throw new Error("Completá afiliación, práctica y referencia.");
        if (this.authorization.from > this.authorization.until)
          throw new Error("Revisá la vigencia de la autorización.");
        const body = {
          ...this.authorization,
          ...inclusiveDateRange(
            this.authorization.from,
            this.authorization.until,
            this.s.entity().timezone || "America/Argentina/Buenos_Aires",
          ),
        };
        await this.s.command(
          "/coverage-authorizations",
          body,
          "Autorización de cobertura registrada.",
        );
        if (this.s.demo())
          this.s.mutate((d) => ({
            ...d,
            demoRecords: {
              ...d.demoRecords,
              authorizations: [
                ...d.demoRecords.authorizations,
                {
                  id: crypto.randomUUID(),
                  patientId: id,
                  afiliacion_id: body.affiliationId,
                  practica_id: body.practiceId,
                  referencia: body.reference,
                  estado: "VERIFICADA",
                  desde: body.from,
                  hasta: body.until,
                },
              ],
            },
          }));
      }
      if (this.action === "link") {
        if (!this.professionalId) throw new Error("Elegí un profesional.");
        await this.s.command(
          `/patients/${id}/professionals`,
          { professionalEntityId: this.professionalId },
          "Paciente vinculado. Su numeración se conserva.",
        );
        if (this.s.demo())
          this.s.mutate((d) => ({
            ...d,
            patients: d.patients.map((p) =>
              p.id === id
                ? {
                    ...p,
                    number:
                      p.number ||
                      String(
                        Math.max(
                          1041,
                          ...d.patients.map((x) => Number(x.number) || 0),
                        ) + 1,
                      ),
                    professionalIds: [
                      ...new Set([...p.professionalIds, this.professionalId]),
                    ],
                  }
                : p,
            ),
          }));
      }
      if (this.action === "representation") {
        if (
          !this.representation.accountId ||
          !this.representation.evidence ||
          !this.representation.until
        )
          throw new Error(
            "Completá cuenta verificada, evidencia y vencimiento.",
          );
        const body = {
          ...this.representation,
          until: inclusiveDateRange(
            this.representation.until,
            this.representation.until,
            this.s.entity().timezone || "America/Argentina/Buenos_Aires",
          ).until,
        };
        await this.s.command(
          `/patients/${id}/representations`,
          body,
          "Representación verificada registrada.",
        );
        if (this.s.demo())
          this.s.mutate((d) => ({
            ...d,
            demoRecords: {
              ...d.demoRecords,
              representations: [
                ...d.demoRecords.representations,
                {
                  id: crypto.randomUUID(),
                  patientId: id,
                  representante_id: body.accountId,
                  evidencia_ref: body.evidence,
                  hasta: body.until,
                },
              ],
            },
          }));
      }
      if (this.action === "access") {
        if (
          !this.enableAccess.accountId ||
          !this.enableAccess.professionalEntityId ||
          !this.enableAccess.verificationReference
        )
          throw new Error(
            "Completá cuenta, profesional y referencia de verificación.",
          );
        await this.s.command(
          `/patients/${id}/access`,
          {
            ...this.enableAccess,
            agendaId: null,
            representationId: this.enableAccess.representationId || null,
          },
          "Acceso aprobado. La cuenta debe estar activada.",
        );
        if (this.s.demo())
          this.s.mutate((d) => ({
            ...d,
            demoRecords: {
              ...d.demoRecords,
              access: [
                ...d.demoRecords.access,
                {
                  id: crypto.randomUUID(),
                  patientId: id,
                  cuenta_id: this.enableAccess.accountId,
                  estado: "APROBADO",
                },
              ],
            },
          }));
      }
      this.action = "";
      this.selected = this.s.patient(id) || this.selected;
      await this.references(id);
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.saving = false;
    }
  }
  async revoke(kind: string, id: string) {
    if (!this.selected) return;
    this.saving = true;
    this.error = "";
    try {
      await this.s.command(
        `/patients/${this.selected.id}/${kind}/${id}`,
        undefined,
        "Autorización revocada.",
        "DELETE",
      );
      if (this.s.demo())
        this.s.mutate((d) => ({
          ...d,
          demoRecords: {
            ...d.demoRecords,
            access:
              kind === "access"
                ? d.demoRecords.access.filter((a) => a.id !== id)
                : d.demoRecords.access,
            representations:
              kind === "representations"
                ? d.demoRecords.representations.filter((a) => a.id !== id)
                : d.demoRecords.representations,
          },
        }));
      await this.references(this.selected.id);
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.saving = false;
    }
  }
}
