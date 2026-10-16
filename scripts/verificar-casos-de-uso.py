"""Comprobación documental; no ejecuta pruebas funcionales del producto."""

import re
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote

from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
errors=[]
links=0


def slug(value):
    value=re.sub(r"<[^>]*>","",value).strip().lower()
    value=re.sub(r"[^\w\s-]","",value).replace(" ","-")
    return value


def check_target(source,target,known_ids=None):
    global links
    if re.match(r"^(?:https?://|mailto:|app:|codex:|data:)",target):return
    links+=1
    path,_,fragment=unquote(target).partition("#")
    dest=(source.parent/path).resolve() if path else source
    if not dest.exists():
        errors.append(f"Enlace inexistente: {source.relative_to(ROOT)} -> {target}")
        return
    if fragment and dest.suffix==".md":
        headings=re.findall(r"^#{1,6}\s+(.+)$",dest.read_text(encoding="utf-8"),re.M)
        ids={slug(h) for h in headings}
        if fragment not in ids:errors.append(f"Ancla inexistente: {source.relative_to(ROOT)} -> {target}")
    if fragment and not path and known_ids is not None and fragment not in known_ids:
        errors.append(f"Ancla HTML inexistente: {fragment}")


class HtmlCheck(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids=[];self.refs=[];self.images=[];self.cases=0
        self.scripts=[];self.stylesheets=[];self.inline_styles=0;self.inline_events=0
        self.in_script=False;self.script_content=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if "id" in attrs:self.ids.append(attrs["id"])
        if tag=="a" and "href" in attrs:self.refs.append(attrs["href"])
        if tag=="img":self.images.append(attrs.get("src",""))
        if tag=="script":self.scripts.append(attrs);self.in_script=True
        if tag=="style" or "style" in attrs:self.inline_styles+=1
        if any(name.startswith("on") for name in attrs):self.inline_events+=1
        if tag=="link" and attrs.get("rel")=="stylesheet":self.stylesheets.append(attrs.get("href",""))
        if tag=="section" and "case" in attrs.get("class","").split():self.cases+=1
    def handle_endtag(self,tag):
        if tag=="script":self.in_script=False
    def handle_data(self,data):
        if self.in_script and data.strip():self.script_content.append(data)


for md in ROOT.rglob("*.md"):
    if ".git" in md.parts:continue
    for target in re.findall(r"!?\[[^\]]*\]\(([^)]+)\)",md.read_text(encoding="utf-8")):
        check_target(md,target.strip().strip("<>"))

source=(ROOT/"docs/21-casos-de-uso.md").read_text(encoding="utf-8")
ids=[int(n) for n in re.findall(r"^### CU-(\d+)\.",source,re.M)]
if ids!=list(range(1,38)):errors.append("Fichas CU incompletas o desordenadas")
scenarios=re.findall(r"^\| (EI-\d+) \|",source,re.M)
if scenarios!=[f"EI-{n:02d}" for n in range(1,17)]:errors.append("Escenarios EI incompletos")
for n in range(1,13):
    if f"R{n:02d}" not in source:errors.append(f"Falta cobertura R{n:02d}")

web=ROOT/"docs/casos-de-uso/index.html"
parser=HtmlCheck();parser.feed(web.read_text(encoding="utf-8"))
assets=parser.stylesheets+[script.get("src", "") for script in parser.scripts]
for target in parser.refs+parser.images+assets:check_target(web,target,set(parser.ids))
if len(parser.ids)!=len(set(parser.ids)):errors.append("Anclas HTML duplicadas")
if parser.cases!=37 or len(parser.images)!=7:errors.append("HTML sin 37 fichas / 7 diagramas")
if parser.stylesheets!=["./casos-de-uso.css"]:errors.append("Hoja CSS separada inesperada")
if len(parser.scripts)!=1 or parser.scripts[0].get("src")!="./casos-de-uso.js":
    errors.append("Se esperaba un solo JavaScript local separado")
elif "defer" not in parser.scripts[0]:errors.append("JavaScript sin defer")
if parser.inline_styles or parser.inline_events:errors.append("Estilos o eventos inline en HTML")
if parser.script_content:errors.append("Código JavaScript inline inesperado")
if "{{NAVEGACION}}" in web.read_text(encoding="utf-8") or "{{CONTENIDO}}" in web.read_text(encoding="utf-8"):
    errors.append("Plantilla HTML sin completar")

diagrams=ROOT/"docs/arquitectura/diagramas/casos-de-uso"
svgs=sorted(diagrams.glob("*.svg"));pumls=sorted(diagrams.glob("*.puml"))
if len(svgs)!=7 or len(pumls)!=7:errors.append("Cantidad de diagramas inesperada")
drawios=sorted(diagrams.glob("*.drawio"))
if {p.stem for p in drawios}!={p.stem for p in svgs}:errors.append("Faltan editables draw.io individuales")
for drawio in drawios:
    root=ET.parse(drawio).getroot()
    cells=root.findall(".//mxCell")
    ids=[cell.get("id") for cell in cells]
    if root.tag!="mxfile" or len(ids)!=len(set(ids)):errors.append(f"Estructura draw.io inválida: {drawio.name}")
    for cell in cells:
        for attribute in ["parent", "source", "target"]:
            if cell.get(attribute) and cell.get(attribute) not in ids:
                errors.append(f"Referencia draw.io inexistente: {drawio.name}/{attribute}")
        if "shape=image" in cell.get("style", "") or "data:image" in cell.get("style", ""):
            errors.append(f"Editable contiene imagen aplanada: {drawio.name}")
    if not any(cell.get("edge")=="1" for cell in cells) or not any(cell.get("vertex")=="1" for cell in cells):
        errors.append(f"Faltan figuras/conectores editables: {drawio.name}")
    source_texts=["".join(element.itertext()) for element in ET.parse(drawio.with_suffix(".svg")).getroot().iter() if element.tag.endswith("}text")]
    editable_texts=[cell.get("value") for cell in cells if cell.get("value")]
    if source_texts!=editable_texts:errors.append(f"Textos draw.io distintos del SVG: {drawio.name}")
for svg in svgs:
    doc=ET.parse(svg)
    if not doc.getroot().tag.endswith("svg"):errors.append(f"SVG inválido: {svg.name}")
    if "<script" in svg.read_text(encoding="utf-8"):errors.append(f"Script SVG: {svg.name}")
for puml in pumls:
    text=puml.read_text(encoding="utf-8")
    if text.count("@startuml")!=1 or text.count("@enduml")!=1:errors.append(f"Fuente UML incompleta: {puml.name}")
    if puml.stem not in {p.stem for p in svgs}:errors.append(f"UML sin SVG: {puml.name}")

reader=PdfReader(ROOT/"output/pdf/casos-de-uso-salud.pdf")
texts=[p.extract_text() or "" for p in reader.pages]
full="\n".join(texts)
for n in range(1,38):
    if not re.search(rf"CU-{n:02d}\. ",full):errors.append(f"PDF sin ficha CU-{n:02d}")
for n in range(1,17):
    if f"EI-{n:02d}" not in full:errors.append(f"PDF sin escenario EI-{n:02d}")
for i,text in enumerate(texts,1):
    if len(text.strip())<160:errors.append(f"Página posiblemente vacía: {i}")
if "Propuesto" not in texts[-1] and "propuestas" not in full:errors.append("Estado de propuestas no conservado")
wide=sum(float(p.mediabox.width)>float(p.mediabox.height) for p in reader.pages)
if wide!=7:errors.append(f"Se esperaban 7 páginas horizontales de diagramas; hay {wide}")

print(f"Markdown: {len(list(ROOT.rglob('*.md')))} archivos; enlaces locales/anclas: {links}.")
print(f"37 fichas, 16 escenarios, HTML con {len(parser.ids)} anclas únicas, 7 SVG XML y 7 fuentes UML delimitadas.")
print("HTML con CSS/JS locales separados; 7 draw.io con figuras, textos y conectores nativos.")
print(f"PDF: {len(reader.pages)} páginas, {wide} horizontales; fichas y escenarios presentes; sin páginas vacías detectadas.")
print("Fuentes PlantUML: estructura comprobada; no se ejecutó un compilador PlantUML.")
if errors:
    for error in errors:print("ERROR:",error)
    raise SystemExit(1)
print("Validación documental sin errores. No demuestra comportamiento de aplicación ni seguridad implementada.")
