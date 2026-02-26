import { invoke } from '@tauri-apps/api/tauri';

// ==================== Existing Interfaces ====================

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  modified: string;
  is_directory: boolean;
  extension: string | null;
}

export interface SearchResult {
  title: string;
  url: string;
  description: string;
}

export interface SystemInfo {
  os: string;
  kernel: string;
  host_name: string;
  cpu_usage: number;
  cpu_cores: number;
  memory_total: number;
  memory_used: number;
  memory_percent: number;
  uptime: number;
  disks: {
    name: string;
    mount_point: string;
    total_space: number;
    available_space: number;
    usage_percent: number;
  }[];
  top_processes: {
    pid: number;
    name: string;
    cpu_usage: number;
    memory_usage: number;
  }[];
}

// ==================== New Interfaces ====================

// Apps Module
export interface AppInfo {
  name: string;
  display_name: string;
  path: string | null;
  icon: string | null;
  category: string;
  installed: boolean;
}

// Files Module - Enhanced
export interface FileOperation {
  success: boolean;
  message: string;
  path: string | null;
}

export interface DiskInfo {
  name: string;
  mount_point: string;
  total_space: number;
  available_space: number;
  usage_percent: number;
}

// System Module - Enhanced
export interface ServiceInfo {
  name: string;
  status: string;
  enabled: boolean;
  description: string;
}

export interface UserInfo {
  username: string;
  groups: string[];
  home_dir: string;
  shell: string;
}

export interface NetworkStats {
  interfaces: NetworkInterface[];
  default_gateway: string | null;
  dns_servers: string[];
  public_ip: string | null;
  hostname: string;
}

// Control Module
export interface WindowInfo {
  id: number;
  title: string;
  app_name: string;
  is_visible: boolean;
  is_minimized: boolean;
  is_maximized: boolean;
  position: [number, number] | null;
  size: [number, number] | null;
}

export interface ScreenInfo {
  id: number;
  width: number;
  height: number;
  is_primary: boolean;
  scale_factor: number;
}

export interface KeyboardState {
  keys_down: string[];
  modifiers: string[];
}

export interface MouseState {
  position: [number, number];
  buttons_down: string[];
}

// Utils Module
export interface CalculationResult {
  expression: string;
  result: number;
  formatted: string;
}

export interface UnitConversion {
  from_value: number;
  from_unit: string;
  to_unit: string;
  result: number;
}

export interface PasswordStrength {
  password: string;
  score: number;
  strength: string;
  entropy: number;
  crack_time: string;
  suggestions: string[];
}

export interface LocationInfo {
  ip: string;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

// Network Module
export interface NetworkInterface {
  name: string;
  ipv4: string | null;
  ipv6: string | null;
  mac: string | null;
  status: string;
  speed: number | null;
  type_: string;
}

export interface PingResult {
  host: string;
  success: boolean;
  time_ms: number | null;
  ttl: number | null;
  error: string | null;
}

export interface DnsRecord {
  name: string;
  type_: string;
  ttl: number;
  data: string;
}

export interface PortInfo {
  port: number;
  protocol: string;
  service: string | null;
  state: string;
  description: string | null;
}

export interface WhoisInfo {
  domain: string;
  registrar: string | null;
  creation_date: string | null;
  expiration_date: string | null;
  updated_date: string | null;
  name_servers: string[];
  registrant: string | null;
  emails: string[];
  raw: string;
}

export interface BandwidthInfo {
  download_speed: number;
  upload_speed: number;
  unit: string;
}

// Install Module
export interface PackageInfo {
  name: string;
  version: string | null;
  description: string | null;
  size: string | null;
  installed: boolean;
  repository: string;
}

export interface InstallResult {
  success: boolean;
  message: string;
  command: string;
  output: string;
}

export interface PackageManager {
  name: string;
  available: boolean;
  command: string;
  os: string[];
}

// Media Module
export interface AudioDevice {
  name: string;
  id: string;
  is_default: boolean;
  device_type: string;
  volume: number | null;
  muted: boolean;
}

export interface DisplayInfo {
  id: number;
  name: string;
  width: number;
  height: number;
  refresh_rate: number | null;
  is_primary: boolean;
  scale_factor: number;
  brightness: number | null;
}

export interface MediaFile {
  path: string;
  duration: number | null;
  codec: string | null;
  bitrate: number | null;
  sample_rate: number | null;
  channels: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  file_size: number;
  format: string;
}

export interface ScreenshotResult {
  path: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface VolumeControl {
  device: string;
  volume: number;
  muted: boolean;
}

export function useCommands() {
  // ==================== Apps Module ====================
  
  const openApplication = async (appName: string): Promise<string> => {
    try {
      return await invoke('open_application', { appName });
    } catch (error) {
      console.error('Error opening application:', error);
      throw error;
    }
  };

  const getAvailableApps = async (): Promise<AppInfo[]> => {
    try {
      return await invoke('get_available_apps');
    } catch (error) {
      console.error('Error getting available apps:', error);
      return [];
    }
  };

  const checkIfAppInstalled = async (appName: string): Promise<boolean> => {
    try {
      return await invoke('check_if_app_installed', { appName });
    } catch (error) {
      console.error('Error checking app installation:', error);
      return false;
    }
  };

  const openTerminal = async (): Promise<string> => {
    try {
      return await invoke('open_terminal');
    } catch (error) {
      console.error('Error opening terminal:', error);
      throw error;
    }
  };

  const openTaskManager = async (): Promise<string> => {
    try {
      return await invoke('open_task_manager');
    } catch (error) {
      console.error('Error opening task manager:', error);
      throw error;
    }
  };

  const openCalculator = async (): Promise<string> => {
    try {
      return await invoke('open_calculator');
    } catch (error) {
      console.error('Error opening calculator:', error);
      throw error;
    }
  };

  const openFileManager = async (): Promise<string> => {
    try {
      return await invoke('open_file_manager');
    } catch (error) {
      console.error('Error opening file manager:', error);
      throw error;
    }
  };

  const openSettings = async (): Promise<string> => {
    try {
      return await invoke('open_settings');
    } catch (error) {
      console.error('Error opening settings:', error);
      throw error;
    }
  };

  // ==================== Files Module (Enhanced) ====================
  
  const searchFiles = async (query: string, path?: string, deep?: boolean): Promise<FileInfo[]> => {
    try {
      return await invoke('search_files', { query, path: path || null, deep });
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  };

  const getFileInfo = async (path: string): Promise<FileInfo> => {
    try {
      return await invoke('get_file_info', { path });
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  };

  const openFileLocation = async (path: string): Promise<string> => {
    try {
      return await invoke('open_file_location', { path });
    } catch (error) {
      console.error('Error opening file location:', error);
      throw error;
    }
  };

  const createFile = async (path: string, content?: string): Promise<FileOperation> => {
    try {
      return await invoke('create_file', { path, content });
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  };

  const createFolder = async (path: string): Promise<FileOperation> => {
    try {
      return await invoke('create_folder', { path });
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  };

  const deleteFile = async (path: string, permanent?: boolean): Promise<FileOperation> => {
    try {
      return await invoke('delete_file', { path, permanent });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  const copyFile = async (source: string, destination: string): Promise<FileOperation> => {
    try {
      return await invoke('copy_file', { source, destination });
    } catch (error) {
      console.error('Error copying file:', error);
      throw error;
    }
  };

  const moveFile = async (source: string, destination: string): Promise<FileOperation> => {
    try {
      return await invoke('move_file', { source, destination });
    } catch (error) {
      console.error('Error moving file:', error);
      throw error;
    }
  };

  const renameFile = async (path: string, newName: string): Promise<FileOperation> => {
    try {
      return await invoke('rename_file', { path, newName });
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  };

  const compressFiles = async (paths: string[], archiveName: string): Promise<FileOperation> => {
    try {
      return await invoke('compress_files', { paths, archiveName });
    } catch (error) {
      console.error('Error compressing files:', error);
      throw error;
    }
  };

  const extractArchive = async (archive: string, destination?: string): Promise<FileOperation> => {
    try {
      return await invoke('extract_archive', { archive, destination });
    } catch (error) {
      console.error('Error extracting archive:', error);
      throw error;
    }
  };

  const calculateFileHash = async (path: string, algorithm: string): Promise<string> => {
    try {
      return await invoke('calculate_hash', { path, algorithm });
    } catch (error) {
      console.error('Error calculating file hash:', error);
      throw error;
    }
  };

  const openWith = async (path: string, app: string): Promise<string> => {
    try {
      return await invoke('open_with', { path, app });
    } catch (error) {
      console.error('Error opening with app:', error);
      throw error;
    }
  };

  const getDiskUsage = async (path?: string): Promise<DiskInfo[]> => {
    try {
      return await invoke('get_disk_usage', { path });
    } catch (error) {
      console.error('Error getting disk usage:', error);
      return [];
    }
  };

  // ==================== System Module (Enhanced) ====================
  
  const getSystemInfo = async (): Promise<SystemInfo> => {
    try {
      return await invoke('get_system_info');
    } catch (error) {
      console.error('Error getting system info:', error);
      throw error;
    }
  };

  const controlSystem = async (action: string, delay?: number): Promise<string> => {
    try {
      return await invoke('control_system', { action, delay });
    } catch (error) {
      console.error('Error controlling system:', error);
      throw error;
    }
  };

  const killProcess = async (pid: number): Promise<string> => {
    try {
      return await invoke('kill_process', { pid });
    } catch (error) {
      console.error('Error killing process:', error);
      throw error;
    }
  };

  const getSystemServices = async (): Promise<ServiceInfo[]> => {
    try {
      return await invoke('get_system_services');
    } catch (error) {
      console.error('Error getting system services:', error);
      return [];
    }
  };

  const controlService = async (serviceName: string, action: string): Promise<string> => {
    try {
      return await invoke('control_service', { serviceName, action });
    } catch (error) {
      console.error('Error controlling service:', error);
      throw error;
    }
  };

  const getUserInfo = async (): Promise<UserInfo[]> => {
    try {
      return await invoke('get_user_info');
    } catch (error) {
      console.error('Error getting user info:', error);
      return [];
    }
  };

  const getSystemLogs = async (limit?: number): Promise<string[]> => {
    try {
      return await invoke('get_system_logs', { limit });
    } catch (error) {
      console.error('Error getting system logs:', error);
      return [];
    }
  };

  // ==================== Control Module ====================
  
  const snapWindow = async (direction: string): Promise<string> => {
    try {
      return await invoke('snap_window', { direction });
    } catch (error) {
      console.error('Error snapping window:', error);
      throw error;
    }
  };

  const moveToMonitor = async (monitorIndex: number): Promise<string> => {
    try {
      return await invoke('move_to_monitor', { monitorIndex });
    } catch (error) {
      console.error('Error moving to monitor:', error);
      throw error;
    }
  };

  const getOpenWindows = async (): Promise<WindowInfo[]> => {
    try {
      return await invoke('get_open_windows');
    } catch (error) {
      console.error('Error getting open windows:', error);
      return [];
    }
  };

  const getActiveWindowInfo = async (): Promise<WindowInfo> => {
    try {
      return await invoke('get_active_window_info');
    } catch (error) {
      console.error('Error getting active window info:', error);
      throw error;
    }
  };

  const simulateKeyPress = async (key: string, modifiers?: string[]): Promise<string> => {
    try {
      return await invoke('simulate_key_press', { key, modifiers });
    } catch (error) {
      console.error('Error simulating key press:', error);
      throw error;
    }
  };

  const typeText = async (text: string, delayMs?: number): Promise<string> => {
    try {
      return await invoke('type_text', { text, delayMs });
    } catch (error) {
      console.error('Error typing text:', error);
      throw error;
    }
  };

  const simulateMouseClick = async (button?: string, double?: boolean): Promise<string> => {
    try {
      return await invoke('simulate_mouse_click', { button, double });
    } catch (error) {
      console.error('Error simulating mouse click:', error);
      throw error;
    }
  };

  const moveMouse = async (x: number, y: number): Promise<string> => {
    try {
      return await invoke('move_mouse', { x, y });
    } catch (error) {
      console.error('Error moving mouse:', error);
      throw error;
    }
  };

  const getMousePosition = async (): Promise<[number, number]> => {
    try {
      return await invoke('get_mouse_position');
    } catch (error) {
      console.error('Error getting mouse position:', error);
      throw error;
    }
  };

  const simulateDragAndDrop = async (fromX: number, fromY: number, toX: number, toY: number): Promise<string> => {
    try {
      return await invoke('simulate_drag_and_drop', { fromX, fromY, toX, toY });
    } catch (error) {
      console.error('Error simulating drag and drop:', error);
      throw error;
    }
  };

  const getScreens = async (): Promise<ScreenInfo[]> => {
    try {
      return await invoke('get_screens');
    } catch (error) {
      console.error('Error getting screens:', error);
      return [];
    }
  };

  const getClipboardText = async (): Promise<string> => {
    try {
      return await invoke('get_clipboard_text');
    } catch (error) {
      console.error('Error getting clipboard text:', error);
      throw error;
    }
  };

  const setClipboardText = async (text: string): Promise<string> => {
    try {
      return await invoke('set_clipboard_text', { text });
    } catch (error) {
      console.error('Error setting clipboard text:', error);
      throw error;
    }
  };

  // ==================== Utils Module ====================
  
  const calculate = async (expression: string): Promise<CalculationResult> => {
    try {
      return await invoke('calculate', { expression });
    } catch (error) {
      console.error('Error calculating:', error);
      throw error;
    }
  };

  const convertUnits = async (value: number, fromUnit: string, toUnit: string, category: string): Promise<UnitConversion> => {
    try {
      return await invoke('convert_units', { value, fromUnit, toUnit, category });
    } catch (error) {
      console.error('Error converting units:', error);
      throw error;
    }
  };

  const generatePassword = async (
    length?: number,
    includeUppercase?: boolean,
    includeLowercase?: boolean,
    includeNumbers?: boolean,
    includeSymbols?: boolean
  ): Promise<string> => {
    try {
      return await invoke('generate_password', {
        length,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
      });
    } catch (error) {
      console.error('Error generating password:', error);
      throw error;
    }
  };

  const checkPasswordStrength = async (password: string): Promise<PasswordStrength> => {
    try {
      return await invoke('check_password_strength', { password });
    } catch (error) {
      console.error('Error checking password strength:', error);
      throw error;
    }
  };

  const generateUuid = async (): Promise<string> => {
    try {
      return await invoke('generate_uuid');
    } catch (error) {
      console.error('Error generating UUID:', error);
      throw error;
    }
  };

  const generateQr = async (data: string, size?: number): Promise<string> => {
    try {
      return await invoke('generate_qr', { data, size });
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  const calculateTextHash = async (text: string, algorithm: string): Promise<string> => {
    try {
      return await invoke('calculate_hash', { text, algorithm });
    } catch (error) {
      console.error('Error calculating text hash:', error);
      throw error;
    }
  };

  const base64Encode = async (text: string): Promise<string> => {
    try {
      return await invoke('base64_encode', { text });
    } catch (error) {
      console.error('Error encoding base64:', error);
      throw error;
    }
  };

  const base64Decode = async (text: string): Promise<string> => {
    try {
      return await invoke('base64_decode', { text });
    } catch (error) {
      console.error('Error decoding base64:', error);
      throw error;
    }
  };

  const formatJson = async (json: string, pretty?: boolean): Promise<string> => {
    try {
      return await invoke('format_json', { json, pretty });
    } catch (error) {
      console.error('Error formatting JSON:', error);
      throw error;
    }
  };

  const getIpInfo = async (): Promise<LocationInfo> => {
    try {
      return await invoke('get_ip_info');
    } catch (error) {
      console.error('Error getting IP info:', error);
      throw error;
    }
  };

  const getMacAddresses = async (): Promise<string[]> => {
    try {
      return await invoke('get_mac_addresses');
    } catch (error) {
      console.error('Error getting MAC addresses:', error);
      return [];
    }
  };

  const getWorldTime = async (timezone?: string): Promise<any> => {
    try {
      return await invoke('get_world_time', { timezone });
    } catch (error) {
      console.error('Error getting world time:', error);
      throw error;
    }
  };

  const dateDifference = async (date1: string, date2: string, unit: string): Promise<number> => {
    try {
      return await invoke('date_difference', { date1, date2, unit });
    } catch (error) {
      console.error('Error calculating date difference:', error);
      throw error;
    }
  };

  const rollDice = async (sides?: number, count?: number): Promise<number[]> => {
    try {
      return await invoke('roll_dice', { sides, count });
    } catch (error) {
      console.error('Error rolling dice:', error);
      throw error;
    }
  };

  const flipCoin = async (): Promise<string> => {
    try {
      return await invoke('flip_coin');
    } catch (error) {
      console.error('Error flipping coin:', error);
      throw error;
    }
  };

  const randomNumber = async (min: number, max: number): Promise<number> => {
    try {
      return await invoke('random_number', { min, max });
    } catch (error) {
      console.error('Error generating random number:', error);
      throw error;
    }
  };

  const validateEmail = async (email: string): Promise<boolean> => {
    try {
      return await invoke('validate_email', { email });
    } catch (error) {
      console.error('Error validating email:', error);
      return false;
    }
  };

  const validatePhone = async (phone: string): Promise<boolean> => {
    try {
      return await invoke('validate_phone', { phone });
    } catch (error) {
      console.error('Error validating phone:', error);
      return false;
    }
  };

  const formatPhone = async (phone: string, format?: string): Promise<string> => {
    try {
      return await invoke('format_phone', { phone, format });
    } catch (error) {
      console.error('Error formatting phone:', error);
      throw error;
    }
  };

  // ==================== Network Module ====================
  
  const getNetworkInterfaces = async (): Promise<NetworkInterface[]> => {
    try {
      return await invoke('get_network_interfaces');
    } catch (error) {
      console.error('Error getting network interfaces:', error);
      return [];
    }
  };

  const pingHost = async (host: string, count?: number): Promise<PingResult[]> => {
    try {
      return await invoke('ping_host', { host, count });
    } catch (error) {
      console.error('Error pinging host:', error);
      throw error;
    }
  };

  const dnsLookup = async (domain: string, recordType?: string): Promise<DnsRecord[]> => {
    try {
      return await invoke('dns_lookup', { domain, recordType });
    } catch (error) {
      console.error('Error performing DNS lookup:', error);
      return [];
    }
  };

  const portScan = async (host: string, ports?: number[], timeoutMs?: number): Promise<PortInfo[]> => {
    try {
      return await invoke('port_scan', { host, ports, timeoutMs });
    } catch (error) {
      console.error('Error scanning ports:', error);
      return [];
    }
  };

  const whoisLookup = async (domain: string): Promise<WhoisInfo> => {
    try {
      return await invoke('whois_lookup', { domain });
    } catch (error) {
      console.error('Error performing WHOIS lookup:', error);
      throw error;
    }
  };

  const getPublicIp = async (): Promise<string> => {
    try {
      return await invoke('get_public_ip');
    } catch (error) {
      console.error('Error getting public IP:', error);
      throw error;
    }
  };

  const getLocalIp = async (): Promise<string> => {
    try {
      return await invoke('get_local_ip');
    } catch (error) {
      console.error('Error getting local IP:', error);
      throw error;
    }
  };

  const getDefaultGateway = async (): Promise<string> => {
    try {
      return await invoke('get_default_gateway');
    } catch (error) {
      console.error('Error getting default gateway:', error);
      throw error;
    }
  };

  const getDnsServers = async (): Promise<string[]> => {
    try {
      return await invoke('get_dns_servers');
    } catch (error) {
      console.error('Error getting DNS servers:', error);
      return [];
    }
  };

  const getHostname = async (): Promise<string> => {
    try {
      return await invoke('get_hostname');
    } catch (error) {
      console.error('Error getting hostname:', error);
      throw error;
    }
  };

  const traceRoute = async (host: string, maxHops?: number): Promise<PingResult[]> => {
    try {
      return await invoke('trace_route', { host, maxHops });
    } catch (error) {
      console.error('Error tracing route:', error);
      return [];
    }
  };

  const speedTest = async (): Promise<BandwidthInfo> => {
    try {
      return await invoke('speed_test');
    } catch (error) {
      console.error('Error running speed test:', error);
      throw error;
    }
  };

  const getNetworkStats = async (): Promise<NetworkStats> => {
    try {
      return await invoke('get_network_stats');
    } catch (error) {
      console.error('Error getting network stats:', error);
      throw error;
    }
  };

  const checkWebsiteStatus = async (url: string): Promise<[number, string]> => {
    try {
      return await invoke('check_website_status', { url });
    } catch (error) {
      console.error('Error checking website status:', error);
      throw error;
    }
  };

  const getSslCertificateInfo = async (domain: string): Promise<Record<string, string>> => {
    try {
      return await invoke('get_ssl_certificate_info', { domain });
    } catch (error) {
      console.error('Error getting SSL certificate info:', error);
      return {};
    }
  };

  // ==================== Install Module ====================
  
  const detectPackageManagers = async (): Promise<PackageManager[]> => {
    try {
      return await invoke('detect_package_managers');
    } catch (error) {
      console.error('Error detecting package managers:', error);
      return [];
    }
  };

  const installPackage = async (manager: string, packageName: string): Promise<InstallResult> => {
    try {
      return await invoke('install_package', { manager, package: packageName });
    } catch (error) {
      console.error('Error installing package:', error);
      throw error;
    }
  };

  const uninstallPackage = async (manager: string, packageName: string): Promise<InstallResult> => {
    try {
      return await invoke('uninstall_package', { manager, package: packageName });
    } catch (error) {
      console.error('Error uninstalling package:', error);
      throw error;
    }
  };

  const searchPackages = async (manager: string, query: string): Promise<PackageInfo[]> => {
    try {
      return await invoke('search_packages', { manager, query });
    } catch (error) {
      console.error('Error searching packages:', error);
      return [];
    }
  };

  const listInstalledPackages = async (manager: string): Promise<PackageInfo[]> => {
    try {
      return await invoke('list_installed_packages', { manager });
    } catch (error) {
      console.error('Error listing installed packages:', error);
      return [];
    }
  };

  const updatePackages = async (manager: string): Promise<InstallResult> => {
    try {
      return await invoke('update_packages', { manager });
    } catch (error) {
      console.error('Error updating packages:', error);
      throw error;
    }
  };

  const upgradeAll = async (manager: string): Promise<InstallResult> => {
    try {
      return await invoke('upgrade_all', { manager });
    } catch (error) {
      console.error('Error upgrading all packages:', error);
      throw error;
    }
  };

  const getPackageInfo = async (manager: string, packageName: string): Promise<PackageInfo> => {
    try {
      return await invoke('get_package_info', { manager, package: packageName });
    } catch (error) {
      console.error('Error getting package info:', error);
      throw error;
    }
  };

  // ==================== Media Module ====================
  
  const getAudioDevices = async (): Promise<AudioDevice[]> => {
    try {
      return await invoke('get_audio_devices');
    } catch (error) {
      console.error('Error getting audio devices:', error);
      return [];
    }
  };

  const setVolume = async (volume: number, deviceId?: string): Promise<VolumeControl> => {
    try {
      return await invoke('set_volume', { deviceId, volume });
    } catch (error) {
      console.error('Error setting volume:', error);
      throw error;
    }
  };

  const toggleMute = async (deviceId?: string): Promise<boolean> => {
    try {
      return await invoke('toggle_mute', { deviceId });
    } catch (error) {
      console.error('Error toggling mute:', error);
      return false;
    }
  };

  const getVolume = async (): Promise<VolumeControl> => {
    try {
      return await invoke('get_volume');
    } catch (error) {
      console.error('Error getting volume:', error);
      throw error;
    }
  };

  const playSound = async (frequency?: number, durationMs?: number): Promise<string> => {
    try {
      return await invoke('play_sound', { frequency, durationMs });
    } catch (error) {
      console.error('Error playing sound:', error);
      throw error;
    }
  };

  const getDisplays = async (): Promise<DisplayInfo[]> => {
    try {
      return await invoke('get_displays');
    } catch (error) {
      console.error('Error getting displays:', error);
      return [];
    }
  };

  const setBrightness = async (brightness: number, displayId?: number): Promise<number> => {
    try {
      return await invoke('set_brightness', { displayId, brightness });
    } catch (error) {
      console.error('Error setting brightness:', error);
      throw error;
    }
  };

  const takeScreenshot = async (displayId?: number, path?: string): Promise<ScreenshotResult> => {
    try {
      return await invoke('take_screenshot', { displayId, path });
    } catch (error) {
      console.error('Error taking screenshot:', error);
      throw error;
    }
  };

  const getMediaInfo = async (path: string): Promise<MediaFile> => {
    try {
      return await invoke('get_media_info', { path });
    } catch (error) {
      console.error('Error getting media info:', error);
      throw error;
    }
  };

  const setWallpaper = async (path: string): Promise<string> => {
    try {
      return await invoke('set_wallpaper', { path });
    } catch (error) {
      console.error('Error setting wallpaper:', error);
      throw error;
    }
  };

  const listMediaDevices = async (): Promise<string[]> => {
    try {
      return await invoke('list_media_devices');
    } catch (error) {
      console.error('Error listing media devices:', error);
      return [];
    }
  };

  const screenRecord = async (durationSecs?: number, displayId?: number, output?: string): Promise<string> => {
    try {
      return await invoke('screen_record', { displayId, durationSecs, output });
    } catch (error) {
      console.error('Error recording screen:', error);
      throw error;
    }
  };

  const getBatteryInfo = async (): Promise<Record<string, string>> => {
    try {
      return await invoke('get_battery_info');
    } catch (error) {
      console.error('Error getting battery info:', error);
      return {};
    }
  };

  // ==================== Web Commands (Existing) ====================
  
  const searchWeb = async (query: string): Promise<SearchResult[]> => {
    try {
      return await invoke('search_web', { query });
    } catch (error) {
      console.error('Error searching web:', error);
      throw error;
    }
  };

  const getWebpagePreview = async (url: string): Promise<string> => {
    try {
      return await invoke('get_webpage_preview', { url });
    } catch (error) {
      console.error('Error getting webpage preview:', error);
      throw error;
    }
  };

  // ==================== Return Object ====================
  
  return {
    // Apps Module
    openApplication,
    getAvailableApps,
    checkIfAppInstalled,
    openTerminal,
    openTaskManager,
    openCalculator,
    openFileManager,
    openSettings,
    
    // Files Module (Enhanced)
    searchFiles,
    getFileInfo,
    openFileLocation,
    createFile,
    createFolder,
    deleteFile,
    copyFile,
    moveFile,
    renameFile,
    compressFiles,
    extractArchive,
    calculateFileHash,
    openWith,
    getDiskUsage,
    
    // System Module (Enhanced)
    getSystemInfo,
    controlSystem,
    killProcess,
    getSystemServices,
    controlService,
    getUserInfo,
    getSystemLogs,
    
    // Control Module
    snapWindow,
    moveToMonitor,
    getOpenWindows,
    getActiveWindowInfo,
    simulateKeyPress,
    typeText,
    simulateMouseClick,
    moveMouse,
    getMousePosition,
    simulateDragAndDrop,
    getScreens,
    getClipboardText,
    setClipboardText,
    
    // Utils Module
    calculate,
    convertUnits,
    generatePassword,
    checkPasswordStrength,
    generateUuid,
    generateQr,
    calculateTextHash,
    base64Encode,
    base64Decode,
    formatJson,
    getIpInfo,
    getMacAddresses,
    getWorldTime,
    dateDifference,
    rollDice,
    flipCoin,
    randomNumber,
    validateEmail,
    validatePhone,
    formatPhone,
    
    // Network Module
    getNetworkInterfaces,
    pingHost,
    dnsLookup,
    portScan,
    whoisLookup,
    getPublicIp,
    getLocalIp,
    getDefaultGateway,
    getDnsServers,
    getHostname,
    traceRoute,
    speedTest,
    getNetworkStats,
    checkWebsiteStatus,
    getSslCertificateInfo,
    
    // Install Module
    detectPackageManagers,
    installPackage,
    uninstallPackage,
    searchPackages,
    listInstalledPackages,
    updatePackages,
    upgradeAll,
    getPackageInfo,
    
    // Media Module
    getAudioDevices,
    setVolume,
    toggleMute,
    getVolume,
    playSound,
    getDisplays,
    setBrightness,
    takeScreenshot,
    getMediaInfo,
    setWallpaper,
    listMediaDevices,
    screenRecord,
    getBatteryInfo,
    
    // Web commands (existing)
    searchWeb,
    getWebpagePreview,
  };
}