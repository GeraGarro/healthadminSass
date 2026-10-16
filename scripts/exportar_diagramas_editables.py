"""Exporta los siete SVG locales a diagramas draw.io con elementos nativos.

Uso: python scripts/exportar_diagramas_editables.py
Conserva editables existentes; --sobrescribir permite regenerarlos expresamente.
No incrusta capturas, no usa red y no modifica SVG, PlantUML ni PDF.
"""

import argparse
import math
import re
import xml.etree.ElementTree as ET
from pathlib import Path

from reportlab.pdfbase.pdfmetrics import stringWidth


ROOT = Path(__file__).resolve().parents[1]
DIAGRAMS = ROOT / "docs/arquitectura/diagramas/casos-de-uso"
SVG_NS = "{http://www.w3.org/2000/svg}"


def read_style(element):
    """Lee las propiedades CSS de los SVG vectoriales generados en el proyecto."""
    properties = {}
    for declaration in element.get("style", "").split(";"):
        if ":" in declaration:
            name, value = declaration.split(":", 1)
            properties[name.strip()] = value.strip()
    return properties


def color(value):
    """Convierte colores RGB porcentuales del SVG a hexadecimal de draw.io."""
    if not value or value == "none":
        return "none"
    if value.startswith("#"):
        return value
    match = re.fullmatch(r"rgb\(([^)]+)\)", value)
    if not match:
        raise ValueError(f"Color SVG no previsto: {value}")
    channels = []
    for part in match[1].split(","):
        part = part.strip()
        channel = float(part[:-1]) * 255 / 100 if part.endswith("%") else float(part)
        channels.append(max(0, min(255, round(channel))))
    return "#" + "".join(f"{channel:02x}" for channel in channels)


def create_vertex(root, ident, bounds, style, value="", parent="1"):
    """Añade una figura o texto editable con geometría propia, sin imágenes raster."""
    x, y, width, height = bounds
    cell = ET.SubElement(root, "mxCell", {
        "id": ident, "value": value, "style": style, "vertex": "1", "parent": parent,
    })
    ET.SubElement(cell, "mxGeometry", {
        "x": f"{x:.3f}", "y": f"{y:.3f}",
        "width": f"{width:.3f}", "height": f"{height:.3f}", "as": "geometry",
    })
    return cell


def near_shape(point, shapes):
    """Encuentra una figura próxima al extremo para que el conector siga al moverla."""
    x, y = point
    candidates = []
    for shape in shapes:
        bx, by, width, height = shape["bounds"]
        if not (bx - 10 <= x <= bx + width + 10 and by - 10 <= y <= by + height + 10):
            continue
        if shape["kind"] == "ellipse":
            dx = (x - bx - width / 2) / (width / 2)
            dy = (y - by - height / 2) / (height / 2)
            distance = abs(dx * dx + dy * dy - 1) * min(width, height) / 2
        else:
            distance = min(abs(x-bx), abs(x-bx-width), abs(y-by), abs(y-by-height))
        if distance <= 10:
            candidates.append((distance, width * height, shape))
    return min(candidates, key=lambda candidate: candidate[:2])[2] if candidates else None


def create_edge(root, ident, start, end, style, shapes):
    """Crea un conector nativo y vincula sus extremos cuando tocan una figura."""
    cell = ET.SubElement(root, "mxCell", {
        "id": ident, "style": style, "edge": "1", "parent": "1",
    })
    geometry = ET.SubElement(cell, "mxGeometry", {"relative": "1", "as": "geometry"})
    for point, endpoint, prefix in [(start, "source", "exit"), (end, "target", "entry")]:
        ET.SubElement(geometry, "mxPoint", {
            "x": f"{point[0]:.3f}", "y": f"{point[1]:.3f}", "as": endpoint + "Point",
        })
        shape = near_shape(point, shapes)
        if shape:
            bx, by, width, height = shape["bounds"]
            cell.set(endpoint, shape["id"])
            style += (f"{prefix}X={(point[0]-bx)/width:.5f};"
                      f"{prefix}Y={(point[1]-by)/height:.5f};{prefix}Perimeter=0;")
    cell.set("style", style)
    return cell


def export_diagram(source, overwrite=False):
    """Convierte las primitivas locales a un mxGraphModel XML sin comprimir."""
    destination = source.with_suffix(".drawio")
    if destination.exists() and not overwrite:
        return False

    svg = ET.parse(source).getroot()
    width = float(svg.get("width"))
    height = float(svg.get("height"))
    title = svg.findtext(SVG_NS + "title", default=source.stem)
    group = svg.find(f"{SVG_NS}g/{SVG_NS}g")
    if group is None:
        raise ValueError(f"Estructura SVG no prevista: {source.name}")

    mxfile = ET.Element("mxfile", {"host": "app.diagrams.net", "type": "device"})
    diagram = ET.SubElement(mxfile, "diagram", {"id": source.stem, "name": title})
    model = ET.SubElement(diagram, "mxGraphModel", {
        "dx": str(math.ceil(width)), "dy": str(math.ceil(height)),
        "grid": "1", "gridSize": "10", "guides": "1", "tooltips": "1",
        "connect": "1", "arrows": "1", "fold": "1", "page": "1",
        "pageScale": "1", "pageWidth": str(math.ceil(width)),
        "pageHeight": str(math.ceil(height)), "background": "#ffffff",
    })
    root = ET.SubElement(model, "root")
    ET.SubElement(root, "mxCell", {"id": "0"})
    ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})

    elements = list(group)
    shapes = []
    # First pass supplies native figures for endpoint binding and label parenting.
    for index, element in enumerate(elements):
        kind = element.tag.removeprefix(SVG_NS)
        properties = read_style(element)
        bounds = None
        shape_name = None
        if kind == "rect":
            x, y, w, h = (float(element.get(key, "0")) for key in ["x", "y", "width", "height"])
            if x == y == 0 and w == width and h == height:
                continue  # The editor already supplies the white page background.
            bounds = (x, height-y-h, w, h)
            rounded = "1" if float(element.get("rx", "0")) else "0"
            shape_name = f"shape=rectangle;rounded={rounded};"
        elif kind in ("circle", "ellipse"):
            cx, cy = float(element.get("cx")), float(element.get("cy"))
            rx = float(element.get("r") if kind == "circle" else element.get("rx"))
            ry = float(element.get("r") if kind == "circle" else element.get("ry"))
            bounds = (cx-rx, height-cy-ry, 2*rx, 2*ry)
            shape_name = "shape=ellipse;"
        elif kind == "polygon":
            coords = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", element.get("points"))]
            points = list(zip(coords[::2], coords[1::2]))
            if len(points) == 4:
                xs, ys = zip(*points)
                bounds = (min(xs), height-max(ys), max(xs)-min(xs), max(ys)-min(ys))
                shape_name = "shape=rhombus;"
        if bounds:
            ident = f"shape-{index}"
            style = (shape_name + "html=0;whiteSpace=wrap;"
                     f"fillColor={color(properties.get('fill'))};"
                     f"strokeColor={color(properties.get('stroke'))};"
                     f"strokeWidth={properties.get('stroke-width', '1')};")
            create_vertex(root, ident, bounds, style)
            shapes.append({"id": ident, "bounds": bounds,
                           "kind": "ellipse" if kind in ("ellipse", "circle") else kind})

    last_edge = None
    last_end = None
    for index, element in enumerate(elements):
        kind = element.tag.removeprefix(SVG_NS)
        properties = read_style(element)
        if kind == "text":
            text = "".join(element.itertext())
            size = float(properties["font-size"].removesuffix("px"))
            bold = properties.get("font-weight") == "700"
            font = "Helvetica-Bold" if bold else "Helvetica"
            text_width = stringWidth(text, font, size) + 4
            x = float(element.get("x"))
            y = height-float(element.get("y"))-size
            bounds = (x, y, text_width, size*1.35)
            center = (x+text_width/2, y+size/2)
            containers = []
            for shape in shapes:
                bx, by, w, h = shape["bounds"]
                if bx <= center[0] <= bx+w and by <= center[1] <= by+h:
                    containers.append(shape)
            parent = "1"
            if containers:
                owner = min(containers, key=lambda item: item["bounds"][2]*item["bounds"][3])
                parent = owner["id"]
                bx, by, _, _ = owner["bounds"]
                bounds = (x-bx, y-by, text_width, size*1.35)
            style = ("text;html=0;align=left;verticalAlign=top;whiteSpace=nowrap;"
                     "overflow=visible;resizable=1;spacing=0;strokeColor=none;fillColor=none;"
                     f"fontFamily=Arial;fontSize={size};fontStyle={1 if bold else 0};"
                     f"fontColor={color(properties.get('fill'))};")
            create_vertex(root, f"text-{index}", bounds, style, text, parent)
        elif kind == "path":
            numbers = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", element.get("d", ""))]
            if len(numbers) != 4:
                raise ValueError(f"Trayectoria no prevista en {source.name}: {element.get('d')}")
            start = (numbers[0], height-numbers[1])
            end = (numbers[2], height-numbers[3])
            style = ("html=0;rounded=0;startArrow=none;endArrow=none;"
                     f"strokeColor={color(properties.get('stroke'))};"
                     f"strokeWidth={properties.get('stroke-width', '1')};")
            if "stroke-dasharray" in properties:
                style += "dashed=1;dashPattern=6 4;"
            last_edge = create_edge(root, f"edge-{index}", start, end, style, shapes)
            last_end = end
        elif kind == "polygon":
            numbers = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", element.get("points"))]
            if len(numbers) == 6:
                tip = (numbers[0], height-numbers[1])
                if last_edge is None or math.dist(tip, last_end) > 0.1:
                    raise ValueError(f"Punta de flecha sin conector en {source.name}")
                style = last_edge.get("style").replace("endArrow=none;", "endArrow=block;endFill=1;")
                last_edge.set("style", style)

    ET.indent(mxfile, space="  ")
    ET.ElementTree(mxfile).write(destination, encoding="utf-8", xml_declaration=True)
    return True


def main():
    """Exporta cada diagrama individual sin sobrescribir trabajo manual por defecto."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sobrescribir", action="store_true", help="Reemplaza editables existentes desde los SVG actuales.")
    args = parser.parse_args()
    files = sorted(DIAGRAMS.glob("*.svg"))
    if len(files) != 7:
        raise ValueError("Se esperaban los siete SVG documentales existentes.")
    created = sum(export_diagram(source, args.sobrescribir) for source in files)
    print(f"draw.io: {created} generados; {len(files)-created} existentes conservados.")


if __name__ == "__main__":
    main()
