import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpenCheck,
  Users,
  KeyRound,
  FolderKanban,
  Image,
  CalendarPlus,
  CloudCog,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  Lock
} from 'lucide-react';
import { ProdigyLogo } from './ProdigyLogo';
import { UserProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
  currentUser: UserProfile;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSwitchFacultyClick: () => void;
  onHomeClick?: () => void;
  onAdminClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  collapsed,
  onToggleCollapse,
  onSwitchFacultyClick,
  onHomeClick,
  onAdminClick
}) => {
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'faculty'] },
    { id: 'daily', label: 'Daily View', icon: CalendarDays, roles: ['admin', 'faculty'] },
    { id: 'timetable', label: 'Master Timetable', icon: BookOpenCheck, roles: ['admin', 'faculty'] },
    { id: 'faculty-view', label: 'Faculty View', icon: Users, roles: ['admin', 'faculty'] },
    { id: 'class-id', label: 'Class ID Alloc.', icon: KeyRound, roles: ['admin', 'faculty'] },
    { id: 'drive', label: 'Drive & Hub', icon: FolderKanban, roles: ['admin', 'faculty'] },
    { id: 'poster', label: 'Poster Studio', icon: Image, roles: ['admin'] },
    { id: 'schedule', label: 'Schedule Editor', icon: CalendarPlus, roles: ['admin'] },
    { id: 'backup', label: 'Backup Center', icon: CloudCog, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'faculty'] },
  ];

  const filteredMenuItems = allMenuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside
      className={`
        fixed left-0 top-0 bottom-0 z-40
        ${collapsed ? 'w-20' : 'w-64'}
        bg-[#0e131f]/95 backdrop-blur-2xl
        border-r border-white/[0.08]
        flex flex-col justify-between
        transition-all duration-300 ease-in-out
      `}
    >
      {/* Top Branding Section */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.08]">
          <div className="flex items-center gap-2 overflow-hidden">
            <ProdigyLogo size={collapsed ? 'sm' : 'sm'} showText={!collapsed} />
            {!collapsed && (
              <span className="text-[9px] font-mono font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                v4.2 PROD
              </span>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* User Role Info Banner */}
        <div className="p-2.5 mx-2 my-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold font-manrope text-[11px] flex-shrink-0">
            {currentUser.initials || currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-grotesk font-bold text-xs text-white truncate">
                {currentUser.name}
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                <ShieldCheck size={11} className={currentUser.role === 'admin' ? 'text-sky-400' : 'text-emerald-400'} />
                <span className="uppercase font-manrope font-semibold tracking-wider">
                  {currentUser.role === 'admin' ? 'Administrator' : `${currentUser.subject || 'Faculty'}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="px-2 space-y-1 mt-1 max-h-[calc(100vh-270px)] overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  font-grotesk text-xs tracking-wide transition-all cursor-pointer
                  ${isActive
                    ? 'bg-[#0072BC]/15 dark:bg-[#0072BC]/25 text-[#0072BC] dark:text-white border-l-2 border-[#0072BC] shadow-[0_2px_12px_rgba(0,114,188,0.15)] font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0072BC] dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.04] font-medium'
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={16} className={isActive ? 'text-[#0072BC] dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation Actions */}
      <div className="p-2 border-t border-slate-200 dark:border-white/[0.08] space-y-1.5">
        {/* Switch Faculty Profile */}
        <button
          onClick={onSwitchFacultyClick}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-800 dark:text-sky-200 hover:text-sky-950 dark:hover:text-white transition font-grotesk text-xs font-bold cursor-pointer shadow-sm"
          title={collapsed ? "Switch Faculty Profile" : undefined}
        >
          <Users size={15} className="text-[#0072BC] dark:text-sky-400 flex-shrink-0" />
          {!collapsed && <span>Switch Faculty</span>}
        </button>

        {/* Admin Login Button (if faculty) */}
        {currentUser.role !== 'admin' && onAdminClick && (
          <button
            onClick={onAdminClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/25 text-blue-800 dark:text-sky-200 hover:text-blue-950 dark:hover:text-white transition font-grotesk text-xs font-bold cursor-pointer shadow-sm"
            title={collapsed ? "Administrator Login" : undefined}
          >
            <Lock size={15} className="text-[#0072BC] dark:text-sky-300 flex-shrink-0" />
            {!collapsed && <span>Admin Login</span>}
          </button>
        )}

        {/* Return to Landing Page */}
        {onHomeClick && (
          <button
            onClick={onHomeClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition font-grotesk text-xs font-semibold cursor-pointer"
            title={collapsed ? "Back to Landing Page" : undefined}
          >
            <Home size={15} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />
            {!collapsed && <span>Landing Page</span>}
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
