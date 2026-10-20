import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showPulse = true }) => {
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';
  let pulse = false;

  const s = status.toLowerCase();

  if (s === 'running' || s === 'healthy' || s === 'low' || s === 'normal' || s === 'completed') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
    pulse = showPulse && (s === 'running' || s === 'normal');
  } else if (s === 'needs attention' || s === 'warning' || s === 'medium' || s === 'maintenance' || s === 'delayed') {
    bg = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
    pulse = showPulse;
  } else if (s === 'stopped' || s === 'critical' || s === 'high' || s === 'fault') {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
    pulse = showPulse;
  } else if (s === 'idle' || s === 'queued') {
    bg = 'bg-slate-100 text-slate-600 border-slate-200';
    dotColor = 'bg-slate-400';
    pulse = false;
  }

  // Display user-friendly text
  let label = status;
  if (s === 'fault') label = 'Stopped';
  if (s === 'maintenance') label = 'Needs Attention';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium'
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border ${bg} ${sizeClasses}`}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      {label}
    </span>
  );
};
