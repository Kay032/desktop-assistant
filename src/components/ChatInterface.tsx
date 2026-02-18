import React, { useState, useRef, useEffect } from 'react';
import { useCommands } from '../hooks/useCommands';
import { CommandsList } from './CommandsList';
import { open } from '@tauri-apps/api/shell';
import { appWindow } from '@tauri-apps/api/window'

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'files' | 'search' | 'system' | 'weather' | 'calculator' | 'notes' | 'web_search' | 'website' | 'app' | 'install';
  data?: any;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [timers] = useState<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [showCommands, setShowCommands] = useState(false);
  const [showControls, setShowControls] = useState(false); // Only for minimize/close
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [autoHideTimer, setAutoHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const commands = useCommands();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle hover on the TOP AREA ONLY to show minimize/close buttons
  const handleTopBarMouseEnter = () => {
    setShowControls(true);
  };

  const handleTopBarMouseLeave = () => {
    setShowControls(false);
  };

  // Auto-hide messages after 1 minute unless user is hovering
  useEffect(() => {
    if (messages.length > 0 && !showCommands) {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
      
      const timer = setTimeout(() => {
        if (!hoverTimeout) {
          setMessages([]);
        }
      }, 60000);
      
      setAutoHideTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [messages, hoverTimeout, showCommands]);

  const handleResultsMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleResultsMouseLeave = () => {
    if (messages.length > 0 && !showCommands) {
      const timeout = setTimeout(() => {
        setMessages([]);
        setHoverTimeout(null);
      }, 2000);
      setHoverTimeout(timeout);
    }
  };

  const handleDismiss = () => {
    setMessages([]);
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
      setAutoHideTimer(null);
    }
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleMinimize = () => {
    appWindow.minimize();
  };

  const handleClose = () => {
    appWindow.close();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Website mapping
  const websiteMap: Record<string, string> = {
    'youtube': 'https://youtube.com',
    'google': 'https://google.com',
    'github': 'https://github.com',
    'reddit': 'https://reddit.com',
    'twitter': 'https://twitter.com',
    'facebook': 'https://facebook.com',
    'instagram': 'https://instagram.com',
    'linkedin': 'https://linkedin.com',
    'amazon': 'https://amazon.com',
    'wikipedia': 'https://wikipedia.org',
    'netflix': 'https://netflix.com',
    'spotify': 'https://open.spotify.com',
    'twitch': 'https://twitch.tv',
    'discord': 'https://discord.com',
    'whatsapp': 'https://web.whatsapp.com',
    'telegram': 'https://web.telegram.org',
    'zoom': 'https://zoom.us',
    'slack': 'https://slack.com',
  };

  // Application mapping
  const appMap: Record<string, string[]> = {
    'chrome': ['google-chrome', 'chrome', 'chromium-browser'],
    'firefox': ['firefox', 'firefox-bin'],
    'brave': ['brave-browser', 'brave'],
    'edge': ['microsoft-edge', 'edge'],
    'opera': ['opera'],
    'code': ['code', 'vscode'],
    'vscode': ['code'],
    'sublime': ['subl', 'sublime_text'],
    'atom': ['atom'],
    'terminal': ['gnome-terminal', 'konsole', 'xterm', 'alacritty', 'kitty'],
    'calculator': ['gnome-calculator', 'kcalc', 'qalculate-gtk', 'calc'],
    'files': ['nautilus', 'dolphin', 'thunar', 'pcmanfm', 'caja'],
    'settings': ['gnome-control-center', 'systemsettings', 'xfce4-settings-manager'],
    'spotify': ['spotify'],
    'slack': ['slack'],
    'discord': ['discord'],
    'zoom': ['zoom'],
    'teams': ['teams', 'teams-for-linux'],
    'libreoffice': ['libreoffice'],
    'gimp': ['gimp'],
    'inkscape': ['inkscape'],
    'blender': ['blender'],
    'vlc': ['vlc'],
    'rhythmbox': ['rhythmbox'],
    'shotwell': ['shotwell'],
    'kdenlive': ['kdenlive'],
    'obs': ['obs'],
    'steam': ['steam'],
    'lutris': ['lutris'],
    'heroic': ['heroic'],
  };

  // Package information for installation
  const packageInfo: Record<string, { deb?: string, snap?: string, flatpak?: string, apt?: string }> = {
    'chrome': {
      deb: 'https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb',
      apt: 'wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add - && sudo sh -c \'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list\' && sudo apt update && sudo apt install google-chrome-stable'
    },
    'firefox': {
      apt: 'sudo apt install firefox',
      snap: 'sudo snap install firefox',
      flatpak: 'flatpak install flathub org.mozilla.firefox'
    },
    'brave': {
      apt: 'sudo apt install apt-transport-https curl && sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg && echo "deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg arch=amd64] https://brave-browser-apt-release.s3.brave.com/ stable main" | sudo tee /etc/apt/sources.list.d/brave-browser-release.list && sudo apt update && sudo apt install brave-browser'
    },
    'code': {
      deb: 'https://code.visualstudio.com/sha/download?build=stable&os=linux-deb-x64',
      apt: 'wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg && sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/ && sudo sh -c \'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list\' && sudo apt update && sudo apt install code'
    },
    'vlc': {
      apt: 'sudo apt install vlc',
      snap: 'sudo snap install vlc',
      flatpak: 'flatpak install flathub org.videolan.VLC'
    },
    'gimp': {
      apt: 'sudo apt install gimp',
      snap: 'sudo snap install gimp',
      flatpak: 'flatpak install flathub org.gimp.GIMP'
    },
    'spotify': {
      apt: 'curl -sS https://download.spotify.com/debian/pubkey_6224F9941A8AA6D1.gpg | sudo gpg --dearmor --yes -o /etc/apt/trusted.gpg.d/spotify.gpg && echo "deb http://repository.spotify.com stable non-free" | sudo tee /etc/apt/sources.list.d/spotify.list && sudo apt update && sudo apt install spotify-client',
      snap: 'sudo snap install spotify'
    },
    'discord': {
      deb: 'https://discord.com/api/download?platform=linux&format=deb',
      snap: 'sudo snap install discord'
    },
    'slack': {
      deb: 'https://downloads.slack-edge.com/releases/linux/4.35.126/prod/x64/slack-desktop-4.35.126-amd64.deb',
      snap: 'sudo snap install slack'
    },
    'zoom': {
      deb: 'https://zoom.us/client/latest/zoom_amd64.deb'
    },
    'steam': {
      deb: 'https://cdn.cloudflare.steamstatic.com/client/installer/steam.deb',
      apt: 'sudo apt install steam'
    },
    'obs': {
      apt: 'sudo apt install obs-studio',
      snap: 'sudo snap install obs-studio'
    },
    'kdenlive': {
      apt: 'sudo apt install kdenlive',
      snap: 'sudo snap install kdenlive'
    },
  };

  // Check if input is a website
  const isWebsite = (input: string): { isSite: boolean; url: string } => {
    const lower = input.toLowerCase().trim();
    
    if (input.match(/^https?:\/\//) || input.match(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/|$)/)) {
      let url = input;
      if (!url.startsWith('http')) url = 'https://' + url;
      return { isSite: true, url };
    }
    
    for (const [name, url] of Object.entries(websiteMap)) {
      if (lower === name || lower === `open ${name}` || lower === `go to ${name}` || lower === `launch ${name}`) {
        return { isSite: true, url };
      }
    }
    
    return { isSite: false, url: '' };
  };

  // Check if input is an application
  const isApplication = (input: string): { isApp: boolean; appName: string } => {
    const lower = input.toLowerCase().trim();
    
    let appName = lower.replace(/^(open|launch|start|run)\s+/, '');
    
    if (appMap[appName] || appMap[lower]) {
      return { isApp: true, appName: appName };
    }
    
    for (const [name] of Object.entries(appMap)) {
      if (lower.includes(name) && lower.length < name.length + 10) {
        return { isApp: true, appName: name };
      }
    }
    
    return { isApp: false, appName: '' };
  };

  // Check if input is asking to install something
  const isInstallRequest = (input: string): { isInstall: boolean; packageName: string } => {
    const lower = input.toLowerCase().trim();
    
    const installPatterns = ['install', 'get', 'download', 'setup'];
    for (const pattern of installPatterns) {
      if (lower.startsWith(pattern)) {
        const pkg = lower.replace(pattern, '').trim();
        if (pkg && pkg.length < 30) {
          return { isInstall: true, packageName: pkg };
        }
      }
    }
    
    return { isInstall: false, packageName: '' };
  };

  // Open website
  const openWebsite = async (url: string) => {
    try {
      await open(url);
      return `✅ Opened ${url}`;
    } catch (error) {
      return `❌ Failed to open: ${error}`;
    }
  };

  // Get installation instructions
  const getInstallInstructions = (packageName: string): string => {
    const pkg = packageInfo[packageName];
    
    if (!pkg) {
      return `📦 To install ${packageName}, try:\n• Ubuntu/Debian: \`sudo apt install ${packageName}\`\n• Snap: \`sudo snap install ${packageName}\`\n• Flatpak: \`flatpak install ${packageName}\``;
    }
    
    let response = `📦 **Installation instructions for ${packageName}:**\n\n`;
    
    if (pkg.apt) {
      response += `**APT:**\n\`${pkg.apt}\`\n\n`;
    }
    if (pkg.snap) {
      response += `**Snap:**\n\`${pkg.snap}\`\n\n`;
    }
    if (pkg.flatpak) {
      response += `**Flatpak:**\n\`${pkg.flatpak}\`\n\n`;
    }
    if (pkg.deb) {
      response += `**Direct .deb:**\n${pkg.deb}\n`;
    }
    
    return response;
  };

  // Web search
  const performWebSearch = async (query: string): Promise<string> => {
    try {
      const results = await commands.searchWeb(query);
      
      if (results.length > 0) {
        let response = `**Web Results for: "${query}"**\n\n`;
        results.slice(0, 5).forEach((r, i) => {
          response += `**${i + 1}. ${r.title}**\n`;
          response += `${r.description}\n`;
          response += `🔗 ${r.url}\n\n`;
        });
        return response;
      }
      return `No results found for "${query}"`;
    } catch (error) {
      return `Search failed: ${error}`;
    }
  };

  const processCommand = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    setMessages([]);
    setShowCommands(false);
    
    setIsProcessing(true);
    
    try {
      let response = '';
      let messageType: Message['type'] = 'text';
      
      const lowerText = text.toLowerCase().trim();
      const originalText = text;

      const website = isWebsite(originalText);
      if (website.isSite) {
        response = await openWebsite(website.url);
        messageType = 'website';
      }
      
      else {
        const install = isInstallRequest(lowerText);
        if (install.isInstall) {
          response = getInstallInstructions(install.packageName);
          messageType = 'install';
        }
        
        else {
          const app = isApplication(lowerText);
          if (app.isApp) {
            try {
              response = await commands.openApplication(app.appName);
              messageType = 'app';
              
              if (response.includes('❌') || response.includes('Could not open')) {
                const installInfo = getInstallInstructions(app.appName);
                response += '\n\n' + installInfo;
                messageType = 'install';
              }
            } catch (error) {
              response = `❌ Failed to open ${app.appName}. ` + getInstallInstructions(app.appName);
              messageType = 'install';
            }
          }
          
          else if (lowerText.startsWith('google ') || lowerText.startsWith('search for ') || lowerText.startsWith('search ')) {
            let query = '';
            if (lowerText.startsWith('google ')) {
              query = text.substring(7).trim();
            } else if (lowerText.startsWith('search for ')) {
              query = text.substring(11).trim();
            } else {
              query = text.substring(7).trim();
            }
            
            response = await performWebSearch(query);
            messageType = 'web_search';
          }
          
          else if (lowerText.startsWith('preview ')) {
            const url = text.substring(8).trim();
            const fullUrl = url.startsWith('http') ? url : 'https://' + url;
            try {
              response = await commands.getWebpagePreview(fullUrl);
            } catch (error) {
              response = await performWebSearch(url);
              messageType = 'web_search';
            }
          }
          
          else if (lowerText === 'my ip' || lowerText === 'what is my ip' || lowerText === 'ip address') {
            response = await performWebSearch("what is my ip address");
            messageType = 'web_search';
          }
          
          else if (lowerText.startsWith('search for ') || lowerText.startsWith('find ')) {
            let query = '';
            if (lowerText.startsWith('search for ')) {
              query = text.substring(11).trim();
            } else {
              query = text.substring(5).trim();
            }
            
            try {
              const files = await commands.searchFiles(query);
              
              if (files.length > 0) {
                response = `📁 **Found ${files.length} files:**\n\n`;
                files.slice(0, 5).forEach((f) => {
                  const icon = f.is_directory ? '📂' : '📄';
                  response += `${icon} **${f.name}**\n`;
                  response += `   📍 ${f.path}\n`;
                  if (!f.is_directory) {
                    response += `   📦 ${formatFileSize(f.size)}  🕒 ${f.modified}\n`;
                  }
                  response += '\n';
                });
                if (files.length > 5) {
                  response += `... and ${files.length - 5} more files`;
                }
                messageType = 'files';
              } else {
                response = `🔍 No files found matching "${query}". ` + await performWebSearch(`how to find files named ${query} on linux`);
                messageType = 'web_search';
              }
            } catch (error) {
              response = `❌ File search failed. ` + await performWebSearch(`how to search for files on linux`);
              messageType = 'web_search';
            }
          }
          
          else if (lowerText.includes('recent files') || lowerText.includes('latest files')) {
            try {
              const files = await commands.searchFiles('', '~');
              const recent = files.sort((a, b) => b.modified.localeCompare(a.modified)).slice(0, 5);
              
              if (recent.length > 0) {
                response = `🕒 **Recently Modified Files:**\n\n`;
                recent.forEach((f, i) => {
                  response += `${i+1}. **${f.name}**\n`;
                  response += `   🕒 ${f.modified}\n`;
                });
              } else {
                response = "No recent files found.";
              }
            } catch (error) {
              response = await performWebSearch("how to find recent files on linux");
              messageType = 'web_search';
            }
          }
          
          else if (lowerText.startsWith('open downloads')) {
            try {
              response = await commands.openFileLocation('~/Downloads');
            } catch (error) {
              response = await performWebSearch("how to open downloads folder on linux");
              messageType = 'web_search';
            }
          }
          else if (lowerText.startsWith('open desktop')) {
            try {
              response = await commands.openFileLocation('~/Desktop');
            } catch (error) {
              response = await performWebSearch("how to open desktop folder on linux");
              messageType = 'web_search';
            }
          }
          else if (lowerText.startsWith('open documents')) {
            try {
              response = await commands.openFileLocation('~/Documents');
            } catch (error) {
              response = await performWebSearch("how to open documents folder on linux");
              messageType = 'web_search';
            }
          }
          else if (lowerText.startsWith('open file ')) {
            const path = text.substring(10).trim();
            try {
              response = await commands.openFileLocation(path);
            } catch (error) {
              response = await performWebSearch(`how to open file ${path} on linux`);
              messageType = 'web_search';
            }
          }
          
          else if (lowerText.includes('system info') || lowerText.includes('system information') || lowerText === 'status') {
            try {
              const info = await commands.getSystemInfo();
              
              response = `💻 **System Information**\n\n` +
                `**OS:** ${info.os} (${info.kernel})\n` +
                `**CPU:** ${info.cpu_usage.toFixed(1)}% (${info.cpu_cores} cores)\n` +
                `**Memory:** ${(info.memory_used / 1024 / 1024 / 1024).toFixed(1)}GB / ${(info.memory_total / 1024 / 1024 / 1024).toFixed(1)}GB\n` +
                `**Uptime:** ${formatUptime(info.uptime)}`;
              messageType = 'system';
            } catch (error) {
              response = await performWebSearch("how to check system information on linux");
              messageType = 'web_search';
            }
          }
          
          else if (lowerText === 'cpu' || lowerText === 'cpu usage') {
            try {
              const info = await commands.getSystemInfo();
              response = `**CPU Usage:** ${info.cpu_usage.toFixed(1)}% (${info.cpu_cores} cores)`;
            } catch (error) {
              response = await performWebSearch("how to check cpu usage on linux");
              messageType = 'web_search';
            }
          }
          
          else if (lowerText === 'memory' || lowerText === 'ram') {
            try {
              const info = await commands.getSystemInfo();
              const usedGB = (info.memory_used / 1024 / 1024 / 1024).toFixed(1);
              const totalGB = (info.memory_total / 1024 / 1024 / 1024).toFixed(1);
              response = `**Memory:** ${usedGB}GB / ${totalGB}GB (${info.memory_percent.toFixed(1)}%)`;
            } catch (error) {
              response = await performWebSearch("how to check memory usage on linux");
              messageType = 'web_search';
            }
          }
          
          else if (lowerText.includes('disk') || lowerText.includes('storage')) {
            try {
              const info = await commands.getSystemInfo();
              response = `💾 **Disk Space**\n\n`;
              info.disks.forEach(disk => {
                const freeGB = (disk.available_space / 1024 / 1024 / 1024).toFixed(1);
                const totalGB = (disk.total_space / 1024 / 1024 / 1024).toFixed(1);
                response += `**${disk.name}** (${disk.mount_point}): ${freeGB}GB free / ${totalGB}GB total\n`;
              });
            } catch (error) {
              response = await performWebSearch("how to check disk space on linux");
              messageType = 'web_search';
            }
          }
          
          else if (lowerText === 'uptime') {
            try {
              const info = await commands.getSystemInfo();
              response = `⏱️ **System Uptime:** ${formatUptime(info.uptime)}`;
            } catch (error) {
              response = await performWebSearch("how to check system uptime on linux");
              messageType = 'web_search';
            }
          }
          
          else if (lowerText.includes('battery') || lowerText.includes('power')) {
            response = await performWebSearch("how to check battery status on linux");
            messageType = 'web_search';
          }
          
          else if (lowerText.includes('list processes') || lowerText.includes('running processes')) {
            try {
              const info = await commands.getSystemInfo();
              response = `📋 **Top Running Processes:**\n\n`;
              info.top_processes.slice(0, 5).forEach((p, i) => {
                response += `${i+1}. **${p.name}** (PID: ${p.pid})\n`;
                response += `   CPU: ${p.cpu_usage.toFixed(1)}% | RAM: ${(p.memory_usage / 1024 / 1024).toFixed(1)}MB\n`;
              });
            } catch (error) {
              response = await performWebSearch("how to list running processes on linux");
              messageType = 'web_search';
            }
          }
          
          else if (lowerText.startsWith('kill process ')) {
            const pidStr = text.substring(13).trim();
            const pid = parseInt(pidStr);
            if (!isNaN(pid)) {
              try {
                response = await commands.killProcess(pid);
              } catch (e) {
                response = `❌ Failed to kill process. ` + await performWebSearch(`how to kill process ${pid} on linux`);
                messageType = 'web_search';
              }
            } else {
              response = "Please provide a valid process ID (number)";
            }
          }
          
          else if (lowerText.includes('shutdown') || lowerText.includes('restart') || lowerText.includes('reboot') || lowerText.includes('sleep') || lowerText.includes('lock')) {
            let action = '';
            let delay = 0;
            
            const delayMatch = lowerText.match(/in (\d+) (second|minute|hour)/);
            if (delayMatch) {
              const num = parseInt(delayMatch[1]);
              const unit = delayMatch[2];
              if (unit === 'minute') delay = num * 60;
              else if (unit === 'hour') delay = num * 3600;
              else delay = num;
            }
            
            if (lowerText.includes('shutdown')) action = 'shutdown';
            else if (lowerText.includes('restart') || lowerText.includes('reboot')) action = 'restart';
            else if (lowerText.includes('sleep')) action = 'sleep';
            else if (lowerText.includes('lock')) action = 'lock';
            
            try {
              response = await commands.controlSystem(action, delay);
            } catch (error) {
              response = await performWebSearch(`how to ${action} linux from command line`);
              messageType = 'web_search';
            }
          }
          
          else if (lowerText.startsWith('calculate ') || lowerText.startsWith('calc ')) {
            let expression = '';
            if (lowerText.startsWith('calculate ')) {
              expression = text.substring(10).trim();
            } else {
              expression = text.substring(5).trim();
            }
            
            try {
              const result = new Function(`return (${expression})`)();
              response = `🧮 **${expression}**\n\n= ${result}`;
              messageType = 'calculator';
            } catch {
              response = await performWebSearch(originalText);
              messageType = 'web_search';
            }
          }
          
          else if (lowerText.match(/^[\d+\-*/().^ ]+$/)) {
            try {
              const result = new Function(`return (${text})`)();
              response = `🧮 **${text}** = ${result}`;
              messageType = 'calculator';
            } catch {
              response = await performWebSearch(originalText);
              messageType = 'web_search';
            }
          }
          
          else if (lowerText.startsWith('weather ')) {
            const location = text.substring(8).trim();
            response = await performWebSearch(`weather in ${location}`);
            messageType = 'web_search';
          }
          
          else if (lowerText.startsWith('remember ')) {
            const note = text.substring(9).trim();
            if (note) {
              setNotes(prev => [...prev, note]);
              response = `📝 **Note saved!**\n"${note}"`;
            } else {
              response = "What should I remember?";
            }
            messageType = 'notes';
          }
          
          else if (lowerText === 'show notes' || lowerText === 'notes' || lowerText === 'list notes') {
            if (notes.length > 0) {
              response = `📋 **Your Notes:**\n\n`;
              notes.slice(0, 5).forEach((note, i) => {
                response += `${i+1}. ${note}\n`;
              });
              if (notes.length > 5) {
                response += `... and ${notes.length - 5} more notes`;
              }
            } else {
              response = "No notes saved";
            }
            messageType = 'notes';
          }
          
          else if (lowerText === 'clear notes' || lowerText === 'delete all notes') {
            setNotes([]);
            response = "🗑️ All notes cleared!";
          }
          
          else if (lowerText.startsWith('timer ') || lowerText.startsWith('set timer ')) {
            let timerText = lowerText.startsWith('timer ') ? text.substring(6).trim() : text.substring(10).trim();
            const match = timerText.match(/(\d+)\s*(minute|minutes|min|mins)/);
            
            if (match) {
              const minutes = parseInt(match[1]);
              const message = timerText.replace(match[0], '').trim() || 'Timer finished!';
              setTimeout(() => {
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  text: `⏰ **Timer Alert!**\n${message}`,
                  sender: 'assistant',
                  timestamp: new Date(),
                }]);
              }, minutes * 60 * 1000);
              response = `⏰ **Timer set for ${minutes} minutes**`;
            } else {
              response = await performWebSearch("how to set a timer");
              messageType = 'web_search';
            }
          }
          
          else if (lowerText.startsWith('remind me in ')) {
            const match = lowerText.match(/remind me in (\d+)\s*(minute|minutes|min|mins)\s*(?:to|about)?\s*(.*)/);
            if (match) {
              const minutes = parseInt(match[1]);
              const reminder = match[3] || 'reminder';
              setTimeout(() => {
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  text: `⏰ **Reminder:** ${reminder}`,
                  sender: 'assistant',
                  timestamp: new Date(),
                }]);
              }, minutes * 60 * 1000);
              response = `⏰ **Reminder set for ${minutes} minutes**`;
            } else {
              response = await performWebSearch("how to set a reminder");
              messageType = 'web_search';
            }
          }
          
          else if (lowerText === 'stop timers' || lowerText === 'cancel timers') {
            timers.forEach((timeout, id) => {
              clearTimeout(timeout);
              timers.delete(id);
            });
            response = "⏹️ All timers cancelled!";
          }
          
          else if (lowerText === 'flip coin' || lowerText === 'coin flip') {
            const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
            response = `🪙 **Coin Flip:** ${result}`;
          }
          
          else if (lowerText === 'roll dice' || lowerText === 'roll d6') {
            const result = Math.floor(Math.random() * 6) + 1;
            response = `🎲 **You rolled:** ${result}`;
          }
          
          else if (lowerText === 'roll d20' || lowerText === 'd20') {
            const result = Math.floor(Math.random() * 20) + 1;
            response = `🎲 **You rolled:** ${result}`;
          }
          
          else if (lowerText.startsWith('password ') || lowerText.startsWith('generate password ')) {
            let lengthText = lowerText.replace('password ', '').replace('generate password ', '').trim();
            let length = parseInt(lengthText) || 12;
            if (length < 4) length = 4;
            if (length > 32) length = 32;
            
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
            let password = '';
            for (let i = 0; i < length; i++) {
              password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            response = `🔐 **Generated Password (${length} chars):**\n\`${password}\``;
          }
          
          else {
            response = await performWebSearch(originalText);
            messageType = 'web_search';
          }
        }
      }
      
      setMessages([{
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date(),
        type: messageType,
      }]);
      
    } catch (error) {
      console.error('Command error:', error);
      
      const fallbackResponse = await performWebSearch(text);
      
      setMessages([{
        id: (Date.now() + 1).toString(),
        text: fallbackResponse,
        sender: 'assistant',
        timestamp: new Date(),
        type: 'web_search',
      }]);
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isProcessing) {
      processCommand(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      setInputText('');
      setMessages([]);
      setShowCommands(false);
    }
  };

  const toggleCommands = () => {
    setShowCommands(!showCommands);
    if (!showCommands) {
      setMessages([]);
    }
  };

  return (
    <div className="flex items-start justify-center min-h-screen bg-transparent">
      {/* Main Container - Frosted Glass Effect with higher opacity */}
      <div 
        ref={containerRef}
        className="w-[820px] frosted-glass rounded-2xl overflow-hidden shadow-2xl mt-8"
      >
        {/* Top Bar - Only shows minimize/close on hover, NO title text */}
        <div 
          className="h-8 relative" /* Empty bar for hover area */
          onMouseEnter={handleTopBarMouseEnter}
          onMouseLeave={handleTopBarMouseLeave}
        >
          {/* Window Controls - Only visible on hover */}
          <div className={`absolute right-2 top-1 flex items-center space-x-2 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <button
              onClick={handleMinimize}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-gray-300"
              title="Minimize"
            >
              <span className="text-sm">−</span>
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
              title="Close"
            >
              <span className="text-sm">×</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center px-6 py-4 border-t border-white/5">
          <span className="text-xl text-gray-400 mr-4">🔍</span>
          <form onSubmit={handleSubmit} className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command..."
              className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-lg"
              disabled={isProcessing}
            />
          </form>
          {inputText && (
            <button
              onClick={() => setInputText('')}
              className="text-gray-400 hover:text-gray-300 mr-3"
            >
              ✕
            </button>
          )}
          <div className="ml-2">
            <button
              onClick={toggleCommands}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-300"
              title="Show all commands"
            >
              <span className="text-lg">📋</span>
            </button>
          </div>
        </div>

        {/* Results Area */}
        {(messages.length > 0 || showCommands) && (
          <div 
            ref={resultsRef}
            className="p-5 max-h-[400px] overflow-y-auto"
            onMouseEnter={handleResultsMouseEnter}
            onMouseLeave={handleResultsMouseLeave}
          >
            {showCommands ? (
              <CommandsList onClose={() => setShowCommands(false)} />
            ) : (
              <div className="relative">
                <button
                  onClick={handleDismiss}
                  className="absolute top-0 right-0 text-gray-400 hover:text-gray-300 bg-gray-800/50 rounded-full p-1.5 text-sm z-10"
                  title="Dismiss (auto-hides in 1 min)"
                >
                  ✕
                </button>
                
                {messages.map((message) => (
                  <div key={message.id} className="text-left pr-8">
                    {message.type && (
                      <div className="text-xs text-gray-400 mb-1">
                        {message.type === 'website' && '🌐 Website'}
                        {message.type === 'app' && '📱 Application'}
                        {message.type === 'install' && '📦 Installation'}
                        {message.type === 'web_search' && '🔍 Web Search'}
                        {message.type === 'files' && '📁 Files'}
                        {message.type === 'system' && '💻 System'}
                        {message.type === 'calculator' && '🧮 Calculator'}
                        {message.type === 'notes' && '📝 Notes'}
                        {message.type === 'weather' && '🌤️ Weather'}
                      </div>
                    )}
                    
                    <div className="inline-block max-w-[90%] rounded-2xl px-5 py-2.5 bg-gray-800/80 text-gray-200">
                      <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                      <p className="text-xs mt-1 opacity-60">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-2">
                      ⏱️ Auto-hides in 1 minute • Click ✕ to dismiss now
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading Indicator */}
        {isProcessing && !showCommands && (
          <div className="px-5 pb-5">
            <div className="bg-gray-800/80 rounded-2xl px-5 py-3 inline-block">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        {/* Quick Tips */}
        {messages.length === 0 && !isProcessing && !showCommands && !inputText && (
          <div className="px-5 pb-5 text-xs text-gray-500 flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full bg-white/5">youtube</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5">open chrome</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5">install vlc</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5">system info</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5">2+2</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5">weather London</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5">notes</span>
          </div>
        )}
      </div>
    </div>
  );
}