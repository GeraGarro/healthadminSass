import { describe, it, expect } from "vitest";
import * as d from "./domain";
describe("Reglas compartidas de presentación", () => {
  it("respeta calendario bisiesto y semanas que cruzan de año", () => {
    expect(d.addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(d.weekDates("2027-01-01")[0]).toBe("2026-12-28");
    expect(d.monthDates("2026-02-05")).toHaveLength(42);
    expect(d.dateLabel("2026-10-21")).toContain("21");
  });
  it("normaliza búsquedas y nombres largos sin perder los acentos visibles", () => {
    expect(d.normalized("María Núñez")).toBe("maria nunez");
    expect(d.initials(" María  Núñez Del Valle ")).toBe("MN");
    expect(d.timeLabel(d.minutes("08:05"))).toBe("08:05");
  });
  it("concede exclusivamente la facultad presente en una agenda", () => {
    expect(d.can(undefined, "booking:create")).toBe(false);
    expect(
      d.can({ permissions: ["booking:read"] } as any, "booking:create"),
    ).toBe(false);
    expect(
      d.can({ permissions: ["booking:create"] } as any, "booking:create"),
    ).toBe(true);
  });
  it("permite intervalos contiguos y excluye cancelaciones y al propio turno", () => {
    const turn = {
      id: "t",
      status: "REGISTRADO",
      agendaId: "a",
      date: "2026-10-21",
      time: "09:00",
      duration: 30,
    } as any;
    const input = {
      agendaId: "a",
      date: turn.date,
      time: "09:30",
      duration: 30,
    };
    expect(d.hasConflict([turn], input)).toBe(false);
    expect(d.hasConflict([turn], { ...input, time: "09:15" })).toBe(true);
    expect(d.hasConflict([turn], { ...input, time: "09:15" }, "t")).toBe(false);
    expect(
      d.hasConflict([{ ...turn, status: "CANCELADO" }], {
        ...input,
        time: "09:15",
      }),
    ).toBe(false);
  });
  it("usa la zona IANA y rechaza horas inexistentes en un cambio estacional", () => {
    expect(d.zonedTimestamp("2026-10-21", "10:00", d.TIMEZONE)).toBe(
      "2026-10-21T13:00:00.000Z",
    );
    expect(d.localTime("2026-10-22T02:30:00Z", d.TIMEZONE)).toEqual({
      date: "2026-10-21",
      time: "23:30",
    });
    expect(() =>
      d.zonedTimestamp("2026-03-08", "02:30", "America/New_York"),
    ).toThrow("no existe");
  });
  it("impide fórmulas ejecutables en la exportación CSV", () => {
    expect(d.csvCell(" =SUM(A1)")).toBe('"\' =SUM(A1)"');
    expect(d.csvCell('María "M"')).toBe('"María ""M"""');
    expect(d.csvCell(null)).toBe('""');
  });
});
