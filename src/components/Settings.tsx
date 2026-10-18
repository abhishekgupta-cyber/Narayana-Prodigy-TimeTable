import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  ShieldCheck,
  Info,
  Check,
  Lock,
  Trash2,
  RotateCcw,
  RefreshCw,
  Database,
  KeyRound,
  Cpu
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { PortalSettings, UserProfile } from '../types';

interface SettingsProps {
  currentUser?: UserProfile;
  settings?: PortalSettings;
  onUpdateSettings?: (updates: Partial<PortalSettings>) => void;
  onUnlockAdmin?: () => void;
  onClearCancelledClasses?: () => number;
  onClearHolidayFlags?: () => number;
  onResetMasterData?: () => void;
  onTriggerRollingBackup?: () => void;
  onResetDailyLinks?: () => void;
}

const DEFAULT_SETTINGS: PortalSettings = {
  themeMode: 'dark',
  showSciParticles: true,
  blurIntensity: 20,
  soundEffects: true,
  autoRollingBackup: true,
  dailyLinkAutoReset: true,
  highCapacityMode: true
};

export const Settings: React.FC<SettingsProps> = ({
  currentUser,
  settings = DEFAULT_SETTINGS,
  onUpdateSettings,
  onUnlockAdmin,
  onClearCancelledClasses,
  onClearHolidayFlags,
  onResetMasterData,
  onTriggerRollingBackup,
  onResetDailyLinks
}) => {
  const [localSettings, setLocalSettings] = useState<PortalSettings>(settings);
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string>('');
  const [confirmResetDefault, setConfirmResetDefault] = useState<boolean>(false);

  // Sync localSettings whenever parent settings prop changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const isAdmin = currentUser?.role === 'admin';

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 4000);
  };

  const handleToggle = (key: keyof PortalSettings, value: any) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    if (key === 'themeMode') {
      localStorage.setItem('np_theme_mode', value);
    }
    if (onUpdateSettings) {
      onUpdateSettings({ [key]: value });
    }
  };

  const handleSaveSettings = () => {
    if (onUpdateSettings) {
      onUpdateSettings(localSettings);
    }
    showToast('All Portal & Administrative Settings saved and applied globally!');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword.trim()) return;
    handleToggle('adminPassword', newAdminPassword.trim().toUpperCase());
    localStorage.setItem('np_custom_admin_password', newAdminPassword.trim().toUpperCase());
    setNewAdminPassword('');
    showToast('Custom Admin Password updated! (Default "NARAYANA" also remains valid as master key).');
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-orbitron font-extrabold text-xl text-white tracking-wide">
            ADMINISTRATION & PORTAL SETTINGS
          </h2>
          <p className="font-inter text-slate-400 text-xs mt-1">
            Full administrative control panel, theme glassmorphism, rolling backup automation, and database maintenance
          </p>
        </div>

        {isAdmin ? (
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-manrope font-extrabold text-xs uppercase flex items-center gap-1.5">
            <ShieldCheck size={15} />
            <span>Administrator Full Access Active</span>
          </span>
        ) : (
          onUnlockAdmin && (
            <button
              onClick={onUnlockAdmin}
              className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 font-manrope font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer transition"
            >
              <Lock size={14} />
              <span>Unlock Admin Mode</span>
            </button>
          )
        )}
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-inter flex items-center gap-2 animate-in fade-in">
          <Check size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 1. ADMINISTRATIVE COMMAND & SYSTEM ACTIONS (FULLY FUNCTIONAL) */}
      <GlassCard className="p-6 space-y-4 border-sky-500/30" hover={false}>
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-sky-400" />
            <h3 className="font-grotesk font-bold text-sm text-white">
              Administrative Operations & Maintenance Suite
            </h3>
          </div>
          <span className="text-[10px] font-mono text-sky-400 uppercase">
            All Actions Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* Action 1: Trigger Rolling Backup */}
          <button
            type="button"
            onClick={() => {
              if (onTriggerRollingBackup) onTriggerRollingBackup();
              showToast('Manual Rolling Backup snapshot generated and stored in 7-day cycle!');
            }}
            className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-sky-500/15 border border-white/10 hover:border-sky-500/40 text-left transition cursor-pointer space-y-1"
          >
            <div className="flex items-center gap-2 font-grotesk font-bold text-white">
              <Database size={15} className="text-sky-400" />
              <span>Force Rolling Backup</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Immediately save current timetable to today's 7-day rolling slot
            </p>
          </button>

          {/* Action 2: Reset Daily Class Links */}
          <button
            type="button"
            onClick={() => {
              if (onResetDailyLinks) onResetDailyLinks();
              localStorage.removeItem('np_daily_link_reset_date');
              showToast('Daily Batch Meeting Links reset! Ready for fresh daily subject links.');
            }}
            className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-left transition cursor-pointer space-y-1"
          >
            <div className="flex items-center gap-2 font-grotesk font-bold text-white">
              <RefreshCw size={15} className="text-amber-400" />
              <span>Reset Daily Class Links</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Clear yesterday's batch links and rotate today's subjects
            </p>
          </button>

          {/* Action 3: Clear Cancelled Classes */}
          <button
            type="button"
            onClick={() => {
              const count = onClearCancelledClasses ? onClearCancelledClasses() : 0;
              showToast(`Purged ${count} cancelled session(s) from the active timetable.`);
            }}
            className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/40 text-left transition cursor-pointer space-y-1"
          >
            <div className="flex items-center gap-2 font-grotesk font-bold text-white">
              <Trash2 size={15} className="text-rose-400" />
              <span>Purge Cancelled Sessions</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Remove all cancelled classes to keep the weekly roster clean
            </p>
          </button>

          {/* Action 4: Clear All Holiday Flags */}
          <button
            type="button"
            onClick={() => {
              const count = onClearHolidayFlags ? onClearHolidayFlags() : 0;
              showToast(`Restored ${count} holiday-marked session(s) back to active status.`);
            }}
            className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/40 text-left transition cursor-pointer space-y-1"
          >
            <div className="flex items-center gap-2 font-grotesk font-bold text-white">
              <RotateCcw size={15} className="text-emerald-400" />
              <span>Clear Holiday Flags</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Unmark all declared class holidays and restore normal classes
            </p>
          </button>

          {/* Action 5: Reset Master Data */}
          {!confirmResetDefault ? (
            <button
              type="button"
              onClick={() => setConfirmResetDefault(true)}
              className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-left transition cursor-pointer space-y-1"
            >
              <div className="flex items-center gap-2 font-grotesk font-bold text-rose-300">
                <RotateCcw size={15} className="text-rose-400" />
                <span>Reset to Default Roster</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Restore factory Narayana Prodigy timetable & educator list
              </p>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 flex flex-col justify-between gap-2">
              <span className="text-[11px] text-rose-200 font-bold">
                Confirm resetting all data to factory defaults?
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmResetDefault(false)}
                  className="flex-1 py-1 rounded bg-white/10 text-slate-300 text-[11px] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onResetMasterData) onResetMasterData();
                    setConfirmResetDefault(false);
                    showToast('Master Schedule & Faculty Roster restored to factory defaults!');
                  }}
                  className="flex-1 py-1 rounded bg-rose-600 text-white text-[11px] font-bold uppercase cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}

          {/* Action 6: Update Admin Password */}
          <form onSubmit={handleSavePassword} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
            <div className="flex items-center gap-1.5 font-grotesk font-bold text-white">
              <KeyRound size={14} className="text-sky-400" />
              <span>Admin Access Key</span>
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="New Admin Passcode"
                className="flex-1 px-2.5 py-1 rounded-lg bg-[#0d121d] border border-white/10 text-white text-xs font-mono"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-[#0072BC] hover:bg-[#005fa3] text-white font-bold text-[11px] cursor-pointer"
              >
                Set
              </button>
            </div>
          </form>
        </div>
      </GlassCard>

      {/* 2. SCALABILITY, AUTOMATION & BACKUP ENGINE CONTROLS */}
      <GlassCard className="p-6 space-y-4" hover={false}>
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Cpu size={18} className="text-emerald-400" />
          <h3 className="font-grotesk font-bold text-sm text-white">
            Scale, 1-Year Retention & Automation Rules
          </h3>
        </div>

        <div className="space-y-4 font-inter text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-white">Automated Daily Morning Rolling Backup (7-Day Cycle)</div>
              <div className="text-slate-400 text-[11px]">
                Automatically generate morning backups (Mon–Sun) and rotate old week files to save storage
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.autoRollingBackup}
              onChange={(e) => handleToggle('autoRollingBackup', e.target.checked)}
              className="accent-emerald-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div>
              <div className="font-bold text-white">Dynamic Daily Meeting Link Auto-Reset</div>
              <div className="text-slate-400 text-[11px]">
                Automatically clear old daily batch links each morning so rotating subject links stay fresh
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.dailyLinkAutoReset}
              onChange={(e) => handleToggle('dailyLinkAutoReset', e.target.checked)}
              className="accent-sky-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div>
              <div className="font-bold text-white">High-Concurrency & 1-Year History Mode (100+ Users)</div>
              <div className="text-slate-400 text-[11px]">
                Optimize rendering and indexed storage for 365-day faculty response tracking across iOS, Android & Web
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.highCapacityMode}
              onChange={(e) => handleToggle('highCapacityMode', e.target.checked)}
              className="accent-sky-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      </GlassCard>

      {/* 3. APPEARANCE, THEME MODE & AUDIO CONTROLS */}
      <GlassCard className="p-6 space-y-4" hover={false}>
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            {localSettings.themeMode === 'light' ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} className="text-sky-400" />
            )}
            <h3 className="font-grotesk font-bold text-sm text-white">
              Global Theme (Dark / Light Mode), Glassmorphism & Audio Controls
            </h3>
          </div>
          <span className="text-[10px] font-mono text-sky-400 uppercase">
            Saved in localStorage
          </span>
        </div>

        <div className="space-y-4 font-inter text-xs">
          {/* Global Dark / Light Mode Interactive Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm">
            <div>
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Global Interface Theme Mode</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-extrabold border ${
                    localSettings.themeMode === 'light'
                      ? 'bg-sky-100 border-sky-300 text-sky-800'
                      : 'bg-sky-500/20 border-sky-500/30 text-sky-300'
                  }`}
                >
                  {localSettings.themeMode === 'light' ? 'Light Mode Active' : 'Dark Mode Active'}
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 font-medium">
                Switch between Cosmic Dark Mode and Academic Daylight Light Mode across the entire portal
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/90 dark:bg-[#0d121d] border border-slate-300/80 dark:border-white/10 self-start sm:self-center shadow-inner">
              <button
                type="button"
                onClick={() => {
                  handleToggle('themeMode', 'dark');
                  showToast('Switched to Cosmic Dark Mode (preference saved to localStorage).');
                }}
                className={`px-3.5 py-2 rounded-lg font-grotesk font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  localSettings.themeMode !== 'light'
                    ? 'bg-[#0072BC] text-white shadow-md ring-1 ring-sky-400/30'
                    : 'text-slate-700 dark:text-slate-400 hover:text-[#0072BC] dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-white/5'
                }`}
              >
                <Moon size={14} className={localSettings.themeMode !== 'light' ? 'text-white' : 'text-slate-600 dark:text-slate-400'} />
                <span>Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleToggle('themeMode', 'light');
                  showToast('Switched to Academic Light Mode (preference saved to localStorage).');
                }}
                className={`px-3.5 py-2 rounded-lg font-grotesk font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  localSettings.themeMode === 'light'
                    ? 'bg-[#0072BC] text-white shadow-md ring-1 ring-sky-400/30'
                    : 'text-slate-700 dark:text-slate-400 hover:text-[#0072BC] dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-white/5'
                }`}
              >
                <Sun size={14} className={localSettings.themeMode === 'light' ? 'text-white' : 'text-amber-500'} />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="font-bold text-white">Animated Scientific Vector Watermark</div>
              <div className="text-slate-400 text-[11px]">Display subtle academic watermark with formulas and geometry</div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.showSciParticles}
              onChange={(e) => handleToggle('showSciParticles', e.target.checked)}
              className="accent-sky-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div>
              <div className="font-bold text-white">Interactive Feedback Sounds</div>
              <div className="text-slate-400 text-[11px]">Play subtle audio feedback on task completion and note uploads</div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.soundEffects}
              onChange={(e) => handleToggle('soundEffects', e.target.checked)}
              className="accent-sky-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="space-y-2 pt-3 border-t border-white/5">
            <div className="flex justify-between">
              <span className="font-bold text-white">Glassmorphism Blur Radius ({localSettings.blurIntensity}px)</span>
              <span className="text-sky-400 font-mono">{localSettings.blurIntensity}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="32"
              value={localSettings.blurIntensity}
              onChange={(e) => handleToggle('blurIntensity', Number(e.target.value))}
              className="w-full accent-sky-500 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </GlassCard>

      {/* About Section */}
      <GlassCard className="p-6 space-y-3" hover={false}>
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Info size={18} className="text-sky-400" />
          <h3 className="font-grotesk font-bold text-sm text-white">About Narayana Prodigy</h3>
        </div>

        <div className="font-inter text-xs text-slate-300 space-y-1">
          <div>
            <span className="text-slate-400">Application Version:</span>{' '}
            <span className="font-mono text-white font-bold">v4.2.0 (Enterprise High-Concurrency Build)</span>
          </div>
          <div>
            <span className="text-slate-400">Multi-Device Compatibility:</span>{' '}
            <span className="text-emerald-400 font-bold">iOS, Android & Desktop Web (100+ Concurrent Users)</span>
          </div>
          <div>
            <span className="text-slate-400">Institution:</span>{' '}
            <span className="text-sky-400 font-bold">Narayana Group Academic Portal</span>
          </div>
        </div>
      </GlassCard>

      <button
        onClick={handleSaveSettings}
        className="px-6 py-3 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer"
      >
        <SettingsIcon size={16} />
        <span>Save & Apply All Preferences</span>
      </button>
    </div>
  );
};
