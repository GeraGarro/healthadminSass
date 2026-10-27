/**
 * Reporting infrastructure boundary: JasperReports/PDF, POI/XLSX and Commons CSV.
 * Future use cases must supply already authorized DTOs, restrict tenant/resource access,
 * bound export sizes and escape spreadsheet formulas in untrusted CSV values.
 * Templates must be trusted classpath resources, never user-supplied executable JRXML.
 */
package ar.com.salud.reporting;
