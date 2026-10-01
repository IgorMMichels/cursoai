"""Generate MP3 narrations and word-aligned caption metadata for journey lessons.

Usage:
  python scripts/generate-journey-narrations.py path/to/jornadas-contexto.md --round 1

Rounds contain at most ten lessons and follow the document's journey order.
"""
import argparse
import asyncio
import html
import json
import re
import subprocess
import unicodedata
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public' / 'audio' / 'journeys'
VOICE = 'pt-BR-AntonioNeural'
RATE = '-5%'
ROUND_SIZE = 10


def parse_lessons(path):
    source = path.read_text(encoding='utf-8')
    source = source.split('## 10. Áudio e narração')[0]
    lessons = []
    for lesson_block in re.split(r'(?=^#### `)', source, flags=re.M):
        header = re.search(r'^#### `([^`]+)` — (.+?) · (\d+) min\s*$', lesson_block, re.M)
        if not header:
            continue
        script_lines = re.findall(r'^  >[ \t]?(.*)$', lesson_block, re.M)
        transcript = '\n\n'.join(line for line in script_lines if line.strip())
        if not transcript:
            raise ValueError(f"No narration script found for {header.group(1)}")
        summary_match = re.search(r'^- \*\*Resumo:\*\* (.+)$', lesson_block, re.M)
        lessons.append({
            'id': header.group(1),
            'title': header.group(2),
            'minutes': int(header.group(3)),
            'summary': summary_match.group(1) if summary_match else header.group(2),
            'transcript': transcript,
        })
    expected_prefixes = ('meme-', 'fut-', 'trd-')
    if len(lessons) != 43 or any(not item['id'].startswith(expected_prefixes) for item in lessons):
        raise ValueError(f'Expected 43 ordered journey lessons, found {len(lessons)}')
    return lessons


def normalized(text):
    letters, positions = [], []
    for index, char in enumerate(text):
        for letter in unicodedata.normalize('NFKD', char.casefold()):
            if letter.isalnum():
                letters.append(letter)
                positions.append(index)
    return ''.join(letters), positions


def align(transcript, boundaries):
    source, positions = normalized(transcript)
    cursor = 0
    words = []
    for event in boundaries:
        token, _ = normalized(html.unescape(event['text']))
        if not token:
            continue
        if not source.startswith(token, cursor):
            raise ValueError(f"Word boundary differs from script at {cursor}: {event['text']!r}")
        last = cursor + len(token)
        words.append({
            'start': round(event['offset'] / 10_000_000, 4),
            'end': round((event['offset'] + event['duration']) / 10_000_000, 4),
            'charStart': positions[cursor],
            'charEnd': positions[last - 1] + 1,
        })
        cursor = last
    if cursor != len(source) or not words:
        raise ValueError('Word boundaries do not cover the complete script')
    return words


async def generate(item, semaphore):
    async with semaphore:
        audio = OUTPUT / f"{item['id']}.mp3"
        metadata = OUTPUT / f"{item['id']}.json"
        if audio.exists() and metadata.exists():
            saved = json.loads(metadata.read_text(encoding='utf-8'))
            if saved.get('transcript') == item['transcript'] and saved.get('words'):
                print(f"Cached {item['id']}", flush=True)
                return item['id']
        last_error = None
        for attempt in range(3):
            temporary = audio.with_suffix('.mp3.part')
            try:
                boundaries = []
                with temporary.open('wb') as file:
                    stream = edge_tts.Communicate(item['transcript'], VOICE, rate=RATE, boundary='WordBoundary')
                    async for chunk in stream.stream():
                        if chunk['type'] == 'audio':
                            file.write(chunk['data'])
                        elif chunk['type'] == 'WordBoundary':
                            boundaries.append(chunk)
                words = align(item['transcript'], boundaries)
                duration = float(subprocess.check_output([
                    'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                    '-of', 'default=noprint_wrappers=1:nokey=1', str(temporary),
                ], encoding='utf-8').strip())
                if words[-1]['end'] > duration + .15:
                    raise ValueError('Word timing exceeds audio duration')
                src = f"/audio/journeys/{item['id']}.mp3"
                captions_src = f"/audio/journeys/{item['id']}.json"
                track = {
                    'src': src,
                    'captionsSrc': captions_src,
                    'transcript': item['transcript'],
                    'summary': item['summary'],
                    'duration': duration,
                    'voice': VOICE,
                }
                temporary.replace(audio)
                metadata.write_text(json.dumps({
                    'transcript': item['transcript'],
                    'words': words,
                    'track': track,
                }, ensure_ascii=False), encoding='utf-8')
                print(f"Generated {item['id']}: {duration:.1f}s, {len(words)} word cues", flush=True)
                return item['id']
            except Exception as error:
                last_error = error
                temporary.unlink(missing_ok=True)
                if attempt < 2:
                    await asyncio.sleep(2 * (attempt + 1))
        raise RuntimeError(f"Failed {item['id']} after retries: {last_error}")


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path, help='jornadas-contexto.md')
    parser.add_argument('--round', type=int, required=True, help='1-based batch number; max ten lessons')
    args = parser.parse_args()
    if args.round < 1:
        parser.error('--round must be >= 1')
    lessons = parse_lessons(args.source)
    start = (args.round - 1) * ROUND_SIZE
    batch = lessons[start:start + ROUND_SIZE]
    if not batch:
        parser.error(f'Round {args.round} is empty; valid rounds are 1-{(len(lessons)+ROUND_SIZE-1)//ROUND_SIZE}')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(2)
    results = await asyncio.gather(*(generate(item, semaphore) for item in batch), return_exceptions=True)
    failures = [(item['id'], result) for item, result in zip(batch, results) if isinstance(result, Exception)]
    print(f"Round {args.round}: {len(batch)-len(failures)}/{len(batch)} generated", flush=True)
    for lesson_id, error in failures:
        print(f"FAILED {lesson_id}: {error}", flush=True)
    if failures:
        raise SystemExit(1)


if __name__ == '__main__':
    asyncio.run(main())
