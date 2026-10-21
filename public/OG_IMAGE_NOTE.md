# Brand assets

All files are generated from one geometric source, `scripts/brand/build_logo.py`
(`pip install skia-python`, then `python3 scripts/brand/build_logo.py <out-dir>`).
Vectors only, no traced bitmaps:

- `logo.svg` – full logo, transparent background (white "t" inside the badge, red wordmark).
- `logo-white.svg` – reverse version for red or photo backgrounds.
- `tariften-icon.svg` – rounded app-style icon.
- `favicon.ico` – 16/32/48 px use the simplified badge (badge + t), 64–256 px the full icon.
- `apple-touch-icon.png` – 180 px, full-bleed (iOS masks the corners).
- `og-image.jpg` – 1200×630 share image (cream background, logo, tagline).
