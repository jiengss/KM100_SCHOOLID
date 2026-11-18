import React from 'react';
import { 
  Users, 
  ClipboardList, 
  LogIn, 
  LogOut, 
  Clock, 
  TrendingUp, 
  Award, 
  UserCheck, 
  Download, 
  UserPlus, 
  DoorOpen, 
  Building2, 
  ShieldCheck, 
  ArrowRight,
  Activity,
  CheckCircle2,
  Calendar,
  Sparkles,
  Cpu,
  Zap,
  Radio,
  Compass,
  Utensils,
  Coffee
} from 'lucide-react';
import { COURSE_OPTIONS } from '../lib/mockData';

export default function AdminDashboard({ 
  students, 
  logs, 
  onNavigateTab, 
  onOpenAddStudent, 
  onLaunchGateTV 
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.timestamp.split('T')[0] === todayStr);

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'ACTIVE').length;
  
  const totalInToday = todayLogs.filter(l => l.log_type === 'IN').length;
  const totalOutToday = todayLogs.filter(l => l.log_type === 'OUT').length;
  const currentlyInside = Math.max(0, totalInToday - totalOutToday);
  const attendanceRate = totalStudents > 0 ? Math.min(100, Math.round((totalInToday / totalStudents) * 100)) : 0;

  // Breakdown by NC II Course
  const courseStats = COURSE_OPTIONS.map(course => {
    const enrolled = students.filter(s => s.course_strand === course);
    const presentCount = enrolled.filter(s => {
      // Checked in today and has not checked out, or tapped today
      const studentLogs = todayLogs.filter(l => l.student_id === s.id || l.school_id === s.school_id);
      return studentLogs.length > 0;
    }).length;

    let icon = Award;
    if (course.includes('Computer')) icon = Cpu;
    else if (course.includes('Hospitality')) icon = Sparkles;
    else if (course.includes('Electrical')) icon = Zap;
    else if (course.includes('Electronics')) icon = Radio;
    else if (course.includes('Tourism')) icon = Compass;
    else if (course.includes('Culinary')) icon = Utensils;
    else if (course.includes('Restaurant')) icon = Coffee;

    return {
      course,
      shortName: course.replace(' Technology (NC II)', ' Tech'),
      enrolledCount: enrolled.length,
      presentCount,
      percentage: enrolled.length > 0 ? Math.round((presentCount / enrolled.length) * 100) : 0,
      Icon: icon
    };
  });

  // Simulated Hourly traffic distribution for today
  const hourlyBuckets = [
    { label: '06:00 AM', count: 1 },
    { label: '07:00 AM', count: Math.max(2, Math.round(totalInToday * 0.4)) },
    { label: '08:00 AM', count: Math.max(1, Math.round(totalInToday * 0.35)) },
    { label: '09:00 AM', count: Math.max(0, Math.round(totalInToday * 0.15)) },
    { label: '12:00 PM', count: Math.max(1, Math.round(totalOutToday * 0.2)) },
    { label: '04:00 PM', count: Math.max(1, Math.round(totalOutToday * 0.5)) },
    { label: '05:00 PM', count: Math.max(1, Math.round(totalOutToday * 0.3)) },
  ];
  const maxHourly = Math.max(...hourlyBuckets.map(h => h.count), 1);

  const exportCSV = () => {
    if (logs.length === 0) {
      alert("No attendance records to export.");
      return;
    }
    const headers = ["Timestamp", "Date", "Time", "Log Type", "School ID", "Student Name", "Course", "Section", "Gate"];
    const rows = logs.map(l => {
      const s = l.student || students.find(st => st.id === l.student_id || st.school_id === l.school_id);
      const d = new Date(l.timestamp);
      return [
        l.timestamp,
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
        l.log_type,
        l.school_id,
        s ? `"${s.first_name} ${s.last_name}"` : 'Unknown',
        s ? `"${s.course_strand}"` : '',
        s ? `"${s.section}"` : '',
        `"${l.gate_station || 'Main Gate'}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `KM100_Gate_Attendance_Summary_${todayStr}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* ============================================================== */}
      {/* 1. ADMIN HEADER & QUICK ACTIONS                                */}
      {/* ============================================================== */}
      <div className="glass-panel-glow rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
        
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-darkbg-950 border border-orange-500/40 p-1 flex items-center justify-center shadow-lg shadow-orange-500/10 flex-shrink-0">
            <img src="/km100-logo.webp" alt="KM100 Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                Admin Control Center & Analytics
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[10px] font-black uppercase tracking-wider hidden sm:inline">
                TESDA NC II
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              KM100 Skills and Training Center, Inc. • Attendance Monitoring & Student Operations
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap self-stretch sm:self-auto">
          <button
            onClick={onOpenAddStudent}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-xs font-black transition shadow-lg shadow-orange-500/25 hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Student</span>
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-darkbg-850 hover:bg-darkbg-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition shadow-sm hover:scale-[1.02]"
          >
            <Download className="w-4 h-4 text-orange-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onLaunchGateTV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-blue-500/20 hover:scale-[1.02]"
          >
            <DoorOpen className="w-4 h-4" />
            <span>Open Gate TV</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. FOUR PRIMARY KPI CARDS                                      */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Enrolled */}
        <div 
          onClick={() => onNavigateTab('students')}
          className="glass-panel hover:glass-panel-glow rounded-3xl p-5 border-t-4 border-t-orange-500 transition-all cursor-pointer group shadow-xl"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Enrolled Students</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono-id tracking-tight">
            {totalStudents}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-medium">
            <span>{activeStudents} Active Records</span>
            <span className="text-orange-400 flex items-center gap-1 font-bold group-hover:translate-x-1 transition">
              Manage <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Present Inside Campus */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="glass-panel hover:glass-panel-glow rounded-3xl p-5 border-t-4 border-t-blue-500 transition-all cursor-pointer group shadow-xl"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Inside Campus Now</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-400 font-mono-id tracking-tight">
            {currentlyInside}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-medium">
            <span>{attendanceRate}% of Enrolled Present</span>
            <span className="text-blue-400 flex items-center gap-1 font-bold group-hover:translate-x-1 transition">
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Total Time-Ins Today */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="glass-panel hover:glass-panel-glow rounded-3xl p-5 border-t-4 border-t-emerald-500 transition-all cursor-pointer group shadow-xl"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Gate Check-Ins (Time In)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
              <LogIn className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono-id tracking-tight">
            {totalInToday}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-medium">
            <span>Main Gate Admissions</span>
            <span className="text-emerald-400 flex items-center gap-1 font-bold group-hover:translate-x-1 transition">
              Audit Logs <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Total Time-Outs Today */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="glass-panel hover:glass-panel-glow rounded-3xl p-5 border-t-4 border-t-purple-500 transition-all cursor-pointer group shadow-xl"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Gate Dismissals (Time Out)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
              <LogOut className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-400 font-mono-id tracking-tight">
            {totalOutToday}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-medium">
            <span>Exits Logged Today</span>
            <span className="text-purple-400 flex items-center gap-1 font-bold group-hover:translate-x-1 transition">
              Details <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. NC II TECHNOLOGY PROGRAMS ATTENDANCE STATUS                 */}
      {/* ============================================================== */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 uppercase tracking-wide">
              <Award className="w-5 h-5 text-orange-400" />
              <span>NC II Technology Programs Attendance Status</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Daily turnout breakdown across all 7 accredited technical-vocational departments
            </p>
          </div>
          <button 
            onClick={() => onNavigateTab('students')}
            className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            <span>View All Department Directories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {courseStats.map(({ course, shortName, enrolledCount, presentCount, percentage, Icon }) => (
            <div
              key={course}
              className="p-3.5 rounded-2xl bg-darkbg-950/70 border border-slate-800/90 hover:border-orange-500/40 transition flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    NC II
                  </span>
                </div>
                <div className="font-bold text-white text-xs leading-snug line-clamp-2">
                  {course.replace(' (NC II)', '')}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Present Today</span>
                  <span className="font-bold font-mono text-white">
                    <strong className="text-emerald-400">{presentCount}</strong> / {enrolledCount}
                  </span>
                </div>
                <div className="w-full h-2 bg-darkbg-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. GATE RUSH TRAFFIC & RECENT ADMISSIONS DUAL GRID             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rush Hours Traffic Chart */}
        <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wide">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <span>Gate Rush Hours Traffic Analysis</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Today's Timeline</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Distribution of student admissions and exits through the turnstiles
            </p>
          </div>

          <div className="mt-6 flex items-end justify-between gap-2 h-44 px-2 pt-4 border-b border-slate-800">
            {hourlyBuckets.map((bucket, idx) => {
              const heightPercent = Math.max(12, Math.round((bucket.count / maxHourly) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono font-bold text-orange-300 opacity-0 group-hover:opacity-100 transition">
                    {bucket.count}
                  </span>
                  <div
                    className="w-full max-w-[28px] bg-gradient-to-t from-orange-600 to-amber-400 rounded-t-lg transition-all duration-500 shadow-md group-hover:brightness-125"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[9px] font-mono text-slate-400 truncate max-w-full text-center mt-1">
                    {bucket.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" /> Peak Morning Rush: <strong>07:00 AM - 08:30 AM</strong>
            </span>
            <span className="font-mono text-orange-300 font-bold">Turnstile Flow OK</span>
          </div>
        </div>

        {/* Live Gate Stream Audit */}
        <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wide">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Gate Admission Feed</span>
            </h3>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
            >
              <span>Full Audit Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 max-h-[280px] pr-1">
            {todayLogs.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs text-center">
                <span>No scans recorded today yet.</span>
              </div>
            ) : (
              todayLogs.slice(0, 7).map((log) => {
                const s = log.student || students.find(st => st.id === log.student_id || st.school_id === log.school_id);
                return (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-2xl bg-darkbg-950/70 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={s?.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                        alt={s?.first_name || 'Student'}
                        className="w-8 h-8 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {s ? `${s.first_name} ${s.last_name}` : log.school_id}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {s?.course_strand ? s.course_strand.replace(' Technology (NC II)', ' Tech') : log.school_id}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          log.log_type === 'IN'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                        }`}
                      >
                        {log.log_type === 'IN' ? 'TIME IN' : 'TIME OUT'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
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
  );
}
