import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormFeedback } from "../ui/form-feedback";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { WorkspaceStore } from "../core/workspace.store";
import { ApiError } from "../core/api.client";
import { Icon } from "../ui/icon";
import type { StaffNotice } from '../core/staff.store';
declare global {
  interface Window {
    google?: any;
  }
}
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormFeedback, FormsModule, RouterLink, Icon],
  templateUrl: "./auth.html",
})
export class Auth implements OnInit {
  readonly s = inject(WorkspaceStore);
  private readonly cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  mode =
    this.route.snapshot.data["mode"] ||
    this.route.snapshot.routeConfig?.path ||
    "acceso";
  email = "";
  password = "";
  confirmPassword = "";
  token = this.route.snapshot.queryParamMap.get("token") || "";
  code = "";
  secret = "";
  uri = "";
  error = "";
  confirmError = "";
  success = "";
  busy = false;
  showPassword = false;
  enrolling = false;
  private googlePromise?: Promise<void>;
  accountNotices:StaffNotice[]=[];
  get title() {
    if(this.route.snapshot.data['provisional'])return 'Elegí tu contraseña personal.';
    if (this.route.snapshot.data["recovery"]) return "Renová tu contraseña.";
    return (
      (
        {
          acceso: "Qué bueno tenerte acá.",
          recuperar: "Volvé a tu espacio.",
          activar: "Activá tu cuenta.",
          mfa: "Un paso más de seguridad.",
          contextos: "Elegí tu espacio de trabajo.",
        } as Record<string, string>
      )[this.mode] || "Ingresá a Patio"
    );
  }
  get subtitle() {
    if(this.route.snapshot.data['provisional'])return 'Tu acceso es provisorio. Cambiá la contraseña antes de ingresar a la institución.';
    return (
      (
        {
          acceso: "Ingresá para organizar tu jornada de atención.",
          recuperar: "Te enviaremos instrucciones al correo de tu cuenta.",
          activar: "Elegí una contraseña personal para continuar.",
          mfa: "Usá el código de tu aplicación de autenticación.",
          contextos: "Cada entidad tiene sus pacientes, agendas y permisos.",
        } as Record<string, string>
      )[this.mode] || ""
    );
  }
  async ngOnInit() {
    if (this.token) history.replaceState(history.state, "", location.pathname);
    if (
      (["mfa", "contextos"].includes(this.mode)||this.route.snapshot.data['provisional']) &&
      !this.s.sessionReady() &&
      sessionStorage.getItem("patio-mode") !== "demo"
    ) {
      try {
        const me = await this.s.api.request("/auth/me");
        await this.s.establishSession(me);
      } catch {
        await this.router.navigateByUrl("/acceso");
      }
    }
    if(this.mode==='contextos'&&!this.s.demo()&&!this.s.passwordChangeRequired())try{this.accountNotices=await this.s.api.request<StaffNotice[]>('/account/staff-notices');}catch{this.error='No pudimos consultar tus avisos de cuenta. Volvé a ingresar para actualizar.';}
  }
  async submit() {
    if (this.busy) return;
    this.confirmError = "";
    if (this.mode === "activar" && this.password !== this.confirmPassword) {
      this.confirmError = "Las contraseñas no coinciden. Revisá este campo.";
      setTimeout(() => document.getElementById("confirm-password")?.focus());
      return;
    }
    this.busy = true;
    this.error = "";
    this.success = "";
    try {
      if (this.mode === "acceso") {
        const me = await this.s.api.login(this.email.trim(), this.password);
        this.password = "";
        await this.s.establishSession(me);
        sessionStorage.setItem("patio-mode", "api");
        await this.afterLogin();
      }
      if (this.mode === "recuperar") {
        const r = await this.s.api.request("/auth/recover", "POST", {
          email: this.email.trim(),
        });
        this.success =
          r.message || "Si corresponde, recibirás instrucciones en tu correo.";
      }
      if (this.mode === "activar") {
        if(this.route.snapshot.data['provisional']) {
          await this.s.api.request('/auth/provisional-password','POST',{password:this.password});
          this.password='';this.confirmPassword='';
          await this.s.establishSession(await this.s.api.request('/auth/me'));
          await this.afterLogin();return;
        }
        if (!this.token)
          throw new Error(
            "Este enlace no contiene una activación válida. Solicitá un nuevo correo de recuperación.",
          );
        if (this.password !== this.confirmPassword)
          throw new Error(
            "Las contraseñas no coinciden. Revisalas e intentá nuevamente.",
          );
        await this.s.api.request("/auth/reset", "POST", {
          token: this.token,
          password: this.password,
        });
        this.password = "";
        this.confirmPassword = "";
        this.token = "";
        this.success = "Contraseña guardada. Ya podés ingresar a tu cuenta.";
      }
      if (this.mode === "mfa") {
        if (this.s.demo())
          throw new Error(
            "Ingresá a tu cuenta para configurar la verificación de dos pasos.",
          );
        await this.s.api.request("/auth/mfa/verify", "POST", {
          code: this.code,
        });
        this.code = "";
        this.secret = "";
        this.uri = "";
        this.s.api.mfaRequired.set(false);
        await this.afterLogin();
      }
    } catch (e) {
      this.error = (e as Error).message;
      setTimeout(() => document.getElementById("auth-error")?.focus());
    } finally {
      this.cdr.markForCheck();
      this.busy = false;
    }
  }
  async afterLogin() {
    if(this.s.passwordChangeRequired()){await this.router.navigateByUrl('/cambiar-clave');return;}
    if (!this.s.entities().length) {
      await this.router.navigateByUrl("/contextos");
      return;
    }
    if (this.s.entities().length === 1) {
      await this.select(this.s.entities()[0].id);
    } else await this.router.navigateByUrl("/contextos");
  }
  async select(id: string) {
    this.busy = true;
    this.error = "";
    try {
      sessionStorage.setItem("patio-entity", id);
      await this.s.chooseEntity(id);
      await this.router.navigateByUrl("/inicio");
    } catch (e) {
      if (
        e instanceof ApiError &&
        e.status === 403 &&
        this.s.api.mfaRequired()
      ) {
        await this.router.navigateByUrl("/mfa");
      } else this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.busy = false;
    }
  }
  async enroll() {
    this.busy = true;
    this.error = "";
    try {
      if (this.s.demo())
        throw new Error("Ingresá a tu cuenta para configurar el autenticador.");
      const r = await this.s.api.request("/auth/mfa/enroll", "POST", {
        password: this.password,
      });
      this.password = "";
      this.secret = r.secret;
      this.uri = r.uri;
      this.enrolling = false;
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.busy = false;
    }
  }
  demo(role: "secretaria" | "profesional" | "administrador") {
    sessionStorage.removeItem('patio-first-visit');
    sessionStorage.removeItem("patio-mode");
    this.s.startDemo(role);
    this.router.navigateByUrl("/inicio");
  }
  demoFirstVisit(){sessionStorage.setItem('patio-first-visit','true');this.s.startDemo('secretaria',false,true);this.router.navigateByUrl('/inicio');}
  async google() {
    this.busy = true;
    this.error = "";
    try {
      await this.s.api.token();
      const config = await this.s.api.request("/auth/google/nonce");
      if (!config.clientId)
        throw new Error(
          "El acceso con Google todavía no está configurado. Ingresá con correo y contraseña.",
        );
      if (!window.google) {
        this.googlePromise ??= new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () =>
            reject(
              new Error("No pudimos cargar Google. Usá correo y contraseña."),
            );
          document.head.appendChild(script);
        });
        await this.googlePromise;
      }
      window.google.accounts.id.initialize({
        client_id: config.clientId,
        nonce: config.nonce,
        callback: async (response: any) => {
          this.busy = true;
          try {
            await this.s.api.request("/auth/google", "POST", {
              idToken: response.credential,
            });
            await this.s.api.token();
            const me = await this.s.api.request("/auth/me");
            await this.s.establishSession(me);
            sessionStorage.setItem("patio-mode", "api");
            await this.afterLogin();
          } catch (e) {
            this.error = (e as Error).message;
          } finally {
            this.cdr.markForCheck();
            this.busy = false;
          }
        },
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin"),
        { theme: "outline", size: "large", text: "signin_with", width: 320 },
      );
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.busy = false;
    }
  }
}
