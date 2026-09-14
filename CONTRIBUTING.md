# Contributing to Desktop Pet

Thanks for your interest in contributing! This is a lightweight, offline-only desktop companion — we keep it simple, private, and cozy.

## Getting Started

1. **Fork** the repo and clone your fork
   ```bash
   git clone git@github.com:YOUR_USERNAME/Desktop-pet.git
   cd Desktop-pet
   pnpm install
   node scripts/generate-assets.mjs
   pnpm tauri dev
   ```
2. Create a feature branch: `git checkout -b feat/my-pet-variant`

## Project Structure

```
src/pet.js              # sprite, behavior loop, window move, drag, menu
src/styles/pet.css      # transparent window + animations
src-tauri/src/          # Rust: tray, settings, pet behavior
assets/pets/cat/        # SVG frames per animation
src-tauri/capabilities/default.json # Tauri ACL (window, store, autostart)
```

## Guidelines

- **Privacy first:** No network, no analytics, no tracking. All data stays in `settings.json` via `tauri-plugin-store`.
- **Keep it light:** Single 160×160 transparent window, `requestAnimationFrame`, minimal CPU/RAM. No heavy deps.
- **Original art only:** Do not copy proprietary assets. Add new pets under `assets/pets/<name>/` and update `src/pet.js` `CAT_FRAMES`.
- **Cross-platform:** Test on macOS and Windows. Transparent frameless window must stay cutout, draggable (`data-tauri-drag-region` + `startDragging` fallback), multi-monitor aware (`availableMonitors()` union).
- **Code style:** `cargo fmt` for Rust, `pnpm build` must pass, no `console` spam in release.

## Pull Request Process

1. Run checks:
   ```bash
   pnpm build
   cargo check --manifest-path src-tauri/Cargo.toml
   pnpm tauri build # at least one platform
   ```
2. Update `README.md` and `assets/README.md` if you add pets or settings.
3. Describe privacy impact (should be none) and test on at least one OS.
4. PR title: `feat:`, `fix:`, `docs:`, `chore:`.

## Reporting Issues

- Include OS, Tauri version (`pnpm tauri info`), and `src-tauri/target/release/bundle` logs.
- For transparent/drag/walk bugs, attach `screencapture -l$(windowNumber) -x` crop and `~/Library/Logs` if relevant.

## Adding a New Pet

1. Export 32×32 transparent PNG frames to `assets/pets/<pet>/{idle,walk,sit,sleep,happy,jump,eat,play}/frame*.png`
2. Update `src/pet.js` `catSVG()` or `CAT_FRAMES` to load them
3. Regenerate icons if needed: `node scripts/generate-assets.mjs` → replace `src-tauri/icons/icon.png` etc.
4. Test `pet size`, `animation speed`, `walkFreq` in Settings.

## Release

Maintainers tag `vX.Y.Z` — GitHub Action builds macOS + Windows bundles and attaches `dmg`/`msi` to the release.

## License

By contributing, you agree your contributions are licensed under the MIT License.
