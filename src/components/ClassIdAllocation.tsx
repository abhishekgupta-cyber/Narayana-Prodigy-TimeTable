import React, { useState, useEffect, useMemo } from 'react';
import {
  KeyRound,
  Copy,
  ExternalLink,
  QrCode,
  Check,
  Star,
  Search,
  X,
  Edit,
  Plus,
  Trash2,
  Sparkles,
  Link as LinkIcon,
  RotateCcw,
  CalendarClock,
  Clock,
  AlertCircle,
  GraduationCap,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { GlassCard } from './GlassCard';
import { ClassSession } from '../types';

export interface ZoomBatchInfo {
  id: string;
  batchName: string;
  category: string;
  meetingId: string;
  password: string;
  directUrl?: string;
  lastLinkDateISO?: string;
  fav?: boolean;
}

interface ClassIdAllocationProps {
  classes?: ClassSession[];
  availableBatches?: string[];
  onUpdateClassSession?: (classId: string, updates: Partial<ClassSession>) => void;
}

const DEFAULT_BATCHES: ZoomBatchInfo[] = [
  { id: 'b-1', batchName: 'NSEA_WORKSHOP', category: 'ASTRONOMY', meetingId: '812 4091 7731', password: 'NSEA_ASTRONOMY', fav: true },
  { id: 'b-2', batchName: 'MATH-A-HOLIC', category: 'MATHS', meetingId: '845 2209 1104', password: 'MATH_RAMNIWAS', fav: true },
  { id: 'b-3', batchName: 'NSEB_WORKSHOP_BOTANY', category: 'BOTANY', meetingId: '890 3312 9940', password: 'BOTANY_VIMAL', fav: true },
  { id: 'b-4', batchName: 'NSEB_WORKSHOP_ZOO', category: 'ZOOLOGY', meetingId: '871 4452 3319', password: 'ZOO_NIRAV', fav: true },
  { id: 'b-5', batchName: 'NSEC_WORKSHOP', category: 'CHEMISTRY', meetingId: '822 6671 4402', password: 'NSEC_CHEMISTRY', fav: true },
  { id: 'b-6', batchName: 'NSEP_WORKSHOP', category: 'PHYSICS', meetingId: '863 7789 2215', password: 'NSEP_LOKESH', fav: true },
  { id: 'b-7', batchName: 'SEHSS_CLASS', category: 'BIOLOGY', meetingId: '834 5510 6628', password: 'SEHSS_POOJA' },
  { id: 'b-8', batchName: 'NSEJS_WORKSHOP_BIO', category: 'BIOLOGY', meetingId: '819 8831 2240', password: 'NSEJS_BIO' },
  { id: 'b-9', batchName: 'NSEJS_WORKSHOP_PHY', category: 'PHYSICS', meetingId: '852 9940 3312', password: 'NSEJS_PHY' },
  { id: 'b-10', batchName: 'NSEJS_WORKSHOP_CHEM', category: 'CHEMISTRY', meetingId: '841 2235 6678', password: 'NSEJS_CHEM' },
  { id: 'b-11', batchName: 'NMTC_PRIMARY', category: 'MATHS', meetingId: '899 1120 4456', password: 'NMTC_PRIMARY' },
  { id: 'b-12', batchName: 'NMTC_SUB_JR.', category: 'MATHS', meetingId: '899 1120 4455', password: 'NMTC_SUBJR' },
];

export const ClassIdAllocation: React.FC<ClassIdAllocationProps> = ({
  classes = [],
  availableBatches = [],
  onUpdateClassSession
}) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  const todayDayName = dayNames[now.getDay()];

  const [activeDayFilter, setActiveDayFilter] = useState<string>(todayDayName);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrModalData, setQrModalData] = useState<{
    title: string;
    batchName: string;
    timing?: string;
    subject?: string;
    educator?: string;
    url: string;
  } | null>(null);

  // Edit / Allot Modal State
  const [editingBatch, setEditingBatch] = useState<ZoomBatchInfo | null>(null);
  const [editingClassSession, setEditingClassSession] = useState<ClassSession | null>(null);
  const [isAddMode, setIsAddMode] = useState<boolean>(false);
  const [formBatchName, setFormBatchName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('PHYSICS');
  const [formMeetingId, setFormMeetingId] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formDirectUrl, setFormDirectUrl] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const [batches, setBatches] = useState<ZoomBatchInfo[]>(() => {
    const saved = localStorage.getItem('np_zoom_batches');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_BATCHES;
  });

  // Dynamic Daily Meeting Link Auto-Reset Logic:
  useEffect(() => {
    const lastResetDate = localStorage.getItem('np_daily_link_reset_date');
    if (lastResetDate !== todayISO) {
      setBatches(prev =>
        prev.map(b => ({
          ...b,
          directUrl: b.lastLinkDateISO === todayISO ? b.directUrl : undefined,
          lastLinkDateISO: todayISO
        }))
      );
      localStorage.setItem('np_daily_link_reset_date', todayISO);
    }
  }, [todayISO]);

  // Ensure any batches found in classes or availableBatches are listed
  useEffect(() => {
    const allKnownBatchNames = new Set<string>();
    availableBatches.forEach(b => b && allKnownBatchNames.add(b.trim()));
    classes.forEach(c => c.batchName && allKnownBatchNames.add(c.batchName.trim()));

    setBatches(prev => {
      const existingNames = new Set(prev.map(b => b.batchName));
      const additions: ZoomBatchInfo[] = [];
      allKnownBatchNames.forEach(bName => {
        if (!existingNames.has(bName)) {
          additions.push({
            id: `b-auto-${bName}`,
            batchName: bName,
            category: 'ACADEMIC',
            meetingId: '',
            password: '',
            lastLinkDateISO: todayISO
          });
        }
      });
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  }, [availableBatches, classes, todayISO]);

  useEffect(() => {
    localStorage.setItem('np_zoom_batches', JSON.stringify(batches));
  }, [batches]);

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

  // Helper to compute class or batch link
  const computeBatchLink = (batch: ZoomBatchInfo): string => {
    if (batch.directUrl && batch.directUrl.trim()) {
      const raw = batch.directUrl.trim();
      return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    }
    const cleanId = (batch.meetingId || '').replace(/\s/g, '');
    if (cleanId) {
      const pwdParam = batch.password ? `?pwd=${encodeURIComponent(batch.password.trim())}` : '';
      return `https://zoom.us/j/${cleanId}${pwdParam}`;
    }
    return `https://narayanaprodigy.portal/live/${encodeURIComponent(batch.batchName)}`;
  };

  const computeClassLink = (cls: ClassSession, fallbackBatch?: ZoomBatchInfo): string => {
    if (cls.directLink && cls.directLink.trim()) {
      const raw = cls.directLink.trim();
      return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    }
    if (cls.zoomMeetingId && cls.zoomMeetingId.trim()) {
      const cleanId = cls.zoomMeetingId.replace(/\s/g, '');
      const pwdParam = cls.zoomPassword ? `?pwd=${encodeURIComponent(cls.zoomPassword.trim())}` : '';
      return `https://zoom.us/j/${cleanId}${pwdParam}`;
    }
    if (fallbackBatch) {
      return computeBatchLink(fallbackBatch);
    }
    return `https://narayanaprodigy.portal/live/${encodeURIComponent(cls.batchName)}/${encodeURIComponent(cls.subject.toLowerCase())}`;
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleFav = (id: string) => {
    setBatches(batches.map(b => (b.id === id ? { ...b, fav: !b.fav } : b)));
  };

  const handleOpenEditBatch = (batch: ZoomBatchInfo) => {
    setEditingBatch(batch);
    setEditingClassSession(null);
    setIsAddMode(false);
    setFormBatchName(batch.batchName);
    setFormCategory(batch.category);
    setFormMeetingId(batch.meetingId || '');
    setFormPassword(batch.password || '');
    setFormDirectUrl(batch.directUrl || '');
    setFormError('');
  };

  const handleOpenEditClassSession = (cls: ClassSession, batch: ZoomBatchInfo) => {
    setEditingClassSession(cls);
    setEditingBatch(batch);
    setIsAddMode(false);
    setFormBatchName(cls.batchName);
    setFormCategory(cls.subject.toUpperCase());
    setFormMeetingId(cls.zoomMeetingId || batch.meetingId || '');
    setFormPassword(cls.zoomPassword || batch.password || '');
    setFormDirectUrl(cls.directLink || batch.directUrl || '');
    setFormError('');
  };

  const handleOpenAdd = () => {
    setEditingBatch(null);
    setEditingClassSession(null);
    setIsAddMode(true);
    setFormBatchName('');
    setFormCategory('PHYSICS');
    setFormMeetingId('');
    setFormPassword('');
    setFormDirectUrl('');
    setFormError('');
  };

  const handleManualDailyReset = () => {
    setBatches(prev =>
      prev.map(b => ({
        ...b,
        directUrl: undefined,
        meetingId: '',
        password: '',
        lastLinkDateISO: todayISO
      }))
    );
    setSaveSuccessMsg(
      `Daily Link Reset completed! Fresh link fields are ready for today's sessions.`
    );
    setTimeout(() => setSaveSuccessMsg(''), 4500);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBatchName.trim()) {
      setFormError('Please enter or select a Batch Name.');
      return;
    }

    const normalizedDirectUrl = formDirectUrl.trim()
      ? formDirectUrl.trim().startsWith('http')
        ? formDirectUrl.trim()
        : `https://${formDirectUrl.trim()}`
      : undefined;

    // If editing a specific class session:
    if (editingClassSession && onUpdateClassSession) {
      onUpdateClassSession(editingClassSession.id, {
        directLink: normalizedDirectUrl,
        zoomMeetingId: formMeetingId.trim() || undefined,
        zoomPassword: formPassword.trim() || undefined
      });
      setSaveSuccessMsg(`Direct link and QR updated for ${editingClassSession.batchName} (${editingClassSession.subject})!`);
    }

    // Also update batch-level default so QR always works
    if (isAddMode) {
      const newBatch: ZoomBatchInfo = {
        id: `batch-${Date.now()}`,
        batchName: formBatchName.trim(),
        category: formCategory.toUpperCase().trim() || 'GENERAL',
        meetingId: formMeetingId.trim(),
        password: formPassword.trim(),
        directUrl: normalizedDirectUrl,
        lastLinkDateISO: todayISO,
        fav: false
      };
      setBatches(prev => [newBatch, ...prev]);
      setSaveSuccessMsg(`Batch "${newBatch.batchName}" saved & QR code generated!`);
    } else if (editingBatch) {
      const updated: ZoomBatchInfo = {
        ...editingBatch,
        batchName: formBatchName.trim(),
        category: formCategory.toUpperCase().trim() || editingBatch.category,
        meetingId: formMeetingId.trim(),
        password: formPassword.trim(),
        directUrl: normalizedDirectUrl,
        lastLinkDateISO: todayISO
      };
      setBatches(prev => prev.map(b => (b.id === editingBatch.id ? updated : b)));
      setSaveSuccessMsg(`Batch credentials & link updated for "${updated.batchName}"!`);
    }

    setEditingBatch(null);
    setEditingClassSession(null);
    setIsAddMode(false);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleDeleteBatch = (id: string) => {
    setBatches(prev => prev.filter(b => b.id !== id));
  };

  // Group classes strictly by Batch Name from reactive props.classes (Requirement 27, 28, 29)
  const batchGroups = useMemo(() => {
    const map = new Map<string, ClassSession[]>();

    classes.forEach(c => {
      const bName = c.batchName?.trim();
      if (!bName) return;
      if (activeDayFilter !== 'All Days' && c.day !== activeDayFilter) return;

      const list = map.get(bName) || [];
      list.push(c);
      map.set(bName, list);
    });

    // Sort each batch's classes strictly chronologically by start time (Requirement 28)
    map.forEach((list, key) => {
      list.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
    });

    return map;
  }, [classes, activeDayFilter]);

  // Filter batches for display
  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const matchesSearch =
        b.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.meetingId || '').includes(searchTerm);

      if (matchesSearch) return true;

      // Also check if any scheduled class in this batch matches search term
      const classList = batchGroups.get(b.batchName) || [];
      return classList.some(
        c =>
          c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.startTime.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [batches, searchTerm, batchGroups]);

  // Safe live preview link inside modal
  const liveModalQrLink = useMemo(() => {
    if (formDirectUrl.trim()) {
      return formDirectUrl.trim().startsWith('http') ? formDirectUrl.trim() : `https://${formDirectUrl.trim()}`;
    }
    const cleanId = formMeetingId.replace(/\s/g, '');
    if (cleanId) {
      return `https://zoom.us/j/${cleanId}${formPassword.trim() ? `?pwd=${encodeURIComponent(formPassword.trim())}` : ''}`;
    }
    return `https://narayanaprodigy.portal/live/${encodeURIComponent(formBatchName.trim() || 'batch')}`;
  }, [formDirectUrl, formMeetingId, formPassword, formBatchName]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-orbitron font-extrabold text-xl text-white tracking-wide flex items-center gap-2">
            <KeyRound size={22} className="text-emerald-400" />
            <span>CLASS ID ALLOTMENT & TIMETABLE SYNC</span>
          </h2>
          <p className="font-inter text-slate-400 text-xs mt-1">
            Batch-wise scheduled classes from timetable with <span className="text-emerald-400 font-bold">exact timings</span> & live auto-sync
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Day Selector for Timetable Classes (Requirement 27) */}
          <div className="flex items-center gap-1.5 bg-[#131926] px-3 py-2 rounded-xl border border-white/10 text-xs">
            <CalendarClock size={14} className="text-sky-400" />
            <span className="text-slate-400 text-[11px]">Timetable Day:</span>
            <select
              value={activeDayFilter}
              onChange={(e) => setActiveDayFilter(e.target.value)}
              className="bg-transparent font-grotesk font-bold text-white focus:outline-none cursor-pointer"
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'All Days'].map(d => (
                <option key={d} value={d} className="bg-[#0d121d]">
                  {d} {d === todayDayName ? '⭐ (Today)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleManualDailyReset}
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-manrope font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Clear old daily links and reset today's link slots"
          >
            <RotateCcw size={14} />
            <span>Reset Daily Links</span>
          </button>

          <div className="relative flex-1 sm:w-56">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search batch, subject, time..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#131926] border border-white/10 text-white font-inter text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-1.5 cursor-pointer flex-shrink-0"
          >
            <Plus size={15} />
            <span>Add Batch Link</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-inter text-xs flex items-center gap-2 animate-in fade-in">
          <Check size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Grid of Batch Cards with Nested Timetable Classes (Requirements 27, 28, 29) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredBatches.map((batch) => {
          const scheduledClasses = batchGroups.get(batch.batchName) || [];
          const hasDirectLink = Boolean(batch.directUrl && batch.directUrl.trim());
          const hasMeetingId = Boolean(batch.meetingId && batch.meetingId.trim());
          const batchFallbackUrl = computeBatchLink(batch);

          return (
            <GlassCard key={batch.id} className="p-5 flex flex-col justify-between border-sky-500/25">
              <div className="space-y-4">
                {/* ── BATCH NAME HEADER (Requirement 27) ── */}
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-manrope font-extrabold text-[10px] uppercase border border-sky-500/30">
                        {batch.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-manrope font-bold text-[10px]">
                        {scheduledClasses.length}{' '}
                        {scheduledClasses.length === 1 ? 'Class' : 'Classes'}{' '}
                        {activeDayFilter === 'All Days' ? 'Total' : `on ${activeDayFilter.slice(0, 3)}`}
                      </span>
                    </div>

                    <h3 className="font-orbitron font-extrabold text-lg text-white mt-1.5 tracking-wide">
                      {batch.batchName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEditBatch(batch)}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 font-manrope font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                      title="Update batch-wide link or meeting credentials"
                    >
                      <Edit size={12} />
                      <span>Edit Batch Link</span>
                    </button>
                    <button
                      onClick={() => toggleFav(batch.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 transition cursor-pointer"
                      title="Pin to favorites"
                    >
                      <Star size={15} className={batch.fav ? 'fill-amber-400 text-amber-400' : ''} />
                    </button>
                    <button
                      onClick={() => handleDeleteBatch(batch.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Remove batch card"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Batch Default Link / Credentials Strip */}
                <div className="p-2.5 rounded-xl bg-[#090d16] border border-white/5 font-mono text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-manrope font-bold text-slate-400 uppercase">
                      Batch Default:
                    </span>
                    {hasDirectLink ? (
                      <span className="text-[11px] text-emerald-300 truncate max-w-[220px]">
                        {batch.directUrl}
                      </span>
                    ) : hasMeetingId ? (
                      <span className="text-[11px] text-white">
                        ID: <span className="text-sky-300 font-bold">{batch.meetingId}</span>
                        {batch.password && (
                          <span className="ml-1 text-slate-400">
                            (Pwd: <span className="text-amber-300">{batch.password}</span>)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-300/80 italic">
                        No batch default link set (Classes use individual timetable links)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setQrModalData({
                          title: `Batch Live QR: ${batch.batchName}`,
                          batchName: batch.batchName,
                          subject: batch.category,
                          url: batchFallbackUrl
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-manrope font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <QrCode size={12} />
                      <span>QR</span>
                    </button>
                    <a
                      href={batchFallbackUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-manrope font-bold text-[10px] flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      <span>Launch</span>
                    </a>
                  </div>
                </div>

                {/* ── TIMETABLE CLASSES LIST (Requirements 27, 28, 29) ── */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-manrope font-extrabold text-[11px] uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Layers size={13} className="text-sky-400" />
                      <span>Timetable Classes for {batch.batchName}</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Auto-synced with Timetable changes
                    </span>
                  </div>

                  {scheduledClasses.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                      <p className="text-xs text-slate-400 font-inter">
                        No classes scheduled for <span className="text-white font-semibold">{batch.batchName}</span> on {activeDayFilter}.
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Switch day filter to 'All Days' or check Master Timetable.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {scheduledClasses.map((cls, idx) => {
                        const classLink = computeClassLink(cls, batch);
                        const hasClassSpecificLink = Boolean(cls.directLink || cls.zoomMeetingId);

                        // Calculate if this class starts within 30 minutes (Requirement 30 helper)
                        const startM = parseTimeToMinutes(cls.startTime);
                        const diffMins = startM - currentMinutes;
                        const isStartingSoon =
                          (cls.day === todayDayName || activeDayFilter === todayDayName) &&
                          diffMins >= 0 &&
                          diffMins <= 30;

                        return (
                          <div
                            key={cls.id || idx}
                            className={`p-3.5 rounded-xl border transition ${
                              isStartingSoon
                                ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                : 'bg-[#0f1522] border-white/10 hover:border-sky-500/30'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              {/* Left: Class Identity & Exact Timing (Requirement 28) */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-grotesk font-extrabold text-xs text-white">
                                    Class #{idx + 1}: {cls.subject}
                                  </span>

                                  {/* EXACT TIMING DISPLAY (Requirement 28) */}
                                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#0072BC]/20 border border-sky-500/40 text-sky-300 font-mono font-extrabold text-[11px]">
                                    <Clock size={12} className="text-sky-400" />
                                    <span>
                                      {cls.startTime} - {cls.endTime}
                                    </span>
                                  </div>

                                  {activeDayFilter === 'All Days' && (
                                    <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300 font-manrope text-[10px] font-bold">
                                      {cls.day}
                                    </span>
                                  )}

                                  {cls.classType === 'doubt' && (
                                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[9px] font-bold border border-purple-500/30">
                                      Doubt Slot
                                    </span>
                                  )}

                                  {isStartingSoon && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono text-[9px] font-extrabold flex items-center gap-1 animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                      Starts in {diffMins}m!
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-300 font-inter flex items-center gap-2 flex-wrap">
                                  <span>
                                    Educator: <span className="text-white font-semibold">{cls.facultyName}</span>
                                  </span>
                                  <span className="text-slate-600">•</span>
                                  <span>
                                    Room: <span className="text-slate-200">#{cls.roomNo || 'Online'}</span>
                                  </span>
                                  {cls.slotName && (
                                    <>
                                      <span className="text-slate-600">•</span>
                                      <span className="text-slate-400 font-mono text-[10px]">{cls.slotName}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Right: Link & Quick Actions */}
                              <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditClassSession(cls, batch)}
                                  className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 font-manrope font-bold text-[10px] flex items-center gap-1 cursor-pointer transition"
                                  title="Allot or update meeting link for this exact class"
                                >
                                  <LinkIcon size={11} />
                                  <span>{hasClassSpecificLink ? 'Change Link' : 'Allot Link'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCopy(classLink, `${cls.id}-link`)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer transition"
                                  title="Copy class link"
                                >
                                  {copiedField === `${cls.id}-link` ? (
                                    <Check size={13} className="text-emerald-400" />
                                  ) : (
                                    <Copy size={13} />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setQrModalData({
                                      title: `${batch.batchName} • Class #${idx + 1}`,
                                      batchName: batch.batchName,
                                      timing: `${cls.startTime} - ${cls.endTime}`,
                                      subject: cls.subject,
                                      educator: cls.facultyName,
                                      url: classLink
                                    });
                                  }}
                                  className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 cursor-pointer transition"
                                  title="View QR Code for this class"
                                >
                                  <QrCode size={13} />
                                </button>

                                <a
                                  href={classLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-bold text-[10px] flex items-center gap-1 shadow-sm transition"
                                >
                                  <span>Launch</span>
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                            </div>

                            {/* Class Link Preview */}
                            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                              <span className="truncate max-w-[85%] text-slate-300">
                                Link: {classLink}
                              </span>
                              {hasClassSpecificLink ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1 flex-shrink-0">
                                  <CheckCircle2 size={11} /> Custom Link
                                </span>
                              ) : (
                                <span className="text-slate-500 flex-shrink-0">
                                  Using Batch Default
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* QR Code Pop-up Modal */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <GlassCard className="max-w-sm w-full p-6 text-center space-y-4 border-sky-500/30" hover={false}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="text-left">
                <span className="text-[10px] font-manrope font-bold text-sky-400 uppercase tracking-wider block">
                  LIVE CLASS QR CODE
                </span>
                <h4 className="font-grotesk font-bold text-sm text-white">
                  {qrModalData.title}
                </h4>
              </div>
              <button
                onClick={() => setQrModalData(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl ring-4 ring-sky-500/20">
              <QRCodeSVG
                value={qrModalData.url}
                size={190}
                level="M"
                includeMargin
              />
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-left font-mono text-[11px] text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Batch:</span>
                <span className="text-sky-300 font-bold">{qrModalData.batchName}</span>
              </div>
              {qrModalData.timing && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Timing:</span>
                  <span className="text-amber-300 font-bold">{qrModalData.timing}</span>
                </div>
              )}
              {qrModalData.subject && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Subject:</span>
                  <span className="text-emerald-300">{qrModalData.subject}</span>
                </div>
              )}
              {qrModalData.educator && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Educator:</span>
                  <span className="text-slate-200">{qrModalData.educator}</span>
                </div>
              )}
              <div className="truncate text-[10px] text-slate-400 pt-1 border-t border-white/10">
                URL: {qrModalData.url}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(qrModalData.url, 'modal-qr-url')}
                className="flex-1 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-manrope font-bold text-xs uppercase cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                {copiedField === 'modal-qr-url' ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedField === 'modal-qr-url' ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() => setQrModalData(null)}
                className="flex-1 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-manrope font-bold text-xs uppercase cursor-pointer transition"
              >
                Close
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* EDIT / ALLOT CLASS LINK MODAL */}
      {(editingBatch || isAddMode) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <GlassCard className="max-w-md w-full p-6 space-y-4 border-sky-500/40" hover={false}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <LinkIcon size={18} />
                </div>
                <div>
                  <h3 className="font-grotesk font-bold text-base text-white">
                    {editingClassSession
                      ? `Allot Link: ${editingClassSession.batchName} (${editingClassSession.subject})`
                      : isAddMode
                      ? 'Add New Batch Link'
                      : `Update Batch Link: ${editingBatch?.batchName}`}
                  </h3>
                  <p className="font-inter text-[11px] text-emerald-400">
                    Paste Zoom, Google Meet, or portal link • Meeting ID is strictly optional
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingBatch(null);
                  setEditingClassSession(null);
                  setIsAddMode(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-inter text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-manrope font-bold text-xs uppercase tracking-wider mb-1">
                    Batch Name *
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={Boolean(editingClassSession)}
                    placeholder="e.g. NSEA_WORKSHOP"
                    value={formBatchName}
                    onChange={(e) => setFormBatchName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0c121e] border border-white/15 text-white font-grotesk font-semibold text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-manrope font-bold text-xs uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0c121e] border border-white/15 text-white font-grotesk text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="PHYSICS">PHYSICS</option>
                    <option value="CHEMISTRY">CHEMISTRY</option>
                    <option value="MATHS">MATHS</option>
                    <option value="ASTRONOMY">ASTRONOMY</option>
                    <option value="BOTANY">BOTANY</option>
                    <option value="ZOOLOGY">ZOOLOGY</option>
                    <option value="BIOLOGY">BIOLOGY</option>
                    <option value="OLYMPIAD">OLYMPIAD</option>
                  </select>
                </div>
              </div>

              {/* PRIMARY FIELD: Direct Class Link */}
              <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-1.5">
                <label className="block text-sky-300 font-manrope font-extrabold text-xs uppercase tracking-wider">
                  Direct Class / Meeting URL (Primary — No Meeting ID Required)
                </label>
                <input
                  type="text"
                  placeholder="Paste Zoom / Google Meet / Class Link here..."
                  value={formDirectUrl}
                  onChange={(e) => setFormDirectUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c121e] border border-sky-500/40 text-white font-mono text-xs focus:outline-none focus:border-sky-400"
                />
                <p className="text-[10px] text-slate-300">
                  Works with any meeting link. QR code updates automatically upon saving.
                </p>
              </div>

              {/* Optional Meeting ID & Passcode */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 font-manrope font-bold text-[10px] uppercase tracking-wider mb-1">
                    Meeting ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional (can leave blank)"
                    value={formMeetingId}
                    onChange={(e) => setFormMeetingId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0c121e] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-manrope font-bold text-[10px] uppercase tracking-wider mb-1">
                    Passcode (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0c121e] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Live QR Preview */}
              <div className="p-3 rounded-xl bg-[#0a0f1d] border border-white/10 flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-lg flex-shrink-0">
                  <QRCodeSVG
                    value={liveModalQrLink}
                    size={58}
                    level="M"
                  />
                </div>
                <div className="overflow-hidden text-left">
                  <span className="text-[10px] font-manrope font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={11} /> Live QR Preview
                  </span>
                  <p className="text-[11px] text-slate-300 truncate font-mono mt-0.5">
                    {liveModalQrLink}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    Saves directly and updates timetable sync
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBatch(null);
                    setEditingClassSession(null);
                    setIsAddMode(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-manrope font-bold text-xs uppercase transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-bold text-xs uppercase transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{editingClassSession ? 'Save Class Link' : 'Save Batch Link'}</span>
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
