import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
  footer
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
        <div
          className={`relative transform overflow-hidden rounded-xl sm:rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidth} border border-slate-200 animate-scale-up`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 bg-slate-50/50">
            <div className="min-w-0 pr-2">
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 truncate">{title}</h3>
              {subtitle && <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 sm:p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-3.5 sm:px-6 sm:py-5 max-h-[calc(100vh-160px)] overflow-y-auto">{children}</div>

          {/* Footer (if provided) */}
          {footer && (
            <div className="flex items-center justify-end gap-2 sm:gap-3 border-t border-slate-100 bg-slate-50 px-4 py-2.5 sm:px-6 sm:py-3.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
