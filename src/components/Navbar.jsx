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
  UserCheck
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
  onLogout
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
    <header className="sticky top-0 z-40 border-b border-orange-500/20 bg-darkbg-950/95 backdrop-blur-xl shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-17">
          {/* ======================================================== */}
          {/* BRAND & SECTOR BADGE                                     */}
          {/* ======================================================== */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-darkbg-950 border border-orange-500/30 p-1 shadow-[0_0_15px_rgba(249,115,22,0.15)] flex-shrink-0">
              <img
                src="/km100-logo.webp"
                alt="KM100 Logo"
                className="w-full h-full object-contain"
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-darkbg-950 animate-ping" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-darkbg-950" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5 uppercase">
                  KM100 <span className="text-orange-400">Training Center</span>
                </h1>
                <span
                  className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${
                    currentPortal === 'admin'
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {currentPortal === 'admin' ? 'Admin Portal' : 'Main Gate Display'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                {currentPortal === 'admin'
                  ? 'Administration & Academic Control Suite'
                  : 'Campus Access Control & Student Entry Verification'}
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CENTER NAVIGATION: SEPARATED BY PORTAL                   */}
          {/* ======================================================== */}
          {currentPortal === 'admin' ? (
            /* ADMIN SIDE NAVIGATION TABS */
            <nav className="flex items-center gap-1 bg-darkbg-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
              <button
                onClick={() => setAdminTab('dashboard')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                  adminTab === 'dashboard'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/30 ring-1 ring-orange-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-300" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setAdminTab('attendance')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                  adminTab === 'attendance'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/30 ring-1 ring-orange-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ClipboardList className="w-4 h-4 text-orange-300" />
                <span className="hidden md:inline">Attendance Logs</span>
                <span className="md:hidden">Logs</span>
              </button>

              <button
                onClick={() => setAdminTab('students')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                  adminTab === 'students'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/30 ring-1 ring-orange-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4 text-blue-300" />
                <span className="hidden md:inline">Students Directory</span>
                <span className="md:hidden">Students</span>
              </button>
            </nav>
          ) : (
            /* MAIN GATE PUBLIC SCREEN: PURE GATE ACTIVE INDICATOR */
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-darkbg-900/80 border border-slate-800 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Turnstile Gate 1 • Campus Entrance Active
              </span>
            </div>
          )}

          {/* ======================================================== */}
          {/* RIGHT ACTION CONTROLS & PORTAL SWITCH BUTTON             */}
          {/* ======================================================== */}
          <div className="flex items-center gap-2.5">
            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                soundEnabled
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-darkbg-950 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-darkbg-850'
              }`}
              title={soundEnabled ? "Click to mute audio" : "Click to enable audio"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <span className="hidden sm:inline">
                {soundEnabled ? 'Sound: ON' : 'Sound: OFF'}
              </span>
              <div
                className={`w-2 h-2 rounded-full ${
                  soundEnabled
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse'
                    : 'bg-slate-600'
                }`}
              />
            </button>

            {/* If on Gate Screen: TV Mode and Switch to Admin */}
            {currentPortal === 'gate' ? (
              <>
                <button
                  onClick={onToggleFullscreen}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 text-xs font-bold transition shadow-sm"
                  title="Launch dedicated Fullscreen Gate Monitor on TV/display"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-orange-400" />
                  <span className="hidden sm:inline">Gate TV</span>
                </button>

                {/* SWITCH TO ADMIN SIDE BUTTON (Requires Admin Login if not authenticated) */}
                <button
                  onClick={handleAdminClick}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black transition-all shadow-lg shadow-blue-500/25 hover:scale-[1.02]"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Side</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </>
            ) : (
              /* If on Admin Side: Authenticated User Badge, Logout, and Return to Main Gate */
              <>
                {currentUser && (
                  <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 flex items-center justify-center font-black text-[11px] uppercase">
                      {currentUser.full_name?.charAt(0) || 'A'}
                    </div>
                    <div className="text-left leading-none">
                      <p className="text-[11px] font-extrabold text-white truncate max-w-[110px]">
                        {currentUser.full_name}
                      </p>
                      <span className="text-[9px] uppercase font-bold text-amber-400">
                        {currentUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/25 text-xs font-bold transition"
                  title="Sign Out from Admin Suite"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">Logout</span>
                </button>

                <button
                  onClick={() => setCurrentPortal('gate')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-500/25 hover:scale-[1.02]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>Go to Gate</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
