import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  ViewChild,
  afterNextRender,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { WorkspaceStore } from "./core/workspace.store";
import { initials } from "./core/domain";
import { Icon } from "./ui/icon";
import { HelpPanel } from "./ui/help-panel";
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: "app-layout",
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, RouterOutlet, Icon, HelpPanel],
  templateUrl: "./layout.html",
})
export class Layout {
  readonly s = inject(WorkspaceStore);
  readonly router = inject(Router);
  readonly mobileOpen = signal(false);
  private readonly mobileQuery = window.matchMedia("(max-width: 760px)");
  readonly mobile = signal(this.mobileQuery.matches);
  private readonly injector = inject(Injector);
  @ViewChild("sidebar") sidebar!: ElementRef<HTMLElement>;
  @ViewChild("menuTrigger") menuTrigger!: ElementRef<HTMLButtonElement>;
  @ViewChild(HelpPanel) help!: HelpPanel;
  readonly localError = signal("");
  initials = initials;
  readonly links = [
    { path: "/inicio", label: "Mi jornada", icon: "grid" },
    { path: '/profesionales', label:'Profesionales',icon:'people'},
    { path: "/agenda", label: "Agenda", icon: "calendar" },
    {path:'/actividad',label:'Mi actividad',icon:'chart'},
    {path:'/aranceles',label:'Aranceles',icon:'catalog'},
    { path: "/pacientes", label: "Pacientes", icon: "people" },
    { path: "/solicitudes", label: "Solicitudes", icon: "inbox" },
    { path: "/comunicaciones", label: "Comunicaciones", icon: "bell" },
    { path: "/mensajes", label: "Mensajes", icon: "chat" },
    { path: "/catalogo", label: "Prácticas y coberturas", icon: "catalog" },
    { path: "/reportes", label: "Reportes", icon: "chart" },
  ];
  private readonly careGroups = [
    { label: "Atención diaria", links: this.links.filter((link) => !["/catalogo", "/reportes"].includes(link.path)) },
    { label: "Administración", links: this.links.filter((link) => ["/catalogo", "/reportes"].includes(link.path)) },
  ];
  get navigationGroups() {
    return [
      { label: "Institución", links: [
        { path: "/institucion/profesionales", label: "Profesionales", icon: "people" },
        { path: "/institucion/equipo", label: "Equipo y permisos", icon: "shield" },
        { path: "/institucion/sedes", label: "Sedes y agendas", icon: "location" },
        { path: "/institucion/politicas", label: "Políticas de reserva", icon: "settings" },
        { path: "/institucion/auditoria", label: "Auditoría", icon: "list" },
      ].filter(l => this.visible(l.path)) },
      ...this.careGroups.map(g => ({ ...g, links: g.links.filter(l => this.visible(l.path)) })),
    ].filter(g => g.links.length);
  }
  openHelp() {
    const returnTo = this.mobile() ? this.menuTrigger.nativeElement : document.activeElement as HTMLElement;
    this.closeNavigation();
    afterNextRender(() => this.help.open(returnTo), { injector: this.injector });
  }
  constructor() {
    const onResize = (event: MediaQueryListEvent) => {
      const focusWasInside = this.sidebar?.nativeElement.contains(
        document.activeElement,
      );
      this.mobile.set(event.matches);
      this.mobileOpen.set(false);
      if (event.matches && focusWasInside) this.restoreMenuFocus();
    };
    this.mobileQuery.addEventListener("change", onResize);
    inject(DestroyRef).onDestroy(() =>
      this.mobileQuery.removeEventListener("change", onResize),
    );
  }
  openNavigation() {
    this.mobileOpen.set(true);
    afterNextRender(
      () => {
        if (this.mobileOpen())
          this.sidebar.nativeElement
            .querySelector<HTMLButtonElement>(".nav-close")
            ?.focus();
      },
      { injector: this.injector },
    );
  }
  closeNavigation() {
    if (!this.mobileOpen()) return;
    this.mobileOpen.set(false);
    this.restoreMenuFocus();
  }
  private restoreMenuFocus() {
    afterNextRender(
      () => {
        const trigger = this.menuTrigger?.nativeElement;
        if (this.mobile() && trigger?.isConnected) trigger.focus();
      },
      { injector: this.injector },
    );
  }
  private navigationStops(): HTMLElement[] {
    return Array.from(
      this.sidebar.nativeElement.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex="0"]',
      ),
    ).filter((element) => element.getClientRects().length > 0);
  }
  @HostListener("document:focusin", ["$event"]) containNavigationFocus(
    event: FocusEvent,
  ) {
    if (
      this.mobile() &&
      this.mobileOpen() &&
      !this.sidebar.nativeElement.contains(event.target as Node)
    ) {
      this.navigationStops()[0]?.focus();
    }
  }
  visible(path: string) {
    if(path==='/actividad'||path==='/aranceles')return this.s.role()==='profesional';
    if (path.startsWith("/institucion/")) return this.s.has(path.endsWith("equipo") ? "members:manage" : path.endsWith("politicas") ? "policy:manage" : path.endsWith("auditoria") ? "audit:read" : "professionals:manage");
    if (path === "/inicio") return this.s.role() !== "administrador";
    if(this.s.role()==='administrador' && !['/catalogo'].includes(path))return false;
    if(path==='/profesionales')return this.s.role()==='secretaria';
    if (path === "/agenda") return this.s.data().agendas.length > 0;
    if (path === "/pacientes") return this.s.has("patients:manage");
    if (path === "/solicitudes") return this.s.has("admissions:manage") || this.s.data().agendas.some(a => a.permissions.includes("booking:create"));
    if (path === "/reportes") return this.s.data().agendas.some(a => a.permissions.includes("booking:read"));
    if (path === "/catalogo") return this.s.has("catalog:manage") || this.s.has("coverage:manage") || this.s.data().agendas.length > 0;
    if (path === "/comunicaciones") return this.s.has("notifications:manage") || this.s.data().notices.length > 0;
    if (path === "/mensajes")
      return (
        this.s.role() === "profesional" ||
        this.s.data().conversations.length > 0
      );
    return true;
  }
  async context(id: string) {
    this.localError.set("");
    try {
      await this.s.chooseEntity(id);
      sessionStorage.setItem("patio-entity", id);
    } catch (e) {
      this.localError.set((e as Error).message);
    }
  }
  async retry() {
    this.localError.set("");
    try {
      await this.s.reload();
    } catch (e) {
      this.localError.set((e as Error).message);
    }
  }
  changeRole(value: string) {
    sessionStorage.removeItem("patio-mode");
    this.s.startDemo(
      value === "administrador" ? "administrador" : value === "profesional" ? "profesional" : "secretaria",
      this.s.entity().type === "INDEPENDIENTE",
    );
    this.router.navigateByUrl(this.s.home());
  }
  async logout() {
    if (!this.s.demo())
      try {
        await this.s.api.logout();
      } catch (e) {
        this.localError.set((e as Error).message);
        return;
      }
    sessionStorage.removeItem("patio-mode");
    sessionStorage.removeItem("patio-entity");
    this.s.clearSession();
    await this.router.navigateByUrl("/acceso");
  }
  openPatient(id: string) {
    this.s.search.set("");
    this.router.navigate(["/pacientes"], { queryParams: { ficha: id } });
  }
  @HostListener("document:keydown", ["$event"]) onKey(event: KeyboardEvent) {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "k" &&
      !this.mobileOpen()
    ) {
      event.preventDefault();
      document.getElementById("global-search")?.focus();
    }
    if (event.key === "Escape") {
      this.s.search.set("");
      this.closeNavigation();
    }
    if (event.key === "Tab" && this.mobile() && this.mobileOpen()) {
      const stops = this.navigationStops();
      const first = stops[0],
        last = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }
}
