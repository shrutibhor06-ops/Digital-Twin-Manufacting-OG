import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'neutral';
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeType = 'neutral',
  color = 'blue'
}) => {
  const iconColors = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    slate: 'text-slate-600 bg-slate-50 border-slate-200'
  }[color];

  const badgeColors = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  }[badgeType];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 hover:shadow-md transition-all shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg border ${iconColors}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        {badge && (
          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${badgeColors}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1.5 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};
