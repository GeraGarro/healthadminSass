"""Ubicación única de las láminas y carga de su contenido documental."""
from functools import lru_cache
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
PARTES = ROOT / 'docs/arquitectura/modelo-er/partes'


@lru_cache(maxsize=1)
def estructura():
    return json.loads((PARTES / 'estructura.json').read_text(encoding='utf-8'))


def carpeta_lamina(base, stem):
    item = next((item for item in estructura() if item['stem'] == stem), None)
    if item is None:
        raise ValueError('La lámina debe registrarse en partes/estructura.json: ' + stem)
    target = (base / 'partes' / item['folder']).resolve()
    if not target.is_relative_to(base.resolve()):
        raise ValueError('Carpeta de lámina fuera del directorio del modelo')
    return target


def cargar_contenido():
    shared = json.loads((PARTES / 'glosario-campos.json').read_text(encoding='utf-8'))
    entities, sheets = {}, {}
    for item in estructura():
        data = json.loads((PARTES / item['folder'] / 'contenido.json').read_text(encoding='utf-8'))
        if data['lamina'] != item['index'] or set(data['entidades']) != set(item['names']):
            raise ValueError('Contenido de lámina inconsistente: ' + item['folder'])
        if set(entities) & set(data['entidades']):
            raise ValueError('Una entidad aparece en más de una lámina')
        entities.update(data['entidades'])
        sheets[item['index']] = {k: data[k] for k in ('titulo', 'objetivo', 'ejemplo', 'recorrido')}
    return entities, sheets, shared
