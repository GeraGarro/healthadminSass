import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { InstitutionStore } from "./institution.store";
import { WorkspaceStore } from "./workspace.store";
import { ApiClient } from "./api.client";

let s: WorkspaceStore, i: InstitutionStore, request: ReturnType<typeof vi.fn>;
beforeEach(() => {
  sessionStorage.clear(); localStorage.clear(); request = vi.fn();
  TestBed.configureTestingModule({ providers: [WorkspaceStore, InstitutionStore, { provide: ApiClient, useValue: { request, expired: signal(false), mfaRequired: signal(false) } }] });
  s = TestBed.inject(WorkspaceStore); i = TestBed.inject(InstitutionStore);
  s.entity.set({ id: "a", name: "Institución A", type: "CLINICA" });
});
afterEach(() => TestBed.resetTestingModule());

it("el administrador demo no hereda agendas, turnos ni chat y conserva selección profesional", async () => {
  s.startDemo("administrador");
  expect(s.roleLabel()).toBe("Administrador de institución");
  expect(s.home()).toBe("/institucion/profesionales");
  expect(s.data().agendas).toEqual([]); expect(s.data().appointments).toEqual([]); expect(s.data().conversations).toEqual([]);
  expect(s.professionals().length).toBeGreaterThan(0);
  await i.load(); expect(i.active()).toHaveLength(3);
  expect(request).not.toHaveBeenCalled();
});
it("carga solo las proyecciones concedidas y distingue una sección fallida de una lista vacía", async () => {
  s.permissions.set(["members:manage"]);
  request.mockRejectedValue(new Error("Sin conexión"));
  await i.load();
  expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0][0]).toContain("institution-members");
  expect(i.failures()[0]).toContain("Equipo: Sin conexión");
  expect(i.data().professionals).toEqual([]);
});
it("descarta las lecturas de una institución anterior", async () => {
  s.permissions.set(["members:manage"]);
  let finish!: (value: unknown) => void;
  request.mockReturnValue(new Promise(resolve => finish = resolve));
  const pending = i.load(); s.contextVersion.update(v => v + 1);
  TestBed.tick();
  finish({ items: [{ id: "old", nombre: "Otra institución" }], offset: 0, limit: 250, total: 1 });
  await pending;
  expect(i.data().members).toEqual([]);
});
it("impide comandos sin facultad antes de enviar una solicitud", async () => {
  await expect(i.command("members:manage", "/members/x", "DELETE", undefined, d => d, "MEMBER_REVOKED")).rejects.toThrow("facultad");
  expect(request).not.toHaveBeenCalled();
});
it("no reintenta una escritura de resultado incierto", async () => {
  s.permissions.set(["members:manage"]); request.mockRejectedValue(new Error("Resultado incierto"));
  await expect(i.command("members:manage", "/members/x", "DELETE", undefined, d => d, "MEMBER_REVOKED")).rejects.toThrow("Resultado incierto");
  expect(request).toHaveBeenCalledTimes(1); expect(i.saving()).toBe(false);
});
it("una escritura guardada con lectura fallida exige actualizar sin repetir la operación", async () => {
  s.permissions.set(["members:manage"]);
  request.mockResolvedValueOnce(undefined);
  vi.spyOn(s, "reload").mockRejectedValue(new Error("Sin conexión"));
  await i.command("members:manage", "/members/x/permissions", "PUT", { permissions: [] }, d => d, "MEMBER_PERMISSIONS_CHANGED");
  expect(i.needsRefresh()).toBe(true); expect(i.error()).toContain("El cambio se guardó");
  await expect(i.command("members:manage", "/members/x", "DELETE", undefined, d => d, "MEMBER_REVOKED")).rejects.toThrow("Actualizá");
  expect(request).toHaveBeenCalledTimes(1);
});
it("los cambios ficticios quedan aislados por institución y generan auditoría", async () => {
  s.startDemo("administrador"); await i.load();
  await i.command("professionals:manage", "/branches", "POST", {}, d => { d.branches[0].nombre = "Sede modificada"; return d; }, "BRANCH_CREATED");
  expect(i.data().audit[0].accion).toBe("BRANCH_CREATED");
  await s.chooseEntity("demo-independent"); await i.load();
  expect(i.data().branches[0].nombre).toBe("Consultorio particular");
  await s.chooseEntity("demo-clinic"); await i.load();
  expect(i.data().branches[0].nombre).toBe("Sede modificada");
});
