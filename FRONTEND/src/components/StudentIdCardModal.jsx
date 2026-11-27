import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getSafePhotoUrl, handleImageError } from '../lib/driveHelper';
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
  Layers,
  FileText
} from 'lucide-react';

// Specialized Theme & Department configurations for each NC II Course
function getCourseConfig(courseStrand = '') {
  const normalized = (courseStrand || '').toLowerCase();

  if (normalized.includes('computer')) {
    return {
      department: 'DEPT. OF COMPUTER ENGINEERING',
      shortCode: 'CET',
      ncBadge: 'COMPUTER SYSTEMS 3 YEAR DIPLOMA',
      headerBg: 'bg-gradient-to-r from-sky-900 via-indigo-950 to-blue-900',
      headerHex: '#0c4a6e',
      accentColor: 'text-sky-600',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
      badgeHex: '#e0f2fe',
      badgeTextHex: '#075985',
      badgeBorderHex: '#7dd3fc',
      photoRing: 'border-sky-500',
      photoRingHex: '#0ea5e9',
      Icon: Cpu
    };
  }
  if (normalized.includes('hospitality')) {
    return {
      department: 'DEPT. OF HOSPITALITY MANAGEMENT',
      shortCode: 'HT',
      ncBadge: 'FRONT OFFICE & HOUSEKEEPING 3 YEAR DIPLOMA',
      headerBg: 'bg-gradient-to-r from-emerald-900 via-teal-950 to-green-900',
      headerHex: '#064e3b',
      accentColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      badgeHex: '#d1fae5',
      badgeTextHex: '#065f46',
      badgeBorderHex: '#6ee7b7',
      photoRing: 'border-emerald-500',
      photoRingHex: '#10b981',
      Icon: Sparkles
    };
  }
  if (normalized.includes('electrical')) {
    return {
      department: 'DEPT. OF ELECTRICAL TECHNOLOGY',
      shortCode: 'EET',
      ncBadge: 'ELECTRICAL INSTALLATION 3 YEAR DIPLOMA',
      headerBg: 'bg-gradient-to-r from-amber-950 via-yellow-950 to-slate-900',
      headerHex: '#451a03',
      accentColor: 'text-amber-600',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      badgeHex: '#fef3c7',
      badgeTextHex: '#92400e',
      badgeBorderHex: '#fcd34d',
      photoRing: 'border-amber-500',
      photoRingHex: '#f59e0b',
      Icon: Zap
    };
  }
  if (normalized.includes('electronics')) {
    return {
      department: 'DEPT. OF ELECTRONICS TECHNOLOGY',
      shortCode: 'ECET',
      ncBadge: 'ELECTRONIC PRODUCTS ASSEMBLY 3 YEAR DIPLOMA',
      headerBg: 'bg-gradient-to-r from-purple-950 via-violet-950 to-indigo-900',
      headerHex: '#3b0764',
      accentColor: 'text-purple-600',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
      badgeHex: '#f3e8ff',
      badgeTextHex: '#6b21a8',
      badgeBorderHex: '#d8b4fe',
      photoRing: 'border-purple-500',
      photoRingHex: '#a855f7',
      Icon: Radio
    };
  }
  if (normalized.includes('tourism')) {
    return {
      department: 'DEPT. OF TOURISM & TRAVEL',
      shortCode: 'TT',
      ncBadge: 'TOURISM PROMOTION SERVICES 3 YEAR DIPLOMA',
      headerBg: 'bg-gradient-to-r from-cyan-900 via-teal-950 to-sky-900',
      headerHex: '#164e63',
      accentColor: 'text-cyan-600',
      badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      badgeHex: '#cffafe',
      badgeTextHex: '#155e75',
      badgeBorderHex: '#67e8f9',
      photoRing: 'border-cyan-500',
      photoRingHex: '#06b6d4',
      Icon: Compass
    };
  }
  if (normalized.includes('culinary')) {
    return {
      department: 'DEPT. OF CULINARY ARTS',
      shortCode: 'CAT',
      ncBadge: 'COMMERCIAL COOKING & BREAD 3 YEAR DIPLOMA',
      headerBg: 'bg-gradient-to-r from-red-950 via-rose-950 to-orange-950',
      headerHex: '#4c0519',
      accentColor: 'text-rose-600',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      badgeHex: '#ffe4e6',
      badgeTextHex: '#9f1239',
      badgeBorderHex: '#fda4af',
      photoRing: 'border-rose-500',
      photoRingHex: '#f43f5e',
      Icon: Utensils
    };
  }
  if (normalized.includes('restaurant')) {
    return {
      department: 'DEPT. OF FOOD & RESTAURANT OPS',
      shortCode: 'ROT',
      ncBadge: 'FOOD & BEVERAGE SERVICES 3 YEAR DIPLOMA',
      headerBg: 'bg-gradient-to-r from-amber-950 via-orange-950 to-rose-950',
      headerHex: '#451a03',
      accentColor: 'text-amber-700',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
      badgeHex: '#ffedd5',
      badgeTextHex: '#9a3412',
      badgeBorderHex: '#fdba74',
      photoRing: 'border-amber-600',
      photoRingHex: '#d97706',
      Icon: Coffee
    };
  }

  // Fallback default
  return {
    department: 'DEPT. OF VOCATIONAL TECHNOLOGY',
    shortCode: 'TECH',
    ncBadge: 'NATIONAL CERTIFICATE LEVEL II',
    headerBg: 'bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900',
    headerHex: '#1e3a8a',
    accentColor: 'text-blue-600',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    badgeHex: '#dbeafe',
    badgeTextHex: '#1e40af',
    badgeBorderHex: '#93c5fd',
    photoRing: 'border-blue-500',
    photoRingHex: '#3b82f6',
    Icon: Award
  };
}

export default function StudentIdCardModal({ isOpen, onClose, student }) {
  if (!isOpen || !student) return null;

  // Print format option: 'paper' (Letter / A4 with cut guides) or 'card' (PVC card edge-to-edge)
  const [printFormat, setPrintFormat] = useState('paper');
  // Badge orientation: 'portrait' (default standard vertical ID badge) or 'landscape'
  const [orientation, setOrientation] = useState('portrait');
  const [isPrinting, setIsPrinting] = useState(false);

  const isPortrait = orientation === 'portrait';
  const cardWidth = isPortrait ? '2.125in' : '3in';
  const cardHeight = isPortrait ? '3.375in' : '2in';

  const config = getCourseConfig(student.course_strand);
  const CourseIcon = config.Icon;

  const handlePrint = () => {
    const cardElement = document.getElementById('printable-id-card');
    if (!cardElement) {
      window.print();
      return;
    }

    setIsPrinting(true);

    // Extract all stylesheet links and style tags to pass directly to the isolated print document
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    // Remove any previous print iframe
    const existingIframe = document.getElementById('km100-print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    // Create an isolated hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.id = 'km100-print-iframe';
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
          <title>Student ID Badge - ${student.school_id} - ${student.first_name} ${student.last_name}</title>
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
            #printable-id-card {
              width: ${cardWidth} !important;
              height: ${cardHeight} !important;
              max-width: ${cardWidth} !important;
              max-height: ${cardHeight} !important;
              border: ${isCardMode ? '1px solid #cbd5e1' : '1px dashed #94a3b8'} !important;
              border-radius: ${isCardMode ? '6px' : '8px'} !important;
              box-shadow: none !important;
              overflow: hidden !important;
              margin: 0 !important;
              position: static !important;
              transform: none !important;
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-id-card img {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              display: block !important;
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
            .cut-guide-text {
              margin-top: 8px;
              font-size: 8px;
              color: #64748b;
              text-align: center;
              font-family: 'Plus Jakarta Sans', sans-serif;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
          </style>
        </head>
        <body>
          <div class="print-badge-container">
            ${cardElement.outerHTML}
            ${!isCardMode ? `<div class="cut-guide-text">✂ Cut along dashed line • Standard ${isPortrait ? '2⅛" × 3⅜" Portrait' : '3" × 2" Landscape'} ID Badge</div>` : ''}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Ensure all images are loaded inside the isolated frame before printing
    const images = Array.from(doc.images);
    const imagePromises = images.map(img => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });

    Promise.all(imagePromises).then(() => {
      setTimeout(() => {
        setIsPrinting(false);
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch {
          window.print();
        } finally {
          setTimeout(() => {
            if (iframe && iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 3000);
        }
      }, 350);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in touch-scroll">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[92vh] animate-scale-in">
        {/* Modal Top Bar */}
        <div className="no-print flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold min-w-0">
            <CourseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold truncate">
              School ID Card ({isPortrait ? '2⅛" × 3⅜" Portrait' : '3" × 2" Landscape'})
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 flex-wrap">
            {/* Orientation Toggle: Portrait vs Landscape */}
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

            {/* Format Toggle Pill */}
            <div className="hidden xs:flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-xl text-[10px] font-bold border border-slate-300/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setPrintFormat('paper')}
                className={`px-2 py-1 rounded-lg transition ${
                  printFormat === 'paper'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Print on standard A4 / Letter paper with cutting guidelines"
              >
                Paper
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('card')}
                className={`px-2 py-1 rounded-lg transition ${
                  printFormat === 'card'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Print on PVC card printer"
              >
                PVC Card
              </button>
            </div>

            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-600/30 active:scale-95 disabled:opacity-50"
            >
              <Printer className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPrinting ? 'animate-bounce' : ''}`} />
              <span>{isPrinting ? 'Preparing...' : 'Print Badge'}</span>
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
        <div className="p-3 xs:p-6 sm:p-10 overflow-x-hidden overflow-y-auto flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-950/60 min-h-[320px] sm:min-h-[400px]">
          {/* Zoom Preview Wrapper */}
          <div className={`${isPortrait ? 'scale-[0.92] xs:scale-105 sm:scale-[1.18]' : 'scale-[0.85] xs:scale-100 sm:scale-[1.25] md:scale-[1.35]'} origin-center shadow-2xl rounded-xl transition-all duration-300 my-1`}>
            {/* 
              ID BADGE COMPONENT: ADAPTIVE PORTRAIT (2.125" × 3.375") OR LANDSCAPE (3" × 2")
            */}
            <div
              id="printable-id-card"
              className="bg-white text-slate-900 shadow-2xl overflow-hidden border border-slate-300 relative flex flex-col justify-between select-none rounded-xl"
              style={{ 
                width: cardWidth, 
                height: cardHeight, 
                boxSizing: 'border-box',
                backgroundColor: '#ffffff'
              }}
            >
              {isPortrait ? (
                /* ======================================================== */
                /* VERTICAL PORTRAIT BADGE (2.125" × 3.375" Standard CR80)   */
                /* ======================================================== */
                <div className="w-full h-full flex flex-col justify-between overflow-hidden">
                  {/* Header: School Logo, School Name & Course Department */}
                  <div 
                    className={`${config.headerBg} text-white px-2 py-1.5 relative overflow-hidden flex-shrink-0 flex items-center justify-between border-b-2 border-amber-400`}
                    style={{
                      backgroundColor: config.headerHex,
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact'
                    }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <div className="w-5 h-5 rounded-full bg-white p-0.5 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img
                          src="/km100-logo.png"
                          alt="KM100 Logo"
                          className="w-full h-full object-contain rounded-full"
                          loading="eager"
                          decoding="sync"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-black text-[7.5px] tracking-wider uppercase text-white block leading-tight truncate">
                          KM100 SKILLS & TRAINING
                        </span>
                        <span className="text-[6px] font-bold tracking-widest text-amber-300 uppercase block leading-tight truncate">
                          {config.department}
                        </span>
                      </div>
                    </div>

                    <div 
                      className="flex items-center gap-0.5 bg-white/15 border border-white/20 px-1 py-0.5 rounded text-[6.5px] font-black text-amber-300 flex-shrink-0 shadow-sm ml-1"
                      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                    >
                      <CourseIcon className="w-2 h-2" />
                      <span>{config.shortCode}</span>
                    </div>
                  </div>

                  {/* Portrait Middle Body: Photo, Name, Specialization, QR Code */}
                  <div className="px-2 py-1 flex-1 flex flex-col items-center justify-between text-center bg-gradient-to-b from-white via-slate-50/50 to-white overflow-hidden relative">
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

                    {/* Centered Photo */}
                    <div className="relative z-10 my-0.5">
                      <div 
                        className={`w-[74px] h-[74px] rounded-2xl overflow-hidden border-2 ${config.photoRing} shadow-sm bg-slate-100 flex items-center justify-center`}
                        style={{
                          borderColor: config.photoRingHex,
                          backgroundColor: '#f1f5f9',
                          WebkitPrintColorAdjust: 'exact',
                          printColorAdjust: 'exact'
                        }}
                      >
                        <img
                          src={getSafePhotoUrl(student.photo_url, 400)}
                          alt={student.first_name}
                          className="w-full h-full object-cover"
                          loading="eager"
                          decoding="sync"
                          referrerPolicy="no-referrer"
                          style={{
                            WebkitPrintColorAdjust: 'exact',
                            printColorAdjust: 'exact'
                          }}
                          onError={handleImageError}
                        />
                      </div>
                      <div 
                        className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[6.5px] font-black uppercase px-1.5 py-0.2 rounded-full border border-white shadow-sm flex items-center gap-0.5"
                        style={{
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          borderColor: '#ffffff',
                          WebkitPrintColorAdjust: 'exact',
                          printColorAdjust: 'exact'
                        }}
                      >
                        <ShieldCheck className="w-2 h-2" />
                        <span>ACTIVE</span>
                      </div>
                    </div>

                    {/* Student Name & Academic Details */}
                    <div className="relative z-10 w-full min-w-0 my-0.5">
                      <h2 className="text-[11.5px] font-black text-slate-900 tracking-tight leading-tight truncate">
                        {student.first_name} {student.middle_name ? student.middle_name[0] + '.' : ''} {student.last_name}
                      </h2>

                      {/* Trainee Qualification Pill */}
                      <div className="mt-0.5 flex items-center justify-center">
                        <span 
                          className={`px-2 py-0.5 rounded-full text-[6.5px] font-black uppercase tracking-wide border ${config.badgeBg} leading-none truncate max-w-full`}
                          style={{
                            backgroundColor: config.badgeHex,
                            color: config.badgeTextHex,
                            borderColor: config.badgeBorderHex,
                            WebkitPrintColorAdjust: 'exact',
                            printColorAdjust: 'exact'
                          }}
                        >
                          {config.ncBadge || '3 YEAR DIPLOMA'}
                        </span>
                      </div>

                      {/* 3 Year Diploma Program Specialization */}
                      <div className="mt-0.5 flex items-center justify-center gap-1 text-[6.5px] font-bold text-slate-600 uppercase tracking-tight truncate">
                        <Award className={`w-2 h-2 ${config.accentColor} flex-shrink-0`} />
                        <span className="truncate">{student.course_strand || '3 Year Diploma Program'}</span>
                      </div>
                    </div>

                    {/* QR Code Barcode Box & ID Numbers */}
                    <div 
                      className="relative z-10 w-full bg-slate-50/95 backdrop-blur-[1px] border border-slate-200 rounded-xl p-1.5 flex items-center justify-between gap-1.5 shadow-inner"
                      style={{
                        backgroundColor: '#f8fafc',
                        borderColor: '#e2e8f0',
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                      }}
                    >
                      {/* High-Resolution QR Code */}
                      <div 
                        className="p-1 bg-white rounded-lg border border-slate-300 shadow-sm flex flex-col items-center flex-shrink-0"
                        style={{
                          backgroundColor: '#ffffff',
                          borderColor: '#cbd5e1',
                          WebkitPrintColorAdjust: 'exact',
                          printColorAdjust: 'exact'
                        }}
                      >
                        <QRCodeSVG
                          value={student.school_id}
                          size={42}
                          level="M"
                          includeMargin={false}
                        />
                        <span className="text-[5px] font-black text-slate-500 uppercase mt-0.5 tracking-wider leading-none">
                          SCAN QR
                        </span>
                      </div>

                      {/* School ID Numbers & Emergency */}
                      <div className="min-w-0 flex-1 text-left pl-0.5">
                        <span className="text-[5.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none">
                          Student ID No.
                        </span>
                        <span className="font-mono font-black text-slate-900 text-[10.5px] tracking-tight block leading-tight mt-0.5">
                          {student.school_id}
                        </span>
                        {student.rfid_uid && (
                          <span className="text-[6px] font-mono font-semibold text-slate-500 block truncate leading-none mt-0.5">
                            RFID: {student.rfid_uid}
                          </span>
                        )}
                        {student.emergency_contact_phone ? (
                          <span className="text-[6px] text-slate-600 font-semibold block leading-none mt-0.5 truncate">
                            Emg: {student.emergency_contact_phone}
                          </span>
                        ) : (
                          <span className="text-[6px] text-emerald-600 font-bold block leading-none mt-0.5 uppercase tracking-wider">
                            ● Campus Access
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Stripe: Accreditation & Academic Year */}
                  <div 
                    className={`${config.headerBg} text-white px-2 h-[18px] flex items-center justify-between text-[6px] font-medium tracking-wider uppercase flex-shrink-0 border-t border-amber-400/40`}
                    style={{
                      backgroundColor: config.headerHex,
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact'
                    }}
                  >
                    <span className="text-amber-300 font-bold truncate max-w-[140px]">{config.shortCode} • 3 YEAR DIPLOMA</span>
                    <span className="text-slate-200 font-mono flex-shrink-0">S.Y. 2024-2025</span>
                  </div>
                </div>
              ) : (
                /* ======================================================== */
                /* HORIZONTAL LANDSCAPE BADGE (3" × 2" Standard Horizontal)  */
                /* ======================================================== */
                <div className="w-full h-full flex flex-col justify-between overflow-hidden">
                  {/* Header: School Logo, School Name & Course Department (Height: 28px) */}
                  <div 
                    className={`${config.headerBg} text-white px-2.5 py-1 h-[28px] relative overflow-hidden flex-shrink-0 flex items-center justify-between border-b-2 border-amber-400`}
                    style={{
                      backgroundColor: config.headerHex,
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact'
                    }}
                  >
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
                    <div 
                      className="flex items-center gap-1 bg-white/15 border border-white/20 px-1.5 py-0.5 rounded-full text-[7px] font-black text-amber-300 flex-shrink-0 shadow-sm ml-1"
                      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                    >
                      <CourseIcon className="w-2.5 h-2.5" />
                      <span>{config.shortCode}</span>
                    </div>
                  </div>

                  {/* Middle Horizontal Body (Height: 146px) */}
                  <div className="h-[146px] px-2.5 py-1.5 flex items-stretch gap-2.5 bg-gradient-to-br from-white via-slate-50/60 to-white flex-1 overflow-hidden relative">
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

                    {/* LEFT COLUMN: Student Photo & Emergency Summary */}
                    <div className="relative z-10 w-[74px] flex flex-col items-center justify-between flex-shrink-0">
                      {/* Photo with Course Ring */}
                      <div className="relative">
                        <div 
                          className={`w-[70px] h-[70px] rounded-xl overflow-hidden border-2 ${config.photoRing} shadow-sm bg-slate-100`}
                          style={{
                            borderColor: config.photoRingHex,
                            backgroundColor: '#f1f5f9',
                            WebkitPrintColorAdjust: 'exact',
                            printColorAdjust: 'exact'
                          }}
                        >
                          <img
                            src={getSafePhotoUrl(student.photo_url, 400)}
                            alt={student.first_name}
                            className="w-full h-full object-cover"
                            loading="eager"
                            decoding="sync"
                            referrerPolicy="no-referrer"
                            style={{
                              WebkitPrintColorAdjust: 'exact',
                              printColorAdjust: 'exact'
                            }}
                            onError={handleImageError}
                          />
                        </div>
                        <div 
                          className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[7px] font-black uppercase px-1 py-0.2 rounded-full border border-white shadow-sm flex items-center gap-0.5"
                          style={{
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            borderColor: '#ffffff',
                            WebkitPrintColorAdjust: 'exact',
                            printColorAdjust: 'exact'
                          }}
                        >
                          <ShieldCheck className="w-2 h-2" />
                          <span>ACTIVE</span>
                        </div>
                      </div>

                      {/* Emergency Mini Pill */}
                      {student.emergency_contact_phone ? (
                        <div 
                          className="w-full bg-slate-100 border border-slate-200 rounded p-1 text-center mt-1 shadow-inner"
                          style={{ backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                        >
                          <span className="text-[6px] font-black text-slate-400 uppercase tracking-wider block leading-none">
                            Emergency
                          </span>
                          <div className="text-[7px] text-slate-700 truncate mt-0.5 font-bold leading-none">
                            {student.emergency_contact_phone}
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="w-full bg-slate-100 border border-slate-200 rounded p-1 text-center mt-1 shadow-inner"
                          style={{ backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                        >
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
                    <div className="relative z-10 flex-1 flex flex-col justify-between min-w-0">
                      {/* Student Name & Academic Details */}
                      <div>
                        <h2 className="text-[12px] font-black text-slate-900 tracking-tight leading-tight">
                          {student.first_name} {student.middle_name ? student.middle_name[0] + '.' : ''} {student.last_name}
                        </h2>

                        {/* Trainee Qualification Pill */}
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span 
                            className={`px-1.5 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-wide border ${config.badgeBg} leading-none`}
                            style={{
                              backgroundColor: config.badgeHex,
                              color: config.badgeTextHex,
                              borderColor: config.badgeBorderHex,
                              WebkitPrintColorAdjust: 'exact',
                              printColorAdjust: 'exact'
                            }}
                          >
                            {config.ncBadge || '3 YEAR DIPLOMA'}
                          </span>
                        </div>

                        {/* 3 Year Diploma Program Specialization Banner */}
                        <div className="mt-1 flex items-center gap-1 text-[7px] font-extrabold text-slate-700 uppercase tracking-tight leading-tight">
                          <Award className={`w-2.5 h-2.5 ${config.accentColor} flex-shrink-0`} />
                          <span className="line-clamp-1">{student.course_strand || '3 Year Diploma Program'}</span>
                        </div>
                      </div>

                      {/* QR Code Barcode Box & ID Numbers */}
                      <div 
                        className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex items-center gap-2 shadow-inner"
                        style={{
                          backgroundColor: '#f8fafc',
                          borderColor: '#e2e8f0',
                          WebkitPrintColorAdjust: 'exact',
                          printColorAdjust: 'exact'
                        }}
                      >
                        {/* High-Resolution QR Code */}
                        <div 
                          className="p-0.5 bg-white rounded border border-slate-300 shadow-sm flex flex-col items-center flex-shrink-0"
                          style={{
                            backgroundColor: '#ffffff',
                            borderColor: '#cbd5e1',
                            WebkitPrintColorAdjust: 'exact',
                            printColorAdjust: 'exact'
                          }}
                        >
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
                  <div 
                    className={`${config.headerBg} text-white px-2.5 h-[18px] flex items-center justify-between text-[6.5px] font-medium tracking-wider uppercase flex-shrink-0 border-t border-amber-400/40`}
                    style={{
                      backgroundColor: config.headerHex,
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact'
                    }}
                  >
                    <span className="text-amber-300 font-bold truncate max-w-[190px]">{config.ncBadge}</span>
                    <span className="text-slate-200 font-mono flex-shrink-0">S.Y. 2024-2025</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Info Footer */}
        <div className="no-print px-4 sm:px-6 py-2.5 sm:py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-600 dark:text-slate-400 flex flex-col xs:flex-row items-center justify-between gap-2 text-center xs:text-left">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[10px] sm:text-[11px]">
            <FileText className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span>
              {printFormat === 'paper' 
                ? `Standard Paper (Letter / A4) with cut guidelines (${isPortrait ? 'Portrait' : 'Landscape'})` 
                : `${isPortrait ? '2⅛" × 3⅜" Portrait Card Printer' : '3" × 2" Card Printer'} (Edge-to-Edge)`}
            </span>
          </div>

          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-bold flex items-center gap-1 text-xs active:scale-95 transition disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isPrinting ? 'Preparing...' : 'Print Badge Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
