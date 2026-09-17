import React, { useState, useEffect } from 'react';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Github, LayoutGrid, RefreshCw } from 'lucide-react';
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
  const [isSyncing, setIsSyncing] = useState(false);

  // Load from local storage on mount, then always sync
  useEffect(() => {
    const saved = localStorage.getItem('github_launcher_apps');
    if (saved) {
      try {
        setApps(JSON.parse(saved));
      } catch (e) {
        setApps([]);
      }
    }
    // Always sync automatically on load to ensure accuracy
    syncFromGitHub();
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
        let url = repo.homepage;
        if (!url) {
           // Fallback to strict github.io path if no homepage specified
           const ownerLogin = repo.owner?.login || GITHUB_USERNAME;
           url = `https://${ownerLogin}.github.io/${repo.name}`;
        }
        
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
      
      // GitHub is the ultimate source of truth, completely replace current state
      setApps(newApps);
      localStorage.setItem('github_launcher_apps', JSON.stringify(newApps));
    } catch (error) {
      console.error("Error syncing GitHub repos:", error);
    } finally {
      setIsSyncing(false);
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
              </motion.a>
            ))}
          </AnimatePresence>
        </div>
      </main>

      <OfflineIndicator />
    </div>
  );
}
