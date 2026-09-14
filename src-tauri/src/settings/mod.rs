use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    #[serde(default = "default_pet_size")]
    pub pet_size: f64,
    #[serde(default = "default_anim_speed")]
    pub anim_speed: f64,
    #[serde(default = "default_walk_freq")]
    pub walk_freq: f64,
    #[serde(default = "default_true")]
    pub always_on_top: bool,
    #[serde(default)]
    pub sound: bool,
    #[serde(default)]
    pub autostart: bool,
    pub pos: Option<Position>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

fn default_pet_size() -> f64 { 1.0 }
fn default_anim_speed() -> f64 { 1.0 }
fn default_walk_freq() -> f64 { 0.5 }
fn default_true() -> bool { true }

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            pet_size: 1.0,
            anim_speed: 1.0,
            walk_freq: 0.5,
            always_on_top: true,
            sound: false,
            autostart: false,
            pos: None,
        }
    }
}

pub struct SettingsState(pub Mutex<AppSettings>);

impl Default for SettingsState {
    fn default() -> Self { Self(Mutex::new(AppSettings::default())) }
}

// ---- Tauri commands ----

#[tauri::command]
pub fn get_settings(state: tauri::State<SettingsState>) -> AppSettings {
    state.0.lock().unwrap().clone()
}

#[tauri::command]
pub fn save_settings(state: tauri::State<SettingsState>, settings: AppSettings) -> AppSettings {
    let mut s = state.0.lock().unwrap();
    *s = settings.clone();
    // Persist window props that can be applied immediately
    settings
}

#[tauri::command]
pub async fn reset_position(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("pet") {
        if let Some(monitor) = win.primary_monitor().map_err(|e| e.to_string())? {
            let size = monitor.size();
            let pos = monitor.position();
            let win_size = win.outer_size().map_err(|e| e.to_string())?;
            let x = pos.x + (size.width as i32 - win_size.width as i32) / 2;
            let y = pos.y + (size.height as i32 - win_size.height as i32) / 2;
            win.set_position(PhysicalPosition::new(x, y)).map_err(|e| e.to_string())?;
            let _ = win.show();
            let _ = win.set_focus();
        }
        // notify frontend
        let _ = app.emit("reset-position", ());
    }
    Ok(())
}

#[tauri::command]
pub fn show_pet(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("pet") {
        w.show().map_err(|e| e.to_string())?;
        w.set_focus().map_err(|e| e.to_string())?;
        let _ = app.emit("show-pet", ());
    }
    Ok(())
}

#[tauri::command]
pub fn hide_pet(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("pet") {
        w.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn open_settings(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("settings") {
        w.show().map_err(|e| e.to_string())?;
        w.set_focus().map_err(|e| e.to_string())?;
        w.set_always_on_top(true).map_err(|e| e.to_string())?;
        // drop always-on-top shortly after so it doesn't stay on top
        let w2 = w.clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(std::time::Duration::from_millis(800)).await;
            let _ = w2.set_always_on_top(false);
        });
    }
    Ok(())
}

#[tauri::command]
pub fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
pub fn set_always_on_top(app: AppHandle, enabled: bool) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("pet") {
        w.set_always_on_top(enabled).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn debug_log(msg: String) -> String {
    let _ = std::fs::OpenOptions::new().create(true).append(true).open("/tmp/pet.log").and_then(|mut f| {
        use std::io::Write;
        writeln!(f, "{}", msg)
    });
    println!("[pet-debug] {}", msg);
    msg
}

pub async fn restore_window_state(app: &AppHandle) -> Result<(), String> {
    // Try to restore from store plugin file if present; otherwise keep center.
    // Position is primarily managed by frontend via store, but we also apply
    // always-on-top here for cold start edge case.
    if let Some(win) = app.get_webview_window("pet") {
        let state = app.state::<SettingsState>();
        let s = state.0.lock().unwrap().clone();
        let _ = win.set_always_on_top(s.always_on_top);
        if let Some(pos) = s.pos {
            // clamp to visible monitor union to handle monitor changes
            let monitors = win.available_monitors().map_err(|e| e.to_string())?;
            if !monitors.is_empty() {
                let mut min_x = i32::MAX; let mut min_y = i32::MAX;
                let mut max_x = i32::MIN; let mut max_y = i32::MIN;
                for m in &monitors {
                    let p = m.position(); let sz = m.size();
                    min_x = min_x.min(p.x); min_y = min_y.min(p.y);
                    max_x = max_x.max(p.x + sz.width as i32);
                    max_y = max_y.max(p.y + sz.height as i32);
                }
                let win_sz = win.outer_size().map_err(|e| e.to_string())?;
                let x = pos.x.clamp(min_x, max_x - win_sz.width as i32);
                let y = pos.y.clamp(min_y, max_y - win_sz.height as i32);
                let _ = win.set_position(PhysicalPosition::new(x, y));
            }
        }
        // Ensure size matches pet_size
        let base: u32 = 160;
        let scale = s.pet_size.clamp(0.5, 2.5);
        let sz = (base as f64 * scale) as u32;
        let _ = win.set_size(PhysicalSize::new(sz, sz));
    }
    Ok(())
}
