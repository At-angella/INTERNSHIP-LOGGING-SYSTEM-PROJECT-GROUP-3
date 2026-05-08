import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full rounded-xl border border-slate-200 dark:border-slate-700 
            bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm 
            py-3 px-4 ${icon ? 'pl-12' : ''} 
            text-slate-900 dark:text-slate-100 placeholder:text-slate-400
            focus:ring-2 focus:ring-primary focus:border-transparent outline-none 
            transition-all duration-200 shadow-sm
            ${error ? 'border-secondary focus:ring-secondary' : 'hover:border-slate-300 dark:hover:border-slate-600'}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-secondary mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};
