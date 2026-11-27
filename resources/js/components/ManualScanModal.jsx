import React, { useState } from 'react';
import { Keyboard, X, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
import { getSafePhotoUrl, handleImageError } from '../lib/driveHelper';

export default function ManualScanModal({ isOpen, onClose, onScan, onScanSubmit, sampleStudents = [] }) {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleScanTrigger = (val) => {
    const callback = onScanSubmit || onScan;
    if (callback && typeof callback === 'function') {
      callback(val);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = inputValue.trim();
    if (clean) { 
      handleScanTrigger(clean);
      setInputValue('');
      onClose();
    }
  };

  const handleQuickTap = (code) => {
    handleScanTrigger(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in touch-scroll">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
            <Keyboard className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <span className="text-sm font-bold">Manual School ID Entry</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto touch-scroll">
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
              Type or Paste School ID Number / RFID Card Code
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter Student ID or tap RFID card..."
                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 focus:border-blue-500 rounded-xl pl-3.5 sm:pl-4 pr-20 py-2.5 sm:py-3 text-sm sm:text-base font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition shadow-inner"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="absolute right-2 px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-md shadow-blue-600/30 active:scale-95"
              >
                <span>Tap</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Press Enter or click Tap to simulate a scanner card swipe.
            </p>
          </form>

          {/* Quick Demo Simulator */}
          {sampleStudents.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  Quick Tap Registered Students
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">Click to test instant scan</span>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto touch-scroll pr-1">
                {sampleStudents.slice(0, 5).map((student) => (
                  <button
                    key={student.id}
                    onClick={() => handleQuickTap(student.school_id)}
                    className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 dark:bg-slate-950/60 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/50 transition group text-left active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <img
                        src={getSafePhotoUrl(student.photo_url, 120)}
                        alt={student.first_name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover:border-blue-400 transition bg-slate-100 dark:bg-slate-800"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                      />
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[180px] sm:max-w-xs">
                          ID: {student.school_id} {student.course_strand ? `• ${student.course_strand}` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-blue-400 group-hover:translate-x-0.5 transition flex items-center gap-1">
                      Tap <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
