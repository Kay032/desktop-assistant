use tauri::command;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use chrono::{DateTime, Local};  // Removed TimeZone

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileInfo {
    name: String,
    path: String,
    size: u64,
    modified: String,
    is_directory: bool,
    extension: Option<String>,
}

#[command]
pub fn search_files(query: String, path: Option<String>) -> Result<Vec<FileInfo>, String> {
    // Default to home directory if no path provided
    let search_path = match path {
        Some(p) => p,
        None => {
            if let Some(home) = dirs::home_dir() {
                home.to_string_lossy().to_string()
            } else {
                "/".to_string() // Fallback to root
            }
        }
    };

    println!("Searching for '{}' in {}", query, search_path);
    
    let mut results = Vec::new();
    let query_lower = query.to_lowercase();

    // Walk through directories (limited depth for performance)
    for entry in WalkDir::new(&search_path)
        .max_depth(3) // Limit depth to avoid searching entire system
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| !is_hidden(e.path()))
        .filter_map(|e| e.ok())
    {
        let file_name = entry.file_name().to_string_lossy().to_lowercase();
        
        if file_name.contains(&query_lower) {
            if let Ok(metadata) = entry.metadata() {
                // Convert modified time to readable format
                let modified_str = if let Ok(modified) = metadata.modified() {
                    let datetime: DateTime<Local> = DateTime::from(modified);
                    datetime.format("%Y-%m-%d %H:%M:%S").to_string()
                } else {
                    "Unknown".to_string()
                };

                results.push(FileInfo {
                    name: entry.file_name().to_string_lossy().to_string(),
                    path: entry.path().to_string_lossy().to_string(),
                    size: metadata.len(),
                    modified: modified_str,
                    is_directory: metadata.is_dir(),
                    extension: entry.path().extension()
                        .map(|ext| ext.to_string_lossy().to_string()),
                });
            }
        }

        // Limit results to prevent overwhelming the UI
        if results.len() >= 50 {
            break;
        }
    }

    println!("Found {} results", results.len());
    Ok(results)
}

#[command]
pub fn get_file_info(path: String) -> Result<FileInfo, String> {
    let path = PathBuf::from(&path);
    
    if !path.exists() {
        return Err("File not found".to_string());
    }

    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    
    let modified_str = if let Ok(modified) = metadata.modified() {
        let datetime: DateTime<Local> = DateTime::from(modified);
        datetime.format("%Y-%m-%d %H:%M:%S").to_string()
    } else {
        "Unknown".to_string()
    };

    Ok(FileInfo {
        name: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
        path: path.to_string_lossy().to_string(),
        size: metadata.len(),
        modified: modified_str,
        is_directory: metadata.is_dir(),
        extension: path.extension().map(|ext| ext.to_string_lossy().to_string()),
    })
}

#[command]
pub fn open_file_location(path: String) -> Result<String, String> {
    let path = PathBuf::from(&path);
    
    if !path.exists() {
        return Err("Path not found".to_string());
    }

    let parent = match path.parent() {
        Some(p) => p,
        None => path.as_path(),
    };

    #[cfg(target_os = "linux")]
    {
        // Try multiple file managers for compatibility
        let file_managers = ["xdg-open", "nautilus", "dolphin", "thunar", "pcmanfm", "caja"];
        
        for fm in file_managers.iter() {
            if let Ok(_) = std::process::Command::new(fm).arg(parent).spawn() {
                return Ok(format!("Opened folder containing {}", path.file_name().unwrap_or_default().to_string_lossy()));
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(_) = std::process::Command::new("explorer").arg("/select,").arg(&path).spawn() {
            return Ok("Opened file location".to_string());
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(_) = std::process::Command::new("open").arg("-R").arg(&path).spawn() {
            return Ok("Opened file location".to_string());
        }
    }

    Err("Could not open file location".to_string())
}

fn is_hidden(path: &Path) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .map(|name| name.starts_with('.'))
        .unwrap_or(false)
}