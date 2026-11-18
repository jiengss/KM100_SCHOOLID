import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Radio, 
  Sparkles, 
  Compass, 
  Utensils, 
  Coffee, 
  Award,
  PhoneCall
} from 'lucide-react';

// Specialized Theme & Department configurations for each NC II Course
function getCourseConfig(courseStrand = '') {
  const normalized = courseStrand.toLowerCase();

  if (normalized.includes('computer')) {
    return {
      department: 'DEPT. OF COMPUTER ENGINEERING',
      shortCode: 'CET',
      ncBadge: 'COMPUTER SYSTEMS NC II',
      headerBg: 'bg-gradient-to-r from-sky-900 via-indigo-950 to-blue-900',
      accentColor: 'text-sky-600',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
      photoRing: 'border-sky-500',
      Icon: Cpu
    };
  }
  if (normalized.includes('hospitality')) {
    return {
      department: 'DEPT. OF HOSPITALITY MANAGEMENT',
      shortCode: 'HT',
      ncBadge: 'FRONT OFFICE & HOUSEKEEPING NC II',
      headerBg: 'bg-gradient-to-r from-emerald-900 via-teal-950 to-green-900',
      accentColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      photoRing: 'border-emerald-500',
      Icon: Sparkles
    };
  }
  if (normalized.includes('electrical')) {
    return {
      department: 'DEPT. OF ELECTRICAL TECHNOLOGY',
      shortCode: 'EET',
      ncBadge: 'ELECTRICAL INSTALLATION NC II',
      headerBg: 'bg-gradient-to-r from-amber-950 via-yellow-950 to-slate-900',
      accentColor: 'text-amber-600',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      photoRing: 'border-amber-500',
      Icon: Zap
    };
  }
  if (normalized.includes('electronics')) {
    return {
      department: 'DEPT. OF ELECTRONICS TECHNOLOGY',
      shortCode: 'ECET',
      ncBadge: 'ELECTRONIC PRODUCTS ASSEMBLY NC II',
      headerBg: 'bg-gradient-to-r from-purple-950 via-violet-950 to-indigo-900',
      accentColor: 'text-purple-600',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
      photoRing: 'border-purple-500',
      Icon: Radio
    };
  }
  if (normalized.includes('tourism')) {
    return {
      department: 'DEPT. OF TOURISM & TRAVEL',
      shortCode: 'TT',
      ncBadge: 'TOURISM PROMOTION SERVICES NC II',
      headerBg: 'bg-gradient-to-r from-cyan-900 via-teal-950 to-sky-900',
      accentColor: 'text-cyan-600',
      badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      photoRing: 'border-cyan-500',
      Icon: Compass
    };
  }
  if (normalized.includes('culinary')) {
    return {
      department: 'DEPT. OF CULINARY ARTS',
      shortCode: 'CAT',
      ncBadge: 'COMMERCIAL COOKING & BREAD NC II',
      headerBg: 'bg-gradient-to-r from-red-950 via-rose-950 to-orange-950',
      accentColor: 'text-rose-600',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      photoRing: 'border-rose-500',
      Icon: Utensils
    };
  }
  if (normalized.includes('restaurant')) {
    return {
      department: 'DEPT. OF FOOD & RESTAURANT OPS',
      shortCode: 'ROT',
      ncBadge: 'FOOD & BEVERAGE SERVICES NC II',
      headerBg: 'bg-gradient-to-r from-amber-950 via-orange-950 to-rose-950',
      accentColor: 'text-amber-700',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
      photoRing: 'border-amber-600',
      Icon: Coffee
    };
  }

  // Fallback default
  return {
    department: 'DEPT. OF VOCATIONAL TECHNOLOGY',
    shortCode: 'TECH',
    ncBadge: 'NATIONAL CERTIFICATE LEVEL II',
    headerBg: 'bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900',
    accentColor: 'text-blue-600',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    photoRing: 'border-blue-500',
    Icon: Award
  };
}

export default function StudentIdCardModal({ isOpen, onClose, student }) {
  if (!isOpen || !student) return null;

  const config = getCourseConfig(student.course_strand);
  const CourseIcon = config.Icon;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2 text-white font-bold">
            <CourseIcon className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold">School ID Card (3" × 2" Landscape Badge)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-600/30"
            >
              <Printer className="w-4 h-4" />
              <span>Print 3×2" Badge</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Card Viewport Container */}
        <div className="p-6 overflow-y-auto flex flex-col items-center justify-center bg-slate-950/50">
          {/* 
            ID BADGE: EXACT 3" × 2" LANDSCAPE PROPORTION (Ratio 3:2) 
            Width: 460px, Height: 306px on screen
          */}
          <div
            id="printable-id-card"
            className="w-[460px] h-[306px] rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden border-2 border-slate-200 relative flex flex-col justify-between select-none"
            style={{ width: '460px', height: '306px' }}
          >
            {/* Header: School Logo, School Name & Course Department */}
            <div className={`${config.headerBg} text-white px-4 py-2 relative overflow-hidden flex-shrink-0 border-b-2 border-amber-400`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white p-0.5 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img
                      src="/km100-logo.webp"
                      alt="KM100 Logo"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div>
                    <span className="font-black text-[11px] tracking-wider uppercase text-white block leading-tight">
                      KM100 TRAINING CENTER, INC.
                    </span>
                    <span className="text-[8.5px] font-bold tracking-widest text-amber-300 uppercase block">
                      {config.department}
                    </span>
                  </div>
                </div>

                {/* Course Department Short Code Badge */}
                <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full text-[9px] font-black text-amber-300 flex-shrink-0 shadow-sm">
                  <CourseIcon className="w-3 h-3" />
                  <span>{config.shortCode}</span>
                </div>
              </div>
            </div>

            {/* Middle Horizontal Body (Two-Column Layout for 3" x 2" landscape) */}
            <div className="flex-1 px-4 py-2.5 flex items-stretch gap-3.5 bg-gradient-to-br from-white via-slate-50/50 to-white">
              {/* LEFT COLUMN: Student Photo & Emergency Summary */}
              <div className="w-[125px] flex flex-col items-center justify-between flex-shrink-0">
                {/* Photo with Course Ring */}
                <div className="relative">
                  <div className={`w-[98px] h-[98px] rounded-2xl overflow-hidden border-2 ${config.photoRing} shadow-md bg-slate-100`}>
                    <img
                      src={student.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"}
                      alt={student.first_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full border border-white shadow-sm flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>ACTIVE</span>
                  </div>
                </div>

                {/* Emergency Contact Mini Pill */}
                {student.emergency_contact_phone && (
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-1.5 text-center mt-1.5 shadow-inner">
                    <span className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider block leading-none">
                      Emergency Contact
                    </span>
                    <div className="text-[8px] text-slate-700 truncate mt-1 font-bold leading-none">
                      {student.emergency_contact_phone}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Identity, Specialization & High-Res QR Code */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                {/* Student Name */}
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight leading-snug truncate">
                    {student.first_name} {student.middle_name ? student.middle_name[0] + '.' : ''} {student.last_name}
                  </h2>

                  {/* Year & Section Pill */}
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${config.badgeBg}`}>
                      {student.grade_level} • {student.section}
                    </span>
                  </div>

                  {/* NC II Program Specialization Banner */}
                  <div className="mt-1 flex items-center gap-1 text-[8.5px] font-extrabold text-slate-700 uppercase tracking-tight">
                    <Award className={`w-3 h-3 ${config.accentColor} flex-shrink-0`} />
                    <span className="truncate">{student.course_strand || 'Technical Vocational (NC II)'}</span>
                  </div>
                </div>

                {/* QR Code Barcode Box & ID Numbers */}
                <div className="mt-2 bg-slate-50 border border-slate-200/90 rounded-xl p-2 flex items-center gap-2.5 shadow-inner">
                  {/* High-Resolution QR Code */}
                  <div className="p-1 bg-white rounded-lg border border-slate-300 shadow-sm flex flex-col items-center flex-shrink-0">
                    <QRCodeSVG
                      value={student.school_id}
                      size={64}
                      level="H"
                      includeMargin={false}
                    />
                    <span className="text-[6.5px] font-black text-slate-500 uppercase mt-0.5 tracking-wider">
                      TAP / SCAN QR
                    </span>
                  </div>

                  {/* School ID Numbers */}
                  <div className="min-w-0 flex-1">
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      Student ID No.
                    </span>
                    <span className="font-mono font-black text-slate-900 text-sm tracking-tight block leading-tight">
                      {student.school_id}
                    </span>
                    {student.rfid_uid && (
                      <span className="text-[8px] font-mono font-semibold text-slate-500 block truncate mt-0.5">
                        RFID: {student.rfid_uid}
                      </span>
                    )}
                    <span className="text-[7.5px] text-emerald-600 font-bold block mt-0.5 uppercase tracking-wider">
                      ● Official Campus Access
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Stripe: Accreditation & Academic Year */}
            <div className={`${config.headerBg} text-white px-3.5 py-1 flex items-center justify-between text-[8px] font-medium tracking-wider uppercase flex-shrink-0 border-t border-amber-400/40`}>
              <span className="text-amber-300 font-bold truncate max-w-[280px]">{config.ncBadge}</span>
              <span className="text-slate-200 font-mono flex-shrink-0">S.Y. 2024-2025</span>
            </div>
          </div>
        </div>

        {/* Modal Info Footer */}
        <div className="no-print px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400 flex items-center justify-between">
          <span className="text-slate-400">
            Form-factored to standard <strong>3" × 2" Landscape ID card</strong> dimensions with NC II course theme.
          </span>
          <button
            onClick={handlePrint}
            className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Badge</span>
          </button>
        </div>
      </div>
    </div>
  );
}
