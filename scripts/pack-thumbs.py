"""
Pack individual thumbnail frames (<dir>/<id>.webp) into a few sprite sheets.

Only used for the sandboxed claude.ai preview, which limits how many files one
page may ship. The preview's image shim reads <dir>/atlas.json and draws each
thumbnail as a tile of its sheet. GitHub Pages and the Next.js server keep using
individual images.

    python3 scripts/pack-thumbs.py <dir> [--order ids.txt]
"""
import json, os, sys
from PIL import Image

COLS, ROWS, W, H = 4, 4, 320, 180


def main():
    d = sys.argv[1]
    ids = sorted(f[:-5] for f in os.listdir(d) if f.endswith(".webp") and not f.startswith("atlas-"))
    if "--order" in sys.argv:
        wanted = [l.strip() for l in open(sys.argv[sys.argv.index("--order") + 1]) if l.strip()]
        ids = [i for i in wanted if i in set(ids)] + [i for i in ids if i not in set(wanted)]
    per = COLS * ROWS
    items = {}
    for a in range((len(ids) + per - 1) // per):
        sheet = Image.new("RGB", (COLS * W, ROWS * H), (35, 34, 41))
        for k, vid in enumerate(ids[a * per:(a + 1) * per]):
            img = Image.open(os.path.join(d, vid + ".webp")).convert("RGB")
            if img.size != (W, H):
                img = img.resize((W, H), Image.LANCZOS)
            c, r = k % COLS, k // COLS
            sheet.paste(img, (c * W, r * H))
            items[vid] = [a, c, r]
        sheet.save(os.path.join(d, f"atlas-{a}.webp"), "WEBP", quality=72, method=6)
    json.dump({"cols": COLS, "rows": ROWS, "count": a + 1, "items": items}, open(os.path.join(d, "atlas.json"), "w"))
    print(f"{len(ids)} thumbnails -> {a + 1} sheets")


main()
