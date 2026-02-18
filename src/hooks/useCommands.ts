import { invoke } from '@tauri-apps/api/tauri';

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

export function useCommands() {
  const openApplication = async (appName: string): Promise<string> => {
    try {
      return await invoke('open_application', { appName });
    } catch (error) {
      console.error('Error opening application:', error);
      throw error;
    }
  };

  const getAvailableApps = async (): Promise<string[]> => {
    try {
      return await invoke('get_available_apps');
    } catch (error) {
      console.error('Error getting available apps:', error);
      return [];
    }
  };

  const searchFiles = async (query: string, path?: string): Promise<FileInfo[]> => {
    try {
      return await invoke('search_files', { query, path: path || null });
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

  return {
    openApplication,
    getAvailableApps,
    searchFiles,
    getFileInfo,
    openFileLocation,
    getSystemInfo,
    controlSystem,
    killProcess,
    searchWeb,
    getWebpagePreview,
  };
}