import { inject } from "@angular/core";
import { CanActivateFn, Router, Routes } from "@angular/router";
import { WorkspaceStore } from "./core/workspace.store";
import { Layout } from "./layout";
export const sessionGuard: CanActivateFn = async () => {
  const s = inject(WorkspaceStore),
    router = inject(Router);
  if (sessionStorage.getItem("patio-mode") === "demo") return true;
  if (s.sessionReady())
    return s.passwordChangeRequired() ? router.parseUrl('/cambiar-clave') : s.api.expired()
      ? router.parseUrl("/acceso")
      : s.api.mfaRequired()
        ? router.parseUrl("/mfa")
        : true;
  try {
    const me = await s.api.request("/auth/me");
    await s.establishSession(me);
    if(s.passwordChangeRequired())return router.parseUrl('/cambiar-clave');
    const id = sessionStorage.getItem("patio-entity");
    if (id && s.entities().some((e) => e.id === id)) {
      await s.chooseEntity(id);
      return true;
    }
    return router.parseUrl("/contextos");
  } catch {
    if (s.api.mfaRequired()) return router.parseUrl("/mfa");
    sessionStorage.removeItem("patio-mode");
    return router.parseUrl("/acceso");
  }
};
export const institutionGuard: CanActivateFn = (route) => {
  const s = inject(WorkspaceStore);
  return s.has(route.data["permission"]) ? true : inject(Router).parseUrl(s.home());
};
export const homeGuard: CanActivateFn = () => {
  const s = inject(WorkspaceStore);
  return s.role() === "administrador" ? inject(Router).parseUrl(s.home()) : true;
};
export const careGuard: CanActivateFn=()=>{const s=inject(WorkspaceStore);return s.role()==='administrador'?inject(Router).parseUrl(s.home()):true;};
export const routes: Routes = [
  {path:'cambiar-clave',data:{mode:'activar',provisional:true},loadComponent:()=>import('./pages/auth').then(m=>m.Auth)},
  {
    path: "acceso",
    loadComponent: () => import("./pages/auth").then((m) => m.Auth),
  },
  {
    path: "recuperar",
    loadComponent: () => import("./pages/auth").then((m) => m.Auth),
  },
  {
    path: "activar",
    loadComponent: () => import("./pages/auth").then((m) => m.Auth),
  },
  {
    path: "access/activate",
    data: { mode: "activar" },
    loadComponent: () => import("./pages/auth").then((m) => m.Auth),
  },
  {
    path: "access/reset",
    data: { mode: "activar", recovery: true },
    loadComponent: () => import("./pages/auth").then((m) => m.Auth),
  },
  {
    path: "mfa",
    loadComponent: () => import("./pages/auth").then((m) => m.Auth),
  },
  {
    path: "contextos",
    loadComponent: () => import("./pages/auth").then((m) => m.Auth),
  },
  {
    path: "",
    component: Layout,
    canActivate: [sessionGuard],
    children: [
      { path: "", pathMatch: "full", redirectTo: "inicio" },
      {
        path: "inicio",
        canActivate: [homeGuard],
        loadComponent: () =>
          import("./pages/dashboard").then((m) => m.Dashboard),
      },
      {
        path: "agenda",
        canActivate:[careGuard],
        loadComponent: () => import("./pages/agenda").then((m) => m.AgendaPage),
      },
      {path:'actividad',data:{tab:'activity'},canActivate:[careGuard],loadComponent:()=>import('./pages/professional-home').then(m=>m.ProfessionalHome)},
      {path:'aranceles',data:{tab:'fees'},canActivate:[careGuard],loadComponent:()=>import('./pages/professional-home').then(m=>m.ProfessionalHome)},
      ...[
        { section: "profesionales", permission: "professionals:manage" },
        { section: "equipo", permission: "members:manage" },
        { section: "sedes", permission: "professionals:manage" },
        { section: "politicas", permission: "policy:manage" },
        { section: "auditoria", permission: "audit:read" },
      ].map(({ section, permission }) => ({ path: `institucion/${section}`, data: { section, permission }, canActivate: [institutionGuard], loadComponent: () => import("./pages/institution").then(m => m.Institution) })),
      {
        path: "pacientes",
        canActivate:[careGuard],
        loadComponent: () => import("./pages/patients").then((m) => m.Patients),
      },
      {
        path: "solicitudes",
        canActivate:[careGuard],
        loadComponent: () => import("./pages/inbox").then((m) => m.Inbox),
      },
      {
        path: "comunicaciones",
        canActivate:[careGuard],
        loadComponent: () =>
          import("./pages/communications").then((m) => m.Communications),
      },
      {
        path: "mensajes",
        canActivate:[careGuard],
        loadComponent: () => import("./pages/messages").then((m) => m.Messages),
      },
      {
        path: "catalogo",
        loadComponent: () => import("./pages/catalog").then((m) => m.Catalog),
      },
      {
        path: "reportes",
        canActivate:[careGuard],
        loadComponent: () => import("./pages/reports").then((m) => m.Reports),
      },
      {
        path:'profesionales',canActivate:[careGuard],loadComponent:()=>import('./pages/staff-directory').then(m=>m.StaffDirectory),
      },
      {
        path:'mi-perfil',loadComponent:()=>import('./pages/staff-profile').then(m=>m.StaffProfilePage),
      },
      {
        path: "configuracion",
        loadComponent: () => import("./pages/settings").then((m) => m.Settings),
      },
    ],
  },
  { path: "**", redirectTo: "inicio" },
];
