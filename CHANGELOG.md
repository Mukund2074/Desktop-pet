# Changelog

All notable changes to Desktop Pet will be documented here.

## [0.1.0] - 2026-09-14

### Added
- Transparent frameless desktop window (160×160) — always-on-top, skipTaskbar, no shadow
- Original pixel-art cat (16×16 warm tabby) with 9 animations: idle, walk left/right, sit, sleep, happy, jump, eat, play
- Random autonomous movement within monitor union (multi-monitor support), clamped to screen bounds
- Drag with mouse (native `startDragging` + manual fallback), double-click random interaction, right-click context menu
- System tray / menu-bar icon (Show/Hide, Settings, Quit)
- Local persistence via `tauri-plugin-store` (position, size, speed, preferences) — offline only
- Settings window: startup, pet size, animation speed, walking frequency, always-on-top, sound, reset position
- Tauri 2 + Rust backend, Vite frontend, `capabilities/default.json` ACL for window/store/autostart
- Icons: 512×512 + 32×32 + .icns/.ico via `scripts/generate-assets.mjs`
- Privacy: no screen recording, no analytics, no network

### Fixed
- ACL `plugin:window|set_position not allowed` — added capabilities
- `macOSPrivateApi` + `macos-private-api` feature for transparent cutout
- Walk leg stepping and isTauri detection race
