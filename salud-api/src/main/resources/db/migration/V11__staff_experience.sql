SET search_path TO salud, pg_catalog;
ALTER TABLE cuenta ADD COLUMN cambio_clave_pendiente boolean NOT NULL DEFAULT false;
ALTER TABLE cuenta ADD COLUMN clave_provisoria_vence timestamptz;
ALTER TABLE cuenta ADD COLUMN perfil jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE TABLE solicitud_vinculo_staff (
 id uuid PRIMARY KEY DEFAULT uuidv7(), tenant_id uuid NOT NULL REFERENCES entidad(id),
 solicitante_id uuid NOT NULL REFERENCES cuenta(id),
 tipo text NOT NULL CHECK(tipo IN ('INSTITUCION','AGENDA')),
 agenda_id uuid, nombre text NOT NULL, matricula text NOT NULL DEFAULT '',
 estado text NOT NULL DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE','APROBADA','RECHAZADA')),
 creada_en timestamptz NOT NULL DEFAULT now(), resuelta_en timestamptz, revisor_id uuid REFERENCES cuenta(id),
 FOREIGN KEY(tenant_id,agenda_id) REFERENCES agenda(tenant_id,id), CHECK((tipo='AGENDA')=(agenda_id IS NOT NULL))
);
CREATE UNIQUE INDEX solicitud_staff_pendiente ON solicitud_vinculo_staff(tenant_id,solicitante_id,tipo,coalesce(agenda_id,'00000000-0000-0000-0000-000000000000'::uuid)) WHERE estado='PENDIENTE';
ALTER TABLE solicitud_vinculo_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitud_vinculo_staff FORCE ROW LEVEL SECURITY;
CREATE POLICY staff_request_scope ON solicitud_vinculo_staff TO salud_app USING(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid OR solicitante_id=nullif(current_setting('app.actor_id',true),'')::uuid) WITH CHECK(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid OR solicitante_id=nullif(current_setting('app.actor_id',true),'')::uuid);
CREATE POLICY migration_owner ON solicitud_vinculo_staff TO salud_migrator USING(true) WITH CHECK(true);
GRANT SELECT,INSERT,UPDATE ON solicitud_vinculo_staff TO salud_app;
CREATE TABLE aviso_cuenta_staff (
 id uuid PRIMARY KEY DEFAULT uuidv7(), cuenta_id uuid NOT NULL REFERENCES cuenta(id),
 tenant_id uuid NOT NULL REFERENCES entidad(id), tipo text NOT NULL, creado_en timestamptz NOT NULL DEFAULT now(), leido_en timestamptz
);
GRANT SELECT,INSERT,UPDATE ON aviso_cuenta_staff TO salud_app;
ALTER TABLE aviso_cuenta_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE aviso_cuenta_staff FORCE ROW LEVEL SECURITY;
CREATE POLICY staff_notice_scope ON aviso_cuenta_staff TO salud_app USING(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid OR cuenta_id=nullif(current_setting('app.actor_id',true),'')::uuid) WITH CHECK(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid OR cuenta_id=nullif(current_setting('app.actor_id',true),'')::uuid);
CREATE POLICY migration_owner ON aviso_cuenta_staff TO salud_migrator USING(true) WITH CHECK(true);
CREATE TABLE recepcion_turno (
 tenant_id uuid NOT NULL REFERENCES entidad(id), turno_id uuid PRIMARY KEY,
 estado text NOT NULL CHECK(estado IN ('ESPERA','ATENCION','FINALIZADO')),
 actualizada_en timestamptz NOT NULL DEFAULT now(), actor_id uuid NOT NULL REFERENCES cuenta(id),
 FOREIGN KEY(tenant_id,turno_id) REFERENCES turno(tenant_id,id)
);
ALTER TABLE recepcion_turno ENABLE ROW LEVEL SECURITY;
ALTER TABLE recepcion_turno FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON recepcion_turno TO salud_app USING(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid) WITH CHECK(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY migration_owner ON recepcion_turno TO salud_migrator USING(true) WITH CHECK(true);
GRANT SELECT,INSERT,UPDATE,DELETE ON recepcion_turno TO salud_app;
