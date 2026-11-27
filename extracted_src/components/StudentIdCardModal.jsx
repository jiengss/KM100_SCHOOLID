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
  Award
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
    const cardElement = document.getElementById('printable-id-card');
    if (!cardElement) {
      window.print();
      return;
    }

    // Add printing class to body so CSS media print isolates ONLY #printable-id-card
    // This prints directly from the top-level DOM where all student images and logos
    // are already loaded and rendered in memory, guaranteeing the photo is never blank!
    document.body.classList.add('km100-printing-card');

    const cleanup = () => {
      document.body.classList.remove('km100-printing-card');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    // Call native window print directly
    window.print();

    // Safety timeout cleanup
    setTimeout(cleanup, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in touch-scroll">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[92vh] animate-scale-in">
        {/* Modal Top Bar */}
        <div className="no-print flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 gap-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold min-w-0">
            <CourseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold truncate">School ID Card (3" × 2" Badge)</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-600/30 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span><span className="hidden xs:inline">Print </span>3×2" Badge</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Card Viewport Container */}
        <div className="p-3 xs:p-6 sm:p-12 overflow-x-hidden overflow-y-auto flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-950/60 min-h-[260px] sm:min-h-[340px]">
          {/* Zoom Preview Wrapper (Adaptive on mobile, enlarged on desktop, 100% exact 3in x 2in in print) */}
          <div className="scale-[0.85] xs:scale-100 sm:scale-[1.25] md:scale-[1.35] origin-center shadow-2xl rounded-xl transition-all duration-300 my-1">
            {/* 
              ID BADGE: EXACT 3" × 2" LANDSCAPE PROPORTION (288px × 192px at 96 DPI)
            */}
            <div
              id="printable-id-card"
              className="bg-white text-slate-900 shadow-2xl overflow-hidden border border-slate-300 relative flex flex-col justify-between select-none rounded-xl"
              style={{ width: '3in', height: '2in', boxSizing: 'border-box' }}
            >
              {/* Header: School Logo, School Name & Course Department (Height: 28px) */}
              <div className={`${config.headerBg} text-white px-2.5 py-1 h-[28px] relative overflow-hidden flex-shrink-0 flex items-center justify-between border-b-2 border-amber-400`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-white p-0.5 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img
                      src="/km100-logo.png"
                      alt="KM100 Logo"
                      className="w-full h-full object-contain rounded-full"
                      loading="eager"
                      decoding="sync"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-[8.5px] tracking-wider uppercase text-white block leading-none truncate">
                      KM100 SKILLS AND TRAINING CENTER, INC.
                    </span>
                    <span className="text-[6.5px] font-bold tracking-widest text-amber-300 uppercase block leading-none mt-0.5 truncate">
                      {config.department}
                    </span>
                  </div>
                </div>

                {/* Course Department Short Code Badge */}
                <div className="flex items-center gap-1 bg-white/15 border border-white/20 px-1.5 py-0.5 rounded-full text-[7px] font-black text-amber-300 flex-shrink-0 shadow-sm ml-1">
                  <CourseIcon className="w-2.5 h-2.5" />
                  <span>{config.shortCode}</span>
                </div>
              </div>

              {/* Middle Horizontal Body (Height: 146px) */}
              <div className="h-[146px] px-2.5 py-1.5 flex items-stretch gap-2.5 bg-gradient-to-br from-white via-slate-50/60 to-white flex-1 overflow-hidden">
                {/* LEFT COLUMN: Student Photo & Emergency Summary */}
                <div className="w-[74px] flex flex-col items-center justify-between flex-shrink-0">
                  {/* Photo with Course Ring */}
                  <div className="relative">
                    <div className={`w-[70px] h-[70px] rounded-xl overflow-hidden border-2 ${config.photoRing} shadow-sm bg-slate-100`}>
                      <img
                        src={student.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"}
                        alt={student.first_name}
                        className="w-full h-full object-cover"
                        loading="eager"
                        decoding="sync"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300";
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[7px] font-black uppercase px-1 py-0.2 rounded-full border border-white shadow-sm flex items-center gap-0.5">
                      <ShieldCheck className="w-2 h-2" />
                      <span>ACTIVE</span>
                    </div>
                  </div>

                  {/* Emergency Mini Pill */}
                  {student.emergency_contact_phone ? (
                    <div className="w-full bg-slate-100 border border-slate-200 rounded p-1 text-center mt-1 shadow-inner">
                      <span className="text-[6px] font-black text-slate-400 uppercase tracking-wider block leading-none">
                        Emergency
                      </span>
                      <div className="text-[7px] text-slate-700 truncate mt-0.5 font-bold leading-none">
                        {student.emergency_contact_phone}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-slate-100 border border-slate-200 rounded p-1 text-center mt-1 shadow-inner">
                      <span className="text-[6px] font-black text-slate-400 uppercase tracking-wider block leading-none">
                        Official ID
                      </span>
                      <span className="text-[6.5px] font-bold text-slate-600 block leading-none mt-0.5">
                        Verified
                      </span>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Identity, Specialization & High-Res QR Code */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  {/* Student Name & Academic Details */}
                  <div>
                    <h2 className="text-[12px] font-black text-slate-900 tracking-tight leading-tight">
                      {student.first_name} {student.middle_name ? student.middle_name[0] + '.' : ''} {student.last_name}
                    </h2>

                    {/* Trainee Qualification Pill */}
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-wide border ${config.badgeBg} leading-none`}>
                        {config.ncBadge || 'NATIONAL CERTIFICATE LEVEL II'}
                      </span>
                    </div>

                    {/* NC II Program Specialization Banner */}
                    <div className="mt-1 flex items-center gap-1 text-[7px] font-extrabold text-slate-700 uppercase tracking-tight leading-tight">
                      <Award className={`w-2.5 h-2.5 ${config.accentColor} flex-shrink-0`} />
                      <span className="line-clamp-1">{student.course_strand || 'Technical Vocational (NC II)'}</span>
                    </div>
                  </div>

                  {/* QR Code Barcode Box & ID Numbers */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex items-center gap-2 shadow-inner">
                    {/* High-Resolution QR Code */}
                    <div className="p-0.5 bg-white rounded border border-slate-300 shadow-sm flex flex-col items-center flex-shrink-0">
                      <QRCodeSVG
                        value={student.school_id}
                        size={46}
                        level="M"
                        includeMargin={false}
                      />
                      <span className="text-[5.5px] font-black text-slate-500 uppercase mt-0.5 tracking-wider leading-none">
                        SCAN QR
                      </span>
                    </div>

                    {/* School ID Numbers */}
                    <div className="min-w-0 flex-1">
                      <span className="text-[6px] font-bold text-slate-400 uppercase tracking-wider block leading-none">
                        Student ID No.
                      </span>
                      <span className="font-mono font-black text-slate-900 text-[11px] tracking-tight block leading-tight mt-0.5">
                        {student.school_id}
                      </span>
                      {student.rfid_uid && (
                        <span className="text-[6.5px] font-mono font-semibold text-slate-500 block truncate leading-none mt-0.5">
                          RFID: {student.rfid_uid}
                        </span>
                      )}
                      <span className="text-[6.5px] text-emerald-600 font-bold block mt-0.5 uppercase tracking-wider leading-none">
                        ● Campus Access
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Stripe: Accreditation & Academic Year (Height: 18px) */}
              <div className={`${config.headerBg} text-white px-2.5 h-[18px] flex items-center justify-between text-[6.5px] font-medium tracking-wider uppercase flex-shrink-0 border-t border-amber-400/40`}>
                <span className="text-amber-300 font-bold truncate max-w-[190px]">{config.ncBadge}</span>
                <span className="text-slate-200 font-mono flex-shrink-0">S.Y. 2024-2025</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Info Footer */}
        <div className="no-print px-4 sm:px-6 py-2.5 sm:py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-600 dark:text-slate-400 flex flex-col xs:flex-row items-center justify-between gap-2 text-center xs:text-left">
          <span className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-[11px]">
            Standard <strong>3" × 2" Landscape ID card</strong> — fits 100% on card printers & paper without cutting off.
          </span>
          <button
            onClick={handlePrint}
            className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-bold flex items-center gap-1 text-xs active:scale-95 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Badge</span>
          </button>
        </div>
      </div>
    </div>
  );
}
