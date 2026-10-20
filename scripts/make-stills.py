"""Write a static `*-still.webp` (first frame by default) next to each animated WebP.

The site swaps these in (via <picture>) when the visitor prefers reduced
motion. Re-run after adding or replacing an animation:

    python3 scripts/make-stills.py
"""
from pathlib import Path

from PIL import Image

ASSETS = Path(__file__).resolve().parent.parent / "public" / "assets"

# Animations whose first frame isn't representative (e.g. a loading screen).
STILL_FRAME = {
    "website-demo.webp": 12,
}


def main() -> None:
    for path in sorted(ASSETS.rglob("*.webp")):
        if path.stem.endswith("-still"):
            continue
        with Image.open(path) as im:
            if getattr(im, "n_frames", 1) < 2:
                continue
            im.seek(STILL_FRAME.get(path.name, 0))
            still = path.with_name(f"{path.stem}-still.webp")
            im.convert("RGBA").save(still, "WEBP", quality=85, method=6)
            print(f"{still.relative_to(ASSETS.parent)}  {still.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
