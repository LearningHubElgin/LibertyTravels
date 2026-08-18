import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  breadcrumbs
}) => {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-2.5 sm:gap-4 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
      <div className="min-w-0">
        {breadcrumbs && (
          <nav className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 font-medium mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'text-slate-700 font-semibold' : ''}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {Icon && (
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-xs shrink-0">
              <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2]" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-sm sm:text-xl font-bold text-slate-900 tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitle}</p>}
          </div>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">{actions}</div>}
    </div>
  );
};
