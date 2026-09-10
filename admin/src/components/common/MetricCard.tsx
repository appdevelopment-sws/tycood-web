import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import * as Icons from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  changePercent?: number;
  trend?: 'up' | 'down';
  description?: string;
  iconName?: string;
  iconColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  changePercent,
  trend,
  description,
  iconName,
  iconColor = 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400',
}) => {
  // Dynamically resolve icon component if specified
  const LucideIcon = iconName ? (Icons as unknown as Record<string, React.ElementType>)[iconName] : null;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90 transition-all hover:border-indigo-200 dark:hover:border-indigo-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {title}
        </span>
        {LucideIcon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconColor}`}>
            <LucideIcon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {value}
        </h3>
        {changePercent !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              trend === 'up'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-slate-700 dark:text-slate-400">{description}</p>
      )}
    </div>
  );
};
