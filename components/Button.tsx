import React from 'react';
import { Theme } from '../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
  theme?: Theme;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon,
  className = '',
  disabled,
  theme = 'DEFAULT',
  ...props 
}) => {
  const isGds = theme === 'GDS';

  const baseStyles = isGds
    ? "inline-flex items-center justify-center gap-2 px-4 py-2 font-normal transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#ffdd00] focus:ring-offset-2 focus:ring-offset-[#0b0c0c] disabled:opacity-50 disabled:cursor-not-allowed text-base font-sans"
    : "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: isGds 
      ? "bg-[#00703c] hover:bg-[#005a30] text-white shadow-[0_2px_0_#002d18] mb-[2px] active:shadow-none active:translate-y-[2px] active:mb-0"
      : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 focus:ring-blue-500",
    
    secondary: isGds
      ? "bg-[#f3f2f1] text-[#0b0c0c] hover:bg-[#e4e2e0] shadow-[0_2px_0_#b1b4b6] mb-[2px] active:shadow-none active:translate-y-[2px] active:mb-0"
      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-200",
    
    danger: isGds
      ? "bg-[#d4351c] text-white hover:bg-[#a31c12] shadow-[0_2px_0_#6b0f0a] mb-[2px] active:shadow-none active:translate-y-[2px] active:mb-0"
      : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 focus:ring-red-500",
    
    ghost: isGds
      ? "bg-transparent text-[#1d70b8] underline hover:text-[#003078]"
      : "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon}
      {children}
    </button>
  );
};