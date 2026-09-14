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
    #[serde(default = "default_walk_interval")]
    pub walk_interval: String,
    #[serde(default = "default_true")]
    pub always_on_top: bool,
    #[serde(default)]
    pub sound: bool,
    #[serde(default)]
    pub autostart: bool,
    pub pos: Option<Position>,
    #[serde(default = "default_pet_type")]
    pub pet_type: String,
    #[serde(default = "default_pet_count")]
    pub pet_count: u8,
    #[serde(default = "default_selected_pets")]
    pub selected_pets: Vec<String>,
    #[serde(default = "default_speed")]
    pub speed: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

fn default_pet_size() -> f64 { 1.0 }
fn default_anim_speed() -> f64 { 1.0 }
fn default_walk_freq() -> f64 { 0.5 }
fn default_walk_interval() -> String { "auto".to_string() }
fn default_true() -> bool { true }
fn default_pet_type() -> String { "kitten".to_string() }
fn default_pet_count() -> u8 { 5 }
fn default_selected_pets() -> Vec<String> { vec!["kitten".into(),"puppy".into(),"bunny".into(),"hamster".into(),"bear".into()] }
fn default_speed() -> f64 { 1.0 }

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            pet_size: 1.0,
            anim_speed: 1.0,
            walk_freq: 0.5,
            walk_interval: default_walk_interval(),
            always_on_top: true,
            sound: false,
            autostart: false,
            pos: None,
            pet_type: default_pet_type(),
            pet_count: 5,
            selected_pets: default_selected_pets(),
            speed: 1.0,
        }
    }
}

pub struct SettingsState(pub Mutex<AppSettings>);

impl Default for SettingsState {
    fn default() -> Self { Self(Mutex::new(AppSettings::default())) }
}

#[tauri::command]
pub fn get_settings(state: tauri::State<SettingsState>) -> AppSettings {
    state.0.lock().unwrap().clone()
}

#[tauri::command]
pub fn save_settings(state: tauri::State<SettingsState>, settings: AppSettings) -> AppSettings {
    let mut s = state.0.lock().unwrap();
    *s = settings.clone();
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

pub async fn restore_window_state(app: &AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("pet") {
        let state = app.state::<SettingsState>();
        let s = state.0.lock().unwrap().clone();
        let _ = win.set_always_on_top(s.always_on_top);
        if let Some(pos) = s.pos {
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
        } else {
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
                let width = (max_x - min_x) as u32;
                let height = (max_y - min_y) as u32;
                let _ = win.set_position(PhysicalPosition::new(min_x, min_y));
                let _ = win.set_size(PhysicalSize::new(width, height));
            }
        }
        let _ = win.set_decorations(false);
        let _ = win.set_shadow(false);
    }
    Ok(())
}
