import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  Home,
  Users,
  Lock,
  ShieldCheck,
  Clock,
  Sparkles,
  ChevronRight,
  Cloud,
  RefreshCw
} from 'lucide-react';
import { UserProfile } from '../types';

interface TopbarProps {
  currentTabName: string;
  currentUser: UserProfile;
  sidebarCollapsed: boolean;
  onAdminUnlockClick: () => void;
  onHomeClick?: () => void;
  onSwitchFacultyClick?: () => void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'error' | 'idle';
  lastSyncTime?: string | null;
  onSyncNow?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTabName,
  currentUser,
  sidebarCollapsed,
  onAdminUnlockClick,
  onHomeClick,
  onSwitchFacultyClick,
  cloudSyncStatus = 'idle',
  lastSyncTime,
  onSyncNow
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const dateString = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      setCurrentTime(`${dateString} · ${timeString}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown menu if user clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header
      className={`
        fixed top-0 right-0 z-30 h-16
        ${sidebarCollapsed ? 'left-20' : 'left-64'}
        bg-[#0a0e17]/95 backdrop-blur-xl
        border-b border-white/[0.08]
        flex items-center justify-between px-3 sm:px-6
        transition-all duration-300 ease-in-out
      `}
    >
      {/* Left side: Navigation Breadcrumb & Title */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-inter truncate">
          <span className="text-slate-500 hidden md:inline">Narayana Prodigy</span>
          <span className="text-slate-600 hidden md:inline">/</span>
          <h1 className="font-grotesk font-bold text-xs sm:text-sm text-white tracking-wide truncate">
            {currentTabName}
          </h1>
        </div>
      </div>

      {/* Right side: Live Clock, Active User Badge & Hamburger Menu Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0" ref={menuRef}>
        {/* Live Clock (Desktop only) */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] font-mono text-[11px] text-slate-300">
          <Clock size={12} className="text-sky-400" />
          <span>{currentTime}</span>
        </div>

        {/* Current Active Role Badge */}
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-grotesk font-semibold text-slate-300">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="hidden sm:inline font-bold text-white">{currentUser.name}</span>
          <span className="text-sky-400 font-manrope text-[10px] uppercase">
            ({currentUser.role === 'admin' ? 'Admin' : currentUser.subject || 'Faculty'})
          </span>
        </div>

        {/* Cloud Sync Status Indicator & Manual Refresh Button */}
        {onSyncNow && (
          <button
            onClick={onSyncNow}
            disabled={cloudSyncStatus === 'syncing'}
            title={`Narayana Cloud Sync (${cloudSyncStatus === 'syncing' ? 'Syncing...' : lastSyncTime ? `Last updated ${lastSyncTime}` : 'All Teachers Connected'}) - Click to refresh latest timetable`}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-sky-500/10 border border-white/[0.08] hover:border-sky-500/30 text-xs transition cursor-pointer text-slate-300 group"
          >
            {cloudSyncStatus === 'syncing' ? (
              <RefreshCw size={13} className="text-amber-400 animate-spin" />
            ) : cloudSyncStatus === 'error' ? (
              <Cloud size={13} className="text-rose-400" />
            ) : (
              <Cloud size={13} className="text-emerald-400 group-hover:scale-110 transition" />
            )}
            <span className="hidden lg:inline font-manrope font-bold text-[10px] uppercase tracking-wider text-slate-300 group-hover:text-sky-300 transition">
              {cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Live Sync'}
            </span>
          </button>
        )}

        {/* ── HAMBURGER MENU BUTTON ── */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`
              p-2 sm:px-3.5 sm:py-2 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm
              ${isMenuOpen
                ? 'bg-sky-500/30 text-white border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 hover:text-white'
              }
            `}
            title="Open Quick Menu"
            aria-label="Navigation Menu"
          >
            {isMenuOpen ? <X size={18} className="text-sky-300" /> : <Menu size={18} className="text-sky-400" />}
            <span className="hidden sm:inline font-grotesk font-bold text-xs uppercase tracking-wider">
              Menu
            </span>
          </button>

          {/* ── HAMBURGER DROPDOWN PANEL ── */}
          {isMenuOpen && (
            <div className="absolute right-0 top-12 mt-2 w-72 sm:w-80 rounded-2xl bg-[#0c121e]/95 backdrop-blur-2xl border border-sky-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.7)] p-3 space-y-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2 border-b border-white/10">
                <span className="font-manrope font-extrabold text-[10px] text-sky-400 uppercase tracking-widest block">
                  Quick Navigation Hub
                </span>
                <p className="font-inter text-xs text-slate-300 mt-0.5 truncate">
                  Logged in as <span className="font-bold text-white">{currentUser.name}</span>
                </p>
              </div>

              {/* 1. SWITCH FACULTY OPTION */}
              {onSwitchFacultyClick && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSwitchFacultyClick();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                      <Users size={16} />
                    </div>
                    <div>
                      <div className="font-grotesk font-bold text-xs text-white group-hover:text-sky-300 transition">
                        Switch Faculty Profile
                      </div>
                      <div className="font-inter text-[10px] text-slate-400">
                        Change educator schedule & timetable
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-slate-500 group-hover:text-sky-400 transition" />
                </button>
              )}

              {/* 2. BACK TO HOME / LANDING PAGE OPTION */}
              {onHomeClick && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onHomeClick();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                      <Home size={16} />
                    </div>
                    <div>
                      <div className="font-grotesk font-bold text-xs text-white group-hover:text-amber-300 transition">
                        Back to Home
                      </div>
                      <div className="font-inter text-[10px] text-slate-400">
                        Return to Narayana Prodigy Landing Page
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-slate-500 group-hover:text-amber-400 transition" />
                </button>
              )}

              {/* 3. ADMIN DIRECTOR OPTION */}
              {currentUser.role === 'admin' ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div className="font-grotesk font-bold text-xs text-emerald-300">
                      Administrator Privileges Active
                    </div>
                    <div className="font-inter text-[10px] text-slate-400">
                      Full master editor & schedule authority
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onAdminUnlockClick();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/25 text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                      <Lock size={16} />
                    </div>
                    <div>
                      <div className="font-grotesk font-bold text-xs text-white group-hover:text-blue-300 transition">
                        Admin Login
                      </div>
                      <div className="font-inter text-[10px] text-slate-400">
                        Unlock master schedule editor privileges
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-slate-500 group-hover:text-blue-400 transition" />
                </button>
              )}

              {/* Footer Time Info */}
              <div className="pt-2 px-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{currentTime}</span>
                <span className="text-sky-400 font-semibold">Prodigy Portal</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
