#!/usr/bin/env python3
"""Check that every unit listed in data/courses.json exists, has the declared type,
and that every reviewable item id is unique and prefixed "<course>.<unit>."."""
import json, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
errors, seen = [], set()
courses = json.loads((root / 'data/courses.json').read_text())['courses']
for c in courses:
    for level in c['levels']:
        for u in level['units']:
            path = root / f"data/{c['id']}/{level['id']}/{u['id']}.json"
            if not path.exists():
                errors.append(f'missing file: {path.relative_to(root)}'); continue
            unit = json.loads(path.read_text())
            if unit.get('type') != u['type']:
                errors.append(f"{path.name}: type {unit.get('type')!r} != {u['type']!r}")
            for item in unit['items'] + unit.get('glossary', []):
                if 'id' not in item: continue
                if not item['id'].startswith(f"{c['id']}.{u['id']}."):
                    errors.append(f"{path.name}: bad id prefix {item['id']}")
                if item['id'] in seen:
                    errors.append(f"duplicate id {item['id']}")
                seen.add(item['id'])
print('\n'.join(errors) or f'ok: {len(seen)} reviewable items')
sys.exit(1 if errors else 0)
