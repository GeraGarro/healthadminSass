\set ON_ERROR_STOP on
\getenv app_password APP_DB_PASSWORD
\getenv migration_password MIGRATION_DB_PASSWORD

CREATE ROLE salud_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD :'app_password';
CREATE ROLE salud_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD :'migration_password';
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE salud FROM PUBLIC;
GRANT CONNECT ON DATABASE salud TO salud_app, salud_migrator;
CREATE SCHEMA salud AUTHORIZATION salud_migrator;
GRANT USAGE ON SCHEMA salud TO salud_app;
ALTER ROLE salud_app IN DATABASE salud SET search_path TO salud;
ALTER ROLE salud_migrator IN DATABASE salud SET search_path TO salud;
-- Grant runtime access explicitly in each business migration, after enabling RLS.
-- No default grants: migration history and future internal tables stay private.
