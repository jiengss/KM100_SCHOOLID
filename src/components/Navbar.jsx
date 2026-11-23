import React from 'react';
import { 
  Users, 
  ClipboardList, 
  Volume2, 
  VolumeX, 
  DoorOpen, 
  Maximize2, 
  LayoutDashboard, 
  Shield, 
  ArrowRight,
  ArrowLeft,
  Building2,
  LogOut,
  UserCheck,
  Sun,
  Moon
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
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-orange-500/20 bg-white/95 dark:bg-darkbg-950/95 backdrop-blur-xl shadow-lg dark:shadow-xl transition-all duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-17 gap-2">
          {/* ======================================================== */}
          {/* BRAND & SECTOR BADGE                                     */}
          {/* ======================================================== */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white dark:bg-darkbg-950 border border-slate-200 dark:border-orange-500/30 p-1 shadow-[0_0_15px_rgba(249,115,22,0.15)] flex-shrink-0 transition-transform active:scale-95">
              <img
                src="/km100-logo.png"
                alt="KM100 Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight uppercase truncate">
                  KM100 <span className="text-orange-500 dark:text-orange-400 hidden xs:inline">Skills & Training</span>
                </h1>
                <span
                  className={`hidden xs:inline-flex text-[9px] sm:text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border shadow-sm flex-shrink-0 ${
                    currentPortal === 'admin'
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
                  }`}
                >
                  {currentPortal === 'admin' ? 'Admin' : 'Gate'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden md:block truncate">
                {currentPortal === 'admin'
                  ? 'Administration & Academic Control Suite'
                  : 'Campus Access Control & Student Entry Verification'}
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CENTER NAVIGATION: DESKTOP ONLY (md+)                    */}
          {/* ======================================================== */}
          {currentPortal === 'admin' ? (
            /* ADMIN SIDE NAVIGATION TABS - Desktop (md+) */
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-darkbg-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
              <button
                onClick={() => setAdminTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs lg:text-sm font-extrabold transition-all duration-200 active:scale-95 ${
                  adminTab === 'dashboard'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/30 ring-1 ring-orange-400/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-500 dark:text-amber-300" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setAdminTab('attendance')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs lg:text-sm font-extrabold transition-all duration-200 active:scale-95 ${
                  adminTab === 'attendance'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/30 ring-1 ring-orange-400/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
              >
                <ClipboardList className="w-4 h-4 text-orange-500 dark:text-orange-300" />
                <span>Attendance Logs</span>
              </button>

              <button
                onClick={() => setAdminTab('students')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs lg:text-sm font-extrabold transition-all duration-200 active:scale-95 ${
                  adminTab === 'students'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/30 ring-1 ring-orange-400/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4 text-blue-500 dark:text-blue-300" />
                <span>Students Directory</span>
              </button>
            </nav>
          ) : null}

          {/* ======================================================== */}
          {/* RIGHT ACTION CONTROLS & PORTAL SWITCH BUTTON             */}
          {/* ======================================================== */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Theme Toggle Button (Light / Dark Mode) */}
            <button
              onClick={onToggleTheme}
              className="flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 hover:bg-slate-200 dark:bg-darkbg-950 dark:hover:bg-darkbg-850 text-slate-700 dark:text-slate-300 shadow-sm transition active:scale-95"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-300 hover:bg-emerald-500/20 dark:hover:bg-emerald-900/60'
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800 dark:bg-darkbg-950 dark:border-slate-700/80 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title={soundEnabled ? "Click to mute audio" : "Click to enable audio"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <span className="hidden sm:inline">
                {soundEnabled ? 'Sound: ON' : 'Sound: OFF'}
              </span>
              <div
                className={`hidden sm:block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                  soundEnabled
                    ? 'bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-400'
                    : 'bg-slate-400 dark:bg-slate-600'
                }`}
              />
            </button>

            {/* If on Gate Screen: TV Mode and Switch to Admin */}
            {currentPortal === 'gate' ? (
              <>
                <button
                  onClick={onToggleFullscreen}
                  className="hidden xs:flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 dark:bg-orange-500/15 dark:hover:bg-orange-500/25 text-orange-600 dark:text-orange-300 border border-orange-500/30 text-xs font-bold transition shadow-sm active:scale-95"
                  title="Launch dedicated Fullscreen Gate Monitor on TV/display"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                  <span className="hidden sm:inline">Gate TV</span>
                </button>

                {/* SWITCH TO ADMIN SIDE BUTTON */}
                <button
                  onClick={handleAdminClick}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black transition-all shadow-lg shadow-blue-500/25 active:scale-95 hover:scale-[1.02]"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                  <ArrowRight className="w-3.5 h-3.5 hidden xs:inline" />
                </button>
              </>
            ) : (
              /* If on Admin Side: Authenticated User Badge, Logout, and Return to Main Gate */
              <>
                {currentUser && (
                  <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-black text-[11px] uppercase">
                      {currentUser.full_name?.charAt(0) || 'A'}
                    </div>
                    <div className="text-left leading-none">
                      <p className="text-[11px] font-extrabold text-slate-800 dark:text-white truncate max-w-[110px]">
                        {currentUser.full_name}
                      </p>
                      <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400">
                        {currentUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/25 text-xs font-bold transition active:scale-95"
                  title="Sign Out from Admin Suite"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                  <span className="hidden sm:inline">Logout</span>
                </button>

                <button
                  onClick={() => setCurrentPortal('gate')}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-500/25 active:scale-95 hover:scale-[1.02]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>Gate</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* MOBILE ADMIN SUB-NAVIGATION BAR (< md)                   */}
        {/* ======================================================== */}
        {currentPortal === 'admin' && (
          <div className="md:hidden py-2 border-t border-slate-200 dark:border-slate-800/80 overflow-x-auto no-scrollbar touch-scroll">
            <div className="flex items-center gap-1.5 min-w-max px-0.5">
              <button
                onClick={() => setAdminTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-95 ${
                  adminTab === 'dashboard'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/30 ring-1 ring-orange-400/40'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setAdminTab('attendance')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-95 ${
                  adminTab === 'attendance'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/30 ring-1 ring-orange-400/40'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 text-orange-500 dark:text-orange-300" />
                <span>Attendance Logs</span>
              </button>

              <button
                onClick={() => setAdminTab('students')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-95 ${
                  adminTab === 'students'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/30 ring-1 ring-orange-400/40'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-500 dark:text-blue-300" />
                <span>Students Directory</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
