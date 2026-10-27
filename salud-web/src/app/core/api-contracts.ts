/** DTOs for the administrative workspace. Database names stop at this boundary. */
export interface SessionDto {
  account: { id: string; nombre: string; email_acceso: string; cambio_clave_pendiente?: boolean };
  entities: { id: string; nombre: string; tipo: string }[];
}
export interface WorkspaceDto {
  independentOwner?:boolean;
  professional?:boolean;
  timezone?: string;
  permissions: string[];
  members: { id: string; nombre: string }[];
  professionals?: { id: string; nombre: string }[];
  agendas: {
    id: string;
    nombre: string;
    profesional: string;
    profesional_entidad_id: string;
    sede: string | null;
    zona_horaria: string;
    permissions: string[];
    titular: boolean;
  }[];
  delegations: {
    id: string;
    agenda_id: string;
    membresia_id: string;
    nombre: string;
    permissions: string[];
  }[];
}
export interface PatientDto {
  id: string;
  nombres: string;
  apellidos: string;
  documento_declarado: string | null;
  nacimiento: string | null;
  domicilio: string | null;
  estado: string;
  numeros?: string;
  profesionales?: string;
  cobertura?: string;
}
export interface PatientDetailDto {
  patient: PatientDto;
  numbers: { id?: string; numero_visible: number; profesional_entidad_id: string }[];
}
export interface AffiliationDto {
  id: string;
  nombre: string;
  numero_afiliado: string | null;
  estado_verificacion: string;
  desde: string | null;
  hasta: string | null;
}
export interface AuthorizationDto {
  id: string;
  afiliacion_id: string;
  practica_id: string;
  estado: string;
  desde: string;
  hasta: string;
  referencia?: string;
}
export interface PatientReferencesDto {
  contacts: {
    id: string;
    tipo: string;
    valor: string;
    verificado_en: string | null;
  }[];
  affiliations: AffiliationDto[];
  representations: {
    id: string;
    representante_id: string;
    evidencia_ref: string;
    hasta: string;
    revocada_en?: string | null;
  }[];
  access: { id: string; cuenta_id: string; estado: string }[];
  authorizations: AuthorizationDto[];
}
export interface PracticeDto {
  id: string;
  nombre: string;
  base_inicial: string | null;
  estado: string;
}
export interface CoverageDto {
  id: string;
  nombre: string;
  estado: string;
}
export interface NoticeDto {
  id: string;
  tipo: string;
  creado_en: string;
  leido_en: string | null;
  resuelto_en: string | null;
}
export interface ConversationDto {
  unread?: number;
  id: string;
  nombres: string;
  apellidos: string;
  paciente_id: string;
  estado: string;
}
export interface MessageDto {
  leido?: boolean;
  id: string;
  texto: string;
  propio: boolean;
  enviado_en: string;
  participante_autor_id: string;
}
export interface OfferDto {
  id: string;
  oferta_id: string;
  practica_id: string;
  nombre: string;
  duracion_min: number;
  preparacion_min: number;
  cierre_min: number;
  portal_habilitado: boolean;
  particular_habilitado: boolean;
}
export interface HourDto {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  desde: string;
}
export interface AppointmentDto {
  version_concurrencia?: number;
  nombres?: string;
  apellidos?: string;
  practica?: string;
  modalidad_elegida?: string;
  id: string;
  paciente_id: string;
  agenda_id: string;
  version_oferta_id: string;
  inicio_atencion: string;
  fin_atencion: string;
  zona_horaria: string;
  estado_asistencia: "PENDIENTE" | "CONFIRMADA";
  estado_turno: "REGISTRADO" | "CANCELADO";
  numero_visible: number;
  numero_version: number;
}
export interface PageDto<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}
export interface BookingPatientDto {
  id: string;
  nombres: string;
  apellidos: string;
  numero_visible: number;
}
export interface BookingEligibilityDto {
  affiliations: (AffiliationDto & { requiere_autorizacion: boolean })[];
  authorizations: AuthorizationDto[];
  privatePaymentEnabled: boolean;
}
export interface AdmissionDto {
  id: string;
  datos_declarados:
    | string
    | { value?: string; firstName?: string; lastName?: string };
  creada_en: string | null;
  estado: string;
  solicitante_id: string;
  profesional_entidad_id: string;
}
export interface ManagementRequestDto {
  id: string;
  motivo: string;
  creada_en: string;
  estado: string;
  paciente_id: string;
}
export interface ReschedulingCaseDto {
  id: string;
  inicio_atencion: string;
  resuelto_en: string | null;
  paciente_id: string;
  turno_id: string;
}
