import { ClassSession, Faculty } from '../types';

export interface WeekOption {
  id: string;
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  isCurrent?: boolean;
}

export const ACADEMIC_WEEKS: WeekOption[] = [
  { id: 'w4', label: 'Week 4 (Oct 12 – Oct 18)', startDate: '2026-10-12', endDate: '2026-10-18', isCurrent: true },
  { id: 'w3', label: 'Week 3 (Oct 05 – Oct 11)', startDate: '2026-10-05', endDate: '2026-10-11' },
  { id: 'w2', label: 'Week 2 (Sep 28 – Oct 04)', startDate: '2026-09-28', endDate: '2026-10-04' },
  { id: 'w1', label: 'Week 1 (Sep 21 – Sep 27)', startDate: '2026-09-21', endDate: '2026-09-27' },
  { id: 'w5', label: 'Week 5 (Oct 19 – Oct 25)', startDate: '2026-10-19', endDate: '2026-10-25' },
  { id: 'w6', label: 'Week 6 (Oct 26 – Nov 01)', startDate: '2026-10-26', endDate: '2026-11-01' },
  { id: 'w7', label: 'Week 7 (Nov 02 – Nov 08)', startDate: '2026-11-02', endDate: '2026-11-08' },
  { id: 'all', label: 'All Weeks (Full Semester View)', startDate: '', endDate: '' },
];

/**
 * Returns today's Day name ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')
 */
export const getCurrentDayOfWeek = (
  date: Date = new Date()
): 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' => {
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ] as const;
  return dayNames[date.getDay()];
};

/**
 * Parses any 12-hour or 24-hour time string into total minutes since midnight.
 * e.g. "05:00 PM" -> 1020, "5:55 PM" -> 1075, "07:00 PM" -> 1140, "08:30 PM" -> 1230, "17:00" -> 1020
 */
export const parseTimeToMinutes = (timeStr?: string): number => {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toUpperCase();
  const match12 = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const ampm = match12[3].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }
  return 0;
};

export const DAY_ORDER_MAP: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

/**
 * Sorts classes strictly chronologically:
 * 1. By calendar date (dateISO) if present
 * 2. By day of week (Monday -> Sunday)
 * 3. By start time (e.g. 5:00 PM before 7:00 PM before 8:30 PM)
 * 4. By end time
 * 5. By batch name
 */
export const sortClassesChronologically = (classList: ClassSession[]): ClassSession[] => {
  return [...classList].sort((a, b) => {
    if (a.dateISO && b.dateISO && a.dateISO !== b.dateISO) {
      return a.dateISO.localeCompare(b.dateISO);
    }
    const dayA = DAY_ORDER_MAP[a.day] || 99;
    const dayB = DAY_ORDER_MAP[b.day] || 99;
    if (dayA !== dayB) {
      return dayA - dayB;
    }
    const startA = parseTimeToMinutes(a.startTime);
    const startB = parseTimeToMinutes(b.startTime);
    if (startA !== startB) {
      return startA - startB;
    }
    const endA = parseTimeToMinutes(a.endTime);
    const endB = parseTimeToMinutes(b.endTime);
    if (endA !== endB) {
      return endA - endB;
    }
    return (a.batchName || '').localeCompare(b.batchName || '');
  });
};

/**
 * Detects current academic week based on calendar date
 */
export const getCurrentAcademicWeek = (date: Date = new Date()): WeekOption => {
  const dateISO = date.toISOString().slice(0, 10);
  const matched = ACADEMIC_WEEKS.find(
    w => w.id !== 'all' && w.startDate && w.endDate && dateISO >= w.startDate && dateISO <= w.endDate
  );
  if (matched) return matched;
  const currentFlagged = ACADEMIC_WEEKS.find(w => w.isCurrent);
  if (currentFlagged) return currentFlagged;
  return ACADEMIC_WEEKS[0]; // fallback to first week (Week 4)
};

export const getCurrentAcademicWeekId = (date: Date = new Date()): string => {
  return getCurrentAcademicWeek(date).id;
};

export const isCurrentAcademicWeek = (weekId?: string): boolean => {
  if (!weekId) return false;
  return weekId === getCurrentAcademicWeekId() || weekId === 'w4';
};

export const isClassInWeek = (cls: ClassSession, weekId: string): boolean => {
  if (!weekId || weekId === 'all') return true;
  const targetWeek = ACADEMIC_WEEKS.find(w => w.id === weekId);
  if (!targetWeek || !targetWeek.startDate || !targetWeek.endDate) return true;
  if (!cls.dateISO) return false;
  return cls.dateISO >= targetWeek.startDate && cls.dateISO <= targetWeek.endDate;
};

export const filterClassesByWeek = (classes: ClassSession[], weekId: string): ClassSession[] => {
  if (!weekId || weekId === 'all') return classes;
  const targetWeek = ACADEMIC_WEEKS.find(w => w.id === weekId);
  if (!targetWeek || !targetWeek.startDate || !targetWeek.endDate) return classes;

  return classes.filter(cls => {
    if (!cls.dateISO) return true; // recurring weekly classes without strict date
    return cls.dateISO >= targetWeek.startDate && cls.dateISO <= targetWeek.endDate;
  });
};

/**
 * Normalizes/Merges batch names that represent multi-subject tracks of the same parent batch.
 * Example:
 *  - NSEB_WORKSHOP_BOTANY + NSEB_WORKSHOP_ZOO => NSEB_WORKSHOP
 *  - NSEJS_WORKSHOP_BIO + NSEJS_WORKSHOP_PHY + NSEJS_WORKSHOP_CHEM => NSEJS_WORKSHOP
 *  - NMTC_PRIMARY / NMTC_SUB_JR. stay distinct unless they share base workshop prefix with subject suffix
 */
/**
 * Normalizes batch names that represent multi-subject tracks of the same parent batch
 * into their canonical parent batch name (e.g. NSEB_WORKSHOP_BOTANY & NSEB_WORKSHOP_ZOO -> NSEB_WORKSHOP).
 */
export const getCanonicalBatchName = (batchName: string): string => {
  if (!batchName) return '';
  const clean = batchName.trim();
  const upper = clean.toUpperCase();
  if (upper.startsWith('NSEB_WORKSHOP')) return 'NSEB_WORKSHOP';
  if (upper.startsWith('NSEJS_WORKSHOP')) return 'NSEJS_WORKSHOP';
  if (upper.startsWith('NSEA_WORKSHOP')) return 'NSEA_WORKSHOP';
  if (upper.startsWith('NSEC_WORKSHOP')) return 'NSEC_WORKSHOP';
  if (upper.startsWith('NSEP_WORKSHOP')) return 'NSEP_WORKSHOP';
  const subjectSuffixMatch = clean.match(/^(.+?)_(PHY|PHYSICS|CHEM|CHEMISTRY|BIO|BIOLOGY|BOTANY|ZOO|ZOOLOGY|ASTRONOMY|MATHS|MATHEMATICS)$/i);
  if (subjectSuffixMatch && subjectSuffixMatch[1].length >= 3) {
    return subjectSuffixMatch[1].toUpperCase();
  }
  return clean;
};

export const getMergedBatchName = (batchName: string, enableMerge: boolean = true): string => {
  if (!enableMerge) return (batchName || '').trim();
  return getCanonicalBatchName(batchName);
};

/**
 * Normalizes a faculty name for strict/clean matching without false substring collisions
 * (e.g., prevents "Pooja Vyas Mam" from falsely matching "Pooja Mam", or fallback to "Abhishek Chitnis Sir").
 */
export const normalizeFacultyName = (name?: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?|sir|mam|ma'am|madam|educator|faculty|teacher)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

/**
 * Checks if a ClassSession genuinely belongs to a specific Faculty member.
 * Enforces STRICT DATA ISOLATION so classes of one educator NEVER leak into another educator's timetable.
 */
export const doesClassBelongToFaculty = (
  cls: ClassSession,
  faculty: { id: string; name: string; initials?: string },
  allFaculty: { id: string; name: string; initials?: string }[] = []
): boolean => {
  if (!cls || !faculty) return false;

  // Never attribute "All Educators" institute-wide holiday dummy rows to an individual faculty
  if (cls.facultyName?.toLowerCase() === 'all educators' || cls.batchName === 'ALL_BATCHES') {
    return false;
  }

  const targetNorm = normalizeFacultyName(faculty.name);
  const classFacNorm = normalizeFacultyName(cls.facultyName);
  const targetInitials = (faculty.initials || '').toLowerCase().trim();

  // 1. If the class has an explicit facultyName, that name is the authoritative identifier!
  if (classFacNorm) {
    // Direct normalized name match with target faculty
    if (classFacNorm === targetNorm) {
      return true;
    }

    // Direct initials match (e.g. "AC" or "AC Sir" -> classFacNorm === "ac" matching targetInitials "ac")
    if (targetInitials && classFacNorm === targetInitials) {
      // Ensure no other faculty has the exact same initials
      const otherSameInitials = allFaculty.find(
        f => f.id !== faculty.id && (f.initials || '').toLowerCase().trim() === classFacNorm
      );
      if (!otherSameInitials) {
        return true;
      }
    }

    // If the class's facultyName matches ANY other faculty member in allFaculty, strictly return false
    const otherFaculty = allFaculty.find(f => {
      if (f.id === faculty.id) return false;
      const otherNorm = normalizeFacultyName(f.name);
      if (otherNorm && otherNorm === classFacNorm) return true;
      const otherInit = (f.initials || '').toLowerCase().trim();
      if (otherInit && otherInit === classFacNorm) return true;
      return false;
    });
    if (otherFaculty) {
      return false;
    }

    // If the class's facultyName is set and does not match target, do NOT fallback to facultyId!
    return false;
  }

  // 2. If facultyName is empty, check slotName parentheses educator if available e.g. "NSEP_WORKSHOP (LOKESH SIR)"
  const slotParenMatch = cls.slotName?.match(/\(([^)]+)\)/);
  const slotFacNorm = slotParenMatch ? normalizeFacultyName(slotParenMatch[1]) : '';
  if (slotFacNorm) {
    if (slotFacNorm === targetNorm) {
      return true;
    }
    if (targetInitials && slotFacNorm === targetInitials) {
      const otherSameInitials = allFaculty.find(
        f => f.id !== faculty.id && (f.initials || '').toLowerCase().trim() === slotFacNorm
      );
      if (!otherSameInitials) {
        return true;
      }
    }
    const otherInSlot = allFaculty.find(f => {
      if (f.id === faculty.id) return false;
      const otherNorm = normalizeFacultyName(f.name);
      if (otherNorm && otherNorm === slotFacNorm) return true;
      const otherInit = (f.initials || '').toLowerCase().trim();
      if (otherInit && otherInit === slotFacNorm) return true;
      return false;
    });
    if (otherInSlot) {
      return false;
    }
    return false;
  }

  // 3. Fallback to facultyId ONLY when facultyName and slotName have no educator string
  return cls.facultyId === faculty.id;
};

/**
 * Safely deduplicates an array of Faculty members so no duplicate IDs or duplicate
 * normalized names exist, preventing React key collisions.
 */
export const deduplicateFacultyList = (list: Faculty[]): Faculty[] => {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set<string>();
  const seenNorms = new Set<string>();
  const result: Faculty[] = [];

  for (const fac of list) {
    if (!fac) continue;
    const cleanId = (fac.id || '').trim();
    if (!cleanId) continue;
    const cleanName = (fac.name || '').trim();
    const norm = normalizeFacultyName(cleanName);

    // If ID already seen, skip duplicate child
    if (seenIds.has(cleanId)) continue;
    // If normalized name already seen (and not empty), skip duplicate educator
    if (norm && seenNorms.has(norm)) continue;

    seenIds.add(cleanId);
    if (norm) seenNorms.add(norm);

    result.push({
      ...fac,
      id: cleanId,
      name: cleanName || 'Educator'
    });
  }

  return result;
};

/**
 * Checks whether a given class session is an academic workshop / olympiad workshop.
 * Used to merge all workshops into a single Workshops tab and isolate them from regular lectures/doubts.
 */
export const isWorkshopClass = (c?: {
  batchName?: string;
  slotName?: string;
  classType?: string;
  sessionType?: string;
}): boolean => {
  if (!c) return false;
  if (c.classType === 'workshop') return true;
  if (c.sessionType && c.sessionType.toLowerCase().includes('workshop')) return true;
  const b = (c.batchName || '').toUpperCase();
  const s = (c.slotName || '').toUpperCase();
  if (b.includes('WORKSHOP') || b.startsWith('NMTC') || b.includes('OLYMPIAD')) return true;
  if (s.includes('WORKSHOP') || s.startsWith('NMTC') || s.includes('OLYMPIAD')) return true;
  return false;
};

/**
 * Deduplicates an array of ClassSession records:
 * - If a class has the same batch, date (dateISO or day), and start time (evaluated in minutes),
 *   it blocks duplicates and keeps the cleanest latest single entry.
 * - Strips any accidental dummy 'ALL_BATCH' records.
 * - Chronologically sorts the resulting array.
 */
export const deduplicateClassesList = (classList: ClassSession[]): ClassSession[] => {
  if (!Array.isArray(classList)) return [];
  const map = new Map<string, ClassSession>();

  for (const c of classList) {
    if (!c) continue;
    const batch = (c.batchName || '').trim().toUpperCase();
    if (!batch || /^all[-_\s]*batch/i.test(batch)) continue;

    const dateKey = (c.dateISO || c.dateStr || c.day || '').trim().toUpperCase();
    const timeMinutes = parseTimeToMinutes(c.startTime);
    const key = `${batch}__${dateKey}__${timeMinutes}`;

    if (map.has(key)) {
      const existing = map.get(key)!;
      // Replace with latest entry while maintaining stable React ID
      map.set(key, {
        ...existing,
        ...c,
        id: existing.id || c.id
      });
    } else {
      map.set(key, c);
    }
  }

  return sortClassesChronologically(Array.from(map.values()));
};


