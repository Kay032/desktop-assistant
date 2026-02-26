#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
use tauri::{Manager, GlobalShortcutManager};
use commands::{clipboard, windows};
use std::sync::Mutex;

// IMPORTANT: We're using the SAME type from clipboard.rs
// This ensures type compatibility
use commands::clipboard::ClipboardState;

fn main() {
    tauri::Builder::default()
        // Initialize the state with an empty vector
        .manage(ClipboardState(Mutex::new(Vec::new())))
        .invoke_handler(tauri::generate_handler![
            // Existing app commands
            commands::apps::open_application,
            commands::apps::get_available_apps,
            
            // Existing file commands
            commands::files::search_files,
            commands::files::get_file_info,
            commands::files::open_file_location,
            
            // System commands (your new ones)
            commands::system::get_system_info,
            commands::system::control_system,
            commands::system::kill_process,
            
            // Existing web commands
            commands::web::search_web,
            commands::web::get_webpage_preview,
            
            // Existing clipboard commands
            clipboard::get_clipboard_history,
            clipboard::copy_to_clipboard,
            
            // Existing window commands
            windows::snap_window,
            windows::move_to_monitor,
        ])
        .setup(|app| {
            let handle = app.handle();
            let mut shortcut = handle.global_shortcut_manager();

            // Try multiple accelerator formats
            let accelerators = ["Alt+Space", "Alt+Shift+Space", "Super+Space", "Ctrl+Shift+S"];
            
            let mut registered = false;
            let handle_clone = handle.clone();

            for &accel in &accelerators {
                let handle_inner = handle_clone.clone();
                
                match shortcut.register(accel, move || {
                    if let Some(window) = handle_inner.get_window("main") {
                        if let Ok(visible) = window.is_visible() {
                            if visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                }) {
                    Ok(_) => {
                        println!("✅ Global shortcut registered: {}", accel);
                        registered = true;
                        break;
                    }
                    Err(e) => {
                        println!("⚠️ Failed to register {}: {}", accel, e);
                    }
                }
            }

            if !registered {
                eprintln!("⚠️ Could not register any global shortcut - continuing without hotkey");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}