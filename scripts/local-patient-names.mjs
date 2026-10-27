// Synthetic people for the two seeded patient records of each local professional.
export const localPatientNames = [
  { professionalKey: 'solo', number: 1, firstName: 'Sofía', lastName: 'Roldán' },
  { professionalKey: 'solo', number: 2, firstName: 'Nicolás', lastName: 'Benítez' },
  { professionalKey: 'acompanado', number: 1, firstName: 'Julieta', lastName: 'Navarro' },
  { professionalKey: 'acompanado', number: 2, firstName: 'Tomás', lastName: 'Acosta' },
  { professionalKey: 'institucional1', number: 1, firstName: 'Abril', lastName: 'Méndez' },
  { professionalKey: 'institucional1', number: 2, firstName: 'Bruno', lastName: 'Salvatierra' },
  { professionalKey: 'institucional2', number: 1, firstName: 'Renata', lastName: 'Cabrera' },
  { professionalKey: 'institucional2', number: 2, firstName: 'Joaquín', lastName: 'Pereyra' },
  { professionalKey: 'institucional3', number: 1, firstName: 'Emilia', lastName: 'Funes' },
  { professionalKey: 'institucional3', number: 2, firstName: 'Mateo', lastName: 'Ledesma' },
];

export const localPatientNameRows = localPatientNames.map(p => ({
  key: p.professionalKey, number: p.number, first_name: p.firstName, last_name: p.lastName,
}));

export const localPatientInsertSql = `CREATE TEMP TABLE fixture_patient_names ON COMMIT DROP AS
 SELECT n.* FROM fixture_data,jsonb_to_recordset(data->'patients')
 AS n(key text,number integer,first_name text,last_name text);
INSERT INTO paciente(tenant_id,id,nombres,apellidos,estado,estado_datos_cobertura)
 SELECT p.entity_id,p.patient_id,n.first_name,n.last_name,'ACTIVO','SIN_COBERTURA'
 FROM fixture_patients p JOIN fixture_patient_names n ON n.key=p.key AND n.number=p.n;`;
