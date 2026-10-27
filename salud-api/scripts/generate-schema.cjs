// Crear V2 una sola vez. Cambios posteriores se escriben como migraciones V3+.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const model = JSON.parse(fs.readFileSync(path.join(root, 'docs/arquitectura/modelo-er/modelo-er.json'), 'utf8'));
const entities = new Map(model.entities.map(e => [e.name, e]));
const types = {uuid:'uuid',texto:'text',enum:'text',secreto:'text',instante:'timestamptz',fecha:'date',hora:'time',bool:'boolean',entero:'integer',decimal:'numeric(18,4)',json:'jsonb'};
const sql = ['-- Modelo E-R 1.1 / ADR-015. Restricciones operativas adicionales en V3.', 'SET search_path TO salud, pg_catalog;'];
for (const e of entities.values()) {
  const columns = e.fields.map(f => `${f.name} ${types[f.type]}${f.name === 'id' ? ' DEFAULT uuidv7() PRIMARY KEY' : f.null ? '' : ' NOT NULL'}`);
  if (e.scope === 'T') columns.push('UNIQUE (tenant_id, id)');
  sql.push(`CREATE TABLE ${e.name.toLowerCase()} (\n    ${columns.join(',\n    ')}\n);`);
}
for (const e of entities.values()) {
  const table = e.name.toLowerCase();
  e.fields.forEach((f,i) => {
    if (!f.ref) return;
    const parent = entities.get(f.ref);
    const local = e.scope === 'T' && parent.scope === 'T';
    const columns = local ? `tenant_id, ${f.name}` : f.name;
    sql.push(`ALTER TABLE ${table} ADD CONSTRAINT fk_${table}_${i} FOREIGN KEY (${columns}) REFERENCES ${parent.name.toLowerCase()} (${local ? 'tenant_id, id' : 'id'});`);
    sql.push(`CREATE INDEX ix_${table}_${i} ON ${table} (${columns});`);
  });
  if (e.scope === 'T') sql.push(
    `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;`,
    `CREATE POLICY tenant_isolation ON ${table} TO salud_app USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);`,
    `CREATE POLICY migration_owner ON ${table} TO salud_migrator USING (true) WITH CHECK (true);`);
}
const target = path.join(root, 'salud-api/src/main/resources/db/migration/V2__domain_model.sql');
fs.writeFileSync(target, sql.join('\n\n')+'\n', {flag:'wx'});
console.log(`${entities.size} tablas generadas en V2`);
