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
    sm: 26,
    md: 34,
    lg: 48,
    xl: 60,
  };

  const h = heights[size];
  const w = Math.round(h * 2.116); // 1206 / 570 aspect ratio of d2b logo

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
