CREATE FUNCTION salud.capacity_available(p_agenda uuid,p_start timestamptz,p_end timestamptz)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,salud AS $$
 SELECT p_start>now() AND p_end>p_start AND EXISTS (
 SELECT 1 FROM salud.agenda a JOIN salud.profesional_entidad pe ON pe.id=a.profesional_entidad_id AND pe.tenant_id=a.tenant_id
 WHERE a.id=p_agenda AND a.tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND a.estado='ACTIVA' AND pe.estado='ACTIVO'
 AND NOT EXISTS(SELECT 1 FROM salud.ocupacion_global o WHERE o.profesional_id=pe.profesional_id
 AND (o.estado='TURNO' OR o.estado='HOLD' AND o.vence_en>now()) AND o.inicio<p_end AND o.fin>p_start)
 AND NOT EXISTS(SELECT 1 FROM salud.excepcion_agenda ex JOIN salud.agenda ag ON ag.id=ex.agenda_id AND ag.tenant_id=ex.tenant_id
 JOIN salud.profesional_entidad ep ON ep.id=ag.profesional_entidad_id AND ep.tenant_id=ag.tenant_id
 WHERE ep.profesional_id=pe.profesional_id AND ex.inicio<p_end AND ex.fin>p_start))
$$;
REVOKE ALL ON FUNCTION salud.capacity_available(uuid,timestamptz,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION salud.capacity_available(uuid,timestamptz,timestamptz) TO salud_app;
ALTER TABLE salud.lectura_mensaje ADD UNIQUE(tenant_id,mensaje_id,participante_id);
