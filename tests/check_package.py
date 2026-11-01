from pathlib import Path
import json, sys
from zipfile import ZipFile
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'module.json').read_text(encoding='utf-8'))
d=json.loads((root/'data/vespera.json').read_text(encoding='utf-8'))
required=['module.json','scripts/importer.mjs','scripts/macro-aplicar-mapas.js','styles/vespera.css','data/vespera.json','README.md','LICENSE.txt']
required += [x['path'] for x in m['languages']]
required += [x['image'] for x in d['scenes']]
for kind in ('agents','npcs'):
 for e in d[kind]:
  required += [e[k] for k in ('img','token') if e.get(k,'').startswith('assets/')]
missing=[p for p in required if not (root/p).is_file()]
if missing:raise SystemExit('Arquivos ausentes: '+', '.join(missing))
assert 'scripts/importer.mjs' in required
s=(root/'scripts/importer.mjs').read_text(encoding='utf-8')
for snippet in ('openMapBackgrounds','checkLanguage','fog.mode','makeMacro','scene.initialLevel',"createEmbeddedDocuments('Level'",'level.update'):
 assert snippet in s, snippet
print('OK: ',len(set(required)), 'recursos referenciados existentes; fog, macros e tradução incluídos.')
