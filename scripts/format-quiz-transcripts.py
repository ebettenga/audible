#!/usr/bin/env python3
"""Format saved YouTube captions into quiz-reference transcripts."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "transcripts"

VIDEOS = [
    {
        "id": "sRaIlyv95hs",
        "title": "Every Offensive Formation Explained in 18 Minutes",
        "channel": "Fourth and Film",
        "topic": "formations",
        "file": "sRaIlyv95hs-offensive-formations.txt",
        "headings": [
            "T formation",
            "I formation",
            "Single back",
            "Pro set",
            "Shotgun",
            "Pistol",
            "Spread",
            "Wildcat",
            "Empty backfield",
            "Jumbo",
        ],
    },
    {
        "id": "Ebn6c1jNZbo",
        "title": "Every Passing Concept Explained in 13 Minutes",
        "channel": "Fourth and Film",
        "topic": "passing-routes",
        "file": "Ebn6c1jNZbo-passing-concepts.txt",
        "headings": [
            "Mesh concept",
            "Levels concept",
            "Flood concept",
            "Smash concept",
            "Yross",
            "Four verticals",
            "Stick concept",
            "Drive concept",
            "Dagger concept",
            "Slant flat",
            "Double China",
            "Shallow cross",
        ],
    },
    {
        "id": "Q6iuu58jLgU",
        "title": "Every Defensive Formation Explained in 12 Minutes",
        "channel": "Fourth and Film",
        "topic": "fronts",
        "file": "Q6iuu58jLgU-defensive-formations.txt",
        "headings": [
            "6-2",
            "5-3",
            "52 Eagle",
            "44",
            "34",
            "43",
            "46 Bear",
            "Nickel",
            "Dime",
        ],
    },
    {
        "id": "DqdeUAgXiyo",
        "title": "Personnel Packages Explained in 49 Minutes",
        "channel": "Fourth and Film",
        "topic": "personnel",
        "file": "DqdeUAgXiyo-personnel-packages.txt",
        "headings": [
            "11 personnel",
            "12 personnel",
            "21 personnel",
            "13 personnel",
        ],
    },
    {
        "id": "Of_TwCsCETs",
        "title": "Every Running Concept Explained in 27 Minutes",
        "channel": "Fourth and Film",
        "topic": "running-routes",
        "file": "Of_TwCsCETs-running-concepts.txt",
        "headings": [
            "Man concepts",
            "Lead dive",
            "Straight lead",
            "Isolation",
            "Man dive",
            "Man toss",
            "Inside zone",
            "Split zone",
            "Zone read",
            "Mid zone",
            "Outside zone",
            "Jet zone",
            "Power O",
            "Counter",
            "Duo",
            "Trap",
            "Wham",
            "G lead",
            "Tle lead",
            "Dart",
            "Speed option",
        ],
    },
    {
        "id": "ROliJ27Br9A",
        "title": "Every Defensive Coverage Explained in 15 Minutes",
        "channel": "Fourth and Film",
        "topic": "coverages",
        "file": "ROliJ27Br9A-defensive-coverages.txt",
        "headings": [
            "Cover zero",
            "Cover one robber",
            "Cover one",
            "Cover two zone",
            "Cover two man",
            "Cover two buzz",
            "Tampa 2",
            "Cover three cloud",
            "Cover three buzz",
            "Cover three",
            "Cover four",
            "Cover six",
        ],
    },
    {
        "id": "IgM3nO_ZHjM",
        "title": "Every Blitz Concept Explained in 18 Minutes",
        "channel": "Fourth and Film",
        "topic": "pressures",
        "file": "IgM3nO_ZHjM-blitz-concepts.txt",
        "headings": [
            "Simulated pressure",
            "Second level blitzes",
            "Slide protection",
            "Perimeter blitz",
            "Fire zone",
            "Stunts, twists, and games",
            "All out pressure",
        ],
    },
]


def clean_text(text: str) -> str:
    text = text.replace("\ufeff", "")
    text = re.sub(r"^# Content from .+\n+", "", text)
    text = re.sub(r"\[(?:clears throat|Music|Applause)\]", "", text, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip()
    text = text.replace("  ", " ")
    return text


def insert_headings(text: str, headings: list[str]) -> str:
    # Longer headings first so "Cover one robber" wins over "Cover one".
    # Only split at sentence starts so "spread out" does not become ## Spread.
    ordered = sorted(headings, key=len, reverse=True)
    for heading in ordered:
        if re.search(rf"^## {re.escape(heading)}$", text, re.M):
            continue
        titled = re.compile(rf"(^|(?<=[.!?]\s))({re.escape(heading)})\.", re.I)
        if titled.search(text):
            text = titled.sub(
                lambda m, h=heading: f"{m.group(1)}\n\n## {h}\n\n{m.group(2)}.",
                text,
                count=1,
            )
            continue
        loose = re.compile(rf"(^|(?<=[.!?]\s))({re.escape(heading)})\b", re.I)
        if loose.search(text):
            text = loose.sub(
                lambda m, h=heading: f"{m.group(1)}\n\n## {h}\n\n{m.group(2)}",
                text,
                count=1,
            )
    return text.strip()


def wrap_paragraphs(text: str) -> str:
    chunks = re.split(r"\n{2,}", text)
    out = []
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk:
            continue
        if chunk.startswith("## "):
            out.append(chunk)
            continue
        chunk = re.sub(r"\s+", " ", chunk)
        out.append(chunk)
    return "\n\n".join(out).strip() + "\n"


def format_transcript(meta: dict, body: str) -> str:
    body = wrap_paragraphs(insert_headings(clean_text(body), meta["headings"]))
    header = "\n".join(
        [
            f"# {meta['title']}",
            "",
            f"- Channel: {meta['channel']}",
            f"- Video: https://youtu.be/{meta['id']}",
            f"- Topic: {meta['topic']}",
            "- Source: public YouTube captions, saved as quiz reference",
            "",
            "## Transcript",
            "",
        ]
    )
    return header + body


def main() -> None:
    raw_dir = Path("/tmp/yt-captions")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    index = []
    for meta in VIDEOS:
        raw_path = raw_dir / f"{meta['id']}.txt"
        if not raw_path.exists():
            raise SystemExit(f"Missing raw caption file: {raw_path}")
        body = raw_path.read_text(encoding="utf-8")
        dest = OUT_DIR / meta["file"]
        dest.write_text(format_transcript(meta, body), encoding="utf-8")
        index.append(
            {
                "id": meta["id"],
                "title": meta["title"],
                "channel": meta["channel"],
                "url": f"https://youtu.be/{meta['id']}",
                "topic": meta["topic"],
                "file": f"transcripts/{meta['file']}",
            }
        )
        print(f"wrote {dest.relative_to(ROOT)} ({dest.stat().st_size} bytes)")

    (OUT_DIR / "index.json").write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")
    readme = [
        "# Quiz source transcripts",
        "",
        "Public YouTube captions from [Fourth and Film](https://www.youtube.com/@FourthandFilm),",
        "saved so Learn quizzes can be checked against a real coaching explanation.",
        "",
        "| Topic | Video | File |",
        "| --- | --- | --- |",
    ]
    for item in index:
        readme.append(
            f"| `{item['topic']}` | [{item['title']}]({item['url']}) | `{item['file']}` |"
        )
    readme.extend(
        [
            "",
            "Captions are auto-generated. Names and terms may be misspelled",
            "(`eye` for I-formation, `Yross` for Y-cross, `Gle lead` for G-lead).",
            "A few outros are clipped because the public caption feed ended early.",
            "",
        ]
    )
    (OUT_DIR / "README.md").write_text("\n".join(readme), encoding="utf-8")
    print("wrote transcripts/index.json and transcripts/README.md")


if __name__ == "__main__":
    main()
