import React from 'react';

export const StatCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  color = 'blue', // blue, green, amber, red, purple, teal
  loading = false
}) => {
  const colorMap = {
    blue: {
      iconBg: 'bg-brand-50 text-brand-600 border-brand-100',
      accent: 'border-l-brand-500'
    },
    green: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accent: 'border-l-emerald-500'
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      accent: 'border-l-amber-500'
    },
    red: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      accent: 'border-l-rose-500'
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      accent: 'border-l-purple-500'
    },
    teal: {
      iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
      accent: 'border-l-teal-500'
    }
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-card-hover transition-all duration-200 border-l-[3px] sm:border-l-4 ${c.accent} min-w-0 flex flex-col justify-between`}>
      <div className="flex items-start justify-between gap-1.5 sm:gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{title}</p>
          {loading ? (
            <div className="h-5 sm:h-7 w-16 sm:w-28 bg-slate-100 rounded animate-pulse mt-1 sm:mt-2"></div>
          ) : (
            <h3 className="text-xs sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1 tracking-tight font-mono truncate">{value}</h3>
          )}
        </div>
        {Icon && (
          <div className={`w-6 h-6 sm:w-11 sm:h-11 rounded-md sm:rounded-xl flex items-center justify-center border shrink-0 ${c.iconBg}`}>
            <Icon className="w-3 h-3 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
        )}
      </div>
      {subValue && (
        <div className="mt-1.5 sm:mt-3 pt-1.5 sm:pt-3 border-t border-slate-100 flex items-center text-[8.5px] sm:text-xs text-slate-500 font-medium truncate leading-tight">
          {subValue}
        </div>
      )}
    </div>
  );
};
