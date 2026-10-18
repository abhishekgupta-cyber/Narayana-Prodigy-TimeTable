import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  Clock,
  Layers,
  BookOpen,
  Search,
  Sparkles,
  ShieldCheck,
  Send,
  ArrowLeft
} from 'lucide-react';
import { ClassSession } from '../types';
import { ConflictDetectionResult } from '../utils/overlapDetection';

interface PrePublishPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingClasses: Partial<ClassSession>[];
  conflicts: ConflictDetectionResult;
  onConfirmPublish: () => void;
  isPublishing?: boolean;
}

export const PrePublishPreviewModal: React.FC<PrePublishPreviewModalProps> = ({
  isOpen,
  onClose,
  pendingClasses,
  conflicts,
  onConfirmPublish,
  isPublishing = false
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');

  const batches = useMemo(() => {
    const set = new Set<string>();
    pendingClasses.forEach(c => {
      if (c.batchName) set.add(c.batchName);
    });
    return Array.from(set).sort();
  }, [pendingClasses]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const filteredList = useMemo(() => {
    return pendingClasses.filter(c => {
      if (selectedBatchFilter !== 'all' && c.batchName !== selectedBatchFilter) return false;
      if (selectedDayFilter !== 'all' && c.day !== selectedDayFilter) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const batch = (c.batchName || '').toLowerCase();
        const fac = (c.facultyName || '').toLowerCase();
        const subj = (c.subject || '').toLowerCase();
        const day = (c.day || '').toLowerCase();
        if (!batch.includes(query) && !fac.includes(query) && !subj.includes(query) && !day.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [pendingClasses, selectedBatchFilter, selectedDayFilter, searchTerm]);

  // Distinct statistics
  const distinctFaculties = useMemo(() => {
    return new Set(pendingClasses.map(c => c.facultyName).filter(Boolean)).size;
  }, [pendingClasses]);

  const dateSpan = useMemo(() => {
    const dates = pendingClasses.map(c => c.dateStr || c.dateISO).filter(Boolean);
    if (dates.length === 0) return 'Academic Timetable';
    return `${dates[0]} – ${dates[dates.length - 1]}`;
  }, [pendingClasses]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-5xl bg-[#0b121e] border-2 border-sky-500/50 rounded-3xl shadow-[0_0_60px_rgba(2,132,199,0.3)] overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-sky-950/80 via-slate-900 to-[#0b121e] border-b border-sky-500/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 flex-shrink-0 shadow-lg">
              <Sparkles size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-manrope font-extrabold text-[10px] uppercase tracking-wider border border-sky-500/30">
                  Pre-Publish Preview Screen
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  {pendingClasses.length} sessions queued
                </span>
              </div>
              <h2 className="font-orbitron font-extrabold text-xl text-white mt-1">
                Verify Timetable Before Going Live
              </h2>
              <p className="text-xs text-slate-300 font-inter mt-0.5">
                Review sessions, educator allocations, and conflict check results before committing live to the portal.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-slate-950/50 border-b border-white/5">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-[10px] font-bold uppercase text-slate-400">Total Classes</div>
            <div className="font-orbitron font-bold text-2xl text-white mt-1">
              {pendingClasses.length}
            </div>
            <div className="text-[11px] text-slate-400 font-inter mt-0.5">Sessions ready to publish</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-[10px] font-bold uppercase text-slate-400">Batches Covered</div>
            <div className="font-orbitron font-bold text-2xl text-sky-400 mt-1">
              {batches.length}
            </div>
            <div className="text-[11px] text-slate-400 font-inter mt-0.5">Target student tracks</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-[10px] font-bold uppercase text-slate-400">Educators Assigned</div>
            <div className="font-orbitron font-bold text-2xl text-purple-400 mt-1">
              {distinctFaculties}
            </div>
            <div className="text-[11px] text-slate-400 font-inter mt-0.5">Faculty members active</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-[10px] font-bold uppercase text-slate-400">Validation Status</div>
            <div className="flex items-center gap-1.5 mt-1">
              {conflicts.hasConflicts ? (
                <>
                  <AlertTriangle size={18} className="text-rose-400" />
                  <span className="font-orbitron font-bold text-sm text-rose-400">
                    {conflicts.totalConflicts} Conflicts
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <span className="font-orbitron font-bold text-sm text-emerald-400">
                    Zero Collisions
                  </span>
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-inter mt-0.5 truncate">
              {conflicts.hasConflicts ? 'Review warnings below' : 'Safe to publish live'}
            </div>
          </div>
        </div>

        {/* Conflict Alert Banner if any */}
        {conflicts.hasConflicts && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs font-inter flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-400 flex-shrink-0" />
              <span>
                <strong>Warning:</strong> {conflicts.summary} You can review the rows below or fix them in editor.
              </span>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/5">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search educator, batch, subject..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#080d17] border border-white/10 text-xs text-white font-bold cursor-pointer"
            >
              <option value="all">All Batches ({batches.length})</option>
              {batches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#080d17] border border-white/10 text-xs text-white font-bold cursor-pointer"
            >
              <option value="all">All Days</option>
              {days.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Preview Table */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e1626] text-slate-400 font-manrope font-extrabold uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-3.5">Day & Date</th>
                  <th className="py-3 px-3.5">Time Window</th>
                  <th className="py-3 px-3.5">Batch Name</th>
                  <th className="py-3 px-3.5">Subject</th>
                  <th className="py-3 px-3.5">Faculty</th>
                  <th className="py-3 px-3.5">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-inter">
                {filteredList.map((cls, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.03] transition">
                    <td className="py-2.5 px-3.5 font-bold text-white whitespace-nowrap">
                      {cls.day}
                      <span className="block text-[10px] text-slate-400 font-mono font-normal">
                        {cls.dateStr || cls.dateISO || 'Scheduled'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-sky-300 whitespace-nowrap font-bold">
                      {cls.startTime} – {cls.endTime}
                    </td>
                    <td className="py-2.5 px-3.5 font-grotesk font-extrabold text-amber-300 whitespace-nowrap">
                      {cls.batchName}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-200 font-bold whitespace-nowrap">
                      {cls.subject}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-300 whitespace-nowrap">
                      {cls.facultyName}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          cls.classType === 'doubt'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-sky-500/20 text-sky-300'
                        }`}
                      >
                        {cls.classType === 'doubt' ? 'Doubt' : 'Lecture'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-manrope font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Discard / Back to Editor</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-inter hidden sm:inline">
              Ready to publish {pendingClasses.length} classes live across all student & faculty portals
            </span>
            <button
              onClick={onConfirmPublish}
              disabled={isPublishing}
              className={`px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-manrope font-extrabold text-xs uppercase transition cursor-pointer shadow-lg flex items-center gap-2 ${
                isPublishing ? 'opacity-50 cursor-wait' : ''
              }`}
            >
              {isPublishing ? (
                <span>Publishing Live...</span>
              ) : (
                <>
                  <Send size={15} />
                  <span>Confirm & Publish Timetable Live</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
