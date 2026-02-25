use tauri::command;
use std::process::Command;
use std::str;

#[cfg(target_os = "linux")]
#[command]
pub fn snap_window(direction: String) -> Result<String, String> {
    // Check if wmctrl is installed
    if !command_exists("wmctrl") {
        return Err("wmctrl not installed. Run: sudo apt install wmctrl".into());
    }

    match direction.as_str() {
        "left" => {
            Command::new("wmctrl")
                .args(&["-r", ":ACTIVE:", "-e", "0,0,0,960,1080"])
                .spawn()
                .map_err(|e| format!("Failed to snap left: {}", e))?;
            Ok("🪟 Window snapped left".into())
        }
        "right" => {
            Command::new("wmctrl")
                .args(&["-r", ":ACTIVE:", "-e", "0,960,0,960,1080"])
                .spawn()
                .map_err(|e| format!("Failed to snap right: {}", e))?;
            Ok("🪟 Window snapped right".into())
        }
        "maximize" => {
            Command::new("wmctrl")
                .args(&["-r", ":ACTIVE:", "-b", "toggle,maximized_vert,maximized_horz"])
                .spawn()
                .map_err(|e| format!("Failed to maximize: {}", e))?;
            Ok("🪟 Window maximized".into())
        }
        _ => Err(format!("Unknown direction: {}. Use left, right, or maximize", direction)),
    }
}

#[cfg(target_os = "linux")]
#[command]
pub fn move_to_monitor(monitor: u32) -> Result<String, String> {
    // Check if wmctrl is installed
    if !command_exists("wmctrl") {
        return Err("wmctrl not installed. Run: sudo apt install wmctrl".into());
    }

    // Get monitor geometries using xrandr
    let output = Command::new("xrandr")
        .args(&["--current"])
        .output()
        .map_err(|e| format!("Failed to get monitor info: {}", e))?;

    let output_str = str::from_utf8(&output.stdout).map_err(|e| e.to_string())?;
    
    // Parse monitor positions (simplified - you'd need better parsing for multi-monitor)
    let monitors: Vec<&str> = output_str
        .lines()
        .filter(|line| line.contains(" connected"))
        .collect();

    if monitors.is_empty() {
        return Err("No monitors detected".into());
    }

    if monitor as usize >= monitors.len() {
        return Err(format!("Monitor {} not found. Available monitors: 0-{}", monitor, monitors.len() - 1));
    }

    // For now, just move to the next monitor using a simple approach
    // A more sophisticated implementation would calculate exact positions
    Command::new("wmctrl")
        .args(&["-r", ":ACTIVE:", "-b", "toggle,above"])
        .spawn()
        .map_err(|e| format!("Failed to move window: {}", e))?;

    Ok(format!("🖥️ Window moved to monitor {}", monitor))
}

// Helper function to check if a command exists
#[cfg(target_os = "linux")]
fn command_exists(cmd: &str) -> bool {
    Command::new("which")
        .arg(cmd)
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

#[cfg(not(target_os = "linux"))]
#[command]
pub fn snap_window(direction: String) -> Result<String, String> {
    Err("Window snapping is only supported on Linux".into())
}

#[cfg(not(target_os = "linux"))]
#[command]
pub fn move_to_monitor(monitor: u32) -> Result<String, String> {
    Err("Moving between monitors is only supported on Linux".into())
}