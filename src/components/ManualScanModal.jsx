import React, { useState } from 'react';
import { Keyboard, X, ArrowRight, UserCheck, Sparkles } from 'lucide-react';

export default function ManualScanModal({ isOpen, onClose, onScan, sampleStudents = [] }) {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onScan(inputValue.trim());
      setInputValue('');
      onClose();
    }
  };

  const handleQuickTap = (code) => {
    onScan(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 text-white font-bold">
            <Keyboard className="w-5 h-5 text-blue-400" />
            <span>Manual School ID Entry</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Type or Paste School ID Number / RFID Card Code
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g. 2024-10001 or RFID-99101"
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-base font-mono font-bold text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="absolute right-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition shadow-md shadow-blue-600/30"
              >
                <span>Tap</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Press Enter or click Tap to simulate a scanner card swipe.
            </p>
          </form>

          {/* Quick Demo Simulator */}
          {sampleStudents.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Quick Tap Test (Demo Cards)
                </span>
                <span className="text-[11px] text-slate-400">Click to test instant scan</span>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {sampleStudents.slice(0, 5).map((student) => (
                  <button
                    key={student.id}
                    onClick={() => handleQuickTap(student.school_id)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-700/50 transition group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={student.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                        alt={student.first_name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-blue-400 transition"
                      />
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-blue-300 transition">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          ID: {student.school_id} • {student.grade_level}
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
