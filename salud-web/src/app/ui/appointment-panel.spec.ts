import { TestBed } from "@angular/core/testing";
import { signal, ChangeDetectorRef } from "@angular/core";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { AppointmentPanel } from "./appointment-panel";
import { WorkspaceStore } from "../core/workspace.store";
import { ApiClient, ApiError } from "../core/api.client";
import { createDemo } from "../core/demo-data";
import { StaffStore } from '../core/staff.store';
let s: WorkspaceStore, p: AppointmentPanel, request: ReturnType<typeof vi.fn>;
const eligibility = {
  affiliations: [
    {
      id: "verified",
      nombre: "Cobertura",
      numero_afiliado: "1",
      estado_verificacion: "VERIFICADA",
      desde: "2026-01-01",
      hasta: "2026-12-31",
    },
  ],
  authorizations: [],
  privatePaymentEnabled: true,
};
beforeEach(() => {
  request = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      WorkspaceStore,
      {provide:StaffStore,useValue:{reception:signal({}),saving:signal(false)}},
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
  s = TestBed.inject(WorkspaceStore);
  s.data.set(createDemo("secretaria", false));
  s.entity.set({ id: "test", name: "Test", type: "CLINICA" });
  p = TestBed.runInInjectionContext(() => new AppointmentPanel());
  TestBed.tick();
  const offer = s.data().offers[0];
  p.form = {
    patientId: "patient",
    agendaId: offer.agendaId,
    offerId: offer.id,
    date: "2026-10-25",
    time: "",
    note: "",
  };
});
afterEach(() => TestBed.resetTestingModule());
it("recupera una consigna y vuelve a validar el horario al reabrir el borrador", async () => {
  s.startDemo("secretaria");
  s.newAppointment();
  TestBed.tick();
  p.form.patientId = s.data().patients[0].id;
  p.form.note = "Revisar credencial al recibir.";
  p.form.time = "10:30";
  p.close();
  TestBed.tick();
  vi.spyOn(s, "available").mockResolvedValue(["12:00"]);
  s.newAppointment();
  TestBed.tick();
  await Promise.resolve();
  await Promise.resolve();
  expect(p.form.note).toBe("Revisar credencial al recibir.");
  expect(p.restoredDraft).toBe(true);
  expect(p.slots).toEqual(["12:00"]);
  expect(p.form.time).toBe("");
});
it("elimina el borrador al salir de la cuenta aunque se vuelva a la misma demo", () => {
  s.startDemo("secretaria");
  s.newAppointment();
  TestBed.tick();
  p.form.note = "No compartir entre sesiones";
  p.patientMode='new';p.registration={firstName:'Ana',lastName:'Luna',document:'46111222',email:'ana@example.test',phone:'+5491112345678',address:'Parque 100',contactConsent:true};
  p.close();
  TestBed.tick();
  s.clearSession();
  TestBed.tick();
  s.startDemo("secretaria");
  s.newAppointment();
  TestBed.tick();
  expect(p.form.note).toBe("");
  expect(p.restoredDraft).toBe(false);
  expect(p.patientMode).toBe('registered');expect(p.registration.document).toBe('');
});
it('recupera los seis datos del paciente nuevo en memoria contextual y vuelve a verificar el DNI',async()=>{
  s.startDemo('secretaria');s.newAppointment();TestBed.tick();
  p.patientMode='new';const input={firstName:'Ana',lastName:'Luna',document:'46111222',email:'ana@example.test',phone:'+5491112345678',address:'Parque 100',contactConsent:true};p.registration={...input};
  p.close();TestBed.tick();const match=vi.spyOn(p.patientRegistry,'match').mockResolvedValue([]);s.newAppointment();TestBed.tick();await Promise.resolve();
  expect(p.patientMode).toBe('new');expect(p.registration).toEqual(input);expect(p.restoredDraft).toBe(true);expect(match).toHaveBeenCalledWith(p.form.agendaId,input.document);
  p.discardDraft();expect(p.registration.document).toBe('');expect(p.patientMode).toBe('registered');
});
it("consulta elegibilidad para agenda sin leer la ficha administrativa", async () => {
  request
    .mockResolvedValueOnce(eligibility)
    .mockResolvedValueOnce({ starts: [] });
  expect(s.has("patients:manage")).toBe(false);
  await p.patientChanged();
  expect(request.mock.calls[0][0]).toContain(
    "/booking-patients/patient/eligibility?",
  );
  expect(
    request.mock.calls.some((c) => c[0].includes("/workspace/patients/")),
  ).toBe(false);
  expect(p.affiliations[0].id).toBe("verified");
});
it("descarta una elegibilidad tardía después de seleccionar otro paciente", async () => {
  let finish!: (v: unknown) => void;
  request
    .mockReturnValueOnce(new Promise((r) => (finish = r)))
    .mockResolvedValueOnce({ ...eligibility, affiliations: [] })
    .mockResolvedValueOnce({ starts: [] });
  const first = p.patientChanged();
  p.form.patientId = "other";
  await p.patientChanged();
  finish(eligibility);
  await first;
  expect(p.affiliations).toEqual([]);
  expect(p.form.patientId).toBe("other");
});
it("conserva el error de elegibilidad y no habilita horarios tras un rechazo", async () => {
  request.mockRejectedValue(new ApiError(403, "Facultad revocada", "trace"));
  await p.patientChanged();
  expect(p.error).toBe("Facultad revocada");
  expect(p.slots).toEqual([]);
  expect(request).toHaveBeenCalledTimes(1);
});
it("elimina referencias de cobertura si se eligió modalidad particular", async () => {
  const book = vi.spyOn(s, "book").mockResolvedValue();
  p.form.time = "10:00";
  p.form.affiliationId = "old-affiliation";
  p.form.authorizationId = "old-auth";
  p.slots = ["10:00"];
  p.coverageMode = "particular";
  await p.submit();
  expect(book).toHaveBeenCalledWith(
    expect.objectContaining({
      affiliationId: undefined,
      authorizationId: undefined,
    }),
    undefined,
  );
});
it("restringe el destino de reprogramación al mismo profesional", () => {
  const turn = s.data().appointments[0];
  s.appointmentPanel.set({ id: turn.id, reschedule: true });
  TestBed.tick();
  expect(
    p.permittedAgendas.every(
      (a) => a.professionalId === s.agenda(turn.agendaId)?.professionalId,
    ),
  ).toBe(true);
});
it("actualiza el detalle al recibir un conflicto de versión, sin repetir la confirmación", async () => {
  const turn = s.data().appointments[0];
  s.appointmentPanel.set({ id: turn.id });
  TestBed.tick();
  const confirm = vi
      .spyOn(s, "confirm")
      .mockRejectedValue(new ApiError(412, "El turno cambió", "trace")),
    refresh = vi.spyOn(s, "refreshAppointment").mockResolvedValue();
  await p.confirm();
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(refresh).toHaveBeenCalledWith(turn.id);
  expect(p.error).toBe("El turno cambió");
});
it("carga todos los pacientes vinculados, incluso después del registro cien", async () => {
  const rows=Array.from({length:237},(_,i)=>({id:`patient-${i}`,nombres:`Nombre ${i}`,apellidos:'Paciente',numero_visible:i+1}));
  request.mockImplementation(async(path:string)=>{const q=new URL(path,'http://test').searchParams;const offset=Number(q.get('offset'));return{items:rows.slice(offset,offset+100),offset,limit:100,total:rows.length};});
  await p.loadCandidates();
  expect(p.candidates).toHaveLength(237);
  expect(p.candidateCount).toBe(237);
  expect(p.candidates[236].id).toBe('patient-236');
  expect(request.mock.calls.every(c=>c[0].includes('/booking-patients?'))).toBe(true);
});
it("mantiene el horario elegido en el calendario al seleccionar un paciente", async()=>{
  request.mockResolvedValueOnce(eligibility).mockResolvedValueOnce({starts:[]});
  p.requestedTime='12:30';
  const slots=vi.spyOn(p,'loadSlots').mockResolvedValue();
  await p.patientChanged();
  expect(slots).toHaveBeenCalledWith('12:30');
});
