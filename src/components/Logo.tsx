import React from 'react';

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF5A00" />
          <stop offset="100%" stopColor="#E60023" />
        </linearGradient>
        <mask id="house-mask">
          <rect width="120" height="120" fill="white" />
          {/* People cut out of the house mask */}
          <circle cx="50" cy="65" r="5" fill="black" />
          <path d="M42 80 c0 -5 4 -8 8 -8 s8 3 8 8 v5 h-16 z" fill="black" />
          
          <circle cx="35" cy="70" r="4" fill="black" />
          <path d="M29 85 c0 -4 3 -6 6 -6 s6 2 6 6 v5 h-12 z" fill="black" />
          
          <circle cx="65" cy="70" r="4" fill="black" />
          <path d="M59 85 c0 -4 3 -6 6 -6 s6 2 6 6 v5 h-12 z" fill="black" />
        </mask>
      </defs>
      
      <g>
        {/* Map Pin Base */}
        <path d="M50 20 C27.9 20 10 37.9 10 60 C10 85 50 115 50 115 C50 115 90 85 90 60 C90 37.9 72.1 20 50 20 Z" fill="url(#logo-gradient)" />
        
        {/* White House Cutout (Drawn in White, with people cut out) */}
        <path d="M50 35 L25 55 v25 h15 v-15 h20 v15 h15 V55 Z" fill="#ffffff" mask="url(#house-mask)" />
        
        {/* We want the people to be red inside the white house. Wait! The people shape allows the underlying gradient to show through! 
            Yes! Because the house mask cuts holes in the white house, the gradient from the map pin underneath will show through.
            Wait, let's verify: The map pin is drawn first. It's solid red.
            Then the house is drawn white on top. It has a mask that cuts out the people.
            So where people are cut out, the red map pin shows through. Meaning people will be red! 
            This perfectly matches the logo.
        */}
        
        {/* Wifi curves */}
        <path d="M90 25 a 40 40 0 0 1 20 20" fill="none" stroke="url(#logo-gradient)" strokeWidth="6" strokeLinecap="round" />
        <path d="M102 15 a 55 55 0 0 1 23 23" fill="none" stroke="url(#logo-gradient)" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
