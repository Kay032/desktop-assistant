use tauri::command;
use std::process::Command as StdCommand;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppInfo {
    pub name: String,
    pub display_name: String,
    pub path: Option<String>,
    pub icon: Option<String>,
    pub category: String,
    pub installed: bool,
}

#[command]
pub fn open_application(app_name: String) -> Result<String, String> {
    // Map common names to actual executables for different OS
    let app_map: HashMap<&str, Vec<&str>> = HashMap::from([
        // Browsers
        ("chrome", vec!["google-chrome", "chrome", "chromium-browser", "chromium"]),
        ("firefox", vec!["firefox", "firefox-bin"]),
        ("brave", vec!["brave-browser", "brave"]),
        ("edge", vec!["microsoft-edge", "edge"]),
        ("opera", vec!["opera"]),
        
        // Editors
        ("code", vec!["code", "vscode", "visual-studio-code"]),
        ("vscode", vec!["code", "vscode"]),
        ("sublime", vec!["subl", "sublime_text"]),
        ("atom", vec!["atom"]),
        ("notepad", vec!["notepad", "gedit", "xed"]),
        ("vim", vec!["vim", "gvim"]),
        
        // System apps
        ("terminal", vec!["gnome-terminal", "konsole", "xterm", "alacritty", "kitty", "terminator"]),
        ("calculator", vec!["gnome-calculator", "kcalc", "qalculate-gtk", "calc"]),
        ("files", vec!["nautilus", "dolphin", "thunar", "pcmanfm", "caja"]),
        ("settings", vec!["gnome-control-center", "systemsettings", "xfce4-settings-manager"]),
        ("taskmanager", vec!["gnome-system-monitor", "ksysguard", "xfce4-taskmanager"]),
        
        // Common apps
        ("spotify", vec!["spotify"]),
        ("slack", vec!["slack"]),
        ("discord", vec!["discord"]),
        ("zoom", vec!["zoom"]),
        ("teams", vec!["teams", "teams-for-linux"]),
        
        // Development
        ("git", vec!["git"]),
        ("docker", vec!["docker"]),
        ("postman", vec!["postman"]),
        ("insomnia", vec!["insomnia"]),
        
        // Media
        ("vlc", vec!["vlc"]),
        ("mpv", vec!["mpv"]),
        ("rhythmbox", vec!["rhythmbox"]),
        
        // Graphics
        ("gimp", vec!["gimp"]),
        ("inkscape", vec!["inkscape"]),
        ("blender", vec!["blender"]),
        ("krita", vec!["krita"]),
        
        // Games
        ("steam", vec!["steam"]),
        ("lutris", vec!["lutris"]),
        ("heroic", vec!["heroic"]),
        
        // Office
        ("libreoffice", vec!["libreoffice"]),
        ("onlyoffice", vec!["onlyoffice-desktopeditors"]),
        ("wps", vec!["wps"]),
        
        // Communication
        ("telegram", vec!["telegram-desktop"]),
        ("whatsapp", vec!["whatsapp-nativefier", "whatsapp"]),
        ("signal", vec!["signal-desktop"]),
    ]);

    // Convert to lowercase for case-insensitive matching
    let app_lower = app_name.to_lowercase();
    let app_trimmed = app_lower.trim();
    
    // Check if we have a mapping for this app
    let executables = match app_map.get(app_trimmed) {
        Some(cmds) => cmds,
        None => {
            // If not in map, try using the name directly
            return try_open_directly(&app_name);
        }
    };

    // Try each possible executable name
    for exe in executables {
        if let Ok(path) = find_executable_in_path(exe) {
            match open_with_path(&path) {
                Ok(_) => return Ok(format!("✅ Opened {}", app_name)),
                Err(_) => continue,
            }
        }
    }

    // Try with system commands
    for exe in executables {
        match try_open_with_system(exe) {
            Ok(_) => return Ok(format!("✅ Opened {}", app_name)),
            Err(_) => continue,
        }
    }

    // Final fallback: try xdg-open on Linux
    #[cfg(target_os = "linux")]
    {
        if let Ok(_) = StdCommand::new("xdg-open").arg(&app_name).spawn() {
            return Ok(format!("✅ Opened {} with default application", app_name));
        }
    }

    Err(format!("❌ Could not open '{}'. Try 'help' for available apps.", app_name))
}

fn find_executable_in_path(executable: &str) -> Result<String, String> {
    let path_var = std::env::var_os("PATH").unwrap_or_default();
    let paths = std::env::split_paths(&path_var);
    
    for path in paths {
        let full_path = path.join(executable);
        if full_path.exists() {
            return Ok(full_path.to_string_lossy().to_string());
        }
        
        // Also try with .exe on Windows
        #[cfg(target_os = "windows")]
        {
            let exe_path = path.join(format!("{}.exe", executable));
            if exe_path.exists() {
                return Ok(exe_path.to_string_lossy().to_string());
            }
        }
    }
    
    Err(format!("{} not found in PATH", executable))
}

fn open_with_path(path: &str) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        StdCommand::new(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        StdCommand::new("cmd")
            .args(&["/c", "start", "", path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        StdCommand::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn try_open_with_system(exe: &str) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        if let Ok(_) = StdCommand::new(exe).spawn() {
            return Ok(());
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(_) = StdCommand::new("cmd").args(&["/c", "start", "", exe]).spawn() {
            return Ok(());
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(_) = StdCommand::new("open").arg("-a").arg(exe).spawn() {
            return Ok(());
        }
    }

    Err(format!("Failed to open {}", exe))
}

// Helper function to try opening directly with system commands
fn try_open_directly(app_name: &str) -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        // Try xdg-open as a last resort
        if let Ok(_) = StdCommand::new("xdg-open").arg(app_name).spawn() {
            return Ok(format!("✅ Attempted to open {}", app_name));
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        if let Ok(_) = StdCommand::new("cmd").args(&["/c", "start", "", app_name]).spawn() {
            return Ok(format!("✅ Attempted to open {}", app_name));
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        if let Ok(_) = StdCommand::new("open").arg(app_name).spawn() {
            return Ok(format!("✅ Attempted to open {}", app_name));
        }
    }
    
    Err(format!("❌ Unknown application: {}", app_name))
}

#[command]
pub fn get_available_apps() -> Result<Vec<AppInfo>, String> {
    let mut apps = Vec::new();
    
    // Define app categories with their display names and executables
    let app_definitions = vec![
        // Browsers
        ("chrome", "Google Chrome", "browsers"),
        ("firefox", "Firefox", "browsers"),
        ("brave", "Brave Browser", "browsers"),
        ("edge", "Microsoft Edge", "browsers"),
        ("opera", "Opera", "browsers"),
        
        // Editors
        ("code", "VS Code", "editors"),
        ("sublime", "Sublime Text", "editors"),
        ("atom", "Atom", "editors"),
        ("vim", "Vim", "editors"),
        ("notepad", "Notepad", "editors"),
        
        // System apps
        ("terminal", "Terminal", "system"),
        ("calculator", "Calculator", "system"),
        ("files", "File Manager", "system"),
        ("settings", "System Settings", "system"),
        ("taskmanager", "Task Manager", "system"),
        
        // Media
        ("vlc", "VLC Media Player", "media"),
        ("mpv", "MPV Player", "media"),
        ("rhythmbox", "Rhythmbox", "media"),
        ("spotify", "Spotify", "media"),
        
        // Communication
        ("discord", "Discord", "communication"),
        ("slack", "Slack", "communication"),
        ("zoom", "Zoom", "communication"),
        ("teams", "Microsoft Teams", "communication"),
        ("telegram", "Telegram", "communication"),
        ("signal", "Signal", "communication"),
        
        // Development
        ("git", "Git", "development"),
        ("docker", "Docker", "development"),
        ("postman", "Postman", "development"),
        ("insomnia", "Insomnia", "development"),
        
        // Graphics
        ("gimp", "GIMP", "graphics"),
        ("inkscape", "Inkscape", "graphics"),
        ("blender", "Blender", "graphics"),
        ("krita", "Krita", "graphics"),
        
        // Games
        ("steam", "Steam", "games"),
        ("lutris", "Lutris", "games"),
        ("heroic", "Heroic Games Launcher", "games"),
        
        // Office
        ("libreoffice", "LibreOffice", "office"),
        ("onlyoffice", "OnlyOffice", "office"),
        ("wps", "WPS Office", "office"),
    ];

    for (name, display_name, category) in app_definitions {
        let installed = check_if_app_installed_internal(name);
        let path = if installed {
            find_app_path(name)
        } else {
            None
        };
        
        apps.push(AppInfo {
            name: name.to_string(),
            display_name: display_name.to_string(),
            path,
            icon: None, // Could be enhanced with icon extraction
            category: category.to_string(),
            installed,
        });
    }

    Ok(apps)
}

fn find_app_path(app_name: &str) -> Option<String> {
    let app_map: HashMap<&str, Vec<&str>> = HashMap::from([
        ("chrome", vec!["google-chrome", "chrome"]),
        ("firefox", vec!["firefox"]),
        ("code", vec!["code"]),
        ("terminal", vec!["gnome-terminal", "konsole", "xterm"]),
        ("calculator", vec!["gnome-calculator", "kcalc"]),
        ("files", vec!["nautilus", "dolphin", "thunar"]),
        // Add more mappings as needed
    ]);

    if let Some(executables) = app_map.get(app_name) {
        for exe in executables {
            if let Ok(path) = find_executable_in_path(exe) {
                return Some(path);
            }
        }
    }
    
    // Try the app name directly
    if let Ok(path) = find_executable_in_path(app_name) {
        return Some(path);
    }
    
    None
}

#[command]
pub fn check_if_app_installed(app_name: String) -> Result<bool, String> {
    Ok(check_if_app_installed_internal(&app_name.to_lowercase()))
}

fn check_if_app_installed_internal(app_name: &str) -> bool {
    let app_map: HashMap<&str, Vec<&str>> = HashMap::from([
        ("chrome", vec!["google-chrome", "chrome"]),
        ("firefox", vec!["firefox"]),
        ("brave", vec!["brave-browser"]),
        ("code", vec!["code"]),
        ("terminal", vec!["gnome-terminal", "konsole", "xterm"]),
        ("calculator", vec!["gnome-calculator", "kcalc"]),
        ("files", vec!["nautilus", "dolphin", "thunar"]),
        // Add more mappings as needed
    ]);

    if let Some(executables) = app_map.get(app_name) {
        for exe in executables {
            if find_executable_in_path(exe).is_ok() {
                return true;
            }
        }
    }
    
    // Check the name directly
    find_executable_in_path(app_name).is_ok()
}

#[command]
pub fn open_terminal() -> Result<String, String> {
    open_application("terminal".to_string())
}

#[command]
pub fn open_task_manager() -> Result<String, String> {
    open_application("taskmanager".to_string())
}

#[command]
pub fn open_calculator() -> Result<String, String> {
    open_application("calculator".to_string())
}

#[command]
pub fn open_file_manager() -> Result<String, String> {
    open_application("files".to_string())
}

#[command]
pub fn open_settings() -> Result<String, String> {
    open_application("settings".to_string())
}

#[command]
pub fn get_app_icon(app_name: String) -> Result<Option<String>, String> {
    // This could be enhanced to extract icons from .desktop files or Windows registry
    Ok(None)
}