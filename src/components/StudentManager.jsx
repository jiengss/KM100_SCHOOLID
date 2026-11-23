import React, { useState, useRef } from 'react';
import ConfirmationModal from './ConfirmationModal';
import RegistrationFormScannerModal from './RegistrationFormScannerModal';
import ExcelImportModal from './ExcelImportModal';
import { exportStudentsToExcel } from '../lib/excelService';
import { convertToGoogleDriveDirectImageUrl, isGoogleDriveUrl } from '../lib/driveHelper';
import { generateSmartSchoolId, generateSmartRfidUid, isValidSchoolId } from '../lib/idGenerator';
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
  ChevronDown, 
  Database, 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Check,
  ScanLine,
  FileText,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { COURSE_OPTIONS } from '../lib/mockData';

export default function StudentManager({ 
  students, 
  onAddStudent, 
  onUpdateStudent, 
  onDeleteStudent,
  onOpenCardModal,
  isSupabaseConfigured = false,
  onOpenSupabaseModal
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormScannerOpen, setIsFormScannerOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [formScannedBanner, setFormScannedBanner] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Photo Upload State
  const fileInputRef = useRef(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    school_id: '',
    rfid_uid: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    grade_level: 'N/A',
    section: 'N/A',
    course_strand: COURSE_OPTIONS[0],
    photo_url: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_type: 'O+',
    status: 'ACTIVE'
  });

  const processAndSetImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }
    setUploadError('');
    setIsProcessingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 480;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with 0.85 quality for sharp ID photo and compact size (~30KB)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormData((prev) => ({ ...prev, photo_url: dataUrl }));
        } catch (err) {
          console.error('Error compressing image:', err);
          setFormData((prev) => ({ ...prev, photo_url: event.target.result }));
        } finally {
          setIsProcessingImage(false);
        }
      };
      img.onerror = () => {
        setUploadError('Failed to read image file.');
        setIsProcessingImage(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndSetImage(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photo_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyScannedFormData = (scannedData) => {
    setEditingStudent(null);
    setUploadError('');
    setShowUrlInput(false);
    setFormScannedBanner(true);
    if (fileInputRef.current) fileInputRef.current.value = '';

    let firstName = scannedData.first_name || '';
    let middleName = scannedData.middle_name || '';
    let lastName = scannedData.last_name || '';

    // Safety: never leave First Name empty if Middle Name has value
    if (!firstName && middleName) {
      firstName = middleName;
      middleName = '';
    }

    if (lastName.includes(',')) {
      const parts = lastName.split(',').map(s => s.trim()).filter(Boolean);
      lastName = parts[0] || '';
      if (!firstName && parts[1]) {
        const tokens = parts[1].split(/\s+/).filter(Boolean);
        firstName = tokens[0] || '';
        if (tokens.length > 1 && !middleName) {
          middleName = tokens.slice(1).join(' ');
        }
      }
    }

    let schoolId = scannedData.school_id?.trim() || '';
    if (!isValidSchoolId(schoolId)) {
      schoolId = generateSmartSchoolId(students);
    }

    let rfidUid = scannedData.rfid_uid?.trim() || '';
    if (!rfidUid || rfidUid.length > 50) {
      rfidUid = generateSmartRfidUid(students);
    }

    setFormData({
      school_id: schoolId,
      rfid_uid: rfidUid,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      grade_level: 'N/A',
      section: 'N/A',
      course_strand: scannedData.course_strand || COURSE_OPTIONS[0],
      photo_url: scannedData.photo_url || '',
      emergency_contact_name: scannedData.emergency_contact_name || '',
      emergency_contact_phone: scannedData.emergency_contact_phone || '',
      blood_type: 'O+',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setUploadError('');
    setShowUrlInput(false);
    setFormScannedBanner(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFormData({
      school_id: generateSmartSchoolId(students),
      rfid_uid: generateSmartRfidUid(students),
      first_name: '',
      middle_name: '',
      last_name: '',
      grade_level: 'N/A',
      section: 'N/A',
      course_strand: COURSE_OPTIONS[0],
      photo_url: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      blood_type: 'O+',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setUploadError('');
    setShowUrlInput(false);
    setFormScannedBanner(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteStudent(studentToDelete.id);
      setStudentToDelete(null);
    } catch (err) {
      alert("Failed to delete student: " + (err.message || err));
    } finally {
      setIsDeleting(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <span>Student Information Directory</span>
            </h2>
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Live Cloud
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
                title="Connect Supabase PostgreSQL Database"
              >
                <Database className="w-3 h-3 text-amber-500" />
                <span>Connect Supabase</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            KM100 Skills and Training Center, Inc. • Technical-Vocational Programs (NC II)
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsExcelImportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/25 active:scale-95 hover:scale-[1.02]"
            title="Import student roster in bulk from Excel file (.xlsx, .xls, .csv)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={() => setIsFormScannerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/25 active:scale-95 hover:scale-[1.02]"
            title="Scan student enrollment / registration form via Camera, Image Upload, or Text"
          >
            <ScanLine className="w-4 h-4 text-cyan-200" />
            <span>Scan Registration Form</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Student</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, school ID, or course..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-sm"
          />
        </div>

        {/* NC II Course Filter Dropdown */}
        <div className="relative sm:w-80">
          <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400 pointer-events-none" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none transition cursor-pointer shadow-sm"
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

        {/* Export to Excel Button */}
        <button
          type="button"
          onClick={() => exportStudentsToExcel(filteredStudents)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 flex-shrink-0"
          title="Export current filtered student directory to Excel (.xlsx)"
        >
          <Download className="w-3.5 h-3.5 text-emerald-500" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Students Directory Container (Responsive: Cards on Mobile, Table on Desktop) */}
      <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
        {/* DESKTOP TABLE VIEW (md+) */}
        <div className="hidden md:block overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-100 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">School ID</th>
                <th className="py-3.5 px-4">NC II Course / Program</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto px-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-1">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                        {students.length === 0 ? "No Students Registered Yet" : "No Matching Students"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {students.length === 0 
                          ? "Mock data has been removed. Register your first student using the button above to automatically sync their record to Supabase."
                          : "Try adjusting your search criteria or course filter."}
                      </p>
                      {students.length === 0 && (
                        <div className="mt-3 flex items-center justify-center gap-2.5 flex-wrap">
                          <button
                            onClick={() => setIsFormScannerOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30 active:scale-95"
                          >
                            <ScanLine className="w-3.5 h-3.5 text-cyan-200" />
                            <span>Scan Registration Form</span>
                          </button>
                          <button
                            onClick={handleOpenAdd}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white rounded-xl text-xs font-bold transition active:scale-95 border border-slate-300 dark:border-slate-700"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Manual Entry</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                          alt={student.first_name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {student.first_name} {student.middle_name ? student.middle_name + ' ' : ''}{student.last_name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {student.email || 'No email provided'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-500/20">
                        {student.school_id}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
                        {student.course_strand || 'General Technology (NC II)'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {student.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenCardModal(student)}
                          title="Generate & Print ID Card"
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition active:scale-95"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(student)}
                          title="Edit Student"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStudentToDelete(student)}
                          title="Delete Student Record"
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition active:scale-95"
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

        {/* MOBILE ADAPTIVE CARD VIEW (< md) */}
        <div className="md:hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-2">
                <Users className="w-6 h-6" />
              </div>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                {students.length === 0 ? "No Students Registered Yet" : "No Matching Students"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                {students.length === 0 
                  ? "Scan a student form or click register below to enroll your first student."
                  : "Try clearing search or changing the course filter."}
              </p>
              {students.length === 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={() => setIsFormScannerOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-xs font-bold shadow-md active:scale-95"
                  >
                    <ScanLine className="w-4 h-4 text-cyan-200" />
                    <span>Scan Registration Form</span>
                  </button>
                  <button
                    onClick={handleOpenAdd}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register Manually</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredStudents.map((student) => (
                <div key={student.id} className="p-3.5 sm:p-4 space-y-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  {/* Top: Avatar, Name, School ID, Status */}
                  <div className="flex items-start gap-3">
                    <img
                      src={student.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                      alt={student.first_name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex-shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {student.first_name} {student.middle_name ? student.middle_name + ' ' : ''}{student.last_name}
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {student.status || 'ACTIVE'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md text-[11px] border border-blue-200 dark:border-blue-500/20">
                          {student.school_id}
                        </span>
                        {student.rfid_uid && (
                          <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            RFID: {student.rfid_uid}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Course Strand Tag */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                    <GraduationCap className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                    <span className="truncate">{student.course_strand || 'General Technology (NC II)'}</span>
                  </div>

                  {/* Emergency Contact */}
                  {(student.emergency_contact_name || student.emergency_contact_phone) && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                      <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        Emergency: <strong className="text-slate-700 dark:text-slate-300">{student.emergency_contact_name || 'Guardian'}</strong> {student.emergency_contact_phone && `(${student.emergency_contact_phone})`}
                      </span>
                    </div>
                  )}

                  {/* Touch Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => onOpenCardModal(student)}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/25 active:scale-95 transition"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>ID Card</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(student)}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 active:scale-95 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setStudentToDelete(student)}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/25 active:scale-95 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in touch-scroll">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {editingStudent ? 'Edit Student Details' : 'Register New Student'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white active:scale-95 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-3.5 sm:space-y-4 touch-scroll">
              {/* Form Scanned Success Notification Banner */}
              {formScannedBanner && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Registration Form Scanned & Loaded!</p>
                      <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400">
                        First Name, Middle Name, Last Name, Course, and Emergency Contacts auto-filled.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormScannedBanner(false)}
                    className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Shortcut to Scan Registration Form if not scanned yet */}
              {!editingStudent && !formScannedBanner && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <ScanLine className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                        Have a filled registration sheet?
                      </p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                        Scan with camera or upload form to auto-fill all 6 fields
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormScannerOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5"
                  >
                    <span>Scan Form</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unique School ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.school_id}
                    onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                    placeholder="e.g. 2025-00101"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    RFID UID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.rfid_uid}
                    onChange={(e) => setFormData({ ...formData, rfid_uid: e.target.value })}
                    placeholder="e.g. RFID-99109"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* NC II Course Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Technology Course (NC II Specialization) *
                </label>
                <select
                  value={formData.course_strand}
                  onChange={(e) => setFormData({ ...formData, course_strand: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  {COURSE_OPTIONS.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Photo Upload & Preview Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Student Photo
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{showUrlInput ? 'Hide URL field' : 'Or paste image URL'}</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {formData.photo_url ? (
                  /* Photo Preview State */
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-emerald-500/40 dark:border-emerald-500/30">
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md flex-shrink-0 bg-slate-200 dark:bg-slate-800">
                      <img
                        src={formData.photo_url}
                        alt="Student Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        Student Photo Loaded
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Ready for 3" × 2" ID Badge & Gate Scanner
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 transition active:scale-95 flex items-center gap-1"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Change Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition active:scale-95 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Upload Drop Zone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) processAndSetImage(file);
                    }}
                    className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50/80 hover:bg-orange-50/20 dark:bg-slate-950/60 dark:hover:bg-orange-950/10 cursor-pointer transition group text-center"
                  >
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      {isProcessingImage ? (
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      {isProcessingImage ? 'Optimizing photo...' : 'Click to Upload Student Photo'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Choose from device or drag & drop (JPG, PNG, WEBP)
                    </p>
                  </div>
                )}

                {uploadError && (
                  <p className="text-[11px] font-semibold text-red-500">{uploadError}</p>
                )}

                {showUrlInput && (
                  <div className="pt-1">
                    <input
                      type="url"
                      value={formData.photo_url}
                      onChange={(e) => {
                        let val = e.target.value.trim();
                        if (isGoogleDriveUrl(val)) {
                          val = convertToGoogleDriveDirectImageUrl(val, 800);
                        }
                        setFormData({ ...formData, photo_url: val });
                      }}
                      placeholder="Paste image URL or Google Drive link (e.g. drive.google.com/file/d/...)"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    placeholder="e.g. Helen"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Emergency Contact Number</label>
                  <input
                    type="text"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    placeholder="e.g. 12345678891 or 09171234567"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition"
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

      {/* Delete Student Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!studentToDelete}
        onClose={() => !isDeleting && setStudentToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Student Record"
        message="Are you sure you want to permanently delete this student record? Their campus gate admission privileges and barcode credentials will be immediately revoked."
        itemDetails={studentToDelete ? {
          title: `${studentToDelete.first_name} ${studentToDelete.middle_name ? studentToDelete.middle_name + ' ' : ''}${studentToDelete.last_name}`,
          subtitle: studentToDelete.course_strand || 'NC II Technology Program',
          image: studentToDelete.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
          tag: `ID: ${studentToDelete.school_id}`,
          tagColor: 'blue'
        } : null}
        confirmText="Delete Student"
        cancelText="Keep Record"
        variant="danger"
        icon={Trash2}
      />

      {/* Registration Form Scanner Modal (Camera / Document OCR / Paste & Direct Save) */}
      <RegistrationFormScannerModal
        isOpen={isFormScannerOpen}
        onClose={() => setIsFormScannerOpen(false)}
        onApplyData={handleApplyScannedFormData}
        onSaveStudentDirectly={onAddStudent}
        existingStudents={students}
        onOpenCardModal={onOpenCardModal}
      />

      {/* Excel Spreadsheet Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onBatchAddStudents={onAddStudent}
        existingStudents={students}
        isSupabaseConfigured={isSupabaseConfigured}
      />
    </div>
  );
}
