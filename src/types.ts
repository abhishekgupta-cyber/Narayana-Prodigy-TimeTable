export type UserRole = 'admin' | 'faculty' | 'visitor';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  subject?: string;
  facultyId?: string;
  avatar?: string;
  initials?: string;
}

export type SubjectType = 'Physics' | 'Chemistry' | 'Maths' | 'Zoology' | 'Biology' | 'Astronomy' | 'Botany' | 'General';

export interface Faculty {
  id: string;
  name: string;
  subject: SubjectType;
  initials: string;
  color: string; // Tailwind color or hex
  borderColor: string;
  badgeBg: string;
  classesThisWeek: number;
  phone?: string;
  email?: string;
}

export type ClassType = 'class' | 'doubt' | 'workshop';
export type NotesStatus = 'pending' | 'uploaded' | 'completed';

export interface ClassSession {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  dateStr: string; // e.g. "21-09-26"
  dateISO: string; // e.g. "2026-09-21"
  startTime: string; // "08:30 PM"
  endTime: string;   // "10:00 PM"
  slotName: string;  // e.g. "NSEA_WORKSHOP (ABHISHEK CHITNIS SIR)"
  subject: SubjectType;
  facultyId: string;
  facultyName: string;
  batchName: string;
  roomNo: string;
  classType: ClassType;
  sessionType?: string; // "Workshop"
  isCancelled?: boolean;
  cancellationReason?: string;
  isHoliday?: boolean;
  holidayTitle?: string;
  notesStatus: NotesStatus;
  notesUrl?: string;
  taskComplete?: boolean;
  zoomMeetingId?: string;
  zoomPassword?: string;
  directLink?: string;
}

export interface RollingBackupSlot {
  id: string;
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  dateISO: string;
  timestamp: string;
  size: string;
  recordCount: number;
  status: 'Success' | 'Auto-Rotated';
  type: 'Morning Auto-Backup' | 'Manual Snapshot';
  classesSnapshot: ClassSession[];
}

export interface PortalSettings {
  themeMode: 'dark' | 'light';
  showSciParticles: boolean;
  blurIntensity: number;
  soundEffects: boolean;
  autoRollingBackup: boolean;
  dailyLinkAutoReset: boolean;
  highCapacityMode: boolean;
  adminPassword?: string;
}

export interface BatchFolder {
  id: string;
  batchName: string;
  category: string; // e.g. "ROOTS", "HORIZON - MWF", "FOUNDATION"
  description: string;
  driveUrl: string;
  iconType: 'roots' | 'horizon' | 'foundation' | 'target' | 'elevate' | 'srg';
  iconColor: string;
  chipColor: string;
  lastUpdated: string;
  resourceTypes: string[];
}

export interface CircularNotice {
  id: string;
  title: string;
  date: string;
  category: 'Notice' | 'Syllabus' | 'Exam' | 'Urgent';
  downloadUrl?: string;
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  size: string;
  status: 'Success' | 'Failed';
  type: 'Automatic' | 'Manual';
  recordCount: number;
}

export interface TrafficLog {
  id: string;
  timestamp: string;
  userName: string;
  role: string;
  action: string;
  page: string;
}
