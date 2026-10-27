SET search_path TO salud,pg_catalog;
ALTER TABLE profesional_entidad ADD UNIQUE(tenant_id,id,profesional_id);
ALTER TABLE paciente_profesional ADD FOREIGN KEY(tenant_id,profesional_entidad_id,profesional_id)
 REFERENCES profesional_entidad(tenant_id,id,profesional_id);
ALTER TABLE contador_paciente ADD FOREIGN KEY(tenant_id,profesional_entidad_id,profesional_id)
 REFERENCES profesional_entidad(tenant_id,id,profesional_id);

CREATE FUNCTION lock_agenda_capacity(p_agenda uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,salud AS $$
DECLARE professional uuid;
BEGIN
 SELECT pe.profesional_id INTO professional FROM salud.agenda a
 JOIN salud.profesional_entidad pe ON pe.id=a.profesional_entidad_id AND pe.tenant_id=a.tenant_id
 WHERE a.id=p_agenda AND a.tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid;
 IF professional IS NULL THEN RAISE EXCEPTION 'Invisible agenda' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(professional::text,0));
END $$;
REVOKE ALL ON FUNCTION lock_agenda_capacity(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lock_agenda_capacity(uuid) TO salud_app;

-- La función adquiere el mismo lock incluso si se invoca fuera de los servicios Java.
CREATE FUNCTION guard_capacity_absence() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,salud AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM salud.excepcion_agenda ex JOIN salud.agenda a ON a.id=ex.agenda_id AND a.tenant_id=ex.tenant_id
   JOIN salud.profesional_entidad pe ON pe.id=a.profesional_entidad_id AND pe.tenant_id=a.tenant_id
   WHERE pe.profesional_id=NEW.profesional_id AND ex.inicio<NEW.fin AND ex.fin>NEW.inicio) THEN
   RAISE EXCEPTION 'Capacity conflict' USING ERRCODE='23P01';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER capacity_absence BEFORE INSERT ON ocupacion_global FOR EACH ROW EXECUTE FUNCTION guard_capacity_absence();
