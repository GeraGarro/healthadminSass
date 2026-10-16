"""Genera SVG, PlantUML, HTML y PDF desde docs/21-casos-de-uso.md.

Requiere ReportLab. Ejecutar: python scripts/generar-casos-de-uso.py
Los diagramas son vectores; su configuración está en este archivo. No usa red.
"""

import html
import re
import textwrap
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.graphics import renderSVG
from reportlab.graphics.shapes import Drawing, Line, Rect, Ellipse, Circle, String, Polygon
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    PageBreak, NextPageTemplate,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/21-casos-de-uso.md"
DIAGRAMS = ROOT / "docs/arquitectura/diagramas/casos-de-uso"
WEB = ROOT / "docs/casos-de-uso/index.html"
PDF = ROOT / "output/pdf/casos-de-uso-salud.pdf"
FONTS = Path("C:/Windows/Fonts")
for name, filename in [("Salud", "arial.ttf"), ("SaludBold", "arialbd.ttf"), ("SaludItalic", "ariali.ttf")]:
    pdfmetrics.registerFont(TTFont(name, str(FONTS / filename)))
pdfmetrics.registerFontFamily("Salud", normal="Salud", bold="SaludBold", italic="SaludItalic", boldItalic="SaludBold")

INK = colors.HexColor("#163347")
TEAL = colors.HexColor("#087e83")
BLUE = colors.HexColor("#eaf4fa")
PALE = colors.HexColor("#f4f7fa")
MUTED = colors.HexColor("#4d6173")
EDGE = colors.HexColor("#8aa2b3")
AMBER = colors.HexColor("#fff3d9")
CASE_TITLES = {}
FIGURES = {}


class Diagram:
    """Small deterministic renderer shared by SVG and PDF outputs."""

    def __init__(self, width, height, title, subtitle):
        self.w, self.h = width, height
        self.title, self.subtitle = title, subtitle
        self.d = Drawing(width, height)
        self.box(0, 0, width, height, fill=colors.white, stroke=colors.white)
        self.text(28, 30, title, 25, bold=True)
        self.text(28, 60, subtitle, 14, color=MUTED)

    def text(self, x, y, text, size=17, bold=False, color=INK, anchor="start", width=None):
        font = "SaludBold" if bold else "Salud"
        lines = []
        for paragraph in str(text).split("\n"):
            if not width:
                lines.append(paragraph)
                continue
            current = ""
            for word in paragraph.split():
                candidate = f"{current} {word}".strip()
                if current and pdfmetrics.stringWidth(candidate, font, size) > width:
                    lines.append(current)
                    current = word
                else:
                    current = candidate
            lines.append(current)
        for i, value in enumerate(lines):
            self.d.add(String(x, self.h-y-i*size*1.25, value, fontName=font, fontSize=size,
                              fillColor=color, textAnchor=anchor))
        return len(lines)*size*1.25

    def box(self, x, y, w, h, fill=PALE, stroke=EDGE, radius=8):
        self.d.add(Rect(x, self.h-y-h, w, h, rx=radius, ry=radius,
                        fillColor=fill, strokeColor=stroke, strokeWidth=1.3))

    def line(self, x1, y1, x2, y2, dashed=False, arrow=False, color=EDGE, open_arrow=False):
        self.d.add(Line(x1, self.h-y1, x2, self.h-y2, strokeColor=color,
                        strokeWidth=1.4, strokeDashArray=[6, 4] if dashed else None))
        if arrow:
            import math
            a = math.atan2(y2-y1, x2-x1)
            pts = []
            for delta in [-0.48, 0.48]:
                pts += [x2-11*math.cos(a+delta), self.h-(y2-11*math.sin(a+delta))]
            if open_arrow:
                self.d.add(Line(pts[0], pts[1], x2, self.h-y2, strokeColor=color, strokeWidth=1.4))
                self.d.add(Line(pts[2], pts[3], x2, self.h-y2, strokeColor=color, strokeWidth=1.4))
            else:
                self.d.add(Polygon([x2, self.h-y2]+pts, fillColor=color, strokeColor=color))

    def actor(self, x, y, label, service=False):
        if service:
            self.box(x-88, y-28, 176, 60, fill=colors.white)
            self.text(x, y-6, "«actor»", 13, color=MUTED, anchor="middle")
            self.text(x, y+15, label, 16, bold=True, anchor="middle", width=165)
        else:
            self.d.add(Circle(x, self.h-y+17, 8, fillColor=colors.white, strokeColor=INK, strokeWidth=1.5))
            for a, b, c, e in [(x,y-9,x,y+17),(x-17,y,x+17,y),(x,y+17,x-14,y+35),(x,y+17,x+14,y+35)]:
                self.line(a,b,c,e,color=INK)
            self.text(x, y+55, label, 14, anchor="middle", width=190)

    def usecase(self, x, y, label, w=450, h=70, fill=BLUE):
        self.d.add(Ellipse(x, self.h-y, w/2, h/2, fillColor=fill, strokeColor=TEAL, strokeWidth=1.5))
        font = 17
        # Wrap first, then center the full label vertically in the ellipse.
        words, lines, current = label.split(), [], ""
        for word in words:
            candidate = f"{current} {word}".strip()
            if current and pdfmetrics.stringWidth(candidate, "Salud", font) > w-72:
                lines.append(current)
                current = word
            else:
                current = candidate
        lines.append(current)
        self.text(x, y-(len(lines)-1)*font*0.625+5, "\n".join(lines), font, anchor="middle")

    def boundary(self, x, y, w, h, label="Sistema de Gestión Administrativa de Salud"):
        self.box(x,y,w,h,fill=colors.white,stroke=EDGE,radius=0)
        self.text(x+15,y+24,label,15,bold=True,color=MUTED)

    def footer(self, text="Diseño documental para revisión. Asociaciones sujetas a facultades vigentes."):
        self.text(28,self.h-20,text,13,color=MUTED)

    def save(self, name):
        FIGURES[name] = self.d
        target=DIAGRAMS / f"{name}.svg"
        renderSVG.drawToFile(self.d, str(target))
        svg=target.read_text(encoding="utf-8")
        # SVG references browser fonts, whereas the PDF uses registered embedded fonts.
        svg=svg.replace("font-family: SaludBold;", "font-family: Arial, sans-serif; font-weight: 700;")
        svg=svg.replace("font-family: Salud;", "font-family: Arial, sans-serif;")
        svg=svg.replace("<title>...</title>",f"<title>{escape(self.title)}</title>")
        svg=svg.replace("<desc>...</desc>",f"<desc>{escape(self.subtitle)}</desc>")
        # ReportLab closes two-point Line paths, repainting their dash gaps in reverse.
        # Leave real polygons closed and make each two-point line an open path.
        def open_line(match):
            return match[1]+'"' if match[1].count(" L ")==1 else match[0]
        svg=re.sub(r'(<path d="M [^"\n]+) Z"',open_line,svg)
        target.write_text(svg,encoding="utf-8")


def puml_header(title):
    return ["@startuml", "left to right direction", "skinparam backgroundColor white",
            "skinparam shadowing false", "skinparam defaultFontName Arial", f"title {title}"]


def overview():
    d = Diagram(1150, 885, "01 | Mapa de actores y objetivos", "Vista resumida; los identificadores CU del catálogo dan el alcance completo.")
    d.boundary(250,95,650,735)
    rows = [
        (175,"Obtener acceso habilitado","Paciente / representante","Google / correo"),
        (285,"Preparar oferta de atención","Profesional / personal facultado",None),
        (395,"Obtener y gestionar un turno","Paciente / personal facultado",None),
        (505,"Consultar al profesional por chat","Paciente / representante","Profesional"),
        (615,"Gestionar continuidad profesional","Profesional / administración","Plataforma"),
        (725,"Operar beta y recuperar servicio","Plataforma / operador","Respaldo externo"),
    ]
    lines = puml_header("Mapa resumido de objetivos")
    lines += ['rectangle "Sistema de Gestión Administrativa de Salud" {']
    for i,(y,label,left,right) in enumerate(rows):
        lines.append(f'  usecase "{label}" as G{i}')
    lines.append("}")
    for i,(y,label,left,right) in enumerate(rows):
        d.actor(120,y-18,left)
        d.line(143,y,350,y)
        d.usecase(575,y,label)
        lines += [f'actor "{left}" as A{i}',f'A{i} -- G{i}']
        if right:
            service = i in (0,5)
            d.actor(1030,y-18,right,service=service)
            d.line(800,y,935,y)
            stereotype = " <<servicio externo>>" if service else ""
            lines += [f'actor "{right}" as E{i}{stereotype}', f'G{i} -- E{i}']
    d.footer("Mapa de agrupación: rótulos con / reúnen actores; no representan un rol con permisos acumulados.")
    lines += ['note as Alcance', 'Agrupación de actores y objetivos;', 'no es una matriz de permisos.', 'end note', "@enduml"]
    d.save("01-mapa-general")
    (DIAGRAMS / "01-mapa-general.puml").write_text("\n".join(lines)+"\n",encoding="utf-8")


def access_diagram():
    d = Diagram(1150, 935, "02 | Acceso, admisión y delegación", "Actores repetidos por fila para evitar cruces. Cada asociación exige su facultad específica.")
    d.boundary(265,90,625,785)
    rows = [
        (170,1,"Solicitante",None), (280,2,"Personal con facultad de admisión",None),
        (390,3,"Paciente o representante","Correo / identidad"),
        (500,4,"Usuario con contexto vigente","Identidad externa"),
        (610,5,"Equipo / administradores","Correo"),
        (720,8,"Profesional otorgante",None),
        (830,35,"Solicitante de entidad","Plataforma revisora"),
    ]
    puml = puml_header("Acceso y admisión")
    puml += ['rectangle "Sistema de Gestión Administrativa de Salud" {']
    for _,n,_,_ in rows:
        puml.append(f' usecase "CU-{n:02d}\\n{CASE_TITLES[n]}" as C{n}')
    puml.append("}")
    for i,(y,n,left,right) in enumerate(rows):
        label=f"CU-{n:02d} | {CASE_TITLES[n]}"
        d.actor(125,y-20,left)
        d.line(148,y,350,y)
        d.usecase(575,y,label,fill=AMBER if n==35 else BLUE)
        puml += [f'actor "{left}" as A{i}',f'A{i} -- C{n}']
        if right:
            service = n!=35
            d.actor(1030,y-20,right,service=service)
            d.line(800,y,935,y)
            stereotype = " <<servicio externo>>" if service else ""
            puml += [f'actor "{right}" as E{i}{stereotype}',f'C{n} -- E{i}']
    d.footer("CU-35 (ámbar) es propuesto y no aprobado. Paciente y representante conservan ámbitos distintos.")
    puml += ['note bottom of C35 : Propuesto; no aprobado. Sin permisos por enviar formulario.',"@enduml"]
    d.save("02-acceso")
    (DIAGRAMS / "02-acceso.puml").write_text("\n".join(puml)+"\n",encoding="utf-8")


def booking_diagram():
    d=Diagram(1190,790,"03 | Reserva: objetivos y subfunciones","UML: <<include>> indica comportamiento obligatorio; las flechas no indican secuencia temporal.")
    d.boundary(280,95,880,610)
    d.actor(100,210,"Paciente habilitado")
    d.actor(100,340,"Representante verificado")
    d.actor(100,475,"Profesional autorizado")
    d.actor(100,605,"Secretaría delegada")
    d.usecase(535,280,"CU-14 | Reservar Consulta por portal",w=420,h=110)
    d.usecase(535,560,"CU-15 | Registrar turno desde personal",w=420,h=110)
    d.usecase(975,280,"CU-36 | Adquirir pre-reserva",w=300,h=110)
    d.usecase(975,560,"CU-37 | Completar registro de turno",w=300,h=110)
    d.line(125,230,330,260)
    d.line(125,360,330,305)
    d.line(125,495,330,540)
    d.line(125,625,330,585)
    for x1,y1,x2,y2,lx,ly in [
        (745,280,825,280,770,263),(745,560,825,560,770,543),
        (675,325,860,515,792,390),(675,515,860,325,792,465),
    ]:
        d.line(x1,y1,x2,y2,dashed=True,arrow=True,open_arrow=True,color=TEAL)
        d.text(lx,ly,"«include»",14,color=TEAL,anchor="middle")
    d.box(320,125,800,65,fill=PALE)
    d.text(340,150,"Siempre: autorización, práctica, elegibilidad, cuota y exclusión global.",16)
    d.text(340,173,"Solo la práctica base Consulta habilitada admite autoselección.",16)
    d.footer("CU-36 ocupa capacidad; CU-37 la conserva. Asistencia pendiente al registrar. Errores: ver fichas.")
    d.save("03-turnos")
    puml=puml_header("Reserva de turnos")+[
        'actor "Paciente habilitado" as Paciente', 'actor "Representante verificado" as Representante',
        'actor "Profesional autorizado" as Profesional','actor "Secretaría delegada" as Secretaria',
        'rectangle "Sistema de Gestión Administrativa de Salud" {',
    ]
    for n in [14,15,36,37]:
        puml.append(f' usecase "CU-{n:02d}\\n{CASE_TITLES[n]}" as C{n}')
    puml += ["}","Paciente -- C14","Representante -- C14","Profesional -- C15","Secretaria -- C15",
             'C14 ..> C36 : <<include>>','C14 ..> C37 : <<include>>',
             'C15 ..> C36 : <<include>>','C15 ..> C37 : <<include>>',
             'note as Restricciones',
             'Solo Consulta base habilitada permite selección por paciente.',
             'Autorización y auditoría son restricciones transversales.',
             'end note', "@enduml"]
    (DIAGRAMS/"03-turnos.puml").write_text("\n".join(puml)+"\n",encoding="utf-8")


def operations_diagram():
    d=Diagram(1150,815,"04 | Comunicaciones y operación","Las tareas temporales son internas; los destinatarios y proveedores son participantes externos.")
    d.boundary(265,95,625,650)
    rows=[
        (190,21,"Profesional / personal facultado","WhatsApp"),
        (305,23,"Paciente o representante","Profesional"),
        (420,24,"Destinatario autorizado","Correo / WhatsApp"),
        (535,25,"Secretaría / profesional",None),
        (650,26,"Personal facultado","Servicios de canal"),
    ]
    puml=puml_header("Comunicaciones y operación")+['rectangle "Sistema de Gestión Administrativa de Salud" {']
    for _,n,_,_ in rows:
        puml.append(f' usecase "CU-{n:02d}\\n{CASE_TITLES[n]}" as C{n}')
    puml.append("}")
    for i,(y,n,left,right) in enumerate(rows):
        d.actor(125,y-20,left)
        d.line(148,y,350,y)
        d.usecase(575,y,f"CU-{n:02d} | {CASE_TITLES[n]}")
        puml += [f'actor "{left}" as A{i}',f'A{i} -- C{n}']
        if right:
            service=n!=23
            d.actor(1030,y-20,right,service=service)
            d.line(800,y,935,y)
            stereotype = " <<servicio externo>>" if service else ""
            puml += [f'actor "{right}" as E{i}{stereotype}',f'C{n} -- E{i}']
    d.text(300,715,"CU-24: tarea interna por plazo. CU-25: cierre interno T-24.",15,color=MUTED)
    d.footer("CU-21 avisa por WhatsApp a todos los afectados, incluidos confirmados, sin esperar T-36.")
    puml += ['note bottom of C24 : Disparador interno por plazo; sin actor reloj.',
             'note bottom of C25 : Cierre T-24 sin confirmación y sin excepción aplicable.',"@enduml"]
    d.save("04-operacion")
    (DIAGRAMS/"04-operacion.puml").write_text("\n".join(puml)+"\n",encoding="utf-8")


def activity_diagram():
    d=Diagram(1140,830,"05 | Actividad de reserva por práctica","Recorrido resumido de CU-13 a CU-16 y CU-36 a CU-37; detalle y excepciones en las fichas.")
    def step(x,y,w,h,label,fill=BLUE):
        d.box(x,y,w,h,fill=fill,stroke=TEAL)
        d.text(x+w/2,y+24,label,17,anchor="middle",width=w-25)
    step(380,100,400,65,"Identificar actor, paciente, entidad y permisos")
    d.line(580,165,580,178,arrow=True)
    d.d.add(Polygon([580,d.h-178,745,d.h-215,580,d.h-252,415,d.h-215],fillColor=AMBER,strokeColor=TEAL))
    d.text(580,220,"¿Opera personal autorizado?",16,anchor="middle")
    d.line(745,215,1040,215)
    d.text(865,202,"Sí",14,anchor="middle")
    d.line(1040,215,1040,377)
    d.line(1040,377,1010,377,arrow=True)
    d.line(580,252,580,266,arrow=True)
    d.text(610,263,"No",13)
    d.d.add(Polygon([580,d.h-266,745,d.h-303,580,d.h-340,415,d.h-303],fillColor=AMBER,strokeColor=TEAL))
    d.text(580,308,"¿Consulta base elegible?",16,anchor="middle")
    d.line(415,303,205,303)
    d.text(320,290,"No: otra práctica",14,anchor="middle")
    step(40,335,330,90,"CU-16: solicitar gestión sin ocupar capacidad")
    d.line(205,303,205,335,arrow=True)
    step(40,445,330,95,"CU-15: personal con facultad selecciona oferta y horario")
    d.line(205,425,205,445,arrow=True)
    d.line(580,340,580,350,arrow=True)
    d.text(605,347,"Sí",13)
    step(400,350,610,65,"CU-13: calcular elegibilidad y disponibilidad; aún no ocupa")
    d.line(205,540,205,568)
    d.line(205,568,385,568)
    d.line(385,568,385,385)
    d.line(385,385,400,385,arrow=True)
    step(400,445,610,70,"CU-36: validar cuota y adquirir pre-reserva; ya ocupa")
    d.line(705,415,705,445,arrow=True)
    step(400,550,610,70,"CU-37: revalidar y registrar; conservar ocupación")
    d.line(705,515,705,550,arrow=True)
    step(400,655,610,70,"Turno registrado; asistencia pendiente. CU-18 confirma después")
    d.line(705,620,705,655,arrow=True)
    d.text(45,665,"Conflicto, cuota o vencimiento:\nsin éxito aparente ni desplazamiento\nde una ocupación válida posterior.",16,color=MUTED)
    d.footer("El mensaje no reserva. Registrar no confirma. El servidor calcula duración, pausas y condiciones.")
    d.save("05-actividad-reserva")
    (DIAGRAMS/"05-actividad-reserva.puml").write_text(textwrap.dedent('''\
        @startuml
        title Reserva por práctica
        start
        :Identificar actor, paciente, entidad y permisos;
        if (Paciente solicita elegir horario?) then (sí)
          if (Consulta base habilitada y elegible?) then (sí)
            :CU-14: autogestión permitida;
          else (no)
            :CU-16: solicitar gestión; no ocupa;
            :CU-15: personal facultado selecciona oferta y horario;
          endif
        else (personal)
          :CU-15: validar facultad de agenda;
        endif
        :CU-13: consultar disponibilidad; no ocupa;
        :CU-36: revalidar y adquirir pre-reserva;
        if (Capacidad y cuota adquiridas?) then (sí)
          :CU-37: completar y revalidar;
          if (Pre-reserva y condiciones válidas?) then (sí)
            :Registrar conservando ocupación;
            :Asistencia pendiente; CU-18 confirma después;
          else (no)
            :Resolver vencimiento/cambio sin desplazar ocupación ajena;
          endif
        else (no)
          :Informar conflicto o límite sin datos ajenos;
        endif
        stop
        @enduml
        '''),encoding="utf-8")


def sequence_diagram():
    d=Diagram(1180,850,"06 | Secuencia de pre-reserva y registro","Dirección de diseño propuesta. No constituye contrato API, SQL ni protocolo de locks aprobado.")
    xs=[105,345,600,865,1070]
    for x,label in zip(xs,["Actor autorizado","API / permisos","Prácticas / convenio","Capacidad global","Persistencia"]):
        d.box(x-95,105,190,62,fill=BLUE)
        d.text(x,130,label,16,bold=True,anchor="middle",width=175)
        d.line(x,167,x,770,dashed=True)
    steps=[
        (0,1,215,"1. Pedir pre-reserva"),(1,2,275,"2. Validar práctica / elegibilidad"),
        (1,3,345,"3. Validar cuota + adquirir intervalo"),(3,4,405,"4. Excluir solapamiento"),
        (4,0,475,"5. Pre-reserva con vencimiento o conflicto sin datos ajenos"),
        (0,1,555,"6. Completar pedido"),(1,4,625,"7. Revalidar; convertir ocupación; turno + tareas + auditoría"),
        (4,0,715,"8. Turno registrado; asistencia pendiente"),
    ]
    for a,b,y,label in steps:
        d.line(xs[a],y,xs[b],y,arrow=True,color=TEAL)
        d.text((xs[a]+xs[b])/2,y-31,label,15,anchor="middle",width=abs(xs[b]-xs[a])+10)
    d.footer("Dos entidades incompatibles: una sola adquisición. No mantener transacción abierta entre 5 y 6.")
    d.save("06-secuencia-reserva")
    (DIAGRAMS/"06-secuencia-reserva.puml").write_text(textwrap.dedent('''\
        @startuml
        title Pre-reserva y registro - diseño propuesto
        actor "Actor autorizado" as A
        participant "API / permisos" as API
        participant "Prácticas / convenio" as P
        participant "Capacidad global" as C
        database "Persistencia" as DB
        A -> API : Pre-reservar agenda, práctica e intervalo
        API -> API : Validar identidad, admisión y facultades
        API -> P : Validar práctica, tiempos y elegibilidad
        API -> C : Validar cuota y adquirir intervalo consistentemente
        C -> DB : Resolver vencidas y excluir solapamientos
        alt Capacidad y cuota adquiridas
          DB --> A : Pre-reserva y vencimiento
          note over A,DB : Sin transacción abierta mientras completa datos
          A -> API : Completar pedido de pre-reserva
          API -> API : Revalidar facultades, práctica, cuota y elegibilidad
          API -> DB : Convertir ocupación + turno + tareas + auditoría
          DB --> A : Turno registrado; asistencia pendiente
        else Conflicto o límite
          DB --> A : Resultado sin datos ajenos; no ocupa
        end
        note over API,DB : Protocolo concreto, TTL y restricciones por diseñar
        @enduml
        '''),encoding="utf-8")


def notices_diagram():
    d=Diagram(1140,790,"07 | Avisos: dos disparadores diferentes","Cronograma confirmado en ADR-004 y evento profesional confirmado en ADR-013.")
    d.box(35,100,1070,285,fill=PALE)
    d.text(60,132,"A. Confirmación de asistencia | CU-18, CU-24 y CU-25",21,bold=True)
    d.line(125,205,1020,205,arrow=True,color=TEAL)
    for x,label,desc in [
        (140,"T-72 / T-48","Un correo dentro\nde la ventana"),
        (450,"T-36","WhatsApp solo\nsi sigue pendiente"),
        (750,"T-24","Sin confirmar y sin excepción:\ncancelar, liberar y aviso interno"),
        (1000,"T","Inicio vigente\ndel turno"),
    ]:
        d.d.add(Circle(x,d.h-205,6,fillColor=TEAL,strokeColor=TEAL))
        d.text(x,184,label,18,bold=True,anchor="middle")
        d.text(x,248,desc,15,anchor="middle",width=265)
    d.text(60,345,"Confirmar es explícito. Leer, abrir el enlace o ingresar al portal no confirma.",17,color=MUTED)
    d.box(35,420,1070,255,fill=BLUE)
    d.text(60,455,"B. Reprogramación por motivos del profesional | CU-21",21,bold=True)
    d.text(65,505,"Fecha o intervalos\nafectados",19,bold=True,width=220)
    d.line(280,520,355,520,arrow=True,color=TEAL)
    d.text(385,505,"WhatsApp a TODOS\nlos afectados",19,bold=True,width=290)
    d.line(665,520,740,520,arrow=True,color=TEAL)
    d.text(770,505,"Portal o gestión\nasistida",19,bold=True,width=265)
    d.text(65,603,"Incluye confirmados y no espera T-36. Entrega y reemplazo se siguen por separado.",17)
    d.text(65,635,"Solo Consulta base habilitada permite elegir el nuevo horario al paciente.",17)
    d.footer("Pendiente: turnos cercanos, excepción técnica/asistida, instante de correo, carrera T-24 y detalle del lote.")
    d.save("07-avisos")
    (DIAGRAMS/"07-avisos.puml").write_text(textwrap.dedent('''\
        @startuml
        title Avisos con disparadores distintos
        start
        if (Tipo de evento?) then (cronograma)
          :Revalidar turno vigente y política aplicable;
          :Un correo entre T-72 y T-48;
          if (Sigue pendiente a T-36?) then (sí)
            :WhatsApp de respaldo;
          endif
          if (Sigue pendiente a T-24 sin excepción aplicable?) then (sí)
            :Cancelar + liberar + auditoría + aviso interno consistente;
          endif
        else (reprogramación del profesional)
          :Determinar fecha / intervalos y afectados autorizados;
          :WhatsApp individual a todos, incluidos confirmados;
          :Enlace al portal; Consulta base o gestión asistida;
          :Seguir entrega y reemplazo como hechos diferentes;
        endif
        :Leer, abrir o responder libremente no confirma ni reprograma;
        stop
        @enduml
        '''),encoding="utf-8")


def blocks(text):
    """Parse only the Markdown subset used by the source, without external assets."""
    lines=text.splitlines()
    result=[]
    i=0
    while i<len(lines):
        line=lines[i].strip()
        if not line:
            i+=1
            continue
        m=re.match(r"^(#{1,3}) (.+)$",line)
        if m:
            result.append(("h"+str(len(m[1])),m[2])); i+=1; continue
        m=re.match(r"^!\[([^]]*)\]\(([^)]+)\)$",line)
        if m:
            result.append(("image",(m[1],m[2]))); i+=1; continue
        if line.startswith("| "):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith("|"):
                raw=lines[i].strip()
                if not re.match(r"^\|[\s:|\-]+\|$",raw):
                    rows.append([cell.strip() for cell in raw.strip("|").split("|")])
                i+=1
            result.append(("table",rows)); continue
        m=re.match(r"^(?:- |(\d+)\. )(.+)$",line)
        if m:
            result.append(("li",(m[1] or "•",m[2]))); i+=1; continue
        para=[line]; i+=1
        while i<len(lines) and lines[i].strip() and not re.match(r"^(#{1,3} |\| |!\[|- |\d+\. )",lines[i].strip()):
            para.append(lines[i].strip()); i+=1
        result.append(("p"," ".join(para)))
    return result


def anchor(text):
    return re.sub(r"[^\w\s-]","",text.lower()).replace(" ","-")


def inline(value,pdf=False):
    s=escape(value)
    if pdf:
        s=re.sub(r"\[([^]]+)\]\(([^)]+)\)",r"\1",s)
    else:
        def link(m):
            target=m[2]
            if not target.startswith(("https://","http://","#")):
                # HTML lives one directory below the Markdown source.
                target="../"+target
            return f'<a href="{html.escape(target,quote=True)}">{m[1]}</a>'
        s=re.sub(r"\[([^]]+)\]\(([^)]+)\)",link,s)
    s=re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>" if pdf else r"<strong>\1</strong>", s)
    s=re.sub(r"`([^`]+)`",r"<font face='Salud'>\1</font>" if pdf else r"<code>\1</code>",s)
    return s


def render_html_table(rows):
    """Construye una tabla semántica con encabezados de columna e indentación."""
    lines = ['<div class="table-wrap">', '  <table>', '    <thead>', '      <tr>']
    for cell in rows[0]:
        lines.append(f'        <th scope="col">{inline(cell)}</th>')
    lines.extend(['      </tr>', '    </thead>', '    <tbody>'])
    for row in rows[1:]:
        lines.append('      <tr>')
        for cell in row:
            lines.append(f'        <td>{inline(cell)}</td>')
        lines.append('      </tr>')
    lines.extend(['    </tbody>', '  </table>', '</div>'])
    return lines


def render_html_figure(alt, path):
    """Relaciona cada vista SVG con sus fuentes individuales PlantUML y draw.io."""
    image_path = "../" + path
    base_path = image_path.removesuffix(".svg")
    safe_image = html.escape(image_path, quote=True)
    safe_alt = html.escape(alt, quote=True)
    return [
        '<figure>',
        f'  <img src="{safe_image}" alt="{safe_alt}">',
        '  <figcaption>',
        f'    <span>{html.escape(alt)}</span>',
        '    <div class="diagram-sources" aria-label="Fuentes editables del diagrama">',
        f'      <a href="{html.escape(base_path, quote=True)}.drawio" download>Descargar editable draw.io</a>',
        f'      <a href="{html.escape(base_path, quote=True)}.puml" download>Descargar fuente PlantUML</a>',
        f'      <a href="{safe_image}" download>Descargar SVG</a>',
        '    </div>',
        '  </figcaption>',
        '</figure>',
    ]


def make_html(parsed):
    """Rellena la plantilla legible; CSS y JS se mantienen como fuentes separadas."""
    navigation = []
    content = []
    case_open = False
    list_kind = None

    def emit(line, extra_indent=0):
        """Indenta cada elemento según su pertenencia a una ficha o bloque general."""
        indentation = 8 if case_open else 6
        content.append(" " * (indentation + extra_indent) + line)

    for kind, value in parsed:
        if kind != "li" and list_kind:
            emit(f"</{list_kind}>")
            list_kind = None

        if kind.startswith("h"):
            if case_open:
                case_open = False
                emit("</section>")

            ident = anchor(value)
            content.append("")
            if kind == "h3" and value.startswith("CU-"):
                css_class = "case proposed" if value.startswith("CU-35.") else "case"
                emit(f"<!-- {html.escape(value)} -->")
                emit(f'<section class="{css_class}" aria-labelledby="{ident}">')
                case_open = True
            emit(f'<{kind} id="{ident}">{inline(value)}</{kind}>')

            if kind == "h2" or (kind == "h3" and value.startswith("CU-")):
                css_class = ' class="section"' if kind == "h2" else ""
                navigation.append(
                    f'        <li><a{css_class} href="#{ident}">{html.escape(value)}</a></li>'
                )
        elif kind == "p":
            content.append("")
            emit(f"<p>{inline(value)}</p>")
        elif kind == "li":
            number, text = value
            needed = "ul" if number == "•" else "ol"
            if needed != list_kind:
                if list_kind:
                    emit(f"</{list_kind}>")
                content.append("")
                emit(f"<{needed}>")
                list_kind = needed
            emit(f"<li>{inline(text)}</li>", extra_indent=2)
        elif kind == "table":
            content.append("")
            for line in render_html_table(value):
                emit(line)
        elif kind == "image":
            content.append("")
            for line in render_html_figure(*value):
                emit(line)

    if list_kind:
        emit(f"</{list_kind}>")
    if case_open:
        case_open = False
        emit("</section>")

    template = (WEB.parent / "plantilla.html").read_text(encoding="utf-8")
    output = template.replace("{{NAVEGACION}}", "\n".join(navigation))
    output = output.replace("{{CONTENIDO}}", "\n".join(content).lstrip("\n"))
    WEB.write_text(output, encoding="utf-8")


def make_pdf(parsed):
    body=ParagraphStyle("BodySalud",fontName="Salud",fontSize=10.2,leading=14.3,textColor=INK,spaceAfter=8)
    small=ParagraphStyle("SmallSalud",parent=body,fontSize=8,leading=10.2,spaceAfter=0)
    headcell=ParagraphStyle("HeadCellSalud",parent=small,fontName="SaludBold",textColor=colors.white)
    headings={
        "h1":ParagraphStyle("TitleSalud",parent=body,fontName="SaludBold",fontSize=29,leading=34,spaceAfter=20),
        "h2":ParagraphStyle("SectionSalud",parent=body,fontName="SaludBold",fontSize=18,leading=23,spaceBefore=14,spaceAfter=12,keepWithNext=True),
        "h3":ParagraphStyle("CaseSalud",parent=body,fontName="SaludBold",fontSize=14,leading=18,spaceBefore=12,spaceAfter=12,textColor=TEAL,keepWithNext=True),
    }
    li_style=ParagraphStyle("ListSalud",parent=body,leftIndent=16,firstLineIndent=-13,spaceAfter=5)
    class Doc(BaseDocTemplate):
        def afterFlowable(self,flowable):
            if hasattr(flowable,"toc_text"):
                self.canv.bookmarkPage(flowable.toc_key)
                self.canv.addOutlineEntry(flowable.toc_text,flowable.toc_key,level=flowable.toc_level,closed=False)
                if flowable.toc_level<2:
                    self.notify("TOCEntry",(flowable.toc_level,flowable.toc_text,self.page,flowable.toc_key))
    doc=Doc(str(PDF),pagesize=A4,leftMargin=43,rightMargin=43,topMargin=52,bottomMargin=45,
            title="Casos de uso - Sistema de Gestión Administrativa de Salud",author="Documentación del proyecto")
    portrait=A4; wide=landscape(A4)
    def chrome(canvas,document):
        w,h=canvas._pagesize
        canvas.setStrokeColor(colors.HexColor("#d5e2e9"));canvas.line(43,h-34,w-43,h-34)
        canvas.setFont("SaludBold",8);canvas.setFillColor(TEAL)
        canvas.drawString(43,h-25,"GESTIÓN ADMINISTRATIVA DE SALUD | CASOS DE USO")
        canvas.setFont("Salud",7.5);canvas.setFillColor(MUTED)
        canvas.drawString(43,27,"16/10/2026 · v1.0 · Especificación para revisión · Sin implementación")
        canvas.drawRightString(w-43,27,str(document.page))
    doc.addPageTemplates([
        PageTemplate(id="normal",pagesize=portrait,frames=[Frame(43,45,portrait[0]-86,portrait[1]-97,id="body",leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=chrome),
        PageTemplate(id="diagram",pagesize=wide,frames=[Frame(36,45,wide[0]-72,wide[1]-96,id="figure",leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=chrome),
    ])
    story=[]
    toc=TableOfContents()
    toc.levelStyles=[ParagraphStyle("TocSection",parent=body,fontName="SaludBold",fontSize=9,leading=14,spaceBefore=6),ParagraphStyle("TocCase",parent=body,fontSize=8,leading=11,leftIndent=12)]
    story.append(Paragraph("Casos de uso",headings["h1"]))
    story.append(Paragraph("Sistema de Gestión Administrativa de Salud",headings["h2"]))
    story.append(Spacer(1,18))
    story.append(Paragraph("37 fichas | 7 diagramas | 16 escenarios integrales",headings["h3"]))
    for text in ["Incremento 1 · Dominio y requisitos · Versión documental 1.0 · 16 de octubre de 2026",
                 "Objetivos, actores, condiciones, flujos principales, alternativas, garantías y criterios observables para revisar la futura aplicación.",
                 "Base: reglas R01-R12, seguridad S01-S16 y decisiones ADR-001 a ADR-013. Se conservan los pendientes D01-D16 y el alcance administrativo de beta.",
                 "Las fichas y recorridos detallados son especificaciones para revisión. CU-35 es una propuesta no aprobada. No hay aplicación, integraciones ni pruebas de producto ejecutadas por esta entrega.",
                 "Las fuentes editables y los enlaces locales están en docs/21-casos-de-uso.md; navegación en docs/casos-de-uso/index.html; diagramas en docs/arquitectura/diagramas/casos-de-uso/."]:
        story.append(Paragraph(inline(text,True),body));story.append(Spacer(1,9))
    story.append(PageBreak())
    story.append(Paragraph("Índice de secciones y casos",headings["h2"]))
    story.append(toc);story.append(PageBreak())
    # Put each diagram and its explanation together, without title-only or blank pages.
    compact=[]
    i=0
    while i<len(parsed):
        kind,value=parsed[i]
        if kind=="h2" and value.startswith("4. Diagramas"):
            first=True
            i+=1
            while i<len(parsed) and not (parsed[i][0]=="h3" and parsed[i][1].startswith("4.6")):
                if parsed[i][0]=="image":
                    image=parsed[i][1]
                    captions=[]
                    j=i+1
                    while j<len(parsed) and parsed[j][0]=="p":
                        captions.append(parsed[j][1]);j+=1
                    compact.append(("figure",(image,captions,first)))
                    first=False;i=j
                else:i+=1
            continue
        # Cover already carries source metadata.
        if kind=="p" and value.startswith("Versión documental:"):
            i+=1;continue
        compact.append((kind,value));i+=1
    diagram_mode=False
    for kind,value in compact:
        if kind=="h1":continue
        if kind=="figure":
            (alt,path),captions,first=value
            drawing=FIGURES[Path(path).stem]
            story += [NextPageTemplate("diagram"),PageBreak()]
            if first:
                p=Paragraph("4. Diagramas y catálogo",headings["h2"])
                p.toc_text="4. Diagramas y catálogo";p.toc_key=anchor(p.toc_text);p.toc_level=0
                story.append(p)
            reserved=40 if first else 0
            caption_height=sum(Paragraph(inline(c,True),small).wrap(wide[0]-78,500)[1]+6 for c in captions)
            factor=min((wide[0]-78)/drawing.width,(wide[1]-105-reserved-caption_height)/drawing.height)
            # A fresh drawing wrapper avoids mutation across multiBuild passes.
            from reportlab.graphics.shapes import Group
            wrapped=Drawing(drawing.width*factor,drawing.height*factor)
            group=Group(drawing)
            group.scale(factor,factor)
            wrapped.add(group)
            story.append(wrapped)
            for caption in captions:
                story.append(Paragraph(inline(caption,True),small));story.append(Spacer(1,6))
            diagram_mode=True
            continue
        if diagram_mode:
            story += [NextPageTemplate("normal"),PageBreak()]
            diagram_mode=False
        if kind.startswith("h"):
            is_case=kind=="h3" and value.startswith("CU-")
            if kind=="h2":
                # Do not create empty pages after a dedicated diagram page.
                if story and not isinstance(story[-1],PageBreak):story.append(PageBreak())
            elif is_case:
                last_is_section=bool(story and isinstance(story[-1],Paragraph) and getattr(story[-1],"toc_level",None)==0)
                if story and not isinstance(story[-1],PageBreak) and not last_is_section:story.append(PageBreak())
            p=Paragraph(inline(value,True),headings[kind])
            if kind=="h2" or is_case:
                p.toc_text=value;p.toc_key=anchor(value);p.toc_level=0 if kind=="h2" else 1
            story.append(p)
        elif kind=="p":story.append(Paragraph(inline(value,True),body))
        elif kind=="li":
            n,text=value
            prefix="•" if n=="•" else n+"."
            story.append(Paragraph(escape(prefix)+" "+inline(text,True),li_style))
        elif kind=="table":
            rows=value
            count=len(rows[0]); width=portrait[0]-86
            if count==4:
                ratios=[.12,.28,.27,.33] if rows[0][0]=="Caso" else [.12,.34,.24,.30]
            elif count==3:ratios=[.18,.43,.39]
            elif count==2:ratios=[.32,.68]
            else:ratios=[1/count]*count
            widths=[width*r for r in ratios]
            cells=[[Paragraph(inline(cell,True),headcell if r==0 else small) for cell in row] for r,row in enumerate(rows)]
            table=Table(cells,colWidths=widths,repeatRows=1,hAlign="LEFT")
            table.setStyle(TableStyle([
                ("BACKGROUND",(0,0),(-1,0),INK),("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,PALE]),
                ("VALIGN",(0,0),(-1,-1),"TOP"),("BOX",(0,0),(-1,-1),.5,EDGE),
                ("INNERGRID",(0,0),(-1,-1),.3,colors.HexColor("#d3e0e7")),
                ("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),
                ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
            ]))
            story.extend([table,Spacer(1,10)])
    PDF.parent.mkdir(parents=True,exist_ok=True)
    doc.multiBuild(story)


def validate_source(text):
    case_heads=re.findall(r"^### CU-(\d+)\. (.+)$",text,re.M)
    ids=[int(n) for n,_ in case_heads]
    if ids!=list(range(1,38)):
        raise ValueError(f"Identificadores CU inesperados: {ids}")
    CASE_TITLES.update({int(n):title for n,title in case_heads})
    case_parts=re.split(r"^### CU-\d+\. .+$",text,flags=re.M)[1:]
    required=["**Nivel y estado:","**Precondiciones:","**Flujo principal", "**Alternativas:","**Resultado y garantía mínima:","**Aceptación", "**Pendientes:"]
    for n,part in enumerate(case_parts,1):
        for field in required:
            if field not in part:raise ValueError(f"CU-{n:02d} sin {field}")
    for n in range(1,17):
        if f"EI-{n:02d}" not in text:raise ValueError(f"Falta EI-{n:02d}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--solo-web", action="store_true",
        help="Regenera solo el HTML desde su plantilla, sin tocar PDF ni diagramas.",
    )
    args = parser.parse_args()
    text = SOURCE.read_text(encoding="utf-8")
    validate_source(text)
    parsed = blocks(text)

    if not args.solo_web:
        DIAGRAMS.mkdir(parents=True, exist_ok=True)
        overview()
        access_diagram()
        booking_diagram()
        operations_diagram()
        activity_diagram()
        sequence_diagram()
        notices_diagram()
        make_pdf(parsed)
        print(f"Generado: {PDF.relative_to(ROOT)}")

    make_html(parsed)
    print(f"Generado: {WEB.relative_to(ROOT)}")
    print("CSS y JS se mantienen en archivos independientes, sin sobrescribirlos.")


if __name__ == "__main__":
    main()
