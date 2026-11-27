import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  GraduationCap, 
  Briefcase, 
  UserCheck, 
  Building2, 
  Phone, 
  Heart, 
  QrCode, 
  ChevronRight,
  Layers,
  FileText
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getSafePhotoUrl, handleImageError } from '../lib/driveHelper';

// Specialized Color & Theme configurations for Employee Roles
function getEmployeeRoleConfig(role = 'Staff') {
  const r = (role || '').toLowerCase();

  if (r.includes('instructor') || r.includes('faculty') || r.includes('teacher')) {
    return {
      titleBadge: 'FACULTY & INSTRUCTOR',
      headerBg: 'bg-gradient-to-r from-indigo-950 via-purple-950 to-blue-900',
      headerHex: '#1e1b4b',
      accentColor: 'text-indigo-600 dark:text-indigo-400',
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      badgeHex: '#e0e7ff',
      badgeTextHex: '#3730a3',
      badgeBorderHex: '#a5b4fc',
      photoRing: 'border-indigo-500',
      photoRingHex: '#6366f1',
      tagline: 'KM100 ACADEMIC & TECHNICAL FACULTY',
      Icon: GraduationCap
    };
  }

  if (r.includes('staff') || r.includes('admin')) {
    return {
      titleBadge: 'ADMINISTRATIVE STAFF',
      headerBg: 'bg-gradient-to-r from-emerald-950 via-teal-950 to-cyan-900',
      headerHex: '#022c22',
      accentColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      badgeHex: '#d1fae5',
      badgeTextHex: '#065f46',
      badgeBorderHex: '#6ee7b7',
      photoRing: 'border-emerald-500',
      photoRingHex: '#10b981',
      tagline: 'KM100 ADMINISTRATIVE SERVICES',
      Icon: Briefcase
    };
  }

  return {
    titleBadge: 'INSTITUTIONAL EMPLOYEE',
    headerBg: 'bg-gradient-to-r from-amber-950 via-orange-950 to-slate-900',
    headerHex: '#451a03',
    accentColor: 'text-orange-600 dark:text-orange-400',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    badgeHex: '#fef3c7',
    badgeTextHex: '#92400e',
    badgeBorderHex: '#fcd34d',
    photoRing: 'border-amber-500',
    photoRingHex: '#f59e0b',
    tagline: 'KM100 CAMPUS OPERATIONS',
    Icon: UserCheck
  };
}

export default function StaffIdCardModal({ isOpen, onClose, employee }) {
  if (!isOpen || !employee) return null;

  const [printFormat, setPrintFormat] = useState('paper');
  const [orientation, setOrientation] = useState('portrait');
  const [isPrinting, setIsPrinting] = useState(false);

  const isPortrait = orientation === 'portrait';
  const cardWidth = isPortrait ? '2.125in' : '3in';
  const cardHeight = isPortrait ? '3.375in' : '2in';

  const config = getEmployeeRoleConfig(employee.role);
  const RoleIcon = config.Icon;

  const handlePrint = () => {
    const cardElement = document.getElementById('printable-staff-card');
    if (!cardElement) {
      window.print();
      return;
    }

    setIsPrinting(true);

    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    const existingIframe = document.getElementById('km100-staff-print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'km100-staff-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();

    const isCardMode = printFormat === 'card';
    const pageOrientation = isPortrait ? 'portrait' : 'landscape';

    doc.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="referrer" content="no-referrer" />
          <title>Staff ID Badge - ${employee.employee_id} - ${employee.first_name} ${employee.last_name}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
          ${styleTags}
          <style>
            @page {
              size: ${isCardMode ? `${cardWidth} ${cardHeight} ${pageOrientation}` : 'auto'};
              margin: ${isCardMode ? '0' : '10mm'};
            }
            *, *::before, *::after {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #ffffff !important;
              font-family: 'Plus Jakarta Sans', sans-serif !important;
              width: 100% !important;
              height: auto !important;
            }
            body {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: flex-start !important;
              padding-top: ${isCardMode ? '0' : '20px'} !important;
            }
            .print-badge-container {
              width: ${cardWidth} !important;
              height: ${cardHeight} !important;
              box-sizing: border-box !important;
              margin: 0 auto !important;
              page-break-inside: avoid !important;
            }
            #printable-staff-card {
              display: block !important;
              visibility: visible !important;
              position: static !important;
              transform: none !important;
              box-shadow: none !important;
              width: ${cardWidth} !important;
              height: ${cardHeight} !important;
              border-radius: 0.15in !important;
              overflow: hidden !important;
              border: 1px solid #cbd5e1 !important;
              page-break-inside: avoid !important;
            }
            .watermark-seal {
              position: absolute !important;
              inset: 0 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              pointer-events: none !important;
              z-index: 0 !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .watermark-seal img {
              opacity: 0.09 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              display: block !important;
            }
          </style>
        </head>
        <body>
          <div class="print-badge-container">
            ${cardElement.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print iframe error:', err);
      } finally {
        setIsPrinting(false);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-darkbg-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-darkbg-900/50 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <RoleIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <span>{employee.role} ID Card ({isPortrait ? '2⅛" × 3⅜" Portrait' : '3" × 2" Landscape'})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official KM100 Personnel Identification Card
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Orientation Toggle */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-xl text-[10px] font-bold border border-slate-300/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  orientation === 'portrait'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Vertical Portrait orientation (CR80 standard badge)"
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  orientation === 'landscape'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Horizontal Landscape orientation"
              >
                Landscape
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / ID Card Canvas */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-100/60 dark:bg-darkbg-900/40 min-h-[300px]">
          {/* Printable ID Card Component */}
          <div
            id="printable-staff-card"
            className="relative rounded-[0.15in] overflow-hidden bg-white text-slate-900 shadow-2xl border border-slate-300 flex flex-col justify-between select-none"
            style={{
              width: cardWidth,
              height: cardHeight,
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}
          >
            {isPortrait ? (
              /* ======================================================== */
              /* PORTRAIT PERSONNEL BADGE (2.125" × 3.375")               */
              /* ======================================================== */
              <div className="w-full h-full flex flex-col justify-between overflow-hidden">
                {/* 1. Header Banner */}
                <div
                  className="px-2 py-1.5 text-white flex items-center justify-between border-b border-slate-800"
                  style={{
                    backgroundColor: config.headerHex,
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact'
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-white p-0.5 flex-shrink-0 flex items-center justify-center">
                      <img src="/km100-logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 leading-none">
                      <div className="text-[7.5px] font-black tracking-tight uppercase truncate">
                        KM100 SKILLS & TRAINING
                      </div>
                      <div className="text-[5.5px] font-bold text-orange-300 tracking-wider uppercase truncate mt-0.5">
                        {config.tagline}
                      </div>
                    </div>
                  </div>

                  <div
                    className="text-[5.5px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider flex-shrink-0"
                    style={{
                      backgroundColor: config.badgeHex,
                      color: config.badgeTextHex,
                      border: `1px solid ${config.badgeBorderHex}`,
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact'
                    }}
                  >
                    {employee.role?.toUpperCase() || 'STAFF'}
                  </div>
                </div>

                {/* 2. Middle Body: Photo, Info, and QR Code */}
                <div className="flex-1 px-2 py-1 flex flex-col items-center justify-between text-center bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 relative overflow-hidden">
                  {/* Official Security Watermark Seal Background */}
                  <div 
                    className="watermark-seal absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0 select-none"
                    style={{
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact'
                    }}
                  >
                    <img
                      src="/km100-watermark.png"
                      alt="KM100 Seal Watermark"
                      className="w-[145px] h-[145px] object-contain select-none"
                      style={{
                        opacity: 0.09,
                        filter: 'grayscale(20%)',
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                      }}
                      loading="eager"
                      decoding="sync"
                    />
                  </div>

                  {/* Photo with Ring */}
                  <div className="relative z-10 flex flex-col items-center my-0.5">
                    <div
                      className="w-[74px] h-[74px] rounded-xl overflow-hidden border-2 shadow-sm bg-slate-100 flex items-center justify-center"
                      style={{
                        borderColor: config.photoRingHex,
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                      }}
                    >
                      <img
                        src={getSafePhotoUrl(employee.photo_url, 400)}
                        alt={employee.first_name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                      />
                    </div>
                    <span className="text-[5px] font-black font-mono text-slate-500 uppercase tracking-widest mt-0.5">
                      BLOOD: {employee.blood_type || 'O+'}
                    </span>
                  </div>

                  {/* Name and Department */}
                  <div className="relative z-10 w-full min-w-0 my-0.5">
                    <div className="text-[5.5px] font-bold text-slate-400 uppercase tracking-wider">
                      Personnel Name
                    </div>
                    <div className="text-[11px] font-black text-slate-900 uppercase leading-tight truncate">
                      {employee.first_name} {employee.middle_name ? employee.middle_name[0] + '. ' : ''}{employee.last_name}
                    </div>
                    <div className="text-[7px] font-bold text-orange-600 truncate mt-0.5">
                      {employee.position_title || employee.role}
                    </div>
                    <div className="text-[6px] font-semibold text-slate-600 truncate mt-0.5">
                      {employee.department || 'General Administration'}
                    </div>
                  </div>

                  {/* QR Code and Employee ID box */}
                  <div className="relative z-10 w-full bg-slate-50/95 backdrop-blur-[1px] border border-slate-200 rounded-lg p-1.5 flex items-center justify-between gap-1 shadow-inner">
                    <div className="flex flex-col items-center justify-center p-0.5 bg-white border border-slate-200 rounded flex-shrink-0">
                      <QRCodeSVG
                        value={employee.employee_id}
                        size={40}
                        level="M"
                        includeMargin={false}
                      />
                      <span className="text-[4px] font-mono font-black text-slate-600 mt-0.5 tracking-tight">
                        SCAN GATE
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 text-left pl-1">
                      <span className="text-[5px] font-bold text-slate-400 uppercase block">Employee ID:</span>
                      <span className="font-mono font-black text-slate-900 text-[10px] block leading-tight">
                        {employee.employee_id}
                      </span>
                      {employee.emergency_contact_phone && (
                        <span className="text-[5.5px] text-slate-600 block mt-0.5 truncate">
                          Emg: {employee.emergency_contact_phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Bottom Security Bar */}
                <div
                  className="px-2 py-0.5 text-white flex items-center justify-between text-[4.5px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: config.headerHex,
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact'
                  }}
                >
                  <span>AUTH: {employee.rfid_uid || 'RFID-AUTH'}</span>
                  <span>KM100 OFFICIAL BADGE</span>
                </div>
              </div>
            ) : (
              /* ======================================================== */
              /* LANDSCAPE PERSONNEL BADGE (3" × 2")                      */
              /* ======================================================== */
              <div className="w-full h-full flex flex-col justify-between overflow-hidden">
                {/* 1. Header Banner */}
                <div
                  className="px-2 py-1 text-white flex items-center justify-between border-b border-slate-800"
                  style={{
                    backgroundColor: config.headerHex,
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact'
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-white p-0.5 flex-shrink-0 flex items-center justify-center">
                      <img src="/km100-logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 leading-none">
                      <div className="text-[7.5px] font-black tracking-tight uppercase truncate">
                        KM100 SKILLS & TRAINING CENTER
                      </div>
                      <div className="text-[5.5px] font-bold text-orange-300 tracking-wider uppercase truncate mt-0.5">
                        {config.tagline}
                      </div>
                    </div>
                  </div>

                  <div
                    className="text-[6px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider flex-shrink-0"
                    style={{
                      backgroundColor: config.badgeHex,
                      color: config.badgeTextHex,
                      border: `1px solid ${config.badgeBorderHex}`,
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact'
                    }}
                  >
                    {employee.role?.toUpperCase() || 'STAFF'}
                  </div>
                </div>

                {/* 2. Middle Body: Photo, Info, and QR Code */}
                <div className="flex-1 px-2.5 py-1.5 flex items-center justify-between gap-2 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 relative overflow-hidden">
                  {/* Official Security Watermark Seal Background */}
                  <div 
                    className="watermark-seal absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0 select-none"
                    style={{
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact'
                    }}
                  >
                    <img
                      src="/km100-watermark.png"
                      alt="KM100 Seal Watermark"
                      className="w-[115px] h-[115px] object-contain select-none"
                      style={{
                        opacity: 0.08,
                        filter: 'grayscale(20%)',
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                      }}
                      loading="eager"
                      decoding="sync"
                    />
                  </div>

                  {/* Photo Column */}
                  <div className="relative z-10 flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-[1.05in] h-[1.12in] rounded-lg overflow-hidden border-2 shadow-sm bg-slate-100 flex items-center justify-center"
                      style={{
                        borderColor: config.photoRingHex,
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                      }}
                    >
                      <img
                        src={getSafePhotoUrl(employee.photo_url, 400)}
                        alt={employee.first_name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                      />
                    </div>
                    <span className="text-[5px] font-black font-mono text-slate-500 uppercase tracking-widest mt-0.5">
                      BLOOD: {employee.blood_type || 'O+'}
                    </span>
                  </div>

                  {/* Information Column */}
                  <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                    <div>
                      <div className="text-[6px] font-bold text-slate-400 uppercase tracking-wider">
                        Full Name
                      </div>
                      <div className="text-[10px] font-extrabold text-slate-900 uppercase leading-tight truncate">
                        {employee.first_name} {employee.middle_name ? employee.middle_name[0] + '. ' : ''}{employee.last_name}
                      </div>
                      <div className="text-[7px] font-bold text-orange-600 truncate mt-0.5">
                        {employee.position_title || employee.role}
                      </div>
                      <div className="text-[6px] font-semibold text-slate-600 truncate mt-0.5">
                        {employee.department || 'General Administration'}
                      </div>
                    </div>

                    <div className="mt-1 pt-1 border-t border-slate-200">
                      <div className="flex items-center justify-between text-[6px]">
                        <span className="font-bold text-slate-500 uppercase">Employee ID:</span>
                        <span className="font-mono font-black text-slate-900 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                          {employee.employee_id}
                        </span>
                      </div>
                      {employee.emergency_contact_phone && (
                        <div className="flex items-center justify-between text-[5.5px] mt-0.5 text-slate-500 truncate">
                          <span>Emergency:</span>
                          <span className="font-mono font-semibold text-slate-700">{employee.emergency_contact_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR Code Column */}
                  <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-200 rounded-lg flex-shrink-0 shadow-inner">
                    <QRCodeSVG
                      value={employee.employee_id}
                      size={46}
                      level="M"
                      includeMargin={false}
                    />
                    <span className="text-[4.5px] font-mono font-black text-slate-600 mt-0.5 tracking-tight">
                      SCAN GATE
                    </span>
                  </div>
                </div>

                {/* 3. Bottom Security Bar */}
                <div
                  className="px-2 py-0.5 text-white flex items-center justify-between text-[5px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: config.headerHex,
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact'
                  }}
                >
                  <span>AUTHORIZATION CODE: {employee.rfid_uid || 'RFID-AUTH'}</span>
                  <span>PROPERTY OF KM100 • OFFICIAL BADGE</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 text-center">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Standard {isPortrait ? '2⅛" × 3⅜" Portrait' : '3" × 2" Landscape'} Personnel ID Badge (Gate Turnstile Compatible)
            </span>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-darkbg-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Format:</label>
            <select
              value={printFormat}
              onChange={(e) => setPrintFormat(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-white"
            >
              <option value="paper">A4 / Letter Sheet</option>
              <option value="card">3" × 2" PVC Card</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-extrabold shadow-lg shadow-orange-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Printing Badge...' : 'Print Personnel Badge'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

