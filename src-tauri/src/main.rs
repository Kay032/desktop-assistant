#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
use commands::{clipboard, windows};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Existing commands
            commands::apps::open_application,
            commands::apps::get_available_apps,
            commands::files::search_files,
            commands::files::get_file_info,
            commands::files::open_file_location,
            commands::system::get_system_info,
            commands::system::control_system,
            commands::system::kill_process,
            commands::web::search_web,
            commands::web::get_webpage_preview,
            // New clipboard commands
            clipboard::get_clipboard_history,
            clipboard::copy_to_clipboard,
            // New window commands
            window::snap_window,
            window::move_to_monitor,
        ])
        .setup(|app| {
            let handle = app.app_handle();
            let mut shortcut = handle.global_shortcut_manager();

            // Register Alt+Space to show/hide the window
            shortcut.register("Alt+Space", move || {
                let window = handle.get_window("main").unwrap();
                if window.is_visible().unwrap() {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            })
            .unwrap();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}