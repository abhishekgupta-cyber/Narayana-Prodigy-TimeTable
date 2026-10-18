import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  FolderKanban,
  Lightbulb,
  BellRing
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ClassSession, UserProfile, CircularNotice } from '../types';

interface DailyBriefData {
  headline: string;
  summary: string;
  priorityActions: string[];
  urgentNotices: string[];
  resourceRequirements: string[];
  educatorTip: string;
}

interface AiDailyBriefProps {
  currentUser: UserProfile;
  activeDay: string;
  classes: ClassSession[];
  notices: CircularNotice[];
  pendingNotesCount: number;
}

const buildDeterministicBrief = (
  currentUser: UserProfile,
  activeDay: string,
  classes: ClassSession[],
  notices: CircularNotice[],
  pendingNotesCount: number
): DailyBriefData => {
  const activeClassCount = classes.filter(c => !c.isCancelled).length;
  const isFaculty = currentUser.role === 'faculty';

  return {
    headline: `Active Focus: ${activeDay} Academic Deliverables & Olympiad Prep`,
    summary: `${currentUser.name}, you have ${activeClassCount} active session(s) scheduled for ${activeDay}. All batch repositories, digital whiteboard credentials, and student attendance tracking are operational.`,
    priorityActions: [
      `Verify digital whiteboard, Zoom credentials, and lecture presentation 10 minutes prior to session.`,
      pendingNotesCount > 0
        ? `Attach lecture notes for ${pendingNotesCount} session(s) to respective Google Drive batch folders.`
        : `Review Olympiad DPP problem sets and solution keys with batch representative.`,
      `Monitor student attendance and verify Class ID records.`,
      isFaculty
        ? `Conduct 5-minute student doubt-clearing session at the end of lecture.`
        : `Oversee campus lecture hall transitions and studio readiness.`
    ],
    urgentNotices: notices.length > 0
      ? notices.slice(0, 2).map(n => `${n.title} (${n.category})`)
      : ['Ensure all session DPP solutions are uploaded to Google Drive within 2 hours of class completion.'],
    resourceRequirements: [
      'Olympiad Problem Sheets & DPPs for scheduled batches.',
      'Standard Formula Reference guides linked in Narayana Drive Hub.',
      'Class ID QR verification sheet.'
    ],
    educatorTip: 'Disciplined clarity in problem-solving inspires the highest tier of Olympiad achievement.'
  };
};

export const AiDailyBrief: React.FC<AiDailyBriefProps> = ({
  currentUser,
  activeDay,
  classes,
  notices,
  pendingNotesCount
}) => {
  const storageKey = `np_brief_${currentUser.id}_${activeDay}`;

  const getInitialBrief = (): DailyBriefData => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return buildDeterministicBrief(currentUser, activeDay, classes, notices, pendingNotesCount);
  };

  const [brief, setBrief] = useState<DailyBriefData>(getInitialBrief);
  const [source, setSource] = useState<'gemini' | 'smart-fallback'>('smart-fallback');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'actions' | 'notices' | 'resources'>('actions');

  const hasFetchedForDayRef = useRef<string>('');
  const isFetchingRef = useRef<boolean>(false);

  // Background fetch that updates smoothly without tearing down the UI
  const fetchBrief = async (forceManual = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    hasFetchedForDayRef.current = storageKey;
    setLoading(true);

    try {
      const response = await fetch('/api/ai/daily-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyName: currentUser.name,
          role: currentUser.role,
          day: activeDay,
          activeClasses: classes,
          notices: notices,
          pendingNotesCount: pendingNotesCount
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success && resData.data) {
          setBrief(resData.data);
          setSource(resData.source === 'gemini' ? 'gemini' : 'smart-fallback');
          try {
            localStorage.setItem(storageKey, JSON.stringify(resData.data));
          } catch (e) {}
        }
      }
    } catch (err: any) {
      // Fallback is already actively displayed, no UI interruption
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Only trigger once when day or user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setBrief(JSON.parse(saved));
        hasFetchedForDayRef.current = storageKey;
        return;
      }
    } catch (e) {}

    // Set immediate rich deterministic brief so there is zero empty screen
    setBrief(buildDeterministicBrief(currentUser, activeDay, classes, notices, pendingNotesCount));

    if (hasFetchedForDayRef.current !== storageKey) {
      fetchBrief(false);
    }
  }, [storageKey]);

  const handleCopy = () => {
    const textToCopy = `📌 *Narayana Prodigy • AI Daily Brief (${activeDay})*
👤 Educator: ${currentUser.name} (${currentUser.role === 'admin' ? 'Institute Administrator' : currentUser.subject || 'Faculty'})
💡 Headline: ${brief.headline}

📝 Executive Summary:
${brief.summary}

⚡ Priority Actions:
${brief.priorityActions.map(a => `• ${a}`).join('\n')}

📢 Urgent Notices:
${brief.urgentNotices.map(n => `• ${n}`).join('\n')}

📚 Resource Requirements:
${brief.resourceRequirements.map(r => `• ${r}`).join('\n')}

✨ Pedagogical Tip: "${brief.educatorTip}"`;

    try {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {}
  };

  return (
    <GlassCard className="p-5 md:p-6 border-sky-500/30 bg-gradient-to-br from-[#0c1527] via-[#09111e] to-[#070b14] relative overflow-hidden" hover={false}>
      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-0 w-72 h-44 bg-gradient-to-bl from-sky-500/10 via-purple-500/5 to-transparent blur-2xl pointer-events-none" />

      {/* Top Banner & Control Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0072BC] via-sky-500 to-[#F37021] p-0.5 shadow-[0_0_15px_rgba(0,114,188,0.4)] flex-shrink-0">
            <div className="w-full h-full bg-[#080d16] rounded-[10px] flex items-center justify-center text-sky-400">
              <Sparkles size={18} className={loading ? 'animate-spin text-amber-400' : 'animate-pulse'} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-orbitron font-bold text-sm sm:text-base text-white tracking-wide">
                AI Daily Brief
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500/20 to-purple-500/20 border border-sky-400/30 font-manrope font-bold text-[10px] text-sky-300 uppercase tracking-wider flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-ping' : 'bg-sky-400'}`} />
                {loading ? 'Updating AI Brief...' : 'Gemini Intelligence'}
              </span>
              {source === 'gemini' && !loading && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[9px] uppercase">
                  Live Model
                </span>
              )}
            </div>
            <p className="font-inter text-xs text-slate-400 mt-0.5">
              Automated executive summary of today's schedule, operational actions, and required batch materials
            </p>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white font-manrope font-bold text-xs transition cursor-pointer"
            title="Copy brief for WhatsApp / Senior updates"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : 'Copy Brief'}</span>
          </button>

          <button
            onClick={() => fetchBrief(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0072BC]/20 hover:bg-[#0072BC]/40 border border-[#0072BC]/40 text-sky-300 font-manrope font-bold text-xs transition cursor-pointer disabled:opacity-60"
            title="Regenerate brief"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-sky-400' : ''} />
            <span>{loading ? 'Synthesizing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Brief Content - Rendered with zero flickering */}
      <div className="space-y-4 pt-4 relative z-10">
        {/* Headline & Summary */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F37021]" />
            <h4 className="font-grotesk font-bold text-sm sm:text-base text-white tracking-wide">
              {brief.headline}
            </h4>
          </div>
          <p className="font-inter text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-sky-500/40">
            {brief.summary}
          </p>
        </div>

        {/* Interactive Navigation Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06] overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-3.5 py-1.5 rounded-xl font-manrope font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'actions'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Priority Actions ({brief.priorityActions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notices')}
            className={`px-3.5 py-1.5 rounded-xl font-manrope font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'notices'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <BellRing size={13} />
            <span>Urgent Notices ({brief.urgentNotices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3.5 py-1.5 rounded-xl font-manrope font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'resources'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <FolderKanban size={13} />
            <span>Required Materials ({brief.resourceRequirements.length})</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="pt-1">
          {activeTab === 'actions' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {brief.priorityActions.map((action, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-sky-500/30 transition flex items-start gap-2.5 text-xs text-slate-300"
                >
                  <span className="w-5 h-5 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="font-inter leading-relaxed">{action}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="space-y-2">
              {brief.urgentNotices.map((notice, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200"
                >
                  <BellRing size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="font-inter leading-relaxed">{notice}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {brief.resourceRequirements.map((resItem, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/30 transition flex items-start gap-2.5 text-xs text-slate-300"
                >
                  <FolderKanban size={15} className="text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="font-inter leading-relaxed">{resItem}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Educator Pedagogical Tip Strip */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-sky-500/10 via-purple-500/10 to-transparent border border-white/[0.06] flex items-center gap-2.5">
          <Lightbulb size={16} className="text-amber-400 flex-shrink-0" />
          <p className="font-inter italic text-xs text-slate-300">
            <span className="font-manrope font-bold text-sky-300 not-italic uppercase text-[10px] tracking-wider mr-1.5">
              Pedagogical Tip:
            </span>
            "{brief.educatorTip}"
          </p>
        </div>
      </div>
    </GlassCard>
  );
};
