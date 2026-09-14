mod pet;
mod tray;
mod settings;

use settings::SettingsState;
use tauri::{Manager, PhysicalPosition, PhysicalSize, WindowEvent};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .manage(SettingsState::default())
        .invoke_handler(tauri::generate_handler![
            settings::get_settings,
            settings::save_settings,
            settings::reset_position,
            settings::show_pet,
            settings::hide_pet,
            settings::open_settings,
            settings::quit_app,
            settings::set_always_on_top,
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(std::time::Duration::from_millis(200)).await;
                let _ = settings::restore_window_state(&handle).await;
            });
            // ensure pet window covers full desktop union for roaming across dual screens
            let handle2 = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
                if let Some(win) = handle2.get_webview_window("pet") {
                    let _ = win.set_decorations(false);
                    let _ = win.set_shadow(false);
                    if let Ok(monitors) = win.available_monitors() {
                        if !monitors.is_empty() {
                            let mut min_x = i32::MAX; let mut min_y = i32::MAX;
                            let mut max_x = i32::MIN; let mut max_y = i32::MIN;
                            for m in &monitors {
                                let p: PhysicalPosition<i32> = *m.position(); let sz: PhysicalSize<u32> = *m.size();
                                min_x = min_x.min(p.x); min_y = min_y.min(p.y);
                                max_x = max_x.max(p.x + sz.width as i32); max_y = max_y.max(p.y + sz.height as i32);
                            }
                            let width = (max_x - min_x) as u32; let height = (max_y - min_y) as u32;
                            let _ = win.set_position(PhysicalPosition::new(min_x, min_y));
                            let _ = win.set_size(PhysicalSize::new(width, height));
                        }
                    }
                }
            });
            tray::create_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "pet" {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
            if window.label() == "settings" {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("failed to run desktop-pet");
}
