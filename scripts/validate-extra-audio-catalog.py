"""Check the generated extra-audio catalog and word cue sidecars."""

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
CATALOG = json.loads((ROOT / "src/lib/generated/extra-audio-catalog.json").read_text(encoding="utf-8"))
checked = 0

for journey in CATALOG["journeys"]:
    for lesson in journey["lessons"]:
        captions_path = PUBLIC / lesson["captionsSrc"].lstrip("/")
        captions = json.loads(captions_path.read_text(encoding="utf-8"))
        by_id = {item["id"]: item for item in captions["blocks"]}
        for block in lesson["blocks"]:
            audio = PUBLIC / block["audioSrc"].lstrip("/")
            assert audio.is_file(), f"Áudio não encontrado: {audio}"
            sidecar = by_id[block["id"]]
            assert sidecar["transcript"] == block["transcript"]
            assert abs(sidecar["duration"] - block["duration"]) < 0.01
            previous_end = 0.0
            previous_char_end = 0
            for word in sidecar["words"]:
                assert word["start"] >= previous_end - 0.001
                assert word["end"] > word["start"]
                assert word["end"] <= block["duration"] + 0.15
                assert word["charStart"] >= previous_char_end
                assert word["charEnd"] > word["charStart"]
                assert not re.search(r"[\w]", block["transcript"][previous_char_end:word["charStart"]], re.UNICODE)
                assert block["transcript"][word["charStart"] : word["charEnd"]]
                previous_end = word["end"]
                previous_char_end = word["charEnd"]
            assert not re.search(r"[\w]", block["transcript"][previous_char_end:], re.UNICODE)
            checked += 1

print(f"Validado: {checked} clipes, roteiros, arquivos de áudio e marcações de palavra.")
