import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  className?: string;
  showTagline?: boolean;
}

export function Logo({ size = 'md', variant = 'light', className = '', showTagline = false }: LogoProps) {
  const heights = {
    sm: 24,
    md: 32,
    lg: 44,
    xl: 56,
  };

  const h = heights[size];
  const w = Math.round(h * 3.42); // 1024 / 299 aspect ratio

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="flex items-center gap-2">
        <Image
          src="/brand/logo.png"
          alt="lead2b - Event Lead Capture"
          width={w}
          height={h}
          className="object-contain"
          priority
        />
      </div>
      {showTagline && (
        <span className={`text-[10px] tracking-wider uppercase font-semibold mt-0.5 ${
          variant === 'dark' ? 'text-cyan-400' : 'text-slate-500'
        }`}>
          Event Lead Capture Platform
        </span>
      )}
    </div>
  );
}
