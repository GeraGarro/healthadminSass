"""Agrupa los entregables verificados sin imágenes de QA ni temporales."""
from pathlib import Path
import zipfile,json,hashlib

root=Path(__file__).resolve().parents[1]
out=root/'output/modelo-entidad-relacion-editables.zip'
files=[root/'output/docx/modelo-entidad-relacion-salud.docx',root/'output/pdf/modelo-entidad-relacion-salud.pdf',root/'docs/23-modelo-entidad-relacion.md']
files+=sorted(p for p in (root/'docs/arquitectura/modelo-er').rglob('*') if p.is_file() and p.suffix in ('.drawio','.svg','.mmd','.json','.md','.pdf'))
files += [root/'scripts'/n for n in ['generar-modelo-er.py','verificar-modelo-er.py','exportar-modelo-er.ps1','empaquetar-modelo-er.py','generar-guia-modelo-er.py','verificar-guia-modelo-er.py','rutas_modelo_er.py']]
files += [root/'docs/arquitectura/adr/015-identificadores-uuidv7.md']
manifest=[]
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
    z.writestr('LEER-PRIMERO.txt','''Modelo entidad relación de Gestión Administrativa de Salud
Modelo 17 de octubre de 2026 - Versión 1.1 / Organización documental 18/10/2026

Documento editable: output/docx/modelo-entidad-relacion-salud.docx
Documento de consulta: output/pdf/modelo-entidad-relacion-salud.pdf
Diagrama editable: docs/arquitectura/modelo-er/modelo-er-completo.drawio

Abrir el draw.io en diagrams.net o la aplicación draw.io. La primera pestaña
contiene el plano integral; las restantes muestran el detalle por área.
Las entidades, atributos y conectores son objetos nativos editables.
Se incluyen fuentes Mermaid, JSON, SVG y el documento Markdown.
Las 17 láminas individuales y sus guías se encuentran en:
docs/arquitectura/modelo-er/partes/README.md
Cada parte reúne explicación PDF/Markdown, contenido.json y diagrama editable.

88 entidades, 252 referencias FK, 17 láminas de detalle y un plano integral.
El diccionario describe atributos, claves, nulabilidad, reglas y fuentes.
Es un modelo lógico propuesto para revisión, con pendientes identificados.
Identificadores aceptados en ADR-015: nuevas PK UUIDv7 generadas en PostgreSQL,
FK del mismo tipo uuid y número visible entero por profesional y entidad.
Se incluye el ADR con las pautas para la futura implementación.
No es una base de datos implementada ni una migración SQL.

Las referencias a la documentación previa se resuelven en el repositorio del
proyecto. El inventario de fuentes registra sus rutas y huellas SHA256.
Los scripts de generación se ejecutan en ese repositorio con las dependencias
de documentos, ReportLab, Pillow y Poppler indicadas por el runtime Codex.
La exportación PDF utiliza una instancia oculta de Word en Windows.
La regeneración conserva draw.io existentes salvo --sobrescribir-editables.
''')
    for p in files:
        assert p.is_file(),p
        arc=p.relative_to(root).as_posix()
        data=p.read_bytes();z.writestr(arc,data)
        manifest.append(dict(path=arc,size=len(data),sha256=hashlib.sha256(data).hexdigest()))
    z.writestr('manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2))
with zipfile.ZipFile(out) as z:assert z.testzip() is None
print(json.dumps(dict(zip=str(out),files=len(files),bytes=out.stat().st_size),ensure_ascii=False))
