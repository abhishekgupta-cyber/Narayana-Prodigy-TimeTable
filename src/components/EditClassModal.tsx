import React, { useState } from 'react';
import { X, Calendar, Trash2, Save, AlertTriangle, Palmtree } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ClassSession, Faculty } from '../types';
import { deduplicateFacultyList } from '../utils/weekUtils';

interface EditClassModalProps {
  cls: ClassSession | null;
  facultyList: Faculty[];
  availableBatches?: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedClass: ClassSession) => void;
  onDelete?: (classId: string) => void;
}

const DEFAULT_BATCH_OPTIONS = [
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

export const EditClassModal: React.FC<EditClassModalProps> = ({
  cls,
  facultyList,
  availableBatches = [],
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  if (!isOpen || !cls) return null;

  const batchList = Array.from(
    new Set([...DEFAULT_BATCH_OPTIONS, ...availableBatches, cls.batchName].filter(Boolean))
  );

  const uniqueFacultyList = React.useMemo(() => deduplicateFacultyList(facultyList), [facultyList]);

  const [batchName, setBatchName] = useState(cls.batchName || batchList[0]);
  const [subject, setSubject] = useState(cls.subject || 'Physics');
  const [facultyId, setFacultyId] = useState(cls.facultyId || uniqueFacultyList[0]?.id || facultyList[0]?.id || '');
  const [classType, setClassType] = useState<ClassSession['classType']>(cls.classType || 'class');
  const [day, setDay] = useState<ClassSession['day']>(cls.day || 'Monday');
  const [dateISO, setDateISO] = useState(cls.dateISO || new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(cls.startTime || '08:30 PM');
  const [endTime, setEndTime] = useState(cls.endTime || '10:00 PM');
  const [isHoliday, setIsHoliday] = useState(cls.isHoliday || false);
  const [holidayTitle, setHolidayTitle] = useState(cls.holidayTitle || '');
  const [isCancelled, setIsCancelled] = useState(cls.isCancelled || false);
  const [cancellationReason, setCancellationReason] = useState(cls.cancellationReason || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

  const handleDateChange = (val: string) => {
    setDateISO(val);
    if (val) {
      const parts = val.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const calcDay = dayNames[d.getDay()] as ClassSession['day'];
        if (calcDay) setDay(calcDay);
      }
    }
  };

  const handleFacultyChange = (fId: string) => {
    setFacultyId(fId);
    const selectedFac = facultyList.find(f => f.id === fId);
    if (selectedFac) {
      setSubject(selectedFac.subject as any);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const fac = facultyList.find(f => f.id === facultyId);

    let dateStr = cls.dateStr;
    try {
      const parts = dateISO.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {}

    const updated: ClassSession = {
      ...cls,
      batchName: batchName.trim(),
      roomNo: batchName.trim(), // Synced with Batch Name
      subject,
      facultyId,
      facultyName: fac?.name || cls.facultyName || 'Faculty',
      classType,
      day,
      dateISO,
      dateStr,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      isHoliday,
      holidayTitle: isHoliday ? (holidayTitle.trim() || 'Academic Class Holiday') : undefined,
      isCancelled: isHoliday ? true : isCancelled,
      cancellationReason: isHoliday
        ? `HOLIDAY: ${holidayTitle.trim() || 'Academic Class Holiday'}`
        : isCancelled
        ? (cancellationReason.trim() || 'Cancelled by Educator/Admin')
        : undefined
    };

    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(cls.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <GlassCard className="max-w-lg w-full p-6 space-y-4 my-8" hover={false}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="font-orbitron font-extrabold text-base text-white tracking-wide">
              EDIT CLASS SESSION
            </h3>
            <p className="font-inter text-xs text-sky-400 mt-0.5">
              Batch: <span className="font-bold text-white">{cls.batchName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Delete Confirmation State */}
        {showDeleteConfirm ? (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-center space-y-3">
            <AlertTriangle size={32} className="mx-auto text-rose-400" />
            <h4 className="font-grotesk font-bold text-sm text-white">
              Delete this scheduled class?
            </h4>
            <p className="font-inter text-xs text-slate-300">
              Are you sure you want to permanently remove <span className="font-bold text-white">{cls.batchName}</span> ({cls.day} {cls.startTime})?
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/5 cursor-pointer"
              >
                No, Keep Class
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase transition cursor-pointer"
              >
                Yes, Delete Class
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3.5 font-inter text-xs">
            {/* Batch Select Dropdown (Replaced Room text input) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                  Select Batch (Dropdown)
                </label>
                <select
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-sky-500/40 text-white font-grotesk font-bold text-xs focus:border-sky-500 cursor-pointer"
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
                  value={classType}
                  onChange={(e) => setClassType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-grotesk font-bold text-xs cursor-pointer"
                >
                  <option value="class">Regular Lecture Class</option>
                  <option value="doubt">Doubt Clearing Session</option>
                  <option value="workshop">Olympiad Workshop</option>
                </select>
              </div>
            </div>

            {/* Educator & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                  Assigned Faculty
                </label>
                <select
                  value={facultyId}
                  onChange={(e) => handleFacultyChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-grotesk font-bold cursor-pointer"
                >
                  {uniqueFacultyList.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.subject})</option>
                  ))}
                  <option value="fac-visiting">Visiting Faculty / Guest</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-sky-400 font-grotesk font-bold cursor-pointer"
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

            {/* Date & Day of Week */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1 flex items-center gap-1">
                  <Calendar size={13} className="text-sky-400" />
                  <span>Session Date (YYYY-MM-DD)</span>
                </label>
                <input
                  type="date"
                  value={dateISO}
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

            {/* Start Time & End Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                  Start Time
                </label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="08:30 PM"
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-manrope font-bold uppercase mb-1">
                  End Time
                </label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="10:00 PM"
                  className="w-full p-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-mono"
                  required
                />
              </div>
            </div>

            {/* Declare Class Holiday OR Cancel Option */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-amber-300">
                  <input
                    type="checkbox"
                    checked={isHoliday}
                    onChange={(e) => {
                      setIsHoliday(e.target.checked);
                      if (e.target.checked) setIsCancelled(true);
                    }}
                    className="accent-amber-500 rounded cursor-pointer"
                  />
                  <Palmtree size={14} />
                  <span className="font-manrope font-bold text-xs">Declare Class Holiday</span>
                </label>
                {isHoliday && (
                  <input
                    type="text"
                    value={holidayTitle}
                    onChange={(e) => setHolidayTitle(e.target.value)}
                    placeholder="Holiday Title (e.g. Festival / National Holiday)"
                    className="w-full p-2 rounded-lg bg-[#0d121d] border border-amber-500/40 text-amber-200 text-xs"
                  />
                )}
              </div>

              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={isCancelled}
                    onChange={(e) => setIsCancelled(e.target.checked)}
                    className="accent-rose-500 rounded cursor-pointer"
                  />
                  <span className="font-manrope font-bold text-xs text-rose-400">
                    Mark Session Cancelled
                  </span>
                </label>
                {isCancelled && !isHoliday && (
                  <input
                    type="text"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Reason for cancellation..."
                    className="w-full p-2 rounded-lg bg-[#0d121d] border border-rose-500/30 text-rose-300 text-xs"
                  />
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10 gap-2">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-manrope font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Class</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 font-manrope font-bold text-xs hover:bg-white/[0.04] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-extrabold text-xs uppercase tracking-wider shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
};
