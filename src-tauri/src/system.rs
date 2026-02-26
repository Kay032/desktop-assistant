use std::process::Command;
use std::thread;
use std::time::Duration;
use tauri::Manager;
use sysinfo::{System, SystemExt, ProcessExt};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct SystemInfo {
    pub os: String,
    pub kernel: String,
    pub cpu_usage: f32,
    pub cpu_cores: usize,
    pub memory_total: u64,
    pub memory_used: u64,
    pub memory_percent: f32,
    pub uptime: u64,
    pub disks: Vec<DiskInfo>,
    pub top_processes: Vec<ProcessInfo>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub total_space: u64,
    pub available_space: u64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory_usage: u64,
}

#[tauri::command]
pub fn get_system_info() -> Result<SystemInfo, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    // Give it a moment to collect CPU usage
    thread::sleep(Duration::from_millis(200));
    sys.refresh_cpu();
    
    let os = System::name().unwrap_or_else(|| "Unknown".to_string());
    let kernel = System::kernel_version().unwrap_or_else(|| "Unknown".to_string());
    let cpu_usage = sys.global_cpu_info().cpu_usage();
    let cpu_cores = sys.cpus().len();
    let memory_total = sys.total_memory();
    let memory_used = sys.used_memory();
    let memory_percent = (memory_used as f32 / memory_total as f32) * 100.0;
    let uptime = System::uptime();
    
    let mut disks = Vec::new();
    for disk in sys.disks() {
        disks.push(DiskInfo {
            name: disk.name().to_string_lossy().to_string(),
            mount_point: disk.mount_point().to_string_lossy().to_string(),
            total_space: disk.total_space(),
            available_space: disk.available_space(),
        });
    }
    
    let mut top_processes = Vec::new();
    for (pid, process) in sys.processes().iter().take(10) {
        top_processes.push(ProcessInfo {
            pid: pid.as_u32(),
            name: process.name().to_string(),
            cpu_usage: process.cpu_usage(),
            memory_usage: process.memory(),
        });
    }
    
    Ok(SystemInfo {
        os,
        kernel,
        cpu_usage,
        cpu_cores,
        memory_total,
        memory_used,
        memory_percent,
        uptime,
        disks,
        top_processes,
    })
}

#[tauri::command]
pub fn control_system(action: String, delay: u64) -> Result<String, String> {
    let command = match action.as_str() {
        "shutdown" => {
            if cfg!(target_os = "windows") {
                if delay > 0 {
                    format!("shutdown /s /t {}", delay)
                } else {
                    "shutdown /s /t 0".to_string()
                }
            } else if cfg!(target_os = "macos") {
                if delay > 0 {
                    format!("sudo shutdown -h +{}", delay / 60)
                } else {
                    "sudo shutdown -h now".to_string()
                }
            } else {
                // Linux
                if delay > 0 {
                    format!("shutdown -h +{}", delay / 60)
                } else {
                    "shutdown -h now".to_string()
                }
            }
        },
        "restart" => {
            if cfg!(target_os = "windows") {
                if delay > 0 {
                    format!("shutdown /r /t {}", delay)
                } else {
                    "shutdown /r /t 0".to_string()
                }
            } else if cfg!(target_os = "macos") {
                if delay > 0 {
                    format!("sudo shutdown -r +{}", delay / 60)
                } else {
                    "sudo shutdown -r now".to_string()
                }
            } else {
                // Linux
                if delay > 0 {
                    format!("shutdown -r +{}", delay / 60)
                } else {
                    "shutdown -r now".to_string()
                }
            }
        },
        "sleep" => {
            if cfg!(target_os = "windows") {
                "rundll32.exe powrprof.dll,SetSuspendState 0,1,0".to_string()
            } else if cfg!(target_os = "macos") {
                "pmset sleepnow".to_string()
            } else {
                // Linux
                "systemctl suspend".to_string()
            }
        },
        "lock" => {
            if cfg!(target_os = "windows") {
                "rundll32.exe user32.dll,LockWorkStation".to_string()
            } else if cfg!(target_os = "macos") {
                "/System/Library/CoreServices/Menu\\ Extras/User.menu/Contents/Resources/CGSession -suspend".to_string()
            } else {
                // Linux (varies by DE)
                "gnome-screensaver-command -l".to_string()
            }
        },
        "hibernate" => {
            if cfg!(target_os = "windows") {
                "shutdown /h".to_string()
            } else if cfg!(target_os = "macos") {
                "sudo pmset hibernatemode 3 && sudo pmset sleepnow".to_string()
            } else {
                // Linux
                "systemctl hibernate".to_string()
            }
        },
        "logout" => {
            if cfg!(target_os = "windows") {
                "shutdown /l".to_string()
            } else if cfg!(target_os = "macos") {
                "osascript -e 'tell app \"System Events\" to log out'".to_string()
            } else {
                // Linux
                "gnome-session-quit --logout --no-prompt".to_string()
            }
        },
        _ => return Err(format!("Unknown action: {}", action)),
    };
    
    // Execute the command
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(&["/C", &command])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Command::new("sh")
            .args(&["-c", &command])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(format!("{} command executed", action))
}

#[tauri::command]
pub fn kill_process(pid: u32) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("taskkill")
            .args(&["/F", "/PID", &pid.to_string()])
            .output()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Command::new("kill")
            .args(&["-9", &pid.to_string()])
            .output()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(format!("Process {} killed", pid))
}