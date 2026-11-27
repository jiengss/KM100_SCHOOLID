import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import KioskDisplay from './components/KioskDisplay';
import AdminDashboard from './components/AdminDashboard';
import AttendanceLogView from './components/AttendanceLogView';
import StudentManager from './components/StudentManager';
import StaffManager from './components/StaffManager';
import CameraScannerModal from './components/CameraScannerModal';
import ManualScanModal from './components/ManualScanModal';
import StudentIdCardModal from './components/StudentIdCardModal';
import SupabaseConfigModal from './components/SupabaseConfigModal';
import AdminAuthModal from './components/AdminAuthModal';
import ConfirmationModal from './components/ConfirmationModal';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { dbService, getStoredSupabaseConfig, adminAuthService } from './lib/supabaseClient';
import { Shield, Lock, LogOut, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function App() {
  // Administrator Auth State (restored from localStorage session)
  const [currentUser, setCurrentUser] = useState(() => adminAuthService.getCurrentUser());
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  // Portal separation: 'gate' (Main Gate Entrance Screen) vs 'admin' (Admin Suite)
  // Restores last active portal if user is logged in, preventing auto-logout on page refresh
  const [currentPortal, setCurrentPortal] = useState(() => {
    const savedUser = adminAuthService.getCurrentUser();
    const savedPortal = localStorage.getItem('km100_current_portal');
    if (savedUser && savedPortal) {
      return savedPortal;
    }
    if (savedUser) {
      return 'admin';
    }
    return 'gate';
  });

  // Admin sub-navigation: 'dashboard', 'attendance', 'students', 'staff'
  const [adminTab, setAdminTab] = useState(() => {
    const savedTab = localStorage.getItem('km100_admin_tab');
    return savedTab || 'dashboard';
  });

  // Persist portal state across browser reloads
  useEffect(() => {
    if (currentPortal) {
      localStorage.setItem('km100_current_portal', currentPortal);
    }
  }, [currentPortal]);

  // Persist admin active tab across browser reloads
  useEffect(() => {
    if (adminTab) {
      localStorage.setItem('km100_admin_tab', adminTab);
    }
  }, [adminTab]);

  // Theme Mode: 'dark' (default for cyber kiosk) or 'light'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('km100_theme');
    return saved ? saved : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('km100_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanMode, setScanMode] = useState('AUTO'); // 'AUTO', 'IN', 'OUT'

  // Data States
  const [students, setStudents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active Scan Result state for Kiosk screen
  const [lastScanResult, setLastScanResult] = useState(null);
  const [isGateFullscreen, setIsGateFullscreen] = useState(false);

  // Sync fullscreen change with Esc key
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsGateFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    setCurrentPortal('gate');
    if (!isGateFullscreen) {
      setIsGateFullscreen(true);
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => { });
      }
    } else {
      setIsGateFullscreen(false);
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      }
    }
  };

  // Modals
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Authentication Handlers
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setCurrentPortal('admin');
    localStorage.setItem('km100_current_portal', 'admin');
  };

  const handleLogout = () => {
    setIsLoggingOut(true);

    // Subtle audio cue on sign out
    if (soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch (e) {}
    }

    // Smooth cinematic transition: 600ms display, then reveal Kiosk
    setTimeout(() => {
      adminAuthService.logout();
      setCurrentUser(null);
      setCurrentPortal('gate');
      setAdminTab('dashboard');
      localStorage.setItem('km100_current_portal', 'gate');
      localStorage.setItem('km100_admin_tab', 'dashboard');

      setTimeout(() => {
        setIsLoggingOut(false);
      }, 350);
    }, 650);
  };

  const handleOpenAdminLogin = () => {
    setIsAdminAuthModalOpen(true);
  };

  // Load Initial Data directly from MySQL
  const loadData = useCallback(async () => {
    try {
      const config = getStoredSupabaseConfig();
      setIsSupabaseConfigured(!!(config.url && config.anonKey));

      const [loadedStudents, loadedLogs, loadedEmployees] = await Promise.all([
        dbService.getStudents(),
        dbService.getRecentLogs(50),
        dbService.getEmployees()
      ]);
      setStudents(loadedStudents);
      setLogs(loadedLogs);
      setEmployees(loadedEmployees);
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Smart Background Polling (5 mins) & Throttled Focus Re-sync (max once per 60s)
  // Conserves ngrok free-tier limits (20,000 requests/month, 1GB bandwidth)
  useEffect(() => {
    let lastSyncTime = Date.now();

    // 1. Five-minute interval polling (paused when document.hidden is true)
    const interval = setInterval(() => {
      if (!document.hidden) {
        lastSyncTime = Date.now();
        loadData();
      }
    }, 300000); // 5 minutes

    // 2. Window focus re-sync (throttled to at most once every 60 seconds)
    const handleFocus = () => {
      const now = Date.now();
      if (!document.hidden && now - lastSyncTime >= 60000) {
        lastSyncTime = now;
        loadData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [loadData]);

  // Keep admin dashboard and directories synced with latest MySQL records
  useEffect(() => {
    if (currentPortal === 'admin') {
      loadData();
    }
  }, [currentPortal, adminTab, loadData]);

  // Core ID Scan Processing Logic - ZERO DELAY OPTIMISTIC ARCHITECTURE
  const handleProcessScan = useCallback(async (scannedCode) => {
    if (!scannedCode) return;
    const cleanCode = scannedCode.trim();
    const cleanLower = cleanCode.toLowerCase();

    // 1. Instant Memory & Local Cache Lookup (0ms Response!)
    let person = students.find(s => 
      (s.school_id && s.school_id.toLowerCase() === cleanLower) ||
      (s.rfid_uid && s.rfid_uid.toLowerCase() === cleanLower)
    );
    let isEmployee = false;

    if (!person) {
      person = employees.find(e => 
        (e.employee_id && e.employee_id.toLowerCase() === cleanLower) ||
        (e.rfid_uid && e.rfid_uid.toLowerCase() === cleanLower)
      );
      if (person) isEmployee = true;
    }

    // 2. Fallback to API if new or not in memory
    if (!person) {
      person = await dbService.findPersonByScan(cleanCode);
      if (person) {
        isEmployee = person.person_type === 'EMPLOYEE' || !!person.role || !!person.employee_id;
      }
    }

    if (!person) {
      setLastScanResult({
        error: true,
        code: cleanCode,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 3. Instant determination of IN or OUT
    let determinedType = scanMode;
    if (scanMode === 'AUTO') {
      const idToCheck = person.id;
      const idCode = isEmployee ? (person.employee_id || person.school_id) : person.school_id;
      const todayDateStr = new Date().toDateString();
      
      const lastLocalLog = logs.find(l => 
        (l.student_id === idToCheck || l.employee_id === idToCheck || l.school_id === idCode)
      );

      const referenceLog = lastLocalLog || person.last_attendance;
      if (referenceLog) {
        const lastDateStr = new Date(referenceLog.timestamp).toDateString();
        if (lastDateStr === todayDateStr && referenceLog.log_type === 'IN') {
          determinedType = 'OUT';
        } else {
          determinedType = 'IN';
        }
      } else {
        determinedType = 'IN';
      }
    }

    const timestamp = new Date().toISOString();
    const personRole = isEmployee ? (person.role || 'Personnel') : 'Student';

    // 4. ZERO LATENCY UI UPDATE - Chime & Visual Display triggers immediately!
    setLastScanResult({
      success: true,
      person,
      student: isEmployee ? null : person,
      employee: isEmployee ? person : null,
      isEmployee,
      personRole,
      logType: determinedType,
      timestamp
    });

    // 5. Asynchronous Background Database Persistence (non-blocking)
    try {
      const newLog = await dbService.recordAttendance({
        person,
        student: isEmployee ? null : person,
        employee: isEmployee ? person : null,
        logType: determinedType,
        gate: 'Main Gate',
        remarks: isEmployee ? `${personRole} Gate Verified` : 'Normal'
      });
      setLogs((prev) => [newLog, ...prev.filter(l => l.id !== newLog.id)]);
    } catch (err) {
      console.warn("Background log save warning:", err);
    }
  }, [scanMode, students, employees, logs]);

  // Listen to physical USB/Bluetooth handheld barcode scanner (Keyboard Wedge)
  useBarcodeScanner(handleProcessScan, {
    minLength: 3,
    maxIntervalMs: 90,
    enabled: true
  });

  const handleOpenCardModal = (student) => {
    setSelectedStudentForCard(student);
    setIsCardModalOpen(true);
  };

  // Student CRUD
  const handleAddStudent = async (newStudentData) => {
    try {
      const created = await dbService.createStudent(newStudentData);
      setStudents((prev) => {
        const exists = prev.some(s => s.id === created.id || s.school_id === created.school_id);
        return exists ? prev : [created, ...prev];
      });
      loadData();
      return created;
    } catch (err) {
      alert("Failed to create student: " + err.message);
      return null;
    }
  };

  const handleUpdateStudent = async (id, updatedData) => {
    try {
      const updated = await dbService.updateStudent(id, updatedData);
      setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      alert("Failed to update student: " + err.message);
    }
  };

  const handleDeleteStudent = async (id) => {
    try {
      await dbService.deleteStudent(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert("Failed to delete student: " + err.message);
    }
  };

  // Employee / Staff CRUD
  const handleAddEmployee = async (newEmployeeData) => {
    try {
      const created = await dbService.createEmployee(newEmployeeData);
      setEmployees((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      alert("Failed to create personnel record: " + err.message);
      return null;
    }
  };

  const handleUpdateEmployee = async (id, updatedData) => {
    try {
      const updated = await dbService.updateEmployee(id, updatedData);
      setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err) {
      alert("Failed to update personnel record: " + err.message);
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await dbService.deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert("Failed to delete personnel record: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070a10] text-slate-900 dark:text-slate-100 selection:bg-orange-500 selection:text-white transition-colors duration-200">
      {/* Navigation Header (Hidden in Fullscreen Gate TV Display) */}
      {!isGateFullscreen && (
        <Navbar
          currentPortal={currentPortal}
          setCurrentPortal={setCurrentPortal}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          onToggleFullscreen={handleToggleFullscreen}
          currentUser={currentUser}
          onOpenAdminLogin={handleOpenAdminLogin}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      )}

      {/* Main View Container with smooth GPU transition */}
      <main className="flex-1 flex flex-col transition-all duration-300 ease-out transform-gpu">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold">Initializing KM100 System...</p>
          </div>
        ) : (
          <>
            {/* PORTAL 1: MAIN GATE DISPLAY (Public Gate / TV Kiosk) */}
            {currentPortal === 'gate' && (
              <div className="flex-1 flex flex-col animate-fade-in">
                <KioskDisplay
                  students={students}
                  employees={employees}
                  logs={logs}
                  onScanId={handleProcessScan}
                  scanMode={scanMode}
                  setScanMode={setScanMode}
                  onOpenCamera={() => setIsCameraOpen(true)}
                  onOpenManual={() => setIsManualOpen(true)}
                  soundEnabled={soundEnabled}
                  lastScanResult={lastScanResult}
                  onResetScanResult={() => setLastScanResult(null)}
                  isFullscreen={isGateFullscreen}
                  onToggleFullscreen={handleToggleFullscreen}
                  theme={theme}
                />
              </div>
            )}

            {/* PORTAL 2: ADMIN SIDE (Dashboard, Logs, Student Directory, Staff Directory) */}
            {currentPortal === 'admin' && (
              !currentUser ? (
                /* Unauthenticated Admin Prompt */
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-scale-in">
                  <div className="max-w-md w-full p-8 rounded-3xl bg-white/95 dark:bg-darkbg-950/90 border border-slate-200 dark:border-orange-500/30 text-center shadow-2xl backdrop-blur-xl">
                    <div className="relative w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4">
                      <Shield className="w-8 h-8 text-orange-400" />
                      <Lock className="w-4 h-4 text-amber-400 absolute -bottom-1 -right-1" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Admin Authentication Required</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
                      Access to the Dashboard, Attendance Records, and Personnel Registrations is restricted to authorized school personnel.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <button
                        onClick={handleOpenAdminLogin}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-xs shadow-lg shadow-orange-500/30 transition active:scale-95"
                      >
                        Admin Sign In
                      </button>
                      <button
                        onClick={() => setCurrentPortal('gate')}
                        className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-300 font-bold text-xs transition active:scale-95 border border-slate-200 dark:border-slate-700"
                      >
                        Return to Gate
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Authenticated Admin Suite */
                <div className="flex-1 flex flex-col transition-all duration-300 ease-out">
                  {adminTab === 'dashboard' && (
                    <AdminDashboard
                      students={students}
                      employees={employees}
                      logs={logs}
                      onNavigateTab={(tab) => setAdminTab(tab)}
                      onOpenAddStudent={() => setAdminTab('students')}
                      onRefreshData={loadData}
                      onLaunchGateTV={() => {
                        setCurrentPortal('gate');
                        handleToggleFullscreen();
                      }}
                      theme={theme}
                      isSupabaseConfigured={isSupabaseConfigured}
                    />
                  )}

                  {adminTab === 'attendance' && (
                    <AttendanceLogView logs={logs} students={students} employees={employees} theme={theme} />
                  )}

                  {adminTab === 'students' && (
                    <StudentManager
                      students={students}
                      onAddStudent={handleAddStudent}
                      onUpdateStudent={handleUpdateStudent}
                      onDeleteStudent={handleDeleteStudent}
                      onOpenCardModal={handleOpenCardModal}
                      isSupabaseConfigured={isSupabaseConfigured}
                      theme={theme}
                    />
                  )}

                  {adminTab === 'staff' && (
                    <StaffManager
                      employees={employees}
                      onAddEmployee={handleAddEmployee}
                      onUpdateEmployee={handleUpdateEmployee}
                      onDeleteEmployee={handleDeleteEmployee}
                      theme={theme}
                    />
                  )}
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Real-time Gate Tap Toast for Admin when working in Admin portal */}
      {currentPortal === 'admin' && lastScanResult && lastScanResult.success && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-14 z-50 flex items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/95 border border-emerald-500/40 text-slate-900 dark:text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md max-w-sm ml-auto animate-slide-up">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
            {lastScanResult.logType}
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-900 dark:text-slate-100">
              {lastScanResult.person?.first_name || lastScanResult.student?.first_name || lastScanResult.employee?.first_name}{' '}
              {lastScanResult.person?.last_name || lastScanResult.student?.last_name || lastScanResult.employee?.last_name}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[10px]">
              {lastScanResult.isEmployee ? `${lastScanResult.personRole || 'Staff'} Verified` : 'Student Verified'} ({lastScanResult.person?.school_id || lastScanResult.person?.employee_id || lastScanResult.student?.school_id})
            </p>
          </div>
          <button
            onClick={() => setCurrentPortal('gate')}
            className="ml-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            View Gate
          </button>
          <button
            onClick={() => setLastScanResult(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modals */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={handleProcessScan}
      />

      <ManualScanModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onScan={handleProcessScan}
        onScanSubmit={handleProcessScan}
        sampleStudents={students}
      />

      <StudentIdCardModal
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setSelectedStudentForCard(null);
        }}
        student={selectedStudentForCard}
      />

      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigSaved={loadData}
      />

      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Logout Transition Screen - Styled Identical to AdminAuthModal Login */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-darkbg-950 border border-slate-200 dark:border-orange-500/30 rounded-2xl sm:rounded-3xl shadow-2xl dark:shadow-[0_0_50px_rgba(249,115,22,0.15)] overflow-hidden flex flex-col animate-scale-in">
            {/* Top Header Glow Ribbon */}
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 flex-shrink-0" />

            <div className="p-6 sm:p-8 flex flex-col items-center text-center">
              {/* Logo & Seal Header */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-orange-50 dark:bg-darkbg-900 border border-orange-500/40 p-1.5 shadow-xl shadow-orange-500/10 mb-2.5 sm:mb-3 flex items-center justify-center">
                <img
                  src="/km100-logo.png"
                  alt="KM100 Logo"
                  className="w-full h-full object-contain"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-orange-600 border-2 border-white dark:border-darkbg-950 flex items-center justify-center text-white">
                  <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                KM100 <span className="text-orange-600 dark:text-orange-400">Admin Portal</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                KM100 Skills and Training Center, Inc. • Session Logout
              </p>

              {/* Status Message matching login alert */}
              <div className="w-full mt-5 flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 animate-bounce" />
                <span>Signed out successfully! Returning to Gate Kiosk...</span>
              </div>

              {/* Progress Loading Bar */}
              <div className="w-full mt-4 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 rounded-full animate-pulse w-full" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
