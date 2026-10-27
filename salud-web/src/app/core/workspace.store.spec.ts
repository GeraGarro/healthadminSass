import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { WorkspaceStore } from "./workspace.store";
import { ApiClient, ApiError } from "./api.client";
import { createDemo } from "./demo-data";
import { emptyWorkspace } from "./workspace.loader";
describe("Comandos y aislamiento del espacio", () => {
  let s: WorkspaceStore, request: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    request = vi.fn();
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
    s = TestBed.inject(WorkspaceStore);
    s.entity.set({ id: "entity-a", name: "Test", type: "CLINICA" });
  });
  afterEach(() => TestBed.resetTestingModule());
  const fixture = () => createDemo("secretaria", false);
  it("arranca sin datos ficticios y requiere entrada explícita a demo", () => {
    expect(s.demo()).toBe(false);
    expect(s.data().appointments).toEqual([]);
    expect(s.sessionReady()).toBe(false);
    s.startDemo();
    expect(s.demo()).toBe(true);
    expect(sessionStorage.getItem("patio-mode")).toBe("demo");
  });
  it("persiste solo las lecturas ajenas pendientes y conserva errores parciales", async () => {
    const data = fixture();
    data.conversations = [{ id: "chat", patientId: "patient", name: "Paciente", preview: "", unread: 3,
      messages: [
        { id: "own", own: true, text: "Propio", time: "" },
        { id: "read", own: false, read: true, text: "Leído", time: "" },
        { id: "new", own: false, text: "Nuevo", time: "" },
        { id: "failed", own: false, text: "Reintentar", time: "" },
      ],
    }];
    s.data.set(data);
    request.mockImplementation((path: string) => path.includes("/failed/")
      ? Promise.reject(new Error("Sin conexión")) : Promise.resolve());
    await expect(s.markMessagesRead("chat")).rejects.toThrow("lecturas");
    expect(request).toHaveBeenCalledTimes(2);
    expect(s.data().conversations[0].unread).toBe(2);
    expect(s.data().conversations[0].messages.find(m => m.id === "new")?.read).toBe(true);
    request.mockResolvedValue(undefined);
    await s.markMessagesRead("chat");
    expect(request).toHaveBeenCalledTimes(3);
    expect(s.data().conversations[0].unread).toBe(1);
  });
  it("no infiere acciones por la etiqueta secretaría", async () => {
    const data = fixture();
    data.agendas.forEach(
      (a) => (a.permissions = ["agenda:read", "booking:read"]),
    );
    s.data.set(data);
    await expect(s.confirm(data.appointments[0].id)).rejects.toThrow("permiso");
    expect(request).not.toHaveBeenCalled();
  });
  it("confirma asistencia con versión y mantiene separado el estado de registro", async () => {
    const data = fixture(),
      turn = data.appointments[0];
    turn.version = 7;
    s.data.set(data);
    request.mockResolvedValue({});
    vi.spyOn(s, "reload").mockResolvedValue();
    await s.confirm(turn.id);
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining("/confirm"),
      "POST",
      undefined,
      undefined,
      7,
    );
    s.startDemo("secretaria", false, true);
    const id = s.data().appointments[0].id;
    await s.confirm(id);
    expect(s.data().appointments.find((t) => t.id === id)).toMatchObject({
      status: "REGISTRADO",
      attendance: "CONFIRMADA",
    });
  });
  it("no repite automáticamente un comando rechazado por versión", async () => {
    const data = fixture();
    s.data.set(data);
    request.mockRejectedValue(new ApiError(412, "Cambió", "trace"));
    const reload = vi.spyOn(s, "reload");
    await expect(s.confirm(data.appointments[0].id)).rejects.toMatchObject({
      status: 412,
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });
  it("reutiliza claves y pre-reserva después de una respuesta perdida al registrar", async () => {
    const data = fixture(),
      offer = data.offers[0];
    s.data.set(data);
    vi.spyOn(s, "reload").mockResolvedValue();
    request
      .mockResolvedValueOnce({ id: "hold-test" })
      .mockRejectedValueOnce(new ApiError(0, "Resultado incierto", ""))
      .mockResolvedValueOnce({ id: "new" });
    const input = {
      patientId: data.patients[0].id,
      agendaId: offer.agendaId,
      offerId: offer.id,
      date: "2026-10-25",
      time: "10:00",
      note: "",
    };
    await expect(s.book(input)).rejects.toMatchObject({ status: 0 });
    await s.book(input);
    expect(
      request.mock.calls.filter((c) => c[0].endsWith("/holds")),
    ).toHaveLength(1);
    const complete = request.mock.calls.filter((c) =>
      c[0].endsWith("/appointments"),
    );
    expect(complete).toHaveLength(2);
    expect(complete[0][3]).toBe(complete[1][3]);
    expect(complete[1][2]).toEqual({ holdId: "hold-test" });
  });
  it("detiene el registro si cambia la entidad mientras llega la pre-reserva", async () => {
    const data = fixture(),
      offer = data.offers[0];
    s.data.set(data);
    let finish!: (v: unknown) => void;
    request.mockReturnValue(new Promise((r) => (finish = r)));
    const pending = s.book({
      patientId: data.patients[0].id,
      agendaId: offer.agendaId,
      offerId: offer.id,
      date: "2026-10-25",
      time: "10:00",
      note: "",
    });
    s.clearSession();
    finish({ id: "hold-old" });
    await expect(pending).rejects.toThrow("cambió");
    expect(request).toHaveBeenCalledTimes(1);
    expect(s.data().appointments).toEqual([]);
  });
  it("comunica guardado confirmado si falla solamente la recarga", async () => {
    s.data.set(fixture());
    request.mockResolvedValue({});
    vi.spyOn(s, "reload").mockRejectedValue(new Error("offline"));
    await s.confirm(s.data().appointments[0].id);
    expect(s.partialErrors().join(" ")).toContain("se guardó");
    expect(s.toast()).toContain("confirmada");
  });
  it("descarta una instantánea tardía de otra entidad", async () => {
    let finish!: (v: unknown) => void;
    request.mockReturnValue(new Promise((r) => (finish = r)));
    const pending = s.reload();
    s.clearSession();
    finish({
      permissions: ["patients:manage"],
      agendas: [],
      members: [],
      delegations: [],
    });
    await pending;
    expect(s.data()).toEqual(emptyWorkspace());
    expect(s.permissions()).toEqual([]);
    expect(s.sessionReady()).toBe(false);
  });
  it("usa disponibilidad de reprogramación con el turno original", async () => {
    const data = fixture(),
      offer = data.offers[0];
    s.data.set(data);
    request.mockResolvedValue({ starts: ["2026-10-25T13:00:00Z"] });
    expect(
      await s.available({
        patientId: data.patients[0].id,
        agendaId: offer.agendaId,
        offerId: offer.id,
        date: "2026-10-25",
        time: "",
        note: "",
        appointmentId: "original",
      }),
    ).toEqual(["10:00"]);
    expect(request.mock.calls[0][0]).toContain(
      "availability-for-rescheduling?",
    );
    expect(request.mock.calls[0][0]).toContain("appointmentId=original");
  });
});
