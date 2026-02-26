use tauri::command;
use serde::{Deserialize, Serialize};
use sysinfo::{System, Disks, Networks, SystemExt, ProcessExt, DiskExt, NetworkExt};
use std::thread;
use std::time::Duration;
use std::process::Command as StdCommand;
use whoami;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemInfo {
    os: String,
    kernel: String,
    host_name: String,
    cpu_usage: f32,
    cpu_cores: usize,
    cpu_name: Option<String>,
    memory_total: u64,
    memory_used: u64,
    memory_percent: f32,
    swap_total: u64,
    swap_used: u64,
    uptime: u64,
    disks: Vec<DiskInfo>,
    network_interfaces: Vec<NetworkInfo>,
    top_processes: Vec<ProcessInfo>,
    users: Vec<UserInfo>,
    temperature: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiskInfo {
    name: String,
    mount_point: String,
    total_space: u64,
    available_space: u64,
    used_space: u64,
    usage_percent: f32,
    file_system: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkInfo {
    interface: String,
    received: u64,
    transmitted: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessInfo {
    pid: u32,
    name: String,
    cpu_usage: f32,
    memory_usage: u64,
    memory_percent: f32,
    status: String,
    cmd: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserInfo {
    username: String,
    groups: Vec<String>,
    home_dir: String,
    shell: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServiceInfo {
    name: String,
    status: String,
    enabled: bool,
    description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkStats {
    interfaces: Vec<NetworkInfo>,
    connections: usize,
    bandwidth: BandwidthInfo,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BandwidthInfo {
    download_speed: u64,
    upload_speed: u64,
    total_download: u64,
    total_upload: u64,
}

#[command]
pub fn get_system_info() -> Result<SystemInfo, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    // Give it a moment to collect CPU usage
    thread::sleep(Duration::from_millis(200));
    sys.refresh_cpu();
    
    // Get CPU info
    let cpu_usage = sys.global_cpu_info().cpu_usage() as f32;
    let cpu_cores = sys.cpus().len();
    let cpu_name = sys.cpus().first().map(|cpu| cpu.brand().to_string());
    
    // Get memory info
    let memory_total = sys.total_memory();
    let memory_used = sys.used_memory();
    let memory_percent = if memory_total > 0 {
        (memory_used as f32 / memory_total as f32) * 100.0
    } else {
        0.0
    };
    
    let swap_total = sys.total_swap();
    let swap_used = sys.used_swap();
    
    // Get disk info
    let disks = Disks::new_with_refreshed_list();
    let disk_info: Vec<DiskInfo> = disks.iter().map(|disk| {
        let total = disk.total_space();
        let available = disk.available_space();
        let used = total.saturating_sub(available);
        let usage = if total > 0 {
            (used as f32 / total as f32) * 100.0
        } else {
            0.0
        };
        
        DiskInfo {
            name: disk.name().to_string_lossy().to_string(),
            mount_point: disk.mount_point().to_string_lossy().to_string(),
            total_space: total,
            available_space: available,
            used_space: used,
            usage_percent: usage,
            file_system: String::from_utf8_lossy(disk.file_system()).to_string(),
        }
    }).collect();
    
    // Get network info
    let networks = Networks::new_with_refreshed_list();
    let network_info: Vec<NetworkInfo> = networks.iter().map(|(name, data)| {
        NetworkInfo {
            interface: name.clone(),
            received: data.received(),
            transmitted: data.transmitted(),
        }
    }).collect();
    
    // Get top processes
    sys.refresh_processes();
    let mut processes: Vec<ProcessInfo> = sys.processes().iter()
        .map(|(pid, process)| {
            let memory_percent = if memory_total > 0 {
                (process.memory() as f32 / memory_total as f32) * 100.0
            } else {
                0.0
            };
            
            ProcessInfo {
                pid: pid.as_u32(),
                name: process.name().to_string(),
                cpu_usage: process.cpu_usage(),
                memory_usage: process.memory(),
                memory_percent,
                status: format!("{:?}", process.status()),
                cmd: process.cmd().to_vec(),
            }
        })
        .collect();
    
    // Sort by CPU usage descending
    processes.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap_or(std::cmp::Ordering::Equal));
    processes.truncate(10); // Top 10 processes
    
    // Get user info
    let users = vec![
        UserInfo {
            username: whoami::username(),
            groups: whoami::groups().unwrap_or_else(|_| vec![]),
            home_dir: dirs::home_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_default(),
            shell: whoami::shell().unwrap_or_default().to_string_lossy().to_string(),
        }
    ];
    
    // Try to get CPU temperature (platform-specific)
    let temperature = get_cpu_temperature();
    
    Ok(SystemInfo {
        os: std::env::consts::OS.to_string(),
        kernel: System::kernel_version().unwrap_or_else(|| "Unknown".to_string()),
        host_name: System::host_name().unwrap_or_else(|| "Unknown".to_string()),
        cpu_usage,
        cpu_cores,
        cpu_name,
        memory_total,
        memory_used,
        memory_percent,
        swap_total,
        swap_used,
        uptime: System::uptime(),
        disks: disk_info,
        network_interfaces: network_info,
        top_processes: processes,
        users,
        temperature,
    })
}

#[cfg(target_os = "linux")]
fn get_cpu_temperature() -> Option<f32> {
    use std::fs;
    
    // Try reading from thermal zone
    for i in 0..10 {
        let path = format!("/sys/class/thermal/thermal_zone{}/temp", i);
        if let Ok(content) = fs::read_to_string(path) {
            if let Ok(temp) = content.trim().parse::<f32>() {
                return Some(temp / 1000.0); // Convert millidegrees to degrees
            }
        }
    }
    None
}

#[cfg(not(target_os = "linux"))]
fn get_cpu_temperature() -> Option<f32> {
    None
}

#[command]
pub fn control_system(action: String, delay: Option<u64>) -> Result<String, String> {
    let delay_seconds = delay.unwrap_or(0);
    
    if delay_seconds > 0 {
        let action_clone = action.clone();
        
        thread::spawn(move || {
            thread::sleep(Duration::from_secs(delay_seconds));
            execute_system_action(&action_clone);
        });
        
        Ok(format!("⏰ Will {} in {} seconds", action, delay_seconds))
    } else {
        let result = execute_system_action(&action);
        Ok(format!("✅ Executing: {} - {}", action, result))
    }
}

fn execute_system_action(action: &str) -> String {
    match action {
        "shutdown" => {
            #[cfg(target_os = "linux")]
            {
                let _ = StdCommand::new("shutdown").arg("now").spawn();
                "Shutting down...".to_string()
            }
            #[cfg(target_os = "windows")]
            {
                let _ = StdCommand::new("shutdown").args(&["/s", "/t", "0"]).spawn();
                "Shutting down...".to_string()
            }
            #[cfg(target_os = "macos")]
            {
                let _ = StdCommand::new("shutdown").args(&["-h", "now"]).spawn();
                "Shutting down...".to_string()
            }
            #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
            "Shutdown not supported".to_string()
        }
        "restart" | "reboot" => {
            #[cfg(target_os = "linux")]
            {
                let _ = StdCommand::new("shutdown").args(&["-r", "now"]).spawn();
                "Restarting...".to_string()
            }
            #[cfg(target_os = "windows")]
            {
                let _ = StdCommand::new("shutdown").args(&["/r", "/t", "0"]).spawn();
                "Restarting...".to_string()
            }
            #[cfg(target_os = "macos")]
            {
                let _ = StdCommand::new("shutdown").args(&["-r", "now"]).spawn();
                "Restarting...".to_string()
            }
            #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
            "Restart not supported".to_string()
        }
        "sleep" | "suspend" => {
            #[cfg(target_os = "linux")]
            {
                let _ = StdCommand::new("systemctl").arg("suspend").spawn();
                "Suspending...".to_string()
            }
            #[cfg(target_os = "windows")]
            {
                let _ = StdCommand::new("rundll32.exe")
                    .args(&["powrprof.dll,SetSuspendState", "0,1,0"])
                    .spawn();
                "Sleeping...".to_string()
            }
            #[cfg(target_os = "macos")]
            {
                let _ = StdCommand::new("pmset").arg("sleepnow").spawn();
                "Sleeping...".to_string()
            }
            #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
            "Sleep not supported".to_string()
        }
        "lock" => {
            #[cfg(target_os = "linux")]
            {
                let _ = StdCommand::new("gnome-screensaver-command").arg("-l").spawn()
                    .or_else(|_| StdCommand::new("loginctl").arg("lock-session").spawn());
                "Locking screen...".to_string()
            }
            #[cfg(target_os = "windows")]
            {
                let _ = StdCommand::new("rundll32.exe")
                    .args(&["user32.dll,LockWorkStation"])
                    .spawn();
                "Locking screen...".to_string()
            }
            #[cfg(target_os = "macos")]
            {
                let _ = StdCommand::new("pmset").args(&["displaysleepnow"]).spawn();
                "Locking screen...".to_string()
            }
            #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
            "Lock not supported".to_string()
        }
        "hibernate" => {
            #[cfg(target_os = "linux")]
            {
                let _ = StdCommand::new("systemctl").arg("hibernate").spawn();
                "Hibernating...".to_string()
            }
            #[cfg(target_os = "windows")]
            {
                let _ = StdCommand::new("shutdown").args(&["/h"]).spawn();
                "Hibernating...".to_string()
            }
            #[cfg(target_os = "macos")]
            {
                let _ = StdCommand::new("pmset").args(&["hibernatemode", "3"]).spawn();
                "Hibernating...".to_string()
            }
            #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
            "Hibernate not supported".to_string()
        }
        "logout" | "logoff" => {
            #[cfg(target_os = "linux")]
            {
                let _ = StdCommand::new("gnome-session-quit").args(&["--logout", "--no-prompt"]).spawn();
                "Logging out...".to_string()
            }
            #[cfg(target_os = "windows")]
            {
                let _ = StdCommand::new("shutdown").args(&["/l"]).spawn();
                "Logging out...".to_string()
            }
            #[cfg(target_os = "macos")]
            {
                let _ = StdCommand::new("osascript")
                    .arg("-e")
                    .arg("tell app \"System Events\" to log out")
                    .spawn();
                "Logging out...".to_string()
            }
            #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
            "Logout not supported".to_string()
        }
        "cancel_shutdown" => {
            #[cfg(target_os = "linux")]
            {
                let _ = StdCommand::new("shutdown").arg("-c").spawn();
                "Cancelled scheduled shutdown".to_string()
            }
            #[cfg(target_os = "windows")]
            {
                let _ = StdCommand::new("shutdown").args(&["/a"]).spawn();
                "Cancelled scheduled shutdown".to_string()
            }
            #[cfg(target_os = "macos")]
            {
                let _ = StdCommand::new("sudo").args(&["killall", "shutdown"]).spawn();
                "Cancelled scheduled shutdown".to_string()
            }
            #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
            "Cancel not supported".to_string()
        }
        _ => format!("Unknown action: {}", action),
    }
}

#[command]
pub fn kill_process(pid: u32) -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        // Try SIGTERM first, then SIGKILL if needed
        let output = StdCommand::new("kill")
            .arg(pid.to_string())
            .output()
            .map_err(|e| format!("Failed to execute kill command: {}", e))?;
        
        if output.status.success() {
            return Ok(format!("✅ Process {} terminated (SIGTERM)", pid));
        } else {
            // Try force kill
            let output = StdCommand::new("kill")
                .args(&["-9", &pid.to_string()])
                .output()
                .map_err(|e| format!("Failed to execute kill command: {}", e))?;
            
            if output.status.success() {
                return Ok(format!("✅ Process {} force killed (SIGKILL)", pid));
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                Err(format!("Failed to kill process {}: {}", pid, error))
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        let output = StdCommand::new("taskkill")
            .args(&["/F", "/PID", &pid.to_string()])
            .output()
            .map_err(|e| format!("Failed to execute taskkill: {}", e))?;
        
        if output.status.success() {
            Ok(format!("✅ Process {} terminated", pid))
        } else {
            let error = String::from_utf8_lossy(&output.stderr);
            Err(format!("Failed to kill process {}: {}", pid, error))
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let output = StdCommand::new("kill")
            .arg(pid.to_string())
            .output()
            .map_err(|e| format!("Failed to execute kill command: {}", e))?;
        
        if output.status.success() {
            Ok(format!("✅ Process {} terminated", pid))
        } else {
            let error = String::from_utf8_lossy(&output.stderr);
            Err(format!("Failed to kill process {}: {}", pid, error))
        }
    }
    
    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    {
        Err("Process killing not supported on this platform".to_string())
    }
}

#[command]
pub fn get_system_services() -> Result<Vec<ServiceInfo>, String> {
    let mut services = Vec::new();
    
    #[cfg(target_os = "linux")]
    {
        // Check systemd services
        if let Ok(output) = StdCommand::new("systemctl").args(&["list-units", "--type=service", "--all", "--no-legend"]).output() {
            let output_str = String::from_utf8_lossy(&output.stdout);
            for line in output_str.lines().take(20) {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 4 {
                    services.push(ServiceInfo {
                        name: parts[0].to_string(),
                        status: parts[3].to_string(),
                        enabled: false, // Would need additional parsing
                        description: parts.iter().skip(4).cloned().collect::<Vec<&str>>().join(" "),
                    });
                }
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = StdCommand::new("sc").args(&["query", "state=", "all"]).output() {
            let output_str = String::from_utf8_lossy(&output.stdout);
            // Parse Windows services (simplified)
            for line in output_str.lines().take(20) {
                if line.contains("SERVICE_NAME") {
                    let name = line.replace("SERVICE_NAME: ", "").trim().to_string();
                    services.push(ServiceInfo {
                        name,
                        status: "Unknown".to_string(),
                        enabled: false,
                        description: String::new(),
                    });
                }
            }
        }
    }
    
    Ok(services)
}

#[command]
pub fn control_service(service_name: String, action: String) -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        let result = match action.as_str() {
            "start" => StdCommand::new("systemctl").args(&["start", &service_name]).output(),
            "stop" => StdCommand::new("systemctl").args(&["stop", &service_name]).output(),
            "restart" => StdCommand::new("systemctl").args(&["restart", &service_name]).output(),
            "enable" => StdCommand::new("systemctl").args(&["enable", &service_name]).output(),
            "disable" => StdCommand::new("systemctl").args(&["disable", &service_name]).output(),
            "status" => StdCommand::new("systemctl").args(&["status", &service_name]).output(),
            _ => return Err(format!("Unknown action: {}", action)),
        };
        
        match result {
            Ok(output) if output.status.success() => {
                Ok(format!("✅ {} {}ed successfully", service_name, action))
            }
            Ok(output) => {
                let error = String::from_utf8_lossy(&output.stderr);
                Err(format!("Failed to {} {}: {}", action, service_name, error))
            }
            Err(e) => Err(format!("Failed to execute command: {}", e)),
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        let result = match action.as_str() {
            "start" => StdCommand::new("net").args(&["start", &service_name]).output(),
            "stop" => StdCommand::new("net").args(&["stop", &service_name]).output(),
            "restart" => StdCommand::new("net").args(&["stop", &service_name]).and_then(|_| {
                StdCommand::new("net").args(&["start", &service_name]).output()
            }),
            _ => return Err(format!("Action {} not supported on Windows", action)),
        };
        
        match result {
            Ok(output) if output.status.success() => {
                Ok(format!("✅ {} {}ed successfully", service_name, action))
            }
            Ok(output) => {
                let error = String::from_utf8_lossy(&output.stderr);
                Err(format!("Failed to {} {}: {}", action, service_name, error))
            }
            Err(e) => Err(format!("Failed to execute command: {}", e)),
        }
    }
    
    #[cfg(not(any(target_os = "linux", target_os = "windows")))]
    {
        Err("Service control not supported on this platform".to_string())
    }
}

#[command]
pub fn get_network_stats() -> Result<NetworkStats, String> {
    let mut sys = System::new_all();
    sys.refresh_networks();
    
    let networks = Networks::new_with_refreshed_list();
    let interfaces: Vec<NetworkInfo> = networks.iter().map(|(name, data)| {
        NetworkInfo {
            interface: name.clone(),
            received: data.received(),
            transmitted: data.transmitted(),
        }
    }).collect();
    
    // Count network connections (simplified)
    let connections = 0; // Would need more complex parsing
    
    // Get bandwidth info
    let bandwidth = BandwidthInfo {
        download_speed: 0, // Would need to measure over time
        upload_speed: 0,
        total_download: interfaces.iter().map(|i| i.received).sum(),
        total_upload: interfaces.iter().map(|i| i.transmitted).sum(),
    };
    
    Ok(NetworkStats {
        interfaces,
        connections,
        bandwidth,
    })
}

#[command]
pub fn get_user_info() -> Result<Vec<UserInfo>, String> {
    let mut users = Vec::new();
    
    users.push(UserInfo {
        username: whoami::username(),
        groups: whoami::groups().unwrap_or_else(|_| vec![]),
        home_dir: dirs::home_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_default(),
        shell: whoami::shell().unwrap_or_default().to_string_lossy().to_string(),
    });
    
    Ok(users)
}

#[command]
pub fn get_system_logs(limit: Option<usize>) -> Result<Vec<String>, String> {
    let limit = limit.unwrap_or(50);
    let mut logs = Vec::new();
    
    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = StdCommand::new("journalctl")
            .args(&["-n", &limit.to_string(), "--no-pager"])
            .output() {
            let output_str = String::from_utf8_lossy(&output.stdout);
            for line in output_str.lines().take(limit) {
                logs.push(line.to_string());
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = StdCommand::new("wevtutil")
            .args(&["qe", "System", "/c:", &limit.to_string(), "/f:text"])
            .output() {
            let output_str = String::from_utf8_lossy(&output.stdout);
            for line in output_str.lines().take(limit) {
                logs.push(line.to_string());
            }
        }
    }
    
    Ok(logs)
}

#[command]
pub fn get_disk_usage(path: Option<String>) -> Result<Vec<DiskInfo>, String> {
    let disks = Disks::new_with_refreshed_list();
    let disk_info: Vec<DiskInfo> = disks.iter().map(|disk| {
        let total = disk.total_space();
        let available = disk.available_space();
        let used = total.saturating_sub(available);
        let usage = if total > 0 {
            (used as f32 / total as f32) * 100.0
        } else {
            0.0
        };
        
        DiskInfo {
            name: disk.name().to_string_lossy().to_string(),
            mount_point: disk.mount_point().to_string_lossy().to_string(),
            total_space: total,
            available_space: available,
            used_space: used,
            usage_percent: usage,
            file_system: String::from_utf8_lossy(disk.file_system()).to_string(),
        }
    }).collect();
    
    Ok(disk_info)
}