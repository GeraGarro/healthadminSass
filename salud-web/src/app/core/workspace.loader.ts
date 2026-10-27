import type { ApiClient } from "./api.client";
import type * as Dto from "./api-contracts";
import type { Patient, Workspace } from "./models";
import { readAllPages, readConversationPages, settleLimited } from "./paging";
import { can, initials, localTime, monthDates, addDays } from "./domain";

export const emptyWorkspace = (): Workspace => ({
  agendas: [],
  patients: [],
  practices: [],
  offers: [],
  appointments: [],
  items: [],
  notices: [],
  conversations: [],
  coverages: [],
  hours: [],
  delegations: [],
  audit: [],
  absences: [],
  demoRecords: {
    plans: [],
    agreements: [],
    authorizations: [],
    representations: [],
    access: [],
  },
});

export function patientFromDto(p: Dto.PatientDto): Patient {
  return {
    id: p.id,
    firstName: p.nombres,
    lastName: p.apellidos,
    number: p.numeros || "",
    document: p.documento_declarado || "",
    birthDate: p.nacimiento || "",
    address: p.domicilio || "",
    email: "",
    phone: "",
    coverage: p.cobertura || "Sin registrar",
    memberNumber: "",
    status: p.estado,
    professionalIds: (p.profesionales || "").split(",").filter(Boolean),
  };
}

/** A fresh snapshot is published atomically. One failed section does not fabricate data. */
export function calendarWindow(date: string) {
  const days = monthDates(date);
  return { from: days[0], until: addDays(days[days.length - 1], 1) };
}

export async function loadWorkspace(
  api: ApiClient,
  base: string,
  date: string,
) {
  const range = calendarWindow(date);
  const response = await api.request<Dto.WorkspaceDto>(`${base}/workspace`);
  const institutional=!response.independentOwner&&response.permissions.some(p=>['members:manage','professionals:manage','policy:manage'].includes(p));
  const descriptor={...response,agendas:institutional?[]:response.agendas,permissions:institutional?response.permissions.filter(p=>!['patients:manage','admissions:manage','notifications:manage'].includes(p)):response.permissions};
  const next = emptyWorkspace();
  const palettes = ["sage", "lavender", "peach", "blue"];
  next.agendas = descriptor.agendas.map((a, i) => ({
    id: a.id,
    name: a.nombre,
    professional: a.profesional,
    professionalId: a.profesional_entidad_id,
    branch: a.sede || "Consultorio",
    color: palettes[i % palettes.length],
    initials: initials(a.profesional),
    timezone: a.zona_horaria,
    permissions: a.permissions,
    owner: a.titular,
  }));
  next.delegations = descriptor.delegations.map((d) => ({
    id: d.id,
    agendaId: d.agenda_id,
    memberId: d.membresia_id,
    name: d.nombre,
    permissions: d.permissions,
  }));
  const jobs: { label: string; run: () => Promise<void> }[] = [];
  const read = <T>(label: string, path: string, apply: (result: T) => void) => {
    jobs.push({
      label,
      run: async () =>
        apply(
          (path === "/workspace/conversations"
            ? await readConversationPages(api, `${base}${path}`)
            : path.startsWith("/workspace/")
              ? await readAllPages(api, `${base}${path}`)
              : await api.request<T>(`${base}${path}`)) as T,
        ),
    });
  };
  read<Dto.PracticeDto[]>(
    "Prácticas",
    "/workspace/lists/practices",
    (r) =>
      (next.practices = r.map((p) => ({
        id: p.id,
        name: p.nombre,
        base: p.base_inicial || "",
        duration: 0,
        portal: p.base_inicial === "CONSULTA",
        state: p.estado,
      }))),
  );
  read<Dto.CoverageDto[]>(
    "Coberturas",
    "/workspace/lists/coverages",
    (r) =>
      (next.coverages = r.map((c) => ({
        id: c.id,
        name: c.nombre,
        state: c.estado,
      }))),
  );
  if(!institutional) {
  read<Dto.NoticeDto[]>(
    "Notificaciones",
    "/workspace/lists/notifications",
    (r) =>
      (next.notices = r.map((n) => ({
        id: n.id,
        title: n.tipo==='AGENDA_PERIOD_CANCELLED'?'Agenda cancelada por el profesional':n.tipo.replaceAll("_", " "),
        detail: n.tipo==='AGENDA_PERIOD_CANCELLED'?'Hay turnos cancelados pendientes de reasignación. Revisá Solicitudes.':"Aviso administrativo de la entidad.",
        time: new Date(n.creado_en).toLocaleString("es-AR"),
        read: !!n.leido_en,
        kind: n.tipo==='AGENDA_PERIOD_CANCELLED'?'urgente':"interno",
        state: n.resuelto_en ? "RESUELTO" : "PENDIENTE",
      }))),
  );
  read<Dto.ConversationDto[]>(
    "Conversaciones",
    "/workspace/conversations",
    (r) =>
      (next.conversations = r.map((c) => ({
        id: c.id,
        name: `${c.nombres} ${c.apellidos}`,
        patientId: c.paciente_id,
        preview: c.estado,
        unread: c.unread || 0,
        messages: [],
      }))),
  );
  }
  if (descriptor.permissions.includes("patients:manage")) {
    read<Dto.PatientDto[]>(
      "Pacientes",
      "/workspace/directory",
      (r) => (next.patients = r.map(patientFromDto)),
    );
  }
  if (descriptor.permissions.includes("admissions:manage")) {
    read<Dto.AdmissionDto[]>("Admisiones", "/workspace/lists/admissions", (r) =>
      next.items.push(
        ...r.map((i) => {
          const raw =
            typeof i.datos_declarados === "string"
              ? i.datos_declarados
              : i.datos_declarados.value || i.datos_declarados;
          const declared: { firstName?: string; lastName?: string } =
            typeof raw === "string" ? JSON.parse(raw) : raw;
          return {
            id: i.id,
            type: "admision" as const,
            name: `${declared?.firstName || ""} ${declared?.lastName || ""}`,
            detail: "Verificar identidad, contacto y vinculación.",
            date: i.creada_en?.slice(0, 10) || "",
            state: i.estado,
            accountId: i.solicitante_id,
            professionalId: i.profesional_entidad_id,
          };
        }),
      ),
    );
  }
  for (const a of next.agendas) {
    read<Dto.OfferDto[]>(
      `Ofertas · ${a.name}`,
      `/workspace/lists/offers?agendaId=${a.id}`,
      (r) =>
        next.offers.push(
          ...r.map((o) => ({
            id: o.id,
            stableId: o.oferta_id,
            agendaId: a.id,
            practiceId: o.practica_id || "",
            name: o.nombre,
            duration: o.duracion_min,
            preparation: o.preparacion_min,
            closing: o.cierre_min,
            portal: o.portal_habilitado,
            privatePayment: o.particular_habilitado,
          })),
        ),
    );
    read<Dto.HourDto[]>(
      `Horarios · ${a.name}`,
      `/workspace/lists/hours?agendaId=${a.id}`,
      (r) =>
        next.hours.push(
          ...r.map((h) => ({
            agendaId: a.id,
            day: h.dia_semana,
            start: h.hora_inicio.slice(0, 5),
            end: h.hora_fin.slice(0, 5),
            from: h.desde,
          })),
        ),
    );
    if (can(a, "booking:read"))
      read<Dto.AppointmentDto[]>(
        `Turnos · ${a.name}`,
        `/workspace/appointments?agendaId=${a.id}&from=${range.from}&until=${range.until}`,
        (r) => next.appointments.push(...r.map(appointmentFromDto)),
      );
    if (can(a, "booking:create"))
      read<Dto.ManagementRequestDto[]>(
        `Solicitudes · ${a.name}`,
        `/workspace/lists/management-requests?agendaId=${a.id}`,
        (r) =>
          next.items.push(
            ...r.map((i) => ({
              id: i.id,
              type: "gestion" as const,
              name: "Solicitud de gestión",
              detail: i.motivo,
              date: i.creada_en.slice(0, 10),
              state: i.estado,
              patientId: i.paciente_id,
              agendaId: a.id,
            })),
          ),
      );
    if (can(a, "booking:reschedule"))
      read<Dto.ReschedulingCaseDto[]>(
        `Reprogramaciones · ${a.name}`,
        `/workspace/lists/rescheduling-cases?agendaId=${a.id}`,
        (r) =>
          next.items.push(
            ...r.map((i) => ({
              id: i.id,
              type: "reprogramacion" as const,
              name: "Turno afectado por ausencia",
              detail: "Revisar reemplazo y seguimiento de aviso obligatorio.",
              date: i.inicio_atencion.slice(0, 10),
              state: i.resuelto_en ? "RESUELTA" : "PENDIENTE",
              agendaId: a.id,
              patientId: i.paciente_id,
              appointmentId: i.turno_id,
            })),
          ),
      );
  }
  const results = await settleLimited(jobs.map((job) => job.run));
  const errors = results.flatMap((result, i) =>
    result.status === "rejected"
      ? [
          `${jobs[i].label}: ${result.reason instanceof Error ? result.reason.message : "No se pudo cargar esta sección."}`,
        ]
      : [],
  );
  next.appointments = next.appointments.map((a) => ({
    ...a,
    practice: next.offers.find((o) => o.id === a.offerId)?.name || a.practice,
  }));
  next.items = next.items.filter(
    (x, i, all) => all.findIndex((y) => y.id === x.id) === i,
  );
  return {
    range,
    professional:!!descriptor.professional,
    independentOwner:!!descriptor.independentOwner,
    timezone: descriptor.timezone,
    data: next,
    permissions: descriptor.permissions,
    members: descriptor.members.map((m) => ({ id: m.id, name: m.nombre })),
    professionals: (descriptor.professionals || []).map(p => ({ id: p.id, name: p.nombre })),
    errors,
  };
}

export function appointmentFromDto(
  b: Dto.AppointmentDto,
): import("./models").Appointment {
  return {
    id: b.id,
    patientId: b.paciente_id,
    agendaId: b.agenda_id,
    offerId: b.version_oferta_id,
    practice: b.practica || "Práctica del turno",
    version: b.version_concurrencia,
    patientLabel: `${b.nombres || ""} ${b.apellidos || ""}`.trim(),
    ...localTime(b.inicio_atencion, b.zona_horaria),
    duration: Math.round(
      (Date.parse(b.fin_atencion) - Date.parse(b.inicio_atencion)) / 60000,
    ),
    attendance: b.estado_asistencia,
    status: b.estado_turno,
    number: String(b.numero_visible),
    modality: b.modalidad_elegida || "Ver elegibilidad registrada",
    note: "",
    history: [`Versión ${b.numero_version}`],
  };
}
