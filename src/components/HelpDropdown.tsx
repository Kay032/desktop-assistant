import { useState } from 'react';

interface Command {
  category: string;
  icon: string;
  name: string;
  description: string;
  example: string;
}

export function HelpDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const commands: Command[] = [
    // Websites
    { category: 'web', icon: '🌐', name: 'Open Website', description: 'Opens any website in your browser', example: 'youtube, github, google' },
    { category: 'web', icon: '🔍', name: 'Web Search', description: 'Searches the web for answers', example: 'who is the president?' },
    { category: 'web', icon: '📄', name: 'Preview', description: 'Shows webpage preview', example: 'preview example.com' },
    
    // Applications
    { category: 'apps', icon: '🚀', name: 'Launch App', description: 'Opens installed applications', example: 'chrome, firefox, terminal' },
    { category: 'apps', icon: '🎮', name: 'Games', description: 'Launches gaming apps', example: 'steam, discord, spotify' },
    { category: 'apps', icon: '📝', name: 'Editors', description: 'Opens code/text editors', example: 'code, sublime, notepad' },
    
    // System
    { category: 'system', icon: '💻', name: 'System Info', description: 'Shows detailed system info', example: 'system info' },
    { category: 'system', icon: '⚡', name: 'CPU Usage', description: 'Displays CPU usage', example: 'cpu' },
    { category: 'system', icon: '🧠', name: 'Memory', description: 'Shows RAM usage', example: 'memory' },
    { category: 'system', icon: '💾', name: 'Disk Space', description: 'Shows storage info', example: 'disk space' },
    { category: 'system', icon: '⏱️', name: 'Uptime', description: 'Shows system uptime', example: 'uptime' },
    { category: 'system', icon: '🔋', name: 'Battery', description: 'Shows battery status', example: 'battery' },
    { category: 'system', icon: '📋', name: 'Processes', description: 'Lists running processes', example: 'list processes' },
    { category: 'system', icon: '✂️', name: 'Kill Process', description: 'Terminates a process', example: 'kill process 1234' },
    
    // Control
    { category: 'control', icon: '⏻', name: 'Shutdown', description: 'Shuts down the computer', example: 'shutdown' },
    { category: 'control', icon: '🔄', name: 'Restart', description: 'Restarts the computer', example: 'restart' },
    { category: 'control', icon: '😴', name: 'Sleep', description: 'Puts computer to sleep', example: 'sleep' },
    { category: 'control', icon: '🔒', name: 'Lock', description: 'Locks the screen', example: 'lock' },
    
    // Files
    { category: 'files', icon: '🔍', name: 'Search Files', description: 'Finds files by name', example: 'search for report.pdf' },
    { category: 'files', icon: '🕒', name: 'Recent Files', description: 'Shows recent files', example: 'recent files' },
    { category: 'files', icon: '📂', name: 'Open Folder', description: 'Opens common folders', example: 'open downloads, open desktop' },
    
    // Utilities
    { category: 'utils', icon: '🧮', name: 'Calculator', description: 'Performs calculations', example: 'calculate 25 * 4' },
    { category: 'utils', icon: '🌤️', name: 'Weather', description: 'Shows weather forecast', example: 'weather London' },
    { category: 'utils', icon: '📝', name: 'Notes', description: 'Saves and retrieves notes', example: 'remember buy milk' },
    { category: 'utils', icon: '⏰', name: 'Timer', description: 'Sets a timer', example: 'timer 5 minutes' },
    { category: 'utils', icon: '🪙', name: 'Coin Flip', description: 'Flips a coin', example: 'flip coin' },
    { category: 'utils', icon: '🎲', name: 'Roll Dice', description: 'Rolls dice', example: 'roll dice' },
    { category: 'utils', icon: '🔐', name: 'Password', description: 'Generates a password', example: 'password 16' },
    
    // Install
    { category: 'install', icon: '📦', name: 'Install Software', description: 'Shows install instructions', example: 'install vlc' },
  ];

  const categories = [
    { id: 'all', name: 'All Commands', icon: '📋' },
    { id: 'web', name: 'Web', icon: '🌐' },
    { id: 'apps', name: 'Apps', icon: '🚀' },
    { id: 'system', name: 'System', icon: '💻' },
    { id: 'control', name: 'Control', icon: '⚙️' },
    { id: 'files', name: 'Files', icon: '📁' },
    { id: 'utils', name: 'Utilities', icon: '🧰' },
    { id: 'install', name: 'Install', icon: '📦' },
  ];

  const filteredCommands = commands.filter(cmd => {
    const matchesCategory = selectedCategory === 'all' || cmd.category === selectedCategory;
    const matchesSearch = cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cmd.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cmd.example.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-300"
      >
        <span className="text-lg">?</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[640px] glass-spotlight rounded-2xl overflow-hidden z-50 animate-fadeIn">
          {/* Header */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-3xl bg-indigo-900/30 p-2 rounded-xl">📚</span>
              <div>
                <h2 className="text-xl font-semibold text-white">Command Reference</h2>
                <p className="text-xs text-gray-400">Click any command to copy the example</p>
              </div>
            </div>
            
            <input
              type="text"
              placeholder="Search commands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            <div className="flex flex-wrap gap-2 mt-3">
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
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Commands List - WITH SCROLLBAR */}
          <div className="overflow-y-auto max-h-[400px] p-4 custom-scrollbar">
            <div className="grid grid-cols-1 gap-3">
              {filteredCommands.map((cmd, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-all cursor-default"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl bg-indigo-900/20 p-2 rounded-lg">{cmd.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="font-semibold text-white">{cmd.name}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-900/50 text-indigo-300">
                          {categories.find(c => c.id === cmd.category)?.name || cmd.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">{cmd.description}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <code className="text-xs bg-black/30 px-2 py-1 rounded text-gray-300 font-mono">
                          {cmd.example}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(cmd.example)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-all px-2 py-1 rounded-lg hover:bg-indigo-900/20"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/5 text-xs text-center text-gray-400 bg-black/20">
            <span>Type naturally or use these commands</span>
          </div>
        </div>
      )}
    </div>
  );
}