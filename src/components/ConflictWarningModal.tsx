import React from 'react';
import {
  AlertTriangle,
  X,
  Users,
  Copy,
  Clock,
  Calendar,
  AlertCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { ConflictDetectionResult } from '../utils/overlapDetection';

interface ConflictWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictDetectionResult;
  onForceSave?: () => void;
  canForceSave?: boolean;
}

export const ConflictWarningModal: React.FC<ConflictWarningModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  onForceSave,
  canForceSave = false
}) => {
  if (!isOpen || !conflicts.hasConflicts) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-[#0b111e] border-2 border-rose-500/60 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.35)] overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/40 border-b border-rose-500/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0 shadow-lg">
              <ShieldAlert size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-manrope font-extrabold text-[10px] uppercase tracking-wider border border-rose-500/30">
                  Save Blocked • Conflict Detected
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  {conflicts.totalConflicts} issue{conflicts.totalConflicts > 1 ? 's' : ''}
                </span>
              </div>
              <h2 className="font-orbitron font-extrabold text-xl text-white mt-1">
                Faculty Overlap & Duplicate Warning
              </h2>
              <p className="text-xs text-slate-300 font-inter mt-0.5">
                The timetable cannot be saved until scheduling collisions are resolved.
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

        {/* Conflict List Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Summary Box */}
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs font-inter flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />
            <span>
              Cancelled classes are <strong className="text-white">excluded</strong> from overlap calculations. Please review the exact conflicting sessions below and update the timings or batch assignments.
            </span>
          </div>

          {/* Section 1: Faculty Overlaps */}
          {conflicts.overlapConflicts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-manrope font-extrabold text-xs uppercase tracking-wider">
                <Users size={16} />
                <span>Faculty Time Overlaps ({conflicts.overlapConflicts.length})</span>
              </div>

              <div className="space-y-2.5">
                {conflicts.overlapConflicts.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 hover:border-rose-400/60 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-grotesk font-extrabold text-sm text-white">
                            {c.facultyName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                            Simultaneous Teaching
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-inter mt-1">
                          <span className="flex items-center gap-1 text-slate-300 font-mono">
                            <Calendar size={13} className="text-rose-400" />
                            {c.day} • {c.dateStr}
                          </span>
                          <span className="flex items-center gap-1 text-amber-300 font-mono font-bold">
                            <Clock size={13} />
                            {c.timeSlot}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Conflicting Batches Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-rose-500/20">
                      <div className="p-2.5 rounded-xl bg-[#060a12] border border-white/10">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Class Session 1</div>
                        <div className="font-grotesk font-extrabold text-xs text-sky-300 truncate mt-0.5">
                          {c.classA.batchName}
                        </div>
                        <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                          {c.classA.subject} • {c.classA.startTime}–{c.classA.endTime}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#060a12] border border-rose-500/30">
                        <div className="text-[10px] font-bold uppercase text-rose-400">Class Session 2 (Collision)</div>
                        <div className="font-grotesk font-extrabold text-xs text-rose-300 truncate mt-0.5">
                          {c.classB.batchName}
                        </div>
                        <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                          {c.classB.subject} • {c.classB.startTime}–{c.classB.endTime}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-rose-200/90 font-inter mt-2">
                      ⚠️ {c.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Duplicate Classes */}
          {conflicts.duplicateConflicts.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-amber-400 font-manrope font-extrabold text-xs uppercase tracking-wider">
                <Copy size={16} />
                <span>Duplicate Class Entries ({conflicts.duplicateConflicts.length})</span>
              </div>

              <div className="space-y-2.5">
                {conflicts.duplicateConflicts.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-grotesk font-extrabold text-sm text-amber-300">
                            Batch: {d.batchName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                            Identical Slot Duplicate
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 font-inter mt-1 flex items-center gap-3">
                          <span className="font-mono text-slate-400">{d.day} • {d.dateStr}</span>
                          <span className="font-mono text-amber-300 font-bold">{d.timeSlot}</span>
                          <span>• Subject: <strong>{d.subject}</strong></span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-amber-200 font-inter mt-2">
                      ⚠️ {d.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900/90 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-manrope font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Back & Fix Conflicts</span>
          </button>

          {canForceSave && onForceSave && (
            <button
              onClick={onForceSave}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-manrope font-bold text-xs uppercase transition cursor-pointer flex items-center gap-1.5 shadow-lg"
            >
              <span>Admin Override & Save Anyway</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
