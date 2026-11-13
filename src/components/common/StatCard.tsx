import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    text: string;
    positive?: boolean;
  };
  color?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'slate',
}) => {
  const iconBgStyles = {
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        {icon && (
          <div className={`p-2 rounded-lg ${iconBgStyles[color]} shrink-0`}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">{value}</p>
        {(subtitle || trend) && (
          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
            {trend && (
              <span className={`font-medium ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend.text}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
