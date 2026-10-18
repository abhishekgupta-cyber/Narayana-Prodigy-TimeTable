import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Lock, X, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { SciBackground } from './components/SciBackground';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { LandingPage } from './components/LandingPage';
import { FacultySelection } from './components/FacultySelection';
import { Dashboard } from './components/Dashboard';
import { DailyView } from './components/DailyView';
import { MasterTimetable } from './components/MasterTimetable';
import { FacultyView } from './components/FacultyView';
import { ClassIdAllocation } from './components/ClassIdAllocation';
import { DriveHub } from './components/DriveHub';
import { PosterStudio } from './components/PosterStudio';
import { ScheduleEditor } from './components/ScheduleEditor';
import { BackupCenter } from './components/BackupCenter';
import { Settings } from './components/Settings';
import { GlassCard } from './components/GlassCard';

import {
  INITIAL_FACULTY_LIST,
  INITIAL_CLASSES,
  INITIAL_BATCH_FOLDERS,
  INITIAL_NOTICES
} from './data/mockData';
import centralSharedSchedule from './data/centralSharedSchedule.json';

import {
  UserProfile,
  Faculty,
  ClassSession,
  BatchFolder,
  CircularNotice,
  RollingBackupSlot,
  PortalSettings
} from './types';

import {
  isClassInWeek,
  normalizeFacultyName,
  deduplicateFacultyList,
  deduplicateClassesList,
  parseTimeToMinutes
} from './utils/weekUtils';

const DEFAULT_BATCH_LIST = [
  'NSEA_WORKSHOP',
  'MATH-A-HOLIC',
  'NSEB_WORKSHOP_BOTANY',
  'NSEB_WORKSHOP_ZOO',
  'NSEC_WORKSHOP',
  'NSEP_WORKSHOP',
  'SEHSS_CLASS',
  'NSEJS_WORKSHOP_BIO',
  'NSEJS_WORKSHOP_PHY',
  'NSEJS_WORKSHOP_CHEM',
  'NMTC_PRIMARY',
  'NMTC_SUB_JR.'
];

const DEFAULT_SETTINGS: PortalSettings = {
  themeMode: 'dark',
  showSciParticles: true,
  blurIntensity: 20,
  soundEffects: true,
  autoRollingBackup: true,
  dailyLinkAutoReset: true,
  highCapacityMode: true
};

export default function App() {
  // App View State: 'landing' | 'select-faculty' | 'portal'
  const [appStage, setAppStage] = useState<'landing' | 'select-faculty' | 'portal'>('landing');
  const [hasEnteredPortal, setHasEnteredPortal] = useState<boolean>(false);

  // Global Admin Unlock Modal State (Accessible anywhere from Topbar, Sidebar, or Faculty Selection)
  const [showGlobalAdminModal, setShowGlobalAdminModal] = useState<boolean>(false);
  const [adminModalInput, setAdminModalInput] = useState<string>('');
  const [adminModalError, setAdminModalError] = useState<string>('');
  const [adminModalShowPassword, setAdminModalShowPassword] = useState<boolean>(false);

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Portal Settings State
  const [portalSettings, setPortalSettings] = useState<PortalSettings>(() => {
    const savedTheme = localStorage.getItem('np_theme_mode') as 'dark' | 'light' | null;
    const saved = localStorage.getItem('np_portal_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          themeMode: savedTheme || parsed.themeMode || 'dark'
        };
      } catch (e) {}
    }
    return {
      ...DEFAULT_SETTINGS,
      themeMode: savedTheme || 'dark'
    };
  });

  // User Profile & Role State
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('np_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'admin' || (parsed.name && parsed.facultyId)) {
          return parsed;
        }
      } catch (e) {}
    }

    return {
      id: 'usr-fac-ac',
      name: 'Abhishek Chitnis Sir',
      role: 'faculty',
      subject: 'Astronomy',
      facultyId: 'fac-ac',
      initials: 'AC'
    };
  });

  // Dynamic Persisted Data State
  const [facultyList, setFacultyList] = useState<Faculty[]>(() => {
    const saved = localStorage.getItem('np_faculty_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const deduplicated = deduplicateFacultyList(parsed);
          if (deduplicated.length !== parsed.length) {
            localStorage.setItem('np_faculty_list', JSON.stringify(deduplicated));
          }
          return deduplicated;
        }
      } catch (e) {}
    }
    if (centralSharedSchedule && Array.isArray(centralSharedSchedule.facultyList) && centralSharedSchedule.facultyList.length > 0) {
      return deduplicateFacultyList(centralSharedSchedule.facultyList as Faculty[]);
    }
    return deduplicateFacultyList(INITIAL_FACULTY_LIST);
  });

  const [classes, setClasses] = useState<ClassSession[]>(() => {
    const saved = localStorage.getItem('np_classes_roster');
    if (saved) {
      try {
        const parsed: ClassSession[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return deduplicateClassesList(parsed);
        }
      } catch (e) {}
    }
    if (centralSharedSchedule && Array.isArray(centralSharedSchedule.classes) && centralSharedSchedule.classes.length > 0) {
      return deduplicateClassesList(centralSharedSchedule.classes as ClassSession[]);
    }
    return deduplicateClassesList(INITIAL_CLASSES);
  });

  const [customBatches, setCustomBatches] = useState<string[]>(() => {
    const saved = localStorage.getItem('np_custom_batches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return DEFAULT_BATCH_LIST;
  });

  const [batchFolders, setBatchFolders] = useState<BatchFolder[]>(INITIAL_BATCH_FOLDERS);
  const [notices] = useState<CircularNotice[]>(INITIAL_NOTICES);

  // 7-Day Rolling Backup State (Monday to Sunday slots — auto-rotates old Monday when new Monday arrives)
  const [rollingBackups, setRollingBackups] = useState<RollingBackupSlot[]>(() => {
    const saved = localStorage.getItem('np_rolling_backups_7day');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  // Available Batches combined across default, custom, and scheduled classes (never include dummy ALL_BATCH)
  const availableBatches = useMemo(() => {
    return Array.from(
      new Set(
        [
          ...DEFAULT_BATCH_LIST,
          ...customBatches,
          ...classes.map(c => c.batchName)
        ]
          .map(b => (b || '').trim())
          .filter(b => b && !/^all[-_\s]*batch/i.test(b) && b !== 'ALL' && b !== 'All Batches')
      )
    );
  }, [customBatches, classes]);

  // Persist User, Settings, Classes, Faculty, Batches
  useEffect(() => {
    localStorage.setItem('np_user_profile', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('np_portal_settings', JSON.stringify(portalSettings));
    localStorage.setItem('np_theme_mode', portalSettings.themeMode || 'dark');
    if (portalSettings.themeMode === 'light') {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
    } else {
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.remove('theme-light');
    }
  }, [portalSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('np_classes_roster', JSON.stringify(classes));
    } catch (e) {}
  }, [classes]);

  // ── CENTRALIZED CLOUD SYNCHRONIZATION (Cross-Device & Shared Faculty Data with Auth Security) ──
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'idle'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const isCloudInitialized = useRef(false);
  const syncTimeoutRef = useRef<any>(null);

  const getAuthToken = (): string => {
    return (
      sessionStorage.getItem('np_auth_token') ||
      localStorage.getItem('np_auth_token') ||
      `np_session_init_${Date.now()}`
    );
  };

  // Push latest timetable, faculty, and batches to server
  const pushToCloud = useCallback(async (
    targetClasses: ClassSession[],
    targetFaculty: Faculty[],
    targetBatches: string[]
  ) => {
    try {
      setCloudSyncStatus('syncing');
      const cleanBatches = targetBatches.filter(b => b && !/^all[-_\s]*batch/i.test(b));
      const res = await fetch('/api/shared-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          classes: targetClasses,
          facultyList: deduplicateFacultyList(targetFaculty),
          customBatches: cleanBatches
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCloudSyncStatus('synced');
        setLastSyncTime(
          data.updatedAt
            ? new Date(data.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : 'Just now'
        );
      } else {
        setCloudSyncStatus('error');
      }
    } catch (err) {
      console.warn('Cloud sync push error:', err);
      setCloudSyncStatus('error');
    }
  }, []);

  // Fetch shared timetable data from server
  const syncFromCloud = useCallback(async (isManual: boolean = false) => {
    try {
      setCloudSyncStatus('syncing');
      const res = await fetch('/api/shared-data', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.hasData && Array.isArray(data.classes) && data.classes.length > 0) {
          setClasses(data.classes);
          if (Array.isArray(data.facultyList) && data.facultyList.length > 0) {
            setFacultyList(deduplicateFacultyList(data.facultyList));
          }
          if (Array.isArray(data.customBatches) && data.customBatches.length > 0) {
            const clean = data.customBatches.filter((b: string) => b && !/^all[-_\s]*batch/i.test(b));
            setCustomBatches(clean);
          }
          setCloudSyncStatus('synced');
          setLastSyncTime(
            data.updatedAt
              ? new Date(data.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : 'Just now'
          );
          return;
        }
      }
      setCloudSyncStatus('synced');
    } catch (err) {
      console.warn('Cloud sync fetch error:', err);
      setCloudSyncStatus('error');
    }
  }, []);

  // Initial cloud load & background polling
  useEffect(() => {
    const initSync = async () => {
      try {
        setCloudSyncStatus('syncing');
        const res = await fetch('/api/shared-data', {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.hasData && Array.isArray(data.classes) && data.classes.length > 0) {
            setClasses(data.classes);
            if (Array.isArray(data.facultyList) && data.facultyList.length > 0) {
              setFacultyList(deduplicateFacultyList(data.facultyList));
            }
            if (Array.isArray(data.customBatches) && data.customBatches.length > 0) {
              const clean = data.customBatches.filter((b: string) => b && !/^all[-_\s]*batch/i.test(b));
              setCustomBatches(clean);
            }
            setCloudSyncStatus('synced');
            setLastSyncTime(
              data.updatedAt
                ? new Date(data.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : 'Just now'
            );
          } else {
            // Seed server if server has no data yet
            const currentClasses = (() => {
              const saved = localStorage.getItem('np_classes_roster');
              if (saved) {
                try {
                  const parsed = JSON.parse(saved);
                  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                } catch (e) {}
              }
              return INITIAL_CLASSES;
            })();
            const currentFac = (() => {
              const saved = localStorage.getItem('np_faculty_list');
              if (saved) {
                try {
                  const parsed = JSON.parse(saved);
                  if (Array.isArray(parsed) && parsed.length > 0) return deduplicateFacultyList(parsed);
                } catch (e) {}
              }
              return deduplicateFacultyList(INITIAL_FACULTY_LIST);
            })();
            pushToCloud(currentClasses, currentFac, DEFAULT_BATCH_LIST);
            setCloudSyncStatus('synced');
          }
        }
      } catch (err) {
        console.warn('Initial cloud sync error:', err);
        setCloudSyncStatus('error');
      } finally {
        isCloudInitialized.current = true;
      }
    };

    initSync();

    const handleFocus = () => syncFromCloud(false);
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(() => syncFromCloud(false), 25000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [pushToCloud, syncFromCloud]);

  // Debounced push to cloud when classes, facultyList, or customBatches change
  useEffect(() => {
    if (!isCloudInitialized.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      pushToCloud(classes, facultyList, customBatches);
    }, 800);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [classes, facultyList, customBatches, pushToCloud]);

  // Auto-discover any new faculty members present in classes and register them into facultyList
  useEffect(() => {
    if (!classes.length) return;

    setFacultyList(prev => {
      const knownIds = new Set(prev.map(f => f.id));
      const knownNorms = new Set(prev.map(f => normalizeFacultyName(f.name)));
      const newFacultiesToAdd: Faculty[] = [];

      // Distinct palettes for newly discovered faculty
      const colors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'];
      const borderColors = ['border-sky-500', 'border-purple-500', 'border-emerald-500', 'border-amber-500', 'border-pink-500', 'border-cyan-500', 'border-lime-500'];
      const badgeBgs = [
        'bg-sky-500/20 text-sky-300',
        'bg-purple-500/20 text-purple-300',
        'bg-emerald-500/20 text-emerald-300',
        'bg-amber-500/20 text-amber-300',
        'bg-pink-500/20 text-pink-300',
        'bg-cyan-500/20 text-cyan-300',
        'bg-lime-500/20 text-lime-300'
      ];

      classes.forEach(c => {
        if (!c.facultyName || c.facultyName.toLowerCase() === 'all educators' || c.facultyName.toLowerCase() === 'educator') return;
        const cleanName = c.facultyName.trim();
        const fnNorm = normalizeFacultyName(cleanName);
        if (!fnNorm) return;

        const candidateId = c.facultyId && !c.facultyId.startsWith('cls-') ? c.facultyId : `fac-custom-${fnNorm}`;

        // Strictly avoid duplicate ID or duplicate normalized name
        if (knownIds.has(candidateId) || knownNorms.has(fnNorm)) return;

        knownIds.add(candidateId);
        knownNorms.add(fnNorm);

        const initials = cleanName
          .split(/\s+/)
          .filter(w => !/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?|sir|mam|ma'am)$/i.test(w))
          .map(w => w[0]?.toUpperCase())
          .filter(Boolean)
          .slice(0, 2)
          .join('') || cleanName.slice(0, 2).toUpperCase();

        const colorIdx = (prev.length + newFacultiesToAdd.length) % colors.length;
        newFacultiesToAdd.push({
          id: candidateId,
          name: cleanName,
          subject: (c.subject as any) || 'General',
          initials: initials || 'NP',
          color: colors[colorIdx],
          borderColor: borderColors[colorIdx],
          badgeBg: badgeBgs[colorIdx],
          classesThisWeek: 0,
          email: `${fnNorm}@narayanagroup.com`
        });
      });

      if (newFacultiesToAdd.length === 0) return deduplicateFacultyList(prev);
      return deduplicateFacultyList([...prev, ...newFacultiesToAdd]);
    });
  }, [classes]);

  // Auto-reconcile any class sessions where facultyName or slotName belongs to a different educator than facultyId
  useEffect(() => {
    if (!facultyList.length || !classes.length) return;
    let changed = false;

    const reconciled = classes.map(cls => {
      if (cls.facultyName?.toLowerCase() === 'all educators' || cls.batchName === 'ALL_BATCHES') {
        if (cls.facultyId !== 'fac-holiday') {
          changed = true;
          return { ...cls, facultyId: 'fac-holiday' };
        }
        return cls;
      }

      const nameNorm = normalizeFacultyName(cls.facultyName);
      const slotParenMatch = cls.slotName?.match(/\(([^)]+)\)/);
      const slotNorm = slotParenMatch ? normalizeFacultyName(slotParenMatch[1]) : '';

      // Find educator by EXACT normalized name first
      let matchedFac = facultyList.find(f => normalizeFacultyName(f.name) === nameNorm);
      // If not found by exact name, check slotName parentheses ONLY if it strictly matches a known educator
      if (!matchedFac && slotNorm) {
        matchedFac = facultyList.find(f => normalizeFacultyName(f.name) === slotNorm);
      }

      if (matchedFac && (cls.facultyId !== matchedFac.id || cls.facultyName !== matchedFac.name)) {
        changed = true;
        return {
          ...cls,
          facultyId: matchedFac.id,
          facultyName: matchedFac.name,
          slotName: cls.slotName || `${cls.batchName} (${matchedFac.name.toUpperCase()})`
        };
      }
      return cls;
    });

    if (changed) {
      setClasses(reconciled);
    }
  }, [facultyList, classes]);

  useEffect(() => {
    try {
      localStorage.setItem('np_faculty_list', JSON.stringify(deduplicateFacultyList(facultyList)));
    } catch (e) {}
  }, [facultyList]);

  useEffect(() => {
    try {
      localStorage.setItem('np_custom_batches', JSON.stringify(customBatches));
    } catch (e) {}
  }, [customBatches]);

  // Trigger a 7-Day Rolling Backup Slot (replaces same weekday slot from previous week so max 7 slots exist)
  const triggerRollingBackupSnapshot = useCallback(
    (snapshotClasses: ClassSession[], typeLabel: RollingBackupSlot['type'] = 'Morning Auto-Backup') => {
      const dayNames: RollingBackupSlot['dayName'][] = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ];
      const now = new Date();
      const todayISO = now.toISOString().slice(0, 10);
      const todayDayName = dayNames[now.getDay()];
      const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const sizeKb = Math.max(12, Math.round(JSON.stringify(snapshotClasses).length / 1024));

      const newSlot: RollingBackupSlot = {
        id: `rb-${todayDayName.toLowerCase()}-${todayISO}`,
        dayName: todayDayName,
        dateISO: todayISO,
        timestamp: `${todayISO} • ${timeFormatted}`,
        size: `${sizeKb} KB`,
        recordCount: snapshotClasses.length,
        status: 'Success',
        type: typeLabel,
        classesSnapshot: snapshotClasses
      };

      setRollingBackups(prev => {
        // Remove any previous week's backup for the SAME dayName (7-day rolling window: new Monday overwrites old Monday)
        const filtered = prev.filter(item => item.dayName !== todayDayName);
        const updated = [newSlot, ...filtered].slice(0, 7);
        try {
          localStorage.setItem('np_rolling_backups_7day', JSON.stringify(updated));
          localStorage.setItem('np_last_morning_backup_date', todayISO);
        } catch (e) {}
        return updated;
      });
    },
    []
  );

  // Automatic Daily Morning Rolling Backup Check on App Load
  useEffect(() => {
    if (!portalSettings.autoRollingBackup) return;
    const todayISO = new Date().toISOString().slice(0, 10);
    const lastBackupDate = localStorage.getItem('np_last_morning_backup_date');
    if (lastBackupDate !== todayISO || rollingBackups.length === 0) {
      triggerRollingBackupSnapshot(classes, 'Morning Auto-Backup');
    }
  }, [portalSettings.autoRollingBackup, classes, rollingBackups.length, triggerRollingBackupSnapshot]);

  // Support direct Admin unlock modal trigger (?mode=admin or ?admin=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || params.get('role');
    const admin = params.get('admin');
    if (mode === 'admin' || admin === 'true') {
      setShowGlobalAdminModal(true);
    }
  }, []);

  // Handlers with Backend Auth Token Generation
  const handleSelectUser = async (user: UserProfile) => {
    setCurrentUser(user);
    setHasEnteredPortal(true);
    setAppStage('portal');

    // Secure backend authentication for faculty
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'faculty',
          facultyId: user.facultyId,
          name: user.name,
          subject: user.subject,
          initials: user.initials
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          sessionStorage.setItem('np_auth_token', data.token);
          localStorage.setItem('np_auth_token', data.token);
        }
      }
    } catch (e) {}
  };

  const handleAdminPinSuccess = async () => {
    const adminUser: UserProfile = {
      id: 'usr-admin',
      name: 'Admin Director',
      role: 'admin',
      initials: 'AD'
    };
    setCurrentUser(adminUser);
    setHasEnteredPortal(true);
    setAppStage('portal');
    setShowGlobalAdminModal(false);
    setAdminModalInput('');
    setAdminModalError('');

    // Secure backend authentication for admin director
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'admin',
          password: 'NARAYANA'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          sessionStorage.setItem('np_auth_token', data.token);
          localStorage.setItem('np_auth_token', data.token);
        }
      }
    } catch (e) {}
  };

  const handleGlobalAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = adminModalInput.trim().toUpperCase();
    const SINGLE_ADMIN_PASSWORD = 'NARAYANA';
    const customSavedPass = localStorage.getItem('np_custom_admin_password');

    if (
      cleanInput === SINGLE_ADMIN_PASSWORD ||
      (customSavedPass && cleanInput === customSavedPass.toUpperCase())
    ) {
      handleAdminPinSuccess();
    } else {
      setAdminModalError('Incorrect Password. Access Denied.');
    }
  };

  const handleUpdateClassStatus = (classId: string, updates: Partial<ClassSession>) => {
    setClasses(prev => prev.map(c => (c.id === classId ? { ...c, ...updates } : c)));
  };

  const buildClassSessionObject = (sessionData: Partial<ClassSession>, indexOffset: number = 0): ClassSession => {
    const rawBatch = (sessionData.batchName || 'NSEA_WORKSHOP').trim();
    // CRITICAL: Never allow a class session to have batchName === 'ALL_BATCHES' or 'ALL BATCH'
    const bName = /^all[-_\s]*batch/i.test(rawBatch) ? 'NSEA_WORKSHOP' : rawBatch;
    const sortedFaculty = [...facultyList].sort((a, b) => b.name.length - a.name.length);

    let resolvedFac = facultyList.find(f => f.id === sessionData.facultyId);
    if (sessionData.facultyName) {
      const targetNorm = normalizeFacultyName(sessionData.facultyName);
      // Strictly match exact normalized name first
      const byExactName = sortedFaculty.find(f => normalizeFacultyName(f.name) === targetNorm);
      if (byExactName) {
        resolvedFac = byExactName;
      }
    }

    const fName = (resolvedFac?.name || sessionData.facultyName || 'Educator').trim();
    const fId =
      sessionData.facultyName?.toLowerCase() === 'all educators'
        ? 'fac-holiday'
        : resolvedFac?.id ||
          sessionData.facultyId ||
          `fac-custom-${normalizeFacultyName(fName) || 'guest'}`;

    return {
      id: sessionData.id || `cls-${Date.now()}-${indexOffset}-${Math.random().toString(36).slice(2, 6)}`,
      day: sessionData.day || 'Monday',
      dateStr: sessionData.dateStr || 'Sep 28, 2026',
      dateISO: sessionData.dateISO || '2026-09-28',
      startTime: sessionData.startTime || '05:00 PM',
      endTime: sessionData.endTime || '05:55 PM',
      slotName: sessionData.slotName || `${bName} (${fName.toUpperCase()})`,
      subject: sessionData.subject || resolvedFac?.subject || 'Physics',
      facultyId: fId,
      facultyName: fName,
      batchName: bName,
      roomNo: sessionData.roomNo || bName, // Batch Name replaces Room
      classType: sessionData.classType || 'class',
      isCancelled: sessionData.isCancelled || false,
      cancellationReason: sessionData.cancellationReason,
      isHoliday: sessionData.isHoliday || false,
      holidayTitle: sessionData.holidayTitle,
      zoomMeetingId: sessionData.zoomMeetingId || '',
      zoomPassword: sessionData.zoomPassword || '',
      notesStatus: sessionData.notesStatus || (sessionData.notesUrl ? 'uploaded' : 'pending'),
      notesUrl: sessionData.notesUrl,
      taskComplete: sessionData.taskComplete || false
    };
  };

  const handleAddClassSession = (sessionData: Partial<ClassSession>) => {
    const newCls = buildClassSessionObject(sessionData, 0);

    setClasses(prev => {
      let replaced = false;
      const targetTimeMinutes = parseTimeToMinutes(newCls.startTime);

      const updated = prev.map(c => {
        const batchMatches = (c.batchName || '').trim().toUpperCase() === (newCls.batchName || '').trim().toUpperCase();
        const dateMatches = (c.dateISO && newCls.dateISO && c.dateISO === newCls.dateISO) ||
                            ((!c.dateISO || !newCls.dateISO) && c.day === newCls.day);
        const timeMatches = parseTimeToMinutes(c.startTime) === targetTimeMinutes;

        if (batchMatches && dateMatches && timeMatches) {
          replaced = true;
          // Cleanly replace old entry with latest uploaded data!
          return {
            ...c,
            ...newCls,
            id: c.id // maintain stable React key
          };
        }
        return c;
      });

      if (replaced) {
        return deduplicateClassesList(updated);
      }
      return deduplicateClassesList([newCls, ...prev]);
    });

    if (newCls.batchName && !customBatches.includes(newCls.batchName)) {
      setCustomBatches(prev => [...prev, newCls.batchName]);
    }
  };

  const handleBulkAddClasses = (sessions: Partial<ClassSession>[]) => {
    const created = sessions.map((s, idx) => buildClassSessionObject(s, idx));

    setClasses(prev => {
      const combined = [...prev];

      created.forEach(newCls => {
        const targetTimeMinutes = parseTimeToMinutes(newCls.startTime);

        const existingIdx = combined.findIndex(c => {
          const batchMatches = (c.batchName || '').trim().toUpperCase() === (newCls.batchName || '').trim().toUpperCase();
          const dateMatches = (c.dateISO && newCls.dateISO && c.dateISO === newCls.dateISO) ||
                              ((!c.dateISO || !newCls.dateISO) && c.day === newCls.day);
          const timeMatches = parseTimeToMinutes(c.startTime) === targetTimeMinutes;
          return batchMatches && dateMatches && timeMatches;
        });

        if (existingIdx !== -1) {
          // Replace old duplicate with the latest upload, maintaining 1 clean single entry!
          combined[existingIdx] = {
            ...combined[existingIdx],
            ...newCls,
            id: combined[existingIdx].id
          };
        } else {
          combined.push(newCls);
        }
      });

      return deduplicateClassesList(combined);
    });

    // Also auto-add any new batches to customBatches
    const incomingBatches = created
      .map(c => c.batchName)
      .filter(b => b && !/^all[-_\s]*batch/i.test(b));

    if (incomingBatches.length > 0) {
      setCustomBatches(prev => Array.from(new Set([...prev, ...incomingBatches])));
    }
  };

  const handleDeleteClassSession = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
  };

  // Delete Entire Week's Timetable to allow clean re-upload without clash
  const handleDeleteWeekClasses = (weekId: string): number => {
    let removedCount = 0;
    setClasses(prev => {
      const remaining = prev.filter(c => {
        const match = isClassInWeek(c, weekId);
        if (match) removedCount += 1;
        return !match;
      });
      return remaining;
    });
    return removedCount;
  };

  // Batch Management Handlers (Add New Batch & Rename / Typo Fix across entire system)
  const handleAddBatch = (newBatchName: string) => {
    const clean = newBatchName.trim().toUpperCase();
    if (!clean || /^all[-_\s]*batch/i.test(clean)) return;
    setCustomBatches(prev => (prev.includes(clean) ? prev : [...prev, clean]));
  };

  const handleRenameBatch = (oldBatchName: string, newBatchName: string) => {
    const cleanOld = oldBatchName.trim();
    const cleanNew = newBatchName.trim().toUpperCase();
    if (!cleanOld || !cleanNew || cleanOld === cleanNew || /^all[-_\s]*batch/i.test(cleanNew)) return;

    // 1. Update customBatches list
    setCustomBatches(prev => prev.map(b => (b === cleanOld ? cleanNew : b)));

    // 2. Update all scheduled classes with this batchName
    setClasses(prev =>
      prev.map(c =>
        c.batchName === cleanOld
          ? {
              ...c,
              batchName: cleanNew,
              roomNo: cleanNew,
              slotName: c.slotName?.replace(cleanOld, cleanNew) || `${cleanNew} (${c.facultyName})`
            }
          : c
      )
    );

    // 3. Also sync stored Zoom Batch IDs in localStorage if present
    try {
      const savedZoom = localStorage.getItem('np_zoom_batches');
      if (savedZoom) {
        const parsed = JSON.parse(savedZoom);
        if (Array.isArray(parsed)) {
          const updatedZoom = parsed.map((zb: any) =>
            zb.batchName === cleanOld ? { ...zb, batchName: cleanNew } : zb
          );
          localStorage.setItem('np_zoom_batches', JSON.stringify(updatedZoom));
        }
      }
    } catch (e) {}
  };

  // Declare Holiday on a specific Date:
  // - "ALL BATCH": declares holiday across ALL active batches on that date.
  // - "SINGLE BATCH": declares holiday ONLY for that specific batch; all other batches run normally!
  // - NEVER creates a dummy batch named "ALL_BATCH"!
  const handleDeclareDateHoliday = (
    dateISO: string,
    batchTarget: string,
    holidayTitle: string
  ): number => {
    let affected = 0;
    const parts = dateISO.split('-').map(Number);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
    const targetDayName =
      parts.length === 3 ? dayNames[new Date(parts[0], parts[1] - 1, parts[2]).getDay()] : 'Monday';

    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const formattedDateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const cleanTitle = holidayTitle?.trim() || 'Academic Institute Holiday';

    const isAllBatches = batchTarget === 'ALL_BATCHES' || /^all[-_\s]*batch/i.test(batchTarget);
    // Real active batch list (never include dummy ALL_BATCH)
    const targetBatchList = isAllBatches
      ? availableBatches.filter(b => b && !/^all[-_\s]*batch/i.test(b))
      : [batchTarget];

    setClasses(prev => {
      // Step 1: Update existing classes that match the date and target batch(es)
      const updatedExisting = prev.map(c => {
        const dateMatches = c.dateISO === dateISO || (!c.dateISO && c.day === targetDayName);
        const batchMatches = isAllBatches || c.batchName === batchTarget;

        if (dateMatches && batchMatches) {
          affected += 1;
          return {
            ...c,
            isHoliday: true,
            holidayTitle: cleanTitle,
            isCancelled: true,
            cancellationReason: `HOLIDAY: ${cleanTitle}`
          };
        }
        return c;
      });

      // Step 2: Ensure EVERY target batch has a holiday slot on that date!
      // If a batch had no class scheduled on that date, create a dedicated holiday slot for that batch.
      const batchesWithHoliday = new Set<string>();
      updatedExisting.forEach(c => {
        const dateMatches = c.dateISO === dateISO || (!c.dateISO && c.day === targetDayName);
        if (dateMatches && c.isHoliday && c.batchName) {
          batchesWithHoliday.add(c.batchName);
        }
      });

      const missingBatches = targetBatchList.filter(b => !batchesWithHoliday.has(b));
      const newHolidaySlots: ClassSession[] = missingBatches.map((bName, idx) => ({
        id: `cls-holiday-${dateISO}-${bName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${idx}`,
        day: targetDayName as any,
        dateStr: formattedDateStr,
        dateISO: dateISO,
        startTime: 'FULL DAY',
        endTime: 'HOLIDAY',
        slotName: `HOLIDAY (${cleanTitle.toUpperCase()})`,
        subject: 'General',
        facultyId: 'fac-holiday',
        facultyName: 'All Educators',
        batchName: bName,
        roomNo: bName,
        classType: 'class',
        isHoliday: true,
        holidayTitle: cleanTitle,
        isCancelled: true,
        cancellationReason: `HOLIDAY: ${cleanTitle}`,
        notesStatus: 'completed',
        taskComplete: true
      }));

      affected += newHolidaySlots.length;
      return deduplicateClassesList([...newHolidaySlots, ...updatedExisting]);
    });

    return affected;
  };

  // Faculty Management Handlers - classes remain completely independent and protected
  const handleAddFaculty = (newFac: Faculty) => {
    setFacultyList(prev => deduplicateFacultyList([...prev, newFac]));
  };

  const handleUpdateFaculty = (facId: string, updates: Partial<Faculty>) => {
    setFacultyList(prev => prev.map(f => (f.id === facId ? { ...f, ...updates } : f)));
    if (updates.name) {
      setClasses(prev =>
        prev.map(c => (c.facultyId === facId ? { ...c, facultyName: updates.name! } : c))
      );
    }
  };

  const handleDeleteFaculty = (facId: string) => {
    setFacultyList(prev => prev.filter(f => f.id !== facId));
    // Scheduled classes remain 100% intact and undamaged
    setClasses(prev =>
      prev.map(c => {
        if (c.facultyId === facId) {
          return {
            ...c,
            facultyName: c.facultyName || 'Visiting Educator'
          };
        }
        return c;
      })
    );

    if (currentUser.facultyId === facId) {
      const adminFallback: UserProfile = {
        id: 'usr-admin',
        name: 'Admin Director',
        role: 'admin',
        initials: 'AD'
      };
      setCurrentUser(adminFallback);
    }
  };

  // Drive Hub Handlers
  const handleUpdateFolderUrl = (folderId: string, newUrl: string) => {
    setBatchFolders(prev => prev.map(f => (f.id === folderId ? { ...f, driveUrl: newUrl } : f)));
  };

  const handleUpdateFolderDetails = (folderId: string, updates: Partial<BatchFolder>) => {
    setBatchFolders(prev => prev.map(f => (f.id === folderId ? { ...f, ...updates } : f)));
  };

  const handleAddFolder = (newFolder: BatchFolder) => {
    setBatchFolders(prev => [newFolder, ...prev]);
  };

  const handleDeleteFolder = (folderId: string) => {
    setBatchFolders(prev => prev.filter(f => f.id !== folderId));
  };

  const handleRestoreBackup = (newClasses: ClassSession[]) => {
    setClasses(newClasses);
  };

  // Settings Administrative Maintenance Handlers
  const handleUpdateSettings = (updates: Partial<PortalSettings>) => {
    setPortalSettings(prev => ({ ...prev, ...updates }));
  };

  const handleClearCancelledClasses = (): number => {
    let count = 0;
    setClasses(prev =>
      prev.map(c => {
        if (c.isCancelled) {
          count += 1;
          return { ...c, isCancelled: false, cancellationReason: undefined };
        }
        return c;
      })
    );
    return count;
  };

  const handleClearHolidayFlags = (): number => {
    let count = 0;
    setClasses(prev =>
      prev.map(c => {
        if (c.isHoliday) {
          count += 1;
          return {
            ...c,
            isHoliday: false,
            holidayTitle: undefined,
            isCancelled: false,
            cancellationReason: undefined
          };
        }
        return c;
      })
    );
    return count;
  };

  const handleResetMasterData = () => {
    setClasses(INITIAL_CLASSES);
    setFacultyList(INITIAL_FACULTY_LIST);
    setCustomBatches(DEFAULT_BATCH_LIST);
    localStorage.removeItem('np_classes_roster');
    localStorage.removeItem('np_faculty_list');
    localStorage.removeItem('np_custom_batches');
  };

  const handleResetDailyLinks = () => {
    try {
      const savedZoom = localStorage.getItem('np_zoom_batches');
      if (savedZoom) {
        const parsed = JSON.parse(savedZoom);
        if (Array.isArray(parsed)) {
          const cleared = parsed.map((b: any) => ({ ...b, directUrl: undefined }));
          localStorage.setItem('np_zoom_batches', JSON.stringify(cleared));
        }
      }
    } catch (e) {}
  };

  const tabNames: Record<string, string> = {
    'dashboard': 'Dashboard Command Center',
    'daily': 'Daily Schedule View',
    'timetable': 'Master Timetable Roster',
    'faculty-view': 'Faculty Schedule & Workload Analytics',
    'class-id': 'Class ID Allocation & QR',
    'drive': 'Drive Hub & Resource Links',
    'poster': 'Academic Poster Studio',
    'schedule': 'Master Schedule Editor',
    'backup': '7-Day Rolling Backup & Scale Center',
    'settings': 'Administration & Portal Settings'
  };

  return (
    <div
      className={`min-h-screen ${
        portalSettings.themeMode === 'light'
          ? 'theme-light bg-[#f1f5f9] text-slate-900'
          : 'theme-dark bg-[#070b14] text-slate-100'
      } relative overflow-hidden font-inter selection:bg-sky-500 selection:text-white transition-colors duration-300`}
    >
      {/* Sci-Fi Floating Animated Vector Canvas */}
      {portalSettings.showSciParticles && <SciBackground themeMode={portalSettings.themeMode} />}

      {/* STAGE 1: LANDING PAGE */}
      {appStage === 'landing' && (
        <LandingPage
          onProceed={() => setAppStage('select-faculty')}
          facultyList={facultyList}
          classes={classes}
          onSelectFaculty={(fac) => {
            const user: UserProfile = {
              id: `usr-${fac.id}`,
              name: fac.name,
              role: 'faculty',
              subject: fac.subject,
              facultyId: fac.id,
              initials: fac.initials
            };
            handleSelectUser(user);
          }}
        />
      )}

      {/* STAGE 2: FACULTY / ROLE SELECTION */}
      {appStage === 'select-faculty' && (
        <FacultySelection
          facultyList={facultyList}
          onSelectUser={handleSelectUser}
          onAdminPinSuccess={handleAdminPinSuccess}
          onBackToLanding={() => setAppStage('landing')}
          onBackToPortal={() => setAppStage('portal')}
          canReturnToPortal={hasEnteredPortal}
        />
      )}

      {/* STAGE 3: MAIN PORTAL INTERFACE */}
      {appStage === 'portal' && (
        <div className="relative z-10 flex min-h-screen">
          {/* Sidebar with Navigation and Quick Return / Admin Buttons */}
          <Sidebar
            currentTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId)}
            currentUser={currentUser}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onSwitchFacultyClick={() => setAppStage('select-faculty')}
            onHomeClick={() => setAppStage('landing')}
            onAdminClick={() => setShowGlobalAdminModal(true)}
          />

          {/* Topbar with Direct Home, Switch Faculty, and Admin Login Access */}
          <Topbar
            currentTabName={tabNames[activeTab] || 'Academic Portal'}
            currentUser={currentUser}
            sidebarCollapsed={sidebarCollapsed}
            onAdminUnlockClick={() => setShowGlobalAdminModal(true)}
            onHomeClick={() => setAppStage('landing')}
            onSwitchFacultyClick={() => setAppStage('select-faculty')}
            cloudSyncStatus={cloudSyncStatus}
            lastSyncTime={lastSyncTime}
            onSyncNow={() => syncFromCloud(true)}
          />

          {/* Main Workspace Content Area */}
          <main
            className={`
              flex-1 pt-22 px-4 sm:px-8 pb-12
              ${sidebarCollapsed ? 'ml-20' : 'ml-64'}
              transition-all duration-300 ease-in-out
            `}
          >
            {activeTab === 'dashboard' && (
              <Dashboard
                classes={classes}
                currentUser={currentUser}
                notices={notices}
                facultyList={facultyList}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onUpdateClassStatus={handleUpdateClassStatus}
                onDeleteClassSession={handleDeleteClassSession}
                onSwitchFacultyClick={() => setAppStage('select-faculty')}
                onAdminLogin={() => setShowGlobalAdminModal(true)}
                onHomeClick={() => setAppStage('landing')}
              />
            )}

            {activeTab === 'daily' && (
              <DailyView
                classes={classes}
                currentUser={currentUser}
                facultyList={facultyList}
                availableBatches={availableBatches}
                onUpdateClassStatus={handleUpdateClassStatus}
                onDeleteClassSession={handleDeleteClassSession}
              />
            )}

            {activeTab === 'timetable' && (
              <MasterTimetable
                classes={classes}
                facultyList={facultyList}
                onUpdateClassStatus={handleUpdateClassStatus}
                onDeleteClassSession={handleDeleteClassSession}
              />
            )}

            {activeTab === 'faculty-view' && (
              <FacultyView
                facultyList={facultyList}
                classes={classes}
                currentUser={currentUser}
                availableBatches={availableBatches}
                onAddClassSession={handleAddClassSession}
                onUpdateClassStatus={handleUpdateClassStatus}
                onDeleteClassSession={handleDeleteClassSession}
                onAddFaculty={handleAddFaculty}
                onUpdateFaculty={handleUpdateFaculty}
                onDeleteFaculty={handleDeleteFaculty}
              />
            )}

            {activeTab === 'class-id' && (
              <ClassIdAllocation
                classes={classes}
                availableBatches={availableBatches}
                onUpdateClassSession={handleUpdateClassStatus}
              />
            )}

            {activeTab === 'drive' && (
              <DriveHub
                batchFolders={batchFolders}
                notices={notices}
                currentUser={currentUser}
                onUpdateFolderUrl={handleUpdateFolderUrl}
                onUpdateFolderDetails={handleUpdateFolderDetails}
                onAddFolder={handleAddFolder}
                onDeleteFolder={handleDeleteFolder}
              />
            )}

            {activeTab === 'poster' && (
              <PosterStudio
                classes={classes}
                availableBatches={availableBatches}
              />
            )}

            {activeTab === 'schedule' && (
              <ScheduleEditor
                classes={classes}
                facultyList={facultyList}
                availableBatches={availableBatches}
                onAddClassSession={handleAddClassSession}
                onBulkAddClasses={handleBulkAddClasses}
                onDeleteClassSession={handleDeleteClassSession}
                onDeleteWeekClasses={handleDeleteWeekClasses}
                onUpdateClassStatus={handleUpdateClassStatus}
                onAddBatch={handleAddBatch}
                onRenameBatch={handleRenameBatch}
                onDeclareDateHoliday={handleDeclareDateHoliday}
              />
            )}

            {activeTab === 'backup' && (
              <BackupCenter
                classes={classes}
                rollingBackups={rollingBackups}
                onRestoreBackup={handleRestoreBackup}
                onTriggerRollingBackup={() => triggerRollingBackupSnapshot(classes, 'Manual Snapshot')}
              />
            )}

            {activeTab === 'settings' && (
              <Settings
                currentUser={currentUser}
                settings={portalSettings}
                onUpdateSettings={handleUpdateSettings}
                onUnlockAdmin={() => setShowGlobalAdminModal(true)}
                onClearCancelledClasses={handleClearCancelledClasses}
                onClearHolidayFlags={handleClearHolidayFlags}
                onResetMasterData={handleResetMasterData}
                onTriggerRollingBackup={() => triggerRollingBackupSnapshot(classes, 'Manual Snapshot')}
                onResetDailyLinks={handleResetDailyLinks}
              />
            )}
          </main>
        </div>
      )}

      {/* GLOBAL INSTANT ADMIN PASSCODE MODAL */}
      {showGlobalAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <GlassCard className="max-w-xs w-full p-6 space-y-4" hover={false}>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-sky-400">
                <ShieldCheck size={18} />
                <h4 className="font-grotesk font-bold text-sm text-white">Administrator Login</h4>
              </div>
              <button
                onClick={() => {
                  setShowGlobalAdminModal(false);
                  setAdminModalError('');
                  setAdminModalInput('');
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleGlobalAdminSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-manrope font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Enter Administrator Password
                </label>
                <div className="relative">
                  <input
                    type={adminModalShowPassword ? 'text' : 'password'}
                    value={adminModalInput}
                    onChange={(e) => {
                      setAdminModalInput(e.target.value);
                      setAdminModalError('');
                    }}
                    placeholder="Enter Password"
                    autoFocus
                    className="w-full text-center px-4 py-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-sky-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setAdminModalShowPassword(!adminModalShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
                    title={adminModalShowPassword ? 'Hide password' : 'Show password'}
                  >
                    {adminModalShowPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {adminModalError && (
                  <p className="text-[11px] text-rose-400 font-inter mt-1.5 text-center">
                    {adminModalError}
                  </p>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGlobalAdminModal(false);
                    setAdminModalError('');
                    setAdminModalInput('');
                  }}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 font-manrope font-bold text-xs hover:bg-white/[0.03] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-bold text-xs uppercase shadow-md cursor-pointer"
                >
                  Unlock Admin
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
