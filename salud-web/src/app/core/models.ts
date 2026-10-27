export type Role = "secretaria" | "profesional" | "administrador";
export type Attendance = "PENDIENTE" | "CONFIRMADA";
export type AgendaPermission =
  | "agenda:read"
  | "agenda:configure"
  | "booking:read"
  | "booking:create"
  | "booking:confirm"
  | "booking:cancel"
  | "booking:reschedule";
export interface Entity {
  timezone?: string;
  id: string;
  name: string;
  type: string;
}
export interface Agenda {
  id: string;
  name: string;
  professional: string;
  professionalId: string;
  branch: string;
  color: string;
  initials: string;
  timezone: string;
  permissions: string[];
  owner: boolean;
}
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  number: string;
  document: string;
  birthDate: string;
  address: string;
  email: string;
  phone: string;
  coverage: string;
  memberNumber: string;
  status: string;
  professionalIds: string[];
}
export interface Practice {
  id: string;
  name: string;
  base: string;
  duration: number;
  portal: boolean;
  state: string;
}
export interface Offer {
  id: string;
  stableId?: string;
  agendaId: string;
  practiceId: string;
  name: string;
  duration: number;
  preparation: number;
  closing: number;
  portal: boolean;
  privatePayment: boolean;
}
export interface Appointment {
  version?: number;
  patientLabel?: string;
  id: string;
  patientId: string;
  agendaId: string;
  offerId: string;
  practice: string;
  date: string;
  time: string;
  duration: number;
  attendance: Attendance;
  status: "REGISTRADO" | "CANCELADO";
  number: string;
  modality: string;
  note: string;
  history: string[];
}
export interface WorkItem {
  id: string;
  type: "admision" | "gestion" | "reprogramacion" | "confirmacion";
  name: string;
  detail: string;
  date: string;
  state: string;
  patientId?: string;
  agendaId?: string;
  accountId?: string;
  professionalId?: string;
  appointmentId?: string;
}
export interface Notice {
  id: string;
  title: string;
  detail: string;
  time: string;
  read: boolean;
  kind: string;
  state: string;
}
export interface Message {
  read?: boolean;
  id: string;
  text: string;
  own: boolean;
  time: string;
  participantId?: string;
}
export interface Conversation {
  id: string;
  name: string;
  patientId: string;
  preview: string;
  unread: number;
  messages: Message[];
  hasOlder?: boolean;
}
export interface Coverage {
  id: string;
  name: string;
  state: string;
}
export interface Hour {
  agendaId: string;
  day: number;
  start: string;
  end: string;
  from: string;
}
export interface Delegation {
  id: string;
  agendaId: string;
  memberId: string;
  name: string;
  permissions: string[];
}
export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  time: string;
  result: string;
}
export interface DemoRecords {
  plans: { id: string; coverageId: string; name: string }[];
  agreements: {
    id: string;
    coverageId: string;
    offerId: string;
    from: string;
    until: string;
    requiresAuthorization: boolean;
  }[];
  authorizations: {
    id: string;
    patientId: string;
    afiliacion_id: string;
    practica_id: string;
    referencia: string;
    estado: string;
    desde: string;
    hasta: string;
  }[];
  representations: {
    id: string;
    patientId: string;
    representante_id: string;
    evidencia_ref: string;
    hasta: string;
  }[];
  access: {
    id: string;
    patientId: string;
    cuenta_id: string;
    estado: string;
  }[];
}
export interface Workspace {
  agendas: Agenda[];
  patients: Patient[];
  practices: Practice[];
  offers: Offer[];
  appointments: Appointment[];
  items: WorkItem[];
  notices: Notice[];
  conversations: Conversation[];
  coverages: Coverage[];
  hours: Hour[];
  delegations: Delegation[];
  audit: AuditEntry[];
  absences: { agendaId: string; start: string; end: string; reason: string }[];
  demoRecords: DemoRecords;
}
export interface BookingInput {
  appointmentId?: string;
  patientId: string;
  agendaId: string;
  offerId: string;
  date: string;
  time: string;
  affiliationId?: string;
  authorizationId?: string;
  note: string;
}
