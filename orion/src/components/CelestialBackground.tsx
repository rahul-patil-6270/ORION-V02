import React from 'react';

export function CelestialBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Base celestial grid */}
      <div className="absolute inset-0 orion-celestial-grid opacity-75" />

      {/* Subtle orbital ellipses in background */}
      <svg className="absolute inset-0 w-full h-full opacity-35 dark:opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="celestial-ticks" width="100" height="100" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="6" y2="0" stroke="#A88B62" strokeWidth="0.5" opacity="0.4" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#A88B62" strokeWidth="0.5" opacity="0.4" />
          </pattern>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#celestial-ticks)" />

        {/* Large orbital ellipse */}
        <ellipse 
          cx="50%" 
          cy="48%" 
          rx="44%" 
          ry="32%" 
          fill="none" 
          stroke="#A88B62" 
          strokeWidth="0.75" 
          strokeDasharray="6 8" 
          opacity="0.3"
        />

        {/* Inner geosynchronous reference ring */}
        <ellipse 
          cx="50%" 
          cy="48%" 
          rx="26%" 
          ry="19%" 
          fill="none" 
          stroke="#777B70" 
          strokeWidth="0.5" 
          strokeDasharray="3 5" 
          opacity="0.25"
        />

        {/* Precision coordinate ticks */}
        <circle cx="50%" cy="48%" r="3" fill="#A88B62" opacity="0.4" />
        <line x1="50%" y1="10%" x2="50%" y2="86%" stroke="#777B70" strokeWidth="0.4" strokeDasharray="2 6" opacity="0.18" />
        <line x1="10%" y1="48%" x2="90%" y2="48%" stroke="#777B70" strokeWidth="0.4" strokeDasharray="2 6" opacity="0.18" />

        {/* Subtle celestial declination markings */}
        <text x="50.8%" y="16%" fill="#777B70" fontSize="8" fontFamily="monospace" opacity="0.4">+60° DEC</text>
        <text x="50.8%" y="30%" fill="#777B70" fontSize="8" fontFamily="monospace" opacity="0.4">+30° DEC</text>
        <text x="50.8%" y="50%" fill="#A88B62" fontSize="8" fontFamily="monospace" opacity="0.5">0° CELESTIAL EQUATOR (GEO)</text>
        <text x="50.8%" y="66%" fill="#777B70" fontSize="8" fontFamily="monospace" opacity="0.4">-30° DEC</text>
        <text x="82%" y="47%" fill="#777B70" fontSize="8" fontFamily="monospace" opacity="0.4">18h RA</text>
        <text x="18%" y="47%" fill="#777B70" fontSize="8" fontFamily="monospace" opacity="0.4">06h RA</text>
      </svg>
    </div>
  );
}
