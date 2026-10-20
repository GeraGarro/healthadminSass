"""Verifica cobertura, copias, enlaces, extracción y límites de las guías PDF.

Con --render produce PNG y hojas de contacto para inspección visual.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse
import json
import re
import subprocess
import zipfile

import pdfplumber
from pypdf import PdfReader
from PIL import Image, ImageDraw, ImageFont
from rutas_modelo_er import estructura, cargar_contenido

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/arquitectura/modelo-er'
OUT = SOURCE / 'partes'
TMP = ROOT / 'tmp/pdfs/guia-modelo-er'
POPPLER = Path('C:/Users/gerag/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')


def render_one(item):
    idx, path = item
    dest = TMP / 'render' / f'{idx:02d}'
    dest.mkdir(parents=True, exist_ok=True)
    for old in dest.glob('pagina-*.png'):
        if old.parent.resolve() != dest.resolve() or not dest.resolve().is_relative_to(TMP.resolve()):
            raise ValueError('Destino temporal fuera del área de revisión')
        old.unlink()
    subprocess.run([str(POPPLER), '-scale-to', '1100', '-png', str(path), str(dest / 'pagina')],
                   check=True, capture_output=True)
    pages = sorted(dest.glob('pagina-*.png'), key=lambda p: int(p.stem.split('-')[-1]))
    sheets = []
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 17)
    for start in range(0, len(pages), 12):
        batch = pages[start:start + 12]
        image = Image.new('RGB', (4 * 320, 3 * 480), '#d8e0e5')
        draw = ImageDraw.Draw(image)
        for i, page in enumerate(batch):
            thumb = Image.open(page).convert('RGB')
            thumb.thumbnail((300, 438))
            x, y = (i % 4) * 320 + 10, (i // 4) * 480 + 27
            image.paste(thumb, (x + (300 - thumb.width) // 2, y))
            draw.text((x, y - 23), f'Guía {idx:02d} / página {start+i+1}', fill='#183b56', font=font)
        contact = TMP / f'contacto-{idx:02d}-{start//12+1}.jpg'
        image.save(contact, quality=90)
        sheets.append(str(contact))
    return dict(pdf=str(path.relative_to(ROOT)), paginas=len(pages), contactos=sheets)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--render', action='store_true')
    parser.add_argument('--zip', action='store_true')
    args = parser.parse_args()
    TMP.mkdir(parents=True, exist_ok=True)
    model = json.loads((SOURCE / 'modelo-er.json').read_text(encoding='utf-8'))
    manifest = json.loads((OUT / 'verificacion-contenido.json').read_text(encoding='utf-8'))
    entities = {e['name']: e for e in model['entities']}
    sheets = estructura()
    pedagogical_entities, pedagogical_sheets, shared = cargar_contenido()
    assert set(pedagogical_entities) == set(entities)
    errors = []
    checked_entities = checked_fields = checked_relations = pages_total = 0
    short_pages = []
    pdfs = [OUT / '00-indice-y-ruta-de-lectura.pdf']
    for sheet, record in zip(sheets, manifest['laminas'], strict=True):
        folder = OUT / record['carpeta']
        assert record['carpeta'] == sheet['folder']
        source = folder / 'diagrama.mmd'
        text = (folder / 'explicacion.md').read_text(encoding='utf-8')
        names = re.findall(r'^    (\w+) \{', source.read_text(encoding='utf-8'), re.M)
        assert names == sheet['names']
        pdf_path = folder / 'explicacion.pdf'
        pdfs.append(pdf_path)
        reader = PdfReader(pdf_path)
        pdf_text = re.sub(r'\s+', '', '\n'.join(p.extract_text() for p in reader.pages[:-1]))
        for name in names:
            checked_entities += 1
            if f'. {name}:' not in text or name not in pdf_text:
                errors.append('Entidad ausente: ' + name)
            for f in entities[name]['fields']:
                checked_fields += 1
                if '| ' + f['name'] + ' |' not in text or f['name'] not in pdf_text:
                    errors.append('Campo ausente: ' + name + '.' + f['name'])
        for relation in model['relationships']:
            if relation['child'] in names:
                checked_relations += 1
                if relation['child'] + '.' + relation['field'] not in text:
                    errors.append('Relación ausente: ' + repr(relation))
        for extension in ('mmd', 'svg', 'drawio', 'pdf'):
            if not (folder / ('diagrama.' + extension)).is_file():
                errors.append('Diagrama faltante: ' + str(folder / ('diagrama.' + extension)))
        for name in names:
            for field in entities[name]['fields']:
                pattern = r'^        \w+ ' + re.escape(field['name']) + r'(?:\s|$)'
                if not re.search(pattern, source.read_text(encoding='utf-8'), re.M):
                    errors.append('Campo faltante en Mermaid: ' + name + '.' + field['name'])
        if len(reader.pages) != record['paginas_pdf']:
            errors.append('Cantidad de páginas inconsistente: ' + record['carpeta'])
    for pdf in pdfs:
        with pdfplumber.open(pdf) as doc:
            pages_total += len(doc.pages)
            for i, page in enumerate(doc.pages, 1):
                text = page.extract_text() or ''
                if not text.strip():
                    errors.append(f'Página sin texto: {pdf.parent.name}, {i}')
                if '\ufffd' in text or '\u25a0' in text:
                    errors.append(f'Glifo inválido: {pdf.parent.name}, {i}')
                if len(text) < 450 and i != len(doc.pages):
                    short_pages.append(dict(pdf=pdf.parent.name, pagina=i, caracteres=len(text)))
                for ch in page.chars:
                    if ch['x0'] < -1 or ch['x1'] > page.width + 1 or ch['top'] < -1 or ch['bottom'] > page.height + 1:
                        errors.append(f'Texto fuera de página: {pdf.parent.name}, {i}')
                        break
    # Enlaces locales de la documentación generada y sus dos puntos de entrada.
    md_paths = list(OUT.rglob('*.md')) + [SOURCE / 'README.md', ROOT / 'docs/23-modelo-entidad-relacion.md']
    for md in md_paths:
        for target in re.findall(r'\]\(([^)]+)\)', md.read_text(encoding='utf-8')):
            if '://' in target or target.startswith('#'):
                continue
            target = target.split('#', 1)[0]
            if target and not (md.parent / target).exists():
                errors.append(f'Enlace inexistente: {md.relative_to(ROOT)} -> {target}')
    assert checked_entities == len(entities)
    assert checked_fields == sum(len(e['fields']) for e in entities.values())
    assert checked_relations == len(model['relationships'])
    result = dict(entidades=checked_entities, campos=checked_fields, relaciones=checked_relations,
                  guias=len(sheets), paginas_explicativas_e_indice=pages_total,
                  paginas_breves_a_revisar=short_pages, errores=errors)
    if args.render:
        with ThreadPoolExecutor(max_workers=4) as executor:
            result['render'] = list(executor.map(render_one, enumerate(pdfs)))
    (OUT / 'verificacion-documental.json').write_text(json.dumps({k: v for k, v in result.items() if k not in ('render', 'zip')}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if args.zip and not errors:
        zip_path = ROOT / 'output/modelo-er-paso-a-paso.zip'
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(OUT.rglob('*')):
                if path.is_file():
                    archive.write(path, Path('modelo-er-paso-a-paso') / path.relative_to(OUT))
        result['zip'] = str(zip_path)
        with zipfile.ZipFile(zip_path) as archive:
            if archive.testzip() is not None:
                errors.append('ZIP inválido')
    (TMP / 'verificacion.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in result.items() if k != 'render'}, ensure_ascii=False))
    if errors:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
