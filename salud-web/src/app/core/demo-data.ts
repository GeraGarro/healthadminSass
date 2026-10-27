import type { Workspace, Role } from "./models";
import { DEMO_DATE, addDays } from "./domain";
export const AGENDA_PERMISSIONS = [
  "agenda:read",
  "agenda:configure",
  "booking:read",
  "booking:create",
  "booking:confirm",
  "booking:cancel",
  "booking:reschedule",
];
export function createDemo(role: Role, independent: boolean): Workspace {
  const today = DEMO_DATE;
  const people = [
    ["Valentina", "Pérez", "OSDE", "34798120", "1990-05-17"],
    ["Tomás", "González", "Swiss Medical", "29876342", "1983-08-22"],
    ["Lucía", "Fernández", "Particular", "40345129", "1997-02-10"],
    ["Martín", "Rodríguez", "Galeno", "32567123", "1986-11-03"],
    ["Sofía", "López", "OSDE", "36892145", "1992-06-14"],
    ["Joaquín", "Díaz", "Medifé", "38562109", "1995-03-26"],
    ["Camila", "Torres", "Particular", "42120387", "1999-07-08"],
    ["Mateo", "Romero", "Swiss Medical", "31245891", "1984-12-02"],
    ["Emilia", "Ruiz", "OSDE", "39765214", "1996-09-20"],
    ["Santiago", "Acosta", "Galeno", "28765134", "1981-04-12"],
    ["Isabella", "Medina", "Medifé", "44123765", "2002-01-30"],
    ["Nicolás", "Castro", "Particular", "35567890", "1991-10-06"],
  ];
  const agendas = [
    {
      id: "a1",
      name: "Consultorio 01",
      professional: "Dra. Elena Martínez",
      professionalId: "pr1",
      branch: independent ? "Consultorio particular" : "Sede Centro",
      color: "sage",
      initials: "EM",
      timezone: "America/Argentina/Buenos_Aires",
      permissions: AGENDA_PERMISSIONS,
      owner: role === "profesional",
    },
    {
      id: "a2",
      name: "Consultorio 02",
      professional: "Dr. Diego Suárez",
      professionalId: "pr2",
      branch: "Sede Centro",
      color: "lavender",
      initials: "DS",
      timezone: "America/Argentina/Buenos_Aires",
      permissions: AGENDA_PERMISSIONS.filter((p) => p !== "agenda:configure"),
      owner: false,
    },
    {
      id: "a3",
      name: "Consultorio 03",
      professional: "Dra. Paula Vidal",
      professionalId: "pr3",
      branch: "Sede Norte",
      color: "peach",
      initials: "PV",
      timezone: "America/Argentina/Buenos_Aires",
      permissions: AGENDA_PERMISSIONS.filter((p) => p !== "agenda:configure"),
      owner: false,
    },
  ].filter((_, i) => !(independent || role === "profesional") || i === 0);
  const practices = [
    {
      id: "p1",
      name: "Consulta",
      base: "CONSULTA",
      duration: 30,
      portal: true,
      state: "ACTIVA",
    },
    {
      id: "p2",
      name: "Limpieza",
      base: "LIMPIEZA",
      duration: 45,
      portal: false,
      state: "ACTIVA",
    },
    {
      id: "p3",
      name: "Extracción",
      base: "EXTRACCION",
      duration: 60,
      portal: false,
      state: "ACTIVA",
    },
    {
      id: "p4",
      name: "Cirugía",
      base: "CIRUGIA",
      duration: 90,
      portal: false,
      state: "ACTIVA",
    },
  ];
  const patients = people.map((p, i) => ({
    id: `pt${i + 1}`,
    firstName: p[0],
    lastName: p[1],
    number: String(1042 + i),
    document: p[3],
    birthDate: p[4],
    address: `Domicilio de demostración ${120 + i}`,
    email: `paciente${i + 1}@example.test`,
    phone: `+54 11 0000 ${String(i).padStart(4, "0")}`,
    coverage: p[2],
    memberNumber: p[2] === "Particular" ? "" : `DEMO-${12040 + i}`,
    status: "ACTIVO",
    professionalIds: ["pr1", "pr2", "pr3"],
  }));
  const appointments: Workspace["appointments"] = [];
  const slots = [
    "08:00",
    "09:00",
    "10:30",
    "11:30",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];
  for (let day = -2; day <= 6; day++)
    for (let ag = 0; ag < agendas.length; ag++) {
      if ([0, 6].includes(new Date(`${addDays(today, day)}T12:00:00`).getDay()))
        continue;
      slots.forEach((time, i) => {
        if ((day + ag + i) % 5 === 3) return;
        const patient = patients[(i + ag * 3 + day + 12) % patients.length];
        const practice = practices[(i + ag) % 3];
        appointments.push({
          id: `ap${day + 3}-${ag}-${i}`,
          patientId: patient.id,
          agendaId: agendas[ag].id,
          offerId: `of-${agendas[ag].id}-${practice.id}`,
          practice: practice.name,
          date: addDays(today, day),
          time,
          duration: practice.duration,
          attendance: i % 3 === 1 ? "PENDIENTE" : "CONFIRMADA",
          status: "REGISTRADO",
          number: patient.number,
          modality: patient.coverage,
          note:
            i === 2
              ? "Primera visita. Verificar datos de contacto al recibir."
              : "",
          history: [
            "Turno registrado por secretaría",
            ...(i % 3 === 1 ? [] : ["Asistencia confirmada por el paciente"]),
          ],
        });
      });
    }
  return {
    agendas,
    patients,
    practices,
    absences: [],
    demoRecords: {
      plans: [],
      agreements: [],
      authorizations: [],
      representations: [],
      access: [],
    },
    offers: agendas.flatMap((a) =>
      practices.map((p) => ({
        id: `of-${a.id}-${p.id}`,
        agendaId: a.id,
        practiceId: p.id,
        name: p.name,
        duration: p.duration,
        preparation: 0,
        closing: 0,
        portal: p.portal,
        privatePayment: true,
      })),
    ),
    appointments,
    items: [
      {
        id: "i1",
        type: "admision",
        name: "Clara Benítez",
        detail: "Nueva solicitud de acceso · validar identidad y contacto",
        date: today,
        state: "PENDIENTE",
        accountId: "demo-account-1",
        professionalId: "pr1",
      },
      {
        id: "i2",
        type: "gestion",
        name: "Emilia Ruiz",
        detail: "Solicita coordinar una limpieza. Requiere gestión del equipo.",
        date: today,
        state: "PENDIENTE",
        patientId: "pt9",
        agendaId: "a1",
      },
      {
        id: "i3",
        type: "reprogramacion",
        name: "Santiago Acosta",
        detail: "Ausencia profesional · WhatsApp de aviso pendiente de entrega",
        date: today,
        state: "PENDIENTE",
        patientId: "pt10",
        agendaId: "a1",
      },
      {
        id: "i4",
        type: "gestion",
        name: "Nicolás Castro",
        detail: "Consulta por disponibilidad para extracción",
        date: today,
        state: "PENDIENTE",
        patientId: "pt12",
        agendaId: "a1",
      },
      {
        id: "i5",
        type: "admision",
        name: "Bruno Salas",
        detail: "Solicitud de acceso con representante · comprobar facultades",
        date: today,
        state: "PENDIENTE",
        accountId: "demo-account-2",
        professionalId: "pr1",
      },
    ],
    notices: [
      {
        id: "n1",
        title: "Una reprogramación necesita seguimiento",
        detail: "Santiago Acosta todavía no tiene un nuevo turno.",
        time: "10:12",
        read: false,
        kind: "reprogramacion",
        state: "PENDIENTE",
      },
      {
        id: "n2",
        title: "Asistencia confirmada",
        detail: "Valentina Pérez confirmó su próximo turno.",
        time: "09:48",
        read: false,
        kind: "confirmacion",
        state: "ENTREGADO",
      },
      {
        id: "n3",
        title: "Aviso por WhatsApp sin entregar",
        detail:
          "Revisá el contacto verificado y reintentá desde comunicaciones.",
        time: "09:20",
        read: false,
        kind: "envio",
        state: "FALLIDO",
      },
      {
        id: "n4",
        title: "Correo de confirmación entregado",
        detail: "El aviso fue entregado. La asistencia continúa pendiente.",
        time: "08:40",
        read: true,
        kind: "envio",
        state: "ENTREGADO",
      },
    ],
    conversations:
      role === "profesional"
        ? [
            {
              id: "c1",
              name: "Valentina Pérez",
              patientId: "pt1",
              preview: "Perfecto, muchas gracias. Nos vemos mañana.",
              unread: 1,
              messages: [
                {
                  id: "m1",
                  text: "Buen día, doctora. ¿Debo llevar mi credencial de cobertura?",
                  own: false,
                  time: "09:42",
                },
                {
                  id: "m2",
                  text: "Hola, Valentina. Sí, acercá tu credencial y documento para verificar los datos administrativos.",
                  own: true,
                  time: "09:45",
                },
                {
                  id: "m3",
                  text: "Perfecto, muchas gracias. Nos vemos mañana.",
                  own: false,
                  time: "09:48",
                },
              ],
            },
            {
              id: "c2",
              name: "Tomás González",
              patientId: "pt2",
              preview: "Gracias por la información.",
              unread: 0,
              messages: [
                {
                  id: "m4",
                  text: "Gracias por la información.",
                  own: false,
                  time: "Ayer",
                },
              ],
            },
          ]
        : [],
    coverages: ["OSDE", "Swiss Medical", "Galeno", "Medifé"].map((name, i) => ({
      id: `cv${i + 1}`,
      name,
      state: "ACTIVA",
    })),
    hours: agendas.flatMap((a) =>
      [1, 2, 3, 4, 5].map((day) => ({
        agendaId: a.id,
        day,
        start: "08:00",
        end: "18:00",
        from: today,
      })),
    ),
    delegations:
      role === "profesional"
        ? [
            {
              id: "d1",
              agendaId: "a1",
              memberId: "member1",
              name: "Ana García",
              permissions: AGENDA_PERMISSIONS.filter(
                (p) => p !== "agenda:configure",
              ),
            },
          ]
        : [],
    audit: [
      {
        id: "au1",
        action: "Asistencia confirmada",
        actor: "Paciente",
        time: `${today} 09:48`,
        result: "Correcto",
      },
      {
        id: "au2",
        action: "Turno registrado",
        actor: "Ana García",
        time: `${today} 09:15`,
        result: "Correcto",
      },
    ],
  };
}
