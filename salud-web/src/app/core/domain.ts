import type { Agenda, Appointment } from "./models";

export const DEMO_DATE = "2026-10-20";
export const TIMEZONE = "America/Argentina/Buenos_Aires";
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}
export function addDays(value: string, amount: number): string {
  const date = parseDate(value);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}
export function dateLabel(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  },
): string {
  return new Intl.DateTimeFormat("es-AR", options).format(parseDate(value));
}
export function minutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
export function timeLabel(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
export function normalized(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
export function weekDates(date: string): string[] {
  const day = parseDate(date).getDay();
  const start = addDays(date, -(day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
export function monthDates(date: string): string[] {
  const d = parseDate(date);
  d.setDate(1);
  const start = weekDates(dateKey(d))[0];
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
export function can(agenda: Agenda | undefined, permission: string): boolean {
  return !!agenda?.permissions.includes(permission);
}
export function hasConflict(
  appointments: Appointment[],
  input: { agendaId: string; date: string; time: string; duration: number },
  except?: string,
): boolean {
  return appointments.some(
    (a) =>
      a.id !== except &&
      a.status === "REGISTRADO" &&
      a.agendaId === input.agendaId &&
      a.date === input.date &&
      minutes(a.time) < minutes(input.time) + input.duration &&
      minutes(input.time) < minutes(a.time) + a.duration,
  );
}
/** Returns an offset timestamp for a local wall clock in the agenda's IANA timezone. */
export function zonedTimestamp(
  date: string,
  time: string,
  timezone: string,
): string {
  const target = Date.parse(`${date}T${time}:00Z`);
  let guess = target;
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(
      fmt.formatToParts(guess).map((x) => [x.type, x.value]),
    );
    const shown = Date.parse(
      `${p["year"]}-${p["month"]}-${p["day"]}T${p["hour"]}:${p["minute"]}:${p["second"]}Z`,
    );
    const correction = target - shown;
    guess += correction;
    if (!correction) break;
  }
  const roundtrip = localTime(new Date(guess).toISOString(), timezone);
  if (roundtrip.date !== date || roundtrip.time !== time)
    throw new Error(
      "Ese horario no existe en la zona de la agenda. Elegí otro horario.",
    );
  return new Date(guess).toISOString();
}
export function localTime(
  value: string,
  timezone: string,
): { date: string; time: string } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(value))
      .map((x) => [x.type, x.value]),
  );
  return {
    date: `${p["year"]}-${p["month"]}-${p["day"]}`,
    time: `${p["hour"]}:${p["minute"]}`,
  };
}
export function csvCell(value: unknown): string {
  let s = String(value ?? "");
  if (/^[\s]*[=+@\-\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Date inputs include the final local day; API timestamp intervals use an exclusive end. */
export function inclusiveDateRange(
  from: string,
  until: string,
  timezone: string,
): { from: string; until: string } {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(until) ||
    until < from
  )
    throw new Error("Revisá las fechas de vigencia.");
  return {
    from: zonedTimestamp(from, "00:00", timezone),
    until: zonedTimestamp(addDays(until, 1), "00:00", timezone),
  };
}
