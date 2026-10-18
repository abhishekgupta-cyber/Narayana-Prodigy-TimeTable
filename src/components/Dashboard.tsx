import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  ExternalLink,
  BookOpenCheck,
  KeyRound,
  FolderKanban,
  Image,
  CalendarPlus,
  CloudCog,
  Settings,
  Plus,
  Megaphone,
  X,
  FileUp,
  XCircle,
  Users,
  FileDown,
  Lock,
  Home,
  Link2,
  RotateCcw,
  Edit,
  Trash2,
  Video,
  Layers,
  Bell
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ClassSession, UserProfile, CircularNotice, BatchFolder, Faculty } from '../types';
import { INITIAL_BATCH_FOLDERS } from '../data/mockData';
import { SchedulePdfModal } from './SchedulePdfModal';
import { AiDailyBrief } from './AiDailyBrief';
import {
  ACADEMIC_WEEKS,
  filterClassesByWeek,
  doesClassBelongToFaculty,
  getCurrentAcademicWeekId,
  getCurrentDayOfWeek,
  sortClassesChronologically,
  isCurrentAcademicWeek
} from '../utils/weekUtils';
import { EditClassModal } from './EditClassModal';

interface DashboardProps {
  classes: ClassSession[];
  currentUser: UserProfile;
  notices: CircularNotice[];
  facultyList?: Faculty[];
  onNavigateTab: (tabId: string) => void;
  onUpdateClassStatus: (classId: string, updates: Partial<ClassSession>) => void;
  onDeleteClassSession?: (classId: string) => void;
  onSwitchFacultyClick?: () => void;
  onAdminLogin?: () => void;
  onHomeClick?: () => void;
}

// Countdown tile strictly for Faculty - only runs a timer if there is an actual upcoming session today
const FacultyCountdownTile: React.FC<{
  upcomingSession: ClassSession | null;
  liveSession: ClassSession | null;
  todaySessionCount: number;
  onNavigateTab?: (tabId: string) => void;
}> = ({ upcomingSession, liveSession, todaySessionCount, onNavigateTab }) => {
  const [now, setNow] = useState<Date>(new Date());

  React.useEffect(() => {
    // Only run timer interval if there is an actual upcoming session today
    if (!upcomingSession) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [upcomingSession?.id]);

  if (liveSession) {
    return (
      <GlassCard className="p-4 border-emerald-500/40 bg-emerald-950/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-manrope font-semibold text-[11px] text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live In Progress
            </div>
            <div className="font-orbitron font-bold text-2xl text-emerald-400 mt-1">
              LIVE NOW
            </div>
            <div className="text-[10px] text-slate-300 font-inter mt-0.5 truncate max-w-[200px]">
              <span className="text-emerald-400 font-bold">Batch:</span> {liveSession.batchName} ({liveSession.subject})
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>
      </GlassCard>
    );
  }

  if (upcomingSession) {
    const parseTimeToMinutes = (timeStr?: string): number => {
      if (!timeStr) return 0;
      const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 0;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();
    const targetStartM = parseTimeToMinutes(upcomingSession.startTime);
    const diffMinutesTotal = targetStartM - currentMinutes - 1;

    // If session has already started or passed, do not show broken countdown
    if (diffMinutesTotal >= 0) {
      const remHours = Math.floor(diffMinutesTotal / 60);
      const remMinutes = diffMinutesTotal % 60;
      const remSeconds = 59 - currentSeconds;
      const pad = (n: number) => n.toString().padStart(2, '0');
      const isWithin30Mins = diffMinutesTotal <= 30;

      return (
        <GlassCard
          className={`p-4 transition ${
            isWithin30Mins
              ? 'border-amber-500/60 bg-amber-950/25 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
              : 'border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-manrope font-semibold text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                {isWithin30Mins && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                )}
                <span>
                  {isWithin30Mins ? '30-Min Alert Next:' : 'Next:'}{' '}
                  <span className="text-sky-300 font-bold">{upcomingSession.batchName}</span>
                </span>
              </div>
              <div
                className={`font-mono font-bold text-2xl mt-1 ${
                  isWithin30Mins ? 'text-amber-400' : 'text-[#F37021]'
                }`}
              >
                {remHours > 0 ? `${remHours}h ` : ''}{pad(remMinutes)}m {pad(remSeconds)}s
              </div>
              <div className="text-[10px] text-slate-300 font-inter mt-0.5 truncate max-w-[200px]">
                Starts at {upcomingSession.startTime} • Batch {upcomingSession.batchName}
              </div>
              {isWithin30Mins && onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('class-id')}
                  className="mt-2 text-[10px] font-manrope font-bold text-amber-300 hover:text-white underline cursor-pointer flex items-center gap-1"
                >
                  <KeyRound size={11} />
                  <span>Verify / Allot Class ID Link →</span>
                </button>
              )}
            </div>
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                isWithin30Mins
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse'
                  : 'bg-[#F37021]/10 border-[#F37021]/25 text-[#F37021]'
              }`}
            >
              <Clock size={18} />
            </div>
          </div>
        </GlassCard>
      );
    }
  }

  // When no sessions today, or all sessions finished: ZERO timer, clean static status
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-manrope font-semibold text-[11px] text-slate-400 uppercase tracking-wider">
            Next Session
          </div>
          <div className="font-grotesk font-bold text-xl text-slate-300 mt-1">
            {todaySessionCount > 0 ? 'All Done Today ✓' : 'No Sessions Today'}
          </div>
          <div className="text-[10px] text-slate-400 font-inter mt-0.5">
            {todaySessionCount > 0 ? 'All scheduled classes for today finished' : 'No scheduled lectures for today'}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 flex items-center justify-center">
          <Clock size={18} />
        </div>
      </div>
    </GlassCard>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({
  classes,
  currentUser,
  notices,
  facultyList = [],
  onNavigateTab,
  onUpdateClassStatus,
  onDeleteClassSession,
  onSwitchFacultyClick,
  onAdminLogin,
  onHomeClick
}) => {
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const todayDayName = dayNames[now.getDay()];
  const todayISO = now.toISOString().slice(0, 10); // e.g. "2026-10-02"

  const [activeDay, setActiveDay] = useState<string>('Today');
  const [selectedWeek, setSelectedWeek] = useState<string>(() => getCurrentAcademicWeekId());
  const [showNoticeBanner, setShowNoticeBanner] = useState<boolean>(true);
  const [uploadNoteModalClass, setUploadNoteModalClass] = useState<ClassSession | null>(null);
  const [notesUrlInput, setNotesUrlInput] = useState<string>('');
  const [cancelModalClass, setCancelModalClass] = useState<ClassSession | null>(null);
  const [cancellationReasonInput, setCancellationReasonInput] = useState<string>('');
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFormattedDate = () => {
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const parseTimeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  // Scope classes by user role: Faculty only sees their own; Admin sees all
  const filteredClasses = useMemo(() => {
    if (currentUser.role === 'faculty' && currentUser.facultyId) {
      return classes.filter(c =>
        doesClassBelongToFaculty(
          c,
          { id: currentUser.facultyId!, name: currentUser.name },
          facultyList
        )
      );
    }
    return classes;
  }, [classes, currentUser, facultyList]);

  // Strict check: Is this class scheduled for TODAY'S ACTUAL DATE?
  const isClassForToday = (c: ClassSession): boolean => {
    if (c.dateISO) {
      return c.dateISO === todayISO;
    }
    if (c.dateStr && c.dateStr.trim().length > 0) {
      return false; // has past timetable date stamp
    }
    return c.day === todayDayName;
  };

  // Classes for TODAY specifically for the current user scope (strictly sorted by start time)
  const todayActualClasses = useMemo(() => {
    return sortClassesChronologically(filteredClasses.filter(isClassForToday));
  }, [filteredClasses, todayISO, todayDayName]);

  // Total classes across ALL institute faculty for today (for Admin display)
  const allInstituteTodayClasses = useMemo(() => {
    return sortClassesChronologically(classes.filter(isClassForToday));
  }, [classes, todayISO, todayDayName]);

  // Filter classes by selected week
  const weekScopedClasses = useMemo(() => {
    return sortClassesChronologically(filterClassesByWeek(filteredClasses, selectedWeek));
  }, [filteredClasses, selectedWeek]);

  // Current view classes based on tab selection ("Today", "All", or specific day name)
  const currentViewClasses = useMemo(() => {
    if (activeDay === 'Today') {
      return todayActualClasses;
    }
    if (activeDay === 'All') {
      return weekScopedClasses;
    }
    return sortClassesChronologically(weekScopedClasses.filter(c => c.day === activeDay));
  }, [activeDay, todayActualClasses, weekScopedClasses]);

  const handleWeekChange = (newWeek: string) => {
    setSelectedWeek(newWeek);
    if (isCurrentAcademicWeek(newWeek)) {
      setActiveDay('Today');
    } else {
      setActiveDay('Monday');
    }
  };

  // Simplified Notes Upload counts
  const classesWithoutNotes = filteredClasses.filter(c => !c.isCancelled && !c.notesUrl).length;
  const classesWithNotes = filteredClasses.filter(c => !c.isCancelled && Boolean(c.notesUrl)).length;

  // Role-Based Cancelled Classes:
  const cancelledClasses = useMemo(() => {
    return currentUser.role === 'faculty' && currentUser.facultyId
      ? classes.filter(c => c.facultyId === currentUser.facultyId && c.isCancelled)
      : classes.filter(c => c.isCancelled);
  }, [classes, currentUser]);

  // Real-time clock for 30-minute pre-class alert tracking (Requirement 30)
  const [currentTimestamp, setCurrentTimestamp] = useState<Date>(() => new Date());
  const [dismissedAlertClassIds, setDismissedAlertClassIds] = useState<string[]>([]);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTimestamp(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const currentMinutes = currentTimestamp.getHours() * 60 + currentTimestamp.getMinutes();

  // Requirement 30: Next Class Alert 30 Minutes Before (0 to 30 mins before startTime)
  const classesStartingWithin30Mins = useMemo(() => {
    const candidateClasses =
      currentUser.role === 'faculty' && currentUser.facultyId
        ? todayActualClasses
        : allInstituteTodayClasses;

    return candidateClasses
      .filter(c => !c.isCancelled && !c.isHoliday && !dismissedAlertClassIds.includes(c.id))
      .map(c => {
        const startM = parseTimeToMinutes(c.startTime);
        const diffMins = startM - currentMinutes;
        return { cls: c, diffMins };
      })
      .filter(item => item.diffMins >= 0 && item.diffMins <= 30)
      .sort((a, b) => a.diffMins - b.diffMins);
  }, [currentUser, todayActualClasses, allInstituteTodayClasses, currentMinutes, dismissedAlertClassIds]);

  const todayFacultyActive = useMemo(() => {
    if (currentUser.role !== 'faculty' || !currentUser.facultyId) return [];
    return todayActualClasses
      .filter(c => !c.isCancelled)
      .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  }, [todayActualClasses, currentUser]);

  const liveSession = todayFacultyActive.find(c => {
    const startM = parseTimeToMinutes(c.startTime);
    const endM = parseTimeToMinutes(c.endTime);
    return currentMinutes >= startM && currentMinutes <= endM;
  }) || null;

  const upcomingSession = todayFacultyActive.find(c => {
    return parseTimeToMinutes(c.startTime) > currentMinutes;
  }) || null;

  // Admin strength stats
  const uniqueBatches = useMemo(() => Array.from(new Set(classes.map(c => c.batchName))).length, [classes]);
  const uniqueFaculty = useMemo(() => Array.from(new Set(classes.map(c => c.facultyName))).length, [classes]);

  // Notes Modal Handlers
  const handleOpenUploadModal = (cls: ClassSession) => {
    setUploadNoteModalClass(cls);
    setNotesUrlInput(cls.notesUrl || '');
  };

  const handleSaveNotes = () => {
    if (uploadNoteModalClass) {
      const cleanUrl = notesUrlInput.trim();
      onUpdateClassStatus(uploadNoteModalClass.id, {
        notesStatus: cleanUrl ? 'uploaded' : 'pending',
        notesUrl: cleanUrl || undefined,
        taskComplete: Boolean(cleanUrl)
      });
      setUploadNoteModalClass(null);
    }
  };

  // Cancellation Modal Handlers
  const handleOpenCancelModal = (cls: ClassSession) => {
    setCancelModalClass(cls);
    setCancellationReasonInput(cls.cancellationReason || 'Rescheduled due to academic adjustment');
  };

  const handleConfirmCancel = () => {
    if (cancelModalClass) {
      onUpdateClassStatus(cancelModalClass.id, {
        isCancelled: true,
        cancellationReason: cancellationReasonInput.trim() || 'Cancelled by Educator'
      });
      setCancelModalClass(null);
    }
  };

  const handleRestoreClass = (classId: string) => {
    onUpdateClassStatus(classId, {
      isCancelled: false,
      cancellationReason: undefined
    });
  };

  const handleSaveEditedClass = (updated: ClassSession) => {
    onUpdateClassStatus(updated.id, updated);
  };

  const handleDeleteClass = (classId: string) => {
    if (onDeleteClassSession) {
      onDeleteClassSession(classId);
    }
  };

  const renderBatchFolderIcon = (type: BatchFolder['iconType'], color: string) => {
    switch (type) {
      case 'roots':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 20h10" />
            <path d="M12 20v-8" />
            <path d="M12 12a5 5 0 0 1 5-5c0 5-5 5-5 5Z" />
            <path d="M12 12a5 5 0 0 0-5-5c0 5 5 5 5 5Z" />
          </svg>
        );
      case 'horizon':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4" />
            <path d="m4.93 10.93 2.83-2.83" />
            <path d="M2 18h20" />
            <path d="M20 18a8 8 0 1 0-16 0" />
          </svg>
        );
      case 'foundation':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="2" y1="20" x2="22" y2="20" />
            <line x1="4" y1="4" x2="20" y2="4" />
            <path d="M6 4v16M10 4v16M14 4v16M18 4v16" />
          </svg>
        );
      case 'target':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        );
      case 'elevate':
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(30 12 12)" />
            <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ── UNIFIED EXECUTIVE HEADER CARD ── */}
      <GlassCard className="p-5 sm:p-7" hover={false}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Educator Avatar Emblem */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00509d] via-[#0072BC] to-[#F37021] p-0.5 shadow-[0_4px_16px_rgba(0,114,188,0.25)] flex-shrink-0">
              <div className="w-full h-full bg-[#0a0f1d] rounded-[14px] flex items-center justify-center font-orbitron font-extrabold text-[#38bdf8] text-lg">
                {currentUser.initials || 'NP'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-grotesk font-extrabold text-lg sm:text-xl text-white">
                  {getGreeting()}, <span className="text-sky-400">{currentUser.name}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-[10px] font-manrope font-bold text-sky-300 uppercase">
                  {currentUser.role === 'admin' ? 'Administrator' : currentUser.subject || 'Faculty'}
                </span>
              </div>
              <p className="font-inter text-slate-400 text-xs flex items-center gap-2">
                <span>📅 {getFormattedDate()}</span>
                <span>•</span>
                <span>Narayana Prodigy Academic Hub</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-start md:justify-end flex-wrap">
            <button
              onClick={() => setShowPdfModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600/25 via-[#0072BC]/35 to-blue-600/25 hover:from-sky-600/40 hover:to-blue-600/40 border border-sky-400/40 text-sky-200 hover:text-white font-manrope font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-[0_2px_12px_rgba(0,114,188,0.25)]"
              title="Generate printable PDF report of weekly schedule"
            >
              <FileDown size={14} className="text-sky-300" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={() => onNavigateTab('faculty-view')}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 font-manrope font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
            >
              <Users size={14} className="text-sky-400" />
              <span>Roster</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => onNavigateTab('schedule')}
                className="px-3.5 py-1.5 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-bold text-xs tracking-wider uppercase transition shadow-[0_2px_12px_rgba(0,114,188,0.3)] flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Class</span>
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* ── NOTICE BOARD STRIP ── */}
      {showNoticeBanner && (
        <GlassCard className="p-3.5 bg-sky-950/20 border-sky-500/30" hover={false}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 flex-shrink-0">
                <Megaphone size={16} />
              </div>
              <div className="overflow-hidden">
                <span className="font-manrope font-bold text-[10px] text-sky-400 uppercase tracking-wider block">
                  Campus Circular Bulletin
                </span>
                <p className="font-inter text-xs text-slate-300 truncate">
                  {notices[0]?.title || 'Olympiad mock tests schedule updated. Verify class DPP uploads.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNoticeBanner(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              title="Dismiss banner"
            >
              <X size={15} />
            </button>
          </div>
        </GlassCard>
      )}

      {/* ── 30-MINUTE PRE-CLASS READINESS ALERT (Requirement 30) ── */}
      {classesStartingWithin30Mins.length > 0 && (
        <div className="space-y-3">
          {classesStartingWithin30Mins.map(({ cls, diffMins }) => {
            const hasLink = Boolean(cls.directLink || cls.zoomMeetingId);

            return (
              <GlassCard
                key={`alert-${cls.id}`}
                className="p-4 bg-gradient-to-r from-amber-950/40 via-[#131b2c] to-amber-950/30 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.25)]"
                hover={false}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex-shrink-0 animate-pulse mt-0.5">
                      <Bell size={20} className="animate-bounce" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-manrope font-extrabold text-[10px] uppercase border border-amber-500/40 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          30-Minute Pre-Class Alert
                        </span>
                        <span className="font-mono font-extrabold text-white text-xs bg-white/10 px-2 py-0.5 rounded">
                          Starts in {diffMins === 0 ? '< 1' : diffMins} minute{diffMins === 1 ? '' : 's'} ({cls.startTime})
                        </span>
                      </div>

                      <div className="text-white font-grotesk font-extrabold text-sm flex items-center gap-2 flex-wrap">
                        <span>
                          Batch: <span className="text-amber-300">{cls.batchName}</span>
                        </span>
                        <span className="text-slate-500">•</span>
                        <span>{cls.subject}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300 font-normal">
                          Educator: <span className="text-white font-semibold">{cls.facultyName}</span>
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 text-xs">Room #{cls.roomNo || 'Online'}</span>
                      </div>

                      <div className="text-xs font-inter flex items-center gap-2">
                        {hasLink ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={13} /> Class Meeting Link Attached & Ready for Students
                          </span>
                        ) : (
                          <span className="text-amber-300 font-semibold flex items-center gap-1">
                            <AlertTriangle size={13} /> Link Not Allotted Yet — Please allot Class ID before start!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('class-id')}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-manrope font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                    >
                      <KeyRound size={14} />
                      <span>{hasLink ? 'Verify Class ID Link' : 'Allot Class ID Link Now'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDismissedAlertClassIds(prev => [...prev, cls.id])}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      title="Dismiss alert"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* ── 4 STAT COMMAND CENTER TILES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Today's Sessions (Role-Differentiated) */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-manrope font-semibold text-[11px] text-slate-400 uppercase tracking-wider">
                {currentUser.role === 'admin'
                  ? `Institute Sessions Today (${todayDayName})`
                  : `My Today's Sessions (${todayDayName})`}
              </div>
              <div className="font-orbitron font-bold text-2xl text-white mt-1">
                {currentUser.role === 'admin' ? allInstituteTodayClasses.length : todayActualClasses.length}{' '}
                <span className="text-xs text-slate-400 font-normal">slots</span>
              </div>
              <div className="text-[10px] text-slate-400 font-inter mt-0.5">
                {currentUser.role === 'admin' ? (
                  allInstituteTodayClasses.length === 0
                    ? 'No sessions scheduled across institute today'
                    : `${allInstituteTodayClasses.filter(c => !c.isCancelled).length} active · ${allInstituteTodayClasses.filter(c => c.isCancelled).length} cancelled across faculty`
                ) : (
                  todayActualClasses.length === 0
                    ? 'No sessions scheduled for you today'
                    : `${todayActualClasses.filter(c => !c.isCancelled).length} active · ${todayActualClasses.filter(c => c.isCancelled).length} cancelled`
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-400 flex items-center justify-center">
              <CalendarDays size={18} />
            </div>
          </div>
        </GlassCard>

        {/* Tile 2: Next Session Countdown (FACULTY ONLY) vs Active Batches (ADMIN ONLY) */}
        {currentUser.role === 'admin' ? (
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-manrope font-semibold text-[11px] text-slate-400 uppercase tracking-wider">
                  Active Batches & Faculty
                </div>
                <div className="font-orbitron font-bold text-2xl text-sky-400 mt-1">
                  {uniqueBatches} <span className="text-xs text-slate-400 font-normal">batches</span>
                </div>
                <div className="text-[10px] text-slate-400 font-inter mt-0.5">
                  {uniqueFaculty} educators registered in roster
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-400 flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>
          </GlassCard>
        ) : (
          <FacultyCountdownTile
            upcomingSession={upcomingSession}
            liveSession={liveSession}
            todaySessionCount={todayFacultyActive.length}
            onNavigateTab={onNavigateTab}
          />
        )}

        {/* Tile 3: Simplified Notes Upload Status */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-manrope font-semibold text-[11px] text-slate-400 uppercase tracking-wider">
                Lecture Notes Uploaded
              </div>
              <div className="font-orbitron font-bold text-2xl text-amber-400 mt-1">
                {classesWithNotes}{' '}
                <span className="text-xs text-slate-400 font-normal">/ {filteredClasses.filter(c => !c.isCancelled).length}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-inter mt-0.5">
                {classesWithoutNotes > 0
                  ? `${classesWithoutNotes} sessions missing notes • Click Upload Notes below`
                  : 'All scheduled sessions have lecture notes attached ✓'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center">
              <Upload size={18} />
            </div>
          </div>
        </GlassCard>

        {/* Tile 4: Cancelled Sessions */}
        <GlassCard
          onClick={() => {
            const el = document.getElementById('cancelled-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`p-4 cursor-pointer transition ${cancelledClasses.length > 0 ? 'border-rose-500/40 bg-rose-950/20 hover:border-rose-500/60' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-manrope font-semibold text-[11px] text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                {cancelledClasses.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                {currentUser.role === 'admin' ? 'Total Cancelled (All)' : 'My Cancelled Slots'}
              </div>
              <div className="font-orbitron font-bold text-2xl text-rose-400 mt-1">
                {cancelledClasses.length} <span className="text-xs text-slate-400 font-normal">slots</span>
              </div>
              <div className="text-[10px] text-slate-400 font-inter mt-0.5">
                {currentUser.role === 'admin' ? 'Across all faculty members' : `For your batches (${currentUser.name})`}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── AI DAILY BRIEF ── */}
      <AiDailyBrief
        currentUser={currentUser}
        activeDay={activeDay === 'Today' ? todayDayName : activeDay}
        classes={currentViewClasses}
        notices={notices}
        pendingNotesCount={classesWithoutNotes}
      />

      {/* ── BATCH RESOURCES & DRIVE SHORTCUTS ── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban size={18} className="text-sky-400" />
            <h3 className="font-orbitron font-bold text-sm text-white tracking-wide">
              Batch Drive Folders & Syllabus Hub
            </h3>
          </div>
          <span className="font-manrope text-[11px] text-slate-400 uppercase tracking-wider">
            Quick-Select Cloud Repositories
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {INITIAL_BATCH_FOLDERS.slice(0, 7).map((folder) => (
            <GlassCard key={folder.id} className="p-4 flex flex-col justify-between min-h-[145px]">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    {renderBatchFolderIcon(folder.iconType, folder.iconColor)}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-manrope font-bold text-[9px] uppercase border ${folder.chipColor}`}>
                    {folder.category}
                  </span>
                </div>

                <div>
                  <h4 className="font-grotesk font-bold text-xs text-white">
                    {folder.batchName} Folder
                  </h4>
                  <p className="font-inter text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {folder.description}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/[0.06] mt-2">
                <a
                  href={folder.driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-1.5 rounded-lg bg-white/[0.03] hover:bg-sky-500/15 border border-white/[0.08] hover:border-sky-500/30 text-slate-300 hover:text-sky-300 font-manrope font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                >
                  <span>Open Drive</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* ── SESSIONS & TIMETABLE SECTION (Includes Sunday & Week Filter) ── */}
      <div className="space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-grotesk font-bold text-sm text-white tracking-wide uppercase flex items-center gap-2">
              <CalendarDays size={16} className="text-sky-400" />
              <span>
                {activeDay === 'Today'
                  ? `Today's Sessions (${todayDayName})`
                  : activeDay === 'All'
                  ? 'All Weekly Sessions'
                  : `${activeDay} Sessions`}{' '}
                ({currentViewClasses.length})
              </span>
            </h3>
            <span className="font-manrope text-xs text-slate-400 ml-2">
              {currentUser.role === 'faculty' ? `• ${currentUser.name}` : '• All Educators'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Week Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#0d121d] px-2.5 py-1 rounded-xl border border-white/10 text-xs">
              <Layers size={13} className="text-amber-400" />
              <select
                value={selectedWeek}
                onChange={(e) => handleWeekChange(e.target.value)}
                className="bg-transparent text-[11px] font-grotesk font-bold text-white focus:outline-none cursor-pointer"
              >
                {ACADEMIC_WEEKS.map(w => (
                  <option key={w.id} value={w.id} className="bg-[#111520]">
                    {w.label} {w.isCurrent ? '⭐ (Current Week)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Day Switcher including SUNDAY with Glow Effect on Current Day */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(isCurrentAcademicWeek(selectedWeek)
                ? ['Today', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'All']
                : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'All']
              ).map(dayName => {
                const isSelected = activeDay === dayName;
                const isActuallyToday =
                  isCurrentAcademicWeek(selectedWeek) &&
                  (dayName === 'Today' || dayName === todayDayName);

                return (
                  <button
                    key={dayName}
                    onClick={() => setActiveDay(dayName)}
                    className={`relative px-3 py-1 rounded-xl font-manrope font-bold text-[10px] uppercase transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#0072BC] text-white shadow-sm ring-1 ring-sky-400'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                    } ${
                      isActuallyToday
                        ? isSelected
                          ? 'ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.7)] font-extrabold text-white'
                          : 'ring-2 ring-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.45)] text-emerald-300 bg-emerald-950/25'
                        : ''
                    }`}
                  >
                    {isActuallyToday && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                    )}
                    <span>
                      {dayName === 'Sunday'
                        ? 'Sun 🌟'
                        : dayName === 'Today'
                        ? `Today (${todayDayName.slice(0, 3)})`
                        : dayName.slice(0, 3)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Timetable Session Cards */}
        {currentViewClasses.length === 0 ? (
          <GlassCard className="p-8 text-center space-y-2 border-white/[0.08]">
            <CalendarDays size={32} className="mx-auto text-slate-500 opacity-60" />
            <h4 className="font-grotesk font-bold text-sm text-white">
              No Sessions Scheduled for {activeDay === 'Today' ? `Today (${todayDayName})` : activeDay}
            </h4>
            <p className="font-inter text-xs text-slate-400 max-w-sm mx-auto">
              {activeDay === 'Today'
                ? `You have 0 lectures scheduled for today (${todayDayName}). Use the day tabs above to view other weekly slots, or add new sessions in Schedule Editor.`
                : `No class timetable records found for ${activeDay}. Use the Master Schedule Editor to add slots.`}
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {currentViewClasses.map((cls) => {
              const isClassLive = isClassForToday(cls) && (() => {
                const sM = parseTimeToMinutes(cls.startTime);
                const eM = parseTimeToMinutes(cls.endTime);
                return currentMinutes >= sM && currentMinutes <= eM && !cls.isCancelled;
              })();

              return (
                <GlassCard
                  key={cls.id}
                  className={`p-4 transition-all ${
                    cls.isCancelled
                      ? 'border-rose-500/40 bg-rose-950/15'
                      : isClassLive
                      ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/40'
                      : ''
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full font-manrope font-bold text-[10px] uppercase ${
                          cls.subject === 'Astronomy' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                          cls.subject === 'Maths' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                          cls.subject === 'Botany' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          cls.subject === 'Zoology' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          cls.subject === 'Chemistry' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                          cls.subject === 'Physics' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                          cls.subject === 'Biology' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                        }`}>
                          {cls.subject}
                        </span>
                        <span className="font-mono text-xs text-slate-300 font-semibold">
                          {cls.startTime} - {cls.endTime}
                        </span>
                        <span className="text-[11px] text-slate-400 font-manrope">
                          ({cls.day})
                        </span>
                      </div>

                      {cls.isCancelled ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-manrope font-bold text-[9px] uppercase tracking-wider">
                          CANCELLED
                        </span>
                      ) : isClassLive ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-manrope font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          LIVE NOW
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 font-manrope font-bold text-[10px]">
                          {cls.slotName}
                        </span>
                      )}
                    </div>

                    {/* Batch Name Highlighted Primary (Replacing Room focus) */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-manrope font-extrabold text-[10px] uppercase text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded border border-sky-500/25">
                          BATCH
                        </span>
                        <h4 className={`font-grotesk font-extrabold text-base text-white ${cls.isCancelled ? 'line-through text-slate-400' : ''}`}>
                          {cls.batchName}
                        </h4>
                      </div>
                      <p className="font-inter text-xs text-slate-300 mt-1">
                        Educator: <span className="text-white font-semibold">{cls.facultyName}</span> ({cls.subject})
                      </p>
                      {cls.dateISO && (
                        <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                          Date: {cls.dateISO} ({cls.day})
                        </p>
                      )}
                      {cls.cancellationReason && (
                        <p className="font-inter text-xs text-rose-400 mt-1 italic">
                          Cancellation Reason: {cls.cancellationReason}
                        </p>
                      )}
                    </div>

                    {/* Action Bar: Notes Upload, Zoom Link, Edit Class, Delete Class */}
                    <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                      {!cls.isCancelled ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          {cls.notesUrl ? (
                            <>
                              <a
                                href={cls.notesUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/35 text-emerald-300 font-manrope font-bold text-xs flex items-center gap-1.5 transition"
                                title="Click to open uploaded lecture notes"
                              >
                                <FileCheck size={13} />
                                <span>Notes Uploaded ✓</span>
                              </a>
                              <button
                                onClick={() => handleOpenUploadModal(cls)}
                                className="px-2 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white font-manrope text-[11px] transition cursor-pointer"
                                title="Update or change notes URL"
                              >
                                Edit Link
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenUploadModal(cls)}
                              className="px-3 py-1.5 rounded-lg bg-[#0072BC]/25 hover:bg-[#0072BC]/40 border border-[#0072BC]/45 text-sky-200 hover:text-white font-manrope font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                              title="Upload notes for this session"
                            >
                              <FileUp size={13} className="text-sky-300" />
                              <span>Upload Notes</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-rose-400 font-inter italic">
                          Session cancelled • Notes not required
                        </span>
                      )}

                      {/* Right action controls: Zoom Link, Edit Class & Quick Cancel/Restore */}
                      <div className="flex items-center gap-2 ml-auto flex-wrap">
                        {!cls.isCancelled && (
                          <>
                            <a
                              href={`https://zoom.us/j/${cls.zoomMeetingId?.replace(/\s/g, '')}?pwd=${cls.zoomPassword}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-grotesk font-semibold text-sky-400 hover:underline flex items-center gap-1"
                            >
                              <span>Join Zoom</span>
                              <ExternalLink size={11} />
                            </a>
                            <button
                              onClick={() => handleOpenCancelModal(cls)}
                              className="px-2 py-1 rounded-lg text-[10px] font-manrope font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 border border-rose-500/25 transition cursor-pointer"
                              title="Mark this session as cancelled"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {cls.isCancelled && (
                          <button
                            onClick={() => handleRestoreClass(cls.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-manrope font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/35 transition cursor-pointer flex items-center gap-1"
                            title="Restore session to active status"
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                        )}

                        {/* Edit Class Modal Trigger */}
                        <button
                          onClick={() => setEditingClass(cls)}
                          className="px-2.5 py-1 rounded-lg text-xs font-manrope font-bold bg-white/[0.04] hover:bg-sky-500/20 text-slate-300 hover:text-white border border-white/10 hover:border-sky-400/40 transition cursor-pointer flex items-center gap-1"
                          title="Edit Class Details"
                        >
                          <Edit size={12} className="text-sky-400" />
                          <span>Edit</span>
                        </button>

                        {/* Quick Delete Class Button */}
                        {onDeleteClassSession && (
                          <button
                            onClick={() => handleDeleteClass(cls.id)}
                            className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            title="Delete this class"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CANCELLED CLASSES SECTION ── */}
      <div id="cancelled-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-grotesk font-bold text-sm text-rose-400 tracking-wide uppercase flex items-center gap-2">
            <XCircle size={16} />
            <span>
              {currentUser.role === 'admin' ? 'All Institute Cancelled Classes' : 'My Cancelled Classes'}{' '}
              ({cancelledClasses.length})
            </span>
          </h3>
          <span className="font-manrope text-xs text-slate-400">
            {currentUser.role === 'admin'
              ? 'Administrator roster overview (All Faculties)'
              : `Showing cancelled classes for ${currentUser.name}`}
          </span>
        </div>

        {cancelledClasses.length === 0 ? (
          <GlassCard className="p-4 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-inter text-xs font-medium flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>
              {currentUser.role === 'admin'
                ? 'No class cancellations across the entire institute! All scheduled slots are active.'
                : `No cancelled classes found for you (${currentUser.name})! All your scheduled sessions are active.`}
            </span>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cancelledClasses.map(cls => (
              <GlassCard key={cls.id} className="p-4 border-rose-500/40 bg-rose-950/20 transition">
                <div className="flex items-center justify-between">
                  <span className="font-grotesk font-bold text-xs text-white line-through">
                    {cls.batchName} ({cls.subject})
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-manrope font-bold text-[9px] uppercase">
                    CANCELLED
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-inter mt-1.5 space-y-0.5">
                  <div>📅 {cls.day} {cls.dateISO ? `(${cls.dateISO})` : ''} • {cls.startTime} - {cls.endTime}</div>
                  {currentUser.role === 'admin' && (
                    <div className="text-sky-300 font-semibold">
                      Educator: {cls.facultyName}
                    </div>
                  )}
                </div>
                <p className="font-inter text-xs text-rose-300 mt-2 p-2 rounded-lg bg-black/30 border border-rose-500/20">
                  <span className="font-bold">Reason:</span> {cls.cancellationReason || 'Rescheduled / Emergency adjustment'}
                </p>
                <div className="pt-2 mt-2 border-t border-rose-500/20 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingClass(cls)}
                    className="px-2.5 py-1 rounded-lg text-xs font-manrope font-bold bg-white/[0.05] text-slate-300 hover:text-white border border-white/10 transition cursor-pointer flex items-center gap-1"
                  >
                    <Edit size={12} className="text-sky-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleRestoreClass(cls.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-manrope font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/35 transition cursor-pointer flex items-center gap-1"
                    title="Uncancel / Restore this class"
                  >
                    <RotateCcw size={12} />
                    <span>Restore Session</span>
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* ── QUICK ACCESS SHORTCUTS ── */}
      <div className="space-y-3">
        <h3 className="font-grotesk font-bold text-xs text-slate-400 tracking-wider uppercase">
          Quick Navigation Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'daily', label: 'Daily View', icon: CalendarDays, color: 'text-sky-400' },
            { id: 'timetable', label: 'Master Timetable', icon: BookOpenCheck, color: 'text-amber-400' },
            { id: 'class-id', label: 'Class ID & QR', icon: KeyRound, color: 'text-emerald-400' },
            { id: 'drive', label: 'Drive & Hub', icon: FolderKanban, color: 'text-violet-400' },
            { id: 'poster', label: 'Poster Studio', icon: Image, color: 'text-purple-400' },
            { id: 'schedule', label: 'Schedule Editor', icon: CalendarPlus, color: 'text-rose-400' },
            { id: 'backup', label: 'Backup Center', icon: CloudCog, color: 'text-blue-400' },
            { id: 'settings', label: 'Settings', icon: Settings, color: 'text-slate-300' }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <GlassCard
                key={item.id}
                onClick={() => onNavigateTab(item.id)}
                className="p-3.5 hover:border-sky-500/40 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg bg-white/[0.04] ${item.color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="font-grotesk font-bold text-xs text-white">
                    {item.label}
                  </span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Upload Notes Modal */}
      {uploadNoteModalClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <GlassCard className="max-w-md w-full p-6 space-y-4" hover={false}>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h4 className="font-grotesk font-bold text-sm text-white">
                  Upload Notes — {uploadNoteModalClass.batchName}
                </h4>
                <p className="text-[11px] text-slate-400 font-inter">
                  {uploadNoteModalClass.subject} • {uploadNoteModalClass.day} ({uploadNoteModalClass.startTime})
                </p>
              </div>
              <button
                onClick={() => setUploadNoteModalClass(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-manrope font-bold text-slate-300 uppercase tracking-wider">
                Google Drive Notes Link / Resource URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={notesUrlInput}
                  onChange={(e) => setNotesUrlInput(e.target.value)}
                  placeholder="https://drive.google.com/your-lecture-notes-link"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-sky-500 pl-9"
                  autoFocus
                />
                <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 font-inter">
                Paste your Google Drive batch folder, presentation PDF, or DPP solution link.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setUploadNoteModalClass(null)}
                className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 font-manrope font-bold text-xs hover:bg-white/[0.04] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="flex-1 py-2 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-bold text-xs uppercase shadow-md cursor-pointer"
              >
                Save & Upload Notes
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Cancel Session Confirmation Modal */}
      {cancelModalClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <GlassCard className="max-w-md w-full p-6 space-y-4" hover={false}>
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div>
                <h4 className="font-grotesk font-bold text-sm text-rose-400">
                  Cancel Class Session
                </h4>
                <p className="text-[11px] text-slate-400 font-inter">
                  Batch: {cancelModalClass.batchName} ({cancelModalClass.subject}) • {cancelModalClass.day} {cancelModalClass.startTime}
                </p>
              </div>
              <button
                onClick={() => setCancelModalClass(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-manrope font-bold text-slate-300 uppercase tracking-wider">
                Reason for Cancellation (Shown to students & admins)
              </label>
              <input
                type="text"
                value={cancellationReasonInput}
                onChange={(e) => setCancellationReasonInput(e.target.value)}
                placeholder="e.g. Rescheduled Olympiad Workshop / Emergency leave"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d121d] border border-rose-500/30 text-rose-200 font-inter text-xs focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setCancelModalClass(null)}
                className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 font-manrope font-bold text-xs hover:bg-white/[0.04] cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-manrope font-bold text-xs uppercase shadow-md cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Edit Class Modal */}
      {editingClass && (
        <EditClassModal
          cls={editingClass}
          facultyList={facultyList}
          isOpen={Boolean(editingClass)}
          onClose={() => setEditingClass(null)}
          onSave={handleSaveEditedClass}
          onDelete={handleDeleteClass}
        />
      )}

      {/* Schedule PDF Export & Print Modal */}
      <SchedulePdfModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        classes={classes}
        currentUser={currentUser}
      />
    </div>
  );
};
