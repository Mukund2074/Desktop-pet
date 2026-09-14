#!/usr/bin/env node
// Generates original pixel-cat assets and tray/app icons.
// No external dependencies — pure JS SVG → PNG via inline pixel data would need canvas,
// so we generate SVGs and simple PNGs via base64 1x1 scaled placeholders.
// For production, replace with your own exported PNGs.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Reuse catSVG from pet.js — duplicated for standalone generation
function catSVG(variant) {
  const eyes = [
    `<rect x="5" y="6" width="2" height="2" fill="#2b2118"/>`,
    `<rect x="5" y="6.5" width="2" height="1" fill="#2b2118"/>`,
  ];
  // minimal — generate one representative idle svg
  return `<svg viewBox="0 0 16 16" width="128" height="128" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
  <rect x="13.2" y="10.2" width="2.2" height="1" rx="0.5" fill="#f6a66a" stroke="#6b3f2a" stroke-width="0.15"/>
  <rect x="4.5" y="9" width="6" height="4" rx="1" fill="#f6a66a" stroke="#6b3f2a" stroke-width="0.18"/>
  <rect x="5" y="10.2" width="5" height="1.8" rx="0.6" fill="#fff6e6"/>
  <rect x="5" y="12.2" width="1.2" height="1.2" rx="0.3" fill="#fff6e6" stroke="#6b3f2a" stroke-width="0.12"/>
  <rect x="8.8" y="12.2" width="1.2" height="1.2" rx="0.3" fill="#fff6e6" stroke="#6b3f2a" stroke-width="0.12"/>
  <rect x="4" y="3" width="8" height="7" rx="2" fill="#f6a66a" stroke="#6b3f2a" stroke-width="0.2"/>
  <path d="M4.6 3.4 L5.6 1.6 L6.6 3.4 Z" fill="#f6a66a" stroke="#6b3f2a" stroke-width="0.15"/>
  <path d="M9.4 3.4 L10.4 1.6 L11.4 3.4 Z" fill="#f6a66a" stroke="#6b3f2a" stroke-width="0.15"/>
  <path d="M5.05 2.7 L5.6 1.9 L6 2.7 Z" fill="#ff9eb5"/>
  <path d="M10 2.7 L10.4 1.9 L11 2.7 Z" fill="#ff9eb5"/>
  <rect x="5" y="6" width="2" height="2" fill="#2b2118"/><rect x="9" y="6" width="2" height="2" fill="#2b2118"/>
  <rect x="7.6" y="7.2" width="0.8" height="0.6" rx="0.2" fill="#ff9eb5" stroke="#6b3f2a" stroke-width="0.08"/>
  <rect x="7.5" y="8" width="1" height="0.5" fill="#2b2118"/>
  <line x1="2.8" y1="7.6" x2="4" y2="7.6" stroke="#6b3f2a" stroke-width="0.12"/>
  <line x1="12" y1="7.6" x2="13.2" y2="7.6" stroke="#6b3f2a" stroke-width="0.12"/>
</svg>`;
}

const anims = {
  "idle": 2, "walk": 2, "sit": 1, "sleep": 2, "happy": 2, "jump": 1, "eat": 2, "play": 2
};

// Create SVG frames per animation (original cozy pixel cat)
for (const [anim, count] of Object.entries(anims)) {
  for (let i = 0; i < count; i++) {
    const svg = catSVG(i);
    const dir = path.join(root, `assets/pets/cat/${anim}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `frame${i}.svg`), svg);
  }
}

// Minimal tray/app icons: generate a 512x512 SVG and copy as placeholder PNG paths
// Tauri will accept PNGs; for now we generate real PNGs via a 1x1 base64 + instruct to replace.
const iconSVG = `<svg viewBox="0 0 32 32" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
<rect width="32" height="32" rx="7" fill="#fdf6ee"/>
<rect x="7" y="9" width="18" height="14" rx="4" fill="#f6a66a" stroke="#6b3f2a" stroke-width="0.5"/>
<path d="M9 9 L12 4 L14 9 Z" fill="#f6a66a" stroke="#6b3f2a" stroke-width="0.4"/>
<path d="M18 9 L21 4 L23 9 Z" fill="#f6a66a" stroke="#6b3f2a" stroke-width="0.4"/>
<circle cx="12" cy="14" r="1.4" fill="#2b2118"/><circle cx="20" cy="14" r="1.4" fill="#2b2118"/>
<rect x="15.2" y="16" width="1.6" height="1.1" rx="0.4" fill="#ff9eb5"/>
</svg>`;

fs.mkdirSync(path.join(root, "src-tauri/icons"), { recursive: true });
fs.writeFileSync(path.join(root, "src-tauri/icons/icon.svg"), iconSVG);

// Generate a real 1x1 PNG placeholder as fallback (Tauri needs PNG/ICO/ICNS at build)
// Create minimal valid PNGs via base64 of a 32x32 orange square
const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKklEQVR4nO3QMQEAAAQEMPb/57EBLcYBUV7k5O7uAsQIECBAgAABAn4G1wEBgO0yVwAAAABJRU5ErkJggg==";
const pngBuf = Buffer.from(pngBase64, "base64");

// Write placeholder PNGs — replace these with proper exported icons for store builds
for (const name of ["icon.png", "tray.png"]) {
  fs.writeFileSync(path.join(root, "src-tauri/icons", name), pngBuf);
  console.log(`placeholder ${name} written — replace with 512x512 (icon.png) and 32x32 (tray.png) for production`);
}

// ICO/ICNS placeholders: Tauri build will succeed with PNG; ICO/ICNS are optional when targets=all
// Copy PNG as fallback for those extensions to avoid missing-icon errors in dev
for (const name of ["icon.ico", "icon.icns"]) {
  fs.writeFileSync(path.join(root, "src-tauri/icons", name), pngBuf);
}

console.log("Assets generated in assets/pets/cat/* and src-tauri/icons/");
console.log("Tip: export icon.svg to PNG (512, 256, 128, 32) and convert to .ico/.icns for store builds.");
