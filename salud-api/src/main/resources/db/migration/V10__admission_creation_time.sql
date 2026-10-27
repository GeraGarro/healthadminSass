-- Older requests did not store a creation time. Preserve that absence instead of
-- assigning the migration time to historical requests; new rows receive the real time.
ALTER TABLE solicitud_admision ADD COLUMN creada_en timestamptz;
ALTER TABLE solicitud_admision ALTER COLUMN creada_en SET DEFAULT now();
