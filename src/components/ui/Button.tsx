import React from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'brand' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.97] cursor-pointer';

    const variants = {
      // Signature lead2b Teal Button
      primary:
        'bg-[#00838f] text-white hover:bg-[#006d77] focus:ring-[#00838f] shadow-md shadow-[#00838f]/25 border border-teal-600/30',
      brand:
        'bg-gradient-to-r from-[#00838f] to-[#0891b2] text-white hover:from-[#006d77] hover:to-[#0e7490] focus:ring-[#00838f] shadow-lg shadow-teal-700/25',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400 border border-slate-200/80',
      outline:
        'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-teal-500 shadow-2xs',
      ghost:
        'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 focus:ring-slate-400',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm',
      glass:
        'bg-white/80 backdrop-blur-md text-slate-900 border border-white/60 hover:bg-white shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[34px]',
      md: 'text-xs sm:text-sm px-4 py-2.5 gap-2 min-h-[42px]',
      lg: 'text-sm sm:text-base px-5 py-3 gap-2.5 font-bold min-h-[50px]',
      xl: 'text-base sm:text-lg px-6 py-4 gap-3 font-extrabold min-h-[58px]',
      icon: 'p-2.5 h-10 w-10 min-h-[40px]',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
