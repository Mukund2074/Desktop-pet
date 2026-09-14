const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;

let store;
let invoke;
let emit;
let enable, isEnabled, disable;

if (isTauri) {
  try {
    const s = await import("@tauri-apps/plugin-store");
    const c = await import("@tauri-apps/api/core");
    const ev = await import("@tauri-apps/api/event");
    const a = await import("@tauri-apps/plugin-autostart");
    store = new s.LazyStore("settings.json");
    invoke = c.invoke;
    emit = ev.emit;
    enable = a.enable; isEnabled = a.isEnabled; disable = a.disable;
  } catch (e) {
    console.warn("[settings] Tauri init failed, fallback to mocks", e);
  }
}
if (!store) {
  const LS_PREFIX = "desktop-pet:";
  store = {
    get: async (k) => { try { const v = localStorage.getItem(LS_PREFIX+k); return v ? JSON.parse(v) : undefined; } catch { return undefined; } },
    set: async (k,v) => { try { localStorage.setItem(LS_PREFIX+k, JSON.stringify(v)); } catch {} },
    save: async () => {},
  };
}
if (!invoke) invoke = async () => null;
if (!emit) emit = async () => {};
if (!isEnabled) isEnabled = async () => false;
if (!enable) enable = async () => {};
if (!disable) disable = async () => {};

const els = {
  autostart: document.getElementById("autostart"),
  alwaysOnTop: document.getElementById("alwaysOnTop"),
  sound: document.getElementById("sound"),
  petType: document.getElementById("petType"),
  petSize: document.getElementById("petSize"),
  petSizeVal: document.getElementById("petSizeVal"),
  animSpeed: document.getElementById("animSpeed"),
  animSpeedVal: document.getElementById("animSpeedVal"),
  walkFreq: document.getElementById("walkFreq"),
  walkFreqVal: document.getElementById("walkFreqVal"),
  walkInterval: document.getElementById("walkInterval"),
  sitStill: document.getElementById("sitStill"),
  playNow: document.getElementById("playNow"),
  resetPos: document.getElementById("resetPos"),
  showPet: document.getElementById("showPet"),
  quit: document.getElementById("quit"),
};

let settings = {
  petSize: 1,
  animSpeed: 1,
  walkFreq: 0.5,
  walk_interval: "auto",
  alwaysOnTop: true,
  sound: false,
  petType: "kitten",
};

async function load() {
  for (const k of Object.keys(settings)) {
    const v = await store.get(k).catch(()=>undefined);
    if (v !== undefined && v !== null) settings[k] = v;
  }
  // migration: handle camelCase walkInterval from older versions
  const legacy = await store.get("walkInterval").catch(()=>undefined);
  if (legacy && !settings.walk_interval) settings.walk_interval = legacy;
  try { const s = await invoke("get_settings"); if (s) settings = { ...settings, ...s }; } catch {}
  try { settings.autostart = await isEnabled(); } catch {}

  els.petType.value = settings.petType || "kitten";
  els.petSize.value = String(settings.petSize);
  els.animSpeed.value = String(settings.animSpeed);
  els.walkFreq.value = String(settings.walkFreq);
  if (els.walkInterval) els.walkInterval.value = settings.walk_interval || "auto";
  els.alwaysOnTop.checked = !!settings.alwaysOnTop;
  els.sound.checked = !!settings.sound;
  els.autostart.checked = !!settings.autostart;
  updateLabels();
}

function updateLabels() {
  els.petSizeVal.textContent = `${els.petSize.value}×`;
  els.animSpeedVal.textContent = `${els.animSpeed.value}×`;
  els.walkFreqVal.textContent = `${Math.round(parseFloat(els.walkFreq.value)*100)}%`;
}

async function save() {
  settings.petSize = parseFloat(els.petSize.value);
  settings.animSpeed = parseFloat(els.animSpeed.value);
  settings.walkFreq = parseFloat(els.walkFreq.value);
  settings.walk_interval = els.walkInterval ? els.walkInterval.value : settings.walk_interval;
  settings.petType = els.petType ? els.petType.value : settings.petType;
  settings.alwaysOnTop = els.alwaysOnTop.checked;
  settings.sound = els.sound.checked;

  for (const [k,v] of Object.entries(settings)) await store.set(k, v);
  await store.save().catch(()=>{});
  try { await invoke("save_settings", { settings }); } catch {}
  await emit("settings-updated", settings).catch(()=>{});

  // autostart
  try {
    if (els.autostart.checked) await enable(); else await disable();
  } catch (e) { console.warn("autostart", e); }
}

["input","change"].forEach(ev => {
  els.petSize.addEventListener(ev, () => { updateLabels(); save(); });
  els.animSpeed.addEventListener(ev, () => { updateLabels(); save(); });
  els.walkFreq.addEventListener(ev, () => { updateLabels(); save(); });
});
if (els.walkInterval) els.walkInterval.addEventListener("change", save);
els.alwaysOnTop.addEventListener("change", save);
els.sound.addEventListener("change", save);
els.autostart.addEventListener("change", save);
if (els.petType) els.petType.addEventListener("change", async () => { settings.petType = els.petType.value; await save(); });
if (els.sitStill) els.sitStill.addEventListener("click", async () => {
  await emit("sit-still", {}).catch(()=>{});
  try { await invoke("set_always_on_top", { enabled: settings.alwaysOnTop }); } catch {}
});
if (els.playNow) els.playNow.addEventListener("click", async () => {
  await emit("play-now", {}).catch(()=>{});
});

els.resetPos.addEventListener("click", async () => {
  await emit("reset-position", {}).catch(()=>{});
  try { await invoke("reset_position"); } catch {}
});
els.showPet.addEventListener("click", async () => {
  await emit("show-pet", {}).catch(()=>{});
  try { await invoke("show_pet"); } catch {}
});
els.quit.addEventListener("click", async () => {
  try { await invoke("quit_app"); } catch {}
});

await load();
if (!isTauri) {
  const note = document.createElement("p");
  note.textContent = "Browser preview mode — settings saved to localStorage.";
  note.style.cssText = "font-size:11px;color:#8a7a6a;text-align:center;margin-top:8px;";
  document.getElementById("app")?.appendChild(note);
}
