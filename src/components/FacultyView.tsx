import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  Plus,
  BookOpen,
  Clock,
  Mail,
  Phone,
  X,
  Edit,
  Trash2,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Timer,
  HelpCircle
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Faculty, ClassSession, UserProfile } from '../types';
import { EditClassModal } from './EditClassModal';
import {
  ACADEMIC_WEEKS,
  filterClassesByWeek,
  doesClassBelongToFaculty,
  deduplicateFacultyList,
  getCurrentAcademicWeekId,
  getCurrentDayOfWeek,
  sortClassesChronologically,
  isCurrentAcademicWeek
} from '../utils/weekUtils';
import { isDoubtSession } from '../utils/overlapDetection';

interface FacultyViewProps {
  facultyList: Faculty[];
  classes: ClassSession[];
  currentUser: UserProfile;
  availableBatches?: string[];
  onAddClassSession: (session: Partial<ClassSession>) => void;
  onUpdateClassStatus?: (classId: string, updates: Partial<ClassSession>) => void;
  onDeleteClassSession?: (classId: string) => void;
  onAddFaculty?: (newFac: Faculty) => void;
  onUpdateFaculty?: (facultyId: string, updates: Partial<Faculty>) => void;
  onDeleteFaculty?: (facultyId: string) => void;
}

const DEFAULT_BATCHES = [
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

const parseTimeToMinutes = (timeStr?: string): number | null => {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

const formatMinutesToHrsMins = (totalMins: number): string => {
  if (totalMins <= 0) return '0h 00m';
  const hrs = Math.floor(totalMins / 60);
  const mins = Math.round(totalMins % 60);
  return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
};

export const FacultyView: React.FC<FacultyViewProps> = ({
  facultyList,
  classes,
  currentUser,
  availableBatches = [],
  onAddClassSession,
  onUpdateClassStatus,
  onDeleteClassSession,
  onAddFaculty,
  onUpdateFaculty,
  onDeleteFaculty
}) => {
  const uniqueFacultyList = useMemo(() => deduplicateFacultyList(facultyList), [facultyList]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(() => {
    if (currentUser.role === 'faculty' && currentUser.facultyId) {
      return currentUser.facultyId;
    }
    return uniqueFacultyList[0]?.id || facultyList[0]?.id || 'fac-ac';
  });

  // Sync selected faculty when currentUser changes
  React.useEffect(() => {
    if (currentUser.role === 'faculty' && currentUser.facultyId) {
      setSelectedFacultyId(currentUser.facultyId);
    }
  }, [currentUser]);

  const [selectedAnalyticsDay, setSelectedAnalyticsDay] = useState<ClassSession['day']>(() => getCurrentDayOfWeek());
  const [facultyDayFilter, setFacultyDayFilter] = useState<ClassSession['day'] | 'all'>(() => getCurrentDayOfWeek());
  const [breakdownMode, setBreakdownMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>(() => getCurrentAcademicWeekId());
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('2026-09');
  const [showAddClassModal, setShowAddClassModal] = useState<boolean>(false);
  const [showFacultyModal, setShowFacultyModal] = useState<boolean>(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [showDeleteFacultyConfirm, setShowDeleteFacultyConfirm] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);

  const batchList = useMemo(
    () => Array.from(new Set([...DEFAULT_BATCHES, ...availableBatches, ...classes.map(c => c.batchName)].filter(Boolean))),
    [availableBatches, classes]
  );

  // Add Class Form State (Clean: Batch Dropdown, No Room input, No Drive/Meeting ID)
  const [newDay, setNewDay] = useState<ClassSession['day']>('Monday');
  const [newSubject, setNewSubject] = useState<ClassSession['subject']>(
    (uniqueFacultyList[0]?.subject as ClassSession['subject']) || 'Astronomy'
  );
  const [newFacultyId, setNewFacultyId] = useState<string>(() => uniqueFacultyList[0]?.id || 'fac-ac');
  const [newBatchName, setNewBatchName] = useState<string>(batchList[0] || 'NSEA_WORKSHOP');
  const [newClassType, setNewClassType] = useState<ClassSession['classType']>('class');
  const [newStartTime, setNewStartTime] = useState<string>('05:00 PM');
  const [newEndTime, setNewEndTime] = useState<string>('05:55 PM');
  const [newDateISO, setNewDateISO] = useState<string>(new Date().toISOString().slice(0, 10));

  // Faculty Form State
  const [facName, setFacName] = useState<string>('');
  const [facSubject, setFacSubject] = useState<Faculty['subject']>('Physics');
  const [facInitials, setFacInitials] = useState<string>('');
  const [facEmail, setFacEmail] = useState<string>('');
  const [facPhone, setFacPhone] = useState<string>('');
  const [facColor, setFacColor] = useState<string>('#0284c7');

  const selectedFaculty = uniqueFacultyList.find(f => f.id === selectedFacultyId) || uniqueFacultyList[0];

  // Strict faculty class ownership check (strictly sorted chronologically by time)
  const allFacultyClasses = useMemo(() => {
    if (!selectedFaculty) return [];
    return sortClassesChronologically(
      classes.filter(c => doesClassBelongToFaculty(c, selectedFaculty, uniqueFacultyList))
    );
  }, [classes, selectedFaculty, uniqueFacultyList]);

  // Week-filtered classes for the diary and weekly analytics (strictly sorted chronologically by time)
  const facultyClasses = useMemo(() => {
    return sortClassesChronologically(filterClassesByWeek(allFacultyClasses, selectedWeekFilter));
  }, [allFacultyClasses, selectedWeekFilter]);

  const activeFacultyClasses = useMemo(
    () => facultyClasses.filter(c => !c.isCancelled && !c.isHoliday),
    [facultyClasses]
  );

  // Single-Day filtered classes for the diary view (Requirement 23: strictly show only selected day's classes unless "all" is explicitly chosen)
  const displayedFacultyClasses = useMemo(() => {
    if (facultyDayFilter === 'all') {
      return facultyClasses;
    }
    return facultyClasses.filter(c => c.day === facultyDayFilter);
  }, [facultyClasses, facultyDayFilter]);

  const allActiveFacultyClasses = useMemo(
    () => allFacultyClasses.filter(c => !c.isCancelled && !c.isHoliday),
    [allFacultyClasses]
  );

  // Available months from scheduled classes (plus Sept & Oct 2026)
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>(['2026-09', '2026-10']);
    classes.forEach(c => {
      if (c.dateISO && c.dateISO.length >= 7) {
        monthSet.add(c.dateISO.slice(0, 7));
      }
    });
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return Array.from(monthSet)
      .sort()
      .map(ym => {
        const [y, m] = ym.split('-').map(Number);
        return {
          id: ym,
          label: `${monthNames[(m || 1) - 1]} ${y}`
        };
      });
  }, [classes]);

  /**
   * ACCURATE WORKLOAD & BUFFER CALCULATION ENGINE
   * - Groups sessions by ACTUAL DATE (`dateISO` or day key) first so classes from multiple weeks
   *   are never merged into a single day window.
   * - For each single day's sessions:
   *   Includes 5-min transition buffer on :55 slots (e.g. 5:00-5:55 PM -> 60m)
   *   Includes inter-class gap/buffer time within the same day's teaching window
   *   (e.g. 5:00-5:55 PM and 7:00-7:55 PM on the same date => 5:00 PM to 8:00 PM = 3h 00m continuous span).
   * - Monthly Workload:
   *   Strictly counts ACTUAL scheduled sessions in the selected month (`YYYY-MM`) without pre-multiplying by 4!
   */
  const computeDateGroupWorkload = (sessionList: ClassSession[]) => {
    if (sessionList.length === 0) {
      return {
        totalSlots: 0,
        lectureSlots: 0,
        doubtSlots: 0,
        netMinutes: 0,
        bufferMinutes: 0,
        totalSpanWithBufferMinutes: 0,
        windowLabel: 'No sessions'
      };
    }

    // Group by unique calendar date so multi-week classes on the same weekday don't merge their time spans
    const byDate = new Map<string, ClassSession[]>();
    sessionList.forEach(s => {
      const dateKey = s.dateISO || s.dateStr || s.day;
      const list = byDate.get(dateKey) || [];
      list.push(s);
      byDate.set(dateKey, list);
    });

    let totalNet = 0;
    let totalSpan = 0;
    let totalBuffer = 0;
    const windowLabels: string[] = [];

    byDate.forEach(dateSessions => {
      let earliestStart = Infinity;
      let latestEnd = -Infinity;
      let earliestStr = '';
      let latestStr = '';
      let dayNet = 0;

      dateSessions.forEach(s => {
        const st = parseTimeToMinutes(s.startTime);
        const et = parseTimeToMinutes(s.endTime);
        if (st !== null && et !== null && et > st) {
          const rawDur = et - st;
          dayNet += rawDur;
          if (st < earliestStart) {
            earliestStart = st;
            earliestStr = s.startTime;
          }
          // Include 5-minute transition buffer if slot ends at :55 (e.g. 5:55 PM -> 6:00 PM)
          const effectiveEnd = et % 60 === 55 ? et + 5 : et;
          if (effectiveEnd > latestEnd) {
            latestEnd = effectiveEnd;
            latestStr = s.endTime;
          }
        } else {
          dayNet += 60;
        }
      });

      const daySpan =
        earliestStart !== Infinity && latestEnd !== -Infinity && latestEnd > earliestStart
          ? latestEnd - earliestStart
          : dayNet;
      const dayBuffer = Math.max(0, daySpan - dayNet);

      totalNet += dayNet;
      totalSpan += daySpan;
      totalBuffer += dayBuffer;
      if (earliestStr && latestStr) {
        windowLabels.push(`${earliestStr} → ${latestStr}`);
      }
    });

    return {
      totalSlots: sessionList.length,
      lectureSlots: sessionList.filter(c => !isDoubtSession(c)).length,
      doubtSlots: sessionList.filter(c => isDoubtSession(c)).length,
      netMinutes: totalNet,
      bufferMinutes: totalBuffer,
      totalSpanWithBufferMinutes: totalSpan,
      windowLabel: windowLabels[0] || 'Active Window'
    };
  };

  const workloadAnalytics = useMemo(() => {
    const daysOrder: ClassSession['day'][] = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ];

    // Strictly separate lectures and doubts: Doubts are NEVER counted as normal lectures!
    const totalAssignedLectures = activeFacultyClasses.filter(c => !isDoubtSession(c)).length;
    const totalDoubtSessions = activeFacultyClasses.filter(c => isDoubtSession(c)).length;

    const perDayStats: Record<
      string,
      {
        totalSlots: number;
        lectureSlots: number;
        doubtSlots: number;
        netMinutes: number;
        bufferMinutes: number;
        totalSpanWithBufferMinutes: number;
        windowLabel: string;
      }
    > = {};

    let weeklySpanWithBufferMinutes = 0;
    let weeklyNetMinutes = 0;
    let weeklyBufferMinutes = 0;

    daysOrder.forEach(d => {
      const daySlots = activeFacultyClasses.filter(c => c.day === d);
      const stat = computeDateGroupWorkload(daySlots);
      perDayStats[d] = stat;
      weeklySpanWithBufferMinutes += stat.totalSpanWithBufferMinutes;
      weeklyNetMinutes += stat.netMinutes;
      weeklyBufferMinutes += stat.bufferMinutes;
    });

    // ACTUAL MONTHLY WORKLOAD (No fake * 4 multiplication! Calculates actual scheduled classes in the selected month)
    const monthActiveClasses = allActiveFacultyClasses.filter(c => {
      if (selectedMonthFilter === 'all') return true;
      if (c.dateISO && c.dateISO.startsWith(selectedMonthFilter)) return true;
      return false;
    });

    // Requirement 26: Total Cancelled Classes in the selected month
    const monthAllClasses = allFacultyClasses.filter(c => {
      if (selectedMonthFilter === 'all') return true;
      if (c.dateISO && c.dateISO.startsWith(selectedMonthFilter)) return true;
      return false;
    });
    const monthlyCancelledClasses = monthAllClasses.filter(c => c.isCancelled).length;

    const monthWorkload = computeDateGroupWorkload(monthActiveClasses);
    const monthlyTotalAllotted = monthWorkload.lectureSlots + monthWorkload.doubtSlots + monthlyCancelledClasses;

    return {
      totalAssignedLectures,
      totalDoubtSessions,
      totalActiveWeeklySessions: activeFacultyClasses.length,
      perDayStats,
      weeklySpanWithBufferMinutes,
      weeklyNetMinutes,
      weeklyBufferMinutes,
      monthlyTotalSessions: monthWorkload.totalSlots,
      monthlyLectures: monthWorkload.lectureSlots,
      monthlyDoubts: monthWorkload.doubtSlots,
      monthlyCancelled: monthlyCancelledClasses,
      monthlyTotalAllotted,
      monthlySpanWithBufferMinutes: monthWorkload.totalSpanWithBufferMinutes,
      monthlyNetMinutes: monthWorkload.netMinutes,
      monthlyBufferMinutes: monthWorkload.bufferMinutes
    };
  }, [activeFacultyClasses, allActiveFacultyClasses, allFacultyClasses, selectedMonthFilter]);

  const currentDayStat = workloadAnalytics.perDayStats[selectedAnalyticsDay] || {
    totalSlots: 0,
    lectureSlots: 0,
    doubtSlots: 0,
    netMinutes: 0,
    bufferMinutes: 0,
    totalSpanWithBufferMinutes: 0,
    windowLabel: 'No sessions'
  };

  const handleFacultyChange = (fId: string) => {
    setNewFacultyId(fId);
    const fac = facultyList.find(f => f.id === fId);
    if (fac) {
      setNewSubject(fac.subject as ClassSession['subject']);
    }
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const fac = facultyList.find(f => f.id === newFacultyId);
    onAddClassSession({
      day: newDay,
      dateStr: newDateISO,
      dateISO: newDateISO,
      startTime: newStartTime,
      endTime: newEndTime,
      slotName: newClassType === 'doubt' ? 'DOUBT' : 'S1',
      subject: newSubject,
      facultyId: newFacultyId,
      facultyName: fac?.name || 'Educator',
      batchName: newBatchName,
      roomNo: newBatchName,
      classType: newClassType,
      notesStatus: 'pending',
      taskComplete: false
    });
    setShowAddClassModal(false);
  };

  const handleOpenAddFacultyModal = () => {
    setEditingFaculty(null);
    setFacName('');
    setFacSubject('Physics');
    setFacInitials('');
    setFacEmail('');
    setFacPhone('');
    setFacColor('#0284c7');
    setShowFacultyModal(true);
  };

  const handleOpenEditFacultyModal = (fac: Faculty) => {
    setEditingFaculty(fac);
    setFacName(fac.name);
    setFacSubject(fac.subject);
    setFacInitials(fac.initials);
    setFacEmail(fac.email || '');
    setFacPhone(fac.phone || '');
    setFacColor(fac.color || '#0284c7');
    setShowFacultyModal(true);
  };

  const handleSaveFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    const initials =
      facInitials.trim() ||
      facName
        .trim()
        .split(' ')
        .map(p => p[0])
        .join('')
        .slice(0, 3)
        .toUpperCase();

    if (editingFaculty) {
      if (onUpdateFaculty) {
        onUpdateFaculty(editingFaculty.id, {
          name: facName.trim(),
          subject: facSubject,
          initials,
          email: facEmail.trim(),
          phone: facPhone.trim(),
          color: facColor
        });
      }
    } else {
      if (onAddFaculty) {
        const newId = `fac-${Date.now().toString().slice(-4)}`;
        onAddFaculty({
          id: newId,
          name: facName.trim(),
          subject: facSubject,
          initials,
          color: facColor,
          borderColor: 'border-sky-500',
          badgeBg: 'bg-sky-500/20 text-sky-300',
          classesThisWeek: 0,
          email: facEmail.trim(),
          phone: facPhone.trim()
        });
        setSelectedFacultyId(newId);
      }
    }
    setShowFacultyModal(false);
  };

  const handleDeleteFaculty = () => {
    if (selectedFaculty && onDeleteFaculty) {
      onDeleteFaculty(selectedFaculty.id);
      setShowDeleteFacultyConfirm(false);
      const remaining = facultyList.filter(f => f.id !== selectedFaculty.id);
      if (remaining.length > 0) {
        setSelectedFacultyId(remaining[0].id);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-orbitron font-extrabold text-xl text-white tracking-wide">
            FACULTY WORKLOAD & ROSTER ANALYTICS
          </h2>
          <p className="font-inter text-slate-400 text-xs mt-1">
            Daily, Weekly & Monthly workload metrics (including continuous slot buffer/gap time), class vs doubt breakdown & batch diary
          </p>
        </div>

        {/* Action Buttons: Add Faculty & Add Class */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenAddFacultyModal}
            className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-manrope font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus size={15} className="text-sky-400" />
            <span>Add Educator</span>
          </button>

          <button
            onClick={() => {
              if (selectedFaculty) {
                setNewFacultyId(selectedFaculty.id);
                setNewSubject(selectedFaculty.subject);
              }
              setShowAddClassModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Calendar size={15} />
            <span>Add Class / Doubt</span>
          </button>
        </div>
      </div>

      {/* Faculty Cards Grid (Teacher Name, Subject & Dynamic Session Count) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {uniqueFacultyList.map((fac) => {
          const isSelected = selectedFacultyId === fac.id;
          const facActiveClasses = classes.filter(
            c => !c.isCancelled && !c.isHoliday && doesClassBelongToFaculty(c, fac, uniqueFacultyList)
          );
          const facLectures = facActiveClasses.filter(c => !isDoubtSession(c)).length;
          const facDoubts = facActiveClasses.filter(c => isDoubtSession(c)).length;

          return (
            <GlassCard
              key={fac.id}
              onClick={() => setSelectedFacultyId(fac.id)}
              className={`p-3.5 border transition cursor-pointer relative ${
                isSelected
                  ? 'border-sky-500/80 shadow-[0_0_20px_rgba(2,132,199,0.2)] bg-sky-500/10'
                  : 'border-white/[0.08] hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-manrope font-extrabold text-xs text-white shadow-md flex-shrink-0"
                  style={{ backgroundColor: fac.color }}
                >
                  {fac.initials}
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <h4 className="font-grotesk font-bold text-xs text-white truncate">{fac.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`inline-block px-2 py-0.2 rounded-full font-manrope font-bold text-[9px] ${fac.badgeBg}`}>
                      {fac.subject}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {facLectures} {facLectures === 1 ? 'lec' : 'lecs'}
                      {facDoubts > 0 && <span className="text-purple-300 ml-1">+{facDoubts} doubts</span>}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Selected Faculty Details, Workload Analytics & Chronological Diary */}
      {selectedFaculty && (
        <div className="space-y-5">
          {/* Educator Summary Header */}
          <GlassCard className="p-6" hover={false}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-manrope font-extrabold text-lg text-white shadow-xl flex-shrink-0"
                  style={{ backgroundColor: selectedFaculty.color }}
                >
                  {selectedFaculty.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-grotesk font-extrabold text-lg sm:text-xl text-white">
                      {selectedFaculty.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 font-manrope font-bold text-[10px] uppercase">
                      {selectedFaculty.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-inter mt-1 flex-wrap">
                    {selectedFaculty.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail size={13} className="text-slate-500" />
                        <span>{selectedFaculty.email}</span>
                      </span>
                    )}
                    {selectedFaculty.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-500" />
                        <span>{selectedFaculty.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit & Delete Faculty Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditFacultyModal(selectedFaculty)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 font-manrope font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit size={13} className="text-sky-400" />
                  <span>Edit Faculty</span>
                </button>

                <button
                  onClick={() => setShowDeleteFacultyConfirm(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-manrope font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete Faculty</span>
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Delete Faculty Confirmation Alert */}
          {showDeleteFacultyConfirm && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-grotesk font-bold text-sm">
                <AlertTriangle size={18} />
                <span>Confirm Educator Removal ({selectedFaculty.name})</span>
              </div>
              <p className="font-inter text-xs text-slate-300">
                Removing this educator will <span className="font-bold text-white">NOT delete or corrupt any scheduled classes</span>. Their existing timetable records will safely remain in the master roster and can be reassigned at any time.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowDeleteFacultyConfirm(false)}
                  className="px-4 py-1.5 rounded-xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteFaculty}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase transition cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          {/* ── FACULTY WORKLOAD ANALYTICS & BUFFER CALCULATION PANEL ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tile 1: Daily Workload (with Day Selector & Continuous Buffer Span) */}
            <GlassCard className="p-4 border-sky-500/30">
              <div className="flex items-center justify-between mb-1">
                <span className="font-manrope font-bold text-[10px] text-sky-400 uppercase tracking-wider">
                  Daily Workload ({selectedAnalyticsDay.slice(0, 3)})
                </span>
                <select
                  value={selectedAnalyticsDay}
                  onChange={(e) => {
                    const d = e.target.value as any;
                    setSelectedAnalyticsDay(d);
                    setFacultyDayFilter(d);
                  }}
                  className="bg-[#0d121d] border border-white/10 rounded-lg px-2 py-0.5 text-[10px] font-bold text-white cursor-pointer"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="font-orbitron font-bold text-2xl text-white">
                {formatMinutesToHrsMins(currentDayStat.totalSpanWithBufferMinutes)}
              </div>
              <div className="text-[11px] text-slate-300 font-inter mt-1">
                <span className="font-bold text-sky-300">{currentDayStat.lectureSlots} Lecture(s)</span>
                {currentDayStat.doubtSlots > 0 && (
                  <span className="text-purple-300 font-bold ml-1">+ {currentDayStat.doubtSlots} Doubt(s)</span>
                )} • Window: {currentDayStat.windowLabel}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Net: {formatMinutesToHrsMins(currentDayStat.netMinutes)} + Buffer/Gap: {formatMinutesToHrsMins(currentDayStat.bufferMinutes)}
              </div>
            </GlassCard>

            {/* Tile 2: Weekly Workload & Separate Total Lectures / Total Doubts Counters (Requirement 21) */}
            <GlassCard className="p-4 border-emerald-500/30">
              <div className="flex items-center justify-between mb-1">
                <span className="font-manrope font-bold text-[10px] text-emerald-400 uppercase tracking-wider">
                  Weekly Lectures & Doubts
                </span>
                <select
                  value={selectedWeekFilter}
                  onChange={(e) => {
                    const newW = e.target.value;
                    setSelectedWeekFilter(newW);
                    if (isCurrentAcademicWeek(newW)) {
                      setSelectedAnalyticsDay(getCurrentDayOfWeek());
                      setFacultyDayFilter(getCurrentDayOfWeek());
                    } else {
                      setSelectedAnalyticsDay('Monday');
                      setFacultyDayFilter('Monday');
                    }
                  }}
                  className="bg-[#0d121d] border border-white/10 rounded-lg px-2 py-0.5 text-[10px] font-bold text-white cursor-pointer"
                >
                  {ACADEMIC_WEEKS.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.label} {w.isCurrent ? '⭐ (Current Week)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Two Separate Counters for Total Lectures and Total Doubts (Requirement 21) */}
              <div className="grid grid-cols-2 gap-2 my-1">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30">
                  <span className="text-[10px] font-manrope font-extrabold text-sky-400 uppercase block tracking-wider">
                    Total Lectures
                  </span>
                  <div className="font-orbitron font-extrabold text-2xl text-sky-300">
                    {workloadAnalytics.totalAssignedLectures}
                  </div>
                  <span className="text-[9px] text-slate-400 font-inter">Pure Teaching Slots</span>
                </div>

                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <span className="text-[10px] font-manrope font-extrabold text-purple-400 uppercase block tracking-wider">
                    Total Doubts
                  </span>
                  <div className="font-orbitron font-extrabold text-2xl text-purple-300">
                    {workloadAnalytics.totalDoubtSessions}
                  </div>
                  <span className="text-[9px] text-slate-400 font-inter">Doubt Clearing Slots</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Full Span: {formatMinutesToHrsMins(workloadAnalytics.weeklySpanWithBufferMinutes)} (Net: {formatMinutesToHrsMins(workloadAnalytics.weeklyNetMinutes)} + Gap: {formatMinutesToHrsMins(workloadAnalytics.weeklyBufferMinutes)})
              </div>
            </GlassCard>

            {/* Tile 3: Actual Monthly Workload (Actual Scheduled Classes in Selected Month — No 4x Pre-Multiplication) */}
            <GlassCard className="p-4 border-amber-500/30">
              <div className="flex items-center justify-between mb-1">
                <span className="font-manrope font-bold text-[10px] text-amber-400 uppercase tracking-wider">
                  Monthly Workload (Actual)
                </span>
                <select
                  value={selectedMonthFilter}
                  onChange={(e) => setSelectedMonthFilter(e.target.value)}
                  className="bg-[#0d121d] border border-white/10 rounded-lg px-2 py-0.5 text-[10px] font-bold text-white cursor-pointer"
                >
                  {availableMonths.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                  <option value="all">All Scheduled</option>
                </select>
              </div>
              <div className="font-orbitron font-bold text-2xl text-white">
                {formatMinutesToHrsMins(workloadAnalytics.monthlySpanWithBufferMinutes)}
              </div>
              <div className="text-[11px] text-slate-300 font-inter mt-1">
                <span className="font-bold text-amber-300">
                  {workloadAnalytics.monthlyLectures} Lecture(s)
                </span>
                {workloadAnalytics.monthlyDoubts > 0 && (
                  <span className="text-purple-300 font-bold ml-1">
                    + {workloadAnalytics.monthlyDoubts} Doubt(s)
                  </span>
                )}
                <span className="text-slate-400 ml-1">in month</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Net: {formatMinutesToHrsMins(workloadAnalytics.monthlyNetMinutes)} + Buffer: {formatMinutesToHrsMins(workloadAnalytics.monthlyBufferMinutes)}
              </div>
            </GlassCard>

            {/* Tile 4: Assigned Classes vs Doubt Sessions Breakdown with 3 Modes: Daily, Weekly, Monthly (Requirement 25) */}
            <GlassCard className="p-4 border-purple-500/30">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-manrope font-bold text-[10px] text-purple-300 uppercase tracking-wider block">
                      Classes vs Doubts Breakdown
                    </span>
                    {/* 3 Mode Tabs: Daily / Weekly / Monthly (Requirement 25) */}
                    <div className="flex bg-[#0d121d] p-0.5 rounded-lg border border-white/10">
                      {(['daily', 'weekly', 'monthly'] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setBreakdownMode(mode)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition cursor-pointer ${
                            breakdownMode === mode
                              ? 'bg-purple-500 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {mode === 'daily' ? 'Day' : mode === 'weekly' ? 'Wk' : 'Mo'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    if (breakdownMode === 'monthly') {
                      const lectures = workloadAnalytics.monthlyLectures;
                      const doubts = workloadAnalytics.monthlyDoubts;
                      const cancelled = workloadAnalytics.monthlyCancelled;
                      const totalAllotted = workloadAnalytics.monthlyTotalAllotted;
                      const lecPct = totalAllotted > 0 ? Math.round((lectures / totalAllotted) * 100) : 0;
                      const doubtPct = totalAllotted > 0 ? Math.round((doubts / totalAllotted) * 100) : 0;
                      const cancelPct = totalAllotted > 0 ? Math.max(0, 100 - lecPct - doubtPct) : 0;

                      return (
                        <>
                          <div className="grid grid-cols-3 gap-1 text-center mt-1">
                            <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg py-1 px-1">
                              <div className="font-orbitron font-bold text-base text-sky-400">
                                {lectures}
                              </div>
                              <div className="text-[9px] text-slate-300 font-inter">Total Classes</div>
                            </div>
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg py-1 px-1">
                              <div className="font-orbitron font-bold text-base text-purple-400">
                                {doubts}
                              </div>
                              <div className="text-[9px] text-slate-300 font-inter">Total Doubts</div>
                            </div>
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg py-1 px-1">
                              <div className="font-orbitron font-bold text-base text-rose-400">
                                {cancelled}
                              </div>
                              <div className="text-[9px] text-slate-300 font-inter">Cancelled</div>
                            </div>
                          </div>

                          {/* 3-Color Stacked Metric Bar */}
                          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex mt-2">
                            <div
                              style={{ width: `${lecPct}%` }}
                              className="bg-sky-500 transition-all duration-300"
                              title={`Classes: ${lectures} (${lecPct}%)`}
                            />
                            <div
                              style={{ width: `${doubtPct}%` }}
                              className="bg-purple-500 transition-all duration-300"
                              title={`Doubts: ${doubts} (${doubtPct}%)`}
                            />
                            <div
                              style={{ width: `${cancelPct}%` }}
                              className="bg-rose-500 transition-all duration-300"
                              title={`Cancelled: ${cancelled} (${cancelPct}%)`}
                            />
                          </div>

                          <div className="text-[10px] text-slate-400 font-inter mt-1.5 flex justify-between">
                            <span className="text-white font-semibold">
                              Monthly Allotted: {totalAllotted} Total
                            </span>
                            <span className="text-rose-300">
                              {cancelled > 0 ? `${cancelled} Cancelled` : '0 Cancelled'}
                            </span>
                          </div>
                        </>
                      );
                    }

                    // Daily or Weekly Breakdown
                    const isDaily = breakdownMode === 'daily';
                    const label = isDaily
                      ? `Daily (${selectedAnalyticsDay.slice(0, 3)})`
                      : 'Weekly Total';
                    const lectures = isDaily
                      ? currentDayStat.lectureSlots
                      : workloadAnalytics.totalAssignedLectures;
                    const doubts = isDaily
                      ? currentDayStat.doubtSlots
                      : workloadAnalytics.totalDoubtSessions;
                    const total = isDaily
                      ? currentDayStat.totalSlots
                      : workloadAnalytics.totalActiveWeeklySessions;

                    const lecturePercent = total > 0 ? Math.round((lectures / total) * 100) : 0;

                    return (
                      <>
                        <div className="flex items-baseline justify-between mt-1">
                          <div>
                            <span className="font-orbitron font-bold text-xl text-sky-400">
                              {lectures}
                            </span>
                            <span className="text-[11px] text-slate-300 ml-1">
                              {isDaily ? 'Daily Classes' : 'Weekly Classes'}
                            </span>
                          </div>
                          <span className="text-slate-600">|</span>
                          <div>
                            <span className="font-orbitron font-bold text-xl text-purple-400">
                              {doubts}
                            </span>
                            <span className="text-[11px] text-slate-300 ml-1">
                              {isDaily ? 'Daily Doubts' : 'Weekly Doubts'}
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex mt-2">
                          <div
                            style={{ width: `${lecturePercent}%` }}
                            className="bg-sky-500 transition-all duration-300"
                            title={`Classes: ${lectures} (${lecturePercent}%)`}
                          />
                          <div
                            style={{ width: `${100 - lecturePercent}%` }}
                            className="bg-purple-500 transition-all duration-300"
                            title={`Doubts: ${doubts} (${100 - lecturePercent}%)`}
                          />
                        </div>

                        <div className="text-[10px] text-slate-400 font-inter mt-1.5 flex justify-between">
                          <span className="text-white font-semibold">
                            {label}: {total} Total Count
                          </span>
                          <span className="text-purple-300">
                            {doubts} Doubts ({total > 0 ? 100 - lecturePercent : 0}%)
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Day-by-Day Continuous Slot + Buffer Breakdown Strip */}
          <GlassCard className="p-4 bg-sky-950/15 border-sky-500/20" hover={false}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-sky-400" />
                <span className="font-grotesk font-bold text-xs text-white uppercase tracking-wider">
                  7-Day Continuous Workload Breakdown (Buffer & Gap Time Included)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-inter">
                Click any day below to filter diary strictly to that day (Requirement 23)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map(d => {
                const st = workloadAnalytics.perDayStats[d];
                const isCurr = selectedAnalyticsDay === d && facultyDayFilter !== 'all';
                const isTodayInWeek = isCurrentAcademicWeek(selectedWeekFilter) && d === getCurrentDayOfWeek();

                return (
                  <div
                    key={d}
                    onClick={() => {
                      setSelectedAnalyticsDay(d);
                      setFacultyDayFilter(d);
                    }}
                    className={`relative p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      isCurr
                        ? 'bg-sky-500/20 border-sky-400 text-white shadow-md'
                        : 'bg-[#0d121d]/70 border-white/10 text-slate-300 hover:border-white/20'
                    } ${
                      isTodayInWeek
                        ? 'ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.55)] border-emerald-400'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[11px] flex items-center gap-1">
                        {isTodayInWeek && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                          </span>
                        )}
                        {d.slice(0, 3)}
                      </span>
                      <span className="font-mono text-[10px] text-sky-400">
                        {st.lectureSlots} {st.lectureSlots === 1 ? 'lec' : 'lecs'}
                        {st.doubtSlots > 0 && <span className="text-purple-300 ml-1">+{st.doubtSlots}d</span>}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-sm text-white mt-1">
                      {formatMinutesToHrsMins(st.totalSpanWithBufferMinutes)}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate mt-0.5">
                      {st.windowLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Chronological Schedule Diary (Requirement 23 & 24: Strict Single Day & Faculty Isolation) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-grotesk font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-sky-400" />
                  <span>
                    Scheduled Sessions {facultyDayFilter === 'all' ? '(Full Week)' : `(${facultyDayFilter})`}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 font-inter mt-0.5">
                  {facultyDayFilter === 'all'
                    ? `Showing all ${facultyClasses.length} sessions across the week for ${selectedFaculty.name}`
                    : `Strictly showing only ${facultyDayFilter}'s sessions (${displayedFacultyClasses.length} sessions for ${selectedFaculty.name})`}
                </p>
              </div>

              {/* Quick Toggle: Single Day vs All Week (Requirement 22 & 23) */}
              <div className="flex items-center gap-1.5 bg-[#0d121d] p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setFacultyDayFilter(selectedAnalyticsDay)}
                  className={`px-3 py-1 rounded-lg text-xs font-manrope font-bold transition cursor-pointer ${
                    facultyDayFilter !== 'all'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Single Day ({selectedAnalyticsDay.slice(0, 3)})
                </button>
                <button
                  type="button"
                  onClick={() => setFacultyDayFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-manrope font-bold transition cursor-pointer ${
                    facultyDayFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Week ({facultyClasses.length})
                </button>
              </div>
            </div>

            {displayedFacultyClasses.length === 0 ? (
              <GlassCard className="p-8 text-center text-slate-400">
                <Calendar size={28} className="mx-auto mb-2 text-slate-500" />
                <p className="font-grotesk font-bold text-sm">
                  No scheduled classes found for {selectedFaculty.name} on {facultyDayFilter === 'all' ? 'this week' : facultyDayFilter}.
                </p>
                {facultyDayFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setFacultyDayFilter('all')}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    View All Days of the Week ({facultyClasses.length} total)
                  </button>
                )}
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedFacultyClasses.map(cls => (
                  <GlassCard
                    key={cls.id}
                    className={`p-4 ${
                      cls.isHoliday
                        ? 'border-amber-500/50 bg-amber-950/20'
                        : cls.isCancelled
                        ? 'border-rose-500/50 bg-rose-950/20'
                        : ''
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{cls.day}</span>
                          <span className="font-mono text-xs text-slate-400">{cls.startTime} - {cls.endTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {cls.classType === 'doubt' ? (
                            <span className="px-2 py-0.2 rounded bg-purple-500/25 text-purple-300 font-bold text-[9px] uppercase">
                              Doubt
                            </span>
                          ) : (
                            <span className="px-2 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold text-[9px] uppercase">
                              Lecture
                            </span>
                          )}
                          {cls.isHoliday && (
                            <span className="px-2 py-0.2 rounded bg-amber-500 text-slate-950 font-bold text-[9px] uppercase">
                              Holiday
                            </span>
                          )}
                          {cls.isCancelled && !cls.isHoliday && (
                            <span className="px-2 py-0.2 rounded bg-rose-500 text-white font-bold text-[9px] uppercase">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Prominent Batch Name */}
                      <div>
                        <div className="text-xs font-manrope font-extrabold text-sky-400 uppercase tracking-wide">
                          BATCH: <span className="text-white">{cls.batchName}</span>
                        </div>
                        <p className="font-inter text-xs text-slate-300 mt-0.5">
                          Subject: {cls.subject} • Date: {cls.dateISO || cls.dateStr || '-'}
                        </p>
                      </div>

                      {/* Notes Status & Edit */}
                      <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/10">
                        <span className={cls.notesUrl ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {cls.notesUrl ? '✓ Notes Attached' : 'Notes Pending'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingClass(cls)}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-sky-500/20 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Edit size={11} className="text-sky-400" />
                            <span>Edit</span>
                          </button>
                          {onDeleteClassSession && (
                            <button
                              onClick={() => onDeleteClassSession(cls.id)}
                              className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                              title="Delete Session"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Faculty Modal */}
      {showFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <GlassCard className="max-w-md w-full p-6 space-y-4" hover={false}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="font-grotesk font-bold text-base text-white">
                {editingFaculty ? 'Edit Educator Profile' : 'Add New Educator'}
              </h4>
              <button onClick={() => setShowFacultyModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveFaculty} className="space-y-3 font-inter text-xs">
              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                  Full Name (e.g. Dr. R. K. Sharma Sir)
                </label>
                <input
                  type="text"
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  required
                  placeholder="Educator Name"
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                    Subject Department
                  </label>
                  <select
                    value={facSubject}
                    onChange={(e) => setFacSubject(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-bold"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Maths">Maths</option>
                    <option value="Astronomy">Astronomy</option>
                    <option value="Biology">Biology</option>
                    <option value="Botany">Botany</option>
                    <option value="Zoology">Zoology</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                    Initials (e.g. RS)
                  </label>
                  <input
                    type="text"
                    value={facInitials}
                    onChange={(e) => setFacInitials(e.target.value)}
                    placeholder="Auto or Custom"
                    className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={facEmail}
                  onChange={(e) => setFacEmail(e.target.value)}
                  placeholder="faculty@narayanagroup.com"
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={facPhone}
                  onChange={(e) => setFacPhone(e.target.value)}
                  placeholder="+91 98111 XXXXX"
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                  Profile Badge Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={facColor}
                    onChange={(e) => setFacColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/20"
                  />
                  <span className="font-mono text-xs text-slate-400">{facColor}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFacultyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-bold uppercase tracking-wider shadow-md cursor-pointer"
                >
                  Save Educator
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Simplified Add Session Modal (Batch Dropdown, No Room input, No Drive/Meeting ID) */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <GlassCard className="max-w-md w-full p-6 space-y-4" hover={false}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="font-grotesk font-bold text-base text-white">Add Class / Doubt Session</h4>
              <button onClick={() => setShowAddClassModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3 font-inter text-xs">
              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">Educator</label>
                <select
                  value={newFacultyId}
                  onChange={(e) => handleFacultyChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-grotesk font-bold cursor-pointer"
                >
                  {uniqueFacultyList.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.subject})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sky-300 font-manrope font-bold uppercase mb-1">
                    Select Batch (Dropdown)
                  </label>
                  <select
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-sky-500/40 text-white font-bold cursor-pointer"
                  >
                    {batchList.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                    Session Type
                  </label>
                  <select
                    value={newClassType}
                    onChange={(e) => setNewClassType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-bold cursor-pointer"
                  >
                    <option value="class">Regular Class</option>
                    <option value="doubt">Doubt Session</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">Day (Includes Sunday)</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white cursor-pointer"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={newDateISO}
                    onChange={(e) => setNewDateISO(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">Start Time</label>
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">End Time</label>
                  <input
                    type="text"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    placeholder="05:55 PM"
                    className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-bold uppercase tracking-wider shadow-md cursor-pointer"
                >
                  Save Session
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Edit Class Modal */}
      {editingClass && (
        <EditClassModal
          cls={editingClass}
          facultyList={facultyList}
          availableBatches={batchList}
          isOpen={Boolean(editingClass)}
          onClose={() => setEditingClass(null)}
          onSave={(updated) => {
            if (onUpdateClassStatus) onUpdateClassStatus(updated.id, updated);
          }}
          onDelete={(classId) => {
            if (onDeleteClassSession) onDeleteClassSession(classId);
          }}
        />
      )}
    </div>
  );
};
