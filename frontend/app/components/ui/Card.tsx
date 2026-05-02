import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'panel';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'glass',
  hoverable = false,
}) => {
  const baseStyles = 'rounded-2xl overflow-hidden transition-all duration-300';
  
  const variants = {
    default: 'bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800',
    glass: 'bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg border border-white/30 dark:border-slate-700/50 shadow-lg',
    panel: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl',
  };

  const hoverStyles = hoverable ? 'hover:shadow-primary/20 hover:-translate-y-1 cursor-pointer' : '';

  return (
    <div className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
};
