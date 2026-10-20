"""Genera 17 carpetas de estudio, sus PDF y un índice del modelo E-R.

Lee el JSON lógico y el contenido pedagógico; conserva los diagramas fuente.
Ejecutar con el Python del runtime Codex. Requiere reportlab, pypdf y Pillow.
"""
from pathlib import Path
import html
import importlib.util
import io
import json
import re
import shutil

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, LongTable,
    TableStyle,
)
from pypdf import PdfReader, PdfWriter

from rutas_modelo_er import cargar_contenido, estructura

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/arquitectura/modelo-er'
OUT = SOURCE / 'partes'
TMP = ROOT / 'tmp/pdfs/guia-modelo-er'
ENTIDADES, LAMINAS, COMPARTIDO = cargar_contenido()
CAMPOS = COMPARTIDO['campos']
PAPELES = COMPARTIDO['papeles']
ACLARACIONES = COMPARTIDO['aclaraciones']
DATE = '18 de octubre de 2026'
BLUE = colors.HexColor('#183b56')
TEAL = colors.HexColor('#087e8b')
PALE = colors.HexColor('#edf5f8')
INK = colors.HexColor('#233746')
MUTED = colors.HexColor('#526778')
WIDTH = A4[0] - 36 * mm

for name, font in [('Guia', 'arial.ttf'), ('GuiaBold', 'arialbd.ttf'), ('GuiaItalic', 'ariali.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts') / font)))
pdfmetrics.registerFontFamily('Guia', normal='Guia', bold='GuiaBold', italic='GuiaItalic', boldItalic='GuiaBold')

STYLES = {
    'title': ParagraphStyle('title', fontName='GuiaBold', fontSize=26, leading=30, textColor=BLUE, spaceAfter=12),
    'subtitle': ParagraphStyle('subtitle', fontName='Guia', fontSize=12, leading=17, textColor=MUTED, spaceAfter=12),
    'h1': ParagraphStyle('h1', fontName='GuiaBold', fontSize=17, leading=21, textColor=BLUE, spaceAfter=9, keepWithNext=True),
    'h2': ParagraphStyle('h2', fontName='GuiaBold', fontSize=11.5, leading=15, textColor=TEAL, spaceBefore=9, spaceAfter=6, keepWithNext=True),
    'body': ParagraphStyle('body', fontName='Guia', fontSize=10.3, leading=14.6, textColor=INK, spaceAfter=8),
    'compact': ParagraphStyle('compact', fontName='Guia', fontSize=10, leading=13.5, textColor=INK, spaceAfter=7),
    'small': ParagraphStyle('small', fontName='Guia', fontSize=8.5, leading=11.5, textColor=MUTED, spaceAfter=6),
    'cell': ParagraphStyle('cell', fontName='Guia', fontSize=9.0, leading=12.1, textColor=INK, spaceAfter=0, splitLongWords=True),
    'head': ParagraphStyle('head', fontName='GuiaBold', fontSize=9.0, leading=12, textColor=colors.white),
    'tag': ParagraphStyle('tag', fontName='GuiaBold', fontSize=9, leading=12, textColor=TEAL, spaceAfter=9),
}


def p(text, style='body'):
    return Paragraph(html.escape(text).replace('\n', '<br/>'), STYLES[style])


def rich(text, style='body'):
    return Paragraph(text, STYLES[style])


def table(headers, rows, widths):
    data = [[p(h, 'head') for h in headers]]
    data.extend([[p(str(v), 'cell') for v in row] for row in rows])
    t = LongTable(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BLUE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f7fa')]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LINEBELOW', (0, 0), (-1, 0), .5, BLUE),
        ('LINEBELOW', (0, 1), (-1, -1), .25, colors.HexColor('#dbe5ec')),
    ]))
    return t


def box(label, text):
    content = [rich('<b>' + html.escape(label) + '</b><br/>' + html.escape(text), 'cell')]
    t = LongTable([[content]], colWidths=[WIDTH])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PALE),
        ('BOX', (0, 0), (-1, -1), .6, colors.HexColor('#c5dce6')),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 9),
    ]))
    return t


class GuideDoc(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == 'h1':
            title = flowable.getPlainText()
            key = 'section-' + str(self.page) + '-' + str(len(title))
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(title, key, level=0, closed=False)


def build_pdf(path, title, story):
    def furniture(c, doc):
        w, h = A4
        c.setStrokeColor(colors.HexColor('#d4e0e8'))
        c.line(18 * mm, h - 15 * mm, w - 18 * mm, h - 15 * mm)
        c.setFillColor(MUTED)
        c.setFont('Guia', 8)
        c.drawString(18 * mm, h - 12 * mm, 'GESTIÓN ADMINISTRATIVA DE SALUD / MODELO E-R')
        c.drawString(18 * mm, 12 * mm, 'Guía de lectura / ' + DATE)
        c.drawRightString(w - 18 * mm, 12 * mm, f'Página {doc.page}')
    doc = GuideDoc(str(path), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                   topMargin=23 * mm, bottomMargin=21 * mm,
                   title=title, author='Sistema de Gestión Administrativa de Salud',
                   subject='Explicación pedagógica del modelo lógico propuesto',
                   allowSplitting=True)
    doc.build(story, onFirstPage=furniture, onLaterPages=furniture)



def field_explanation(entity, field):
    key = entity['name'] + '.' + field['name']
    if key in ACLARACIONES:
        text = ACLARACIONES[key]
    elif field['ref']:
        text = PAPELES[field['name']] + '. Destino: ' + field['ref'] + ', ' + ENTIDADES[field['ref']]['nombre'].lower() + '.'
    else:
        text = CAMPOS[field['name']]
    if field['ref']:
        if field['null']:
            text += ' La referencia puede estar vacía; las reglas de la entidad indican cuándo corresponde.'
        else:
            text += ' Cada registro requiere exactamente un destino válido.'
    elif field['null'] and field['name'] not in ('revocada_en', 'revocado_en', 'hasta'):
        text += ' El modelo admite dejarlo vacío.'
    return text


TYPE_NAMES = {'uuid': 'UUID', 'texto': 'Texto', 'instante': 'Fecha y hora', 'enum': 'Código/estado',
              'secreto': 'Dato protegido', 'entero': 'Entero', 'fecha': 'Fecha', 'hora': 'Hora local',
              'booleano': 'Sí/no', 'bool': 'Sí/no', 'json': 'Datos estructurados', 'decimal': 'Decimal'}

LEGEND_ROWS = COMPARTIDO['leyenda']


def relationship_text(r):
    subject = r['child'] + '.' + r['field']
    parents = ('cada registro debe referir a exactamente un registro de ' if r['parent_card'] == '1'
               else 'cada registro puede no referir a ninguno o referir a un solo registro de ')
    children = ('Como padre, cada registro de ' + r['parent'] + ' puede ser referido por ' +
                ('cero o un registro' if r['child_card'] == '0..1' else 'cero, uno o varios registros') +
                ' de ' + r['child'] + ' mediante ese campo.')
    return subject + ': ' + parents + r['parent'] + '. ' + children


def source_links(story, entities):
    story += [p('Fuentes y estado del diseño', 'h2'),
              p('Fuentes: docs/23-modelo-entidad-relacion.md y docs/arquitectura/modelo-er/modelo-er.json (v1.1, 17/10/2026); ADR-015. Guía del 18/10/2026. Ejemplos ficticios: no fijan proveedores, horarios ni duraciones. Estados, plazos, cuotas y mecanismos pendientes conservan su condición de propuesta para revisión. La guía no acredita implementación.', 'small')]
    # Cada entidad ya conserva su trazabilidad específica al pie de su ficha.
    # Evitar repetir todas las fuentes aquí mantiene juntas las notas finales.


def entity_section(e, number):
    n = e['name']
    content = ENTIDADES[n]
    story = [PageBreak(), p(f'{number}. {n}', 'h1'), p(content['nombre'], 'subtitle'),
             p(content['explicacion'], 'compact'),
             box('Ejemplo ficticio', content['ejemplo']),
             p('Cómo distinguirlo', 'h2'), p(content['distincion'], 'compact'),
             p('Campos, uno por uno', 'h2')]
    rows = []
    for f in e['fields']:
        meta = ' / '.join(x for x in [f['key'], TYPE_NAMES.get(f['type'], f['type']), 'opcional' if f['null'] else 'obligatorio'] if x)
        rows.append((f['name'] + '\n' + meta, field_explanation(e, f)))
    field_table = table(['Campo y condición', 'Qué significa en este registro'], rows, [145, WIDTH - 145])
    story.append(field_table)
    if e['rules']:
        story += [p('Reglas y límites del modelo', 'h2'), p(e['rules'], 'compact')]
    if e['scope'] == 'T':
        story.append(p('Aislamiento local: el registro y sus referencias locales deben permanecer en la misma entidad. Las FK locales usan la pareja (tenant_id, campo_id) y el servidor debe comprobar permisos; una clave válida por sí sola no concede acceso.', 'small'))
    elif e['scope'] == 'X':
        story.append(p('Excepción administrativa: las referencias entre origen y destino requieren validación explícita de su ámbito y autorización; no se interpretan como una unión general de datos entre entidades.', 'small'))
    story.append(p('Estado: ' + e['status'] + '. Fuentes del modelo: ' + e['source'] + '.', 'small'))
    # Una continuación deliberada y equilibrada evita páginas casi vacías
    # que solo contendrían la última regla o la referencia documental.
    estimated = sum(f.wrap(WIDTH, 2000)[1] + f.getSpaceBefore() + f.getSpaceAfter()
                    for f in story if not isinstance(f, PageBreak))
    if estimated > 700:
        table_pos = story.index(field_table)
        before_height = sum(f.wrap(WIDTH, 2000)[1] + f.getSpaceBefore() + f.getSpaceAfter()
                            for f in story[1:table_pos])
        # Reservar un volumen suficiente de campos para cada página.
        first_count = max(2, len(rows) // 2)
        while first_count > 2:
            candidate = table(['Campo y condición', 'Qué significa en este registro'], rows[:first_count], [145, WIDTH - 145])
            if before_height + candidate.wrap(WIDTH, 2000)[1] < 675:
                break
            first_count -= 1
        split_story = [
            table(['Campo y condición', 'Qué significa en este registro'], rows[:first_count], [145, WIDTH - 145]),
            PageBreak(), p(n + ' / continuación', 'h1'),
            p('Campos restantes y reglas', 'h2'),
            table(['Campo y condición', 'Qué significa en este registro'], rows[first_count:], [145, WIDTH - 145]),
        ]
        story[table_pos:table_pos + 1] = split_story
    return story


def markdown_guide(sheet, model, by_name, location):
    idx, info = sheet['index'], LAMINAS[sheet['index']]
    lines = [f'# {idx:02d}. {info["titulo"]}', '', DATE, '', info['objetivo'], '',
             '**Ejemplo de conjunto.** ' + info['ejemplo'], '', '**Recorrido.** ' + info['recorrido'], '',
             '[Explicación en PDF](explicacion.pdf) · [Lámina original PDF](diagrama.pdf) · [Diagrama SVG](diagrama.svg) · [Editable draw.io](diagrama.drawio) · [Fuente Mermaid](diagrama.mmd)', '',
             '## Cómo leer las marcas', '']
    for label, text in LEGEND_ROWS:
        lines += ['- **' + label + ':** ' + text]
    for i, n in enumerate(sheet['names'], 1):
        e, c = by_name[n], ENTIDADES[n]
        lines += ['', f'## {i}. {n}: {c["nombre"]}', '', c['explicacion'], '',
                  '**Ejemplo ficticio.** ' + c['ejemplo'], '', '**Cómo distinguirlo.** ' + c['distincion'], '',
                  '| Campo | Tipo / condición | Explicación |', '| --- | --- | --- |']
        for f in e['fields']:
            meta = '/'.join(x for x in [f['key'], f['type'], 'opcional' if f['null'] else 'obligatorio'] if x)
            lines.append('| ' + f['name'] + ' | ' + meta + ' | ' + field_explanation(e, f) + ' |')
        lines += ['', '**Reglas del modelo.** ' + (e['rules'] or 'Se aplican las convenciones generales de claves, ámbito y autorización.'), '',
                  '**Estado.** ' + e['status'] + '. **Fuentes.** ' + e['source'] + '.']
    lines += ['', '## Relaciones de esta lámina, incluidas las referencias externas', '']
    for r in model['relationships']:
        if r['child'] in sheet['names']:
            parent_sheet = location[r['parent']]
            lines += ['- ' + relationship_text(r) + f' Destino en carpeta {parent_sheet["folder"]}. ' + r['integrity'] + '.']
    lines += ['', '## Fuentes y estado', '',
              'Guía pedagógica del modelo lógico propuesto, versión 1.1 del 17/10/2026. No acredita implementación ni aprueba decisiones pendientes. Los ejemplos son ficticios.', '',
              'Fuentes: docs/23-modelo-entidad-relacion.md; docs/arquitectura/modelo-er/modelo-er.json; docs/20-registro-de-usuarios-y-recuperacion-de-acceso.md; docs/22-matriz-de-permisos.md; ADR-015.', '']
    return '\n'.join(lines)


def write_sheet(sheet, model, by_name, location, diagram_module):
    idx, names, stem = sheet['index'], sheet['names'], sheet['stem']
    info = LAMINAS[idx]
    folder = OUT / sheet['folder']
    folder.mkdir(parents=True, exist_ok=True)
    for suffix in ('mmd', 'svg', 'drawio'):
        if not (folder / f'diagrama.{suffix}').is_file():
            raise FileNotFoundError(folder / f'diagrama.{suffix}')
    # El generador original se ejecuta únicamente sobre un destino temporal.
    # Conserva geometría y conectores originales de los editables de trabajo.
    diagram_module.make_diagram(sheet['diagram_title'], names, idx)
    diagram_pdf = diagram_module.TMP / f'{stem}.pdf'
    shutil.copy2(diagram_pdf, folder / 'diagrama.pdf')
    story = [p(f'LÁMINA {idx:02d} / GUÍA PASO A PASO', 'tag'),
             p(info['titulo'], 'title'), p(info['objetivo'], 'subtitle'),
             box('Un caso para seguir la lectura', info['ejemplo']),
             p('Orden para entender esta parte', 'h2'), p(info['recorrido']),
             p('Qué significa cada nombre', 'h2'),
             table(['Entidad del diagrama', 'En lenguaje cotidiano'],
                   [(n, ENTIDADES[n]['nombre']) for n in names], [190, WIDTH - 190]),
             Spacer(1, 9),
             p('Contenido de esta guía: lectura de símbolos; explicación de cada entidad y todos sus campos; reglas; relaciones locales y externas; fuentes; lámina vectorial original al final.', 'small'),
             p('Diseño propuesto para revisión. Los ejemplos no incorporan nuevas reglas ni fijan los valores pendientes.', 'small'),
             PageBreak(), p('Cómo leer esta lámina', 'h1'),
             table(['Marca o concepto', 'Interpretación'], LEGEND_ROWS, [117, WIDTH - 117]),
             p('Los conectores describen relaciones entre registros, no un orden de ejecución. La FK identifica inequívocamente el destino. Las relaciones que van a otra lámina se detallan en el registro de esta guía, aunque no tengan una línea visible en la imagen.'),
             p('Una relación de muchos a muchos se resuelve con una tabla de unión: cada fila relaciona un registro de un lado con uno del otro. Por ejemplo, ROL_PERMISO reúne las acciones de un rol sin duplicar los catálogos.')]
    for i, n in enumerate(names, 1):
        story.extend(entity_section(by_name[n], i))
    story += [PageBreak(), p('Relaciones, explicadas en ambos sentidos', 'h1'),
              p('Se incluyen todas las FK originadas en esta lámina, también las que apuntan a otras carpetas. «Padre» es el registro referenciado y «hijo» el que guarda la FK. La cardinalidad general debe leerse junto con las restricciones UQ y las reglas de vigencia de cada entidad.')]
    relationships = [r for r in model['relationships'] if r['child'] in names]
    if relationships:
        story += [p('Ejemplo de lectura', 'h2'), p(relationship_text(relationships[0]))]
        rows = []
        for r in relationships:
            dest = location[r['parent']]
            cardinal = ('Cada origen exige 1 destino.' if r['parent_card'] == '1'
                        else 'Cada origen admite 0 o 1 destino.')
            cardinal += (' Cada destino admite 0 o 1 origen por este campo.' if r['child_card'] == '0..1'
                         else ' Cada destino admite 0, 1 o varios orígenes por este campo.')
            cardinal += f' Destino en lámina {dest["index"]:02d}.'
            rows.append((r['child'] + '.' + r['field'] + '\n> ' + r['parent'], cardinal))
        story.append(table(['Referencia y destino', 'Cómo se relacionan los registros'], rows, [205, WIDTH - 205]))
    if not relationships:
        story.append(p('Esta entidad no contiene FK en el modelo. Sus relaciones entrantes, si existen, se originan en las otras tablas; la ausencia de una FK no implica acceso público ni independencia de las reglas de operación.'))
    inbound = [r for r in model['relationships'] if r['parent'] in names and r['child'] not in names]
    if inbound:
        story.append(p('Conexiones que llegan desde otras láminas', 'h2'))
        story.append(p('Cada referencia entrante se explica campo por campo en la guía donde nace. Este mapa agrupa las conexiones por lámina de origen para que pueda seguirlas sin confundirlas con relaciones dibujadas en esta página.', 'small'))
        rows = []
        for origin_index in sorted({location[r['child']]['index'] for r in inbound}):
            group = [r for r in inbound if location[r['child']]['index'] == origin_index]
            rows.append((f'{origin_index:02d}. ' + LAMINAS[origin_index]['titulo'],
                         ', '.join(sorted({r['child'] for r in group})), str(len(group))))
        story.append(table(['Lámina de origen', 'Tablas que la referencian', 'FK'], rows, [145, WIDTH - 180, 35]))
    story += [p('Lectura aplicada al ejemplo', 'h2'), p(info['ejemplo']), p(info['recorrido'])]
    if idx == 1:
        story += [p('Recorrido completo con Ana', 'h2')]
        for text in [
            '1. Al registrarse se crea o reutiliza su CUENTA personal mediante el proceso autorizado.',
            '2. Si establece una contraseña propia, se registra su CREDENCIAL_LOCAL; si vincula un proveedor admitido, se registra una IDENTIDAD_EXTERNA.',
            '3. Cuando configura un método adicional, se registra FACTOR_MFA. Al ingresar se genera SESION y se anota la comprobación de MFA cuando corresponde.',
            '4. Si solicita recuperar la contraseña, TOKEN_IDENTIDAD limita esa acción. CANAL_IDENTIDAD proporciona el servicio de envío; TAREA_IDENTIDAD y ENVIO_IDENTIDAD, en la parte 2, organizan y registran su ejecución.',
            '5. El equipo operador necesita una FACULTAD_PLATAFORMA concreta para las operaciones globales autorizadas. Los permisos de Ana dentro de cada clínica se estudian en organización, membresías y delegaciones.',
        ]:
            story.append(p(text))
    source_links(story, [by_name[n] for n in names])
    body_path = TMP / f'{idx:02d}-cuerpo.pdf'
    build_pdf(body_path, info['titulo'], story)
    reader = PdfReader(body_path)
    writer = PdfWriter()
    writer.append(reader)
    writer.append(PdfReader(diagram_pdf))
    # Pie sobre la lámina original, sin tocar sus campos o conectores.
    page = writer.pages[-1]
    overlay = io.BytesIO()
    c = canvas.Canvas(overlay, pagesize=(float(page.mediabox.width), float(page.mediabox.height)))
    c.setFont('Guia', 8)
    c.setFillColor(MUTED)
    c.drawString(22, 12, f'Guía de lectura / Lámina original A3 / Página {len(writer.pages)}')
    c.save()
    overlay.seek(0)
    page.merge_page(PdfReader(overlay).pages[0])
    writer.add_metadata({'/Title': f'{idx:02d}. {info["titulo"]} - explicación detallada',
                         '/Author': 'Sistema de Gestión Administrativa de Salud',
                         '/Subject': 'Guía pedagógica del modelo E-R propuesto, 18/10/2026'})
    with (folder / 'explicacion.pdf').open('wb') as stream:
        writer.write(stream)
    (folder / 'explicacion.md').write_text(markdown_guide(sheet, model, by_name, location), encoding='utf-8')
    (folder / 'README.md').write_text(
        f'# {idx:02d}. {info["titulo"]}\n\n{info["objetivo"]}\n\n'
        '[Abrir explicación detallada](explicacion.pdf)\n\n'
        '[Leer explicación en texto](explicacion.md)\n\n'
        '[Lámina PDF](diagrama.pdf) · [SVG](diagrama.svg) · [draw.io](diagrama.drawio) · [Mermaid](diagrama.mmd)\n\n'
        '[Volver al índice](../README.md)\n', encoding='utf-8')
    return {'carpeta': sheet['folder'], 'entidades': len(names),
            'campos': sum(len(by_name[n]['fields']) for n in names),
            'relaciones_salientes': len(relationships), 'paginas_pdf': len(writer.pages)}


def write_index(sheets, model, by_name):
    story = [p('DOCUMENTACIÓN EXPLICATIVA / 17 LÁMINAS', 'tag'),
             p('Entender el modelo E-R\npaso a paso', 'title'),
             p('Sistema de Gestión Administrativa de Salud', 'subtitle'),
             box('Cómo está organizado', 'Cada carpeta numerada contiene una explicación en PDF, su versión en texto y el diagrama en PDF, SVG, draw.io y Mermaid. Empiece por la carpeta 01 y continúe en orden. Cada guía explica todas sus entidades y campos, sus reglas y sus referencias a otras partes.'),
             p('Qué representa el modelo', 'h2'),
             p('El modelo entidad-relación describe qué información conserva el sistema y cómo se conecta. Un rectángulo es una tabla; sus atributos describen qué se guarda; una relación indica cómo un registro se refiere a otro. Su disposición en la página no define un flujo de pantallas.'),
             p(f'Alcance: {len(model["entities"])} entidades, {sum(len(e["fields"]) for e in model["entities"])} campos y {len(model["relationships"])} referencias FK distribuidas en {len(sheets)} láminas.'),
             p('Una historia común para los ejemplos', 'h2'),
             p('Ana es médica, Lucía es paciente y Pedro integra el equipo de una clínica ficticia. Clínica Norte y Clínica Sur permiten distinguir ámbitos. Laura y Martín ilustran concesiones operativas de plataforma. Los nombres, contactos y horarios de los ejemplos son ficticios.'),
             p('Estado documental', 'h2'),
             p('El modelo lógico es una propuesta para revisión. ADR-015 acepta UUIDv7 para los identificadores internos; las demás tablas, columnas, tipos, estados y mecanismos nuevos conservan su estado documental. Esta explicación no acredita implementación ni aprueba propuestas pendientes.'),
             PageBreak(), p('Cómo leer los diagramas', 'h1'),
             table(['Concepto', 'Significado'], LEGEND_ROWS, [117, WIDTH - 117]),
             p('Cómo seguir una relación', 'h2'),
             p('SESION.cuenta_id apunta a CUENTA: cada sesión exige una cuenta y una cuenta puede tener ninguna, una o varias sesiones. TOKEN_IDENTIDAD.cuenta_id es opcional: un token puede todavía no tener cuenta asociada. Siempre lea las UQ y reglas adicionales; una cardinalidad 0..N no permite ignorar el límite de una credencial local vigente.'),
             PageBreak(), p('Ruta de lectura: de la persona a la operación', 'h1')]
    lines = ['# Modelo E-R explicado paso a paso', '', DATE, '',
             f'{len(model["entities"])} entidades · {sum(len(e["fields"]) for e in model["entities"])} campos · {len(model["relationships"])} referencias FK · {len(sheets)} carpetas.', '',
             '[Abrir índice general en PDF](00-indice-y-ruta-de-lectura.pdf)', '',
             'Cada carpeta contiene explicacion.pdf, explicacion.md, diagrama.pdf, diagrama.svg, diagrama.drawio, diagrama.mmd y README.md.', '',
             '## Orden recomendado', '']
    for s in sheets:
        idx, info = s['index'], LAMINAS[s['index']]
        story += [p(f'{idx:02d}. {info["titulo"]}', 'h2'), p(info['objetivo']),
                  p('Carpeta: ' + s['folder'], 'small'),
                  rich('<link href="' + s['folder'] + '/explicacion.pdf" color="#087e8b">Abrir guía de esta parte</link>', 'small')]
        lines += [f'{idx}. [{info["titulo"]}]({s["folder"]}/explicacion.pdf): {info["objetivo"]}']
    story += [PageBreak(), p('Dónde encontrar cada entidad', 'h1'),
              p('El nombre técnico identifica la tabla del modelo. La traducción indica qué representa concretamente. La columna final remite a la carpeta numerada de esta colección.')]
    rows = []
    for s in sheets:
        for n in s['names']:
            rows.append((n, ENTIDADES[n]['nombre'], f'{s["index"]:02d}'))
    index_table = table(['Nombre técnico', 'Qué representa', 'Carpeta'], rows, [185, WIDTH - 232, 47])
    index_table.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(index_table)
    story += [PageBreak(), p('Glosario para entender las explicaciones', 'h1')]
    glossary = COMPARTIDO['glosario']
    story.append(table(['Término', 'Explicación'], glossary, [135, WIDTH - 135]))
    source_links(story, [])
    build_pdf(OUT / '00-indice-y-ruta-de-lectura.pdf', 'Modelo E-R explicado paso a paso', story)
    lines += ['', '## Uso y regeneración', '',
              'Esta es la ubicación única de las láminas individuales y sus explicaciones. Cada carpeta reúne el diagrama editable y la guía correspondiente; el modelo integral se conserva en el nivel superior.', '',
              'Para editar una explicación, modificar el contenido.json de su carpeta. glosario-campos.json conserva las definiciones compartidas, símbolos y glosario; estructura.json fija el orden y los nombres de las 17 láminas. Las guías Markdown y PDF se regeneran con scripts/generar-guia-modelo-er.py.', '',
              'Estado: guía de un modelo lógico propuesto; no aprueba decisiones pendientes ni acredita implementación. Los ejemplos son ficticios.', '']
    (OUT / 'README.md').write_text('\n'.join(lines), encoding='utf-8')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    model = json.loads((SOURCE / 'modelo-er.json').read_text(encoding='utf-8'))
    by_name = {e['name']: e for e in model['entities']}
    if set(by_name) != set(ENTIDADES):
        raise ValueError('Deben explicarse exactamente las entidades actuales: ' + repr(set(by_name) ^ set(ENTIDADES)))
    for e in by_name.values():
        for f in e['fields']:
            key = e['name'] + '.' + f['name']
            if key in ACLARACIONES:
                continue
            if f['ref'] and f['name'] not in PAPELES:
                raise ValueError('Falta explicación del papel de ' + key)
            if not f['ref'] and f['name'] not in CAMPOS:
                raise ValueError('Falta explicación del campo ' + key)
    spec = importlib.util.spec_from_file_location('modelo_er_diagramas', ROOT / 'scripts/generar-modelo-er.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.OUT = TMP / 'diagramas'
    mod.TMP = TMP / 'diagramas'
    mod.OUT.mkdir(parents=True, exist_ok=True)
    mod.E = by_name
    mod.R = model['relationships']
    sheets = estructura()
    for sheet in sheets:
        path = OUT / sheet['folder'] / 'diagrama.mmd'
        names = re.findall(r'^    (\w+) \{', path.read_text(encoding='utf-8'), re.M)
        if names != sheet['names']:
            raise ValueError('Diagrama y estructura no coinciden: ' + sheet['folder'])
    flat = [n for s in sheets for n in s['names']]
    if len(sheets) != 17 or len(flat) != len(set(flat)) or set(flat) != set(by_name):
        raise ValueError('Las láminas deben cubrir una sola vez todas las entidades del modelo')
    location = {n: s for s in sheets for n in s['names']}
    report = []
    for s in sheets:
        result = write_sheet(s, model, by_name, location, mod)
        report.append(result)
        print(json.dumps(result, ensure_ascii=False), flush=True)
    write_index(sheets, model, by_name)
    manifest = dict(fecha='2026-10-18', modelo_version=model['version'],
                    entidades=len(by_name), campos=sum(len(e['fields']) for e in by_name.values()),
                    relaciones=len(model['relationships']), laminas=report)
    (OUT / 'verificacion-contenido.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'indice': str(OUT / '00-indice-y-ruta-de-lectura.pdf'),
                      'guias': len(report), 'paginas_guias': sum(r['paginas_pdf'] for r in report)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
