import { TestBed } from "@angular/core/testing";
import { signal, ChangeDetectorRef } from "@angular/core";
import { afterEach, it, expect, vi } from "vitest";
import { Reports } from "./reports";
import { WorkspaceStore } from "../core/workspace.store";
import { ApiClient } from "../core/api.client";
import { createDemo } from "../core/demo-data";
afterEach(() => TestBed.resetTestingModule());
it("consulta el rango del reporte aunque no esté en el calendario cargado", async () => {
  const row = {
    id: "outside-calendar",
    paciente_id: "p",
    agenda_id: "a1",
    version_oferta_id: "o",
    version_concurrencia: 1,
    numero_version: 1,
    numero_visible: 1,
    inicio_atencion: "2026-12-05T13:00:00Z",
    fin_atencion: "2026-12-05T13:30:00Z",
    zona_horaria: "America/Argentina/Buenos_Aires",
    estado_turno: "REGISTRADO",
    estado_asistencia: "PENDIENTE",
  };
  const request = vi.fn(async (_path: string) => ({
    items: [row],
    total: 1,
    offset: 0,
    limit: 250,
  }));
  TestBed.configureTestingModule({
    providers: [
      WorkspaceStore,
      { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn() } },
      {
        provide: ApiClient,
        useValue: {
          request,
          expired: signal(false),
          mfaRequired: signal(false),
        },
      },
    ],
  });
  const s = TestBed.inject(WorkspaceStore),
    data = createDemo("profesional", false);
  data.appointments = [];
  data.agendas = data.agendas.slice(0, 1);
  s.data.set(data);
  const report = TestBed.runInInjectionContext(() => new Reports());
  report.from = "2026-12-01";
  report.until = "2026-12-31";
  await report.loadRange();
  expect(request.mock.calls[0][0]).toContain(
    "from=2026-12-01&until=2027-01-01",
  );
  expect(report.rows[0].id).toBe("outside-calendar");
  expect(s.data().appointments).toEqual([]);
});
it("actualiza la vista después de una respuesta asíncrona sin otro clic", async () => {
  const row = {
    id: "async",
    paciente_id: "p",
    agenda_id: "a1",
    version_oferta_id: "o",
    version_concurrencia: 1,
    numero_version: 1,
    numero_visible: 1,
    inicio_atencion: "2026-12-05T13:00:00Z",
    fin_atencion: "2026-12-05T13:30:00Z",
    zona_horaria: "America/Argentina/Buenos_Aires",
    estado_turno: "REGISTRADO",
    estado_asistencia: "PENDIENTE",
    practica: "Práctica asíncrona",
  };
  const request = vi.fn(async () => ({
    items: [row],
    total: 1,
    offset: 0,
    limit: 250,
  }));
  TestBed.configureTestingModule({
    providers: [
      WorkspaceStore,
      {
        provide: ApiClient,
        useValue: {
          request,
          expired: signal(false),
          mfaRequired: signal(false),
        },
      },
    ],
  });
  const s = TestBed.inject(WorkspaceStore),
    data = createDemo("profesional", false);
  data.appointments = [];
  data.agendas = data.agendas.slice(0, 1);
  s.data.set(data);
  const fixture = TestBed.createComponent(Reports);
  fixture.detectChanges();
  fixture.componentInstance.from = "2026-12-01";
  fixture.componentInstance.until = "2026-12-31";
  await fixture.componentInstance.loadRange();
  await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain("Práctica asíncrona");
  expect(fixture.nativeElement.textContent).not.toContain(
    "Consultando los turnos",
  );
});
