# Plantillas de reportes

Reservado para JRXML versionados y confiables, compatibles con JasperReports 7.1.
La prueba técnica construye una plantilla en memoria y exporta PDF, XLSX y CSV
con datos ficticios a `target/report-smoke/`.

Los futuros reportes recibirán DTO autorizados por entidad/recurso. No abrir conexiones
SQL desde plantillas ni aceptar JRXML subidos por usuarios. Excel debe escribir texto
como texto; CSV requiere neutralizar fórmulas de datos externos antes de distribuirse.
Definir paginación/límites, memoria, auditoría y permisos al implementar cada reporte.
