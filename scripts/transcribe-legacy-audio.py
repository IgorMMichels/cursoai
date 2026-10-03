"""Transcribe local legacy recordings using the locally cached Whisper model."""
import json
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public' / 'transcricoes' / 'legado'
OUTPUT.mkdir(parents=True, exist_ok=True)
model = WhisperModel('small', device='cpu', compute_type='int8', local_files_only=True)
for audio in sorted((ROOT / 'public' / 'audio').glob('*.mp3')):
    target = OUTPUT / f'{audio.stem}.json'
    if target.exists():
        continue
    segments, info = model.transcribe(str(audio), language='pt', beam_size=5, vad_filter=True)
    segments = [{'start': item.start, 'end': item.end, 'text': item.text.strip()} for item in segments]
    target.write_text(json.dumps({
        'audio': f'/audio/{audio.name}',
        'method': 'Reconhecimento automático de fala: faster-whisper, modelo small, português. Sem revisão humana.',
        'duration': info.duration,
        'transcript': '\n\n'.join(item['text'] for item in segments),
        'segments': segments,
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Transcribed {audio.name}', flush=True)
