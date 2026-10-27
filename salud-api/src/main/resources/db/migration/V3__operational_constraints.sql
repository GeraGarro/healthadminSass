SET search_path TO salud, pg_catalog;

CREATE UNIQUE INDEX uq_account_email ON cuenta (lower(email_acceso)) WHERE email_acceso IS NOT NULL;
CREATE UNIQUE INDEX uq_local_credential ON credencial_local(cuenta_id) WHERE revocada_en IS NULL;
CREATE UNIQUE INDEX uq_external_identity ON identidad_externa(emisor, sujeto);
ALTER TABLE permiso ADD UNIQUE(codigo);
ALTER TABLE rol ADD UNIQUE(codigo);
ALTER TABLE membresia ADD UNIQUE(tenant_id, cuenta_id);
ALTER TABLE profesional_global ADD UNIQUE(cuenta_id);
ALTER TABLE profesional_entidad ADD UNIQUE(tenant_id, profesional_id);
ALTER TABLE paciente_profesional ADD UNIQUE(tenant_id, profesional_id, paciente_id);
ALTER TABLE paciente_profesional ADD UNIQUE(tenant_id, profesional_id, numero_visible);
ALTER TABLE contador_paciente ADD UNIQUE(tenant_id, profesional_id);
ALTER TABLE acceso_paciente ADD UNIQUE(tenant_id, cuenta_id, paciente_id);
ALTER TABLE practica ADD UNIQUE(tenant_id, codigo_local);
ALTER TABLE version_practica ADD UNIQUE(tenant_id, practica_id, numero_version);
ALTER TABLE oferta ADD UNIQUE(tenant_id, agenda_id, practica_id);
ALTER TABLE version_oferta ADD UNIQUE(tenant_id, oferta_id, numero_version);
ALTER TABLE turno ADD UNIQUE(tenant_id, pre_reserva_id);
ALTER TABLE version_turno ADD UNIQUE(tenant_id, turno_id, numero_version);
CREATE UNIQUE INDEX uq_current_booking ON version_turno(tenant_id, turno_id) WHERE sustituida_en IS NULL;
ALTER TABLE idempotencia ADD UNIQUE(tenant_id, actor_id, operacion, clave);
ALTER TABLE tarea_persistida ADD UNIQUE(tenant_id, deduplicacion);
ALTER TABLE aviso_externo ADD UNIQUE(tenant_id, clave_logica);
ALTER TABLE aviso_interno ADD UNIQUE(tenant_id, clave_logica, destinatario_id);
ALTER TABLE evento_proveedor ADD UNIQUE(tenant_id, canal_id, evento_externo);
ALTER TABLE token_identidad ADD UNIQUE(huella);
ALTER TABLE sesion ADD UNIQUE(huella_sesion);
ALTER TABLE horario_agenda ADD CHECK(dia_semana BETWEEN 1 AND 7 AND hora_fin > hora_inicio);
ALTER TABLE version_oferta ADD CHECK(duracion_min > 0 AND duracion_min <= 480 AND preparacion_min >= 0 AND cierre_min >= 0);
ALTER TABLE ocupacion_global ADD CHECK(fin > inicio);
ALTER TABLE pre_reserva ADD CHECK(fin_atencion > inicio_atencion);
ALTER TABLE version_turno ADD CHECK(fin_atencion > inicio_atencion);
ALTER TABLE excepcion_agenda ADD CHECK(fin > inicio);
ALTER TABLE intervalo_lote ADD CHECK(fin > inicio);
ALTER TABLE paciente_profesional ADD CHECK(numero_visible > 0);
ALTER TABLE tarea_persistida ADD COLUMN ultimo_error text;
ALTER TABLE tarea_persistida ADD COLUMN payload jsonb NOT NULL DEFAULT '{}';
CREATE INDEX ix_due_task ON tarea_persistida(tenant_id,programada_en) WHERE estado IN ('PENDIENTE','REINTENTO','EJECUTANDO');
CREATE INDEX ix_capacity_range ON ocupacion_global(profesional_id, inicio, fin) WHERE estado IN ('HOLD','TURNO');

-- Solo tablas usadas por casos de uso implementados. Las tablas de evolución
-- (transiciones de fichaje, soporte, comercial, etc.) no tienen acceso de runtime.
GRANT SELECT, INSERT, UPDATE ON cuenta, credencial_local, sesion, token_identidad,
    entidad, profesional_global TO salud_app;
GRANT SELECT ON permiso, rol, facultad_plataforma TO salud_app;
GRANT SELECT, INSERT, UPDATE ON sede, membresia, membresia_permiso, profesional_entidad,
    paciente, contacto_paciente, solicitud_admision, representacion, representacion_permiso,
    acceso_paciente, alcance_acceso, paciente_profesional, contador_paciente,
    agenda, delegacion_agenda, delegacion_permiso, practica, version_practica,
    oferta, version_oferta, horario_agenda, excepcion_agenda,
    cobertura_medica, plan_cobertura, afiliacion_paciente, convenio, version_convenio,
    autorizacion_cobertura, evaluacion_elegibilidad, pre_reserva, turno, version_turno,
    confirmacion_asistencia, idempotencia, lote_reprogramacion, intervalo_lote, turno_afectado,
    solicitud_gestion, canal_entidad, destino_aviso, tarea_persistida, aviso_externo,
    intento_envio, evento_proveedor, aviso_interno, conversacion, participante_chat,
    participante_permiso, mensaje, lectura_mensaje, politica_operativa TO salud_app;
GRANT SELECT, INSERT ON auditoria_entidad, auditoria_global, evento_turno TO salud_app;

INSERT INTO permiso(codigo,accion,tipo_ambito) SELECT p,p,'EXPLICITO' FROM unnest(ARRAY[
 'entities:manage','members:manage','patients:manage','admissions:manage','catalog:manage',
 'professionals:manage','coverage:manage','policy:manage','audit:read','notifications:manage',
 'agenda:read','agenda:configure','booking:create','booking:read','booking:confirm',
 'booking:cancel','booking:reschedule','chat:read','chat:write','patient:read'
]) p;

-- Contextos mínimos: la función no expone fichas ni membresías ajenas.
CREATE FUNCTION my_contexts(p_actor uuid) RETURNS TABLE(id uuid, nombre text, tipo text)
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, salud AS $$
 SELECT e.id,e.nombre,e.tipo FROM salud.entidad e WHERE e.estado='ACTIVA' AND (
 EXISTS(SELECT 1 FROM salud.membresia m WHERE m.tenant_id=e.id AND m.cuenta_id=p_actor
   AND m.estado='ACTIVA' AND m.desde<=now() AND (m.hasta IS NULL OR m.hasta>now()))
 OR EXISTS(SELECT 1 FROM salud.acceso_paciente a WHERE a.tenant_id=e.id AND a.cuenta_id=p_actor
   AND a.estado='ACTIVO' AND a.activado_en IS NOT NULL))
$$;

-- Coordinador: ninguna consulta ni escritura directa a ocupaciones globales.
-- Lock por identidad global, mantenido hasta commit; verifica expiración bajo lock.
CREATE FUNCTION acquire_capacity(p_agenda uuid, p_start timestamptz, p_end timestamptz,
 p_expiry timestamptz) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, salud AS $$
DECLARE professional uuid; result uuid; tenant uuid;
BEGIN
 tenant := nullif(current_setting('app.tenant_id',true),'')::uuid;
 SELECT pe.profesional_id INTO professional FROM salud.agenda a
 JOIN salud.profesional_entidad pe ON pe.id=a.profesional_entidad_id AND pe.tenant_id=a.tenant_id
 WHERE a.id=p_agenda AND a.tenant_id=tenant AND a.estado='ACTIVA' AND pe.estado='ACTIVO';
 IF professional IS NULL OR p_end<=p_start OR p_start<=now() OR p_expiry<=now() THEN
   RAISE EXCEPTION 'Invalid capacity request' USING ERRCODE='22023';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(professional::text,0));
 UPDATE salud.ocupacion_global SET estado='EXPIRADA' WHERE profesional_id=professional
   AND estado='HOLD' AND vence_en<=now();
 IF EXISTS(SELECT 1 FROM salud.ocupacion_global WHERE profesional_id=professional
    AND estado IN ('HOLD','TURNO') AND inicio<p_end AND fin>p_start) THEN
   RAISE EXCEPTION 'Capacity conflict' USING ERRCODE='23P01';
 END IF;
 INSERT INTO salud.ocupacion_global(profesional_id,inicio,fin,estado,vence_en,referencia_opaca)
 VALUES(professional,p_start,p_end,'HOLD',p_expiry,gen_random_uuid()::text) RETURNING id INTO result;
 RETURN result;
END $$;

CREATE FUNCTION change_capacity(p_id uuid,p_action text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, salud AS $$
DECLARE professional uuid; tenant uuid;
BEGIN
 tenant := nullif(current_setting('app.tenant_id',true),'')::uuid;
 IF NOT EXISTS(SELECT 1 FROM salud.pre_reserva WHERE tenant_id=tenant AND ocupacion_id=p_id)
 AND NOT EXISTS(SELECT 1 FROM salud.version_turno WHERE tenant_id=tenant AND ocupacion_id=p_id)
 THEN RETURN false; END IF;
 SELECT profesional_id INTO professional FROM salud.ocupacion_global WHERE id=p_id;
 PERFORM pg_advisory_xact_lock(hashtextextended(professional::text,0));
 IF p_action='BOOK' THEN
   UPDATE salud.ocupacion_global SET estado='TURNO',vence_en=NULL
    WHERE id=p_id AND estado='HOLD' AND vence_en>now();
 ELSIF p_action='RELEASE' THEN
   UPDATE salud.ocupacion_global SET estado='LIBERADA' WHERE id=p_id AND estado IN ('HOLD','TURNO');
 ELSE RETURN false; END IF;
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION my_contexts(uuid), acquire_capacity(uuid,timestamptz,timestamptz,timestamptz),
 change_capacity(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION my_contexts(uuid), acquire_capacity(uuid,timestamptz,timestamptz,timestamptz),
 change_capacity(uuid,text) TO salud_app;

CREATE TABLE auth_throttle (key text PRIMARY KEY, window_start timestamptz NOT NULL, attempts integer NOT NULL);
GRANT SELECT, INSERT, UPDATE ON auth_throttle TO salud_app;
