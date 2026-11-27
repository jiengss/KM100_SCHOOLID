import React, { useState, useEffect } from 'react';
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Server,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  Check
} from 'lucide-react';
import { dbService } from '../lib/supabaseClient';

export default function SupabaseConfigModal({ isOpen, onClose, onConfigSaved }) {
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (isOpen) {
      handleTestConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      const res = await dbService.testConnection();
      setTestStatus(res);
      // Fetch stats
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        const data = await healthRes.json();
        setMetrics(data);
      }
    } catch (err) {
      setTestStatus({ success: false, message: err.message || 'Connection failed' });
    } finally {
      setTesting(false);
      if (onConfigSaved) onConfigSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Database & Backend Status</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Laravel REST API & Laragon MySQL Database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 text-xs text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Self-Hosted Local Backend Active</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              The system is powered by your local <strong>Laravel</strong> application and <strong>Laragon MySQL</strong> database. No external Supabase cloud connection is needed.
            </p>
          </div>

          {/* Connection Test Result */}
          {testStatus && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
                testStatus.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
              }`}
            >
              {testStatus.success ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-bold">{testStatus.success ? 'Backend Online & Operational' : 'Connection Warning'}</p>
                <p className="mt-0.5 opacity-90">{testStatus.message}</p>
              </div>
            </div>
          )}

          {/* Backend Info Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <Server className="w-3.5 h-3.5" />
                <span>Backend Framework</span>
              </div>
              <p className="font-bold text-slate-900 dark:text-white">Laravel 13.x (PHP 8.3)</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Database Engine</span>
              </div>
              <p className="font-bold text-slate-900 dark:text-white">MySQL (Laragon: km100_schoolid)</p>
            </div>
          </div>

          {/* Live Stats */}
          {metrics && metrics.counts && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Database Records</h4>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="block text-lg font-bold text-orange-600 dark:text-orange-400">{metrics.counts.students}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Students</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="block text-lg font-bold text-blue-600 dark:text-blue-400">{metrics.counts.attendance_logs}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Attendance Logs</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-400">{metrics.counts.admins}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Admin Accounts</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Checking...' : 'Refresh Status'}</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 transition active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
