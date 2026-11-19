import React, { useState } from 'react';
import { 
  ClipboardList, 
  Search, 
  Download, 
  LogIn, 
  LogOut, 
  Calendar, 
  Filter,
  Clock,
  UserCheck
} from 'lucide-react';

export default function AttendanceLogView({ logs, students }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, IN, OUT
  const [filterDate, setFilterDate] = useState('TODAY'); // TODAY, ALL

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredLogs = logs.filter(log => {
    const student = log.student || students.find(s => s.id === log.student_id || s.school_id === log.school_id);
    const fullName = student ? `${student.first_name} ${student.last_name}` : '';
    const schoolId = log.school_id || (student ? student.school_id : '');

    const matchesSearch = 
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schoolId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || log.log_type === filterType;

    const logDate = log.timestamp.split('T')[0];
    const matchesDate = filterDate === 'ALL' || logDate === todayStr;

    return matchesSearch && matchesType && matchesDate;
  });

  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      alert("No attendance logs to export.");
      return;
    }

    const headers = ["Timestamp", "Date", "Time", "Log Type", "School ID", "Student Name", "Course / Program", "Gate/Station", "Remarks"];
    const rows = filteredLogs.map(log => {
      const student = log.student || students.find(s => s.id === log.student_id || s.school_id === log.school_id);
      const d = new Date(log.timestamp);
      return [
        log.timestamp,
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
        log.log_type,
        log.school_id,
        student ? `"${student.first_name} ${student.last_name}"` : 'Unknown',
        student ? `"${student.course_strand || 'General'}"` : '',
        `"${log.gate_station || 'Main Gate Kiosk'}"`,
        `"${log.remarks || 'Normal'}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KM100_Attendance_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const countIn = logs.filter(l => l.log_type === 'IN').length;
  const countOut = logs.filter(l => l.log_type === 'OUT').length;

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Attendance Records & Scanner Logs</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            KM100 Skills and Training Center, Inc. • Attendance Audit Trail & Gate Logs
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 transition shadow-sm active:scale-95 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-md">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Scans Recorded</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono-id">{logs.length}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Time-Ins</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono-id">{countIn}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-md">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Time-Outs</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono-id">{countOut}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name or school ID..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* IN / OUT Filter */}
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                filterType === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('IN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                filterType === 'IN' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Time In
            </button>
            <button
              onClick={() => setFilterType('OUT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                filterType === 'OUT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Time Out
            </button>
          </div>

          {/* Date Filter */}
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center">
            <button
              onClick={() => setFilterDate('TODAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                filterDate === 'TODAY' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilterDate('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                filterDate === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              All Dates
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-100 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">School ID</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Gate / Device</th>
                <th className="py-3.5 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No attendance logs match the current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const student = log.student || students.find(s => s.id === log.student_id || s.school_id === log.school_id);
                  const dateObj = new Date(log.timestamp);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            log.log_type === 'IN'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400'
                              : 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/30 dark:text-indigo-400'
                          }`}
                        >
                          {log.log_type === 'IN' ? (
                            <>
                              <LogIn className="w-3 h-3" />
                              <span>TIME IN</span>
                            </>
                          ) : (
                            <>
                              <LogOut className="w-3 h-3" />
                              <span>TIME OUT</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student?.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                            alt={student?.first_name || 'Student'}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {student ? `${student.first_name} ${student.last_name}` : 'Unknown Student'}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {student ? `${student.grade_level} - ${student.section}` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {log.school_id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {dateObj.toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {log.gate_station || 'Main Gate Kiosk'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-500 dark:text-slate-400">
                          {log.remarks || 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
