import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, LogOut, CheckCircle2, X, HelpCircle, ShieldAlert } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  itemDetails = null, // { title, subtitle, image, tag, tagColor }
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // 'danger' | 'warning' | 'primary'
  icon: CustomIcon = null,
  isLoading = false
}) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Icon mapping according to variant
  const IconComponent = CustomIcon || (variant === 'danger' ? Trash2 : variant === 'warning' ? AlertTriangle : HelpCircle);

  // Styling maps based on variant
  const variantStyles = {
    danger: {
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      ribbon: 'from-rose-600 via-red-500 to-rose-600',
      btn: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30',
      glow: 'shadow-[0_0_50px_rgba(244,63,94,0.18)]'
    },
    warning: {
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      ribbon: 'from-amber-600 via-orange-500 to-amber-600',
      btn: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-600/30',
      glow: 'shadow-[0_0_50px_rgba(245,158,11,0.18)]'
    },
    primary: {
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      ribbon: 'from-blue-600 via-indigo-500 to-blue-600',
      btn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30',
      glow: 'shadow-[0_0_50px_rgba(59,130,246,0.18)]'
    }
  }[variant] || {
    iconBg: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
    ribbon: 'from-rose-600 to-red-600',
    btn: 'bg-rose-600 text-white',
    glow: ''
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-fade-in touch-scroll"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div 
        className={`relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl ${variantStyles.glow} flex flex-col max-h-[92vh] animate-scale-in transition-all`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
      >
        {/* Top Gradient Ribbon */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${variantStyles.ribbon} flex-shrink-0`} />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 disabled:opacity-40"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-6 flex flex-col items-center text-center">
          {/* Header Icon */}
          <div className={`w-14 h-14 rounded-2xl ${variantStyles.iconBg} border flex items-center justify-center mb-3.5 shadow-md transition-transform group-hover:scale-105`}>
            <IconComponent className="w-7 h-7" />
          </div>

          {/* Title */}
          <h3 
            id="confirmation-modal-title"
            className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase"
          >
            {title}
          </h3>

          {/* Message */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed max-w-sm">
            {message}
          </p>

          {/* Optional Item Details Card (e.g. Student / Admin details) */}
          {itemDetails && (
            <div className="w-full mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-left shadow-inner">
              {itemDetails.image && (
                <img
                  src={itemDetails.image}
                  alt={itemDetails.title}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-100 dark:bg-slate-800"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                  {itemDetails.title}
                </div>
                {itemDetails.subtitle && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {itemDetails.subtitle}
                  </div>
                )}
              </div>
              {itemDetails.tag && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex-shrink-0 border ${
                  itemDetails.tagColor === 'amber'
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400'
                    : itemDetails.tagColor === 'emerald'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                    : 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400'
                }`}>
                  {itemDetails.tag}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 transition-all active:scale-95 disabled:opacity-40"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 ${variantStyles.btn}`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <IconComponent className="w-4 h-4" />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
