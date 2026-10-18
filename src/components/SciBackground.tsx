import React from 'react';

/**
 * Rich Academic Scientific Background
 * Filled across the entire viewport with authentic STEM equations,
 * formulas, 3D molecular clusters, Bohr atomic models, benzene rings,
 * wave functions, vector diagrams, and calculus notations.
 */
interface SciBackgroundProps {
  themeMode?: 'dark' | 'light';
}

export const SciBackground: React.FC<SciBackgroundProps> = ({ themeMode = 'dark' }) => {
  const isLight = themeMode === 'light';

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-colors duration-300 ${
        isLight ? 'bg-[#f1f5f9]' : 'bg-[#070b14]'
      }`}
    >
      {/* 1. Deep Cosmic / Daylight Nebula Glows */}
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? `
            radial-gradient(ellipse 75% 55% at 20% 15%, rgba(2, 132, 199, 0.12), transparent 70%),
            radial-gradient(ellipse 65% 50% at 85% 80%, rgba(56, 189, 248, 0.14), transparent 65%),
            radial-gradient(circle at 50% 45%, rgba(224, 242, 254, 0.65), transparent 80%),
            radial-gradient(circle at 10% 85%, rgba(249, 115, 22, 0.08), transparent 60%)
          `
            : `
            radial-gradient(ellipse 75% 55% at 20% 15%, rgba(0, 114, 188, 0.22), transparent 70%),
            radial-gradient(ellipse 65% 50% at 85% 80%, rgba(56, 189, 248, 0.16), transparent 65%),
            radial-gradient(circle at 50% 45%, rgba(24, 49, 83, 0.45), transparent 80%),
            radial-gradient(circle at 10% 85%, rgba(232, 119, 34, 0.09), transparent 60%),
            radial-gradient(circle at 90% 20%, rgba(50, 72, 159, 0.20), transparent 65%)
          `
        }}
      />

      {/* 2. Precision Math Grid Coordinates (Subtle 120px grid with crosshairs) */}
      <div
        className={`absolute inset-0 ${isLight ? 'opacity-[0.06]' : 'opacity-[0.035]'}`}
        style={{
          backgroundImage: `
            linear-gradient(to right, ${isLight ? '#0284c7' : '#38bdf8'} 1px, transparent 1px),
            linear-gradient(to bottom, ${isLight ? '#0284c7' : '#38bdf8'} 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. SCIENTIFIC 3D GRAPHICS & DIAGRAMS (THROUGHOUT THE PAGE) */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isLight ? 'opacity-20' : 'opacity-100'}`}>
        {/* Element 1: 3D Molecular Cluster (Top-Left) */}
        <div className="absolute top-[8%] left-[5%] animate-float-slow opacity-85">
        <svg width="180" height="180" viewBox="0 0 160 160" fill="none" className="drop-shadow-[0_0_20px_rgba(56,189,248,0.45)]">
          <line x1="80" y1="80" x2="35" y2="45" stroke="#38bdf8" strokeWidth="2.5" strokeOpacity="0.7" />
          <line x1="80" y1="80" x2="130" y2="50" stroke="#0072BC" strokeWidth="2.5" strokeOpacity="0.7" />
          <line x1="80" y1="80" x2="60" y2="135" stroke="#38bdf8" strokeWidth="2.5" strokeOpacity="0.7" />
          <line x1="80" y1="80" x2="125" y2="120" stroke="#f97316" strokeWidth="2" strokeOpacity="0.6" />
          <line x1="35" y1="45" x2="15" y2="85" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.4" />

          <defs>
            <radialGradient id="spCyan" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#38bdf8" />
              <stop offset="85%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#034d7d" />
            </radialGradient>
            <radialGradient id="spBlue" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="40%" stopColor="#0072BC" />
              <stop offset="100%" stopColor="#0c2d48" />
            </radialGradient>
            <radialGradient id="spOrange" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fed7aa" />
              <stop offset="40%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#9a3412" />
            </radialGradient>
            <filter id="neonGlow1" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <circle cx="80" cy="80" r="18" fill="url(#spCyan)" filter="url(#neonGlow1)" />
          <circle cx="35" cy="45" r="13" fill="url(#spBlue)" />
          <circle cx="130" cy="50" r="15" fill="url(#spCyan)" />
          <circle cx="60" cy="135" r="12" fill="url(#spBlue)" />
          <circle cx="125" cy="120" r="11" fill="url(#spOrange)" />
          <circle cx="15" cy="85" r="8" fill="url(#spCyan)" opacity="0.8" />
        </svg>
      </div>

      {/* Element 2: 3D Crystal Octahedron (Top-Right) */}
      <div className="absolute top-[6%] right-[8%] animate-spin-reverse-slower opacity-85">
        <svg width="150" height="150" viewBox="0 0 120 120" fill="none" className="drop-shadow-[0_0_25px_rgba(56,189,248,0.4)]">
          <polygon points="60,10 100,50 60,75" fill="rgba(56,189,248,0.25)" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="60,10 20,50 60,75" fill="rgba(2,132,199,0.3)" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="60,110 100,50 60,75" fill="rgba(0,114,188,0.3)" stroke="#0072BC" strokeWidth="1.5" />
          <polygon points="60,110 20,50 60,75" fill="rgba(56,189,248,0.2)" stroke="#0072BC" strokeWidth="1.5" />
          <circle cx="60" cy="10" r="3" fill="#ffffff" />
          <circle cx="100" cy="50" r="3" fill="#38bdf8" />
          <circle cx="20" cy="50" r="3" fill="#38bdf8" />
          <circle cx="60" cy="110" r="3" fill="#ffffff" />
          <circle cx="60" cy="75" r="3" fill="#38bdf8" />
        </svg>
      </div>

      {/* Element 3: Bohr Atomic Model with 3 Orbitals (Center-Right) */}
      <div className="absolute top-[32%] right-[4%] animate-float-medium opacity-80">
        <svg width="170" height="170" viewBox="0 0 160 160" fill="none" className="drop-shadow-[0_0_20px_rgba(0,114,188,0.45)]">
          {/* Nucleus */}
          <circle cx="80" cy="80" r="10" fill="#f97316" />
          <circle cx="80" cy="80" r="16" stroke="#f97316" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          {/* Orbital 1 */}
          <ellipse cx="80" cy="80" rx="65" ry="24" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.7" transform="rotate(30 80 80)" />
          <circle cx="135" cy="98" r="4.5" fill="#38bdf8" className="drop-shadow-[0_0_8px_#38bdf8]" />
          {/* Orbital 2 */}
          <ellipse cx="80" cy="80" rx="65" ry="24" stroke="#0072BC" strokeWidth="1.5" strokeOpacity="0.7" transform="rotate(-30 80 80)" />
          <circle cx="32" cy="62" r="4.5" fill="#bae6fd" className="drop-shadow-[0_0_8px_#bae6fd]" />
          {/* Orbital 3 */}
          <ellipse cx="80" cy="80" rx="65" ry="24" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.6" transform="rotate(90 80 80)" />
          <circle cx="80" cy="15" r="4.5" fill="#34d399" className="drop-shadow-[0_0_8px_#34d399]" />
        </svg>
      </div>

      {/* Element 4: Benzene Aromatic Ring Structure (Center-Left) */}
      <div className="absolute top-[35%] left-[3%] animate-float-slow opacity-80">
        <svg width="150" height="150" viewBox="0 0 140 140" fill="none" className="drop-shadow-[0_0_18px_rgba(56,189,248,0.35)]">
          {/* Outer hexagon */}
          <polygon
            points="70,15 118,42 118,98 70,125 22,98 22,42"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeOpacity="0.8"
            fill="rgba(56,189,248,0.04)"
          />
          {/* Inner resonance circle */}
          <circle cx="70" cy="70" r="36" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 4" strokeOpacity="0.7" />
          {/* Double bonds alternate */}
          <line x1="32" y1="48" x2="32" y2="92" stroke="#0072BC" strokeWidth="2" strokeOpacity="0.8" />
          <line x1="72" y1="26" x2="108" y2="47" stroke="#0072BC" strokeWidth="2" strokeOpacity="0.8" />
          <line x1="72" y1="114" x2="108" y2="93" stroke="#0072BC" strokeWidth="2" strokeOpacity="0.8" />
          {/* Substituent bond & -OH / -CH3 group */}
          <line x1="70" y1="15" x2="70" y2="2" stroke="#f97316" strokeWidth="2" strokeOpacity="0.8" />
          <circle cx="70" cy="2" r="3" fill="#f97316" />
        </svg>
      </div>

      {/* Element 5: Harmonic Sine Wave & Coordinate Axis (Upper Mid) */}
      <div className="absolute top-[18%] left-[26%] animate-float-slow opacity-70 hidden md:block">
        <svg width="220" height="90" viewBox="0 0 220 90" fill="none">
          {/* X and Y Axis */}
          <line x1="10" y1="45" x2="210" y2="45" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <line x1="20" y1="10" x2="20" y2="80" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          {/* Wave Path */}
          <path
            d="M 20 45 Q 65 5 110 45 T 200 45"
            stroke="#38bdf8"
            strokeWidth="2"
            fill="none"
            className="drop-shadow-[0_0_10px_#38bdf8]"
          />
          <path
            d="M 20 45 Q 65 85 110 45 T 200 45"
            stroke="#0072BC"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            fill="none"
            opacity="0.6"
          />
          <text x="140" y="24" fill="#38bdf8" fontSize="11" fontFamily="monospace" opacity="0.8">y = A·sin(kx - ωt)</text>
        </svg>
      </div>

      {/* Element 6: 3D Transparent Cube (Bottom-Left) */}
      <div className="absolute bottom-[8%] left-[5%] animate-float-medium opacity-85">
        <svg width="140" height="140" viewBox="0 0 100 100" fill="none" className="drop-shadow-[0_0_18px_rgba(0,114,188,0.4)]">
          <polygon points="20,35 60,35 60,75 20,75" stroke="#38bdf8" strokeWidth="1.8" fill="rgba(56,189,248,0.06)" />
          <polygon points="40,15 80,15 80,55 40,55" stroke="#0072BC" strokeWidth="1.5" strokeDasharray="3 2" fill="rgba(0,114,188,0.03)" />
          <line x1="20" y1="35" x2="40" y2="15" stroke="#38bdf8" strokeWidth="1.8" />
          <line x1="60" y1="35" x2="80" y2="15" stroke="#38bdf8" strokeWidth="1.8" />
          <line x1="60" y1="75" x2="80" y2="55" stroke="#38bdf8" strokeWidth="1.8" />
          <line x1="20" y1="75" x2="40" y2="55" stroke="#0072BC" strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="20" cy="35" r="2.5" fill="#38bdf8" />
          <circle cx="60" cy="35" r="2.5" fill="#38bdf8" />
          <circle cx="60" cy="75" r="2.5" fill="#38bdf8" />
          <circle cx="40" cy="15" r="2.5" fill="#ffffff" />
          <circle cx="80" cy="15" r="2.5" fill="#38bdf8" />
        </svg>
      </div>

      {/* Element 7: DNA Double Helix Segment (Bottom-Center) */}
      <div className="absolute bottom-[6%] left-[38%] animate-float-slow opacity-75 hidden sm:block">
        <svg width="200" height="70" viewBox="0 0 200 70" fill="none">
          {/* Strands */}
          <path d="M 10 20 Q 55 55 100 20 T 190 20" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.75" />
          <path d="M 10 50 Q 55 15 100 50 T 190 50" stroke="#f97316" strokeWidth="2" fill="none" opacity="0.75" />
          {/* Base pairs (rungs) */}
          <line x1="30" y1="30" x2="30" y2="40" stroke="#94a3b8" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="55" y1="52" x2="55" y2="18" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="78" y1="38" x2="78" y2="32" stroke="#94a3b8" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="100" y1="20" x2="100" y2="50" stroke="#f97316" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="125" y1="32" x2="125" y2="38" stroke="#94a3b8" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="145" y1="52" x2="145" y2="18" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="170" y1="38" x2="170" y2="32" stroke="#94a3b8" strokeWidth="1.5" strokeOpacity="0.6" />
        </svg>
      </div>

      {/* Element 8: Glowing Multi-Atom Cluster (Bottom-Right) */}
      <div className="absolute bottom-[10%] right-[6%] animate-float-slow opacity-85">
        <svg width="170" height="170" viewBox="0 0 140 140" fill="none" className="drop-shadow-[0_0_22px_rgba(56,189,248,0.5)]">
          <line x1="70" y1="70" x2="110" y2="40" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.7" />
          <line x1="70" y1="70" x2="30" y2="50" stroke="#f97316" strokeWidth="2" strokeOpacity="0.7" />
          <line x1="70" y1="70" x2="85" y2="115" stroke="#0072BC" strokeWidth="2" strokeOpacity="0.7" />
          <line x1="70" y1="70" x2="35" y2="105" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.6" />

          <circle cx="70" cy="70" r="16" fill="url(#spCyan)" filter="url(#neonGlow1)" />
          <circle cx="110" cy="40" r="12" fill="url(#spBlue)" />
          <circle cx="30" cy="50" r="13" fill="url(#spOrange)" />
          <circle cx="85" cy="115" r="10" fill="url(#spCyan)" />
          <circle cx="35" cy="105" r="11" fill="url(#spBlue)" />
        </svg>
      </div>

      {/* Element 9: 3D Vector Cross-Product & Coordinate System (Upper Right-Mid) */}
      <div className="absolute top-[22%] right-[22%] animate-float-reverse opacity-70 hidden lg:block">
        <svg width="130" height="110" viewBox="0 0 120 100" fill="none">
          {/* X axis */}
          <line x1="20" y1="70" x2="95" y2="70" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <polygon points="95,67 103,70 95,73" fill="#38bdf8" />
          <text x="105" y="73" fill="#38bdf8" fontSize="10" fontFamily="monospace">x (A)</text>
          {/* Y axis */}
          <line x1="20" y1="70" x2="20" y2="12" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
          <polygon points="17,12 20,4 23,12" fill="#34d399" />
          <text x="16" y="2" fill="#34d399" fontSize="10" fontFamily="monospace">z (A × B)</text>
          {/* Z / B axis diagonal */}
          <line x1="20" y1="70" x2="60" y2="35" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
          <polygon points="56,33 66,30 62,40" fill="#f97316" />
          <text x="68" y="32" fill="#f97316" fontSize="10" fontFamily="monospace">y (B)</text>
          {/* Arc */}
          <path d="M 45 70 A 25 25 0 0 0 38 54" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.6" />
          <text x="44" y="60" fill="#ffffff" fontSize="9" opacity="0.7">θ</text>
        </svg>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. ABUNDANT MATH & PHYSICS FORMULAS (FILLING ENTIRE PAGE)  */}
      {/* ────────────────────────────────────────────────────────── */}

      {/* QUADRANT 1: TOP LEFT */}
      <div className="absolute top-[5%] left-[2%] animate-float-slow text-sky-400/60 font-mono text-base font-bold tracking-wider drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
        E = mc²
      </div>
      <div className="absolute top-[16%] left-[1%] animate-float-medium text-sky-300/50 font-mono text-sm font-semibold drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">
        ∇ × E = -∂B/∂t
      </div>
      <div className="absolute top-[23%] left-[11%] animate-float-reverse text-cyan-300/45 font-mono text-xs">
        PV = nRT
      </div>
      <div className="absolute top-[28%] left-[2%] animate-float-slow text-slate-300/50 font-mono text-xs">
        ∫ e⁻ˣ² dx = √π
      </div>
      <div className="absolute top-[33%] left-[12%] animate-float-medium text-sky-400/50 font-mono text-xs font-bold">
        Δx · Δp ≥ ℏ/2
      </div>

      {/* QUADRANT 2: TOP CENTER / MID */}
      <div className="absolute top-[4%] left-[28%] animate-float-slow text-sky-400/55 font-mono text-sm font-bold drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">
        iℏ(∂Ψ/∂t) = ĤΨ
      </div>
      <div className="absolute top-[6%] left-[48%] animate-float-medium text-amber-300/55 font-mono text-xs font-bold">
        e^(iπ) + 1 = 0
      </div>
      <div className="absolute top-[3%] right-[32%] animate-float-slow text-emerald-400/55 font-mono text-xs font-semibold">
        ∑(1/n²) = π²/6
      </div>
      <div className="absolute top-[12%] left-[45%] animate-float-reverse text-sky-300/45 font-mono text-xs">
        λ = h/p (de Broglie)
      </div>
      <div className="absolute top-[14%] right-[36%] animate-float-slow text-cyan-300/50 font-mono text-xs">
        lim(x→0) [sin(x)/x] = 1
      </div>

      {/* QUADRANT 3: TOP RIGHT */}
      <div className="absolute top-[4%] right-[3%] animate-float-slow text-sky-400/60 font-mono text-base font-bold tracking-wider drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
        F = dp/dt = ma
      </div>
      <div className="absolute top-[15%] right-[2%] animate-float-medium text-sky-300/50 font-mono text-sm font-bold">
        ∮ B · dA = 0
      </div>
      <div className="absolute top-[21%] right-[12%] animate-float-reverse text-orange-400/50 font-mono text-xs">
        K = ½mv²
      </div>
      <div className="absolute top-[27%] right-[3%] animate-float-slow text-cyan-300/45 font-mono text-xs">
        pH = -log[H⁺]
      </div>
      <div className="absolute top-[32%] right-[14%] animate-float-medium text-sky-400/50 font-mono text-xs font-bold">
        ∇²V = -ρ/ε₀
      </div>

      {/* QUADRANT 4: CENTER LEFT */}
      <div className="absolute top-[46%] left-[2%] animate-float-medium text-sky-400/55 font-mono text-sm font-bold">
        c = 1/√(μ₀ε₀)
      </div>
      <div className="absolute top-[52%] left-[8%] animate-float-slow text-amber-400/50 font-mono text-xs">
        τ = r × F
      </div>
      <div className="absolute top-[58%] left-[1%] animate-float-reverse text-sky-300/50 font-mono text-xs">
        ΔS ≥ 0 (2nd Law)
      </div>
      <div className="absolute top-[64%] left-[9%] animate-float-slow text-cyan-300/50 font-mono text-xs font-bold">
        Ĥ|n⟩ = E_n|n⟩
      </div>
      <div className="absolute top-[70%] left-[2%] animate-float-medium text-slate-300/45 font-mono text-xs">
        ∂²u/∂t² = c²∇²u
      </div>

      {/* QUADRANT 5: CENTER RIGHT */}
      <div className="absolute top-[45%] right-[2%] animate-float-slow text-sky-400/55 font-mono text-sm font-bold">
        U = ½CV² = Q²/(2C)
      </div>
      <div className="absolute top-[51%] right-[9%] animate-float-reverse text-emerald-400/50 font-mono text-xs font-bold">
        ω = √(k/m)
      </div>
      <div className="absolute top-[57%] right-[1%] animate-float-medium text-orange-400/50 font-mono text-xs">
        2H₂ + O₂ → 2H₂O
      </div>
      <div className="absolute top-[63%] right-[10%] animate-float-slow text-sky-300/50 font-mono text-xs">
        R_μν - ½Rg_μν = (8πG/c⁴)T_μν
      </div>
      <div className="absolute top-[69%] right-[2%] animate-float-medium text-cyan-300/45 font-mono text-xs font-bold">
        [x̂, p̂] = iℏ
      </div>

      {/* QUADRANT 6: BOTTOM LEFT */}
      <div className="absolute bottom-[24%] left-[2%] animate-float-slow text-sky-400/55 font-mono text-sm font-bold">
        ∮ E · ds = -dΦ_B/dt
      </div>
      <div className="absolute bottom-[18%] left-[10%] animate-float-medium text-amber-300/50 font-mono text-xs font-semibold">
        L = T - V (Lagrangian)
      </div>
      <div className="absolute bottom-[12%] left-[1%] animate-float-reverse text-cyan-300/50 font-mono text-xs font-bold">
        Z = √(R² + (X_L - X_C)²)
      </div>
      <div className="absolute bottom-[4%] left-[8%] animate-float-slow text-slate-400/50 font-mono text-xs">
        d/dx [ln(x)] = 1/x
      </div>
      <div className="absolute bottom-[2%] left-[18%] animate-float-medium text-sky-300/45 font-mono text-xs">
        W = ∫ F · dr
      </div>

      {/* QUADRANT 7: BOTTOM CENTER */}
      <div className="absolute bottom-[16%] left-[28%] animate-float-slow text-emerald-400/50 font-mono text-xs font-bold">
        v_rms = √(3RT/M)
      </div>
      <div className="absolute bottom-[14%] right-[28%] animate-float-medium text-sky-400/50 font-mono text-xs font-bold">
        B = μ₀I / (2πr)
      </div>
      <div className="absolute bottom-[4%] left-[45%] animate-float-reverse text-orange-300/50 font-mono text-xs font-semibold">
        ΔG° = -RT·ln(K_eq)
      </div>
      <div className="absolute bottom-[2%] right-[38%] animate-float-slow text-cyan-300/45 font-mono text-xs">
        f_beat = |f₁ - f₂|
      </div>

      {/* QUADRANT 8: BOTTOM RIGHT */}
      <div className="absolute bottom-[26%] right-[2%] animate-float-medium text-sky-400/55 font-mono text-sm font-bold">
        ℏ = h/(2π) = 1.054×10⁻³⁴
      </div>
      <div className="absolute bottom-[20%] right-[11%] animate-float-slow text-cyan-300/50 font-mono text-xs font-bold">
        ∇ · B = 0 (No Monopoles)
      </div>
      <div className="absolute bottom-[14%] right-[1%] animate-float-reverse text-amber-300/50 font-mono text-xs">
        σ = √[∑(x - μ)² / N]
      </div>
      <div className="absolute bottom-[8%] right-[11%] animate-float-slow text-sky-300/50 font-mono text-xs font-bold">
        Φ = ∮ E · dA = Q_enc / ε₀
      </div>
      <div className="absolute bottom-[2%] right-[2%] animate-float-medium text-slate-400/50 font-mono text-xs">
        k_B = 1.3806×10⁻²³ J/K
      </div>
      </div>

      {/* Ambient Pulsing Light Flares */}
      <div className="absolute top-[25%] left-[20%] w-80 h-80 rounded-full bg-sky-500/10 blur-[110px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-[55%] right-[20%] w-96 h-96 rounded-full bg-[#0072BC]/15 blur-[130px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[15%] left-[30%] w-72 h-72 rounded-full bg-[#32489f]/15 blur-[100px] pointer-events-none animate-pulse-slow" />
    </div>
  );
};

export default SciBackground;
