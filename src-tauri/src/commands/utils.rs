use tauri::command;
use serde::{Deserialize, Serialize};
use chrono::{Local, DateTime, Duration, Timelike};
use rand::Rng;
use uuid::Uuid;
use base64::{encode, decode};
use serde_json::Value;
use regex::Regex;
use qrcode_generator::QrCodeEcc;
use std::collections::HashMap;
use whoami;
use mac_address::get_mac_address;
use local_ipaddress;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CalculationResult {
    expression: String,
    result: f64,
    formatted: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnitConversion {
    from_value: f64,
    from_unit: String,
    to_unit: String,
    result: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WorldClock {
    timezone: String,
    local_time: String,
    utc_offset: String,
    dst_active: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PasswordStrength {
    password: String,
    score: u8,
    strength: String,
    entropy: f64,
    crack_time: String,
    suggestions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocationInfo {
    ip: String,
    city: Option<String>,
    region: Option<String>,
    country: Option<String>,
    latitude: Option<f64>,
    longitude: Option<f64>,
    timezone: Option<String>,
}

#[command]
pub fn calculate(expression: String) -> Result<CalculationResult, String> {
    // Simple arithmetic parser (in a real app, use a proper expression evaluator)
    let expression_trimmed = expression.replace(" ", "");
    
    // Basic safety check - only allow numbers and basic operators
    let safe_pattern = Regex::new(r"^[0-9+\-*/().\s]+$").unwrap();
    if !safe_pattern.is_match(&expression) {
        return Err("Expression contains invalid characters".to_string());
    }
    
    // Use meval crate for safe evaluation (add to Cargo.toml)
    match meval::eval_str(&expression_trimmed) {
        Ok(result) => {
            let formatted = if result.fract() == 0.0 {
                format!("{}", result)
            } else {
                format!("{:.2}", result)
            };
            
            Ok(CalculationResult {
                expression,
                result,
                formatted: format!("= {}", formatted),
            })
        }
        Err(e) => Err(format!("Invalid expression: {}", e)),
    }
}

#[command]
pub fn convert_units(value: f64, from_unit: String, to_unit: String, category: String) -> Result<UnitConversion, String> {
    let conversion_factors: HashMap<&str, HashMap<&str, f64>> = HashMap::from([
        // Length conversions
        ("length", HashMap::from([
            ("m", 1.0),
            ("km", 1000.0),
            ("cm", 0.01),
            ("mm", 0.001),
            ("mile", 1609.344),
            ("yard", 0.9144),
            ("foot", 0.3048),
            ("inch", 0.0254),
        ])),
        // Weight conversions
        ("weight", HashMap::from([
            ("kg", 1.0),
            ("g", 0.001),
            ("mg", 0.000001),
            ("lb", 0.453592),
            ("oz", 0.0283495),
        ])),
        // Temperature conversions (special handling)
        ("temperature", HashMap::from([
            ("c", 1.0),
            ("f", 1.8),
            ("k", 1.0),
        ])),
        // Volume conversions
        ("volume", HashMap::from([
            ("l", 1.0),
            ("ml", 0.001),
            ("gal", 3.78541),
            ("qt", 0.946353),
            ("pt", 0.473176),
            ("cup", 0.236588),
        ])),
    ]);
    
    let factors = conversion_factors.get(category.as_str()).ok_or("Unknown conversion category")?;
    
    let from_factor = factors.get(from_unit.as_str()).ok_or("Unknown from unit")?;
    let to_factor = factors.get(to_unit.as_str()).ok_or("Unknown to unit")?;
    
    let result = if category == "temperature" {
        // Temperature needs special formulas
        match (from_unit.as_str(), to_unit.as_str()) {
            ("c", "f") => value * 1.8 + 32.0,
            ("f", "c") => (value - 32.0) / 1.8,
            ("c", "k") => value + 273.15,
            ("k", "c") => value - 273.15,
            ("f", "k") => (value - 32.0) / 1.8 + 273.15,
            ("k", "f") => (value - 273.15) * 1.8 + 32.0,
            _ => value, // Same unit
        }
    } else {
        value * from_factor / to_factor
    };
    
    Ok(UnitConversion {
        from_value: value,
        from_unit,
        to_unit,
        result,
    })
}

#[command]
pub fn generate_password(length: Option<usize>, 
                         include_uppercase: Option<bool>,
                         include_lowercase: Option<bool>,
                         include_numbers: Option<bool>,
                         include_symbols: Option<bool>) -> Result<String, String> {
    
    let length = length.unwrap_or(16);
    let include_uppercase = include_uppercase.unwrap_or(true);
    let include_lowercase = include_lowercase.unwrap_or(true);
    let include_numbers = include_numbers.unwrap_or(true);
    let include_symbols = include_symbols.unwrap_or(true);
    
    if !include_uppercase && !include_lowercase && !include_numbers && !include_symbols {
        return Err("At least one character type must be selected".to_string());
    }
    
    let mut charset = String::new();
    if include_uppercase { charset.push_str("ABCDEFGHIJKLMNOPQRSTUVWXYZ"); }
    if include_lowercase { charset.push_str("abcdefghijklmnopqrstuvwxyz"); }
    if include_numbers { charset.push_str("0123456789"); }
    if include_symbols { charset.push_str("!@#$%^&*()_+-=[]{}|;:,.<>?"); }
    
    let charset_bytes = charset.as_bytes();
    let mut rng = rand::thread_rng();
    let password: String = (0..length)
        .map(|_| {
            let idx = rng.gen_range(0..charset_bytes.len());
            charset_bytes[idx] as char
        })
        .collect();
    
    Ok(password)
}

#[command]
pub fn check_password_strength(password: String) -> Result<PasswordStrength, String> {
    let length = password.len();
    let has_upper = password.chars().any(|c| c.is_uppercase());
    let has_lower = password.chars().any(|c| c.is_lowercase());
    let has_digit = password.chars().any(|c| c.is_ascii_digit());
    let has_symbol = password.chars().any(|c| !c.is_alphanumeric() && !c.is_whitespace());
    
    let mut score = 0;
    
    // Length scoring
    if length >= 8 { score += 1; }
    if length >= 12 { score += 1; }
    if length >= 16 { score += 1; }
    
    // Character variety scoring
    if has_upper { score += 1; }
    if has_lower { score += 1; }
    if has_digit { score += 1; }
    if has_symbol { score += 2; }
    
    // Calculate entropy (simplified)
    let charset_size = 
        (if has_upper { 26 } else { 0 }) +
        (if has_lower { 26 } else { 0 }) +
        (if has_digit { 10 } else { 0 }) +
        (if has_symbol { 32 } else { 0 });
    
    let entropy = if charset_size > 0 {
        length as f64 * (charset_size as f64).log2()
    } else {
        0.0
    };
    
    let strength = match score {
        0..=2 => "Weak",
        3..=4 => "Fair",
        5..=6 => "Good",
        7..=8 => "Strong",
        _ => "Very Strong",
    }.to_string();
    
    // Estimate crack time (simplified)
    let crack_time = match entropy as i32 {
        0..=28 => "Instant".to_string(),
        29..=35 => "Seconds".to_string(),
        36..=59 => "Minutes".to_string(),
        60..=79 => "Hours".to_string(),
        80..=99 => "Days".to_string(),
        100..=127 => "Months".to_string(),
        _ => "Years".to_string(),
    };
    
    let mut suggestions = Vec::new();
    if length < 12 {
        suggestions.push("Use at least 12 characters".to_string());
    }
    if !has_upper {
        suggestions.push("Add uppercase letters".to_string());
    }
    if !has_lower {
        suggestions.push("Add lowercase letters".to_string());
    }
    if !has_digit {
        suggestions.push("Add numbers".to_string());
    }
    if !has_symbol {
        suggestions.push("Add symbols".to_string());
    }
    
    Ok(PasswordStrength {
        password,
        score: score as u8,
        strength,
        entropy,
        crack_time,
        suggestions,
    })
}

#[command]
pub fn generate_uuid() -> Result<String, String> {
    Ok(Uuid::new_v4().to_string())
}

#[command]
pub fn generate_qr(data: String, size: Option<usize>) -> Result<String, String> {
    let size = size.unwrap_or(256);
    
    // Generate QR code as PNG in memory
    let qr_data = qrcode_generator::to_image_to_memory(&data, QrCodeEcc::High, size)
        .map_err(|e| format!("Failed to generate QR code: {}", e))?;
    
    // Convert to base64 for sending to frontend
    let base64_image = base64::encode(&qr_data);
    Ok(format!("data:image/png;base64,{}", base64_image))
}

#[command]
pub fn calculate_hash(text: String, algorithm: String) -> Result<String, String> {
    match algorithm.to_lowercase().as_str() {
        "md5" => {
            let digest = md5::compute(text.as_bytes());
            Ok(format!("{:x}", digest))
        }
        "sha1" => {
            use sha1::Sha1;
            let mut hasher = Sha1::new();
            hasher.update(text.as_bytes());
            Ok(hasher.digest().to_string())
        }
        "sha256" => {
            use sha2::{Sha256, Digest};
            let mut hasher = Sha256::new();
            hasher.update(text.as_bytes());
            let result = hasher.finalize();
            Ok(format!("{:x}", result))
        }
        _ => Err(format!("Unsupported algorithm: {}", algorithm)),
    }
}

#[command]
pub fn base64_encode(text: String) -> Result<String, String> {
    Ok(encode(text.as_bytes()))
}

#[command]
pub fn base64_decode(text: String) -> Result<String, String> {
    let decoded = decode(&text).map_err(|e| format!("Invalid base64: {}", e))?;
    String::from_utf8(decoded).map_err(|e| format!("Invalid UTF-8: {}", e))
}

#[command]
pub fn format_json(json: String, pretty: Option<bool>) -> Result<String, String> {
    let parsed: Value = serde_json::from_str(&json).map_err(|e| format!("Invalid JSON: {}", e))?;
    
    if pretty.unwrap_or(true) {
        serde_json::to_string_pretty(&parsed).map_err(|e| e.to_string())
    } else {
        serde_json::to_string(&parsed).map_err(|e| e.to_string())
    }
}

#[command]
pub fn get_ip_info() -> Result<LocationInfo, String> {
    let ip = local_ipaddress::get().unwrap_or_else(|| "Unknown".to_string());
    
    // In a real app, you might want to call an external API for geolocation
    // For now, return basic info
    Ok(LocationInfo {
        ip,
        city: None,
        region: None,
        country: None,
        latitude: None,
        longitude: None,
        timezone: None,
    })
}

#[command]
pub fn get_mac_addresses() -> Result<Vec<String>, String> {
    let mut addresses = Vec::new();
    
    if let Ok(Some(mac)) = get_mac_address() {
        addresses.push(mac.to_string());
    }
    
    Ok(addresses)
}

#[command]
pub fn get_world_time(timezone: Option<String>) -> Result<WorldClock, String> {
    let local = Local::now();
    
    // Simple implementation - in production, use chrono-tz for timezone support
    let timezone_str = timezone.unwrap_or_else(|| "Local".to_string());
    
    Ok(WorldClock {
        timezone: timezone_str,
        local_time: local.format("%Y-%m-%d %H:%M:%S").to_string(),
        utc_offset: local.format("%:z").to_string(),
        dst_active: false, // Would need proper DST detection
    })
}

#[command]
pub fn date_difference(date1: String, date2: String, unit: String) -> Result<f64, String> {
    let format = "%Y-%m-%d";
    
    let dt1 = DateTime::parse_from_str(&format!("{} 00:00:00 +0000", date1), "%Y-%m-%d %H:%M:%S %z")
        .map_err(|e| format!("Invalid date format: {}", e))?;
    
    let dt2 = DateTime::parse_from_str(&format!("{} 00:00:00 +0000", date2), "%Y-%m-%d %H:%M:%S %z")
        .map_err(|e| format!("Invalid date format: {}", e))?;
    
    let diff = dt2.signed_duration_since(dt1);
    
    let result = match unit.as_str() {
        "days" => diff.num_days() as f64,
        "hours" => diff.num_hours() as f64,
        "minutes" => diff.num_minutes() as f64,
        "seconds" => diff.num_seconds() as f64,
        "weeks" => diff.num_weeks() as f64,
        _ => diff.num_days() as f64,
    };
    
    Ok(result)
}

#[command]
pub fn roll_dice(sides: Option<u32>, count: Option<u32>) -> Result<Vec<u32>, String> {
    let sides = sides.unwrap_or(6);
    let count = count.unwrap_or(1);
    
    if sides < 2 {
        return Err("Dice must have at least 2 sides".to_string());
    }
    
    if count > 100 {
        return Err("Cannot roll more than 100 dice at once".to_string());
    }
    
    let mut rng = rand::thread_rng();
    let mut results = Vec::new();
    
    for _ in 0..count {
        results.push(rng.gen_range(1..=sides));
    }
    
    Ok(results)
}

#[command]
pub fn flip_coin() -> Result<String, String> {
    let mut rng = rand::thread_rng();
    Ok(if rng.gen_bool(0.5) { "Heads" } else { "Tails" }.to_string())
}

#[command]
pub fn random_number(min: i32, max: i32) -> Result<i32, String> {
    if min >= max {
        return Err("Min must be less than max".to_string());
    }
    
    let mut rng = rand::thread_rng();
    Ok(rng.gen_range(min..=max))
}

#[command]
pub fn validate_email(email: String) -> Result<bool, String> {
    let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();
    Ok(email_regex.is_match(&email))
}

#[command]
pub fn validate_phone(phone: String) -> Result<bool, String> {
    // Simple phone validation - at least 10 digits
    let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
    Ok(digits.len() >= 10)
}

#[command]
pub fn format_phone(phone: String, format: Option<String>) -> Result<String, String> {
    let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
    
    let format_str = format.unwrap_or_else(|| "XXX-XXX-XXXX".to_string());
    
    if digits.len() != format_str.chars().filter(|&c| c == 'X').count() {
        return Err("Phone number length doesn't match format".to_string());
    }
    
    let mut result = String::new();
    let mut digit_idx = 0;
    
    for c in format_str.chars() {
        if c == 'X' {
            result.push(digits.chars().nth(digit_idx).unwrap());
            digit_idx += 1;
        } else {
            result.push(c);
        }
    }
    
    Ok(result)
}