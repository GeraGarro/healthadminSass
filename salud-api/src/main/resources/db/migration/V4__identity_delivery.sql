CREATE TABLE salud.identity_delivery (
 id uuid DEFAULT uuidv7() PRIMARY KEY, token_id uuid NOT NULL REFERENCES salud.token_identidad(id),
 destination text NOT NULL, encrypted_link text, state text NOT NULL,
 due_at timestamptz NOT NULL, attempts integer NOT NULL, last_error text
);
GRANT SELECT,INSERT,UPDATE ON salud.identity_delivery TO salud_app;
CREATE FUNCTION salud.activate_approved_access(p_actor uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,salud AS $$
DECLARE affected integer;
BEGIN
 UPDATE salud.acceso_paciente SET estado='ACTIVO',activado_en=now()
 WHERE cuenta_id=p_actor AND estado='APROBADO';
 GET DIAGNOSTICS affected=ROW_COUNT;
 RETURN affected;
END $$;
REVOKE ALL ON FUNCTION salud.activate_approved_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION salud.activate_approved_access(uuid) TO salud_app;
