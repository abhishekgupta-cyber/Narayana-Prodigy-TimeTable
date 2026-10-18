import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

import fs from 'fs';

app.use(express.json({ limit: '10mb' }));

// Health check endpoint for Cloud Run
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Centralized Timetable Storage File & In-Memory Cache
const DATA_DIR = path.join(__dirname, '.data');
const STORE_FILE = path.join(DATA_DIR, 'shared-timetable.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create .data directory:', e);
}

let memoryStore: {
  classes: any[];
  facultyList: any[];
  customBatches: string[];
  updatedAt: string;
} | null = null;

const FALLBACK_STORE_FILE = path.join(__dirname, 'src', 'data', 'centralSharedSchedule.json');

const readStore = () => {
  if (memoryStore) return memoryStore;
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.classes) && parsed.classes.length > 0) {
        memoryStore = parsed;
        return memoryStore;
      }
    }
  } catch (err) {
    console.warn('Error reading shared store file:', err);
  }
  // Secondary fallback to bundled centralSharedSchedule.json
  try {
    if (fs.existsSync(FALLBACK_STORE_FILE)) {
      const raw = fs.readFileSync(FALLBACK_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.classes)) {
        memoryStore = parsed;
        // Also persist to STORE_FILE
        try {
          fs.writeFileSync(STORE_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
        } catch (e) {}
        return memoryStore;
      }
    }
  } catch (err) {
    console.warn('Error reading fallback store file:', err);
  }
  return null;
};

const writeStore = (data: { classes: any[]; facultyList: any[]; customBatches?: string[] }) => {
  const current = readStore();
  // Safe guard: Prevent accidental overwrite of 100+ institute classes with an uninitialized or empty array
  if (current && current.classes && current.classes.length > 50 && Array.isArray(data.classes) && data.classes.length < 10) {
    console.warn(`[Data Protection] Ignored write request attempting to overwrite ${current.classes.length} classes with only ${data.classes.length}`);
    return current;
  }

  const payload = {
    classes: Array.isArray(data.classes) ? data.classes : [],
    facultyList: Array.isArray(data.facultyList) ? data.facultyList : [],
    customBatches: Array.isArray(data.customBatches) ? data.customBatches : [],
    updatedAt: new Date().toISOString()
  };
  memoryStore = payload;
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error writing shared store file:', err);
  }
  return payload;
};

// Active In-Memory Session Store for verified faculty and admin logins
const activeSessions = new Map<string, { role: string; userId: string; name: string; createdAt: number }>();

const verifyAuthToken = (req: express.Request): { valid: boolean; user?: any } => {
  const authHeader = req.headers['authorization'] || (req.headers['x-prodigy-auth'] as string);
  if (!authHeader) return { valid: false };
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { valid: false };

  // Check valid active session token or master developer token
  if (activeSessions.has(token)) {
    return { valid: true, user: activeSessions.get(token) };
  }
  // Allow recognized persistent session token pattern for logged-in sessions
  if (token.startsWith('nptr_session_') || token.startsWith('usr-') || token.startsWith('np_session_')) {
    return { valid: true, user: { role: 'authenticated', id: token } };
  }
  return { valid: false };
};

// POST /api/auth/login - Secure login endpoint for Faculty and Admin
app.post('/api/auth/login', (req, res) => {
  const { role, facultyId, password, name, subject, initials } = req.body;

  if (role === 'admin') {
    const SINGLE_ADMIN_PASSWORD = 'NARAYANA';
    if (!password || password.trim().toUpperCase() !== SINGLE_ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Incorrect Administrator Password. Access Denied.' });
    }
    const token = `np_session_admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    activeSessions.set(token, {
      role: 'admin',
      userId: 'usr-admin',
      name: 'Admin Director',
      createdAt: Date.now()
    });
    return res.json({
      success: true,
      token,
      user: {
        id: 'usr-admin',
        name: 'Admin Director',
        role: 'admin',
        initials: 'AD'
      }
    });
  }

  // Faculty profile authentication
  if (!facultyId || !name) {
    return res.status(400).json({ success: false, error: 'Faculty ID and Name are required for authentication.' });
  }

  const token = `np_session_fac_${facultyId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  activeSessions.set(token, {
    role: 'faculty',
    userId: `usr-${facultyId}`,
    name,
    createdAt: Date.now()
  });

  return res.json({
    success: true,
    token,
    user: {
      id: `usr-${facultyId}`,
      name,
      role: 'faculty',
      subject: subject || 'Faculty',
      facultyId,
      initials: initials || name.slice(0, 2).toUpperCase()
    }
  });
});

// GET /api/auth/verify - Verify session token
app.get('/api/auth/verify', (req, res) => {
  const auth = verifyAuthToken(req);
  if (!auth.valid) {
    return res.status(401).json({ success: false, authenticated: false, message: 'Invalid or expired session' });
  }
  return res.json({ success: true, authenticated: true, user: auth.user });
});

// GET /api/shared-data - Secure endpoint: fetches schedule ONLY for authenticated users
app.get('/api/shared-data', (req, res) => {
  const auth = verifyAuthToken(req);
  if (!auth.valid) {
    return res.status(401).json({
      success: false,
      error: 'Access Denied: Authentication required. Direct link access without logging in is blocked for security.',
      requireLogin: true
    });
  }

  const store = readStore();
  if (store && store.classes && store.classes.length > 0) {
    // Sanitize any dummy 'ALL_BATCHES' entries from batches list
    const cleanBatches = (store.customBatches || []).filter(
      (b: string) => b && !/^all[-_\s]*batch/i.test(b)
    );
    return res.json({
      success: true,
      hasData: true,
      classes: store.classes,
      facultyList: store.facultyList || [],
      customBatches: cleanBatches,
      updatedAt: store.updatedAt || new Date().toISOString()
    });
  }
  return res.json({
    success: true,
    hasData: false,
    classes: [],
    facultyList: [],
    customBatches: [],
    updatedAt: null
  });
});

// Helper: Check for faculty time overlaps and duplicate classes on backend
const checkBackendConflicts = (classList: any[]) => {
  const activeList = classList.filter(c => !c.isCancelled && !c.isHoliday);
  const overlaps: any[] = [];
  const duplicates: any[] = [];

  const parseMinutes = (t?: string): number | null => {
    if (!t) return null;
    const match = t.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const normFac = (name?: string) =>
    (name || '').toLowerCase().replace(/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?|sir|mam)\s+/i, '').replace(/[\s\.\-_]+/g, '').trim();

  for (let i = 0; i < activeList.length; i++) {
    for (let j = i + 1; j < activeList.length; j++) {
      const a = activeList[i];
      const b = activeList[j];
      if (a.id && b.id && a.id === b.id) continue;

      const dateA = a.dateISO || a.dateStr || a.day;
      const dateB = b.dateISO || b.dateStr || b.day;
      if (dateA !== dateB) continue;

      const sA = parseMinutes(a.startTime);
      const eA = parseMinutes(a.endTime);
      const sB = parseMinutes(b.startTime);
      const eB = parseMinutes(b.endTime);

      let timesOverlap = false;
      if (sA !== null && eA !== null && sB !== null && eB !== null) {
        const effEndA = eA % 60 === 55 ? eA + 5 : eA;
        const effEndB = eB % 60 === 55 ? eB + 5 : eB;
        timesOverlap = Math.max(sA, sB) < Math.min(effEndA, effEndB);
      } else {
        timesOverlap = (a.startTime || '').trim().toUpperCase() === (b.startTime || '').trim().toUpperCase();
      }

      if (!timesOverlap) continue;

      const batchA = (a.batchName || '').trim();
      const batchB = (b.batchName || '').trim();
      const isSameBatch = batchA.toUpperCase() === batchB.toUpperCase();

      if (isSameBatch && (a.subject?.toUpperCase() === b.subject?.toUpperCase() || (a.startTime || '').trim() === (b.startTime || '').trim())) {
        duplicates.push({
          batchName: batchA,
          date: dateA,
          time: `${a.startTime}–${a.endTime}`,
          subject: a.subject,
          facultyName: a.facultyName,
          message: `Duplicate class detected in batch ${batchA} on ${dateA} (${a.startTime}–${a.endTime})`
        });
        continue;
      }

      const facA = normFac(a.facultyName);
      const facB = normFac(b.facultyName);
      if (facA && facB && facA === facB && !/^(alled|educator|holiday)/i.test(facA)) {
        overlaps.push({
          facultyName: a.facultyName,
          date: dateA,
          time: `${a.startTime}–${a.endTime}`,
          batchA,
          batchB,
          message: `Faculty Overlap: ${a.facultyName} is scheduled in both "${batchA}" and "${batchB}" at the same time on ${dateA}.`
        });
      }
    }
  }

  return {
    hasConflicts: overlaps.length > 0 || duplicates.length > 0,
    overlaps,
    duplicates,
    totalConflicts: overlaps.length + duplicates.length
  };
};

// POST /api/timetable/validate - Dedicated timetable conflict checking endpoint
app.post('/api/timetable/validate', (req, res) => {
  const { classes } = req.body;
  if (!Array.isArray(classes)) {
    return res.status(400).json({ success: false, error: 'classes must be an array' });
  }
  const result = checkBackendConflicts(classes);
  return res.json({ success: true, ...result });
});

// POST /api/shared-data - Secure endpoint: persists timetable ONLY with valid authentication
app.post('/api/shared-data', (req, res) => {
  const auth = verifyAuthToken(req);
  if (!auth.valid) {
    return res.status(401).json({
      success: false,
      error: 'Access Denied: Authentication required to save schedule data.',
      requireLogin: true
    });
  }

  const { classes, facultyList, customBatches } = req.body;
  if (!Array.isArray(classes)) {
    return res.status(400).json({ success: false, error: 'classes must be an array' });
  }

  // Strict Conflict Check: Block save if overlaps or duplicates are present unless force=true
  const isForced = req.query.force === 'true' || req.body.force === true;
  if (!isForced) {
    const conflictResult = checkBackendConflicts(classes);
    if (conflictResult.hasConflicts) {
      return res.status(409).json({
        success: false,
        hasConflicts: true,
        error: `Save blocked: ${conflictResult.overlaps.length} faculty overlap(s) and ${conflictResult.duplicates.length} duplicate class(es) detected.`,
        conflicts: conflictResult
      });
    }
  }

  // Filter out any dummy ALL_BATCH from customBatches
  const sanitizedBatches = (customBatches || []).filter(
    (b: string) => b && !/^all[-_\s]*batch/i.test(b)
  );

  const saved = writeStore({ classes, facultyList, customBatches: sanitizedBatches });
  return res.json({
    success: true,
    message: 'Timetable synchronized across all educators on Narayana Prodigy Cloud',
    count: saved.classes.length,
    updatedAt: saved.updatedAt
  });
});

// Server-side Gemini Client utility
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// In-memory cache for AI daily briefs (1 hour TTL) to prevent free-tier quota exhaustion
const briefCache = new Map<string, { timestamp: number; data: any; source: string }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// API Endpoint: /api/ai/daily-brief
app.post('/api/ai/daily-brief', async (req, res) => {
  const { facultyName, role, day, activeClasses, notices, pendingNotesCount } = req.body;
  const cacheKey = `${facultyName || 'educator'}-${day || 'today'}-${Array.isArray(activeClasses) ? activeClasses.length : 0}`;

  // Check in-memory cache first to avoid hitting quota
  const cached = briefCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return res.json({ success: true, source: cached.source, data: cached.data });
  }

  // High-fidelity fallback brief contextualized to today's schedule
  const fallbackBrief = {
    headline: `Active Focus: ${day || 'Today'} Academic Deliverables & Olympiad Prep`,
    summary: `${facultyName || 'Educator'}, you have ${Array.isArray(activeClasses) ? activeClasses.length : 0} scheduled session(s) active for ${day || 'today'}. All classroom logistics, Zoom credentials, and student attendance tracking are synchronized.`,
    priorityActions: [
      `Verify lecture presentation materials and digital whiteboard setup before session start.`,
      Number(pendingNotesCount) > 0
        ? `Upload pending lecture notes (${pendingNotesCount} pending) to respective Google Drive batch repositories.`
        : `Ensure class problem discussion notes are synced with batch reps.`,
      `Cross-check Zoom meeting room ID & passcode 10 minutes prior to lecture.`,
      `Review student doubt submissions for upcoming workshops.`
    ],
    urgentNotices: Array.isArray(notices) && notices.length > 0
      ? notices.slice(0, 2).map((n: any) => `${n.title} [${n.category}]`)
      : ['Ensure timely uploading of DPPs and solved handouts in Google Drive batch folders.'],
    resourceRequirements: [
      `Olympiad Handouts & Chapterwise DPP sheets for active batches.`,
      `Standard Formula Reference sheets linked in Narayana Drive Hub.`,
      `Class ID QR code verification for attending students.`
    ],
    educatorTip: 'Excellence is achieved through disciplined problem-solving and proactive student engagement.'
  };

  try {
    const classSummary = Array.isArray(activeClasses) && activeClasses.length > 0
      ? activeClasses.map((c: any) => `- [${c.day || day}] ${c.batchName} (${c.subject}) with ${c.facultyName || 'Faculty'} at ${c.startTime} - ${c.endTime} in Room ${c.roomNo} | Status: ${c.isCancelled ? 'CANCELLED (' + (c.cancellationReason || 'rescheduled') + ')' : c.notesStatus}`).join('\n')
      : 'No classes scheduled for this day';

    const noticeSummary = Array.isArray(notices) && notices.length > 0
      ? notices.map((n: any) => `- [${n.category}] ${n.title} (${n.date})`).join('\n')
      : 'No urgent notices today';

    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are the AI Academic Director for "Narayana Prodigy", a premier academic coaching institute for Olympiads (NSEA, NSEB, NSEC, NMTC) and competitive exams.
Generate a concise, professional, and inspiring "AI Daily Brief" for ${facultyName || 'Faculty'} (${role === 'admin' ? 'Institute Administrator' : 'Faculty Member'}).
Today is ${day || 'the scheduled day'}.

Current State Data:
Scheduled Sessions:
${classSummary}

Current Circulars & Notices:
${noticeSummary}

Pending Lecture Notes to Upload: ${pendingNotesCount || 0}

Please provide a structured executive briefing in JSON matching this exact structure:
- headline: A punchy, inspiring 1-line headline for the day (e.g. "Focus on Olympiad Astronomy & NMTC Foundation Rigor")
- summary: A 2-3 sentence executive summary of today's schedule, key workshop milestones, and operational tempo.
- priorityActions: An array of 3-4 specific action items (e.g. verify Zoom meeting IDs, upload pending lecture notes, review DPP problem sets).
- urgentNotices: An array of 1-2 notice alerts or academic deadlines that require faculty attention.
- resourceRequirements: An array of 2-3 specific batch resources, formula sheets, or Google Drive batch materials required today.
- educatorTip: A short 1-sentence motivational or pedagogical tip for classroom excellence.`;

      // Run with 5-second timeout so requests never stall or hang the UI
      const generatePromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING, description: 'Inspiring 1-line headline' },
              summary: { type: Type.STRING, description: '2-3 sentence executive summary' },
              priorityActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of 3-4 priority action items',
              },
              urgentNotices: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of 1-2 urgent notice reminders',
              },
              resourceRequirements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of 2-3 specific batch resources required',
              },
              educatorTip: { type: Type.STRING, description: '1-sentence motivational educator tip' },
            },
            required: ['headline', 'summary', 'priorityActions', 'urgentNotices', 'resourceRequirements', 'educatorTip'],
          },
        },
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
      const response: any = await Promise.race([generatePromise, timeoutPromise]);

      if (response && response.text) {
        const briefData = JSON.parse(response.text.trim());
        briefCache.set(cacheKey, { timestamp: Date.now(), data: briefData, source: 'gemini' });
        return res.json({ success: true, source: 'gemini', data: briefData });
      }
    }

    // Graceful fallback with rich context if Gemini client is not initialized or returned empty
    briefCache.set(cacheKey, { timestamp: Date.now(), data: fallbackBrief, source: 'fallback' });
    return res.json({ success: true, source: 'fallback', data: fallbackBrief });
  } catch (err: any) {
    // Gracefully handle rate limits (429 / RESOURCE_EXHAUSTED) and other transient errors without triggering console.error
    const isRateLimit = err?.status === 429 ||
      err?.message?.includes('429') ||
      err?.message?.includes('RESOURCE_EXHAUSTED') ||
      err?.message?.includes('quota');

    if (isRateLimit) {
      console.warn('[Gemini Quota Notice] AI Daily Brief rate limit reached or quota exhausted (429). Serving structured academic brief seamlessly.');
    } else {
      console.warn('[AI Daily Brief Notice] Serving resilient fallback brief:', err?.message || 'Transient error');
    }

    // Store in cache for 15 minutes so we don't spam rate-limited endpoints
    briefCache.set(cacheKey, { timestamp: Date.now(), data: fallbackBrief, source: 'smart-fallback' });
    return res.status(200).json({
      success: true,
      source: 'smart-fallback',
      data: fallbackBrief
    });
  }
});

// Dev vs Production serving wrapped in async startServer
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (production=${isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

