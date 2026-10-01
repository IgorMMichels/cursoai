"""Extract journey catalog and protected lesson seed from jornadas-contexto.md.

Usage: python scripts/build-journey-seed.py path/to/jornadas-contexto.md
"""
import json
import re
import sys
from pathlib import Path

source = Path(sys.argv[1]).read_text(encoding='utf-8')
source = source.split('## 10. Áudio e narração')[0].split('# 🟢 JORNADA DE MEMECOINS')[1]
source = '# 🟢 JORNADA DE MEMECOINS' + source
journeys = []
keys = []
for block in re.split(r'(?=^# [^\n]*JORNADA DE )', source, flags=re.M):
    head = re.search(r'^# [^\n]*JORNADA DE ([^\n(]+) \(`([^`]+)`\)', block)
    if not head:
        continue
    slug = head.group(2)
    level_line = re.search(r'^- \*\*Nível:\*\* ([^\n]+)', block, re.M).group(1)
    icon = re.search(r'\*\*Ícone:\*\* `([^`]+)`', level_line).group(1)
    color = re.search(r'\*\*Cor:\*\* `([^`]+)`', level_line).group(1)
    level = 'intermediario' if slug == 'futuros' else 'iniciante'
    short = re.search(r'^- \*\*Descrição curta \(card\):\*\* (.+)$', block, re.M).group(1)
    long = re.search(r'^- \*\*Descrição longa:\*\* (.+)$', block, re.M).group(1)
    journey = dict(id=slug, ordinal=len(journeys)+1, title='Jornada de '+head.group(1).strip().title(), shortDesc=short, longDesc=long, icon=icon, color=color, level=level, coverUrl=f'/journey-covers/{slug}.webp', published=True, modules=[])
    for module_block in re.split(r'(?=^## Módulo \d+)', block, flags=re.M)[1:]:
        mh = re.search(r'^## Módulo (\d+) — (.+?) \(`([^`]+)`\)', module_block)
        module = dict(id=mh.group(3), number=mh.group(1).zfill(2), title=mh.group(2), subtitle='', icon=icon, color=color, duration='', published=True, lessons=[])
        for lesson_block in re.split(r'(?=^#### `)', module_block, flags=re.M)[1:]:
            lh = re.search(r'^#### `([^`]+)` — (.+?) · (\d+) min', lesson_block)
            if not lh:
                continue
            lesson_id, title, minutes = lh.group(1), lh.group(2), int(lh.group(3))
            summary = re.search(r'^- \*\*Resumo:\*\* (.+)$', lesson_block, re.M).group(1)
            takeaway = re.search(r'^- \*\*Takeaway:\*\* (.+)$', lesson_block, re.M).group(1)
            exercise = re.search(r'^- \*\*Exercício:\*\* (.+)$', lesson_block, re.M).group(1)
            options = re.split(r' · (?=[a-d]\) )', exercise)
            prompt, first = options[0].rsplit(' a) ', 1)
            options = [first] + [re.sub(r'^[b-d]\) ', '', option) for option in options[1:]]
            correct = next(i for i, option in enumerate(options) if '✅' in option)
            options = [option.replace(' ✅', '').strip() for option in options]
            narration_lines = re.findall(r'^  >[ \t]?(.*)$', lesson_block, re.M)
            transcript = '\n\n'.join(line for line in narration_lines if line.strip())
            paragraphs = [line for line in narration_lines if line.strip()]
            audio_path = Path(f'public/audio/journeys/{lesson_id}.mp3')
            captions_path = Path(f'public/audio/journeys/{lesson_id}.json')
            if audio_path.exists() and captions_path.exists():
                narration = json.loads(captions_path.read_text(encoding='utf-8'))['track']
            else:
                narration = dict(src='', captionsSrc='', transcript=transcript, summary=summary, duration=minutes*60, voice='pt-BR-AntonioNeural')
            content = dict(paragraphs=paragraphs, takeaway=takeaway, sources=[], exercise=dict(title='Confira seu entendimento', prompt=prompt, options=options, note=takeaway), narration=narration)
            module['lessons'].append(dict(id=lesson_id, title=title, duration=f'{minutes} min', published=True, content=content))
            keys.append((lesson_id, correct))
        module['duration'] = f"{sum(int(lesson['duration'].split()[0]) for lesson in module['lessons'])} min"
        journey['modules'].append(module)
    journeys.append(journey)

assert [sum(len(m['lessons']) for m in j['modules']) for j in journeys] == [17, 12, 14]
Path('src/lib/generated').mkdir(parents=True, exist_ok=True)
catalog = [{**j, 'modules': [{**m, 'lessons': [{k: v for k, v in l.items() if k != 'content'} for l in m['lessons']]} for m in j['modules']]} for j in journeys]
Path('src/lib/generated/journeys.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def quote(value):
    return "'" + str(value).replace("'", "''") + "'"

sql = ["-- Journey catalog and protected lesson content extracted from jornadas-contexto.md.",
       "insert into public.journeys (id, ordinal, title, short_desc, long_desc, icon, color, level, cover_url, published) values"]
sql.append(',\n'.join('  ('+', '.join(map(quote, [j['id'], j['ordinal'], j['title'], j['shortDesc'], j['longDesc'], j['icon'], j['color'], j['level'], j['coverUrl']]))+', true)' for j in journeys))
sql.append("on conflict (id) do nothing;\n")
modules = [(j,m) for j in journeys for m in j['modules']]
sql.append('insert into public.course_modules (id, journey_id, ordinal, title, subtitle, published) values')
sql.append(',\n'.join('  ('+', '.join(map(quote, [m['id'], j['id'], n+1, m['title'], m['subtitle']]))+', true)' for j in journeys for n,m in enumerate(j['modules'])))
sql.append('on conflict (id) do nothing;\n')
sql.append('insert into public.lessons (id, module_id, ordinal, title, duration_minutes, published) values')
sql.append(',\n'.join('  ('+', '.join(map(quote, [l['id'], m['id'], n+1, l['title'], int(l['duration'].split()[0])]))+', true)' for _,m in modules for n,l in enumerate(m['lessons'])))
sql.append('on conflict (id) do nothing;\n')
sql.append('insert into public.lesson_content (lesson_id, content) values')
sql.append(',\n'.join('  ('+quote(l['id'])+', '+quote(json.dumps(l['content'], ensure_ascii=False))+'::jsonb)' for _,m in modules for l in m['lessons']))
sql.append('on conflict (lesson_id) do nothing;\n')
sql.append('insert into public.module_quiz_questions (module_id, questions) values')
sql.append(',\n'.join('  ('+quote(m['id'])+', '+quote(json.dumps([dict(question=l['content']['exercise']['prompt'], options=l['content']['exercise']['options'], answer=next(i for i, option in enumerate(l['content']['exercise']['options']) if (l['id'], i) in keys), explanation=l['content']['takeaway']) for l in m['lessons']], ensure_ascii=False))+'::jsonb)' for _,m in modules))
sql.append('on conflict (module_id) do nothing;\n')
sql.append('insert into public.lesson_exercise_keys (lesson_id, answer_index) values')
sql.append(',\n'.join(f'  ({quote(lesson_id)}, {index})' for lesson_id,index in keys))
sql.append('on conflict (lesson_id) do nothing;\n')
Path('supabase/migrations/20260930030000_seed_journeys.sql').write_text('\n'.join(sql), encoding='utf-8')
print(f'Generated {len(journeys)} journeys, {len(modules)} modules, {len(keys)} lessons.')
