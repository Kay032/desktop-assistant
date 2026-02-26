use tauri::command;
use serde::{Deserialize, Serialize};
use std::process::Command as StdCommand;
use enigo::{Enigo, MouseControllable, KeyboardControllable};
use screenshots::Screen;
use rdev::{listen, Event, EventType, Key};
use std::sync::mpsc::{self, Sender, Receiver};
use std::thread;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WindowInfo {
    id: u32,
    title: String,
    app_name: String,
    is_visible: bool,
    is_minimized: bool,
    is_maximized: bool,
    position: Option<(i32, i32)>,
    size: Option<(u32, u32)>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScreenInfo {
    id: u32,
    width: u32,
    height: u32,
    is_primary: bool,
    scale_factor: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KeyboardState {
    keys_down: Vec<String>,
    modifiers: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MouseState {
    position: (i32, i32),
    buttons_down: Vec<String>,
}

#[command]
pub fn snap_window(direction: String) -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        // Try different window managers
        let command = match direction.as_str() {
            "left" => "wmctrl -r :ACTIVE: -e 0,0,0,50%,100%",
            "right" => "wmctrl -r :ACTIVE: -e 0,50%,0,50%,100%",
            "up" => "wmctrl -r :ACTIVE: -e 0,0,0,100%,50%",
            "down" => "wmctrl -r :ACTIVE: -e 0,0,50%,100%,50%",
            "center" => "wmctrl -r :ACTIVE: -e 0,25%,25%,50%,50%",
            "maximize" => "wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz",
            "minimize" => "wmctrl -r :ACTIVE: -b add,hidden",
            "restore" => "wmctrl -r :ACTIVE: -b remove,maximized_vert,maximized_horz,hidden",
            _ => return Err(format!("Unknown snap direction: {}", direction)),
        };
        
        match StdCommand::new("sh").args(&["-c", command]).output() {
            Ok(_) => Ok(format!("✅ Window snapped {}", direction)),
            Err(e) => Err(format!("Failed to snap window: {}", e)),
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        // Use PowerShell for window management
        let ps_command = match direction.as_str() {
            "left" => r#"(Add-Type '[DllImport("user32.dll")]public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);' -Name a -Pas)::ShowWindowAsync((Get-Process -Id $pid).MainWindowHandle, 3); $shell = New-Object -ComObject shell.application; $shell.Window($shell.Windows(), 0).Left = 0"#,
            "right" => r#"$shell = New-Object -ComObject shell.application; $shell.Window($shell.Windows(), 0).Left = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Width / 2"#,
            "maximize" => r#"(Add-Type '[DllImport("user32.dll")]public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);' -Name a -Pas)::ShowWindowAsync((Get-Process -Id $pid).MainWindowHandle, 3)"#,
            "minimize" => r#"(Add-Type '[DllImport("user32.dll")]public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);' -Name a -Pas)::ShowWindowAsync((Get-Process -Id $pid).MainWindowHandle, 6)"#,
            _ => return Err(format!("Unknown snap direction: {}", direction)),
        };
        
        match StdCommand::new("powershell").args(&["-Command", ps_command]).output() {
            Ok(_) => Ok(format!("✅ Window snapped {}", direction)),
            Err(e) => Err(format!("Failed to snap window: {}", e)),
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        // Use AppleScript for window management
        let osa_command = match direction.as_str() {
            "left" => r#"tell application "System Events" to set size of first window of first process to {600, 800}"#,
            "maximize" => r#"tell application "Finder" to set bounds of front window to {0, 0, 1440, 900}"#,
            "minimize" => r#"tell application "Finder" to set minimized of front window to true"#,
            _ => return Err(format!("Unknown snap direction: {}", direction)),
        };
        
        match StdCommand::new("osascript").args(&["-e", osa_command]).output() {
            Ok(_) => Ok(format!("✅ Window snapped {}", direction)),
            Err(e) => Err(format!("Failed to snap window: {}", e)),
        }
    }
    
    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    {
        Err("Window snapping not supported on this platform".to_string())
    }
}

#[command]
pub fn move_to_monitor(monitor_index: u32) -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        let command = format!("wmctrl -r :ACTIVE: -e 0,{},0,-1,-1", monitor_index * 1920);
        match StdCommand::new("sh").args(&["-c", &command]).output() {
            Ok(_) => Ok(format!("✅ Moved to monitor {}", monitor_index)),
            Err(e) => Err(format!("Failed to move window: {}", e)),
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        // PowerShell script to move to monitor
        let ps_command = format!(
            r#"Add-Type -AssemblyName System.Windows.Forms; $screen = [System.Windows.Forms.Screen]::AllScreens[{}]; $bounds = $screen.Bounds; $hwnd = (Get-Process -Id $pid).MainWindowHandle; Add-Type '[DllImport("user32.dll")]public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);' -Name a -Pas; [a]::MoveWindow($hwnd, $bounds.X, $bounds.Y, $bounds.Width, $bounds.Height, $true)"#,
            monitor_index
        );
        
        match StdCommand::new("powershell").args(&["-Command", &ps_command]).output() {
            Ok(_) => Ok(format!("✅ Moved to monitor {}", monitor_index)),
            Err(e) => Err(format!("Failed to move window: {}", e)),
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        // AppleScript for moving to another monitor
        let osa_command = r#"tell application "System Events" to set position of first window of first process to {0, 0}"#;
        match StdCommand::new("osascript").args(&["-e", osa_command]).output() {
            Ok(_) => Ok(format!("✅ Moved to monitor {}", monitor_index)),
            Err(e) => Err(format!("Failed to move window: {}", e)),
        }
    }
    
    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    {
        Err("Monitor switching not supported on this platform".to_string())
    }
}

#[command]
pub fn get_open_windows() -> Result<Vec<WindowInfo>, String> {
    let mut windows = Vec::new();
    
    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = StdCommand::new("wmctrl").args(&["-l"]).output() {
            let output_str = String::from_utf8_lossy(&output.stdout);
            for line in output_str.lines() {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 4 {
                    windows.push(WindowInfo {
                        id: u32::from_str_radix(parts[0], 16).unwrap_or(0),
                        title: parts[3..].join(" "),
                        app_name: parts[2].to_string(),
                        is_visible: true,
                        is_minimized: false,
                        is_maximized: false,
                        position: None,
                        size: None,
                    });
                }
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        // Use PowerShell to get windows
        let ps_command = r#"
            Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                public class Window {
                    [DllImport("user32.dll")]
                    public static extern IntPtr GetForegroundWindow();
                    [DllImport("user32.dll")]
                    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
                }
"@
            $hwnd = [Window]::GetForegroundWindow()
            $title = New-Object System.Text.StringBuilder 256
            [Window]::GetWindowText($hwnd, $title, $title.Capacity) | Out-Null
            Write-Output $title.ToString()
        "#;
        
        if let Ok(output) = StdCommand::new("powershell").args(&["-Command", ps_command]).output() {
            let title = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !title.is_empty() {
                windows.push(WindowInfo {
                    id: 0,
                    title,
                    app_name: "Windows".to_string(),
                    is_visible: true,
                    is_minimized: false,
                    is_maximized: false,
                    position: None,
                    size: None,
                });
            }
        }
    }
    
    Ok(windows)
}

#[command]
pub fn simulate_key_press(key: String, modifiers: Option<Vec<String>>) -> Result<String, String> {
    let mut enigo = Enigo::new();
    
    // Handle modifiers
    if let Some(mods) = modifiers {
        for mod_key in mods {
            match mod_key.as_str() {
                "ctrl" | "control" => enigo.key_down(enigo::Key::Control),
                "alt" => enigo.key_down(enigo::Key::Alt),
                "shift" => enigo.key_down(enigo::Key::Shift),
                "meta" | "win" | "cmd" => enigo.key_down(enigo::Key::Meta),
                _ => {},
            }
        }
    }
    
    // Handle the main key
    match key.as_str() {
        "enter" => enigo.key_click(enigo::Key::Return),
        "space" => enigo.key_click(enigo::Key::Space),
        "tab" => enigo.key_click(enigo::Key::Tab),
        "escape" | "esc" => enigo.key_click(enigo::Key::Escape),
        "backspace" => enigo.key_click(enigo::Key::Backspace),
        "delete" => enigo.key_click(enigo::Key::Delete),
        "up" => enigo.key_click(enigo::Key::UpArrow),
        "down" => enigo.key_click(enigo::Key::DownArrow),
        "left" => enigo.key_click(enigo::Key::LeftArrow),
        "right" => enigo.key_click(enigo::Key::RightArrow),
        "home" => enigo.key_click(enigo::Key::Home),
        "end" => enigo.key_click(enigo::Key::End),
        "pageup" => enigo.key_click(enigo::Key::PageUp),
        "pagedown" => enigo.key_click(enigo::Key::PageDown),
        "f1" => enigo.key_click(enigo::Key::F1),
        "f2" => enigo.key_click(enigo::Key::F2),
        "f3" => enigo.key_click(enigo::Key::F3),
        "f4" => enigo.key_click(enigo::Key::F4),
        "f5" => enigo.key_click(enigo::Key::F5),
        "f6" => enigo.key_click(enigo::Key::F6),
        "f7" => enigo.key_click(enigo::Key::F7),
        "f8" => enigo.key_click(enigo::Key::F8),
        "f9" => enigo.key_click(enigo::Key::F9),
        "f10" => enigo.key_click(enigo::Key::F10),
        "f11" => enigo.key_click(enigo::Key::F11),
        "f12" => enigo.key_click(enigo::Key::F12),
        _ => {
            if key.len() == 1 {
                // Single character
                let c = key.chars().next().unwrap();
                enigo.key_click(enigo::Key::Layout(c));
            } else {
                return Err(format!("Unknown key: {}", key));
            }
        }
    }
    
    // Release modifiers
    if let Some(mods) = modifiers {
        for mod_key in mods {
            match mod_key.as_str() {
                "ctrl" | "control" => enigo.key_up(enigo::Key::Control),
                "alt" => enigo.key_up(enigo::Key::Alt),
                "shift" => enigo.key_up(enigo::Key::Shift),
                "meta" | "win" | "cmd" => enigo.key_up(enigo::Key::Meta),
                _ => {},
            }
        }
    }
    
    Ok(format!("✅ Pressed key: {}", key))
}

#[command]
pub fn simulate_mouse_click(button: Option<String>, double: Option<bool>) -> Result<String, String> {
    let mut enigo = Enigo::new();
    let button = button.unwrap_or_else(|| "left".to_string());
    let double = double.unwrap_or(false);
    
    match button.as_str() {
        "left" => {
            if double {
                enigo.mouse_click(enigo::MouseButton::Left);
                enigo.mouse_click(enigo::MouseButton::Left);
            } else {
                enigo.mouse_click(enigo::MouseButton::Left);
            }
        }
        "right" => {
            enigo.mouse_click(enigo::MouseButton::Right);
        }
        "middle" => {
            enigo.mouse_click(enigo::MouseButton::Middle);
        }
        _ => return Err(format!("Unknown mouse button: {}", button)),
    }
    
    Ok(format!("✅ Clicked {} button", button))
}

#[command]
pub fn move_mouse(x: i32, y: i32) -> Result<String, String> {
    let mut enigo = Enigo::new();
    enigo.mouse_move_to(x, y);
    Ok(format!("✅ Moved mouse to ({}, {})", x, y))
}

#[command]
pub fn scroll_mouse(delta: i32, horizontal: Option<bool>) -> Result<String, String> {
    let mut enigo = Enigo::new();
    let horizontal = horizontal.unwrap_or(false);
    
    if horizontal {
        enigo.mouse_scroll_x(delta);
    } else {
        enigo.mouse_scroll_y(delta);
    }
    
    Ok(format!("✅ Scrolled by {}", delta))
}

#[command]
pub fn get_screens() -> Result<Vec<ScreenInfo>, String> {
    let mut screens = Vec::new();
    
    for (i, screen) in Screen::all().iter().enumerate() {
        screens.push(ScreenInfo {
            id: i as u32,
            width: screen.width(),
            height: screen.height(),
            is_primary: i == 0, // Not perfect, but works for most setups
            scale_factor: 1.0, // Would need to get from system
        });
    }
    
    Ok(screens)
}

#[command]
pub fn take_screenshot(screen_id: Option<u32>, path: Option<String>) -> Result<String, String> {
    let screens = Screen::all();
    let screen = if let Some(id) = screen_id {
        screens.get(id as usize).ok_or("Screen not found")?
    } else {
        screens.first().ok_or("No screens found")?
    };
    
    let image = screen.capture().map_err(|e| e.to_string())?;
    
    let save_path = path.unwrap_or_else(|| {
        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
        format!("screenshot_{}.png", timestamp)
    });
    
    image.save(&save_path).map_err(|e| e.to_string())?;
    
    Ok(format!("✅ Screenshot saved to {}", save_path))
}

#[command]
pub fn get_clipboard_text() -> Result<String, String> {
    use clipboard::{ClipboardProvider, ClipboardContext};
    
    let mut ctx: ClipboardContext = ClipboardProvider::new().map_err(|e| e.to_string())?;
    let content = ctx.get_contents().map_err(|e| e.to_string())?;
    
    Ok(content)
}

#[command]
pub fn set_clipboard_text(text: String) -> Result<String, String> {
    use clipboard::{ClipboardProvider, ClipboardContext};
    
    let mut ctx: ClipboardContext = ClipboardProvider::new().map_err(|e| e.to_string())?;
    ctx.set_contents(text.clone()).map_err(|e| e.to_string())?;
    
    Ok(format!("✅ Copied to clipboard: {}", text))
}

#[command]
pub fn start_key_listener() -> Result<String, String> {
    let (tx, rx): (Sender<Event>, Receiver<Event>) = mpsc::channel();
    
    thread::spawn(move || {
        if let Err(error) = listen(move |event| {
            tx.send(event).unwrap();
        }) {
            eprintln!("Error in key listener: {:?}", error);
        }
    });
    
    // Spawn a thread to process events (in a real app, you'd store this somewhere)
    thread::spawn(move || {
        for event in rx {
            match event.event_type {
                EventType::KeyPress(key) => {
                    println!("Key pressed: {:?}", key);
                }
                EventType::KeyRelease(key) => {
                    println!("Key released: {:?}", key);
                }
                _ => {}
            }
        }
    });
    
    Ok("✅ Started key listener".to_string())
}

#[command]
pub fn get_keyboard_state() -> Result<KeyboardState, String> {
    // This would require a more complex implementation with platform-specific APIs
    // For now, return a simplified version
    Ok(KeyboardState {
        keys_down: Vec::new(),
        modifiers: Vec::new(),
    })
}

#[command]
pub fn get_mouse_position() -> Result<(i32, i32), String> {
    let enigo = Enigo::new();
    Ok(enigo.mouse_location())
}

#[command]
pub fn simulate_drag_and_drop(from_x: i32, from_y: i32, to_x: i32, to_y: i32) -> Result<String, String> {
    let mut enigo = Enigo::new();
    
    // Move to start position
    enigo.mouse_move_to(from_x, from_y);
    thread::sleep(Duration::from_millis(100));
    
    // Mouse down
    enigo.mouse_down(enigo::MouseButton::Left);
    thread::sleep(Duration::from_millis(100));
    
    // Drag to end position
    enigo.mouse_move_to(to_x, to_y);
    thread::sleep(Duration::from_millis(100));
    
    // Mouse up
    enigo.mouse_up(enigo::MouseButton::Left);
    
    Ok(format!("✅ Dragged from ({},{}) to ({},{})", from_x, from_y, to_x, to_y))
}

#[command]
pub fn type_text(text: String, delay_ms: Option<u64>) -> Result<String, String> {
    let mut enigo = Enigo::new();
    let delay = delay_ms.unwrap_or(10);
    
    for c in text.chars() {
        enigo.key_click(enigo::Key::Layout(c));
        thread::sleep(Duration::from_millis(delay));
    }
    
    Ok(format!("✅ Typed: {}", text))
}

#[command]
pub fn get_active_window_info() -> Result<WindowInfo, String> {
    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = StdCommand::new("xdotool").args(&["getactivewindow", "getwindowname"]).output() {
            let title = String::from_utf8_lossy(&output.stdout).trim().to_string();
            
            if let Ok(pid_output) = StdCommand::new("xdotool").args(&["getactivewindow", "getwindowpid"]).output() {
                let pid_str = String::from_utf8_lossy(&pid_output.stdout).trim().to_string();
                
                return Ok(WindowInfo {
                    id: 0,
                    title,
                    app_name: pid_str,
                    is_visible: true,
                    is_minimized: false,
                    is_maximized: false,
                    position: None,
                    size: None,
                });
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        use winapi::um::winuser::{GetForegroundWindow, GetWindowTextW};
        use std::ptr;
        
        unsafe {
            let hwnd = GetForegroundWindow();
            let mut title_buf = [0u16; 256];
            let len = GetWindowTextW(hwnd, title_buf.as_mut_ptr(), 256);
            
            if len > 0 {
                let title = String::from_utf16_lossy(&title_buf[..len as usize]);
                
                return Ok(WindowInfo {
                    id: hwnd as u32,
                    title,
                    app_name: "Windows".to_string(),
                    is_visible: true,
                    is_minimized: false,
                    is_maximized: false,
                    position: None,
                    size: None,
                });
            }
        }
    }
    
    Err("Could not get active window info".to_string())
}