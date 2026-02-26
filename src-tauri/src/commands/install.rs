use tauri::command;
use serde::{Deserialize, Serialize};
use std::process::Command as StdCommand;
use std::collections::HashMap;
use which::which;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PackageInfo {
    name: String,
    version: Option<String>,
    description: Option<String>,
    size: Option<String>,
    installed: bool,
    repository: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InstallResult {
    success: bool,
    message: String,
    command: String,
    output: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PackageManager {
    name: String,
    available: bool,
    command: String,
    os: Vec<String>,
}

#[command]
pub fn detect_package_managers() -> Result<Vec<PackageManager>, String> {
    let mut managers = Vec::new();
    
    // Linux package managers
    #[cfg(target_os = "linux")]
    {
        // APT (Debian/Ubuntu)
        managers.push(PackageManager {
            name: "apt".to_string(),
            available: which("apt").is_ok(),
            command: "apt".to_string(),
            os: vec!["Debian".to_string(), "Ubuntu".to_string()],
        });
        
        // Snap
        managers.push(PackageManager {
            name: "snap".to_string(),
            available: which("snap").is_ok(),
            command: "snap".to_string(),
            os: vec!["Ubuntu".to_string(), "All Linux".to_string()],
        });
        
        // Flatpak
        managers.push(PackageManager {
            name: "flatpak".to_string(),
            available: which("flatpak").is_ok(),
            command: "flatpak".to_string(),
            os: vec!["All Linux".to_string()],
        });
        
        // Pacman (Arch)
        managers.push(PackageManager {
            name: "pacman".to_string(),
            available: which("pacman").is_ok(),
            command: "pacman".to_string(),
            os: vec!["Arch".to_string(), "Manjaro".to_string()],
        });
        
        // Yum/DNF (RHEL/Fedora)
        if which("dnf").is_ok() {
            managers.push(PackageManager {
                name: "dnf".to_string(),
                available: true,
                command: "dnf".to_string(),
                os: vec!["Fedora".to_string(), "RHEL".to_string()],
            });
        } else if which("yum").is_ok() {
            managers.push(PackageManager {
                name: "yum".to_string(),
                available: true,
                command: "yum".to_string(),
                os: vec!["RHEL".to_string(), "CentOS".to_string()],
            });
        }
        
        // AppImage
        managers.push(PackageManager {
            name: "appimage".to_string(),
            available: true, // AppImages don't need a package manager
            command: "".to_string(),
            os: vec!["All Linux".to_string()],
        });
    }
    
    // macOS package managers
    #[cfg(target_os = "macos")]
    {
        // Homebrew
        managers.push(PackageManager {
            name: "brew".to_string(),
            available: which("brew").is_ok(),
            command: "brew".to_string(),
            os: vec!["macOS".to_string()],
        });
        
        // MacPorts
        managers.push(PackageManager {
            name: "port".to_string(),
            available: which("port").is_ok(),
            command: "port".to_string(),
            os: vec!["macOS".to_string()],
        });
        
        // App Store (via mas)
        managers.push(PackageManager {
            name: "mas".to_string(),
            available: which("mas").is_ok(),
            command: "mas".to_string(),
            os: vec!["macOS".to_string()],
        });
    }
    
    // Windows package managers
    #[cfg(target_os = "windows")]
    {
        // Chocolatey
        managers.push(PackageManager {
            name: "choco".to_string(),
            available: which("choco").is_ok(),
            command: "choco".to_string(),
            os: vec!["Windows".to_string()],
        });
        
        // Winget
        managers.push(PackageManager {
            name: "winget".to_string(),
            available: which("winget").is_ok(),
            command: "winget".to_string(),
            os: vec!["Windows 10/11".to_string()],
        });
        
        // Scoop
        managers.push(PackageManager {
            name: "scoop".to_string(),
            available: which("scoop").is_ok(),
            command: "scoop".to_string(),
            os: vec!["Windows".to_string()],
        });
        
        // MSI/EXE (direct installers)
        managers.push(PackageManager {
            name: "installer".to_string(),
            available: true,
            command: "".to_string(),
            os: vec!["Windows".to_string()],
        });
    }
    
    // Universal package managers
    managers.push(PackageManager {
        name: "pip".to_string(),
        available: which("pip").is_ok() || which("pip3").is_ok(),
        command: "pip".to_string(),
        os: vec!["All".to_string()],
    });
    
    managers.push(PackageManager {
        name: "npm".to_string(),
        available: which("npm").is_ok(),
        command: "npm".to_string(),
        os: vec!["All".to_string()],
    });
    
    managers.push(PackageManager {
        name: "cargo".to_string(),
        available: which("cargo").is_ok(),
        command: "cargo".to_string(),
        os: vec!["All".to_string()],
    });
    
    managers.push(PackageManager {
        name: "gem".to_string(),
        available: which("gem").is_ok(),
        command: "gem".to_string(),
        os: vec!["All".to_string()],
    });
    
    Ok(managers)
}

#[command]
pub fn install_package(manager: String, package: String) -> Result<InstallResult, String> {
    let (command, args) = get_install_command(&manager, &package)?;
    
    let output = StdCommand::new(&command)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute {}: {}", manager, e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let full_output = format!("{}\n{}", stdout, stderr);
    
    Ok(InstallResult {
        success: output.status.success(),
        message: if output.status.success() {
            format!("✅ Successfully installed {} using {}", package, manager)
        } else {
            format!("❌ Failed to install {}: {}", package, stderr)
        },
        command: format!("{} {}", command, args.join(" ")),
        output: full_output,
    })
}

#[command]
pub fn uninstall_package(manager: String, package: String) -> Result<InstallResult, String> {
    let (command, args) = get_uninstall_command(&manager, &package)?;
    
    let output = StdCommand::new(&command)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute {}: {}", manager, e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    
    Ok(InstallResult {
        success: output.status.success(),
        message: if output.status.success() {
            format!("✅ Successfully uninstalled {} using {}", package, manager)
        } else {
            format!("❌ Failed to uninstall {}: {}", package, stderr)
        },
        command: format!("{} {}", command, args.join(" ")),
        output: stdout + &stderr,
    })
}

#[command]
pub fn search_packages(manager: String, query: String) -> Result<Vec<PackageInfo>, String> {
    let (command, args) = get_search_command(&manager, &query)?;
    
    let output = StdCommand::new(&command)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute {}: {}", manager, e))?;
    
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_package_list(&manager, &stdout)
}

#[command]
pub fn list_installed_packages(manager: String) -> Result<Vec<PackageInfo>, String> {
    let (command, args) = get_list_command(&manager)?;
    
    let output = StdCommand::new(&command)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute {}: {}", manager, e))?;
    
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_installed_packages(&manager, &stdout)
}

#[command]
pub fn update_packages(manager: String) -> Result<InstallResult, String> {
    let (command, args) = get_update_command(&manager)?;
    
    let output = StdCommand::new(&command)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute {}: {}", manager, e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    
    Ok(InstallResult {
        success: output.status.success(),
        message: if output.status.success() {
            format!("✅ Successfully updated package lists using {}", manager)
        } else {
            format!("❌ Failed to update: {}", stderr)
        },
        command: format!("{} {}", command, args.join(" ")),
        output: stdout + &stderr,
    })
}

#[command]
pub fn upgrade_all(manager: String) -> Result<InstallResult, String> {
    let (command, args) = get_upgrade_command(&manager)?;
    
    let output = StdCommand::new(&command)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute {}: {}", manager, e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    
    Ok(InstallResult {
        success: output.status.success(),
        message: if output.status.success() {
            format!("✅ Successfully upgraded packages using {}", manager)
        } else {
            format!("❌ Failed to upgrade: {}", stderr)
        },
        command: format!("{} {}", command, args.join(" ")),
        output: stdout + &stderr,
    })
}

#[command]
pub fn get_package_info(manager: String, package: String) -> Result<PackageInfo, String> {
    let (command, args) = get_info_command(&manager, &package)?;
    
    let output = StdCommand::new(&command)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute {}: {}", manager, e))?;
    
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_package_info(&manager, &package, &stdout)
}

// Helper functions for command construction
fn get_install_command(manager: &str, package: &str) -> Result<(String, Vec<String>), String> {
    match manager {
        "apt" => Ok(("sudo".to_string(), vec!["apt".to_string(), "install".to_string(), "-y".to_string(), package.to_string()])),
        "snap" => Ok(("sudo".to_string(), vec!["snap".to_string(), "install".to_string(), package.to_string()])),
        "flatpak" => Ok(("flatpak".to_string(), vec!["install".to_string(), "-y".to_string(), package.to_string()])),
        "pacman" => Ok(("sudo".to_string(), vec!["pacman".to_string(), "-S".to_string(), "--noconfirm".to_string(), package.to_string()])),
        "dnf" => Ok(("sudo".to_string(), vec!["dnf".to_string(), "install".to_string(), "-y".to_string(), package.to_string()])),
        "yum" => Ok(("sudo".to_string(), vec!["yum".to_string(), "install".to_string(), "-y".to_string(), package.to_string()])),
        "brew" => Ok(("brew".to_string(), vec!["install".to_string(), package.to_string()])),
        "port" => Ok(("sudo".to_string(), vec!["port".to_string(), "install".to_string(), package.to_string()])),
        "mas" => Ok(("mas".to_string(), vec!["install".to_string(), package.to_string()])),
        "choco" => Ok(("choco".to_string(), vec!["install".to_string(), "-y".to_string(), package.to_string()])),
        "winget" => Ok(("winget".to_string(), vec!["install".to_string(), "--id".to_string(), package.to_string(), "--accept-package-agreements".to_string()])),
        "scoop" => Ok(("scoop".to_string(), vec!["install".to_string(), package.to_string()])),
        "pip" => Ok(("pip".to_string(), vec!["install".to_string(), package.to_string()])),
        "pip3" => Ok(("pip3".to_string(), vec!["install".to_string(), package.to_string()])),
        "npm" => Ok(("npm".to_string(), vec!["install".to_string(), "-g".to_string(), package.to_string()])),
        "cargo" => Ok(("cargo".to_string(), vec!["install".to_string(), package.to_string()])),
        "gem" => Ok(("gem".to_string(), vec!["install".to_string(), package.to_string()])),
        "go" => Ok(("go".to_string(), vec!["get".to_string(), "-u".to_string(), package.to_string()])),
        _ => Err(format!("Unknown package manager: {}", manager)),
    }
}

fn get_uninstall_command(manager: &str, package: &str) -> Result<(String, Vec<String>), String> {
    match manager {
        "apt" => Ok(("sudo".to_string(), vec!["apt".to_string(), "remove".to_string(), "-y".to_string(), package.to_string()])),
        "snap" => Ok(("sudo".to_string(), vec!["snap".to_string(), "remove".to_string(), package.to_string()])),
        "flatpak" => Ok(("flatpak".to_string(), vec!["uninstall".to_string(), "-y".to_string(), package.to_string()])),
        "pacman" => Ok(("sudo".to_string(), vec!["pacman".to_string(), "-R".to_string(), "--noconfirm".to_string(), package.to_string()])),
        "dnf" => Ok(("sudo".to_string(), vec!["dnf".to_string(), "remove".to_string(), "-y".to_string(), package.to_string()])),
        "yum" => Ok(("sudo".to_string(), vec!["yum".to_string(), "remove".to_string(), "-y".to_string(), package.to_string()])),
        "brew" => Ok(("brew".to_string(), vec!["uninstall".to_string(), package.to_string()])),
        "port" => Ok(("sudo".to_string(), vec!["port".to_string(), "uninstall".to_string(), package.to_string()])),
        "mas" => Ok(("mas".to_string(), vec!["uninstall".to_string(), package.to_string()])),
        "choco" => Ok(("choco".to_string(), vec!["uninstall".to_string(), "-y".to_string(), package.to_string()])),
        "winget" => Ok(("winget".to_string(), vec!["uninstall".to_string(), "--id".to_string(), package.to_string()])),
        "scoop" => Ok(("scoop".to_string(), vec!["uninstall".to_string(), package.to_string()])),
        "pip" => Ok(("pip".to_string(), vec!["uninstall".to_string(), "-y".to_string(), package.to_string()])),
        "npm" => Ok(("npm".to_string(), vec!["uninstall".to_string(), "-g".to_string(), package.to_string()])),
        "cargo" => Ok(("cargo".to_string(), vec!["uninstall".to_string(), package.to_string()])),
        "gem" => Ok(("gem".to_string(), vec!["uninstall".to_string(), package.to_string()])),
        _ => Err(format!("Unknown package manager: {}", manager)),
    }
}

fn get_search_command(manager: &str, query: &str) -> Result<(String, Vec<String>), String> {
    match manager {
        "apt" => Ok(("apt".to_string(), vec!["search".to_string(), query.to_string()])),
        "snap" => Ok(("snap".to_string(), vec!["find".to_string(), query.to_string()])),
        "flatpak" => Ok(("flatpak".to_string(), vec!["search".to_string(), query.to_string()])),
        "pacman" => Ok(("pacman".to_string(), vec!["-Ss".to_string(), query.to_string()])),
        "dnf" => Ok(("dnf".to_string(), vec!["search".to_string(), query.to_string()])),
        "yum" => Ok(("yum".to_string(), vec!["search".to_string(), query.to_string()])),
        "brew" => Ok(("brew".to_string(), vec!["search".to_string(), query.to_string()])),
        "port" => Ok(("port".to_string(), vec!["search".to_string(), query.to_string()])),
        "mas" => Ok(("mas".to_string(), vec!["search".to_string(), query.to_string()])),
        "choco" => Ok(("choco".to_string(), vec!["search".to_string(), query.to_string()])),
        "winget" => Ok(("winget".to_string(), vec!["search".to_string(), query.to_string()])),
        "scoop" => Ok(("scoop".to_string(), vec!["search".to_string(), query.to_string()])),
        "pip" => Ok(("pip".to_string(), vec!["search".to_string(), query.to_string()])),
        "npm" => Ok(("npm".to_string(), vec!["search".to_string(), query.to_string()])),
        "cargo" => Ok(("cargo".to_string(), vec!["search".to_string(), query.to_string()])),
        _ => Err(format!("Unknown package manager: {}", manager)),
    }
}

fn get_list_command(manager: &str) -> Result<(String, Vec<String>), String> {
    match manager {
        "apt" => Ok(("apt".to_string(), vec!["list".to_string(), "--installed".to_string()])),
        "snap" => Ok(("snap".to_string(), vec!["list".to_string()])),
        "flatpak" => Ok(("flatpak".to_string(), vec!["list".to_string()])),
        "pacman" => Ok(("pacman".to_string(), vec!["-Q".to_string()])),
        "dnf" => Ok(("dnf".to_string(), vec!["list".to_string(), "installed".to_string()])),
        "yum" => Ok(("yum".to_string(), vec!["list".to_string(), "installed".to_string()])),
        "brew" => Ok(("brew".to_string(), vec!["list".to_string()])),
        "port" => Ok(("port".to_string(), vec!["installed".to_string()])),
        "mas" => Ok(("mas".to_string(), vec!["list".to_string()])),
        "choco" => Ok(("choco".to_string(), vec!["list".to_string(), "--local-only".to_string()])),
        "winget" => Ok(("winget".to_string(), vec!["list".to_string()])),
        "scoop" => Ok(("scoop".to_string(), vec!["list".to_string()])),
        "pip" => Ok(("pip".to_string(), vec!["list".to_string()])),
        "npm" => Ok(("npm".to_string(), vec!["list".to_string(), "-g".to_string(), "--depth=0".to_string()])),
        "cargo" => Ok(("cargo".to_string(), vec!["install".to_string(), "--list".to_string()])),
        _ => Err(format!("Unknown package manager: {}", manager)),
    }
}

fn get_update_command(manager: &str) -> Result<(String, Vec<String>), String> {
    match manager {
        "apt" => Ok(("sudo".to_string(), vec!["apt".to_string(), "update".to_string()])),
        "snap" => Ok(("sudo".to_string(), vec!["snap".to_string(), "refresh".to_string()])),
        "flatpak" => Ok(("flatpak".to_string(), vec!["update".to_string(), "-y".to_string()])),
        "pacman" => Ok(("sudo".to_string(), vec!["pacman".to_string(), "-Sy".to_string()])),
        "dnf" => Ok(("sudo".to_string(), vec!["dnf".to_string(), "check-update".to_string()])),
        "yum" => Ok(("sudo".to_string(), vec!["yum".to_string(), "check-update".to_string()])),
        "brew" => Ok(("brew".to_string(), vec!["update".to_string()])),
        "port" => Ok(("sudo".to_string(), vec!["port".to_string(), "sync".to_string()])),
        "choco" => Ok(("choco".to_string(), vec!["upgrade".to_string(), "all".to_string(), "-y".to_string()])),
        "winget" => Ok(("winget".to_string(), vec!["upgrade".to_string()])),
        "scoop" => Ok(("scoop".to_string(), vec!["update".to_string()])),
        "pip" => Ok(("pip".to_string(), vec!["list".to_string(), "--outdated".to_string()])),
        "npm" => Ok(("npm".to_string(), vec!["outdated".to_string(), "-g".to_string()])),
        _ => Err(format!("Unknown package manager: {}", manager)),
    }
}

fn get_upgrade_command(manager: &str) -> Result<(String, Vec<String>), String> {
    match manager {
        "apt" => Ok(("sudo".to_string(), vec!["apt".to_string(), "upgrade".to_string(), "-y".to_string()])),
        "snap" => Ok(("sudo".to_string(), vec!["snap".to_string(), "refresh".to_string()])),
        "flatpak" => Ok(("flatpak".to_string(), vec!["update".to_string(), "-y".to_string()])),
        "pacman" => Ok(("sudo".to_string(), vec!["pacman".to_string(), "-Su".to_string(), "--noconfirm".to_string()])),
        "dnf" => Ok(("sudo".to_string(), vec!["dnf".to_string(), "upgrade".to_string(), "-y".to_string()])),
        "yum" => Ok(("sudo".to_string(), vec!["yum".to_string(), "update".to_string(), "-y".to_string()])),
        "brew" => Ok(("brew".to_string(), vec!["upgrade".to_string()])),
        "port" => Ok(("sudo".to_string(), vec!["port".to_string(), "upgrade".to_string(), "outdated".to_string()])),
        "choco" => Ok(("choco".to_string(), vec!["upgrade".to_string(), "all".to_string(), "-y".to_string()])),
        "winget" => Ok(("winget".to_string(), vec!["upgrade".to_string(), "--all".to_string()])),
        "scoop" => Ok(("scoop".to_string(), vec!["update".to_string(), "*".to_string()])),
        "pip" => Ok(("pip".to_string(), vec!["install".to_string(), "--upgrade".to_string(), "pip".to_string()])), // Example
        "npm" => Ok(("npm".to_string(), vec!["update".to_string(), "-g".to_string()])),
        _ => Err(format!("Unknown package manager: {}", manager)),
    }
}

fn get_info_command(manager: &str, package: &str) -> Result<(String, Vec<String>), String> {
    match manager {
        "apt" => Ok(("apt".to_string(), vec!["show".to_string(), package.to_string()])),
        "snap" => Ok(("snap".to_string(), vec!["info".to_string(), package.to_string()])),
        "flatpak" => Ok(("flatpak".to_string(), vec!["info".to_string(), package.to_string()])),
        "pacman" => Ok(("pacman".to_string(), vec!["-Qi".to_string(), package.to_string()])),
        "dnf" => Ok(("dnf".to_string(), vec!["info".to_string(), package.to_string()])),
        "yum" => Ok(("yum".to_string(), vec!["info".to_string(), package.to_string()])),
        "brew" => Ok(("brew".to_string(), vec!["info".to_string(), package.to_string()])),
        "port" => Ok(("port".to_string(), vec!["info".to_string(), package.to_string()])),
        "choco" => Ok(("choco".to_string(), vec!["info".to_string(), package.to_string()])),
        "winget" => Ok(("winget".to_string(), vec!["show".to_string(), package.to_string()])),
        "pip" => Ok(("pip".to_string(), vec!["show".to_string(), package.to_string()])),
        "npm" => Ok(("npm".to_string(), vec!["info".to_string(), package.to_string()])),
        "cargo" => Ok(("cargo".to_string(), vec!["info".to_string(), package.to_string()])),
        _ => Err(format!("Unknown package manager: {}", manager)),
    }
}

// Parsing functions (simplified - would need more robust parsing for production)
fn parse_package_list(manager: &str, output: &str) -> Result<Vec<PackageInfo>, String> {
    let mut packages = Vec::new();
    
    for line in output.lines().take(50) {
        let line = line.trim();
        if line.is_empty() || line.starts_with("Listing") || line.starts_with("---") {
            continue;
        }
        
        // Very simplified parsing - would need proper parsing for each manager
        packages.push(PackageInfo {
            name: line.split_whitespace().next().unwrap_or("").to_string(),
            version: None,
            description: Some(line.to_string()),
            size: None,
            installed: false,
            repository: manager.to_string(),
        });
    }
    
    Ok(packages)
}

fn parse_installed_packages(manager: &str, output: &str) -> Result<Vec<PackageInfo>, String> {
    let mut packages = Vec::new();
    
    for line in output.lines().take(100) {
        let line = line.trim();
        if line.is_empty() || line.starts_with("Listing") || line.starts_with("---") {
            continue;
        }
        
        // Very simplified parsing
        packages.push(PackageInfo {
            name: line.split_whitespace().next().unwrap_or("").to_string(),
            version: line.split_whitespace().nth(1).map(|s| s.to_string()),
            description: None,
            size: None,
            installed: true,
            repository: manager.to_string(),
        });
    }
    
    Ok(packages)
}

fn parse_package_info(manager: &str, package: &str, output: &str) -> Result<PackageInfo, String> {
    Ok(PackageInfo {
        name: package.to_string(),
        version: extract_field(output, "Version:"),
        description: extract_field(output, "Description:"),
        size: extract_field(output, "Size:"),
        installed: true,
        repository: manager.to_string(),
    })
}

fn extract_field(output: &str, field: &str) -> Option<String> {
    for line in output.lines() {
        if line.starts_with(field) {
            return Some(line.replace(field, "").trim().to_string());
        }
    }
    None
}