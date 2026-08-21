import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { TableSkeleton } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

export const DataTable = ({
  columns,
  data = [],
  loading = false,
  pagination,
  onPageChange,
  onLimitChange,
  onRowClick,
  emptyTitle = 'No data available',
  emptyDescription = 'No records match your current filter criteria.',
  emptyAction,
  emptyActionLabel
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
        <TableSkeleton rows={pagination ? pagination.limit || 5 : 5} cols={columns.length} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card p-6">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs flex flex-col w-full min-w-0">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-[11px] sm:text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] sm:text-xs">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-2.5 px-3 sm:py-3.5 sm:px-4 whitespace-nowrap ${col.className || ''}`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {data.map((row, rowIdx) => (
              <tr
                key={row.id || row._id || `row-${rowIdx}`}
                onClick={(e) => {
                  if (
                    e.target.closest('button') ||
                    e.target.closest('a') ||
                    e.target.closest('input') ||
                    e.target.closest('select') ||
                    e.target.closest('[data-stop-propagation]')
                  ) {
                    return;
                  }
                  if (onRowClick) onRowClick(row, rowIdx);
                }}
                className={`transition-colors duration-150 group ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-brand-50/40 hover:shadow-xs'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`py-2.5 px-3 sm:py-3.5 sm:px-4 ${col.cellClassName || ''}`}>
                    {col.render ? col.render(row, rowIdx) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 px-3 py-2.5 sm:px-4 sm:py-3 border-t border-slate-100 bg-slate-50/50 text-[10px] sm:text-xs text-slate-500">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span>Show</span>
            <select
              value={pagination.limit}
              onChange={(e) => onLimitChange && onLimitChange(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries &bull; {pagination.total} records</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange && onPageChange(1)}
              disabled={pagination.page <= 1}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-2 py-0.5 font-semibold text-slate-800 bg-white border border-slate-200 rounded text-[10px] sm:text-xs">
              {pagination.page} / {pagination.totalPages || 1}
            </span>

            <button
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page >= (pagination.totalPages || 1)}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPageChange && onPageChange(pagination.totalPages || 1)}
              disabled={pagination.page >= (pagination.totalPages || 1)}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
