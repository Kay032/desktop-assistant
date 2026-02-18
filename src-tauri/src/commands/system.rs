use tauri::command;
use serde::{Deserialize, Serialize};
use sysinfo::{System, Disks};
use std::thread;
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemInfo {
    os: String,
    kernel: String,
    host_name: String,
    cpu_usage: f32,
    cpu_cores: usize,
    memory_total: u64,
    memory_used: u64,
    memory_percent: f32,
    uptime: u64,
    disks: Vec<DiskInfo>,
    top_processes: Vec<ProcessInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiskInfo {
    name: String,
    mount_point: String,
    total_space: u64,
    available_space: u64,
    usage_percent: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessInfo {
    pid: u32,
    name: String,
    cpu_usage: f32,
    memory_usage: u64,
}

#[command]
pub fn get_system_info() -> Result<SystemInfo, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    // Get CPU info - use global_cpu_info() instead of global_cpu_usage()
    let cpu_usage = sys.global_cpu_info().cpu_usage() as f32;
    let cpu_cores = sys.cpus().len();
    
    // Get memory info
    let memory_total = sys.total_memory();
    let memory_used = sys.used_memory();
    let memory_percent = if memory_total > 0 {
        (memory_used as f32 / memory_total as f32) * 100.0
    } else {
        0.0
    };
    
    // Get disk info
    let disks = Disks::new_with_refreshed_list();
    let disk_info: Vec<DiskInfo> = disks.iter().map(|disk| {
        let total = disk.total_space();
        let available = disk.available_space();
        let usage = if total > 0 {
            ((total - available) as f32 / total as f32) * 100.0
        } else {
            0.0
        };
        
        DiskInfo {
            name: disk.name().to_string_lossy().to_string(),
            mount_point: disk.mount_point().to_string_lossy().to_string(),
            total_space: total,
            available_space: available,
            usage_percent: usage,
        }
    }).collect();
    
    // Get top processes
    sys.refresh_processes();
    let mut processes: Vec<ProcessInfo> = sys.processes().iter()
        .map(|(pid, process)| ProcessInfo {
            pid: pid.as_u32(),
            name: process.name().to_string(),  // Fixed: removed to_string_lossy()
            cpu_usage: process.cpu_usage(),
            memory_usage: process.memory(),
        })
        .collect();
    
    // Sort by CPU usage descending and take top 5
    processes.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap_or(std::cmp::Ordering::Equal));
    processes.truncate(5);
    
    Ok(SystemInfo {
        os: std::env::consts::OS.to_string(),
        kernel: System::kernel_version().unwrap_or_else(|| "Unknown".to_string()),
        host_name: System::host_name().unwrap_or_else(|| "Unknown".to_string()),
        cpu_usage,
        cpu_cores,
        memory_total,
        memory_used,
        memory_percent,
        uptime: System::uptime(),
        disks: disk_info,
        top_processes: processes,
    })
}

#[command]
pub fn control_system(action: String, delay: Option<u64>) -> Result<String, String> {
    let delay_seconds = delay.unwrap_or(0);
    
    if delay_seconds > 0 {
        // Clone the action string to avoid move issues
        let action_clone = action.clone();
        
        // Spawn a thread to handle delayed action
        thread::spawn(move || {
            thread::sleep(Duration::from_secs(delay_seconds));
            execute_system_action(&action_clone);
        });
        
        Ok(format!("⏰ Will {} in {} seconds", action, delay_seconds))
    } else {
        execute_system_action(&action);
        Ok(format!("🖥️ Executing: {}", action))
    }
}

fn execute_system_action(action: &str) {
    match action {
        "shutdown" => {
            #[cfg(target_os = "linux")]
            {
                let _ = std::process::Command::new("shutdown").arg("now").spawn();
            }
        }
        "restart" => {
            #[cfg(target_os = "linux")]
            {
                let _ = std::process::Command::new("shutdown").arg("-r").arg("now").spawn();
            }
        }
        "sleep" => {
            #[cfg(target_os = "linux")]
            {
                let _ = std::process::Command::new("systemctl").arg("suspend").spawn();
            }
        }
        "lock" => {
            #[cfg(target_os = "linux")]
            {
                let _ = std::process::Command::new("gnome-screensaver-command").arg("-l").spawn()
                    .or_else(|_| std::process::Command::new("loginctl").arg("lock-session").spawn());
            }
        }
        _ => {}
    }
}

#[command]
pub fn kill_process(pid: u32) -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        // Use std::process::Command to kill the process
        let output = std::process::Command::new("kill")
            .arg(pid.to_string())
            .output()
            .map_err(|e| format!("Failed to execute kill command: {}", e))?;
        
        if output.status.success() {
            Ok(format!("Process {} terminated", pid))
        } else {
            let error = String::from_utf8_lossy(&output.stderr);
            Err(format!("Failed to kill process {}: {}", pid, error))
        }
    }
    
    #[cfg(not(target_os = "linux"))]
    {
        Err("Process killing not supported on this platform".to_string())
    }
}