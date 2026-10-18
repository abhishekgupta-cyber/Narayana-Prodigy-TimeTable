import React from 'react';
import { ArrowRight, Quote, Shield, Zap, Sparkles, Users } from 'lucide-react';
import { ProdigyLogo } from './ProdigyLogo';
import { DAILY_QUOTES } from '../data/mockData';
import { Faculty, ClassSession } from '../types';
import animatedHeroImage from '../assets/images/nptr_animated_hero.jpg';
import { deduplicateFacultyList } from '../utils/weekUtils';

interface LandingPageProps {
  onProceed: () => void;
  facultyList?: Faculty[];
  classes?: ClassSession[];
  onSelectFaculty?: (fac: Faculty) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onProceed,
  facultyList = [],
  classes = [],
  onSelectFaculty
}) => {
  const uniqueFaculty = React.useMemo(() => deduplicateFacultyList(facultyList), [facultyList]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const todayQuote = DAILY_QUOTES[new Date().getDate() % DAILY_QUOTES.length];

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-4 sm:p-8 z-10 select-none">
      {/* Top Bar: Official Narayana Prodigy Logo on Left, Live Sync on Right */}
      <header className="w-full flex items-center justify-between max-w-7xl mx-auto pt-2 pb-4">
        <ProdigyLogo size="md" withTagline={false} />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold tracking-wider text-[11px] uppercase">LIVE SYNC</span>
        </div>
      </header>

      {/* Center Section with Futuristic 3D Header and Mirror Glass Card */}
      <main className="flex-1 flex flex-col items-center justify-center my-6 max-w-5xl mx-auto w-full text-center space-y-6">
        {/* Top Greeting Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>{getGreeting()}, NARAYANA PRODIGY TEAM</span>
        </div>

        {/* Futuristic 3D Extruded Heading */}
        <div className="space-y-1 mb-2">
          <h1 className="font-russo uppercase tracking-wider text-3xl sm:text-5xl md:text-6xl text-white text-3d-mint leading-tight">
            WELCOME TO
          </h1>
          <h1 className="font-russo uppercase tracking-wider text-3xl sm:text-5xl md:text-6xl text-[#38bdf8] text-3d-cyan leading-tight">
            NARAYANA PRODIGY
          </h1>
          <h1 className="font-russo uppercase tracking-wider text-3xl sm:text-5xl md:text-6xl text-white text-3d-mint leading-tight">
            TIMETABLE ROSTER
          </h1>
        </div>

        {/* Ultra-Sleek Transparent Mirror Glass Card */}
        <div className="mirror-glass rounded-3xl p-6 sm:p-8 max-w-xl w-full mx-auto relative overflow-hidden transition-all duration-300 shadow-2xl">
          {/* Diagonal Glass Sheen Reflection */}
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transform -rotate-45 pointer-events-none animate-mirror-shine" />

          {/* Card Top Category Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-manrope font-bold text-[10px] uppercase tracking-widest mb-6">
            <Sparkles size={12} className="text-sky-400" />
            <span>NARAYANA PRODIGY COORDINATION ENGINE</span>
          </div>

          {/* High-Tech Animated 3D Educator / Scholar Avatar with Rotating Radar & Glowing Rings */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-5">
            {/* Outer Rotating Neon Cyan Ring */}
            <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-sky-400/60 animate-spin-slow" />
            {/* Middle Reverse Rotating Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dotted border-[#32489f]/70 animate-spin-reverse-slower" />

            {/* Glowing Avatar Container */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#32489f] via-sky-400 to-[#38bdf8] p-0.5 shadow-[0_0_30px_rgba(56,189,248,0.6)] animate-pulse-slow">
              <div className="w-full h-full rounded-full bg-[#0d1525] p-0.5 flex items-center justify-center overflow-hidden relative">
                {/* High-Tech Animated 3D Scholar Illustration */}
                <img
                  src={animatedHeroImage}
                  alt="Narayana Prodigy Academic Scholar"
                  className="w-full h-full object-cover rounded-full filter contrast-105"
                />
                <div className="absolute inset-0 bg-sky-500/10 mix-blend-overlay pointer-events-none" />
              </div>
            </div>

            {/* Verified Academic Shield Badge */}
            <div className="absolute bottom-1 right-1 bg-gradient-to-tr from-[#32489f] to-sky-400 text-white p-1.5 rounded-full shadow-[0_0_14px_rgba(56,189,248,0.8)] border border-white/60">
              <Shield size={13} className="fill-white" />
            </div>
          </div>

          {/* Description */}
          <p className="font-inter text-slate-200 text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-5">
            Welcome to <span className="font-bold text-[#38bdf8]">Narayana Prodigy Portal</span>, designed for effortless coordination among elite educators. Check your daily timeline, sync Google Drive resources, and manage batch statuses instantly.
          </p>

          {/* Daily Thought / Quote */}
          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 text-left flex items-start gap-2.5 mb-6">
            <Quote size={16} className="text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-manrope font-bold text-[10px] text-sky-400 uppercase tracking-wider mb-0.5">
                Today's Academic Inspiration
              </div>
              <p className="font-grotesk text-xs text-slate-300 italic">
                "{todayQuote}"
              </p>
            </div>
          </div>

          {/* 3D Glowing "LET'S GO ➔" Button */}
          <button
            onClick={onProceed}
            className="
              btn-3d-glow
              px-10 py-3.5 rounded-full
              text-white font-russo text-sm sm:text-base tracking-wider uppercase
              inline-flex items-center justify-center gap-2.5
              cursor-pointer active:scale-95 transition-all duration-200
            "
          >
            <span>ENTER TIMETABLE PORTAL</span>
            <Zap size={18} className="fill-amber-200 text-amber-200 animate-bounce" />
          </button>
        </div>

        {/* ── FACULTY ROSTER SHOWCASE ON LANDING PAGE ── */}
        {uniqueFaculty.length > 0 && (
          <div className="w-full max-w-4xl mx-auto pt-2">
            <div className="flex items-center justify-between px-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-sky-400" />
                <span className="font-orbitron font-bold text-xs text-white uppercase tracking-wider">
                  Narayana Prodigy Faculty Roster ({uniqueFaculty.length} Educators Registered)
                </span>
              </div>
              <button
                onClick={onProceed}
                className="text-[11px] font-manrope font-bold text-sky-400 hover:text-sky-300 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition"
              >
                <span>Select Profile</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {uniqueFaculty.map(fac => {
                return (
                  <div
                    key={fac.id}
                    onClick={() => {
                      if (onSelectFaculty) {
                        onSelectFaculty(fac);
                      } else {
                        onProceed();
                      }
                    }}
                    className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-sky-500/15 border border-white/[0.08] hover:border-sky-500/40 text-left transition duration-200 cursor-pointer flex items-center gap-2.5 group backdrop-blur-md"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-manrope font-bold text-xs text-white shadow-sm flex-shrink-0 group-hover:scale-105 transition"
                      style={{ backgroundColor: fac.color }}
                    >
                      {fac.initials}
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <div className="font-grotesk font-bold text-xs text-white group-hover:text-sky-300 transition truncate">
                        {fac.name}
                      </div>
                      <span className={`inline-block px-1.5 py-0.2 rounded-full font-manrope font-bold text-[8px] uppercase tracking-wider ${fac.badgeBg}`}>
                        {fac.subject}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="text-center text-[11px] font-mono text-slate-500 max-w-7xl mx-auto w-full pt-4">
        NARAYANA PRODIGY ACADEMIC PLATFORM • LIVE CLOUD TIMETABLE SYSTEM
      </footer>
    </div>
  );
};
