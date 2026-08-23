"""Download the locally cached, license-safe source images used by the seven worlds."""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(r"C:\Users\bockr\mabai-website-concepts\solar-system\assets\worlds\sources")
ROOT.mkdir(parents=True, exist_ok=True)
USER_AGENT = "MAB-AI-Strategies-world-builder/1.0 (asset research; https://mabaistrategies.com)"

ASSETS = {
    "arctic-base.jpg": "File:A glacier in the Brooks Range - panoramio.jpg",
    "arctic-fauna.png": "File:Two Neanderthal women chasing a mammoth but chased themselves by a sabre tooth cat (Chat GPT Plus May 2026).png",
    "lava-base.jpg": "File:6099 TB Lava Lake.jpg",
    "desert-base.jpg": "File:Dead Vlei, Sossusvlei, Namibia, 2018-08-06, DD 041-049 PAN.jpg",
    "desert-microbe.jpg": "File:Methicillin-Resistant Staphylococcus Aureus (MRSA) Bacteria colorized scanning electron micrograph - 22.jpg",
    "ocean-base.jpg": "File:Puerto Galera underwater (6).jpg",
    "jungle-detail.jpg": "File:The rain is a vital part of the temperate rainforest ecosystem. (1de781c1-a1f9-432f-916c-0f0fcf103ea9).jpg",
    "city-base.jpg": "File:Crowd holding umbrellas (Unsplash).jpg",
    "singularity-base.jpg": "File:Plunge- Behind the Scenes Creating NASA's Black Hole Visualization (SVS14818).jpg",
}


def request_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.load(response)


def fetch_bytes(url: str) -> bytes:
    last_error: Exception | None = None
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=120) as response:
                return response.read()
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code not in (429, 503):
                raise
            time.sleep(12 + attempt * 8)
        except Exception as exc:  # transient network timeout
            last_error = exc
            time.sleep(6 + attempt * 5)
    raise RuntimeError(f"download failed after retries: {last_error}")


credits = []
for filename, title in ASSETS.items():
    output = ROOT / filename
    if output.exists() and output.stat().st_size > 25_000:
        print(f"cached {filename} {output.stat().st_size}", flush=True)
        continue

    params = {
        "action": "query",
        "titles": title,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size",
        "iiurlwidth": "2200",
        "format": "json",
        "origin": "*",
    }
    api_url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    data = request_json(api_url)
    page = next(iter(data["query"]["pages"].values()))
    info = page["imageinfo"][0]
    meta = info.get("extmetadata", {})
    url = info.get("thumburl") or info["url"]
    blob = fetch_bytes(url)
    output.write_bytes(blob)

    credits.append(
        {
            "file": filename,
            "title": title,
            "source": info.get("descriptionurl"),
            "license": meta.get("LicenseShortName", {}).get("value", "See source"),
            "artist": meta.get("Artist", {}).get("value", ""),
            "source_width": info.get("width"),
            "source_height": info.get("height"),
        }
    )
    print(f"saved {filename} {len(blob)}", flush=True)
    time.sleep(5)

(ROOT / "credits.json").write_text(json.dumps(credits, indent=2), encoding="utf-8")
print("COMPLETE", flush=True)
