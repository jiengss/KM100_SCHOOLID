import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Scan, 
  Camera, 
  Keyboard, 
  CheckCircle2, 
  LogOut, 
  LogIn, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  PhoneCall, 
  ArrowRight,
  UserCheck,
  RefreshCw,
  Radio,
  Volume2,
  Maximize2,
  Minimize2,
  Building2,
  DoorOpen,
  Award,
  Calendar,
  Layers,
  ChevronDown,
  Activity
} from 'lucide-react';
import { playSuccessChime, playDepartureChime, playAlertBuzzer, speakGreeting } from '../lib/audioEffects';

export default function KioskDisplay({
  students,
  logs,
  onScanId,
  scanMode,
  setScanMode,
  onOpenCamera,
  onOpenManual,
  soundEnabled,
  lastScanResult,
  onResetScanResult,
  isFullscreen,
  onToggleFullscreen
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState(5);
  const [selectedGate, setSelectedGate] = useState('Main Gate - Entrance Turnstile');

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss countdown
  useEffect(() => {
    if (!lastScanResult) return;

    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onResetScanResult();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lastScanResult, onResetScanResult]);

  // Audio & celebration
  useEffect(() => {
    if (!lastScanResult) return;

    if (lastScanResult.success && lastScanResult.student) {
      if (lastScanResult.logType === 'IN') {
        if (soundEnabled) {
          playSuccessChime();
          speakGreeting(`Welcome to school, ${lastScanResult.student.first_name}!`);
        }
        try {
          confetti({
            particleCount: 65,
            spread: 70,
            origin: { y: 0.58 }
          });
        } catch (e) {}
      } else {
        if (soundEnabled) {
          playDepartureChime();
          speakGreeting(`Goodbye, ${lastScanResult.student.first_name}. Have a safe trip home!`);
        }
      }
    } else if (lastScanResult.error) {
      if (soundEnabled) {
        playAlertBuzzer();
        speakGreeting('Unrecognized ID. Please check with the gate guard.');
      }
    }
  }, [lastScanResult, soundEnabled]);

  // Attendance stats
  const totalInToday = logs.filter(l => l.log_type === 'IN').length;
  const totalOutToday = logs.filter(l => l.log_type === 'OUT').length;
  const insideCampusNow = Math.max(0, totalInToday - totalOutToday);

  return (
    <div className={`flex-1 flex flex-col gap-5 p-3 sm:p-6 w-full ${isFullscreen ? 'max-w-none bg-darkbg-950 min-h-screen justify-between' : 'max-w-7xl mx-auto'}`}>
      {/* ============================================================== */}
      {/* TOP GATE HEADER & LIVE STATUS BAR                              */}
      {/* ============================================================== */}
      <div className="glass-panel-glow rounded-3xl p-3.5 sm:p-5 flex flex-wrap items-center justify-between gap-3 sm:gap-4 relative overflow-hidden transition-all">
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-80" />

        {/* Institution Brand & Gate Station */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-darkbg-950 p-1 border-2 border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.25)] flex items-center justify-center transition-transform active:scale-95">
              <img
                src="/km100-logo.png"
                alt="KM100 Seal"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-400 rounded-full border-2 border-darkbg-950 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-xs sm:text-base md:text-xl font-extrabold text-white tracking-tight uppercase truncate">
                KM100 Skills & Training Center
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                GATE ONLINE
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden xs:inline">Station:</span>
              <div className="relative inline-block max-w-[200px] xs:max-w-none">
                <select
                  value={selectedGate}
                  onChange={(e) => setSelectedGate(e.target.value)}
                  className="w-full appearance-none bg-darkbg-950/80 border border-slate-700/80 hover:border-orange-500/50 text-orange-300 text-[11px] sm:text-xs rounded-xl pl-2.5 sm:pl-3 pr-6 sm:pr-7 py-0.5 sm:py-1 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-inner transition truncate"
                >
                  <option value="Main Gate - Entrance Turnstile">Main Gate - Entrance Turnstile</option>
                  <option value="Main Gate - Pedestrian Lane">Main Gate - Pedestrian Lane</option>
                  <option value="Gate 2 - Senior High Entrance">Gate 2 - Senior High Entrance</option>
                  <option value="Campus Exit Gate">Campus Exit Gate</option>
                </select>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Live Clock, Mode Switcher & Gate TV Mode */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end ml-auto flex-wrap">
          {/* Live High-Contrast Clock */}
          <div className="flex items-center gap-2 bg-darkbg-950/90 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-slate-800 shadow-inner">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 animate-pulse" />
            <div className="text-right">
              <div className="text-sm sm:text-lg md:text-xl font-black font-mono-id tracking-tight text-white leading-none">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">
                {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Gate Monitor TV Fullscreen Mode */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen TV Monitor" : "Launch Fullscreen Gate TV Monitor"}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-2xl bg-darkbg-850 hover:bg-darkbg-800 text-white text-xs font-bold border border-slate-700/80 hover:border-orange-500/40 transition-all shadow-md group active:scale-95"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 group-hover:scale-110 transition" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 group-hover:scale-110 transition" />
            )}
            <span className="hidden sm:inline font-mono">
              {isFullscreen ? 'Exit TV Mode' : 'Gate TV Mode'}
            </span>
          </button>

          {/* Mode Selector - Responsive grid on mobile, flex on desktop */}
          <div className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center gap-1 bg-darkbg-950 p-1 sm:p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setScanMode('IN')}
              title="Lock to Entrance Time-In"
              className={`px-2 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 ${
                scanMode === 'IN'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Time In</span>
            </button>
            <button
              onClick={() => setScanMode('OUT')}
              title="Lock to Exit Time-Out"
              className={`px-2 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 ${
                scanMode === 'OUT'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25 ring-1 ring-orange-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Time Out</span>
            </button>
            <button
              onClick={() => setScanMode('AUTO')}
              title="Auto Toggle based on previous record"
              className={`px-2 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all duration-200 text-center active:scale-95 ${
                scanMode === 'AUTO'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Auto In/Out
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MAIN SCREEN BODY: Central Gate Kiosk + Headcount / Live Stream */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* ============================================================ */}
        {/* LEFT / CENTER: PRIMARY MAIN GATE SCANNER SCREEN              */}
        {/* ============================================================ */}
        <div className="flex-1 min-h-[500px] glass-panel-glow rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl bg-tech-grid">
          {/* AMBIENT HOLOGRAPHIC KM100 WATERMARK (CIRCULAR FEATHERED, NO SQUARE CORNERS) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
            {/* Concentric Ambient Rings */}
            <div className="absolute w-[440px] sm:w-[560px] h-[440px] sm:h-[560px] rounded-full border border-orange-500/10 pointer-events-none animate-[spin_80s_linear_infinite]" />
            <div className="absolute w-[320px] sm:w-[400px] h-[320px] sm:h-[400px] rounded-full border border-dashed border-amber-500/15 pointer-events-none animate-[spin_50s_linear_infinite_reverse]" />
            
            {/* Circular Feathered Logo Watermark */}
            <div className="w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full overflow-hidden opacity-[0.06] filter grayscale contrast-125 [mask-image:radial-gradient(circle_at_center,black_40%,transparent_72%)] pointer-events-none">
              <img
                src="/km100-logo.png"
                alt="KM100 Watermark"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>

          {/* Soft ambient lighting radial highlights */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {lastScanResult ? (
            /* ======================================================== */
            /* STATE A: ACTIVE TAP RESULT (VERIFIED STUDENT BADGE)      */
            /* ======================================================== */
            lastScanResult.success && lastScanResult.student ? (
              <div className="w-full max-w-xl animate-scale-in flex flex-col items-center text-center relative z-10">
                {/* Gate Verification Top Status Banner */}
                <div
                  className={`w-full py-2.5 sm:py-3.5 px-3.5 sm:px-5 rounded-2xl flex items-center justify-between mb-4 sm:mb-5 border-2 shadow-2xl backdrop-blur-xl ${
                    lastScanResult.logType === 'IN'
                      ? 'bg-emerald-950/85 border-emerald-400/60 text-emerald-200 shadow-emerald-950/40'
                      : 'bg-orange-950/85 border-orange-400/60 text-orange-200 shadow-orange-950/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div
                      className={`p-1.5 sm:p-2 rounded-xl text-slate-950 font-black shadow-md flex-shrink-0 ${
                        lastScanResult.logType === 'IN' ? 'bg-emerald-400' : 'bg-orange-400'
                      }`}
                    >
                      {lastScanResult.logType === 'IN' ? (
                        <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-black text-xs sm:text-sm uppercase tracking-wider block truncate">
                        {lastScanResult.logType === 'IN' ? 'CAMPUS ENTRY VERIFIED' : 'CAMPUS EXIT VERIFIED'}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium truncate block">
                        {selectedGate}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs sm:text-sm font-black bg-black/60 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl border border-white/10 text-white shadow-inner flex-shrink-0 ml-2">
                    {new Date(lastScanResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {/* Big Student Photo Frame */}
                <div className="relative mb-3 sm:mb-3.5">
                  <div
                    className={`w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48 rounded-3xl p-1.5 border-4 shadow-2xl transition-all duration-300 ${
                      lastScanResult.logType === 'IN'
                        ? 'border-emerald-400 shadow-emerald-500/30'
                        : 'border-orange-400 shadow-orange-500/30'
                    }`}
                  >
                    <img
                      src={lastScanResult.student.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"}
                      alt={lastScanResult.student.first_name}
                      className="w-full h-full object-cover rounded-2xl bg-slate-900"
                    />
                  </div>
                  <div
                    className={`absolute -bottom-2 right-1 xs:right-2 px-2.5 xs:px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xl flex items-center gap-1 sm:gap-1.5 border-2 border-slate-950 ${
                      lastScanResult.logType === 'IN'
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-orange-400 text-slate-950'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{lastScanResult.logType === 'IN' ? 'Admitted' : 'Departed'}</span>
                  </div>
                </div>

                {/* Student Full Name */}
                <h2 className="text-xl xs:text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight px-2">
                  {lastScanResult.student.first_name} {lastScanResult.student.middle_name ? lastScanResult.student.middle_name + ' ' : ''}{lastScanResult.student.last_name}
                </h2>

                {/* ID & Year Level Badge */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-2">
                  <span className="px-3 py-0.5 sm:py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[11px] sm:text-xs font-extrabold font-mono shadow-sm">
                    ID: {lastScanResult.student.school_id}
                  </span>
                  <span className="px-3 py-0.5 sm:py-1 rounded-full bg-darkbg-850 text-slate-200 border border-slate-700 text-[11px] sm:text-xs font-bold">
                    {lastScanResult.student.grade_level} • {lastScanResult.student.section}
                  </span>
                </div>

                {/* NC II Program Specialization */}
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-orange-500/20 border border-orange-500/40 text-[11px] sm:text-xs font-black text-orange-200 shadow-sm max-w-full">
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 flex-shrink-0" />
                  <span className="truncate">{lastScanResult.student.course_strand || 'Technical Vocational (NC II)'}</span>
                </div>

                {/* Guardian / Emergency Contact */}
                {lastScanResult.student.emergency_contact_phone && (
                  <div className="mt-3 sm:mt-3.5 flex items-center gap-2 text-[11px] sm:text-xs text-slate-300 bg-darkbg-950/80 px-3.5 py-1.5 sm:py-2 rounded-xl border border-slate-800 shadow-inner max-w-full">
                    <PhoneCall className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                    <span className="truncate">Emergency: <strong>{lastScanResult.student.emergency_contact_name}</strong> ({lastScanResult.student.emergency_contact_phone})</span>
                  </div>
                )}

                {/* Auto Reset Countdown Bar */}
                <div className="w-full mt-5 sm:mt-6 flex flex-col items-center gap-2">
                  <div className="w-48 sm:w-64 h-2 bg-darkbg-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-1000 ease-linear rounded-full shadow-[0_0_10px_#f97316]"
                      style={{ width: `${(countdown / 5) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={onResetScanResult}
                    className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5 mt-0.5 font-bold active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Ready for Next Student ({countdown}s)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ======================================================== */
              /* STATE B: UNREGISTERED / DENIED CARD                      */
              /* ======================================================== */
              <div className="w-full max-w-md animate-scale-in flex flex-col items-center text-center p-5 sm:p-8 bg-rose-950/60 border-2 border-rose-500/60 rounded-3xl relative z-10 shadow-[0_0_50px_rgba(244,63,94,0.3)] backdrop-blur-xl">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mb-3 sm:mb-4 animate-bounce shadow-lg">
                  <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-rose-100 tracking-tight">Access Denied: Unrecognized ID</h3>
                <p className="text-xs text-rose-300/80 mt-1 max-w-xs">
                  This card code is not registered in the KM100 database.
                </p>

                <div className="mt-4 bg-darkbg-950/90 border border-rose-500/40 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-mono text-xs sm:text-sm text-rose-300 font-bold shadow-inner">
                  Scanned Code: {lastScanResult.code}
                </div>

                <p className="text-[11px] sm:text-xs text-slate-400 mt-4">
                  Please proceed to the Guard Station or Registrar's Office for visitor clearance.
                </p>

                <button
                  onClick={onResetScanResult}
                  className="mt-5 sm:mt-6 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-rose-600/30 active:scale-95"
                >
                  Dismiss & Ready for Next
                </button>
              </div>
            )
          ) : (
            /* ======================================================== */
            /* STATE C: IDLE MAIN GATE SCANNER RADAR                    */
            /* ======================================================== */
            <div className="flex flex-col items-center text-center max-w-lg relative z-10 py-2 w-full">
              {/* Prestigious School Badge Header */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-darkbg-950/90 border border-orange-500/30 text-orange-400 text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-4 sm:mb-5 shadow-sm">
                <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400" />
                <span>KM100 Skills & Training Center, Inc.</span>
              </div>

              {/* High-Tech Optical Scanner Viewport */}
              <div className="relative mb-5 sm:mb-6">
                {/* Luminous Pulsing Radar Rings */}
                <div className="absolute -inset-3 sm:-inset-4 rounded-3xl border border-orange-500/20 animate-ping opacity-30 pointer-events-none" />
                <div className="absolute -inset-1.5 sm:-inset-2 rounded-3xl border border-dashed border-amber-500/20 pointer-events-none animate-[spin_30s_linear_infinite]" />

                {/* Scanner Housing - Fully adaptive across 320px to 4K displays */}
                <div className="w-36 h-36 xs:w-44 xs:h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-3xl bg-gradient-to-b from-darkbg-900 via-darkbg-950 to-darkbg-950 border-2 border-orange-500/50 p-3 sm:p-4 shadow-[0_0_50px_rgba(249,115,22,0.25)] flex items-center justify-center relative overflow-hidden group transition-transform duration-300">
                  {/* Cyber Corner Reticles */}
                  <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 border-t-2 border-l-2 border-orange-400 rounded-tl-sm pointer-events-none" />
                  <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 border-t-2 border-r-2 border-orange-400 rounded-tr-sm pointer-events-none" />
                  <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 border-b-2 border-l-2 border-orange-400 rounded-bl-sm pointer-events-none" />
                  <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 border-b-2 border-r-2 border-orange-400 rounded-br-sm pointer-events-none" />

                  {/* Circular Scanner Target with KM100 Seal */}
                  <div className="relative w-24 h-24 xs:w-28 xs:h-28 sm:w-34 sm:h-34 rounded-full bg-darkbg-950 border border-orange-500/40 p-1.5 sm:p-2 shadow-inner flex items-center justify-center overflow-hidden">
                    {/* Centered Circular Seal */}
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white/5">
                      <img
                        src="/km100-logo.png"
                        alt="KM100 Core"
                        className="w-full h-full object-contain rounded-full select-none"
                      />
                    </div>

                    {/* Animated Hologram Corner Reticle */}
                    <Scan className="w-12 h-12 sm:w-16 sm:h-16 text-orange-400/70 absolute z-10 pointer-events-none animate-pulse" />

                    {/* Laser Beam Sweep Line */}
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_12px_#f59e0b] animate-scan pointer-events-none z-20" />
                  </div>
                </div>

                {/* Gate Online Badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[9px] sm:text-[10px] font-black uppercase px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full border-2 border-darkbg-950 flex items-center gap-1 sm:gap-1.5 shadow-xl z-20 whitespace-nowrap">
                  <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  <span>GATE 1 • SCANNER READY</span>
                </div>
              </div>

              {/* High-Impact Headline */}
              <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase leading-snug drop-shadow-md px-2">
                TAP OR SCAN YOUR <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">SCHOOL ID</span>
              </h2>
              <p className="text-[11px] sm:text-xs md:text-sm text-slate-300 mt-2 sm:mt-2.5 max-w-md font-medium leading-relaxed drop-shadow-sm px-2">
                Present your official <span className="text-orange-300 font-bold">3" × 2" QR Badge</span> or tap your <span className="text-blue-300 font-bold">RFID Card</span> in front of the scanner reader to log campus attendance.
              </p>

              {/* Plug & Play Hardware Indicator */}
              <div className="mt-3 sm:mt-4 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-darkbg-950/90 border border-slate-800 text-[10px] sm:text-[11px] font-bold text-slate-300 flex items-center gap-2 shadow-inner max-w-full truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="truncate">Handheld Laser Barcode & 2D QR Scanner Active</span>
              </div>

              {/* Action Buttons - Fully adaptive layout */}
              <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
                <button
                  onClick={onOpenCamera}
                  className="flex-1 xs:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black transition-all shadow-lg shadow-blue-500/25 active:scale-95 hover:scale-[1.02]"
                >
                  <Camera className="w-4 h-4" />
                  <span>Open Camera</span>
                </button>

                <button
                  onClick={onOpenManual}
                  className="flex-1 xs:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-darkbg-850 hover:bg-darkbg-800 text-slate-200 text-xs font-bold border border-slate-700/80 transition shadow-sm active:scale-95 hover:scale-[1.02]"
                >
                  <Keyboard className="w-4 h-4" />
                  <span>Enter ID</span>
                </button>

                {soundEnabled && (
                  <button
                    onClick={() => {
                      playSuccessChime();
                      speakGreeting('Main gate audio verified.');
                    }}
                    title="Play audio test chime and greeting"
                    className="flex-1 xs:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-2xl bg-darkbg-950/90 hover:bg-orange-950/30 text-orange-400 hover:text-orange-300 border border-slate-800 hover:border-orange-500/40 text-xs font-bold transition shadow-sm active:scale-95"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Test Audio</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* RIGHT PANEL: CAMPUS HEADCOUNT METRICS & RECENT GATE ENTRIES  */}
        {/* ============================================================ */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="glass-panel rounded-2xl p-3 text-center border-t-2 border-t-blue-500 shadow-lg">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block truncate">Inside Campus</span>
              <span className="text-xl sm:text-2xl font-black text-blue-400 font-mono-id leading-tight">{insideCampusNow}</span>
            </div>
            <div className="glass-panel rounded-2xl p-3 text-center border-t-2 border-t-emerald-500 shadow-lg">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block truncate">Gate In</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono-id leading-tight">{totalInToday}</span>
            </div>
            <div className="glass-panel rounded-2xl p-3 text-center border-t-2 border-t-orange-500 shadow-lg">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block truncate">Gate Out</span>
              <span className="text-xl sm:text-2xl font-black text-orange-400 font-mono-id leading-tight">{totalOutToday}</span>
            </div>
          </div>

          {/* Recent Gate Entries Stream */}
          <div className="flex-1 glass-panel rounded-3xl p-3.5 sm:p-5 flex flex-col min-h-[340px] sm:min-h-[380px] shadow-2xl relative overflow-hidden transition-all">
            <div className="flex items-center justify-between pb-3 sm:pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                <DoorOpen className="w-4 h-4 text-orange-400" />
                <span>Recent Gate Entries</span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-orange-300 font-mono font-bold bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                {logs.length} logged
              </span>
            </div>

            <div className="flex-1 overflow-y-auto touch-scroll mt-3 space-y-2 pr-1 max-h-[320px] sm:max-h-[380px] lg:max-h-[460px]">
              {logs.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                  <Scan className="w-8 h-8 mb-2 opacity-40 text-orange-400" />
                  <span>No students scanned at the gate yet. Tap a 3x2" badge to begin!</span>
                </div>
              ) : (
                logs.slice(0, 15).map((log) => {
                  const student = log.student || students.find(s => s.id === log.student_id || s.school_id === log.school_id);
                  return (
                    <div
                      key={log.id}
                      className="p-2 sm:p-2.5 rounded-2xl bg-darkbg-950/70 border border-slate-800 hover:border-orange-500/40 flex items-center justify-between gap-2.5 sm:gap-3 transition-all duration-200 group hover:bg-darkbg-900/80 shadow-sm active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={student?.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                            alt={student?.first_name || 'Student'}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-700 group-hover:border-orange-400/60 transition"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate group-hover:text-orange-300 transition">
                            {student ? `${student.first_name} ${student.last_name}` : `ID: ${log.school_id}`}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {student?.course_strand ? student.course_strand.replace(' Technology (NC II)', ' Tech') : log.school_id}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0">
                        <span
                          className={`text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full ${
                            log.log_type === 'IN'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                          }`}
                        >
                          {log.log_type === 'IN' ? 'TIME IN' : 'TIME OUT'}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-mono font-medium text-slate-400 mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
