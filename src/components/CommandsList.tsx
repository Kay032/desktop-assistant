import { useState, useEffect } from 'react';
import {
  // Core icons
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
  // File operation icons
  FolderPlusIcon as FolderPlus,
  DocumentPlusIcon as DocumentPlus,
  TrashIcon as Trash,
  DocumentDuplicateIcon as DocumentDuplicate,
  InformationCircleIcon as Info,
  ArchiveBoxIcon as Archive,
  ArrowsRightLeftIcon as Move,
  // Additional icons
  CloudIcon as Cloud,
  DevicePhoneMobileIcon as Phone,
  PrinterIcon as Printer,
  MapIcon as Map,
  MusicalNoteIcon as Music,
  VideoCameraIcon as Video,
  PhotoIcon as Photo,
  CalendarIcon as Calendar,
  InboxIcon as Inbox,
  EnvelopeIcon as Mail,
  ChatBubbleLeftIcon as Chat,
  BellIcon as Bell,
  FireIcon as Fire,
  BeakerIcon as Beaker,
  ShieldCheckIcon as Shield,
  CursorArrowRaysIcon as Cursor,
  AdjustmentsVerticalIcon as Adjust,
  ArrowDownTrayIcon as Download,
  ArrowUpTrayIcon as Upload,
  CloudArrowUpIcon as CloudUpload,
  CloudArrowDownIcon as CloudDownload,
  CommandLineIcon as Terminal,
  RectangleGroupIcon as Group,
  RectangleStackIcon as Stack,
  Squares2X2Icon as Grid,
  TableCellsIcon as Table,
  ChartBarIcon as Chart,
  ChartPieIcon as PieChart,
  SparklesIcon as Sparkles,
  StarIcon as Star,
  HeartIcon as Heart,
  FlagIcon as Flag,
  TagIcon as Tag,
  TicketIcon as Ticket,
  GiftIcon as Gift,
  CakeIcon as Cake,
  BugAntIcon as Bug,
  EyeIcon as Eye,
  EyeSlashIcon as EyeSlash,
  FingerPrintIcon as Fingerprint,
  QrCodeIcon as QR,
  LinkIcon as Link,
  HashtagIcon as Hashtag,
  AtSymbolIcon as At,
  FilmIcon as Film,
  PlayIcon as Play,
  PauseIcon as Pause,
  StopIcon as Stop,
  ForwardIcon as Forward,
  BackwardIcon as Backward,
  SpeakerWaveIcon as Speaker,
  SpeakerXMarkIcon as Mute,
  WifiIcon as Wifi,
  NoSymbolIcon as NoSymbol,
  ExclamationTriangleIcon as Warning,
  CheckCircleIcon as CheckCircle,
  XCircleIcon as XCircle,
  QuestionMarkCircleIcon as Question,
  LightBulbIcon as Lightbulb,
  PaintBrushIcon as Paint,
  SwatchIcon as Swatch,
  AcademicCapIcon as Academic,
  BuildingOfficeIcon as Building,
  HomeIcon as Home,
  UserIcon as User,
  UsersIcon as Users,
  UserGroupIcon as UserGroup,
  UserPlusIcon as UserPlus,
  UserMinusIcon as UserMinus,
  CogIcon as Cog,
  CircleStackIcon as Database,
  CpuChipIcon as Processor,
  NewspaperIcon as News,
  ShoppingCartIcon as Cart,
  CameraIcon as Camera,
  MicrophoneIcon as Microphone,
  AdjustmentsHorizontalIcon as SwitchHorizontal,
  PaperAirplaneIcon as Airplane,
  DeviceTabletIcon as Bluetooth,
  WindowIcon as Window,
  ShareIcon as Share,
  LanguageIcon as Translate,
  FaceSmileIcon as Smile,
  FaceFrownIcon as Frown,
  HandRaisedIcon as Hand,
  // Execute button icon
  PlayIcon as ExecuteIcon,
} from '@heroicons/react/24/outline';

interface Command {
  category: string;
  icon: React.ElementType;
  name: string;
  description: string;
  example: string;
  action?: () => void;
}

interface CommandsListProps {
  onClose: () => void;
  onCommandRun?: (command: string) => void;
  onCopyCommand?: (command: string) => void;
  onExecuteCommand?: (command: string) => void;
}

declare global {
  interface Window {
    electron?: {
      openApp: (appName: string) => void;
      openUrl: (url: string) => void;
    };
  }
}

export function CommandsList({ 
  onClose, 
  onCommandRun, 
  onCopyCommand,
  onExecuteCommand 
}: CommandsListProps) {
  const [selectedCategory, setSelectedCategory] = useState('web');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [executedId, setExecutedId] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('recentCommands');
    if (saved) setRecentCommands(JSON.parse(saved));
  }, []);

  const addRecentCommand = (command: string) => {
    setRecentCommands(prev => {
      const filtered = prev.filter(c => c !== command);
      const updated = [command, ...filtered].slice(0, 5);
      localStorage.setItem('recentCommands', JSON.stringify(updated));
      return updated;
    });
  };

  const openApp = (appName: string) => {
    if (window.electron) {
      window.electron.openApp(appName);
    } else {
      if (appName === 'timer') window.open('ms-clock:', '_blank');
      else if (appName === 'notes') window.open('onenote:', '_blank');
      else if (appName === 'chrome') window.open('https://www.google.com/chrome', '_blank');
      else if (appName === 'vlc') window.open('https://www.videolan.org/vlc/', '_blank');
    }
  };

  const openWebsite = (website: string) => {
    const url = website.includes('.') ? `https://${website}` : `https://www.${website}.com`;
    window.open(url, '_blank');
  };

  const handleQuickCommand = (command: string) => {
    addRecentCommand(command);
    onClose();
    if (onCommandRun) onCommandRun(command);
  };

  // Function to execute a command directly
  const handleExecute = (example: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExecutedId(Date.now());
    setTimeout(() => setExecutedId(null), 1000);
    
    if (onExecuteCommand) {
      onExecuteCommand(example);
    }
    addRecentCommand(example);
  };

  // Function to copy and notify
  const handleCopy = (index: number, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
    
    // Notify parent about copied command
    if (onCopyCommand) {
      onCopyCommand(text);
    }
  };

  const handleCommandClick = (cmd: Command) => {
    if (cmd.action) {
      cmd.action();
      addRecentCommand(cmd.example);
      onClose();
    }
  };

  // ----- EXPANDED COMMANDS (40+ per category) -----

  const commands: Command[] = [
    // --- Web (40+ commands) ---
    { category: 'web', icon: Globe, name: 'Open Website', description: 'Opens any website in your browser', example: 'youtube' },
    { category: 'web', icon: Search, name: 'Web Search', description: 'Searches the web for answers', example: 'who is the president?' },
    { category: 'web', icon: FileText, name: 'Preview', description: 'Shows webpage preview', example: 'preview example.com' },
    { category: 'web', icon: Download, name: 'Download File', description: 'Downloads a file from a URL', example: 'download https://example.com/file.zip' },
    { category: 'web', icon: CloudUpload, name: 'Upload File', description: 'Uploads a file to a server', example: 'upload file.txt' },
    { category: 'web', icon: Link, name: 'Shorten URL', description: 'Shortens a long URL', example: 'shorten https://example.com' },
    { category: 'web', icon: QR, name: 'Generate QR Code', description: 'Creates a QR code for a URL', example: 'qr https://example.com' },
    { category: 'web', icon: BookMarked, name: 'Bookmark Page', description: 'Saves current page to bookmarks', example: 'bookmark this' },
    { category: 'web', icon: Inbox, name: 'Check Gmail', description: 'Opens Gmail inbox', example: 'open gmail' },
    { category: 'web', icon: Chat, name: 'Open WhatsApp', description: 'Launches WhatsApp Web', example: 'whatsapp' },
    { category: 'web', icon: Video, name: 'YouTube Search', description: 'Searches YouTube', example: 'youtube cat videos' },
    { category: 'web', icon: Map, name: 'Google Maps', description: 'Shows location on Maps', example: 'maps New York' },
    { category: 'web', icon: Cloud, name: 'Weather Forecast', description: 'Gets weather forecast', example: 'weather London' },
    { category: 'web', icon: News, name: 'Latest News', description: 'Shows top news headlines', example: 'news technology' },
    { category: 'web', icon: Chart, name: 'Stock Prices', description: 'Fetches current stock prices', example: 'stock AAPL' },
    { category: 'web', icon: Coins, name: 'Currency Converter', description: 'Converts between currencies', example: 'convert 100 USD to EUR' },
    { category: 'web', icon: Hashtag, name: 'Twitter Trends', description: 'Shows trending topics', example: 'trending' },
    { category: 'web', icon: Film, name: 'Movie Info', description: 'Gets movie details', example: 'movie Inception' },
    { category: 'web', icon: Academic, name: 'Wikipedia Search', description: 'Searches Wikipedia', example: 'wiki Albert Einstein' },
    { category: 'web', icon: Cart, name: 'Amazon Search', description: 'Searches products on Amazon', example: 'amazon laptop' },
    { category: 'web', icon: Ticket, name: 'Event Tickets', description: 'Finds tickets for events', example: 'tickets concert' },
    { category: 'web', icon: Cake, name: 'Recipe Search', description: 'Finds recipes online', example: 'recipe pasta' },
    { category: 'web', icon: Heart, name: 'Health Info', description: 'Searches health information', example: 'health benefits' },
    { category: 'web', icon: Star, name: 'Movie Ratings', description: 'Gets movie ratings', example: 'rating The Godfather' },
    { category: 'web', icon: Flag, name: 'Country Info', description: 'Gets country information', example: 'country Japan' },
    { category: 'web', icon: Tag, name: 'Price Comparison', description: 'Compares prices online', example: 'compare iPhone' },
    { category: 'web', icon: Gift, name: 'Gift Ideas', description: 'Suggests gift ideas', example: 'gift for dad' },
    { category: 'web', icon: Bug, name: 'Tech Support', description: 'Searches for tech support', example: 'fix blue screen' },
    { category: 'web', icon: Eye, name: 'Whois Lookup', description: 'Looks up domain info', example: 'whois example.com' },
    { category: 'web', icon: Shield, name: 'SSL Checker', description: 'Checks SSL certificate', example: 'ssl google.com' },
    { category: 'web', icon: Cursor, name: 'Web Archive', description: 'Views archived site versions', example: 'archive example.com' },
    { category: 'web', icon: Adjust, name: 'Website Uptime', description: 'Checks if a site is up', example: 'uptime google.com' },
    { category: 'web', icon: User, name: 'Social Media Search', description: 'Searches social profiles', example: 'find @username' },
    { category: 'web', icon: Users, name: 'Group Search', description: 'Finds social groups', example: 'find group photography' },
    { category: 'web', icon: Mail, name: 'Email Validator', description: 'Validates an email', example: 'validate email@example.com' },
    { category: 'web', icon: Phone, name: 'Phone Lookup', description: 'Looks up phone number', example: 'lookup +1234567890' },
    { category: 'web', icon: Printer, name: 'Print Webpage', description: 'Prints the current page', example: 'print this' },
    { category: 'web', icon: Photo, name: 'Reverse Image Search', description: 'Searches by image', example: 'search by image' },
    { category: 'web', icon: Video, name: 'YouTube Downloader', description: 'Downloads YouTube video', example: 'download youtube' },
    { category: 'web', icon: Music, name: 'Spotify Search', description: 'Searches music on Spotify', example: 'spotify Imagine Dragons' },
    { category: 'web', icon: Play, name: 'Online Radio', description: 'Plays online radio', example: 'play radio BBC' },
    { category: 'web', icon: CloudDownload, name: 'Cloud Storage', description: 'Accesses cloud storage', example: 'open google drive' },

    // --- Apps (40+ commands) ---
    { category: 'apps', icon: Rocket, name: 'Launch App', description: 'Opens installed applications', example: 'chrome' },
    { category: 'apps', icon: Gamepad2, name: 'Games', description: 'Launches gaming apps', example: 'steam' },
    { category: 'apps', icon: Code, name: 'Editors', description: 'Opens code/text editors', example: 'code' },
    { category: 'apps', icon: Calculator, name: 'Calculator', description: 'Opens calculator app', example: 'calc' },
    { category: 'apps', icon: Calendar, name: 'Calendar', description: 'Opens calendar app', example: 'calendar' },
    { category: 'apps', icon: Mail, name: 'Email Client', description: 'Opens email client', example: 'outlook' },
    { category: 'apps', icon: Chat, name: 'Messaging App', description: 'Opens messaging app', example: 'slack' },
    { category: 'apps', icon: Video, name: 'Video Conferencing', description: 'Opens video call app', example: 'zoom' },
    { category: 'apps', icon: Music, name: 'Music Player', description: 'Opens music player', example: 'spotify' },
    { category: 'apps', icon: Photo, name: 'Photo Viewer', description: 'Opens photo app', example: 'photos' },
    { category: 'apps', icon: Film, name: 'Video Player', description: 'Opens video player', example: 'vlc' },
    { category: 'apps', icon: BookMarked, name: 'PDF Reader', description: 'Opens PDF reader', example: 'pdf' },
    { category: 'apps', icon: DocumentDuplicate, name: 'Office Suite', description: 'Opens office apps', example: 'word' },
    { category: 'apps', icon: Table, name: 'Spreadsheet', description: 'Opens spreadsheet app', example: 'excel' },
    { category: 'apps', icon: Chart, name: 'Presentation', description: 'Opens presentation app', example: 'powerpoint' },
    { category: 'apps', icon: Database, name: 'Database Manager', description: 'Opens database client', example: 'mysql' },
    { category: 'apps', icon: Terminal, name: 'Terminal', description: 'Opens terminal', example: 'terminal' },
    { category: 'apps', icon: Cog, name: 'System Settings', description: 'Opens system settings', example: 'settings' },
    { category: 'apps', icon: Wrench, name: 'Task Manager', description: 'Opens task manager', example: 'task manager' },
    { category: 'apps', icon: FolderOpen, name: 'File Explorer', description: 'Opens file explorer', example: 'explorer' },
    { category: 'apps', icon: Printer, name: 'Print Manager', description: 'Opens print queue', example: 'printers' },
    { category: 'apps', icon: Bell, name: 'Notifications', description: 'Shows notification center', example: 'notifications' },
    { category: 'apps', icon: Sparkles, name: 'App Store', description: 'Opens app store', example: 'app store' },
    { category: 'apps', icon: Cloud, name: 'Cloud Sync', description: 'Opens cloud sync app', example: 'dropbox' },
    { category: 'apps', icon: Lock, name: 'Password Manager', description: 'Opens password manager', example: 'bitwarden' },
    { category: 'apps', icon: Shield, name: 'Antivirus', description: 'Opens antivirus', example: 'defender' },
    { category: 'apps', icon: Fire, name: 'Browser', description: 'Opens web browser', example: 'chrome' },
    { category: 'apps', icon: Chat, name: 'Discord', description: 'Opens Discord', example: 'discord' },
    { category: 'apps', icon: Gamepad2, name: 'Steam', description: 'Opens Steam', example: 'steam' },
    { category: 'apps', icon: Code, name: 'VS Code', description: 'Opens VS Code', example: 'code' },
    { category: 'apps', icon: Beaker, name: 'Postman', description: 'Opens Postman', example: 'postman' },
    { category: 'apps', icon: Adjust, name: 'OBS Studio', description: 'Opens OBS', example: 'obs' },
    { category: 'apps', icon: Video, name: 'Camera', description: 'Opens camera', example: 'camera' },
    { category: 'apps', icon: Microphone, name: 'Voice Recorder', description: 'Opens voice recorder', example: 'record' },
    { category: 'apps', icon: Map, name: 'Maps', description: 'Opens maps', example: 'maps' },
    { category: 'apps', icon: Clock, name: 'Alarms', description: 'Opens alarm clock', example: 'alarms' },
    { category: 'apps', icon: Timer, name: 'Stopwatch', description: 'Opens stopwatch', example: 'stopwatch' },
    { category: 'apps', icon: Calculator, name: 'Scientific Calculator', description: 'Opens scientific calc', example: 'scientific' },
    { category: 'apps', icon: Paint, name: 'Paint', description: 'Opens paint app', example: 'paint' },
    { category: 'apps', icon: Swatch, name: 'Color Picker', description: 'Opens color picker', example: 'color picker' },

    // --- System (40+ commands) ---
    { category: 'system', icon: Monitor, name: 'System Info', description: 'Shows detailed system info', example: 'system info' },
    { category: 'system', icon: Zap, name: 'CPU Usage', description: 'Displays CPU usage', example: 'cpu' },
    { category: 'system', icon: Brain, name: 'Memory', description: 'Shows RAM usage', example: 'memory' },
    { category: 'system', icon: HardDrive, name: 'Disk Space', description: 'Shows storage info', example: 'disk space' },
    { category: 'system', icon: Clock, name: 'Uptime', description: 'Shows system uptime', example: 'uptime' },
    { category: 'system', icon: Battery, name: 'Battery', description: 'Shows battery status', example: 'battery' },
    { category: 'system', icon: List, name: 'Processes', description: 'Lists running processes', example: 'list processes' },
    { category: 'system', icon: Scissors, name: 'Kill Process', description: 'Terminates a process', example: 'kill process 1234' },
    { category: 'system', icon: Power, name: 'Shutdown', description: 'Shuts down the computer', example: 'shutdown' },
    { category: 'system', icon: RefreshCw, name: 'Restart', description: 'Restarts the computer', example: 'restart' },
    { category: 'system', icon: Moon, name: 'Sleep', description: 'Puts computer to sleep', example: 'sleep' },
    { category: 'system', icon: Lock, name: 'Lock', description: 'Locks the screen', example: 'lock' },
    { category: 'system', icon: User, name: 'Current User', description: 'Shows current user', example: 'whoami' },
    { category: 'system', icon: Users, name: 'Users List', description: 'Lists all users', example: 'list users' },
    { category: 'system', icon: UserPlus, name: 'Add User', description: 'Adds a new user', example: 'add user john' },
    { category: 'system', icon: UserMinus, name: 'Remove User', description: 'Removes a user', example: 'remove user john' },
    { category: 'system', icon: Key, name: 'Change Password', description: 'Changes user password', example: 'change password' },
    { category: 'system', icon: Fingerprint, name: 'Biometrics', description: 'Opens biometric settings', example: 'fingerprint' },
    { category: 'system', icon: Shield, name: 'Firewall Status', description: 'Shows firewall status', example: 'firewall' },
    { category: 'system', icon: Wrench, name: 'Disk Cleanup', description: 'Runs disk cleanup', example: 'cleanup' },
    { category: 'system', icon: Archive, name: 'Disk Defrag', description: 'Defragments disk', example: 'defrag C:' },
    { category: 'system', icon: CheckCircle, name: 'System Health', description: 'Checks system health', example: 'health check' },
    { category: 'system', icon: Warning, name: 'Error Logs', description: 'Shows system error logs', example: 'error logs' },
    { category: 'system', icon: Info, name: 'System Logs', description: 'Shows system logs', example: 'logs' },
    { category: 'system', icon: Clock, name: 'Scheduled Tasks', description: 'Lists scheduled tasks', example: 'tasks' },
    { category: 'system', icon: Cog, name: 'Services', description: 'Lists running services', example: 'services' },
    { category: 'system', icon: Play, name: 'Start Service', description: 'Starts a service', example: 'start service' },
    { category: 'system', icon: Stop, name: 'Stop Service', description: 'Stops a service', example: 'stop service' },
    { category: 'system', icon: RefreshCw, name: 'Restart Service', description: 'Restarts a service', example: 'restart service' },
    { category: 'system', icon: Wifi, name: 'Network Status', description: 'Shows network status', example: 'network' },
    { category: 'system', icon: NoSymbol, name: 'Disable Network', description: 'Disables network adapter', example: 'disable wifi' },
    { category: 'system', icon: Processor, name: 'CPU Temperature', description: 'Shows CPU temperature', example: 'cpu temp' },
    { category: 'system', icon: Database, name: 'RAID Status', description: 'Shows RAID status', example: 'raid' },
    { category: 'system', icon: Adjust, name: 'Display Settings', description: 'Opens display settings', example: 'display' },
    { category: 'system', icon: Speaker, name: 'Volume', description: 'Adjusts system volume', example: 'volume 70' },
    { category: 'system', icon: Mute, name: 'Mute', description: 'Mutes system sound', example: 'mute' },
    { category: 'system', icon: Cursor, name: 'Mouse Settings', description: 'Opens mouse settings', example: 'mouse' },
    { category: 'system', icon: Printer, name: 'Printer Status', description: 'Shows printer status', example: 'printer' },

    // --- Control (40+ commands) ---
    { category: 'control', icon: Power, name: 'Shutdown', description: 'Shuts down the computer', example: 'shutdown' },
    { category: 'control', icon: RefreshCw, name: 'Restart', description: 'Restarts the computer', example: 'restart' },
    { category: 'control', icon: Moon, name: 'Sleep', description: 'Puts computer to sleep', example: 'sleep' },
    { category: 'control', icon: Lock, name: 'Lock', description: 'Locks the screen', example: 'lock' },
    { category: 'control', icon: User, name: 'Log Out', description: 'Logs out current user', example: 'logout' },
    { category: 'control', icon: SwitchHorizontal, name: 'Switch User', description: 'Switches to another user', example: 'switch user' },
    { category: 'control', icon: Wrench, name: 'Hibernate', description: 'Hibernates the computer', example: 'hibernate' },
    { category: 'control', icon: NoSymbol, name: 'Cancel Shutdown', description: 'Cancels scheduled shutdown', example: 'cancel shutdown' },
    { category: 'control', icon: Bell, name: 'Do Not Disturb', description: 'Toggles do not disturb mode', example: 'dnd on' },
    { category: 'control', icon: Airplane, name: 'Airplane Mode', description: 'Toggles airplane mode', example: 'airplane on' },
    { category: 'control', icon: Wifi, name: 'WiFi On/Off', description: 'Toggles WiFi', example: 'wifi off' },
    { category: 'control', icon: Bluetooth, name: 'Bluetooth', description: 'Toggles Bluetooth', example: 'bluetooth on' },
    { category: 'control', icon: Lightbulb, name: 'Night Light', description: 'Toggles night light', example: 'night light' },
    { category: 'control', icon: Eye, name: 'Show Desktop', description: 'Minimizes all windows', example: 'show desktop' },
    { category: 'control', icon: EyeSlash, name: 'Hide Desktop', description: 'Restores windows', example: 'hide desktop' },
    { category: 'control', icon: Group, name: 'Task View', description: 'Opens task view', example: 'task view' },
    { category: 'control', icon: Grid, name: 'Snap Windows', description: 'Snaps current window', example: 'snap left' },
    { category: 'control', icon: Window, name: 'Switch Window', description: 'Switches to next window', example: 'next window' },
    { category: 'control', icon: Terminal, name: 'Run Command', description: 'Opens run dialog', example: 'run' },
    { category: 'control', icon: Cog, name: 'Control Panel', description: 'Opens control panel', example: 'control panel' },
    { category: 'control', icon: Adjust, name: 'Quick Settings', description: 'Opens quick settings', example: 'quick settings' },
    { category: 'control', icon: Speaker, name: 'Volume Up', description: 'Increases volume', example: 'volume up' },
    { category: 'control', icon: Mute, name: 'Volume Down', description: 'Decreases volume', example: 'volume down' },
    { category: 'control', icon: Moon, name: 'Brightness Down', description: 'Decreases brightness', example: 'brightness down' },
    { category: 'control', icon: Cursor, name: 'Mouse Click', description: 'Simulates mouse click', example: 'click' },
    { category: 'control', icon: FolderOpen, name: 'Open Home', description: 'Opens home folder', example: 'home' },
    { category: 'control', icon: DocumentDuplicate, name: 'Copy', description: 'Copies selected text', example: 'copy' },
    { category: 'control', icon: Scissors, name: 'Cut', description: 'Cuts selected item', example: 'cut' },
    { category: 'control', icon: Trash, name: 'Delete', description: 'Moves to recycle bin', example: 'delete' },
    { category: 'control', icon: Archive, name: 'Empty Recycle Bin', description: 'Empties recycle bin', example: 'empty bin' },
    { category: 'control', icon: Printer, name: 'Print Screen', description: 'Takes screenshot', example: 'screenshot' },
    { category: 'control', icon: Video, name: 'Screen Recorder', description: 'Starts screen recording', example: 'record screen' },
    { category: 'control', icon: Microphone, name: 'Mute Microphone', description: 'Mutes microphone', example: 'mute mic' },
    { category: 'control', icon: Camera, name: 'Camera On/Off', description: 'Toggles camera', example: 'camera off' },
    { category: 'control', icon: Cloud, name: 'Sync Now', description: 'Triggers cloud sync', example: 'sync' },
    { category: 'control', icon: CloudUpload, name: 'Backup Now', description: 'Starts backup', example: 'backup' },
    { category: 'control', icon: CloudDownload, name: 'Restore', description: 'Restores from backup', example: 'restore' },
    { category: 'control', icon: Sparkles, name: 'Clean Up', description: 'Runs system cleanup', example: 'clean' },

    // --- Files (40+ commands) ---
    { category: 'files', icon: Search, name: 'Search Files', description: 'Finds files by name', example: 'search report.pdf' },
    { category: 'files', icon: Clock3, name: 'Recent Files', description: 'Shows recent files', example: 'recent files' },
    { category: 'files', icon: FolderOpen, name: 'Open Folder', description: 'Opens common folders', example: 'open downloads' },
    { category: 'files', icon: DocumentPlus, name: 'Create File', description: 'Creates a new file', example: 'create file notes.txt' },
    { category: 'files', icon: FolderPlus, name: 'Create Folder', description: 'Creates a new folder', example: 'create folder Projects' },
    { category: 'files', icon: Trash, name: 'Delete File', description: 'Deletes a file', example: 'delete old.txt' },
    { category: 'files', icon: DocumentDuplicate, name: 'Copy File', description: 'Copies a file', example: 'copy file.txt to backup/' },
    { category: 'files', icon: Move, name: 'Move File', description: 'Moves a file', example: 'move file.txt to Documents/' },
    { category: 'files', icon: Note, name: 'Rename File', description: 'Renames a file', example: 'rename file.txt to new.txt' },
    { category: 'files', icon: Info, name: 'File Info', description: 'Shows detailed file info', example: 'info file.txt' },
    { category: 'files', icon: Settings, name: 'File Properties', description: 'Shows file properties', example: 'properties file.txt' },
    { category: 'files', icon: Monitor, name: 'Open With', description: 'Opens file with an app', example: 'open file.txt with notepad' },
    { category: 'files', icon: Archive, name: 'Compress', description: 'Compresses files', example: 'compress folder' },
    { category: 'files', icon: Archive, name: 'Extract', description: 'Extracts an archive', example: 'extract archive.zip' },
    { category: 'files', icon: Eye, name: 'View File', description: 'Opens file for viewing', example: 'view image.jpg' },
    { category: 'files', icon: Photo, name: 'View Image', description: 'Opens image viewer', example: 'view photo.png' },
    { category: 'files', icon: Video, name: 'Play Video', description: 'Plays video file', example: 'play video.mp4' },
    { category: 'files', icon: Music, name: 'Play Audio', description: 'Plays audio file', example: 'play song.mp3' },
    { category: 'files', icon: FileText, name: 'Open Document', description: 'Opens document', example: 'open doc.pdf' },
    { category: 'files', icon: Table, name: 'Open Spreadsheet', description: 'Opens spreadsheet', example: 'open sheet.xlsx' },
    { category: 'files', icon: Chart, name: 'Open Presentation', description: 'Opens presentation', example: 'open slides.pptx' },
    { category: 'files', icon: Code, name: 'Open Code File', description: 'Opens code file', example: 'open script.py' },
    { category: 'files', icon: Lock, name: 'Encrypt File', description: 'Encrypts a file', example: 'encrypt secret.txt' },
    { category: 'files', icon: Key, name: 'Decrypt File', description: 'Decrypts a file', example: 'decrypt secret.enc' },
    { category: 'files', icon: Fingerprint, name: 'Sign File', description: 'Signs a file', example: 'sign document.pdf' },
    { category: 'files', icon: Shield, name: 'Check Hash', description: 'Calculates file hash', example: 'hash file.txt md5' },
    { category: 'files', icon: Printer, name: 'Print File', description: 'Prints a file', example: 'print document.pdf' },
    { category: 'files', icon: Inbox, name: 'Import File', description: 'Imports a file', example: 'import data.csv' },
    { category: 'files', icon: Archive, name: 'Export File', description: 'Exports file', example: 'export data.json' },
    { category: 'files', icon: Share, name: 'Share File', description: 'Shares a file', example: 'share report.pdf' },
    { category: 'files', icon: Link, name: 'Get Share Link', description: 'Generates shareable link', example: 'share link file.txt' },
    { category: 'files', icon: CloudUpload, name: 'Upload File', description: 'Uploads file to cloud', example: 'upload photo.jpg' },
    { category: 'files', icon: CloudDownload, name: 'Download File', description: 'Downloads file from cloud', example: 'download file.pdf' },
    { category: 'files', icon: FolderOpen, name: 'Open in Terminal', description: 'Opens folder in terminal', example: 'open terminal here' },
    { category: 'files', icon: Code, name: 'Open in VS Code', description: 'Opens folder in VS Code', example: 'open in code' },
    { category: 'files', icon: Terminal, name: 'Open in CMD', description: 'Opens CMD in folder', example: 'open cmd here' },
    { category: 'files', icon: Star, name: 'Add to Favorites', description: 'Adds file to favorites', example: 'favorite file.txt' },
    { category: 'files', icon: Tag, name: 'Add Tag', description: 'Adds a tag to file', example: 'tag file.txt important' },
    { category: 'files', icon: Flag, name: 'Mark as Important', description: 'Marks file as important', example: 'mark important' },

    // --- Utilities (40+ commands) ---
    { category: 'utils', icon: Calculator, name: 'Calculator', description: 'Performs calculations', example: 'calculate 25 * 4' },
    { category: 'utils', icon: CloudSun, name: 'Weather', description: 'Shows weather forecast', example: 'weather London' },
    { category: 'utils', icon: Note, name: 'Notes', description: 'Opens note-taking app', example: 'take notes' },
    { category: 'utils', icon: Timer, name: 'Timer', description: 'Sets a timer', example: 'set timer 5 minutes' },
    { category: 'utils', icon: Key, name: 'Password', description: 'Generates a password', example: 'password 16' },
    { category: 'utils', icon: Coins, name: 'Coin Flip', description: 'Flips a coin', example: 'flip coin' },
    { category: 'utils', icon: Sparkles, name: 'Random Number', description: 'Generates random number', example: 'random 1 100' },
    { category: 'utils', icon: Map, name: 'Distance Calculator', description: 'Calculates distance', example: 'distance NY to LA' },
    { category: 'utils', icon: Chart, name: 'BMI Calculator', description: 'Calculates BMI', example: 'bmi 70kg 175cm' },
    { category: 'utils', icon: Beaker, name: 'Unit Converter', description: 'Converts units', example: 'convert 10 miles to km' },
    { category: 'utils', icon: Clock, name: 'World Clock', description: 'Shows time in cities', example: 'time Tokyo' },
    { category: 'utils', icon: Calendar, name: 'Date Difference', description: 'Calculates days between dates', example: 'days until christmas' },
    { category: 'utils', icon: Lightbulb, name: 'Idea Generator', description: 'Generates random ideas', example: 'idea' },
    { category: 'utils', icon: Question, name: 'Trivia', description: 'Shows random trivia', example: 'trivia' },
    { category: 'utils', icon: BookMarked, name: 'Quote', description: 'Shows random quote', example: 'quote' },
    { category: 'utils', icon: Fire, name: 'Joke', description: 'Tells a joke', example: 'joke' },
    { category: 'utils', icon: Heart, name: 'Compliment', description: 'Gives a compliment', example: 'compliment' },
    { category: 'utils', icon: Gift, name: 'Birthday Reminder', description: 'Sets birthday reminder', example: 'remind birthday John' },
    { category: 'utils', icon: Ticket, name: 'Lottery Numbers', description: 'Generates lottery numbers', example: 'lottery' },
    { category: 'utils', icon: Wrench, name: 'IP Address', description: 'Shows your IP', example: 'my ip' },
    { category: 'utils', icon: Globe, name: 'Domain Age', description: 'Checks domain age', example: 'domain age google.com' },
    { category: 'utils', icon: Shield, name: 'Password Strength', description: 'Checks password strength', example: 'check password' },
    { category: 'utils', icon: Key, name: 'Generate UUID', description: 'Generates a UUID', example: 'uuid' },
    { category: 'utils', icon: QR, name: 'Generate QR', description: 'Creates QR code', example: 'qr text' },
    { category: 'utils', icon: Hashtag, name: 'Hash Generator', description: 'Generates hash of text', example: 'hash hello md5' },
    { category: 'utils', icon: Mail, name: 'Email Validator', description: 'Validates email', example: 'validate email@example.com' },
    { category: 'utils', icon: Phone, name: 'Phone Formatter', description: 'Formats phone number', example: 'format phone' },
    { category: 'utils', icon: Map, name: 'Postal Code Lookup', description: 'Looks up postal code', example: 'zip 90210' },
    { category: 'utils', icon: Coins, name: 'Currency Rates', description: 'Shows exchange rates', example: 'rates USD' },
    { category: 'utils', icon: Chart, name: 'Stock Price', description: 'Gets stock price', example: 'stock AAPL' },
    { category: 'utils', icon: Moon, name: 'Moon Phase', description: 'Shows moon phase', example: 'moon' },
    { category: 'utils', icon: Cloud, name: 'Air Quality', description: 'Shows air quality', example: 'aqi London' },
    { category: 'utils', icon: Fire, name: 'COVID Stats', description: 'Shows COVID stats', example: 'covid USA' },
    { category: 'utils', icon: Academic, name: 'Dictionary', description: 'Defines a word', example: 'define serendipity' },
    { category: 'utils', icon: Translate, name: 'Translate', description: 'Translates text', example: 'translate hello to Spanish' },
    { category: 'utils', icon: Code, name: 'JSON Formatter', description: 'Formats JSON', example: 'format json {"a":1}' },
    { category: 'utils', icon: Terminal, name: 'Base64 Encode', description: 'Encodes to Base64', example: 'base64 encode hello' },
    { category: 'utils', icon: Terminal, name: 'Base64 Decode', description: 'Decodes Base64', example: 'base64 decode aGVsbG8=' },
    { category: 'utils', icon: Scissors, name: 'Text Split', description: 'Splits text', example: 'split "a,b,c" by ,' },

    // --- Install (40+ commands) ---
    { category: 'install', icon: Package, name: 'Install Software', description: 'Shows install instructions', example: 'install vlc' },
    { category: 'install', icon: Package, name: 'Install via APT', description: 'Installs using apt', example: 'apt install firefox' },
    { category: 'install', icon: Package, name: 'Install via Snap', description: 'Installs snap package', example: 'snap install vlc' },
    { category: 'install', icon: Package, name: 'Install via Flatpak', description: 'Installs flatpak', example: 'flatpak install VLC' },
    { category: 'install', icon: Package, name: 'Install via Yum', description: 'Installs using yum', example: 'yum install nginx' },
    { category: 'install', icon: Package, name: 'Install via Pacman', description: 'Installs using pacman', example: 'pacman -S firefox' },
    { category: 'install', icon: Package, name: 'Install via Brew', description: 'Installs using Homebrew', example: 'brew install wget' },
    { category: 'install', icon: Package, name: 'Install via Pip', description: 'Installs Python package', example: 'pip install requests' },
    { category: 'install', icon: Package, name: 'Install via NPM', description: 'Installs Node package', example: 'npm install express' },
    { category: 'install', icon: Package, name: 'Install via Gem', description: 'Installs Ruby gem', example: 'gem install rails' },
    { category: 'install', icon: Package, name: 'Install via Cargo', description: 'Installs Rust crate', example: 'cargo install ripgrep' },
    { category: 'install', icon: Package, name: 'Install via Go', description: 'Installs Go package', example: 'go get package' },
    { category: 'install', icon: Download, name: 'Download Installer', description: 'Downloads installer', example: 'download chrome.deb' },
    { category: 'install', icon: Wrench, name: 'Build from Source', description: 'Shows build instructions', example: 'build vlc' },
    { category: 'install', icon: Code, name: 'Install Dev Tools', description: 'Installs dev tools', example: 'install gcc' },
    { category: 'install', icon: Database, name: 'Install Database', description: 'Installs MySQL', example: 'install mysql' },
    { category: 'install', icon: Package, name: 'Install Docker', description: 'Installs Docker', example: 'install docker' },
    { category: 'install', icon: Package, name: 'Install Docker Compose', description: 'Installs Docker Compose', example: 'install docker-compose' },
    { category: 'install', icon: Cloud, name: 'Install Kubernetes', description: 'Installs kubectl', example: 'install kubectl' },
    { category: 'install', icon: Terminal, name: 'Install Oh My Zsh', description: 'Installs Oh My Zsh', example: 'install ohmyzsh' },
    { category: 'install', icon: Paint, name: 'Install Themes', description: 'Installs desktop themes', example: 'install theme' },
    { category: 'install', icon: Cursor, name: 'Install Fonts', description: 'Installs fonts', example: 'install font Fira Code' },
    { category: 'install', icon: Speaker, name: 'Install Audio Drivers', description: 'Installs audio drivers', example: 'install audio drivers' },
    { category: 'install', icon: Printer, name: 'Install Printer Drivers', description: 'Installs printer drivers', example: 'install printer driver' },
    { category: 'install', icon: Wifi, name: 'Install Network Drivers', description: 'Installs network drivers', example: 'install wifi driver' },
    { category: 'install', icon: Shield, name: 'Install Antivirus', description: 'Installs antivirus', example: 'install clamav' },
    { category: 'install', icon: Fire, name: 'Install Firewall', description: 'Installs firewall', example: 'install ufw' },
    { category: 'install', icon: Lock, name: 'Install VPN', description: 'Installs VPN client', example: 'install openvpn' },
    { category: 'install', icon: Key, name: 'Install GPG', description: 'Installs GPG', example: 'install gpg' },
    { category: 'install', icon: Academic, name: 'Install LaTeX', description: 'Installs LaTeX', example: 'install texlive' },
    { category: 'install', icon: BookMarked, name: 'Install Man Pages', description: 'Installs man pages', example: 'install man pages' },
    { category: 'install', icon: Chart, name: 'Install Monitoring Tools', description: 'Installs htop', example: 'install htop' },
    { category: 'install', icon: Beaker, name: 'Install Science Tools', description: 'Installs scientific software', example: 'install numpy' },
    { category: 'install', icon: Gamepad2, name: 'Install Games', description: 'Installs games', example: 'install steam' },
    { category: 'install', icon: Video, name: 'Install Media Players', description: 'Installs VLC', example: 'install vlc' },
    { category: 'install', icon: Photo, name: 'Install Image Editors', description: 'Installs GIMP', example: 'install gimp' },
    { category: 'install', icon: Film, name: 'Install Video Editors', description: 'Installs Kdenlive', example: 'install kdenlive' },
    { category: 'install', icon: Music, name: 'Install Audio Editors', description: 'Installs Audacity', example: 'install audacity' },
    { category: 'install', icon: Code, name: 'Install IDEs', description: 'Installs VS Code', example: 'install vscode' },
    { category: 'install', icon: Gamepad2, name: 'Install Plugins', description: 'Installs plugins', example: 'install vscode plugin' },
  ];

  const categories = [
    { id: 'web', name: 'Web', icon: Globe },
    { id: 'apps', name: 'Apps', icon: Rocket },
    { id: 'system', name: 'System', icon: Monitor },
    { id: 'control', name: 'Control', icon: Settings },
    { id: 'files', name: 'Files', icon: FolderOpen },
    { id: 'utils', name: 'Utilities', icon: Wrench },
    { id: 'install', name: 'Install', icon: Package },
  ];

  const filteredCommands = commands.filter(cmd => cmd.category === selectedCategory);

  return (
    <div className="commands-list flex flex-col h-full">
      {/* Close button */}
      <div className="flex items-center justify-end mb-4 flex-shrink-0">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-300">✕</button>
      </div>

      {/* Recent Commands */}
      {recentCommands.length > 0 && (
        <div className="mb-4 flex-shrink-0">
          <div className="text-xs text-gray-500 mb-2 flex items-center">
            <Clock3 className="w-3 h-3 mr-1" />
            <span>Recent commands</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentCommands.map((cmd, index) => (
              <button
                key={index}
                onClick={() => handleQuickCommand(cmd)}
                className="px-3 py-1.5 bg-white/5 hover:bg-indigo-600/20 text-gray-300 hover:text-white rounded-lg text-xs transition-all"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category filters (fixed) */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <cat.icon className="w-5 h-5 text-white" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable commands grid */}
      <div className="overflow-y-auto flex-1 scrollbar-hide pr-1">
        <div className="grid grid-cols-1 gap-3">
          {filteredCommands.map((cmd, index) => (
            <div
              key={index}
              className={`bg-white/5 rounded-xl p-3 transition-all ${
                cmd.action ? 'hover:bg-indigo-900/20 cursor-pointer' : 'hover:bg-white/10'
              }`}
              onClick={() => cmd.action && handleCommandClick(cmd)}
            >
              <div className="flex items-start space-x-3">
                <span className="bg-indigo-900/20 p-2 rounded-lg inline-flex">
                  <cmd.icon className="w-7 h-7 text-white" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-semibold text-white flex items-center space-x-2">
                      <span>{cmd.name}</span>
                      {cmd.action && (
                        <span className="text-xs px-2 py-0.5 bg-green-600/20 text-green-400 rounded-full">
                          Launch
                        </span>
                      )}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-900/50 text-indigo-300">
                      {categories.find(c => c.id === cmd.category)?.name || cmd.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">{cmd.description}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <code className="text-xs bg-black/30 px-2 py-1 rounded text-gray-300 font-mono">
                      {cmd.example}
                    </code>
                    <div className="flex items-center space-x-1 ml-auto">
                      {/* Execute button */}
                      <button
                        onClick={(e) => handleExecute(cmd.example, e)}
                        className="text-xs transition-all px-2 py-1 rounded-lg flex items-center space-x-1 bg-green-600/20 text-green-400 hover:bg-green-600/30"
                        title="Execute this command"
                      >
                        <ExecuteIcon className="w-3 h-3" />
                        <span>Execute</span>
                      </button>
                      
                      {/* Copy button (only for non-action commands) */}
                      {!cmd.action && (
                        <button
                          onClick={(e) => handleCopy(index, cmd.example, e)}
                          className={`text-xs transition-all px-2 py-1 rounded-lg flex items-center space-x-1 ${
                            copiedId === index
                              ? 'bg-green-600 text-white'
                              : 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50'
                          }`}
                          title="Copy command"
                        >
                          {copiedId === index ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-xs text-center text-gray-400 flex-shrink-0">
        Click Execute to run • Copy to get notification
      </div>
    </div>
  );
}