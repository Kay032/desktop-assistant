#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
