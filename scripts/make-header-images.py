"""Build the derived parallax-header images from public/assets/header/layer-*.webp.

    python3 scripts/make-header-images.py

Writes:
  public/assets/header/layer-N-1500.webp   half-size layers for phones (srcset)
  src/assets/header-placeholder.webp       blurred 600x400 composite, inlined
                                           into the CSS as the loading backdrop
  public/assets/og/home.jpg                1200x630 link-preview image

Re-run after changing any header layer.
"""
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
HEADER = ROOT / "public" / "assets" / "header"
SKY = (0xFC, 0xF7, 0xF0)  # --warm-white, the daytime sky behind the layers


def layers() -> list[Path]:
    return sorted(HEADER.glob("layer-[0-9].webp"), key=lambda p: int(p.stem.split("-")[1]))


def composite(size: tuple[int, int]) -> Image.Image:
    scene = Image.new("RGBA", size, SKY + (255,))
    for path in layers():
        with Image.open(path) as im:
            scene.alpha_composite(im.convert("RGBA").resize(size, Image.LANCZOS))
    return scene.convert("RGB")


def report(path: Path) -> None:
    print(f"{path.relative_to(ROOT)}  {path.stat().st_size // 1024} KB")


def main() -> None:
    for path in layers():
        with Image.open(path) as im:
            half = im.resize((im.width // 2, im.height // 2), Image.LANCZOS)
            out = path.with_name(f"{path.stem}-1500.webp")
            # Lossy alpha: the silhouettes are where the bytes go, and at phone
            # size the difference is invisible.
            half.save(out, "WEBP", quality=80, alpha_quality=70, method=6)
            report(out)

    placeholder = composite((600, 400)).filter(ImageFilter.GaussianBlur(3))
    out = ROOT / "src" / "assets" / "header-placeholder.webp"
    out.parent.mkdir(exist_ok=True)
    placeholder.save(out, "WEBP", quality=60, method=6)
    report(out)

    # 3:2 scene at 1200 wide is 800 tall; trim to 630, mostly from the dark
    # foreground at the bottom so the peak keeps its headroom.
    scene = composite((1200, 800))
    top = 20
    og = scene.crop((0, top, 1200, top + 630))
    out = ROOT / "public" / "assets" / "og" / "home.jpg"
    og.save(out, "JPEG", quality=85, optimize=True, progressive=True)
    report(out)


if __name__ == "__main__":
    main()
