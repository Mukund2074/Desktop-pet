// Desktop Pet — five-pet full-desktop roaming
let store, petWindow, invoke, availableMonitors, primaryMonitor, listenFn;
let isTauri = false;
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
} catch (err) {
  console.warn("[pet] Tauri not available, using mocks", err);
  isTauri = false;
}
if (!isTauri) {
  const LS_PREFIX = "desktop-pet:";
  store = { get: async (k) => { try { const v = localStorage.getItem(LS_PREFIX + k); return v ? JSON.parse(v) : undefined; } catch { return undefined; } }, set: async (k,v) => { try { localStorage.setItem(LS_PREFIX + k, JSON.stringify(v)); } catch {} }, save: async () => {} };
  invoke = async () => null;
  availableMonitors = async () => [];
  primaryMonitor = async () => null;
  listenFn = async () => () => {};
  petWindow = { setPosition: async () => {}, show: async () => {}, setFocus: async () => {}, hide: async () => {}, setAlwaysOnTop: async () => {}, onCloseRequested: () => {}, label: "pet" };
}
document.documentElement.style.background = "transparent";
document.documentElement.style.backgroundColor = "rgba(0,0,0,0)";
document.body.style.background = "transparent";
document.body.style.backgroundColor = "rgba(0,0,0,0)";

// ── SVG Templates ──
const PET_TEMPLATES = {
  kitten: { name:"Mochi", speech:"Meow~", color:"#f8e4ff", svg:`<svg viewBox="0 0 120 120" style="overflow:visible;width:100%;height:100%"><g transform="translate(60,60)"><g class="limb-tail" transform="translate(32,10)"><path d="M0 0Q22-15 15-35Q12-42 20-40" fill="none" stroke="#3d2314" stroke-width="10" stroke-linecap="round" opacity=".18"/><path d="M0 0Q22-15 15-35Q12-42 20-40" fill="none" stroke="#e9d5ff" stroke-width="8" stroke-linecap="round"/><path d="M0 0Q22-15 15-35Q12-42 20-40" fill="none" stroke="#3d2314" stroke-width="2.2" stroke-linecap="round" opacity=".7"/></g><g class="limb-leg-back" transform="translate(18,20)"><rect x="-6" y="0" width="12" height="24" rx="6" fill="#f3e8ff" stroke="#3d2314" stroke-width="2"/><ellipse cx="0" cy="22" rx="6" ry="4" fill="#e9d5ff" stroke="#3d2314" stroke-width="1.6"/></g><g class="body-group"><ellipse cx="0" cy="14" rx="26" ry="22" fill="#fdf4ff" stroke="#3d2314" stroke-width="2.5"/><ellipse cx="0" cy="22" rx="16" ry="8" fill="#e9d5ff" opacity=".35"/></g><g class="limb-leg-front" transform="translate(-14,20)"><rect x="-5" y="0" width="10" height="24" rx="5" fill="#fdf4ff" stroke="#3d2314" stroke-width="2"/><ellipse cx="0" cy="22" rx="5" ry="3.5" fill="#f3e8ff" stroke="#3d2314" stroke-width="1.6"/></g><g class="head-group" transform="translate(2,-14)"><polygon points="-22,-16 -28,-36 -8,-24" fill="#fdf4ff" stroke="#3d2314" stroke-width="2.2"/><polygon points="-20,-18 -25,-32 -11,-22" fill="#fbcfe8"/><polygon points="22,-16 28,-36 8,-24" fill="#fdf4ff" stroke="#3d2314" stroke-width="2.2"/><polygon points="20,-18 25,-32 11,-22" fill="#fbcfe8"/><circle cx="0" cy="0" r="26" fill="#fdf4ff" stroke="#3d2314" stroke-width="2.5"/><ellipse cx="0" cy="10" rx="17" ry="9" fill="#e9d5ff" opacity=".22"/><g class="face-expr"><circle cx="-9" cy="-3" r="3" fill="#1e293b"/><circle cx="9" cy="-3" r="3" fill="#1e293b"/><circle cx="-10" cy="-4" r="1" fill="#fff"/><circle cx="8" cy="-4" r="1" fill="#fff"/><polygon points="0,2 -3,0 3,0" fill="#f472b6"/><path d="M-3 4Q0 7 3 4" fill="none" stroke="#1e293b" stroke-width="2"/><circle cx="-16" cy="2" r="4.5" fill="#fbcfe8" opacity=".6"/><circle cx="16" cy="2" r="4.5" fill="#fbcfe8" opacity=".6"/></g></g><g class="limb-arm-left" transform="translate(-16,2)"><rect x="-4" y="0" width="8" height="18" rx="4" fill="#fdf4ff" stroke="#3d2314" stroke-width="1.8" transform="rotate(15)"/></g><g class="limb-arm-right" transform="translate(16,2)"><rect x="-4" y="0" width="8" height="18" rx="4" fill="#fdf4ff" stroke="#3d2314" stroke-width="1.8" transform="rotate(-15)"/></g></g></svg>`},
  puppy: { name:"Biscuit", speech:"Woof!", color:"#fff7ed", svg:`<svg viewBox="0 0 120 120" style="overflow:visible;width:100%;height:100%"><g transform="translate(60,60)"><g class="limb-tail" transform="translate(30,8)"><path d="M0 0Q18-12 25-25" fill="none" stroke="#3d2314" stroke-width="9.5" stroke-linecap="round" opacity=".18"/><path d="M0 0Q18-12 25-25" fill="none" stroke="#fed7aa" stroke-width="7" stroke-linecap="round"/><path d="M0 0Q18-12 25-25" fill="none" stroke="#3d2314" stroke-width="2" stroke-linecap="round" opacity=".65"/></g><g class="limb-leg-back" transform="translate(16,22)"><rect x="-6" y="0" width="12" height="22" rx="6" fill="#ffedd5" stroke="#3d2314" stroke-width="2"/><ellipse cx="0" cy="20" rx="6" ry="4" fill="#fed7aa" stroke="#3d2314" stroke-width="1.6"/></g><g class="body-group"><ellipse cx="0" cy="15" rx="28" ry="21" fill="#fff7ed" stroke="#3d2314" stroke-width="2.5"/><ellipse cx="0" cy="23" rx="17" ry="7" fill="#fed7aa" opacity=".3"/></g><g class="limb-leg-front" transform="translate(-14,22)"><rect x="-5" y="0" width="10" height="22" rx="5" fill="#fff7ed" stroke="#3d2314" stroke-width="2"/><ellipse cx="0" cy="20" rx="5" ry="3.5" fill="#ffedd5" stroke="#3d2314" stroke-width="1.6"/></g><g class="head-group" transform="translate(0,-12)"><path d="M-22-10Q-38 5-24 22Z" fill="#ffedd5" stroke="#3d2314" stroke-width="2"/><path d="M22-10Q38 5 24 22Z" fill="#ffedd5" stroke="#3d2314" stroke-width="2"/><circle cx="0" cy="0" r="27" fill="#fff7ed" stroke="#3d2314" stroke-width="2.5"/><circle cx="-8" cy="-3" r="3" fill="#1e293b"/><circle cx="8" cy="-3" r="3" fill="#1e293b"/><path d="M-4 6Q0 11 4 6" fill="none" stroke="#1e293b" stroke-width="2"/><path d="M-2 9Q0 14 2 9Z" fill="#f472b6"/></g><g class="limb-arm-left" transform="translate(-18,4)"><rect x="-4" y="0" width="8" height="18" rx="4" fill="#fff7ed" stroke="#3d2314" stroke-width="1.8" transform="rotate(15)"/></g><g class="limb-arm-right" transform="translate(18,4)"><rect x="-4" y="0" width="8" height="18" rx="4" fill="#fff7ed" stroke="#3d2314" stroke-width="1.8" transform="rotate(-15)"/></g></g></svg>`},
  bunny: { name:"Clover", speech:"Hop!", color:"#f0fdf4", svg:`<svg viewBox="0 0 120 120" style="overflow:visible;width:100%;height:100%"><g transform="translate(60,60)"><g class="head-group" transform="translate(0,-16)"><ellipse cx="-10" cy="-30" rx="6" ry="20" fill="#f0fdf4" stroke="#3d2314" stroke-width="2" transform="rotate(-10,-10,-30)"/><ellipse cx="10" cy="-30" rx="6" ry="20" fill="#f0fdf4" stroke="#3d2314" stroke-width="2" transform="rotate(10,10,-30)"/><circle cx="0" cy="0" r="26" fill="#fff" stroke="#3d2314" stroke-width="2.5"/><circle cx="-8" cy="-3" r="3" fill="#1e293b"/><circle cx="8" cy="-3" r="3" fill="#1e293b"/><ellipse cx="0" cy="4" rx="3" ry="2" fill="#f9a8d4"/></g><g class="limb-leg-back" transform="translate(18,22)"><rect x="-5" y="0" width="10" height="20" rx="5" fill="#f0fdf4" stroke="#3d2314" stroke-width="2"/><ellipse cx="0" cy="18" rx="5" ry="3.5" fill="#dcfce7" stroke="#3d2314" stroke-width="1.6"/></g><g class="body-group"><ellipse cx="0" cy="12" rx="24" ry="20" fill="#f0fdf4" stroke="#3d2314" stroke-width="2.5"/><ellipse cx="0" cy="20" rx="14" ry="6" fill="#dcfce7" opacity=".3"/></g><g class="limb-leg-front" transform="translate(-12,24)"><rect x="-5" y="0" width="10" height="20" rx="5" fill="#f0fdf4" stroke="#3d2314" stroke-width="2"/><ellipse cx="0" cy="18" rx="5" ry="3.5" fill="#dcfce7" stroke="#3d2314" stroke-width="1.6"/></g><g class="limb-arm-left" transform="translate(-15,8)"><rect x="-4" y="0" width="8" height="16" rx="4" fill="#f0fdf4" stroke="#3d2314" stroke-width="1.8" transform="rotate(20)"/></g><g class="limb-arm-right" transform="translate(15,8)"><rect x="-4" y="0" width="8" height="16" rx="4" fill="#f0fdf4" stroke="#3d2314" stroke-width="1.8" transform="rotate(-20)"/></g></g></svg>`},
  hamster: { name:"Nuts", speech:"Chomp!", color:"#fef3c7", svg:`<svg viewBox="0 0 120 120" style="overflow:visible;width:100%;height:100%"><g transform="translate(60,60)"><g class="limb-leg-back" transform="translate(14,26)"><rect x="-6" y="0" width="12" height="20" rx="6" fill="#fef3c7" stroke="#3d2314" stroke-width="2"/><ellipse cx="0" cy="18" rx="6" ry="4" fill="#fde68a" stroke="#3d2314" stroke-width="1.6"/></g><g class="body-group"><ellipse cx="0" cy="14" rx="26" ry="22" fill="#fef3c7" stroke="#3d2314" stroke-width="2.5"/><circle cx="-12" cy="18" r="6" fill="#fde68a" opacity=".3"/></g><g class="limb-leg-front" transform="translate(-12,26)"><rect x="-5" y="0" width="10" height="20" rx="5" fill="#fef3c7" stroke="#3d2314" stroke-width="2"/><ellipse cx="0" cy="18" rx="5" ry="3.5" fill="#fde68a" stroke="#3d2314" stroke-width="1.6"/></g><g class="head-group" transform="translate(0,-6)"><circle cx="0" cy="0" r="24" fill="#fef3c7" stroke="#3d2314" stroke-width="2.5"/><circle cx="-9" cy="-3" r="3" fill="#1e293b"/><circle cx="9" cy="-3" r="3" fill="#1e293b"/><circle cx="-10" cy="-4" r="1" fill="#fff"/><circle cx="8" cy="-4" r="1" fill="#fff"/><path d="M-4 5Q0 8 4 5" fill="none" stroke="#3d2314" stroke-width="2"/><circle cx="-14" cy="2" r="4" fill="#fde68a" opacity=".6"/><circle cx="14" cy="2" r="4" fill="#fde68a" opacity=".6"/></g><g class="limb-arm-left" transform="translate(-18,12)"><rect x="-4" y="0" width="8" height="14" rx="4" fill="#fef3c7" stroke="#3d2314" stroke-width="1.8" transform="rotate(15)"/></g><g class="limb-arm-right" transform="translate(18,12)"><rect x="-4" y="0" width="8" height="14" rx="4" fill="#fef3c7" stroke="#3d2314" stroke-width="1.8" transform="rotate(-15)"/></g></g></svg>`},
  bear: { name:"Barnaby", speech:"Grr!", color:"#78716c", svg:`<svg viewBox="0 0 120 120" style="overflow:visible;width:100%;height:100%"><g transform="translate(60,60)"><g class="limb-leg-back" transform="translate(18,22)"><rect x="-6" y="0" width="12" height="22" rx="6" fill="#78716c" stroke="#3d2314" stroke-width="2"/><ellipse cx="0" cy="20" rx="6" ry="4" fill="#57534e" stroke="#3d2314" stroke-width="1.6"/></g><g class="body-group"><ellipse cx="0" cy="14" rx="28" ry="22" fill="#a8a29e" stroke="#3d2314" stroke-width="2.5"/><ellipse cx="0" cy="22" rx="17" ry="7" fill="#78716c" opacity=".3"/></g><g class="limb-leg-front" transform="translate(-16,22)"><rect x="-5" y="0" width="10" height="22" rx="5" fill="#a8a29e" stroke="#3d2314" stroke-width="2"/><ellipse cx="0" cy="20" rx="5" ry="3.5" fill="#78716c" stroke="#3d2314" stroke-width="1.6"/></g><g class="head-group" transform="translate(0,-12)"><circle cx="0" cy="0" r="26" fill="#a8a29e" stroke="#3d2314" stroke-width="2.5"/><circle cx="-9" cy="-4" r="3.5" fill="#1e293b"/><circle cx="9" cy="-4" r="3.5" fill="#1e293b"/><circle cx="-10" cy="-5" r="1.2" fill="#fff"/><circle cx="8" cy="-5" r="1.2" fill="#fff"/><ellipse cx="0" cy="-2" rx="5" ry="3" fill="#fef3c7" opacity=".7"/><path d="M-4 6Q0 10 4 6" fill="none" stroke="#3d2314" stroke-width="2"/><circle cx="-14" cy="2" r="4.5" fill="#fef3c7" opacity=".5"/><circle cx="14" cy="2" r="4.5" fill="#fef3c7" opacity=".5"/></g><g class="limb-arm-left" transform="translate(-20,6)"><rect x="-5" y="0" width="10" height="18" rx="5" fill="#a8a29e" stroke="#3d2314" stroke-width="1.8" transform="rotate(15)"/></g><g class="limb-arm-right" transform="translate(20,6)"><rect x="-5" y="0" width="10" height="18" rx="5" fill="#a8a29e" stroke="#3d2314" stroke-width="1.8" transform="rotate(-15)"/></g></g></svg>`}
};
const PET_TYPE_ORDER = ["kitten","puppy","bunny","hamster","bear"];

// ── State ──
let settings = { petSize:1, animSpeed:1, walkFreq:0.5, walk_interval:"auto", alwaysOnTop:true, sound:false, petType:"kitten" };
let pets = [];
let animSpeed = 1;
let behaviorTimer = null;
let moveRaf = null;
let lastWalkAt = Date.now();
let globalScale = 1;
let isVisible = true;
let isAlwaysOnTop = true;

function getWalkIntervalMs() {
  switch(settings.walk_interval) {
    case "still": return Infinity;
    case "30s": return 30000;
    case "1m": return 60000;
    case "2m": return 120000;
    case "5m": return 300000;
    default: return 5000 + Math.random() * 15000;
  }
}

async function loadSettings() {
  try {
    for (const k of Object.keys(settings)) {
      const v = await store.get(k);
      if (v !== undefined && v !== null) settings[k] = v;
    }
    const legacy = await store.get("walkInterval");
    if (legacy && !settings.walk_interval) settings.walk_interval = legacy;
    const s = await invoke("get_settings");
    if (s) settings = { ...settings, ...s };
    if (!settings.walk_interval) settings.walk_interval = "auto";
  } catch(e) {}
  applySettings();
}

function applySettings() {
  globalScale = settings.petSize || 1;
  animSpeed = settings.animSpeed || 1;
  if (isAlwaysOnTop !== settings.alwaysOnTop) {
    isAlwaysOnTop = settings.alwaysOnTop;
    try { petWindow.setAlwaysOnTop(isAlwaysOnTop); } catch {}
  }
}

async function saveSettings() {
  try {
    for (const [k,v] of Object.entries(settings)) await store.set(k, v);
    await store.save();
    await invoke("save_settings", { settings });
  } catch(e) {}
}

// ── Pet class ──
class DesktopPet {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.dx = (Math.random()-0.5)*2;
    this.dy = (Math.random()-0.5)*2;
    this.animState = "idle";
    this.animFrame = 0;
    this.blinkTimer = 0;
    this.sitting = false;
    const tpl = PET_TEMPLATES[type];
    const wrapper = document.createElement("div");
    wrapper.className = "pet-wrapper";
    wrapper.dataset.pet = type;
    wrapper.style.left = x + "px";
    wrapper.style.top = y + "px";
    wrapper.style.transform = `translate(${x}px,${y}px) scale(${globalScale})`;
    wrapper.innerHTML = `<div class="pet-speech"></div>${tpl.svg}<div class="particle-container"></div>`;
    document.getElementById("desktop-viewport").appendChild(wrapper);
    this.wrapper = wrapper;
    this.petRoot = wrapper.querySelector(".pet-root");
    this.speech = wrapper.querySelector(".pet-speech");
    this.particleContainer = wrapper.querySelector(".particle-container");
    this.limbEls = {};
    const sel = `.${type} .limb-`;
    ["tail","leg-back","leg-front","arm-left","arm-right","head","body"].forEach(l => {
      const el = wrapper.querySelector(`.limb-${l}`) || wrapper.querySelector(`[class*="limb-${l}"]`);
      // try direct class
      this.limbEls[l] = wrapper.querySelector(`.${type} .limb-${l}`);
    });
    // fallback: query within wrapper
    wrapper.querySelectorAll("[class]").forEach(el => {
      const cls = el.getAttribute("class") || "";
      if (cls.startsWith("limb-")) this.limbEls[cls.replace("limb-","")] = el;
    });
  }
  triggerState(name) {
    this.animState = name;
    this.animFrame = 0;
    if (name === "sitting") this.sitting = true;
    else if (name === "walking") this.sitting = false;
  }
  update(speed) {
    this.animFrame += 0.05 * speed;
    const d = LIMB_DEFAULTS[this.type];
    if (!d) return;
    const t = this.animFrame;
    if (this.animState === "sitting") {
      this.applyLimbTransforms({...d, legBack:"translate(18,25)", legFront:"translate(-14,25)", armLeft:"translate(-16,5)", armRight:"translate(16,5)", body:"translate(0,2)", head:"translate(2,-18)"});
    } else if (this.animState === "walking") {
      const bounce = Math.sin(t * 3) * 3;
      this.applyLimbTransforms({
        ...d,
        legBack: `translate(${18+Math.sin(t*3)*4},${20+bounce})`,
        legFront: `translate(${-14+Math.sin(t*3+Math.PI)*4},${20-bounce})`,
        armLeft: `translate(${-16+Math.sin(t*3)*3},${2+Math.sin(t*3)*2})`,
        armRight: `translate(${16+Math.sin(t*3+Math.PI)*3},${2+Math.sin(t*3+Math.PI)*2})`,
        body: `translate(0,${Math.sin(t*2)*1})`,
        head: `translate(${2+Math.sin(t*2)*1},${-14+Math.sin(t*3)*1})`
      });
    } else if (this.animState === "play") {
      this.applyLimbTransforms({...d, legBack:"translate(18,22)", legFront:"translate(-14,22)", armLeft:"translate(-25,-5)", armRight:"translate(25,-5)", body:"translate(0,-3)", head:"translate(2,-20)"});
    } else if (this.animState === "happy") {
      const bounce = Math.sin(t*4)*4;
      this.applyLimbTransforms({...d, body:`translate(0,${bounce})`, head:`translate(${2+bounce/2},${-14+bounce})`});
    } else {
      this.applyLimbTransforms(d);
    }
    // walk movement
    const interval = getWalkIntervalMs();
    const now = Date.now();
    if (this.animState !== "sitting" && interval < Infinity && now - lastWalkAt >= interval) {
      lastWalkAt = now;
      this.dx = (Math.random()-0.5)*2;
      this.dy = (Math.random()-0.5)*2;
      this.sitting = false;
    }
    if (this.animState !== "sitting" && this.animState !== "play") {
      const freq = settings.walkFreq || 0.5;
      this.x += this.dx * freq * speed * 0.3;
      this.y += this.dy * freq * speed * 0.3;
      this.wrapper.style.transform = `translate(${this.x}px,${this.y}px) scale(${globalScale})`;
      this.x = clamp(this.x, 0, window.innerWidth - 130 * globalScale);
      this.y = clamp(this.y, 0, window.innerHeight - 130 * globalScale);
    }
  }
  applyLimbTransforms(limbs) {
    for (const [name, val] of Object.entries(limbs)) {
      const el = this.limbEls[name];
      if (el && val !== null) el.setAttribute("transform", val);
    }
  }
  setSpeech(text) { this.speech.textContent = text; this.speech.style.transform = "translateX(-50%) scale(1)"; setTimeout(() => { this.speech.style.transform = "translateX(-50%) scale(0)"; }, 1500); }
}

// ── Helpers ──
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function spawnAllPets() {
  clearPets();
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  PET_TYPE_ORDER.forEach((t, i) => {
    const ox = (i - 2) * 150;
    const oy = (Math.abs(i-2) % 2 === 0 ? -60 : 60);
    pets.push(new DesktopPet(t, cx + ox, cy + oy));
  });
}
function clearPets() { pets.forEach(p => p.wrapper.remove()); pets = []; }
function spawnPet(type) {
  clearPets();
  pets.push(new DesktopPet(type, window.innerWidth/2 - 65, window.innerHeight/2 - 65));
}
function setAnimation(name) { pets.forEach(p => p.triggerState(name)); }
function scheduleNext(ms) {
  clearTimeout(behaviorTimer);
  behaviorTimer = setTimeout(() => {
    const states = ["idle","play","happy"];
    setAnimation(states[Math.floor(Math.random()*states.length)]);
    scheduleNext(3000 + Math.random()*5000);
  }, ms);
}

// ── Context Menu ──
const ctxMenu = document.getElementById("ctx-menu");
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  ctxMenu.classList.remove("hidden");
  ctxMenu.style.left = e.clientX + "px";
  ctxMenu.style.top = e.clientY + "px";
});
document.addEventListener("click", (e) => { if (!ctxMenu.contains(e.target)) ctxMenu.classList.add("hidden"); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") ctxMenu.classList.add("hidden"); });
ctxMenu.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;
  ctxMenu.classList.add("hidden");
  switch(action) {
    case "feed": setAnimation("happy"); setTimeout(()=>setAnimation("idle"),1500); break;
    case "play": setAnimation("play"); setTimeout(()=>setAnimation("idle"),2200); break;
    case "sleep": setAnimation("sitting"); break;
    case "jump": setAnimation("happy"); setTimeout(()=>setAnimation("idle"),700); break;
    case "change": {
      const cur = settings.petType || "kitten";
      const idx = PET_TYPE_ORDER.indexOf(cur);
      const next = PET_TYPE_ORDER[(idx+1)%PET_TYPE_ORDER.length];
      settings.petType = next;
      await saveSettings();
      spawnPet(next);
      setAnimation("idle");
      break;
    }
    case "settings": try { await invoke("open_settings"); } catch { window.open("/settings.html","_blank"); } break;
    case "hide": try { await invoke("hide_pet"); } catch { await petWindow.hide(); } break;
    case "quit": try { await invoke("quit_app"); } catch { await petWindow.close(); } break;
  }
});

// ── Tauri IPC ──
if (isTauri && listenFn) {
  try {
    await listenFn("settings-updated", (ev) => {
      const u = ev.payload;
      if (u) { settings = { ...settings, ...u }; applySettings(); }
    });
    await listenFn("reset-position", async () => {
      const m = await primaryMonitor();
      if (m) {
        const x = m.position.x + m.size.width/2 - 80;
        const y = m.position.y + m.size.height/2 - 80;
        await petWindow.setPosition({ type:"Physical", x: Math.round(x), y: Math.round(y) });
        await petWindow.show();
        await petWindow.setFocus();
        setAnimation("happy");
        setTimeout(()=>setAnimation("idle"),1200);
      }
    });
    await listenFn("show-pet", async () => { await petWindow.show(); await petWindow.setFocus(); });
    await listenFn("sit-still", async () => { setAnimation("sitting"); scheduleNext(4000+Math.random()*2000); });
    await listenFn("play-now", async () => { setAnimation("play"); setTimeout(()=>setAnimation("idle"),2200); });
    await listenFn("pet-select", async (ev) => {
      const t = ev.payload?.petType || "kitten";
      settings.petType = t;
      await saveSettings();
      spawnPet(t);
    });
    await listenFn("spawn-all", () => { spawnAllPets(); });
    await listenFn("reset-layout", () => { spawnAllPets(); });
  } catch(e) {}
}

// ── Main loop ──
function mainLoop() {
  pets.forEach(p => p.update(animSpeed));
  requestAnimationFrame(mainLoop);
}

// ── Bootstrap ──
await loadSettings();
if (settings.petType) {
  spawnPet(settings.petType);
} else {
  spawnAllPets();
}
setAnimation("idle");
scheduleNext(3000);
mainLoop();

if (isTauri) petWindow.onCloseRequested(async () => {});
