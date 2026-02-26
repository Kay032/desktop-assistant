use tauri::command;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use chrono::{DateTime, Local};
use std::io::{self, Read, Write};
use flate2::write::GzEncoder;
use flate2::Compression;
use tar::{Builder, Archive};
use sha2::{Sha256, Digest};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileInfo {
    name: String,
    path: String,
    size: u64,
    modified: String,
    created: String,
    is_directory: bool,
    extension: Option<String>,
    permissions: String,
    hidden: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileOperation {
    success: bool,
    message: String,
    path: Option<String>,
}

#[command]
pub fn search_files(query: String, path: Option<String>, deep: Option<bool>) -> Result<Vec<FileInfo>, String> {
    // Default to home directory if no path provided
    let search_path = match path {
        Some(p) => shellexpand::tilde(&p).to_string(),
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
    let max_depth = if deep.unwrap_or(false) { 10 } else { 3 };

    // Walk through directories with configurable depth
    for entry in WalkDir::new(&search_path)
        .max_depth(max_depth)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| !is_hidden(e.path()))
        .filter_map(|e| e.ok())
    {
        let file_name = entry.file_name().to_string_lossy().to_lowercase();
        
        if query.is_empty() || file_name.contains(&query_lower) {
            if let Ok(info) = get_file_info_internal(entry.path()) {
                results.push(info);
            }
        }

        // Limit results to prevent overwhelming the UI
        if results.len() >= 100 {
            break;
        }
    }

    println!("Found {} results", results.len());
    Ok(results)
}

#[command]
pub fn get_file_info(path: String) -> Result<FileInfo, String> {
    let expanded_path = shellexpand::tilde(&path).to_string();
    let path = PathBuf::from(&expanded_path);
    
    if !path.exists() {
        return Err("File not found".to_string());
    }

    get_file_info_internal(&path)
}

fn get_file_info_internal(path: &Path) -> Result<FileInfo, String> {
    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    
    let modified_str = if let Ok(modified) = metadata.modified() {
        let datetime: DateTime<Local> = DateTime::from(modified);
        datetime.format("%Y-%m-%d %H:%M:%S").to_string()
    } else {
        "Unknown".to_string()
    };

    let created_str = if let Ok(created) = metadata.created() {
        let datetime: DateTime<Local> = DateTime::from(created);
        datetime.format("%Y-%m-%d %H:%M:%S").to_string()
    } else {
        modified_str.clone()
    };

    let permissions = format_permissions(metadata.permissions());
    let hidden = is_hidden(path);

    Ok(FileInfo {
        name: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
        path: path.to_string_lossy().to_string(),
        size: metadata.len(),
        modified: modified_str,
        created: created_str,
        is_directory: metadata.is_dir(),
        extension: path.extension().map(|ext| ext.to_string_lossy().to_string()),
        permissions,
        hidden,
    })
}

#[command]
pub fn open_file_location(path: String) -> Result<String, String> {
    let expanded_path = shellexpand::tilde(&path).to_string();
    let path = PathBuf::from(&expanded_path);
    
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
                return Ok(format!("✅ Opened folder containing {}", path.file_name().unwrap_or_default().to_string_lossy()));
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(_) = std::process::Command::new("explorer").arg("/select,").arg(&path).spawn() {
            return Ok("✅ Opened file location".to_string());
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(_) = std::process::Command::new("open").arg("-R").arg(&path).spawn() {
            return Ok("✅ Opened file location".to_string());
        }
    }

    Err("❌ Could not open file location".to_string())
}

#[command]
pub fn create_file(path: String, content: Option<String>) -> Result<FileOperation, String> {
    let expanded_path = shellexpand::tilde(&path).to_string();
    let file_path = Path::new(&expanded_path);
    
    if file_path.exists() {
        return Ok(FileOperation {
            success: false,
            message: format!("File already exists: {}", path),
            path: None,
        });
    }

    // Create parent directories if they don't exist
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    let content = content.unwrap_or_else(|| String::new());
    fs::write(file_path, content).map_err(|e| e.to_string())?;

    Ok(FileOperation {
        success: true,
        message: format!("✅ Created file: {}", path),
        path: Some(file_path.to_string_lossy().to_string()),
    })
}

#[command]
pub fn create_folder(path: String) -> Result<FileOperation, String> {
    let expanded_path = shellexpand::tilde(&path).to_string();
    let folder_path = Path::new(&expanded_path);
    
    if folder_path.exists() {
        return Ok(FileOperation {
            success: false,
            message: format!("Folder already exists: {}", path),
            path: None,
        });
    }

    fs::create_dir_all(folder_path).map_err(|e| e.to_string())?;

    Ok(FileOperation {
        success: true,
        message: format!("✅ Created folder: {}", path),
        path: Some(folder_path.to_string_lossy().to_string()),
    })
}

#[command]
pub fn delete_file(path: String, permanent: Option<bool>) -> Result<FileOperation, String> {
    let expanded_path = shellexpand::tilde(&path).to_string();
    let file_path = Path::new(&expanded_path);
    
    if !file_path.exists() {
        return Ok(FileOperation {
            success: false,
            message: format!("Path does not exist: {}", path),
            path: None,
        });
    }

    let permanent = permanent.unwrap_or(false);

    if permanent {
        // Permanent delete
        if file_path.is_dir() {
            fs::remove_dir_all(file_path).map_err(|e| e.to_string())?;
        } else {
            fs::remove_file(file_path).map_err(|e| e.to_string())?;
        }
        Ok(FileOperation {
            success: true,
            message: format!("✅ Permanently deleted: {}", path),
            path: Some(file_path.to_string_lossy().to_string()),
        })
    } else {
        // Move to trash (platform-specific)
        if trash::delete(file_path).is_ok() {
            Ok(FileOperation {
                success: true,
                message: format!("✅ Moved to trash: {}", path),
                path: Some(file_path.to_string_lossy().to_string()),
            })
        } else {
            // Fallback to permanent delete if trash fails
            if file_path.is_dir() {
                fs::remove_dir_all(file_path).map_err(|e| e.to_string())?;
            } else {
                fs::remove_file(file_path).map_err(|e| e.to_string())?;
            }
            Ok(FileOperation {
                success: true,
                message: format!("✅ Deleted (permanently): {}", path),
                path: Some(file_path.to_string_lossy().to_string()),
            })
        }
    }
}

#[command]
pub fn copy_file(source: String, destination: String) -> Result<FileOperation, String> {
    let src_path = shellexpand::tilde(&source).to_string();
    let src = Path::new(&src_path);
    let dst_path = shellexpand::tilde(&destination).to_string();
    let dst = Path::new(&dst_path);

    if !src.exists() {
        return Ok(FileOperation {
            success: false,
            message: format!("Source does not exist: {}", source),
            path: None,
        });
    }

    // Create destination parent directories if needed
    if let Some(parent) = dst.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    if src.is_dir() {
        copy_dir_all(src, dst).map_err(|e| e.to_string())?;
    } else {
        fs::copy(src, dst).map_err(|e| e.to_string())?;
    }

    Ok(FileOperation {
        success: true,
        message: format!("✅ Copied {} to {}", source, destination),
        path: Some(dst.to_string_lossy().to_string()),
    })
}

#[command]
pub fn move_file(source: String, destination: String) -> Result<FileOperation, String> {
    let src_path = shellexpand::tilde(&source).to_string();
    let src = Path::new(&src_path);
    let dst_path = shellexpand::tilde(&destination).to_string();
    let dst = Path::new(&dst_path);

    if !src.exists() {
        return Ok(FileOperation {
            success: false,
            message: format!("Source does not exist: {}", source),
            path: None,
        });
    }

    // Create destination parent directories if needed
    if let Some(parent) = dst.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    fs::rename(src, dst).map_err(|e| e.to_string())?;

    Ok(FileOperation {
        success: true,
        message: format!("✅ Moved {} to {}", source, destination),
        path: Some(dst.to_string_lossy().to_string()),
    })
}

#[command]
pub fn rename_file(path: String, new_name: String) -> Result<FileOperation, String> {
    let old_path = shellexpand::tilde(&path).to_string();
    let old = Path::new(&old_path);

    if !old.exists() {
        return Ok(FileOperation {
            success: false,
            message: format!("File does not exist: {}", path),
            path: None,
        });
    }

    let parent = old.parent().unwrap_or(Path::new(""));
    let new_path = parent.join(&new_name);

    fs::rename(old, &new_path).map_err(|e| e.to_string())?;

    Ok(FileOperation {
        success: true,
        message: format!("✅ Renamed to {}", new_path.display()),
        path: Some(new_path.to_string_lossy().to_string()),
    })
}

#[command]
pub fn compress_files(paths: Vec<String>, archive_name: String) -> Result<FileOperation, String> {
    let archive_path = Path::new(&archive_name);
    let tar_path = archive_path.with_extension("tar");

    let tar_file = fs::File::create(&tar_path).map_err(|e| e.to_string())?;
    let mut tar_builder = Builder::new(tar_file);

    for path_str in paths {
        let expanded = shellexpand::tilde(&path_str).to_string();
        let path = Path::new(&expanded);

        if !path.exists() {
            return Ok(FileOperation {
                success: false,
                message: format!("Path does not exist: {}", path_str),
                path: None,
            });
        }

        let name = path.file_name().unwrap_or_default();
        if path.is_dir() {
            tar_builder.append_dir_all(name, path).map_err(|e| e.to_string())?;
        } else {
            let mut file = fs::File::open(path).map_err(|e| e.to_string())?;
            tar_builder.append_file(name, &mut file).map_err(|e| e.to_string())?;
        }
    }

    tar_builder.finish().map_err(|e| e.to_string())?;

    // Compress tar to gz
    let tar_file = fs::File::open(&tar_path).map_err(|e| e.to_string())?;
    let mut encoder = GzEncoder::new(tar_file, Compression::default());
    let mut final_file = fs::File::create(archive_path).map_err(|e| e.to_string())?;
    io::copy(&mut encoder, &mut final_file).map_err(|e| e.to_string())?;

    // Remove intermediate tar
    let _ = fs::remove_file(tar_path);

    Ok(FileOperation {
        success: true,
        message: format!("✅ Created archive: {}", archive_name),
        path: Some(archive_path.to_string_lossy().to_string()),
    })
}

#[command]
pub fn extract_archive(archive: String, destination: Option<String>) -> Result<FileOperation, String> {
    let archive_path = shellexpand::tilde(&archive).to_string();
    let archive = Path::new(&archive_path);

    if !archive.exists() {
        return Ok(FileOperation {
            success: false,
            message: format!("Archive does not exist: {}", archive),
            path: None,
        });
    }

    let dest = if let Some(d) = destination {
        shellexpand::tilde(&d).to_string()
    } else {
        let stem = archive.file_stem().unwrap_or_default().to_string_lossy().to_string();
        archive.parent().unwrap_or(Path::new(".")).join(stem).to_string_lossy().to_string()
    };

    let dest_path = Path::new(&dest);
    fs::create_dir_all(dest_path).map_err(|e| e.to_string())?;

    // Check if it's a tar.gz
    if archive.extension().map_or(false, |ext| ext == "gz") {
        let tar_path = dest_path.join("temp.tar");
        let archive_file = fs::File::open(archive).map_err(|e| e.to_string())?;
        let mut decoder = flate2::read::GzDecoder::new(archive_file);
        let mut tar_file = fs::File::create(&tar_path).map_err(|e| e.to_string())?;
        io::copy(&mut decoder, &mut tar_file).map_err(|e| e.to_string())?;

        let tar_file = fs::File::open(&tar_path).map_err(|e| e.to_string())?;
        let mut archive_reader = Archive::new(tar_file);
        archive_reader.unpack(dest_path).map_err(|e| e.to_string())?;

        let _ = fs::remove_file(tar_path);
    } else if archive.extension().map_or(false, |ext| ext == "zip") {
        // Handle zip files - requires zip crate
        return Err("ZIP support requires additional crate".to_string());
    } else {
        return Err("Unsupported archive format".to_string());
    }

    Ok(FileOperation {
        success: true,
        message: format!("✅ Extracted to: {}", dest),
        path: Some(dest_path.to_string_lossy().to_string()),
    })
}

#[command]
pub fn calculate_hash(path: String, algorithm: String) -> Result<String, String> {
    let file_path = shellexpand::tilde(&path).to_string();
    let path = Path::new(&file_path);

    if !path.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    let mut file = fs::File::open(path).map_err(|e| e.to_string())?;

    match algorithm.to_lowercase().as_str() {
        "md5" => {
            let mut hasher = md5::Context::new();
            let mut buffer = [0; 8192];
            loop {
                let count = file.read(&mut buffer).map_err(|e| e.to_string())?;
                if count == 0 { break; }
                hasher.consume(&buffer[..count]);
            }
            let digest = hasher.compute();
            Ok(format!("MD5: {:x}", digest))
        },
        "sha1" => {
            let mut hasher = sha1::Sha1::new();
            let mut buffer = [0; 8192];
            loop {
                let count = file.read(&mut buffer).map_err(|e| e.to_string())?;
                if count == 0 { break; }
                hasher.update(&buffer[..count]);
            }
            Ok(format!("SHA1: {:x}", hasher.digest()))
        },
        "sha256" => {
            let mut hasher = Sha256::new();
            let mut buffer = [0; 8192];
            loop {
                let count = file.read(&mut buffer).map_err(|e| e.to_string())?;
                if count == 0 { break; }
                hasher.update(&buffer[..count]);
            }
            let result = hasher.finalize();
            Ok(format!("SHA256: {:x}", result))
        },
        _ => Err(format!("Unsupported algorithm: {}", algorithm)),
    }
}

#[command]
pub fn open_with(path: String, app: String) -> Result<String, String> {
    let file_path = shellexpand::tilde(&path).to_string();
    let path = Path::new(&file_path);

    if !path.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/C", "start", "", &app, &file_path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(&["-a", &app, &file_path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new(app)
            .arg(&file_path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(format!("✅ Opened {} with {}", path.display(), app))
}

// Helper functions
fn copy_dir_all(src: &Path, dst: &Path) -> io::Result<()> {
    if !dst.exists() {
        fs::create_dir_all(dst)?;
    }

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if ty.is_dir() {
            copy_dir_all(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }

    Ok(())
}

fn is_hidden(path: &Path) -> bool {
    path.file_name()
        .and_then(|n| n.to_str())
        .map(|s| s.starts_with('.'))
        .unwrap_or(false)
}

fn format_permissions(permissions: fs::Permissions) -> String {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mode = permissions.mode();
        format!("{:o}", mode & 0o777)
    }

    #[cfg(not(unix))]
    {
        String::from("----")
    }
}

#[command]
pub fn get_disk_usage(path: Option<String>) -> Result<Vec<DiskInfo>, String> {
    use sysinfo::Disks;

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

    Ok(disk_info)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiskInfo {
    name: String,
    mount_point: String,
    total_space: u64,
    available_space: u64,
    usage_percent: f32,
}