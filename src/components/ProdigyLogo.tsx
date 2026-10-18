import React from 'react';

export interface ProdigyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  withTagline?: boolean;
  taglineText?: string;
}

/**
 * Precision-Crafted Narayana Prodigy Brand Identity
 * Featuring the authentic Narayana arch monogram on royal blue gradient badge
 * with vibrant orange sun/torch crest and balanced typography.
 */
export const ProdigyLogo: React.FC<ProdigyLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  withTagline = false,
  taglineText = 'Olympiad & Academic Hub'
}) => {
  const config = {
    sm: {
      box: 'w-7 h-7',
      textSize: 'text-xs',
      prodigySize: 'text-xs',
      gap: 'gap-2',
      taglineSize: 'text-[8px]',
      rounded: 'rounded-lg',
      p: 'p-1'
    },
    md: {
      box: 'w-9 h-9',
      textSize: 'text-sm',
      prodigySize: 'text-sm',
      gap: 'gap-2.5',
      taglineSize: 'text-[9px]',
      rounded: 'rounded-xl',
      p: 'p-1.5'
    },
    lg: {
      box: 'w-11 h-11',
      textSize: 'text-lg',
      prodigySize: 'text-lg',
      gap: 'gap-3',
      taglineSize: 'text-[10px]',
      rounded: 'rounded-xl',
      p: 'p-2'
    },
    xl: {
      box: 'w-14 h-14',
      textSize: 'text-2xl',
      prodigySize: 'text-2xl',
      gap: 'gap-3.5',
      taglineSize: 'text-xs',
      rounded: 'rounded-2xl',
      p: 'p-2.5'
    }
  }[size];

  return (
    <div className={`inline-flex items-center ${config.gap} select-none ${className}`}>
      {/* Official Narayana Royal Blue Emblem with Orange Torch Accent */}
      <div
        className={`
          ${config.box} ${config.rounded} ${config.p}
          bg-gradient-to-br from-[#003d73] via-[#005a9e] to-[#0072bc]
          border border-sky-400/30
          shadow-[0_2px_10px_rgba(0,114,188,0.35)]
          flex items-center justify-center flex-shrink-0
          transition-transform hover:scale-105
        `}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Narayana Royal Arch Monogram in Crisp White */}
          <path
            d="M8 32V12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12V32"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M16 18C16 14.6863 18.6863 12 22 12C25.3137 12 28 14.6863 28 18V32"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Crossbeam Connection */}
          <line
            x1="8"
            y1="32"
            x2="28"
            y2="32"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Narayana Orange Beacon / Sun Emblem */}
          <circle cx="33" cy="9" r="4" fill="#F37021" />
          <path
            d="M33 3V5M33 13V15M27 9H29M37 9H39"
            stroke="#F37021"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Balanced Corporate Identity Typography */}
      {showText && (
        <div className="flex flex-col justify-center text-left leading-none">
          <div className="flex items-center gap-1.5 font-grotesk tracking-wider font-extrabold uppercase">
            <span className={`text-white ${config.textSize}`}>
              NARAYANA
            </span>
            <span className={`text-[#38bdf8] font-black ${config.prodigySize} drop-shadow-sm`}>
              PRODIGY
            </span>
          </div>
          {withTagline ? (
            <span className={`font-manrope font-semibold text-slate-400 tracking-wider uppercase mt-1 ${config.taglineSize}`}>
              {taglineText}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
};

export const NptrLogo = ProdigyLogo;
export default ProdigyLogo;
