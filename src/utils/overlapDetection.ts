import { ClassSession } from '../types';
import { normalizeFacultyName } from './weekUtils';

export interface FacultyOverlapConflict {
  type: 'faculty_overlap';
  facultyName: string;
  facultyId: string;
  dateStr: string;
  dateISO: string;
  day: string;
  timeSlot: string;
  classA: {
    id?: string;
    batchName: string;
    subject: string;
    startTime: string;
    endTime: string;
    slotName?: string;
  };
  classB: {
    id?: string;
    batchName: string;
    subject: string;
    startTime: string;
    endTime: string;
    slotName?: string;
  };
  message: string;
}

export interface DuplicateClassConflict {
  type: 'duplicate_class';
  batchName: string;
  dateStr: string;
  dateISO: string;
  day: string;
  timeSlot: string;
  subject: string;
  facultyName: string;
  classA: {
    id?: string;
    startTime: string;
    endTime: string;
    slotName?: string;
  };
  classB: {
    id?: string;
    startTime: string;
    endTime: string;
    slotName?: string;
  };
  message: string;
}

export interface ConflictDetectionResult {
  hasConflicts: boolean;
  overlapConflicts: FacultyOverlapConflict[];
  duplicateConflicts: DuplicateClassConflict[];
  totalConflicts: number;
  summary: string;
}

/**
 * Converts "05:00 PM" or "5:00 PM" into total minutes from midnight (0 - 1439)
 */
export const parseTimeToMinutes = (timeStr?: string): number | null => {
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

/**
 * Checks if two time windows [s1, e1] and [s2, e2] overlap.
 * Considers standard 5-minute buffer if end time is :55
 */
export const doTimeRangesOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean => {
  const sA = parseTimeToMinutes(startA);
  const eA = parseTimeToMinutes(endA);
  const sB = parseTimeToMinutes(startB);
  const eB = parseTimeToMinutes(endB);

  if (sA === null || eA === null || sB === null || eB === null) {
    // If times are identical strings, they overlap
    return startA.trim().toUpperCase() === startB.trim().toUpperCase();
  }

  // Adjust :55 end slot for 5-minute transition
  const effEndA = eA % 60 === 55 ? eA + 5 : eA;
  const effEndB = eB % 60 === 55 ? eB + 5 : eB;

  // Strict interval overlap: max(startA, startB) < min(endA, endB)
  return Math.max(sA, sB) < Math.min(effEndA, effEndB);
};

/**
 * Normalizes date for fair comparison.
 * Prefers YYYY-MM-DD if available, falls back to lowercase day name.
 */
export const getComparableDateKey = (cls: Partial<ClassSession>): string => {
  if (cls.dateISO && /^\d{4}-\d{2}-\d{2}$/.test(cls.dateISO.trim())) {
    return cls.dateISO.trim();
  }
  if (cls.dateStr && /^\d{4}-\d{2}-\d{2}$/.test(cls.dateStr.trim())) {
    return cls.dateStr.trim();
  }
  return (cls.day || 'Monday').trim().toLowerCase();
};

/**
 * Check if a class is an active scheduled session (cancelled classes are strictly ignored)
 */
export const isActiveClass = (cls: Partial<ClassSession>): boolean => {
  if (cls.isCancelled) return false;
  if (cls.isHoliday) return false;
  if (cls.cancellationReason && /cancelled/i.test(cls.cancellationReason)) return false;
  return true;
};

/**
 * Determines whether a session is a doubt session or regular lecture
 */
export const isDoubtSession = (cls: Partial<ClassSession>): boolean => {
  if (cls.classType === 'doubt') return true;
  if (cls.slotName && /doubt/i.test(cls.slotName)) return true;
  if (cls.subject && /doubt/i.test(cls.subject)) return true;
  if (cls.holidayTitle && /doubt/i.test(cls.holidayTitle)) return true;
  return false;
};

/**
 * Main Detection Engine: Checks for faculty time overlaps and duplicate classes.
 * Cancelled classes are NOT counted as conflicts.
 */
export const detectScheduleConflicts = (
  classList: Partial<ClassSession>[]
): ConflictDetectionResult => {
  const overlapConflicts: FacultyOverlapConflict[] = [];
  const duplicateConflicts: DuplicateClassConflict[] = [];

  // Filter only active, non-cancelled classes
  const activeList = classList.filter(isActiveClass);

  for (let i = 0; i < activeList.length; i++) {
    for (let j = i + 1; j < activeList.length; j++) {
      const a = activeList[i];
      const b = activeList[j];

      // Skip if they are the exact same record by id
      if (a.id && b.id && a.id === b.id) continue;

      const dateKeyA = getComparableDateKey(a);
      const dateKeyB = getComparableDateKey(b);

      // Must be on the same date/day to conflict
      if (dateKeyA !== dateKeyB) continue;

      const startA = a.startTime || '05:00 PM';
      const endA = a.endTime || '05:55 PM';
      const startB = b.startTime || '05:00 PM';
      const endB = b.endTime || '05:55 PM';

      const timesOverlap = doTimeRangesOverlap(startA, endA, startB, endB);
      if (!timesOverlap) continue;

      const batchA = (a.batchName || '').trim();
      const batchB = (b.batchName || '').trim();
      const subjA = (a.subject || '').trim();
      const subjB = (b.subject || '').trim();

      // Check 1: Duplicate Class Entry
      // Same batch, same date, same time, and same subject
      const isSameBatch = batchA.toUpperCase() === batchB.toUpperCase();
      const isSameSubject = subjA.toUpperCase() === subjB.toUpperCase();

      if (isSameBatch && (isSameSubject || startA.trim().toUpperCase() === startB.trim().toUpperCase())) {
        duplicateConflicts.push({
          type: 'duplicate_class',
          batchName: batchA,
          dateStr: a.dateStr || a.dateISO || a.day || 'Scheduled Date',
          dateISO: a.dateISO || '',
          day: a.day || 'Day',
          timeSlot: `${startA} – ${endA}`,
          subject: subjA || subjB,
          facultyName: a.facultyName || b.facultyName || 'Educator',
          classA: {
            id: a.id,
            startTime: startA,
            endTime: endA,
            slotName: a.slotName
          },
          classB: {
            id: b.id,
            startTime: startB,
            endTime: endB,
            slotName: b.slotName
          },
          message: `Duplicate class entry detected for batch "${batchA}" on ${a.day || dateKeyA} (${startA}–${endA}) with subject "${subjA || subjB}".`
        });
        // Skip faculty overlap check if already flagged as duplicate class
        continue;
      }

      // Check 2: Faculty Time Overlap
      // Faculty is scheduled at the same time in two different batches!
      const facNameA = (a.facultyName || '').trim();
      const facNameB = (b.facultyName || '').trim();

      // Exclude generic placeholder educators and holidays
      if (
        !facNameA ||
        !facNameB ||
        /^(all\s+educators|educator|holiday|institute)$/i.test(facNameA) ||
        /^(all\s+educators|educator|holiday|institute)$/i.test(facNameB)
      ) {
        continue;
      }

      const normA = normalizeFacultyName(facNameA);
      const normB = normalizeFacultyName(facNameB);
      const sameFaculty = (normA && normB && normA === normB) || (a.facultyId && b.facultyId && a.facultyId === b.facultyId);

      if (sameFaculty) {
        overlapConflicts.push({
          type: 'faculty_overlap',
          facultyName: a.facultyName || b.facultyName || facNameA,
          facultyId: a.facultyId || b.facultyId || '',
          dateStr: a.dateStr || a.dateISO || a.day || 'Scheduled Date',
          dateISO: a.dateISO || '',
          day: a.day || 'Day',
          timeSlot: `${startA} – ${endA}`,
          classA: {
            id: a.id,
            batchName: batchA,
            subject: subjA,
            startTime: startA,
            endTime: endA,
            slotName: a.slotName
          },
          classB: {
            id: b.id,
            batchName: batchB,
            subject: subjB,
            startTime: startB,
            endTime: endB,
            slotName: b.slotName
          },
          message: `Faculty Overlap: ${a.facultyName} is scheduled simultaneously in "${batchA}" (${startA}–${endA}) and "${batchB}" (${startB}–${endB}) on ${a.day || dateKeyA}.`
        });
      }
    }
  }

  const totalConflicts = overlapConflicts.length + duplicateConflicts.length;
  return {
    hasConflicts: totalConflicts > 0,
    overlapConflicts,
    duplicateConflicts,
    totalConflicts,
    summary:
      totalConflicts === 0
        ? 'No scheduling conflicts or duplicates detected.'
        : `${overlapConflicts.length} faculty overlap(s) and ${duplicateConflicts.length} duplicate class(es) detected.`
  };
};
