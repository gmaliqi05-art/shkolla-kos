import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'teal' | 'amber' | 'rose' | 'green' | 'cyan' | 'slate';
  trend?: { value: string; positive: boolean };
}

const COLOR_MAP = {
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-500', text: 'text-blue-600' },
  teal: { bg: 'bg-teal-50', icon: 'bg-teal-500', text: 'text-teal-600' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-600' },
  rose: { bg: 'bg-rose-50', icon: 'bg-rose-500', text: 'text-rose-600' },
  green: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-600' },
  cyan: { bg: 'bg-cyan-50', icon: 'bg-cyan-500', text: 'text-cyan-600' },
  slate: { bg: 'bg-slate-50', icon: 'bg-slate-500', text: 'text-slate-600' },
};

export default function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.positive ? '+' : ''}{trend.value}
            </p>
          )}
        </div>
        <div className={`${c.bg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${c.text}`} />
        </div>
      </div>
    </div>
  );
}
