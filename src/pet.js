// Desktop Pet — frontend logic
// Robust Tauri detection: try to load Tauri APIs, fall back to browser mocks only if import fails
let store, petWindow, invoke, availableMonitors, primaryMonitor, listenFn;
let isTauri = false;
let initError = "";
try {
  const win = await import("@tauri-apps/api/window");
  const core = await import("@tauri-apps/api/core");
  const storeLib = await import("@tauri-apps/plugin-store");
  const eventLib = await import("@tauri-apps/api/event");
  availableMonitors = win.availableMonitors;
  primaryMonitor = win.primaryMonitor;
  invoke = core.invoke;
  store = new storeLib.LazyStore("settings.json");
  petWindow = win.getCurrentWindow();
  listenFn = eventLib.listen;
  isTauri = true;
  console.info("[pet] Tauri mode");
} catch (err) {
  initError = (err?.message || String(err)).slice(0, 80);
  console.info("[pet] Browser preview mode — using mocks (Tauri not available)", initError);
  isTauri = false;
}

// Force transparent background for cutout (critical for macOS transparent window)
try {
  document.documentElement.style.background = "transparent";
  document.documentElement.style.backgroundColor = "rgba(0,0,0,0)";
  document.body.style.background = "transparent";
  document.body.style.backgroundColor = "rgba(0,0,0,0)";
} catch {}

if (!isTauri) {
  const LS_PREFIX = "desktop-pet:";
  store = {
    get: async (key) => { try { const value = localStorage.getItem(LS_PREFIX + key); return value ? JSON.parse(value) : undefined; } catch { return undefined; } },
    set: async (key, value) => { try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)); } catch {} },
    save: async () => {},
  };
  invoke = async () => null;
  availableMonitors = async () => [];
  primaryMonitor = async () => null;
  listenFn = async () => () => {};
  petWindow = {
    label: "pet",
    setAlwaysOnTop: async () => {},
    setPosition: async () => {},
    outerPosition: async () => ({ x: 200, y: 200 }),
    outerSize: async () => ({ width: 160, height: 160 }),
    startDragging: async () => {},
    show: async () => {},
    setFocus: async () => {},
    hide: async () => {},
    close: async () => {},
    onCloseRequested: () => {},
  };
}

// ─────────────────────────────────────────────────────────────
// SVG Pet Templates — 5 fully articulated pets
// ─────────────────────────────────────────────────────────────
const PET_TEMPLATES = {
  kitten: {
    name: "Mochi",
    speech: "Meow~ 🐾",
    color: "#f8e4ff",
    svg: `
    <svg class="pet-svg" viewBox="0 0 120 120" style="overflow:visible;width:100%;height:100%;">
      <g class="pet-root" transform="translate(60, 60)">
        <g class="limb-tail" transform="translate(32, 10)">
          <!-- tail: dual stroke — thick outer colour, thin ink edge -->
          <path d="M 0 0 Q 22 -15 15 -35 Q 12 -42 20 -40" fill="none" stroke="#3d2314" stroke-width="10" stroke-linecap="round" opacity="0.18"/>
          <path d="M 0 0 Q 22 -15 15 -35 Q 12 -42 20 -40" fill="none" stroke="#e9d5ff" stroke-width="8" stroke-linecap="round"/>
          <path d="M 0 0 Q 22 -15 15 -35 Q 12 -42 20 -40" fill="none" stroke="#3d2314" stroke-width="2.2" stroke-linecap="round" opacity="0.7"/>
        </g>
        <g class="limb-leg-back" transform="translate(18, 20)">
          <rect x="-6" y="0" width="12" height="24" rx="6" fill="#f3e8ff" stroke="#3d2314" stroke-width="2" stroke-linejoin="round"/>
          <ellipse cx="0" cy="22" rx="6" ry="4" fill="#e9d5ff" stroke="#3d2314" stroke-width="1.6"/>
        </g>
        <g class="body-group">
          <ellipse cx="0" cy="14" rx="26" ry="22" fill="#fdf4ff" stroke="#3d2314" stroke-width="2.5"/>
          <!-- soft belly shading -->
          <ellipse cx="0" cy="22" rx="16" ry="8" fill="#e9d5ff" opacity="0.35"/>
        </g>
        <g class="limb-leg-front" transform="translate(-14, 20)">
          <rect x="-5" y="0" width="10" height="24" rx="5" fill="#fdf4ff" stroke="#3d2314" stroke-width="2" stroke-linejoin="round"/>
          <ellipse cx="0" cy="22" rx="5" ry="3.5" fill="#f3e8ff" stroke="#3d2314" stroke-width="1.6"/>
        </g>
        <g class="head-group" transform="translate(2, -14)">
          <!-- ears — outer ink stroke, no stroke on inner pink -->
          <polygon points="-22,-16 -28,-36 -8,-24" fill="#fdf4ff" stroke="#3d2314" stroke-width="2.2" stroke-linejoin="round"/>
          <polygon points="-20,-18 -25,-32 -11,-22" fill="#fbcfe8"/>
          <polygon points="22,-16 28,-36 8,-24" fill="#fdf4ff" stroke="#3d2314" stroke-width="2.2" stroke-linejoin="round"/>
          <polygon points="20,-18 25,-32 11,-22" fill="#fbcfe8"/>
          <circle cx="0" cy="0" r="26" fill="#fdf4ff" stroke="#3d2314" stroke-width="2.5"/>
          <!-- head shading -->
          <ellipse cx="0" cy="10" rx="17" ry="9" fill="#e9d5ff" opacity="0.22"/>
          <g class="face-expr">
            <circle cx="-9" cy="-3" r="3" fill="#1e293b" class="eye-shape"/>
            <circle cx="9" cy="-3" r="3" fill="#1e293b" class="eye-shape"/>
            <circle cx="-10" cy="-4" r="1" fill="#fff"/>
            <circle cx="8" cy="-4" r="1" fill="#fff"/>
            <polygon points="0,2 -3,0 3,0" fill="#f472b6"/>
            <path d="M -3 4 Q 0 7 3 4" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" class="mouth-shape"/>
            <circle cx="-16" cy="2" r="4.5" fill="#fbcfe8" opacity="0.6"/>
            <circle cx="16" cy="2" r="4.5" fill="#fbcfe8" opacity="0.6"/>
          </g>
        </g>
        <g class="limb-arm-left" transform="translate(-16, 2)">
          <rect x="-4" y="0" width="8" height="18" rx="4" fill="#fdf4ff" stroke="#3d2314" stroke-width="1.8" stroke-linejoin="round" transform="rotate(15)"/>
        </g>
        <g class="limb-arm-right" transform="translate(16, 2)">
          <rect x="-4" y="0" width="8" height="18" rx="4" fill="#fdf4ff" stroke="#3d2314" stroke-width="1.8" stroke-linejoin="round" transform="rotate(-15)"/>
        </g>
      </g>
    </svg>`
  },
  puppy: {
    name: "Biscuit",
    speech: "Woof! 🦴",
    color: "#fff7ed",
    svg: `
    <svg class="pet-svg" viewBox="0 0 120 120" style="overflow:visible;width:100%;height:100%;">
      <g class="pet-root" transform="translate(60, 60)">
        <g class="limb-tail" transform="translate(30, 8)">
          <path d="M 0 0 Q 18 -12 25 -25" fill="none" stroke="#3d2314" stroke-width="9.5" stroke-linecap="round" opacity="0.18"/>
          <path d="M 0 0 Q 18 -12 25 -25" fill="none" stroke="#fed7aa" stroke-width="7" stroke-linecap="round"/>
          <path d="M 0 0 Q 18 -12 25 -25" fill="none" stroke="#3d2314" stroke-width="2" stroke-linecap="round" opacity="0.65"/>
        </g>
        <g class="limb-leg-back" transform="translate(16, 22)">
          <rect x="-6" y="0" width="12" height="22" rx="6" fill="#ffedd5" stroke="#3d2314" stroke-width="2" stroke-linejoin="round"/>
          <ellipse cx="0" cy="20" rx="6" ry="4" fill="#fed7aa" stroke="#3d2314" stroke-width="1.6"/>
        </g>
        <g class="body-group">
          <ellipse cx="0" cy="15" rx="28" ry="21" fill="#fff7ed" stroke="#3d2314" stroke-width="2.5"/>
          <!-- belly shading -->
          <ellipse cx="0" cy="23" rx="17" ry="7" fill="#fed7aa" opacity="0.3"/>
          <circle cx="-12" cy="18" r="6" fill="#fbcfe8" opacity="0.3"/>
        </g>
        <g class="limb-leg-front" transform="translate(-14, 22)">
          <rect x="-5" y="0" width="10" height="22" rx="5" fill="#fff7ed" stroke="#3d2314" stroke-width="2" stroke-linejoin="round"/>
          <ellipse cx="0" cy="20" rx="5" ry="3.5" fill="#ffedd5" stroke="#3d2314" stroke-width="1.6"/>
        </g>
        <g class="head-group" transform="translate(0, -12)">
          <!-- floppy ears -->
          <path d="M -22 -10 Q -38 5 -24 22 Z" fill="#ffedd5" stroke="#3d2314" stroke-width="2" stroke-linejoin="round"/>
          <path d="M 22 -10 Q 38 5 24 22 Z" fill="#ffedd5" stroke="#3d2314" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="0" cy="0" r="27" fill="#fff7ed" stroke="#3d2314" stroke-width="2.5"/>
          <!-- head shading -->
          <ellipse cx="0" cy="11" rx="18" ry="8" fill="#fed7aa" opacity="0.2"/>
          <g class="face-expr">
            <circle cx="-9" cy="-4" r="3" fill="#1e293b" class="eye-shape"/>
            <circle cx="9" cy="-4" r="3" fill="#1e293b" class="eye-shape"/>
            <circle cx="-10" cy="-5" r="1" fill="#fff"/>
            <circle cx="8" cy="-5" r="1" fill="#fff"/>
            <ellipse cx="0" cy="1" rx="4" ry="3" fill="#1e293b"/>
            <path d="M -4 6 Q 0 11 4 6" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" class="mouth-shape"/>
            <path d="M -2 9 Q 0 14 2 9 Z" fill="#f472b6" class="tongue-shape"/>
          </g>
        </g>
        <g class="limb-arm-left" transform="translate(-18, 4)">
          <rect x="-4" y="0" width="8" height="16" rx="4" fill="#fff7ed" stroke="#3d2314" stroke-width="1.8" stroke-linejoin="round" transform="rotate(20)"/>
        </g>
        <g class="limb-arm-right" transform="translate(18, 4)">
          <rect x="-4" y="0" width="8" height="16" rx="4" fill="#fff7ed" stroke="#3d2314" stroke-width="1.8" stroke-linejoin="round" transform="rotate(-20)"/>
        </g>
      </g>
    </svg>`
  },
  bunny: {
    name: "Cotton",
    speech: "Hop! 🥕",
    color: "#f0fdf4",
    svg: `
    <svg class="pet-svg" viewBox="0 0 120 120" style="overflow:visible;width:100%;height:100%;">
      <g class="pet-root" transform="translate(60, 60)">
        <g class="head-group" transform="translate(0, -16)">
          <!-- ears — outer stroke, inner pink no stroke -->
          <ellipse cx="-10" cy="-30" rx="6" ry="20" fill="#f0fdf4" stroke="#3d2314" stroke-width="2" transform="rotate(-10 -10 -30)" class="left-ear"/>
          <ellipse cx="-10" cy="-30" rx="3" ry="14" fill="#fbcfe8" transform="rotate(-10 -10 -30)"/>
          <ellipse cx="10" cy="-30" rx="6" ry="20" fill="#f0fdf4" stroke="#3d2314" stroke-width="2" transform="rotate(10 10 -30)" class="right-ear"/>
          <ellipse cx="10" cy="-30" rx="3" ry="14" fill="#fbcfe8" transform="rotate(10 10 -30)"/>
          <circle cx="0" cy="0" r="25" fill="#f0fdf4" stroke="#3d2314" stroke-width="2.5"/>
          <!-- head shading -->
          <ellipse cx="0" cy="10" rx="15" ry="7" fill="#bbf7d0" opacity="0.3"/>
          <g class="face-expr">
            <circle cx="-8" cy="-3" r="2.5" fill="#1e293b" class="eye-shape"/>
            <circle cx="8" cy="-3" r="2.5" fill="#1e293b" class="eye-shape"/>
            <polygon points="0,2 -2.5,-0.5 2.5,-0.5" fill="#f472b6"/>
            <path d="M -2.5 2 Q 0 5 2.5 2" fill="none" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="-14" cy="2" r="4" fill="#fbcfe8" opacity="0.6"/>
            <circle cx="14" cy="2" r="4" fill="#fbcfe8" opacity="0.6"/>
          </g>
        </g>
        <g class="limb-leg-back" transform="translate(18, 22)">
          <ellipse cx="0" cy="6" rx="8" ry="12" fill="#dcfce7" stroke="#3d2314" stroke-width="2" transform="rotate(20)"/>
        </g>
        <g class="body-group">
          <ellipse cx="0" cy="18" rx="24" ry="20" fill="#f0fdf4" stroke="#3d2314" stroke-width="2.5"/>
          <!-- belly shading -->
          <ellipse cx="0" cy="26" rx="14" ry="7" fill="#bbf7d0" opacity="0.3"/>
          <!-- fluffy tail -->
          <circle cx="26" cy="16" r="6" fill="#ffffff" stroke="#3d2314" stroke-width="2"/>
        </g>
        <g class="limb-leg-front" transform="translate(-12, 24)">
          <rect x="-4" y="0" width="8" height="18" rx="4" fill="#f0fdf4" stroke="#3d2314" stroke-width="1.8" stroke-linejoin="round"/>
        </g>
        <g class="limb-arm-left" transform="translate(-15, 8)">
          <rect x="-3" y="0" width="6" height="14" rx="3" fill="#f0fdf4" stroke="#3d2314" stroke-width="1.6" stroke-linejoin="round" transform="rotate(30)"/>
        </g>
        <g class="limb-arm-right" transform="translate(15, 8)">
          <rect x="-3" y="0" width="6" height="14" rx="3" fill="#f0fdf4" stroke="#3d2314" stroke-width="1.6" stroke-linejoin="round" transform="rotate(-30)"/>
        </g>
      </g>
    </svg>`
  },
  hamster: {
    name: "Pip",
    speech: "Squeak! 🌻",
    color: "#fefce8",
    svg: `
    <svg class="pet-svg" viewBox="0 0 120 120" style="overflow:visible;width:100%;height:100%;">
      <g class="pet-root" transform="translate(60, 60)">
        <g class="limb-leg-back" transform="translate(14, 26)">
          <ellipse cx="0" cy="4" rx="7" ry="5" fill="#fef08a" stroke="#3d2314" stroke-width="1.8"/>
        </g>
        <g class="body-group">
          <ellipse cx="0" cy="16" rx="30" ry="24" fill="#fefce8" stroke="#3d2314" stroke-width="2.5"/>
          <!-- cheek pouches with ink -->
          <path d="M -26 10 Q -32 20 -24 28" fill="#fef08a" stroke="#3d2314" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M 26 10 Q 32 20 24 28" fill="#fef08a" stroke="#3d2314" stroke-width="1.8" stroke-linecap="round"/>
          <!-- belly shading -->
          <ellipse cx="0" cy="26" rx="18" ry="7" fill="#fde047" opacity="0.22"/>
        </g>
        <g class="limb-leg-front" transform="translate(-12, 26)">
          <ellipse cx="0" cy="4" rx="6" ry="5" fill="#fef9c3" stroke="#3d2314" stroke-width="1.8"/>
        </g>
        <g class="head-group" transform="translate(0, -6)">
          <!-- round ears -->
          <circle cx="-18" cy="-14" r="8" fill="#fefce8" stroke="#3d2314" stroke-width="2"/>
          <circle cx="-18" cy="-14" r="4" fill="#fbcfe8"/>
          <circle cx="18" cy="-14" r="8" fill="#fefce8" stroke="#3d2314" stroke-width="2"/>
          <circle cx="18" cy="-14" r="4" fill="#fbcfe8"/>
          <ellipse cx="0" cy="-2" rx="28" ry="24" fill="#fefce8" stroke="#3d2314" stroke-width="2.5"/>
          <!-- head shading -->
          <ellipse cx="0" cy="10" rx="17" ry="7" fill="#fde047" opacity="0.2"/>
          <g class="face-expr">
            <circle cx="-10" cy="-5" r="3" fill="#1e293b" class="eye-shape"/>
            <circle cx="10" cy="-5" r="3" fill="#1e293b" class="eye-shape"/>
            <circle cx="-11" cy="-6" r="1" fill="#fff"/>
            <circle cx="9" cy="-6" r="1" fill="#fff"/>
            <polygon points="0,0 -2.5,-2.5 2.5,-2.5" fill="#f472b6"/>
            <path d="M -2 2 Q 0 5 2 2" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
            <circle cx="-17" cy="1" r="5" fill="#fbcfe8" opacity="0.6"/>
            <circle cx="17" cy="1" r="5" fill="#fbcfe8" opacity="0.6"/>
          </g>
        </g>
        <g class="limb-arm-left" transform="translate(-18, 12)">
          <rect x="-3" y="0" width="6" height="12" rx="3" fill="#fefce8" stroke="#3d2314" stroke-width="1.6" stroke-linejoin="round" transform="rotate(45)"/>
        </g>
        <g class="limb-arm-right" transform="translate(18, 12)">
          <rect x="-3" y="0" width="6" height="12" rx="3" fill="#fefce8" stroke="#3d2314" stroke-width="1.6" stroke-linejoin="round" transform="rotate(-45)"/>
        </g>
      </g>
    </svg>`
  },
  bear: {
    name: "Snowball",
    speech: "Grr... (Cute) ❄️",
    color: "#f0f9ff",
    svg: `
    <svg class="pet-svg" viewBox="0 0 120 120" style="overflow:visible;width:100%;height:100%;">
      <g class="pet-root" transform="translate(60, 60)">
        <g class="limb-leg-back" transform="translate(18, 22)">
          <rect x="-7" y="0" width="14" height="22" rx="7" fill="#e0f2fe" stroke="#3d2314" stroke-width="2" stroke-linejoin="round"/>
          <ellipse cx="0" cy="20" rx="7" ry="4" fill="#bae6fd" stroke="#3d2314" stroke-width="1.6"/>
        </g>
        <g class="body-group">
          <ellipse cx="0" cy="16" rx="30" ry="24" fill="#f0f9ff" stroke="#3d2314" stroke-width="2.5"/>
          <!-- belly shading -->
          <ellipse cx="0" cy="26" rx="18" ry="8" fill="#bae6fd" opacity="0.28"/>
        </g>
        <g class="limb-leg-front" transform="translate(-16, 22)">
          <rect x="-6" y="0" width="12" height="22" rx="6" fill="#f0f9ff" stroke="#3d2314" stroke-width="2" stroke-linejoin="round"/>
          <ellipse cx="0" cy="20" rx="6" ry="4" fill="#e0f2fe" stroke="#3d2314" stroke-width="1.6"/>
        </g>
        <g class="head-group" transform="translate(0, -12)">
          <!-- bear ears -->
          <circle cx="-20" cy="-18" r="9" fill="#f0f9ff" stroke="#3d2314" stroke-width="2.2"/>
          <circle cx="-20" cy="-18" r="4.5" fill="#fbcfe8"/>
          <circle cx="20" cy="-18" r="9" fill="#f0f9ff" stroke="#3d2314" stroke-width="2.2"/>
          <circle cx="20" cy="-18" r="4.5" fill="#fbcfe8"/>
          <circle cx="0" cy="0" r="28" fill="#f0f9ff" stroke="#3d2314" stroke-width="2.5"/>
          <!-- head shading -->
          <ellipse cx="0" cy="12" rx="18" ry="8" fill="#bae6fd" opacity="0.22"/>
          <g class="face-expr">
            <circle cx="-10" cy="-4" r="3" fill="#1e293b" class="eye-shape"/>
            <circle cx="10" cy="-4" r="3" fill="#1e293b" class="eye-shape"/>
            <circle cx="-11" cy="-5" r="1" fill="#fff"/>
            <circle cx="9" cy="-5" r="1" fill="#fff"/>
            <ellipse cx="0" cy="2" rx="7" ry="5" fill="#e0f2fe"/>
            <ellipse cx="0" cy="1" rx="3.5" ry="2.5" fill="#1e293b"/>
            <path d="M -3 6 Q 0 9 3 6" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" class="mouth-shape"/>
          </g>
        </g>
        <g class="limb-arm-left" transform="translate(-20, 6)">
          <rect x="-5" y="0" width="10" height="16" rx="5" fill="#f0f9ff" stroke="#3d2314" stroke-width="1.8" stroke-linejoin="round" transform="rotate(20)"/>
        </g>
        <g class="limb-arm-right" transform="translate(20, 6)">
          <rect x="-5" y="0" width="10" height="16" rx="5" fill="#f0f9ff" stroke="#3d2314" stroke-width="1.8" stroke-linejoin="round" transform="rotate(-20)"/>
        </g>
      </g>
    </svg>`
  }
};

const PET_TYPE_ORDER = ["kitten", "puppy", "bunny", "hamster", "bear"];

// ─────────────────────────────────────────────────────────────
// Per-pet default limb transforms (restored before each state)
// ─────────────────────────────────────────────────────────────
const LIMB_DEFAULTS = {
  kitten:  { armLeft: "translate(-16, 2)",  armRight: "translate(16, 2)",  legBack: "translate(18, 20)",  legFront: "translate(-14, 20)", head: "translate(2, -14)",  body: "translate(0, 0)", tail: "translate(32, 10)" },
  puppy:   { armLeft: "translate(-18, 4)",  armRight: "translate(18, 4)",  legBack: "translate(16, 22)",  legFront: "translate(-14, 22)", head: "translate(0, -12)",  body: "translate(0, 0)", tail: "translate(30, 8)"  },
  bunny:   { armLeft: "translate(-15, 8)",  armRight: "translate(15, 8)",  legBack: "translate(18, 22)",  legFront: "translate(-12, 24)", head: "translate(0, -16)", body: "translate(0, 0)", tail: null               },
  hamster: { armLeft: "translate(-18, 12)", armRight: "translate(18, 12)", legBack: "translate(14, 26)",  legFront: "translate(-12, 26)", head: "translate(0, -6)",  body: "translate(0, 0)", tail: null               },
  bear:    { armLeft: "translate(-20, 6)",  armRight: "translate(20, 6)",  legBack: "translate(18, 22)",  legFront: "translate(-16, 22)", head: "translate(0, -12)", body: "translate(0, 0)", tail: null               },
};

// ─────────────────────────────────────────────────────────────
// DOM references
// ─────────────────────────────────────────────────────────────
const stage = document.getElementById("pet-stage");
const petEl = document.getElementById("pet");
const bubble = document.getElementById("bubble");
const bubbleText = document.getElementById("bubble-text");
const ctxMenu = document.getElementById("ctx-menu");

function debugLog(msg) { try { console.log("[pet]", msg); } catch {} }

// ─────────────────────────────────────────────────────────────
// Settings state
// ─────────────────────────────────────────────────────────────
const defaults = {
  petSize: 1,
  animSpeed: 1,
  walkFreq: 0.5,
  walk_interval: "auto",
  alwaysOnTop: true,
  sound: false,
  autostart: false,
  pos: null,
  petType: "kitten",
};
let settings = { ...defaults };
let animSpeed = 1;

async function loadSettings() {
  try {
    for (const key of Object.keys(defaults)) {
      const value = await store.get(key);
      if (value !== undefined && value !== null) settings[key] = value;
    }
    // migration: older versions stored walkInterval (camelCase)
    try {
      const legacy = await store.get("walkInterval");
      if (legacy && !settings.walk_interval) settings.walk_interval = legacy;
    } catch {}
    try { const saved = await invoke("get_settings"); if (saved) settings = { ...settings, ...saved }; } catch {}
    // ensure walk_interval has a value
    if (!settings.walk_interval) settings.walk_interval = "auto";
  } catch (err) { console.warn("store load fail", err); }
  applySettings();
}

async function saveSettings() {
  for (const [key, value] of Object.entries(settings)) await store.set(key, value);
  await store.save().catch(() => {});
  try { await invoke("save_settings", { settings }); } catch {}
}

function applySettings() {
  animSpeed = settings.animSpeed || 1;
  stage.style.setProperty("--scale", String(settings.petSize || 1));
  document.documentElement.style.setProperty("--anim-speed", String(animSpeed));
  if (isTauri) petWindow.setAlwaysOnTop(settings.alwaysOnTop).catch(() => {});
}

// ─────────────────────────────────────────────────────────────
// Pet animator — drives limb transforms via rAF
// ─────────────────────────────────────────────────────────────
class PetAnimator {
  constructor(type) {
    this.type = type;
    this.facing = 1; // 1 = right, -1 = left
    this.state = "idle";
    this._limbs = {};
    this._rafId = null;
    this._inject(type);
    this._cacheLimbs();
    this._startLoop();
  }

  _inject(type) {
    const template = PET_TEMPLATES[type];
    petEl.innerHTML = template.svg;
    // Apply a subtle tint glow matching the pet color
    petEl.style.filter = `drop-shadow(0 8px 16px ${template.color}cc)`;
    // Update bubble text to pet's speech
    bubbleText.textContent = template.speech;
  }

  _cacheLimbs() {
    const root = petEl.querySelector(".pet-root");
    this._limbs = {
      root,
      body:     petEl.querySelector(".body-group"),
      head:     petEl.querySelector(".head-group"),
      armLeft:  petEl.querySelector(".limb-arm-left"),
      armRight: petEl.querySelector(".limb-arm-right"),
      legBack:  petEl.querySelector(".limb-leg-back"),
      legFront: petEl.querySelector(".limb-leg-front"),
      tail:     petEl.querySelector(".limb-tail"),
    };
  }

  _startLoop() {
    const loop = () => {
      const tick = Date.now() / 100;
      this._animate(tick);
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  stop() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  setState(newState) {
    this.state = newState;
  }

  setFacing(direction) {
    this.facing = direction;
  }

  _resetLimbs() {
    const def = LIMB_DEFAULTS[this.type];
    if (!def) return;
    const limbs = this._limbs;
    if (limbs.root)     limbs.root.setAttribute("transform", `translate(60, 60) scale(${this.facing}, 1)`);
    if (limbs.armLeft)  limbs.armLeft.setAttribute("transform", def.armLeft);
    if (limbs.armRight) limbs.armRight.setAttribute("transform", def.armRight);
    if (limbs.legBack)  limbs.legBack.setAttribute("transform", def.legBack);
    if (limbs.legFront) limbs.legFront.setAttribute("transform", def.legFront);
    if (limbs.head)     limbs.head.setAttribute("transform", def.head);
    if (limbs.body)     limbs.body.setAttribute("transform", def.body);
    if (limbs.tail && def.tail) limbs.tail.setAttribute("transform", def.tail);
  }

  _animate(tick) {
    this._resetLimbs();
    const limbs = this._limbs;
    const def = LIMB_DEFAULTS[this.type];
    const breath = Math.sin(tick * 0.15) * 1.5;
    const spd = animSpeed || 1;

    switch (this.state) {
      case "idle": {
        if (limbs.body) limbs.body.setAttribute("transform", `translate(0, ${breath}) scale(1, ${1 + breath * 0.01})`);
        if (limbs.head && def.head) limbs.head.setAttribute("transform", `${def.head.replace(")", "")} ) translate(0, ${(breath * 0.5).toFixed(2)})`);
        if (limbs.tail && def.tail) {
          const tailSway = Math.sin(tick * 0.3) * 8;
          limbs.tail.setAttribute("transform", `${def.tail} rotate(${tailSway.toFixed(2)})`);
        }
        break;
      }
      case "walk": {
        const walkCycle = tick * 0.8 * spd;
        const legBack = Math.sin(walkCycle) * 15;
        const legFront = Math.sin(walkCycle + Math.PI) * 15;
        const bodyBounce = Math.abs(Math.sin(walkCycle * 2)) * -4;

        if (limbs.body) limbs.body.setAttribute("transform", `translate(0, ${bodyBounce.toFixed(2)})`);
        if (limbs.head && def.head) {
          const headParts = def.head.match(/translate\(([^)]+)\)/);
          if (headParts) {
            const coords = headParts[1].split(",").map(Number);
            limbs.head.setAttribute("transform", `translate(${coords[0]}, ${(coords[1] + bodyBounce * 0.5).toFixed(2)})`);
          }
        }
        if (limbs.legBack && def.legBack) limbs.legBack.setAttribute("transform", `${def.legBack} rotate(${legBack.toFixed(2)})`);
        if (limbs.legFront && def.legFront) limbs.legFront.setAttribute("transform", `${def.legFront} rotate(${legFront.toFixed(2)})`);
        if (limbs.armLeft && def.armLeft) limbs.armLeft.setAttribute("transform", `${def.armLeft} rotate(${(-legBack * 0.8).toFixed(2)})`);
        if (limbs.armRight && def.armRight) limbs.armRight.setAttribute("transform", `${def.armRight} rotate(${(-legFront * 0.8).toFixed(2)})`);
        if (limbs.tail && def.tail) {
          const tailWag = Math.sin(walkCycle) * 15;
          limbs.tail.setAttribute("transform", `${def.tail} rotate(${tailWag.toFixed(2)})`);
        }
        break;
      }
      case "sit": {
        if (limbs.body) limbs.body.setAttribute("transform", "translate(0, 8) scale(1.05, 0.95)");
        if (limbs.head && def.head) {
          const headParts = def.head.match(/translate\(([^)]+)\)/);
          if (headParts) {
            const coords = headParts[1].split(",").map(Number);
            limbs.head.setAttribute("transform", `translate(${coords[0]}, ${(coords[1] + 8).toFixed(2)})`);
          }
        }
        if (limbs.legBack && def.legBack) limbs.legBack.setAttribute("transform", `${def.legBack} rotate(45) scale(0.8)`);
        if (limbs.legFront && def.legFront) limbs.legFront.setAttribute("transform", `${def.legFront} rotate(-45) scale(0.8)`);
        break;
      }
      case "love": {
        const loveBounce = Math.abs(Math.sin(tick * 0.6)) * -12;
        if (limbs.body) limbs.body.setAttribute("transform", `translate(0, ${loveBounce.toFixed(2)})`);
        if (limbs.head && def.head) {
          const headParts = def.head.match(/translate\(([^)]+)\)/);
          if (headParts) {
            const coords = headParts[1].split(",").map(Number);
            limbs.head.setAttribute("transform", `translate(${coords[0]}, ${(coords[1] + loveBounce).toFixed(2)})`);
          }
        }
        if (limbs.armRight && def.armRight) {
          const armParts = def.armRight.match(/translate\(([^)]+)\)/);
          if (armParts) {
            const coords = armParts[1].split(",").map(Number);
            limbs.armRight.setAttribute("transform", `translate(${coords[0]}, ${coords[1] - 6}) rotate(-75)`);
          }
        }
        break;
      }
      case "happy": {
        // Alias for love — same bounce, used by context menu / drag release
        const happyBounce = Math.abs(Math.sin(tick * 0.7)) * -10;
        if (limbs.body) limbs.body.setAttribute("transform", `translate(0, ${happyBounce.toFixed(2)})`);
        if (limbs.armLeft && def.armLeft) limbs.armLeft.setAttribute("transform", `${def.armLeft} rotate(-30)`);
        if (limbs.armRight && def.armRight) limbs.armRight.setAttribute("transform", `${def.armRight} rotate(30)`);
        break;
      }
      case "angry": {
        const shake = (Math.random() - 0.5) * 4;
        if (limbs.body) limbs.body.setAttribute("transform", `translate(${shake.toFixed(2)}, 0)`);
        if (limbs.armLeft && def.armLeft) {
          const parts = def.armLeft.match(/translate\(([^)]+)\)/);
          if (parts) {
            const coords = parts[1].split(",").map(Number);
            limbs.armLeft.setAttribute("transform", `translate(${coords[0] - 4}, ${coords[1]}) rotate(-35)`);
          }
        }
        if (limbs.armRight && def.armRight) {
          const parts = def.armRight.match(/translate\(([^)]+)\)/);
          if (parts) {
            const coords = parts[1].split(",").map(Number);
            limbs.armRight.setAttribute("transform", `translate(${coords[0] + 4}, ${coords[1]}) rotate(35)`);
          }
        }
        break;
      }
      case "sleep": {
        const sleepBreath = Math.sin(tick * 0.1) * 2;
        if (limbs.body) limbs.body.setAttribute("transform", `translate(0, 6) scale(1, ${(0.92 + sleepBreath * 0.02).toFixed(4)})`);
        if (limbs.head && def.head) {
          const headParts = def.head.match(/translate\(([^)]+)\)/);
          if (headParts) {
            const coords = headParts[1].split(",").map(Number);
            limbs.head.setAttribute("transform", `translate(${coords[0] + 4}, ${coords[1] + 10}) rotate(12)`);
          }
        }
        if (limbs.armLeft && def.armLeft) {
          const parts = def.armLeft.match(/translate\(([^)]+)\)/);
          if (parts) {
            const coords = parts[1].split(",").map(Number);
            limbs.armLeft.setAttribute("transform", `translate(${coords[0]}, ${coords[1] + 12}) rotate(60)`);
          }
        }
        if (limbs.armRight && def.armRight) {
          const parts = def.armRight.match(/translate\(([^)]+)\)/);
          if (parts) {
            const coords = parts[1].split(",").map(Number);
            limbs.armRight.setAttribute("transform", `translate(${coords[0]}, ${coords[1] + 12}) rotate(-60)`);
          }
        }
        break;
      }
      default:
        break;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Active animator instance
// ─────────────────────────────────────────────────────────────
let animator = null;

function spawnPet(type) {
  if (animator) animator.stop();
  animator = new PetAnimator(type);
  animator.setState("idle");
}

function setAnimation(name) {
  if (!animator) return;
  // Map old pixel-cat animation names → new state names
  const stateMap = {
    "idle": "idle",
    "walk": "walk",
    "walk-left": "walk",
    "walk-right": "walk",
    "sit": "sit",
    "sitting": "sit",
    "happy": "happy",
    "love": "love",
    "angry": "angry",
    "sleep": "sleep",
    "sleeping": "sleep",
    "jump": "happy",
    "eat": "happy",
    "play": "happy",
  };
  const mapped = stateMap[name] ?? "idle";
  animator.setState(mapped);

  // Flip facing for directional walk states
  if (name === "walk-left") animator.setFacing(-1);
  else if (name === "walk-right") animator.setFacing(1);
}

// ─────────────────────────────────────────────────────────────
// Bubble helpers
// ─────────────────────────────────────────────────────────────
let bubbleTimer = null;

function showBubble(text, ms = 1800) {
  bubbleText.textContent = text;
  bubble.classList.remove("hidden");
  if (bubbleTimer) clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.add("hidden"), ms);
}

// ─────────────────────────────────────────────────────────────
// Screen bounds + movement
// ─────────────────────────────────────────────────────────────
let isDragging = false;
let behaviorTimer = null;
let moveRaf = null;
let positionSaveTimer = null;

function clampNumber(value, min, max) { return Math.max(min, Math.min(max, value)); }

async function getScreenBounds() {
  try {
    if (!isTauri) {
      return { x: 0, y: 0, w: window.screen ? window.screen.width : 1920, h: window.screen ? (window.screen.height - 40) : 1080 };
    }
    const monitors = await availableMonitors();
    if (!monitors || monitors.length === 0) {
      const monitor = await primaryMonitor();
      if (monitor) return { x: monitor.position.x, y: monitor.position.y, w: monitor.size.width, h: monitor.size.height };
      return { x: 0, y: 0, w: 1920, h: 1080 };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const monitor of monitors) {
      minX = Math.min(minX, monitor.position.x);
      minY = Math.min(minY, monitor.position.y);
      maxX = Math.max(maxX, monitor.position.x + monitor.size.width);
      maxY = Math.max(maxY, monitor.position.y + monitor.size.height);
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  } catch {
    return { x: 0, y: 0, w: 1920, h: 1080 };
  }
}

let mockPos = { x: 100, y: 100 };

function applyMockPos(posX, posY) {
  if (isTauri) return;
  const stageEl = document.getElementById("pet-stage");
  document.body.style.justifyContent = "flex-start";
  document.body.style.alignItems = "flex-start";
  stageEl.style.position = "fixed";
  stageEl.style.left = posX + "px";
  stageEl.style.top = posY + "px";
  stageEl.style.transform = `scale(var(--scale))`;
}

async function moveWindowTo(targetX, targetY, animate = true, duration = 1200) {
  if (!isTauri) {
    const startX = mockPos.x, startY = mockPos.y;
    const startTime = performance.now();
    const ease = (progress) => progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
    return new Promise((resolve) => {
      function step(now) {
        const progress = clampNumber((now - startTime) / duration, 0, 1);
        const eased = ease(progress);
        const nextX = startX + (targetX - startX) * eased;
        const nextY = startY + (targetY - startY) * eased;
        const clampedX = clampNumber(nextX, 0, window.innerWidth - 160);
        const clampedY = clampNumber(nextY, 0, window.innerHeight - 160);
        applyMockPos(clampedX, clampedY);
        mockPos.x = clampedX; mockPos.y = clampedY;
        if (progress < 1) moveRaf = requestAnimationFrame(step);
        else resolve();
      }
      moveRaf = requestAnimationFrame(step);
    });
  }
  if (!animate) { await petWindow.setPosition({ type: "Physical", x: Math.round(targetX), y: Math.round(targetY) }).catch(() => {}); return; }
  const start = await petWindow.outerPosition().catch(() => ({ x: targetX, y: targetY }));
  const startX = start.x ?? targetX, startY = start.y ?? targetY;
  const startTime = performance.now();
  const ease = (progress) => progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
  return new Promise((resolve) => {
    function step(now) {
      const progress = clampNumber((now - startTime) / duration, 0, 1);
      const eased = ease(progress);
      const nextX = startX + (targetX - startX) * eased;
      const nextY = startY + (targetY - startY) * eased;
      petWindow.setPosition({ type: "Physical", x: Math.round(nextX), y: Math.round(nextY) }).catch(() => {});
      if (progress < 1) moveRaf = requestAnimationFrame(step);
      else resolve();
    }
    moveRaf = requestAnimationFrame(step);
  });
}

// ─────────────────────────────────────────────────────────────
// Autonomous behavior loop — respects walk_interval (auto/30s/1m/2m/5m/still)
// ─────────────────────────────────────────────────────────────
let lastWalkAt = 0;
function getWalkIntervalMs() {
  const v = settings.walk_interval || "auto";
  if (v === "still") return Infinity;
  if (v === "auto") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n * 1000 : null;
}
async function randomWalk() {
  if (isDragging) return;
  const roll = Math.random();
  const walkFreq = settings.walkFreq ?? 0.5;
  const intervalMs = getWalkIntervalMs();
  const now = Date.now();
  const isStill = intervalMs === Infinity;
  const shouldForceWalk = intervalMs !== null && !isStill && (now - lastWalkAt >= intervalMs);

  if (roll < 0.12) {
    setAnimation("sitting");
    showBubble(["*purr*", "zZ...", "..."][Math.floor(Math.random() * 3)]);
    scheduleNext(2000 + Math.random() * 3000);
    return;
  }
  if (roll < 0.18) {
    setAnimation("sleep");
    showBubble("💤");
    scheduleNext(3000 + Math.random() * 4000);
    return;
  }
  if (roll < 0.22) {
    setAnimation("happy");
    const template = PET_TEMPLATES[settings.petType || "kitten"];
    showBubble([template.speech, "💖", "✨"][Math.floor(Math.random() * 3)]);
    setTimeout(() => setAnimation("idle"), 1400);
    scheduleNext(1800 + Math.random() * 2500);
    return;
  }
  // Walk interval: still = never walk, fixed interval = force walk when elapsed, auto = random
  const doWalk = isStill ? false : (shouldForceWalk || roll < walkFreq + 0.15);
  if (doWalk) {
    lastWalkAt = Date.now();
    const bounds = await getScreenBounds();
    const winSize = isTauri ? await petWindow.outerSize().catch(() => ({ width: 160, height: 160 })) : { width: 160, height: 160 };
    const pad = 12;
    const maxW = isTauri ? (bounds.w - winSize.width - pad * 2) : (window.innerWidth - winSize.width - pad * 2);
    const maxH = isTauri ? (bounds.h - winSize.height - pad * 2 - 40) : (window.innerHeight - winSize.height - pad * 2 - 20);
    const targetX = (isTauri ? bounds.x : 0) + pad + Math.random() * Math.max(40, maxW);
    const targetY = (isTauri ? bounds.y : 0) + pad + Math.random() * Math.max(40, maxH);
    const current = isTauri ? await petWindow.outerPosition().catch(() => ({ x: targetX, y: targetY })) : { ...mockPos };
    const direction = targetX > (current.x ?? targetX) ? "walk-right" : "walk-left";
    setAnimation(direction);
    const dist = Math.hypot(targetX - (current.x ?? targetX), targetY - (current.y ?? targetY));
    const walkDuration = clampNumber(dist * 2.2, 700, 2600) / animSpeed;
    await moveWindowTo(targetX, targetY, true, walkDuration);
    if (isTauri) { mockPos.x = targetX; mockPos.y = targetY; }
    setAnimation("idle");
    savePositionDebounced();
  } else {
    setAnimation("idle");
    if (Math.random() < 0.25) showBubble(["...", "*looks around*", "👀"][Math.floor(Math.random() * 3)], 1200);
  }
  scheduleNext(1200 + Math.random() * 3200);
}

function scheduleNext(ms) {
  if (behaviorTimer) clearTimeout(behaviorTimer);
  behaviorTimer = setTimeout(randomWalk, ms / animSpeed);
}

function savePositionDebounced() {
  if (positionSaveTimer) clearTimeout(positionSaveTimer);
  positionSaveTimer = setTimeout(async () => {
    try {
      const pos = isTauri ? await petWindow.outerPosition() : { ...mockPos };
      settings.pos = { x: pos.x, y: pos.y };
      await saveSettings();
    } catch {}
  }, 600);
}

async function restorePosition() {
  if (!settings.pos || typeof settings.pos.x !== "number") return;
  if (!isTauri) {
    mockPos.x = clampNumber(settings.pos.x, 0, window.innerWidth - 160);
    mockPos.y = clampNumber(settings.pos.y, 0, window.innerHeight - 160);
    applyMockPos(mockPos.x, mockPos.y);
    return;
  }
  const bounds = await getScreenBounds();
  const winSize = await petWindow.outerSize().catch(() => ({ width: 160, height: 160 }));
  const clampedX = clampNumber(settings.pos.x, bounds.x, bounds.x + bounds.w - winSize.width);
  const clampedY = clampNumber(settings.pos.y, bounds.y, bounds.y + bounds.h - winSize.height);
  await petWindow.setPosition({ type: "Physical", x: Math.round(clampedX), y: Math.round(clampedY) }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────
// Drag interaction
// ─────────────────────────────────────────────────────────────
const dragOffset = { x: 0, y: 0 };

petEl.addEventListener("mousedown", async (event) => {
  if (event.button !== 0) return;
  isDragging = true;
  if (behaviorTimer) clearTimeout(behaviorTimer);
  if (moveRaf) cancelAnimationFrame(moveRaf);
  if (isTauri) {
    let nativeDragSucceeded = false;
    try {
      await petWindow.startDragging();
      nativeDragSucceeded = true;
    } catch (err) {
      console.warn("[pet] startDragging failed, fallback to manual", err);
    }
    if (nativeDragSucceeded) {
      isDragging = false;
      savePositionDebounced();
      setAnimation("happy");
      showBubble("Wee!");
      setTimeout(() => setAnimation("idle"), 1000);
      scheduleNext(1200);
      return;
    }
    // Manual fallback
    try {
      const startPos = await petWindow.outerPosition();
      const startMouse = { x: event.screenX, y: event.screenY };
      const onMove = async (moveEvent) => {
        const deltaX = moveEvent.screenX - startMouse.x;
        const deltaY = moveEvent.screenY - startMouse.y;
        await petWindow.setPosition({ type: "Physical", x: Math.round(startPos.x + deltaX), y: Math.round(startPos.y + deltaY) }).catch(() => {});
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        isDragging = false;
        savePositionDebounced();
        setAnimation("happy");
        showBubble("Wee!");
        setTimeout(() => setAnimation("idle"), 1000);
        scheduleNext(1200);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    } catch (err) {
      console.warn("[pet] manual drag init failed", err);
      isDragging = false;
      scheduleNext(1200);
    }
  } else {
    dragOffset.x = event.clientX - mockPos.x;
    dragOffset.y = event.clientY - mockPos.y;
    const onMove = (moveEvent) => {
      mockPos.x = clampNumber(moveEvent.clientX - dragOffset.x, 0, window.innerWidth - 160);
      mockPos.y = clampNumber(moveEvent.clientY - dragOffset.y, 0, window.innerHeight - 160);
      applyMockPos(mockPos.x, mockPos.y);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      isDragging = false;
      savePositionDebounced();
      setAnimation("happy");
      showBubble("Wee!");
      setTimeout(() => setAnimation("idle"), 1000);
      scheduleNext(1200);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }
});
petEl.addEventListener("dragstart", (event) => event.preventDefault());

// ─────────────────────────────────────────────────────────────
// Click / double-click interaction
// ─────────────────────────────────────────────────────────────
let lastClickTime = 0;
petEl.addEventListener("click", (event) => {
  const now = Date.now();
  if (now - lastClickTime < 300) {
    const petTemplate = PET_TEMPLATES[settings.petType || "kitten"];
    const reactions = [
      () => { setAnimation("happy"); showBubble("Boing!"); setTimeout(() => setAnimation("idle"), 700); },
      () => { setAnimation("love"); showBubble(`💖 ${petTemplate.name}!`); setTimeout(() => setAnimation("idle"), 1200); },
      () => { setAnimation("happy"); showBubble("🧶"); setTimeout(() => setAnimation("idle"), 1400); },
      () => { setAnimation("happy"); showBubble("Nom nom"); setTimeout(() => setAnimation("idle"), 1500); },
    ];
    reactions[Math.floor(Math.random() * reactions.length)]();
    if (settings.sound) playMeow();
  }
  lastClickTime = now;
});

function playMeow() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = 420 + Math.random() * 120;
    gainNode.gain.value = 0.08;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    oscillator.stop(audioCtx.currentTime + 0.36);
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// Context menu
// ─────────────────────────────────────────────────────────────
petEl.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  ctxMenu.style.left = `${event.clientX}px`;
  ctxMenu.style.top = `${event.clientY}px`;
  ctxMenu.classList.remove("hidden");
  requestAnimationFrame(() => {
    const rect = ctxMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) ctxMenu.style.left = `${window.innerWidth - rect.width - 8}px`;
    if (rect.bottom > window.innerHeight) ctxMenu.style.top = `${window.innerHeight - rect.height - 8}px`;
  });
});
document.addEventListener("click", (event) => { if (!ctxMenu.contains(event.target)) ctxMenu.classList.add("hidden"); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") ctxMenu.classList.add("hidden"); });

ctxMenu.addEventListener("click", async (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;
  ctxMenu.classList.add("hidden");
  switch (action) {
    case "feed":
      setAnimation("happy"); showBubble("Yum! 🍖"); setTimeout(() => setAnimation("idle"), 1500);
      break;
    case "play":
      setAnimation("happy"); showBubble("Let's play! 🧶");
      setTimeout(() => setAnimation("happy"), 1400);
      setTimeout(() => setAnimation("idle"), 2200);
      break;
    case "sleep":
      setAnimation("sleep"); showBubble("Shh... 💤");
      break;
    case "jump":
      setAnimation("happy"); showBubble("Wheee!"); setTimeout(() => setAnimation("idle"), 700);
      break;
    case "change": {
      const currentType = settings.petType || "kitten";
      const currentIndex = PET_TYPE_ORDER.indexOf(currentType);
      const nextType = PET_TYPE_ORDER[(currentIndex + 1) % PET_TYPE_ORDER.length];
      settings.petType = nextType;
      await saveSettings();
      spawnPet(nextType);
      setAnimation("idle");
      scheduleNext(1200);
      const nextTemplate = PET_TEMPLATES[nextType];
      showBubble(`Hi! I'm ${nextTemplate.name} ✨`);
      break;
    }
    case "settings":
      try { await invoke("open_settings"); } catch { window.open("/settings.html", "_blank"); }
      break;
    case "hide":
      try { await invoke("hide_pet"); showBubble("Bye! Use tray to show me"); } catch { await petWindow.hide(); }
      break;
    case "quit":
      try { await invoke("quit_app"); } catch { await petWindow.close(); }
      break;
  }
});

// ─────────────────────────────────────────────────────────────
// Tauri IPC events
// ─────────────────────────────────────────────────────────────
if (isTauri && listenFn) {
  try {
    await listenFn("settings-updated", (event) => {
      const updated = event.payload;
      if (updated) { settings = { ...settings, ...updated }; applySettings(); }
    });
    await listenFn("reset-position", async () => {
      const monitor = await primaryMonitor().catch(() => null);
      if (monitor) {
        const centerX = monitor.position.x + monitor.size.width / 2 - 80;
        const centerY = monitor.position.y + monitor.size.height / 2 - 80;
        await petWindow.setPosition({ type: "Physical", x: Math.round(centerX), y: Math.round(centerY) });
        await petWindow.show();
        await petWindow.setFocus();
        savePositionDebounced();
        setAnimation("happy"); showBubble("I'm back! 🏠");
        setTimeout(() => setAnimation("idle"), 1200);
      }
    });
    await listenFn("show-pet", async () => { await petWindow.show(); await petWindow.setFocus(); });
    await listenFn("sit-still", async () => {
      if (behaviorTimer) clearTimeout(behaviorTimer);
      setAnimation("sitting");
      showBubble("…sitting still 🧘");
      // stay sitting, don't walk until interval changes
      scheduleNext(4000 + Math.random() * 2000);
    });
    await listenFn("play-now", async () => {
      if (behaviorTimer) clearTimeout(behaviorTimer);
      setAnimation("play");
      showBubble("Let's play! 🧶");
      setTimeout(() => setAnimation("happy"), 1400);
      setTimeout(() => setAnimation("idle"), 2200);
      scheduleNext(1500);
    });
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────
await loadSettings();
await restorePosition();

const initialPetType = settings.petType || "kitten";
spawnPet(initialPetType);
setAnimation("idle");
scheduleNext(900);

petWindow.onCloseRequested(async () => {});
