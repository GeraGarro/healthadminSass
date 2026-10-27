# Cierre documental · Rediseño de roles

Fecha: 27 de octubre de 2026. Modo Operate; extensión de Patio. Se siguió `C:/Users/gerag/.agents/skills/impeccable/reference/document.md` y el contrato de roles. Este pase documentó la implementación; no modificó código ni volvió a ejecutar el detector o las pruebas.

## Fuentes y evidencia contrastada

- PRODUCT.md, DESIGN.md, .impeccable/design.json, roles-direction.md y el brief institucional.
- Fuentes de institución, jornada de secretaría, directorio, perfil, estilos compartidos, bandeja del titular y calendario; StaffStore, loader, rutas, autorización, controladores de cuenta/vínculo y migración V11.
- finish-review.md y verdict-pass.md: se conserva el hallazgo inicial; el último dispone `ship` para los dos fixes puntuados: autorización del titular desde UI y etiquetas legibles de facultades/eventos. No certifica toda la aplicación.
- Lectura directa de checks.json (9 recorridos, errors vacío), access-checks.json (3 recorridos completos, errors vacío) y server-checks.json (cuenta institucional local en 4387, failures vacío).
- Inspección directa en este pase de admin-1440.png, secretary-390.png y owner-requests-1280.png. El resto de las capturas se relaciona por los registros y la revisión de acabado; no se afirma una segunda inspección visual de cada archivo.

Las series admin, secretary, directory, onboarding, equipo, sedes, auditoria y credentials tienen evidencia en 1440/1280/390px. owner-requests y access-approved cubren los mismos anchos para el fix del titular. server-admin-1440.png corresponde a la cuenta institucional contra la API local actual y sustituye como evidencia la captura de un proceso antiguo con endpoint faltante. Los scripts producen capturas de página completa tras asentar fuentes y volver al inicio, con altura de viewport de 1000px; no se atribuye a esta tanda la descripción histórica de capturas de viewport de DESIGN.md.

## Comparación con DESIGN.md y sidecar

| Aspecto | Comparación del alcance actual |
| --- | --- |
| Identidad y color | Conserva Patio, verde `--green`, rail celadón, lienzo y superficie existentes. Urgencia roja con texto y pendientes ámbar; los tonos de agenda siguen separando agendas. No hay bloque nuevo de tokens. |
| Tipografía | Hereda Nunito Sans local. Títulos y nombres mantienen jerarquía; datos operativos y metadatos usan la escala existente. Horarios y cantidades conservan cifras tabulares en los controles compartidos. |
| Forma y profundidad | Paneles planos con borde fino y curva habitual de 14px; controles heredados y avatares circulares. No se añade elevación decorativa de reposo. |
| Componentes | Perfiles, listas, recepción y bandeja del titular componen botones, campos, estados e iconos SVG existentes. Las facultades y eventos nuevos se muestran en español. Las fotos son opcionales y aportadas por la persona. |
| Adaptación | Institución pasa de tres columnas a dos/una; directorio admite cuatro en anchos amplios. Jornada apila recepción y mantiene desplazamiento local del calendario. La bandeja del titular expande acciones en móvil. Son reglas de superficie, no de marca. |
| Reglas registradas | La muestra conserva Functional Green, Explicit State, Stable Clock y Local Depth. No se promovió el pedido de perfiles sin tablas a prohibición global para otras superficies. |

El sidecar conserva las primitivas de botón, campo, navegación, estado, panel y calendario; las superficies nuevas las componen sin introducir un sistema distinto. No corresponde regenerar DESIGN.md o el sidecar por esta extensión. Se conservaron ambos y se registraron las composiciones en briefs separados.

Hashes SHA-256 comprobados antes y después del pase documental:

| Archivo | SHA-256 |
| --- | --- |
| DESIGN.md | `2A394CDA61015E2A1FBE3A3BBB708E481B6F304597DAD61B535D7D67A0127D42` |
| .impeccable/design.json | `9C8EBF93F75B0615B513D59314A78E5FE78DA4E38FCED5A7F8E9855CABC24ACB` |

No se generó un raster nuevo ni una comp aprobada: tipografía local, SVG e iniciales son los recursos del alcance. Las PNG citadas son evidencia de revisión y las fotos opcionales son contenido de la persona. No hay un asset raster nuevo de producción que requiera procedencia de generación.

## Documentación vigente

PRODUCT.md registra creación institucional de cuentas, clave provisoria de 48 horas, cambio obligatorio, vínculo iniciado por el profesional, baja local con aviso de cuenta y administrador sin pacientes ni atención. Se actualizó también la afirmación obsoleta de ausencia de frontend/sistema visual. El resto del contexto de producto se conservó.

[Documento 34](../../../docs/34-rediseno-roles-institucion-y-secretaria.md) reúne roles, flujos, permisos, estados de recepción, endpoints, migración, validación y límites. [Documento 33](../../../docs/33-administracion-institucional.md) conserva su evidencia histórica con una nota de prelación. [README web](../../../salud-web/README.md) apunta a los flujos actuales y explica actualización local, cambio de contraseña y recorridos de navegador. El brief institucional incorpora el cierre; nuevos briefs registran jornada, directorio, perfil y bandeja del titular.

## Validación y alcance del cierre

La implementación informa 92 pruebas Angular y 5 de dominio aprobadas y build aprobado. Las 48 integraciones completas de API preceden al último ajuste de identidad; después pasaron 6 casos finales y 2 integraciones específicas de identidad/privacidad sobre el ajuste más reciente. Se leyó el informe final de Failsafe: 2 pruebas, cero fallos, errores u omitidas. Ese subconjunto no se presenta como una nueva ejecución completa. api-role-identity.log conserva la ejecución; api-final-tests.log conserva un fallo histórico de repackage por el JAR en uso, resuelto por el empaquetado final posterior.

La aceptación institucional con API local se repitió después del empaquetado final y server-checks.json termina con failures vacío; readiness en 8080 devolvió UP, según el cierre del implementador. El helper local ejecuta una copia versionada del JAR en output, mantiene la base y permite reiniciar únicamente la API reconocida en su puerto. Puede requerir nuevo ingreso. Los 18 recorridos institucionales previos adaptados a perfiles se conservan en review/roles-regression. Los resultados de demostración y de servidor local se distinguen en el documento 34.

El detector existente dejó un aviso por `[src]` condicional de foto. El revisor lo identificó como falso positivo: la imagen está bajo `@if(form.photo)`, tiene tipo/tamaño limitado y alternativa por iniciales. No se volvió a ejecutar. No se certificó visualmente una foto cargada ni un recorrido de avisos sin ninguna entidad restante, aunque la API de avisos propios no exige membresía en la institución de origen.

Se conservan los desajustes previos: ejemplo de campo del sidecar con tamaño/anillo distinto del CSS compartido vigente, y drift de configuración/buildPath de Impeccable. No se repararon ni se adoptaron como normas nuevas. La comparación no es una auditoría exhaustiva de tokens, accesibilidad o backend. No hubo despliegue productivo ni envíos reales.

Estado documental: cerrado para este alcance, con DESIGN.md y sidecar preservados y el veredicto ship limitado a los hallazgos revisados.
