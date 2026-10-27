SET search_path TO salud, pg_catalog;
CREATE TABLE identidad_paciente_global (
 id uuid PRIMARY KEY DEFAULT uuidv7(), huella_documental text NOT NULL UNIQUE,
 creada_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT ON identidad_paciente_global TO salud_app;
ALTER TABLE paciente ADD COLUMN identidad_global_id uuid REFERENCES identidad_paciente_global(id);
CREATE UNIQUE INDEX paciente_identidad_por_entidad ON paciente(tenant_id,identidad_global_id) WHERE identidad_global_id IS NOT NULL;
CREATE INDEX paciente_busqueda_dni ON paciente(tenant_id,(regexp_replace(coalesce(documento_declarado,''),'[^0-9]','','g')));
CREATE TABLE arancel_prestacion (
 tenant_id uuid NOT NULL REFERENCES entidad(id),id uuid PRIMARY KEY DEFAULT uuidv7(),
 oferta_id uuid NOT NULL,numero_version integer NOT NULL,importe numeric(12,2) NOT NULL CHECK(importe>=0),
 moneda text NOT NULL CHECK(moneda IN ('ARS','USD')),autor_id uuid NOT NULL REFERENCES cuenta(id),
 creado_en timestamptz NOT NULL DEFAULT now(),UNIQUE(tenant_id,oferta_id,numero_version),
 FOREIGN KEY(tenant_id,oferta_id) REFERENCES oferta(tenant_id,id)
);
ALTER TABLE arancel_prestacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE arancel_prestacion FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON arancel_prestacion TO salud_app USING(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid) WITH CHECK(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY migration_owner ON arancel_prestacion TO salud_migrator USING(true) WITH CHECK(true);
GRANT SELECT,INSERT ON arancel_prestacion TO salud_app;
