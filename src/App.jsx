import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import KioskDisplay from './components/KioskDisplay';
import AdminDashboard from './components/AdminDashboard';
import AttendanceLogView from './components/AttendanceLogView';
import StudentManager from './components/StudentManager';
import CameraScannerModal from './components/CameraScannerModal';
import ManualScanModal from './components/ManualScanModal';
import StudentIdCardModal from './components/StudentIdCardModal';
import SupabaseConfigModal from './components/SupabaseConfigModal';
import AdminAuthModal from './components/AdminAuthModal';
import ConfirmationModal from './components/ConfirmationModal';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { dbService, getStoredSupabaseConfig, adminAuthService } from './lib/supabaseClient';
import { Shield, Lock, LogOut } from 'lucide-react';

export default function App() {
  // Portal separation: 'gate' (Main Gate Entrance Screen) vs 'admin' (Admin Suite)
  const [currentPortal, setCurrentPortal] = useState('gate');
  // Admin sub-navigation: 'dashboard', 'attendance', 'students'
  const [adminTab, setAdminTab] = useState('dashboard');
  
  // Administrator Auth State
  const [currentUser, setCurrentUser] = useState(() => adminAuthService.getCurrentUser());
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

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
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      setIsGateFullscreen(false);
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Modals
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Authentication Handlers
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setCurrentPortal('admin');
  };

  const handleLogout = () => {
    adminAuthService.logout();
    setCurrentUser(null);
    setCurrentPortal('gate');
  };

  const handleOpenAdminLogin = () => {
    setIsAdminAuthModalOpen(true);
  };

  // Load Initial Data
  const loadData = useCallback(async () => {
    try {
      const config = getStoredSupabaseConfig();
      setIsSupabaseConfigured(!!(config.url && config.anonKey));

      const [loadedStudents, loadedLogs] = await Promise.all([
        dbService.getStudents(),
        dbService.getRecentLogs(50)
      ]);
      setStudents(loadedStudents);
      setLogs(loadedLogs);
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Core ID Scan Processing Logic (Handles Barcode, QR Code, RFID, Manual)
  const handleProcessScan = useCallback(async (scannedCode) => {
    if (!scannedCode) return;
    const cleanCode = scannedCode.trim();

    // Find student in DB
    const student = await dbService.findStudentByScan(cleanCode);

    if (!student) {
      setLastScanResult({
        error: true,
        code: cleanCode,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Determine IN or OUT
    let determinedType = scanMode;
    if (scanMode === 'AUTO') {
      const lastRecord = await dbService.getLastAttendance(student.id);
      if (lastRecord) {
        const lastDate = new Date(lastRecord.timestamp).toDateString();
        const todayDate = new Date().toDateString();
        // If they tapped IN today and haven't tapped OUT, toggle to OUT
        if (lastDate === todayDate && lastRecord.log_type === 'IN') {
          determinedType = 'OUT';
        } else {
          determinedType = 'IN';
        }
      } else {
        determinedType = 'IN';
      }
    }

    // Record in database
    const newLog = await dbService.recordAttendance({
      student,
      logType: determinedType,
      gate: 'Main Gate Kiosk',
      remarks: 'Normal'
    });

    // Update state
    setLogs((prev) => [newLog, ...prev]);
    setLastScanResult({
      success: true,
      student,
      logType: determinedType,
      timestamp: newLog.timestamp
    });
  }, [scanMode]);

  // Listen to physical USB/Bluetooth handheld barcode scanner (Keyboard Wedge)
  useBarcodeScanner(handleProcessScan, {
    minLength: 3,
    maxIntervalMs: 65,
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
      setStudents((prev) => [created, ...prev]);
    } catch (err) {
      alert("Failed to create student: " + err.message);
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
          onLogout={() => setIsLogoutConfirmOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      )}

      {/* Main View Container */}
      <main className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold">Initializing KM100 School ID System...</p>
          </div>
        ) : (
          <>
            {/* ======================================================== */}
            {/* PORTAL 1: MAIN GATE DISPLAY (Public Gate / TV Kiosk)     */}
            {/* ======================================================== */}
            {currentPortal === 'gate' && (
              <KioskDisplay
                students={students}
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
            )}

            {/* ======================================================== */}
            {/* PORTAL 2: ADMIN SIDE (Dashboard, Logs, Student Directory) */}
            {/* ======================================================== */}
            {currentPortal === 'admin' && (
              !currentUser ? (
                /* Unauthenticated Admin Prompt */
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="max-w-md w-full p-8 rounded-3xl bg-white/95 dark:bg-darkbg-950/90 border border-slate-200 dark:border-orange-500/30 text-center shadow-2xl backdrop-blur-xl animate-scale-in">
                    <div className="relative w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4">
                      <Shield className="w-8 h-8 text-orange-400" />
                      <Lock className="w-4 h-4 text-amber-400 absolute -bottom-1 -right-1" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Admin Authentication Required</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
                      Access to the Dashboard, Attendance Records, and Student Registrations is restricted to authorized school personnel.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <button
                        onClick={handleOpenAdminLogin}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-xs shadow-lg shadow-orange-500/30 transition active:scale-95"
                      >
                        Sign In / Register Admin
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
                <div className="flex-1 flex flex-col">
                  {adminTab === 'dashboard' && (
                    <AdminDashboard
                      students={students}
                      logs={logs}
                      onNavigateTab={(tab) => setAdminTab(tab)}
                      onOpenAddStudent={() => setAdminTab('students')}
                      onLaunchGateTV={() => {
                        setCurrentPortal('gate');
                        handleToggleFullscreen();
                      }}
                      theme={theme}
                    />
                  )}

                  {adminTab === 'attendance' && (
                    <AttendanceLogView logs={logs} students={students} theme={theme} />
                  )}

                  {adminTab === 'students' && (
                    <StudentManager
                      students={students}
                      onAddStudent={handleAddStudent}
                      onUpdateStudent={handleUpdateStudent}
                      onDeleteStudent={handleDeleteStudent}
                      onOpenCardModal={handleOpenCardModal}
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
        <div className="fixed bottom-14 right-6 z-50 flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 border border-emerald-500/40 text-slate-900 dark:text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
            {lastScanResult.logType}
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-900 dark:text-slate-100">{lastScanResult.student?.first_name} {lastScanResult.student?.last_name}</p>
            <p className="text-slate-500 dark:text-slate-400 text-[10px]">Gate verified just now ({lastScanResult.student?.school_id})</p>
          </div>
          <button
            onClick={() => setCurrentPortal('gate')}
            className="ml-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            View Gate
          </button>
          <button
            onClick={() => setLastScanResult(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ml-1 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Footer (Hidden in Fullscreen Gate TV Display) */}
      {!isGateFullscreen && (
        <footer className="border-t border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 py-3 px-6 text-xs text-slate-500 dark:text-slate-400 no-print flex items-center justify-between transition-colors">
          <span>KM100 School ID Scanner & Attendance Verification System • Built with React & Supabase</span>
          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition text-[11px]"
          >
            Database Config
          </button>
        </footer>
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

      {/* Logout Confirmation Modal (Mounted at root for 100% viewport centering) */}
      <ConfirmationModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          handleLogout();
        }}
        title="Confirm Sign Out"
        message="Are you sure you want to sign out of the administrator portal? Any active administrative sessions will end and you will be returned to the Public Gate Kiosk."
        itemDetails={currentUser ? {
          title: currentUser.full_name || 'School Administrator',
          subtitle: currentUser.email || 'admin@km100.edu.ph',
          tag: currentUser.role === 'super_admin' ? 'Super Admin' : 'Admin',
          tagColor: 'amber'
        } : null}
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        variant="danger"
        icon={LogOut}
      />
    </div>
  );
}
