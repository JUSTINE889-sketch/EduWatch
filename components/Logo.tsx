
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`${sizes[size]} ${className} flex items-center justify-center transition-transform hover:scale-105 duration-300`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full filter drop-shadow-sm">
        <defs>
          <linearGradient id="eduWatchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Shield Shape */}
        <path 
          d="M50 5 L15 22 C15 22 15 55 50 95 C85 55 85 22 85 22 L50 5 Z" 
          fill="url(#eduWatchGrad)" 
        />
        
        {/* Book/Pages detail (Inner 'E') */}
        <path 
          d="M35 35 H65 V42 H45 V48 H60 V55 H45 V62 H65 V70 H35 V35 Z" 
          fill="white" 
          fillOpacity="0.85"
        />
        
        {/* Protective Dot / AI Node */}
        <circle 
          cx="50" cy="22" r="6" 
          fill="#60a5fa" 
          filter="url(#glow)"
        />
        
        {/* Subtle Bottom Accent */}
        <path 
          d="M40 80 Q50 85 60 80" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeOpacity="0.4"
        />
      </svg>
    </div>
  );
};

export default Logo;
