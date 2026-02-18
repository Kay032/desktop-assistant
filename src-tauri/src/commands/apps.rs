use tauri::command;
use std::process::Command as StdCommand;
use std::collections::HashMap;

#[command]
pub fn open_application(app_name: String) -> Result<String, String> {
    // Map common names to actual executables for different OS
    let app_map: HashMap<&str, Vec<&str>> = HashMap::from([
        // Browsers
        ("chrome", vec!["google-chrome", "chrome", "chromium-browser", "chromium"]),
        ("firefox", vec!["firefox", "firefox-bin"]),
        ("brave", vec!["brave-browser", "brave"]),
        
        // Editors
        ("code", vec!["code", "vscode", "visual-studio-code"]),
        ("sublime", vec!["subl", "sublime_text"]),
        ("notepad", vec!["notepad", "gedit", "xed"]),
        
        // System apps
        ("terminal", vec!["gnome-terminal", "konsole", "xterm", "alacritty", "kitty"]),
        ("calculator", vec!["gnome-calculator", "kcalc", "qalculate-gtk", "calc"]),
        ("files", vec!["nautilus", "dolphin", "thunar", "pcmanfm", "caja"]),
        ("settings", vec!["gnome-control-center", "systemsettings", "xfce4-settings-manager"]),
        
        // Common apps
        ("spotify", vec!["spotify"]),
        ("slack", vec!["slack"]),
        ("discord", vec!["discord"]),
        ("zoom", vec!["zoom"]),
        ("teams", vec!["teams", "teams-for-linux"]),
    ]);

    // Convert to lowercase for case-insensitive matching
    let app_lower = app_name.to_lowercase();
    
    // Check if we have a mapping for this app
    let executables = match app_map.get(app_lower.as_str()) {
        Some(cmds) => cmds,
        None => {
            // If not in map, try using the name directly
            return try_open_directly(&app_name);
        }
    };

    // Try each possible executable name
    for exe in executables {
        #[cfg(target_os = "linux")]
        {
            // Check if the command exists in PATH
            if let Ok(output) = StdCommand::new("which").arg(exe).output() {
                if output.status.success() {
                    if let Ok(_) = StdCommand::new(exe).spawn() {
                        return Ok(format!("✅ Opened {}", app_name));
                    }
                }
            }
        }

        #[cfg(target_os = "windows")]
        {
            if let Ok(_) = StdCommand::new("cmd").args(&["/c", "start", "", exe]).spawn() {
                return Ok(format!("✅ Opened {}", app_name));
            }
        }

        #[cfg(target_os = "macos")]
        {
            if let Ok(_) = StdCommand::new("open").arg("-a").arg(exe).spawn() {
                return Ok(format!("✅ Opened {}", app_name));
            }
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

// Helper function to try opening directly with system commands
fn try_open_directly(app_name: &str) -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        // Try xdg-open as a last resort
        if let Ok(_) = StdCommand::new("xdg-open").arg(app_name).spawn() {
            return Ok(format!("✅ Attempted to open {}", app_name));
        }
    }
    
    Err(format!("❌ Unknown application: {}", app_name))
}

#[command]
pub fn get_available_apps() -> Result<Vec<String>, String> {
    let apps = vec![
        "chrome".to_string(),
        "firefox".to_string(),
        "brave".to_string(),
        "code".to_string(),
        "terminal".to_string(),
        "calculator".to_string(),
        "files".to_string(),
        "settings".to_string(),
        "spotify".to_string(),
        "slack".to_string(),
        "discord".to_string(),
        "zoom".to_string(),
        "teams".to_string(),
    ];
    Ok(apps)
}

#[command]
pub fn check_if_app_installed(app_name: String) -> Result<bool, String> {
    let app_lower = app_name.to_lowercase();
    
    #[cfg(target_os = "linux")]
    {
        // Check if command exists in PATH
        let result = StdCommand::new("which")
            .arg(&app_lower)
            .output()
            .map_err(|e| e.to_string())?;
        
        Ok(result.status.success())
    }
    
    #[cfg(target_os = "windows")]
    {
        // On Windows, try where command
        let result = StdCommand::new("where")
            .arg(&app_lower)
            .output()
            .map_err(|e| e.to_string())?;
        
        Ok(result.status.success())
    }
    
    #[cfg(target_os = "macos")]
    {
        // On macOS, check common locations
        let paths = vec![
            format!("/Applications/{}.app", app_lower),
            format!("/Applications/{}.app/Contents/MacOS/{}", app_lower, app_lower),
        ];
        
        for path in paths {
            if std::path::Path::new(&path).exists() {
                return Ok(true);
            }
        }
        Ok(false)
    }
    
    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    {
        Ok(false)
    }
}
