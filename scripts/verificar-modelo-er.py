"""Verifica artefactos ER y consistencia de fuentes; no prueba una aplicación."""
from pathlib import Path
from collections import Counter
import json,re,xml.etree.ElementTree as ET
from docx import Document
from pypdf import PdfReader
from rutas_modelo_er import estructura

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/arquitectura/modelo-er'
model=json.loads((OUT/'modelo-er.json').read_text(encoding='utf-8'))
entities={e['name']:e for e in model['entities']}
rels=model['relationships']
policy=model['identifier_policy']
assert policy['decision']=='ADR-015' and policy['primary_key_version']==7
assert policy['primary_key_default']=='uuidv7()' and policy['foreign_keys_generated'] is False
expected=set()
for n,e in entities.items():
    fields=e['fields']
    assert len({f['name'] for f in fields})==len(fields),n
    assert any(f['key']=='PK' for f in fields),n
    assert (e['scope']=='T')==any(f['name']=='tenant_id' and not f['null'] for f in fields),n
    for f in fields:
        if f['key']=='PK' or f['ref']:assert f['type']=='uuid',(n,f)
        if f['ref']:
            assert f['ref'] in entities,(n,f)
            assert f['type']==next(p['type'] for p in entities[f['ref']]['fields'] if p['key']=='PK'),(n,f)
            expected.add((n,f['name'],f['ref']))
            if e['scope']=='G':assert entities[f['ref']]['scope']!='T',(n,f)
assert expected=={(r['child'],r['field'],r['parent']) for r in rels}
assert next(f for f in entities['PACIENTE_PROFESIONAL']['fields'] if f['name']=='numero_visible')['type']=='entero'
tree=ET.parse(OUT/'modelo-er-completo.drawio')
diagrams=tree.getroot().findall('diagram')
assert len(diagrams)>10
seen=[]
for i,d in enumerate(diagrams):
    cells=d.findall('.//mxCell');ids={c.get('id') for c in cells}
    edges=[c for c in cells if c.get('edge')=='1']
    for c in edges:
        assert c.get('source') in ids and c.get('target') in ids,(d.get('name'),c.attrib)
    names=[n for n in entities if n in ids]
    if i==0:
        assert set(names)==set(entities)
        assert len(edges)==len(rels)
    else:seen+=names
    for n in names:
        text=next(c.get('value','') for c in cells if c.get('id')==n+'_fields')
        for f in entities[n]['fields']:assert f['name'] in text,(n,f)
        assert 'PK id : uuid' in text,(d.get('name'),n)
assert Counter(seen)==Counter(entities.keys())

# Las láminas individuales tienen una sola ubicación junto a su documentación.
seen_parts=[]
for item in estructura():
    folder=OUT/'partes'/item['folder']
    assert folder.is_dir(),folder
    part=ET.parse(folder/'diagrama.drawio').getroot().findall('diagram')
    assert len(part)==1,folder
    cells=part[0].findall('.//mxCell')
    ids={c.get('id') for c in cells}
    assert {n for n in entities if n in ids}==set(item['names']),folder
    for n in item['names']:
        value=next(c.get('value','') for c in cells if c.get('id')==n+'_fields')
        for f in entities[n]['fields']:
            assert f['name'] in value,(folder,n,f['name'])
    for c in cells:
        if c.get('edge')=='1':
            assert c.get('source') in ids and c.get('target') in ids,(folder,c.attrib)
    seen_parts+=item['names']
assert Counter(seen_parts)==Counter(entities.keys())
doc=Document(ROOT/'output/docx/modelo-entidad-relacion-salud.docx')
text='\n'.join(p.text for p in doc.paragraphs)
for n in entities:assert n in text,n
assert 'UUIDv7' in text and 'DEFAULT uuidv7()' in text
assert 'abstracto por definir' not in text
allmmd=(OUT/'modelo-completo.mmd').read_text(encoding='utf-8')
for r in rels:assert f': "{r["field"]}"' in allmmd,r
pdf=PdfReader(ROOT/'output/pdf/modelo-entidad-relacion-salud.pdf')
pdftext='\n'.join(p.extract_text() or '' for p in pdf.pages)
for n in entities:assert n in pdftext,n
assert len(pdf.pages)>len(diagrams)
for i,p in enumerate(pdf.pages):
    images=p.get('/Resources',{}).get('/XObject',{})
    has_image=any(v.get_object().get('/Subtype')=='/Image' for v in images.values())
    assert len((p.extract_text() or '').strip())>45 or has_image,('Página sin contenido',i+1)
for x in ('88 entidades','D04','D12','WhatsApp','T-24','CONSULTA','UUIDv7','uuidv7()','ADR-015'):assert x in pdftext,x
assert 'abstracto por definir' not in pdftext
report=dict(status='OK',entities=len(entities),foreign_keys=len(rels),drawio_pages=len(diagrams),detail_sheets=len(diagrams)-1,document_pages=len(pdf.pages),checks=['Ámbitos y FK válidas','Todas las FK tienen relación','PK y FK UUID coherentes con ADR-015','Número visible conserva tipo entero','Plano integral con todos los conectores','Todas las entidades aparecen una vez en láminas de detalle','Campos editables presentes','Extremos de conectores válidos','Diccionario completo en DOCX y PDF','Política UUIDv7 presente en DOCX y PDF','PDF sin páginas vacías'])
(OUT/'verificacion-modelo.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
