"""Genera una hoja A4 horizontal de arquitectura desde su resumen versionado.

Requiere reportlab. Ejecutar desde cualquier directorio con:
python scripts/generar-ayuda-memoria.py
"""

import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "arquitectura" / "ayuda-memoria.json"
OUTPUT = ROOT / "output" / "pdf" / "ayuda-memoria-arquitectura-a4.pdf"
FONT_ROOT = Path("C:/Windows/Fonts")
pdfmetrics.registerFont(TTFont("Memo", str(FONT_ROOT / "arial.ttf")))
pdfmetrics.registerFont(TTFont("MemoBold", str(FONT_ROOT / "arialbd.ttf")))

INK = colors.HexColor("#152C40")
MUTED = colors.HexColor("#425365")
ACCENT = colors.HexColor("#126A70")
LINE = colors.HexColor("#B6C3CD")
PALE = colors.HexColor("#F3F6F8")
TEAL_PALE = colors.HexColor("#EDF6F5")
AMBER_PALE = colors.HexColor("#FFF6E8")
WIDTH, HEIGHT = landscape(A4)
MARGIN = 30
BODY_WIDTH = WIDTH - 2 * MARGIN


def paragraph(c, text, x, top, width, max_height, size=10, bold=False, color=INK):
    style = ParagraphStyle(
        "memo", fontName="MemoBold" if bold else "Memo", fontSize=size,
        leading=size * 1.28, textColor=color, alignment=TA_LEFT,
        spaceBefore=0, spaceAfter=0,
    )
    p = Paragraph(escape(text), style)
    _, height = p.wrap(width, max_height)
    if height > max_height + 0.1:
        raise ValueError(f"Texto desborda su caja: {text[:65]} ({height:.1f}>{max_height})")
    p.drawOn(c, x, top - height)
    return height


def panel(c, x, top, width, height, title, body, fill=PALE, size=10):
    c.setFillColor(fill)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.roundRect(x, top - height, width, height, 6, stroke=1, fill=1)
    title_height = paragraph(c, title, x + 12, top - 12, width - 24, 30, size=10, bold=True, color=ACCENT)
    paragraph(c, body, x + 12, top - 19 - title_height, width - 24,
              height - title_height - 31, size=size, color=INK)


def arrow(c, x1, y, x2):
    c.setStrokeColor(ACCENT)
    c.setLineWidth(1.1)
    c.line(x1, y, x2 - 3, y)
    path = c.beginPath()
    path.moveTo(x2 - 5, y + 3)
    path.lineTo(x2, y)
    path.lineTo(x2 - 5, y - 3)
    c.drawPath(path, stroke=1, fill=0)


def build():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=(WIDTH, HEIGHT), pageCompression=1)
    c.setTitle("Ayuda memoria A4 - Arquitectura del turnero SaaS")
    c.setAuthor("Proyecto Sistema de Gestión Administrativa de Salud")
    c.setSubject("Mapa de actores, flujo y reglas R01-R12")

    paragraph(c, data["titulo"], MARGIN, HEIGHT - 27, 660, 30, size=22, bold=True)
    c.setFont("MemoBold", 10)
    c.setFillColor(ACCENT)
    c.drawRightString(WIDTH - MARGIN, HEIGHT - 34, "A4 HORIZONTAL")
    paragraph(c, data["estado"], MARGIN, HEIGHT - 59, BODY_WIDTH, 18, size=10, color=MUTED)
    c.setStrokeColor(LINE)
    c.line(MARGIN, HEIGHT - 82, WIDTH - MARGIN, HEIGHT - 82)

    gap = 12
    col = (BODY_WIDTH - 2 * gap) / 3
    actors_top = HEIGHT - 96
    for i, actor in enumerate(data["actores"]):
        panel(c, MARGIN + i * (col + gap), actors_top, col, 111,
              actor["titulo"], actor["texto"], size=10)

    flow_top = actors_top - 124
    paragraph(c, "RECORRIDO DEL TURNO  [R02, R03, R07, R08]", MARGIN, flow_top,
              BODY_WIDTH, 15, size=10, bold=True, color=ACCENT)
    step_gap = 14
    step_width = (BODY_WIDTH - 4 * step_gap) / 5
    steps_top = flow_top - 24
    for i, step in enumerate(data["pasos"]):
        x = MARGIN + i * (step_width + step_gap)
        panel(c, x, steps_top, step_width, 80, step["titulo"], step["texto"], fill=TEAL_PALE, size=9.3)
        if i < 4:
            arrow(c, x + step_width + 2, steps_top - 43, x + step_width + step_gap - 2)

    capacity_top = steps_top - 92
    paragraph(c, data["capacidad"], MARGIN, capacity_top, BODY_WIDTH, 29,
              size=10, bold=True, color=ACCENT)
    rules_top = capacity_top - 34
    for i, rule in enumerate(data["reglas"]):
        panel(c, MARGIN + i * (col + gap), rules_top, col, 101,
              rule["titulo"], rule["texto"], size=9.8)

    base_top = rules_top - 112
    paragraph(c, data["base"], MARGIN, base_top, BODY_WIDTH, 17, size=9.4, color=MUTED)
    pending_top = base_top - 23
    c.setFillColor(AMBER_PALE)
    c.roundRect(MARGIN, pending_top - 30, BODY_WIDTH, 35, 4, fill=1, stroke=0)
    paragraph(c, data["pendientes"], MARGIN + 9, pending_top, BODY_WIDTH - 18, 28, size=9)

    paragraph(c, data["pregunta"], MARGIN, 49, BODY_WIDTH, 15, size=9.2, bold=True, color=ACCENT)
    paragraph(c, data["uso"], MARGIN, 32, BODY_WIDTH - 150, 24, size=8, color=MUTED)
    c.setFont("Memo", 8)
    c.setFillColor(MUTED)
    c.drawRightString(WIDTH - MARGIN, 23, f"v{data['version']} | {data['fecha']} | 1/1")
    c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
