import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  variant?: 'header' | 'footer' | 'admin' | 'mark-only';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'header',
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-16'
  };

  if (variant === 'mark-only') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img
          src="/guven-logo.jpg"
          alt="GÜVEN MODE"
          className={`${sizeClasses[size]} w-auto object-contain rounded-full shadow-sm`}
        />
      </div>
    );
  }

  if (variant === 'admin') {
    return (
      <Link to="/admin" className={`flex items-center gap-3 group ${className}`}>
        <img
          src="/guven-logo.jpg"
          alt="GÜVEN MODE Admin"
          className="h-10 w-10 object-contain rounded-full border border-guven-blue/20"
        />
        <div className="flex flex-col">
          <span className="font-serif text-lg font-bold tracking-widest text-guven-charcoal leading-none">
            GÜVEN
          </span>
          <span className="text-[10px] uppercase font-sans tracking-[0.25em] text-guven-blue font-semibold">
            Mode Admin
          </span>
        </div>
      </Link>
    );
  }

  if (variant === 'footer') {
    return (
      <Link to="/" className={`inline-flex flex-col items-center text-center group ${className}`}>
        <img
          src="/guven-logo.jpg"
          alt="GÜVEN MODE"
          className="h-16 w-16 object-contain rounded-full mb-3 shadow-luxury"
        />
        <span className="font-serif text-2xl font-bold tracking-[0.2em] text-guven-charcoal">
          GÜVEN
        </span>
        <span className="text-xs uppercase font-sans tracking-[0.35em] text-guven-muted mt-0.5">
          MODE
        </span>
      </Link>
    );
  }

  // Header default
  return (
    <Link to="/" className={`flex items-center gap-2.5 sm:gap-3 group ${className}`}>
      <img
        src="/guven-logo.jpg"
        alt="GÜVEN MODE Logo"
        className={`${sizeClasses[size]} w-auto object-contain rounded-full border border-guven-blue/20 transition-transform duration-300 group-hover:scale-105`}
      />
      <div className="flex flex-col">
        <span className="font-serif text-xl sm:text-2xl font-bold tracking-[0.18em] text-guven-charcoal group-hover:text-guven-blue transition-colors leading-none">
          GÜVEN
        </span>
        <span className="text-[10px] sm:text-[11px] uppercase font-sans tracking-[0.3em] text-guven-muted font-medium mt-0.5">
          MODE
        </span>
      </div>
    </Link>
  );
};
