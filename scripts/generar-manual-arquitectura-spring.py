"""Genera el manual Spring y sus anexos desde fuentes locales, sin servicios externos.

Dependencias: reportlab, pypdf. Para revisar: pdftoppm y Pillow.
Ejecutar desde cualquier directorio con Python 3.10 o superior.
"""
from __future__ import annotations

import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from xml.sax.saxutils import escape

from pypdf import PdfReader
from reportlab.graphics.shapes import Drawing, Line, Polygon, Rect, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Preformatted, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/25-arquitectura-servidor-spring.md'
MODEL = ROOT / 'docs/arquitectura/modelo-er/modelo-er.json'
MATRIX = ROOT / 'docs/permisos/matriz.json'
CASES = ROOT / 'docs/21-casos-de-uso.md'
OUT = ROOT / 'output/pdf/manual-arquitectura-servidor-spring.pdf'
DETAIL = ROOT / 'docs/arquitectura/servidor-spring'

INK = colors.HexColor('#193348')
TEAL = colors.HexColor('#087E83')
LIGHT = colors.HexColor('#EEF6F6')
PALE = colors.HexColor('#F3F5F8')
LINE = colors.HexColor('#CEDAE2')
MUTED = colors.HexColor('#526779')
W, H = A4
MARGIN = 48
BW = W - 2 * MARGIN

FONT = Path('C:/Windows/Fonts')
pdfmetrics.registerFont(TTFont('Manual', str(FONT / 'arial.ttf')))
pdfmetrics.registerFont(TTFont('ManualBold', str(FONT / 'arialbd.ttf')))
pdfmetrics.registerFont(TTFont('ManualMono', str(FONT / 'consola.ttf')))
pdfmetrics.registerFontFamily('Manual', normal='Manual', bold='ManualBold', italic='Manual', boldItalic='ManualBold')

STYLES = getSampleStyleSheet()
STYLES.add(ParagraphStyle('BodyManual', fontName='Manual', fontSize=9.5, leading=14,
                         textColor=INK, spaceAfter=8, alignment=TA_LEFT))
STYLES.add(ParagraphStyle('ChapterManual', fontName='ManualBold', fontSize=21, leading=25,
                         textColor=INK, spaceAfter=18, keepWithNext=True))
STYLES.add(ParagraphStyle('SubManual', fontName='ManualBold', fontSize=11.3, leading=15,
                         textColor=TEAL, spaceBefore=9, spaceAfter=7, keepWithNext=True))
STYLES.add(ParagraphStyle('CellManual', parent=STYLES['BodyManual'], fontSize=8.1,
                         leading=11.3, spaceAfter=0, splitLongWords=True))
STYLES.add(ParagraphStyle('HeaderCellManual', parent=STYLES['CellManual'],
                         textColor=colors.white, fontName='ManualBold'))
STYLES.add(ParagraphStyle('SmallManual', parent=STYLES['BodyManual'], fontSize=8,
                         leading=11.5, textColor=MUTED))
STYLES.add(ParagraphStyle('CodeManual', fontName='ManualMono', fontSize=7.6,
                         leading=10.5, textColor=INK, backColor=PALE,
                         borderPadding=9, spaceBefore=5, spaceAfter=12))
STYLES.add(ParagraphStyle('BulletManual', parent=STYLES['BodyManual'], leftIndent=12,
                         firstLineIndent=0, bulletIndent=0, spaceAfter=5))


def rich(text: str) -> str:
    text = escape(text)
    text = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', r'<a href="\2" color="#087E83">\1</a>', text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'`([^`]+)`', r'<font name="ManualMono">\1</font>', text)
    return text


def p(text, style='BodyManual'):
    return Paragraph(rich(str(text)), STYLES[style])


def table(rows, widths=None):
    if widths is None:
        n = len(rows[0])
        if rows[0][0] == 'ID':
            widths = [BW * .08, BW * .47, BW * .45]
        elif n == 3:
            widths = [BW * .25, BW * .39, BW * .36]
        elif n == 4:
            widths = [BW * .18, BW * .29, BW * .25, BW * .28]
        else:
            widths = [BW / n] * n
    data = [[p(c, 'HeaderCellManual' if i == 0 else 'CellManual') for c in row] for i, row in enumerate(rows)]
    result = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
    result.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), INK),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, PALE]),
        ('LINEBELOW', (0, 0), (-1, 0), .6, TEAL),
        ('LINEBELOW', (0, 1), (-1, -1), .3, LINE),
    ]))
    result.spaceAfter = 13
    return result


def arrow(d, x1, y1, x2, y2):
    d.add(Line(x1, y1, x2, y2, strokeColor=TEAL, strokeWidth=1.2))
    if abs(y2 - y1) > abs(x2 - x1):
        sign = 1 if y2 > y1 else -1
        pts = [x2, y2, x2-3, y2-6*sign, x2+3, y2-6*sign]
    else:
        sign = 1 if x2 > x1 else -1
        pts = [x2, y2, x2-6*sign, y2+3, x2-6*sign, y2-3]
    d.add(Polygon(pts, fillColor=TEAL, strokeColor=TEAL))


def box(d, x, y, w, h, label, dark=False):
    d.add(Rect(x, y, w, h, rx=5, ry=5, fillColor=INK if dark else LIGHT, strokeColor=LINE))
    lines = label.split('\n')
    start = y+h/2 + (len(lines)-1)*6
    for i, line in enumerate(lines):
        d.add(String(x+w/2, start-i*12-3, line, textAnchor='middle', fontName='ManualBold' if i == 0 else 'Manual', fontSize=8.5, fillColor=colors.white if dark else INK))


def diagram(name):
    if name == 'contexto':
        d = Drawing(BW, 246)
        box(d, 0, 190, 135, 45, 'Portal Angular\nPaciente y personal')
        box(d, 175, 190, 145, 45, 'Proxy HTTPS\nMismo origen propuesto')
        box(d, 175, 103, 145, 54, 'Servidor Spring\nHTTP + workers durables', True)
        box(d, 0, 10, 148, 53, 'PostgreSQL\nDatos + RLS + capacidad')
        box(d, 175, 10, 145, 53, 'Correo / WhatsApp\nAdaptadores por puerto')
        box(d, 350, 103, BW-350, 54, 'Identidad OIDC\nGoogle si se adopta')
        arrow(d, 135, 212, 175, 212)
        arrow(d, 247, 190, 247, 157)
        arrow(d, 175, 124, 74, 63)
        arrow(d, 247, 103, 247, 63)
        arrow(d, 320, 130, 350, 130)
    elif name == 'capas':
        d = Drawing(BW, 198)
        labels = [('API', 'DTO, validación y HTTP'), ('Application', 'Casos de uso y puertos'), ('Domain', 'Invariantes y políticas')]
        for i, (label, sub) in enumerate(labels):
            y = 142 - i*66
            box(d, 0, y, 265, 48, label+'\n'+sub, i == 2)
            if i < 2:
                arrow(d, 132, y, 132, y-18)
        box(d, 310, 76, BW-310, 48, 'Infrastructure\nJPA / JDBC / HTTP')
        arrow(d, 310, 100, 265, 100)
        d.add(String(310, 55, 'Implementa los puertos', fontName='Manual', fontSize=8, fillColor=MUTED))
        d.add(String(310, 42, 'definidos hacia adentro.', fontName='Manual', fontSize=8, fillColor=MUTED))
    elif name == 'reserva':
        d = Drawing(BW, 155)
        gap = 14
        col = (BW-2*gap)/3
        for i, label in enumerate(['Disponibilidad\nNo ocupa capacidad', 'Pre-reserva activa\nOcupa hasta vencer', 'Turno registrado\nConserva ocupación']):
            x = i*(col+gap)
            box(d, x, 90, col, 52, label, i == 2)
            if i < 2:
                arrow(d, x+col, 116, x+col+gap, 116)
        box(d, col+gap, 8, col, 48, 'Vencida / liberada\nNo puede completarse')
        arrow(d, col+gap+col/2, 90, col+gap+col/2, 56)
        d.add(String(0, 25, 'Registro y asistencia son', fontName='Manual', fontSize=8, fillColor=MUTED))
        d.add(String(0, 13, 'operaciones distintas.', fontName='Manual', fontSize=8, fillColor=MUTED))
    elif name == 'tiempo':
        d = Drawing(BW, 118)
        points = [(52, 'T-72 / T-48', 'Un correo'), (220, 'T-36', 'WhatsApp si pendiente'), (400, 'T-24', 'Cierre según política')]
        arrow(d, 25, 65, BW-12, 65)
        for x, label, sub in points:
            d.add(Rect(x-3, 62, 6, 6, fillColor=TEAL, strokeColor=TEAL))
            d.add(String(x, 86, label, textAnchor='middle', fontName='ManualBold', fontSize=10, fillColor=INK))
            d.add(String(x, 42, sub, textAnchor='middle', fontName='Manual', fontSize=8.5, fillColor=INK))
        d.add(String(0, 9, 'T = inicio vigente del turno. Reprogramar invalida el cronograma anterior.', fontName='Manual', fontSize=8, fillColor=MUTED))
    else:
        raise ValueError(name)
    return d


class ManualDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(str(filename), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                         topMargin=58, bottomMargin=48, title='Manual de arquitectura del servidor Spring',
                         author='Sistema de Gestión Administrativa de Salud',
                         subject='Diseño integral, contratos, datos, seguridad y operación. Versión 1.0.')
        frame = Frame(MARGIN, 48, BW, H-106, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate('manual', [frame], onPage=self.decorate))
        self.chapter = ''
        self.section_pages = {}

    def beforeDocument(self):
        self.chapter = ''
        self.section_pages = {}

    def decorate(self, canv, doc):
        canv.saveState()
        canv.setFillColor(TEAL)
        canv.rect(0, H-8, W, 8, stroke=0, fill=1)
        if doc.page > 1:
            canv.setFont('ManualBold', 8)
            canv.setFillColor(INK)
            canv.drawString(MARGIN, H-32, 'SALUD  /  ARQUITECTURA DEL SERVIDOR')
            canv.setFont('Manual', 7.7)
            canv.setFillColor(MUTED)
            canv.drawRightString(W-MARGIN, H-32, 'Diseño técnico | v1.0')
        canv.setStrokeColor(LINE)
        canv.line(MARGIN, 36, W-MARGIN, 36)
        canv.setFont('Manual', 7.5)
        canv.setFillColor(MUTED)
        canv.drawString(MARGIN, 23, '20/10/2026 | Requisitos vigentes y propuestas identificadas')
        canv.drawRightString(W-MARGIN, 23, str(doc.page))
        canv.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == 'ChapterManual':
            title = flowable.getPlainText()
            key = 'section-' + hashlib.sha1(title.encode()).hexdigest()[:12]
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(title, key, 0, False)
            self.notify('TOCEntry', (0, title, self.page, key))
            self.section_pages[title] = self.page


def parse_md(text):
    lines = text.splitlines()
    story = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if line.startswith('## '):
            story.extend([PageBreak(), p(line[3:], 'ChapterManual')])
            i += 1
        elif line.startswith('### '):
            story.append(p(line[4:], 'SubManual'))
            i += 1
        elif line.startswith('```'):
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                code.append(lines[i])
                i += 1
            for code_line in code:
                if pdfmetrics.stringWidth(code_line, 'ManualMono', 7.6) > BW-18:
                    raise ValueError('Línea de código demasiado larga: ' + code_line)
            story.append(Preformatted('\n'.join(code), STYLES['CodeManual']))
            i += 1
        elif line.startswith('[[diagram:'):
            story.append(diagram(line[len('[[diagram:'):-2]))
            story.append(Spacer(1, 14))
            i += 1
        elif line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r'[-: ]+', c) for c in cells):
                    rows.append(cells)
                i += 1
            story.append(table(rows))
        elif re.match(r'^(\d+\. |\- )', line):
            match = re.match(r'^(\d+\.|\-) (.*)', line)
            bullet = match[1] if match[1] != '-' else '-'
            story.append(Paragraph(rich(match[2]), STYLES['BulletManual'], bulletText=bullet))
            i += 1
        else:
            paragraph = [line]
            i += 1
            while i < len(lines) and lines[i].strip() and not re.match(r'^(#|\||```|\[\[diagram:|\d+\. |\- )', lines[i].strip()):
                paragraph.append(lines[i].strip())
                i += 1
            story.append(p(' '.join(paragraph)))
    return story


def owners(model):
    mapping = {}
    for entity in model['entities']:
        group = int(entity['group'].split()[0])
        if group == 1:
            owner = 'identity'
        elif group in (2, 3, 13):
            owner = 'organization'
        elif group == 4:
            owner = 'patient'
        elif 5 <= group <= 9:
            owner = 'scheduling'
        elif 10 <= group <= 12:
            owner = 'communication'
        elif group == 14:
            owner = 'audit'
        else:
            raise ValueError('Grupo sin dueño: ' + str(group))
        mapping[entity['name']] = owner
    assert len(mapping) == len(model['entities']) == 88
    return mapping


# Todas las rutas son propuestas; las operaciones internas no se publican.
ROUTES = [
 ('patient','POST /public/admissions','Formulario protegido; no concede acceso'),
 ('patient','POST /admissions/{id}/decisions','Facultad de admisión; no delegación de agenda'),
 ('patient + identity','POST /access-activations','Token limitado y aprobación vigente'),
 ('identity','POST /auth/login; GET /me/contexts','Sesión; contexto no concede facultades'),
 ('identity','POST /auth/recovery; POST /auth/reset','Equipo; token un solo uso; no enumera cuentas'),
 ('patient','POST /patients/{id}/representations','Evidencia y facultades pendientes D08'),
 ('organization','POST /platform/entities; POST /team-invitations','Alta controlada; facultades específicas'),
 ('scheduling.agenda','POST /agendas/{id}/delegations; POST /delegations/{id}/revocation','Profesional otorgante; acción y vigencia'),
 ('patient','POST /patients; POST /patients/{id}/professional-links','Número estable y contador atómico'),
 ('scheduling.catalog','POST /practices; POST /practices/{id}/versions','Facultad de catálogo todavía por asignar'),
 ('scheduling.agenda','POST /agendas; POST /agendas/{id}/offers','Profesional/delegado; tiempos por validar'),
 ('scheduling.coverage','POST /agreements; POST /agreements/{id}/versions','Facultad y reglas locales de cobertura'),
 ('scheduling','GET /availability','Solo oferta elegible; no ocupa'),
 ('scheduling.booking','POST /holds; POST /appointments','Paciente/representante solo Consulta'),
 ('scheduling.booking','POST /holds; POST /appointments','Personal con permiso; misma capacidad'),
 ('scheduling.rescheduling','POST /management-requests','Sin elegir intervalo ni ocupar capacidad'),
 ('scheduling','GET /appointments; GET /appointments/{id}/history','Alcance por paciente/agenda'),
 ('scheduling.attendance','POST /appointments/{id}/attendance-confirmations','Acción explícita; token/sesión acotados'),
 ('scheduling.booking','POST /appointments/{id}/cancellations','Política; liberar una sola vez'),
 ('scheduling.rescheduling','POST /appointments/{id}/reschedules','Mover atómicamente; Consulta en portal'),
 ('scheduling.rescheduling','POST /rescheduling-batches','WhatsApp a todos los afectados; D07/D09'),
 ('scheduling.attendance','POST /appointments/{id}/arrival; POST /appointments/{id}/journey-events','Transiciones/titulares pendientes; sin estado libre'),
 ('communication.chat','GET/POST /conversations/{id}/messages','Participante con facultad; separado de agenda'),
 ('scheduling + communication','INTERNO: procesar planes de confirmación','Sin ruta pública de cron'),
 ('scheduling.attendance','INTERNO: cerrar no confirmado','Lock y política T-24; aviso interno durable'),
 ('communication.inbox','GET /work-items; POST /work-items/{id}/resolutions','Facultad y seguimiento; no acceso general'),
 ('audit.abuse','GET /abuse-cases; POST /abuse-cases/{id}/decisions','Revisión/excepción auditada; D15'),
 ('patient + organization','POST /access-grants/{id}/revocation','Distinguir admisión, membresía y delegación'),
 ('organization','POST /professionals/{id}/institutional-exits','Administrador local facultado; cuenta persiste'),
 ('organization.transition','POST /platform/professional-transitions','D04/D12; deshabilitado hasta resolver modelo'),
 ('organization + identity','POST /account-deletion-requests','Solicitud expresa; ejecución separada pendiente'),
 ('reporting + audit','POST /reports; GET /reports/{id}/download; GET /audit-events','Ámbito/campos autorizados; revalidar descarga'),
 ('audit.operations','OPERACIÓN: respaldo y ensayo de restauración','Sin endpoint de paciente; credenciales separadas'),
 ('audit.operations','OPERACIÓN: runbook de incidente','Operador/plataforma facultados; evidencia'),
 ('organization.onboarding','PROPUESTO: POST /public/entity-requests','CU-35 no aprobado; deshabilitado'),
 ('scheduling.booking','SUBFUNCIÓN: POST /holds','Idempotencia, cuota y exclusión global'),
 ('scheduling.booking','SUBFUNCIÓN: POST /appointments','Reutiliza ocupación y persiste plan'),
]


def case_rows():
    rows = []
    for line in CASES.read_text(encoding='utf-8').splitlines():
        if re.match(r'^\| CU-\d\d \|', line):
            cells = [x.strip() for x in line.strip('|').split('|')]
            rows.append(cells)
    assert len(rows) == len(ROUTES) == 37
    assert [r[0] for r in rows] == [f'CU-{i:02}' for i in range(1, 38)]
    return rows


def appendices(model, matrix, mapping):
    story = [PageBreak(), p('Anexo A. Propiedad de las 88 entidades', 'ChapterManual')]
    story.append(p('Asignación de diseño de este manual sobre el modelo E-R 1.1. G = global restringido; T = entidad; X = transición controlada. Ser dueño de una tabla no concede permiso a un usuario. Los campos se consultan en el diccionario original.'))
    generated = ['# Anexos generados del manual Spring', '', 'Fuente: modelo E-R 1.1, matriz MP y casos de uso. Asignaciones y rutas propuestas por el manual.', '']
    for owner in ['identity', 'organization', 'patient', 'scheduling', 'communication', 'audit']:
        subset = [e for e in model['entities'] if mapping[e['name']] == owner]
        title = f'{owner} - {len(subset)} entidades'
        story.append(p(title, 'SubManual'))
        rows = [['Entidad', 'Ámbito', 'Responsabilidad del registro']]
        generated.extend(['## '+title, '', '| Entidad | Ámbito | Propósito |', '| --- | --- | --- |'])
        for e in subset:
            rows.append([e['name'].replace('_', '_\u200b'), e['scope'], e['purpose']])
            generated.append(f"| {e['name']} | {e['scope']} | {e['purpose']} |")
        story.append(table(rows, [BW*.34, BW*.10, BW*.56]))
        generated.append('')
    story.append(p('reporting no posee tablas de negocio en esta propuesta. config/shared no son dueños alternativos de las tablas listadas. ROL/PERMISO son definiciones globales restringidas; las asignaciones locales conservan tenant_id.'))
    story.extend([PageBreak(), p('Anexo B. Casos de uso y API propuesta', 'ChapterManual')])
    story.append(p('Rutas abreviadas: agregar /api/v1; las locales, salvo acceso público/autenticación/plataforma, agregan /entities/{tenantId}. Los contratos internos no son endpoints públicos. Las facultades se toman de la matriz original; el texto no concede permisos pendientes.'))
    generated.extend(['## Casos de uso y API propuesta', ''])
    for row, route in zip(case_rows(), ROUTES):
        cu, name, actor, refs = row
        owner, path, condition = route
        mp = [r['id'] for r in matrix['filas'] if cu in re.findall(r'CU-\d+', r['cu'])]
        title = f'{cu}. {name}'
        details = f'Módulo: {owner}. Actor original: {actor}. Referencias: {refs}. MP: {", ".join(mp) if mp else "sin fila específica; aplicar facultad/operación técnica"}. Condición: {condition}.'
        story.append(KeepTogether([p(title, 'SubManual'), p(path, 'SmallManual'), p(details)]))
        generated.extend(['### '+title, '', path, '', details, ''])
    story.extend([PageBreak(), p('Anexo C. Permisos originales y límites', 'ChapterManual')])
    story.append(p('Transcripción de las 46 acciones de docs/permisos/matriz.json. Orden de marcas: paciente / representante / secretaría / profesional / administrador de entidad / administrador de plataforma. C = condicionado; D = delegado; F = facultad expresa; ? = pendiente sin concesión; - = sin concesión por ese rol; X = prohibido en ese supuesto. Se conserva el texto original de condiciones.'))
    generated.extend(['## Matriz original', ''])
    for row in matrix['filas']:
        title = f"{row['id']}. {row['a']}"
        marks = ' / '.join(row['p']).replace('—', '-')
        refs = f"CU: {row['cu']}. Pendientes: {row['open']}. Fuentes: {', '.join(row['refs'])}.".replace('—', '-')
        story.append(KeepTogether([p(title, 'SubManual'), p('Marcas: ' + marks, 'SmallManual'), p(row['n']), p(refs, 'SmallManual')]))
        generated.extend(['### '+title, '', 'Marcas: '+marks, '', row['n'], '', refs, ''])
    story.append(p('Cinco operaciones técnicas separadas', 'SubManual'))
    story.append(p('No son roles humanos ni endpoints públicos. Se conserva el alcance original de la matriz.'))
    assert len(matrix['operaciones']) == 5
    generated.extend(['## Operaciones técnicas originales', ''])
    for op in matrix['operaciones']:
        op_id, actor, action, conditions, refs = op
        title = f'{op_id}. {actor}'
        story.append(KeepTogether([p(title, 'SubManual'), p(action), p(conditions), p('Fuentes: '+refs, 'SmallManual')]))
        generated.extend(['### '+title, '', action, '', conditions, '', 'Fuentes: '+refs, ''])
    story.extend([PageBreak(), p('Anexo D. Reglas y evidencia de seguridad', 'ChapterManual')])
    story.append(p('Mapa de trazabilidad para revisar la implementación futura. Las pruebas listadas son criterios pendientes, no resultados ejecutados. La especificación original prevalece sobre esta vista abreviada.'))
    rules = [
      ['R01','02, 04, 10-12','Aislamiento local, entidad independiente y ficha administrativa'],
      ['R02','14-15, 28','Hold durable, cuotas concurrentes e idempotencia'],
      ['R03','14-15, 17','Una sola ocupación entre entidades; conflicto sin detalles'],
      ['R04','05, 09','Membresía más delegación por acción; revocación efectiva'],
      ['R05','19, 26-27','Baja local, continuidad y eliminación solicitada separadas'],
      ['R06','11, 13, 17','Solo Consulta en portal; duración/versiones preservadas'],
      ['R07','12-13','Convenio y modalidad explícitos; sin pasar a particular'],
      ['R08','16-18','Correo, WhatsApp y cierre consistente; carrera T-24'],
      ['R09','08-09, 12','Representante verificado; actor y paciente separados'],
      ['R10','08-09, 19, 27','Facultades de plataforma; recuperación sin restaurar permisos'],
      ['R11','17-19','Canales, chat humano y WhatsApp por ausencia'],
      ['R12','06, 22-25','Evidencia cronológica, reportes y recuperación controlada'],
    ]
    story.append(table([['Regla','Capítulos','Comprobación principal']]+rules, [BW*.12,BW*.17,BW*.71]))
    story.append(p('S01-S16: evidencia de beta requerida', 'SubManual'))
    security = [
      ['S01','08-09','Acceso y recuperación sin apropiación ni permisos residuales'],
      ['S02','09, 20','API negativa por paciente, agenda y entidad; revocación'],
      ['S03','10, 14','RLS con rol real, pool reutilizado y capacidad mínima'],
      ['S04','07-08, 24','TLS, cookies, sesión y CSRF en despliegue real'],
      ['S05','13-15, 20, 28','Validación, parámetros SQL y límites por operación'],
      ['S06','08, 24-25','MFA administrativo y separación de operación'],
      ['S07','08, 16-17','Tokens limitados, GET sin mutación e idempotencia'],
      ['S08','07, 18, 24-25','Secretos fuera de Git y webhooks firmados'],
      ['S09','09, 12, 18','Representación y destinatario autorizado mínimo'],
      ['S10','20, 22, 24','Auditoría restringida, errores y logs sin secretos'],
      ['S11','24-25','Copia externa y restauración íntegra demostrada'],
      ['S12','24-25','Ensayo de incidente, revocación y recuperación'],
      ['S13','13, 15, 17','Rechazo de otras prácticas incluso renombradas Consulta'],
      ['S14','09, 19','Chat por participantes; delegar agenda no da lectura'],
      ['S15','08-09, 12','Admisión y activación previas al acceso privado'],
      ['S16','14-15, 18, 28','Cuota atómica incluidos confirmados, familias y revisión'],
    ]
    story.append(table([['Control','Capítulos','Evidencia de aceptación']]+security, [BW*.12,BW*.17,BW*.71]))
    generated.extend(['## Reglas y seguridad', '', '| Regla | Capítulos | Evidencia |', '| --- | --- | --- |'])
    generated.extend('| '+' | '.join(row)+' |' for row in rules+security)
    DETAIL.mkdir(parents=True, exist_ok=True)
    (DETAIL/'anexos-generados.md').write_text('\n'.join(generated), encoding='utf-8')
    (DETAIL/'propiedad-entidades.json').write_text(json.dumps(mapping, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    return story


def write_diagrams():
    diagrams = {
      '01-contexto': '''flowchart TB\n  Portal[Portal Angular] --> Proxy[Proxy HTTPS]\n  Proxy --> Spring[Servidor Spring: HTTP y workers]\n  Spring --> DB[(PostgreSQL: datos, RLS y capacidad)]\n  Spring --> Delivery[Correo y WhatsApp]\n  Spring --> OIDC[Identidad OIDC si se adopta]\n''',
      '02-capas': '''flowchart TB\n  API[API: DTO y controladores] --> App[Application: casos de uso y puertos]\n  App --> Domain[Domain: invariantes]\n  Infra[Infrastructure: JPA, JDBC y HTTP] --> App\n''',
      '03-reserva': '''flowchart LR\n  D[Disponibilidad: no ocupa] --> H[Pre-reserva: ocupa hasta vencer]\n  H --> T[Turno: conserva ocupación]\n  H --> E[Vencida o liberada]\n  T --> A[Asistencia: confirmación separada]\n''',
      '04-cronograma': '''flowchart LR\n  E[Correo: un instante entre T-72 y T-48] --> W[WhatsApp T-36 si pendiente]\n  W --> C[T-24: cierre bajo política explícita]\n  C --> N[Cancelar, liberar y persistir aviso interno juntos]\n''',
    }
    for name, source in diagrams.items():
        (DETAIL/(name+'.mmd')).write_text(source, encoding='utf-8')


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    model = json.loads(MODEL.read_text(encoding='utf-8'))
    matrix = json.loads(MATRIX.read_text(encoding='utf-8'))
    assert len(matrix['filas']) == 46
    assert len({r['id'] for r in matrix['filas']}) == 46
    assert all(len(r['p']) == 6 for r in matrix['filas'])
    mapping = owners(model)
    text = SOURCE.read_text(encoding='utf-8')
    for number in range(1, 31):
        assert f'## {number:02}.' in text
    # Portada separada del cuerpo y del índice.
    title_style = ParagraphStyle('CoverTitle', fontName='ManualBold', fontSize=34, leading=39, textColor=INK, spaceAfter=25)
    story = [Spacer(1, 68), p('SISTEMA DE GESTIÓN ADMINISTRATIVA DE SALUD', 'SubManual'), Spacer(1, 24),
             Paragraph('Arquitectura<br/>del servidor<br/>Spring', title_style),
             p('Manual de diseño e implementación', 'SubManual'), Spacer(1, 18),
             p('Monolito modular · Datos por entidad · Seguridad · Turnos · Operación'),
             Spacer(1, 26), table([['EDICIÓN', 'BASE DOCUMENTAL', 'ESTADO'], ['1.0 | 20/10/2026', 'R01-R12 · ADR-001..015\n37 casos · 88 entidades', 'Diseño técnico propuesto\nBase existente identificada']], [BW*.24, BW*.40, BW*.36]),
             Spacer(1, 20), p('Punto documental previo: commit 9383b98.\nLas decisiones aceptadas se conservan; los parámetros pendientes requieren resolución antes de habilitar su funcionalidad.', 'SmallManual'),
             PageBreak(), p('Índice de lectura', 'ChapterManual')]
    toc = TableOfContents()
    toc.levelStyles = [ParagraphStyle('TOCManual', fontName='Manual', fontSize=9, leading=13, textColor=INK, leftIndent=0, firstLineIndent=0, rightIndent=25, spaceBefore=0)]
    toc.dotsMinLevel = 0
    story.append(toc)
    start = text.index('## 01.')
    story.extend(parse_md(text[start:]))
    story.extend(appendices(model, matrix, mapping))
    write_diagrams()
    doc = ManualDoc(OUT)
    doc.multiBuild(story)
    reader = PdfReader(OUT)
    pages = [page.extract_text() or '' for page in reader.pages]
    whole = '\n'.join(pages)
    assert all(len(t.strip()) > 100 for t in pages), 'Página vacía o sin contenido significativo'
    normalized = whole.replace('\u200b', '').replace('\u00ad', '')
    missing = [name for name in mapping if name not in normalized]
    assert not missing, f'Entidades ausentes en PDF: {missing}'
    assert all(f'CU-{n:02}' in whole for n in range(1, 38))
    assert all(f'MP-{n:02}' in whole for n in range(1, 47))
    report = {
      'document': str(OUT.relative_to(ROOT)), 'version': '1.0', 'date': '2026-10-20',
      'pages': len(pages), 'chapters': 30, 'entities': len(mapping),
      'owner_counts': dict(Counter(mapping.values())), 'use_cases': 37, 'permission_actions': 46,
      'technical_operations': 5, 'security_controls': 16,
      'vector_diagrams': 4, 'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
      'pdf_sha256': hashlib.sha256(OUT.read_bytes()).hexdigest(),
      'section_pages': doc.section_pages,
      'checks': ['30 capítulos', '88 entidades con dueño único', '37 casos en orden',
                 '46 acciones MP con seis marcas originales', 'Todas las entidades presentes en PDF',
                 'Sin páginas vacías', 'Índice y marcadores generados'],
      'visual_review': 'Pendiente de renderizado e inspección; no acredita pruebas del servidor',
    }
    (DETAIL/'verificacion-manual.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'output':str(OUT), 'pages':len(pages), 'entities':len(mapping), 'use_cases':37, 'permissions':46}, ensure_ascii=True))


if __name__ == '__main__':
    build()
