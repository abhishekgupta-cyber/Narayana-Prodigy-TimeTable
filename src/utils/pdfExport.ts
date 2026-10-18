import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClassSession, UserProfile } from '../types';

export interface PdfExportOptions {
  classes: ClassSession[];
  currentUser: UserProfile;
  academicWeek?: string;
  filterDay?: string;
}

export const generateWeeklySchedulePdf = ({
  classes,
  currentUser,
  academicWeek = 'Sept 21 – Sept 26, 2026',
  filterDay = 'All'
}: PdfExportOptions) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Filter classes according to current user role and day
  const facultyClasses = currentUser.role === 'faculty' && currentUser.facultyId
    ? classes.filter(c => c.facultyId === currentUser.facultyId)
    : classes;

  const filteredSessions = filterDay === 'All'
    ? facultyClasses
    : facultyClasses.filter(c => c.day === filterDay);

  // Day order helper
  const dayOrder: Record<string, number> = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7
  };

  const sortedClasses = [...filteredSessions].sort((a, b) => {
    const dDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
    if (dDiff !== 0) return dDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  const pendingNotes = facultyClasses.filter(c => !c.isCancelled && c.notesStatus === 'pending');
  const completedTasks = facultyClasses.filter(c => c.taskComplete || c.notesStatus === 'completed');
  const cancelledSessions = facultyClasses.filter(c => c.isCancelled);

  // ── HEADER ACCENT BAR ──
  doc.setFillColor(0, 114, 188); // Narayana Blue #0072BC
  doc.rect(0, 0, pageWidth, 8, 'F');

  // Secondary Orange Accent
  doc.setFillColor(243, 112, 33); // Narayana Orange #F37021
  doc.rect(0, 8, pageWidth, 3, 'F');

  // ── INSTITUTION TITLE & LOGO BRANDING ──
  let y = 35;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 114, 188);
  doc.text('NARAYANA PRODIGY', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('ACADEMIC PLANNING & FACULTY REPORTING SUITE', margin, y + 12);

  // Status Chip / Date at top right
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  doc.text(`Generated: ${dateStr}`, pageWidth - margin, y, { align: 'right' });
  doc.text(`Academic Cycle: ${academicWeek}`, pageWidth - margin, y + 12, { align: 'right' });

  // Divider
  y += 24;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);

  // ── FACULTY PROFILE DOSSIER CARD ──
  y += 16;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 52, 4, 4, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 52, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Faculty Dossier: ${currentUser.name}`, margin + 14, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const facultyRoleText = currentUser.role === 'admin'
    ? 'Designation: Chief Academic Administrator • All Batches'
    : `Department: ${currentUser.subject || 'Academic'} • Faculty Code: ${currentUser.facultyId || 'FAC-MAIN'}`;
  doc.text(facultyRoleText, margin + 14, y + 36);

  // Quick stats inside dossier card
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 114, 188);
  doc.text(`Weekly Classes: ${facultyClasses.length}`, pageWidth - margin - 150, y + 20);
  doc.setTextColor(243, 112, 33);
  doc.text(`Pending Uploads: ${pendingNotes.length}`, pageWidth - margin - 150, y + 36);

  doc.setTextColor(16, 185, 129);
  doc.text(`Completed: ${completedTasks.length}`, pageWidth - margin - 50, y + 20);
  doc.setTextColor(239, 68, 68);
  doc.text(`Cancelled: ${cancelledSessions.length}`, pageWidth - margin - 50, y + 36);

  // ── SECTION 1: WEEKLY SCHEDULE TABLE ──
  y += 66;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('I. WEEKLY TEACHING SCHEDULE & CLASSROOM ALLOCATION', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const filterDesc = filterDay === 'All' ? 'Showing complete weekly schedule' : `Filtered for ${filterDay} only`;
  doc.text(filterDesc, margin + 350, y);

  const scheduleTableRows = sortedClasses.map(cls => [
    cls.day.slice(0, 3),
    `${cls.startTime} - ${cls.endTime}`,
    cls.batchName,
    cls.subject,
    cls.facultyName,
    cls.roomNo,
    cls.isCancelled ? 'CANCELLED' : cls.notesUrl ? 'NOTES UPLOADED' : 'NO NOTES'
  ]);

  if (scheduleTableRows.length === 0) {
    scheduleTableRows.push(['-', 'No scheduled slots found', '-', '-', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: y + 8,
    margin: { left: margin, right: margin },
    head: [['Day', 'Time Slot', 'Batch', 'Subject', 'Educator', 'Room', 'Status']],
    body: scheduleTableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4.5,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [0, 114, 188],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 100, fontStyle: 'normal' },
      2: { cellWidth: 120, fontStyle: 'bold' },
      3: { cellWidth: 65 },
      4: { cellWidth: 95 },
      5: { cellWidth: 45, halign: 'center' },
      6: { cellWidth: 55, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const val = String(data.cell.raw);
        if (val === 'CANCELLED') {
          data.cell.styles.textColor = [239, 68, 68];
        } else if (val === 'COMPLETED' || val === 'UPLOADED') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (val === 'PENDING') {
          data.cell.styles.textColor = [217, 119, 6];
        }
      }
    }
  });

  // ── SECTION 2: PENDING TASKS & ACTIONABLE AUDIT ──
  // @ts-ignore
  let finalY = (doc as any).lastAutoTable?.finalY || y + 160;

  // Check if we have enough room on page for pending tasks section, else new page
  if (finalY > pageHeight - 180) {
    doc.addPage();
    finalY = 40;
  } else {
    finalY += 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('II. PENDING ACADEMIC TASKS & LECTURE NOTES COMPLIANCE', margin, finalY);

  const pendingTableRows = pendingNotes.map(cls => [
    cls.day,
    cls.batchName,
    cls.subject,
    cls.startTime,
    'Upload Lecture Notes / DPP Solutions to Drive'
  ]);

  if (pendingTableRows.length === 0) {
    pendingTableRows.push(['-', 'All Batches', 'All Subjects', '-', 'No pending tasks! All notes uploaded and verified ✓']);
  }

  autoTable(doc, {
    startY: finalY + 8,
    margin: { left: margin, right: margin },
    head: [['Day', 'Batch', 'Subject', 'Session Time', 'Required Faculty Action']],
    body: pendingTableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4.5,
      textColor: [51, 65, 85],
    },
    headStyles: {
      fillColor: [243, 112, 33], // Orange Header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [255, 251, 235], // Light amber
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 120, fontStyle: 'bold' },
      2: { cellWidth: 70 },
      3: { cellWidth: 80 },
      4: { cellWidth: 185 },
    }
  });

  // ── SIGNATURE & COMPLIANCE FOOTER ──
  // @ts-ignore
  let endY = (doc as any).lastAutoTable?.finalY || finalY + 100;
  if (endY > pageHeight - 100) {
    doc.addPage();
    endY = 40;
  } else {
    endY += 25;
  }

  // Two signature lines
  const sigCol1 = margin + 20;
  const sigCol2 = pageWidth - margin - 180;

  doc.setDrawColor(148, 163, 184);
  doc.line(sigCol1, endY + 25, sigCol1 + 140, endY + 25);
  doc.line(sigCol2, endY + 25, sigCol2 + 140, endY + 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Faculty Signature & Date', sigCol1 + 15, endY + 36);
  doc.text('Academic Dean / Coordinator Verification', sigCol2 - 5, endY + 36);

  // Bottom footer page count
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Narayana Prodigy Academic Management Suite • Confidential Internal Faculty Dossier',
      margin,
      pageHeight - 16
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      pageHeight - 16,
      { align: 'right' }
    );
  }

  // Save / Download PDF
  const sanitizedName = currentUser.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Narayana_Schedule_Report_${sanitizedName}_${dateStr.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
  return filename;
};
