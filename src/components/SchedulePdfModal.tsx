import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  User,
  ExternalLink
} from 'lucide-react';
import { ClassSession, UserProfile } from '../types';
import { generateWeeklySchedulePdf } from '../utils/pdfExport';

interface SchedulePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassSession[];
  currentUser: UserProfile;
}

export const SchedulePdfModal: React.FC<SchedulePdfModalProps> = ({
  isOpen,
  onClose,
  classes,
  currentUser
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('All');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter classes according to role
  const facultyClasses = currentUser.role === 'faculty' && currentUser.facultyId
    ? classes.filter(c => c.facultyId === currentUser.facultyId)
    : classes;

  const displayClasses = selectedDay === 'All'
    ? facultyClasses
    : facultyClasses.filter(c => c.day === selectedDay);

  const classesWithoutNotes = facultyClasses.filter(c => !c.isCancelled && !c.notesUrl);
  const classesWithNotes = facultyClasses.filter(c => !c.isCancelled && Boolean(c.notesUrl));

  const handleDownloadPdf = () => {
    setIsExporting(true);
    try {
      const filename = generateWeeklySchedulePdf({
        classes,
        currentUser,
        filterDay: selectedDay
      });
      setDownloadSuccess(`Downloaded: ${filename}`);
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0c1019] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Modal Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#101623]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#0072BC]/20 border border-[#0072BC]/30 text-sky-400">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-grotesk font-bold text-base text-white flex items-center gap-2">
                <span>Faculty Academic Report & Schedule Export</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-manrope font-bold uppercase bg-sky-500/10 text-sky-300 border border-sky-500/20">
                  PDF / Print
                </span>
              </h3>
              <p className="font-inter text-xs text-slate-400">
                Official weekly roster, classroom assignments, and pending tasks checklist
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBrowserPrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white font-manrope font-bold text-xs transition cursor-pointer"
              title="Print document or save via system dialog"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-bold text-xs uppercase tracking-wider transition shadow-[0_2px_12px_rgba(0,114,188,0.35)] cursor-pointer"
            >
              <Download size={14} />
              <span>{isExporting ? 'Generating...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Day Filter Pills */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#0f1422] border-b border-white/[0.06] text-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="font-manrope font-semibold text-slate-400 text-[11px] uppercase tracking-wider mr-1">
              Filter View:
            </span>
            {['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-2.5 py-1 rounded-lg font-manrope font-bold text-[10px] uppercase transition cursor-pointer ${
                  selectedDay === day
                    ? 'bg-[#0072BC] text-white'
                    : 'bg-white/[0.04] text-slate-400 hover:text-slate-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {downloadSuccess && (
            <span className="text-emerald-400 font-manrope font-bold text-[11px] flex items-center gap-1 animate-pulse">
              <CheckCircle2 size={13} />
              <span>{downloadSuccess}</span>
            </span>
          )}
        </div>

        {/* Formatted Report Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 bg-[#080b11] text-slate-800 space-y-6">
          <div className="bg-white text-slate-900 rounded-xl shadow-lg p-6 sm:p-8 space-y-6 border border-slate-200 max-w-3xl mx-auto printable-content">
            
            {/* Header / Brand Top */}
            <div className="border-b-2 border-[#0072BC] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-orbitron font-extrabold text-2xl tracking-wider text-[#0072BC]">
                    NARAYANA
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-[#0072BC] text-white font-orbitron font-bold text-xs uppercase tracking-wider">
                    PRODIGY
                  </span>
                </div>
                <p className="text-[10px] font-manrope font-bold uppercase tracking-widest text-slate-500 mt-1">
                  Faculty Weekly Academic Dossier & Schedule Report
                </p>
              </div>

              <div className="text-right text-xs font-inter text-slate-500 space-y-0.5">
                <div><span className="font-bold text-slate-700">Academic Week:</span> Sept 21 – Sept 26, 2026</div>
                <div><span className="font-bold text-slate-700">Generated:</span> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className="text-[11px] text-emerald-600 font-semibold">Status: Official Verified Roster</div>
              </div>
            </div>

            {/* Educator Profile Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Faculty Name</span>
                <span className="font-bold text-slate-800 text-sm">{currentUser.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Subject / Department</span>
                <span className="font-semibold text-slate-700">{currentUser.subject || 'All Subjects'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Weekly Slots</span>
                <span className="font-bold text-[#0072BC] text-sm">{facultyClasses.length} Sessions</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Missing Note Uploads</span>
                <span className={`font-bold text-sm ${classesWithoutNotes.length > 0 ? 'text-[#F37021]' : 'text-emerald-600'}`}>
                  {classesWithoutNotes.length} Missing
                </span>
              </div>
            </div>

            {/* Teaching Schedule Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h4 className="font-grotesk font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#0072BC]" />
                  <span>I. Teaching Sessions Schedule ({displayClasses.length} Sessions)</span>
                </h4>
                <span className="text-[11px] font-semibold text-slate-500">
                  {selectedDay === 'All' ? 'Full Week' : selectedDay}
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0072BC] text-white font-manrope font-bold text-[11px]">
                      <th className="py-2 px-3">Day</th>
                      <th className="py-2 px-3">Time</th>
                      <th className="py-2 px-3">Batch Name</th>
                      <th className="py-2 px-3">Subject</th>
                      <th className="py-2 px-3">Room</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {displayClasses.map((cls, idx) => (
                      <tr key={cls.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="py-2 px-3 font-bold text-slate-900">{cls.day.slice(0, 3)}</td>
                        <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap">{cls.startTime} - {cls.endTime}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{cls.batchName}</td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {cls.subject}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-center">{cls.roomNo}</td>
                        <td className="py-2 px-3 text-center">
                          {cls.isCancelled ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-100 text-rose-700">
                              Cancelled
                            </span>
                          ) : cls.notesUrl ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              Notes Uploaded ✓
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600">
                              Notes Not Uploaded
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Missing Lecture Notes Compliance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h4 className="font-grotesk font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-[#F37021]" />
                  <span>II. Sessions Missing Lecture Notes ({classesWithoutNotes.length})</span>
                </h4>
                <span className="text-[10px] font-bold text-[#F37021] uppercase">Upload Required</span>
              </div>

              {classesWithoutNotes.length === 0 ? (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                  <span>All lecture notes and assignments are current! No outstanding uploads required.</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F37021] text-white font-manrope font-bold text-[11px]">
                        <th className="py-2 px-3">Day</th>
                        <th className="py-2 px-3">Batch & Subject</th>
                        <th className="py-2 px-3">Slot Time</th>
                        <th className="py-2 px-3">Required Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700 bg-amber-50/40">
                      {classesWithoutNotes.map(cls => (
                        <tr key={cls.id}>
                          <td className="py-2 px-3 font-bold text-slate-900">{cls.day}</td>
                          <td className="py-2 px-3 font-semibold">{cls.batchName} ({cls.subject})</td>
                          <td className="py-2 px-3 font-mono text-[11px]">{cls.startTime}</td>
                          <td className="py-2 px-3 text-amber-900 font-medium">
                            Upload lecture PDF & DPP to batch Drive folder
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Educator Operational Compliance Checklist */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5 text-xs text-slate-600">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                Standard Educator Guidelines:
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Classrooms open 10 minutes prior to session start; test Zoom room microphone & camera.</li>
                <li>Verify student attendance QR allocation for all enrolled workshop participants.</li>
                <li>Upload handwritten whiteboard notes or presentation slides within 2 hours of session completion.</li>
              </ul>
            </div>

            {/* Sign-off Block */}
            <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
              <div>
                <div className="w-40 border-b border-slate-400 mb-1" />
                <span className="text-[10px] uppercase font-bold text-slate-600">Faculty Signature & Date</span>
              </div>
              <div className="text-right">
                <div className="w-48 border-b border-slate-400 mb-1 ml-auto" />
                <span className="text-[10px] uppercase font-bold text-slate-600">Academic Coordinator Sign-off</span>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.08] bg-[#101623]">
          <span className="font-inter text-xs text-slate-400">
            Export includes complete weekly schedule, classroom numbers, and pending uploads audit.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white font-manrope font-bold text-xs hover:bg-white/[0.05] transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
            >
              <Download size={14} />
              <span>{isExporting ? 'Generating...' : 'Download PDF Report'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
