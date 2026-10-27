-- Modelo E-R 1.1 / ADR-015. Restricciones operativas adicionales en V3.

SET search_path TO salud, pg_catalog;

CREATE TABLE cuenta (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    nombre text NOT NULL,
    email_acceso text,
    email_verificado_en timestamptz,
    estado text NOT NULL,
    creada_en timestamptz NOT NULL
);

CREATE TABLE identidad_externa (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    cuenta_id uuid NOT NULL,
    emisor text NOT NULL,
    sujeto text NOT NULL,
    vinculada_en timestamptz NOT NULL,
    revocada_en timestamptz
);

CREATE TABLE credencial_local (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    cuenta_id uuid NOT NULL,
    hash_contrasena text NOT NULL,
    algoritmo_version text NOT NULL,
    actualizada_en timestamptz NOT NULL,
    revocada_en timestamptz
);

CREATE TABLE sesion (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    cuenta_id uuid NOT NULL,
    huella_sesion text NOT NULL,
    iniciada_en timestamptz NOT NULL,
    vence_en timestamptz NOT NULL,
    revocada_en timestamptz,
    mfa_verificada_en timestamptz
);

CREATE TABLE factor_mfa (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    cuenta_id uuid NOT NULL,
    tipo text NOT NULL,
    referencia_secreta text NOT NULL,
    verificado_en timestamptz,
    revocado_en timestamptz
);

CREATE TABLE token_identidad (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    cuenta_id uuid,
    destinatario text NOT NULL,
    huella text NOT NULL,
    proposito text NOT NULL,
    vence_en timestamptz NOT NULL,
    usado_en timestamptz,
    revocado_en timestamptz
);

CREATE TABLE facultad_plataforma (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    cuenta_id uuid NOT NULL,
    permiso_id uuid NOT NULL,
    otorgante_id uuid NOT NULL,
    desde timestamptz NOT NULL,
    hasta timestamptz,
    revocada_en timestamptz
);

CREATE TABLE canal_identidad (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    proveedor text NOT NULL,
    remitente text NOT NULL,
    secreto_ref text NOT NULL,
    estado text NOT NULL
);

CREATE TABLE tarea_identidad (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    token_id uuid NOT NULL,
    canal_id uuid NOT NULL,
    tipo text NOT NULL,
    clave_logica text NOT NULL,
    programada_en timestamptz NOT NULL,
    estado text NOT NULL,
    intentos integer NOT NULL
);

CREATE TABLE envio_identidad (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    tarea_id uuid NOT NULL,
    numero integer NOT NULL,
    referencia_proveedor text,
    iniciado_en timestamptz NOT NULL,
    estado text NOT NULL,
    error_codigo text
);

CREATE TABLE entidad (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    tipo text NOT NULL,
    nombre text NOT NULL,
    zona_horaria text NOT NULL,
    estado text NOT NULL,
    creada_en timestamptz NOT NULL
);

CREATE TABLE sede (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    nombre text NOT NULL,
    direccion text,
    zona_horaria text NOT NULL,
    estado text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE membresia (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    cuenta_id uuid NOT NULL,
    desde timestamptz NOT NULL,
    hasta timestamptz,
    estado text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE rol (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    codigo text NOT NULL,
    nombre text NOT NULL,
    ambito text NOT NULL
);

CREATE TABLE permiso (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    codigo text NOT NULL,
    accion text NOT NULL,
    tipo_ambito text NOT NULL
);

CREATE TABLE rol_permiso (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    rol_id uuid NOT NULL,
    permiso_id uuid NOT NULL
);

CREATE TABLE membresia_rol (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    membresia_id uuid NOT NULL,
    rol_id uuid NOT NULL,
    otorgante_id uuid NOT NULL,
    desde timestamptz NOT NULL,
    hasta timestamptz,
    revocada_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE membresia_permiso (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    membresia_id uuid NOT NULL,
    permiso_id uuid NOT NULL,
    otorgante_id uuid NOT NULL,
    desde timestamptz NOT NULL,
    hasta timestamptz,
    revocada_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE profesional_global (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    cuenta_id uuid,
    nombre_referencia text NOT NULL,
    matricula_referencia text,
    verificacion_ref text,
    estado text NOT NULL
);

CREATE TABLE profesional_entidad (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    profesional_id uuid NOT NULL,
    membresia_id uuid,
    desde timestamptz NOT NULL,
    hasta timestamptz,
    estado text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE solicitud_entidad (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    solicitante_id uuid NOT NULL,
    tipo_entidad text NOT NULL,
    nombre_propuesto text NOT NULL,
    relacion_declarada text NOT NULL,
    admin_contacto text,
    estado text NOT NULL,
    entidad_resultado_id uuid,
    revisor_id uuid,
    resuelta_en timestamptz
);

CREATE TABLE invitacion_equipo (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    emisor_id uuid NOT NULL,
    destinatario text NOT NULL,
    cuenta_destino_id uuid,
    token_id uuid NOT NULL,
    rol_propuesto_id uuid,
    estado text NOT NULL,
    vence_en timestamptz NOT NULL,
    membresia_id uuid,
    UNIQUE (tenant_id, id)
);

CREATE TABLE paciente (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    nombres text NOT NULL,
    apellidos text NOT NULL,
    tipo_documento text,
    documento_declarado text,
    nacimiento date,
    domicilio text,
    estado text NOT NULL,
    estado_datos_cobertura text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE contacto_paciente (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    paciente_id uuid NOT NULL,
    tipo text NOT NULL,
    valor text NOT NULL,
    titular_descripcion text,
    verificado_en timestamptz,
    estado text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE solicitud_admision (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    solicitante_id uuid,
    profesional_entidad_id uuid,
    datos_declarados jsonb NOT NULL,
    contacto_verificado_en timestamptz,
    paciente_resuelto_id uuid,
    estado text NOT NULL,
    revisor_id uuid,
    motivo_interno text,
    resuelta_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE representacion (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    paciente_id uuid NOT NULL,
    representante_id uuid NOT NULL,
    tipo text NOT NULL,
    evidencia_ref text NOT NULL,
    verificador_id uuid NOT NULL,
    desde timestamptz NOT NULL,
    hasta timestamptz,
    restricciones text,
    revocada_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE representacion_permiso (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    representacion_id uuid NOT NULL,
    permiso_id uuid NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE acceso_paciente (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    paciente_id uuid NOT NULL,
    cuenta_id uuid NOT NULL,
    representacion_id uuid,
    solicitud_id uuid,
    aprobador_id uuid NOT NULL,
    aprobado_en timestamptz NOT NULL,
    activado_en timestamptz,
    estado text NOT NULL,
    vinculacion_ref text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE alcance_acceso (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    acceso_id uuid NOT NULL,
    profesional_entidad_id uuid NOT NULL,
    agenda_id uuid,
    permiso_id uuid NOT NULL,
    desde timestamptz NOT NULL,
    hasta timestamptz,
    revocado_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE paciente_profesional (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    profesional_id uuid NOT NULL,
    profesional_entidad_id uuid NOT NULL,
    paciente_id uuid NOT NULL,
    numero_visible integer NOT NULL,
    estado text NOT NULL,
    alta_en timestamptz NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE contador_paciente (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    profesional_id uuid NOT NULL,
    profesional_entidad_id uuid NOT NULL,
    ultimo_confirmado integer NOT NULL,
    version integer NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE agenda (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    profesional_entidad_id uuid NOT NULL,
    sede_id uuid NOT NULL,
    nombre text NOT NULL,
    zona_horaria text NOT NULL,
    estado text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE delegacion_agenda (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    agenda_id uuid NOT NULL,
    membresia_id uuid NOT NULL,
    otorgante_profesional_id uuid NOT NULL,
    desde timestamptz NOT NULL,
    hasta timestamptz,
    revocada_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE delegacion_permiso (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    delegacion_id uuid NOT NULL,
    permiso_id uuid NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE practica (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    codigo_local text NOT NULL,
    origen text NOT NULL,
    base_inicial text,
    estado text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE version_practica (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    practica_id uuid NOT NULL,
    numero_version integer NOT NULL,
    nombre text NOT NULL,
    clasificacion text NOT NULL,
    descripcion text,
    autor_id uuid NOT NULL,
    creada_en timestamptz NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE oferta (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    agenda_id uuid NOT NULL,
    practica_id uuid NOT NULL,
    estado text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE version_oferta (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    oferta_id uuid NOT NULL,
    version_practica_id uuid NOT NULL,
    numero_version integer NOT NULL,
    duracion_min integer NOT NULL,
    preparacion_min integer NOT NULL,
    cierre_min integer NOT NULL,
    modalidad text NOT NULL,
    portal_habilitado boolean NOT NULL,
    gestion_personal boolean NOT NULL,
    particular_habilitado boolean NOT NULL,
    desde timestamptz NOT NULL,
    hasta timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE horario_agenda (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    agenda_id uuid NOT NULL,
    dia_semana integer NOT NULL,
    hora_inicio time NOT NULL,
    hora_fin time NOT NULL,
    desde date NOT NULL,
    hasta date,
    UNIQUE (tenant_id, id)
);

CREATE TABLE excepcion_agenda (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    agenda_id uuid NOT NULL,
    inicio timestamptz NOT NULL,
    fin timestamptz NOT NULL,
    tipo text NOT NULL,
    motivo_interno text,
    lote_id uuid,
    autor_id uuid NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE recurso (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    sede_id uuid NOT NULL,
    nombre text NOT NULL,
    tipo text NOT NULL,
    capacidad integer NOT NULL,
    estado text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE oferta_recurso (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    version_oferta_id uuid NOT NULL,
    recurso_id uuid NOT NULL,
    cantidad integer NOT NULL,
    incluye_preparacion boolean NOT NULL,
    incluye_cierre boolean NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE reserva_recurso (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    recurso_id uuid NOT NULL,
    ocupacion_id uuid NOT NULL,
    inicio timestamptz NOT NULL,
    fin timestamptz NOT NULL,
    cantidad integer NOT NULL,
    estado text NOT NULL,
    vence_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE cobertura_medica (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    nombre text NOT NULL,
    codigo_local text,
    estado text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE plan_cobertura (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    cobertura_id uuid NOT NULL,
    nombre text NOT NULL,
    codigo text,
    estado text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE afiliacion_paciente (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    paciente_id uuid NOT NULL,
    cobertura_id uuid NOT NULL,
    plan_id uuid,
    numero_afiliado text,
    titular_declarado text,
    parentesco text,
    desde date,
    hasta date,
    estado_verificacion text NOT NULL,
    verificacion_ref text,
    UNIQUE (tenant_id, id)
);

CREATE TABLE convenio (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    oferta_id uuid NOT NULL,
    cobertura_id uuid NOT NULL,
    plan_id uuid,
    estado text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE version_convenio (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    convenio_id uuid NOT NULL,
    numero_version integer NOT NULL,
    desde timestamptz NOT NULL,
    hasta timestamptz,
    requiere_autorizacion boolean NOT NULL,
    resultado_regla text NOT NULL,
    condiciones jsonb NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE autorizacion_cobertura (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    afiliacion_id uuid NOT NULL,
    practica_id uuid NOT NULL,
    referencia text NOT NULL,
    estado text NOT NULL,
    desde timestamptz,
    hasta timestamptz,
    verificador_id uuid,
    UNIQUE (tenant_id, id)
);

CREATE TABLE evaluacion_elegibilidad (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    paciente_id uuid NOT NULL,
    version_oferta_id uuid NOT NULL,
    modalidad_elegida text NOT NULL,
    afiliacion_id uuid,
    version_convenio_id uuid,
    autorizacion_id uuid,
    resultado text NOT NULL,
    evaluada_en timestamptz NOT NULL,
    evidencia jsonb NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE ocupacion_global (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    profesional_id uuid NOT NULL,
    inicio timestamptz NOT NULL,
    fin timestamptz NOT NULL,
    estado text NOT NULL,
    vence_en timestamptz,
    referencia_opaca text NOT NULL
);

CREATE TABLE pre_reserva (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    paciente_profesional_id uuid NOT NULL,
    agenda_id uuid NOT NULL,
    version_oferta_id uuid NOT NULL,
    elegibilidad_id uuid NOT NULL,
    ocupacion_id uuid NOT NULL,
    actor_id uuid NOT NULL,
    representacion_id uuid,
    inicio_atencion timestamptz NOT NULL,
    fin_atencion timestamptz NOT NULL,
    vence_en timestamptz NOT NULL,
    estado text NOT NULL,
    renovaciones integer NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE turno (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    paciente_profesional_id uuid NOT NULL,
    pre_reserva_id uuid NOT NULL,
    creador_id uuid NOT NULL,
    creado_en timestamptz NOT NULL,
    estado_turno text NOT NULL,
    estado_asistencia text NOT NULL,
    estado_jornada text NOT NULL,
    version_concurrencia integer NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE version_turno (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    turno_id uuid NOT NULL,
    numero_version integer NOT NULL,
    agenda_id uuid NOT NULL,
    version_oferta_id uuid NOT NULL,
    elegibilidad_id uuid NOT NULL,
    ocupacion_id uuid NOT NULL,
    inicio_atencion timestamptz NOT NULL,
    fin_atencion timestamptz NOT NULL,
    zona_horaria text NOT NULL,
    condiciones_aplicadas jsonb NOT NULL,
    creada_en timestamptz NOT NULL,
    sustituida_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE confirmacion_asistencia (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    version_turno_id uuid NOT NULL,
    actor_id uuid NOT NULL,
    representacion_id uuid,
    medio text NOT NULL,
    confirmada_en timestamptz NOT NULL,
    referencia_evidencia text,
    UNIQUE (tenant_id, id)
);

CREATE TABLE evento_turno (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    turno_id uuid NOT NULL,
    version_turno_id uuid,
    actor_id uuid,
    servicio_actor text,
    tipo text NOT NULL,
    ocurrido_en timestamptz NOT NULL,
    motivo text,
    resultado text NOT NULL,
    cambios_minimos jsonb NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE idempotencia (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    actor_id uuid NOT NULL,
    operacion text NOT NULL,
    clave text NOT NULL,
    huella_entrada text NOT NULL,
    resultado_ref text NOT NULL,
    estado text NOT NULL,
    creada_en timestamptz NOT NULL,
    vence_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE lote_reprogramacion (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    profesional_entidad_id uuid NOT NULL,
    iniciador_id uuid NOT NULL,
    motivo_interno text NOT NULL,
    estado text NOT NULL,
    creado_en timestamptz NOT NULL,
    clave_operacion text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE intervalo_lote (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    lote_id uuid NOT NULL,
    agenda_id uuid NOT NULL,
    inicio timestamptz NOT NULL,
    fin timestamptz NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE turno_afectado (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    lote_id uuid NOT NULL,
    version_original_id uuid NOT NULL,
    turno_reemplazo_id uuid,
    estado_aviso text NOT NULL,
    estado_resolucion text NOT NULL,
    responsable_id uuid,
    resuelto_en timestamptz,
    motivo_cierre text,
    UNIQUE (tenant_id, id)
);

CREATE TABLE solicitud_gestion (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    paciente_id uuid NOT NULL,
    profesional_entidad_id uuid NOT NULL,
    practica_id uuid,
    turno_afectado_id uuid,
    solicitante_id uuid NOT NULL,
    responsable_id uuid,
    motivo text NOT NULL,
    estado text NOT NULL,
    creada_en timestamptz NOT NULL,
    resuelta_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE token_turno (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    version_turno_id uuid NOT NULL,
    destino_id uuid NOT NULL,
    huella text NOT NULL,
    proposito text NOT NULL,
    vence_en timestamptz NOT NULL,
    usado_en timestamptz,
    revocado_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE canal_entidad (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    canal text NOT NULL,
    proveedor text NOT NULL,
    cuenta_externa text NOT NULL,
    remitente text NOT NULL,
    secreto_ref text NOT NULL,
    verificada_en timestamptz,
    estado text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE destino_aviso (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    paciente_id uuid NOT NULL,
    contacto_id uuid NOT NULL,
    cuenta_destinataria_id uuid,
    representacion_id uuid,
    canal text NOT NULL,
    proposito text NOT NULL,
    autorizacion_ref text NOT NULL,
    desde timestamptz NOT NULL,
    hasta timestamptz,
    revocado_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE presupuesto_canal (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    canal_id uuid NOT NULL,
    periodo_inicio timestamptz NOT NULL,
    periodo_fin timestamptz NOT NULL,
    moneda text NOT NULL,
    limite_tecnico numeric(18,4) NOT NULL,
    umbral_alerta numeric(18,4) NOT NULL,
    politica_continuidad text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE consumo_canal (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    intento_id uuid NOT NULL,
    moneda text NOT NULL,
    importe numeric(18,4) NOT NULL,
    tipo_medicion text NOT NULL,
    tarifa_version_ref text NOT NULL,
    registrado_en timestamptz NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE tarea_persistida (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    version_turno_id uuid,
    turno_afectado_id uuid,
    tipo text NOT NULL,
    deduplicacion text NOT NULL,
    programada_en timestamptz NOT NULL,
    estado text NOT NULL,
    intentos integer NOT NULL,
    bloqueada_hasta timestamptz,
    version_politica_ref text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE aviso_externo (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    tarea_id uuid NOT NULL,
    destino_id uuid NOT NULL,
    canal_id uuid NOT NULL,
    clave_logica text NOT NULL,
    plantilla_version_ref text NOT NULL,
    estado text NOT NULL,
    creado_en timestamptz NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE intento_envio (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    aviso_id uuid NOT NULL,
    numero integer NOT NULL,
    referencia_proveedor text,
    iniciado_en timestamptz NOT NULL,
    estado text NOT NULL,
    error_codigo text,
    entregado_en timestamptz,
    leido_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE evento_proveedor (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    canal_id uuid NOT NULL,
    intento_id uuid NOT NULL,
    evento_externo text NOT NULL,
    tipo text NOT NULL,
    ocurrido_en timestamptz NOT NULL,
    recibido_en timestamptz NOT NULL,
    validacion_ref text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE aviso_interno (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    tarea_id uuid,
    version_turno_id uuid,
    conversacion_id uuid,
    destinatario_id uuid NOT NULL,
    tipo text NOT NULL,
    clave_logica text NOT NULL,
    creado_en timestamptz NOT NULL,
    leido_en timestamptz,
    resuelto_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE conversacion (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    paciente_profesional_id uuid NOT NULL,
    estado text NOT NULL,
    creada_en timestamptz NOT NULL,
    cerrada_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE participante_chat (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    conversacion_id uuid NOT NULL,
    cuenta_id uuid NOT NULL,
    representacion_id uuid,
    tipo text NOT NULL,
    desde timestamptz NOT NULL,
    hasta timestamptz,
    revocado_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE participante_permiso (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    participante_id uuid NOT NULL,
    permiso_id uuid NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE mensaje (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    conversacion_id uuid NOT NULL,
    participante_autor_id uuid NOT NULL,
    texto text NOT NULL,
    enviado_en timestamptz NOT NULL,
    estado text NOT NULL,
    correccion_de_id uuid,
    UNIQUE (tenant_id, id)
);

CREATE TABLE lectura_mensaje (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    mensaje_id uuid NOT NULL,
    participante_id uuid NOT NULL,
    leido_en timestamptz NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE transicion_profesional (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    profesional_id uuid NOT NULL,
    entidad_origen_id uuid NOT NULL,
    entidad_destino_id uuid,
    operador_id uuid NOT NULL,
    tipo text NOT NULL,
    estado text NOT NULL,
    fecha_efectiva timestamptz,
    autorizacion_ref text NOT NULL,
    clave_operacion text NOT NULL
);

CREATE TABLE correspondencia_fichaje (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    transicion_id uuid NOT NULL,
    vinculo_origen_id uuid NOT NULL,
    vinculo_destino_id uuid,
    estado text NOT NULL,
    alcance_datos_ref text NOT NULL,
    resolucion_numeracion_ref text
);

CREATE TABLE peticion_eliminacion (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    profesional_id uuid NOT NULL,
    solicitante_id uuid,
    peticion_verificada_ref text NOT NULL,
    solicitada_en timestamptz NOT NULL,
    estado text NOT NULL,
    ejecutor_id uuid,
    ejecutada_en timestamptz,
    referencias_historicas_ref text
);

CREATE TABLE auditoria_entidad (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    actor_id uuid,
    servicio_actor text,
    paciente_id uuid,
    agenda_id uuid,
    accion text NOT NULL,
    recurso_tipo text NOT NULL,
    recurso_ref text NOT NULL,
    ocurrido_en timestamptz NOT NULL,
    resultado text NOT NULL,
    motivo text,
    cambios_minimos jsonb NOT NULL,
    correlacion text NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE auditoria_global (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    actor_id uuid,
    servicio_actor text,
    cuenta_afectada_id uuid,
    accion text NOT NULL,
    ocurrido_en timestamptz NOT NULL,
    resultado text NOT NULL,
    contexto_minimo jsonb NOT NULL
);

CREATE TABLE politica_operativa (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    tipo text NOT NULL,
    numero_version integer NOT NULL,
    parametros jsonb NOT NULL,
    desde timestamptz NOT NULL,
    hasta timestamptz,
    aprobador_id uuid NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE excepcion_politica (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    politica_id uuid NOT NULL,
    paciente_id uuid,
    turno_id uuid,
    actor_beneficiario_id uuid,
    aprobador_id uuid NOT NULL,
    motivo text NOT NULL,
    desde timestamptz NOT NULL,
    hasta timestamptz NOT NULL,
    alcance jsonb NOT NULL,
    UNIQUE (tenant_id, id)
);

CREATE TABLE caso_abuso (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    paciente_id uuid,
    cuenta_id uuid,
    revisor_id uuid,
    senal_minima jsonb NOT NULL,
    estado text NOT NULL,
    decision text,
    abierto_en timestamptz NOT NULL,
    cerrado_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE acceso_soporte (
    tenant_id uuid NOT NULL,
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    operador_id uuid NOT NULL,
    concedente_id uuid NOT NULL,
    motivo text NOT NULL,
    alcance jsonb NOT NULL,
    desde timestamptz NOT NULL,
    hasta timestamptz NOT NULL,
    revocado_en timestamptz,
    UNIQUE (tenant_id, id)
);

CREATE TABLE respaldo (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    operador_ref text NOT NULL,
    repositorio_seguro_ref text NOT NULL,
    iniciado_en timestamptz NOT NULL,
    finalizado_en timestamptz,
    alcance_ref text NOT NULL,
    integridad_ref text,
    estado text NOT NULL
);

CREATE TABLE ensayo_restauracion (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    respaldo_id uuid NOT NULL,
    entorno_ref text NOT NULL,
    ejecutado_en timestamptz NOT NULL,
    duracion_seg integer NOT NULL,
    perdida_datos_seg integer,
    resultado text NOT NULL,
    evidencia_ref text NOT NULL
);

CREATE TABLE incidente (
    id uuid DEFAULT uuidv7() PRIMARY KEY,
    responsable_ref text NOT NULL,
    abierto_en timestamptz NOT NULL,
    cerrado_en timestamptz,
    estado text NOT NULL,
    alcance_minimo text NOT NULL,
    acciones_ref text NOT NULL,
    evidencia_ref text
);

ALTER TABLE identidad_externa ADD CONSTRAINT fk_identidad_externa_1 FOREIGN KEY (cuenta_id) REFERENCES cuenta (id);

CREATE INDEX ix_identidad_externa_1 ON identidad_externa (cuenta_id);

ALTER TABLE credencial_local ADD CONSTRAINT fk_credencial_local_1 FOREIGN KEY (cuenta_id) REFERENCES cuenta (id);

CREATE INDEX ix_credencial_local_1 ON credencial_local (cuenta_id);

ALTER TABLE sesion ADD CONSTRAINT fk_sesion_1 FOREIGN KEY (cuenta_id) REFERENCES cuenta (id);

CREATE INDEX ix_sesion_1 ON sesion (cuenta_id);

ALTER TABLE factor_mfa ADD CONSTRAINT fk_factor_mfa_1 FOREIGN KEY (cuenta_id) REFERENCES cuenta (id);

CREATE INDEX ix_factor_mfa_1 ON factor_mfa (cuenta_id);

ALTER TABLE token_identidad ADD CONSTRAINT fk_token_identidad_1 FOREIGN KEY (cuenta_id) REFERENCES cuenta (id);

CREATE INDEX ix_token_identidad_1 ON token_identidad (cuenta_id);

ALTER TABLE facultad_plataforma ADD CONSTRAINT fk_facultad_plataforma_1 FOREIGN KEY (cuenta_id) REFERENCES cuenta (id);

CREATE INDEX ix_facultad_plataforma_1 ON facultad_plataforma (cuenta_id);

ALTER TABLE facultad_plataforma ADD CONSTRAINT fk_facultad_plataforma_2 FOREIGN KEY (permiso_id) REFERENCES permiso (id);

CREATE INDEX ix_facultad_plataforma_2 ON facultad_plataforma (permiso_id);

ALTER TABLE facultad_plataforma ADD CONSTRAINT fk_facultad_plataforma_3 FOREIGN KEY (otorgante_id) REFERENCES cuenta (id);

CREATE INDEX ix_facultad_plataforma_3 ON facultad_plataforma (otorgante_id);

ALTER TABLE tarea_identidad ADD CONSTRAINT fk_tarea_identidad_1 FOREIGN KEY (token_id) REFERENCES token_identidad (id);

CREATE INDEX ix_tarea_identidad_1 ON tarea_identidad (token_id);

ALTER TABLE tarea_identidad ADD CONSTRAINT fk_tarea_identidad_2 FOREIGN KEY (canal_id) REFERENCES canal_identidad (id);

CREATE INDEX ix_tarea_identidad_2 ON tarea_identidad (canal_id);

ALTER TABLE envio_identidad ADD CONSTRAINT fk_envio_identidad_1 FOREIGN KEY (tarea_id) REFERENCES tarea_identidad (id);

CREATE INDEX ix_envio_identidad_1 ON envio_identidad (tarea_id);

ALTER TABLE sede ADD CONSTRAINT fk_sede_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_sede_0 ON sede (tenant_id);

ALTER TABLE sede ENABLE ROW LEVEL SECURITY;

ALTER TABLE sede FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON sede TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON sede TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE membresia ADD CONSTRAINT fk_membresia_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_membresia_0 ON membresia (tenant_id);

ALTER TABLE membresia ADD CONSTRAINT fk_membresia_2 FOREIGN KEY (cuenta_id) REFERENCES cuenta (id);

CREATE INDEX ix_membresia_2 ON membresia (cuenta_id);

ALTER TABLE membresia ENABLE ROW LEVEL SECURITY;

ALTER TABLE membresia FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON membresia TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON membresia TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE rol_permiso ADD CONSTRAINT fk_rol_permiso_1 FOREIGN KEY (rol_id) REFERENCES rol (id);

CREATE INDEX ix_rol_permiso_1 ON rol_permiso (rol_id);

ALTER TABLE rol_permiso ADD CONSTRAINT fk_rol_permiso_2 FOREIGN KEY (permiso_id) REFERENCES permiso (id);

CREATE INDEX ix_rol_permiso_2 ON rol_permiso (permiso_id);

ALTER TABLE membresia_rol ADD CONSTRAINT fk_membresia_rol_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_membresia_rol_0 ON membresia_rol (tenant_id);

ALTER TABLE membresia_rol ADD CONSTRAINT fk_membresia_rol_2 FOREIGN KEY (tenant_id, membresia_id) REFERENCES membresia (tenant_id, id);

CREATE INDEX ix_membresia_rol_2 ON membresia_rol (tenant_id, membresia_id);

ALTER TABLE membresia_rol ADD CONSTRAINT fk_membresia_rol_3 FOREIGN KEY (rol_id) REFERENCES rol (id);

CREATE INDEX ix_membresia_rol_3 ON membresia_rol (rol_id);

ALTER TABLE membresia_rol ADD CONSTRAINT fk_membresia_rol_4 FOREIGN KEY (otorgante_id) REFERENCES cuenta (id);

CREATE INDEX ix_membresia_rol_4 ON membresia_rol (otorgante_id);

ALTER TABLE membresia_rol ENABLE ROW LEVEL SECURITY;

ALTER TABLE membresia_rol FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON membresia_rol TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON membresia_rol TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE membresia_permiso ADD CONSTRAINT fk_membresia_permiso_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_membresia_permiso_0 ON membresia_permiso (tenant_id);

ALTER TABLE membresia_permiso ADD CONSTRAINT fk_membresia_permiso_2 FOREIGN KEY (tenant_id, membresia_id) REFERENCES membresia (tenant_id, id);

CREATE INDEX ix_membresia_permiso_2 ON membresia_permiso (tenant_id, membresia_id);

ALTER TABLE membresia_permiso ADD CONSTRAINT fk_membresia_permiso_3 FOREIGN KEY (permiso_id) REFERENCES permiso (id);

CREATE INDEX ix_membresia_permiso_3 ON membresia_permiso (permiso_id);

ALTER TABLE membresia_permiso ADD CONSTRAINT fk_membresia_permiso_4 FOREIGN KEY (otorgante_id) REFERENCES cuenta (id);

CREATE INDEX ix_membresia_permiso_4 ON membresia_permiso (otorgante_id);

ALTER TABLE membresia_permiso ENABLE ROW LEVEL SECURITY;

ALTER TABLE membresia_permiso FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON membresia_permiso TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON membresia_permiso TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE profesional_global ADD CONSTRAINT fk_profesional_global_1 FOREIGN KEY (cuenta_id) REFERENCES cuenta (id);

CREATE INDEX ix_profesional_global_1 ON profesional_global (cuenta_id);

ALTER TABLE profesional_entidad ADD CONSTRAINT fk_profesional_entidad_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_profesional_entidad_0 ON profesional_entidad (tenant_id);

ALTER TABLE profesional_entidad ADD CONSTRAINT fk_profesional_entidad_2 FOREIGN KEY (profesional_id) REFERENCES profesional_global (id);

CREATE INDEX ix_profesional_entidad_2 ON profesional_entidad (profesional_id);

ALTER TABLE profesional_entidad ADD CONSTRAINT fk_profesional_entidad_3 FOREIGN KEY (tenant_id, membresia_id) REFERENCES membresia (tenant_id, id);

CREATE INDEX ix_profesional_entidad_3 ON profesional_entidad (tenant_id, membresia_id);

ALTER TABLE profesional_entidad ENABLE ROW LEVEL SECURITY;

ALTER TABLE profesional_entidad FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON profesional_entidad TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON profesional_entidad TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE solicitud_entidad ADD CONSTRAINT fk_solicitud_entidad_1 FOREIGN KEY (solicitante_id) REFERENCES cuenta (id);

CREATE INDEX ix_solicitud_entidad_1 ON solicitud_entidad (solicitante_id);

ALTER TABLE solicitud_entidad ADD CONSTRAINT fk_solicitud_entidad_7 FOREIGN KEY (entidad_resultado_id) REFERENCES entidad (id);

CREATE INDEX ix_solicitud_entidad_7 ON solicitud_entidad (entidad_resultado_id);

ALTER TABLE solicitud_entidad ADD CONSTRAINT fk_solicitud_entidad_8 FOREIGN KEY (revisor_id) REFERENCES cuenta (id);

CREATE INDEX ix_solicitud_entidad_8 ON solicitud_entidad (revisor_id);

ALTER TABLE invitacion_equipo ADD CONSTRAINT fk_invitacion_equipo_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_invitacion_equipo_0 ON invitacion_equipo (tenant_id);

ALTER TABLE invitacion_equipo ADD CONSTRAINT fk_invitacion_equipo_2 FOREIGN KEY (emisor_id) REFERENCES cuenta (id);

CREATE INDEX ix_invitacion_equipo_2 ON invitacion_equipo (emisor_id);

ALTER TABLE invitacion_equipo ADD CONSTRAINT fk_invitacion_equipo_4 FOREIGN KEY (cuenta_destino_id) REFERENCES cuenta (id);

CREATE INDEX ix_invitacion_equipo_4 ON invitacion_equipo (cuenta_destino_id);

ALTER TABLE invitacion_equipo ADD CONSTRAINT fk_invitacion_equipo_5 FOREIGN KEY (token_id) REFERENCES token_identidad (id);

CREATE INDEX ix_invitacion_equipo_5 ON invitacion_equipo (token_id);

ALTER TABLE invitacion_equipo ADD CONSTRAINT fk_invitacion_equipo_6 FOREIGN KEY (rol_propuesto_id) REFERENCES rol (id);

CREATE INDEX ix_invitacion_equipo_6 ON invitacion_equipo (rol_propuesto_id);

ALTER TABLE invitacion_equipo ADD CONSTRAINT fk_invitacion_equipo_9 FOREIGN KEY (tenant_id, membresia_id) REFERENCES membresia (tenant_id, id);

CREATE INDEX ix_invitacion_equipo_9 ON invitacion_equipo (tenant_id, membresia_id);

ALTER TABLE invitacion_equipo ENABLE ROW LEVEL SECURITY;

ALTER TABLE invitacion_equipo FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON invitacion_equipo TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON invitacion_equipo TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE paciente ADD CONSTRAINT fk_paciente_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_paciente_0 ON paciente (tenant_id);

ALTER TABLE paciente ENABLE ROW LEVEL SECURITY;

ALTER TABLE paciente FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON paciente TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON paciente TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE contacto_paciente ADD CONSTRAINT fk_contacto_paciente_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_contacto_paciente_0 ON contacto_paciente (tenant_id);

ALTER TABLE contacto_paciente ADD CONSTRAINT fk_contacto_paciente_2 FOREIGN KEY (tenant_id, paciente_id) REFERENCES paciente (tenant_id, id);

CREATE INDEX ix_contacto_paciente_2 ON contacto_paciente (tenant_id, paciente_id);

ALTER TABLE contacto_paciente ENABLE ROW LEVEL SECURITY;

ALTER TABLE contacto_paciente FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON contacto_paciente TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON contacto_paciente TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE solicitud_admision ADD CONSTRAINT fk_solicitud_admision_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_solicitud_admision_0 ON solicitud_admision (tenant_id);

ALTER TABLE solicitud_admision ADD CONSTRAINT fk_solicitud_admision_2 FOREIGN KEY (solicitante_id) REFERENCES cuenta (id);

CREATE INDEX ix_solicitud_admision_2 ON solicitud_admision (solicitante_id);

ALTER TABLE solicitud_admision ADD CONSTRAINT fk_solicitud_admision_3 FOREIGN KEY (tenant_id, profesional_entidad_id) REFERENCES profesional_entidad (tenant_id, id);

CREATE INDEX ix_solicitud_admision_3 ON solicitud_admision (tenant_id, profesional_entidad_id);

ALTER TABLE solicitud_admision ADD CONSTRAINT fk_solicitud_admision_6 FOREIGN KEY (tenant_id, paciente_resuelto_id) REFERENCES paciente (tenant_id, id);

CREATE INDEX ix_solicitud_admision_6 ON solicitud_admision (tenant_id, paciente_resuelto_id);

ALTER TABLE solicitud_admision ADD CONSTRAINT fk_solicitud_admision_8 FOREIGN KEY (revisor_id) REFERENCES cuenta (id);

CREATE INDEX ix_solicitud_admision_8 ON solicitud_admision (revisor_id);

ALTER TABLE solicitud_admision ENABLE ROW LEVEL SECURITY;

ALTER TABLE solicitud_admision FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON solicitud_admision TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON solicitud_admision TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE representacion ADD CONSTRAINT fk_representacion_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_representacion_0 ON representacion (tenant_id);

ALTER TABLE representacion ADD CONSTRAINT fk_representacion_2 FOREIGN KEY (tenant_id, paciente_id) REFERENCES paciente (tenant_id, id);

CREATE INDEX ix_representacion_2 ON representacion (tenant_id, paciente_id);

ALTER TABLE representacion ADD CONSTRAINT fk_representacion_3 FOREIGN KEY (representante_id) REFERENCES cuenta (id);

CREATE INDEX ix_representacion_3 ON representacion (representante_id);

ALTER TABLE representacion ADD CONSTRAINT fk_representacion_6 FOREIGN KEY (verificador_id) REFERENCES cuenta (id);

CREATE INDEX ix_representacion_6 ON representacion (verificador_id);

ALTER TABLE representacion ENABLE ROW LEVEL SECURITY;

ALTER TABLE representacion FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON representacion TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON representacion TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE representacion_permiso ADD CONSTRAINT fk_representacion_permiso_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_representacion_permiso_0 ON representacion_permiso (tenant_id);

ALTER TABLE representacion_permiso ADD CONSTRAINT fk_representacion_permiso_2 FOREIGN KEY (tenant_id, representacion_id) REFERENCES representacion (tenant_id, id);

CREATE INDEX ix_representacion_permiso_2 ON representacion_permiso (tenant_id, representacion_id);

ALTER TABLE representacion_permiso ADD CONSTRAINT fk_representacion_permiso_3 FOREIGN KEY (permiso_id) REFERENCES permiso (id);

CREATE INDEX ix_representacion_permiso_3 ON representacion_permiso (permiso_id);

ALTER TABLE representacion_permiso ENABLE ROW LEVEL SECURITY;

ALTER TABLE representacion_permiso FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON representacion_permiso TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON representacion_permiso TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE acceso_paciente ADD CONSTRAINT fk_acceso_paciente_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_acceso_paciente_0 ON acceso_paciente (tenant_id);

ALTER TABLE acceso_paciente ADD CONSTRAINT fk_acceso_paciente_2 FOREIGN KEY (tenant_id, paciente_id) REFERENCES paciente (tenant_id, id);

CREATE INDEX ix_acceso_paciente_2 ON acceso_paciente (tenant_id, paciente_id);

ALTER TABLE acceso_paciente ADD CONSTRAINT fk_acceso_paciente_3 FOREIGN KEY (cuenta_id) REFERENCES cuenta (id);

CREATE INDEX ix_acceso_paciente_3 ON acceso_paciente (cuenta_id);

ALTER TABLE acceso_paciente ADD CONSTRAINT fk_acceso_paciente_4 FOREIGN KEY (tenant_id, representacion_id) REFERENCES representacion (tenant_id, id);

CREATE INDEX ix_acceso_paciente_4 ON acceso_paciente (tenant_id, representacion_id);

ALTER TABLE acceso_paciente ADD CONSTRAINT fk_acceso_paciente_5 FOREIGN KEY (tenant_id, solicitud_id) REFERENCES solicitud_admision (tenant_id, id);

CREATE INDEX ix_acceso_paciente_5 ON acceso_paciente (tenant_id, solicitud_id);

ALTER TABLE acceso_paciente ADD CONSTRAINT fk_acceso_paciente_6 FOREIGN KEY (aprobador_id) REFERENCES cuenta (id);

CREATE INDEX ix_acceso_paciente_6 ON acceso_paciente (aprobador_id);

ALTER TABLE acceso_paciente ENABLE ROW LEVEL SECURITY;

ALTER TABLE acceso_paciente FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON acceso_paciente TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON acceso_paciente TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE alcance_acceso ADD CONSTRAINT fk_alcance_acceso_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_alcance_acceso_0 ON alcance_acceso (tenant_id);

ALTER TABLE alcance_acceso ADD CONSTRAINT fk_alcance_acceso_2 FOREIGN KEY (tenant_id, acceso_id) REFERENCES acceso_paciente (tenant_id, id);

CREATE INDEX ix_alcance_acceso_2 ON alcance_acceso (tenant_id, acceso_id);

ALTER TABLE alcance_acceso ADD CONSTRAINT fk_alcance_acceso_3 FOREIGN KEY (tenant_id, profesional_entidad_id) REFERENCES profesional_entidad (tenant_id, id);

CREATE INDEX ix_alcance_acceso_3 ON alcance_acceso (tenant_id, profesional_entidad_id);

ALTER TABLE alcance_acceso ADD CONSTRAINT fk_alcance_acceso_4 FOREIGN KEY (tenant_id, agenda_id) REFERENCES agenda (tenant_id, id);

CREATE INDEX ix_alcance_acceso_4 ON alcance_acceso (tenant_id, agenda_id);

ALTER TABLE alcance_acceso ADD CONSTRAINT fk_alcance_acceso_5 FOREIGN KEY (permiso_id) REFERENCES permiso (id);

CREATE INDEX ix_alcance_acceso_5 ON alcance_acceso (permiso_id);

ALTER TABLE alcance_acceso ENABLE ROW LEVEL SECURITY;

ALTER TABLE alcance_acceso FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON alcance_acceso TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON alcance_acceso TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE paciente_profesional ADD CONSTRAINT fk_paciente_profesional_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_paciente_profesional_0 ON paciente_profesional (tenant_id);

ALTER TABLE paciente_profesional ADD CONSTRAINT fk_paciente_profesional_2 FOREIGN KEY (profesional_id) REFERENCES profesional_global (id);

CREATE INDEX ix_paciente_profesional_2 ON paciente_profesional (profesional_id);

ALTER TABLE paciente_profesional ADD CONSTRAINT fk_paciente_profesional_3 FOREIGN KEY (tenant_id, profesional_entidad_id) REFERENCES profesional_entidad (tenant_id, id);

CREATE INDEX ix_paciente_profesional_3 ON paciente_profesional (tenant_id, profesional_entidad_id);

ALTER TABLE paciente_profesional ADD CONSTRAINT fk_paciente_profesional_4 FOREIGN KEY (tenant_id, paciente_id) REFERENCES paciente (tenant_id, id);

CREATE INDEX ix_paciente_profesional_4 ON paciente_profesional (tenant_id, paciente_id);

ALTER TABLE paciente_profesional ENABLE ROW LEVEL SECURITY;

ALTER TABLE paciente_profesional FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON paciente_profesional TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON paciente_profesional TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE contador_paciente ADD CONSTRAINT fk_contador_paciente_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_contador_paciente_0 ON contador_paciente (tenant_id);

ALTER TABLE contador_paciente ADD CONSTRAINT fk_contador_paciente_2 FOREIGN KEY (profesional_id) REFERENCES profesional_global (id);

CREATE INDEX ix_contador_paciente_2 ON contador_paciente (profesional_id);

ALTER TABLE contador_paciente ADD CONSTRAINT fk_contador_paciente_3 FOREIGN KEY (tenant_id, profesional_entidad_id) REFERENCES profesional_entidad (tenant_id, id);

CREATE INDEX ix_contador_paciente_3 ON contador_paciente (tenant_id, profesional_entidad_id);

ALTER TABLE contador_paciente ENABLE ROW LEVEL SECURITY;

ALTER TABLE contador_paciente FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON contador_paciente TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON contador_paciente TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE agenda ADD CONSTRAINT fk_agenda_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_agenda_0 ON agenda (tenant_id);

ALTER TABLE agenda ADD CONSTRAINT fk_agenda_2 FOREIGN KEY (tenant_id, profesional_entidad_id) REFERENCES profesional_entidad (tenant_id, id);

CREATE INDEX ix_agenda_2 ON agenda (tenant_id, profesional_entidad_id);

ALTER TABLE agenda ADD CONSTRAINT fk_agenda_3 FOREIGN KEY (tenant_id, sede_id) REFERENCES sede (tenant_id, id);

CREATE INDEX ix_agenda_3 ON agenda (tenant_id, sede_id);

ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;

ALTER TABLE agenda FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON agenda TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON agenda TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE delegacion_agenda ADD CONSTRAINT fk_delegacion_agenda_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_delegacion_agenda_0 ON delegacion_agenda (tenant_id);

ALTER TABLE delegacion_agenda ADD CONSTRAINT fk_delegacion_agenda_2 FOREIGN KEY (tenant_id, agenda_id) REFERENCES agenda (tenant_id, id);

CREATE INDEX ix_delegacion_agenda_2 ON delegacion_agenda (tenant_id, agenda_id);

ALTER TABLE delegacion_agenda ADD CONSTRAINT fk_delegacion_agenda_3 FOREIGN KEY (tenant_id, membresia_id) REFERENCES membresia (tenant_id, id);

CREATE INDEX ix_delegacion_agenda_3 ON delegacion_agenda (tenant_id, membresia_id);

ALTER TABLE delegacion_agenda ADD CONSTRAINT fk_delegacion_agenda_4 FOREIGN KEY (tenant_id, otorgante_profesional_id) REFERENCES profesional_entidad (tenant_id, id);

CREATE INDEX ix_delegacion_agenda_4 ON delegacion_agenda (tenant_id, otorgante_profesional_id);

ALTER TABLE delegacion_agenda ENABLE ROW LEVEL SECURITY;

ALTER TABLE delegacion_agenda FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON delegacion_agenda TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON delegacion_agenda TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE delegacion_permiso ADD CONSTRAINT fk_delegacion_permiso_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_delegacion_permiso_0 ON delegacion_permiso (tenant_id);

ALTER TABLE delegacion_permiso ADD CONSTRAINT fk_delegacion_permiso_2 FOREIGN KEY (tenant_id, delegacion_id) REFERENCES delegacion_agenda (tenant_id, id);

CREATE INDEX ix_delegacion_permiso_2 ON delegacion_permiso (tenant_id, delegacion_id);

ALTER TABLE delegacion_permiso ADD CONSTRAINT fk_delegacion_permiso_3 FOREIGN KEY (permiso_id) REFERENCES permiso (id);

CREATE INDEX ix_delegacion_permiso_3 ON delegacion_permiso (permiso_id);

ALTER TABLE delegacion_permiso ENABLE ROW LEVEL SECURITY;

ALTER TABLE delegacion_permiso FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON delegacion_permiso TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON delegacion_permiso TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE practica ADD CONSTRAINT fk_practica_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_practica_0 ON practica (tenant_id);

ALTER TABLE practica ENABLE ROW LEVEL SECURITY;

ALTER TABLE practica FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON practica TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON practica TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE version_practica ADD CONSTRAINT fk_version_practica_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_version_practica_0 ON version_practica (tenant_id);

ALTER TABLE version_practica ADD CONSTRAINT fk_version_practica_2 FOREIGN KEY (tenant_id, practica_id) REFERENCES practica (tenant_id, id);

CREATE INDEX ix_version_practica_2 ON version_practica (tenant_id, practica_id);

ALTER TABLE version_practica ADD CONSTRAINT fk_version_practica_7 FOREIGN KEY (autor_id) REFERENCES cuenta (id);

CREATE INDEX ix_version_practica_7 ON version_practica (autor_id);

ALTER TABLE version_practica ENABLE ROW LEVEL SECURITY;

ALTER TABLE version_practica FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON version_practica TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON version_practica TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE oferta ADD CONSTRAINT fk_oferta_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_oferta_0 ON oferta (tenant_id);

ALTER TABLE oferta ADD CONSTRAINT fk_oferta_2 FOREIGN KEY (tenant_id, agenda_id) REFERENCES agenda (tenant_id, id);

CREATE INDEX ix_oferta_2 ON oferta (tenant_id, agenda_id);

ALTER TABLE oferta ADD CONSTRAINT fk_oferta_3 FOREIGN KEY (tenant_id, practica_id) REFERENCES practica (tenant_id, id);

CREATE INDEX ix_oferta_3 ON oferta (tenant_id, practica_id);

ALTER TABLE oferta ENABLE ROW LEVEL SECURITY;

ALTER TABLE oferta FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON oferta TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON oferta TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE version_oferta ADD CONSTRAINT fk_version_oferta_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_version_oferta_0 ON version_oferta (tenant_id);

ALTER TABLE version_oferta ADD CONSTRAINT fk_version_oferta_2 FOREIGN KEY (tenant_id, oferta_id) REFERENCES oferta (tenant_id, id);

CREATE INDEX ix_version_oferta_2 ON version_oferta (tenant_id, oferta_id);

ALTER TABLE version_oferta ADD CONSTRAINT fk_version_oferta_3 FOREIGN KEY (tenant_id, version_practica_id) REFERENCES version_practica (tenant_id, id);

CREATE INDEX ix_version_oferta_3 ON version_oferta (tenant_id, version_practica_id);

ALTER TABLE version_oferta ENABLE ROW LEVEL SECURITY;

ALTER TABLE version_oferta FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON version_oferta TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON version_oferta TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE horario_agenda ADD CONSTRAINT fk_horario_agenda_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_horario_agenda_0 ON horario_agenda (tenant_id);

ALTER TABLE horario_agenda ADD CONSTRAINT fk_horario_agenda_2 FOREIGN KEY (tenant_id, agenda_id) REFERENCES agenda (tenant_id, id);

CREATE INDEX ix_horario_agenda_2 ON horario_agenda (tenant_id, agenda_id);

ALTER TABLE horario_agenda ENABLE ROW LEVEL SECURITY;

ALTER TABLE horario_agenda FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON horario_agenda TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON horario_agenda TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE excepcion_agenda ADD CONSTRAINT fk_excepcion_agenda_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_excepcion_agenda_0 ON excepcion_agenda (tenant_id);

ALTER TABLE excepcion_agenda ADD CONSTRAINT fk_excepcion_agenda_2 FOREIGN KEY (tenant_id, agenda_id) REFERENCES agenda (tenant_id, id);

CREATE INDEX ix_excepcion_agenda_2 ON excepcion_agenda (tenant_id, agenda_id);

ALTER TABLE excepcion_agenda ADD CONSTRAINT fk_excepcion_agenda_7 FOREIGN KEY (tenant_id, lote_id) REFERENCES lote_reprogramacion (tenant_id, id);

CREATE INDEX ix_excepcion_agenda_7 ON excepcion_agenda (tenant_id, lote_id);

ALTER TABLE excepcion_agenda ADD CONSTRAINT fk_excepcion_agenda_8 FOREIGN KEY (autor_id) REFERENCES cuenta (id);

CREATE INDEX ix_excepcion_agenda_8 ON excepcion_agenda (autor_id);

ALTER TABLE excepcion_agenda ENABLE ROW LEVEL SECURITY;

ALTER TABLE excepcion_agenda FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON excepcion_agenda TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON excepcion_agenda TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE recurso ADD CONSTRAINT fk_recurso_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_recurso_0 ON recurso (tenant_id);

ALTER TABLE recurso ADD CONSTRAINT fk_recurso_2 FOREIGN KEY (tenant_id, sede_id) REFERENCES sede (tenant_id, id);

CREATE INDEX ix_recurso_2 ON recurso (tenant_id, sede_id);

ALTER TABLE recurso ENABLE ROW LEVEL SECURITY;

ALTER TABLE recurso FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON recurso TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON recurso TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE oferta_recurso ADD CONSTRAINT fk_oferta_recurso_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_oferta_recurso_0 ON oferta_recurso (tenant_id);

ALTER TABLE oferta_recurso ADD CONSTRAINT fk_oferta_recurso_2 FOREIGN KEY (tenant_id, version_oferta_id) REFERENCES version_oferta (tenant_id, id);

CREATE INDEX ix_oferta_recurso_2 ON oferta_recurso (tenant_id, version_oferta_id);

ALTER TABLE oferta_recurso ADD CONSTRAINT fk_oferta_recurso_3 FOREIGN KEY (tenant_id, recurso_id) REFERENCES recurso (tenant_id, id);

CREATE INDEX ix_oferta_recurso_3 ON oferta_recurso (tenant_id, recurso_id);

ALTER TABLE oferta_recurso ENABLE ROW LEVEL SECURITY;

ALTER TABLE oferta_recurso FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON oferta_recurso TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON oferta_recurso TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE reserva_recurso ADD CONSTRAINT fk_reserva_recurso_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_reserva_recurso_0 ON reserva_recurso (tenant_id);

ALTER TABLE reserva_recurso ADD CONSTRAINT fk_reserva_recurso_2 FOREIGN KEY (tenant_id, recurso_id) REFERENCES recurso (tenant_id, id);

CREATE INDEX ix_reserva_recurso_2 ON reserva_recurso (tenant_id, recurso_id);

ALTER TABLE reserva_recurso ADD CONSTRAINT fk_reserva_recurso_3 FOREIGN KEY (ocupacion_id) REFERENCES ocupacion_global (id);

CREATE INDEX ix_reserva_recurso_3 ON reserva_recurso (ocupacion_id);

ALTER TABLE reserva_recurso ENABLE ROW LEVEL SECURITY;

ALTER TABLE reserva_recurso FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON reserva_recurso TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON reserva_recurso TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE cobertura_medica ADD CONSTRAINT fk_cobertura_medica_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_cobertura_medica_0 ON cobertura_medica (tenant_id);

ALTER TABLE cobertura_medica ENABLE ROW LEVEL SECURITY;

ALTER TABLE cobertura_medica FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON cobertura_medica TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON cobertura_medica TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE plan_cobertura ADD CONSTRAINT fk_plan_cobertura_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_plan_cobertura_0 ON plan_cobertura (tenant_id);

ALTER TABLE plan_cobertura ADD CONSTRAINT fk_plan_cobertura_2 FOREIGN KEY (tenant_id, cobertura_id) REFERENCES cobertura_medica (tenant_id, id);

CREATE INDEX ix_plan_cobertura_2 ON plan_cobertura (tenant_id, cobertura_id);

ALTER TABLE plan_cobertura ENABLE ROW LEVEL SECURITY;

ALTER TABLE plan_cobertura FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON plan_cobertura TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON plan_cobertura TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE afiliacion_paciente ADD CONSTRAINT fk_afiliacion_paciente_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_afiliacion_paciente_0 ON afiliacion_paciente (tenant_id);

ALTER TABLE afiliacion_paciente ADD CONSTRAINT fk_afiliacion_paciente_2 FOREIGN KEY (tenant_id, paciente_id) REFERENCES paciente (tenant_id, id);

CREATE INDEX ix_afiliacion_paciente_2 ON afiliacion_paciente (tenant_id, paciente_id);

ALTER TABLE afiliacion_paciente ADD CONSTRAINT fk_afiliacion_paciente_3 FOREIGN KEY (tenant_id, cobertura_id) REFERENCES cobertura_medica (tenant_id, id);

CREATE INDEX ix_afiliacion_paciente_3 ON afiliacion_paciente (tenant_id, cobertura_id);

ALTER TABLE afiliacion_paciente ADD CONSTRAINT fk_afiliacion_paciente_4 FOREIGN KEY (tenant_id, plan_id) REFERENCES plan_cobertura (tenant_id, id);

CREATE INDEX ix_afiliacion_paciente_4 ON afiliacion_paciente (tenant_id, plan_id);

ALTER TABLE afiliacion_paciente ENABLE ROW LEVEL SECURITY;

ALTER TABLE afiliacion_paciente FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON afiliacion_paciente TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON afiliacion_paciente TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE convenio ADD CONSTRAINT fk_convenio_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_convenio_0 ON convenio (tenant_id);

ALTER TABLE convenio ADD CONSTRAINT fk_convenio_2 FOREIGN KEY (tenant_id, oferta_id) REFERENCES oferta (tenant_id, id);

CREATE INDEX ix_convenio_2 ON convenio (tenant_id, oferta_id);

ALTER TABLE convenio ADD CONSTRAINT fk_convenio_3 FOREIGN KEY (tenant_id, cobertura_id) REFERENCES cobertura_medica (tenant_id, id);

CREATE INDEX ix_convenio_3 ON convenio (tenant_id, cobertura_id);

ALTER TABLE convenio ADD CONSTRAINT fk_convenio_4 FOREIGN KEY (tenant_id, plan_id) REFERENCES plan_cobertura (tenant_id, id);

CREATE INDEX ix_convenio_4 ON convenio (tenant_id, plan_id);

ALTER TABLE convenio ENABLE ROW LEVEL SECURITY;

ALTER TABLE convenio FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON convenio TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON convenio TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE version_convenio ADD CONSTRAINT fk_version_convenio_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_version_convenio_0 ON version_convenio (tenant_id);

ALTER TABLE version_convenio ADD CONSTRAINT fk_version_convenio_2 FOREIGN KEY (tenant_id, convenio_id) REFERENCES convenio (tenant_id, id);

CREATE INDEX ix_version_convenio_2 ON version_convenio (tenant_id, convenio_id);

ALTER TABLE version_convenio ENABLE ROW LEVEL SECURITY;

ALTER TABLE version_convenio FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON version_convenio TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON version_convenio TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE autorizacion_cobertura ADD CONSTRAINT fk_autorizacion_cobertura_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_autorizacion_cobertura_0 ON autorizacion_cobertura (tenant_id);

ALTER TABLE autorizacion_cobertura ADD CONSTRAINT fk_autorizacion_cobertura_2 FOREIGN KEY (tenant_id, afiliacion_id) REFERENCES afiliacion_paciente (tenant_id, id);

CREATE INDEX ix_autorizacion_cobertura_2 ON autorizacion_cobertura (tenant_id, afiliacion_id);

ALTER TABLE autorizacion_cobertura ADD CONSTRAINT fk_autorizacion_cobertura_3 FOREIGN KEY (tenant_id, practica_id) REFERENCES practica (tenant_id, id);

CREATE INDEX ix_autorizacion_cobertura_3 ON autorizacion_cobertura (tenant_id, practica_id);

ALTER TABLE autorizacion_cobertura ADD CONSTRAINT fk_autorizacion_cobertura_8 FOREIGN KEY (verificador_id) REFERENCES cuenta (id);

CREATE INDEX ix_autorizacion_cobertura_8 ON autorizacion_cobertura (verificador_id);

ALTER TABLE autorizacion_cobertura ENABLE ROW LEVEL SECURITY;

ALTER TABLE autorizacion_cobertura FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON autorizacion_cobertura TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON autorizacion_cobertura TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE evaluacion_elegibilidad ADD CONSTRAINT fk_evaluacion_elegibilidad_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_evaluacion_elegibilidad_0 ON evaluacion_elegibilidad (tenant_id);

ALTER TABLE evaluacion_elegibilidad ADD CONSTRAINT fk_evaluacion_elegibilidad_2 FOREIGN KEY (tenant_id, paciente_id) REFERENCES paciente (tenant_id, id);

CREATE INDEX ix_evaluacion_elegibilidad_2 ON evaluacion_elegibilidad (tenant_id, paciente_id);

ALTER TABLE evaluacion_elegibilidad ADD CONSTRAINT fk_evaluacion_elegibilidad_3 FOREIGN KEY (tenant_id, version_oferta_id) REFERENCES version_oferta (tenant_id, id);

CREATE INDEX ix_evaluacion_elegibilidad_3 ON evaluacion_elegibilidad (tenant_id, version_oferta_id);

ALTER TABLE evaluacion_elegibilidad ADD CONSTRAINT fk_evaluacion_elegibilidad_5 FOREIGN KEY (tenant_id, afiliacion_id) REFERENCES afiliacion_paciente (tenant_id, id);

CREATE INDEX ix_evaluacion_elegibilidad_5 ON evaluacion_elegibilidad (tenant_id, afiliacion_id);

ALTER TABLE evaluacion_elegibilidad ADD CONSTRAINT fk_evaluacion_elegibilidad_6 FOREIGN KEY (tenant_id, version_convenio_id) REFERENCES version_convenio (tenant_id, id);

CREATE INDEX ix_evaluacion_elegibilidad_6 ON evaluacion_elegibilidad (tenant_id, version_convenio_id);

ALTER TABLE evaluacion_elegibilidad ADD CONSTRAINT fk_evaluacion_elegibilidad_7 FOREIGN KEY (tenant_id, autorizacion_id) REFERENCES autorizacion_cobertura (tenant_id, id);

CREATE INDEX ix_evaluacion_elegibilidad_7 ON evaluacion_elegibilidad (tenant_id, autorizacion_id);

ALTER TABLE evaluacion_elegibilidad ENABLE ROW LEVEL SECURITY;

ALTER TABLE evaluacion_elegibilidad FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON evaluacion_elegibilidad TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON evaluacion_elegibilidad TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE ocupacion_global ADD CONSTRAINT fk_ocupacion_global_1 FOREIGN KEY (profesional_id) REFERENCES profesional_global (id);

CREATE INDEX ix_ocupacion_global_1 ON ocupacion_global (profesional_id);

ALTER TABLE pre_reserva ADD CONSTRAINT fk_pre_reserva_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_pre_reserva_0 ON pre_reserva (tenant_id);

ALTER TABLE pre_reserva ADD CONSTRAINT fk_pre_reserva_2 FOREIGN KEY (tenant_id, paciente_profesional_id) REFERENCES paciente_profesional (tenant_id, id);

CREATE INDEX ix_pre_reserva_2 ON pre_reserva (tenant_id, paciente_profesional_id);

ALTER TABLE pre_reserva ADD CONSTRAINT fk_pre_reserva_3 FOREIGN KEY (tenant_id, agenda_id) REFERENCES agenda (tenant_id, id);

CREATE INDEX ix_pre_reserva_3 ON pre_reserva (tenant_id, agenda_id);

ALTER TABLE pre_reserva ADD CONSTRAINT fk_pre_reserva_4 FOREIGN KEY (tenant_id, version_oferta_id) REFERENCES version_oferta (tenant_id, id);

CREATE INDEX ix_pre_reserva_4 ON pre_reserva (tenant_id, version_oferta_id);

ALTER TABLE pre_reserva ADD CONSTRAINT fk_pre_reserva_5 FOREIGN KEY (tenant_id, elegibilidad_id) REFERENCES evaluacion_elegibilidad (tenant_id, id);

CREATE INDEX ix_pre_reserva_5 ON pre_reserva (tenant_id, elegibilidad_id);

ALTER TABLE pre_reserva ADD CONSTRAINT fk_pre_reserva_6 FOREIGN KEY (ocupacion_id) REFERENCES ocupacion_global (id);

CREATE INDEX ix_pre_reserva_6 ON pre_reserva (ocupacion_id);

ALTER TABLE pre_reserva ADD CONSTRAINT fk_pre_reserva_7 FOREIGN KEY (actor_id) REFERENCES cuenta (id);

CREATE INDEX ix_pre_reserva_7 ON pre_reserva (actor_id);

ALTER TABLE pre_reserva ADD CONSTRAINT fk_pre_reserva_8 FOREIGN KEY (tenant_id, representacion_id) REFERENCES representacion (tenant_id, id);

CREATE INDEX ix_pre_reserva_8 ON pre_reserva (tenant_id, representacion_id);

ALTER TABLE pre_reserva ENABLE ROW LEVEL SECURITY;

ALTER TABLE pre_reserva FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON pre_reserva TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON pre_reserva TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE turno ADD CONSTRAINT fk_turno_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_turno_0 ON turno (tenant_id);

ALTER TABLE turno ADD CONSTRAINT fk_turno_2 FOREIGN KEY (tenant_id, paciente_profesional_id) REFERENCES paciente_profesional (tenant_id, id);

CREATE INDEX ix_turno_2 ON turno (tenant_id, paciente_profesional_id);

ALTER TABLE turno ADD CONSTRAINT fk_turno_3 FOREIGN KEY (tenant_id, pre_reserva_id) REFERENCES pre_reserva (tenant_id, id);

CREATE INDEX ix_turno_3 ON turno (tenant_id, pre_reserva_id);

ALTER TABLE turno ADD CONSTRAINT fk_turno_4 FOREIGN KEY (creador_id) REFERENCES cuenta (id);

CREATE INDEX ix_turno_4 ON turno (creador_id);

ALTER TABLE turno ENABLE ROW LEVEL SECURITY;

ALTER TABLE turno FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON turno TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON turno TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE version_turno ADD CONSTRAINT fk_version_turno_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_version_turno_0 ON version_turno (tenant_id);

ALTER TABLE version_turno ADD CONSTRAINT fk_version_turno_2 FOREIGN KEY (tenant_id, turno_id) REFERENCES turno (tenant_id, id);

CREATE INDEX ix_version_turno_2 ON version_turno (tenant_id, turno_id);

ALTER TABLE version_turno ADD CONSTRAINT fk_version_turno_4 FOREIGN KEY (tenant_id, agenda_id) REFERENCES agenda (tenant_id, id);

CREATE INDEX ix_version_turno_4 ON version_turno (tenant_id, agenda_id);

ALTER TABLE version_turno ADD CONSTRAINT fk_version_turno_5 FOREIGN KEY (tenant_id, version_oferta_id) REFERENCES version_oferta (tenant_id, id);

CREATE INDEX ix_version_turno_5 ON version_turno (tenant_id, version_oferta_id);

ALTER TABLE version_turno ADD CONSTRAINT fk_version_turno_6 FOREIGN KEY (tenant_id, elegibilidad_id) REFERENCES evaluacion_elegibilidad (tenant_id, id);

CREATE INDEX ix_version_turno_6 ON version_turno (tenant_id, elegibilidad_id);

ALTER TABLE version_turno ADD CONSTRAINT fk_version_turno_7 FOREIGN KEY (ocupacion_id) REFERENCES ocupacion_global (id);

CREATE INDEX ix_version_turno_7 ON version_turno (ocupacion_id);

ALTER TABLE version_turno ENABLE ROW LEVEL SECURITY;

ALTER TABLE version_turno FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON version_turno TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON version_turno TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE confirmacion_asistencia ADD CONSTRAINT fk_confirmacion_asistencia_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_confirmacion_asistencia_0 ON confirmacion_asistencia (tenant_id);

ALTER TABLE confirmacion_asistencia ADD CONSTRAINT fk_confirmacion_asistencia_2 FOREIGN KEY (tenant_id, version_turno_id) REFERENCES version_turno (tenant_id, id);

CREATE INDEX ix_confirmacion_asistencia_2 ON confirmacion_asistencia (tenant_id, version_turno_id);

ALTER TABLE confirmacion_asistencia ADD CONSTRAINT fk_confirmacion_asistencia_3 FOREIGN KEY (actor_id) REFERENCES cuenta (id);

CREATE INDEX ix_confirmacion_asistencia_3 ON confirmacion_asistencia (actor_id);

ALTER TABLE confirmacion_asistencia ADD CONSTRAINT fk_confirmacion_asistencia_4 FOREIGN KEY (tenant_id, representacion_id) REFERENCES representacion (tenant_id, id);

CREATE INDEX ix_confirmacion_asistencia_4 ON confirmacion_asistencia (tenant_id, representacion_id);

ALTER TABLE confirmacion_asistencia ENABLE ROW LEVEL SECURITY;

ALTER TABLE confirmacion_asistencia FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON confirmacion_asistencia TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON confirmacion_asistencia TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE evento_turno ADD CONSTRAINT fk_evento_turno_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_evento_turno_0 ON evento_turno (tenant_id);

ALTER TABLE evento_turno ADD CONSTRAINT fk_evento_turno_2 FOREIGN KEY (tenant_id, turno_id) REFERENCES turno (tenant_id, id);

CREATE INDEX ix_evento_turno_2 ON evento_turno (tenant_id, turno_id);

ALTER TABLE evento_turno ADD CONSTRAINT fk_evento_turno_3 FOREIGN KEY (tenant_id, version_turno_id) REFERENCES version_turno (tenant_id, id);

CREATE INDEX ix_evento_turno_3 ON evento_turno (tenant_id, version_turno_id);

ALTER TABLE evento_turno ADD CONSTRAINT fk_evento_turno_4 FOREIGN KEY (actor_id) REFERENCES cuenta (id);

CREATE INDEX ix_evento_turno_4 ON evento_turno (actor_id);

ALTER TABLE evento_turno ENABLE ROW LEVEL SECURITY;

ALTER TABLE evento_turno FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON evento_turno TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON evento_turno TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE idempotencia ADD CONSTRAINT fk_idempotencia_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_idempotencia_0 ON idempotencia (tenant_id);

ALTER TABLE idempotencia ADD CONSTRAINT fk_idempotencia_2 FOREIGN KEY (actor_id) REFERENCES cuenta (id);

CREATE INDEX ix_idempotencia_2 ON idempotencia (actor_id);

ALTER TABLE idempotencia ENABLE ROW LEVEL SECURITY;

ALTER TABLE idempotencia FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON idempotencia TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON idempotencia TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE lote_reprogramacion ADD CONSTRAINT fk_lote_reprogramacion_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_lote_reprogramacion_0 ON lote_reprogramacion (tenant_id);

ALTER TABLE lote_reprogramacion ADD CONSTRAINT fk_lote_reprogramacion_2 FOREIGN KEY (tenant_id, profesional_entidad_id) REFERENCES profesional_entidad (tenant_id, id);

CREATE INDEX ix_lote_reprogramacion_2 ON lote_reprogramacion (tenant_id, profesional_entidad_id);

ALTER TABLE lote_reprogramacion ADD CONSTRAINT fk_lote_reprogramacion_3 FOREIGN KEY (iniciador_id) REFERENCES cuenta (id);

CREATE INDEX ix_lote_reprogramacion_3 ON lote_reprogramacion (iniciador_id);

ALTER TABLE lote_reprogramacion ENABLE ROW LEVEL SECURITY;

ALTER TABLE lote_reprogramacion FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON lote_reprogramacion TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON lote_reprogramacion TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE intervalo_lote ADD CONSTRAINT fk_intervalo_lote_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_intervalo_lote_0 ON intervalo_lote (tenant_id);

ALTER TABLE intervalo_lote ADD CONSTRAINT fk_intervalo_lote_2 FOREIGN KEY (tenant_id, lote_id) REFERENCES lote_reprogramacion (tenant_id, id);

CREATE INDEX ix_intervalo_lote_2 ON intervalo_lote (tenant_id, lote_id);

ALTER TABLE intervalo_lote ADD CONSTRAINT fk_intervalo_lote_3 FOREIGN KEY (tenant_id, agenda_id) REFERENCES agenda (tenant_id, id);

CREATE INDEX ix_intervalo_lote_3 ON intervalo_lote (tenant_id, agenda_id);

ALTER TABLE intervalo_lote ENABLE ROW LEVEL SECURITY;

ALTER TABLE intervalo_lote FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON intervalo_lote TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON intervalo_lote TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE turno_afectado ADD CONSTRAINT fk_turno_afectado_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_turno_afectado_0 ON turno_afectado (tenant_id);

ALTER TABLE turno_afectado ADD CONSTRAINT fk_turno_afectado_2 FOREIGN KEY (tenant_id, lote_id) REFERENCES lote_reprogramacion (tenant_id, id);

CREATE INDEX ix_turno_afectado_2 ON turno_afectado (tenant_id, lote_id);

ALTER TABLE turno_afectado ADD CONSTRAINT fk_turno_afectado_3 FOREIGN KEY (tenant_id, version_original_id) REFERENCES version_turno (tenant_id, id);

CREATE INDEX ix_turno_afectado_3 ON turno_afectado (tenant_id, version_original_id);

ALTER TABLE turno_afectado ADD CONSTRAINT fk_turno_afectado_4 FOREIGN KEY (tenant_id, turno_reemplazo_id) REFERENCES turno (tenant_id, id);

CREATE INDEX ix_turno_afectado_4 ON turno_afectado (tenant_id, turno_reemplazo_id);

ALTER TABLE turno_afectado ADD CONSTRAINT fk_turno_afectado_7 FOREIGN KEY (responsable_id) REFERENCES cuenta (id);

CREATE INDEX ix_turno_afectado_7 ON turno_afectado (responsable_id);

ALTER TABLE turno_afectado ENABLE ROW LEVEL SECURITY;

ALTER TABLE turno_afectado FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON turno_afectado TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON turno_afectado TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE solicitud_gestion ADD CONSTRAINT fk_solicitud_gestion_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_solicitud_gestion_0 ON solicitud_gestion (tenant_id);

ALTER TABLE solicitud_gestion ADD CONSTRAINT fk_solicitud_gestion_2 FOREIGN KEY (tenant_id, paciente_id) REFERENCES paciente (tenant_id, id);

CREATE INDEX ix_solicitud_gestion_2 ON solicitud_gestion (tenant_id, paciente_id);

ALTER TABLE solicitud_gestion ADD CONSTRAINT fk_solicitud_gestion_3 FOREIGN KEY (tenant_id, profesional_entidad_id) REFERENCES profesional_entidad (tenant_id, id);

CREATE INDEX ix_solicitud_gestion_3 ON solicitud_gestion (tenant_id, profesional_entidad_id);

ALTER TABLE solicitud_gestion ADD CONSTRAINT fk_solicitud_gestion_4 FOREIGN KEY (tenant_id, practica_id) REFERENCES practica (tenant_id, id);

CREATE INDEX ix_solicitud_gestion_4 ON solicitud_gestion (tenant_id, practica_id);

ALTER TABLE solicitud_gestion ADD CONSTRAINT fk_solicitud_gestion_5 FOREIGN KEY (tenant_id, turno_afectado_id) REFERENCES turno_afectado (tenant_id, id);

CREATE INDEX ix_solicitud_gestion_5 ON solicitud_gestion (tenant_id, turno_afectado_id);

ALTER TABLE solicitud_gestion ADD CONSTRAINT fk_solicitud_gestion_6 FOREIGN KEY (solicitante_id) REFERENCES cuenta (id);

CREATE INDEX ix_solicitud_gestion_6 ON solicitud_gestion (solicitante_id);

ALTER TABLE solicitud_gestion ADD CONSTRAINT fk_solicitud_gestion_7 FOREIGN KEY (responsable_id) REFERENCES cuenta (id);

CREATE INDEX ix_solicitud_gestion_7 ON solicitud_gestion (responsable_id);

ALTER TABLE solicitud_gestion ENABLE ROW LEVEL SECURITY;

ALTER TABLE solicitud_gestion FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON solicitud_gestion TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON solicitud_gestion TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE token_turno ADD CONSTRAINT fk_token_turno_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_token_turno_0 ON token_turno (tenant_id);

ALTER TABLE token_turno ADD CONSTRAINT fk_token_turno_2 FOREIGN KEY (tenant_id, version_turno_id) REFERENCES version_turno (tenant_id, id);

CREATE INDEX ix_token_turno_2 ON token_turno (tenant_id, version_turno_id);

ALTER TABLE token_turno ADD CONSTRAINT fk_token_turno_3 FOREIGN KEY (tenant_id, destino_id) REFERENCES destino_aviso (tenant_id, id);

CREATE INDEX ix_token_turno_3 ON token_turno (tenant_id, destino_id);

ALTER TABLE token_turno ENABLE ROW LEVEL SECURITY;

ALTER TABLE token_turno FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON token_turno TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON token_turno TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE canal_entidad ADD CONSTRAINT fk_canal_entidad_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_canal_entidad_0 ON canal_entidad (tenant_id);

ALTER TABLE canal_entidad ENABLE ROW LEVEL SECURITY;

ALTER TABLE canal_entidad FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON canal_entidad TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON canal_entidad TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE destino_aviso ADD CONSTRAINT fk_destino_aviso_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_destino_aviso_0 ON destino_aviso (tenant_id);

ALTER TABLE destino_aviso ADD CONSTRAINT fk_destino_aviso_2 FOREIGN KEY (tenant_id, paciente_id) REFERENCES paciente (tenant_id, id);

CREATE INDEX ix_destino_aviso_2 ON destino_aviso (tenant_id, paciente_id);

ALTER TABLE destino_aviso ADD CONSTRAINT fk_destino_aviso_3 FOREIGN KEY (tenant_id, contacto_id) REFERENCES contacto_paciente (tenant_id, id);

CREATE INDEX ix_destino_aviso_3 ON destino_aviso (tenant_id, contacto_id);

ALTER TABLE destino_aviso ADD CONSTRAINT fk_destino_aviso_4 FOREIGN KEY (cuenta_destinataria_id) REFERENCES cuenta (id);

CREATE INDEX ix_destino_aviso_4 ON destino_aviso (cuenta_destinataria_id);

ALTER TABLE destino_aviso ADD CONSTRAINT fk_destino_aviso_5 FOREIGN KEY (tenant_id, representacion_id) REFERENCES representacion (tenant_id, id);

CREATE INDEX ix_destino_aviso_5 ON destino_aviso (tenant_id, representacion_id);

ALTER TABLE destino_aviso ENABLE ROW LEVEL SECURITY;

ALTER TABLE destino_aviso FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON destino_aviso TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON destino_aviso TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE presupuesto_canal ADD CONSTRAINT fk_presupuesto_canal_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_presupuesto_canal_0 ON presupuesto_canal (tenant_id);

ALTER TABLE presupuesto_canal ADD CONSTRAINT fk_presupuesto_canal_2 FOREIGN KEY (tenant_id, canal_id) REFERENCES canal_entidad (tenant_id, id);

CREATE INDEX ix_presupuesto_canal_2 ON presupuesto_canal (tenant_id, canal_id);

ALTER TABLE presupuesto_canal ENABLE ROW LEVEL SECURITY;

ALTER TABLE presupuesto_canal FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON presupuesto_canal TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON presupuesto_canal TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE consumo_canal ADD CONSTRAINT fk_consumo_canal_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_consumo_canal_0 ON consumo_canal (tenant_id);

ALTER TABLE consumo_canal ADD CONSTRAINT fk_consumo_canal_2 FOREIGN KEY (tenant_id, intento_id) REFERENCES intento_envio (tenant_id, id);

CREATE INDEX ix_consumo_canal_2 ON consumo_canal (tenant_id, intento_id);

ALTER TABLE consumo_canal ENABLE ROW LEVEL SECURITY;

ALTER TABLE consumo_canal FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON consumo_canal TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON consumo_canal TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE tarea_persistida ADD CONSTRAINT fk_tarea_persistida_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_tarea_persistida_0 ON tarea_persistida (tenant_id);

ALTER TABLE tarea_persistida ADD CONSTRAINT fk_tarea_persistida_2 FOREIGN KEY (tenant_id, version_turno_id) REFERENCES version_turno (tenant_id, id);

CREATE INDEX ix_tarea_persistida_2 ON tarea_persistida (tenant_id, version_turno_id);

ALTER TABLE tarea_persistida ADD CONSTRAINT fk_tarea_persistida_3 FOREIGN KEY (tenant_id, turno_afectado_id) REFERENCES turno_afectado (tenant_id, id);

CREATE INDEX ix_tarea_persistida_3 ON tarea_persistida (tenant_id, turno_afectado_id);

ALTER TABLE tarea_persistida ENABLE ROW LEVEL SECURITY;

ALTER TABLE tarea_persistida FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tarea_persistida TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON tarea_persistida TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE aviso_externo ADD CONSTRAINT fk_aviso_externo_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_aviso_externo_0 ON aviso_externo (tenant_id);

ALTER TABLE aviso_externo ADD CONSTRAINT fk_aviso_externo_2 FOREIGN KEY (tenant_id, tarea_id) REFERENCES tarea_persistida (tenant_id, id);

CREATE INDEX ix_aviso_externo_2 ON aviso_externo (tenant_id, tarea_id);

ALTER TABLE aviso_externo ADD CONSTRAINT fk_aviso_externo_3 FOREIGN KEY (tenant_id, destino_id) REFERENCES destino_aviso (tenant_id, id);

CREATE INDEX ix_aviso_externo_3 ON aviso_externo (tenant_id, destino_id);

ALTER TABLE aviso_externo ADD CONSTRAINT fk_aviso_externo_4 FOREIGN KEY (tenant_id, canal_id) REFERENCES canal_entidad (tenant_id, id);

CREATE INDEX ix_aviso_externo_4 ON aviso_externo (tenant_id, canal_id);

ALTER TABLE aviso_externo ENABLE ROW LEVEL SECURITY;

ALTER TABLE aviso_externo FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON aviso_externo TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON aviso_externo TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE intento_envio ADD CONSTRAINT fk_intento_envio_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_intento_envio_0 ON intento_envio (tenant_id);

ALTER TABLE intento_envio ADD CONSTRAINT fk_intento_envio_2 FOREIGN KEY (tenant_id, aviso_id) REFERENCES aviso_externo (tenant_id, id);

CREATE INDEX ix_intento_envio_2 ON intento_envio (tenant_id, aviso_id);

ALTER TABLE intento_envio ENABLE ROW LEVEL SECURITY;

ALTER TABLE intento_envio FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON intento_envio TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON intento_envio TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE evento_proveedor ADD CONSTRAINT fk_evento_proveedor_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_evento_proveedor_0 ON evento_proveedor (tenant_id);

ALTER TABLE evento_proveedor ADD CONSTRAINT fk_evento_proveedor_2 FOREIGN KEY (tenant_id, canal_id) REFERENCES canal_entidad (tenant_id, id);

CREATE INDEX ix_evento_proveedor_2 ON evento_proveedor (tenant_id, canal_id);

ALTER TABLE evento_proveedor ADD CONSTRAINT fk_evento_proveedor_3 FOREIGN KEY (tenant_id, intento_id) REFERENCES intento_envio (tenant_id, id);

CREATE INDEX ix_evento_proveedor_3 ON evento_proveedor (tenant_id, intento_id);

ALTER TABLE evento_proveedor ENABLE ROW LEVEL SECURITY;

ALTER TABLE evento_proveedor FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON evento_proveedor TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON evento_proveedor TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE aviso_interno ADD CONSTRAINT fk_aviso_interno_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_aviso_interno_0 ON aviso_interno (tenant_id);

ALTER TABLE aviso_interno ADD CONSTRAINT fk_aviso_interno_2 FOREIGN KEY (tenant_id, tarea_id) REFERENCES tarea_persistida (tenant_id, id);

CREATE INDEX ix_aviso_interno_2 ON aviso_interno (tenant_id, tarea_id);

ALTER TABLE aviso_interno ADD CONSTRAINT fk_aviso_interno_3 FOREIGN KEY (tenant_id, version_turno_id) REFERENCES version_turno (tenant_id, id);

CREATE INDEX ix_aviso_interno_3 ON aviso_interno (tenant_id, version_turno_id);

ALTER TABLE aviso_interno ADD CONSTRAINT fk_aviso_interno_4 FOREIGN KEY (tenant_id, conversacion_id) REFERENCES conversacion (tenant_id, id);

CREATE INDEX ix_aviso_interno_4 ON aviso_interno (tenant_id, conversacion_id);

ALTER TABLE aviso_interno ADD CONSTRAINT fk_aviso_interno_5 FOREIGN KEY (destinatario_id) REFERENCES cuenta (id);

CREATE INDEX ix_aviso_interno_5 ON aviso_interno (destinatario_id);

ALTER TABLE aviso_interno ENABLE ROW LEVEL SECURITY;

ALTER TABLE aviso_interno FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON aviso_interno TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON aviso_interno TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE conversacion ADD CONSTRAINT fk_conversacion_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_conversacion_0 ON conversacion (tenant_id);

ALTER TABLE conversacion ADD CONSTRAINT fk_conversacion_2 FOREIGN KEY (tenant_id, paciente_profesional_id) REFERENCES paciente_profesional (tenant_id, id);

CREATE INDEX ix_conversacion_2 ON conversacion (tenant_id, paciente_profesional_id);

ALTER TABLE conversacion ENABLE ROW LEVEL SECURITY;

ALTER TABLE conversacion FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON conversacion TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON conversacion TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE participante_chat ADD CONSTRAINT fk_participante_chat_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_participante_chat_0 ON participante_chat (tenant_id);

ALTER TABLE participante_chat ADD CONSTRAINT fk_participante_chat_2 FOREIGN KEY (tenant_id, conversacion_id) REFERENCES conversacion (tenant_id, id);

CREATE INDEX ix_participante_chat_2 ON participante_chat (tenant_id, conversacion_id);

ALTER TABLE participante_chat ADD CONSTRAINT fk_participante_chat_3 FOREIGN KEY (cuenta_id) REFERENCES cuenta (id);

CREATE INDEX ix_participante_chat_3 ON participante_chat (cuenta_id);

ALTER TABLE participante_chat ADD CONSTRAINT fk_participante_chat_4 FOREIGN KEY (tenant_id, representacion_id) REFERENCES representacion (tenant_id, id);

CREATE INDEX ix_participante_chat_4 ON participante_chat (tenant_id, representacion_id);

ALTER TABLE participante_chat ENABLE ROW LEVEL SECURITY;

ALTER TABLE participante_chat FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON participante_chat TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON participante_chat TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE participante_permiso ADD CONSTRAINT fk_participante_permiso_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_participante_permiso_0 ON participante_permiso (tenant_id);

ALTER TABLE participante_permiso ADD CONSTRAINT fk_participante_permiso_2 FOREIGN KEY (tenant_id, participante_id) REFERENCES participante_chat (tenant_id, id);

CREATE INDEX ix_participante_permiso_2 ON participante_permiso (tenant_id, participante_id);

ALTER TABLE participante_permiso ADD CONSTRAINT fk_participante_permiso_3 FOREIGN KEY (permiso_id) REFERENCES permiso (id);

CREATE INDEX ix_participante_permiso_3 ON participante_permiso (permiso_id);

ALTER TABLE participante_permiso ENABLE ROW LEVEL SECURITY;

ALTER TABLE participante_permiso FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON participante_permiso TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON participante_permiso TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE mensaje ADD CONSTRAINT fk_mensaje_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_mensaje_0 ON mensaje (tenant_id);

ALTER TABLE mensaje ADD CONSTRAINT fk_mensaje_2 FOREIGN KEY (tenant_id, conversacion_id) REFERENCES conversacion (tenant_id, id);

CREATE INDEX ix_mensaje_2 ON mensaje (tenant_id, conversacion_id);

ALTER TABLE mensaje ADD CONSTRAINT fk_mensaje_3 FOREIGN KEY (tenant_id, participante_autor_id) REFERENCES participante_chat (tenant_id, id);

CREATE INDEX ix_mensaje_3 ON mensaje (tenant_id, participante_autor_id);

ALTER TABLE mensaje ADD CONSTRAINT fk_mensaje_7 FOREIGN KEY (tenant_id, correccion_de_id) REFERENCES mensaje (tenant_id, id);

CREATE INDEX ix_mensaje_7 ON mensaje (tenant_id, correccion_de_id);

ALTER TABLE mensaje ENABLE ROW LEVEL SECURITY;

ALTER TABLE mensaje FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON mensaje TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON mensaje TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE lectura_mensaje ADD CONSTRAINT fk_lectura_mensaje_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_lectura_mensaje_0 ON lectura_mensaje (tenant_id);

ALTER TABLE lectura_mensaje ADD CONSTRAINT fk_lectura_mensaje_2 FOREIGN KEY (tenant_id, mensaje_id) REFERENCES mensaje (tenant_id, id);

CREATE INDEX ix_lectura_mensaje_2 ON lectura_mensaje (tenant_id, mensaje_id);

ALTER TABLE lectura_mensaje ADD CONSTRAINT fk_lectura_mensaje_3 FOREIGN KEY (tenant_id, participante_id) REFERENCES participante_chat (tenant_id, id);

CREATE INDEX ix_lectura_mensaje_3 ON lectura_mensaje (tenant_id, participante_id);

ALTER TABLE lectura_mensaje ENABLE ROW LEVEL SECURITY;

ALTER TABLE lectura_mensaje FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON lectura_mensaje TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON lectura_mensaje TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE transicion_profesional ADD CONSTRAINT fk_transicion_profesional_1 FOREIGN KEY (profesional_id) REFERENCES profesional_global (id);

CREATE INDEX ix_transicion_profesional_1 ON transicion_profesional (profesional_id);

ALTER TABLE transicion_profesional ADD CONSTRAINT fk_transicion_profesional_2 FOREIGN KEY (entidad_origen_id) REFERENCES entidad (id);

CREATE INDEX ix_transicion_profesional_2 ON transicion_profesional (entidad_origen_id);

ALTER TABLE transicion_profesional ADD CONSTRAINT fk_transicion_profesional_3 FOREIGN KEY (entidad_destino_id) REFERENCES entidad (id);

CREATE INDEX ix_transicion_profesional_3 ON transicion_profesional (entidad_destino_id);

ALTER TABLE transicion_profesional ADD CONSTRAINT fk_transicion_profesional_4 FOREIGN KEY (operador_id) REFERENCES cuenta (id);

CREATE INDEX ix_transicion_profesional_4 ON transicion_profesional (operador_id);

ALTER TABLE correspondencia_fichaje ADD CONSTRAINT fk_correspondencia_fichaje_1 FOREIGN KEY (transicion_id) REFERENCES transicion_profesional (id);

CREATE INDEX ix_correspondencia_fichaje_1 ON correspondencia_fichaje (transicion_id);

ALTER TABLE correspondencia_fichaje ADD CONSTRAINT fk_correspondencia_fichaje_2 FOREIGN KEY (vinculo_origen_id) REFERENCES paciente_profesional (id);

CREATE INDEX ix_correspondencia_fichaje_2 ON correspondencia_fichaje (vinculo_origen_id);

ALTER TABLE correspondencia_fichaje ADD CONSTRAINT fk_correspondencia_fichaje_3 FOREIGN KEY (vinculo_destino_id) REFERENCES paciente_profesional (id);

CREATE INDEX ix_correspondencia_fichaje_3 ON correspondencia_fichaje (vinculo_destino_id);

ALTER TABLE peticion_eliminacion ADD CONSTRAINT fk_peticion_eliminacion_1 FOREIGN KEY (profesional_id) REFERENCES profesional_global (id);

CREATE INDEX ix_peticion_eliminacion_1 ON peticion_eliminacion (profesional_id);

ALTER TABLE peticion_eliminacion ADD CONSTRAINT fk_peticion_eliminacion_2 FOREIGN KEY (solicitante_id) REFERENCES cuenta (id);

CREATE INDEX ix_peticion_eliminacion_2 ON peticion_eliminacion (solicitante_id);

ALTER TABLE peticion_eliminacion ADD CONSTRAINT fk_peticion_eliminacion_6 FOREIGN KEY (ejecutor_id) REFERENCES cuenta (id);

CREATE INDEX ix_peticion_eliminacion_6 ON peticion_eliminacion (ejecutor_id);

ALTER TABLE auditoria_entidad ADD CONSTRAINT fk_auditoria_entidad_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_auditoria_entidad_0 ON auditoria_entidad (tenant_id);

ALTER TABLE auditoria_entidad ADD CONSTRAINT fk_auditoria_entidad_2 FOREIGN KEY (actor_id) REFERENCES cuenta (id);

CREATE INDEX ix_auditoria_entidad_2 ON auditoria_entidad (actor_id);

ALTER TABLE auditoria_entidad ADD CONSTRAINT fk_auditoria_entidad_4 FOREIGN KEY (tenant_id, paciente_id) REFERENCES paciente (tenant_id, id);

CREATE INDEX ix_auditoria_entidad_4 ON auditoria_entidad (tenant_id, paciente_id);

ALTER TABLE auditoria_entidad ADD CONSTRAINT fk_auditoria_entidad_5 FOREIGN KEY (tenant_id, agenda_id) REFERENCES agenda (tenant_id, id);

CREATE INDEX ix_auditoria_entidad_5 ON auditoria_entidad (tenant_id, agenda_id);

ALTER TABLE auditoria_entidad ENABLE ROW LEVEL SECURITY;

ALTER TABLE auditoria_entidad FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON auditoria_entidad TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON auditoria_entidad TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE auditoria_global ADD CONSTRAINT fk_auditoria_global_1 FOREIGN KEY (actor_id) REFERENCES cuenta (id);

CREATE INDEX ix_auditoria_global_1 ON auditoria_global (actor_id);

ALTER TABLE auditoria_global ADD CONSTRAINT fk_auditoria_global_3 FOREIGN KEY (cuenta_afectada_id) REFERENCES cuenta (id);

CREATE INDEX ix_auditoria_global_3 ON auditoria_global (cuenta_afectada_id);

ALTER TABLE politica_operativa ADD CONSTRAINT fk_politica_operativa_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_politica_operativa_0 ON politica_operativa (tenant_id);

ALTER TABLE politica_operativa ADD CONSTRAINT fk_politica_operativa_7 FOREIGN KEY (aprobador_id) REFERENCES cuenta (id);

CREATE INDEX ix_politica_operativa_7 ON politica_operativa (aprobador_id);

ALTER TABLE politica_operativa ENABLE ROW LEVEL SECURITY;

ALTER TABLE politica_operativa FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON politica_operativa TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON politica_operativa TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE excepcion_politica ADD CONSTRAINT fk_excepcion_politica_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_excepcion_politica_0 ON excepcion_politica (tenant_id);

ALTER TABLE excepcion_politica ADD CONSTRAINT fk_excepcion_politica_2 FOREIGN KEY (tenant_id, politica_id) REFERENCES politica_operativa (tenant_id, id);

CREATE INDEX ix_excepcion_politica_2 ON excepcion_politica (tenant_id, politica_id);

ALTER TABLE excepcion_politica ADD CONSTRAINT fk_excepcion_politica_3 FOREIGN KEY (tenant_id, paciente_id) REFERENCES paciente (tenant_id, id);

CREATE INDEX ix_excepcion_politica_3 ON excepcion_politica (tenant_id, paciente_id);

ALTER TABLE excepcion_politica ADD CONSTRAINT fk_excepcion_politica_4 FOREIGN KEY (tenant_id, turno_id) REFERENCES turno (tenant_id, id);

CREATE INDEX ix_excepcion_politica_4 ON excepcion_politica (tenant_id, turno_id);

ALTER TABLE excepcion_politica ADD CONSTRAINT fk_excepcion_politica_5 FOREIGN KEY (actor_beneficiario_id) REFERENCES cuenta (id);

CREATE INDEX ix_excepcion_politica_5 ON excepcion_politica (actor_beneficiario_id);

ALTER TABLE excepcion_politica ADD CONSTRAINT fk_excepcion_politica_6 FOREIGN KEY (aprobador_id) REFERENCES cuenta (id);

CREATE INDEX ix_excepcion_politica_6 ON excepcion_politica (aprobador_id);

ALTER TABLE excepcion_politica ENABLE ROW LEVEL SECURITY;

ALTER TABLE excepcion_politica FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON excepcion_politica TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON excepcion_politica TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE caso_abuso ADD CONSTRAINT fk_caso_abuso_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_caso_abuso_0 ON caso_abuso (tenant_id);

ALTER TABLE caso_abuso ADD CONSTRAINT fk_caso_abuso_2 FOREIGN KEY (tenant_id, paciente_id) REFERENCES paciente (tenant_id, id);

CREATE INDEX ix_caso_abuso_2 ON caso_abuso (tenant_id, paciente_id);

ALTER TABLE caso_abuso ADD CONSTRAINT fk_caso_abuso_3 FOREIGN KEY (cuenta_id) REFERENCES cuenta (id);

CREATE INDEX ix_caso_abuso_3 ON caso_abuso (cuenta_id);

ALTER TABLE caso_abuso ADD CONSTRAINT fk_caso_abuso_4 FOREIGN KEY (revisor_id) REFERENCES cuenta (id);

CREATE INDEX ix_caso_abuso_4 ON caso_abuso (revisor_id);

ALTER TABLE caso_abuso ENABLE ROW LEVEL SECURITY;

ALTER TABLE caso_abuso FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON caso_abuso TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON caso_abuso TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE acceso_soporte ADD CONSTRAINT fk_acceso_soporte_0 FOREIGN KEY (tenant_id) REFERENCES entidad (id);

CREATE INDEX ix_acceso_soporte_0 ON acceso_soporte (tenant_id);

ALTER TABLE acceso_soporte ADD CONSTRAINT fk_acceso_soporte_2 FOREIGN KEY (operador_id) REFERENCES cuenta (id);

CREATE INDEX ix_acceso_soporte_2 ON acceso_soporte (operador_id);

ALTER TABLE acceso_soporte ADD CONSTRAINT fk_acceso_soporte_3 FOREIGN KEY (concedente_id) REFERENCES cuenta (id);

CREATE INDEX ix_acceso_soporte_3 ON acceso_soporte (concedente_id);

ALTER TABLE acceso_soporte ENABLE ROW LEVEL SECURITY;

ALTER TABLE acceso_soporte FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON acceso_soporte TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY migration_owner ON acceso_soporte TO salud_migrator USING (true) WITH CHECK (true);

ALTER TABLE ensayo_restauracion ADD CONSTRAINT fk_ensayo_restauracion_1 FOREIGN KEY (respaldo_id) REFERENCES respaldo (id);

CREATE INDEX ix_ensayo_restauracion_1 ON ensayo_restauracion (respaldo_id);
