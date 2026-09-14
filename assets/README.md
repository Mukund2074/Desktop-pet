# Assets

All artwork here is **original** and created for this project. Do not copy proprietary Drifty assets.

## Cat sprites

- `assets/pets/cat/{idle,walk,sit,sleep,happy,jump,eat,play}/frame*.svg` — generated placeholders.
- The live pet uses **inline CSS/SVG rendering** (`src/pet.js` → `catSVG()`), so the app works with no external images and stays lightweight.
- Replace `frame*.svg` with hand-drawn pixel art exports for production. Recommended:
  - 32×32 or 64×64 per frame, `image-rendering: pixelated`
  - PNG with transparent background
  - 2 frames for idle/walk/sleep/happy/eat/play, 1 frame for sit/jump

### Regenerate placeholders

```bash
node scripts/generate-assets.mjs
```

### Adding a hand-drawn sprite sheet

1. Export frames as `assets/pets/cat/<anim>/frame0.png`, `frame1.png` ...
2. Update `src/pet.js` → `CAT_FRAMES` to load ` <img src="...">` or set `#sprite` background to the PNG.

## Icons

- `src-tauri/icons/icon.svg` — master vector (edit then export)
- `src-tauri/icons/icon.png` — 512×512 app icon
- `src-tauri/icons/tray.png` — 32×32 tray icon
- `src-tauri/icons/icon.ico` / `icon.icns` — Windows/macOS bundles

For store builds, export proper `.ico` (256, 48, 32, 16) and `.icns`:

```bash
# macOS: sips
sips -z 512 512 src-tauri/icons/icon.svg --out src-tauri/icons/icon.png

# Or use https://icon.kitchen / `sharp` / `icotool`
```
