'use client';
import React from 'react';

interface StatusbarProps {
  status?: string;
  progress?: number;
  label?: string;
  color?: string;
}

export function Statusbar({ status, progress, label, color = 'bg-primary' }: StatusbarProps) {
  if (status) {
    const getStatusStyles = () => {
      switch (status) {
        case 'SUBMITTED': 
          return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
        case 'REVIEWED': 
          return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
        case 'APPROVED': 
          return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
        case 'REJECTED': 
          return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50';
        case 'REVISE':
          return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50';
        default: 
          return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      }
    };

    const displayLabel = status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ');

    return (
      <span className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getStatusStyles()}`}>
        {displayLabel}
      </span>
    );
  }
  
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
          <span className="text-xs font-bold text-slate-900 dark:text-white">{progress}%</span>
        </div>
      )}
      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${progress || 0}%` }}
        />
      </div>
    </div>
  );
}
