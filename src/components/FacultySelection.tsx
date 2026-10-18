import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  User,
  ArrowRight,
  ArrowLeft,
  Home,
  LayoutDashboard,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ProdigyLogo } from './ProdigyLogo';
import { Faculty, UserProfile } from '../types';
import { deduplicateFacultyList } from '../utils/weekUtils';

interface FacultySelectionProps {
  facultyList: Faculty[];
  onSelectUser: (user: UserProfile) => void;
  onAdminPinSuccess: () => void;
  onBackToLanding: () => void;
  onBackToPortal?: () => void;
  canReturnToPortal?: boolean;
}

export const FacultySelection: React.FC<FacultySelectionProps> = ({
  facultyList,
  onSelectUser,
  onAdminPinSuccess,
  onBackToLanding,
  onBackToPortal,
  canReturnToPortal = false
}) => {
  const uniqueFaculty = React.useMemo(() => deduplicateFacultyList(facultyList), [facultyList]);
  const [selectedId, setSelectedId] = useState<string>(() => uniqueFaculty[0]?.id || facultyList[0]?.id || 'fac-ac');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [clickCount, setClickCount] = useState<number>(0);

  // Auto-open admin modal if ?mode=admin or ?admin=true is in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'admin' || params.get('admin') === 'true' || params.get('role') === 'admin') {
      setShowPinModal(true);
    }
  }, []);

  const handleLogoClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    if (nextCount >= 5) {
      setShowPinModal(true);
      setClickCount(0);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = pinInput.trim().toUpperCase();
    const SINGLE_ADMIN_PASSWORD = 'NARAYANA';

    if (cleanInput === SINGLE_ADMIN_PASSWORD) {
      onAdminPinSuccess();
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Incorrect Password. Access Denied.');
    }
  };

  const handleConfirmSelection = () => {
    if (selectedId === 'admin-visitor') {
      setShowPinModal(true);
      return;
    }

    const fac = uniqueFaculty.find(f => f.id === selectedId);
    if (fac) {
      const user: UserProfile = {
        id: `usr-${fac.id}`,
        name: fac.name,
        role: 'faculty',
        subject: fac.subject,
        facultyId: fac.id,
        initials: fac.initials
      };
      onSelectUser(user);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 z-10 relative">
      <div className="max-w-4xl w-full space-y-6">
        {/* Top Navigation & Quick Actions Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-[#0c121e]/80 border border-white/[0.08] p-3 rounded-2xl backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2.5">
            {/* Return to Workspace / Cancel Switch */}
            {canReturnToPortal && onBackToPortal && (
              <button
                onClick={onBackToPortal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-xs font-grotesk font-bold text-sky-200 hover:text-white transition shadow-sm cursor-pointer"
                title="Cancel and return to your active workspace"
              >
                <ArrowLeft size={14} className="text-sky-300" />
                <span>Return to Workspace</span>
              </button>
            )}

            {/* Back to Home / Landing Page */}
            <button
              onClick={onBackToLanding}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-grotesk font-semibold text-slate-300 hover:text-white transition shadow-sm cursor-pointer"
              title="Return to Landing Page"
            >
              <Home size={14} className="text-amber-400" />
              <span>Landing Page</span>
            </button>
          </div>

          {/* Direct Admin Login Button */}
          <button
            onClick={() => setShowPinModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600/30 to-[#32489f]/40 hover:from-sky-600/50 hover:to-[#32489f]/60 border border-sky-400/40 text-xs font-grotesk font-bold text-sky-200 hover:text-white transition shadow-sm cursor-pointer"
            title="Unlock Administrator Privileges"
          >
            <ShieldCheck size={15} className="text-sky-300" />
            <span>Administrator Login</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <div
            onClick={handleLogoClick}
            className="inline-flex flex-col items-center justify-center cursor-pointer select-none group"
            title="Narayana Prodigy Academic Roster"
          >
            <ProdigyLogo size="lg" withTagline={true} />
          </div>
          <h2 className="font-russo uppercase tracking-wider text-xl sm:text-2xl text-white text-3d-mint">
            SELECT YOUR EDUCATOR PROFILE
          </h2>
          <p className="font-inter text-slate-300 text-xs max-w-md mx-auto">
            Choose your educator profile to view personalized schedules, class materials, and batch drive resources.
          </p>
        </div>

        {/* Faculty Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {uniqueFaculty.map((fac) => {
            const isSelected = selectedId === fac.id;
            return (
              <GlassCard
                key={fac.id}
                onClick={() => setSelectedId(fac.id)}
                className={`
                  p-4 relative border transition-all duration-200 cursor-pointer
                  ${isSelected
                    ? 'border-sky-500/80 bg-sky-500/10 shadow-[0_0_20px_rgba(2,132,199,0.2)]'
                    : 'border-white/[0.08] hover:border-white/20'
                  }
                `}
              >
                {/* Selection Checkmark */}
                {isSelected && (
                  <div className="absolute top-3 right-3 text-sky-400">
                    <CheckCircle2 size={16} />
                  </div>
                )}

                <div className="flex items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-manrope font-bold text-sm text-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: fac.color }}
                  >
                    {fac.initials}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-grotesk font-bold text-sm text-white">{fac.name}</h3>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-manrope font-bold text-[10px] uppercase tracking-wider ${fac.badgeBg}`}>
                      {fac.subject}
                    </span>
                  </div>
                </div>
              </GlassCard>
            );
          })}

          {/* Visitor / Admin Role Option */}
          <GlassCard
            onClick={() => {
              setSelectedId('admin-visitor');
              setShowPinModal(true);
            }}
            className={`
              p-4 relative border transition-all duration-200 cursor-pointer
              ${selectedId === 'admin-visitor'
                ? 'border-sky-500/80 bg-sky-500/10 shadow-[0_0_20px_rgba(2,132,199,0.2)]'
                : 'border-white/[0.08] hover:border-white/20'
              }
            `}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center justify-center font-manrope font-bold text-sm flex-shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-grotesk font-bold text-sm text-white">Admin / Director</h3>
                <span className="inline-block px-2.5 py-0.5 rounded-full font-manrope font-bold text-[10px] uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Full Access
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Action Button Bar */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/[0.08] flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 text-xs font-grotesk font-medium text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </button>

            <span className="text-slate-600">•</span>

            <button
              onClick={() => setShowPinModal(true)}
              className="flex items-center gap-1.5 text-xs font-grotesk font-semibold text-slate-400 hover:text-sky-400 transition cursor-pointer"
            >
              <Lock size={13} />
              <span>Admin Login</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {canReturnToPortal && onBackToPortal && (
              <button
                onClick={onBackToPortal}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.04] text-xs font-manrope font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              onClick={handleConfirmSelection}
              className="
                btn-3d-glow
                px-7 py-3 rounded-full
                text-white font-chakra font-bold text-xs uppercase tracking-wider
                flex items-center gap-2 cursor-pointer active:scale-95 transition-all
              "
            >
              <span>Confirm & Enter Workspace</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Admin Passcode Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <GlassCard className="max-w-xs w-full p-6 space-y-4" hover={false}>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-sky-400">
                <Lock size={16} />
                <h4 className="font-grotesk font-bold text-sm text-white">Admin Authentication</h4>
              </div>
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinError('');
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-manrope font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Enter Administrator Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError('');
                    }}
                    placeholder="Enter Password"
                    autoFocus
                    className="w-full text-center px-4 py-2.5 rounded-xl bg-[#0d121d] border border-white/10 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-sky-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pinError && (
                  <p className="text-[11px] text-rose-400 font-inter mt-1.5 text-center">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinError('');
                  }}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 font-manrope font-bold text-xs hover:bg-white/[0.03] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-bold text-xs uppercase shadow-md cursor-pointer"
                >
                  Unlock
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default FacultySelection;
