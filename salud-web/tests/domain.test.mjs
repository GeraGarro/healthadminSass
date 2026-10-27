import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  monthDates,
  weekDates,
  hasConflict,
  can,
  zonedTimestamp,
  localTime,
  csvCell,
  normalized,
} from "../src/app/core/domain.ts";

test("el calendario conserva fechas al cruzar mes, año y año bisiesto", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.deepEqual(weekDates("2026-10-25"), [
    "2026-10-19",
    "2026-10-20",
    "2026-10-21",
    "2026-10-22",
    "2026-10-23",
    "2026-10-24",
    "2026-10-25",
  ]);
  const dates = monthDates("2026-10-20");
  assert.equal(dates.length, 42);
  assert.equal(new Set(dates).size, 42);
  assert.equal(dates[0], "2026-09-28");
});
test("los turnos contiguos son válidos; un solapamiento conserva la ocupación", () => {
  const booked = [
    {
      id: "1",
      agendaId: "a",
      date: "2026-10-20",
      time: "10:00",
      duration: 45,
      status: "REGISTRADO",
    },
  ];
  assert.equal(
    hasConflict(booked, {
      agendaId: "a",
      date: "2026-10-20",
      time: "10:44",
      duration: 30,
    }),
    true,
  );
  assert.equal(
    hasConflict(booked, {
      agendaId: "a",
      date: "2026-10-20",
      time: "10:45",
      duration: 30,
    }),
    false,
  );
  assert.equal(
    hasConflict(booked, {
      agendaId: "b",
      date: "2026-10-20",
      time: "10:00",
      duration: 30,
    }),
    false,
  );
  assert.equal(
    hasConflict(
      booked,
      { agendaId: "a", date: "2026-10-20", time: "10:00", duration: 45 },
      "1",
    ),
    false,
  );
  assert.equal(
    hasConflict([{ ...booked[0], status: "CANCELADO" }], {
      agendaId: "a",
      date: "2026-10-20",
      time: "10:00",
      duration: 30,
    }),
    false,
  );
});
test("las acciones requieren su facultad explícita, incluido el titular", () => {
  assert.equal(can(undefined, "booking:create"), false);
  assert.equal(can({ owner: true, permissions: [] }, "booking:create"), false);
  assert.equal(can({ permissions: ["agenda:read"] }, "chat:read"), false);
  assert.equal(
    can({ permissions: ["booking:confirm"] }, "booking:confirm"),
    true,
  );
});
test("convierte el horario según la zona de la agenda, independiente de la PC", () => {
  assert.equal(
    zonedTimestamp("2026-10-20", "10:30", "America/Argentina/Buenos_Aires"),
    "2026-10-20T13:30:00.000Z",
  );
  assert.equal(
    zonedTimestamp("2026-01-15", "09:00", "America/New_York"),
    "2026-01-15T14:00:00.000Z",
  );
  assert.equal(
    zonedTimestamp("2026-07-15", "09:00", "America/New_York"),
    "2026-07-15T13:00:00.000Z",
  );
  assert.deepEqual(
    localTime("2026-10-21T01:30:00Z", "America/Argentina/Buenos_Aires"),
    { date: "2026-10-20", time: "22:30" },
  );
  assert.throws(
    () => zonedTimestamp("2026-03-08", "02:30", "America/New_York"),
    /no existe/,
  );
});
test("la exportación escapa fórmulas, comillas y separadores", () => {
  assert.equal(csvCell("=SUM(A1:A2)"), `"'=SUM(A1:A2)"`);
  assert.equal(csvCell(" +cmd"), `"' +cmd"`);
  assert.equal(csvCell('Pérez; "Ana"'), '"Pérez; ""Ana"""');
  assert.equal(normalized("PÉREZ"), "perez");
});
