ALTER TABLE salud.factor_mfa ADD COLUMN ultimo_contador bigint NOT NULL DEFAULT -1;
CREATE UNIQUE INDEX uq_active_mfa ON salud.factor_mfa(cuenta_id,tipo) WHERE revocado_en IS NULL;
GRANT SELECT,INSERT,UPDATE ON salud.factor_mfa TO salud_app;
CREATE FUNCTION salud.requires_mfa(p_actor uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER
SET search_path=pg_catalog,salud AS $$
 SELECT EXISTS(SELECT 1 FROM salud.membresia WHERE cuenta_id=p_actor AND estado='ACTIVA' AND desde<=now() AND (hasta IS NULL OR hasta>now()))
 OR EXISTS(SELECT 1 FROM salud.facultad_plataforma WHERE cuenta_id=p_actor AND revocada_en IS NULL AND desde<=now() AND (hasta IS NULL OR hasta>now()))
$$;
REVOKE ALL ON FUNCTION salud.requires_mfa(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION salud.requires_mfa(uuid) TO salud_app;
