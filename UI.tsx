import React from 'react';

export const Button: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}> = ({ onClick, children, variant = 'primary', className = '', disabled = false, icon }) => {
  const baseStyles = "inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 border border-indigo-500/50",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30",
    ghost: "hover:bg-white/5 text-slate-400 hover:text-white"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; type?: 'success' | 'info' }> = ({ children, type = 'info' }) => {
  const colors = type === 'success' 
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors}`}>
      {children}
    </span>
  );
};

export const Spinner: React.FC = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
