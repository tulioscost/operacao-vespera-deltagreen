"""Verificador local do pacote. Não equivale a um teste em instância do Foundry."""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'module.json').read_text(encoding='utf-8'))
assert re.fullmatch(r'\d+\.\d+\.\d+',manifest['version'])
assert manifest['id']=='operacao-vespera-deltagreen'
assert manifest['download'].endswith('/v'+manifest['version']+'/operacao-vespera-deltagreen.zip')
assert {d['id'] for d in manifest['relationships']['requires']}=={'dice-calculator','dice-so-nice'}
assert {d['id'] for d in manifest['relationships']['systems']}=={'deltagreen'}
for k in ['esmodules','styles']:
    for file in manifest.get(k,[]):assert (root/file).is_file(),file
for lang in manifest['languages']:
    assert (root/lang['path']).is_file(),lang['path']
    json.loads((root/lang['path']).read_text(encoding='utf-8'))
data=json.loads((root/'data/vespera.json').read_text(encoding='utf-8'))
assert len(data['scenes'])==9
assert len(data['npcs'])==9
assert len(data['agents'])==5
for sc in data['scenes']:assert (root/sc['image']).is_file(),sc['image']
for group in ['agents','npcs']:
    for entry in data[group]:
        for field in ['img','token']:
            value=entry.get(field,'')
            if value.startswith('assets/'):assert (root/value).is_file(),value
source=(root/'scripts/importer.mjs').read_text(encoding='utf-8')
assert "type:'text'" in source
assert 'fog:{mode:FOG_MODE}' in source
print('OK: manifesto, dependências, importador, mapas, retratos e tradução pt-BR.')
