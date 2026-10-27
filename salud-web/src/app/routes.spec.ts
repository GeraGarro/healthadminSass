import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { signal } from "@angular/core";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { sessionGuard, institutionGuard, homeGuard } from "./routes";
import { WorkspaceStore } from "./core/workspace.store";
let store: any;
beforeEach(() => {
  sessionStorage.clear();
  store = {
    sessionReady: signal(false),
    passwordChangeRequired:signal(false),
    api: {
      request: vi.fn(),
      expired: signal(false),
      mfaRequired: signal(false),
    },
    establishSession: vi.fn(),
    entities: signal([{ id: "e" }]),
    chooseEntity: vi.fn(),
    has: vi.fn(() => false),
    role: signal("secretaria"),
    home: signal("/inicio"),
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: WorkspaceStore, useValue: store },
      { provide: Router, useValue: { parseUrl: (url: string) => url } },
    ],
  });
});
afterEach(() => TestBed.resetTestingModule());
const guard = () =>
  TestBed.runInInjectionContext(() => sessionGuard({} as any, {} as any));
it("dirige al acceso si el servidor no responde, sin entrar en demo", async () => {
  store.api.request.mockRejectedValue(new Error("offline"));
  expect(await guard()).toBe("/acceso");
  expect(sessionStorage.getItem("patio-mode")).toBeNull();
});
it("restaura sesión y entidad únicamente si siguen habilitadas", async () => {
  sessionStorage.setItem("patio-entity", "e");
  store.api.request.mockResolvedValue({ account: {}, entities: [] });
  expect(await guard()).toBe(true);
  expect(store.chooseEntity).toHaveBeenCalledWith("e");
});
it("pide elegir contexto si el anterior fue revocado", async () => {
  sessionStorage.setItem("patio-entity", "old");
  store.api.request.mockResolvedValue({});
  expect(await guard()).toBe("/contextos");
  expect(store.chooseEntity).not.toHaveBeenCalled();
});
it("mantiene demo como elección explícita", async () => {
  sessionStorage.setItem("patio-mode", "demo");
  expect(await guard()).toBe(true);
  expect(store.api.request).not.toHaveBeenCalled();
});
it('exige cambiar la contraseña provisoria antes de abrir una entidad',async()=>{store.sessionReady.set(true);store.passwordChangeRequired.set(true);expect(await guard()).toBe('/cambiar-clave');expect(store.chooseEntity).not.toHaveBeenCalled();});
it("redirige las sesiones expiradas y las que requieren MFA", async () => {
  store.sessionReady.set(true);
  store.api.expired.set(true);
  expect(await guard()).toBe("/acceso");
  store.api.expired.set(false);
  store.api.mfaRequired.set(true);
  expect(await guard()).toBe("/mfa");
});
it("las rutas institucionales requieren la facultad efectiva y no el nombre del rol", () => {
  store.role.set("administrador");
  const guard = () => TestBed.runInInjectionContext(() => institutionGuard({ data: { permission: "professionals:manage" } } as any, {} as any));
  expect(guard()).toBe("/inicio");
  store.role.set("profesional"); store.has.mockReturnValue(true);
  expect(guard()).toBe(true);
  expect(store.has).toHaveBeenLastCalledWith("professionals:manage");
});
it("la entrada del administrador lleva a su primera sección habilitada", () => {
  store.role.set("administrador"); store.home.set("/institucion/equipo");
  expect(TestBed.runInInjectionContext(() => homeGuard({} as any, {} as any))).toBe("/institucion/equipo");
});
