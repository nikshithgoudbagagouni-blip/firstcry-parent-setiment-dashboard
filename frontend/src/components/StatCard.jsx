import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, change, trend, color = 'indigo' }) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20',
      glow: 'shadow-indigo-500/5'
    },
    teal: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/20',
      glow: 'shadow-cyan-500/5'
    },
    rose: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      glow: 'shadow-rose-500/5',
      animate: 'animate-pulse'
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      glow: 'shadow-amber-500/5'
    }
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <div className={`glass-panel p-6 flex flex-col justify-between relative overflow-hidden group ${selectedColor.glow}`}>
      {/* Decorative background glow */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${selectedColor.bg} blur-2xl group-hover:scale-125 transition-transform duration-300`} />

      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            {title}
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${selectedColor.bg} ${selectedColor.border} ${selectedColor.text} ${selectedColor.animate || ''}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {change && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          {trend === 'up' && (
            <span className="flex items-center gap-0.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <TrendingUp className="h-3 w-3" /> {change}
            </span>
          )}
          {trend === 'down' && (
            <span className="flex items-center gap-0.5 text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
              <TrendingDown className="h-3 w-3" /> {change}
            </span>
          )}
          {trend === 'neutral' && (
            <span className="text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              {change}
            </span>
          )}
          <span className="text-slate-500 font-medium">vs last month</span>
        </div>
      )}
    </div>
  );
}
