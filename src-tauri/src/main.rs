use tauri::Manager;
use tauri::PhysicalPosition;
use tauri::PhysicalSize;
use tauri::WindowEvent;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![])
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
                if let Some(win) = handle.get_webview_window("pet") {
                    let _ = win.set_decorations(false);
                    let _ = win.set_shadow(false);
                    if let Ok(monitors) = win.available_monitors() {
                        if !monitors.is_empty() {
                            let mut min_x = i32::MAX;
                            let mut min_y = i32::MAX;
                            let mut max_x = i32::MIN;
                            let mut max_y = i32::MIN;
                            for m in &monitors {
                                let p = m.position();
                                let sz = *m.size();
                                min_x = min_x.min(p.x);
                                min_y = min_y.min(p.y);
                                max_x = max_x.max(p.x + sz.width as i32);
                                max_y = max_y.max(p.y + sz.height as i32);
                            }
                            let width = (max_x - min_x) as u32;
                            let height = (max_y - min_y) as u32;
                            let _ = win.set_position(PhysicalPosition::new(min_x, min_y));
                            let _ = win.set_size(PhysicalSize::new(width, height));
                        }
                    }
                }
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "pet" {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("failed to run desktop-pet");
}
