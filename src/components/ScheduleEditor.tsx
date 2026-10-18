import React, { useState } from 'react';
import {
  CalendarPlus,
  Upload,
  Trash2,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Palmtree,
  Layers,
  Plus,
  Edit3,
  Download,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ClassSession, Faculty } from '../types';
import { ACADEMIC_WEEKS, isClassInWeek, normalizeFacultyName, deduplicateFacultyList } from '../utils/weekUtils';
import { detectScheduleConflicts, ConflictDetectionResult } from '../utils/overlapDetection';
import { ConflictWarningModal } from './ConflictWarningModal';
import { PrePublishPreviewModal } from './PrePublishPreviewModal';

interface ScheduleEditorProps {
  classes: ClassSession[];
  facultyList: Faculty[];
  availableBatches?: string[];
  onAddClassSession: (session: Partial<ClassSession>) => void;
  onBulkAddClasses?: (sessions: Partial<ClassSession>[]) => void;
  onDeleteClassSession: (classId: string) => void;
  onDeleteWeekClasses?: (weekId: string) => number;
  onUpdateClassStatus?: (classId: string, updates: Partial<ClassSession>) => void;
  onAddBatch?: (newBatchName: string) => void;
  onRenameBatch?: (oldBatchName: string, newBatchName: string) => void;
  onDeclareDateHoliday?: (dateISO: string, batchTarget: string, holidayTitle: string) => number;
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

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  classes,
  facultyList,
  availableBatches = [],
  onAddClassSession,
  onBulkAddClasses,
  onDeleteClassSession,
  onDeleteWeekClasses,
  onUpdateClassStatus,
  onAddBatch,
  onRenameBatch,
  onDeclareDateHoliday
}) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const now = new Date();
  const defaultTodayISO = now.toISOString().slice(0, 10);

  // Merge default batches + parent batches + existing class batches
  const [localBatches, setLocalBatches] = useState<string[]>(DEFAULT_BATCHES);
  const allBatches = Array.from(
    new Set([...localBatches, ...availableBatches, ...classes.map(c => c.batchName)].filter(Boolean))
  );

  // Memoized unique faculty list to avoid duplicate keys in options
  const uniqueFacultyList = React.useMemo(() => deduplicateFacultyList(facultyList), [facultyList]);

  // Add Class Form State (Clean: Batch Dropdown, No Room Text Input, No Drive/Meeting ID)
  const [sessionDate, setSessionDate] = useState<string>(defaultTodayISO);
  const [day, setDay] = useState<ClassSession['day']>(dayNames[now.getDay()] as ClassSession['day']);
  const [facultyId, setFacultyId] = useState<string>(() => uniqueFacultyList[0]?.id || facultyList[0]?.id || 'fac-ac');
  const [subject, setSubject] = useState<ClassSession['subject']>(
    (uniqueFacultyList[0]?.subject as ClassSession['subject']) || 'Astronomy'
  );
  const [batchName, setBatchName] = useState<string>(allBatches[0] || 'NSEA_WORKSHOP');
  const [classType, setClassType] = useState<ClassSession['classType']>('class');
  const [startTime, setStartTime] = useState<string>('08:30 PM');
  const [endTime, setEndTime] = useState<string>('10:00 PM');
  const [isHoliday, setIsHoliday] = useState<boolean>(false);
  const [holidayTitle, setHolidayTitle] = useState<string>('');
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [cancellationReason, setCancellationReason] = useState<string>('');

  // Batch Management State (Add New Batch & Rename / Typo Fix)
  const [newBatchInput, setNewBatchInput] = useState<string>('');
  const [selectedBatchToRename, setSelectedBatchToRename] = useState<string>(allBatches[0] || 'NSEA_WORKSHOP');
  const [renamedBatchInput, setRenamedBatchInput] = useState<string>('');

  // Holiday Declaration Tool State
  const [holidayDateISO, setHolidayDateISO] = useState<string>(defaultTodayISO);
  const [holidayBatchTarget, setHolidayBatchTarget] = useState<string>('ALL_BATCHES');
  const [holidayReasonInput, setHolidayReasonInput] = useState<string>('Academic Institute Holiday');

  // Conflict Detection & Pre-Publish Preview States
  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false);
  const [currentConflicts, setCurrentConflicts] = useState<ConflictDetectionResult>({
    hasConflicts: false,
    overlapConflicts: [],
    duplicateConflicts: [],
    totalConflicts: 0,
    summary: ''
  });
  const [prePublishModalOpen, setPrePublishModalOpen] = useState<boolean>(false);
  const [pendingPublishClasses, setPendingPublishClasses] = useState<Partial<ClassSession>[]>([]);
  const [pendingCandidateSession, setPendingCandidateSession] = useState<Partial<ClassSession> | null>(null);

  // Week-wise Delete Timetable State
  const [weekToDelete, setWeekToDelete] = useState<string>('w2');
  const [confirmWeekDelete, setConfirmWeekDelete] = useState<boolean>(false);

  // Status notifications
  const [importStatus, setImportStatus] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4500);
  };

  // Sync day of week when date changes
  const handleDateChange = (newDateStr: string) => {
    setSessionDate(newDateStr);
    if (newDateStr) {
      const parts = newDateStr.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const calcDay = dayNames[d.getDay()] as ClassSession['day'];
        if (calcDay) setDay(calcDay);
      }
    }
  };

  const handleFacultySelect = (fId: string) => {
    setFacultyId(fId);
    const fac = facultyList.find(f => f.id === fId);
    if (fac) {
      setSubject(fac.subject as ClassSession['subject']);
    }
  };

  // Add New Class Session with Strict Conflict & Overlap Check
  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    const fac = facultyList.find(f => f.id === facultyId);

    let formattedDateStr = sessionDate;
    try {
      const parts = sessionDate.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      formattedDateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {}

    const candidateSession: Partial<ClassSession> = {
      day,
      dateStr: formattedDateStr,
      dateISO: sessionDate,
      startTime,
      endTime,
      slotName: classType === 'doubt' ? 'DOUBT' : 'S1',
      subject,
      facultyId,
      facultyName: fac?.name || 'Educator',
      batchName,
      roomNo: batchName, // Batch Name replaces Room
      classType,
      isHoliday,
      holidayTitle: isHoliday ? (holidayTitle || 'Academic Class Holiday') : undefined,
      isCancelled: isHoliday ? true : isCancelled,
      cancellationReason: isHoliday
        ? `HOLIDAY: ${holidayTitle || 'Academic Class Holiday'}`
        : isCancelled
        ? (cancellationReason || 'Rescheduled by Admin')
        : undefined,
      notesStatus: 'pending',
      taskComplete: false
    };

    // If not a holiday, verify that the new session doesn't cause a faculty overlap or duplicate entry!
    if (!isHoliday && !isCancelled) {
      const checkResult = detectScheduleConflicts([...classes, candidateSession]);
      if (checkResult.hasConflicts) {
        setCurrentConflicts(checkResult);
        setPendingCandidateSession(candidateSession);
        setConflictModalOpen(true);
        return; // BLOCK save directly until resolved!
      }
    }

    onAddClassSession(candidateSession);

    showToast(
      isHoliday
        ? `Class Holiday declared for ${batchName} on ${sessionDate}!`
        : `Session added for Batch ${batchName} (${day}, ${sessionDate})!`
    );
  };

  const handleForceSaveCandidate = () => {
    if (pendingCandidateSession) {
      onAddClassSession(pendingCandidateSession);
      showToast(`Admin Override: Session added for ${pendingCandidateSession.batchName}!`);
      setPendingCandidateSession(null);
    } else if (pendingPublishClasses.length > 0) {
      commitPendingClasses();
    }
    setConflictModalOpen(false);
  };

  // Batch Management: Add New Batch
  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBatchInput.trim().toUpperCase().replace(/\s+/g, '_');
    if (!clean) return;
    if (!localBatches.includes(clean)) {
      setLocalBatches(prev => [clean, ...prev]);
    }
    if (onAddBatch) onAddBatch(clean);
    setBatchName(clean);
    setSelectedBatchToRename(clean);
    setNewBatchInput('');
    showToast(`New Batch "${clean}" added to system dropdowns!`);
  };

  // Batch Management: Edit / Rename Batch Name (Typo Fix)
  const handleRenameBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNew = renamedBatchInput.trim();
    if (!selectedBatchToRename || !cleanNew || selectedBatchToRename === cleanNew) return;

    setLocalBatches(prev => prev.map(b => (b === selectedBatchToRename ? cleanNew : b)));
    if (onRenameBatch) {
      onRenameBatch(selectedBatchToRename, cleanNew);
    }
    if (batchName === selectedBatchToRename) setBatchName(cleanNew);
    setSelectedBatchToRename(cleanNew);
    setRenamedBatchInput('');
    showToast(`Batch "${selectedBatchToRename}" renamed to "${cleanNew}" across all timetable records!`);
  };

  // Declare Holiday for a Date / Batch — NEVER creates dummy batches!
  const handleDeclareHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDateISO) return;
    const title = holidayReasonInput.trim() || 'Institute Class Holiday';

    if (onDeclareDateHoliday) {
      const affected = onDeclareDateHoliday(holidayDateISO, holidayBatchTarget, title);
      const targetLabel =
        holidayBatchTarget === 'ALL_BATCHES'
          ? 'ALL Active Batches'
          : `Batch ${holidayBatchTarget}`;
      showToast(
        `Declared Holiday "${title}" on ${holidayDateISO} for ${targetLabel} (${affected} batch slot(s) updated)!`
      );
    }
  };

  // Delete Entire Week Timetable
  const handleConfirmDeleteWeek = () => {
    const weekObj = ACADEMIC_WEEKS.find(w => w.id === weekToDelete);
    if (onDeleteWeekClasses) {
      const removedCount = onDeleteWeekClasses(weekToDelete);
      setConfirmWeekDelete(false);
      showToast(
        `Deleted ${removedCount} session(s) from ${weekObj?.label || weekToDelete}. You can now cleanly re-upload the new timetable without any clash!`
      );
    } else {
      // Fallback individual delete
      const toRemove = classes.filter(c => isClassInWeek(c, weekToDelete));
      toRemove.forEach(c => onDeleteClassSession(c.id));
      setConfirmWeekDelete(false);
      showToast(`Deleted ${toRemove.length} session(s) from ${weekObj?.label || weekToDelete}.`);
    }
  };

  // Download Structured Excel Template (.CSV compatible with Microsoft Excel & Google Sheets)
  const handleDownloadExcelTemplate = () => {
    const headers = [
      'Date (YYYY-MM-DD)',
      'Day',
      'Start Time',
      'End Time',
      'Slot',
      'Faculty Name',
      'Subject',
      'Batch Name',
      'Class Type'
    ];
    const sampleRows = [
      ['2026-09-28', 'Monday', '05:00 PM', '05:55 PM', 'S1', 'Abhishek Chitnis Sir', 'Astronomy', 'NSEA_WORKSHOP', 'class'],
      ['2026-09-28', 'Monday', '07:00 PM', '07:55 PM', 'S2', 'Ram Niwas Sir', 'Maths', 'MATH-A-HOLIC', 'class'],
      ['2026-09-29', 'Tuesday', '06:00 PM', '08:00 PM', 'S1', 'Laxman Sir', 'Chemistry', 'NSEC_WORKSHOP', 'class'],
      ['2026-09-30', 'Wednesday', '08:30 PM', '10:00 PM', 'S1', 'Vimal Sir', 'Botany', 'NSEB_WORKSHOP_BOTANY', 'class'],
      ['2026-10-04', 'Sunday', '10:00 AM', '11:30 AM', 'DOUBT', 'Lokesh Sir', 'Physics', 'NSEP_WORKSHOP', 'doubt']
    ];

    const csvContent =
      '\uFEFF' + // UTF-8 BOM so Microsoft Excel opens columns cleanly
      [headers.join(','), ...sampleRows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Narayana_Prodigy_Timetable_Template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast('Structured Excel Timetable Template (.CSV) downloaded! Fill and upload below.');
  };

  // Real File Upload Parser for Excel CSV & JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = (event.target?.result as string) || '';
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const conflictResult = detectScheduleConflicts([...classes, ...parsed]);
            setCurrentConflicts(conflictResult);
            setPendingPublishClasses(parsed);
            setPrePublishModalOpen(true);
            setImportStatus(`Analyzed ${parsed.length} sessions from ${file.name}. Reviewing in Pre-Publish Preview.`);
          }
        } else {
          // Robust CSV parsing with header auto-detection & flexible column fallback
          const rawLines = content
            .replace(/\r/g, '')
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean);

          if (rawLines.length <= 1) {
            setImportStatus('CSV file is empty or missing data rows.');
            return;
          }

          const parseRow = (lineStr: string) => {
            return lineStr
              .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
              .map(c => c.replace(/^"|"$/g, '').trim());
          };

          const headerCols = parseRow(rawLines[0]).map(h => h.toLowerCase());
          const findColIdx = (keywords: string[]) =>
            headerCols.findIndex(h => keywords.some(k => h.includes(k)));

          const dateIdx = findColIdx(['date']);
          const dayIdx = findColIdx(['day']);
          const startIdx = findColIdx(['start', 'time from', 'from']);
          const endIdx = findColIdx(['end', 'time to', 'to']);
          const timeIdx = findColIdx(['time', 'timing', 'slot time']);
          const slotIdx = findColIdx(['slot']);
          const facIdx = findColIdx(['faculty', 'teacher', 'educator', 'sir', 'mam']);
          const subjIdx = findColIdx(['subject', 'sub']);
          const batchIdx = findColIdx(['batch', 'class name', 'program', 'workshop']);
          const typeIdx = findColIdx(['type', 'category', 'mode']);

          const importedSessions: Partial<ClassSession>[] = [];

          for (let i = 1; i < rawLines.length; i++) {
            const cols = parseRow(rawLines[i]);
            if (cols.length < 3 || cols.every(c => !c)) continue;

            // Extract with header index if matched, otherwise fallback to column positions
            let dateVal = dateIdx !== -1 ? cols[dateIdx] : cols[0];
            let dayVal = dayIdx !== -1 ? cols[dayIdx] : cols[1];
            let startVal = startIdx !== -1 ? cols[startIdx] : '';
            let endVal = endIdx !== -1 ? cols[endIdx] : '';

            // Handle combined time column e.g. "08:30 PM - 10:00 PM"
            if ((!startVal || !endVal) && timeIdx !== -1 && cols[timeIdx]) {
              const timeParts = cols[timeIdx].split(/[-–—to]+/i).map(t => t.trim());
              if (timeParts.length >= 2) {
                startVal = timeParts[0];
                endVal = timeParts[1];
              }
            }
            if (!startVal) startVal = cols[2] || '08:30 PM';
            if (!endVal) endVal = cols[3] || '10:00 PM';

            let slotVal = slotIdx !== -1 ? cols[slotIdx] : cols[4] || '';
            let facNameVal = facIdx !== -1 ? cols[facIdx] : cols[5] || '';
            let subjVal = subjIdx !== -1 ? cols[subjIdx] : cols[6] || '';
            let batchVal = batchIdx !== -1 ? cols[batchIdx] : cols[7] || '';
            let typeVal = typeIdx !== -1 ? cols[typeIdx] : cols[8] || 'class';

            // Clean & normalize Date to ISO YYYY-MM-DD
            let cleanDateISO = defaultTodayISO;
            let dateFormatted = dateVal || defaultTodayISO;

            if (dateVal) {
              const trimmedDate = dateVal.trim();
              if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
                cleanDateISO = trimmedDate;
              } else if (/^\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}$/.test(trimmedDate)) {
                const parts = trimmedDate.split(/[-\/.]/).map(Number);
                if (parts.length === 3) {
                  let d = parts[0];
                  let m = parts[1];
                  let y = parts[2];
                  if (y < 100) y += 2000;
                  cleanDateISO = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                }
              }
              try {
                const [y, m, d] = cleanDateISO.split('-').map(Number);
                const dt = new Date(y, m - 1, d);
                dateFormatted = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                if (!dayVal || dayVal.length < 3) {
                  dayVal = dayNames[dt.getDay()] as ClassSession['day'];
                }
              } catch (e) {}
            }

            const targetNorm = normalizeFacultyName(facNameVal);
            // Strict exact match first
            let matchedFac = facultyList.find(f => normalizeFacultyName(f.name) === targetNorm);

            const cleanFacId =
              matchedFac?.id ||
              (targetNorm ? `fac-custom-${targetNorm}` : `fac-custom-${normalizeFacultyName(facNameVal || 'guest')}`);

            const finalFaculty = matchedFac?.name || (facNameVal ? facNameVal.trim() : 'Educator');
            const finalBatch = batchVal?.trim() || (matchedFac ? `${matchedFac.subject?.toUpperCase()}_WORKSHOP` : 'NSEA_WORKSHOP');
            const finalSubject = (subjVal?.trim() as any) || matchedFac?.subject || 'Physics';

            importedSessions.push({
              dateISO: cleanDateISO,
              dateStr: dateFormatted,
              day: (dayVal as any) || 'Monday',
              startTime: startVal,
              endTime: endVal,
              slotName: slotVal?.trim() || `${finalBatch} (${finalFaculty.toUpperCase()})`,
              facultyId: cleanFacId,
              facultyName: finalFaculty,
              subject: finalSubject,
              batchName: finalBatch,
              roomNo: finalBatch,
              classType: (typeVal?.toLowerCase() === 'doubt' ? 'doubt' : 'class') as any,
              isCancelled: false,
              notesStatus: 'pending',
              taskComplete: false
            });
          }

          if (importedSessions.length > 0) {
            // Run strict conflict & overlap check before publishing
            const conflictResult = detectScheduleConflicts([...classes, ...importedSessions]);
            setCurrentConflicts(conflictResult);
            setPendingPublishClasses(importedSessions);
            setPrePublishModalOpen(true);
            setImportStatus(`Loaded ${importedSessions.length} sessions from ${file.name}. Review in Pre-Publish Preview.`);
          } else {
            setImportStatus('No valid data rows found in CSV. Please verify column headers or structure.');
          }
        }
      } catch (err) {
        setImportStatus('Error reading file. Please verify CSV encoding and headers.');
      }
      setTimeout(() => setImportStatus(''), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmPublishLive = () => {
    if (currentConflicts.hasConflicts) {
      setConflictModalOpen(true);
      return;
    }
    commitPendingClasses();
  };

  const commitPendingClasses = () => {
    if (pendingPublishClasses.length === 0) return;
    if (onBulkAddClasses) {
      onBulkAddClasses(pendingPublishClasses);
    } else {
      pendingPublishClasses.forEach(s => onAddClassSession(s));
    }
    setPrePublishModalOpen(false);
    showToast(`Successfully published ${pendingPublishClasses.length} timetable sessions live!`);
    setPendingPublishClasses([]);
  };

  const handleToggleCancel = (cls: ClassSession) => {
    if (onUpdateClassStatus) {
      onUpdateClassStatus(cls.id, {
        isCancelled: !cls.isCancelled,
        isHoliday: false,
        holidayTitle: undefined,
        cancellationReason: !cls.isCancelled ? 'Cancelled by Institute Admin' : undefined
      });
    }
  };

  const handleToggleHoliday = (cls: ClassSession) => {
    if (onUpdateClassStatus) {
      const nextHoliday = !cls.isHoliday;
      onUpdateClassStatus(cls.id, {
        isHoliday: nextHoliday,
        isCancelled: nextHoliday,
        holidayTitle: nextHoliday ? 'Academic Class Holiday' : undefined,
        cancellationReason: nextHoliday ? 'HOLIDAY: Academic Class Holiday' : undefined
      });
    }
  };

  const selectedWeekCount = classes.filter(c => isClassInWeek(c, weekToDelete)).length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-orbitron font-extrabold text-xl text-white tracking-wide">
            MASTER SCHEDULE & BATCH EDITOR
          </h2>
          <p className="font-inter text-slate-400 text-xs mt-1">
            Add classes via Batch Dropdown, declare Class Holidays, manage batches, download Excel templates & clean week timetables
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadExcelTemplate}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-manrope font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 transition cursor-pointer flex-shrink-0"
        >
          <Download size={15} />
          <span>Download Excel Template (.CSV)</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-inter flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* TOP MANAGEMENT STRIP: 1. Batch Manager (Add/Edit Typo) & 2. Holiday Declaration & 3. Week Delete */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Batch Management (Add New Batch & Edit Batch Name Typo) */}
        <GlassCard className="p-5 space-y-3.5" hover={false}>
          <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
            <Layers size={17} className="text-sky-400" />
            <h3 className="font-grotesk font-bold text-sm text-white">Batch Management (Add / Edit Typo)</h3>
          </div>

          {/* Add New Batch */}
          <form onSubmit={handleCreateBatch} className="space-y-1.5 text-xs">
            <label className="block text-slate-400 font-manrope font-bold uppercase text-[10px]">
              Add New Academic Batch
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBatchInput}
                onChange={(e) => setNewBatchInput(e.target.value)}
                placeholder="e.g. OLYMPIAD_ELITE_10"
                className="flex-1 p-2 rounded-xl bg-[#0d121d] border border-white/10 text-white font-grotesk text-xs"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>
          </form>

          {/* Rename / Edit Batch Name */}
          <form onSubmit={handleRenameBatchSubmit} className="space-y-2 pt-2 border-t border-white/10 text-xs">
            <label className="block text-slate-400 font-manrope font-bold uppercase text-[10px]">
              Edit Batch Name (Correct Typos Globally)
            </label>
            <select
              value={selectedBatchToRename}
              onChange={(e) => {
                setSelectedBatchToRename(e.target.value);
                setRenamedBatchInput(e.target.value);
              }}
              className="w-full p-2 rounded-xl bg-[#0d121d] border border-white/10 text-sky-300 font-grotesk font-bold text-xs cursor-pointer"
            >
              {allBatches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                value={renamedBatchInput}
                onChange={(e) => setRenamedBatchInput(e.target.value)}
                placeholder="Corrected Batch Name..."
                className="flex-1 p-2 rounded-xl bg-[#0d121d] border border-white/10 text-white font-grotesk text-xs"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-manrope font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Edit3 size={13} />
                <span>Rename</span>
              </button>
            </div>
          </form>
        </GlassCard>

        {/* Card 2: Declare Class Holiday */}
        <GlassCard className="p-5 space-y-3" hover={false}>
          <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
            <Palmtree size={17} className="text-amber-400" />
            <h3 className="font-grotesk font-bold text-sm text-white">Declare Class Holiday</h3>
          </div>

          <form onSubmit={handleDeclareHolidaySubmit} className="space-y-2.5 text-xs font-inter">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-manrope font-bold uppercase text-[10px] mb-1">
                  Holiday Date
                </label>
                <input
                  type="date"
                  value={holidayDateISO}
                  onChange={(e) => setHolidayDateISO(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#0d121d] border border-white/10 text-white font-mono text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-manrope font-bold uppercase text-[10px] mb-1">
                  Target Batch
                </label>
                <select
                  value={holidayBatchTarget}
                  onChange={(e) => setHolidayBatchTarget(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#0d121d] border border-white/10 text-white font-grotesk font-bold text-xs cursor-pointer"
                >
                  <option value="ALL_BATCHES">All Batches</option>
                  {allBatches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-manrope font-bold uppercase text-[10px] mb-1">
                Holiday Occasion / Title
              </label>
              <input
                type="text"
                value={holidayReasonInput}
                onChange={(e) => setHolidayReasonInput(e.target.value)}
                placeholder="e.g. National Holiday / Olympiad Prep Break"
                className="w-full p-2 rounded-xl bg-[#0d121d] border border-white/10 text-white text-xs"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-manrope font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Palmtree size={14} />
              <span>Declare Class Holiday</span>
            </button>
          </form>
        </GlassCard>

        {/* Card 3: Delete & Re-upload Week Timetable */}
        <GlassCard className="p-5 space-y-3 border-rose-500/25" hover={false}>
          <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
            <Trash2 size={17} className="text-rose-400" />
            <h3 className="font-grotesk font-bold text-sm text-white">Delete Week Timetable (No Clash)</h3>
          </div>

          <p className="font-inter text-[11px] text-slate-400 leading-relaxed">
            If a week's timetable was uploaded with errors, clear that entire week here before re-uploading so old slots do not clash.
          </p>

          <div>
            <label className="block text-slate-400 font-manrope font-bold uppercase text-[10px] mb-1">
              Select Academic Week to Clear
            </label>
            <select
              value={weekToDelete}
              onChange={(e) => {
                setWeekToDelete(e.target.value);
                setConfirmWeekDelete(false);
              }}
              className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-grotesk font-bold text-xs cursor-pointer"
            >
              {ACADEMIC_WEEKS.map(w => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-rose-300 font-mono mt-1 block">
              Matching sessions in selected week: {selectedWeekCount} slot(s)
            </span>
          </div>

          {!confirmWeekDelete ? (
            <button
              type="button"
              onClick={() => setConfirmWeekDelete(true)}
              className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-manrope font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Delete Selected Week Timetable</span>
            </button>
          ) : (
            <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/50 space-y-2">
              <div className="text-[11px] text-rose-200 font-bold flex items-center gap-1">
                <AlertTriangle size={13} className="text-rose-400" />
                <span>Confirm wiping {selectedWeekCount} sessions for this week?</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmWeekDelete(false)}
                  className="flex-1 py-1.5 rounded-lg bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteWeek}
                  className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase cursor-pointer"
                >
                  Yes, Wipe Week
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Simplified Add Session (Batch Dropdown, No Room input, No Drive/Meeting ID) */}
        <GlassCard className="lg:col-span-5 p-6 space-y-4" hover={false}>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <CalendarPlus size={18} className="text-sky-400" />
              <h3 className="font-grotesk font-bold text-sm text-white">Add New Class Session</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Clean Form
            </span>
          </div>

          <form onSubmit={handleAddSession} className="space-y-3 font-inter text-xs">
            {/* Session Date Picker */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1 flex items-center gap-1">
                  <Calendar size={13} className="text-sky-400" />
                  <span>Session Date</span>
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-mono text-xs focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                  Day of Week
                </label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-semibold cursor-pointer"
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
            </div>

            {/* Batch Select Dropdown (Replaced Room text input!) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-sky-300 font-manrope font-extrabold uppercase mb-1">
                  Select Batch (Dropdown) *
                </label>
                <select
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-sky-500/40 text-white font-grotesk font-bold cursor-pointer focus:border-sky-400"
                >
                  {allBatches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                  Session Category
                </label>
                <select
                  value={classType}
                  onChange={(e) => setClassType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-grotesk font-bold cursor-pointer"
                >
                  <option value="class">Regular Class</option>
                  <option value="doubt">Doubt Session</option>
                  <option value="workshop">Workshop</option>
                </select>
              </div>
            </div>

            {/* Educator & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                  Select Educator
                </label>
                <select
                  value={facultyId}
                  onChange={(e) => handleFacultySelect(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-grotesk font-bold cursor-pointer"
                >
                  {uniqueFacultyList.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.subject})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-sky-400 font-bold cursor-pointer"
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
            </div>

            {/* Time Slot */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">Start Time</label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="08:30 PM"
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">End Time</label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="10:00 PM"
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-mono"
                />
              </div>
            </div>

            {/* Holiday or Cancel Checkboxes */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                <label className="inline-flex items-center gap-2 cursor-pointer text-amber-300">
                  <input
                    type="checkbox"
                    checked={isHoliday}
                    onChange={(e) => setIsHoliday(e.target.checked)}
                    className="accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="font-manrope font-bold text-xs">Class Holiday</span>
                </label>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={isCancelled}
                    onChange={(e) => setIsCancelled(e.target.checked)}
                    className="accent-rose-500 rounded cursor-pointer"
                  />
                  <span className="font-manrope font-bold text-xs text-rose-400">
                    Mark Cancelled
                  </span>
                </label>
              </div>
            </div>

            {isHoliday && (
              <input
                type="text"
                placeholder="Holiday Title (e.g. Diwali / National Holiday)..."
                value={holidayTitle}
                onChange={(e) => setHolidayTitle(e.target.value)}
                className="w-full p-2 rounded-xl bg-[#0d121d] border border-amber-500/30 text-amber-300 text-xs"
              />
            )}

            {isCancelled && !isHoliday && (
              <input
                type="text"
                placeholder="Reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full p-2 rounded-xl bg-[#0d121d] border border-rose-500/30 text-rose-300 text-xs"
              />
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-extrabold uppercase text-xs tracking-wider shadow-md transition cursor-pointer"
            >
              SAVE TO MASTER SCHEDULE
            </button>
          </form>
        </GlassCard>

        {/* Right Panel: Structured Excel / CSV Upload & Live Sessions List */}
        <div className="lg:col-span-7 space-y-6">
          {/* Structured Excel / CSV Timetable Importer */}
          <GlassCard className="p-6 space-y-3" hover={false}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-emerald-400" />
                <h3 className="font-grotesk font-bold text-sm text-white">
                  Upload Timetable (Structured Excel CSV / JSON)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const conf = detectScheduleConflicts(classes);
                    setCurrentConflicts(conf);
                    setPendingPublishClasses(classes);
                    setPrePublishModalOpen(true);
                  }}
                  className="text-[11px] font-manrope font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={12} />
                  <span>Pre-Publish Preview ({classes.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="text-[11px] font-manrope font-bold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download size={12} />
                  <span>Get Exact Template</span>
                </button>
              </div>
            </div>

            <p className="font-inter text-xs text-slate-400">
              Template Columns: <span className="text-slate-200 font-mono">Date, Day, Start Time, End Time, Slot, Faculty Name, Subject, Batch Name, Class Type</span>
            </p>

            <label className="block p-5 rounded-2xl border-2 border-dashed border-white/20 hover:border-sky-400 bg-white/[0.02] text-center cursor-pointer transition space-y-1.5">
              <Upload size={26} className="mx-auto text-sky-400" />
              <div className="font-grotesk font-bold text-xs text-white">
                Click to Upload Filled Excel (.CSV) or Timetable (.JSON) File
              </div>
              <div className="font-mono text-[10px] text-slate-500">
                Error-free batch & faculty mapping • Zero duplicate clash after Week Delete
              </div>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {importStatus && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-inter flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{importStatus}</span>
              </div>
            )}
          </GlassCard>

          {/* Existing Live Sessions Table with Quick Holiday / Cancel / Restore / Delete */}
          <GlassCard className="p-4 space-y-3" hover={false}>
            <div className="flex items-center justify-between">
              <h3 className="font-grotesk font-bold text-xs text-slate-300 uppercase tracking-wider">
                Manage Scheduled Sessions ({classes.length})
              </h3>
              <span className="text-[10px] text-slate-500 font-inter">
                Mark Holiday, Cancel, or Delete slots
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-inter transition ${
                    cls.isHoliday
                      ? 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                      : cls.isCancelled
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      : 'bg-[#0d121d] border-white/10 text-white'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold ${cls.isCancelled && !cls.isHoliday ? 'line-through text-slate-400' : 'text-white'}`}>
                        {cls.day} {cls.dateISO ? `(${cls.dateISO})` : ''}
                      </span>
                      <span>•</span>
                      <span className="text-sky-400 font-bold">Batch: {cls.batchName}</span>
                      <span className="text-slate-400">({cls.subject})</span>
                      {cls.classType === 'doubt' && (
                        <span className="px-2 py-0.2 rounded bg-purple-500/20 text-purple-300 font-manrope font-bold text-[9px] uppercase">
                          DOUBT
                        </span>
                      )}
                      {cls.isHoliday && (
                        <span className="px-2 py-0.2 rounded bg-amber-500 text-slate-950 font-manrope font-extrabold text-[9px] uppercase">
                          🏖️ HOLIDAY: {cls.holidayTitle || 'CLASS HOLIDAY'}
                        </span>
                      )}
                      {cls.isCancelled && !cls.isHoliday && (
                        <span className="px-2 py-0.2 rounded bg-rose-500 text-white font-manrope font-bold text-[9px] uppercase">
                          CANCELLED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                      <span>{cls.facultyName}</span>
                      <span>•</span>
                      <span className="font-mono">{cls.startTime} - {cls.endTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Quick Holiday Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleHoliday(cls)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-manrope font-bold transition cursor-pointer flex items-center gap-1 ${
                        cls.isHoliday
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                      }`}
                      title="Toggle Class Holiday status"
                    >
                      <Palmtree size={11} />
                      <span>{cls.isHoliday ? 'Unset Holiday' : 'Holiday'}</span>
                    </button>

                    {/* Toggle Cancel Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleCancel(cls)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-manrope font-bold transition cursor-pointer flex items-center gap-1 ${
                        cls.isCancelled
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                          : 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                      }`}
                      title={cls.isCancelled ? 'Restore / Uncancel Session' : 'Cancel this Session'}
                    >
                      {cls.isCancelled ? (
                        <>
                          <RotateCcw size={11} />
                          <span>Restore</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={11} />
                          <span>Cancel</span>
                        </>
                      )}
                    </button>

                    {/* Delete Class Button */}
                    <button
                      type="button"
                      onClick={() => onDeleteClassSession(cls.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                      title="Permanently Delete Class"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Conflict Warning Modal Popup */}
      <ConflictWarningModal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        conflicts={currentConflicts}
        canForceSave={true}
        onForceSave={handleForceSaveCandidate}
      />

      {/* Pre-Publish Preview Screen Modal */}
      <PrePublishPreviewModal
        isOpen={prePublishModalOpen}
        onClose={() => setPrePublishModalOpen(false)}
        pendingClasses={pendingPublishClasses}
        conflicts={currentConflicts}
        onConfirmPublish={handleConfirmPublishLive}
      />
    </div>
  );
};
