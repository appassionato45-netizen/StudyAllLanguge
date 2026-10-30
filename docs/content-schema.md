# Content schema

All lesson content lives in `data/` as static JSON. The engine never hardcodes a language: every course declares a **target** language (what you learn) and an **explain** language (what explanations are written in).

| Course | target | explain | Audience |
|---|---|---|---|
| `ko` | `ko` | `en` | English speakers learning Korean |
| `ja` | `ja` | `ko` | Korean speakers learning Japanese |

## `data/courses.json`

The only file loaded at startup. It is a small index; unit files are fetched only when opened.

```json
{
  "courses": [
    {
      "id": "ko",
      "target": "ko",
      "explain": "en",
      "title": { "en": "Learn Korean", "ko": "한국어 배우기" },
      "levels": [
        {
          "id": "beginner",
          "title": { "en": "Beginner", "ko": "초급" },
          "units": [
            { "id": "hangul-vowels", "type": "letters", "title": { "en": "...", "ko": "..." } }
          ]
        }
      ]
    }
  ]
}
```

A unit's file path is derived, not stored: `data/<course>/<level>/<unit>.json`.

## Localized text

Any field shown in the explain language is an object keyed by language code, e.g. `{ "en": "water", "ko": "물" }`. The engine picks `explain` first, then falls back to the UI language, then to the first value present. Target-language text (`text`, `char`) is a plain string.

## Unit types

Every unit file has `{ "id", "type", "items" }`. Every item that can be reviewed has a globally unique, **never-changing** `id` (`<course>.<unit>.<slug>`), because learning progress is keyed by it.

### `letters`
```json
{ "id": "ko.hangul-vowels.a", "char": "ㅏ", "roman": "a",
  "note": { "en": "Like 'a' in father." },
  "examples": [ { "text": "아이", "roman": "a-i", "meaning": { "en": "child" } } ] }
```

### `vocab`
```json
{ "id": "ko.greetings.annyeong", "text": "안녕하세요", "roman": "annyeonghaseyo",
  "meaning": { "en": "Hello" },
  "example": { "text": "...", "roman": "...", "meaning": { "en": "..." } } }
```

### `dialogue`
`items` is the list of lines, in order.
```json
{ "speaker": "A", "text": "이름이 뭐예요?", "roman": "ireumi mwoyeyo?", "meaning": { "en": "What is your name?" } }
```

### `story`
`items` is the list of paragraphs (same shape as a dialogue line, without `speaker`). An optional top-level `"glossary"` holds `vocab` items so key words can be reviewed as flashcards. Stories must be original or in the public domain; note the source in `"source"`.

## Copyright rule

No drama scripts, subtitles, or song lyrics from real productions. "Drama-style" units are original dialogues written for this site.
