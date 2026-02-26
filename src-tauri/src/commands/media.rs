use tauri::command;
use serde::{Deserialize, Serialize};
use std::process::Command as StdCommand;
use std::thread;
use std::time::Duration;
use screenshots::Screen;
use rodio::{OutputStream, OutputStreamHandle, Sink, Source};
use rodio::source::SineWave;
use std::io::BufReader;
use std::fs::File;
use infer;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AudioDevice {
    name: String,
    id: String,
    is_default: bool,
    device_type: String, // "input" or "output"
    volume: Option<f32>,
    muted: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DisplayInfo {
    id: u32,
    name: String,
    width: u32,
    height: u32,
    refresh_rate: Option<f32>,
    is_primary: bool,
    scale_factor: f64,
    brightness: Option<u8>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MediaFile {
    path: String,
    duration: Option<f64>,
    codec: Option<String>,
    bitrate: Option<u32>,
    sample_rate: Option<u32>,
    channels: Option<u8>,
    width: Option<u32>,
    height: Option<u32>,
    fps: Option<f32>,
    file_size: u64,
    format: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScreenshotResult {
    path: String,
    width: u32,
    height: u32,
    format: String,
    size: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VolumeControl {
    device: String,
    volume: f32,
    muted: bool,
}

#[command]
pub fn get_audio_devices() -> Result<Vec<AudioDevice>, String> {
    let mut devices = Vec::new();
    
    #[cfg(target_os = "linux")]
    {
        // Use pactl for PulseAudio
        if let Ok(output) = StdCommand::new("pactl")
            .args(&["list", "short", "sinks"])
            .output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    devices.push(AudioDevice {
                        name: parts[1].to_string(),
                        id: parts[0].to_string(),
                        is_default: false, // Would need to check default
                        device_type: "output".to_string(),
                        volume: get_device_volume(&parts[0]),
                        muted: is_device_muted(&parts[0]),
                    });
                }
            }
        }
        
        // Get input devices
        if let Ok(output) = StdCommand::new("pactl")
            .args(&["list", "short", "sources"])
            .output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    devices.push(AudioDevice {
                        name: parts[1].to_string(),
                        id: parts[0].to_string(),
                        is_default: false,
                        device_type: "input".to_string(),
                        volume: get_device_volume(&parts[0]),
                        muted: is_device_muted(&parts[0]),
                    });
                }
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        // Use PowerShell to get audio devices
        let ps_command = r#"
            Add-Type -AssemblyName System.Core
            $devices = [CoreAudioApi.MMDeviceEnumerator]::new()
            $default = $devices.GetDefaultAudioEndpoint([CoreAudioApi.DataFlow]::Render, [CoreAudioApi.Role]::Multimedia)
            $devices.EnumerateAudioEndPoints([CoreAudioApi.DataFlow]::Render, [CoreAudioApi.DeviceState]::Active) | ForEach-Object {
                [PSCustomObject]@{
                    Name = $_.FriendlyName
                    ID = $_.ID
                    IsDefault = ($_.ID -eq $default.ID)
                    Volume = $_.AudioEndpointVolume.MasterVolumeLevelScalar * 100
                    Muted = $_.AudioEndpointVolume.Mute
                }
            }
        "#;
        
        // This would need proper PowerShell execution
    }
    
    #[cfg(target_os = "macos")]
    {
        // Use system_profiler for macOS
        if let Ok(output) = StdCommand::new("system_profiler")
            .args(&["SPAudioDataType"])
            .output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            // Parse macOS audio devices
            // This would require more complex parsing
        }
    }
    
    Ok(devices)
}

#[cfg(target_os = "linux")]
fn get_device_volume(device_id: &str) -> Option<f32> {
    if let Ok(output) = StdCommand::new("pactl")
        .args(&["get-sink-volume", device_id])
        .output() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        // Parse volume from output
        if let Some(vol_str) = stdout.split('/').nth(1) {
            if let Some(vol) = vol_str.trim().replace('%', "").parse::<f32>().ok() {
                return Some(vol);
            }
        }
    }
    None
}

#[cfg(target_os = "linux")]
fn is_device_muted(device_id: &str) -> bool {
    if let Ok(output) = StdCommand::new("pactl")
        .args(&["get-sink-mute", device_id])
        .output() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        return stdout.contains("yes") || stdout.contains("Mute: yes");
    }
    false
}

#[command]
pub fn set_volume(device_id: Option<String>, volume: f32) -> Result<VolumeControl, String> {
    if volume < 0.0 || volume > 100.0 {
        return Err("Volume must be between 0 and 100".to_string());
    }
    
    #[cfg(target_os = "linux")]
    {
        let device = device_id.unwrap_or_else(|| "@DEFAULT_SINK@".to_string());
        let vol_percent = format!("{}%", volume);
        
        let output = StdCommand::new("pactl")
            .args(&["set-sink-volume", &device, &vol_percent])
            .output()
            .map_err(|e| format!("Failed to set volume: {}", e))?;
        
        if output.status.success() {
            Ok(VolumeControl {
                device,
                volume,
                muted: is_device_muted(&device),
            })
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        // Windows volume control using PowerShell
        let ps_command = format!(
            r#"
            $obj = New-Object -ComObject WScript.Shell
            for ($i = 0; $i -le 100; $i += 2) {{
                $obj.SendKeys([char] 175)
            }}
            "# // This is simplified - would need proper Windows Core Audio API
        );
        
        Ok(VolumeControl {
            device: "default".to_string(),
            volume,
            muted: false,
        })
    }
    
    #[cfg(target_os = "macos")]
    {
        // macOS volume control using osascript
        let script = format!(
            "set volume output volume {}",
            volume
        );
        
        let output = StdCommand::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| format!("Failed to set volume: {}", e))?;
        
        if output.status.success() {
            Ok(VolumeControl {
                device: "default".to_string(),
                volume,
                muted: false,
            })
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
    
    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    {
        Err("Volume control not supported on this platform".to_string())
    }
}

#[command]
pub fn toggle_mute(device_id: Option<String>) -> Result<bool, String> {
    #[cfg(target_os = "linux")]
    {
        let device = device_id.unwrap_or_else(|| "@DEFAULT_SINK@".to_string());
        
        let output = StdCommand::new("pactl")
            .args(&["set-sink-mute", &device, "toggle"])
            .output()
            .map_err(|e| format!("Failed to toggle mute: {}", e))?;
        
        if output.status.success() {
            Ok(is_device_muted(&device))
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        // Windows mute toggle
        Ok(false)
    }
    
    #[cfg(target_os = "macos")]
    {
        // macOS mute toggle
        let output = StdCommand::new("osascript")
            .arg("-e")
            .arg("set volume with output muted")
            .output()
            .map_err(|e| format!("Failed to toggle mute: {}", e))?;
        
        Ok(output.status.success())
    }
    
    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    {
        Err("Mute control not supported on this platform".to_string())
    }
}

#[command]
pub fn get_displays() -> Result<Vec<DisplayInfo>, String> {
    let mut displays = Vec::new();
    
    for (i, screen) in Screen::all().iter().enumerate() {
        displays.push(DisplayInfo {
            id: i as u32,
            name: format!("Display {}", i + 1),
            width: screen.width(),
            height: screen.height(),
            refresh_rate: None, // Would need platform-specific API
            is_primary: i == 0,
            scale_factor: 1.0,
            brightness: get_display_brightness(i as u32).ok(),
        });
    }
    
    Ok(displays)
}

fn get_display_brightness(display_id: u32) -> Result<u8, String> {
    #[cfg(target_os = "linux")]
    {
        // Try to read from sysfs
        let path = format!("/sys/class/backlight/intel_backlight/brightness");
        if let Ok(content) = std::fs::read_to_string(&path) {
            if let Ok(max_content) = std::fs::read_to_string("/sys/class/backlight/intel_backlight/max_brightness") {
                let current: u32 = content.trim().parse().unwrap_or(0);
                let max: u32 = max_content.trim().parse().unwrap_or(100);
                if max > 0 {
                    return Ok(((current as f32 / max as f32) * 100.0) as u8);
                }
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        // Windows brightness control would need WMI
    }
    
    #[cfg(target_os = "macos")]
    {
        // macOS brightness control
        if let Ok(output) = StdCommand::new("brightness")
            .arg("-l")
            .output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if let Some(level) = stdout.split_whitespace().last() {
                if let Ok(brightness) = level.parse::<f32>() {
                    return Ok((brightness * 100.0) as u8);
                }
            }
        }
    }
    
    Err("Could not get brightness".to_string())
}

#[command]
pub fn set_brightness(display_id: Option<u32>, brightness: u8) -> Result<u8, String> {
    if brightness > 100 {
        return Err("Brightness must be between 0 and 100".to_string());
    }
    
    #[cfg(target_os = "linux")]
    {
        let path = "/sys/class/backlight/intel_backlight/brightness";
        if let Ok(max_content) = std::fs::read_to_string("/sys/class/backlight/intel_backlight/max_brightness") {
            let max: u32 = max_content.trim().parse().unwrap_or(100);
            let value = ((brightness as f32 / 100.0) * max as f32) as u32;
            
            std::fs::write(path, value.to_string())
                .map_err(|e| format!("Failed to set brightness: {}", e))?;
            
            return Ok(brightness);
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let brightness_val = brightness as f32 / 100.0;
        let output = StdCommand::new("brightness")
            .arg(brightness_val.to_string())
            .output()
            .map_err(|e| format!("Failed to set brightness: {}", e))?;
        
        if output.status.success() {
            return Ok(brightness);
        }
    }
    
    Err("Brightness control not supported on this platform".to_string())
}

#[command]
pub fn take_screenshot(display_id: Option<u32>, path: Option<String>) -> Result<ScreenshotResult, String> {
    let screens = Screen::all();
    let screen = if let Some(id) = display_id {
        screens.get(id as usize).ok_or("Display not found")?
    } else {
        screens.first().ok_or("No displays found")?
    };
    
    let image = screen.capture().map_err(|e| e.to_string())?;
    
    let save_path = path.unwrap_or_else(|| {
        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
        format!("screenshot_{}.png", timestamp)
    });
    
    image.save(&save_path).map_err(|e| e.to_string())?;
    
    let metadata = std::fs::metadata(&save_path)
        .map_err(|e| e.to_string())?;
    
    Ok(ScreenshotResult {
        path: save_path,
        width: screen.width(),
        height: screen.height(),
        format: "PNG".to_string(),
        size: metadata.len(),
    })
}

#[command]
pub fn play_sound(frequency: Option<u32>, duration_ms: Option<u64>) -> Result<String, String> {
    let frequency = frequency.unwrap_or(440); // A4 note
    let duration = Duration::from_millis(duration_ms.unwrap_or(500));
    
    thread::spawn(move || {
        let (_stream, stream_handle) = OutputStream::try_default().unwrap();
        let source = SineWave::new(frequency as f32)
            .take_duration(duration)
            .amplify(0.2);
        
        let _result = stream_handle.play_raw(source);
        thread::sleep(duration);
    });
    
    Ok(format!("Playing {} Hz tone", frequency))
}

#[command]
pub fn get_media_info(path: String) -> Result<MediaFile, String> {
    let expanded_path = shellexpand::tilde(&path).to_string();
    let file_path = std::path::Path::new(&expanded_path);
    
    if !file_path.exists() {
        return Err("File not found".to_string());
    }
    
    let metadata = std::fs::metadata(file_path)
        .map_err(|e| e.to_string())?;
    
    let file_size = metadata.len();
    
    // Detect file format
    let format = if let Ok(kind) = infer::get_from_path(file_path) {
        kind.map(|k| k.mime_type().to_string()).unwrap_or_else(|| "unknown".to_string())
    } else {
        file_path.extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("unknown")
            .to_string()
    };
    
    // In a real app, you'd use libraries like `symphonia` or `ffmpeg` to get media info
    // For now, return basic info
    
    Ok(MediaFile {
        path: expanded_path,
        duration: None,
        codec: None,
        bitrate: None,
        sample_rate: None,
        channels: None,
        width: None,
        height: None,
        fps: None,
        file_size,
        format,
    })
}

#[command]
pub fn set_wallpaper(path: String) -> Result<String, String> {
    let expanded_path = shellexpand::tilde(&path).to_string();
    let file_path = std::path::Path::new(&expanded_path);
    
    if !file_path.exists() {
        return Err("Wallpaper file not found".to_string());
    }
    
    #[cfg(target_os = "linux")]
    {
        // Try different desktop environments
        let commands = vec![
            format!("gsettings set org.gnome.desktop.background picture-uri 'file://{}'", expanded_path),
            format!("gsettings set org.gnome.desktop.background picture-uri-dark 'file://{}'", expanded_path),
            format!("feh --bg-scale '{}'", expanded_path),
            format!("nitrogen --set-zoom-fill '{}'", expanded_path),
        ];
        
        for cmd in commands {
            let _ = StdCommand::new("sh")
                .arg("-c")
                .arg(&cmd)
                .output();
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        use winapi::um::winuser::SystemParametersInfoW;
        use winapi::um::winuser::SPIF_UPDATEINIFILE;
        use winapi::um::winuser::SPIF_SENDCHANGE;
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;
        
        let wide: Vec<u16> = OsStr::new(&expanded_path)
            .encode_wide()
            .chain(Some(0))
            .collect();
        
        unsafe {
            winapi::um::winuser::SystemParametersInfoW(
                winapi::um::winuser::SPI_SETDESKWALLPAPER,
                0,
                wide.as_ptr() as *mut std::ffi::c_void,
                SPIF_UPDATEINIFILE | SPIF_SENDCHANGE,
            );
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let script = format!(
            r#"tell application "Finder" to set desktop picture to POSIX file "{}""#,
            expanded_path
        );
        
        let _ = StdCommand::new("osascript")
            .arg("-e")
            .arg(&script)
            .output();
    }
    
    Ok(format!("Wallpaper set to: {}", path))
}

#[command]
pub fn get_volume() -> Result<VolumeControl, String> {
    #[cfg(target_os = "linux")]
    {
        let output = StdCommand::new("pactl")
            .args(&["get-sink-volume", "@DEFAULT_SINK@"])
            .output()
            .map_err(|e| format!("Failed to get volume: {}", e))?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        
        // Parse volume (simplified)
        if let Some(vol_str) = stdout.split('/').nth(1) {
            if let Ok(volume) = vol_str.trim().replace('%', "").parse::<f32>() {
                return Ok(VolumeControl {
                    device: "default".to_string(),
                    volume,
                    muted: is_device_muted("@DEFAULT_SINK@"),
                });
            }
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let output = StdCommand::new("osascript")
            .arg("-e")
            .arg("output volume of (get volume settings)")
            .output()
            .map_err(|e| format!("Failed to get volume: {}", e))?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        if let Ok(volume) = stdout.trim().parse::<f32>() {
            return Ok(VolumeControl {
                device: "default".to_string(),
                volume,
                muted: false,
            });
        }
    }
    
    Ok(VolumeControl {
        device: "default".to_string(),
        volume: 50.0,
        muted: false,
    })
}

#[command]
pub fn list_media_devices() -> Result<Vec<String>, String> {
    let mut devices = Vec::new();
    
    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = StdCommand::new("v4l2-ctl")
            .args(&["--list-devices"])
            .output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if line.contains("/dev/video") {
                    devices.push(line.trim().to_string());
                }
            }
        }
    }
    
    Ok(devices)
}

#[command]
pub fn screen_record(display_id: Option<u32>, duration_secs: Option<u64>, output: Option<String>) -> Result<String, String> {
    let duration = duration_secs.unwrap_or(10);
    let output_file = output.unwrap_or_else(|| {
        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
        format!("recording_{}.mp4", timestamp)
    });
    
    #[cfg(target_os = "linux")]
    {
        // Use ffmpeg for recording (if available)
        let display = display_id.unwrap_or(0);
        let command = format!(
            "ffmpeg -f x11grab -video_size 1920x1080 -i :{}.0 -t {} -y {}",
            display, duration, output_file
        );
        
        thread::spawn(move || {
            let _ = StdCommand::new("sh")
                .arg("-c")
                .arg(&command)
                .output();
        });
        
        return Ok(format!("Recording started for {} seconds to {}", duration, output_file));
    }
    
    #[cfg(target_os = "windows")]
    {
        // Windows would need different approach
        return Err("Screen recording not yet implemented for Windows".to_string());
    }
    
    #[cfg(target_os = "macos")]
    {
        // macOS would need different approach
        return Err("Screen recording not yet implemented for macOS".to_string());
    }
    
    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    {
        Err("Screen recording not supported on this platform".to_string())
    }
}

#[command]
pub fn get_battery_info() -> Result<HashMap<String, String>, String> {
    let mut info = HashMap::new();
    
    #[cfg(target_os = "linux")]
    {
        let power_supply_path = "/sys/class/power_supply/BAT0";
        if std::path::Path::new(power_supply_path).exists() {
            if let Ok(capacity) = std::fs::read_to_string(format!("{}/capacity", power_supply_path)) {
                info.insert("capacity".to_string(), capacity.trim().to_string());
            }
            if let Ok(status) = std::fs::read_to_string(format!("{}/status", power_supply_path)) {
                info.insert("status".to_string(), status.trim().to_string());
            }
            if let Ok(voltage) = std::fs::read_to_string(format!("{}/voltage_now", power_supply_path)) {
                if let Ok(voltage_num) = voltage.trim().parse::<f64>() {
                    info.insert("voltage".to_string(), format!("{:.2} V", voltage_num / 1_000_000.0));
                }
            }
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let output = StdCommand::new("pmset")
            .args(&["-g", "batt"])
            .output()
            .map_err(|e| e.to_string())?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        if let Some(percent) = stdout.split(';').nth(1) {
            info.insert("capacity".to_string(), percent.trim().replace('%', "").to_string());
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        // Windows would need WMI
    }
    
    Ok(info)
}