use tauri::command;
use serde::{Deserialize, Serialize};
use std::process::Command as StdCommand;
use std::net::{TcpStream, ToSocketAddrs};
use std::time::Duration;
use ping::ping;
use whois_rust::{WhoIs, WhoIsLookupOptions};
use trust_dns_resolver::Resolver;
use trust_dns_resolver::config::{ResolverConfig, ResolverOpts};
use local_ipaddress;
use mac_address::get_mac_address;
use systemstat::{System, Platform, saturating};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkInterface {
    name: String,
    ipv4: Option<String>,
    ipv6: Option<String>,
    mac: Option<String>,
    status: String,
    speed: Option<u64>,
    type_: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PingResult {
    host: String,
    success: bool,
    time_ms: Option<f64>,
    ttl: Option<u32>,
    error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DnsRecord {
    name: String,
    type_: String,
    ttl: u32,
    data: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PortInfo {
    port: u16,
    protocol: String,
    service: Option<String>,
    state: String,
    description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WhoisInfo {
    domain: String,
    registrar: Option<String>,
    creation_date: Option<String>,
    expiration_date: Option<String>,
    updated_date: Option<String>,
    name_servers: Vec<String>,
    registrant: Option<String>,
    emails: Vec<String>,
    raw: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BandwidthInfo {
    download_speed: f64,
    upload_speed: f64,
    unit: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkStats {
    interfaces: Vec<NetworkInterface>,
    default_gateway: Option<String>,
    dns_servers: Vec<String>,
    public_ip: Option<String>,
    hostname: String,
}

#[command]
pub fn get_network_interfaces() -> Result<Vec<NetworkInterface>, String> {
    let mut interfaces = Vec::new();
    let sys = System::new();
    
    match sys.networks() {
        Ok(networks) => {
            for (name, network) in networks.iter() {
                let mac = network.mac_addr();
                let ipv4 = network.ipv4().map(|ip| ip.to_string());
                let ipv6 = network.ipv6().map(|ip| ip.to_string());
                
                interfaces.push(NetworkInterface {
                    name: name.clone(),
                    ipv4,
                    ipv6,
                    mac: Some(mac),
                    status: "up".to_string(), // Would need actual status detection
                    speed: network.speed(),
                    type_: "ethernet".to_string(), // Would need actual type detection
                });
            }
        }
        Err(e) => return Err(format!("Failed to get network interfaces: {}", e)),
    }
    
    Ok(interfaces)
}

#[command]
pub fn ping_host(host: String, count: Option<u32>) -> Result<Vec<PingResult>, String> {
    let count = count.unwrap_or(4);
    let mut results = Vec::new();
    
    for i in 0..count {
        match ping(host.as_str(), Some(Duration::from_secs(1))) {
            Ok(response) => {
                results.push(PingResult {
                    host: host.clone(),
                    success: true,
                    time_ms: Some(response.0.as_secs_f64() * 1000.0),
                    ttl: response.1,
                    error: None,
                });
            }
            Err(e) => {
                results.push(PingResult {
                    host: host.clone(),
                    success: false,
                    time_ms: None,
                    ttl: None,
                    error: Some(format!("Ping failed: {}", e)),
                });
            }
        }
        
        if i < count - 1 {
            std::thread::sleep(Duration::from_millis(200));
        }
    }
    
    Ok(results)
}

#[command]
pub fn dns_lookup(domain: String, record_type: Option<String>) -> Result<Vec<DnsRecord>, String> {
    let resolver = Resolver::new(ResolverConfig::default(), ResolverOpts::default())
        .map_err(|e| format!("Failed to create DNS resolver: {}", e))?;
    
    let record_type = record_type.unwrap_or_else(|| "A".to_string());
    let mut records = Vec::new();
    
    match record_type.to_uppercase().as_str() {
        "A" => {
            let response = resolver.lookup_ip(domain.as_str())
                .map_err(|e| format!("DNS lookup failed: {}", e))?;
            
            for ip in response.iter() {
                records.push(DnsRecord {
                    name: domain.clone(),
                    type_: "A".to_string(),
                    ttl: response.valid_until().as_secs() as u32,
                    data: ip.to_string(),
                });
            }
        }
        "AAAA" => {
            let response = resolver.ipv6_lookup(domain.as_str())
                .map_err(|e| format!("IPv6 lookup failed: {}", e))?;
            
            for ip in response.iter() {
                records.push(DnsRecord {
                    name: domain.clone(),
                    type_: "AAAA".to_string(),
                    ttl: response.valid_until().as_secs() as u32,
                    data: ip.to_string(),
                });
            }
        }
        "MX" => {
            let response = resolver.mx_lookup(domain.as_str())
                .map_err(|e| format!("MX lookup failed: {}", e))?;
            
            for mx in response.iter() {
                records.push(DnsRecord {
                    name: domain.clone(),
                    type_: "MX".to_string(),
                    ttl: response.valid_until().as_secs() as u32,
                    data: format!("{} priority:{}", mx.exchange(), mx.preference()),
                });
            }
        }
        "NS" => {
            let response = resolver.ns_lookup(domain.as_str())
                .map_err(|e| format!("NS lookup failed: {}", e))?;
            
            for ns in response.iter() {
                records.push(DnsRecord {
                    name: domain.clone(),
                    type_: "NS".to_string(),
                    ttl: response.valid_until().as_secs() as u32,
                    data: ns.to_string(),
                });
            }
        }
        "TXT" => {
            let response = resolver.txt_lookup(domain.as_str())
                .map_err(|e| format!("TXT lookup failed: {}", e))?;
            
            for txt in response.iter() {
                records.push(DnsRecord {
                    name: domain.clone(),
                    type_: "TXT".to_string(),
                    ttl: response.valid_until().as_secs() as u32,
                    data: txt.to_string(),
                });
            }
        }
        "CNAME" => {
            let response = resolver.cname_lookup(domain.as_str())
                .map_err(|e| format!("CNAME lookup failed: {}", e))?;
            
            for cname in response.iter() {
                records.push(DnsRecord {
                    name: domain.clone(),
                    type_: "CNAME".to_string(),
                    ttl: response.valid_until().as_secs() as u32,
                    data: cname.to_string(),
                });
            }
        }
        "SOA" => {
            let response = resolver.soa_lookup(domain.as_str())
                .map_err(|e| format!("SOA lookup failed: {}", e))?;
            
            for soa in response.iter() {
                records.push(DnsRecord {
                    name: domain.clone(),
                    type_: "SOA".to_string(),
                    ttl: response.valid_until().as_secs() as u32,
                    data: format!("{} {} {} {} {} {} {}",
                        soa.mname(), soa.rname(), soa.serial(),
                        soa.refresh(), soa.retry(), soa.expire(), soa.minimum()),
                });
            }
        }
        _ => return Err(format!("Unsupported record type: {}", record_type)),
    }
    
    Ok(records)
}

#[command]
pub fn port_scan(host: String, ports: Option<Vec<u16>>, timeout_ms: Option<u64>) -> Result<Vec<PortInfo>, String> {
    let timeout = Duration::from_millis(timeout_ms.unwrap_or(1000));
    let ports_to_scan = ports.unwrap_or_else(|| {
        // Common ports
        vec![
            21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445,
            993, 995, 1723, 3306, 3389, 5900, 8080, 8443,
        ]
    });
    
    let mut results = Vec::new();
    let services = get_common_services();
    
    for &port in &ports_to_scan {
        let addr = format!("{}:{}", host, port);
        match TcpStream::connect_timeout(&addr.as_str().to_socket_addrs().unwrap().next().unwrap(), timeout) {
            Ok(_) => {
                results.push(PortInfo {
                    port,
                    protocol: "tcp".to_string(),
                    service: services.get(&port).cloned().map(|s| s.to_string()),
                    state: "open".to_string(),
                    description: None,
                });
            }
            Err(_) => {
                // Port is closed or filtered
                results.push(PortInfo {
                    port,
                    protocol: "tcp".to_string(),
                    service: services.get(&port).cloned().map(|s| s.to_string()),
                    state: "closed".to_string(),
                    description: None,
                });
            }
        }
    }
    
    Ok(results)
}

#[command]
pub fn whois_lookup(domain: String) -> Result<WhoisInfo, String> {
    // Configure WHOIS client
    let whois = WhoIs::from_path("/etc/whois.conf")
        .unwrap_or_else(|_| WhoIs::new(HashMap::new()).unwrap());
    
    let options = WhoIsLookupOptions::from_string(&domain)
        .map_err(|e| format!("Invalid domain: {}", e))?;
    
    let result = whois.lookup(options)
        .map_err(|e| format!("WHOIS lookup failed: {}", e))?;
    
    parse_whois_output(&domain, &result)
}

fn parse_whois_output(domain: &str, raw: &str) -> Result<WhoisInfo, String> {
    let mut registrar = None;
    let mut creation_date = None;
    let mut expiration_date = None;
    let mut updated_date = None;
    let mut name_servers = Vec::new();
    let mut registrant = None;
    let mut emails = Vec::new();
    
    for line in raw.lines() {
        let line_lower = line.to_lowercase();
        
        if line_lower.contains("registrar:") {
            registrar = Some(line.split(':').nth(1).unwrap_or("").trim().to_string());
        }
        else if line_lower.contains("creation date:") || line_lower.contains("created:") {
            creation_date = Some(line.split(':').nth(1).unwrap_or("").trim().to_string());
        }
        else if line_lower.contains("expir") && line_lower.contains("date:") {
            expiration_date = Some(line.split(':').nth(1).unwrap_or("").trim().to_string());
        }
        else if line_lower.contains("updated date:") || line_lower.contains("last updated:") {
            updated_date = Some(line.split(':').nth(1).unwrap_or("").trim().to_string());
        }
        else if line_lower.contains("name server:") {
            let ns = line.split(':').nth(1).unwrap_or("").trim().to_string();
            if !ns.is_empty() {
                name_servers.push(ns);
            }
        }
        else if line_lower.contains("registrant name:") {
            registrant = Some(line.split(':').nth(1).unwrap_or("").trim().to_string());
        }
        else if line_lower.contains("email:") {
            let email = line.split(':').nth(1).unwrap_or("").trim().to_string();
            if email.contains('@') {
                emails.push(email);
            }
        }
    }
    
    Ok(WhoisInfo {
        domain: domain.to_string(),
        registrar,
        creation_date,
        expiration_date,
        updated_date,
        name_servers,
        registrant,
        emails,
        raw: raw.to_string(),
    })
}

#[command]
pub fn get_public_ip() -> Result<String, String> {
    // Try multiple services for redundancy
    let services = vec![
        "https://api.ipify.org",
        "https://icanhazip.com",
        "https://ifconfig.me/ip",
    ];
    
    for service in services {
        if let Ok(response) = reqwest::blocking::get(service) {
            if let Ok(ip) = response.text() {
                let ip = ip.trim().to_string();
                if !ip.is_empty() {
                    return Ok(ip);
                }
            }
        }
    }
    
    Err("Could not determine public IP".to_string())
}

#[command]
pub fn get_local_ip() -> Result<String, String> {
    local_ipaddress::get().ok_or_else(|| "Could not determine local IP".to_string())
}

#[command]
pub fn get_mac_addresses() -> Result<Vec<String>, String> {
    let mut addresses = Vec::new();
    
    if let Ok(Some(mac)) = get_mac_address() {
        addresses.push(mac.to_string());
    }
    
    // Try to get MAC for all interfaces
    if let Ok(interfaces) = get_network_interfaces() {
        for iface in interfaces {
            if let Some(mac) = iface.mac {
                if !addresses.contains(&mac) {
                    addresses.push(mac);
                }
            }
        }
    }
    
    Ok(addresses)
}

#[command]
pub fn get_default_gateway() -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        let output = StdCommand::new("ip")
            .args(&["route", "show", "default"])
            .output()
            .map_err(|e| format!("Failed to get gateway: {}", e))?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            if line.contains("default via") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 3 {
                    return Ok(parts[2].to_string());
                }
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        let output = StdCommand::new("ipconfig")
            .output()
            .map_err(|e| format!("Failed to get gateway: {}", e))?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            if line.contains("Default Gateway") && line.contains(':') {
                let parts: Vec<&str> = line.split(':').collect();
                if parts.len() >= 2 {
                    return Ok(parts[1].trim().to_string());
                }
            }
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let output = StdCommand::new("netstat")
            .args(&["-rn"])
            .output()
            .map_err(|e| format!("Failed to get gateway: {}", e))?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            if line.starts_with("default") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    return Ok(parts[1].to_string());
                }
            }
        }
    }
    
    Err("Could not determine default gateway".to_string())
}

#[command]
pub fn get_dns_servers() -> Result<Vec<String>, String> {
    let mut servers = Vec::new();
    
    #[cfg(target_os = "linux")]
    {
        let content = std::fs::read_to_string("/etc/resolv.conf")
            .map_err(|e| format!("Failed to read resolv.conf: {}", e))?;
        
        for line in content.lines() {
            if line.starts_with("nameserver") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    servers.push(parts[1].to_string());
                }
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        let output = StdCommand::new("ipconfig")
            .args(&["/all"])
            .output()
            .map_err(|e| format!("Failed to get DNS servers: {}", e))?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            if line.contains("DNS Servers") && line.contains(':') {
                let parts: Vec<&str> = line.split(':').collect();
                if parts.len() >= 2 {
                    servers.push(parts[1].trim().to_string());
                }
            }
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let output = StdCommand::new("scutil")
            .args(&["--dns"])
            .output()
            .map_err(|e| format!("Failed to get DNS servers: {}", e))?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            if line.contains("nameserver") {
                let parts: Vec<&str> = line.split('[').collect();
                if parts.len() >= 2 {
                    let ip = parts[1].replace("]", "").trim().to_string();
                    if !ip.is_empty() {
                        servers.push(ip);
                    }
                }
            }
        }
    }
    
    Ok(servers)
}

#[command]
pub fn get_hostname() -> Result<String, String> {
    hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .map_err(|e| format!("Failed to get hostname: {}", e))
}

#[command]
pub fn trace_route(host: String, max_hops: Option<u32>) -> Result<Vec<PingResult>, String> {
    let max_hops = max_hops.unwrap_or(30);
    let mut results = Vec::new();
    
    #[cfg(target_os = "linux")]
    {
        let output = StdCommand::new("traceroute")
            .args(&["-n", "-m", &max_hops.to_string(), &host])
            .output()
            .map_err(|e| format!("Failed to execute traceroute: {}", e))?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines().skip(1) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                let hop_ip = parts[1].replace("*", "").trim().to_string();
                if !hop_ip.is_empty() && hop_ip != "ms" {
                    results.push(PingResult {
                        host: hop_ip.clone(),
                        success: hop_ip != "*",
                        time_ms: parts.get(2).and_then(|t| t.parse::<f64>().ok()),
                        ttl: None,
                        error: None,
                    });
                }
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        let output = StdCommand::new("tracert")
            .args(&["-h", &max_hops.to_string(), &host])
            .output()
            .map_err(|e| format!("Failed to execute tracert: {}", e))?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            if line.contains("ms") {
                results.push(PingResult {
                    host: "hop".to_string(),
                    success: true,
                    time_ms: None,
                    ttl: None,
                    error: None,
                });
            }
        }
    }
    
    Ok(results)
}

#[command]
pub fn speed_test() -> Result<BandwidthInfo, String> {
    // This is a simplified speed test - in production, you'd want to
    // actually download/upload test files and measure time
    
    let test_url = "http://speedtest.tele2.net/10MB.zip";
    let start = std::time::Instant::now();
    
    let client = reqwest::blocking::Client::new();
    let response = client.get(test_url)
        .timeout(Duration::from_secs(30))
        .send()
        .map_err(|e| format!("Speed test failed: {}", e))?;
    
    let content = response.bytes()
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    let duration = start.elapsed();
    let size_mb = content.len() as f64 / 1_048_576.0;
    let speed_mbps = (size_mb * 8.0) / duration.as_secs_f64();
    
    Ok(BandwidthInfo {
        download_speed: speed_mbps,
        upload_speed: 0.0, // Would need a separate upload test
        unit: "Mbps".to_string(),
    })
}

#[command]
pub fn get_network_stats() -> Result<NetworkStats, String> {
    Ok(NetworkStats {
        interfaces: get_network_interfaces()?,
        default_gateway: get_default_gateway().ok(),
        dns_servers: get_dns_servers()?,
        public_ip: get_public_ip().ok(),
        hostname: get_hostname()?,
    })
}

#[command]
pub fn check_website_status(url: String) -> Result<(u16, String), String> {
    let client = reqwest::blocking::Client::new();
    let response = client.get(&url)
        .timeout(Duration::from_secs(10))
        .send()
        .map_err(|e| format!("Failed to connect: {}", e))?;
    
    let status = response.status();
    Ok((status.as_u16(), status.to_string()))
}

#[command]
pub fn get_ssl_certificate_info(domain: String) -> Result<HashMap<String, String>, String> {
    use native_tls::TlsConnector;
    use std::net::TcpStream;
    
    let connector = TlsConnector::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("Failed to create TLS connector: {}", e))?;
    
    let stream = TcpStream::connect(format!("{}:443", domain))
        .map_err(|e| format!("Failed to connect: {}", e))?;
    
    let tls_stream = connector.connect(&domain, stream)
        .map_err(|e| format!("TLS handshake failed: {}", e))?;
    
    let cert = tls_stream.peer_certificate()
        .ok_or_else(|| "No peer certificate".to_string())?;
    
    let mut info = HashMap::new();
    
    if let Ok(der) = cert.to_der() {
        if let Ok(x509) = x509_parser::parse_x509_certificate(&der) {
            let (_, cert) = x509;
            
            info.insert("issuer".to_string(), cert.issuer().to_string());
            info.insert("subject".to_string(), cert.subject().to_string());
            
            if let Ok(not_before) = std::str::from_utf8(cert.validity().not_before.to_full_string().as_bytes()) {
                info.insert("valid_from".to_string(), not_before.to_string());
            }
            
            if let Ok(not_after) = std::str::from_utf8(cert.validity().not_after.to_full_string().as_bytes()) {
                info.insert("valid_until".to_string(), not_after.to_string());
            }
            
            info.insert("serial".to_string(), format!("{:x}", cert.serial_number));
            
            if let Some(sig_algo) = cert.signature_algorithm.algorithm.to_id_string() {
                info.insert("signature_algorithm".to_string(), sig_algo);
            }
        }
    }
    
    Ok(info)
}

// Helper function to get common service names
fn get_common_services() -> HashMap<u16, &'static str> {
    let mut map = HashMap::new();
    map.insert(21, "FTP");
    map.insert(22, "SSH");
    map.insert(23, "Telnet");
    map.insert(25, "SMTP");
    map.insert(53, "DNS");
    map.insert(80, "HTTP");
    map.insert(110, "POP3");
    map.insert(111, "RPC");
    map.insert(135, "RPC");
    map.insert(139, "NetBIOS");
    map.insert(143, "IMAP");
    map.insert(443, "HTTPS");
    map.insert(445, "SMB");
    map.insert(993, "IMAPS");
    map.insert(995, "POP3S");
    map.insert(1723, "PPTP");
    map.insert(3306, "MySQL");
    map.insert(3389, "RDP");
    map.insert(5900, "VNC");
    map.insert(8080, "HTTP-Alt");
    map.insert(8443, "HTTPS-Alt");
    map
}