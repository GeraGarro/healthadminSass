# Escenarios integrales locales

Preparados el 26/10/2026, hora Argentina, con datos ficticios. Se vaciaron los datos
de ambas bases `salud` locales, conservando el esquema, las diez migraciones Flyway
y las veinte definiciones técnicas de permisos. La limpieza y la carga de cada base
se ejecutaron dentro de una transacción y se comprobó que todas las tablas de datos
estuvieran vacías antes de insertar las cuentas nuevas.

El servidor iniciado desde IntelliJ en `127.0.0.1:8080` usa PostgreSQL en
`localhost:55432`, contenedor `salud-api-local-postgres-1`. La web activa en
`http://127.0.0.1:4387` usa ese servidor. La otra base pertenece al entorno Compose
completo, contenedor `salud-local-postgres-1`. Ambos destinos recibieron las mismas
cuentas y contraseñas, con identificadores propios generados por PostgreSQL.

## Perfiles y distribución

| Perfil | Cuentas | Ámbito |
| --- | --- | --- |
| Profesional independiente sin secretaria | Valentina Sola | Su consultorio y su agenda; sin delegaciones. |
| Profesional independiente con secretaria | Martín Acompañado | Su consultorio y su agenda. |
| Secretaria independiente | Lucía | Solo agenda de Martín. |
| Profesional institucional | Camila, Diego y Elena | Cada profesional accede a su propia agenda. |
| Secretaria institucional | Ana y Brenda | Ambas acceden a las agendas de Camila y Diego; ninguna accede a la de Elena. |

Son ocho cuentas operativas para los cinco perfiles. Se agrega una novena cuenta
de soporte, `admin@demo.test`, con facultad de plataforma y administración de la
institución. Administrar la institución no concede acceso a sus agendas.

Las secretarias reciben siete acciones delegadas: consultar/configurar agenda y
crear/consultar/confirmar/cancelar/reprogramar turnos. No reciben facultades generales
de fichas, membresías, admisiones, catálogo, coberturas, auditoría o chat. Pueden
consultar los datos mínimos de los pacientes vinculados a sus agendas autorizadas.

La carga agrega tres entidades, cinco agendas, horarios todos los días de 08:00 a
20:00 en Argentina, las cuatro prácticas base con ofertas de treinta minutos y pago
particular, y diez pacientes ficticios (dos por profesional). No crea cuentas de pacientes.

## Nombres distinguibles de pacientes

Actualización del 27/10/2026: los diez pacientes de la carga local tienen nombres
propios ficticios, diferentes de los profesionales y entre sí. El selector de turnos
consulta registros `paciente` vinculados mediante `paciente_profesional`; no muestra
las cuentas ni los registros del padrón profesional como si fueran pacientes.

| Profesional | Paciente N.º 1 | Paciente N.º 2 |
| --- | --- | --- |
| Valentina Sola | Sofía Roldán | Nicolás Benítez |
| Martín Acompañado | Julieta Navarro | Tomás Acosta |
| Camila Institucional Uno | Abril Méndez | Bruno Salvatierra |
| Diego Institucional Dos | Renata Cabrera | Joaquín Pereyra |
| Elena Institucional Tres | Emilia Funes | Mateo Ledesma |

Los nombres se mantienen en `scripts/local-patient-names.mjs` y se reutilizan en la
carga generada. Se actualizaron las dos bases existentes sin regenerar datos: solo
se modificaron `nombres` y `apellidos` de los diez registros reconocidos por el
manifiesto de cada destino. Se comprobaron los IDs, vínculos, números y demás campos
antes y después. La API activa devolvió los diez nombres nuevos en sus cinco agendas.

Para aplicar este mismo cambio sobre una carga local anterior, sin vaciarla:

```powershell
# Verificar sin modificar:
node scripts/rename-local-patients.mjs --target both
# Aplicar únicamente a los diez pacientes identificados de cada base:
node scripts/rename-local-patients.mjs --target both --apply
```

El script valida contenedor, proyecto y directorio Compose, identidad del profesional,
paciente original y número de vínculo. Si un nombre se editó manualmente, detiene
la operación para conservar esa edición. Cada base se actualiza en su propia
transacción y los valores previos quedan en un archivo local de respaldo. La evidencia
sin credenciales está en `local-data/escenarios-integrales/nombres-pacientes.json`.

## Credenciales y uso

El archivo local `local-data/escenarios-integrales/credenciales-pruebas-locales.txt`
contiene el correo, la contraseña individual, el nombre y la entidad de las nueve
cuentas. La carpeta completa está excluida de Git. No copiar sus archivos a documentación
pública. Las cuentas nuevas no tienen MFA enrolado; el perfil local permite ingresar
con correo y contraseña.

Usar el ingreso al servidor en la web activa, saliendo de la demo del navegador si
estaba abierta. Las sesiones anteriores a la limpieza dejan de ser válidas.

`DEMO_ENABLED=false` quedó guardado en los dos archivos `.env` para que los próximos
arranques no repongan las cuentas demo anteriores. Compose raíz ahora admite ese
valor y conserva `true` como valor predeterminado cuando no se configura. El proceso
de IntelliJ ya iniciado conserva su configuración en memoria hasta reiniciarse;
la carga demo solo se ejecuta al arrancar y no altera las nuevas cuentas durante
la sesión actual.

## Verificación ejecutada

```powershell
node scripts/verify-local-scenarios.mjs
```

Se aprobaron **14 recorridos HTTP** a través de la web y del servidor de IntelliJ:
ingreso y contexto de las nueve cuentas, perfil local con entrega simulada, facultades
y agendas exactas, aislamiento entre entidades y profesionales, y rechazos 403 para
ambas secretarias sobre el tercer profesional.

Los rechazos incluyeron agenda, horarios, ofertas, pacientes candidatos, reportes,
disponibilidad, configuración horaria, creación de pre-reserva, ficha y lectura,
confirmación, cancelación y reprogramación de un turno real del tercer profesional.

Siete recorridos de turnos ejercitaron las cinco agendas y a cada secretaria
institucional sobre sus dos agendas autorizadas: disponibilidad, pre-reserva,
registro idempotente, confirmación, reprogramación, descarga CSV y cancelación.
Los siete turnos quedaron cancelados y las nueve sesiones de verificación se cerraron.

Evidencia sin contraseñas: `local-data/escenarios-integrales/verificacion.json`.
La base del Compose completo recibió validaciones SQL de la carga; la verificación
HTTP se ejecutó contra la base del servidor activo de IntelliJ. No es una prueba de
carga ni una E2E de todas las pantallas. No se probaron Google ni proveedores reales.

## Regeneración destructiva

Solo ejecutar cuando se quiera **eliminar todos los datos actuales** del destino:

```powershell
node scripts/prepare-local-scenarios.mjs --reset ide
node scripts/prepare-local-scenarios.mjs --reset docker
# O las dos bases en una sola ejecución:
node scripts/prepare-local-scenarios.mjs --reset both
```

Requiere Node 22 o posterior, Docker, Java y la biblioteca Spring Security Crypto
ya disponible en el caché Maven del proyecto. El script valida el nombre del
contenedor, el proyecto Compose, su directorio, la base y las migraciones antes de
limpiar. Cada regeneración cambia las contraseñas y reemplaza el archivo de credenciales.
Las transacciones de las dos bases son independientes; si una falla, el manifiesto
local registra los destinos que ya se cargaron. No ejecutar el generador mientras
se estén haciendo cambios manuales o pruebas concurrentes.
