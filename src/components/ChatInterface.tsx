import React, { useState, useRef, useEffect } from 'react';
import { useCommands } from '../hooks/useCommands';
import { CommandsList } from './CommandsList';
import { open } from '@tauri-apps/api/shell';
import { appWindow } from '@tauri-apps/api/window';
import {
  GlobeAltIcon as Globe,
  MagnifyingGlassIcon as Search,
  DocumentTextIcon as FileText,
  RocketLaunchIcon as Rocket,
  PuzzlePieceIcon as Gamepad2, 
  CodeBracketIcon as Code,
  ComputerDesktopIcon as Monitor,
  BoltIcon as Zap,
  CpuChipIcon as Brain,
  ServerIcon as HardDrive,
  ClockIcon as Clock,
  Battery100Icon as Battery,
  ListBulletIcon as List,
  ScissorsIcon as Scissors,
  PowerIcon as Power,
  ArrowPathIcon as RefreshCw,
  MoonIcon as Moon,
  LockClosedIcon as Lock,
  FolderOpenIcon as FolderOpen,
  CalculatorIcon as Calculator,
  SunIcon as CloudSun,
  ClockIcon as Timer,
  CurrencyDollarIcon as Coins,
  KeyIcon as Key,
  CubeIcon as Package,
  Cog8ToothIcon as Settings,
  BookmarkIcon as BookMarked,
  WrenchIcon as Wrench,
  PencilIcon as Note,
  ClockIcon as Clock3,
  QueueListIcon as LayoutList,
  ClipboardDocumentIcon as Copy,
  CheckIcon as Check,
  LinkIcon as Link,
  ArrowTopRightOnSquareIcon as ExternalLink,
  FolderIcon as Folder,
  DocumentIcon as File,
  PlayIcon as Play,
  CursorArrowRaysIcon as CursorArrowRaysIcon,
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'files' | 'search' | 'system' | 'weather' | 'calculator' | 'notes' | 'web_search' | 'website' | 'app' | 'install' | 'network' | 'media' | 'control' | 'utils' | 'package';
  data?: any;
}

// Notification component for copied commands
const CopyNotification = ({ command, onExecute, onDismiss }: { command: string; onExecute: () => void; onDismiss: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-indigo-500/30 rounded-lg shadow-2xl p-3 z-50 animate-slideUp flex items-center space-x-3">
      <div className="flex-1">
        <div className="text-xs text-gray-400">Command copied:</div>
        <div className="text-sm text-white font-mono truncate max-w-[200px]">{command}</div>
      </div>
      <button
        onClick={onExecute}
        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg flex items-center space-x-1 transition-colors"
      >
        <Play className="w-3 h-3" />
        <span>Execute</span>
      </button>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-300"
      >
        ✕
      </button>
    </div>
  );
};

// Message display component for professional formatting
const MessageDisplay = ({ message }: { message: Message }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseWebResults = (text: string) => {
    const lines = text.split('\n');
    const results = [];
    let current: any = {};
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^\d+\./)) {
        if (current.title) results.push(current);
        current = { title: line.replace(/^\d+\.\s*/, ''), description: '', url: '' };
      } else if (line.startsWith('🔗')) {
        current.url = line.replace('🔗', '').trim();
      } else if (line.trim() && !line.startsWith('Web Results')) {
        current.description += line + ' ';
      }
    }
    if (current.title) results.push(current);
    return results;
  };

  const parseJsonResults = (text: string) => {
    try {
      const data = JSON.parse(text);
      return JSON.stringify(data, null, 2);
    } catch {
      return text;
    }
  };

  switch (message.type) {
    case 'web_search': {
      const results = parseWebResults(message.text);
      const queryMatch = message.text.match(/Web Results for: (.*)/);
      const query = queryMatch ? queryMatch[1] : 'Search';

      return (
        <div className="space-y-4">
          <div className="flex items-center text-indigo-400 border-b border-white/10 pb-2">
            <span className="font-medium">Search results for "{query}"</span>
          </div>
          <div className="space-y-3">
            {results.map((res, idx) => (
              <div key={idx} className="bg-gray-800/60 rounded-lg p-3 hover:bg-gray-800/80 transition-colors">
                <h4 className="text-white font-medium mb-1">{res.title}</h4>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">{res.description}</p>
                {res.url && (
                  <a
                    href={res.url.startsWith('http') ? res.url : `https://${res.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center space-x-1"
                  >
                    <Link className="w-3 h-3" />
                    <span className="truncate">{res.url}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'system': {
      const lines = message.text.split('\n').filter(l => l.trim());
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-purple-400 border-b border-white/10 pb-2">
            <Monitor className="w-4 h-4" />
            <span className="font-medium">System Information</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {lines.map((line, idx) => {
              if (line.includes(':')) {
                const [key, value] = line.split(':').map(s => s.trim());
                return (
                  <div key={idx} className="bg-gray-800/40 rounded p-2">
                    <div className="text-xs text-gray-500">{key}</div>
                    <div className="text-sm text-white font-mono">{value}</div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      );
    }

    case 'files':
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-yellow-400 border-b border-white/10 pb-2">
            <Folder className="w-4 h-4" />
            <span className="font-medium">Files</span>
          </div>
          <div className="space-y-2">
            {message.text.split('\n').map((line, idx) => {
              if (line.startsWith('📁') || line.startsWith('📄')) {
                return (
                  <div key={idx} className="flex items-center space-x-2 bg-gray-800/40 rounded p-2 text-sm">
                    <span className="text-xl">{line[0]}</span>
                    <span className="text-white flex-1">{line.substring(2)}</span>
                  </div>
                );
              }
              return (
                <p key={idx} className="text-gray-300 text-sm">{line}</p>
              );
            })}
          </div>
        </div>
      );

    case 'calculator': {
      const [expression, result] = message.text.split('=').map(s => s.trim());
      return (
        <div className="bg-gray-800/60 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-orange-400 mb-3">
            <Calculator className="w-4 h-4" />
            <span className="font-medium">Calculation</span>
          </div>
          <div className="font-mono text-sm">
            <div className="text-gray-400">{expression}</div>
            <div className="text-2xl text-white mt-1">{result}</div>
          </div>
        </div>
      );
    }

    case 'notes':
      return (
        <div className="bg-gray-800/60 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-blue-400 mb-2">
            <Note className="w-4 h-4" />
            <span className="font-medium">Note</span>
          </div>
          <p className="text-white whitespace-pre-wrap">{message.text}</p>
        </div>
      );

    case 'network': {
      return (
        <div className="bg-gray-800/60 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-green-400 mb-2">
            <Globe className="w-4 h-4" />
            <span className="font-medium">Network</span>
          </div>
          <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">{parseJsonResults(message.text)}</pre>
        </div>
      );
    }

    case 'media': {
      return (
        <div className="bg-gray-800/60 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-pink-400 mb-2">
            <Play className="w-4 h-4" />
            <span className="font-medium">Media</span>
          </div>
          <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">{parseJsonResults(message.text)}</pre>
        </div>
      );
    }

    case 'control': {
      return (
        <div className="bg-gray-800/60 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-cyan-400 mb-2">
            <CursorArrowRaysIcon className="w-4 h-4" />
            <span className="font-medium">Control</span>
          </div>
          <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">{parseJsonResults(message.text)}</pre>
        </div>
      );
    }

    case 'utils': {
      return (
        <div className="bg-gray-800/60 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-amber-400 mb-2">
            <Wrench className="w-4 h-4" />
            <span className="font-medium">Utilities</span>
          </div>
          <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">{parseJsonResults(message.text)}</pre>
        </div>
      );
    }

    case 'package': {
      return (
        <div className="bg-gray-800/60 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-emerald-400 mb-2">
            <Package className="w-4 h-4" />
            <span className="font-medium">Package Manager</span>
          </div>
          <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">{parseJsonResults(message.text)}</pre>
        </div>
      );
    }

    case 'website':
    case 'app':
    case 'install': {
      const icon = message.type === 'website' ? <Globe className="w-4 h-4 text-blue-400" /> :
                   message.type === 'app' ? <Rocket className="w-4 h-4 text-pink-400" /> :
                   <Package className="w-4 h-4 text-green-400" />;
      return (
        <div className="bg-gray-800/60 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            {icon}
            <span className="font-medium text-white capitalize">{message.type}</span>
          </div>
          <p className="text-gray-300 whitespace-pre-wrap text-sm">{message.text}</p>
          {message.text.includes('http') && (
            <button
              onClick={() => copyToClipboard(message.text.match(/https?:\/\/[^\s]+/)?.[0] || '')}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy link'}</span>
            </button>
          )}
        </div>
      );
    }

    default:
      return (
        <div className="bg-gray-800/60 rounded-lg p-4">
          <p className="text-gray-300 whitespace-pre-wrap text-sm">{message.text}</p>
        </div>
      );
  }
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [timers] = useState<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [showCommands, setShowCommands] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [autoHideTimer, setAutoHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'local' | 'web'>('local');

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

  const handleTopBarMouseEnter = () => setShowControls(true);
  const handleTopBarMouseLeave = () => setShowControls(false);

  useEffect(() => {
    if (messages.length > 0 && !showCommands) {
      if (autoHideTimer) clearTimeout(autoHideTimer);
      const timer = setTimeout(() => {
        if (!hoverTimeout) setMessages([]);
      }, 60000);
      setAutoHideTimer(timer);
      return () => clearTimeout(timer);
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
    if (autoHideTimer) clearTimeout(autoHideTimer);
    if (hoverTimeout) clearTimeout(hoverTimeout);
  };

  const handleMinimize = () => appWindow.minimize();
  const handleClose = () => appWindow.close();

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
    'moviepire': 'https://moviepire.com',
    'imdb': 'https://imdb.com',
    'stackoverflow': 'https://stackoverflow.com',
    'gmail': 'https://mail.google.com',
    'yahoo mail': 'https://mail.yahoo.com',
    'outlook': 'https://outlook.live.com',
    'dropbox': 'https://dropbox.com',
    'drive': 'https://drive.google.com',
  };

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
    'lutris': ['lutris'],
    'heroic': ['heroic'],
  };

  const packageInfo: Record<string, { deb?: string; snap?: string; flatpak?: string; apt?: string }> = {
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

  const openWebsite = async (url: string) => {
    try {
      await open(url);
      return `✅ Opened ${url}`;
    } catch (error) {
      return `❌ Failed to open: ${error}`;
    }
  };

  const getInstallInstructions = (packageName: string): string => {
    const pkg = packageInfo[packageName];
    if (!pkg) {
      return `📦 To install ${packageName}, try:\n• Ubuntu/Debian: \`sudo apt install ${packageName}\`\n• Snap: \`sudo snap install ${packageName}\`\n• Flatpak: \`flatpak install ${packageName}\``;
    }
    let response = `📦 Installation instructions for ${packageName}:\n\n`;
    if (pkg.apt) response += `APT:\n\`${pkg.apt}\`\n\n`;
    if (pkg.snap) response += `Snap:\n\`${pkg.snap}\`\n\n`;
    if (pkg.flatpak) response += `Flatpak:\n\`${pkg.flatpak}\`\n\n`;
    if (pkg.deb) response += `Direct .deb:\n${pkg.deb}\n`;
    return response;
  };

  const performWebSearch = async (query: string): Promise<string> => {
    try {
      const results = await commands.searchWeb(query);
      if (results.length > 0) {
        let response = `Web Results for: ${query}\n\n`;
        results.slice(0, 5).forEach((r, i) => {
          response += `${i + 1}. ${r.title}\n`;
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

  // Helper function to parse and execute commands
  const executeCommand = async (commandText: string) => {
    if (!commandText.trim() || isProcessing) return;
    
    setMessages([]);
    setShowCommands(false);
    setCopiedCommand(null);
    setIsProcessing(true);

    try {
      let response = '';
      let messageType: Message['type'] = 'text';
      const lowerText = commandText.toLowerCase().trim();
      const originalText = commandText;

      // ==================== WEBSITE & APP COMMANDS ====================
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

          // ==================== WEB SEARCH COMMANDS ====================
          else if (lowerText.startsWith('google ') || lowerText.startsWith('search for ') || lowerText.startsWith('search ')) {
            let query = '';
            if (lowerText.startsWith('google ')) query = commandText.substring(7).trim();
            else if (lowerText.startsWith('search for ')) query = commandText.substring(11).trim();
            else query = commandText.substring(7).trim();
            response = await performWebSearch(query);
            messageType = 'web_search';
          } 
          else if (lowerText.startsWith('preview ')) {
            const url = commandText.substring(8).trim();
            const fullUrl = url.startsWith('http') ? url : 'https://' + url;
            try {
              response = await commands.getWebpagePreview(fullUrl);
            } catch (error) {
              response = await performWebSearch(url);
              messageType = 'web_search';
            }
          } 

          // ==================== FILE COMMANDS ====================
          else if (lowerText.startsWith('search files ') || lowerText.startsWith('find files ')) {
            const query = commandText.replace(/^(search files|find files)\s+/i, '').trim();
            try {
              const files = await commands.searchFiles(query);
              if (files.length > 0) {
                response = `📁 Found ${files.length} files:\n\n`;
                files.slice(0, 5).forEach((f) => {
                  const icon = f.is_directory ? '📂' : '📄';
                  response += `${icon} ${f.name}\n`;
                  response += `   📍 ${f.path}\n`;
                  if (!f.is_directory) {
                    response += `   📦 ${formatFileSize(f.size)}  🕒 ${f.modified}\n`;
                  }
                  response += '\n';
                });
                if (files.length > 5) response += `... and ${files.length - 5} more files`;
                messageType = 'files';
              } else {
                response = `🔍 No files found matching "${query}"`;
                messageType = 'files';
              }
            } catch (error) {
              response = `❌ File search failed: ${error}`;
              messageType = 'files';
            }
          } 
          else if (lowerText.startsWith('create file ')) {
            const path = commandText.substring(12).trim();
            try {
              const result = await commands.createFile(path);
              response = result.message;
              messageType = 'files';
            } catch (error) {
              response = `❌ Failed to create file: ${error}`;
              messageType = 'files';
            }
          } 
          else if (lowerText.startsWith('create folder ') || lowerText.startsWith('mkdir ')) {
            const path = commandText.replace(/^(create folder|mkdir)\s+/i, '').trim();
            try {
              const result = await commands.createFolder(path);
              response = result.message;
              messageType = 'files';
            } catch (error) {
              response = `❌ Failed to create folder: ${error}`;
              messageType = 'files';
            }
          } 
          else if (lowerText.startsWith('delete ')) {
            const path = commandText.substring(7).trim();
            const permanent = lowerText.includes('permanently');
            try {
              const result = await commands.deleteFile(path, permanent);
              response = result.message;
              messageType = 'files';
            } catch (error) {
              response = `❌ Failed to delete: ${error}`;
              messageType = 'files';
            }
          } 
          else if (lowerText.startsWith('copy ')) {
            const parts = commandText.substring(5).split(' to ');
            if (parts.length === 2) {
              try {
                const result = await commands.copyFile(parts[0].trim(), parts[1].trim());
                response = result.message;
                messageType = 'files';
              } catch (error) {
                response = `❌ Failed to copy: ${error}`;
                messageType = 'files';
              }
            } else {
              response = "❌ Usage: copy [source] to [destination]";
              messageType = 'files';
            }
          } 
          else if (lowerText.startsWith('move ')) {
            const parts = commandText.substring(5).split(' to ');
            if (parts.length === 2) {
              try {
                const result = await commands.moveFile(parts[0].trim(), parts[1].trim());
                response = result.message;
                messageType = 'files';
              } catch (error) {
                response = `❌ Failed to move: ${error}`;
                messageType = 'files';
              }
            } else {
              response = "❌ Usage: move [source] to [destination]";
              messageType = 'files';
            }
          } 
          else if (lowerText.startsWith('rename ')) {
            const parts = commandText.substring(7).split(' to ');
            if (parts.length === 2) {
              try {
                const result = await commands.renameFile(parts[0].trim(), parts[1].trim());
                response = result.message;
                messageType = 'files';
              } catch (error) {
                response = `❌ Failed to rename: ${error}`;
                messageType = 'files';
              }
            } else {
              response = "❌ Usage: rename [old] to [new]";
              messageType = 'files';
            }
          } 
          else if (lowerText.startsWith('compress ')) {
            const parts = commandText.substring(9).split(' to ');
            if (parts.length === 2) {
              const files = parts[0].split(',').map(f => f.trim());
              try {
                const result = await commands.compressFiles(files, parts[1].trim());
                response = result.message;
                messageType = 'files';
              } catch (error) {
                response = `❌ Failed to compress: ${error}`;
                messageType = 'files';
              }
            } else {
              response = "❌ Usage: compress [file1, file2, ...] to [archive]";
              messageType = 'files';
            }
          } 
          else if (lowerText.startsWith('extract ')) {
            const parts = commandText.substring(8).split(' to ');
            try {
              const result = await commands.extractArchive(parts[0].trim(), parts[1]?.trim());
              response = result.message;
              messageType = 'files';
            } catch (error) {
              response = `❌ Failed to extract: ${error}`;
              messageType = 'files';
            }
          } 
          else if (lowerText.startsWith('hash file ')) {
            const parts = commandText.substring(10).split(' using ');
            if (parts.length === 2) {
              try {
                response = await commands.calculateFileHash(parts[0].trim(), parts[1].trim());
                messageType = 'files';
              } catch (error) {
                response = `❌ Failed to calculate hash: ${error}`;
                messageType = 'files';
              }
            } else {
              response = "❌ Usage: hash file [path] using [md5|sha1|sha256]";
              messageType = 'files';
            }
          } 

          // ==================== SYSTEM COMMANDS ====================
          else if (lowerText.includes('system info') || lowerText.includes('system information') || lowerText === 'status') {
            try {
              const info = await commands.getSystemInfo();
              response = `💻 System Information\n\n` +
                `OS: ${info.os}\n` +
                `Kernel: ${info.kernel}\n` +
                `Host: ${info.host_name}\n` +
                `CPU: ${info.cpu_usage.toFixed(1)}% (${info.cpu_cores} cores)\n` +
                `Memory: ${(info.memory_used / 1024 / 1024 / 1024).toFixed(1)}GB / ${(info.memory_total / 1024 / 1024 / 1024).toFixed(1)}GB (${info.memory_percent.toFixed(1)}%)\n` +
                `Uptime: ${formatUptime(info.uptime)}`;
              messageType = 'system';
            } catch (error) {
              response = await performWebSearch("how to check system information");
              messageType = 'web_search';
            }
          } 
          else if (lowerText === 'cpu' || lowerText === 'cpu usage') {
            try {
              const info = await commands.getSystemInfo();
              response = `CPU Usage: ${info.cpu_usage.toFixed(1)}% (${info.cpu_cores} cores)`;
              messageType = 'system';
            } catch (error) {
              response = await performWebSearch("how to check cpu usage");
              messageType = 'web_search';
            }
          } 
          else if (lowerText === 'memory' || lowerText === 'ram') {
            try {
              const info = await commands.getSystemInfo();
              response = `Memory: ${(info.memory_used / 1024 / 1024 / 1024).toFixed(1)}GB / ${(info.memory_total / 1024 / 1024 / 1024).toFixed(1)}GB (${info.memory_percent.toFixed(1)}%)`;
              messageType = 'system';
            } catch (error) {
              response = await performWebSearch("how to check memory usage");
              messageType = 'web_search';
            }
          } 
          else if (lowerText.includes('disk') || lowerText.includes('storage')) {
            try {
              const info = await commands.getSystemInfo();
              response = `💾 Disk Space\n\n`;
              info.disks.forEach(disk => {
                const freeGB = (disk.available_space / 1024 / 1024 / 1024).toFixed(1);
                const totalGB = (disk.total_space / 1024 / 1024 / 1024).toFixed(1);
                response += `${disk.name} (${disk.mount_point}): ${freeGB}GB free / ${totalGB}GB total (${disk.usage_percent.toFixed(1)}% used)\n`;
              });
              messageType = 'system';
            } catch (error) {
              response = await performWebSearch("how to check disk space");
              messageType = 'web_search';
            }
          } 
          else if (lowerText === 'uptime') {
            try {
              const info = await commands.getSystemInfo();
              response = `⏱️ System Uptime: ${formatUptime(info.uptime)}`;
              messageType = 'system';
            } catch (error) {
              response = await performWebSearch("how to check system uptime");
              messageType = 'web_search';
            }
          } 
          else if (lowerText.includes('processes') || lowerText.includes('running processes')) {
            try {
              const info = await commands.getSystemInfo();
              response = `📋 Top Running Processes:\n\n`;
              info.top_processes.slice(0, 5).forEach((p, i) => {
                response += `${i + 1}. ${p.name} (PID: ${p.pid})\n`;
                response += `   CPU: ${p.cpu_usage.toFixed(1)}% | RAM: ${(p.memory_usage / 1024 / 1024).toFixed(1)}MB\n`;
              });
              messageType = 'system';
            } catch (error) {
              response = await performWebSearch("how to list running processes");
              messageType = 'web_search';
            }
          } 
          else if (lowerText.startsWith('kill ')) {
            const pidStr = commandText.substring(5).trim();
            const pid = parseInt(pidStr);
            if (!isNaN(pid)) {
              try {
                response = await commands.killProcess(pid);
                messageType = 'system';
              } catch (e) {
                response = `❌ Failed to kill process: ${e}`;
                messageType = 'system';
              }
            } else {
              response = "❌ Please provide a valid process ID (number)";
              messageType = 'system';
            }
          } 
          else if (lowerText.includes('shutdown') || lowerText.includes('restart') || lowerText.includes('reboot') || 
                   lowerText.includes('sleep') || lowerText.includes('lock') || lowerText.includes('hibernate') || 
                   lowerText.includes('logout')) {
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
            else if (lowerText.includes('hibernate')) action = 'hibernate';
            else if (lowerText.includes('logout')) action = 'logout';
            
            try {
              response = await commands.controlSystem(action, delay);
              messageType = 'system';
            } catch (error) {
              response = `❌ Failed to ${action}: ${error}`;
              messageType = 'system';
            }
          } 
          else if (lowerText.startsWith('services')) {
            try {
              const services = await commands.getSystemServices();
              response = `📋 System Services:\n\n`;
              services.slice(0, 10).forEach(s => {
                response += `• ${s.name} [${s.status}]\n`;
              });
              messageType = 'system';
            } catch (error) {
              response = `❌ Failed to get services: ${error}`;
              messageType = 'system';
            }
          } 
          else if (lowerText.startsWith('service ')) {
            const parts = commandText.substring(8).split(' ');
            if (parts.length >= 2) {
              const action = parts[0];
              const service = parts.slice(1).join(' ');
              try {
                response = await commands.controlService(service, action);
                messageType = 'system';
              } catch (error) {
                response = `❌ Failed to ${action} service: ${error}`;
                messageType = 'system';
              }
            }
          } 
          else if (lowerText.startsWith('logs') || lowerText.startsWith('system logs')) {
            try {
              const logs = await commands.getSystemLogs(20);
              response = `📋 System Logs (last 20):\n\n${logs.join('\n')}`;
              messageType = 'system';
            } catch (error) {
              response = `❌ Failed to get logs: ${error}`;
              messageType = 'system';
            }
          } 

          // ==================== NETWORK COMMANDS ====================
          else if (lowerText.startsWith('ping ')) {
            const host = commandText.substring(5).trim();
            try {
              const results = await commands.pingHost(host, 4);
              response = `📡 Ping results for ${host}:\n\n`;
              results.forEach((r, i) => {
                response += `${i + 1}. ${r.success ? `✓ ${r.time_ms?.toFixed(1)}ms` : `✗ ${r.error}`}\n`;
              });
              messageType = 'network';
            } catch (error) {
              response = `❌ Ping failed: ${error}`;
              messageType = 'network';
            }
          } 
          else if (lowerText.startsWith('dns ') || lowerText.startsWith('lookup ')) {
            const domain = commandText.replace(/^(dns|lookup)\s+/i, '').trim();
            try {
              const records = await commands.dnsLookup(domain, 'A');
              response = `📋 DNS Records for ${domain}:\n\n`;
              records.forEach(r => {
                response += `• ${r.type_} → ${r.data}\n`;
              });
              messageType = 'network';
            } catch (error) {
              response = `❌ DNS lookup failed: ${error}`;
              messageType = 'network';
            }
          } 
          else if (lowerText.startsWith('whois ')) {
            const domain = commandText.substring(6).trim();
            try {
              const info = await commands.whoisLookup(domain);
              response = `📋 WHOIS Info for ${domain}:\n\n`;
              if (info.registrar) response += `Registrar: ${info.registrar}\n`;
              if (info.creation_date) response += `Created: ${info.creation_date}\n`;
              if (info.expiration_date) response += `Expires: ${info.expiration_date}\n`;
              if (info.name_servers.length) response += `Name Servers: ${info.name_servers.join(', ')}\n`;
              messageType = 'network';
            } catch (error) {
              response = `❌ WHOIS lookup failed: ${error}`;
              messageType = 'network';
            }
          } 
          else if (lowerText === 'my ip' || lowerText === 'public ip' || lowerText === 'what is my ip') {
            try {
              const ip = await commands.getPublicIp();
              response = `🌐 Your public IP address is: ${ip}`;
              messageType = 'network';
            } catch (error) {
              response = `❌ Failed to get IP: ${error}`;
              messageType = 'network';
            }
          } 
          else if (lowerText === 'local ip' || lowerText === 'private ip') {
            try {
              const ip = await commands.getLocalIp();
              response = `🏠 Your local IP address is: ${ip}`;
              messageType = 'network';
            } catch (error) {
              response = `❌ Failed to get local IP: ${error}`;
              messageType = 'network';
            }
          } 
          else if (lowerText.startsWith('portscan ') || lowerText.startsWith('scan ports ')) {
            const host = commandText.replace(/^(portscan|scan ports)\s+/i, '').trim();
            try {
              const ports = await commands.portScan(host);
              const openPorts = ports.filter(p => p.state === 'open');
              response = `🔍 Port scan results for ${host}:\n\n`;
              if (openPorts.length) {
                openPorts.forEach(p => {
                  response += `• Port ${p.port} (${p.protocol}) - ${p.service || 'unknown'} [OPEN]\n`;
                });
              } else {
                response += `No open ports found on common ports.`;
              }
              messageType = 'network';
            } catch (error) {
              response = `❌ Port scan failed: ${error}`;
              messageType = 'network';
            }
          } 
          else if (lowerText.startsWith('speedtest') || lowerText === 'speed test') {
            try {
              const result = await commands.speedTest();
              response = `📊 Speed Test Results:\n\nDownload: ${result.download_speed.toFixed(2)} ${result.unit}\nUpload: ${result.upload_speed.toFixed(2)} ${result.unit}`;
              messageType = 'network';
            } catch (error) {
              response = `❌ Speed test failed: ${error}`;
              messageType = 'network';
            }
          } 
          else if (lowerText.startsWith('traceroute ')) {
            const host = commandText.substring(11).trim();
            try {
              const hops = await commands.traceRoute(host);
              response = `🔄 Traceroute to ${host}:\n\n`;
              hops.forEach((hop, i) => {
                if (hop.success) {
                  response += `${i + 1}. ${hop.host} (${hop.time_ms?.toFixed(1)}ms)\n`;
                }
              });
              messageType = 'network';
            } catch (error) {
              response = `❌ Traceroute failed: ${error}`;
              messageType = 'network';
            }
          } 

          // ==================== CONTROL COMMANDS ====================
          else if (lowerText.startsWith('snap window ')) {
            const direction = commandText.substring(12).trim();
            try {
              response = await commands.snapWindow(direction);
              messageType = 'control';
            } catch (error) {
              response = `❌ Failed to snap window: ${error}`;
              messageType = 'control';
            }
          } 
          else if (lowerText.startsWith('move to monitor ')) {
            const monitor = parseInt(commandText.substring(16).trim());
            if (!isNaN(monitor)) {
              try {
                response = await commands.moveToMonitor(monitor);
                messageType = 'control';
              } catch (error) {
                response = `❌ Failed to move window: ${error}`;
                messageType = 'control';
              }
            } else {
              response = "❌ Please provide a valid monitor number";
              messageType = 'control';
            }
          } 
          else if (lowerText.startsWith('windows') || lowerText === 'list windows') {
            try {
              const windows = await commands.getOpenWindows();
              response = `📋 Open Windows:\n\n`;
              windows.slice(0, 10).forEach((w, i) => {
                response += `${i + 1}. ${w.title} (${w.app_name})\n`;
              });
              messageType = 'control';
            } catch (error) {
              response = `❌ Failed to get windows: ${error}`;
              messageType = 'control';
            }
          } 
          else if (lowerText.startsWith('type ')) {
            const text = commandText.substring(5).trim();
            try {
              response = await commands.typeText(text);
              messageType = 'control';
            } catch (error) {
              response = `❌ Failed to type: ${error}`;
              messageType = 'control';
            }
          } 
          else if (lowerText.startsWith('click')) {
            const parts = commandText.split(' ');
            const button = parts[1] || 'left';
            const double = parts.includes('double');
            try {
              response = await commands.simulateMouseClick(button, double);
              messageType = 'control';
            } catch (error) {
              response = `❌ Failed to click: ${error}`;
              messageType = 'control';
            }
          } 
          else if (lowerText.startsWith('move mouse ')) {
            const coords = commandText.substring(11).split(' ');
            if (coords.length === 2) {
              const x = parseInt(coords[0]);
              const y = parseInt(coords[1]);
              if (!isNaN(x) && !isNaN(y)) {
                try {
                  response = await commands.moveMouse(x, y);
                  messageType = 'control';
                } catch (error) {
                  response = `❌ Failed to move mouse: ${error}`;
                  messageType = 'control';
                }
              } else {
                response = "❌ Please provide valid x and y coordinates";
                messageType = 'control';
              }
            }
          } 
          else if (lowerText.startsWith('drag ')) {
            const parts = commandText.substring(5).split(' to ');
            if (parts.length === 2) {
              const from = parts[0].split(',').map(n => parseInt(n.trim()));
              const to = parts[1].split(',').map(n => parseInt(n.trim()));
              if (from.length === 2 && to.length === 2) {
                try {
                  response = await commands.simulateDragAndDrop(from[0], from[1], to[0], to[1]);
                  messageType = 'control';
                } catch (error) {
                  response = `❌ Failed to drag: ${error}`;
                  messageType = 'control';
                }
              } else {
                response = "❌ Usage: drag x1,y1 to x2,y2";
                messageType = 'control';
              }
            }
          } 

          // ==================== UTILS COMMANDS ====================
          else if (lowerText.startsWith('calculate ') || lowerText.startsWith('calc ')) {
            const expr = commandText.replace(/^(calculate|calc)\s+/i, '').trim();
            try {
              const result = await commands.calculate(expr);
              response = `🧮 ${expr}\n\n= ${result.result}`;
              messageType = 'calculator';
            } catch (error) {
              response = `❌ Calculation failed: ${error}`;
              messageType = 'text';
            }
          } 
          else if (lowerText.startsWith('convert ')) {
            const parts = commandText.substring(8).split(' to ');
            if (parts.length === 2) {
              const fromParts = parts[0].split(' ');
              if (fromParts.length === 2) {
                const value = parseFloat(fromParts[0]);
                const fromUnit = fromParts[1];
                const toUnit = parts[1];
                const category = determineUnitCategory(fromUnit, toUnit);
                try {
                  const result = await commands.convertUnits(value, fromUnit, toUnit, category);
                  response = `📐 ${value} ${fromUnit} = ${result.result.toFixed(4)} ${toUnit}`;
                  messageType = 'utils';
                } catch (error) {
                  response = `❌ Conversion failed: ${error}`;
                  messageType = 'utils';
                }
              }
            } else {
              response = "❌ Usage: convert [value] [from_unit] to [to_unit]";
              messageType = 'utils';
            }
          } 
          else if (lowerText.startsWith('password ') || lowerText.startsWith('generate password ')) {
            const parts = commandText.replace(/^(password|generate password)\s+/i, '').split(' ');
            const length = parseInt(parts[0]) || 16;
            try {
              response = `🔐 Generated password (${length} chars):\n\`${await commands.generatePassword(length)}\``;
              messageType = 'utils';
            } catch (error) {
              response = `❌ Failed to generate password: ${error}`;
              messageType = 'utils';
            }
          } 
          else if (lowerText.startsWith('strength ')) {
            const password = commandText.substring(9).trim();
            try {
              const strength = await commands.checkPasswordStrength(password);
              response = `🔒 Password Strength: ${strength.strength} (${strength.score}/8)\n`;
              response += `Entropy: ${strength.entropy.toFixed(2)} bits\n`;
              response += `Crack time: ${strength.crack_time}\n`;
              if (strength.suggestions.length) {
                response += `\nSuggestions:\n• ${strength.suggestions.join('\n• ')}`;
              }
              messageType = 'utils';
            } catch (error) {
              response = `❌ Failed to check strength: ${error}`;
              messageType = 'utils';
            }
          } 
          else if (lowerText.startsWith('uuid') || lowerText.startsWith('generate uuid')) {
            try {
              response = `🔑 UUID: ${await commands.generateUuid()}`;
              messageType = 'utils';
            } catch (error) {
              response = `❌ Failed to generate UUID: ${error}`;
              messageType = 'utils';
            }
          } 
          else if (lowerText.startsWith('qr ') || lowerText.startsWith('generate qr ')) {
            const data = commandText.replace(/^(qr|generate qr)\s+/i, '').trim();
            try {
              const qrData = await commands.generateQr(data);
              response = `📱 QR Code generated for: ${data}\n${qrData}`;
              messageType = 'utils';
            } catch (error) {
              response = `❌ Failed to generate QR: ${error}`;
              messageType = 'utils';
            }
          } 
          else if (lowerText.startsWith('hash ')) {
            const parts = commandText.substring(5).split(' using ');
            if (parts.length === 2) {
              try {
                response = await commands.calculateTextHash(parts[0].trim(), parts[1].trim());
                messageType = 'utils';
              } catch (error) {
                response = `❌ Failed to calculate hash: ${error}`;
                messageType = 'utils';
              }
            } else {
              response = "❌ Usage: hash [text] using [md5|sha1|sha256]";
              messageType = 'utils';
            }
          } 
          else if (lowerText.startsWith('base64 encode ')) {
            const text = commandText.substring(14).trim();
            try {
              response = `🔐 Base64 encoded:\n${await commands.base64Encode(text)}`;
              messageType = 'utils';
            } catch (error) {
              response = `❌ Failed to encode: ${error}`;
              messageType = 'utils';
            }
          } 
          else if (lowerText.startsWith('base64 decode ')) {
            const text = commandText.substring(14).trim();
            try {
              response = `📝 Base64 decoded:\n${await commands.base64Decode(text)}`;
              messageType = 'utils';
            } catch (error) {
              response = `❌ Failed to decode: ${error}`;
              messageType = 'utils';
            }
          } 
          else if (lowerText.startsWith('json ')) {
            const json = commandText.substring(5).trim();
            try {
              response = await commands.formatJson(json, true);
              messageType = 'utils';
            } catch (error) {
              response = `❌ Failed to format JSON: ${error}`;
              messageType = 'utils';
            }
          } 
          else if (lowerText.startsWith('validate email ')) {
            const email = commandText.substring(15).trim();
            try {
              const isValid = await commands.validateEmail(email);
              response = isValid ? `✅ Valid email: ${email}` : `❌ Invalid email: ${email}`;
              messageType = 'utils';
            } catch (error) {
              response = `❌ Validation failed: ${error}`;
              messageType = 'utils';
            }
          } 
          else if (lowerText.startsWith('validate phone ')) {
            const phone = commandText.substring(15).trim();
            try {
              const isValid = await commands.validatePhone(phone);
              response = isValid ? `✅ Valid phone number` : `❌ Invalid phone number`;
              messageType = 'utils';
            } catch (error) {
              response = `❌ Validation failed: ${error}`;
              messageType = 'utils';
            }
          } 
          else if (lowerText === 'flip coin' || lowerText === 'coin flip') {
            try {
              response = `🪙 Coin flip: ${await commands.flipCoin()}`;
              messageType = 'utils';
            } catch (error) {
              response = `❌ Failed to flip coin: ${error}`;
              messageType = 'utils';
            }
          } 
          else if (lowerText.startsWith('roll dice ') || lowerText.startsWith('roll ')) {
            const parts = commandText.replace(/^(roll dice|roll)\s+/i, '').split(' ');
            const count = parts.length > 1 ? parseInt(parts[0]) : 1;
            const sides = parts.length > 1 ? parseInt(parts[1]) : parseInt(parts[0]);
            if (!isNaN(count) && !isNaN(sides)) {
              try {
                const results = await commands.rollDice(sides, count);
                response = `🎲 Rolled ${count}d${sides}: ${results.join(', ')}`;
                messageType = 'utils';
              } catch (error) {
                response = `❌ Failed to roll dice: ${error}`;
                messageType = 'utils';
              }
            }
          } 

          // ==================== MEDIA COMMANDS ====================
          else if (lowerText.startsWith('volume ')) {
            const value = parseInt(commandText.substring(7).trim());
            if (!isNaN(value) && value >= 0 && value <= 100) {
              try {
                const result = await commands.setVolume(value);
                response = `🔊 Volume set to ${result.volume}%`;
                messageType = 'media';
              } catch (error) {
                response = `❌ Failed to set volume: ${error}`;
                messageType = 'media';
              }
            } else {
              response = "❌ Volume must be between 0 and 100";
              messageType = 'media';
            }
          } 
          else if (lowerText === 'mute' || lowerText === 'unmute') {
            try {
              const muted = await commands.toggleMute();
              response = muted ? "🔇 System muted" : "🔊 System unmuted";
              messageType = 'media';
            } catch (error) {
              response = `❌ Failed to toggle mute: ${error}`;
              messageType = 'media';
            }
          } 
          else if (lowerText.startsWith('brightness ')) {
            const value = parseInt(commandText.substring(11).trim());
            if (!isNaN(value) && value >= 0 && value <= 100) {
              try {
                const brightness = await commands.setBrightness(value);
                response = `☀️ Brightness set to ${brightness}%`;
                messageType = 'media';
              } catch (error) {
                response = `❌ Failed to set brightness: ${error}`;
                messageType = 'media';
              }
            } else {
              response = "❌ Brightness must be between 0 and 100";
              messageType = 'media';
            }
          } 
          else if (lowerText.startsWith('screenshot')) {
            const path = commandText.length > 10 ? commandText.substring(11).trim() : undefined;
            try {
              const result = await commands.takeScreenshot(0, path);
              response = `📸 Screenshot saved to: ${result.path}`;
              messageType = 'media';
            } catch (error) {
              response = `❌ Failed to take screenshot: ${error}`;
              messageType = 'media';
            }
          } 
          else if (lowerText.startsWith('wallpaper ') || lowerText.startsWith('set wallpaper ')) {
            const path = commandText.replace(/^(wallpaper|set wallpaper)\s+/i, '').trim();
            try {
              response = await commands.setWallpaper(path);
              messageType = 'media';
            } catch (error) {
              response = `❌ Failed to set wallpaper: ${error}`;
              messageType = 'media';
            }
          } 
          else if (lowerText.startsWith('play sound ')) {
            const freq = parseInt(commandText.substring(11).trim()) || 440;
            try {
              response = await commands.playSound(freq, 500);
              messageType = 'media';
            } catch (error) {
              response = `❌ Failed to play sound: ${error}`;
              messageType = 'media';
            }
          } 
          else if (lowerText === 'battery' || lowerText === 'battery status') {
            try {
              const battery = await commands.getBatteryInfo();
              response = `🔋 Battery Status:\n`;
              if (battery.capacity) response += `Capacity: ${battery.capacity}%\n`;
              if (battery.status) response += `Status: ${battery.status}`;
              messageType = 'media';
            } catch (error) {
              response = `❌ Failed to get battery info: ${error}`;
              messageType = 'media';
            }
          } 

          // ==================== INSTALL/PACKAGE COMMANDS ====================
          else if (lowerText.startsWith('install ')) {
            const parts = commandText.substring(8).split(' using ');
            if (parts.length === 2) {
              try {
                const result = await commands.installPackage(parts[1].trim(), parts[0].trim());
                response = result.message;
                messageType = 'package';
              } catch (error) {
                response = `❌ Failed to install: ${error}`;
                messageType = 'package';
              }
            } else {
              const pkg = parts[0].trim();
              response = getInstallInstructions(pkg);
              messageType = 'install';
            }
          } 
          else if (lowerText.startsWith('uninstall ')) {
            const parts = commandText.substring(10).split(' using ');
            if (parts.length === 2) {
              try {
                const result = await commands.uninstallPackage(parts[1].trim(), parts[0].trim());
                response = result.message;
                messageType = 'package';
              } catch (error) {
                response = `❌ Failed to uninstall: ${error}`;
                messageType = 'package';
              }
            }
          } 
          else if (lowerText.startsWith('search packages ')) {
            const parts = commandText.substring(16).split(' using ');
            if (parts.length === 2) {
              try {
                const packages = await commands.searchPackages(parts[1].trim(), parts[0].trim());
                response = `📦 Found ${packages.length} packages:\n\n`;
                packages.slice(0, 10).forEach(p => {
                  response += `• ${p.name} ${p.version ? `(${p.version})` : ''}\n`;
                });
                messageType = 'package';
              } catch (error) {
                response = `❌ Failed to search: ${error}`;
                messageType = 'package';
              }
            }
          } 
          else if (lowerText.startsWith('list packages ') || lowerText.startsWith('list installed ')) {
            const manager = commandText.replace(/^(list packages|list installed)\s+/i, '').trim();
            try {
              const packages = await commands.listInstalledPackages(manager);
              response = `📦 Installed packages (${manager}):\n\n`;
              packages.slice(0, 20).forEach(p => {
                response += `• ${p.name} ${p.version ? `(${p.version})` : ''}\n`;
              });
              messageType = 'package';
            } catch (error) {
              response = `❌ Failed to list packages: ${error}`;
              messageType = 'package';
            }
          } 
          else if (lowerText.startsWith('update packages ') || lowerText.startsWith('update ')) {
            const manager = commandText.replace(/^(update packages|update)\s+/i, '').trim();
            try {
              const result = await commands.updatePackages(manager);
              response = result.message;
              messageType = 'package';
            } catch (error) {
              response = `❌ Failed to update: ${error}`;
              messageType = 'package';
            }
          } 
          else if (lowerText.startsWith('upgrade all ')) {
            const manager = commandText.substring(12).trim();
            try {
              const result = await commands.upgradeAll(manager);
              response = result.message;
              messageType = 'package';
            } catch (error) {
              response = `❌ Failed to upgrade: ${error}`;
              messageType = 'package';
            }
          } 

          // ==================== WEATHER & NOTES & TIMERS ====================
          else if (lowerText.startsWith('weather ')) {
            const location = commandText.substring(8).trim();
            response = await performWebSearch(`weather in ${location}`);
            messageType = 'web_search';
          } 
          else if (lowerText.startsWith('remember ')) {
            const note = commandText.substring(9).trim();
            if (note) {
              setNotes(prev => [...prev, note]);
              response = `📝 Note saved!\n"${note}"`;
            } else {
              response = "What should I remember?";
            }
            messageType = 'notes';
          } 
          else if (lowerText === 'show notes' || lowerText === 'notes' || lowerText === 'list notes') {
            if (notes.length > 0) {
              response = `📋 Your Notes:\n\n`;
              notes.slice(0, 5).forEach((note, i) => {
                response += `${i + 1}. ${note}\n`;
              });
              if (notes.length > 5) response += `... and ${notes.length - 5} more notes`;
            } else {
              response = "No notes saved";
            }
            messageType = 'notes';
          } 
          else if (lowerText === 'clear notes' || lowerText === 'delete all notes') {
            setNotes([]);
            response = "🗑️ All notes cleared!";
            messageType = 'notes';
          } 
          else if (lowerText.startsWith('timer ') || lowerText.startsWith('set timer ')) {
            let timerText = lowerText.startsWith('timer ') ? commandText.substring(6).trim() : commandText.substring(10).trim();
            const match = timerText.match(/(\d+)\s*(minute|minutes|min|mins)/);
            if (match) {
              const minutes = parseInt(match[1]);
              const message = timerText.replace(match[0], '').trim() || 'Timer finished!';
              setTimeout(() => {
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  text: `⏰ Timer Alert!\n${message}`,
                  sender: 'assistant',
                  timestamp: new Date(),
                }]);
              }, minutes * 60 * 1000);
              response = `⏰ Timer set for ${minutes} minutes`;
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
                  text: `⏰ Reminder: ${reminder}`,
                  sender: 'assistant',
                  timestamp: new Date(),
                }]);
              }, minutes * 60 * 1000);
              response = `⏰ Reminder set for ${minutes} minutes`;
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
          else {
            // If no specific command matches, do a web search
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
      const fallbackResponse = await performWebSearch(commandText);
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

  // Helper function to determine unit conversion category
  const determineUnitCategory = (from: string, to: string): string => {
    const lengthUnits = ['m', 'km', 'cm', 'mm', 'mile', 'yard', 'foot', 'inch'];
    const weightUnits = ['kg', 'g', 'mg', 'lb', 'oz'];
    const volumeUnits = ['l', 'ml', 'gal', 'qt', 'pt', 'cup'];
    
    if (lengthUnits.includes(from) || lengthUnits.includes(to)) return 'length';
    if (weightUnits.includes(from) || weightUnits.includes(to)) return 'weight';
    if (volumeUnits.includes(from) || volumeUnits.includes(to)) return 'volume';
    if (from === 'c' || from === 'f' || from === 'k' || to === 'c' || to === 'f' || to === 'k') return 'temperature';
    
    return 'length'; // default
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isProcessing) {
      executeCommand(inputText.trim());
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
      setCopiedCommand(null);
    }
  };

  const toggleCommands = () => {
    setShowCommands(!showCommands);
    if (!showCommands) {
      setMessages([]);
      setCopiedCommand(null);
    }
  };

  const handleQuickCommand = (command: string) => {
    setInputText(command);
    executeCommand(command);
  };

  const handleCopyNotification = (command: string) => {
    setCopiedCommand(command);
  };

  const handleExecuteFromNotification = () => {
    if (copiedCommand) {
      executeCommand(copiedCommand);
    }
  };

  const quickCommands = ['youtube', 'open chrome', 'install vlc', 'system info', '2+2', 'weather London', 'notes'];

  return (
    <div className="flex items-start justify-center min-h-screen bg-transparent">
      {/* Copy Notification */}
      {copiedCommand && (
        <CopyNotification
          command={copiedCommand}
          onExecute={handleExecuteFromNotification}
          onDismiss={() => setCopiedCommand(null)}
        />
      )}

      {/* Main Container */}
      <div
        ref={containerRef}
        className="w-[820px] frosted-glass rounded-2xl overflow-hidden shadow-2xl mt-8"
      >
        {/* Top Bar - Window Controls only */}
        <div
          className="h-8 relative"
          onMouseEnter={handleTopBarMouseEnter}
          onMouseLeave={handleTopBarMouseLeave}
        >
          {/* Window Controls */}
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

        {/* Search Bar - Hidden when messages or commands list is shown */}
        {messages.length === 0 && !showCommands && (
          <div className="flex items-center px-6 py-4 border-t border-white/5">
            {/* Toggle button for search mode */}
            <button
              onClick={() => setSearchMode(prev => prev === 'local' ? 'web' : 'local')}
              className={`p-2 rounded-lg transition-colors mr-2 ${
                searchMode === 'web' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              title={searchMode === 'local' ? 'Switch to web search' : 'Switch to local commands'}
            >
              {searchMode === 'local' ? (
                <Monitor className="w-5 h-5" />
              ) : (
                <Globe className="w-5 h-5" />
              )}
            </button>

            <form onSubmit={handleSubmit} className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchMode === 'local' ? "Type a command..." : "Search the web..."}
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
                <span className="text-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Tips - only shown when no messages, not processing, not commands, no input */}
        {messages.length === 0 && !isProcessing && !showCommands && !inputText && (
          <div className="px-5 pb-5 flex flex-wrap gap-2">
            {quickCommands.map((cmd, index) => (
              <button
                key={index}
                onClick={() => handleQuickCommand(cmd)}
                className="px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-indigo-600/20 hover:text-white transition-all text-xs cursor-pointer"
              >
                {cmd}
              </button>
            ))}
          </div>
        )}

        {/* Results Area */}
        {(messages.length > 0 || showCommands) && (
          <div
            ref={resultsRef}
            className="p-5 max-h-[500px] overflow-y-auto scrollbar-hide space-y-2"
            onMouseEnter={handleResultsMouseEnter}
            onMouseLeave={handleResultsMouseLeave}
          >
            {showCommands ? (
              <CommandsList
                onClose={() => setShowCommands(false)}
                onCommandRun={(cmd) => {
                  setInputText(cmd);
                  executeCommand(cmd);
                }}
                onCopyCommand={handleCopyNotification}
                onExecuteCommand={(cmd) => {
                  executeCommand(cmd);
                  setShowCommands(false);
                }}
              />
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
                  <div key={message.id} className="mb-4 last:mb-0">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
                        <span className="text-lg">
                          {message.type === 'website' && '🌐'}
                          {message.type === 'install' && '📦'}
                          {message.type === 'files' && '📁'}
                          {message.type === 'system' && '💻'}
                          {message.type === 'calculator' && '🧮'}
                          {message.type === 'notes' && '📝'}
                          {message.type === 'web_search' && '🔍'}
                          {message.type === 'app' && '🚀'}
                          {message.type === 'network' && '🌍'}
                          {message.type === 'media' && '🎵'}
                          {message.type === 'control' && '🎮'}
                          {message.type === 'utils' && '🔧'}
                          {message.type === 'package' && '📦'}
                          {!message.type && '🤖'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <MessageDisplay message={message} />
                        <div className="text-xs text-gray-600 mt-1 text-right">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}