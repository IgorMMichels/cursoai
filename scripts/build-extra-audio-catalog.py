"""Rebuild estimated word cues from the committed audio catalog."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
CATALOG_PATH = ROOT / "src" / "lib" / "generated" / "extra-audio-catalog.json"
TOKEN_PATTERN = re.compile(r"[\w]+", re.UNICODE)


def estimate_word_cues(transcript: str, duration: float) -> list[dict]:
    tokens = [
        {"text": match.group(), "charStart": match.start(), "charEnd": match.end()}
        for match in TOKEN_PATTERN.finditer(transcript)
    ]
    if not tokens:
        return []
    if duration <= 0:
        raise ValueError("A duração do áudio deve ser positiva.")

    weights = [max(1, len(token["text"])) for token in tokens]
    total_weight = sum(weights)
    cursor = 0.0
    cues = []
    for index, (token, weight) in enumerate(zip(tokens, weights)):
        start = cursor
        cursor = duration if index == len(tokens) - 1 else cursor + duration * weight / total_weight
        cues.append({"start": round(start, 3), "end": round(cursor, 3), **token})
    return cues


def main() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    completed = 0
    for journey in catalog["journeys"]:
        for lesson in journey["lessons"]:
            blocks = []
            for audio in lesson["blocks"]:
                audio_path = PUBLIC / audio["audioSrc"].lstrip("/")
                if not audio_path.is_file():
                    raise FileNotFoundError(f"Áudio ausente: {audio_path}")
                blocks.append({
                    "id": audio["id"],
                    "transcript": audio["transcript"],
                    "duration": audio["duration"],
                    "matchRatio": 0.0,
                    "words": estimate_word_cues(audio["transcript"], audio["duration"]),
                })
                completed += 1

            caption_path = PUBLIC / lesson["captionsSrc"].lstrip("/")
            caption_path.parent.mkdir(parents=True, exist_ok=True)
            caption_path.write_text(
                json.dumps({"version": 1, "blocks": blocks}, ensure_ascii=False, separators=(",", ":")) + "\n",
                encoding="utf-8",
            )

    print(f"Marcações reconstruídas para {completed} clipes.")


if __name__ == "__main__":
    main()
