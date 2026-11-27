import React, { useState, useRef } from 'react';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  X, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap,
  UserCheck,
  Building2,
  Phone,
  Mail,
  Camera,
  Upload,
  Filter,
  Users,
  ShieldCheck,
  Award,
  ChevronDown,
  Link as LinkIcon
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import StaffIdCardModal from './StaffIdCardModal';
import DirectPhotoCaptureModal from './DirectPhotoCaptureModal';
import { EMPLOYEE_ROLES, EMPLOYEE_DEPARTMENTS } from '../lib/mockData';
import { getSafePhotoUrl, handleImageError } from '../lib/driveHelper';

export default function StaffManager({
  employees = [],
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  theme = 'dark'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDirectCameraOpen, setIsDirectCameraOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Card Modal State
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedEmployeeForCard, setSelectedEmployeeForCard] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    employee_id: '',
    rfid_uid: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    role: 'Instructor',
    department: 'Computer Engineering Technology',
    position_title: 'Senior Instructor',
    gender: 'Male',
    email: '',
    contact_number: '',
    photo_url: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_type: 'O+',
    status: 'ACTIVE'
  });

  const resetForm = () => {
    setFormData({
      employee_id: '',
      rfid_uid: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      role: 'Instructor',
      department: 'Computer Engineering Technology',
      position_title: 'Senior Instructor',
      gender: 'Male',
      email: '',
      contact_number: '',
      photo_url: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      blood_type: 'O+',
      status: 'ACTIVE'
    });
    setEditingEmployee(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      employee_id: emp.employee_id || '',
      rfid_uid: emp.rfid_uid || '',
      first_name: emp.first_name || '',
      middle_name: emp.middle_name || '',
      last_name: emp.last_name || '',
      role: emp.role || 'Staff',
      department: emp.department || 'General Administration',
      position_title: emp.position_title || '',
      gender: emp.gender || 'Unspecified',
      email: emp.email || '',
      contact_number: emp.contact_number || '',
      photo_url: emp.photo_url || '',
      emergency_contact_name: emp.emergency_contact_name || '',
      emergency_contact_phone: emp.emergency_contact_phone || '',
      blood_type: emp.blood_type || 'Unknown',
      status: emp.status || 'ACTIVE'
    });
    setIsFormOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      // Put directly into employee photo preview immediately
      setFormData(prev => ({ ...prev, photo_url: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) {
      alert("Please enter the first and last name.");
      return;
    }

    if (editingEmployee) {
      await onUpdateEmployee(editingEmployee.id, formData);
    } else {
      await onAddEmployee(formData);
    }

    setIsFormOpen(false);
    resetForm();
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteEmployee(employeeToDelete.id);
      setEmployeeToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCard = (emp) => {
    setSelectedEmployeeForCard(emp);
    setIsCardModalOpen(true);
  };

  // Filtered List
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.first_name} ${emp.middle_name || ''} ${emp.last_name}`.toLowerCase();
    const id = (emp.employee_id || '').toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    const pos = (emp.position_title || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(search) || id.includes(search) || dept.includes(search) || pos.includes(search);
    const matchesRole = selectedRole === 'ALL' || emp.role === selectedRole;
    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;

    return matchesSearch && matchesRole && matchesDept;
  });

  const instructorsCount = employees.filter(e => e.role === 'Instructor').length;
  const staffCount = employees.filter(e => e.role === 'Staff').length;
  const generalEmployeesCount = employees.filter(e => e.role === 'Employee').length;

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* 1. Header Banner */}
      <div className="glass-panel-glow rounded-3xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden shadow-2xl transition-all">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-400 to-amber-500" />
        
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/40 p-2.5 flex items-center justify-center shadow-lg text-indigo-600 dark:text-indigo-400 flex-shrink-0">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase truncate">
                Personnel & Staff Directory
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                Instructors • Staff • Employees
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              KM100 Skills & Training Center • Dedicated Faculty & Staff Gate Access Management
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs shadow-md shadow-orange-500/25 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Personnel Record</span>
        </button>
      </div>

      {/* 2. Quick KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-darkbg-950/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white leading-none">{employees.length}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Personnel</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-darkbg-950/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{instructorsCount}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Instructors / Faculty</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-darkbg-950/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{staffCount}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Admin Staff</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-darkbg-950/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 leading-none">{generalEmployeesCount}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Campus Employees</div>
          </div>
        </div>
      </div>

      {/* 3. Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-darkbg-950/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by personnel name, employee ID, position or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Roles ({employees.length})</option>
            <option value="Instructor">Instructors ({instructorsCount})</option>
            <option value="Staff">Administrative Staff ({staffCount})</option>
            <option value="Employee">Campus Employees ({generalEmployeesCount})</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 max-w-[200px] truncate"
          >
            <option value="ALL">All Departments</option>
            {EMPLOYEE_DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Personnel Directory Table / Cards */}
      <div className="bg-white dark:bg-darkbg-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Personnel</th>
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Role & Category</th>
                <th className="py-3.5 px-4">Department & Position</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No employee or staff records match the criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isInst = emp.role === 'Instructor';
                  const isStf = emp.role === 'Staff';
                  const roleBadgeColor = isInst
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                    : isStf
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getSafePhotoUrl(emp.photo_url, 150)}
                            alt={emp.first_name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                            referrerPolicy="no-referrer"
                            onError={handleImageError}
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                              {emp.first_name} {emp.middle_name ? emp.middle_name + ' ' : ''}{emp.last_name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {emp.email || 'No email provided'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
                          {emp.employee_id}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${roleBadgeColor}`}>
                          {isInst && <GraduationCap className="w-3 h-3" />}
                          {isStf && <Briefcase className="w-3 h-3" />}
                          {!isInst && !isStf && <UserCheck className="w-3 h-3" />}
                          {emp.role}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate max-w-[220px]">
                            {emp.position_title || emp.role}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px] block">
                            {emp.department || 'General Administration'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          {emp.status || 'ACTIVE'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenCard(emp)}
                            title="Generate & Print Personnel ID Badge"
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition active:scale-95"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            title="Edit Personnel Record"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEmployeeToDelete(emp)}
                            title="Delete Personnel"
                            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS VIEW (< md) */}
        <div className="md:hidden p-3 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="py-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={getSafePhotoUrl(emp.photo_url, 150)}
                    alt={emp.first_name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {emp.first_name} {emp.last_name}
                    </h4>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      {emp.employee_id}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  {emp.role}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {emp.position_title || emp.role} • {emp.department}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  onClick={() => handleOpenCard(emp)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>ID Badge</span>
                </button>
                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEmployeeToDelete(emp)}
                  className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. ADD / EDIT PERSONNEL MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-darkbg-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-darkbg-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                    {editingEmployee ? 'Edit Personnel Record' : 'Register New Employee / Instructor'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Separate record from student roster • Turnstile credential enabled
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Role & ID Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Personnel Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    {EMPLOYEE_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID (Optional Auto)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INST-2025-0001 (Blank = Auto)"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Department & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department / Unit *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    {EMPLOYEE_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Position Title / Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Instructor, Registrar"
                    value={formData.position_title}
                    onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Email & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="staff@km100.edu.ph"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile / Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="+63 917 ..."
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Photo Section with Direct Camera and File Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Personnel Photo
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDirectCameraOpen(true)}
                      className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 active:scale-95"
                    >
                      <Camera className="w-3 h-3 text-orange-500" />
                      <span>Snap Photo with Camera</span>
                    </button>
                    <span className="text-slate-400 text-[10px]">•</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload File</span>
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {formData.photo_url ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-emerald-500/30">
                    <img
                      src={getSafePhotoUrl(formData.photo_url, 400)}
                      alt="Personnel Preview"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-sm"
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Personnel Photo Loaded</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Ready for ID badge and gate terminal</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setIsDirectCameraOpen(true)}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30"
                        >
                          Retake Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, photo_url: '' })}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/40"
                  >
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to upload photo or use camera button above</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Supports JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="Name & Relationship"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="+63 918 ..."
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Blood Type & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Blood Type
                  </label>
                  <select
                    value={formData.blood_type}
                    onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown'].map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 transition active:scale-95"
                >
                  {editingEmployee ? 'Update Personnel Record' : 'Save & Register Personnel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={!!employeeToDelete}
        onClose={() => !isDeleting && setEmployeeToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Personnel Record"
        message="Are you sure you want to permanently delete this personnel record? Their gate credential and turnstile access will be immediately revoked."
        itemDetails={employeeToDelete ? {
          title: `${employeeToDelete.first_name} ${employeeToDelete.last_name}`,
          subtitle: `${employeeToDelete.role} • ${employeeToDelete.department}`,
          image: employeeToDelete.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
          tag: `ID: ${employeeToDelete.employee_id}`,
          tagColor: 'indigo'
        } : null}
        confirmText="Delete Personnel"
        cancelText="Cancel"
        variant="danger"
        icon={Trash2}
      />

      {/* 7. DIRECT LIVE PHOTO CAPTURE MODAL */}
      <DirectPhotoCaptureModal
        isOpen={isDirectCameraOpen}
        onClose={() => setIsDirectCameraOpen(false)}
        onCapture={(dataUrl) => setFormData(prev => ({ ...prev, photo_url: dataUrl }))}
        title="Capture Personnel ID Photo"
      />

      {/* 8. STAFF ID CARD & BADGE MODAL */}
      <StaffIdCardModal
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setSelectedEmployeeForCard(null);
        }}
        employee={selectedEmployeeForCard}
      />
    </div>
  );
}

