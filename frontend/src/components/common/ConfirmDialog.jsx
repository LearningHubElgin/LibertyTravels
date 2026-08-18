import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // danger, warning, info
  loading = false
}) => {
  const typeStyles = {
    danger: {
      btn: 'bg-rose-600 hover:bg-rose-700 text-white',
      icon: <AlertTriangle className="w-6 h-6 text-rose-600" />,
      iconBg: 'bg-rose-50 border-rose-100'
    },
    warning: {
      btn: 'bg-amber-600 hover:bg-amber-700 text-white',
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-100'
    },
    info: {
      btn: 'bg-brand-600 hover:bg-brand-700 text-white',
      icon: <AlertTriangle className="w-6 h-6 text-brand-600" />,
      iconBg: 'bg-brand-50 border-brand-100'
    }
  };

  const style = typeStyles[type] || typeStyles.danger;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      footer={
        <>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 ${style.btn}`}
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl border shrink-0 ${style.iconBg}`}>{style.icon}</div>
        <div className="text-sm text-slate-600 leading-relaxed">{message}</div>
      </div>
    </Modal>
  );
};
