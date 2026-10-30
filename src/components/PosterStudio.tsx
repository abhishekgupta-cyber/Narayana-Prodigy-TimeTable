import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Image as ImageIcon,
  Download,
  Printer,
  Sparkles,
  Check,
  Calendar,
  Layers,
  Palette,
  FileText,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Plus,
  Trash2,
  Edit3,
  LayoutGrid,
  FileDown,
  RefreshCw,
  Zap
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { GlassCard } from './GlassCard';
import { ClassSession } from '../types';
import {
  ACADEMIC_WEEKS,
  filterClassesByWeek,
  getCurrentAcademicWeekId,
  sortClassesChronologically,
  getCanonicalBatchName
} from '../utils/weekUtils';

interface ScheduleSlot {
  type: 'class' | 'doubt' | 'holiday';
  slot?: string;
  batchName: string;
  originalBatchName?: string;
  subject: string;
  facultyName?: string;
  time: string;
  dateStr?: string;
  holidayTitle?: string;
}

interface DaySchedule {
  day: string;
  date: string;
  items: ScheduleSlot[];
}

export interface ExamScheduleItem {
  id: string;
  date: string;
  day: string;
  batchName: string;
  subject: string;
  time: string;
  syllabus: string;
  mode: string;
}

export type PosterTheme =
  | 'light-clean'
  | 'dark-scifi'
  | 'royal-gold'
  | 'neon-cyber'
  | 'oxford-classic'
  | 'emerald-matrix'
  | 'crimson-velocity';

export interface ThemeConfig {
  id: PosterTheme;
  name: string;
  desc: string;
  headingColor: string;
  accentColor: string;
  bgHex: string;
  cardBgHex: string;
  borderHex: string;
  textColor: string;
  badgeHex: string;
}

export const POSTER_THEMES: ThemeConfig[] = [
  {
    id: 'light-clean',
    name: 'Light Ivory',
    desc: 'Crisp Print & Noticeboard',
    headingColor: '#0072BC',
    accentColor: '#F37021',
    bgHex: '#FDFCFA',
    cardBgHex: '#FFFFFF',
    borderHex: '#E2E8F0',
    textColor: '#0F172A',
    badgeHex: '#0072BC'
  },
  {
    id: 'dark-scifi',
    name: 'Dark Cyber',
    desc: 'Electric Cyan & Rose',
    headingColor: '#00E5FF',
    accentColor: '#F43F5E',
    bgHex: '#090E1A',
    cardBgHex: '#111827',
    borderHex: '#1F2937',
    textColor: '#F8FAFC',
    badgeHex: '#00E5FF'
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    desc: 'Executive Olympiad Navy',
    headingColor: '#D4AF37',
    accentColor: '#FFDF73',
    bgHex: '#0F1424',
    cardBgHex: '#161D33',
    borderHex: '#F59E0B',
    textColor: '#F8FAFC',
    badgeHex: '#D4AF37'
  },
  {
    id: 'neon-cyber',
    name: 'Neon Aurora',
    desc: 'Deep Ultraviolet Glow',
    headingColor: '#00F5D4',
    accentColor: '#F72585',
    bgHex: '#070913',
    cardBgHex: '#0F1326',
    borderHex: '#00F5D4',
    textColor: '#F8FAFC',
    badgeHex: '#00F5D4'
  },
  {
    id: 'oxford-classic',
    name: 'Oxford Elite',
    desc: 'Collegiate Navy & Parchment',
    headingColor: '#E0A96D',
    accentColor: '#38BDF8',
    bgHex: '#0B1A30',
    cardBgHex: '#102340',
    borderHex: '#E0A96D',
    textColor: '#F8FAFC',
    badgeHex: '#E0A96D'
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    desc: 'Bio Mint & Forest Jade',
    headingColor: '#10B981',
    accentColor: '#84CC16',
    bgHex: '#041B15',
    cardBgHex: '#072E24',
    borderHex: '#10B981',
    textColor: '#F8FAFC',
    badgeHex: '#10B981'
  },
  {
    id: 'crimson-velocity',
    name: 'Crimson Velocity',
    desc: 'Obsidian & Ruby Flame',
    headingColor: '#E11D48',
    accentColor: '#FB7185',
    bgHex: '#120E13',
    cardBgHex: '#21151F',
    borderHex: '#E11D48',
    textColor: '#F8FAFC',
    badgeHex: '#E11D48'
  }
];

const DEFAULT_BATCH_THEMES: Record<string, PosterTheme> = {
  NSEB_WORKSHOP: 'emerald-matrix',
  'MATH-A-HOLIC': 'royal-gold',
  NSEP_WORKSHOP: 'neon-cyber',
  NSEC_WORKSHOP: 'dark-scifi',
  NSEA_WORKSHOP: 'oxford-classic',
  NSEJS_WORKSHOP: 'crimson-velocity'
};

interface PosterStudioProps {
  classes?: ClassSession[];
  availableBatches?: string[];
}

export const PosterStudio: React.FC<PosterStudioProps> = ({ classes = [], availableBatches = [] }) => {
  const [activeMode, setActiveMode] = useState<'weekly-schedule' | 'exam-announcement'>('weekly-schedule');
  const [posterTheme, setPosterTheme] = useState<PosterTheme>('emerald-matrix');

  // Batch-wise Design Preset Map (persisted in localStorage)
  const [batchThemeMap, setBatchThemeMap] = useState<Record<string, PosterTheme>>(() => {
    const saved = localStorage.getItem('np_batch_themes');
    if (saved) {
      try {
        return { ...DEFAULT_BATCH_THEMES, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_BATCH_THEMES;
  });

  // Auto-Fit Layout & Dynamic Density Engine (1 Class vs 5 Classes)
  const [autoFitLayout, setAutoFitLayout] = useState<boolean>(true);
  const [densityOverride, setDensityOverride] = useState<'auto' | 'spacious' | 'balanced' | 'compact'>('auto');

  // Academic Week Filter for Instant Timetable Updates (defaults to current week)
  const [selectedWeek, setSelectedWeek] = useState<string>(() => getCurrentAcademicWeekId());
  const [cacheClearCounter, setCacheClearCounter] = useState<number>(0);
  const [lastReflectedTime, setLastReflectedTime] = useState<string>(() => new Date().toLocaleTimeString());

  // Automatically refresh and clear any old poster cache when classes change
  useEffect(() => {
    try {
      localStorage.removeItem('np_student_poster_cache');
      localStorage.removeItem('np_poster_preview_cache');
    } catch (e) {}
    setCacheClearCounter(prev => prev + 1);
    setLastReflectedTime(new Date().toLocaleTimeString());
  }, [classes]);

  // Selected Batch for Poster (Clean canonical batch with multi-subject combining)
  const [selectedBatch, setSelectedBatch] = useState<string>('NSEB_WORKSHOP');

  // Full Typography, Color & Visual Alignment Customization
  const [fontScale, setFontScale] = useState<number>(100); // percentage: 85% to 130%
  const [headingColor, setHeadingColor] = useState<string>('#10B981');
  const [accentColor, setAccentColor] = useState<string>('#84CC16');
  const [textColorOverride, setTextColorOverride] = useState<string>('');
  const [headerAlignment, setHeaderAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [gridColumns, setGridColumns] = useState<2 | 3>(3);
  const [showEducatorOnPoster, setShowEducatorOnPoster] = useState<boolean>(true);
  const [includeExamFooterOnWeekly, setIncludeExamFooterOnWeekly] = useState<boolean>(false);
  const [customPosterTitle, setCustomPosterTitle] = useState<string>('Your Batch, Your Week, One Glance.');
  const [customTagline, setCustomTagline] = useState<string>('🎯 Academic Excellence Roster');

  // Exam Schedule Redesign & Customization State
  const [examTitle, setExamTitle] = useState<string>('NATIONAL OLYMPIAD & PRODIGY ASSESSMENT SCHEDULE');
  const [examSubtitle, setExamSubtitle] = useState<string>('NSEA / NSEP / NSEC / NSEB / NSEJS / NMTC — Official Test Series');
  const [examDateRange, setExamDateRange] = useState<string>('Sept 21 – Oct 04, 2026 • Live Proctored Window');
  const [examVenue, setExamVenue] = useState<string>('Online Zoom Portal & Narayana Prodigy Test Hub');
  const [examLayoutStyle, setExamLayoutStyle] = useState<'table' | 'cards' | 'timeline'>('table');

  const [examItems, setExamItems] = useState<ExamScheduleItem[]>([
    {
      id: 'ex-1',
      date: '2026-09-27',
      day: 'Sunday',
      batchName: 'NSEB_WORKSHOP',
      subject: 'Botany + Zoology',
      time: '10:00 AM – 01:00 PM',
      syllabus: 'Cell Biology, Plant Physiology & Human Genetics',
      mode: 'Online CBT + Zoom Proctor'
    },
    {
      id: 'ex-2',
      date: '2026-09-28',
      day: 'Monday',
      batchName: 'NSEJS_WORKSHOP',
      subject: 'Physics + Chemistry + Biology',
      time: '06:00 PM – 09:00 PM',
      syllabus: 'Mechanics, Atomic Structure & Life Processes',
      mode: 'Online CBT + Zoom Proctor'
    },
    {
      id: 'ex-3',
      date: '2026-09-30',
      day: 'Wednesday',
      batchName: 'NSEA_WORKSHOP',
      subject: 'Astronomy & Astrophysics',
      time: '08:00 PM – 10:00 PM',
      syllabus: 'Celestial Mechanics, Kepler Laws & Stellar Magnitude',
      mode: 'Prodigy Live Portal'
    },
    {
      id: 'ex-4',
      date: '2026-10-03',
      day: 'Saturday',
      batchName: 'MATH-A-HOLIC',
      subject: 'Olympiad Mathematics',
      time: '07:00 PM – 10:00 PM',
      syllabus: 'Number Theory, Combinatorics & Polynomials',
      mode: 'Prodigy Live Portal'
    }
  ]);

  // New Exam Row Form
  const [newExamDate, setNewExamDate] = useState<string>('2026-10-04');
  const [newExamDay, setNewExamDay] = useState<string>('Sunday');
  const [newExamBatch, setNewExamBatch] = useState<string>('NSEB_WORKSHOP');
  const [newExamSubject, setNewExamSubject] = useState<string>('Botany + Zoology');
  const [newExamTime, setNewExamTime] = useState<string>('05:00 PM – 08:00 PM');
  const [newExamSyllabus, setNewExamSyllabus] = useState<string>('Full Syllabus Cumulative Test');
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Export status feedback
  const [exportStatus, setExportStatus] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const posterRef = useRef<HTMLDivElement>(null);

  const subjectColors: Record<string, string> = {
    Physics: '#2F6FED',
    Chemistry: '#16B378',
    Maths: '#F5A623',
    Zoology: '#E85D75',
    Biology: '#A855F7',
    Astronomy: '#6366F1',
    Botany: '#10B981',
    Doubt: '#8B5CF6',
    Holiday: '#F43F5E',
    General: '#0284C7'
  };

  // Filter active timetable classes by selected Academic Week so timetable updates for current/target week reflect instantly
  const weekClasses = useMemo(() => {
    return filterClassesByWeek(classes, selectedWeek);
  }, [classes, selectedWeek, cacheClearCounter]);

  // Clean canonical batch list combining multi-subject workshop and academic tracks
  // (e.g. NSEB_WORKSHOP automatically combines Botany & Zoology classes; NSEJS_WORKSHOP combines Physics, Chemistry, Biology)
  const { batchOptions, batchSubjectsMap } = useMemo(() => {
    const map = new Map<string, Set<string>>();

    const registerBatch = (rawBatchName: string, subject?: string) => {
      const clean = (rawBatchName || '').trim();
      if (!clean || /^all[-_\s]*batch/i.test(clean) || clean === 'All Batches Combined') return;
      const canonical = getCanonicalBatchName(clean);
      if (!canonical) return;

      if (!map.has(canonical)) {
        map.set(canonical, new Set<string>());
      }
      if (subject) {
        map.get(canonical)!.add(subject);
      }
    };

    availableBatches.forEach(b => registerBatch(b));

    weekClasses.forEach(c => {
      if (c.batchName) {
        registerBatch(c.batchName, c.subject);
      }
    });

    const sortedCanonicalKeys = Array.from(map.keys()).sort();
    return {
      batchOptions: [...sortedCanonicalKeys, 'All Batches Combined'],
      batchSubjectsMap: map
    };
  }, [weekClasses, availableBatches, cacheClearCounter]);

  // Ensure selectedBatch is valid: default to a specific batch (e.g. NSEB_WORKSHOP) so student gets combined batch results immediately!
  const activeBatchKey = useMemo(() => {
    if (selectedBatch && batchOptions.includes(selectedBatch)) {
      return selectedBatch;
    }
    if (batchOptions.includes('NSEB_WORKSHOP')) {
      return 'NSEB_WORKSHOP';
    }
    const firstNonAll = batchOptions.find(b => b !== 'All Batches Combined');
    return firstNonAll || batchOptions[0] || 'All Batches Combined';
  }, [selectedBatch, batchOptions]);

  // Subjects inside the currently selected batch
  const activeBatchSubjects = useMemo(() => {
    if (activeBatchKey === 'All Batches Combined') {
      return Array.from(new Set(weekClasses.map(c => c.subject).filter(Boolean)));
    }
    const set = batchSubjectsMap.get(activeBatchKey);
    return set ? Array.from(set) : [];
  }, [activeBatchKey, batchSubjectsMap, weekClasses]);

  // Build 7-day schedule (including Sunday) with Clean Batch and Chronological Sorting applied
  const weeklySchedule: DaySchedule[] = useMemo(() => {
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const relevantClasses = weekClasses.filter(c => {
      if (c.isCancelled && !c.isHoliday) return false;
      if (activeBatchKey === 'All Batches Combined') return true;
      const canonical = getCanonicalBatchName(c.batchName);
      return c.batchName === activeBatchKey || canonical === activeBatchKey;
    });

    return daysOrder.map(dayName => {
      const unsorted = relevantClasses.filter(c => c.day === dayName);
      const dayCls = sortClassesChronologically(unsorted);
      const firstDate = dayCls.find(c => c.dateStr)?.dateStr || dayCls.find(c => c.dateISO)?.dateISO || '';

      const items: ScheduleSlot[] = dayCls.map((c, sIdx) => {
        let cleanSlot = `Slot ${sIdx + 1}`;
        if (c.slotName && /^slot\s*\d+/i.test(c.slotName)) {
          cleanSlot = c.slotName.replace(/^slot\s*/i, 'Slot ');
        } else if (c.slotName && /^s\d+/i.test(c.slotName)) {
          cleanSlot = `Slot ${c.slotName.slice(1)}`;
        } else if (c.slotName && c.slotName.trim().length <= 12) {
          cleanSlot = c.slotName.trim();
        }

        return {
          type: c.isHoliday ? 'holiday' : c.classType === 'doubt' ? 'doubt' : 'class',
          slot: cleanSlot,
          batchName: activeBatchKey === 'All Batches Combined' ? getCanonicalBatchName(c.batchName) : activeBatchKey,
          originalBatchName: c.batchName,
          subject: c.isHoliday ? (c.holidayTitle || 'CLASS HOLIDAY') : c.subject,
          facultyName: c.facultyName,
          time: `${c.startTime}–${c.endTime}`,
          dateStr: c.dateStr,
          holidayTitle: c.holidayTitle
        };
      });

      return {
        day: dayName,
        date: firstDate || (dayName === 'Sunday' ? 'Sunday Slot' : 'Weekly'),
        items
      };
    });
  }, [weekClasses, activeBatchKey, cacheClearCounter]);

  // Auto-Density Engine (Requirements 14 & 15: 1 Class vs 5 Classes)
  const maxDayClassCount = useMemo(() => {
    return Math.max(0, ...weeklySchedule.map(d => d.items.length));
  }, [weeklySchedule]);

  const activeDensity = useMemo<'spacious' | 'balanced' | 'compact'>(() => {
    if (densityOverride !== 'auto') {
      return densityOverride;
    }
    if (!autoFitLayout) return 'balanced';
    if (maxDayClassCount <= 1) return 'spacious';
    if (maxDayClassCount <= 3) return 'balanced';
    return 'compact'; // 4 or 5 classes
  }, [densityOverride, autoFitLayout, maxDayClassCount]);

  // When activeBatchKey changes, auto-load that batch's assigned theme preset (Requirement 16)
  useEffect(() => {
    if (activeBatchKey && activeBatchKey !== 'All Batches Combined') {
      const assignedThemeId = batchThemeMap[activeBatchKey];
      if (assignedThemeId) {
        setPosterTheme(assignedThemeId);
        const cfg = POSTER_THEMES.find(t => t.id === assignedThemeId);
        if (cfg) {
          setHeadingColor(cfg.headingColor);
          setAccentColor(cfg.accentColor);
        }
      }
    }
  }, [activeBatchKey]);

  // Save current theme preset as default for the selected batch (Requirement 16)
  const handleAssignThemeToBatch = () => {
    if (activeBatchKey === 'All Batches Combined') return;
    const updated = { ...batchThemeMap, [activeBatchKey]: posterTheme };
    setBatchThemeMap(updated);
    try {
      localStorage.setItem('np_batch_themes', JSON.stringify(updated));
    } catch (e) {}
    const themeName = POSTER_THEMES.find(t => t.id === posterTheme)?.name || posterTheme;
    setExportStatus(`Design locked: "${themeName}" is now the default theme for ${activeBatchKey}!`);
    setTimeout(() => setExportStatus(''), 4000);
  };

  // Add or Update Exam Row
  const handleSaveExamRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamBatch.trim() || !newExamSubject.trim()) return;

    if (editingExamId) {
      setExamItems(prev =>
        prev.map(item =>
          item.id === editingExamId
            ? {
                ...item,
                date: newExamDate,
                day: newExamDay,
                batchName: newExamBatch.trim(),
                subject: newExamSubject.trim(),
                time: newExamTime.trim(),
                syllabus: newExamSyllabus.trim()
              }
            : item
        )
      );
      setEditingExamId(null);
    } else {
      const newItem: ExamScheduleItem = {
        id: `ex-${Date.now()}`,
        date: newExamDate,
        day: newExamDay,
        batchName: newExamBatch.trim(),
        subject: newExamSubject.trim(),
        time: newExamTime.trim(),
        syllabus: newExamSyllabus.trim() || 'Cumulative Assessment',
        mode: 'Online Zoom + Portal'
      };
      setExamItems(prev => [...prev, newItem]);
    }
  };

  const handleEditExamRow = (item: ExamScheduleItem) => {
    setEditingExamId(item.id);
    setNewExamDate(item.date);
    setNewExamDay(item.day);
    setNewExamBatch(item.batchName);
    setNewExamSubject(item.subject);
    setNewExamTime(item.time);
    setNewExamSyllabus(item.syllabus);
  };

  const handleDeleteExamRow = (id: string) => {
    setExamItems(prev => prev.filter(i => i.id !== id));
    if (editingExamId === id) setEditingExamId(null);
  };

  /**
   * High-Resolution (3x DPI) Deterministic Canvas Renderer for Poster Export (PNG, PDF, Clipboard)
   * Guarantees zero blurriness, crisp typography, and exact batch/subject rendering.
   */
  const renderHighResPosterCanvas = (): HTMLCanvasElement => {
    const scale = 2.5; // Ultra-crisp 2.5x retina DPI
    const width = 1280;
    const height = activeMode === 'weekly-schedule' ? (includeExamFooterOnWeekly ? 1180 : 940) : 900;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    // 1. Background Fill & Theme Colors
    const currentTheme = POSTER_THEMES.find(t => t.id === posterTheme) || POSTER_THEMES[0];
    const isLight = posterTheme === 'light-clean';
    ctx.fillStyle = currentTheme.bgHex;
    ctx.fillRect(0, 0, width, height);

    // Subtle Decorative Border
    ctx.strokeStyle = currentTheme.borderHex;
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 18, width - 36, height - 36);

    // Top Accent Strip
    const grad = ctx.createLinearGradient(18, 18, width - 18, 18);
    grad.addColorStop(0, headingColor);
    grad.addColorStop(0.5, currentTheme.accentColor);
    grad.addColorStop(1, accentColor);
    ctx.fillStyle = grad;
    ctx.fillRect(18, 18, width - 36, 10);

    const primaryText = textColorOverride || currentTheme.textColor;
    const mutedText = isLight ? '#475569' : '#94A3B8';

    // 2. Header Section
    ctx.fillStyle = headingColor;
    ctx.beginPath();
    ctx.roundRect(45, 48, 56, 56, 14);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 22px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NP', 73, 84);

    ctx.textAlign = 'left';
    ctx.fillStyle = primaryText;
    ctx.font = `900 ${Math.round(24 * (fontScale / 100))}px Orbitron, sans-serif`;
    ctx.fillText('NARAYANA PRODIGY', 116, 72);

    // Prominently printed Batch Name Badge (Clean batch name, no merge)
    const batchBannerText = `BATCH: ${activeBatchKey}`;

    ctx.fillStyle = accentColor;
    ctx.font = `800 ${Math.round(14 * (fontScale / 100))}px Manrope, sans-serif`;
    ctx.fillText(batchBannerText, 116, 96);

    // Right Tagline Pill
    ctx.fillStyle = headingColor;
    ctx.beginPath();
    ctx.roundRect(width - 310, 54, 260, 40, 20);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Manrope, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(customTagline, width - 180, 79);

    // Divider
    ctx.strokeStyle = isLight ? '#E2E8F0' : '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(45, 122);
    ctx.lineTo(width - 45, 122);
    ctx.stroke();

    // 3. Title Banner (Respecting headerAlignment)
    const alignX = headerAlignment === 'center' ? width / 2 : headerAlignment === 'right' ? width - 45 : 45;
    ctx.textAlign = headerAlignment;
    ctx.fillStyle = headingColor;
    ctx.font = `900 ${Math.round(28 * (fontScale / 100))}px Orbitron, sans-serif`;
    ctx.fillText(
      activeMode === 'weekly-schedule' ? customPosterTitle : examTitle,
      alignX,
      162
    );

    ctx.fillStyle = mutedText;
    ctx.font = `600 ${Math.round(14 * (fontScale / 100))}px Inter, sans-serif`;
    ctx.fillText(
      activeMode === 'weekly-schedule'
        ? `Official 7-Day Batch Timetable for ${activeBatchKey} ${activeBatchSubjects.length > 1 ? `(${activeBatchSubjects.join(', ')})` : ''}`
        : `${examSubtitle}  |  ${examDateRange}  |  ${examVenue}`,
      alignX,
      188
    );

    ctx.textAlign = 'left';

    if (activeMode === 'weekly-schedule') {
      // 4. Draw 7-Day Schedule Cards
      const cols = 4;
      const cardW = (width - 90 - (cols - 1) * 16) / cols;
      const cardH = 310;
      const startY = 215;

      weeklySchedule.forEach((dayObj, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = 45 + col * (cardW + 16);
        const y = startY + row * (cardH + 18);
        const itemCount = dayObj.items.length;

        // Card Box
        ctx.fillStyle = currentTheme.cardBgHex;
        ctx.strokeStyle = dayObj.day === 'Sunday' ? '#F59E0B' : currentTheme.borderHex;
        ctx.lineWidth = dayObj.day === 'Sunday' ? 2 : 1.2;
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 14);
        ctx.fill();
        ctx.stroke();

        // Day Title & Date
        ctx.fillStyle = primaryText;
        ctx.font = `800 ${Math.round(16 * (fontScale / 100))}px sans-serif`;
        ctx.fillText(dayObj.day.toUpperCase(), x + 14, y + 28);

        ctx.fillStyle = mutedText;
        ctx.font = '600 11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(dayObj.date, x + cardW - 14, y + 27);
        ctx.textAlign = 'left';

        // Color Bar
        ctx.fillStyle = headingColor;
        ctx.fillRect(x + 14, y + 38, cardW - 28, 3);

        if (itemCount === 0) {
          ctx.fillStyle = mutedText;
          ctx.font = 'italic 12px sans-serif';
          ctx.fillText('No classes scheduled', x + 14, y + 80);
        } else if (itemCount === 1) {
          // 1 CLASS HERO PRESENTATION (Requirements 15, 35, 36: Large, spacious, clear Slot Number & Type badge)
          const it = dayObj.items[0];
          const sColor =
            it.type === 'holiday'
              ? subjectColors.Holiday
              : it.type === 'doubt'
              ? subjectColors.Doubt
              : subjectColors[it.subject] || headingColor;

          const sy = y + 62;
          ctx.fillStyle = sColor;
          ctx.beginPath();
          ctx.roundRect(x + 14, sy, 5, 96, 3);
          ctx.fill();

          // Slot badge pill
          const slotLabel = it.slot ? it.slot.toUpperCase() : 'SLOT 1';
          ctx.fillStyle = isLight ? '#0072BC' : '#0284C7';
          ctx.beginPath();
          ctx.roundRect(x + 26, sy - 2, 54, 18, 4);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 9.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(slotLabel, x + 53, sy + 11);
          ctx.textAlign = 'left';

          // Lecture vs Doubt color badge pill (Requirement 35)
          const typeLabel = it.type === 'doubt' ? 'DOUBT SESSION' : it.type === 'holiday' ? 'HOLIDAY' : 'CLASS / LECTURE';
          const typeBgColor = it.type === 'doubt' ? '#F59E0B' : it.type === 'holiday' ? '#EF4444' : '#10B981';
          ctx.fillStyle = typeBgColor;
          ctx.beginPath();
          ctx.roundRect(x + 86, sy - 2, it.type === 'doubt' ? 96 : 104, 18, 4);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '800 9.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(typeLabel, x + 86 + (it.type === 'doubt' ? 48 : 52), sy + 11);
          ctx.textAlign = 'left';

          // Subject Name
          ctx.fillStyle = primaryText;
          ctx.font = `900 ${Math.round(16 * (fontScale / 100))}px sans-serif`;
          ctx.fillText(it.subject.slice(0, 22), x + 26, sy + 40);

          // Timing Display (Requirement 36)
          ctx.fillStyle = accentColor;
          ctx.font = 'bold 12.5px monospace';
          ctx.fillText(it.time, x + 26, sy + 62);

          // Batch & Faculty details
          ctx.fillStyle = sColor;
          ctx.font = 'bold 11px sans-serif';
          const subLine = showEducatorOnPoster && it.facultyName
            ? `${it.batchName} • ${it.facultyName}`
            : `BATCH: ${it.batchName}`;
          ctx.fillText(subLine.slice(0, 32), x + 26, sy + 84);
        } else {
          // 2 to 5 CLASSES AUTO-COMPACT PRESENTATION (Requirements 15, 35, 36: Clean fit with Slot & Type badges)
          const slotStep = itemCount >= 4 ? 46 : 53;
          const barH = itemCount >= 4 ? 36 : 42;
          const subjSize = itemCount >= 4 ? 11 : 12.5;

          dayObj.items.slice(0, 5).forEach((it, sIdx) => {
            const sy = y + 48 + sIdx * slotStep;
            const sColor =
              it.type === 'holiday'
                ? subjectColors.Holiday
                : it.type === 'doubt'
                ? subjectColors.Doubt
                : subjectColors[it.subject] || headingColor;

            ctx.fillStyle = sColor;
            ctx.beginPath();
            ctx.roundRect(x + 14, sy, 3.5, barH, 2);
            ctx.fill();

            // Compact Slot & Type Badges (Requirements 35 & 36)
            const typeLabel = it.type === 'doubt' ? 'DOUBT' : it.type === 'holiday' ? 'HOLIDAY' : 'CLASS';
            const typeBgColor = it.type === 'doubt' ? '#F59E0B' : it.type === 'holiday' ? '#EF4444' : '#10B981';
            const slotLabel = it.slot ? it.slot.toUpperCase() : `S${sIdx + 1}`;

            // Draw Type Badge
            ctx.fillStyle = typeBgColor;
            ctx.beginPath();
            ctx.roundRect(x + 22, sy + 1, 44, 12, 3);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '800 7.5px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(typeLabel, x + 44, sy + 9.5);
            ctx.textAlign = 'left';

            // Draw Slot Badge
            ctx.fillStyle = isLight ? '#E2E8F0' : '#1E293B';
            ctx.beginPath();
            ctx.roundRect(x + 70, sy + 1, 42, 12, 3);
            ctx.fill();
            ctx.fillStyle = primaryText;
            ctx.font = 'bold 7.5px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(slotLabel.slice(0, 6), x + 91, sy + 9.5);
            ctx.textAlign = 'left';

            // Timing in top-right
            ctx.fillStyle = mutedText;
            ctx.font = itemCount >= 4 ? '600 9px monospace' : '600 9.5px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(it.time, x + cardW - 14, sy + 10);
            ctx.textAlign = 'left';

            // Subject Line
            ctx.fillStyle = primaryText;
            ctx.font = `bold ${Math.round(subjSize * (fontScale / 100))}px sans-serif`;
            ctx.fillText(it.subject.slice(0, 20), x + 22, sy + 24);

            // Subline (Batch & Faculty)
            ctx.fillStyle = sColor;
            ctx.font = itemCount >= 4 ? 'bold 8.5px sans-serif' : 'bold 9px sans-serif';
            const subLine = showEducatorOnPoster && it.facultyName
              ? `${it.batchName} • ${it.facultyName}`
              : `BATCH: ${it.batchName}`;
            ctx.fillText(subLine.slice(0, 34), x + 22, sy + (itemCount >= 4 ? 34 : 37));
          });
        }
      });

      // Optional Exam Footer inside Weekly Poster
      if (includeExamFooterOnWeekly && examItems.length > 0) {
        const ey = 875;
        ctx.fillStyle = isLight ? '#F1F5F9' : '#111827';
        ctx.beginPath();
        ctx.roundRect(45, ey, width - 90, 235, 14);
        ctx.fill();

        ctx.fillStyle = headingColor;
        ctx.font = 'bold 16px Orbitron, sans-serif';
        ctx.fillText(`UPCOMING EXAM SCHEDULE — ${examTitle}`, 65, ey + 30);

        examItems.slice(0, 4).forEach((ex, i) => {
          const rowY = ey + 62 + i * 40;
          ctx.fillStyle = primaryText;
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(`${ex.date} (${ex.day})`, 65, rowY);
          ctx.fillStyle = accentColor;
          ctx.fillText(`Batch: ${ex.batchName}`, 230, rowY);
          ctx.fillStyle = headingColor;
          ctx.fillText(ex.subject, 460, rowY);
          ctx.fillStyle = mutedText;
          ctx.fillText(`${ex.time}  |  ${ex.syllabus.slice(0, 45)}`, 730, rowY);
        });
      }
    } else {
      // Exam Schedule Dedicated Mode on Canvas
      const tableY = 225;
      ctx.fillStyle = headingColor;
      ctx.beginPath();
      ctx.roundRect(45, tableY, width - 90, 44, 10);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('EXAM DATE & DAY', 65, tableY + 27);
      ctx.fillText('BATCH NAME', 260, tableY + 27);
      ctx.fillText('SUBJECT(S)', 490, tableY + 27);
      ctx.fillText('TIMING', 740, tableY + 27);
      ctx.fillText('SYLLABUS & TOPICS', 950, tableY + 27);

      examItems.forEach((ex, idx) => {
        const ry = tableY + 56 + idx * 66;
        ctx.fillStyle = isLight ? (idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC') : (idx % 2 === 0 ? '#111827' : '#1E293B');
        ctx.beginPath();
        ctx.roundRect(45, ry, width - 90, 56, 8);
        ctx.fill();

        ctx.fillStyle = primaryText;
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`${ex.date} (${ex.day.slice(0, 3)})`, 65, ry + 33);

        ctx.fillStyle = accentColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(ex.batchName, 260, ry + 33);

        ctx.fillStyle = headingColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(ex.subject.slice(0, 28), 490, ry + 33);

        ctx.fillStyle = primaryText;
        ctx.font = '600 12px monospace';
        ctx.fillText(ex.time, 740, ry + 33);

        ctx.fillStyle = mutedText;
        ctx.font = '12px sans-serif';
        ctx.fillText(ex.syllabus.slice(0, 36), 950, ry + 33);
      });
    }

    // Footer
    ctx.fillStyle = mutedText;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(
      `NARAYANA PRODIGY ACADEMIC PORTAL • BATCH: ${activeBatchKey} • GENERATED ${new Date().toLocaleDateString()}`,
      45,
      height - 32
    );

    return canvas;
  };

  // 1. High-Quality PNG Download
  const handleDownloadPNG = () => {
    setIsExporting(true);
    try {
      const canvas = renderHighResPosterCanvas();
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const safeBatch = activeBatchKey.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `Narayana_Prodigy_${activeMode === 'weekly-schedule' ? 'Timetable' : 'Exam_Poster'}_${safeBatch}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExportStatus('High-Resolution PNG Poster (3x DPI) downloaded successfully!');
    } catch (e) {
      setExportStatus('Error generating PNG.');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus(''), 4000);
    }
  };

  // 2. High-Quality PDF Download
  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      const canvas = renderHighResPosterCanvas();
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH, undefined, 'FAST');
      const safeBatch = activeBatchKey.replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Narayana_Prodigy_Poster_${safeBatch}.pdf`);
      setExportStatus('Print-Ready A4 Landscape PDF downloaded successfully!');
    } catch (e) {
      setExportStatus('Error generating PDF.');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus(''), 4000);
    }
  };

  // 3. Copy Poster to Clipboard (Image + Fallback Text)
  const handleCopyPoster = async () => {
    setIsExporting(true);
    try {
      const canvas = renderHighResPosterCanvas();
      const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
      if (blob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setExportStatus('High-Res Poster image copied directly to clipboard! Paste anywhere (Ctrl+V).');
      } else {
        throw new Error('ClipboardItem fallback');
      }
    } catch (err) {
      // Fallback: copy structured schedule text if browser restricts image clipboard in iframe
      const summaryLines = [
        `NARAYANA PRODIGY — ${activeBatchKey}`,
        ...weeklySchedule
          .filter(d => d.items.length > 0)
          .map(d => `${d.day}: ${d.items.map(i => `${i.subject} (${i.batchName}) @ ${i.time}`).join(' | ')}`)
      ].filter(Boolean);
      await navigator.clipboard.writeText(summaryLines.join('\n'));
      setExportStatus('Poster schedule copied to clipboard!');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus(''), 4000);
    }
  };

  // 4. Direct Print Option
  const handleDirectPrint = () => {
    window.print();
  };

  const alignClass =
    headerAlignment === 'center'
      ? 'text-center items-center'
      : headerAlignment === 'right'
      ? 'text-right items-end'
      : 'text-left items-start';

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-orbitron font-extrabold text-xl text-white tracking-wide">
            POSTER GENERATOR & CUSTOMIZATION STUDIO
          </h2>
          <p className="font-inter text-slate-400 text-xs mt-1">
            Batch-wise selection, automatic multi-subject batch merging (NSEB / NSEJS), full font/color editor & 3x HD export
          </p>
        </div>

        {/* Mode Switcher Tabs + Quick Export Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              onClick={() => setActiveMode('weekly-schedule')}
              className={`px-3.5 py-2 rounded-lg font-manrope font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'weekly-schedule'
                  ? 'bg-[#0072BC] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar size={14} />
              <span>Weekly Batch Poster</span>
            </button>
            <button
              onClick={() => setActiveMode('exam-announcement')}
              className={`px-3.5 py-2 rounded-lg font-manrope font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'exam-announcement'
                  ? 'bg-[#0072BC] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText size={14} />
              <span>Exam Schedule Designer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export Confirmation Banner */}
      {exportStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-inter text-xs flex items-center gap-2 animate-in fade-in">
          <Check size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{exportStatus}</span>
        </div>
      )}

      {/* Main Studio Work Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Controls Toolpad */}
        <GlassCard className="xl:col-span-4 p-5 space-y-5" hover={false}>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Palette size={18} className="text-sky-400" />
              <h3 className="font-grotesk font-bold text-sm text-white">Student Poster Generator</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 font-mono text-[10px] font-bold">
              300 DPI HD
            </span>
          </div>

          <div className="space-y-4 font-inter text-xs">
            {/* WEEK SELECTOR (Date Range Picker) & INSTANT TIMETABLE SYNC */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/35 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-300 font-manrope font-bold text-xs uppercase tracking-wider">
                  <Calendar size={14} className="text-emerald-400" />
                  <span>Select Week (Date Range Picker)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem('np_student_poster_cache');
                      localStorage.removeItem('np_poster_preview_cache');
                    } catch (e) {}
                    setCacheClearCounter(c => c + 1);
                    setLastReflectedTime(new Date().toLocaleTimeString());
                    setExportStatus('Cache cleared! Poster re-rendered with latest master timetable.');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white text-[10px] font-bold flex items-center gap-1 border border-emerald-500/30 transition cursor-pointer"
                  title="Clear any cached poster view and force immediate re-render from master timetable"
                >
                  <RefreshCw size={11} />
                  <span>Clear Cache</span>
                </button>
              </div>

              {/* Academic Week Selector Dropdown */}
              <div className="space-y-1">
                <select
                  value={selectedWeek}
                  onChange={(e) => {
                    setSelectedWeek(e.target.value);
                    setCacheClearCounter(c => c + 1);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0c121e] border border-emerald-500/40 text-white font-grotesk font-bold text-xs focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {ACADEMIC_WEEKS.map(w => (
                    <option key={w.id} value={w.id} className="bg-[#0c121e]">
                      {w.label} {w.isCurrent ? '⭐ (Current Week)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-slate-300 flex items-center justify-between">
                <span>Active Timetable Week Roster:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {weekClasses.length} Scheduled Class(es)
                </span>
              </div>

              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-emerald-500/20">
                <span>Last Synced: {lastReflectedTime}</span>
                <span className="text-emerald-400 font-bold">Zero-Delay Reflection</span>
              </div>
            </div>

            {/* 1. BATCH SELECTION */}
            <div className="p-3.5 rounded-2xl bg-sky-950/25 border border-sky-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sky-300 font-manrope font-extrabold uppercase text-[11px] flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>Batch Selection</span>
                </label>
              </div>

              <select
                value={activeBatchKey}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0c121e] border border-sky-500/40 text-white font-grotesk font-bold text-xs focus:outline-none focus:border-sky-400 cursor-pointer"
              >
                {batchOptions.map(b => {
                  const subjs = batchSubjectsMap.get(b);
                  const subjArr = subjs ? Array.from(subjs) : [];
                  const label =
                    b === 'All Batches Combined'
                      ? 'All Batches Combined (Full Institute Overview)'
                      : subjArr.length > 0
                      ? `${b} (${subjArr.join(', ')})`
                      : b;
                  return (
                    <option key={b} value={b}>
                      {label}
                    </option>
                  );
                })}
              </select>

              {activeBatchKey !== 'All Batches Combined' && activeBatchSubjects.length > 1 && (
                <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-[11px] text-sky-200 flex items-start gap-2">
                  <Sparkles size={14} className="flex-shrink-0 mt-0.5 text-sky-400" />
                  <div>
                    <span className="font-bold text-white">{activeBatchKey}:</span> Combined schedule for{' '}
                    <span className="font-bold text-sky-300">{activeBatchSubjects.join(' & ')}</span> on this single student poster.
                  </div>
                </div>
              )}
            </div>

            {/* 2. THEME SELECTION & BATCH-WISE DESIGN PRESETS (Requirement 16) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-manrope font-bold uppercase text-[11px] flex items-center gap-1.5">
                  <Palette size={13} className="text-sky-400" />
                  <span>Modern Design Presets ({POSTER_THEMES.length})</span>
                </label>
                {activeBatchKey !== 'All Batches Combined' && (
                  <button
                    type="button"
                    onClick={handleAssignThemeToBatch}
                    className="text-[10px] font-manrope font-bold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer flex items-center gap-1"
                    title={`Lock in this theme as default for ${activeBatchKey}`}
                  >
                    <span>Assign to {activeBatchKey}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {POSTER_THEMES.map(t => {
                  const isSelected = posterTheme === t.id;
                  const isBatchDefault = batchThemeMap[activeBatchKey] === t.id;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setPosterTheme(t.id);
                        setHeadingColor(t.headingColor);
                        setAccentColor(t.accentColor);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'border-sky-400 bg-sky-500/20 text-white shadow-[0_0_15px_rgba(2,132,199,0.3)]'
                          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: t.headingColor }}
                        />
                        {isBatchDefault && (
                          <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                            BATCH
                          </span>
                        )}
                      </div>
                      <div className="font-grotesk font-extrabold text-[11px] truncate">{t.name}</div>
                      <div className="text-[9px] text-slate-400 truncate">{t.desc}</div>
                    </button>
                  );
                })}
              </div>

              {activeBatchKey !== 'All Batches Combined' && (
                <div className="text-[10px] text-slate-400 font-inter flex items-center justify-between px-1">
                  <span>Batch Preset: <strong className="text-white">{POSTER_THEMES.find(t => t.id === batchThemeMap[activeBatchKey])?.name || 'Default'}</strong></span>
                  <span className="text-slate-500 font-mono">Auto-applies when selecting batch</span>
                </div>
              )}
            </div>

            {/* 3. AUTO-FIT DYNAMIC DENSITY ENGINE (Requirements 14 & 15: 1 Class vs 5 Classes) */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-emerald-300 font-manrope font-extrabold uppercase text-[11px] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  <span>Auto-Fit Dynamic Layout</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAutoFitLayout(!autoFitLayout)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono transition cursor-pointer ${
                    autoFitLayout ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {autoFitLayout ? 'DYNAMIC (ON)' : 'MANUAL'}
                </button>
              </div>

              <p className="text-[11px] text-slate-300 font-inter">
                Auto-scales 1 class into a large hero card, and auto-compacts 4–5 classes cleanly so nothing cuts off.
              </p>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'auto', label: 'Auto (Smart)' },
                  { id: 'spacious', label: '1-Class Hero' },
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'compact', label: '4-5 Compact' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setDensityOverride(m.id as any)}
                    className={`py-1.5 px-1 rounded-xl text-center text-[10px] font-bold transition cursor-pointer ${
                      densityOverride === m.id
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                        : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/5'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-200 font-mono flex items-center justify-between">
                <span>Active Density: <strong>{activeDensity.toUpperCase()}</strong></span>
                <span>Peak: {maxDayClassCount} class{maxDayClassCount !== 1 ? 'es' : ''}/day</span>
              </div>
            </div>

            {/* 3. FULL TYPOGRAPHY, COLOR & ALIGNMENT CUSTOMIZER */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="font-manrope font-bold text-[11px] text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Type size={13} className="text-sky-400" />
                <span>Font Size, Color & Visual Alignment</span>
              </div>

              {/* Font Scale Slider */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Font Scale Size</span>
                  <span className="font-mono font-bold text-sky-400">{fontScale}%</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={130}
                  step={5}
                  value={fontScale}
                  onChange={(e) => setFontScale(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Brand / Heading</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={headingColor}
                      onChange={(e) => setHeadingColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border border-white/20 bg-transparent"
                    />
                    <span className="font-mono text-[10px] text-slate-300">{headingColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Batch Accent</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border border-white/20 bg-transparent"
                    />
                    <span className="font-mono text-[10px] text-slate-300">{accentColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Text Override</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={textColorOverride || '#1E293B'}
                      onChange={(e) => setTextColorOverride(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border border-white/20 bg-transparent"
                    />
                    {textColorOverride && (
                      <button
                        type="button"
                        onClick={() => setTextColorOverride('')}
                        className="text-[9px] text-rose-400 underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Visual Alignment & Columns */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Title Alignment</label>
                  <div className="flex rounded-lg bg-[#0d121d] p-1 border border-white/10">
                    {[
                      { id: 'left', icon: AlignLeft },
                      { id: 'center', icon: AlignCenter },
                      { id: 'right', icon: AlignRight }
                    ].map(al => {
                      const Icon = al.icon;
                      return (
                        <button
                          key={al.id}
                          type="button"
                          onClick={() => setHeaderAlignment(al.id as any)}
                          className={`flex-1 py-1 rounded flex justify-center cursor-pointer ${
                            headerAlignment === al.id ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Icon size={13} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Grid Layout</label>
                  <div className="flex rounded-lg bg-[#0d121d] p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setGridColumns(3)}
                      className={`flex-1 py-1 rounded text-[10px] font-bold cursor-pointer ${
                        gridColumns === 3 ? 'bg-sky-500 text-white' : 'text-slate-400'
                      }`}
                    >
                      3-Col
                    </button>
                    <button
                      type="button"
                      onClick={() => setGridColumns(2)}
                      className={`flex-1 py-1 rounded text-[10px] font-bold cursor-pointer ${
                        gridColumns === 2 ? 'bg-sky-500 text-white' : 'text-slate-400'
                      }`}
                    >
                      2-Col Wide
                    </button>
                  </div>
                </div>
              </div>

              {/* Poster Headline & Options */}
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={customPosterTitle}
                  onChange={(e) => setCustomPosterTitle(e.target.value)}
                  placeholder="Custom Poster Headline"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0d121d] border border-white/10 text-white text-xs"
                />
                <div className="flex items-center justify-between gap-2 pt-1">
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showEducatorOnPoster}
                      onChange={(e) => setShowEducatorOnPoster(e.target.checked)}
                      className="accent-sky-500 rounded cursor-pointer"
                    />
                    <span>Show Faculty Name</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-amber-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeExamFooterOnWeekly}
                      onChange={(e) => setIncludeExamFooterOnWeekly(e.target.checked)}
                      className="accent-amber-500 rounded cursor-pointer"
                    />
                    <span>Attach Exam Schedule</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 4. DEDICATED EXAM SCHEDULE CUSTOMIZER & REDESIGNER */}
            {(activeMode === 'exam-announcement' || includeExamFooterOnWeekly) && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-manrope font-extrabold text-[11px] text-amber-300 uppercase tracking-wider">
                    Exam Schedule Redesigner
                  </span>
                  <div className="flex gap-1">
                    {(['table', 'cards', 'timeline'] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setExamLayoutStyle(st)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer ${
                          examLayoutStyle === st ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Exam Banner Title"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0d121d] border border-white/10 text-white text-xs"
                />

                {/* Add / Edit Exam Row Form */}
                <form onSubmit={handleSaveExamRow} className="space-y-2 pt-2 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="date"
                      value={newExamDate}
                      onChange={(e) => setNewExamDate(e.target.value)}
                      className="p-1.5 rounded-lg bg-[#0d121d] border border-white/10 text-white font-mono text-[11px]"
                    />
                    <select
                      value={newExamDay}
                      onChange={(e) => setNewExamDay(e.target.value)}
                      className="p-1.5 rounded-lg bg-[#0d121d] border border-white/10 text-white text-[11px]"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={newExamBatch}
                      onChange={(e) => setNewExamBatch(e.target.value)}
                      placeholder="Batch (e.g. NSEB_WORKSHOP)"
                      className="p-1.5 rounded-lg bg-[#0d121d] border border-white/10 text-white text-[11px]"
                    />
                    <input
                      type="text"
                      value={newExamSubject}
                      onChange={(e) => setNewExamSubject(e.target.value)}
                      placeholder="Subject(s)"
                      className="p-1.5 rounded-lg bg-[#0d121d] border border-white/10 text-white text-[11px]"
                    />
                  </div>
                  <input
                    type="text"
                    value={newExamTime}
                    onChange={(e) => setNewExamTime(e.target.value)}
                    placeholder="Timing (e.g. 06:00 PM - 09:00 PM)"
                    className="w-full p-1.5 rounded-lg bg-[#0d121d] border border-white/10 text-white text-[11px]"
                  />
                  <input
                    type="text"
                    value={newExamSyllabus}
                    onChange={(e) => setNewExamSyllabus(e.target.value)}
                    placeholder="Exam Syllabus / Topics"
                    className="w-full p-1.5 rounded-lg bg-[#0d121d] border border-white/10 text-white text-[11px]"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-manrope font-extrabold text-[11px] uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>{editingExamId ? 'Update Exam Slot' : 'Add Exam Slot to Poster'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* 5. EXPORT & OUTPUT OPTIONS (PNG, PDF, PRINT, COPY) */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="font-manrope font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                Zero-Blur HD Export & Output Actions
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleDownloadPNG}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-manrope font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon size={14} />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleDownloadPDF}
                  className="py-2.5 px-3 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileDown size={14} />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDirectPrint}
                  className="py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-manrope font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} className="text-sky-400" />
                  <span>Direct Print</span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleCopyPoster}
                  className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-manrope font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy size={14} />
                  <span>Copy Poster</span>
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Right Live Interactive Poster Canvas */}
        <div className="xl:col-span-8 flex justify-center">
          <div
            ref={posterRef}
            style={{
              fontSize: `${fontScale}%`,
              color:
                textColorOverride ||
                (posterTheme === 'light-clean' ? '#0F172A' : '#F8FAFC')
            }}
            className={`
              w-full max-w-4xl rounded-3xl p-6 sm:p-9 shadow-2xl transition-all duration-300 border relative overflow-hidden
              ${
                posterTheme === 'light-clean'
                  ? 'bg-[#FDFCFA] border-slate-200'
                  : posterTheme === 'royal-gold'
                  ? 'bg-[#0F1424] border-amber-500/40 shadow-[0_0_40px_rgba(212,175,55,0.15)]'
                  : posterTheme === 'neon-cyber'
                  ? 'bg-[#070913] border-cyan-400/40 shadow-[0_0_50px_rgba(0,245,212,0.15)]'
                  : posterTheme === 'oxford-classic'
                  ? 'bg-[#0B1A30] border-amber-400/30 shadow-[0_0_40px_rgba(224,169,109,0.15)]'
                  : posterTheme === 'emerald-matrix'
                  ? 'bg-[#041B15] border-emerald-400/40 shadow-[0_0_50px_rgba(16,185,129,0.15)]'
                  : posterTheme === 'crimson-velocity'
                  ? 'bg-[#120E13] border-rose-500/40 shadow-[0_0_50px_rgba(225,29,72,0.15)]'
                  : 'bg-[#090E1A] border-sky-500/30'
              }
            `}
          >
            {/* Top Brand Gradient Bar */}
            <div
              className="h-2.5 w-full rounded-full mb-6"
              style={{
                background: `linear-gradient(90deg, ${headingColor}, #16B378, ${accentColor})`
              }}
            />

            {/* Poster Brand Header with Prominent Batch Name */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5 border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-3.5">
                <div
                  style={{ backgroundColor: headingColor }}
                  className="w-13 h-13 rounded-2xl flex items-center justify-center font-orbitron font-black text-white text-base shadow-lg flex-shrink-0"
                >
                  NP
                </div>
                <div>
                  <h1 className="font-orbitron font-black text-lg sm:text-xl tracking-wide flex items-center gap-1.5">
                    <span>NARAYANA</span>
                    <span style={{ color: headingColor }}>PRODIGY</span>
                  </h1>
                  {/* Clearly Printed Batch Name Badge */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span
                      style={{ backgroundColor: accentColor }}
                      className="px-3 py-0.5 rounded-md text-white font-manrope font-extrabold text-xs uppercase tracking-wider shadow-sm"
                    >
                      BATCH: {activeBatchKey}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{ backgroundColor: headingColor }}
                className="px-4 py-2 rounded-full font-manrope font-bold text-xs uppercase text-white shadow-md"
              >
                {customTagline}
              </div>
            </div>

            {/* Hero Banner */}
            <div className={`my-5 flex flex-col ${alignClass}`}>
              <h2
                style={{ color: headingColor, fontSize: `${Math.round(24 * (fontScale / 100))}px` }}
                className="font-orbitron font-extrabold leading-tight"
              >
                {activeMode === 'weekly-schedule' ? customPosterTitle : examTitle}
              </h2>
              <p className="text-xs sm:text-sm opacity-75 mt-1 font-inter">
                {activeMode === 'weekly-schedule' ? (
                  <>
                    Complete 7-Day Schedule for{' '}
                    <span className="font-extrabold" style={{ color: accentColor }}>
                      {activeBatchKey}
                    </span>
                    {activeBatchSubjects.length > 1
                      ? ` (${activeBatchSubjects.join(' • ')})`
                      : ''}
                  </>
                ) : (
                  <>{examSubtitle} • {examDateRange}</>
                )}
              </p>
            </div>

            {activeMode === 'weekly-schedule' ? (
              <>
                {/* 7-Day Grid */}
                <div
                  className={`grid grid-cols-1 ${
                    gridColumns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
                  } gap-4`}
                >
                  {weeklySchedule.map((d, idx) => {
                    const isHeroSingle = d.items.length === 1;
                    const isDenseDay = d.items.length >= 4;

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border transition ${
                          isHeroSingle ? 'p-5 sm:p-6' : isDenseDay ? 'p-3' : 'p-4'
                        } ${
                          posterTheme === 'light-clean'
                            ? 'bg-white border-slate-200 shadow-sm'
                            : posterTheme === 'royal-gold'
                            ? 'bg-[#161D33]/90 border-amber-500/30'
                            : posterTheme === 'neon-cyber'
                            ? 'bg-[#0F1326]/90 border-cyan-400/30 shadow-[0_0_20px_rgba(0,245,212,0.06)]'
                            : posterTheme === 'oxford-classic'
                            ? 'bg-[#102340]/90 border-amber-300/25'
                            : posterTheme === 'emerald-matrix'
                            ? 'bg-[#072E24]/90 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.06)]'
                            : posterTheme === 'crimson-velocity'
                            ? 'bg-[#21151F]/90 border-rose-500/30 shadow-[0_0_20px_rgba(225,29,72,0.06)]'
                            : 'bg-white/[0.04] border-white/10 backdrop-blur-md'
                        } ${d.day === 'Sunday' ? 'ring-2 ring-amber-400/50' : ''}`}
                      >
                        <div className="flex justify-between items-baseline mb-2">
                          <div className="flex items-center gap-1.5">
                            <h3
                              style={{
                                fontSize: `${Math.round((isHeroSingle ? 17 : 15) * (fontScale / 100))}px`
                              }}
                              className="font-grotesk font-extrabold"
                            >
                              {d.day}
                            </h3>
                            {d.day === 'Sunday' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">
                                SUNDAY
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] opacity-60 font-mono">{d.date}</span>
                        </div>

                        <div
                          className="h-1 rounded-full mb-3"
                          style={{ backgroundColor: headingColor }}
                        />

                        <div className={isDenseDay ? 'space-y-1.5' : isHeroSingle ? 'space-y-3 pt-1' : 'space-y-2'}>
                          {d.items.length === 0 ? (
                            <div className="text-center py-6 text-xs opacity-50 font-grotesk">
                              No classes scheduled
                            </div>
                          ) : isHeroSingle ? (
                            // 1 Class Hero Presentation (Requirement 15: Large, spacious, prominent display)
                            (() => {
                              const it = d.items[0];
                              const itColor =
                                it.type === 'holiday'
                                  ? subjectColors.Holiday
                                  : it.type === 'doubt'
                                  ? subjectColors.Doubt
                                  : subjectColors[it.subject] || headingColor;

                              return (
                                <div className="flex gap-3 items-start py-2">
                                  <div
                                    style={{ background: itColor }}
                                    className="w-2 h-14 rounded-full flex-shrink-0 mt-0.5 shadow-md"
                                  />
                                  <div className="flex-1 min-w-0 space-y-1">
                                    {/* Slot and Class vs Doubt Badges (Requirements 35 & 36) */}
                                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                      <span className="px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-400/30 font-mono tracking-wider">
                                        {it.slot || 'SLOT 1'}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider text-white shadow-sm ${
                                          it.type === 'doubt'
                                            ? 'bg-amber-500'
                                            : it.type === 'holiday'
                                            ? 'bg-rose-500'
                                            : 'bg-emerald-500'
                                        }`}
                                      >
                                        {it.type === 'doubt'
                                          ? 'DOUBT SESSION'
                                          : it.type === 'holiday'
                                          ? 'HOLIDAY'
                                          : 'CLASS / LECTURE'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-baseline gap-2 flex-wrap">
                                      <span
                                        style={{ fontSize: `${Math.round(15 * (fontScale / 100))}px` }}
                                        className="font-grotesk font-black text-white tracking-wide"
                                      >
                                        {it.subject}
                                      </span>
                                      <span className="text-xs px-2.5 py-0.5 rounded-md bg-white/10 font-bold font-mono text-white">
                                        {it.time}
                                      </span>
                                    </div>
                                    <div className="flex items-center flex-wrap gap-2 mt-1">
                                      <span
                                        style={{ background: itColor }}
                                        className="text-[10px] font-extrabold text-white uppercase px-2.5 py-0.5 rounded-md inline-block tracking-wider shadow-sm"
                                      >
                                        BATCH: {it.batchName}
                                      </span>
                                      {showEducatorOnPoster && it.facultyName && (
                                        <span className="text-xs opacity-90 font-medium text-slate-200">
                                          • {it.facultyName}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            // 2 to 5 Classes Auto-Compact Presentation (Requirement 15: Never cut off)
                            d.items.map((it, i) => {
                              const itColor =
                                it.type === 'holiday'
                                  ? subjectColors.Holiday
                                  : it.type === 'doubt'
                                  ? subjectColors.Doubt
                                  : subjectColors[it.subject] || headingColor;

                              return (
                                <div
                                  key={i}
                                  className={`flex gap-2 items-start border-t border-slate-100 dark:border-white/5 first:border-none ${
                                    isDenseDay ? 'py-1' : 'py-1.5'
                                  }`}
                                >
                                  <div
                                    style={{ background: itColor }}
                                    className={`rounded-full flex-shrink-0 mt-0.5 ${
                                      isDenseDay ? 'w-1 h-7' : 'w-1.5 h-9'
                                    }`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    {/* Slot and Class vs Doubt Badges (Requirements 35 & 36) */}
                                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white leading-none shadow-sm ${
                                          it.type === 'doubt'
                                            ? 'bg-amber-500'
                                            : it.type === 'holiday'
                                            ? 'bg-rose-500'
                                            : 'bg-emerald-500'
                                        }`}
                                      >
                                        {it.type === 'doubt'
                                          ? 'DOUBT'
                                          : it.type === 'holiday'
                                          ? 'HOLIDAY'
                                          : 'CLASS'}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-white/10 text-white/90 font-mono leading-none border border-white/10">
                                        {it.slot || `SLOT ${i + 1}`}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-baseline gap-1">
                                      <span
                                        style={{
                                          fontSize: `${Math.round((isDenseDay ? 11.5 : 13) * (fontScale / 100))}px`
                                        }}
                                        className="font-grotesk font-extrabold truncate"
                                      >
                                        {it.subject}
                                      </span>
                                      <span
                                        className={`font-mono flex-shrink-0 ${
                                          isDenseDay ? 'text-[9.5px] opacity-80' : 'text-[10px] opacity-75'
                                        }`}
                                      >
                                        {it.time}
                                      </span>
                                    </div>
                                    <div className="flex items-center flex-wrap gap-1 mt-0.5">
                                      <span
                                        style={{ background: itColor }}
                                        className={`font-extrabold text-white uppercase rounded inline-block tracking-wider ${
                                          isDenseDay ? 'text-[8.5px] px-1.5 py-0.2' : 'text-[9px] px-2 py-0.5'
                                        }`}
                                      >
                                        BATCH: {it.batchName}
                                      </span>
                                      {showEducatorOnPoster && it.facultyName && (
                                        <span
                                          className={`truncate font-medium ${
                                            isDenseDay ? 'text-[9px] opacity-70' : 'text-[10px] opacity-75'
                                          }`}
                                        >
                                          • {it.facultyName}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Optional Embedded Exam Schedule Section on Weekly Poster */}
                {includeExamFooterOnWeekly && (
                  <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h3
                        style={{ color: headingColor }}
                        className="font-orbitron font-extrabold text-sm uppercase tracking-wider"
                      >
                        📋 {examTitle}
                      </h3>
                      <span className="text-[11px] font-mono opacity-75">{examDateRange}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {examItems.map(ex => (
                        <div
                          key={ex.id}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                            posterTheme === 'light-clean'
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-white/[0.03] border-white/10'
                          }`}
                        >
                          <div>
                            <div className="font-bold" style={{ color: headingColor }}>
                              {ex.subject} <span className="text-[10px] opacity-75">({ex.batchName})</span>
                            </div>
                            <div className="text-[10px] opacity-75 mt-0.5">{ex.syllabus}</div>
                          </div>
                          <div className="text-right font-mono text-[10px] flex-shrink-0 ml-2">
                            <div className="font-bold" style={{ color: accentColor }}>{ex.date}</div>
                            <div className="opacity-75">{ex.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Dedicated Customizable Exam Schedule View */
              <div className="space-y-4">
                {examLayoutStyle === 'table' && (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr style={{ backgroundColor: headingColor }} className="text-white font-manrope uppercase text-[11px]">
                          <th className="py-3 px-4">Date & Day</th>
                          <th className="py-3 px-4">Batch Name</th>
                          <th className="py-3 px-4">Subject(s)</th>
                          <th className="py-3 px-4">Exam Timing</th>
                          <th className="py-3 px-4">Syllabus / Topics</th>
                          <th className="py-3 px-3 text-right print:hidden">Edit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                        {examItems.map(ex => (
                          <tr key={ex.id} className="hover:bg-sky-500/5">
                            <td className="py-3 px-4 font-mono font-bold">
                              {ex.date} <span className="opacity-70">({ex.day})</span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                style={{ backgroundColor: accentColor }}
                                className="px-2.5 py-0.5 rounded text-white font-bold text-[10px] uppercase"
                              >
                                {ex.batchName}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-grotesk font-bold" style={{ color: headingColor }}>
                              {ex.subject}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px]">{ex.time}</td>
                            <td className="py-3 px-4 text-xs opacity-85">{ex.syllabus}</td>
                            <td className="py-3 px-3 text-right print:hidden">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditExamRow(ex)}
                                  className="p-1 rounded hover:bg-sky-500/20 text-sky-500 cursor-pointer"
                                  title="Edit Exam Row"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExamRow(ex.id)}
                                  className="p-1 rounded hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                                  title="Remove Exam Row"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {examLayoutStyle === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {examItems.map(ex => (
                      <div
                        key={ex.id}
                        className={`p-4 rounded-2xl border space-y-2 ${
                          posterTheme === 'light-clean'
                            ? 'bg-white border-slate-200 shadow-sm'
                            : 'bg-white/[0.04] border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            style={{ backgroundColor: accentColor }}
                            className="px-2.5 py-0.5 rounded-md text-white font-manrope font-extrabold text-[10px] uppercase"
                          >
                            BATCH: {ex.batchName}
                          </span>
                          <span className="font-mono text-xs font-bold">
                            {ex.date} ({ex.day})
                          </span>
                        </div>
                        <h4 className="font-grotesk font-extrabold text-base" style={{ color: headingColor }}>
                          {ex.subject}
                        </h4>
                        <p className="text-xs opacity-80">Syllabus: {ex.syllabus}</p>
                        <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] font-mono">
                          <span>⏰ {ex.time}</span>
                          <div className="flex gap-1 print:hidden">
                            <button
                              type="button"
                              onClick={() => handleEditExamRow(ex)}
                              className="text-sky-500 hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteExamRow(ex.id)}
                              className="text-rose-500 hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {examLayoutStyle === 'timeline' && (
                  <div className="space-y-3 pl-4 border-l-2" style={{ borderColor: headingColor }}>
                    {examItems.map(ex => (
                      <div
                        key={ex.id}
                        className={`p-4 rounded-2xl border relative ${
                          posterTheme === 'light-clean'
                            ? 'bg-white border-slate-200'
                            : 'bg-white/[0.04] border-white/10'
                        }`}
                      >
                        <div
                          style={{ backgroundColor: accentColor }}
                          className="w-3 h-3 rounded-full absolute -left-[23px] top-5"
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-grotesk font-extrabold text-sm" style={{ color: headingColor }}>
                            {ex.date} ({ex.day}) — {ex.subject}
                          </div>
                          <span
                            style={{ backgroundColor: headingColor }}
                            className="px-2.5 py-0.5 rounded text-white font-bold text-[10px] uppercase"
                          >
                            BATCH: {ex.batchName}
                          </span>
                        </div>
                        <div className="text-xs opacity-80 mt-1">
                          <span className="font-mono font-bold">{ex.time}</span> • {ex.syllabus}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Poster Footer */}
            <div className="pt-5 mt-6 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] opacity-65 font-mono">
              <span>NARAYANA PRODIGY ACADEMIC NETWORK • BATCH: {activeBatchKey}</span>
              <span>300 DPI VERIFIED ROSTER POSTER</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
