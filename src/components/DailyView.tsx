import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Filter,
  Video,
  AlertTriangle,
  Edit,
  Trash2,
  Layers,
  Sparkles,
  X,
  CheckCircle2,
  Palmtree
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ClassSession, UserProfile, Faculty } from '../types';
import {
  ACADEMIC_WEEKS,
  filterClassesByWeek,
  doesClassBelongToFaculty,
  getCurrentAcademicWeekId,
  getCurrentDayOfWeek,
  sortClassesChronologically,
  isCurrentAcademicWeek,
  isWorkshopClass
} from '../utils/weekUtils';
import { EditClassModal } from './EditClassModal';

interface DailyViewProps {
  classes: ClassSession[];
  currentUser: UserProfile;
  facultyList?: Faculty[];
  availableBatches?: string[];
  onUpdateClassStatus?: (classId: string, updates: Partial<ClassSession>) => void;
  onDeleteClassSession?: (classId: string) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({
  classes,
  currentUser,
  facultyList = [],
  availableBatches = [],
  onUpdateClassStatus,
  onDeleteClassSession
}) => {
  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

  const [selectedDay, setSelectedDay] = useState<typeof daysList[number] | 'All'>(() => getCurrentDayOfWeek());
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [selectedWorkshopSubtype, setSelectedWorkshopSubtype] = useState<string>('All');
  const [selectedWeek, setSelectedWeek] = useState<string>(() => getCurrentAcademicWeekId());
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);

  // 1. Filter by Week
  const weekClasses = useMemo(
    () => filterClassesByWeek(classes, selectedWeek),
    [classes, selectedWeek]
  );

  // 2. Filter by Day and User Role
  const dayRoleClasses = useMemo(() => {
    let list = selectedDay === 'All' ? weekClasses : weekClasses.filter(c => c.day === selectedDay);
    if (currentUser.role === 'faculty' && currentUser.facultyId) {
      list = list.filter(c =>
        doesClassBelongToFaculty(
          c,
          { id: currentUser.facultyId!, name: currentUser.name },
          facultyList
        )
      );
    }
    return list;
  }, [weekClasses, selectedDay, currentUser, facultyList]);

  // Isolate workshop classes vs regular classes for the selected day
  const dayWorkshopClasses = useMemo(() => {
    return dayRoleClasses.filter(c => isWorkshopClass(c));
  }, [dayRoleClasses]);

  const dayRegularClasses = useMemo(() => {
    return dayRoleClasses.filter(c => !isWorkshopClass(c));
  }, [dayRoleClasses]);

  // Compute non-workshop regular batch counts for the selected day (never include dummy ALL_BATCH)
  const regularBatchesSummary = useMemo(() => {
    const countMap = new Map<string, { total: number; subjects: string[] }>();
    dayRegularClasses.forEach(c => {
      if (!c.batchName) return;
      if (/^all[-_\s]*batch/i.test(c.batchName)) return;
      const existing = countMap.get(c.batchName) || { total: 0, subjects: [] };
      existing.total += 1;
      if (c.subject && !existing.subjects.includes(c.subject)) {
        existing.subjects.push(c.subject);
      }
      countMap.set(c.batchName, existing);
    });
    return Array.from(countMap.entries()).map(([batchName, info]) => ({
      batchName,
      count: info.total,
      subjects: info.subjects
    }));
  }, [dayRegularClasses]);

  // Available workshop subtypes (e.g., NSEA, NSEP, NSEC, NSEB, NSEJS, NMTC) for optional sub-filtering
  const workshopSubtypes = useMemo(() => {
    const set = new Set<string>();
    dayWorkshopClasses.forEach(c => {
      if (c.batchName) set.add(c.batchName);
    });
    return Array.from(set).sort();
  }, [dayWorkshopClasses]);

  // 3. Apply Batch & Subject Filter AND Sort strictly chronologically by start time
  const dayClasses = useMemo(() => {
    let list = dayRoleClasses;
    if (selectedBatch === 'WORKSHOPS') {
      // Single Click on "Workshops" tab: ONLY workshops! Regular lectures and doubts are strictly excluded!
      list = dayWorkshopClasses;
      if (selectedWorkshopSubtype !== 'All') {
        list = list.filter(c => c.batchName === selectedWorkshopSubtype);
      }
    } else if (selectedBatch !== 'All') {
      list = list.filter(c => c.batchName === selectedBatch);
    }
    if (subjectFilter !== 'All') {
      list = list.filter(c => c.subject === subjectFilter);
    }
    return sortClassesChronologically(list);
  }, [dayRoleClasses, dayWorkshopClasses, selectedBatch, selectedWorkshopSubtype, subjectFilter]);

  const handleSaveClass = (updated: ClassSession) => {
    if (onUpdateClassStatus) {
      onUpdateClassStatus(updated.id, updated);
    }
  };

  const handleDeleteClass = (classId: string) => {
    if (onDeleteClassSession) {
      onDeleteClassSession(classId);
    }
  };

  const handleBatchClick = (bName: string) => {
    setSelectedBatch(prev => (prev === bName ? 'All' : bName));
    setSelectedWorkshopSubtype('All');
  };

  const handleWeekChange = (newW: string) => {
    setSelectedWeek(newW);
    setSelectedBatch('All');
    setSelectedWorkshopSubtype('All');
    if (isCurrentAcademicWeek(newW)) {
      // Current Week selected: Open today's current day!
      setSelectedDay(getCurrentDayOfWeek());
    } else {
      // Past week (Last week) or Upcoming week selected: Start from Monday!
      setSelectedDay('Monday');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Filters Ribbon */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-orbitron font-extrabold text-xl text-white tracking-wide">
            DAILY TIMETABLE & INTERACTIVE BATCH VIEW
          </h2>
          <p className="font-inter text-slate-400 text-xs mt-1">
            Click on any <span className="text-sky-400 font-bold">Batch</span> below to highlight and filter how many classes are scheduled for that batch on <span className="text-white font-bold">{selectedDay}</span>
          </p>
        </div>

        {/* Filter Controls: Week Selector & Subject Filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Week Selector Filter */}
          <div className="flex items-center gap-1.5 bg-[#131926] p-1.5 rounded-xl border border-white/10 text-xs">
            <Layers size={14} className="text-amber-400 ml-1.5" />
            <select
              value={selectedWeek}
              onChange={(e) => handleWeekChange(e.target.value)}
              className="bg-transparent text-xs font-grotesk font-bold text-white focus:outline-none pr-2 cursor-pointer"
            >
              {ACADEMIC_WEEKS.map(w => (
                <option key={w.id} value={w.id} className="bg-[#111520]">
                  {w.label} {w.isCurrent ? '⭐ (Current Week)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1 bg-[#131926] p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
            <Filter size={14} className="text-slate-400 ml-2 mr-1 flex-shrink-0" />
            {['All', 'Physics', 'Chemistry', 'Maths', 'Biology', 'Astronomy', 'Botany', 'Zoology'].map(sub => (
              <button
                key={sub}
                onClick={() => setSubjectFilter(sub)}
                className={`px-3 py-1 rounded-lg text-xs font-manrope font-bold transition cursor-pointer whitespace-nowrap ${
                  subjectFilter === sub
                    ? 'bg-[#0072BC] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day Selector Tabs (All 7 Days Including Sunday + All Week Option) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => {
            setSelectedDay('All');
            setSelectedBatch('All');
          }}
          className={`relative px-4 sm:px-5 py-2.5 rounded-xl font-grotesk font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer flex-shrink-0 ${
            selectedDay === 'All'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.45)] border border-amber-300 font-extrabold'
              : 'bg-[#131926]/80 text-amber-300 hover:text-white border border-amber-500/20'
          }`}
        >
          <CalendarDays size={14} className={selectedDay === 'All' ? 'text-slate-950' : 'text-amber-400'} />
          <span>All Week (Full Roster)</span>
        </button>
        {daysList.map(d => {
          const isSelected = selectedDay === d;
          const isSun = d === 'Sunday';
          const isCurrentToday = isCurrentAcademicWeek(selectedWeek) && d === getCurrentDayOfWeek();

          return (
            <button
              key={d}
              onClick={() => {
                setSelectedDay(d);
                setSelectedBatch('All');
              }}
              className={`relative px-4 sm:px-5 py-2.5 rounded-xl font-grotesk font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                isSelected
                  ? 'bg-[#0072BC] text-white shadow-[0_0_20px_rgba(0,114,188,0.45)] border border-sky-400'
                  : 'bg-[#131926]/80 text-slate-400 hover:text-white border border-white/5'
              } ${
                isCurrentToday
                  ? isSelected
                    ? 'ring-2 ring-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.7),inset_0_0_12px_rgba(52,211,153,0.3)] border-emerald-400 font-extrabold'
                    : 'ring-2 ring-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.5)] border-emerald-400/80 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
                  : ''
              }`}
            >
              {isCurrentToday && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                </span>
              )}
              <CalendarDays
                size={14}
                className={
                  isCurrentToday ? 'text-emerald-300' : isSelected ? 'text-white' : isSun ? 'text-amber-400' : 'text-sky-400'
                }
              />
              <span>{isSun ? 'Sunday 🌟' : d}</span>
            </button>
          );
        })}
      </div>

      {/* ── INTERACTIVE BATCH & MERGED WORKSHOPS SELECTOR FOR SELECTED DAY ── */}
      <GlassCard className="p-4 bg-[#0d1424]/90 border-sky-500/25 space-y-3" hover={false}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-sky-400" />
            <span className="font-grotesk font-bold text-xs text-white uppercase tracking-wider">
              Classes & Workshops on {selectedDay} ({dayRoleClasses.length} Scheduled Sessions) — 1-Click Inspection
            </span>
          </div>
          {selectedBatch !== 'All' && (
            <button
              onClick={() => {
                setSelectedBatch('All');
                setSelectedWorkshopSubtype('All');
              }}
              className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-manrope font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <X size={13} />
              <span>Clear Filter (Show All Classes)</span>
            </button>
          )}
        </div>

        {dayRoleClasses.length === 0 ? (
          <p className="text-xs text-slate-400 font-inter">
            No batches or workshops have scheduled sessions on {selectedDay}.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. All Batches / Classes Tab */}
            <button
              onClick={() => {
                setSelectedBatch('All');
                setSelectedWorkshopSubtype('All');
              }}
              className={`px-3.5 py-2 rounded-xl font-grotesk font-bold text-xs transition cursor-pointer flex items-center gap-2 border ${
                selectedBatch === 'All'
                  ? 'bg-[#0072BC] text-white border-sky-400 shadow-md'
                  : 'bg-white/[0.04] text-slate-300 border-white/10 hover:border-white/25'
              }`}
            >
              <span>All Classes</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono">
                {dayRoleClasses.length}
              </span>
            </button>

            {/* 2. SINGLE PARENT "WORKSHOPS" TAB — Merges all separate workshop tabs into one parent tab! */}
            {dayWorkshopClasses.length > 0 && (
              <button
                onClick={() => {
                  setSelectedBatch(selectedBatch === 'WORKSHOPS' ? 'All' : 'WORKSHOPS');
                  setSelectedWorkshopSubtype('All');
                }}
                className={`px-4 py-2 rounded-xl font-grotesk font-bold text-xs transition cursor-pointer flex items-center gap-2 border ${
                  selectedBatch === 'WORKSHOPS'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.45)] scale-[1.02]'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/20'
                }`}
                title="Single-click to view only upcoming and ongoing workshops (Regular classes excluded)"
              >
                <Sparkles size={14} className={selectedBatch === 'WORKSHOPS' ? 'text-amber-100 animate-spin-slow' : 'text-amber-400'} />
                <span className="tracking-wide">Workshops</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                    selectedBatch === 'WORKSHOPS'
                      ? 'bg-white text-amber-950 shadow-sm'
                      : 'bg-amber-500/25 text-amber-200'
                  }`}
                >
                  {dayWorkshopClasses.length} {dayWorkshopClasses.length === 1 ? 'Workshop' : 'Workshops'}
                </span>
              </button>
            )}

            {/* 3. Regular Batches (e.g. MATH-A-HOLIC, SEHSS_CLASS) — workshop batches are NOT duplicated here */}
            {regularBatchesSummary.map(b => {
              const isSelected = selectedBatch === b.batchName;
              return (
                <button
                  key={b.batchName}
                  onClick={() => {
                    handleBatchClick(b.batchName);
                    setSelectedWorkshopSubtype('All');
                  }}
                  className={`px-3.5 py-2 rounded-xl font-grotesk font-bold text-xs transition cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-[1.02]'
                      : 'bg-white/[0.04] text-slate-200 border-white/10 hover:border-sky-400/50 hover:bg-sky-500/10'
                  }`}
                >
                  <span>{b.batchName}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                      isSelected ? 'bg-white text-emerald-950' : 'bg-sky-500/20 text-sky-300'
                    }`}
                  >
                    {b.count} {b.count === 1 ? 'Class' : 'Classes'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 1-CLICK WORKSHOPS ACTIVE BANNER & SUB-FILTER */}
        {selectedBatch === 'WORKSHOPS' && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/35 space-y-2.5 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-amber-200">
                <CheckCircle2 size={16} className="text-amber-400 flex-shrink-0" />
                <span>
                  Active Filter: <strong className="text-white font-bold">{dayClasses.length} Ongoing/Upcoming Workshop(s)</strong> on{' '}
                  <strong className="text-amber-300">{selectedDay}</strong> <span className="text-amber-300/80 font-mono text-[11px]">(Regular lectures and doubts excluded)</span>
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedBatch('All');
                  setSelectedWorkshopSubtype('All');
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <X size={12} />
                <span>Show All Regular & Workshop Classes</span>
              </button>
            </div>

            {/* Optional drill-down pills to inspect a specific workshop */}
            {workshopSubtypes.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-amber-500/20">
                <span className="text-[10px] uppercase font-mono text-amber-400 font-bold mr-1">
                  Inspect Workshop:
                </span>
                <button
                  onClick={() => setSelectedWorkshopSubtype('All')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-manrope font-bold transition cursor-pointer ${
                    selectedWorkshopSubtype === 'All'
                      ? 'bg-amber-400 text-amber-950 shadow-sm'
                      : 'bg-black/30 text-amber-200 hover:bg-black/50'
                  }`}
                >
                  All Workshops ({dayWorkshopClasses.length})
                </button>
                {workshopSubtypes.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedWorkshopSubtype(sub)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-manrope font-bold transition cursor-pointer ${
                      selectedWorkshopSubtype === sub
                        ? 'bg-amber-400 text-amber-950 shadow-sm'
                        : 'bg-black/30 text-amber-200 hover:bg-black/50'
                    }`}
                  >
                    {sub} ({dayWorkshopClasses.filter(c => c.batchName === sub).length})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Regular Batch Highlight Summary Banner */}
        {selectedBatch !== 'All' && selectedBatch !== 'WORKSHOPS' && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
              <span>
                Batch <strong className="text-white underline">{selectedBatch}</strong> has{' '}
                <strong className="text-emerald-300">{dayClasses.length} scheduled class(es)</strong> on{' '}
                <strong className="text-white">{selectedDay}</strong>:{' '}
                {dayClasses.map(c => `${c.subject} (${c.startTime} - ${c.endTime})`).join('  •  ')}
              </span>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Cards Grid */}
      {dayClasses.length === 0 ? (
        <GlassCard className="p-12 text-center space-y-3">
          <CalendarDays size={40} className="mx-auto text-slate-500" />
          <h3 className="font-grotesk font-bold text-base text-white">No Classes Found</h3>
          <p className="font-inter text-xs text-slate-400">
            No scheduled sessions for {selectedDay} matching the selected filters.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dayClasses.map((cls) => {
            const subjectBorder =
              cls.isHoliday
                ? 'border-l-4 border-amber-400'
                : cls.subject === 'Physics'
                ? 'border-l-4 border-sky-400'
                : cls.subject === 'Chemistry'
                ? 'border-l-4 border-emerald-400'
                : cls.subject === 'Maths'
                ? 'border-l-4 border-amber-400'
                : 'border-l-4 border-rose-400';

            const isBatchHighlighted = selectedBatch === cls.batchName;

            return (
              <GlassCard
                key={cls.id}
                className={`p-5 ${subjectBorder} ${
                  cls.isHoliday
                    ? 'border-amber-500/40 bg-amber-950/20'
                    : cls.isCancelled
                    ? 'border-rose-500/40 bg-rose-950/20'
                    : ''
                } ${isBatchHighlighted ? 'ring-2 ring-emerald-400/70 shadow-[0_0_25px_rgba(16,185,129,0.2)]' : ''}`}
              >
                <div className="space-y-3">
                  {/* Top time & Clickable Batch Label */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-white bg-white/[0.06] px-2.5 py-1 rounded-md">
                      {cls.startTime} - {cls.endTime}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBatchClick(cls.batchName)}
                      title="Click to filter all classes for this batch today"
                      className={`px-2.5 py-0.5 rounded-full font-manrope font-extrabold text-[10px] uppercase border transition cursor-pointer ${
                        isBatchHighlighted
                          ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                          : 'bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/35'
                      }`}
                    >
                      Batch: {cls.batchName}
                    </button>
                  </div>

                  {/* Main Subject & Educator */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-grotesk font-extrabold text-base text-white">
                        {cls.subject}
                      </h3>
                      {cls.classType === 'doubt' && (
                        <span className="px-2 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold text-[9px] uppercase">
                          Doubt Session
                        </span>
                      )}
                    </div>
                    <div
                      onClick={() => handleBatchClick(cls.batchName)}
                      className="text-xs text-sky-300 font-manrope font-bold mt-0.5 cursor-pointer hover:underline"
                    >
                      Batch: <span className="text-white">{cls.batchName}</span>
                    </div>
                    <p className="font-inter text-xs text-slate-300 mt-1">
                      Educator: <span className="font-semibold text-white">{cls.facultyName}</span>
                    </p>
                    {cls.dateISO && (
                      <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                        Date: {cls.dateISO} ({cls.day})
                      </p>
                    )}
                  </div>

                  {/* Holiday or Cancelled Alert */}
                  {cls.isHoliday ? (
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-200 text-xs font-inter flex items-center gap-1.5">
                      <Palmtree size={14} className="flex-shrink-0 text-amber-400" />
                      <span className="font-bold">Class Holiday: {cls.holidayTitle || 'Academic Holiday'}</span>
                    </div>
                  ) : (
                    cls.isCancelled && (
                      <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-inter flex items-center gap-1.5">
                        <AlertTriangle size={14} className="flex-shrink-0" />
                        <span>Cancelled: {cls.cancellationReason || 'Scheduled Adjustment'}</span>
                      </div>
                    )
                  )}

                  {/* Action Buttons: Join Class, Edit Class, Delete Class */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
                    <a
                      href={
                        cls.directLink ||
                        `https://zoom.us/j/${(cls.zoomMeetingId || '81240917731').replace(/\s/g, '')}?pwd=${cls.zoomPassword || 'NARAYANA'}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-grotesk font-bold text-sky-400 hover:underline"
                    >
                      <Video size={13} />
                      <span>Join Class</span>
                    </a>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        onClick={() => setEditingClass(cls)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-sky-500/20 text-slate-300 hover:text-white border border-white/10 hover:border-sky-500/40 text-xs font-manrope font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Edit all class functions"
                      >
                        <Edit size={12} className="text-sky-400" />
                        <span>Edit</span>
                      </button>

                      {onDeleteClassSession && (
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/25 transition cursor-pointer"
                          title="Delete Class"
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

      {/* Edit Class Modal */}
      {editingClass && (
        <EditClassModal
          cls={editingClass}
          facultyList={facultyList}
          availableBatches={availableBatches}
          isOpen={Boolean(editingClass)}
          onClose={() => setEditingClass(null)}
          onSave={handleSaveClass}
          onDelete={handleDeleteClass}
        />
      )}
    </div>
  );
};
