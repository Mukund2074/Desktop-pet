mod pet;
mod tray;
mod settings;

use settings::SettingsState;
use tauri::WindowEvent;

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
            settings::debug_log,
        ])
        .setup(|app| {
            // Restore window position from settings if available
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                // small delay to let windows be created
                tokio::time::sleep(std::time::Duration::from_millis(200)).await;
                let _ = settings::restore_window_state(&handle).await;
            });

            tray::create_tray(app.handle())?;

            // macOS: hide dock icon until needed? Keep visible but skipTaskbar is true for pet window.
            // Apply platform tweaks for transparent click-through handling is done in JS.

            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "pet" {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    // Hide instead of closing — keep tray alive
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
