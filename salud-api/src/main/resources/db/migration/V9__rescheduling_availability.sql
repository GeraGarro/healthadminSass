-- Excludes only the current booking in this tenant and for the same professional.
-- Opaque availability still includes every other tenant's occupancy and never returns its details.
CREATE FUNCTION salud.capacity_available(p_agenda uuid,p_start timestamptz,p_end timestamptz,p_booking uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,salud AS $$
 SELECT p_start>now() AND p_end>p_start AND EXISTS (
 SELECT 1 FROM salud.agenda a JOIN salud.profesional_entidad pe ON pe.id=a.profesional_entidad_id AND pe.tenant_id=a.tenant_id
 WHERE a.id=p_agenda AND a.tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND a.estado='ACTIVA' AND pe.estado='ACTIVO'
 AND (p_booking IS NULL OR EXISTS(SELECT 1 FROM salud.turno t JOIN salud.paciente_profesional pp ON pp.id=t.paciente_profesional_id AND pp.tenant_id=t.tenant_id
   WHERE t.id=p_booking AND t.tenant_id=a.tenant_id AND pp.profesional_id=pe.profesional_id AND t.estado_turno='REGISTRADO'))
 AND NOT EXISTS(SELECT 1 FROM salud.ocupacion_global o WHERE o.profesional_id=pe.profesional_id
 AND (o.estado='TURNO' OR o.estado='HOLD' AND o.vence_en>now()) AND o.inicio<p_end AND o.fin>p_start
 AND NOT EXISTS(SELECT 1 FROM salud.version_turno v WHERE v.turno_id=p_booking AND v.tenant_id=a.tenant_id AND v.sustituida_en IS NULL AND v.ocupacion_id=o.id))
 AND NOT EXISTS(SELECT 1 FROM salud.excepcion_agenda ex JOIN salud.agenda ag ON ag.id=ex.agenda_id AND ag.tenant_id=ex.tenant_id
 JOIN salud.profesional_entidad ep ON ep.id=ag.profesional_entidad_id AND ep.tenant_id=ag.tenant_id
 WHERE ep.profesional_id=pe.profesional_id AND ex.inicio<p_end AND ex.fin>p_start))
$$;
REVOKE ALL ON FUNCTION salud.capacity_available(uuid,timestamptz,timestamptz,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION salud.capacity_available(uuid,timestamptz,timestamptz,uuid) TO salud_app;
