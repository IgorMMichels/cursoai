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

mapping = json.loads((ROOT / "src/lib/generated/lesson-audio-map.json").read_text(encoding="utf-8"))
journeys = json.loads((ROOT / "src/lib/generated/journeys.json").read_text(encoding="utf-8"))
legacy_ids = set(re.findall(r'"id": "(m\d+l\d+)"', (ROOT / "src/lib/course.ts").read_text(encoding="utf-8")))
lesson_ids = legacy_ids | {lesson["id"] for journey in journeys for module in journey["modules"] for lesson in module["lessons"]}
audio_by_id = {lesson["id"]: lesson for journey in CATALOG["journeys"] for lesson in journey["lessons"]}
assert set(mapping) <= lesson_ids, "O vínculo contém aulas que não existem."
for lesson_id, audio_id in mapping.items():
    assert audio_id in audio_by_id, f"Áudio atualizado ausente: {lesson_id} -> {audio_id}"
    assert audio_by_id[audio_id]["blocks"], f"Narração sem clipes: {audio_id}"
missing = lesson_ids - set(mapping)
assert missing == {"m1l1", "m1l2", "m4l3"}, f"Revise os vínculos das novas aulas: {sorted(missing)}"
print(f"Vínculos validados: {len(mapping)} aulas; sem áudio atualizado: {', '.join(sorted(missing))}.")
