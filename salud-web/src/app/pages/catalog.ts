import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormFeedback } from "../ui/form-feedback";
import { inclusiveDateRange, zonedTimestamp } from "../core/domain";
import { readAllPages } from "../core/paging";
import { WorkspaceStore } from "../core/workspace.store";
import { Icon } from "../ui/icon";
import { Status, Empty } from "../ui/shared";
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormFeedback, FormsModule, Icon, Status, Empty],
  templateUrl: "./catalog.html",
})
export class Catalog implements OnInit {
  readonly s = inject(WorkspaceStore);
  private readonly cdr = inject(ChangeDetectorRef);
  tab = "practices";
  showForm = "";
  error = "";
  saving = false;
  practice = { name: "", code: "" };
  coverageName = "";
  planName = "";
  coverageId = "";
  plans: any[] = [];
  agreements: any[] = [];
  offer = {
    agendaId: "",
    practiceId: "",
    durationMinutes: 30,
    preparationMinutes: 0,
    closingMinutes: 0,
    portalEnabled: false,
    privatePaymentEnabled: true,
  };
  agreement = {
    offerId: "",
    planId: "",
    from: "",
    until: "",
    requiresAuthorization: false,
  };
  ngOnInit() {
    this.loadConfiguration();
  }
  async loadConfiguration() {
    if (!this.s.has("coverage:manage")) return;
    try {
      if (this.s.demo()) {
        this.plans = this.s.data().demoRecords.plans;
        this.agreements = this.s.data().demoRecords.agreements;
      } else {
        const context = this.s.contextVersion();
        const [plans, agreements] = await Promise.all([
          readAllPages<any>(this.s.api, `${this.s.base}/workspace/lists/plans`),
          readAllPages<any>(
            this.s.api,
            `${this.s.base}/workspace/lists/agreements`,
          ),
        ]);
        if (context !== this.s.contextVersion()) return;
        const r = { plans, agreements };
        this.plans = r.plans.map((p: any) => ({
          id: p.id,
          coverageId: p.cobertura_id,
          name: p.nombre,
        }));
        this.agreements = r.agreements.map((a: any) => ({
          id: a.id,
          coverageId: a.cobertura_id,
          offerId: a.oferta_id,
          from: a.desde,
          until: a.hasta,
          requiresAuthorization: a.requiere_autorizacion,
        }));
      }
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
    }
  }
  coverageLabel(id: string) {
    return (
      this.s.data().coverages.find((c) => c.id === id)?.name || "Cobertura"
    );
  }
  offerLabel(id: string) {
    const o = this.s
      .data()
      .offers.find((o) => o.id === id || o.stableId === id);
    return o
      ? `${o.name} · ${this.s.agenda(o.agendaId)?.professional}`
      : "Oferta con versión anterior";
  }
  get configurable() {
    return this.s
      .data()
      .agendas.filter((a) => a.permissions.includes("agenda:configure"));
  }
  get selectedPractice() {
    return this.s.data().practices.find((p) => p.id === this.offer.practiceId);
  }
  get selectedCoverage() {
    return this.s.data().coverages.find((c) => c.id === this.coverageId);
  }
  duration(id: string) {
    return (
      [
        ...new Set(
          this.s
            .data()
            .offers.filter(
              (o) =>
                o.practiceId === id ||
                o.name ===
                  this.s.data().practices.find((p) => p.id === id)?.name,
            )
            .map((o) => `${o.duration} min`),
        ),
      ].join(" / ") || "Configurar por agenda"
    );
  }
  async save() {
    this.saving = true;
    this.error = "";
    try {
      if (this.showForm === "practice") {
        if (!this.practice.name.trim() || !this.practice.code.trim())
          throw new Error("Completá nombre y código interno.");
        await this.s.command(
          "/practices",
          this.practice,
          "Práctica personalizada creada.",
        );
        if (this.s.demo())
          this.s.mutate((d) => ({
            ...d,
            practices: [
              ...d.practices,
              {
                id: crypto.randomUUID(),
                name: this.practice.name,
                base: "",
                duration: 0,
                portal: false,
                state: "ACTIVA",
              },
            ],
          }));
        this.practice = { name: "", code: "" };
      }
      if (this.showForm === "offer") {
        const p = this.selectedPractice;
        if (!p || !this.offer.agendaId)
          throw new Error("Elegí agenda y práctica.");
        if (
          !Number.isInteger(this.offer.durationMinutes) ||
          this.offer.durationMinutes < 1 ||
          this.offer.durationMinutes > 480
        )
          throw new Error("La duración debe ser entre 1 y 480 minutos.");
        if (
          ![this.offer.preparationMinutes, this.offer.closingMinutes].every(
            (n) => Number.isInteger(n) && n >= 0 && n <= 120,
          )
        )
          throw new Error(
            "La preparación y el cierre deben estar entre 0 y 120 minutos.",
          );
        if (this.offer.portalEnabled && p.base !== "CONSULTA")
          throw new Error("Solo la Consulta base permite autogestión.");
        await this.s.command(
          `/agendas/${this.offer.agendaId}/offers`,
          this.offer,
          "Oferta versionada guardada. Los turnos existentes conservan sus condiciones.",
        );
        if (this.s.demo())
          this.s.mutate((d) => ({
            ...d,
            offers: [
              ...d.offers.filter(
                (o) =>
                  !(
                    o.agendaId === this.offer.agendaId && o.practiceId === p.id
                  ),
              ),
              {
                id: crypto.randomUUID(),
                agendaId: this.offer.agendaId,
                practiceId: p.id,
                name: p.name,
                duration: this.offer.durationMinutes,
                preparation: this.offer.preparationMinutes,
                closing: this.offer.closingMinutes,
                portal: this.offer.portalEnabled,
                privatePayment: this.offer.privatePaymentEnabled,
              },
            ],
          }));
      }
      if (this.showForm === "coverage") {
        if (!this.coverageName.trim())
          throw new Error("Ingresá el nombre de la cobertura.");
        await this.s.command(
          "/coverages",
          { name: this.coverageName },
          "Cobertura creada.",
        );
        if (this.s.demo())
          this.s.mutate((d) => ({
            ...d,
            coverages: [
              ...d.coverages,
              {
                id: crypto.randomUUID(),
                name: this.coverageName,
                state: "ACTIVA",
              },
            ],
          }));
        this.coverageName = "";
      }
      if (this.showForm === "plan") {
        if (!this.coverageId || !this.planName.trim())
          throw new Error("Elegí cobertura y nombre del plan.");
        await this.s.command(
          `/coverages/${this.coverageId}/plans`,
          { name: this.planName },
          "Plan de cobertura creado.",
        );
        if (this.s.demo())
          this.s.mutate((d) => ({
            ...d,
            demoRecords: {
              ...d.demoRecords,
              plans: [
                ...d.demoRecords.plans,
                {
                  id: crypto.randomUUID(),
                  coverageId: this.coverageId,
                  name: this.planName,
                },
              ],
            },
          }));
        this.planName = "";
      }
      if (this.showForm === "agreement") {
        const o = this.s
          .data()
          .offers.find((o) => o.id === this.agreement.offerId);
        if (!o || !this.coverageId || !this.agreement.from)
          throw new Error("Completá cobertura, oferta y vigencia.");
        if (this.agreement.until && this.agreement.until < this.agreement.from)
          throw new Error("La fecha final debe ser posterior a la inicial.");
        await this.s.command(
          "/agreements",
          {
            offerId: o.stableId || o.id,
            coverageId: this.coverageId,
            planId: this.agreement.planId || null,
            from: zonedTimestamp(
              this.agreement.from,
              "00:00",
              this.s.entity().timezone || "America/Argentina/Buenos_Aires",
            ),
            until: this.agreement.until
              ? inclusiveDateRange(
                  this.agreement.from,
                  this.agreement.until,
                  this.s.entity().timezone || "America/Argentina/Buenos_Aires",
                ).until
              : null,
            requiresAuthorization: this.agreement.requiresAuthorization,
          },
          "Convenio registrado.",
        );
        if (this.s.demo())
          this.s.mutate((d) => ({
            ...d,
            demoRecords: {
              ...d.demoRecords,
              agreements: [
                ...d.demoRecords.agreements,
                {
                  id: crypto.randomUUID(),
                  coverageId: this.coverageId,
                  ...this.agreement,
                },
              ],
            },
          }));
      }
      this.showForm = "";
      await this.loadConfiguration();
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.saving = false;
    }
  }
}
