import { describe, it, expect, vi } from "vitest";
import {
  calendarWindow,
  loadWorkspace,
  appointmentFromDto,
} from "./workspace.loader";
import type { ApiClient } from "./api.client";
const agenda = {
  id: "agenda",
  nombre: "Consultorio",
  profesional: "Profesional ficticio",
  profesional_entidad_id: "pro",
  zona_horaria: "America/Argentina/Buenos_Aires",
  permissions: ["agenda:read", "booking:read"],
  titular: false,
  sede: null,
};
const descriptor = (permissions: string[] = []) => ({
  permissions,
  agendas: [agenda],
  members: [],
  delegations: [],
  timezone: agenda.zona_horaria,
});
function fake(descriptorValue = descriptor(), failure = "") {
  const request = vi.fn(async (path: string) => {
    if (path === "/entities/e/workspace") return descriptorValue;
    if (failure && path.includes(failure)) throw new Error("Sin facultad");
    if (path.includes("/workspace/conversations"))
      return { items: [], nextOffset: null };
    if (path.includes("/workspace/")) {
      const q = new URL(path, "http://test").searchParams;
      return {
        items: [],
        total: 0,
        offset: Number(q.get("offset")),
        limit: Number(q.get("limit")),
      };
    }
    return [];
  });
  return { request } as unknown as ApiClient;
}
describe("Instantánea administrativa", () => {
  it('el administrador no consulta pacientes, avisos ni conversaciones aunque conserve permisos antiguos',async()=>{const api=fake(descriptor(['members:manage','patients:manage','admissions:manage','notifications:manage']));const result=await loadWorkspace(api,'/entities/e','2026-10-26');const paths=vi.mocked(api.request).mock.calls.map(c=>c[0]);expect(paths.some(p=>/notifications|conversations|directory|admissions|appointments/.test(p))).toBe(false);expect(result.data.agendas).toEqual([]);expect(result.data.patients).toEqual([]);});
  it("carga admisiones reales y anteriores sin fecha sin perder la bandeja", async () => {
    const api = fake(descriptor(["admissions:manage"]));
    const original = vi.mocked(api.request).getMockImplementation()!;
    vi.mocked(api.request).mockImplementation(async (...args) => {
      if (args[0].includes("/lists/admissions")) return {
        items: [
          { id: "old", datos_declarados: { value: '{"firstName":"Anterior","lastName":"Prueba"}' }, creada_en: null, estado: "PENDIENTE", solicitante_id: "account", profesional_entidad_id: "pro" },
          { id: "new", datos_declarados: { firstName: "Actual", lastName: "Prueba" }, creada_en: "2026-10-22T12:00:00Z", estado: "PENDIENTE", solicitante_id: "account", profesional_entidad_id: "pro" },
        ], total: 2, offset: 0, limit: 250,
      };
      return original(...args);
    });
    const result = await loadWorkspace(api, "/entities/e", "2026-10-22");
    expect(result.errors).toEqual([]);
    expect(result.data.items.map(i => [i.name, i.date])).toEqual([["Anterior Prueba", ""], ["Actual Prueba", "2026-10-22"]]);
  });
  it("carga profesionales para gestionar pacientes aunque no haya agendas delegadas", async () => {
    const api = fake({ ...descriptor(["patients:manage"]), agendas: [],
      professionals: [{ id: "professional-id", nombre: "Profesional autorizado" }],
    } as ReturnType<typeof descriptor>);
    const result = await loadWorkspace(api, "/entities/e", "2026-10-22");
    expect(result.data.agendas).toEqual([]);
    expect(result.professionals).toEqual([{ id: "professional-id", name: "Profesional autorizado" }]);
    expect(result.errors).toEqual([]);
  });
  it("consulta únicamente los datos concedidos y usa rango local completo", async () => {
    const api = fake();
    const result = await loadWorkspace(api, "/entities/e", "2026-10-21");
    const paths = vi.mocked(api.request).mock.calls.map((c) => c[0]);
    expect(paths.some((p) => p.includes("/directory"))).toBe(false);
    expect(paths.some((p) => p.includes("/admissions"))).toBe(false);
    expect(paths.some((p) => p.includes("/management-requests"))).toBe(false);
    expect(paths.find((p) => p.includes("/appointments?"))).toContain(
      "from=2026-09-28&until=2026-11-09",
    );
    expect(result.errors).toEqual([]);
    expect(result.data.patients).toEqual([]);
  });
  it("conserva secciones autorizadas al fallar un listado sin inventar datos", async () => {
    const result = await loadWorkspace(
      fake(descriptor(["patients:manage"]), "/directory"),
      "/entities/e",
      "2026-10-21",
    );
    expect(result.data.agendas).toHaveLength(1);
    expect(result.data.patients).toEqual([]);
    expect(result.errors).toEqual(["Pacientes: Sin facultad"]);
  });
  it("propaga el fallo principal para limpiar permisos anteriores", async () => {
    const api = {
      request: vi.fn().mockRejectedValue(new Error("Sesión vencida")),
    } as unknown as ApiClient;
    await expect(
      loadWorkspace(api, "/entities/e", "2026-10-21"),
    ).rejects.toThrow("Sesión vencida");
  });
  it("muestra la práctica y modalidad históricas aunque la oferta haya cambiado", () => {
    const result = appointmentFromDto({
      id: "t",
      paciente_id: "p",
      agenda_id: "a",
      version_oferta_id: "old",
      version_concurrencia: 3,
      numero_version: 2,
      numero_visible: 8,
      inicio_atencion: "2026-10-22T02:00:00Z",
      fin_atencion: "2026-10-22T02:30:00Z",
      zona_horaria: agenda.zona_horaria,
      estado_asistencia: "CONFIRMADA",
      estado_turno: "REGISTRADO",
      nombres: "María",
      apellidos: "Núñez",
      practica: "Consulta original",
      modalidad_elegida: "COBERTURA",
    });
    expect(result).toMatchObject({
      date: "2026-10-21",
      time: "23:00",
      practice: "Consulta original",
      modality: "COBERTURA",
      version: 3,
      patientLabel: "María Núñez",
      attendance: "CONFIRMADA",
    });
  });
  it("incluye la semana adyacente visible al cambiar de mes", () => {
    expect(calendarWindow("2027-01-01")).toEqual({
      from: "2026-12-28",
      until: "2027-02-08",
    });
  });
});
