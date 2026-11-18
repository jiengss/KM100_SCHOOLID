import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  CreditCard, 
  CheckCircle2, 
  X, 
  Plus, 
  Sparkles,
  Phone,
  GraduationCap,
  Filter,
  ChevronDown
} from 'lucide-react';
import { COURSE_OPTIONS } from '../lib/mockData';

export default function StudentManager({ 
  students, 
  onAddStudent, 
  onUpdateStudent, 
  onDeleteStudent,
  onOpenCardModal 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    school_id: '',
    rfid_uid: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    grade_level: '1st Year',
    section: 'CET-1A',
    course_strand: COURSE_OPTIONS[0],
    photo_url: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_type: 'O+',
    status: 'ACTIVE'
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    const nextNum = Math.floor(10000 + Math.random() * 90000);
    setFormData({
      school_id: `2024-${nextNum}`,
      rfid_uid: `RFID-${nextNum}`,
      first_name: '',
      middle_name: '',
      last_name: '',
      grade_level: '1st Year',
      section: 'CET-1A',
      course_strand: COURSE_OPTIONS[0],
      photo_url: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 10000)}?auto=format&fit=crop&w=400&q=80`,
      emergency_contact_name: '',
      emergency_contact_phone: '',
      blood_type: 'O+',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({ ...student });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.school_id || !formData.first_name || !formData.last_name) {
      alert("Please enter School ID, First Name, and Last Name.");
      return;
    }

    if (editingStudent) {
      await onUpdateStudent(editingStudent.id, formData);
    } else {
      await onAddStudent(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete student "${name}"?`)) {
      onDeleteStudent(id);
    }
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.school_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course_strand?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = selectedCourse === 'ALL' || student.course_strand === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Student Information Directory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Technical-Vocational Technology Programs (NC II) • Student Records & Barcode Badges
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Student</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, school ID, or section..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
          />
        </div>

        {/* NC II Course Filter Dropdown */}
        <div className="relative sm:w-80">
          <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full appearance-none bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white font-semibold focus:outline-none transition cursor-pointer shadow-inner"
          >
            <option value="ALL">All NC II Courses ({students.length})</option>
            {COURSE_OPTIONS.map((course) => {
              const count = students.filter(s => s.course_strand === course).length;
              return (
                <option key={course} value={course}>
                  {course} {count > 0 ? `(${count})` : ''}
                </option>
              );
            })}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">School ID</th>
                <th className="py-3.5 px-4">Year & Section</th>
                <th className="py-3.5 px-4">NC II Course / Program</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                          alt={student.first_name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-800"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">
                            {student.first_name} {student.middle_name ? student.middle_name + ' ' : ''}{student.last_name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {student.email || 'No email provided'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                        {student.school_id}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{student.grade_level}</div>
                      <div className="text-[11px] text-slate-400">{student.section}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 inline-block">
                        {student.course_strand || 'General Technology (NC II)'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {student.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenCardModal(student)}
                          title="Generate & Print ID Card"
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(student)}
                          title="Edit Student"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id, `${student.first_name} ${student.last_name}`)}
                          title="Delete Student"
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in touch-scroll">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950/60">
              <h3 className="font-bold text-white text-sm sm:text-base">
                {editingStudent ? 'Edit Student Details' : 'Register New Student'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white active:scale-95 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-3.5 sm:space-y-4 touch-scroll">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Unique School ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.school_id}
                    onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                    placeholder="e.g. 2024-10009"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    RFID UID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.rfid_uid}
                    onChange={(e) => setFormData({ ...formData, rfid_uid: e.target.value })}
                    placeholder="e.g. RFID-99109"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Year / Grade Level</label>
                  <select
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Grade 11 (Senior High)">Grade 11 (Senior High)</option>
                    <option value="Grade 12 (Senior High)">Grade 12 (Senior High)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g. CET-1A, HT-2B"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* NC II Course Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Technology Course (NC II Specialization) *
                </label>
                <select
                  value={formData.course_strand}
                  onChange={(e) => setFormData({ ...formData, course_strand: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  {COURSE_OPTIONS.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Photo Image URL</label>
                <input
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Emergency Contact Person</label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    placeholder="Parent / Guardian Name"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Emergency Phone Number</label>
                  <input
                    type="text"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white active:scale-95 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/30 active:scale-95"
                >
                  {editingStudent ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
