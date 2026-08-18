import React from 'react';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-brand-200 border-t-brand-600 animate-spin`}
      />
      {text && <p className="mt-3 text-xs font-medium text-slate-500">{text}</p>}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="h-8 bg-slate-200 rounded-lg w-full mb-4"></div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="h-5 bg-slate-100 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
};
