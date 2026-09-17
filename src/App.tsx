import React, { useState, useEffect } from 'react';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Plus, X, ExternalLink, Github, LayoutGrid, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GitHubApp {
  id: string;
  name: string;
  url: string;
  color: string;
}

const COLORS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-500',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400',
  'from-rose-500 to-red-400',
  'from-indigo-500 to-blue-500',
];

const GITHUB_USERNAME = 'trevor3002';

export default function App() {
  const [apps, setApps] = useState<GitHubApp[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppUrl, setNewAppUrl] = useState('');

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('github_launcher_apps');
    if (saved) {
      try {
        setApps(JSON.parse(saved));
      } catch (e) {
        setApps([]);
      }
    } else {
      // If no apps saved, try to sync automatically
      syncFromGitHub();
    }
  }, []);

  // Save to local storage whenever apps change
  useEffect(() => {
    if (apps.length > 0) {
      localStorage.setItem('github_launcher_apps', JSON.stringify(apps));
    }
  }, [apps]);

  const syncFromGitHub = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`);
      if (!res.ok) throw new Error('Failed to fetch from GitHub');
      const data = await res.json();
      
      const pagesRepos = data.filter((repo: any) => repo.has_pages);
      
      const newApps: GitHubApp[] = pagesRepos.map((repo: any, index: number) => {
        let url = repo.homepage || `https://${repo.owner.login}.github.io/${repo.name}`;
        if (url && !url.startsWith('http')) {
          url = `https://${url}`;
        }
        
        return {
          id: repo.id.toString(),
          name: repo.name.replace(/[-_]/g, ' '),
          url: url,
          color: COLORS[index % COLORS.length],
        };
      });
      
      setApps(prevApps => {
        // Merge without duplicating existing URLs
        const existingUrls = new Set(prevApps.map(a => a.url));
        const uniqueNewApps = newApps.filter(a => !existingUrls.has(a.url));
        return [...prevApps, ...uniqueNewApps];
      });
    } catch (error) {
      console.error("Error syncing GitHub repos:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim() || !newAppUrl.trim()) return;
    
    // Ensure URL has protocol
    let finalUrl = newAppUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    const newApp: GitHubApp = {
      id: Date.now().toString(),
      name: newAppName.trim(),
      url: finalUrl,
      color: COLORS[apps.length % COLORS.length],
    };

    setApps([...apps, newApp]);
    setNewAppName('');
    setNewAppUrl('');
    setIsAdding(false);
  };

  const deleteApp = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newApps = apps.filter(app => app.id !== id);
    setApps(newApps);
    if (newApps.length === 0) {
      localStorage.removeItem('github_launcher_apps');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-20 selection:bg-blue-500/30">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <LayoutGrid className="w-5 h-5 text-blue-400" />
            <h1 className="font-semibold text-lg tracking-tight">Launcher</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={syncFromGitHub}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
              title={`Sync apps from @${GITHUB_USERNAME}`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Sync {GITHUB_USERNAME}</span>
            </button>
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {apps.map((app) => (
              <motion.a
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                key={app.id}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className={`w-16 h-16 rounded-2xl shadow-lg bg-gradient-to-br ${app.color} flex items-center justify-center text-white font-bold text-2xl shadow-black/20 group-hover:scale-105 transition-transform`}>
                  {app.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col items-center w-full">
                  <span className="text-sm font-medium text-slate-200 truncate w-full text-center">
                    {app.name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate w-full text-center flex items-center justify-center gap-1 mt-0.5">
                    <Github className="w-3 h-3" />
                    pages
                  </span>
                </div>
                
                {/* Delete button appears on hover/focus within group */}
                <button
                  onClick={(e) => deleteApp(app.id, e)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-slate-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-rose-400 hover:bg-slate-900 transition-all"
                  aria-label={`Remove ${app.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.a>
            ))}
          </AnimatePresence>

          {/* Add New Button */}
          <motion.button
            layout
            onClick={() => setIsAdding(true)}
            className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-slate-500 hover:bg-slate-800/30 transition-all text-slate-400 hover:text-slate-200 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus className="w-8 h-8" />
            </div>
            <span className="text-sm font-medium">Add App</span>
          </motion.button>
        </div>
      </main>

      {/* Add App Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setIsAdding(false)}
            />
            
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-white">Add GitHub Pages App</h2>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddApp} className="p-4 sm:p-6 space-y-4">
                <div>
                  <label htmlFor="appName" className="block text-sm font-medium text-slate-300 mb-1.5">
                    App Name
                  </label>
                  <input
                    id="appName"
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. My Portfolio"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="appUrl" className="block text-sm font-medium text-slate-300 mb-1.5">
                    GitHub Pages URL
                  </label>
                  <div className="relative">
                    <input
                      id="appUrl"
                      type="text"
                      required
                      placeholder="username.github.io/repo"
                      value={newAppUrl}
                      onChange={(e) => setNewAppUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                    <ExternalLink className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!newAppName.trim() || !newAppUrl.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all"
                  >
                    Add App
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <OfflineIndicator />
    </div>
  );
}
