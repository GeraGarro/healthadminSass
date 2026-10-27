---
version: 1
slug: "salud-web-src-app-pages-staff-profile-ts"
primary_target: "salud-web/src/app/pages/staff-profile.ts"
related_targets: ["salud-web/src/app/pages/staff-experience.css","salud-web/src/app/core/staff.store.ts"]
---

# Perfil y vínculo personal · 27/10/2026

Modo: Operate. Extensión de Patio sin sustitución de identidad.

THESIS: Completar lo indispensable para empezar y conservar una identidad personal entre instituciones.

OWN-WORLD: Formulario nativo con panel plano, tipografía local, verde y avatar de iniciales. La foto opcional es aportada por la persona; no se generó un recurso raster.

STORY: En primer ingreso de secretaría solo nombre y apellido son obligatorios. DNI, domicilio, celular y foto son opcionales. El profesional solicita vínculo a otra institución desde su perfil; la institución destino lo aprueba. Los avisos personales informan aprobación, rechazo y baja sin depender de la membresía de origen.

FIRST VIEWPORT: Hagamos lugar a tu jornada en primer ingreso; Mi perfil en uso posterior. Foto/iniciales, campos y Guardar y continuar o Guardar perfil, con una explicación de identidad personal. El pedido de vínculo usa código de institución y matrícula.

FORM: Dos columnas de campos y guía lateral en escritorio, una columna en teléfono. Foto PNG/JPEG/WebP hasta 200KB en interfaz; iniciales como alternativa. La obligatoriedad se expresa junto a la tarea.

FINISH: onboarding-{1440,1280,390}.png y checks.json en review/roles registran el primer ingreso con solo nombre/apellido. No se certificó visualmente una foto subida ni un recorrido sin ninguna entidad restante. La consulta de avisos a nivel cuenta y la conservación de identidad se contrastaron en fuente y pruebas de API. Cierre: review/roles/documentation.md.
