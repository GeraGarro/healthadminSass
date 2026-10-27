# Integración de Patio con Spring y pruebas estrictas

Actualización: 22/10/2026. Alcance: interfaces administrativas de secretaría y profesional. Este documento complementa [arquitectura frontend](27-frontend-patio.md), [servidor](26-implementacion-servidor.md), [reglas R01–R12](03-reglas-del-dominio.md) y [matriz de permisos](22-matriz-de-permisos.md).

El [entorno Docker completo y sus pruebas](29-entorno-local-docker.md) permite iniciar web, API y base aislada desde la raíz. La revisión del 22/10 conecta el selector de profesionales para gestores de pacientes sin permisos de agenda, persiste las lecturas del chat y añade **V10** con la fecha de creación de admisiones nuevas. Las anteriores conservan fecha desconocida; el cliente admite ese valor nulo sin perder la bandeja.

## Contrato operativo

El inicio normal restaura una sesión del servidor o muestra el acceso. La demostración requiere elección explícita y permanece identificada. Una caída de Spring nunca convierte una operación real en una operación ficticia. Los datos reales se conservan en memoria; la sesión viaja mediante cookie y las escrituras incluyen CSRF. No se almacenan credenciales ni fichas reales en localStorage.

El servidor decide autorización, elegibilidad, cuotas, capacidad y estados. La interfaz utiliza los permisos efectivos para mostrar las acciones y trata un rechazo posterior como un cambio real de facultad o estado. La etiqueta «secretaría» no concede permisos. Delegación de agenda, administración de ficha y participación en chat son facultades distintas.

## Cambios que conectan interfaz y negocio

| Flujo | Contrato y comportamiento |
| --- | --- |
| Crear turno | Buscar pacientes activos vinculados al profesional mediante una proyección mínima de agenda. No requiere acceso a documento, contactos o ficha completa. Consultar elegibilidad, disponibilidad, pre-reservar y completar; claves idempotentes separadas. |
| Confirmar/cancelar/reprogramar | Enviar `If-Match: "N"`, con la `version_concurrencia` leída. El servidor bloquea la fila y verifica la versión dentro de la transacción. 428 si falta; 400 si el formato es inválido; 412 si cambió. La UI actualiza el detalle y exige revisar antes de repetir. |
| Reprogramar | Permiso propio `booking:reschedule`, sin exigir `booking:create`. La disponibilidad excluye únicamente la ocupación vigente del turno original; el resto de ocupaciones, incluso de otras entidades, sigue bloqueando sin revelar detalles. Destino restringido al mismo profesional y entidad. |
| Registro y asistencia | Registrar no confirma asistencia. Reprogramar mantiene ID, crea versión y restablece asistencia pendiente. Un conflicto conserva el turno y la ocupación originales por rollback. |
| Agenda | Consulta por rango de fechas locales de la agenda, hasta exclusivo. Se carga la cuadrícula visible de 42 días y se consulta otro rango al navegar. Nombres, número, práctica y modalidad histórica llegan con la proyección autorizada. |
| Directorio y pendientes | Paginación del servidor con total, offset y límite; el cliente rechaza páginas incompletas, duplicadas o que cambian durante la carga. Se muestran 25 pacientes por página local. Admisiones, solicitudes, casos, avisos, catálogo, planes, convenios y tareas también se recuperan por páginas. |
| Conversaciones | Cursor de exploración de participantes propios, comprobación de permiso vigente por conversación y carga de todas las páginas. Una página sin elementos autorizados puede tener continuación. El permiso de agenda no habilita el chat. |
| Cobertura | Selección explícita de afiliación verificada, plan y autorización correspondiente. Particular requiere habilitación y elección explícita. El servidor revalida el instante exacto en hold y registro. No se reutiliza una autorización ajena ni una autorización con modalidad particular. |
| Vigencias | Fechas inclusivas de formularios convertidas a intervalos de instantes con fin exclusivo al comienzo del día siguiente, usando zona IANA de entidad. Afiliación mantiene fechas locales. Sin offset fijo `-03:00`. |
| Reportes | La vista consulta su período directamente, aunque no pertenezca al calendario cargado. Lectura hasta 93 días; exportación hasta 31 días inclusivos y 1000 turnos por agenda. Un exceso se rechaza explícitamente. |
| Ausencias | Requieren `booking:reschedule`; se detecta cualquier solapamiento, incluidos turnos que comienzan antes de la ausencia. No cancelan ni desplazan turnos automáticamente. |
| Fallos | Límite de espera de 30 segundos, correlación de errores, sesión/MFA también en descargas y mensajes de resultado incierto para conexiones interrumpidas. No se reintentan escrituras automáticamente. Un guardado confirmado seguido de fallo de recarga se informa como guardado. |
| Cambio de contexto | Invalida cargas, candidatos, detalle, claves de reserva y paneles anteriores. Una respuesta tardía no modifica otra entidad ni completa una reserva en ella. |

Las lecturas simultáneas de agendas se limitan a seis. La protección técnica de lectura completa admite hasta 50.000 filas; por encima se produce un error explícito, nunca una lista parcial presentada como completa. Esto no define una cuota comercial ni acredita capacidad de carga.

## API incorporada

Bajo `/api/v1/entities/{tenant}/workspace`:

- `GET /appointments?agendaId=…&from=AAAA-MM-DD&until=AAAA-MM-DD&offset=0&limit=250`: rango de 1 a 93 días; zona de agenda, `until` exclusivo; requiere `booking:read`.
- `GET /directory?offset=0&limit=250`: requiere `patients:manage`.
- `GET /agendas/{agenda}/booking-patients?q=…&offset=0&limit=100`: requiere crear o reprogramar; devuelve exclusivamente ID, nombres, apellidos y número de ese profesional.
- `GET /agendas/{agenda}/booking-patients/{patient}/eligibility?offerVersionId=…&date=…&appointmentId=…`: último parámetro solo al reprogramar; las opciones se acotan a paciente, profesional, oferta y día. El comando valida nuevamente las condiciones exactas.
- `GET /lists/{resource}?agendaId=…&offset=0&limit=250`: recursos permitidos en código: `practices`, `coverages`, `notifications`, `tasks`, `admissions`, `plans`, `agreements`, `offers`, `hours`, `management-requests`, `rescheduling-cases`. Cada recurso conserva su autorización. Límite máximo 500, mínimo 1.
- `GET /conversations?offset=0`: respuesta `{items,nextOffset}`; cursor de 100 candidatos y autorización vigente antes de devolver cada elemento.

Las páginas con total usan `{items,total,offset,limit}`. Búsqueda de candidatos permite hasta 200 por página. El endpoint de disponibilidad de reprogramación es `/availability-for-rescheduling`, con los parámetros de disponibilidad más `appointmentId`.

Flyway **V9** incorpora la función de capacidad que permite excluir la ocupación propia. Conserva `SECURITY DEFINER`, search_path fijo, tenant obligatorio y revocación de ejecución pública. Recompilar y reiniciar Spring para aplicar esta migración y los controladores nuevos; la app Angular y esta versión de API deben actualizarse juntas por el requisito de `If-Match`. No se ejecutó una migración sobre la base local del usuario.

## Ejecutar la verificación completa en VS Code

Requisitos: Node 24 compatible, JDK 21, PowerShell 7, Docker Desktop con motor Linux y acceso a dependencias. Desde la raíz:

```powershell
.\scripts\verify-strict.ps1
```

También está disponible la tarea **Sistema: verificación estricta**. Ejecuta instalación reproducible, pruebas Angular/dominio, cobertura de transporte/fechas/paginación, auditoría npm, producción, Maven `clean verify` y recorridos HTTP reales. La etapa HTTP crea su propio PostgreSQL mediante Testcontainers, arranca Spring con MFA obligatorio y proveedores simulados en `127.0.0.1:18080`, y termina el proceso propio al finalizar. No lee `.env`, no limpia volúmenes del usuario y no acepta una URL de base externa. El puerto 18080 debe estar libre. `-SkipInstall` reutiliza dependencias instaladas; `-SkipHttp` sirve para una comprobación parcial, no equivale a la ronda completa.

Los workflows `salud-web.yml` y `salud-api.yml` dejan preparados estos controles en CI con informes. Su ejecución remota y configuración como controles obligatorios del repositorio corresponden al publicar los cambios.

## Probar la interfaz con el servidor descartable

Terminal 1, desde la raíz:

```powershell
.\scripts\start-strict-fixture.ps1
```

Esperar `STRICT_FIXTURE_READY`. Terminal 2:

```powershell
cd .\salud-web
npm run build
$env:PORT='4390'
$env:BACKEND_PORT='18080'
npm run preview
```

Abrir `http://127.0.0.1:4390`. Cuentas ficticias `secretaria@demo.test`, `profesional@demo.test` y `admin@demo.test`, contraseña exclusiva de la fixture `integration-test-only-password`. Obtener el código TOTP sintético con `node scripts/fixture-totp.mjs` desde la raíz. Nunca usar esas credenciales ni esa semilla en otros entornos. El código de una cuenta no se puede reutilizar en el mismo período; esperar al siguiente si ya fue consumido.

Para automatizar los recorridos sin navegador, con la fixture lista: `node scripts/strict-http.mjs`. Antes de enviar credenciales, verifica una cabecera que solo incorpora la fixture de test. Al terminar cancela su turno sintético, conservando historia. `Ctrl+C` detiene el servidor y Testcontainers retira su base descartable.

## Evidencia y alcance de pruebas

| Nivel | Evidencia reproducible |
| --- | --- |
| Dominio y transporte Angular | `npm test`: dominio puro, CSRF, estados HTTP, timeout, informes, idempotencia, respuesta incierta, paginación, zonas, facultades, rutas, carreras de paciente/contexto, detalle y contratos de formularios. |
| Cobertura | `npm run test:coverage`, gate 80% líneas/funciones/sentencias y 70% ramas en `api.client.ts`, `domain.ts`, `paging.ts`. No representa cobertura total de todas las pantallas. HTML/LCOV en `salud-web/coverage/salud-web`; JUnit en `salud-web/test-results/angular.xml`. |
| PostgreSQL | `mvnw verify`: migraciones V1–V10, RLS y claves compuestas, profesional global concurrente, cuotas, holds vencidos, numeración, permisos, revocación, reprogramación atómica, cobertura, chat, auditoría, reportes, identidad, MFA y tareas persistidas. Incluye directorio de 10.001 pacientes y calendario de 105 turnos, sin truncamiento. |
| HTTP con sesión real | Ocho recorridos de `strict-http.mjs`: CSRF/sesión, MFA/permisos, ficha restringida, hold/registro/reintento, confirmación/conflicto, reprogramación/reintento, agenda enriquecida y logout. Resultado en `tmp/strict-http-result.json`. |

La prueba de volumen verifica integridad y paginación; no mide un SLA de rendimiento. Las pruebas de componentes/estado y HTTP no equivalen a E2E automatizada de todas las pantallas ni a certificación de accesibilidad.

## Trazabilidad y condiciones del piloto

| Regla | Cobertura actual y continuidad |
| --- | --- |
| R01 | Entidad/contexto, RLS, integridad y número por profesional; carga de directorio. Suscripciones y políticas comerciales siguen diferidas. |
| R02 | Hold y registro separados, vencimiento, cupo, idempotencia y conflictos. Los valores operativos deben aprobarse para la entidad del piloto. |
| R03 | Ocupación global y concurrencia entre entidades; disponibilidad opaca, también al mover con solapamiento propio. |
| R04 | Facultades explícitas por agenda y acción, revocación inmediata, ficha y chat separados. |
| R05 | Operación en contextos institucional e independiente. La desvinculación/traslado integral documentada requiere su implementación y aceptación específica; no se simula una migración de fichas. |
| R06 | Ofertas versionadas, preparación/cierre, horas y excepciones; Consulta base como única autoselección. |
| R07 | Afiliación/plan/convenio/autorización verificados y vigentes; elección particular explícita. Verificación con financiadores externos pendiente. |
| R08 | Registro/asistencia separados, confirmación y reset al reprogramar. Cierre T-24 exige política aprobada; no se activó una política pendiente. |
| R09 | Representación con evidencia, vigencia, facultades, revocación y acceso aprobado. Validación documental real corresponde al piloto. |
| R10 | Sesión, activación, recuperación y MFA. Alta comercial y suscripciones no forman parte de estas pantallas. |
| R11 | Tareas, reintentos, obsolescencia, webhook autenticado y deduplicado; ausencia avisa también confirmados. Proveedores reales, cuotas y presupuesto deben probarse con configuración aprobada. |
| R12 | Auditoría de operaciones y accesos, versiones históricas, correlación y exportaciones autorizadas. Restauración de backups y continuidad operativa requieren ensayo del entorno de despliegue. |

Antes de habilitar un piloto: ejecutar estas rondas en el entorno elegido, comprobar correo/WhatsApp/Google reales, revisar accesos con el responsable, aprobar parámetros operativos, medir carga concurrente representativa y probar recuperación de backups. Estos puntos permanecen visibles; pasar la suite local no los certifica.
