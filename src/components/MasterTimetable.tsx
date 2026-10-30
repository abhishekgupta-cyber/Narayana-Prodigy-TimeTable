import React, { useState } from 'react';
import { Search, Filter, BookOpenCheck, ExternalLink, Layers, Edit, Trash2, Video } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ClassSession, Faculty } from '../types';
import { ACADEMIC_WEEKS, filterClassesByWeek, sortClassesChronologically, getCurrentAcademicWeekId, getSafeMeetingUrl } from '../utils/weekUtils';
import { EditClassModal } from './EditClassModal';

interface MasterTimetableProps {
  classes: ClassSession[];
  facultyList?: Faculty[];
  onUpdateClassStatus?: (classId: string, updates: Partial<ClassSession>) => void;
  onDeleteClassSession?: (classId: string) => void;
}

export const MasterTimetable: React.FC<MasterTimetableProps> = ({
  classes,
  facultyList = [],
  onUpdateClassStatus,
  onDeleteClassSession
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedDay, setSelectedDay] = useState<string>('All');
  const [selectedWeek, setSelectedWeek] = useState<string>(() => getCurrentAcademicWeekId());
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);

  // 1. Filter by Week
  const weekClasses = filterClassesByWeek(classes, selectedWeek);

  // 2. Filter by search, subject, and day (strictly sorted chronologically by time)
  const filtered = sortClassesChronologically(
    weekClasses.filter(c => {
      const matchesSearch =
        c.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSubject = selectedSubject === 'All' || c.subject === selectedSubject;
      const matchesDay = selectedDay === 'All' || c.day === selectedDay;

      return matchesSearch && matchesSubject && matchesDay;
    })
  );

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

  return (
    <div className="space-y-6 pb-12">
      {/* Search & Filter Header Bar */}
      <GlassCard className="p-4" hover={false}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search batch, educator, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0d121d] border border-white/10 text-white font-inter text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Filters: Week, Subject, Day (Includes Sunday) */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Week Filter */}
            <div className="flex items-center gap-1.5 bg-[#0d121d] px-2.5 py-1.5 rounded-xl border border-white/10">
              <Layers size={13} className="text-amber-400" />
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-transparent text-xs font-grotesk font-bold text-white focus:outline-none cursor-pointer"
              >
                {ACADEMIC_WEEKS.map(w => (
                  <option key={w.id} value={w.id} className="bg-[#111520]">
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#0d121d] border border-white/10 text-xs font-grotesk font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="All">All Subjects</option>
              <option value="Astronomy">Astronomy</option>
              <option value="Maths">Maths</option>
              <option value="Botany">Botany</option>
              <option value="Zoology">Zoology</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Physics">Physics</option>
              <option value="Biology">Biology</option>
            </select>

            {/* Day Filter (Includes Sunday) */}
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#0d121d] border border-white/10 text-xs font-grotesk font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="All">All Days</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday 🌟</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Directory Table View (Batch Name Focused with Edit/Delete Actions) */}
      <GlassCard className="p-0 overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0d121d] border-b border-white/10 text-[11px] font-manrope font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Day & Time</th>
                <th className="py-3.5 px-4">Batch Name</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Educator</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-inter text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 font-grotesk">
                    No matching master timetable records found.
                  </td>
                </tr>
              ) : (
                filtered.map((cls) => (
                  <tr key={cls.id} className="hover:bg-white/[0.03] transition">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-white">{cls.day}</div>
                      <div className="font-mono text-[11px] text-slate-400">{cls.startTime} - {cls.endTime}</div>
                    </td>

                    {/* Batch Name Highlighted */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-grotesk font-extrabold text-sky-400 text-sm">
                        {cls.batchName}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      {cls.subject}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap font-medium">
                      {cls.facultyName}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {cls.dateISO || cls.dateStr || '-'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {cls.isCancelled ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[9px] uppercase">
                          Cancelled
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[9px] uppercase">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Action Controls: Join, Edit Class, Delete Class */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {(() => {
                          const meetUrl = getSafeMeetingUrl(cls);
                          if (!meetUrl) {
                            return (
                              <span
                                className="px-2.5 py-1 rounded-lg bg-white/[0.03] text-slate-500 font-grotesk font-semibold text-[11px] flex items-center gap-1 cursor-not-allowed select-none opacity-50"
                                title="No link allotted yet"
                              >
                                <Video size={12} />
                                <span>No Link</span>
                              </span>
                            );
                          }
                          return (
                            <a
                              href={meetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 font-grotesk font-bold text-[11px] flex items-center gap-1 transition"
                              title="Launch Meeting in New Window"
                            >
                              <Video size={12} />
                              <span>Join</span>
                            </a>
                          );
                        })()}

                        <button
                          onClick={() => setEditingClass(cls)}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-sky-500/20 text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
                          title="Edit Class Details"
                        >
                          <Edit size={13} className="text-sky-400" />
                        </button>

                        {onDeleteClassSession && (
                          <button
                            onClick={() => handleDeleteClass(cls.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            title="Delete Class"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Edit Class Modal */}
      {editingClass && (
        <EditClassModal
          cls={editingClass}
          facultyList={facultyList}
          isOpen={Boolean(editingClass)}
          onClose={() => setEditingClass(null)}
          onSave={handleSaveClass}
          onDelete={handleDeleteClass}
        />
      )}
    </div>
  );
};
