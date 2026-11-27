import React from 'react';
import { 
  Users, 
  ClipboardList, 
  Maximize2, 
  LayoutDashboard, 
  Shield, 
  ArrowRight,
  LogOut, 
  Sun, 
  Moon, 
  Briefcase 
} from 'lucide-react';
import { playScannerBeep } from '../lib/audioEffects';

export default function Navbar({ 
  currentPortal, 
  setCurrentPortal, 
  adminTab, 
  setAdminTab, 
  soundEnabled, 
  setSoundEnabled, 
  onToggleFullscreen,
  currentUser,
  onOpenAdminLogin,
  onLogout,
  theme = 'dark',
  onToggleTheme
}) {
  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (nextState) {
      playScannerBeep();
    }
  };

  const handleAdminClick = () => {
    if (currentUser) {
      setCurrentPortal('admin');
    } else {
      onOpenAdminLogin();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0c121e] border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200">
      {/* ======================================================== */}
      {/* MAIN NAVBAR                                              */}
      {/* ======================================================== */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-shrink-0">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white p-0.5 border border-slate-200 dark:border-slate-700 shadow-xs flex-shrink-0">
              <img
                src="/km100-logo.png"
                alt="KM100 Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  KM<span className="text-[#f97316]">100</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  {currentPortal === 'admin' ? 'Admin Portal' : 'Access Gate'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden md:block truncate">
                Skills and Training Center, Inc.
              </p>
            </div>
          </div>

          {/* Navigation Links: Admin Tabs (Desktop) */}
          {currentPortal === 'admin' ? (
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-900/90 p-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-inner">
              <button
                onClick={() => setAdminTab('dashboard')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  adminTab === 'dashboard'
                    ? 'bg-slate-900 text-white dark:bg-[#f97316] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setAdminTab('attendance')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  adminTab === 'attendance'
                    ? 'bg-slate-900 text-white dark:bg-[#f97316] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Attendance Logs</span>
              </button>

              <button
                onClick={() => setAdminTab('students')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  adminTab === 'students'
                    ? 'bg-slate-900 text-white dark:bg-[#f97316] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Students Directory</span>
              </button>

              <button
                onClick={() => setAdminTab('staff')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  adminTab === 'staff'
                    ? 'bg-slate-900 text-white dark:bg-[#f97316] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Faculty & Staff</span>
              </button>
            </nav>
          ) : (
            /* Gate Kiosk Status Indicator */
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Campus Gate Monitoring Active</span>
            </div>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={onToggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-xs transition active:scale-95"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Portal Actions */}
            {currentPortal === 'gate' ? (
              <>
                <button
                  onClick={onToggleFullscreen}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-95 shadow-xs"
                  title="Launch Gate Kiosk on TV monitor"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Gate TV</span>
                </button>

                {/* Primary Orange CTA button matching KM100 "Pre-Register Now" button */}
                <button
                  onClick={handleAdminClick}
                  className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold transition shadow-sm shadow-orange-500/25 active:scale-95"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </button>
              </>
            ) : (
              <>
                {/* User avatar badge */}
                {currentUser && (
                  <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <div className="w-5 h-5 rounded-full bg-[#f97316] text-white flex items-center justify-center text-[10px] font-black uppercase">
                      {currentUser.full_name?.charAt(0) || 'A'}
                    </div>
                    <span className="truncate max-w-[90px]">{currentUser.full_name}</span>
                  </div>
                )}

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-900 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-bold transition active:scale-95 shadow-xs"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar (< md) */}
        {currentPortal === 'admin' && (
          <div className="md:hidden py-2 border-t border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max px-0.5">
              <button
                onClick={() => setAdminTab('dashboard')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  adminTab === 'dashboard'
                    ? 'bg-slate-900 text-white dark:bg-[#f97316] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setAdminTab('attendance')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  adminTab === 'attendance'
                    ? 'bg-slate-900 text-white dark:bg-[#f97316] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Attendance Logs</span>
              </button>

              <button
                onClick={() => setAdminTab('students')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  adminTab === 'students'
                    ? 'bg-slate-900 text-white dark:bg-[#f97316] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Students</span>
              </button>

              <button
                onClick={() => setAdminTab('staff')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  adminTab === 'staff'
                    ? 'bg-slate-900 text-white dark:bg-[#f97316] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Faculty & Staff</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
