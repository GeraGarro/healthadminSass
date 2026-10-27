import { TestBed } from "@angular/core/testing";
import { signal, ChangeDetectorRef } from "@angular/core";
import { afterEach, it, expect, vi } from "vitest";
import { Catalog } from "./catalog";
import { WorkspaceStore } from "../core/workspace.store";
import { ApiClient } from "../core/api.client";
import { createDemo } from "../core/demo-data";
afterEach(() => TestBed.resetTestingModule());
it("convierte vigencia de convenio a instantes de entidad e incluye todo el día final", async () => {
  TestBed.configureTestingModule({
    providers: [
      WorkspaceStore,
      { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn() } },
      {
        provide: ApiClient,
        useValue: {
          request: vi.fn(),
          expired: signal(false),
          mfaRequired: signal(false),
        },
      },
    ],
  });
  const s = TestBed.inject(WorkspaceStore);
  s.data.set(createDemo("profesional", false));
  s.entity.set({
    id: "e",
    name: "Test",
    type: "CLINICA",
    timezone: "America/New_York",
  });
  const command = vi.spyOn(s, "command").mockResolvedValue();
  const p = TestBed.runInInjectionContext(() => new Catalog());
  p.showForm = "agreement";
  p.coverageId = "coverage";
  p.agreement = {
    offerId: s.data().offers[0].id,
    planId: "plan",
    from: "2026-03-08",
    until: "2026-03-08",
    requiresAuthorization: true,
  };
  await p.save();
  expect(p.error).toBe("");
  expect(command).toHaveBeenCalledWith(
    "/agreements",
    expect.objectContaining({
      from: "2026-03-08T05:00:00.000Z",
      until: "2026-03-09T04:00:00.000Z",
      planId: "plan",
    }),
    "Convenio registrado.",
  );
});
