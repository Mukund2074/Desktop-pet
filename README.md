# Desktop Pet — Cozy Pixel Cat 🐱

A lightweight, **offline-only**, cross-platform desktop companion built with **Rust + Tauri 2**.

A tiny pixel-art cat lives directly on your desktop — transparent frameless window, always on top, random walks, idle/sleep/jump/eat/play animations. No tracking, no network, no account. Like the cozy Drifty cat aesthetic, but 100% original art and no productivity features.

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)

---

## Features

- Transparent, frameless, shadowless window that sits on the desktop
- Always-on-top (toggleable), skip taskbar/dock — lives in tray/menu bar
- **9 animations**: idle, walk left/right, sitting, sleeping, happy, jumping, eating, playing
- Random autonomous movement within visible desktop, clamped to screen bounds
- Multi-monitor aware (union of all monitors)
- Drag with mouse, double-click for random interaction, right-click context menu
- System tray / menu-bar icon (show/hide, settings, quit)
- Local persistence via `tauri-plugin-store` (position, size, speed, preferences)
- Minimal CPU/RAM — single 160×160 window, CSS/SVG sprite, `requestAnimationFrame` movement
- Fully offline — no backend, no telemetry

### Context menu (right-click)

- Feed, Play, Sleep, Jump
- Change pet (hue-rotate variant; swap in `assets/pets/cat/*`)
- Settings, Hide, Quit

### Settings window

- Start with OS (autostart via `tauri-plugin-autostart`)
- Pet size (0.5×–2.5×), animation speed (0.5×–2×), walking frequency
- Always-on-top toggle
- Sound toggle (tiny WebAudio meow)
- Reset position, show pet, quit
- Privacy note

---

## Privacy

This app **does not**:

- Record screen / take screenshots
- Track apps, websites, keystrokes, or mouse outside the pet
- Collect analytics or telemetry
- Contact any remote server
- Require an account
- Read browser history or files

All data stays in `settings.json` via Tauri Store on the local machine.

---

## Project structure

```
desktop-pet/
├── src/                    # shared Rust modules (mirrored in src-tauri/src for build)
│   ├── main.rs             # Tauri setup, window events, tray init
│   ├── pet/
│   │   ├── mod.rs
│   │   ├── animation.rs    # Animation enum (9 states, frame counts, intervals)
│   │   └── behavior.rs     # Behavior picker, walk-freq logic
│   ├── tray/mod.rs         # System tray menu (show/hide/settings/quit)
│   └── settings/mod.rs     # Persisted settings + Tauri commands
├── src-tauri/              # Tauri app crate (built)
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json     # windows: pet (transparent) + settings
│   ├── icons/              # PNG/ICO/ICNS (see Assets below)
│   └── src/                # ← actual build source (synced from src/)
├── src/                    # frontend (Vite)
│   ├── pet.js              # sprite rendering, behavior loop, window move, drag, menu
│   ├── settings.js         # settings UI + store sync
│   └── styles/
│       ├── pet.css         # transparent window, pixel-art, animations
│       └── settings.css
├── index.html              # pet window
├── settings.html           # settings window
├── assets/
│   ├── pets/cat/{idle,walk,sit,sleep,happy,jump,eat,play}/frame*.svg
│   └── icons/
├── scripts/generate-assets.mjs
├── vite.config.js
└── package.json
```

Suggested structure from spec is implemented; additional `src-tauri/src` is required by Tauri.

---

## Tech stack

- Rust 1.77+ / Tauri 2, `tao`/`wry`
- Vite 5 frontend, `@tauri-apps/api` 2, `@tauri-apps/plugin-store` 2, `@tauri-apps/plugin-autostart` 2
- Pure SVG/CSS pixel art — no image dependencies at runtime, `image-rendering: pixelated`

---

## Prerequisites

- Rust stable + `rustup` — https://rustup.rs
- Node 18+ / pnpm (or npm/yarn)
- Platform deps:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Windows**: WebView2 (preinstalled on Win10/11), Visual Studio Build Tools with C++ workload
  - **Linux** (not required but works): `webkit2gtk`, `libayatana-appindicator`, etc.

---

## Development

```bash
# 1. Clone & install JS deps
pnpm install

# 2. Generate placeholder assets (original SVGs + icons)
node scripts/generate-assets.mjs

# 3. Run in dev (Vite + Tauri)
pnpm tauri dev
# or: pnpm dev          # Vite only (no window/tray)
# or: npx tauri dev

# Cargo check
cargo check --manifest-path src-tauri/Cargo.toml
```

The pet window is `transparent + decorations:false + shadow:false + alwaysOnTop + skipTaskbar + acceptFirstMouse` — it appears directly on the desktop with no window chrome.

Tip: if Tauri dev fails to start the window, ensure `dist/` exists first:

```bash
pnpm build
pnpm tauri dev
```

---

## Production builds

```bash
# All targets for current OS
pnpm tauri build
# or
pnpm build && cargo build --manifest-path src-tauri/Cargo.toml --release

# Artifacts in src-tauri/target/release/bundle/
#   macOS:  .app (and .dmg if configured) — src-tauri/target/release/bundle/macos/
#   Windows: .msi + .exe — src-tauri/target/release/bundle/msi/, /nsis/
```

### macOS

```bash
pnpm tauri build
# Codesign/notarize for distribution:
#   set APPLE_SIGNING_IDENTITY + APPLE_ID + APPLE_PASSWORD in env
#   tauri.conf.json → bundle.macOS.signingIdentity
```

Minimum: macOS 10.15 (configurable in `tauri.conf.json`).

### Windows

```powershell
pnpm tauri build
# Requires WebView2 runtime (bundled via downloadBootstrapper in tauri.conf.json)
# Output: src-tauri/target/release/bundle/msi/DesktopPet_0.1.0_x64_en-US.msi
```

Cross-compiling: build on the target OS (or use GitHub Actions — see below).

---

## Asset generation

All cat art is original. No Drifty assets are used.

- Inline renderer in `src/pet.js` → `catSVG()` draws a 16×16 warm tabby (orange `#f6a66a`, cream belly, pink nose) with variant eyes/mouth/tail. Works offline with zero image loads.
- Placeholders also written to `assets/pets/cat/*/*.svg` by `scripts/generate-assets.mjs`.
- To use hand-drawn art: export 32×32 or 64×64 PNGs with transparent background into the same folders and update `CAT_FRAMES` in `pet.js` to load them.

```bash
node scripts/generate-assets.mjs   # regenerate SVGs + placeholder icons
```

Icons: source is `src-tauri/icons/icon.svg`. Export to PNG/ICO/ICNS for store builds:

```bash
# Example: use sips (macOS) or sharp/icotool
sips -z 512 512 src-tauri/icons/icon.svg --out src-tauri/icons/icon.png
```

Current dev placeholders are solid-color PNGs — replace before release.

---

## Configuration

- `src-tauri/tauri.conf.json` — window sizes (pet: 160×160), transparency, tray icon, bundle identifiers.
- `src/pet.js` — `defaults` (walkFreq, animSpeed, etc.), behavior timings.
- `src/styles/pet.css` — `--scale`, animation keyframes.

Persistence: `settings.json` via Tauri Store (app data dir). Keys: `petSize`, `animSpeed`, `walkFreq`, `alwaysOnTop`, `sound`, `autostart`, `pos`.

---

## Troubleshooting

- **Transparent window shows white on Windows**: ensure graphics drivers up to date; WRY uses WebView2 which supports transparency on Win10 1809+.
- **Pet not visible**: check tray icon → Show Pet; or delete store file at platform app-data dir.
- **Autostart not working (macOS)**: allow in System Settings → General → Login Items.
- **Build error about icons**: ensure `src-tauri/icons/icon.png` exists (run generate script).

---

## Performance

- Single frameless window, no shadow, `requestAnimationFrame` window moves batched via `setPosition`
- Sprite: one inline SVG swapped every 160–900 ms (scaled by `animSpeed`), CSS wobble/breathe keyframes
- Idle poll: one timer + random roll; movement clamped; position saved debounced (600 ms)
- No polling of screen, no background workers

---

## Roadmap

- More pet variants (dog, capybara) — add `assets/pets/dog/*` + hue/palette switcher
- Click-to-feed particle effect
- Optional lightweight sounds (WAV)
- Reduce motion accessibility toggle

---

## License

MIT
```

---

## Optional: GitHub Actions (macOS + Windows bundles)

Add `.github/workflows/build.yml`:

```yaml
name: Build
on: [push]
jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: node scripts/generate-assets.mjs
      - run: pnpm tauri build
      - uses: actions/upload-artifact@v4
        with:
          path: src-tauri/target/release/bundle
```
