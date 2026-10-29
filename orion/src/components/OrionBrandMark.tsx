import React from 'react';

interface OrionBrandMarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export function OrionBrandMark({ className = '', size = 'md', showSubtitle = true }: OrionBrandMarkProps) {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 36 : 28;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Precision Astronomical Mark */}
      <div 
        className="relative flex items-center justify-center shrink-0 rounded-lg bg-[#35473C] text-[#F6F5F0] shadow-sm"
        style={{ width: iconSize, height: iconSize }}
        aria-hidden="true"
      >
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          className="w-full h-full p-1"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Orbital Ellipse */}
          <ellipse 
            cx="16" 
            cy="16" 
            rx="12" 
            ry="6" 
            transform="rotate(-25 16 16)" 
            stroke="#A88B62" 
            strokeWidth="1.25" 
            strokeDasharray="2 1.5"
          />
          {/* Central Celestial Body */}
          <circle cx="16" cy="16" r="3" fill="#F6F5F0" />
          {/* Orion Asterism Points */}
          <circle cx="11" cy="18" r="1.25" fill="#A88B62" />
          <circle cx="21" cy="14" r="1.25" fill="#A88B62" />
          {/* Cardinal Coordinate Cross */}
          <line x1="16" y1="4" x2="16" y2="7" stroke="#A88B62" strokeWidth="1" strokeLinecap="round" />
          <line x1="16" y1="25" x2="16" y2="28" stroke="#A88B62" strokeWidth="1" strokeLinecap="round" />
          <line x1="4" y1="16" x2="7" y2="16" stroke="#A88B62" strokeWidth="1" strokeLinecap="round" />
          <line x1="25" y1="16" x2="28" y2="16" stroke="#A88B62" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Typographic Identity */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold tracking-[0.25em] text-sm text-[#252923] dark:text-[#E5E9E4] uppercase">
            ORION
          </span>
          <span className="text-[9px] font-mono font-medium text-[#A88B62] uppercase tracking-wider">
            GEO·OBS
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] text-[#777B70] dark:text-[#8F998E] font-sans tracking-wide">
            Space Weather Observatory
          </span>
        )}
      </div>
    </div>
  );
}
