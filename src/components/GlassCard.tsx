import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  mirror?: boolean;
  onClick?: () => void;
  id?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hover = true,
  mirror = true,
  onClick,
  id
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        bg-[#131926]/80 backdrop-blur-xl
        border-t border-white/[0.14] border-l border-white/[0.08]
        border-r border-white/[0.05] border-b border-white/[0.04]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_rgba(0,0,0,0.45)]
        ${hover ? 'hover:border-white/25 hover:shadow-[0_12px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(0,114,188,0.12)] hover:-translate-y-0.5' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-300
        ${className}
      `}
    >
      {mirror && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0">
          {/* Top Specular Mirror Line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          {/* Diagonal Mirror Shine Sweep */}
          <div className="absolute inset-0 animate-mirror-shine bg-gradient-to-br from-transparent via-white/[0.02] to-transparent" />
          {/* Bottom subtle ambient gradient (dark mode only) */}
          <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/20 dark:from-black/20 from-transparent opacity-0 dark:opacity-100 pointer-events-none" />
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
