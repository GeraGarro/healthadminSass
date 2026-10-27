-- Flyway creates the salud schema and records the migration history.
-- Business tables and tenant RLS policies require their own reviewed migrations.
COMMENT ON SCHEMA salud IS 'Salud API: esquema administrado exclusivamente mediante Flyway';
