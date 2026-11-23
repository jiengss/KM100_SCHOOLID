import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  User, 
  GraduationCap, 
  Phone, 
  ShieldAlert,
  QrCode,
  Check
} from 'lucide-react';
import { COURSE_OPTIONS } from '../lib/mockData';
import { parseRegistrationFormText } from '../lib/formParser';
import Tesseract from 'tesseract.js';
import { Html5Qrcode } from 'html5-qrcode';

export default function RegistrationFormScannerModal({
  isOpen,
  onClose,
  onApplyData
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'camera', 'paste'
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  // Extracted Student Form Data
  const [extractedData, setExtractedData] = useState(null);

  // Camera State
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef(null);
  const [rawPastedText, setRawPastedText] = useState('');

  // Sample templates for quick testing
  const sampleFormText = `KM100 SKILLS AND TRAINING CENTER, INC.
OFFICIAL STUDENT ENROLLMENT & REGISTRATION FORM

First Name: Juan
Middle Name: Bautista
Last Name: Dela Cruz
Technology Course: Computer Engineering Technology (NC II)
Emergency Contact Person: Maria Dela Cruz (Mother)
Emergency Phone Number: +63 917 123 4567`;

  // Start / Stop camera stream when camera tab is chosen
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    try {
      setErrorMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn("Camera access failed:", err);
      setErrorMessage("Could not access camera. Please allow camera permissions or upload an image file instead.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Run OCR + QR extraction on an image
  const processImage = async (imageSource) => {
    setIsProcessing(true);
    setProgressStatus('Checking for form QR codes...');
    setProgressPercent(15);
    setErrorMessage('');

    let detectedText = '';

    // Step 1: Check if the form image contains a QR code with form metadata
    try {
      const qrScanner = new Html5Qrcode("form-qr-detector-hidden");
      // Check if imageSource is File or DataURL
      const qrResult = await qrScanner.scanFile(
        imageSource instanceof File ? imageSource : await (await fetch(imageSource)).blob(),
        false
      );
      if (qrResult) {
        detectedText = qrResult;
      }
      await qrScanner.clear();
    } catch {
      // No QR code found, proceed directly to OCR
    }

    // Step 2: If no QR code, run Tesseract OCR
    if (!detectedText) {
      try {
        setProgressStatus('Reading document text with Optical Character Recognition (OCR)...');
        setProgressPercent(30);

        const ocrResult = await Tesseract.recognize(
          imageSource,
          'eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setProgressPercent(30 + Math.round((m.progress || 0) * 60));
                setProgressStatus(`Recognizing document text: ${Math.round((m.progress || 0) * 100)}%`);
              }
            }
          }
        );
        detectedText = ocrResult?.data?.text || '';
      } catch (ocrErr) {
        console.error("OCR scanning error:", ocrErr);
        setErrorMessage("Optical character recognition failed. Please ensure the form is well-lit and legible.");
        setIsProcessing(false);
        return;
      }
    }

    // Step 3: Parse extracted fields
    setProgressStatus('Extracting student registration fields...');
    setProgressPercent(95);

    const parsed = parseRegistrationFormText(detectedText);
    setExtractedData(parsed);
    setIsProcessing(false);
    setProgressPercent(100);
  };

  // Capture freeze frame from video camera
  const handleCaptureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewImage(dataUrl);
    processImage(dataUrl);
  };

  // Handle uploaded form file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target.result);
      processImage(file);
    };
    reader.readAsDataURL(file);
  };

  // Handle manual paste text
  const handleParsePastedText = () => {
    if (!rawPastedText.trim()) {
      setErrorMessage("Please paste or type registration form text.");
      return;
    }
    setErrorMessage('');
    const parsed = parseRegistrationFormText(rawPastedText);
    setExtractedData(parsed);
  };

  const handleApplyToForm = () => {
    if (!extractedData) return;
    onApplyData({
      first_name: extractedData.first_name || '',
      middle_name: extractedData.middle_name || '',
      last_name: extractedData.last_name || '',
      course_strand: extractedData.course_strand || COURSE_OPTIONS[0],
      emergency_contact_name: extractedData.emergency_contact_name || '',
      emergency_contact_phone: extractedData.emergency_contact_phone || ''
    });
    onClose();
  };

  const handleResetScan = () => {
    setExtractedData(null);
    setPreviewImage(null);
    setErrorMessage('');
    setRawPastedText('');
    setProgressPercent(0);
    setProgressStatus('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      {/* Hidden container for QR scanning */}
      <div id="form-qr-detector-hidden" className="hidden" />

      <div className="w-full max-w-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[92vh] transition-all">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-darkbg-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
              <FileText className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                  Scan Registration Form
                </h3>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[9px] sm:text-[10px] font-black uppercase">
                  OCR Engine
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Auto-extracts Name, NC II Course, and Emergency Contacts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition flex-shrink-0 ml-2"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {!extractedData ? (
            <>
              {/* Scan Mode Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-darkbg-950 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setActiveTab('upload'); setErrorMessage(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition active:scale-95 ${
                    activeTab === 'upload'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('camera'); setErrorMessage(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition active:scale-95 ${
                    activeTab === 'camera'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('paste'); setErrorMessage(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition active:scale-95 ${
                    activeTab === 'paste'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste Text</span>
                </button>
              </div>

              {/* Progress Indicator */}
              {isProcessing && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-2 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span className="truncate">{progressStatus || 'Scanning form document...'}</span>
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-blue-200 dark:bg-blue-900 overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 1: UPLOAD DOCUMENT */}
              {activeTab === 'upload' && !isProcessing && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setPreviewImage(event.target.result);
                          processImage(file);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="flex flex-col items-center justify-center p-6 sm:p-10 rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/20 dark:bg-darkbg-950 dark:hover:bg-blue-950/10 cursor-pointer transition group text-center"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      Upload Filled Registration Form
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                      Take a photo of the printed enrollment sheet or select an image file (PNG, JPG, WEBP).
                    </p>
                    <span className="mt-3 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] sm:text-xs font-bold transition shadow-sm">
                      Browse Files
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: LIVE CAMERA SCANNER */}
              {activeTab === 'camera' && !isProcessing && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 h-60 xs:h-72 sm:h-80 md:aspect-video flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Form Reticle Overlay */}
                    <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-blue-400/60 rounded-xl sm:rounded-2xl pointer-events-none flex items-center justify-center">
                      <span className="px-2.5 py-1 rounded-full bg-slate-950/80 text-blue-300 font-bold text-[10px] sm:text-[11px] backdrop-blur-md">
                        Align Registration Form inside frame
                      </span>
                    </div>

                    {!isCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-950/90 text-white">
                        <Camera className="w-7 h-7 text-slate-400 mb-2" />
                        <p className="text-xs font-bold text-slate-300">Camera is initializing...</p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow"
                        >
                          Enable Camera
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center pt-1">
                    <button
                      type="button"
                      onClick={handleCaptureCamera}
                      disabled={!isCameraActive}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-blue-500/30 transition active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture & Extract Form Data</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: PASTE FORM TEXT */}
              {activeTab === 'paste' && !isProcessing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Paste Form Text / Online Response
                    </label>
                    <button
                      type="button"
                      onClick={() => setRawPastedText(sampleFormText)}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Load Sample Form Data</span>
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={rawPastedText}
                    onChange={(e) => setRawPastedText(e.target.value)}
                    placeholder={`First Name: Juan\nMiddle Name: Bautista\nLast Name: Dela Cruz\nTechnology Course: Computer Engineering Technology (NC II)\nEmergency Contact Person: Maria Dela Cruz\nEmergency Phone Number: +63 917 123 4567`}
                    className="w-full bg-slate-50 dark:bg-darkbg-950 border border-slate-300 dark:border-slate-800 rounded-2xl p-3 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParsePastedText}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/25 active:scale-95 flex items-center gap-1.5"
                    >
                      <span>Extract Form Fields</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          ) : (
            /* ======================================================== */
            /* SCANNED DATA REVIEW & CONFIRMATION                       */
            /* ======================================================== */
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Form Scanned Successfully! Review the extracted fields below:</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Scan Another</span>
                </button>
              </div>

              {/* Extracted Fields Form */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-darkbg-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* First Name */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                      <span>First Name</span>
                      {extractedData.first_name && <Check className="w-3 h-3 text-emerald-500" />}
                    </label>
                    <input
                      type="text"
                      value={extractedData.first_name}
                      onChange={(e) => setExtractedData({ ...extractedData, first_name: e.target.value })}
                      placeholder="e.g. Juan"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                  </div>

                  {/* Middle Name */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                      <span>Middle Name</span>
                      {extractedData.middle_name && <Check className="w-3 h-3 text-emerald-500" />}
                    </label>
                    <input
                      type="text"
                      value={extractedData.middle_name}
                      onChange={(e) => setExtractedData({ ...extractedData, middle_name: e.target.value })}
                      placeholder="e.g. Bautista"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                      <span>Last Name</span>
                      {extractedData.last_name && <Check className="w-3 h-3 text-emerald-500" />}
                    </label>
                    <input
                      type="text"
                      value={extractedData.last_name}
                      onChange={(e) => setExtractedData({ ...extractedData, last_name: e.target.value })}
                      placeholder="e.g. Dela Cruz"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                  </div>
                </div>

                {/* Technology Course */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                    <span>Technology Course (NC II Specialization)</span>
                    {extractedData.course_strand && <Check className="w-3 h-3 text-emerald-500" />}
                  </label>
                  <select
                    value={extractedData.course_strand}
                    onChange={(e) => setExtractedData({ ...extractedData, course_strand: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                  >
                    {COURSE_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Emergency Contact Person & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                      <span>Emergency Contact Person</span>
                      {extractedData.emergency_contact_name && <Check className="w-3 h-3 text-emerald-500" />}
                    </label>
                    <input
                      type="text"
                      value={extractedData.emergency_contact_name}
                      onChange={(e) => setExtractedData({ ...extractedData, emergency_contact_name: e.target.value })}
                      placeholder="Parent / Guardian Name"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                      <span>Emergency Phone Number</span>
                      {extractedData.emergency_contact_phone && <Check className="w-3 h-3 text-emerald-500" />}
                    </label>
                    <input
                      type="text"
                      value={extractedData.emergency_contact_phone}
                      onChange={(e) => setExtractedData({ ...extractedData, emergency_contact_phone: e.target.value })}
                      placeholder="+63 900 000 0000"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-darkbg-950/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Cancel
          </button>

          {extractedData ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetScan}
                className="px-3.5 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition active:scale-95"
              >
                Scan Another
              </button>
              <button
                type="button"
                onClick={handleApplyToForm}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Apply to Registration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
