"""Read all OOXML text parts; never modify the category document."""
import json
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

source, destination = map(Path, sys.argv[1:3])
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
parts = []
with zipfile.ZipFile(source) as archive:
    for name in archive.namelist():
        if not (name.startswith('word/') and name.endswith('.xml')):
            continue
        element = ET.fromstring(archive.read(name))
        if element.findall('.//w:altChunk', ns) or element.findall('.//w:drawing', ns) or element.findall('.//w:object', ns):
            raise RuntimeError(f'Unrecovered embedded content in {name}')
        paragraphs = element.findall('.//w:p', ns)
        text = '\n'.join(''.join(node.text or '' for node in p.findall('.//w:t', ns)) for p in paragraphs)
        if text.strip():
            parts.append({'part': name, 'text': text, 'tables': len(element.findall('.//w:tbl', ns))})
if not parts:
    raise RuntimeError('No document text recovered')
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(parts, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Recovered {len(parts)} text parts; {sum(p["tables"] for p in parts)} tables')
